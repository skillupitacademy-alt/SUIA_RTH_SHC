# SHC Admin — Batch C (Tasks 11–15) Technical Delivery & Security Verification Report

**Date:** November 10, 2026  
**Execution Phase:** Batch C (Academic Hierarchy, Destructive Safety, Bulk Contracts, Sidebar Synchronization, Cross-System Identity)  
**Git Baseline (Committed):** `e49baed66d8067a0a89f4edbf46149578c0d0b74`  
**Target Git Working State:** Hardened Batch C Baseline with Concurrency Row Locking, Physical CASCADE Retention, Direct Delivery Contracts, and Error Sanitization  
**Governing Authority:** Sole Tutorial Authoring Authority (`skillhubcore`), Centralized SHC Admin RBAC  
**Review Target:** Independent Technical Review (Sol Style)  

---

## 1. Executive Summary

Batch C of the SHC Admin implementation roadmap (Tasks 11–15) establishes architectural governance, referential cascade protection, bounded bulk API contracts, dual-database sync resilience, and cross-system learner visibility boundaries for the 5-tier academic hierarchy:

$$\text{Domain} \longrightarrow \text{Subject} \longrightarrow \text{Topic} \longrightarrow \text{Subtopic} \longrightarrow \text{Skill}$$

Following independent source inspection of commit `e49baed66d8067a0a89f4edbf46149578c0d0b74`, targeted hardening and verification were implemented and certified:

1. **Fail-Closed Dependency Checks (BC-CORR-01):** Replaced swallowed exceptions in `AcademicHierarchyService` with typed `DependencyCheckUnavailableError`. Storage outages return `HTTP 503 Service Unavailable` and strictly abort deletion, preventing unsafe cascade wipeouts.
2. **Direct Schema Table Exports & Question/Skill Checks (BC-CORR-02):** Removed reflection hacks in favor of directly exported Drizzle table schemas from `@quiz/db` (`questions`, `questionSkills`, `topicSkills`). Dependent questions and skills references deterministically trigger `HTTP 409 Conflict`.
3. **Physical Row Retention for CASCADE Protection:** Removed `isNull(deletedAt)` from all dependency queries (`checkDomainDependencies`, `checkSubjectDependencies`, `checkTopicDependencies`, `checkSubtopicDependencies`, `checkSkillDependencies`). Physical foreign key references (even soft-deleted records) prevent parent deletion, eliminating accidental permanent data wipeout from physical `ON DELETE CASCADE` triggers.
4. **Concurrent Destructive Operation Safety via Exclusive Row Locks (BC-CORR-03):** Wrapped preflight dependency verification and delete mutations inside PostgreSQL transactions (`db.transaction(async (tx) => { ... })`). In addition, `acquireRowLock(entityType, entityId, query)` uses Drizzle `.for('update')` to acquire row-level exclusive locks on parent records prior to dependency checks, preventing race conditions against concurrent child insertions.
5. **TutorialDB Sidebar Publication Atomicity & Rollback Verification (BC-CORR-04):** MainDB is read-only upstream. In TutorialDB, hierarchy synchronization (`ensureTopicHierarchySynced`) and sidebar navigation tree upsert (`tutorialSidebarTreesV2`) are executed within a single atomic `tutorialDb.transaction`. Resilience tests confirm that failure during sidebar upsert *after* successful hierarchy sync cleanly rolls back both operations.
6. **Real Downstream Learner Delivery Contracts (BC-CORR-05):** Eliminated all simulation helper functions. Downstream contracts directly invoke the production `tutorialDeliveryService.getTutorialByPage` (from `@quiz/db-tutorial`) and `getPublishedTutorialPagePayload` (from `@quiz/skillhubcore-admin`), mocking only external database/network boundaries using Drizzle table symbols (`Symbol.for('drizzle:Name')`).
7. **Safe Error Sanitization:** Sanitized all 500 error responses during hierarchy deletions to prevent leaking raw SQL, table structures, column definitions, or connection credentials.

---

## 2. Detailed Remediation Matrix

