import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const tenantRegistry = pgTable("tenant_registry", {
  organizationId: text("organization_id").primaryKey(),
  databaseUrl: text("database_url").notNull(),
  status: text("status", { enum: ["active", "maintenance", "archived"] })
    .notNull()
    .default("active"),
  schemaVersion: text("schema_version").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
