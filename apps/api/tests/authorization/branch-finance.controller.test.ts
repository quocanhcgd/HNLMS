import { describe, expect, it } from "vitest";
import { BranchFinanceController } from "../../src/modules/payroll-finance/branch-finance.controller.js";

describe("BranchFinanceController", () => {
  const controller = new BranchFinanceController();
  const headers = { "x-role": "branch_manager", "x-user-id": "bm", "x-organization-id": "org-demo", "x-branch-ids": "b1" };
  it("lists only the assigned branch", async () => expect((await controller.list(headers)).data.map((row) => row.branchId)).toEqual(["b1"]));
  it("rejects another branch", async () => await expect(controller.list({ ...headers, "x-branch-ids": "b1" }, "b2")).rejects.toThrow("branch_scope_denied"));
  it("records a scoped expense", async () => expect(await controller.addLedger(headers, "b1", { kind: "expense", amount: 1000, description: "Văn phòng phẩm" })).toMatchObject({ branchId: "b1", expense: 64001000 }));
  it.each(["payroll_officer", "hr_officer", "teacher"])("rejects non-finance role %s", async (role) => {
    await expect(controller.list({ ...headers, "x-role": role })).rejects.toThrow("finance_role_required");
  });
});
