-- =====================================================================
-- Phase 1: Add navigation_node_id to tutorial_sections
-- =====================================================================
-- PURPOSE: Enable multiple independent content pages per subtopic
-- 
-- OLD IDENTITY: (subtopicId, brandId)
-- NEW IDENTITY: (subtopicId, navigationNodeId, brandId)
--
-- SAFE FOR CLEAN DATABASE: tutorial_sections verified empty before execution
-- =====================================================================

BEGIN;

-- =====================================================================
-- STEP 1: Add navigation_node_id column (NOT NULL)
-- =====================================================================
-- Since tutorial_sections was reset to 0 records, we can create as NOT NULL
-- No backfill needed - all future records MUST provide navigationNodeId

ALTER TABLE tutorial_sections
ADD COLUMN IF NOT EXISTS navigation_node_id TEXT NOT NULL;

COMMENT ON COLUMN tutorial_sections.navigation_node_id IS 
'Phase 1: Canonical navigation node ID from Phase 0.2 sidebar (e.g., "what-is-java", "introduction-to-python"). MUST use node.id, NOT derived from name/slug/URL.';

-- =====================================================================
-- STEP 2: Drop old unique constraint (if exists)
-- =====================================================================
-- Old identity was: (subtopicId, brandId) for active records
-- This constraint may have various names depending on migration history

DROP INDEX IF EXISTS uq_tutorial_v2_identity_active;
DROP INDEX IF EXISTS uq_tutorial_sections_subtopic_brand;
DROP INDEX IF EXISTS tutorial_sections_subtopic_id_brand_id_key;

-- =====================================================================
-- STEP 3: Create new Phase 1 unique constraint
-- =====================================================================
-- NEW IDENTITY: (subtopicId, navigationNodeId, brandId)
-- Partial index: only enforces uniqueness for active (non-deleted) records
-- Allows multiple archived tutorials with same identity

CREATE UNIQUE INDEX IF NOT EXISTS uq_tutorial_v2_identity_active
ON tutorial_sections (subtopic_id, navigation_node_id, brand_id)
WHERE deleted_at IS NULL;

COMMENT ON INDEX uq_tutorial_v2_identity_active IS
'Phase 1 identity constraint: one ACTIVE tutorial per (subtopic, navigationNode, brand). Allows multiple pages per subtopic when navigationNodeId differs. Allows archived duplicates.';

-- =====================================================================
-- STEP 4: Update delivery index for page-aware queries
-- =====================================================================
-- Optimize common query pattern: (subtopicId, navigationNodeId, brandId, status)

DROP INDEX IF EXISTS idx_tutorial_v2_delivery;

CREATE INDEX IF NOT EXISTS idx_tutorial_v2_delivery
ON tutorial_sections (subtopic_id, navigation_node_id, brand_id, status);

COMMENT ON INDEX idx_tutorial_v2_delivery IS
'Phase 1 delivery index: optimizes page-aware content retrieval by (subtopic, navigationNode, brand, status)';

-- =====================================================================
-- VERIFICATION
-- =====================================================================

DO $$
DECLARE
  col_exists BOOLEAN;
  idx_exists BOOLEAN;
  sections_count INTEGER;
BEGIN
  -- Verify column exists and is NOT NULL
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tutorial_sections' 
    AND column_name = 'navigation_node_id'
    AND is_nullable = 'NO'
  ) INTO col_exists;
  
  IF NOT col_exists THEN
    RAISE EXCEPTION 'MIGRATION VERIFICATION FAILED: navigation_node_id column not created or not NOT NULL';
  END IF;
  
  -- Verify new unique index exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'tutorial_sections' 
    AND indexname = 'uq_tutorial_v2_identity_active'
  ) INTO idx_exists;
  
  IF NOT idx_exists THEN
    RAISE EXCEPTION 'MIGRATION VERIFICATION FAILED: uq_tutorial_v2_identity_active index not created';
  END IF;
  
  -- Verify table is still empty (should be 0 after reset)
  SELECT COUNT(*) INTO sections_count FROM tutorial_sections;
  
  RAISE NOTICE '✓ Phase 1 migration successful';
  RAISE NOTICE '  - navigation_node_id column: NOT NULL';
  RAISE NOTICE '  - Identity constraint: (subtopic_id, navigation_node_id, brand_id)';
  RAISE NOTICE '  - Delivery index: updated';
  RAISE NOTICE '  - Current tutorial_sections count: %', sections_count;
  
END $$;

COMMIT;

-- =====================================================================
-- ROLLBACK PROCEDURE (if needed)
-- =====================================================================
-- To rollback this migration:
--
-- BEGIN;
-- DROP INDEX IF EXISTS uq_tutorial_v2_identity_active;
-- DROP INDEX IF EXISTS idx_tutorial_v2_delivery;
-- ALTER TABLE tutorial_sections DROP COLUMN IF EXISTS navigation_node_id;
-- -- Restore old constraint (optional - depends on your rollback strategy)
-- COMMIT;
-- =====================================================================
