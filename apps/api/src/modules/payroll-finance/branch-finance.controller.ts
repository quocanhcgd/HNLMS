import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, Optional, Param, Patch, Post, Query } from "@nestjs/common";
import { createBudget, createLedgerEntry, FinanceServiceError, type LedgerEntry } from "./finance.service";
import { createDatabase } from "../../database/client";
import { DrizzleBranchFinanceRepository, type BranchFinanceRepository, type PersistedBranchFinanceRow } from "./drizzle-branch-finance-repository";

type HeaderMap = Record<string, string | string[] | undefined>;
type BranchFinanceRow = { id: string; branchId: string; branch: string; period: string; income: number; expense: number; balance: number; budget: number; status: "Đang theo dõi" | "Cần đối soát"; ledger: LedgerEntry[] };
const header = (headers: HeaderMap, key: string) => { const value = headers[key]; return Array.isArray(value) ? value[0] ?? "" : String(value ?? ""); };
const branches = new Map([["b1", "Cầu Giấy"], ["b2", "Hai Bà Trưng"]]);
const rows = new Map<string, BranchFinanceRow>([
  ["b1", { id: "b1", branchId: "b1", branch: "Cầu Giấy", period: "2026-08", income: 96000000, expense: 64000000, balance: 32000000, budget: 60000000, status: "Cần đối soát", ledger: [] }],
  ["b2", { id: "b2", branchId: "b2", branch: "Hai Bà Trưng", period: "2026-08", income: 185000000, expense: 82000000, balance: 103000000, budget: 120000000, status: "Đang theo dõi", ledger: [] }],
]);
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const financeRoles = new Set(["organization_admin", "branch_manager", "finance_officer"]);
function defaultRepository(): BranchFinanceRepository | undefined {
  if (!process.env.DATABASE_URL) return undefined;
  try { return new DrizzleBranchFinanceRepository(createDatabase({ url: process.env.DATABASE_URL }).db); } catch { return undefined; }
}

@Controller("finance/branches")
export class BranchFinanceController {
  constructor(@Optional() private readonly repository: BranchFinanceRepository | undefined = defaultRepository()) {}
  private scope(headers: HeaderMap) {
    const role = header(headers, "x-role");
    const organizationId = header(headers, "x-organization-id");
    const allowed = new Set(header(headers, "x-branch-ids").split(",").map((item) => item.trim()).filter(Boolean));
    if (!financeRoles.has(role)) throw new ForbiddenException("finance_role_required");
    const organizationWide = role === "organization_admin" || role === "finance_officer";
    if (!organizationId || (!organizationWide && !allowed.size)) throw new ForbiddenException("branch_scope_required");
    return { organizationWide, allowed, userId: header(headers, "x-user-id") || "demo" };
  }
  private row(headers: HeaderMap, branchId: string) {
    const scope = this.scope(headers);
    if (!scope.organizationWide && !scope.allowed.has(branchId)) throw new ForbiddenException("branch_scope_denied");
    const row = rows.get(branchId);
    if (!row) throw new BadRequestException("branch_not_found");
    return { row, scope };
  }
  @Get()
  async list(@Headers() headers: HeaderMap, @Query("branch_id") branchId?: string) {
    const scope = this.scope(headers);
    const organizationId = header(headers, "x-organization-id");
    if (this.repository && isUuid(organizationId) && (!branchId || isUuid(branchId))) {
      if (branchId) {
        if (!scope.organizationWide && !scope.allowed.has(branchId)) throw new ForbiddenException("branch_scope_denied");
        return { data: await this.repository.list(organizationId, new Set([branchId])) };
      }
      return { data: await this.repository.list(organizationId, scope.organizationWide ? undefined : scope.allowed) };
    }
    if (branchId) return { data: [this.row(headers, branchId).row].map(this.publicRow) };
    return { data: [...rows.values()].filter((item) => scope.organizationWide || scope.allowed.has(item.branchId)).map(this.publicRow) };
  }
  @Post(":branchId/ledger")
  async addLedger(@Headers() headers: HeaderMap, @Param("branchId") branchId: string, @Body() body: { kind?: "income" | "expense"; amount?: number; description?: string; categoryId?: string; cashAccountId?: string; occurredAt?: string }) {
    const scope = this.scope(headers);
    const organizationId = header(headers, "x-organization-id");
    const persistent = this.repository && isUuid(organizationId) && isUuid(branchId);
    const row = persistent ? undefined : this.row(headers, branchId).row;
    try {
      const entry = createLedgerEntry({ userId: scope.userId, organizationId: "org-demo", branchIds: scope.organizationWide ? undefined : scope.allowed }, { id: `ledger-${Date.now()}`, branchId, categoryId: body.categoryId?.trim() || "general", cashAccountId: body.cashAccountId?.trim() || "main", kind: body.kind ?? "expense", amount: Number(body.amount), description: body.description ?? "", occurredAt: new Date(body.occurredAt ?? Date.now()) });
      if (this.repository && isUuid(header(headers, "x-organization-id")) && isUuid(branchId)) return this.repository.addLedger({ ...entry, organizationId: header(headers, "x-organization-id"), userId: scope.userId });
      if (!row) throw new Error("branch_not_found");
      row.ledger.push(entry); row.income += entry.kind === "income" ? entry.amount : 0; row.expense += entry.kind === "expense" ? entry.amount : 0; row.balance = row.income - row.expense;
      return this.publicRow(row);
    } catch (error) { if (error instanceof FinanceServiceError) throw new BadRequestException(error.message); throw error; }
  }
  @Patch(":branchId/budget")
  async updateBudget(@Headers() headers: HeaderMap, @Param("branchId") branchId: string, @Body() body: { period?: string; amount?: number }) {
    const scope = this.scope(headers);
    const organizationId = header(headers, "x-organization-id");
    const persistent = this.repository && isUuid(organizationId) && isUuid(branchId);
    const row = persistent ? undefined : this.row(headers, branchId).row;
    try { const budget = createBudget({ userId: scope.userId, organizationId: "org-demo", branchIds: scope.organizationWide ? undefined : scope.allowed }, { id: row?.id ?? crypto.randomUUID(), branchId, period: body.period ?? row?.period ?? "2026-08", amount: Number(body.amount) }); if (persistent && this.repository) return this.repository.updateBudget({ id: budget.id, branchId, period: budget.period, amount: budget.amount, organizationId, userId: scope.userId }); if (!row) throw new Error("branch_not_found"); row.period = budget.period; row.budget = budget.amount; return this.publicRow(row); } catch (error) { if (error instanceof FinanceServiceError) throw new BadRequestException(error.message); throw error; }
  }
  @Post(":branchId/reconcile")
  async reconcile(@Headers() headers: HeaderMap, @Param("branchId") branchId: string) { const organizationId = header(headers, "x-organization-id"); if (this.repository && isUuid(organizationId) && isUuid(branchId)) return this.repository.reconcile(organizationId, branchId); const { row } = this.row(headers, branchId); row.status = "Đang theo dõi"; return this.publicRow(row); }
  private publicRow = (row: BranchFinanceRow) => ({ id: row.id, branchId: row.branchId, branch: row.branch, period: row.period, income: row.income, expense: row.expense, balance: row.balance, budget: row.budget, status: row.status });
}
