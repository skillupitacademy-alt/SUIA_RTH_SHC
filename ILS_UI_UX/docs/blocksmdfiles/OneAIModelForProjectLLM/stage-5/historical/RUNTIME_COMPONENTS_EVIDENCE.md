# Stage 5: Runtime Components Evidence

**Audit date:** 2026-10-02  
**Phase:** Runtime Provider + Backend Persistence Deep Inspection  
**Status:**
- **PHASE A — COMPLETE** (runtime providers fully inspected)
- **PHASE B — COMPLETE** (completion chain from client → API → service → repository → database verified; metadata resolver internal gap independent)
- **PHASE C — COMPLETE** (data acquisition path from database to payload verified)
- **TELEMETRY PERSISTENCE — PARTIALLY TRACED** (visit + active-time paths previewed, full trace pending)

---

## PHASE A — RUNTIME PROVIDERS (COMPLETE)

### A.1 BlockTelemetryProvider

**File:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx` (467 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

#### Purpose
Orchestrates automatic block-level telemetry emission based on viewport tracking from ActiveBlockContext.

#### Props Contract
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

#### Architecture
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

#### Key Mechanisms

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

#### API Endpoints

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

#### Callback Integration (Phase 2B.18 Step 1.3 Step 2)
- Consumes `TelemetryCallbackContext`
- Invokes `onActiveTimeDeliveryAcknowledged(blockId, blockVersion, serverData)` on successful delivery
- Transports authoritative cumulative server state to ILSProvider
- Callback failure does NOT convert successful delivery into retry

#### Evidence State Summary

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
| API endpoints | ⏳ NOT INSPECTED | Backend implementation not traced |
| Callback integration | ✅ VERIFIED | TelemetryCallbackContext, onActiveTimeDeliveryAcknowledged |

---

### A.2 InstructionalBlockCompletionOrchestrator

**File:** `packages/ui/src/tutorial/runtime/InstructionalBlockCompletionOrchestrator.tsx` (378 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

#### Purpose
Orchestrates automatic block completion based on active time threshold (≥80% of expectedTimeSec).

#### Props Contract
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

#### Architecture
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

#### Evaluation Logic (Pure Function)

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

#### Deduplication Strategy (Phase 2B.18.1 Corrections)

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

#### Completion Trigger

**Service:** `markBlockComplete()` from `tutorialTrackingService`  
**Evidence:** ⏳ NOT YET INSPECTED (cross-package import, service not read)

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
- BlockLearningStateRepository has atomic revision SQL

#### Evidence State Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| ILS integration | ✅ VERIFIED | useILS(), activeBlockProgress consumption |
| Metadata resolution | ✅ VERIFIED at integration point | resolveBlockMetadata prop, NOT internal impl |
| Evaluation algorithm | ✅ VERIFIED | Pure function, 80% threshold, identity validation |
| progressRole gating | ✅ VERIFIED | Only 'instructional' blocks eligible |
| expectedTimeSec requirement | ✅ VERIFIED | Missing/invalid = auto-completion disabled |
| Deduplication | ✅ VERIFIED | Three-component key + in-flight tracking |
| Retry policy | ✅ VERIFIED | succeeded=false retryable, succeeded=true not |
| Completion service | ⏳ NOT INSPECTED | markBlockComplete() internals not traced |
| Backend API | ⏳ NOT INSPECTED | POST /api/tutorial/ils/block-completion not traced |
| Persistence | ⏳ NOT INSPECTED | Repository/database storage not traced |

---

### A.3 LearningProgressSidebar (RSSB)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx` (145 lines)  
**Evidence status:** ✅ VERIFIED (partial read, complete structure)

#### Purpose
Displays real-time learning progress metrics in right sidebar overlay.

#### Props Contract
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

#### Architecture
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

#### UI Structure

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

#### Data Sources

**useILS():**
```typescript
const { overallProgress, activeBlockProgress, loading } = useILS();
```

**NO manual block selector:**
- Follows ActiveBlockContext automatically
- Passive consumer of ILS data
- Does NOT trigger completions
- Does NOT call APIs

#### Sub-Components (Not Yet Inspected)

1. **LifecycleMetrics** - Block lifecycle state (first view, learning, reviewing)
2. **EngagementMetrics** - Engagement patterns
3. **TimeAnalysisMetrics** - Time analysis breakdown
4. **OverallProgressCard** - Subtopic-level progress

**Evidence:** ⏳ NOT YET INSPECTED (sub-component internals not read)

#### Evidence State Summary

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

### A.4 ActiveBlockContext (RE-INSPECTION)

**File:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx` (398 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

**CORRECTION APPLIED:** Previous simplified "50% visibility threshold" description was inaccurate.

#### Purpose
Deterministic viewport-based active block detection using IntersectionObserver.

#### Props Contract
```typescript
interface ActiveBlockProviderProps {
  containerRef?: React.RefObject<HTMLElement | null>; // defaults to document if not provided
  children: React.ReactNode;
  anchorPosition?: number; // default: 0.25 (top 25%)
}
```

#### Deterministic Selection Policy

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

#### Implementation Details

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

#### IntersectionObserver Configuration

```typescript
new IntersectionObserver(handleIntersection, {
  root: null, // viewport
  rootMargin: '0px',
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] // Multiple thresholds for smoother updates
});
```

#### Update Throttling

**requestAnimationFrame:**
- Updates throttled via `rafRef`
- Cancels pending update before scheduling new one
- Only updates state if activeBlock actually changed

#### DOM Identity Extraction

```typescript
const blockId = element.getAttribute('data-block-id');
const blockType = element.getAttribute('data-block-type');
const blockVersion = element.getAttribute('data-block-version') || undefined;

return { blockId, blockType, blockVersion };
```

**Phase 2 contract compliance:** Uses existing `data-block-*` attributes, does NOT introduce wrapper elements.

#### Architectural Constraints (from source comments)

- Uses existing Phase 2 DOM identity (data-block-id, data-block-type, data-block-version)
- Does NOT introduce wrapper elements
- Does NOT call ILS APIs
- Does NOT persist state
- Does NOT track time or visits
- Does NOT render UI

#### Evidence State Summary

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

## PHASE B — COMPLETION CHAIN (COMPLETE)

**Critical finding:** Canonical block completion authority is `tutorial_navigation_progress.completed_blocks[]`, not `block_learning_state`. The two persistence models have distinct responsibilities with defined authority boundary.

### B.1 markBlockComplete() — CLIENT-SIDE COMPLETION SERVICE

**File:** `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts` (310 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

#### Architecture

```text
InstructionalBlockCompletionOrchestrator
        ↓
markBlockComplete()
        ↓
trackTutorialEvent({ eventType: 'block_complete', ... })
        ↓
Validation (blockId, blockType, blockVersion, subtopicId, navigationNodeId)
        ↓
Block type mapping (D1 → 'technical', C1 → 'code', S1 → 'summary')
        ↓
POST /api/tutorial/ils/block-completion
        ↓
{ navigationNodeId, subtopicId, sectionId, blockId, blockType, blockVersion }
        ↓
[API Route → Service → Repository → Database]
        ↓
