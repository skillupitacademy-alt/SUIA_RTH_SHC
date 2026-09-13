# Gate 3C.1R Phase D — Architectural Decision Required

**Date:** 2026-09-10  
**Status:** 🔴 BLOCKED — Awaiting User Decision  
**Phase C:** ✅ GREEN (FROZEN)  

---

## What Has Been Accomplished

### ✅ Diagnostic Complete (22 Checks)

**File:** `scripts/_gate_3c1r_diagnose_completion_revision.ts`

**Results:** 21/22 checks passed

**Critical Finding:**
```
SESSION A:
- recordBlockVisit() ✅
- recordBlockCompletion() ✅
- Completion in completed_blocks[] ✅
- block_learning_state.completedAt: NULL ❌

SESSION B:
- recordBlockVisit() ✅
- visitCount: 1 → 2 ✅
- lastSessionId: A → B ✅
- revisionCount: 0 (expected 1) ❌
```

**Conclusion:** Completion authority (`completed_blocks[]`) is disconnected from revision prerequisite (`completedAt`)

---

### ✅ Architectural Analysis Complete

**File:** `.analysis/phase-d-completion-revision-architecture-options.md`

**Contents:**
- Confirmed production facts
- Current data flow documentation
- Historical architecture evidence (git history + schema comments)
- Option A: Synchronize `completedAt` (denormalize, matches original intent)
- Option B: Revision consumes `completed_blocks[]` authority (single source of truth)
- Comparison matrix (12 criteria)
- Universal architecture impact analysis
- Transaction/concurrency/idempotency analysis
- Migration requirements
- Performance analysis
- **Recommendation:** Option A

**Key Evidence:**

Original schema comment (commit fe005a51):
```typescript
/**
 * - completedAt: Denormalized completion timestamp
 *   (authoritative source: tutorial_navigation_progress.completed_blocks)
 */
```

This proves **Option A was the original architectural intent**.

---

### ✅ Phase D Test Harness Created (34 Scenarios)

**Files Created:**
1. `_gate_3c1r_phase_d_test_utils.ts` — Shared utilities
2. `_gate_3c1r_test_phase_d_lifecycle.ts` — WR + LE (14 scenarios)
3. `_gate_3c1r_test_phase_d_sessions.ts` — SS (6 scenarios)
4. `_gate_3c1r_test_phase_d_concurrency.ts` — CS (7 scenarios)
5. `_gate_3c1r_test_phase_d_consistency.ts` — DC (7 scenarios)
6. `_gate_3c1r_test_phase_d_all.ts` — Master runner

**Scenario Breakdown:**

| Category | Total | Verified | Blocked | Pending |
|----------|-------|----------|---------|---------|
| Write Operations (WR) | 7 | 7 | 0 | 0 |
| Lifecycle Evolution (LE) | 7 | 6 | 1 | 0 |
| Session Semantics (SS) | 6 | 0 | 2 | 4 |
| Concurrency (CS) | 7 | 0 | 1 | 6 |
| Data Consistency (DC) | 7 | 0 | 0 | 7 |
| **TOTAL** | **34** | **13** | **4** | **17** |

---

### ✅ Lifecycle Tests Executed (26/27 Assertions Passed)

**File:** `scripts/_gate_3c1r_test_phase_d_lifecycle.ts`

**Write Operations (WR):** 7/7 ✅
- WR-1: recordBlockVisit() initializes
- WR-2: recordBlockActiveTime() accumulates
- WR-3: recordBlockCompletion() persists
- WR-4: Multiple visits
- WR-5: Multiple active time increments
- WR-6: Visit + active time
- WR-7: Completion after visit

**Lifecycle Evolution (LE):** 6/7 ✅, 1 ❌
- LE-1: Initial state ✅
- LE-2: First visit → active time ✅
- LE-3: Active time → completion ✅
- LE-4: Active time accumulation ✅
- LE-5: Visit without completion ✅
- LE-6: Multiple visits before completion ✅
- **LE-7a: Completion → revision ❌** (revisionCount expected 1, got 0)

---

## Blocked Scenarios (4 of 34)

### LE-7a: Revision After Completion
**Test:** Session A visit → complete → Session B visit  
**Expected:** `revisionCount = 1`  
**Actual:** `revisionCount = 0`  
**Reason:** `block_learning_state.completedAt` is NULL

### SS-5: New Session After Completion
**Test:** Session A complete → Session B visit  
**Expected:** Revision increments  
**Reason:** Same as LE-7a

### SS-6: Same Session After Completion
**Test:** Session A complete → Session A revisit  
**Expected:** `revisionCount = 0` (no session change)  
**Reason:** Tests revision condition (depends on LE-7a working)

### CS-4: Concurrent Revision Atomicity
**Test:** Complete → 10 concurrent revisits in new session  
**Expected:** `revisionCount = 1` (atomic deduplication)  
**Reason:** Depends on completion synchronization

