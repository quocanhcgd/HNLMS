CREATE TYPE "public"."lead_assignment_status" AS ENUM('active', 'transferred', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'consulting', 'awaiting_assessment', 'class_proposed', 'enrolled', 'disqualified', 'archived');--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"consultant_user_id" uuid NOT NULL,
	"assignment_id" uuid,
	"notes" text NOT NULL,
	"outcome" text,
	"next_action" text,
	"next_action_at" timestamp with time zone,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"branch_id" uuid,
	"consultant_user_id" uuid,
	"status" "lead_assignment_status" DEFAULT 'active' NOT NULL,
	"reason" text,
	"assigned_by_user_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_assignments_target_required" CHECK ("lead_assignments"."branch_id" is not null or "lead_assignments"."consultant_user_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"normalized_phone" text NOT NULL,
	"email" text,
	"normalized_email" text,
	"source" text NOT NULL,
	"source_details" jsonb,
	"interest" text NOT NULL,
	"interested_branch_id" uuid,
	"program_interest_id" uuid,
	"message" text,
	"consented_at" timestamp with time zone NOT NULL,
	"consent_source" text NOT NULL,
	"consent_version" text,
	"client_submission_key" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_consultant_user_id_users_id_fk" FOREIGN KEY ("consultant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assignment_id_lead_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."lead_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_consultant_user_id_users_id_fk" FOREIGN KEY ("consultant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_interested_branch_id_branches_id_fk" FOREIGN KEY ("interested_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultations_organization_lead_occurred_index" ON "consultations" USING btree ("organization_id","lead_id","occurred_at");--> statement-breakpoint
CREATE INDEX "consultations_organization_consultant_occurred_index" ON "consultations" USING btree ("organization_id","consultant_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "consultations_organization_next_action_index" ON "consultations" USING btree ("organization_id","next_action_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_assignments_active_lead_unique" ON "lead_assignments" USING btree ("organization_id","lead_id") WHERE "lead_assignments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "lead_assignments_organization_consultant_status_index" ON "lead_assignments" USING btree ("organization_id","consultant_user_id","status");--> statement-breakpoint
CREATE INDEX "lead_assignments_organization_branch_status_index" ON "lead_assignments" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_organization_submission_key_unique" ON "leads" USING btree ("organization_id","client_submission_key");--> statement-breakpoint
CREATE INDEX "leads_organization_status_updated_index" ON "leads" USING btree ("organization_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "leads_organization_phone_index" ON "leads" USING btree ("organization_id","normalized_phone");--> statement-breakpoint
CREATE INDEX "leads_organization_email_index" ON "leads" USING btree ("organization_id","normalized_email");--> statement-breakpoint
CREATE INDEX "leads_organization_branch_status_index" ON "leads" USING btree ("organization_id","interested_branch_id","status");