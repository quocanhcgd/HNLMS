import { describe, expect, it } from "vitest";
import { messages } from "../../apps/web/src/lib/i18n/messages";
import {
  adminNavigation,
  filterNavigation,
  getNavigationForWorkspace,
  isNavigationActive,
  lmsNavigation,
  mockNavigationContext,
  parentNavigation,
  studentNavigation,
  teacherNavigation,
  workspaceNavigation,
  type NavigationManifest,
} from "../../apps/web/src/lib/navigation/manifests";

const flatten = (items: readonly NavigationManifest[]): NavigationManifest[] =>
  items.flatMap((item) => [item, ...(item.children ? flatten(item.children) : [])]);

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
    const keys = Object.values(workspaceNavigation).flatMap((items) => flatten(items).map((item) => item.labelKey));
    for (const key of keys) {
      expect(messages.vi).toHaveProperty(key);
      expect(messages.en).toHaveProperty(key);
    }
  });

  it("keeps self-service portals out of admin navigation", () => {
    const adminHrefs = flatten(adminNavigation).map((item) => item.href);
    expect(adminHrefs).not.toContain("/student");
    expect(adminHrefs).not.toContain("/student/library");
    expect(adminHrefs).not.toContain("/parent");
    expect(adminHrefs).not.toContain("/parent/conversations");
    expect(adminHrefs).not.toContain("/teacher/content");
    expect(adminHrefs).toContain("/admin/academic/students");
    expect(adminHrefs).toContain("/admin/learning/content");
  });

  it("keeps teacher and student learning flows in business order", () => {
    const teacherHrefs = flatten(getNavigationForWorkspace("teacher")).map((item) => item.href);
    const studentHrefs = flatten(getNavigationForWorkspace("student")).map((item) => item.href);
    expect(teacherHrefs).toContain("/teacher/worklog");
    expect(studentHrefs).toEqual(expect.arrayContaining(["/student/schedule", "/student/scores", "/student/homework"]));
    expect(teacherHrefs.every((href) => href.startsWith("/teacher"))).toBe(true);
    expect(studentHrefs.every((href) => href.startsWith("/student"))).toBe(true);
  });

  it("uses workspace-specific navigation for teacher, student and parent", () => {
    expect(flatten(getNavigationForWorkspace("teacher")).map((item) => item.href)).toContain("/teacher/content");
    expect(flatten(getNavigationForWorkspace("student")).map((item) => item.href)).toContain("/student/library");
    expect(flatten(getNavigationForWorkspace("parent")).map((item) => item.href)).toContain("/parent/conversations");
    expect(flatten(teacherNavigation).every((item) => item.href.startsWith("/teacher"))).toBe(true);
    expect(flatten(studentNavigation).every((item) => item.href.startsWith("/student"))).toBe(true);
    expect(flatten(parentNavigation).every((item) => item.href.startsWith("/parent"))).toBe(true);
  });
});
