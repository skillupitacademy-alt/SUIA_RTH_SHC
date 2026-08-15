# Database Backup - Admin Routes Removal

**Date**: August 15, 2026  
**Branch**: `remove-admin-tools-routes`  
**Purpose**: Backup database tables before removing admin routes

## ✅ COMPLETED ACTIONS

### Routes Removed:
1. ✅ `/content-generation/global-architecture` - All frontend components deleted
2. ✅ `/content-generation/layman` - Page and components deleted
3. ✅ `/tools/visual-guide` - Complete tool removed
4. ✅ `/tools/prompt-generator` - Complete tool removed

### Code Changes:
- ✅ Deleted 86+ frontend files (pages, components, utilities)
- ✅ Updated navigation in LeftSidebar, Header, RightSidebar
- ✅ Removed AdminGuard bypass routes
- ✅ Commented out tutorialSectionLayman in schema
- ✅ Updated API routes to exclude layman operations
- ✅ Updated migration scripts
- ✅ Created local copies of utilities for content-manager
- ✅ TypeScript build passing
- ✅ All commits done to branch: `remove-admin-tools-routes`

---

## 🔴 PENDING: DATABASE MIGRATION

### Step 1: Backup Database Tables (CRITICAL - DO FIRST!)

**Run this SQL on your PostgreSQL database:**

```bash
psql -U your_username -d your_database_name -f backup-layman-table.sql
```

Or connect to your database and run:
```sql
-- Creates backup tables with timestamp
\i backup-layman-table.sql
```

**This will:**
- Create `tutorial_section_layman_backup_20260815` with all layman data
- Create `tutorial_sections_layman_backup_20260815` with parent records
- Show record counts for verification

### Step 2: Drop Layman Table

**After backup verification, run:**

```bash
psql -U your_username -d your_database_name -f packages/db-tutorial/src/migrations/0001_drop_layman_table.sql
```

Or:
```sql
\i packages/db-tutorial/src/migrations/0001_drop_layman_table.sql
```

**This migration:**
- Creates backup tables (if step 1 was skipped)
- Drops `tutorial_section_layman` table with CASCADE
- Logs the operation

---

## Database Tables Affected

### 1. tutorial_section_layman (TO BE DROPPED)
**Location**: `packages/db-tutorial/src/schema/tutorial-section-domains.ts`  
**Status**: Commented out in schema, ready for DROP

**Columns backed up**:
- id, section_id
- simpleOverview, everydayAnalogy, whyItExists
- simpleUseCases, beginnerBreakdown, mentalModel
- commonConfusions, simpleRecap
- heroVisualSvg, analogySvg, mentalModelSvg
- created_at, updated_at

### 2. Related Tables (NO CHANGES)
These tables remain intact:
- `tutorial_sections` - Only layman-type records backed up
- All other section domain tables remain active

---

## Verification Checklist

### Before Migration:
- [ ] Branch `remove-admin-tools-routes` created
- [ ] All code changes committed
- [ ] TypeScript build passing (✅ Confirmed)
- [ ] No references to removed routes (✅ Confirmed)

### Database Migration:
- [ ] **CRITICAL**: Run `backup-layman-table.sql` first
- [ ] Verify backup tables created
- [ ] Check record counts match
- [ ] Run `0001_drop_layman_table.sql`
- [ ] Verify table dropped: `SELECT * FROM tutorial_section_layman;` should error

### Post-Migration:
- [ ] Test application startup
- [ ] Verify removed routes return 404
- [ ] Test content-manager tool still works
- [ ] Check logs for any errors
- [ ] Merge branch to main if all good

---

## Restoration Instructions

**If you need to restore the layman table:**

```sql
-- Option 1: Restore data to new table
CREATE TABLE tutorial_section_layman (LIKE tutorial_section_layman_backup_20260815 INCLUDING ALL);
INSERT INTO tutorial_section_layman SELECT * FROM tutorial_section_layman_backup_20260815;

-- Option 2: Rename backup table
ALTER TABLE tutorial_section_layman_backup_20260815 RENAME TO tutorial_section_layman;

-- Restore parent records
INSERT INTO tutorial_sections 
SELECT * FROM tutorial_sections_layman_backup_20260815
ON CONFLICT (id) DO NOTHING;
```

Then revert code changes:
```bash
git checkout main
git branch -D remove-admin-tools-routes
```

---

## Files Changed Summary

### Deleted (86 files):
- `apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/` (37 files)
- `apps/skillhubcore-admin/src/app/(admin)/content-generation/layman/` (1 file)
- `apps/skillhubcore-admin/src/app/(admin)/tools/visual-guide/` (20 files)
- `apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/` (28 files)

### Modified (6 files):
- `apps/skillhubcore-admin/src/app/(admin)/components/LeftSidebar.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/components/Header.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/components/RightSidebar.tsx`
- `apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx`
- `apps/skillhubcore-admin/src/app/api/content-manager/add-section/route.ts`
- `packages/db-tutorial/src/schema/tutorial-section-domains.ts`
- `packages/db-tutorial/src/migrate-sections-to-domains.ts`

### Created (5 files):
- `BACKUP-README.md` (this file)
- `backup-layman-table.sql` (backup script)
- `packages/db-tutorial/src/migrations/0001_drop_layman_table.sql` (migration)
- `apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/lib/template-generator.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/lib/asset-specs.ts`

---

## Emergency Rollback

**Complete rollback (before merging):**
```bash
git checkout main
git branch -D remove-admin-tools-routes
```

Then restore database from backup using instructions above.

**After merge (if issues found):**
```bash
git revert <commit-hash>
```
Then restore database.

---

## Next Steps

1. ✅ Code changes completed and committed
2. 🔴 **RUN DATABASE BACKUP** (backup-layman-table.sql)
3. 🔴 **RUN DATABASE MIGRATION** (0001_drop_layman_table.sql)
4. 🔴 Test application
5. 🔴 Merge branch to main
6. 🔴 Deploy to production

---

## Support

For questions or issues during migration:
- Check backup tables exist: `SELECT COUNT(*) FROM tutorial_section_layman_backup_20260815;`
- Verify data: `SELECT * FROM tutorial_section_layman_backup_20260815 LIMIT 5;`
- See git log: `git log --oneline remove-admin-tools-routes`
- View changes: `git diff main remove-admin-tools-routes`
