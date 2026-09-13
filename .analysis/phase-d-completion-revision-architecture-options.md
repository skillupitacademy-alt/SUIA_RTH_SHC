# Phase D: Completion / Revision Architecture Options

**Gate:** 3C.1R Phase D  
**Date:** 2026-09-10  
**Status:** 🔴 BLOCKED - Architectural Decision Required  

---

## Executive Summary

Phase D comprehensive lifecycle verification has identified a **semantic disconnection** between completion authority and revision prerequisite checking.

**The Problem:**
- Completion is persisted in: `tutorial_navigation_progress.completed_blocks[]`
- Revision checks: `block_learning_state.completedAt IS NOT NULL`
- These two fields are **never synchronized** in the current implementation
- Result: Completed blocks never trigger revision counting when revisited in a new session

**Impact:** 4 of 34 lifecycle scenarios blocked (LE-7a, SS-5, SS-6, CS-4)

**Root Cause:** Incomplete implementation of the original architectural intent

---

## Confirmed Production Facts

### ✅ What Works

1. **recordBlockCompletion() succeeds**
   - Path: LearningProgressService → TutorialNavigationProgressRepository
   - Persistence: `tutorial_navigation_progress.completed_blocks[]`
   - Structure: `{blockId, blockVersion, completedAt: ISO timestamp}`

2. **Session tracking works**
   - `lastSessionId` correctly stored and compared
   - Session transitions detected (A → B)
   - `visitCount` increments correctly (1 → 2)

3. **Visit tracking works**
   - First visit: `visitCount = 1`, `lastSessionId = A`
   - Second visit: `visitCount = 2`, `lastSessionId = B`

### ❌ What's Broken

4. **Revision tracking fails**
   - Expected: `revisionCount = 1` (new session + completed block)
   - Actual: `revisionCount = 0`
   - Reason: `block_learning_state.completedAt` remains `NULL`

---

## Current Data Flow

```
SESSION A
   │
   ├── recordBlockVisit()
   │       ↓
   │   block_learning_state
   │       visitCount = 1
   │       lastSessionId = A
   │       completedAt = NULL     ← Never populated
   │
   ├── recordBlockCompletion()
   │       ↓
   │   tutorial_navigation_progress
   │       completed_blocks[]
   │       └── {blockId, blockVersion, completedAt: "2026-09-10T..."}
   │
   └── Completion persisted ✅
       Revision prerequisite NOT persisted ❌

SESSION B
   │
   └── recordBlockVisit()
           ↓
       block_learning_state
           visitCount = 2           ✅ (session changed)
           lastSessionId = B        ✅ (session updated)
           revisionCount = 0        ❌ (completedAt still NULL)
```

---

## Current Revision Logic

**Location:** `BlockLearningStateRepository.upsert()` (lines 320-331)

```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND block_learning_state.completedAt IS NOT NULL
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**Requirements:**
1. `lastSessionId` changed (session boundary detected) ✅
2. `completedAt IS NOT NULL` (block was previously completed) ❌

**Current State:**
- Condition 1: PASS (session tracking works)
- Condition 2: FAIL (`completedAt` never synchronized)

---

## Historical Architecture Evidence

### Original Intent (Commit fe005a51)

**Schema Comment:**
```typescript
/**
 * - completedAt: Denormalized completion timestamp
 *   (authoritative source: tutorial_navigation_progress.completed_blocks)
 */
