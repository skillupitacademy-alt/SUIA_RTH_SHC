ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "complexity" text NOT NULL DEFAULT 'beginner';
ALTER TABLE "subtopics" ADD COLUMN IF NOT EXISTS "depth" integer NOT NULL DEFAULT 1;
ALTER TABLE "subtopics" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
ALTER TABLE "subtopics" ADD COLUMN IF NOT EXISTS "status" "status" NOT NULL DEFAULT 'active';
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "status" "status" NOT NULL DEFAULT 'active';
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

UPDATE "topics"
SET "complexity" = CASE
  WHEN "complexity_level" >= 3 THEN 'advanced'
  WHEN "complexity_level" = 2 THEN 'intermediate'
  ELSE 'beginner'
END;

UPDATE "subtopics"
SET "depth" = COALESCE("depth", "depth_level", 1);

UPDATE "skills"
SET "status" = COALESCE("status", 'active');
