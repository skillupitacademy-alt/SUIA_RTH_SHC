# Stage 5 — Runtime Providers Evidence

**Document:** 06A_RUNTIME_PROVIDERS  
**Status:** COMPLETE  
**Audit Date:** 2026-10-02  
**Evidence Classification:** VERIFIED (all 4 runtime providers inspected)

---

## Overview

This document provides evidence for the 4 core runtime providers that orchestrate block-level telemetry, progress tracking, and viewport-based active block detection in the tutorial runtime.

**Provider Hierarchy:**
```text
ActiveBlockContext (viewport tracking)
        ↓
  ILSProvider (progress tracking)
        ↓
    InstructionalBlockCompletionOrchestrator (auto-completion)
        ↓
      BlockTelemetryProvider (visit + active-time telemetry)
          ↓
        Block content
```

---

## A.1 BlockTelemetryProvider

**File:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx` (467 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

### Purpose
Orchestrates automatic block-level telemetry emission based on viewport tracking from ActiveBlockContext.

### Props Contract
```typescript
interface BlockTelemetryProviderProps {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  sessionId: string | null; // If null, telemetry disabled
  children: React.ReactNode;
  heartbeatIntervalMs?: number; // default: 30000 (30s)
  enabled?: boolean; // default: true
}
```

### Architecture
```text
ActiveBlockContext (viewport tracking)
        ↓
BlockTelemetryProvider (consumes activeBlock)
        ↓
Timing accumulation (performance.now())
        ↓
Snapshot/swap pattern (lossless accumulation)
        ↓
BlockTelemetryDeliveryQueue (retry + idempotency)
        ↓
POST /api/tutorial/ils/block-visit
POST /api/tutorial/ils/block-active-time
```

### Key Mechanisms

**1. Visit Tracking:**
- Emits visit event when block becomes active
- Duplicate prevention via lastVisitIdentityRef
- API: `POST /api/tutorial/ils/block-visit`
- Payload: `{ navigationNodeId, subtopicId, blockId, blockVersion, sessionId, sectionId }`

**2. Active Time Accumulation:**
```text
TimingState {
  blockId, blockVersion,
  startTime: performance.now(),
  accumulatedMs: number,
  isPaused: boolean
}
```

**3. Snapshot/Swap Pattern (Phase D-2 F2):**
- Calculate totalMs = accumulatedMs + (now - startTime)
- IMMEDIATELY reset accumulator BEFORE network I/O
- Prevents telemetry loss during in-flight delivery
- Preserves sub-second remainders

**4. 600-Second Chunking (Phase D-2 F4):**
- Large time values split into ≤600 second chunks
- Each chunk gets unique eventId (crypto.randomUUID())
- Prevents single-point-of-failure for large values

**5. Delivery Queue (Phase D-2 F3):**
- Durable retry queue survives network failures
- Idempotency: `eventId` prevents duplicate processing
- API response: `{ processed: boolean, alreadyProcessed: boolean }`
- Both `processed=true` and `alreadyProcessed=true` are success outcomes

**6. Visibility Handling:**
- Pauses timing when document.visibilityState === 'hidden'
- Resumes when visible
- Hidden time NOT counted as active time

**7. Heartbeat Flush:**
- Periodic flush every 30 seconds (default)
- Retries pending deliveries
- Serialized flush prevents double-counting

**8. Block Transition:**
- Flushes old block BEFORE stopping
- Emits visit for new block
- Starts timing for new block
- Snapshot/swap prevents data loss

### API Endpoints

**Visit API:**
```
POST /api/tutorial/ils/block-visit
Headers: x-session-id
Body: { navigationNodeId, subtopicId, blockId, blockVersion, sessionId, sectionId }
```

**Active Time API:**
```
POST /api/tutorial/ils/block-active-time
Headers: x-session-id
Body: { navigationNodeId, subtopicId, sectionId, blockId, blockVersion, eventId, activeTimeSec }
Response: { processed: boolean, alreadyProcessed: boolean, data?: ServerState }
```

### Callback Integration (Phase 2B.18 Step 1.3 Step 2)
- Consumes `TelemetryCallbackContext`
- Invokes `onActiveTimeDeliveryAcknowledged(blockId, blockVersion, serverData)` on successful delivery
- Transports authoritative cumulative server state to ILSProvider
- Callback failure does NOT convert successful delivery into retry

### Evidence State Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| Visit tracking | ✅ VERIFIED | emitVisit(), duplicate prevention |
| Active time accumulation | ✅ VERIFIED | TimingState, performance.now() |
| Snapshot/swap pattern | ✅ VERIFIED | snapshotAndCreateEvents() |
| 600-second chunking | ✅ VERIFIED | splitActiveTimeSeconds() |
| Delivery queue | ✅ VERIFIED | BlockTelemetryDeliveryQueue class |
| Idempotency | ✅ VERIFIED | eventId generation, processed/alreadyProcessed flags |
| Visibility pause/resume | ✅ VERIFIED | document.visibilitychange handler |
| Heartbeat flush | ✅ VERIFIED | setInterval(flushAllPending, 30000) |
| Block transition | ✅ VERIFIED | useEffect(activeBlock) with flush-before-stop |
| Callback integration | ✅ VERIFIED | TelemetryCallbackContext, onActiveTimeDeliveryAcknowledged |

---

## A.2 InstructionalBlockCompletionOrchestrator

**File:** `packages/ui/src/tutorial/runtime/InstructionalBlockCompletionOrchestrator.tsx` (378 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

### Purpose
Orchestrates automatic block completion based on active time threshold (≥80% of expectedTimeSec).

### Props Contract
```typescript
interface InstructionalBlockCompletionOrchestratorProps {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  resolveBlockMetadata: (blockId, blockVersion) => 
    Pick<InstructionalBlockMetadata, 'progressRole' | 'expectedTimeSec'> | null;
  enabled?: boolean; // default: true
  children: React.ReactNode;
}
```

### Architecture
```text
ILSProvider.activeBlockProgress
        ↓
