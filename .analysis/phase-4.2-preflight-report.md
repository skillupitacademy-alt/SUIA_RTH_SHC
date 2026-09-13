# Phase 4.2 Preflight Report

**Date:** 2026-09-05  
**Phase:** 4.2 - Repository Layer  
**Baseline Commit:** `fe005a51` (Phase 4.1 certified)

---

## Authorization Status

✅ **AUTHORIZED:** `BEGIN PHASE 4.2` received  
✅ **Baseline Verified:** HEAD at `fe005a51` (Phase 4.1 certified)  
✅ **Working Tree:** Clean (except unrelated `playwright-report/index.html`)

---

## Phase 4.2 Baseline Test Results

**Command:** `cd packages/db-tutorial && pnpm test`

**Result (BEFORE Phase 4.2 implementation):**
```
Test Files: 13 failed | 25 passed (38 total)
```

**Pre-existing Failures:** 13 test files  
**Category:** Duplicate key constraint violations (test isolation issue)  
**Assessment:** Documented in Phase 4.1 audit as pre-existing

---

## Source Inspection Summary

### 1. Repository Directory Structure

**Location:** `packages/db-tutorial/src/repositories/`

**Existing Repositories:**
- `base.repository.ts` - Abstract base class
- `tutorial-progress.repository.ts` - Subtopic-level progress
- `tutorial-navigation-progress.repository.ts` - Page-level ILS telemetry ⭐ KEY REFERENCE
- `tutorial-section.repository.ts` - Content management
- Others: assignment, project, live-session, content

**Test Directory:** `packages/db-tutorial/src/repositories/__tests__/`

---

### 2. Repository Base Pattern

**File:** `base.repository.ts`

**Constructor Pattern:**
```typescript
abstract class TutorialRepositoryBase {
  constructor(protected dbInstance: typeof db = db) {}
  abstract withDb(dbClient: TutorialDbClientLike): this;
  
  protected runRead<T>(queryPromise: Promise<T>, description: string): Promise<T> {
    return withTimeout(queryPromise, STANDARD_QUERY_TIMEOUT, description);
  }
}
```

**Key Patterns:**
- ✅ Constructor accepts `dbInstance` with default
- ✅ `withDb()` method for transaction support
- ✅ `runRead()` wrapper for query timeout
- ✅ Description string for debugging/logging

**Assessment:** Phase 4.2 repository must extend `TutorialRepositoryBase`

---

### 3. Existing Page-Level ILS Repository

**File:** `tutorial-navigation-progress.repository.ts`

**Critical Reference for Phase 4.2:**

This repository implements page-level telemetry with patterns directly applicable to block-level:

#### Identity Pattern
```typescript
async getProgress(
  userId: string,
  navigationNodeId: string
): Promise<TutorialNavigationProgressRecord | undefined>
```

**Uses:** `(userId, navigationNodeId)` as logical identity  
**Phase 4.2:** Will use `(userId, navigationNodeId, blockId, blockVersion)`

#### Atomic SQL Patterns

**Helpers File:** `tutorial-navigation-progress-sql.helpers.ts`

Functions available for reuse:
- `buildAtomicTimeIncrement(column, seconds)` - Concurrent-safe time accumulation
- `buildAtomicVersionIncrement(column)` - Optimistic locking
- `buildAtomicBlockAppend(column, blockId, blockVersion, record)` - JSONB deduplication
- `buildAtomicVisitCountIncrement(column, lastSessionColumn, newSession)` - Session transition
- `buildAtomicRevisionCountIncrement(column, lastSessionColumn, statusColumn, newSession)` - Revision detection
- `buildAtomicFirstViewedAtInit(column, lastSessionColumn, timestamp)` - First-view detection

**Assessment:** Phase 4.2 can reuse `buildAtomicTimeIncrement` and `buildAtomicVersionIncrement`

#### Visit Semantics (SESSION-AWARE)

```typescript
async recordVisit(event: TutorialVisitEvent): Promise<...> {
  // Session transition logic
  // Visit count increment when session changes
  // Revision count increment when revisiting completed node in new session
  // firstViewedAt initialization on first visit
}
```

**KEY INSIGHT:** Page-level repository REQUIRES sessionId for visit semantics

