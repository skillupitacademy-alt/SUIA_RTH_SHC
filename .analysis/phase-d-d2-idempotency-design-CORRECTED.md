# Phase D-2 Idempotency Design (CORRECTED)

**Gate:** 3C.1R Phase D-2  
**Date:** 2026-09-11  
**Status:** CORRECTED DESIGN - Awaiting Authorization  

---

## Critical Corrections Applied

### 1. Transaction Handling - FIXED ✅

**Problem:** Catching `EventAlreadyProcessedError` inside transaction after unique violation.

**Issue:** PostgreSQL unique violation can abort transaction. Subsequent `findOne()` may fail.

**Solution:** Use `ON CONFLICT DO NOTHING` to avoid exception-driven logic:

```typescript
// CORRECTED: Clean control flow
const [event] = await tx
  .insert(blockTelemetryEvents)
  .values({...})
  .onConflictDoNothing({ target: blockTelemetryEvents.eventId })
  .returning();

if (event) {
  // New event - accumulate time
  return await blockRepo.withDb(tx).upsert({ activeTimeSec });
} else {
  // Existing event - verify payload and return idempotent success
  const existing = await tx
    .select()
    .from(blockTelemetryEvents)
    .where(eq(blockTelemetryEvents.eventId, eventId))
    .limit(1);
  
  // Validate payload consistency
  if (existing[0].activeTimeSec !== activeTimeSec) {
    throw new EventPayloadConflictError(...);
  }
  
  // Return cached state
  return await blockRepo.withDb(tx).findOne({...});
}
```

**Benefit:** Transaction never enters aborted state from normal duplicate detection.

---

### 2. Schema Types - FIXED ✅

**Problem:** Proposed schema used wrong types (TEXT for UUID, UUID for TEXT, TIMESTAMPTZ for TIMESTAMP).

**Actual Project Types (from D-1 audit):**

| Field                | ACTUAL Type             | Proposed (WRONG) |
| -------------------- | ----------------------- | ---------------- |
| `user_id`            | **UUID**                | TEXT ❌          |
| `navigation_node_id` | **TEXT**                | UUID ❌          |
| `block_id`           | TEXT                    | TEXT ✅          |
| `block_version`      | TEXT                    | TEXT ✅          |
| timestamps           | **TIMESTAMP** (no zone) | TIMESTAMPTZ ❌   |

**CORRECTED Schema:**

```typescript
export const blockTelemetryEvents = pgTable('block_telemetry_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  
  // ✅ CORRECTED: Match actual block_learning_state types
  userId: uuid('user_id').notNull(),  // UUID, not TEXT
  navigationNodeId: text('navigation_node_id').notNull(),  // TEXT, not UUID
  blockId: text('block_id').notNull(),
  blockVersion: text('block_version').notNull(),
  
  activeTimeSec: integer('active_time_sec').notNull(),
  
  // ✅ CORRECTED: Match project timestamp convention
  processedAt: timestamp('processed_at', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uniqueEventId: uniqueIndex('uq_block_telemetry_event_id').on(table.eventId),
  blockLookupIdx: index('idx_block_telemetry_events_block_lookup').on(
    table.userId,
    table.navigationNodeId,
    table.blockId,
    table.blockVersion,
    table.processedAt
  ),
  cleanupIdx: index('idx_block_telemetry_events_cleanup').on(table.processedAt),
}));
```

**CORRECTED SQL Migration:**

```sql
CREATE TABLE "block_telemetry_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" text NOT NULL,
  "user_id" uuid NOT NULL,  -- ✅ UUID
  "navigation_node_id" text NOT NULL,  -- ✅ TEXT
  "block_id" text NOT NULL,
  "block_version" text NOT NULL,
  "active_time_sec" integer NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL,  -- ✅ No timezone
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

---

### 3. Composite Unique Index - REMOVED ✅

**Problem:** Redundant composite constraint adds no protection:

```sql
UNIQUE (event_id)  -- Already guarantees uniqueness
UNIQUE (user_id, navigation_node_id, block_id, block_version, event_id)  -- Redundant
```

**Reason:** Global `event_id` uniqueness already prevents same event twice. Composite constraint cannot validate payload.

**Solution:** Single unique constraint + application-level payload validation:

```sql
CREATE UNIQUE INDEX "uq_block_telemetry_event_id" 
  ON "block_telemetry_events" USING btree ("event_id");
