-- FND03: Add tenant boundary enforcement to tutorial_progress
-- Migration: 0029_fnd03_add_tenant_to_progress

-- Add tenant_id column with default
ALTER TABLE "tutorial_progress" ADD COLUMN "tenant_id" text DEFAULT 'realtutorialhub' NOT NULL;

-- Create index on tenant_id for performance
CREATE INDEX IF NOT EXISTS "idx_tutorial_progress_tenant" ON "tutorial_progress" ("tenant_id");

-- Drop old unique constraint (userId + subtopicId)
DROP INDEX IF EXISTS "uq_tutorial_progress_user_subtopic";

-- Create new unique constraint (tenantId + userId + subtopicId)
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tutorial_progress_tenant_user_subtopic" ON "tutorial_progress" ("tenant_id", "user_id", "subtopic_id");

-- Data migration: assign existing progress to default tenant
-- Note: This assumes all existing data belongs to 'realtutorialhub' tenant
-- For production deployment, custom migration logic may be needed to map users to correct tenants
UPDATE "tutorial_progress" SET "tenant_id" = 'realtutorialhub' WHERE "tenant_id" IS NULL;
