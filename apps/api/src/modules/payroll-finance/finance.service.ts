export type FinanceActor = {
  userId: string;
  organizationId: string;
  /** Missing means organization-wide access; otherwise only these branches are visible. */
  branchIds?: ReadonlySet<string>;
};

export type BudgetRecord = {
  id: string;
  organizationId: string;
  branchId: string;
  period: string;
  amount: number;
  spentAmount: number;
};

export type LedgerEntryInput = {
  id: string;
  branchId: string;
  categoryId: string;
  cashAccountId: string;
  kind: "income" | "expense";
  amount: number;
  description: string;
  occurredAt: Date;
  referenceId?: string;
};

export type LedgerEntry = LedgerEntryInput & { organizationId: string; createdByUserId: string };

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";
export type FinanceExpenseRequest = {
  id: string;
  organizationId: string;
  branchId: string;
  categoryId: string;
  amount: number;
  description: string;
  documentRefs: string[];
  status: ExpenseStatus;
  requestedByUserId: string;
  approvedByUserId?: string;
  approvalStep: number;
};

export type ApprovalRule = { maxAmount: number | null; approverRole: string };
export type ApprovalRoute = { step: number; approverRole: string; status: "pending" | "approved" }[];

export type FinanceErrorCode =
  | "forbidden"
  | "invalid_amount"
  | "invalid_period"
  | "invalid_document"
  | "invalid_transition"
  | "immutable_entry"
  | "budget_exceeded";

export class FinanceServiceError extends Error {
  constructor(public readonly code: FinanceErrorCode, message: string = code) {
    super(message);
    this.name = "FinanceServiceError";
  }
}

function assertBranch(actor: FinanceActor, organizationId: string, branchId: string) {
  if (actor.organizationId !== organizationId || (actor.branchIds && !actor.branchIds.has(branchId))) {
    throw new FinanceServiceError("forbidden", "branch_scope_denied");
  }
}

function assertAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new FinanceServiceError("invalid_amount", "amount_must_be_positive_integer");
  }
}

export function validateBudgetPeriod(period: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new FinanceServiceError("invalid_period", "period_must_be_yyyy_mm");
  }
  return period;
}

export function validateDocumentRefs(refs: readonly string[]): string[] {
  if (!Array.isArray(refs) || refs.length === 0 || refs.length > 20) {
    throw new FinanceServiceError("invalid_document", "at_least_one_document_required");
  }
  const normalized = refs.map((ref) => ref.trim());
  if (normalized.some((ref) => !ref || ref.length > 500)) {
    throw new FinanceServiceError("invalid_document", "document_reference_invalid");
  }
  return [...new Set(normalized)];
}

export function createBudget(actor: FinanceActor, input: Omit<BudgetRecord, "organizationId" | "spentAmount">): BudgetRecord {
  assertBranch(actor, actor.organizationId, input.branchId);
  validateBudgetPeriod(input.period);
  assertAmount(input.amount);
  return { ...input, organizationId: actor.organizationId, spentAmount: 0 };
}

export function buildApprovalRoute(amount: number, rules: readonly ApprovalRule[]): ApprovalRoute {
  assertAmount(amount);
  if (!rules.length) throw new FinanceServiceError("invalid_transition", "approval_route_missing");
  const sorted = [...rules].sort((a, b) => (a.maxAmount ?? Number.MAX_SAFE_INTEGER) - (b.maxAmount ?? Number.MAX_SAFE_INTEGER));
  const selected = sorted.filter((rule) => rule.maxAmount === null || amount <= rule.maxAmount);
  const route = (selected.length ? selected : [sorted[sorted.length - 1]]).map((rule, index) => ({
    step: index + 1,
    approverRole: rule.approverRole,
    status: "pending" as const,
  }));
  return route;
}

export function submitExpense(actor: FinanceActor, request: FinanceExpenseRequest): FinanceExpenseRequest {
  assertBranch(actor, request.organizationId, request.branchId);
  if (request.status !== "draft") throw new FinanceServiceError("invalid_transition", "expense_not_draft");
  if (!request.description.trim()) throw new FinanceServiceError("invalid_document", "description_required");
  assertAmount(request.amount);
  return { ...request, documentRefs: validateDocumentRefs(request.documentRefs), status: "submitted", approvalStep: 1 };
}

export function approveExpense(actor: FinanceActor, request: FinanceExpenseRequest): FinanceExpenseRequest {
  assertBranch(actor, request.organizationId, request.branchId);
  if (request.status !== "submitted") throw new FinanceServiceError("invalid_transition", "expense_not_submitted");
  if (!request.approvedByUserId) return { ...request, status: "approved", approvedByUserId: actor.userId };
  throw new FinanceServiceError("invalid_transition", "expense_already_approved");
}

export function rejectExpense(actor: FinanceActor, request: FinanceExpenseRequest): FinanceExpenseRequest {
  assertBranch(actor, request.organizationId, request.branchId);
  if (request.status !== "submitted") throw new FinanceServiceError("invalid_transition", "expense_not_submitted");
  return { ...request, status: "rejected" };
}

export function markExpensePaid(actor: FinanceActor, request: FinanceExpenseRequest, budget: BudgetRecord): { request: FinanceExpenseRequest; budget: BudgetRecord } {
  assertBranch(actor, request.organizationId, request.branchId);
  if (request.status !== "approved") throw new FinanceServiceError("invalid_transition", "expense_not_approved");
  validateDocumentRefs(request.documentRefs);
  if (budget.organizationId !== request.organizationId || budget.branchId !== request.branchId) {
    throw new FinanceServiceError("forbidden", "budget_scope_denied");
  }
  if (budget.spentAmount + request.amount > budget.amount) throw new FinanceServiceError("budget_exceeded");
  return {
    request: { ...request, status: "paid" },
    budget: { ...budget, spentAmount: budget.spentAmount + request.amount },
  };
}

export function createLedgerEntry(actor: FinanceActor, input: LedgerEntryInput): LedgerEntry {
  assertBranch(actor, actor.organizationId, input.branchId);
  assertAmount(input.amount);
  if (!input.description.trim()) throw new FinanceServiceError("invalid_document", "description_required");
  return { ...input, description: input.description.trim(), organizationId: actor.organizationId, createdByUserId: actor.userId };
}

/** Ledger rows are append-only; corrections must be a compensating entry. */
export function updateLedgerEntry(): never {
  throw new FinanceServiceError("immutable_entry", "ledger_entries_are_immutable");
}
