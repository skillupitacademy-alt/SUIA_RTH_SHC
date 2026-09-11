CREATE TABLE "block_telemetry_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"navigation_node_id" text NOT NULL,
	"block_id" text NOT NULL,
	"block_version" text NOT NULL,
	"active_time_sec" integer NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_block_telemetry_event_id" ON "block_telemetry_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_block_telemetry_events_block_lookup" ON "block_telemetry_events" USING btree ("user_id","navigation_node_id","block_id","block_version","processed_at");--> statement-breakpoint
CREATE INDEX "idx_block_telemetry_events_cleanup" ON "block_telemetry_events" USING btree ("processed_at");