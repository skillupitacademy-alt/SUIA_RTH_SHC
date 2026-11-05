# FND23 Event Type Registration and HTTP Analytics — Decision Input for Sol

**Status**: VERIFICATION_FAILED (4 tests remain failing as required)
**Prepared**: 2025-01-19
**Branch**: `remediation/w1-2-batch-05-targeted`
**Authority**: `audit/FinalAechitecture.md`, `audit/W1_W3_Terra_Consolidated_Handoff.md`, `Claude_Sonnet45_W1_W3_Detailed_Implementation_Handover_a239ca39.md`

## Executive Summary

FND23 has four distinct event security failures that require architectural decisions before implementation:

1. **Event type mismatch** (test ID: fnd23-event-type-probe): Custom schema can invoke wrong registered handler
2. **Retry-after-handler-failure** (test ID: fnd23-event-retry-probe): Failed handler stores marker, preventing retry
3. **Correlation collision** (test ID: fnd23-correlation-collision): Distinct event IDs with same correlationId collide
4. **Brand dedupe** (test ID: brand-dedupe-control): Cross-brand events with identical content incorrectly deduplicate

HTTP 503 analytics provider correction (0052d621) and tracker/provider composition (8301bcd9) passed isolated tests. Event delivery and idempotency architecture require Sol approval before implementation.

## 1. Current Event System Inventory

### 1.1 Publisher (`packages/events/src/publisher.ts`)

**Function**: `publishEvent<TType>(type, payload, options)`

**Behavior**:
- Creates typed envelope with `createEventEnvelope(type, payload, metadata)`
- Generates `id: crypto.randomUUID()` (unique per event)
- Generates `correlationId: options.correlationId ?? crypto.randomUUID()`
- Publishes to QStash with headers `x-event-type: type`, `x-correlation-id: correlationId`
- Returns `{ messageId, envelope }`

**Signed envelope structure**:
```typescript
interface EventEnvelope<TType, TPayload> {
  id: string;              // Unique event ID (UUID)
  type: TType;             // Event type literal (e.g., 'student.enrolled')
  correlationId: string;   // Correlation ID (UUID, may be shared)
  source: string;          // Origin (default: 'quiz-platform')
  occurredAt: string;      // ISO timestamp
  version: number;         // Schema version (default: 1)
  data: TPayload;          // Typed payload
}
```

### 1.2 Worker Registrations (`packages/events/src/consumer.ts`)

**Function**: `createQStashHandler(type, handler, options)`

**Current registrations** (from `EVENT_CONSUMER_MAP`):
1. `STUDENT_ENROLLED` → `${TUTORIAL_SERVICE_URL}/api/workers/student-enrolled`
2. 17 other event types with placeholder URLs

**Verification**: QStash signature verification using `Receiver.verify()`

**Schema validation**: `options.schema ?? PlatformEventEnvelopeSchemas[type]`

**Idempotency**:
- Key: `${keyPrefix ?? 'event'}:${parsed.correlationId}`
- Store: Redis-like interface (`get`/`set` with TTL)
- Default TTL: 86,400 seconds (24 hours)
- Marker stored **before handler execution**: `store.set(key, parsed.id)`
- Duplicate check: `store.get(key)` returns stored value → skip handler

### 1.3 Exact Schemas (`packages/events/src/types.ts`)

**18 registered event types** with strict Zod schemas:

Example `STUDENT_ENROLLED`:
```typescript
PlatformEventPayloadSchemas.STUDENT_ENROLLED = z.object({
  userId: z.string().uuid(),
  domainId: z.string().uuid(),
  batchId: z.string().uuid(),
  enrollmentType: z.literal('batch'),
  enrolledAt: z.string().datetime({ offset: true }),
});

PlatformEventEnvelopeSchemas.STUDENT_ENROLLED = z.object({
  ...baseFields,  // id, correlationId, source, occurredAt, version
  type: z.literal('student.enrolled'),
  data: PlatformEventPayloadSchemas.STUDENT_ENROLLED
});
```

All 18 types follow same pattern: typed envelope + typed payload + literal type discriminator.

