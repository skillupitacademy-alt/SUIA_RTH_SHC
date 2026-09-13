# PHASE 4.5 — STEP 3: PREFLIGHT INVESTIGATION REPORT

**Report Date:** 2026-09-05  
**Investigation Scope:** BlockTelemetryProvider implementation requirements and constraints  
**Status:** ✅ **CLEARED FOR IMPLEMENTATION**

---

## EXECUTIVE SUMMARY

✅ **All technical dependencies verified from source**

BlockTelemetryProvider implementation is **CLEARED to proceed** with the following proven constraints and semantics.

---

## A. PHASE 4.4 BLOCK-VISIT API CONTRACT

### Schema (Proven from Source)

**File:** `apps/api-server/src/schemas/ils.schemas.ts`

```typescript
export const recordBlockVisitBodySchema = z.object({
  navigationNodeId: z.string().min(1).max(200),      // REQUIRED
  subtopicId: z.string().uuid(),                     // REQUIRED (UUID)
  blockId: z.string().min(1).max(200),              // REQUIRED
  blockVersion: z.string().min(1).max(50),          // REQUIRED
  sessionId: z.string().min(1).max(100),            // REQUIRED
  sectionId: z.string().uuid().optional().nullable(), // OPTIONAL
});
```

### Request Format

**Method:** `POST`  
**Endpoint:** `/api/tutorial/ils/block-visit`  
**Headers:**
- `Content-Type: application/json`
- `x-session-id: <sessionId>` (forwarded by BFF)
- Authentication via cookies (`credentials: 'include'`)

**Body:**
```json
{
  "navigationNodeId": "whatisjava",
  "subtopicId": "5326eeb6-c4c8-4218-9687-2b46f94a9bb4",
  "blockId": "definition-d1-014",
  "blockVersion": "D1",
  "sessionId": "crypto-uuid-v4",
  "sectionId": null
}
```

### Service Behavior (Verified)

**File:** `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts`

- ✅ Authentication via `X-User-ID` header (added by BFF)
- ✅ Brand context via `X-Brand` header (added by BFF)
- ✅ Session ID forwarded via `x-session-id` header
- ✅ Service method: `LearningProgressService.recordBlockVisit()`
- ✅ Visit deduplication handled server-side using sessionId

### Critical Constraints

**blockVersion:**
- ❌ **NOT optional** - Schema requires `z.string().min(1)`
- ✅ Must be provided for every visit
- ⚠️ Runtime `ActiveBlockContext.blockVersion` is `string | undefined`
- **Resolution:** Must coerce `undefined` to a valid version string

**sectionId:**
- ✅ Optional - Schema allows `.optional().nullable()`
- ✅ Can safely pass `null`

**sessionId:**
- ✅ Required by schema
- ✅ Must be obtained from `getOrCreateTutorialLearningSessionId()`
- ✅ BFF forwards via `x-session-id` header

---

## B. PHASE 4.4 BLOCK-ACTIVE-TIME API CONTRACT

### Schema (Proven from Source)

**File:** `apps/api-server/src/schemas/ils.schemas.ts`

```typescript
export const recordBlockActiveTimeBodySchema = z.object({
  navigationNodeId: z.string().min(1).max(200),      // REQUIRED
  subtopicId: z.string().uuid(),                     // REQUIRED
  blockId: z.string().min(1).max(200),              // REQUIRED
  blockVersion: z.string().min(1).max(50),          // REQUIRED
  activeTimeSec: z.number()
    .int('Time must be an integer')
    .min(0, 'Time cannot be negative')
    .max(600, 'Time increment too large (max 600 seconds)'),
  sectionId: z.string().uuid().optional().nullable(), // OPTIONAL
});
```

### Request Format

**Method:** `POST`  
**Endpoint:** `/api/tutorial/ils/block-active-time`  
**Headers:** Same as block-visit

**Body:**
```json
{
  "navigationNodeId": "whatisjava",
  "subtopicId": "5326eeb6-c4c8-4218-9687-2b46f94a9bb4",
  "blockId": "definition-d1-014",
  "blockVersion": "D1",
  "activeTimeSec": 30,
  "sectionId": null
}
```

### Time Semantics (CRITICAL - Verified from Service Layer)

**File:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

