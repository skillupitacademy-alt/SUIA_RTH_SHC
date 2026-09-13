# Gate 3C.1R Phase D — Pre-Execution Quality Audit Report

**Date:** 2026-09-12  
**Mode:** READ-ONLY INVESTIGATION  
**Status:** Test quality and contract validation complete

---

## EXECUTIVE SUMMARY

**Critical Issues Identified:** 5  
**Test Quality Issues:** 2  
**Contract Clarity Issues:** 1  
**Classification Issues:** 2  

**Recommendation:** **EXECUTION NOT YET AUTHORIZED**

**Required Actions:** Fix LE-3/LE-4 assertions, clarify completion contract, resolve ambiguous classifications

---

## ISSUE 1: LE-3 and LE-4 Use Unconditional Assertions (CRITICAL)

### Finding

```typescript
// File: scripts/_gate_3c1r_test_phase_d_lifecycle.ts

async function testLE3() {
  // ... completion call ...
  assert('LE-3', 'Completion call succeeds through TutorialNavigationProgressRepository', true);
}

async function testLE4() {
  // ... repeated completion ...
  assert('LE-4', 'Repeated completion is idempotent', true);
}
```

**Problem:**  
- Both assertions use `assert(..., true)` which **always passes**
- Tests only prove the service call did NOT throw
- Do NOT prove completion was persisted
- Do NOT prove idempotency (duplicate detection)

### Root Cause

Completion is stored in `tutorial_navigation_progress.completed_blocks[]` (JSONB array), not in `block_learning_state`.

LE-3 and LE-4 call `recordBlockCompletion()` but do not verify the persisted state.

### Impact

- LE-3 PASS is meaningless (only proves no exception)
- LE-4 PASS is meaningless (does not prove idempotency)
- Cannot trust LE-3/LE-4 as evidence of completion correctness

### Required Fix

**LE-3 should assert:**
```typescript
// Read tutorial_navigation_progress
const progress = await progressRepository.getProgress(userId, navigationNodeId);
const completedBlocks = progress.completedBlocks ?? [];

// Verify completion persisted
const found = completedBlocks.find(
  (record) => record.blockId === blockId && record.blockVersion === blockVersion
);

assert('LE-3', 'Completion persisted in completed_blocks[]', found !== undefined);
assert('LE-3a', 'Completion timestamp set', found?.completedAt !== null);
```

**LE-4 should assert:**
```typescript
// Before second completion
const beforeCount = (progress1.completedBlocks ?? []).length;

// After second completion
const afterCount = (progress2.completedBlocks ?? []).length;

// Verify no duplicate
assertEqual('LE-4', 'Repeated completion does not duplicate record', afterCount, beforeCount);
```

### Classification

**Issue Type:** CRITICAL TEST QUALITY DEFECT

**Status:** **BLOCKS EXECUTION** until fixed

**Affected Scenarios:** LE-3, LE-4 (2 of 14 lifecycle tests)

---

## ISSUE 2: Completion Contract and Revision Logic Disconnect (CRITICAL)

### Finding

**Completion Storage** (verified):
```typescript
// File: tutorial-navigation-progress.repository.ts
// Completion stored in: tutorial_navigation_progress.completed_blocks[]
completedBlocks: [
  { blockId, blockVersion, completedAt }
]
```

**Revision Logic** (verified):
```typescript
// File: block-learning-state.repository.ts (Line 318)
revisionCount: data.lastSessionId
  ? sql`
      CASE
        WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
          AND ${blockLearningState.completedAt} IS NOT NULL
        THEN ${blockLearningState.revisionCount} + 1
        ELSE ${blockLearningState.revisionCount}
      END
    `
  : blockLearningState.revisionCount,
```

**Disconnect:**
- Completion stored in: `tutorial_navigation_progress.completed_blocks[]`
- Revision checks: `block_learning_state.completedAt IS NOT NULL`
- **`completedAt` is NEVER populated** in `block_learning_state`

### Authoritative Sources

