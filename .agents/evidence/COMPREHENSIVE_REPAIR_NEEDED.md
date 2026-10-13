# Comprehensive Migration Repair Required

**Date**: 2026-10-11  
**Current Status**: Migration 0012 repaired successfully, but cascading issues found in 0013-0027

---

## Problem Scope

The empty 0011 snapshot caused **cascading duplication** across multiple migrations:

### ✅ Fixed So Far
- **Migration 0012**: 46 duplicates removed (commit 7da64232)
  - CI now passes migration 0012 ✅

### ❌ Still Broken
- **Migration 0017**: Creates `idx_sections_delivery` 
- **Migration 0018**: Recreates `idx_sections_delivery` + adds 'overview' enum value (already in 0016)
- **Migration 0021**: Recreates `idx_sections_delivery` again

---

## Latest CI Error

```
error: relation "idx_sections_delivery" already exists
code: '42P07'
```

This index is created in migration 0012 as part of the `tutorial_sections` table, then recreated in migrations 0017, 0018, and 0021.

---

## Root Cause Analysis

When Drizzle generated migrations 0013-0027, each one used the **snapshot from the previous migration** as its baseline. Since:

1. Migration 0011 snapshot was empty
2. Migration 0012 regenerated everything (now fixed)
3. Migrations 0013-0027 were generated using **broken snapshots from 0012-0026**
4. Each subsequent migration inherited duplication issues

---

## Recommended Action

### Option 1: Systematic Surgical Fix (Safest)

Apply the same process to each migration 0013-0027:
1. Parse ALL SQL in migrations 0000-N
2. Identify duplicates in migration N+1
3. Remove duplicates, keep genuinely new objects
4. Update snapshot N+1
5. Repeat for each migration

**Pros**: Preserves complete migration history  
**Cons**: Time-consuming (27 migrations to review)  
**Time**: 4-8 hours

### Option 2: Regenerate Migrations 0012-0027 (Faster but Risky)

1. Keep migrations 0000-0011 intact
2. Delete migrations 0012-0027 SQL files
3. Restore schema to state after 0011
4. Regenerate all 16 migrations from scratch using current schema files
5. Test full migration sequence

**Pros**: Clean slate, no hidden duplicates  
**Cons**: High risk if 0012-0027 already applied to production  
**Time**: 2-3 hours  
**Risk**: ⚠️ BREAKING if any migration was applied

### Option 3: Quick Fix - Add IF NOT EXISTS (Pragmatic)

For each duplicate, add idempotent syntax:
- `CREATE INDEX IF NOT EXISTS`
- `ALTER TYPE ... ADD VALUE IF NOT EXISTS`
- `CREATE TABLE IF NOT EXISTS` (not standard SQL, use DO blocks)

**Pros**: Minimal changes, preserves history  
**Cons**: Doesn't fix root cause, leaves redundant migrations  
**Time**: 1-2 hours  
**Risk**: Low

---

## Immediate Next Steps

### Quick Win: Fix Migrations 0017, 0018, 0021

These are blocking CI right now. Add `IF NOT EXISTS`:

**Migration 0017**:
```sql
CREATE INDEX IF NOT EXISTS "idx_sections_delivery" ON "tutorial_sections" ...
```

**Migration 0018**:
```sql
ALTER TYPE "public"."section_type" ADD VALUE IF NOT EXISTS 'overview' BEFORE 'notes';
CREATE INDEX IF NOT EXISTS "idx_sections_delivery" ON "tutorial_sections" ...
```

**Migration 0021**:
```sql
CREATE INDEX IF NOT EXISTS "idx_sections_delivery" ON "tutorial_sections" ...
```

This unblocks CI immediately while we decide on comprehensive fix.

---

## Decision Required

Which option to pursue?

1. **Option 1**: Systematic surgical fix (thorough, time-intensive)
2. **Option 2**: Regenerate 0012-0027 (fast, risky if migrations applied)
3. **Option 3**: Quick idempotent fixes (pragmatic, leaves tech debt)

**Recommendation**: Start with **Option 3** to unblock CI, then evaluate whether Option 1 or 2 is needed based on migration history in deployed environments.

---

## Files to Investigate

Run this to find all potential duplicates:
```bash
# Find all CREATE INDEX statements across migrations
for f in packages/db-tutorial/migrations/*.sql; do
    echo "=== $f ==="
    grep -n "^CREATE INDEX" "$f" | cut -d: -f2 | sort
done | sort | uniq -d

# Find all ALTER TYPE ADD VALUE
for f in packages/db-tutorial/migrations/*.sql; do
    grep -n "ALTER TYPE.*ADD VALUE" "$f"
done
```

---

## Current State

- Branch: `project-llm-e2e-implementation`
- Latest commit: 7da64232 (0012 surgical fix)
- CI status: ❌ Failing at migration 0017/0018
- Evidence: `.agents/evidence/` (14 files documenting investigation)

---

**Status**: Awaiting decision on repair strategy
