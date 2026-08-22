CREATE TYPE "public"."attendance_status" AS ENUM('present', 'late', 'absent', 'excused');--> statement-breakpoint
CREATE TABLE "enrollment_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "attendance_status" DEFAULT 'present' NOT NULL,
	"note" text,
	"recorded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"assessment_id" text NOT NULL,
	"title" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"weight" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollment_attendances" ADD CONSTRAINT "enrollment_attendances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_attendances" ADD CONSTRAINT "enrollment_attendances_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_attendances" ADD CONSTRAINT "enrollment_attendances_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_scores" ADD CONSTRAINT "enrollment_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_scores" ADD CONSTRAINT "enrollment_scores_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_scores" ADD CONSTRAINT "enrollment_scores_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_attendances_enrollment_session_unique" ON "enrollment_attendances" USING btree ("enrollment_id","session_id");--> statement-breakpoint
CREATE INDEX "enrollment_attendances_organization_enrollment_index" ON "enrollment_attendances" USING btree ("organization_id","enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_scores_enrollment_assessment_unique" ON "enrollment_scores" USING btree ("enrollment_id","assessment_id");--> statement-breakpoint
CREATE INDEX "enrollment_scores_organization_enrollment_index" ON "enrollment_scores" USING btree ("organization_id","enrollment_id");