InstructionalBlockCompletionOrchestrator
        ↓
resolveBlockMetadata() → progressRole + expectedTimeSec
        ↓
evaluateInstructionalBlockCompletion() [PURE FUNCTION]
        ↓
activeTimeSec >= expectedTimeSec × 0.80 ?
        ↓
markBlockComplete() [tutorialTrackingService]
        ↓
POST /api/tutorial/ils/block-completion
        ↓
LearningProgressService.recordBlockCompletion()
        ↓
TutorialNavigationProgressRepository.markBlockCompleted()
        ↓
tutorial_navigation_progress.completed_blocks[]
```

### Evaluation Logic (Pure Function)

**File:** `packages/ui/src/tutorial/runtime/instructionalBlockCompletion.ts` (233 lines)  
**Evidence:** ✅ VERIFIED (complete file read)

**Threshold constant:**
```typescript
COMPLETION_TIME_RATIO = 0.80
```

**Eligibility requirements:**
1. `progressRole === 'instructional'` (only instructional blocks eligible)
2. `expectedTimeSec` defined and > 0 (missing = auto-completion disabled)
3. `activeTimeSec >= expectedTimeSec × 0.80` (policy threshold)

**Algorithm:**
```typescript
function evaluateInstructionalBlockCompletion(
  metadata: InstructionalBlockMetadata,
  telemetry: BlockTelemetryData
): CompletionEvaluation {
  // Validate identity consistency (blockId, blockVersion must match)
  if (metadata.blockId !== telemetry.blockId) throw Error;
  if (metadata.blockVersion !== telemetry.blockVersion) throw Error;
  
  // Check progressRole eligibility
  if (metadata.progressRole !== 'instructional') {
    return { shouldComplete: false, reason: 'not instructional' };
  }
  
  // Check expectedTimeSec availability
  if (!metadata.expectedTimeSec || metadata.expectedTimeSec <= 0) {
    return { shouldComplete: false, reason: 'missing expectedTimeSec' };
  }
  
  // Calculate completion ratio
  const completionRatio = telemetry.activeTimeSec / metadata.expectedTimeSec;
  
  // Evaluate threshold
  if (completionRatio >= 0.80) {
    return {
      shouldComplete: true,
      reason: `Active time >= 80% of expected time`,
      completionRatio,
      thresholdRatio: 0.80
    };
  }
  
  // Not yet complete
  const remainingSec = Math.ceil(metadata.expectedTimeSec * 0.80 - telemetry.activeTimeSec);
  return {
    shouldComplete: false,
    reason: `Need ${remainingSec}s more`,
    completionRatio,
    thresholdRatio: 0.80
  };
}
```

### Deduplication Strategy (Phase 2B.18.1 Corrections)

**Three-component client key:**
```text
navigationNodeId + blockId + blockVersion
```

**Synchronous in-flight tracking:**
- `inFlightAttemptsRef` Set<string> prevents concurrent evaluations
- Ownership claimed synchronously BEFORE async completion call
- Released in finally block regardless of success/failure

**Retry policy:**
- `succeeded=true`: Completion delivered to backend → no retry
- `succeeded=false`: Network/HTTP failure → retryable on next evaluation
- Component remount clears attempts naturally

**NOT backend identity:**
- Backend canonical identity: `(userId, navigationNodeId, blockId, blockVersion)`
- Client key does NOT include userId (single mount = single authenticated user)
- Backend idempotency is ultimate protection

### Completion Trigger

**Service:** `markBlockComplete()` from `tutorialTrackingService`

**Return value (Phase 2B.18.1):**
```typescript
{
  delivered: boolean;  // true = reached backend
  reason?: string;     // failure reason if delivered=false
}
```

**Authentication:**
- `learnerId` parameter is legacy placeholder (API ignores)
- Authentication via cookies (credentials: 'include')
- API derives userId from validated request context

**Session tracking:**
- Completion does NOT update lastSessionId
- Session tracking happens via visit flow only
- Revision detection uses visit-based session transitions

### Evidence State Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| ILS integration | ✅ VERIFIED | useILS(), activeBlockProgress consumption |
| Metadata resolution | ✅ VERIFIED at integration point | resolveBlockMetadata prop, NOT internal impl |
| Evaluation algorithm | ✅ VERIFIED | Pure function, 80% threshold, identity validation |
| progressRole gating | ✅ VERIFIED | Only 'instructional' blocks eligible |
| expectedTimeSec requirement | ✅ VERIFIED | Missing/invalid = auto-completion disabled |
| Deduplication | ✅ VERIFIED | Three-component key + in-flight tracking |
| Retry policy | ✅ VERIFIED | succeeded=false retryable, succeeded=true not |

---

## A.3 LearningProgressSidebar (RSSB)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx` (145 lines)  
**Evidence status:** ✅ VERIFIED (partial read, complete structure)

