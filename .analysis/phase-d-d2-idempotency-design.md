# Phase D-2 Idempotency Design Document

**Gate:** 3C.1R Phase D-2  
**Date:** 2026-09-11  
**Status:** DESIGN

---

## Problem Statement

**Current Atomic SQL Behavior:**

```sql
activeTimeSec = activeTimeSec + ${increment}
```

**Property A (Lost-Update Safety):** ✅ PROVEN

Concurrent distinct events accumulate correctly:
```
Request A: +10 (concurrent)
Request B: +20 (concurrent)
Final: +30 ✅
```

**Property B (Duplicate-Event Safety):** ❌ UNPROVEN

Same logical event delivered twice:
```
Request A: +30
Request A retry: +30
Final: +60 ❌ (should be +30)
```

**Risk:** Once automatic 70% completion is implemented, duplicate delivery can cause false completion.

---

## Design Decision: CASE B (No Existing Event Identity)

D-2 audit confirms NO existing event identity in current protocol:
- No `eventId` field
- No `requestId` header
- No `idempotencyKey`
- No sequence numbers

**Conclusion:** Must implement minimal event identity mechanism.

---

## Minimal Idempotency Design

### Event Identity Scope

**Decision:** Event ID scoped to `(userId, navigationNodeId, blockId, blockVersion, eventId)`

**Why:** Event identity must be:
1. Unique per logical telemetry observation
2. Stable across HTTP retries
3. Scoped to block identity (cannot corrupt other blocks)
4. Scoped to user (cannot corrupt other users)

### Event ID Generation

**Location:** `BlockTelemetryProvider` (browser)

**Lifecycle:**

```typescript
// When starting to accumulate time for a block
const eventId = crypto.randomUUID(); // Generated ONCE

// When delivering accumulated time
POST /api/tutorial/ils/block-active-time
{
  eventId: "abc-123...", // SAME ID on retry
  activeTimeSec: 30
}
```

**Critical:** Event ID is generated when accumulation STARTS, NOT when request is sent. Retries reuse the same ID.

### Database Design

**Option A: Dedicated Event Deduplication Table**

```sql
CREATE TABLE IF NOT EXISTS block_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  navigation_node_id UUID NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  active_time_sec INTEGER NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint prevents duplicate processing
  CONSTRAINT uq_block_telemetry_event UNIQUE (
    user_id,
    navigation_node_id,
    block_id,
    block_version,
    event_id
  )
);

CREATE INDEX idx_block_telemetry_events_lookup 
  ON block_telemetry_events (user_id, navigation_node_id, block_id, block_version);
```

**Option B: Event ID Column in block_learning_state**

```sql
ALTER TABLE block_learning_state
  ADD COLUMN last_event_id TEXT;

CREATE INDEX idx_block_learning_state_event_dedup
  ON block_learning_state (user_id, navigation_node_id, block_id, block_version, last_event_id)
  WHERE deleted_at IS NULL;
```

**Option C: In-Memory Deduplication (Redis/Cache)**

Not suitable - requires external infrastructure, doesn't survive restarts, harder to verify.

**RECOMMENDATION: Option A (Dedicated Table)**

**Why:**
1. Clear separation of concerns (event log vs learning state)
2. Provides audit trail of all telemetry events
3. Allows querying duplicate attempts
4. Doesn't pollute block_learning_state with transient delivery concerns
5. Can be pruned/archived independently
6. PostgreSQL unique constraint provides atomic deduplication

---

## Implementation Flow

### Current Flow (No Idempotency)

```
Browser
  │
  ├─ Accumulate 30 sec
  │
  ├─ POST { activeTimeSec: 30 }
  │     │
  │     └─ LearningProgressService.recordBlockActiveTime()
  │           │
  │           └─ BlockLearningStateRepository.upsert({ activeTimeSec: 30 })
  │                 │
  │                 └─ SQL: activeTimeSec = activeTimeSec + 30
  │
  └─ Network fails, retry
        │
        └─ POST { activeTimeSec: 30 } ❌ Duplicate
              │
              └─ SQL: activeTimeSec = activeTimeSec + 30 ❌ Double-counted
```

### Proposed Flow (With Idempotency)

```
Browser
  │
  ├─ Start accumulation: eventId = UUID()
  │
  ├─ Accumulate 30 sec
  │
  ├─ POST { eventId, activeTimeSec: 30 }
  │     │
  │     ├─ Try INSERT into block_telemetry_events
  │     │     │
  │     │     ├─ SUCCESS → event is new
  │     │     │     │
  │     │     │     └─ BlockLearningStateRepository.upsert({ activeTimeSec: 30 })
  │     │     │           │
  │     │     │           └─ SQL: activeTimeSec = activeTimeSec + 30 ✅
  │     │     │
  │     │     └─ UNIQUE VIOLATION → event already processed
  │     │           │
  │     │           └─ Return cached result (idempotent) ✅
  │     │
  │     └─ Response: { success: true }
  │
  └─ Network fails, retry
        │
        └─ POST { eventId, activeTimeSec: 30 } (SAME eventId)
              │
              ├─ Try INSERT into block_telemetry_events
              │     │
              │     └─ UNIQUE VIOLATION (eventId already exists) ✅
              │           │
              │           └─ Return cached result ✅
              │
              └─ No double-counting ✅
```

