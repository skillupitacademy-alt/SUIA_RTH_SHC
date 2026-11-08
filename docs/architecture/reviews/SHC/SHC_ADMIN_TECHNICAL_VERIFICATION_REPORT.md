# SkillHubCore Admin — Architecture Acceptance Technical Verification Report (Reconciled Baseline)

**Document ID:** SHCA-VR-2026-11-08-REV2\
**Reconciliation Date:** 8 November 2026 (Asia/Kolkata)\
**Auditor / Reviewer:** Antigravity (AI Technical Verifier)\
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`\
**Target Branch:** `main`\
**Tested Application Revision:** `b14cabf3834f7684737d5dd54c0898f4fe74d97d`\
**Historical Audit Provenance SHA:** `4207cb1ca11abc29ca263310f5a4d54b859cd77f` (`feature/project-llm-linux-worker`)\
**Governance Added SHA:** `2640981f8c942d813fb9b48f67a93fa63fb0e04d`\
**Working Tree Status:** Clean (zero application source code modified)\
**Governing Baseline:** [PSEG-001 proposed v1.1](../01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md) (Working audit baseline; owner approval pending)\
**Authoritative Acceptance Ledger:** [10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv](10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv)\
**Audit Scope:** `apps/skillhubcore-admin` and directly imported workspace packages (`@quiz/auth`, `@quiz/db`, `@quiz/db-tutorial`, `@quiz/marketing-site`, `@quiz/api-client`, `@quiz/validation`, `@quiz/observability`, `@quiz/ui`). Read-only technical verification.

---

## 1. Executive Summary & Reconciled Verdict

### Reconciled Acceptance Verdict
**STATUS: NOT ACCEPTED / CONDITIONAL AUDITED BASELINE WITH UNRESOLVED FINDINGS**\
- **Acceptance Status:** **2 PASS / 21 FAIL / 39 PENDING / 0 N/A** across 62 canonical `SHCA-*` criteria.
- **62 Criterion-Row Dispositions (Authoritative Ledger Rows):**
  - **22 CONFIRMED** (21 FAIL criteria + 1 PENDING criterion `SHCA-F09`)
  - **6 RESOLVED_AT_NEW_SHA** (`SHCA-I06` [PASS], `SHCA-D02` [PASS], `SHCA-F05` [PENDING], `SHCA-F06` [PENDING], `SHCA-F07` [PENDING], `SHCA-F20` [PENDING])
  - **34 UNVERIFIED** (34 PENDING criteria including `SHCA-F24`)
  - **0 FALSE_POSITIVE**
- **Grouped Thematic Narrative Findings:**
  - **13 Confirmed Defect Narratives** (thematic architectural defect clusters SHCA-001 through SHCA-021)
  - **8 Intervening Resolution Narratives** (thematic improvements and stubs verified since historical baseline `4207cb1c`)
- **Execution Evidence:** 5 local verification commands safely executed with **exit code 0** (`check:boundaries`, `lint`, `type-check`, `test:security`, `build`); 1 unit test command exited with **code 1** due to a fixture diagnostic expectation (`test:isolated`: 89 passed, 1 failed). Physical database, migration, and live Hostinger deployment commands were explicitly **SKIPPED / NOT RUN** to guarantee test isolation and prevent data loss.

### Reconciled Criteria Tally

| Category | Total Criteria | PASS | FAIL | PENDING | N/A |
|---|---|---|---|---|---|
| **Universal Gates (`SHCA-U01..U13`)** | 13 | 0 | 7 | 6 | 0 |
| **Frontend Features (`SHCA-F01..F24`)** | 24 | 0 | 11 | 13 | 0 |
| **BFF & API Routes (`SHCA-A01..A11`)** | 11 | 0 | 3 | 8 | 0 |
| **Cross-System Boundaries (`SHCA-I01..I06`)** | 6 | 1 | 0 | 5 | 0 |
| **Tests & Deployment (`SHCA-D01..D08`)** | 8 | 1 | 0 | 7 | 0 |
| **TOTAL** | **62** | **2** | **21** | **39** | **0** |

---

## 2. Reassessment of Specific Acceptance Gates

Following architectural review of the initial verification pass, five gates are classified as PENDING to ensure that broad criteria are not marked PASS when integration, direct-origin, runtime authorization, or route boundary evidence remains incomplete:

1. **`SHCA-F24` (Framework routing & boundaries): Reassessed to PENDING**
   - *Requirement:* Every Next.js route: framework-correct `params`/`searchParams` and server/client boundaries; no inappropriate browser/server API usage.
   - *Assessment:* While Next.js 16.1.6 Turbopack cleanly compiled all 45 routes without type errors, build logs do not independently prove runtime `params`/`searchParams` handling or client/server boundary contracts across all routes. Specifically, `marketing/page.tsx` invoking `@tanstack/react-query` `useQuery` without a `<QueryClientProvider>` demonstrates an unverified client-side runtime boundary failure. Reassessed to **PENDING**.
2. **`SHCA-D01` (Lint, type-check, boundary, security scripts): Reassessed to PENDING**
   - *Requirement:* Run app-specific lint, type-check, unit/integration/security tests in safe isolated environment; record exact output.
   - *Assessment:* Individual commands passed (`check:boundaries` Exit 0 on 80 handlers, `lint` Exit 0 with 7 warnings, `type-check` Exit 0, `test:security` Exit 0 with 61/61 tests). However, `test:isolated` had 1 failed test (`validate-fixtures.test.ts`: 89 passed, 1 failed), and physical integration tests were not run. Broad criterion `SHCA-D01` remains **PENDING**.
3. **`SHCA-I03` (Forged header / gateway bypass defenses): Reassessed to PENDING**
   - *Requirement:* No direct origin, gateway, bearer/cookie or forged header request can bypass SHC permission or brand checks.
   - *Assessment:* Unit tests (`upstream-proxy.test.ts` and `admin-boundary.test.ts`) verify unit logic for header stripping and origin rejection under mock request conditions. However, mock-based unit tests do not prove resistance to real network gateway or direct-origin bypasses in an actual deployed network. Reassessed as **PENDING**.
4. **`SHCA-A03` (`lib/upstream-proxy.ts`): Reassessed to PENDING**
   - *Requirement:* Trusted service-to-service authentication; no cookie/header/secret leaks or header spoofing; appropriate timeout and response checks.
   - *Assessment:* Trusted header reconstruction is verified via mock unit test (5/5 tests passing in `upstream-proxy.test.ts`). However, live service-to-service authentication against the real backend, timeout behavior, and response error propagation are broader than the mock tests. Reassessed as **PENDING**.
5. **`SHCA-A11` (All remaining API route files): Reassessed to PENDING**
   - *Requirement:* Inspect all remaining API route files and record exact authorization/ownership evidence.
   - *Assessment:* The static AST script `check:boundaries` confirms that all 80 exported API handlers declare explicit auth guards. However, static code analysis does not independently establish correct runtime business permissions, brand scoping, or data ownership for every operation. Reassessed as **PENDING**.

### The 2 Verified PASS Criteria with Qualified Scope

1. **`SHCA-I06` (Segregation of brand-specific student operations): PASS**\
   *Scoped Evidence:* A complete structural source inventory of all 80 application files in `apps/skillhubcore-admin/src/app` (**34 pages and 46 API route files**) confirms that SHC Admin is strictly scoped to platform governance, academic hierarchy, questions, tutorial authoring, and platform tooling. No brand-specific student-administration screens, API operations, or indirect student writers (enquiries, admissions, enrollments, fee records, or tutor schedules) are hosted here.\
   *(Note: This structural 80-file scope audit is distinct from Check 1's 80-handler static security tripwire across exported HTTP method handlers).*
2. **`SHCA-D02` (Application build verification): PASS**\
   *Scoped Evidence:* `pnpm --filter @quiz/skillhubcore-admin build` completed successfully with exit code 0 in 85.3 seconds on Node.js v22.14.0 (Windows x64). Next.js 16.1.6 Turbopack compiled all 45 static and dynamic routes into `.next/server` and `.next/static` with zero TypeScript errors, verifying the SHC Admin application build and type contracts with workspace dependencies linked from source (`@quiz/{auth,db,db-tutorial,marketing-site,api-client,validation,observability,ui}`), without implying independent standalone builds of every dependency.

---

## 3. Command Execution Evidence (Redacted Logs)

All safe local quality and security checks were qualified and executed against tested revision `b14cabf3834f7684737d5dd54c0898f4fe74d97d`:

### Check 1: API Boundary Tripwire
- **Command:** `pnpm --filter @quiz/skillhubcore-admin check:boundaries`
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
- **Output Summary:** Compiled all 45 static and dynamic pages in 85.3s on Node.js v22.14.0; generated valid route manifests.

### Check 6: Isolated Unit Test Runner Diagnostic (Preserved Failure)
- **Command:** `pnpm --filter @quiz/skillhubcore-admin test:isolated`
- **Executed at:** 2026-11-08T10:45:50+05:30
- **Exit Code:** `1`
- **Tally:** **89 passed, 1 failed across 4 test files**
- **Failed Test:**
```text
 FAIL  src/app/api/tutorial-composer/__tests__/validate-fixtures.test.ts > Fixture Validation Diagnostics > createEmptyTestDocument() must FAIL TutorialDocumentSchema (by design)
 ZodError: Number must be greater than 0 at metadata.estimatedReadTime
