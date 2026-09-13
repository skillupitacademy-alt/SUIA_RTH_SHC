# STEP 3 — Credential Architecture Validation

**Date:** 2026-09-04  
**Purpose:** Validate credential architecture before implementing CSRF fix  
**Previous:** STEP-2-ILS-CSRF-INVESTIGATION-REPORT.md

---

## Executive Summary

**CRITICAL FINDING:** `INTERNAL_API_KEY` and `INTERNAL_API_SECRET` are **DIFFERENT credentials** with **DIFFERENT security purposes**.

**Architecture Discovery:**
- `INTERNAL_API_SECRET` = BFF → api-server authentication (shorter, 64 chars)
- `INTERNAL_API_KEY` = Legacy/multi-purpose internal key (longer, 128 chars)  
- They have **different values** in production configuration
- **Option B from STEP 2 is NOT SAFE** - would accept wrong credential for CSRF bypass

**Recommended Fix:** **NEW Option D** - BFF should send BOTH headers during ILS calls

---

## 1. Environment Configuration Analysis

### Root `.env.local` (Authoritative)

```env
INTERNAL_API_KEY="5a5c260da666829b0ee971a5eb835e389633e3ff73b286235a28cd75b36872bb4152ffa9dff8a4001b30b17298f4d8c49bca7ac00fa6c5a1904618728af1e574"
# Length: 128 characters

INTERNAL_API_SECRET="a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da"
# Length: 64 characters

INTERNAL_GATEWAY_SECRET="a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da"
# Length: 64 characters
```

**Key Finding:** `INTERNAL_API_SECRET` and `INTERNAL_GATEWAY_SECRET` have **SAME VALUE** (64 chars)

### Shared Configuration (`infra/hostinger/env/shared/.env`)

```env
INTERNAL_API_KEY="5a5c260da666829b0ee971a5eb835e389633e3ff73b286235a28cd75b36872bb4152ffa9dff8a4001b30b17298f4d8c49bca7ac00fa6c5a1904618728af1e574"
INTERNAL_API_SECRET="a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da"
INTERNAL_GATEWAY_SECRET="a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da"
```

**Confirmed:** Production deployment uses different values for `INTERNAL_API_KEY` vs `INTERNAL_API_SECRET`

### BFF Configurations

**SkillUp Web:**
```env
INTERNAL_API_SECRET=a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da
# No INTERNAL_API_KEY defined
```

**RTH Web:**
```env
INTERNAL_API_SECRET=a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da
# No INTERNAL_API_KEY defined
```

**SkillHubCore Admin:**
```env
INTERNAL_API_SECRET="a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da"
INTERNAL_API_KEY="5a5c260da666829b0ee971a5eb835e389633e3ff73b286235a28cd75b36872bb4152ffa9dff8a4001b30b17298f4d8c49bca7ac00fa6c5a1904618728af1e574"
```

**Key Finding:** Only SHC Admin has BOTH credentials configured. SkillUp and RTH BFF apps only have `INTERNAL_API_SECRET`.

### api-server Configuration

```env
INTERNAL_API_KEY="5a5c260da666829b0ee971a5eb835e389633e3ff73b286235a28cd75b36872bb4152ffa9dff8a4001b30b17298f4d8c49bca7ac00fa6c5a1904618728af1e574"
INTERNAL_API_SECRET="a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da"
```

**Confirmed:** api-server has access to BOTH credentials

---

## 2. Credential Producers (Who Sends Each Header)

### `x-internal-key` Producers

**File:** `src/share-branding/auth/authBffRoute.ts`

```typescript
// 🔐 ENTERPRISE AUTH: Preserve device context headers
const internalApiKey = process.env.INTERNAL_API_KEY;
if (internalApiKey) {
  headers.set('x-internal-key', internalApiKey);
}
```

**Usage Context:** `createForwardHeaders()` function used by **auth routes only**

**Routes Using This:**
- `/api/auth/*` (login, register, logout)
- `/api/admin/auth/*`
- Authentication-related BFF proxy calls

**Key Finding:** `x-internal-key` is sent by **auth routes via authBffRoute.ts**, NOT by general BFF routes.

### `X-Internal-Secret` Producers

**Files:** All BFF route implementations (ILS, sections, progress, etc.)

Examples:
- `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`
- `apps/skillup-web/src/app/api/tutorial/sections/[subtopicId]/route.ts`
- `apps/skillup-web/src/app/api/tutorial/progress/route.ts`
- (Plus RTH and SHC equivalents)

```typescript
headers: {
  'X-Brand': 'skillup',
  'X-User-ID': authResult.userId,
  'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
}
```

