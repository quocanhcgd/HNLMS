CREATE TYPE "public"."teacher_assignment_status" AS ENUM('active', 'ended', 'substitute_requested', 'substituted');--> statement-breakpoint
CREATE TYPE "public"."employment_contract_status" AS ENUM('draft', 'active', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('invited', 'active', 'on_leave', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."employee_leave_status" AS ENUM('requested', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."employee_review_status" AS ENUM('draft', 'submitted', 'acknowledged', 'completed');--> statement-breakpoint
CREATE TABLE "hrm_employee_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"days" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "employee_leave_status" DEFAULT 'requested' NOT NULL,
	"approved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hrm_employee_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"score" integer,
	"feedback" jsonb,
	"status" "employee_review_status" DEFAULT 'draft' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hrm_work_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"starts_at" text NOT NULL,
	"ends_at" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hrm_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_code" text NOT NULL,
	"job_title" text NOT NULL,
	"status" "employee_status" DEFAULT 'invited' NOT NULL,
	"branch_id" uuid,
	"hire_date" timestamp with time zone NOT NULL,
	"terminated_at" timestamp with time zone,
	"skills" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hrm_employment_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_number" text NOT NULL,
	"contract_type" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"salary_amount" integer,
	"status" "employment_contract_status" DEFAULT 'draft' NOT NULL,
	"document_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hrm_teacher_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"role" text NOT NULL,
	"weekly_hours" integer DEFAULT 0 NOT NULL,
	"status" "teacher_assignment_status" DEFAULT 'active' NOT NULL,
	"substitute_employee_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hrm_employee_leaves" ADD CONSTRAINT "hrm_employee_leaves_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employee_leaves" ADD CONSTRAINT "hrm_employee_leaves_employee_id_hrm_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employee_leaves" ADD CONSTRAINT "hrm_employee_leaves_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employee_reviews" ADD CONSTRAINT "hrm_employee_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employee_reviews" ADD CONSTRAINT "hrm_employee_reviews_employee_id_hrm_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employee_reviews" ADD CONSTRAINT "hrm_employee_reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_work_schedules" ADD CONSTRAINT "hrm_work_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_work_schedules" ADD CONSTRAINT "hrm_work_schedules_employee_id_hrm_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employees" ADD CONSTRAINT "hrm_employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employees" ADD CONSTRAINT "hrm_employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employees" ADD CONSTRAINT "hrm_employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employment_contracts" ADD CONSTRAINT "hrm_employment_contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_employment_contracts" ADD CONSTRAINT "hrm_employment_contracts_employee_id_hrm_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_teacher_assignments" ADD CONSTRAINT "hrm_teacher_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_teacher_assignments" ADD CONSTRAINT "hrm_teacher_assignments_employee_id_hrm_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_teacher_assignments" ADD CONSTRAINT "hrm_teacher_assignments_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hrm_teacher_assignments" ADD CONSTRAINT "hrm_teacher_assignments_substitute_employee_id_hrm_employees_id_fk" FOREIGN KEY ("substitute_employee_id") REFERENCES "public"."hrm_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hrm_leaves_employee_status_index" ON "hrm_employee_leaves" USING btree ("organization_id","employee_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "hrm_reviews_employee_period_unique" ON "hrm_employee_reviews" USING btree ("employee_id","period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "hrm_work_schedules_employee_day_unique" ON "hrm_work_schedules" USING btree ("employee_id","weekday","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "hrm_employees_org_code_unique" ON "hrm_employees" USING btree ("organization_id","employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "hrm_employees_org_user_unique" ON "hrm_employees" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "hrm_employees_org_status_index" ON "hrm_employees" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "hrm_contracts_org_number_unique" ON "hrm_employment_contracts" USING btree ("organization_id","contract_number");--> statement-breakpoint
CREATE INDEX "hrm_contracts_employee_status_index" ON "hrm_employment_contracts" USING btree ("organization_id","employee_id","status");--> statement-breakpoint
CREATE INDEX "hrm_teacher_assignments_employee_class_index" ON "hrm_teacher_assignments" USING btree ("organization_id","employee_id","class_id","status");--> statement-breakpoint
CREATE INDEX "hrm_teacher_assignments_class_status_index" ON "hrm_teacher_assignments" USING btree ("organization_id","class_id","status");