**Phase 4.2 Implication:**
- Block-level telemetry is **session-agnostic** (frozen architecture)
- NO `lastSessionId` column in `block_learning_state`
- Visit logic must be implemented differently OR deferred to service layer

---

#### Concurrency Safety

```typescript
// INSERT with ON CONFLICT
.insert(tutorialNavigationProgress)
.values({ ... })
.onConflictDoNothing({
  target: [table.userId, table.navigationNodeId],
  where: sql`${table.deletedAt} IS NULL`,  // ⭐ CRITICAL for partial unique index
})
.returning()
```

**Pattern:**
1. Attempt INSERT with conflict target
2. Include WHERE clause for partial unique index (soft-delete)
3. If conflict, SELECT and retry

**Phase 4.2 Identity:**
```typescript
target: [
  blockLearningState.userId,
  blockLearningState.navigationNodeId,
  blockLearningState.blockId,
  blockLearningState.blockVersion
],
where: sql`${blockLearningState.deletedAt} IS NULL`
```

---

#### Soft Delete Pattern

```typescript
const activeProgress = isNull(tutorialNavigationProgress.deletedAt);

// All queries use:
.where(and(
  eq(table.userId, userId),
  activeProgress  // ⭐ Standard soft-delete filter
))
```

**Assessment:** Phase 4.2 must use same pattern

---

#### Atomic Updates

```typescript
.update(tutorialNavigationProgress)
.set({
  timeSpentActiveSec: buildAtomicTimeIncrement(
    tutorialNavigationProgress.timeSpentActiveSec,
    event.timeSpentActiveSec
  ),
  version: buildAtomicVersionIncrement(tutorialNavigationProgress.version),
  updatedAt: now,
})
.where(and(
  eq(tutorialNavigationProgress.id, existing.id),
  activeProgress
))
.returning()
```

**Pattern:**
1. Use atomic SQL expressions for counters
2. Include version increment for optimistic locking
3. Update `updatedAt`
4. Include soft-delete safety in WHERE
5. Return updated record

---

### 4. Phase 4.1 Schema Verification

**File:** `packages/db-tutorial/src/schema/block-learning-state.ts`

**Exported Table:** `blockLearningState`

**Identity Columns:**
```typescript
userId: uuid('user_id').notNull()
navigationNodeId: text('navigation_node_id').notNull()
blockId: text('block_id').notNull()
blockVersion: text('block_version').notNull()
```

**Telemetry Columns:**
```typescript
visitCount: integer('visit_count').notNull().default(0)
revisionCount: integer('revision_count').notNull().default(0)
activeTimeSec: integer('active_time_sec').notNull().default(0)
expectedTimeSec: integer('expected_time_sec')  // nullable
```

**Timestamps:**
```typescript
firstViewedAt: timestamp('first_viewed_at', { mode: 'date' })
lastViewedAt: timestamp('last_viewed_at', { mode: 'date' })
completedAt: timestamp('completed_at', { mode: 'date' })
```

**Audit:**
```typescript
version: integer('version').notNull().default(1)
createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
deletedAt: timestamp('deleted_at', { mode: 'date' })
```

**Unique Index:**
```typescript
uqBlockLearningStateIdentity: uniqueIndex('uq_block_learning_state_identity')
  .on(table.userId, table.navigationNodeId, table.blockId, table.blockVersion)
  .where(sql`${table.deletedAt} IS NULL`)
```

**Additional Indexes:**
- `idx_block_learning_state_user` - user lookup
- `idx_block_learning_state_node` - navigation node lookup
- `idx_block_learning_state_block` - block lookup
- `idx_block_learning_state_last_viewed` - last viewed lookup

**Assessment:** ✅ Schema matches frozen architecture exactly

---

### 5. Test Infrastructure

**Pattern Observed:**

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database client
const createDbMock = ({
  selectRows = [makeRow()],
  insertRow = makeRow(),
  updateRow = makeRow(),
}) => {
  // Mock select/insert/update chains
  const where = vi.fn(async () => selectRows);
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where })) }));
  // ...
};

