# Phase 8.1 — Gate 4: Architectural Analysis (Investigation Only)
**Date**: 2026-08-30  
**Status**: 🔍 INVESTIGATION — NO MODIFICATIONS MADE  
**Test File**: `gate-4-concurrency.integration.test.ts`

---

## Executive Summary

Gate 4 test has **4 test cases** validating database-level unique constraint behavior. **Test case #2 is blocked** by missing multi-brand sidebars. The other 3 tests are structurally sound but use brands that may not have valid sidebars.

**Key Finding**: This test explicitly validates the `(subtopicId, brandId, navigationNodeId)` unique constraint at the **database level** and multi-brand platform capability. It is **NOT the same as the other 4 tests** — it has a distinct architectural purpose.

---

## Test Structure & Purpose

| # | Test Name | Brands Used | Primary Validation | Blocker? |
|---|-----------|-------------|-------------------|----------|
| 1 | Concurrent duplicate prevention | `'realtutorialhub'` (same brand, 5x concurrent) | DB constraint prevents race condition | ✅ YES* |
| 2 | Multi-brand isolation | `'realtutorialhub'` + `'skillup'` (2 brands, sequential) | Same subtopic can have multiple brand tutorials | ✅ YES |
| 3 | Sequential duplicate prevention | `'skillup'` (same brand, 2x sequential) | DB constraint enforced after first succeeds | ✅ YES* |
| 4 | Archive & recreate | `'shared'` (same brand, archive then create) | Soft delete allows recreation | ⚠️ MAYBE |

**\* May be blocked** if sidebar validation rejects `'realtutorialhub'` or `'skillup'` + test subtopic combination

---

## Architectural Intent (From Test Comments)

```typescript
/**
 * GATE 4 — Concurrency & Duplicate Identity Test
 * 
 * Verifies that the V2 unique constraint (subtopic_id, brand_id) prevents
 * duplicate tutorials from being created concurrently while allowing
 * different brands to create tutorials for the same subtopic.
 */
```

### What This Test Is NOT
❌ Testing D1/C1 content integration (already covered by other 4 tests)  
❌ Testing Composer→Delivery flow (already covered by c1-018)  
❌ Testing single-brand tutorial lifecycle (already covered by phase-1h, v2-composer, v2-delivery)

### What This Test IS
✅ Testing database-level **unique constraint enforcement**  
✅ Testing **concurrent creation race conditions**  
✅ Testing **multi-brand platform capability** (core business requirement)  
✅ Testing **soft delete (archive) behavior** with constraint

---

## Test Case Deep Dive

### Test #1: Concurrent Duplicate Prevention
```typescript
// Create 5 identical tutorials concurrently with SAME (subtopicId, brandId)
brandId: 'realtutorialhub'

// Expected: Exactly 1 success, 4 failures (duplicate constraint)
expect(successes.length).toBe(1);
expect(failures.length).toBe(4);
```

**Purpose**: Validate that database unique constraint `(subtopic_id, brand_id, navigation_node_id)` prevents race conditions when multiple requests arrive simultaneously.

**Why This Matters**: Production system may receive concurrent requests to create tutorial for same subtopic/brand. Database must prevent duplicates.

**Current Issue**: Likely fails with:
```
Error: Invalid navigation node: No sidebar found for topic X and brand realtutorialhub
```

