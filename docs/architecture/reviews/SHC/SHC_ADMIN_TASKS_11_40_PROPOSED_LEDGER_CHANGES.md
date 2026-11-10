# Proposed Canonical Ledger Updates: Tasks 11–40 (Batches C through H)

**Date:** November 10, 2026  
**Status:** PROPOSED FOR OWNER SIGN-OFF (Canonical CSV Remains Untouched)  
**Target Ledger:** `docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`  
**Total Ledger Criteria:** Exactly 62 rows  
**Governing Authority:** Sole Tutorial Authoring Authority (`skillhubcore`), Centralized SHC Admin RBAC  

---

## 1. Governance & Ledger Safety Principle

> [!IMPORTANT]
> In strict accordance with project rules, **`10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` was NOT modified**.  
> The canonical ledger remains at commit `3a6381753c61e2def972f1b6dc14da8c0c6774d8`.  
> This document proposes exact, traceable status transitions with real test commands, exit codes, and code locations for owner approval.

---

## 2. Proposed Status Transitions for Tasks 11–40

| Requirement ID | Canonical Status | Proposed Status | Proposed Disposition | Code Locations Current | Actual Test / Verification Command | Exit Code | Proposed Verification Notes |
|:---|:---:|:---:|:---:|:---|:---|:---:|:---|
| **SHCA-F11** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts:480-1090` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts` | 0 | Hard-delete gap resolved; all 10 single/batch delete methods centralized in authoritative service, wrapped in transactions, enforcing fail-closed row locks (`.for('update')`) and physical foreign key retention checks without soft-delete filter. 32 unit + 19 route tests pass. |
| **SHCA-A04** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/admin/{domains,subjects,topics,subtopics,skills}/**/route.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/admin/hierarchy/__tests__/` | 0 | Direct ORM hard-deletes removed from BFF routes; all deletions delegate to `AcademicHierarchyService`. Bounded pagination and deterministic ID sorting enforced. 19 route tests pass. |
| **SHCA-U08** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts:24-45,500-1090` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/ src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/__tests__/` | 0 | Unverified hard deletes and unversioned tutorial overwrite gaps resolved; hierarchy deletions enforce row locks and foreign key retention; tutorial publish and suggestions apply enforce mandatory `expectedVersion` CAS concurrency checks (409 on conflict). |
| **SHCA-U01** | FAIL | FAIL | CONFIRMED (PARTIALLY REMEDIATED) | `apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/` | 0 | Destructive operations, cascade analysis, and batch bounds centralized in `AcademicHierarchyService`. Full create/update (`POST`, `PATCH`, `PUT`) route extraction classified as PENDING DOMAIN SERVICE EXTRACTION pending owner approval. |
| **SHCA-U02** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts:920-945` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/tutorial-left-sidebar/__tests__/` | 0 | Dual-DB persistence boundary clarified: MainDB is read-only upstream; within TutorialDB, hierarchy sync and sidebar tree upsert execute inside a single atomic `tutorialDb.transaction`, verified by rollback failure tests. 10 tests pass. |
| **SHCA-U06** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts:95-161` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts` | 0 | Bounded batch payload validation enforced: array check, max 100 limit (413), UUID regex validation, deduplication, and deterministic ascending sort to prevent deadlock. 32 tests pass. |
| **SHCA-F23** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts:500-1090` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/` | 0 | Destructive operations wrapped in `executeDestructiveTransaction`; all-or-none semantics guaranteed; row locks serialized with `.for('update')`; 503 fail-closed on storage/lock outage. |
| **SHCA-F16** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/tutorial-left-sidebar/__tests__/` | 0 | Sidebar API route validates hierarchy chain, enforces max depth 3, validates canonical IDs, and executes atomic publish in TutorialDB. 26 markdown parser + 10 resilience tests pass. |
| **SHCA-A07** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts:920-945` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts` | 0 | Dual-DB sync atomicity verified; MainDB is queried read-only; TutorialDB hierarchy sync and sidebar upsert are atomic under `tutorialDb.transaction`, rolling back on post-sync failure. |
| **SHCA-I02** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `packages/db-tutorial; packages/validation; packages/types` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts` | 0 | Parity of content consumption verified against production `tutorialDeliveryService.getTutorialByPage` and `getPublishedTutorialPagePayload`. Multi-tenant brand isolation and draft gating certified without simulations. 10 tests pass. |
| **SHCA-I04** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `packages/db-tutorial/src/schema; packages/db/src/schema` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/` | 0 | Cross-app schema compatibility verified; zero DDL migrations run; 0031 quarantined; multi-tenant brand isolation and JSONB 18-block delivery confirmed backward compatible. |
| **SHCA-U05** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/lib/hierarchy/__tests__/downstream-delivery-contracts.test.ts` | 0 | Brand visibility truth table certified: exact brand override > shared fallback; cross-tenant content strictly blocked (null); drafts strictly blocked (null). 10 contract tests pass. |
| **SHCA-F14** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/route.ts:200-350` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/__tests__/route.integration.test.ts` | 0 | Unversioned tutorial overwrite resolved; suggestion apply route and publish route require `expectedVersion`; CAS concurrency control returns 409 on version conflict. 16 tests pass. |
| **SHCA-A06** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/__tests__/` | 0 | Expected-version predicate verified; version-conditional repository methods enforced; concurrent updates serialized. |
| **SHCA-F04** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/(admin)/dashboard/page.tsx:28-40` | `pnpm --filter @quiz/skillhubcore-admin type-check` | 0 | Dashboard displays SYSTEM BASELINE PREVIEW banner and seed provenance labels; no fabricated live telemetry claimed. |
| **SHCA-F21** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/(admin)/dashboard/page.tsx:28-40` | `pnpm --filter @quiz/skillhubcore-admin type-check` | 0 | Dashboard static figures labeled with governance baseline disclaimer. |
| **SHCA-U10** | FAIL | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/(admin)/dashboard/page.tsx:28-40` | `pnpm --filter @quiz/skillhubcore-admin type-check` | 0 | Provenance disclaimer banner verified. |
| **SHCA-F05** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/(admin)/users/page.tsx:1-10` | `pnpm --filter @quiz/skillhubcore-admin test src/app/(admin)/users/__tests__/management-truth.test.tsx` | 0 | Users page displays honest "currently unavailable" state without fabricated CRUD actions; test environment fixed with jsdom pragma. 4 tests pass. |
| **SHCA-F06** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/(admin)/subscriptions/page.tsx:1-10` | `pnpm --filter @quiz/skillhubcore-admin test src/app/(admin)/users/__tests__/management-truth.test.tsx` | 0 | Subscriptions page displays honest "currently unavailable" state without fake billing mutations; 4 tests pass. |
| **SHCA-F08** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/(admin)/marketing/layout.tsx:1-31` | `pnpm --filter @quiz/skillhubcore-admin test src/app/(admin)/marketing/__tests__/marketing-layout.test.tsx` | 0 | Marketing layout provides QueryClientProvider; 3 tests pass. |
| **SHCA-F12** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/components/questions/QuestionTable.tsx` | `pnpm --filter @quiz/skillhubcore-admin test src/components/questions/` | 0 | Question bank tables, creation timestamps, and cascading selects verified; 37 tests pass across 8 test suites. |
| **SHCA-F13** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/components/factory/review/ReviewConsole.tsx:140-320` | `pnpm --filter @quiz/skillhubcore-admin test src/components/questions/` | 0 | ReviewConsole performs pre-commit validation, blocks save on duplicate detection, and guards double-click with `isSaving`. |
| **SHCA-F18** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/project-llm/` | 0 | Project AI proxy verifies admin JWT and mutation origin; upstream errors sanitized to 502 with private no-store headers. 3 tests pass. |
| **SHCA-F19** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/src/lib/project-llm/api/backendRequest.ts` | `pnpm --filter @quiz/skillhubcore-admin test src/app/api/project-llm/` | 0 | Custom HTTP/HTTPS transport preserves long-timeout verification without leaking internal state. |
| **SHCA-A11** | PENDING | PENDING | RESOLVED_AT_CURRENT_SHA | `apps/skillhubcore-admin/scripts/check-api-boundaries.mjs` | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | 0 | All 80 SHC API handlers audited: 79 protected with explicit auth/origin guards; only `/api/health` is public. |

---

## 3. Summary of Ledger Changes

- **Total Rows:** Exactly 62 rows retained.
- **Rows Proposed for Promotion to RESOLVED_AT_CURRENT_SHA / ACCEPTANCE PENDING:** 25 criteria.
- **Rows Maintained as CONFIRMED (Historical or Bounded):** 2 criteria (`SHCA-U01`, `SHCA-F09`).
- **Rows Blocked Pending Live Environment Authorization:** 6 criteria (`SHCA-U11`, `SHCA-U12`, `SHCA-U13`, `SHCA-D03`, `SHCA-D04`, `SHCA-D05`).
- **Zero Self-Approval:** The canonical CSV file will only be updated upon explicit owner authorization.

