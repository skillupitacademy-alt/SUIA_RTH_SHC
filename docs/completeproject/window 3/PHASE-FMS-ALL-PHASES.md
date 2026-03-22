# PHASE-FMS-CORE: Faculty Management System Core
## docs/blueprints/PHASE-FMS-CORE.md

> Platform: SkillUp IT Academy + faculty-app
> Sprint: SkillUp Sprint 3

---

## Part 1: Faculty Lifecycle States

```
APPLICATION_RECEIVED → UNDER_EVALUATION → DEMO_CLASS_SCHEDULED
→ DEMO_COMPLETED → EMPANELLED → BATCH_ASSIGNED
→ ACTIVELY_TEACHING → BATCH_COMPLETED → ON_STANDBY

Side states: ON_LEAVE, SUSPENDED, RESIGNED, BLACKLISTED
```

---

## Part 2: Faculty DB Schema

```sql
-- ── FACULTY ───────────────────────────────────────────────────────────────
CREATE TABLE faculty (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE,
  employee_code       TEXT UNIQUE,             -- e.g., "FAC-2026-001"
  specializations     UUID[],                  -- domain_ids they can teach
  experience_years    INTEGER,
  education           JSONB,                   -- degree, institution, year
  certifications      JSONB[],                 -- professional certs
  linkedin_url        TEXT,
  github_url          TEXT,
  portfolio_url       TEXT,
  employment_type     TEXT DEFAULT 'contract' CHECK (
    employment_type IN ('full_time','part_time','contract','guest')
  ),
  rate_per_hour       DECIMAL(8,2),
  currency            VARCHAR(3) DEFAULT 'INR',
  lifecycle_status    TEXT DEFAULT 'application_received',
  rating              DECIMAL(3,2),            -- avg student rating (0–5)
  total_batches_taken INTEGER DEFAULT 0,
  total_students_taught INTEGER DEFAULT 0,
  bio                 TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

-- ── FACULTY AVAILABILITY ──────────────────────────────────────────────────
CREATE TABLE faculty_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id      UUID NOT NULL REFERENCES faculty(id),
  day_of_week     TEXT NOT NULL,   -- 'monday','tuesday',...
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_available    BOOLEAN DEFAULT true,
  effective_from  DATE,
  effective_until DATE,
  UNIQUE(faculty_id, day_of_week, start_time)
);

-- ── FACULTY LEAVE ──────────────────────────────────────────────────────────
CREATE TABLE faculty_leaves (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id      UUID NOT NULL REFERENCES faculty(id),
  leave_type      TEXT CHECK (leave_type IN ('sick','casual','planned','emergency')),
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  reason          TEXT,
  status          TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','approved','rejected')
  ),
  approved_by     UUID,
  substitute_faculty_id UUID,      -- who covers their batches
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── FACULTY RATINGS (by students) ────────────────────────────────────────
CREATE TABLE faculty_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id      UUID NOT NULL REFERENCES faculty(id),
  student_id      UUID NOT NULL,
  batch_id        UUID NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  teaching_clarity INTEGER CHECK (teaching_clarity BETWEEN 1 AND 5),
  responsiveness  INTEGER CHECK (responsiveness BETWEEN 1 AND 5),
  knowledge_depth INTEGER CHECK (knowledge_depth BETWEEN 1 AND 5),
  review_text     TEXT,
  is_anonymous    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, batch_id)  -- one rating per student per batch
);

-- ── FACULTY DEMO CLASSES ──────────────────────────────────────────────────
CREATE TABLE faculty_demo_classes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id      UUID NOT NULL REFERENCES faculty(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  evaluator_id    UUID NOT NULL,    -- admin who evaluates
  topic           TEXT,
  mode            TEXT,
  recording_url   TEXT,
  score           INTEGER,          -- out of 100
  feedback        TEXT,
  outcome         TEXT CHECK (outcome IN ('approved','rejected','another_demo')),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: FacultyService

```typescript
class FacultyService {
  // Onboard a new faculty applicant
  async createFacultyApplication(userId: string, data: FacultyApplicationData): Promise<Faculty>

  // Advance lifecycle status
  async advanceLifecycleStatus(
    facultyId: string,
    newStatus: FacultyLifecycleStatus,
    changedBy: string
  ): Promise<void>

  // Schedule demo class
  async scheduleDemoClass(
    facultyId: string,
    demoData: DemoClassInput,
    scheduledBy: string
  ): Promise<DemoClass>

