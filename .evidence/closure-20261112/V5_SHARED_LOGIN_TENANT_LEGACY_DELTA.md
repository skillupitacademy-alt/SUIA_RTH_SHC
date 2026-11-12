# V5 Shared Login, Tenant Authorization, Retired-Route Cleanup & Quality Gates — Delta Closure Report

## 1. Baseline Pin & Git Hygiene
- **Pinned Baseline Commit (`74131aa1ee717042c0280247ffd5bb022e3e19fc`) + V5 Commit (`c64766ca04bb196349973abd152a878d400082e7`)**
- **Branch:** `main`
- **Git Whitespace / Conflict Marker Check:** `git diff --check` -> Exit Code `0` (clean)
- **Owner Approval Boundaries Respected:**
  - Zero remote PostgreSQL / Neon / Supabase / Redis writes or DDL/migrations
  - Zero paid AI provider requests
  - Zero Docker / container / VPS / host configuration changes
  - Zero modifications to `.agents/03_ACTIVE_TASKS/RTH-REMEDIATION-20260409/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`

---

## 2. Modified, Created & Retired Files Inventory

### A. Shared Learner Authentication (`src/share-branding/`)
1. `src/share-branding/AuthPage.tsx` — Added hydration gate (`isHydrated`), synchronous double-submit lock (`submittingRef`), explicit `method="post"`, `action={mode === 'signup' ? '/signup' : '/login'}`, `noValidate`, `disabled={!isHydrated || isLoading}` on all form inputs/toggles/submit buttons, `initial={false}` on Framer Motion containers so SSR HTML is visibly rendered without JS, and `sanitizeLearnerRedirect` on post-login navigation.
2. `src/share-branding/auth/sanitizeLearnerRedirect.ts` — Created centralized internal-only redirect validator rejecting external origins, protocol-relative URLs (`//`), backslashes (`\`), control characters, encoded double-slash/backslash bypasses, and auth-loop paths (`/login`, `/signup`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-success`, `/api/*`).
3. `src/share-branding/auth/authViewData.ts` — Extended `LoginUserSummary` with optional `name`, `onboarded`, and `onboardingCompleted` fields.
4. `src/share-branding/auth/authMapper.ts` — Replaced upstream raw error message pass-through (`extractErrorMessage`) with fixed status-mapped `publicAuthErrorMessage(status)` to prevent upstream diagnostic leakage.
5. `src/share-branding/auth/authLoader.ts` — Removed browser `console.log` statements that logged user identity/roles/email during login and session checks.
6. `src/share-branding/auth/validateAuthState.ts` — Separated browser session check (`GET /api/profile` with `credentials: 'include'`, `cache: 'no-store'`) from SSR gateway validation (`${gatewayUrl}/auth/me`), removed unused parameter lint warning, and removed sensitive `console.log` output.
7. `src/share-branding/auth/index.ts` — Exported `sanitizeLearnerRedirect`.
8. `src/share-branding/middleware/authProxy.ts` — Added `/remediation` and `/tutorial/assignments` to `PROTECTED_PREFIXES` and removed obsolete `/learn/` prefix.
9. `apps/skillup-web/src/app/login/page.tsx` & `apps/skillup-web/src/app/signup/page.tsx` — Removed redundant outer `<Suspense>` fallback wrapper so SSR HTML renders `<form>` directly when JS is disabled.
10. `apps/realtutorialhub-web/src/app/login/page.tsx` & `apps/realtutorialhub-web/src/app/signup/page.tsx` — Removed redundant outer `<Suspense>` fallback wrapper so SSR HTML renders `<form>` directly when JS is disabled.

### B. Tenant Authorization & BFF Route Hardening (`SUIA` + `RTH`)
11. `apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts` — Enforced `Cache-Control: private, no-store` on all `200`, `400`, `404`, `500`, and `502` responses and preserved trusted hostname brand derivation.
12. `apps/skillup-web/src/lib/student-auth.ts` & `apps/skillup-web/src/lib/student-auth.test.ts` — Verified `skillup` brand & student role enforcement and added unit tests proving `shadowUserId` -> `userId` -> `sub` precedence and rejection of forged `x-user-id` / `x-shadow-user-id` headers without a valid cookie token.
13. `apps/realtutorialhub-web/src/lib/assignment-auth.ts` & `apps/realtutorialhub-web/src/lib/__tests__/assignment-auth.test.ts` — Verified `realtutorialhub` brand & student role enforcement and added unit tests proving `shadowUserId` -> `userId` -> `sub` precedence and rejection of forged headers without a valid cookie token.