```typescript
activeTimeSec: buildAtomicTimeIncrement(
  blockLearningState.activeTimeSec, 
  data.activeTimeSec
)
```

**Helper:** `packages/db-tutorial/src/repositories/tutorial-navigation-progress-sql.helpers.ts`

```typescript
export function buildAtomicTimeIncrement(
  timeSpentColumn: PgColumn,
  incrementSeconds: number
): SQL {
  return sql`${timeSpentColumn} + ${incrementSeconds}`;
}
```

### **✅ PROVEN: activeTimeSec is an INCREMENT (Delta), NOT Cumulative**

**Behavior:**
- Each POST request **ADDS** `activeTimeSec` to existing database value
- Database uses atomic SQL: `activeTimeSec = activeTimeSec + <increment>`
- **Client must send incremental seconds**, not cumulative total

**Example Flow:**
```
Block A active for 30s → POST activeTimeSec: 30
Block A active for 30s more → POST activeTimeSec: 30 (not 60!)
Database now has: 60 seconds total
```

**Constraint:**
- ✅ Maximum increment per request: **600 seconds**
- ✅ Must be integer (whole seconds)
- ✅ Must be non-negative

---

## C. BFF ROUTE BEHAVIOR

### RTH BFF (Verified)

**File:** `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts`

**Behavior:**
1. Authenticates user via `requireStudent(request)`
2. Extracts userId
3. Forwards to central API with headers:
   - `X-Brand: realtutorialhub`
   - `X-User-ID: <userId>`
   - `X-Internal-Secret: <secret>`
   - `x-session-id: <forwarded from client>`
4. Proxies response back to client

**SkillUp BFF:** Same pattern with `X-Brand: skillup`

### Session ID Forwarding

✅ **BFF forwards `x-session-id` header from client to central API**

**Client must:**
- Send sessionId in request body (authoritative)
- Send sessionId in `x-session-id` header (forwarded by BFF)

---

## D. EXISTING TUTORIAL SESSION SERVICE

### File: `src/share-branding/LearningExperience/runtime/tutorialSessionService.ts`

✅ **Complete implementation already exists**

**Key Constants:**
```typescript
export const TUTORIAL_LEARNING_SESSION_KEY = 'tutorialLearningSessionId';
```

**Functions:**
```typescript
export function getOrCreateTutorialLearningSessionId(): string | null
export function readTutorialLearningSessionId(): string | null
export function generateSessionId(): string
export function isValidSessionId(value: unknown): value is string
```

### Semantics (Verified from Source)

**Session Lifecycle:**
- ✅ Created on first call to `getOrCreateTutorialLearningSessionId()`
- ✅ Stored in `sessionStorage['tutorialLearningSessionId']`
- ✅ Survives: page reload, in-tab navigation
- ✅ Destroyed: on tab close, new tab
- ✅ Independent of: Auth Session.id, learnerId, navigationNodeId
- ✅ SSR-safe: returns `null` during server rendering

**UUID Format:**
- Prefers `crypto.randomUUID()` (native browser API)
- Fallback to RFC 4122 v4 via Math.random()
- Validation regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

### Usage in TutorialPageShell

**File:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

✅ **Already initialized in TutorialPageShell useEffect:**

```typescript
useEffect(() => {
  if (sessionInitializedRef.current) return;
  sessionInitializedRef.current = true;

  const sessionId = getOrCreateTutorialLearningSessionId();
  // sessionId now available for telemetry
}, []);
```

**Constraint:** BlockTelemetryProvider must call `getOrCreateTutorialLearningSessionId()` (NOT `readTutorialLearningSessionId()`) to ensure session exists.

---

## E. ACTIVE BLOCK IDENTITY SEMANTICS

### File: `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`

**Interface (Verified):**
```typescript
export interface ActiveBlockIdentity {
  blockId: string;           // Required
  blockType: string;         // Required
  blockVersion?: string;     // OPTIONAL (undefined for unversioned blocks)
}

export type ActiveBlockState = ActiveBlockIdentity | null;
```

### DOM Extraction

**Source:**
```typescript
const blockId = element.getAttribute('data-block-id');      // Required
const blockType = element.getAttribute('data-block-type');  // Required
const blockVersion = element.getAttribute('data-block-version') || undefined;
```

### Block Change Detection

**Provider exposes:**
```typescript
const { activeBlock } = useActiveBlock();
```

