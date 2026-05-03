-- =====================================================
-- PHASE 1 P0 FOUNDATION: GAP REMEDIATION ROLLBACK (ALTER)
-- Migration: 002 - Rollback Gap Remediation
-- =====================================================
-- Purpose: Safely rollback all gap remediation changes
-- Safety: Preserves original table structure
-- =====================================================

-- =====================================================
-- STEP 1: DROP ANALYTICS TABLES (GAP 5)
-- =====================================================

DROP TABLE IF EXISTS revenue_attribution_metrics CASCADE;
DROP TABLE IF EXISTS deployment_cohort_metrics CASCADE;
DROP TABLE IF EXISTS brand_performance_metrics CASCADE;
DROP TABLE IF EXISTS prompt_template_performance CASCADE;
DROP TABLE IF EXISTS ui_architecture_performance CASCADE;
DROP TABLE IF EXISTS educational_architecture_performance CASCADE;
DROP TABLE IF EXISTS subsection_engagement_metrics CASCADE;
DROP TABLE IF EXISTS tutorial_learning_metrics CASCADE;

-- =====================================================
-- STEP 2: REVERT ALTERED TABLES
-- =====================================================

-- Content Deployments: Remove brand support
ALTER TABLE content_deployments DROP CONSTRAINT IF EXISTS fk_deployments_section;
ALTER TABLE content_deployments DROP COLUMN IF EXISTS brand_id CASCADE;
ALTER TABLE content_deployments DROP COLUMN IF EXISTS brand_targets CASCADE;
DROP INDEX IF EXISTS idx_deployments_brand;

-- Re-add original FK without ON DELETE RESTRICT
ALTER TABLE content_deployments
  ADD CONSTRAINT content_deployments_section_id_fkey
    FOREIGN KEY (section_id) 
    REFERENCES tutorial_sections(id);

-- AI Generation Orchestration: Remove FK hardening & brand support
ALTER TABLE ai_generation_orchestration DROP CONSTRAINT IF EXISTS fk_orchestration_subtopic;
ALTER TABLE ai_generation_orchestration DROP CONSTRAINT IF EXISTS fk_orchestration_educational_architecture;
ALTER TABLE ai_generation_orchestration DROP COLUMN IF EXISTS brand_id CASCADE;
DROP INDEX IF EXISTS idx_orchestration_brand;
DROP INDEX IF EXISTS idx_orchestration_architecture;

-- Tutorial Subsections: Remove taxonomy & brand support
ALTER TABLE tutorial_subsections DROP CONSTRAINT IF EXISTS fk_subsections_prompt_template;
ALTER TABLE tutorial_subsections DROP COLUMN IF EXISTS subsection_type CASCADE;
ALTER TABLE tutorial_subsections DROP COLUMN IF EXISTS brand_id CASCADE;
ALTER TABLE tutorial_subsections DROP COLUMN IF EXISTS brand_visibility CASCADE;
ALTER TABLE tutorial_subsections DROP COLUMN IF EXISTS brand_customizations CASCADE;
ALTER TABLE tutorial_subsections DROP COLUMN IF EXISTS generated_by_ai CASCADE;
ALTER TABLE tutorial_subsections DROP COLUMN IF EXISTS prompt_template_id CASCADE;
DROP INDEX IF EXISTS idx_subsections_type;
DROP INDEX IF EXISTS idx_subsections_brand;

-- Tutorial Sections: Remove FK hardening & brand support
ALTER TABLE tutorial_sections DROP CONSTRAINT IF EXISTS fk_sections_prompt_template;
ALTER TABLE tutorial_sections DROP CONSTRAINT IF EXISTS fk_sections_educational_architecture;
ALTER TABLE tutorial_sections DROP CONSTRAINT IF EXISTS fk_sections_ui_architecture;
ALTER TABLE tutorial_sections DROP CONSTRAINT IF EXISTS uq_section_subtopic_type_difficulty_brand;
ALTER TABLE tutorial_sections DROP COLUMN IF EXISTS brand_id CASCADE;
ALTER TABLE tutorial_sections DROP COLUMN IF EXISTS brand_visibility CASCADE;
ALTER TABLE tutorial_sections DROP COLUMN IF EXISTS brand_customizations CASCADE;
DROP INDEX IF EXISTS idx_sections_brand;
DROP INDEX IF EXISTS idx_sections_architecture;

-- Re-add original unique constraint
ALTER TABLE tutorial_sections
  ADD CONSTRAINT uq_section_subtopic_type_difficulty 
  UNIQUE (subtopic_id, section_type, difficulty);

-- Prompt Templates: Remove subsection taxonomy & brand support
ALTER TABLE prompt_templates DROP CONSTRAINT IF EXISTS uq_prompt_section_subsection_version_brand;
ALTER TABLE prompt_templates DROP COLUMN IF EXISTS subsection_type CASCADE;
ALTER TABLE prompt_templates DROP COLUMN IF EXISTS brand_id CASCADE;
ALTER TABLE prompt_templates DROP COLUMN IF EXISTS brand_visibility CASCADE;
ALTER TABLE prompt_templates DROP COLUMN IF EXISTS brand_variants CASCADE;
DROP INDEX IF EXISTS idx_prompt_brand;
DROP INDEX IF EXISTS idx_prompt_section;
DROP INDEX IF EXISTS idx_prompt_subsection;

-- Re-add original unique constraint
ALTER TABLE prompt_templates
  ADD CONSTRAINT uq_prompt_section_version 
  UNIQUE (section_type, version);

-- UI Architectures: Remove brand support
ALTER TABLE ui_architectures DROP COLUMN IF EXISTS brand_id CASCADE;
ALTER TABLE ui_architectures DROP COLUMN IF EXISTS brand_visibility CASCADE;
ALTER TABLE ui_architectures DROP COLUMN IF EXISTS brand_compatibility CASCADE;
DROP INDEX IF EXISTS idx_ui_brand;
DROP INDEX IF EXISTS idx_ui_active;

-- Re-add original compatible_brands column
ALTER TABLE ui_architectures ADD COLUMN compatible_brands JSONB;

-- Educational Architectures: Remove brand support
ALTER TABLE educational_architectures DROP COLUMN IF EXISTS brand_id CASCADE;
ALTER TABLE educational_architectures DROP COLUMN IF EXISTS brand_visibility CASCADE;
ALTER TABLE educational_architectures DROP COLUMN IF EXISTS brand_overrides CASCADE;
DROP INDEX IF EXISTS idx_educational_brand;
DROP INDEX IF EXISTS idx_educational_active;

-- =====================================================
-- STEP 3: DROP NEW ENUMS
-- =====================================================

DROP TYPE IF EXISTS brand_visibility CASCADE;
DROP TYPE IF EXISTS brand CASCADE;
DROP TYPE IF EXISTS subsection_type CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================
-- Result: System reverted to original schema state
-- All tables restored to pre-gap-remediation structure
-- =====================================================
