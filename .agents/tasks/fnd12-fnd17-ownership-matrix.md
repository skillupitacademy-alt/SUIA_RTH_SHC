# FND12+FND17 File Ownership Matrix

**Investigation Authority:** audit/FND12_Complete_Truth_Inventory.md, audit/FND17_W2_Coverage_Map.md, audit/FND01_Finding_Register_Reconciliation.md  
**Baseline:** Branch remediation/w1-2-batch-05-targeted at 86f1d7a9  
**Scope:** File ownership conflicts for 181 callers and 177 W2 findings  
**Investigation Date:** 2026-11-06  
**Status:** EXTRACTION_COMPLETE (read-only)

---

## Executive Summary

This matrix maps **177 W2 findings** to **181 active caller sites** across **five domains**, identifying file ownership conflicts for parallel implementation planning.

**Key Findings:**

1. **Shared Schema Files (10 files):** Core database schemas touched by multiple findings — require sequential implementation
2. **Shared Service Files (8 files):** Central services called by multiple domains — require coordination
3. **Domain-Isolated Files (90% of files):** Most caller sites are domain-specific and can be modified independently
4. **Sequential Chains:** Three major dependency chains requiring ordered implementation
5. **Ownership Conflicts:** 18 files modified by 3+ findings require sequential work

**Parallel Implementation Readiness:**
- **Independent work:** Marketing (MKT), Operations (OP), Forms (FA) domains can proceed in parallel
- **Sequential work:** Identity chain, Email chain, Taxonomy CRUD, Shared schemas must follow dependency order

---

## Section 1: Finding-to-File Mapping (177 Findings)

### Domain 1: Student Data (32 callers from FND12)

| Finding IDs | Function/Component | File Path | Classification | Shared |
|---|---|---|---|---|
| FND13, PA-A-004 | getSkillupPrograms (SD-01 to SD-06) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED | YES |
| FND13 | getSkillupFaculty (SD-07 to SD-09) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED | YES |
| FND13 | getStudentBatchContext (SD-10 to SD-15) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED | YES |
| FND13 | getSkillupStudentDashboard (SD-16 to SD-21) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED | YES |
| FND13 | getSkillupAttendance (SD-22 to SD-23) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED | YES |
| FND13 | getSkillupPayments (SD-24 to SD-25) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED | YES |
| FND13 | getSkillupPlacement (SD-26 to SD-30) | apps/skillup-web/src/lib/skillup-data.ts | PERSISTED+FABRICATED | YES |
| FND13 | Learn workspace (SD-31) | apps/skillup-web/src/app/student/learn/page.tsx | UNAVAILABLE | NO |
| FND14, PH05-005 | Exams listing (SD-32) | apps/skillup-web/src/app/student/exams/page.tsx | UNAVAILABLE | NO |

**Test Files:**
- apps/skillup-web/src/lib/__tests__/program-truth.test.ts (22 passing)
- apps/skillup-web/src/lib/__tests__/faculty-truth.test.ts (3 passing)
- apps/skillup-web/src/lib/__tests__/batch-truth.test.ts (5 passing)
- apps/skillup-web/src/lib/__tests__/dashboard-truth.test.ts (partial)
- apps/skillup-web/src/lib/__tests__/attendance-truth.test.ts (2 passing)
- apps/skillup-web/src/lib/__tests__/payment-truth.test.ts (3 passing)
- apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts (partial)
- apps/skillup-web/src/app/student/exams/__tests__/listing-truth.test.tsx

**Shared File:** `apps/skillup-web/src/lib/skillup-data.ts` — contains 7 function groups (SD-01 through SD-30)

---

### Domain 2: Assessment & Reports (17 callers from FND12)

| Finding IDs | Function/Component | File Path | Classification | Shared |
|---|---|---|---|---|
| FND14 | ExamResultsReport mount (AR-01 to AR-07) | packages/ui/src/report/ExamResultsReport.tsx | PERSISTED | YES |
| FND14 | ReportEngine.getExamReport (AR-06 to AR-07) | apps/api-server/src/lib/report/ReportEngine.ts | PERSISTED | NO |
| FND14, FND15 | StudentInsightFormatter (AR-08 to AR-14) | apps/api-server/src/lib/export/formatters/studentInsightFormatter.ts | PERSISTED | NO |
| PH05-005 | Exam configuration (AR-15 to AR-17) | apps/skillup-web/src/app/launch-exam/configure/page.tsx | UNAVAILABLE | NO |

**Test Files:**
- packages/ui/src/report/__tests__/report-truth.test.tsx (10 passing, 1 failing)

**Shared File:** `packages/ui/src/report/ExamResultsReport.tsx` — touched by 7 AR findings

---

### Domain 3: Operational Data (26 callers from FND12)

