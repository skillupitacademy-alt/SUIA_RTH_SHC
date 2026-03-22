# COMPLETE EXECUTION KIT
## Per-Step Prompt Cards for Every Step
## Window 2 Backend → Window 3 Backend → UI/UX

> HOW TO USE:
> One card = one agent session.
> For each step:
>   1. Open a new agent session
>   2. Upload the files listed under "UPLOAD THESE FILES"
>   3. Paste the OPENING PROMPT
>   4. Paste the STEP PROMPT
>   5. Agent implements + commits
>   6. You verify + approve
>   7. Move to next card

---

# ═══════════════════════════════════════════
# OPENING PROMPT — Paste at start of EVERY session
# ═══════════════════════════════════════════

```
You are a senior full-stack engineer on the quiz-platform monorepo.

REAL package names (use these, not blueprint names):
  @quiz/auth, @quiz/events, @quiz/db-tutorial, @quiz/types

REAL app locations:
  apps/realtutorialhub-web  → learner frontend
  apps/admin-app            → admin frontend
  apps/api-server           → DO NOT TOUCH (Exam Engine)
  apps/web-app              → DO NOT TOUCH (Exam Engine)

DO NOT modify: apps/api-server, apps/web-app (Exam Engine — 1167 tests passing)

FAANG rules — apply to EVERYTHING you build:
  1. Repository pattern — all DB access via Repository classes
  2. Constructor DI — no static methods
  3. Pino structured logging — no console.log
  4. Zod validation on all API inputs → 400 on failure
  5. db.transaction() on ALL multi-step DB writes
  6. withTimeout() on ALL DB queries (15s reads, 30s reports)
  7. Soft deletes only — deleted_at column, never hard DELETE
  8. 90%+ test coverage on all new code
  9. Typed DTOs — never return raw DB rows
  10. QStash idempotency — check key before processing any worker
  11. Rate limiting on all public endpoints
  12. Cache-Control headers on all read-only endpoints

Quality gate before every commit:
  pnpm lint → zero errors
  pnpm typecheck:all → zero errors
  pnpm test → zero failures, 1167+ passing
  pnpm build:all → all apps build

Current task: [THE STEP PROMPT BELOW REPLACES THIS LINE]
```

---

# ═══════════════════════════════════════════
# STEP 1 — PRE-3: db.transaction() verification
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- TUTORIAL-ENGINE-PHASE-GUIDE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

## STEP PROMPT
```
Current task: PRE-3 — Verify and add db.transaction() to multi-step writes.

STEP 1: Audit first — no changes yet
Run: grep -r "db.transaction" apps/realtutorialhub-web apps/admin-app
Report: how many hits and in which files.

STEP 2: Fix missing transactions
If fewer than 3 hits found, wrap these locations:

Location 1:
  apps/admin-app/src/app/api/tutorial/content/[id]/publish/route.ts
  Wrap in db.transaction():
    → set is_published = true
    → increment version
    → call revalidateTag AFTER transaction commits (not inside)

Location 2:
  Any route that writes to subtopic_flow_progress
  Wrap in db.transaction():
    → update flow progress
    → publish tutorial.subtopic_completed event
    → if event publish fails → transaction rolls back

Location 3:
  Content upsert routes (POST and PATCH)
  Wrap in db.transaction():
    → insert/update content
    → increment version atomically

Pattern to use:
  await db.transaction(async (tx) => {
    // all writes here
  })

Log all transaction failures:
  logger.error({
    event: 'transaction_failed',
    operation: '<operation name>',
    error: err.message,
    context: { userId, subtopicId }
  })

Global rule going forward:
  NEVER introduce new multi-step DB writes without db.transaction()
  Single-write operations do NOT need transactions

STEP 3: Add rollback tests
For each wrapped transaction, add one test:
  → Simulate failure on second write
  → Confirm first write was rolled back
  → Confirm data is in original state

STEP 4: Verification
grep -r "db.transaction" apps/realtutorialhub-web apps/admin-app
Must show ≥ 3 hits.
pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "fix(tutorial): PRE-3 — db.transaction on multi-step writes"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 2 — PRE-2: Missing schema files
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- TUTORIAL-ENGINE-PHASE-GUIDE.md
- PHASE-T4-PROJECT-ENGINE.md
```

## STEP PROMPT
```
Current task: PRE-2 — Create missing schema files.

STEP 1: Check if files already exist
Check:
  packages/db-tutorial/src/schema/certificates.ts
  packages/db-tutorial/src/schema/student-streaks.ts
Report: exists or missing.

STEP 2: Create if missing

FILE 1: packages/db-tutorial/src/schema/certificates.ts
Table: certificates
Columns:
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           UUID NOT NULL
  scope             TEXT NOT NULL CHECK (scope IN ('topic','subject','domain'))
  parent_id         UUID NOT NULL
  parent_name       TEXT NOT NULL
  verification_code TEXT NOT NULL UNIQUE
  pdf_url           TEXT
  issued_at         TIMESTAMPTZ DEFAULT now()
  expires_at        TIMESTAMPTZ
  deleted_at        TIMESTAMPTZ
  version           INTEGER DEFAULT 1
Indexes:
  idx_certificates_user ON certificates(user_id)
  idx_certificates_verify ON certificates(verification_code)

FILE 2: packages/db-tutorial/src/schema/student-streaks.ts
Table: student_streaks
Columns:
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL UNIQUE
  current_streak  INTEGER DEFAULT 0
  longest_streak  INTEGER DEFAULT 0
  last_activity   DATE
  total_xp        INTEGER DEFAULT 0
  level           TEXT DEFAULT 'bronze'
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
  deleted_at      TIMESTAMPTZ

Export both from packages/db-tutorial/src/schema/index.ts
Generate migration: pnpm drizzle-kit generate
Run migration: pnpm --filter @quiz/db-tutorial db:migrate
Verify both tables visible in Neon tutorial_prod.

pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
Commit: "feat(tutorial): PRE-2 — certificates and student-streaks schema"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 3 — T3-A-02: Assignment Session State Machine
# ═══════════════════════════════════════════

⚠️ NOTE: Assignment design changed before this step was implemented.
Assignments are practice only — no scoring.
The Step 3 prompt below reflects the UPDATED design.
PHASE-T3-ASSIGNMENT-ENGINE.md has been updated accordingly.

## UPLOAD THESE FILES
```
- PHASE-T3-ASSIGNMENT-ENGINE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- TUTORIAL-ENGINE-EXECUTION-PLAN.md
```

## STEP PROMPT
```
Current task: T3-A-02 — Assignment session state machine.
Read PHASE-T3-ASSIGNMENT-ENGINE.md completely before writing any code.

━━━ PART 1: DB SCHEMA ━━━

Add 3 tables to packages/db-tutorial/src/schema/
(check if any already exist before creating):

assignment-sessions.ts:
  id, user_id, subtopic_id
  difficulty: TEXT CHECK IN ('simple','mixed','intermediate','expert')
  idempotency_key: TEXT UNIQUE
  status: TEXT DEFAULT 'created'
    CHECK IN ('created','active','submitted','scoring','completed','failed')
  started_at, submitted_at, time_limit_sec
  score DECIMAL(5,2), passed BOOLEAN
  deleted_at, version INTEGER DEFAULT 1, created_at

