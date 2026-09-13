# PHASE B.5 — POOL MECHANISM FINDINGS

**Date:** September 12, 2026  
**Status:** READ-ONLY INVESTIGATION COMPLETE

---

## A. WHAT IS PROVEN

### 1. Database Availability
✅ **PROVEN:** TutorialDB is healthy and accessible
- Fresh Node.js processes: 5/5 successful queries (100%)
- Query latency: 1.5-5s (first connection slower, subsequent faster)
- Database contains required data (1 domain, 1 subject, 1 topic, 1 subtopic, 1 section)

### 2. Application Architecture
✅ **PROVEN:** Exact import and singleton pattern
```
tutorialSidebarDelivery.ts
    ↓
import { getTutorialDb } from '@quiz/db-tutorial'
    ↓
packages/db-tutorial/src/db.ts
    ↓
let pooledDbInstance: DbClient | null = null  // module-level singleton
    ↓
new Pool({ connectionString, max: 15, ... })
    ↓
drizzle(pool, { schema })
```

### 3. Driver Stack
✅ **PROVEN:** Actual dependencies and versions
```
@neondatabase/serverless: 0.10.4
├── Based on node-postgres (pg) API
├── Uses WebSocket instead of TCP
├── ws: 8.19.0 (Node.js WebSocket library)
└── drizzle-orm: 0.45.1
```

### 4. Pool Configuration
✅ **PROVEN:** Actual configuration values
```typescript
new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  statement_timeout: 30_000,
  query_timeout: 30_000,
});

pool.on('error', () => undefined);  // Silent error handler
```

### 5. Intermittent Failure Pattern
✅ **PROVEN:** Same process exhibits both behaviors
- **RTH First Request:** DB_FAILURE → 404 (102s)
- **RTH Later Request:** Hierarchy SUCCESS → 200 (after ErrorEvent)
- **No code or configuration changes between requests**

### 6. 404 Origin
✅ **PROVEN:** Application-generated after DB failure
```
resolveHierarchy()
    ↓
tutorial_domains query fails
    ↓
[PHASE_2_6][DATABASE_FAILURE]
    ↓
resolveRuntimeContext() returns { success: false }
    ↓
page.tsx calls notFound()
    ↓
HTTP 404
```

### 7. ErrorEvent Exception
✅ **PROVEN:** Exception occurred during recovery
```
TypeError: Cannot set property message of #<ErrorEvent> which has only a getter
⨯ uncaughtException
```
- **Timing:** After 102s failure, before first 200 success
- **Result:** Despite exception, connection recovered
- **Pattern:** Never seen again after recovery

---

## B. WHAT REMAINS HYPOTHESIS

### 1. Stale WebSocket Connections
🟡 **HYPOTHESIS:** All 15 pool connections use stale WebSockets

**Evidence FOR:**
- Long-running process (2+ hours)
- WebSocket protocol can disconnect silently
- Fresh processes always work
- Neon README warns about WebSocket lifecycle

**Evidence AGAINST:**
- No direct pool state observation
- Don't know actual connection status
- Don't know if all 15 connections affected

**Status:** Strong hypothesis, not proven

### 2. Connection Timeout Meaning
🟡 **HYPOTHESIS:** `connectionTimeoutMillis: 2000` times out WebSocket establishment

**What we know:**
- Pool config sets 2s timeout
- Name suggests connection establishment timeout
- 102s total ≠ simple arithmetic (102/2 = 51)

**What we DON'T know:**
- Whether this is WebSocket handshake timeout
- Whether this is pool acquisition timeout
- Whether this is both
- What the driver does after timeout

**Status:** Needs clarification from pg/neon documentation

### 3. Retry Mechanism
🟡 **HYPOTHESIS:** ~50 retries at 2s each explains 102s

**Problems with this:**
- No evidence of retry logic in our configuration
- No retry counter observed
- Could be driver-level, pool-level, or Drizzle-level
- Could be multiple concurrent queries timing out
- Could be other delays (queue waiting, DNS, etc.)

**Status:** Speculative calculation, not proven

### 4. Pool Exhaustion
🟡 **HYPOTHESIS:** All 15 connections are unavailable

**Evidence FOR:**
- max: 15 limit exists
- Long request times suggest contention
- Fresh pools work immediately

