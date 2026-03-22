CREATE TYPE "public"."live_session_request_status" AS ENUM('pending', 'accepted', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "live_session_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"doubt_text" text,
	"status" "live_session_request_status" DEFAULT 'pending' NOT NULL,
	"faculty_id" uuid,
	"meeting_link" text,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"cancelled_reason" text,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_session_requests_student" ON "live_session_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_session_requests_faculty" ON "live_session_requests" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_session_requests_status" ON "live_session_requests" USING btree ("status");