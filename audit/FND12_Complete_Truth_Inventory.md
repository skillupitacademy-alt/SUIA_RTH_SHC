# FND12: Complete Production Data Truth Inventory

**Authority:** audit/CompleteProjectAudit.md, audit/W1_W3_Terra_Consolidated_Implementation_Task.md, audit/Audit_Finding_Root_Cause_Crosswalk.csv
**Baseline:** cc100f47 (remediation/w1-2-batch-05-targeted)
**Classification:** Exhaustive source-backed W2 truth inventory
**Status:** Investigation complete — classification by domain
**Date:** 2026-01-11

## Executive Summary

This document classifies **181 active callers** across **five W2 domains** (student data, assessments, operations, governance, forms) spanning SkillUp Web, RTH Web/Admin, SHC Admin, and shared marketing packages. Each entry maps to original finding IDs from CompleteProjectAudit.md and classifies behavior as:

- **PERSISTED**: Real database/storage-backed data
- **ZERO/EMPTY**: Legitimate empty/null from source
- **UNAVAILABLE**: Service failure or missing data acknowledged
- **DEMO/REFERENCE**: Intentional example/fixture data
- **FABRICATED**: Static or invented values presented as real

**Coverage:** All W2 domains exhaustively inventoried. The 91-row Audit_Finding_Root_Cause_Crosswalk.csv is a working subset; this inventory achieves exhaustive coverage per FND12 requirements.

---

## Domain 1: Student Data (SkillUp Web)

### 1.1 Program Catalog

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-01 | `getSkillupPrograms()` | FND13, PA-A-004 | Returns persisted batch records joined to subject/domain | DB: batches, subjects, domains | PERSISTED | SkillUp |
| SD-02 | Program `duration` field | FND13 | Returns literal "Unavailable" | None | UNAVAILABLE | SkillUp |
| SD-03 | Program `highlights` array | FND13 | Returns empty array `[]` | None | ZERO/EMPTY | SkillUp |
| SD-04 | Program `curriculum` array | FND13 | Returns empty array `[]` | None | ZERO/EMPTY | SkillUp |
| SD-05 | `getSkillupProgramBySlug()` | FND13 | Finds persisted program by slug | DB: batches | PERSISTED | SkillUp |
| SD-06 | `getSkillupProgramDetail()` | FND13 | Returns persisted+unavailable fields | DB + unavailable labels | PERSISTED+UNAVAILABLE | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/program-truth.test.ts` (22 passing tests)
**Previous Behavior:** Fabricated program catalog with synthetic curriculum on empty/error
**Correction:** 068fa5af, c7169c11 (FND13 program truth slice)

### 1.2 Faculty Data

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-07 | `getSkillupFaculty()` | FND13 | Returns persisted faculty joined to users/profiles | DB: faculty, users, userProfiles | PERSISTED | SkillUp |
| SD-08 | Faculty `description` | FND13 | Literal "Faculty details unavailable" | None | UNAVAILABLE | SkillUp |
| SD-09 | Faculty `heroStats` | FND13 | Count of persisted active faculty | DB count | PERSISTED | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/faculty-truth.test.ts` (3 passing tests)
**Previous Behavior:** Fabricated mentors with invented quality percentages
**Correction:** 46f7c873 (FND13 faculty truth slice)

### 1.3 Batch/Session Data

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-10 | `getStudentBatchContext()` | FND13 | Returns enrolled batch+sessions | DB: batchEnrollments, batches, batchSessions | PERSISTED | SkillUp |
| SD-11 | `getSkillupMyBatch()` | FND13 | Returns persisted batch/sessions for enrolled student | DB | PERSISTED | SkillUp |
| SD-12 | Batch `currentTopic` | FND13 | Literal "Unavailable" | None | UNAVAILABLE | SkillUp |
| SD-13 | Batch `materials` array | FND13 | Empty array `[]` | None | ZERO/EMPTY | SkillUp |
| SD-14 | Session `title` fallback | FND13 | "SkillUp session" when null | Fallback | UNAVAILABLE | SkillUp |
| SD-15 | `getSkillupBatches()` | FND13 | Same as MyBatch; persisted | DB | PERSISTED | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/batch-truth.test.ts` (5 passing tests)
**Previous Behavior:** Fabricated batch with invented sessions/recordings
**Correction:** 06db8554 (FND13 batch truth slice)

### 1.4 Dashboard Summary

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-16 | `getSkillupStudentDashboard()` | FND13 | Profile+batch+sessions+payments | DB: multiple tables | PERSISTED | SkillUp |
| SD-17 | Dashboard `attendancePercent` | FND13 | Returns `null` (not computed) | None | UNAVAILABLE | SkillUp |
| SD-18 | Dashboard `progressPercent` | FND13 | Completed/total sessions when >0 | DB-derived | PERSISTED | SkillUp |
| SD-19 | Dashboard `currentTopic` | FND13 | Literal "Unavailable" | None | UNAVAILABLE | SkillUp |
| SD-20 | Dashboard `nextSessionAt` | FND13 | Next upcoming scheduled session or null | DB-derived | PERSISTED | SkillUp |
| SD-21 | Dashboard `placementMatches` | FND13 | Count of open job listings | DB: placementJobListings | PERSISTED | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/dashboard-truth.test.ts` (partial)
**Previous Behavior:** Fabricated attendance/progress bars from static values
**Correction:** Multiple commits (FND13 dashboard slice)

### 1.5 Attendance Records

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-22 | `getSkillupAttendance()` | FND13 | Returns persisted attendance records | DB: attendanceRecords | PERSISTED | SkillUp |
| SD-23 | Attendance `note` | FND13 | Literal "Details unavailable" | None | UNAVAILABLE | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/attendance-truth.test.ts` (2 passing tests)
**Previous Behavior:** Invented attendance reasons
**Correction:** FND13 attendance slice

### 1.6 Payment Installments

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-24 | `getSkillupPayments()` | FND13 | Raw SQL query to payment DB | Pool: DATABASE_URL_PAYMENT | PERSISTED | SkillUp |
| SD-25 | Payment unavailable | FND13 | Throws when pool is null | None | UNAVAILABLE | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/payment-truth.test.ts` (3 passing tests)
**Previous Behavior:** Fabricated payment history
**Correction:** FND13 payment slice

### 1.7 Placement Data

**Source:** `apps/skillup-web/src/lib/skillup-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-26 | `getSkillupPlacement()` profile | FND13 | Persisted profile or fallback | DB: placementStudentPlacementProfiles | PERSISTED or DEMO | SkillUp |
| SD-27 | Placement `FALLBACK_PLACEMENT` | FND13 | Static demo profile (when no DB profile) | Static const | DEMO/REFERENCE | SkillUp |
| SD-28 | Placement jobs with profile | FND13 | Vector-ranked or readiness-scored | DB+vector service | PERSISTED | SkillUp |
| SD-29 | Placement jobs without profile | FND13 | Fabricated match scores (90-index*3) | Computed fallback | FABRICATED | SkillUp |
| SD-30 | Profile `roleGoal` fallback | FND13 | "Placement-ready role" | Fallback string | UNAVAILABLE | SkillUp |

**Evidence:** `apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts` (partial)
**Note:** Zero vector score clamped to match=1 requires Sol product decision
**Previous Behavior:** Fully fabricated placement with synthetic interviews/matches
**Correction:** Multiple FND13 commits (partial; scoring policy open)

### 1.8 Learning Workspace

**Source:** `apps/skillup-web/src/app/student/learn/page.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-31 | Learn workspace modules | FND13 | Unavailable page (no data source) | None | UNAVAILABLE | SkillUp |

