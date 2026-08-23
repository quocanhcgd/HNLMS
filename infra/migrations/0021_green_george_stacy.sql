CREATE TYPE "public"."media_asset_status" AS ENUM('created', 'uploading', 'scanning', 'processing', 'ready', 'failed', 'quarantined');--> statement-breakpoint
CREATE TABLE "multimedia_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"checksum" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" "media_asset_status" DEFAULT 'created' NOT NULL,
	"metadata" jsonb,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multimedia_derivatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "multimedia_assets" ADD CONSTRAINT "multimedia_assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multimedia_assets" ADD CONSTRAINT "multimedia_assets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multimedia_derivatives" ADD CONSTRAINT "multimedia_derivatives_asset_id_multimedia_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."multimedia_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "multimedia_assets_org_storage_unique" ON "multimedia_assets" USING btree ("organization_id","storage_key");--> statement-breakpoint
CREATE INDEX "multimedia_assets_org_checksum_index" ON "multimedia_assets" USING btree ("organization_id","checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "multimedia_derivatives_asset_kind_unique" ON "multimedia_derivatives" USING btree ("asset_id","kind");