```
*Diagnostic:* The fixture helper `createEmptyTestDocument` calls `buildTutorialDocument`, which executes `TutorialDocumentSchema.parse(candidate)` and throws synchronously before the test's `safeParse` assertion is reached. The test needs `expect(() => createEmptyTestDocument()).toThrow()`.

### Checks Explicitly Not Run (Safety Gates)
- **Database Migrations (`drizzle-kit migrate`):** NOT RUN. Live database URLs and Hostinger credentials were intentionally not injected.
- **Physical Integration Tests against Live DB:** NOT RUN. Test database container isolation is not provisioned in the local environment.
- **Docker Compose Container Launch:** NOT RUN. Read-only verification constraint strictly observed.

---

## 4. Reconciled Findings & Framework Corrections

### Next.js 16 Architectural Correction: `src/proxy.ts` vs `middleware.ts`
- **Framework Architecture:** In Next.js 16, `proxy.ts` is the active proxy contract; `middleware.ts` is deprecated. We do NOT recommend creating a second competing `middleware.ts` file.
- **Route-Group Matching:** Route groups `(admin)` and `(authenticated)` are filesystem organization conventions and do NOT appear in HTTP URL paths. Route matching in `src/proxy.ts` must target actual URL paths (e.g. `/dashboard`, `/questions`, `/tools/*`, `/users`, `/subscriptions`, `/marketing`).
- **Defense in Depth:** While `src/proxy.ts` can perform early edge checks, sensitive server-side data access must also enforce authorization close to the data source.
- **Distinguishing Source Gaps from Runtime Claims:** The fact that `src/proxy.ts` currently matches only `/api/:path*` is a **source-confirmed gap**. However, the report does NOT claim that an unauthenticated HTTP GET actually returned sensitive user PII; that remains an unexecuted HTTP test.

### Status of the 13 Confirmed Current Defect Narratives
1. **SHCA-001 / SHCA-A02 (Page-Level Proxy Coverage):** Source-confirmed gap; `src/proxy.ts` matcher restricted to `/api/:path*`, omitting page routes like `/dashboard`.
2. **SHCA-003 / SHCA-A04 (Hierarchy Direct DB CRUD & Hard-Deletes):** Source-confirmed; route handlers execute direct Drizzle queries and hard deletes via `@quiz/db` without cascade analysis.
3. **SHCA-005 / SHCA-F04 / SHCA-F21 (Hardcoded Dashboard Statistics):** Source-confirmed; `(admin)/dashboard/page.tsx:30-37` renders hardcoded statistics without live API integration or mock disclaimer.
4. **SHCA-007 / SHCA-F08 (Marketing Governance Missing Query Provider):** Source-confirmed; `marketing/page.tsx` calls `useQuery` 5 times without a `QueryClientProvider` in parent layout chain.
5. **SHCA-008 / SHCA-F01 (Unvalidated Login Redirect):** Source-confirmed; `(public)/login/page.tsx:64-65` forwards unvalidated `searchParams.get('redirect')` to `router.push`.
6. **SHCA-009 / SHCA-I01 (Role-Only Brand Access Guard):** Source-confirmed; `src/lib/auth-helpers.ts:382-408` checks authoring permissions but lacks fine-grained brand tenancy checks.
7. **SHCA-010 / SHCA-F02 / SHCA-F22 (Sidebar Inactive & Dead Links):** Source-confirmed; `LeftSidebar.tsx` contains 10 links pointing to `#` and 6 links pointing to nonexistent `/content-intelligence/*` routes. *(Note: `SHCA-F10` is the separate finding for the Layman Architecture mockup screen).*
8. **SHCA-012 / SHCA-U06 (Unbounded Limit Parsing):** Source-confirmed; `api/admin/domains/route.ts:17` and `subtopics/route.ts:17` parse `limit` via `parseInt` without max bounds.
9. **SHCA-013 / SHCA-F15 (Tutorial Block Composer Unreachable Code):** Source-confirmed; `tutorial-block-composer/page.tsx:114-117` immediately executes `redirect()`, rendering 120 lines of JSX unreachable.
10. **SHCA-017 / SHCA-F14 / SHCA-A06 (Unversioned Tutorial Edits):** Source-confirmed; `tutorialSaveService.ts:124-133` sends an unversioned `PATCH` to `/api/tutorial-composer/sections/[sectionId]`, bypassing the repository's `updateTutorialContentWithVersion` method.
11. **SHCA-018 / SHCA-F09 (Certificate Tooling Preview-Only):** Source-confirmed; `certificate-generator` and `certificate-preview` pages are browser-side utilities without backend issuance or verification.
12. **SHCA-020 / SHCA-F23 (Question Bank Bulk Deletion Without Confirmation):** Source-confirmed; `QuestionTable.tsx:413-425` executes `handleBatchDelete()` immediately without a confirmation dialog.
13. **SHCA-021 / SHCA-F13 (Question Factory Duplicate Preflight Fail-Open):** Source-confirmed; `ReviewConsole.tsx:212-214` catches duplicate preflight errors without setting a blocking flag.

### Status of the 8 Resolved Intervening Narratives (`RESOLVED_AT_NEW_SHA`)
- **SHCA-002 & SHCA-004 (User/Subscription Demo Data & Non-Existent TOTP Endpoints):** Replaced with honest "currently unavailable" stubs on `(admin)/users`, `(admin)/users/[userId]`, `(admin)/subscriptions`, `(admin)/subscriptions/[id]`, `(admin)/audit`, `(admin)/events`, and `(admin)/metrics`.
- **SHCA-006 (Specification Review Mock Approval):** Replaced with an honest "currently unavailable" stub on `tools/project-llm/specification-review/page.tsx`.
- **SHCA-A03 / SHCA-I03 (Upstream Header Reconstruction):** Verified unit test pass (5/5 tests in `upstream-proxy.test.ts`).
- **SHCA-A11 (API Handler Boundary Enforcement):** Verified static pass across 80 handlers via `check:boundaries`.
- **SHCA-I06 (Brand-Specific Student Operations Segregation):** Verified **PASS** via comprehensive 80-file structural inventory.
- **SHCA-D02 (Build Verification):** Verified **PASS** via clean Turbopack compilation of 45 routes.
- **SHCA-F20 (Project AI Workflow Stubs):** Spec review mock approval replaced with honest unavailable banner.
- **SHCA-D01 (Local Security & Guard Execution):** Security unit tests and API boundary checks pass cleanly (61/61 tests).

---

## 5. Explicit Confirmed FAIL and PENDING Items

### The 21 Confirmed FAIL Items
1. `SHCA-U01`: Direct DB CRUD in BFF instead of authoritative domain service.
2. `SHCA-U02`: BFF handlers mix HTTP orchestration with database persistence; tutorial sidebar route orchestrates dual-DB persistence.
3. `SHCA-U04`: Tutorial block composer page redirects immediately leaving 120 lines of unreachable JSX dead code; hierarchy CRUD duplicated across 5 entity routes.
4. `SHCA-U06`: List handlers parse `limit` directly via `parseInt` without min/max bounds validation.
5. `SHCA-U07`: Source-level gap: `src/proxy.ts` matcher restricted to `/api/:path*`, leaving page routes without proxy-layer checks; login page forwards unvalidated `redirect` parameter to `router.push`.
6. `SHCA-U08`: Hierarchy handlers perform unverified hard deletes; tutorial save path lacks expected-version predicate allowing lost updates.
7. `SHCA-U10`: Dashboard renders hardcoded metrics (128,540 users, 98,765 active learners, etc.) with no live API connection or development badge.
8. `SHCA-F01`: `router.push(redirectTarget || '/dashboard')` receives unvalidated `searchParams.get('redirect')` allowing open redirects.
9. `SHCA-F02`: Admin shell layout relies on client-side `AdminGuard`; `src/proxy.ts` omits page paths like `/dashboard`.
10. `SHCA-F03`: Authenticated question layout relies on client-side `AdminGuard` without server-side page guard.
11. `SHCA-F04`: Dashboard renders hardcoded metrics without live API connection or mock disclaimer.
12. `SHCA-F08`: Marketing page calls `useQuery` from `@tanstack/react-query` 5 times without `QueryClientProvider` in parent layout chain.
13. `SHCA-F10`: Layman architecture page is a non-functional presentational mockup with buttons lacking click handlers and static fake selectors.
14. `SHCA-F11`: Hierarchy admin flows perform direct ORM hard-deletes in route handlers without cascade or dependency analysis.
15. `SHCA-F14`: Tutorial save/PATCH path omits expected-version predicate; composer service `updateTutorialContent` performs unversioned update.
16. `SHCA-F15`: Tutorial block composer page immediately calls `redirect('/tools/tutorial-page-content')`, rendering 120 lines of JSX unreachable.
17. `SHCA-F21`: Dashboard page displays static hardcoded metrics without live integration or mock disclaimer.
18. `SHCA-F23`: `QuestionTable.tsx` multi-select "Delete Selected" button immediately executes `batchDeleteQuestions` without confirmation modal.
19. `SHCA-A02`: `src/proxy.ts` matcher is restricted to `/api/:path*`, leaving page routes unprotected at the proxy layer.
20. `SHCA-A04`: Direct Drizzle ORM CRUD operations in BFF routes, unbounded pagination limits, and hard-delete execution.
21. `SHCA-A06`: `PATCH /api/tutorial-composer/sections/[sectionId]` handler calls `updateTutorialContent` without expected-version predicate, bypassing version-conditional repository method.

### The 39 PENDING Items
- Universal Gates (6): `SHCA-U03`, `SHCA-U05`, `SHCA-U09`, `SHCA-U11`, `SHCA-U12`, `SHCA-U13`
- Frontend Features (13): `SHCA-F05`, `SHCA-F06`, `SHCA-F07`, `SHCA-F09`, `SHCA-F12`, `SHCA-F13`, `SHCA-F16`, `SHCA-F17`, `SHCA-F18`, `SHCA-F19`, `SHCA-F20`, `SHCA-F22`, `SHCA-F24`
- BFF & API Routes (8): `SHCA-A01`, `SHCA-A03`, `SHCA-A05`, `SHCA-A07`, `SHCA-A08`, `SHCA-A09`, `SHCA-A10`, `SHCA-A11`
- Cross-System Boundaries (5): `SHCA-I01`, `SHCA-I02`, `SHCA-I03`, `SHCA-I04`, `SHCA-I05`
- Tests & Deployment (7): `SHCA-D01`, `SHCA-D03`, `SHCA-D04`, `SHCA-D05`, `SHCA-D06`, `SHCA-D07`, `SHCA-D08`

---

## 6. Verification Status & Baseline Reconciliation

- **Acceptance Status:** Audited Baseline with Unresolved Findings (Acceptance NOT Granted).
- **Application Source Integrity:** Unmodified (0 changes to `apps/skillhubcore-admin/src` or workspace packages).
- **Documentation Reconciliation:** Both [`10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`](10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv) and [`SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md`](SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md) are strictly aligned to **2 PASS / 21 FAIL / 39 PENDING**.
- **Execution Stopped:** Standing by for owner review. No Phase B remediation, code edits, or migrations will be initiated without explicit authorization.

---

## 7. Architecture Reviewer Feedback Summary

**Disposition: CHANGES_REQUESTED for evidence qualifications; SHC Admin remains NOT ACCEPTED.**

### Summary of Incorporated Feedback Points:
1. **Preserve PENDING decisions:** Gates `SHCA-A03`, `SHCA-A11`, `SHCA-I03`, `SHCA-D01`, and `SHCA-F24` are classified as PENDING. Unit passes and static AST scripts do not substitute for runtime, network, or integration evidence.
2. **Qualify PASS scope:** `SHCA-F24` was returned to PENDING because runtime route handling and client/server boundaries across all routes cannot be proven from build logs alone. `SHCA-I06` PASS is supported by the full 80-file page/route structural inventory and writer audit (distinct from the 80-handler static guard check). `SHCA-D02` PASS is supported by the successful SHC Admin application build without claiming independent package builds.
3. **Distinguish source observations from runtime claims:** Missing proxy matchers and client-side guards are confirmed source gaps, not executed data disclosures.
4. **Next.js 16 guidance:** Retain `src/proxy.ts` (Next.js 16 standard); do not create deprecated `middleware.ts`. Route groups `(admin)` and `(authenticated)` must not be used in URL matchers.
5. **Evidence references corrected:** The navigation finding `SHCA-010` is mapped to `SHCA-F02` and `SHCA-F22`, separating it from `SHCA-F10` (Layman Architecture mockup).

---

## 8. Prioritized SHC Admin Remediation Proposal

Following the architecture reviewer's recommendation, remediation is organized into a tightly bounded, security-first initial batch, deferring housekeeping, and reserving Sol for complex architectural adjudication:

```mermaid
flowchart TD
    subgraph Batch1 ["Batch 1: Core Security & Defensive Stability (Small, Immediate, Bounded)"]
        B1_1["1. Open Redirect Validation<br/>(login/page.tsx)"]
        B1_2["2. Bounded Pagination Limits<br/>(domains & subtopics)"]
        B1_3["3. React Query Provider Wrap<br/>(marketing/layout.tsx)"]
        B1_4["4. Question Batch Delete Confirmation<br/>(QuestionTable.tsx)"]
        B1_5["5. Narrow Page-Security Boundary<br/>(src/proxy.ts + layout-level auth)"]
    end

    subgraph Housekeeping ["Housekeeping Batch (Deferred Lower-Risk Work)"]
        H1["Dead Code Cleanup in Tutorial Composer<br/>(tutorial-block-composer/page.tsx)"]
        H2["Left Sidebar Inactive Link Badging<br/>(LeftSidebar.tsx)"]
        H3["Test Fixture Diagnostic Expectation<br/>(validate-fixtures.test.ts)"]
    end

    subgraph Batch2 ["Batch 2: Targeted Sol Architectural Review (High-Risk Domain Decisions)"]
        S1["Tutorial Optimistic Concurrency<br/>(expectedVersion in PATCH payload)"]
        S2["Academic Hierarchy Cascade & FK Deletion Policy"]
        S3["Cross-Brand Access Authority Rules"]
        S4["Question Factory Duplicate Preflight Fail-Closed"]
        S5["Dashboard Metrics Real/Mock Indicator"]
    end

    Batch1 --> Housekeeping
    Batch1 --> Batch2
```

### Batch 1: Core Security & Defensive Stability (Bounded Implementation Batch)

Each item in this batch is strictly bounded, carries low risk, and includes an explicit rollback strategy:

#### 1. Open Redirect Validation (`SHCA-F01`, `SHCA-U07`)
- **Exact Target:** `apps/skillhubcore-admin/src/app/(public)/login/page.tsx:64-65`
- **Proposed Fix:** Introduce `sanitizeRedirectUrl(target: string | null): string` helper. Target must start with `/`, must not start with `//`, must not contain `:`, and must resolve strictly to internal relative paths. Default to `/dashboard`.
- **Risk:** Low. No database or API contract changes.
- **Regression Test:** Vitest unit test suite covering invalid inputs (`//evil.com`, `https://attacker.com`, `javascript:alert(1)`, `/\evil.com`, relative paths `/questions`).
- **Rollback Approach:** Revert `login/page.tsx` to commit HEAD.

#### 2. Bounded Pagination Limits (`SHCA-U06`, `SHCA-A04`)
- **Exact Target:** `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts:17`, `apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts:17`
- **Proposed Fix:** Apply strict schema bounds `z.coerce.number().int().min(1).max(100).default(20)` to `limit` parameter to prevent unbounded memory allocation and DB load.
- **Risk:** Low. Protects database without altering valid client pagination.
- **Regression Test:** Boundary test passing `limit=999999` and asserting clamped limit of 100 in query; passing `limit=-5` and asserting 1.
- **Rollback Approach:** Revert handler files to commit HEAD.

#### 3. Marketing Layout React Query Provider (`SHCA-F08`)
- **Exact Target:** `apps/skillhubcore-admin/src/app/(admin)/marketing/layout.tsx` (new file or wrap `marketing/page.tsx`)
- **Proposed Fix:** Introduce a client boundary layout providing `<QueryClientProvider client={queryClient}>` for all child routes under `/marketing`.
- **Risk:** Low. Isolated to `/marketing` subtree; fixes runtime React Query context crash.
- **Regression Test:** Vitest/RTL mount test verifying `marketing/page.tsx` renders without throwing "No QueryClient set".
- **Rollback Approach:** Delete `marketing/layout.tsx`.

#### 4. Question Bulk Deletion Confirmation Modal (`SHCA-F23`)
- **Exact Target:** `apps/skillhubcore-admin/src/components/entry/QuestionTable.tsx:413-425`
- **Proposed Fix:** Add an alert dialog confirmation state (`isConfirmDeleteOpen`) requiring explicit user confirmation before executing `handleBatchDelete()`.
- **Risk:** Low. Purely UI-level defensive guard against accidental mass data loss.
- **Regression Test:** Component unit test verifying `handleBatchDelete` is not called when clicking "Delete Selected" until the confirmation dialog button is clicked.
- **Rollback Approach:** Revert `QuestionTable.tsx` to commit HEAD.

#### 5. Narrowly Scoped Page-Security Design (`SHCA-A02`, `SHCA-F02`, `SHCA-F03`, `SHCA-U07`)
- **Exact Target:** `apps/skillhubcore-admin/src/proxy.ts`, `apps/skillhubcore-admin/src/app/(admin)/layout.tsx`, `apps/skillhubcore-admin/src/app/(authenticated)/layout.tsx`
- **Proposed Fix:**
  - In `src/proxy.ts`: Add concrete URL path prefixes to the route matcher: `/dashboard/:path*`, `/questions/:path*`, `/tools/:path*`, `/marketing/:path*`, `/users/:path*`, `/subscriptions/:path*`. Verify session token cookie exists before forwarding to edge; redirect unauthenticated requests to `/login?redirect=...`. Preserve all existing API guards and origin checks.
  - In Layouts: Enforce server-side session authorization (`getServerSession` or auth token verification) inside the server layout before rendering RSC or child components (defense-in-depth close to data).
- **Risk:** Medium. Must not disrupt existing API origin checks or login flow.
- **Regression Test:** HTTP unit tests asserting that unauthenticated GET requests to `/dashboard` receive 307/302 redirect to `/login`, while authenticated requests pass through to layout.
- **Rollback Approach:** Revert `src/proxy.ts` and layout files to commit HEAD.

---

### Housekeeping Batch (Deferred Lower-Risk Work)
1. **Dead Code Elimination:** Remove the 120 unreachable JSX lines following unconditional `redirect()` in `tutorial-block-composer/page.tsx`.
2. **Left Sidebar Link Cleanup:** Badge or remove inactive `#` links and remove nonexistent `/content-intelligence/*` hrefs in `LeftSidebar.tsx`.
3. **Fixture Test Diagnostic Fix:** Wrap `createEmptyTestDocument()` in `expect(() => ...).toThrow(ZodError)` in `validate-fixtures.test.ts`.

---

### Batch 2: Targeted Sol Architectural Review (High-Risk Domain Decisions)
*Use Sol tokens specifically for formal review and adjudication of these 5 architectural designs:*
1. **Tutorial Optimistic Concurrency Predicate (`SHCA-F14`, `SHCA-A06`, `SHCA-U08`):** Proposed PATCH schema carrying `expectedVersion` and calling repository `updateTutorialContentWithVersion` with HTTP 409 Conflict rejection.
2. **Academic Hierarchy Cascade & Referential Policy (`SHCA-F11`, `SHCA-A04`, `SHCA-U01`):** Deletion policy determining whether child entities are cascade-deleted or hard-blocked.
3. **Cross-Brand Authority Scoping (`SHCA-I01`, `SHCA-U03`):** Policy for tenant isolation between SkillUp and RealTutorialHub administrators.
4. **Question Factory Duplicate Preflight Fail-Closed (`SHCA-F13`):** Backend enforcement of duplicate prevention.
5. **Dashboard Metrics Architecture (`SHCA-F04`, `SHCA-F21`, `SHCA-U10`):** Cached aggregate query vs. honest dev badge.
