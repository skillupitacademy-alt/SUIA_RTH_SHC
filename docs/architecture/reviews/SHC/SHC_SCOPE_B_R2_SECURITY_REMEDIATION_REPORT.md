# SHC Admin Scope B Security Remediation R2 Implementation Report

**Date:** 2026-11-09  
**Review Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), Auth Package (`packages/auth`)  
**Commit / Working State:** HEAD `22b86e89598bf512832f2e9ec5428a4a47e17121` with staged R2 security corrections  
**Status:** Remediated & Verified — Ready for Independent Security Re-Review (Sol)  
**Acceptance Ledger Constraint:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly untouched (2 PASS / 17 FAIL / 43 PENDING) awaiting owner/reviewer formal sign-off.

---

## 1. Executive Summary & Context

Following the independent security review and rejection of prior Scope B acceptance claims, this remediation implements the **Scope B Security Remediation R2 (Tasks SB2-01 through SB2-28)** across the SHC Admin trust boundary.

The remediation rectifies five fundamental security gaps:
1. **G1 (Live Operational Account State Authority):** Introduced `ShcAccountAuthority` with live, fail-closed account status evaluation on every page and API admission. Resolves deactivated, deleted, unknown, and demoted accounts immediately without waiting for token expiration. Explicitly documents the architectural boundary for stateless JWT session-specific revocation.
2. **G2 (Mandatory JWT Claims Parity):** Unified page admission (`server-page-auth.ts`) and API admission (`auth-helpers.ts:authenticateRequest`). Both paths strictly enforce `HS256` algorithm, pinned issuer `skillhubcore.in`, finite numeric future `exp`, audience `shc-admin`, `brand: 'skillhubcore'`, and `tokenType: 'admin'`. Tokens missing `iss` or `exp` fail closed on both paths.
3. **G3 (Object-Level Resource Grants & IDOR Prevention):** Sealed the `POST /api/tutorial-left-sidebar` mutation vulnerability where client-supplied `body.brandId` bypassed tenant ownership. Enforced strict brand and subtopic grants across authoring mutation endpoints. Non-superadmins are strictly isolated to their assigned tenant brands and cannot mutate global `shared` or `skillhubcore` resources without explicit elevated grants.
4. **G4 (Real HTTP 503 & Fail-Closed Degradation):** Differentiated infrastructure/provider outages from credential failures. API authentication failures due to provider outage or configuration failure return HTTP 503 Service Unavailable with `Cache-Control: private, no-store`. Server layout renders dedicated service unavailable notices rather than silent authentication redirects.
5. **G5 (Production Secret Safety):** Maintained verified dynamic secret getters in `packages/auth/src/token.service.ts` that fail closed in production and development when required secrets are missing, allowing safe fallback only in explicitly controlled test environments.

---

## 2. Root Cause and Mitigation Matrix (G1–G5)

| Finding ID | Vulnerability / Defect | Root Cause | R2 Remediation Implementation | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Account changes (disabled, deleted, demoted) do not take effect until JWT natural expiration. | Tokens were verified statelessly against cryptographic signature only; `server-page-auth.ts` had an optional, disconnected validator hook. | Created `apps/skillhubcore-admin/src/lib/shc-account-authority.ts`. Wired `evaluateAccountAdmission()` into **both** `server-page-auth.ts` and `auth-helpers.ts`. Bounded 3000ms timeout with fail-closed behavior on outage/timeout (`UNAVAILABLE`). Demoted/deactivated accounts return 403 Forbidden; deleted/unknown accounts return 401 Unauthorized. | `scope-b-remediation.test.ts` (Tests 1–7): verified disabled accounts receive 403, deleted accounts receive 401, demoted accounts receive 403, unknown accounts receive 401, timeout/outage returns 503. |
| **G2** | Discrepancy between page and API token verification policies; tokens without `iss` or `exp` were accepted on API paths. | `auth-helpers.ts` used conditional checks (`if (payload.iss && ...)` and `if (payload.exp !== undefined)`), allowing signed tokens omitting those claims to pass. Page verifier had stricter checks. | Refactored `auth-helpers.ts:verifyToken` to strictly require `iss === 'skillhubcore.in'`, finite future numeric `exp`, `HS256` algorithm, `aud === 'shc-admin'`, `brand === 'skillhubcore'`. Both paths now share the exact same cryptographic and claim requirements. | `scope-b-remediation.test.ts` (Tests 8–15): verified tokens signed without `iss` or without `exp` fail closed on both page admission and API admission. |
| **G3** | `POST /api/tutorial-left-sidebar` allowed client-supplied `brandId` to mutate hierarchy without verifying tenant ownership. Non-superadmins could overwrite global resources. | `tutorial-left-sidebar/route.ts` executed DB writes directly after route-level role check without calling `requireBrandAccess(user, body.brandId)` or `requireSubtopicAccess(user, body.activeSubtopicId)`. | Integrated `authenticateRequest()`, `requireBrandAccess(user, body.brandId)`, and `requireSubtopicAccess()` before any hierarchy sync or database writes in `POST /api/tutorial-left-sidebar`. Enforced that tenant authors (`brand !== 'skillhubcore'`) cannot mutate `shared` or `skillhubcore` content without `super_admin`. | `scope-b-remediation.test.ts` (Tests 16–21): simulated cross-tenant mutation against `/api/tutorial-left-sidebar`; verified 403 Forbidden and 0 database writes. Verified global resource isolation. |
| **G4** | Authentication service errors or configuration exceptions collapsed into 401 Unauthorized or login redirect instead of 503 Service Unavailable. | Layouts only checked for `UNAUTHENTICATED` and `FORBIDDEN`. Evaluator declared `UNAVAILABLE` status but caught exceptions and mapped them to `UNAUTHENTICATED`. API responses omitted `Cache-Control: private, no-store`. | Updated `evaluatePageAccess()` and `authenticateRequest()` to catch configuration/outage errors and return `UNAVAILABLE` / HTTP 503. Updated `AdminLayout` and `AuthenticatedLayout` to render a 503 "Service Temporarily Unavailable" screen. Added `Cache-Control: private, no-store` to all 401, 403, and 503 error responses. | `scope-b-remediation.test.ts` (Tests 22–23): verified HTTP 503 and `Cache-Control: private, no-store` on provider outage. Layout tests in `server-page-auth.test.ts`. |
| **G5** | Risk of hardcoded secret fallbacks in production if environment variables are missing. | Static initializers in `TokenService` previously evaluated default fallback strings at module load. | Replaced static string fallbacks with dynamic `resolveSecret()` getters in `packages/auth/src/token.service.ts`. Throws `ConfigurationError` when `NODE_ENV === 'production'` or `development` and secrets are missing. Safe test fallback permitted only when running test harnesses. | `token.service.test.ts` (G5 test suite): verified throws `ConfigurationError` in production and development. `scope-b-remediation.test.ts` (Tests 24–25). |

