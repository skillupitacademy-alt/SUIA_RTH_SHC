-- =====================================================
-- PHASE 1 P0 FOUNDATION: MODULAR TUTORIAL SCHEMA
-- Migration: 001 - Create Modular Schema
-- =====================================================
-- Purpose: Transform monolithic tutorial_content into modular 12-section system
-- Safety: Zero-downtime migration, preserves existing data
-- Rollback: See 001-rollback-modular-schema.sql
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUMS
-- =====================================================

-- Section Types (12 Universal Sections)
CREATE TYPE section_type AS ENUM (
  'notes',
  'layman',
  'visual',
  'real_life',
  'technical',
  'code',
  'practice',
  'assignment',
  'project',
  'quiz',
  'summary',
  'interview'
);

-- Section Status (Content Lifecycle)
CREATE TYPE section_status AS ENUM (
  'draft',
  'generating',
  'validating',
  'pending_review',
  'in_review',
  'changes_requested',
  'approved',
  'deploying',
  'deployed',
  'archived'
);

-- Deployment Type
CREATE TYPE deployment_type AS ENUM (
  'full',
  'staged',
  'canary',
  'ab_test',
  'dark_launch'
);

-- Orchestration Status
CREATE TYPE orchestration_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
);

-- Job Status
CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'validating',
  'completed',
  'failed',
  'retrying'
);

-- Review Status
CREATE TYPE review_status AS ENUM (
  'pending_review',
  'in_review',
  'approved',
  'rejected',
  'changes_requested'
);

-- Priority Level
CREATE TYPE priority_level AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- =====================================================
-- STEP 2: CREATE CORE TABLES
-- =====================================================

-- Educational Architectures (Learning Style Templates)
CREATE TABLE educational_architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  target_audience JSONB NOT NULL,
  target_domains JSONB,
  section_sequence JSONB NOT NULL,
  interactivity_level TEXT NOT NULL DEFAULT 'medium',
  visual_density TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UI Architectures (Renderer Templates)
CREATE TABLE ui_architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  section_renderers JSONB NOT NULL,
  responsive_breakpoints JSONB,
  accessibility_profile TEXT NOT NULL DEFAULT 'standard',
  compatible_brands JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tutorial Sections (Modular Content)
CREATE TABLE tutorial_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID NOT NULL REFERENCES tutorial_subtopics(id) ON DELETE CASCADE,
  section_type section_type NOT NULL,
  difficulty tutorial_difficulty NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  language TEXT NOT NULL DEFAULT 'en',
  status section_status NOT NULL DEFAULT 'draft',
  
  -- AI Generation
  generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model_used TEXT,
  generation_job_id UUID,
  prompt_template_id UUID,
  quality_score INTEGER,
  hallucination_score INTEGER,
  regeneration_count INTEGER NOT NULL DEFAULT 0,
  
  -- Approval
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Architecture
  educational_architecture_id UUID,
  ui_architecture_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT uq_section_subtopic_type_difficulty UNIQUE (subtopic_id, section_type, difficulty)
);

-- Tutorial Subsections (Granular Content Chunks)
CREATE TABLE tutorial_subsections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES tutorial_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL,
  estimated_read_time INTEGER,
  complexity_level INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE AI ORCHESTRATION TABLES
-- =====================================================

-- Prompt Templates (Versioned AI Prompts)
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type section_type NOT NULL,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  validation_rules JSONB,
  success_criteria JSONB,
  model_name TEXT NOT NULL DEFAULT 'gpt-4',
  temperature INTEGER NOT NULL DEFAULT 70,
  max_tokens INTEGER NOT NULL DEFAULT 4000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_rate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_prompt_section_version UNIQUE (section_type, version)
);

-- AI Generation Orchestration (Job Coordination)
CREATE TABLE ai_generation_orchestration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID NOT NULL,
  difficulty tutorial_difficulty NOT NULL,
  educational_architecture_id UUID NOT NULL,
  status orchestration_status NOT NULL DEFAULT 'pending',
  sections_to_generate JSONB NOT NULL,
  sections_generated JSONB NOT NULL DEFAULT '[]',
  sections_failed JSONB NOT NULL DEFAULT '[]',
  total_sections INTEGER NOT NULL,
  completed_sections INTEGER NOT NULL DEFAULT 0,
  failed_sections INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion_at TIMESTAMPTZ,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  total_cost_usd INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  initiated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Section Generation Jobs (Individual Jobs)
