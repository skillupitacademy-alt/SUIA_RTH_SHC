CREATE TABLE "block_learning_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"navigation_node_id" text NOT NULL,
	"block_id" text NOT NULL,
	"block_version" text NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"revision_count" integer DEFAULT 0 NOT NULL,
	"active_time_sec" integer DEFAULT 0 NOT NULL,
	"expected_time_sec" integer,
	"first_viewed_at" timestamp,
	"last_viewed_at" timestamp,
	"completed_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_block_learning_state_identity" ON "block_learning_state" USING btree ("user_id","navigation_node_id","block_id","block_version") WHERE "block_learning_state"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_block_learning_state_user" ON "block_learning_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_block_learning_state_node" ON "block_learning_state" USING btree ("user_id","navigation_node_id");--> statement-breakpoint
CREATE INDEX "idx_block_learning_state_block" ON "block_learning_state" USING btree ("block_id","block_version");--> statement-breakpoint
CREATE INDEX "idx_block_learning_state_last_viewed" ON "block_learning_state" USING btree ("user_id","last_viewed_at");