---

## Event ID Lifecycle Semantics

### Generation Point

**When:** `BlockTelemetryProvider` begins accumulating time for a block (on `activeBlock` change to non-null).

**Storage:** Ref that survives across heartbeats but resets on block transition.

```typescript
const currentEventIdRef = useRef<string | null>(null);

useEffect(() => {
  if (activeBlock && !currentEventIdRef.current) {
    // New block or block resumed - generate new event ID
    currentEventIdRef.current = crypto.randomUUID();
  }
  
  if (!activeBlock) {
    // Block left viewport - clear event ID
    currentEventIdRef.current = null;
  }
}, [activeBlock]);
```

### Retry Stability

**Requirement:** HTTP retry MUST use same `eventId`.

**Implementation:** Event ID remains stable in `currentEventIdRef` until block transition or successful delivery + flush.

### Multiple Increments Same Block

**Scenario:** Block observed for 30 sec → delivered → block still observed → 20 more sec accumulated.

**Correct Behavior:**
```
Event A: eventId=UUID-1, +30 sec
Event B: eventId=UUID-2, +20 sec
Total: 50 sec ✅
```

**Implementation:** Generate NEW event ID after successful delivery:

```typescript
const emitActiveTime = async (...) => {
  const eventId = currentEventIdRef.current;
  
  const success = await fetch(..., { body: { eventId, activeTimeSec } });
  
  if (success) {
    // Clear event ID to generate new one for next accumulation
    currentEventIdRef.current = null;
  }
  
  return success;
};
```

---

## Transaction Boundary

**Question:** Should event insertion + active-time update be transactional?

**Analysis:**

**Option 1: Single Transaction**

```typescript
await db.transaction(async (tx) => {
  // 1. Insert event (throws on duplicate)
  await tx.insert(blockTelemetryEvents).values({ eventId, ... });
  
  // 2. Update active time
  await blockRepo.withDb(tx).upsert({ activeTimeSec });
});
```

**Pros:**
- Atomic: event recorded ↔ time accumulated
- No orphaned events

**Cons:**
- Violates D-1 finding ("NO transactions wrap completion")
- More complex error handling
- Requires transaction support verification

**Option 2: Two-Phase (Event Check → Accumulate)**

```typescript
// 1. Try to claim event
try {
  await db.insert(blockTelemetryEvents).values({ eventId, ... });
} catch (UniqueViolationError) {
  // Event already processed - return idempotent response
  return cachedResult;
}

// 2. Accumulate time (event successfully claimed)
await blockRepo.upsert({ activeTimeSec });
```

**Pros:**
- Aligns with D-1 "single-row atomic operations" principle
- Simpler error handling
- No transaction coordinator needed

**Cons:**
- Possible orphaned events if step 2 fails
- Event table grows even on validation failures

**RECOMMENDATION: Option 2 (Two-Phase)**

**Why:**
- Aligns with existing architecture (no transactions around completion/time)
- Simpler implementation
- Orphaned events are acceptable (audit trail of attempts)
- Can be cleaned up in background if needed

---

## Soft-Delete Interaction

**Question:** What happens when `block_learning_state` is soft-deleted?

**Current Behavior:**

```sql
-- Unique index excludes soft-deleted rows
WHERE deleted_at IS NULL
```

**Scenario:**

```
1. Active state: eventId=A, +30 sec → processed
2. Soft-delete block_learning_state
3. Recreate block_learning_state (new row)
4. Retry eventId=A, +30 sec
```

**Desired Behavior:** Event A should remain consumed (already processed once).

**Implementation:** Event table is INDEPENDENT of block_learning_state lifecycle:

```sql
-- Event uniqueness is global across all user+block+version combinations
CONSTRAINT uq_block_telemetry_event UNIQUE (
  user_id,
  navigation_node_id,
  block_id,
  block_version,
  event_id
)
```

**Result:** Event A retry will be rejected even after recreation. ✅

---

## Validation Preservation

**Existing Validation:**

```typescript
activeTimeSec: z.number()
  .int('Time must be an integer')
  .min(0, 'Time cannot be negative')
  .max(600, 'Time increment too large (max 600 seconds)')
```

**D-2 Requirement:** Preserve all existing validation.

**Implementation:** Validation occurs BEFORE event insertion:

```typescript
// 1. Validate request (unchanged)
const parsed = recordBlockActiveTimeBodySchema.safeParse(body);
if (!parsed.success) return 400;

// 2. Check event idempotency
try {
  await insertEvent({ eventId, ... });
} catch (UniqueViolationError) {
  return idempotentResponse;
}

// 3. Accumulate time
await blockRepo.upsert({ activeTimeSec: parsed.data.activeTimeSec });
```