tutorial_navigation_progress.completed_blocks[]
```

#### Implementation Details

**markBlockComplete() wrapper:**
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

**trackTutorialEvent() internals:**

1. **Validation:**
   - Requires: blockId, blockType, blockVersion, subtopicId, navigationNodeId
   - Returns `{ delivered: false, reason: 'validation' }` if missing

2. **Block type mapping:**
   ```typescript
   const mapping = {
     'definition': 'technical', // D1 → technical section type
     'code': 'code',           // C1 → code section type
     'summary': 'summary',     // S1 → summary section type
   };
   const backendBlockType = mapping[blockType] || blockType;
   ```

3. **API request:**
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

4. **Session tracking note (from source comments):**
   - Completion does NOT send sessionId (by design)
   - Repository explicitly sets `lastSessionId: null` for completions
   - Session tracking happens via visit flow only
   - Revision detection uses visit-based session transitions

5. **Authentication:**
   - `learnerId` parameter is legacy (API ignores)
   - Actual authentication via `credentials: 'include'` (cookies)
   - API derives userId from validated request context

6. **Return value:**
   ```typescript
   { delivered: true }  // HTTP 2xx
   { delivered: false, reason: 'http' | 'network' | 'validation' }
   ```

#### Failure Isolation

**Critical architectural principle (from source comments):**
- Tracking failure MUST NOT prevent content rendering
- Returns explicit delivery result (not exception)
- Caller can distinguish delivered vs failed
- Silent failure with console logging

#### Evidence State

| Aspect | Status | Evidence |
|--------|--------|----------|
| markBlockComplete() implementation | ✅ VERIFIED | Thin wrapper around trackTutorialEvent |
| trackTutorialEvent() implementation | ✅ VERIFIED | Validation, mapping, API call |
| Block type mapping | ✅ VERIFIED | D1/C1/S1 → backend types |
| API request construction | ✅ VERIFIED | Payload, headers, credentials |
| Failure isolation | ✅ VERIFIED | Returns result, does not throw |
| Authentication mechanism | ✅ VERIFIED | Cookies (credentials: 'include') |
| Session tracking policy | ✅ VERIFIED | sessionId NOT sent for completions |
| **API endpoint implementation** | ✅ VERIFIED | See B.4 below |
| **LearningProgressService** | ✅ VERIFIED | See B.5 below |
| **Repository persistence** | ✅ VERIFIED | See B.6 below |
| **tutorial_navigation_progress schema** | ✅ VERIFIED | See B.7 below |

---

### B.4 Backend API Route

**File:** `apps/api-server/src/app/api/tutorial/ils/block-completion/route.ts` (126 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

#### Implementation

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

**Authentication boundary:**
- Requires `X-Internal-Secret` header (BFF → API server authentication)
- Extracts `userId` and `brand` from validated context
- Constructs `AuthenticatedIdentity` for service layer

**Error handling:**
- `NavigationNodeNotFoundError` → 404
- `InvalidNavigationHierarchyError` → 400
- `InvalidBlockCompletionError` → 400
- Uncaught errors → 500

---

### B.5 LearningProgressService.recordBlockCompletion()

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts` (1000+ lines)  
**Evidence status:** ✅ VERIFIED (method implementation read)

#### Implementation

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

**Business logic responsibilities:**
- Identity validation (userId matches authenticated identity)
- Navigation node validation (belongs to subtopicId via tutorial sections)
- Hierarchy consistency validation (sectionId matches navigationNodeId)
- Progress record existence guarantee
- Required blocks resolution (from canonical section content)
- DTO construction with calculated progress

**NOT service responsibilities:**
- Direct database access
- SQL generation
- Concurrency safety (delegated to repository)
- Idempotency guarantees (delegated to repository)

---

### B.6 TutorialNavigationProgressRepository.markBlockCompleted()

**File:** `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts` (800+ lines)  
**Evidence status:** ✅ VERIFIED (method implementation read)

#### Three-Path Logic

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

**buildAtomicBlockAppend():** Atomic JSONB operation that appends new record ONLY if (blockId, blockVersion) doesn't already exist in array. Prevents both lost updates AND duplicates under concurrent requests.

#### Concurrency Safety

- **Atomic JSONB operations** prevent lost updates
- **Deduplication inside UPDATE** prevents duplicate entries
- **ON CONFLICT DO NOTHING** handles concurrent INSERTs
- **Recursive retry** handles conflict scenarios
- **version increment** enables optimistic locking

#### Session Tracking Policy

**CRITICAL:** Completions do NOT update `last_session_id`.

From source comments:
> `lastSessionId` is VISIT-OWNED: only `recordVisit()` may modify it  
> `recordTime()` and `markBlockCompleted()` must NOT modify `lastSessionId`

**Rationale:** Session tracking happens via visit flow only. Revision detection uses visit-based session transitions.

---

### B.7 Database Schema: tutorial_navigation_progress

**File:** `packages/db-tutorial/src/schema/tutorial-navigation-progress.ts` (113 lines)  
**Evidence status:** ✅ VERIFIED (complete schema read)

#### Table Structure

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

#### JSONB: completed_blocks

**Type:** `Array<CompletedBlockRecord>`

**Structure:**
```typescript
interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string;
  completedAt: string; // ISO 8601 timestamp
}
```

**Canonical completion authority:**
- Stores full completion history
- Preserves version information for content revision tracking
- Supports multiple completions of same blockId with different versions
- Atomic JSONB operations prevent concurrency issues

---

### B.8 Canonical Completion Authority (VERIFIED)

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

**DTO Construction (from service):**
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

**Distinct responsibilities:**

| Concern | Authority | Table |
|---------|-----------|-------|
| Block completion (which blocks done) | ✅ CANONICAL | tutorial_navigation_progress.completed_blocks |
| Active time (how long spent) | ✅ CANONICAL | block_learning_state.active_time_sec |
| Visit count (how many sessions) | ✅ CANONICAL | block_learning_state.visit_count |
| Expected time (metadata) | ✅ CANONICAL | block_learning_state.expected_time_sec |
| Revision count | ✅ CANONICAL | block_learning_state.revision_count |
| Session state | ✅ CANONICAL | block_learning_state.last_session_id |
| Legacy completion timestamp | ⏳ DENORMALIZED | block_learning_state.completed_at |

**Architecture pattern:** Two related state models with defined authority boundary, not competing completion stores.

---

### B.9 Evidence State Summary

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
| **buildBlockMetadataResolver()** | ⏳ NOT INSPECTED | Internal implementation gap (independent of completion chain) |

---

### B.10 Additional Finding: Telemetry Path Preview

**Evidence found during service inspection (not fully traced):**

#### Block Visit Path
```typescript
recordBlockVisit()
    ↓
TutorialSectionRepository.getTutorialByPageIdentity()
    ↓
section.content.blocks.find(b => b.id === blockId && b.version === blockVersion)
    ↓
expectedTimeSec extraction
    ↓
BlockLearningStateRepository.upsert({
      userId, navigationNodeId, blockId, blockVersion,
      lastSessionId, expectedTimeSec, lastViewedAt
    })
```

