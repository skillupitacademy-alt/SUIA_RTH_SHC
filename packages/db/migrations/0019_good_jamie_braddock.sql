DO $$ BEGIN CREATE TYPE "public"."tutorial_sync_status" AS ENUM('pending', 'synced', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN IF NOT EXISTS "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;
