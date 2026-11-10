# SHC Admin Scope B R5 — Independent Reviewer (Sol) Handoff Report

**Date:** 2026-11-10  
**Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), API Server (`apps/api-server`), Auth Package (`packages/auth`)  
**Commit Baseline:** GitHub `main` at commit `382e8a52a88a881b6bce73d01215933f593a228a`  
**Acceptance Ledger:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` (Untouched: 2 PASS / 17 FAIL / 43 PENDING)  
**Review Status:** Awaiting independent review from Sol (No self-approval permitted).

---

## 1. Context & Owner Invariants for Independent Reviewer (Sol)

This handoff packages the complete Scope B R5 implementation addressing the remaining security, cryptographic, and architectural findings.

### Crucial Owner Directives & Invariants to Respect
1. **Centralized SHC Admin Tutorial Authoring:**
   - SHC Admin is the sole, centralized authoring authority for all Tutorial V2 content across distribution scopes (`shared`, `skillup`, `realtutorialhub`, `skillhubcore`).
   - Authorized SHC administrators (roles `admin` or `super_admin`) have full CRUD, Save as Draft, and Publish authority across all four distribution scopes without requiring extra `allowedBrands` or `allowedSubtopics` ACL claims.
   - Non-SHC tenant tokens (`user.brand !== 'skillhubcore'`) and invalid brand identifiers MUST be strictly rejected with HTTP 403 Forbidden.
   - Learner-facing applications (SUIA and RTH) are pure consumers of published tutorials; they do not author or manage tutorials.
2. **Database Invariants:**
   - No database migrations, DDL changes, or table drops are permitted.
   - Quarantined proposed drop script `0031_drop_tutorial_page_content_v2.sql.proposed` in `migrations-pending-approval/` remains inactive.
3. **Acceptance Ledger Integrity:**
   - `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` must remain unchanged by the implementer. Sol alone updates or approves ledger items upon independent verification.

---

## 2. Verification Points for Sol

Sol should independently inspect the working tree and execute tests against these specific areas:

### Area 1: Centralized SHC Admin Tutorial Authoring (Tasks R5-05 to R5-10)
- **Source:** `apps/skillhubcore-admin/src/lib/auth-helpers.ts`
- **Verify:**
  1. `requireBrandAccess(user, 'shared')`, `requireBrandAccess(user, 'skillup')`, `requireBrandAccess(user, 'realtutorialhub')`, and `requireBrandAccess(user, 'skillhubcore')` all return `{ authorized: true }` for standard SHC admins (`brand: 'skillhubcore'`) without requiring explicit `allowedBrands` claims.
  2. Any user token where `user.brand !== 'skillhubcore'` is rejected with `{ authorized: false, status: 403 }`.
  3. Any unknown brand (e.g. `'malicious-tenant'`) is rejected with `{ authorized: false, status: 403 }`.
  4. `requireSubtopicAccess` permits valid subtopic operations for standard SHC admins, rejects empty/whitespace subtopics (400), and rejects non-SHC tenant tokens (403).

### Area 2: Trusted Gateway Transport & Anti-Recursion (Tasks R5-11 to R5-16)
- **Source:** `apps/skillhubcore-admin/src/lib/shc-account-authority.ts`
- **Verify:**
  1. `defaultShcAccountAuthority.getCurrentAccount` checks the destination URL and rejects recursive loops back to SHC Admin (e.g. port 3007 or self URL), throwing `ConfigurationError`.
  2. In production (`NODE_ENV === 'production'`), missing `INTERNAL_GATEWAY_SECRET` throws `ConfigurationError`.
  3. Forwards trusted gateway headers: `x-internal-secret`, `x-forwarded-host: admin.skillhubcore.in`, `x-original-host: admin.skillhubcore.in`, `x-brand: skillhubcore`, `x-forwarded-proto: https`, `Authorization: Bearer ${token}`, and cookies.
  4. Maps HTTP 401 and 404 from upstream gateway to `null` (`UNAUTHENTICATED`).
  5. Maps HTTP 500, 502, 503, 504, fetch timeouts, and network connection drops to thrown Errors (`UNAVAILABLE`).

### Area 3: Backend Error Classification on `/api/shc/auth/me` (Tasks R5-17 to R5-20)
- **Source:** `apps/api-server/src/app/api/shc/auth/me/route.ts` & `apps/api-server/src/modules/auth/shc-auth.service.ts`
- **Verify:**
  1. Token verification issues (expired, invalid signature, missing) return HTTP 401 with `Cache-Control: private, no-store`.
  2. Missing or deactivated account throws typed `UserNotFoundError` in `shc-auth.service.ts` and returns HTTP 404 (`NOT_FOUND`).
  3. Database outages, connection drops, and pool exhaustion return HTTP 503 (`INTERNAL_ERROR`).
  4. Response payloads never leak internal database errors, connection strings, or stack traces.

### Area 4: Cryptographically Bound Downstream Assertion (Tasks R5-21 to R5-26)
- **Source:** `apps/skillhubcore-admin/src/lib/server-page-auth.ts` & `apps/skillhubcore-admin/src/proxy.ts`
- **Verify:**
  1. Client-supplied `x-shc-admission-assertion` and `x-shc-pathname` are stripped at the very beginning of `proxy.ts` before evaluating admission.
  2. Upon authorization, `proxy.ts` calls `signPageAdmissionAssertion(user, pathname, token)` which embeds `tokenHash: sha256(sessionToken)` in the assertion JWT (HS256, 60s lifetime).
  3. `verifyPageAdmissionAssertion` verifies the exact requested pathname, finite exp, brand, and validates that `tokenHash === sha256(cookieToken)`.
  4. Assertions forged by clients, presented with mismatching session cookies, or used on different pathnames are strictly rejected.
  5. When assertion is valid, layout skips redundant live network queries to the gateway.
  6. When identity service is `UNAVAILABLE`, `proxy.ts` returns HTTP 503 directly; layout throws an Error to fail closed rather than rendering an HTTP 200 fallback JSX shell.

---

## 3. Test & Quality Gate Commands for Sol

```powershell
# 1. Run the R5 Master Adversarial Suite (39 tests)
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts

# 2. Run the full Scope B test suite (7 files, 171 tests)
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts src/lib/__tests__/server-page-auth.test.ts src/lib/__tests__/proxy-page-security.test.ts src/lib/__tests__/admin-page-policy.test.ts src/lib/__tests__/admin-boundary.test.ts src/lib/__tests__/upstream-proxy.test.ts src/components/auth/__tests__/admin-guard-scope-b.test.tsx

# 3. Verify API Boundaries
pnpm --filter @quiz/skillhubcore-admin check:boundaries

# 4. Verify Security Tests
pnpm --filter @quiz/skillhubcore-admin test:security

# 5. Verify Auth Package
pnpm --filter @quiz/auth test
pnpm --filter @quiz/auth type-check

# 6. Verify Typechecks
pnpm --filter @quiz/api-server type-check
pnpm --filter @quiz/skillhubcore-admin type-check

# 7. Verify Zero-Warning Lint
pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0

# 8. Verify Next.js Production Build
pnpm --filter @quiz/skillhubcore-admin build

# 9. Verify Git Diff Cleanliness
git diff --check
```

---

## 4. Prompt for Independent Sol Review

```markdown
Please perform an independent security review of the Scope B R5 Implementation across `apps/skillhubcore-admin`, `apps/api-server`, and `packages/auth` on HEAD `382e8a52a88a881b6bce73d01215933f593a228a` with the local uncommitted working tree.

Please independently verify:
1. Centralized SHC Admin Tutorial Authoring: Confirm authorized SHC administrators can author and manage tutorials across all valid distribution brands ('shared', 'skillup', 'realtutorialhub', 'skillhubcore') without requiring extra allowedBrands or allowedSubtopics claims. Confirm non-SHC tenant tokens (user.brand !== 'skillhubcore') and invalid brand identifiers receive HTTP 403 Forbidden.
2. Trusted Gateway Transport & Anti-Recursion: Confirm defaultShcAccountAuthority.getCurrentAccount validates destination (rejecting port 3007/self), requires INTERNAL_GATEWAY_SECRET in production, forwards x-internal-secret, x-forwarded-host: admin.skillhubcore.in, x-original-host: admin.skillhubcore.in, and x-brand: skillhubcore. Confirm upstream 401/404 maps to null and 500/503/timeout maps to thrown Error.
3. Backend Error Classification: Confirm /api/shc/auth/me returns HTTP 401 for token issues, HTTP 404 for UserNotFoundError, and HTTP 503 for database outages/pool exhaustion without leaking internal stack traces.
4. Cryptographically Bound Assertion: Confirm proxy.ts strips client headers, signs a token-bound assertion (HS256, 60s, tokenHash: sha256(sessionToken)), and layouts verify the assertion against the session cookie. Confirm proxy returns 503 on UNAVAILABLE and layouts throw an Error to fail closed.
5. Invariants: Confirm zero database schema changes or migrations, and confirm 10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv remains unchanged.
```

