# MACRO 4 RSSB — ACTIVE BLOCK DATA INTEGRATION INVESTIGATION

**Date:** 2026-09-11  
**Status:** 🔍 **INVESTIGATING** - Debug logging added  
**Issue:** activeBlockProgress is null despite visible tutorial content  
**Current Phase:** Diagnostic logging to identify root cause

---

## SITUATION

### Provider Hierarchy: ✅ FIXED
- RSSB trigger visible in header
- RSSB sidebar opens successfully
- No `useILS must be used within ILSProvider` errors
- Provider composition working correctly

### New Blocker: 🔴 NO ACTIVE BLOCK DATA
Browser shows in RSSB:
```
Lifecycle Metrics
    No active block data

Engagement Metrics
    No active block data

Time Analysis
    No active block data
```

This means `useILS().activeBlockProgress === null`

---

## ROOT CAUSE ANALYSIS

### Expected Data Flow

```text
Tutorial Page Renders
    ↓
Blocks have data-block-id attributes
    ↓
ActiveBlockProvider observes blocks via IntersectionObserver
    ↓
activeBlock updates when block enters viewport
    ↓
ILSProvider fetches /api/tutorial/ils/navigation/:nodeId
    ↓
API returns blocks[] array with telemetry
    ↓
ILSProvider matches activeBlock.blockId + blockVersion to blocks[]
    ↓
activeBlockProgress set with matched data
    ↓
RSSB displays activeBlockProgress
```

### Observed Behavior

Tutorial content IS visible (screenshot shows "Example: Sum of Two Numbers in Java").

Telemetry IS working (server logs show successful POST requests):
```
POST /api/tutorial/ils/block-active-time 200
POST /api/tutorial/ils/visit 200
POST /api/tutorial/ils/block-visit 200
```

But `activeBlockProgress` is null.

### Possible Causes

**Hypothesis 1: activeBlock is null**
- ActiveBlockProvider isn't detecting any blocks
- IntersectionObserver not firing
- Blocks don't have `data-block-id` attributes
- containerRef not pointing to correct element

**Hypothesis 2: blocks[] array is empty/null**
- ILS API request failing
- API returning empty blocks array
- Response not being stored in blocksRef

**Hypothesis 3: Matching logic failing**
- `activeBlock.blockId` doesn't match any `blocks[].blockId`
- `activeBlock.blockVersion` is undefined
- Version mismatch between active block and API blocks

**Hypothesis 4: Timing issue**
- activeBlock changes from null → real block
- But ILSProvider effect doesn't re-run
- Or effect runs before blocks[] is available

---

## INVESTIGATION STEPS TAKEN

### 1. Source Code Review

**ActiveBlockProvider (packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx):**
- Returns `ActiveBlockIdentity`: `{ blockId, blockType, blockVersion? }`
- blockVersion is OPTIONAL (`blockVersion?: string`)
- Uses IntersectionObserver on elements with `data-block-id`

**ILSProvider (packages/ui/src/tutorial/runtime/ILSProvider.tsx):**
- Fetches `/api/tutorial/ils/navigation/:nodeId?subtopicId=:subtopicId`
- Stores response blocks in `blocksRef.current`
- Matches active block using:
  ```typescript
  blocks.find(block =>
    block.blockId === activeBlock.blockId &&
    block.blockVersion === activeBlock.blockVersion
  )
  ```

**Original Issue:** Strict version matching fails if `activeBlock.blockVersion` is undefined!

### 2. Matching Logic Fix Applied

**Before:**
```typescript
const blockState = blocks.find(
  (block) =>
    block.blockId === activeBlock.blockId &&
    block.blockVersion === activeBlock.blockVersion
);
```

**After (with fallback):**
```typescript
const blockState = blocks.find((block) => {
  if (block.blockId !== activeBlock.blockId) {
    return false;
  }
  // If activeBlock has no blockVersion, match by blockId only
  if (!activeBlock.blockVersion) {
    return true;
  }
  // Both have blockVersion - must match exactly
  return block.blockVersion === activeBlock.blockVersion;
});
```

### 3. Diagnostic Logging Added

**Added console.log statements to trace:**

**In `updateActiveBlockProgress`:**
- When called: activeBlock present? blocks present? blocks count?
- Matching result: found? blockState content?
- Setting null: why?

**In `activeBlock changed effect`:**
- When activeBlock changes: value? blocksRef status?
- Why not calling updateActiveBlockProgress?

**File Modified:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

---

## DEBUG LOGGING LOCATIONS

### Console Logs Added

**1. updateActiveBlockProgress entry:**
```typescript
console.log('[ILSProvider] updateActiveBlockProgress called', {
  hasActiveBlock: !!activeBlock,
  activeBlock,
  hasBlocks: !!blocks,
  blocksCount: blocks?.length,
});
```

**2. When setting null (no data):**
```typescript
console.log('[ILSProvider] Setting activeBlockProgress to null (no activeBlock or blocks)');
```

**3. Matching by blockId only:**
```typescript
console.log('[ILSProvider] Matching by blockId only (no blockVersion)', {
  blockId: activeBlock.blockId,
});
```