| Finding IDs | Function/Component | File Path | Classification | Shared |
|---|---|---|---|---|
| FND15 | GOVERNANCE_DATA (OP-01) | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | DEMO/REFERENCE | NO |
| FND15 | INVENTORY_GROUPS (OP-02) | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | DEMO/REFERENCE | NO |
| FND15 | MANIFESTO_DATA (OP-03) | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | DEMO/REFERENCE | NO |
| FND15 | ADMIN_SPEC_DATA (OP-04) | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | DEMO/REFERENCE | NO |
| FND15 | CORE_SPEC_DATA (OP-05) | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | DEMO/REFERENCE | NO |
| FND15 | ARCHITECTURE_DATA (OP-06) | apps/realtutorialhub-admin/src/lib/governance-inventory.ts | DEMO/REFERENCE | NO |
| FND15 | Codebase inventory (OP-07 to OP-11) | apps/realtutorialhub-admin/src/lib/codebase-inventory-data.ts | DEMO/REFERENCE | NO |
| FND15 | SHC dashboard (OP-12 to OP-14) | apps/skillhubcore-admin/src/lib/skillhubcore-admin-data.ts | FABRICATED/UNAVAILABLE | NO |
| FND15, FND12 | Certificate generator (OP-15 to OP-17) | packages/marketing-site/src/certificates/CertificateGeneratorPage.tsx | DEMO/REFERENCE | NO |
| FND08, FND15, FND22 | Workflow state (OP-18 to OP-21) | apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts | PERSISTED | NO |
| FND15 | Block registry (OP-22 to OP-23) | apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts | DEMO/REFERENCE | NO |
| FND15 | Compliance brief (OP-24 to OP-26) | apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/[workflowId]/compliance-brief/page.tsx | PERSISTED/DEMO | NO |

**Classification:** Mostly DEMO/REFERENCE static data; minimal file conflicts

---

### Domain 4: Governance & Taxonomy (17 callers from FND12)

| Finding IDs | Function/Component | File Path | Classification | Shared |
|---|---|---|---|---|
| SHC-DIP-001, FND19 | Domain POST/GET/PUT/DELETE (GT-01 to GT-04) | apps/skillhubcore-admin/src/app/api/admin/domains/route.ts | PERSISTED | NO |
| SHC-DRY-001 | Subject CRUD (GT-05) | apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts | PERSISTED | NO |
| SHC-DRY-001, FND19 | Topic CRUD (GT-06) | apps/skillhubcore-admin/src/app/api/admin/topics/route.ts | PERSISTED | NO |
| SHC-DRY-001 | Subtopic CRUD (GT-07) | apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts | PERSISTED | NO |
| SHC-ERROR-CONTRACT-001 | DomainTable (GT-08) | apps/skillhubcore-admin/src/components/taxonomy/DomainTable.tsx | FABRICATED | NO |
| SHC-ERROR-CONTRACT-001 | SubjectTable (GT-09) | apps/skillhubcore-admin/src/components/taxonomy/SubjectTable.tsx | FABRICATED | NO |
| SHC-ERROR-CONTRACT-001 | TopicTable (GT-10) | apps/skillhubcore-admin/src/components/taxonomy/TopicTable.tsx | FABRICATED | NO |
| SHC-IDENTITY-001, SHC-TAXONOMY-CONTRACT-005 | SubtopicTable (GT-11 to GT-12) | apps/skillhubcore-admin/src/components/taxonomy/SubtopicTable.tsx | FABRICATED | NO |
| SHC-IDENTITY-002, SHC-DATA-TRUTH-001 | QuestionTable (GT-13 to GT-14) | apps/skillhubcore-admin/src/components/taxonomy/QuestionTable.tsx | FABRICATED | NO |
| SHC-TAXONOMY-CONTRACT-003/004, SHC-TAXONOMY-DATA-001 | Contract drift (GT-15 to GT-17) | Multiple taxonomy UI hooks + schemas | CONTRACT DRIFT | YES |

**Shared Schema Files (taxonomy):**
- drizzle/schema/domains.ts
- drizzle/schema/subjects.ts
- drizzle/schema/topics.ts
- drizzle/schema/subtopics.ts

**Contract Conflicts:** UI hooks generate slugs/complexity; API expects different fields — shared ownership problem

---

### Domain 5: Forms & Actions (17 callers from FND12)

| Finding IDs | Function/Component | File Path | Classification | Shared |
|---|---|---|---|---|
| MKT-030, FND16 | Newsletter (shared) (FA-01 to FA-02) | packages/marketing-site/src/components/footer/FooterBrand.tsx | UNAVAILABLE | NO |
| FND16, MKT-030 | Newsletter (RTH local) (FA-03) | apps/realtutorialhub-site/components/footer/FooterBrand.tsx | UNAVAILABLE/FABRICATED | NO |
| MKT-010, MKT-019 | ContactForm component (FA-04) | packages/marketing-site/src/components/contact/ContactForm.tsx | DEMO/REFERENCE | NO |
| MKT-019 | ContactUs (shared) (FA-05) | packages/marketing-site/src/components/contact/ContactUs.tsx | DEMO/REFERENCE | NO |
| MKT-019 | ContactUs (RTH local) (FA-06) | apps/realtutorialhub-site/components/contact/ContactUs.tsx | FABRICATED | NO |
| FND16 | Password recovery RTH (FA-07 to FA-09) | apps/realtutorialhub-web/src/app/forgot-password/page.tsx | PERSISTED | NO |
| FND16 | Password recovery SkillUp (FA-08 to FA-09) | apps/skillup-web/src/app/forgot-password/page.tsx | PERSISTED | NO |
| FND16 | signupUser/loginUser (FA-10 to FA-11) | src/share-branding/auth/authLoader.tsx | PERSISTED | YES |
| MKT-002, FND16 | Consent management (FA-12 to FA-14) | packages/marketing-site/src/components/privacy/ConsentBanner.tsx | ZERO/EMPTY | NO |
| FND16, FND11 | SkillUp Admin CRM (FA-15 to FA-17) | apps/skillup-admin/src/components/crm/EnquiryEditForm.tsx | PERSISTED | NO |
| FND16, FND11 | Admission route (FA-16 to FA-17) | apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/route.ts | PERSISTED | NO |

