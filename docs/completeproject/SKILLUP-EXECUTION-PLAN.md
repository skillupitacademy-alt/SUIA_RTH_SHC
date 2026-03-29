# SkillUp IT Academy — Execution Plan
## SMS + FMS + Placement · Phase-by-Phase · AI-Prompt-Driven
## Source: PHASE-SMS-ALL-PHASES.md + PHASE-FMS-ALL-PHASES.md + PHASE-TIER4-ALL.md

> **Window**: Window 3 — Antigravity Agent 3 (after SkillHubCore SHC-4 complete)
> **Monorepo paths**:
>   `services/student-faculty-service/`
>   `apps/skillup-web/`
>   `apps/skillup-admin/`
>   `apps/faculty-app/`
>   `apps/placement-app/`
> **DB**: People DB (students/faculty/batches tables) + Placement DB
> **Deployment**: GCP Cloud Run Mumbai asia-south1

---

## How to Use

- Paste the **Opening Prompt** at start of every SkillUp session
- Each **▶ AI PROMPT** is self-contained — paste verbatim
- ⚠ USER-GATED = review output before continuing
- Run **Deep Audit** after each sprint

---

## Phase Overview

| Phase | Description |
|-------|-------------|
| **SKU-1 — Student Core** | Student DB tables, StudentService, lifecycle states, StudentRepository |
| **SKU-2 — CRM + Admissions** | Enquiry pipeline, CRMService, admission flow, counsellor dashboard |
| **SKU-3 — Batch + Attendance** | Courses, batches, batch sessions, BatchService, attendance marking |
| **SKU-4 — Faculty Core** | Faculty DB, FacultyService, availability, leave, demo classes |
| **SKU-5 — Faculty Execution** | Session flow, assignment review, subtopic coverage, faculty dashboard |
| **SKU-6 — Payment + Fees** | Payment plans, installments, fee collection, Razorpay integration |
| **SKU-7 — Placement System** | Placement DB, PlacementService, company portal, job listings |
| **SKU-8 — Frontend Apps** | skillup-web, skillup-admin, faculty-app, placement-app |
| **SKU-9 — Integration** | Cross-service calls, event consumers, certification flow |

### Dependency Chain
```
SKU-1 → SKU-2 → SKU-3 → SKU-4 → SKU-5
                       ↓
              SKU-6 (after SKU-2)
              SKU-7 (after SKU-3+SKU-4)
              SKU-8 (after SKU-3+SKU-4+SKU-5)
              SKU-9 (after all above)
```

---

## ─── OPENING PROMPT — paste at start of EVERY SkillUp session ───

```
You are a senior implementation agent working in d:\onlinewebsites\quiz-platform

You are building SkillUp IT Academy — the human-guided training brand of the 3-platform ecosystem.

Architecture:
  SkillUp IT Academy USES RealTutorialHub engines (tutorial + exam) — does NOT duplicate them
  SkillUp ADDS: faculty, live batches, attendance, CRM, placement, fee management
  People DB (DATABASE_URL_PEOPLE): all student/faculty/batch/CRM tables
  Placement DB (DATABASE_URL_PLACEMENT): placement-specific tables
  SkillHubCore handles SSO — SkillUp students use the same JWT

Your scope this session: [SPECIFY which phase/task you are working on]
Do NOT touch: exam-service, tutorial-service, skillhubcore-service, existing web-app, existing admin-app

Key facts:
  - Student lifecycle: ENQUIRY_RECEIVED → ENROLLED → BATCH_ALLOCATED → LEARNING → CERTIFIED → PLACED
  - Two admission types: 'digital' (online only) and 'training' (live + placement)
  - Faculty marks attendance → absent students get WhatsApp via notification-service
  - Payment overdue → access suspended after 14 days (via subscription feature gating)
  - SkillUp certificate requires: ≥75% attendance + ≥70% exam score + 1 approved project + no fee dues

Hard rules:
  1. All 1138+ existing tests must stay green
  2. Run after every sprint: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
  3. Cross-service data (tutorial progress, exam results) fetched via HTTP calls — never DB joins
  4. Committed scope only — do not start next phase tasks

Read before starting: PHASE-SMS-ALL-PHASES.md + PHASE-FMS-ALL-PHASES.md
```

---

## Phase SKU-1 — Student Core

#### SKU-1-A-01 · Add student tables to `packages/db-people` · `SCHEMA` · M

- **File path**: `packages/db-people/src/schema/students.ts` (add to existing package)
- **Dependencies**: SHC-1-A-01 complete (packages/db-people exists)

