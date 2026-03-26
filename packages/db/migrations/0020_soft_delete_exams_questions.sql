ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