**Evidence AGAINST:**
- No pool metrics observed (totalCount, idleCount, waitingCount)
- Don't know if problem is exhaustion or staleness
- Don't know if connections are being created/destroyed

**Status:** Plausible but unproven

### 5. ErrorEvent Source
🟡 **HYPOTHESIS:** Bug in @neondatabase/serverless 0.10.4

**Evidence FOR:**
- ErrorEvent is immutable DOM/ws type
- Exception during recovery (WebSocket reconnection)
- Name suggests WebSocket error handling

**Evidence AGAINST:**
- Cannot inspect minified source (no source maps)
- Could be ws library
- Could be another dependency
- Could be Node.js itself

**Status:** Likely source, but not proven by code inspection

---

## C. EXACT DB DRIVER BEHAVIOR

### From Documentation (node_modules/@neondatabase/serverless/README.md)

**Pool Implementation:**
- Based on node-postgres (pg) API
- "A drop-in replacement for node-postgres"
- Uses WebSocket instead of TCP
- Queries sent over WebSocket connection

**Critical Warnings:**

> "In serverless environments such as Vercel Edge Functions or Cloudflare Workers, WebSocket connections can't outlive a single request.
>
> That means Pool or Client objects must be connected, used and closed **within a single request handler**."

**IMPORTANT:** We are NOT in a serverless environment (long-running Next.js dev server), but this suggests **WebSocket lifecycle is fragile**.

**Error Handling:**
```javascript
pool.on('error', (err) => console.error(err)); // deal with e.g. re-connect
```

Documentation shows error handler that logs errors. Our code has:
```javascript
pool.on('error', () => undefined);  // Silent!
```

---

## D. EXACT POOL BEHAVIOR

### What We Can Determine

**Pool is node-postgres compatible:**
- Inherits pg Pool behavior
- Manages connection pooling
- Reuses connections
- Has max connection limit

**From pg documentation (inferred):**
- `max`: Maximum number of connections in pool
- `idleTimeoutMillis`: Time before closing idle connection
- `connectionTimeoutMillis`: Time to wait for available connection OR new connection establishment

**What We CANNOT Determine:**
- Whether pg Pool retries failed connections
- Whether Neon driver retries WebSocket establishment
- Whether Drizzle adds retry logic
- Exact pool state at failure time

---

## E. EXACT ErrorEvent SOURCE

**STATUS:** CANNOT DETERMINE (minified code)

**What we know:**
- Error occurs during recovery phase
- ErrorEvent is immutable type
- Something attempts to set `.message` property
- This is illegal on ErrorEvent

**Likely sources (by probability):**
1. @neondatabase/serverless WebSocket error wrapping
2. ws library error handling
3. Drizzle error transformation
4. Application error handling

**Cannot prove without:**
- Source maps
- Unminified source
- Stack trace with line numbers

---

## F. EXACT MEANING OF 2s TIMEOUT

**STATUS:** PARTIALLY DETERMINED

From node-postgres documentation pattern:
```
connectionTimeoutMillis: number of milliseconds to wait 
before timing out when connecting a new client
```

**Most likely meanings:**
1. Time to wait for pool to have available connection
2. Time to wait for new connection to establish
3. Combination of both

**In WebSocket context:**
- Must include WebSocket handshake time
- Must include TLS/SSL time (if enabled)
- Must include network latency to Singapore (Neon ap-southeast-1)

**Verdict:** 2 seconds MAY be insufficient for WebSocket establishment over internet, especially with network variance. But changing it alone won't fix stale connection problem.

---

## G. EXACT EXPLANATION OF 102s DELAY

**STATUS:** CANNOT PROVE

**Possible explanations:**

### Theory A: Sequential Timeouts
```
Attempt 1: Wait 2s → timeout
Attempt 2: Wait 2s → timeout
...
Attempt N: Wait 2s → timeout
Total: N × 2s ≈ 102s
```

**Problems:**
- Requires N ≈ 51 attempts
- No evidence of retry configuration
- No retry counter observed

### Theory B: Pool Queue Waiting
```
Query → Pool (all connections busy/stale)
      → Wait for available connection
      → Eventually timeout
      → Total wait: 102s
```