assignment-answers.ts:
  id, session_id (FK → assignment_sessions.id)
  assignment_id (FK → tutorial_assignments.id)
  answer JSONB, is_correct BOOLEAN, score DECIMAL(5,2)
  answered_at, deleted_at

assignment-tier-unlocks.ts:
  id, user_id, subtopic_id, difficulty
  unlocked_at TIMESTAMPTZ DEFAULT now(), deleted_at
  UNIQUE(user_id, subtopic_id, difficulty)

Export all 3 from schema index.
Generate + run migration. Verify tables in Neon.

━━━ PART 2: TYPED ERROR ━━━

Add to packages/types/src/assignment-errors.ts:
  export class AssignmentTransitionError extends Error {
    constructor(from: string, to: string, sessionId: string) {
      super(`Invalid transition from '${from}' to '${to}' for session ${sessionId}`)
      this.name = 'AssignmentTransitionError'
    }
  }

━━━ PART 3: REPOSITORY ━━━

Append IAssignmentRepository interface to:
  packages/types/src/tutorial-repositories.types.ts

Create: packages/db-tutorial/src/repositories/assignment.repository.ts
  implements IAssignmentRepository
  Constructor injection of db client
  All methods wrapped in withTimeout()
  All methods filter deleted_at IS NULL
  All methods return DTOs not raw rows

Methods:
  findSession(id)
  findSessionByIdempotencyKey(key)
  createSession(data)
  updateSessionStatus(id, status, extra?)
  createAnswer(data)
  updateAnswer(id, data)
  getSessionAnswers(sessionId)
  createTierUnlock(userId, subtopicId, difficulty)
  getTierUnlocks(userId, subtopicId)

━━━ PART 4: SERVICE ━━━

Create: apps/realtutorialhub-web/src/server/assignment.service.ts

State machine rules:
  CREATED → ACTIVE → SUBMITTED → SCORING → COMPLETED
                                          → FAILED
  Cannot submit if status ≠ 'active'
  Cannot answer if timer expired
  Double-submit blocked via idempotency_key

Methods:
  startSession(userId, subtopicId, difficulty, idempotencyKey)
    → Check idempotencyKey first — return existing if found
    → Create new session if not found
    → Wrap in db.transaction()

  submitAnswer(sessionId, assignmentId, answer)
    → Simple/Mixed: score immediately, return { isCorrect, score }
    → Intermediate/Expert: queue QStash scoring, return { isCorrect: null, score: null }

  completeSession(sessionId)
    → Mark status = 'submitted'
    → Enqueue QStash: score-assignment-session
    → Return 202 immediately

  checkTierUnlock(userId, subtopicId, completedDifficulty)
    → Simple completed ≥ 60% → unlock Mixed
    → Mixed completed ≥ 65% → unlock Intermediate
    → Intermediate completed ≥ 70% → unlock Expert

  getTierStatus(userId, subtopicId)

━━━ PART 5: QSTASH WORKERS ━━━

Create:
  apps/realtutorialhub-web/src/app/api/workers/
  score-assignment-session/route.ts

  → Verify QStash signature
  → Load session + all answers
  → MCQ: score immediately
  → short_answer/code: use rubric evaluation
  → Calculate total score + passed flag
  → Update session: status='completed', score, passed
  → Wrap in db.transaction()
  → Call checkTierUnlock
  → Publish assignment.completed event

Create:
  apps/realtutorialhub-web/src/app/api/workers/
  ai-score-answer/route.ts

  → For Intermediate/Expert answers
  → Evaluate against rubric (no Anthropic — use pattern matching)
  → Update assignment_answers.score
  → If last answer in session → trigger session completion

━━━ PART 6: API ROUTES ━━━

POST /api/tutorial/assignments/start
  Body: { subtopicId, difficulty, idempotencyKey }
  → Auth required
  → Zod validation
  → Call AssignmentService.startSession()

POST /api/tutorial/assignments/[sessionId]/answer
  Body: { assignmentId, answer }
  → Auth required
  → Zod validation
  → Call AssignmentService.submitAnswer()

POST /api/tutorial/assignments/[sessionId]/complete
  → Auth required
  → Call AssignmentService.completeSession()
  → Returns 202

━━━ PART 7: TESTS ━━━
90%+ coverage on:
  assignment.repository.ts
  assignment.service.ts
  All 3 API routes
  Both QStash workers

Key test cases:
  □ startSession idempotent (same key → same session returned)
  □ Cannot submit if status ≠ 'active'
  □ Simple MCQ scores immediately
  □ Expert answer queues QStash (returns null score)
  □ Mixed tier locked until Simple ≥ 60%
  □ Timer expiry marks session submitted
  □ Transaction rollback on scoring failure

━━━ VERIFICATION ━━━
pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(tutorial): T3-A-02 — assignment session state machine"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 4 — T3-B: Wire Assignment UI to Backend
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- PHASE-T3-ASSIGNMENT-ENGINE.md
- tutorial-subtopic-page.prompt.md
```

## STEP PROMPT
```
Current task: T3-B — Wire assignment UI to real backend.
No new UI design. Connect existing UI components to AssignmentService.

STEP 1: Update LearnerProgressPanel
File: apps/realtutorialhub-web/src/components/content/LearnerProgressPanel.tsx

Connect to real data:
  → Load tier status via GET /api/tutorial/assignments/tier-status?subtopicId=X
  → Show real unlock status for Simple/Mixed/Intermediate/Expert
  → Show real score for completed tiers
  → Show locked state for tiers not yet unlocked

STEP 2: Wire assignment start button
When student clicks "Start Assignment":
  → Generate idempotency key: crypto.randomUUID()
  → POST /api/tutorial/assignments/start
  → Navigate to assignment session page

STEP 3: Wire answer submission
During assignment session:
  → POST /api/tutorial/assignments/[sessionId]/answer per question
  → Show immediate feedback for MCQ/fill-in-blank
  → Show "Under Review" for Intermediate/Expert answers

STEP 4: Wire session completion
When student submits all answers:
  → POST /api/tutorial/assignments/[sessionId]/complete
  → Show "Submitted — calculating score" state
  → Poll GET /api/tutorial/assignments/[sessionId]/status every 5s
  → When status = 'completed' → show score + next tier unlock status

STEP 5: Add tier status API route
GET /api/tutorial/assignments/tier-status
  Query: subtopicId
  Returns: { simple: {unlocked, score, passed}, mixed: {...}, ... }

Tests:
  → LearnerProgressPanel renders with real tier data
  → Start button calls correct API
  → Completion polling works

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
Commit: "feat(tutorial): T3-B — assignment UI wired to backend"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 5 — T4: Project Engine + Certificates
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- PHASE-T4-PROJECT-ENGINE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

