DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'notification_type' AND e.enumlabel = 'help_requested') THEN
        ALTER TYPE "public"."notification_type" ADD VALUE 'help_requested';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'notification_type' AND e.enumlabel = 'live_session_alert') THEN
        ALTER TYPE "public"."notification_type" ADD VALUE 'live_session_alert';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
CREATE TABLE IF NOT EXISTS "tutor_help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'low' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='tutor_help_requests' AND constraint_name='tutor_help_requests_user_id_users_id_fk') THEN
        ALTER TABLE "tutor_help_requests" ADD CONSTRAINT "tutor_help_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='tutor_help_requests' AND constraint_name='tutor_help_requests_topic_id_topics_id_fk') THEN
        ALTER TABLE "tutor_help_requests" ADD CONSTRAINT "tutor_help_requests_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_help_request_user" ON "tutor_help_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_help_request_status" ON "tutor_help_requests" USING btree ("status");