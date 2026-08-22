CREATE TYPE "public"."english_level_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."english_pathway_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."english_placement_rule_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."english_skill_record_source" AS ENUM('placement', 'assessment', 'review', 'migration');--> statement-breakpoint
CREATE TABLE "english_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pathway_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer NOT NULL,
	"expected_outcomes" jsonb,
	"status" "english_level_status" DEFAULT 'active' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "english_pathways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"status" "english_pathway_status" DEFAULT 'active' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "english_placement_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pathway_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_assessment_id" uuid,
	"skill_weights" jsonb,
	"thresholds" jsonb NOT NULL,
	"status" "english_placement_rule_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "english_skill_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"skill" text NOT NULL,
	"level_code" text NOT NULL,
	"score" integer,
	"confidence" integer,
	"source" "english_skill_record_source" NOT NULL,
	"source_ref" text,
	"notes" jsonb,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "english_levels" ADD CONSTRAINT "english_levels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_levels" ADD CONSTRAINT "english_levels_pathway_id_english_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."english_pathways"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_levels" ADD CONSTRAINT "english_levels_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_pathways" ADD CONSTRAINT "english_pathways_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_pathways" ADD CONSTRAINT "english_pathways_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_placement_rules" ADD CONSTRAINT "english_placement_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_placement_rules" ADD CONSTRAINT "english_placement_rules_pathway_id_english_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."english_pathways"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_placement_rules" ADD CONSTRAINT "english_placement_rules_source_assessment_id_assessments_id_fk" FOREIGN KEY ("source_assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_placement_rules" ADD CONSTRAINT "english_placement_rules_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_skill_records" ADD CONSTRAINT "english_skill_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_skill_records" ADD CONSTRAINT "english_skill_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "english_skill_records" ADD CONSTRAINT "english_skill_records_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "english_levels_pathway_position_unique" ON "english_levels" USING btree ("pathway_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "english_levels_pathway_code_unique" ON "english_levels" USING btree ("pathway_id","code");--> statement-breakpoint
CREATE INDEX "english_levels_organization_pathway_index" ON "english_levels" USING btree ("organization_id","pathway_id");--> statement-breakpoint
CREATE UNIQUE INDEX "english_pathways_organization_code_unique" ON "english_pathways" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "english_pathways_organization_status_index" ON "english_pathways" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "english_placement_rules_pathway_code_unique" ON "english_placement_rules" USING btree ("pathway_id","code");--> statement-breakpoint
CREATE INDEX "english_placement_rules_organization_pathway_index" ON "english_placement_rules" USING btree ("organization_id","pathway_id");--> statement-breakpoint
CREATE INDEX "english_placement_rules_organization_assessment_index" ON "english_placement_rules" USING btree ("organization_id","source_assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "english_skill_records_student_skill_source_unique" ON "english_skill_records" USING btree ("student_id","skill","source","source_ref");--> statement-breakpoint
CREATE INDEX "english_skill_records_organization_student_index" ON "english_skill_records" USING btree ("organization_id","student_id","skill");--> statement-breakpoint
CREATE INDEX "english_skill_records_organization_level_index" ON "english_skill_records" USING btree ("organization_id","level_code","captured_at");