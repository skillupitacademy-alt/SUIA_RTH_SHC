# WARNING - ARCHITECTURAL DECISION UPDATED (LOCKED)
## Date: 2026-03-22 | Supersedes original design below

## What Changed
Tutorial assignments are SELF-DIRECTED PRACTICE only.
No scoring. No evaluation. No pass/fail. No certificates.

## What Was Removed From Original Design
- Score tracking on assignment answers
- Pass/fail on assignment sessions
- Score-based tier unlocking (Simple >= 60% etc.)
- QStash AI scoring workers (score-assignment-session, ai-score-answer)
- assignment_answers table
- assignment_sessions scoring fields (score, passed, time_limit_sec)
- assignment_tier_unlocks table
- Idempotency key pattern on sessions (not needed without scoring)

## What Replaces It
- assignment_progress table (tracks started/self_completed per tier)
- Completion-based tier unlocking (student self-declares done)
- Help request system (student flags question for faculty/admin)
- Reference answers shown AFTER attempt (self-check only, not scored)

## Updated Tier Unlock Sequence
  Simple       -> always available after all 6 content blocks complete
  Mixed        -> unlocks when Simple status = 'self_completed'
  Intermediate -> unlocks when Mixed status = 'self_completed'
  Expert       -> unlocks when Intermediate status = 'self_completed'

## Where Evaluation Lives
  Projects (T4)   -> evaluated by AI/peers/admin -> awards certificates
  Exam Engine     -> formal periodic evaluation -> triggers remediation
  Assignments     -> practice only -> no evaluation, no certificates

## DB Tables Decision
  tutorial_assignments     -> KEEP (stores practice questions)
  assignment_progress      -> NEW (replaces assignment_sessions)
  assignment_help_requests -> NEW (student flags question for help)
  assignment_sessions      -> DO NOT CREATE (old design, replaced)
  assignment_answers       -> DO NOT CREATE (old design, removed)
  assignment_tier_unlocks  -> DO NOT CREATE (old design, replaced)

---

## Assignment Factory (Admin UI)
## Built in T8 - not T3

Admin creates assignments via Assignment Factory page
following the same Question Bank Factory pattern.

Location: apps/admin-app/src/app/(authenticated)/dashboard/assignments/

Workflow (identical to Question Bank Factory):
  1. Admin selects: domain -> subject -> topic -> subtopic -> difficulty
  2. TutorialPromptService generates prompt embedding assignment schema
  3. Admin copies prompt -> pastes in external AI -> gets JSON back
  4. Admin pastes JSON into ingest box
  5. Zod validates against AssignmentSchema
  6. Admin previews assignments
  7. Save as draft -> Publish

Generated JSON shape:
  {
    "assignments": [
      {
        "question_type": "mcq" | "short_answer" | "code" | "open_ended",
        "question": "string",
        "hints": ["string"],
        "reference_answer": "string (self-check only, not for scoring)"
      }
    ]
  }

Per tier question counts:
  Simple:       3-5 questions (MCQ only)
  Mixed:        6-10 questions (MCQ + short_answer)
  Intermediate: 8-12 questions (MCQ + short_answer + code)
  Expert:       12-20 questions (all types including open_ended)

No scoring. No correct/wrong. Reference answer shown AFTER student attempts.
Admin publishes -> assignments available to students for that subtopic + difficulty.

## Assignment Factory Prompt Contract

The admin Assignment Factory in T8 uses `TutorialPromptService.generateAssignmentPrompt()`
to produce a tier-specific prompt for an external AI model.

The factory prompt must:
- include the selected domain, subject, topic, subtopic, and difficulty
- embed the assignment JSON schema structure
- describe the per-tier question count ranges
- clearly state that assignments are practice only
- require `reference_answer` to be included for self-check only
- validate the pasted JSON with `AssignmentSchema` before preview/publish

The admin UI lives at:
- `apps/admin-app/src/app/(authenticated)/dashboard/assignments/page.tsx`

The page should match the existing Question Bank Factory workflow and layout
so the assignment factory feels native to the current admin UX.

---
# Original design preserved below for reference only
# Do not implement anything below this line
---

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