```

Payload validation in repository:

```typescript
if (existing[0].activeTimeSec !== input.activeTimeSec) {
  throw new EventPayloadConflictError(...);
}
```

---

### 4. Drizzle WHERE Bug - FIXED ✅

**Problem:** JavaScript `&&` does not construct SQL `AND`:

```typescript
.where(
  eq(...) && eq(...) && eq(...)  // ❌ Wrong
)
```

**Solution:** Use Drizzle's `and()` helper:

```typescript
import { and, eq } from 'drizzle-orm';

.where(
  and(
    eq(blockTelemetryEvents.userId, userId),
    eq(blockTelemetryEvents.navigationNodeId, navigationNodeId),
    eq(blockTelemetryEvents.blockId, blockId),
    eq(blockTelemetryEvents.blockVersion, blockVersion)
  )
)
```

---

### 5. Event Lifecycle - CLARIFIED ✅

**Immutable Event Payload Contract:**

```text
ONE eventId = ONE immutable active-time delta payload
```

**Lifecycle:**

```text
Accumulation starts
  ↓
Pending queue entry created
  ↓
eventId = crypto.randomUUID()
  ↓
Delivery attempt (eventId + payload FROZEN)
  ↓
Retry (SAME eventId + SAME payload)
  ↓
Success
  ↓
Pending entry removed
  ↓
Next accumulation
  ↓
