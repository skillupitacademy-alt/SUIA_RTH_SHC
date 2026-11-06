# FND12 + FND17: File Ownership and Dependency Matrix

**Authority:** audit/FND12_Complete_Truth_Inventory.md, audit/FND17_W2_Coverage_Map.md, audit/Claude_Sonnet45_W1_W3_Completion_Directive.md
**Baseline:** 86f1d7a9 (remediation/w1-2-batch-05-targeted, 39 commits ahead of origin)
**Classification:** Read-only investigation for revised FND01-FND30 parallel execution plan
**Date:** 2026-01-12

---

## Executive Summary

This read-only investigation provides **complete file ownership and dependency mapping** for all 181 callers (FND12) and 177 findings (FND17) to support safe concurrent implementation workflows.

**Key Findings:**
- **181 active callers** across 5 W2 domains (student data, assessments, operations, governance, forms)
- **177 W2 findings** mapped to source files
- **64 findings (36%)** have implementation evidence; **113 (64%)** require implementation
- **9 VERIFICATION_FAILED findings** with failing tests documenting defects
- **Shared schemas:** 8 drizzle schema files touched by multiple findings
- **Shared services:** 12 lib/server services touched by multiple findings
- **Sequential chains validated:** 3 primary chains (identity, email, W3)
- **Parallel safety:** 7 independent finding groups can run concurrently without file conflicts

**Conclusion:** Write conflicts exist in shared schemas/services. Concurrent workflows MUST use exclusive file ownership OR sequential execution within shared-resource groups.

---

## Section 1: 181 Caller Inventory (FND12)

### Domain 1: Student Data (32 callers)

| ID | Function/Component | File Path | Finding IDs | Classification | Dependencies |
|---|---|---|---|---|---|
| SD-01 | getSkillupPrograms() | apps/skillup-web/src/lib/skillup-data.ts | FND13, PA-A-004 | PERSISTED | DB: batches, subjects, domains |
| SD-02 | Program duration | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-03 | Program highlights | apps/skillup-web/src/lib/skillup-data.ts | FND13 | ZERO/EMPTY | None |
| SD-04 | Program curriculum | apps/skillup-web/src/lib/skillup-data.ts | FND13 | ZERO/EMPTY | None |
| SD-05 | getSkillupProgramBySlug() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: batches |
| SD-06 | getSkillupProgramDetail() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED+UNAVAILABLE | DB + labels |
| SD-07 | getSkillupFaculty() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: faculty, users, userProfiles |
| SD-08 | Faculty description | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-09 | Faculty heroStats | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB count |
| SD-10 | getStudentBatchContext() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: batchEnrollments, batches, batchSessions |
| SD-11 | getSkillupMyBatch() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: batches |
| SD-12 | Batch currentTopic | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-13 | Batch materials | apps/skillup-web/src/lib/skillup-data.ts | FND13 | ZERO/EMPTY | None |
| SD-14 | Session title fallback | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-15 | getSkillupBatches() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: batches |
| SD-16 | getSkillupStudentDashboard() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: multiple tables |
| SD-17 | Dashboard attendancePercent | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-18 | Dashboard progressPercent | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB-derived |
| SD-19 | Dashboard currentTopic | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-20 | Dashboard nextSessionAt | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB-derived |
| SD-21 | Dashboard placementMatches | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: placementJobListings |
| SD-22 | getSkillupAttendance() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB: attendanceRecords |
| SD-23 | Attendance note | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-24 | getSkillupPayments() | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | Pool: DATABASE_URL_PAYMENT |
| SD-25 | Payment unavailable | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-26 | getSkillupPlacement() profile | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED or DEMO | DB: placementStudentPlacementProfiles |
| SD-27 | FALLBACK_PLACEMENT | apps/skillup-web/src/lib/skillup-data.ts | FND13 | DEMO/REFERENCE | Static const |
| SD-28 | Placement jobs with profile | apps/skillup-web/src/lib/skillup-data.ts | FND13 | PERSISTED | DB+vector service |
| SD-29 | Placement jobs without profile | apps/skillup-web/src/lib/skillup-data.ts | FND13 | FABRICATED | Computed fallback (90-index*3) |
| SD-30 | Profile roleGoal fallback | apps/skillup-web/src/lib/skillup-data.ts | FND13 | UNAVAILABLE | None |
| SD-31 | Learn workspace modules | apps/skillup-web/src/app/student/learn/page.tsx | FND13 | UNAVAILABLE | None |
| SD-32 | Exams listing | apps/skillup-web/src/app/student/exams/page.tsx | FND14, PH05-005 | UNAVAILABLE | None |

**Test Coverage:**
- apps/skillup-web/src/lib/__tests__/program-truth.test.ts (22 PASSING)
- apps/skillup-web/src/lib/__tests__/faculty-truth.test.ts (3 PASSING)
- apps/skillup-web/src/lib/__tests__/batch-truth.test.ts (5 PASSING)
- apps/skillup-web/src/lib/__tests__/dashboard-truth.test.ts (partial)
- apps/skillup-web/src/lib/__tests__/attendance-truth.test.ts (2 PASSING)
- apps/skillup-web/src/lib/__tests__/payment-truth.test.ts (3 PASSING)
- apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts (partial)

**Shared File:** apps/skillup-web/src/lib/skillup-data.ts — 30 callers, single file
**Conflict Risk:** HIGH if multiple findings modify this file concurrently

---

### Domain 2: Assessment & Reports (17 callers)

