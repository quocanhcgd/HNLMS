CREATE TYPE "public"."tenant_migration_state" AS ENUM('idle', 'preflight', 'syncing', 'validating', 'cutover', 'completed', 'rolled_back', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tenant_provisioning_state" AS ENUM('pending', 'provisioning', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TABLE "tenant_database_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"database_name" text NOT NULL,
	"endpoint" text NOT NULL,
	"deployment_mode" text NOT NULL,
	"provisioning_state" "tenant_provisioning_state" DEFAULT 'pending' NOT NULL,
	"migration_state" "tenant_migration_state" DEFAULT 'idle' NOT NULL,
	"schema_version" text DEFAULT '0' NOT NULL,
	"quota_units" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_scheduled_downtimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"read_only" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_database_registry" ADD CONSTRAINT "tenant_database_registry_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_scheduled_downtimes" ADD CONSTRAINT "tenant_scheduled_downtimes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_database_registry_org_unique" ON "tenant_database_registry" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tenant_database_registry_migration_index" ON "tenant_database_registry" USING btree ("migration_state","provisioning_state");