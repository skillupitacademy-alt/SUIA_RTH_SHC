ALTER TYPE "public"."tutorial_project_submission_status" ADD VALUE 'ai_reviewing' BEFORE 'graded';--> statement-breakpoint
ALTER TYPE "public"."tutorial_project_submission_status" ADD VALUE 'needs_review' BEFORE 'graded';--> statement-breakpoint
ALTER TYPE "public"."tutorial_project_submission_status" ADD VALUE 'approved' BEFORE 'graded';--> statement-breakpoint
ALTER TYPE "public"."tutorial_project_submission_status" ADD VALUE 'revision_needed' BEFORE 'graded';--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"level" "tutorial_project_level",
	"scope" "tutorial_project_scope",
	"criteria" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	"project_submission_id" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tutorial_project_submissions" ADD COLUMN "ai_review" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "tutorial_project_submissions" ADD COLUMN "peer_reviews" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tutorial_project_submissions" ADD COLUMN "admin_review" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "tutorial_project_submissions" ADD COLUMN "badge_awarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_project_submission_id_tutorial_project_submissions_id_fk" FOREIGN KEY ("project_submission_id") REFERENCES "public"."tutorial_project_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_badges_scope" ON "badges" USING btree ("scope","level");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_badges_user_badge" ON "student_badges" USING btree ("user_id","badge_id");