**Usage Context:** Direct BFF → api-server fetch calls for **all non-auth features**

**Routes Using This:**
- Tutorial ILS endpoints
- Content endpoints
- Progress endpoints
- Interaction endpoints
- Report endpoints (internal)

**Key Finding:** `X-Internal-Secret` is the **standard BFF → api-server credential** for feature routes.

---

## 3. Credential Consumers (Who Validates Each Header)

### `x-internal-key` Consumers

#### CSRF Middleware (`apps/api-server/src/modules/auth/csrf.middleware.ts`)

```typescript
const internalKey = _request.headers.get('x-internal-key');
const isValidInternal = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;

if (isValidInternal) {
  return null; // CSRF bypass
}
```

**Purpose:** Bypass CSRF validation for internal service-to-service calls

#### Proxy Auth Check (`apps/api-server/src/proxy.ts`)

```typescript
const internalKey = request.headers.get('x-internal-key');
const isValidInternalKey = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;
const isSystemBypass = isValidInternalKey || isValidCronAuth;

if (!isSystemBypass && (!_token || _token === '')) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
```

**Purpose:** Bypass JWT validation for internal calls

#### Report/Admin Routes

Multiple routes check `x-internal-key`:
- `apps/api-server/src/app/api/reports/download/route.ts`
- `apps/api-server/src/app/api/reports/route.ts`
- `apps/api-server/src/app/api/queue-report/route.ts`
- `apps/api-server/src/app/api/export/status/[jobId]/route.ts`

**Purpose:** Allow internal report generation without user auth

#### Exam Observer (Internal PDF Generation)

```typescript
headers: {
  'x-internal-key': process.env.INTERNAL_API_KEY !== undefined && process.env.INTERNAL_API_KEY !== ''
    ? process.env.INTERNAL_API_KEY
    : 'secret'
}
```

**Purpose:** api-server internal service-to-service PDF generation calls

### `x-internal-secret` Consumers

#### Internal Auth Middleware (`apps/api-server/src/middleware/internal-auth.middleware.ts`)

```typescript
const internalSecret = req.headers.get('x-internal-secret');

if (internalSecret !== null) {
  const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
  
  if (expectedSecret !== receivedSecret.trim()) {
    return { error: /* 401 */ };
  }
  
  // Validates userId, brand, returns context
  return { context: { userId, brand, correlationId, authMode: 'internal', roles } };
}
```

**Purpose:** Authenticate BFF → api-server requests, extract user context

**Routes Using This:**
- `/api/tutorial/ils/visit` - `validateRequest(request, { requireInternalSecret: true })`
- All ILS routes (visit, active-time, block-completion, etc.)
- Tutorial content routes
- Tutorial progress routes

---

## 4. Security Architecture Analysis

### Two Distinct Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUST BOUNDARY 1                         │
│          Auth Routes & System-to-System Calls               │
│                                                             │
│  Producer:  authBffRoute.ts (auth routes only)              │
│             exam.observer.ts (internal PDF calls)           │
│  Header:    x-internal-key                                  │
│  Secret:    INTERNAL_API_KEY (128 chars)                    │
│  Consumers: csrf.middleware.ts (CSRF bypass)                │
│             proxy.ts (JWT bypass)                           │
│             report routes (internal report generation)      │
│  Purpose:   Bypass authentication for system operations     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TRUST BOUNDARY 2                         │
│          BFF → api-server Feature Routes                    │
│                                                             │
│  Producer:  All BFF route implementations                   │
│             (skillup-web, realtutorialhub-web, etc.)        │
│  Header:    X-Internal-Secret                               │
│  Secret:    INTERNAL_API_SECRET (64 chars)                  │
│  Consumers: internal-auth.middleware.ts                     │
│  Purpose:   Authenticate BFF, extract user/brand context    │
└─────────────────────────────────────────────────────────────┘
```

### Why Two Credentials Exist

**Historical Evolution (Inferred):**

1. **Original System:** Used `INTERNAL_API_KEY` for all internal auth
2. **BFF Architecture Introduced:** Needed BFF-specific credential for user-scoped requests
3. **`INTERNAL_API_SECRET` Added:** Separate credential for BFF → api-server with user context
4. **Auth Routes Preserved:** Kept using `x-internal-key` via `authBffRoute.ts`
5. **Feature Routes:** Adopted `X-Internal-Secret` pattern

**Security Rationale:**

- **`INTERNAL_API_KEY`:** System-level bypass (no user context required)
- **`INTERNAL_API_SECRET`:** User-scoped BFF trust (requires userId + brand headers)

**Different threat models:**
- System bypass: "Is this an internal service?"
- BFF trust: "Is this a trusted BFF with valid user context?"

---

## 5. ILS Route Problem Analysis

### Current ILS Flow (BROKEN)

```
Browser
  ↓
