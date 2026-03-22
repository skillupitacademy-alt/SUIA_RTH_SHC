# Tutorial Engine — Phase-by-Phase Execution Guide
## Based on codebase audit (2026-03-22) + all blueprint files

> READ THIS FIRST:
> The audit revealed the real package names differ from blueprints.
> Every prompt you paste into your agent must use these REAL names:
>
>   Blueprint said        →   Reality
>   @platform/auth        →   @quiz/auth
>   @platform/events      →   @quiz/events
>   @platform/db-tutorial →   @quiz/db-tutorial
>   @platform/types       →   @quiz/types
>   services/tutorial-service → apps/realtutorialhub-web (frontend)
>                               + apps/admin-app (admin)
>   services/api-gateway  →   does not exist yet

---

# PRE-WORK — Fix before touching any phase
## Must be done first. These block everything downstream.

### PRE-1 — Fix the broken test (unblocks every quality gate run)

The existing `apps/web-app/src/__tests__/ReportDownloadButton.test.tsx:79`
times out and fails `pnpm test`. This is not your code but it pollutes
every quality gate. Fix it before any T3 work.

```
Prompt to agent:

Fix the failing test in apps/web-app/src/__tests__/ReportDownloadButton.test.tsx
at line 79. The test "opens dropdown menu on trigger click (simulated)" is timing out.
Do NOT change the component logic. Either:
  (a) add a proper waitFor / findBy to handle async rendering, or
  (b) mock the dropdown trigger so the test resolves synchronously.
After fix: pnpm test must show 0 failures.
Do not touch any other file.
```

---

### PRE-2 — Add 2 missing schema files

`certificates.ts` and `student-streaks.ts` are missing from
`packages/db-tutorial/src/schema/`. Both are needed before T4.

```
Prompt to agent:

Create two missing schema files in packages/db-tutorial/src/schema/

FILE 1: certificates.ts
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
Indexes:
  idx_certificates_user ON certificates(user_id)
  idx_certificates_verify ON certificates(verification_code)

FILE 2: student-streaks.ts
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
Generate and run migration.
Verify tables visible in Neon tutorial_prod.
pnpm typecheck:all → zero errors.
```

---

### PRE-3 — Add db.transaction to existing multi-step writes

Audit found 0 `db.transaction` hits in tutorial paths. This is the most
critical FAANG gap. Before adding any new services, wrap existing ones.

```
Prompt to agent:

The tutorial engine has 0 db.transaction() calls. Find and fix these
specific locations in apps/admin-app and apps/realtutorialhub-web:

1. Content publish route (apps/admin-app/src/app/api/tutorial/content/[id]/publish/route.ts)
   → Wrap in db.transaction(): set is_published=true + call revalidateTag AFTER commit

2. Progress mark-complete (any route that writes to subtopic_flow_progress)
   → Wrap in db.transaction(): update flow progress + publish tutorial.subtopic_completed
     event INSIDE the transaction (if event publish fails → rollback)

3. Content upsert (POST and PATCH routes)
   → Wrap in db.transaction(): insert/update content + increment version atomically

Rules:
  → Use db from @quiz/db-tutorial
  → Pattern: await db.transaction(async (tx) => { ... })
  → If QStash publish is inside the transaction and fails → transaction rolls back
  → After fixing: grep for db.transaction in tutorial paths must show ≥ 3 hits
  → pnpm typecheck:all → zero errors
  → pnpm test → all passing
```

---

# PHASE T3 — Subtopic Engine (CURRENT PHASE)
## Status: T3-A-01 done (UI only). T3-A-02 and T3-A-03 missing entirely.

---

## T3-A-02 ??? Assignment Session State Machine

### ?? T3-A-02 DESIGN CHANGE (LOCKED)

The original T3-A-02 design has been superseded.

NEW DESIGN: Assignments are practice only.
  - No scoring
  - No QStash scoring workers
  - No score-based tier unlocking
  - Tier unlock = completion-based (student self-declares done)
  - Help request system added for faculty support

TABLES TO CREATE:
  tutorial_assignments (if not exists)
  assignment_progress (NEW ? replaces assignment_sessions)
  assignment_help_requests (NEW)

TABLES TO NOT CREATE:
  assignment_sessions (old design ? do not build)
  assignment_answers (old design ? do not build)
  assignment_tier_unlocks (old design ? do not build)

See PHASE-T3-ASSIGNMENT-ENGINE.md top section for full spec.

Run PRE-1, PRE-2, PRE-3 first. Then:

