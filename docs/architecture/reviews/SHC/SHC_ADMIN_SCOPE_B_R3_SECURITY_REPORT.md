# SHC Admin Scope B R3 Targeted Security Corrections Implementation Report

**Date:** 2026-11-10  
**Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), Auth Package (`packages/auth`)  
**Commit Baseline:** GitHub `main` at `22b86e89598bf512832f2e9ec5428a4a47e17121` + local R3 corrective working tree  
**Acceptance Ledger Status:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly untouched (2 PASS / 17 FAIL / 43 PENDING) awaiting independent reviewer (Sol) sign-off.  
**Mode:** Targeted Implementation, Full Adversarial Verification, Independent Sol Handoff (No self-approval).

---

## 1. Owner Decision & Policy Clarification (G3 Context)

The owner explicitly confirmed the architecture and authorization policy for Tutorial V2:
1. **Central Authoring Authority:** SHC Admin remains the sole tutorial authoring and content management authority.
2. **Preserve Authorized Admin Functionality:** Authorized SHC administrators retain existing permissions for tutorial CRUD, Save as Draft, Publish, and sidebar management across `shared`, `skillup`, and `realtutorialhub`.
3. **No Unapproved Role Escalations:** Do not introduce unapproved `super_admin`-only barriers or require artificial `allowedBrands` or `allowedSubtopics` claims for standard authorized administrators.
4. **Learner Boundaries Preserved:** SUIA and RTH remain learner-facing consumers of published tutorial content and do not perform authoring.
5. **G3 Review Scope for Sol:** Evaluated against the owner's centralized SHC authoring model. Unauthorized callers, invalid credentials, deactivated accounts, and broken hierarchy relationships are rejected; valid SHC admin workflows are preserved.

---

## 2. Root Cause and R3 Correction Matrix (Tasks R3-01 through R3-24)

| Priority / Gap | Sol Adversarial Finding | Root Cause | R3 Targeted Correction | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **P1: G1 Account Bypass (R3-05 to R3-08)** | Sol proved production `/dashboard` returned 200 with fixture token when `VITEST=true` or `VITEST=false` and DB unavailable. | `shc-account-authority.ts` contained `const isTest = Boolean(process.env.VITEST) ...`, evaluating `Boolean("false") === true` and fabricating active admin accounts. | **DELETED fabricated-account branch entirely.** Production code never invents accounts. Tests explicitly inject test doubles via `setAccountAuthority()`. If authority is unconfigured/unreachable, it strictly fails closed (`UNAVAILABLE`). | `scope-b-remediation.test.ts` (Tests 1–3): verified `VITEST unset`, `VITEST=true`, and `VITEST=false` in production environment return `UNAVAILABLE`/failure, NEVER `AUTHORIZED` (Exit 0). |
| **P1: G1 Real Service Authority (R3-09 to R3-13)** | Authority called non-existent `?userId=` query parameter on `/api/shc/auth/me`. | SHC identity endpoint `/api/shc/auth/me` authenticates via Bearer token / cookies, not anonymous query params. | Configured `defaultShcAccountAuthority` to call `/api/shc/auth/me` with `Authorization: Bearer ${token}` and `Cookie: accessToken=${token}`. Enforces strict subject matching (`account.id === originalUserId`), platform check (`platform === 'skillhubcore'`), boolean active check (`isActive === true`), and deletedAt check. | `scope-b-remediation.test.ts` (Tests 4–8): verified ID mismatch, wrong platform, deactivated account, and deleted account reject admission on pages and APIs. |
| **P1: Role Reconciliation (R3-14 to R3-16)** | Stale `super_admin` token allowed unrestricted access after account demotion to `admin`. | Token roles were used directly without reconciling with live account roles. | Implemented `deriveEffectiveRoles(tokenRoles, accountRole)` with least privilege. Stale `super_admin` token claim is overridden if account is demoted to `admin`. `isAdmin` is derived from effective roles. Effective principal is propagated everywhere. | `scope-b-remediation.test.ts` (Tests 9–10): verified demoted `super_admin -> admin` yields effective role `['admin']` and denies super_admin-only privileges. Demoted to `student` returns 403 Forbidden. |
| **P2: G3 Sidebar Tree IDOR (R3-17 to R3-20)** | Sidebar POST only validated `activeSubtopicId`, allowing unauthorized subtopics nested inside the submitted navigation tree. | Route only checked root `activeSubtopicId`. | Implemented `extractSidebarTreeSubtopicIds` to recursively extract all node IDs from the authoring tree and enforce `requireSubtopicAccess(user, subtopicId)` before any database hierarchy lookup or mutation. Enforced fail-closed on empty/malformed scopes (`allowedSubtopics: []` / `allowedBrands: []`). | `scope-b-remediation.test.ts` (Tests 14–17): verified nested unauthorized subtopics reject with 403 Forbidden before DB calls. Cross-tenant brand IDOR rejected with 403. |
| **P2: G4 Real 503 & Deadline (R3-21 to R3-24)** | Cooperative AbortSignal allowed hung provider to block admission indefinitely. Configuration errors collapsed into 401. Missing cache headers. | No hard caller deadline. `verifyToken` caught `ConfigurationError` and returned `null` (401). | Implemented `withDeadline` using `Promise.race` and timer cleanup. `ConfigurationError` in API auth returns HTTP 503 `SERVICE_UNAVAILABLE`. All 401, 403, and 503 responses emit `Cache-Control: private, no-store`. | `scope-b-remediation.test.ts` (Tests 11–13): verified hung provider times out at deadline and returns 503. Verified `Cache-Control: private, no-store`. |
| **G2 & G5 Preserved Controls** | Prior accepted improvements must not regress. | N/A | Strictly preserved G2 mandatory claims (`HS256`, pinned issuer `skillhubcore.in`, finite `exp`, `aud: 'shc-admin'`, `brand: 'skillhubcore'`) and G5 dynamic secret safety in `token.service.ts`. | `scope-b-remediation.test.ts` (Tests 18–22) & `token.service.test.ts` (50 tests passed). |

