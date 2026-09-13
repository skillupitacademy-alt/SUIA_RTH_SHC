# Phase 4.4 Preflight Report

**Date:** 2026-09-05  
**Phase:** 4.4 - API Layer (Block-Level ILS)  
**Status:** Preflight Inspection Complete

---

## Baseline

- **Branch:** main
- **Commit:** `51050c74` - Phase 4.2 + 4.3 complete
- **Working Tree:** Clean
- **Foundation:**
  - Phase 4.1: ✅ Schema + Migration
  - Phase 4.2: ✅ BlockLearningStateRepository
  - Phase 4.3: ✅ LearningProgressService block methods

---

## Architecture Discovery

### API Architecture Type
**Next.js App Router + Multi-tier BFF Pattern**

```
Client (RTH/SkillUp brands)
        ↓
Brand-specific BFF (apps/realtutorialhub-web, apps/skillup-web)
  /api/tutorial/ils/*
        ↓
API Gateway (services/api-gateway) - Cloudflare Workers/Hono
  Routing + Auth + Brand resolution
        ↓
Centralized API Server (apps/api-server)
  /api/tutorial/ils/*
        ↓
Service Layer (@quiz/db-tutorial)
        ↓
Repository Layer
        ↓
PostgreSQL
```

### Key Architectural Points

1. **Dual API Layer:**
   - BFF: Brand-specific Next.js routes (thin proxy)
   - Central: Shared API server (business logic + service invocation)

2. **Authentication Flow:**
   - BFF: Authenticates user via `requireStudent()` (brand-specific JWT)
   - BFF → Central: Forwards via `X-User-ID`, `X-Brand`, `X-Internal-Secret` headers
   - Central: Validates internal auth via `validateRequest()` middleware
   - Central: Constructs `AuthenticatedIdentity` from headers

3. **No tRPC:**
   - This project uses Next.js Route Handlers, not tRPC
   - REST-like HTTP API with Zod validation

---

## Existing Page-Level ILS APIs (Analogous Patterns)

### 1. Visit API

**BFF:** `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts`
**Central:** `apps/api-server/src/app/api/tutorial/ils/visit/route.ts`

**Pattern:**
```typescript
// BFF Layer
export async function POST(request: NextRequest) {
  // 1. Authenticate user (brand-specific)
  const user = await requireStudent(request);
  
  // 2. Parse body
  const body = await request.json();
  
  // 3. Proxy to central API
  const response = await fetch(`${apiUrl}/tutorial/ils/visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Brand': 'realtutorialhub',
      'X-User-ID': user.userId,
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET,
      'x-session-id': request.headers.get('x-session-id'),
    },
    body: JSON.stringify(body),
  });
  
  return NextResponse.json(await response.json());
}

