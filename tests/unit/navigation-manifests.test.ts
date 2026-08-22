import { describe, expect, it } from "vitest";
import { messages } from "../../apps/web/src/lib/i18n/messages";
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

  it("has translated labels for every sidebar item", () => {
    const keys = lmsNavigation.flatMap((item) => [
      item.labelKey,
      ...(item.children?.map((child) => child.labelKey) ?? []),
    ]);
    for (const key of keys) {
      expect(messages.vi).toHaveProperty(key);
      expect(messages.en).toHaveProperty(key);
    }
  });
});