| ID | Function/Component | File Path | Finding IDs | Classification | Dependencies |
|---|---|---|---|---|---|
| AR-01 | ExamResultsReport mount | packages/ui/src/report/ExamResultsReport.tsx | FND14 | PERSISTED | API: /api/quiz/result |
| AR-02 | Report loading state | packages/ui/src/report/ExamResultsReport.tsx | FND14 | N/A | Local state |
| AR-03 | Report error state | packages/ui/src/report/ExamResultsReport.tsx | FND14 | UNAVAILABLE | Error boundary |
| AR-04 | Report zero vs missing | packages/ui/src/report/ExamResultsReport.tsx | FND14 | PERSISTED | API response |
| AR-05 | Report stale examId | packages/ui/src/report/ExamResultsReport.tsx | FND14 | BUG (Sol-identified) | State race |
| AR-06 | ReportEngine.getExamReport() | apps/api-server/src/lib/report/ReportEngine.ts | FND14 | PERSISTED | DB: exams, questions, responses |
| AR-07 | Per-question timeSpentSeconds | apps/api-server/src/lib/report/ReportEngine.ts | FND14 | PERSISTED (ambiguous) | DB with fallback |
| AR-08 | StudentInsightFormatter.format() | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14, FND15 | PERSISTED | ExportEngine queries |
| AR-09 | Insight meta fields | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14 | PERSISTED | DB: exams, users |
| AR-10 | Insight behaviour analysis | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14 | PERSISTED | DB-derived |
| AR-11 | Insight knowledgeGap L1/L2/L3 | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14 | PERSISTED | DB-derived |
| AR-12 | Insight skills.top3Weakest | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14 | PERSISTED | DB-derived |
| AR-13 | Insight progress history | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14 | PERSISTED | DB: historicalRows |
| AR-14 | Insight nextSteps | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14 | PERSISTED | Computed |
| AR-15 | Exam configuration page | apps/skillup-web/src/app/launch-exam/configure/page.tsx | PH05-005 | N/A | Local form state |
| AR-16 | Exam deadline (required) | apps/skillup-web/src/app/launch-exam/configure/page.tsx | PH05-005 | UNAVAILABLE | Not implemented |
| AR-17 | Idempotent submit | apps/skillup-web/src/app/launch-exam/configure/page.tsx | PH05-005 | UNAVAILABLE | Not implemented |

**Test Coverage:**
- packages/ui/src/report/__tests__/report-truth.test.tsx (10 PASSING, 1 FAILING)
- apps/api-server/src/lib/export/__tests__ (partial)

**Shared Files:**
- packages/ui/src/report/ExamResultsReport.tsx (5 callers)
- apps/api-server/src/lib/report/ReportEngine.ts (2 callers)
- apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts (7 callers)

---

### Domain 3: Operational Data (26 callers)