describe('RepositoryName', () => {
  beforeEach(() => {
    // Clear mocks
  });

  describe('methodName', () => {
    it('behavior description', async () => {
      const db = createDbMock();
      const repo = new Repository(db as never);
      
      await repo.method(...);
      
      expect(db.method).toHaveBeenCalled();
      expect(result).toEqual(...);
    });
  });
});
```

**Assessment:** Phase 4.2 tests should follow this mock-based unit test pattern

---

## Contract Resolution

### Repository Contract vs Domain Methods

**Project Material References:**

1. **CRUD/Query Contract:**
   - `create(data)` - Insert new record
   - `findOne(identity)` - Lookup by complete identity
   - `update(id, data)` - Update existing record
   - `upsert(identity, data)` - Create or update
   - `findByUser(userId)` - Query user's records
   - `findByNavigationNode(userId, navigationNodeId)` - Query node's records
   - `findCompleted(userId)` - Query completed records
   - `softDelete(id)` - Mark as deleted

2. **Domain Methods (from architecture discussion):**
   - `recordVisit(...)` - Visit tracking
   - `recordTime(...)` - Time tracking
   - `getBlockState(...)` - State retrieval

### Resolution Decision

After inspecting `tutorial-navigation-progress.repository.ts`:

**OBSERVATION:** The page-level repository implements BOTH patterns:
- Basic CRUD: `findById`, `getProgress`, `createProgress`
- Domain methods: `recordVisit`, `recordTime`, `markBlockCompleted`, `completeNode`

**However, domain methods at PAGE level are session-aware:**
```typescript
recordVisit(event: { sessionId: string, ... })
```

**FROZEN ARCHITECTURE CONSTRAINT:**
- Block learning state is **session-agnostic**
- NO `lastSessionId` in `block_learning_state`
- Session logic belongs to service/runtime layer

### Phase 4.2 Decision

**IMPLEMENT CRUD/QUERY CONTRACT ONLY:**

```typescript
class BlockLearningStateRepository extends TutorialRepositoryBase {
  // Identity lookup
  async findOne(identity: BlockIdentity): Promise<BlockLearningState | null>
  
  // Create (used by service layer on first interaction)
  async create(data: CreateBlockLearningStateInput): Promise<BlockLearningState>
  
  // Update (explicit updates from service layer)
  async update(id: string, data: UpdateBlockLearningStateInput): Promise<BlockLearningState>
  
  // Upsert (atomic create-or-update for telemetry)
  async upsert(data: UpsertBlockLearningStateInput): Promise<BlockLearningState>
  
  // Queries
  async findByUser(userId: string): Promise<BlockLearningState[]>
  async findByNavigationNode(userId: string, navigationNodeId: string): Promise<BlockLearningState[]>
  async findCompleted(userId: string): Promise<BlockLearningState[]>
  
  // Soft delete
  async softDelete(id: string): Promise<void>
  
  // Transaction support
  withDb(dbClient: TutorialDbClientLike): this
}
```

**Rationale:**
1. Domain methods like `recordVisit()` require session semantics
2. Block state is session-agnostic per frozen architecture
3. Service layer (Phase 4.3) will orchestrate visit/time logic
4. Repository provides clean persistence primitives
5. Matches CRUD/query contract from project material

**NOT IMPLEMENTING (deferred to service layer):**
- `recordVisit()` - Requires session logic
- `recordTime()` - Orchestration belongs in service
- Session-aware visit deduplication - Service responsibility

---

## Type Contracts

### Input Types

```typescript
interface BlockIdentity {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
}

interface CreateBlockLearningStateInput {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  expectedTimeSec?: number | null;
  // Timestamps/counters initialized to defaults
}

interface UpdateBlockLearningStateInput {
  // Mutable fields only
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  expectedTimeSec?: number | null;
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}

interface UpsertBlockLearningStateInput {
  // Identity (required)
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  
  // Telemetry (optional - for updates)
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  expectedTimeSec?: number | null;
  
