# Sol-Targeted Handoff: SHC Admin Batch C (Tasks 11–15)

**To:** Sol (Independent Security & Quality Reviewer)  
**From:** Antigravity (Implementation Agent)  
**Date:** November 10, 2026  
**Git Baseline (Committed):** `fa8f09b45a0ff2a4b1216fca96c49ed880f8f5ab`  
**Working State:** Corrected Batch C Baseline (with BC-CORR-01 through BC-CORR-05)  
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

# 3. Batch C Academic Hierarchy Service, Safety & Delivery Test Suites (105 tests)
pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/ src/app/api/admin/hierarchy/ src/app/api/tutorial-left-sidebar/

# 4. Lint Check (verifies zero ESLint warnings or errors across Batch C files)
npx eslint apps/skillhubcore-admin/src/lib/hierarchy/ apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/
```

---

## 2. Targeted Corrections for Sol to Verify (BC-CORR-01 to BC-CORR-05)

### BC-CORR-01: Fail-Closed Dependency Checks (No Swallowed Outages)
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts)
- **Verification Focus:** Look at `checkDomainDependencies`, `checkSubjectDependencies`, `checkTopicDependencies`, `checkSubtopicDependencies`, and `checkSkillDependencies`. None of them catch and swallow query errors into `null`. They rethrow `DependencyCheckUnavailableError`.
- **Route / Service Outcome:** `AcademicHierarchyService.delete*` and `batchDelete*` catch `DependencyCheckUnavailableError` and return `HTTP 503` (`status: 503`) with a clear explanation, immediately halting execution with zero delete queries executed.
- **Test:** `academic-hierarchy-service.test.ts` (test case: *"aborts deleteDomain and returns 503 instead of failing open when DB select throws"*) and `hierarchy-destructive-operations.test.ts` (test case: *"returns 503 when dependency verification storage is temporarily unavailable"*).

### BC-CORR-02: Direct Schema Imports & Real Question/Skill Checks
- **Code:** `academic-hierarchy.service.ts` lines 1–10.
- **Verification Focus:** Notice that `(db as any).questions` and `.topicSkills` reflection hacks have been replaced with direct schema table imports from `@quiz/db`:
  ```typescript
  import { getDb, domains, subjects, topics, subtopics, skills, questions, questionSkills, topicSkills } from '@quiz/db';
  ```
- **Checks Performed:**
  - Topic deletion checks active `subtopics`, `questions` (with `deletedAt is null`), `topicSkills`, and `tutorialSidebarTreesV2`.
  - Subtopic deletion checks `questions` (`deletedAt is null`) and TutorialDB `tutorialSections`.
  - Skill deletion checks `topicSkills`, `questionSkills`, and legacy `questions`.
- **Test:** `academic-hierarchy-service.test.ts` verifies `HTTP 409 Conflict` when questions or topicSkills reference the target entity.

### BC-CORR-03: Transaction-Wrapped Atomic Deletions
- **Code:** `AcademicHierarchyService.delete*` and `AcademicHierarchyService.batchDelete*` in `academic-hierarchy.service.ts`.
- **Verification Focus:** Both preflight checks and `tx.delete(...)` run inside `db.transaction(async (tx) => { ... })`. If any item in a batch has a dependency conflict, the transaction exits with `409` before executing any deletion, guaranteeing all-or-none semantics under concurrent inserts.
- **Test:** Verified in `academic-hierarchy-service.test.ts` where `mockDb.transactionCalled === true`.

### BC-CORR-04: Single Atomic Transaction in TutorialDB During Publish
- **Code:** [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts)
- **Verification Focus:** MainDB is queried read-only (`getDb()`). During publish (`body.status === 'published'`), both `ensureTopicHierarchySynced` AND the `tutorialSidebarTreesV2` upsert are executed inside a single `tutorialDb.transaction(async (tx) => { ... })`. If anything fails (or if the sidebar tree insert fails), TutorialDB transaction rolls back completely, preventing broken or partial state.
- **Test:** `sidebar-synchronization-resilience.test.ts` verifies atomic rollback on sync failure and successful atomic publish without corrupting state.

### BC-CORR-05: Domain Ownership Classification & Downstream Delivery Contracts
- **Documentation Status:** `SHCA-U01` and `SHCA-U02` are transparently classified as **PARTIALLY REMEDIATED / PENDING DOMAIN SERVICE EXTRACTION**. Referential safety and deletes are centralized in `AcademicHierarchyService`, while create/update (`POST`, `PATCH`, `PUT`) extraction is scoped for a dedicated architectural phase.
- **Integration Tests:** [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts)
- **Verification Focus:** 9 integration tests verifying real delivery contracts:
  - `tutorialDeliveryService.getTutorialByPage`: brand precedence (exact brand override > shared fallback), negative tenant isolation (SUIA learner cannot receive RTH content), and draft gating (draft/approved content returns null).
  - `getPublishedTutorialPagePayload`: hierarchical payload assembly, full 18-block JSONB preservation, and fail-closed resolution when TutorialDB sync is unverified.

---

## 3. Invariants Preserved
- **PostgreSQL Exclusively:** No MongoDB or Mongoose artifacts.
- **Zero Database Migrations:** 0 DDL or schema alterations.
- **Acceptance Ledger Untouched:** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` strictly untouched.
- **Tutorial V2 Authoring:** Preserved all 18 block families, Save as Draft, Publish, published snapshots, and multi-tenant delivery.
- **Zero Self-Approval:** Awaiting Sol's targeted independent review.