**▶ AI PROMPT**
```
Add student-related tables to packages/db-people.
These tables go INSIDE the same people-db Neon database, alongside existing SkillHubCore tables.

Add files:
  packages/db-people/src/schema/students.ts
  packages/db-people/src/schema/enrollments.ts
  packages/db-people/src/schema/attendance.ts
  packages/db-people/src/schema/student-documents.ts
  packages/db-people/src/schema/student-notes.ts

students table (Drizzle schema):
  id (uuid pk), user_id (uuid not null unique FK users.id),
  enrollment_number (text unique — auto-generated on enrollment),
  admission_type (text enum: digital/training/hybrid not null),
  lifecycle_status (text default 'enquiry_received'),
  domain_id (uuid nullable), batch_id (uuid nullable),
  counsellor_id (uuid nullable), referral_source (text),
  referral_by (uuid nullable), guardian_name (text),
  guardian_phone (text), guardian_email (text),
  emergency_contact (jsonb), special_needs (text), medical_notes (text),
  created_at, updated_at, deleted_at
  INDEX on user_id, batch_id, lifecycle_status

enrollments table:
  id (uuid pk), student_id (uuid FK students.id), course_id (uuid not null),
  batch_id (uuid nullable), status (text enum: active/completed/dropped/deferred default active),
  enrolled_at, completed_at, dropped_at, drop_reason (text)

student_documents table:
  id (uuid pk), student_id (uuid FK), doc_type (text enum:
  id_proof/address_proof/qualification/photo/signature/other),
  file_url (text not null), file_name (text), verified (bool default false),
  verified_by (uuid), verified_at, uploaded_at

attendance_records table:
  id (uuid pk), student_id (uuid FK students.id), session_id (uuid not null),
  batch_id (uuid not null), status (text enum: present/absent/late/excused not null),
  marked_by (uuid not null), marked_at, notes (text),
  UNIQUE(student_id, session_id)
  INDEX on student_id, session_id

student_notes table:
  id (uuid pk), student_id (uuid FK), author_id (uuid not null),
  note_type (text enum: general/academic/behavioral/financial),
  content (text not null), is_private (bool default false), created_at

Export all new schemas from packages/db-people/src/index.ts.
Run pnpm --filter @platform/db-people db:generate then db:migrate.
Run pnpm typecheck:all → zero errors.
```

---

#### SKU-1-A-02 · `StudentRepository` + `StudentService` · `SERVICE` · L

- **File path**: `services/student-faculty-service/src/modules/students/`
- **Classes**: `StudentRepository`, `StudentService`

**▶ AI PROMPT**
```
Create StudentRepository and StudentService in
services/student-faculty-service/src/modules/students/

First, create the service scaffold if not exists:
  services/student-faculty-service/
    CLAUDE.md
    package.json → name: @platform/student-faculty-service
    src/
      index.ts → Hono app, port 8081
      modules/
        students/
          student.repository.ts
          student.service.ts
          student.routes.ts
          student.types.ts

class StudentRepository {
  async findById(id: string): Promise<Student | null>
  async findByUserId(userId: string): Promise<Student | null>
  async findByBatch(batchId: string): Promise<Student[]>
  async findByStatus(status: LifecycleStatus, limit?: number): Promise<Student[]>
  async create(data: CreateStudentInput): Promise<Student>
  async updateLifecycleStatus(id: string, status: LifecycleStatus): Promise<void>
  async assignToBatch(studentId: string, batchId: string): Promise<void>
  async generateEnrollmentNumber(): Promise<string>
    → Format: SKU-YYYY-NNNN (e.g., SKU-2026-0001)
    → Auto-increment per year
}

class StudentService {
  constructor(private repo: StudentRepository, private db: PeopleDB) {}

  async createStudent(userId: string, data: AdmissionData): Promise<Student>
    → Generate enrollment_number via repo.generateEnrollmentNumber()
    → Create student record
    → Publish student.created event (packages/events)

  async getStudentFullProfile(studentId: string): Promise<StudentFullProfile>
    → Load student from DB
    → Fetch tutorial progress: GET tutorial-service/api/tutorial/progress/{userId}
    → Fetch exam results: GET exam-service/api/exam/results/{userId}
    → Combine into StudentFullProfile
    → Cache result in Redis for 5 minutes

  async updateLifecycleStatus(studentId: string, newStatus: LifecycleStatus, changedBy: string, reason?: string): Promise<void>

  async markAttendance(sessionId: string, entries: AttendanceEntry[], markedBy: string): Promise<void>
    → Bulk INSERT attendance_records
    → Find absent students
    → Publish attendance.marked event for each absent student
    → notification-service will send WhatsApp

  async getAttendanceSummary(studentId: string, dateRange?: DateRange): Promise<AttendanceSummary>
    → Returns: total sessions, present, absent, late, percentage, eligible (≥75%)

  async getLowAttendanceStudents(batchId: string): Promise<StudentAttendanceSummary[]>
    → Returns students with < 75% attendance in batch
}

Write unit tests for all StudentService methods.
Write tests for cross-service calls with mocked HTTP (use vitest mock).
```

---

## Phase SKU-2 — CRM + Admissions

#### SKU-2-A-01 · CRM tables + `CRMService` · `SCHEMA` + `SERVICE` · L

