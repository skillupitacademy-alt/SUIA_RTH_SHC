# SHC Admin Scope B R5 — Comprehensive Implementation and Verification Report

**Date:** 2026-11-10  
**Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), API Server (`apps/api-server`), Auth Package (`packages/auth`)  
**Commit Baseline:** GitHub `main` at commit `382e8a52a88a881b6bce73d01215933f593a228a`  
**Acceptance Ledger Status:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly untouched (2 PASS / 17 FAIL / 43 PENDING) awaiting independent reviewer (Sol) sign-off.  
**Mode:** Full Implementation, Adversarial Verification, Independent Sol Handoff (Zero self-approval).

---

## 1. Executive Summary & Architecture Overview

The Scope B R5 Master Implementation executes the 30-step remediation plan (Tasks R5-01 through R5-30) across six structured phases (Phases A through F). It resolves all remaining architectural, cryptographic, and authorization issues identified across prior review rounds while strictly respecting the **Owner's core invariant**:

> **Owner Invariant:** SHC Admin is the sole, centralized authoring and management authority for Tutorial V2 across all distribution scopes (`shared`, `skillup`, `realtutorialhub`, `skillhubcore`). No new restrictive ACL layers, tenant-author roles, or `super_admin`-only barriers are introduced for standard tutorial workflows. SUIA and RTH remain pure consumer surfaces of published tutorials.

### Architectural Flow & Cryptographic Boundaries

```
[ Inbound Client Request ]
           │
           ▼
[ proxy.ts (Pre-render Edge Boundary) ]
    1. Strip untrusted client headers:
       - DELETE x-shc-admission-assertion
       - DELETE x-shc-pathname
    2. Read shc_admin_token / Authorization cookie
    3. Call evaluateServerCookiesPageAccess() -> defaultShcAccountAuthority
           │
           ├── (If live account check needed)
           │       ▼
           │   [ Upstream Gateway: /api/shc/auth/me ]
           │   - Validates internal secret & forwards:
           │     x-internal-secret, x-forwarded-host: admin.skillhubcore.in,
           │     x-original-host: admin.skillhubcore.in, x-brand: skillhubcore
           │   - Anti-recursion check prevents recursive loops (port != 3007)
           │   - API Server classifies errors:
           │       401: Token invalid / expired / missing
           │       404: Account missing / deactivated (UserNotFoundError)
           │       503: Database / identity store outage (ApiError 503)
           │
    4. Handle Admission Outcome:
           ├── UNAUTHENTICATED -> 307 Redirect to /login
           ├── FORBIDDEN       -> 307 Redirect to /forbidden
           ├── UNAVAILABLE     -> Return HTTP 503 Service Unavailable directly
           └── AUTHORIZED      -> Sign HS256 Token-Bound Admission Assertion:
                                  - sub: user.id
                                  - pathname: exact requested path
                                  - tokenHash: sha256(sessionToken)
                                  - roles: user.roles
                                  - brand: skillhubcore
                                  - exp: 60s
                                  Forward assertion downstream in x-shc-admission-assertion
           │
           ▼
[ Server Layouts: (admin)/layout.tsx & (authenticated)/layout.tsx ]
    1. Read x-shc-admission-assertion & session cookie
    2. evaluateServerCookiesPageAccess(cookieStore, pathname, assertion):
       - Verifies assertion signature, audience, and exp (<= 60s)
       - Verifies pathname matches exactly
       - Verifies tokenHash matches sha256(session cookie token)
       - Avoids duplicate live upstream network calls when assertion is valid
       - Falls back to live check if assertion is absent or invalid
    3. If status === 'UNAVAILABLE':
       - Throws Error('Service Unavailable: Authentication service temporarily unavailable.')
       - Fails closed to prevent Next.js emitting HTTP 200 OK HTML shells
    4. If authorized, renders <AdminGuard><ClientShell>{children}</ClientShell></AdminGuard>
```

---

## 2. Implementation Details by Phase (Tasks R5-01 to R5-30)

