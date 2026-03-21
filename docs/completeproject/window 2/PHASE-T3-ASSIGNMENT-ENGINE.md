# PHASE-T3: Assignment Engine
## docs/blueprints/PHASE-T3-ASSIGNMENT-ENGINE.md

> Prerequisites: PHASE-T1 complete, content blocks publishing
> Sprint: Tutorial Sprint 3

---

## Purpose

Students complete difficulty-gated assignments after finishing all 6 content
blocks. Assignment sessions mirror ExamEngine patterns exactly — same
idempotency, same state machine, same QStash async scoring.

---

## Part 1: Assignment Tier Rules

```
TIER UNLOCK SEQUENCE (per subtopic):
  Simple      → always available after flow complete
  Mixed       → unlocks when Simple score ≥ 60%
  Intermediate→ unlocks when Mixed score ≥ 65%
  Expert      → unlocks when Intermediate score ≥ 70%

ASSIGNMENT COUNTS:
  Simple:       3–5 questions
  Mixed:        6–10 questions
  Intermediate: 8–12 questions
  Expert:       12–20 questions

QUESTION TYPES PER TIER:
  Simple:       MCQ only (auto-scored instantly)
  Mixed:        MCQ + fill-in-blank (auto-scored)
  Intermediate: MCQ + short_answer + code (AI-scored via QStash)
  Expert:       All types + open-ended (AI + optional faculty review)
```

---

## Part 2: Assignment Session State Machine

```
CREATED → ACTIVE → SUBMITTED → SCORING → COMPLETED
                             → FAILED (scoring error)

Rules:
  - Cannot submit if status ≠ 'active'
  - Cannot answer if timer expired
  - Double-submit blocked via idempotency key
  - CREATED uses same idempotencyKey pattern as ExamEngine
```

---

## Part 3: DB Schema Additions

```sql
CREATE TABLE assignment_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  subtopic_id       UUID NOT NULL,
  difficulty        TEXT NOT NULL,
  idempotency_key   TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN ('created','active','submitted','scoring','completed','failed')
  ),
  started_at        TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ,
  time_limit_sec    INTEGER,
  score             DECIMAL(5,2),
  passed            BOOLEAN,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assignment_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES assignment_sessions(id),
  assignment_id   UUID NOT NULL REFERENCES tutorial_assignments(id),
  answer          JSONB NOT NULL,
  is_correct      BOOLEAN,
  score           DECIMAL(5,2),
  answered_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assignment_tier_unlocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  subtopic_id   UUID NOT NULL,
  difficulty    TEXT NOT NULL,
  unlocked_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subtopic_id, difficulty)
);
```

---

## Part 4: AssignmentService

```typescript
class AssignmentService {
  // Start session (idempotent)
  async startSession(
    userId: string,
    subtopicId: string,
    difficulty: Difficulty,
    idempotencyKey: string
  ): Promise<AssignmentSession>

  // Submit one answer
  async submitAnswer(
    sessionId: string,
    assignmentId: string,
    answer: unknown
  ): Promise<{ isCorrect: boolean | null; score: number | null }>
  // Simple/Mixed → score immediately (isCorrect returned)
  // Intermediate/Expert → queue AI scoring (null returned, async)

  // Complete session
  async completeSession(sessionId: string): Promise<SessionResult>
  // → marks status = 'submitted'
  // → enqueues QStash: score-assignment-session
  // → returns 202 immediately

  // Check and unlock next tier
  async checkTierUnlock(
    userId: string,
    subtopicId: string,
    completedDifficulty: Difficulty
  ): Promise<TierUnlockResult>

  // Get current unlock status
  async getTierStatus(userId: string, subtopicId: string): Promise<TierStatus>
}
```

---

## Part 5: QStash Workers

```
POST /api/workers/score-assignment-session
  → Verify QStash signature
  → Load session + all answers
  → For each answer: call evaluator (MCQ instant, short_answer AI)
  → Calculate total score + passed flag
  → Update session: status = 'completed', score, passed
  → Call checkTierUnlock → emit QStash event if new tier unlocked
  → Publish: assignment.completed event

POST /api/workers/ai-score-answer
  → For Intermediate/Expert answers
  → Call AI with rubric + student answer
  → Update assignment_answers.score
  → If last answer in session → trigger session completion
```

---

## Part 6: Verification

```
□ Simple MCQ session scores immediately on completion
□ Expert session returns 202, score arrives async via QStash
□ Double-submit with same idempotencyKey returns existing session
□ Mixed tier locked until Simple ≥ 60%
□ Tier unlock event fires on qualification
□ Timer expiry marks session as submitted automatically
□ Video links shown for Mixed + Expert tiers
```

---

*Phase: T3 | Status: Ready*