### 1.4 HTTP Analytics System (`packages/marketing-site/src/lib/analytics/`)

**Ingestion**: `ingestAnalyticsEvent(body, ipAddress, brandId)`

**Deduplication** (`server/pipeline.ts:createDedupeKey`):
```typescript
function createDedupeKey(event: AnalyticsEventEnvelope) {
  const hash = createHash("sha256");
  hash.update(event.name);
  hash.update(JSON.stringify(event.payload));
  hash.update(event.context.user.anonymousId);
  hash.update(event.context.session.sessionId);
  return hash.digest("hex");
}
```

**Issue**: Brand ID is **not included** in hash; identical events from different brands collide.

**Providers**:
- **Internal** (`providers/internal.provider.ts`): Checks `response.ok`, throws on non-2xx (corrected in 0052d621)
- **GA4**: Dispatches to Google Analytics
- **Meta CAPI**: Dispatches to Facebook Conversion API

## 2. Documented Current Failures

### 2.1 Event Type Mismatch (VERIFICATION_FAILED)

**Test**: `packages/events/src/__tests__/fnd23-event-type-probe.test.ts`

**Problem**:
```typescript
const handler = createQStashHandler(
  PlatformEventTypes.PROJECT_SUBMITTED,  // Registered as 'project.submitted'
  effect,
  {
    receiver: { verify: async () => true },
    schema: z.object({
      type: z.literal('project.approved'),  // Custom schema with different type
      correlationId: z.string(),
      id: z.string()
    })
  }
);

const request = {
  type: 'project.approved',  // Mismatched type
  correlationId: 'fixture',
  id: 'fixture'
};

// CURRENT: Handler accepts and processes (HTTP 200, effect called once)
// REQUIRED: Handler rejects before invoking effect
```

**Root cause**: Consumer parses with `options.schema ?? PlatformEventEnvelopeSchemas[type]` but never validates `parsed.type === registeredType`.

**Impact**: Custom schema can bypass type safety and invoke wrong handler.

### 2.2 Retry After Handler Failure (VERIFICATION_FAILED)

**Test**: `packages/events/src/__tests__/fnd23-event-retry-probe.test.ts`

**Problem**:
```typescript
const effect = vi.fn()
  .mockRejectedValueOnce(new Error('failed'))  // First attempt fails
  .mockResolvedValueOnce(undefined);           // Second attempt succeeds

const handler = createQStashHandler(type, effect, {
  idempotencyStore: store()
});

await expect(handler(request())).rejects.toThrow('failed');  // First attempt
await handler(request());  // QStash retry

// CURRENT: effect called only once (second attempt skipped as duplicate)
// REQUIRED: effect called twice (retry after failure)
```

**Current execution flow**:
1. Verify signature ✓
2. Parse event ✓
3. Check idempotency: `store.get(key)` → null
4. **Store marker**: `store.set(key, parsed.id)` → SUCCESS
5. Invoke handler: `await handler(parsed)` → **THROWS ERROR**
6. Handler throws, HTTP 500 returned
7. QStash retries same event
8. Check idempotency: `store.get(key)` → **'event-id' (exists)**
9. Return "Duplicate event ignored" HTTP 200
10. Handler **never retried**

**Root cause**: Marker stored **before** handler execution, not after. Failed handler leaves permanent "processed" marker.

**Impact**: Transient handler failures (DB timeout, service restart) become permanent event loss.

### 2.3 Correlation Collision (VERIFICATION_FAILED)

**Test**: `packages/events/src/__tests__/fnd23-correlation-collision.test.ts`

**Problem**:
```typescript
const events = [
  { id: 'first-event-id', correlationId: 'shared', type: 'project.submitted' },
  { id: 'first-event-id', correlationId: 'shared', type: 'project.submitted' },  // Exact retry
  { id: 'second-event-id', correlationId: 'shared', type: 'project.submitted' }  // Distinct event
];

await handler(request(events[0]));  // Processes
await handler(request(events[1]));  // Skips (duplicate)
await handler(request(events[2]));  // SHOULD process (distinct ID)

// CURRENT: effect called 1 time (second distinct event skipped)
// REQUIRED: effect called 2 times (both distinct IDs processed)
```