## STEP PROMPT
```
Current task: T4 — Project engine, badges, certificates.
Read PHASE-T4-PROJECT-ENGINE.md completely before writing any code.

━━━ PART 1: DB SCHEMA ━━━

Check existing schema files in packages/db-tutorial/src/schema/
Add any missing tables:

tutorial-projects.ts (check if exists):
  id, subtopic_id, subject_id, domain_id
  scope: TEXT CHECK IN ('topic','subject','domain')
  level: TEXT CHECK IN ('simple','intermediate','expert')
  evaluation_type: TEXT CHECK IN ('auto','ai_review','peer_review','admin')
  title, description, rubric JSONB
  deleted_at, version

tutorial-project-submissions.ts (check if exists):
  id, user_id, project_id
  status: TEXT CHECK IN ('draft','submitted','ai_reviewing','peer_review',
    'approved','rejected','revision_needed','badge_awarded')
  deliverable JSONB, ai_review JSONB
  total_score DECIMAL(5,2), reviewer_id UUID
  submitted_at, reviewed_at, deleted_at, version

badges.ts (check if exists):
  id, name, description, scope, criteria JSONB
  image_url, deleted_at

student-badges.ts (check if exists):
  id, user_id, badge_id, awarded_at, deleted_at
  UNIQUE(user_id, badge_id)

Certificates table already created in Step 2 — do not recreate.

Generate + run migration for any new tables.

━━━ PART 2: STRATEGY PATTERN ━━━

Create: apps/realtutorialhub-web/src/server/evaluators/

IProjectEvaluator interface:
  evaluate(submission, rubric): Promise<EvaluationResult>

AutoEvaluator implements IProjectEvaluator
  → Checks code against test suite
  → Returns score 0-100

AIReviewEvaluator implements IProjectEvaluator
  → Evaluates against rubric (pattern matching, not Anthropic)
  → Returns score 0-100 with feedback

EvaluatorFactory:
  create(evaluationType): IProjectEvaluator
  → Never switch/case — use map

━━━ PART 3: PROJECT SERVICE ━━━

Create: apps/realtutorialhub-web/src/server/project.service.ts

Methods:
  getProject(projectId, userId)
  submitProject(userId, projectId, deliverable)
    → Save as DRAFT
    → Enqueue QStash: review-project
    → Return 202 immediately
  getSubmission(submissionId)
  getMyProjects(userId)

━━━ PART 4: QSTASH WORKERS ━━━

POST /api/workers/review-project
  → Verify QStash signature
  → Load rubric from tutorial_projects
  → Use EvaluatorFactory.create(evaluation_type)
  → Score submission
  → If score ≥ 70 AND type = 'auto' → APPROVED
  → If type = 'peer_review' → move to PEER_REVIEW
  → Publish project.ai_reviewed event
  → Wrap in db.transaction()

POST /api/workers/award-project-badge
  → Verify QStash signature
  → Check badge criteria
  → Insert into student_badges (idempotency: UNIQUE constraint)
  → Publish badge.awarded event
  → Check certificate eligibility
  → Wrap in db.transaction()

POST /api/workers/check-certificate-eligibility
  → Verify QStash signature
  → Topic cert: all subtopics completed + simple project approved
  → Subject cert: all topics + intermediate project approved
  → Domain cert: all subjects + expert project approved by admin
  → If eligible: insert into certificates
  → Generate verificationCode: crypto.randomUUID()
  → Wrap in db.transaction()

━━━ PART 5: PUBLIC CERTIFICATE VERIFICATION ━━━

GET /api/certificates/verify/[verificationCode]
  → Public route — no auth required
  → Returns: { studentName, courseName, issuedDate, scope }
  → Cache-Control: public, max-age=86400
  → Returns 404 if not found

━━━ PART 6: API ROUTES ━━━

POST /api/tutorial/projects/[projectId]/submit
  → Auth required, Zod validation
  → Returns 202 Accepted

GET /api/tutorial/projects/my-projects
  → Auth required
  → Returns list with status

GET /api/tutorial/projects/[submissionId]/status
  → Auth required
  → Used for polling after submission

━━━ PART 7: TESTS ━━━
90%+ coverage:
  EvaluatorFactory (strategy pattern)
  ProjectService
  All QStash workers
  Certificate eligibility check
  Public verification route

Key tests:
  □ submitProject returns 202, enqueues QStash
  □ EvaluatorFactory returns correct evaluator per type
  □ Badge awarded atomically with project approval
  □ Certificate not issued twice (UNIQUE constraint)
  □ Public verify route cached correctly

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(tutorial): T4 — project engine, badges, certificates"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 6 — T5: Video Integration
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- PHASE-T1-TUTORIAL-FOUNDATION.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

## STEP PROMPT
```
Current task: T5 — VideoBlock component with lazy load and accessibility.

━━━ PART 1: UPDATE CONTENT SCHEMA ━━━

Add optional video field to TutorialContentJSON in packages/types/:

video?: {
  url: string            // YouTube or Vimeo URL
  title: string
  caption: string | null
  platform: 'youtube' | 'vimeo'
}

Update TutorialContentSchema (Zod) with optional video validator:
  url: z.string().url()
  platform: z.enum(['youtube','vimeo'])

No DB migration needed — JSONB column already flexible.

━━━ PART 2: VIDEOBLOCK COMPONENT ━━━

Create: apps/realtutorialhub-web/src/components/content/VideoBlock.tsx
Server component — no 'use client'

Features:
  → Parse YouTube/Vimeo URL to embed URL
  → IntersectionObserver: iframe loads ONLY when visible
    → Show thumbnail + play button before intersection
    → Load iframe on intersection
  → Aspect ratio: 16:9 maintained on all screen sizes
    (padding-top: 56.25% trick or aspect-ratio: 16/9)
  → Accessibility:
    → aria-label on iframe: "Video: {title}"
    → title attribute on iframe: {title}
    → caption shown below video if present
  → Progressive enhancement:
    → Show thumbnail + link if JS disabled

━━━ PART 3: WIRE INTO BLOCKRENDERER ━━━

Update: apps/realtutorialhub-web/src/components/content/BlockRenderer.tsx
  → If content.video exists → render VideoBlock below the relevant block
  → VideoBlock is optional — blocks render without it if not present

━━━ PART 4: URL PARSING UTILITY ━━━

Create: apps/realtutorialhub-web/src/lib/video-url.ts

parseVideoUrl(url: string): { embedUrl: string; thumbnailUrl: string; platform: string } | null

YouTube:
  → Input: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
  → Embed: https://www.youtube.com/embed/VIDEO_ID
  → Thumbnail: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg

Vimeo:
  → Input: https://vimeo.com/VIDEO_ID
  → Embed: https://player.vimeo.com/video/VIDEO_ID
  → Thumbnail: fetch from Vimeo oEmbed API

━━━ PART 5: TESTS ━━━

Test VideoBlock:
  → Renders thumbnail before intersection
  → Loads iframe after intersection (mock IntersectionObserver)
  → aria-label present on iframe
  → caption renders when provided
  → Returns null when content.video is undefined

Test parseVideoUrl:
  → YouTube full URL → correct embed URL
  → YouTube short URL → correct embed URL
  → Vimeo URL → correct embed URL
  → Invalid URL → returns null

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
Commit: "feat(tutorial): T5 — VideoBlock, lazy load, accessibility"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 7 — T6: AI Tutor (Upstash Vector)
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- PHASE-T6-AI-TUTOR.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- WINDOW-2-TUTORIAL-ENGINE-GUIDE.md
```

## STEP PROMPT
```
Current task: T6 — AI Tutor using Upstash Vector only.

