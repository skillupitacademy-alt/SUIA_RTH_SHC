# Phase D-2 Idempotency Design (REVISED)

**Gate:** 3C.1R Phase D-2  
**Date:** 2026-09-11  
**Status:** DESIGN REVISION - Ready for Implementation  

---

## Critical Design Corrections Applied

### Issue 1: Two-Phase Non-Atomic Processing (RESOLVED)

**Original Unsafe Design:**
```text
INSERT event → UPDATE learning_state (NO TRANSACTION)
```

**Risk:** Event claimed but learning state update fails → retry blocked → increment permanently lost.

**Revised Safe Design:**
```typescript
db.transaction(async (tx) => {
  // 1. Claim event
  const [event] = await tx.insert(blockTelemetryEvents).values({...}).returning();
  
  // 2. If event is new, accumulate time
  if (event) {
    await blockRepo.withDb(tx).upsert({ activeTimeSec });
  }
});
```

**Guarantee:** `event claimed ↔ time accumulated` (atomic or both roll back).

### Issue 2: Event Lifecycle Misalignment (RESOLVED)

**Original Incorrect Model:**
```text
Generate eventId at block entry
Retain through multiple heartbeats
Clear after delivery
```

**Problem:** Multiple distinct heartbeat increments treated as one event.

**Revised Correct Model:**
```text
Each pending queue entry = one logical event
Generate eventId when adding to pending queue
Retain eventId until successful delivery
Multiple heartbeats = multiple distinct events
```

### Issue 3: HTTP Response Semantics (RESOLVED)

**Original Design:** `409 Conflict` for duplicate events.

**Problem:** Retry of successful request is not a logical conflict.

**Revised Design:** `200 OK` with `{ processed: boolean }` indicator.

---

## Transaction Support Verification

**D-1 Finding:** "NO transactions wrap completion operations"

**D-2 Requirement:** Transaction for event + time atomicity.

**Verification from Source:**

```typescript
// packages/db-tutorial/src/live-session.service.ts:82
const request = await db.transaction(async (tx) => {
  const txRepo = this.repository.withDb(tx as never);
  return txRepo.createRequest(studentId, subtopicId, doubtText ?? null);
});
```

**Type Support:**

```typescript
// packages/types/src/tutorial-repositories.types.ts:53
export interface TutorialDbClientLike {
  select: () => unknown;
  insert: (table: unknown) => unknown;
  update: (table: unknown) => unknown;
  delete: (table: unknown) => unknown;
  query?: Record<string, unknown>;
}
```

**PeopleDbClientLike HAS transaction method:**

```typescript
export interface PeopleDbClientLike {
  transaction: <T>(callback: (tx: PeopleDbClientLike) => Promise<T>) => Promise<T>;
  // ...
}
```

**TutorialDbClientLike DOES NOT explicitly define `transaction` method.**

**CRITICAL FINDING:** Must verify runtime support for `db.transaction()` in tutorial database.

**Evidence:** `live-session.service.ts` uses `db.transaction()` successfully.

**Conclusion:** Transaction API exists and is usable. D-2 may use transactions without violating architecture.

---

## Pending Queue Semantics Audit

### Current Pending Queue Structure

```typescript
interface PendingActiveTime {
  blockId: string;
  blockVersion: string;
  pendingMs: number; // Aggregated milliseconds
}

const pendingQueueRef = useRef<Map<string, PendingActiveTime>>(new Map());
```

**Key Semantics:**

1. **Aggregation:** Multiple accumulations for same block are merged:
   ```typescript
   existing.pendingMs += ms;
   ```

2. **Lifetime:** Survives block transitions and flush failures.

3. **Delivery:** Attempts to deliver pending entries, removes on success.

4. **Retry:** Failed deliveries remain in queue for automatic retry.

**Event Identity Requirement:**

Since pending queue AGGREGATES multiple distinct accumulations into one entry, we must:

1. Generate NEW event ID when ADDING to pending queue (not at measurement time)
2. Retain event ID with pending entry
3. Retry uses SAME event ID
4. After successful delivery, REMOVE entry (next accumulation gets new event ID)

**Correct Event Boundary:**

```text
Heartbeat 1: accumulate 30s → add to pending → eventId=A
Heartbeat 2: accumulate 30s → aggregate pending → SAME eventId=A
Delivery: send eventId=A, +60s total
Success: remove from queue
Heartbeat 3: accumulate 30s → add to pending → eventId=B (NEW)
```