**Completion Authority:**
- `tutorial_navigation_progress.completed_blocks[]` is the single source of truth
- Atomic JSONB operations ensure idempotency
- Keyed by: `(userId, navigationNodeId)` + array of `{blockId, blockVersion, completedAt}`

**Revision Authority:**
- SQL in `block_learning_state.repository.ts` checks `completedAt IS NOT NULL`
- But `completedAt` column never written by `recordBlockCompletion()`
- Field remains `NULL` even after completion

### Impact on Phase D Scenarios

| Scenario | Expected Behavior | Actual Behavior | Status |
|----------|-------------------|-----------------|--------|
| **LE-7** | visitCount=2, revisionCount=1 | visitCount=2, **revisionCount=0** | ❌ FAILS |
| **LE-7a** | revisionCount=1 after completion+new session | revisionCount=0 | ❌ FAILS |
| **SS-5** | revisionCount=1 (new session after completion) | revisionCount=0 | 🔴 BLOCKED |
| **SS-6** | revisionCount=0 (same session after completion) | Cannot test (depends on SS-5) | 🔴 BLOCKED |
| **CS-4** | Concurrent revision atomicity | Cannot test (depends on revision working) | 🔴 BLOCKED |

### Architectural Questions

1. **Is `block_learning_state.completedAt` intentionally unused?**
   - Schema comment (commit fe005a51) says: "Denormalized from completed_blocks[]"
   - Suggests original intent was synchronization
   - Current implementation: never synchronized

2. **Should revision query `completed_blocks[]` instead?**
   - Would require joining `tutorial_navigation_progress` during block visit
   - Complex query: check if blockId+blockVersion in JSONB array
   - Performance implications

3. **Is revision semantics out of scope for Phase D?**
   - Original audit report included revision as mandatory
   - But implementation never completed
   - Decision: defer or fix?

### Resolution Options (unchanged from Sept 10)

**Option A:** Synchronize `completedAt` during `recordBlockCompletion()`
```typescript
// Also write to block_learning_state
await blockLearningStateRepository.upsert({
  userId, navigationNodeId, blockId, blockVersion,
  completedAt: now
});
```

**Option B:** Change revision SQL to query `completed_blocks[]`
```sql
-- Complex subquery or lateral join
WHERE EXISTS (
  SELECT 1 FROM tutorial_navigation_progress
  WHERE userId = ? AND navigationNodeId = ?
  AND completed_blocks @> '[{"blockId": ?, "blockVersion": ?}]'
)
```

**Option C:** Defer revision feature (accept limitation)
- Mark LE-7a, SS-5, SS-6, CS-4 as N/A
- Document: "Revision counting deferred to future phase"
- Accept 30/34 scenarios instead of 34/34

### Classification

**Issue Type:** ARCHITECTURAL CONTRACT DEFECT

**Status:** **BLOCKS 4 SCENARIOS** (LE-7a, SS-5, SS-6, CS-4)

**User Decision Required:** Choose Option A, B, or C

---

## ISSUE 3: SS-5 and SS-6 Semantic Contract Clarity

### Finding

**SS-5 Test:**
```typescript
// Session A: visit → complete
// Session B: revisit
// Expected: revisionCount = 1
```

**SS-6 Test:**
```typescript
// Session A: visit → complete → revisit
// Expected: revisionCount = 0 (no session change)
```

### Contract Ambiguity

**Question:** How does `recordBlockVisit()` know block was completed?

**Answer (verified from code):**
- `recordBlockVisit()` calls `BlockLearningStateRepository.upsert()`
- Revision SQL checks: `block_learning_state.completedAt IS NOT NULL`
- **Does NOT query `tutorial_navigation_progress.completed_blocks[]`**

**Therefore:**
- SS-5 and SS-6 tests assume revision logic reads completion state
- Current implementation: revision logic reads `completedAt` (always NULL)
- Tests cannot pass without fixing Issue 2

### Semantic Rule (verified from code comments)

```typescript
// File: learning-progress.service.ts (Line 253)
// - New session + completed block: revisionCount + 1
```

**Rule is implemented**, but completion flag is never set, so rule never triggers.

### Classification

**Issue Type:** CONTRACT CLARITY (depends on Issue 2)