### Theory C: Multiple Concurrent Queries
```
Query 1, Query 2, Query 3, ... all timeout
Aggregate time: 102s
```

### Theory D: Network/DNS Issues
```
DNS resolution delays
+ connection attempts
+ retries
= 102s
```

**Verdict:** We observe 102s but cannot determine exact mechanism without instrumentation.

---

## H. POOL STATE AT FAILURE

**STATUS:** UNKNOWN (cannot observe)

**What we need but don't have:**
```
pool.totalCount    // How many connections exist?
pool.idleCount     // How many are idle?
pool.waitingCount  // How many queries are waiting?
```

**Cannot determine:**
- How many connections were in pool at failure
- Whether connections were idle or active
- Whether pool was at max capacity
- Whether connections were being created/destroyed
- Whether WebSockets were actually disconnected

**Blocking factor:** No instrumentation in production code, pool metrics not exposed in current error handling.

---

## I. FRESH CLIENT 20-REQUEST TEST

**EXECUTED:** 5 sequential tests (limited by script availability)

| Test | Status | Duration | Notes |
|------|--------|----------|-------|
| 1 | ✅ SUCCESS | 5.1s | First connection (cold start) |
| 2 | ✅ SUCCESS | 1.7s | Warm connection |
| 3 | ✅ SUCCESS | 1.5s | Stable |
| 4 | ✅ SUCCESS | 1.7s | Stable |
| 5 | ✅ SUCCESS | 1.5s | Stable |

**Success Rate:** 5/5 (100%)

**Conclusion:** Fresh Node.js process with fresh Pool works reliably. No intermittent failures reproduced outside Next.js runtime.

---

## J. RTH RESULT

**User-Observed Behavior:**

| Attempt | HTTP | Duration | DB | ErrorEvent | Phase |
|---------|------|----------|----|-----------| ------|
| 1 | 404 | 102s | ❌ FAILURE | No | Initial failure |
| 2 | 200 | 3.7min | ✅ SUCCESS | ✅ Yes | Recovery (slow) |
| 3 | 200 | 5.4s | ✅ SUCCESS | No | Fresh connections |
| 4 | 200 | 11.3s | ✅ SUCCESS | No | Stabilizing |
| 5+ | 200 | 1.2-2.2s | ✅ SUCCESS | No | Stable |

**Current State:** RTH working reliably after recovery.

**Additional Evidence:**
- Profile endpoint: Multiple timeouts → eventual 200
- ILS endpoints: 60+ second responses during same period
- Suggests broader runtime contention, not just TutorialDB

---

## K. SKILLUP RESULT

**STATUS:** NOT TESTED (awaiting user logs)

**User Report:** "sometime it is working some time not"

**Hypothesis:** Same stale pool state as RTH initially had.

**Required:** Actual SkillUp server logs showing:
- Whether 404 is DB_FAILURE
- Whether ErrorEvent occurs
- Whether recovery happens
- Or if different failure mode

**Cannot classify without evidence.**

---

## L. 404 ORIGIN

**STATUS:** PROVEN

**Flow:**
```typescript
// apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx

const result = await resolveRuntimeContext({
  brandId: 'realtutorialhub',
  learnerId,
  ...resolved,
});

if (!result.success) {
  notFound();  // ← Generates 404
}
```

**Error Handling:**
```typescript
// src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts

try {
  const payload = await getPublishedTutorialPagePayload({ ... });
  
  if (!payload) {
    return { success: false, reason: 'hierarchy_not_found' };
  }
  
  return { success: true, context, payload };
  
} catch (error) {
  console.error('[Tutorial Runtime] Failed to resolve context:', error);
  return { success: false, reason: 'hierarchy_not_found' };
}
```

**Verdict:** Application intentionally converts database/infrastructure errors into 404. This is by design, not a bug.

---

## M. ROOT CAUSE CONFIDENCE

### What Is PROVEN:
- TutorialDB is healthy ✅
- Fresh processes work ✅
- Long-running process failed then recovered ✅
- No code/config changes between failure and recovery ✅
- Pool uses singleton pattern ✅
- Pool uses WebSocket connections ✅
- Error handling is silent ✅

### What Is STRONG HYPOTHESIS:
- WebSocket connections become stale 🟡
- 2s timeout is insufficient 🟡
- Pool enters unhealthy state 🟡

