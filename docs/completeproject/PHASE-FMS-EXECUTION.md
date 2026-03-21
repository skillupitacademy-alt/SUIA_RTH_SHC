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
