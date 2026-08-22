CREATE TYPE "public"."ai_policy_decision" AS ENUM('allowed', 'minimized', 'blocked', 'requires_review');--> statement-breakpoint
CREATE TYPE "public"."ai_review_status" AS ENUM('pending', 'approved', 'rejected', 'appealed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."ai_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."ai_task_status" AS ENUM('queued', 'running', 'completed', 'failed', 'blocked', 'manual_review');--> statement-breakpoint
CREATE TABLE "ai_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"review_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "ai_review_status" DEFAULT 'appealed' NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"resolved_by_user_id" uuid,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_policy_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"decision" "ai_policy_decision" NOT NULL,
	"policy_version" text NOT NULL,
	"reason" text NOT NULL,
	"decided_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micros" integer DEFAULT 0 NOT NULL,
	"success" boolean NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" "ai_review_status" DEFAULT 'pending' NOT NULL,
	"reviewer_user_id" uuid,
	"explanation" text,
	"feedback" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_type" text NOT NULL,
	"scope" text NOT NULL,
	"input_data" jsonb,
	"minimized_input" jsonb,
	"status" "ai_task_status" DEFAULT 'queued' NOT NULL,
	"risk_level" "ai_risk_level" DEFAULT 'low' NOT NULL,
	"confidence" integer,
	"source_refs" jsonb,
	"output_data" jsonb,
	"manual_fallback" jsonb,
	"requested_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_appeals" ADD CONSTRAINT "ai_appeals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_appeals" ADD CONSTRAINT "ai_appeals_review_id_ai_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."ai_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_appeals" ADD CONSTRAINT "ai_appeals_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_appeals" ADD CONSTRAINT "ai_appeals_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policy_decisions" ADD CONSTRAINT "ai_policy_decisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policy_decisions" ADD CONSTRAINT "ai_policy_decisions_task_id_ai_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."ai_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policy_decisions" ADD CONSTRAINT "ai_policy_decisions_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_usages" ADD CONSTRAINT "ai_provider_usages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_usages" ADD CONSTRAINT "ai_provider_usages_task_id_ai_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."ai_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reviews" ADD CONSTRAINT "ai_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reviews" ADD CONSTRAINT "ai_reviews_task_id_ai_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."ai_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reviews" ADD CONSTRAINT "ai_reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_policy_decisions_task_index" ON "ai_policy_decisions" USING btree ("organization_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_reviews_task_unique" ON "ai_reviews" USING btree ("organization_id","task_id");--> statement-breakpoint
CREATE INDEX "ai_tasks_org_status_index" ON "ai_tasks" USING btree ("organization_id","status","risk_level");