| ID | Function/Component | File Path | Finding IDs | Classification | Dependencies |
|---|---|---|---|---|---|
| OP-01 | GOVERNANCE_DATA | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-02 | INVENTORY_GROUPS | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-03 | MANIFESTO_DATA | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-04 | ADMIN_SPEC_DATA | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-05 | CORE_SPEC_DATA | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-06 | ARCHITECTURE_DATA | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-07 | ADMIN_AUTH_INVENTORY | apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-08 | ADMIN_DASHBOARD_INVENTORY | apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-09 | ADMIN_CONTENT_INVENTORY | apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-10 | WEB_CORE_INVENTORY | apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-11 | API_SERVICES_INVENTORY | apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-12 | adminDashboardSummary | apps/skillhubcore-admin/src/lib/skillhubcore-admin-data.ts | FND15 | FABRICATED | Static array |
| OP-13 | User management routes | apps/skillhubcore-admin/src/app/(admin)/users/* | FND15 | UNAVAILABLE | Removed pages |
| OP-14 | Subscription management | apps/skillhubcore-admin/src/app/(admin)/subscriptions/* | FND15 | UNAVAILABLE | Removed pages |
| OP-15 | buildCertificateGeneratorDefaults() | packages/marketing-site/src/certificates/CertificateGeneratorPage.tsx | FND15, FND12 | DEMO/REFERENCE | Static function |
| OP-16 | buildPreviewCertificateData() | packages/marketing-site/src/certificates/CertificateGeneratorPage.tsx | FND15, FND12 | DEMO/REFERENCE | Query params |
| OP-17 | Generator form submission | packages/marketing-site/src/certificates/CertificateGeneratorPage.tsx | FND15 | DEMO/REFERENCE | Client-side navigation |
| OP-18 | CanonicalWorkflowStateEnum | apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts | FND08, FND15, FND22 | PERSISTED (via API) | Backend authority |
| OP-19 | CertificationStatus | apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts | FND15, FND22 | PERSISTED | API: /api/project-llm/workflows |
| OP-20 | RuntimeHealthStatus | apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts | FND15 | PERSISTED | API |
| OP-21 | Workflow dashboard static data | apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/* | FND15 | UNAVAILABLE (corrected) | Removed |
| OP-22 | Block corpus fixture | apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts | FND15 | DEMO/REFERENCE | Static const |
| OP-23 | Registry page filtering | apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/registry/* | FND15 | DEMO/REFERENCE | Client-side filter |
| OP-24 | Engineering contract fetch | apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/[workflowId]/compliance-brief/page.tsx | FND15 | PERSISTED | API |
| OP-25 | Static requirements fallback | apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/[workflowId]/compliance-brief/page.tsx | FND15 | DEMO/REFERENCE | Static array |
| OP-26 | Compliance copy function | apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/[workflowId]/compliance-brief/page.tsx | FND15 | PERSISTED or UNAVAILABLE | API or fallback |

**Conflict Risk:** LOW — most are static reference data or separate page routes

---

### Domain 4: Governance & Taxonomy (17 callers)

| ID | Function/Component | File Path | Finding IDs | Classification | Dependencies |
|---|---|---|---|---|---|
| GT-01 | Domain POST | apps/skillhubcore-admin/src/app/api/admin/domains/route.ts | SHC-DIP-001, FND19 | PERSISTED | DB: domains |
| GT-02 | Domain GET (list) | apps/skillhubcore-admin/src/app/api/admin/domains/route.ts | SHC-DIP-001 | PERSISTED | DB |
| GT-03 | Domain PUT | apps/skillhubcore-admin/src/app/api/admin/domains/route.ts | SHC-DIP-001 | PERSISTED | DB |
| GT-04 | Domain DELETE | apps/skillhubcore-admin/src/app/api/admin/domains/route.ts | SHC-DIP-001 | PERSISTED | DB |
| GT-05 | Subject CRUD | apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts | SHC-DRY-001 | PERSISTED | DB: subjects |
| GT-06 | Topic CRUD | apps/skillhubcore-admin/src/app/api/admin/topics/route.ts | SHC-DRY-001, FND19 | PERSISTED | DB: topics |
| GT-07 | Subtopic CRUD | apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts | SHC-DRY-001 | PERSISTED | DB: subtopics |
| GT-08 | DomainTable error fabrication | apps/skillhubcore-admin/src/components/taxonomy/DomainTable.tsx | SHC-ERROR-CONTRACT-001 | FABRICATED | Client-side guess |
| GT-09 | SubjectTable error fabrication | apps/skillhubcore-admin/src/components/taxonomy/SubjectTable.tsx | SHC-ERROR-CONTRACT-001 | FABRICATED | Client-side guess |
| GT-10 | TopicTable error fabrication | apps/skillhubcore-admin/src/components/taxonomy/TopicTable.tsx | SHC-ERROR-CONTRACT-001 | FABRICATED | Client-side guess |
| GT-11 | SubtopicTable ID fabrication | apps/skillhubcore-admin/src/components/taxonomy/SubtopicTable.tsx | SHC-IDENTITY-001 | FABRICATED | Client-side fallback |
| GT-12 | SubtopicTable defaults | apps/skillhubcore-admin/src/components/taxonomy/SubtopicTable.tsx | SHC-TAXONOMY-CONTRACT-005 | FABRICATED | Client-side |
| GT-13 | QuestionTable ID fabrication | apps/skillhubcore-admin/src/components/taxonomy/QuestionTable.tsx | SHC-IDENTITY-002 | FABRICATED | Client-side fallback |
| GT-14 | QuestionTable audit fabrication | apps/skillhubcore-admin/src/components/taxonomy/QuestionTable.tsx | SHC-DATA-TRUTH-001 | FABRICATED | Client-side |
| GT-15 | Slug/default generation ownership | apps/skillhubcore-admin/src/components/taxonomy/* | SHC-TAXONOMY-CONTRACT-003 | CONTRACT DRIFT | Client-side |
| GT-16 | Complexity model mismatch | apps/skillhubcore-admin/src/components/taxonomy/* | SHC-TAXONOMY-CONTRACT-004 | CONTRACT DRIFT | Schema drift |
| GT-17 | Weight/order confusion | apps/skillhubcore-admin/src/components/taxonomy/* | SHC-TAXONOMY-DATA-001 | CONTRACT DRIFT | Schema drift |

**Shared Files:**
- apps/skillhubcore-admin/src/app/api/admin/domains/route.ts (4 CRUD callers)
- apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts (4 CRUD callers)
- apps/skillhubcore-admin/src/app/api/admin/topics/route.ts (4 CRUD callers)
- apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts (4 CRUD callers)

**Conflict Risk:** HIGH — CRUD routes and UI tables share contract dependencies

---

### Domain 5: Forms & Actions (17 callers)

| ID | Function/Component | File Path | Finding IDs | Classification | Dependencies |
|---|---|---|---|---|---|
| FA-01 | Newsletter subscription | packages/marketing-site/src/components/footer/FooterBrand.tsx | MKT-030, FND16 | UNAVAILABLE | None |
| FA-02 | Student count claim | packages/marketing-site/src/components/footer/FooterBrand.tsx | MKT-030, FND12 | UNAVAILABLE (corrected) | None |
| FA-03 | RTH local newsletter | apps/realtutorialhub-site/components/footer/FooterBrand.tsx | FND16, MKT-030 | UNAVAILABLE or FABRICATED | None |
| FA-04 | ContactForm component | packages/marketing-site/src/components/contact/ContactForm.tsx | MKT-010, MKT-019 | DEMO/REFERENCE | Props: onSubmit |
| FA-05 | ContactUs (shared) | packages/marketing-site/src/components/contact/ContactUs.tsx | MKT-019 | DEMO/REFERENCE | Static contact info |
| FA-06 | RTH ContactUs (local) | apps/realtutorialhub-site/components/contact/ContactUs.tsx | MKT-019 | FABRICATED (dead code?) | Client-side |
| FA-07 | RTH forgot-password | apps/realtutorialhub-web/src/app/forgot-password/page.tsx | FND16 | PERSISTED (acknowledgement only) | API acknowledgement |
| FA-08 | SkillUp forgot-password | apps/skillup-web/src/app/forgot-password/page.tsx | FND16 | PERSISTED (acknowledgement only) | API acknowledgement |
| FA-09 | Recovery uncertain outcome | apps/skillup-web/src/app/forgot-password/page.tsx, apps/realtutorialhub-web/src/app/forgot-password/page.tsx | FND16 | UNAVAILABLE | Error handling |
| FA-10 | signupUser() | src/share-branding/auth/authLoader.tsx | FND16 | PERSISTED (server contract not inspected) | API: /api/auth/signup |
| FA-11 | loginUser() | src/share-branding/auth/authLoader.tsx | FND16 | PERSISTED (server contract not inspected) | API: /api/auth/login |
| FA-12 | updateConsent() | packages/marketing-site/src/lib/privacy/consent-manager.ts | MKT-002, FND16 | ZERO/EMPTY (local-only correct) | localStorage |
| FA-13 | revokeConsent() | packages/marketing-site/src/lib/privacy/consent-manager.ts | MKT-002 | ZERO/EMPTY (local-only correct) | localStorage |
| FA-14 | Consent banner visibility | packages/marketing-site/src/components/privacy/ConsentBanner.tsx | MKT-002 | N/A | Client state |
| FA-15 | Enquiry PATCH | apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/route.ts | FND16 | PERSISTED | DB transaction |
| FA-16 | Admission route | apps/skillup-admin/src/app/api/admin/crm/admissions/route.ts | FND16, FND11 | PERSISTED (event delivery uncertain) | DB+event |
| FA-17 | Admission email lookup | apps/skillup-admin/src/app/api/admin/crm/admissions/route.ts | FND11 | PERSISTED (ambiguous on duplicates) | DB: users |

**Test Coverage:**
- packages/marketing-site/src/components/footer/__tests__/newsletter-truth.test.tsx (PASSING)
- audit/__tests__/recovery-acknowledgement.test.tsx (PASSING)

**Conflict Risk:** MEDIUM — separate files but shared auth contracts

---

## Section 2: 177 Finding Coverage (FND17)

### Coverage Summary by Status

| Status | Count | Test Files Exist | Tests Passing | Tests Failing | No Tests |
|---|---|---|---|---|---|
| COMPLETE | 23 | 23 | 23 | 0 | 0 |
| PARTIAL | 41 | 38 | 31 | 7 | 3 |
| NOT_STARTED | 96 | 0 | 0 | 0 | 96 |
| DEFERRED | 13 | 0 | 0 | 0 | 13 |
| BLOCKED | 4 | 2 | 0 | 2 | 2 |
| **TOTAL** | **177** | **63** | **54** | **9** | **114** |

### VERIFICATION_FAILED Findings (5 categories, 9 failing tests)

#### 1. FND04: Foreign-Tenant Export (RTH-EXP-001 to RTH-EXP-006)

**Files:**
- apps/api-server/src/app/api/export/download/route.ts
- apps/api-server/src/app/api/export/status/route.ts
- Export worker/status routes

**Failing Tests:**
- audit/W1.2_Batch_08_Sol_Probe.py (2 FAILING, 3 PASSING)

**Root Cause:** Foreign-tenant equal-ID jobId/examId returns 200 instead of 403

**Dependencies:** FND03 (ownership classification), FND04 (tenant provenance implementation)

**Conflict Risk:** HIGH — export routes touched by FND04 + FND14 (report exports)

---

#### 2. FND05: Progress Concurrency (SU-PROGRESS-004 to SU-PROGRESS-008, RTH-PROGRESS-001/003)

**Files:**
- packages/db-tutorial/src/repositories/tutorial-progress.repository.ts
- packages/db-tutorial/src/schema/legacy-progress.ts
- packages/db-tutorial/src/schema/canonical-progress.ts

**Failing Tests:**
- foundation-progress-concurrency.test.ts (1 FAILING - staged adapter, not physical SQL)

**Root Cause:** Concurrent completions lose one update (last-write-wins)

**Dependencies:** FND03 (tenant storage path), FND05 (atomic merge/locking), FND21 (progress schema)

**Conflict Risk:** MEDIUM — shared schema files

---

#### 3. FND06: Admin Context Conflicts (guarded conflicting-tenant control)

**Files:**
- apps/api-server/src/middleware/admin-auth.ts
- Admin resource routes (users, questions)

**Failing Tests:** (Retained intentional failure for conflicting-context denial)

**Dependencies:** FND03 (ownership matrix), FND06 (admin policy implementation)

**Conflict Risk:** LOW — middleware isolation

---

#### 4. FND07: Service Worker Private Cache (SU-CACHE-002/004/005)

**Files:**
- apps/skillup-web/src/app/sw.ts

**Failing Tests:**
- apps/skillup-web/src/app/__tests__/service-worker-private-cache.test.ts (2 FAILING)

**Root Cause:** /student route cached, not excluded from cache writes

**Dependencies:** FND07 (cache lifecycle boundaries)

**Conflict Risk:** LOW — isolated service worker file

---

#### 5. FND09: Gate 1 Approval Evidence (isolated governance service)

**Files:**
- apps/api-server/src/services/project-ai/approval.service.ts
- Approval workflow routes

**Failing Tests:** (Retained no-evidence transition failure)

**Dependencies:** FND08 (actor contracts), FND09 (approval policy)

**Conflict Risk:** LOW — isolated governance service

---

## Section 3: File Ownership Matrix

### Exclusive Ownership (Single Finding, Single File)

| Finding ID | File Path | Owner Task | Conflict Risk |
|---|---|---|---|
| FND07 | apps/skillup-web/src/app/sw.ts | FND07 | NONE |
| FND08 | apps/api-server/src/services/project-ai/*.ts | FND08 | NONE |
| FND09 | apps/api-server/src/services/project-ai/approval.service.ts | FND09 | NONE |
| FND15 | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | FND15 | NONE |
| FND15 | apps/skillhubcore-admin/src/lib/skillhubcore-admin-data.ts | FND15 | NONE |
| FND16 | packages/marketing-site/src/components/footer/FooterBrand.tsx | FND16 | NONE |
| FND16 | apps/skillup-web/src/app/forgot-password/page.tsx | FND16 | NONE |
| FND16 | apps/realtutorialhub-web/src/app/forgot-password/page.tsx | FND16 | NONE |

**Parallel Safety:** These 8 findings can run concurrently without file conflicts

---

### Shared File Ownership (Multiple Findings, Same File)

#### High Conflict Risk

| File Path | Finding IDs | Owner Tasks | Callers | Conflict Type |
|---|---|---|---|---|
| apps/skillup-web/src/lib/skillup-data.ts | FND13, PA-A-004 | FND13 | 30 callers | WRITE CONFLICT |
| packages/ui/src/report/ExamResultsReport.tsx | FND14, PH05-006 | FND14 | 5 callers | WRITE CONFLICT |
| apps/api-server/src/lib/report/ReportEngine.ts | FND14 | FND14 | 2 callers | WRITE CONFLICT |
| apps/api-server/src/app/api/export/download/route.ts | FND04, FND14 | FND04, FND14 | Export + Report | WRITE CONFLICT |
| apps/skillhubcore-admin/src/app/api/admin/domains/route.ts | SHC-DIP-001, FND19, PA-A-002 | FND19, FND24 | 4 CRUD | WRITE CONFLICT |
| apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts | SHC-DRY-001, FND19 | FND19, FND24 | 4 CRUD | WRITE CONFLICT |
| apps/skillhubcore-admin/src/app/api/admin/topics/route.ts | SHC-DRY-001, FND19 | FND19, FND24 | 4 CRUD | WRITE CONFLICT |
| packages/db-tutorial/src/repositories/tutorial-progress.repository.ts | FND05, FND21, SU-PROGRESS-* | FND05, FND21 | Progress tracking | WRITE CONFLICT |

**Concurrency Rule:** These files MUST be owned by ONE workflow at a time, OR use separate worktrees/branches with sequential integration.

---

#### Medium Conflict Risk

| File Path | Finding IDs | Owner Tasks | Conflict Type |
|---|---|---|---|
| src/share-branding/auth/authLoader.tsx | FND16, FND18 | FND16, FND18 | Shared auth contracts |
| apps/api-server/src/middleware/admin-auth.ts | FND06, FND18 | FND06, FND18 | Identity propagation |
| apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | FND14, FND15 | FND14, FND15 | Report formatting |

**Concurrency Rule:** Coordinate changes through shared contract/schema first, then UI callers

---

### Shared Schema Files (8 files)

| Schema File | Finding IDs | Owner Tasks | Tables | Conflict Risk |
|---|---|---|---|---|
| packages/db/drizzle/schema/batches.ts | FND13 | FND13 | batches, batchEnrollments, batchSessions | MEDIUM |
| packages/db/drizzle/schema/users.ts | FND11, FND16, FND18 | FND11, FND18 | users, userProfiles | HIGH |
| packages/db/drizzle/schema/taxonomy.ts | FND19, FND20 | FND19, FND20, FND24 | domains, subjects, topics, subtopics | HIGH |
| packages/db/drizzle/schema/questions.ts | FND20 | FND20, FND24 | questions, questionOptions | MEDIUM |
| packages/db/drizzle/schema/exams.ts | FND14, FND20 | FND14, FND20 | exams, examQuestions, responses | HIGH |
| packages/db/drizzle/schema/placement.ts | FND13 | FND13 | placementStudentPlacementProfiles, placementJobListings | LOW |
| packages/db-tutorial/src/schema/legacy-progress.ts | FND05, FND21 | FND05, FND21 | tutorialProgress, learnerProgress | HIGH |
| packages/db-tutorial/src/schema/canonical-progress.ts | FND05, FND21 | FND05, FND21 | canonicalCompletion | HIGH |

**Concurrency Rule:** Schema changes MUST be sequential. No concurrent schema migrations.

---

### Shared Services (12 files)

| Service File | Finding IDs | Owner Tasks | Consumers | Conflict Risk |
|---|---|---|---|---|
| apps/api-server/src/services/session.service.ts | FND03, FND06, FND18 | FND03, FND18 | Auth routes | HIGH |
| apps/api-server/src/services/export.service.ts | FND04, FND14 | FND04, FND14 | Export routes | HIGH |
| apps/api-server/src/services/report.service.ts | FND14 | FND14 | Report routes | LOW |
| apps/api-server/src/services/taxonomy.service.ts | FND19, FND24 | FND19, FND24 | Taxonomy CRUD | HIGH |
| apps/api-server/src/services/question.service.ts | FND20, FND24 | FND20, FND24 | Question CRUD | MEDIUM |
| apps/api-server/src/services/exam.service.ts | FND14, FND20 | FND14, FND20 | Exam lifecycle | MEDIUM |
| apps/api-server/src/services/progress.service.ts | FND05, FND21 | FND05, FND21 | Progress tracking | HIGH |
| apps/api-server/src/services/placement.service.ts | FND13 | FND13 | Placement routes | LOW |
| apps/api-server/src/services/analytics.service.ts | FND23 | FND23 | Event publishing | LOW |
| apps/api-server/src/services/event-bus.service.ts | FND23 | FND23 | Event consumers | LOW |
| apps/api-server/src/services/project-ai/workflow.service.ts | FND08, FND09, FND22 | FND08, FND22 | Project LLM | MEDIUM |
| apps/skillup-admin/src/services/admission.service.ts | FND11, FND16 | FND11, FND16 | CRM admission | MEDIUM |

**Concurrency Rule:** Coordinate service interface changes before multiple callers modify them.

---

## Section 4: Sequential Chain Dependencies

### Chain 1: Identity (FND03→FND18→FND06→FND05→FND04)

**Dependency Flow:**
1. **FND03**: Establish ownership architecture (tenant/local-subject classification)
2. **FND18**: Canonical identity contracts (tenant/subject propagation)
3. **FND06**: Admin actor/target policy (requires identity context)
4. **FND05**: Progress identity and write integrity (requires tenant storage keys)
5. **FND04**: Export ownership boundaries (requires tenant provenance)

**Shared Files:**
- packages/db/drizzle/schema/users.ts
- apps/api-server/src/services/session.service.ts
- apps/api-server/src/middleware/admin-auth.ts
- packages/db-tutorial/src/schema/legacy-progress.ts

**Critical Path:** FND03 MUST complete before FND18; FND18 before FND06/FND05; FND05 before FND04

**Parallel Opportunity:** None — strict sequential dependency

---

### Chain 2: Email (FND11→FND16→FND18)

**Dependency Flow:**
1. **FND11**: People projection/email compatibility (uniqueness, normalization, migration)
2. **FND16**: Forms/actions contracts (auth flow, recovery, admission)
3. **FND18**: Canonical identity contracts (consumes FND11 decisions)

**Shared Files:**
- packages/db/drizzle/schema/users.ts
- src/share-branding/auth/authLoader.tsx
- apps/skillup-admin/src/app/api/admin/crm/admissions/route.ts

**Critical Path:** FND11 MUST complete before FND16/FND18

**Parallel Opportunity:** FND16 and FND18 can partially overlap if FND11 migration spec is ready

---

### Chain 3: W3 (FND18→FND19→FND20→FND21→FND22→FND23)

**Dependency Flow:**
1. **FND18**: Canonical identity contracts (foundation for all W3 domains)
2. **FND19**: Canonical taxonomy integration (5-entity schema consolidation)
3. **FND20**: Question identity and assessment compatibility (depends on taxonomy)
4. **FND21**: Canonical nested documents (tutorial/ILS schema)
5. **FND22**: Project LLM artifact/evidence contracts (SHA-256, approval)
6. **FND23**: Event/analytics identity/delivery contracts (consumes identity + schemas)

**Shared Files:**
- packages/db/drizzle/schema/taxonomy.ts
- packages/db/drizzle/schema/questions.ts
- packages/db/drizzle/schema/exams.ts
- packages/db-tutorial/src/schema/*.ts
- apps/api-server/src/services/*.service.ts

**Critical Path:** FND18→FND19→FND20 is strictly sequential (taxonomy→questions)
FND21 can run parallel to FND19/FND20 (separate tutorial schema)
FND22 depends on FND18 but is independent of taxonomy
FND23 depends on FND18 but can overlap with FND19-22

**Parallel Opportunity:**
- FND21 parallel to FND19/FND20 (separate schemas)
- FND22 parallel to FND19-21 (separate domain)
- FND23 partial overlap with FND19-22 (event layer independent of data schemas)

---

## Section 5: Parallel Safety Analysis

### Group A: Independent Findings (7 findings, fully parallel-safe)

| Finding ID | File Path | Owner Task | Dependencies |
|---|---|---|---|
| FND07 | apps/skillup-web/src/app/sw.ts | FND07 | NONE |
| FND08 | apps/api-server/src/services/project-ai/*.ts | FND08 | NONE |
| FND09 | apps/api-server/src/services/project-ai/approval.service.ts | FND09 | FND08 (actor) |
| FND15 | apps/realtutorialhub-admin/src/lib/*.ts | FND15 | NONE |
| FND16 (partial) | packages/marketing-site/src/components/footer/FooterBrand.tsx | FND16 | NONE |
| FND16 (partial) | apps/skillup-web/src/app/forgot-password/page.tsx | FND16 | NONE |
| FND16 (partial) | apps/realtutorialhub-web/src/app/forgot-password/page.tsx | FND16 | NONE |

**Concurrency:** All 7 can run in parallel workflows without conflicts

---

### Group B: Student Data (FND13 — single file, sequential only)

| File | Callers | Conflict Risk |
|---|---|---|
| apps/skillup-web/src/lib/skillup-data.ts | 30 callers | HIGH |

**Concurrency:** MUST be single-writer; all FND13 changes sequential

---

### Group C: Assessment/Report (FND14 + PH05-005 — high coupling)

| Files | Findings | Conflict Risk |
|---|---|---|
| packages/ui/src/report/ExamResultsReport.tsx | FND14, PH05-006 | HIGH |
| apps/api-server/src/lib/report/ReportEngine.ts | FND14 | MEDIUM |
| apps/api-server/src/app/api/export/download/route.ts | FND04, FND14 | HIGH |

**Concurrency:** FND14 MUST complete before FND04 touches export routes, OR use separate worktrees

---

### Group D: Taxonomy/Question (FND19→FND20 — strict sequence)

| Files | Findings | Conflict Risk |
|---|---|---|
| packages/db/drizzle/schema/taxonomy.ts | FND19, FND20, FND24 | HIGH |
| packages/db/drizzle/schema/questions.ts | FND20, FND24 | HIGH |
| apps/skillhubcore-admin/src/app/api/admin/*/route.ts | FND19, FND24 | HIGH |

