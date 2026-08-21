CREATE TABLE "tenant_registry" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"database_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"schema_version" text DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
