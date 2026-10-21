import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { auditEvents } from "../../database/schema/identity-access";
import { branches } from "../organization-branch/schema";
import { employees, teacherAssignments } from "../hrm-teacher/schema";
import { academicClasses, academicSchedules, courses, enrollments, students } from "./schema";

export type AcademicRegistrySection = "classes" | "students" | "assignments";
export type AcademicRegistryRow = Record<string, string | number> & { id: string; branchId: string };
export type ScheduleInput = {
  id?: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  roomId?: string | null;
  teacherUserId?: string | null;
  onlineSessionKey?: string | null;
  status?: "draft" | "confirmed" | "cancelled";
};

type Database = NodePgDatabase<Record<string, never>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type ScheduleRow = { id: string; weekday: number; startsAt: string; endsAt: string; roomId: string | null; teacherUserId: string | null; onlineSessionKey: string | null; status: string };
type AuditSnapshot = Record<string, unknown> | null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID_RE.test(value);

function minutes(value: string): number {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value);
  if (!match) throw new Error("invalid_schedule_time");
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function scheduleOverlaps(left: Pick<ScheduleInput, "weekday" | "startsAt" | "endsAt">, right: Pick<ScheduleRow, "weekday" | "startsAt" | "endsAt">): boolean {
  if (left.weekday !== right.weekday) return false;
  const leftStart = minutes(left.startsAt);
  const leftEnd = minutes(left.endsAt);
  const rightStart = minutes(right.startsAt);
  const rightEnd = minutes(right.endsAt);
  if (leftEnd <= leftStart || rightEnd <= rightStart) throw new Error("invalid_schedule_range");
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function findScheduleConflict(schedule: ScheduleInput, existing: readonly ScheduleRow[], excludedIds = new Set<string>()) {
  if (!Number.isInteger(schedule.weekday) || schedule.weekday < 1 || schedule.weekday > 7) throw new Error("invalid_schedule_weekday");
  const startsAt = minutes(schedule.startsAt);
  const endsAt = minutes(schedule.endsAt);
  if (endsAt <= startsAt) throw new Error("invalid_schedule_range");
  return existing.find((candidate) => {
    if (excludedIds.has(candidate.id) || candidate.status === "cancelled") return false;
    if (!scheduleOverlaps(schedule, candidate)) return false;
    const sameRoom = Boolean(schedule.roomId && candidate.roomId && schedule.roomId === candidate.roomId);
    const sameTeacher = Boolean(schedule.teacherUserId && candidate.teacherUserId && schedule.teacherUserId === candidate.teacherUserId);
    const sameOnlineSession = Boolean(schedule.onlineSessionKey && candidate.onlineSessionKey && schedule.onlineSessionKey === candidate.onlineSessionKey);
    return sameRoom || sameTeacher || sameOnlineSession;
  });
}

export function teacherWorkloadWithinLimit(currentHours: number, proposedHours: number, limit = 40): boolean {
  return Number.isFinite(currentHours) && Number.isFinite(proposedHours) && currentHours >= 0 && proposedHours >= 0 && currentHours + proposedHours <= limit;
}

function snapshot(value: unknown): AuditSnapshot {
  if (!value || typeof value !== "object") return value == null ? null : { value };
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export class DrizzleAcademicRegistryRepository {
  constructor(private readonly db: Database) {}

  private async audit(tx: Transaction, input: { organizationId: string; userId?: string; action: string; entityType: string; entityId: string; before?: unknown; after?: unknown }) {
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId && isUuid(input.userId) ? input.userId : null,
      action: input.action,
      entityType: input.entityType,
      entityId: isUuid(input.entityId) ? input.entityId : null,
      beforeSnapshot: snapshot(input.before),
      afterSnapshot: snapshot(input.after),
      result: "success",
      correlationId: crypto.randomUUID(),
      occurredAt: new Date(),
      securityRelevant: false,
    });
  }

  private async validateSchedule(tx: Transaction, organizationId: string, schedule: ScheduleInput, excludedIds = new Set<string>()) {
    const schedules = await tx.select().from(academicSchedules).where(and(eq(academicSchedules.organizationId, organizationId), eq(academicSchedules.weekday, schedule.weekday)));
    const conflict = findScheduleConflict(schedule, schedules as ScheduleRow[], excludedIds);
    if (conflict) throw new Error("schedule_conflict");
  }

  private workloadLimit() {
    const configured = Number(process.env.TEACHER_WEEKLY_HOURS_LIMIT ?? 40);
    return Number.isFinite(configured) && configured > 0 ? configured : 40;
  }

  private async validateWorkload(tx: Transaction, organizationId: string, employeeId: string, weeklyHours: number, excludedAssignmentId?: string) {
    if (!Number.isFinite(weeklyHours) || weeklyHours < 0) throw new Error("invalid_weekly_hours");
    const assignments = await tx.select({ id: teacherAssignments.id, weeklyHours: teacherAssignments.weeklyHours, status: teacherAssignments.status }).from(teacherAssignments).where(and(eq(teacherAssignments.organizationId, organizationId), eq(teacherAssignments.employeeId, employeeId)));
    const current = assignments.reduce((total, item) => total + (item.id === excludedAssignmentId || item.status === "ended" ? 0 : item.weeklyHours), 0);
    if (!teacherWorkloadWithinLimit(current, weeklyHours, this.workloadLimit())) throw new Error("teacher_workload_exceeded");
  }

  private async validateAssignmentScheduleConflicts(tx: Transaction, organizationId: string, employeeId: string, classId: string, excludedAssignmentId?: string) {
    const employee = await tx.select({ userId: employees.userId }).from(employees).where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)));
    if (!employee[0]) throw new Error("employee_not_found");
    const ownAssignments = await tx.select({ id: teacherAssignments.id, classId: teacherAssignments.classId }).from(teacherAssignments).where(and(eq(teacherAssignments.organizationId, organizationId), eq(teacherAssignments.employeeId, employeeId)));
    const classIds = [...new Set([classId, ...ownAssignments.filter((item) => item.id !== excludedAssignmentId && item.classId !== classId).map((item) => item.classId)])];
    const schedules = classIds.length ? await tx.select().from(academicSchedules).where(and(eq(academicSchedules.organizationId, organizationId), inArray(academicSchedules.classId, classIds))) : [];
    const target = schedules.filter((item) => item.classId === classId && item.status !== "cancelled");
    const existing = schedules.filter((item) => item.classId !== classId && item.status !== "cancelled");
    for (const targetSchedule of target) {
      const asTeacher: ScheduleInput = { weekday: targetSchedule.weekday, startsAt: targetSchedule.startsAt, endsAt: targetSchedule.endsAt, roomId: targetSchedule.roomId, teacherUserId: employee[0].userId, onlineSessionKey: targetSchedule.onlineSessionKey };
      if (findScheduleConflict(asTeacher, existing as ScheduleRow[])) throw new Error("schedule_conflict");
    }
  }

  async list(organizationId: string, section: AcademicRegistrySection, branchIds?: ReadonlySet<string>): Promise<AcademicRegistryRow[]> {
    const branchFilter = branchIds?.size ? [...branchIds] : undefined;
    if (section === "classes") {
      const conditions = [eq(academicClasses.organizationId, organizationId)];
      if (branchFilter) conditions.push(inArray(academicClasses.branchId, branchFilter));
      const result = await this.db.select({ item: academicClasses, branch: branches.name, course: courses.name }).from(academicClasses).leftJoin(branches, eq(academicClasses.branchId, branches.id)).leftJoin(courses, eq(academicClasses.courseId, courses.id)).where(and(...conditions));
      return result.filter((row) => row.item.branchId).map(({ item, course }) => ({ id: item.id, branchId: item.branchId!, courseId: item.courseId, code: item.code, name: item.name, subject: course ?? "", schedule: "Theo lịch lớp", learners: item.enrolledCount, capacity: item.capacity, modality: item.modality, status: item.status }));
    }
    if (section === "students") {
      const result = await this.db.select({ student: students, enrollment: enrollments, class: academicClasses }).from(enrollments).innerJoin(students, eq(enrollments.studentId, students.id)).innerJoin(academicClasses, eq(enrollments.classId, academicClasses.id)).where(and(eq(enrollments.organizationId, organizationId), branchFilter ? inArray(academicClasses.branchId, branchFilter) : undefined));
      return result.filter((row) => row.class.branchId).map(({ student, enrollment, class: academicClass }) => ({ id: student.id, branchId: academicClass.branchId!, classId: academicClass.id, code: student.studentCode, name: student.fullName, className: academicClass.name, progress: enrollment.progressPercent, status: enrollment.status }));
    }
    const result = await this.db.select({ assignment: teacherAssignments, employee: employees, class: academicClasses }).from(teacherAssignments).innerJoin(employees, eq(teacherAssignments.employeeId, employees.id)).innerJoin(academicClasses, eq(teacherAssignments.classId, academicClasses.id)).where(and(eq(teacherAssignments.organizationId, organizationId), branchFilter ? inArray(academicClasses.branchId, branchFilter) : undefined));
    return result.filter((row) => row.class.branchId).map(({ assignment, employee, class: academicClass }) => ({ id: assignment.id, branchId: academicClass.branchId!, classId: academicClass.id, employeeId: employee.id, className: academicClass.name, teacher: employee.jobTitle, role: assignment.role, subject: "", sessions: assignment.weeklyHours, status: assignment.status }));
  }

  async options(organizationId: string, branchIds?: ReadonlySet<string>) {
    const branchFilter = branchIds?.size ? [...branchIds] : undefined;
    const classConditions = [eq(academicClasses.organizationId, organizationId)];
    if (branchFilter) classConditions.push(inArray(academicClasses.branchId, branchFilter));
    const employeeConditions = [eq(employees.organizationId, organizationId)];
    if (branchFilter) employeeConditions.push(inArray(employees.branchId, branchFilter));
    const [courseRows, classRows, employeeRows, branchRows] = await Promise.all([
      this.db.select({ id: courses.id, code: courses.code, name: courses.name }).from(courses).where(eq(courses.organizationId, organizationId)),
      this.db.select({ id: academicClasses.id, code: academicClasses.code, name: academicClasses.name, branchId: academicClasses.branchId, status: academicClasses.status }).from(academicClasses).where(and(...classConditions)),
      this.db.select({ id: employees.id, employeeCode: employees.employeeCode, jobTitle: employees.jobTitle, branchId: employees.branchId, status: employees.status }).from(employees).where(and(...employeeConditions)),
      this.db.select({ id: branches.id, name: branches.name }).from(branches).where(eq(branches.organizationId, organizationId)),
    ]);
    return { courses: courseRows, classes: classRows.filter((item) => item.status !== "cancelled"), employees: employeeRows.filter((item) => item.status === "active"), branches: branchRows.filter((item) => !branchFilter || branchFilter.includes(item.id)) };
  }

  async createClass(input: { id: string; organizationId: string; userId: string; branchId: string; courseId: string; code: string; name: string; modality: "onsite" | "online" | "hybrid"; capacity: number; schedule?: ScheduleInput }) {
    await this.db.transaction(async (tx) => {
      if (input.schedule) await this.validateSchedule(tx, input.organizationId, input.schedule);
      await tx.insert(academicClasses).values({ id: input.id, organizationId: input.organizationId, branchId: input.branchId, courseId: input.courseId, code: input.code, name: input.name, modality: input.modality, capacity: input.capacity, enrolledCount: 0, status: "open", createdByUserId: input.userId });
      if (input.schedule) await tx.insert(academicSchedules).values({ id: input.schedule.id && isUuid(input.schedule.id) ? input.schedule.id : crypto.randomUUID(), organizationId: input.organizationId, classId: input.id, weekday: input.schedule.weekday, startsAt: input.schedule.startsAt, endsAt: input.schedule.endsAt, roomId: input.schedule.roomId ?? null, teacherUserId: input.schedule.teacherUserId ?? null, onlineSessionKey: input.schedule.onlineSessionKey ?? null, status: input.schedule.status ?? "draft" });
      await this.audit(tx, { organizationId: input.organizationId, userId: input.userId, action: "academic.class.created", entityType: "academic_class", entityId: input.id, after: input });
    });
    return (await this.list(input.organizationId, "classes", new Set([input.branchId]))).find((row) => row.id === input.id);
  }

  async createStudent(input: { id: string; organizationId: string; userId: string; studentCode: string; fullName: string; classId: string; enrollmentCode: string }) {
    await this.db.transaction(async (tx) => {
      const classRows = await tx.select().from(academicClasses).where(and(eq(academicClasses.id, input.classId), eq(academicClasses.organizationId, input.organizationId)));
      if (!classRows[0]) throw new Error("class_not_found");
      if (classRows[0].status !== "open" && classRows[0].status !== "in_progress") throw new Error("class_not_open");
      if (classRows[0].enrolledCount >= classRows[0].capacity) throw new Error("capacity_exceeded");
      await tx.insert(students).values({ id: input.id, organizationId: input.organizationId, studentCode: input.studentCode, fullName: input.fullName, status: "active", createdByUserId: input.userId });
      await tx.insert(enrollments).values({ id: crypto.randomUUID(), organizationId: input.organizationId, studentId: input.id, classId: input.classId, enrollmentCode: input.enrollmentCode, status: "active", progressPercent: 0, completionState: "not_started", createdByUserId: input.userId, startedAt: new Date() });
      await tx.update(academicClasses).set({ enrolledCount: classRows[0].enrolledCount + 1, updatedAt: new Date() }).where(eq(academicClasses.id, input.classId));
      await this.audit(tx, { organizationId: input.organizationId, userId: input.userId, action: "academic.student.created", entityType: "student", entityId: input.id, after: input });
    });
    const rows = await this.list(input.organizationId, "students");
    return rows.find((row) => row.id === input.id);
  }

  async updateClass(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string>; name?: string; code?: string; capacity?: number; status?: "draft" | "open" | "full" | "in_progress" | "closed" | "cancelled"; schedule?: ScheduleInput }) {
    await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(academicClasses).where(and(eq(academicClasses.id, input.id), eq(academicClasses.organizationId, input.organizationId)));
      if (!existing[0] || (input.branchIds?.size && (!existing[0].branchId || !input.branchIds.has(existing[0].branchId)))) throw new Error("branch_scope_denied");
      if (input.capacity !== undefined && input.capacity < existing[0].enrolledCount) throw new Error("capacity_below_enrollment");
      if (input.schedule) {
        const classSchedules = await tx.select({ id: academicSchedules.id }).from(academicSchedules).where(and(eq(academicSchedules.organizationId, input.organizationId), eq(academicSchedules.classId, input.id)));
        const replacingSchedule = input.schedule.id && classSchedules.some((item) => item.id === input.schedule?.id) ? new Set([input.schedule.id]) : new Set<string>();
        await this.validateSchedule(tx, input.organizationId, input.schedule, replacingSchedule);
        if (input.schedule.id && isUuid(input.schedule.id) && classSchedules.some((item) => item.id === input.schedule?.id)) await tx.update(academicSchedules).set({ weekday: input.schedule.weekday, startsAt: input.schedule.startsAt, endsAt: input.schedule.endsAt, roomId: input.schedule.roomId ?? null, teacherUserId: input.schedule.teacherUserId ?? null, onlineSessionKey: input.schedule.onlineSessionKey ?? null, status: input.schedule.status ?? "draft", updatedAt: new Date() }).where(eq(academicSchedules.id, input.schedule.id));
        else await tx.insert(academicSchedules).values({ id: input.schedule.id && isUuid(input.schedule.id) ? input.schedule.id : crypto.randomUUID(), organizationId: input.organizationId, classId: input.id, weekday: input.schedule.weekday, startsAt: input.schedule.startsAt, endsAt: input.schedule.endsAt, roomId: input.schedule.roomId ?? null, teacherUserId: input.schedule.teacherUserId ?? null, onlineSessionKey: input.schedule.onlineSessionKey ?? null, status: input.schedule.status ?? "draft" });
      }
      await tx.update(academicClasses).set({ ...(input.name === undefined ? {} : { name: input.name }), ...(input.code === undefined ? {} : { code: input.code }), ...(input.capacity === undefined ? {} : { capacity: input.capacity }), ...(input.status === undefined ? {} : { status: input.status }), updatedAt: new Date() }).where(eq(academicClasses.id, input.id));
      await this.audit(tx, { organizationId: input.organizationId, userId: input.userId, action: input.status === "cancelled" ? "academic.class.archived" : "academic.class.updated", entityType: "academic_class", entityId: input.id, before: existing[0], after: input });
    });
    return (await this.list(input.organizationId, "classes", input.branchIds)).find((row) => row.id === input.id);
  }
  async archiveClass(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string> }) { return this.updateClass({ ...input, status: "cancelled" }); }

  async updateStudent(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string>; fullName?: string; displayName?: string; status?: "prospective" | "active" | "paused" | "graduated" | "archived" }) {
    await this.db.transaction(async (tx) => {
      const existing = await tx.select({ student: students, class: academicClasses }).from(students).innerJoin(enrollments, eq(enrollments.studentId, students.id)).innerJoin(academicClasses, eq(enrollments.classId, academicClasses.id)).where(and(eq(students.id, input.id), eq(students.organizationId, input.organizationId)));
      if (!existing[0] || (input.branchIds?.size && (!existing[0].class.branchId || !input.branchIds.has(existing[0].class.branchId)))) throw new Error("branch_scope_denied");
      await tx.update(students).set({ ...(input.fullName === undefined ? {} : { fullName: input.fullName }), ...(input.displayName === undefined ? {} : { displayName: input.displayName }), ...(input.status === undefined ? {} : { status: input.status }), updatedAt: new Date() }).where(eq(students.id, input.id));
      await this.audit(tx, { organizationId: input.organizationId, userId: input.userId, action: input.status === "archived" ? "academic.student.archived" : "academic.student.updated", entityType: "student", entityId: input.id, before: existing[0].student, after: input });
    });
    return (await this.list(input.organizationId, "students", input.branchIds)).find((row) => row.id === input.id);
  }
  async archiveStudent(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string> }) { return this.updateStudent({ ...input, status: "archived" }); }

  async updateAssignment(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string>; weeklyHours?: number; role?: string; status?: "active" | "ended" | "substitute_requested" | "substituted" }) {
    await this.db.transaction(async (tx) => {
      const existing = await tx.select({ assignment: teacherAssignments, class: academicClasses }).from(teacherAssignments).innerJoin(academicClasses, eq(teacherAssignments.classId, academicClasses.id)).where(and(eq(teacherAssignments.id, input.id), eq(teacherAssignments.organizationId, input.organizationId)));
      if (!existing[0] || (input.branchIds?.size && (!existing[0].class.branchId || !input.branchIds.has(existing[0].class.branchId)))) throw new Error("branch_scope_denied");
      const nextStatus = input.status ?? existing[0].assignment.status;
      const nextHours = input.weeklyHours ?? existing[0].assignment.weeklyHours;
      if (nextStatus !== "ended") {
        await this.validateWorkload(tx, input.organizationId, existing[0].assignment.employeeId, nextHours, input.id);
        await this.validateAssignmentScheduleConflicts(tx, input.organizationId, existing[0].assignment.employeeId, existing[0].assignment.classId, input.id);
      }
      await tx.update(teacherAssignments).set({ ...(input.weeklyHours === undefined ? {} : { weeklyHours: input.weeklyHours }), ...(input.role === undefined ? {} : { role: input.role }), ...(input.status === undefined ? {} : { status: input.status }), updatedAt: new Date() }).where(eq(teacherAssignments.id, input.id));
      await this.audit(tx, { organizationId: input.organizationId, userId: input.userId, action: nextStatus === "ended" ? "academic.assignment.archived" : "academic.assignment.updated", entityType: "teacher_assignment", entityId: input.id, before: existing[0].assignment, after: input });
    });
    return (await this.list(input.organizationId, "assignments", input.branchIds)).find((row) => row.id === input.id);
  }

  async createAssignment(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string>; employeeId: string; classId: string; role: string; weeklyHours: number; startsAt: Date }) {
    await this.db.transaction(async (tx) => {
      const classRows = await tx.select().from(academicClasses).where(and(eq(academicClasses.id, input.classId), eq(academicClasses.organizationId, input.organizationId)));
      if (!classRows[0]) throw new Error("class_not_found");
      if (input.branchIds?.size && (!classRows[0].branchId || !input.branchIds.has(classRows[0].branchId))) throw new Error("branch_scope_denied");
      await this.validateWorkload(tx, input.organizationId, input.employeeId, input.weeklyHours);
      await this.validateAssignmentScheduleConflicts(tx, input.organizationId, input.employeeId, input.classId);
      await tx.insert(teacherAssignments).values({ id: input.id, organizationId: input.organizationId, employeeId: input.employeeId, classId: input.classId, role: input.role, weeklyHours: input.weeklyHours, startsAt: input.startsAt, status: "active" });
      await this.audit(tx, { organizationId: input.organizationId, userId: input.userId, action: "academic.assignment.created", entityType: "teacher_assignment", entityId: input.id, after: input });
    });
    const rows = await this.list(input.organizationId, "assignments", input.branchIds);
    return rows.find((row) => row.id === input.id);
  }
  async archiveAssignment(input: { id: string; organizationId: string; userId?: string; branchIds?: ReadonlySet<string> }) { return this.updateAssignment({ ...input, status: "ended" }); }
}
