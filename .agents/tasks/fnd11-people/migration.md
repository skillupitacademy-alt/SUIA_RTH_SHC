# FND11 Email Uniqueness Migration Plan

**Task:** FND11 People Projection - Email Uniqueness Implementation  
**Status:** Code Changes Complete - Schema Migration Pending Authorization  
**Date:** 2026-11-06  
**Worktree:** e:/onlinewebsites/quiz-platform/.worktrees/fnd11-people-email

---

## Overview

This migration implements tenant-scoped email uniqueness by replacing the global unique constraint on `users.email` with a composite unique index on `(LOWER(TRIM(email)), platform)` that excludes soft-deleted records.

**Key changes:**
1. Remove `.unique()` from email column definition
2. Replace non-unique index with composite unique index
3. Add email normalization at application layer
4. Update admission route to scope lookups by platform

---

## Pre-Migration State

### Current Schema
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  platform text NOT NULL DEFAULT 'realtutorialhub',
  deleted_at timestamptz,
  -- ... other columns
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_email_platform 
ON users (email, platform) 
WHERE deleted_at IS NULL;
```

### Current Defect
- Admission route performs unscoped email lookup (finds users on ANY platform)
- Foreign-tenant email collision causes cross-platform admission (test failure)
- Global unique constraint prevents legitimate cross-platform accounts

---

## Phase 1: Code Deployment (COMPLETED)

### Changes Applied
1. ✅ Created `packages/db-people/src/utils/email-normalization.ts`
2. ✅ Updated `packages/db-people/src/schema/users.ts` (removed `.unique()`, added composite index definition)
3. ✅ Updated `apps/skillup-admin/.../admit/route.ts` (added platform filter and normalization)
4. ✅ Exported email normalization from package index

### Files Modified
- `packages/db-people/src/utils/email-normalization.ts` (NEW)
- `packages/db-people/src/index.ts` (export added)
- `packages/db-people/src/schema/users.ts` (schema definition)
- `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` (admission logic)

---

## Phase 2: Pre-Migration Database Audit (REQUIRED BEFORE MIGRATION)

Execute these queries against the target database to verify readiness:

### 1. Check for same-platform duplicates (must be 0)
```sql
SELECT email, platform, COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
GROUP BY email, platform
HAVING COUNT(*) > 1;
```
**Expected:** 0 rows  
**If non-zero:** Manual resolution required before proceeding

### 2. Identify cross-platform duplicates (informational)
```sql
SELECT email, 
       COUNT(DISTINCT platform) as platform_count,
       array_agg(DISTINCT platform) as platforms,
       COUNT(*) as total_users
FROM users
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(DISTINCT platform) > 1;
```
**Expected:** May have rows (legitimate cross-platform accounts)  
**Action:** Document count for rollback planning

### 3. Verify platform column has no NULLs (must be 0)
```sql
SELECT COUNT(*) as null_platform_count
FROM users
WHERE platform IS NULL;
```
**Expected:** 0 rows  
**If non-zero:** Backfill required before migration

### 4. Check for NULL emails (must be 0)
```sql
SELECT COUNT(*) as null_email_count
FROM users
WHERE email IS NULL;
```
**Expected:** 0 rows (enforced by NOT NULL constraint)

---

## Phase 3: Schema Migration (REQUIRES EXPLICIT AUTHORIZATION)

### Migration SQL

**Step 1: Create composite unique index (safe, no downtime)**
```sql
-- Use CONCURRENTLY to avoid locking table
CREATE UNIQUE INDEX CONCURRENTLY uniq_users_email_platform
ON users (LOWER(TRIM(email)), platform)
WHERE deleted_at IS NULL;
```

**Execution time:** 1-5 minutes depending on table size  
**Impact:** No locks, safe for production  
**Failure mode:** Will fail if same-platform duplicates exist (desired behavior)

**Step 2: Verify index creation**
```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' 
  AND indexname = 'uniq_users_email_platform';