**Root Cause**: Test uses `TEST_NAV_NODE_ID = 'test-page'` (doesn't exist) and `testSubtopicId` from `.limit(1)` (arbitrary subtopic).

---

### Test #2: Multi-Brand Isolation ⚠️ CRITICAL
```typescript
brandA: { subtopicId, brandId: 'realtutorialhub', ... }
brandB: { subtopicId, brandId: 'skillup', ... }

// Both should succeed (different brandId)
expect(tutorialA.id).toBeDefined();
expect(tutorialB.id).toBeDefined();
expect(tutorialA.brandId).toBe('realtutorialhub');
expect(tutorialB.brandId).toBe('skillup');
```

**Purpose**: Validate that unique constraint allows SAME subtopic to have tutorials for DIFFERENT brands. This is **core multi-brand platform capability**.

**Why This Matters**: 
- RealTutorialHub and SkillUp are separate brands on same platform
- Each brand should be able to customize Java tutorial content independently
- Constraint `(subtopic_id, brand_id, navigation_node_id)` should allow this

**Current Issue**: Guaranteed to fail:
```
Error: Invalid navigation node: No sidebar found for topic "Java" and brand realtutorialhub
Error: Invalid navigation node: No sidebar found for topic "Java" and brand skillup
```

**This Is NOT A Bug**: Sidebar validation is correctly rejecting invalid brand/topic combinations. The test requires valid multi-brand fixture data.

---

### Test #3: Sequential Duplicate Prevention
```typescript
brandId: 'skillup'

// First create succeeds
const first = await service.createTutorial(input, context);

// Second create with SAME identity fails
await expect(service.createTutorial(input, context)).rejects.toThrow(/duplicate/);
```

**Purpose**: Validate that duplicate constraint works in sequential (non-concurrent) scenario.

**Why This Matters**: Confirms constraint isn't only working due to concurrency timing — it enforces uniqueness at database level.

**Current Issue**: Likely fails at first create (sidebar validation).

---

### Test #4: Archive & Recreate
```typescript
brandId: 'shared'

// Create tutorial
const first = await service.createTutorial(input, context);

// Archive it (soft delete)
await service.archiveTutorial(first.id, context);

// Create again with SAME identity (should succeed)
const second = await service.createTutorial(input, context);
```

**Purpose**: Validate that unique constraint respects soft delete (`deleted_at IS NULL`). After archival, same identity can be reused.

**Why This Matters**: Allows tutorial lifecycle: create → archive → recreate.

**Current Issue**: MAY work if using arbitrary subtopic + 'shared' brand + 'test-page' node happens to have valid sidebar (unlikely).

---

## Why This Test Is Different from the Other 4

### Other 4 Tests (phase-1h, c1-018, v2-composer, v2-delivery)
**Focus**: D1/C1 content integration, Composer→Storage→Delivery flow  
**Fixture Strategy**: Use REAL canonical fixture (`What is Java?` + `'whatisjava'` + `'shared'`)  
**Brands**: Single brand (`'shared'`) sufficient — content flow doesn't require multi-brand  
**Validation**: Business logic correctness, content preservation, block ordering

### Gate 4 Test
**Focus**: Database constraint enforcement, concurrency, multi-brand capability  
**Fixture Strategy**: Requires MULTIPLE valid brand/topic combinations  
**Brands**: MUST test different brands — that's the entire point of test #2  
**Validation**: Platform architecture correctness, data integrity

**CANNOT be solved by simply changing to `'shared'`** — would destroy test purpose.

---

## Investigation: Do Valid Multi-Brand Fixtures Exist?

### Question 1: Does any topic have sidebars for both realtutorialhub AND skillup?

**Investigation Needed**:
```sql
SELECT 
  ts.external_id as topic_id,
  ts.name as topic_name,
  STRING_AGG(DISTINCT s.brand_id, ', ') as brands
FROM tutorial_topics ts
JOIN sidebars s ON s.topic_external_id = ts.external_id
WHERE s.deleted_at IS NULL
  AND ts.deleted_at IS NULL
  AND s.brand_id IN ('realtutorialhub', 'skillup')
GROUP BY ts.external_id, ts.name
HAVING COUNT(DISTINCT s.brand_id) = 2;
```

**If Found**: Rewrite test to use that topic + valid navigationNodeId from those sidebars

**If Not Found**: Multi-brand fixture strategy must be established (create sidebars, use mocks, or defer test)

---

### Question 2: What subtopic/navigationNodeId does 'test-page' refer to?

**Current Code**:
```typescript
const TEST_NAV_NODE_ID = 'test-page'; // Does this exist?

beforeAll(async () => {
  const result = await db
    .select({ id: tutorialSubtopics.id })
    .from(tutorialSubtopics)
    .limit(1); // Arbitrary subtopic

  testSubtopicId = result[0].id;
});
```

**Issues**:
1. `'test-page'` navigationNodeId likely doesn't exist in any sidebar
2. `.limit(1)` gets arbitrary subtopic (no relationship to 'test-page')
3. No verification that subtopic + brands + navigationNodeId form valid combination

**Result**: Test likely fails immediately at sidebar validation, never reaches database constraint testing.

---

## Root Cause Classification

### Test #1, #3: TEST FIXTURE ERROR
**Problem**: Uses `'test-page'` (invalid navigationNodeId) + arbitrary subtopic  
**Evidence**: Sidebar validation will reject  
**Production Code**: ✅ Working correctly (sidebar validation)  
**Fix Required**: Use valid navigationNodeId + matching subtopic

### Test #2: ARCHITECTURAL BLOCKER
**Problem**: Requires multi-brand sidebars that don't exist  
**Evidence**: No Java sidebars for realtutorialhub/skillup  
**Production Code**: ✅ Working correctly (sidebar validation)  
**Fix Required**: Architectural decision on multi-brand fixture strategy

### Test #4: TEST FIXTURE ERROR (possibly)
**Problem**: Same as #1/#3 — uses 'test-page' + arbitrary subtopic  
**Evidence**: May fail at sidebar validation  
**Production Code**: ✅ Working correctly  
**Fix Required**: Use valid fixture

---

## Options Matrix

### Option A: Investigate & Use Real Multi-Brand Topic
**Action**: Run SQL query to find topic with both realtutorialhub + skillup sidebars

**If Found**:
```typescript
// Update test to use discovered topic
const TOPIC_EXTERNAL_ID = '<found-topic-id>';
const TEST_SUBTOPIC_ID = '<subtopic-from-that-topic>';
const TEST_NAV_NODE_A = '<navigation-node-from-realtutorialhub-sidebar>';
const TEST_NAV_NODE_B = '<navigation-node-from-skillup-sidebar>';
```

**Pros**: Tests real multi-brand behavior, no data changes  
**Cons**: May not exist, couples test to specific fixture  
**Risk**: 🟡 MEDIUM

---

### Option B: Create Multi-Brand Sidebars for Java
**Action**: Add sidebars for `realtutorialhub` + Java and `skillup` + Java

**Pros**: Unblocks test with realistic fixture  
**Cons**: Production data change, requires business validation  
**Risk**: 🔴 HIGH

---

### Option C: Split Test — Skip Multi-Brand, Keep Others
**Action**: 
- Test #1: Change to use valid single-brand fixture (e.g., Java + 'shared')
- Test #2: `.skip` with note "Requires multi-brand sidebars"
- Test #3: Change to use valid single-brand fixture
- Test #4: Change to use valid single-brand fixture

**Pros**: 
- Tests concurrency behavior (core value)
- Tests archive behavior
- No production changes
- Explicitly documents multi-brand gap

**Cons**:
- Multi-brand isolation not tested
- Reduced coverage of platform capability

**Risk**: 🟢 LOW

---

### Option D: Mock Sidebar Validation (NOT RECOMMENDED)
**Action**: Inject mock that bypasses sidebar validation

**Why NOT**: 
- Tests would no longer validate E2E flow
- Sidebar bugs could be hidden
- Not true integration test
- Requires architecture change

**Risk**: 🔴 HIGH (test value degradation)

---

## Recommendation

### Primary: **Option A** (Investigate Multi-Brand Topics)
Run investigation query first. If multi-brand topic exists, this is cleanest solution.

**Script Needed**:
```javascript
// scripts/phase-8.1-find-multibrand-topics.mjs
import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

const result = await db.execute(sql`
  SELECT 
    ts.external_id as topic_id,
    ts.name as topic_name,
    STRING_AGG(DISTINCT s.brand_id, ', ') as brands,
    COUNT(DISTINCT s.brand_id) as brand_count
  FROM tutorial_topics ts
  JOIN sidebars s ON s.topic_external_id = ts.external_id
  WHERE s.deleted_at IS NULL
    AND ts.deleted_at IS NULL
    AND s.brand_id IN ('realtutorialhub', 'skillup')
  GROUP BY ts.external_id, ts.name
  HAVING COUNT(DISTINCT s.brand_id) = 2
`);

console.log('Topics with both realtutorialhub and skillup sidebars:');
console.log(result);
```

### Fallback: **Option C** (Skip Multi-Brand)
If no multi-brand topics exist, skip test #2 and fix #1, #3, #4 to use Java + 'shared'.

---

## Next Steps (Investigation Phase)

1. ✅ Create investigation script (above)
2. ⏭️ Run script to check for multi-brand topics
3. ⏭️ If found: Document topic + navigationNodeIds for rewrite
4. ⏭️ If not found: Document as architectural gap, proceed with Option C
5. ⏭️ Get user approval on chosen option before modifying test

---

## What Should NOT Be Done

❌ **Change test #2 to use 'shared' for both brands** — destroys test purpose  
❌ **Delete test entirely** — loses validation of critical platform capability  
❌ **Mock sidebar validation** — degrades test to unit test  
❌ **Modify test without investigation** — risks breaking valid architecture validation

---

## Status

**Current State**: Gate 4 test unchanged, 4 other tests passing and preserved  
**Investigation Required**: Multi-brand topic query  
**Modification Blocked**: Awaiting investigation results + user decision  
**Phase 8.1 Completion**: Cannot certify until Gate 4 resolved

---

**Report Author**: Kiro  
**Report Type**: Investigation (No Modifications)  
**Next Action**: Run multi-brand topic investigation script