  // Timestamps (optional - for updates)
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}
```

### Return Type

```typescript
type BlockLearningState = typeof blockLearningState.$inferSelect;
```

Use Drizzle's inferred types from schema.

---

## Atomic Operations Strategy

### Visit Count Increment

**Without Session:**
```typescript
// Service layer determines if this is a "new visit"
// Repository performs atomic increment
await repo.upsert({
  ...identity,
  visitCount: existing ? existing.visitCount + 1 : 1,
});
```

**Problem:** Not atomic if using SELECT then UPDATE

**Solution:** Use atomic SQL in upsert conflict handler:

```typescript
.onConflictDoUpdate({
  target: [...identity fields...],
  where: sql`${blockLearningState.deletedAt} IS NULL`,
  set: {
    visitCount: buildAtomicTimeIncrement(blockLearningState.visitCount, 1),
    lastViewedAt: now,
    version: buildAtomicVersionIncrement(blockLearningState.version),
    updatedAt: now,
  }
})
```

**Decision:** Implement upsert with atomic increments in conflict handler

---

### Time Accumulation

**Pattern:**
```typescript
activeTimeSec: buildAtomicTimeIncrement(
  blockLearningState.activeTimeSec,
  incrementSeconds
)
```

**Reuse:** `buildAtomicTimeIncrement` from navigation-progress helpers

---

### Version Increment

**Pattern:**
```typescript
version: buildAtomicVersionIncrement(blockLearningState.version)
```

**Reuse:** `buildAtomicVersionIncrement` from navigation-progress helpers

---

## Implementation Plan

### File Location

**Path:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

**Naming Convention:** Matches existing pattern (kebab-case, `.repository.ts` suffix)

---

### Class Structure

```typescript
import { TutorialRepositoryBase } from './base.repository';
import { db } from '../db';
import { blockLearningState } from '../schema/block-learning-state';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { TutorialDbClientLike } from '@quiz/types';
import {
  buildAtomicTimeIncrement,
  buildAtomicVersionIncrement,
} from './tutorial-navigation-progress-sql.helpers';

const activeBlockState = isNull(blockLearningState.deletedAt);