**Source evidence:** Service explicitly fetches tutorial content and extracts `expectedTimeSec` from block envelope before persisting visit.

#### Active Time Path
```typescript
recordBlockActiveTime()
    ↓
transaction {
      BlockTelemetryEventRepository.claimEvent(eventId)  // Idempotency
      BlockLearningStateRepository.upsert({ activeTimeSec })
    }
```

**Source evidence:** Service uses database transaction to claim event atomically, then accumulates active time. Duplicate events validated but NOT accumulated again.

**Status:** ⏳ NOT YET FULLY TRACED (preview only, next investigation priority)

---

### B.2 Dual Progress API Architecture (NEW FINDING)

**Evidence:** ✅ VERIFIED (tutorialTrackingService.ts)

**Production evidence of two progress pathways:**

#### Path 1: Block Completion (ILS)
```text
markBlockComplete()
        ↓
POST /api/tutorial/ils/block-completion
        ↓
Full block identity (blockId, blockType, blockVersion, navigationNodeId)
        ↓
LearningProgressService.recordBlockCompletion()
        ↓
TutorialNavigationProgressRepository.markBlockCompleted()
        ↓
tutorial_navigation_progress.completed_blocks[]
```

**Evidence:** ✅ VERIFIED (complete chain from client to database)

#### Path 2: Page Progress Retrieval (Legacy)
```text
getTutorialProgress(learnerId, subtopicId)
        ↓
GET /api/tutorial/progress?subtopicId=...
        ↓
Response: { blocksCompleted, completionPercent, assignedUnlocked, progress }
        ↓
Transform to TutorialProgressState
```

**Evidence:** ✅ VERIFIED (client-side implementation), ⏳ backend endpoint not inspected

**Explicitly missing fields:**
```typescript
timeSpentSec: 0,     // Not yet tracked in current API
startedAt: null,     // Not yet tracked in current API
completedAt: null,   // Not yet tracked in current API
```

**Source comment classification:**
> "Legacy /api/tutorial/progress deprecated for block tracking"

**Accurate statement:**
- Legacy progress API remains present and consumed for page progress retrieval
- Block completion tracking uses ILS block-completion endpoint
- Two distinct persistence models (not yet verified whether they converge)

**Correlation with earlier findings:**
- TutorialPageShell architectural blocker comment references backend missing navigationNodeId-level tracking
- getTutorialProgress() returns subtopic-level progress only
- Sidebar completion state currently empty (marks nothing as complete)

---

### B.3 resolveBlockMetadata()

**Integration point:** ✅ VERIFIED (TutorialPageShell)

**TutorialPageShell evidence:**
```typescript
const resolveBlockMetadata = buildBlockMetadataResolver(payload.content.blocks);

<InstructionalBlockCompletionOrchestrator
  resolveBlockMetadata={resolveBlockMetadata}
  ...
/>
```

**Internal implementation:** ⏳ NOT YET VERIFIED

**What is verified:**
- ✅ Passed as prop to orchestrator
- ✅ Source: `buildBlockMetadataResolver(payload.content.blocks)`
- ✅ Returns: `Pick<InstructionalBlockMetadata, 'progressRole' | 'expectedTimeSec'> | null`

**What remains unverified:**
- ❌ Internal logic of buildBlockMetadataResolver()
- ❌ How it constructs lookup from blocks[]
- ❌ Whether it validates blockId/blockVersion match

---

## PHASE C — DATA ACQUISITION PATH (COMPLETE)

**Critical architectural finding:** The learner-facing V2 content path retrieves `tutorial_sections.content`, validates it against `TutorialDocumentSchema`, sanitizes the validated document, and then exposes the sanitized `TutorialDocument.blocks[]` through `TutorialPagePayload.content.blocks`.

### C.1 Complete Verified Path

```text
Learner URL (/tutorial-v2/.../navigationNodeId)
        ↓
page.tsx → resolveRuntimeContext()
        ↓
getPublishedTutorialPagePayload()
        ↓
┌───────────────┴───────────────┐
│                               │
Sidebar hierarchy          Tutorial content
│                               │
↓                               ↓
tutorialSidebarTreesV2     getTutorialByPage()
↓                               ↓
resolveHierarchy()         TutorialDeliveryService
↓                               ↓
TutorialDB                 getTutorialById()
tutorial_subtopics               ↓
        ↓                  Database query
subtopicId (internal)            ↓
        ↓                  tutorial_sections
navigationNodeId                 ↓
        ↓                  WHERE subtopicId = ?
sectionId                    AND navigationNodeId = ?
        ↓                    AND status IN ('approved', 'deployed')
TutorialRuntimeContext           AND (brandId = ? OR brandVisibility = 'shared_visible')
        ↓                    AND deletedAt IS NULL
        │                        ↓
        │                  SELECT content (JSONB)
        │                        ↓
        │                  TutorialDocumentSchema.safeParse()
        │                        ↓
        │                  Content Sanitization
        │                        ↓
        │                  DeliveredTutorial.content
        │                        ↓
        └──────────────────> payload.content.blocks[]
                                 ↓
                          TutorialPageShell
                                 ↓
                          blocks.map(block => ...)
                                 ↓
                          TutorialBlockRenderer
```

---

### C.2 resolveRuntimeContext()

**File:** `src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts` (187 lines)  
**Evidence status:** ✅ VERIFIED (complete file read)

#### Implementation

```typescript
export async function resolveRuntimeContext(
  params: ResolveRuntimeContextParams
): Promise<ResolveRuntimeContextResult> {
  // Call existing delivery service
  const payload = await getPublishedTutorialPagePayload({
    brandId: params.brandId,
    domainSlug: params.domainSlug,
    subjectSlug: params.subjectSlug,
    topicSlug: params.topicSlug,
    subtopicSlug: params.subtopicSlug,
    navigationNodeId: params.navigationNodeId,
  });
  
  if (!payload) {
    return { success: false, reason: 'hierarchy_not_found' };
  }
  
  // Extract sectionId from content metadata
  const sectionId = payload.content.sectionId;
  
  // Find navigation node name from sidebar tree
  const navigationNodeName = findNavigationNodeName(
    payload.sidebar.topics,
    params.navigationNodeId
  ) ?? 'Unknown';
  
  // Construct TutorialRuntimeContext
  const context: TutorialRuntimeContext = {
    learnerId: params.learnerId,
    hierarchy: {
      domainId: payload.hierarchy.domain.id,
      // ... (full hierarchy from payload)
    },
    navigationNodeId: params.navigationNodeId,
    navigationNodeName,
    sectionId,
    brandId: params.brandId,
    sessionId: null, // Populated client-side
  };
  
  return { success: true, context, payload };
}
```

#### Evidence State

| Aspect | Status | Evidence |
|--------|--------|----------|
| Implementation | ✅ VERIFIED | Complete function read |
| Payload retrieval | ✅ VERIFIED | Calls getPublishedTutorialPagePayload() |
| sectionId extraction | ✅ VERIFIED | From payload.content.sectionId |
| Navigation node name | ✅ VERIFIED | Tree traversal with recursive search |
| TutorialRuntimeContext construction | ✅ VERIFIED | All fields mapped |
| learnerId propagation | ✅ VERIFIED | Passed through from params |
| Returns context + payload | ✅ VERIFIED | Both returned for backward compat |
| **Authentication middleware origin** | ⏳ NOT YET FULLY TRACED | Header extraction helper verified, middleware not inspected |