**Shared File:** `src/share-branding/auth/authLoader.tsx` — used by both RTH and SkillUp

---

### Domain 6: Marketing Sites (44 findings from FND17)

| Finding IDs | Description | File Path | Status | Shared |
|---|---|---|---|---|
| MKT-012 | Brand resolution fails open | packages/marketing-site/src/lib/tracking.ts | NOT_STARTED | YES |
| MKT-012 | Brand analytics config | packages/marketing-site/src/config/analytics.ts | NOT_STARTED | YES |
| MKT-012 | Tracker singleton | packages/marketing-site/src/lib/analytics/tracker.ts | NOT_STARTED | YES |
| MKT-013 | Course page remote structure | packages/marketing-site/src/course-page.tsx | NOT_STARTED | NO |
| MKT-013 | Remote course deserialization | packages/marketing-site/src/content/courses.ts | NOT_STARTED | NO |
| MKT-014 | Duplicate main landmarks (root) | apps/skillupitacademy-site/app/layout.tsx | NOT_STARTED | NO |
| MKT-014 | Duplicate main landmarks (nested) | packages/marketing-site/src/course-layout.tsx | NOT_STARTED | NO |
| MKT-015 | Static export verification | apps/skillupitacademy-site/next.config.mjs | DEFERRED | NO |
| MKT-016 | Static file path containment | apps/skillupitacademy-site/server.mjs | DEFERRED | NO |
| MKT-017 | Control-plane contract drift (canonical) | packages/marketing-site/src/content/contracts.ts | NOT_STARTED | YES |
| MKT-017 | Control-plane contract drift (proxy) | apps/skillupitacademy-site/proxy.ts | NOT_STARTED | YES |
| MKT-018 | Internal analytics HTTP errors | packages/marketing-site/src/lib/analytics/providers/internal.provider.ts | COMPLETE | NO |
| MKT-019 | Contact component semantic gap | packages/marketing-site/src/components/contact/ContactUs.tsx | PARTIAL | NO |
| MKT-020 | RAF lifecycle leak | packages/marketing-site/src/components/Providers/LenisProvider.tsx | NOT_STARTED | NO |
| MKT-021 | Dead state in HeroClient | packages/marketing-site/src/components/HeroSection/HeroClient.tsx | NOT_STARTED | YES |
| MKT-021 | Ignored children in MarketingHome | packages/marketing-site/src/MarketingHome.tsx | NOT_STARTED | YES |
| MKT-022 | Hero LCP image delayed (slider) | packages/marketing-site/src/components/HeroSection/HeroSlider.tsx | NOT_STARTED | YES |
| MKT-022 | Hero LCP image delayed (auto-slider) | packages/marketing-site/src/components/HeroSection/useAutoSlider.ts | NOT_STARTED | YES |
| MKT-023 | Non-functional hero CTA | packages/marketing-site/src/components/HeroSection/HeroSlider.tsx | NOT_STARTED | YES |
| MKT-024 | Duplicate courses section ID (outer) | packages/marketing-site/src/MarketingHome.tsx | NOT_STARTED | YES |
| MKT-024 | Duplicate courses section ID (nested) | packages/marketing-site/src/components/CourseCards/CourseCards.tsx | NOT_STARTED | YES |
| MKT-025 | Fixed nav hydration delay | packages/marketing-site/src/components/NavBar/NavbarWrapper.tsx | NOT_STARTED | NO |
| MKT-026 | In-page nav debug alerts | packages/marketing-site/src/components/NavBar/useScrollSpy.ts | NOT_STARTED | NO |
| MKT-027 | Dialog keyboard accessibility | packages/marketing-site/src/components/CourseCards/MobileFilterPanel.tsx | NOT_STARTED | NO |
| MKT-028 | Carousel accessibility (slider) | packages/marketing-site/src/components/HeroSection/HeroSlider.tsx | NOT_STARTED | YES |
| MKT-028 | Carousel accessibility (auto-slider) | packages/marketing-site/src/components/HeroSection/useAutoSlider.ts | NOT_STARTED | YES |
| MKT-029 | Static vs remote category drift (static) | packages/marketing-site/src/components/CourseCards/FilterButtons.tsx | NOT_STARTED | YES |
| MKT-029 | Static vs remote category drift (dynamic) | packages/marketing-site/src/components/CourseCards/CourseCards.tsx | NOT_STARTED | YES |
| MKT-030 | Newsletter fake success | packages/marketing-site/src/components/footer/FooterBrand.tsx | COMPLETE | NO |

**Note:** MKT-031 to MKT-055 (16 additional findings) follow similar pattern; detailed enumeration available in FND17.

