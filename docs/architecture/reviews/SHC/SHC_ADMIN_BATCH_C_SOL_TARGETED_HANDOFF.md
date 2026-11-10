# Sol-Targeted Handoff: SHC Admin Batch C (Tasks 11–15)

**To:** Sol (Independent Security & Quality Reviewer)  
**From:** Antigravity (Implementation Agent)  
**Date:** November 10, 2026  
**Git Baseline (Committed):** `e49baed66d8067a0a89f4edbf46149578c0d0b74`  
**Working State:** Hardened Batch C Delivery (with Row-Level Locks, Physical CASCADE Safety, and Direct Delivery Contract Verification)  
**Execution Scope:** Batch C (Academic Hierarchy Ownership, Destructive Safety, Bulk Contracts, Sidebar Dual-DB Resilience, Downstream Identity)  
**Ledger Criteria Under Review:** `SHCA-F11`, `SHCA-A04`, `SHCA-U01`, `SHCA-U02`, `SHCA-U08`, `SHCA-U06`, `SHCA-F23`, `SHCA-F16`, `SHCA-A07`, `SHCA-I02`, `SHCA-I04`, `SHCA-U05`  

---

## 1. Quick Verification Commands for Sol

All commands can be executed directly from repository root:

```bash
# 1. API Route Boundaries Check (verifies all 80 SHC API routes have explicit auth guards)
pnpm --filter @quiz/skillhubcore-admin check:boundaries

# 2. TypeScript Type Check (verifies zero TS compiler errors)
pnpm --filter @quiz/skillhubcore-admin type-check

# 3. Batch C Academic Hierarchy Service, Safety & Delivery Test Suites (113 tests)
pnpm --filter @quiz/skillhubcore-admin test src/schemas/__tests__/hierarchy-contract.test.ts src/lib/hierarchy/__tests__/ src/app/api/admin/hierarchy/__tests__/ src/app/api/tutorial-left-sidebar/__tests__/

# 4. Lint Check (verifies zero ESLint warnings or errors)
pnpm --filter @quiz/skillhubcore-admin lint
```

---

## 2. Targeted Hardening for Sol to Inspect

### 1. Concurrent Destructive Safety & Row Locking (`SELECT FOR UPDATE`)
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts)
- **Implementation:** `acquireRowLock(entityType, entityId, query)` uses Drizzle ORM `.for('update')` on the target parent row prior to performing dependency checks.
- **Coverage:** Applied across all 10 single and batch deletion methods (`deleteDomain`, `batchDeleteDomains`, `deleteSubject`, `batchDeleteSubjects`, `deleteTopic`, `batchDeleteTopics`, `deleteSubtopic`, `batchDeleteSubtopics`, `deleteSkill`, `batchDeleteSkills`).
- **Fail-Closed Guarantee:** If lock acquisition fails or storage encounters an error, it rethrows `DependencyCheckUnavailableError`, returning `HTTP 503` and aborting deletion.
- **Tests:** `academic-hierarchy-service.test.ts` and `hierarchy-destructive-operations.test.ts` verify atomic lock acquisition and fail-closed 503 handling.

### 2. Physical Row Retention for CASCADE Protection
- **Code:** `academic-hierarchy.service.ts` dependency check queries (`checkDomainDependencies`, `checkSubjectDependencies`, `checkTopicDependencies`, `checkSubtopicDependencies`, `checkSkillDependencies`).
- **Implementation:** Removed `isNull(deletedAt)` from all child foreign key dependency queries. Even if a child record has `deletedAt` set (soft-deleted), its physical presence in the PostgreSQL table represents a foreign key dependency that blocks deletion with `HTTP 409 Conflict`. This prevents uninspected physical rows from triggering unintended `ON DELETE CASCADE` or `RESTRICT` database violations.
- **Test:** `academic-hierarchy-service.test.ts` test case: *"blocks deletion with 409 Conflict even if dependent child record has deletedAt set (physical retention check for CASCADE safety)"*.

### 3. Single Atomic Transaction in TutorialDB & Rollback Proof
- **Code:** [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts)
- **Implementation:** MainDB is queried read-only (`getDb()`). In TutorialDB, `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` upsert are wrapped within a single `tutorialDb.transaction(async (tx) => { ... })`.
- **Test:** [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts) test case: *"BC-CORR-04: aborts with 500 and rolls back TutorialDB transaction if sidebar insert fails after hierarchy sync"*.

### 4. Direct Production Downstream Delivery Contracts (Zero Simulations)
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts)
- **Implementation:** Replaced all test simulations (`simulateTutorialDeliveryServiceGetTutorialByPage`, `simulateGetPublishedTutorialPagePayload`) with direct invocations of the production code:
  - `tutorialDeliveryService.getTutorialByPage` (from `@quiz/db-tutorial`)
  - `getPublishedTutorialPagePayload` (from `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts`)
- **Isolation:** Mocks only the external database connection boundary via Drizzle `Symbol.for('drizzle:Name')`.
- **Verification Focus:** 10 integration tests verify multi-tenant isolation (SUIA learner cannot access RTH content), brand override precedence (`skillup` > `shared`), draft gating (draft/approved content returns null), and full 18-block JSONB delivery.

### 5. Safe Error Sanitization
- **Implementation:** All catch blocks in `academic-hierarchy.service.ts` log error diagnostics and stack traces internally, while returning sanitized generic error messages (`Failed to delete ... Internal server error`) to clients, preventing disclosure of SQL syntax, table names, or connection strings.

---

## 3. Invariants Preserved
- **PostgreSQL Exclusively:** Zero MongoDB or Mongoose artifacts.
- **Zero Database Migrations:** 0 DDL or schema alterations.
- **Acceptance Ledger Untouched:** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` strictly untouched.
- **Tutorial V2 Authoring:** Preserved all 18 block families, Save as Draft, Publish, published snapshots, and multi-tenant delivery.
- **Zero Self-Approval:** Awaiting Sol's targeted independent review.
