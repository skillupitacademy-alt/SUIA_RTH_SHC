CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" "tutorial_project_scope" NOT NULL,
	"parent_id" uuid NOT NULL,
	"parent_name" text NOT NULL,
	"verification_code" text NOT NULL,
	"pdf_url" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity" timestamp,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" text DEFAULT 'bronze' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_certificates_user" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_certificates_verify" ON "certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_streaks_user" ON "student_streaks" USING btree ("user_id");