- **File path**: `packages/db-people/src/schema/crm.ts` + `services/student-faculty-service/src/modules/crm/`
- **Classes**: `CRMService`

**▶ AI PROMPT**
```
Add CRM tables to packages/db-people and create CRMService.

Add to packages/db-people/src/schema/crm.ts:

enquiries table:
  id (uuid pk), full_name (text not null), email (text not null), phone (text not null),
  course_interest (text), source (text enum: website/instagram/facebook/google/referral/walk_in/other),
  utm_source (text), utm_medium (text), utm_campaign (text),
  status (text enum: new/contacted/qualified/not_interested/converted default new),
  assigned_to (uuid nullable — counsellor user_id),
  notes (text), created_at, updated_at

enquiry_follow_ups table:
  id (uuid pk), enquiry_id (uuid FK enquiries.id not null),
  counsellor_id (uuid not null), follow_up_type (text enum: call/email/whatsapp/visit),
  scheduled_at (timestamptz not null), completed_at (timestamptz),
  outcome (text), notes (text), next_follow_up_at (timestamptz),
  created_at

admissions table:
  id (uuid pk), student_id (uuid FK students.id), enquiry_id (uuid FK enquiries.id),
  admission_type (text enum: digital/training not null),
  course_id (uuid not null), batch_preference (text),
  documents_verified (bool default false), admission_date (date),
  status (text enum: pending/approved/rejected/deferred default pending),
  approved_by (uuid), approved_at, rejection_reason (text), created_at

demo_sessions table:
  id (uuid pk), enquiry_id (uuid FK), faculty_id (uuid), scheduled_at (timestamptz not null),
  mode (text enum: online/offline), meeting_link (text), location (text),
  attended (bool), feedback (text), outcome (text enum: interested/not_interested/enrolled),
  created_at

Run migration. Then create CRMService:

class CRMService {
  async createEnquiry(data: EnquiryInput): Promise<Enquiry>
    → INSERT enquiry → capture UTM params
    → Publish event (no QStash yet — just DB save)
    → Assign to least-loaded counsellor (round-robin by assigned_to count)

  async qualifyEnquiry(enquiryId: string, counsellorId: string): Promise<void>

  async scheduleFollowUp(enquiryId: string, data: FollowUpInput): Promise<FollowUp>

  async convertToAdmission(enquiryId: string, admissionData: AdmissionInput): Promise<Admission>
    → CREATE admission record
    → CREATE student record (via StudentService)
    → UPDATE enquiry.status = 'converted'

  async getEnquiryFunnel(): Promise<FunnelMetrics>
    → Returns count per status stage for dashboard

  async getOverdueFollowUps(counsellorId?: string): Promise<FollowUp[]>
    → Returns follow_ups where scheduled_at < now and completed_at IS NULL
}

Add routes: POST /enquiries (public), GET /enquiries (auth), PATCH /enquiries/:id
Write unit tests for CRMService including funnel metrics.
```

---

## Phase SKU-3 — Batches + Courses

#### SKU-3-A-01 · Course + Batch tables + `BatchService` · `SCHEMA` + `SERVICE` · L

- **File path**: `packages/db-people/src/schema/batches.ts` + `services/student-faculty-service/src/modules/batches/`

**▶ AI PROMPT**
```
Add course/batch tables to packages/db-people and create BatchService.

Add to packages/db-people/src/schema/batches.ts:

courses table:
  id (uuid pk), name (text not null), domain_id (uuid not null),
  description (text), duration_weeks (integer), total_sessions (integer),
  admission_types (text array default ['digital','training']),
  fee_digital (decimal 10,2), fee_training (decimal 10,2),
  is_active (bool default true), created_at, updated_at

batches table:
  id (uuid pk), course_id (uuid FK courses.id not null), name (text not null),
  batch_code (text unique — e.g., BATCH-2026-001),
  mode (text enum: online/offline/hybrid not null),
  max_capacity (integer default 30), enrolled_count (integer default 0),
  start_date (date not null), end_date (date),
  schedule (jsonb — { days: ['monday','wednesday'], time: '18:00', duration_mins: 90 }),
  meeting_link (text), room (text),
  status (text enum: upcoming/active/completed/cancelled default upcoming),
  created_at, updated_at

batch_sessions table:
  id (uuid pk), batch_id (uuid FK batches.id not null),
  session_number (integer not null), scheduled_at (timestamptz not null),
  started_at (timestamptz), ended_at (timestamptz),
  faculty_id (uuid), topic_covered (text), subtopic_ids (uuid array),
  recording_url (text), notes (text),
  status (text enum: scheduled/completed/cancelled/rescheduled default scheduled),
  UNIQUE(batch_id, session_number)

batch_enrollments table:
  id (uuid pk), batch_id (uuid FK batches.id), student_id (uuid FK students.id),
  enrolled_at (timestamptz default now()), status (text enum: active/completed/dropped),
  UNIQUE(batch_id, student_id)

faculty_batch_assignments table:
  id (uuid pk), faculty_id (uuid not null), batch_id (uuid FK batches.id),
  role (text enum: lead/assistant default lead),
  assigned_at (timestamptz default now()), is_active (bool default true),
  UNIQUE(faculty_id, batch_id)

Run migration. Create BatchService:

class BatchService {
  async createBatch(data: CreateBatchInput): Promise<Batch>
    → Auto-generate batch_code
    → INSERT batch

  async enrollStudent(batchId: string, studentId: string): Promise<void>
    → Check batch capacity not exceeded
    → INSERT batch_enrollment
    → UPDATE batches.enrolled_count++
    → UPDATE students.batch_id = batchId
    → Publish student.enrolled event

  async scheduleSessions(batchId: string, count: number): Promise<BatchSession[]>
    → Generate N sessions based on batch.schedule (days + time)
    → Auto-schedule from start_date

  async recordSessionCompletion(sessionId: string, data: SessionCompletionData): Promise<void>
    → UPDATE batch_sessions: status=completed, subtopic_ids, notes, recording_url
    → Publish batch.subtopics_covered event
    → tutorial-service will mark subtopics as class-assisted

  async getBatchProgress(batchId: string): Promise<BatchProgress>
    → Sessions completed vs total, avg student exam score (cross-service)

  async checkCapacity(batchId: string): Promise<{ available: number, max: number }>
}

Write unit tests for BatchService including session scheduling logic.
```