### Phase A: Baseline Verification & Governance (Tasks R5-01 to R5-04)
- **R5-01 Baseline Check:** Verified Git baseline at `382e8a52a88a881b6bce73d01215933f593a228a` on branch `main`.
- **R5-02 Governance Rules:** Confirmed `00_READ_ME_FIRST_SHC_ADMIN.md` instructions: no schema changes, ledger untouched, no self-approval.
- **R5-03 Migration Journal Protection:** Confirmed Drizzle journal ends at `0030_event_outbox`. The proposed drop script `0031_drop_tutorial_page_content_v2.sql.proposed` remains quarantined in `migrations-pending-approval/`.
- **R5-04 Architecture Reconciliation:** Aligned Scope B security requirements with existing system components.

### Phase B: Centralized SHC Admin Tutorial Authoring (Tasks R5-05 to R5-10)
- **R5-05 & R5-06 Brand Access Policy:**
  - In `apps/skillhubcore-admin/src/lib/auth-helpers.ts`, exported `VALID_TUTORIAL_BRAND_IDS = new Set(['shared', 'skillup', 'realtutorialhub', 'skillhubcore'])`.
  - Refactored `requireBrandAccess`:
    - Checks `user.brand === 'skillhubcore'`. Non-SHC tenant tokens are strictly rejected with HTTP 403.
    - Validates target brand against `VALID_TUTORIAL_BRAND_IDS`. Invalid brand IDs return HTTP 403.
    - Preserves central SHC authoring: authorized SHC admins (`admin` or `super_admin`) have full authority across all 4 valid distribution brands without requiring `allowedBrands` or `adminScope` claims.
    - If explicit restrictive `allowedBrands` is present on the user object, respects that boundary.
- **R5-07 & R5-08 Subtopic Access Policy:**
  - Refactored `requireSubtopicAccess`:
    - Rejects empty, whitespace-only, or invalid subtopic IDs with HTTP 400.
    - Rejects non-SHC tenant tokens with HTTP 403.
    - Allows standard SHC administrators full authoring authority across valid subtopics without requiring explicit `allowedSubtopics` claims.
    - Respects explicit `allowedSubtopics` array when present.
- **R5-09 & R5-10 Boundary Enforcement:**
  - Ensures SHC administrators retain complete Tutorial V2 authoring and management capability across all brands, matching real-world business requirements.

### Phase C: Trusted Gateway Authority & Anti-Recursion (Tasks R5-11 to R5-16)
- **R5-11 & R5-12 Destination Validation & Anti-Recursion:**
  - In `apps/skillhubcore-admin/src/lib/shc-account-authority.ts`, added anti-recursion checks in `defaultShcAccountAuthority.getCurrentAccount`.
  - Parses `authorityBaseUrl` and validates that port is not `3007` and URL does not point back to SHC Admin, throwing `ConfigurationError` to prevent recursive deadlocks.
- **R5-13 Production Secret Enforcement:**
  - Throws `ConfigurationError('INTERNAL_GATEWAY_SECRET is required in production')` if `NODE_ENV === 'production'` and the secret is missing.
- **R5-14 Trusted Gateway Headers:**
  - Transmits `x-internal-secret`, `x-forwarded-host: admin.skillhubcore.in`, `x-original-host: admin.skillhubcore.in`, `x-brand: skillhubcore`, `x-forwarded-proto: https`, `Authorization: Bearer ${token}`, and cookies to the upstream gateway.
  - Ensures gateway brand resolution in `request-brand.ts` succeeds and resolves to `skillhubcore` without returning HTTP 400 `brand_unresolved`.
- **R5-15 & R5-16 Upstream Status Code Mapping:**
  - Maps upstream HTTP 401 and 404 to `null` (`UNAUTHENTICATED`).
  - Maps upstream HTTP 500, 502, 503, 504, fetch timeouts, and network connection drops to thrown Errors (`UNAVAILABLE`).

### Phase D: Backend Error Classification (Tasks R5-17 to R5-20)
- **R5-17 Typed Domain Error in Auth Service:**
  - In `apps/api-server/src/modules/auth/shc-auth.service.ts`, added and exported `UserNotFoundError extends Error`.
  - Thrown whenever the database returns no user record or the user is marked deleted.
- **R5-18 Differentiated Status Codes in `/api/shc/auth/me`:**
  - In `apps/api-server/src/app/api/shc/auth/me/route.ts`:
    - Token verification failure, invalid signature, or expired token returns HTTP 401 with `Cache-Control: private, no-store`.
    - `UserNotFoundError` returns HTTP 404 (`NOT_FOUND`).
    - `ConfigurationError` returns HTTP 503 (`INTERNAL_ERROR`).
    - Database outage, connection pool exhaustion, and unexpected exceptions return HTTP 503 `INTERNAL_ERROR`.