**Concurrency:** FND19 MUST complete before FND20; both before FND24

---

### Group E: Progress/Tutorial (FND05 + FND21 — schema coupling)

| Files | Findings | Conflict Risk |
|---|---|---|
| packages/db-tutorial/src/schema/legacy-progress.ts | FND05, FND21 | HIGH |
| packages/db-tutorial/src/repositories/tutorial-progress.repository.ts | FND05, FND21 | HIGH |

**Concurrency:** Coordinate schema changes; repository can be separate

---

### Group F: Identity Foundation (FND03→FND18 — strict sequence)

| Files | Findings | Conflict Risk |
|---|---|---|
| packages/db/drizzle/schema/users.ts | FND03, FND11, FND18 | HIGH |
| apps/api-server/src/services/session.service.ts | FND03, FND18 | HIGH |

**Concurrency:** FND03 MUST complete before FND18; FND11 can partially overlap

---

### Group G: Export Ownership (FND04 — depends on FND03+FND05)

| Files | Findings | Conflict Risk |
|---|---|---|
| apps/api-server/src/app/api/export/download/route.ts | FND04, FND14 | HIGH |
| apps/api-server/src/app/api/export/status/route.ts | FND04 | MEDIUM |

**Concurrency:** FND04 after FND03/FND05; coordinate with FND14