```
Prompt to agent:

You are building Phase T3-A-02 of the Tutorial Engine.
Package names in this repo: @quiz/auth, @quiz/events, @quiz/db-tutorial, @quiz/types.
App locations: apps/realtutorialhub-web (learner), apps/admin-app (admin).

━━━ STEP 1: DB SCHEMA ━━━

Add 3 tables to packages/db-tutorial/src/schema/

assignment-sessions.ts:
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           UUID NOT NULL
  subtopic_id       UUID NOT NULL
  difficulty        TEXT NOT NULL CHECK (difficulty IN ('simple','mixed','intermediate','expert'))
  idempotency_key   TEXT NOT NULL UNIQUE
  status            TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','active','submitted','scoring','completed','failed'))
  started_at        TIMESTAMPTZ
  submitted_at      TIMESTAMPTZ
  time_limit_sec    INTEGER
  score             DECIMAL(5,2)
  passed            BOOLEAN
  deleted_at        TIMESTAMPTZ
  version           INTEGER DEFAULT 1
  created_at        TIMESTAMPTZ DEFAULT now()

assignment-answers.ts:
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  session_id      UUID NOT NULL REFERENCES assignment_sessions(id)
  assignment_id   UUID NOT NULL REFERENCES tutorial_assignments(id)
  answer          JSONB NOT NULL
  is_correct      BOOLEAN
  score           DECIMAL(5,2)
  answered_at     TIMESTAMPTZ DEFAULT now()
  deleted_at      TIMESTAMPTZ

assignment-tier-unlocks.ts:
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID NOT NULL
  subtopic_id   UUID NOT NULL
  difficulty    TEXT NOT NULL
  unlocked_at   TIMESTAMPTZ DEFAULT now()
  deleted_at    TIMESTAMPTZ
  UNIQUE(user_id, subtopic_id, difficulty)

Export all 3 from packages/db-tutorial/src/schema/index.ts
Run migration → verify tables in Neon.

━━━ STEP 2: TYPED ERROR ━━━

Create packages/types/src/assignment-errors.ts:
  export class AssignmentTransitionError extends Error {
    constructor(
      public readonly from: string,
      public readonly to: string,
      public readonly sessionId: string
    ) {
      super(`Invalid transition from '${from}' to '${to}' for session ${sessionId}`)
      this.name = 'AssignmentTransitionError'
    }
  }

━━━ STEP 3: REPOSITORY ━━━

Create IAssignmentRepository interface in packages/types/src/tutorial-repositories.types.ts
(append to existing file, do not replace it).

Create packages/db-tutorial/src/repositories/assignment.repository.ts
Implements IAssignmentRepository. Constructor injection of db client.
Methods — all wrapped in withTimeout():
  findSession(id: string): Promise<AssignmentSessionDTO | null>
  findSessionByIdempotencyKey(key: string): Promise<AssignmentSessionDTO | null>
  createSession(data: CreateSessionDTO): Promise<AssignmentSessionDTO>
  updateSessionStatus(id: string, status: SessionStatus, extra?: Partial<AssignmentSessionDTO>): Promise<void>
  createAnswer(data: CreateAnswerDTO): Promise<AssignmentAnswerDTO>
  updateAnswer(id: string, data: Partial<AssignmentAnswerDTO>): Promise<void>
  getSessionAnswers(sessionId: string): Promise<AssignmentAnswerDTO[]>
  createTierUnlock(userId: string, subtopicId: string, difficulty: string): Promise<void>
  getTierUnlocks(userId: string, subtopicId: string): Promise<AssignmentTierUnlockDTO[]>

All methods filter deleted_at IS NULL. All return DTO types not raw rows.

━━━ STEP 4: SERVICE ━━━

Create apps/realtutorialhub-web/src/server/assignment.service.ts

State transition rules (throw AssignmentTransitionError on violation):
  created → active    (first answer submitted)
  active  → submitted (completeSession called)
  submitted → scoring (QStash worker picks up)
  scoring → completed (all answers scored)
  scoring → failed    (error after retries)

Tier unlock thresholds:
  simple      → always unlocked after flow complete
  mixed       → unlocks when simple score ≥ 60%
  intermediate → unlocks when mixed score ≥ 65%
  expert      → unlocks when intermediate score ≥ 70%

Methods:
  startSession(userId, subtopicId, difficulty, idempotencyKey):
    → Check idempotency: findSessionByIdempotencyKey first
    → If exists: return existing session (idempotent — no duplicate)
    → If new: createSession with status='created'
    → Pino log: { event: 'assignment.session.started', userId, subtopicId, difficulty }

  submitAnswer(sessionId, assignmentId, answer):
    → Load session, verify status is 'active' or 'created'
    → If 'created': transition to 'active' (db.transaction)
    → Save answer to assignment_answers
    → MCQ/fill_blank: score immediately, return { isCorrect, score }
    → short_answer/code/open_ended: return { isCorrect: null, score: null }
      (async scoring via QStash)

  completeSession(sessionId):
    → Load session, verify status is 'active'
    → If status is not 'active': throw AssignmentTransitionError
    → db.transaction(): set status='submitted', submitted_at=now()
    → Enqueue QStash: /api/workers/score-assignment-session
    → Return { accepted: true }
    → Route returns 202 Accepted immediately

  checkTierUnlock(userId, subtopicId, completedDifficulty):
    → Load completed session score for this difficulty
    → Apply threshold rules above
    → If qualifies: db.transaction() → createTierUnlock (ignore if UNIQUE conflict)
    → Publish assignment.tier_unlocked event if new unlock

  getTierStatus(userId, subtopicId):
    → Load all tier unlocks + completed sessions
    → Return { simple, mixed, intermediate, expert } each with status and score

FAANG rules:
  → Constructor injection of AssignmentRepository (not direct db import)
  → All db writes wrapped in db.transaction()
  → Pino structured logging on every state transition
  → withTimeout() via repository
  → Zod validation on every input

━━━ STEP 5: QSTASH WORKERS ━━━

Create apps/realtutorialhub-web/src/app/api/workers/score-assignment-session/route.ts
  → Verify QStash signature (use createQStashHandler from @quiz/events)
  → Check idempotency: Redis key assignment-score:{sessionId}
  → If already processed: return 200
  → Load session + all answers
  → Score each MCQ/fill_blank answer inline
  → For short_answer/code: call AI evaluator (stub for now — return 0.7 score)
  → Calculate total score + passed (≥60% = passed)
  → db.transaction(): update session status='completed', score, passed
  → Call checkTierUnlock
  → Publish assignment.completed event
  → Set Redis idempotency key

Create apps/realtutorialhub-web/src/app/api/workers/ai-score-answer/route.ts
  → Verify QStash signature
  → Load assignment rubric from tutorial_assignments
  → Stub AI scoring for now (return 0.7 score)
  → Update assignment_answers.score + is_correct
  → Pino log result

━━━ STEP 6: API ROUTES ━━━

In apps/realtutorialhub-web/src/app/api/tutorial/assignments/

POST sessions/start/route.ts
  body: { subtopicId, difficulty, idempotencyKey }
  → Zod validate → AssignmentService.startSession()
  → Rate limit: STUDENT tier

POST sessions/[sessionId]/answers/route.ts
  body: { assignmentId, answer }
  → Zod validate → AssignmentService.submitAnswer()

POST sessions/[sessionId]/complete/route.ts
  → AssignmentService.completeSession() → return 202

GET sessions/[sessionId]/status/route.ts
  → return current session + score if completed
  → Cache-Control: no-cache

GET tiers/[subtopicId]/route.ts
  → AssignmentService.getTierStatus(userId, subtopicId)
  → Cache-Control: no-cache

━━━ STEP 7: UNIT TESTS ━━━

Write tests in packages/db-tutorial/src/repositories/__tests__/assignment.repository.test.ts
  → test: startSession with same idempotencyKey twice → same session returned
  → test: submitAnswer on 'created' session → transitions to 'active'
  → test: completeSession on 'submitted' session → throws AssignmentTransitionError
  → test: tier unlock fires at exactly 60% for mixed
  → test: tier unlock does NOT fire at 59%
  → test: withTimeout throws on slow query (mock)
  → Coverage ≥ 90%

━━━ QUALITY GATE ━━━

pnpm lint:all → zero errors
pnpm typecheck:all → zero errors
pnpm test → all passing (must be ≥ previous count + new tests)
pnpm build:all → all apps build

Verify in Neon:
  □ assignment_sessions table visible
  □ assignment_answers table visible
  □ assignment_tier_unlocks table visible

Stop and report test count + table confirmation before T3-A-03.
```

