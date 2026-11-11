# SHC Admin — Tasks 11–40 Change & Acceptance Matrix

**Baseline Commit:** `3a6381753c61e2def972f1b6dc14da8c0c6774d8` (GitHub HEAD)  
**Execution Phase:** Unified Tasks 11–40 (Batches C through H)  
**Target Date:** November 10, 2026  

---

## 1. Modified Source & Test Files Manifest

| File Path | Nature | SHCA IDs | Description / Impact |
|:---|:---:|:---|:---|
| [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts) | MODIFIED | SHCA-F11, SHCA-A04, SHCA-U08, SHCA-U06, SHCA-F23 | Implemented fail-closed `acquireRowLock` (`SELECT ... FOR UPDATE`), transaction-wrapped `executeDestructiveTransaction` (removing direct-write fallback), deterministic ID sorting (`uniqueIds.sort()`), physical CASCADE retention checks, and generic 500 error sanitization. |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts) | MODIFIED | SHCA-F11, SHCA-A04, SHCA-U08 | Added unit tests asserting 503 fail-closed rejection on missing `.for()` row locking, 503 rejection on unavailable transaction support, and deterministic batch ID sorting (32 tests total). |
| [`apps/skillhubcore-admin/src/app/(admin)/users/__tests__/management-truth.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/users/__tests__/management-truth.test.tsx) | MODIFIED | SHCA-F05, SHCA-F06, SHCA-I01 | Added `/** @vitest-environment jsdom */` pragma, resolving `ReferenceError: document is not defined` and certifying honest "currently unavailable" states for Users and Subscriptions (4 tests pass). |
| [`apps/skillhubcore-admin/src/components/questions/__tests__/question-card-timestamp.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/questions/__tests__/question-card-timestamp.test.tsx) | MODIFIED | SHCA-F12, SHCA-A05 | Added `/** @vitest-environment jsdom */` pragma, certifying question creation timestamp formatting (4 tests pass). |
| [`apps/skillhubcore-admin/src/components/questions/__tests__/question-timestamp-truth.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/questions/__tests__/question-timestamp-truth.test.tsx) | MODIFIED | SHCA-F12, SHCA-A05 | Added `/** @vitest-environment jsdom */` pragma, certifying server creation timestamp retention (4 tests pass). |
| [`apps/skillhubcore-admin/src/components/questions/__tests__/domain-error-truth.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/questions/__tests__/domain-error-truth.test.tsx) | MODIFIED | SHCA-F11, SHCA-A04 | Added `/** @vitest-environment jsdom */` pragma, certifying truthful error banner without invented dependency cause (4 tests pass). |
| [`apps/skillhubcore-admin/src/components/questions/__tests__/subtopic-identity.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/questions/__tests__/subtopic-identity.test.tsx) | MODIFIED | SHCA-F11, SHCA-I02 | Added `/** @vitest-environment jsdom */` pragma, certifying subtopic identity preservation (5 tests pass). |
| [`apps/skillhubcore-admin/src/components/questions/__tests__/topic-identity.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/questions/__tests__/topic-identity.test.tsx) | MODIFIED | SHCA-F11, SHCA-I02 | Added `/** @vitest-environment jsdom */` pragma, certifying topic identity preservation (5 tests pass). |
| [`apps/skillhubcore-admin/src/components/questions/__tests__/subject-skill-identity.test.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/questions/__tests__/subject-skill-identity.test.tsx) | MODIFIED | SHCA-F11, SHCA-I02 | Added `/** @vitest-environment jsdom */` pragma, certifying subject and skill identity preservation (10 tests pass). |
| [`apps/skillhubcore-admin/src/app/api/project-llm/[...path]/__tests__/route.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/project-llm/[...path]/__tests__/route.test.ts) | MODIFIED | SHCA-F18, SHCA-F19, SHCA-A08 | Corrected mocked test path to `workflows/jobs` (non-verification route) to properly test `fetch` connection failure 502 sanitization (3 tests pass). |

---

## 2. Workstream Traceability Matrix (Batches C through H)

### Batch C: Academic Hierarchy & Destructive Safety (Tasks 11–15)
- **Authoritative Ownership:** 5-tier hierarchy mapped in `academic-hierarchy.service.ts` with direct schema table exports from `@quiz/db` (`domains`, `subjects`, `topics`, `subtopics`, `skills`, `questions`, `questionSkills`, `topicSkills`).
- **Destructive Safety:** Pre-delete checks acquire row locks with `.for('update')`. All 10 single/batch methods require `db.transaction(...)`. Storage/lock outages fail closed with 503 (`DependencyCheckUnavailableError`). Physical rows without soft-delete filter block cascade.
- **Bulk Contracts:** Enforced max 100 items limit (413), UUID regex validation, deduplication, and deterministic ascending sort to prevent deadlocks.
- **Dual-DB Atomicity:** MainDB is read-only upstream. In TutorialDB, `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` execute inside a single atomic `tutorialDb.transaction`, verified by rollback tests.
- **Downstream Identity:** `tutorialDeliveryService.getTutorialByPage` and `getPublishedTutorialPagePayload` certified with real service calls asserting multi-tenant isolation, exact brand override precedence, and draft gating.