  // Record demo outcome → if approved, status → EMPANELLED
  async recordDemoOutcome(
    demoId: string,
    outcome: 'approved' | 'rejected' | 'another_demo',
    score: number,
    feedback: string
  ): Promise<void>

  // Get faculty workload (batches currently teaching)
  async getFacultyWorkload(facultyId: string): Promise<WorkloadSummary>

  // Find available faculty for a time slot
  async findAvailableFaculty(
    domainId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string
  ): Promise<Faculty[]>

  // Get faculty performance metrics
  async getFacultyMetrics(
    facultyId: string,
    period?: DateRange
  ): Promise<FacultyMetrics>
  // Returns: avg student score in their batches, attendance rates,
  //          student ratings, completion rates
}
```

---

## Part 4: Faculty App Pages

```
apps/faculty-app/src/app/(faculty)/

dashboard/
  → Today's sessions, upcoming this week
  → My students: total count, avg attendance, avg exam score
  → Quick actions: mark attendance, add session notes

my-batches/
  → All active batches with student counts
  → [batchId]/page.tsx → batch detail + student list

my-batches/[batchId]/sessions/
  → Session history + upcoming sessions
  → [sessionId]/attendance → mark attendance

my-batches/[batchId]/students/
  → All students in batch with progress overview
  → Cross-service: fetches tutorial progress + exam scores

assignments/
  → Pending assignment reviews (from tutorial-service)
  → [submissionId]/review → review + score + feedback

exams/
  → Exams I've created or am assigned to review
  → Results dashboard for my students

content/
  → Tutorial content I can create/edit for my domain
  → Requires admin approval before publishing

reports/
  → My batch performance report
  → Student progress comparisons
```

---

## Part 5: Leave & Substitute Management

```
When faculty marks leave:
  1. Faculty submits leave request (faculty-app)
  2. Admin notified immediately (notification-service)
  3. Admin assigns substitute faculty
  4. Students notified: "Session on [date] will be taken by [substitute]"
  5. Substitute gets calendar notification
  6. Batch session record updated: faculty_id = substitute_id, notes = "Substitute for [original]"
```

---

## Part 6: Faculty Performance Analytics (Admin)

```
Metrics calculated per faculty per period:

  1. Student exam scores (avg across all batches)
     → pulled from exam-service API
  2. Student tutorial completion rate
     → pulled from tutorial-service API
  3. Attendance rate (students attending their sessions)
     → from attendance_records table
  4. Student ratings (avg from faculty_ratings)
  5. Assignment review turnaround time
     → time between submission and faculty review completion
  6. Content creation (number of approved subtopic blocks)

These aggregate into a Faculty Health Score (0-100)
Used for: bonus calculation, batch assignment priority, empanelment renewal
```

---

## Part 7: Verification

```
□ Faculty application creates user in SkillHubCore + faculty record
□ Employee code auto-generated on EMPANELLED status
□ Demo class scheduled and faculty notified
□ Demo approval changes status to EMPANELLED
□ Faculty can only be assigned to batches in their specialization domains
□ Availability conflict detection: cannot double-book a time slot
□ Leave triggers substitute assignment notification
□ Student ratings saved once per student per batch
□ Faculty metrics dashboard shows cross-service data correctly
□ Blacklisted faculty cannot login to faculty-app (JWT claims checked)
```

---

*Phase: FMS-CORE | Status: Ready*


# PHASE-FMS-EXECUTION: Batch Execution & Academic Review
## docs/blueprints/PHASE-FMS-EXECUTION.md

> Depends on: PHASE-FMS-CORE, PHASE-SMS-BATCH, Tutorial + Exam engines

---

## Part 1: Batch Execution Flow

```
BEFORE SESSION:
  Faculty checks: scheduled subtopics for today's session
  Faculty prepares: opens tutorial content for reference
  Students notified: 1 hour reminder via WhatsApp

DURING SESSION:
  Faculty:
    → Opens attendance.skillupitacademy.com/{sessionId}
    → Marks attendance in real-time
    → Shares screen / meet link
    → References notes on notes.realtutorialhub.com (faculty view)

AFTER SESSION (within 24 hours):
  Faculty:
    → Records subtopics covered (selects from hierarchy)
    → Adds session notes (for admin record)
    → Uploads recording URL (if online session)
    → Reviews any pending assignments (from tutorial-service)

WEEKLY:
  Faculty reviews:
    → Student progress reports (tutorial completion + exam scores)
    → Students with < 75% attendance (contacts them)
    → Exam results for their batch (from exam-service)
```

---

## Part 2: Assignment Review Workflow

```
Student submits assignment (tutorial-service)
          ↓
QStash event: assignment.submitted
          ↓
