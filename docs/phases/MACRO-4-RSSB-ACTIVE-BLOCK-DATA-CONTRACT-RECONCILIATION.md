# MACRO 4 RSSB — ACTIVE BLOCK DATA CONTRACT RECONCILIATION

**Date:** 2026-09-11  
**Status:** 🔴 **THREE SEPARATE ISSUES IDENTIFIED** - Implementation STOPPED  
**Phase:** Contract Analysis Complete - Awaiting Authorization to Fix

---

## EXECUTIVE SUMMARY

Investigation has uncovered **THREE DISTINCT ISSUES** that must be resolved independently:

1. **🟢 blockVersion Contract: ARCHITECTURALLY CORRECT** - No fix needed
2. **🔴 Test Fixture Migration: INCOMPLETE** - Tests use old `completedBlocks[]`, production uses `blocks[]`
3. **🔴 Browser Authentication: FAILING** - ILS navigation returns 401, no token

**CRITICAL:** Previous implementation attempt **weakened identity matching** by allowing `blockId`-only matching when `blockVersion` is undefined. This violates the established `blockId + blockVersion` contract and has been **REVERTED**.

---

## ISSUE 1: blockVersion CONTRACT ANALYSIS

### Investigation Question

Why is `ActiveBlockIdentity.blockVersion` optional while ILS identity requires `blockId + blockVersion`?

### Source Evidence

**TutorialDocument Block Types:**

**Versioned Blocks** (e.g., CodeC1Block, DefinitionD1Block):
```typescript
export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';  // ← REQUIRED literal type
  content: CodeC1AuthorContent;
}

export interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';  // ← REQUIRED literal type
  content: DefinitionD1AuthorContent;
}
```

**Non-Versioned Blocks** (e.g., HeadingBlock, ParagraphBlock):
```typescript
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  // ← NO version field
  content: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  // ← NO version field
  content: {
    text: string;
  };
}
```

### DOM Attribute Evidence

**CodeC1Block Renderer:**
```typescript
// packages/ui/src/tutorial/blocks/CodeC1Block.tsx line 99
data-block-version="C1"  // ← Explicitly set
```

**DefinitionBlock Renderer:**
```typescript
// packages/ui/src/tutorial/blocks/DefinitionBlock.tsx line 79
data-block-version={block.version}  // ← From block.version
```

**Non-Versioned Blocks:**
- HeadingBlock, ParagraphBlock, etc. do NOT render `data-block-version` attribute

### ActiveBlockContext Extraction

**packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx line 132:**
```typescript
const blockVersion = element.getAttribute('data-block-version') || undefined;
```

**Behavior:**
- Versioned block (C1, D1): `getAttribute()` returns `"C1"` or `"D1"`
- Non-versioned block: `getAttribute()` returns `null` → becomes `undefined`

### Test Evidence

**packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx:**
```typescript
// Line 43
expect(element?.getAttribute('data-block-version')).toBeNull(); // No version

// Line 316
expect(element?.getAttribute('data-block-version')).toBe('C1');

// Line 354
expect(element?.getAttribute('data-block-version')).toBe('D1');
```

### Contract Conclusion

**✅ `ActiveBlockIdentity.blockVersion?: string` IS ARCHITECTURALLY CORRECT**

**Rationale:**
1. TutorialDocument has BOTH versioned and non-versioned blocks
2. Versioned blocks: `version` is required
3. Non-versioned blocks: NO `version` field
4. DOM accurately reflects this: versioned blocks have attribute, non-versioned don't
5. ActiveBlockContext correctly extracts: present → value, absent → undefined
6. Optional TypeScript property correctly represents this reality

**Verdict:** ✅ **NO FIX REQUIRED** - Contract is correct as designed

---

## ISSUE 2: TEST FIXTURE MIGRATION STATUS

### Investigation Question

Why are 6 ILSProvider tests failing with `activeBlockProgress === null`?

### Root Cause Identified

**Production Contract (Current):**
```typescript
interface NavigationProgressResponse {
  ...
  blocks: BlockLearningStateResponse[];  // ← Gate 3C.1R migration
}
```

**Test Fixture (Stale):**
```typescript
const mockProgressResponse = {
  ...
  completedBlocks: [  // ← OLD contract
    { blockId: '...', blockVersion: 'D1', completedAt: '...' },
    ...
  ],
  // blocks: []  ← MISSING!
}
```

### Code Path Analysis

**ILSProvider.tsx line 296:**
```typescript
return data.blocks;  // Gate 3C.1R: Return blocks instead of completedBlocks
```

**Line 421:**
```typescript
blocksRef.current = blocks;
```