CREATE TABLE ai_section_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id UUID NOT NULL REFERENCES ai_generation_orchestration(id) ON DELETE CASCADE,
  section_type section_type NOT NULL,
  subtopic_id UUID NOT NULL,
  difficulty tutorial_difficulty NOT NULL,
  prompt_template_id UUID NOT NULL,
  prompt_version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  prompt_variables JSONB NOT NULL,
  ai_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  temperature INTEGER NOT NULL DEFAULT 70,
  max_tokens INTEGER NOT NULL DEFAULT 4000,
  status job_status NOT NULL DEFAULT 'pending',
  raw_output TEXT,
  parsed_output JSONB,
  validation_status TEXT,
  validation_errors JSONB,
  validation_warnings JSONB,
  quality_score INTEGER,
  hallucination_score INTEGER,
  hallucination_flags JSONB,
  tokens_used INTEGER,
  cost_usd INTEGER,
  generation_time_ms INTEGER,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE GOVERNANCE TABLES
-- =====================================================

-- Content Review Queue (Human Approval)
CREATE TABLE content_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id UUID NOT NULL,
  section_id UUID NOT NULL,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  status review_status NOT NULL DEFAULT 'pending_review',
  review_comments TEXT,
  rejection_reason TEXT,
  suggested_changes JSONB,
  reviewer_quality_score INTEGER,
  reviewer_flags JSONB,
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  priority priority_level NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Deployments (Deployment Governance)
CREATE TABLE content_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES tutorial_sections(id),
  version INTEGER NOT NULL,
  deployment_type deployment_type NOT NULL DEFAULT 'full',
  target_audience JSONB,
  rollout_percentage INTEGER NOT NULL DEFAULT 100,
  experiment_id UUID,
  variant_name TEXT,
  rollback_version INTEGER,
  can_rollback BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending',
  impressions INTEGER NOT NULL DEFAULT 0,
  completion_rate INTEGER NOT NULL DEFAULT 0,
  feedback_score INTEGER,
  error_rate INTEGER,
  deployed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Generation Metrics (Analytics)
CREATE TABLE ai_generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  hour INTEGER,
  aggregation_level TEXT NOT NULL,
  total_generations INTEGER NOT NULL DEFAULT 0,
  successful_generations INTEGER NOT NULL DEFAULT 0,
  failed_generations INTEGER NOT NULL DEFAULT 0,
  validation_pass_rate INTEGER NOT NULL DEFAULT 0,
  average_quality_score INTEGER NOT NULL DEFAULT 0,
  average_hallucination_score INTEGER NOT NULL DEFAULT 0,
  hallucination_incidents INTEGER NOT NULL DEFAULT 0,
  approval_rate INTEGER NOT NULL DEFAULT 0,
  average_review_time_minutes INTEGER NOT NULL DEFAULT 0,
  average_generation_time_ms INTEGER NOT NULL DEFAULT 0,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  total_cost_usd INTEGER NOT NULL DEFAULT 0,
  provider_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_metrics_date_hour_level UNIQUE (date, hour, aggregation_level)
);

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

-- Tutorial Sections Indexes
CREATE INDEX idx_sections_subtopic ON tutorial_sections(subtopic_id);
CREATE INDEX idx_sections_status ON tutorial_sections(status);
CREATE INDEX idx_sections_type ON tutorial_sections(section_type);
CREATE INDEX idx_sections_published ON tutorial_sections(subtopic_id, status);

-- Tutorial Subsections Indexes
CREATE INDEX idx_subsections_section ON tutorial_subsections(section_id);
CREATE INDEX idx_subsections_order ON tutorial_subsections(section_id, order_index);

-- AI Orchestration Indexes
CREATE INDEX idx_orchestration_status ON ai_generation_orchestration(status);
CREATE INDEX idx_orchestration_subtopic ON ai_generation_orchestration(subtopic_id);
CREATE INDEX idx_orchestration_initiator ON ai_generation_orchestration(initiated_by);

-- AI Jobs Indexes
CREATE INDEX idx_jobs_orchestration ON ai_section_generation_jobs(orchestration_id);
CREATE INDEX idx_jobs_status ON ai_section_generation_jobs(status);
CREATE INDEX idx_jobs_section ON ai_section_generation_jobs(section_type);

-- Review Queue Indexes
CREATE INDEX idx_review_queue_status ON content_review_queue(status);
CREATE INDEX idx_review_queue_assigned ON content_review_queue(assigned_to);
CREATE INDEX idx_review_queue_priority ON content_review_queue(priority, status);

-- Deployment Indexes
CREATE INDEX idx_deployments_section ON content_deployments(section_id);
CREATE INDEX idx_deployments_status ON content_deployments(status);
CREATE INDEX idx_deployments_experiment ON content_deployments(experiment_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Run data migration script (002-migrate-monolithic-content.sql)
-- 2. Validate FK integrity
-- 3. Test rollback capability
-- =====================================================
