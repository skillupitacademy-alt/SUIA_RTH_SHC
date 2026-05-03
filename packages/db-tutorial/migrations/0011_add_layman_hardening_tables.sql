-- Phase 2B Week 2: Layman Hardening Tables
-- ==========================================
-- Adds audit logs, prompt history, and content revisions for security and governance

-- 1. Create layman_audit_action enum
CREATE TYPE layman_audit_action AS ENUM (
  -- Prompt operations
  'prompt_generated',
  'prompt_exported',
  'prompt_copied',
  'prompt_modified',
  
  -- Content operations
  'content_ingested',
  'content_parsed',
  'content_validated',
  'content_revised',
  'content_sanitized',
  
  -- Lifecycle operations
  'section_created',
  'section_updated',
  'section_submitted_review',
  'section_approved',
  'section_rejected',
  'section_published',
  'section_archived',
  'section_restored',
  
  -- Governance operations
  'validation_passed',
  'validation_failed',
  'quality_score_calculated',
  'hallucination_detected',
  
  -- Security operations
  'tamper_detected',
  'sanitization_applied',
  'rollback_executed'
);

-- 2. Create layman_audit_logs table
CREATE TABLE layman_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity references
  section_id UUID,
  prompt_id UUID,
  
  -- Action details
  action layman_audit_action NOT NULL,
  action_category VARCHAR(50) NOT NULL,
  
  -- Actor information
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  
  -- Brand context
  brand_id VARCHAR(50) NOT NULL,
  
  -- Change tracking
  before_state JSONB,
  after_state JSONB,
  diff JSONB,
  
  -- Metadata
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Result
  success VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for layman_audit_logs
CREATE INDEX idx_layman_audit_section_id ON layman_audit_logs(section_id);
CREATE INDEX idx_layman_audit_prompt_id ON layman_audit_logs(prompt_id);
CREATE INDEX idx_layman_audit_user_id ON layman_audit_logs(user_id);
CREATE INDEX idx_layman_audit_action ON layman_audit_logs(action);
CREATE INDEX idx_layman_audit_brand_id ON layman_audit_logs(brand_id);
CREATE INDEX idx_layman_audit_created_at ON layman_audit_logs(created_at);

-- 3. Create layman_prompt_history table
CREATE TABLE layman_prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Section reference
  section_id UUID,
  subtopic_id UUID NOT NULL,
  
  -- Prompt details
  prompt_template_id UUID NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  template_version VARCHAR(50) NOT NULL,
  
  -- Generated content
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  full_prompt TEXT NOT NULL,
  
  -- Variables used
  variables JSONB NOT NULL,
  
  -- Integrity verification
  prompt_hash VARCHAR(64) NOT NULL,
  prompt_signature TEXT,
  
  -- Brand context
  brand_id VARCHAR(50) NOT NULL,
  
  -- Educational context
  educational_architecture_id UUID,
  educational_architecture_name VARCHAR(255),
  ui_architecture_id UUID,
  ui_architecture_name VARCHAR(255),
  
  -- Usage tracking
  was_used VARCHAR(20) NOT NULL DEFAULT 'pending',
  used_at TIMESTAMP,
  
  -- Export tracking
  export_count INTEGER NOT NULL DEFAULT 0,
  last_exported_at TIMESTAMP,
  export_format VARCHAR(50),
  
  -- Metadata
  metadata JSONB,
  
  -- Actor
  generated_by UUID NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for layman_prompt_history
CREATE INDEX idx_layman_prompt_history_section_id ON layman_prompt_history(section_id);
CREATE INDEX idx_layman_prompt_history_subtopic_id ON layman_prompt_history(subtopic_id);
CREATE INDEX idx_layman_prompt_history_hash ON layman_prompt_history(prompt_hash);
CREATE INDEX idx_layman_prompt_history_brand_id ON layman_prompt_history(brand_id);
CREATE INDEX idx_layman_prompt_history_created_at ON layman_prompt_history(created_at);

-- 4. Create layman_content_revisions table
CREATE TABLE layman_content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Section reference
  section_id UUID NOT NULL,
  
  -- Version tracking
  revision_number INTEGER NOT NULL,
  parent_revision_id UUID,
  
  -- Content snapshot
  content JSONB NOT NULL,
  
  -- Validation results at time of revision
  quality_score INTEGER,
  hallucination_risk INTEGER,
  completeness_score INTEGER,
  validation_errors JSONB,
  validation_warnings JSONB,
  
  -- Status at time of revision
  status VARCHAR(50) NOT NULL,
  governance_status VARCHAR(50),
  
  -- Change tracking
  change_type VARCHAR(50) NOT NULL,
  change_reason TEXT,
  changed_subsections JSONB,
  
  -- AI source tracking
  source_prompt_id UUID,
  ai_response_raw TEXT,
  
  -- Brand context
  brand_id VARCHAR(50) NOT NULL,
  
  -- Metadata
  metadata JSONB,
  
  -- Actor
  created_by UUID NOT NULL,
  created_by_role VARCHAR(50),
  
  -- Rollback tracking
  is_current_version VARCHAR(10) NOT NULL DEFAULT 'yes',
  replaced_at TIMESTAMP,
  replaced_by UUID,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for layman_content_revisions
CREATE INDEX idx_layman_content_revisions_section_id ON layman_content_revisions(section_id);
CREATE INDEX idx_layman_content_revisions_revision_number ON layman_content_revisions(section_id, revision_number);
CREATE INDEX idx_layman_content_revisions_parent_id ON layman_content_revisions(parent_revision_id);
CREATE INDEX idx_layman_content_revisions_prompt_id ON layman_content_revisions(source_prompt_id);
CREATE INDEX idx_layman_content_revisions_current ON layman_content_revisions(section_id, is_current_version);
CREATE INDEX idx_layman_content_revisions_created_at ON layman_content_revisions(created_at);

-- Add comments for documentation
COMMENT ON TABLE layman_audit_logs IS 'Comprehensive audit trail for all Layman section operations';
COMMENT ON TABLE layman_prompt_history IS 'Tracks all generated prompts with integrity verification for tamper detection';
COMMENT ON TABLE layman_content_revisions IS 'Stores all content versions for rollback capability and change tracking';

COMMENT ON COLUMN layman_prompt_history.prompt_hash IS 'SHA-256 hash of full_prompt for tamper detection';
COMMENT ON COLUMN layman_content_revisions.is_current_version IS 'Flag indicating if this is the current active version';
COMMENT ON COLUMN layman_audit_logs.diff IS 'Computed difference between before_state and after_state';
