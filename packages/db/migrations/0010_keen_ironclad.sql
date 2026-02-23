CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_provider" text NOT NULL,
	"file_ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"page_count" integer,
	"file_size_kb" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reports_attempt_id_unique" UNIQUE("attempt_id")
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_attempt_id_exams_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reports_attempt_id" ON "reports" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_reports_user_id" ON "reports" USING btree ("user_id");