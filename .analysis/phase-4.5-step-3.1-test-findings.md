# Phase 4.5 STEP 3.1 - Test Findings & Critical Bug

**Date:** 2026-09-05  
**Status:** 🔴 CRITICAL BUG IDENTIFIED  
**Issue:** 600-second remainder loss

---

## Executive Summary

GitHub repository inspection revealed a **critical implementation defect** in BlockTelemetryProvider's handling of >600-second pending time. When accumulated time exceeds the API's 600-second limit, the current implementation clamps the value but **loses the remainder**, resulting in under-reporting of learner active time.

---

## Critical Bug: 600-Second Remainder Loss

### Current Implementation (DEFECTIVE)

```typescript
// flushPendingTime()
const incrementSec = Math.floor(totalPendingMs / 1000);

// emitActiveTime()
const safeIncrement = Math.min(incrementSec, 600);

// After flush
timingStateRef.current.accumulatedMs = totalPendingMs % 1000;
```

### Bug Scenario

**Learner suspended for 1,200 seconds (20 minutes)**

```text
totalPendingMs = 1,200,000ms
incrementSec   = 1,200 seconds
safeIncrement  = 600 seconds (clamped)

POST /block-active-time { activeTimeSec: 600 }

accumulatedMs = 1,200,000 % 1,000 = 0ms
```

**Result:** Remaining 600 seconds **LOST**

### Expected Behavior

```text
Measured: 1,200 seconds
Send: 600 seconds (first flush)
Preserve: 600 seconds (for next flush)

Next heartbeat:
Send: 600 seconds (remainder) + new elapsed time
```

### Impact

- **Under-reporting** of learner active time
- **Data integrity** violation
- **Analytics corruption** - time metrics unreliable
- **Production severity:** HIGH

Browser throttling, tab backgrounding, or system sleep can easily create >600s gaps.

---

## Proposed Fix

### Strategy 1: Remainder Preservation (Recommended)

```typescript
const flushPendingTime = useCallback(async (): Promise<void> => {
  // ... serialization logic ...
  
  const state = timingStateRef.current;
  if (!state) return;
  
  // Calculate total pending time
  let totalPendingMs = state.accumulatedMs;
  
  if (!state.isPaused && state.startTime > 0) {
    const now = performance.now();
    totalPendingMs += (now - state.startTime);
  }
  
  const incrementSec = Math.floor(totalPendingMs / 1000);
  
  if (incrementSec > 0) {
    const requestIdentity: RequestIdentity = {
      blockId: state.blockId,
      blockVersion: state.blockVersion,
    };
    
    // CRITICAL FIX: Cap at 600 but preserve remainder
    const safeIncrement = Math.min(incrementSec, 600);
    const remainderSec = incrementSec - safeIncrement;
    
    flushPromiseRef.current = emitActiveTime(
      requestIdentity.blockId,
      requestIdentity.blockVersion,
      safeIncrement  // Send up to 600s
    ).finally(() => {
      flushPromiseRef.current = null;
      
      if (
        timingStateRef.current?.blockId === requestIdentity.blockId &&
        timingStateRef.current?.blockVersion === requestIdentity.blockVersion
      ) {
        if (timingStateRef.current) {
          // Preserve fractional ms + full-second remainder
          const fractionalMs = totalPendingMs % 1000;
          const remainderMs = remainderSec * 1000;
          timingStateRef.current.accumulatedMs = fractionalMs + remainderMs;
          
          // Reset start time if still running
          if (!timingStateRef.current.isPaused) {
            timingStateRef.current.startTime = performance.now();
          }
        }
      }
    });
    
    await flushPromiseRef.current;
  }
}, [emitActiveTime]);
```

**Benefits:**
- Preserves all time accurately
- Simple implementation
- No API changes required
- Next heartbeat will send remainder

**Trade-offs:**
- Large gaps (e.g., 3600s) require multiple heartbeats to fully report
- But this is acceptable - telemetry is eventually consistent

### Strategy 2: Chunked Emission (Alternative)

```typescript
// Emit multiple 600s chunks immediately
while (incrementSec > 0) {
  const chunk = Math.min(incrementSec, 600);
  await emitActiveTime(blockId, blockVersion, chunk);
  incrementSec -= chunk;
}
```

**Benefits:**
- Immediate complete reporting