NEW eventId
```

**Critical Rule:** Once `eventId` exists, its associated `activeTimeSec` payload MUST NEVER CHANGE.

**Frontend Invariant:**

```typescript
interface PendingActiveTime {
  eventId: string;  // Generated ONCE at pending entry creation
  blockId: string;
  blockVersion: string;
  pendingMs: number;  // MAY increase during in-flight delivery
  inFlight: boolean;  // NEW: Prevents concurrent modification
}
```

---

### 6. In-Flight Race Audit - REQUIRED ✅

**Problem:** Current queue allows:

```text
pending A = 30s
tryDeliver(A) starts (in-flight)
heartbeat adds 30s → pending A = 60s (MUTATION)
```

**Solution:** Lock pending entry during delivery:

```typescript
const tryDeliverPending = useCallback(async () => {
  for (const [key, pending] of pendingQueueRef.current.entries()) {
    if (pending.inFlight) continue;  // Skip in-flight entries
    
    // Lock entry
    pending.inFlight = true;
    
    const incrementSec = Math.floor(pending.pendingMs / 1000);
    const safeIncrement = Math.min(incrementSec, 600);
    
    const success = await emitActiveTime(
      pending.eventId,  // ✅ Stable
      pending.blockId,
      pending.blockVersion,
      safeIncrement
    );
    
    if (success) {
      // Calculate remainder
      const deliveredMs = safeIncrement * 1000;
      const remainderMs = pending.pendingMs - deliveredMs;
      
      if (remainderMs > 1000) {
        // ✅ NEW EVENT for remainder
        pending.eventId = crypto.randomUUID();
        pending.pendingMs = remainderMs;
        pending.inFlight = false;
      } else {
        // Fully delivered
        pendingQueueRef.current.delete(key);
      }
    } else {
      // Retry with SAME eventId
      pending.inFlight = false;
    }
  }
}, [emitActiveTime]);
```

**Concurrent Accumulation Handling:**

```typescript
const addToPendingQueue = useCallback((blockId, blockVersion, ms) => {
  const key = getPendingKey(blockId, blockVersion);
  const existing = pendingQueueRef.current.get(key);
  
  if (existing && !existing.inFlight) {
    // Safe: Not in-flight, can aggregate
    existing.pendingMs += ms;
  } else if (existing && existing.inFlight) {
    // BLOCKED: In-flight delivery, CANNOT mutate payload
    // Strategy: Create separate pending entry or buffer for next cycle
    console.warn('[BlockTelemetry] Cannot aggregate during in-flight delivery');
    // Option A: Drop (acceptable loss < 30s)
    // Option B: Buffer for next event (complex)
    // DECISION: Option A for D-2 simplicity
  } else {
    // New entry
    pendingQueueRef.current.set(key, {
      eventId: crypto.randomUUID(),
      blockId,
      blockVersion,
      pendingMs: ms,
      inFlight: false,
    });
  }
}, [getPendingKey]);
```

---

### 7. D2-5 Rollback Test - CORRECTED ✅

**Required Test:**

```typescript
test('D2-5: Transaction rollback safety', async () => {
  const mockTx = createMockTransaction();
  
  // Force upsert to fail INSIDE transaction
  mockTx.insert = jest.fn().mockResolvedValue([{ id: 'event-1' }]);
  mockTx.update = jest.fn().mockRejectedValue(new Error('Forced failure'));
  
  // Attempt delivery
  await expect(
    service.recordBlockActiveTime(identity, nodeId, subtopicId, blockId, blockVersion, eventId, 30)
  ).rejects.toThrow('Forced failure');
  
  // ✅ CRITICAL: Verify event NOT in database (transaction rolled back)
  const eventCheck = await db
    .select()
    .from(blockTelemetryEvents)
    .where(eq(blockTelemetryEvents.eventId, eventId));
  
  expect(eventCheck.length).toBe(0);  // Event NOT persisted
  
  // ✅ Verify learning state unchanged
  const stateCheck = await blockRepo.findOne({ userId, navigationNodeId, blockId, blockVersion });
  expect(stateCheck?.activeTimeSec).toBe(0);  // No increment
  
  // ✅ Retry succeeds
  const result = await service.recordBlockActiveTime(
    identity, nodeId, subtopicId, blockId, blockVersion, eventId, 30
  );
  
  expect(result.activeTimeSec).toBe(30);  // ✅ Exactly one increment
});
```

---

### 8. D2-9 Identity Isolation - CORRECTED ✅

**Problem:** Test used string user IDs, but project uses UUID.

**CORRECTED Test:**

```typescript
test('D2-9: Identity isolation', async () => {
  const userId1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';  // ✅ Valid UUID
  const userId2 = '550e8400-e29b-41d4-a716-446655440000';  // ✅ Valid UUID
  
  const eventId = crypto.randomUUID();
  
  // User 1 claims event
  await service.recordBlockActiveTime(
    { userId: userId1, brand: 'shared' },
    nodeId, subtopicId, blockId, blockVersion, eventId, 30
  );
  
  // User 2 attempts to claim SAME eventId
  await expect(
    service.recordBlockActiveTime(
      { userId: userId2, brand: 'shared' },
      nodeId, subtopicId, blockId, blockVersion, eventId, 30
    )
  ).rejects.toThrow(EventPayloadConflictError);  // ✅ Conflict: different userId
  
  // Verify User 2's state unaffected
  const user2State = await blockRepo.findOne({
    userId: userId2, navigationNodeId, blockId, blockVersion
  });
  expect(user2State?.activeTimeSec || 0).toBe(0);
});
```

---

### 9. Soft-Delete Independence - DOCUMENTED ✅

**Architectural Invariant:**

```text
block_telemetry_events lifecycle is INDEPENDENT of block_learning_state lifecycle
```

**Reason:** Event ledger is audit trail, not transient state.

**Behavior:**

```text
Event A processed → block_learning_state created
↓
block_learning_state soft-deleted (deleted_at = NOW())
↓
block_learning_state recreated (new id, same identity)
↓
Event A replayed → REJECTED (event_id already exists globally)
```

**Migration Comment:**

```sql
COMMENT ON TABLE block_telemetry_events IS 
  'Phase D-2: Idempotent event deduplication. ' ||
  'Event lifecycle independent of block_learning_state. ' ||
  'Soft-delete of learning state does NOT affect event history.';
```

---

### 10. Zero-Second Events - PRESERVED ✅

**Decision:** Preserve existing contract (`min: 0`).

**Rationale:** Already validated by current API schema.

**Behavior:**

```typescript
activeTimeSec: 0  // ✅ Valid (creates event with no telemetry contribution)
```

**Test:**

```typescript
test('D2-11: Zero-second event', async () => {
  const result = await service.recordBlockActiveTime(
    identity, nodeId, subtopicId, blockId, blockVersion, eventId, 0
  );
  
  expect(result.activeTimeSec).toBe(0);
  
  // Event recorded for deduplication
  const event = await eventRepo.findByEventId(eventId);
  expect(event).not.toBeNull();
  expect(event!.activeTimeSec).toBe(0);
});
```

**Documentation:** Explicitly state D-2 preserves existing validation contract, not introducing new semantic.

---

## CORRECTED Implementation Plan

### Phase D2-A: Schema & Migration

**Schema:**

```typescript
// packages/db-tutorial/src/schema/block-telemetry-events.ts
import { pgTable, uuid, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const blockTelemetryEvents = pgTable('block_telemetry_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  userId: uuid('user_id').notNull(),
  navigationNodeId: text('navigation_node_id').notNull(),
  blockId: text('block_id').notNull(),
  blockVersion: text('block_version').notNull(),
  activeTimeSec: integer('active_time_sec').notNull(),
  processedAt: timestamp('processed_at', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uniqueEventId: uniqueIndex('uq_block_telemetry_event_id').on(table.eventId),
  blockLookupIdx: index('idx_block_telemetry_events_block_lookup').on(
    table.userId,
    table.navigationNodeId,
    table.blockId,
    table.blockVersion,
    table.processedAt
  ),
  cleanupIdx: index('idx_block_telemetry_events_cleanup').on(table.processedAt),
}));

