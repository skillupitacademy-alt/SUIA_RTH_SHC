-- Migration: Drop tutorial_section_layman table
-- Date: 2026-08-15
-- Description: Remove layman section support after route removal
-- Backup: Run backup-layman-table.sql BEFORE executing this migration

-- Step 1: Create backup table (if not already created)
CREATE TABLE IF NOT EXISTS tutorial_section_layman_backup_20260815 AS
SELECT * FROM tutorial_section_layman;

-- Step 2: Create backup of related records from tutorial_sections
CREATE TABLE IF NOT EXISTS tutorial_sections_layman_backup_20260815 AS
SELECT * FROM tutorial_sections
WHERE section_type = 'layman';

-- Step 3: Drop the layman section domain table
DROP TABLE IF EXISTS tutorial_section_layman CASCADE;

-- Step 4: Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: tutorial_section_layman table dropped';
    RAISE NOTICE 'Backup tables created: tutorial_section_layman_backup_20260815, tutorial_sections_layman_backup_20260815';
    RAISE NOTICE 'To restore: See BACKUP-README.md in project root';
END $$;