CRITICAL ARCHITECTURAL DECISION (LOCKED):
  AI Tutor uses Upstash Vector ONLY — no Anthropic API
  No streaming LLM responses
  Vector search returns pre-indexed content chunks
  Pre-generated qa_pairs serve instantly from JSON
  Do not add @anthropic-ai/sdk anywhere

STEP 1: Verify environment variables
Check .env.local for:
  UPSTASH_VECTOR_REST_URL
  UPSTASH_VECTOR_REST_TOKEN
Report if present or missing before writing code.

━━━ PART 1: INDEX WORKER ━━━

Create: apps/realtutorialhub-web/src/app/api/workers/
        index-content-vector/route.ts

Triggered by: content.approved_and_published QStash event

Worker:
  → Verify QStash signature
  → Validate payload: { subtopicId, difficulty, content }
  → Extract text from 5 indexable blocks:
      notes: content.notes.markdown
      layman: content.layman.simpleExplanation + ' ' + content.layman.analogyOrStory
      real_life: content.real_life.scenario
      technical: content.technical.markdown
      code: content.code.intro + ' ' + content.code.steps.join(' ')
  → Upsert each as separate vector chunk:
      id: '{subtopicId}:{difficulty}:{blockType}'
      data: extracted text
      metadata: { subtopicId, difficulty, blockType, subtopicName }
  → Use @upstash/vector Index client
  → withTimeout() on Vector calls (15s)
  → Return 200 on success, 500 for QStash retry

━━━ PART 2: QUERY ROUTE ━━━

Create: apps/realtutorialhub-web/src/app/api/ai-tutor/query/route.ts

POST /api/ai-tutor/query
Body: { subtopicId, question, difficulty }

  1. Auth check → 401 if no session
  2. Rate limit:
     Key: ai-tutor:{userId}:{subtopicId}:{currentHour}
     Limit: 10 questions per hour per student per subtopic
     Redis INCR + EXPIRE pattern
     Return 429 with message if exceeded
  3. Zod validate input
  4. Query Upstash Vector:
     filter: "subtopicId = '{subtopicId}'"
     topK: 3
     data: question
  5. Return:
     { chunks: [{ blockType, content, score }] }
     Empty array if no results (never 404)
  6. Pino log:
     { userId, subtopicId, questionLength, chunkCount, topScore }

━━━ PART 3: UPDATE EVENT CONSUMER MAP ━━━

In packages/events/src/consumer-map.ts:
Verify 'content.approved_and_published' maps to:
  /api/workers/index-content-vector

If not present, add it.

━━━ PART 4: TRIGGER INDEXING ON PUBLISH ━━━

In apps/admin-app/src/app/api/tutorial/content/[id]/publish/route.ts:
After successful publish → publish content.approved_and_published event
  Payload: { subtopicId, difficulty, content }
This triggers the Vector indexing worker via QStash.

━━━ PART 5: TESTS ━━━
90%+ coverage:

Index worker tests:
  → valid payload → upserts 5 chunks, returns 200
  → invalid signature → 401
  → malformed payload → 400
  → Vector upsert failure → 500, logs error
  → idempotent: same subtopicId → upsert replaces (not duplicates)

Query route tests:
  → valid question → returns top 3 chunks
  → no session → 401
  → rate limit: 11th request in hour → 429
  → no vector results → returns empty chunks array
  → invalid payload → 400

Rate limit tests:
  → 10 requests succeed
  → 11th returns 429
  → Different hour → counter resets

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(tutorial): T6 — AI Tutor Upstash Vector index and query"
Stop and report with:
  1. Env vars present or missing
  2. Vector chunks per subtopic count
  3. Rate limit key pattern used
  4. Test count and pass rate
```

---

# ═══════════════════════════════════════════
# STEP 8 — T7: Remediation Engine
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- PHASE-T5-REMEDIATION-ENGINE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

## STEP PROMPT
```
Current task: T7 — Remediation engine with Saga pattern.
Read PHASE-T5-REMEDIATION-ENGINE.md completely before writing code.

Note: T3-A-03 (exam.completed consumer) is already done — commit f496ebd0.
T7 builds ON TOP of that — do not re-implement T3-A-03.

━━━ PART 1: REMEDIATION SERVICE ━━━

Create: apps/realtutorialhub-web/src/server/remediation.service.ts

Methods:
  createPlan(userId, examResultId, weakSubtopics)
    → Check if plan already exists for examResultId (idempotent)
    → For each weak subtopic: check existing progress
    → Build recommendations (start from layman if not started,
      or last visited step if partially done)
    → Save to remediation_triggers
    → Wrap in db.transaction()

  getPlan(userId, examResultId)
    → Returns plan with recommended subtopics and start points

  markSubtopicRemediated(userId, subtopicId)
    → Mark as resolved in remediation_triggers

  getStudentRemediationHistory(userId)
    → Returns all past remediation plans

━━━ PART 2: MATERIALIZED VIEW ━━━

Create migration for materialized view:
  packages/db-tutorial/migrations/000X_mv_student_weak_areas.sql

  CREATE MATERIALIZED VIEW mv_student_weak_areas AS
  SELECT
    rt.user_id,
    unnest(rt.weak_subtopic_ids) AS subtopic_id,
    COUNT(*) AS remediation_count,
    MAX(rt.created_at) AS last_triggered_at
  FROM remediation_triggers rt
  WHERE rt.deleted_at IS NULL
  GROUP BY rt.user_id, unnest(rt.weak_subtopic_ids);

  CREATE UNIQUE INDEX ON mv_student_weak_areas(user_id, subtopic_id);

Add refresh worker:
  POST /api/workers/refresh-weak-areas-view
  → Triggered by exam.completed event
  → REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_weak_areas
  → Filter: only for the specific userId

━━━ PART 3: SAGA PATTERN ━━━

ExamCompletedSaga (in remediation.service.ts):
  Step 1: Create remediation_triggers (T3-A-03 already does this ✓)
  Step 2: Refresh mv_student_weak_areas for this user
  Step 3: Send notification email with weak subtopic links

Compensation actions:
  If Step 2 fails → log error, mark remediation status = 'view_refresh_failed'
    → Retry via QStash (3 times max)
  If Step 3 fails → mark status = 'notification_failed'
    → Retry via QStash (3 times max)
  If 3 retries fail → dead letter:
    logger.error({ event: 'remediation_saga_dead_letter', userId, examResultId })

━━━ PART 4: REMEDIATION PAGE DATA API ━━━

GET /api/remediation/[examResultId]
  → Auth required
  → Returns:
    {
      examResultId,
      weakSubtopics: [{ subtopicId, name, score, startFromBlock, priority }],
      completedSubtopics: [subtopicId, ...],
      overallProgress: percentage
    }
  → Loads from remediation_triggers (not materialized view — view is for analytics)

━━━ PART 5: UPDATE T3-A-03 WORKER ━━━

Update: apps/realtutorialhub-web/src/app/api/workers/handle-exam-completed/route.ts
After creating remediation_triggers, also enqueue:
  → refresh-weak-areas-view worker
  → send-remediation-notification worker

━━━ PART 6: TESTS ━━━
90%+ coverage:
  RemediationService
  Saga compensation paths
  Materialized view refresh worker
  Remediation page data API