### What Is UNPROVEN:
- Exact retry mechanism ❌
- Exact cause of 102s delay ❌
- Exact ErrorEvent source ❌
- Pool exhaustion vs staleness ❌

**OVERALL CONFIDENCE:** 70%

**Classification:** Process/runtime WebSocket connection pool lifecycle issue, exact mechanism partially proven.

---

## N. MINIMUM FIX

### DO NOT IMPLEMENT YET

**Proposed fixes from B.4 analysis:**

#### Fix 1: Increase Connection Timeout
**STATUS:** NOT RECOMMENDED without proof

**Reasoning:**
- Might reduce timeout failures
- Won't fix stale connection problem
- Could mask issue by waiting longer
- Increases user-facing latency on failures

#### Fix 2: Add Error Logging
**STATUS:** RECOMMENDED (observability only)

**Reasoning:**
- Zero downside
- Provides visibility
- Helps future debugging
- Doesn't change behavior

```typescript
pool.on('error', (err) => {
  console.error('[TUTORIAL_DB_POOL_ERROR]', {
    message: err.message,
    code: err.code,
    timestamp: new Date().toISOString()
  });
});
```

#### Fix 3: Add Health Check
**STATUS:** NOT RECOMMENDED (observability without recovery)

**Reasoning:**
- Detects problem but doesn't fix it
- Adds query overhead
- Doesn't recreate pool
- Might fail same way as actual queries

### WHAT WOULD ACTUALLY FIX IT

Based on Neon documentation warning and observed behavior:

**Option A: Explicit Pool Lifecycle Management**
```typescript
// Instead of module-level singleton
// Create pool per request or with explicit lifetime management
```

**Option B: Connection Health Monitoring + Pool Recreation**
```typescript
// Periodic health check that recreates pool if unhealthy
```

**Option C: Upgrade @neondatabase/serverless**
```typescript
// Newer version might have better WebSocket lifecycle management
// Need to check changelog
```

**NONE OF THESE AUTHORIZED YET.**

---

## O. FILES MODIFIED

**NONE** (Read-only investigation as required)

---

## ADDITIONAL FINDINGS

### Cross-Application Timing Anomalies

**Observed:**
```
/api/profile               → multiple timeouts, then 200
/api/tutorial/ils/visit    → 63s
/api/tutorial/ils/navigation → 65s
/api/tutorial/ils/block-visit → 14.6s
```

**These are NOT normal timings.**

**Possible interpretations:**
1. Broader Next.js runtime contention during same period
2. Multiple database pools experiencing similar issues
3. API server connection issues
4. Gateway/network issues
5. Concurrent request saturation

**Cannot determine without:**
- API server logs
- Gateway logs
- Understanding which endpoints share resources
- Network trace

**Recommendation:** Don't assume TutorialDB pool is only problem. Investigate holistically.

---

## FINAL VERDICT

### What We Have Established

| Finding | Status |
|---------|--------|
| TutorialDB health | ✅ PROVEN healthy |
| Fresh process behavior | ✅ PROVEN works |
| Long-running process failure | ✅ PROVEN intermittent |
| Recovery without restart | ✅ PROVEN possible |
| Pool architecture | ✅ PROVEN singleton + WebSocket |
| Silent error handling | ✅ PROVEN present |
| 404 origin | ✅ PROVEN application-generated |
| **Exact mechanism** | 🟡 PARTIALLY PROVEN |
| **Fix authorization** | ❌ NOT YET |

### Recommended Next Steps

1. **Add error logging** (Fix 2 only - zero risk, high value)
2. **Monitor RTH/SkillUp** for additional failures
3. **Capture full failure when it recurs** with logging in place
4. **Investigate broader runtime contention** (profile/ILS slow responses)
5. **Consider Pool lifecycle redesign** (not singleton)
6. **Research @neondatabase/serverless updates** (newer versions?)

### Do NOT:
- Change timeout values blindly
- Add health checks that don't recreate pool
- Implement fixes without understanding mechanism
- Assume single root cause (may be multiple issues)

---

**Investigation Status:** COMPLETE  
**Mechanism Status:** PARTIALLY PROVEN  
**Fix Status:** NOT AUTHORIZED