**Test Execution:**
```text
fetchProgress()
    ↓
json: async () => mockProgressResponse
    ↓
return data.blocks
    ↓
mockProgressResponse.blocks === undefined
    ↓
return undefined
    ↓
blocksRef.current = undefined
    ↓
updateActiveBlockProgress(activeBlock, undefined)
    ↓
activeBlockProgress = null  // Line 341: if (!blocks) setNull
    ↓
TEST FAILURE: expected not.toBeNull()
```

### Test Inventory

**Tests Using Stale Fixture:**

| Test Name | Line | Fixture Issue | Required blocks[] |
|-----------|------|---------------|-------------------|
| should use current active block when API resolves | 461 | completedBlocks only | ✅ |
| should invalidate cached blocks when page identity changes | 548 | completedBlocks only | ✅ |
| should derive active block progress from completedBlocks matching | 793 | completedBlocks only | ✅ |
| should detect unmatched active block | 825 | completedBlocks only | ✅ |
| should require BOTH blockId AND blockVersion to match | 855 | completedBlocks only | ✅ |
| should update activeBlockProgress when active block changes | 890 | completedBlocks only | ✅ |

**All 6 failing tests** use `mockProgressResponse` which lacks `blocks[]`.

### Required Fixture Migration

**Current (Stale):**
```typescript
const mockProgressResponse = {
  ...
  completedBlocks: [
    { blockId: 'block-d1-uuid', blockVersion: 'D1', completedAt: '2026-09-01T10:30:00.000Z' },
    { blockId: 'block-c1-uuid', blockVersion: 'C1', completedAt: '2026-09-01T11:00:00.000Z' },
  ],
  completedBlockCount: 2,
  ...
};
```

**Required (Gate 3C.1R Contract):**
```typescript
const mockProgressResponse = {
  ...
  blocks: [
    {
      blockId: 'block-d1-uuid',
      blockVersion: 'D1',
      visitCount: 2,
      revisionCount: 1,
      activeTimeSec: 60,
      expectedTimeSec: 120,
      firstViewedAt: '2026-09-01T10:00:00.000Z',
      lastViewedAt: '2026-09-01T10:15:00.000Z',
      completedAt: '2026-09-01T10:30:00.000Z',
    },
    {
      blockId: 'block-c1-uuid',
      blockVersion: 'C1',
      visitCount: 1,
      revisionCount: 0,
      activeTimeSec: 180,
      expectedTimeSec: 240,
      firstViewedAt: '2026-09-01T10:45:00.000Z',
      lastViewedAt: '2026-09-01T11:00:00.000Z',
      completedAt: '2026-09-01T11:00:00.000Z',
    },
    {
      blockId: 'block-s1-uuid',
      blockVersion: 'S1',
      visitCount: 0,
      revisionCount: 0,
      activeTimeSec: 0,
      expectedTimeSec: null,
      firstViewedAt: null,
      lastViewedAt: null,
      completedAt: null,
    },
  ],
  completedBlockCount: 2,
  ...
};
```

**Verdict:** 🔴 **TEST FIXTURE MIGRATION INCOMPLETE** - Not a production defect

---

## ISSUE 3: BROWSER AUTHENTICATION FAILURE

### Investigation Question

Why does browser show "No active block data" despite visible tutorial content?

### Browser Evidence

**Server Logs:**
```
GET /api/tutorial/ils/navigation/whatisjava?... → 401

[BFF_AUTH_DEBUG]
pathname: /api/tutorial/ils/navigation/whatisjava
hasToken: false
tokenLength: 0

[BFF_AUTH_DEBUG] No token found
```

**Network Tab (Expected):**
```
GET /api/tutorial/ils/navigation/:nodeId?subtopicId=:subtopicId
Status: 401 Unauthorized
Response: { error: "Authentication required" }
```

### Comparison with Working Requests

**Working telemetry POSTs show:**
```
[BFF_AUTH_DEBUG]
hasToken: true
tokenLength: 499
tokenPrefix: eyJhbGciOiJIUzI1NiJ9

[BFF_AUTH_DEBUG] Token verified successfully
userId: afc355ca
roles: ["user","student"]
brand: skillup
```

### Root Cause Analysis

**Browser execution path:**
```text
Tutorial Page Loads
    ↓
ILSProvider mounts
    ↓
useEffect triggers fetchProgress()
    ↓
fetch('/api/tutorial/ils/navigation/:nodeId', { credentials: 'include' })
    ↓
BFF extracts token
    ↓
hasToken = false  ← FAILS HERE
    ↓
401 Unauthorized
    ↓
ILSProvider: response.status === 401 → throw Error
    ↓
blocksRef.current remains null
    ↓
activeBlockProgress remains null
    ↓
RSSB displays: "No active block data"
```

