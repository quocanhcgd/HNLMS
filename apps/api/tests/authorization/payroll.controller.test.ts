import { describe, expect, it } from "vitest";
import { PayrollController } from "../../src/modules/payroll-finance/payroll.controller.js";

describe("PayrollController", () => {
  const controller = new PayrollController();
  const headers = { "x-role": "payroll_officer", "x-organization-id": "org-demo" };
  it("lists periods and exposes calculated totals", async () => expect((await controller.list(headers)).data.find((item) => item.id === "p-2026-08")).toMatchObject({ status: "calculated", staff: 2 }));
  it("enforces the payroll workflow", async () => {
    const id = `test-${Date.now()}`;
    const created = await controller.create(headers, { period: `2099-${String((Date.now() % 12) + 1).padStart(2, "0")}` });
    expect(created.status).toBe("draft");
    const calculated = await controller.calculate(headers, created.id, { lines: [{ employeeId: "GV-001", salaryAmount: 1, hourlyRate: 1, hours: 1, classRate: 0, classes: 0, allowance: 0, deduction: 0, taxRate: 0, insuranceRate: 0 }] });
    expect(calculated.status).toBe("calculated");
    expect((await controller.approve(headers, created.id)).status).toBe("approved");
    expect((await controller.lock(headers, created.id)).status).toBe("locked");
    expect((await controller.publish(headers, created.id)).status).toBe("published");
    void id;
  });
  it.each(["finance_officer", "hr_officer"]) ("blocks payroll mutations for %s", async (role) => expect(controller.create({ ...headers, "x-role": role }, { period: "2098-01" })).rejects.toThrow("payroll_mutation_role_required"));
  it("blocks unrelated roles entirely", async () => expect(controller.create({ ...headers, "x-role": "teacher" }, { period: "2098-01" })).rejects.toThrow("payroll_role_required"));
  it("allows finance to read but keeps organization isolation", async () => expect((await controller.list({ "x-role": "finance_officer", "x-organization-id": "org-demo" })).data.length).toBeGreaterThan(0));
});
