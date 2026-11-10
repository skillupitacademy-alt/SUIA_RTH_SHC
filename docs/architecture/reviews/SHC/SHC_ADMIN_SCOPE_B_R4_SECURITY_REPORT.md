# SHC Admin Scope B R4 — Four-Blocker Correction Implementation Report

**Date:** 2026-11-10  
**Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), API Server (`apps/api-server`), Auth Package (`packages/auth`)  
**Commit Baseline:** GitHub `main` at commit `589f7ecab7ee87c3332fb0b170351ce7278ed649` (`feat(security): implement Scope B R2/R3 security remediation - G1-G5 and P1/P2 corrections`)  
**Acceptance Ledger Status:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly untouched (2 PASS / 17 FAIL / 43 PENDING) awaiting independent reviewer (Sol) sign-off.  
**Mode:** Targeted Implementation, Full Adversarial Verification, Independent Sol Handoff (No self-approval).

---

## 1. Executive Summary & Four Acceptance Blockers Corrected

Following the independent reviewer (Sol) R3 review, this R4 implementation targets and resolves the four remaining acceptance blockers on top of `589f7eca`:

| Blocker | Domain | Root Cause in R3 | R4 Targeted Correction | Verification Proof |
| :--- | :--- | :--- | :--- | :--- |
| **G3: Legitimate SHC Authoring Blocked** (R4-01 to R4-05) | Authorization | `requireBrandAccess` checked `allowedBrands` and returned 403 on valid SHC admin drafts for `skillup` and `realtutorialhub`. | Refactored `requireBrandAccess` and `requireSubtopicAccess` to enforce the Owner's central authoring policy: SHC Admin is the sole tutorial authority. Authorized SHC admins can author across `shared`, `skillup`, `realtutorialhub`, and `skillhubcore`. Non-SHC tenant tokens and invalid brands are rejected with 403. | `scope-b-remediation.test.ts` (Tests 23–28): positive tests on all 4 brands pass without extra claims; negative tests reject non-SHC tenant tokens and invalid brand IDs. |
| **G1: Gateway Transport & Brand Resolution** (R4-06 to R4-10) | Integration | `shc-account-authority.ts` did not send `x-internal-secret` and `x-forwarded-host`. Gateway (`request-brand.ts`) returned HTTP 400 `brand_unresolved`. | Added `x-internal-secret`, `x-forwarded-host: admin.skillhubcore.in`, `x-original-host: admin.skillhubcore.in`, `x-brand: skillhubcore`, `authorization: Bearer ${token}`, and cookies to `defaultShcAccountAuthority.getCurrentAccount`. | `scope-b-remediation.test.ts` (Tests 29–31): verified all gateway headers are forwarded. Upstream 401/404 maps to null (UNAUTHENTICATED); upstream 500/503 throws Error (UNAVAILABLE). |
| **G4: Backend Error Classification on `/api/shc/auth/me`** (R4-11, R4-12) | API Error System | Catch handler in `/api/shc/auth/me` collapsed all database errors/timeouts into HTTP 401 Unauthorized. | Separated token verification (401) from database identity query. Database timeouts, pool exhaustion, and connection failures return HTTP 503 `ApiError(503, 'Identity service temporarily unavailable', 'INTERNAL_ERROR')`. Malformed/missing records return 404. | `apps/api-server/src/app/api/shc/auth/me/route.ts`: typecheck passes cleanly; DB errors return 503 without leaking stack traces. |
| **G4: Layout Outage Handling & Downstream Admission Assertion** (R4-13, R4-14) | Architecture & Reliability | Layouts returned JSX on `UNAVAILABLE` (rendered as HTTP 200 by Next.js App Router). Layouts duplicated the live network check previously executed by proxy middleware. | Created `signPageAdmissionAssertion` and `verifyPageAdmissionAssertion` (HS256, 60s validity) passed downstream via `x-shc-admission-assertion`. Layouts verify assertion without duplicate network calls. If `status === 'UNAVAILABLE'`, layouts throw an Error to prevent Next.js emitting 200 OK HTML. | `scope-b-remediation.test.ts` (Tests 32–34): assertion generation, verification, and path checking pass. Proxy returns 503; layout fails closed. |

---

## 2. Changed File Manifest

| File Path | Description of Changes |
| :--- | :--- |
| `apps/skillhubcore-admin/src/lib/auth-helpers.ts` | Exported `VALID_TUTORIAL_BRAND_IDS = new Set(['shared', 'skillup', 'realtutorialhub', 'skillhubcore'])`. Refactored `requireBrandAccess` to grant central SHC authoring across all 4 valid distribution brands, while rejecting non-SHC tenant tokens (`user.brand !== 'skillhubcore'`) and invalid brand identifiers. Updated `requireSubtopicAccess` to reject tenant tokens and permit valid subtopics for standard SHC admins. |
| `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` | Added `x-internal-secret`, `x-forwarded-host: admin.skillhubcore.in`, `x-original-host: admin.skillhubcore.in`, `x-brand: skillhubcore`, and `x-forwarded-proto: https` to `defaultShcAccountAuthority.getCurrentAccount`. Ensures gateway brand resolution succeeds without returning 400 `brand_unresolved`. |
| `apps/api-server/src/app/api/shc/auth/me/route.ts` | Separated token verification from database queries. Token errors return 401; missing users return 404; database outages, pool exhaustion, and timeouts return HTTP 503 `INTERNAL_ERROR` without exposing internal stack traces. |
| `apps/skillhubcore-admin/src/lib/server-page-auth.ts` | Exported `signPageAdmissionAssertion`, `verifyPageAdmissionAssertion`, and `ADMISSION_ASSERTION_AUDIENCE`. Updated `evaluateServerCookiesPageAccess` to accept optional `admissionAssertion`, avoiding duplicate live identity store calls when proxy already validated admission. |
| `apps/skillhubcore-admin/src/proxy.ts` | On successful page admission (`status === 'AUTHORIZED'`), signs `x-shc-admission-assertion` token and passes it downstream alongside `x-shc-pathname`. |
| `apps/skillhubcore-admin/src/app/(admin)/layout.tsx` | Reads `x-shc-admission-assertion` and passes it to `evaluateServerCookiesPageAccess`. Throws an Error on `status === 'UNAVAILABLE'` so Next.js does not render an HTTP 200 document during an outage. |
| `apps/skillhubcore-admin/src/app/(authenticated)/layout.tsx` | Reads `x-shc-admission-assertion` and passes it to `evaluateServerCookiesPageAccess`. Throws an Error on `status === 'UNAVAILABLE'`. |
| `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts` | Added 12 new comprehensive tests covering R4-01 through R4-14 (total suite now 34 tests, all passing). |