**Authentication helper (verified):**
```typescript
extractLearnerIdFromHeaders(headers):
  1. Check x-user-id header
  2. Fallback to x-shadow-user-id
  3. Return null if neither present
```

---

### C.3 TutorialPagePayload Construction

**File:** `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts` (650+ lines)  
**Evidence status:** ✅ VERIFIED (partial read, payload construction traced)

#### getPublishedTutorialPagePayload()

**Architecture:**
```text
getPublishedTutorialPagePayload()
        ↓
getPublishedTutorialSidebar() → sidebar tree
        ↓
resolveHierarchy() → domain/subject/topic/subtopic
        ↓
getTutorialByPage() → tutorial content
        ↓
Construct TutorialPagePayload
```

**Payload construction (verified):**
```typescript
const content: TutorialPagePayload['content'] = {
  blocks: tutorial?.content?.blocks ?? [],  // ✅ VERIFIED
  sectionId: tutorial?.id ?? null,           // ✅ VERIFIED
};

return {
  hierarchy: {
    domain: { id, name, slug },
    subject: { id, name, slug },
    topic: { id, externalId, name, slug },
    subtopic: { id, externalId, name, slug, tutorialId, canonicalSlug },
  },
  content,
  sidebar: tree,
  theme: runtimeBrand.theme,
  // ... footer, activeUrl
};
```

**Theme construction (verified):**
```typescript
function getRuntimeBrandConfig(brandId): {
  if (brandId === 'skillup') {
    return {
      brand: { name: 'SkillUp IT Academy', shortName: 'SUIA', tagline: '...' },
      theme: {
        primary: '#f54a8d',
        primaryDark: '#d63d7a',
        secondary: '#133382',  // PRODUCTION SOURCE EVIDENCE
        activeBackground: '#fff0f6',
        completed: '#08a64a',
      },
    };
  }
  
  return {
    brand: { name: 'RealTutorialHub', shortName: 'RTH', tagline: '...' },
    theme: {
      primary: '#d03f00',
      primaryDark: '#b63600',
      secondary: '#124fd6',  // PRODUCTION SOURCE EVIDENCE
      activeBackground: '#eef3fa',
      completed: '#08a64a',
    },
  };
}
```

**IMPORTANT:** These theme values are hardcoded in delivery service source code (not database-driven).

---

### C.4 Database Query Path

**File:** `packages/db-tutorial/src/services/tutorial-delivery.service.ts`  
**Evidence status:** ✅ VERIFIED (partial read, query logic traced)

#### getTutorialByPage() → getTutorialById()

**Query construction:**
```typescript
const conditions = [
  eq(tutorialSections.subtopicId, internalSubtopicId),  // TutorialDB internal ID
  isNull(tutorialSections.deletedAt),                    // Exclude soft-deleted
];

// Phase 1: Add navigationNodeId filter if provided
if (navigationNodeId) {
  conditions.push(eq(tutorialSections.navigationNodeId, navigationNodeId));
}

// Filter by publication status (default: only published)
if (!includeUnpublished) {
  conditions.push(
    inArray(tutorialSections.status, ['approved', 'deployed'])
  );
}

// Phase 1: Filter by brand visibility
conditions.push(
  or(
    eq(tutorialSections.brandId, 'shared'),
    eq(tutorialSections.brandId, brandId),
    eq(tutorialSections.brandVisibility, 'shared_visible')
  )
);

// V2: Query single tutorial
const [rawTutorial] = await db
  .select({
    id: tutorialSections.id,
    subtopicId: tutorialSections.subtopicId,
    brandId: tutorialSections.brandId,
    orderIndex: tutorialSections.orderIndex,
    content: tutorialSections.content,  // ✅ JSONB column
    version: tutorialSections.version,
    language: tutorialSections.language,
    publishedAt: tutorialSections.publishedAt,
  })
  .from(tutorialSections)
  .where(and(...conditions))
  .limit(1);
```

**Query filters (verified):**
1. ✅ subtopicId (TutorialDB internal ID, resolved from external ID if needed)
2. ✅ navigationNodeId (exact match when provided)
3. ✅ deletedAt IS NULL (exclude soft-deleted)
4. ✅ status IN ('approved', 'deployed') unless includeUnpublished=true
5. ✅ Brand visibility (shared OR specific brand OR shared_visible)

---

### C.5 Schema Validation + Sanitization (Trust Boundary)

**Evidence:** ✅ VERIFIED (delivery service source comments reference, implementation not fully inspected)

**Trust boundary processing:**
```text
rawTutorial.content (JSONB from database)
        ↓
TutorialDocumentSchema.safeParse()
        ↓
Validated TutorialDocument
        ↓
sanitizationService.sanitizeDocument()
        ↓
Sanitized TutorialDocument
        ↓
DeliveredTutorial.content
        ↓
payload.content.blocks[]
```

**Critical architectural principle:**
> `tutorial_sections.content` is NOT blindly passed to browser. Schema validation + sanitization trust boundary exists between persistence and learner delivery.

**What is verified:**
- ✅ Query retrieves `content` JSONB column
- ✅ `TutorialDocumentSchema` validation referenced in source
- ✅ Sanitization service referenced in source
- ✅ Final payload exposes `blocks: tutorial?.content?.blocks ?? []`

**What remains unverified:**
- ⏳ TutorialDocumentSchema definition (type system vs runtime validation)
- ⏳ sanitizeDocument() implementation
- ⏳ What sanitization rules apply
- ⏳ How validation failures are handled

---

### C.6 Evidence State Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| resolveRuntimeContext() | ✅ VERIFIED | Complete implementation |
| getPublishedTutorialPagePayload() | ✅ VERIFIED | Payload construction traced |
| resolveHierarchy() | ✅ VERIFIED | Domain/subject/topic/subtopic resolution |
| getTutorialByPage() | ✅ VERIFIED | Query dispatch to getTutorialById() |
| getTutorialById() | ✅ VERIFIED | Database query logic |
| tutorial_sections query | ✅ VERIFIED | WHERE clause, filters, SELECT content |
| content JSONB column | ✅ VERIFIED | Source of TutorialDocument |
| TutorialDocumentSchema.safeParse() | ✅ VERIFIED at reference level | Source comments confirm validation |
| sanitizeDocument() | ✅ VERIFIED at reference level | Source comments confirm sanitization |
| payload.content.blocks[] | ✅ VERIFIED | `tutorial?.content?.blocks ?? []` |
| Theme source | ✅ VERIFIED | Hardcoded in getRuntimeBrandConfig() |
| Brand theme values | ✅ VERIFIED | SkillUp #133382 secondary, RTH #124fd6 secondary |
| **Schema validation internals** | ⏳ NOT INSPECTED | TutorialDocumentSchema not read |
| **Sanitization internals** | ⏳ NOT INSPECTED | sanitizeDocument() not read |
| **Authentication middleware** | ⏳ NOT INSPECTED | Header extraction helper verified, middleware not traced

