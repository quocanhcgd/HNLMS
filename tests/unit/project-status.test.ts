import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("project status dashboard", () => {
  it("matches task source-of-truth", () => {
    const status = JSON.parse(readFileSync("docs/project-status.json", "utf8"));
    const tasks = readFileSync("specs/001-lms-multi-branch/tasks.md", "utf8");
    const matches = [...tasks.matchAll(/^- \[([ xX])\] T\d{3}/gm)];
    const total = matches.length;
    const done = matches.filter((match) => match[1].toLowerCase() === "x").length;
    expect(status.overall).toMatchObject({ total, done });
    expect(status.currentTask.id).toMatch(/^(T\d{3}|WAVE\d+)$/);
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
