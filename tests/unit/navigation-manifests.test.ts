import { describe, expect, it } from "vitest";
import { messages } from "../../apps/web/src/lib/i18n/messages";
import {
  adminNavigation,
  filterNavigation,
  getNavigationForWorkspace,
  isNavigationPathAllowed,
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
    const teacherHome = teacherNavigation.find((item) => item.key === "teacherHome")!;
    expect(isNavigationActive("/teacher/worklog", teacherHome)).toBe(false);
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
    expect(flatten(getNavigationForWorkspace("teacher")).map((item) => item.href)).toContain("/teacher/assessment/entrance");
    expect(flatten(getNavigationForWorkspace("teacher")).map((item) => item.href)).toContain("/teacher/assessment/mock");
    expect(flatten(getNavigationForWorkspace("student")).map((item) => item.href)).toContain("/student/library");
    expect(flatten(getNavigationForWorkspace("parent")).map((item) => item.href)).toContain("/parent/conversations");
    expect(flatten(teacherNavigation).every((item) => item.href.startsWith("/teacher"))).toBe(true);
    expect(flatten(studentNavigation).every((item) => item.href.startsWith("/student"))).toBe(true);
    expect(flatten(parentNavigation).every((item) => item.href.startsWith("/parent"))).toBe(true);
  });

  it("groups teacher navigation by the teacher workspace sections", () => {
    expect(teacherNavigation.map((item) => item.section)).toEqual([
      "overview",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "personal",
      "personal",
      "personal",
      "information",
      "information",
      "settings",
    ]);
    expect(flatten(teacherNavigation).map((item) => item.href)).toContain("/teacher/settings");
    expect(flatten(teacherNavigation).map((item) => item.href)).toContain("/teacher/internal");
  });

  it("groups student navigation into the same five business sections", () => {
    expect(studentNavigation.map((item) => item.section)).toEqual([
      "overview",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "learning",
      "information",
      "personal",
      "settings",
    ]);
    expect(flatten(studentNavigation).map((item) => item.href)).toEqual(
      expect.arrayContaining(["/student/messages", "/student/billing", "/student/settings"]),
    );
  });

  it("gives consultants a focused overview and admission workspace", () => {
    const consultantNavigation = getNavigationForWorkspace("admin", {
      ...mockNavigationContext,
      role: "consultant",
    });
    expect(consultantNavigation.map((item) => item.section)).toEqual(["overview", "admission", "personal", "personal", "personal", "information", "information", "settings"]);
    expect(flatten(consultantNavigation).map((item) => item.href)).toEqual(expect.arrayContaining([
      "/admin",
      "/admin/admission",
      "/admin/leads",
      "/admin/my-work",
      "/admin/my-leave",
      "/admin/my-payroll",
      "/admin/communication",
      "/admin/communication/notifications",
      "/admin/account",
    ]));
  });

  it("gives admission managers pipeline controls plus internal and personal staff services", () => {
    const managerNavigation = getNavigationForWorkspace("admin", {
      ...mockNavigationContext,
      role: "admission_manager",
    });
    const hrefs = flatten(managerNavigation).map((item) => item.href);
    expect(hrefs).toEqual(expect.arrayContaining([
      "/admin",
      "/admin/admission",
      "/admin/leads",
      "/admin/communication",
      "/admin/communication/notifications",
      "/admin/my-work",
      "/admin/my-leave",
      "/admin/my-payroll",
      "/admin/account",
    ]));
    expect(hrefs).not.toEqual(expect.arrayContaining(["/admin/payroll", "/admin/hrm", "/admin/finance"]));
    expect(managerNavigation.filter((item) => item.section === "information").map((item) => item.labelKey)).toEqual(["communicationCenter", "notificationInbox"]);
  });

  it("groups the branch manager workspace by operational responsibility", () => {
    const branchNavigation = getNavigationForWorkspace("admin", {
      ...mockNavigationContext,
      role: "branch_manager",
    });
    const items = flatten(branchNavigation);
    expect(branchNavigation.map((item) => item.section)).toEqual([
      "overview", "admission", "personal", "personal", "personal", "operations", "operations", "operations", "information", "information", "operations", "operations", "operations", "settings",
    ]);
    expect(items.map((item) => item.href)).toEqual(expect.arrayContaining([
      "/admin/academic/classes",
      "/admin/branch-operations",
      "/admin/academic/students",
      "/admin/finance/branch-finance",
      "/admin/my-work",
      "/admin/my-leave",
      "/admin/my-payroll",
      "/admin/account",
    ]));
  });

  it("keeps assessment review routes teacher-only and self-service routes role-specific", () => {
    const teacherAssessmentKeys = teacherNavigation
      .filter((item) => item.href.includes("/teacher/assessment") || item.href === "/teacher/competency" || item.href === "/teacher/english")
      .map((item) => item.key);
    expect(teacherAssessmentKeys).toEqual(
      expect.arrayContaining(["teacherEntranceAssessment", "teacherMockAssessment", "teacherCompetency"]),
    );
    expect(teacherNavigation.filter((item) => teacherAssessmentKeys.includes(item.key)).every((item) => item.roles?.includes("teacher"))).toBe(true);
    expect(teacherNavigation.filter((item) => teacherAssessmentKeys.includes(item.key)).some((item) => item.roles?.includes("teaching_assistant"))).toBe(false);
    expect(flatten(studentNavigation).every((item) => item.roles?.every((role) => role === "student"))).toBe(true);
    expect(flatten(parentNavigation).every((item) => item.roles?.every((role) => role === "parent"))).toBe(true);
  });

  it("enforces route access for finance, payroll and HR roles", () => {
    const financeContext = { ...mockNavigationContext, role: "finance_officer" };
    const payrollContext = { ...mockNavigationContext, role: "payroll_officer" };
    const hrContext = { ...mockNavigationContext, role: "hr_officer" };

    expect(isNavigationPathAllowed("/admin/finance", "admin", financeContext)).toBe(true);
    expect(isNavigationPathAllowed("/admin/finance/branch-finance", "admin", financeContext)).toBe(true);
    expect(isNavigationPathAllowed("/admin/payroll", "admin", financeContext)).toBe(false);
    expect(isNavigationPathAllowed("/admin/payroll", "admin", payrollContext)).toBe(true);
    expect(isNavigationPathAllowed("/admin/hrm", "admin", payrollContext)).toBe(false);
    expect(isNavigationPathAllowed("/admin/hrm", "admin", hrContext)).toBe(true);
    expect(isNavigationPathAllowed("/admin/account", "admin", financeContext)).toBe(true);
  });
});
