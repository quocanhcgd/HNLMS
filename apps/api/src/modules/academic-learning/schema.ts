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
export const learningContentType = pgEnum("learning_content_type", [
  "lesson",
  "video",
  "exercise",
  "document",
  "quiz",
  "assignment",
]);
export const learningContentStatus = pgEnum("learning_content_status", ["draft", "in_review", "published", "retired"]);
export const libraryResourceKind = pgEnum("library_resource_kind", [
  "document",
  "video",
  "audio",
  "image",
  "slide",
  "link",
  "attachment",
]);
export const libraryResourceStatus = pgEnum("library_resource_status", ["draft", "in_review", "published", "retired"]);
export const resourceAccessScope = pgEnum("resource_access_scope", [
  "organization",
  "department",
  "program",
  "course",
  "class",
  "restricted",
]);
export const fileProcessingStatus = pgEnum("file_processing_status", [
  "pending",
  "processing",
  "ready",
  "failed",
  "quarantined",
]);
export const studentStatus = pgEnum("student_status", ["prospective", "active", "paused", "graduated", "archived"]);
export const enrollmentStatus = pgEnum("enrollment_status", [
  "pending",
  "active",
  "completed",
  "cancelled",
  "withdrawn",
]);
export const enrollmentCompletionState = pgEnum("enrollment_completion_state", [
  "not_started",
  "in_progress",
  "completed",
  "at_risk",
]);

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

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id").references(() => users.id),
    studentCode: text("student_code").notNull(),
    fullName: text("full_name").notNull(),
    displayName: text("display_name"),
    dateOfBirth: text("date_of_birth"),
    guardianContact: jsonb("guardian_contact"),
    privacyFlags: jsonb("privacy_flags"),
    status: studentStatus("status").notNull().default("active"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("students_organization_code_unique").on(
      table.organizationId,
      table.studentCode,
    ),
    organizationUserUnique: uniqueIndex("students_organization_user_unique").on(table.organizationId, table.userId),
    organizationStatusIndex: index("students_organization_status_index").on(table.organizationId, table.status),
  }),
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    classId: uuid("class_id")
      .notNull()
      .references(() => academicClasses.id),
    enrollmentCode: text("enrollment_code").notNull(),
    status: enrollmentStatus("status").notNull().default("pending"),
    progressPercent: integer("progress_percent").notNull().default(0),
    completionState: enrollmentCompletionState("completion_state").notNull().default("not_started"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    financeReferenceId: text("finance_reference_id"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    studentClassUnique: uniqueIndex("enrollments_student_class_unique").on(table.studentId, table.classId),
    organizationCodeUnique: uniqueIndex("enrollments_organization_code_unique").on(
      table.organizationId,
      table.enrollmentCode,
    ),
    organizationStatusIndex: index("enrollments_organization_status_index").on(table.organizationId, table.status),
    classStatusIndex: index("enrollments_class_status_index").on(table.organizationId, table.classId, table.status),
  }),
);

export const fileAssets = pgTable(
  "file_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    metadata: jsonb("metadata"),
    processingStatus: fileProcessingStatus("processing_status").notNull().default("pending"),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStorageKeyUnique: uniqueIndex("file_assets_organization_storage_key_unique").on(
      table.organizationId,
      table.storageKey,
    ),
    organizationChecksumIndex: index("file_assets_organization_checksum_index").on(
      table.organizationId,
      table.checksumSha256,
    ),
    organizationProcessingStatusIndex: index("file_assets_organization_processing_status_index").on(
      table.organizationId,
      table.processingStatus,
    ),
  }),
);

export const learningContents = pgTable(
  "learning_contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    locale: text("locale").notNull().default("vi"),
    contentType: learningContentType("content_type").notNull(),
    currentVersion: integer("current_version").notNull().default(1),
    status: learningContentStatus("status").notNull().default("draft"),
    accessScope: resourceAccessScope("access_scope").notNull().default("organization"),
    departmentId: uuid("department_id").references(() => departments.id),
    programId: uuid("program_id").references(() => programs.id),
    courseId: uuid("course_id").references(() => courses.id),
    classId: uuid("class_id").references(() => academicClasses.id),
    tags: jsonb("tags"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedByUserId: uuid("published_by_user_id").references(() => users.id),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStatusIndex: index("learning_contents_organization_status_index").on(
      table.organizationId,
      table.status,
      table.contentType,
    ),
    organizationScopeIndex: index("learning_contents_organization_scope_index").on(
      table.organizationId,
      table.accessScope,
      table.programId,
      table.courseId,
      table.classId,
    ),
    ownerIndex: index("learning_contents_owner_index").on(table.organizationId, table.ownerUserId),
  }),
);

