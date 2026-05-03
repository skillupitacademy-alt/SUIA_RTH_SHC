-- =====================================================
-- DELIVERABLE 2 - PHASE 2A: MIGRATION TRACKING GOVERNANCE
-- Migration: Create legacy_content_migration_tracking
-- =====================================================
-- Purpose: Enterprise-grade migration governance and audit
-- Features:
--   - Idempotency control
--   - Duplicate prevention
--   - Resume capability
--   - Rollback granularity
--   - Batch tracking
--   - Full audit trail
-- =====================================================

-- Migration Status Enum
DO $$ BEGIN
  CREATE TYPE migration_status AS ENUM (
    'pending',
    'in_progress',
    'success',
    'partial',
    'failed',
    'skipped',
    'rolled_back'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migration Mode Enum
DO $$ BEGIN
  CREATE TYPE migration_mode AS ENUM (
    'pilot',
    'full',
    'retry',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migration Tracking Table
CREATE TABLE IF NOT EXISTS legacy_content_migration_tracking (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Legacy Content Reference
  legacy_content_id UUID NOT NULL,
  subtopic_id UUID NOT NULL,
  topic_id UUID,
  
  -- Migration Metadata
  migration_batch_id UUID NOT NULL,
  migration_mode migration_mode NOT NULL DEFAULT 'full',
  migration_status migration_status NOT NULL DEFAULT 'pending',
  
  -- Migration Results
  sections_created INTEGER DEFAULT 0,
  subsections_created INTEGER DEFAULT 0,
  sections_expected INTEGER DEFAULT 12,
  subsections_expected INTEGER,
  
  -- Duplicate Prevention
  duplicate_sections_skipped INTEGER DEFAULT 0,
  was_already_migrated BOOLEAN DEFAULT FALSE,
  
  -- Quality & Validation
  validation_score INTEGER,
  validation_passed BOOLEAN,
  validation_errors JSONB,
  
  -- Rollback Control
  rollback_ready BOOLEAN DEFAULT TRUE,
  rollback_batch_id UUID,
  can_resume BOOLEAN DEFAULT TRUE,
  
  -- Execution Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Error Handling
  error_log JSONB,
  warnings JSONB,
  retry_count INTEGER DEFAULT 0,
  
  -- Audit Trail
  created_by TEXT DEFAULT 'migration_script',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_legacy_content_migration UNIQUE (legacy_content_id, migration_mode)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_migration_tracking_content ON legacy_content_migration_tracking(legacy_content_id);
CREATE INDEX IF NOT EXISTS idx_migration_tracking_batch ON legacy_content_migration_tracking(migration_batch_id);
CREATE INDEX IF NOT EXISTS idx_migration_tracking_status ON legacy_content_migration_tracking(migration_status);
CREATE INDEX IF NOT EXISTS idx_migration_tracking_mode ON legacy_content_migration_tracking(migration_mode);
CREATE INDEX IF NOT EXISTS idx_migration_tracking_subtopic ON legacy_content_migration_tracking(subtopic_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_migration_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Calculate duration if completed
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_migration_tracking_timestamp
  BEFORE UPDATE ON legacy_content_migration_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_migration_tracking_timestamp();

-- Migration Statistics View
CREATE OR REPLACE VIEW migration_statistics AS
SELECT 
  migration_mode,
  migration_status,
  COUNT(*) as count,
  SUM(sections_created) as total_sections,
  SUM(subsections_created) as total_subsections,
  AVG(duration_seconds) as avg_duration_seconds,
  AVG(validation_score) as avg_validation_score
FROM legacy_content_migration_tracking
GROUP BY migration_mode, migration_status;

-- Comments
COMMENT ON TABLE legacy_content_migration_tracking IS 'Enterprise migration tracking for legacy content transformation';
COMMENT ON COLUMN legacy_content_migration_tracking.legacy_content_id IS 'Reference to tutorial_content.id';
COMMENT ON COLUMN legacy_content_migration_tracking.migration_batch_id IS 'Batch identifier for grouped rollback';
COMMENT ON COLUMN legacy_content_migration_tracking.validation_score IS 'Quality score 0-100';
COMMENT ON COLUMN legacy_content_migration_tracking.rollback_ready IS 'Can be safely rolled back';

-- =====================================================
-- MIGRATION TRACKING TABLE CREATED
-- =====================================================
-- Next Steps:
-- 1. Harden migration script with tracking
-- 2. Add idempotency checks
-- 3. Add transactional safety
-- 4. Build rollback script
-- =====================================================