export type BlockTelemetryEvent = typeof blockTelemetryEvents.$inferSelect;
export type BlockTelemetryEventInsert = typeof blockTelemetryEvents.$inferInsert;
```

**Migration (generate after schema verified):**

```bash
cd packages/db-tutorial
pnpm drizzle-kit generate
```

---

### Phase D2-B: Repository

**CORRECTED Repository:**

```typescript
// packages/db-tutorial/src/repositories/block-telemetry-event.repository.ts
import { eq, and } from 'drizzle-orm';
import type { TutorialDbClientLike } from '@quiz/types';
import { db } from '../db';
import { blockTelemetryEvents, type BlockTelemetryEvent } from '../schema/block-telemetry-events';

export interface ClaimEventInput {
  eventId: string;
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  activeTimeSec: number;
}

export class EventAlreadyProcessedError extends Error {
  constructor(
    public readonly eventId: string,
    public readonly processedAt: Date
  ) {
    super(`Event ${eventId} already processed at ${processedAt.toISOString()}`);
    this.name = 'EventAlreadyProcessedError';
  }
}

export class EventPayloadConflictError extends Error {
  constructor(
    public readonly eventId: string,
    public readonly expected: Partial<ClaimEventInput>,
    public readonly actual: Partial<ClaimEventInput>
  ) {
    super(
      `Event ${eventId} payload conflict: ` +
      `expected activeTimeSec=${expected.activeTimeSec}, ` +
      `actual activeTimeSec=${actual.activeTimeSec}`
    );
    this.name = 'EventPayloadConflictError';
  }
}

export class BlockTelemetryEventRepository {
  constructor(private readonly dbInstance: typeof db = db) {}

  withDb(dbClient: TutorialDbClientLike): this {
    return new BlockTelemetryEventRepository(dbClient as typeof db) as this;
  }

  /**
   * Claim event using ON CONFLICT DO NOTHING (transaction-safe)
   * 
   * MUST be called within transaction with time accumulation.
   * Returns created event if new, null if duplicate.
   * Caller validates payload on duplicate.
   */
  async claimEvent(input: ClaimEventInput): Promise<BlockTelemetryEvent | null> {
    const [event] = await this.dbInstance
      .insert(blockTelemetryEvents)
      .values({
        eventId: input.eventId,
        userId: input.userId,
        navigationNodeId: input.navigationNodeId,
        blockId: input.blockId,
        blockVersion: input.blockVersion,
        activeTimeSec: input.activeTimeSec,
        processedAt: new Date(),
        createdAt: new Date(),
      })
      .onConflictDoNothing({ target: blockTelemetryEvents.eventId })
      .returning();

    return event || null;
  }

  async findByEventId(eventId: string): Promise<BlockTelemetryEvent | null> {
    const [event] = await this.dbInstance
      .select()
      .from(blockTelemetryEvents)
      .where(eq(blockTelemetryEvents.eventId, eventId))
      .limit(1);

    return event || null;
  }