// Central API Layer
export async function POST(request: NextRequest) {
  // 1. Validate internal auth
  const authValidation = validateRequest(request, { requireInternalSecret: true });
  if (authValidation.error) return authValidation.error;
  
  // 2. Construct authenticated identity
  const identity: AuthenticatedIdentity = {
    userId: context.userId,
    brand: context.brand,
    sessionId: request.headers.get('x-session-id') || undefined,
  };
  
  // 3. Parse & validate request body
  const parsed = recordVisitBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.issues }, { status: 400 });
  }
  
  // 4. Instantiate service
  const progressRepo = new TutorialNavigationProgressRepository();
  const sectionRepo = new TutorialSectionRepository();
  const service = new LearningProgressService(progressRepo, sectionRepo);
  
  // 5. Call service
  const progress = await service.recordVisit(
    identity,
    parsed.data.navigationNodeId,
    parsed.data.subtopicId,
    parsed.data.sessionId,
    parsed.data.sectionId
  );
  
  // 6. Return result
  return NextResponse.json({ data: progress });
}
```

**Schema:** `apps/api-server/src/schemas/ils.schemas.ts`
```typescript
export const recordVisitBodySchema = z.object({
  navigationNodeId: z.string().min(1).max(200),
  subtopicId: z.string().uuid(),
  sessionId: z.string().min(1).max(100),
  sectionId: z.string().uuid().optional().nullable(),
});
```

**Error Handling:**
- `NavigationNodeNotFoundError` → 404
- `InvalidNavigationHierarchyError` → 400
- Generic errors → 500 with log

### 2. Active Time API

**BFF:** `apps/realtutorialhub-web/src/app/api/tutorial/ils/active-time/route.ts`
**Central:** `apps/api-server/src/app/api/tutorial/ils/active-time/route.ts`

**Pattern:** Same as visit (BFF proxy + central service invocation)

**Schema:**
```typescript
export const recordActiveTimeBodySchema = z.object({
  navigationNodeId: z.string().min(1).max(200),
  subtopicId: z.string().uuid(),
  incrementSeconds: z.number().int().min(0).max(3600),
});
```

---

## Phase 4.3 Service Contract (Source-Verified)

### Method 1: `recordBlockVisit()`

**Signature:**
```typescript
async recordBlockVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string
): Promise<BlockLearningState>
```

**Requirements:**
- ✅ AuthenticatedIdentity (userId, brand)
- ✅ navigationNodeId (slug, not UUID)
- ✅ subtopicId (UUID)
- ✅ blockId (canonical block identity)
- ✅ blockVersion (D1, C1, S1, etc.)
- ✅ sessionId (for session-aware visit logic)

**Business Logic (in service):**
- First visit → visitCount = 1
- Same session (30-min timeout) → no increment
- New session → visitCount + 1
- New session + completed → revisionCount + 1

**Returns:** `BlockLearningState` (full repository object)

**Errors:**
- `LearningProgressError` (validation failures)
- `InvalidNavigationHierarchyError` (hierarchy mismatch)
- `NavigationNodeNotFoundError` (missing node)

### Method 2: `recordBlockActiveTime()`

**Signature:**
```typescript
async recordBlockActiveTime(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  activeTimeSec: number
): Promise<BlockLearningState>
```

**Requirements:**
- ✅ Same identity/hierarchy as visit
- ✅ activeTimeSec: 0-600 (block-level limit, enforced by service)

**Business Logic:**
- Accumulates time atomically
- Does NOT increment visits
- Can create state if none exists (visitCount=0)

**Returns:** `BlockLearningState`

**Errors:**
- `InvalidTimeUpdateError` (negative or > 600)
- `LearningProgressError` (validation)
- `InvalidNavigationHierarchyError`

### Method 3: `calculateBlockTimeComparison()`

**Signature:**
```typescript
calculateBlockTimeComparison(blockState: BlockLearningState): {
  actualTimeSec: number;
  expectedTimeSec: number | null;
  differenceTimeSec: number | null;
  ratioActualToExpected: number | null;
}
```

**Note:** Pure calculation, synchronous, no database access

**Decision:** Should NOT be exposed as standalone API endpoint
- Reason: It's a pure helper that requires BlockLearningState input
- Clients don't independently fetch block state for calculation
- If needed, metrics will be included in other responses

---

## Phase 4.4 API Contract (Proposed)

### Operation 1: Record Block Visit

**Endpoint:** `POST /api/tutorial/ils/block-visit`

**Request Body:**
```typescript
{
  navigationNodeId: string;    // Page slug
  subtopicId: string;           // UUID
  blockId: string;              // Canonical block UUID
  blockVersion: string;         // Content version (D1, C1, etc.)
  sessionId: string;            // Learning session identifier
  sectionId?: string | null;    // Optional section UUID
}
```

**Headers (BFF → Central):**
```
X-User-ID: string
X-Brand: string
X-Internal-Secret: string
x-internal-key: string
x-session-id: string  (forwarded from client)
```

**Authenticated Identity Construction:**
```typescript
const identity: AuthenticatedIdentity = {
  userId: context.userId,      // From X-User-ID header
  brand: context.brand,        // From X-Brand header
  sessionId: request.headers.get('x-session-id') || undefined,
};
```

**Service Invocation:**
```typescript
const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo);
const result = await service.recordBlockVisit(
  identity,
  parsed.data.navigationNodeId,
  parsed.data.subtopicId,
  parsed.data.blockId,
  parsed.data.blockVersion,
  parsed.data.sessionId
);
```

**Response:**
```typescript
{
  data: BlockLearningState  // Full state object
}
```

**Errors:**
- 400: Invalid request body, validation failure, hierarchy mismatch
- 401: Unauthenticated
- 403: Forbidden (if authorization fails)
- 404: Navigation node not found
- 500: Internal server error

---

### Operation 2: Record Block Active Time

**Endpoint:** `POST /api/tutorial/ils/block-active-time`

**Request Body:**
```typescript
{
  navigationNodeId: string;
  subtopicId: string;
  blockId: string;
  blockVersion: string;
  activeTimeSec: number;      // 0-600 seconds (validated by API, enforced by service)
  sectionId?: string | null;
}
```

**Headers:** Same as Operation 1

**Authenticated Identity:** Same construction as Operation 1

**Service Invocation:**
```typescript
const result = await service.recordBlockActiveTime(
  identity,
  parsed.data.navigationNodeId,
  parsed.data.subtopicId,
  parsed.data.blockId,
  parsed.data.blockVersion,
  parsed.data.activeTimeSec
);
```

**Response:**
```typescript
{
  data: BlockLearningState
}
```

**Errors:** Same as Operation 1, plus:
- 400: Time out of range (< 0 or > 600)

---

### Operation 3: Calculate Time Comparison

**Decision:** NOT EXPOSED AS STANDALONE API ENDPOINT

**Rationale:**
- Pure calculation requiring BlockLearningState input
- Client doesn't independently fetch block state for this
- If time comparison metrics are needed, they should be:
  - Included in block visit/time responses
  - Provided by a dedicated "get block state" endpoint (future phase)
- Current Phase 4.3 certification states this is "pure calculation only"
- No evidence in existing API architecture for exposing pure helper functions

**Alternative:** If time metrics are required in Phase 4.5+, add them to existing responses:
```typescript
{
  data: {
    ...blockState,
    timeComparison: {
      actualTimeSec,
      expectedTimeSec,
      differenceTimeSec,
      ratioActualToExpected
    }
  }
}
```

---

## Security Requirements

### Authentication
✅ **BFF Layer:** `requireStudent(request)` - extracts user from brand-specific JWT
✅ **Central Layer:** `validateRequest(request, { requireInternalSecret: true })` - validates internal auth headers

### Authorization
✅ **Self-scoped:** userId from authenticated context only
✅ **No spoofing:** Client cannot provide arbitrary userId
✅ **Brand isolation:** Brand from authenticated context
✅ **Hierarchy validation:** Service validates navigationNode → subtopic relationship

### Identity Construction
```typescript
// ✅ CORRECT - From authenticated context
const identity: AuthenticatedIdentity = {
  userId: context.userId,
  brand: context.brand,
};

