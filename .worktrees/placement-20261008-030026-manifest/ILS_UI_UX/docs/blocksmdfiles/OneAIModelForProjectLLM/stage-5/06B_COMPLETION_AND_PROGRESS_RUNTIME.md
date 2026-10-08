# Stage 5 — Block Completion and Progress Runtime Evidence

**Document:** 06B_COMPLETION_AND_PROGRESS_RUNTIME  
**Status:** COMPLETE (extracted from historical evidence)  
**Audit Date:** 2026-10-02  
**Evidence Classification:** VERIFIED (complete completion chain from client → database)

---

## Overview

This document provides evidence for the complete block completion persistence chain, from client-side orchestration through API routes, service layer, repository persistence, to the canonical database authority in `tutorial_navigation_progress.completed_blocks[]`.

**Critical Finding:** Canonical block completion authority is `tutorial_navigation_progress.completed_blocks[]`, NOT `block_learning_state.completed_at`. The two persistence models have distinct responsibilities with defined authority boundaries.

---

## Complete Completion Chain

```text
InstructionalBlockCompletionOrchestrator
        ↓
markBlockComplete() [tutorialTrackingService]
        ↓
trackTutorialEvent({ eventType: 'block_complete', ... })
        ↓
POST /api/tutorial/ils/block-completion
        ↓
API Route (authentication + validation)
        ↓
LearningProgressService.recordBlockCompletion()
        ↓
TutorialNavigationProgressRepository.markBlockCompleted()
        ↓
Atomic JSONB append with deduplication
        ↓
tutorial_navigation_progress.completed_blocks[]
```

---

## B.1 Client-Side Completion Service