BFF route (e.g., skillup-web/api/tutorial/ils/visit)
  ↓ requireStudentAuth() - validates browser session
  ↓
  ↓ fetch(INTERNAL_API_URL/tutorial/ils/visit)
  ↓ Headers: X-Internal-Secret, X-Brand, X-User-ID
  ↓ NO x-internal-key
  ↓
api-server proxy.ts
  ↓
CSRF middleware (csrf.middleware.ts)
  ↓ Checks x-internal-key
  ↓ NOT FOUND (only X-Internal-Secret present)
  ↓ isValidInternal = FALSE
  ↓ Falls through to CSRF token check
  ↓ NO csrfToken cookie/header (server-to-server call)
  ↓
  ✗ 403 Forbidden
```

### Why This Is Broken

**ILS routes use TWO layers of protection:**

1. **Route-level:** `validateRequest(request, { requireInternalSecret: true })`  
   → Expects `x-internal-secret` + `X-User-ID` + `X-Brand`

2. **Proxy-level (runs FIRST):** CSRF middleware  
   → Expects `x-internal-key` for internal bypass  
   → OR valid CSRF token for browser requests

**The mismatch:**
- BFF sends `X-Internal-Secret` (user-scoped BFF trust)
- CSRF middleware checks `x-internal-key` (system-level bypass)
- Request is rejected before reaching route handler

---

## 6. Why Option B from STEP 2 Is NOT SAFE

**Proposed Option B was:**

```typescript
const isValidInternal =
  (internalKey !== null && internalKey === process.env.INTERNAL_API_KEY) ||
  (internalSecret !== null && internalSecret === process.env.INTERNAL_API_SECRET);
```

**Security Problem:**

This would allow `X-Internal-Secret` (64-char BFF credential) to bypass CSRF protection designed for `x-internal-key` (128-char system credential).

**Threat Model Violation:**

- `X-Internal-Secret` requires `X-User-ID` + `X-Brand` headers (user-scoped)
- CSRF bypass via `x-internal-key` does NOT require user headers (system-scoped)
- Accepting `X-Internal-Secret` for CSRF bypass would weaken security boundary

**Example Attack Scenario:**

If an attacker obtained `INTERNAL_API_SECRET` (shorter, possibly exposed in BFF code/logs):
- Without Option B: Can't bypass CSRF (needs different credential)
- With Option B: Can bypass CSRF by sending `X-Internal-Secret`

**Credential separation exists for defense-in-depth.**

---

## 7. Correct Solution - NEW Option D

**Approach:** BFF should send BOTH headers for ILS routes

### Implementation

Update BFF ILS route files to include BOTH credentials:

```typescript
// apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Brand': 'skillup',
    'X-User-ID': authResult.userId,
    'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',  // For route auth
    'x-internal-key': process.env.INTERNAL_API_KEY || '',        // For CSRF bypass
    'x-session-id': request.headers.get('x-session-id') || '',
  },
  body: JSON.stringify(body),
  cache: 'no-store'
});
```

### Why This Is Correct

**Layered Security:**
1. CSRF middleware checks `x-internal-key` → Bypass CSRF (system trust)
2. Route handler checks `X-Internal-Secret` + user headers → Validate BFF identity + user context

**Precedent:** This pattern already exists in `authBffRoute.ts`:

```typescript
// From authBffRoute.ts createForwardHeaders()
const internalGatewaySecret = process.env.INTERNAL_GATEWAY_SECRET;
if (internalGatewaySecret) {
  headers.set('x-internal-secret', internalGatewaySecret);
}

const internalApiKey = process.env.INTERNAL_API_KEY;
if (internalApiKey) {
  headers.set('x-internal-key', internalApiKey);
}
```

**Auth routes already send BOTH headers** - we're extending this pattern to feature routes.

### Files to Change

**ILS Routes (3 per brand × 3 brands = 9 files):**
- `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`
- `apps/skillup-web/src/app/api/tutorial/ils/active-time/route.ts`
- `apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts`
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts`
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/active-time/route.ts`
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts`
- `apps/skillhubcore-admin/src/app/api/tutorial/ils/visit/route.ts` (if exists)
- `apps/skillhubcore-admin/src/app/api/tutorial/ils/active-time/route.ts` (if exists)
- `apps/skillhubcore-admin/src/app/api/tutorial/ils/block-completion/route.ts` (if exists)

