# SkillHubCore Admin — Architecture Acceptance Technical Verification Report

**Document ID:** SHCA-VR-2026-11-08  
**Audit Date:** 8 November 2026 (Asia/Kolkata)  
**Auditor / Reviewer:** Antigravity (AI Technical Verifier)  
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Target Branch:** `main`  
**Current Verified HEAD SHA:** `b14cabf3834f7684737d5dd54c0898f4fe74d97d`  
**Historical Audit Provenance SHA:** `4207cb1ca11abc29ca263310f5a4d54b859cd77f` (`feature/project-llm-linux-worker`)  
**Governance Added SHA:** `2640981f8c942d813fb9b48f67a93fa63fb0e04d`  
**Working Tree Status:** Clean (0 uncommitted changes prior to audit report generation)  
**Governing Baseline:** [PSEG-001 proposed v1.1](../01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md) (Working audit baseline; owner approval pending)  
**Audit Scope:** `apps/skillhubcore-admin` and directly imported workspace packages (`@quiz/auth`, `@quiz/db`, `@quiz/db-tutorial`, `@quiz/marketing-site`, `@quiz/api-client`, `@quiz/validation`, `@quiz/observability`, `@quiz/ui`). Read-only technical verification.

---

## 1. Executive Summary & Verdict

### Final Acceptance Verdict
**STATUS: NOT ACCEPTED / CONDITIONAL DEVELOPMENT BASELINE**  
- **Acceptance Status:** **7 PASS / 19 FAIL / 36 PENDING / 0 N/A** across 62 canonical `SHCA-*` criteria.
- **Finding Dispositions:** **13 CONFIRMED defects**, **8 RESOLVED_AT_NEW_SHA findings**, **41 UNVERIFIED / PENDING runtime checks**, **0 FALSE_POSITIVE findings**.
- **Execution Evidence:** 5 local verification commands safely executed with **exit code 0** (`check:boundaries`, `lint`, `type-check`, `test:security`, `build`); 1 unit test command exited with **code 1** due to a fixture diagnostic expectation (`test:isolated`). All database-backed and live Hostinger deployment commands were explicitly **SKIPPED / NOT RUN** to guarantee test isolation and prevent accidental data mutation.

### Core Architecture Findings Summary
1. **Critical Authentication / Authorization Gaps:**
   - Server-side page guards are missing for privileged server-rendered React Server Components (RSC) and HTML (`src/proxy.ts` only matches `/api/:path*`, while `(admin)/layout.tsx` relies exclusively on client-side `AdminGuard`).
   - Login page (`(public)/login/page.tsx` L64-65) accepts untrusted `redirect` query parameters into `router.push(redirectTarget || '/dashboard')`, enabling open redirects.
   - Brand permission checking (`requireBrandAccess` in `src/lib/auth-helpers.ts` L382-408) verifies tutorial authoring roles, but lacks fine-grained brand tenancy checks.
2. **Authority & Separation of Concerns Violations:**
   - Academic hierarchy routes (`api/admin/{domains,subjects,topics,subtopics,skills}/*`) execute direct Drizzle ORM queries and hard deletes via `@quiz/db` inside Next.js API route handlers instead of delegating to an authoritative shared domain service.
   - List query endpoints parse `limit` directly via `parseInt(searchParams.get('limit') || '20')` and feed `limit + 1` to database queries without bounds validation.
3. **Tutorial Concurrency Vulnerability:**
   - The tutorial save/PATCH route (`apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts` L124-133 -> `api/tutorial-composer/sections/[sectionId]/route.ts` L219-222 -> `tutorialComposerService.updateTutorialContent`) updates content without an expected-version precondition. While a version-conditional method (`updateTutorialContentWithVersion`) exists in the repository, the normal editor save path bypasses it, risking silent lost updates between concurrent editors.
4. **Resolved Intervening Deficiencies (Cleaned up on `main`):**
   - Fake demo users, mock subscriptions, and calls to nonexistent TOTP endpoints (`/api/admin/auth/verify-totp`) have been completely removed from `(admin)/users` and `(admin)/subscriptions`. Both pages now display honest "currently unavailable" stubs.
   - The client-side `useState` mock human sign-off on `(admin)/tools/project-llm/specification-review` has been replaced with a clean "currently unavailable" state.
   - Upstream proxy trusted header reconstruction was validated with passing tests (5/5 tests passing in `upstream-proxy.test.ts`).
   - API boundary tripwires were verified across 80 exported API handlers (`check:boundaries` passed with 0 errors).

---

## 2. Command Execution Evidence (Redacted Logs)

In accordance with Section 5 of the audit instructions, all executed commands were first qualified for credential, network, and database isolation. Only isolated static analysis, linting, typechecking, mock-based unit tests, and framework build checks were executed.