- **R5-19 Sanitized Outage Responses:**
  - HTTP 503 responses emit a generic message `'Identity service temporarily unavailable'` without leaking internal database errors, connection strings, or stack traces.
- **R5-20 API Route Verification:**
  - Fully type-checked with `@quiz/api-server` and verified against edge cases.

### Phase E: Cryptographically Bound Admission Assertion (Tasks R5-21 to R5-26)
- **R5-21 SHA-256 Token-Bound Assertion Sign & Verify:**
  - In `apps/skillhubcore-admin/src/lib/server-page-auth.ts`:
    - Added `computeTokenHash(token)`: computes SHA-256 hex digest of the session token.
    - Added `signPageAdmissionAssertion(user, pathname, token)`: signs HS256 JWT containing `pathname`, `tokenHash`, `roles`, `originalUserId`, `brand: 'skillhubcore'`, audience `shc-admin-admission`, issuer `skillhubcore-auth`, and 60-second expiration.
    - Added `verifyPageAdmissionAssertion(assertion, expectedPathname, cookieToken)`:
      - Validates JWT signature with `AUTH_JWT_SECRET`.
      - Requires exact pathname match (`assertion.pathname === expectedPathname`).
      - Requires SHA-256 token hash match (`assertion.tokenHash === computeTokenHash(cookieToken)`).
      - Rejects mismatching tokens, missing cookies, expired assertions, and future `iat`.
- **R5-22 Downstream Evaluation in Layouts:**
  - `evaluateServerCookiesPageAccess` accepts optional `admissionAssertion`.
  - If valid assertion is provided, admission is granted immediately without duplicate network requests.
  - If assertion is missing or invalid, falls back to authoritative live evaluation.
- **R5-23 Client Header Stripping in Proxy:**
  - In `apps/skillhubcore-admin/src/proxy.ts`, strips client-supplied `x-shc-admission-assertion` and `x-shc-pathname` at the incoming request boundary to prevent header injection.
- **R5-24 Pre-Render 503 Edge Boundary:**
  - In `proxy.ts`, returns HTTP 503 directly at edge if `outcome.status === 'UNAVAILABLE'`.
- **R5-25 Layout Outage Protection:**
  - In `(admin)/layout.tsx` and `(authenticated)/layout.tsx`, if `outcome.status === 'UNAVAILABLE'`, throws an Error to fail closed rather than rendering HTTP 200 fallback JSX shells.
- **R5-26 Clean Routing Separation:**
  - Pure separation between pre-render proxy validation and server component rendering.

### Phase F: Verification, Zero-Warning Linting & Handoff (Tasks R5-27 to R5-30)
- **R5-27 Comprehensive Adversarial Suite:**
  - Implemented 39 test cases in `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts`.
  - Covers all 5 remediation findings (G1 through G5), central authoring across 4 brands, token hash binding, client header injection prevention, path matching, gateway transport, and status code classification.
- **R5-28 Rigorous Quality Gates:** All quality gates executed and passed with 0 errors and 0 warnings.
- **R5-29 Documentation:** Authored implementation report and Sol handoff prompt.
- **R5-30 Boundaries Preserved:** No database schema alterations, ledger untouched, no Git commits or pushes.

---

## 3. Changed File Manifest

