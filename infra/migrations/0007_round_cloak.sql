CREATE TYPE "public"."file_processing_status" AS ENUM('pending', 'processing', 'ready', 'failed', 'quarantined');--> statement-breakpoint
CREATE TYPE "public"."learning_content_status" AS ENUM('draft', 'in_review', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."learning_content_type" AS ENUM('lesson', 'video', 'exercise', 'document', 'quiz', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."library_resource_kind" AS ENUM('document', 'video', 'audio', 'image', 'slide', 'link', 'attachment');--> statement-breakpoint
CREATE TYPE "public"."library_resource_status" AS ENUM('draft', 'in_review', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."resource_access_scope" AS ENUM('organization', 'department', 'program', 'course', 'class', 'restricted');--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum_sha256" text NOT NULL,
	"metadata" jsonb,
	"processing_status" "file_processing_status" DEFAULT 'pending' NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"learning_content_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"document" jsonb NOT NULL,
	"asset_refs" jsonb,
	"change_summary" text,
	"status" "learning_content_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"locale" text DEFAULT 'vi' NOT NULL,
	"content_type" "learning_content_type" NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"status" "learning_content_status" DEFAULT 'draft' NOT NULL,
	"access_scope" "resource_access_scope" DEFAULT 'organization' NOT NULL,
	"department_id" uuid,
	"program_id" uuid,
	"course_id" uuid,
	"class_id" uuid,
	"tags" jsonb,
	"estimated_duration_minutes" integer,
	"published_at" timestamp with time zone,
	"published_by_user_id" uuid,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_resource_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_resource_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"file_asset_id" uuid,
	"external_url" text,
	"metadata" jsonb,
	"change_summary" text,
	"status" "library_resource_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" "library_resource_kind" NOT NULL,
	"category" text NOT NULL,
	"subject" text,
	"locale" text DEFAULT 'vi' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"status" "library_resource_status" DEFAULT 'draft' NOT NULL,
	"access_scope" "resource_access_scope" DEFAULT 'organization' NOT NULL,
	"department_id" uuid,
	"program_id" uuid,
	"course_id" uuid,
	"class_id" uuid,
	"usage_policy" jsonb,
	"tags" jsonb,
	"published_at" timestamp with time zone,
	"published_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_content_versions" ADD CONSTRAINT "learning_content_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_content_versions" ADD CONSTRAINT "learning_content_versions_learning_content_id_learning_contents_id_fk" FOREIGN KEY ("learning_content_id") REFERENCES "public"."learning_contents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_content_versions" ADD CONSTRAINT "learning_content_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_program_id_academic_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."academic_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_course_id_academic_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_contents" ADD CONSTRAINT "learning_contents_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resource_versions" ADD CONSTRAINT "library_resource_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resource_versions" ADD CONSTRAINT "library_resource_versions_library_resource_id_library_resources_id_fk" FOREIGN KEY ("library_resource_id") REFERENCES "public"."library_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resource_versions" ADD CONSTRAINT "library_resource_versions_file_asset_id_file_assets_id_fk" FOREIGN KEY ("file_asset_id") REFERENCES "public"."file_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resource_versions" ADD CONSTRAINT "library_resource_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_program_id_academic_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."academic_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_course_id_academic_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "file_assets_organization_storage_key_unique" ON "file_assets" USING btree ("organization_id","storage_key");--> statement-breakpoint
CREATE INDEX "file_assets_organization_checksum_index" ON "file_assets" USING btree ("organization_id","checksum_sha256");--> statement-breakpoint
CREATE INDEX "file_assets_organization_processing_status_index" ON "file_assets" USING btree ("organization_id","processing_status");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_content_versions_content_version_unique" ON "learning_content_versions" USING btree ("learning_content_id","version");--> statement-breakpoint
CREATE INDEX "learning_content_versions_organization_content_index" ON "learning_content_versions" USING btree ("organization_id","learning_content_id");--> statement-breakpoint
CREATE INDEX "learning_contents_organization_status_index" ON "learning_contents" USING btree ("organization_id","status","content_type");--> statement-breakpoint
CREATE INDEX "learning_contents_organization_scope_index" ON "learning_contents" USING btree ("organization_id","access_scope","program_id","course_id","class_id");--> statement-breakpoint
CREATE INDEX "learning_contents_owner_index" ON "learning_contents" USING btree ("organization_id","owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "library_resource_versions_resource_version_unique" ON "library_resource_versions" USING btree ("library_resource_id","version");--> statement-breakpoint
CREATE INDEX "library_resource_versions_organization_resource_index" ON "library_resource_versions" USING btree ("organization_id","library_resource_id");--> statement-breakpoint
CREATE INDEX "library_resource_versions_file_asset_index" ON "library_resource_versions" USING btree ("organization_id","file_asset_id");--> statement-breakpoint
CREATE INDEX "library_resources_organization_status_index" ON "library_resources" USING btree ("organization_id","status","kind");--> statement-breakpoint
CREATE INDEX "library_resources_organization_category_index" ON "library_resources" USING btree ("organization_id","category","subject");--> statement-breakpoint
CREATE INDEX "library_resources_organization_scope_index" ON "library_resources" USING btree ("organization_id","access_scope","program_id","course_id","class_id");