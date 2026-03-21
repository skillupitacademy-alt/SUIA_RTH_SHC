# SkillUp IT Academy — Complete Platform Blueprint
## docs/blueprints/PHASE-SKILLUP-ACADEMY.md

> Domains: skillupitacademy.com + 9 subdomains
> Depends on: SkillHubCore SSO, RealTutorialHub engines

---

## Part 1: Platform Identity

```
RealTutorialHub  → AI self-learning (student-driven)
SkillUp Academy  → Human-guided training (instructor-led)
                   Uses RealTutorialHub engines for content + exams

SkillUp IS NOT a separate content system.
SkillUp USES RealTutorialHub's tutorial + exam engines.
SkillUp ADDS: human faculty, batches, physical attendance, placement.
```

---

## Part 2: Domain Architecture

```
skillupitacademy.com          → Marketing landing page (SSG, Vercel)
enquiry.skillupitacademy.com  → Enquiry capture form + CRM (crm-app)
admission.skillupitacademy.com → Admission processing portal (crm-app)
schedule.skillupitacademy.com → Batch timetable (student + faculty view)
attendance.skillupitacademy.com → Attendance marking (faculty) + view (student)
learn.skillupitacademy.com    → Redirects to notes.realtutorialhub.com
                                 (SkillUp students use RTH for content)
cert.skillupitacademy.com     → Certificate verification (public)
internship.skillupitacademy.com → Internship portal
placement.skillupitacademy.com → Placement + job board
admin.skillupitacademy.com    → Full admin panel
```

---

## Part 3: Admission Types (Two Products)

```
TYPE 1: Digital Learning (B2C, like RealTutorialHub)
  What student gets:
    → Access to notes.realtutorialhub.com (Tutorial Engine)
    → Access to quiz.realtutorialhub.com (Exam Engine)
    → AI Tutor (Upstash Vector powered)
    → Certificates (topic/subject/domain)
  What student does NOT get:
    → Live classes, faculty, batch, attendance
  Pricing: Lower (digital-only)
  Admission flow: Online → Payment → Instant access

TYPE 2: Training (Live + Placement)
  What student gets:
    → Everything in Digital Learning PLUS:
    → Live classes with faculty (online or offline)
    → Batch allocation + attendance tracking
    → Assignment review by faculty
    → Mock interviews + placement support
    → Internship opportunities
  Pricing: Higher (human-delivered)
  Admission flow: Enquiry → Counselling → Demo → Admission → Batch allocation
```

---

## Part 4: Services Used by SkillUp

```
skillup-service       → owns skillup-db (students, faculty, batches, CRM)
  └── depends on:
      skillhubcore-service  → SSO + subscriptions
      tutorial-service      → content + progress (cross-service API calls)
      exam-service          → exams + results (cross-service API calls)
      payment-service       → fee collection
      notification-service  → all communications

skillup-db tables:
  students, faculty, courses, batches, batch_sessions,
  batch_enrollments, faculty_batch_assignments, faculty_availability,
  faculty_leaves, faculty_ratings, attendance_records, student_notes,
  student_documents, enquiries, enquiry_follow_ups, admissions,
  demo_sessions, payment_plans, payment_installments, payment_transactions,
  scholarships, gateway_webhook_logs
```

---

## Part 5: Apps in Monorepo for SkillUp

```
apps/
  skillup-web/          → public marketing site (Next.js SSG)
  skillup-admin/        → admin panel for SkillUp operations
  crm-app/              → enquiry + admission management (internal staff)
  faculty-app/          → faculty portal
  (student uses student-app, same as RealTutorialHub)
```

---

## Part 6: Integration Points with RealTutorialHub

```
INTEGRATION 1: Student accesses tutorial content
  SkillUp student → same JWT (SkillHubCore) → notes.realtutorialhub.com
  → JWT checked: platforms.includes('skillup') → access granted
  → Tutorial progress saved under same userId in tutorial-service

INTEGRATION 2: Faculty monitors student tutorial progress
  Faculty dashboard → API call to tutorial-service:
    GET /api/tutorial/progress/batch/{batchId}
  → Returns all students' subtopic completion status
  → Faculty sees which subtopics each student has covered

INTEGRATION 3: Exam results visible to faculty
  Faculty dashboard → API call to exam-service:
    GET /api/exam/results/batch/{batchId}
  → Returns all students' exam scores in their batch

INTEGRATION 4: Subtopics covered in class → unlocked in tutorial
  Faculty records subtopics in session
  → batch.subtopics_covered QStash event
  → tutorial-service marks subtopics as class-assisted (special status)

INTEGRATION 5: Weak areas from exam → remediation in tutorial
  SkillUp student completes exam → exam.completed event
  → tutorial-service creates remediation plan (same as RealTutorialHub)
  → Faculty ALSO notified: "Student X has weak areas in [subtopics]"
  → Faculty can plan next session to address weak areas
```

---

## Part 7: Certification Flow (SkillUp specific)

```
SkillUp Training Certificate (different from RealTutorialHub certificate):

Requirements:
  1. ≥ 75% attendance across all batch sessions
  2. ≥ 70% score on final domain assessment (Exam Engine)
  3. At least 1 project approved (Simple or above) in Tutorial Engine
  4. No outstanding fee balance

Certificate types:
  - Course Completion Certificate (issued by SkillUp IT Academy)
  - Domain Mastery Certificate (co-issued with RealTutorialHub)
  - Industry-aligned certificate (if partnered with certifying body)

Verification: cert.skillupitacademy.com/{verificationCode}
→ Shows: student name, course, dates, faculty name, institute seal
```

---

## Part 8: Verification

```
□ SkillUp student JWT grants access to notes.realtutorialhub.com
□ Faculty can view student tutorial progress from faculty-app
□ Batch session coverage syncs to tutorial-service
□ Two admission types (digital/training) create different subscription plans
□ SkillUp certificate issued only when all 4 requirements met
□ cert.skillupitacademy.com shows certificate details without auth
□ Enquiry form captures UTM parameters for marketing attribution
□ Faculty marks attendance → absent students get WhatsApp within 15 min
□ Payment overdue → access suspended after 14 days
□ Admin can see unified student view: personal + academic + financial
```

---

*Phase: SKILLUP-ACADEMY | Status: Ready*
