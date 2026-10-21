import "./load-env";
import { and, eq } from "drizzle-orm";
import { createDatabase, databaseConfigFromEnv } from "./client";
import { organizations, users } from "./schema/identity-access";
import { branches } from "../modules/organization-branch/schema";
import { departments, programs, courses, academicClasses, academicSchedules, students, enrollments } from "../modules/academic-learning/schema";
import { employees, teacherAssignments } from "../modules/hrm-teacher/schema";
import { stableFixtureId } from "@hnlms/test-fixtures";

const seedKey = process.env.ACADEMIC_SEED_KEY?.trim() || "hnlms-development-v1";
const uuid = (kind: string, key: string) => stableFixtureId(seedKey, kind, key);

type Database = ReturnType<typeof createDatabase>["db"];
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function ensureOrganization(tx: Tx) {
  const existing = await tx.select().from(organizations).where(eq(organizations.name, "Hanoi Learning Demo")).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(organizations).values({ id: uuid("organization", "HN"), name: "Hanoi Learning Demo", status: "active", timezone: "Asia/Ho_Chi_Minh", deploymentMode: "saas" }).returning();
  if (!created) throw new Error("academic_seed_organization_failed");
  return created;
}

async function ensureBranch(tx: Tx, organizationId: string) {
  const existing = await tx.select().from(branches).where(and(eq(branches.organizationId, organizationId), eq(branches.code, "DEMO-HN-NORTH"))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(branches).values({ id: uuid("branch", "DEMO-HN:NORTH"), organizationId, code: "DEMO-HN-NORTH", name: "Hanoi Learning Demo Cơ sở trung tâm", address: "12 Demo Street, Hà Nội", status: "active" }).returning();
  if (!created) throw new Error("academic_seed_branch_failed");
  return created;
}

async function ensureUser(tx: Tx, organizationId: string, key: string, email: string, displayName: string) {
  const existing = await tx.select().from(users).where(and(eq(users.organizationId, organizationId), eq(users.email, email))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(users).values({ id: uuid("persona", key), organizationId, email, displayName, status: "active", timezone: "Asia/Ho_Chi_Minh" }).returning();
  if (!created) throw new Error(`academic_seed_user_failed:${email}`);
  return created;
}

async function ensureDepartment(tx: Tx, organizationId: string, userId: string) {
  const existing = await tx.select().from(departments).where(and(eq(departments.organizationId, organizationId), eq(departments.code, "DEMO-ACADEMIC"))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(departments).values({ id: uuid("department", "DEMO-ACADEMIC"), organizationId, code: "DEMO-ACADEMIC", name: "Đào tạo đa ngành", status: "published" }).returning();
  if (!created) throw new Error("academic_seed_department_failed");
  return created;
}

async function ensureProgram(tx: Tx, organizationId: string, departmentId: string, userId: string, code: string, name: string) {
  const existing = await tx.select().from(programs).where(and(eq(programs.organizationId, organizationId), eq(programs.code, code))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(programs).values({ id: uuid("program", code), organizationId, departmentId, code, name, description: `Chương trình demo ${name}`, objectives: { domains: ["kiến thức", "kỹ năng", "thực hành"] }, completionRules: { minimumProgressPercent: 80 }, status: "published", version: 1, createdByUserId: userId }).returning();
  if (!created) throw new Error(`academic_seed_program_failed:${code}`);
  return created;
}

async function ensureCourse(tx: Tx, organizationId: string, programId: string, userId: string, code: string, name: string, durationWeeks: number) {
  const existing = await tx.select().from(courses).where(and(eq(courses.organizationId, organizationId), eq(courses.code, code))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(courses).values({ id: uuid("course", code), organizationId, programId, code, name, description: `Khóa học demo ${name}`, durationWeeks, status: "published", createdByUserId: userId }).returning();
  if (!created) throw new Error(`academic_seed_course_failed:${code}`);
  return created;
}

async function ensureClass(tx: Tx, input: { organizationId: string; branchId: string; courseId: string; userId: string; code: string; name: string; capacity: number; teacherUserId: string }) {
  const existing = await tx.select().from(academicClasses).where(and(eq(academicClasses.organizationId, input.organizationId), eq(academicClasses.code, input.code))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(academicClasses).values({ id: uuid("class", input.code), organizationId: input.organizationId, courseId: input.courseId, branchId: input.branchId, code: input.code, name: input.name, modality: "onsite", capacity: input.capacity, enrolledCount: 0, leadTeacherUserId: input.teacherUserId, status: "in_progress", createdByUserId: input.userId }).returning();
  if (!created) throw new Error(`academic_seed_class_failed:${input.code}`);
  return created;
}

async function ensureSchedule(tx: Tx, input: { organizationId: string; classId: string; teacherUserId: string; key: string; weekday: number; startsAt: string; endsAt: string; roomId: string }) {
  const existing = await tx.select().from(academicSchedules).where(and(eq(academicSchedules.organizationId, input.organizationId), eq(academicSchedules.classId, input.classId), eq(academicSchedules.weekday, input.weekday), eq(academicSchedules.startsAt, input.startsAt))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(academicSchedules).values({ id: uuid("schedule", input.key), organizationId: input.organizationId, classId: input.classId, weekday: input.weekday, startsAt: input.startsAt, endsAt: input.endsAt, roomId: input.roomId, teacherUserId: input.teacherUserId, status: "confirmed" }).returning();
  if (!created) throw new Error(`academic_seed_schedule_failed:${input.key}`);
  return created;
}

async function ensureEmployee(tx: Tx, organizationId: string, branchId: string, userId: string, code: string, title: string) {
  const existing = await tx.select().from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.employeeCode, code))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(employees).values({ id: uuid("employee", code), organizationId, userId, employeeCode: code, jobTitle: title, branchId, status: "active", hireDate: new Date("2025-01-01T00:00:00.000Z") }).returning();
  if (!created) throw new Error(`academic_seed_employee_failed:${code}`);
  return created;
}

async function ensureStudentAndEnrollment(tx: Tx, input: { organizationId: string; userId: string; classId: string; studentId: string; code: string; name: string; enrollmentCode: string }) {
  const existingStudent = await tx.select().from(students).where(and(eq(students.organizationId, input.organizationId), eq(students.studentCode, input.code))).limit(1);
  const student = existingStudent[0] ?? (await tx.insert(students).values({ id: input.studentId, organizationId: input.organizationId, userId: input.userId, studentCode: input.code, fullName: input.name, displayName: input.name, status: "active", createdByUserId: input.userId }).returning())[0];
  if (!student) throw new Error("academic_seed_student_failed");
  const existingEnrollment = await tx.select().from(enrollments).where(and(eq(enrollments.organizationId, input.organizationId), eq(enrollments.studentId, student.id), eq(enrollments.classId, input.classId))).limit(1);
  if (!existingEnrollment[0]) await tx.insert(enrollments).values({ id: uuid("enrollment", input.enrollmentCode), organizationId: input.organizationId, studentId: student.id, classId: input.classId, enrollmentCode: input.enrollmentCode, status: "active", progressPercent: 42, completionState: "in_progress", createdByUserId: input.userId, startedAt: new Date("2026-08-01T00:00:00.000Z") });
  return student;
}

async function ensureAssignment(tx: Tx, organizationId: string, employeeId: string, classId: string, userId: string, code: string, weeklyHours: number) {
  const existing = await tx.select().from(teacherAssignments).where(and(eq(teacherAssignments.organizationId, organizationId), eq(teacherAssignments.employeeId, employeeId), eq(teacherAssignments.classId, classId))).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await tx.insert(teacherAssignments).values({ id: uuid("assignment", code), organizationId, employeeId, classId, role: "teacher", weeklyHours, status: "active", startsAt: new Date("2026-08-01T00:00:00.000Z") }).returning();
  if (!created) throw new Error(`academic_seed_assignment_failed:${code}`);
  return created;
}

export async function seedAcademicRegistry(db: Database) {
  return db.transaction(async (tx) => {
    const organization = await ensureOrganization(tx);
    const branch = await ensureBranch(tx, organization.id);
    const manager = await ensureUser(tx, organization.id, "DEMO-HN:branch_manager", "branch-manager.demo@example.test", "Quản lý cơ sở Demo");
    const teacher = await ensureUser(tx, organization.id, "DEMO-HN:teacher", "teacher.demo@example.test", "Lan Anh");
    const assistant = await ensureUser(tx, organization.id, "DEMO-HN:assistant", "assistant.demo@example.test", "Minh Tuấn");
    const studentUser = await ensureUser(tx, organization.id, "DEMO-HN:student", "student.demo@example.test", "Nguyễn Minh Anh");
    const department = await ensureDepartment(tx, organization.id, manager.id);
    const englishProgram = await ensureProgram(tx, organization.id, department.id, manager.id, "DEMO-ENGLISH", "Ngoại ngữ");
    const mathProgram = await ensureProgram(tx, organization.id, department.id, manager.id, "DEMO-MATH", "Toán");
    const englishCourse = await ensureCourse(tx, organization.id, englishProgram.id, manager.id, "IF-2609", "IELTS Foundation", 12);
    const mathCourse = await ensureCourse(tx, organization.id, mathProgram.id, manager.id, "MATH-2609", "Toán nền tảng", 12);
    const englishClass = await ensureClass(tx, { organizationId: organization.id, branchId: branch.id, courseId: englishCourse.id, userId: manager.id, code: "IF-2609", name: "IELTS Foundation", capacity: 24, teacherUserId: teacher.id });
    const mathClass = await ensureClass(tx, { organizationId: organization.id, branchId: branch.id, courseId: mathCourse.id, userId: manager.id, code: "MATH-2609", name: "Toán nền tảng", capacity: 20, teacherUserId: teacher.id });
    await ensureSchedule(tx, { organizationId: organization.id, classId: englishClass.id, teacherUserId: teacher.id, key: "IF-2609:T2", weekday: 2, startsAt: "18:00", endsAt: "19:30", roomId: "HN-101" });
    await ensureSchedule(tx, { organizationId: organization.id, classId: englishClass.id, teacherUserId: teacher.id, key: "IF-2609:T4", weekday: 4, startsAt: "18:00", endsAt: "19:30", roomId: "HN-101" });
    await ensureSchedule(tx, { organizationId: organization.id, classId: mathClass.id, teacherUserId: teacher.id, key: "MATH-2609:T3", weekday: 3, startsAt: "17:30", endsAt: "19:00", roomId: "HN-102" });
    const teacherEmployee = await ensureEmployee(tx, organization.id, branch.id, teacher.id, "GV-DEMO-001", "Giảng viên IELTS");
    const assistantEmployee = await ensureEmployee(tx, organization.id, branch.id, assistant.id, "TA-DEMO-001", "Trợ giảng TOEIC");
    await ensureAssignment(tx, organization.id, teacherEmployee.id, englishClass.id, manager.id, "IF-2609:teacher", 3);
    await ensureAssignment(tx, organization.id, teacherEmployee.id, mathClass.id, manager.id, "MATH-2609:teacher", 2);
    await ensureAssignment(tx, organization.id, assistantEmployee.id, englishClass.id, manager.id, "IF-2609:assistant", 2);
    await ensureStudentAndEnrollment(tx, { organizationId: organization.id, userId: studentUser.id, classId: englishClass.id, studentId: uuid("student", "DEMO-HN:student"), code: "HV-DEMO-001", name: "Nguyễn Minh Anh", enrollmentCode: "ENR-DEMO-IF-2609" });
    const activeEnrollments = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.organizationId, organization.id), eq(enrollments.classId, englishClass.id), eq(enrollments.status, "active")));
    await tx.update(academicClasses).set({ enrolledCount: activeEnrollments.length, updatedAt: new Date() }).where(eq(academicClasses.id, englishClass.id));
    return { seedKey, organizationId: organization.id, branchId: branch.id, classes: [englishClass.id, mathClass.id], employees: [teacherEmployee.id, assistantEmployee.id] };
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("development_academic_seed_forbidden_in_production");
  const { db, pool } = createDatabase(databaseConfigFromEnv());
  try { console.log(JSON.stringify(await seedAcademicRegistry(db))); } finally { await pool.end(); }
}

if (process.argv.includes("--run")) void main();