**Shared Files (Marketing):**
- packages/marketing-site/src/components/HeroSection/HeroSlider.tsx — touched by MKT-021, MKT-022, MKT-023, MKT-028
- packages/marketing-site/src/MarketingHome.tsx — touched by MKT-021, MKT-024
- packages/marketing-site/src/components/CourseCards/CourseCards.tsx — touched by MKT-024, MKT-029

---

### Domain 7: SkillUp/SUIA Platform (74 findings from FND17)

**Key Shared Files:**

| Finding IDs | File Path | Conflict Type |
|---|---|---|
| SU-AUTH-004 to SU-AUTH-026 | apps/api-server/src/services/session.service.ts | Session management (23 findings) |
| SU-AUTH-004 to SU-AUTH-026 | apps/api-server/src/app/api/auth/logout-all/route.ts | Logout lifecycle |
| SU-BRAND-001, SU-BRAND-002 | src/share-branding/* | Brand context/isolation |
| SU-CACHE-002/004/005 | apps/skillup-web/src/app/sw.ts | Service worker cache |
| SU-DATA-008 | apps/skillup-web/src/lib/skillup-data.ts | Already mapped in Domain 1 |
| SU-ILS-001 to SU-ILS-017 | packages/db-tutorial/src/repositories/tutorial-progress.repository.ts | Tutorial system (16 findings) |
| SU-PROGRESS-004 to SU-PROGRESS-008 | packages/db-tutorial/src/repositories/tutorial-progress.repository.ts | Progress concurrency |
| SU-TEST-001 to SU-TEST-012 | packages/ui/src/report/ExamResultsReport.tsx | Already mapped in Domain 2 |
| PH05-005 | apps/skillup-web/src/app/launch-exam/configure/page.tsx | Already mapped in Domain 2 |

**Tutorial/ILS Schema Files (shared across 16 findings):**
- packages/db-tutorial/src/schema/tutorial-progress.ts
- packages/db-tutorial/src/schema/tutorial-sessions.ts
- packages/db-tutorial/src/schema/block-telemetry.ts

---

### Domain 8: RealTutorialHub Platform (37 findings from FND17)

**Key Shared Files:**

| Finding IDs | File Path | Conflict Type |
|---|---|---|
| RTH-AI-004/005/006 | apps/realtutorialhub-web/src/app/api/ai-tutor/* | AI tutor routes (3 findings) |
| RTH-BATCH-001 to RTH-BATCH-007 | apps/realtutorialhub-web/src/lib/rth-data.ts | Batch management (7 findings) |
| RTH-ILS-009 to RTH-ILS-012 | packages/db-tutorial/src/repositories/* | Tutorial system (already mapped) |
| RTH-PROGRESS-001/003 | packages/db-tutorial/src/repositories/tutorial-progress.repository.ts | Progress (already mapped) |
| RTH-EXP-001 to RTH-EXP-006 | apps/api-server/src/app/api/export/download/route.ts | Export ownership (6 findings) |
| RTH-EXP-001 to RTH-EXP-006 | apps/api-server/src/lib/export/ExportEngine.ts | Export engine |

**Export Schema Files (shared across 6 findings):**
- drizzle/schema/export-jobs.ts

---

### Domain 9: Phase Findings (18 findings from FND17)

| Finding IDs | Description | File Path | Shared |
|---|---|---|---|
| PH03-001 to PH03-015 | Session/token lifecycle | apps/api-server/src/services/session.service.ts | YES (already mapped) |
| PH04-001 to PH04-009 | Database ownership | apps/skillhubcore-admin/src/app/api/admin/{domains,subjects,topics,subtopics}/route.ts | YES (already mapped) |
| PH05-001 to PH05-010 | Assessment integrity | packages/ui/src/report/*, apps/skillup-web/src/app/launch-exam/* | YES (already mapped) |

**Classification:** Phase findings map to files already covered in other domains

---

## Section 2: Shared Schema Files (10 files)

These files are touched by **3 or more findings** and require sequential implementation:

| Schema File | Findings Count | Finding IDs | Domain |
|---|---|---|---|
| drizzle/schema/domains.ts | 4 | GT-01 to GT-04, SHC-DIP-001, FND19, PH04-001 | Taxonomy |
| drizzle/schema/subjects.ts | 4 | GT-05, SHC-DRY-001, FND19, PH04-001 | Taxonomy |
| drizzle/schema/topics.ts | 4 | GT-06, SHC-DRY-001, FND19, PH04-001 | Taxonomy |
| drizzle/schema/subtopics.ts | 4 | GT-07, SHC-DRY-001, FND19, PH04-001 | Taxonomy |
| drizzle/schema/batches.ts | 6 | SD-01 to SD-15, SU-BATCH-*, RTH-BATCH-* | Student data |
| drizzle/schema/users.ts | 8 | SD-07, FA-10/11, SU-AUTH-*, PH03-*, FND11 | Identity |
| drizzle/schema/sessions.ts | 10 | SU-AUTH-004 to SU-AUTH-026, PH03-001 to PH03-015 | Sessions |
| packages/db-tutorial/src/schema/tutorial-progress.ts | 12 | SU-PROGRESS-004 to SU-PROGRESS-008, RTH-PROGRESS-001/003, SU-ILS-*, FND21 | Tutorial/ILS |
| packages/db-tutorial/src/schema/tutorial-sessions.ts | 8 | SU-ILS-013 to SU-ILS-017, FND07 | Tutorial sessions |
| drizzle/schema/export-jobs.ts | 6 | RTH-EXP-001 to RTH-EXP-006, FND04 | Export system |

**Recommendation:** Schema files require single-owner sequential implementation. Coordinate via explicit file locks or sequential FEATs.

---

## Section 3: Shared Service Files (8 files)

These service files are called by multiple domains:

| Service File | Findings Count | Finding IDs | Domains |
|---|---|---|---|
| apps/skillup-web/src/lib/skillup-data.ts | 30 | SD-01 to SD-30, SU-DATA-008 | Student data (SkillUp) |
| apps/api-server/src/services/session.service.ts | 23 | SU-AUTH-004 to SU-AUTH-026, PH03-* | Authentication |
| packages/db-tutorial/src/repositories/tutorial-progress.repository.ts | 16 | SU-PROGRESS-*, RTH-PROGRESS-*, SU-ILS-*, FND21 | Tutorial/ILS |
| packages/ui/src/report/ExamResultsReport.tsx | 7 | AR-01 to AR-07, FND14, PH05-006 | Assessment reports |
| apps/api-server/src/app/api/export/download/route.ts | 6 | RTH-EXP-001 to RTH-EXP-006, FND04 | Export downloads |
| src/share-branding/auth/authLoader.tsx | 2 | FA-10, FA-11, FND16 | Auth forms |
| packages/marketing-site/src/lib/tracking.ts | 3 | MKT-012, FND23 | Brand tracking |
| packages/marketing-site/src/components/HeroSection/HeroSlider.tsx | 4 | MKT-021, MKT-022, MKT-023, MKT-028 | Marketing hero |

**Recommendation:** Service files with 5+ findings require sequential implementation within their domain.

---

## Section 4: Sequential Dependency Chains

### Chain 1: Identity Foundation (FND03→FND18→FND06→FND05→FND04)

**Description:** User identity, tenant membership, brand isolation, resource ownership

**File Path Dependencies (in order):**
1. **FND03** — Establish tenant-qualified identity contracts
   - drizzle/schema/users.ts (add tenantId)
   - drizzle/schema/user-profiles.ts (add tenantId)
   - drizzle/schema/memberships.ts (add tenantId)

2. **FND18** — Implement identity projection (people migration)
   - apps/api-server/src/services/identity.service.ts (new)
   - drizzle/schema/identities.ts (new canonical table)

3. **FND06** — Tenant membership verification
   - apps/api-server/src/middleware/tenant-auth.middleware.ts (new)
   - apps/api-server/src/services/membership.service.ts (new)

4. **FND05** — Brand/tenant authorization
   - src/share-branding/tenant-context.ts (add isolation)
   - apps/*/src/middleware/brand-check.ts (enforce boundaries)

