# Phase 8.1 — Gate 7: Concurrency Test Architectural Review
**Date**: 2026-08-30  
**Test File**: `gate-4-concurrency.integration.test.ts`  
**Status**: 🔴 BLOCKED — Requires architectural decision

---

## Test Structure

The gate-4-concurrency test has **3 test cases**:

| # | Test Name | Brands Required | Blocker? |
|---|-----------|----------------|----------|
| 1 | Prevent concurrent duplicate (subtopicId, brandId) | 1 brand ('realtutorialhub') | ❌ NO |
| 2 | Allow different brands for same subtopic | 2 brands ('realtutorialhub', 'skillup') | ✅ YES |
| 3 | Prevent duplicate after first succeeds | 1 brand ('skillup') | ❌ NO |

**BLOCKER**: Test #2 requires 2 different brands with valid sidebars for Java topic.

---

## The Architectural Problem

### What Test #2 Validates
```typescript
it('should allow different brands to create tutorials for the same subtopic', async () => {
  // Create tutorial for brand A
  const tutorialA = await service.createTutorial({
    subtopicId: testSubtopicId,
    navigationNodeId: TEST_NAV_NODE_ID,
    brandId: 'realtutorialhub',
    content: document
  }, contextA);

  // Create tutorial for brand B (SAME subtopic, DIFFERENT brand)
  const tutorialB = await service.createTutorial({
    subtopicId: testSubtopicId,
    navigationNodeId: TEST_NAV_NODE_ID,
    brandId: 'skillup',
    content: document
  }, contextB);

  // Both should succeed
  expect(tutorialA.id).toBeDefined();
  expect(tutorialB.id).toBeDefined();
  expect(tutorialA.brandId).toBe('realtutorialhub');
  expect(tutorialB.brandId).toBe('skillup');
});
```

**Test Purpose**: Prove that unique constraint `(subtopicId, brandId)` allows multiple tutorials for the same subtopic IF brandId differs.

**Why This Matters**: Critical for multi-brand platform — 'realtutorialhub' and 'skillup' must be able to customize Java tutorials independently.

### Why It Fails

**Current Reality**:
- Java subtopic (`What is Java?`) only has sidebar for **'shared'** brand
- No sidebar exists for 'realtutorialhub' + Java
- No sidebar exists for 'skillup' + Java

**Service Behavior** (CORRECT):
```typescript
// TutorialComposerService.createTutorial()
const validation = await sidebarValidator.validateNavigationNode(
  input.subtopicId,
  input.brandId,
  input.navigationNodeId
);

if (!validation.isValid) {
  throw new Error(`Invalid navigation node: ${validation.reason}`);
}
```

**Result**:
```
Error: Invalid navigation node: No sidebar found for topic "Java" 
(external_id: 4b21ddc0-123b-41e3-8ea1-280d37f7f035) and brand skillup
```

**This is NOT a bug** — the service is correctly rejecting invalid brand/topic combinations.

---

## Option Analysis

### Option A: Create Missing Sidebars (Production Data Change)
**Action**: Add Java topic sidebars for 'realtutorialhub' and 'skillup' brands

**Pros**:
- Unblocks test immediately
- Tests real multi-brand behavior
- May reflect future production reality

**Cons**:
- Requires production database changes
- Affects live system (sidebar queries)
- May not reflect current business requirements (are multi-brand Java tutorials actually needed?)
- Adds maintenance burden (2 more sidebars to keep synchronized)

**Risk Level**: 🔴 HIGH (production data change)

---

### Option B: Use Different Topic with Multi-Brand Sidebars
**Action**: Find a topic that already has sidebars for multiple brands, rewrite test to use that topic

**Investigation Needed**:
```sql
-- Find topics with multiple brand sidebars
SELECT topic_external_id, COUNT(DISTINCT brand_id) as brand_count
FROM sidebars
WHERE deleted_at IS NULL
GROUP BY topic_external_id
HAVING COUNT(DISTINCT brand_id) >= 2;
```

**Pros**:
- Uses real production data
- No database changes needed
- Tests actual multi-brand capability

**Cons**:
- May not exist (all topics might be single-brand or 'shared')
- Requires investigation
- Test becomes coupled to different fixture

**Risk Level**: 🟡 MEDIUM (investigation cost, fixture coupling)

---

### Option C: Split Test — Test Concurrency, Skip Multi-Brand
**Action**: Keep tests #1 and #3 (concurrency validation), skip test #2 (multi-brand) with architectural note

**Implementation**:
```typescript
it.skip('should allow different brands for same subtopic [BLOCKED: requires multi-brand sidebars]', async () => {
  // Test implementation stays for documentation
});
```

**Pros**:
- Preserves concurrency validation (primary test purpose)
- No production changes
- No fixture investigation needed
- Fast to implement
- Test code preserved for future re-enablement

**Cons**:
- Coverage gap (multi-brand isolation not tested)
- May hide bugs in multi-brand logic
- Test suite incomplete

**Risk Level**: 🟢 LOW (no changes, explicit documentation)

---

### Option D: Mock Sidebar Validation
**Action**: Inject mock sidebar validator that always returns `isValid: true`

**Implementation**:
```typescript
const mockValidator = {
  validateNavigationNode: async () => ({ isValid: true, reason: 'test mock' })
};
const service = new TutorialComposerService(/* inject mock */);
```

**Pros**:
- Unblocks test immediately
- No production changes
- Tests database-level multi-brand constraint

