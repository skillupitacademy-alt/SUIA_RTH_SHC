# SHC Admin — Batch C Change Matrix (Tasks 11–15)

**Baseline Commit:** `425df7870d47ebccb82655b480d7a737a9a66917`  
**Phase:** Batch C (Academic Hierarchy Ownership, Destructive Safety, Bulk Contracts, Sidebar Resilience, Downstream Identity)  
**Target Date:** November 10, 2026  

---

## 1. Traceability Matrix: Acceptance Criteria vs Implementation

| Acceptance Criterion | Description / Focus | Implementation Location | Verification Evidence |
|:---|:---|:---|:---|
| **SHCA-F11** | Hierarchy admin flows perform direct ORM hard-deletes without dependency analysis | Centralized in `AcademicHierarchyService.delete*` and `batchDelete*` with pre-flight child checks | `academic-hierarchy-service.test.ts` (18 tests), `hierarchy-destructive-operations.test.ts` (14 tests) |
| **SHCA-A04** | Direct ORM CRUD operations in BFF routes and unverified hard-deletes | Route handlers in `domains`, `subjects`, `topics`, `subtopics`, `skills` delegate all deletions to authoritative service | Route handlers updated; `foundation-validation.test.ts` (14 tests) passing |
| **SHCA-U01** | Academic hierarchy routes perform direct SQL/ORM CRUD mutations instead of delegating to domain service | Extracted domain logic into `AcademicHierarchyService` at `apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts` | Unit tests verify domain service encapsulation |
| **SHCA-U02** | BFF handlers mix HTTP orchestration with database persistence; dual-DB persistence without transaction isolation | Left sidebar route strictly isolates hierarchy sync inside `tutorialDb.transaction`, rolling back on failure before sidebar write | `sidebar-synchronization-resilience.test.ts` (9 tests) passing |
| **SHCA-U08** | Hierarchy handlers perform unverified hard deletes | Denies unsafe deletion with HTTP 409 Conflict, structured dependency breakdown, and zero unapproved schema changes | HTTP 409 conflict responses verified for all 5 hierarchy levels |
| **SHCA-U06** | Bounded pagination, rate/size limits, canonical IDs, duplicate key handling | `validateBatchDeletePayload` enforces array, UUID regex, max 100 items (HTTP 413), deduplication | `academic-hierarchy-service.test.ts`, `pagination-helper.test.ts` passing |
| **SHCA-F23** | Destructive write action safety, idempotency, confirmed-success semantics | Atomic batch verification: if ANY item has dependents, the entire batch is blocked with 409 | Batch rejection and success semantics verified across routes |
| **SHCA-F16** | Tutorial sidebar builder functions; API route orchestrates cross-DB sync; failure recovery | Dual-DB write order: input validation $\rightarrow$ hierarchy validation $\rightarrow$ transactional sync $\rightarrow$ versioned sidebar save | `sidebar-synchronization-resilience.test.ts` tests 1–9 passing |
| **SHCA-A07** | Dual-DB hierarchy sync and navigation publishing transactional atomicity | `ensureTopicHierarchySynced` uses `tutorialDb.transaction`; failure aborts with 500 without corrupting `tutorialSidebarTreesV2` | Rollback and uncorrupted state verified under simulated failure |
| **SHCA-I02** | Parity of content and assessment consumption by SUIA and RTH learner web portals | Certified cross-database identity mapping (`topics.id` $\leftrightarrow$ `external_id`, `subtopics.id` $\leftrightarrow$ `external_id`, `node.id` $\leftrightarrow$ `navigation_node_id`) | `cross-system-hierarchy-contracts.test.ts` (14 tests) passing |
| **SHCA-I04** | Cross-app compatibility and shared database schemas | `cross-system-hierarchy-contracts.ts` guarantees backward compatibility and consistent delivery | Verified against `tutorialDeliveryService` contracts |
| **SHCA-U05** | Brand visibility and cross-brand negative enforcement | Verified truth table: SUIA learner never sees RTH content, RTH learner never sees SUIA content, drafts are strictly blocked | Comprehensive brand isolation tests passing |