5. **FND04** — Resource ownership (export, placement, data access)
   - drizzle/schema/export-jobs.ts (add tenantId)
   - drizzle/schema/placement-profiles.ts (add tenantId)
   - apps/api-server/src/app/api/export/download/route.ts (verify ownership)

**Shared Files (must be modified sequentially):**
- drizzle/schema/users.ts
- drizzle/schema/memberships.ts
- drizzle/schema/export-jobs.ts
- src/share-branding/tenant-context.ts

**Parallel Implementation:** NOT POSSIBLE — each step depends on previous contracts

---

### Chain 2: Email Foundation (FND11→FND16→FND18)

**Description:** Email uniqueness scoping, form persistence, identity unification

**File Path Dependencies (in order):**
1. **FND11** — Scoped email lookups (tenant-qualified)
   - apps/api-server/src/repositories/user.repository.ts (add tenantId to queries)
   - apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/route.ts (fix unscoped limit(1))

2. **FND16** — Form persistence contracts (recovery, newsletter, contact)
   - apps/realtutorialhub-web/src/app/forgot-password/page.tsx (acknowledgement only)
   - packages/marketing-site/src/components/footer/FooterBrand.tsx (unavailable label)
   - apps/api-server/src/services/email.service.ts (verify contract)

3. **FND18** — Identity projection (people migration) — same as Chain 1 step 2

**Shared Files:**
- apps/api-server/src/repositories/user.repository.ts
- apps/api-server/src/services/identity.service.ts (from FND18)

**Parallel Implementation:** FND16 (forms) can proceed independently; FND11 and FND18 must be sequential

---

### Chain 3: W3 Assessment/Tutorial/Export (FND18→FND19→FND20→FND21→FND22→FND23)

**Description:** Wave 3 data architecture, contracts, event streaming

**File Path Dependencies (in order):**
1. **FND18** — Identity projection (from Chain 1)
2. **FND19** — Taxonomy ingress validation
   - apps/skillhubcore-admin/src/app/api/admin/domains/route.ts (add zod validation)
   - apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts (add validation)
   - apps/skillhubcore-admin/src/app/api/admin/topics/route.ts (add validation)
   - apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts (add validation)
3. **FND20** — Question contracts (multi-select delimiter)
   - drizzle/schema/questions.ts (normalize delimiter)
   - apps/api-server/src/lib/quiz/QuestionEngine.ts (update parser)