If evaluation_type = 'peer_review' OR faculty_review:
  Notify faculty: "New assignment to review from [Student Name]"
          ↓
Faculty opens faculty-app/assignments/[submissionId]/review
  Shows:
    - Assignment brief + rubric
    - Student's submission (code / repo URL / document)
    - AI pre-review (from Phase T4 QStash pipeline)
    - Rubric scoring form (4 dimensions × 25 points)
    - Feedback text area
    - "Request revision" OR "Approve" button
          ↓
Faculty submits review
          ↓
tutorial-service: update submission status
If approved:
  → Award badge (Phase T4 pipeline)
  → Send congratulations email to student
If revision needed:
  → Student notified: "Faculty requests revision on [Project Name]"
  → Student sees specific feedback in their portal
```

---

## Part 3: Exam Review (Faculty Perspective)

```
Faculty can:
  1. VIEW exam results for students in their batches
     → faculty-app/exams → select batch → see all student scores
     → Drill down: per-student score breakdown by subtopic
     → Color coding: green (> 80%), yellow (60-80%), red (< 60%)

  2. GIVE FEEDBACK on exam performance
     → Select student → write performance notes → saved to exam DB via API
     → Student can see faculty feedback in their exam result detail

  3. SET EXAMS (if faculty has content-creator role)
     → Create question bank for their domain
     → Submit questions for admin approval
     → Admin approves → questions available in exam blueprints

Faculty CANNOT:
  → Modify student scores (immutable — only admin with audit log)
  → Delete questions already used in exams
  → Access other faculty's batch data
```

---

## Part 4: Session Recording Management

```
After each online session:
  Faculty adds recording URL (Google Drive / YouTube unlisted / Loom)
  → Saved to batch_sessions.recording_url
  → Available to enrolled students in schedule subdomain
  → Access controlled: only batch-enrolled students can view link
  → Link expires policy: 6 months after batch completion

Offline sessions:
  Faculty can optionally upload recording if room has camera
  → Same workflow as online
```

---

## Part 5: Subtopic Coverage Tracking (Bridge to Tutorial Engine)

```typescript
// When faculty records subtopics covered in session:
async function recordSubtopicsCovered(
  sessionId: string,
  subtopicIds: string[],
  facultyId: string
) {
  // 1. Update session record
  await db.update(batchSessions)
    .set({ subtopicIds, topicCovered, status: 'completed' })
    .where(eq(batchSessions.id, sessionId))

  // 2. Get all students in this batch
  const enrollments = await getEnrolledStudents(session.batchId)

  // 3. Publish event for tutorial-service
  // tutorial-service will mark these subtopics as "introduced in class"
  // (different from "self-studied" — both tracked separately)
  await publishEvent('batch.subtopics_covered', {
    sessionId,
    batchId: session.batchId,
    subtopicIds,
    studentIds: enrollments.map(e => e.studentId),
    facultyId
  })
}

// In tutorial-service: consumes batch.subtopics_covered
// → For each student: adds note "Covered in class on [date]" to their progress
// → Optionally: pre-unlocks these subtopics in the tutorial flow
//   (SkillUp students get class-assisted unlock vs self-study unlock)
```

---

## Part 6: Faculty Dashboard Widgets

```
Widget 1: My Today (top of dashboard)
  - Sessions today with times + mode + room/link
  - Pending assignment reviews count (badge)
  - Students with < 75% attendance alert count

Widget 2: Batch Health (per batch card)
  - Batch name + current topic in syllabus
  - Avg student exam score (from exam-service)
  - Tutorial completion % (from tutorial-service)
  - Attendance this month

Widget 3: Recent Activity
  - Last 5 assignment submissions waiting for review
  - Students who asked AI Tutor questions about my subtopics
  - Recent exam completions in my batch

Widget 4: Calendar (mini, next 7 days)
  - Colour-coded sessions (online=blue, offline=green, cancelled=red)
```

---

## Part 7: Verification

```
□ Faculty can mark attendance in < 30 seconds for 30 students
□ Subtopics covered recorded and synced to tutorial-service
□ Assignment review form shows AI pre-review alongside rubric
□ Approved assignment triggers badge award within 2 minutes
□ Faculty can see student exam scores for their batch only
□ Faculty feedback appears on student's exam result page
□ Recording URL saved and accessible to enrolled students only
□ Session notes saved and visible to admin
□ Faculty dashboard loads cross-service data in < 2 seconds
□ Faculty cannot see students from other faculty's batches
```

---

*Phase: FMS-EXECUTION | Status: Ready*
