-- ============================================================================
-- Phase 1: Development Content Reset
-- ============================================================================
-- DANGER: This script deletes ALL tutorial content records.
-- 
-- PURPOSE: Reset disposable development/test tutorial content to enable
--          clean Phase 1 page-aware architecture testing.
-- 
-- SAFE TO DELETE (development/test content):
--   - tutorial_sections (content records)
--   - content_deployments (test deployments - MUST delete first due to RESTRICT)
--   - tutorial_subsections (legacy child records - CASCADE)
--   - tutorial_section_domains (all 13 domain tables - CASCADE)
--   - user_interactions (test interaction logs - CASCADE)
--   - analytics_learning_metrics (test metrics - CASCADE)
-- 
-- PRESERVED (master/hierarchy data):
--   - tutorial_subtopics (hierarchy master data)
--   - tutorial_topics (hierarchy master data)
--   - tutorial_subjects (hierarchy master data)
--   - tutorial_domains (hierarchy master data)
--   - tutorial_sidebar_trees_v2 (navigation definitions - CRITICAL)
--   - users (authentication/authorization)
--   - educational_architectures (architecture templates)
--   - ui_architectures (UI templates)
--   - prompt_templates (AI generation templates)
-- 
-- EXECUTION: Run manually in Neon SQL editor ONCE before Phase 1 testing.
-- DO NOT run in production.
-- ============================================================================

-- ============================================================================
-- STEP 0: PRE-FLIGHT CHECK
-- ============================================================================

SELECT 
    'PRE-FLIGHT CHECK' AS checkpoint,
    'This is a DESTRUCTIVE operation' AS warning,
    'Verify this is development database before proceeding' AS instruction;

-- ============================================================================
-- STEP 1: IMPACT ANALYSIS - What will be deleted?
-- ============================================================================

SELECT 'IMPACT ANALYSIS' AS checkpoint;

-- Main content table
SELECT 
    'tutorial_sections' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '(already clean)'
        WHEN COUNT(*) <= 10 THEN '(small dataset - safe to reset)'
        ELSE '⚠ (review before proceeding)'
    END AS assessment
FROM tutorial_sections;

-- RESTRICT blocker (must be empty to proceed)
SELECT 
    'content_deployments' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ (no RESTRICT blocker)'
        ELSE '⚠ (MUST delete first - RESTRICT constraint)'
    END AS assessment
FROM content_deployments;

-- Legacy architecture
SELECT 
    'tutorial_subsections' AS table_name,
    COUNT(*) AS record_count,
    '(legacy - will CASCADE delete)' AS assessment
FROM tutorial_subsections;

-- User interaction logs
SELECT 
    'user_question_responses' AS table_name,
    COUNT(*) AS record_count,
    '(test data - will CASCADE delete)' AS assessment  
FROM user_question_responses;

SELECT 
    'user_code_runs' AS table_name,
    COUNT(*) AS record_count,
    '(test data - will CASCADE delete)' AS assessment
FROM user_code_runs;

SELECT 
    'user_section_completion' AS table_name,
    COUNT(*) AS record_count,
    '(test data - will CASCADE delete)' AS assessment
FROM user_section_completion;

-- ============================================================================
-- STEP 2: DELETE OPERATIONS (in dependency order)
-- ============================================================================

SELECT 'DELETION STARTING' AS checkpoint;

-- 2a. Delete content_deployments FIRST (RESTRICT constraint)
DELETE FROM content_deployments;

-- 2b. Delete tutorial_sections (triggers CASCADE for all dependent tables)
-- This will automatically delete:
--   - tutorial_subsections
--   - tutorial_section_domains (all 13 domain tables)
--   - user_question_responses
--   - user_code_runs
--   - user_visual_interactions
--   - user_section_completion
--   - analytics_learning_metrics
DELETE FROM tutorial_sections;

-- ============================================================================
-- STEP 3: VERIFICATION - Confirm clean state
-- ============================================================================

SELECT 'POST-DELETE VERIFICATION' AS checkpoint;

-- Verify main table is clean
SELECT 
    'tutorial_sections' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ CLEAN'
        ELSE '✗ DELETION FAILED'
    END AS status
FROM tutorial_sections;

-- Verify CASCADE worked
SELECT 
    'tutorial_subsections' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ CASCADE worked'
        ELSE '✗ CASCADE failed'
    END AS status
FROM tutorial_subsections;

SELECT 
    'content_deployments' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ CLEAN'
        ELSE '✗ STILL HAS RECORDS'
    END AS status
FROM content_deployments;

SELECT 
    'user_question_responses' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ CASCADE worked'
        ELSE '⚠ May have non-tutorial records'
    END AS status
FROM user_question_responses;

-- ============================================================================
-- STEP 4: VERIFY HIERARCHY PRESERVED
-- ============================================================================

SELECT 'HIERARCHY PRESERVATION CHECK' AS checkpoint;

-- Critical: Verify sidebar/navigation data is intact
SELECT 
    'tutorial_sidebar_trees_v2' AS table_name,
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ PRESERVED (critical for Phase 1)'
        ELSE '✗ MISSING - DATABASE CORRUPTED'
    END AS status
FROM tutorial_sidebar_trees_v2;

-- ============================================================================
-- VERIFICATION COMPLETE
-- 
-- Expected final state:
--   tutorial_sections: 0 records
--   tutorial_subtopics: >0 records (preserved)
--   tutorial_sidebar_trees_v2: >0 records (preserved)
-- 
-- Next step: Execute Phase 1 schema migration
-- ============================================================================
