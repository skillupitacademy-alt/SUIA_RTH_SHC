-- FND03: Add tenant-qualified ownership to users table
-- Migration: 0001_fnd03_add_tenant_ownership

-- Create tenant enum
DO $$ BEGIN
 CREATE TYPE "public"."tenant" AS ENUM('realtutorialhub', 'skillup', 'skillhubcore');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add tenant_id column with default
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" "tenant" DEFAULT 'realtutorialhub' NOT NULL;

-- Add local_subject_id column (nullable for migration)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "local_subject_id" text;

-- Create composite index on tenant_id and local_subject_id for ownership lookups
CREATE INDEX IF NOT EXISTS "idx_users_tenant_local_subject" ON "users" ("tenant_id", "local_subject_id");

-- Data migration: assign existing users to default tenant
-- Note: This assumes all existing data belongs to 'realtutorialhub' tenant
-- For production deployment, custom migration logic may be needed to map users to correct tenants
UPDATE "users" SET "tenant_id" = 'realtutorialhub' WHERE "tenant_id" IS NULL;

-- Note: local_subject_id will be populated by application logic during user operations
-- It references the brand-specific user ID (e.g., db-skillup.users.id)
