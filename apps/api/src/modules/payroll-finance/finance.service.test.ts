import { describe, expect, it } from "vitest";
import {
  approveExpense,
  buildApprovalRoute,
  createBudget,
  createLedgerEntry,
  FinanceServiceError,
  markExpensePaid,
  submitExpense,
  updateLedgerEntry,
  validateDocumentRefs,
} from "./finance.service";

const actor = { userId: "u1", organizationId: "org1", branchIds: new Set(["branch1"]) };
const expense = {
  id: "x1",
  organizationId: "org1",
  branchId: "branch1",
  categoryId: "cat1",
  amount: 300,
  description: "Printer ink",
  documentRefs: ["receipt://r1"],
  status: "draft" as const,
  requestedByUserId: "u2",
  approvalStep: 0,
};

describe("branch finance workflow", () => {
  it("creates a scoped monthly budget and rejects invalid periods", () => {
    expect(createBudget(actor, { id: "b1", branchId: "branch1", period: "2026-08", amount: 1_000 })).toMatchObject({
      organizationId: "org1",
      spentAmount: 0,
    });
    expect(() => createBudget(actor, { id: "b2", branchId: "branch1", period: "08/2026", amount: 1 })).toThrow("period_must_be_yyyy_mm");
    expect(() => createBudget(actor, { id: "b3", branchId: "other", period: "2026-08", amount: 1 })).toThrow("branch_scope_denied");
  });

  it("validates documents, routes approval, and updates budget only when paid", () => {
    expect(buildApprovalRoute(300, [{ maxAmount: 500, approverRole: "branch_manager" }, { maxAmount: null, approverRole: "finance" }])).toHaveLength(2);
    const submitted = submitExpense(actor, expense);
    const approved = approveExpense(actor, submitted);
    const budget = createBudget(actor, { id: "b1", branchId: "branch1", period: "2026-08", amount: 500 });
    const paid = markExpensePaid(actor, approved, budget);
    expect(paid.request.status).toBe("paid");
    expect(paid.budget.spentAmount).toBe(300);
    expect(() => markExpensePaid(actor, { ...approved, amount: 300 }, paid.budget)).toThrow("budget_exceeded");
  });

  it("keeps ledger append-only and enforces scope and document requirements", () => {
    expect(createLedgerEntry(actor, { id: "l1", branchId: "branch1", categoryId: "c", cashAccountId: "a", kind: "income", amount: 100, description: " Tuition ", occurredAt: new Date() })).toMatchObject({
      organizationId: "org1",
      description: "Tuition",
      createdByUserId: "u1",
    });
    expect(() => createLedgerEntry(actor, { id: "l2", branchId: "branch2", categoryId: "c", cashAccountId: "a", kind: "expense", amount: 1, description: "x", occurredAt: new Date() })).toThrow("branch_scope_denied");
    expect(() => validateDocumentRefs([])).toThrow(FinanceServiceError);
    expect(() => updateLedgerEntry()).toThrow("ledger_entries_are_immutable");
  });
});
