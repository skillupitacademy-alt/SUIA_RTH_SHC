# SHC Admin — Batch C Change Matrix (Tasks 11–15)

**Baseline Commit:** `e49baed66d8067a0a89f4edbf46149578c0d0b74` (GitHub HEAD)  
**Phase:** Batch C Hardened Delivery (Academic Hierarchy Ownership, Destructive Safety, Bulk Contracts, Sidebar Resilience, Downstream Identity)  
**Target Date:** November 10, 2026  

---

## 1. Traceability Matrix: Acceptance Criteria vs Implementation

| Acceptance Criterion | Description / Focus | Implementation Location | Remediation Status & Verification Evidence |
|:---|:---|:---|:---|
| **SHCA-F11** | Hierarchy admin flows perform direct ORM hard-deletes without dependency analysis | Centralized in `AcademicHierarchyService.delete*` and `batchDelete*` with pre-flight child checks and `.for('update')` row locks | **RESOLVED**: `academic-hierarchy-service.test.ts` (29 tests), `hierarchy-destructive-operations.test.ts` (19 tests) |
| **SHCA-A04** | Direct ORM CRUD operations in BFF routes and unverified hard-deletes | Route handlers in `domains`, `subjects`, `topics`, `subtopics`, `skills` delegate all deletions to authoritative service | **RESOLVED**: 15 API route handlers delegate to `AcademicHierarchyService`; 113 Batch C tests passing |
| **SHCA-U01** | Academic hierarchy routes perform direct SQL/ORM CRUD mutations instead of delegating to domain service | Centralized destructive mutations, dependency analysis, and transactional isolation in `AcademicHierarchyService` (`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`) | **PARTIALLY REMEDIATED / PENDING DOMAIN EXTRACTION**: Destructive operations, cascade prevention, row locking, and UUID/batch validations centralized. Extracting create/update (`POST`, `PATCH`, `PUT`) into a separate domain package is classified as PENDING to avoid unapproved wide-scale refactoring. |
| **SHCA-U02** | BFF handlers mix HTTP orchestration with database persistence; dual-DB persistence without transaction isolation | Left sidebar route isolates hierarchy sync and sidebar persistence in a single `tutorialDb.transaction`, rolling back cleanly on failure | **RESOLVED (TutorialDB Atomic Boundary)**: Reads from MainDB are read-only; mutations in TutorialDB commit or rollback atomically; verified with post-sync failure rollback test in `sidebar-synchronization-resilience.test.ts` (10 tests). |
| **SHCA-U08** | Hierarchy handlers perform unverified hard deletes | Denies unsafe deletion with HTTP 409 Conflict, structured dependency breakdown, fail-closed 503 on DB error, physical row retention checks (CASCADE protection), and zero unapproved schema changes | **RESOLVED**: Fail-closed 503, 409 conflict responses, and physical row retention verified for all 5 hierarchy levels; zero DDL changes. |
| **SHCA-U06** | Bounded pagination, rate/size limits, canonical IDs, duplicate key handling | `validateBatchDeletePayload` enforces array, UUID regex, max 100 items (HTTP 413), deduplication | **RESOLVED**: `academic-hierarchy-service.test.ts`, `hierarchy-destructive-operations.test.ts` passing |
| **SHCA-F23** | Destructive write action safety, idempotency, confirmed-success semantics | Transaction-wrapped batch verification: if ANY item has dependents, row lock fails, or storage check fails, the transaction aborts with 409/503 | **RESOLVED**: Batch all-or-none semantics and row-level locking (`SELECT FOR UPDATE`) verified under `db.transaction`. |
| **SHCA-F16** | Tutorial sidebar builder functions; API route orchestrates cross-DB sync; failure recovery | Dual-DB write order: input validation $\rightarrow$ hierarchy validation $\rightarrow$ transactional sync $\rightarrow$ versioned sidebar save | **RESOLVED**: `sidebar-synchronization-resilience.test.ts` tests 1–10 passing. |
| **SHCA-A07** | Dual-DB hierarchy sync and navigation publishing transactional atomicity | `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` upsert executed inside a single `tutorialDb.transaction`; failure aborts with 500 without leaving broken state | **RESOLVED**: TutorialDB atomicity and clean post-sync failure rollback verified; MainDB read-only boundary documented; no distributed 2PC overclaimed. |
| **SHCA-I02** | Parity of content and assessment consumption by SUIA and RTH learner web portals | Certified cross-database identity mapping (`topics.id` $\leftrightarrow$ `external_id`, `subtopics.id` $\leftrightarrow$ `external_id`, `node.id` $\leftrightarrow$ `navigation_node_id`) | **RESOLVED**: `cross-system-hierarchy-contracts.test.ts` (14 tests) and `downstream-delivery-contracts.test.ts` (10 tests) passing with real production resolvers. |
| **SHCA-I04** | Cross-app compatibility and shared database schemas | `cross-system-hierarchy-contracts.ts` guarantees backward compatibility and consistent delivery | **RESOLVED**: Real delivery contracts (`tutorialDeliveryService.getTutorialByPage`, `getPublishedTutorialPagePayload`) verified without simulations. |
| **SHCA-U05** | Brand visibility and cross-brand negative enforcement | Verified truth table: SUIA learner never sees RTH content, RTH learner never sees SUIA content, drafts are strictly blocked | **RESOLVED**: Multi-tenant brand isolation and draft gating certified by integration tests. |

---

## 2. API Route & Contract Changes

