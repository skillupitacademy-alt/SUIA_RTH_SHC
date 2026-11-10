# Sol-Targeted Handoff: SHC Admin Batch C (Tasks 11–15)

**To:** Sol (Independent Security & Quality Reviewer)  
**From:** Antigravity (Implementation Agent)  
**Date:** November 10, 2026  
**Git Baseline:** `425df7870d47ebccb82655b480d7a737a9a66917`  
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

# 3. Batch C Academic Hierarchy Service & Safety Test Suites
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/hierarchy/__tests__/cross-system-hierarchy-contracts.test.ts

# 4. Regression & Boundary Test Suites (Foundation, Sidebar Parser, Scope B Master, Pagination)
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/app/api/admin/domains/__tests__/foundation-validation.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/app/api/tutorial-left-sidebar/__tests__/markdown-navigation-parser.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/schemas/__tests__/hierarchy-contract.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/scope-b-remediation.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/admin-boundary.test.ts
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/pagination-helper.test.ts
```

---

## 2. Review Guide by Task

### Task 11: Authoritative Hierarchy Ownership and Writers
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts)
- **Check:** Verified that Next.js BFF handlers no longer perform raw unvalidated database deletions. All 5 taxonomy levels (Domain $\rightarrow$ Subject $\rightarrow$ Topic $\rightarrow$ Subtopic $\rightarrow$ Skill) delegate to `AcademicHierarchyService`.
- **Criteria Addressed:** `SHCA-F11`, `SHCA-A04`, `SHCA-U01`, `SHCA-U02`, `SHCA-I02`.

### Task 12: Protect Destructive Hierarchy Operations
- **Code:** `AcademicHierarchyService.check*Dependencies` and route handlers in:
  - [`apps/skillhubcore-admin/src/app/api/admin/domains/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/domains/route.ts) & `[id]/route.ts`
  - [`apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts) & `[id]/route.ts`
  - [`apps/skillhubcore-admin/src/app/api/admin/topics/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/topics/route.ts) & `[id]/route.ts`
  - [`apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts) & `[id]/route.ts`
  - [`apps/skillhubcore-admin/src/app/api/admin/skills/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/skills/route.ts) & `[id]/route.ts`
- **Check:**
  - Deleting an entity with active dependents returns `HTTP 409 Conflict` with `conflictType: 'DEPENDENCY_CONFLICT'` and a structured breakdown of child counts.
  - Silent cascading and unhandled 500 errors on foreign key constraints are completely prevented.
  - Zero unapproved schema changes or DDL were applied.
- **Criteria Addressed:** `SHCA-F11`, `SHCA-A04`, `SHCA-U08`.

### Task 13: Bounded Bulk Hierarchy Contracts
- **Code:** `AcademicHierarchyService.validateBatchDeletePayload` and `batchDelete*` handlers across:
  - `domains/batch-delete`, `subjects/batch-delete`, `topics/batch-delete`, `subtopics/batch-delete`, `skills/batch-delete`
- **Check:**
  - Empty array $\rightarrow$ `400 Bad Request`.
  - Array exceeding 100 items $\rightarrow$ `413 Payload Too Large`.
  - Non-UUID values $\rightarrow$ `400 Bad Request`.
  - Deduplication into canonical unique sets.
  - Atomic validation: any conflicting item in the batch rejects the entire batch with `409 Conflict`.
- **Criteria Addressed:** `SHCA-A04`, `SHCA-U06`, `SHCA-F23`.

### Task 14: Left Sidebar Synchronization Resilience & Partial Failure Safety
- **Code:** [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts)
- **Check:**
  - Dual-database write order is strictly sequential:
    1. Schema & Markdown/JSON input validation.
    2. Hierarchy parent chain validation (`getHierarchyNames`).
    3. Structural validation (depth <= 3, group/page node rules, unique canonical IDs).
    4. Pre-publish transactional hierarchy sync (`ensureTopicHierarchySynced`).
    5. Atomicity & rollback: TutorialDB hierarchy sync failure rolls back and returns `500`, preventing corrupt or disconnected navigation trees from persisting to `tutorialSidebarTreesV2`.
    6. Post-sync idempotent save into `tutorialSidebarTreesV2` with version increment.
- **Criteria Addressed:** `SHCA-F16`, `SHCA-A07`, `SHCA-I04`.

### Task 15: Cross-System Hierarchy Identity & Visibility Contracts
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/cross-system-hierarchy-contracts.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/cross-system-hierarchy-contracts.ts)
- **Check:**
  - Full equivalence mapping between MainDB and TutorialDB entities.
  - Learner delivery truth table:
    - `skillup` (SUIA) learner cannot access `realtutorialhub` content.
    - `realtutorialhub` (RTH) learner cannot access `skillup` content.
    - Shared deployed content serves as universal fallback.
    - Exact brand deployed content cleanly overrides shared content.
    - Drafts (`draft`, `in_review`, `approved`) are strictly withheld from learner delivery.
- **Criteria Addressed:** `SHCA-U05`, `SHCA-I02`, `SHCA-I04`.

---

## 3. Invariants Verified
- **Tutorial V2 Composer:** 18 block families, Save as Draft, and Publish are untouched and functioning.
- **Database Schema:** 0 migrations, 0 DDL, 0 schema alterations.
- **Ledger:** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` strictly unchanged.
- **Git State:** 0 commits, 0 pushes.
- **Next Phase:** Stopped at owner decision gate. Batch D (Tasks 16–20) has NOT been started.

