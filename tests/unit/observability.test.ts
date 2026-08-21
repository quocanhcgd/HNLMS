import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  HealthCheckService,
  MetricsRegistry,
  StructuredLogger,
  type StructuredLogEntry,
} from "../../apps/api/src/shared/observability";

describe("structured observability foundation", () => {
  it("emits JSON-ready structured entries with correlation IDs and redacted secrets", () => {
    const entries: StructuredLogEntry[] = [];
    const logger = new StructuredLogger({
      service: "api",
      now: () => new Date("2026-08-21T00:00:00.000Z"),
      sink: { write: (entry) => entries.push(entry) },
    });

    logger.info("request completed", {
      correlation_id: "corr-123",
      route: "/health",
      authorization: "Bearer private",
      nested: { apiKey: "private", result: "ok" },
      failure: new Error("database unavailable"),
    });

    expect(entries).toEqual([
      {
        timestamp: "2026-08-21T00:00:00.000Z",
        level: "info",
        service: "api",
        message: "request completed",
        correlation_id: "corr-123",
        route: "/health",
        authorization: "[REDACTED]",
        nested: { apiKey: "[REDACTED]", result: "ok" },
        failure: { name: "Error", message: "database unavailable" },
      },
    ]);
  });

  it("records validated counter and gauge samples in Prometheus text format", () => {
    const metrics = new MetricsRegistry();
    const requests = metrics.counter({
      name: "hnlms_http_requests_total",
      help: "Completed HTTP requests",
      labelNames: ["method", "status"],
    });
    const queueDepth = metrics.gauge({ name: "hnlms_queue_depth", help: "Queued jobs" });

    requests.inc({ method: "GET", status: 200 });
    requests.inc({ method: "GET", status: 200 }, 2);
    queueDepth.set({}, 4);

    expect(metrics.renderPrometheus()).toBe(
      "# HELP hnlms_http_requests_total Completed HTTP requests\n" +
        "# TYPE hnlms_http_requests_total counter\n" +
        'hnlms_http_requests_total{method="GET",status="200"} 3\n' +
        "# HELP hnlms_queue_depth Queued jobs\n" +
        "# TYPE hnlms_queue_depth gauge\n" +
        "hnlms_queue_depth 4\n",
    );
    expect(() => requests.inc({ method: "GET" })).toThrow("metric_labels_mismatch");
    expect(() => metrics.counter({ name: "hnlms_queue_depth", help: "Duplicate" })).toThrow(
      "metric_already_registered:hnlms_queue_depth",
    );
  });

  it("reports dependency failures and bounds checks by timeout", async () => {
    vi.useFakeTimers();
    const health = new HealthCheckService([
      { name: "database", check: async () => undefined },
      { name: "queue", check: async () => Promise.reject(new Error("redis unavailable")) },
      { name: "provider", check: async () => new Promise<void>(() => undefined), timeoutMs: 10 },
    ]);

    const reportPromise = health.check();
    await vi.advanceTimersByTimeAsync(10);
    await expect(reportPromise).resolves.toMatchObject({
      status: "degraded",
      checks: [
        { name: "database", status: "up" },
        { name: "queue", status: "down", error: "redis unavailable" },
        { name: "provider", status: "down", error: "health_check_timeout" },
      ],
    });
    vi.useRealTimers();
  });

  it("keeps health and metrics deployment routes local, correlated, and startup-checked", () => {
    const nginx = requireText("infra/nginx/hn-lms.conf");
    expect(nginx).toContain("location = /healthz");
    expect(nginx).toContain("location = /readyz");
    expect(nginx).toContain("location = /metrics");
    expect(nginx).toContain("allow 127.0.0.1;");
    expect(nginx).toContain("deny all;");
    expect(nginx).toContain("X-Correlation-Id $request_id");

    const apiUnit = requireText("infra/systemd/hn-lms-api.service");
    expect(apiUnit).toContain("ExecStartPost=/bin/sh -c");
    expect(apiUnit).toContain("/usr/bin/curl --fail --silent --show-error --max-time 2 http://127.0.0.1:4000/health");
    expect(apiUnit).toContain('[ "$i" -ge 10 ] && exit 1');
    expect(apiUnit).toContain("Environment=LOG_FORMAT=json");
    expect(apiUnit).toContain("Environment=METRICS_ENABLED=true");
    expect(apiUnit).toContain("SyslogIdentifier=hn-lms-api");
  });
});

function requireText(path: string): string {
  return readFileSync(path, "utf8");
}