**Change semantics:**
- `activeBlock` updates when viewport scrolling changes the deterministic active block
- Updates are throttled via `requestAnimationFrame`
- State only updates if identity actually changed (block identity equality check)

### Versioned vs Unversioned Blocks

**Versioned:** Code (C1), Definition (D1), Summary (S1)
- Have `data-block-version="C1"` attribute
- `activeBlock.blockVersion` is defined (e.g., "C1")

**Unversioned:** Paragraph, Heading, List, Image, etc.
- No `data-block-version` attribute
- `activeBlock.blockVersion` is `undefined`

---

## F. BLOCKVERSION HANDLING STRATEGY

### Problem

**API Schema:** `blockVersion: z.string().min(1)` — **REQUIRED**  
**Runtime:** `activeBlock.blockVersion?: string` — **OPTIONAL**

### Resolution Options Evaluated

**Option A: Default to "V0"**
- ❌ Risk: "V0" may have semantic meaning in existing data
- ❌ Not proven to be architecturally valid

**Option B: Default to "unversioned"**
- ✅ Explicit semantic meaning
- ✅ Distinguishable from actual version tags (D1, C1, S1)
- ✅ Searchable in database queries

**Option C: Skip telemetry for unversioned blocks**
- ❌ Violates Phase 4.5 requirement to track all blocks
- ❌ Would exclude most block types from telemetry

**Option D: Default to blockType**
- ⚠️ Example: `blockVersion = "paragraph"` for paragraph blocks
- ⚠️ Semantically confusing (conflates version with type)
- ❌ Not architecturally clean

**Option E: Empty string**
- ❌ Violates schema: `z.string().min(1)`

### ✅ RECOMMENDED: Option B - "unversioned"

**Rationale:**
- Explicit semantic: "this block does not have a version"
- Distinguishable from versioned blocks (D1, C1, S1)
- Satisfies schema constraint (non-empty string)
- Searchable via SQL: `WHERE block_version = 'unversioned'`
- Future-proof: can add real versioning later

**Implementation:**
```typescript
const blockVersion = activeBlock.blockVersion || 'unversioned';
```

---

## G. SECTIONID HANDLING

### Verified from API Schema

**Schema:** `sectionId: z.string().uuid().optional().nullable()`

✅ **Can safely pass `null`**

### Runtime Context

**Source:** `TutorialRuntimeContext.sectionId: string | null`

**Current state:** Most pages have `sectionId: null` (progressive publishing)

**Strategy:** Pass `runtimeContext.sectionId` as-is (may be `null`)

---

## H. EXISTING TELEMETRY UTILITIES

### File: `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts`

**Functions:**
- `trackTutorialEvent()` — Handles `page_view` and `block_complete` events
- `getTutorialProgress()` — Fetches learner progress
- `markBlockComplete()` — Marks block completed
- `calculatePageProgress()` — Progress calculation

### ⚠️ ARCHITECTURAL CONSTRAINT

**DO NOT duplicate these utilities.**

BlockTelemetryProvider is **DIFFERENT**:
- `tutorialTrackingService` → Handles `page_view` and `block_complete` (manual triggers)
- `BlockTelemetryProvider` → Handles `block-visit` and `block-active-time` (automatic viewport-based)

**Different responsibilities:**
- Tracking service: Manual completion events
- Telemetry provider: Automatic viewport-driven telemetry

**No conflict** - they serve different purposes.

---

## I. TEST CONVENTIONS

### Existing Test File

**File:** `packages/ui/src/tutorial/runtime/__tests__/ILSProvider.test.tsx`

**Framework:** Vitest + React Testing Library

**Patterns observed:**
- `describe()` / `it()` structure
- `vi.fn()` for mocking
- `vi.mock()` for module mocking
- `render()` / `renderHook()` for component testing
- `waitFor()` for async assertions
- Mock `global.fetch`
- Mock `useActiveBlock()` from ActiveBlockContext

**Test Structure:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('../ActiveBlockContext', () => ({
  useActiveBlock: vi.fn(() => ({ activeBlock: null })),
}));

global.fetch = vi.fn();

