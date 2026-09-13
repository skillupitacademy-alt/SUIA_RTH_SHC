# STEP 5: RTH Response Streaming Diagnosis

**Date:** 2026-09-04  
**Investigation:** ILS Phase 2 E2E RTH Failure Root Cause

---

## Critical Discovery

After implementing deterministic `page.waitForResponse()` synchronization in RTH A test, we have isolated the exact failure point:

### The Problem

```
RTH /api/tutorial/ils/visit endpoint:
✅ Receives request correctly
✅ Returns HTTP 200 OK
✅ Returns correct headers (content-type: application/json)
❌ Response body stream NEVER COMPLETES
```

### Evidence

```
=== RTH A - RESPONSE TRACE ===

REQUEST:
  Method: POST
  URL: http://realtutorialhub.localhost:3003/api/tutorial/ils/visit
  Headers x-session-id: 7aaaf06a-e529-45ba-a019-070024b09998
  Body sessionId: 7aaaf06a-e529-45ba-a019-070024b09998
  Body navigationNodeId: whatisjava
  Body subtopicId: 414f63eb-cccf-4bd1-bcc0-b52df69ce499

RESPONSE:
  Status: 200
  Status Text: OK
  URL: http://realtutorialhub.localhost:3003/api/tutorial/ils/visit
  Headers content-type: application/json
  Body read ERROR: response.text: Test timeout of 120000ms exceeded.
```

### What This Tells Us

1. **Not a CSRF issue** - 200 OK proves authentication/authorization passed
2. **Not a Playwright synchronization issue** - `waitForResponse()` successfully captures the response object
3. **Not a missing response** - Response headers are fully accessible
4. **IS a response streaming issue** - `response.text()` hangs indefinitely

---

## Comparison: SUIA vs RTH

### SUIA (Working)

```
POST /api/tutorial/ils/visit
  ↓
200 OK
  ↓
response.text() completes immediately
  ↓
"{"data":{...}}"
  ↓
Test passes
```

### RTH (Failing)

```
POST /api/tutorial/ils/visit
  ↓
200 OK
  ↓
response.text() HANGS
  ↓
Test timeout after 120s
```

---

## Hypothesis: BFF/Proxy Response Forwarding Issue

Since both brands share the same `api-server` backend and SUIA works correctly, the problem must be in the RTH-specific request path:

```
RTH Browser
    │
    ├─ Frontend generates correct request ✅
    │
    ▼
RTH BFF (localhost:3003)
    │
    ├─ Receives request ✅
    ├─ Forwards to api-server ✅
    │
    ▼
api-server
    │
    ├─ Processes request ✅
    ├─ Writes to database (unverified)
    ├─ Generates response ✅
    │
    ▼
RTH BFF
    │
    ├─ Receives api-server response
    ├─ Starts streaming response to browser
    ❌ STREAM NEVER COMPLETES
    │
    ▼
RTH Browser
    │
    └─ Waits forever for body completion
```

---

## Next Investigation Steps

### Stage 2A: Inspect RTH BFF `/api/tutorial/ils/visit` Route

Compare:
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts`
- vs `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`

Look for:
1. Response streaming implementation
2. How api-server response is forwarded
3. Any middleware that might buffer responses
4. Error handling that might not close streams

### Stage 2B: Check RTH Gateway/Proxy Configuration

Compare gateway rules for:
- `realtutorialhub.localhost:3003`
- vs `skillup.localhost:3009`

Look for:
1. Response buffering settings
2. Timeout configurations
3. Streaming vs buffered mode
4. Content-length vs chunked encoding

### Stage 2C: Add Backend Logging

Temporarily add logging to RTH BFF visit route:

```typescript
console.log('[RTH BFF] Received visit request');
console.log('[RTH BFF] Forwarding to api-server');
// ... forward request
console.log('[RTH BFF] Received api-server response:', response.status);
console.log('[RTH BFF] Streaming response to client');
// ... return response
console.log('[RTH BFF] Response sent');
```

This will show where the hang occurs.

---

## What We Now Know For Certain

| Component | Status |
|-----------|--------|
| RTH Frontend session UUID generation | ✅ Working |
| RTH Frontend request creation | ✅ Working |
| RTH BFF receives request | ✅ Working |
| RTH BFF → api-server forwarding | ✅ Working |
| api-server authentication/CSRF | ✅ Working |
| api-server response generation | ✅ Working (200 OK) |
| RTH BFF → Browser response headers | ✅ Working |
| **RTH BFF → Browser response body streaming** | **❌ BROKEN** |

---

## Status

**Phase 2 Certification:**
- SUIA: ✅ A/B/C all passing
- RTH: ❌ Response streaming failure blocking all tests

**Next Action:**
Read and compare RTH vs SUIA BFF visit route implementations to identify the streaming issue.
