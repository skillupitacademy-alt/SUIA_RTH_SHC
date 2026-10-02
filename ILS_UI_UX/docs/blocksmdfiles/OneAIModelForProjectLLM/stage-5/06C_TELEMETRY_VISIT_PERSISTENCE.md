# Stage 5 — Block Visit Telemetry Persistence Evidence

**Document:** 06C_TELEMETRY_VISIT_PERSISTENCE  
**Status:** COMPLETE (extracted from historical evidence)  
**Audit Date:** 2026-10-02  
**Evidence Classification:** VERIFIED (complete visit chain from route → database with session-aware atomics)

---

## Overview

This document provides evidence for the complete block visit telemetry persistence chain, from API route through service layer, repository atomic operations, to the `block_learning_state` table with session-aware visit/revision counters.

**Critical Finding:** Visit tracking uses session-aware atomic SQL operations in the database to detect session transitions and increment visit/revision counters without application-layer race conditions.

---

## Complete Visit Chain

```text
POST /api/tutorial/ils/block-visit
  ↓ (Zod validation)
LearningProgressService.recordBlockVisit()
  ↓ (hierarchy validation, expectedTimeSec extraction)
BlockLearningStateRepository.upsert()
  ↓ (atomic SQL with session-aware counters)
block_learning_state table
```

---

## T1.1 API Route Handler

