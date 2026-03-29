CREATE TABLE IF NOT EXISTS "domain_content_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "domain_id" uuid NOT NULL,
  "audience_profile" text NOT NULL,
  "default_language" text DEFAULT 'en' NOT NULL,
  "seo_title_template" text,
  "ai_tutor_enabled" boolean DEFAULT true NOT NULL,
  "content_review_required" boolean DEFAULT true NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_domain_content_config_domain" ON "domain_content_config" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domain_content_config_domain" ON "domain_content_config" USING btree ("domain_id", "default_language");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_generation_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subtopic_id" uuid NOT NULL,
  "difficulty" "tutorial_difficulty" NOT NULL,
  "status" "tutorial_content_job_status" DEFAULT 'pending' NOT NULL,
  "prompt_version" integer DEFAULT 1 NOT NULL,
  "prompt" jsonb,
  "result" jsonb,
  "error" text,
  "generated_by" uuid,
  "processed_at" timestamp,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_generation_jobs_subtopic" ON "content_generation_jobs" USING btree ("subtopic_id", "status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subtopic_flow_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "subtopic_id" uuid NOT NULL,
  "layman_read_at" timestamp,
  "real_life_read_at" timestamp,
  "technical_read_at" timestamp,
  "code_read_at" timestamp,
  "ai_tutor_first_message_at" timestamp,
  "assignment_unlocked_at" timestamp,
  "assignment_completed_at" timestamp,
  "current_flow_step" integer DEFAULT 1 NOT NULL,
  "flow_completed" boolean DEFAULT false NOT NULL,
  "time_on_layman_seconds" integer DEFAULT 0 NOT NULL,
  "time_on_technical_seconds" integer DEFAULT 0 NOT NULL,
  "time_on_code_seconds" integer DEFAULT 0 NOT NULL,
  "total_time_seconds" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_subtopic_flow_progress_user_subtopic" ON "subtopic_flow_progress" USING btree ("user_id", "subtopic_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subtopic_flow_progress_user" ON "subtopic_flow_progress" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutorial_video_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subtopic_id" uuid,
  "project_id" uuid,
  "assignment_difficulty" "tutorial_difficulty",
  "provider" "tutorial_video_provider" NOT NULL,
  "url" text NOT NULL,
  "title" text NOT NULL,
  "thumbnail_url" text,
  "duration_seconds" integer,
  "captions_available" boolean DEFAULT false NOT NULL,
  "approved_by_admin" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tutorial_video_links_subtopic" ON "tutorial_video_links" USING btree ("subtopic_id");
