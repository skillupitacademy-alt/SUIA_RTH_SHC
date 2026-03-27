CREATE TYPE "public"."placement_interview_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TABLE "placement_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"interviewer_name" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "placement_interview_status" DEFAULT 'scheduled' NOT NULL,
	"meeting_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_placement_interviews_student" ON "placement_interviews" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_placement_interviews_listing" ON "placement_interviews" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_placement_interviews_status_scheduled_at" ON "placement_interviews" USING btree ("status","scheduled_at");