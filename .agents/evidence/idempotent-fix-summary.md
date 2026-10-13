# Idempotent Migration Fix Summary

## Issue
CI was failing with:
```
error: relation "idx_sections_delivery" already exists
```

The index `idx_sections_delivery` was first created in migration 0012 but was duplicated in migrations 0017, 0018, and 0021. The enum value 'overview' was first added in migration 0016 but was duplicated in migration 0018.

## Files Changed

### 1. packages/db-tutorial/migrations/0017_tutorial_delivery_indexes.sql
**Status:** No changes needed  
Already had `IF NOT EXISTS` in place for both CREATE INDEX statements.

### 2. packages/db-tutorial/migrations/0018_amused_rockslide.sql
**Changes:** 3 lines modified

**Line 1:** ALTER TYPE statement
- **Before:** `ALTER TYPE "public"."section_type" ADD VALUE 'overview' BEFORE 'notes';`
- **After:** `ALTER TYPE "public"."section_type" ADD VALUE IF NOT EXISTS 'overview' BEFORE 'notes';`

**Last 2 lines:** CREATE INDEX statements
- **Before:** `CREATE INDEX "idx_sections_delivery" ON "tutorial_sections"...`
- **After:** `CREATE INDEX IF NOT EXISTS "idx_sections_delivery" ON "tutorial_sections"...`

- **Before:** `CREATE INDEX "idx_sections_delivery_by_type" ON "tutorial_sections"...`
- **After:** `CREATE INDEX IF NOT EXISTS "idx_sections_delivery_by_type" ON "tutorial_sections"...`

### 3. packages/db-tutorial/migrations/0021_sparkling_unus.sql
**Status:** No changes needed  
This migration contains `DROP INDEX` statements, not CREATE INDEX statements.

## Total Changes
- **Files modified:** 1 (0018_amused_rockslide.sql)
- **Lines changed:** 3
- **Type:** Made duplicate index/enum statements idempotent by adding IF NOT EXISTS

## Expected Result
Migrations 0017, 0018, and 0021 will now be idempotent and can run successfully even if their target objects already exist from earlier migrations, unblocking CI.