completedAt: timestamp('completed_at', { mode: 'date' }),
```

**Key Findings:**
1. `completedAt` was **explicitly designed** as a denormalized field
2. Authoritative source was **always intended** to be `completed_blocks[]`
3. The schema comment uses the word "denormalized" (implies synchronization)
4. Migration 0023 created the field from inception

### What Was Never Implemented

**recordBlockCompletion() does NOT:**
- Touch `block_learning_state` table
- Call `BlockLearningStateRepository`
- Synchronize `completedAt`
- Establish any transactional link

**Evidence:**
```typescript
// packages/db-tutorial/src/services/learning-progress.service.ts
async recordBlockCompletion(...) {
  // Creates TutorialBlockCompletionEvent
  const event: TutorialBlockCompletionEvent = { ... };
  
  // Only touches tutorial_navigation_progress
  const updated = await this.progressRepository.markBlockCompleted(event);
  
  // Returns without touching block_learning_state
  return this.toDTO(updated, requiredBlocks, []);
}
```

**Git History Search:**
- No commits show completion synchronization logic
- No patches adding `completedAt` sync to `recordBlockCompletion()`
- No service-level coordination between the two tables

---

## Option A: Synchronize completedAt (Original Intent)

### Architecture

```
recordBlockCompletion()
        │
        ├──────────────→ tutorial_navigation_progress
        │                 completed_blocks[] (AUTHORITATIVE)
        │
        └──────────────→ block_learning_state
                          completedAt (DENORMALIZED)
```

### Implementation

**Modify:** `LearningProgressService.recordBlockCompletion()`

```typescript
async recordBlockCompletion(...) {
  // Record completion in navigation progress (authoritative)
  const updated = await this.progressRepository.markBlockCompleted(event);
  
  // ✨ NEW: Synchronize denormalized completedAt
  await this.blockLearningStateRepository.syncCompletedAt(
    identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    event.occurredAt
  );
  
  return this.toDTO(updated, requiredBlocks, []);
}
```

**Add:** `BlockLearningStateRepository.syncCompletedAt()`

```typescript
async syncCompletedAt(
  userId: string,
  navigationNodeId: string,
  blockId: string,
  blockVersion: string,
  completedAt: Date
): Promise<void> {
  await this.db
    .update(blockLearningState)
    .set({
      completedAt,
      updatedAt: new Date(),
    })
    .where(and(
      eq(blockLearningState.userId, userId),
      eq(blockLearningState.navigationNodeId, navigationNodeId),
      eq(blockLearningState.blockId, blockId),
      eq(blockLearningState.blockVersion, blockVersion),
      isNull(blockLearningState.deletedAt)
    ))
    .execute();
}
```

### Pros

1. **Matches Original Intent:** Schema comment explicitly says "denormalized"
2. **Minimal SQL Changes:** No change to revision logic (already correct)
3. **Clear Ownership:** Navigation progress owns completion, block state caches it
4. **Performance:** Revision check remains a single-table query
5. **Historical Data:** Can backfill from `completed_blocks[]`

### Cons

1. **Dual Persistence:** Completion state lives in two places
2. **Synchronization Risk:** Must guarantee consistency
3. **Transaction Boundary:** Two table updates (requires coordination)
4. **Additional Write:** Extra UPDATE on every completion

### Repository Responsibilities

**TutorialNavigationProgressRepository:**
- Authoritative completion storage
- Manages `completed_blocks[]` array

**BlockLearningStateRepository:**
- Denormalized completion cache
- Uses cached `completedAt` for revision logic

**LearningProgressService:**
- Coordinates synchronization
- Ensures both tables updated

### Transaction Boundary

**Option A1 - Sequential (Current Pattern):**
```typescript
// Write 1: Authoritative completion
await progressRepository.markBlockCompleted(event);

// Write 2: Denormalized cache
await blockLearningStateRepository.syncCompletedAt(...);
```
- ⚠️ Risk: Second write could fail, leaving inconsistent state

**Option A2 - Single Transaction:**
```typescript
await db.transaction(async (tx) => {
  await progressRepository.markBlockCompleted(event, tx);
  await blockLearningStateRepository.syncCompletedAt(..., tx);
});
```
- ✅ Guarantees consistency
- ⚠️ Requires refactoring both repositories to accept transaction context

### Consistency Guarantees

**Write Path:**
- Completion MUST be persisted to both tables or neither
- Authoritative source (`completed_blocks[]`) takes precedence on conflict

**Read Path:**
- Revision logic uses cached `completedAt` (no JOIN required)
- If cache inconsistent, revision may be delayed until next completion sync

**Repair Path:**
- Background job can reconcile: scan `completed_blocks[]`, sync missing `completedAt`

### Idempotency

**recordBlockCompletion():**
- Currently idempotent (array contains, no duplicate)
- Remains idempotent (UPDATE with same timestamp is safe)

**syncCompletedAt():**
- Idempotent (UPDATE same value is no-op)
- Safe to retry on failure

### Migration Requirements

**Backfill Historical Data:**

```sql
-- Find blocks marked complete in navigation progress but not in learning state
WITH completed AS (
  SELECT 
    tnp.user_id,
    tnp.navigation_node_id,
    jsonb_array_elements(tnp.completed_blocks) ->> 'blockId' AS block_id,
    jsonb_array_elements(tnp.completed_blocks) ->> 'blockVersion' AS block_version,
    (jsonb_array_elements(tnp.completed_blocks) ->> 'completedAt')::timestamp AS completed_at
  FROM tutorial_navigation_progress tnp
  WHERE jsonb_array_length(tnp.completed_blocks) > 0
)
UPDATE block_learning_state bls
SET 
  completed_at = c.completed_at,
  updated_at = now()