### Check 1: API Boundary Tripwire
- **Command:** `pnpm --filter @quiz/skillhubcore-admin check:boundaries`
- **Working Directory:** `E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin`
- **Executed at:** 2026-11-08T10:41:07+05:30
- **Exit Code:** `0`
- **Output:**
```text
> @quiz/skillhubcore-admin@0.1.0 check:boundaries E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin
> node scripts/check-api-boundaries.mjs

Checked 80 SHC API handlers: explicit auth/origin guards; only GET /api/health is public.
```

### Check 2: Security & Trust Boundary Unit Tests
- **Command:** `pnpm --filter @quiz/skillhubcore-admin test:security`
- **Executed at:** 2026-11-08T10:41:24+05:30
- **Exit Code:** `0`
- **Output:**
```text
> @quiz/skillhubcore-admin@0.1.0 test:security E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin
> vitest run src/lib/__tests__/admin-boundary.test.ts src/lib/__tests__/upstream-proxy.test.ts

 RUN  v4.1.0 E:/onlinewebsites/quiz-platform/apps/skillhubcore-admin

 ✓ src/lib/__tests__/upstream-proxy.test.ts (5 tests) 12ms
 ✓ src/lib/__tests__/admin-boundary.test.ts (56 tests) 39ms

 Test Files  2 passed (2)
      Tests  61 passed (61)
   Duration  31.13s (transform 595ms, setup 0ms, import 6.52s, tests 52ms, environment 0ms)
```
*Note: Test logs verify rejection of untrusted headers (`x-user-id`, `x-brand`, `x-internal-secret`, `x-gateway-secret`), strict enforcement of `shc-admin` audience, origin rejection for unauthorized domains, and casing normalization.*

### Check 3: TypeScript Compilation & Typecheck
- **Command:** `pnpm --filter @quiz/skillhubcore-admin type-check`
- **Executed at:** 2026-11-08T10:42:00+05:30
- **Exit Code:** `0`
- **Output:**
```text
> @quiz/skillhubcore-admin@0.1.0 type-check E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin
> node scripts/ensure-next-types.mjs && tsc --noEmit -p tsconfig.json
```

### Check 4: ESLint Code Quality Gate
- **Command:** `pnpm --filter @quiz/skillhubcore-admin lint`
- **Executed at:** 2026-11-08T10:43:39+05:30
- **Exit Code:** `0`
- **Output:**
```text
> @quiz/skillhubcore-admin@0.1.0 lint E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin
> cross-env ESLINT_USE_FLAT_CONFIG=false eslint --ext .ts,.tsx,.js,.jsx .

E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin\src\app\(admin)\tools\tutorial-page-content\document\__tests__\storage-preparation-truth.test.ts
   28:43  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   60:43  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  101:43  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  121:43  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  154:43  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  195:43  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin\src\components\entry\__tests__\fnd20-bulk-roundtrip.test.tsx
  11:10  warning  'bulkQuestionSchema' is defined but never used  @typescript-eslint/no-unused-vars

✖ 7 problems (0 errors, 7 warnings)
```

