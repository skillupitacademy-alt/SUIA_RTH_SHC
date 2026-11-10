# SHC Admin Scope B R6 — Independent Reviewer (Sol) Handoff Report

**Date:** 2026-11-10  
**Target:** SkillHubCore Admin (`apps/skillhubcore-admin`), API Server (`apps/api-server`), Auth Package (`packages/auth`)  
**Commit Baseline:** GitHub `main` at commit `b7e0aa611b10bf7dc18752ec844d0cc9c1e7bc11`  
**Acceptance Ledger:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` (Strictly untouched: 2 PASS / 17 FAIL / 43 PENDING)  
**Review Status:** Awaiting independent review from Sol (No self-approval permitted).

---

## 1. Context & Owner Invariants for Independent Reviewer (Sol)

This handoff packages the complete Scope B R6 four bounded security corrections addressing the four remaining findings from Sol's R5 review:

1. **Current-Account Eligibility (R6-A):** `/api/shc/auth/me` verifies live database status (`isActive === true`), platform (`skillhubcore`), and role (`admin` or `super_admin`). Inactive, student, and faculty accounts receive HTTP 403 Forbidden with a sanitized payload. In `shc-account-authority.ts`, upstream 403 is mapped via typed `AccountIneligibleError` to `FORBIDDEN` (`DEMOTED`), not `UNAVAILABLE`.
2. **Complete SHC Admin JWT Policy (R6-B):** `/api/shc/auth/me` verifies tokens via `verifyAdminAccessToken` enforcing HS256 algorithm, pinned issuer `skillhubcore.in`, audience `shc-admin`, `tokenType === 'admin'`, `brand === 'skillhubcore'`, finite numeric future `exp`, valid `nbf`, and non-blank principal identity. Tokens missing `iss` or `exp`, or signed with HS384, receive HTTP 401 Unauthorized with `Cache-Control: private, no-store`.
3. **Preserve SHC Authoring (R6-C):** Removed `allowedBrands`, `adminScope`, and `allowedSubtopics` as authorization predicates in `requireBrandAccess` and `requireSubtopicAccess`. Standard SHC administrators (`brand: 'skillhubcore'`) have full central authoring authority across all 4 distribution brands (`shared`, `skillup`, `realtutorialhub`, `skillhubcore`) and subtopics under action-level RBAC (create/edit/delete/publish). Non-SHC tenant tokens and invalid distribution brands receive HTTP 403 Forbidden.
4. **TokenService Construction Failure 503 (R6-D):** Scoped TokenService construction, token extraction, and verification in error boundary; catch `ConfigurationError` and return HTTP 503 `INTERNAL_ERROR` with `Cache-Control: private, no-store`.

### Crucial Invariants Confirmed
- Zero database migrations or DDL changes (`0031_drop_tutorial_page_content_v2.sql.proposed` remains quarantined).
- All 18 Tutorial V2 block families, Save as Draft, Publish, snapshots, and sidebar hierarchy validation remain intact.
- Acceptance ledger [10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv](file:///e:/onlinewebsites/quiz-platform/docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv) strictly untouched.
- No Git commit, push, or deployment executed.

---

## 2. Changed Files Manifest

| File Path | Description of Changes |
| :--- | :--- |
| `apps/api-server/src/app/api/shc/auth/me/route.ts` | Scoped TokenService construction with 503 `INTERNAL_ERROR` for `ConfigurationError`. Enforces full SHC Admin JWT policy (HS256, pinned issuer `skillhubcore.in`, audience `shc-admin`, tokenType `admin`, brand `skillhubcore`, finite future `exp`, valid `nbf`) returning 401. Checks live account eligibility: inactive, student, or faculty accounts receive HTTP 403 `FORBIDDEN`. Sets `Cache-Control: private, no-store`. |
| `apps/api-server/src/app/api/shc/auth/me/__tests__/route.test.ts` | 17 comprehensive unit & contract tests verifying active admin (200), super_admin (200), disabled account (403), student demotion (403), faculty demotion (403), unknown account (404), DB outage (503), missing token (401), missing iss (401), missing exp (401), expired token (401), HS384 (401), wrong aud (401), wrong brand (401), user token class (401), wrong key (401), and constructor `ConfigurationError` (503). |
| `apps/skillhubcore-admin/src/lib/auth-helpers.ts` | Removed `allowedBrands`, `adminScope`, and `allowedSubtopics` authorization restrictions. Standard SHC admins have central authoring authority across `shared`, `skillup`, `realtutorialhub`, `skillhubcore` without requiring optional claims. Preserves action-level RBAC, non-SHC tenant rejection (403), and valid brand identifier validation (403). |
| `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` | Added `AccountIneligibleError` for upstream HTTP 403 responses. `evaluateAccountAdmission` maps upstream 403 / `AccountIneligibleError` to `status: 'FORBIDDEN', reason: 'DEMOTED'`, preventing misclassification as `UNAVAILABLE` (503). |
| `apps/skillhubcore-admin/src/lib/__tests__/scope-b-remediation.test.ts` | Updated to 40 tests: replaced historical negative tests with positive owner-policy compatibility tests (standard admin across all 4 distribution scopes even with empty or restrictive optional claims) and added upstream 403 mapping test. |

---

## 3. Test & Verification Commands for Sol

```powershell
# 1. Verify Upstream /api/shc/auth/me Route Suite (17 tests)
pnpm --filter @quiz/api-server exec vitest run src/app/api/shc/auth/me/__tests__/route.test.ts

