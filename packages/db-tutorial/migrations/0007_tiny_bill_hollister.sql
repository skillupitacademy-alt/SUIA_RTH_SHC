CREATE TYPE "public"."tutorial_content_audit_action" AS ENUM('created', 'updated', 'published', 'unpublished', 'restored');--> statement-breakpoint
CREATE TABLE "tutorial_content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"saved_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_content_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "tutorial_content_audit_action" NOT NULL,
	"diff" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_content_versions_content_id" ON "tutorial_content_versions" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_content_audit_content_id" ON "tutorial_content_audit" USING btree ("content_id");