---

## T3-A-03 — exam.completed QStash Consumer

Run only after T3-A-02 is committed and verified.

```
Prompt to agent:

You are building Phase T3-A-03 of the Tutorial Engine.
This is the critical cross-engine bridge: Exam Engine → Tutorial Engine.
Package names: @quiz/auth, @quiz/events, @quiz/db-tutorial, @quiz/types.

When a student scores below 60% on exam subtopics, exam-service publishes
exam.completed to QStash. Tutorial Engine must consume it here.

━━━ STEP 1: PAYLOAD SCHEMA ━━━

Add ExamCompletedPayload to packages/types/src/event-payloads.types.ts
(create file if not exists):

  export interface WeakSubtopic {
    subtopicId: string
    subtopicName: string
    score: number        // percentage 0-100
    threshold: number    // 60
  }

  export interface ExamCompletedPayload {
    userId: string
    examResultId: string
    weakSubtopics: WeakSubtopic[]
  }

Add Zod schema in packages/events/src/schemas/exam-completed.schema.ts:
  export const ExamCompletedPayloadSchema = z.object({
    userId: z.string().uuid(),
    examResultId: z.string().uuid(),
    weakSubtopics: z.array(z.object({
      subtopicId: z.string().uuid(),
      subtopicName: z.string().min(1),
      score: z.number().min(0).max(100),
      threshold: z.number().default(60)
    }))
  })

━━━ STEP 2: REMEDIATION SERVICE ━━━

Create apps/realtutorialhub-web/src/server/remediation.service.ts

  class RemediationService {
    constructor(private db: DrizzleClient, private redis: RedisClient) {}

    async createPlan(userId, examResultId, weakSubtopics):
      // 1. Check idempotency: Redis key remediation:{examResultId}
      //    → If exists: return early (already processed)
      //    → If new: proceed

      // 2. db.transaction():
      //    → Insert remediation_triggers row:
      //      { examResultId, userId, weakSubtopicIds: [...], status: 'pending' }
      //    → For each weak subtopic: upsert tutorial_progress row
      //      with remediation_triggered = true, status = 'not_started'
      //    → Set Redis key inside transaction callback AFTER DB writes succeed

      // 3. After transaction commits (NOT inside):
      //    → Enqueue QStash: /api/workers/send-remediation-email
      //    → Enqueue QStash: /api/workers/embed-weak-subtopics

      // Pino log:
      //   { event: 'remediation.plan.created', userId, examResultId,
      //     weakCount: weakSubtopics.length, correlationId }

    async getPlan(userId, examResultId): return existing plan
    async markSubtopicRemediated(userId, subtopicId): update progress
  }

━━━ STEP 3: QSTASH WORKER ━━━

Create apps/realtutorialhub-web/src/app/api/workers/handle-exam-completed/route.ts

  export async function POST(req: Request) {
    // 1. Verify QStash signature
    //    Use verifySignature from @upstash/qstash
    //    Return 401 if invalid — never process unverified payloads

    // 2. Parse + Zod validate body
    //    ExamCompletedPayloadSchema.safeParse(body)
    //    Return 400 if invalid

    // 3. Idempotency check BEFORE any DB write
    //    Redis key: remediation:{examResultId}
    //    If key exists: return Response('already processed', { status: 200 })

    // 4. Call RemediationService.createPlan(userId, examResultId, weakSubtopics)

    // 5. Return 200 on success
    //    Return 500 on any error (so QStash retries — max 3 times)

    // withSpan('tutorial.remediation.create') wrapping entire handler
  }

Create apps/realtutorialhub-web/src/app/api/workers/send-remediation-email/route.ts
  → Verify QStash signature
  → Stub email for now: Pino log { event: 'remediation.email.queued', userId }
  → Return 200

Create apps/realtutorialhub-web/src/app/api/workers/embed-weak-subtopics/route.ts
  → Verify QStash signature
  → Stub vector indexing for now: Pino log { event: 'remediation.vector.queued', subtopicIds }
  → Return 200

━━━ STEP 4: REGISTER IN EVENT_CONSUMER_MAP ━━━

In packages/events/src/consumer-map.ts,
add tutorial worker to exam.completed consumers:
  'exam.completed': [
    ...existing consumers,
    `${TUTORIAL_APP_URL}/api/workers/handle-exam-completed`,
  ]

━━━ STEP 5: UNIT TESTS ━━━

Create tests for RemediationService and the worker:
  → test: valid payload → remediation_triggers row created
  → test: duplicate examResultId → 200, no second row inserted
  → test: invalid QStash signature → 401
  → test: malformed payload (missing userId) → 400
  → test: DB failure → worker returns 500 (QStash will retry)
  → test: weakSubtopics = [] → no tutorial_progress rows, still returns 200
  → Coverage ≥ 90%

━━━ QUALITY GATE ━━━

pnpm lint:all → zero errors
pnpm typecheck:all → zero errors
pnpm test → all passing
pnpm build:all → builds

Manual verify:
  □ POST /api/workers/handle-exam-completed with valid QStash signature →
    remediation_triggers row appears in Neon
  □ Same examResultId twice → second call returns 200, no duplicate row
  □ POST with no signature header → 401
  □ POST with malformed body → 400

Commit: "feat(tutorial): T3-A-02+T3-A-03 — assignment state machine, exam.completed consumer"
Stop and report.
```

---

## T3-B — Wire learner UI to real backend + T3 Deep Audit

Run after T3-A-02 and T3-A-03 are committed.

