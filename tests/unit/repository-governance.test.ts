import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository governance", () => {
  it("defines ownership, protection and dependency automation", () => {
    const owners = readFileSync(".github/CODEOWNERS", "utf8");
    const protection = readFileSync(".github/branch-protection.md", "utf8");
    const dependabot = readFileSync(".github/dependabot.yml", "utf8");
    const renovate = readFileSync("renovate.json", "utf8");
    expect(owners).toContain("@quocanhcgd");
    expect(protection).toContain("Quality gates");
    expect(protection).toContain("block force-push");
    expect(dependabot).toContain("package-ecosystem: npm");
    expect(renovate).toContain("github-actions");
  });

  it("defines private security reporting and release convention", () => {
    const security = readFileSync(".github/SECURITY.md", "utf8");
    const release = readFileSync("docs/operations/release-versioning.md", "utf8");
    expect(security).toContain("Private vulnerability reporting");
    expect(security).toContain("synthetic data");
    expect(release).toContain("MAJOR.MINOR.PATCH");
    expect(release).toContain("SHA-256");
    expect(release).toContain("expand/migrate/contract");
  });
});