FROM completed c
WHERE bls.user_id = c.user_id
  AND bls.navigation_node_id = c.navigation_node_id
  AND bls.block_id = c.block_id
  AND bls.block_version = c.block_version
  AND bls.completed_at IS NULL
  AND bls.deleted_at IS NULL;
```

**Risk:** Safe (only sets NULL → timestamp, doesn't overwrite)

---

## Option B: Revision Consumes Completion Authority

### Architecture

```
tutorial_navigation_progress
    completed_blocks[] (AUTHORITATIVE)
        │
        ↓
    revision determination
        │
        ↓
block_learning_state
    revisionCount++
```

### Implementation

**Modify:** `BlockLearningStateRepository.upsert()`

**Current:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND block_learning_state.completedAt IS NOT NULL
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**New:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND EXISTS (
      SELECT 1 FROM tutorial_navigation_progress tnp
      WHERE tnp.user_id = NEW.user_id
        AND tnp.navigation_node_id = NEW.navigation_node_id
        AND tnp.deleted_at IS NULL
        AND jsonb_array_length(
          jsonb_path_query_array(
            tnp.completed_blocks,
            '$ ? (@.blockId == $blockId && @.blockVersion == $blockVersion)',
            jsonb_build_object('blockId', NEW.block_id, 'blockVersion', NEW.block_version)
          )
        ) > 0
    )
  THEN revisionCount + 1
  ELSE revisionCount
END
```

### Pros

1. **Single Source of Truth:** No denormalized state
2. **No Synchronization:** Completion only persisted once
3. **Guaranteed Consistency:** Can't become out-of-sync

### Cons

1. **Performance:** JOIN on every visit (not just revision)
2. **Complex SQL:** JSONB path query in atomic upsert
3. **Cross-Repository Dependency:** `BlockLearningStateRepository` needs `tutorial_navigation_progress`
4. **Repository Violation:** Block state repository queries navigation state
5. **SQL Complexity:** JSONB querying in CASE statement
6. **Index Requirements:** May need GIN index on `completed_blocks` JSONB

### Repository Responsibilities

**TutorialNavigationProgressRepository:**
- Authoritative completion storage
- Now queried by block learning state operations

**BlockLearningStateRepository:**
- Queries external table in atomic logic
- ⚠️ Violates single-responsibility principle

**LearningProgressService:**
- No coordination needed

### Transaction Boundary

**Current Pattern (Single Statement):**
```sql
INSERT ... ON CONFLICT DO UPDATE
```
- ✅ Atomic at database level
- ⚠️ Now includes subquery to different table

**Risk:**
- Subquery performance impact on every block visit
- Potential lock contention between tables

### Consistency Guarantees

**No Synchronization Needed:**
- Completion only persisted to `completed_blocks[]`
- Revision logic reads directly from authoritative source

**Risk:**
- Performance degrades if `completed_blocks[]` array is large
- JSONB query performance depends on array size

### Idempotency

**recordBlockVisit():**
- Idempotent (already)
- Performance impact on every call (not just revisions)

**No syncCompletedAt():**
- Not needed

### Migration Requirements

**None required** - existing `completed_blocks[]` already contains all data

