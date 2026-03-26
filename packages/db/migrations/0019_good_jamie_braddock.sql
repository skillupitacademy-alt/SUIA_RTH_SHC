CREATE TYPE "public"."tutorial_sync_status" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "tutorial_sync_status" "tutorial_sync_status" DEFAULT 'pending' NOT NULL;