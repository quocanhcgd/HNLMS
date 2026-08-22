import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { leads } from "../marketing-admission/schema";

// ── Enums ──────────────────────────────────────────────────────────────

export const assessmentKind = pgEnum("assessment_kind", ["entrance", "mock", "practice"]);

export const assessmentBankStatus = pgEnum("assessment_bank_status", ["draft", "active", "archived"]);

export const assessmentQuestionType = pgEnum("assessment_question_type", [
  "single_choice",
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
  "speaking",
  "listening",
]);

export const assessmentQuestionStatus = pgEnum("assessment_question_status", [
  "draft",
  "in_review",
  "approved",
  "retired",
]);

export const assessmentStatus = pgEnum("assessment_status", ["draft", "published", "retired"]);

export const assessmentAssignmentStatus = pgEnum("assessment_assignment_status", [
  "assigned",
  "started",
  "completed",
  "expired",
  "cancelled",
]);

export const assessmentInvitationChannel = pgEnum("assessment_invitation_channel", ["email", "sms", "manual"]);

export const assessmentResultPublicationStatus = pgEnum("assessment_result_publication_status", ["draft", "published"]);

export const assessmentAttemptStatus = pgEnum("assessment_attempt_status", [
  "created",
  "in_progress",
  "submitted",
  "auto_submitted",
  "graded",
  "voided",
]);

// ── Tables ─────────────────────────────────────────────────────────────

/**
 * Tenant-scoped question banks for English placement/mock/practice assessments.
 * Banks are managed by internal academic/content staff under /admin, while
 * delivery and review surfaces are exposed later through teacher/student workspaces.
 */
export const assessmentBanks = pgTable(
  "assessment_banks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    skillScope: jsonb("skill_scope"),
    levelScope: jsonb("level_scope"),
    status: assessmentBankStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("assessment_banks_organization_code_unique").on(
      table.organizationId,
      table.code,
    ),
    organizationStatusIndex: index("assessment_banks_organization_status_index").on(table.organizationId, table.status),
  }),
);

export const assessmentQuestions = pgTable(
  "assessment_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    bankId: uuid("bank_id")
      .notNull()
      .references(() => assessmentBanks.id),
    questionCode: text("question_code").notNull(),
    type: assessmentQuestionType("type").notNull(),
    skill: text("skill").notNull(),
    level: text("level"),
    tags: jsonb("tags"),
    currentVersion: integer("current_version").notNull().default(1),
    status: assessmentQuestionStatus("status").notNull().default("draft"),
    isReusable: boolean("is_reusable").notNull().default(true),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bankCodeUnique: uniqueIndex("assessment_questions_bank_code_unique").on(table.bankId, table.questionCode),
    organizationBankStatusIndex: index("assessment_questions_organization_bank_status_index").on(
      table.organizationId,
      table.bankId,
      table.status,
    ),
    organizationSkillIndex: index("assessment_questions_organization_skill_index").on(
      table.organizationId,
      table.skill,
      table.level,
    ),
  }),
);

export const assessmentQuestionVersions = pgTable(
  "assessment_question_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => assessmentQuestions.id),
    version: integer("version").notNull(),
    prompt: jsonb("prompt").notNull(),
    choices: jsonb("choices"),
    answerKey: jsonb("answer_key"),
    scoringRubric: jsonb("scoring_rubric"),
    explanation: jsonb("explanation"),
    assetRefs: jsonb("asset_refs"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    questionVersionUnique: uniqueIndex("assessment_question_versions_question_version_unique").on(
      table.questionId,
      table.version,
    ),
    organizationQuestionIndex: index("assessment_question_versions_organization_question_index").on(
      table.organizationId,
      table.questionId,
    ),
  }),
);

/**
 * Assessments available for entrance testing, mock practice, etc.
 * Each assessment belongs to a single organization (tenant-scoped).
 */
export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    bankId: uuid("bank_id").references(() => assessmentBanks.id),
    kind: assessmentKind("kind").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    maxAttempts: integer("max_attempts").notNull().default(1),
    blueprint: jsonb("blueprint"),
    scoringPolicy: jsonb("scoring_policy"),
    publicationPolicy: jsonb("publication_policy"),
    status: assessmentStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStatusIndex: index("assessments_organization_status_index").on(table.organizationId, table.status),
    organizationBankIndex: index("assessments_organization_bank_index").on(table.organizationId, table.bankId),
  }),
);