**File**: `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts` (180 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

### POST Handler

```typescript
export async function POST(req: NextRequest): Promise<NextResponse> {
  const identity = await getAuthenticatedIdentity(req);
  const body = await req.json();
  const { blockId, blockVersion, navigationNodeId, subtopicId, sessionId } = BlockVisitBodySchema.parse(body);
  
  const state = await learningProgressService.recordBlockVisit(
    identity,
    navigationNodeId,
    subtopicId,
    blockId,
    blockVersion,
    sessionId
  );
  
  return NextResponse.json(state);
}
```

### Input Validation

**Zod Schema**: `BlockVisitBodySchema`
- `blockId`: string (canonical block UUID)
- `blockVersion`: string (e.g., 'D1', 'C1', 'S1')
- `navigationNodeId`: string (page/sidebar context)
- `subtopicId`: string (tutorial page identity)
- `sessionId`: string (client-generated session ID)

### Authentication

- Uses `getAuthenticatedIdentity(req)` middleware
- Constructs `AuthenticatedIdentity` with userId and brand
- Session ID passed through to service layer

---

## T1.2 Service Layer

**File**: `packages/db-tutorial/src/services/learning-progress.service.ts` (offset 584-684)  
**Evidence status:** ✅ VERIFIED (method implementation read)

### recordBlockVisit() Implementation

```typescript
async recordBlockVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string
): Promise<BlockLearningState> {
  // 1. Validate inputs
  validateUserId(identity.userId);
  validateNavigationNodeId(navigationNodeId);
  validateBlockId(blockId);
  validateBlockVersion(blockVersion);
  validateSessionId(sessionId);
  validateSubtopicId(subtopicId);
  
  // 2. Validate navigation hierarchy
  await this.validateNavigationHierarchy(
    navigationNodeId,
    subtopicId,
    null,
    identity
  );
  
  // 3. Extract expectedTimeSec from published content
  const section = await this.sectionRepository.getTutorialByPageIdentity(
    subtopicId,
    navigationNodeId,
    identity.brand
  );
  
  let expectedTimeSec: number | null = null;
  if (section?.content?.blocks) {
    const block = section.content.blocks.find(
      (b: any) => b.id === blockId && b.version === blockVersion
    );
    expectedTimeSec = block?.expectedTimeSec ?? null;
  }
  
  const now = new Date();
  
  // 4. Single atomic upsert - repository handles all visit/revision logic
  const result = await this.blockLearningStateRepository.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    lastSessionId: sessionId,  // Database compares for session transition
    expectedTimeSec,
    lastViewedAt: now,
  });
  
  return result;
}
```

### Service Responsibilities

**DOES:**
- Input validation (userId, navigationNodeId, blockId, blockVersion, sessionId, subtopicId)
- Hierarchy validation (navigationNodeId ↔ subtopicId consistency)
- expectedTimeSec extraction from published TutorialDocument
- Single upsert call to repository

**DOES NOT:**
- Implement visit/revision logic (delegated to repository atomic SQL)
- Maintain session state (stateless service)
- Perform concurrency control (delegated to database)

### Design Note

Service does NOT implement visit/revision increment logic. All session-aware semantics are delegated to repository atomic SQL operations.

---

## T1.3 Repository Layer

**File**: `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` (offset 250-380)  
**Evidence status:** ✅ VERIFIED (method implementation read)

### upsert() Atomic Semantics

**Operation**: PostgreSQL `INSERT ... ON CONFLICT DO UPDATE`

**Conflict Target**: 4-part identity
```typescript
[
  blockLearningState.userId,
  blockLearningState.navigationNodeId,
  blockLearningState.blockId,
  blockLearningState.blockVersion,
]
```

**Partial Index**: `WHERE deleted_at IS NULL` (supports soft deletes)

**Concurrency**: SQL-level atomicity, no application-layer locking

### Counter Semantics (Phase 4.6)

**1. visitCount - Increments ONLY when session changes**

```typescript
visitCount: data.lastSessionId
  ? buildAtomicVisitCountIncrement(
      blockLearningState.visitCount,
      blockLearningState.lastSessionId,
      data.lastSessionId
    )
  : blockLearningState.visitCount,
```

**SQL Logic**:
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
  THEN visitCount + 1
  ELSE visitCount
END
```

**NULL-Safe Comparison**: `IS DISTINCT FROM` handles NULL ≠ 'session-123' correctly

**2. revisionCount - Increments when session changes AND block is completed**

```typescript
revisionCount: data.lastSessionId
  ? sql`
      CASE
        WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
          AND ${blockLearningState.completedAt} IS NOT NULL
        THEN ${blockLearningState.revisionCount} + 1
        ELSE ${blockLearningState.revisionCount}
      END
    `
  : blockLearningState.revisionCount,
```

**Semantic**: "Revisiting a completed block in a new session"

**3. firstViewedAt - Sets timestamp on first visit**

```typescript
firstViewedAt: data.lastSessionId
  ? buildAtomicFirstViewedAtInit(
      blockLearningState.firstViewedAt,
      blockLearningState.lastSessionId,
      now
    )
  : data.firstViewedAt !== undefined
    ? data.firstViewedAt
    : blockLearningState.firstViewedAt,
```

**SQL Logic**:
```sql
CASE
  WHEN lastSessionId IS NULL
  THEN currentTimestamp
  ELSE firstViewedAt
END
```

**Condition**: `lastSessionId IS NULL` indicates never visited before

**4. lastViewedAt - Always updated to now**

```typescript
lastViewedAt: data.lastViewedAt ?? now,
```

**5. lastSessionId - Persisted for next visit comparison**

```typescript
lastSessionId: data.lastSessionId ?? blockLearningState.lastSessionId,
```

**6. version - Atomically incremented for optimistic locking**

```typescript
version: buildAtomicVersionIncrement(blockLearningState.version),
```

### First Insert Behavior

```typescript
.values({
  userId: data.userId,
  navigationNodeId: data.navigationNodeId,
  blockId: data.blockId,
  blockVersion: data.blockVersion,
  lastSessionId: data.lastSessionId ?? null,
  expectedTimeSec: data.expectedTimeSec ?? null,
  visitCount: data.lastSessionId ? 1 : 0,  // Session-tracked visit starts at 1
  revisionCount: 0,
  activeTimeSec: 0,
  firstViewedAt: data.lastSessionId ? now : null,
  lastViewedAt: now,
  completedAt: null,
  version: 1,
  deletedAt: null,
})
```

### Update Behavior

See counter semantics above - all logic implemented in atomic SQL expressions.

---

## T1.4 SQL Helper Functions

**File**: `packages/db-tutorial/src/repositories/tutorial-navigation-progress-sql.helpers.ts` (offset 60-180)  
**Evidence status:** ✅ VERIFIED (complete functions read)

### Exported Helpers

**1. buildAtomicVisitCountIncrement() - Session-aware visit increment**

```typescript
export function buildAtomicVisitCountIncrement(
  visitCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  newSessionId: string
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
      THEN ${visitCountColumn} + 1
      ELSE ${visitCountColumn}
    END
  `;
}
```

**Examples**:
- `NULL IS DISTINCT FROM 'session-123'` → true (increment)
- `'session-123' IS DISTINCT FROM 'session-123'` → false (no increment)
- `'session-123' IS DISTINCT FROM 'session-456'` → true (increment)

**2. buildAtomicFirstViewedAtInit() - Timestamp initialization**

```typescript
export function buildAtomicFirstViewedAtInit(
  firstViewedAtColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  currentTimestamp: Date
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS NULL
      THEN ${currentTimestamp}
      ELSE ${firstViewedAtColumn}
    END
  `;
}
```

**Logic**: Set timestamp ONLY if `lastSessionId IS NULL` (never visited before)

**3. buildAtomicRevisionCountIncrement() - Completed block revisit**

```typescript
export function buildAtomicRevisionCountIncrement(
  revisionCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  statusColumn: PgColumn,
  newSessionId: string
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
        AND ${statusColumn} = 'completed'
      THEN ${revisionCountColumn} + 1
      ELSE ${revisionCountColumn}
    END
  `;
}
```

**4. buildAtomicTimeIncrement() - Simple cumulative time**

```typescript
export function buildAtomicTimeIncrement(
  timeSpentColumn: PgColumn,
  incrementSeconds: number
): SQL {
  return sql`${timeSpentColumn} + ${incrementSeconds}`;
}
```

**5. buildAtomicVersionIncrement() - Optimistic locking**

```typescript
export function buildAtomicVersionIncrement(versionColumn: PgColumn): SQL {
  return sql`${versionColumn} + 1`;
}
```

### Design Note

These helpers are **REUSED** for both page-level (`tutorial_navigation_progress`) and block-level (`block_learning_state`) telemetry, ensuring consistent semantics across the system.

---

## T1.5 Database Schema

**File**: `packages/db-tutorial/src/schema/block-learning-state.ts` (112 lines)  
**Evidence status:** ✅ VERIFIED (complete schema read)

### Table: block_learning_state

**Identity Columns** (4-part composite):
- `user_id`: UUID (learner identity, brand-scoped via existing identity model)
- `navigation_node_id`: TEXT (page/sidebar context, URL identity)
- `block_id`: TEXT (canonical block UUID from TutorialDocument)
- `block_version`: TEXT (e.g., 'D1', 'C1', 'S1')

**Telemetry Counters**:
- `visit_count`: INTEGER DEFAULT 0 (atomic session-aware increment)
- `revision_count`: INTEGER DEFAULT 0 (atomic completed-block revisit increment)
- `active_time_sec`: INTEGER DEFAULT 0 (cumulative measured engagement time)

**Session Tracking** (Phase 4.6):
- `last_session_id`: TEXT NULLABLE (NULL = no prior session, enables atomic first-visit detection)

**Authored Metadata**:
- `expected_time_sec`: INTEGER NULLABLE (extracted from published TutorialDocument, may not exist for all blocks)

**Timestamps**:
- `first_viewed_at`: TIMESTAMP NULLABLE (atomic initialization on first visit)
- `last_viewed_at`: TIMESTAMP NULLABLE (always updated)
- `completed_at`: TIMESTAMP NULLABLE (denormalized from `tutorial_navigation_progress.completed_blocks[]` — NOT authoritative)

**Audit Fields**:
- `version`: INTEGER DEFAULT 1 (optimistic locking)
- `created_at`: TIMESTAMP NOT NULL
- `updated_at`: TIMESTAMP NOT NULL
- `deleted_at`: TIMESTAMP NULLABLE (soft delete)

### Unique Index

```sql
CREATE UNIQUE INDEX uq_block_learning_state_identity
  ON block_learning_state (user_id, navigation_node_id, block_id, block_version)
  WHERE deleted_at IS NULL;
```

### Query Indexes

- `idx_block_learning_state_user`: `(user_id)` — learner dashboard
- `idx_block_learning_state_node`: `(user_id, navigation_node_id)` — page-level aggregation
- `idx_block_learning_state_block`: `(block_id, block_version)` — cross-page analytics
- `idx_block_learning_state_last_viewed`: `(user_id, last_viewed_at)` — recommendations

---

## T1.6 Architecture Notes

### Session-Aware Semantics (Phase 4.6)

**Session Transition Detection**:
- Database compares `lastSessionId IS DISTINCT FROM newSessionId`
- NULL-safe: `NULL IS DISTINCT FROM 'session-id'` → true
- Same session: `'id-A' IS DISTINCT FROM 'id-A'` → false

**First Visit Detection**:
- `lastSessionId IS NULL` means never visited before
- Initializes `firstViewedAt` timestamp
- Sets `visitCount = 1`

**Atomic Counters**:
- All increment logic in SQL
- No application-layer read-modify-write
- No race conditions under concurrent requests

**NULL-Safe Comparison**:
- `IS DISTINCT FROM` operator handles NULL correctly
- Standard `=` or `!=` would fail with NULL values

### Telemetry vs Completion Authority

**Completion Authority**: `tutorial_navigation_progress.completed_blocks[]` (canonical)

**Telemetry State**: `block_learning_state.completed_at` (denormalized, for query convenience)

**Boundary**: 
- Completion chain (Phase B) updates BOTH tables
- Telemetry chain (T1) only READS completion status for revision logic
- Visit tracking does NOT modify completion state

### Cross-Page Blocks

- Same `(blockId, blockVersion)` on different `navigationNodeId` creates SEPARATE telemetry records
- Design: Telemetry measures per-page engagement, not global block engagement
- Rationale: Same educational content may have different learning contexts

### Brand Isolation

- `userId` already brand-scoped via existing identity model
- No explicit brand column needed in `block_learning_state`
- Repository queries filtered by authenticated brand context

### Concurrency Safety

**PostgreSQL ON CONFLICT**:
- Provides row-level locking during upsert
- Atomic INSERT or UPDATE operation
- No lost updates under concurrent requests

**Atomic SQL Operations**:
- All counter updates in SQL expressions
- No read-modify-write in application code
- Database guarantees atomicity

**Optimistic Locking**:
- `version` column detects concurrent updates
- Upsert minimizes conflicts (single operation)

---

## T1.7 Test Coverage

### Unit Tests

**File**: `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`

**Verified Scenarios**:
- First visit creates `visitCount=1`
- Same session does NOT increment visit
- New session increments visit
- New session + completed block increments revision
- 4-part identity isolation (different versions = different records)
- Soft delete handling (partial unique index)
- Brand isolation (RTH vs SkillUp users)
- Concurrency (10 parallel visits = visitCount=1 if same session)

### Integration Gate Scripts

**Production integration tests (real PostgreSQL)**:

1. **`scripts/_gate_3c1r_test_phase_d_lifecycle.ts`**
   - Visit/revision lifecycle scenarios
   - First visit initialization
   - Session transitions
   - Completion + revision

2. **`scripts/_gate_3c1r_test_phase_d_sessions.ts`**
   - Session transition semantics
   - NULL → sessionId (first visit)
   - sessionA → sessionB (new session)
   - Same session repeated

3. **`scripts/_gate_3c1r_test_phase_d_concurrency.ts`**
   - Parallel visit handling
   - Concurrent same-session requests
   - Concurrent different-session requests
   - Atomic counter behavior

4. **`scripts/_gate_3c1r_test_phase_d_consistency.ts`**
   - Identity isolation (user/node/block/version)
   - Soft delete recovery
   - Brand isolation

---

## T1.8 Summary

### Complete Visit Chain

```text
POST /api/tutorial/ils/block-visit
  ↓ (Zod validation)
LearningProgressService.recordBlockVisit()
  ↓ (hierarchy validation, expectedTimeSec extraction)
BlockLearningStateRepository.upsert()
  ↓ (atomic SQL with session-aware counters)
block_learning_state table
```

### Key Properties

- **Atomic**: Single SQL operation, no race conditions
- **Session-Aware**: Database detects session transitions via `IS DISTINCT FROM`
- **First-Visit Initialization**: `lastSessionId IS NULL` triggers timestamps/counters
- **Revision Semantic**: New session + completed block = revision increment
- **Concurrency-Safe**: PostgreSQL `ON CONFLICT` + atomic SQL counters
- **Reusable Helpers**: Shared SQL builders for page-level and block-level telemetry
- **Partial Index**: Soft delete support via `WHERE deleted_at IS NULL`
- **4-Part Identity**: (userId, navigationNodeId, blockId, blockVersion)
- **Cross-Page Tracking**: Same block on different pages = separate records

### Verified Through

- Route handler inspection (180 lines)
- Service method logic (100+ lines)
- Repository atomic SQL (130+ lines)
- Schema definition (112 lines)
- SQL helper functions (5 reusable builders)
- Unit tests (Phase 4.3 test suite)
- Integration gate scripts (4 production tests)

---

## Cross-References

- **Runtime Providers**: See `06A_RUNTIME_PROVIDERS.md` (BlockTelemetryProvider)
- **Completion Chain**: See `06B_COMPLETION_AND_PROGRESS_RUNTIME.md`
- **Active-Time Persistence**: See `06D_TELEMETRY_ACTIVE_TIME_PERSISTENCE.md`
- **Authority Reconciliation**: See `06E_TELEMETRY_AUTHORITY_AND_LEDGER.md` (T3 investigation)