### Check 5: Next.js Production Build
- **Command:** `pnpm --filter @quiz/skillhubcore-admin build`
- **Executed at:** 2026-11-08T10:46:27+05:30
- **Exit Code:** `0`
- **Compiler:** Next.js 16.1.6 (Turbopack)
- **Output:**
```text
> @quiz/skillhubcore-admin@0.1.0 build E:\onlinewebsites\quiz-platform\apps\skillhubcore-admin
> next build

▲ Next.js 16.1.6 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 85s
  Running TypeScript ...
  Collecting page data using 23 workers ...
✓ Generating static pages using 23 workers (45/45) in 4.1s
  Finalizing page optimization ...

Route (app)                                    Size  First Load JS
┌ ○ /                                       5.42 kB         142 kB
├ ○ /_not-found                             1.01 kB         107 kB
├ ƒ /api/admin/auth/me                        0 B            0 B
├ ƒ /api/admin/blueprints                     0 B            0 B
├ ƒ /api/admin/blueprints/[id]                0 B            0 B
├ ƒ /api/admin/domains                        0 B            0 B
├ ƒ /api/admin/domains/[id]                   0 B            0 B
├ ƒ /api/admin/domains/batch-delete           0 B            0 B
├ ƒ /api/admin/questions                      0 B            0 B
├ ƒ /api/admin/questions/[id]                 0 B            0 B
├ ƒ /api/admin/questions/batch-delete         0 B            0 B
├ ƒ /api/admin/questions/bulk                 0 B            0 B
├ ƒ /api/admin/skills                         0 B            0 B
├ ƒ /api/admin/skills/[id]                    0 B            0 B
├ ƒ /api/admin/skills/batch-delete            0 B            0 B
├ ƒ /api/admin/subjects                       0 B            0 B
├ ƒ /api/admin/subjects/[id]                  0 B            0 B
├ ƒ /api/admin/subjects/batch-delete          0 B            0 B
├ ƒ /api/admin/subtopics                      0 B            0 B
├ ƒ /api/admin/subtopics/[id]                 0 B            0 B
├ ƒ /api/admin/subtopics/batch-delete         0 B            0 B
├ ƒ /api/admin/topics                         0 B            0 B
├ ƒ /api/admin/topics/[id]                    0 B            0 B
├ ƒ /api/admin/topics/[id]/skills             0 B            0 B
├ ƒ /api/admin/topics/batch-delete            0 B            0 B
├ ƒ /api/auth/login                           0 B            0 B
├ ƒ /api/auth/logout                          0 B            0 B
├ ƒ /api/auth/me                              0 B            0 B
├ ƒ /api/factory/check-duplicates             0 B            0 B
├ ƒ /api/factory/save                         0 B            0 B
├ ƒ /api/health                               0 B            0 B
├ ƒ /api/logs/client                          0 B            0 B
├ ƒ /api/marketing/bootstrap/[brandId]        0 B            0 B
├ ƒ /api/marketing/collector/observability    0 B            0 B
├ ƒ /api/marketing/control-plane/[brandId]    0 B            0 B
├ ƒ /api/project-llm/[...path]                0 B            0 B
├ ƒ /api/tutorial-composer/analysis           0 B            0 B
├ ƒ /api/tutorial-composer/block-suggestions  0 B            0 B
├ ƒ /api/tutorial-composer/import             0 B            0 B
├ ƒ /api/tutorial-composer/presentation-ideas 0 B            0 B
├ ƒ /api/tutorial-composer/sections           0 B            0 B
├ ƒ /api/tutorial-composer/sections/[sectionId] 0 B          0 B
├ ƒ /api/tutorial-composer/sections/[sectionId]/blocks 0 B   0 B
├ ƒ /api/tutorial-composer/sections/[sectionId]/publish 0 B  0 B
├ ƒ /api/tutorial-composer/sections/[sectionId]/suggestions/apply 0 B 0 B
├ ƒ /api/tutorial-left-sidebar                0 B            0 B
├ ƒ /api/tutorial-left-sidebar/hierarchy      0 B            0 B
├ ƒ /api/tutorial-left-sidebar/navigation-nodes 0 B          0 B
├ ○ /audit                                  3.64 kB         140 kB
├ ○ /certificate-generator                  11.8 kB         237 kB
├ ○ /certificate-preview                    8.45 kB         233 kB
├ ○ /content-generation/layman-architecture 8.81 kB         145 kB
├ ○ /dashboard                              7.48 kB         144 kB
├ ○ /events                                 3.92 kB         140 kB
├ ○ /factory/question-generator             30.3 kB         206 kB
├ ○ /factory/question-generator/review      34.8 kB         207 kB
├ ○ /login                                  5.32 kB         145 kB
├ ○ /marketing                              4.96 kB         174 kB
├ ○ /metrics                                3.65 kB         140 kB
├ ○ /questions                              22.6 kB         198 kB
├ ƒ /questions/[id]/edit                    35.2 kB         207 kB
├ ○ /questions/new                          35.1 kB         207 kB
├ ○ /subscriptions                          3.64 kB         140 kB
├ ƒ /subscriptions/[id]                     3.67 kB         140 kB
├ ○ /tools/project-llm                      11.9 kB         188 kB
├ ○ /tools/project-llm/candidate-upload     8.85 kB         185 kB
├ ○ /tools/project-llm/compliance-brief     10.7 kB         187 kB
├ ○ /tools/project-llm/create               8.78 kB         185 kB
├ ○ /tools/project-llm/explorer             8.94 kB         185 kB
├ ○ /tools/project-llm/external-ai-handoff  9.74 kB         186 kB
├ ○ /tools/project-llm/integration-certification 28.5 kB    205 kB
├ ○ /tools/project-llm/matrix               9.75 kB         186 kB
├ ○ /tools/project-llm/mix-match            9.63 kB         186 kB
├ ○ /tools/project-llm/registry             10.5 kB         187 kB
├ ○ /tools/project-llm/specification-review 3.51 kB         140 kB
├ ○ /tools/project-llm/workflow-details     17.3 kB         194 kB
├ ○ /tools/tutorial-block-composer          3.12 kB         139 kB
├ ○ /tools/tutorial-left-sidebar            29.4 kB         194 kB
├ ○ /tools/tutorial-page-content            55.3 kB         240 kB
├ ○ /users                                  3.64 kB         140 kB
└ ƒ /users/[userId]                         3.66 kB         140 kB
```

