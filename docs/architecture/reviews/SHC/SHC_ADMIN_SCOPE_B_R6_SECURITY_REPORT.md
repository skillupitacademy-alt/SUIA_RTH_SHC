# SHC Admin Scope B R6 — Four Bounded Security Corrections Implementation Report

**Date:** 2026-11-10  
**Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), API Server (`apps/api-server`), Auth Package (`packages/auth`)  
**Commit Baseline:** GitHub `main` at commit `b7e0aa611b10bf7dc18752ec844d0cc9c1e7bc11` (`fix(security): Scope B R5 Comprehensive Security Remediation - Auth, Gateway & Crypto`)  
**Acceptance Ledger Status:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly untouched (2 PASS / 17 FAIL / 43 PENDING) awaiting independent reviewer (Sol) sign-off.  
**Mode:** Targeted Implementation, Adversarial Verification, Independent Sol Handoff (Zero self-approval).

---

## 1. Baseline & Working Tree Preservation

- **Git HEAD Baseline:** `b7e0aa611b10bf7dc18752ec844d0cc9c1e7bc11` on branch `main`.
- **Working Tree Changes:**
  - `apps/api-server/src/app/api/shc/auth/me/route.ts` (Modified: R6-A, R6-B, R6-D)
  - `apps/api-server/src/app/api/shc/auth/me/__tests__/route.test.ts` (New: 17 adversarial & contract tests)
  - `apps/skillhubcore-admin/src/lib/auth-helpers.ts` (Modified: R6-C)
  - `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` (Modified: R6-05)
  - `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts` (Modified: 40 tests)
  - `docs/architecture/reviews/SHC/SHC_ADMIN_SCOPE_B_R6_CORRECTION_IMPLEMENTATION.md`
  - `docs/architecture/reviews/SHC/SHC_ADMIN_SCOPE_B_R6_SECURITY_REPORT.md` (This document)
  - `docs/architecture/reviews/SHC/SHC_ADMIN_SCOPE_B_R6_SOL_HANDOFF.md` (Handoff guide)