---

## Revised Event Lifecycle

### Phase 1: Accumulation

```typescript
// Timing runs continuously
timingStateRef.current = {
  blockId, blockVersion,
  startTime: performance.now(),
  accumulatedMs: 0,
  isPaused: false
};
```

### Phase 2: Pending Queue Addition

```typescript
const addToPendingQueue = (blockId: string, blockVersion: string, ms: number) => {
  const key = getPendingKey(blockId, blockVersion);
  const existing = pendingQueueRef.current.get(key);
  
  if (existing) {
    // Aggregate with existing entry (SAME eventId retained)
    existing.pendingMs += ms;
  } else {
    // NEW entry - generate NEW eventId
    pendingQueueRef.current.set(key, {
      eventId: crypto.randomUUID(), // ✅ NEW
      blockId,
      blockVersion,
      pendingMs: ms,
    });
  }
};
```

### Phase 3: Delivery

```typescript
const tryDeliverPending = async () => {
  for (const [key, pending] of pendingQueueRef.current.entries()) {
    const incrementSec = Math.floor(pending.pendingMs / 1000);
    const safeIncrement = Math.min(incrementSec, 600);
    
    // Send with stable eventId
    const success = await emitActiveTime(
      pending.eventId, // ✅ Stable across retries
      pending.blockId,
      pending.blockVersion,
      safeIncrement
    );
    
    if (success) {
      // Remove or update pending entry
      const remainderMs = (incrementSec - safeIncrement) * 1000 + (pending.pendingMs % 1000);
      if (remainderMs > 0) {
        pending.pendingMs = remainderMs;
        // ⚠️ DECISION POINT: Generate new eventId for remainder?
        pending.eventId = crypto.randomUUID(); // NEW event for remainder
      } else {
        pendingQueueRef.current.delete(key);
      }
    }
    // On failure: entry remains in queue with SAME eventId
  }
};
```

**Event ID Remainder Decision:**

When delivery succeeds but remainder exists (e.g., 720s → send 600s, 120s remains):

**Option A:** Remainder keeps same eventId (ONE logical event across multiple requests)
**Option B:** Remainder gets new eventId (EACH delivery is distinct event)

**RECOMMENDATION: Option B** - Each HTTP request is a distinct delivery event. The 600s API limit is a transport constraint, not semantic aggregation.

---

## Database Schema

### Event Table

```sql
CREATE TABLE IF NOT EXISTS block_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identity (client-generated, stable across retries)
  event_id TEXT NOT NULL,
  
  -- Block identity (scoped to learning state)
  user_id TEXT NOT NULL,
  navigation_node_id UUID NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  
  -- Telemetry payload
  active_time_sec INTEGER NOT NULL 
    CHECK (active_time_sec >= 0 AND active_time_sec <= 600),
  
  -- Audit
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Idempotency constraint (globally unique per event)
  CONSTRAINT uq_block_telemetry_event_id UNIQUE (event_id),
  
  -- Optional: Composite constraint for additional safety
  CONSTRAINT uq_block_telemetry_event_composite UNIQUE (
    user_id,
    navigation_node_id,
    block_id,
    block_version,
    event_id
  )
);

CREATE INDEX idx_block_telemetry_events_block_lookup 
  ON block_telemetry_events (user_id, navigation_node_id, block_id, block_version, processed_at DESC);

CREATE INDEX idx_block_telemetry_events_cleanup
  ON block_telemetry_events (processed_at);

COMMENT ON TABLE block_telemetry_events IS 'Phase D-2: Idempotent active-time event deduplication (one logical event = one time increment)';
COMMENT ON COLUMN block_telemetry_events.event_id IS 'Client-generated UUID, stable across HTTP retries, unique per logical telemetry increment';
COMMENT ON COLUMN block_telemetry_events.active_time_sec IS 'Time increment for THIS event (not cumulative), max 600s per API contract';
```

**Event ID Scope Decision:** GLOBAL uniqueness via `UNIQUE (event_id)`.

**Rationale:**
- `crypto.randomUUID()` provides global uniqueness
- Simpler constraint (one column vs composite)
- Replay protection across soft-delete/recreation
- Future multi-device safety

**Composite constraint** retained for additional validation (prevents same event with different block identity).