```
**Expected:** 1 row with correct definition

**Step 3: Remove global unique constraint (requires brief lock)**
```sql
-- This requires an ACCESS EXCLUSIVE lock but should be fast
ALTER TABLE users DROP CONSTRAINT users_email_unique;
```

**Alternative constraint names to check:**
```sql
-- List all unique constraints on users table
SELECT conname
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND contype = 'u'
  AND array_position(conkey, 
    (SELECT attnum FROM pg_attribute 
     WHERE attrelid = 'users'::regclass AND attname = 'email')
  ) IS NOT NULL;
```

**Step 4: Drop old non-unique index (cleanup)**
```sql
DROP INDEX IF EXISTS idx_users_email_platform;
```

### Complete Migration Script
```sql
-- Execute as single transaction for atomicity
BEGIN;

-- Verify pre-conditions
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, platform
    FROM users
    WHERE deleted_at IS NULL
    GROUP BY email, platform
    HAVING COUNT(*) > 1
  ) sub;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Cannot proceed: % same-platform duplicate email(s) found', duplicate_count;
  END IF;
END $$;

-- Step 1: Create composite unique index (must run outside transaction with CONCURRENTLY)
-- Run separately before this transaction:
-- CREATE UNIQUE INDEX CONCURRENTLY uniq_users_email_platform
-- ON users (LOWER(TRIM(email)), platform)
-- WHERE deleted_at IS NULL;

-- Verify index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'uniq_users_email_platform'
  ) THEN
    RAISE EXCEPTION 'Required index uniq_users_email_platform does not exist';
  END IF;
END $$;

-- Step 3: Remove global unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Step 4: Drop old index
DROP INDEX IF EXISTS idx_users_email_platform;

COMMIT;
```

---

## Phase 4: Post-Migration Verification

### 1. Verify index usage
```sql
EXPLAIN ANALYZE
SELECT id FROM users
WHERE LOWER(TRIM(email)) = 'test@example.com'
  AND platform = 'skillup'
  AND deleted_at IS NULL;
```
**Expected:** `Index Scan using uniq_users_email_platform`

### 2. Test uniqueness enforcement (in test/staging environment)
```sql
-- Should succeed (different platforms)
BEGIN;
INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'skillup', 'hash1', 'student');

INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'realtutorialhub', 'hash2', 'student');

-- Should fail (same platform)
INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'skillup', 'hash3', 'student');
-- Expected: ERROR: duplicate key value violates unique constraint "uniq_users_email_platform"

ROLLBACK;
```

### 3. Test normalization (in test/staging environment)
```sql
BEGIN;
INSERT INTO users (email, platform, password_hash, role)
VALUES ('Test@Example.COM', 'skillup', 'hash1', 'student');

-- Should fail (normalized to same value)
INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'skillup', 'hash2', 'student');
-- Expected: ERROR: duplicate key value violates unique constraint "uniq_users_email_platform"

ROLLBACK;
```

### 4. Run admission collision test
```bash
cd e:/onlinewebsites/quiz-platform/.worktrees/fnd11-people-email
python audit/W1.2_Batch_08_Sol_Probe.py
```
**Expected:** Foreign-tenant admission test expects 403/409 (should pass after fix)

---

## Rollback Procedures

### Rollback Phase 3 (Schema Migration)

**CRITICAL:** Can only rollback if NO cross-platform duplicate emails were created after migration.

**Step 1: Check for cross-platform duplicates**
```sql
SELECT email, array_agg(DISTINCT platform) as platforms, COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(DISTINCT platform) > 1;
```

**Step 2: If zero duplicates, restore global constraint**
```sql
BEGIN;

-- Re-add global unique constraint
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Recreate non-unique index
CREATE INDEX idx_users_email_platform 
ON users (email, platform) 
WHERE deleted_at IS NULL;

