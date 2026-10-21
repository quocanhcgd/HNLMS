import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Small, tenant-scoped state store for workflow projections that are not yet
 * represented by a dedicated aggregate table. Payloads remain JSON so the
 * demo workflow can evolve without silently losing fields during migration.
 */
export const appStateRecords = pgTable(
  "app_state_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").notNull(),
    namespace: text("namespace").notNull(),
    recordKey: text("record_key").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationNamespaceKeyUnique: uniqueIndex("app_state_records_org_namespace_key_unique").on(
      table.organizationId,
      table.namespace,
      table.recordKey,
    ),
  }),
);

export type AppStateRecord = typeof appStateRecords.$inferSelect;
