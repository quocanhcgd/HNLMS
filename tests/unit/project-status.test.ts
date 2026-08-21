import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("project status dashboard", () => {
  it("has a valid status contract", () => {
    const status = JSON.parse(readFileSync("docs/project-status.json", "utf8"));
    expect(status.overall.total).toBe(175);
    expect(status.overall.done).toBe(23);
    expect(status.currentTask.id).toBe("T024");
    expect(status.currentTask.activity.length).toBeGreaterThan(10);
  });
  it("dashboard has live status runtime and refresh", () => {
    const html = readFileSync("docs/task-dashboard.html", "utf8");
    const runtime = readFileSync("docs/dashboard-app.js", "utf8");
    expect(html).toContain('src="./dashboard-app.js"');
    expect(html).toContain('id="currentTask"');
    expect(html).toContain('id="blockers"');
    expect(runtime).toContain('fetch(STATUS_URL + "?t=" + Date.now()');
    expect(runtime).toContain("setInterval(loadStatus, 15000)");
  });
});
