import { describe, expect, it } from "vitest";
import { BillingController } from "../../src/modules/payroll-finance/billing.controller.js";

describe("BillingController", () => {
  const controller = new BillingController();
  const headers = { "x-role": "finance_officer", "x-organization-id": "org-demo" };
  it("lists, creates and marks an invoice paid", async () => {
    const number = `INV-${Date.now()}`;
    expect((await controller.list(headers)).data.length).toBeGreaterThan(0);
    const created = await controller.create(headers, { number, student: "Học viên thử", amount: 120000, due: "2026-09-30", branchId: "b1" });
    expect(created.status).toBe("pending");
    expect((await controller.markPaid(headers, created.id)).status).toBe("paid");
  });
  it("enforces branch scope", async () => expect((await controller.list({ "x-role": "branch_manager", "x-organization-id": "org-demo", "x-branch-ids": "b2" })).data.every((item) => item.branchId === "b2")).toBe(true));
  it("requires an explicit branch when creating an organization invoice", async () => await expect(controller.create(headers, { number: `INV-${Date.now()}-missing-branch`, student: "Thiếu cơ sở", amount: 1000, due: "2026-09-30" })).rejects.toThrow("invoice_fields_required"));
  it.each(["payroll_officer", "hr_officer", "teacher"])("rejects unrelated role %s", async (role) => expect(controller.list({ ...headers, "x-role": role })).rejects.toThrow("finance_role_required"));
});
