CREATE TYPE "public"."landing_content_kind" AS ENUM('page', 'course', 'instructor', 'studentHighlight', 'news', 'announcement', 'cta');--> statement-breakpoint
CREATE TYPE "public"."landing_content_status" AS ENUM('draft', 'review', 'published', 'revoked');--> statement-breakpoint
CREATE TABLE "landing_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "landing_content_kind" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" jsonb,
	"media" jsonb,
	"locale" text DEFAULT 'vi' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "landing_content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"published_by_user_id" uuid,
	"revoked_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "landing_contents" ADD CONSTRAINT "landing_contents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_contents" ADD CONSTRAINT "landing_contents_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_contents" ADD CONSTRAINT "landing_contents_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_contents" ADD CONSTRAINT "landing_contents_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "landing_contents_organization_slug_version_unique" ON "landing_contents" USING btree ("organization_id","slug","version");--> statement-breakpoint
CREATE INDEX "landing_contents_public_listing_index" ON "landing_contents" USING btree ("organization_id","status","kind","sort_order");