**Status:** Clarified (tests are correct, implementation is incomplete)

**Resolution:** Fix Issue 2, then SS-5/SS-6 become executable

---

## ISSUE 4: Test Harness Exit Code Behavior (VERIFIED SAFE)

### Investigation

**Test Harness Code:**
```typescript
// File: _gate_3c1r_phase_d_test_utils.ts

export function printSummary(groupName: string): void {
  const passed = results.filter(result => result.passed).length;
  const failed = results.filter(result => !result.passed).length;

  // ...

  if (failed > 0) {
    process.exitCode = 1;  // ✅ Sets nonzero exit on failure
  }
}
```

**Assertion Behavior:**
```typescript
export function fail(...) {
  results.push({ ..., passed: false });  // ✅ Records failure
  console.error(`❌ FAIL: ...`);
  // Does NOT throw, continues execution
}
```

**Test Structure:**
```typescript
async function main() {
  try {
    await testWR1();
    await testWR2();
    // ...
    printSummary('LIFECYCLE (WR + LE)');  // ✅ Checks results[]
  } catch (error) {
    console.error('\n❌ LIFECYCLE TEST SUITE FAILED');
    process.exitCode = 1;  // ✅ Also sets nonzero on exception
  }
}
```

### Finding

✅ **Test harness is SAFE:**
- Assertions record failures in `results[]` array
- `printSummary()` checks `results[]` and sets `process.exitCode = 1`
- Exceptions also caught and set nonzero exit
- One failed assertion will NOT be hidden

✅ **Exit code behavior correct:**
- Any failure → `process.exitCode = 1`
- CI/scripts can detect failure reliably

### Classification

**Issue Type:** NONE (verified safe)

**Status:** NO ACTION REQUIRED

---

## ISSUE 5: Ambiguous Scenario Classifications

### SS-3 — RESOLVED AS NORMATIVE

**Assertions:**
```typescript
assertEqual('SS-3', 'Session transition increments visit count', state?.visitCount, 2);
assertEqual('SS-3a', 'Latest session is persisted', state?.lastSessionId, sessionB);
```

**WR-4 Coverage:**
```typescript
assertEqual('WR-4', 'New session increments visitCount', state?.visitCount, 2);
assertEqual('WR-4a', 'New session does not create revision before completion', state?.revisionCount, 0);
```

**Finding:**
- SS-3 has TWO normative assertions
- WR-4 does NOT verify `lastSessionId`
- SS-3a is **NOT covered** by existing evidence

**Classification:** `REQUIRES_TARGETED_EXECUTION`

---

### DC-5 and DC-6 — SECONDARY ASSERTIONS IDENTIFIED

**DC-5 Assertions:**
```typescript
assertEqual('DC-5a', 'Soft-deleted record excluded from active queries', afterDelete, undefined);
assertEqual('DC-5b', 'New active record created after soft delete', afterRecreate?.visitCount, 1);
```

**Phase C C1.6 Coverage:**
- ✅ Tests DC-5a (soft-delete filtering)
- ❌ Does NOT test DC-5b (recreation after soft-delete)

**DC-5b Normative Status:**
- Tests **partial unique index** behavior: `WHERE deletedAt IS NULL`
- Allows duplicate identity after soft-delete
- Database constraint verification, not edge case

**DC-6 Assertions:**
```typescript
assertEqual('DC-6', 'Missing record returns undefined', beforeCreate, undefined);
assertEqual('DC-6a', 'Record created successfully', afterCreate?.visitCount, 1);
```

**Phase C C1.7 Coverage:**
- ✅ Tests DC-6 (missing record query)
- ❌ Does NOT test DC-6a (creation after missing query)

**DC-6a Normative Status:**
- Tests **state consistency**: missing query does not corrupt state
- Subsequent writes succeed
- State-consistency verification

**Classification:**
- DC-5: `PARTIALLY_COVERED` (primary covered, secondary normative but untested)
- DC-6: `PARTIALLY_COVERED` (primary covered, secondary is consistency check)

**Recommendation:**
- If DC-5b/DC-6a deemed essential: Execute DC-5 and DC-6
- If deemed verification-only: Exclude from target set with justification

