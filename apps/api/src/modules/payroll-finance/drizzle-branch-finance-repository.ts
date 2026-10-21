import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { branches } from "../organization-branch/schema";
import { budgets, financeEntries } from "./schema";

export type PersistedBranchFinanceRow = { id: string; branchId: string; branch: string; period: string; income: number; expense: number; balance: number; budget: number; status: "Đang theo dõi" | "Cần đối soát" };
export type BranchFinanceRepository = {
  list(organizationId: string, branchIds?: ReadonlySet<string>): Promise<PersistedBranchFinanceRow[]>;
  addLedger(input: { id: string; organizationId: string; userId: string; branchId: string; categoryId: string; cashAccountId: string; kind: "income" | "expense"; amount: number; description: string; occurredAt: Date }): Promise<PersistedBranchFinanceRow>;
  updateBudget(input: { id: string; organizationId: string; userId: string; branchId: string; period: string; amount: number }): Promise<PersistedBranchFinanceRow>;
  reconcile(organizationId: string, branchId: string): Promise<PersistedBranchFinanceRow>;
};

export class DrizzleBranchFinanceRepository implements BranchFinanceRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}
  async list(organizationId: string, branchIds?: ReadonlySet<string>) {
    const conditions = [eq(budgets.organizationId, organizationId)];
    if (branchIds?.size) conditions.push(inArray(budgets.branchId, [...branchIds]));
    const budgetRows = await this.db.select().from(budgets).where(and(...conditions));
    if (!budgetRows.length) return [];
    const ids = budgetRows.map((item) => item.branchId);
    const [branchRows, entries] = await Promise.all([
      this.db.select().from(branches).where(and(eq(branches.organizationId, organizationId), inArray(branches.id, ids))),
      this.db.select().from(financeEntries).where(and(eq(financeEntries.organizationId, organizationId), inArray(financeEntries.branchId, ids))),
    ]);
    const names = new Map(branchRows.map((item) => [item.id, item.name]));
    return budgetRows.map((budget) => {
      const branchEntries = entries.filter((entry) => entry.branchId === budget.branchId);
      const income = branchEntries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
      const expense = branchEntries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
      return { id: budget.branchId, branchId: budget.branchId, branch: names.get(budget.branchId) ?? budget.branchId, period: budget.period, income, expense, balance: income - expense, budget: budget.amount, status: "Đang theo dõi" as const };
    });
  }
  private async current(organizationId: string, branchId: string) { const result = await this.list(organizationId, new Set([branchId])); if (!result[0]) throw new Error("branch_not_found"); return result[0]; }
  async addLedger(input: Parameters<BranchFinanceRepository["addLedger"]>[0]) {
    await this.db.insert(financeEntries).values({ id: input.id, organizationId: input.organizationId, branchId: input.branchId, categoryId: input.categoryId, cashAccountId: input.cashAccountId, kind: input.kind, amount: input.amount, description: input.description, occurredAt: input.occurredAt, createdByUserId: input.userId });
    return this.current(input.organizationId, input.branchId);
  }
  async updateBudget(input: Parameters<BranchFinanceRepository["updateBudget"]>[0]) {
    await this.db.insert(budgets).values({ id: input.id, organizationId: input.organizationId, branchId: input.branchId, period: input.period, amount: input.amount, spentAmount: 0, createdByUserId: input.userId }).onConflictDoUpdate({ target: [budgets.branchId, budgets.period], set: { amount: input.amount, updatedAt: new Date() } });
    return this.current(input.organizationId, input.branchId);
  }
  async reconcile(organizationId: string, branchId: string) { return this.current(organizationId, branchId); }
}