---

## SUMMARY: PHASES A, B, C COMPLETE

**Runtime providers fully inspected:**
- ✅ BlockTelemetryProvider (467 lines): Visit tracking, active time accumulation, snapshot/swap, 600s chunking, delivery queue, idempotency, visibility handling, heartbeat
- ✅ InstructionalBlockCompletionOrchestrator (378 lines): 80% threshold evaluation, identity validation, progressRole gating, deduplication, retry policy
- ✅ LearningProgressSidebar (145 lines): RSSB structure, passive ILS consumer, 4 metric sections, no manual block selector
- ✅ ActiveBlockContext (398 lines): Top-25% anchor zone algorithm, intersection HEIGHT calculation, DOM-order tie-breaking, container scoping

**Client-side completion chain verified:**
- ✅ markBlockComplete() → trackTutorialEvent() → POST /api/tutorial/ils/block-completion
- ✅ Block type mapping (D1 → 'technical', C1 → 'code', S1 → 'summary')
- ✅ Validation, authentication (cookies), failure isolation
- ✅ Session tracking policy (sessionId NOT sent for completions)

**Backend completion chain verified:**
- ✅ API route: Authentication (X-Internal-Secret), AuthenticatedIdentity, service instantiation
- ✅ Service: recordBlockCompletion() with validation, hierarchy check, event creation
- ✅ Repository: markBlockCompleted() with three-path logic, atomic JSONB, idempotency
- ✅ Database: tutorial_navigation_progress.completed_blocks[] JSONB array
- ✅ Canonical completion authority established (not block_learning_state)
- ✅ Concurrency safety via atomic JSONB append with deduplication
- ✅ Version-aware completion (different blockVersion = new record)

**Data acquisition path verified:**
- ✅ resolveRuntimeContext() → getPublishedTutorialPagePayload()
- ✅ Database query: tutorial_sections.content (JSONB) with filters (subtopicId, navigationNodeId, status, brand, deletedAt)
- ✅ Trust boundary: TutorialDocumentSchema.safeParse() → sanitizeDocument() → DeliveredTutorial
- ✅ Payload construction: `blocks: tutorial?.content?.blocks ?? []`
- ✅ Theme source: Hardcoded in getRuntimeBrandConfig() (not database-driven)

**Key architectural findings:**

1. **Canonical completion authority**: `tutorial_navigation_progress.completed_blocks[]` (not `block_learning_state.completed_at`)
2. **Two state models with defined boundary**: Completion authority vs telemetry state (activeTimeSec, visitCount, etc.)
3. **Schema validation + sanitization trust boundary** exists between tutorial_sections.content JSONB and learner delivery
4. **Dual progress API architecture**: ILS block-completion endpoint for tracking, legacy /api/tutorial/progress for page retrieval
5. **ActiveBlockContext uses deterministic top-25% anchor zone policy**, not simple 50% visibility threshold
6. **Telemetry snapshot/swap pattern** prevents data loss during network I/O
7. **Completion orchestrator uses pure function evaluation** with synchronous in-flight tracking
8. **RSSB (LearningProgressSidebar) is passive consumer** of ILS data (no API calls, no mutations)
9. **Theme values hardcoded in delivery service**: SkillUp secondary #133382, RTH secondary #124fd6
10. **Session tracking policy**: Completions do NOT update lastSessionId (visits only)

**Telemetry persistence (partial preview):**
- ⏳ recordBlockVisit() → expectedTimeSec extraction → BlockLearningStateRepository.upsert()
- ⏳ recordBlockActiveTime() → transaction(claimEvent + upsert) with idempotency

**Internal implementation gaps:**
- ⏳ buildBlockMetadataResolver() internal logic (independent of completion chain)
- ⏳ TutorialDocumentSchema validation rules
- ⏳ sanitizeDocument() sanitization rules
- ⏳ LearningProgressSidebar subcomponent metric calculations
- ⏳ Authentication middleware (header extraction verified, middleware not traced)
- ⏳ Full telemetry persistence chain (visit + active-time)

**Next investigation priorities:**
1. Block visit persistence (POST /api/tutorial/ils/block-visit)
2. Active time persistence (POST /api/tutorial/ils/block-active-time)
3. BlockLearningStateRepository internals
4. BlockTelemetryEventRepository (event ledger)
5. block_learning_state schema
6. buildBlockMetadataResolver() internals

---

**End of Runtime Components Evidence — Phases A/B/C Complete, Telemetry Persistence Pending**


---

## T1: Block Visit Persistence Chain

**Status**: COMPLETE

**Evidence Classification**: VERIFIED (complete chain from route → service → repository → database)

### T1.1 API Route Handler

**File**: `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts` (180 lines)

**POST Handler**:
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

**Input Validation**: Zod schema `BlockVisitBodySchema`
- `blockId`: string (canonical block UUID)
- `blockVersion`: string (e.g., 'D1', 'C1', 'S1')
- `navigationNodeId`: string (page/sidebar context)
- `subtopicId`: string (tutorial page identity)
- `sessionId`: string (client-generated session ID)

### T1.2 Service Layer

**File**: `packages/db-tutorial/src/services/learning-progress.service.ts` (offset 584-684)

**Method**: `LearningProgressService.recordBlockVisit()`

**Responsibilities**:
1. **Input Validation**: userId, navigationNodeId, blockId, blockVersion, sessionId, subtopicId
2. **Hierarchy Validation**: Calls `validateNavigationHierarchy()` to ensure navigationNodeId ↔ subtopicId consistency
3. **expectedTimeSec Extraction** (Phase 4.5):
   - Queries: `sectionRepository.getTutorialByPageIdentity(subtopicId, navigationNodeId, brand)`
   - Locates matching block in `section.content.blocks[]`
   - Extracts: `block.expectedTimeSec ?? null`
4. **Atomic Persistence**: Single upsert call to repository

**Key Code**:
```typescript
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

const result = await this.blockLearningStateRepository.upsert({
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  lastSessionId: sessionId,  // Phase 4.6: Database determines session transition
  expectedTimeSec,
  lastViewedAt: now,
});
```

**Design Note**: Service does NOT implement visit/revision logic. All session-aware semantics delegated to repository atomic SQL.

### T1.3 Repository Layer

**File**: `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` (offset 250-380)

**Method**: `BlockLearningStateRepository.upsert()`

**Atomic Semantics**:
- **Operation**: PostgreSQL `INSERT ... ON CONFLICT DO UPDATE`
- **Conflict Target**: 4-part identity `(userId, navigationNodeId, blockId, blockVersion)`
- **Partial Index**: `WHERE deleted_at IS NULL` (supports soft deletes)
- **Concurrency**: SQL-level atomicity, no application-layer locking

**Counter Semantics** (Phase 4.6):

1. **visitCount**: Increments ONLY when session changes
   - SQL: `CASE WHEN lastSessionId IS DISTINCT FROM newSessionId THEN visitCount + 1 ELSE visitCount END`
   - Uses helper: `buildAtomicVisitCountIncrement()`
   - `IS DISTINCT FROM`: NULL-safe comparison (NULL ≠ 'session-123')