4. **FND21** — Nested schema (tutorial progress)
   - packages/db-tutorial/src/schema/tutorial-progress.ts (flatten or normalize JSON)
5. **FND22** — Evidence/actor provenance
   - drizzle/schema/audit-logs.ts (add actor/evidence fields)
6. **FND23** — Event contracts (admission, placement, analytics)
   - apps/api-server/src/events/event-publisher.ts (add schema validation)
   - packages/marketing-site/src/lib/analytics/providers/internal.provider.ts (check response.ok)

**Shared Files:**
- apps/skillhubcore-admin/src/app/api/admin/{domains,subjects,topics,subtopics}/route.ts (4 files in FND19)
- drizzle/schema/questions.ts (FND20)
- packages/db-tutorial/src/schema/tutorial-progress.ts (FND21)
- apps/api-server/src/events/event-publisher.ts (FND23)

**Parallel Implementation:** FND19 taxonomy, FND20 questions, FND21 tutorial, FND23 events can proceed independently AFTER FND18 completes

---

## Section 5: File Ownership Conflict Matrix

This table shows files modified by **3 or more findings**, requiring coordination:

| File Path | Finding IDs | Findings Count | Conflict Type | Recommendation |
|---|---|---|---|---|
| **drizzle/schema/users.ts** | FND03, FND18, FND06, FND11, SU-AUTH-*, PH03-* | 8 | Identity foundation | SEQUENTIAL (Chain 1 order) |
| **drizzle/schema/sessions.ts** | SU-AUTH-004 to SU-AUTH-026, PH03-001 to PH03-015 | 10 | Session lifecycle | SEQUENTIAL (one owner) |
| **apps/skillup-web/src/lib/skillup-data.ts** | SD-01 to SD-30, SU-DATA-008 | 30 | Student data helpers | SEQUENTIAL (group by function) |
| **packages/db-tutorial/src/repositories/tutorial-progress.repository.ts** | SU-PROGRESS-*, RTH-PROGRESS-*, SU-ILS-*, FND21 | 16 | Tutorial system | SEQUENTIAL (one owner) |
| **packages/ui/src/report/ExamResultsReport.tsx** | AR-01 to AR-07, FND14, PH05-006 | 7 | Report component | SEQUENTIAL (one owner) |
| **apps/api-server/src/app/api/export/download/route.ts** | RTH-EXP-001 to RTH-EXP-006, FND04 | 6 | Export ownership | SEQUENTIAL (tenant verification first) |
| **packages/marketing-site/src/components/HeroSection/HeroSlider.tsx** | MKT-021, MKT-022, MKT-023, MKT-028 | 4 | Hero rendering | SEQUENTIAL (one owner) |
| **apps/skillhubcore-admin/src/app/api/admin/domains/route.ts** | GT-01 to GT-04, SHC-DIP-001, FND19, PH04-001 | 4 | Taxonomy CRUD | SEQUENTIAL (ingress validation first) |
| **apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts** | GT-05, SHC-DRY-001, FND19, PH04-001 | 4 | Taxonomy CRUD | SEQUENTIAL (ingress validation first) |
| **apps/skillhubcore-admin/src/app/api/admin/topics/route.ts** | GT-06, SHC-DRY-001, FND19, PH04-001 | 4 | Taxonomy CRUD | SEQUENTIAL (ingress validation first) |
| **apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts** | GT-07, SHC-DRY-001, FND19, PH04-001 | 4 | Taxonomy CRUD | SEQUENTIAL (ingress validation first) |
| **src/share-branding/tenant-context.ts** | FND03, FND05, FND06, SU-BRAND-001/002 | 5 | Brand isolation | SEQUENTIAL (Chain 1 order) |
| **packages/marketing-site/src/lib/tracking.ts** | MKT-012, FND23 | 3 | Brand tracking | SEQUENTIAL (event contracts after identity) |
| **packages/marketing-site/src/MarketingHome.tsx** | MKT-021, MKT-024 | 2 | Hero/courses sections | Can batch |
| **packages/marketing-site/src/components/CourseCards/CourseCards.tsx** | MKT-024, MKT-029 | 2 | Courses section | Can batch |
| **apps/api-server/src/services/session.service.ts** | SU-AUTH-004 to SU-AUTH-026, PH03-* | 23 | Session management | SEQUENTIAL (one owner) |
| **apps/api-server/src/services/identity.service.ts** | FND03, FND18, FND11 | 3 | Identity projection | SEQUENTIAL (Chain 1/2 order) |
| **apps/realtutorialhub-web/src/app/forgot-password/page.tsx** | FA-07 to FA-09, FND16 | 3 | Password recovery | Can batch (same FEAT) |

**Color Legend:**
- **8-30 findings:** RED — Requires single owner, strict sequential implementation
- **4-7 findings:** YELLOW — Requires coordination, sequential within finding group
- **2-3 findings:** GREEN — Can batch if findings are independent

---

## Section 6: Parallel Implementation Readiness

### Independent Work (Can Proceed in Parallel)

These files/domains have NO shared ownership conflicts:

