# ⚠️ PROJECT EVALUATION DESIGN (LOCKED)
## Date: 2026-03-22 | Supersedes original design below

Projects are evaluated by HUMANS assisted by AI.
AI never approves a project. AI only generates feedback.
Final approval is always made by admin or faculty.

REMOVED from original design:
  ✗ Stub AI review with fixed rubric scores (72/100)
  ✗ Auto-approve if total ≥ 70
  ✗ Score-based approval logic
  ✗ Any automated pass/fail on projects

REPLACED WITH:
  ✓ AI review generates structured feedback only
    Returns: { feedback, checklist, suggestedStatus: 'needs_review' }
    suggestedStatus is ALWAYS 'needs_review' — never 'approved'
  ✓ Admin/faculty makes final approval decision
  ✓ Peer review feeds into admin decision for expert projects
  ✓ No scores. No thresholds. Human judgment only.

UPDATED STATUS FLOW:
  submitted → ai_reviewing → needs_review
  → approved (human approved)
  → revision_needed (human requested changes)
  → revision_needed → submitted (student resubmits, cycle repeats)

AI ROLE:
  → Check: does deliverable exist
  → Check: is README present
  → Check: does code reference requirements
  → Return structured checklist for human reviewer
  → Never decide outcome

HUMAN ROLE:
  → Admin/faculty reviews AI checklist + student deliverable
  → Clicks Approve or Request Revision in admin UI
  → That action sets the final status
  → Expert projects: admin approval only, no AI involvement in decision

Admin review UI is built in T8 — not T4.
T4 builds the backend engine only.

---
# Original design preserved below for reference only
# Do not implement score-based approval logic
---

# PHASE-T4: Project Engine
## docs/blueprints/PHASE-T4-PROJECT-ENGINE.md

> Prerequisites: PHASE-T3 complete, badges table seeded
> Sprint: Tutorial Sprint 4

---

## Purpose

Students complete real-world projects at Topic, Subject, and Domain scope.
Projects are evaluated by AI, peers, or admins depending on level.
Completion awards badges and unlocks certificates.

---

## Part 1: Project Scope & Level Matrix

```
SCOPE     LEVEL          EVALUATOR        DELIVERABLE
──────────────────────────────────────────────────────────────
topic     simple         auto (test suite) code submission
topic     intermediate   ai_review         GitHub repo + README
topic     expert         peer + admin      Live demo + arch doc
subject   simple         auto             code submission
subject   intermediate   ai_review         project + write-up
subject   expert         peer + admin      production app
domain    simple         ai_review         multi-topic project
domain    intermediate   peer + admin      full-stack app
domain    expert         admin only        capstone + presentation
```

---

## Part 2: Project Submission State Machine

```
DRAFT → SUBMITTED → AI_REVIEWING → PEER_REVIEW → APPROVED → BADGE_AWARDED
                                              → REJECTED
                                              → REVISION_NEEDED → SUBMITTED (cycle)
```

---

## Part 3: ProjectService

```typescript
class ProjectService {
  async getProject(projectId: string, userId: string): Promise<ProjectDetail>
  // Returns project details + user's submission status

  async submitProject(
    userId: string,
    projectId: string,
    deliverable: ProjectDeliverable
  ): Promise<{ submissionId: string; status: 'submitted' }>
  // → Saves submission as DRAFT
  // → Enqueues QStash: review-project (AI review)
  // → Returns 202

  async getSubmission(submissionId: string): Promise<Submission>
  async getMyProjects(userId: string): Promise<ProjectSummary[]>
  async getProjectsByScope(
    scope: 'topic' | 'subject' | 'domain',
    parentId: string
  ): Promise<Project[]>
}
```

---

## Part 4: QStash Review Pipeline

```
STEP 1: POST /api/workers/review-project
  Input: { submissionId, projectId, userId }
  → Load project rubric from tutorial_projects
  → Load student deliverable (repo URL, live demo, etc.)
  → Call AI with structured rubric prompt:
    - Code quality (0–25 pts)
    - Requirement coverage (0–25 pts)
    - Documentation (0–25 pts)
    - Innovation (0–25 pts)
  → Save AI review to tutorial_project_submissions.ai_review
  → If ai_review.total >= 70: move to APPROVED (simple/intermediate)
  → If project.evaluation_type = 'peer_review': move to PEER_REVIEW
  → Publish: project.ai_reviewed event

STEP 2 (if peer review): POST /api/workers/assign-peer-reviewers
  → Select 2–3 eligible students (completed same project level)
  → Notify via notification-service
  → Set review deadline (72 hours)

STEP 3: POST /api/workers/award-project-badge (on APPROVED)
  → Check badge criteria in badges table
  → Insert into student_badges
  → Publish: badge.awarded event
  → Publish: certificate.check-eligibility event

STEP 4: POST /api/workers/send-project-email
  → Approved: congratulations email with badge image (Resend)
  → Rejected: feedback email with revision guidance
```

---

## Part 5: Certificate Eligibility Check

```typescript
// Triggered by certificate.check-eligibility event
async function checkCertificateEligibility(userId: string, domainId: string) {
  // Topic certificate: all subtopics completed + simple project approved
  // Subject certificate: all topics + intermediate project approved
  // Domain certificate: all subjects + expert project approved by admin

  const eligibility = await calculateEligibility(userId, domainId)
  if (eligibility.topicCert) await issueCertificate(userId, 'topic', eligibility.topicId)
  if (eligibility.subjectCert) await issueCertificate(userId, 'subject', eligibility.subjectId)
  if (eligibility.domainCert) await issueCertificate(userId, 'domain', domainId)
}

async function issueCertificate(userId: string, scope: string, parentId: string) {
  const verificationCode = generateSecureCode() // cryptographically random
  await db.insert(certificates).values({
    userId, scope, parentId,
    verificationCode,
    pdfUrl: null // generated by QStash job
  })
  // Enqueue PDF generation
  await qstash.publishJSON({ url: '/api/workers/generate-certificate-pdf', body: {...} })
  // Publish event to placement-service
  await events.publish('certificate.issued', { userId, scope, parentId })
}
```

---

## Part 6: Public Certificate Verification

```
GET /certificates/verify/:verificationCode
→ Public route (no auth)
→ Returns: student name, course name, issued date, scope
→ LinkedIn-shareable URL
→ Cached: 24 hours (certificates never change once issued)
```

---

## Part 7: Verification

```
□ Project submission returns 202 immediately (no blocking review)
□ AI review completes within 60 seconds via QStash
□ Expert project requires human approval (not just AI)
□ Badge awarded atomically with project approval
□ Certificate issued after all scope requirements met
□ Public verification URL works without auth
□ PDF generated and attached to certificate record
□ placement-service receives certificate.issued event
```

---

*Phase: T4 | Status: Ready*