---

## 3. Explicit Architectural Disclosures & Boundaries

### 3.1. Account Status Authority vs. Token Session Revocation (SB2-10)
- **What is Implemented and Verified Live:**  
  Account state changes—such as an administrator being deactivated, suspended, deleted, or demoted to student/faculty—are **authoritatively and synchronously enforced on every single request** via `evaluateAccountAdmission()`. An administrator deactivated in the database will be rejected immediately on their next page navigation or API call with HTTP 403 Forbidden, regardless of whether their JWT access token is still cryptographically valid.
- **What Remains Blocked Pending Architecture Decision:**  
  SHC Admin JWT access tokens are stateless and carry claims `{ userId, roles, brand: 'skillhubcore', aud: 'shc-admin' }`. They do **not** carry a unique token ID (`jti`) or session identifier linked to a live session revocation registry or token denylist. Therefore, revoking an individual access token *prior to its natural expiration while the underlying user account remains active* requires an architectural decision on session infrastructure (e.g. distributed Redis session store or database session tracking table). This boundary is explicitly disclosed to prevent overstating revocation capabilities.

### 3.2. Global Shared Resource Author Policy (SB2-20)
- Authors belonging to tenant brands (e.g. `brand: 'realtutorialhub'` or `brand: 'skillup'`) are strictly restricted to editing resources belonging to their explicit brand.
- Global `shared` resources (tutorials, domains, subjects, topics) and `skillhubcore` resources can **only** be modified by users with the `super_admin` role or with explicit owner-delegated brand permissions.
- Client attempts to supply an unauthorized `brandId` in request bodies (such as in `POST /api/tutorial-left-sidebar`) are blocked with HTTP 403 Forbidden.

---

## 4. Changed File Manifest

