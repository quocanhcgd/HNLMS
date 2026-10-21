export type PayrollInput = {
  employeeId: string; salaryAmount: number; hourlyRate: number; hours: number;
  classRate: number; classes: number; allowance: number; deduction: number;
  taxRate: number; insuranceRate: number;
};
export type PayrollLineResult = PayrollInput & {
  hourAmount: number; classAmount: number; grossAmount: number; taxAmount: number;
  insuranceAmount: number; netAmount: number; calculationVersion: string;
};
export type PayrollPeriodState = {
  id: string; status: "draft" | "calculated" | "approved" | "locked" | "published";
  totalGross: number; totalNet: number;
};
export type PayrollLineSnapshot = { id: string; employeeId: string; grossAmount: number; netAmount: number };
export type PublishedPayslip = { id: string; periodId: string; employeeId: string; lineId: string; publishedAt: Date };

export class PayrollWorkflowError extends Error {
  constructor(public readonly code: "invalid_transition" | "locked_period" | "invalid_amount") { super(code); this.name = "PayrollWorkflowError"; }
}

function validatePayrollInput(input: PayrollInput) {
  if (!input.employeeId.trim()) throw new PayrollWorkflowError("invalid_amount");
  for (const value of [input.salaryAmount, input.hourlyRate, input.hours, input.classRate, input.classes, input.allowance, input.deduction]) {
    if (!Number.isFinite(value) || value < 0) throw new PayrollWorkflowError("invalid_amount");
  }
  for (const rate of [input.taxRate, input.insuranceRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new PayrollWorkflowError("invalid_amount");
  }
}

export function calculatePayroll(input: PayrollInput, version = "v1"): PayrollLineResult {
  validatePayrollInput(input);
  if (!version.trim()) throw new PayrollWorkflowError("invalid_amount");
  const hourAmount = input.hourlyRate * input.hours;
  const classAmount = input.classRate * input.classes;
  const grossAmount = input.salaryAmount + hourAmount + classAmount + input.allowance;
  const taxAmount = Math.round(grossAmount * input.taxRate);
  const insuranceAmount = Math.round(grossAmount * input.insuranceRate);
  return { ...input, hourAmount, classAmount, grossAmount, taxAmount, insuranceAmount,
    netAmount: grossAmount - taxAmount - insuranceAmount - input.deduction, calculationVersion: version };
}

export function publishPayslips(period: PayrollPeriodState, lines: readonly PayrollLineSnapshot[], now = new Date()) {
  if (period.status !== "locked") throw new PayrollWorkflowError("invalid_transition");
  if (!lines.length || lines.some((line) => !line.id || !line.employeeId || line.grossAmount < 0 || line.netAmount < 0)) {
    throw new PayrollWorkflowError("invalid_amount");
  }
  const payslips = lines.map((line) => ({ id: `payslip-${period.id}-${line.employeeId}`, periodId: period.id, employeeId: line.employeeId, lineId: line.id, publishedAt: now }));
  return { period: { ...period, status: "published" as const }, payslips };
}

export class PayrollWorkflowService {
  calculate(lines: PayrollInput[]) { if (!lines.length) throw new PayrollWorkflowError("invalid_amount"); return lines.map((line) => calculatePayroll(line)); }
  approve(period: PayrollPeriodState) { if (period.status !== "calculated") throw new PayrollWorkflowError("invalid_transition"); return { ...period, status: "approved" as const }; }
  lock(period: PayrollPeriodState) { if (period.status !== "approved") throw new PayrollWorkflowError("invalid_transition"); return { ...period, status: "locked" as const }; }
  publish(period: PayrollPeriodState) { if (period.status !== "locked") throw new PayrollWorkflowError("invalid_transition"); return { ...period, status: "published" as const }; }
  adjust(period: PayrollPeriodState, delta: { gross: number; net: number } = { gross: 0, net: 0 }) {
    if (period.status === "locked" || period.status === "published") throw new PayrollWorkflowError("locked_period");
    if (!Number.isFinite(delta.gross) || !Number.isFinite(delta.net) || period.totalGross + delta.gross < 0 || period.totalNet + delta.net < 0) throw new PayrollWorkflowError("invalid_amount");
    return { ...period, totalGross: period.totalGross + delta.gross, totalNet: period.totalNet + delta.net, status: "calculated" as const };
  }
  publishPayslips(period: PayrollPeriodState, lines: readonly PayrollLineSnapshot[], now?: Date) { return publishPayslips(period, lines, now); }
}
