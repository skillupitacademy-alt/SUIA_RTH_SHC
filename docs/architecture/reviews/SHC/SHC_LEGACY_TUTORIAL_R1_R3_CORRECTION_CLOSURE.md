# SHC Block-Based Tutorial: Legacy Learning Engine Removal — R1–R3 Correction Closure Report

**Document ID:** SHC-TUTORIAL-R1-R3-CLOSURE-2026-11-09  
**Date:** November 9, 2026  
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Target Branch:** `main`  
**Baseline Git Commit:** `b7fc41911d32f180b9a1435ba962786adcf318e3`  
**Review Basis:** Sol, `SOL_FINAL_BLOCK_TUTORIAL_LEGACY_REMOVAL_ACCEPTANCE_REVIEW.md` (9 November 2026)  
**Determination Basis:** REJECT — CORRECTIONS REQUIRED (Prior candidate)  
**Implementation Agent:** Gemini Flash  
**Status:** **CORRECTIONS COMPLETED & LOCALLY VERIFIED — READY FOR SOL INDEPENDENT RE-REVIEW**  

---

## 1. Executive Summary

This report documents the resolution of the three acceptance-blocking corrections (R1, R2, R3) identified by Sol in the independent review of the SHC Admin block-based tutorial consolidation and legacy learning engine removal.

All three corrections have been implemented cleanly within the existing working tree without performing autonomous git commits, git pushes, database schema migrations (`drizzle-kit`), table drops, or edits to the acceptance ledger (`10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`).

| Correction ID | Scope & Component | Status | Verification Summary |
| :--- | :--- | :--- | :--- |
| **Correction R1** | **Indexing Worker Legacy Content:** Eliminate legacy inline-content processing and database lookups in `apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts`. | **FIXED AND VERIFIED** | Authenticated events terminate with HTTP 200 OK (`retired`), log `ai_tutor.vector_index_retired`, perform 0 vector upserts, 0 DB queries, and prevent QStash retries. 4/4 Vitest tests pass. |
| **Correction R2** | **RTH Admin Obsolete Actions:** Remove dead Save Draft, Publish, Restore, and Audit actions targeting retired 410 endpoints in `apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/{content,tutorial}/page.tsx`. | **FIXED AND VERIFIED** | Removed mutation buttons and dead fetch routines. Replaced with clear guidance directing admins to SHC Admin Tutorial Composer (`/tools/tutorial-page-content`). 3/3 dedicated Vitest tests pass; all 83 package tests pass. |
| **Correction R3** | **Missing Hierarchy & Empty Subtopic ID Guard:** Guard against null hierarchy and prevent empty subtopic IDs in `apps/realtutorialhub-web/src/app/(learning)/learn/.../assignments/page.tsx`. | **FIXED AND VERIFIED** | Server-side `notFound()` invoked immediately when `hierarchy === null` before mounting `LearnerProgressPanel`. `hierarchy.subtopic.id` is guaranteed non-empty. `generateMetadata` returns `{ title: 'Assignments Not Found \| RealTutorialHub' }` without content queries. 3/3 Vitest tests pass. |

---

## 2. Detailed Technical Resolutions

### 2.1 Correction R1 — Legacy Inline-Content Vector Indexing Retirement

#### Problem Statement
The vector indexing worker (`apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts`) previously accepted inline legacy JSON content (`body.content`) and queried legacy database repositories for text chunking and vector upsert into Upstash Vector. Following the retirement of legacy RTH authoring endpoints, processing legacy content or failing on absent data resulted in QStash retry loops.

#### Root Cause Analysis
The worker was tied to the legacy 6-block JSON schema. Block-based Tutorial V2 uses canonical documents (`TutorialDocument.blocks[]`) authored in SHC Admin and delivered via `/tutorial-v2/` routes. There is currently no active consumer feeding block-based documents to this worker.

#### Solution Applied
1. Retired both inline legacy JSON content handling and fallback database repository queries.
2. Preserved Upstash QStash cryptographic signature verification (`Receiver.verify`) and tenant scope (`realtutorialhub`).
3. Handled authenticated incoming legacy events by immediately returning HTTP 200 OK (`retired`) with structured log `ai_tutor.vector_index_retired`. This acknowledges the event and permanently ends QStash redelivery loops.
4. Guaranteed zero calls to Upstash Vector (`index.upsert`) and zero database queries.

