-- =====================================================
-- PHASE 1 P0 FOUNDATION: GAP REMEDIATION (ALTER TABLE)
-- Migration: 002 - Gap Remediation Master
-- =====================================================
-- Purpose: Constitutional hardening of Deliverable 1
-- Approach: ALTER existing tables instead of creating V2 duplicates
-- Gaps Addressed:
--   GAP 1: Universal Section Naming Constitutional Enforcement
--   GAP 2: Subsection Taxonomy System Design
--   GAP 3: Cross-Schema Governance Hardening (FK Constraints)
--   GAP 4: Multi-Brand Partitioning Architecture
--   GAP 5: Advanced Analytics Governance Expansion
-- Safety: Zero-downtime migration, backward compatible
-- Rollback: See 002-rollback-gap-remediation-alter.sql
-- =====================================================

-- =====================================================
-- GAP 2: CREATE SUBSECTION TAXONOMY ENUM
-- =====================================================

CREATE TYPE subsection_type AS ENUM (
  -- Conceptual
  'definition',
  'concept',
  'syntax',
  'analogy',
  
  -- Illustrative
  'example',
  'visual',
  'diagram',
  'animation',
  
  -- Cautionary
  'pitfall',
  'antipattern',
  'gotcha',
  
  -- Interactive
  'code',
  'exercise',
  'challenge',
  'sandbox',
  
  -- Reference
  'checklist',
  'cheatsheet',
  'faq',
  'glossary',
  
  -- Assessment
  'interview_question',
  'quiz_question',
  
  -- Project
  'project_step',
  'project_milestone',
  'project_deliverable'
);

-- =====================================================
-- GAP 4: CREATE BRAND PARTITIONING ENUMS
-- =====================================================

CREATE TYPE brand AS ENUM (
  'realtutorialhub',
  'skillup',
  'shared'
);

CREATE TYPE brand_visibility AS ENUM (
  'brand_exclusive',
  'shared_visible',
  'white_label'
);

-- =====================================================
-- GAP 3 & GAP 4: ALTER EXISTING TABLES
-- =====================================================

-- Educational Architectures: Add Brand Support
ALTER TABLE educational_architectures
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared',
  ADD COLUMN brand_visibility brand_visibility NOT NULL DEFAULT 'shared_visible',
  ADD COLUMN brand_overrides JSONB;

CREATE INDEX idx_educational_brand ON educational_architectures(brand_id);
CREATE INDEX idx_educational_active ON educational_architectures(is_active);

-- UI Architectures: Add Brand Support
ALTER TABLE ui_architectures
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared',
  ADD COLUMN brand_visibility brand_visibility NOT NULL DEFAULT 'shared_visible',
  ADD COLUMN brand_compatibility JSONB;

-- Drop old compatible_brands column (replaced by brand_compatibility)
ALTER TABLE ui_architectures DROP COLUMN IF EXISTS compatible_brands;

CREATE INDEX idx_ui_brand ON ui_architectures(brand_id);
CREATE INDEX idx_ui_active ON ui_architectures(is_active);

-- Prompt Templates: Add Subsection Taxonomy & Brand Support
ALTER TABLE prompt_templates
  ADD COLUMN subsection_type subsection_type,
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared',
  ADD COLUMN brand_visibility brand_visibility NOT NULL DEFAULT 'shared_visible',
  ADD COLUMN brand_variants JSONB;

-- Drop old unique constraint
ALTER TABLE prompt_templates DROP CONSTRAINT IF EXISTS uq_prompt_section_version;

-- Add new unique constraint with brand
ALTER TABLE prompt_templates
  ADD CONSTRAINT uq_prompt_section_subsection_version_brand 
  UNIQUE (section_type, subsection_type, version, brand_id);

CREATE INDEX idx_prompt_brand ON prompt_templates(brand_id);
CREATE INDEX idx_prompt_section ON prompt_templates(section_type);
CREATE INDEX idx_prompt_subsection ON prompt_templates(subsection_type);

-- Tutorial Sections: Add FK Hardening & Brand Support
ALTER TABLE tutorial_sections
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared',
  ADD COLUMN brand_visibility brand_visibility NOT NULL DEFAULT 'shared_visible',
  ADD COLUMN brand_customizations JSONB;