### C. Reconciled Unit Tests, Retired `410 Gone` Routes & RTH `/learn` Retirement
14. `apps/skillup-web/src/lib/__tests__/sanitize-learner-redirect.test.ts` — Created 39 unit tests covering `sanitizeLearnerRedirect`, `mapLoginError`, `mapLoginResponse`, `validateAuthState`, and `fetchCurrentUserState`.
15. `apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/__tests__/log-boundary.test.ts` — Reconciled test with intentional `410 Gone` retirement contract (`Cache-Control: private, no-store`, zero stack/SQL/file path leaks).
16. `apps/realtutorialhub-web/src/app/api/tutorial/sections/__tests__/route.test.ts` — Reconciled test with centralized `createApiClient` + `resolveBrandFromHostname` BFF proxy implementation and `Cache-Control: private, no-store`.
17. `apps/realtutorialhub-web/src/app/api/tutorial/progress/__tests__/route.test.ts` — Reconciled test with centralized `createApiClient` + `getAccessToken` BFF proxy implementation.
18. `apps/realtutorialhub-web/src/components/content/{CodeBlock,LaymanBlock,RealLifeBlock,TechnicalBlock}.tsx` & `apps/realtutorialhub-web/src/components/content/__tests__/BlockRenderer.test.tsx` — Preserved modular/legacy block detection, resolved duplicate empty object key in `LaymanBlock.tsx`, and aligned relative imports in `BlockRenderer.test.tsx`.
19. `apps/realtutorialhub-web/vitest.config.ts` & `apps/realtutorialhub-web/vitest.setup.ts` — Configured Vitest path aliases and Testing Library / `ResizeObserver` / `IntersectionObserver` test environment setup.
20. RTH `/learn` Route Retirement & Canonical Re-homing:
    - Re-homed remediation page to `apps/realtutorialhub-web/src/app/remediation/page.tsx` and assignments page/test to `apps/realtutorialhub-web/src/app/tutorial/assignments/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx` (`__tests__/page.test.ts`).
    - Deleted retired `apps/realtutorialhub-web/src/app/(learning)/learn/...` tree (8 files) and dedicated legacy `/learn` components (`TutorialExperience.tsx`, `BlockNavPills.tsx`, `BlockPreviewCard.tsx`, `TutorialKeyboardNav.tsx`, `LearningActivityTracker.tsx`, `SubtopicHeader.tsx`, `BlockLoadingSkeleton.tsx`, `TutorialSidebar.tsx`, `TutorialKeyboardNav.test.tsx`).
    - Updated `apps/realtutorialhub-web/src/app/sitemap.ts`, `apps/realtutorialhub-web/src/app/__tests__/sitemap.test.ts`, `apps/realtutorialhub-web/src/app/robots.ts`, `apps/realtutorialhub-web/src/components/content/__tests__/RemediationOverview.test.tsx`, and `apps/realtutorialhub-web/src/__tests__/middleware.test.ts` to use canonical `/tutorial` and `/tutorial-v2` paths.
21. `tests/e2e/learner-login-security.spec.ts` — Created 17-test Playwright browser security & route-retirement verification suite.

---