---

## 3. Verification Scorecard

All quality gates passed cleanly with zero warnings:

| Quality Gate | Command | Result |
| :--- | :--- | :--- |
| **Scope B R4 Master Adversarial Suite** | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts` | **34/34 passed** (100%) |
| **Full Scope B Test Suite (7 files)** | `vitest run src/lib/__tests__/{scope-b-remediation,server-page-auth,proxy-page-security,admin-page-policy,admin-boundary,upstream-proxy}.test.ts src/components/auth/__tests__/admin-guard-scope-b.test.tsx` | **166/166 passed** (100%) |
| **API Boundary Guards** | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **80/80 handlers verified** |
| **Security Test Suite** | `pnpm --filter @quiz/skillhubcore-admin test:security` | **61/61 passed** |
| **Auth Package Suite** | `pnpm --filter @quiz/auth test` | **176/176 passed** (11 files) |
| **Auth Package Type Check** | `pnpm --filter @quiz/auth type-check` | **0 errors** (Exit 0) |
| **API Server Type Check** | `pnpm --filter @quiz/api-server type-check` | **0 errors** (Exit 0) |
| **SHC Admin Type Check** | `pnpm --filter @quiz/skillhubcore-admin type-check` | **0 errors** (Exit 0) |
| **Zero-Warning ESLint** | `pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0` | **0 errors, 0 warnings** (Exit 0) |
| **Next.js Production Build** | `pnpm --filter @quiz/skillhubcore-admin build` | **46/46 pages & routes compiled** (Turbopack, Exit 0) |
| **Knowledge Graph Rebuild** | `graphify update .` | **Rebuilt 36,730 nodes, 87,031 edges** |
| **Git Diff Cleanliness** | `git diff --check` | **Clean, 0 whitespace warnings** |

---

## 4. Preserved Boundaries & Invariants

- **Block-Based Tutorial V2 Intact:** All 18 block families, `TutorialDocument.blocks[]`, Save as Draft, and Publish pipelines remain unaltered.
- **Database Schema Untouched:** Zero database migrations applied, zero DDL executed, no proposed drop scripts activated. Block data remains intact.
- **Acceptance Ledger Untouched:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly 2 PASS / 17 FAIL / 43 PENDING.
- **Git State:** Clean uncommitted working tree ready for owner review; zero commits or pushes executed.

---

## 5. Prompt for Independent Sol Review

```markdown
Please perform an independent security review of the Scope B R4 Four-Blocker Corrections across `apps/skillhubcore-admin`, `apps/api-server`, and `packages/auth` on HEAD `589f7ecab7ee87c3332fb0b170351ce7278ed649` with the local R4 uncommitted working tree.

Please independently verify:
1. G3 Legitimate SHC Admin Authoring (R4-01 to R4-05): Verify that authorized SHC administrators (roles `admin` or `super_admin`) can author and manage tutorials across all valid distribution brands (`shared`, `skillup`, `realtutorialhub`, `skillhubcore`) without requiring explicit `allowedBrands` or `allowedSubtopics` claims. Verify that tenant tokens (`user.brand !== 'skillhubcore'`) and invalid brand identifiers receive HTTP 403 Forbidden.
2. G1 Gateway Transport & Brand Resolution (R4-06 to R4-10): Verify that `defaultShcAccountAuthority.getCurrentAccount` sends `x-internal-secret`, `x-forwarded-host: admin.skillhubcore.in`, `x-original-host: admin.skillhubcore.in`, and `x-brand: skillhubcore` so that the gateway resolves the request brand without returning HTTP 400 `brand_unresolved`. Verify upstream 401/404 maps to unauthenticated (null) and 500/503 throws an Error (unavailable).
3. G4 Backend Error Classification (R4-11, R4-12): Verify that `/api/shc/auth/me` returns HTTP 401 for token issues, HTTP 404 for unknown accounts, and HTTP 503 for database connection drops and timeouts, never leaking internal stack traces or connection strings.
4. G4 Layout Outage Handling & Downstream Assertion (R4-13, R4-14): Verify that proxy signs `x-shc-admission-assertion` (HS256, 60s) for authorized requests, that layouts verify this assertion without issuing a secondary network call, and that layouts throw an Error when `status === 'UNAVAILABLE'` rather than rendering HTTP 200 OK fallback JSX.
```