---

## The Architectural Gap

### What the Code Does

**Completion writes to:**
```
tutorial_navigation_progress.completed_blocks[]
    {blockId, blockVersion, completedAt}
```

**Revision checks:**
```sql
CASE
  WHEN session changed
    AND block_learning_state.completedAt IS NOT NULL
  THEN increment revision
END
```

**The problem:**
- Authoritative completion: `completed_blocks[]` ✅
- Revision prerequisite: `block_learning_state.completedAt` ❌ (never set)

### What Was Intended

Schema documentation says:
```typescript
completedAt: timestamp // Denormalized from completed_blocks
```

**Original Intent:** `completedAt` should be synchronized when completion recorded.

**Implementation Status:** Synchronization never built.

---

## Two Architectural Options

### Option A: Synchronize completedAt (Recommended)

**What:**
```typescript
recordBlockCompletion() {
  // Write 1: Authoritative
  await progressRepository.markBlockCompleted(event);
  
  // Write 2: Denormalized (NEW)
  await blockLearningStateRepository.syncCompletedAt(
    userId, navigationNodeId, blockId, blockVersion, completedAt
  );
}
```

**Pros:**
- Matches original schema intent ("denormalized")
- No change to revision SQL (already correct)
- Clear repository ownership
- Performance: no JOIN on read path
- Can backfill historical data

**Cons:**
- Dual persistence (completion in two places)
- Must guarantee synchronization consistency
- +1 UPDATE per completion

**Recommended:** ✅ YES

---

### Option B: Revision Queries completed_blocks[]

**What:**
```sql
CASE
  WHEN session changed
    AND EXISTS (
      SELECT 1 FROM tutorial_navigation_progress
      WHERE completed_blocks @> '[{"blockId": "..."}]'
    )
  THEN increment revision
END
```

**Pros:**
- Single source of truth
- No synchronization needed

**Cons:**
- +1 subquery on EVERY visit (not just revisions)
- Performance: JSONB query + JOIN on read path
- Repository coupling (block state queries navigation state)
- Complex SQL (JSONB path query in CASE statement)

**Recommended:** ❌ NO

---

## Why Option A is Recommended