Key tests:
  □ createPlan idempotent (same examResultId → same plan)
  □ Saga Step 2 failure → compensation logged
  □ Saga Step 3 failure → 3 retries → dead letter
  □ View refresh triggers after exam.completed
  □ getPlan returns correct subtopics with start points

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(tutorial): T7 — remediation engine, saga, materialized view"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 9 — T8: Admin Content Management
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- TUTORIAL-ENGINE-PHASE-GUIDE.md (T8 section)
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- tutorial-subtopic-page.prompt.md (Prompts 15-19)
- content-json-schema.md
```

## STEP PROMPT
```
Current task: T8 — Admin content management, versioning, audit, SEO.

━━━ PART 1: TUTORIAL PROMPT SERVICE ━━━

Create: apps/admin-app/src/server/tutorial-prompt.service.ts

TutorialPromptService (Question Bank Factory pattern):
  generatePrompt(domain, subject, topic, subtopic, difficulty)
    → Embeds full content-json-schema.md structure into prompt
    → Specifies word counts per block
    → Specifies format requirements
    → Admin copies this prompt → pastes in external AI → gets JSON back

  No AI API calls. This service generates the PROMPT TEXT only.
  Admin pastes the result back into the GUI.

━━━ PART 2: CONTENT VERSIONING SERVICE ━━━

Create: apps/realtutorialhub-web/src/server/content-version.service.ts

DB table: tutorial_content_versions
  id, subtopic_id, difficulty, version_number
  content JSONB (snapshot), changed_by UUID
  created_at, note TEXT

TutorialContentVersionService:
  createSnapshot(subtopicId, difficulty, content, changedBy, note?)
    → Called inside db.transaction() during publish
  getHistory(subtopicId, difficulty)
    → Returns all versions desc
  restore(subtopicId, difficulty, versionNumber, restoredBy)
    → Creates new draft with snapshot content
    → Creates new version entry with note 'restored from v{N}'

Generate + run migration for tutorial_content_versions table.

━━━ PART 3: AUDIT TRAIL ━━━

Create: apps/admin-app/src/server/audit.service.ts

DB table: tutorial_audit_trail
  id, actor_id UUID, action TEXT
  entity_type TEXT, entity_id UUID
  before_data JSONB, after_data JSONB
  created_at

AuditService.log(actorId, action, entityType, entityId, before?, after?)

Add audit logging to every TutorialContentRepository write:
  create → log 'content.created'
  update → log 'content.updated' with before/after version
  publish → log 'content.published'
  restore → log 'content.restored'

━━━ PART 4: SEO ━━━

Add to apps/realtutorialhub-web subtopic pages:

generateMetadata in page.tsx:
  title: "{Subtopic Name} — {Topic Name} | RealTutorialHub"
  description: first 160 chars of layman.simpleExplanation
  openGraph: { title, description, type: 'article' }
  JSON-LD: LearningResource schema

Add sitemap.ts:
  apps/realtutorialhub-web/src/app/sitemap.ts
  → Query all published subtopics
  → Return sitemap entries with lastModified
  → Cache: ISR revalidate 3600

━━━ PART 5: IMAGE UPLOAD PIPELINE ━━━

Run migration: packages/db-tutorial/migrations/0001_image_support.sql
(already written — just run it if not already done)

Add API routes:
  POST /api/tutorial/images/presigned-url
    Body: { subtopicId, blockType, filename, mimeType }
    → Auth + admin role required
    → Validate mimeType: only PNG/JPG/WebP
    → Generate R2 presigned URL using:
        R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT
    → Return { uploadUrl, cdnUrl, r2Key }

  POST /api/tutorial/images/confirm
    Body: { subtopicId, blockType, r2Key, cdnUrl, altText, caption, position, widthPx }
    → Auth + admin role required
    → Save to tutorial_content_images table
    → Update content JSON image field

━━━ PART 6: SVG ILLUSTRATION LIBRARY ━━━

Create one SVG per domain (4 proof-of-concept SVGs):

apps/realtutorialhub-web/src/components/illustrations/
  full-stack/PromiseChainSVG.tsx     (already exists — verify)
  full-stack/AsyncAwaitFlowSVG.tsx   (already exists — verify)
  data-analyst/SqlJoinsAllSVG.tsx    (NEW — venn diagram for all 4 joins)
  data-science/LinearRegressionSVG.tsx (NEW — best fit line scatter plot)
  data-engineering/EtlPipelineSVG.tsx  (NEW — extract/transform/load flow)

Each SVG:
  → Accepts { width?: number } prop
  → Uses viewBox not fixed dimensions
  → aria-label for accessibility
  → Uses CSS variables for colors (theme-aware)
  → Under 8KB

━━━ PART 7: TESTS ━━━
90%+ coverage:
  TutorialPromptService (generates valid prompt)
  TutorialContentVersionService
  AuditService
  Presigned URL route
  Image confirm route

Key tests:
  □ generatePrompt embeds correct schema fields
  □ createSnapshot stores correct JSON
  □ restore creates new draft from snapshot
  □ Every publish creates audit trail entry
  □ Presigned URL rejects non-image MIME types
  □ Admin audit log viewer returns correct entries

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(tutorial): T8 — prompt service, versioning, audit, SEO, images"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 10 — Deploy Tutorial Service to GCP
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- GATEWAY-RTH-WEB-EXECUTION-PLAN.md
- MASTER-PLATFORM-ARCHITECTURE.md
```

## STEP PROMPT
```
Current task: Deploy apps/realtutorialhub-web to GCP Cloud Run.

STEP 1: Add Dockerfile
File: apps/realtutorialhub-web/Dockerfile

Use same multi-stage Next.js pattern as existing apps/web-app/Dockerfile:
  Stage 1: deps — install dependencies
  Stage 2: builder — build Next.js app
  Stage 3: runner — production image
  EXPOSE 3000
  USER nextjs

STEP 2: Add health check route
File: apps/realtutorialhub-web/src/app/api/healthz/route.ts
  GET /api/healthz → { status: 'ok', service: 'realtutorialhub-web', ts: Date.now() }

STEP 3: Create GitHub Actions workflow
File: .github/workflows/deploy-realtutorialhub-web.yml