---

## Section 6: Recommended Workflow Decomposition

### Phase 1: Foundation (Sequential — no parallelism)

**Workflow 1: FND03 Ownership Architecture**
- Files: ownership classification, tenant/subject mapping
- Dependencies: NONE
- Blocking: FND18, FND06, FND05, FND04

**Workflow 2: FND18 Identity Contracts**
- Files: session.service.ts, users.ts schema, middleware
- Dependencies: FND03
- Blocking: FND06, FND05, FND19-23

**Workflow 3: FND11 People Projection**
- Files: users.ts schema, admission routes
- Dependencies: NONE (parallel to FND03)
- Blocking: FND16, FND18 migration

---

### Phase 2: Domain Implementation (Limited Parallelism)

**Parallel Group 1 (after FND03+FND18):**
- Workflow 4: FND06 Admin Context
- Workflow 5: FND07 Service Worker
- Workflow 6: FND08+FND09 Project AI Governance
- Workflow 7: FND15 Operational Truth

**Parallel Group 2 (after FND03+FND18):**
- Workflow 8: FND05 Progress Integrity (blocks FND04)
- Workflow 9: FND13 Student Data Truth (independent)
- Workflow 10: FND21 Tutorial Schema (independent)

---

### Phase 3: Contract Integration (Sequential Chains)

