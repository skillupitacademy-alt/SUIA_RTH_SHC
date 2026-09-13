# Phase 4.5 STEP 3.4 Implementation Plan

## Architecture Change

### Before (BUGGY)
```
timingStateRef
  ↓
flushPendingTime()
  ↓
success → clear timingStateRef
failure → keep timingStateRef (BUT)
  ↓
stopTiming() → timingStateRef = null (DESTROYS DATA)
```

### After (DURABLE)
```
timingStateRef (current block only)
  ↓
Detach measured time
  ↓
pendingQueueRef (survives transitions)
  ↓
tryDeliverPending()
  ↓
success → remove from queue
failure → keep in queue
  ↓
stopTiming() → only clears current timing
```

## Key Functions

### 1. `getPendingKey(blockId, blockVersion): string`
Creates unique key for queue map

### 2. `addToPendingQueue(blockId, blockVersion, ms): void`
Adds/aggregates pending time for a block

### 3. `tryDeliverPending(): Promise<void>`
Attempts to deliver all pending time (respecting 600s limit)

### 4. `captureCurrentTiming(): number`
Captures current elapsed time without destroying state

### 5. Modified `flushPendingTime()`
Now detaches time to pending queue before attempting delivery

## State Transitions

### Heartbeat
```
Current active? → Capture elapsed
Add to pending queue for current block
Try deliver pending (current + old failures)
```

### Block Transition A → B
```
Capture A's elapsed time
Add A to pending queue
Stop A timing (safe - time in queue)
Try deliver pending (best-effort)
Emit B visit
Start B timing
```

### Unmount
```
Capture current elapsed
Add to pending queue
Try deliver (best-effort, non-blocking)
```

## Delivery Strategy

```
For each pending entry:
  If > 600s: send 600s, keep remainder
  If ≤ 600s: send all, remove from queue
  If request fails: keep in queue
```

## Critical Invariants

1. Once measured, time NEVER disappears until successfully delivered
2. Block identity must remain correct (no A time sent as B)
3. Fractional milliseconds preserved
4. 600s cap respected
5. No double-counting
6. Serialized delivery
7. Failed delivery retains full amount
8. Transitions don't block on delivery

## Implementation Steps

1. Add pending queue ref
2. Add helper functions
3. Modify flushPendingTime to use queue
4. Modify transition to safely detach
5. Add heartbeat retry for queue
6. Test all failure scenarios
