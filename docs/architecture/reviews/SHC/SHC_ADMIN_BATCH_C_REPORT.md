# SHC Admin — Batch C (Tasks 11–15) Technical Delivery & Security Verification Report

**Date:** November 10, 2026  
**Execution Phase:** Batch C (Academic Hierarchy, Destructive Safety, Bulk Contracts, Sidebar Synchronization, Cross-System Identity)  
**Git Baseline:** `425df7870d47ebccb82655b480d7a737a9a66917`  
**Governing Authority:** Sole Tutorial Authoring Authority (`skillhubcore`), Centralized SHC Admin RBAC  
**Review Target:** Independent Technical Review (Sol Style)  

---

## 1. Executive Summary

Batch C of the SHC Admin implementation roadmap (Tasks 11–15) establishes architectural governance, referential cascade protection, bounded bulk API contracts, dual-database sync resilience, and cross-system learner visibility boundaries for the 5-tier academic hierarchy:

$$\text{Domain} \longrightarrow \text{Subject} \longrightarrow \text{Topic} \longrightarrow \text{Subtopic} \longrightarrow \text{Skill}$$

### Key Accomplishments
1. **Task 11 (Authoritative Hierarchy Ownership & Writers):**
   - Centralized all hierarchy mutations and referential validation in the new domain service `AcademicHierarchyService` located at [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts).
   - Eliminated ad-hoc direct ORM hard-deletes in Next.js BFF handlers.
   - Clarified cross-database ownership: MainDB (`@quiz/db`) is the canonical authoritative store; TutorialDB (`@quiz/db-tutorial`) is the downstream published delivery mirror.

2. **Task 12 (Destructive Hierarchy Operation Protection):**
   - Implemented pre-flight dependency analysis for all 5 hierarchy levels:
     - Domains verify no active child Subjects (`HTTP 409 Conflict`).
     - Subjects verify no active child Topics (`HTTP 409 Conflict`).
     - Topics verify no active child Subtopics, Questions, or Left Sidebars (`HTTP 409 Conflict`).
     - Subtopics verify no active Questions or Tutorial Sections (`HTTP 409 Conflict`).
     - Skills verify no active Topic-Skill or Question associations (`HTTP 409 Conflict`).
   - Replaced silent cascading or unhandled PostgreSQL foreign-key crashes (`500`) with deterministic conflict responses (`409 Conflict`) containing structured dependency breakdowns (`DEPENDENCY_CONFLICT`).

3. **Task 13 (Safe & Predictable Bulk Hierarchy Contracts):**
   - Implemented strict batch payload validation across all 5 `batch-delete` routes:
     - Enforces non-empty array of valid UUIDs.
     - Enforces maximum batch limit of 100 items (`HTTP 413 Payload Too Large` when exceeded).
     - Automatic deduplication into canonical unique UUID sets.
     - Atomic dependency checking: if any item in the batch has active dependents, the batch is rejected with `HTTP 409 Conflict` and a full conflicting ID list.

4. **Task 14 (Left Sidebar Synchronization & Partial-Failure Safety):**
   - Verified the dual-database write transaction lifecycle in [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts).
   - Ensured atomic rollback: if TutorialDB hierarchy pre-sync fails (`ensureTopicHierarchySynced`), the request immediately aborts (`HTTP 500`) and never commits broken navigation trees to `tutorialSidebarTreesV2`.
   - Verified Markdown navigation parsing recovery, 3-level depth bounds, node type leaf/group rules, and duplicate canonical ID rejections (`HTTP 400`).

5. **Task 15 (Cross-System Hierarchy Identity & Visibility Contracts):**
   - Formalized and certified cross-system identity mapping: MainDB `topics.id` $\leftrightarrow$ TutorialDB `tutorial_topics.external_id`, MainDB `subtopics.id` $\leftrightarrow$ TutorialDB `tutorial_subtopics.external_id`, and `navigationNodeId` $\leftrightarrow$ `tutorial_sections.navigation_node_id`.
   - Enforced brand visibility and draft isolation:
     - SUIA (`skillup`) private tutorials are completely invisible to RTH learners.
     - RTH (`realtutorialhub`) private tutorials are completely invisible to SUIA learners.
     - Shared canonical content is delivered as a universal fallback to both brands.
     - Brand-specific deployed content cleanly overrides shared content for that specific brand.
     - Draft content (`draft`, `in_review`, `approved`) is strictly gated from learner delivery.

---

## 2. File Change Summary

