ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;
ALTER TABLE "subtopics" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;

ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "subtopics" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