**Environment Configuration:**
- Verify `INTERNAL_API_KEY` is configured in SkillUp and RTH `.env.local` files
- Currently only SHC Admin has it - must add to SkillUp and RTH

---

## 8. Alternative: Extract to Shared Helper (Future Refactor)

**Better Long-Term Solution:**

Create `packages/shared-bff-utils/createIlsHeaders.ts`:

```typescript
export function createIlsHeaders(
  userId: string,
  brand: string,
  sessionId?: string
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Brand': brand,
    'X-User-ID': userId,
    'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
    'x-internal-key': process.env.INTERNAL_API_KEY || '',
    ...(sessionId && { 'x-session-id': sessionId }),
  };
}
```

**Benefits:**
- Single source of truth for ILS headers
- Easier to maintain credential requirements
- Prevents future copy-paste errors

**Scope:** Out of scope for urgent CSRF fix; recommend as follow-up refactor

---

## 9. Environment Variable Audit

### Required Changes

**Add to `apps/skillup-web/.env.local`:**
```env
INTERNAL_API_KEY="5a5c260da666829b0ee971a5eb835e389633e3ff73b286235a28cd75b36872bb4152ffa9dff8a4001b30b17298f4d8c49bca7ac00fa6c5a1904618728af1e574"
```

**Add to `apps/realtutorialhub-web/.env.local`:**
```env
INTERNAL_API_KEY="5a5c260da666829b0ee971a5eb835e389633e3ff73b286235a28cd75b36872bb4152ffa9dff8a4001b30b17298f4d8c49bca7ac00fa6c5a1904618728af1e574"
```

**Verify Exists in Production Deployment:**
- Cloud Run environment variables
- Vercel environment variables  
- Hostinger VPS configuration

---

## 10. Security Validation Checklist

Before implementing Option D:

- [x] Verified `INTERNAL_API_KEY` and `INTERNAL_API_SECRET` are different values
- [x] Traced all producers of `x-internal-key` header
- [x] Traced all producers of `x-internal-secret` header
- [x] Traced all consumers of `x-internal-key` header
- [x] Traced all consumers of `x-internal-secret` header
- [x] Identified security boundary distinction
- [x] Confirmed auth routes already use both headers
- [x] Rejected unsafe Option B (credential conflation)
- [x] Designed correct Option D (dual-credential pattern)
- [ ] **PENDING:** Update environment variables
- [ ] **PENDING:** Implement Option D in BFF routes
- [ ] **PENDING:** Test with existing Phase 2 suite

---

## 11. Implementation Plan (Option D)

### Phase 1: Environment Setup

1. Add `INTERNAL_API_KEY` to SkillUp `.env.local`
2. Add `INTERNAL_API_KEY` to RTH `.env.local`
3. Verify both BFF apps can read the variable
4. Document in `.env.example` files

### Phase 2: BFF Route Updates

Update ILS routes in order:
1. SkillUp: visit, active-time, block-completion
2. RTH: visit, active-time, block-completion
3. SHC: (if ILS routes exist)

**Code pattern for each route:**
```typescript
headers: {
  'Content-Type': 'application/json',
  'X-Brand': '{brand}',
  'X-User-ID': authResult.userId,
  'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
  'x-internal-key': process.env.INTERNAL_API_KEY || '',  // ← ADD THIS
  'x-session-id': request.headers.get('x-session-id') || '',
}
```

### Phase 3: Testing

1. Run existing `ils-phase2-visit-persistence.spec.ts`
2. Verify 403 → 200 status change
3. Verify database persistence works
4. Test all three brands (SUIA, RTH, SHC if applicable)
5. Document first successful execution

### Phase 4: Production Deployment

1. Verify `INTERNAL_API_KEY` in production env vars (all brands)
2. Deploy BFF route changes
3. Monitor logs for auth failures
4. Verify ILS tracking in production

---

## 12. Documentation Updates Required

- [x] This STEP 3 validation report
- [ ] Update STEP 2 report to mark Option B as REJECTED
- [ ] Update `.env.example` files with `INTERNAL_API_KEY` requirement
- [ ] Document dual-credential pattern in architecture docs
- [ ] Update BFF development guide with ILS header requirements

---

## 13. Conclusion

**STEP 3 COMPLETE ✅**

**Findings:**
- Two credentials serve different security boundaries
- Option B would violate credential separation
- Correct solution is Option D (dual-credential pattern)
- Auth routes already use this pattern successfully

**Ready for Implementation:** YES  
**Security Reviewed:** YES  
**Architecture Validated:** YES

**Next Step:** STEP 4 - Implement Option D

---

**END OF STEP 3 VALIDATION**