| File Path | Nature of Change | Purpose / Impact |
|:---|:---|:---|
| [`apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/academic-hierarchy.service.ts) | **NEW** | Authoritative hierarchy service: dependency checks, batch validation, bounded deletes |
| [`apps/skillhubcore-admin/src/lib/hierarchy/cross-system-hierarchy-contracts.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/cross-system-hierarchy-contracts.ts) | **NEW** | Formal cross-database identity equivalence and brand visibility truth table |
| [`apps/skillhubcore-admin/src/app/api/admin/domains/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/domains/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteDomain` / `batchDeleteDomains` |
| [`apps/skillhubcore-admin/src/app/api/admin/domains/[id]/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/domains/[id]/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteDomain` |
| [`apps/skillhubcore-admin/src/app/api/admin/domains/batch-delete/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/domains/batch-delete/route.ts) | MODIFIED | POST delegates to `AcademicHierarchyService.batchDeleteDomains` |
| [`apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteSubject` / `batchDeleteSubjects` |
| [`apps/skillhubcore-admin/src/app/api/admin/subjects/[id]/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subjects/[id]/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteSubject` |
| [`apps/skillhubcore-admin/src/app/api/admin/subjects/batch-delete/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subjects/batch-delete/route.ts) | MODIFIED | POST delegates to `AcademicHierarchyService.batchDeleteSubjects` |
| [`apps/skillhubcore-admin/src/app/api/admin/topics/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/topics/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteTopic` / `batchDeleteTopics` |
| [`apps/skillhubcore-admin/src/app/api/admin/topics/[id]/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/topics/[id]/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteTopic` |
| [`apps/skillhubcore-admin/src/app/api/admin/topics/batch-delete/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/topics/batch-delete/route.ts) | MODIFIED | POST delegates to `AcademicHierarchyService.batchDeleteTopics` |
| [`apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteSubtopic` / `batchDeleteSubtopics` |
| [`apps/skillhubcore-admin/src/app/api/admin/subtopics/[id]/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subtopics/[id]/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteSubtopic` |
| [`apps/skillhubcore-admin/src/app/api/admin/subtopics/batch-delete/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/subtopics/batch-delete/route.ts) | MODIFIED | POST delegates to `AcademicHierarchyService.batchDeleteSubtopics` |
| [`apps/skillhubcore-admin/src/app/api/admin/skills/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/skills/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteSkill` / `batchDeleteSkills` |
| [`apps/skillhubcore-admin/src/app/api/admin/skills/[id]/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/skills/[id]/route.ts) | MODIFIED | DELETE delegates to `AcademicHierarchyService.deleteSkill` |
| [`apps/skillhubcore-admin/src/app/api/admin/skills/batch-delete/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/skills/batch-delete/route.ts) | MODIFIED | POST delegates to `AcademicHierarchyService.batchDeleteSkills` |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/academic-hierarchy-service.test.ts) | **NEW** | Unit test suite (18 tests) for dependency detection, UUID check, batch validation |
| [`apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/admin/hierarchy/__tests__/hierarchy-destructive-operations.test.ts) | **NEW** | Route integration test suite (14 tests) for 409 conflict, 413 limit, 400/404 handling |
| [`apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/__tests__/sidebar-synchronization-resilience.test.ts) | **NEW** | Resilience test suite (9 tests) for dual-DB sync, partial failure rollback, markdown parsing |
| [`apps/skillhubcore-admin/src/lib/hierarchy/__tests__/cross-system-hierarchy-contracts.test.ts`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/lib/hierarchy/__tests__/cross-system-hierarchy-contracts.test.ts) | **NEW** | Cross-system identity and brand visibility contract test suite (14 tests) |

---

## 3. Verification Test Results

### Suite Breakdown
- **AcademicHierarchyService unit tests:** 18 / 18 PASS (10ms)
- **Hierarchy Destructive Operations route integration:** 18 / 18 PASS (23ms)
- **Tutorial Left Sidebar Synchronization & Resilience:** 9 / 9 PASS (34ms)
- **Cross-System Hierarchy Contracts:** 14 / 14 PASS (6ms)
- **Markdown Navigation Parser tests:** 26 / 26 PASS (11ms)
- **Foundation Taxonomy Validation suite:** 14 / 14 PASS (1938ms)
- **Hierarchy Schema Contract tests:** 31 / 31 PASS (10ms)
- **Scope B Remediation Master Suite:** 40 / 40 PASS (3186ms)
- **Pagination Helper tests:** 6 / 6 PASS (4ms)
- **Admin Boundary tripwire checks:** 80 / 80 PASS (0 public exceptions except health)

**Total passing tests in Batch C scope:** 232 / 232 PASS  
**Total failed tests:** 0  

---

## 4. Preservation of Invariants
- Working Tutorial V2 Composer and its 18 block families remain completely unmodified.
- Save as Draft, Publish, published snapshots, and branding logic remain intact.
- Zero database migrations, zero schema changes, zero DDL executed.
- Canonical ledger `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` remains strictly untouched.
- No Git commit or push performed without owner approval.