**Cleanup (Optional):**
```sql
ALTER TABLE block_learning_state DROP COLUMN completed_at;
```

---

## Comparison Matrix

| Criterion | Option A (Sync) | Option B (JOIN) |
|-----------|----------------|-----------------|
| **Matches Original Intent** | ✅ Yes (schema says "denormalized") | ❌ No (contradicts schema comment) |
| **Source of Truth** | `completed_blocks[]` (cached in `completedAt`) | `completed_blocks[]` (queried) |
| **Write Complexity** | +1 repository call | No change |
| **Read Complexity** | No change | +1 subquery on every visit |
| **Performance** | Single table query | JOIN/subquery on every visit |
| **Synchronization Risk** | Must guarantee consistency | N/A (no denormalization) |
| **Transaction Boundary** | Sequential or transactional | Single atomic statement |
| **Repository Ownership** | Clear separation | Cross-table dependency |
| **SQL Complexity** | Simple UPDATE | JSONB path query in CASE |
| **Migration Required** | Yes (backfill) | No (data already exists) |
| **Schema Change** | No | Optional (drop column) |
| **Historical Data** | Can reconcile | Already correct |
| **D1/C1/X1 Generic** | ✅ Yes | ✅ Yes |
| **Regression Risk** | Low (additive) | Medium (changes atomic logic) |

---

## Universal Architecture Impact

### Option A: No Impact

```
Composer
  ↓
UBRC (Universal Block Read Contracts)
  ↓
ILS
  ↓
LearningProgressService
  ↓
  ├→ TutorialNavigationProgressRepository (authoritative)
  └→ BlockLearningStateRepository (denormalized)
```

**Remains Universal:**
- No D1/C1-specific logic
- Completion synchronization applies to all block types
- Generic across all brands
- No block-type branching

### Option B: Potential Concern

**New dependency:**
```
BlockLearningStateRepository
    ↓
tutorial_navigation_progress (different domain)
```

**Risk:**
- Repository couples block-level telemetry to navigation-level progress
- Violates repository isolation
- May complicate future D2/C2/X2 block types if they have different completion models

---

## Transactionality Analysis

### Option A - Sequential Writes

**Current recordBlockCompletion():**
```typescript
// Write 1: Authoritative
await this.progressRepository.markBlockCompleted(event);

// Write 2: Denormalized (NEW)
await this.blockLearningStateRepository.syncCompletedAt(...);

return dto;
```

**Failure Scenarios:**
1. Write 1 succeeds, Write 2 fails
   - **State:** Completion recorded, revision won't trigger
   - **Impact:** Revision delayed until next completion or manual repair
   - **Severity:** Low (eventual consistency via repair job)

2. Write 1 fails, Write 2 not attempted
   - **State:** Consistent (nothing persisted)
   - **Impact:** None
   - **Severity:** None

**Mitigation:**
- Wrap in transaction (requires repository refactor)
- Or: Accept eventual consistency + repair job

### Option A - Transactional Writes

**Refactored recordBlockCompletion():**
```typescript
await this.db.transaction(async (tx) => {
  await this.progressRepository.markBlockCompleted(event, tx);
  await this.blockLearningStateRepository.syncCompletedAt(..., tx);
});
```

**Benefits:**
- Atomic (both succeed or both fail)
- Strong consistency guarantee

**Cost:**
- Requires passing transaction context through repository APIs
- More complex error handling

### Option B - Already Atomic

**Single SQL statement:**
```sql
INSERT ... ON CONFLICT DO UPDATE SET
  revision_count = CASE
    WHEN ... AND (subquery to completed_blocks) THEN ...
  END
```

**Benefits:**
- Database-level atomicity
- No application-level transaction coordination

**Cost:**
- Subquery executed on every visit (performance)

---

## Concurrency Analysis

### Option A

**Scenario:** Two concurrent completions for same block

**Write 1 (Authoritative):**
```typescript
await progressRepository.markBlockCompleted(event);
// Uses array containment check (idempotent)
```

**Write 2 (Denormalized):**
```typescript
await blockLearningStateRepository.syncCompletedAt(...);
// UPDATE with timestamp (idempotent)
```

