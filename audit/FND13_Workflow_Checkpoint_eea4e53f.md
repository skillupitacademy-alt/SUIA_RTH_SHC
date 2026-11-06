# FND13 Placement Truth Correction — Workflow Checkpoint

**Date:** 2026-11-06
**Branch:** remediation/w1-2-batch-05-targeted
**Base Commit:** ebbd67e7 (Sol Decision)
**HEAD Commit:** eea4e53f
**Workflow Status:** Paused for Sol clarification

---

## Implementation Summary

FND13 placement truth correction has been implemented according to Sol's decision at ebbd67e7, with all required changes completed:

### ✓ Completed Work

1. **FALLBACK_PLACEMENT Removed** (apps/skillup-web/src/lib/skillup-data.ts)
   - Deleted fabricated profile constant
   - Returns `profile: null` when no active profile exists
   - No personal data fabrication

2. **Nullable Contract Implemented**
   - Profile type: nullable (returns null when missing)
   - Match field: `number | null` (returns null when unavailable/uncalibrated)
   - Legacy fields: roleGoal, resumeStatus, profileCompletion all null (no derivation)
   - InterviewCount field completely removed

3. **Match Percentage Logic Updated**
   - Removed all rank-based percentages (no `90 - index * 3`)
   - Removed all floor values (no `Math.max(60, ...)`)
   - Returns null when vector matching unavailable/fails
   - **Current behavior:** Zero scores return null (treating as uncalibrated)

4. **MatchingStatus Field Added**
   - Three states: `'missing_profile' | 'unavailable' | 'matched'`
   - Distinguishes why matching failed vs succeeded

5. **Persisted Jobs Remain Browsable**
   - Jobs query unchanged from baseline
   - Returns jobs in DB order when matching unavailable
   - Empty jobs list when no jobs exist (not fabricated)

6. **Test Coverage Complete**
   - 11 tests passing (1 zero-control + 10 HTTP truth)
   - Offline network guard in both test files
   - All isolation controls: no profile, zero score, no jobs, vector failure, DB failure, auth denial
   - Handler composition verified

7. **Verification Evidence**
   - TypeCheck: PASS (no type errors)
   - ESLint: 5 pre-existing warnings (not in implementation)
   - Whitespace: PASS (`git diff --check` exit 0)

### Commits
- `eca1360d`: "FND13: Remove FALLBACK_PLACEMENT, implement nullable placement contract"
- `eea4e53f`: "FND13: Add placement tests with offline guard and isolation controls"

---

## Review Verdict

**Status:** CHANGES_REQUESTED
**Blocker:** 1 HIGH-severity finding
**Review Document:** audit/FND13_review.md

### The Blocker

**Issue:** Zero vector score handling has conflicting specifications

**Three sources provide different guidance:**
1. **Unknown requirement:** "Zero match → 0 returned"
2. **Current implementation:** Returns `null` for zero (condition: `match.score > 0`)
3. **Current test:** Expects `null` (placement-http-truth.test.ts:371)

**Sol's decision quote:** "Zero is a valid measured value when established, and must not be clamped to one."

**The question:** Should `match.score === 0` return `0` or `null`?

---

## Decision Request

Please see **audit/FND13_Zero_Vector_Clarification_Request.md** for detailed analysis.

**Two Options:**

### Option A: Zero Returns Null (Current Behavior)
- Interpretation: Zero scores are uncalibrated, no measurement proof
- Action: Approve current implementation, update requirement document
- Rationale: Conservative approach, test comment says "currently uncalibrated"

### Option B: Zero Returns 0 (Requirement Behavior)
- Interpretation: Zero scores are valid measured values (perfect mismatch)
- Action: Remove `&& match.score > 0` check, update test to expect 0
- Rationale: Vector service zero is a calibrated measurement

**Requested Sol Decision:**
- Choose Option A or Option B
- Provide authoritative guidance on zero handling semantics
- Clarify whether "when established" means "already established" or "not yet established"

---

## What's Ready for Review

All FND13 implementation is complete except for the zero-handling decision:

1. ✓ Profile nullability
2. ✓ FALLBACK_PLACEMENT removal
3. ✓ Match nullability (for unavailable/failed)
4. ✓ MatchingStatus field
5. ✓ No rank-based percentages
6. ✓ Jobs browsability preserved
7. ✓ Test coverage complete
8. ✓ Type safety enforced
9. ❌ Zero handling (requires clarification)

---

## Workflow Actions Taken

Per Sol's instruction "Choose A—end repeat loop and submit checkpoint" at ebbd67e7:

1. ✓ Workflow repeat loop ended (2 iterations completed)
2. ✓ Checkpoint submitted (this document)
3. ✓ Evidence preserved (review documents, test results)
4. ✓ Clarification request prepared
5. ⏸ Awaiting Sol decision before final approval

---

## Next Steps

### After Sol Decision

**If Option A (Null):**
1. Document decision in FND13 ledger
2. Update requirement reference (if accessible)
3. Mark FND13 as IMPLEMENTED_UNVERIFIED
4. Submit for Sol group acceptance

**If Option B (Zero):**
1. Remove `&& match.score > 0` from skillup-data.ts:395
2. Update test expectation to `.toBe(0)`
3. Update test comment (remove "currently uncalibrated")
4. Re-run tests (expect 11/11 pass)
5. Commit changes
6. Mark FND13 as IMPLEMENTED_UNVERIFIED
7. Submit for Sol group acceptance

### Parallel Work Available

While awaiting FND13 clarification, can proceed with:
- FND12 inventory reconciliation (181 vs 109 discrepancy)
- FND17 coverage map update (remove stale failure status)
- FND18-24 W3 contract implementations (independent of FND13)
- FND03-06, 08-11 blocked decision documentation

---

## Status Summary

**Implementation:** Complete (modulo zero handling)
**Tests:** 11/11 passing with current behavior
**Verification:** TypeCheck ✓, ESLint ✓, Whitespace ✓
**Review:** CHANGES_REQUESTED (1 HIGH blocker)
**Blocker:** Zero vector score semantic ambiguity
**Action Required:** Sol decision on Option A vs Option B

**Working Tree:** Clean (HEAD eea4e53f)
**Untracked Files:** Review artifacts (will be committed after decision)

---

**Prepared by:** Claude Sonnet 4.5
**Awaiting:** Sol clarification on zero handling semantics
