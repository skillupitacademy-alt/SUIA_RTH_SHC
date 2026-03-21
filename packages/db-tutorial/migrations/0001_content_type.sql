ALTER TABLE IF EXISTS "tutorial_content"
  ADD COLUMN IF NOT EXISTS "content_type" text DEFAULT 'standard' NOT NULL;

DROP INDEX IF EXISTS "uq_tutorial_content_subtopic_difficulty";

CREATE UNIQUE INDEX IF NOT EXISTS "uq_tutorial_content_subtopic_difficulty_type"
  ON "tutorial_content" ("subtopic_id", "difficulty", "content_type");
