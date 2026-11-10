# Sol Final Targeted Handoff: Tasks 11–40 (Token-Efficient Independent Review)

**To:** Sol (Independent Security & Quality Reviewer)  
**From:** Antigravity (Implementation Agent)  
**Date:** November 10, 2026  
**Git Baseline (Committed):** `3a6381753c61e2def972f1b6dc14da8c0c6774d8` (GitHub HEAD)  
**Working State:** Clean, verified working tree with Batch C–H hardening and test fixes  
**Scope Boundary:** Tasks 11–40 (Batches C through H)  

---

## 1. Review Directive & Sol Token Efficiency

> [!IMPORTANT]
> **To conserve Sol tokens and avoid redundant verification:**
> - Do **NOT** re-audit accepted Scope B R6 security (G1–G5 probes remain valid and untouched).
> - Do **NOT** repeat routine GitHub source code reading, typechecks, or Graphify updates (which ChatGPT can independently verify).
> - Focus strictly on the **high-risk runtime behaviors** that ChatGPT cannot independently demonstrate:
>   1. PostgreSQL row-locking (`SELECT ... FOR UPDATE`) fail-closed behavior.
>   2. PostgreSQL transaction requirement on destructive paths (removal of direct-write fallback).
>   3. Physical row retention checks preventing CASCADE wipeout of soft-deleted records.
>   4. TutorialDB single-transaction rollback after failed sidebar publication.
>   5. Real learner-delivery resolver behavior (brand override precedence and draft gating).

---

## 2. Quick Verification Commands for Sol

All commands can be executed directly from repository root:

```bash
# 1. Boundary Check (verifies all 80 SHC API routes have explicit auth/origin guards)
pnpm --filter @quiz/skillhubcore-admin check:boundaries

# 2. TypeScript Compiler Check (verifies zero TS compiler errors)
pnpm --filter @quiz/skillhubcore-admin type-check

# 3. Targeted Concurrency, Hierarchy Safety & Delivery Test Suites (142 tests)
pnpm --filter @quiz/skillhubcore-admin test src/schemas/__tests__/hierarchy-contract.test.ts src/lib/hierarchy/__tests__/ src/app/api/admin/hierarchy/__tests__/ src/app/api/tutorial-left-sidebar/__tests__/

# 4. Question & Project AI Contract Suites (77 tests)
pnpm --filter @quiz/skillhubcore-admin test src/components/questions/ src/app/api/project-llm/ src/lib/project-llm/

# 5. Lint Check (verifies zero ESLint warnings or errors across the workspace)
pnpm --filter @quiz/skillhubcore-admin lint
```

---

## 3. High-Risk Runtime Guarantees for Sol Inspection

### A. Fail-Closed Row Locking (`acquireRowLock`)
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts) lines 24–45.
- **Safeguard:** `acquireRowLock` previously returned silently if `.for()` was missing. It now throws `DependencyCheckUnavailableError`, failing closed with `HTTP 503` whenever row-level locking is unsupported or encounters an error.
- **Test:** `academic-hierarchy-service.test.ts` test case: *"fails closed with 503 if row lock query lacks .for() support"*.

### B. Mandatory Transaction on Destructive Paths (No Direct-Write Fallback)
- **Code:** `academic-hierarchy.service.ts` `executeDestructiveTransaction`.
- **Safeguard:** Removed the unsafe fallback that executed deletions directly when `db.transaction()` was missing. Destructive hierarchy mutations now reject with `HTTP 503` if transaction support is unavailable.
- **Test:** `academic-hierarchy-service.test.ts` test case: *"rejects deletion with 503 if database transaction support is unavailable"*.

### C. Deterministic Deadlock Avoidance in Batch Deletes
- **Code:** `academic-hierarchy.service.ts` `validateBatchDeletePayload` and batch delete methods.
- **Safeguard:** Batch IDs are deduplicated and sorted in deterministic ascending lexicographical order (`uniqueIds.sort()`), and the row lock query includes `.orderBy(table.id)`. This guarantees concurrent transactions acquire locks in identical order, eliminating deadlock risk.
- **Test:** `academic-hierarchy-service.test.ts` test case: *"deterministically sorts batch delete IDs to eliminate deadlock risk"*.

### D. Physical Retention for CASCADE Protection
- **Code:** `academic-hierarchy.service.ts` dependency check queries (`checkDomainDependencies`, `checkSubjectDependencies`, etc.).
- **Safeguard:** Removed `isNull(deletedAt)` from all child foreign key dependency checks. Even if a child record is soft-deleted, its physical presence in PostgreSQL blocks parent deletion with `HTTP 409 Conflict`, preventing physical `ON DELETE CASCADE` triggers from wiping out soft-deleted data.
- **Test:** `academic-hierarchy-service.test.ts` test case: *"blocks deletion with 409 Conflict even if dependent child record has deletedAt set (physical retention check for CASCADE safety)"*.

### E. TutorialDB Sidebar Post-Sync Rollback
- **Code:** [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts)
- **Safeguard:** In TutorialDB, `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` upsert run within a single atomic `tutorialDb.transaction`. If sidebar upsert fails after hierarchy sync, the entire transaction rolls back.
- **Test:** [`sidebar-synchronization-resilience.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts) test case: *"BC-CORR-04: aborts with 500 and rolls back TutorialDB transaction if sidebar insert fails after hierarchy sync"*.

### F. Real Learner Delivery Resolvers (Zero Test Simulations)
- **Code:** [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts)
- **Safeguard:** Eliminated all simulation functions. Tests invoke production `tutorialDeliveryService.getTutorialByPage` and `getPublishedTutorialPagePayload` directly against Drizzle table schemas (`Symbol.for('drizzle:Name')`).
- **Guarantees Tested:** Brand override precedence (`skillup` > `shared`), cross-tenant isolation (SUIA cannot receive RTH content), and draft gating (unreleased content returns null).

---

## 4. Architectural Limits & Invariants
- **MainDB / TutorialDB Boundary:** MainDB row locks do not extend to TutorialDB. Deletions query TutorialDB read-only and fail closed with 503 if TutorialDB is unreachable.
- **Zero Live Database Modifications:** No DDL, migrations, or live database mutations were performed.
- **Canonical Ledger Untouched:** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly intact.

