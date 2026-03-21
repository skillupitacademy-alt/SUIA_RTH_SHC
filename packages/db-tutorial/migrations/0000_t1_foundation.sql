DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_difficulty') THEN
    CREATE TYPE "tutorial_difficulty" AS ENUM ('simple', 'mixed', 'intermediate', 'expert');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_question_type') THEN
    CREATE TYPE "tutorial_question_type" AS ENUM ('mcq', 'short_answer', 'code', 'drag_drop', 'fill_blank');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_project_scope') THEN
    CREATE TYPE "tutorial_project_scope" AS ENUM ('topic', 'subject', 'domain');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_project_level') THEN
    CREATE TYPE "tutorial_project_level" AS ENUM ('simple', 'intermediate', 'expert');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_project_submission_status') THEN
    CREATE TYPE "tutorial_project_submission_status" AS ENUM ('pending', 'submitted', 'graded', 'revision-requested');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_deliverable_type') THEN
    CREATE TYPE "tutorial_deliverable_type" AS ENUM ('code', 'repo', 'live_demo', 'document');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_evaluation_type') THEN
    CREATE TYPE "tutorial_evaluation_type" AS ENUM ('auto', 'ai_review', 'peer_review', 'admin_review');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_video_provider') THEN
    CREATE TYPE "tutorial_video_provider" AS ENUM ('youtube', 'vimeo', 'custom', 'loom');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_content_job_status') THEN
    CREATE TYPE "tutorial_content_job_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_progress_status') THEN
    CREATE TYPE "tutorial_progress_status" AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutorial_trigger_status') THEN
    CREATE TYPE "tutorial_trigger_status" AS ENUM ('pending', 'accepted', 'dismissed', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "tutorial_content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subtopic_id" uuid NOT NULL,
  "difficulty" "tutorial_difficulty" NOT NULL,
  "content" jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "language" text DEFAULT 'en' NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "generated_by_ai" boolean DEFAULT false NOT NULL,
  "ai_model_used" text,
  "generation_job_id" uuid,
  "admin_approved_by" uuid,
  "admin_approved_at" timestamp,
  "quality_score" jsonb,
  "regeneration_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_tutorial_content_subtopic_difficulty" ON "tutorial_content" ("subtopic_id", "difficulty");
CREATE INDEX IF NOT EXISTS "idx_tutorial_content_subtopic" ON "tutorial_content" ("subtopic_id");
CREATE INDEX IF NOT EXISTS "idx_tutorial_content_published" ON "tutorial_content" ("subtopic_id", "is_published");
CREATE INDEX IF NOT EXISTS "idx_tutorial_content_content_gin" ON "tutorial_content" USING gin ("content");

CREATE TABLE IF NOT EXISTS "tutorial_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "subtopic_id" uuid NOT NULL,
  "status" "tutorial_progress_status" DEFAULT 'not_started' NOT NULL,
  "blocks_completed" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "remediation_triggered" boolean DEFAULT false NOT NULL,
  "score" numeric(5, 2),
  "time_spent_sec" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamp,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_tutorial_progress_user_subtopic" ON "tutorial_progress" ("user_id", "subtopic_id");
CREATE INDEX IF NOT EXISTS "idx_tutorial_progress_user" ON "tutorial_progress" ("user_id");

CREATE TABLE IF NOT EXISTS "tutorial_projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scope" "tutorial_project_scope" NOT NULL,
  "parent_id" uuid NOT NULL,
  "level" "tutorial_project_level" NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "deliverable_type" "tutorial_deliverable_type" NOT NULL,
  "evaluation_type" "tutorial_evaluation_type" NOT NULL,
  "estimated_hours" integer,
  "badge_id" uuid,
  "subtopics_covered" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_tutorial_projects_scope" ON "tutorial_projects" ("scope", "level");

CREATE TABLE IF NOT EXISTS "tutorial_project_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "tutorial_projects"("id"),
  "project_level" "tutorial_project_level" NOT NULL,
  "difficulty" "tutorial_difficulty" NOT NULL,
  "submission_content" jsonb NOT NULL,
  "status" "tutorial_project_submission_status" DEFAULT 'pending' NOT NULL,
  "score" integer,
  "feedback" text,
  "video_required" boolean DEFAULT false NOT NULL,
  "video_url" text,
  "submitted_at" timestamp,
  "graded_at" timestamp,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_tutorial_project_submissions_user" ON "tutorial_project_submissions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_tutorial_project_submissions_project" ON "tutorial_project_submissions" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_tutorial_project_submissions_status" ON "tutorial_project_submissions" ("status");