```
Prompt to agent:

Phase T3-B: Wire the LearnerProgressPanel to the real assignment backend.
Currently LearnerProgressPanel.tsx uses local state only.

1. Replace local tier unlock state with real API calls:
   → GET /api/tutorial/assignments/tiers/[subtopicId]
     → load real tier status on mount (useEffect with SWR or React Query)
   → When student completes flow → POST /api/tutorial/assignments/sessions/start
     to create their first Simple session

2. Wire block completion to real backend:
   → When IntersectionObserver fires (80% visible, 3s) →
     POST /api/tutorial/progress/mark-complete { subtopicId, blockType }
   → This route must call RemediationService to mark remediation progress
     if this subtopic has remediation_triggered = true

3. Add Redis idempotency to progress marking:
   → Before writing to DB: check Redis key progress:{userId}:{subtopicId}:{blockType}
   → If exists: return 200 (already marked — no duplicate row)
   → After writing: set Redis key with 24h TTL

4. Sprint T3 Deep Audit checks:
   □ Progress marking is idempotent (call twice → 200, single DB row)
   □ exam.completed → remediation_triggers created within 5s
   □ QStash signature rejection works (test with wrong key → 401)
   □ Tier unlock fires at correct score (test with score=59 → no unlock, 60 → unlock)
   □ completeSession → 202 returned immediately (not blocking)
   □ No N+1 queries on subtopic page (check Drizzle query log)
   □ console.log in tutorial paths = 0

Commit: "feat(tutorial): T3-B — progress wired to backend, idempotent marking"
```

---

# PHASE T4 — Assignments + Projects
## Start only after T3 Deep Audit passes.

### Before T4: fix 3 schema gaps found in audit

```
Prompt to agent:

Before T4 begins, fix 3 schema mismatches found in the audit.
These are migrations — do not drop and recreate, use ALTER TABLE.

1. tutorial_project_submissions — add missing columns:
   ALTER TABLE tutorial_project_submissions
     ADD COLUMN IF NOT EXISTS ai_review JSONB,
     ADD COLUMN IF NOT EXISTS peer_reviews JSONB[],
     ADD COLUMN IF NOT EXISTS admin_review JSONB,
     ADD COLUMN IF NOT EXISTS badge_awarded BOOLEAN DEFAULT false,
     ADD COLUMN IF NOT EXISTS deliverable_meta JSONB;

   Update Drizzle schema file to match.
   Update ProjectSubmissionRepository to include new fields in DTOs.

2. tutorial_progress — add missing columns:
   ALTER TABLE tutorial_progress
     ADD COLUMN IF NOT EXISTS topic_id UUID,
     ADD COLUMN IF NOT EXISTS subject_id UUID,
     ADD COLUMN IF NOT EXISTS domain_id UUID,
     ADD COLUMN IF NOT EXISTS content_type TEXT;

   Update Drizzle schema file.

3. tutorial_projects — verify subtopics_covered and prerequisites
   are stored as UUID[] (Postgres array), not JSON.
   If they are JSON: migrate to UUID[].

After all 3: pnpm typecheck:all → zero errors.
Run migration. Confirm Neon schema updated.
```

### T4-A-01 — Project Assignment Rules Engine

```
Prompt to agent:

Phase T4-A-01: Project Assignment Rules Engine.
Packages: @quiz/db-tutorial, @quiz/types, @quiz/events.
Location: apps/realtutorialhub-web/src/server/

━━━ EVALUATOR FACTORY (Strategy Pattern) ━━━

Create packages/types/src/evaluators.types.ts:
  interface IAssignmentEvaluator {
    evaluate(answer: unknown, rubric: unknown): Promise<EvaluationResult>
  }
  interface EvaluationResult {
    score: number      // 0-100
    isCorrect: boolean
    feedback: string | null
  }

Create apps/realtutorialhub-web/src/server/evaluators/:
  mcq.evaluator.ts     → compare answer to content.correctAnswer, instant
  fill-blank.evaluator.ts → normalize + compare
  short-answer.evaluator.ts → stub: return { score: 0, isCorrect: false, feedback: 'AI scoring queued' }
  code.evaluator.ts    → stub: same as short-answer
  evaluator.factory.ts → EvaluatorFactory.create(questionType: QuestionType): IAssignmentEvaluator
                         Never switch/case — use a map object

━━━ PROJECT ASSIGNMENT SERVICE ━━━

Create apps/realtutorialhub-web/src/server/project-assignment.service.ts

  Rules:
    Simple   → unlocks when subtopic flow complete
    Mixed    → requires Simple assignment completed + video block viewed
    Intermediate → requires all Topic-level projects complete for that subject
    Expert   → requires all Subject-level projects complete for that domain

  Methods:
    getAvailableProjects(userId, topicId): check eligibility for each project
    checkEligibility(userId, projectId, difficulty): return { eligible, reason }
    assignProject(userId, projectId): create tutorial_project_submissions row (status=submitted)
    getProjectStatus(userId, projectId): return current submission status

━━━ STATE MACHINE ━━━

Create apps/realtutorialhub-web/src/server/project-state-machine.ts
  Valid transitions:
    submitted → ai_reviewing
    ai_reviewing → peer_review | approved | revision_needed
    peer_review → approved | revision_needed
    revision_needed → submitted (re-submission cycle)
    approved → (terminal)

  export class ProjectTransitionError extends Error {}
  Invalid transitions throw ProjectTransitionError.

━━━ UNIT TESTS ━━━
  → test: EvaluatorFactory.create('mcq') returns MCQEvaluator
  → test: MCQEvaluator scores correct answer = 100, wrong = 0
  → test: invalid project transition throws ProjectTransitionError
  → test: checkEligibility returns false when prerequisite not met
  → Coverage ≥ 90%

Commit: "feat(tutorial): T4-A-01 — evaluator factory, project rules, state machine"
```

### T4-A-02 — Project Submission Flow (USER-GATED)

```
Prompt to agent:

Phase T4-A-02: Project submission flow. USER-GATED — stop and show UI before continuing.

━━━ SUBMISSION API ━━━

POST /api/tutorial/projects/submit/route.ts
  → Zod validate: { projectId, deliverableUrl, deliverableMeta, videoUrl? }
  → Check eligibility via ProjectAssignmentService.checkEligibility()
  → If not eligible: return 403 with reason
  → db.transaction():
    → Insert tutorial_project_submissions row (status='submitted')
    → Set idempotency key: Redis project-submit:{userId}:{projectId}
  → Enqueue QStash: /api/workers/review-project
  → Return 202 Accepted { submissionId }
  → NEVER block on AI review — always 202

━━━ AI REVIEW WORKER ━━━

POST /api/workers/review-project/route.ts
  → Verify QStash signature
  → Idempotency check: project-review:{submissionId}
  → Load project rubric from tutorial_projects
  → Stub AI review for now:
    { codeQuality: 18, coverage: 20, documentation: 17, innovation: 15, total: 70 }
  → db.transaction():
    → Update submission: ai_review = result, status = 'approved' (if total ≥ 70)
      or status = 'revision_needed' (if total < 70)
  → If approved: enqueue /api/workers/award-project-badge

POST /api/workers/award-project-badge/route.ts
  → Verify QStash signature
  → Load badge criteria from badges table
  → db.transaction(): insert student_badges row
  → Enqueue /api/workers/send-project-email

━━━ SUBMISSION PAGE (USER-GATED — STOP HERE) ━━━

Create apps/realtutorialhub-web/src/app/(learning)/projects/[projectId]/submit/page.tsx
  → Show project requirements + difficulty
  → Submission form: deliverable URL + video URL (required if Mixed+)
  → Validate video URL presence before submit if video_required=true
  → Submit → POST /api/tutorial/projects/submit → show "Under Review" state
  → Poll GET /api/tutorial/projects/submissions/[submissionId]/status every 5s
  → When status changes: update UI badge

STOP. Show me the submission page before building T4-A-03.
```

