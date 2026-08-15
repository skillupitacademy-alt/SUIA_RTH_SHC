# Database Backup - Admin Routes Removal

**Date**: August 15, 2026  
**Branch**: `remove-admin-tools-routes`  
**Purpose**: Backup database tables before removing admin routes

## Routes Being Removed

1. `/content-generation/global-architecture`
2. `/content-generation/layman`
3. `/tools/visual-guide`
4. `/tools/prompt-generator`

## Database Tables Affected

### 1. tutorial_section_layman
**File**: `backup-layman-table.sql`  
**Action**: Complete backup before table removal

**Columns backed up**:
- id, section_id
- simpleOverview, everydayAnalogy, whyItExists
- simpleUseCases, beginnerBreakdown, mentalModel
- commonConfusions, simpleRecap
- heroVisualSvg, analogySvg, mentalModelSvg
- created_at, updated_at

### 2. Related Tables (No Direct Removal)
The following tables are referenced but NOT being deleted:
- `tutorial_sections` (only layman-type records backed up)
- Other section domain tables remain intact

## How to Run Backups

### Option 1: PostgreSQL CLI
```bash
psql -U your_username -d your_database -f backup-layman-table.sql
```

### Option 2: Using Database Client
1. Connect to your database
2. Run the SQL script: `backup-layman-table.sql`
3. Verify backup tables exist with suffix `_backup_20260815`

### Option 3: Manual Backup
```sql
-- Quick backup query
CREATE TABLE tutorial_section_layman_backup_20260815 AS 
SELECT * FROM tutorial_section_layman;
```

## Restoration Instructions

If you need to restore the data:

```sql
-- Restore layman section data
INSERT INTO tutorial_section_layman 
SELECT * FROM tutorial_section_layman_backup_20260815;

-- Or recreate the table entirely
DROP TABLE IF EXISTS tutorial_section_layman;
ALTER TABLE tutorial_section_layman_backup_20260815 
RENAME TO tutorial_section_layman;
```

## Files Removed Summary

### Frontend (Pages & Components)
- ✓ `apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/` (entire folder)
- ✓ `apps/skillhubcore-admin/src/app/(admin)/content-generation/layman/` (entire folder)
- ✓ `apps/skillhubcore-admin/src/app/(admin)/tools/visual-guide/` (entire folder)
- ✓ `apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/` (entire folder)

### Database Schema
- ✓ `tutorial_section_layman` table references (in Drizzle schema)

### Configuration & Data Files
- ✓ References in sidebar navigation
- ✓ Admin guard bypass routes
- ✓ JSON data references

## Verification Checklist

After deletion, verify:
- [ ] Backup SQL executed successfully
- [ ] Backup tables created with `_backup_20260815` suffix
- [ ] Record counts match original tables
- [ ] Backup file saved in project root
- [ ] All frontend folders removed
- [ ] Navigation links removed from sidebar
- [ ] Admin guard routes updated
- [ ] No broken imports in codebase

## Emergency Rollback

To completely rollback this change:
```bash
git checkout main
git branch -D remove-admin-tools-routes
```

Then restore database from backup tables using restoration instructions above.
