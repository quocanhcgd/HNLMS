import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("Next.js product route boundaries", () => {
  it("defines public, platform and LMS nested layouts", () => {
    expect(read("apps/web/src/app/(public)/layout.tsx")).toContain('space="public"');
    expect(read("apps/web/src/app/(platform)/layout.tsx")).toContain('space="platform"');
    expect(read("apps/web/src/app/admin/layout.tsx")).toContain('space="lms"');
  });

  it("does not introduce React Router", () => {
    for (const path of [
      "apps/web/package.json",
      "apps/web/src/app/(public)/layout.tsx",
      "apps/web/src/app/(platform)/layout.tsx",
      "apps/web/src/app/admin/layout.tsx",
    ]) {
      expect(read(path)).not.toContain("react-router");
    }
  });
});