### T4 — Certificates + Badge Award + Verification URL

```
Prompt to agent:

Phase T4 continued: Certificates, badge award chain, public verification.

━━━ CERTIFICATE SERVICE ━━━

Create apps/realtutorialhub-web/src/server/certificate.service.ts

  async checkEligibility(userId, scope, parentId):
    topic cert:   all subtopics in topic complete + simple project approved
    subject cert: all topics complete + intermediate project approved
    subject cert: all subjects complete + expert project approved by admin

  async issueCertificate(userId, scope, parentId, parentName):
    → Generate verificationCode = crypto.randomUUID() (cryptographically random)
    → db.transaction():
      → Insert certificates row
      → Enqueue QStash: /api/workers/generate-certificate-pdf
    → Publish certificate.issued event to QStash

━━━ PUBLIC VERIFICATION ━━━

GET /api/certificates/verify/[verificationCode]/route.ts
  → Public route (no auth)
  → Query certificates by verificationCode
  → Return: { studentName, courseName, issuedDate, scope, valid: true }
  → Cache-Control: public, max-age=86400 (certificates never change)
  → Return 404 if not found

━━━ T4 DEEP AUDIT ━━━
  □ Submission returns 202 immediately (worker reviews async)
  □ AI review completes and updates submission status (verify in Neon)
  □ Badge awarded after approval (check student_badges table)
  □ Certificate issued after all scope requirements met
  □ Public verification URL returns correct data without auth
  □ Expert project requires admin review (ai_review alone not sufficient)

Commit: "feat(tutorial): T4 — project engine, badges, certificates, verification"
```

---

# PHASE T5 — Video Integration
## Start after T4 Deep Audit passes.

```
Prompt to agent:

Phase T5: VideoBlock component. USER-GATED — stop and show component.
Package locations: apps/realtutorialhub-web.

━━━ VIDEOBLOCK COMPONENT ━━━

Create apps/realtutorialhub-web/src/components/content/VideoBlock.tsx

Rules from TUTORIAL-ENGINE-BLUEPRINT.md Part 3:
  Simple:       video optional
  Mixed+:       video REQUIRED before assignment unlocks

Component behaviour:
  → Props: { videoUrl, title, provider, durationSeconds, captionsAvailable }
  → Do NOT load iframe on mount — show thumbnail + "Watch Video" button first
  → Only inject iframe when user clicks play (IntersectionObserver is NOT enough here —
    user must explicitly click)
  → Once clicked: load iframe via dangerouslySetInnerHTML or next/third-parties
  → Track watch completion: listen for YouTube postMessage or 5-minute timer fallback
  → On completion: call POST /api/tutorial/progress/mark-video-complete

Accessibility (WCAG 2.1 AA):
  → iframe: title="[video.title]", aria-label="Video: [video.title]"
  → Caption track note: if captionsAvailable=false, show warning badge
    "Captions unavailable for this video"
  → Play button: min 48x48px touch target
  → Keyboard: Enter/Space triggers play button

Performance:
  → Never embed iframe in initial HTML (defeats the purpose)
  → Use aspect-ratio: 16/9 container to prevent layout shift
  → Thumbnail from provider CDN (YouTube: img.youtube.com/vi/{id}/maxresdefault.jpg)

STOP. Show me the VideoBlock component before T5-B.

━━━ T5-B: WIRE VIDEO GATE ━━━ (after approval)

Add video completion gate to assignment unlock logic:
  → Mixed/Intermediate/Expert assignments: check video_watched = true
    before allowing session start
  → If video not watched: return 403 with message
    "Watch the video for this topic before starting assignments"
  → Update LearnerProgressPanel to show VideoBlock before assignment unlock card
    for Mixed+ tiers

T5 Deep Audit:
  □ VideoBlock: iframe NOT in initial DOM (verify in DevTools)
  □ Video required for Mixed+ (attempt to start session without watch → 403)
  □ Caption warning shown when captionsAvailable=false
  □ Lighthouse: video section does not degrade Performance score

Commit: "feat(tutorial): T5 — VideoBlock, video gate, Mixed+ assignment unlock"
```

---

# PHASE T6 — AI Tutor Engine
## Start after T5 Deep Audit passes.

