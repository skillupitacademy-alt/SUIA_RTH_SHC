DO $$ BEGIN
    BEGIN
        ALTER TABLE "exams" ADD COLUMN "last_answered_at" timestamp;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exams_dashboard_opt" ON "exams" USING btree ("user_id","status","completed_at" desc);
