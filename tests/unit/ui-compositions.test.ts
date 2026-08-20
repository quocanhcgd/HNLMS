import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("shared Mantine UI compositions", () => {
  it("exports the shared primitive wrappers", () => {
    const index = read("apps/web/src/components/ui/index.ts");
    for (const name of ["UiButton", "UiTextInput", "UiSelect", "UiBadge", "UiTable", "UiModal", "PageToolbar"]) {
      expect(index).toContain(name);
    }
  });

  it("uses wrappers for the lead list controls", () => {
    const leads = read("apps/web/src/app/admin/leads/page.tsx");
    expect(leads).toContain("UiTextInput");
    expect(leads).toContain("UiSelect");
    expect(leads).toContain("UiTable");
    expect(leads).not.toContain("<TextInput");
    expect(leads).not.toContain("<Select");
  });
});
