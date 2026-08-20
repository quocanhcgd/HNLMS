import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("platform shell composition", () => {
  it("keeps tenant content separate from control-plane shell", () => {
    const page = readFileSync("apps/web/src/app/(platform)/platform/page.tsx", "utf8");
    const shell = readFileSync("apps/web/src/components/shell/platform-shell.tsx", "utf8");
    expect(page).not.toContain('className="topbar"');
    expect(shell).toContain("data-platform-shell");
    expect(shell).toContain("Platform navigation");
    expect(shell).toContain("platformFooter");
  });
});
