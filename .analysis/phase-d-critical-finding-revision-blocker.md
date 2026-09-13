# GATE 3C.1R — PHASE D: CRITICAL FINDING

## CONFIRMED PRODUCTION SEMANTIC MISMATCH: REVISION TRACKING

**Date:** 2026-09-10  
**Status:** 🔴 BLOCKED  
**Classification:** PRODUCTION_SEMANTIC_MISMATCH  
**Diagnostic:** scripts/_gate_3c1r_diagnose_completion_revision.ts

---

## EXECUTIVE SUMMARY

A comprehensive diagnostic has **confirmed** that the revision tracking feature cannot function with the current architecture. The repository's SQL logic checks `block_learning_state.completedAt IS NOT NULL`, but that field is never populated by the production completion path.

**Result:** Revision count remains 0 even after completion + new session transitions.

---

## DIAGNOSTIC EVIDENCE

### Test Sequence Executed:
1. ✅ Visit block in session A
2. ✅ Complete block using real `recordBlockCompletion()` with valid `sectionId`
3. ✅ Verify completion persisted
4. ✅ Revisit in new session B

### Observed State After Step 4:

**tutorial_navigation_progress.completed_blocks[]:**
```json
{
  "blockId": "gate-3c1r-phase-d-completion-1789058906687-fjogsh",
  "blockVersion": "D1",
  "completedAt": "2026-09-10T16:48:29.168Z"
}
```
✅ **Completion persisted correctly**

**block_learning_state:**
```
visitCount:      2  ← Session transition detected
revisionCount:   0  ← Expected 1, got 0
completedAt:     null  ← NEVER POPULATED
lastSessionId:   session-B  ← Session changed from A → B
```
❌ **Revision did not increment despite completion + new session**

---

## ROOT CAUSE ANALYSIS

### Completion Authority

The actual production completion path is:

```
LearningProgressService.recordBlockCompletion()
  ↓
TutorialNavigationProgressRepository.markBlockCompleted()
  ↓
tutorial_navigation_progress.completed_blocks[] (JSONB array)
```

**Result:** Completion is stored in `tutorial_navigation_progress` table, NOT in `block_learning_state`.

### Revision Condition

The repository's revision SQL logic (from source inspection):

```typescript
// BlockLearningStateRepository.upsert() lines 320-331
revisionCount: sql`
  CASE
    WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${newSessionId}
      AND ${blockLearningState.completedAt} IS NOT NULL
    THEN ${blockLearningState.revisionCount} + 1
    ELSE ${blockLearningState.revisionCount}
  END
`
```

**Required condition:** `completedAt IS NOT NULL` in `block_learning_state`

### The Disconnect

1. **Completion writes to:** `tutorial_navigation_progress.completed_blocks[]`
2. **Revision reads from:** `block_learning_state.completedAt`
3. **Current behavior:** `block_learning_state.completedAt` remains `null` forever
4. **Result:** Revision condition `completedAt IS NOT NULL` is **never true**

---

## PROOF OF SESSION TRANSITION

The diagnostic proves the session-aware logic IS working correctly:

| Metric | Session A (first) | Session A (repeat) | Session B (new) |
|--------|-------------------|-------------------|----------------|
| visitCount | 1 | 1 | 2 |
| lastSessionId | session-A | session-A | session-B |
| revisionCount | 0 | 0 | 0 |

**Conclusion:** Session detection works (visitCount incremented), but revision logic is blocked by missing `completedAt`.

---

## SEMANTIC CONTRACT

The Phase D semantic contract (documented in `.analysis/phase-d-lifecycle-semantics.md`) explicitly states:

> ### revisionCount
>
> **Increment condition:**
> ```
> revisionCount increments ONLY when:
>   1. Session changes (lastSessionId IS DISTINCT FROM newSessionId)
>   AND
>   2. Block is already completed (completedAt IS NOT NULL)
> ```

The contract is correct. The implementation has the logic. But **the prerequisite field is never populated**.

---

## CLASSIFICATION

**Type:** PRODUCTION_SEMANTIC_MISMATCH

This is NOT:
- ❌ Test bug (test uses correct fixtures and real APIs)
- ❌ Fixture problem (valid `sectionId` used)
- ❌ API failure (completion succeeded)
- ❌ Persistence failure (completion found in `completed_blocks[]`)

