import { describe, expect, it } from "vitest";
import { ConsultantSelfServiceError, ConsultantSelfServiceService } from "./consultant-self-service.service";

const actor = { userId: "consultant-demo", organizationId: "org-demo", role: "consultant" };

describe("ConsultantSelfServiceService", () => {
  it("isolates personal records and enforces consultant role", () => {
    const service = new ConsultantSelfServiceService();
    expect(service.listWork(actor)).toHaveLength(3);
    expect(() => service.listWork({ ...actor, role: "student" })).toThrowError(ConsultantSelfServiceError);
  });

  it("enforces work transition order and records adjustment requests", () => {
    const service = new ConsultantSelfServiceService();
    expect(service.transitionWork(actor, "work-1", "start").status).toBe("Đang diễn ra");
    expect(service.transitionWork(actor, "work-1", "end").status).toBe("Đã hoàn tất");
    expect(service.transitionWork(actor, "work-3", "adjust", "Quên chấm công").status).toBe("Chờ điều chỉnh");
    expect(() => service.transitionWork(actor, "work-2", "start")).toThrowError(ConsultantSelfServiceError);
  });

  it("creates and cancels only mutable leave requests", () => {
    const service = new ConsultantSelfServiceService();
    const leave = service.createLeave(actor, { type: "Nghỉ phép năm", from: "04/09/2026", to: "04/09/2026", days: 1, reason: "Việc gia đình" });
    expect(service.cancelLeave(actor, leave.id).status).toBe("Đã hủy");
    expect(() => service.cancelLeave(actor, "leave-2")).toThrowError(ConsultantSelfServiceError);
  });

  it("returns personal payroll with CRM commission sources", () => {
    const service = new ConsultantSelfServiceService();
    const payroll = service.getPayroll(actor, "2026-08");
    expect(payroll.commissions).toHaveLength(3);
    expect(payroll.commissions.every((row) => row.userId === actor.userId)).toBe(true);
  });

  it("allows an admission manager to use isolated personal services", () => {
    const service = new ConsultantSelfServiceService();
    const manager = { userId: "admission-manager-demo", organizationId: "org-demo", role: "admission_manager" };
    expect(service.listWork(manager)).toHaveLength(3);
    expect(service.getPayroll(manager, "2026-08").commissions.every((row) => row.userId === manager.userId)).toBe(true);
  });

  it("allows a branch manager to use personal services without CRM commission data", () => {
    const service = new ConsultantSelfServiceService();
    const manager = { userId: "branch-manager-demo", organizationId: "org-demo", role: "branch_manager" };
    expect(service.listWork(manager).some((row) => row.activity.includes("vận hành cơ sở"))).toBe(true);
    expect(service.getPayroll(manager, "2026-08").commissions).toHaveLength(0);
  });
});