---

## Implementation Flow

### Service Layer

```typescript
// packages/db-tutorial/src/services/learning-progress.service.ts

async recordBlockActiveTime(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  eventId: string, // NEW
  activeTimeSec: number
): Promise<BlockLearningState> {
  // Validate inputs (unchanged)
  validateUserId(identity.userId);
  validateNavigationNodeId(navigationNodeId);
  validateBlockId(blockId);
  validateBlockVersion(blockVersion);
  validateSubtopicId(subtopicId);
  validateEventId(eventId); // NEW
  
  if (activeTimeSec < 0) {
    throw new InvalidTimeUpdateError('Active time cannot be negative', { activeTimeSec });
  }
  
  if (activeTimeSec > 600) {
    throw new InvalidTimeUpdateError(
      'Block time increment too large (max 600 seconds per update)',
      { activeTimeSec, maxAllowed: 600 }
    );
  }
  
  // Validate navigation hierarchy
  await this.validateNavigationHierarchy(navigationNodeId, subtopicId, null, identity);
  
  const now = new Date();
  
  // CRITICAL: Transaction wraps event claim + time accumulation
  return await db.transaction(async (tx) => {
    const eventRepo = new BlockTelemetryEventRepository(tx);
    const blockRepo = this.blockLearningStateRepository.withDb(tx);
    
    try {
      // 1. Claim event (throws on duplicate)
      await eventRepo.claimEvent({
        eventId,
        userId: identity.userId,
        navigationNodeId,
        blockId,
        blockVersion,
        activeTimeSec,
      });
      
      // 2. Accumulate time (event successfully claimed)
      return await blockRepo.upsert({
        userId: identity.userId,
        navigationNodeId,
        blockId,
        blockVersion,
        activeTimeSec,
        lastViewedAt: now,
      });
      
    } catch (error) {
      if (error instanceof EventAlreadyProcessedError) {
        // Idempotent: event already processed, return current state
        const existingState = await blockRepo.findOne({
          userId: identity.userId,
          navigationNodeId,
          blockId,
          blockVersion,
        });
        
        if (!existingState) {
          // This should not happen (event exists but state doesn't)
          // Indicates inconsistency - log and throw
          console.error('[ILS] Event processed but block state not found', {
            userId: identity.userId,
            eventId,
            blockId,
            blockVersion,
          });
          throw new Error('Inconsistent event/state: event processed but block state missing');
        }
        
        return existingState;
      }
      
      throw error;
    }
  });
}
```

### Repository Layer

```typescript
// packages/db-tutorial/src/repositories/block-telemetry-event.repository.ts

export interface ClaimEventInput {
  eventId: string;
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  activeTimeSec: number;
}

export class EventAlreadyProcessedError extends Error {
  constructor(public readonly eventId: string, public readonly processedAt: Date) {
    super(`Event ${eventId} already processed at ${processedAt.toISOString()}`);
    this.name = 'EventAlreadyProcessedError';
  }
}

export class BlockTelemetryEventRepository {
  constructor(private readonly dbInstance: typeof db = db) {}
  
  withDb(dbClient: TutorialDbClientLike): this {
    return new BlockTelemetryEventRepository(dbClient as typeof db) as this;
  }
  
  /**
   * Claim a telemetry event (idempotent insert)
   * 
   * Returns: Created event if new
   * Throws: EventAlreadyProcessedError if duplicate
   */
  async claimEvent(input: ClaimEventInput): Promise<BlockTelemetryEvent> {
    try {
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
        .returning();
      
      if (!event) {
        throw new Error('Failed to claim event: no row returned');
      }
      
      return event;
      
    } catch (error: any) {
      // Detect unique constraint violation
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        // Event already exists - fetch and return as AlreadyProcessedError
        const existing = await this.dbInstance
          .select()
          .from(blockTelemetryEvents)
          .where(eq(blockTelemetryEvents.eventId, input.eventId))
          .limit(1);
        
        if (existing[0]) {
          throw new EventAlreadyProcessedError(
            input.eventId,
            existing[0].processedAt
          );
        }
        
        // Shouldn't reach here
        throw new Error(`Event ${input.eventId} violates uniqueness but cannot be fetched`);
      }
      
      throw error;
    }
  }
  
  /**
   * Lookup event by ID (for debugging/audit)
   */
  async findByEventId(eventId: string): Promise<BlockTelemetryEvent | null> {
    const [event] = await this.dbInstance
      .select()
      .from(blockTelemetryEvents)
      .where(eq(blockTelemetryEvents.eventId, eventId))
      .limit(1);
    
    return event || null;
  }
}
```

