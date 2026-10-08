CREATE TABLE "tutorial_navigation_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"navigation_node_id" text NOT NULL,
	"section_id" uuid,
	"subtopic_id" uuid NOT NULL,
	"status" "tutorial_progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time_spent_active_sec" integer DEFAULT 0 NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"revision_count" integer DEFAULT 0 NOT NULL,
	"last_session_id" text,
	"first_viewed_at" timestamp,
	"last_viewed_at" timestamp,
	"completed_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DROP INDEX "idx_tutorial_v2_delivery";--> statement-breakpoint
DROP INDEX "uq_tutorial_v2_identity_active";--> statement-breakpoint
ALTER TABLE "tutorial_sections" ADD COLUMN "navigation_node_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_navigation_progress_user_node" ON "tutorial_navigation_progress" USING btree ("user_id","navigation_node_id") WHERE "tutorial_navigation_progress"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_navigation_progress_user" ON "tutorial_navigation_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_navigation_progress_subtopic" ON "tutorial_navigation_progress" USING btree ("user_id","subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_navigation_progress_node" ON "tutorial_navigation_progress" USING btree ("navigation_node_id");--> statement-breakpoint
CREATE INDEX "idx_navigation_progress_last_viewed" ON "tutorial_navigation_progress" USING btree ("user_id","last_viewed_at");--> statement-breakpoint
CREATE INDEX "idx_tutorial_v2_delivery" ON "tutorial_sections" USING btree ("subtopic_id","navigation_node_id","brand_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_v2_identity_active" ON "tutorial_sections" USING btree ("subtopic_id","navigation_node_id","brand_id") WHERE "tutorial_sections"."deleted_at" IS NULL;