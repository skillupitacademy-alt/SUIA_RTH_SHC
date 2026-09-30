-- ========================================
-- BACKUP: tutorial_section_layman TABLE
-- Generated: 2026-08-15
-- Purpose: Backup before removing layman section route
-- ========================================

-- Create backup table with timestamp
CREATE TABLE IF NOT EXISTS tutorial_section_layman_backup_20260815 AS
SELECT * FROM tutorial_section_layman;

-- Create backup of related records from tutorial_sections
CREATE TABLE IF NOT EXISTS tutorial_sections_layman_backup_20260815 AS
SELECT * FROM tutorial_sections
WHERE section_type = 'layman';

-- Show record count
SELECT 
    'tutorial_section_layman' as table_name,
    COUNT(*) as record_count 
FROM tutorial_section_layman
UNION ALL
SELECT 
    'tutorial_sections (layman type)' as table_name,
    COUNT(*) as record_count 
FROM tutorial_sections 
WHERE section_type = 'layman';

-- Export to CSV (optional - uncomment if needed)
-- COPY tutorial_section_layman TO '/backup/tutorial_section_layman_backup_20260815.csv' CSV HEADER;
-- COPY (SELECT * FROM tutorial_sections WHERE section_type = 'layman') TO '/backup/tutorial_sections_layman_backup_20260815.csv' CSV HEADER;
