import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { branches } from "../organization-branch/schema";
import { academicClasses, enrollments, students } from "../academic-learning/schema";
import { invoices, paymentTransactions } from "../billing-payment/schema";

export type PersistedBillingInvoice = { id: string; branchId: string; branch: string; number: string; student: string; description: string; amount: number; due: string; status: "pending" | "paid" | "overdue"; updatedAt: string };
type Database = NodePgDatabase<Record<string, never>>;
const publicStatus = (status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled"): PersistedBillingInvoice["status"] => status === "paid" ? "paid" : status === "overdue" ? "overdue" : "pending";

export class DrizzleBillingRepository {
  constructor(private readonly db: Database) {}
  private async rows(organizationId: string) {
    return this.db.select({ invoice: invoices, studentName: students.fullName, branchId: academicClasses.branchId, branchName: branches.name }).from(invoices).leftJoin(students, eq(invoices.studentId, students.id)).leftJoin(enrollments, eq(enrollments.studentId, students.id)).leftJoin(academicClasses, eq(enrollments.classId, academicClasses.id)).leftJoin(branches, eq(academicClasses.branchId, branches.id)).where(eq(invoices.organizationId, organizationId));
  }
  async list(organizationId: string, branchIds?: ReadonlySet<string>): Promise<PersistedBillingInvoice[]> {
    const rows = await this.rows(organizationId); const seen = new Set<string>();
    return rows.filter((row) => { const branchId = row.branchId ?? ""; if (branchIds?.size && !branchIds.has(branchId)) return false; if (seen.has(row.invoice.id)) return false; seen.add(row.invoice.id); return true; }).map((row) => ({ id: row.invoice.id, branchId: row.branchId ?? "", branch: row.branchName ?? row.branchId ?? "", number: row.invoice.invoiceNumber, student: row.studentName ?? row.invoice.studentId ?? "", description: row.invoice.description, amount: row.invoice.totalAmount, due: row.invoice.dueAt.toISOString().slice(0, 10), status: publicStatus(row.invoice.status), updatedAt: row.invoice.updatedAt.toISOString() }));
  }
  async listForStudent(organizationId: string, studentId: string): Promise<PersistedBillingInvoice[]> {
    const rows = await this.rows(organizationId);
    return rows.filter((row) => row.invoice.studentId === studentId).map((row) => ({ id: row.invoice.id, branchId: row.branchId ?? "", branch: row.branchName ?? row.branchId ?? "", number: row.invoice.invoiceNumber, student: row.studentName ?? row.invoice.studentId ?? "", description: row.invoice.description, amount: row.invoice.totalAmount, due: row.invoice.dueAt.toISOString().slice(0, 10), status: publicStatus(row.invoice.status), updatedAt: row.invoice.updatedAt.toISOString() }));
  }
  async create(input: { id: string; organizationId: string; userId: string; studentId: string; number: string; description: string; amount: number; due: Date }): Promise<PersistedBillingInvoice> {
    await this.db.insert(invoices).values({ id: input.id, organizationId: input.organizationId, studentId: input.studentId, invoiceNumber: input.number, description: input.description, subtotal: input.amount, discountAmount: 0, totalAmount: input.amount, paidAmount: 0, currency: "VND", status: "issued", dueAt: input.due, createdByUserId: input.userId });
    const result = await this.list(input.organizationId); const item = result.find((row) => row.id === input.id); if (!item) throw new Error("invoice_not_found"); return item;
  }
  async update(input: { organizationId: string; id: string; student?: string; description?: string; amount?: number; due?: Date }): Promise<PersistedBillingInvoice> {
    const existing = (await this.rows(input.organizationId)).find((row) => row.invoice.id === input.id); if (!existing) throw new Error("invoice_not_found");
    if (existing.invoice.status === "paid") throw new Error("paid_invoice_not_editable");
    await this.db.update(invoices).set({ description: input.description ?? existing.invoice.description, subtotal: input.amount ?? existing.invoice.subtotal, totalAmount: input.amount ?? existing.invoice.totalAmount, dueAt: input.due ?? existing.invoice.dueAt, updatedAt: new Date() }).where(and(eq(invoices.id, input.id), eq(invoices.organizationId, input.organizationId)));
    const result = await this.list(input.organizationId); const item = result.find((row) => row.id === input.id); if (!item) throw new Error("invoice_not_found"); return item;
  }
  async markPaid(input: { organizationId: string; id: string; userId: string }): Promise<PersistedBillingInvoice> {
    const existing = (await this.rows(input.organizationId)).find((row) => row.invoice.id === input.id); if (!existing) throw new Error("invoice_not_found"); if (existing.invoice.status === "paid") throw new Error("invoice_already_paid");
    await this.db.transaction(async (tx) => { await tx.update(invoices).set({ paidAmount: existing.invoice.totalAmount, status: "paid", updatedAt: new Date() }).where(and(eq(invoices.id, input.id), eq(invoices.organizationId, input.organizationId))); await tx.insert(paymentTransactions).values({ organizationId: input.organizationId, invoiceId: input.id, provider: "manual", providerTransactionId: null, idempotencyKey: `manual-${input.id}-${Date.now()}`, amount: existing.invoice.totalAmount, currency: existing.invoice.currency, status: "succeeded", paidAt: new Date(), rawEvent: { source: "finance_console", userId: input.userId } }); });
    const result = await this.list(input.organizationId); const item = result.find((row) => row.id === input.id); if (!item) throw new Error("invoice_not_found"); return item;
  }
  async reconcile(organizationId: string, branchIds?: ReadonlySet<string>) { const rows = await this.list(organizationId, branchIds); return { status: "requested", invoiceCount: rows.length, totalOutstanding: rows.filter((row) => row.status !== "paid").reduce((sum, row) => sum + row.amount, 0), requestedAt: new Date().toISOString() }; }
}