| File Path | Description of Changes |
| :--- | :--- |
| `apps/skillhubcore-admin/src/lib/auth-helpers.ts` | Exported `VALID_TUTORIAL_BRAND_IDS = new Set(['shared', 'skillup', 'realtutorialhub', 'skillhubcore'])`. Refactored `requireBrandAccess` to grant central SHC authoring across all 4 valid distribution brands for standard SHC admins, while rejecting non-SHC tenant tokens (`user.brand !== 'skillhubcore'`) and invalid brand identifiers. Updated `requireSubtopicAccess` to reject tenant tokens and permit valid subtopics. |
| `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` | Added anti-recursion destination checks (rejects port 3007 and self-targeting). Throws `ConfigurationError` if `INTERNAL_GATEWAY_SECRET` is missing in production. Forwards `x-internal-secret`, `x-forwarded-host: admin.skillhubcore.in`, `x-original-host: admin.skillhubcore.in`, `x-brand: skillhubcore`, `Authorization: Bearer ${token}`, and cookies. Maps 401/404 to `null` and 500/503/timeout to Error. |
| `apps/api-server/src/modules/auth/shc-auth.service.ts` | Exported `UserNotFoundError` domain error class; thrown when account is missing or deactivated. |
| `apps/api-server/src/app/api/shc/auth/me/route.ts` | Separated token verification (HTTP 401) from account lookup. Emits HTTP 404 on `UserNotFoundError`, HTTP 503 on `ConfigurationError` and database outages/pool exhaustion, with sanitized response payloads and no leaked traces. |
| `apps/skillhubcore-admin/src/lib/server-page-auth.ts` | Added `computeTokenHash`, `signPageAdmissionAssertion`, `verifyPageAdmissionAssertion`. Cryptographically binds downstream assertion to `sha256(sessionToken)`. Updated `evaluateServerCookiesPageAccess` to consume and verify token-bound assertion without duplicate network requests. |
| `apps/skillhubcore-admin/src/proxy.ts` | Strips client-supplied `x-shc-admission-assertion` and `x-shc-pathname` at line 1. Signs token-bound assertion upon authorization and forwards downstream. Returns HTTP 503 directly on `UNAVAILABLE`. |
| `apps/skillhubcore-admin/src/app/(admin)/layout.tsx` | Reads `x-shc-admission-assertion` and validates against cookie token. Throws Error on `UNAVAILABLE` to fail closed. |
| `apps/skillhubcore-admin/src/app/(authenticated)/layout.tsx` | Reads `x-shc-admission-assertion` and validates against cookie token. Throws Error on `UNAVAILABLE` to fail closed. |
| `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts` | Expanded test suite to 39 adversarial test cases covering all edge cases, token binding, gateway transport, brand authorization, and error classification. |

---

## 4. Verification Scorecard

| Quality Gate | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Scope B R5 Master Adversarial Suite** | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts` | **PASS (39/39)** | 100% passing tests |
| **Full Scope B Test Suite (7 files)** | `vitest run src/lib/__tests__/{scope-b-remediation,server-page-auth,proxy-page-security,admin-page-policy,admin-boundary,upstream-proxy}.test.ts src/components/auth/__tests__/admin-guard-scope-b.test.tsx` | **PASS (171/171)** | All 7 test files pass cleanly |
| **API Boundary Guards** | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **PASS** | 80 SHC API handlers checked; explicit auth/origin guards |
| **Security Test Suite** | `pnpm --filter @quiz/skillhubcore-admin test:security` | **PASS (61/61)** | All security tests pass |
| **Auth Package Suite** | `pnpm --filter @quiz/auth test` | **PASS (176/176)** | 11 test files passed |
| **Auth Package Type Check** | `pnpm --filter @quiz/auth type-check` | **PASS (0 errors)** | Exit code 0 |
| **API Server Type Check** | `pnpm --filter @quiz/api-server type-check` | **PASS (0 errors)** | Exit code 0 |
| **SHC Admin Type Check** | `pnpm --filter @quiz/skillhubcore-admin type-check` | **PASS (0 errors)** | Exit code 0 |
| **Zero-Warning ESLint** | `pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0` | **PASS (0 errors, 0 warnings)** | Exit code 0 |
| **Next.js Production Build** | `pnpm --filter @quiz/skillhubcore-admin build` | **PASS** | 46/46 pages & routes compiled (Turbopack, Exit code 0) |
| **Knowledge Graph Rebuild** | `graphify update .` | **PASS** | 36,734 nodes, 87,043 edges updated |
| **Git Diff Cleanliness** | `git diff --check` | **PASS** | 0 whitespace or formatting errors |

---

## 5. Invariant Protection

1. **No Database Migrations or DDL Changes:** No migrations run; `0031_drop_tutorial_page_content_v2.sql.proposed` remains safely quarantined; no tables modified or dropped.
2. **Centralized SHC Tutorial Authoring Preserved:** SHC Admin is the sole authority for Tutorial V2 across `shared`, `skillup`, `realtutorialhub`, and `skillhubcore`.
3. **Acceptance Ledger Untouched:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly 2 PASS / 17 FAIL / 43 PENDING.
4. **No Git Commit or Push:** Working tree remains uncommitted on `main`, awaiting independent reviewer (Sol) inspection.