**File:** `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts` (310 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

### markBlockComplete() Implementation

```typescript
export async function markBlockComplete(
  learnerId: string,      // LEGACY PARAMETER (API ignores, uses auth cookies)
  subtopicId: string,
  navigationNodeId: string,
  sectionId: string | null,
  blockId: string,
  blockType: string,
  blockVersion: string
): Promise<TrackingDeliveryResult> {
  const result = await trackTutorialEvent({
    eventType: 'block_complete',
    learnerId,
    navigationNodeId,
    sectionId,
    subtopicId,
    blockId,
    blockType,
    blockVersion,
  });
  return result; // { delivered: boolean, reason?: string }
}
```

### trackTutorialEvent() Internals

**1. Input Validation:**
- Requires: blockId, blockType, blockVersion, subtopicId, navigationNodeId
- Returns `{ delivered: false, reason: 'validation' }` if missing

**2. Block Type Mapping:**
```typescript
const mapping = {
  'definition': 'technical', // D1 → technical section type
  'code': 'code',           // C1 → code section type
  'summary': 'summary',     // S1 → summary section type
};
const backendBlockType = mapping[blockType] || blockType;
```

**3. API Request:**
```typescript
fetch('/api/tutorial/ils/block-completion', {
  method: 'POST',
  credentials: 'include', // Auth cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    navigationNodeId,
    subtopicId,
    sectionId,
    blockId,
    blockType: backendBlockType,
    blockVersion,
    // sessionId intentionally NOT sent
  }),
});
```

**4. Session Tracking Policy:**
- Completion does NOT send sessionId (by design)
- Repository explicitly sets `lastSessionId: null` for completions
- Session tracking happens via visit flow only
- Revision detection uses visit-based session transitions

**5. Authentication:**
- `learnerId` parameter is legacy (API ignores)
- Actual authentication via `credentials: 'include'` (cookies)
- API derives userId from validated request context

**6. Return Value:**
```typescript
{ delivered: true }  // HTTP 2xx
{ delivered: false, reason: 'http' | 'network' | 'validation' }
```

### Failure Isolation

**Critical architectural principle:**
- Tracking failure MUST NOT prevent content rendering
- Returns explicit delivery result (not exception)
- Caller can distinguish delivered vs failed
- Silent failure with console logging

---

## B.2 Backend API Route

**File:** `apps/api-server/src/app/api/tutorial/ils/block-completion/route.ts` (126 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

### POST Handler Implementation

```typescript
export async function POST(request: NextRequest) {
  // 1. Validate internal authentication
  const authValidation = validateRequest(request, { requireInternalSecret: true });
  if (authValidation.error) return authValidation.error;
  
  const { context } = authValidation;
  
  // 2. Construct authenticated identity
  const sessionId = request.headers.get('x-session-id');
  const identity: AuthenticatedIdentity = {
    userId: context.userId,
    brand: context.brand,
    sessionId: sessionId !== null && sessionId !== '' ? sessionId : undefined,
  };
  
  // 3. Parse request body
  const parsed = recordBlockCompletionBodySchema.safeParse(body);
  
  // 4. Instantiate service + repositories
  const progressRepo = new TutorialNavigationProgressRepository();
  const sectionRepo = new TutorialSectionRepository();
  const blockRepo = new BlockLearningStateRepository();
  const telemetryRepo = new BlockTelemetryEventRepository();
  const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo, telemetryRepo);
  
  // 5. Call service
  const progress = await service.recordBlockCompletion(
    identity,
    parsed.data.navigationNodeId,
    parsed.data.subtopicId,
    parsed.data.sectionId,
    parsed.data.blockId,
    parsed.data.blockType,
    parsed.data.blockVersion,
    parsed.data.sessionId
  );
  
  // 6. Return progress DTO
  return NextResponse.json({ data: progress }, { status: 200 });
}
```

### Authentication Boundary

- Requires `X-Internal-Secret` header (BFF → API server authentication)
- Extracts `userId` and `brand` from validated context
- Constructs `AuthenticatedIdentity` for service layer

### Error Handling

- `NavigationNodeNotFoundError` → 404
- `InvalidNavigationHierarchyError` → 400
- `InvalidBlockCompletionError` → 400
- Uncaught errors → 500

---

## B.3 Service Layer

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts` (1000+ lines)  
**Evidence status:** ✅ VERIFIED (method implementation read)

### recordBlockCompletion() Implementation

```typescript
async recordBlockCompletion(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  sectionId: string | null,
  blockId: string,
  blockType: string,
  blockVersion: string,
  sessionId?: string
): Promise<NavigationProgressWithCalculatedDTO> {
  // 1. Validate inputs
  validateUserId(identity.userId);
  validateNavigationNodeId(navigationNodeId);
  validateBlockId(blockId);
  validateBlockVersion(blockVersion);
  
  // 2. Validate hierarchy using authenticated brand
  await this.validateNavigationHierarchy(
    navigationNodeId,
    subtopicId,
    sectionId,
    identity
  );
  
  // 3. Ensure progress record exists
  await this.getNavigationProgress(identity, navigationNodeId, subtopicId, sectionId);
  
  // 4. Create completion event
  const event: TutorialBlockCompletionEvent = {
    userId: identity.userId,
    navigationNodeId,
    sectionId,
    subtopicId,
    blockId,
    blockType,
    blockVersion,
    sessionId,
    occurredAt: new Date(),
  };
  
  // 5. Persist completion via repository
  const updated = await this.progressRepository.markBlockCompleted(event);
  
  // 6. Resolve required blocks from canonical content
  const requiredBlocks = await this.resolveRequiredBlocks(
    subtopicId,
    navigationNodeId,
    identity
  );
  
  // 7. Return DTO with calculated progress
  return this.toDTO(updated, requiredBlocks, []);
}
```

### Service Responsibilities

**DOES:**
- Identity validation (userId matches authenticated identity)
- Navigation node validation (belongs to subtopicId via tutorial sections)
- Hierarchy consistency validation (sectionId matches navigationNodeId)
- Progress record existence guarantee
- Required blocks resolution (from canonical section content)
- DTO construction with calculated progress

**DOES NOT:**
- Direct database access
- SQL generation
- Concurrency safety (delegated to repository)
- Idempotency guarantees (delegated to repository)

---

## B.4 Repository Persistence

**File:** `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts` (800+ lines)  
**Evidence status:** ✅ VERIFIED (method implementation read)

### markBlockCompleted() Three-Path Logic

**Path 1: No existing record**
```typescript
// INSERT new record with first completion
INSERT INTO tutorial_navigation_progress (
  user_id, navigation_node_id, section_id, subtopic_id,
  status, completed_blocks, visit_count, last_session_id, ...
) VALUES (
  userId, navigationNodeId, sectionId, subtopicId,
  'in_progress', 
  [{ blockId, blockVersion, completedAt }],
  1,
  null,  // Do not set session from completion
  ...
)
ON CONFLICT (user_id, navigation_node_id) WHERE deleted_at IS NULL
  DO NOTHING
RETURNING *
```

If conflict (concurrent INSERT), recursively retry with existing record.

**Path 2: Block+version already completed (idempotent)**
```typescript
// Check if alreadyCompleted
const alreadyCompleted = completedBlocks.some(
  record => record.blockId === blockId && record.blockVersion === blockVersion
);

if (alreadyCompleted) {
  // No-op for completion, update lastViewedAt only
  UPDATE tutorial_navigation_progress
  SET
    last_viewed_at = now,
    version = version + 1,
    updated_at = now
  WHERE id = existingId AND deleted_at IS NULL
  RETURNING *
}
```

**Path 3: New completion (atomic append)**
```typescript
// Add new completion record with deduplication
UPDATE tutorial_navigation_progress
SET
  completed_blocks = buildAtomicBlockAppend(
    completed_blocks,
    blockId,
    blockVersion,
    { blockId, blockVersion, completedAt }
  ),
  status = CASE WHEN status = 'not_started' THEN 'in_progress' ELSE status END,
  last_viewed_at = now,
  version = version + 1,
  updated_at = now
WHERE id = existingId AND deleted_at IS NULL
RETURNING *
```

### Atomic JSONB Operations

**`buildAtomicBlockAppend()`:**
- Atomic JSONB operation
- Appends new record ONLY if (blockId, blockVersion) doesn't already exist in array
- Prevents both lost updates AND duplicates under concurrent requests
- SQL-level deduplication (no application-level race conditions)

### Concurrency Safety

- **Atomic JSONB operations** prevent lost updates
- **Deduplication inside UPDATE** prevents duplicate entries
- **ON CONFLICT DO NOTHING** handles concurrent INSERTs
- **Recursive retry** handles conflict scenarios
- **version increment** enables optimistic locking

### Session Tracking Policy

**CRITICAL:** Completions do NOT update `last_session_id`.

From source comments:
> `lastSessionId` is VISIT-OWNED: only `recordVisit()` may modify it  
> `recordTime()` and `markBlockCompleted()` must NOT modify `lastSessionId`

**Rationale:** Session tracking happens via visit flow only. Revision detection uses visit-based session transitions.

---

## B.5 Database Schema

**File:** `packages/db-tutorial/src/schema/tutorial-navigation-progress.ts` (113 lines)  
**Evidence status:** ✅ VERIFIED (complete schema read)

### Table Structure

```sql
CREATE TABLE tutorial_navigation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  user_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,
  section_id UUID,
  subtopic_id UUID NOT NULL,
  
  -- Progress state
  status tutorial_progress_status NOT NULL DEFAULT 'not_started',
  completed_blocks JSONB NOT NULL DEFAULT '[]',
  
  -- Time tracking
  time_spent_active_sec INTEGER NOT NULL DEFAULT 0,
  
  -- Session tracking
  visit_count INTEGER NOT NULL DEFAULT 0,
  revision_count INTEGER NOT NULL DEFAULT 0,
  last_session_id TEXT,
  
  -- Timestamps
  first_viewed_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Audit
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX uq_navigation_progress_user_node
  ON tutorial_navigation_progress(user_id, navigation_node_id)
  WHERE deleted_at IS NULL;
```

### JSONB: completed_blocks

**Type:** `Array<CompletedBlockRecord>`

**Structure:**
```typescript
interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string;
  completedAt: string; // ISO 8601 timestamp
}
```

**Properties:**
- Stores full completion history
- Preserves version information for content revision tracking
- Supports multiple completions of same blockId with different versions
- Atomic JSONB operations prevent concurrency issues

---

## B.6 Canonical Completion Authority

**Critical architectural finding from service source comments:**

```text
CANONICAL COMPLETION AUTHORITY:
    tutorial_navigation_progress.completed_blocks[]

TELEMETRY-DERIVED STATE:
    block_learning_state (activeTimeSec, visitCount, expectedTimeSec, etc.)
    
LEGACY FALLBACK:
    block_learning_state.completed_at (denormalized, may be null)
```

**From `block-learning-state.ts` schema comments:**
> `completedAt`: Denormalized completion timestamp  
> (authoritative source: `tutorial_navigation_progress.completed_blocks`)

### DTO Construction Pattern

```typescript
toDTO(
  navigationProgress: TutorialNavigationProgressRecord,  // ← Canonical completion
  requiredBlocks: RequiredBlock[],
  blockStates: BlockLearningState[]  // ← Telemetry state
): NavigationProgressWithCalculatedDTO {
  // Combine canonical completion + telemetry state
  // Completion authority: navigationProgress.completedBlocks
  // Time/visit/revision authority: blockStates
}
```

### Authority Table

| Concern | Authority | Table |
|---------|-----------|-------|
| Block completion (which blocks done) | ✅ CANONICAL | tutorial_navigation_progress.completed_blocks |
| Active time (how long spent) | ✅ CANONICAL | block_learning_state.active_time_sec |
| Visit count (how many sessions) | ✅ CANONICAL | block_learning_state.visit_count |
| Expected time (metadata) | ✅ CANONICAL | block_learning_state.expected_time_sec |
| Revision count | ✅ CANONICAL | block_learning_state.revision_count |
| Session state | ✅ CANONICAL | block_learning_state.last_session_id |
| Legacy completion timestamp | ⏳ DENORMALIZED | block_learning_state.completed_at |

**Architecture pattern:** Two related state models with defined authority boundaries, not competing completion stores.

---

## B.7 Evidence Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| Client-side completion chain | ✅ VERIFIED | markBlockComplete → trackTutorialEvent → POST |
| API route implementation | ✅ VERIFIED | Authentication, service instantiation, error handling |
| Service layer logic | ✅ VERIFIED | Validation, hierarchy check, event creation, persistence call |
| Repository persistence | ✅ VERIFIED | Three-path logic, atomic JSONB, idempotency, concurrency safety |
| Database schema | ✅ VERIFIED | completed_blocks JSONB, unique constraint, indexes |
| Canonical completion authority | ✅ VERIFIED | tutorial_navigation_progress.completed_blocks |
| Session tracking policy | ✅ VERIFIED | Completions do NOT update lastSessionId |
| Completion identity | ✅ VERIFIED | (userId, navigationNodeId, blockId, blockVersion) |
| Idempotency guarantee | ✅ VERIFIED | Same block+version = no-op |
| Version-aware completion | ✅ VERIFIED | Different blockVersion = new completion record |
| Concurrency safety | ✅ VERIFIED | Atomic JSONB append with deduplication |

---

## Cross-References

- **Runtime Providers**: See `06A_RUNTIME_PROVIDERS.md` (InstructionalBlockCompletionOrchestrator)
- **Visit Persistence**: See `06C_TELEMETRY_VISIT_PERSISTENCE.md`
- **Active-Time Persistence**: See `06D_TELEMETRY_ACTIVE_TIME_PERSISTENCE.md`
- **Authority Reconciliation**: See `06E_TELEMETRY_AUTHORITY_AND_LEDGER.md` (T3 investigation)
