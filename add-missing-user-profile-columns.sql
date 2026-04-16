-- Add missing onboarding columns to user_profiles table
-- These columns are expected by the Drizzle schema and onboarding API

-- RTH Database
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_goal text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sub_domain text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS time_commitment text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS journey_status text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false NOT NULL;