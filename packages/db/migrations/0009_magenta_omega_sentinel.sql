ALTER TYPE "public"."notification_type" ADD VALUE 'help_requested';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'live_session_alert';--> statement-breakpoint
CREATE TABLE "tutor_help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'low' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tutor_help_requests" ADD CONSTRAINT "tutor_help_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_help_requests" ADD CONSTRAINT "tutor_help_requests_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_help_request_user" ON "tutor_help_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_help_request_status" ON "tutor_help_requests" USING btree ("status");