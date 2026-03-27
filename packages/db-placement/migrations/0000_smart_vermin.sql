CREATE TYPE "public"."job_listing_status" AS ENUM('draft', 'open', 'closed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."placement_application_status" AS ENUM('applied', 'screening', 'shortlisted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."placement_offer_status" AS ENUM('offered', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."placement_profile_status" AS ENUM('active', 'paused', 'placed', 'archived');--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"job_type" text NOT NULL,
	"status" "job_listing_status" DEFAULT 'open' NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"ctc_min" integer,
	"ctc_max" integer,
	"required_skills" text[] NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "student_placement_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "placement_profile_status" DEFAULT 'active' NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"skills" text[] NOT NULL,
	"preferred_location" text,
	"expected_ctc" integer,
	"experience_summary" text,
	"resume_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "placement_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"status" "placement_application_status" DEFAULT 'applied' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "placement_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"status" "placement_offer_status" DEFAULT 'offered' NOT NULL,
	"offered_ctc" integer NOT NULL,
	"response_due_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_job_listings_domain_status" ON "job_listings" USING btree ("domain_id","status");--> statement-breakpoint
CREATE INDEX "idx_job_listings_open_deadline" ON "job_listings" USING btree ("deadline") WHERE "job_listings"."status" = 'open';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_listings_company_title" ON "job_listings" USING btree ("company_name","title");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_placement_profiles_user" ON "student_placement_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_placement_profiles_status" ON "student_placement_profiles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_placement_applications_student_listing" ON "placement_applications" USING btree ("student_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_placement_applications_status" ON "placement_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_placement_offers_student" ON "placement_offers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_placement_offers_status" ON "placement_offers" USING btree ("status");