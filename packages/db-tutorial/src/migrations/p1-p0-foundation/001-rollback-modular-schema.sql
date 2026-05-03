-- =====================================================
-- PHASE 1 P0 FOUNDATION: ROLLBACK MODULAR SCHEMA
-- Rollback: 001 - Drop Modular Schema
-- =====================================================
-- Purpose: Safe rollback of modular tutorial schema
-- Safety: Preserves legacy tutorial_content table
-- Warning: This will delete all modular content data
-- =====================================================

-- =====================================================
-- STEP 1: DROP TABLES (Reverse Order)
-- =====================================================

-- Drop Analytics
DROP TABLE IF EXISTS ai_generation_metrics CASCADE;

-- Drop Governance
DROP TABLE IF EXISTS content_deployments CASCADE;
DROP TABLE IF EXISTS content_review_queue CASCADE;

-- Drop AI Orchestration
DROP TABLE IF EXISTS ai_section_generation_jobs CASCADE;
DROP TABLE IF EXISTS ai_generation_orchestration CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;

-- Drop Core Content
DROP TABLE IF EXISTS tutorial_subsections CASCADE;
DROP TABLE IF EXISTS tutorial_sections CASCADE;

-- Drop Architecture
DROP TABLE IF EXISTS ui_architectures CASCADE;
DROP TABLE IF EXISTS educational_architectures CASCADE;

-- =====================================================
-- STEP 2: DROP ENUMS
-- =====================================================

DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS orchestration_status CASCADE;
DROP TYPE IF EXISTS deployment_type CASCADE;
DROP TYPE IF EXISTS section_status CASCADE;
DROP TYPE IF EXISTS section_type CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================
-- Legacy tutorial_content table preserved
-- System reverted to monolithic architecture
-- =====================================================