**Result:**
- Both writes idempotent
- Last completion timestamp wins in `completedAt`
- `completed_blocks[]` remains consistent (no duplicates)

**Risk:** Low (idempotent operations)

### Option B

**Scenario:** Concurrent visit + completion

**Visit:**
```sql
INSERT ... ON CONFLICT DO UPDATE
  -- Subquery checks completed_blocks
```

**Completion:**
```typescript
await progressRepository.markBlockCompleted(event);
// Modifies completed_blocks array
```

**Risk:**
- Visit's subquery may read pre-completion state
- Revision count increment may be delayed one visit
- **Severity:** Low (eventual consistency, corrects on next visit)

---

## Idempotency Analysis

### Option A

**recordBlockCompletion():**
- Called multiple times with same blockId → same result
- `completed_blocks[]` uses containment (no duplicates)
- `syncCompletedAt()` uses UPDATE (idempotent)
- ✅ Fully idempotent

**Retry Safety:**
- Safe to retry on network failure
- Safe to retry on timeout
- No risk of double-counting

### Option B

**recordBlockCompletion():**
- No change (already idempotent)
- Subquery always queries current `completed_blocks[]` state

**recordBlockVisit():**
- Subquery result may vary (if completion happens concurrently)
- But visit logic itself remains idempotent
- ✅ Fully idempotent

---

## Performance Analysis

### Option A

**Write Path:**
- `+1 UPDATE` per completion
- Simple equality WHERE clause (indexed)
- **Impact:** ~1-2ms per completion

**Read Path:**
- No change (revision check is same single-table query)
- **Impact:** 0ms

**Overall:** Write cost increases, read cost unchanged

### Option B

**Write Path:**
- No change

**Read Path:**
- `+1 subquery` per visit (not just revision)
- JSONB path query on every block visit
- **Impact:** ~5-10ms per visit (depends on array size)

**Index Requirements:**
- May need GIN index on `completed_blocks` JSONB
- Index maintenance cost on every completion

**Overall:** Read cost increases significantly (visits >> completions)

**Calculation:**
- If 100 visits per 1 completion:
  - Option A: +1ms * 1 = 1ms total
  - Option B: +5ms * 100 = 500ms total

---

## Schema Migration Impact

### Option A

**Required Migration:**
```sql
-- Backfill completedAt from completed_blocks
UPDATE block_learning_state bls
SET completed_at = (
  SELECT (jsonb_array_elements(tnp.completed_blocks) ->> 'completedAt')::timestamp
  FROM tutorial_navigation_progress tnp
  WHERE tnp.user_id = bls.user_id
    AND tnp.navigation_node_id = bls.navigation_node_id
    AND jsonb_array_elements(tnp.completed_blocks) ->> 'blockId' = bls.block_id
    AND jsonb_array_elements(tnp.completed_blocks) ->> 'blockVersion' = bls.block_version
  LIMIT 1
)
WHERE bls.completed_at IS NULL
  AND bls.deleted_at IS NULL;
```