export const learningContentVersions = pgTable(
  "learning_content_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    learningContentId: uuid("learning_content_id")
      .notNull()
      .references(() => learningContents.id),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    document: jsonb("document").notNull(),
    assetRefs: jsonb("asset_refs"),
    changeSummary: text("change_summary"),
    status: learningContentStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentVersionUnique: uniqueIndex("learning_content_versions_content_version_unique").on(
      table.learningContentId,
      table.version,
    ),
    organizationContentIndex: index("learning_content_versions_organization_content_index").on(
      table.organizationId,
      table.learningContentId,
    ),
  }),
);

export const libraryResources = pgTable(
  "library_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    title: text("title").notNull(),
    description: text("description"),
    kind: libraryResourceKind("kind").notNull(),
    category: text("category").notNull(),
    subject: text("subject"),
    locale: text("locale").notNull().default("vi"),
    currentVersion: integer("current_version").notNull().default(1),
    status: libraryResourceStatus("status").notNull().default("draft"),
    accessScope: resourceAccessScope("access_scope").notNull().default("organization"),
    departmentId: uuid("department_id").references(() => departments.id),
    programId: uuid("program_id").references(() => programs.id),
    courseId: uuid("course_id").references(() => courses.id),
    classId: uuid("class_id").references(() => academicClasses.id),
    usagePolicy: jsonb("usage_policy"),
    tags: jsonb("tags"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedByUserId: uuid("published_by_user_id").references(() => users.id),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStatusIndex: index("library_resources_organization_status_index").on(
      table.organizationId,
      table.status,
      table.kind,
    ),
    organizationCategoryIndex: index("library_resources_organization_category_index").on(
      table.organizationId,
      table.category,
      table.subject,
    ),
    organizationScopeIndex: index("library_resources_organization_scope_index").on(
      table.organizationId,
      table.accessScope,
      table.programId,
      table.courseId,
      table.classId,
    ),
  }),
);

export const libraryResourceVersions = pgTable(
  "library_resource_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    libraryResourceId: uuid("library_resource_id")
      .notNull()
      .references(() => libraryResources.id),
    version: integer("version").notNull(),
    fileAssetId: uuid("file_asset_id").references(() => fileAssets.id),
    externalUrl: text("external_url"),
    metadata: jsonb("metadata"),
    changeSummary: text("change_summary"),
    status: libraryResourceStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    resourceVersionUnique: uniqueIndex("library_resource_versions_resource_version_unique").on(
      table.libraryResourceId,
      table.version,
    ),
    organizationResourceIndex: index("library_resource_versions_organization_resource_index").on(
      table.organizationId,
      table.libraryResourceId,
    ),
    fileAssetIndex: index("library_resource_versions_file_asset_index").on(table.organizationId, table.fileAssetId),
  }),
);

export const savedLibraryResources = pgTable(
  "saved_library_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    libraryResourceId: uuid("library_resource_id")
      .notNull()
      .references(() => libraryResources.id),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userResourceUnique: uniqueIndex("saved_library_resources_user_resource_unique").on(
      table.userId,
      table.libraryResourceId,
    ),
    organizationUserIndex: index("saved_library_resources_organization_user_index").on(
      table.organizationId,
      table.userId,
    ),
  }),
);

export type DepartmentRow = typeof departments.$inferSelect;
export type ProgramRow = typeof programs.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type AcademicModuleRow = typeof academicModules.$inferSelect;
export type AcademicClassRow = typeof academicClasses.$inferSelect;
export type AcademicScheduleRow = typeof academicSchedules.$inferSelect;
export type StudentRow = typeof students.$inferSelect;
export type NewStudentRow = typeof students.$inferInsert;
export type EnrollmentRow = typeof enrollments.$inferSelect;
export type NewEnrollmentRow = typeof enrollments.$inferInsert;
export type FileAssetRow = typeof fileAssets.$inferSelect;
export type NewFileAssetRow = typeof fileAssets.$inferInsert;
export type LearningContentRow = typeof learningContents.$inferSelect;
export type NewLearningContentRow = typeof learningContents.$inferInsert;
export type LearningContentVersionRow = typeof learningContentVersions.$inferSelect;
export type NewLearningContentVersionRow = typeof learningContentVersions.$inferInsert;
export type LibraryResourceRow = typeof libraryResources.$inferSelect;
export type NewLibraryResourceRow = typeof libraryResources.$inferInsert;
export type LibraryResourceVersionRow = typeof libraryResourceVersions.$inferSelect;
export type NewLibraryResourceVersionRow = typeof libraryResourceVersions.$inferInsert;
export type SavedLibraryResourceRow = typeof savedLibraryResources.$inferSelect;
export type NewSavedLibraryResourceRow = typeof savedLibraryResources.$inferInsert;