**Idempotency key**: `event:${correlationId}` (shared across all three)

**Root cause**: Idempotency key uses `correlationId` instead of unique `id`. Multiple events in same correlation transaction collide.

**Impact**: Cannot process multiple related events (e.g., project.created + project.approved in same workflow).

### 2.4 Cross-Brand Analytics Dedupe (VERIFICATION_FAILED)

**Test**: `packages/marketing-site/src/lib/analytics/__tests__/brand-dedupe-control.test.ts`

**Problem**:
```typescript
const body = {
  name: 'education.page_viewed',
  payload: {},
  context: {
    brandId: 'realtutorialhub',  // Will be overridden in third call
    user: { anonymousId: 'brand-collision-fixture', ... },
    session: { sessionId: 'brand-collision-session', ... }
  }
};

const first = await ingestAnalyticsEvent({ body, brandId: 'realtutorialhub' });
const retry = await ingestAnalyticsEvent({ body, brandId: 'realtutorialhub' });
const other = await ingestAnalyticsEvent({ body, brandId: 'skillupitacademy' });

// CURRENT: first.deduped=false, retry.deduped=true, other.deduped=true (WRONG)
// REQUIRED: first.deduped=false, retry.deduped=true, other.deduped=false
```

**Dedupe hash** (from `createDedupeKey`):
```
SHA256(event.name + JSON.stringify(payload) + anonymousId + sessionId)
```

**Missing**: `brandId` not included in hash.

**Impact**: Identical content from different brands incorrectly treated as duplicates. Cross-brand analytics loss.

## 3. Compatible Fix Design Proposals

### 3.1 Event Type Mismatch Fix

**Proposal**: Enforce registered type matches parsed type after schema validation.

**Implementation**:
```typescript
export function createQStashHandler<TType extends PlatformEventType>(
  type: TType,  // Registered type
  handler: (envelope: EventEnvelope<TType, unknown>) => Promise<Response | void> | Response | void,
  options: QStashHandlerOptions<TType> = {}
) {
  return async (request: Request): Promise<Response> => {
    // ... signature verification ...

    const parsed = (options.schema ?? PlatformEventEnvelopeSchemas[type])
      .parse(JSON.parse(body)) as EventEnvelope<TType, unknown>;

    // NEW: Validate parsed type matches registration
    if (parsed.type !== type) {
      return new Response(
        `Event type mismatch: expected ${type}, received ${parsed.type}`,
        { status: 400 }
      );
    }

    // ... continue with idempotency and handler ...
  };
}
```

**Compatibility**:
- ✓ Existing correct handlers unaffected (type already matches)
- ✓ Rejects malicious/misconfigured custom schemas
- ✓ No data migration required
- ✓ No breaking changes to publisher or envelope

**Decision required**: Approve type enforcement at handler boundary?

### 3.2 Retry-After-Handler-Failure Fix

**Proposal A** (Atomic claim/commit): Store marker **after** successful handler execution only.

**Implementation**:
```typescript
export function createQStashHandler<TType extends PlatformEventType>(...) {
  return async (request: Request): Promise<Response> => {
    // ... signature, parse, type validation ...

    const idempotencyKey = `${options.keyPrefix ?? 'event'}:${parsed.id}`;  // Changed from correlationId

    if (options.idempotencyStore !== undefined) {
      const alreadyProcessed = await options.idempotencyStore.get(idempotencyKey);
      if (alreadyProcessed !== null && alreadyProcessed !== undefined) {
        await options.onDuplicate?.(parsed);
        return new Response('Duplicate event ignored', { status: 200 });
      }
    }

    // NEW: Invoke handler BEFORE storing marker
    const response = await handler(parsed);

    // NEW: Store marker only after successful execution
    if (options.idempotencyStore !== undefined) {
      await options.idempotencyStore.set(idempotencyKey, 'processed', {
        ex: options.idempotencyTtlSeconds ?? 86_400,
      });
    }

    if (response instanceof Response) return response;
    return new Response('OK', { status: 200 });
  };
}
```