| Endpoint | Method | Previous Baseline (`fa8f09b4`) | Hardened Behavior (Commit `e49baed6` + Working Tree) | Status Codes |
|:---|:---:|:---|:---|:---:|
| `/api/admin/domains` | DELETE | Swallow DB error on check (fail open); out-of-tx delete | Fail closed (`DependencyCheckUnavailableError` $\rightarrow$ 503); row lock (`.for('update')`); transaction-wrapped delete (409 on child subjects, physical retention) | 200, 400, 404, 409, 413, 500, 503 |
| `/api/admin/domains/[id]` | DELETE | Swallow DB error on check (fail open); out-of-tx delete | Fail closed (503); row lock; transaction-wrapped delete (`AcademicHierarchyService.deleteDomain`) | 200, 400, 404, 409, 500, 503 |
| `/api/admin/domains/batch-delete` | POST | Swallow DB error on check (fail open); out-of-tx delete | Fail closed (503); row locks; transaction-wrapped batch delete; max 100 items; atomic all-or-none check | 200, 400, 409, 413, 500, 503 |
| `/api/admin/subjects` | DELETE | Swallow DB error on check (fail open); out-of-tx delete | Fail closed (503); row lock; transaction-wrapped delete (409 on child topics, physical retention) | 200, 400, 404, 409, 413, 500, 503 |
| `/api/admin/subjects/[id]` | DELETE | Swallow DB error on check (fail open); out-of-tx delete | Fail closed (503); row lock; transaction-wrapped delete (`AcademicHierarchyService.deleteSubject`) | 200, 400, 404, 409, 500, 503 |
| `/api/admin/subjects/batch-delete` | POST | Swallow DB error on check (fail open); out-of-tx delete | Fail closed (503); row locks; transaction-wrapped batch delete; max 100 items; atomic all-or-none check | 200, 400, 409, 413, 500, 503 |
| `/api/admin/topics` | DELETE | Used reflection for questions check; out-of-tx delete | Direct exported schemas (`questions`, `topicSkills`); physical retention check; row lock; fail closed (503); transaction-wrapped delete | 200, 400, 404, 409, 413, 500, 503 |
| `/api/admin/topics/[id]` | DELETE | Used reflection for questions check; out-of-tx delete | Direct exported schemas; physical retention check; row lock; fail closed (503); transaction-wrapped delete | 200, 400, 404, 409, 500, 503 |
| `/api/admin/topics/batch-delete` | POST | Used reflection for questions check; out-of-tx delete | Direct exported schemas; physical retention check; row locks; fail closed (503); transaction-wrapped batch delete; max 100 items | 200, 400, 409, 413, 500, 503 |
| `/api/admin/subtopics` | DELETE | Reflection for questions check; out-of-tx delete | Direct exported `questions` check; physical retention check; row lock; fail closed (503); transaction-wrapped delete | 200, 400, 404, 409, 413, 500, 503 |
| `/api/admin/subtopics/[id]` | DELETE | Reflection for questions check; out-of-tx delete | Direct exported `questions` check; physical retention check; row lock; fail closed (503); transaction-wrapped delete | 200, 400, 404, 409, 500, 503 |
| `/api/admin/subtopics/batch-delete` | POST | Reflection for questions check; out-of-tx delete | Direct exported `questions` check; physical retention check; row locks; fail closed (503); transaction-wrapped batch delete | 200, 400, 409, 413, 500, 503 |
| `/api/admin/skills` | DELETE | Reflection for topicSkills; out-of-tx delete | Direct exported `topicSkills`, `questionSkills`, `questions`; physical retention check; row lock; fail closed (503); transaction delete | 200, 400, 404, 409, 413, 500, 503 |
| `/api/admin/skills/[id]` | DELETE | Reflection for topicSkills; out-of-tx delete | Direct exported `topicSkills`, `questionSkills`, `questions`; physical retention check; row lock; fail closed (503); transaction delete | 200, 400, 404, 409, 500, 503 |
| `/api/admin/skills/batch-delete` | POST | Reflection for topicSkills; out-of-tx delete | Direct exported `topicSkills`, `questionSkills`, `questions`; physical retention check; row locks; fail closed (503); transaction batch delete | 200, 400, 409, 413, 500, 503 |
| `/api/tutorial-left-sidebar` | POST | Separate queries for sync and sidebar tree upsert | Single atomic `tutorialDb.transaction` wraps both `ensureTopicHierarchySynced` and `tutorialSidebarTreesV2` upsert; verified rollback on post-sync failure | 200, 400, 403, 500 |

---

## 3. Brand & Publication Lifecycle Truth Table

| Learner Context | Content Brand | Lifecycle Status | Delivery Outcome | Rationale |
|:---:|:---:|:---:|:---:|:---|
| `skillup` (SUIA) | `skillup` | `deployed` | **DELIVERED** | Exact brand-specific override takes precedence |
| `skillup` (SUIA) | `shared` | `deployed` | **DELIVERED** | Universal canonical fallback when no brand override exists |
| `skillup` (SUIA) | `realtutorialhub` | `deployed` | **BLOCKED (null)** | Cross-tenant negative enforcement strictly isolates tenant content |
| `skillup` (SUIA) | any | `draft` / `approved` | **BLOCKED (null)** | Unreleased content is completely hidden from learners |
| `realtutorialhub` | `realtutorialhub` | `deployed` | **DELIVERED** | Exact brand-specific override takes precedence |
| `realtutorialhub` | `shared` | `deployed` | **DELIVERED** | Universal canonical fallback when no brand override exists |
| `realtutorialhub` | `skillup` | `deployed` | **BLOCKED (null)** | Cross-tenant negative enforcement strictly isolates tenant content |
| `realtutorialhub` | any | `draft` / `approved` | **BLOCKED (null)** | Unreleased content is completely hidden from learners |
