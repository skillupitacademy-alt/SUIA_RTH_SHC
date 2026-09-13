# STEP 12: RTH Layer Isolation Report

**Date:** 2026-09-04  
**Goal:** Identify which RTH layer causes response stream termination failure  
**Status:** Evidence gathered, hypothesis identified

---

## Evidence Summary

### STEP 11 Diagnostic Results

**SUIA (Control):**
- ✅ Status: 200
- ✅ Transfer-Encoding: chunked
- ✅ Cache-Control: undefined (none)
- ✅ `response.text()` completed in **8ms**
- ✅ Body: 578 bytes, valid JSON

**RTH (Problem):**
- ✅ Status: 200
- ✅ Transfer-Encoding: chunked
- ❌ Cache-Control: **no-store, no-cache, must-revalidate**
- ❌ `response.text()` **TIMED OUT** after **10,006ms**
- ❌ Stream did not terminate

---

## RTH Request Lifecycle - Full Trace

```
Browser
  ↓
  HTTP POST /api/tutorial/ils/visit
  ↓
[1] Next.js Server (port 3003)
  ↓
[2] Next.js Headers Middleware (next.config.mjs)
    - Source: '/api/(.*)'
    - Applies: Cache-Control: no-store, no-cache, must-revalidate
  ↓
[3] Next.js Middleware (src/proxy.ts → authProxy.ts)
    - Authenticates user
    - Adds headers: x-user-id, x-shadow-user-id, x-original-user-id
    - Passes to route handler via NextResponse.next()
  ↓
[4] Route Handler (src/app/api/tutorial/ils/visit/route.ts)
    - requireStudent(request) → authentication ✅
    - request.json() → parse body ✅
    - fetch(api-server) → proxy call ✅
    - response.json() → completed in 1ms ✅
    - NextResponse.json(data) → constructed ✅
    - return nextResponse → returned ✅
  ↓
[5] Next.js Response Pipeline
    - Render phase: 1009ms (per instrumentation log)
    - Headers middleware applies Cache-Control
    - Response sent to client
  ↓
[6] Browser receives response
    - Status: 200 ✅
    - Headers received ✅
    - Body stream starts ✅
    - Stream NEVER TERMINATES ❌
```

---

## Layer-by-Layer Analysis

### Layer 1: Browser
- **Role:** HTTP client, stream consumer
- **Evidence:** Playwright successfully captures status, headers
- **Behavior:** Waits for stream termination (never arrives)
- **Verdict:** ✅ Not the cause (receives response correctly)

### Layer 2: Next.js Headers Middleware (`next.config.mjs`)

**Configuration:**
```javascript
async headers() {
  return [
    {
      source: '/api/(.*)',
      headers: [{ 
        key: 'Cache-Control', 
        value: 'no-store, no-cache, must-revalidate' 
      }],
    },
    // ... other rules
  ];
}
```

**Evidence:**
- RTH applies this header
- SUIA does NOT apply this header
- RTH response contains: `cache-control: no-store, no-cache, must-revalidate`
- SUIA response contains: `cache-control: undefined`

**Correlation:**
- Only RTH has this header
- Only RTH has stream termination failure
- **STRONG CORRELATION**

**Potential Mechanism:**
Next.js headers middleware may:
1. Intercept the response after route handler returns
2. Apply headers by wrapping/transforming the response stream
3. Fail to properly close the transformed stream when `NextResponse.json()` is used with chunked encoding

**Verdict:** ⚠️ **PRIMARY SUSPECT** - strongest discriminating factor

### Layer 3: Auth Middleware (`authProxy.ts`)

**Configuration:** Identical between RTH and SUIA
- Both use `createAuthProxy()` from shared code
- Both have identical matcher patterns
- Both add user headers via `NextResponse.next({ request: { headers } })`

**Evidence:**
- SUIA uses same authProxy.ts
- SUIA works correctly
- No RTH-specific modifications in auth middleware

**Verdict:** ✅ Not the cause (shared code, SUIA works)

### Layer 4: Route Handler

**RTH Implementation:**
```typescript
const data = await response.json();  // ✅ Completes in 1ms
const nextResponse = NextResponse.json(data);  // ✅ Constructs instantly
return nextResponse;  // ✅ Returns immediately
```

**Evidence from Instrumentation:**
```
[RTH_ILS_STREAM_T4] response.json() completed { duration: 1, hasData: true }
[RTH_ILS_STREAM_T5] Constructing NextResponse.json()
[RTH_ILS_STREAM_T6] Returning NextResponse
POST /api/tutorial/ils/visit 200 in 19.7s (render: 1009ms)
```

**Analysis:**
- Route handler completes immediately
- `NextResponse.json()` is synchronous, non-streaming
- Data is fully materialized before return
- No streaming/async response construction

**Verdict:** ✅ Not the cause (returns complete response synchronously)

### Layer 5: Next.js Response Pipeline

**Evidence:**
- Log shows `render: 1009ms` after route returns
- Next.js performs additional processing
- Headers middleware applies headers during this phase

**Known Behavior:**
- Next.js applies `headers()` config after route handler returns
- Headers are applied to outgoing response stream
- With `NextResponse.json()`, response body should be complete