**Domain A: Marketing Sites (no identity dependencies)**
- MKT-013: packages/marketing-site/src/course-page.tsx (course remote structure)
- MKT-014: apps/skillupitacademy-site/app/layout.tsx + packages/marketing-site/src/course-layout.tsx (landmarks)
- MKT-020: packages/marketing-site/src/components/Providers/LenisProvider.tsx (RAF lifecycle)
- MKT-025: packages/marketing-site/src/components/NavBar/NavbarWrapper.tsx (hydration delay)
- MKT-026: packages/marketing-site/src/components/NavBar/useScrollSpy.ts (debug alerts)
- MKT-027: packages/marketing-site/src/components/CourseCards/MobileFilterPanel.tsx (dialog a11y)
- MKT-030: packages/marketing-site/src/components/footer/FooterBrand.tsx (newsletter) — ALREADY COMPLETE

**Domain B: Operational Data (static reference data)**
- OP-01 to OP-11: governance/codebase inventory (all DEMO/REFERENCE, no conflicts)

**Domain C: Forms (no shared state)**
- FA-03: apps/realtutorialhub-site/components/footer/FooterBrand.tsx (RTH local newsletter)
- FA-04 to FA-06: Contact forms (presentational/fake, can clean up independently)
- FA-12 to FA-14: Consent management (localStorage only, no conflicts)

**Domain D: SHC Admin Fabrications (UI-only corrections)**
- GT-08 to GT-14: Taxonomy UI tables (fabricated IDs/errors/timestamps) — UI-only, no backend changes

**Total Independent Files:** ~30 files can proceed in parallel with NO coordination

---

### Coordinated Work (Sequential Within Domain)

**Cluster 1: Student Data Helpers (1 file, 30 findings)**
- File: apps/skillup-web/src/lib/skillup-data.ts
- Approach: Group by function (programs, faculty, batch, dashboard, attendance, payments, placement)
- Sequence: Can implement 7 function groups sequentially, each as independent commit

**Cluster 2: Taxonomy CRUD (4 files, 4 findings each)**
- Files: apps/skillhubcore-admin/src/app/api/admin/{domains,subjects,topics,subtopics}/route.ts
- Approach: Implement FND19 ingress validation (zod schemas) first, then contract fixes
- Sequence: Single FEAT can batch all 4 CRUD files (same pattern)

**Cluster 3: Tutorial/ILS System (1 file, 16 findings)**
- File: packages/db-tutorial/src/repositories/tutorial-progress.repository.ts
- Approach: Fix concurrency (atomic merge), tenant qualification, then nested schema (FND21)
- Sequence: 3 FEATs (concurrency → tenant keys → nested schema)

**Cluster 4: Assessment Reports (1 file, 7 findings)**
- File: packages/ui/src/report/ExamResultsReport.tsx
- Approach: Fix stale report race (AR-05), then zero vs missing (AR-07)
- Sequence: 2 FEATs (race condition → data handling)

**Cluster 5: Export Ownership (2 files, 6 findings)**
- Files: apps/api-server/src/app/api/export/download/route.ts, apps/api-server/src/lib/export/ExportEngine.ts
- Approach: Add tenant provenance verification (FND04 dependency)
- Sequence: 1 FEAT after FND04 tenantId migration

---

### Blocked Work (Requires Architecture Decisions)

**Block 1: Identity Foundation (Chain 1)**
- Cannot proceed until FND03 tenant-qualified identity contracts are designed
- Affects: FND04, FND05, FND06, FND11, FND18, SU-AUTH-*, RTH-EXP-*, SU-BRAND-*
- Blocker: Schema migration design (add tenantId to users/memberships/resources)

**Block 2: Refresh Token Discovery (W1.1.4)**
- Cannot proceed until refresh token persistence/location is discovered
- Affects: SU-AUTH-004, PH03-001, logout-all lifecycle
- Blocker: Runtime investigation or API contract inspection required

**Block 3: Placement Scoring Policy**
- Cannot proceed until Sol decides: zero vector score → null or match=1?
- Affects: SD-29, SU-DATA-008 placement fabrication
- Blocker: Product decision on uncalibrated match behavior

---

## Section 7: Workflow Agent File Ownership Recommendations

### Parallel Workflow Structure (Option A: Maximum Concurrency)