// ❌ FORBIDDEN - From request body
const identity: AuthenticatedIdentity = {
  userId: body.userId,  // NEVER
  brand: body.brand,    // NEVER
};
```

### Validation Layers

**API Layer (Transport Validation):**
- Malformed JSON → 400
- Missing required fields → 400
- Invalid types (string vs number) → 400
- Basic format checks (UUID format, string length)

**Service Layer (Business Validation):**
- Block time limit (600s) → InvalidTimeUpdateError
- Hierarchy consistency → InvalidNavigationHierarchyError
- Navigation node existence → NavigationNodeNotFoundError
- Session semantics (30-min timeout)

**Separation:**
- API does NOT duplicate service business rules
- API does NOT enforce 600-second limit (service does)
- API validates transport; service validates business

---

## Input Validation Schemas (Proposed)

### Schema 1: Block Visit

**File:** `apps/api-server/src/schemas/ils.schemas.ts`

```typescript
/**
 * POST /api/tutorial/ils/block-visit
 * 
 * Phase 4.4: Block-level visit tracking
 */
export const recordBlockVisitBodySchema = z.object({
  navigationNodeId: navigationNodeIdSchema,    // Existing: z.string().min(1).max(200)
  subtopicId: uuidSchema,                       // Existing: z.string().uuid()
  blockId: blockIdSchema,                       // Existing: z.string().min(1).max(200)
  blockVersion: blockVersionSchema,             // Existing: z.string().min(1).max(50)
  sessionId: sessionIdSchema,                   // Existing: z.string().min(1).max(100)
  sectionId: uuidSchema.optional().nullable(),  // Existing pattern
});

