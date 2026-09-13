# Phase 2.5 — Backend Capability Audit Report

**Date:** 2026-08-27  
**Status:** AUDIT COMPLETE

---

## Executive Summary

✅ **Static runtime foundation:** VERIFIED  
✅ **D1 database record:** VERIFIED  
✅ **TypeScript:** 0 errors  
✅ **Services:** All running  
⚠️ **Tracking capability:** LIMITED — backend only supports subtopic-level progress  
🔴 **Block-level analytics:** BLOCKED — requires backend migration

---

## Current Backend Progress Model

### Database Schema (`tutorial_progress`)

```typescript
{
  id: uuid (PK)
  userId: uuid (FK) ✅
  subtopicId: uuid (FK) ✅
  status: enum('not_started', 'in_progress', 'completed') ✅
  blocksCompleted: jsonb<string[]> ⚠️  // Array of blockType strings
  remediationTriggered: boolean
  score: decimal
  timeSpentSec: integer ✅  // EXISTS but not actively tracked
  completedAt: timestamp
  version: integer
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp
}
```

**Unique constraint:** `(userId, subtopicId)`

---

## Current API Contract

### GET /api/tutorial/progress?subtopicId=xxx

**Returns:**
```json
{
  "data": {
    "blocksCompleted": ["definition", "code", "summary"],
    "completionPercent": 60,
    "assignmentUnlocked": false,
    "progress": {
      "status": "in_progress",
      "completionPercent": 60
    }
  }
}
```

### POST /api/tutorial/progress

**Request:**
```json
{
  "subtopicId": "uuid",
  "blockType": "definition" | "code" | "summary" | ...,
  "status": "viewed"
}
```

**Response:**
```json
{
  "data": {
    "success": true
  }
}
```

---

## What the Current Backend SUPPORTS

✅ **Subtopic-level progress**
- userId + subtopicId
- blocksCompleted[] (array of blockType strings)
- status: not_started | in_progress | completed
- completionPercent (calculated)
- timeSpentSec (column exists, not currently tracked)

✅ **Block completion tracking**
- Mark blockType as "viewed"
- Idempotent (safe to call multiple times with same blockType)
- Returns calculated mastery percentage

✅ **Existing integration points**
- `TutorialProgressRepository`
- `TutorialService.trackProgress()`
- tutorialProgressEngine
- BFF routes (RTH/SkillUp)

---

## What the Current Backend DOES NOT SUPPORT

❌ **navigationNodeId**
- Not persisted
- Cannot track per-node progress

❌ **sectionId**
- Not persisted
- Cannot distinguish which section a block came from

❌ **blockId**
- Not persisted
- Cannot distinguish individual block instances
- blocksCompleted[] stores only blockType strings

❌ **blockVersion**
- Not persisted
- Cannot distinguish D1 from D2

❌ **Active learning time**
- timeSpentSec column exists
- But not currently incremented by API
- No heartbeat mechanism

❌ **Revision count**
- Not tracked
- No concept of "revisit after completion"

❌ **Block-level completion percentage**
- Only subtopic-level percentage
- No per-block progress

❌ **Per-block metadata**
- completedAt: only at subtopic level
- firstViewedAt: not tracked
- lastViewedAt: not tracked

---

## Identity Mismatch

### Current Backend Identity

```text
userId + subtopicId
       ↓
blocksCompleted: ["definition", "code", "summary"]
```

### Required Runtime Identity (Phase 2.5)

```text
learnerId
navigationNodeId
sectionId
subtopicId
blockId
blockType
blockVersion
```

### The Gap

```text
BACKEND KNOWS:
  blockType[] (definition, code, summary)

BACKEND DOES NOT KNOW:
  navigationNodeId (whatisjava, whatispython, ...)
  sectionId (5326eeb6-..., abc123-..., ...)
  blockId (7ff97553-..., def456-..., ...)
  blockVersion (D1, D2, C1, C2, ...)
```

**Result:** Cannot implement navigation-node sidebar progress without backend migration.

---

## What CAN Be Implemented Without Migration

✅ **Runtime context propagation**
- Already implemented ✅
- TutorialBlockRuntimeContext exists
- All 17 blocks receive runtime context

✅ **Basic block completion**
- Mark blockType as viewed via existing API
- Uses existing POST /api/tutorial/progress
- Idempotent

✅ **Subtopic-level progress**
- Get progress via existing GET API
- Calculate completion percentage
- Determine assignment unlock

✅ **Failure isolation**
- Tracking failures don't break rendering
- Already implemented in tutorialTrackingService.ts

---

## What CANNOT Be Implemented Without Migration

❌ **Navigation-node progress indicators**
```typescript
// This is INVALID with current backend
completedBlocks.includes(node.id)  // ❌ blockType ≠ navigationNodeId
```

❌ **Block-level active time tracking**
- Requires per-block active_time_sec
- Requires heartbeat mechanism
- Requires block identity persistence

❌ **Revision count**
- Requires visit tracking
- Requires completion_state separate from revisit_count

❌ **Block-level completion percentage**
- Current: subtopic 60% complete
- Desired: D1 100%, C1 60%, S1 0%

❌ **Per-block timestamps**
- firstViewedAt per block
- lastViewedAt per block
- completedAt per block

❌ **Block version tracking**
- Cannot distinguish D1 completion from D2 completion

---

## Recommended Implementation Path

### Phase 2.5 (Current) — ✅ CAN IMPLEMENT

1. ✅ Static runtime foundation (DONE)
2. ✅ TypeScript verification (DONE)
3. ✅ Database audit (DONE)
4. ✅ Service health (DONE)
5. ⏭ Browser D1 rendering test
6. ⏭ Runtime context end-to-end verification
7. ⏭ Basic block completion (via existing API)
8. ⏸️ Navigation-node progress (BLOCKED — report limitation)

### Phase 2.6 (Future) — ❌ REQUIRES MIGRATION

1. Create `tutorial_block_progress` table
2. Add block-level identity columns
3. Add active time tracking
4. Add revision count
5. Add per-block timestamps
6. Migrate TutorialProgressRepository
7. Extend progress API
8. Implement heartbeat mechanism
9. Implement completion policies
10. Implement block-level UI

---

## Current Phase 2.5 Status

### VERIFIED ✅
- Static runtime foundation
- Runtime context propagation
- TypeScript: 0 errors
- D1 database record
- Services running
- Authentication (401 correctly returned)

### CAN TEST NOW ⏭
- D1 browser rendering
- Runtime context end-to-end
- Basic block completion tracking
- Failure isolation

### BLOCKED 🔴
- Navigation-node progress sidebar
- Block-level active time
- Revision count
- Block-level completion percentage
- Per-block analytics

---

## Recommendation

**Continue Phase 2.5 verification:**
1. Test D1 browser rendering
2. Verify runtime context propagation end-to-end
3. Test basic block completion via existing API
4. Document navigation-node progress as BLOCKED

**Do NOT implement:**
- Active time tracking (requires migration)
- Revision count (requires migration)
- Block-level progress indicators (requires migration)
- Navigation-node sidebar progress (requires migration)

**Future Phase 2.6:**
- Design block-level progress schema
- Plan migration strategy
- Implement backend changes
- Then implement UI features

---

## Next Steps

1. ✅ Continue to Phase 19: D1 Browser Test
2. ✅ Verify D1 renders in browser
3. ✅ Verify runtime context reaches D1
4. ✅ Test basic completion tracking
5. ❌ Do NOT claim navigation-node progress works
6. ❌ Do NOT fake block-level analytics
7. ✅ Document current capability honestly
8. ✅ Prepare Phase 2.6 requirements doc
