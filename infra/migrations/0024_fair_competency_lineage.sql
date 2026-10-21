CREATE TYPE "public"."competency_evidence_source" AS ENUM('entrance', 'mock', 'practice', 'classwork', 'teacher_review', 'migration');--> statement-breakpoint
CREATE TYPE "public"."competency_evidence_status" AS ENUM('draft', 'pending_review', 'confirmed', 'superseded', 'voided');--> statement-breakpoint
CREATE TABLE "competency_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_id" text NOT NULL,
	"program_id" text NOT NULL,
	"blueprint_version" integer NOT NULL,
	"competency_code" text NOT NULL,
	"source_type" "competency_evidence_source" NOT NULL,
	"source_id" text NOT NULL,
	"class_id" text,
	"raw_score" real,
	"normalized_score" real,
	"normalized_level" text,
	"confidence" real,
	"status" "competency_evidence_status" NOT NULL,
	"reviewer_id" uuid,
	"assessed_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"legacy_record_id" uuid,
	"notes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competency_evidence" ADD CONSTRAINT "competency_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_evidence" ADD CONSTRAINT "competency_evidence_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_evidence" ADD CONSTRAINT "competency_evidence_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competency_evidence_organization_source_unique" ON "competency_evidence" USING btree ("organization_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "competency_evidence_organization_student_index" ON "competency_evidence" USING btree ("organization_id","student_id","competency_code");--> statement-breakpoint
CREATE TABLE "legacy_english_migration_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"legacy_record_id" uuid NOT NULL,
	"evidence_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"competency_code" text NOT NULL,
	"source_type" "competency_evidence_source" NOT NULL,
	"migrated_by_user_id" uuid NOT NULL,
	"migrated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legacy_english_migration_mappings" ADD CONSTRAINT "legacy_english_migration_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_english_migration_mappings" ADD CONSTRAINT "legacy_english_migration_mappings_legacy_record_id_english_skill_records_id_fk" FOREIGN KEY ("legacy_record_id") REFERENCES "public"."english_skill_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_english_migration_mappings" ADD CONSTRAINT "legacy_english_migration_mappings_evidence_id_competency_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."competency_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_english_migration_mappings" ADD CONSTRAINT "legacy_english_migration_mappings_profile_id_competency_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."competency_profiles"("profile_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_english_migration_mappings" ADD CONSTRAINT "legacy_english_migration_mappings_migrated_by_user_id_users_id_fk" FOREIGN KEY ("migrated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_english_migration_org_legacy_unique" ON "legacy_english_migration_mappings" USING btree ("organization_id","legacy_record_id");--> statement-breakpoint
CREATE INDEX "legacy_english_migration_org_profile_index" ON "legacy_english_migration_mappings" USING btree ("organization_id","profile_id");