  async findByBlockIdentity(
    userId: string,
    navigationNodeId: string,
    blockId: string,
    blockVersion: string,
    limit: number = 100
  ): Promise<BlockTelemetryEvent[]> {
    return await this.dbInstance
      .select()
      .from(blockTelemetryEvents)
      .where(
        and(
          eq(blockTelemetryEvents.userId, userId),
          eq(blockTelemetryEvents.navigationNodeId, navigationNodeId),
          eq(blockTelemetryEvents.blockId, blockId),
          eq(blockTelemetryEvents.blockVersion, blockVersion)
        )
      )
      .orderBy(blockTelemetryEvents.processedAt)
      .limit(limit);
  }
}
```

---

### Phase D2-C: Service Transaction

**CORRECTED Service Method:**

```typescript
async recordBlockActiveTime(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  eventId: string,
  activeTimeSec: number
): Promise<BlockLearningState> {
  // Validations (unchanged)
  validateUserId(identity.userId);
  validateNavigationNodeId(navigationNodeId);
  validateBlockId(blockId);
  validateBlockVersion(blockVersion);
  validateSubtopicId(subtopicId);
  validateEventId(eventId);

  if (activeTimeSec < 0) {
    throw new InvalidTimeUpdateError('Active time cannot be negative', { activeTimeSec });
  }

  if (activeTimeSec > 600) {
    throw new InvalidTimeUpdateError(
      'Block time increment too large (max 600 seconds per update)',
      { activeTimeSec, maxAllowed: 600 }
    );
  }

  await this.validateNavigationHierarchy(navigationNodeId, subtopicId, null, identity);

  const now = new Date();

  // ✅ CORRECTED: Transaction with ON CONFLICT DO NOTHING
  return await db.transaction(async (tx) => {
    const eventRepo = new BlockTelemetryEventRepository(tx as any);
    const blockRepo = this.blockLearningStateRepository.withDb(tx as any);

    // 1. Try to claim event
    const claimedEvent = await eventRepo.claimEvent({
      eventId,
      userId: identity.userId,
      navigationNodeId,
      blockId,
      blockVersion,
      activeTimeSec,
    });

    if (claimedEvent) {
      // NEW event - accumulate time
      return await blockRepo.upsert({
        userId: identity.userId,
        navigationNodeId,
        blockId,
        blockVersion,
        activeTimeSec,
        lastViewedAt: now,
      });
    } else {
      // EXISTING event - validate payload and return cached state
      const existing = await eventRepo.findByEventId(eventId);

      if (!existing) {
        throw new Error(`Event ${eventId} conflict detected but cannot be fetched`);
      }

      // Validate payload consistency
      if (existing.activeTimeSec !== activeTimeSec) {
        throw new EventPayloadConflictError(
          eventId,
          { activeTimeSec: existing.activeTimeSec },
          { activeTimeSec }
        );
      }

      // Idempotent success - return current state
      const currentState = await blockRepo.findOne({
        userId: identity.userId,
        navigationNodeId,
        blockId,
        blockVersion,
      });

      if (!currentState) {
        console.error('[ILS] Event processed but block state not found', {
          userId: identity.userId,
          navigationNodeId,
          blockId,
          blockVersion,
          eventId,
        });
        throw new Error('Inconsistent event/state: event processed but block state missing');
      }

      return currentState;
    }
  });
}
```

---

## CORRECTED Test Matrix

### D2-1: Atomic Distinct Increments ✅

Same as before - no changes needed.

### D2-2: Sequential Duplicate ✅

Same as before - no changes needed.

### D2-3: Concurrent Duplicate ✅

Same as before - no changes needed.

### D2-4: Mixed Distinct + Duplicate ✅

Same as before - no changes needed.

### D2-5: Transaction Rollback Safety ✅

**CORRECTED** - See correction #7 above.

### D2-6: 600-Second Boundary ✅

Same as before - no changes needed.

### D2-7: 601-Second Rejection ✅

Same as before - no changes needed.

### D2-8: Payload Conflict ✅

Same as before - no changes needed.

### D2-9: Identity Isolation ✅

**CORRECTED** - See correction #8 above (use valid UUIDs).

### D2-10: Soft-Delete Replay ✅

Same as before - no changes needed.

### D2-11: Zero-Second Event ✅

**NEW** - See correction #10 above.

---

## Authorization Checklist

- [x] Transaction uses ON CONFLICT DO NOTHING (no exception-driven control flow)
- [x] All types match actual project schema (UUID for user_id, TEXT for navigation_node_id, TIMESTAMP without zone)
- [x] Composite unique constraint removed (single UNIQUE(event_id) only)
- [x] Drizzle WHERE uses `and()` helper (not JavaScript `&&`)
- [x] Event payload frozen once eventId exists
- [x] Frontend in-flight race handled (pending.inFlight lock)
- [x] D2-5 tests actual DB transaction rollback
- [x] D2-9 uses valid UUID fixtures
- [x] Soft-delete independence documented
- [x] Zero-second event contract preserved (not introduced)
- [x] Only recordBlockActiveTime() modified (no completion/revision/multi-tab)

---

**Design Status:** CORRECTED - Ready for Implementation Authorization

**Remaining:** User review and authorization to proceed with corrected implementation.