**Potential Issue:**
If headers middleware intercepts a response that:
1. Has `Transfer-Encoding: chunked` (set by Node.js HTTP server)
2. Gets wrapped/transformed to apply Cache-Control header
3. Transform stream doesn't properly forward termination signal
4. Result: Headers sent, body sent, but stream never closes

**Verdict:** ⚠️ **LIKELY FAILURE POINT** - where headers() config is applied

### Layer 6: Network/Browser Reception

**Evidence:**
- Browser receives HTTP 200
- Browser receives all headers
- Browser receives body data (status code proves connection established)
- Browser `response.text()` waits indefinitely

**Analysis:**
- If body was incomplete, status might differ
- If connection dropped, error would occur
- Instead: clean HTTP 200, headers received, body never terminates

**Verdict:** ✅ Symptom location, not cause

---

## Comparison: RTH vs SUIA Configuration

| Component | RTH | SUIA | Match? |
|-----------|-----|------|--------|
| **next.config.mjs headers()** | ✅ Has `/api/(.*)` rule | ❌ No headers() config | **NO** |
| **Cache-Control header** | ✅ Applied | ❌ Not applied | **NO** |
| **authProxy middleware** | ✅ createAuthProxy() | ✅ createAuthProxy() | YES |
| **Route handler pattern** | NextResponse.json(data) | NextResponse.json(data) | YES |
| **Authentication flow** | requireStudent() | requireStudent() | YES |
| **API server target** | SkillHubCore | SkillHubCore | YES |
| **Transfer-Encoding** | chunked | chunked | YES |

**Discriminating Factor:** Only `next.config.mjs` headers configuration differs

---

## Root Cause Hypothesis

**Most Likely Cause:**

```
Next.js headers() middleware
     +
NextResponse.json() with chunked encoding
     +
Cache-Control header application
     =
Response stream transformation that fails to forward termination signal
```

**Mechanism:**

1. Route handler returns `NextResponse.json(data)`
2. Next.js sees `headers()` config matching `/api/(.*)`
3. Next.js intercepts response to apply Cache-Control header
4. Interception creates transform stream or response wrapper
5. Transform properly forwards:
   - Status code ✅
   - Headers ✅
   - Body chunks ✅
6. Transform FAILS to forward:
   - Stream termination signal ❌
7. Browser receives all data but stream never closes
8. `response.text()` waits indefinitely for stream end

**Why SUIA Works:**
- No headers() config
- No response interception
- Original response stream passes through unmodified
- Termination signal preserved

---

## Alternative Hypotheses (Less Likely)

### Hypothesis B: Middleware Interaction
- **Theory:** Auth middleware + headers middleware interaction
- **Counter-evidence:** Both use same auth middleware, only headers differ
- **Likelihood:** Low

### Hypothesis C: Route Handler Implementation
- **Theory:** RTH route handler response construction differs
- **Counter-evidence:** Instrumentation proves immediate return with complete data
- **Likelihood:** Very low

### Hypothesis D: Next.js Version/Configuration
- **Theory:** Next.js rendering mode or version issue
- **Counter-evidence:** Both apps use same Next.js version, only headers() differs
- **Likelihood:** Low

---

## Recommended Next Step

**Do NOT modify production code yet.**

Perform **one-variable controlled experiment**:

1. **Hypothesis:** `headers()` config causes termination failure
2. **Test:** Temporarily disable ONLY the `/api/(.*)` headers rule in RTH
3. **Control:** Keep all other RTH configuration unchanged
4. **Measurement:** Re-run STEP 11 diagnostic
5. **Expected outcome if hypothesis correct:**
   - RTH `response.text()` should complete like SUIA
   - Stream termination should succeed

**If experiment confirms hypothesis:**
- Root cause proven: Next.js headers middleware + chunked response interaction
- Solution: Remove `/api/(.*)` Cache-Control rule (HTTP APIs shouldn't be cached anyway)
- Verify: 6/6 Phase 2 tests still pass

**If experiment fails to fix issue:**
- Hypothesis disproven
- Must investigate other layers (Next.js internals, Node.js HTTP server)

---

## Files Analyzed

1. ✅ `apps/realtutorialhub-web/next.config.mjs` - Headers configuration
2. ✅ `apps/skillup-web/next.config.mjs` - No headers configuration
3. ✅ `apps/realtutorialhub-web/src/proxy.ts` - Middleware entry
4. ✅ `apps/skillup-web/src/proxy.ts` - Middleware entry (identical)
5. ✅ `src/share-branding/middleware/authProxy.ts` - Auth middleware (shared)
6. ✅ `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts` - Route handler

---

## Conclusion

**Single Most Likely Interception Point:**

```
next.config.mjs headers() function
  ↓
/api/(.*) rule applies Cache-Control header
  ↓
Next.js response transformation layer
  ↓
Stream termination signal lost
```

**Confidence Level:** High (strong correlation, clear discriminating factor)

**Recommended Action:** Controlled one-variable experiment (disable `/api/(.*)` headers rule)

**Governance:** No production changes until experiment confirms hypothesis

---

**Report prepared:** Step 12 complete  
**Next step:** Await approval for one-variable experiment (Step 13)