-- Add FK constraints (GAP 3: FK Hardening)
ALTER TABLE tutorial_sections
  ADD CONSTRAINT fk_sections_prompt_template
    FOREIGN KEY (prompt_template_id) 
    REFERENCES prompt_templates(id) 
    ON DELETE SET NULL;

ALTER TABLE tutorial_sections
  ADD CONSTRAINT fk_sections_educational_architecture
    FOREIGN KEY (educational_architecture_id) 
    REFERENCES educational_architectures(id) 
    ON DELETE SET NULL;

ALTER TABLE tutorial_sections
  ADD CONSTRAINT fk_sections_ui_architecture
    FOREIGN KEY (ui_architecture_id) 
    REFERENCES ui_architectures(id) 
    ON DELETE SET NULL;

-- Drop old unique constraint
ALTER TABLE tutorial_sections DROP CONSTRAINT IF EXISTS uq_section_subtopic_type_difficulty;

-- Add new unique constraint with brand
ALTER TABLE tutorial_sections
  ADD CONSTRAINT uq_section_subtopic_type_difficulty_brand 
  UNIQUE (subtopic_id, section_type, difficulty, brand_id);

CREATE INDEX idx_sections_brand ON tutorial_sections(brand_id);
CREATE INDEX idx_sections_architecture ON tutorial_sections(educational_architecture_id);

-- Tutorial Subsections: Add Taxonomy & Brand Support
ALTER TABLE tutorial_subsections
  ADD COLUMN subsection_type subsection_type NOT NULL DEFAULT 'concept',
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared',
  ADD COLUMN brand_visibility brand_visibility NOT NULL DEFAULT 'shared_visible',
  ADD COLUMN brand_customizations JSONB,
  ADD COLUMN generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN prompt_template_id UUID;

-- Add FK constraint
ALTER TABLE tutorial_subsections
  ADD CONSTRAINT fk_subsections_prompt_template
    FOREIGN KEY (prompt_template_id) 
    REFERENCES prompt_templates(id) 
    ON DELETE SET NULL;

CREATE INDEX idx_subsections_type ON tutorial_subsections(subsection_type);
CREATE INDEX idx_subsections_brand ON tutorial_subsections(brand_id);

-- AI Generation Orchestration: Add FK Hardening & Brand Support
ALTER TABLE ai_generation_orchestration
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared';

-- Add FK constraints (GAP 3: FK Hardening)
ALTER TABLE ai_generation_orchestration
  ADD CONSTRAINT fk_orchestration_subtopic
    FOREIGN KEY (subtopic_id) 
    REFERENCES tutorial_subtopics(id) 
    ON DELETE CASCADE;

ALTER TABLE ai_generation_orchestration
  ADD CONSTRAINT fk_orchestration_educational_architecture
    FOREIGN KEY (educational_architecture_id) 
    REFERENCES educational_architectures(id) 
    ON DELETE RESTRICT;

CREATE INDEX idx_orchestration_brand ON ai_generation_orchestration(brand_id);
CREATE INDEX idx_orchestration_architecture ON ai_generation_orchestration(educational_architecture_id);

-- Content Deployments: Add FK Hardening & Brand Support
ALTER TABLE content_deployments
  ADD COLUMN brand_id brand NOT NULL DEFAULT 'shared',
  ADD COLUMN brand_targets JSONB;

-- Add FK constraint (GAP 3: FK Hardening)
-- First drop existing FK if it exists
ALTER TABLE content_deployments DROP CONSTRAINT IF EXISTS content_deployments_section_id_fkey;

-- Add new FK with ON DELETE RESTRICT
ALTER TABLE content_deployments
  ADD CONSTRAINT fk_deployments_section
    FOREIGN KEY (section_id) 
    REFERENCES tutorial_sections(id) 
    ON DELETE RESTRICT;

CREATE INDEX idx_deployments_brand ON content_deployments(brand_id);

-- =====================================================
-- GAP 5: ADVANCED ANALYTICS TABLES (NEW TABLES)
-- =====================================================

