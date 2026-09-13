# STEP 2 — ILS CSRF Investigation Report

**Date:** 2026-09-04  
**Investigator:** Kiro AI  
**Purpose:** Determine root cause of ILS Phase 2 test CSRF 403 failures before any code changes

---

## Executive Summary

**ROOT CAUSE IDENTIFIED:** Header name mismatch between BFF and api-server internal authentication

- **BFF sends:** `X-Internal-Secret` header with `INTERNAL_API_SECRET` env var
- **api-server CSRF middleware expects:** `x-internal-key` header with `INTERNAL_API_KEY` env var  
- **Result:** Internal authentication bypass fails → CSRF validation executes → Browser request has no CSRF token → 403

**Secondary Finding:** Production client (`tutorialTrackingService.ts`) does NOT include CSRF token in ILS fetch calls.

---

## 1. Test Inventory Status

### Authoritative Tests

| Test | Purpose | Status | First Success | Current Blocker |
|------|---------|--------|---------------|-----------------|
| `tests/e2e/ils/ils-tutorial-session.spec.ts` | ILS session tracking | Active | Unknown | None known |
| `tests/e2e/ils/ils-phase2-visit-persistence.spec.ts` | ILS Phase 2 visit/persistence | **BLOCKED** | Never passed | **CSRF 403** |
| `tests/e2e/ils/rth-student-role-verification.spec.ts` | RTH role diagnostic | Temporary | N/A | Diagnostic only |

### Diagnostic Scripts (Temporary)

| Script | Purpose | Status | Evidence Captured |
|--------|---------|--------|-------------------|
| `verify-rth-token-roles.mjs` | RTH role investigation | Temporary | Role discrepancy resolved |
| `test-bff-ils-visit.mjs` | BFF proxy testing | Temporary | Confirmed BFF reachable |
| `test-ils-endpoint-local.mjs` | Local api-server testing | Temporary | Direct endpoint works with correct headers |
| `test-ils-endpoint-direct.mjs` | Direct api-server testing | Temporary | Same as above |

**Cleanup Status:** NOT READY - Evidence must be documented in permanent test/README first

---

## 2. CSRF Architecture Analysis

### Production Client (Browser → BFF)

**File:** `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts`

```typescript
// ILS Visit call
const response = await fetch('/api/tutorial/ils/visit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': learningSessionId,
  },
  credentials: 'include', // Auth cookies
  body: JSON.stringify({...})
});
```

**CRITICAL FINDING:** Production client does NOT send:
- `x-csrf-token` header
- Any CSRF token

**Authentication Method:** Relies solely on `credentials: 'include'` for cookie-based auth.

---

### BFF Route (Browser → api-server)

**File:** `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`

```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Brand': 'skillup',
    'X-User-ID': authResult.userId,
    'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',  // ⚠️ MISMATCH
    'x-session-id': request.headers.get('x-session-id') || '',
  },
  body: JSON.stringify(body),
  cache: 'no-store'
});
```

**Header Sent:** `X-Internal-Secret` (with value from `INTERNAL_API_SECRET`)

---

### api-server CSRF Middleware

**File:** `apps/api-server/src/modules/auth/csrf.middleware.ts`

```typescript
export async function csrfProtection(_request: NextRequest) {
  const method = _request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (isMutation === false) return null;

  // ... origin checks ...

  const internalKey = _request.headers.get('x-internal-key');  // ⚠️ EXPECTS THIS
  const isValidInternal = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;
  
  if (isValidInternal) {
    return null;  // Internal bypass
  }
  
  // ... CSRF token validation ...
  // If no valid internal key, falls through to CSRF check
  // Browser requests don't have CSRF token → 403
}
```

**Header Expected:** `x-internal-key` (with value from `INTERNAL_API_KEY`)

---

### api-server Internal Auth Middleware

**File:** `apps/api-server/src/middleware/internal-auth.middleware.ts`