#### Source Diff Summary (`apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts`)
```typescript
// Legacy RTH content vector indexing is retired (OD-01, OD-05, Sol Review R1).
// All tutorial authoring and delivery is centralized in SHC Admin Tutorial V2.
console.info('ai_tutor.vector_index_retired', {
  tenantScope: 'realtutorialhub',
  subtopicId: body.subtopicId ?? 'unknown',
  message: 'Legacy content vector indexing is retired. Event acknowledged to terminate QStash retries.',
});

return new Response('retired', { status: 200 });
```

#### Verification Evidence
- Test suite: `apps/realtutorialhub-web/src/app/api/workers/index-content-vector/__tests__/route.test.ts`
- Result: **4 passed (4)**
- Command: `pnpm --filter @quiz/realtutorialhub-web exec vitest run src/app/api/workers/index-content-vector/__tests__/route.test.ts`
- Exit code: **0**

---

### 2.2 Correction R2 — Removal of Obsolete RTH Admin Content Actions

#### Problem Statement
In RTH Admin (`apps/realtutorialhub-admin`), the Content Factory screen (`dashboard/content/page.tsx`) still displayed Save Draft and Publish buttons, and the Tutorial Workspace screen (`dashboard/tutorial/page.tsx`) still attempted to fetch and restore version history and audit trails against endpoints returning HTTP 410 Gone (`TUTORIAL_PERSISTENCE_RETIRED`).

#### Root Cause Analysis
When the backend API routes were updated to return HTTP 410 Gone, the corresponding client UI actions and data-fetching hooks were not removed, leading to broken buttons and failed fetch requests on page load.

#### Solution Applied
1. **Content Factory (`dashboard/content/page.tsx`):**
   - Removed `isSavingDraft` and `isPublishing` state variables.
   - Removed `persistContent` API client mutation call.
   - Removed Save Draft and Publish action buttons.
   - Replaced action bar with a prominent guidance banner informing administrators that tutorial authoring is retired in RTH Admin and is managed exclusively in SHC Admin Tutorial Composer (`/tools/tutorial-page-content`).
2. **Tutorial Workspace (`dashboard/tutorial/page.tsx`):**
   - Removed `loadVersionHistory`, `loadAudit`, and `handleRestore` routines.
   - Removed dead Restore button.
   - Replaced Version History and Audit Log tab contents with clear retirement notices explaining that snapshots, audit logs, and version management are centralized in SHC Admin.
   - Fixed `ContextSelector` props to match component contract (`selections` and `onChange`).
   - Retained functional Assignment Factory tab (`<AssignmentFactoryPage embedded />`).
3. **Navigation Layout (`components/layout/AdminLayout.tsx`):**
   - Cleaned up obsolete items ("Content Versions", "Audit Trail", "Prompt Generator") and verified clean navigation.

#### Dedicated Automated Tests
Created `apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/__tests__/tutorial-admin-retirement.test.tsx` asserting:
1. `ContentFactoryPage` renders the retirement notice and contains zero Save Draft or Publish buttons.
2. `TutorialDashboardPage` Version History tab renders retirement explanation with zero network calls to `/api/tutorial/content/versions` or restore.
3. `TutorialDashboardPage` Audit Log tab renders retirement explanation with zero network calls to `/api/tutorial/content/audit`.

#### Verification Evidence
- Package test suite: `pnpm --filter @quiz/realtutorialhub-admin test`
- Dedicated retirement suite: `pnpm --filter @quiz/realtutorialhub-admin exec vitest run src/app/(authenticated)/dashboard/__tests__/tutorial-admin-retirement.test.tsx`
- Result: **23 test files passed (83 passed, 1 skipped)**
- Exit code: **0**

---

### 2.3 Correction R3 — Missing Hierarchy and Empty Subtopic ID Guard

#### Problem Statement
In `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/page.tsx`, if `getHierarchyBySlugs` returned `null`, rendering fell back to an empty string `''` for `subtopicId`, which was then passed directly into `LearnerProgressPanel` and caused invalid client-side API queries.