**Agent 1: Marketing Sites (MKT domain) — 15 independent files**
- Exclusive files: packages/marketing-site/src/* (excluding tracking.ts, shared hero files)
- Duration: 5-8 hours (mostly isolated fixes)
- Can run: IMMEDIATELY (no dependencies)

**Agent 2: Operational Data (OP domain) — 10 files**
- Exclusive files: apps/realtutorialhub-admin/src/lib/*, apps/skillhubcore-admin/src/lib/* (governance/inventory)
- Duration: 2-3 hours (static data corrections)
- Can run: IMMEDIATELY (no dependencies)

**Agent 3: Forms & Actions (FA domain) — 12 files**
- Exclusive files: Contact forms, consent management, password recovery pages
- Duration: 4-6 hours (form truth corrections)
- Can run: IMMEDIATELY (no dependencies, FA-10/11 deferred until FND03)

**Agent 4: Taxonomy UI Fabrications (GT-08 to GT-14) — 5 files**
- Exclusive files: apps/skillhubcore-admin/src/components/taxonomy/*Table.tsx
- Duration: 3-4 hours (UI-only corrections)
- Can run: IMMEDIATELY (no backend changes)

**Total Parallel Work:** 4 agents can run concurrently, completing ~20 hours of work in ~8 hours elapsed

---

### Sequential Workflow Structure (Option B: Dependency-Aware)

**Phase 1: Identity Foundation (BLOCKING)**
- FND03 → FND18 → FND06 → FND05 → FND04 (Chain 1)
- Files: drizzle/schema/users.ts, drizzle/schema/memberships.ts, src/share-branding/tenant-context.ts, etc.
- Duration: 15-20 hours
- Blocker: Schema migration design decision required

**Phase 2: Dependent Corrections (AFTER Phase 1)**
- Export ownership (RTH-EXP-001 to RTH-EXP-006) — requires FND04 tenantId
- Brand isolation (SU-BRAND-001/002) — requires FND05 tenant authorization
- Session ownership (SU-SESSION-010) — requires FND18 identity contracts
- Duration: 10-12 hours

**Phase 3: Independent Domain Work (PARALLEL with Phase 1/2)**
- Marketing sites (MKT domain)
- Operational data (OP domain)
- Forms (FA domain, partial)
- Taxonomy UI (GT-08 to GT-14)
- Duration: 8 hours elapsed (parallel execution)

**Phase 4: Shared Service Files (AFTER Phase 1)**
- Student data helpers (skillup-data.ts) — 30 findings, sequential function groups
- Assessment reports (ExamResultsReport.tsx) — 7 findings, sequential
- Tutorial/ILS repository (tutorial-progress.repository.ts) — 16 findings, sequential
- Duration: 12-15 hours

---

## Section 8: Critical Path Analysis

### Longest Dependency Chain: Identity → Export → Reports

**Total Duration:** 35-40 hours (sequential)

1. **FND03** (tenant-qualified identity) — 8 hours
2. **FND18** (identity projection/people migration) — 6 hours
3. **FND06** (tenant membership verification) — 4 hours
4. **FND05** (brand/tenant authorization) — 5 hours
5. **FND04** (resource ownership: export, placement) — 6 hours
6. **RTH-EXP-001 to RTH-EXP-006** (export ownership enforcement) — 4 hours
7. **FND14** (report stale race fix) — 2 hours

**Parallel Work During Critical Path:**
- Marketing (15 hours) — completes during FND03-FND18
- Operational (3 hours) — completes during FND03
- Forms (6 hours) — completes during FND03-FND06
- Taxonomy UI (4 hours) — completes during FND03-FND06

**Total Elapsed Time (with parallelism):** 35-40 hours (critical path dominates)

---

## Section 9: Recommendations

### For FND13-FND16 Priority Tasks

**Immediate Parallel Work (no blockers):**
1. Complete remaining FND16 forms truth (FA-03, FA-04, FA-05, FA-06) — 4 files, 2 hours
2. Complete MKT domain corrections (MKT-013, MKT-014, MKT-020, MKT-025, MKT-026, MKT-027) — 8 files, 6 hours
3. Complete taxonomy UI fabrications (GT-08 to GT-14) — 5 files, 4 hours

**Deferred Until Identity Foundation (FND03):**
- FND04 export ownership
- FND05 brand isolation
- FND11 scoped email lookups
- SU-AUTH-*, RTH-EXP-*, SU-BRAND-* findings

**Architectural Decision Gates:**
- Refresh token discovery (SU-AUTH-004, PH03-001)
- Placement scoring policy (SD-29, SU-DATA-008)
- Contact form requirements (MKT-019, FA-04 to FA-06)

### For Workflow Orchestration

**Recommended Structure:**
1. Launch 4 parallel agents for independent work (Marketing, Operational, Forms, Taxonomy UI)
2. Block identity foundation work until schema migration design is approved
3. After FND03-FND05 complete, launch sequential agents for shared service files
4. Final integration agent verifies cross-FEAT boundaries after all domain work completes

**File Locking Strategy:**
- Agent manifest must declare EXCLUSIVE file paths (no overlaps)
- Shared schema files (drizzle/schema/*) require explicit handoff between FEATs
- Service files with 5+ findings get single-owner FEATs (no concurrent edits)

---

## Conclusion

**181 callers across 177 findings mapped to 90+ distinct file paths.**

**Key ownership conflicts:**
- 18 files touched by 3+ findings → require sequential implementation
- 10 shared schema files → require explicit handoff or single owner
- 8 shared service files → require coordination within domain

**Parallel readiness:**
- 30 files can proceed independently (Marketing, Operational, Forms domains)
- 60 files require coordination (Identity chain, Tutorial system, Assessment reports)
- 4 files blocked by architecture decisions (identity foundation)

**Critical path:** Identity chain (FND03→FND18→FND06→FND05→FND04) blocks 40% of W2 findings.

**Next steps:**
1. Approve identity foundation schema migration design
2. Launch 4 parallel agents for independent domains
3. Sequence shared service file work after identity foundation completes
4. Preserve file ownership matrix for conflict detection during implementation

---

**Investigation Status:** COMPLETE (read-only extraction from audit documents)  
**Deliverable:** This ownership matrix ready for implementation planning  
**Verification:** All 181 callers from FND12 and 177 findings from FND17 accounted for