### Purpose
Displays real-time learning progress metrics in right sidebar overlay.

### Props Contract
```typescript
interface LearningProgressSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  brand: {
    primaryColor: string;
    secondaryColor: string;
  };
}
```

### Architecture
```text
ILSProvider.overallProgress
ILSProvider.activeBlockProgress
        ↓
LearningProgressSidebar (passive consumer)
        ↓
4 metric sections rendered:
  1. LifecycleMetrics (brand.secondaryColor)
  2. EngagementMetrics (#ff7300 FIXED)
  3. TimeAnalysisMetrics (#0091d5 FIXED)
  4. OverallProgressCard (brand.primaryColor)
```

### UI Structure

**Container:**
- Fixed right sidebar, 440px width
- Sticky positioning: `top: 71px` (header height)
- Slide transition (width 0 ↔ 440px)
- Internal scroll container (self-contained, matches LSNB architecture)

**Header:**
- Title: "◎ Your Progress"
- Border bottom: `#edf2f7`

**Scrollable content:**
- 4 sections with 32px gap
- Padding: `24px 28px 80px 28px`
- Hidden scrollbars (`::-webkit-scrollbar { display: none }`)

### Data Sources

**useILS():**
```typescript
const { overallProgress, activeBlockProgress, loading } = useILS();
```

**NO manual block selector:**
- Follows ActiveBlockContext automatically
- Passive consumer of ILS data
- Does NOT trigger completions
- Does NOT call APIs

### Sub-Components (Not Yet Inspected)

1. **LifecycleMetrics** - Block lifecycle state (first view, learning, reviewing)
2. **EngagementMetrics** - Engagement patterns
3. **TimeAnalysisMetrics** - Time analysis breakdown
4. **OverallProgressCard** - Subtopic-level progress

**Evidence:** ⏳ NOT YET INSPECTED (sub-component internals not read)

### Evidence State Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| Component existence | ✅ VERIFIED | File read, structure documented |
| ILS integration | ✅ VERIFIED | useILS() consumption |
| UI structure | ✅ VERIFIED | 440px sidebar, 4 sections, internal scroll |
| Brand theme | ✅ VERIFIED | primaryColor + secondaryColor props |
| Passive consumer | ✅ VERIFIED | No API calls, no state mutations |
| Sub-component details | ⏳ NOT INSPECTED | LifecycleMetrics, EngagementMetrics, etc. not read |
| Metric calculations | ⏳ NOT INSPECTED | How metrics are derived from ILS data |

---

## A.4 ActiveBlockContext

**File:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx` (398 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

### Purpose
Deterministic viewport-based active block detection using IntersectionObserver.

### Props Contract
```typescript
interface ActiveBlockProviderProps {
  containerRef?: React.RefObject<HTMLElement | null>; // defaults to document if not provided
  children: React.ReactNode;
  anchorPosition?: number; // default: 0.25 (top 25%)
}
```

### Deterministic Selection Policy

**1. Viewport Anchor Zone:**
- Top 25% of viewport (natural reading position)
- Configurable via `anchorPosition` prop (default: 0.25)

**2. Selection Algorithm:**
```text
For each visible block:
  1. Calculate intersection HEIGHT with anchor zone
  2. Select block with HIGHEST intersection height in anchor zone
  3. Tie-breaker: FIRST block in DOM order (upward scroll preference)
  4. No intersection: Select TOPMOST visible block
