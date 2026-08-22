CREATE TABLE "saved_library_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"library_resource_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_library_resources" ADD CONSTRAINT "saved_library_resources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_library_resources" ADD CONSTRAINT "saved_library_resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_library_resources" ADD CONSTRAINT "saved_library_resources_library_resource_id_library_resources_id_fk" FOREIGN KEY ("library_resource_id") REFERENCES "public"."library_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_library_resources_user_resource_unique" ON "saved_library_resources" USING btree ("user_id","library_resource_id");--> statement-breakpoint
CREATE INDEX "saved_library_resources_organization_user_index" ON "saved_library_resources" USING btree ("organization_id","user_id");