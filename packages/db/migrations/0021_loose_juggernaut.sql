ALTER TABLE "login_attempts" ADD COLUMN IF NOT EXISTS "brand" text DEFAULT 'realtutorialhub' NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_login_attempts_brand_user_ip" ON "login_attempts" USING btree ("brand","user_id","ip");
