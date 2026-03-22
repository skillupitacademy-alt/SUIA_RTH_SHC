CREATE TYPE "public"."assignment_help_request_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."assignment_progress_status" AS ENUM('not_started', 'in_progress', 'self_completed');--> statement-breakpoint
CREATE TYPE "public"."assignment_question_type" AS ENUM('mcq', 'short_answer', 'code', 'open_ended');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutorial_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"question_type" "public"."assignment_question_type" NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" jsonb NOT NULL,
	"order_index" integer,
	"points" integer DEFAULT 10 NOT NULL,
	"time_limit_sec" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assignment_help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"question" text NOT NULL,
	"status" "assignment_help_request_status" DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assignment_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"status" "assignment_progress_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE IF EXISTS "tutorial_assignments" ALTER COLUMN "question_type" SET DATA TYPE "public"."assignment_question_type" USING "question_type"::text::"public"."assignment_question_type";--> statement-breakpoint
ALTER TABLE IF EXISTS "tutorial_assignments" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE IF EXISTS "tutorial_assignments" ADD COLUMN IF NOT EXISTS "question" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE IF EXISTS "tutorial_assignments" ADD COLUMN IF NOT EXISTS "hints" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE IF EXISTS "tutorial_assignments" ADD COLUMN IF NOT EXISTS "reference_answer" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_help_requests" ADD CONSTRAINT "assignment_help_requests_assignment_id_tutorial_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."tutorial_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_assignment_help_request_user_assignment" ON "assignment_help_requests" USING btree ("user_id","assignment_id","subtopic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_assignment_progress_user_subtopic_difficulty" ON "assignment_progress" USING btree ("user_id","subtopic_id","difficulty");