---

## Phase SKU-4 — Faculty Core

#### SKU-4-A-01 · Faculty tables + `FacultyService` · `SCHEMA` + `SERVICE` · L ⚠ USER-GATED

- **File path**: `packages/db-people/src/schema/faculty.ts` + `services/student-faculty-service/src/modules/faculty/`

**▶ AI PROMPT**
```
Add faculty tables to packages/db-people and create FacultyService.

Add to packages/db-people/src/schema/faculty.ts:

faculty table (from PHASE-FMS-ALL-PHASES.md — copy exactly):
  id (uuid pk), user_id (uuid not null unique FK users.id),
  employee_code (text unique — e.g., FAC-2026-001),
  specializations (uuid array — domain_ids they can teach),
  experience_years (integer), education (jsonb), certifications (jsonb array),
  linkedin_url (text), github_url (text), portfolio_url (text),
  employment_type (text enum: full_time/part_time/contract/guest default contract),
  rate_per_hour (decimal 8,2), currency (varchar 3 default 'INR'),
  lifecycle_status (text default 'application_received'),
  rating (decimal 3,2), total_batches_taken (integer default 0),
  total_students_taught (integer default 0), bio (text),
  created_at, updated_at, deleted_at

faculty_availability table:
  id (uuid pk), faculty_id (uuid FK faculty.id),
  day_of_week (text not null), start_time (time not null), end_time (time not null),
  is_available (bool default true), effective_from (date), effective_until (date),
  UNIQUE(faculty_id, day_of_week, start_time)

faculty_leaves table:
  id (uuid pk), faculty_id (uuid FK faculty.id),
  leave_type (text enum: sick/casual/planned/emergency),
  from_date (date not null), to_date (date not null), reason (text),
  status (text enum: pending/approved/rejected default pending),
  approved_by (uuid), substitute_faculty_id (uuid), created_at

faculty_ratings table:
  id (uuid pk), faculty_id (uuid FK faculty.id), student_id (uuid not null),
  batch_id (uuid not null), rating (integer 1-5 not null),
  teaching_clarity (integer 1-5), responsiveness (integer 1-5),
  knowledge_depth (integer 1-5), review_text (text), is_anonymous (bool default false),
  created_at, UNIQUE(student_id, batch_id)

faculty_demo_classes table:
  id (uuid pk), faculty_id (uuid FK faculty.id), scheduled_at (timestamptz not null),
  evaluator_id (uuid not null), topic (text), mode (text), recording_url (text),
  score (integer), feedback (text),
  outcome (text enum: approved/rejected/another_demo), created_at

Run migration. Create FacultyService:

class FacultyService {
  async createFacultyApplication(userId: string, data: FacultyApplicationData): Promise<Faculty>
  async advanceLifecycleStatus(facultyId: string, newStatus: FacultyLifecycleStatus, changedBy: string): Promise<void>
    → Valid transitions only (see lifecycle in PHASE-FMS-ALL-PHASES.md)
    → On EMPANELLED: auto-generate employee_code (FAC-YYYY-NNN)
  async scheduleDemoClass(facultyId: string, data: DemoClassInput): Promise<DemoClass>
  async recordDemoOutcome(demoId: string, outcome: 'approved'|'rejected'|'another_demo', score: number, feedback: string): Promise<void>
    → If approved → advanceLifecycleStatus(facultyId, 'empanelled')
  async findAvailableFaculty(domainId: string, dayOfWeek: string, startTime: string, endTime: string): Promise<Faculty[]>
    → Join faculty_availability + faculty — check no conflicting batch assignments
  async getFacultyMetrics(facultyId: string, period?: DateRange): Promise<FacultyMetrics>
    → avg student exam score (cross-service call to exam-service)
    → avg tutorial completion % (cross-service call to tutorial-service)
    → avg student rating from faculty_ratings
    → attendance rate from attendance_records
}

Write unit tests for lifecycle transitions, availability conflict detection.
```