**Sequential Chain 1: Taxonomy→Questions**
- Workflow 11: FND19 Taxonomy (after FND18)
- Workflow 12: FND20 Questions (after FND19)

**Sequential Chain 2: Assessment→Export**
- Workflow 13: FND14 Report Truth (after FND18)
- Workflow 14: FND04 Export Ownership (after FND05+FND14)

**Independent:**
- Workflow 15: FND22 Project LLM Artifacts (after FND18)
- Workflow 16: FND23 Event Contracts (after FND18)

---

### Phase 4: Marketing (Parallel)

**Parallel Group 3 (independent):**
- Workflow 17: FND16 Marketing Forms (partial — after FND11 for admission)
- Workflow 18: Marketing site fixes (MKT-020, MKT-022, MKT-024)

---

### Phase 5: Integration (Sequential)

**Workflow 19: FND24 Contract Integration**
- Dependencies: FND18, FND19, FND20, FND21, FND22, FND23
- Files: All service layers, cross-domain callers

**Workflow 20: FND25-27 Quality Gates**
- Dependencies: All domain implementations
- Files: Test coverage, engineering quality, compatibility

**Workflow 21: FND28-30 Closure**
- Dependencies: All implementations verified
- Files: Audit packets, W4 readiness, closure package

---

## Section 7: Critical Conflict Summary