- **Preserved Boundaries:**
  - Drizzle journal untouched (ends at `0030_event_outbox`).
  - Proposed drop script `0031_drop_tutorial_page_content_v2.sql.proposed` remains quarantined in `migrations-pending-approval/`.
  - Zero database schema alterations, zero DDL executed, no live DB write.
  - Acceptance ledger file [10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv](file:///e:/onlinewebsites/quiz-platform/docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv) strictly untouched.
  - No Git commit, push, or deployment executed.

---

## 2. Four Defects Corrected

| Defect | Domain | Sol's Confirmed Failure in R5 | Specific Code Correction | New HTTP Status | Verification Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R6-A: Current-Account Eligibility** (R6-01 to R6-05) | Upstream Identity API & BFF | Sol probes received HTTP 200 with `isAdmin: true` for student, faculty, and disabled accounts because `isAdmin: true` was hardcoded without checking live account eligibility. | In `/api/shc/auth/me`, load current user from `people_db` using authenticated token identity. Enforced strict eligibility: `user.isActive === true && user.platform === 'skillhubcore' && (user.role === 'admin' \|\| user.role === 'super_admin')`. Ineligible accounts receive HTTP 403 Forbidden with sanitized body. In `shc-account-authority.ts`, added typed `AccountIneligibleError` mapping upstream 403 to `FORBIDDEN` (`DEMOTED`), not `UNAVAILABLE`. | 403 Forbidden (Ineligible/Demoted) / 404 (Not Found) / 200 (Active Admin) | `route.test.ts` (Tests 1–6); `scope-b-remediation.test.ts` (Test 25) |
| **R6-B: Complete SHC Admin JWT Policy** (R6-06 to R6-09) | Cryptographic Verification | Sol generated signed tokens missing `iss` or `exp`, and HS384 tokens; `/me` returned 200 because generic `verifyAccessToken` did not require SHC-specific claims. | Replaced generic verifier with `verifyAdminAccessToken(accessToken, { audience: 'shc-admin', issuer: 'skillhubcore.in', algorithms: ['HS256'] })`. Explicitly enforce: `iss === 'skillhubcore.in'`, audience includes `'shc-admin'`, `tokenType === 'admin'`, `brand === 'skillhubcore'`, finite numeric future `exp`, non-future `nbf`, algorithm `HS256`, and non-blank principal identity. User and refresh token classes denied. | 401 Unauthorized (`Cache-Control: private, no-store`) | `route.test.ts` (Tests 8–16) |
| **R6-C: Remove Author Brand/Subtopic Restrictions** (R6-10 to R6-13) | Authorization Architecture | Optional `allowedBrands`, `adminScope`, and `allowedSubtopics` restricted legitimate central SHC authoring when present on user token. | Removed `allowedBrands`, `adminScope`, and `allowedSubtopics` as authorization predicates in `requireBrandAccess` and `requireSubtopicAccess`. Standard SHC administrators (`brand: 'skillhubcore'`) have full central authoring authority across all 4 distribution scopes (`shared`, `skillup`, `realtutorialhub`, `skillhubcore`) and subtopics under action-level RBAC (create/edit/delete/publish). Non-SHC tenant tokens and invalid distribution brands remain strictly rejected. | 200 / Allowed (Positive Compatibility) & 403 Forbidden (Non-SHC / Invalid Brand) | `scope-b-remediation.test.ts` (Tests 17–20); Positive owner-policy suite |
| **R6-D: HTTP 503 on TokenService Construction Failure** (R6-14 to R6-16) | API Error Classification | `new TokenService()` ran outside try/catch, causing unhandled `ConfigurationError` when production secrets were missing and producing HTTP 500 instead of 503. | Scoped TokenService construction, token extraction, and token verification inside error classification boundary. Typed `ConfigurationError` during construction or verification immediately returns HTTP 503 `INTERNAL_ERROR` with `Cache-Control: private, no-store`. | 503 Service Unavailable | `route.test.ts` (Test 17) |

---

## 3. Backend `/me` Error Statuses and SHC Account Authority Mappings

| Upstream `/api/shc/auth/me` Condition | Upstream Status & Code | Downstream Account Authority Mapping | Final Admission Status | Cache-Control Header |
| :--- | :--- | :--- | :--- | :--- |
| Valid active `admin` or `super_admin` | 200 OK | `account: ShcAccountState` | `AUTHORIZED` | `private, no-store` |
| Inactive SHC admin (`isActive: false`) | 403 FORBIDDEN | Throws `AccountIneligibleError` | `FORBIDDEN` (`DISABLED`) | `private, no-store` |
| Demoted role (`student` or `faculty`) | 403 FORBIDDEN | Throws `AccountIneligibleError` | `FORBIDDEN` (`DEMOTED`) | `private, no-store` |
| Unknown / deleted SHC account | 404 NOT_FOUND (`UserNotFoundError`) | Returns `null` | `UNAUTHENTICATED` (`UNKNOWN_ACCOUNT`) | `private, no-store` |
| Missing token | 401 UNAUTHORIZED | Returns `null` | `UNAUTHENTICATED` (`REVOKED`) | `private, no-store` |
| Missing `iss` / missing `exp` / expired | 401 UNAUTHORIZED | Returns `null` | `UNAUTHENTICATED` (`REVOKED`) | `private, no-store` |
| Disallowed algorithm (e.g. HS384, none) | 401 UNAUTHORIZED | Returns `null` | `UNAUTHENTICATED` (`REVOKED`) | `private, no-store` |
| Wrong audience / brand / tokenType | 401 UNAUTHORIZED | Returns `null` | `UNAUTHENTICATED` (`REVOKED`) | `private, no-store` |
| Missing production secret (`ConfigurationError`) | 503 INTERNAL_ERROR | Throws `Error('Upstream identity service returned status 503')` | `UNAVAILABLE` (`SERVICE_ERROR`) | `private, no-store` |
| Database outage / connection pool drop | 503 INTERNAL_ERROR | Throws `Error('Upstream identity service returned status 503')` | `UNAVAILABLE` (`SERVICE_ERROR`) | `private, no-store` |
| Upstream network timeout / connection abort | Transport Exception | Caught by `withDeadline` / AbortController | `UNAVAILABLE` (`SERVICE_ERROR`) | N/A (Client fetch failed) |

---

## 4. Real Signed JWT Negative-Case Matrix

| Adversarial Token Scenario | Tested Header / Claim Discrepancy | Expected Status | Source Verification File | Test Case |
| :--- | :--- | :--- | :--- | :--- |
| Missing `iss` | `iss: undefined` (missing issuer) | 401 Unauthorized | `route.test.ts` | `returns 401 for token missing mandatory issuer (iss)` |
| Missing `exp` | `exp: undefined` (missing expiry) | 401 Unauthorized | `route.test.ts` | `returns 401 for token missing mandatory expiry (exp)` |
| Expired Token | `exp: now - 3600` | 401 Unauthorized | `route.test.ts` | `returns 401 for expired token` |
| Disallowed Algorithm | `alg: 'HS384'` | 401 Unauthorized | `route.test.ts` | `returns 401 for token signed with disallowed algorithm HS384` |
| Wrong Audience | `aud: 'wrong-audience'` (not `shc-admin`) | 401 Unauthorized | `route.test.ts` | `returns 401 for token with incorrect audience` |
| Wrong Brand | `brand: 'skillup'` (not `skillhubcore`) | 401 Unauthorized | `route.test.ts` | `returns 401 for token with incorrect brand` |
| Wrong Token Class | `tokenType: 'user'`, `isAdmin: false` | 401 Unauthorized | `route.test.ts` | `returns 401 for user token class (tokenType: user)` |
| Forged Signature | Signed with foreign 256-bit key | 401 Unauthorized | `route.test.ts` | `returns 401 for token signed with wrong key` |
| Missing Token | No authorization header / cookie | 401 Unauthorized | `route.test.ts` | `returns 401 when no token is supplied` |

---

## 5. Positive SHC Authoring Compatibility Matrix

| Distribution Target Scope | SHC Administrator Token State | Action Permission | Expected Authoring Result | Test Verification |
| :--- | :--- | :--- | :--- | :--- |
| `shared` | Standard `admin`, no optional claims | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) | `scope-b-remediation.test.ts` |
| `skillup` | Standard `admin`, no optional claims | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) | `scope-b-remediation.test.ts` |
| `realtutorialhub` | Standard `admin`, no optional claims | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) | `scope-b-remediation.test.ts` |
| `skillhubcore` | Standard `admin`, no optional claims | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) | `scope-b-remediation.test.ts` |
| `realtutorialhub` | Standard `admin`, `allowedBrands: []` (empty) | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) (R6-11) | `scope-b-remediation.test.ts` |
| `shared` | Standard `admin`, `allowedBrands: ['skillup']` (restrictive) | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) (R6-11) | `scope-b-remediation.test.ts` |
| `subtopic-1` | Standard `admin`, `allowedSubtopics: []` (empty) | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) (R6-11) | `scope-b-remediation.test.ts` |
| `subtopic-1` | Standard `admin`, `allowedSubtopics: ['other']` (restrictive) | `TUTORIAL_AUTHOR_CREATE` | **ALLOWED** (`null`) (R6-11) | `scope-b-remediation.test.ts` |
| `shared` | Student token (`roles: ['student']`) | None | **FORBIDDEN** (403) | `scope-b-remediation.test.ts` |
| `subtopic-1` | Faculty token (`roles: ['faculty']`) | None | **FORBIDDEN** (403) | `scope-b-remediation.test.ts` |
| `skillup` | Tenant token (`brand: 'skillup'`) | `TUTORIAL_AUTHOR_CREATE` | **FORBIDDEN** (403) | `scope-b-remediation.test.ts` |
| `unsupported-brand` | Standard `admin` | `TUTORIAL_AUTHOR_CREATE` | **FORBIDDEN** (403) | `scope-b-remediation.test.ts` |

