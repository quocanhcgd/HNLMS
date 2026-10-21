import { and, asc, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../../database/schema/identity-access";
import { branches } from "../organization-branch/schema";
import { employeeLeaves, employees } from "./schema";
import type { HrmEmployeeRecord } from "./hrm.controller";

type Database = NodePgDatabase<Record<string, never>>;
type EmployeeStatus = HrmEmployeeRecord["status"];
type LeaveStatus = "requested" | "approved" | "rejected" | "cancelled";

export type PersistedLeave = {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  startsAt: string;
  endsAt: string;
  days: number;
  reason: string;
  status: LeaveStatus;
};

/** Database-backed HRM operations. Scope checks stay in the controller. */
export class DrizzleHrmRepository {
  constructor(private readonly db: Database) {}

  async listEmployees(organizationId: string, branchIds?: ReadonlySet<string>): Promise<HrmEmployeeRecord[]> {
    const conditions = [eq(employees.organizationId, organizationId)];
    if (branchIds?.size) conditions.push(inArray(employees.branchId, [...branchIds]));
    const rows = await this.db
      .select({ employee: employees, user: users, branch: branches })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .where(and(...conditions))
      .orderBy(asc(employees.employeeCode));
    return rows.map(({ employee, user, branch }) => ({
      id: employee.id,
      organizationId: employee.organizationId,
      employeeCode: employee.employeeCode,
      name: user.displayName,
      jobTitle: employee.jobTitle,
      branchId: employee.branchId ?? "",
      branch: branch?.name ?? employee.branchId ?? "",
      status: employee.status,
      workloadHours: 0,
    }));
  }

  async createEmployee(input: {
    id: string;
    organizationId: string;
    userId: string;
    employeeCode: string;
    name: string;
    jobTitle: string;
    branchId: string;
    status: EmployeeStatus;
  }): Promise<HrmEmployeeRecord> {
    await this.db.transaction(async (tx) => {
      const existingUser = await tx.select({ id: users.id }).from(users).where(and(eq(users.id, input.userId), eq(users.organizationId, input.organizationId))).limit(1);
      if (!existingUser[0]) throw new Error("user_not_found");
      const branch = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, input.branchId), eq(branches.organizationId, input.organizationId))).limit(1);
      if (!branch[0]) throw new Error("branch_not_found");
      await tx.update(users).set({ displayName: input.name, updatedAt: new Date() }).where(eq(users.id, input.userId));
      await tx.insert(employees).values({ id: input.id, organizationId: input.organizationId, userId: input.userId, employeeCode: input.employeeCode, jobTitle: input.jobTitle, branchId: input.branchId, status: input.status, hireDate: new Date() });
    });
    const employee = (await this.listEmployees(input.organizationId, new Set([input.branchId]))).find((item) => item.id === input.id);
    if (!employee) throw new Error("employee_create_failed");
    return employee;
  }

  async updateEmployee(input: {
    id: string;
    organizationId: string;
    branchIds?: ReadonlySet<string>;
    name?: string;
    jobTitle?: string;
    branchId?: string;
    status?: EmployeeStatus;
  }): Promise<HrmEmployeeRecord> {
    const existing = await this.db.select().from(employees).where(and(eq(employees.id, input.id), eq(employees.organizationId, input.organizationId))).limit(1);
    if (!existing[0]) throw new Error("employee_not_found");
    const branchId = input.branchId ?? existing[0].branchId;
    if (input.branchIds?.size && (!branchId || !input.branchIds.has(branchId))) throw new Error("branch_scope_denied");
    await this.db.transaction(async (tx) => {
      await tx.update(employees).set({ ...(input.jobTitle === undefined ? {} : { jobTitle: input.jobTitle }), ...(input.branchId === undefined ? {} : { branchId: input.branchId }), ...(input.status === undefined ? {} : { status: input.status }), updatedAt: new Date() }).where(and(eq(employees.id, input.id), eq(employees.organizationId, input.organizationId)));
      if (input.name !== undefined) await tx.update(users).set({ displayName: input.name, updatedAt: new Date() }).where(and(eq(users.id, existing[0].userId), eq(users.organizationId, input.organizationId)));
    });
    const employee = (await this.listEmployees(input.organizationId, input.branchIds)).find((item) => item.id === input.id);
    if (!employee) throw new Error("employee_update_failed");
    return employee;
  }

  async activateEmployee(organizationId: string, id: string, branchIds?: ReadonlySet<string>) {
    const existing = await this.db.select().from(employees).where(and(eq(employees.id, id), eq(employees.organizationId, organizationId))).limit(1);
    if (!existing[0]) throw new Error("employee_not_found");
    if (branchIds?.size && (!existing[0].branchId || !branchIds.has(existing[0].branchId))) throw new Error("branch_scope_denied");
    if (existing[0].status !== "invited") throw new Error("invalid_activation_transition");
    await this.db.update(employees).set({ status: "active", updatedAt: new Date() }).where(eq(employees.id, id));
    const employee = (await this.listEmployees(organizationId, branchIds)).find((item) => item.id === id);
    if (!employee) throw new Error("employee_update_failed");
    return employee;
  }

  async listLeaves(organizationId: string, branchIds?: ReadonlySet<string>): Promise<PersistedLeave[]> {
    const conditions = [eq(employeeLeaves.organizationId, organizationId)];
    if (branchIds?.size) conditions.push(inArray(employees.branchId, [...branchIds]));
    const rows = await this.db.select({ leave: employeeLeaves, employee: employees, user: users }).from(employeeLeaves).innerJoin(employees, eq(employeeLeaves.employeeId, employees.id)).innerJoin(users, eq(employees.userId, users.id)).where(and(...conditions)).orderBy(asc(employeeLeaves.startsAt), asc(employeeLeaves.id));
    return rows.map(({ leave, employee, user }) => ({ id: leave.id, organizationId: leave.organizationId, employeeId: employee.id, employeeName: user.displayName, startsAt: leave.startsAt.toISOString().slice(0, 10), endsAt: leave.endsAt.toISOString().slice(0, 10), days: leave.days, reason: leave.reason, status: leave.status }));
  }

  async requestLeave(input: { id: string; organizationId: string; employeeId: string; startsAt: Date; endsAt: Date; days: number; reason: string; branchIds?: ReadonlySet<string> }) {
    const employee = await this.db.select().from(employees).where(and(eq(employees.id, input.employeeId), eq(employees.organizationId, input.organizationId))).limit(1);
    if (!employee[0]) throw new Error("employee_not_found");
    if (input.branchIds?.size && (!employee[0].branchId || !input.branchIds.has(employee[0].branchId))) throw new Error("branch_scope_denied");
    await this.db.insert(employeeLeaves).values({ id: input.id, organizationId: input.organizationId, employeeId: input.employeeId, startsAt: input.startsAt, endsAt: input.endsAt, days: input.days, reason: input.reason, status: "requested" });
    const rows = await this.listLeaves(input.organizationId, input.branchIds);
    const created = rows.find((item) => item.id === input.id);
    if (!created) throw new Error("leave_create_failed");
    return created;
  }

  async transitionLeave(input: { organizationId: string; id: string; status: "approved" | "rejected"; approverUserId: string; branchIds?: ReadonlySet<string> }) {
    const existing = await this.db.select({ leave: employeeLeaves, employee: employees }).from(employeeLeaves).innerJoin(employees, eq(employeeLeaves.employeeId, employees.id)).where(and(eq(employeeLeaves.id, input.id), eq(employeeLeaves.organizationId, input.organizationId))).limit(1);
    if (!existing[0]) throw new Error("leave_not_found");
    if (input.branchIds?.size && (!existing[0].employee.branchId || !input.branchIds.has(existing[0].employee.branchId))) throw new Error("branch_scope_denied");
    if (existing[0].leave.status !== "requested") throw new Error("leave_invalid_transition");
    await this.db.update(employeeLeaves).set({ status: input.status, approvedByUserId: input.approverUserId, updatedAt: new Date() }).where(and(eq(employeeLeaves.id, input.id), eq(employeeLeaves.organizationId, input.organizationId)));
    const rows = await this.listLeaves(input.organizationId, input.branchIds);
    const updated = rows.find((item) => item.id === input.id);
    if (!updated) throw new Error("leave_update_failed");
    return updated;
  }
}
