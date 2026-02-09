CREATE INDEX IF NOT EXISTS "idx_exams_dashboard_opt" ON "exams" ("user_id", "status", "completed_at" DESC);