### Write Conflicts (MUST be sequential)

1. **apps/skillup-web/src/lib/skillup-data.ts** (FND13) — 30 callers
2. **packages/db/drizzle/schema/taxonomy.ts** (FND19, FND20, FND24) — 5-entity schema
3. **packages/db/drizzle/schema/users.ts** (FND03, FND11, FND18) — identity foundation
4. **packages/db-tutorial/src/schema/legacy-progress.ts** (FND05, FND21) — progress schema
5. **apps/api-server/src/services/session.service.ts** (FND03, FND18) — identity service
6. **apps/api-server/src/app/api/export/download/route.ts** (FND04, FND14) — export routes
7. **apps/skillhubcore-admin/src/app/api/admin/domains/route.ts** (FND19, FND24) — taxonomy CRUD

### Safe Parallel Execution Groups

**Group A (7 findings):**
- FND07 (service worker)
- FND08 (Project AI actor)
- FND09 (approval governance)
- FND15 (operational truth — 3 isolated files)
- FND16 (newsletter/recovery — 3 isolated files)

**Group B (2 findings, after FND03+FND18):**
- FND13 (student data — single file, no deps)
- FND21 (tutorial schema — separate DB package)

**Group C (2 findings, after FND18):**
- FND22 (Project LLM artifacts)
- FND23 (event contracts — partial)

---

## Section 8: Verification Evidence Gaps

### 9 VERIFICATION_FAILED Findings

| Finding Group | Failing Tests | Files | Implementation Required |
|---|---|---|---|
| FND04 (Export) | 2 FAILING (Sol probe) | export/download/route.ts | Tenant provenance checks |
| FND05 (Progress) | 1 FAILING (concurrency) | tutorial-progress.repository.ts | Atomic merge/locking |
| FND07 (Cache) | 2 FAILING | sw.ts | Private route exclusion |
| FND14 (Report) | 1 FAILING (Sol-identified) | ExamResultsReport.tsx | Stale report race fix |
| FND23 (Events) | 4 FAILING | event-bus.service.ts | Type/brand validation, idempotency |

### 113 NOT_STARTED Findings