| File Path | Description of Changes |
| :--- | :--- |
| `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` | **NEW FILE.** Implements `ShcAccountAuthority`, `ShcAccountState`, and `evaluateAccountAdmission()` with bounded AbortSignal timeout, fail-closed handling, test fixture interception, and database/service adapters. |
| `apps/skillhubcore-admin/src/lib/server-page-auth.ts` | Enforces mandatory `iss === EXPECTED_JWT_ISSUER` and mandatory finite future numeric `exp`. Calls `evaluateAccountAdmission` for page access evaluation. Detects provider/config errors and returns `UNAVAILABLE`. Adapts `setAccountStateValidator` to `setAccountAuthority`. |
| `apps/skillhubcore-admin/src/lib/auth-helpers.ts` | Adds `SERVICE_UNAVAILABLE` to `AuthError`. Enforces algorithm `HS256`, pinned issuer `skillhubcore.in`, finite future numeric `exp`, audience `shc-admin`, `brand: 'skillhubcore'`. Integrates `evaluateAccountAdmission` into `authenticateRequest`. Enforces strict tenant brand checks in `requireBrandAccess`. Emits `Cache-Control: private, no-store` on 401, 403, 503. |
| `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts` | In `POST`: added `authenticateRequest`, `requireBrandAccess(user, body.brandId)`, and `requireSubtopicAccess(user, body.activeSubtopicId)` prior to hierarchy writes. |
| `apps/skillhubcore-admin/src/app/(admin)/layout.tsx` | Added handling for `outcome.status === 'UNAVAILABLE'`, rendering a clean "Service Temporarily Unavailable" notice. |
| `apps/skillhubcore-admin/src/app/(authenticated)/layout.tsx` | Added handling for `outcome.status === 'UNAVAILABLE'`, rendering a clean "Service Temporarily Unavailable" notice. |
| `packages/auth/src/token.service.ts` | Replaced hardcoded fallback strings with `resolveSecret()` dynamic getters for `ACCESS_SECRET`, `REFRESH_SECRET`, and `ADMIN_SECRET`. Throws `ConfigurationError` when required secrets are missing in production or development. |
| `packages/auth/src/__tests__/token.service.test.ts` | Added comprehensive G5 secret configuration tests verifying failure in production/development and safe behavior in test runners. |
| `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts` | **NEW FILE.** Master regression test suite (25 tests) verifying G1 account authority, G2 claim parity, G3 brand isolation & sidebar IDOR prevention, G4 HTTP 503 degradation & cache headers, and G5 secret safety. |
| `apps/skillhubcore-admin/src/lib/__tests__/admin-boundary.test.ts` | Updated mock test principal to include mandatory `iss` and `exp` claims aligned with G2 unified verification. |
| `packages/db-tutorial/migrations-pending-approval/0031_drop_tutorial_page_content_v2.sql.proposed` | Updated documentation header confirming table was retired in live database per owner approval on 2026-11-09 without journal alteration. |

---

## 5. Verification Scorecard & Quality Gates

All automated verification gates were executed and passed with zero errors and zero warnings:

| Quality Gate | Command | Output Summary | Exit Code |
| :--- | :--- | :--- | :--- |
| **G1–G5 Master Remediation Tests** | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts` | **25 passed (25)** in 2.15s | **0** ✅ |
| **Page & Server Auth Unit Tests** | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/server-page-auth.test.ts src/lib/__tests__/proxy-page-security.test.ts src/lib/__tests__/admin-page-policy.test.ts src/components/auth/__tests__/admin-guard-scope-b.test.tsx` | **71 passed (71)** in 3.12s | **0** ✅ |
| **Security & Upstream Proxy Tests** | `pnpm --filter @quiz/skillhubcore-admin test:security` | **61 passed (61)** across 2 files | **0** ✅ |
| **API Boundary Route Checks** | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | Checked **80 SHC API handlers**; explicit auth/origin guards enforced | **0** ✅ |
| **Core Auth Package Tests** | `pnpm --filter @quiz/auth test` | **176 passed (176)** across 11 files | **0** ✅ |
| **TypeScript Type Checks** | `pnpm --filter @quiz/auth type-check && pnpm --filter @quiz/skillhubcore-admin type-check` | Zero type errors across packages | **0** ✅ |
| **Zero-Warning ESLint** | `pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0` | Zero ESLint warnings, zero errors | **0** ✅ |
| **Next.js Production Build** | `pnpm --filter @quiz/skillhubcore-admin build` | **46/46 pages & dynamic API routes** compiled successfully | **0** ✅ |
| **Git Diff Cleanliness** | `git diff --check` | Clean diff, zero whitespace errors | **0** ✅ |

---

## 6. Prompt for Sol's Independent Security Re-Review

```markdown
Please perform an independent security re-review of the Scope B Security Remediation R2 across `apps/skillhubcore-admin` and `packages/auth` at HEAD `22b86e89598bf512832f2e9ec5428a4a47e17121` with the R2 remediation patch applied.

Please verify specifically against the 5 findings from your previous review:
1. G1: Verify that `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` authoritatively evaluates live account admission in both `server-page-auth.ts` and `auth-helpers.ts:authenticateRequest`, and fails closed (403 for deactivated/demoted, 401 for deleted/unknown, 503 for outage). Confirm the explicit disclosure regarding access-token JTI session-level revocation.
2. G2: Verify that `auth-helpers.ts:verifyToken` and `server-page-auth.ts:verifyAdminToken` strictly mandate valid signature, HS256 algorithm, trusted issuer `skillhubcore.in`, finite future numeric `exp`, audience `shc-admin`, and brand `skillhubcore`. Confirm negative tests prove rejection of tokens missing `iss` or `exp`.
3. G3: Verify that `POST /api/tutorial-left-sidebar` validates brand and subtopic permissions against the authenticated user's authorized scope, preventing tenant authors from mutating cross-tenant or global `shared`/`skillhubcore` resources.
4. G4: Verify that authentication service / database timeouts return HTTP 503 with `Cache-Control: private, no-store`, and that the admin layouts render the service unavailable notice rather than masking outages as invalid credentials.
5. G5: Verify that `TokenService.ACCESS_SECRET`, `TokenService.REFRESH_SECRET`, and `TokenService.ADMIN_SECRET` throw `ConfigurationError` when required environment secrets are missing in production or development.
```