```
Prompt to agent:

Phase T6: AI Tutor Engine.
This uses Upstash Vector ONLY. No Anthropic API in this phase.
Rate limit: 10 questions per student per hour per subtopic.
Package: @quiz/db-tutorial for vector client.

━━━ STEP 1: VECTOR INDEXING ━━━

Create apps/realtutorialhub-web/src/server/vector.service.ts
Using @upstash/vector:

  async indexSubtopicContent(subtopicId, difficulty, content: TutorialContentJSON):
    → Build chunks array:
      { id: `${subtopicId}:${difficulty}:notes`, data: content.notes.markdown }
      { id: `${subtopicId}:${difficulty}:layman`, data: content.layman.simpleExplanation + ' ' + content.layman.analogyOrStory }
      { id: `${subtopicId}:${difficulty}:technical`, data: content.technical.markdown }
      { id: `${subtopicId}:${difficulty}:code`, data: content.code.intro + ' ' + content.code.steps.join(' ') }
    → vectorIndex.upsert(chunks)
    → Pino log: { event: 'content.indexed', subtopicId, difficulty, chunkCount: 4 }

  async findRelevantContent(subtopicId, query, topK = 3):
    → vectorIndex.query({ data: query, topK, filter: `subtopicId = '${subtopicId}'` })
    → Return ContentChunk[]

━━━ STEP 2: QSTASH WORKER FOR INDEXING ━━━

Create apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts
  → Verify QStash signature
  → Load published content for subtopicId + difficulty from DB
  → Call VectorService.indexSubtopicContent()
  → Return 200

Wire this into the publish route:
  After content is published (in publish/route.ts):
  → Enqueue QStash: /api/workers/index-content-vector { subtopicId, difficulty }

━━━ STEP 3: AI TUTOR SYSTEM PROMPT BUILDER ━━━

Create apps/realtutorialhub-web/src/server/ai-tutor/prompt-builder.ts

  buildSystemPrompt(subtopic, domainConfig, content, relevantChunks):
    → Include subtopic name, domain audience profile
    → Include layman explanation + real-life scenario
    → Include relevant content chunks from vector search
    → Personality rules: Socratic, hints first, connect to analogies
    → STRICT BOUNDARY: only discuss this subtopic — if asked about others,
      say "That's covered in [other subtopic]. Let's focus on [this one] for now."

━━━ STEP 4: STREAMING CHAT API ━━━

Create apps/realtutorialhub-web/src/app/api/ai-tutor/chat/route.ts

  POST body: { subtopicId, difficulty, message, history, userId }

  1. Auth check: verify JWT session
  2. Feature gate: check subscription.features includes 'ai_tutor'
     → If missing: return 402 { error: 'AI Tutor requires Pro subscription' }
  3. Rate limit: Upstash Ratelimit
     key: ai-tutor:{userId}:{subtopicId}
     limit: 10 per hour
     → If exceeded: return 429 { error: 'You have used 10 questions this hour.' }
  4. Load content from DB + Redis cache
  5. Vector search: findRelevantContent(subtopicId, message)
  6. Build system prompt
  7. Call Anthropic claude-sonnet-4-6 with streaming
     max_tokens: 1000
  8. Return SSE stream
  9. On first message from user: POST /api/tutorial/progress/mark-complete
     { subtopicId, blockType: 'ai_tutor' }

━━━ STEP 5: CLIENT STREAMING (USER-GATED) ━━━

Wire AITutorBlock.tsx to the real chat API:
  → Replace placeholder with real fetch + ReadableStream reader
  → Show streaming text word by word in chat bubble
  → Pre-generated qa_pairs: render as clickable questions
    → On click: send that question to the chat API
  → Show rate limit warning when approaching 10 messages
  → Show 402 upgrade prompt if not subscribed

STOP. Show me the AI Tutor chat UI in action before T6-B.

━━━ T6 DEEP AUDIT ━━━
  □ Streaming: text appears word by word (not all at once)
  □ 11th question in 1 hour → 429 with clear message
  □ Free user → 402 (not 500, not 200)
  □ AI stays within subtopic boundaries (test by asking about other topics)
  □ Vector indexed when admin publishes (check Upstash Vector dashboard)
  □ Pre-generated qa_pairs render as clickable chips
  □ Rate limit key is per-user per-subtopic (not global)

Commit: "feat(tutorial): T6 — AI Tutor streaming, Upstash Vector, rate limiting, feature gate"
```

---

# PHASE T7 — Remediation Engine (Full)
## Start after T6 Deep Audit passes.

```
Prompt to agent:

Phase T7: Full Remediation Engine — Saga pattern, materialized view, dashboard.
Build on top of the T3-A-03 worker which already creates remediation_triggers.

━━━ STEP 1: SAGA PATTERN ━━━

Create apps/realtutorialhub-web/src/server/sagas/exam-completed.saga.ts

  ExamCompletedSaga executes 3 steps:
    Step 1: Create remediation_triggers + tutorial_progress records
    Step 2: Identify weak subtopics + generate study plan (order by score ASC)
    Step 3: Send "Your study plan" email via Resend + notification-service

  If Step 1 fails:
    → Log error, return 500 (QStash retries)
  If Step 2 fails:
    → Compensating action: mark remediation_triggers.status = 'failed'
    → Alert via Pino error log
  If Step 3 fails:
    → Retry 3 times via QStash, then dead letter
    → Do NOT block Step 1+2 completion

Update handle-exam-completed worker to use ExamCompletedSaga instead of
calling RemediationService directly.

━━━ STEP 2: MATERIALIZED VIEW ━━━

Add to packages/db-tutorial/src/migrations/:

  CREATE MATERIALIZED VIEW mv_student_weak_areas AS
  SELECT
    rt.user_id,
    unnest(rt.weak_subtopic_ids) AS subtopic_id,
    count(*) AS failed_count,
    max(rt.created_at) AS last_failed_at
  FROM remediation_triggers rt
  WHERE rt.status != 'completed'
  GROUP BY rt.user_id, subtopic_id;

  CREATE UNIQUE INDEX ON mv_student_weak_areas(user_id, subtopic_id);

Add refresh trigger: when exam.completed consumed →
  enqueue QStash: /api/workers/refresh-weak-areas-view { userId }

Create apps/realtutorialhub-web/src/app/api/workers/refresh-weak-areas-view/route.ts
  → Verify QStash signature
  → REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_weak_areas
  → Return 200

━━━ STEP 3: REMEDIATION DASHBOARD (USER-GATED) ━━━

Create apps/realtutorialhub-web/src/app/(learning)/remediation/[examResultId]/page.tsx

Page sections (from PHASE-T5-REMEDIATION-ENGINE.md Part 4):
  HEADER: "Your study plan from [Exam Name]"
          "You scored below 60% in [N] topics."
          Overall exam score badge

  WEAK TOPICS GRID:
    For each weak subtopic:
      Card: subtopic name + score (e.g. "Promises — 38%")
      Progress bar: score vs 60% threshold
      Priority badge: HIGH (< 40%) | MEDIUM (40–60%)
      "Start Studying →" button → /learn/.../[subtopicSlug]
      Turn green with checkmark when subtopic completed

  AI TUTOR QUICK START:
    "Ask AI Tutor about your weak areas"
    Pre-loaded message: "I scored [X]% on [subtopic]. Help me understand it better."

  PROGRESS TRACKER:
    "Remediation complete!" banner when all weak subtopics reviewed

STOP. Show me the remediation dashboard before T7-B.

━━━ T7 DEEP AUDIT ━━━
  □ Saga: Step 2 failure → remediation_triggers.status = 'failed' (test with DB mock)
  □ Materialized view refreshed when exam.completed consumed
  □ mv_student_weak_areas query time < 10ms (verify with EXPLAIN ANALYZE)
  □ Dashboard shows correct weak subtopics per examResultId
  □ Card turns green when student completes the subtopic
  □ AI Tutor pre-loaded with exam context (not generic greeting)

Commit: "feat(tutorial): T7 — remediation saga, materialized view, dashboard"
```

