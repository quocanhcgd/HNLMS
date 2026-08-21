import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { branches } from "../organization-branch/schema";

export const landingContentStatus = pgEnum("landing_content_status", ["draft", "review", "published", "revoked"]);

export const landingContentKind = pgEnum("landing_content_kind", [
  "page",
  "course",
  "instructor",
  "studentHighlight",
  "news",
  "announcement",
  "cta",
]);

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "consulting",
  "awaiting_assessment",
  "class_proposed",
  "enrolled",
  "disqualified",
  "archived",
]);

export const leadAssignmentStatus = pgEnum("lead_assignment_status", [
  "active",
  "transferred",
  "completed",
  "cancelled",
]);

export const landingContents = pgTable(
  "landing_contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    kind: landingContentKind("kind").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    body: jsonb("body"),
    media: jsonb("media"),
    locale: text("locale").notNull().default("vi"),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    status: landingContentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    publishedByUserId: uuid("published_by_user_id").references(() => users.id),
    revokedByUserId: uuid("revoked_by_user_id").references(() => users.id),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationSlugVersionUnique: uniqueIndex("landing_contents_organization_slug_version_unique").on(
      table.organizationId,
      table.slug,
      table.version,
    ),
    publicListingIndex: index("landing_contents_public_listing_index").on(
      table.organizationId,
      table.status,
      table.kind,
      table.sortOrder,
    ),
  }),
);

export type LandingContent = typeof landingContents.$inferSelect;
export type NewLandingContent = typeof landingContents.$inferInsert;

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    normalizedPhone: text("normalized_phone").notNull(),
    email: text("email"),
    normalizedEmail: text("normalized_email"),
    source: text("source").notNull(),
    sourceDetails: jsonb("source_details"),
    interest: text("interest").notNull(),
    interestedBranchId: uuid("interested_branch_id").references(() => branches.id),
    programInterestId: uuid("program_interest_id"),
    message: text("message"),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
    consentSource: text("consent_source").notNull(),
    consentVersion: text("consent_version"),
    clientSubmissionKey: text("client_submission_key"),
    status: leadStatus("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationSubmissionKeyUnique: uniqueIndex("leads_organization_submission_key_unique").on(
      table.organizationId,
      table.clientSubmissionKey,
    ),
    organizationStatusUpdatedIndex: index("leads_organization_status_updated_index").on(
      table.organizationId,
      table.status,
      table.updatedAt,
    ),
    organizationPhoneIndex: index("leads_organization_phone_index").on(table.organizationId, table.normalizedPhone),
    organizationEmailIndex: index("leads_organization_email_index").on(table.organizationId, table.normalizedEmail),
    organizationBranchStatusIndex: index("leads_organization_branch_status_index").on(
      table.organizationId,
      table.interestedBranchId,
      table.status,
    ),
  }),
);

export const leadAssignments = pgTable(
  "lead_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id),
    branchId: uuid("branch_id").references(() => branches.id),
    consultantUserId: uuid("consultant_user_id").references(() => users.id),
    status: leadAssignmentStatus("status").notNull().default("active"),
    reason: text("reason"),
    assignedByUserId: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    activeLeadUnique: uniqueIndex("lead_assignments_active_lead_unique")
      .on(table.organizationId, table.leadId)
      .where(sql`${table.status} = 'active'`),
    organizationConsultantStatusIndex: index("lead_assignments_organization_consultant_status_index").on(
      table.organizationId,
      table.consultantUserId,
      table.status,
    ),
    organizationBranchStatusIndex: index("lead_assignments_organization_branch_status_index").on(
      table.organizationId,
      table.branchId,
      table.status,
    ),
    targetRequired: check(
      "lead_assignments_target_required",
      sql`${table.branchId} is not null or ${table.consultantUserId} is not null`,
    ),
  }),
);

export const consultations = pgTable(
  "consultations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id),
    consultantUserId: uuid("consultant_user_id")
      .notNull()
      .references(() => users.id),
    assignmentId: uuid("assignment_id").references(() => leadAssignments.id),
    notes: text("notes").notNull(),
    outcome: text("outcome"),
    nextAction: text("next_action"),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationLeadOccurredIndex: index("consultations_organization_lead_occurred_index").on(
      table.organizationId,
      table.leadId,
      table.occurredAt,
    ),
    organizationConsultantOccurredIndex: index("consultations_organization_consultant_occurred_index").on(
      table.organizationId,
      table.consultantUserId,
      table.occurredAt,
    ),
    organizationNextActionIndex: index("consultations_organization_next_action_index").on(
      table.organizationId,
      table.nextActionAt,
    ),
  }),
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadAssignment = typeof leadAssignments.$inferSelect;
export type NewLeadAssignment = typeof leadAssignments.$inferInsert;
export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;

export function isPublicVisible(status: string): boolean {
  return status === "published";
}

export function publicationGuard(status: string): void {
  if (!isPublicVisible(status)) {
    throw new Error("landing_content_not_published");
  }
}

export function publishLandingContent(current: {
  status: string;
  nextVersion: number;
  actorUserId: string;
  now: Date;
}): {
  status: "published";
  version: number;
  publishedAt: Date;
  revokedAt: null;
  publishedByUserId: string;
  revokedByUserId: null;
  updatedAt: Date;
} {
  if (current.status === "published") {
    throw new Error("landing_content_already_published");
  }

  if (current.status === "revoked") {
    throw new Error("landing_content_revoked");
  }

  if (!Number.isFinite(current.nextVersion) || current.nextVersion < 1) {
    throw new Error("landing_content_next_version_invalid");
  }

  return {
    status: "published",
    version: current.nextVersion,
    publishedAt: current.now,
    revokedAt: null,
    publishedByUserId: current.actorUserId,
    revokedByUserId: null,
    updatedAt: current.now,
  };
}

export function revokeLandingContent(current: { status: string; actorUserId: string; now: Date }): {
  status: "revoked";
  revokedAt: Date;
  revokedByUserId: string;
  updatedAt: Date;
} {
  if (current.status !== "published") {
    throw new Error("landing_content_not_published");
  }

  return {
    status: "revoked",
    revokedAt: current.now,
    revokedByUserId: current.actorUserId,
    updatedAt: current.now,
  };
}