describe('BlockTelemetryProvider', () => {
  it('should emit visit on block activation', async () => {
    // test
  });
});
```

---

## J. RTH vs SKILLUP ARCHITECTURE

### Verified Uniform Architecture

✅ **Both use `/tutorial-v2/` route**

**RTH:** `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx`  
**SkillUp:** `apps/skillup-web/src/app/tutorial-v2/.../page.tsx`

**Both use:**
- `TutorialPageShell` from shared `@/share-branding/`
- `TutorialRuntimeContext`
- `ActiveBlockProvider` from `@quiz/ui`
- `ILSProvider` from `@quiz/ui` (after STEP 2)

**Difference:** Only BFF endpoints (brand-specific proxies)

### Implication

✅ **BlockTelemetryProvider can be shared across both brands**

**Location:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

---

## K. BLOCKTELEM ETRYPROVIDER LOCATION

### Options Evaluated

**Option A:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`
- ✅ Same location as `ActiveBlockContext.tsx` and `ILSProvider.tsx`
- ✅ Shared across RTH and SkillUp
- ✅ Co-located with related runtime providers
- ✅ Exported from `@quiz/ui`

**Option B:** `src/share-branding/LearningExperience/runtime/BlockTelemetryProvider.tsx`
- ⚠️ Would require import from shared runtime
- ⚠️ Less consistent with existing provider location pattern

### ✅ RECOMMENDED: Option A - packages/ui

**Rationale:**
- Consistent with `ActiveBlockProvider` and `ILSProvider` location
- Already exported from `@quiz/ui` package
- Co-located with related runtime logic
- Shared infrastructure pattern

---

## IMPLEMENTATION ARCHITECTURE

### Provider Hierarchy (Proven)

```
TutorialPageShell
    ↓
ActiveBlockProvider (packages/ui - Phase 3)
    provides: { activeBlock }
    ↓
ILSProvider (packages/ui - Phase 4)
    uses: useActiveBlock()
    provides: { overallProgress, activeBlockProgress, loading, error, refresh }
    ↓
BlockTelemetryProvider (packages/ui - Phase 4.5) ← TO BE CREATED
    uses: useActiveBlock()
    uses: getOrCreateTutorialLearningSessionId()
    provides: NOTHING (side-effects only, no context export)
    calls: POST /api/tutorial/ils/block-visit
    calls: POST /api/tutorial/ils/block-active-time
    ↓
Content rendering
```

### Integration Point

**File:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

**Current structure (after STEP 2):**
```tsx
<ActiveBlockProvider containerRef={contentContainerRef}>
  <ILSProvider navigationNodeId={...} subtopicId={...} sectionId={...}>
    <div className="content">
      {/* blocks */}
    </div>
  </ILSProvider>
</ActiveBlockProvider>
```

**Target structure (STEP 3):**
```tsx
<ActiveBlockProvider containerRef={contentContainerRef}>
  <ILSProvider navigationNodeId={...} subtopicId={...} sectionId={...}>
    <BlockTelemetryProvider
      navigationNodeId={runtimeContext.navigationNodeId}
      subtopicId={runtimeContext.hierarchy.subtopicId}
      sectionId={runtimeContext.sectionId}
    >
      <div className="content">
        {/* blocks */}
      </div>
    </BlockTelemetryProvider>
  </ILSProvider>
</ActiveBlockProvider>
```

---

## TELEMETRY BEHAVIOR SPECIFICATION

### 1. Session Initialization

**On mount:**
```typescript
const sessionId = getOrCreateTutorialLearningSessionId();
if (!sessionId) {
  // SSR - cannot emit telemetry
  return;
}
```

### 2. Block Activation (Initial)

**When activeBlock becomes non-null:**
1. Capture block identity
2. Store as current block
3. Emit visit request:
```typescript
POST /api/tutorial/ils/block-visit
Body: {
  navigationNodeId,
  subtopicId,
  blockId: activeBlock.blockId,
  blockVersion: activeBlock.blockVersion || 'unversioned',
  sessionId,
  sectionId
}
```
4. Start timing: `startTime = performance.now()`

### 3. Active Time Accumulation

**While block remains active and visible:**
- Track elapsed time: `elapsed = performance.now() - startTime`
- Accumulate in local state (milliseconds)

### 4. Heartbeat (30 seconds)

**Every 30 seconds:**
1. Calculate increment: `incrementSec = Math.floor(accumulatedMs / 1000)`
2. If `incrementSec > 0`:
   - Emit time request
   - Reset accumulator: `accumulatedMs = accumulatedMs % 1000` (preserve fractional ms)

