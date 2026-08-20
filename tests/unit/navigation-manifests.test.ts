import { describe, expect, it } from "vitest";
import {
  filterNavigation,
  isNavigationActive,
  lmsNavigation,
  mockNavigationContext,
} from "../../apps/web/src/lib/navigation/manifests";

describe("LMS navigation manifests", () => {
  it("filters by effective module and keeps visible parents with children", () => {
    const items = filterNavigation(lmsNavigation, {
      ...mockNavigationContext,
      effectiveModules: new Set(["academic"]),
    });
    expect(items.some((item) => item.key === "academic")).toBe(true);
    expect(items.some((item) => item.key === "admission")).toBe(false);
  });
  it("resolves active parent and child routes", () => {
    const academic = lmsNavigation.find((item) => item.key === "academic")!;
    expect(isNavigationActive("/admin/academic/classes", academic)).toBe(true);
    expect(isNavigationActive("/admin", academic)).toBe(false);
  });
});
