import { describe, expect, it } from "vitest";
import { HrmController } from "../../src/modules/hrm-teacher/hrm.controller.js";

describe("HrmController", () => {
  const controller = new HrmController();
  const headers = { "x-role": "hr_officer", "x-organization-id": "org-demo", "x-branch-ids": "b1" };
  it("lists and creates employees within the organization", () => {
    expect(controller.list(headers).data.length).toBeGreaterThan(0);
    const code = `GV-${Date.now()}`;
    expect(controller.create(headers, { employeeCode: code, name: "Người thử nghiệm", branchId: "b1" })).toMatchObject({ employeeCode: code, status: "invited" });
  });
  it("treats HR officers as organization-wide when no branch header is supplied", () => {
    const result = controller.list({ "x-role": "hr_officer", "x-organization-id": "org-demo" });
    expect(result.data.some((item) => item.branchId === "b2")).toBe(true);
  });
  it("allows branch managers only in their assigned branch", () => {
    const manager = { ...headers, "x-role": "branch_manager" };
    expect(controller.list(manager).data.every((item) => item.branchId === "b1")).toBe(true);
    expect(() => controller.create(manager, { employeeCode: `GV-${Date.now()}`, name: "Ngoài phạm vi", branchId: "b2" })).toThrow("branch_scope_denied");
  });
  it("supports invite to active transition", () => {
    const code = `GV-${Date.now()}`;
    const created = controller.create(headers, { employeeCode: code, name: "Ứng viên", branchId: "b1" });
    expect(controller.activate(headers, created.id).status).toBe("active");
  });
  it("keeps leave request and approval as separate transitions", () => {
    const requested = controller.requestLeave(headers, { employeeId: "GV-001", startsAt: "2026-09-10", endsAt: "2026-09-10", days: 1, reason: "Việc riêng" });
    expect(requested.status).toBe("requested");
    expect(controller.approveLeave(headers, requested.id).status).toBe("approved");
  });
  it.each(["payroll_officer", "finance_officer", "teacher"])("rejects unrelated role %s", (role) => expect(() => controller.list({ ...headers, "x-role": role })).toThrow("hrm_role_required"));
});