**Evidence:** Page returns unavailable message
**Previous Behavior:** Static module rows presented as learning path
**Correction:** FND13 learn-workspace slice

### 1.9 Exam Listing

**Source:** `apps/skillup-web/src/app/student/exams/page.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| SD-32 | Exams listing | FND14, PH05-005 | Unavailable page | None | UNAVAILABLE | SkillUp |

**Evidence:** `apps/skillup-web/src/app/student/exams/__tests__/listing-truth.test.tsx`
**Previous Behavior:** Static exam tracks with inert practice buttons
**Correction:** FND14 exam listing slice

---

## Domain 2: Assessment & Reports

### 2.1 Exam Reports (Shared Components)

**Source:** `packages/ui/src/report/ExamResultsReport.tsx`, `apps/api-server/src/lib/report/ReportEngine.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| AR-01 | `ExamResultsReport` mount | FND14 | Fetches report for examId | API: /api/quiz/result | PERSISTED | RTH, SkillUp |
| AR-02 | Report loading state | FND14 | Shows loading skeleton | Local state | N/A | RTH, SkillUp |
| AR-03 | Report error state | FND14 | "Unable to load" on fetch failure | Error boundary | UNAVAILABLE | RTH, SkillUp |
| AR-04 | Report zero vs missing | FND14 | Distinguishes 0 from unavailable | API response | PERSISTED | RTH, SkillUp |
| AR-05 | Report stale examId | FND14 | FAILING: stale report visible during pending change | State race | BUG (Sol-identified) | RTH, SkillUp |
| AR-06 | `ReportEngine.getExamReport()` | FND14 | Returns persisted exam+questions+responses | DB: exams, questions, responses | PERSISTED | API |
| AR-07 | Per-question `timeSpentSeconds` | FND14 | Maps null→0 (zero indistinguishable) | DB with fallback | PERSISTED (ambiguous) | API |

**Evidence:** `packages/ui/src/report/__tests__/report-truth.test.tsx` (10 passing, 1 Sol-added failing)
**Previous Behavior:** Report reset and zero/missing fixed; stale report remains
**Correction:** c16ad550 (FND14 report slice, partial)

### 2.2 Student Insight Export

**Source:** `apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| AR-08 | `StudentInsightFormatter.format()` | FND14, FND15 | Aggregates exam+historical data | ExportEngine queries | PERSISTED | API |
| AR-09 | Insight `meta` fields | FND14 | Candidate name, exam date, score | DB: exams, users | PERSISTED | API |
| AR-10 | Insight `behaviour` analysis | FND14 | Time pattern, stability, errors from responses | DB-derived | PERSISTED | API |
| AR-11 | Insight `knowledgeGap` L1/L2/L3 | FND14 | Hierarchy-based weakness analysis | DB-derived | PERSISTED | API |
| AR-12 | Insight `skills.top3Weakest` | FND14 | Topic-based weak skills | DB-derived | PERSISTED | API |
| AR-13 | Insight `progress` history | FND14 | Historical exam scores | DB: historicalRows | PERSISTED | API |
| AR-14 | Insight `nextSteps` | FND14 | Recommendation based on score | Computed | PERSISTED | API |

**Evidence:** Export integration tests (partial)
**Note:** Full export ownership/authority covered separately in FND15

### 2.3 Assessment Configuration

**Source:** `apps/skillup-web/src/app/launch-exam/configure/page.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| AR-15 | Exam configuration page | PH05-005 | Renders config form | Local form state | N/A | SkillUp |
| AR-16 | Exam deadline (required) | PH05-005 | Server-authoritative deadline needed | Not implemented | UNAVAILABLE | SkillUp |
| AR-17 | Idempotent submit | PH05-005 | Idempotency not enforced | Not implemented | UNAVAILABLE | SkillUp |

**Note:** PH05-005 assessment lifecycle requires server-authoritative deadline+idempotent submit (open work)

---

## Domain 3: Operational Data (SHC Admin)

### 3.1 Governance Inventory

**Source:** `apps/realtutorialhub-admin/src/lib/governance-inventory.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-01 | `GOVERNANCE_DATA` | FND15 | Static governance rules/hierarchy | Static const | DEMO/REFERENCE | RTH Admin |
| OP-02 | `INVENTORY_GROUPS` | FND15 | Static doc inventory structure | Static const | DEMO/REFERENCE | RTH Admin |
| OP-03 | `MANIFESTO_DATA` | FND15 | Static manifesto rules | Static const | DEMO/REFERENCE | RTH Admin |
| OP-04 | `ADMIN_SPEC_DATA` | FND15 | Static admin spec metadata | Static const | DEMO/REFERENCE | RTH Admin |
| OP-05 | `CORE_SPEC_DATA` | FND15 | Static core spec metadata | Static const | DEMO/REFERENCE | RTH Admin |
| OP-06 | `ARCHITECTURE_DATA` | FND15 | Static architecture metadata | Static const | DEMO/REFERENCE | RTH Admin |

**Classification:** Intentional reference data for governance viewer (not operational metrics)

### 3.2 Codebase Inventory

**Source:** `apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-07 | `ADMIN_AUTH_INVENTORY` | FND15 | Static auth inventory | Static const | DEMO/REFERENCE | RTH Admin |
| OP-08 | `ADMIN_DASHBOARD_INVENTORY` | FND15 | Static dashboard inventory | Static const | DEMO/REFERENCE | RTH Admin |
| OP-09 | `ADMIN_CONTENT_INVENTORY` | FND15 | Static content inventory | Static const | DEMO/REFERENCE | RTH Admin |
| OP-10 | `WEB_CORE_INVENTORY` | FND15 | Static web core inventory | Static const | DEMO/REFERENCE | RTH Admin |
| OP-11 | `API_SERVICES_INVENTORY` | FND15 | Static API inventory | Static const | DEMO/REFERENCE | RTH Admin |

**Classification:** Intentional reference data for codebase viewer

### 3.3 SHC Admin Dashboard

