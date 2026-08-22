CREATE TYPE "public"."academic_class_status" AS ENUM('draft', 'open', 'full', 'in_progress', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."academic_course_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."academic_modality" AS ENUM('onsite', 'online', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."academic_publication_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."academic_schedule_status" AS ENUM('draft', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."assessment_assignment_status" AS ENUM('assigned', 'started', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."assessment_invitation_channel" AS ENUM('email', 'sms', 'manual');--> statement-breakpoint
CREATE TYPE "public"."assessment_kind" AS ENUM('entrance', 'mock', 'practice');--> statement-breakpoint
CREATE TYPE "public"."assessment_result_publication_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TABLE "academic_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"branch_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"modality" "academic_modality" NOT NULL,
	"capacity" integer NOT NULL,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"lead_teacher_user_id" uuid,
	"status" "academic_class_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"completion_rules" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"starts_at" text NOT NULL,
	"ends_at" text NOT NULL,
	"room_id" text,
	"teacher_user_id" uuid,
	"online_session_key" text,
	"status" "academic_schedule_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_weeks" integer NOT NULL,
	"status" "academic_course_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" "academic_publication_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"objectives" jsonb,
	"completion_rules" jsonb,
	"status" "academic_publication_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"client_assignment_key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"status" "assessment_assignment_status" DEFAULT 'assigned' NOT NULL,
	"invitation_channel" "assessment_invitation_channel" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"result_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"publication_status" "assessment_result_publication_status" DEFAULT 'draft' NOT NULL,
	"recommended_program_id" text,
	"recommended_class_id" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "assessment_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"status" "assessment_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_course_id_academic_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_lead_teacher_user_id_users_id_fk" FOREIGN KEY ("lead_teacher_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_modules" ADD CONSTRAINT "academic_modules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_modules" ADD CONSTRAINT "academic_modules_course_id_academic_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_schedules" ADD CONSTRAINT "academic_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_schedules" ADD CONSTRAINT "academic_schedules_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_schedules" ADD CONSTRAINT "academic_schedules_teacher_user_id_users_id_fk" FOREIGN KEY ("teacher_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_courses" ADD CONSTRAINT "academic_courses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_courses" ADD CONSTRAINT "academic_courses_program_id_academic_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."academic_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_courses" ADD CONSTRAINT "academic_courses_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_programs" ADD CONSTRAINT "academic_programs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_programs" ADD CONSTRAINT "academic_programs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_programs" ADD CONSTRAINT "academic_programs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_classes_organization_code_unique" ON "academic_classes" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "academic_classes_branch_status_index" ON "academic_classes" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_modules_course_position_unique" ON "academic_modules" USING btree ("course_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_modules_course_code_unique" ON "academic_modules" USING btree ("course_id","code");--> statement-breakpoint
CREATE INDEX "academic_schedules_class_index" ON "academic_schedules" USING btree ("organization_id","class_id");--> statement-breakpoint
CREATE INDEX "academic_schedules_resource_index" ON "academic_schedules" USING btree ("organization_id","weekday","starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_courses_organization_code_unique" ON "academic_courses" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "academic_courses_program_index" ON "academic_courses" USING btree ("organization_id","program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_organization_code_unique" ON "departments" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_programs_organization_code_unique" ON "academic_programs" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "academic_programs_organization_status_index" ON "academic_programs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "assessment_assignments_organization_key_index" ON "assessment_assignments" USING btree ("organization_id","client_assignment_key");--> statement-breakpoint
CREATE INDEX "assessment_assignments_organization_lead_index" ON "assessment_assignments" USING btree ("organization_id","lead_id");--> statement-breakpoint
CREATE INDEX "assessment_assignments_organization_assessment_index" ON "assessment_assignments" USING btree ("organization_id","assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_results_organization_assessment_index" ON "assessment_results" USING btree ("organization_id","assessment_id");--> statement-breakpoint
CREATE INDEX "assessments_organization_status_index" ON "assessments" USING btree ("organization_id","status");