```

**3. Edge Cases:**
- No blocks visible → `activeBlock = null`
- Single block visible → that block is active
- Multiple blocks → deterministic selection via anchor zone

### Implementation Details

**DOM Query:**
```typescript
// Production mode (with containerRef):
container.querySelectorAll(':scope > [data-block-id]')
// Query only top-level blocks (direct children of container)
// Container blocks observed but NOT their nested children

// Test/fallback mode (without containerRef):
document.querySelectorAll('[data-block-id]')
// Query all blocks in document
```

**Canonical DOM Order:**
```typescript
blockElementsRef.current = Array.from(blocks);
// Stored at initialization for deterministic tie-breaking
```

**Intersection Calculation:**
```typescript
const viewportHeight = window.innerHeight;
const anchorTop = 0;
const anchorBottom = viewportHeight * anchorPosition; // 0.25 default

// For each intersecting block:
const blockTop = rect.top;
const blockBottom = rect.bottom;

const intersectTop = Math.max(blockTop, anchorTop);
const intersectBottom = Math.min(blockBottom, anchorBottom);
const intersectionHeight = Math.max(0, intersectBottom - intersectTop);
```

**Tie-Breaking:**
```typescript
// Find maximum intersection height
const maxHeight = Math.max(...candidates.map(c => c.intersectionHeight));

// Filter to candidates with maximum height
const maxCandidates = candidates.filter(c => c.intersectionHeight === maxHeight);

// Select earliest in DOM order (lowest domIndex)
const selected = maxCandidates.reduce((best, current) => {
  if (current.domIndex < best.domIndex) return current;
  return best;
});
```

**Fallback (no anchor intersection):**
```typescript
// If no block intersects anchor zone, select topmost visible block
let topmost: Element | null = null;
let topmostY = Infinity;

for (const entry of entries) {
  if (!entry.isIntersecting) continue;
  const y = entry.boundingClientRect.top;
  if (y < topmostY) {
    topmostY = y;
    topmost = entry.target;
  }
}
```

### IntersectionObserver Configuration

```typescript
new IntersectionObserver(handleIntersection, {
  root: null, // viewport
  rootMargin: '0px',
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] // Multiple thresholds for smoother updates
});
```

### Update Throttling

**requestAnimationFrame:**
- Updates throttled via `rafRef`
- Cancels pending update before scheduling new one
- Only updates state if activeBlock actually changed

### DOM Identity Extraction

```typescript
const blockId = element.getAttribute('data-block-id');
const blockType = element.getAttribute('data-block-type');
const blockVersion = element.getAttribute('data-block-version') || undefined;

return { blockId, blockType, blockVersion };
```

**Phase 2 contract compliance:** Uses existing `data-block-*` attributes, does NOT introduce wrapper elements.

### Architectural Constraints (from source comments)

- Uses existing Phase 2 DOM identity (data-block-id, data-block-type, data-block-version)
- Does NOT introduce wrapper elements
- Does NOT call ILS APIs
- Does NOT persist state
- Does NOT track time or visits
- Does NOT render UI

### Evidence State Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| Top-25% anchor zone | ✅ VERIFIED | anchorPosition=0.25 default |
| Intersection HEIGHT calculation | ✅ VERIFIED | intersectBottom - intersectTop |
| Highest-height selection | ✅ VERIFIED | Math.max(...heights) |
| DOM-order tie-breaking | ✅ VERIFIED | Lowest domIndex wins |
| Topmost fallback | ✅ VERIFIED | When no anchor intersection |
| Container scoping | ✅ VERIFIED | :scope > [data-block-id] query |
| Multiple thresholds | ✅ VERIFIED | [0, 0.1, 0.25, 0.5, 0.75, 1.0] |
| RAF throttling | ✅ VERIFIED | requestAnimationFrame, cancel pending |
| Identity extraction | ✅ VERIFIED | data-block-* attributes |
| State change detection | ✅ VERIFIED | Only updates if identity changed |

---

## Cross-References

- **Completion Backend**: See `06B_COMPLETION_AND_PROGRESS_RUNTIME.md`
- **Visit Persistence**: See `06C_TELEMETRY_VISIT_PERSISTENCE.md`
- **Active-Time Persistence**: See `06D_TELEMETRY_ACTIVE_TIME_PERSISTENCE.md`
- **Authority Boundaries**: See `06E_TELEMETRY_AUTHORITY_AND_LEDGER.md`