**Compatibility**:
- ✓ Existing processed events retain markers (no reprocessing)
- ✓ New events get correct atomic behavior
- ⚠️ Race condition: Two simultaneous deliveries of same event ID could both pass duplicate check and invoke handler twice
- ✓ No QStash message format changes

**Proposal B** (Claim with processing/processed/failed status): Three-state lifecycle.

**Implementation**:
```typescript
const idempotencyKey = `${options.keyPrefix ?? 'event'}:${parsed.id}`;

if (options.idempotencyStore !== undefined) {
  const status = await options.idempotencyStore.get(idempotencyKey);

  if (status === 'processed') {
    return new Response('Already processed', { status: 200 });
  }

  if (status === 'processing') {
    // Concurrent delivery or retry during execution
    return new Response('Processing in progress', { status: 202 });
  }

  // Claim event for processing
  await options.idempotencyStore.set(idempotencyKey, 'processing', { ex: 300 });  // 5 min claim
}

try {
  const response = await handler(parsed);

  // Mark as successfully processed
  if (options.idempotencyStore !== undefined) {
    await options.idempotencyStore.set(idempotencyKey, 'processed', {
      ex: options.idempotencyTtlSeconds ?? 86_400,
    });
  }

  return response instanceof Response ? response : new Response('OK', { status: 200 });
} catch (error) {
  // Release claim on failure (allow retry)
  if (options.idempotencyStore !== undefined) {
    await options.idempotencyStore.del(idempotencyKey);
  }
  throw error;
}
```

**Compatibility**:
- ✓ Handles concurrent delivery (returns 202)
- ✓ Allows retry after failure
- ✓ Prevents duplicate processing during success
- ⚠️ Requires `del` method in `ConsumerRedisLike` interface (breaking change to interface)
- ⚠️ Existing markers (simple string) incompatible with status values

**Decision required**:
1. Approve Proposal A (simple, race condition acceptable) or Proposal B (complex, race-safe)?
2. If Proposal B: approve `del` interface addition and migration strategy for existing markers?
3. Accept potential race window (seconds) or require distributed lock?

### 3.3 Correlation Collision Fix

**Current key**: `event:${correlationId}` (shared across related events)

**Proposed key**: `event:${id}` (unique per event)

**Change**:
```typescript
// BEFORE
const idempotencyKey = `${options.keyPrefix ?? 'event'}:${parsed.correlationId}`;

// AFTER
const idempotencyKey = `${options.keyPrefix ?? 'event'}:${parsed.id}`;
```

**Rationale**:
- `id` is globally unique per event (UUID from publisher)
- `correlationId` groups related events in same transaction/workflow
- Idempotency should prevent duplicate **deliveries of same event**, not related events

**Compatibility**:
- ✓ New events use `id` key correctly
- ⚠️ Existing in-flight events with `correlationId` keys not found → **reprocessed once**
- ✓ After TTL (24 hours), all old keys expire naturally
- ✓ No persistent data migration required
- ✓ Compatible with both retry proposals above

**Impact**: One-time reprocessing of events currently in Redis with correlationId keys (bounded by TTL).

**Decision required**: Approve key change from `correlationId` to `id`? Accept one-time reprocessing during transition?

### 3.4 Brand Dedupe Fix

**Current hash**: `SHA256(name + payload + anonymousId + sessionId)`

**Proposed hash**: `SHA256(brandId + name + payload + anonymousId + sessionId)`

**Change**:
```typescript
function createDedupeKey(event: AnalyticsEventEnvelope) {
  const hash = createHash("sha256");
  hash.update(event.context.brandId);  // NEW: Include brand
  hash.update(event.name);
  hash.update(JSON.stringify(event.payload));
  hash.update(event.context.user.anonymousId);
  hash.update(event.context.session.sessionId);
  return hash.digest("hex");
}
```

**Compatibility**:
- ✓ New events use brand-qualified keys
- ⚠️ Existing in-memory dedupe keys not found → **one-time reprocessing**
- ✓ In-memory store (`dedupeStore = new Map()`) cleared on process restart
- ✓ No persistent migration required
- ✓ Different brands now correctly separated

**Impact**: Events currently in 60-second dedupe window reprocessed once after deploy.

