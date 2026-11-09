# SUIA Web & Admin Deferred Integration & Architecture Acceptance Handoff

**Document Version:** 1.0.0  
**Date:** November 9, 2026  
**Governing Standard:** PSEG-001 (Project Software Architecture and Engineering Governance Standard)  
**Target Applications:**  
- `apps/skillup-web` (Learner Portal: Port 3004 / 3009)  
- `apps/skillup-admin` (Academy Admin: Port 3005)  
- `apps/faculty-app` (Faculty Portal)  
**Parent Register:** [`docs/architecture/reviews/SHARED_BRAND_INTEGRATION_HANDOFF.md`](file:///e:/onlinewebsites/quiz-platform/docs/architecture/reviews/SHARED_BRAND_INTEGRATION_HANDOFF.md)  
**Status:** **PROPOSED ARCHITECTURAL REGISTER — ZERO SOURCE MUTATION — ZERO COMMITS/PUSHES**  

---

## 1. Executive Summary & Tutor-Led Brand Paradigm

SkillUp IT Academy (SUIA) delivers a **structured, tutor-led, cohort-based academy experience**. Its educational architecture contrasts directly with on-demand self-paced platforms:

1. **Cohort-Paced Learning:** Syllabus progression is locked to weekly batch schedules; curriculum unlocks in synchronization with live lectures.
2. **Faculty-Guided Mentoring:** Doubts submitted on tutorial pages are routed to designated faculty / TA queues, not automated AI bots.
3. **Proctored Milestone Assessments:** Formal semester exams enforce timed browser locks, proctoring telemetry, and faculty grading.
4. **Career Placement Integration:** Student batch performance, attendance records, and project capstones feed directly into the placement drive portal (`apps/skillhub-placement`).
5. **Strict Application Partitioning:** Student learners operate in `apps/skillup-web`; academy counselors and admissions officers operate in `apps/skillup-admin`; instructors operate in `apps/faculty-app`.

> [!IMPORTANT]
> Zero lines of application code in SUIA repositories have been modified in this SHC Admin governance batch. All findings and requirements documented below represent a structured integration backlog for an authorized future SUIA workstream.

---

## 2. SUIA Issue Register (`SUIA-HO-*`)

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-001** |
| **Capability** | Tutor-Led Batch Scheduling & Calendar Integration |
| **Logical owner** | SUIA Academy Operations |
| **Current implementation owner** | `apps/skillup-admin/src/app/(admin)/batches`, `packages/db-tutorial/src/schema/batch-schedules.ts` |
| **Affected consumer** | `apps/skillup-web` (Learner) & `apps/skillup-admin` (Admin) |
| **Evidence** | `apps/skillup-web/src/app/batches/page.tsx#L1-L50`, `apps/skillup-admin/src/app/(admin)/batches/page.tsx` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Batches created in SUIA Admin store records in PostgreSQL `batch_schedules`. The learner-facing portal renders scheduled live sessions, but lacks automated Google Meet/Zoom link synchronization and attendance webhooks. |
| **Risk** | Student attendance drop: If meeting links or schedule changes made by faculty are not reflected in real time, students miss live cohort sessions. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED** |
| **Implementation maturity** | Partial |
| **Future acceptance test** | In SUIA Admin, create a new cohort batch, assign faculty, and set live session schedules; verify in SUIA Web (`/batches`) that enrolled students see the active schedule with valid meeting links. |
| **Recommended correction** | Wire calendar sync webhooks between `batch_schedules` and live session meeting providers. |
| **Dependency** | `packages/db-tutorial`, `apps/skillup-admin`, `apps/skillup-web` |
| **Future workstream** | SUIA Web / SUIA Admin Integration |
| **Governance mapping** | PSEG-001 §3.1, §4.2 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-002** |
| **Capability** | Proctored Examination & Timed Assessment Pipeline |
| **Logical owner** | SHC Assessment Engine & SUIA Examination Board |
| **Current implementation owner** | `src/share-branding/ExamEngine`, `apps/skillup-web/src/app/exam` |
| **Affected consumer** | `apps/skillup-web` (Learner) & `apps/faculty-app` (Faculty Grading) |
| **Evidence** | `apps/skillup-web/src/app/exam/page.tsx#L1-L15` (`loadExamSessionData`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | SUIA Web loads exam sessions via `loadExamSessionData` from shared branding engine. Proctored exam flows require browser fullscreen lock, timer countdowns, and automated submission upon expiration. |
| **Risk** | Exam integrity failure: If proctoring telemetry is interrupted, student attempt states may be lost or unsubmitted upon timer expiry. |
| **Severity** | **High** |
| **Finding state** | **CONFIRMED** |
| **Implementation maturity** | Implemented but unverified at runtime |
| **Future acceptance test** | Launch an exam via `http://localhost:3004/launch-exam`; complete questions, verify timer expiration forces submission, and verify attempt results appear in faculty grading queue. |
| **Recommended correction** | Implement heartbeat auto-save for student answers during timed examinations. |
| **Dependency** | `src/share-branding/ExamEngine`, MongoDB `student_attempts` |
| **Future workstream** | SUIA Web / Assessment Engine |
| **Governance mapping** | PSEG-001 §3.2, §5.2 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-003** |
| **Capability** | Faculty Doubt Clearing & Human Mentoring Escalation |
| **Logical owner** | SUIA Faculty Mentoring |
| **Current implementation owner** | `apps/api-server/src/lib/tutorial-faculty-access.ts`, `apps/faculty-app` |
| **Affected consumer** | `apps/faculty-app` & `apps/skillup-web` |
| **Evidence** | `apps/faculty-app/src/app/(faculty)/sessions/page.tsx#L1-L30`, `apps/api-server/src/lib/tutorial-faculty-access.ts#L20` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | When a student requests a live doubt session, `doubtText` and `subtopicId` are persisted in PostgreSQL `live_session_requests`. The faculty portal allows instructors to view requests and accept live sessions. |
| **Risk** | Unassigned doubt queues: If a student doubt is submitted outside scheduled office hours, there is currently no SLA escalation rule or notification dispatch to faculty. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED** |
| **Implementation maturity** | Implemented and verified in source |
| **Future acceptance test** | Submit a live session doubt request from SUIA Web; verify request appears on `faculty-app` dashboard (`/sessions`), and accepting it generates a session meeting link for the student. |
| **Recommended correction** | Add notification worker dispatching email/SMS alerts to assigned faculty when a new doubt is submitted. |
| **Dependency** | `apps/faculty-app`, `apps/api-server`, `packages/db-tutorial` |
| **Future workstream** | SUIA Faculty Workflow |
| **Governance mapping** | PSEG-001 §3.1 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-004** |
| **Capability** | SUIA Cookie Namespace & Session Boundary Isolation |
| **Logical owner** | Central Authentication Architecture |
| **Current implementation owner** | `packages/auth/src/middleware/cookie.middleware.ts#L21-L23`, `apps/skillup-web/src/app/api/auth/` |
| **Affected consumer** | `apps/skillup-web` & `apps/skillup-admin` |
| **Evidence** | `apps/skillup-web/src/app/api/auth/login/route.ts#L1-L9`, `apps/skillup-web/src/app/api/auth/logout/route.ts` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | SUIA Web delegates auth via `proxyAuthRequest` with `FALLBACK_API_BASE_SKILLUP`. Set-Cookie headers rewrite domain to `.skillupitacademy.com`. In local dev, cookies set with production domain fail to attach on `localhost:3004`. |
| **Risk** | Session clobbering across local development servers; cookie domain mismatch on non-production hosts. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED** |
| **Implementation maturity** | Implemented but requires local dev fallback |
| **Future acceptance test** | Authenticate on SUIA Web (`http://localhost:3004/login`); verify `accessToken` is stored as host-only cookie on localhost; verify calling `/api/auth/logout` clears the cookie. |
| **Recommended correction** | Ensure `rewriteSetCookie` in `authBffRoute.ts` strips `Domain` attribute when running on `localhost`. |
| **Dependency** | `packages/auth`, `src/share-branding/auth/` |
| **Future workstream** | SUIA Web / Shared Auth |
| **Governance mapping** | PSEG-001 §5.1, SHCA-S01 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-005** |
| **Capability** | Tutor-Guided Tutorial V2 Consumption & Academic Notes |
| **Logical owner** | SHC Tutorial Engine & SUIA Curriculum |
| **Current implementation owner** | `apps/skillup-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx` |
| **Affected consumer** | `apps/skillup-web` |
| **Evidence** | `apps/skillup-web/src/app/tutorial-v2/.../page.tsx#L61-L100` (`resolveRuntimeContext({ brandId: 'skillup', ... })`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | SUIA Web consumes published canonical tutorial blocks (D1, C1, P1) from PostgreSQL Neon database. It validates canonical subtopic slugs and redirects legacy slugs via Phase 2.6 canonical redirect. |
| **Risk** | Missing lecture context: Tutor-led students require embedded faculty lecture recordings and cohort homework assignments alongside canonical tutorial content. |
| **Severity** | **Low** |
| **Finding state** | **CONFIRMED ARCHITECTURE** |
| **Implementation maturity** | Implemented and verified |
| **Future acceptance test** | Request an authorized tutorial URL on port 3004; verify `resolveRuntimeContext` succeeds with `brandId: 'skillup'`, and canonical blocks render within `TutorialPageShell`. |
| **Recommended correction** | Add cohort homework attachment block rendering to SUIA's `TutorialPageShell` extension. |
| **Dependency** | `packages/db-tutorial`, `src/share-branding/LearningExperience/` |
| **Future workstream** | SUIA Web Content Delivery |
| **Governance mapping** | PSEG-001 §3.1, §4.1 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-006** |
| **Capability** | Formal Academy Certification & Degree Verification |
| **Logical owner** | SUIA Academic Registrar |
| **Current implementation owner** | `apps/skillup-web/src/app/certificates/page.tsx`, `src/share-branding/CertificatesPage.tsx` |
| **Affected consumer** | `apps/skillup-web` |
| **Evidence** | `apps/skillup-web/src/app/certificates/page.tsx#L1-L6` (`<CertificatesPage brand={skillUpConfig} />`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | SUIA renders student certificates using shared `CertificatesPage` branded with `skillUpConfig`. Formal graduation diplomas require verified batch attendance (min 80%), passing proctored exams, and faculty approval. |
| **Risk** | Fraudulent certificate issuance if certificate generation is triggered without verifying student eligibility against batch attendance records. |
| **Severity** | **High** |
| **Finding state** | **CONFIRMED** |
| **Implementation maturity** | UI implemented; eligibility validation service unverified |
| **Future acceptance test** | Attempt to generate certificate for a student with <80% attendance; verify rejection; complete all batch requirements; verify diploma generates with valid cryptographic verification hash. |
| **Recommended correction** | Wire certificate generation to batch completion validator checking attendance and final exam grades. |
| **Dependency** | `src/share-branding/CertificatesPage`, MongoDB `certificates` |
| **Future workstream** | SUIA Academic Registrar |
| **Governance mapping** | PSEG-001 §5.2 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-007** |
| **Capability** | Dual-DB Hierarchy & Enrollment Reconciliation |
| **Logical owner** | Platform Data Architecture |
| **Current implementation owner** | `apps/skillup-admin/src/app/(admin)/students`, MongoDB & PostgreSQL |
| **Affected consumer** | `apps/skillup-admin` & `apps/skillup-web` |
| **Evidence** | `apps/skillup-admin/src/app/(admin)/students/[id]/page.tsx` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Students are registered in MongoDB, while batch assignments and tutorial progress reside in PostgreSQL Neon. Without cross-database transaction coordination, partial writes can occur during student enrollment. |
| **Risk** | Inconsistent student state: A student enrolled in a batch in PostgreSQL may not have their program membership recorded in MongoDB. |
| **Severity** | **High** |
| **Finding state** | **CONFIRMED ARCHITECTURE GAP** |
| **Implementation maturity** | Partial |
| **Future acceptance test** | Enroll a new student via SUIA Admin; verify records exist with matching IDs in both MongoDB `enrollments` and PostgreSQL `batch_schedules`. |
| **Recommended correction** | Use Outbox pattern in `event_outbox` repository to synchronize student batch memberships across databases. |
| **Dependency** | `packages/db-tutorial`, `packages/db` |
| **Future workstream** | Shared Backend / Database Architecture |
| **Governance mapping** | PSEG-001 §4.2, SHCA-A06 |
| **Owner approval** | **Required** (Storage architecture decision) |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-008** |
| **Capability** | Student CRM & Career Placement Integration |
| **Logical owner** | SUIA Placement Office |
| **Current implementation owner** | `apps/skillup-admin/src/app/(admin)/placement`, `apps/skillhub-placement` |
| **Affected consumer** | `apps/skillup-admin` & `apps/skillup-web` |
| **Evidence** | `apps/skillup-web/src/app/placement/page.tsx`, `apps/skillup-admin/src/app/(admin)/placement/page.tsx` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | SUIA operates a dedicated placement workflow (`/placement`) linked to `apps/skillhub-placement`. Graduated students submit resumes and apply for corporate drives based on verified batch scores. |
| **Risk** | Placement data desync: If student grades or attendance are modified in SUIA Admin, placement eligibility status might not update automatically. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED ARCHITECTURE** |
| **Implementation maturity** | Implemented and verified in source |
| **Future acceptance test** | Mark a student as graduated in SUIA Admin; verify student profile becomes eligible for job applications in `apps/skillhub-placement`. |
| **Recommended correction** | Implement placement qualification webhook triggered upon cohort graduation. |
| **Dependency** | `apps/skillhub-placement`, `apps/skillup-admin` |
| **Future workstream** | SUIA Placement Workstream |
| **Governance mapping** | PSEG-001 §3.1 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-009** |
| **Capability** | Admin Lock Screen Explicit Inactive Policy |
| **Logical owner** | Central Security Architecture |
| **Current implementation owner** | `apps/skillup-admin` & `@quiz/ui` |
| **Affected consumer** | `apps/skillup-admin` |
| **Evidence** | Review of `apps/skillup-admin/src/app/(admin)/layout.tsx` (No AdminLockScreen imported) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Per project governance rules established during Scope B1 review, the shared `AdminLockScreen` component is strictly reserved for SHC Admin and RTH Admin. It is deliberately **unmounted and inactive** in SUIA Admin. |
| **Risk** | Accidental activation of lock screen in SUIA Admin would introduce unnecessary modal authentication prompts into academy administrative workflows without verified brand session adapters. |
| **Severity** | **Low** (Governance Invariant) |
| **Finding state** | **VERIFIED GOVERNANCE COMPLIANT** |
| **Implementation maturity** | Fully compliant with governance policy |
| **Future acceptance test** | Inspect `apps/skillup-admin` layouts and pages; verify zero occurrences of `AdminLockScreen` or lock-screen session listeners. |
| **Recommended correction** | Maintain explicit unmounted status; require formal architectural review before ever mounting in SUIA Admin. |
| **Dependency** | `apps/skillup-admin`, `@quiz/ui` |
| **Future workstream** | Security Governance |
| **Governance mapping** | PSEG-001 §5.1, Scope B1 Report §7 |
| **Owner approval** | Not required (Preserving status quo) |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **SUIA-HO-010** |
| **Capability** | Headless E2E Qualification Suite for SUIA Applications |
| **Logical owner** | Quality & Verification Architecture |
| **Current implementation owner** | Future automated test suite (`apps/skillup-web/scripts/verify-suia-e2e.mjs`) |
| **Affected consumer** | `apps/skillup-web` (Port 3004) & `apps/skillup-admin` (Port 3005) |
| **Evidence** | `apps/skillhubcore-admin/scripts/verify-scope-b1-e2e.mjs` (Reference implementation) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | While SHC Admin has an automated 20/20 Playwright verification script on port 3007, SUIA applications lack an automated headless qualification harness covering real HTTP login, batch access, and proctored exam flows. |
| **Risk** | Regressions undetected in CI/CD pipeline prior to production release on Hostinger VPS. |
| **Severity** | **Medium** |
| **Finding state** | **DEFERRED VERIFICATION** |
| **Implementation maturity** | Not implemented |
| **Future acceptance test** | Execute `node apps/skillup-web/scripts/verify-suia-e2e.mjs`; verify 100% pass across student login, tutorial rendering, batch loading, and logout cookie clearance. |
| **Recommended correction** | Create automated Playwright E2E qualification script for SUIA modeled after `verify-scope-b1-e2e.mjs`. |
| **Dependency** | `apps/skillup-web`, Playwright |
| **Future workstream** | Quality & Test Automation |
| **Governance mapping** | PSEG-001 §6.2 (Verification & Acceptance) |
| **Owner approval** | Not required |

---

## 3. Dual-Audience Architectural Boundaries (Learner Web vs Academy Admin)

```mermaid
flowchart TD
    subgraph Learner & Student Realm [Port 3004 / 3009: user.skillupitacademy.com]
        SClient[Student Browser] --> SWeb[SUIA Web App]
        SWeb -->|Student Auth: suia_user_token| SBFF[/api/student, /api/tutorial-v2]
        SBFF -->|Read Published Tutorials & Batches| TDB[(Tutorial Database)]
    end

    subgraph Academy Admin & Faculty Realm [Port 3005: admin.skillupitacademy.com]
        AClient[Academy Admin / Faculty Browser] --> AApp[SUIA Admin App]
        AApp -->|Admin Auth: suia_admin_token| ABFF[/api/admin, /api/batches, /api/crm]
        ABFF -->|Manage Cohorts, CRM, Payments| TDB
    end

    subgraph Central Educational Engine [Port 3007: admin.skillhubcore.in]
        SHC[SHC Super Admin] -->|Curriculum Authoring & Governance| TDB
    end
```

### Boundary & Security Rules:
1. **Student Privilege Separation:** `apps/skillup-web` operates strictly under the `student` role. Students cannot mutate batch schedules, assign faculty, access other students' gradebooks, or publish tutorials.
2. **Faculty / Admin Enclave:** `apps/skillup-admin` requires `brand_admin` or `faculty` role scoped to `brandId = 'skillup'`. Cross-tenant mutations against RTH data are strictly rejected by service assertion guards.
3. **Lock Screen Policy:** The shared `AdminLockScreen` is strictly reserved for SHC Admin and RTH Admin. It must **not** be mounted or activated in SUIA Admin without separate written architectural sign-off.

---

## 4. Future Acceptance & Quality Gates for SUIA

When an active implementation batch on SUIA is commissioned by the project owner:

- [ ] **Gate SUIA-1 (Build & Type Integrity):** `pnpm --filter @quiz/skillup-web type-check` and `pnpm --filter @quiz/skillup-admin type-check` pass with 0 errors.
- [ ] **Gate SUIA-2 (Batch Navigation Parity):** Real HTTP GET on port 3004/3009 loads scheduled batches and displays assigned faculty.
- [ ] **Gate SUIA-3 (Tutorial Delivery Parity):** Published tutorials render correctly via `/tutorial-v2` with academic lecture layouts.
- [ ] **Gate SUIA-4 (Exam Protection):** Timed exam flow correctly locks student UI and persists completed answers.
- [ ] **Gate SUIA-5 (Zero Cross-Brand Contamination):** Automated tests verify SUIA learner cannot query or mutate RTH brand content.