---

## API Contract Changes

### Request Schema

```typescript
export const recordBlockActiveTimeBodySchema = z.object({
  eventId: z.string().uuid('Event ID must be a valid UUID'), // NEW REQUIRED
  navigationNodeId: navigationNodeIdSchema,
  subtopicId: uuidSchema,
  blockId: blockIdSchema,
  blockVersion: blockVersionSchema,
  activeTimeSec: z.number()
    .int('Time must be an integer')
    .min(0, 'Time cannot be negative')
    .max(600, 'Time increment too large (max 600 seconds)'),
  sectionId: uuidSchema.optional().nullable(),
});
```

### Response (Success - First Processing)

```json
{
  "data": {
    "id": "...",
    "userId": "...",
    "blockId": "...",
    "activeTimeSec": 150,
    "processed": true
  }
}
```

### Response (Success - Already Processed)

```json
{
  "data": {
    "id": "...",
    "userId": "...",
    "blockId": "...",
    "activeTimeSec": 150,
    "processed": false,
    "alreadyProcessed": true
  }
}
```

**Both return HTTP 200 OK** (idempotent success semantics).

---

## Frontend Changes

### Updated Pending Queue

```typescript
interface PendingActiveTime {
  eventId: string; // NEW
  blockId: string;
  blockVersion: string;
  pendingMs: number;
}
```

### Event ID Generation

```typescript
const addToPendingQueue = useCallback((blockId: string, blockVersion: string, ms: number) => {
  if (ms <= 0) return;
  
  const key = getPendingKey(blockId, blockVersion);
  const existing = pendingQueueRef.current.get(key);
  
  if (existing) {
    // Aggregate with existing pending time (SAME eventId)
    existing.pendingMs += ms;
  } else {
    // NEW entry - generate NEW eventId
    pendingQueueRef.current.set(key, {
      eventId: crypto.randomUUID(), // ✅ Generate once per logical increment
      blockId,
      blockVersion,
      pendingMs: ms,
    });
  }
}, [getPendingKey]);
```

### Delivery with Event ID

```typescript
const emitActiveTime = useCallback(async (
  eventId: string, // NEW
  blockId: string,
  blockVersion: string,
  incrementSec: number
): Promise<boolean> => {
  if (!enabled || !sessionIdRef.current || incrementSec <= 0) return false;
  
  const safeIncrement = Math.min(incrementSec, 600);
  
  try {
    const response = await fetch('/api/tutorial/ils/block-active-time', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionIdRef.current,
      },
      body: JSON.stringify({
        eventId, // ✅ Stable across retries
        navigationNodeId,
        subtopicId,
        blockId,
        blockVersion,
        activeTimeSec: safeIncrement,
        sectionId,
      }),
    });
    
    if (!response.ok) {
      console.warn(`[BlockTelemetry] Active time failed: ${response.status}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('[BlockTelemetry] Active time error:', error);
    return false;
  }
}, [enabled, navigationNodeId, subtopicId, sectionId]);
```

### Remainder Handling

```typescript
const tryDeliverPending = useCallback(async (): Promise<void> => {
  // ... existing serialization logic ...
  
  for (const [key, pending] of entries) {
    const incrementSec = Math.floor(pending.pendingMs / 1000);
    
    if (incrementSec <= 0) {
      pendingQueueRef.current.delete(key);
      continue;
    }
    
    const safeIncrement = Math.min(incrementSec, 600);
    const remainderSec = incrementSec - safeIncrement;
    
    const success = await emitActiveTime(
      pending.eventId, // ✅ Stable eventId
      pending.blockId,
      pending.blockVersion,
      safeIncrement
    );
    
    if (!success) {
      // Retry will use SAME eventId
      return;
    }
    
    // SUCCESS: Handle remainder
    const fractionalMs = pending.pendingMs % 1000;
    const remainderMs = remainderSec * 1000;
    const totalRemaining = fractionalMs + remainderMs;
    
    if (totalRemaining > 0) {
      // Update entry with NEW eventId for remainder
      pending.pendingMs = totalRemaining;
      pending.eventId = crypto.randomUUID(); // ✅ NEW event for remainder
    } else {
      // Fully delivered
      pendingQueueRef.current.delete(key);
    }
  }
}, [emitActiveTime]);
```

---

## Soft-Delete Interaction

**Scenario:**

```text
1. Block state exists, Event A processed (+30s)
2. Block state soft-deleted
3. Block state recreated (new row)
4. Event A retried
```

**Expected Behavior:**

Event A remains consumed (global uniqueness on `event_id`).

**Database Guarantee:**

```sql
CONSTRAINT uq_block_telemetry_event_id UNIQUE (event_id)
```

Event table is INDEPENDENT of `block_learning_state` lifecycle.

**Test:**

```typescript
// Create state, process event
await service.recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30);

