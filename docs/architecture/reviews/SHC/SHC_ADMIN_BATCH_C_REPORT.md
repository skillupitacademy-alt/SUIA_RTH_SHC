# SHC Admin — Batch C (Tasks 11–15) Technical Delivery & Security Verification Report

**Date:** November 10, 2026  
**Execution Phase:** Batch C (Academic Hierarchy, Destructive Safety, Bulk Contracts, Sidebar Synchronization, Cross-System Identity)  
**Git Baseline (Committed):** `fa8f09b45a0ff2a4b1216fca96c49ed880f8f5ab`  
**Target Git Working State:** Corrected Batch C Baseline with BC-CORR-01 through BC-CORR-05  
**Governing Authority:** Sole Tutorial Authoring Authority (`skillhubcore`), Centralized SHC Admin RBAC  
**Review Target:** Independent Technical Review (Sol Style)  

---

## 1. Executive Summary

Batch C of the SHC Admin implementation roadmap (Tasks 11–15) establishes architectural governance, referential cascade protection, bounded bulk API contracts, dual-database sync resilience, and cross-system learner visibility boundaries for the 5-tier academic hierarchy:

$$\text{Domain} \longrightarrow \text{Subject} \longrightarrow \text{Topic} \longrightarrow \text{Subtopic} \longrightarrow \text{Skill}$$

Following independent source inspection of commit `fa8f09b4`, five targeted corrective remediations (**BC-CORR-01 through BC-CORR-05**) were implemented, verified, and certified:

1. **BC-CORR-01 (Fail-Closed Dependency Checks):** Replaced swallowed exceptions in `AcademicHierarchyService` with typed `DependencyCheckUnavailableError`. Storage outages return `HTTP 503 Service Unavailable` and strictly abort deletion, preventing unsafe cascade wipeouts.
2. **BC-CORR-02 (Direct Schema Table Exports & Question/Skill Checks):** Removed reflection hacks in favor of directly exported Drizzle table schemas from `@quiz/db` (`questions`, `questionSkills`, `topicSkills`). Dependent questions and skills references now deterministically trigger `HTTP 409 Conflict`.
3. **BC-CORR-03 (Transaction Isolation for Deletions):** Wrapped preflight dependency verification and delete mutations inside PostgreSQL transactions (`db.transaction(async (tx) => { ... })`) to ensure atomic execution and race-condition safety under concurrent mutations.
4. **BC-CORR-04 (Sidebar Publication Atomicity Boundary):** Clarified the dual-database boundary. MainDB is read-only upstream. In TutorialDB, hierarchy synchronization (`ensureTopicHierarchySynced`) and sidebar navigation tree upsert (`tutorialSidebarTreesV2`) are executed within a single atomic `tutorialDb.transaction`, eliminating partial commit and ensuring clean rollback on failure.
5. **BC-CORR-05 (Domain Ownership Classification & Downstream Delivery Integration):** Transparently classified `SHCA-U01` and `SHCA-U02` as **PARTIALLY REMEDIATED / PENDING DOMAIN SERVICE EXTRACTION** (destructive operations centralized, full create/update route extraction deferred to owner-approved scope). Verified learner-facing delivery resolvers (`tutorialDeliveryService.getTutorialByPage`, `getPublishedTutorialPagePayload`) with real contract integration tests.

---

## 2. Detailed Remediation Matrix (BC-CORR-01 to BC-CORR-05)