## 3. Shared Login / Signup Hydration & Submit Proof (`SUIA` + `RTH`)
- Both `SUIA` (`brand="skillup"`) and `RTH` (`brand="realtutorialhub"`) render `<form method="post" action="/login" noValidate>` on `/login` and `<form method="post" action="/signup" noValidate>` on `/signup`.
- All inputs (`#email`, `#password`, `#full-name`), password-visibility toggle, mode-switch controls, and `button[type="submit"]` render `disabled` in SSR HTML (`disabled={!isHydrated || isLoading}`) until client hydration completes (`useEffect(() => setIsHydrated(true), [])`).
- `submittingRef` prevents duplicate concurrent POST requests on rapid double-clicks or repeated `Enter` presses.
- Verified in Chromium via `tests/e2e/learner-login-security.spec.ts`:
  - `SUIA: blocks login without JavaScript and declares safe native POST /login` — **PASS**
  - `SUIA: keeps login controls disabled while hydration scripts are delayed` — **PASS**
  - `SUIA: forced native login submission is a body-only POST to /login` — **PASS**
  - `SUIA: hydrated click sends one JSON POST /api/auth/login with brand=skillup and honors sanitized redirect` — **PASS**
  - `SUIA: hydrated Enter sends one JSON POST /api/auth/login with brand=skillup and honors sanitized redirect` — **PASS**
  - `SUIA: signup enforces SSR disabled controls, safe native POST /signup, and single hydrated POST /api/auth/signup` — **PASS**
  - `RTH: blocks login without JavaScript and declares safe native POST /login` — **PASS**
  - `RTH: keeps login controls disabled while hydration scripts are delayed` — **PASS**
  - `RTH: forced native login submission is a body-only POST to /login` — **PASS**
  - `RTH: hydrated click sends one JSON POST /api/auth/login with brand=realtutorialhub and honors sanitized redirect` — **PASS**
  - `RTH: hydrated Enter sends one JSON POST /api/auth/login with brand=realtutorialhub and honors sanitized redirect` — **PASS**
  - `RTH: signup enforces SSR disabled controls, safe native POST /signup, and single hydrated POST /api/auth/signup` — **PASS**

---

## 4. Redirect Validation & Public Error Sanitization Proof
- `sanitizeLearnerRedirect` (39 unit tests in `apps/skillup-web/src/lib/__tests__/sanitize-learner-redirect.test.ts` + E2E browser loop across `SUIA` and `RTH`) rejects:
  - `https://evil.example/phish` -> `/dashboard`
  - `//evil.example/phish` -> `/dashboard`
  - `/\evil.example` -> `/dashboard`
  - `/%2f/evil.example` and `/%5cevil.example` -> `/dashboard`
  - `/login`, `/signup`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-success`, `/api/auth/login` -> `/dashboard`
- Preserves valid internal paths with query strings and hashes (e.g., `/tutorial?domain=full-stack&subtopic=promises#notes`).
- `mapLoginError` maps HTTP status codes (`401`, `403`, `429`, `400`/`422`, `409`, `500`) to fixed user-safe messages and never surfaces upstream `error`, `message`, or `_error` fields in DOM or console logs.

---

## 5. Browser vs SSR Session-State Proof
- In browser context (`typeof window !== 'undefined'`), `validateAuthState()` calls same-origin `GET /api/profile` with `credentials: 'include'` and `cache: 'no-store'` — never reading `process.env.GATEWAY_URL` or `process.env.INTERNAL_GATEWAY_SECRET` in client code.
- In SSR context (`typeof window === 'undefined'`), `validateAuthState()` validates against `${gatewayUrl}/auth/me` with `X-Original-Host` derived strictly from Next.js `host` header and `X-Internal-Secret`.

---

## 6. Tenant & Student Ownership Proof (`SUIA` + `RTH` + `SHC`)
- **`SUIA` (`apps/skillup-web/src/lib/student-auth.test.ts`):** 15/15 unit tests pass, proving `brand === 'skillup'` enforcement, rejection of `realtutorialhub` tokens (`403`), rejection of non-student roles (`403`), rejection of forged `x-user-id` / `x-shadow-user-id` headers without a valid cookie token (`401`), and `shadowUserId` -> `userId` -> `sub` identity precedence.
- **`RTH` (`apps/realtutorialhub-web/src/lib/__tests__/assignment-auth.test.ts`):** 6/6 unit tests pass, proving `brand === 'realtutorialhub'` enforcement, rejection of `skillup` tokens (`403`), rejection of non-student roles (`403`), rejection of forged headers without a valid cookie token (`401`), and `shadowUserId` -> `userId` -> `sub` identity precedence.
- **`SHC` (`apps/skillhubcore-admin`):** `test:security` and `test:isolated` pass 4/4 test files (94/94 tests), and `check:boundaries` passes all 80 handlers with 0 violations.