**Question:** Why is `hasToken=false` for navigation request but `hasToken=true` for telemetry POSTs?

**Possible causes:**
1. Different fetch implementations (credentials not included?)
2. Different authentication boundaries
3. Timing issue (token not yet available?)
4. Cookie path/domain mismatch
5. CORS/credential handling difference

### Required Investigation

**Trace:**
- Browser → `/api/tutorial/ils/navigation/:nodeId`
- BFF route handler
- Token extraction logic
- Compare with working `/api/tutorial/ils/block-active-time` path
- Verify `credentials: 'include'` in fetch
- Check cookie path/domain
- Check BFF proxy configuration

**DO NOT modify yet** - authentication boundary investigation required first

**Verdict:** 🔴 **BROWSER ILS NAVIGATION AUTHENTICATION FAILING** - Real blocker

---

## ISSUE 4: INCORRECT IMPLEMENTATION ATTEMPT (REVERTED)

### What Was Changed

**Attempted "Fix" in ILSProvider.tsx:**
```typescript
const blockState = blocks.find((block) => {
  if (block.blockId !== activeBlock.blockId) {
    return false;
  }
  // If activeBlock has no blockVersion, match by blockId only
  if (!activeBlock.blockVersion) {
    return true;  // ← DANGEROUS fallback
  }
  return block.blockVersion === activeBlock.blockVersion;
});
```

### Why This Was Wrong

**Established ILS Identity Contract:**
```text
(userId, navigationNodeId, blockId, blockVersion)
```

**Frontend Matching Contract:**
```text
blockId + blockVersion
```

**Test Requirement:**
```text
"should require BOTH blockId AND blockVersion to match (version boundary test)"

same blockId + different blockVersion → NO MATCH
```

**The fallback:**
```typescript
if (!activeBlock.blockVersion) {
  return true;  // Match by blockId ONLY
}
```

**violates version-boundary protection.**

**Example of cross-contamination risk:**
```text
Active block: { blockId: "abc-123", blockVersion: undefined }
ILS blocks: [
  { blockId: "abc-123", blockVersion: "D1", ... },
  { blockId: "abc-123", blockVersion: "D2", ... },
]

Fallback would match: D1 (first match)

But which D1 or D2? Arbitrary!
```

**This breaks the very protection that version-based identity was designed to provide.**

### Correct Approach

**For versioned blocks (D1, C1):**
- `activeBlock.blockVersion` will be `"D1"` or `"C1"` (not undefined)
- Match requires: `block.blockId === activeBlock.blockId && block.blockVersion === activeBlock.blockVersion`

**For non-versioned blocks (heading, paragraph):**
- `activeBlock.blockVersion` will be `undefined`
- ILS API should NOT track these blocks individually
- Telemetry POSTs target instructional blocks only (D1, C1, S1, etc.)

**Question:** Do non-versioned blocks even appear in ILS `blocks[]` array?

**Answer required before any matching logic change.**

### Current Status

**✅ REVERTED** to strict matching:
```typescript
const blockState = blocks.find(
  (block) =>
    block.blockId === activeBlock.blockId &&
    block.blockVersion === activeBlock.blockVersion
);
```

**Diagnostic logging** retained to trace actual runtime behavior.

---

## MATCHING LOGIC PRESERVATION

### Version-Boundary Test Must Pass

**Test:** `should require BOTH blockId AND blockVersion to match (version boundary test)`

**Semantics:**
```typescript
activeBlock: { blockId: "block-d1-uuid", blockVersion: "D2" }
ILS blocks: [
  { blockId: "block-d1-uuid", blockVersion: "D1", completedAt: "..." },
]

Expected: NO MATCH
Reason: Same blockId but DIFFERENT version
```

**This test protects against version contamination and MUST remain enforced.**

### If Undefined blockVersion Is Legitimate

**Then the correct architectural fix is NOT:**
```typescript
match by blockId only
```

**But rather:**
```typescript
Establish that non-versioned blocks are not tracked in ILS blocks[]
```

**OR:**
```typescript
Establish a separate identity system for non-versioned blocks
```

**Do NOT weaken identity matching without architectural proof.**

---

## FILES REQUIRING MODIFICATION

### If Test Fixture Migration Proceeds

**File:** `packages/ui/src/tutorial/runtime/__tests__/ILSProvider.test.tsx`

**Changes Required:**
1. Add `blocks[]` array to `mockProgressResponse`
2. Populate with full `BlockLearningStateResponse` objects
3. Update test assertions if necessary
4. Verify 6 failing tests pass
5. Preserve version-boundary test semantics