```typescript
POST /api/tutorial/ils/block-active-time
Body: {
  navigationNodeId,
  subtopicId,
  blockId,
  blockVersion,
  activeTimeSec: incrementSec,  // ← INCREMENT, not cumulative
  sectionId
}
```

### 5. Block Change (A → B)

**Sequence:**
1. Stop timer for Block A
2. Calculate pending increment for A
3. Flush A's pending time (if > 0 seconds)
4. Clear A state
5. Set current block to B
6. Emit visit for B
7. Start timer for B

**Critical:** Do NOT let A's timer continue after B becomes active

### 6. Visibility Handling

**When `document.visibilityState === 'hidden'`:**
1. Stop accumulation
2. Store partial elapsed time
3. Do NOT flush (wait for visibility restore or block change)

**When `document.visibilityState === 'visible'`:**
1. Resume timing from current point
2. Continue accumulation

**Hidden time is NOT counted as active time**

### 7. Unmount / Navigation

**On unmount:**
1. Stop timer
2. Calculate pending increment
3. Flush pending time (best-effort)
4. Use `keepalive: true` in fetch if available

### 8. Duplicate Prevention

**Visit deduplication:**
- Track last visit identity: `lastVisitIdentity = { blockId, blockVersion }`
- Only emit visit if identity changed

**Flush deduplication:**
- Track in-flight flush promise
- Serialize flush operations (wait for previous to complete)

### 9. Race Condition Prevention

**Problem:** Late API response overwrites new block state

**Solution:**
- Capture block identity at request time
- Ignore response if current block changed

```typescript
const requestIdentity = { blockId, blockVersion };
await fetch(...);
// After response:
if (currentBlock.blockId !== requestIdentity.blockId) {
  // Stale - ignore
  return;
}
```

### 10. Error Handling

**All fetch failures:**
- Log to console (if appropriate)
- Do NOT throw
- Do NOT display UI errors to learner
- Continue operation

---

## CONCURRENCY STRATEGY

### Identified Race Conditions

**Race 1: Rapid block changes**
```
Block A active → visit(A) starts
Block B active → visit(B) starts
visit(A) completes late
```

**Solution:** Capture identity at request time, verify on response

**Race 2: Overlapping time flushes**
```
Heartbeat flush starts (30s)
Block changes → transition flush starts (10s)
Both write overlapping time increments
```

**Solution:** Serialize flushes using promise chain or queue

**Race 3: Visibility + heartbeat**
```
Heartbeat flush starts
Visibility changes to hidden
Flush completes
Timer should already be paused
```

**Solution:** Check visibility before starting flush

### Recommended Pattern

**Use ref-based serialization:**
```typescript
const flushPromiseRef = useRef<Promise<void> | null>(null);

async function flushTime(incrementSec: number) {
  // Wait for previous flush
  if (flushPromiseRef.current) {
    await flushPromiseRef.current;
  }
  
  // Start new flush
  flushPromiseRef.current = doFlush(incrementSec)
    .finally(() => { flushPromiseRef.current = null; });
    
  await flushPromiseRef.current;
}
```

---

## FILES PROPOSED FOR CREATION

### 1. BlockTelemetryProvider Implementation

**Path:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

**Exports:**
```typescript
export interface BlockTelemetryProviderProps {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  children: React.ReactNode;
  heartbeatIntervalMs?: number;  // Default: 30000
  enabled?: boolean;              // Default: true
}

export function BlockTelemetryProvider(props: BlockTelemetryProviderProps): JSX.Element;
```

**Responsibilities:**
- Observe activeBlock from `useActiveBlock()`
- Obtain sessionId from `getOrCreateTutorialLearningSessionId()`
- Emit visit on block activation
- Track active time with heartbeat
- Handle visibility pause/resume
- Flush on block change + unmount
- Prevent duplicates and races
- Silent error handling

### 2. Unit Tests

**Path:** `packages/ui/src/tutorial/runtime/__tests__/BlockTelemetryProvider.test.tsx`

