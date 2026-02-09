ALTER TABLE "exams" ADD COLUMN "last_answered_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_exams_dashboard_opt" ON "exams" USING btree ("user_id","status","completed_at" desc);