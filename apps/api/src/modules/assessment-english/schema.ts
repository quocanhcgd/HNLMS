import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { leads } from "../marketing-admission/schema";

// ── Enums ──────────────────────────────────────────────────────────────

export const assessmentKind = pgEnum("assessment_kind", ["entrance", "mock", "practice"]);

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

// ── Tables ─────────────────────────────────────────────────────────────

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
    kind: assessmentKind("kind").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    status: assessmentStatus("status").notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationStatusIndex: index("assessments_organization_status_index").on(table.organizationId, table.status),
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

/**
 * Results published after an assessment attempt is graded.
 * Each result is linked back to exactly one assessment.
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
    publicationStatus: assessmentResultPublicationStatus("publication_status").notNull().default("draft"),
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
  }),
);

// ── Derived types ──────────────────────────────────────────────────────

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type AssessmentAssignment = typeof assessmentAssignments.$inferSelect;
export type NewAssessmentAssignment = typeof assessmentAssignments.$inferInsert;
export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type NewAssessmentResult = typeof assessmentResults.$inferInsert;