```typescript
export function validateRequest(req: NextRequest, options?: ValidateRequestOptions) {
  const internalSecret = req.headers.get('x-internal-secret');  // ✅ EXPECTS X-Internal-Secret
  
  if (internalSecret !== null) {
    const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
    
    if (expectedSecret !== receivedSecret.trim()) {
      return { error: /* 401 */ };
    }
    
    // ... validates userId, brand ...
    
    return { context: { userId, brand, ... } };
  }
  
  // ... gateway fallback ...
}
```

**Header Expected:** `x-internal-secret` (with value from `INTERNAL_API_SECRET`)

---

## 3. Credential Inventory

### INTERNAL_API_SECRET

| Aspect | Details |
|--------|---------|
| **Header Name** | `X-Internal-Secret` (BFF) / `x-internal-secret` (api-server auth) |
| **Environment Variable** | `INTERNAL_API_SECRET` |
| **Producer** | BFF routes (SkillUp, RTH, SHC) |
| **Consumer** | api-server `internal-auth.middleware.ts` |
| **Purpose** | BFF → api-server service-to-service authentication |
| **Status** | ✅ **WORKING** for internal auth middleware |

**Usage Examples:**
- `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`
- `apps/skillup-web/src/app/api/tutorial/sections/[subtopicId]/route.ts`
- `apps/skillup-web/src/app/api/tutorial/progress/route.ts`

### INTERNAL_API_KEY

| Aspect | Details |
|--------|---------|
| **Header Name** | `x-internal-key` |
| **Environment Variable** | `INTERNAL_API_KEY` |
| **Producer** | Unclear - possibly legacy/gateway |
| **Consumer** | api-server `csrf.middleware.ts`, `proxy.ts` |
| **Purpose** | CSRF bypass for internal service calls |
| **Status** | ⚠️ **NOT SENT** by current BFF implementations |

**Usage Examples:**
- `apps/api-server/src/modules/auth/csrf.middleware.ts` (CSRF bypass)
- `apps/api-server/src/proxy.ts` (authentication bypass)
- `apps/api-server/src/modules/exam-engine/exam.observer.ts` (internal PDF generation)

---

## 4. Root Cause Analysis

### Execution Flow (Current - BROKEN)

```
Browser Client
  ↓ POST /api/tutorial/ils/visit
  ↓ credentials: 'include' (cookies)
  ↓ NO x-csrf-token header
  ↓
BFF (skillup-web)
  ↓ requireStudentAuth() → validates session
  ↓ fetch(INTERNAL_API_URL/tutorial/ils/visit)
  ↓ Headers: X-Internal-Secret, X-Brand, X-User-ID
  ↓ NO x-internal-key header
  ↓
api-server CSRF Middleware (proxy.ts)
  ↓ Checks for x-internal-key header
  ↓ NOT FOUND (BFF sends X-Internal-Secret instead)
  ↓ isValidInternal = FALSE
  ↓ Falls through to CSRF token validation
  ↓ Checks for csrfToken cookie + x-csrf-token header
  ↓ NOT FOUND (browser doesn't send, BFF doesn't forward)
  ↓ 
  ✗ 403 Forbidden: "Missing or invalid CSRF token"
```

### Why ILS Route Handler Never Executes

The ILS route at `apps/api-server/src/app/api/tutorial/ils/visit/route.ts` starts with:

```typescript
export async function POST(request: NextRequest) {
  const authValidation = validateRequest(request, { requireInternalSecret: true });
  // ...
}
```

**However**, the request **never reaches this handler** because:
1. `proxy.ts` runs CSRF middleware FIRST (before route handlers)
2. CSRF middleware rejects request with 403
3. Proxy returns 403 immediately
4. Route handler never executes
5. `validateRequest()` with `requireInternalSecret: true` never runs

**Architectural Note:** The api-server has TWO internal authentication mechanisms:
- **CSRF middleware** (`csrf.middleware.ts`) - checks `x-internal-key` / `INTERNAL_API_KEY`
- **Route-level auth** (`internal-auth.middleware.ts`) - checks `x-internal-secret` / `INTERNAL_API_SECRET`

