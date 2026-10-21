import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { calculatePayroll, PayrollWorkflowError, type PayrollInput } from "./payroll.service";
import { createDatabase } from "../../database/client";
import { DrizzlePayrollRepository } from "./drizzle-payroll-repository";

type HeaderMap = Record<string, string | string[] | undefined>;
type ApiStatus = "draft" | "calculated" | "approved" | "locked" | "published";
type PayrollLine = ReturnType<typeof calculatePayroll> & { id: string; sourceWorklogIds: string[]; exception?: string };
type PayrollPeriod = { id: string; organizationId: string; period: string; label: string; status: ApiStatus; calculationVersion: string; lines: PayrollLine[]; updatedAt: string; publishedAt?: string };

const header = (headers: HeaderMap, key: string) => {
  const value = headers[key];
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "");
};
const mutationRoles = new Set(["organization_admin", "payroll_officer"]);
const readRoles = new Set(["organization_admin", "payroll_officer", "hr_officer", "finance_officer"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID_RE.test(value);
function defaultRepository() { if (!process.env.DATABASE_URL) return undefined; try { return new DrizzlePayrollRepository(createDatabase({ url: process.env.DATABASE_URL }).db); } catch { return undefined; } }
const periods = new Map<string, PayrollPeriod>();

const seedLines = (): PayrollLine[] => [
  { ...calculatePayroll({ employeeId: "GV-001", salaryAmount: 18000000, hourlyRate: 180000, hours: 18, classRate: 0, classes: 0, allowance: 1000000, deduction: 0, taxRate: 0.1, insuranceRate: 0.105 }), id: "line-2026-08-gv001", sourceWorklogIds: ["session-2", "session-3"] },
  { ...calculatePayroll({ employeeId: "GV-002", salaryAmount: 9000000, hourlyRate: 120000, hours: 8, classRate: 0, classes: 0, allowance: 500000, deduction: 0, taxRate: 0.05, insuranceRate: 0.105 }), id: "line-2026-08-gv002", sourceWorklogIds: ["session-4"] },
];
periods.set("p-2026-08", { id: "p-2026-08", organizationId: "org-demo", period: "2026-08", label: "Kỳ lương tháng 08/2026", status: "calculated", calculationVersion: "v1", lines: seedLines(), updatedAt: "2026-08-25T09:40:00.000Z" });
periods.set("p-2026-07", { id: "p-2026-07", organizationId: "org-demo", period: "2026-07", label: "Kỳ lương tháng 07/2026", status: "published", calculationVersion: "v1", lines: [], updatedAt: "2026-07-31T16:20:00.000Z", publishedAt: "2026-07-31T16:20:00.000Z" });

function scope(headers: HeaderMap) {
  const role = header(headers, "x-role");
  const organizationId = header(headers, "x-organization-id");
  if (!readRoles.has(role)) throw new ForbiddenException("payroll_role_required");
  if (!organizationId) throw new ForbiddenException("organization_scope_required");
  return { role, organizationId, userId: header(headers, "x-user-id") };
}
function canMutate(headers: HeaderMap) {
  const current = scope(headers);
  if (!mutationRoles.has(current.role)) throw new ForbiddenException("payroll_mutation_role_required");
  return current;
}
function getPeriod(headers: HeaderMap, id: string) {
  const current = scope(headers);
  const period = periods.get(id);
  if (!period) throw new BadRequestException("payroll_period_not_found");
  if (period.organizationId !== current.organizationId) throw new ForbiddenException("organization_scope_denied");
  return period;
}
function summary(period: PayrollPeriod) {
  return { id: period.id, period: period.period, label: period.label, staff: period.lines.length, gross: period.lines.reduce((sum, line) => sum + line.grossAmount, 0), net: period.lines.reduce((sum, line) => sum + line.netAmount, 0), status: period.status, calculationVersion: period.calculationVersion, exceptions: period.lines.filter((line) => line.exception).map((line) => line.exception), updatedAt: period.updatedAt, publishedAt: period.publishedAt };
}

@Controller("payroll")
export class PayrollController {
  constructor(private readonly repository: DrizzlePayrollRepository | undefined = defaultRepository()) {}
  @Get("periods")
  async list(@Headers() headers: HeaderMap) {
    const current = scope(headers);
    if (this.repository && isUuid(current.organizationId)) return { data: await this.repository.list(current.organizationId) };
    return { data: [...periods.values()].filter((period) => period.organizationId === current.organizationId).map(summary) };
  }

  @Get("periods/:id/lines")
  async lines(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const current = scope(headers);
    if (this.repository && isUuid(current.organizationId) && isUuid(id)) return { data: await this.repository.lines(current.organizationId, id) };
    return { data: getPeriod(headers, id).lines };
  }

  @Post("periods")
  async create(@Headers() headers: HeaderMap, @Body() body: { period?: string; label?: string }) {
    const current = canMutate(headers);
    const periodValue = body.period?.trim() ?? "";
    if (!/^\d{4}-\d{2}$/.test(periodValue)) throw new BadRequestException("payroll_period_invalid");
    if ([...periods.values()].some((item) => item.organizationId === current.organizationId && item.period === periodValue)) throw new BadRequestException("payroll_period_exists");
    const [year, month] = periodValue.split("-");
    if (this.repository && isUuid(current.organizationId) && isUuid(current.userId)) return this.repository.create({ id: crypto.randomUUID(), organizationId: current.organizationId, userId: current.userId, period: periodValue, calculationVersion: "v1" });
    const item: PayrollPeriod = { id: `p-${periodValue}`, organizationId: current.organizationId, period: periodValue, label: body.label?.trim() || `Kỳ lương tháng ${month}/${year}`, status: "draft", calculationVersion: "v1", lines: [], updatedAt: new Date().toISOString() };
    periods.set(item.id, item);
    return summary(item);
  }

  @Patch("periods/:id")
  async update(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: { label?: string }) {
    const period = getPeriod(headers, id);
    canMutate(headers);
    if (period.status !== "draft") throw new BadRequestException("payroll_period_not_editable");
    if (!body.label?.trim()) throw new BadRequestException("payroll_label_required");
    period.label = body.label.trim();
    period.updatedAt = new Date().toISOString();
    return summary(period);
  }

  @Post("periods/:id/calculate")
  async calculate(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body?: { lines?: PayrollInput[] }) {
    const current = canMutate(headers);
    if (this.repository && isUuid(current.organizationId) && isUuid(id)) {
      const inputs = body?.lines ?? [];
      if (!inputs.length || inputs.some((line) => !isUuid(line.employeeId))) throw new BadRequestException("payroll_employee_uuid_required");
      try { return await this.repository.calculate({ organizationId: current.organizationId, id, lines: inputs }); } catch (error) { if (error instanceof PayrollWorkflowError) throw new BadRequestException(`payroll_${error.code}`); throw error; }
    }
    const period = getPeriod(headers, id);
    if (["approved", "locked", "published"].includes(period.status)) throw new BadRequestException("payroll_period_not_editable");
    try {
      const inputs = body?.lines?.length ? body.lines : period.lines.map(({ id: _id, sourceWorklogIds: _source, exception: _exception, ...line }) => line);
      if (!inputs.length) throw new PayrollWorkflowError("invalid_amount");
      const calculated = inputs.map((input, index) => ({ ...calculatePayroll(input), id: period.lines[index]?.id ?? `line-${period.id}-${input.employeeId}`, sourceWorklogIds: period.lines[index]?.sourceWorklogIds ?? [] }));
      period.lines = calculated;
      period.status = "calculated";
      period.updatedAt = new Date().toISOString();
      return summary(period);
    } catch (error) {
      if (error instanceof PayrollWorkflowError) throw new BadRequestException(`payroll_${error.code}`);
      throw error;
    }
  }

  @Post("periods/:id/approve")
  async approve(@Headers() headers: HeaderMap, @Param("id") id: string) { const current = canMutate(headers); if (this.repository && isUuid(current.organizationId) && isUuid(id)) return this.repository.transition(current.organizationId, id, "approved"); const period = getPeriod(headers, id); if (period.status !== "calculated") throw new BadRequestException("payroll_invalid_transition"); period.status = "approved"; period.updatedAt = new Date().toISOString(); return summary(period); }
  @Post("periods/:id/lock")
  async lock(@Headers() headers: HeaderMap, @Param("id") id: string) { const current = canMutate(headers); if (this.repository && isUuid(current.organizationId) && isUuid(id)) return this.repository.transition(current.organizationId, id, "locked"); const period = getPeriod(headers, id); if (period.status !== "approved") throw new BadRequestException("payroll_invalid_transition"); period.status = "locked"; period.updatedAt = new Date().toISOString(); return summary(period); }
  @Post("periods/:id/publish")
  async publish(@Headers() headers: HeaderMap, @Param("id") id: string) { const current = canMutate(headers); if (this.repository && isUuid(current.organizationId) && isUuid(id)) return this.repository.transition(current.organizationId, id, "published"); const period = getPeriod(headers, id); if (period.status !== "locked") throw new BadRequestException("payroll_invalid_transition"); period.status = "published"; period.publishedAt = new Date().toISOString(); period.updatedAt = period.publishedAt; return summary(period); }
}