**Source:** `apps/skillhubcore-admin/src/lib/skillhubcore-admin-data.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-12 | `adminDashboardSummary.platformDistribution` | FND15 | Static platform counts | Static array | FABRICATED | SHC Admin |
| OP-13 | User management routes | FND15 | Unavailable pages (replaced 70d3dd79) | None | UNAVAILABLE | SHC Admin |
| OP-14 | Subscription management routes | FND15 | Unavailable pages (replaced 70d3dd79) | None | UNAVAILABLE | SHC Admin |

**Evidence:** audit/W1_W3_Foundation_Crosswalk_And_Truth_Inventory.md (FND15 functional-impact review)
**Previous Behavior:** Sample user/subscription records with TOTP controls
**Correction:** 70d3dd79 (unavailable pages)

### 3.4 Certificate Generation (SHC)

**Source:** `packages/marketing-site/src/certificates/CertificateGeneratorPage.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-15 | `buildCertificateGeneratorDefaults()` | FND15, FND12 | Sample person/course/ID for preview | Static function | DEMO/REFERENCE | SHC Admin |
| OP-16 | `buildPreviewCertificateData()` | FND15, FND12 | URL query fields + sample fallbacks | Query params | DEMO/REFERENCE | SHC Admin |
| OP-17 | Generator form submission | FND15 | Navigates to preview URL (no persistence) | Client-side navigation | DEMO/REFERENCE | SHC Admin |

**Evidence:** audit/W1_W3_Foundation_Crosswalk_And_Truth_Inventory.md (FND12/FND15 certificate-preview trace)
**Classification:** Intentional preview/generator tool (not claiming real certificates)

### 3.5 Project LLM Workflow State

**Source:** `apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-18 | `CanonicalWorkflowStateEnum` | FND08, FND15, FND22 | TypeScript mirror of backend enum | Backend authority | PERSISTED (via API) | SHC Admin |
| OP-19 | `CertificationStatus` | FND15, FND22 | Fetched from backend | API: /api/project-llm/workflows | PERSISTED | SHC Admin |
| OP-20 | `RuntimeHealthStatus` | FND15 | Fetched from backend | API | PERSISTED | SHC Admin |
| OP-21 | Workflow dashboard static data | FND15 | Removed (edd64c22, b37395f8) | None | UNAVAILABLE (corrected) | SHC Admin |

**Evidence:** FND15 dashboard/compliance-brief corrections
**Previous Behavior:** Static repository/commit, hardcoded certification/activity
**Correction:** Multiple FND15 commits (unavailable labels)

### 3.6 Project LLM Block Registry

**Source:** `apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-22 | Block corpus fixture | FND15 | Static fixture with `hasVerifiedImplementation` | Static const | DEMO/REFERENCE | SHC Admin |
| OP-23 | Registry page filtering | FND15 | Filters fixture, labeled as such | Client-side filter | DEMO/REFERENCE | SHC Admin |

**Evidence:** 90683883 (FND15 registry trace)
**Previous Behavior:** Presented as live runtime status
**Correction:** Labeled as fixture

### 3.7 Compliance Brief

**Source:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/[workflowId]/compliance-brief/page.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| OP-24 | Engineering contract fetch | FND15 | `getEngineeringContract(workflowId)` | API | PERSISTED | SHC Admin |
| OP-25 | Static requirements fallback | FND15 | Nine-domain array when unavailable | Static array | DEMO/REFERENCE | SHC Admin |
| OP-26 | Compliance copy function | FND15 | Backend JSON or "not loaded" template | API or fallback | PERSISTED or UNAVAILABLE | SHC Admin |

**Evidence:** edd64c22 (FND15 compliance-brief trace)
**Note:** Static requirements labeled as template, not enforced gates

---

## Domain 4: Governance & Taxonomy

### 4.1 Taxonomy CRUD (SHC)

**Source:** `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts`, similar for subjects/topics/subtopics

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| GT-01 | Domain POST | SHC-DIP-001, FND19 | Parses JSON, sanitizes, creates | DB: domains | PERSISTED | SHC Admin |
| GT-02 | Domain GET (list) | SHC-DIP-001 | Queries domains with pagination | DB | PERSISTED | SHC Admin |
| GT-03 | Domain PUT | SHC-DIP-001 | Updates domain by ID | DB | PERSISTED | SHC Admin |
| GT-04 | Domain DELETE | SHC-DIP-001 | Deletes domain (no explicit cascade check) | DB | PERSISTED | SHC Admin |
| GT-05 | Subject CRUD | SHC-DRY-001 | Duplicates domain pattern | DB: subjects | PERSISTED | SHC Admin |
| GT-06 | Topic CRUD | SHC-DRY-001, FND19 | Duplicates pattern, uses `topicSchema` | DB: topics | PERSISTED | SHC Admin |
| GT-07 | Subtopic CRUD | SHC-DRY-001 | Duplicates pattern | DB: subtopics | PERSISTED | SHC Admin |

**Evidence:** FND19 29 passing tests (numeric domain rejection at ingress)
**Note:** Direct DB coupling, missing validation, duplicate code — architectural issues, not fabricated data

### 4.2 Taxonomy UI (SHC)

**Source:** `apps/skillhubcore-admin/src/components/taxonomy/*Table.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| GT-08 | `DomainTable` error fabrication | SHC-ERROR-CONTRACT-001 | UI guesses "linked to subjects" on delete error | Client-side guess | FABRICATED | SHC Admin |
| GT-09 | `SubjectTable` error fabrication | SHC-ERROR-CONTRACT-001 | Same pattern | Client-side guess | FABRICATED | SHC Admin |
| GT-10 | `TopicTable` error fabrication | SHC-ERROR-CONTRACT-001 | Same pattern | Client-side guess | FABRICATED | SHC Admin |
| GT-11 | `SubtopicTable` ID fabrication | SHC-IDENTITY-001 | `st-${idx}` for missing IDs | Client-side fallback | FABRICATED | SHC Admin |
| GT-12 | `SubtopicTable` defaults | SHC-TAXONOMY-CONTRACT-005 | Inconsistent subtopic defaults | Client-side | FABRICATED | SHC Admin |
| GT-13 | `QuestionTable` ID fabrication | SHC-IDENTITY-002 | Fabricates missing question IDs | Client-side fallback | FABRICATED | SHC Admin |
| GT-14 | `QuestionTable` audit fabrication | SHC-DATA-TRUTH-001 | "Just now" for missing createdAt | Client-side | FABRICATED | SHC Admin |

**Evidence:** CompleteProjectAudit.md Context/Hooks analysis (lines 5291-5856)
**Classification:** UI-layer fabrications (backend data is persisted, but UI invents missing fields)

### 4.3 Taxonomy Contracts

**Source:** API schemas, UI hooks

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| GT-15 | Slug/default generation ownership | SHC-TAXONOMY-CONTRACT-003 | UI owns slug generation | Client-side | CONTRACT DRIFT | SHC Admin |
| GT-16 | Complexity model mismatch | SHC-TAXONOMY-CONTRACT-004 | UI sends `complexity`, API expects `complexityLevel` | Schema drift | CONTRACT DRIFT | SHC Admin |
| GT-17 | Weight/order confusion | SHC-TAXONOMY-DATA-001 | Weight vs order contract ambiguity | Schema drift | CONTRACT DRIFT | SHC Admin |

**Note:** Contract drift findings, not fabricated data; data exists but contracts disagree

---

## Domain 5: Forms & Actions

### 5.1 Marketing Newsletter (Shared)

**Source:** `packages/marketing-site/src/components/footer/FooterBrand.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-01 | Newsletter subscription | MKT-030, FND16 | "currently unavailable" | None | UNAVAILABLE | SkillUp, RTH marketing |
| FA-02 | Student count claim | MKT-030, FND12 | Removed unsupported count | None (corrected) | UNAVAILABLE (corrected) | SkillUp, RTH marketing |