# 2. Verify Scope B Remediation Master Suite (40 tests)
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts

# 3. Verify Full Scope B Test Suite (7 files, 172 tests)
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts src/lib/__tests__/server-page-auth.test.ts src/lib/__tests__/proxy-page-security.test.ts src/lib/__tests__/admin-page-policy.test.ts src/lib/__tests__/admin-boundary.test.ts src/lib/__tests__/upstream-proxy.test.ts src/components/auth/__tests__/admin-guard-scope-b.test.tsx

# 4. Verify API Boundaries (80 handlers)
pnpm --filter @quiz/skillhubcore-admin check:boundaries

# 5. Verify Security Test Suite (61 tests)
pnpm --filter @quiz/skillhubcore-admin test:security

# 6. Verify Auth Package (176 tests)
pnpm --filter @quiz/auth test
pnpm --filter @quiz/auth type-check

# 7. Type-check all packages
pnpm --filter @quiz/api-server type-check
pnpm --filter @quiz/skillhubcore-admin type-check

# 8. Verify Zero-Warning Lint
pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0

# 9. Verify Next.js Production Build
pnpm --filter @quiz/skillhubcore-admin build

# 10. Verify Git Diff Cleanliness
git diff --check
```

---

## 4. Prompt for Independent Sol Review

```markdown
Please perform an independent security review of the Scope B R6 Four Bounded Security Corrections across `apps/skillhubcore-admin`, `apps/api-server`, and `packages/auth` on baseline commit `b7e0aa611b10bf7dc18752ec844d0cc9c1e7bc11` with the local uncommitted working tree.

Please independently verify:
1. Current-Account Eligibility (R6-A): Confirm that /api/shc/auth/me verifies live account status (isActive === true), platform ('skillhubcore'), and role ('admin' or 'super_admin'). Confirm inactive, student, and faculty accounts receive HTTP 403 Forbidden with a sanitized body. Confirm shc-account-authority.ts maps upstream 403 to FORBIDDEN (DEMOTED), not UNAVAILABLE.
2. Complete SHC Admin JWT Policy (R6-B): Confirm that /api/shc/auth/me uses verifyAdminAccessToken enforcing HS256, issuer 'skillhubcore.in', audience 'shc-admin', tokenType 'admin', brand 'skillhubcore', finite numeric future exp, valid nbf, and valid principal identity. Confirm tokens missing iss or exp, or signed with HS384, return HTTP 401 with Cache-Control: private, no-store.
3. Preserve Central SHC Authoring (R6-C): Confirm that optional allowedBrands, adminScope, and allowedSubtopics claims no longer restrict legitimate SHC administrators from authoring across all 4 distribution scopes ('shared', 'skillup', 'realtutorialhub', 'skillhubcore') and subtopics. Confirm non-SHC tenant tokens (user.brand !== 'skillhubcore') and invalid brand identifiers receive HTTP 403 Forbidden.
4. TokenService Construction Failure (R6-D): Confirm that TokenService constructor and token verification are scoped within an error boundary catching ConfigurationError and returning HTTP 503 instead of HTTP 500.
5. Invariants: Confirm zero database schema changes or migrations, and confirm 10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv remains strictly untouched (2 PASS / 17 FAIL / 43 PENDING).
```

