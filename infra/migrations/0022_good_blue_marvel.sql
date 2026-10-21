CREATE TYPE "public"."competency_review_history_action" AS ENUM('draft_saved', 'review_confirmed', 'support_requested', 'publication_requested');--> statement-breakpoint
CREATE TABLE "competency_profile_review_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" text NOT NULL,
	"student_id" uuid NOT NULL,
	"action" "competency_review_history_action" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"reason" text,
	"before_snapshot" jsonb NOT NULL,
	"after_snapshot" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competency_profile_review_history" ADD CONSTRAINT "competency_profile_review_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_profile_review_history" ADD CONSTRAINT "competency_profile_review_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_profile_review_history" ADD CONSTRAINT "competency_profile_review_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competency_review_history_organization_profile_index" ON "competency_profile_review_history" USING btree ("organization_id","profile_id","occurred_at");--> statement-breakpoint
CREATE INDEX "competency_review_history_organization_student_index" ON "competency_profile_review_history" USING btree ("organization_id","student_id","occurred_at");