export class BlockLearningStateRepository extends TutorialRepositoryBase {
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new BlockLearningStateRepository(dbClient as typeof db) as this;
  }

  // Implementation methods...
}
```

---

### Method Implementations

#### 1. findOne

```typescript
async findOne(identity: BlockIdentity): Promise<BlockLearningState | null> {
  const rows = await this.runRead(
    this.dbInstance
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, identity.userId),
          eq(blockLearningState.navigationNodeId, identity.navigationNodeId),
          eq(blockLearningState.blockId, identity.blockId),
          eq(blockLearningState.blockVersion, identity.blockVersion),
          activeBlockState
        )
      ),
    'BlockLearningStateRepository.findOne'
  );

  return rows[0] ?? null;
}
```

**Key Points:**
- Uses ALL FOUR identity fields
- Includes soft-delete filter
- Uses `runRead()` for timeout
- Returns null for not found

---

#### 2. create

```typescript
async create(data: CreateBlockLearningStateInput): Promise<BlockLearningState> {
  const now = new Date();
  
  const [created] = await this.runRead(
    this.dbInstance
      .insert(blockLearningState)
      .values({
        userId: data.userId,
        navigationNodeId: data.navigationNodeId,
        blockId: data.blockId,
        blockVersion: data.blockVersion,
        expectedTimeSec: data.expectedTimeSec ?? null,
        visitCount: 0,
        revisionCount: 0,
        activeTimeSec: 0,
        firstViewedAt: null,  // Set by service layer on first visit
        lastViewedAt: null,
        completedAt: null,
        version: 1,
        deletedAt: null,
      })
      .returning(),
    'BlockLearningStateRepository.create'
  );

  if (!created) {
    throw new Error('Failed to create block learning state');
  }

  return created;
}
```

**Key Points:**
- Initializes counters to 0
- Timestamps initially null (set by service layer)
- expectedTimeSec nullable
- Throws if creation fails

---

#### 3. update

```typescript
async update(
  id: string,
  data: UpdateBlockLearningStateInput
): Promise<BlockLearningState> {
  const now = new Date();
  
  const [updated] = await this.runRead(
    this.dbInstance
      .update(blockLearningState)
      .set({
        ...data,
        version: buildAtomicVersionIncrement(blockLearningState.version),
        updatedAt: now,
      })
      .where(
        and(
          eq(blockLearningState.id, id),
          activeBlockState
        )
      )
      .returning(),
    'BlockLearningStateRepository.update'
  );

  if (!updated) {
    throw new Error('Failed to update block learning state (not found or deleted)');
  }

  return updated;
}
```

**Key Points:**
- Updates only provided fields
- Atomic version increment
- Updates updatedAt
- Soft-delete safety
- Throws if record not found

---

#### 4. upsert (CRITICAL)

```typescript
async upsert(data: UpsertBlockLearningStateInput): Promise<BlockLearningState> {
  const now = new Date();
  
  // Attempt INSERT first
  const [created] = await this.runRead(
    this.dbInstance
      .insert(blockLearningState)
      .values({
        userId: data.userId,
        navigationNodeId: data.navigationNodeId,
        blockId: data.blockId,
        blockVersion: data.blockVersion,
        expectedTimeSec: data.expectedTimeSec ?? null,
        visitCount: data.visitCount ?? 0,
        revisionCount: data.revisionCount ?? 0,
        activeTimeSec: data.activeTimeSec ?? 0,
        firstViewedAt: data.firstViewedAt ?? null,
        lastViewedAt: data.lastViewedAt ?? null,
        completedAt: data.completedAt ?? null,
        version: 1,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [
          blockLearningState.userId,
          blockLearningState.navigationNodeId,
          blockLearningState.blockId,
          blockLearningState.blockVersion,
        ],
        where: sql`${blockLearningState.deletedAt} IS NULL`,
        set: {
          // Atomic increments for counters if provided
          visitCount: data.visitCount !== undefined
            ? buildAtomicTimeIncrement(blockLearningState.visitCount, data.visitCount)
            : blockLearningState.visitCount,
          revisionCount: data.revisionCount !== undefined
            ? buildAtomicTimeIncrement(blockLearningState.revisionCount, data.revisionCount)
            : blockLearningState.revisionCount,
          activeTimeSec: data.activeTimeSec !== undefined
            ? buildAtomicTimeIncrement(blockLearningState.activeTimeSec, data.activeTimeSec)
            : blockLearningState.activeTimeSec,
          
          // Update other fields if provided
          expectedTimeSec: data.expectedTimeSec !== undefined
            ? data.expectedTimeSec
            : blockLearningState.expectedTimeSec,
          firstViewedAt: data.firstViewedAt !== undefined
            ? data.firstViewedAt
            : blockLearningState.firstViewedAt,
          lastViewedAt: data.lastViewedAt ?? now,
          completedAt: data.completedAt !== undefined
            ? data.completedAt
            : blockLearningState.completedAt,
          
          // Audit
          version: buildAtomicVersionIncrement(blockLearningState.version),
          updatedAt: now,
        },
      })
      .returning(),
    'BlockLearningStateRepository.upsert'
  );

  if (!created) {
    throw new Error('Failed to upsert block learning state');
  }

  return created;
}
```

**Key Points:**
- Uses `onConflictDoUpdate` with FULL identity
- Includes WHERE clause for partial unique index
- Atomic increments for counters
- Conditional field updates
- Returns created or updated record

---

#### 5. findByUser

```typescript
async findByUser(userId: string): Promise<BlockLearningState[]> {
  const rows = await this.runRead(
    this.dbInstance
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, userId),
          activeBlockState
        )
      )
      .orderBy(blockLearningState.lastViewedAt), // Most recent first
    'BlockLearningStateRepository.findByUser'
  );

  return rows;
}
```

---

#### 6. findByNavigationNode

```typescript
async findByNavigationNode(
  userId: string,
  navigationNodeId: string
): Promise<BlockLearningState[]> {
  const rows = await this.runRead(
    this.dbInstance
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, userId),
          eq(blockLearningState.navigationNodeId, navigationNodeId),
          activeBlockState
        )
      ),
    'BlockLearningStateRepository.findByNavigationNode'
  );

  return rows;
}
```

**Key Points:**
- Scoped by BOTH userId and navigationNodeId
- Prevents cross-user data leaks
- Uses compound index

---

#### 7. findCompleted

```typescript
async findCompleted(userId: string): Promise<BlockLearningState[]> {
  const rows = await this.runRead(
    this.dbInstance
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, userId),
          isNotNull(blockLearningState.completedAt),
          activeBlockState
        )
      )
      .orderBy(blockLearningState.completedAt), // Completion order
    'BlockLearningStateRepository.findCompleted'
  );

  return rows;
}
```

---

#### 8. softDelete

```typescript
async softDelete(id: string): Promise<void> {
  const now = new Date();
  
  await this.runRead(
    this.dbInstance
      .update(blockLearningState)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(blockLearningState.id, id),
          activeBlockState // Only delete if not already deleted
        )
      ),
    'BlockLearningStateRepository.softDelete'
  );
}
```

---

### Test Plan

**File:** `packages/db-tutorial/src/repositories/__tests__/block-learning-state.repository.test.ts`

**Test Categories:**

1. **Identity Tests**
   - findOne with exact identity
   - findOne with wrong userId
   - findOne with wrong navigationNodeId
   - findOne with wrong blockId
   - findOne with wrong blockVersion

2. **CRUD Tests**
   - create with valid data
   - create with expectedTimeSec
   - create without expectedTimeSec
   - update counters
   - update timestamps
   - update expectedTimeSec

3. **Upsert Tests**
   - upsert creates on first call
   - upsert updates on second call
   - upsert atomic counter increments
   - upsert preserves identity
   - concurrent upserts (if testable)

4. **Query Tests**
   - findByUser returns user's blocks
   - findByUser excludes other users
   - findByNavigationNode scoped by user
   - findCompleted filters by completedAt

5. **Soft Delete Tests**
   - softDelete marks as deleted
   - deleted records excluded from queries
   - deleted records not found by findOne

6. **Block Version Isolation**
   - Different versions remain independent
   - Upsert doesn't merge versions
   - Queries distinguish versions

---

## Frozen Architecture Compliance Checklist

### Identity
- [x] Uses `(userId, navigationNodeId, blockId, blockVersion)`
- [x] NO brand column
- [x] NO sessionId column
- [x] All four fields required for findOne
- [x] All four fields in upsert conflict target

### Telemetry
- [x] expectedTimeSec is nullable configuration
- [x] expectedTimeSec NOT calculated by repository
- [x] Counters use atomic increments
- [x] Timestamps managed appropriately

### Soft Delete
- [x] Uses deletedAt pattern
- [x] Partial unique index with WHERE deleted_at IS NULL
- [x] Active filter in all queries

### Scope Boundary
- [x] NO service logic
- [x] NO API logic
- [x] NO session management
- [x] NO ActiveBlockContext
- [x] NO ILSProvider
- [x] NO time comparison
- [x] NO visit deduplication (deferred to service)

---

## Risk Assessment

### High Risk
None identified.

### Medium Risk

**1. Upsert Conflict Target with Partial Index**

**Risk:** Drizzle might not handle partial unique index conflict correctly

**Mitigation:**
- Include explicit WHERE clause in onConflictDoUpdate
- Test upsert behavior thoroughly
- Validate against actual PostgreSQL execution

**2. Atomic Counter Increments in Upsert**

**Risk:** Conditional atomic increments might have SQL syntax issues

**Mitigation:**
- Use existing helpers (`buildAtomicTimeIncrement`)
- Test with actual database
- Validate SQL generated by Drizzle

### Low Risk

**1. Type Inference**

**Risk:** Drizzle inferred types might not match expectations

**Mitigation:**
- Use `typeof blockLearningState.$inferSelect`
- Validate types at compile time

---

## Implementation Readiness

### Prerequisites ✅

- [x] Phase 4.1 baseline verified
- [x] Repository conventions inspected
- [x] Schema structure confirmed
- [x] Atomic SQL patterns identified
- [x] Test patterns identified
- [x] Contract resolved (CRUD/query only)
- [x] Type strategy determined
- [x] Soft-delete pattern confirmed

### Ready to Implement ✅

All preflight checks complete. Implementation can begin.

---

## Next Steps

1. Create `block-learning-state.repository.ts`
2. Implement repository class
3. Create repository tests
4. Run targeted tests
5. Run regression tests
6. Validate against frozen architecture
7. Create Phase 4.2 certification report

---

**Preflight Status:** ✅ **COMPLETE**  
**Authorization:** Proceed with Phase 4.2 implementation  
**Baseline:** `fe005a51`  
**Date:** 2026-09-05