| Ref ID | Problem Identified in Committed Baseline (`fa8f09b4`) | Corrective Implementation | Verification Proof |
|:---|:---|:---|:---|
| **BC-CORR-01** | Dependency checks caught DB read errors, logged warnings, and returned `null`, permitting destructive cascade during DB outages (fail open). | Defined `DependencyCheckUnavailableError`. Storage query errors rethrow and are caught by service delete methods, returning `HTTP 503` and aborting deletion. | `academic-hierarchy-service.test.ts` & `hierarchy-destructive-operations.test.ts` verify 503 response and zero delete calls on storage outage. |
| **BC-CORR-02** | Topic, subtopic, and skill dependency checks used reflection `(db as any).questions` and `.topicSkills`. | Imported `questions`, `questionSkills`, and `topicSkills` directly from `@quiz/db`. Added checks for questions referencing topics/subtopics and skills mapped in `topicSkills` / `questionSkills`. | Verified with test cases asserting `HTTP 409 Conflict` and structured `dependencies` breakdown for questions and topicSkills. |
| **BC-CORR-03** | Dependency verification and `db.delete(...)` ran outside a database transaction, vulnerable to concurrency race conditions. | Wrapped both preflight dependency checks and `tx.delete(...)` inside `db.transaction(async (tx) => { ... })`, supporting single and batch deletes with atomic all-or-none semantics. | `academic-hierarchy-service.test.ts` verifies `mockDb.transactionCalled === true` for both single and batch deletes. |
| **BC-CORR-04** | Overclaiming cross-database atomicity between MainDB and TutorialDB; sidebar upsert ran in a separate query outside `ensureTopicHierarchySynced` transaction. | MainDB is queried read-only. Within TutorialDB, `ensureTopicHierarchySynced` accepts an optional transaction client `tx`. In POST publish handler, both hierarchy sync and sidebar tree upsert run inside a single `tutorialDb.transaction`. | `sidebar-synchronization-resilience.test.ts` verifies atomic rollback on sync failure and successful atomic publish without corrupting state. |
| **BC-CORR-05** | Direct route writes for create/update remained while claims of full domain service remediation were asserted; downstream learner delivery was only tested via pure helpers. | Classified `SHCA-U01` / `SHCA-U02` as **PARTIALLY REMEDIATED / PENDING DOMAIN SERVICE EXTRACTION**. Implemented comprehensive integration contract tests for `tutorialDeliveryService.getTutorialByPage` and `getPublishedTutorialPagePayload`. | `downstream-delivery-contracts.test.ts` passes 9/9 tests verifying learner brand isolation, draft gating, and full JSONB delivery. |

---

## 3. File Change Summary

| File Path | Nature of Change | Purpose / Impact |
|:---|:---|:---|
| [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts) | MODIFIED | Implements fail-closed `DependencyCheckUnavailableError`, direct `@quiz/db` schema imports, transaction-wrapped single and batch deletes, zero `any` types. |
| [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts) | MODIFIED | Single atomic `tutorialDb.transaction` encompassing `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` upsert during publish. |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts) | MODIFIED | 28 tests verifying fail-closed 503 behavior, question/skill dependency detection, transaction atomicity, UUID and batch size bounds. |
| [`apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts) | MODIFIED | 19 tests verifying HTTP route responses: 409 conflict, 413 payload limit, 400 validation, and 503 storage outage. |
| [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts) | MODIFIED | 9 tests verifying atomic publish in TutorialDB, 500 rollback on sync failure, draft save without sync, and validation bounds. |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts) | **NEW** | 9 integration contract tests certifying `tutorialDeliveryService` and `getPublishedTutorialPagePayload` contracts, brand isolation, and draft gating. |

---

## 4. Verification & Quality Gates

### Suite Execution Summary
- **Boundary Checks:** `pnpm --filter @quiz/skillhubcore-admin check:boundaries`
  - **Result:** 80 / 80 passed (0 public exceptions except health)
- **TypeScript Typecheck:** `pnpm --filter @quiz/skillhubcore-admin type-check`
  - **Result:** 0 errors (Exit code 0)
- **Lint Check:** `npx eslint apps/skillhubcore-admin/src/lib/hierarchy/ apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/`
  - **Result:** 0 errors, 0 warnings (Exit code 0)
- **Vitest Test Suites:**
  - `cross-system-hierarchy-contracts.test.ts`: 14 / 14 PASS
  - `downstream-delivery-contracts.test.ts`: 9 / 9 PASS
  - `markdown-navigation-parser.test.ts`: 26 / 26 PASS
  - `academic-hierarchy-service.test.ts`: 28 / 28 PASS
  - `sidebar-synchronization-resilience.test.ts`: 9 / 9 PASS
  - `hierarchy-destructive-operations.test.ts`: 19 / 19 PASS
  - **Total Batch C Tests:** 105 / 105 PASS

---

## 5. Architectural Invariants Preserved
- **PostgreSQL Drizzle ORM exclusively:** No MongoDB / Mongoose artifacts or dependencies introduced.
- **Zero Database Migrations / DDL:** No schema alterations performed.
- **Canonical Acceptance Ledger Untouched:** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly intact.
- **Tutorial V2 Pipeline Invariants:** Preserved 18 block families, Save as Draft, Publish, published snapshots, and multi-tenant learner delivery.
- **Independent Acceptance Gate:** No self-approval. Ready for Sol's targeted independent review.