-- Tutorial Learning Metrics
CREATE TABLE tutorial_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  hour INTEGER,
  aggregation_level TEXT NOT NULL,
  section_id UUID REFERENCES tutorial_sections(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  brand_id brand NOT NULL,
  
  -- Engagement
  total_views INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  average_time_spent INTEGER NOT NULL DEFAULT 0,
  completion_rate INTEGER NOT NULL DEFAULT 0,
  
  -- Learning Progression
  started_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  abandoned_count INTEGER NOT NULL DEFAULT 0,
  drop_off_points JSONB,
  
  -- Interaction
  code_executions INTEGER NOT NULL DEFAULT 0,
  practice_attempts INTEGER NOT NULL DEFAULT 0,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  average_quiz_score INTEGER,
  
  -- Feedback
  thumbs_up INTEGER NOT NULL DEFAULT 0,
  thumbs_down INTEGER NOT NULL DEFAULT 0,
  reported_issues INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_learning_metrics_date_hour_section_brand UNIQUE (date, hour, section_id, brand_id, aggregation_level)
);

CREATE INDEX idx_learning_section ON tutorial_learning_metrics(section_id);
CREATE INDEX idx_learning_brand ON tutorial_learning_metrics(brand_id);
CREATE INDEX idx_learning_date ON tutorial_learning_metrics(date);

-- Subsection Engagement Metrics
CREATE TABLE subsection_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  hour INTEGER,
  aggregation_level TEXT NOT NULL,
  subsection_id UUID REFERENCES tutorial_subsections(id) ON DELETE CASCADE,
  subsection_type TEXT NOT NULL,
  brand_id brand NOT NULL,
  
  total_views INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  average_time_spent INTEGER NOT NULL DEFAULT 0,
  completion_rate INTEGER NOT NULL DEFAULT 0,
  scroll_depth INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_subsection_metrics_date_hour_subsection_brand UNIQUE (date, hour, subsection_id, brand_id, aggregation_level)
);

CREATE INDEX idx_subsection_engagement ON subsection_engagement_metrics(subsection_id);
CREATE INDEX idx_subsection_brand ON subsection_engagement_metrics(brand_id);

-- Educational Architecture Performance
CREATE TABLE educational_architecture_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  aggregation_level TEXT NOT NULL,
  architecture_id UUID NOT NULL REFERENCES educational_architectures(id) ON DELETE CASCADE,
  brand_id brand NOT NULL,
  
  total_usages INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  average_completion_rate INTEGER NOT NULL DEFAULT 0,
  average_time_to_complete INTEGER NOT NULL DEFAULT 0,
  average_quiz_score INTEGER,
  average_assignment_score INTEGER,
  average_engagement_score INTEGER NOT NULL DEFAULT 0,
  retention_rate INTEGER NOT NULL DEFAULT 0,
  satisfaction_score INTEGER,
  recommendation_rate INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_educational_perf_date_arch_brand UNIQUE (date, architecture_id, brand_id, aggregation_level)
);

CREATE INDEX idx_educational_perf_arch ON educational_architecture_performance(architecture_id);
CREATE INDEX idx_educational_perf_brand ON educational_architecture_performance(brand_id);

-- UI Architecture Performance
CREATE TABLE ui_architecture_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  aggregation_level TEXT NOT NULL,
  architecture_id UUID NOT NULL REFERENCES ui_architectures(id) ON DELETE CASCADE,
  brand_id brand NOT NULL,
  
  total_renders INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  average_load_time INTEGER NOT NULL DEFAULT 0,
  average_render_time INTEGER NOT NULL DEFAULT 0,
  error_rate INTEGER NOT NULL DEFAULT 0,
  bounce_rate INTEGER NOT NULL DEFAULT 0,
  average_session_duration INTEGER NOT NULL DEFAULT 0,
  interaction_rate INTEGER NOT NULL DEFAULT 0,
  accessibility_score INTEGER,
  screen_reader_usage INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_ui_perf_date_arch_brand UNIQUE (date, architecture_id, brand_id, aggregation_level)
);

CREATE INDEX idx_ui_perf_arch ON ui_architecture_performance(architecture_id);
CREATE INDEX idx_ui_perf_brand ON ui_architecture_performance(brand_id);

-- Prompt Template Performance
CREATE TABLE prompt_template_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  aggregation_level TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  brand_id brand NOT NULL,
  
  total_generations INTEGER NOT NULL DEFAULT 0,
  successful_generations INTEGER NOT NULL DEFAULT 0,
  failed_generations INTEGER NOT NULL DEFAULT 0,
  average_quality_score INTEGER NOT NULL DEFAULT 0,
  average_hallucination_score INTEGER NOT NULL DEFAULT 0,
  validation_pass_rate INTEGER NOT NULL DEFAULT 0,
  approval_rate INTEGER NOT NULL DEFAULT 0,
  average_review_time INTEGER NOT NULL DEFAULT 0,
  regeneration_rate INTEGER NOT NULL DEFAULT 0,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  total_cost_usd INTEGER NOT NULL DEFAULT 0,
  average_cost_per_generation INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_prompt_perf_date_template_brand UNIQUE (date, template_id, brand_id, aggregation_level)
);

