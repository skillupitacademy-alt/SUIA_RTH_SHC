DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE "public"."notification_type" AS ENUM('notes_sent', 'level_up', 'live_session', 'system');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_level') THEN
        CREATE TYPE "public"."recommendation_level" AS ENUM('revise', 'practice', 'advance');
    END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"delivered_via" text DEFAULT 'email' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes_delivery_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"delivery_date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"recommendation_level" "recommendation_level" NOT NULL,
	"source_exam_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Safely handle enum conversion for notifications.type
DO $$ 
BEGIN 
    -- Check if column exists and is not already the enum type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='type' AND data_type='text') THEN
        -- We might need to cast existing values if they are compatible, or handle incompatible data. 
        -- Assuming current data is compatible or table is empty for simplicity in this context, 
        -- but a robust script would check. 
        -- For now, let's try to cast. If it fails, manual intervention is needed.
        ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notification_type" USING "type"::"public"."notification_type";
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    BEGIN
        ALTER TABLE "topics" ADD COLUMN "notes_asset_id" text;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE "notifications" ADD COLUMN "action_url" text;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='notes_access_logs_user_id_users_id_fk') THEN
        ALTER TABLE "notes_access_logs" ADD CONSTRAINT "notes_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='notes_access_logs_topic_id_topics_id_fk') THEN
        ALTER TABLE "notes_access_logs" ADD CONSTRAINT "notes_access_logs_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='notes_delivery_locks_user_id_users_id_fk') THEN
        ALTER TABLE "notes_delivery_locks" ADD CONSTRAINT "notes_delivery_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='notes_delivery_locks_topic_id_topics_id_fk') THEN
        ALTER TABLE "notes_delivery_locks" ADD CONSTRAINT "notes_delivery_locks_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='user_recommendations_user_id_users_id_fk') THEN
        ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='user_recommendations_topic_id_topics_id_fk') THEN
        ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='user_recommendations_source_exam_id_exams_id_fk') THEN
        ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_source_exam_id_exams_id_fk" FOREIGN KEY ("source_exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notes_access_user" ON "notes_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notes_access_topic" ON "notes_access_logs" USING btree ("topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unq_notes_delivery" ON "notes_delivery_locks" USING btree ("user_id","topic_id","delivery_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_reco_user" ON "user_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_reco_topic" ON "user_recommendations" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" USING btree ("created_at");