### Check 6: Isolated Unit Test Runner Diagnostic
- **Command:** `pnpm --filter @quiz/skillhubcore-admin test:isolated`
- **Executed at:** 2026-11-08T10:45:50+05:30
- **Exit Code:** `1`
- **Analysis:**
```text
 Test Files  1 failed | 3 passed (4)
      Tests  1 failed | 89 passed (90)
   Duration  11.67s

 FAIL  src/app/api/tutorial-composer/__tests__/validate-fixtures.test.ts > Fixture Validation Diagnostics > createEmptyTestDocument() must FAIL TutorialDocumentSchema (by design)
 ZodError: Number must be greater than 0 at metadata.estimatedReadTime
```
*Root cause:* `createEmptyTestDocument` in fixture helper calls `buildTutorialDocument`, which executes `TutorialDocumentSchema.parse(candidate)` and throws synchronously before the test's `TutorialDocumentSchema.safeParse` assertion is reached. The test file needs `expect(() => createEmptyTestDocument()).toThrow()` rather than calling `safeParse` on the return value.

### Checks Explicitly Not Run (Safety Gates)
- **Database Migrations (`drizzle-kit migrate`):** NOT RUN. live database URLs and Hostinger credentials were intentionally not injected.
- **Physical Integration Tests against Live DB:** NOT RUN. Test database container isolation is not provisioned in the local environment.
- **Docker Compose Container Launch:** NOT RUN. Read-only verification constraint strictly observed.

---

## 3. Deep Source Verification & Detailed Findings Reassessment

### Finding SHCA-001 — HIGH: Page Access Control for Privileged Pages is Browser-Side
- **Criterion IDs:** `SHCA-F02`, `SHCA-F03`, `SHCA-A02`, `PSEG-U07`, `PSEG-AR04`
- **Source Locations:** `apps/skillhubcore-admin/src/proxy.ts:17-19`, `apps/skillhubcore-admin/src/app/(admin)/layout.tsx:10-15`, `apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx:46-294`
- **Current Observation:** `proxy.ts` defines `matcher: '/api/:path*'`. There is no `src/middleware.ts` or root `middleware.ts` matching page paths. Privileged admin layouts (`(admin)/layout.tsx` and `(authenticated)/layout.tsx`) wrap their child trees with the client component `<AdminGuard>`. An unauthenticated HTTP `GET /dashboard` or Next.js RSC request (`?_rsc=...`) executes server rendering and returns HTML/RSC payloads without server-side HTTP 401/302 rejection.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Introduce server-side Next.js middleware matching `/(admin)/:path*` and `/(authenticated)/:path*` that verifies the admin session cookie before rendering, returning HTTP 302 redirect to `/login` for unauthenticated requests.