2. **revisionCount**: Increments when session changes AND block is completed
   - SQL: `CASE WHEN lastSessionId IS DISTINCT FROM newSessionId AND completedAt IS NOT NULL THEN revisionCount + 1 ELSE revisionCount END`
   - Implements semantic: "Revisiting a completed block in a new session"

3. **firstViewedAt**: Sets timestamp on first visit
   - SQL: `CASE WHEN lastSessionId IS NULL THEN currentTimestamp ELSE firstViewedAt END`
   - Uses helper: `buildAtomicFirstViewedAtInit()`
   - Condition: `lastSessionId IS NULL` indicates never visited before

4. **lastViewedAt**: Always updated to `now`

5. **lastSessionId**: Persisted for next visit comparison

6. **version**: Atomically incremented for optimistic locking

**First Insert Behavior**:
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

**Update Behavior**: See counter semantics above (all logic in SQL)

### T1.4 SQL Helper Functions

**File**: `packages/db-tutorial/src/repositories/tutorial-navigation-progress-sql.helpers.ts` (offset 60-180)

**Exported Helpers**:

1. **`buildAtomicVisitCountIncrement()`**: Session-aware visit increment
   ```sql
   CASE
     WHEN lastSessionId IS DISTINCT FROM 'new-session-id'
     THEN visitCount + 1
     ELSE visitCount
   END
   ```

2. **`buildAtomicFirstViewedAtInit()`**: Timestamp initialization
   ```sql
   CASE
     WHEN lastSessionId IS NULL
     THEN currentTimestamp
     ELSE firstViewedAt
   END
   ```

3. **`buildAtomicRevisionCountIncrement()`**: Completed block revisit increment
   ```sql
   CASE
     WHEN lastSessionId IS DISTINCT FROM 'new-session-id' AND status = 'completed'
     THEN revisionCount + 1
     ELSE revisionCount
   END
   ```

4. **`buildAtomicTimeIncrement()`**: Simple cumulative time
   ```sql
   timeSpentColumn + incrementSeconds
   ```

5. **`buildAtomicVersionIncrement()`**: Optimistic locking
   ```sql
   versionColumn + 1
   ```

**Design Note**: These helpers are REUSED for both page-level (`tutorial_navigation_progress`) and block-level (`block_learning_state`) telemetry, ensuring consistent semantics.

### T1.5 Database Schema

**File**: `packages/db-tutorial/src/schema/block-learning-state.ts` (112 lines)

**Table**: `block_learning_state`

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

**Unique Index**:
```sql
CREATE UNIQUE INDEX uq_block_learning_state_identity
  ON block_learning_state (user_id, navigation_node_id, block_id, block_version)
  WHERE deleted_at IS NULL;
```

**Query Indexes**:
- `idx_block_learning_state_user`: `(user_id)` — learner dashboard
- `idx_block_learning_state_node`: `(user_id, navigation_node_id)` — page-level aggregation
- `idx_block_learning_state_block`: `(block_id, block_version)` — cross-page analytics
- `idx_block_learning_state_last_viewed`: `(user_id, last_viewed_at)` — recommendations

### T1.6 Architecture Notes

**Session-Aware Semantics** (Phase 4.6):
- **Session Transition Detection**: Database compares `lastSessionId IS DISTINCT FROM newSessionId`
- **First Visit Detection**: `lastSessionId IS NULL` means never visited before
- **Atomic Counters**: All increment logic in SQL, no race conditions
- **NULL-Safe Comparison**: `IS DISTINCT FROM` handles NULL vs string comparisons correctly

**Telemetry vs Completion Authority**:
- **Completion Authority**: `tutorial_navigation_progress.completed_blocks[]` (canonical)
- **Telemetry State**: `block_learning_state.completed_at` (denormalized, for query convenience)
- **Boundary**: Completion chain (Phase B) updates BOTH; telemetry chain (T1) only reads completion status for revision logic

**Cross-Page Blocks**:
- Same `(blockId, blockVersion)` on different `navigationNodeId` creates SEPARATE telemetry records
- Design: Telemetry measures per-page engagement, not global block engagement

**Brand Isolation**:
- `userId` already brand-scoped via existing identity model
- No explicit brand column needed in `block_learning_state`

**Concurrency Safety**:
- PostgreSQL `ON CONFLICT` provides row-level locking during upsert
- Atomic SQL operations prevent race conditions (no read-modify-write in application code)
- Optimistic locking via `version` column detects concurrent updates (though upsert minimizes conflicts)

### T1.7 Test Coverage

**Test File**: `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`

**Verified Scenarios**:
- First visit creates `visitCount=1`
- Same session does NOT increment visit
- New session increments visit
- New session + completed block increments revision
- 4-part identity isolation (different versions = different records)
- Soft delete handling (partial unique index)
- Brand isolation (RTH vs SkillUp users)
- Concurrency (10 parallel visits = visitCount=1 if same session)

**Gate Scripts** (production integration tests):
- `scripts/_gate_3c1r_test_phase_d_lifecycle.ts`: Visit/revision lifecycle
- `scripts/_gate_3c1r_test_phase_d_sessions.ts`: Session transition semantics
- `scripts/_gate_3c1r_test_phase_d_concurrency.ts`: Parallel visit handling
- `scripts/_gate_3c1r_test_phase_d_consistency.ts`: Identity isolation, soft delete recovery

### T1.8 Summary

**T1 Block Visit Chain**: COMPLETE

**Path**:
```
POST /api/tutorial/ils/block-visit
  ↓ (Zod validation)
LearningProgressService.recordBlockVisit()
  ↓ (hierarchy validation, expectedTimeSec extraction)
BlockLearningStateRepository.upsert()
  ↓ (atomic SQL with session-aware counters)
block_learning_state table
```

**Key Properties**:
- **Atomic**: Single SQL operation, no race conditions
- **Session-Aware**: Database detects session transitions via `IS DISTINCT FROM`
- **First-Visit Initialization**: `lastSessionId IS NULL` triggers timestamps/counters
- **Revision Semantic**: New session + completed block = revision increment
- **Concurrency-Safe**: PostgreSQL `ON CONFLICT` + atomic SQL counters
- **Reusable Helpers**: Shared SQL builders for page-level and block-level telemetry
- **Partial Index**: Soft delete support via `WHERE deleted_at IS NULL`

**Verified Through**:
- Route handler inspection
- Service method logic
- Repository atomic SQL
- Schema definition
- SQL helper functions
- Unit tests (Phase 4.3)
- Integration gate scripts


---

## T2: Block Active-Time Persistence Chain

**Status**: COMPLETE

**Evidence Classification**: VERIFIED (complete chain from route → service → transaction → event ledger + state upsert)

### T2.1 API Route Handler

**File**: `apps/api-server/src/app/api/tutorial/ils/block-active-time/route.ts` (145 lines)