Current ILS routes rely on route-level auth, but CSRF middleware blocks them first.

---

## 5. Known-Good Mutation Pattern (NOT FOUND)

**Search Performed:**
- Searched `apps/skillup-web/src/app/api/**/*.ts` for POST/PUT/PATCH/DELETE patterns
- Searched client-side fetch calls with POST method
- Examined BFF proxy implementations

**Result:** Could not identify a known-good browser mutation that successfully passes CSRF validation through the BFF → api-server flow.

**Possible Reasons:**
1. Most mutations go directly to api-server with JWT Bearer tokens (bypass CSRF)
2. ILS is first feature to use BFF → api-server POST pattern with internal auth
3. CSRF protection may have been added after most routes were established

**Recommendation:** Trace auth routes (`/api/auth/login`, `/api/auth/register`) to see if they use CSRF tokens.

---

## 6. Hypothesis Testing Results

### Hypothesis A: Production Client Lacks CSRF

**Status:** ✅ **CONFIRMED**

**Evidence:**
- `tutorialTrackingService.ts` does NOT send `x-csrf-token` header
- No CSRF token fetch/storage mechanism exists in client code
- Client relies solely on cookie-based authentication

**However:** This may be **INTENTIONAL** - the architecture expects BFF → api-server to use internal authentication, not CSRF.

### Hypothesis B: BFF → api-server Internal Auth Mismatch

**Status:** ✅ **CONFIRMED - ROOT CAUSE**

**Evidence:**
- BFF sends: `X-Internal-Secret` / `INTERNAL_API_SECRET`
- api-server CSRF middleware expects: `x-internal-key` / `INTERNAL_API_KEY`
- Header name mismatch prevents internal auth bypass
- Request falls through to CSRF validation (which fails)

### Hypothesis C: E2E Test Implementation Issue

**Status:** ⚠️ **SECONDARY ISSUE**

**Evidence:**
- Test uses `page.goto()` which correctly triggers production client code
- Test does NOT bypass CSRF by injecting tokens
- Test failure is **legitimate** - it exposed a production bug

**However:** Test needs same fix as production code.

---

## 7. `/api/tutorial/progress` 401 Analysis

**Separate Investigation Required**

The `GET /api/tutorial/progress?subtopicId=...` → 401 failure is a **separate issue** from ILS CSRF.

**Current Evidence:**
- Different HTTP method (GET vs POST)
- Different failure mode (401 vs 403)
- Different middleware path (no CSRF on GET)

**Recommended Investigation:**
1. Trace exact BFF route for `/api/tutorial/progress`
2. Check if route exists and is properly authenticated
3. Verify upstream URL resolution
4. Check `requireStudentAuth()` implementation

**DO NOT FIX** as part of ILS CSRF resolution unless root cause is proven identical.

---

## 8. Security Architecture Questions

### Question 1: Are INTERNAL_API_KEY and INTERNAL_API_SECRET the same credential?

**Answer:** ⚠️ **UNCLEAR - NEEDS DEPLOYMENT VERIFICATION**

**Evidence Suggesting Same Credential:**
- Both serve internal authentication purpose
- Both follow similar naming pattern
- Different parts of codebase use different names

**Evidence Suggesting Different Credentials:**
- CSRF middleware specifically uses `INTERNAL_API_KEY`
- Internal auth middleware specifically uses `INTERNAL_API_SECRET`
- Would be unusual security practice to have two names for same secret

**Deployment Check Required:**
- Verify `.env` configuration in production/staging
- Check if both variables are set to same value
- Check if one is legacy/deprecated

### Question 2: Should ILS Endpoints Be Exempt from CSRF?

**Analysis:**

**Arguments FOR exemption:**
- BFF → api-server is server-to-server (not browser → server)
- Internal authentication provides equivalent security
- Browser requests never directly reach api-server

**Arguments AGAINST exemption:**
- CSRF protection is defense-in-depth
- Other routes use internal key successfully
- Exemption should be architectural decision, not bug workaround

**Recommendation:** Fix the internal key mismatch rather than exempting ILS from CSRF.