---

## 2. API Route & Contract Changes

| Endpoint | Method | Previous Behavior | Batch C Hardened Behavior | Status Codes |
|:---|:---:|:---|:---|:---:|
| `/api/admin/domains` | DELETE | Direct ORM delete; 500 on foreign key constraint | Pre-flight dependency check; 409 on child subjects; batch bounded to 100 | 200, 400, 404, 409, 413, 500 |
| `/api/admin/domains/[id]` | DELETE | Direct ORM delete; 500 on foreign key constraint | Pre-flight dependency check via `AcademicHierarchyService.deleteDomain` | 200, 400, 404, 409, 500 |
| `/api/admin/domains/batch-delete` | POST | Unbounded array; direct delete; 500 on foreign key | Validates JSON, UUIDs, max 100 items, atomic dependency check (409) | 200, 400, 409, 413, 500 |
| `/api/admin/subjects` | DELETE | Direct ORM delete; 500 on foreign key constraint | Pre-flight dependency check; 409 on child topics; batch bounded to 100 | 200, 400, 404, 409, 413, 500 |
| `/api/admin/subjects/[id]` | DELETE | Direct ORM delete; 500 on foreign key constraint | Pre-flight dependency check via `AcademicHierarchyService.deleteSubject` | 200, 400, 404, 409, 500 |
| `/api/admin/subjects/batch-delete` | POST | Unbounded array; direct delete; 500 on foreign key | Validates JSON, UUIDs, max 100 items, atomic dependency check (409) | 200, 400, 409, 413, 500 |
| `/api/admin/topics` | DELETE | Direct ORM delete; silent cascades or 500 | Pre-flight check on subtopics, questions, sidebars; 409 on conflict | 200, 400, 404, 409, 413, 500 |
| `/api/admin/topics/[id]` | DELETE | Direct ORM delete; silent cascades or 500 | Pre-flight check on subtopics, questions, sidebars; 409 on conflict | 200, 400, 404, 409, 500 |
| `/api/admin/topics/batch-delete` | POST | Unbounded array; direct delete; 500 on foreign key | Validates JSON, UUIDs, max 100 items, atomic dependency check (409) | 200, 400, 409, 413, 500 |
| `/api/admin/subtopics` | DELETE | Direct ORM delete; silent cascades or 500 | Pre-flight check on questions, tutorial sections; 409 on conflict | 200, 400, 404, 409, 413, 500 |
| `/api/admin/subtopics/[id]` | DELETE | Direct ORM delete; silent cascades or 500 | Pre-flight check on questions, tutorial sections; 409 on conflict | 200, 400, 404, 409, 500 |
| `/api/admin/subtopics/batch-delete` | POST | Unbounded array; direct delete; 500 on foreign key | Validates JSON, UUIDs, max 100 items, atomic dependency check (409) | 200, 400, 409, 413, 500 |
| `/api/admin/skills` | DELETE | Direct ORM delete; silent cascades or 500 | Pre-flight check on topicSkills, questions; 409 on conflict | 200, 400, 404, 409, 413, 500 |
| `/api/admin/skills/[id]` | DELETE | Direct ORM delete; silent cascades or 500 | Pre-flight check on topicSkills, questions; 409 on conflict | 200, 400, 404, 409, 500 |
| `/api/admin/skills/batch-delete` | POST | Unbounded array; direct delete; 500 on foreign key | Validates JSON, UUIDs, max 100 items, atomic dependency check (409) | 200, 400, 409, 413, 500 |
| `/api/tutorial-left-sidebar` | POST | Dual-DB persistence; failure recovery gap | Atomically aborted before saving sidebar if hierarchy sync fails (500) | 200, 400, 403, 500 |

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