---

# PHASE T8 — Admin Content Management (Full)
## Start after T7 Deep Audit passes.

FACTORY PATTERN (LOCKED — read before building T8):
  All admin creation pages follow Question Bank Factory UI/UX.
  Question Bank Factory = base pattern for all factory pages.
  See WINDOW-2-TUTORIAL-ENGINE-GUIDE.md for full design rule.
  
  T8 must ensure:
    Content Factory    → matches Question Bank Factory pattern
    Assignment Factory → matches Question Bank Factory pattern
    Both in same Tutorial section of admin sidebar

```
Prompt to agent:

Phase T8: Complete admin content management.
The BlockEditor and ContentVersionHistory already exist from T2.
This phase adds: TutorialPromptService, content versioning snapshots,
audit trail, SEO, and the SVG/R2 image pipeline.

━━━ STEP 1: TUTORIAL PROMPT SERVICE ━━━

Create apps/admin-app/src/server/tutorial-prompt.service.ts

This generates the prompt that admin copies to an external AI to generate
the 6-block JSON. It does NOT call any AI API itself.

  generatePrompt(subtopic, domain, topic, difficulty):
    → Returns a complete prompt string including:
      - content-json-schema.md structure embedded
      - domain-specific style rules (from domain_content_config)
      - difficulty-specific instructions
      - example companies for that domain
      - quality constraints (150-250 word layman block, etc.)
    → Admin copies this prompt → pastes in ChatGPT/Claude.ai → gets JSON back
    → Admin pastes JSON into admin editor → Zod validates → save as draft

Wire into admin BlockEditor:
  → Add "Generate Prompt" button
  → Click → show modal with copy-to-clipboard prompt text
  → Add "Paste AI Response" box → Zod validate on paste
  → If valid: auto-fill all 6 block fields
  → If invalid: show field-level errors

━━━ STEP 2: CONTENT VERSIONING SNAPSHOTS ━━━

Every publish creates a snapshot in a new table:

Create packages/db-tutorial/src/schema/tutorial-content-versions.ts:
  id          UUID PRIMARY KEY
  content_id  UUID NOT NULL REFERENCES tutorial_content(id)
  version     INTEGER NOT NULL
  content     JSONB NOT NULL    -- full snapshot of content at this version
  saved_by    UUID NOT NULL     -- admin userId
  created_at  TIMESTAMPTZ DEFAULT now()

Add to publish route: BEFORE updating is_published,
  insert a row into tutorial_content_versions with current content snapshot.

Update ContentVersionHistory component to load from this table.
Add "Restore" action: copies that version's content back as a new draft.

━━━ STEP 3: AUDIT TRAIL ━━━

Create packages/db-tutorial/src/schema/tutorial-content-audit.ts:
  id          UUID PRIMARY KEY
  content_id  UUID NOT NULL
  user_id     UUID NOT NULL
  action      TEXT NOT NULL CHECK (action IN ('created','updated','published','unpublished','restored'))
  diff        JSONB             -- before/after JSON diff for updates
  created_at  TIMESTAMPTZ DEFAULT now()

Add audit logging to every TutorialContentRepository write method.
Create admin audit log viewer at apps/admin-app/(authenticated)/dashboard/content/audit/page.tsx
  → Chronological feed of all content changes
  → Filter by user, action, date range
  → Each row shows: who, what action, which subtopic, when

━━━ STEP 4: SEO ━━━

Add generateMetadata to every subtopic page in apps/realtutorialhub-web:
  → /learn/[domain]/[subject]/[topic]/[subtopic]/page.tsx
  → title: "[Subtopic Name] — [Topic Name] | RealTutorialHub"
  → description: first 160 chars of layman.simpleExplanation
  → openGraph: title, description, type: 'article'
  → Add sitemap.ts for all published subtopics (ISR, revalidate 3600)

━━━ T8 DEEP AUDIT ━━━
  □ TutorialPromptService generates valid prompt with correct schema embedded
  □ Paste AI response → Zod validates → fields populated
  □ Every publish creates a version snapshot row
  □ Restore action creates new draft with restored content + new audit entry
  □ Every write creates audit_trail row (test: create → check audit table)
  □ All admin routes return 403 for learner JWT (test all routes)
  □ SEO: <title> and <meta description> present on subtopic pages
  □ Sitemap includes all published subtopics

Commit: "feat(tutorial): T8 — prompt service, versioning, audit trail, SEO"
```

---

# RTH-1 — realtutorialhub-web Production Polish
## Start after T8 Deep Audit passes.