This IS:
- ✅ **Architectural gap** between completion authority and revision condition
- ✅ **Incomplete denormalization** (revision logic expects a field that completion doesn't populate)
- ✅ **Working SQL that checks non-working state**

---

## IMPACT ASSESSMENT

### Blocked Scenarios: 4 of 34

1. **LE-7a** — Complete lifecycle (expects revision after completion + new session)
2. **SS-5** — New session after completion (tests revision increment)
3. **CS-4** — Concurrent revision on completed block
4. **SS-6** — Same session after completion (expects no revision, logic broken but may coincidentally pass)

### Working Scenarios: 30 of 34

All other scenarios pass because they don't depend on completion-triggered revision:
- ✅ WR-1 through WR-7 (write-read without completion)
- ✅ SS-1 through SS-4 (session logic without completion)
- ✅ LE-1 through LE-6 (lifecycle without revision)
- ✅ CS-1, CS-2, CS-3, CS-5, CS-6, CS-7 (concurrency without revision)
- ✅ DC-1 through DC-7 (data consistency)

---

## OPTIONS FOR RESOLUTION

### Option 1: Denormalize `completedAt` into `block_learning_state`

**Implementation:**
Modify `recordBlockCompletion()` to also call:

```typescript
await this.blockLearningStateRepository.upsert({
  userId,
  navigationNodeId,
  blockId,
  blockVersion,
  completedAt: new Date(),
});
```

**Impact:**
- ⚠️ Changes Phase C frozen implementation
- ⚠️ PROHIBITED by Phase D rules
- ⚠️ Requires unfreezing Phase C
- ✅ Makes revision logic functional
- ✅ Maintains architectural intent

---

### Option 2: Change Revision Logic Source

**Implementation:**
Modify repository to query `tutorial_navigation_progress.completed_blocks[]` before upsert and use that result in revision CASE logic.

**Impact:**
- ⚠️ Architectural change (repository becomes cross-table aware)
- ⚠️ PROHIBITED by Phase D rules
- ⚠️ Performance implications (query before every upsert)
- ⚠️ Complexity increase

---

### Option 3: Remove Revision Logic

**Implementation:**
Remove the SQL CASE expression that checks `completedAt`.

**Impact:**
- ⚠️ Removes documented feature
- ⚠️ Breaking change to contract
- ⚠️ PROHIBITED by Phase D rules

---

### Option 4: Document as Known Limitation

**Implementation:**
Accept current behavior, document revision tracking as non-functional in Phase D report.

**Impact:**
- ✅ No code changes during frozen Phase D
- ⚠️ Phase D verdict: PASS WITH QUALIFICATION (30/34)
- ⚠️ Documented technical debt
- ❌ Feature remains broken

---

## RECOMMENDED ACTION

**STOP Phase D implementation at this checkpoint.**

Phase D rules explicitly prohibit:
- Modifying frozen Phase C production code
- Altering repository logic
- Changing database schema
- Redesigning completion architecture

The freeze prevents fixing this architectural gap during verification.

**Required User Decision:**

1. **Is revision tracking mandatory for Phase C/D completion?**
   - If YES → Unfreeze Phase C, implement Option 1, re-run Phase D
   - If NO → Accept Option 4, document limitation

2. **What is the priority of revision feature?**
   - Critical → Must fix before Phase D GREEN
   - Important → Can defer to Phase 4/5
   - Nice-to-have → Document as limitation

3. **What is the Phase D verdict threshold?**
   - Require 34/34 → Status remains BLOCKED
   - Accept 30/34 with qualification → Status becomes YELLOW
   - Revision out-of-scope → Status becomes GREEN with 30/30 applicable

---

## PHASE D STATUS IMPLICATIONS

### If Revision Is Mandatory:
```
PHASE D: 🔴 BLOCKED
Reason: 4 scenarios cannot pass with current architecture
Action: Unfreeze Phase C, implement denormalization, re-verify
```

### If Revision Can Be Deferred:
```
PHASE D: 🟡 PASS WITH QUALIFICATION
Passed: 30/34 scenarios (88.2%)
Blocked: 4/34 scenarios (revision-dependent)
Known Limitation: Revision tracking non-functional pending denormalization
Next Gate: Phase 4 must address revision before ILS GUI
```

### If Revision Is Out-of-Scope:
```
PHASE D: 🟢 GREEN
Passed: 30/30 applicable scenarios
Excluded: 4 scenarios marked out-of-scope
Documentation: Revision removed from Phase C/D contract
```

---

## NEXT STEPS

**AWAITING USER DECISION**

Do NOT:
- Continue Phase D implementation
- Modify production code
- Alter frozen Phase C
- Claim Phase D GREEN without addressing this finding

DO:
- Present this evidence to user
- Await explicit architectural decision
- Document decision in Phase D report
- Proceed based on user's priority/threshold guidance

---

## APPENDIX: DIAGNOSTIC OUTPUT

Full diagnostic execution available in:
- Script: `scripts/_gate_3c1r_diagnose_completion_revision.ts`
- Evidence: 21 checks passed, 1 critical check failed (E3: revision increment)
- Classification: CONFIRMED PRODUCTION SEMANTIC MISMATCH
- Exit Code: 1 (blocked status)