---

## API Contract Changes

### Request Schema (NEW)

```typescript
export const recordBlockActiveTimeBodySchema = z.object({
  eventId: z.string().uuid('Event ID must be a valid UUID'), // NEW
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

### Response (Unchanged)

```typescript
{
  data: BlockLearningState
}
```

### Error Cases

**409 Conflict (Event Already Processed):**

```typescript
{
  error: 'Event already processed',
  eventId: '...',
  processedAt: '2026-09-11T10:30:00Z'
}
```

Response is idempotent success (same as 200 from perspective of "time was counted once").

---

## Migration Strategy

### Database Migration

```sql
-- Phase D-2: Block telemetry event deduplication
CREATE TABLE IF NOT EXISTS block_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identity
  event_id TEXT NOT NULL,
  
  -- Block identity (matches block_learning_state)
  user_id TEXT NOT NULL,
  navigation_node_id UUID NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  
  -- Telemetry payload
  active_time_sec INTEGER NOT NULL CHECK (active_time_sec >= 0 AND active_time_sec <= 600),
  
  -- Audit
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Deduplication constraint
  CONSTRAINT uq_block_telemetry_event UNIQUE (
    user_id,
    navigation_node_id,
    block_id,
    block_version,
    event_id
  )
);

CREATE INDEX idx_block_telemetry_events_lookup 
  ON block_telemetry_events (user_id, navigation_node_id, block_id, block_version, processed_at DESC);

CREATE INDEX idx_block_telemetry_events_cleanup
  ON block_telemetry_events (processed_at);

COMMENT ON TABLE block_telemetry_events IS 'Phase D-2: Idempotent active-time event deduplication';
COMMENT ON COLUMN block_telemetry_events.event_id IS 'Client-generated UUID for idempotency (stable across retries)';
COMMENT ON COLUMN block_telemetry_events.active_time_sec IS 'Time increment for this event (not cumulative)';
```

### Backward Compatibility

**Breaking Change:** Clients MUST send `eventId` after deployment.

**Migration Path:**

1. Deploy backend with optional `eventId` (nullable)
2. Deploy frontend with `eventId` generation
3. Make `eventId` required after full rollout

**Alternative:** Make `eventId` required immediately (cleaner, forces atomic deployment).

**RECOMMENDATION:** Require `eventId` immediately (D-2 deployment is atomic gate milestone).

---

## Cleanup Strategy

**Problem:** Event table grows indefinitely.

**Solution:** Periodic cleanup of old events (30-90 days retention).

**Implementation:** Background job (out of D-2 scope):

```sql
DELETE FROM block_telemetry_events
WHERE processed_at < NOW() - INTERVAL '30 days';
```

**D-2 Deliverable:** Add TODO comment, do not implement cleanup job.

---

## Testing Strategy

### Repository Unit Tests

1. Event insertion succeeds
2. Duplicate event insertion fails (unique violation)
3. Event lookup by identity
4. Different eventIds for same block both succeed

### Service Integration Tests

1. First request processes and accumulates time
2. Duplicate request returns idempotent response without double-counting
3. Concurrent duplicate requests (Promise.all) result in one increment
4. Distinct concurrent events accumulate correctly
5. 600-second limit enforced before event insertion
6. Invalid activeTimeSec rejected before event insertion

### HTTP E2E Tests

1. POST with eventId succeeds
2. POST duplicate eventId returns 409 with cached state
3. POST without eventId fails validation (after required)
4. Concurrent duplicate POST requests result in one increment
5. Authentication required (existing)
6. Malformed eventId rejected

### Scenario Tests (D2-1 through D2-9)

Implemented in `scripts/_gate_3c1r_test_phase_d_active_time_idempotency.ts`.

---

## Implementation Checklist

- [ ] Migration: Create `block_telemetry_events` table
- [ ] Schema: Add `eventId` to `recordBlockActiveTimeBodySchema`
- [ ] Repository: Create `BlockTelemetryEventRepository`
- [ ] Repository: `insertEvent(...)` with duplicate detection
- [ ] Service: Update `recordBlockActiveTime()` with event check
- [ ] Route: Update API route to extract and validate `eventId`
- [ ] Frontend: Update `BlockTelemetryProvider` to generate and track `eventId`
- [ ] Frontend: Update active-time payload to include `eventId`
- [ ] Tests: Repository event insertion tests
- [ ] Tests: Service idempotency tests
- [ ] Tests: HTTP E2E idempotency tests
- [ ] Tests: D2-1 through D2-9 scenario tests
- [ ] Docs: Update API documentation with `eventId` requirement
- [ ] Docs: D-2 implementation report

---

**Design Status:** READY FOR IMPLEMENTATION

**Authorization Requested:** Proceed with minimal idempotency mechanism (dedicated event table + two-phase deduplication).