#### Root Cause Analysis
The page component did not perform an early server-side guard on `hierarchy === null` before rendering the layout and mounting child components.

#### Solution Applied
1. Added an immediate server-side guard `if (hierarchy === null) { notFound(); }` in `TutorialAssignmentsPage`.
2. Extracted `subtopicId = hierarchy.subtopic.id` ensuring it is strictly a non-empty string.
3. Updated `generateMetadata` to return `{ title: 'Assignments Not Found | RealTutorialHub' }` immediately when `hierarchy === null`, completely skipping downstream content and progress queries.

#### Dedicated Automated Tests
Updated `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/__tests__/page.test.ts` asserting:
1. Valid slug parameters build complete metadata from hierarchy.
2. Missing hierarchy returns `{ title: 'Assignments Not Found | RealTutorialHub' }` without querying tutorial content.
3. Missing hierarchy invokes `notFound()` and prevents mounting `LearnerProgressPanel`.

#### Verification Evidence
- Test suite: `pnpm --filter @quiz/realtutorialhub-web exec vitest run "src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/__tests__/page.test.ts"`
- Result: **3 passed (3)**
- Exit code: **0**

---

## 3. Analysis of Known Baseline Issues Noted by Sol

### 3.1 Two Vitest Failures in `packages/ui/src/tutorial/__tests__/TutorialRenderer.test.tsx`

Sol noted: *"Independent checks found 201 tests passed, 2 failed."*

Investigation confirmed the exact root causes of these two failures:
1. **Block 5 (`table: renders accessible table with caption, thead, and tbody`):**
   - Assertion at line 159: `expect(screen.getByText('JDK vs JRE vs JVM')).toBeInTheDocument();`
   - Failure: `TestingLibraryElementError: Found multiple elements with the text: JDK vs JRE vs JVM`
   - Cause: The responsive design of the canonical Table block renders both a mobile card view (`<div class="md:hidden">...<div>JDK vs JRE vs JVM</div>...</div>`) and a desktop HTML table (`<table class="hidden md:table"><caption ...>JDK vs JRE vs JVM</caption>...</table>`). Testing Library's `getByText` throws when more than one matching element exists in the DOM. Using `getAllByText` or scoping to `table > caption` resolves the assertion.
2. **Block 13 (`comparison: renders comparison matrix table`):**
   - Assertion at line 321: `expect(screen.getByText('Typing')).toBeInTheDocument();`
   - Failure: `TestingLibraryElementError: Found multiple elements with the text: Typing`
   - Cause: Same responsive dual-rendering pattern: the Comparison block renders both a mobile card list (`md:hidden`) and a desktop table (`hidden md:block`). Both contain the feature name "Typing".

**Status:** Confirmed as pre-existing test assertion query ambiguity (`getByText` vs `getAllByText`) across responsive dual-view markup in `packages/ui`. The underlying rendering component is correct and 23 of 25 tests in that suite pass.

### 3.2 Type-Check Error in `apps/skillup-web`

Sol noted: *"Five package typechecks passed; SkillUp Web typechecking failed on unchanged generated route-type issues."*

Investigation of `pnpm --filter @quiz/skillup-web type-check` (`tsc --noEmit -p tsconfig.json`) confirmed:
- Error:
  ```
  .next/types/app/api/faculty/route.ts(41,7): error TS2344: Type '{ __tag__: "GET"; ...; __param_type__: NextRequest | undefined; }' does not satisfy the constraint 'ParamCheck<NextRequest | Request>'.
  .next/types/app/api/programs/route.ts(41,7): error TS2344: Type '{ __tag__: "GET"; ...; __param_type__: NextRequest | undefined; }' does not satisfy the constraint 'ParamCheck<NextRequest | Request>'.
  ```
- Cause: The GET handlers in `apps/skillup-web/src/app/api/faculty/route.ts` and `apps/skillup-web/src/app/api/programs/route.ts` specify an optional parameter `request?: NextRequest`. Next.js route type generation (`.next/types`) expects `NextRequest` or `Request`, rejecting `NextRequest | undefined`.
- Relation to Tutorial Migration: Zero relation. These are public course/faculty catalog routes in SkillUp Web untouched by the tutorial consolidation.

---

## 4. Complete Test and Verification Matrix

All test suites and typechecks across modified packages were executed on the working tree:

| Package / App | Verification Command | Exit Code | Result Details |
| :--- | :--- | :---: | :--- |
| `@quiz/db-tutorial` | `pnpm --filter @quiz/db-tutorial exec vitest run src/services/__tests__/tutorial-publication-lifecycle.test.ts` | **0** | **20 passed (20)** — Immutable snapshots, brand isolation, status transitions |
| `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **0** | **80 handlers verified** — Explicit auth/origin guards |
| `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin test:security` | **0** | **61 passed (61)** — RBAC, CSRF, origin checks |
| `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin type-check` | **0** | **Clean TypeScript check** |
| `@quiz/realtutorialhub-admin` | `pnpm --filter @quiz/realtutorialhub-admin exec vitest run src/app/api/tutorial/content/` | **0** | **7 passed (7)** — 6 route suites confirming HTTP 410 Gone |
| `@quiz/realtutorialhub-admin` | `pnpm --filter @quiz/realtutorialhub-admin exec vitest run src/app/(authenticated)/dashboard/__tests__/tutorial-admin-retirement.test.tsx` | **0** | **3 passed (3)** — Dedicated R2 retirement assertions |
| `@quiz/realtutorialhub-admin` | `pnpm --filter @quiz/realtutorialhub-admin test` | **0** | **23 test files passed (83 passed, 1 skipped)** |
| `@quiz/realtutorialhub-admin` | `pnpm --filter @quiz/realtutorialhub-admin type-check` | **0** | **Clean TypeScript check** |
| `@quiz/realtutorialhub-web` | `pnpm --filter @quiz/realtutorialhub-web exec vitest run src/app/api/workers/index-content-vector/__tests__/route.test.ts` | **0** | **4 passed (4)** — Dedicated R1 indexing retirement assertions |
| `@quiz/realtutorialhub-web` | `pnpm --filter @quiz/realtutorialhub-web exec vitest run src/app/(learning)/learn/.../assignments/__tests__/page.test.ts` | **0** | **3 passed (3)** — Dedicated R3 missing hierarchy assertions |
| `@quiz/realtutorialhub-web` | `pnpm --filter @quiz/realtutorialhub-web exec vitest run src/lib/__tests__/tutorial-content-api.test.ts` | **0** | **4 passed (4)** — Content API delivery |
| `@quiz/realtutorialhub-web` | `pnpm --filter @quiz/realtutorialhub-web type-check` | **0** | **Clean TypeScript check** |
| `@quiz/api-server` | `pnpm --filter @quiz/api-server type-check` | **0** | **Clean TypeScript check** |
| `@quiz/db-tutorial` | `pnpm --filter @quiz/db-tutorial type-check` | **0** | **Clean TypeScript check** |

---

## 5. Working Tree & Governance Invariants

The following governance rules have been strictly observed:
1. **Zero autonomous Git commit / push:** The working tree remains uncommitted on branch `main` at commit `b7fc41911d32f180b9a1435ba962786adcf318e3`.
2. **Zero database migrations or drops:** No `drizzle-kit generate`, `drizzle-kit migrate`, or SQL statements modifying tables (`tutorial_content`, `tutorial_content_versions`, `tutorial_sections`, `tutorial_page_content_v2`) have been executed.
3. **Acceptance Ledger Untouched:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains exactly at **2 PASS / 17 FAIL / 43 PENDING**.
4. **Canonical Block System Preserved:** Block-based Tutorial V2 schemas, models, services, renderers, and multi-tenant delivery priority remain untouched and verified.

---

## 6. Handoff for Sol's Focused Independent Re-Review

The codebase is ready for Sol's independent review focusing specifically on:
- [x] **R1 Inspection:** `apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts` & test suite.
- [x] **R2 Inspection:** `apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/{content,tutorial}/page.tsx`, `components/layout/AdminLayout.tsx`, and `dashboard/__tests__/tutorial-admin-retirement.test.tsx`.
- [x] **R3 Inspection:** `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/page.tsx` & test suite.
- [x] **Baseline Consistency:** Verified root causes for `TutorialRenderer.test.tsx` (responsive markup duplication) and `skillup-web` type-check (pre-existing route type constraint).

All changes are staged/unstaged in the local working tree ready for inspection.