---

## Phase SKU-5 — Faculty Execution (Session + Assignment Review)

#### SKU-5-A-01 · Session execution + subtopic coverage tracking · `SERVICE` · M

- **File path**: `services/student-faculty-service/src/modules/sessions/session.service.ts`

**▶ AI PROMPT**
```
Create SessionService for batch session execution in
services/student-faculty-service/src/modules/sessions/session.service.ts

class SessionService {
  async startSession(sessionId: string, facultyId: string): Promise<void>
    → UPDATE batch_sessions.started_at = now(), status = 'active'

  async recordSubtopicsCovered(sessionId: string, subtopicIds: string[], facultyId: string): Promise<void>
    → UPDATE batch_sessions.subtopic_ids = subtopicIds, topic_covered
    → Get all students enrolled in this batch
    → Publish batch.subtopics_covered event:
       { sessionId, batchId, subtopicIds, studentIds, facultyId, coveredAt }
    → tutorial-service consumes this → marks subtopics as class-assisted for each student

  async completeSession(sessionId: string, data: SessionCompletionData): Promise<void>
    → UPDATE batch_sessions: status=completed, ended_at, notes, recording_url
    → Call recordSubtopicsCovered if subtopics provided

  async getSessionsForFaculty(facultyId: string, dateRange: DateRange): Promise<BatchSession[]>
    → All sessions assigned to this faculty in range

  async checkForConflicts(facultyId: string, proposedTime: Date, durationMins: number): Promise<boolean>
    → Check no other session scheduled for this faculty at same time
}

Also create POST /api/workers/batch-subtopics-covered consumer in tutorial-service side:
  → Location: apps/tutorial-app/src/app/api/workers/batch-subtopics-covered/route.ts
  → For each studentId + subtopicId: upsert subtopic_flow_progress with source='class_assisted'
  → This marks progress differently from self-study

Write tests for conflict detection and subtopic coverage sync.
```

---

## Phase SKU-6 — Payment + Fees

#### SKU-6-A-01 · Payment tables + `PaymentService` · `SCHEMA` + `SERVICE` · L

- **File path**: `packages/db-people/src/schema/payments.ts`
- **Note**: These tables go in People DB (per MASTER-PLATFORM-ARCHITECTURE.md line 68)

**▶ AI PROMPT**
```
Add payment/fee tables to packages/db-people for SkillUp IT Academy fee management.
NOTE: This is different from the payment-service payment-db — these are SkillUp-specific
installment tracking tables that live in people-db.

Add packages/db-people/src/schema/payments.ts:

payment_plans table:
  id (uuid pk), student_id (uuid FK students.id not null), course_id (uuid not null),
  total_amount (decimal 10,2 not null), discount_amount (decimal 10,2 default 0),
  final_amount (decimal 10,2 not null), currency (varchar 3 default 'INR'),
  payment_type (text enum: full/installment),
  installment_count (integer default 1), status (text enum: active/completed/overdue/cancelled),
  created_by (uuid), created_at, updated_at

payment_installments table:
  id (uuid pk), plan_id (uuid FK payment_plans.id), installment_number (integer not null),
  amount (decimal 10,2 not null), due_date (date not null),
  paid_at (timestamptz), paid_amount (decimal 10,2),
  payment_ref (text), gateway (text enum: razorpay/stripe/cash/bank_transfer),
  status (text enum: pending/paid/overdue/waived default pending),
  reminder_count (integer default 0), last_reminder_at (timestamptz),
  UNIQUE(plan_id, installment_number)

scholarships table:
  id (uuid pk), student_id (uuid FK), amount (decimal 10,2), percentage (decimal 5,2),
  reason (text not null), approved_by (uuid), applied_at, created_at

Create PaymentService:
class PaymentService {
  async createPaymentPlan(studentId: string, courseId: string, data: PaymentPlanInput): Promise<PaymentPlan>
    → Calculate installments if type = 'installment'
    → INSERT payment_plan + installments

  async recordPayment(installmentId: string, paymentData: PaymentData): Promise<void>
    → UPDATE installment: status=paid, paid_at, paid_amount, payment_ref
    → Publish payment.received event (triggers SkillHubCore subscription activation)
    → Check if all installments paid → update plan.status = 'completed'

  async getOverdueInstallments(): Promise<Installment[]>
    → WHERE status=pending AND due_date < now()
    → Used by daily cron to trigger reminders

  async suspendAccessForOverdue(): Promise<void>
    → Find students with installments overdue > 14 days
    → Publish payment.overdue event → SkillHubCore suspends subscription features
    → notification-service sends WhatsApp reminder

  async applyScholarship(studentId: string, amount: number, reason: string, approvedBy: string): Promise<void>
}

Write tests for installment calculation, overdue detection.
```