**Alternative**: Prefix key instead of hashing:
```typescript
const contentHash = createHash("sha256")
  .update(event.name)
  .update(JSON.stringify(event.payload))
  .update(event.context.user.anonymousId)
  .update(event.context.session.sessionId)
  .digest("hex");

return `${event.context.brandId}:${contentHash}`;
```

Easier debugging, same behavior.

**Decision required**:
1. Approve brand inclusion in dedupe key?
2. Prefer hash-included or prefix approach?
3. Accept one-time reprocessing during 60-second window?

## 4. Verified Tenant + Event Identity Design

### 4.1 Current Event Ownership Model

**Publisher** (`publishEvent`):
- Source: `options.source ?? 'quiz-platform'` (string, not tenant)
- No tenant/brand in envelope
- No authentication/signature from publisher

**Consumer** (`createQStashHandler`):
- Verifies QStash signature (proves message from QStash)
- Does NOT verify tenant/brand ownership
- Handler receives raw envelope without ownership context

**Analytics** (`ingestAnalyticsEvent`):
- Accepts `brandId` from API route parameter
- No verification that event legitimately belongs to brand
- No tenant/user authorization check

### 4.2 Proposed Ownership Model

**Requirement**: Verified tenant + event identity + immutable payload

**Publisher envelope extension**:
```typescript
interface EventEnvelope<TType, TPayload> {
  id: string;
  type: TType;
  correlationId: string;
  source: string;
  occurredAt: string;
  version: number;
  data: TPayload;

  // NEW: Ownership and identity
  tenant: {
    tenantId: string;      // Verified tenant (e.g., 'realtutorialhub', 'skillupitacademy')
    verifiedBy: string;    // Authority that verified tenant (e.g., 'auth-gateway')
    verifiedAt: string;    // When tenant was verified
  };
  publisher: {
    publisherId: string;   // System/service that published (e.g., 'api-server', 'shs-service')
    publisherVersion: string;  // Publisher version for compatibility
  };
  integrity?: {
    payloadHash: string;   // SHA-256 of JSON.stringify(data) for immutability verification
    algorithm: 'sha256';
  };
}
```

**Consumer verification**:
1. Verify QStash signature (message authenticity)
2. Verify tenant claim (tenant authorized for this event type)
3. Verify payload integrity (if hash present, validate immutability)
4. Enforce tenant isolation in handler (cannot process cross-tenant events)

**Compatibility concerns**:
- ⚠️ Breaking change: All 18 envelope schemas gain required `tenant` field
- ⚠️ All publishers must provide verified tenant
- ⚠️ All consumers must handle tenant field
- ⚠️ Migration: Existing in-flight events without `tenant` rejected or quarantined
- ✓ Version field supports gradual rollout

**Decision required**:
1. Approve tenant/publisher/integrity extension to envelope?
2. Define tenant verification authority (gateway JWT claims? database lookup?)
3. Define migration strategy for in-flight events without tenant
4. Define quarantine vs rejection policy for unknown-tenant events
5. Require payload hash or make optional?

## 5. Atomic Claim/Commit vs Retry-After-Crash

### 5.1 Scenario: Worker Crashes Mid-Processing

**Event lifecycle**:
1. QStash delivers event to worker
2. Worker claims event (stores processing marker)
3. Worker begins handler execution
4. **Worker crashes** (OOM, SIGKILL, infrastructure failure)
5. QStash retry timer expires (default: exponential backoff)
6. QStash redelivers event to (possibly different) worker

**Proposal A behavior** (marker after success):
- Crashed handler: No marker stored
- QStash retry: New worker processes event
- ✓ Event eventually processed
- ⚠️ If crash during marker write, event reprocessed

**Proposal B behavior** (processing/processed/failed states):
- Crashed handler: `processing` marker with 5-minute TTL
- QStash retry within 5 min: Returns HTTP 202 (still processing)
- QStash retry after 5 min: `processing` expired, new worker claims and processes
- ✓ Prevents duplicate during concurrent delivery
- ✓ Automatic recovery after claim timeout

