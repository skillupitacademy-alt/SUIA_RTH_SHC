# Educational Hierarchy Data Migration

This document explains how to migrate existing educational hierarchy data from RealTutorialHub to SkillHubCore.

## Overview

The migration script `migrate-educational-hierarchy-data.mjs` copies data from RealTutorialHub's tutorial tables to SkillHubCore's new educational hierarchy tables.

### Source Tables (RealTutorialHub)
- `tutorial_domains` → Contains all domains
- `tutorial_subjects` → Contains subjects linked to domains
- `tutorial_topics` → Contains topics linked to subjects
- `tutorial_subtopics` → Contains subtopics linked to topics

### Target Tables (SkillHubCore)
- `domains` → New table for domains
- `subjects` → New table for subjects
- `topics` → New table for topics
- `subtopics` → New table for subtopics

## Prerequisites

1. **Database Access**: Ensure you have access to the `tutorial_prod` database
2. **Environment Variables**: `.env.local` must have either:
   - `SKILLHUBCORE_DATABASE_URL` or
   - `DATABASE_URL_TUTORIAL`
3. **Schema Created**: The 6 new tables must exist in the database (run migrations first)

## Usage

### Step 1: Dry Run (Recommended)

First, run a dry run to see what will be migrated without making any changes:

```bash
node scripts/migrate-educational-hierarchy-data.mjs --dry-run
```

This will:
- Count all records in source and target tables
- Show which records will be migrated
- Display a preview of the data
- **NOT make any changes to the database**

### Step 2: Review the Output

The dry run will show:

```
📊 Step 1: Counting records

Source Records (RealTutorialHub):
  tutorial_domains:    15
  tutorial_subjects:   45
  tutorial_topics:     120
  tutorial_subtopics:  300

Target Records (SkillHubCore):
  domains:    0
  subjects:   0
  topics:     0
  subtopics:  0

📋 Step 2: Migrating domains

Found 15 domain(s) to migrate
  1. Web Development (web-development)
  2. Mobile Development (mobile-development)
  ...
```

### Step 3: Run the Migration

If the dry run looks good, run the actual migration:

```bash
node scripts/migrate-educational-hierarchy-data.mjs
```

You will be prompted for confirmation:

```
⚠️  This will copy data from RealTutorialHub tables to SkillHubCore tables
⚠️  Existing records with same IDs will be skipped

Do you want to proceed? (yes/no):
```

Type `yes` to proceed.

### Step 4: Force Migration (Skip Confirmation)

To skip the confirmation prompt (useful for CI/CD):

```bash
node scripts/migrate-educational-hierarchy-data.mjs --force
```

## Migration Behavior

### ID Mapping
- Uses `external_id` from RealTutorialHub tables as the primary `id` in SkillHubCore tables
- This preserves relationships between entities
- Example: If a subject references `domain_id = abc123`, the script uses the domain's `external_id = abc123`

### Idempotent
- The migration is safe to run multiple times
- Existing records (by ID) are skipped
- Only new records are inserted

### Data Mapping

#### Domains
```sql
RealTutorialHub              → SkillHubCore
-------------------------------------------------
external_id                  → id
name                         → name
slug                         → description (as note)
                             → category = 'technology' (default)
                             → status = 'active'
                             → order = 0
created_at                   → created_at (preserved)
updated_at                   → updated_at (preserved)
```

#### Subjects
```sql
RealTutorialHub              → SkillHubCore
-------------------------------------------------
external_id                  → id
domain.external_id           → domain_id (mapped)
name                         → name
slug                         → description (as note)
                             → status = 'active'
                             → order = 0
created_at                   → created_at (preserved)
updated_at                   → updated_at (preserved)
```

#### Topics
```sql
RealTutorialHub              → SkillHubCore
-------------------------------------------------
external_id                  → id
subject.external_id          → subject_id (mapped)
name                         → name
slug                         → description (as note)
                             → complexity = 'intermediate' (default)
                             → status = 'active'
                             → order = 0
created_at                   → created_at (preserved)
updated_at                   → updated_at (preserved)
```

