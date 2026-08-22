import { index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";
import { students } from "../academic-learning/schema";

export const parentLinkStatus = pgEnum("parent_link_status", ["active", "revoked", "expired"]);
export const parentDelegationStatus = pgEnum("parent_delegation_status", ["active", "revoked", "expired"]);

export const parentLinks = pgTable(
  "parent_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    parentUserId: uuid("parent_user_id")
      .notNull()
      .references(() => users.id),
    relationship: text("relationship").notNull(),
    status: parentLinkStatus("status").notNull().default("active"),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    studentParentUnique: uniqueIndex("parent_links_student_parent_unique").on(table.studentId, table.parentUserId),
    organizationParentIndex: index("parent_links_organization_parent_index").on(
      table.organizationId,
      table.parentUserId,
      table.status,
    ),
  }),
);

export const parentDelegations = pgTable(
  "parent_delegations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    parentLinkId: uuid("parent_link_id")
      .notNull()
      .references(() => parentLinks.id),
    permissions: jsonb("permissions").notNull(),
    status: parentDelegationStatus("status").notNull().default("active"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    linkStatusIndex: index("parent_delegations_link_status_index").on(table.parentLinkId, table.status),
    organizationStatusIndex: index("parent_delegations_organization_status_index").on(
      table.organizationId,
      table.status,
    ),
  }),
);

export type ParentLinkRow = typeof parentLinks.$inferSelect;
export type NewParentLinkRow = typeof parentLinks.$inferInsert;
export type ParentDelegationRow = typeof parentDelegations.$inferSelect;
export type NewParentDelegationRow = typeof parentDelegations.$inferInsert;