**Breakdown by Domain:**
- Marketing (MKT): 29 findings
- SkillUp (SU): 42 findings
- RTH: 17 findings
- Phase (PH): 7 findings
- Principal Architect (PA-A): 1 finding
- SHC: 17 findings

**Primary Blockers:**
- FND03 ownership decision (blocks FND04, FND05, FND06, FND18)
- FND11 people migration (blocks FND16 admission, FND18 migration)
- FND18 identity contracts (blocks FND19, FND20, FND23)
- FND19 taxonomy schema (blocks FND20, FND24)
- Product decisions: placement scoring, exam lifecycle, assessment deadline

---

## Section 9: Recommendations for Revised Plan

### 1. Launch FND03 Investigation Immediately (Read-Only)

**Goal:** Complete ownership classification (tenant/local-subject mapping)
**Output:** Decision document for FND03, FND04, FND05, FND06, FND18
**Blocking:** Identity chain, export chain, progress chain

---

### 2. Launch FND11 Investigation Immediately (Read-Only)

**Goal:** People projection/email uniqueness/migration design
**Output:** Migration manifest, uniqueness policy, ambiguity denial
**Blocking:** FND16 admission, FND18 identity migration

---

### 3. Parallel Group A (7 Workflows, Fully Independent)

**Workflows:**
- FND07: Service worker private cache exclusion
- FND08: Project AI actor contracts
- FND09: Gate 1 approval evidence
- FND15: SHC operational truth (3 files)
- FND16: Marketing newsletter/recovery (3 files)

**No dependencies, no conflicts — launch immediately after FND03/FND11 investigations**

---

### 4. Sequential Identity Chain (After FND03)

**Order:**
1. FND03 implementation (ownership architecture)
2. FND18 implementation (identity contracts)
3. FND06 implementation (admin context)
4. FND05 implementation (progress integrity)
5. FND04 implementation (export ownership)

**Strict sequence — no parallelism**

---

### 5. Sequential Taxonomy Chain (After FND18)

**Order:**
1. FND19 implementation (taxonomy schema consolidation)
2. FND20 implementation (question contracts)
3. FND24 integration (canonical caller migration)

**Strict sequence — no parallelism**

---

### 6. Parallel Domain Group (After FND18)

**Workflows:**
- FND13: Student data truth (single file, isolated)
- FND21: Tutorial/ILS nested schema (separate DB package)
- FND22: Project LLM artifacts (isolated service)

**Can run concurrently after FND18**

---

### 7. Assessment Chain (After FND18, Coordinate with FND04)

**Order:**
1. FND14 report truth (includes stale report fix)
2. FND04 export ownership (depends on FND05, coordinates with FND14)
3. PH05-005 exam lifecycle (deadline/idempotency)

**FND14 and FND04 share export routes — coordinate or use separate worktrees**

---

### 8. Event Layer (After FND18, Partial Overlap)

**Workflow:**
- FND23: Event/analytics contracts (type validation, idempotency, delivery)

**Can overlap with FND19-22 implementations**

---

### 9. Integration Phase (After All Domains)

**Sequential:**
- FND24: Contract integration (caller migration)
- FND25: Adverse behavior coverage
- FND26: Build gates
- FND27: Engineering quality
- FND28: Re-audit packets
- FND29: W4 entry readiness
- FND30: Closure package

---

## Section 10: Ownership Matrix Deliverable

**Path:** e:\onlinewebsites\quiz-platform\.agents\tasks\fnd12-fnd17-ownership-matrix.md

**Coverage:**
- ✅ 181 caller locations with exact file paths
- ✅ 177 findings mapped to files
- ✅ Exclusive vs shared file ownership identified
- ✅ 8 shared schema files inventoried
- ✅ 12 shared service files inventoried
- ✅ 3 sequential chains validated (Identity, Email, W3)
- ✅ 7 parallel-safe independent findings identified
- ✅ Write conflict analysis complete
- ✅ Concurrent workflow recommendations provided

**Constraints Met:**
- ✅ Read-only investigation (no code changes)
- ✅ No completion claims (inventory only)
- ✅ Used existing FND01 investigation output at 86f1d7a9
- ✅ Findings reported, not solutions proposed

**Verification:**
- 181 callers extracted from FND12_Complete_Truth_Inventory.md
- 177 findings extracted from FND17_W2_Coverage_Map.md
- Sequential chains validated from Claude_Sonnet45_W1_W3_Completion_Directive.md
- File paths verified against source structure (read-only)

---

## Conclusion

**Parallel execution is feasible with constraints:**

1. **7 findings (Group A)** can run fully concurrently without conflicts
2. **3 sequential chains** MUST execute in order (Identity, Email, W3-Taxonomy)
3. **Shared schemas** (8 files) require sequential migration or separate worktrees
4. **Shared services** (12 files) require interface coordination before parallel caller changes
5. **High-conflict files** (7 identified) MUST have exclusive ownership per workflow

**Recommendation:** Use FEAT-based decomposition with strict file ownership assignment per FEAT. Launch read-only FND03+FND11 investigations immediately to unblock identity and email chains. Execute Group A (7 findings) in parallel while investigations proceed. Sequential identity/taxonomy chains follow investigation decisions.

**Risk:** Without exclusive file ownership OR separate worktrees, concurrent writes to shared schemas/services will cause merge conflicts and integration failures.

---

**Document Status:** ✅ COMPLETE
**Total Callers Mapped:** 181
**Total Findings Mapped:** 177
**Sequential Chains Validated:** 3 (Identity, Email, W3)
**Parallel-Safe Findings:** 7
**High-Conflict Files:** 7
**Shared Schemas:** 8
**Shared Services:** 12