Trigger:
  push to main
  paths: apps/realtutorialhub-web/** or packages/**

Steps:
  1. Checkout + pnpm install
  2. pnpm build:all (ensure everything builds)
  3. Build Docker image
  4. Push to GCP Artifact Registry
  5. Deploy to Cloud Run:
     Service: realtutorialhub-web
     Region: asia-south1
     Memory: 512Mi
     CPU: 1
  6. Smoke test: curl {CLOUD_RUN_URL}/api/healthz → 200

STEP 4: Set environment variables in GCP Cloud Run
Add these secrets from GCP Secret Manager:
  DATABASE_URL_TUTORIAL
  DATABASE_DIRECT_URL_TUTORIAL
  UPSTASH_VECTOR_REST_URL
  UPSTASH_VECTOR_REST_TOKEN
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  QSTASH_TOKEN
  QSTASH_CURRENT_SIGNING_KEY
  QSTASH_NEXT_SIGNING_KEY
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET
  R2_ENDPOINT
  STORAGE_PROVIDER=r2
  NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com

STEP 5: Verify deployment
  □ GET {CLOUD_RUN_URL}/api/healthz → 200
  □ Tutorial content page loads from Neon DB
  □ pnpm test → 1167+ passing
  □ No regression in existing apps

WINDOW 2 BACKEND IS COMPLETE when:
  □ All T3-T8 commits verified clean
  □ GCP Cloud Run URL responds with 200
  □ /api/healthz returns 200
  □ Vector indexing works (index and query)
  □ Assignment sessions can be created
  □ All Neon tables exist

Commit: "feat(tutorial): deploy — GCP Cloud Run, Dockerfile, GitHub Actions"
Stop and report the Cloud Run URL.
```

---

# ═══════════════════════════════════════════
# STEP 11 — Window 3 Phase A: SkillHubCore
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- MASTER-PLATFORM-ARCHITECTURE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- ADR-CRITICAL-001-integration-architecture.md
```

## STEP PROMPT
```
Current task: Window 3 Phase A — SkillHubCore service.

SkillHubCore is the platform brain:
  SSO (single sign-on across all brands)
  Subscription management
  JWT issuance used by ALL services

IMPORTANT: Before starting this session, confirm:
  □ Window 2 backend complete (all T3-T8 committed)
  □ apps/realtutorialhub-web deployed to GCP

━━━ PART 1: SCAFFOLD ━━━

Create: apps/skillhubcore-service/ (or as per MASTER-PLATFORM-ARCHITECTURE.md)

Package: @quiz/skillhubcore-service
Tech: Next.js 15 + Hono API routes
DB: Neon — DATABASE_URL_PEOPLE + DATABASE_DIRECT_URL_PEOPLE

packages/db-people/src/schema/:
  users.ts:
    id, email UNIQUE, password_hash, role
    platform: TEXT CHECK IN ('realtutorialhub','skillup','admin')
    deleted_at, version, created_at

  subscriptions.ts:
    id, user_id FK, plan_type, status
    features JSONB, started_at, expires_at
    deleted_at

  sso-sessions.ts:
    id, user_id FK, jwt_family TEXT, revoked_at
    platform, deleted_at, created_at

FAANG rules:
  → statement_timeout: 30000 on db pool
  → deleted_at on all tables (soft deletes)
  → Export dbReadOnly for analytics queries

━━━ PART 2: AUTH CORE ━━━

DI Container:
  DIContainer.register('TokenService', TokenService)
  DIContainer.register('PasswordService', PasswordService)
  DIContainer.register('AuthService', AuthService)

Repository pattern:
  IUserRepository interface in packages/types
  DrizzleUserRepository implements IUserRepository
  AuthService depends on IUserRepository (not concrete)

Auth routes:
  POST /auth/register → create user + issue JWT
  POST /auth/login → verify password + issue JWT
  POST /auth/refresh → rotate JWT (atomic transaction)
  POST /auth/logout → revoke session

JWT:
  Uses same JWT_SECRET as API Gateway
  Payload: { sub: userId, roles: ['student'|'admin'], platform, exp }
  Access token: 15 min
  Refresh token: 7 days

Rate limiting:
  POST /auth/login: 5 attempts/min per IP
  POST /auth/register: 10/hour per IP
  Brute force: 10 failed logins → 1hr lockout + log alert

━━━ PART 3: SUBSCRIPTION ENGINE ━━━

SubscriptionService:
  hasFeature(userId, feature): boolean
    → Check Redis cache first: subscription:{userId}
    → Fall back to DB if cache miss
    → Cache result for 5 minutes

  getCurrentSubscription(userId): SubscriptionDTO
  upgradePlan(userId, planType): void
  cancelSubscription(userId): void

Features per plan (stored in subscriptions.features JSONB):
  free: ['tutorial_basic', 'quiz_basic']
  pro: ['tutorial_basic', 'tutorial_ai_tutor', 'quiz_basic', 'quiz_advanced']
  enterprise: all features

━━━ PART 4: AUDIT TRAIL ━━━

auth_audit_log table:
  id, actor_id, action, platform, ip
  success BOOLEAN, metadata JSONB, created_at

Log every: login, logout, refresh, register, plan_change
PII: never log password or full token

━━━ PART 5: DEPLOY ━━━

Add Dockerfile to apps/skillhubcore-service/
Create .github/workflows/deploy-skillhubcore.yml
Deploy to GCP Cloud Run asia-south1
Add DNS: api.skillhubcore.in → Cloud Run URL

━━━ PART 6: TESTS ━━━
90%+ coverage:
  AuthService (all paths)
  TokenService (sign, verify, expired, wrong secret)
  PasswordService (hash, compare, wrong)
  SubscriptionService (cache hit, cache miss, feature check)
  All auth routes

Key tests:
  □ 6th login attempt in 1 min → 429
  □ Token rotation is atomic (old revoked + new issued together)
  □ hasFeature checks Redis first
  □ Subscription cached for 5 minutes

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(skillhubcore): Phase A — auth, subscriptions, JWT, deployed"
Stop and report the Cloud Run URL for SkillHubCore.
```

---

# ═══════════════════════════════════════════
# STEP 12 — Window 3 Phase B: SSO Wiring
# (MANUAL RENAME FIRST — read carefully)
# ═══════════════════════════════════════════

## BEFORE THIS SESSION — DO MANUALLY:
```
1. Rename folders on disk:
   apps/web-app → apps/realtutorialhub-quiz
   apps/admin-app → apps/realtutorialhub-admin

2. Update pnpm-workspace.yaml:
   Change: apps/web-app → apps/realtutorialhub-quiz
   Change: apps/admin-app → apps/realtutorialhub-admin

3. Update package.json name fields:
   apps/realtutorialhub-quiz/package.json → name: "@quiz/realtutorialhub-quiz"
   apps/realtutorialhub-admin/package.json → name: "@quiz/realtutorialhub-admin"

4. Update GitHub Actions workflow files — change all folder path references

5. Run: pnpm test → must show 1167+ passing BEFORE opening agent session

6. Commit: "chore: rename web-app→realtutorialhub-quiz, admin-app→realtutorialhub-admin"

7. Push and verify GitHub Actions deploys both apps successfully from new paths.

ONLY AFTER CONFIRMED DEPLOY → open agent session with prompt below.
```

## UPLOAD THESE FILES
```
- MASTER-PLATFORM-ARCHITECTURE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

## STEP PROMPT
```
Current task: Window 3 Phase B — SSO wiring.

Folder rename already done manually before this session.
New names: apps/realtutorialhub-quiz, apps/realtutorialhub-admin

Wire SkillHubCore SSO into both apps:

━━━ PART 1: JWT MIDDLEWARE ━━━

Create shared JWT middleware in packages/auth:
  verifySkillHubCoreJWT(token): JWTPayload
  → Uses same JWT_SECRET as SkillHubCore
  → Returns: { sub, roles, platform, exp }
  → Throws if expired or invalid

━━━ PART 2: REALTUTORIALHUB-QUIZ SSO ━━━

Update apps/realtutorialhub-quiz login flow:
  → Login via POST /auth/login to SkillHubCore
  → Store JWT in httpOnly cookie
  → Refresh via POST /auth/refresh before expiry
  → Logout: DELETE cookie + POST /auth/logout

Update all protected routes in realtutorialhub-quiz:
  → Verify JWT on every request
  → Pass userId from JWT payload to service calls

━━━ PART 3: REALTUTORIALHUB-ADMIN SSO ━━━

Same pattern as quiz app.
Admin routes additionally verify role = 'admin' in JWT claims.

━━━ PART 4: CROSS-PLATFORM STUDENT JOURNEY ━━━

A SkillUp IT Academy student should be able to:
  1. Log in via SkillHubCore
  2. Access apps/realtutorialhub-web (tutorial notes)
  3. Access apps/realtutorialhub-quiz (exam engine)
  All with the SAME JWT

Verify: SkillUp student JWT accepted by realtutorialhub-web.

━━━ PART 5: TESTS ━━━
  □ Login returns JWT cookie
  □ Protected routes return 401 without cookie
  □ Expired JWT returns 401
  □ Admin route returns 403 for student role
  □ SkillUp JWT accepted by realtutorialhub-web

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(skillhubcore): Phase B — SSO wiring, cross-platform JWT"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 13 — Window 3 Phase C: SkillUp IT Academy
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- MASTER-PLATFORM-ARCHITECTURE.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- ADR-CRITICAL-001-integration-architecture.md
```

## STEP PROMPT
```
Current task: Window 3 Phase C — SkillUp IT Academy all 4 apps.

4 apps to build:
  skillup-web     → student-facing (live training platform)
  skillup-admin   → admin dashboard
  faculty-app     → faculty session management
  skillhubcore-admin → platform super-admin

FAANG compliance per app (from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md):

skillup-web:
  → Students: enroll, view batches, check attendance, view schedule
  → SSO: uses SkillHubCore JWT
  → PWA: manifest.json, offline page, service worker cache
  → SEO: generateMetadata on program pages
  → Accessibility: WCAG 2.1 AA

skillup-admin:
  → CRM: enquiries, admissions, counsellor assignment
  → AdmissionSaga: enquiry → qualify → admit → payment
  → Batch management: create batches, assign faculty
  → Audit trail UI: all student lifecycle changes
  → Role-based access: admin vs counsellor views

faculty-app:
  → Session management: view schedule, start session
  → Attendance marking: bulk INSERT (30 students, 1 DB call)
  → Offline support: cache batch list, queue marks if offline
  → Performance: attendance list renders < 100ms

skillhubcore-admin:
  → User management
  → Subscription management
  → Audit log viewer
  → Biometric guard on sensitive actions (TOTP)

Core shared services (in packages/db-people):
  StudentRepository
  BatchRepository
  AttendanceRepository
  FacultyRepository

Key events published:
  student.enrolled → tutorial-service, notification-service
  attendance.marked → batch aggregate refresh
  batch.subtopics_covered → tutorial-service marks progress
  payment.received → student-faculty-service activates enrollment

Each event via QStash — never direct HTTP calls between services.

FAANG rules for all 4 apps:
  → Repository pattern on all DB access
  → Saga pattern for AdmissionSaga
  → Materialized view: mv_batch_attendance_summary
  → Redis for batch capacity (atomic INCR)
  → 90%+ coverage on all services

pnpm lint → zero errors
pnpm typecheck:all → zero errors
pnpm test → 1167+ passing
pnpm build:all → all apps build
Commit: "feat(skillup): Phase C — all 4 SkillUp apps"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 14 — Window 3 Phase D: API Gateway
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- PHASE-INFRA-GATEWAY.md
- GATEWAY-RTH-WEB-EXECUTION-PLAN.md
- MASTER-PLATFORM-ARCHITECTURE.md
```

## STEP PROMPT
```
Current task: Window 3 Phase D — API Gateway on Cloudflare Workers.
Read PHASE-INFRA-GATEWAY.md completely before writing any code.

IMPORTANT DEPLOYMENT ORDER:
  1. Build + deploy gateway
  2. Test on workers.dev URL
  3. ONLY THEN update Cloudflare DNS
  Never update DNS before verifying gateway works.

━━━ PART 1: SCAFFOLD ━━━

Create: services/api-gateway/
Package: @quiz/api-gateway (fix @platform/api-gateway from blueprint)
Runtime: Hono on Cloudflare Workers (edge — NOT Node.js)
Use only edge-compatible libraries (jose for JWT — no Node crypto)

Structure:
  services/api-gateway/
    package.json
    wrangler.toml (copy from PHASE-INFRA-GATEWAY.md Part 6 exactly)
    tsconfig.json (target: ES2022)
    src/
      index.ts
      routes/routing-table.ts
      middleware/auth.ts
      middleware/rate-limit.ts
      middleware/cors.ts
      middleware/request-id.ts
      lib/proxy.ts

Add to turbo.json and pnpm-workspace.yaml.

━━━ PART 2: ROUTING TABLE ━━━

Copy ROUTING_TABLE from PHASE-INFRA-GATEWAY.md Part 2 EXACTLY.
Fix package names: @platform/* → @quiz/*
Service URLs from environment variables.

━━━ PART 3: GATEWAY IMPLEMENTATION ━━━

Implement from PHASE-INFRA-GATEWAY.md Part 3:
  → cors() with exact allowed origins
  → X-Request-ID injection
  → Rate limiting: Upstash Ratelimit slidingWindow(100, '1 m')
  → JWT verify using jose (edge-compatible)
  → proxyRequest() forwarding X-Gateway-Secret header
  → Route registration from routing-table.ts
  → GET /healthz → { status: 'ok', ts: Date.now() }

━━━ PART 4: GATEWAY SECRET VERIFICATION ━━━

Update ALL GCP services to verify X-Gateway-Secret:
  apps/realtutorialhub-web: add middleware
    if X-Gateway-Secret !== INTERNAL_GATEWAY_SECRET → 403
  apps/realtutorialhub-quiz: same
  apps/skillhubcore-service: same
  (Do NOT touch apps/api-server internals — add gateway check at route level only)

━━━ PART 5: DEPLOY ━━━

Create: .github/workflows/deploy-gateway.yml
  Trigger: push to main, paths: services/api-gateway/**
  Steps:
    npx wrangler deploy --env production
    Smoke test: curl https://api.realtutorialhub.com/healthz → 200

Environment variables (set in Cloudflare dashboard secrets):
  JWT_SECRET
  INTERNAL_GATEWAY_SECRET
  UPSTASH_REDIS_URL
  UPSTASH_REDIS_TOKEN
  SKILLHUBCORE_URL (SkillHubCore Cloud Run URL)
  TUTORIAL_SERVICE_URL (realtutorialhub-web Cloud Run URL)
  EXAM_SERVICE_URL (api-server Cloud Run URL)

━━━ PART 6: DNS UPDATE (do last) ━━━

After gateway verified on workers.dev:
  api.realtutorialhub.com → Cloudflare Worker
  api.skillhubcore.in → Cloudflare Worker

━━━ VERIFICATION ━━━
  □ GET /healthz → 200 (Cloudflare Worker)
  □ No JWT → 401 on protected routes
  □ Valid JWT → proxied to upstream correctly
  □ 101 requests in 1 min → 429
  □ Direct GCP URL without X-Gateway-Secret → 403
  □ Existing exam flow still works after DNS change
  □ pnpm test → 1167+ passing

WINDOW 3 BACKEND IS COMPLETE when all above verified.

Commit: "feat(infra): API Gateway — Hono on Cloudflare Workers, DNS live"
Stop and report.
```

---

# ═══════════════════════════════════════════
# STEP 15 — RTH-1: Full Frontend Polish
# (START ONLY AFTER STEPS 1-14 VERIFIED)
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- tutorial-subtopic-page.prompt.md (Prompts 1-19)
- GATEWAY-RTH-WEB-EXECUTION-PLAN.md
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

## STEP PROMPT
```
Current task: RTH-1 — Full frontend polish for apps/realtutorialhub-web.

PREREQUISITE CHECK — confirm before starting:
  □ All Window 2 backend (T3-T8) committed and verified
  □ All Window 3 backend committed and verified
  □ API Gateway live and routing correctly
  □ notes.realtutorialhub.com accessible (DNS set in Step 10)

This phase polishes the already-scaffolded frontend to production quality.
Aesthetic Maverick design is LOCKED — do not change it.

━━━ RTH-1-A-01: PWA + i18n ━━━

PWA (install @serwist/next):
  → public/manifest.json:
      name: "RealTutorialHub"
      theme_color: "#185FA5"
      display: "standalone"
      icons: 192px + 512px
  → Offline page: "Learning is paused — reconnect to continue."
  → Service worker: cache last 5 subtopic content blocks
  → Install prompt: show after first subtopic completion

i18n (install next-intl):
  → Locales: en (default), hi (Hindi)
  → Locale switcher in TutorialNavbar
  → Extract ALL UI strings to messages/en.json and messages/hi.json
  → No hardcoded English strings in components

━━━ RTH-1-A-02: Subtopic page polish (USER-GATED STOP) ━━━

Add to all block components:
  → Error boundaries: wrap each block in ErrorBoundary
      fallback: <BlockErrorFallback blockName={name} />
      shows: "Unable to load [block name]. Try refreshing."

  → Loading skeletons (Suspense boundaries):
      Each block shows skeleton while content loads
      Skeleton matches the shape of real content
      Use CSS animation (no external library)

  → Focus management:
      When navigating to a block detail page → focus moves to H1
      When returning to master page → focus moves to last clicked card

  → Accessibility pass:
      Install @axe-core/react for dev mode scanning
      All images: alt text required
      Progress bar: role="progressbar" aria-valuenow aria-valuemin aria-valuemax
      Color contrast: all text ≥ 4.5:1 ratio
      All interactive elements: min 48x48px touch target

STOP — Show me full subtopic page with:
  □ All 6 blocks rendering with real content from Neon
  □ Error boundary visible (trigger one to show fallback)
  □ Loading skeleton visible (simulate slow load)
  □ Aesthetic Maverick glassmorphism intact
  □ Theme toggle working (all 6 themes)
  □ SVG placeholders rendering

━━━ RTH-1-A-03: Block component tests ━━━

Write test files:
  apps/realtutorialhub-web/src/components/content/__tests__/
    NotesBlock.test.tsx
    LaymanBlock.test.tsx
    RealLifeBlock.test.tsx
    TechnicalBlock.test.tsx
    CodeBlock.test.tsx
    AITutorBlock.test.tsx
    BlockRenderer.test.tsx

Each test covers:
  → Renders with mock TutorialContentJSON data
  → Handles null/empty content (no crash)
  → aria-label present
  → axe-core scan: zero violations (@axe-core/react)

Target: 90%+ coverage on all 7 files.

━━━ RTH-1-A-04: AI Tutor chat UI ━━━

Wire AITutorBlock to real Vector query API:
  → Pre-loaded qa_pairs display from content.ai_tutor.qa_pairs
  → Chat input → POST /api/ai-tutor/query
  → Display returned chunks as AI response
  → Rate limit feedback:
      429 → "You've used 10 questions this hour."
  → Typing indicator while waiting for response

━━━ RTH-1 DONE CHECKLIST ━━━
  □ pnpm test → all passing, coverage ≥ 90% on block components
  □ Lighthouse mobile ≥ 90 (Performance + Accessibility + SEO + PWA)
  □ axe-core: zero WCAG violations on subtopic page
  □ notes.realtutorialhub.com loads correctly
  □ PWA install prompt appears on mobile
  □ Hindi locale loads without errors
  □ All 6 blocks render with real content from Neon
  □ AI Tutor responds to questions via Vector search
  □ Theme toggle persists across page refreshes

Commit: "feat(tutorial): RTH-1 — PWA, i18n, a11y, block tests, chat wired"
Stop and report Lighthouse scores.
```

---

# ═══════════════════════════════════════════
# STEP 16 — SkillUp + Admin UI Polish
# ═══════════════════════════════════════════

## UPLOAD THESE FILES
```
- FAANG-COMPLIANCE-WINDOW2-WINDOW3.md (SKU-8 section)
- MASTER-PLATFORM-ARCHITECTURE.md
```

## STEP PROMPT
```
Current task: Step 16 — UI polish for all SkillUp and Admin apps.

Polish these 4 apps to production quality:
  apps/skillup-web
  apps/skillup-admin
  apps/realtutorialhub-admin (renamed from admin-app)
  apps/skillhubcore-admin
  apps/faculty-app

Per-app requirements from FAANG-COMPLIANCE-WINDOW2-WINDOW3.md SKU-8 section:

skillup-web:
  → SEO: generateMetadata on program/marketing pages
  → PWA: manifest name "SkillUp IT Academy", theme #0F6E56
  → Offline page for student dashboard
  → Accessibility: all forms have label/input associations
  → Session calendar: keyboard-navigable
  → Lighthouse mobile ≥ 85

skillup-admin:
  → Audit trail UI: activity log with filters
  → CSV export: attendance, fee reports, student lists
  → Role-based views: admin vs counsellor

faculty-app:
  → Offline attendance marking:
      Cache batch student list in service worker
      Queue marks locally if offline
      Sync when back online
  → Performance: attendance list of 30 students < 100ms
  → Virtualized list if batch > 50 students

realtutorialhub-admin:
  → Question Bank Factory pattern (already exists)
  → Tutorial content factory (T8 admin work)
  → Consistent design with Question Bank Factory

skillhubcore-admin:
  → User management table
  → Subscription management
  → Audit log viewer with expand/collapse
  → TOTP re-auth on sensitive actions

All apps:
  → axe-core: zero WCAG violations
  → pnpm test → 1167+ passing

Commit: "feat(ui): Step 16 — SkillUp + Admin apps UI polish"
Stop and report Lighthouse scores per app.
```

---

# ═══════════════════════════════════════════
# QUALITY GATE — Run after every step
# ═══════════════════════════════════════════

```
Mandatory before every commit:
  pnpm lint → zero errors
  pnpm typecheck:all → zero errors
  pnpm test → zero failures, 1167+ passing
  pnpm build:all → all apps build

Architecture checks (review manually):
  □ New service uses DI (not static methods)
  □ New DB access goes through repository
  □ New API route has Zod validation
  □ New API route has rate limiting
  □ New read-only route has Cache-Control header
  □ New worker has idempotency check
  □ New multi-step write uses db.transaction()
  □ New service method has structured Pino log
```

---

*Kit version: 1.0 | 16 steps | Window 2 backend → Window 3 backend → UI/UX*
*Architecture-first — UI polish only after all backend verified*