#### Subtopics
```sql
RealTutorialHub              → SkillHubCore
-------------------------------------------------
external_id                  → id
topic.external_id            → topic_id (mapped)
name                         → name
slug                         → description (as note)
                             → status = 'active'
                             → order = 0
created_at                   → created_at (preserved)
updated_at                   → updated_at (preserved)
```

### Filtering
- Only migrates records where `deleted_at IS NULL`
- Skips soft-deleted records from RealTutorialHub
- Ensures referential integrity (skips subjects if parent domain is deleted)

## Testing After Migration

### Test 1: Database Verification

Run the database test script to verify the migration:

```bash
node scripts/test-educational-hierarchy.mjs
```

This will:
- Check if tables exist
- Count records in each table
- Test CRUD operations
- Verify relationships

### Test 2: API Verification

Start the dev server and run the API test:

```bash
# Terminal 1: Start dev server
cd apps/skillhubcore-admin
pnpm dev

# Terminal 2: Run API tests
node scripts/test-educational-hierarchy-api.mjs
```

This will:
- Test all API endpoints
- Test pagination and search
- Test CRUD operations via HTTP
- Verify migrated data is accessible

### Test 3: Manual UI Verification

1. Open `http://localhost:3007` in browser
2. Navigate to Questions/Educational Hierarchy page
3. Verify all migrated domains are visible
4. Click through subjects, topics, and subtopics
5. Test search functionality
6. Test editing records
7. Test creating new records

## Migration Summary

After migration completes, you'll see:

```
📊 Migration Summary

Domains:
  Source:    15
  Target:    0 (before migration)
  Migrated:  15
  Skipped:   0

Subjects:
  Source:    45
  Target:    0 (before migration)
  Migrated:  45
  Skipped:   0

Topics:
  Source:    120
  Target:    0 (before migration)
  Migrated:  120
  Skipped:   0

Subtopics:
  Source:    300
  Target:    0 (before migration)
  Migrated:  300
  Skipped:   0

✅ Total records migrated: 480
```

## Troubleshooting

### Error: "Database URL not found"
**Solution**: Check `.env.local` has `SKILLHUBCORE_DATABASE_URL` or `DATABASE_URL_TUTORIAL`

### Error: "Table does not exist"
**Solution**: Run the database migrations first:
```bash
cd packages/db-skillhubcore
pnpm db:migrate
```

### Error: "Foreign key constraint violation"
**Solution**: This shouldn't happen if the migration runs in order (domains → subjects → topics → subtopics). If it does, check that parent records exist.

### Some records skipped
**Normal**: If you run the migration multiple times, existing records are skipped. This is expected behavior.

### Migration seems slow
**Normal**: The script processes records one by one to ensure data integrity and provide detailed feedback. For large datasets (1000+ records), it may take a few minutes.

## Rollback

If you need to rollback the migration:

```sql
-- Connect to the database
psql <connection_string>

-- Delete migrated data
DELETE FROM subtopics;
DELETE FROM topics;
DELETE FROM subjects;
DELETE FROM domains;

-- Verify
SELECT COUNT(*) FROM domains;
SELECT COUNT(*) FROM subjects;
SELECT COUNT(*) FROM topics;
SELECT COUNT(*) FROM subtopics;
```

**Note**: This will delete ALL data from these tables, not just migrated data. Use with caution!

## Next Steps

After successful migration:

1. ✅ Verify data in UI
2. ✅ Test all CRUD operations
3. ✅ Update any hardcoded references
4. ✅ Train team on new system
5. ✅ Monitor for any issues
6. ✅ Consider archiving old RealTutorialHub tables (after sufficient testing period)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the migration script output for error messages
3. Verify database schema matches expected structure
4. Check database permissions
5. Review `.env.local` configuration

## Files

- **Migration Script**: `scripts/migrate-educational-hierarchy-data.mjs`
- **Database Test**: `scripts/test-educational-hierarchy.mjs`
- **API Test**: `scripts/test-educational-hierarchy-api.mjs`
- **Migration Checklist**: `SKILLHUBCORE_MIGRATION_CHECKLIST.md`