---

## Phase SKU-7 — Placement System

#### SKU-7-A-01 · Placement DB + `PlacementService` · `SCHEMA` + `SERVICE` · L

- **File path**: `packages/db-placement/` (NEW package — uses DATABASE_URL_PLACEMENT)

**▶ AI PROMPT**
```
Create packages/db-placement (separate DB — placement-db Neon account).

Package: @platform/db-placement
Uses: DATABASE_URL_PLACEMENT (pooled) + DATABASE_DIRECT_URL_PLACEMENT (migrations)

Schemas (from PHASE-TIER4-ALL.md — copy field names exactly):

student_placement_profiles table:
  id (uuid pk), student_id (uuid not null unique),
  resume_url (text), linkedin_url (text), github_url (text), portfolio_url (text),
  expected_ctc (decimal 10,2), preferred_locations (text array),
  skills (text array), experience_years (decimal 3,1 default 0),
  is_actively_looking (bool default false), profile_completed_at (timestamptz),
  last_active_at (timestamptz), created_at, updated_at

companies table:
  id (uuid pk), name (text not null), website (text), industry (text),
  size (text enum: startup/small/medium/large/enterprise), logo_url (text),
  hr_contact_name (text), hr_contact_email (text), hr_contact_phone (text),
  is_active (bool default true), created_at

job_listings table:
  id (uuid pk), company_id (uuid FK companies.id not null), title (text not null),
  description (text), required_skills (text array), min_experience_years (decimal 3,1 default 0),
  ctc_min (decimal 10,2), ctc_max (decimal 10,2), currency (varchar 3 default 'INR'),
  location (text array), mode (text enum: remote/onsite/hybrid),
  domain_ids (uuid array — relevant domains from exam DB hierarchy),
  deadline (date), is_active (bool default true), created_at

internship_listings table:
  id (uuid pk), company_id (uuid FK), title (text not null), description (text),
  duration_months (integer not null), stipend (decimal 8,2), is_paid (bool default false),
  required_skills (text array), domain_ids (uuid array),
  deadline (date), is_active (bool default true), created_at

applications table:
  id (uuid pk), student_id (uuid not null), listing_id (uuid not null),
  listing_type (text enum: job/internship), status (text enum:
  applied/shortlisted/interview_scheduled/interview_done/offer_received/offer_accepted/rejected default applied),
  applied_at (timestamptz default now()), notes (text), UNIQUE(student_id, listing_id)

interviews table:
  id (uuid pk), application_id (uuid FK applications.id not null),
  round_number (integer default 1), scheduled_at (timestamptz not null),
  mode (text enum: online/offline), meeting_link (text), interviewer_name (text),
  outcome (text enum: passed/failed/no_show/rescheduled), feedback (text),
  created_at

placements table:
  id (uuid pk), student_id (uuid not null unique), company_id (uuid FK companies.id),
  job_title (text not null), ctc (decimal 10,2), joining_date (date),
  offer_letter_url (text), placed_at (timestamptz default now()), created_at

Run migration on placement-db. Create PlacementService:

class PlacementService {
  async createProfile(studentId: string, data: PlacementProfileInput): Promise<PlacementProfile>
  async updateProfile(studentId: string, data: Partial<PlacementProfileInput>): Promise<void>
  async applyToListing(studentId: string, listingId: string, type: 'job'|'internship'): Promise<Application>
    → Check student is PLACEMENT_ELIGIBLE (from student-faculty-service)
    → Check deadline not passed
    → INSERT application
  async getEligibleStudents(listingId: string): Promise<PlacementProfile[]>
    → Match required_skills and domain_ids against student profiles
  async recordPlacement(studentId: string, data: PlacementData): Promise<void>
    → INSERT placements record
    → Update student lifecycle_status = 'placed' (call student-faculty-service)
    → Publish placement.offer_accepted event
    → certificate.issued event triggered
  async getPlacementStats(): Promise<PlacementStats>
    → Total placed, avg CTC, top companies, placement rate
}

Write unit tests for PlacementService including eligibility check.
```

---

## Phase SKU-8 — Frontend Apps

#### SKU-8-A-01 · `apps/skillup-web` — SkillUp student portal · `FRONTEND` · L ⚠ USER-GATED

- **File path**: `apps/skillup-web/`
- **Domain**: `app.skillupitacademy.com` + `learn.skillupitacademy.com`

