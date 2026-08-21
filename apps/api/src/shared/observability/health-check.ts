export type HealthCheckStatus = "up" | "down";

export interface HealthCheckResult {
  name: string;
  status: HealthCheckStatus;
  latency_ms: number;
  error?: string;
}

export interface HealthReport {
  status: "ok" | "degraded";
  checked_at: string;
  checks: HealthCheckResult[];
}

export interface HealthCheckDefinition {
  name: string;
  check: () => void | Promise<void>;
  timeoutMs?: number;
}

export class HealthCheckService {
  constructor(
    private readonly checks: readonly HealthCheckDefinition[],
    private readonly now: () => Date = () => new Date(),
  ) {
    const names = checks.map((check) => check.name);
    if (names.some((name) => !name.trim()) || new Set(names).size !== names.length) {
      throw new Error("health_check_names_invalid");
    }
  }

  async check(): Promise<HealthReport> {
    const checks = await Promise.all(this.checks.map((definition) => this.run(definition)));
    return {
      status: checks.every((result) => result.status === "up") ? "ok" : "degraded",
      checked_at: this.now().toISOString(),
      checks,
    };
  }

  private async run(definition: HealthCheckDefinition): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    try {
      await withTimeout(Promise.resolve().then(definition.check), definition.timeoutMs ?? 2_000);
      return { name: definition.name, status: "up", latency_ms: Date.now() - startedAt };
    } catch (error) {
      return {
        name: definition.name,
        status: "down",
        latency_ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "health_check_failed",
      };
    }
  }
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("health_check_timeout_invalid");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error("health_check_timeout")), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
