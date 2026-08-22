CREATE TYPE "public"."assessment_attempt_status" AS ENUM('created', 'in_progress', 'submitted', 'auto_submitted', 'graded', 'voided');--> statement-breakpoint
CREATE TYPE "public"."assessment_bank_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."assessment_question_status" AS ENUM('draft', 'in_review', 'approved', 'retired');--> statement-breakpoint
CREATE TYPE "public"."assessment_question_type" AS ENUM('single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay', 'speaking', 'listening');--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"assignment_id" uuid,
	"participant_user_id" uuid,
	"lead_id" uuid,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"client_attempt_key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"status" "assessment_attempt_status" DEFAULT 'created' NOT NULL,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"answers" jsonb,
	"autosave_state" jsonb,
	"raw_score" integer,
	"max_score" integer,
	"graded_by_user_id" uuid,
	"graded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"skill_scope" jsonb,
	"level_scope" jsonb,
	"status" "assessment_bank_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_question_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"prompt" jsonb NOT NULL,
	"choices" jsonb,
	"answer_key" jsonb,
	"scoring_rubric" jsonb,
	"explanation" jsonb,
	"asset_refs" jsonb,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bank_id" uuid NOT NULL,
	"question_code" text NOT NULL,
	"type" "assessment_question_type" NOT NULL,
	"skill" text NOT NULL,
	"level" text,
	"tags" jsonb,
	"current_version" integer DEFAULT 1 NOT NULL,
	"status" "assessment_question_status" DEFAULT 'draft' NOT NULL,
	"is_reusable" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "raw_score" integer;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "max_score" integer;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "scaled_score" integer;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "skill_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "recommendation" jsonb;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "bank_id" uuid;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "max_attempts" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "blueprint" jsonb;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "scoring_policy" jsonb;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "publication_policy" jsonb;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assignment_id_assessment_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assessment_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_participant_user_id_users_id_fk" FOREIGN KEY ("participant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_graded_by_user_id_users_id_fk" FOREIGN KEY ("graded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_banks" ADD CONSTRAINT "assessment_banks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_banks" ADD CONSTRAINT "assessment_banks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_question_versions" ADD CONSTRAINT "assessment_question_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_question_versions" ADD CONSTRAINT "assessment_question_versions_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_question_versions" ADD CONSTRAINT "assessment_question_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_bank_id_assessment_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."assessment_banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_attempts_organization_client_key_unique" ON "assessment_attempts" USING btree ("organization_id","client_attempt_key");--> statement-breakpoint
CREATE INDEX "assessment_attempts_organization_assessment_index" ON "assessment_attempts" USING btree ("organization_id","assessment_id","status");--> statement-breakpoint
CREATE INDEX "assessment_attempts_participant_index" ON "assessment_attempts" USING btree ("organization_id","participant_user_id","lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_banks_organization_code_unique" ON "assessment_banks" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "assessment_banks_organization_status_index" ON "assessment_banks" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_question_versions_question_version_unique" ON "assessment_question_versions" USING btree ("question_id","version");--> statement-breakpoint
CREATE INDEX "assessment_question_versions_organization_question_index" ON "assessment_question_versions" USING btree ("organization_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_questions_bank_code_unique" ON "assessment_questions" USING btree ("bank_id","question_code");--> statement-breakpoint
CREATE INDEX "assessment_questions_organization_bank_status_index" ON "assessment_questions" USING btree ("organization_id","bank_id","status");--> statement-breakpoint
CREATE INDEX "assessment_questions_organization_skill_index" ON "assessment_questions" USING btree ("organization_id","skill","level");--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_bank_id_assessment_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."assessment_banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_results_organization_attempt_index" ON "assessment_results" USING btree ("organization_id","attempt_id");--> statement-breakpoint
CREATE INDEX "assessments_organization_bank_index" ON "assessments" USING btree ("organization_id","bank_id");