**▶ AI PROMPT**
```
Create apps/skillup-web — the SkillUp IT Academy student-facing portal.

Package: @platform/skillup-web
Tech: Next.js 15, App Router, Tailwind CSS — MATCH existing web-app design language exactly.
Domain: skillupitacademy.com

Pages to create:

app/(public)/page.tsx → Marketing landing page (SSG)
  - Hero: "Learn with Expert Instructors", CTA: Apply Now
  - Sections: Programs offered, Why SkillUp, Placement stats, Faculty showcase
  - Enquiry form → POST student-faculty-service/enquiries

app/(public)/programs/page.tsx → Course catalog (SSG)
  → Lists all active courses from BatchService

app/(auth)/login/page.tsx → Login via SkillHubCore SSO
  → POST api.skillhubcore.in/auth/login, platform: 'skillup'
  → On success: store httpOnly cookies, redirect to /dashboard

app/(auth)/register/page.tsx → Register

app/(student)/dashboard/page.tsx → Student home
  → My batch: upcoming sessions this week
  → Attendance: this month % (from student-faculty-service)
  → My progress: tutorial completion (from tutorial-service)
  → Quick links: My Schedule, Notes, Practice Exams, Placement Profile

app/(student)/my-batch/page.tsx → Batch details + session calendar
  → Current batch info, faculty name, schedule
  → Session list: completed (with recording links) + upcoming

app/(student)/attendance/page.tsx → Attendance history
  → Calendar heatmap view (green=present, red=absent, yellow=late)
  → Monthly summary with percentage

app/(student)/learn/page.tsx → Redirects to notes.realtutorialhub.com
  → Opens tutorial with SkillUp JWT (same token works cross-platform)

app/(student)/exams/page.tsx → Redirects to quiz.realtutorialhub.com

app/(student)/payments/page.tsx → Fee history + upcoming installments
  → Pay now button for overdue installments (Razorpay integration)

app/(student)/placement/page.tsx → Placement profile + job listings
  → Edit profile, upload resume, apply to listings

app/api/ → BFF routes (proxy to student-faculty-service)

NO new design language. Match web-app styling and components.
Run pnpm typecheck:all and pnpm build:all → pass.
```

---

#### SKU-8-A-02 · `apps/skillup-admin` — SkillUp admin panel · `FRONTEND` · L ⚠ USER-GATED

- **File path**: `apps/skillup-admin/`
- **Domain**: `admin.skillupitacademy.com`

**▶ AI PROMPT**
```
Create apps/skillup-admin — admin panel for SkillUp IT Academy operations.

Package: @platform/skillup-admin
Tech: Next.js 15, App Router, Tailwind — MATCH existing admin-app design exactly.
Domain: admin.skillupitacademy.com

Pages:

app/(auth)/login/page.tsx → Admin login (role: admin only)

app/(admin)/dashboard/page.tsx
  → KPIs: active students, batches running, enquiries this week, placements this month
  → Charts: enquiry funnel, attendance rate trend, revenue trend

app/(admin)/students/page.tsx → Student table
  → Filter by: lifecycle_status, batch, domain, admission_type
  → Columns: name, email, enrollment_no, batch, status, attendance%, exam_score
  → Actions: change status, assign batch, add note, view profile

app/(admin)/students/[id]/page.tsx → Full student profile
  → Tabs: Profile | Documents | Academic | Financial | Notes | Activity

app/(admin)/crm/page.tsx → Enquiry pipeline (Kanban view)
  → Columns: New → Contacted → Qualified → Demo → Admission → Enrolled
  → Drag-drop to change status, quick add follow-up

app/(admin)/crm/enquiries/[id]/page.tsx → Enquiry detail + follow-up history

app/(admin)/batches/page.tsx → All batches
  → Filter by: status, domain, faculty, mode
  → Cards: batch name, capacity, enrolled count, next session

app/(admin)/batches/[id]/page.tsx → Batch detail
  → Session list, enrolled students, attendance summary

app/(admin)/batches/[id]/attendance/page.tsx → Mark attendance
  → Student list with present/absent/late toggle
  → Bulk mark all present, save

app/(admin)/faculty/page.tsx → Faculty roster
  → Table with lifecycle_status, rating, active batches

app/(admin)/faculty/[id]/page.tsx → Faculty profile + metrics
  → Ratings, batch history, leave requests

app/(admin)/payments/page.tsx → Fee management
  → Overdue installments highlighted in red
  → Filter by: overdue, upcoming, paid

app/(admin)/placement/page.tsx → Placement management
  → Job listings CRUD, company management, placed students

All pages use react-query for data, match existing admin-app patterns exactly.
Run pnpm typecheck:all and pnpm build:all → pass.
```

---

#### SKU-8-A-03 · `apps/faculty-app` — Faculty portal · `FRONTEND` · L ⚠ USER-GATED

- **File path**: `apps/faculty-app/`
- **Domain**: `faculty.skillupitacademy.com`