CREATE INDEX idx_prompt_perf_template ON prompt_template_performance(template_id);
CREATE INDEX idx_prompt_perf_brand ON prompt_template_performance(brand_id);

-- Brand Performance Metrics
CREATE TABLE brand_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  aggregation_level TEXT NOT NULL,
  brand_id brand NOT NULL,
  
  -- User Metrics
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  churned_users INTEGER NOT NULL DEFAULT 0,
  
  -- Engagement
  average_sessions_per_user INTEGER NOT NULL DEFAULT 0,
  average_session_duration INTEGER NOT NULL DEFAULT 0,
  total_content_views INTEGER NOT NULL DEFAULT 0,
  
  -- Learning
  tutorials_started INTEGER NOT NULL DEFAULT 0,
  tutorials_completed INTEGER NOT NULL DEFAULT 0,
  average_completion_rate INTEGER NOT NULL DEFAULT 0,
  certificates_issued INTEGER NOT NULL DEFAULT 0,
  
  -- Retention
  day_one_retention INTEGER NOT NULL DEFAULT 0,
  day_seven_retention INTEGER NOT NULL DEFAULT 0,
  day_thirty_retention INTEGER NOT NULL DEFAULT 0,
  
  -- Conversion
  free_to_pro_conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate INTEGER NOT NULL DEFAULT 0,
  
  -- Revenue (cents)
  total_revenue INTEGER NOT NULL DEFAULT 0,
  subscription_revenue INTEGER NOT NULL DEFAULT 0,
  average_revenue_per_user INTEGER NOT NULL DEFAULT 0,
  
  -- Satisfaction
  nps_score INTEGER,
  average_satisfaction_score INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_brand_perf_date_brand UNIQUE (date, brand_id, aggregation_level)
);

CREATE INDEX idx_brand_perf_brand ON brand_performance_metrics(brand_id);
CREATE INDEX idx_brand_perf_date ON brand_performance_metrics(date);

-- Deployment Cohort Metrics
CREATE TABLE deployment_cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  aggregation_level TEXT NOT NULL,
  deployment_id UUID NOT NULL,
  cohort_name TEXT NOT NULL,
  brand_id brand NOT NULL,
  
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  average_completion_rate INTEGER NOT NULL DEFAULT 0,
  average_engagement_score INTEGER NOT NULL DEFAULT 0,
  average_time_spent INTEGER NOT NULL DEFAULT 0,
  control_group_completion_rate INTEGER,
  lift_vs_control INTEGER,
  conversion_rate INTEGER NOT NULL DEFAULT 0,
  revenue_impact INTEGER NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence_level INTEGER,
  is_statistically_significant TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_deployment_cohort_date_brand UNIQUE (date, deployment_id, cohort_name, brand_id, aggregation_level)
);

CREATE INDEX idx_deployment_cohort ON deployment_cohort_metrics(deployment_id);
CREATE INDEX idx_deployment_brand ON deployment_cohort_metrics(brand_id);

-- Revenue Attribution Metrics
CREATE TABLE revenue_attribution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  aggregation_level TEXT NOT NULL,
  brand_id brand NOT NULL,
  attribution_source TEXT NOT NULL,
  attribution_id UUID,
  
  direct_revenue INTEGER NOT NULL DEFAULT 0,
  assisted_revenue INTEGER NOT NULL DEFAULT 0,
  total_attributed_revenue INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate INTEGER NOT NULL DEFAULT 0,
  average_touchpoints INTEGER NOT NULL DEFAULT 0,
  average_time_to_conversion INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_revenue_attr_date_source_brand UNIQUE (date, attribution_source, attribution_id, brand_id, aggregation_level)
);

CREATE INDEX idx_revenue_attr_brand ON revenue_attribution_metrics(brand_id);
CREATE INDEX idx_revenue_attr_source ON revenue_attribution_metrics(attribution_source);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Validate FK integrity
-- 2. Test rollback capability
-- 3. Update application code to use enhanced schemas
-- =====================================================
