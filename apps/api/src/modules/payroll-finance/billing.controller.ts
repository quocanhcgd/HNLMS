import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { createDatabase } from "../../database/client";
import { DrizzleBillingRepository } from "./drizzle-billing-repository";

type HeaderMap = Record<string, string | string[] | undefined>;
type BillingStatus = "pending" | "paid" | "overdue";
type Invoice = { id: string; organizationId: string; branchId: string; branch: string; number: string; student: string; studentId?: string; description: string; amount: number; due: string; status: BillingStatus; updatedAt: string };
const invoices = new Map<string, Invoice>([
  ["INV-2608-001", { id: "INV-2608-001", organizationId: "org-demo", branchId: "b1", branch: "Cầu Giấy", number: "INV-2608-001", student: "Nguyễn Minh Anh", studentId: "student-demo", description: "Học phí IELTS Foundation · tháng 8", amount: 2000000, due: "2026-08-30", status: "pending", updatedAt: "2026-08-25T09:40:00.000Z" }],
  ["INV-2607-014", { id: "INV-2607-014", organizationId: "org-demo", branchId: "b1", branch: "Cầu Giấy", number: "INV-2607-014", student: "Nguyễn Minh Anh", studentId: "student-demo", description: "Phí tài liệu", amount: 350000, due: "2026-08-15", status: "paid", updatedAt: "2026-08-20T16:20:00.000Z" }],
]);
const roleSet = new Set(["organization_admin", "branch_manager", "finance_officer"]);
const branchNames: Record<string, string> = { b1: "Cầu Giấy", b2: "Hai Bà Trưng" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID_RE.test(value);
function defaultRepository() { if (!process.env.DATABASE_URL) return undefined; try { return new DrizzleBillingRepository(createDatabase({ url: process.env.DATABASE_URL }).db); } catch { return undefined; } }
const header = (headers: HeaderMap, key: string) => { const value = headers[key]; return Array.isArray(value) ? value[0] ?? "" : String(value ?? ""); };
function scope(headers: HeaderMap) { const role = header(headers, "x-role"); const organizationId = header(headers, "x-organization-id"); const branchIds = new Set(header(headers, "x-branch-ids").split(",").map((item) => item.trim()).filter(Boolean)); if (!roleSet.has(role)) throw new ForbiddenException("finance_role_required"); if (!organizationId) throw new ForbiddenException("organization_scope_required"); if (role === "branch_manager" && !branchIds.size) throw new ForbiddenException("branch_scope_required"); return { organizationId, branchIds, organizationWide: role !== "branch_manager", userId: header(headers, "x-user-id") }; }
function visible(headers: HeaderMap, invoice: Invoice) { const current = scope(headers); if (invoice.organizationId !== current.organizationId) throw new ForbiddenException("organization_scope_denied"); if (!current.organizationWide && !current.branchIds.has(invoice.branchId)) throw new ForbiddenException("branch_scope_denied"); return invoice; }
const publicInvoice = (invoice: Invoice) => ({ id: invoice.id, branchId: invoice.branchId, branch: invoice.branch, number: invoice.number, student: invoice.student, description: invoice.description, amount: invoice.amount, due: invoice.due, status: invoice.status, updatedAt: invoice.updatedAt });
function learnerScope(headers: HeaderMap) {
  const role = header(headers, "x-role");
  const organizationId = header(headers, "x-organization-id");
  const studentId = header(headers, "x-student-id") || (role === "student" ? "student-demo" : "");
  if (role !== "student" && role !== "parent") throw new ForbiddenException("learner_role_required");
  if (!organizationId || !studentId) throw new ForbiddenException("learner_scope_required");
  return { organizationId, studentId };
}

@Controller("finance/billing")
export class BillingController {
  constructor(private readonly repository: DrizzleBillingRepository | undefined = defaultRepository()) {}
  @Get("student/invoices")
  async learnerList(@Headers() headers: HeaderMap) {
    const current = learnerScope(headers);
    if (this.repository && isUuid(current.organizationId) && isUuid(current.studentId)) return { data: await this.repository.listForStudent(current.organizationId, current.studentId) };
    return { data: [...invoices.values()].filter((item) => item.organizationId === current.organizationId && item.studentId === current.studentId).map(publicInvoice) };
  }
  @Post("student/invoices/:id/pay")
  async learnerPay(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const current = learnerScope(headers);
    if (this.repository && isUuid(current.organizationId) && isUuid(id) && isUuid(current.studentId)) throw new ForbiddenException("learner_payment_requires_finance_confirmation");
    const invoice = invoices.get(id);
    if (!invoice || invoice.organizationId !== current.organizationId || invoice.studentId !== current.studentId) throw new ForbiddenException("invoice_scope_denied");
    if (invoice.status === "paid") throw new BadRequestException("invoice_already_paid");
    invoice.status = "paid"; invoice.updatedAt = new Date().toISOString(); return publicInvoice(invoice);
  }
  @Get("invoices")
  async list(@Headers() headers: HeaderMap) { const current = scope(headers); if (this.repository && isUuid(current.organizationId)) return { data: await this.repository.list(current.organizationId, current.organizationWide ? undefined : current.branchIds) }; return { data: [...invoices.values()].filter((item) => item.organizationId === current.organizationId && (current.organizationWide || current.branchIds.has(item.branchId))).map(publicInvoice) }; }
  @Post("invoices")
  async create(@Headers() headers: HeaderMap, @Body() body: { number?: string; student?: string; studentId?: string; description?: string; amount?: number; due?: string; branchId?: string; branch?: string }) { const current = scope(headers); const number = body.number?.trim() ?? ""; const student = body.student?.trim() ?? ""; const amount = Number(body.amount); const branchId = body.branchId?.trim() ?? ""; if (!number || !student || !Number.isFinite(amount) || amount <= 0 || !body.due || !branchId) throw new BadRequestException("invoice_fields_required"); if (!current.organizationWide && !current.branchIds.has(branchId)) throw new ForbiddenException("branch_scope_denied"); if (this.repository && isUuid(current.organizationId) && isUuid(current.userId) && isUuid(body.studentId ?? "")) return this.repository.create({ id: crypto.randomUUID(), organizationId: current.organizationId, userId: current.userId, studentId: body.studentId!, number, description: body.description?.trim() || "Học phí", amount, due: new Date(body.due) }); if (invoices.has(number)) throw new BadRequestException("invoice_number_exists"); const item: Invoice = { id: number, organizationId: current.organizationId, branchId, branch: body.branch?.trim() || branchNames[branchId] || branchId, number, student, description: body.description?.trim() || "Học phí", amount, due: body.due, status: "pending", updatedAt: new Date().toISOString() }; invoices.set(item.id, item); return publicInvoice(item); }
  @Patch("invoices/:id")
  async update(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: Partial<Pick<Invoice, "student" | "description" | "amount" | "due">>) { const current = scope(headers); if (this.repository && isUuid(current.organizationId) && isUuid(id)) return this.repository.update({ organizationId: current.organizationId, id, description: body.description, amount: body.amount, due: body.due ? new Date(body.due) : undefined }); const invoice = visible(headers, invoices.get(id) ?? (() => { throw new BadRequestException("invoice_not_found"); })()); if (invoice.status === "paid") throw new BadRequestException("paid_invoice_not_editable"); if (body.student !== undefined && !body.student.trim()) throw new BadRequestException("invoice_student_required"); if (body.amount !== undefined && (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0)) throw new BadRequestException("invoice_amount_invalid"); Object.assign(invoice, { ...body, amount: body.amount === undefined ? invoice.amount : Number(body.amount), updatedAt: new Date().toISOString() }); return publicInvoice(invoice); }
  @Post("invoices/:id/pay")
  async markPaid(@Headers() headers: HeaderMap, @Param("id") id: string) { const current = scope(headers); if (this.repository && isUuid(current.organizationId) && isUuid(id) && isUuid(current.userId)) return this.repository.markPaid({ organizationId: current.organizationId, id, userId: current.userId }); const invoice = visible(headers, invoices.get(id) ?? (() => { throw new BadRequestException("invoice_not_found"); })()); if (invoice.status === "paid") throw new BadRequestException("invoice_already_paid"); invoice.status = "paid"; invoice.updatedAt = new Date().toISOString(); return publicInvoice(invoice); }
  @Post("reconcile")
  async reconcile(@Headers() headers: HeaderMap) { const current = scope(headers); if (this.repository && isUuid(current.organizationId)) return this.repository.reconcile(current.organizationId, current.organizationWide ? undefined : current.branchIds); const visibleRows = [...invoices.values()].filter((item) => item.organizationId === current.organizationId && (current.organizationWide || current.branchIds.has(item.branchId))); return { status: "requested", invoiceCount: visibleRows.length, totalOutstanding: visibleRows.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.amount, 0), requestedAt: new Date().toISOString() }; }
}
