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
-- Manual Neon step: create the remediation weak-areas materialized view and unique index.
CREATE MATERIALIZED VIEW IF NOT EXISTS "mv_student_weak_areas" AS
SELECT
  rt.user_id,
  weak_subtopic_id AS subtopic_id,
  count(*) AS failed_count,
  max(rt.created_at) AS last_failed_at
FROM remediation_triggers rt
CROSS JOIN LATERAL jsonb_array_elements_text(rt.weak_subtopic_ids) AS weak_subtopic_id
WHERE rt.status != 'completed'
GROUP BY rt.user_id, weak_subtopic_id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_weak_areas_user_subtopic"
  ON "mv_student_weak_areas" ("user_id", "subtopic_id");
