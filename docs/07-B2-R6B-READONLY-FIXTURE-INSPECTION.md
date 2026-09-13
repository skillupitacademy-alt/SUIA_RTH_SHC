# B.2-R-6B — Read-Only Fixture Inspection Report

**Date:** September 12, 2026  
**Script:** `scripts/b2r6-inspect-test-fixtures-readonly.mjs`  
**Status:** ✅ COMPLETE — NO DATABASE MUTATION PERFORMED

---

## Executive Summary

Successfully completed read-only inspection of the ajayshah@gmail.com / whatisjava test fixture. All 4 completion records are confirmed dummy `gate-3c1r-*` test data created during Gate-3C1R testing phases.

**Key Finding:** All completions match the expected dummy pattern — narrowly targeted cleanup is technically safe.

---

## Database Configuration

### Environment Variables Used
- ✅ `DATABASE_URL_PEOPLE` — Set and working
- ✅ `DATABASE_URL_TUTORIAL` — Set and working

### Database Packages
- **People DB Access:** Raw `pg.Pool` with `process.env.DATABASE_URL_PEOPLE`
- **Tutorial DB Access:** Raw `pg.Pool` with `process.env.DATABASE_URL_TUTORIAL`
- **Pattern Source:** Established repository pattern from `scripts/_audit_whatisjava_complete_linkage.mjs`

### Why This Approach
The investigation in B.2-R-6A revealed that:
1. The original reset script incorrectly imported `@quiz/db-people` to query `tutorial_navigation_progress`
2. The original script attempted invalid cross-database JOINs
3. The original script did not load `.env.local`
4. Existing working scripts use raw `pg.Pool` with direct SQL queries

This corrected script follows the proven repository pattern.

---

## Lookup Flow

### Step 1: Environment Configuration Check
```
DATABASE_URL_PEOPLE:    ✅ Set
DATABASE_URL_TUTORIAL:  ✅ Set
```

### Step 2: People DB Lookup
**Query:**
```sql
SELECT id, email, platform, is_active, role
FROM users
WHERE email = $1 AND deleted_at IS NULL
LIMIT 1
```

**Target:** `ajayshah@gmail.com`

**Result:**
- User ID (redacted): `5472...86f8`
- Brand: `realtutorialhub`
- Role: `student`
- Active: `true`

### Step 3: Tutorial DB Lookup
**Query:**
```sql
SELECT 
  id, user_id, navigation_node_id, status,
  completed_blocks, visit_count, revision_count,
  first_viewed_at, last_viewed_at, completed_at,
  created_at, updated_at
FROM tutorial_navigation_progress
WHERE user_id = $1
  AND navigation_node_id = $2
  AND deleted_at IS NULL
LIMIT 1
```

**Parameters:**
- `user_id`: (resolved from Step 2)
- `navigation_node_id`: `whatisjava`

**Result:**
- Progress ID (redacted): `5bd7...7e37`
- Status: `in_progress`
- Visit Count: `60`
- Revision Count: `0`
- First Viewed: `2026-09-04 21:21:29`
- Last Viewed: `2026-09-12 06:24:28`
- Completed At: `NULL`

---

## Completion Records Found

### Total: 4 completions

| # | Block ID | Version | Completed At | Classification |
|---|----------|---------|--------------|----------------|
| 1 | `gate-3c1r-phase-d-block-le3-1789057672929-cbxbbt` | D1 | 2026-09-10 16:27:53 | 🔴 dummy_orphaned |
| 2 | `gate-3c1r-phase-d-block-le4-1789057673771-og3ccr` | D1 | 2026-09-10 16:27:54 | 🔴 dummy_orphaned |
| 3 | `gate-3c1r-phase-d-block-le7-1789057676750-8zifbx` | D1 | 2026-09-10 16:27:57 | 🔴 dummy_orphaned |
| 4 | `gate-3c1r-phase-d-completion-1789058906687-fjogsh` | D1 | 2026-09-10 16:48:29 | 🔴 dummy_orphaned |

---

## Classification Logic

**Dummy Pattern:** `/^gate-3c1r-/`

All 4 records match this pattern, indicating they were created during Gate-3C1R testing phases (D-phase testing, specifically).

### Summary Counts
- **Total Completions:** 4
- **Dummy (gate-3c1r-*):** 4 ✅
- **Valid Current:** 0
- **Unknown:** 0

---

## Assessment

### ✅ CONFIRMED: All Completions Are Dummy Test Data

All 4 completion records in the ajayshah@gmail.com / whatisjava progress record are confirmed dummy test data created during Gate-3C1R testing.

**Evidence:**
1. All block IDs match the `gate-3c1r-` prefix pattern
2. All blocks reference "phase-d" testing phase
3. All completions occurred on 2026-09-10 during testing window
4. Block IDs contain testing identifiers: `le3`, `le4`, `le7`, `completion`
5. Version `D1` indicates test data versioning

**Comparison to B.2-R-4 API Investigation:**
- API returned 2 "current" blocks (from live published content)
- Database contains 4 "orphaned" dummy completions
- This confirms the 4/2 anomaly diagnosis from B.2-R-4

---

## Safety Confirmation