**▶ AI PROMPT**
```
Create apps/faculty-app — portal for SkillUp IT Academy faculty.

Package: @platform/faculty-app
Tech: Next.js 15, App Router, Tailwind — match existing admin-app design.
Domain: faculty.skillupitacademy.com

Pages (from PHASE-FMS-ALL-PHASES.md Part 4 — implement exactly):

app/(auth)/login/page.tsx → Login (role: faculty only)

app/(faculty)/dashboard/page.tsx
  Widget 1: My Today — sessions today, pending reviews badge, low attendance alerts
  Widget 2: Batch Health per batch card — avg exam score, tutorial completion%, attendance
  Widget 3: Recent Activity — last 5 assignment submissions, recent exams in my batch
  Widget 4: Calendar — next 7 days sessions, color-coded (online=blue/offline=green/cancelled=red)

app/(faculty)/my-batches/page.tsx → My active batches
  → Card per batch: name, student count, current topic, next session

app/(faculty)/my-batches/[batchId]/page.tsx → Batch detail
  → Student list with progress indicators
  → Session history with recording links

app/(faculty)/my-batches/[batchId]/sessions/[sessionId]/attendance/page.tsx
  → Attendance marking: student list with present/absent/late/excused toggle
  → Save → POST student-faculty-service/attendance
  → Must complete in < 30 seconds for 30 students (fast UI — bulk toggle)

app/(faculty)/assignments/page.tsx → Pending assignment reviews
  → Cards: student name, assignment title, submitted at, AI pre-review score

app/(faculty)/assignments/[submissionId]/review/page.tsx
  → Left: student submission
  → Right: AI pre-review (from tutorial-service) + rubric scoring form
  → 4 dimensions × 25 points each = 100 total
  → Approve / Request Revision buttons

app/(faculty)/students/page.tsx → All students across my batches
  → Progress overview: tutorial%, exam score, attendance%

All pages: react-query, match existing admin-app styling.
Faculty CANNOT see students from other faculty's batches.
Run pnpm typecheck:all and pnpm build:all → pass.
```

---

## Phase SKU-9 — Integration + Certification

#### SKU-9-A-01 · SkillUp certification flow · `SERVICE` · M ⚠ USER-GATED

**▶ AI PROMPT**
```
Implement SkillUp IT Academy certification flow in student-faculty-service.

Create: services/student-faculty-service/src/modules/certification/certification.service.ts

class CertificationService {
  async checkCertificationEligibility(studentId: string, courseId: string): Promise<EligibilityResult>
    Requirements (from PHASE-SKILLUP-ACADEMY.md Part 7):
      1. attendance >= 75% (from attendance_records in people-db)
      2. exam_score >= 70 (from exam-service: GET /api/exam/results/{userId}/domain-average)
      3. has_approved_project = true (from tutorial-service: GET /api/tutorial/projects/{userId}/approved-count)
      4. no_fee_dues = true (from payment_installments: all installments paid)
    Returns: { eligible: boolean, failedReasons: string[] }

  async issueCertificate(studentId: string, courseId: string, issuedBy: string): Promise<Certificate>
    → Check eligibility first → throw if not eligible
    → Generate unique verification code (UUID-based)
    → INSERT into tutorial_db.certificates (cross-service: call tutorial-service API)
    → UPDATE student.lifecycle_status = 'certified'
    → Publish certificate.issued event
    → notification-service sends congratulations email + WhatsApp

  async verifyCertificate(verificationCode: string): Promise<CertificatePublicView>
    → GET /api/tutorial/certificates/verify/{code} → from tutorial-service
    → Returns public view (no auth required — for cert.skillupitacademy.com)
}

Add public route: GET /api/certificates/verify/:code (no auth)
  → Returns { studentName, courseName, issuedDate, facultyName, instituteDetails }

Add route in apps/skillup-web: app/(public)/verify/[code]/page.tsx
  → Public certificate verification page

Consume certificate.issued event in notification-service:
  → Send email: "Congratulations on completing [Course]!"
  → Send WhatsApp: same message with certificate link

Write integration tests for complete certification flow.
```

---

### Final Deep Audit — SkillUp IT Academy COMPLETE
```
□ Student enquiry → admission → enrollment → batch → certification full flow works
□ Faculty marks attendance → absent students get WhatsApp within 15 min (event flow)
□ Batch.subtopics_covered event → tutorial-service marks class-assisted progress
□ exam.completed event → tutorial-service creates remediation plan for SkillUp student
□ Payment overdue → access suspended after 14 days
□ Certificate issued only when all 4 requirements met
□ skillup-web loads at app.skillupitacademy.com
□ skillup-admin loads at admin.skillupitacademy.com
□ faculty-app loads at faculty.skillupitacademy.com
□ cert.skillupitacademy.com/[code] shows certificate without auth
□ SkillUp student can access notes.realtutorialhub.com (cross-platform JWT works)
□ pnpm typecheck:all → zero errors
□ pnpm test → all 1138+ tests pass
```