```
Prompt to agent:

RTH-1: Bring apps/realtutorialhub-web to production quality.
The scaffold already exists. This phase polishes it to Lighthouse ≥ 90.

━━━ RTH-1-A-01: PWA + i18n ━━━

Install: next-pwa, next-intl

PWA (PHASE-T5-REMEDIATION-ENGINE.md Part 9.5):
  → manifest.json: name "RealTutorialHub", theme_color, icons (192 + 512)
  → Offline page: "Content is unavailable offline. Reconnect to continue learning."
  → Service worker: cache last 5 subtopic content blocks
  → next-pwa config in next.config.ts

i18n (next-intl):
  → Supported locales: en, hi (English + Hindi)
  → Default: en
  → Locale switcher in navbar
  → All UI strings in /messages/en.json and /messages/hi.json

━━━ RTH-1-A-02: Subtopic page polish (USER-GATED) ━━━

  → Error boundaries: wrap each block in <ErrorBoundary fallback={<BlockErrorFallback />}>
  → Loading skeletons: each block shows skeleton while content loads
    (use Suspense boundaries — content is server-fetched)
  → Keyboard navigation: arrow keys cycle through 6 block tabs
  → Focus management: when block changes, focus moves to block heading
  → All 6 blocks pass axe-core scan (zero violations)
  → Confirm CodeBlock and AITutorBlock loaded via next/dynamic (verify in Network tab)

STOP. Show me the full subtopic page with all 6 blocks, error states, and loading states.

━━━ RTH-1-A-03: Block component unit tests ━━━

Write test files missing from audit:
  apps/realtutorialhub-web/src/components/content/__tests__/
    NotesBlock.test.tsx
    LaymanBlock.test.tsx
    RealLifeBlock.test.tsx
    TechnicalBlock.test.tsx
    CodeBlock.test.tsx
    AITutorBlock.test.tsx
    BlockRenderer.test.tsx

Each test file must cover:
  → renders with mock TutorialContentJSON data
  → handles null/empty content gracefully (no crash)
  → aria-label present
  → axe-core scan: zero violations (use @axe-core/react)

Target: 90%+ coverage on all 7 files.

━━━ RTH-1-A-04: Deployment ━━━

  → GCP Cloud Run: asia-south1 (Mumbai)
    Build Docker image → push to Artifact Registry → deploy to Cloud Run
  → Cloudflare DNS: notes.realtutorialhub.com → Cloud Run URL
  → Environment variables set in Cloud Run (DATABASE_URL_TUTORIAL, UPSTASH_*)
  → Health check: GET /api/healthz → 200

━━━ RTH-1 DONE CHECKLIST ━━━
  □ pnpm test → all passing, coverage ≥ 90% on block components
  □ Lighthouse mobile ≥ 90 (Performance + Accessibility + SEO + PWA)
  □ axe-core: zero WCAG violations on subtopic page
  □ notes.realtutorialhub.com loads correctly
  □ PWA install prompt appears on mobile
  □ i18n: Hindi locale loads without errors
  □ All 6 blocks render with real content from Neon

Commit: "feat(tutorial): RTH-1 — PWA, i18n, a11y polish, block tests, deployed"
```

---

# INFRA — API Gateway (Cloudflare Workers)
## Can be built in parallel with RTH-1 or after.

```
Prompt to agent:

Build the Hono API Gateway on Cloudflare Workers.
Blueprint: PHASE-INFRA-GATEWAY.md

Create services/api-gateway/ (new directory):
  package.json   → name: "@quiz/api-gateway"
  wrangler.toml  → route: api.realtutorialhub.com/*
  src/index.ts   → Hono app entry

Use PHASE-INFRA-GATEWAY.md Part 2 ROUTING_TABLE exactly as written.
Use PHASE-INFRA-GATEWAY.md Part 3 complete gateway code as the base.
Fix package names: replace @platform/* with @quiz/*.
Fix service URLs: replace process.env.TUTORIAL_SERVICE_URL
  with apps/realtutorialhub-web Cloud Run URL.

After scaffolding:
  □ GET /healthz → 200
  □ Request without JWT to protected route → 401
  □ Request with valid JWT → proxied to upstream
  □ Rate limit test: 101 requests in 1 minute → 429 on 101st
  □ wrangler deploy → api.realtutorialhub.com resolves

Commit: "feat(infra): API Gateway — Hono on Cloudflare Workers"
```

---

# COVERAGE DEBT — Fix package coverage gaps

These can be fixed alongside any phase. They are not blockers but are
required before claiming FAANG compliance.

```
Prompt to agent:

Fix coverage gaps found in audit. Target ≥ 90% on all packages.

1. packages/auth (@quiz/auth) — currently 24.5% statements, 17.4% branches
   Missing tests for:
   → TokenService: test sign(), verify(), verify with expired token → throws
   → PasswordService: test hash(), compare(correct) → true, compare(wrong) → false
   → Rate limit middleware: test 6th request in window → 429
   Target: ≥ 90% statements, ≥ 85% branches

2. packages/events (@quiz/events) — currently 70.8% statements, 67.3% branches
   Missing tests for:
   → publishEvent: test all 15 event types route to correct consumer URLs
   → createQStashHandler: test invalid signature → 401
   → createQStashHandler: test valid signature → calls handler
   → EVENT_CONSUMER_MAP: test each event has ≥ 1 consumer
   Target: ≥ 90% statements, ≥ 85% branches

3. packages/db-tutorial (@quiz/db-tutorial) — 78.3% branches
   Missing tests for:
   → withTimeout: test query exceeding timeout → throws with correct error message
   → softDelete: test deleted_at is set, record not returned in subsequent find
   Target: ≥ 85% branches

After all 3: pnpm test shows ≥ 90% coverage on all 3 packages.
```

---

# SUMMARY TABLE — Phase execution order

| Order | Phase | Prerequisite | Estimated sessions |
|-------|-------|-------------|-------------------|
| 1 | PRE-1: Fix test failure | Nothing | 1 |
| 2 | PRE-2: Add 2 schema files | PRE-1 | 1 |
| 3 | PRE-3: Add db.transaction | PRE-2 | 1 |
| 4 | T3-A-02: Assignment state machine | PRE-3 | 2-3 |
| 5 | T3-A-03: exam.completed consumer | T3-A-02 | 1-2 |
| 6 | T3-B: Wire UI to backend | T3-A-03 | 1 |
| 7 | T4 schema fixes | T3-B | 1 |
| 8 | T4: Project engine + certificates | T4 schema fixes | 3-4 |
| 9 | T5: VideoBlock + video gate | T4 | 1-2 |
| 10 | T6: AI Tutor + Vector | T5 | 2-3 |
| 11 | T7: Remediation saga + dashboard | T6 | 2-3 |
| 12 | T8: Admin, prompt service, SEO | T7 | 2-3 |
| 13 | RTH-1: Polish, PWA, tests, deploy | T8 | 2-3 |
| 14 | INFRA: API Gateway | RTH-1 (parallel ok) | 1-2 |
| 15 | Coverage debt | Any phase (parallel) | 1-2 |

---

# ONE RULE FOR EVERY SESSION

Start every new agent session with:

```
You are a senior full-stack engineer on the quiz-platform monorepo.
Real package names: @quiz/auth, @quiz/events, @quiz/db-tutorial, @quiz/types.
Real app locations: apps/realtutorialhub-web (learner), apps/admin-app (admin).
DO NOT modify: apps/api-server, apps/web-app, apps/quiz-app (Exam Engine — 1167 tests).
FAANG rules: repository pattern, DI, Pino logging (no console.log), Zod on all inputs,
db.transaction on multi-step writes, withTimeout on DB queries, soft deletes only.
Read the relevant blueprint file before writing any code.
Current task: [PASTE TASK FROM THIS GUIDE]
```

---

*Guide version: 1.0 | Date: 2026-03-22 | Based on: codebase audit + all blueprint .md files*
