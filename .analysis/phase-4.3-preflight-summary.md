# Phase 4.3 Preflight Summary

**Date:** 2026-09-05  
**Phase:** 4.3 - Service Layer  
**Status:** Source Inspection Complete

---

## Baseline Verified

- Branch: `main`
- HEAD: `fe005a51` (Phase 4.1)
- Phase 4.2: ✅ Present (BlockLearningStateRepository)
- Working Tree: Clean except unrelated playwright-report

---

## Phase 4.2 Repository Contract (Verified)

**Class:** `BlockLearningStateRepository extends TutorialRepositoryBase`

**Methods:**
- `findOne(identity)` - 4-part identity lookup
- `create(data)` - Initial state
- `update(id, data)` - Partial updates
- `upsert(data)` - Atomic counters + conflict handling
- `findByUser(userId)`
- `findByNavigationNode(userId, navigationNodeId)`
- `findCompleted(userId)`
- `softDelete(id)`

**Key Patterns:**
- Atomic increments: `buildAtomicTimeIncrement()`
- Atomic version: `buildAtomicVersionIncrement()`
- Soft-delete: `activeBlockState = isNull(deletedAt)`
- Upsert semantics: counters as INCREMENTS on conflict

---

## Existing Service Architecture (Verified)

**Service:** `LearningProgressService`

**Constructor Pattern:**
```typescript
constructor(
  private readonly progressRepository: ITutorialNavigationProgressRepository,
  private readonly sectionRepository: TutorialSectionRepository
)
```

**Existing Page-Level Methods:**
- `recordVisit(identity, navigationNodeId, subtopicId, sessionId, sectionId?)`
- `recordActiveTime(identity, navigationNodeId, subtopicId, timeSpentSec)`
- `recordBlockCompletion(identity, navigationNodeId, subtopicId, sectionId, blockId, blockType, blockVersion, sessionId?)`
- `completeNavigationNode(identity, navigationNodeId, subtopicId)`

**Session Semantics (Existing):**
- Same session → no visit increment
- New session → visit increment
- Completed + new session → revision increment
- Session ID required for visit tracking

**Validation:** Uses separate validation module functions

**Time Limits:** Page-level max = 3600 seconds

---

## Phase 4.3 Implementation Decision

**Extend `LearningProgressService` with block-level methods:**

1. `recordBlockVisit(identity, navigationNodeId, subtopicId, blockId, blockVersion, sessionId)`
2. `recordBlockActiveTime(identity, navigationNodeId, subtopicId, blockId, blockVersion, activeTimeSec)`
3. `calculateBlockTimeComparison(blockState)` - Pure calculation only

**NOT implementing in Phase 4.3:**
- API routes
- Runtime integration
- ILSProvider modifications
- ActiveBlockContext modifications

---

## Key Architectural Constraints

- ✅ NO sessionId in `block_learning_state` table
- ✅ Session logic in service orchestration
- ✅ Repository provides atomic persistence
- ✅ Service provides business logic + validation
- ✅ Block-level time limit: 600 seconds (tighter than page)
- ✅ Generic (no block-type switches)

---

## Status

Source inspection COMPLETE. Ready for implementation.
