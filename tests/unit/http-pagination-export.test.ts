import { describe, expect, it } from "vitest";
import { createExportJob, paginate, transitionExportJob } from "../../apps/api/src/shared/http";

describe("HTTP pagination", () => {
  it("uses bounded pages and an opaque continuation cursor", () => {
    const first = paginate(["a", "b", "c"], { limit: 2 });
    expect(first).toEqual({
      items: ["a", "b"],
      page_info: { limit: 2, next_cursor: expect.any(String), has_more: true },
    });
    expect(paginate(["a", "b", "c"], { limit: 2, cursor: first.page_info.next_cursor })).toEqual({
      items: ["c"],
      page_info: { limit: 2, next_cursor: null, has_more: false },
    });
  });

  it("rejects invalid limits and cursors", () => {
    expect(() => paginate([], { limit: 0 })).toThrow("invalid_page_limit");
    expect(() => paginate([], { limit: 101 })).toThrow("invalid_page_limit");
    expect(() => paginate([], { cursor: "not-a-cursor" })).toThrow("invalid_pagination_cursor");
  });
});

describe("asynchronous export jobs", () => {
  it("creates and progresses an export job with ISO timestamps", () => {
    const queued = createExportJob({
      organizationId: "org-1",
      requestedBy: "user-1",
      resource: "reports.enrollment",
      now: new Date("2026-08-21T01:00:00Z"),
    });
    expect(queued).toMatchObject({
      organization_id: "org-1",
      requested_by: "user-1",
      resource: "reports.enrollment",
      status: "queued",
      created_at: "2026-08-21T01:00:00.000Z",
    });

    const running = transitionExportJob(queued, "running", { now: new Date("2026-08-21T01:01:00Z") });
    const completed = transitionExportJob(running, "completed", {
      now: new Date("2026-08-21T01:02:00Z"),
      downloadUrl: "https://download.example/exports/report.csv",
    });
    expect(completed).toMatchObject({
      status: "completed",
      updated_at: "2026-08-21T01:02:00.000Z",
      download_url: "https://download.example/exports/report.csv",
    });
  });

  it("enforces valid state transitions and terminal immutability", () => {
    const job = createExportJob({ organizationId: "org-1", requestedBy: "user-1", resource: "reports" });
    expect(() => transitionExportJob(job, "completed")).toThrow("invalid_export_job_transition");
    expect(() => transitionExportJob(job, "failed")).toThrow("export_error_code_required");
    const completed = transitionExportJob(transitionExportJob(job, "running"), "completed", { downloadUrl: "url" });
    expect(() => transitionExportJob(completed, "running")).toThrow("export_job_terminal");
  });
});