---

## 9. Proposed Implementation (NOT YET EXECUTED)

### Option A: Align BFF to Send `x-internal-key`

**Change:**  
Update BFF routes to send BOTH headers during transition:

```typescript
headers: {
  'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',  // For route auth
  'x-internal-key': process.env.INTERNAL_API_KEY || '',        // For CSRF bypass
}
```

**Files to Change:**
- `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`
- `apps/skillup-web/src/app/api/tutorial/ils/active-time/route.ts`
- `apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts`
- (Plus RTH and SHC equivalent routes)

**Pros:**
- Smallest change
- Works with existing CSRF middleware
- No security policy changes

**Cons:**
- Requires both env vars configured
- Doesn't explain why other routes don't have this issue

### Option B: Update CSRF Middleware to Accept `X-Internal-Secret`

**Change:**  
Update `csrf.middleware.ts` to check BOTH internal credentials:

```typescript
const internalKey = _request.headers.get('x-internal-key');
const internalSecret = _request.headers.get('x-internal-secret');
const isValidInternal = 
  (internalKey !== null && internalKey === process.env.INTERNAL_API_KEY) ||
  (internalSecret !== null && internalSecret === process.env.INTERNAL_API_SECRET);
```

**Files to Change:**
- `apps/api-server/src/modules/auth/csrf.middleware.ts`

**Pros:**
- Smaller change (one file vs many)
- Aligns CSRF bypass with route-level auth
- Makes sense if both vars have same value

**Cons:**
- May mask underlying architectural inconsistency
- Doesn't explain original design intent

### Option C: Standardize on Single Internal Credential

**Change:**  
Repository-wide refactor to use ONE internal credential:
- Pick either `INTERNAL_API_KEY` or `INTERNAL_API_SECRET`
- Update all references consistently
- Update CSRF middleware, internal auth middleware, BFF routes

**Pros:**
- Cleanest long-term solution
- Removes confusion
- Single source of truth

**Cons:**
- Largest change surface
- Requires deployment coordination
- May break other services/scripts

---

## 10. Recommended Fix (PENDING APPROVAL)

**Selected Approach:** **Option B** (Update CSRF middleware to accept both)

**Rationale:**
1. Smallest safe change (one file)
2. Both credentials likely have same value in production
3. Preserves existing BFF patterns
4. Aligns with route-level internal auth
5. Can be deployed immediately

**Implementation Plan:**
1. Update `csrf.middleware.ts` to check both headers
2. Add tests to verify both headers work
3. Update existing Phase 2 test (no new test needed)
4. Run Phase 2 test suite for all brands
5. Document credential standardization as future cleanup

**Future Work:**
- Verify if `INTERNAL_API_KEY` and `INTERNAL_API_SECRET` are same value
- If same, standardize on one name across codebase
- If different, document security boundary distinction

---

## 11. Test Governance Confirmation

✅ **NO duplicate Playwright test created**  
✅ **NO duplicate diagnostic script created**  
✅ **Existing tests preserved**  
✅ **Test inventory documented** (this report)  

**Next Step:** Await approval to proceed with Option B implementation.

---

## 12. Investigation Completion Checklist

- [x] Production client ILS call pattern identified
- [x] BFF internal auth pattern identified
- [x] api-server CSRF middleware logic traced
- [x] api-server internal auth middleware logic traced
- [x] Credential inventory completed
- [x] Root cause proven with source evidence
- [x] Known-good mutation pattern searched (not found)
- [x] Hypothesis A tested (client lacks CSRF - confirmed but may be intentional)
- [x] Hypothesis B tested (internal auth mismatch - **ROOT CAUSE**)
- [x] Hypothesis C tested (E2E test issue - secondary)
- [x] Three implementation options analyzed
- [x] Security questions documented
- [x] Test governance maintained
- [ ] **AWAITING:** Approval to implement Option B
- [ ] **BLOCKED:** Cannot proceed to implementation until approved

---

**END OF STEP 2 INVESTIGATION REPORT**