**POST Handler**:
```typescript
export async function POST(request: NextRequest) {
  const identity = await getAuthenticatedIdentity(request);
  const body = await request.json();
  const { blockId, blockVersion, navigationNodeId, subtopicId, eventId, activeTimeSec, sectionId } 
    = recordBlockActiveTimeBodySchema.parse(body);
  
  const result = await learningProgressService.recordBlockActiveTime(
    identity,
    navigationNodeId,
    subtopicId,
    blockId,
    blockVersion,
    eventId,      // Phase D-2: client-generated idempotency key
    activeTimeSec // Phase D-2: time delta (0-600 seconds)
  );
  
  return NextResponse.json({
    data: result.state,
    processed: result.wasProcessed,              // true = new event
    alreadyProcessed: result.wasAlreadyProcessed // true = duplicate event
  });
}
```

**Input Validation**: Zod schema `recordBlockActiveTimeBodySchema`
- `blockId`: string (canonical block UUID)
- `blockVersion`: string (e.g., 'D1', 'C1', 'S1')
- `navigationNodeId`: string (page/sidebar context)
- `subtopicId`: string (tutorial page identity)
- `eventId`: UUID string (client-generated, idempotency key)
- `activeTimeSec`: integer, 0-600 (time delta in seconds, enforced at schema)
- `sectionId`: UUID string | null (optional)

**600-Second Maximum**: Schema enforces `.max(600, 'Time increment too large (max 600 seconds)')`

**Idempotent Response Contract**:
- Both `processed=true` and `alreadyProcessed=true` are success outcomes
- Client should NOT retry either case
- Error responses (4xx/5xx) are retryable

### T2.2 Service Layer

**File**: `packages/db-tutorial/src/services/learning-progress.service.ts` (offset 725-885)

**Method**: `LearningProgressService.recordBlockActiveTime()`

**Transaction Architecture**:
```typescript
return await db.transaction(async (tx) => {
  // 1. Claim event atomically
  const claimedEvent = await txBlockTelemetryRepo.claimEvent({
    eventId, userId, navigationNodeId, blockId, blockVersion, activeTimeSec
  });
  
  if (claimedEvent) {
    // NEW EVENT: Accumulate active time
    const updatedState = await txBlockStateRepo.upsert({
      userId, navigationNodeId, blockId, blockVersion,
      activeTimeSec,  // Increment (NOT absolute value)
      lastViewedAt: now,
    });
    return { state: updatedState, wasProcessed: true, wasAlreadyProcessed: false };
  } else {
    // DUPLICATE EVENT: Validate payload immutability
    const existingEvent = await txBlockTelemetryRepo.findByEventId(eventId);
    
    // Verify payload unchanged
    if (existingEvent.activeTimeSec !== activeTimeSec || ...) {
      throw new LearningProgressError('EVENT_PAYLOAD_CONFLICT');
    }
    
    // Return current state WITHOUT reprocessing
    const currentState = await txBlockStateRepo.findOne(...);
    return { state: currentState, wasProcessed: false, wasAlreadyProcessed: true };
  }
});
```

**Validation**:
1. **Input validation**: userId, navigationNodeId, blockId, blockVersion, eventId, activeTimeSec
2. **Time bounds**: `0 <= activeTimeSec <= 600` (duplicate of schema check)
3. **Hierarchy validation**: `validateNavigationHierarchy()` ensures navigationNodeId ↔ subtopicId consistency

**Idempotency Enforcement**:
- **Event claim** determines new vs duplicate
- **Payload immutability**: Duplicate with different payload → `EVENT_PAYLOAD_CONFLICT` error
- **State protection**: Duplicate event does NOT reapply time delta (no double-counting)

**Stub State for Deleted Blocks** (D2-9 CRITICAL):
- If event exists but `block_learning_state` is absent (soft-deleted or not yet created)
- Event ledger is authoritative: duplicate must NOT be reprocessed
- Returns stub state to satisfy API contract without restoring/creating state
- Preserves idempotency even across state lifecycle transitions

**Transaction Rollback Resilience** (D2-5):
- If transaction rolls back, event NOT claimed
- Same eventId retryable after rollback
- No orphan events without corresponding state updates

### T2.3 Event Ledger Repository

**File**: `packages/db-tutorial/src/repositories/block-telemetry-event.repository.ts` (126 lines)

**Method**: `BlockTelemetryEventRepository.claimEvent()`

**Atomic Claim Semantics**:
```typescript
async claimEvent(input): Promise<BlockTelemetryEvent | null> {
  const result = await this.dbInstance
    .insert(blockTelemetryEvents)
    .values({
      eventId: input.eventId,
      userId: input.userId,
      navigationNodeId: input.navigationNodeId,
      blockId: input.blockId,
      blockVersion: input.blockVersion,
      activeTimeSec: input.activeTimeSec,
    })
    .onConflictDoNothing({ target: blockTelemetryEvents.eventId })
    .returning();
  
  // Return event if claimed (new), null if duplicate
  return result.length > 0 ? result[0] : null;
}
```

**ON CONFLICT DO NOTHING**:
- If `eventId` is new: inserts and returns event (claim succeeded)
- If `eventId` exists: returns `null` without exception (duplicate detected)
- **No exception-driven flow**: Clean null check, no PostgreSQL 23505 errors to catch
- **Transaction-safe**: Works inside db.transaction() without breaking control flow

**Payload Immutability Validation**:
```typescript
async findByEventId(eventId: string): Promise<BlockTelemetryEvent | null> {
  const result = await this.dbInstance
    .select()
    .from(blockTelemetryEvents)
    .where(eq(blockTelemetryEvents.eventId, eventId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}
```

**Query Methods**:
- `findByBlockIdentity()`: Audit/debug event history for a block
- `countByBlockIdentity()`: Diagnostic event count

**Transaction Support**:
- `withDb(tx)`: Returns new repository instance scoped to transaction
- Used by service to create `txBlockTelemetryRepo` within transaction boundary

### T2.4 Block State Upsert (Active-Time Path)

**File**: `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` (offset 310-360)

**Active-Time Accumulation** (from upsert method):
```typescript
.set({
  // Active time: simple atomic increment (works for both visit and active-time calls)
  activeTimeSec:
    data.activeTimeSec !== undefined
      ? buildAtomicTimeIncrement(blockLearningState.activeTimeSec, data.activeTimeSec)
      : blockLearningState.activeTimeSec,
  
  // Update lastViewedAt when time is recorded
  lastViewedAt: data.lastViewedAt ?? now,
  
  // Preserve other fields
  expectedTimeSec: data.expectedTimeSec !== undefined 
    ? data.expectedTimeSec 
    : blockLearningState.expectedTimeSec,
  
  // lastSessionId intentionally NOT updated by active-time calls
  lastSessionId: data.lastSessionId ?? blockLearningState.lastSessionId,
  
  // visitCount/revisionCount/firstViewedAt NOT updated (no lastSessionId provided)
  visitCount: blockLearningState.visitCount,
  revisionCount: blockLearningState.revisionCount,
  firstViewedAt: blockLearningState.firstViewedAt,
  
  // Atomic version increment
  version: buildAtomicVersionIncrement(blockLearningState.version),
  updatedAt: now,
})
```

**SQL Expression** (from helper):
```sql
active_time_sec = active_time_sec + {incrementSeconds}
```