---

## 3. Changed File Manifest

| File Path | Description of Changes |
| :--- | :--- |
| `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` | Removed fabricated account branch; wired authenticated `/api/shc/auth/me` contract; added `deriveEffectiveRoles` least-privilege role reconciliation; added `withDeadline` hard timeout enforcement. |
| `apps/skillhubcore-admin/src/lib/server-page-auth.ts` | Passes token and token roles to `evaluateAccountAdmission`; reconciles effective principal before checking page permissions; verifies `isAdmin` from effective roles. |
| `apps/skillhubcore-admin/src/lib/auth-helpers.ts` | Imported `ConfigurationError`; maps config exceptions to HTTP 503 `SERVICE_UNAVAILABLE`; updates `user.roles` and `isAdmin` to effective reconciled principal; updated `requireSubtopicAccess` and `requireBrandAccess` to fail closed on empty/malformed scopes. |
| `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts` | Added `extractSidebarTreeSubtopicIds` to recursively validate every subtopic in submitted tree before database queries or mutations; validated brand and subtopic scopes. |
| `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts` | Master adversarial test suite (22 tests) covering P1 no-bypass exploit matrix, role demotion, timeouts, tree IDOR, 503 degradation, and G2/G5 regressions. |
| `apps/skillhubcore-admin/src/lib/__tests__/server-page-auth.test.ts` | Updated unit test harness with explicit `setAccountAuthority` test fixture injection. |
| `apps/skillhubcore-admin/src/lib/__tests__/proxy-page-security.test.ts` | Updated unit test harness with explicit `setAccountAuthority` test fixture injection. |
| `apps/skillhubcore-admin/src/lib/__tests__/admin-boundary.test.ts` | Preserved original imports via `importOriginal` for `@quiz/auth`; added mock account authority. |
| `packages/auth/src/token.service.ts` | Preserved dynamic `resolveSecret()` getters throwing `ConfigurationError` on missing production/development secrets. |

---

## 4. Verification Scorecard

All quality gates and adversarial test suites passed cleanly with zero warnings:

| Gate | Scope | Result | Status |
| :--- | :--- | :--- | :--- |
| **Scope B R3 Master Adversarial Suite** | `scope-b-remediation.test.ts` | **22/22 passed** | ✅ PASS |
| **Server Page Auth & Security Suite** | `server-page-auth.test.ts`, `proxy-page-security.test.ts`, `admin-page-policy.test.ts`, `admin-guard-scope-b.test.tsx` | **71/71 passed** | ✅ PASS |
| **Security & Upstream Proxy** | `admin-boundary.test.ts`, `upstream-proxy.test.ts` | **61/61 passed** | ✅ PASS |
| **API Boundary Route Checks** | `scripts/check-api-boundaries.mjs` | **80/80 handlers verified** | ✅ PASS |
| **Auth Package Suite** | `packages/auth/src/**/__tests__/*.test.ts` | **176/176 passed** (11 files) | ✅ PASS |
| **TypeScript Type Checks** | `@quiz/auth` & `@quiz/skillhubcore-admin` | **0 errors** | ✅ PASS |
| **Zero-Warning ESLint** | `@quiz/skillhubcore-admin lint -- --max-warnings=0` | **0 errors, 0 warnings** | ✅ PASS |
| **Next.js Production Build** | `next build` | **46/46 pages & routes compiled** | ✅ PASS |
| **Knowledge Graph** | `graphify update .` | **Rebuilt 36,726 nodes, 87,017 edges** | ✅ PASS |
| **Git Diff Cleanliness** | `git diff --check` | **Clean, no whitespace issues** | ✅ PASS |

---

## 5. Owner Decision Register

1. **Individual Stateless Access-Token Revocation (SB2-10):**  
   - **Current State:** SHC logout revokes refresh tokens. Account deactivations, deletions, and role demotions take effect immediately across all endpoints on every request.  
   - **Open Decision:** Stateless JWT access tokens carry claims without a `jti` tied to a live token denylist. Revoking a single access token before natural expiry while leaving the account active requires an architectural decision on session denylist infrastructure (e.g. Redis session store). Status: **OWNER DECISION REQUIRED**.
2. **Centralized Tutorial V2 Authoring (G3 Policy):**  
   - **Decision:** **RESOLVED BY OWNER.** SHC Admin is the central authoring authority for `shared`, `skillup`, and `realtutorialhub`. Standard authorized administrators retain full authoring and publishing permissions without requiring new `super_admin` restrictions.

---

## 6. Prompt for Independent Sol Review

```markdown
Please perform an independent security review of the Scope B R3 Targeted Security Corrections across `apps/skillhubcore-admin` and `packages/auth` on HEAD `22b86e89598bf512832f2e9ec5428a4a47e17121` with the local R3 uncommitted working tree.

Please independently verify:
1. P1 (Fabricated Account Bypass): Verify that `shc-account-authority.ts` contains zero branches checking `VITEST`, `NODE_ENV`, or dev flags to invent accounts. In an isolated production build with unavailable backing authority, verify that `VITEST=true`, `VITEST=false`, and `VITEST` unset never return 200 on `/dashboard` with a fixture token.
2. P1 (Real Authority Wiring): Verify that `defaultShcAccountAuthority` calls `/api/shc/auth/me` with `Bearer ${token}`, enforces strict originalUserId matching, checks `platform === 'skillhubcore'`, boolean `isActive === true`, and non-null `deletedAt`.
3. P1 (Role Demotion): Verify that a stale token with `roles: ['super_admin']` demotes to `['admin']` when the authoritative account has role `admin`, and that student accounts are denied with 403.
4. P2 (Sidebar Tree IDOR): Verify that `POST /api/tutorial-left-sidebar` recursively validates all node IDs in the authoring tree, rejecting unauthorized subtopics with 403 Forbidden before database queries.
5. P2 (Real HTTP 503 & Deadline): Verify that hung provider calls trigger `withDeadline` and return 503 with `Cache-Control: private, no-store`.
6. Owner Decision Alignment: Evaluate G3 against the owner's confirmed model (centralized SHC Admin authoring across shared/skillup/realtutorialhub without artificial super_admin barriers).
```
