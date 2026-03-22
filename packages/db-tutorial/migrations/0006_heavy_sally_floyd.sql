CREATE TABLE IF NOT EXISTS "remediation_triggers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exam_result_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "weak_subtopics" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "weak_subtopic_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "recommended_content_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" "public"."tutorial_trigger_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remediation_triggers_user" ON "remediation_triggers" USING btree ("user_id","status");
--> statement-breakpoint
ALTER TYPE "public"."tutorial_trigger_status" ADD VALUE IF NOT EXISTS 'failed';--> statement-breakpoint
ALTER TABLE "remediation_triggers" ADD COLUMN IF NOT EXISTS "weak_subtopics" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