---

## 6. Gateway Integration Evidence

1. **Trusted Header Forwarding:** In `apps/skillhubcore-admin/src/lib/shc-account-authority.ts`, `defaultShcAccountAuthority.getCurrentAccount` forwards:
   - `x-internal-secret: ${INTERNAL_GATEWAY_SECRET}`
   - `x-forwarded-host: admin.skillhubcore.in`
   - `x-original-host: admin.skillhubcore.in`
   - `x-brand: skillhubcore`
   - `x-forwarded-proto: https`
   - `Authorization: Bearer ${token}`
   - `Cookie: accessToken=${token}; admin_accessToken=${token}`
2. **Gateway Brand Resolution:** When requests hit the gateway (`request-brand.ts`), the combination of `x-forwarded-host: admin.skillhubcore.in` and `x-brand: skillhubcore` ensures brand resolves to `skillhubcore` without returning HTTP 400 `brand_unresolved`.
3. **Anti-Recursion Protection:** Destination URL is validated before fetch: targeting port `3007` or self-referential URL without explicit backend override throws `ConfigurationError` ('Recursive destination rejected').
4. **Hard Deadline:** `withDeadline` wraps fetch with a 3000ms deadline, aborting in-flight requests on timeout to prevent hung connection pools.

---

## 7. Full Quality Gate Scorecard