**Test Coverage:**
- Session initialization
- Visit emission on activation
- Visit deduplication (same block rerender)
- Active time accumulation
- Heartbeat flush (30s intervals)
- Block change flush
- Visibility pause/resume
- Unmount flush
- Race condition handling
- Error isolation (fetch failures don't crash)
- SSR safety
- Enabled/disabled flag

---

## FILES PROPOSED FOR MODIFICATION

### 1. TutorialPageShell Integration

**Path:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

**Changes:**
1. Import: `import { BlockTelemetryProvider } from '@quiz/ui';`
2. Wrap ILSProvider children with BlockTelemetryProvider
3. Pass required props from runtimeContext

**Lines changed:** ~10 lines

### 2. Package Exports

**Path:** `packages/ui/src/tutorial/runtime/index.ts`

**Changes:**
- Add export: `export { BlockTelemetryProvider, type BlockTelemetryProviderProps } from './BlockTelemetryProvider';`

**Lines changed:** 1 line

---

## ARCHITECTURAL CONCERNS

### ✅ None - All Clear

**Verified:**
- ✅ No frozen layer modifications required
- ✅ No API schema changes needed
- ✅ No database changes needed
- ✅ Session service exists and is SSR-safe
- ✅ ActiveBlockContext provides required identity
- ✅ API endpoints support both RTH and SkillUp
- ✅ Time semantics proven (increment, not cumulative)
- ✅ blockVersion coercion strategy defined
- ✅ Concurrency strategy established
- ✅ Error handling strategy defined
- ✅ Provider location determined

---

## TEST PLAN

### Unit Tests (Vitest)

**File:** `packages/ui/src/tutorial/runtime/__tests__/BlockTelemetryProvider.test.tsx`

**Test Groups:**

1. **Initialization**
   - Provider renders without crashing
   - Session ID obtained on mount
   - SSR safety (no session = no telemetry)

2. **Visit Tracking**
   - Block A active → visit(A) emitted
   - Block A remains active → no duplicate visit
   - Block A → Block B → visit(B) emitted
   - Visit includes correct identity fields

3. **Active Time Tracking**
   - Time accumulates while block active
   - Heartbeat flushes at 30s intervals
   - Increment values are correct (not cumulative)
   - Fractional seconds preserved between flushes

4. **Block Transitions**
   - A → B: A time flushed, B visit emitted, B timing starts
   - Pending time calculated correctly
   - No timer overlap between blocks

5. **Visibility Handling**
   - Hidden: timer pauses
   - Visible: timer resumes
   - Hidden time not counted
   - Flush on visibility change

6. **Lifecycle**
   - Unmount flushes pending time
   - Best-effort flush (doesn't block unmount)

7. **Race Conditions**
   - Late visit response doesn't corrupt state
   - Concurrent flushes serialized
   - Request identity verified on response

8. **Error Handling**
   - Fetch failure doesn't crash provider
   - 400/401/404/500 handled silently
   - Provider continues after error

9. **Edge Cases**
   - activeBlock null → no telemetry
   - blockVersion undefined → coerced to 'unversioned'
   - sessionId null (SSR) → no telemetry
   - Enabled flag false → no telemetry

### Integration Testing

**Manual browser testing required:**
- Navigate to tutorial-v2 page
- Verify network requests in DevTools
- Scroll between blocks
- Check heartbeat timing
- Switch tabs (visibility)
- Navigate away (lifecycle flush)
- Verify no duplicate requests

---

## IMPLEMENTATION CLEARED

✅ **All dependencies verified from source**  
✅ **All semantic questions resolved**  
✅ **All architectural concerns addressed**  
✅ **Test plan established**  
✅ **No blocking issues**

---

## RECOMMENDATION

**PROCEED TO STEP 3 IMPLEMENTATION**

BlockTelemetryProvider can now be implemented with the following proven constraints:

1. **Location:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`
2. **blockVersion:** Coerce `undefined` to `'unversioned'`
3. **activeTimeSec:** Send **increments** (delta), not cumulative
4. **sessionId:** Use `getOrCreateTutorialLearningSessionId()`
5. **Concurrency:** Serialize flushes via promise ref
6. **Race prevention:** Capture identity at request time
7. **Error handling:** Silent (log, don't throw)
8. **Visibility:** Pause timer when hidden
9. **Test framework:** Vitest + React Testing Library

---

**STEP 3 PREFLIGHT STATUS:** ✅ **COMPLETE**

**BLOCKED:** No  
**CLEARED:** Yes  
**READY FOR:** STEP 3 Implementation