/**
 * Links a lead to an entrance assessment assignment.
 * One lead may receive multiple assignments over time; only the latest
 * active one is meaningful for the admission flow.
 */
export const assessmentAssignments = pgTable(
  "assessment_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id),
    assignedByUserId: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id),
    clientAssignmentKey: text("client_assignment_key").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    status: assessmentAssignmentStatus("status").notNull().default("assigned"),
    invitationChannel: assessmentInvitationChannel("invitation_channel").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    resultId: uuid("result_id"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationKeyIndex: index("assessment_assignments_organization_key_index").on(
      table.organizationId,
      table.clientAssignmentKey,
    ),
    organizationLeadIndex: index("assessment_assignments_organization_lead_index").on(
      table.organizationId,
      table.leadId,
    ),
    organizationAssessmentIndex: index("assessment_assignments_organization_assessment_index").on(
      table.organizationId,
      table.assessmentId,
    ),
  }),
);

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id),
    assignmentId: uuid("assignment_id").references(() => assessmentAssignments.id),
    participantUserId: uuid("participant_user_id").references(() => users.id),
    leadId: uuid("lead_id").references(() => leads.id),
    attemptNo: integer("attempt_no").notNull().default(1),
    clientAttemptKey: text("client_attempt_key").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    status: assessmentAttemptStatus("status").notNull().default("created"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    answers: jsonb("answers"),
    autosaveState: jsonb("autosave_state"),
    rawScore: integer("raw_score"),
    maxScore: integer("max_score"),
    gradedByUserId: uuid("graded_by_user_id").references(() => users.id),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationClientKeyUnique: uniqueIndex("assessment_attempts_organization_client_key_unique").on(
      table.organizationId,
      table.clientAttemptKey,
    ),
    organizationAssessmentIndex: index("assessment_attempts_organization_assessment_index").on(
      table.organizationId,
      table.assessmentId,
      table.status,
    ),
    participantIndex: index("assessment_attempts_participant_index").on(
      table.organizationId,
      table.participantUserId,
      table.leadId,
    ),
  }),
);

/**
 * Results published after an assessment attempt is graded.
 * Each result is linked back to exactly one assessment and may reference
 * a concrete attempt when created through the Phase 11 engine.
 */
export const assessmentResults = pgTable(
  "assessment_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id),
    attemptId: uuid("attempt_id").references(() => assessmentAttempts.id),
    publicationStatus: assessmentResultPublicationStatus("publication_status").notNull().default("draft"),
    rawScore: integer("raw_score"),
    maxScore: integer("max_score"),
    scaledScore: integer("scaled_score"),
    skillBreakdown: jsonb("skill_breakdown"),
    recommendation: jsonb("recommendation"),
    recommendedProgramId: text("recommended_program_id"),
    recommendedClassId: text("recommended_class_id"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationAssessmentIndex: index("assessment_results_organization_assessment_index").on(
      table.organizationId,
      table.assessmentId,
    ),
    organizationAttemptIndex: index("assessment_results_organization_attempt_index").on(
      table.organizationId,
      table.attemptId,
    ),
  }),
);

// ── Derived types ──────────────────────────────────────────────────────

export type AssessmentBank = typeof assessmentBanks.$inferSelect;
export type NewAssessmentBank = typeof assessmentBanks.$inferInsert;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type NewAssessmentQuestion = typeof assessmentQuestions.$inferInsert;
export type AssessmentQuestionVersion = typeof assessmentQuestionVersions.$inferSelect;
export type NewAssessmentQuestionVersion = typeof assessmentQuestionVersions.$inferInsert;
export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type AssessmentAssignment = typeof assessmentAssignments.$inferSelect;
export type NewAssessmentAssignment = typeof assessmentAssignments.$inferInsert;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type NewAssessmentAttempt = typeof assessmentAttempts.$inferInsert;
export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type NewAssessmentResult = typeof assessmentResults.$inferInsert;