export type RecordBlockVisitBody = z.infer<typeof recordBlockVisitBodySchema>;
```

**Note:** All constituent schemas already exist in `ils.schemas.ts`

### Schema 2: Block Active Time

```typescript
/**
 * POST /api/tutorial/ils/block-active-time
 * 
 * Phase 4.4: Block-level time tracking
 */
export const recordBlockActiveTimeBodySchema = z.object({
  navigationNodeId: navigationNodeIdSchema,
  subtopicId: uuidSchema,
  blockId: blockIdSchema,
  blockVersion: blockVersionSchema,
  activeTimeSec: z.number()
    .int('Time must be an integer')
    .min(0, 'Time cannot be negative')
    .max(600, 'Time increment too large (max 600 seconds)'),  // Block-level limit
  sectionId: uuidSchema.optional().nullable(),
});

export type RecordBlockActiveTimeBody = z.infer<typeof recordBlockActiveTimeBodySchema>;
```

**Note:** Stricter than page-level `timeIncrementSchema` (600 vs 3600)

---

## Error Mapping

### Service Errors → HTTP Status

| Service Error | HTTP Status | Response |
|---------------|-------------|----------|
| `NavigationNodeNotFoundError` | 404 | `{ error: error.message }` |
| `InvalidNavigationHierarchyError` | 400 | `{ error: error.message }` |
| `InvalidTimeUpdateError` | 400 | `{ error: error.message }` |
| `LearningProgressError` (validation) | 400 | `{ error: error.message }` |
| Zod validation failure | 400 | `{ error: 'Invalid request body', issues: zodError.issues }` |
| Auth failure (BFF) | 401 | `{ error: 'Unauthorized' }` |
| Auth failure (Central) | 401 | `{ error: 'Unauthorized', message: 'Authentication required' }` |
| Generic error | 500 | `{ error: 'Internal server error' }` |

---

## Response Contract

### Existing Pattern (Page-Level)
```typescript
return NextResponse.json(
  { data: progressRecord },  // Wrapped in data envelope
  { 
    status: 200,
    headers: { 'Cache-Control': 'no-cache' }
  }
);
```

### Phase 4.4 Response (Following Pattern)
```typescript
return NextResponse.json(
  { data: blockLearningState },
  {
    status: 200,
    headers: { 'Cache-Control': 'no-cache' }
  }
);
```

**DTO Consideration:**
- Existing page-level APIs return full service objects
- No evidence of DTO transformation layer
- BlockLearningState includes all fields (including internal ones)
- **Decision:** Follow existing pattern - return full BlockLearningState
- Future phase can add DTO layer if needed

**Fields Exposed:**
```typescript
{
  id: string;
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;  // Always null for active records
}
```

---

## Rate Limiting

### Existing Infrastructure
**File:** `services/api-gateway/src/middleware/rate-limit.ts`

Gateway has rate limiting middleware applied globally to all routes.

**Phase 4.4 Decision:**
- Block telemetry inherits existing gateway rate limiting
- No additional block-specific rate limits
- High-frequency time updates already handled by existing infrastructure
- If block-specific limits needed, they belong to Phase 4.5+ (runtime integration)

---

## Repository Injection Pattern

### Existing Pattern (Page-Level)
```typescript
// Instantiate repositories
const progressRepo = new TutorialNavigationProgressRepository();
const sectionRepo = new TutorialSectionRepository();

// Instantiate service with dependencies
const service = new LearningProgressService(progressRepo, sectionRepo);
```

### Phase 4.4 Pattern (Block-Level)
```typescript
// Instantiate all repositories
const progressRepo = new TutorialNavigationProgressRepository();
const sectionRepo = new TutorialSectionRepository();
const blockRepo = new BlockLearningStateRepository();  // Phase 4.2