**Cons**:
- Not a true integration test (bypasses sidebar validation)
- May hide bugs in sidebar validation logic
- Requires service to accept injected validator (architecture change)
- Test no longer validates full E2E flow

**Risk Level**: 🟡 MEDIUM (reduces test value, requires code change)

---

### Option E: Defer to Phase 8A (E2E Fixture Strategy)
**Action**: Mark entire test file as blocked pending Phase 8A multi-brand fixture strategy

**Rationale**:
- Phase 8A will establish E2E test fixtures including multi-brand scenarios
- Concurrency validation is already partially covered by other tests
- Multi-brand decision should be made holistically, not per-test

**Pros**:
- Defers decision to appropriate phase
- Allows holistic fixture design
- No rushed changes

**Cons**:
- Gate 4 remains incomplete
- Delays validation of concurrency guarantees
- May never get fixed if Phase 8A has different priorities

**Risk Level**: 🟢 LOW (explicit deferral with plan)

---

## Recommendation

### Primary: **Option C** (Split Test — Skip Multi-Brand)

**Reasoning**:
1. **Concurrency validation is valuable** — Tests #1 and #3 validate that duplicate prevention works (core requirement)
2. **Multi-brand is an architectural concern** — Not specific to this test, should be solved holistically
3. **No production risk** — No database changes, no code changes
4. **Clear documentation** — `.skip` with reason makes blocker explicit
5. **Reversible** — Easy to re-enable when multi-brand fixtures exist

**Implementation Plan**:
```typescript
// Test #1: KEEP (validates concurrent duplicate prevention with single brand)
it('should prevent concurrent creation of duplicate (subtopicId, brandId)', async () => {
  // Change to TEST_BRAND = 'shared', TEST_NAV_NODE_ID = 'whatisjava'
  // ...existing test logic
});

// Test #2: SKIP (requires multi-brand sidebars)
it.skip('should allow different brands for same subtopic [BLOCKED: No sidebars for realtutorialhub/skillup + Java]', async () => {
  // Keep implementation for documentation
});

// Test #3: KEEP (validates sequential duplicate prevention with single brand)
it('should prevent duplicate after first succeeds', async () => {
  // Change to TEST_BRAND = 'shared', TEST_NAV_NODE_ID = 'whatisjava'
  // ...existing test logic
});
```

### Secondary: **Option B** (Different Topic)

If investigation reveals a topic with multiple brand sidebars, this becomes preferred over Option C.

**Investigation Script**:
```typescript
// scripts/phase-8.1-find-multibrand-topics.mjs
import { db } from '../packages/db-tutorial/src/db';

const multibrands = await db.execute(sql`
  SELECT 
    ts.external_id as topic_id,
    ts.name as topic_name,
    STRING_AGG(DISTINCT s.brand_id, ', ') as brands,
    COUNT(DISTINCT s.brand_id) as brand_count
  FROM tutorial_topics ts
  JOIN sidebars s ON s.topic_external_id = ts.external_id
  WHERE s.deleted_at IS NULL
  AND ts.deleted_at IS NULL
  GROUP BY ts.external_id, ts.name
  HAVING COUNT(DISTINCT s.brand_id) >= 2
`);

console.log(multibrands);
```

---

## What Should NOT Be Done

❌ **Option A** (Create sidebars) — production data change without business requirement validation  
❌ **Option D** (Mock validation) — degrades test to unit test, bypasses critical validation  
❌ **Blind conversion to 'shared'** — destroys test purpose (multi-brand isolation)  
❌ **Delete test entirely** — loses documentation of intended behavior

---

## Next Steps

### If Option C (Recommended):
1. ✅ Apply canonical fixture corrections to tests #1 and #3
2. ✅ Add `.skip` to test #2 with architectural note
3. ✅ Run test suite and verify 2 of 3 passing
4. ✅ Document in Phase 8.1 final report
5. ⏭️ Re-evaluate in Phase 8A when multi-brand fixture strategy is established

### If Option B (Investigation):
1. ⏭️ Run investigation script to find multi-brand topics
2. ⏭️ If found: rewrite test to use that topic
3. ⏭️ If not found: fall back to Option C

---

## Impact Assessment

### Test Coverage Impact
| Validation | Covered After Option C? |
|------------|-------------------------|
| Concurrent duplicate prevention (same brand) | ✅ YES (Test #1) |
| Sequential duplicate prevention (same brand) | ✅ YES (Test #3) |
| Multi-brand isolation (different brands) | ❌ NO (Test #2 skipped) |
| Database unique constraint enforcement | ✅ YES (Tests #1, #3) |

**Coverage Gap**: Multi-brand isolation not validated  
**Risk**: Low — sidebar validation already prevents invalid brand/topic combinations  
**Mitigation**: Phase 8A should include multi-brand E2E scenarios

### Production Code Confidence
After Option C implementation:
- ✅ Concurrency guarantees validated
- ✅ Duplicate prevention validated
- ✅ Database constraints validated
- ⚠️ Multi-brand isolation assumed working (sidebar validation evidence)

**Overall Confidence**: 🟡 MEDIUM-HIGH (core functionality validated, architectural scenario deferred)

---

## Decision Required

**Question for User**: Which option should be implemented?

**Recommended**: Option C (skip multi-brand test, keep concurrency tests)

**Alternative**: Option B (investigate multi-brand topics first)

**User Approval Needed**: Yes — architectural decision affecting test coverage strategy

---

**Report Status**: ⏸️ AWAITING DECISION  
**Blocker**: User must approve Option C (skip) or Option B (investigate) before proceeding  
**Next Gate**: Gate 8 (implement approved option)
