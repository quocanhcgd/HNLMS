import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";

export const branchStatus = pgEnum("branch_status", ["active", "inactive", "archived"]);
export const brandThemeStatus = pgEnum("brand_theme_status", ["draft", "published", "archived"]);

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    managerUserId: uuid("manager_user_id").references(() => users.id),
    status: branchStatus("status").notNull().default("active"),
    openedOn: date("opened_on"),
    closedOn: date("closed_on"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationCodeUnique: uniqueIndex("branches_organization_code_unique").on(table.organizationId, table.code),
  }),
);

export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    version: integer("version").notNull().default(1),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationKeyUnique: uniqueIndex("organization_settings_organization_key_unique").on(
      table.organizationId,
      table.key,
    ),
  }),
);

export const brandThemes = pgTable(
  "brand_themes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name").notNull(),
    version: integer("version").notNull(),
    status: brandThemeStatus("status").notNull().default("draft"),
    semanticTokens: jsonb("semantic_tokens").notNull(),
    lightTokens: jsonb("light_tokens"),
    darkTokens: jsonb("dark_tokens"),
    fontFamily: text("font_family"),
    radius: text("radius"),
    logoUrl: text("logo_url"),
    contrastValidated: boolean("contrast_validated").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationVersionUnique: uniqueIndex("brand_themes_organization_version_unique").on(
      table.organizationId,
      table.version,
    ),
  }),
);