// Instantiate service with Phase 4.3 constructor
const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo);
```

**Note:** Phase 4.3 already updated constructor to require `blockRepo` parameter

---

## File Structure (Phase 4.4 Implementation)

### Central API (Primary Implementation)

**New Files:**
1. `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts`
2. `apps/api-server/src/app/api/tutorial/ils/block-active-time/route.ts`

**Modified Files:**
3. `apps/api-server/src/schemas/ils.schemas.ts` (add 2 new schemas)

**Tests:**
4. `apps/api-server/src/app/api/tutorial/ils/__tests__/block-visit.test.ts` (new)
5. `apps/api-server/src/app/api/tutorial/ils/__tests__/block-active-time.test.ts` (new)

### BFF Layer (Per Brand)

**RTH BFF:**
6. `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts`
7. `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts`

**SkillUp BFF (if exists):**
8. `apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts`
9. `apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts`

---

## Test Strategy

### Central API Tests (Required)

**Test Categories:**

#### 1. Authentication
- ✅ Unauthenticated request rejected (no headers)
- ✅ Invalid internal secret rejected
- ✅ Valid auth succeeds

#### 2. Authorization
- ✅ Self-scoped userId (from header, not body)
- ✅ Brand-scoped context
- ✅ Cannot spoof userId via body

#### 3. Validation
- ✅ Missing navigationNodeId → 400
- ✅ Missing blockId → 400
- ✅ Missing blockVersion → 400
- ✅ Invalid sessionId (block-visit) → 400
- ✅ Negative activeTimeSec → 400
- ✅ activeTimeSec > 600 → 400 (block-level limit)
- ✅ Malformed JSON → 400

#### 4. Visit API
- ✅ First block visit succeeds
- ✅ Returns BlockLearningState with visitCount=1
- ✅ Service session semantics preserved

#### 5. Active Time API
- ✅ Active time recorded successfully
- ✅ Returns BlockLearningState with accumulated time
- ✅ Visit count NOT incremented

#### 6. Service Integration
- ✅ Service receives correct identity (userId, brand)
- ✅ Service receives correct block identity (4-part)
- ✅ Session ID forwarded correctly

#### 7. Error Mapping
- ✅ NavigationNodeNotFoundError → 404
- ✅ InvalidNavigationHierarchyError → 400
- ✅ InvalidTimeUpdateError → 400
- ✅ Validation errors → 400 with issues
- ✅ Generic errors → 500

#### 8. Response Format
- ✅ Success: `{ data: BlockLearningState }` + 200
- ✅ Error: `{ error: string }` + status
- ✅ Cache-Control: no-cache header

### BFF Tests
- Existing BFF tests are lightweight (proxy verification)
- Phase 4.4 BFF tests can follow same pattern
- Primary logic tested at central API layer

---

## Architecture Compliance

### ✅ Service Layer Not Bypassed
```
API → LearningProgressService.recordBlockVisit()
API → LearningProgressService.recordBlockActiveTime()
```

**NOT:**
```
API → BlockLearningStateRepository directly  ❌
```

### ✅ Repository Pattern Honored
```
LearningProgressService
  ├── TutorialNavigationProgressRepository
  ├── TutorialSectionRepository
  └── BlockLearningStateRepository
```

All repos injected via constructor.

### ✅ Session Semantics Preserved
- sessionId accepted by API
- Forwarded to service via method parameter
- Service applies 30-minute timeout logic
- NOT stored in block_learning_state table

### ✅ 4-Part Identity Preserved
```
(userId, navigationNodeId, blockId, blockVersion)
```

All four components required in API requests.

### ✅ Generic ILS Design
No block-type conditionals:
```
// ✅ CORRECT
const result = await service.recordBlockVisit(...);