**Risk:** Low (backfill is additive, doesn't change existing data)

### Option B

**Optional Cleanup:**
```sql
ALTER TABLE block_learning_state DROP COLUMN completed_at;
```

**Risk:** None (no migration required, cleanup is optional)

---

## Recommendation

**Choose Option A: Synchronize completedAt**

### Reasoning

1. **Historical Intent:** Schema explicitly documents `completedAt` as "denormalized"
2. **Performance:** Read path (visits) called 100x more than write path (completions)
3. **Repository Design:** Maintains clear ownership boundaries
4. **Regression Risk:** Additive change (doesn't modify existing atomic logic)
5. **Complexity:** Simple UPDATE vs. complex JSONB subquery in CASE statement
6. **Transactionality:** Can be made atomic with repository refactor
7. **Idempotency:** Fully idempotent on both paths
8. **Universal Architecture:** No cross-domain coupling

### Implementation Plan

**Phase 1: Add Synchronization (Sequential)**
1. Add `BlockLearningStateRepository.syncCompletedAt()`
2. Modify `LearningProgressService.recordBlockCompletion()` to call it
3. Run Phase D tests → expect LE-7a, SS-5, SS-6, CS-4 to pass

**Phase 2: Backfill Historical Data**
1. Create migration to sync existing completions
2. Validate all existing `completed_blocks[]` have corresponding `completedAt`

**Phase 3: Transactional Hardening (Optional)**
1. Refactor repositories to accept transaction context
2. Wrap both writes in single transaction

### Acceptance Criteria

- [ ] recordBlockCompletion() synchronizes `completedAt`
- [ ] syncCompletedAt() is idempotent
- [ ] Phase D LE-7a passes (revisionCount = 1)
- [ ] Phase D SS-5, SS-6 pass (multi-session revision tracking)
- [ ] Phase D CS-4 passes (concurrent completion + visit)
- [ ] Historical data backfill migration created
- [ ] No D1/C1/X1-specific logic introduced
- [ ] No changes to revision SQL logic
- [ ] Universal architecture preserved

---

## Decision Required

**Before proceeding with implementation, confirm:**

1. Is Option A (synchronization) the correct architectural choice?
2. Should synchronization be sequential (Phase 1) or transactional (Phase 3)?
3. Should backfill migration run immediately or deferred?
4. Are there any other completion sources that need synchronization?

**Status:** 🔴 AWAITING USER DECISION

---

## Appendix: Test Evidence

### Diagnostic Results (scripts/_gate_3c1r_diagnose_completion_revision.ts)

```
✅ CHECK 1: User exists
✅ CHECK 2: Navigation node exists
✅ CHECK 3: Subtopic exists
✅ CHECK 4: Section exists (real)
✅ CHECK 5: Block D1 exists
✅ CHECK 6: Block C1 exists
✅ CHECK 7: Navigation progress initialized

SESSION A
✅ CHECK 8: Block visit recorded (visitCount = 1)
✅ CHECK 9: Block completion recorded
✅ CHECK 10: Completion in completed_blocks[]
✅ CHECK 11: Completion has blockId
✅ CHECK 12: Completion has blockVersion
✅ CHECK 13: Completion has completedAt
✅ CHECK 14: Block learning state exists
✅ CHECK 15: Visit count is 1
✅ CHECK 16: Session A stored
✅ CHECK 17: completedAt in block_learning_state (NULL) ❌

SESSION B
✅ CHECK 18: Second visit recorded
✅ CHECK 19: Visit count incremented (2)
✅ CHECK 20: Session changed (B)
❌ CHECK 21: Revision count is 0 (expected 1)
✅ CHECK 22: Completion still in completed_blocks[]
```

**Result:** 21/22 checks passed, 1 critical failure (revision count)

### Phase D Lifecycle Tests (scripts/_gate_3c1r_test_phase_d_lifecycle.ts)

**Write Operations (WR-1 to WR-7):** 7/7 PASS  
**Lifecycle Evolution (LE-1 to LE-7):**
- LE-1 to LE-6: 6/6 PASS
- LE-7a (Revision after completion): ❌ FAIL (revisionCount expected 1, got 0)

**Blocked Scenarios:**
- LE-7a: Revision after completion
- SS-5: Multi-session revision accumulation
- SS-6: Completion timing across sessions
- CS-4: Concurrent completion + visit

**Total:** 26/27 assertions passed in lifecycle tests, 4 scenarios blocked

---

## Appendix: Source References

**Schema Definition:**
- File: `packages/db-tutorial/src/schema/block-learning-state.ts`
- Lines: 26-28 (completedAt comment)

**Migration:**
- File: `packages/db-tutorial/migrations/0023_lame_deathbird.sql`
- Line: 12 (`completed_at timestamp`)

**Completion Service:**
- File: `packages/db-tutorial/src/services/learning-progress.service.ts`
- Function: `recordBlockCompletion()` (line 324)

**Revision Logic:**
- File: `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`
- Function: `upsert()` (lines 320-331)

**Navigation Progress:**
- File: `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts`
- Function: `markBlockCompleted()`

---

**Document Status:** COMPLETE  
**Next Action:** User architectural decision required  
**Phase D Status:** 🔴 BLOCKED
