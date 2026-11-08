# FND13 Zero Vector Score Handling — Sol Clarification Request

**Date:** 2026-11-06
**Context:** FND13 Placement Truth Correction workflow paused at eea4e53f
**Reviewer Verdict:** CHANGES_REQUESTED (1 HIGH blocker)
**Branch:** remediation/w1-2-batch-05-targeted

---

## The Ambiguity

Three authoritative sources provide conflicting guidance on how to handle zero vector scores from the matching service:

### Source 1: Test Requirement (Location Unknown in Materials)
**States:** "Zero match → 0 returned"

### Source 2: Current Implementation
**File:** `apps/skillup-web/src/lib/skillup-data.ts:395-398`
**Code:**
```typescript
const matchScore = match.score !== null && match.score !== undefined && match.score > 0
  ? Math.round(match.score * 100)
  : null;
```
**Behavior:** Returns `null` for zero scores (rejects zero with `match.score > 0` condition)

### Source 3: Test Expectation
**File:** `apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts:369-371`
**Code:**
```typescript
// Currently returns null for zero (uncalibrated measurement)
// When calibration is established, zero would be a valid return value
expect(result.jobs[0].match).toBe(null);
```
**Behavior:** Test passes when zero returns `null`

### Source 4: Sol Decision (ebbd67e7)
**File:** `audit/FND13_Placement_Truth_Sol_Decision_e6121f40.md`
**Quote:** "Zero is a valid measured value when established, and must not be clamped to one."

---

## The Conflict

- **Implementation** currently treats zero as uncalibrated → returns `null`
- **Test** expects this behavior → asserts `null`
- **Test comment** suggests this is temporary: "When calibration is established, zero would be a valid return value"
- **Sol decision** says zero is valid when established
- **Unknown requirement** says zero should return `0`

---

## The Question

**Which behavior is authoritative for zero vector scores (match.score === 0)?**

### Option A: Zero Returns Null (Current Behavior)
**Interpretation:** Zero scores are currently uncalibrated/unproven. No measurement proof exists that vector similarity 0.00 corresponds to "0% match" in business terms.

**Implementation:** Keep current code (requires `> 0`)
**Test:** Keep current expectation (`null`)
**Contract:** "Zero match → null returned (uncalibrated until measurement proof established)"
**Future:** When calibration is proven, change implementation to allow zero

**Alignment:**
- ✓ Current implementation
- ✓ Current test
- ✓ Test comment "currently... uncalibrated"
- ? Sol decision: "when established" means "not yet established"

### Option B: Zero Returns 0 (Requirement Behavior)
**Interpretation:** Zero scores are valid measured values. Vector similarity 0.00 is a calibrated measurement meaning "0% match."

**Implementation:** Remove `&& match.score > 0` check
**Test:** Change expectation to `expect(result.jobs[0].match).toBe(0)`
**Contract:** "Zero match → 0 returned (valid measured value)"
**Rationale:** Vector service returns numeric zero as a legitimate result, not as "measurement unavailable"

**Alignment:**
- ✓ Unknown requirement document
- ✓ Sol decision "zero is valid when established"
- ✗ Current implementation
- ✗ Current test

---

## Impact Analysis

### If Option A (Null) is Correct
**Required Changes:**
1. Update requirement document: "Zero match → null returned"
2. Confirm Sol decision interpretation: "when established" means zero is NOT yet established
3. No code changes required
4. Approve current implementation

**Client Behavior:**
- Cannot distinguish "no profile" from "perfect mismatch" (both null)
- UI shows "Matching unavailable" for genuine zero matches
- Accurate if zero truly means "we don't know" vs "we measured zero"

### If Option B (Zero) is Correct
**Required Changes:**
1. Remove `&& match.score > 0` from condition (line 395)
2. Update test expectation: `.toBe(0)` instead of `.toBe(null)`
3. Update test comment: Remove "currently uncalibrated"
4. Code review and approve changes

**Client Behavior:**
- Distinguishes "no measurement" (null) from "zero match" (0)
- UI can show "0% match" vs "Matching unavailable"
- More precise information when vector service returns calibrated zero

---

## Technical Context

### What We Know About Vector Service
- Returns `score` field as a number between 0.0 and 1.0 (cosine similarity expected range)
- Can return 0.0 as a legitimate result (orthogonal vectors = no similarity)
- Implementation converts to percentage: `Math.round(score * 100)`
- Zero input would produce: `Math.round(0 * 100) = 0`

### What We Don't Know
- Whether the vector service's zero scores are "calibrated" in business terms
- Whether "0% similarity" maps to "0% job match" in the product model
- Whether the test requirement "Zero match → 0 returned" was written with proof of calibration

---

## Proposed Resolution Path

### Immediate Decision Required
**Question:** Should `match.score === 0` from the vector service return `0` or `null` in the API response?

**Decision Factors:**
1. Does vector similarity 0.00 represent a valid measurement (perfect mismatch)?
2. Or does zero mean "matching failed/unavailable" (like null/undefined)?
3. Should clients distinguish zero from null?

### If Uncertain
**Fallback:** Accept Option A (current behavior), document as "conservative interpretation pending calibration proof."

**Rationale:**
- Implementation and tests already aligned
- No client currently renders placement data (per consumer manifest)
- Can be revised when calibration is established
- Safer to withhold uncertain measurements than present uncalibrated numbers

---

## Recommendation

**Without access to the original requirement document's context,** I recommend **Option A (null)** because:

1. **Test comment explicitly states:** "currently uncalibrated"
2. **Implementation and tests are consistent:** Both treat zero as null
3. **Sol decision phrase:** "when established" suggests zero is NOT yet established
4. **No downstream consumers:** Breaking change has no immediate impact
5. **Conservative principle:** Withhold uncertain measurements rather than present unproven numbers

However, **if the vector service's zero scores are proven calibrated measurements,** then **Option B (zero)** is correct and should be implemented immediately.

---

## Requested Sol Action

Please provide one of the following:

**Decision A:**
> "Zero vector scores are uncalibrated. Return null. Approve current implementation. Update requirement document to match."

**Decision B:**
> "Zero vector scores are valid measurements. Return 0. Remove `> 0` check. Update test expectation."

**Decision C (If More Context Needed):**
> "Investigate vector service calibration proof. Provide evidence that score === 0 is/isn't a valid business measurement."

---

**Status:** Workflow paused awaiting Sol decision
**Next Step:** Implement clarified behavior and submit for approval
**Blocker:** Cannot proceed with group acceptance until zero handling is authoritative