**Estimated Lines:** ~100 (fixture definition + potential test updates)

### If Browser Authentication Fix Proceeds

**Requires investigation first** - cannot identify files until root cause is traced.

**Potential files:**
- BFF authentication middleware
- ILS navigation route handler
- Token extraction logic
- Fetch implementation in ILSProvider

---

## RECOMMENDED MINIMAL CORRECTIONS

### Priority 1: Fix Test Fixtures (Low Risk)

**Action:** Migrate `mockProgressResponse` to Gate 3C.1R contract
**Risk:** Low - test-only change
**Impact:** 6/21 tests should pass
**Blocker Status:** Not a production blocker

**Steps:**
1. Add `blocks[]` array with complete telemetry fields
2. Run tests
3. Verify version-boundary test still passes
4. Verify 15 passing tests remain passing

### Priority 2: Investigate Browser Authentication (Critical)

**Action:** Trace why `/api/tutorial/ils/navigation/:nodeId` returns 401
**Risk:** Medium - authentication boundary
**Impact:** Required for RSSB real data
**Blocker Status:** ✅ **PRODUCTION BLOCKER**

**Steps:**
1. Compare navigation request vs telemetry POST request
2. Check BFF token extraction for both paths
3. Verify `credentials: 'include'` in fetchProgress
4. Check cookie path/domain
5. Identify exact authentication difference
6. Apply minimal fix
7. Verify 200 response with `blocks[]` data

### Priority 3: Verify Non-Versioned Block Contract (Architectural)

**Action:** Determine if non-versioned blocks should be in ILS `blocks[]`
**Risk:** Low - investigation only
**Impact:** Clarifies identity contract
**Blocker Status:** Not immediate

**Steps:**
1. Check actual production ILS API response
2. Does `blocks[]` include heading/paragraph blocks?
3. Or only instructional blocks (D1, C1, S1)?
4. Document authoritative contract
5. Update type definitions if necessary

---

## DIAGNOSTIC LOGGING STATUS

### Retained in ILSProvider.tsx

**Console logs still active:**
```typescript
console.log('[ILSProvider] updateActiveBlockProgress called', {...});
console.log('[ILSProvider] Setting activeBlockProgress to null (no activeBlock or blocks)');
console.log('[ILSProvider] Block matching result', {...});
console.log('[ILSProvider] activeBlock changed effect', {...});
console.log('[ILSProvider] No active block - setting activeBlockProgress to null');
```

**Purpose:** Trace actual runtime behavior during browser authentication investigation

**Action Required:** Remove before final deployment

---

## FINAL STATUS

### Issue Classification

| Issue | Status | Severity | Blocker? | Fix Complexity |
|-------|--------|----------|----------|----------------|
| blockVersion Contract | ✅ Correct | N/A | No | No fix needed |
| Test Fixture Migration | 🔴 Incomplete | Medium | No | Low - straightforward |
| Browser Authentication | 🔴 Failing | Critical | **YES** | Medium - requires investigation |
| Incorrect Fallback | ✅ Reverted | N/A | Prevented | N/A |

### Production Readiness

**Tests:** 🔴 **15/21 PASS** (6 failures due to stale fixture)  
**Type-Check:** ✅ **PASS**  
**Browser Runtime:** 🔴 **BLOCKED** (401 authentication)  
**RSSB Real Data:** 🔴 **BLOCKED** (no ILS blocks[] in browser)  
**Deployment:** 🔴 **BLOCKED** (browser authentication must be fixed first)

### Next Actions Required

**DO NOT:**
- ❌ Deploy
- ❌ Run browser visual certification
- ❌ Weaken identity matching
- ❌ Modify matching logic without architectural proof
- ❌ Accept blockId-only fallback

**DO:**
1. ✅ Fix test fixtures (add `blocks[]` array)
2. ✅ Investigate browser 401 root cause
3. ✅ Trace token extraction difference
4. ✅ Apply minimal authentication fix
5. ✅ Verify browser receives `blocks[]` array
6. ✅ Verify RSSB displays real data
7. ✅ Remove console.log debugging
8. ✅ Re-run all tests
9. ✅ Only then proceed to browser visual verification

---

**Contract Analysis:** ✅ COMPLETE  
**Test Diagnosis:** ✅ COMPLETE  
**Browser Diagnosis:** ✅ ROOT CAUSE IDENTIFIED  
**Incorrect Fix:** ✅ REVERTED  
**Implementation:** ❌ **STOPPED** - Awaiting authorization to proceed with fixes  
**Deployment:** ❌ **BLOCKED** - Browser authentication must be resolved first