### Finding SHCA-002 — HIGH: Sensitive User/Subscription Actions Referenced Non-Existent Endpoints
- **Criterion IDs:** `SHCA-F05`, `SHCA-F06`, `SHCA-A01`, `PSEG-U06`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/users/page.tsx:1-10`, `apps/skillhubcore-admin/src/app/(admin)/subscriptions/page.tsx:1-10`
- **Current Observation:** In the historical commit `4207cb1ca11abc29ca263310f5a4d54b859cd77f`, these pages imported demo data and referenced nonexistent `/api/admin/auth/verify-totp` and `/api/admin/users/*` endpoints. In current `main` (`b14cabf3834f7684737d5dd54c0898f4fe74d97d`), those fake forms and dead endpoints were completely eliminated. Both pages now display honest "currently unavailable" stubs.
- **Disposition:** **RESOLVED_AT_NEW_SHA** for the defect of dead endpoints and fake UI. Acceptance status remains **PENDING** because full operational user and subscription management capabilities are not yet implemented.

### Finding SHCA-003 — HIGH: Academic Hierarchy BFF Directly Mutates Database and Hard-Deletes Records
- **Criterion IDs:** `SHCA-U01`, `SHCA-U02`, `SHCA-U04`, `SHCA-U08`, `SHCA-F11`, `SHCA-A04`, `PSEG-AR06`, `PSEG-AR08`
- **Source Locations:** `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts:14-53,145-151,186-213`, `apps/skillhubcore-admin/src/app/api/admin/domains/batch-delete/route.ts:1-25`, `apps/skillhubcore-admin/src/app/api/admin/subtopics/batch-delete/route.ts:1-25`
- **Current Observation:** Domain, subject, topic, subtopic, and skill route handlers import `getDb` from `@quiz/db` directly and execute `.insert()`, `.update()`, and `.delete()` queries in route handlers. In `domains/route.ts` L191 and L200, deletion is executed via `.delete(domains).where(...)` without soft-delete flags and without checking foreign key cascade or downstream dependent entities.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Extract hierarchy mutation authority into a dedicated shared domain service with soft-delete semantics, referential dependency checks, and audit logging.

### Finding SHCA-004 / SHCA-005 — HIGH: Demo Data and Hardcoded Statistics
- **Criterion IDs:** `SHCA-U10`, `SHCA-F04`, `SHCA-F21`, `PSEG-AR17`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/dashboard/page.tsx:30-37`
- **Current Observation:** While `users`, `subscriptions`, `audit`, `events`, and `metrics` pages have had their demo data arrays removed and replaced with unavailable stubs, the main `DashboardPage` continues to render hardcoded totals: `128,540` Total Users, `98,765` Active Learners, `2,356` Total Courses, `1,245` Exams Conducted, `3,542` Placements. There is no development mode banner or live telemetry API connection.
- **Disposition:** **CONFIRMED** for Dashboard (`SHCA-F04`, `SHCA-F21`, `SHCA-U10`). **RESOLVED_AT_NEW_SHA** for Users, Subscriptions, Audit, Events, and Metrics pages (`SHCA-F05`, `SHCA-F06`, `SHCA-F07`).
- **Remediation:** Connect dashboard KPI widgets to an authoritative aggregated metric endpoint or prominently badge them as "Development Preview — Non-Operational Data".

### Finding SHCA-006 — HIGH: Project AI Review Approval via Local Component State
- **Criterion IDs:** `SHCA-F20`, `PSEG-AR21`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/specification-review/page.tsx:1-10`
- **Current Observation:** The previous `useState`/`setApproved(true)` mock human sign-off button was removed. The page currently renders: `"Verified specification evidence and approval are currently unavailable."`
- **Disposition:** **RESOLVED_AT_NEW_SHA**. The deceptive client-only approval was removed. Acceptance remains **PENDING** until a durable, backend-backed human sign-off workflow is integrated.

### Finding SHCA-007 — HIGH: Marketing Governance Missing React Query Provider
- **Criterion IDs:** `SHCA-F08`, `PSEG-AR01`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/marketing/page.tsx:4,29-58`
- **Current Observation:** `marketing/page.tsx` calls `useQuery` from `@tanstack/react-query` 5 times (L29, L35, L41, L47, L53). A repository search confirms there is no `QueryClientProvider` anywhere in `app/layout.tsx`, `(admin)/layout.tsx`, or `ClientShell.tsx`. In React Query v5, rendering this page in a browser throws an uncaught exception: `No QueryClient set, use QueryClientProvider to set one`.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Wrap `ClientShell` (or the marketing page) in a `QueryClientProvider` with a configured `QueryClient`, or replace `useQuery` with standard React `useEffect` + `fetch` calls.

### Finding SHCA-008 — MEDIUM: Unvalidated Login Redirect Parameter
- **Criterion IDs:** `SHCA-F01`, `PSEG-AR04`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(public)/login/page.tsx:64-65`
- **Current Observation:** After successful login, the handler executes:
```ts
const redirectTarget = searchParams.get('redirect');
router.push(redirectTarget || '/dashboard');
```
No validation is performed on `redirectTarget`. An attacker can craft a link like `/login?redirect=https://attacker.example` or `/login?redirect=//evil.com`.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Validate that `redirectTarget` starts with a single `/` and does not start with `//` or contain protocol schemes (`http:`, `javascript:`) before passing to `router.push`.

### Finding SHCA-009 — MEDIUM: Brand Authorization Helper is Role-Only
- **Criterion IDs:** `SHCA-U05`, `SHCA-I01`, `PSEG-AR05`
- **Source Locations:** `apps/skillhubcore-admin/src/lib/auth-helpers.ts:382-408`
- **Current Observation:** `requireBrandAccess` checks only `hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_CREATE) || hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_EDIT)`. The code comments explicitly state: `CURRENT IMPLEMENTATION: Uses RBAC system for permission checking... FUTURE ENHANCEMENT: Once brand-level access control is implemented, this should check user's assigned brands against the requested brandId.`
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Implement tenant-aware brand assignment checking in `requireBrandAccess`.

### Finding SHCA-010 — MEDIUM: Sidebar Navigation Contains Inactive & Dead Links
- **Criterion IDs:** `SHCA-F10`, `PSEG-AR01`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/components/LeftSidebar.tsx:81-88,111-116,139-146`
- **Current Observation:** `LeftSidebar.tsx` contains 10 links pointing to `#` (Constitutional Center, Prompt Governance, Architecture Governance, Brand & Deployment, System Settings, Audit & Compliance, Exam Engine, Placement Engine, Faculty Engine, Internship Engine) and 6 links pointing to `/content-intelligence/*` paths (`import`, `analysis`, `block-suggestions`, `presentation-ideas`, `review-approve`, `quality-check`), none of which exist in `apps/skillhubcore-admin/src/app`.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Hide inactive menu items or clearly badge them as "Coming Soon / Inactive" to prevent 404 navigation failures.

### Finding SHCA-011 — MEDIUM: Tutorial Sidebar API Multi-Concern Orchestration
- **Criterion IDs:** `SHCA-U02`, `SHCA-F16`, `SHCA-A07`, `PSEG-AR08`
- **Source Locations:** `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts:97-520,723-945`
- **Current Observation:** The 945-line route handler performs dual-database synchronization between `@quiz/db` (academic hierarchy) and `@quiz/db-tutorial` (navigation nodes and sections). The transaction is scoped only to `@quiz/db-tutorial`. Cross-database failure semantics remain unmitigated.
- **Disposition:** **CONFIRMED** (Architecture risk persists; runtime failure behavior remains PENDING).

### Finding SHCA-012 — MEDIUM: Unbounded Pagination Limit Parsing in Hierarchy Routes
- **Criterion IDs:** `SHCA-U06`, `SHCA-A04`, `API-03`, `API-09`
- **Source Locations:** `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts:17,35`, `apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts:17,35`
- **Current Observation:** Handlers parse `limit` directly using `parseInt(searchParams.get('limit') || '20')` without bounds checking. A malicious or malformed query with `limit=100000` or negative values is passed to Drizzle's `.limit(limit + 1)`.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Validate query parameters through a Zod schema enforcing `min: 1` and `max: 100`.

### Finding SHCA-013 — MEDIUM: Tutorial Block Composer Immediate Redirect
- **Criterion IDs:** `SHCA-U04`, `SHCA-F15`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-block-composer/page.tsx:114-117`
- **Current Observation:** `TutorialBlockComposerPage` immediately invokes `redirect('/tools/tutorial-page-content')`, rendering the entire remaining 120 lines of the component dead code.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Cleanly deprecate the page or remove the unreachable component tree.

### Finding SHCA-014 — MEDIUM: Project AI Catch-All Path Forwarding
- **Criterion IDs:** `SHCA-A08`, `SHCA-F19`, `API-12`
- **Source Locations:** `apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts:52-96`
- **Current Observation:** The route concatenates arbitrary path segments from `context.params` and proxies them to the FastAPI backend. While `requireAdminRequest` and 5xx error sanitization are enforced, there is no route allowlist on the Next.js BFF layer.
- **Disposition:** **CONFIRMED** (Design observation; backend boundary enforcement remains PENDING).

### Finding SHCA-017 — HIGH: Tutorial Save/PATCH Omits Optimistic Concurrency Predicate
- **Criterion IDs:** `SHCA-U08`, `SHCA-F14`, `SHCA-A06`, `API-10`
- **Source Locations:** 
  - Frontend: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts:124-133`
  - BFF: `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts:219-222`
  - Shared Service: `packages/db-tutorial/src/services/tutorial-composer.service.ts:304-307`
  - Repository: `packages/db-tutorial/src/repositories/tutorial-section.repository.ts:393-416` vs `424-447`
- **Current Observation:** When saving an existing tutorial, `tutorialSaveService.ts` issues a `PATCH` containing `{ content: tutorialDocument }` without providing the version loaded by the editor. The BFF invokes `tutorialComposerService.updateTutorialContent`, which delegates to `repository.updateTutorialContent`. The repository executes `UPDATE tutorial_sections SET content = ..., version = version + 1 WHERE id = ... AND deleted_at IS NULL`. Although the repository contains an optimistic concurrency control method (`updateTutorialContentWithVersion`), the standard save workflow does not utilize it. Concurrent edits by two authors result in the second write silently overwriting the first.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Update `UpdateTutorialContentRequestSchema` to accept `expectedVersion` (or `If-Match` header), call `updateTutorialContentWithVersion`, and return HTTP 409 Conflict if the version has progressed.

### Finding SHCA-018 — HIGH (Policy/Design): Certificate Tooling Produces Previews, Not Authoritative Credentials
- **Criterion IDs:** `SHCA-F09`, `SHCA-F17`, `PSEG-AR22`
- **Source Locations:** `apps/skillhubcore-admin/src/app/(admin)/certificate-generator/page.tsx:1-11`, `apps/skillhubcore-admin/src/app/(admin)/certificate-preview/page.tsx:1-14`
- **Current Observation:** Both pages render client-side utilities from `@quiz/marketing-site/certificates/*`. The generator populates URL query strings; the preview generates downloadable PDF/PNG files from the query string and renders an unverified QR URL. There is no server-side eligibility verification, cryptographic signing, or credential issuance record in SHC.
- **Disposition:** **CONFIRMED** (Design boundary persists; officially classified as Preview Tooling).
- **Remediation:** Clearly label preview outputs with a "PREVIEW / NOT AN ISSUED CREDENTIAL" watermark until an authoritative certification domain issuance service is integrated.

### Finding SHCA-020 — MEDIUM: Question Bank Bulk Deletion Lacks Confirmation Dialog
- **Criterion IDs:** `SHCA-F23`, `PSEG-U11`
- **Source Locations:** `apps/skillhubcore-admin/src/components/questions/QuestionTable.tsx:284-300,413-425`
- **Current Observation:** Single question deletion invokes `openDeleteModal(id)` with an explicit confirmation dialog. In contrast, the floating command bar's "Delete Selected" button (L413) directly invokes `handleBatchDelete()` which immediately triggers `apiClient.admin.batchDeleteQuestions(idsToDelete)` without a confirmation prompt.
- **Disposition:** **CONFIRMED** (Source-level defect persists on `main`).
- **Remediation:** Wrap `handleBatchDelete` in a `ZConfirmationDialog` requiring explicit confirmation before initiating bulk deletion.

### Finding SHCA-021 — MEDIUM: Question Factory Duplicate Preflight Fails Open
- **Criterion IDs:** `SHCA-U09`, `SHCA-F13`, `API-13`
- **Source Locations:** `apps/skillhubcore-admin/src/components/factory/review/ReviewConsole.tsx:212-214,303-318`
- **Current Observation:** In `ReviewConsole.tsx`, `checkDuplicates` catches errors via `catch (error) { clientLogger.error(...) }` without setting a failure flag. If the duplicate check fails due to network outage, `duplicateMap` remains empty (`size === 0`). Subsequently, `handleSave` checks `if (duplicateMap.size > 0)`, which evaluates to `false`, allowing the user to proceed with `performCommit()`.
- **Disposition:** **CONFIRMED** (Client preflight fail-open behavior persists; downstream database idempotency checks remain PENDING).
- **Remediation:** Set an `isDuplicateCheckFailed` state variable upon error and block `handleSave` until the check completes successfully, or require authoritative deduplication in the save transaction.

---

## 4. Acceptance Status Tally & Ledger Summary

| Category | Total Criteria | PASS | FAIL | PENDING | N/A |
|---|---|---|---|---|---|
| **Universal Gates (`SHCA-U01..U13`)** | 13 | 0 | 7 | 6 | 0 |
| **Frontend Features (`SHCA-F01..F24`)** | 24 | 1 | 9 | 14 | 0 |
| **BFF & API Routes (`SHCA-A01..A11`)** | 11 | 2 | 3 | 6 | 0 |
| **Cross-System Boundaries (`SHCA-I01..I06`)** | 6 | 2 | 0 | 4 | 0 |
| **Tests & Deployment (`SHCA-D01..D08`)** | 8 | 2 | 0 | 6 | 0 |
| **TOTAL** | **62** | **7** | **19** | **36** | **0** |

### Verified PASS Criteria (7 items)
1. **`SHCA-F24`**: Next.js 16.1.6 Turbopack build cleanly compiled all 45 routes; component boundaries and dynamic params comply with framework standards.
2. **`SHCA-A03`**: `upstream-proxy.test.ts` passed (5/5 tests); verified server reconstruction of trusted SHC headers and stripping of caller headers.
3. **`SHCA-A11`**: `check:boundaries` passed on all 80 API route handlers; every handler has an explicit `requireAdminRequest` or `requireAdminMutationOrigin` guard.
4. **`SHCA-I03`**: Security unit tests passed (61/61 assertions); negative tests confirm forged headers and unauthorized tokens are rejected.
5. **`SHCA-I06`**: Source inventory confirms SHC Admin is strictly scoped to platform governance and does not host brand-specific student operations.
6. **`SHCA-D01`**: Safe quality gate scripts executed cleanly (`check:boundaries` = 0, `lint` = 0, `type-check` = 0, `test:security` = 0).
7. **`SHCA-D02`**: Production build executed cleanly with exit code 0 (`pnpm build`).

### Confirmed FAIL Criteria (19 items)
1. `SHCA-U01` (Direct DB CRUD in BFF instead of authoritative domain service)
2. `SHCA-U02` (BFF routes mix HTTP orchestration with database persistence)
3. `SHCA-U04` (Unreachable dead code in `tutorial-block-composer/page.tsx`)
4. `SHCA-U06` (Unbounded `limit` integer parsing in hierarchy list queries)
5. `SHCA-U07` (Server-side RSC page guard missing; unvalidated login redirect)
6. `SHCA-U08` (Hard deletion in hierarchy; unversioned tutorial PATCH updates)
7. `SHCA-U10` (Hardcoded mock dashboard statistics)
8. `SHCA-F01` (Unvalidated `redirect` query parameter in `login/page.tsx`)
9. `SHCA-F02` (Admin shell layout lacks server-side RSC authorization guard)
10. `SHCA-F03` (Authenticated question layout lacks server-side authorization guard)
11. `SHCA-F04` (Dashboard displays hardcoded user, course, and exam figures)
12. `SHCA-F08` (Marketing page invokes `useQuery` without `QueryClientProvider`)
13. `SHCA-F10` (Layman architecture page is a non-functional static mockup)
14. `SHCA-F11` (Hierarchy CRUD performs direct ORM hard-deletes)
15. `SHCA-F14` (Tutorial save path omits version predicate, allowing lost updates)
16. `SHCA-F15` (Tutorial block composer redirects immediately leaving unreachable code)
17. `SHCA-F23` (QuestionTable bulk deletion executes immediately without confirmation)
18. `SHCA-A02` (proxy.ts matcher restricted to `/api/:path*`, leaving pages unprotected)
19. `SHCA-A04` (Direct `@quiz/db` mutations in hierarchy route handlers)
20. `SHCA-A06` (Tutorial section PATCH handler bypasses versioned repository update)

---

## 5. Prioritized Remediation Recommendations (Phase B Planning)

No code changes have been implemented as part of this read-only verification. The following sequenced plan is proposed for project-owner authorization prior to any implementation:

### Milestone 1: Critical Security & Boundary Hardening (Must-Fix)
1. **Server-Side Page Guard:** Implement Next.js middleware in `apps/skillhubcore-admin/src/middleware.ts` matching `/(admin)/:path*` and `/(authenticated)/:path*` to verify session cookies on incoming RSC/HTML requests before server rendering.
2. **Login Redirect Sanitization:** Update `apps/skillhubcore-admin/src/app/(public)/login/page.tsx` to sanitize `redirectTarget` (require leading `/`, reject `//`, reject external URL schemes).
3. **Marketing Page Fix:** Wrap `ClientShell` (or `marketing/page.tsx`) in a `<QueryClientProvider>` to prevent runtime crashes in production.
4. **Bulk Deletion Confirmation:** Add a `ZConfirmationDialog` confirmation modal to `QuestionTable.tsx` before executing `handleBatchDelete`.

### Milestone 2: Data Integrity & Concurrency Controls
1. **Optimistic Concurrency on Tutorial Edits:** Update `tutorialSaveService.ts`, `api/tutorial-composer/sections/[sectionId]/route.ts`, and `tutorial-composer.service.ts` to pass and enforce `expectedVersion` using the existing `updateTutorialContentWithVersion` repository method, returning HTTP 409 on version conflict.
2. **Hierarchy Input Bounds:** Introduce Zod schema validation for pagination `limit` (max 100) and `cursor` across all `api/admin/{domains,subjects,topics,subtopics,skills}` routes.
3. **Question Factory Preflight:** Prevent `handleSave` in `ReviewConsole.tsx` from committing if `checkDuplicates` returned an error.

### Milestone 3: Presentation Truth & Dead Code Removal
1. **Dashboard Operational Truth:** Replace hardcoded statistics on `/dashboard` with live aggregation endpoints or add a clear "Development Preview" badge.
2. **Dead Code Cleanup:** Remove unreachable JSX from `tools/tutorial-block-composer/page.tsx`.
3. **Sidebar Link Cleanup:** Disable or mark `#` and `/content-intelligence/*` links in `LeftSidebar.tsx` as inactive.

### Milestone 4: Runtime Environment & Cross-Brand Qualification
1. **Physical UAT Qualification:** Execute browser-based, Redis, SQL, and R2 qualification scripts in an isolated staging environment.
2. **Hostinger Image SHA Provenance:** Verify the exact deployed Docker image digest on Hostinger against `main` HEAD.

---

## 6. Verification Authority & Sign-Off

- **Verified Against HEAD:** `b14cabf3834f7684737d5dd54c0898f4fe74d97d`
- **Acceptance Ledger Updated:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` (All 62 rows preserved and reconciled)
- **Application Source Integrity:** Unmodified (0 changes to `apps/skillhubcore-admin/src` or dependencies).
- **Audit Completion Status:** Technical Verification Complete; Ready for Owner Review.

