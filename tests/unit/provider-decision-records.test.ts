import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const directory = "docs/adr/providers";
const records = readdirSync(directory).filter((file) => file.endsWith(".md"));

describe("provider decision records", () => {
  it("covers all required provider capabilities and sandbox controls", () => {
    for (const capability of ["payment", "meeting", "accounting-erp", "ai", "object-storage", "video-transcoding"]) {
      expect(records).toContain(`${capability}.md`);
    }
    const shared = readFileSync(`${directory}/README.md`, "utf8");
    for (const term of ["secret manager", "synthetic", "idempotency", "tenant/branch", "fallback", "rotate"]) {
      expect(shared.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  it("does not contain real credential assignments", () => {
    const content = records.map((file) => readFileSync(`${directory}/${file}`, "utf8")).join("\n");
    expect(content).not.toMatch(/(?:sk|pk)_(?:live|prod)_[A-Za-z0-9]{12,}/i);
    expect(content).not.toMatch(/(?:password|secret|token)\s*[:=]\s*[^`\n]{12,}/i);
  });
});