| Ref ID | Problem / Assessment Focus | Corrective Implementation | Verification Proof |
|:---|:---|:---|:---|
| **BC-CORR-01** | Dependency checks caught DB read errors and returned `null`, permitting destructive cascade during DB outages (fail open). | Defined `DependencyCheckUnavailableError`. Storage query errors rethrow and are caught by service delete methods, returning `HTTP 503` and aborting deletion. | `academic-hierarchy-service.test.ts` & `hierarchy-destructive-operations.test.ts` verify 503 response and zero delete calls on storage outage. |
| **BC-CORR-02** | Topic, subtopic, and skill dependency checks used reflection `(db as any).questions`. Soft-deleted child records could trigger physical CASCADE. | Imported `questions`, `questionSkills`, and `topicSkills` directly from `@quiz/db`. Removed `isNull(deletedAt)` so physical child rows block deletion with `HTTP 409 Conflict`. | Verified with test case asserting `HTTP 409 Conflict` even if dependent child record has `deletedAt` set. |
| **BC-CORR-03** | Concurrent child inserts during dependency check-and-delete window could cause race conditions. | Wrapped both preflight dependency checks and `tx.delete(...)` inside `db.transaction`. Implemented `acquireRowLock` using `.for('update')` on parent rows across all 10 single/batch delete methods. | `academic-hierarchy-service.test.ts` and `hierarchy-destructive-operations.test.ts` verify atomic lock acquisition and fail-closed 503 handling if locking fails. |
| **BC-CORR-04** | Dual-DB persistence without transaction rollback proof; need verification that sidebar failure rolls back hierarchy sync. | MainDB queried read-only. In TutorialDB, `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` run in a single `tutorialDb.transaction`. Added explicit test injecting failure during sidebar upsert after sync. | `sidebar-synchronization-resilience.test.ts` test case confirms 500 abort and clean rollback of TutorialDB transaction on post-sync failure. |
| **BC-CORR-05** | Downstream delivery tests previously relied on simulation functions rather than production resolvers. | Replaced simulation helpers with direct execution of `tutorialDeliveryService.getTutorialByPage` and `getPublishedTutorialPagePayload`. Certified multi-tenant isolation, exact brand precedence, and draft gating. | `downstream-delivery-contracts.test.ts` (10 tests) certifies production delivery contracts against real service functions. |

---

## 3. File Change Summary

| File Path | Nature of Change | Purpose / Impact |
|:---|:---|:---|
| [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts) | MODIFIED | Implemented `acquireRowLock` (`.for('update')`), removed `isNull(deletedAt)` from dependency queries for physical CASCADE safety, transaction-wrapped all 10 delete methods, sanitized error messages. |
| [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts) | MODIFIED | Single atomic `tutorialDb.transaction` encompassing `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` upsert during publish. |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts) | MODIFIED | 29 tests verifying fail-closed 503 behavior, question/skill dependency detection, physical retention CASCADE safety, row-level locking, and batch size bounds. |
| [`apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts) | MODIFIED | 19 tests verifying HTTP route responses: 409 conflict, 413 payload limit, 400 validation, and 503 storage/lock outage. |
| [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts) | MODIFIED | 10 tests verifying atomic publish in TutorialDB, 500 rollback on post-sync sidebar failure, draft save without sync, and validation bounds. |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts) | MODIFIED | 10 integration contract tests invoking production `tutorialDeliveryService.getTutorialByPage` and `getPublishedTutorialPagePayload`. |

---

## 4. Verification & Quality Gates

### Suite Execution Summary
- **Boundary Checks:** `pnpm --filter @quiz/skillhubcore-admin check:boundaries`
  - **Result:** 80 / 80 passed (0 public exceptions except health)
- **TypeScript Typecheck:** `pnpm --filter @quiz/skillhubcore-admin type-check`
  - **Result:** 0 errors (Exit code 0)
- **Lint Check:** `pnpm --filter @quiz/skillhubcore-admin lint`
  - **Result:** 0 errors, 0 warnings (Exit code 0)
- **Vitest Test Suites (Targeted Batch C Suites):**
  - `src/schemas/__tests__/hierarchy-contract.test.ts`: 31 / 31 PASS
  - `src/lib/hierarchy/__tests__/cross-system-hierarchy-contracts.test.ts`: 14 / 14 PASS
  - `src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts`: 29 / 29 PASS
  - `src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts`: 10 / 10 PASS
  - `src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts`: 19 / 19 PASS
  - `src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts`: 10 / 10 PASS
  - **Total Batch C Tests:** 113 / 113 PASS

---

## 5. Architectural Invariants Preserved
- **PostgreSQL Drizzle ORM exclusively:** No MongoDB / Mongoose artifacts or dependencies introduced.
- **Zero Database Migrations / DDL:** No schema alterations performed.
- **Canonical Acceptance Ledger Untouched:** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly intact.
- **Tutorial V2 Pipeline Invariants:** Preserved 18 block families, Save as Draft, Publish, published snapshots, and multi-tenant learner delivery.
- **Independent Acceptance Gate:** No self-approval. Ready for Sol's targeted independent review.