**Decision required**:
1. Acceptable claim timeout duration? (5 min, 10 min, handler-specific?)
2. QStash retry schedule compatible with claim timeout?
3. Monitoring/alerting for expired claims (potential stuck handlers)?

### 5.2 Duplicate Conflicts and Immutability

**Scenario**: Same event ID delivered twice with different payloads (malicious or bug)

**Current behavior**: First delivery processed, second skipped (no payload comparison)

**Proposed behavior**:
```typescript
if (options.idempotencyStore !== undefined) {
  const existing = await options.idempotencyStore.get(idempotencyKey);

  if (existing !== null) {
    // If integrity hash present, verify immutability
    if (parsed.integrity?.payloadHash) {
      const currentHash = createHash('sha256')
        .update(JSON.stringify(parsed.data))
        .digest('hex');

      if (currentHash !== parsed.integrity.payloadHash) {
        // Payload mutation detected
        return new Response('Payload integrity violation', { status: 400 });
      }
    }

    return new Response('Duplicate event ignored', { status: 200 });
  }
}
```

**Decision required**:
1. Require immutability verification for all events?
2. Reject mutated duplicates or log and accept?
3. Store original payload hash in Redis for comparison?

### 5.3 Cross-Brand Dedupe Conflicts

**Scenario**: Legitimate identical events from different brands (e.g., two students view same course page)

**Current behavior**: Second brand's event incorrectly deduplicated

**Fixed behavior**: Each brand's events processed independently

**Edge case**: Shared anonymous user visits both brands in same session

**Proposed**: Brand separation in dedupe key ensures independence. Session/anonymousId can span brands for attribution tracking (separate concern from event processing).

**Decision required**: Confirm brand isolation in dedupe is correct behavior?

## 6. Required Decisions from Sol

### Priority 1: Immediate Security Fixes (No breaking changes)

| Issue | Proposed Fix | Decision Required |
|-------|--------------|-------------------|
| **Event type mismatch** | Enforce `parsed.type === registeredType` | Approve type validation? |
| **Brand dedupe** | Include `brandId` in dedupe hash | Approve brand inclusion? Hash vs prefix? |

### Priority 2: Idempotency Architecture (Interface-compatible, one-time reprocessing)

| Issue | Proposed Fix | Decision Required |
|-------|--------------|-------------------|
| **Retry after failure** | Proposal A (simple) or B (stateful)? | Which approach? Accept race condition or require distributed lock? |
| **Correlation collision** | Use `id` instead of `correlationId` | Approve key change? Accept one-time reprocessing? |

### Priority 3: Ownership and Immutability (Breaking changes, full migration)

| Issue | Proposed Fix | Decision Required |
|-------|--------------|-------------------|
| **Tenant verification** | Add `tenant`, `publisher`, `integrity` to envelope | Approve breaking schema change? Migration strategy? |
| **Payload immutability** | Verify `payloadHash` on duplicate | Required or optional? Reject or log violations? |
| **Unknown-tenant events** | Reject or quarantine? | Policy for legacy/unverified events? |

## 7. Implementation Constraints

### 7.1 DO NOT Implement Without Approval

Per task constraints, **all 4 failing tests must remain VERIFICATION_FAILED** until Sol approves compatible design.

**Forbidden actions**:
- Fix event type mismatch without approval
- Fix retry-after-failure without architecture decision
- Fix correlation collision without key migration approval
- Fix brand dedupe without brand-separation approval
- Add tenant/ownership fields without breaking-change approval
- Implement payload immutability without verification policy

### 7.2 Offline Guard Mandatory

All event tests must use `audit/W1_W3_Offline_Test_Network_Guard.ts` before imports.

