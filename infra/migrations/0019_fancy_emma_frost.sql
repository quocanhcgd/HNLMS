CREATE TYPE "public"."commercial_license_status" AS ENUM('active', 'grace', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."commercial_plan_term" AS ENUM('monthly', 'yearly', 'lifetime');--> statement-breakpoint
CREATE TYPE "public"."module_state_status" AS ENUM('enabled', 'disabled', 'blocked');--> statement-breakpoint
CREATE TABLE "commercial_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "commercial_license_status" DEFAULT 'active' NOT NULL,
	"document" jsonb NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"grace_until" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_effective_module_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"module_key" text NOT NULL,
	"status" "module_state_status" NOT NULL,
	"reason" text NOT NULL,
	"quota" jsonb,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_license_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "commercial_plan_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"quota" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "commercial_product_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"term" "commercial_plan_term" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commercial_licenses" ADD CONSTRAINT "commercial_licenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_licenses" ADD CONSTRAINT "commercial_licenses_plan_id_commercial_product_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."commercial_product_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_effective_module_states" ADD CONSTRAINT "commercial_effective_module_states_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_license_assignments" ADD CONSTRAINT "commercial_license_assignments_license_id_commercial_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."commercial_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_license_assignments" ADD CONSTRAINT "commercial_license_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_plan_entitlements" ADD CONSTRAINT "commercial_plan_entitlements_plan_id_commercial_product_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."commercial_product_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commercial_licenses_org_status_index" ON "commercial_licenses" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "commercial_licenses_org_plan_index" ON "commercial_licenses" USING btree ("organization_id","plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_effective_module_states_org_module_unique" ON "commercial_effective_module_states" USING btree ("organization_id","module_key");--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_license_assignments_license_org_unique" ON "commercial_license_assignments" USING btree ("license_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_plan_entitlements_plan_feature_unique" ON "commercial_plan_entitlements" USING btree ("plan_id","feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_product_plans_key_unique" ON "commercial_product_plans" USING btree ("key");