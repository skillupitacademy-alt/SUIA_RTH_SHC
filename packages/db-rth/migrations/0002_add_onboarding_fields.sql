-- Add onboarding fields to users table
ALTER TABLE "users" ADD COLUMN "is_onboarded" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "primary_goal" text;
ALTER TABLE "users" ADD COLUMN "domain" text;
ALTER TABLE "users" ADD COLUMN "sub_domain" text;
ALTER TABLE "users" ADD COLUMN "time_commitment" text;
ALTER TABLE "users" ADD COLUMN "journey_status" text;

-- Add onboarding fields to user_profiles table
ALTER TABLE "user_profiles" ADD COLUMN "primary_goal" text;
ALTER TABLE "user_profiles" ADD COLUMN "domain" text;
ALTER TABLE "user_profiles" ADD COLUMN "sub_domain" text;
ALTER TABLE "user_profiles" ADD COLUMN "time_commitment" text;
ALTER TABLE "user_profiles" ADD COLUMN "journey_status" text;
ALTER TABLE "user_profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;
