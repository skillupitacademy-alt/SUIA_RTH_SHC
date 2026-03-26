CREATE TYPE "public"."people_admission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."people_admission_type" AS ENUM('digital', 'training');--> statement-breakpoint
CREATE TYPE "public"."people_attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TYPE "public"."people_batch_mode" AS ENUM('online', 'offline', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."people_batch_status" AS ENUM('upcoming', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."people_demo_session_status" AS ENUM('scheduled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."people_enquiry_source" AS ENUM('website', 'referral', 'ad', 'walkin');--> statement-breakpoint
CREATE TYPE "public"."people_enquiry_status" AS ENUM('new', 'contacted', 'qualified', 'lost');--> statement-breakpoint
CREATE TYPE "public"."people_enrollment_status" AS ENUM('active', 'dropped', 'completed');--> statement-breakpoint
CREATE TYPE "public"."people_faculty_availability_type" AS ENUM('fulltime', 'parttime', 'contract');--> statement-breakpoint
CREATE TYPE "public"."people_faculty_status" AS ENUM('active', 'inactive', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."people_session_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"admission_type" "people_admission_type" NOT NULL,
	"domain_id" uuid,
	"batch_id" uuid,
	"status" "people_admission_status" DEFAULT 'pending' NOT NULL,
	"admission_date" timestamp with time zone DEFAULT now() NOT NULL,
	"documents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approved_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"status" "people_attendance_status" NOT NULL,
	"marked_by" uuid,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "people_enrollment_status" DEFAULT 'active' NOT NULL,
	"dropped_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "batch_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"faculty_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"subtopics_covered" uuid[] DEFAULT '{}' NOT NULL,
	"session_notes" text,
	"status" "people_session_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain_id" uuid,
	"subject_id" uuid,
	"faculty_id" uuid,
	"start_date" date,
	"end_date" date,
	"capacity" integer DEFAULT 0 NOT NULL,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"mode" "people_batch_mode" DEFAULT 'online' NOT NULL,
	"status" "people_batch_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "demo_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid,
	"faculty_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "people_demo_session_status" DEFAULT 'scheduled' NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"source" "people_enquiry_source" DEFAULT 'website' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"status" "people_enquiry_status" DEFAULT 'new' NOT NULL,
	"assigned_counsellor_id" uuid,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiry_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"counsellor_id" uuid,
	"follow_up_type" text NOT NULL,
	"notes" text,
	"next_follow_up_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"booked_batch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"specializations" uuid[] DEFAULT '{}' NOT NULL,
	"availability_type" "people_faculty_availability_type" NOT NULL,
	"status" "people_faculty_status" DEFAULT 'active' NOT NULL,
	"hourly_rate" numeric(10, 2),
	"rating_avg" numeric(3, 2),
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"joined_at" date DEFAULT CURRENT_DATE NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_batch_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."batch_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_faculty_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_sessions" ADD CONSTRAINT "batch_sessions_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_sessions" ADD CONSTRAINT "batch_sessions_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_counsellor_id_users_id_fk" FOREIGN KEY ("assigned_counsellor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_follow_ups" ADD CONSTRAINT "enquiry_follow_ups_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_follow_ups" ADD CONSTRAINT "enquiry_follow_ups_counsellor_id_users_id_fk" FOREIGN KEY ("counsellor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_availability" ADD CONSTRAINT "faculty_availability_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_availability" ADD CONSTRAINT "faculty_availability_booked_batch_id_batches_id_fk" FOREIGN KEY ("booked_batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_admissions_student" ON "admissions" USING btree ("student_user_id") WHERE "admissions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_admissions_status" ON "admissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_admissions_batch" ON "admissions" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_session" ON "attendance_records" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_attendance_student_session" ON "attendance_records" USING btree ("session_id","student_user_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_student_date" ON "attendance_records" USING btree ("student_user_id","marked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_enrollments_batch_student" ON "batch_enrollments" USING btree ("batch_id","student_user_id") WHERE "batch_enrollments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_enrollments_student" ON "batch_enrollments" USING btree ("student_user_id","status");--> statement-breakpoint
CREATE INDEX "idx_batch_sessions_batch_date" ON "batch_sessions" USING btree ("batch_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_batch_sessions_faculty_upcoming" ON "batch_sessions" USING btree ("faculty_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_batch_sessions_subtopics" ON "batch_sessions" USING gin ("subtopics_covered");--> statement-breakpoint
CREATE INDEX "idx_batches_status_domain" ON "batches" USING btree ("status","domain_id");--> statement-breakpoint
CREATE INDEX "idx_batches_faculty" ON "batches" USING btree ("faculty_id","status");--> statement-breakpoint
CREATE INDEX "idx_batches_active" ON "batches" USING btree ("status","start_date");--> statement-breakpoint
CREATE INDEX "idx_demo_sessions_enquiry" ON "demo_sessions" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_demo_sessions_scheduled" ON "demo_sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_enquiries_status_created" ON "enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_enquiries_phone" ON "enquiries" USING btree ("phone") WHERE "enquiries"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_enquiries_counsellor" ON "enquiries" USING btree ("assigned_counsellor_id","status");--> statement-breakpoint
CREATE INDEX "idx_enquiries_source" ON "enquiries" USING btree ("source","created_at");--> statement-breakpoint
CREATE INDEX "idx_followups_enquiry" ON "enquiry_follow_ups" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "idx_followups_scheduled" ON "enquiry_follow_ups" USING btree ("next_follow_up_at");--> statement-breakpoint
CREATE INDEX "idx_faculty_avail_faculty" ON "faculty_availability" USING btree ("faculty_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_faculty_avail_unbooked" ON "faculty_availability" USING btree ("faculty_id","is_booked");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_faculty_user" ON "faculty" USING btree ("user_id") WHERE "faculty"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_faculty_status" ON "faculty" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_faculty_specializations" ON "faculty" USING gin ("specializations");