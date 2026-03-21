# PHASE-SMS-CORE: Student Management System Core
## docs/blueprints/PHASE-SMS-CORE.md

> Platform: SkillUp IT Academy
> Sprint: SkillUp Sprint 2 (after SkillHubCore SSO complete)

---

## Purpose

Manage the full student lifecycle within SkillUp IT Academy —
from first enquiry through admission, fee payment, batch allocation,
active learning, and eventual placement or certification.

---

## Part 1: Student Lifecycle States

```
ENQUIRY_RECEIVED → ENQUIRY_QUALIFIED → COUNSELLING_DONE
→ ADMISSION_IN_PROGRESS → DOCUMENTS_VERIFIED
→ PAYMENT_PENDING → ENROLLED → BATCH_ALLOCATED
→ LEARNING_IN_PROGRESS → ASSESSMENT_COMPLETE
→ CERTIFIED → PLACEMENT_IN_PROGRESS → PLACED → ALUMNI

Side states:
  PAYMENT_OVERDUE, ON_LEAVE, DROPPED, DEFERRED, BLACKLISTED
```

---

## Part 2: Student DB Schema

```sql
-- ── STUDENTS ──────────────────────────────────────────────────────────────
CREATE TABLE students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE,  -- references People DB users.id
  enrollment_number   TEXT UNIQUE,           -- auto-generated on enrollment
  admission_type      TEXT NOT NULL CHECK (admission_type IN ('digital','training','hybrid')),
  lifecycle_status    TEXT NOT NULL DEFAULT 'enquiry_received',
  domain_id           UUID,                  -- primary domain of study
  batch_id            UUID,                  -- current active batch
  counsellor_id       UUID,                  -- assigned counsellor (faculty/staff)
  referral_source     TEXT,                  -- 'google', 'instagram', 'referral', 'walk-in'
  referral_by         UUID,                  -- if referred by existing student
  guardian_name       TEXT,
  guardian_phone      TEXT,
  guardian_email      TEXT,
  emergency_contact   JSONB,
  special_needs       TEXT,
  medical_notes       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_students_status ON students(lifecycle_status);

-- ── ENROLLMENTS ────────────────────────────────────────────────────────────
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  course_id       UUID NOT NULL,
  batch_id        UUID,
  status          TEXT DEFAULT 'active' CHECK (
    status IN ('active','completed','dropped','deferred')
  ),
  enrolled_at     TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  dropped_at      TIMESTAMPTZ,
  drop_reason     TEXT
);

-- ── STUDENT DOCUMENTS ─────────────────────────────────────────────────────
CREATE TABLE student_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  doc_type        TEXT NOT NULL CHECK (doc_type IN (
    'id_proof','address_proof','qualification','photo','signature','other'
  )),
  file_url        TEXT NOT NULL,
  file_name       TEXT,
  verified        BOOLEAN DEFAULT false,
  verified_by     UUID,
  verified_at     TIMESTAMPTZ,
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

-- ── ATTENDANCE RECORDS ────────────────────────────────────────────────────
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  session_id      UUID NOT NULL REFERENCES batch_sessions(id),
  batch_id        UUID NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
  marked_by       UUID NOT NULL,  -- faculty user_id
  marked_at       TIMESTAMPTZ DEFAULT now(),
  notes           TEXT,
  UNIQUE(student_id, session_id)
);

CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);

-- ── STUDENT NOTES (CRM notes by counsellors/admins) ──────────────────────
CREATE TABLE student_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id),
  author_id   UUID NOT NULL,
  note_type   TEXT CHECK (note_type IN ('general','academic','behavioral','financial')),
  content     TEXT NOT NULL,
  is_private  BOOLEAN DEFAULT false,  -- private notes visible only to admins
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: StudentService

```typescript
class StudentService {
  // Create student record after admission
  async createStudent(userId: string, admissionData: AdmissionData): Promise<Student>

  // Get full student profile with progress from all engines
  async getStudentProfile(studentId: string): Promise<StudentFullProfile>
  // Aggregates from: Students table + Tutorial DB progress + Exam DB results

  // Update lifecycle status (with audit trail)
  async updateLifecycleStatus(
    studentId: string,
    newStatus: LifecycleStatus,
    changedBy: string,
    reason?: string
  ): Promise<void>

  // Assign to batch
  async assignToBatch(studentId: string, batchId: string): Promise<void>

  // Get all students in a batch
  async getStudentsByBatch(batchId: string): Promise<Student[]>

  // Mark attendance (called by faculty)
  async markAttendance(
    sessionId: string,
    attendanceData: AttendanceEntry[],
    markedBy: string
  ): Promise<void>

  // Get attendance summary
  async getAttendanceSummary(
    studentId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<AttendanceSummary>

  // Get students with low attendance (< 75%)
  async getLowAttendanceStudents(batchId: string): Promise<StudentAttendanceSummary[]>
}
```

---

## Part 4: Admin Dashboard Data

```
Student Management Admin Panels:

/admin/students
  → Table: all students, filterable by status, batch, domain
  → Quick actions: change status, assign batch, add note

/admin/students/:id
  → Full profile: personal info, documents, fee status
  → Progress: tutorial completion % + exam scores (cross-service API calls)
  → Attendance: calendar heatmap view
  → Notes timeline: all counsellor notes chronologically
  → Payment history: installments, dues, receipts

/admin/students/:id/attendance
  → Per-session attendance log
  → Monthly summary: X/Y sessions attended (Z%)
  → Late arrivals, excused absences

/admin/batches/:batchId/attendance
  → Bulk attendance view for entire batch
  → Export to CSV for admin records
```

---

## Part 5: Events Published

```
student.created            → SkillHubCore (creates platform access)
                           → notification-service (welcome email + WhatsApp)
student.enrolled           → tutorial-service (initialize progress records)
                           → payment-service (create payment plan)
student.batch_assigned     → notification-service (batch schedule email)
attendance.marked          → notification-service (absent = alert parent/guardian)
student.status_changed     → notification-service (status-specific email)
student.low_attendance     → notification-service (warning email to student + guardian)
```

---

## Part 6: Verification

```
□ Student created after admission confirmed
□ Enrollment number auto-generated (format: SKU-YYYY-NNNN)
□ Lifecycle status transitions audited (who changed it, when, why)
□ Batch assignment updates student.batch_id
□ Attendance marked for all students in session simultaneously
□ Low attendance flag triggers notification to student + guardian
□ Cross-service: student profile shows tutorial progress
□ Admin can filter students by lifecycle_status
□ Documents stored in Vercel Blob / GCS (not DB)
```

---

*Phase: SMS-CORE | Status: Ready*
