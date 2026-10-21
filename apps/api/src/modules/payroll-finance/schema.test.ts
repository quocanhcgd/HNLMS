import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { budgets, cashAccounts, expenseRequests, financeCategories, financeEntries, payrollLines, payrollPeriods, payslips, receipts } from "./schema";

describe("T107 finance entity contract", () => {
  it("defines the six branch-scoped finance entities", () => {
    expect([
      getTableName(budgets),
      getTableName(financeCategories),
      getTableName(cashAccounts),
      getTableName(financeEntries),
      getTableName(expenseRequests),
      getTableName(receipts),
    ]).toEqual([
      "finance_budgets",
      "finance_categories",
      "finance_cash_accounts",
      "finance_entries",
      "finance_expense_requests",
      "finance_receipts",
    ]);
  });

  it("keeps organization and branch ownership on transactional tables", () => {
    for (const table of [budgets, cashAccounts, financeEntries, expenseRequests, receipts]) {
      expect(table.organizationId).toBeDefined();
      expect(table.branchId).toBeDefined();
    }
    expect(financeCategories.organizationId).toBeDefined();
  });

  it("defines payroll period, line, payslip and calculation snapshot links", () => {
    expect([getTableName(payrollPeriods), getTableName(payrollLines), getTableName(payslips)]).toEqual([
      "payroll_periods",
      "payroll_lines",
      "payslips",
    ]);
    expect(payrollPeriods.calculationVersion).toBeDefined();
    expect(payrollPeriods.lockedAt).toBeDefined();
    expect(payrollPeriods.publishedAt).toBeDefined();
    expect(payrollLines.periodId).toBeDefined();
    expect(payrollLines.employeeId).toBeDefined();
    expect(payrollLines.calculationSnapshot).toBeDefined();
    expect(payslips.periodId).toBeDefined();
    expect(payslips.lineId).toBeDefined();
    expect(payslips.publishedAt).toBeDefined();
  });
});