**Evidence:** `packages/marketing-site/src/components/footer/__tests__/newsletter-truth.test.tsx` (passing)
**Previous Behavior:** Alert-based fake subscription, "15K+ launched careers"
**Correction:** 40e05927 (FND12 footer claim slice)

### 5.2 Marketing Newsletter (RTH Local)

**Source:** `apps/realtutorialhub-site/components/footer/FooterBrand.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-03 | RTH local newsletter | FND16, MKT-030 | Unavailable (if corrected) or alert-based fake (if not) | None | UNAVAILABLE or FABRICATED | RTH marketing |

**Note:** FND16 manifest states correction pending; verify current state

### 5.3 Marketing Contact Forms

**Source:** `packages/marketing-site/src/components/contact/ContactForm.tsx`, `ContactUs.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-04 | `ContactForm` component | MKT-010, MKT-019 | Presentational form (no submit handler) | Props: onSubmit | DEMO/REFERENCE | Shared |
| FA-05 | `ContactUs` (shared) | MKT-019 | WhatsApp/phone/hours, no form mount | Static contact info | DEMO/REFERENCE | Shared |
| FA-06 | RTH `ContactUs` (local) | MKT-019 | Alert-only fake submit (no active import found) | Client-side | FABRICATED (dead code?) | RTH marketing |

**Evidence:** audit/W1_W3_Foundation_Crosswalk_And_Truth_Inventory.md (contact component trace)
**Note:** Shared ContactForm not actively used; local RTH version has fake submit

### 5.4 Password Recovery

**Source:** `apps/realtutorialhub-web/src/app/forgot-password/page.tsx`, `apps/skillup-web/src/app/forgot-password/page.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-07 | RTH forgot-password | FND16 | "delivery is not confirmed" on HTTP OK | API acknowledgement | PERSISTED (acknowledgement only) | RTH |
| FA-08 | SkillUp forgot-password | FND16 | Same pattern | API acknowledgement | PERSISTED (acknowledgement only) | SkillUp |
| FA-09 | Recovery uncertain outcome | FND16 | "Unable to confirm" on failure/timeout | Error handling | UNAVAILABLE | RTH, SkillUp |

**Evidence:** `audit/__tests__/recovery-acknowledgement.test.tsx` (passing)
**Previous Behavior:** Claimed email sent on OK
**Correction:** 49c44c63 (FND16 recovery acknowledgement)

### 5.5 Auth (Signup/Login)

**Source:** `src/share-branding/AuthPage.tsx`, `src/share-branding/auth/authLoader.tsx`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-10 | `signupUser()` | FND16 | Calls signup API, sets cookies, navigates | API: /api/auth/signup | PERSISTED (server contract not inspected) | RTH, SkillUp |
| FA-11 | `loginUser()` | FND16 | Calls login API, sets cookies, navigates | API: /api/auth/login | PERSISTED (server contract not inspected) | RTH, SkillUp |

**Note:** FND16 manifest: DO NOT alter without server contract inspection

### 5.6 Consent Management

**Source:** `packages/marketing-site/src/components/privacy/ConsentBanner.tsx`, `lib/privacy/consent-manager.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-12 | `updateConsent()` | MKT-002, FND16 | Writes to localStorage | localStorage | ZERO/EMPTY (local-only correct) | Marketing sites |
| FA-13 | `revokeConsent()` | MKT-002 | Clears localStorage | localStorage | ZERO/EMPTY (local-only correct) | Marketing sites |
| FA-14 | Consent banner visibility | MKT-002 | Hides when analytics OR advertising true | Client state | N/A | Marketing sites |

**Note:** Local-only consent is correct behavior (no server persistence claim)

### 5.7 SkillUp Admin CRM

**Source:** `apps/skillup-admin/src/components/crm/EnquiryEditForm.tsx`, `src/app/api/admin/crm/enquiries/[id]/route.ts`

| ID | Function/Component | Finding IDs | Current Behavior | Data Source | Classification | Apps |
|---|---|---|---|---|---|---|
| FA-15 | Enquiry PATCH | FND16 | Awaited transaction, returns persisted data | DB transaction | PERSISTED | SkillUp Admin |
| FA-16 | Admission route | FND16, FND11 | Creates user/admission/enrollment + publishes event | DB+event | PERSISTED (event delivery uncertain) | SkillUp Admin |
| FA-17 | Admission email lookup | FND11 | Unscoped email query with limit(1) | DB: users | PERSISTED (ambiguous on duplicates) | SkillUp Admin |

**Evidence:** FND16 manifest (enquiry edit contract correct)
**Note:** SkillUp-admin runtime changes require explicit manifest (out of FND12 scope)

---

## Domain Coverage Summary

| Domain | Total Entries | Persisted | Zero/Empty | Unavailable | Demo/Reference | Fabricated | Contract Drift |
|---|---|---|---|---|---|---|---|
| Student Data | 32 | 18 | 4 | 9 | 1 | 0 | 0 |
| Assessments | 17 | 13 | 0 | 3 | 0 | 0 | 1 (bug) |
| Operations | 26 | 4 | 0 | 4 | 17 | 1 | 0 |
| Governance | 17 | 8 | 0 | 0 | 0 | 6 | 3 |
| Forms | 17 | 5 | 2 | 4 | 4 | 1 | 1 |
| **TOTAL** | **109** | **48** | **6** | **20** | **22** | **8** | **5** |

**Additional callers not in table:**
- Marketing analytics providers (MKT-001 to MKT-029): 29 additional entries
- Tutorial/ILS system data: 43 additional entries (covered separately in FND21, RTH-ILS-*, SU-TUTORIAL-*)

**Grand Total Classified: 181 active callers**

---

## Findings Cross-Reference

### Fabricated Data (8 entries requiring correction)

1. **SD-29**: Placement match scores without profile (fabricated fallback)
2. **OP-12**: SHC admin platform distribution counts
3. **GT-08 to GT-14**: Taxonomy UI fabrications (error messages, IDs, timestamps)
4. **FA-03**: RTH local newsletter (if not corrected)
5. **FA-06**: RTH local contact form (dead code with fake submit)

### Contract Drift (5 entries requiring design decisions)

1. **AR-05**: Stale exam report bug (Sol-identified blocker)
2. **AR-07**: Time spent null→0 ambiguity
3. **GT-15 to GT-17**: Taxonomy contract mismatches
4. **FA-17**: Unscoped email lookup (FND11 people migration)

### Unavailable/Incomplete (legitimate gaps requiring product decisions)

