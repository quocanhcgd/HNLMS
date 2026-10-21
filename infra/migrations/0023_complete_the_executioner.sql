CREATE TYPE "public"."competency_current_publication_status" AS ENUM('draft', 'pending_publication', 'published', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."competency_current_review_status" AS ENUM('pending_review', 'confirmed', 'needs_support');--> statement-breakpoint
ALTER TYPE "public"."competency_review_history_action" ADD VALUE 'publication_approved';--> statement-breakpoint
CREATE TABLE "competency_profiles" (
	"profile_id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_id" text NOT NULL,
	"program_id" text NOT NULL,
	"class_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"review_status" "competency_current_review_status" NOT NULL,
	"publication_status" "competency_current_publication_status" NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"private_reviewer_note" text,
	"internal_worklog_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competency_profiles" ADD CONSTRAINT "competency_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_profiles" ADD CONSTRAINT "competency_profiles_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competency_profiles_organization_student_context_index" ON "competency_profiles" USING btree ("organization_id","student_id","subject_id","program_id","class_id");--> statement-breakpoint
CREATE INDEX "competency_profiles_organization_publication_index" ON "competency_profiles" USING btree ("organization_id","publication_status","review_status");