| Quality Gate | Exact Command | Exit Code | Counts / Output Summary |
| :--- | :--- | :--- | :--- |
| **API Server /me Route Suite** | `pnpm --filter @quiz/api-server exec vitest run src/app/api/shc/auth/me/__tests__/route.test.ts` | **0** | **17/17 passed** (100%) |
| **Scope B Remediation Master Suite** | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts` | **0** | **40/40 passed** (100%) |
| **Full Scope B Test Suite (7 files)** | `vitest run src/lib/__tests__/{scope-b-remediation,server-page-auth,proxy-page-security,admin-page-policy,admin-boundary,upstream-proxy}.test.ts src/components/auth/__tests__/admin-guard-scope-b.test.tsx` | **0** | **172/172 passed** across 7 files |
| **API Boundary Guards** | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **0** | **80 SHC API handlers checked**; explicit auth/origin guards |
| **Security Test Suite** | `pnpm --filter @quiz/skillhubcore-admin test:security` | **0** | **61/61 passed** across 2 files |
| **Auth Package Suite** | `pnpm --filter @quiz/auth test` | **0** | **176/176 passed** across 11 files |
| **API Server Type Check** | `pnpm --filter @quiz/api-server type-check` | **0** | **0 type errors** |
| **SHC Admin Type Check** | `pnpm --filter @quiz/skillhubcore-admin type-check` | **0** | **0 type errors** |
| **Auth Package Type Check** | `pnpm --filter @quiz/auth type-check` | **0** | **0 type errors** |
| **Zero-Warning ESLint** | `pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0` | **0** | **0 errors, 0 warnings** |
| **Next.js Production Build** | `pnpm --filter @quiz/skillhubcore-admin build` | **0** | **46/46 pages & routes compiled** (Turbopack) |
| **Knowledge Graph Rebuild** | `graphify update .` | **0** | **36,742 nodes, 87,061 edges updated** |
| **Git Diff Cleanliness** | `git diff --check` | **0** | **0 whitespace or formatting issues** |

---

## 8. Invariant Confirmation

- **No database migrations:** `packages/db-tutorial/migrations-pending-approval/0031_drop_tutorial_page_content_v2.sql.proposed` remains quarantined and inactive.
- **No live database mutations:** No DDL, no table drops, no data modifications executed.
- **Acceptance ledger untouched:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly 2 PASS / 17 FAIL / 43 PENDING.
- **No deployment, commit, or push:** All changes remain in the local uncommitted working tree on baseline `b7e0aa611b10bf7dc18752ec844d0cc9c1e7bc11`.
- **Zero self-approval:** Handoff is packaged exclusively for independent verification by Sol.