-- Drop composite unique index
DROP INDEX uniq_users_email_platform;

COMMIT;
```

**If duplicates exist:** Rollback NOT POSSIBLE. Must either:
1. Keep new schema and fix code issues
2. Manually resolve duplicates before rollback
3. Soft-delete duplicate accounts

### Rollback Phase 1 (Code Changes)

**Revert code commits:**
```bash
cd e:/onlinewebsites/quiz-platform/.worktrees/fnd11-people-email
git log --oneline -5  # Identify commit to revert
git revert <commit-sha>
```

**Remove email normalization utility:**
```bash
rm packages/db-people/src/utils/email-normalization.ts
```

**Restore original admission route logic** (remove platform filter)

---

## Risk Assessment

### High Risk
- **Schema migration on production database:** Requires ACCESS EXCLUSIVE lock for constraint removal
- **Irreversible after cross-platform duplicates created:** Cannot rollback schema if duplicates exist
- **Breaking change for unpatched callers:** Any code calling `findByEmail` without platform will fail

### Medium Risk
- **Email normalization bugs:** Invalid email handling could break admission/auth flows
- **Concurrent admission race conditions:** Two simultaneous admits with same email/platform

### Low Risk
- **Index creation:** CONCURRENTLY option prevents table locks
- **Performance impact:** Negligible (composite index has same lookup cost as single column)

### Mitigation Strategies
1. **Test in staging first:** Execute complete migration on staging database
2. **Deploy code before schema:** Ensure application handles both schemas gracefully
3. **Maintenance window:** Schedule schema migration during low-traffic period
4. **Monitoring:** Watch for unique constraint violations in application logs
5. **Rollback plan ready:** Document exact rollback steps before proceeding

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code changes reviewed and merged to feature branch
- [ ] Unit tests passing for email normalization
- [ ] Integration tests passing for admission route
- [ ] Pre-migration audit queries executed on staging
- [ ] No same-platform duplicate emails found
- [ ] Migration SQL reviewed by database administrator
- [ ] Rollback procedure documented and tested in staging

### Deployment
- [ ] Deploy code changes to staging
- [ ] Execute migration on staging database
- [ ] Run post-migration verification on staging
- [ ] Execute admission collision test on staging
- [ ] Monitor staging for 24 hours
- [ ] Deploy code changes to production
- [ ] Schedule production migration window
- [ ] Execute migration on production database
- [ ] Run post-migration verification on production
- [ ] Monitor production for errors

### Post-Deployment
- [ ] Verify admission tests pass
- [ ] Check application logs for unique constraint violations
- [ ] Monitor query performance for email lookups
- [ ] Update documentation with new email uniqueness policy
- [ ] Mark FND11 as IMPLEMENTED_VERIFIED

---

## Authorization Gates

### Code Deployment: AUTONOMOUS
- Implementation follows approved design
- Changes scoped to FND11 boundaries
- No external API changes

### Schema Migration: REQUIRES EXPLICIT AUTHORIZATION
- Modifies database constraints (breaking change)
- Irreversible after cross-platform duplicates exist
- Must be authorized by Sol or database administrator

### Verification: AUTONOMOUS
- Run audit tests to verify fix
- Document results in task status

---

## Next Steps

1. **Immediate:** Run verification tests (audit/W1.2_Batch_08_Sol_Probe.py)
2. **Before Schema Migration:** Execute pre-migration audit queries
3. **After Verification:** Submit for Sol review with test results
4. **After Approval:** Schedule schema migration with DBA

---

## References

- **Policy:** `.agents/tasks/fnd11-people/policy.md`
- **Design:** `.agents/tasks/fnd11-people/design.md`
- **Test:** `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts`
- **Probe:** `audit/W1.2_Batch_08_Sol_Probe.py`

---

**Status:** Code changes complete. Schema migration SQL documented. Awaiting verification test results before submitting for authorization.