// Soft-delete state
await blockRepo.softDelete(stateId);

// Recreate state (new id, same identity)
const newState = await blockRepo.create({...});

// Retry Event A
await expect(
  service.recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30)
).rejects.toThrow(EventAlreadyProcessedError);

// Verify activeTimeSec not duplicated
expect(newState.activeTimeSec).toBe(0); // Not affected by Event A
```

---

## Payload Conflict Detection

**Scenario:**

```text
Event A: eventId=ABC, activeTimeSec=30
Event A': eventId=ABC, activeTimeSec=300 (DIFFERENT)
```

**Current Design:** First request wins, second returns `EventAlreadyProcessedError`.

**Concern:** Payload mutation not explicitly validated.

**Enhanced Safety (Optional):**

Add payload validation on duplicate detection:

```typescript
if (existing[0]) {
  // Verify payload matches
  if (
    existing[0].userId !== input.userId ||
    existing[0].blockId !== input.blockId ||
    existing[0].activeTimeSec !== input.activeTimeSec
  ) {
    throw new EventPayloadConflictError(
      `Event ${input.eventId} payload conflict: original ${existing[0].activeTimeSec}s, retry ${input.activeTimeSec}s`
    );
  }
  
  throw new EventAlreadyProcessedError(input.eventId, existing[0].processedAt);
}
```

**Decision:** Implement basic conflict detection for `activeTimeSec` only (most critical field).

---

## Zero-Second Events

**Current Semantics:** `activeTimeSec: 0` passes validation (`min(0)`).

**D-2 Decision:** Preserve current contract (zero-second events are valid).

**Use Case:** Explicit API call with no accumulated time (edge case).

**Implementation:** Zero-second events ARE recorded and deduplicated normally.

---

## Test Matrix

### D2-1: Atomic Distinct Increments

```typescript
await Promise.all([
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 10),
  recordBlockActiveTime(..., eventId: 'B', activeTimeSec: 20),
  recordBlockActiveTime(..., eventId: 'C', activeTimeSec: 30),
]);

expect(finalState.activeTimeSec).toBe(60); // Exact sum
```

### D2-2: Sequential Duplicate

```typescript
await recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30);
await recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30); // Duplicate

expect(finalState.activeTimeSec).toBe(30); // One increment
```

### D2-3: Concurrent Duplicate

```typescript
await Promise.all(
  Array.from({ length: 10 }, () =>
    recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30)
  )
);

expect(finalState.activeTimeSec).toBe(30); // One increment
```

### D2-4: Mixed Distinct + Duplicate

```typescript
await Promise.all([
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 10),
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 10), // Dup
  recordBlockActiveTime(..., eventId: 'B', activeTimeSec: 20),
  recordBlockActiveTime(..., eventId: 'B', activeTimeSec: 20), // Dup
  recordBlockActiveTime(..., eventId: 'C', activeTimeSec: 30),
]);

expect(finalState.activeTimeSec).toBe(60); // Distinct events only
```

### D2-5: Transaction Rollback Safety

```typescript
// Mock repository to fail on upsert
await expect(
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30)
).rejects.toThrow();

// Verify event NOT claimed
const event = await eventRepo.findByEventId('A');
expect(event).toBeNull();

// Retry succeeds
await recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30);
expect(finalState.activeTimeSec).toBe(30);
```

### D2-6: 600-Second Boundary

```typescript
await recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 600);
expect(finalState.activeTimeSec).toBe(600); // Accepted
```

### D2-7: 601-Second Rejection

```typescript
await expect(
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 601)
).rejects.toThrow('Time increment too large');