---

## 7. Retired Route (`410 Gone` & `/learn` Retirement) Proof
- `apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts` and `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts` preserve intentional `410 Gone` responses with `Cache-Control: private, no-store`.
- `apps/skillup-web/src/app/api/content-manager/add-section/route.ts` and `apps/realtutorialhub-web/src/app/api/content-manager/add-section/route.ts` preserve intentional `410 Gone` responses.
- All retired RTH `/learn/...` page URLs return `404` while `/start-learning`, `/tutorial`, `/tutorial-v2/...`, `/remediation`, and `/tutorial/assignments/...` remain active (verified by Playwright test 17).

---

## 8. Test, Lint, Type-Check & Build Command Matrix

| Application / Scope | Command | Result |
| :--- | :--- | :--- |
| `@quiz/skillup-web` Unit Tests | `pnpm --filter @quiz/skillup-web test` | **PASS** (22 files, 157/157 tests, exit 0) |
| `@quiz/realtutorialhub-web` Unit Tests | `pnpm --filter @quiz/realtutorialhub-web test` | **PASS** (58 files, 247/247 tests, exit 0) |
| `@quiz/skillhubcore-admin` Security Tests | `pnpm --filter @quiz/skillhubcore-admin test:security` | **PASS** (4 files, 94/94 tests, exit 0) |
| `@quiz/skillhubcore-admin` Isolated Tests | `pnpm --filter @quiz/skillhubcore-admin test:isolated` | **PASS** (4 files, 94/94 tests, exit 0) |
| `@quiz/skillhubcore-admin` Route Boundaries | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **PASS** (80 handlers, 0 violations, exit 0) |
| `@quiz/skillup-web` Lint (0 warnings) | `pnpm --filter @quiz/skillup-web lint -- --max-warnings=0` | **PASS** (0 errors, 0 warnings, exit 0) |
| `@quiz/realtutorialhub-web` Lint (0 warnings) | `pnpm --filter @quiz/realtutorialhub-web lint -- --max-warnings=0` | **PASS** (0 errors, 0 warnings, exit 0) |
| `@quiz/skillhubcore-admin` Lint (0 warnings) | `pnpm --filter @quiz/skillhubcore-admin lint -- --max-warnings=0` | **PASS** (0 errors, 0 warnings, exit 0) |
| `@quiz/skillup-web` Type-Check | `pnpm --filter @quiz/skillup-web type-check` | **PASS** (exit 0) |
| `@quiz/realtutorialhub-web` Type-Check | `pnpm --filter @quiz/realtutorialhub-web type-check` | **PASS** (exit 0) |
| `@quiz/skillhubcore-admin` Type-Check | `pnpm --filter @quiz/skillhubcore-admin type-check` | **PASS** (exit 0) |
| `@quiz/skillup-web` Production Build | `pnpm --filter @quiz/skillup-web build` | **PASS** (exit 0) |
| `@quiz/realtutorialhub-web` Production Build | `pnpm --filter @quiz/realtutorialhub-web build` | **PASS** (exit 0) |
| `@quiz/skillhubcore-admin` Production Build | `pnpm --filter @quiz/skillhubcore-admin build` | **PASS** (exit 0) |
| Playwright Browser Security Matrix (`SUIA` + `RTH`) | `node node_modules/@playwright/test/cli.js test tests/e2e/learner-login-security.spec.ts --project=chromium --workers=1 --retries=0 --reporter=line` | **PASS** (17/17 tests, exit 0) |

---

## 9. Screenshot & Evidence Artifact Paths
- `.evidence/screenshots/v5-20261112/suia-login-no-js.png`
- `.evidence/screenshots/v5-20261112/suia-login-before-hydration.png`
- `.evidence/screenshots/v5-20261112/suia-safe-login-error.png`
- `.evidence/screenshots/v5-20261112/rth-login-no-js.png`
- `.evidence/screenshots/v5-20261112/rth-login-before-hydration.png`
- `.evidence/screenshots/v5-20261112/rth-safe-login-error.png`
- `.evidence/closure-20261112/V5_SHARED_LOGIN_TENANT_LEGACY_DELTA.md`

