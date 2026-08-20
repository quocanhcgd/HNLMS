import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("route state boundaries", () => {
  it("provides loading, error and not-found files", () => {
    expect(read("apps/web/src/app/loading.tsx")).toContain("Loader");
    expect(read("apps/web/src/app/error.tsx")).toContain("reset");
    expect(read("apps/web/src/app/not-found.tsx")).toContain("Về trang chủ");
  });

  it("declares product-specific metadata", () => {
    expect(read("apps/web/src/app/(public)/layout.tsx")).toContain("HN Learning");
    expect(read("apps/web/src/app/(platform)/layout.tsx")).toContain("Control Plane");
    expect(read("apps/web/src/app/admin/layout.tsx")).toContain("LMS Application");
  });
});
