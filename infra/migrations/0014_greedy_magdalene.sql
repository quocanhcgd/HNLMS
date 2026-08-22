CREATE TYPE "public"."online_attendance_sync_status" AS ENUM('pending', 'synced', 'partial', 'failed', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."online_provider_kind" AS ENUM('zoom', 'google_meet', 'teams', 'custom');--> statement-breakpoint
CREATE TYPE "public"."online_recording_status" AS ENUM('pending', 'processing', 'ready', 'restricted', 'deleted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."online_session_status" AS ENUM('draft', 'scheduled', 'live', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TABLE "online_attendance_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid,
	"provider_participant_id" text,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"duration_seconds" integer,
	"sync_status" "online_attendance_sync_status" DEFAULT 'pending' NOT NULL,
	"raw_event" jsonb,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "online_provider_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" "online_provider_kind" NOT NULL,
	"provider_account_id" text NOT NULL,
	"display_name" text NOT NULL,
	"webhook_secret_ref" text,
	"settings" jsonb,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "online_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"provider_recording_id" text,
	"title" text NOT NULL,
	"duration_seconds" integer,
	"storage_key" text,
	"playback_url_secret_ref" text,
	"access_policy" jsonb,
	"status" "online_recording_status" DEFAULT 'pending' NOT NULL,
	"available_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "online_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"schedule_id" uuid,
	"provider_mapping_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"provider_meeting_id" text,
	"join_url" text,
	"host_url_secret_ref" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "online_session_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "online_attendance_syncs" ADD CONSTRAINT "online_attendance_syncs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_attendance_syncs" ADD CONSTRAINT "online_attendance_syncs_session_id_online_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."online_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_attendance_syncs" ADD CONSTRAINT "online_attendance_syncs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_provider_mappings" ADD CONSTRAINT "online_provider_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_provider_mappings" ADD CONSTRAINT "online_provider_mappings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_recordings" ADD CONSTRAINT "online_recordings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_recordings" ADD CONSTRAINT "online_recordings_session_id_online_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."online_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_schedule_id_academic_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."academic_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_provider_mapping_id_online_provider_mappings_id_fk" FOREIGN KEY ("provider_mapping_id") REFERENCES "public"."online_provider_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "online_attendance_syncs_session_student_unique" ON "online_attendance_syncs" USING btree ("session_id","student_id");--> statement-breakpoint
CREATE INDEX "online_attendance_syncs_org_session_index" ON "online_attendance_syncs" USING btree ("organization_id","session_id","sync_status");--> statement-breakpoint
CREATE UNIQUE INDEX "online_provider_mappings_org_provider_account_unique" ON "online_provider_mappings" USING btree ("organization_id","provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "online_provider_mappings_org_provider_index" ON "online_provider_mappings" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "online_recordings_provider_recording_unique" ON "online_recordings" USING btree ("organization_id","session_id","provider_recording_id");--> statement-breakpoint
CREATE INDEX "online_recordings_org_session_index" ON "online_recordings" USING btree ("organization_id","session_id","status");--> statement-breakpoint
CREATE INDEX "online_sessions_org_class_time_index" ON "online_sessions" USING btree ("organization_id","class_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "online_sessions_provider_meeting_unique" ON "online_sessions" USING btree ("organization_id","provider_mapping_id","provider_meeting_id");