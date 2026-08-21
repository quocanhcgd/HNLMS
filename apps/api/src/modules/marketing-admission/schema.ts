import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "../../database/schema/identity-access";

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