**User Decision Required:** Are DC-5b and DC-6a normative?

---

### DC-1 and DC-2 — WRITE ISOLATION VALIDATED

**DC-1 Requirements (verified from code):**
```typescript
// Two users BOTH write
assertEqual('DC-1', 'User 1 has independent state', state1?.visitCount, 1);
assertEqual('DC-1a', 'User 2 has independent state', state2?.visitCount, 1);
assert('DC-1b', 'User 1 userId matches', state1?.userId === user1Id);
assert('DC-1c', 'User 2 userId matches', state2?.userId === user2Id);
```

**Phase C C1.4:**
```typescript
// Only TEST_USER writes, otherUser queries
assert(otherUserStates.length === 0, 'Other user must not see test user telemetry');
```

**Finding:**
- Phase C tests **read isolation** (user2 cannot see user1's data)
- Phase D tests **write isolation** (both users write independently + verify keys)
- 4 assertions in Phase D vs 1 in Phase C
- Write independence NOT proven by read-only test

**Classification:** `PARTIALLY_COVERED` (read isolation proven, write independence required)

**Recommendation:** Execute DC-1 and DC-2

---

## CORRECTED SCENARIO MATRIX

### Final Count Model

```
Total Phase D scenarios: 34

Category A — Already executed and passed:
  WR-1 to WR-7: 7 scenarios ✅
  LE-1, LE-2, LE-5, LE-6: 4 scenarios ✅
  Total: 11 scenarios

Category B — Executed with defective assertions:
  LE-3: 1 scenario (unconditional assertion)
  LE-4: 1 scenario (unconditional assertion)
  Total: 2 scenarios (REQUIRE FIX before accepting)

Category C — Executed and failed:
  LE-7: 1 scenario (includes failed assertion LE-7a)

Category D — Blocked by LE-7 failure:
  SS-5, SS-6, CS-4: 3 scenarios
  (all depend on revision logic)

Category E — Covered by existing evidence:
  SS-1 (covered by WR-1): 1 scenario ✅
  SS-2 (covered by WR-3): 1 scenario ✅
  SS-4 (covered by WR-4): 1 scenario ✅
  DC-3 (covered by Phase C C1.1-C1.3): 1 scenario ✅
  Total: 4 scenarios

Category F — Partially covered (user decision needed):
  DC-1 (C1.4 read-only): 1 scenario
  DC-2 (C1.5 read-only): 1 scenario
  DC-5 (C1.6 missing recreation): 1 scenario
  DC-6 (C1.7 missing creation): 1 scenario
  Total: 4 scenarios

Category G — Genuinely unverified:
  SS-3: 1 scenario (lastSessionId not verified)
  CS-1, CS-2, CS-3, CS-5, CS-6, CS-7: 6 scenarios
  DC-4, DC-7: 2 scenarios
  Total: 9 scenarios

Total: 11 + 2 + 1 + 3 + 4 + 4 + 9 = 34 ✓
```

---

## EXECUTION READINESS ASSESSMENT

### Blockers

1. **LE-3/LE-4 defective assertions** → MUST FIX before execution
2. **Revision contract defect** → USER DECISION REQUIRED (Option A/B/C)
3. **Ambiguous normative scope** → USER DECISION REQUIRED (DC-5b/DC-6a, DC-1/DC-2)

### Conservative Provisional Target Set

**If all ambiguous scenarios deemed normative:**

13 scenarios (after fixing LE-3/LE-4):
1. LE-3 (fixed assertion)
2. LE-4 (fixed assertion)
3. SS-3
4. CS-1, CS-2, CS-3, CS-5, CS-6, CS-7 (6 scenarios)
5. DC-1, DC-2, DC-4, DC-5, DC-6, DC-7 (6 scenarios)

**Prerequisites:**
- Fix LE-3/LE-4 assertions
- User confirms: DC-5b/DC-6a/DC-1/DC-2 are normative

### Aggressive Minimal Target Set

**If secondary assertions deemed non-normative:**

7 scenarios:
1. SS-3 (if lastSessionId critical)
2. CS-1, CS-2, CS-3, CS-5, CS-6, CS-7 (6 concurrency scenarios)
3. DC-4 (version isolation, genuinely new)

**Excluded:**
- LE-3/LE-4 (fix deferred, or accept as verification-only)
- DC-1/DC-2 (read isolation sufficient)
- DC-5/DC-6 (primary assertions covered)
- DC-7 (identity boundary, not database isolation)

### Phase D Verdict Scenarios

**If Option C chosen (defer revision):**
- Executable: 30 scenarios (34 - 4 blocked)
- After execution: 30/30 = **YELLOW** verdict
- Caveat: "Revision feature deferred to future phase"

**If Option A/B chosen (fix revision):**
- Must implement fix
- Must re-execute LE-7
- Must execute SS-5, SS-6, CS-4
- After execution: 34/34 = **GREEN** verdict possible

---

## RECOMMENDATIONS

### Immediate Actions Required

1. **Fix LE-3 and LE-4 assertions**
   - Read `tutorial_navigation_progress.completed_blocks[]`
   - Assert completion persisted
   - Assert idempotency (no duplicate records)

2. **User Decision: Revision Contract**
   - Choose Option A, B, or C
   - If Option A/B: Implement fix, add to Phase D scope
   - If Option C: Accept 30/34, mark revision as deferred

3. **User Decision: Ambiguous Scenarios**
   - DC-5b/DC-6a: Normative or verification-only?
   - DC-1/DC-2: Write isolation required or read sufficient?
   - DC-7: Identity boundary essential or optional?

### Execution Authorization

**CANNOT authorize execution until:**
- ✅ LE-3/LE-4 assertions fixed
- ✅ Revision decision made
- ✅ Ambiguous scenarios classified

**Current Status:** `FURTHER_RECONCILIATION_REQUIRED`

---

## ADDITIONAL FINDINGS

### DC-7 Identity Boundary Clarification

**Test Comment:**
```typescript
// Brand isolation is enforced via user identity (no brand column in telemetry table)
```

**Assertion:**
```typescript
assert('DC-7b', 'Brand isolation enforced through authenticated identity boundary',
  rthState?.userId !== skillupState?.userId
);
```

**Finding:**
- DC-7 tests **identity separation**, not database brand isolation
- No `brand` column in `block_learning_state` table
- Brand is authentication boundary, not database dimension
- Test proves: different users have different telemetry (expected)

**Recommendation:**
- Reframe DC-7 as "Cross-brand identity separation" (not database isolation)
- Essential if brand-scoped user identity is security requirement
- Optional if user identity already proven isolated (DC-1 covers this)

### No Duplicate Script Files

**Verification:**
- Only one copy of each Phase D test script exists
- No conflicting duplicates found in repository
- Scripts correctly organized in `scripts/` directory

---

## UBRC BOUNDARY CONFIRMATION

**UBRC work was NOT started during this audit.**

No UBRC:
- ❌ Contract definition
- ❌ Architecture audit
- ❌ Implementation
- ❌ Certification tests

**UBRC remains downstream of:**
1. Phase D execution
2. LE-7a resolution
3. Phase D verdict
4. User authorization

---

## AUDIT CONCLUSION

**Test Quality:** GOOD (except LE-3/LE-4)  
**Contract Clarity:** MOSTLY CLEAR (revision contract incomplete)  
**Test Coverage:** COMPREHENSIVE (34 scenarios well-structured)  
**Execution Readiness:** **NOT YET READY**

**Required Before Execution:**
1. Fix LE-3/LE-4 assertions
2. User decision on revision contract
3. User decision on ambiguous scenarios

**After Resolutions:**
- Can execute 7-13 scenarios (depending on decisions)
- Phase D verdict depends on revision decision:
  - Option C → YELLOW (30/30 applicable)
  - Option A/B → GREEN possible (34/34)

---

**Status:** PRE-EXECUTION AUDIT COMPLETE ✅  
**Next Phase:** User decisions required  
**Execution Authorization:** PENDING

---

**End of Pre-Execution Audit Report**