**Field Update Semantics**:
- `activeTimeSec`: Atomic increment (cumulative)
- `lastViewedAt`: Updated to current timestamp
- `expectedTimeSec`: Preserved if not provided
- `lastSessionId`: **Intentionally NOT updated** (session tracking is visit-owned)
- `visitCount`, `revisionCount`, `firstViewedAt`: **NOT updated** (require session context)
- `completedAt`: Preserved (completion is separate chain)

**Transaction Participation**:
- `withDb(tx)`: Returns new repository instance scoped to transaction
- Used by service to create `txBlockStateRepo` within transaction boundary

### T2.5 Event Ledger Schema

**File**: `packages/db-tutorial/src/schema/block-telemetry-events.ts` (79 lines)

**Table**: `block_telemetry_events`

**Identity Column**:
- `event_id`: TEXT NOT NULL (client-generated UUID, idempotency key)

**Block Identity Columns** (matches block_learning_state):
- `user_id`: UUID NOT NULL
- `navigation_node_id`: TEXT NOT NULL
- `block_id`: TEXT NOT NULL
- `block_version`: TEXT NOT NULL

**Telemetry Payload**:
- `active_time_sec`: INTEGER NOT NULL (time delta, 0-600 seconds)
  - **Critical**: This is an INCREMENT (delta), not cumulative total
  - Validation enforced at service + schema layers

**Timestamps**:
- `processed_at`: TIMESTAMP NOT NULL DEFAULT NOW() (when event was claimed)
- `created_at`: TIMESTAMP NOT NULL DEFAULT NOW() (immutable creation time)

**Unique Index**:
```sql
CREATE UNIQUE INDEX uq_block_telemetry_event_id
  ON block_telemetry_events (event_id);
```

**Query Indexes**:
- `idx_block_telemetry_events_block_lookup`: `(user_id, navigation_node_id, block_id, block_version, processed_at)` — audit queries
- `idx_block_telemetry_events_cleanup`: `(processed_at)` — background cleanup job

**Lifecycle**:
- Events retained indefinitely for audit (no soft delete)
- Cleanup via background job (not implemented yet, index prepared)
- Survives `block_learning_state` soft delete/recreation

### T2.6 Architecture Notes

**Dual-Ledger Model**:
```text
block_telemetry_events
    = Immutable event ledger (idempotency authority)
    = One row per logical telemetry event
    = Never updated or deleted
    = Survives block_learning_state lifecycle

block_learning_state.active_time_sec
    = Cumulative telemetry state
    = Sum of all claimed events
    = Soft-deletable
    = Reconstructable from event ledger
```

**Authority Boundary**:
- **Idempotency authority**: `block_telemetry_events.event_id` (prevents double-counting)
- **Telemetry state authority**: `block_learning_state.active_time_sec` (cumulative total)
- **Completion authority**: `tutorial_navigation_progress.completed_blocks[]` (unchanged)

**Transaction Guarantees**:
- Event claim + state update are atomic
- Rollback discards both (event not claimed, time not accumulated)
- No orphan events without state updates
- No state updates without event ledger entries

**Concurrency Safety**:
- PostgreSQL `ON CONFLICT DO NOTHING` provides atomic claim semantics
- Two concurrent requests with same `eventId` → exactly one processes
- Two concurrent requests with different `eventId` → both process, cumulative time sums correctly
- No read-modify-write race conditions (atomic SQL increment)

**Idempotency Properties**:
- Client generates `eventId` per logical telemetry event
- Server claims event atomically, processes once
- Duplicate delivery (same `eventId`) returns idempotent success
- Payload immutability enforced (same `eventId` must have identical payload)
- No double-counting even under retry storms

**Session Isolation**:
- Active-time calls do NOT send `sessionId`
- Active-time calls do NOT update `lastSessionId`
- Active-time calls do NOT affect visit/revision counters
- Session tracking is visit-owned (recorded via block-visit API only)

**Cross-API Coordination**:
- `recordBlockVisit()`: Updates visitCount, revisionCount, firstViewedAt, lastSessionId
- `recordBlockActiveTime()`: Updates activeTimeSec, lastViewedAt
- `recordBlockCompletion()`: Updates completedAt (via tutorial_navigation_progress), denormalizes to block_learning_state
- APIs coordinate through shared `block_learning_state` table with atomic field-level updates

### T2.7 Test Coverage

**Integration Test**: `packages/db-tutorial/src/__tests__/d2-idempotent-delivery.integration.test.ts` (11 scenarios)

**Verified Scenarios**:
1. **D2-1**: First event processes once
2. **D2-2**: Duplicate event returns idempotent success (same payload)
3. **D2-3**: Duplicate event with different payload throws `EVENT_PAYLOAD_CONFLICT`
4. **D2-4**: Two different events accumulate correctly
5. **D2-5**: Transaction rollback allows retry (event not claimed)
6. **D2-6**: Concurrent duplicate delivery (same eventId) → exactly one processes
7. **D2-7**: User isolation (different users can use same eventId)
8. **D2-8**: Block isolation (same user, different blocks)
9. **D2-9**: Soft-delete resilience (event ledger authoritative even if state deleted)
10. **D2-10**: 600-second limit enforcement (600 valid, 601 invalid)
11. **D2-11**: Zero-second events (valid, idempotent)

**Unit Test**: `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`
- Active time accumulation
- 600-second enforcement
- Negative time rejection
- Identity validation
- Hierarchy validation

**Real PostgreSQL**: All tests use actual PostgreSQL (NOT mocks), verified transaction semantics

### T2.8 Summary

**T2 Block Active-Time Chain**: COMPLETE

**Path**:
```
POST /api/tutorial/ils/block-active-time
  ↓ (Zod validation: 0-600 seconds)
LearningProgressService.recordBlockActiveTime()
  ↓ (hierarchy validation, time bounds check)
db.transaction(async (tx) => {
  ↓
  BlockTelemetryEventRepository.claimEvent()
    ↓ (INSERT ON CONFLICT DO NOTHING)
  block_telemetry_events (event ledger)
  
  if (claimed) {
    ↓
    BlockLearningStateRepository.upsert()
      ↓ (atomic increment)
    block_learning_state.active_time_sec
  }
})
```

**Key Properties**:
- **Idempotent**: Client-generated `eventId` prevents double-counting
- **Atomic Transaction**: Event claim + state update are all-or-nothing
- **Payload Immutability**: Same eventId must have identical payload
- **Concurrency-Safe**: PostgreSQL ON CONFLICT + atomic SQL increment
- **Dual-Ledger**: Immutable event ledger + mutable cumulative state
- **Event Authority**: Event ledger survives state soft-delete/recreation
- **600-Second Chunking**: Client-side chunking enforced at schema + service layers
- **Session Isolation**: Active-time does NOT update lastSessionId (visit-owned)
- **Transaction Rollback Resilience**: Failed transaction allows retry without orphan events

**Verified Through**:
- Route handler inspection (145 lines)
- Service transaction logic (160 lines)
- Event repository atomic claim (126 lines)
- Block state atomic increment (verified in T1)
- Event ledger schema (79 lines)
- Integration tests (11 scenarios, real PostgreSQL)
- Unit tests (service validation, repository integration)
