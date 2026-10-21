import { Controller, ForbiddenException, Get, Headers, Query } from "@nestjs/common";
import { ReportingScopeError, ReportingService, type BranchMetric } from "./reporting.service";

type HeaderMap = Record<string, string | string[] | undefined>;
const header = (headers: HeaderMap, key: string) => {
  const value = headers[key];
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "");
};
const values = (headers: HeaderMap, key: string) => new Set(header(headers, key).split(",").map((item) => item.trim()).filter(Boolean));
const reportingRoles = new Set(["organization_admin", "branch_manager", "finance_officer", "executive"]);

const demoRows: BranchMetric[] = [
  { branchId: "b1", branchName: "Cầu Giấy", learners: 210, activeClasses: 9, revenue: 96000000, expenses: 64000000, payroll: 51000000, updatedAt: new Date() },
  { branchId: "b2", branchName: "Hai Bà Trưng", learners: 420, activeClasses: 18, revenue: 185000000, expenses: 82000000, payroll: 96000000, updatedAt: new Date() },
];

@Controller("reporting")
export class ReportingController {
  private readonly service = new ReportingService(demoRows);

  @Get("metrics")
  metrics(@Headers() headers: HeaderMap, @Query("branch_id") branchId?: string) {
    const role = header(headers, "x-role");
    if (!reportingRoles.has(role)) throw new ForbiddenException("reporting_role_required");
    const assigned = values(headers, "x-branch-ids");
    const ownBranch = header(headers, "x-branch-id") || [...assigned][0];
    const isOrganizationWide = role === "organization_admin" || role === "executive" || role === "finance_officer";
    if (!header(headers, "x-organization-id") || (!isOrganizationWide && !ownBranch)) throw new ForbiddenException("branch_scope_required");
    const scopeBranch = isOrganizationWide ? undefined : ownBranch;
    try {
      return { data: this.service.getMetrics({ organizationId: header(headers, "x-organization-id"), branchId: scopeBranch, allowedBranchIds: isOrganizationWide ? undefined : [...assigned] }, { branchId }) , freshness: this.service.getFreshness() };
    } catch (error) {
      if (error instanceof ReportingScopeError) throw new ForbiddenException(error.message);
      throw error;
    }
  }
}
