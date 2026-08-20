import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

describe("CI workflow", () => {
  it("runs all required quality gates", () => {
    for (const command of [
      "npm ci",
      "npm run format:check",
      "npm run lint",
      "npm run typecheck",
      "npm test",
      "npm run test:e2e",
    ]) {
      expect(workflow).toContain(command);
    }
  });

  it("builds and checksums an immutable artifact", () => {
    expect(workflow).toContain("npm run build --workspaces --if-present");
    expect(workflow).toContain("sha256sum");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("if-no-files-found: error");
  });

  it("uses least-privilege repository permissions", () => {
    expect(workflow).toContain("permissions:\n  contents: read");
  });
});
