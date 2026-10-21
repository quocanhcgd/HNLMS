import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { createDatabase } from "../../database/client";
import { DrizzleHrmRepository } from "./drizzle-hrm-repository";

type HeaderMap = Record<string, string | string[] | undefined>;
type EmployeeStatus = "invited" | "active" | "on_leave" | "suspended" | "terminated";
type LeaveStatus = "requested" | "approved" | "rejected" | "cancelled";
type LeaveRequest = { id: string; organizationId: string; employeeId: string; employeeName: string; startsAt: string; endsAt: string; days: number; reason: string; status: LeaveStatus; };
export type HrmEmployeeRecord = {
  id: string;
  organizationId: string;
  employeeCode: string;
  name: string;
  jobTitle: string;
  branchId: string;
  branch: string;
  status: EmployeeStatus;
  workloadHours: number;
};

const header = (headers: HeaderMap, key: string) => {
  const value = headers[key];
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "");
};
const allowedRoles = new Set(["organization_admin", "branch_manager", "hr_officer"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID_RE.test(value);
function defaultRepository() { if (!process.env.DATABASE_URL) return undefined; try { return new DrizzleHrmRepository(createDatabase({ url: process.env.DATABASE_URL }).db); } catch { return undefined; } }
const employees = new Map<string, HrmEmployeeRecord>([
  ["GV-001", { id: "GV-001", organizationId: "org-demo", employeeCode: "GV-001", name: "Lan Anh", jobTitle: "Giảng viên IELTS", branchId: "b1", branch: "Cầu Giấy", status: "active", workloadHours: 18 }],
  ["GV-002", { id: "GV-002", organizationId: "org-demo", employeeCode: "GV-002", name: "Minh Tuấn", jobTitle: "Trợ giảng TOEIC", branchId: "b1", branch: "Cầu Giấy", status: "invited", workloadHours: 8 }],
  ["NV-003", { id: "NV-003", organizationId: "org-demo", employeeCode: "NV-003", name: "Hoàng Mai", jobTitle: "Điều phối học vụ", branchId: "b2", branch: "Hai Bà Trưng", status: "active", workloadHours: 0 }],
]);
const leaves = new Map<string, LeaveRequest>([
  ["leave-demo-1", { id: "leave-demo-1", organizationId: "org-demo", employeeId: "GV-001", employeeName: "Lan Anh", startsAt: "2026-09-05", endsAt: "2026-09-05", days: 1, reason: "Việc gia đình", status: "requested" }],
]);

@Controller("hrm")
export class HrmController {
  constructor(private readonly repository: DrizzleHrmRepository | undefined = defaultRepository()) {}

  private scope(headers: HeaderMap) {
    const role = header(headers, "x-role");
    const organizationId = header(headers, "x-organization-id");
    const branchIds = new Set(header(headers, "x-branch-ids").split(",").map((value) => value.trim()).filter(Boolean));
    if (!allowedRoles.has(role)) throw new ForbiddenException("hrm_role_required");
    if (!organizationId) throw new ForbiddenException("organization_scope_required");
    if (role !== "organization_admin" && role !== "hr_officer" && !branchIds.size) throw new ForbiddenException("branch_scope_required");
    return { role, organizationId, branchIds, organizationWide: role === "organization_admin" || role === "hr_officer", userId: header(headers, "x-user-id") };
  }

  private visible(headers: HeaderMap, employee: HrmEmployeeRecord) {
    const scope = this.scope(headers);
    if (employee.organizationId !== scope.organizationId) throw new ForbiddenException("organization_scope_denied");
    if (!scope.organizationWide && !scope.branchIds.has(employee.branchId)) throw new ForbiddenException("branch_scope_denied");
    return { employee, scope };
  }

  @Get("employees")
  list(@Headers() headers: HeaderMap) {
    const scope = this.scope(headers);
    if (this.repository && isUuid(scope.organizationId)) return this.repository.listEmployees(scope.organizationId, scope.organizationWide ? undefined : scope.branchIds);
    return { data: [...employees.values()].filter((employee) => employee.organizationId === scope.organizationId && (scope.organizationWide || scope.branchIds.has(employee.branchId))) };
  }

  @Post("employees")
  create(@Headers() headers: HeaderMap, @Body() body: { employeeCode?: string; name?: string; jobTitle?: string; branchId?: string; branch?: string; status?: EmployeeStatus; workloadHours?: number }) {
    const scope = this.scope(headers);
    const employeeCode = body.employeeCode?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const branchId = body.branchId?.trim() ?? "";
    if (!employeeCode || !name || !branchId) throw new BadRequestException("employee_code_name_branch_required");
    if (!scope.organizationWide && !scope.branchIds.has(branchId)) throw new ForbiddenException("branch_scope_denied");
    if (this.repository && isUuid(scope.organizationId) && isUuid(scope.userId) && isUuid(branchId)) return this.repository.createEmployee({ id: crypto.randomUUID(), organizationId: scope.organizationId, userId: scope.userId, employeeCode, name, jobTitle: body.jobTitle?.trim() || "Nhân sự", branchId, status: body.status ?? "invited" }).catch((error) => { throw new BadRequestException(error instanceof Error ? error.message : "employee_create_failed"); });
    if (employees.has(employeeCode)) throw new BadRequestException("employee_code_exists");
    const employee: HrmEmployeeRecord = { id: employeeCode, organizationId: scope.organizationId, employeeCode, name, jobTitle: body.jobTitle?.trim() || "Nhân sự", branchId, branch: body.branch?.trim() || branchId, status: body.status ?? "invited", workloadHours: Number(body.workloadHours ?? 0) };
    employees.set(employee.id, employee);
    return employee;
  }

  @Patch("employees/:id")
  update(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: Partial<Pick<HrmEmployeeRecord, "name" | "jobTitle" | "branchId" | "branch" | "status" | "workloadHours">>) {
    const scoped = this.scope(headers);
    if (this.repository && isUuid(scoped.organizationId) && isUuid(id)) return this.repository.updateEmployee({ id, organizationId: scoped.organizationId, branchIds: scoped.organizationWide ? undefined : scoped.branchIds, name: body.name, jobTitle: body.jobTitle, branchId: body.branchId, status: body.status }).catch((error) => { throw new BadRequestException(error instanceof Error ? error.message : "employee_update_failed"); });
    const existing = employees.get(id);
    if (!existing) throw new BadRequestException("employee_not_found");
    const { employee, scope } = this.visible(headers, existing);
    const branchId = body.branchId?.trim() || employee.branchId;
    if (!scope.organizationWide && !scope.branchIds.has(branchId)) throw new ForbiddenException("branch_scope_denied");
    const updated = { ...employee, ...body, branchId, name: body.name?.trim() || employee.name, jobTitle: body.jobTitle?.trim() || employee.jobTitle, branch: body.branch?.trim() || employee.branch, workloadHours: Number(body.workloadHours ?? employee.workloadHours) };
    employees.set(id, updated);
    return updated;
  }

  @Post("employees/:id/activate")
  activate(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const scoped = this.scope(headers);
    if (this.repository && isUuid(scoped.organizationId) && isUuid(id)) return this.repository.activateEmployee(scoped.organizationId, id, scoped.organizationWide ? undefined : scoped.branchIds).catch((error) => { throw new BadRequestException(error instanceof Error ? error.message : "employee_update_failed"); });
    const existing = employees.get(id);
    if (!existing) throw new BadRequestException("employee_not_found");
    const { employee } = this.visible(headers, existing);
    if (employee.status !== "invited") throw new BadRequestException("invalid_activation_transition");
    employee.status = "active";
    return employee;
  }

  @Get("leaves")
  listLeaves(@Headers() headers: HeaderMap) {
    const scope = this.scope(headers);
    if (this.repository && isUuid(scope.organizationId)) return this.repository.listLeaves(scope.organizationId, scope.organizationWide ? undefined : scope.branchIds).then((data) => ({ data }));
    return { data: [...leaves.values()].filter((leave) => leave.organizationId === scope.organizationId && (scope.organizationWide || scope.branchIds.has(employees.get(leave.employeeId)?.branchId ?? ""))) };
  }

  @Post("leaves")
  requestLeave(@Headers() headers: HeaderMap, @Body() body: { employeeId?: string; startsAt?: string; endsAt?: string; days?: number; reason?: string }) {
    const employeeId = body.employeeId?.trim() ?? "";
    const scope = this.scope(headers);
    const days = Number(body.days);
    if (!body.startsAt || !body.endsAt || !Number.isInteger(days) || days <= 0 || !body.reason?.trim()) throw new BadRequestException("leave_fields_required");
    if (this.repository && isUuid(scope.organizationId) && isUuid(employeeId)) return this.repository.requestLeave({ id: crypto.randomUUID(), organizationId: scope.organizationId, employeeId, startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt), days, reason: body.reason.trim(), branchIds: scope.organizationWide ? undefined : scope.branchIds }).catch((error) => { throw new BadRequestException(error instanceof Error ? error.message : "leave_create_failed"); });
    const existing = employees.get(employeeId);
    if (!existing) throw new BadRequestException("employee_not_found");
    this.visible(headers, existing);
    const leave: LeaveRequest = { id: `leave-${Date.now()}`, organizationId: existing.organizationId, employeeId, employeeName: existing.name, startsAt: body.startsAt, endsAt: body.endsAt, days, reason: body.reason.trim(), status: "requested" };
    leaves.set(leave.id, leave);
    return leave;
  }

  @Post("leaves/:id/approve")
  approveLeave(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const current = this.scope(headers);
    if (current.role !== "organization_admin" && current.role !== "hr_officer" && current.role !== "branch_manager") throw new ForbiddenException("leave_approval_role_required");
    if (this.repository && isUuid(current.organizationId) && isUuid(id) && isUuid(current.userId)) return this.repository.transitionLeave({ organizationId: current.organizationId, id, status: "approved", approverUserId: current.userId, branchIds: current.organizationWide ? undefined : current.branchIds }).catch((error) => { throw new BadRequestException(error instanceof Error ? error.message : "leave_update_failed"); });
    const leave = leaves.get(id);
    if (!leave) throw new BadRequestException("leave_not_found");
    const employee = employees.get(leave.employeeId);
    if (!employee) throw new BadRequestException("employee_not_found");
    this.visible(headers, employee);
    if (leave.status !== "requested") throw new BadRequestException("leave_invalid_transition");
    leave.status = "approved";
    return leave;
  }

  @Post("leaves/:id/reject")
  rejectLeave(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const current = this.scope(headers);
    if (current.role !== "organization_admin" && current.role !== "hr_officer" && current.role !== "branch_manager") throw new ForbiddenException("leave_approval_role_required");
    if (this.repository && isUuid(current.organizationId) && isUuid(id) && isUuid(current.userId)) return this.repository.transitionLeave({ organizationId: current.organizationId, id, status: "rejected", approverUserId: current.userId, branchIds: current.organizationWide ? undefined : current.branchIds }).catch((error) => { throw new BadRequestException(error instanceof Error ? error.message : "leave_update_failed"); });
    const leave = leaves.get(id);
    if (!leave) throw new BadRequestException("leave_not_found");
    const employee = employees.get(leave.employeeId);
    if (!employee) throw new BadRequestException("employee_not_found");
    this.visible(headers, employee);
    if (leave.status !== "requested") throw new BadRequestException("leave_invalid_transition");
    leave.status = "rejected";
    return leave;
  }
}
