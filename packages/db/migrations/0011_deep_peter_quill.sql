ALTER TABLE "reports" ADD COLUMN "generation_time_ms" integer;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "layout_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "error_stage" text;