**Environment keys cleared**:
- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`
- `NEON_CONNECTION_STRING`
- `QSTASH_TOKEN`

**No live resources**:
- No QStash publishing
- No Redis persistence
- No database writes
- No physical HTTP delivery

### 7.3 Test Preservation

**Current 4 failing tests** (6 pass, 4 fail, 10 total):

1. `fnd23-event-type-probe.test.ts`: 3 tests (2 pass, 1 fail)
   - ✓ Allows verified message matching registered type
   - ✓ Rejects unverified message before handler
   - ✗ Does not invoke handler for different custom-schema event type

2. `fnd23-event-retry-probe.test.ts`: 2 tests (1 pass, 1 fail)
   - ✗ Retries event after handler failure instead of acknowledging complete
   - ✓ Suppresses sequential duplicate after successful handler

3. `fnd23-correlation-collision.test.ts`: 1 test (0 pass, 1 fail)
   - ✗ Processes distinct event IDs sharing correlation and suppresses exact retry

4. `brand-dedupe-control.test.ts`: 1 test (0 pass, 1 fail)
   - ✗ Keeps equal fixture identities separate across brands and deduplicates same-brand retry

**All 4 failing tests must remain failing** after this task. Only documentation created.

## 8. Verification Commands

### 8.1 Run Failing Event Tests

```powershell
cd e:\onlinewebsites\quiz-platform
$env:DATABASE_URL=''; $env:DIRECT_URL=''; $env:REDIS_URL=''; $env:UPSTASH_REDIS_REST_URL=''; $env:NEON_CONNECTION_STRING=''; $env:QSTASH_TOKEN=''
node --input-type=module -e "import { startVitest } from 'vitest/node'; const v=await startVitest('test',['packages/events/src/__tests__/fnd23-event-type-probe.test.ts','packages/events/src/__tests__/fnd23-correlation-collision.test.ts','packages/events/src/__tests__/fnd23-event-retry-probe.test.ts','packages/marketing-site/src/lib/analytics/__tests__/brand-dedupe-control.test.ts'],{run:true,config:false,environment:'node',setupFiles:['audit/W1_W3_Offline_Test_Network_Guard.ts']},{test:{exclude:['**/.worktrees/**','**/node_modules/**']}});if(!v)process.exit(1);await v.close();"
```

**Expected**: Exit 1, 4 failed | 6 passed (10 total)

### 8.2 Type Check Events Package

```powershell
cd packages\events
pnpm run type-check
```

**Expected**: Exit 0, no errors

### 8.3 Lint Events Package

```powershell
cd packages\events
pnpm run lint --no-ignore --max-warnings=0 src/**/*.ts
```

**Expected**: Exit 0, no warnings

### 8.4 Whitespace Check

```powershell
git diff --check
```

**Expected**: Exit 0, no trailing whitespace

## 9. Handoff Update Required

After Sol decision, update `audit/W1_W3_Terra_Consolidated_Handoff.md` FND23 row:

**Current**:
```
| FND23 | VERIFICATION_FAILED: event registered-type and retry probes remain red; analytics HTTP failure correction and tracker fixture pass pending review; durable delivery and event authority remain open. |
```

**After decision approval**:
```
| FND23 | Sol decision [date]: [approved fixes]. Implementation: [commit]. VERIFICATION: [test results]. Remaining: [physical queue/Redis/delivery verification]. Status: IMPLEMENTED_UNVERIFIED pending Sol review. |
```

## 10. Summary for Sol

**Question 1**: Approve immediate security fixes (type validation + brand dedupe)?

**Question 2**: Select retry architecture (Proposal A: simple post-success marker, or Proposal B: processing/processed/failed states)?

**Question 3**: Approve correlation key change from `correlationId` to `id`? Accept one-time reprocessing?

**Question 4**: Approve breaking changes for tenant verification and payload immutability? If yes, define migration strategy.

**Question 5**: Define claim timeout duration and stuck-handler monitoring policy.

**Question 6**: Define unknown-tenant and payload-violation policies (reject, quarantine, log).

This decision input provides:
- ✓ Complete current system inventory (publisher, 3 workers, exact schemas, signed envelopes)
- ✓ Documented 4 current failures with root causes and test evidence
- ✓ Compatible fix designs for each issue with tradeoff analysis
- ✓ Tenant + event identity + immutability architecture proposal
- ✓ Atomic claim/commit vs retry-after-crash analysis
- ✓ Duplicate conflict and cross-brand dedupe handling
- ✓ All 4 failing tests preserved (no implementation without approval)
- ✓ Verification commands and handoff update requirements

**Status**: Decision inputs documented, tests remain VERIFICATION_FAILED, ready for Sol architectural review.