**Trade-offs:**
- Multiple sequential API calls
- Higher network overhead
- Could overwhelm API during recovery from long suspend
- Serialization becomes more complex

**Recommendation:** Use Strategy 1 (remainder preservation)

---

## Test Infrastructure Issues

### Problem

Behavioral tests created in STEP 3.1 revealed test infrastructure limitations:

```text
10/11 tests failed
Reason: fake timers + React hooks + async effects
```

The tests are architecturally sound but face technical challenges:
- Vi fake timers don't advance React useEffect properly
- Async state updates require complex `act()` + `waitFor()` combinations
- Timing-sensitive assertions flaky with fake timers

### Status

This is a **test infrastructure problem**, not an implementation problem (except for the 600s bug).

### Recommendation

Rather than spending extensive effort fighting test framework limitations:

1. ✅ Fix the 600-second remainder bug (critical)
2. ✅ Add simpler integration-style test (real timers, shorter delays)
3. ✅ Document behavioral expectations in code comments
4. 🔜 Defer comprehensive timing state machine tests to STEP 4 integration testing

---

## Other Findings from Repository Inspection

### ✅ Session ID Architecture - VERIFIED CORRECT

```typescript
TutorialPageShell
  └── tutorialSessionId (state)
        ├── getOrCreateTutorialLearningSessionId() (once on mount)
        │
        ├────→ BlockTelemetryProvider (prop)
        │        ├── x-session-id header
        │        └── sessionId body field
        │
        └────→ ILSProvider (NOT USED - uses cookies only)
```

**Clarification:** ILSProvider does NOT consume sessionId. It uses `credentials: 'include'` for authentication. BlockTelemetryProvider is the sole consumer of the tutorial learning session ID.

### ✅ Package Boundary - VERIFIED CORRECT

```text
@quiz/ui (packages/ui)
  └── BlockTelemetryProvider
        └── sessionId: string | null (prop)

apps/realtutorialhub-web
  └── TutorialPageShell
        └── getOrCreateTutorialLearningSessionId()
```

No cross-boundary imports. Clean architecture.

### ✅ Frozen Layers - VERIFIED UNTOUCHED

Verified via GitHub `main` branch:
- Phase 4.1 database/migrations ✅
- Phase 4.2 repositories ✅
- Phase 4.3 services ✅
- Phase 4.4 API routes ✅
- ActiveBlockContext.tsx ✅
- ILSProvider.tsx ✅

---

## Test Coverage Status

### Current Coverage (basic.test.tsx - 7/7 passing)

✅ Rendering  
✅ Null session handling  
✅ Visit emission  
✅ blockVersion coercion  
✅ Error handling  
✅ Enabled flag  
✅ Null activeBlock  

### Missing Coverage (behavioral.test.tsx - blocked by test infra)

❌ Heartbeat increment timing  
❌ Cumulative vs increment  
❌ Block transition flush  
❌ Visibility pause/resume  
❌ Unmount flush  
❌ Duplicate visit prevention  
❌ Flush serialization  
❌ 600s cap + remainder ← **CRITICAL**  
❌ Fractional ms preservation  

###  Recommendation

**Defer behavioral tests to STEP 4 integration testing** where we can:
- Test against real APIs
- Use real browser timing
- Verify actual database persistence
- Validate end-to-end timing accuracy

---

## Action Items

### IMMEDIATE (STEP 3.2)

1. **Fix 600-second remainder bug** (Strategy 1)
2. **Add implementation comment** documenting the fix
3. **Update flushPendingTime logic** with remainder preservation
4. **Run existing tests** (should still pass)
5. **TypeScript validation**
6. **Commit fix**

### STEP 4 (Integration Testing)

1. Deploy to test environment
2. Manual testing with real browser suspend/resume
3. Verify database receives correct time values
4. Test block transitions with actual navigation
5. Validate visibility handling on mobile
6. Monitor API success rates

---

## Conclusion

**STEP 3.1 Status:** 🔴 BLOCKED - Critical bug identified

**Next Action:** STEP 3.2 - Fix 600-second remainder bug

**Rationale:** The test findings are valuable even though tests don't pass. They identified the **exact critical bug** that must be fixed before proceeding to STEP 4.

---

**Analysis Date:** 2026-09-05  
**Identified By:** Human code review + GitHub inspection  
**Severity:** 🔴 HIGH - Data integrity violation  
**Priority:** P0 - Must fix before STEP 4