1. **Historical Intent:** Schema explicitly documents denormalization
2. **Performance:** Reads (visits) called 100x more than writes (completions)
3. **Repository Design:** Maintains clear ownership boundaries
4. **Regression Risk:** Additive change (doesn't modify existing atomic logic)
5. **Simplicity:** Simple UPDATE vs complex JSONB subquery
6. **Universal Architecture:** No cross-domain coupling

**See:** `.analysis/phase-d-completion-revision-architecture-options.md` (full analysis)

---

## What Needs To Happen Next

### User Must Decide

**Question:** Should we implement Option A (synchronize) or Option B (query)?

**Recommendation:** Option A

**Decision Factors:**
- Performance tradeoffs (write cost vs read cost)
- Repository ownership principles
- Transaction coordination complexity
- Migration requirements
- Universal architecture preservation

---

### After Decision: Option A Implementation

**Step 1: Add Synchronization**
```typescript
// BlockLearningStateRepository
async syncCompletedAt(
  userId: string,
  navigationNodeId: string,
  blockId: string,
  blockVersion: string,
  completedAt: Date
): Promise<void> {
  await this.db.update(blockLearningState)
    .set({ completedAt, updatedAt: new Date() })
    .where(/* identity match */)
    .execute();
}

// LearningProgressService.recordBlockCompletion()
await this.progressRepository.markBlockCompleted(event);
await this.blockLearningStateRepository.syncCompletedAt(...); // NEW
```

**Step 2: Backfill Migration**
```sql
UPDATE block_learning_state bls
SET completed_at = (
  SELECT (jsonb_array_elements(tnp.completed_blocks) ->> 'completedAt')::timestamp
  FROM tutorial_navigation_progress tnp
  WHERE /* identity match */
)
WHERE bls.completed_at IS NULL;
```

**Step 3: Verify**
- Re-run LE-7a (expect pass)
- Re-run SS-5, SS-6 (expect pass)
- Re-run CS-4 (expect pass)
- Run remaining 17 non-blocked scenarios
- **Phase D: GREEN**

---

### After Decision: Option B Implementation

**Step 1: Modify Revision SQL**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND EXISTS (
      SELECT 1 FROM tutorial_navigation_progress
      WHERE user_id = NEW.user_id
        AND navigation_node_id = NEW.navigation_node_id
        AND jsonb_path_exists(
          completed_blocks,
          '$ ? (@.blockId == $blockId && @.blockVersion == $blockVersion)'
        )
    )
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**Step 2: Add Index**
```sql
CREATE INDEX idx_completed_blocks_gin 
ON tutorial_navigation_progress 
USING GIN (completed_blocks);
```

**Step 3: Performance Test**
- Measure subquery impact on visit operations
- Test with large `completed_blocks[]` arrays
- Verify acceptable performance

**Step 4: Verify**
- Re-run LE-7a, SS-5, SS-6, CS-4
- Run remaining 17 scenarios
- **Phase D: GREEN** (if performance acceptable)

---

## What Can Proceed Now (Without Decision)

### Executable Non-Blocked Scenarios (17)

**Session Semantics (4 non-blocked):**
- SS-1: NULL → first session
- SS-2: A → A (deduplication)
- SS-3: A → B (transition)
- SS-4: New session before completion

**Concurrency (6 non-blocked):**
- CS-1: Concurrent same-session visits
- CS-2: Concurrent active-time updates
- CS-3: Concurrent different-session visits
- CS-5: Concurrent visit + active time
- CS-6: Concurrent independent blocks
- CS-7: Concurrent identity isolation

**Data Consistency (7 non-blocked):**
- DC-1: User isolation
- DC-2: Navigation node isolation
- DC-3: Block ID isolation
- DC-4: Block version isolation
- DC-5: Soft-delete behavior
- DC-6: Missing record behavior
- DC-7: Brand/identity boundary

**These tests provide additional Phase D evidence while awaiting architectural decision.**

---

## What Cannot Proceed (Prohibited)

### DO NOT (until user decision):

1. ❌ Implement Option A
2. ❌ Implement Option B
3. ❌ Modify `LearningProgressService`
4. ❌ Modify `BlockLearningStateRepository`
5. ❌ Change revision SQL
6. ❌ Create migrations
7. ❌ Unfreeze Phase C
8. ❌ Declare Phase D GREEN or YELLOW
9. ❌ Accept 30/34 as "passing with qualification"
10. ❌ Mark LE-7a, SS-5, SS-6, CS-4 as "out of scope"
11. ❌ Delete blocked scenario tests
12. ❌ Weaken blocked scenario assertions

---

## Current Phase Status

### Phase C: ✅ GREEN (FROZEN)
- Commits: 776f11fb → 13030534
- Universal block read contracts implemented
- No modification authorized

### Phase D: 🔴 BLOCKED
- **Verified:** 13/34 scenarios (7 WR + 6 LE)
- **Blocked:** 4/34 scenarios (1 LE + 2 SS + 1 CS)
- **Pending:** 17/34 scenarios (4 SS + 6 CS + 7 DC)
- **Blocker:** Completion → revision synchronization gap
- **Status:** Awaiting architectural decision

### Database: ✅ RECONCILED
- Schema matches Drizzle/PostgreSQL
- 42P10 errors: CLEAR

---

## Why This is Success, Not Failure

Phase D has successfully:

1. ✅ **Identified architectural gap** before it propagated to ILS GUI/RSSB
2. ✅ **Preserved Phase C contract** (no modification needed)
3. ✅ **Isolated exact failure point** (1 field synchronization)
4. ✅ **Documented two solutions** with full tradeoff analysis
5. ✅ **Verified 85% of lifecycle semantics** work correctly
6. ✅ **Maintained universal architecture** (no D1/C1 branching)
7. ✅ **Prevented technical debt** from reaching production

**This is verification working as intended.**

Phase D exists to find gaps like this **before** we build higher layers on top of a broken foundation.

---

## Summary

**What Works:**
- Completion persistence ✅
- Session tracking ✅
- Visit counting ✅
- Active time tracking ✅
- Atomic SQL logic ✅
- Universal architecture ✅

**What's Blocked:**
- Revision counting ❌ (4 scenarios)

**Root Cause:**
- Incomplete denormalization (original intent not fully implemented)

**Solution:**
- Option A: Synchronize `completedAt` (recommended)
- Option B: Query `completed_blocks[]` (alternative)

**Next Action:**
- User chooses Option A or Option B
- Implementation proceeds
- Phase D completes
- ILS GUI/RSSB can begin on solid foundation

---

**Phase D Status:** 🔴 BLOCKED  
**Awaiting:** User architectural decision  
**Recommendation:** Option A (synchronize completedAt)  
**Analysis Complete:** ✅ YES  
**Production Changes Authorized:** ❌ NO (pending decision)

---

**Files Created:**
1. `.analysis/phase-d-lifecycle-semantics.md` — Semantic contract
2. `.analysis/phase-d-critical-finding-revision-blocker.md` — Initial finding
3. `.analysis/phase-d-completion-revision-architecture-options.md` — Full analysis ⭐
4. `.analysis/phase-d-current-status.md` — Detailed status
5. `.analysis/phase-d-completion-report-awaiting-decision.md` — This document

**Diagnostic Script:**
- `scripts/_gate_3c1r_diagnose_completion_revision.ts` (21/22 checks passed)

**Test Harness:**
- 6 test files created (34 scenarios total)
- 1 executed (WR + LE: 26/27 assertions passed)
- 5 pending (SS, CS, DC: 17 non-blocked scenarios ready)