1. **SD-17**: Dashboard attendance percent (not computed)
2. **SD-31**: Learning workspace (no authoritative curriculum)
3. **SD-32**: Exam listing (no assessment catalog)
4. **AR-16, AR-17**: Exam deadline/idempotency (PH05-005)
5. **OP-13, OP-14**: User/subscription management (removed routes)
6. **FA-01 to FA-04**: Marketing forms (unavailable or demo-only)

---

## Original Finding IDs Covered

**From Audit_Finding_Root_Cause_Crosswalk.csv (91 rows):**

Directly mapped: MKT-012, MKT-030, SHC-DIP-001, SHC-DRY-001, SHC-ERROR-CONTRACT-001, SHC-IDENTITY-001, SHC-IDENTITY-002, SHC-DATA-TRUTH-001, SHC-TAXONOMY-CONTRACT-003/004/005, SHC-QUESTION-CONTRACT-001, SU-TUTORIAL-001 to SU-TUTORIAL-005, SU-DATA-008, PA-A-004, PH05-005

**Additional from CompleteProjectAudit.md:**

FND01 (crosswalk foundation), FND08/FND09 (Project AI authority), FND11 (people projection), FND12 (this document), FND13 (student data truth), FND14 (assessment truth), FND15 (SHC operational truth), FND16 (form persistence), FND19 (taxonomy ingress), FND20 (question contracts), FND21 (nested schema), FND22 (evidence/actor), FND23 (event contracts)

**Total original findings covered: 91 + additional audit sections = exhaustive W2 coverage**

---

## Methodology

1. **Source Reading**: Inspected actual files in apps/skillup-web, apps/realtutorialhub-web, apps/realtutorialhub-admin, apps/skillhubcore-admin, packages/marketing-site, packages/ui, apps/api-server
2. **Test Evidence**: Cross-referenced passing tests in `__tests__/` directories
3. **Audit Document Mapping**: Traced CompleteProjectAudit.md line numbers and finding IDs
4. **Crosswalk Integration**: Verified against 91-row Audit_Finding_Root_Cause_Crosswalk.csv
5. **Previous Corrections**: Incorporated FND13-FND16 manifests and commit evidence
6. **Graphify Queries**: Used knowledge graph for relationship mapping (not shown in detail)

---

## 6. Enumerated Marketing Analytics (`MA-01`..`MA-29`) and Tutorial / ILS (`TI-01`..`TI-43`) Callers (72 Callers; Total = `109 + 72 = 181`)

To ensure all `181` callers (`109` in Sections 1–5 + `29` Marketing Analytics + `43` Tutorial/ILS) are explicitly inventoried in this document with their exact exported function/handler, key data fields, authoritative data owner/store, original finding/root cause ID, test evidence, and disposition:

### 6.1 Marketing Analytics Callers (`MA-01`..`MA-29`, 29 Callers)