**4. Block matching result:**
```typescript
console.log('[ILSProvider] Block matching result', {
  found: !!blockState,
  blockState,
});
```

**5. activeBlock changed effect:**
```typescript
console.log('[ILSProvider] activeBlock changed effect', {
  hasBlocksRef: !!blocksRef.current,
  hasActiveBlock: !!activeBlock,
  activeBlock,
});
```

**6. No active block:**
```typescript
console.log('[ILSProvider] No active block - setting activeBlockProgress to null');
```

---

## REQUIRED USER ACTIONS

### Test in Browser with Console Open

**1. Open Browser DevTools**
- Press F12
- Go to Console tab
- Clear console

**2. Navigate to Tutorial**
```
http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**3. Open RSSB**
- Click BarChart3 / Learning Progress button
- Sidebar opens

**4. Observe Console Logs**
Look for `[ILSProvider]` messages.

### Expected Console Output Patterns

**Pattern A: No Active Block**
```
[ILSProvider] activeBlock changed effect {
  hasBlocksRef: true,
  hasActiveBlock: false,
  activeBlock: null
}
[ILSProvider] No active block - setting activeBlockProgress to null
```

**Meaning:** ActiveBlockProvider isn't detecting any blocks.

**Pattern B: No Blocks Array**
```
[ILSProvider] activeBlock changed effect {
  hasBlocksRef: false,
  hasActiveBlock: true,
  activeBlock: { blockId: "...", blockType: "...", blockVersion: "..." }
}
```

**Meaning:** ILS API call failed or blocks array not stored.

**Pattern C: Matching Failure**
```
[ILSProvider] updateActiveBlockProgress called {
  hasActiveBlock: true,
  activeBlock: { blockId: "abc", blockType: "definition", blockVersion: undefined },
  hasBlocks: true,
  blocksCount: 3
}
[ILSProvider] Block matching result {
  found: false,
  blockState: undefined
}
```

**Meaning:** No block in API response matches the active block identity.

**Pattern D: Success (Expected)**
```
[ILSProvider] updateActiveBlockProgress called {
  hasActiveBlock: true,
  activeBlock: { blockId: "...", blockType: "...", blockVersion: "D1" },
  hasBlocks: true,
  blocksCount: 3
}
[ILSProvider] Block matching result {
  found: true,
  blockState: { blockId: "...", visitCount: 1, ... }
}
```

**Meaning:** Match found, activeBlockProgress should be set.

### Additional Diagnostic Steps

**5. Check Network Tab**
- Look for: `GET /api/tutorial/ils/navigation/whatisjava?subtopicId=...`
- Status: 200?
- Response Preview: Does `blocks` array exist? What's in it?

**6. Check DOM**
- Inspect tutorial content elements
- Do they have `data-block-id` attributes?
- Example: `<div data-block-id="..." data-block-type="..." data-block-version="...">`

**7. Scroll Test**
- Scroll through tutorial content
- Watch console for activeBlock changes
- Does activeBlock ever become non-null?

---

## DIAGNOSTIC REPORT TEMPLATE

Please provide:

### Console Logs
```
[Paste all [ILSProvider] console messages here]
```

### Network - ILS Navigation Request
```
Request URL: 
Status: 
Response (blocks array):
{
  "blocks": [
    // paste array content
  ]
}
```

### DOM Inspection
```
Do tutorial blocks have data-block-id? YES / NO
Example element:
[paste HTML of one tutorial block]
```

### Active Block Behavior
```
Does activeBlock ever change from null? YES / NO
When scrolling, does activeBlock update? YES / NO
```

---

## NEXT STEPS BASED ON FINDINGS

### If Pattern A (No Active Block)
**Issue:** ActiveBlockProvider not working
**Fix Direction:**
- Check containerRef is pointing to correct element
- Verify blocks have data-block-id attributes
- Check IntersectionObserver is observing

### If Pattern B (No Blocks Array)
**Issue:** ILS API integration problem
**Fix Direction:**
- Check API request succeeds
- Verify response structure
- Check blocksRef assignment

### If Pattern C (Matching Failure)
**Issue:** Block identity mismatch
**Fix Direction:**
- Compare activeBlock.blockId with API blocks[].blockId
- Check blockVersion presence/format
- Verify matching logic

### If Pattern D (Should Work)
**Issue:** activeBlockProgress set but not rendering?
**Fix Direction:**
- Check RSSB component logic
- Verify useILS() returns correct value
- Check React state updates

---

## CURRENT STATUS

**Code Changes:** ✅ COMPLETE
- Improved matching logic (handles undefined blockVersion)
- Added comprehensive diagnostic logging
- Type-check passes

**Testing:** ⏳ **AWAITING USER BROWSER TEST**
- Need console logs
- Need network logs
- Need DOM inspection

**Resolution:** ⏳ **BLOCKED ON DIAGNOSTICS**
- Cannot proceed without runtime evidence
- Diagnostic logs will identify exact failure point

---

**Investigation:** ✅ COMPLETE  
**Diagnostic Logging:** ✅ ADDED  
**Browser Test:** ⏳ **REQUIRED** - Please test and report console output  
**Resolution:** ⏳ PENDING DIAGNOSTICS