✅ **NO DATABASE MUTATION PERFORMED**  
✅ Read-only inspection completed  
✅ Separate People DB and Tutorial DB connections used  
✅ No cross-database JOIN attempted  
✅ No credentials exposed in logs or output  
✅ User ID and Progress ID redacted in output  

---

## Technical Safety Assessment

### Is Narrowly Targeted Cleanup Safe?

**Yes**, with the following conditions:

1. **Target only specific dummy block IDs** — Do not reset entire `completed_blocks` array
2. **Filter by block ID pattern** — Remove only entries where `blockId` matches `/^gate-3c1r-/`
3. **Preserve any non-dummy completions** — If any exist (though none found in this case)
4. **Update status conditionally** — Only set status to `not_started` if `completed_blocks` becomes empty
5. **Use transaction** — Ensure atomicity
6. **Require explicit confirmation** — Do not execute without user approval

---

## Next Steps

### Option 1: Proceed with Narrowly Targeted Cleanup (Recommended)

Create `scripts/b2r6-cleanup-dummy-completions.mjs` that:

1. **Reads the current `completed_blocks` array**
2. **Filters out only `gate-3c1r-*` entries**
3. **Updates `completed_blocks` with filtered array**
4. **Updates `status`:**
   - If `completed_blocks` becomes empty: set to `not_started`
   - If `completed_blocks` still has entries: preserve current status
5. **Updates `completed_at`:**
   - If `completed_blocks` becomes empty: set to `NULL`
   - Otherwise: preserve
6. **Uses PostgreSQL transaction** for safety
7. **Supports `--dry-run` mode** (required first execution)
8. **Requires `--execute` flag** for actual cleanup

### Option 2: Manual SQL Cleanup

If preferred, execute manual SQL with explicit transaction:

```sql
BEGIN;

UPDATE tutorial_navigation_progress
SET 
  completed_blocks = (
    SELECT jsonb_agg(block)
    FROM jsonb_array_elements(completed_blocks) AS block
    WHERE NOT (block->>'blockId' ~ '^gate-3c1r-')
  ),
  status = CASE 
    WHEN (
      SELECT COUNT(*)
      FROM jsonb_array_elements(completed_blocks) AS block
      WHERE NOT (block->>'blockId' ~ '^gate-3c1r-')
    ) = 0 THEN 'not_started'
    ELSE status
  END,
  completed_at = CASE 
    WHEN (
      SELECT COUNT(*)
      FROM jsonb_array_elements(completed_blocks) AS block
      WHERE NOT (block->>'blockId' ~ '^gate-3c1r-')
    ) = 0 THEN NULL
    ELSE completed_at
  END,
  updated_at = NOW()
WHERE id = '<progress-record-id>'
  AND user_id = '<user-id>'
  AND navigation_node_id = 'whatisjava'
  AND deleted_at IS NULL;

-- Verify before commit
SELECT 
  id,
  status,
  completed_blocks,
  completed_at
FROM tutorial_navigation_progress
WHERE id = '<progress-record-id>';

-- Only commit if verification passes
COMMIT;
-- Or rollback: ROLLBACK;
```

### Option 3: Leave As-Is and Document

If the dummy data does not affect production behavior, document the presence of these orphaned test completions and defer cleanup.

---

## Comparison to Original Script Issues

### Original Script Problems (B.2-R-6A findings)
❌ Used `@quiz/db-people` package to query `tutorial_navigation_progress` (wrong database)  
❌ Did not load `.env.local`  
❌ Attempted invalid cross-database JOIN  
❌ Would reset entire `completed_blocks` array (not targeted)  
❌ Would unconditionally reset `status` to `not_started`  

### Corrected Script (this inspection)
✅ Uses separate `pg.Pool` connections for People and Tutorial DBs  
✅ Loads `.env.local` via dotenv  
✅ No cross-database JOIN — separate queries  
✅ Identifies specific dummy records by pattern matching  
✅ Does not modify any data  
✅ Provides classification and assessment  

---

## Related Documentation

- **B.2-R-4:** Server-side forensic investigation (confirmed 4/2 anomaly at API boundary)
- **B.2-R-5:** Data contract analysis (`toDTO()` exposes unfiltered `completedBlocks`)
- **B.2-R-6A:** Database configuration investigation (identified original script issues)
- **B.2-R-6:** Manual SQL cleanup guide

---

## Execution Evidence

**Script:** `scripts/b2r6-inspect-test-fixtures-readonly.mjs`  
**Executed:** September 12, 2026  
**Exit Code:** 0 (success)  
**Database Mutations:** 0 (read-only)  
**Credentials Exposed:** 0 (redacted in output)  

---

## Conclusion

✅ **B.2-R-6B COMPLETE**

The read-only fixture inspection successfully identified all 4 dummy completion records in the ajayshah@gmail.com / whatisjava test fixture. All completions match the expected `gate-3c1r-*` dummy pattern created during Gate-3C1R testing.

**Recommendation:** Proceed with narrowly targeted cleanup that removes only these specific dummy completion array entries while preserving the progress record structure.

**NO DATABASE MUTATION PERFORMED.**  
**CLEANUP EXECUTION NOT AUTHORIZED — AWAITING USER APPROVAL.**