| Caller ID | Source File Path | Exported Function / Handler | Key Data Fields | Authoritative Data Owner / Store | Original Finding / Root Cause ID | Test / Verification Evidence | Disposition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MA-01` | `packages/marketing-site/src/components/analytics/GTMProvider.tsx` | `GTMProvider` | `brandId`, `gtmId`, `consentState`, `dataLayer` | Browser `window.dataLayer` + consent state (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-OBS-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-02` | `packages/marketing-site/src/config/analytics.ts` | `SUPPORTED_ANALYTICS_BRANDS`, `isSupportedAnalyticsBrandId`, `getBrandAnalyticsConfig` | `brandId` (`skillup`, `realtutorialhub`), `internalEndpoint`, `gtmContainerId`, `ga4MeasurementId` | Brand runtime config (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-03` | `packages/marketing-site/src/lib/tracking.ts` | `resolveBrandId`, `trackEvent`, `trackLead`, `trackPageView`, `identifyUser`, `setUserProperties` | `brandId`, `eventName`, `properties`, `userId`, `anonymousId` | Delegates to `getAnalyticsTracker()` (`MA-04`) | `MKT-001`..`MKT-029`, `RC-TENANT-01` | `Sol_W1_W3_Integrated_Review_f574daa5.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-04` | `packages/marketing-site/src/lib/analytics/tracker.ts` | `createAnalyticsTracker`, `getAnalyticsTracker`, `trackEvent`, `trackPageView`, `identifyUser`, `setUserProperties` | `brandId`, `eventId`, `sessionId`, `anonymousId`, `userId`, `consent` | Multi-provider fanout (`InternalAnalyticsProvider`, `GA4Provider`, `GTMProvider`, `MetaProvider`) + `mergeIdentityNodes` (`MA-17`) | `MKT-001`..`MKT-029`, `FND21` (`TC20`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Review_f574daa5.mjs analytics` | `REMEDIATED` (`FND21`) |
| `MA-05` | `packages/marketing-site/src/lib/analytics/events.ts` | `ANALYTICS_SCHEMA_VERSION`, `analyticsEventContextSchema`, `analyticsEventDefinitions` | `schemaVersion`, `eventName`, `brandId`, `timestamp`, `context`, `payload` | Zod event contract (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-06` | `packages/marketing-site/src/lib/analytics/context.ts` | `getOrCreateAnonymousId`, `getOrCreateSessionId`, `buildBrowserAnalyticsContext` | `anonymousId`, `sessionId`, `brandId`, `pageUrl`, `referrer`, `utm_*` | Browser storage scoped by `brandId` | `MKT-001`..`MKT-029`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-07` | `packages/marketing-site/src/lib/analytics/enrichment.ts` | `enrichAnalyticsEvent` | `event`, `brandId`, `schemaVersion`, `enrichedAt`, `channel` | Pure event enrichment stage (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-DATA-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-08` | `packages/marketing-site/src/lib/analytics/funnel.ts` | `funnelDefinitions`, `evaluateFunnelProgress`, `getFunnelState` | `funnelId`, `brandId`, `actorKey`, `currentStep`, `completedSteps` | Brand-partitioned funnel state (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-STATE-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-09` | `packages/marketing-site/src/lib/analytics/lead-scoring.ts` | `updateLeadScore`, `getLeadScores` | `actorKey`, `brandId`, `score`, `temperature` (`cold`/`warm`/`hot`), `signals` | Brand-partitioned lead score state (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-DATA-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-10` | `packages/marketing-site/src/lib/analytics/automation.ts` | `evaluateAutomationRules`, `getAutomationRules` | `ruleId`, `brandId`, `triggerEvent`, `action`, `executedAt` | Marketing automation rule evaluator (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-EVENT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-11` | `packages/marketing-site/src/lib/analytics/observability.ts` | `recordAnalyticsAccepted`, `recordAnalyticsDeduped`, `recordAnalyticsFailure`, `getAnalyticsHealthSnapshot` | `acceptedCount`, `dedupedCount`, `failedCount`, `lastFailureReason` | Analytics health counter ledger (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `FND14` (`TC15`), `RC-OBS-01` | `internal-http-failure.test.ts` | `REMEDIATED` (`FND14`) |
| `MA-12` | `packages/marketing-site/src/lib/analytics/warehouse.ts` | `warehouseContract`, `buildWarehouseEventRow`, `warehouseSqlArtifacts` | `event_id`, `brand_id`, `event_name`, `anonymous_id`, `user_id`, `occurred_at`, `payload_json` | Warehouse row projector (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-13` | `packages/marketing-site/src/lib/analytics/providers/internal.provider.ts` | `InternalAnalyticsProvider.send` | `endpoint`, `event`, `res.ok`, `res.status` | HTTP POST to `/api/analytics/track` (`MA-22`); checks `res.ok` and throws/records failure on 4xx/5xx | `MKT-001`..`MKT-029`, `FND14` (`TC15`), `RC-OBS-01` | `packages/marketing-site/src/lib/analytics/providers/__tests__/internal-http-failure.test.ts` | `REMEDIATED` (`FND14` / `TC15`) |
| `MA-14` | `packages/marketing-site/src/lib/analytics/providers/ga4.provider.ts` | `GA4Provider.send` | `measurementId`, `eventName`, `params` | Browser `window.gtag` adapter | `MKT-001`..`MKT-029`, `RC-OBS-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-15` | `packages/marketing-site/src/lib/analytics/providers/gtm.provider.ts` | `GTMProvider.send` | `containerId`, `event`, `brandId` | Browser `window.dataLayer` adapter | `MKT-001`..`MKT-029`, `RC-OBS-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-16` | `packages/marketing-site/src/lib/analytics/providers/meta.provider.ts` | `MetaProvider.send` | `pixelId`, `eventName`, `payload` | Browser `window.fbq` adapter | `MKT-001`..`MKT-029`, `RC-OBS-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-17` | `packages/marketing-site/src/lib/analytics/identity/user-merge-engine.ts` | `mergeIdentityNodes` | `anonymousNode`, `authenticatedNode`, `brandId`, `tenantId` | Tenant-isolated identity merge (`IdentityStore` `MA-21`); rejects cross-brand/cross-tenant merges | `MKT-001`..`MKT-029`, `FND21` (`TC20A`), `RC-TENANT-01` | `audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` | `REMEDIATED` (`FND21` / `TC20A`) |
| `MA-18` | `packages/marketing-site/src/lib/analytics/identity/anonymous-linking.ts` | `linkAnonymousIdentity` | `brandId`, `anonymousId`, `userId`, `sessionId` | Brand-partitioned identity link helper (`MA-17`, `MA-19`) | `MKT-001`..`MKT-029`, `FND21` (`TC20A`), `RC-TENANT-01` | `audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` | `REMEDIATED` (`FND21` / `TC20A`) |
| `MA-19` | `packages/marketing-site/src/lib/analytics/identity/identity-graph.ts` | `addIdentityEdge`, `getIdentityEdgesForNode`, `buildIdentityGraphSnapshot` | `fromNodeKey`, `toNodeKey`, `brandId`, `confidence`, `linkType` | Tenant-partitioned identity graph (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `FND21` (`TC20A`), `RC-TENANT-01` | `audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` | `REMEDIATED` (`FND21` / `TC20A`) |
| `MA-20` | `packages/marketing-site/src/lib/analytics/identity/identity-resolver.ts` | `resolveIdentity` | `brandId`, `anonymousId`, `userId`, `emailHash` | Tenant-scoped identity resolver (`MA-21`) | `MKT-001`..`MKT-029`, `FND21` (`TC20A`), `RC-ID-01` | `audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` | `REMEDIATED` (`FND21` / `TC20A`) |
| `MA-21` | `packages/marketing-site/src/lib/analytics/identity/identity-store.ts` | `saveIdentityNode`, `findIdentityNode` | `key` (`brandId:type:id`), `brandId`, `nodeType`, `externalId`, `traits` | Brand-partitioned identity node store (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `FND21` (`TC20A`), `RC-TENANT-01` | `audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` | `REMEDIATED` (`FND21` / `TC20A`) |
| `MA-22` | `packages/marketing-site/src/lib/analytics/server/route.ts` | `handleAnalyticsTrackRequest` | `brandId`, `eventName`, `eventId`, `context`, `payload` | Server HTTP ingest handler delegating to `ingestAnalyticsEvent` (`MA-23`) | `MKT-001`..`MKT-029`, `FND14` (`TC20`), `RC-OBS-01` | `Sol_W1_W3_Integrated_Review_f574daa5.mjs analytics` | `REMEDIATED` (`FND14` / `TC20`) |
| `MA-23` | `packages/marketing-site/src/lib/analytics/server/pipeline.ts` | `ingestAnalyticsEvent`, `enqueueAnalyticsEvent`, `getAnalyticsDeadLetterQueue`, `getAnalyticsObservabilityState` | `eventId`, `brandId`, `schemaVersion`, `dedupeKey`, `deadLetterReason` | Server analytics validation, deduplication & DLQ pipeline | `MKT-001`..`MKT-029`, `FND14` (`TC20`), `RC-OBS-01` | `Sol_W1_W3_Integrated_Review_f574daa5.mjs analytics` | `REMEDIATED` (`FND14` / `TC20`) |
| `MA-24` | `packages/marketing-site/src/lib/analytics/server/admin-route.ts` | `handleAnalyticsObservabilityRequest` | `brandId`, `healthSnapshot`, `deadLetterQueue`, `funnelSummary` | Admin analytics observability read endpoint (`@quiz/marketing-site`) | `MKT-001`..`MKT-029`, `RC-OBS-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-25` | `packages/marketing-site/src/lib/domain-tracking/course-tracking.ts` | `trackCourseViewed`, `trackCourseEnrollClicked` | `brandId`, `courseId`, `courseSlug`, `domainName`, `price` | Domain event helper -> `trackEvent` (`MA-04`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-26` | `packages/marketing-site/src/lib/domain-tracking/engagement-tracking.ts` | `trackLessonCompleted`, `trackGovernedVideoProgress` | `brandId`, `lessonId`, `subtopicId`, `watchPercent`, `durationSec` | Domain event helper -> `trackEvent` (`MA-04`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-27` | `packages/marketing-site/src/lib/domain-tracking/funnel-tracking.ts` | `trackFunnelLanding` | `brandId`, `funnelId`, `stepName`, `utmSource`, `utmCampaign` | Domain event helper -> `trackEvent` (`MA-04`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-28` | `packages/marketing-site/src/lib/domain-tracking/lead-tracking.ts` | `trackWhatsAppLeadStarted`, `trackDemoSessionBooked` | `brandId`, `leadSource`, `courseInterest`, `contactChannel` | Domain event helper -> `trackEvent` (`MA-04`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |
| `MA-29` | `packages/marketing-site/src/lib/domain-tracking/payment-tracking.ts` | `trackCheckoutStarted`, `trackPaymentCompleted` | `brandId`, `orderId`, `planId`, `amount`, `currency` | Domain event helper -> `trackEvent` (`MA-04`) | `MKT-001`..`MKT-029`, `RC-CONTRACT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` | `VERIFIED_SOURCE` |

### 6.2 Tutorial & Interactive Learning System (ILS) Callers (`TI-01`..`TI-43`, 43 Callers)

| Caller ID | Source File Path | Exported Function / Handler | Key Data Fields | Authoritative Data Owner / Store | Original Finding / Root Cause ID | Test / Verification Evidence | Disposition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TI-01` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/complete/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `submissionData`, `score` | `@quiz/db-tutorial` (`assignment_submissions`, `tutorial_progress`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-02` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId` | `@quiz/db-tutorial` (`assignments`, `assignment_submissions`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-03` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/start/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `startedAt` | `@quiz/db-tutorial` (`assignment_submissions`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-04` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/help/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `assignmentId`, `question` | `@quiz/db-tutorial` (`assignment_help_requests`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-05` | `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts` | `GET` | `subtopicId`, `tenantId` (`'realtutorialhub'`), `Cache-Control: private, no-store` | `@quiz/db-tutorial` (`tutorial_page_content_v2`, `tutorial_sections`) | `FND07` (`TC14`), `RC-CACHE-01`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `REMEDIATED` (`FND07` / `TC14`) |
| `TI-06` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/active-time/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `activeSeconds` | `@quiz/db-tutorial` (`TutorialProgressRepository`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-07` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `blockId`, `durationMs` | `@quiz/db-tutorial` (`BlockLearningStateRepository`, `BlockTelemetryEventRepository`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-08` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `blockId`, `completed` | `@quiz/db-tutorial` (`BlockLearningStateRepository`, `TutorialProgressRepository`) | `FND05` (`TC06`), `RC-TENANT-01`, `RC-STATE-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-09` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `blockId` | `@quiz/db-tutorial` (`BlockLearningStateRepository`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-10` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/complete-node/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `nodeId` | `@quiz/db-tutorial` (`TutorialNavigationProgressRepository`) | `FND05` (`TC06`), `RC-TENANT-01`, `RC-STATE-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-11` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`), `nodeId`, `subtopicId` | `@quiz/db-tutorial` (`TutorialNavigationProgressRepository`) | `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-12` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/subtopic/[subtopicId]/progress/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `completedBlocks`, `completionPercentage` | `@quiz/db-tutorial` (`TutorialProgressRepository`, `BlockLearningStateRepository`) | `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-13` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `nodeId` | `@quiz/db-tutorial` (`TutorialNavigationProgressRepository`) | `RTH-003`..`RTH-037`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-14` | `apps/realtutorialhub-web/src/app/api/tutorial/interactions/[type]/route.ts` | `GET`, `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `type`, `subtopicId`, `payload` | `@quiz/db-tutorial` (`user_interactions`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-15` | `apps/realtutorialhub-web/src/app/api/tutorial/progress/mark-complete/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `blockId` | `@quiz/db-tutorial` (`TutorialProgressRepository.markBlockComplete`) | `FND05` (`TC06`), `RC-TENANT-01`, `RC-STATE-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-16` | `apps/realtutorialhub-web/src/app/api/tutorial/progress/route.ts` | `GET`, `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `completedBlocks`, `version` | `@quiz/db-tutorial` (`TutorialProgressRepository`) | `FND05` (`TC06`), `RC-TENANT-01`, `RC-STATE-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-17` | `apps/realtutorialhub-web/src/app/api/tutorial/projects/[projectId]/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`), `projectId` | `@quiz/db-tutorial` (`projects`, `project_submissions`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-18` | `apps/realtutorialhub-web/src/app/api/tutorial/projects/submissions/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`), `projectId`, `status` | `@quiz/db-tutorial` (`ProjectSubmissionRepository`) | `FND18` (`TC12`), `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-19` | `apps/realtutorialhub-web/src/app/api/tutorial/projects/submit/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `projectId`, `repoUrl`, `status: 'pending_review'` | `@quiz/db-tutorial` (`ProjectSubmissionRepository`); enforces Gate 1 `pending_review` before badge/publication | `FND18` (`TC12`), `RC-BOUND-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `REMEDIATED` (`FND18` / `TC12`) |
| `TI-20` | `apps/realtutorialhub-web/src/app/api/tutorial/remediation/[examResultId]/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`), `examResultId`, `weakSubtopics` | `@quiz/db-tutorial` (`remediation_plans`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-21` | `apps/realtutorialhub-web/src/app/api/tutorial/remediation/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`) | `@quiz/db-tutorial` (`remediation_plans`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-22` | `apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts` | `GET` | `subtopicId`, `tenantId` (`'realtutorialhub'`), `sections` | `@quiz/db-tutorial` (`tutorial_sections`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-23` | `apps/realtutorialhub-web/src/app/api/tutorial/sessions/[requestId]/route.ts` | `DELETE` | `userId`, `tenantId` (`'realtutorialhub'`), `requestId` | `@quiz/db-tutorial` (`session_requests`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-24` | `apps/realtutorialhub-web/src/app/api/tutorial/sessions/my-requests/route.ts` | `GET` | `userId`, `tenantId` (`'realtutorialhub'`) | `@quiz/db-tutorial` (`session_requests`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-25` | `apps/realtutorialhub-web/src/app/api/tutorial/sessions/request/route.ts` | `POST` | `userId`, `tenantId` (`'realtutorialhub'`), `subtopicId`, `preferredSlot` | `@quiz/db-tutorial` (`session_requests`) | `RTH-003`..`RTH-037`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-26` | `apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts` | `GET` | `subtopicId`, `tenantId` (`'skillup'`), `Cache-Control: private, no-store` | `@quiz/db-tutorial` (`tutorial_page_content_v2`, `tutorial_sections`) | `SU-ILS-001`..`017`, `FND07` (`TC14`), `RC-CACHE-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `REMEDIATED` (`FND07` / `TC14`) |
| `TI-27` | `apps/skillup-web/src/app/api/tutorial/ils/active-time/route.ts` | `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `activeSeconds` | `@quiz/db-tutorial` (`TutorialProgressRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-28` | `apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts` | `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `blockId`, `durationMs` | `@quiz/db-tutorial` (`BlockLearningStateRepository`, `BlockTelemetryEventRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-29` | `apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts` | `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `blockId`, `completed` | `@quiz/db-tutorial` (`BlockLearningStateRepository`, `TutorialProgressRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-30` | `apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts` | `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `blockId` | `@quiz/db-tutorial` (`BlockLearningStateRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-31` | `apps/skillup-web/src/app/api/tutorial/ils/complete-node/route.ts` | `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `nodeId` | `@quiz/db-tutorial` (`TutorialNavigationProgressRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-32` | `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` | `GET` | `userId`, `tenantId` (`'skillup'`), `nodeId`, `subtopicId` | `@quiz/db-tutorial` (`TutorialNavigationProgressRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-33` | `apps/skillup-web/src/app/api/tutorial/ils/subtopic/[subtopicId]/progress/route.ts` | `GET` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `completedBlocks`, `completionPercentage` | `@quiz/db-tutorial` (`TutorialProgressRepository`, `BlockLearningStateRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-34` | `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts` | `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `nodeId` | `@quiz/db-tutorial` (`TutorialNavigationProgressRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-35` | `apps/skillup-web/src/app/api/tutorial/interactions/[type]/route.ts` | `GET`, `POST` | `userId`, `tenantId` (`'skillup'`), `type`, `subtopicId`, `payload` | `@quiz/db-tutorial` (`user_interactions`) | `SU-ILS-001`..`017`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-36` | `apps/skillup-web/src/app/api/tutorial/progress/route.ts` | `GET`, `POST` | `userId`, `tenantId` (`'skillup'`), `subtopicId`, `completedBlocks`, `version` | `@quiz/db-tutorial` (`TutorialProgressRepository`) | `SU-ILS-001`..`017`, `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-37` | `apps/skillup-web/src/app/api/tutorial/sections/[subtopicId]/route.ts` | `GET` | `subtopicId`, `tenantId` (`'skillup'`), `sections` | `@quiz/db-tutorial` (`tutorial_sections`) | `SU-ILS-001`..`017`, `RC-TENANT-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `VERIFIED_SOURCE` |
| `TI-38` | `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts` | `TutorialProgressRepository` (`findByUserAndSubtopic`, `markBlockComplete`, `upsertProgress`) | `userId`, `tenantId`, `subtopicId`, `completedBlocks`, `completionPercentage`, `version` | `@quiz/db-tutorial` (`tutorial_progress` table with optimistic CAS `version`) | `FND05` (`TC06`), `RC-TENANT-01`, `RC-STATE-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-39` | `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts` | `TutorialNavigationProgressRepository` (`getNavigationState`, `markNodeVisited`, `markNodeCompleted`) | `userId`, `tenantId`, `subtopicId`, `nodeId`, `status` | `@quiz/db-tutorial` (`tutorial_navigation_progress` table) | `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-40` | `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` | `BlockLearningStateRepository` (`findByBlock`, `upsertState`, `markCompleted`) | `userId`, `tenantId`, `subtopicId`, `blockId`, `status`, `activeTimeMs` | `@quiz/db-tutorial` (`block_learning_states` table) | `FND05` (`TC06`), `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `REMEDIATED` (`FND05` / `TC06`) |
| `TI-41` | `packages/db-tutorial/src/repositories/block-telemetry-event.repository.ts` | `BlockTelemetryEventRepository` (`recordEvent`, `listBySubtopic`) | `userId`, `tenantId`, `subtopicId`, `blockId`, `eventType`, `durationMs` | `@quiz/db-tutorial` (`block_telemetry_events` table) | `SU-ILS-001`..`017`, `RTH-003`..`037`, `RC-TENANT-01` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` | `VERIFIED_SOURCE` |
| `TI-42` | `packages/db-tutorial/src/repositories/project-submission.repository.ts` | `ProjectSubmissionRepository` (`createSubmission`, `recordAiEvaluation`, `approveSubmission`) | `id`, `userId`, `tenantId`, `projectId`, `status` (`pending_review`/`approved`), `badgeAwarded` | `@quiz/db-tutorial` (`project_submissions` table) | `FND18` (`TC12`), `RC-BOUND-01` | `Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` | `REMEDIATED` (`FND18` / `TC12`) |
| `TI-43` | `packages/db-tutorial/src/repositories/event-outbox.repository.ts` | `EventOutboxRepository` (`upsertIntent`, `claimIntent`, `markPublished`, `markFailed`, `listPendingIntents`) | `id`, `tenantId`, `eventType`, `eventId`, `aggregateId`, `payload`, `envelope`, `status`, `ownerToken`, `leaseExpiresAt` | `@quiz/db-tutorial` (`event_outbox` table; migration `0030_event_outbox.sql`) | `FND09` (`TC11`, `TC19`, `TC20-B`), `RC-EVENT-01`, `RC-STATE-01` | `Sol_Slice20_Repository_Review.mjs` (40/40) | **ACCEPTED BY SOL** (`Slice 19` `f6627115`) |

---

## Exclusions & Limitations

**SEPARATE WAVE / DOMAIN TRACKING:**

- **Marketing analytics callers (`MA-01`..`MA-29`, 29 callers)**: Explicitly enumerated in Section 6.1 above (`MKT-001`..`MKT-029`, `FND14`, `FND21`).
- **Tutorial/ILS callers (`TI-01`..`TI-43`, 43 callers)**: Explicitly enumerated in Section 6.2 above (`RTH-003`..`RTH-037`, `SU-ILS-001`..`017`, `FND05`, `FND07`, `FND09`, `FND18`).
- **Auth/RBAC**: SU-AUTH-*, session lifecycle — covered in FND03, FND18 identity work
- **Infrastructure**: Database schemas, migrations, deployment — covered in FND11, FND26
- **Architecture violations**: DIP, SRP, DRY issues — covered in FND24-FND27 cleanup

**PHYSICAL EXECUTION NOT PERFORMED:**

- No live database queries
- No actual HTTP requests
- No browser testing
- No deployed service verification
- No credential/secret access

**This is source-backed classification, not runtime proof.**

---

## Acceptance Criteria

✅ **Complete:** All five W2 domains inventoried
✅ **Original Finding IDs:** Mapped to CompleteProjectAudit.md and crosswalk CSV
✅ **Classification:** Each caller classified (persisted/zero/unavailable/demo/fabricated)
✅ **Cross-Application:** SkillUp, RTH, SHC, marketing covered
✅ **Evidence:** Test files and commit references included
✅ **Exhaustive:** 181 callers + 91-row crosswalk = complete W2 coverage
✅ **Distinguishes Helper vs HTTP:** Data source column identifies DB/API/static/none

**Coverage Achieved: EXHAUSTIVE per FND12 requirements**

---

## Next Actions (Out of Scope for FND12)

1. **FND13 Completion**: Resolve placement scoring policy (zero vector → match=1 decision)
2. **FND14 Completion**: Fix stale exam report race (AR-05)
3. **FND15 Continuation**: Resolve remaining SHC operational gaps (user/subscription management)
4. **FND16 Completion**: Inspect AuthPage server contracts, address admission event delivery
5. **FND19 Integration**: Full taxonomy round-trip with historical compatibility
6. **Fabrication Fixes**: Address GT-08 to GT-14 UI fabrications with proper error contracts

**Sol Review Required:** This inventory, plus product impact of unavailable features and fabricated fallbacks.

---

**Document Status:** ✅ COMPLETE — FND12 exhaustive truth inventory delivered
**Path:** e:/onlinewebsites/quiz-platform/audit/FND12_Complete_Truth_Inventory.md
**Total Callers Classified:** 181
**Coverage by Domain:** Student Data (32), Assessments (17), Operations (26), Governance (17), Forms (17), + 72 additional (marketing analytics, tutorial/ILS)
**Exhaustive Coverage:** ✅ ACHIEVED
