# D-2 Backend Verification Execution Plan

## ARCHITECTURAL DECISION ✅

**Issue:** Service imports `db` directly for transactions  
**Finding:** This IS the established project pattern  
**Evidence:**
- `LiveSessionService` imports `db` and calls `db.transaction()`
- `TutorialDeliveryService` imports `db` directly
- `SidebarNavigationValidatorService` imports `db` directly
- Pattern: Services needing transactions import `db`, use `tx as never` for withDb()

**Decision:** KEEP current implementation - follows project architecture

## REMAINING WORK

### 1. Fix Test Type Errors (15 errors)

**Pattern:**
```typescript
// Add mock telemetry repo
const mockTelemetryRepo = {
  withDb: (db: any) => mockTelemetryRepo,
  claimEvent: vi.fn(),
  findByEventId: vi.fn(),
} as any;

// Update constructor (3 params → 4 params)
service = new LearningProgressService(
  mockProgressRepo,
  mockSectionRepo,
  mockBlockRepo,
  mockTelemetryRepo  // ADD THIS
);

// Update method calls (6 params → 7 params)
await service.recordBlockActiveTime(
  identity,
  navigationNodeId,
  subtopicId,
  blockId,
  blockVersion,
  eventId,  // ADD THIS
  activeTimeSec
);

// Update assertions (result.X → result.state.X)
expect(result.state.activeTimeSec).toBe(30);
expect(result.wasProcessed).toBe(true);
expect(result.wasAlreadyProcessed).toBe(false);
```

### 2. Implement D2-1 through D2-11 Scenarios

**Test file:** `packages/db-tutorial/src/__tests__/d2-idempotent-delivery.integration.test.ts`

**D2-1:** First event processed exactly once
- Insert event, verify activeTimeSec incremented

**D2-2:** Same eventId replay idempotent
- Process event, replay same eventId+payload
- Verify: 1 event row, no second increment, wasAlreadyProcessed=true

**D2-3:** Payload conflict rejected
- Process event with activeTimeSec=10
- Replay with activeTimeSec=20
- Verify: EVENT_PAYLOAD_CONFLICT error

**D2-4:** Different eventIds accumulate
- Process 3 events with different IDs
- Verify: 3 event rows, sum of increments

**D2-5:** REAL PostgreSQL rollback (CRITICAL)
- Start transaction, insert event, force failure
- Verify outside transaction: event absent, time unchanged
- Retry successfully

**D2-6:** Concurrent duplicate delivery
- Promise.all() with 2x same eventId
- Verify: 1 event row, 1 increment, 1 processed, 1 alreadyProcessed

**D2-7:** Identity isolation
- Use valid fixtures for different users
- Verify eventId cannot cross user boundaries

**D2-8:** Navigation/block isolation
- Same eventId for different blocks
- Verify isolation

**D2-9:** Soft-delete replay
- Process event, soft-delete state, recreate
- Replay event
- Verify: still idempotent

**D2-10:** 600-second boundary
- activeTimeSec=600 → accepted
- activeTimeSec=601 → rejected

**D2-11:** Zero-second event
- activeTimeSec=0 → accepted and persisted
- Replay → idempotent

### 3. Phase C Regression

Run existing tests:
- Phase C repository tests
- Phase C service tests  
- Phase C HTTP tests
- Phase 4.3 tests
- TypeScript checks

### 4. Scope Audit

```bash
git diff --stat
git diff
```

Verify NO changes to:
- Completion logic
- Revision logic
- expectedTimeSec
- IntersectionObserver
- Page Visibility
- Multi-tab
- RSSB

### 5. Final Report

**Required evidence:**
- TypeScript: PASS (0 errors)
- D2 scenarios: 11/11 PASS
- Rollback: Real PostgreSQL proof
- Concurrency: Actual concurrent test proof
- Payload conflict: Demonstrated
- Regression: All PASS
- Scope: Clean (D-2 only)

**Verdict:** GREEN or BLOCKED (no partial credit)

## EXECUTION ORDER

1. Fix 15 test errors → TypeScript PASS
2. Implement D2-1 through D2-11 → 11/11 PASS
3. Run Phase C regression → All PASS
4. Scope audit → Clean
5. Generate final report → GREEN or BLOCKED
6. STOP - await STAGE 7 authorization