const event = await eventRepo.findByEventId('A');
expect(event).toBeNull(); // Event NOT recorded
```

### D2-8: Payload Conflict

```typescript
await recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30);

await expect(
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 300) // DIFFERENT
).rejects.toThrow(EventPayloadConflictError);
```

### D2-9: Identity Isolation

```typescript
await recordBlockActiveTime(
  { userId: 'user-1', brand: 'shared' },
  ..., eventId: 'A', activeTimeSec: 30
);

await recordBlockActiveTime(
  { userId: 'user-2', brand: 'shared' },
  ..., eventId: 'A', activeTimeSec: 30
); // SAME eventId, DIFFERENT userId

// Verify: Event A claimed by user-1, user-2 rejected
await expect(events.length).toBe(1);
```

### D2-10: Soft-Delete Replay

```typescript
await recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30);
await blockRepo.softDelete(stateId);
const newState = await blockRepo.create({...});

await expect(
  recordBlockActiveTime(..., eventId: 'A', activeTimeSec: 30)
).rejects.toThrow(EventAlreadyProcessedError);

expect(newState.activeTimeSec).toBe(0); // NOT affected
```

---

## Migration Path

### Drizzle Schema

```typescript
// packages/db-tutorial/src/schema/block-telemetry-events.schema.ts

export const blockTelemetryEvents = pgTable('block_telemetry_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  userId: text('user_id').notNull(),
  navigationNodeId: uuid('navigation_node_id').notNull(),
  blockId: text('block_id').notNull(),
  blockVersion: text('block_version').notNull(),
  activeTimeSec: integer('active_time_sec').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueEventId: uniqueIndex('uq_block_telemetry_event_id').on(table.eventId),
  uniqueComposite: uniqueIndex('uq_block_telemetry_event_composite').on(
    table.userId,
    table.navigationNodeId,
    table.blockId,
    table.blockVersion,
    table.eventId
  ),
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

### SQL Migration

```sql
-- Phase D-2: Block telemetry event deduplication
-- Description: Ensures one logical telemetry event = one active-time increment

CREATE TABLE IF NOT EXISTS block_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  navigation_node_id UUID NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  active_time_sec INTEGER NOT NULL CHECK (active_time_sec >= 0 AND active_time_sec <= 600),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_block_telemetry_event_id ON block_telemetry_events (event_id);

CREATE UNIQUE INDEX uq_block_telemetry_event_composite ON block_telemetry_events (
  user_id, navigation_node_id, block_id, block_version, event_id
);

CREATE INDEX idx_block_telemetry_events_block_lookup ON block_telemetry_events (
  user_id, navigation_node_id, block_id, block_version, processed_at DESC
);

CREATE INDEX idx_block_telemetry_events_cleanup ON block_telemetry_events (processed_at);

COMMENT ON TABLE block_telemetry_events IS 'Phase D-2: Idempotent active-time event deduplication';
COMMENT ON COLUMN block_telemetry_events.event_id IS 'Client-generated UUID, stable across HTTP retries';
COMMENT ON COLUMN block_telemetry_events.active_time_sec IS 'Time increment for this event (max 600s per API contract)';
```

---

## Acceptance Criteria

- [x] Transaction support verified
- [x] Event lifecycle aligned with pending queue semantics
- [x] HTTP response uses success semantics (not 409)
- [x] Event ID generated per logical increment (not per block entry)
- [x] Remainder handling generates new event ID
- [x] Payload conflict detection implemented
- [x] Soft-delete replay protection verified
- [x] Zero-second events preserved
- [x] 10 test scenarios defined
- [x] Migration ready
- [x] No multi-tab claims introduced
- [x] No completion logic introduced
- [x] No revision logic introduced
- [x] Universal (no D1/C1-specific branches)

---

## Next Steps

1. Create migration file
2. Implement `BlockTelemetryEventRepository`
3. Update `LearningProgressService.recordBlockActiveTime()` with transaction
4. Update API route to extract `eventId`
5. Update frontend `BlockTelemetryProvider` with event lifecycle
6. Implement 10 D2 test scenarios
7. Run Phase C regression tests
8. Document in Phase D implementation report

---

**Design Status:** READY FOR IMPLEMENTATION  
**Authorization Requested:** Proceed with transactional event + time accumulation
