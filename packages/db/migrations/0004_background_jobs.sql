-- Background jobs table and status enum

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "background_jobs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "status" job_status NOT NULL DEFAULT 'pending',
    "payload" jsonb,
    "result" jsonb,
    "error" text,
    "started_at" timestamp,
    "completed_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_jobs_user_id" ON "background_jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "background_jobs" ("status");