// ❌ FORBIDDEN
if (blockType === 'D1') { ... }
if (blockType === 'C1') { ... }
```

---

## Frozen Architecture Verification

### Schema (MUST NOT MODIFY)
- `packages/db-tutorial/src/schema/block-learning-state.ts` - ❌ NO CHANGES

### Migration (MUST NOT MODIFY)
- `packages/db-tutorial/migrations/0023_lame_deathbird.sql` - ❌ NO CHANGES

### Repository (MUST NOT MODIFY)
- `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` - ❌ NO CHANGES

### Service Business Logic (MUST NOT MODIFY)
- `packages/db-tutorial/src/services/learning-progress.service.ts` - ❌ NO CHANGES
  - recordBlockVisit() logic
  - recordBlockActiveTime() logic
  - 600-second enforcement
  - Session timeout (30-min)

### Runtime (MUST NOT TOUCH)
- ILSProvider - ❌ NO CHANGES
- ActiveBlockContext - ❌ NO CHANGES
- Runtime telemetry - ❌ NO CHANGES
- UI components - ❌ NO CHANGES

---

## Phase Boundary Confirmation

### Phase 4.4 IMPLEMENTS:
- ✅ Central API routes (POST endpoints)
- ✅ BFF proxy routes
- ✅ Zod validation schemas
- ✅ Authentication integration
- ✅ Authorization (self-scoped)
- ✅ Service invocation
- ✅ Error mapping
- ✅ Response formatting
- ✅ API tests

### Phase 4.4 DOES NOT IMPLEMENT:
- ❌ Runtime integration
- ❌ ILSProvider modifications
- ❌ ActiveBlockContext modifications
- ❌ Client-side telemetry orchestration
- ❌ Browser event listeners
- ❌ Automatic heartbeat timers
- ❌ Block mounting/unmounting hooks
- ❌ UI components
- ❌ Analytics classification
- ❌ Recommendation logic
- ❌ Future-phase completion sync

---

## Implementation Order (Phase 4.4)

### STEP 1: Update Schemas
- Add `recordBlockVisitBodySchema` to `apps/api-server/src/schemas/ils.schemas.ts`
- Add `recordBlockActiveTimeBodySchema`
- Export types

### STEP 2: Implement Central API - Block Visit
- Create `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts`
- Follow existing `visit/route.ts` pattern exactly
- Inject BlockLearningStateRepository
- Map service errors to HTTP status

### STEP 3: Implement Central API - Block Active Time
- Create `apps/api-server/src/app/api/tutorial/ils/block-active-time/route.ts`
- Follow existing `active-time/route.ts` pattern
- Inject BlockLearningStateRepository
- Map service errors

### STEP 4: Implement BFF - RTH
- Create `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts`
- Follow existing BFF proxy pattern
- Forward x-session-id header
- Create `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts`

### STEP 5: Implement BFF - SkillUp (if applicable)
- Same as RTH but for SkillUp brand
- Check if skillup-web exists first

### STEP 6: Write Central API Tests
- Create test files in `apps/api-server/src/app/api/tutorial/ils/__tests__/`
- Cover all test categories listed above
- Mock LearningProgressService
- Verify auth, validation, error mapping

### STEP 7: Run Verification
- TypeScript check (0 errors)
- New API tests (all pass)
- Phase 4.3 service tests (no regression)
- Phase 4.2 repository tests (no regression)
- Broader regression suite (compare baseline)

### STEP 8: Git Diff Audit
- Verify only Phase 4.4 files modified
- No schema changes
- No migration changes
- No repository changes
- No service logic changes
- No runtime changes

### STEP 9: Create Certification Report
- Document implementation
- Document test results
- Confirm architecture compliance
- Confirm phase boundaries

---

## Preflight Status

✅ **API architecture understood** - Next.js App Router + BFF pattern  
✅ **Existing patterns identified** - visit, active-time as templates  
✅ **Phase 4.3 service contract verified** - 3 methods inspected  
✅ **API contract proposed** - 2 endpoints defined  
✅ **Security model confirmed** - Self-scoped, header-based auth  
✅ **Validation strategy defined** - Transport (API) + Business (Service)  
✅ **Error mapping defined** - Service errors → HTTP status  
✅ **Response contract confirmed** - `{ data }` envelope  
✅ **Test strategy defined** - 8 categories, ~25 tests  
✅ **File structure planned** - 9 files (2 central + schemas + 4 BFF)  
✅ **Implementation order defined** - 9 sequential steps  
✅ **Architecture compliance verified** - No bypasses, no frozen modifications  
✅ **Phase boundaries confirmed** - No Phase 4.5 work

---

## Ready for Implementation

**Authorization:** BEGIN PHASE 4.4 IMPLEMENTATION

**Next Action:** Execute STEP 1 (Update Schemas)

