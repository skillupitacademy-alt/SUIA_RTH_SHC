# PHASE-SMS-BATCH: Batch Management & Attendance
## docs/blueprints/PHASE-SMS-BATCH.md

> Platform: SkillUp IT Academy
> Subdomain: schedule.skillupitacademy.com + attendance.skillupitacademy.com

---

## Part 1: Batch Structure

```
Batch = A cohort of students studying the same course with the same faculty
        on a fixed schedule (days + times + mode)

Example:
  Batch: "Full Stack Web Dev — Batch 12 — Morning"
  Course: Full Stack Web Development (Domain)
  Faculty: John Doe
  Schedule: Mon/Wed/Fri, 10:00 AM – 12:00 PM
  Mode: Online (Google Meet) OR Offline (Classroom A)
  Start Date: 2026-04-01
  End Date: 2026-09-30
  Capacity: 30 students
  Enrolled: 24 students
```

---

## Part 2: Batch DB Schema

```sql
-- ── COURSES ───────────────────────────────────────────────────────────────
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id       UUID NOT NULL,     -- references hierarchy
  name            TEXT NOT NULL,
  description     TEXT,
  duration_weeks  INTEGER,
  fee_inr         DECIMAL(10,2),
  fee_usd         DECIMAL(10,2),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── BATCHES ───────────────────────────────────────────────────────────────
CREATE TABLE batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id),
  name              TEXT NOT NULL,
  batch_code        TEXT UNIQUE,      -- e.g., "FSWD-B12-AM"
  faculty_id        UUID,             -- primary faculty
  mode              TEXT NOT NULL CHECK (mode IN ('online','offline','hybrid')),
  schedule_days     TEXT[],           -- ['monday','wednesday','friday']
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  timezone          TEXT DEFAULT 'Asia/Kolkata',
  start_date        DATE NOT NULL,
  end_date          DATE,
  capacity          INTEGER DEFAULT 30,
  enrolled_count    INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'upcoming' CHECK (
    status IN ('upcoming','active','completed','cancelled')
  ),
  meet_link         TEXT,             -- Google Meet / Zoom link for online
  room              TEXT,             -- classroom name for offline
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_faculty ON batches(faculty_id);

-- ── BATCH ENROLLMENTS ─────────────────────────────────────────────────────
CREATE TABLE batch_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id),
  student_id    UUID NOT NULL REFERENCES students(id),
  enrolled_at   TIMESTAMPTZ DEFAULT now(),
  status        TEXT DEFAULT 'active' CHECK (
    status IN ('active','completed','dropped','transferred')
  ),
  transferred_to UUID,  -- if transferred to another batch
  UNIQUE(batch_id, student_id)
);

-- ── BATCH SESSIONS (individual class sessions) ────────────────────────────
CREATE TABLE batch_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES batches(id),
  faculty_id      UUID NOT NULL,
  session_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  topic_covered   TEXT,              -- what was taught in this session
  subtopic_ids    UUID[],            -- which subtopics were covered
  mode            TEXT CHECK (mode IN ('online','offline','hybrid')),
  recording_url   TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled','in_progress','completed','cancelled')
  ),
  cancelled_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_batch ON batch_sessions(batch_id);
CREATE INDEX idx_sessions_date ON batch_sessions(session_date);

-- ── FACULTY BATCH ASSIGNMENTS ─────────────────────────────────────────────
CREATE TABLE faculty_batch_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id  UUID NOT NULL,
  batch_id    UUID NOT NULL REFERENCES batches(id),
  role        TEXT DEFAULT 'primary' CHECK (role IN ('primary','substitute','assistant')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  UNIQUE(faculty_id, batch_id, role)
);
```

---

## Part 3: BatchService

```typescript
class BatchService {
  async createBatch(data: CreateBatchInput): Promise<Batch>
  async enrollStudent(batchId: string, studentId: string): Promise<BatchEnrollment>
  async transferStudent(studentId: string, fromBatch: string, toBatch: string): Promise<void>

  // Auto-generate sessions for entire batch duration
  async generateBatchSessions(batchId: string): Promise<BatchSession[]>
  // Uses batch.schedule_days + start/end dates to create all sessions upfront

  // Mark attendance for a session (faculty action)
  async markSessionAttendance(
    sessionId: string,
    attendance: Array<{ studentId: string; status: AttendanceStatus }>,
    markedBy: string
  ): Promise<void>

  // Get attendance percentage for student
  async getStudentAttendance(
    studentId: string,
    batchId: string
  ): Promise<{ percentage: number; present: number; total: number }>

  // Get students with < 75% attendance in a batch
  async getLowAttendance(batchId: string): Promise<LowAttendanceReport[]>

  // Record subtopics covered in session (links to Tutorial Engine)
  async recordSessionContent(
    sessionId: string,
    subtopicIds: string[],
    topicCovered: string
  ): Promise<void>
  // After recording: publishes event so tutorial-service can
  // unlock those subtopics for enrolled students
}
```

---

## Part 4: Attendance Marking UI (Faculty)

```
Route: attend.skillupitacademy.com/{sessionId}
       OR faculty-app /my-batches/{batchId}/sessions/{sessionId}/attendance

Page layout:
  Session header: Date, Time, Batch name, Faculty name
  Student list: all enrolled students (alphabetical)
    Each row: Name | Roll No | P / A / L / E toggle buttons
  Bulk actions: "Mark All Present" button
  Submit: saves attendance + triggers parent notifications for absents
  Timer: shows session start/end countdown

Faculty can edit attendance for up to 24 hours after session ends.
After 24 hours: locked (only admin can override with reason).
```

---

## Part 5: Events Published

```
batch.session_completed     → tutorial-service: unlock subtopics covered
                            → notification-service: session summary to students
attendance.session_marked   → notification-service: alert absent students + parents
batch.student_low_attendance → notification-service: warning to student + guardian
batch.student_enrolled      → notification-service: welcome to batch email + schedule
batch.session_cancelled     → notification-service: cancellation alert to all students
```

---

## Part 6: Schedule Subdomain

```
schedule.skillupitacademy.com

Student view:
  - My timetable (weekly calendar view)
  - Upcoming sessions (next 7 days)
  - Recording links (past sessions)
  - Holiday / cancelled session markers

Faculty view:
  - All my batches timetable
  - Today's sessions
  - Session history with attendance summary

Admin view:
  - All batch schedules
  - Clash detection (faculty double-booked)
  - Room booking management (offline batches)
```

---

## Part 7: Verification

```
□ Batch creation auto-generates all sessions for duration
□ Student enrolled in batch receives timetable email
□ Faculty can mark attendance session-by-session
□ Attendance locked after 24 hours (admin override available)
□ < 75% attendance triggers warning notification
□ < 60% attendance triggers admin escalation
□ Subtopics recorded in session unlock in tutorial-service
□ Cancelled session notifies all enrolled students immediately
□ Recording URL saved to session record after class
□ Batch capacity enforcement: cannot exceed enrolled_count = capacity
```

---

*Phase: SMS-BATCH | Status: Ready*
