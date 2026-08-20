import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("public shell composition", () => {
  it("keeps public navigation out of the landing page", () => {
    const page = readFileSync("apps/web/src/app/(public)/page.tsx", "utf8");
    const shell = readFileSync("apps/web/src/components/shell/public-shell.tsx", "utf8");
    expect(page).not.toContain('className="publicNav"');
    expect(shell).toContain("data-public-shell");
    expect(shell).toContain("publicFooter");
  });
});
