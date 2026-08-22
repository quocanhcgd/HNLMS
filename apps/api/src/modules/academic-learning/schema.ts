import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { branches } from "../organization-branch/schema";

export const academicPublicationStatus = pgEnum("academic_publication_status", ["draft", "published", "retired"]);
export const academicCourseStatus = pgEnum("academic_course_status", ["draft", "published", "retired"]);
export const academicClassStatus = pgEnum("academic_class_status", [
  "draft",
  "open",
  "full",
  "in_progress",
  "closed",
  "cancelled",
]);
export const academicModality = pgEnum("academic_modality", ["onsite", "online", "hybrid"]);
export const academicScheduleStatus = pgEnum("academic_schedule_status", ["draft", "confirmed", "cancelled"]);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    status: academicPublicationStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("departments_organization_code_unique").on(table.organizationId, table.code),
  }),
);

export const programs = pgTable(
  "academic_programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    objectives: jsonb("objectives"),
    completionRules: jsonb("completion_rules"),
    status: academicPublicationStatus("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("academic_programs_organization_code_unique").on(
      table.organizationId,
      table.code,
    ),
    organizationStatusIndex: index("academic_programs_organization_status_index").on(
      table.organizationId,
      table.status,
    ),
  }),
);

export const courses = pgTable(
  "academic_courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    durationWeeks: integer("duration_weeks").notNull(),
    status: academicCourseStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("academic_courses_organization_code_unique").on(
      table.organizationId,
      table.code,
    ),
    programIndex: index("academic_courses_program_index").on(table.organizationId, table.programId),
  }),
);

export const academicModules = pgTable(
  "academic_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    completionRules: jsonb("completion_rules"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    coursePositionUnique: uniqueIndex("academic_modules_course_position_unique").on(table.courseId, table.position),
    courseCodeUnique: uniqueIndex("academic_modules_course_code_unique").on(table.courseId, table.code),
  }),
);

export const academicClasses = pgTable(
  "academic_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    branchId: uuid("branch_id").references(() => branches.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    modality: academicModality("modality").notNull(),
    capacity: integer("capacity").notNull(),
    enrolledCount: integer("enrolled_count").notNull().default(0),
    leadTeacherUserId: uuid("lead_teacher_user_id").references(() => users.id),
    status: academicClassStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("academic_classes_organization_code_unique").on(
      table.organizationId,
      table.code,
    ),
    branchStatusIndex: index("academic_classes_branch_status_index").on(
      table.organizationId,
      table.branchId,
      table.status,
    ),
  }),
);

export const academicSchedules = pgTable(
  "academic_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    classId: uuid("class_id")
      .notNull()
      .references(() => academicClasses.id),
    weekday: integer("weekday").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    roomId: text("room_id"),
    teacherUserId: uuid("teacher_user_id").references(() => users.id),
    onlineSessionKey: text("online_session_key"),
    status: academicScheduleStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    classIndex: index("academic_schedules_class_index").on(table.organizationId, table.classId),
    resourceIndex: index("academic_schedules_resource_index").on(
      table.organizationId,
      table.weekday,
      table.startsAt,
      table.endsAt,
    ),
  }),
);

export type DepartmentRow = typeof departments.$inferSelect;
export type ProgramRow = typeof programs.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type AcademicModuleRow = typeof academicModules.$inferSelect;
export type AcademicClassRow = typeof academicClasses.$inferSelect;
export type AcademicScheduleRow = typeof academicSchedules.$inferSelect;