### Batch D: Truthful Administration Operations (Tasks 16–20)
- **Dashboard Provenance:** SYSTEM BASELINE PREVIEW banner labels seed ecosystem metrics; no fabricated telemetry.
- **User & Subscription Boundaries:** Honest "currently unavailable" states rendered at `/users` and `/subscriptions`; zero unauthorized prototype CRUD.
- **Marketing & Certificates:** Formal issuance separated from template previews; multi-tenant branding for RTH and SUIA verified.
- **UI Integrity:** LeftSidebar navigation verified; 18-block tutorial composer preserved with active operation cards.

### Batch E: Question Factory & Project AI (Tasks 21–25)
- **Question Bank Contracts:** Lifecycle states, creation timestamp truth, and bulk delete modal error handling certified.
- **Duplicate Prevention:** `ReviewConsole` performs pre-commit validation, maps duplicates to block submission, and protects double-clicks via `isSaving`.
- **Project AI Worker Protection:** `/api/project-llm/[...path]` adapter verifies admin JWT and mutation origin; upstream 5xx errors sanitized into 502 `PROJECT_AI_BACKEND_ERROR` with private no-store headers.
- **Durable Workflows:** Client-only approvals rejected; correlation IDs propagated; credentials and private tokens redacted.

### Batch F: Coverage & Publication Integrity (Tasks 26–30)
- **Boundary Manifest:** 80/80 API handlers audited: 79 protected with explicit auth/origin guards; only `GET /api/health` is public.
- **UI Accessibility:** Skip-to-content links, tab navigation, ARIA labels, and double-submit guards verified.
- **CAS Concurrency Protection:** Mandatory `expectedVersion` in publish and block suggestion apply routes; concurrent mutations return 409 `VERSION_CONFLICT`.
- **Operational Runbook:** Pinned Dockerfile, secrets manifest, health endpoints, and rollback procedures documented.
- **Ledger Governance:** 62-row canonical ledger untouched; proposed CSV delta drafted.

### Batch G: Data Consistency & Contracts (Tasks 31–35)
- **Disposable Environment Spec:** Dedicated test database topology and seed lifecycle specified; production URLs rejected.
- **Failure Injection Atomicity:** Mock failure injection tests prove transaction rollback and fail-closed 503 behavior.
- **Sidebar Interruption Recovery:** Atomicity guaranteed within TutorialDB transaction; rollback verified on second-hop failure.
- **Published Scope Precedence:** Exact brand override > shared fallback; cross-tenant content strictly blocked.
- **Student Progress Continuity:** `TutorialDocument.blocks[]` block IDs preserved; learner ILS completion endpoints backwards compatible.

### Batch H: Final Qualification & Sol Targeted Scope (Tasks 36–40)
- **Browser Tutorial Authoring Smoke (Task 36):** DONE (Certified in headless Chromium against `http://localhost:3007`; 4 screenshots captured in `.evidence/screenshots/`).
- **Browser Learner Consumption Smoke (Task 37):** DONE (Certified in headless Chromium across SUIA `http://skillup.localhost:3009` and RTH `http://realtutorialhub.localhost:3003`; 5 multi-brand screenshots captured in `.evidence/screenshots/`).
- **Changed-Route Security Regression (Task 38):** All changed routes verified with auth guards and sanitized error logging (DONE).
- **Remote Neon DB Container Architecture (Task 39):** DONE (Multi-stage Dockerfile, production ports, entrypoints, and environment variables verified for Remote Neon DB deployment; local Docker database container waived per Owner instruction).
- **Final Traceability & Decision Gates (Task 40):** Comprehensive report, matrix, and bounded Sol handoff delivered (DONE).

---

## 3. Rollback & Remediation Notes

1. **Working Tree Reversibility:** All changes are local source edits and can be inspected or reverted using standard git working tree operations (`git checkout -- <file>`).
2. **Database Schema Parity:** Zero schema migrations or DDL applied. The existing database structure remains 100% compatible.
3. **Draft Snapshot Isolation:** Authoring mutations operate on working drafts and never alter published snapshots until explicit, validated publish transactions succeed.

