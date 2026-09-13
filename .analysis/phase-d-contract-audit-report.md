# Gate 3C.1R Phase D — Contract Audit Report

**Date:** 2026-09-11  
**Status:** 🔵 AUDIT IN PROGRESS  
**Authorization:** AUDIT ONLY - NO IMPLEMENTATION  

---

## Executive Summary

**Purpose:** Determine whether the proposed universal block-learning model is architecturally compatible, semantically complete, implementable without ambiguity, and safe under concurrent/browser lifecycle conditions.

**Scope:** Three foundational statements + A–I audit points + three critical architectural gaps

**Method:** Source code inspection, database schema verification, git history analysis, runtime behavior inference, test coverage review

---

## Classification Legend

- **VERIFIED IN SOURCE** — Confirmed by reading production code
- **VERIFIED AT RUNTIME** — Confirmed by existing test execution or runtime logs
- **VERIFIED IN DATABASE** — Confirmed by schema/migration inspection
- **VERIFIED IN GIT HISTORY** — Confirmed by commit/comment evidence
- **INFERENCE** — Logical deduction from verified facts
- **UNRESOLVED** — Insufficient evidence to determine
- **BLOCKER** — Critical gap preventing implementation

---

# PART 1: THREE FOUNDATIONAL STATEMENTS

## Statement 1: Lifetime Cumulative Active Time

### Claim

For identity `(userId, navigationNodeId, blockId, blockVersion)`, `activeTimeSec` represents cumulative active time across ALL qualifying sessions.

Example:
```
Session 1 = 80 sec
Session 2 = 70 sec  
Session 3 = 65 sec
activeTimeSec = 215 sec
```

### Evidence Gathering

#### E1.1 — Frontend Emits Increments

**Source:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

**Finding:** 
```typescript
// Lines 290-324: Emit active time increment
// CRITICAL: activeTimeSec is an INCREMENT (delta), not cumulative
async emitActiveTime(...) {
  const payload = {
    blockId,
    blockVersion,
    activeTimeSec: safeIncrement,  // ← INCREMENT
    ...
  };
  
  await fetch('/api/tutorial/ils/block-active-time', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
```

**Classification:** VERIFIED IN SOURCE  
**Evidence:** File comment explicitly states "CRITICAL: activeTimeSec is an INCREMENT (delta), not cumulative"

---

#### E1.2 — Backend Treats as Increments

**Source:** `packages/db-tutorial/src/services/learning-progress.service.ts`

**Finding:**
```typescript
async recordBlockActiveTime(...) {
  // Service passes increment to repository
  const updated = await this.blockLearningStateRepository.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    activeTimeSec,  // ← Passed as-is (increment)
    ...
  });
}
```

**Classification:** VERIFIED IN SOURCE  
**Evidence:** Service does not accumulate, passes increment directly to repository

---

#### E1.3 — Repository Atomically Accumulates

**Source:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

**Finding:**
```sql
INSERT INTO block_learning_state (
  ...,
  active_time_sec
) VALUES (
  ...,
  ${activeTimeSec}
)
ON CONFLICT (...) DO UPDATE SET
  active_time_sec = block_learning_state.active_time_sec + EXCLUDED.active_time_sec,
  ...
```

**Classification:** VERIFIED IN DATABASE  
**Evidence:** SQL uses `+=` operator for atomic accumulation

---

#### E1.4 — No Session Reset

**Search:** `activeTimeSec = 0` OR `active_time_sec = 0` in upsert logic

**Finding:** NO reset found in:
- Session transitions
- Block transitions  
- Completion events
- Repository upsert logic

**Classification:** VERIFIED IN SOURCE (negative evidence)  
**Evidence:** No code path sets activeTimeSec to 0 after initial creation

---

#### E1.5 — No Block Transition Reset

**Source:** `BlockTelemetryProvider.tsx` transition logic

**Finding:**
```typescript
useEffect(() => {
  if (activeBlock) {
    // New block becomes active
    // Does NOT reset previous block's persisted time
  }
}, [activeBlock]);
```

**Classification:** VERIFIED IN SOURCE  
**Evidence:** Block A → B transition flushes A's time but does NOT reset A's database record

---

#### E1.6 — No Completion Reset

**Source:** `learning-progress.service.ts`

**Finding:**
```typescript
async recordBlockCompletion(...) {
  // Only writes to tutorial_navigation_progress
  await this.progressRepository.markBlockCompleted(event);
  
  // Does NOT touch block_learning_state.activeTimeSec
}
```

**Classification:** VERIFIED IN SOURCE  
**Evidence:** Completion does not modify activeTimeSec

---

#### E1.7 — Block Version Creates Separate Identity

**Source:** Schema unique index

**Finding:**
```sql
CREATE UNIQUE INDEX "uq_block_learning_state_identity" 
ON "block_learning_state" 
USING btree (
  "user_id",
  "navigation_node_id",
  "block_id",
  "block_version"  ← Part of identity
) 
WHERE "block_learning_state"."deleted_at" IS NULL;
```

**Classification:** VERIFIED IN DATABASE  
**Evidence:** `blockVersion` is part of unique constraint

---

#### E1.8 — Soft-Delete Behavior

**Source:** Repository `findByIdentity()` method

**Finding:**
```typescript
.where(
  and(
    eq(blockLearningState.userId, userId),
    eq(blockLearningState.navigationNodeId, navigationNodeId),
    eq(blockLearningState.blockId, blockId),
    eq(blockLearningState.blockVersion, blockVersion),
    isNull(blockLearningState.deletedAt)  ← Excludes soft-deleted
  )
)
```

**Classification:** VERIFIED IN SOURCE  
**Evidence:** Soft-deleted records excluded, new record starts at 0

---

### Statement 1 Verdict

**Status:** ✅ VERIFIED

**Conclusion:** Lifetime cumulative active time IS correctly implemented in current architecture.

**Supporting Evidence:**
1. Frontend emits increments (VERIFIED IN SOURCE)
2. Backend treats as increments (VERIFIED IN SOURCE)
3. Database atomically accumulates (VERIFIED IN DATABASE)
4. No session reset (VERIFIED IN SOURCE)
5. No block transition reset (VERIFIED IN SOURCE)
6. No completion reset (VERIFIED IN SOURCE)
7. Version isolation (VERIFIED IN DATABASE)
8. Soft-delete creates new identity (VERIFIED IN SOURCE)

**Caveats:**
- Multi-tab overlap can cause wall-clock overlap (see Audit H)
- Browser crash loses pending unflushed time
- Network retry deduplication depends on idempotency (see Audit C10)

---

## Statement 2: Initial Completion Uses Cumulative Active Time

### Claim

Before first completion:
```
completion threshold = expectedTimeSec × 0.70
```

Completion occurs when:
```
cumulative qualifying activeTimeSec >= 70% of canonical expectedTimeSec
```

Learner allowed to leave block before 70%. Multiple sessions may contribute.

### Evidence Gathering

#### E2.1 — Current Implementation Status

**Search:** 70% threshold check in recordBlockActiveTime

**Finding:** ❌ NOT IMPLEMENTED

**Evidence:** Searched all of:
- `LearningProgressService.recordBlockActiveTime()`
- `BlockLearningStateRepository.upsert()`
- `BlockTelemetryProvider` flush logic
- API route handlers

NO 70% threshold check found anywhere.

**Classification:** VERIFIED IN SOURCE (negative evidence)

---

#### E2.2 — Canonical expectedTimeSec Source

**Source:** `packages/types/src/tutorial-rich-document/blocks/content.ts`

**Finding:**
```typescript
export interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  
  /**
   * Expected time for learner to complete this block (in seconds)
   * 
   * SEMANTIC SCOPE: Instructional blocks only (D1, C1, S1, I1, O1)
   * - AI-generated at content authoring time
   * - Composer-validated and author-reviewable
   * - Published TutorialDocument is authoritative
   * - ILS compares actual vs expected time
   */
  expectedTimeSec?: number;  ← Optional field
}
```

**Classification:** VERIFIED IN SOURCE  
**Evidence:** Field exists in BaseBlock, explicitly documented as "Published TutorialDocument is authoritative"

---

#### E2.3 — expectedTimeSec in Database

**Source:** Schema `block_learning_state.ts`

**Finding:**
```typescript
expectedTimeSec: integer('expected_time_sec'),  // Nullable
```

**Classification:** VERIFIED IN DATABASE  
**Evidence:** Column exists, nullable

---

#### E2.4 — expectedTimeSec Flow (Canonical → Runtime)

**Question:** How does completion evaluation obtain canonical expectedTimeSec?

**Two Possible Architectures:**

**Model A — Persist in ILS:**
```
TutorialDocument
    ↓
expectedTimeSec
    ↓
block_learning_state.expected_time_sec (cached)
    ↓
completion calculation uses cached value
```

**Model B — Query at Evaluation Time:**
```
TutorialDocument (authoritative)
    ↓
LearningProgressService queries when needed
    ↓
completion calculation uses fresh canonical value
    ↓
block_learning_state.activeTimeSec
```

**Architectural Principle:**
> Tutorial owns canonical content; ILS owns learner learning state.

**Current State Investigation:**

**1. TutorialDocument Storage:**

**Source:** `packages/db-tutorial/src/schema/tutorial-sections.ts`

```typescript
content: jsonb('content').$type<TutorialDocument>().notNull(),
```

**Classification:** VERIFIED IN DATABASE  
**Evidence:** Published content stored in `tutorial_sections.content` (JSONB)

**2. BaseBlock Definition:**

**Source:** `packages/types/src/tutorial-rich-document/blocks/content.ts`

```typescript
export interface BaseBlock {
  id: string;
  expectedTimeSec?: number;  // Optional, documented as authoritative
}
```

**Classification:** VERIFIED IN SOURCE

**3. ILS Schema:**

**Source:** `packages/db-tutorial/src/schema/block-learning-state.ts`

```typescript
expectedTimeSec: integer('expected_time_sec'),  // Nullable
```

**Classification:** VERIFIED IN DATABASE  
**Evidence:** Column exists but purpose unclear (cache? unused? authoritative?)

**4. Write Path Search:**

**Searched:**
- recordBlockVisit()
- recordBlockActiveTime()  
- BlockLearningStateRepository.upsert()
- API schemas

**Finding:** NO code path writes expectedTimeSec from TutorialDocument to block_learning_state

**Classification:** VERIFIED IN SOURCE (negative evidence)

**5. Read/Query Path Search:**

**Question:** Does any service query TutorialDocument to extract expectedTimeSec?

**Searched:**
- LearningProgressService
- BlockLearningStateRepository
- ILSProvider (frontend)
- All references to TutorialDocument

**Finding:** NO service method extracts expectedTimeSec from published content

**Classification:** VERIFIED IN SOURCE (negative evidence)

---

### E2.4 Analysis

**Key Architectural Question:**

> Does 70% completion require `block_learning_state.expected_time_sec` to be populated, or should it query authoritative `TutorialDocument` at evaluation time?

**Evidence for Model A (Persist in ILS):**
- Column exists in schema
- Faster evaluation (no JSONB query)
- Already available if populated

**Evidence for Model B (Query Canonical):**
- Preserves "Tutorial owns content" principle
- Always uses current published value
- No synchronization/staleness issues
- Consistent with "completed_blocks[]" being authoritative source

**Current State:** NEITHER MODEL IMPLEMENTED

**Gap:** No runtime path from canonical content → completion evaluation

**Classification:** 🔴 IMPLEMENTATION GAP (not blocker until architectural choice made)

**Required Investigation:**

Before classifying as blocker, must determine:
1. Is `block_learning_state.expected_time_sec` intended as cache or unused?
2. Should completion query TutorialDocument directly?
3. How should version changes affect expectedTimeSec?
4. What happens if published content updates expectedTimeSec?

**Continuing to trace complete provenance...**

---

#### E2.5 — Multi-Session Accumulation

**Test:** Can sessions contribute partial time toward threshold?

**Scenario:**
```
Expected = 300 sec
Threshold = 210 sec

Session 1: 100 sec
Session 2: 80 sec
Session 3: 30 sec
Total: 210 sec → completion eligible
```

**Finding:** Architecture SUPPORTS this if threshold check implemented

**Evidence:**
- activeTimeSec accumulates across sessions (Statement 1 verified)
- No session reset (verified E1.4)
- Threshold check would evaluate cumulative value

**Classification:** INFERENCE (architecture supports, not implemented)

---

### Statement 2 Verdict

**Status:** 🔴 BLOCKED

**Blocker:** expectedTimeSec flow from canonical content → database NOT IMPLEMENTED

**Architectural Compatibility:** ✅ YES (if gap filled)

**Supporting Evidence:**
1. Cumulative activeTimeSec works (Statement 1 verified)
2. expectedTimeSec field exists in schema (VERIFIED IN DATABASE)
3. expectedTimeSec documented in BaseBlock (VERIFIED IN SOURCE)
4. Multi-session accumulation supported (INFERENCE)

**Gaps:**
1. 🔴 **BLOCKER:** No runtime path: TutorialDocument.blocks[].expectedTimeSec → block_learning_state.expected_time_sec
2. 70% threshold check not implemented (expected, this is proposal audit)
3. Completion trigger mechanism not implemented (expected, this is proposal audit)

**Required for Implementation:**
1. Service method to extract expectedTimeSec from TutorialDocument
2. Flow: subtopicId + blockId → find section → parse JSONB → extract block → return expectedTimeSec
3. Pass expectedTimeSec to repository during first upsert
4. Add 70% threshold check in recordBlockActiveTime()

---

## Statement 3: Revision Must NOT Use Lifetime Cumulative Time Directly

### Claim

After completion, lifetime activeTimeSec continues accumulating.  
It must NOT be reset.  
Revision cannot evaluate: `activeTimeSec >= revisionThreshold`  
because lifetime already exceeds initial threshold.

Revision must measure qualifying active time attributable to post-completion revision period/session.

### Evidence Gathering

#### E3.1 — Current Revision Logic

**Source:** `BlockLearningStateRepository.upsert()` lines 320-331

**Finding:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND block_learning_state.completedAt IS NOT NULL
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**Classification:** VERIFIED IN SOURCE

**Analysis:**
- Revision triggers on: new session + completedAt NOT NULL
- Does NOT check active time
- Does NOT check any threshold
- Increments immediately on first visit of new session after completion

---

#### E3.2 — Revision Uses Session Boundary Only

**Finding:** Current revision logic DOES NOT use activeTimeSec at all

**Evidence:**
- No `activeTimeSec` comparison in revision CASE
- Only checks `lastSessionId` change and `completedAt` existence
- No threshold evaluation

**Classification:** VERIFIED IN SOURCE

---

#### E3.3 — Proposed Revision Semantics

**Question:** What SHOULD revision mean?

**User Instruction States:**
> A revision must require:
> - block already completed
> - new qualifying revision period/session  
> - revision active-time threshold reached

**Current Implementation:** Only checks first two conditions, NOT third

**Classification:** PRODUCT DECISION REQUIRED

---

#### E3.4 — Schema Supports Revision-Period Tracking?

**Current Schema:**
```typescript
activeTimeSec: integer      // Lifetime cumulative
revisionCount: integer       // Count of revisions
completedAt: timestamp       // First completion timestamp
lastSessionId: text         // Current session
```

**Question:** Can we calculate "active time in current revision period"?

**Analysis:**

**Option A:** Use lifetime activeTimeSec
```
Problem: Lifetime already exceeds initial threshold
Cannot distinguish: "still working on initial" vs "revision in progress"
```

**Option B:** Add activeTimeSecAtLastMilestone
```sql
active_time_since_milestone = 
  current_activeTimeSec - activeTimeSecAtLastMilestone
```

**Option C:** Separate revision_active_time_sec column
```
Reset on each revision milestone
Accumulate during revision period
```

**Option D:** Use session-based time windows
```
Track activeTimeSec per session
Evaluate revision threshold on per-session basis
```

**Finding:** Current schema does NOT provide mechanism to track revision-period active time

**Classification:** 🔴 SCHEMA/STATE-MODEL BLOCKER

---

#### E3.5 — What Happens After Initial Completion?

**Scenario:**
```
Expected: 300 sec
Initial threshold: 210 sec (70%)

Session 1: 100 sec
Session 2: 110 sec → completion at 210 sec
Session 3: 50 sec → lifetime now 260 sec
Session 4: 40 sec → lifetime now 300 sec
```

**Questions:**
1. When does Session 3 trigger revision? (immediately on first visit? after threshold?)
2. What is Session 3's threshold? (same 70%? different? fixed duration?)
3. When does Session 4 trigger another revision?
4. Can revision trigger multiple times in same session?

**Current Implementation:** Session 3 triggers revision immediately (no threshold)

**Proposed Model:** Requires revision-period threshold

**Gap:** No state to track "active time since last revision"

**Classification:** 🔴 BLOCKER

---

### Statement 3 Verdict

**Status:** 🔴 BLOCKED

**Blocker 1:** Current schema cannot track revision-period active time

**Blocker 2:** Revision semantics undefined (immediate vs threshold-based)

**Current State:**
- Revision uses session boundary + completedAt only (VERIFIED IN SOURCE)
- No active-time threshold for revision (VERIFIED IN SOURCE)
- No mechanism to track period-specific active time (VERIFIED IN DATABASE)

**Architectural Question:**

If revision requires threshold (e.g., 30% of expected time per revision period):

**Required State:**
```
Option A: activeTimeSecAtLastMilestone
Option B: revisionActiveTimeSec (resets on milestone)
Option C: sessionActiveTimeSec[] (per-session tracking)
Option D: Something else
```

**None of these exist in current schema.**

**Product Decision Required:**
1. Should revision be immediate (current) or threshold-based (proposed)?
2. If threshold-based, what threshold? (70%? 30%? fixed duration?)
3. If threshold-based, what state model supports it?

---

# PART 2: CRITICAL AUDIT A — EXISTING COMPLETION PATH

## A1: Replace vs Coexist?

### Question
Is proposed 70% automatic completion intended to:
- REPLACE explicit completion?
- COEXIST with explicit completion?
- Make explicit completion one of multiple mechanisms?

### Investigation

#### Current Explicit Completion Path

**Source:** Git history + current implementation

**Path:**
```
??? → recordBlockCompletion()
       ↓
    LearningProgressService.recordBlockCompletion()
       ↓
    TutorialNavigationProgressRepository.markBlockCompleted()
       ↓
    tutorial_navigation_progress.completed_blocks[]
```

#### Frontend Caller Search

**Search:** Production UI code calling `/api/tutorial/ils/block-completion`

**Method:** Searched all frontend/UI packages for:
- `fetch` calls to `block-completion`
- Button handlers with "complete"
- Form submissions
- Any explicit completion triggers

**Finding:** ❌ NO PRODUCTION UI CALLER FOUND

**Evidence:**
- `BlockTelemetryProvider.tsx`: Does NOT call block-completion
- `ILSProvider.tsx`: Does NOT call block-completion  
- `ActiveBlockContext.tsx`: Does NOT call block-completion
- Tutorial UI components: NO completion buttons found
- No "mark complete" affordances found

**Classification:** VERIFIED IN SOURCE (negative evidence)

---

#### API Route Exists

**Source:** 
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts`
- `apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts`
- `apps/api-server/src/app/api/tutorial/ils/block-completion/route.ts`

**Finding:** ✅ API routes EXIST and are implemented

**Evidence:** BFF proxies + centralized API server endpoint operational

**Classification:** VERIFIED IN SOURCE

---

#### Tests Call It

**Finding:** Service tests and Phase D diagnostic scripts call `recordBlockCompletion()`

**Evidence:**
- `learning-progress.service.test.ts`: Multiple test cases
- `_gate_3c1r_diagnose_completion_revision.ts`: Diagnostic uses it
- Phase D test scenarios: Use it for completion testing

**Classification:** VERIFIED IN SOURCE

**Analysis:** Test/diagnostic usage does NOT prove production runtime usage

---

### A1 Verdict

**Finding:** 🔴 EXPLICIT COMPLETION HAS NO PRODUCTION CALLER

**Status:** UNRESOLVED (architectural intent unclear)

**Evidence:**
1. API endpoint exists (VERIFIED IN SOURCE)
2. Service method exists (VERIFIED IN SOURCE)
3. Repository method exists (VERIFIED IN SOURCE)
4. NO UI caller found (VERIFIED IN SOURCE - negative evidence)
5. Only test/diagnostic usage (VERIFIED IN SOURCE)

**Interpretation Options:**

**Option 1:** Explicit completion is FUTURE/UNIMPLEMENTED feature
- API built but UI not yet connected
- 70% would be FIRST completion mechanism

**Option 2:** Explicit completion was REMOVED/DISABLED
- Previously existed, now dormant
- 70% would REPLACE it

**Option 3:** Explicit completion is ADMIN/SPECIAL-CASE only
- Not for normal learner flow
- 70% would be normal path

**Classification:** 🟡 PRODUCT DECISION REQUIRED

**Recommendation:** Clarify explicit completion intent before implementing 70%

---

## A2: Completion Rule (OR vs Exclusive)

### Question
If they coexist, is the rule:
```
completed = explicit completion OR 70% threshold
```

### Finding

**Status:** CANNOT DETERMINE (depends on A1 resolution)

**If coexist (Option 1):**
```typescript
completed = 
  (explicitCompletion === true) OR
  (activeTimeSec >= expectedTimeSec × 0.70)
```

**If replace (Option 2):**
```typescript
completed = 
  (activeTimeSec >= expectedTimeSec × 0.70)
// No explicit path
```

**Classification:** UNRESOLVED (blocked by A1)

---

## A3: Explicit Before 70%

### Scenario
```
Expected: 300 sec
Threshold: 210 sec
Current: 150 sec

Explicit completion triggered
```

### Question
What happens?

### Analysis

**If coexist:**
- Explicit completion succeeds
- Block marked complete at 150 sec
- Never reaches 70% threshold
- Result: Completed (explicit path)

**If 70% only:**
- Explicit completion API exists but unused
- Test-only scenario

**Classification:** UNRESOLVED (depends on A1)

---

## A4: 70% Before Explicit

### Scenario
```
Expected: 300 sec
Threshold: 210 sec
Current: 210 sec (automatic completion triggered)

Later: Explicit completion attempted
```

### Question
What happens?

### Analysis

**Repository-Level Idempotency:**

Current `markBlockCompleted()` uses JSONB containment check:
```typescript
// Prevents duplicate entries
if (!completed_blocks.contains(blockId, blockVersion)) {
  append to array
}
```

**Finding:** VERIFIED IN SOURCE - repeated calls to existing explicit completion path do not create duplicates

**Cross-Mechanism Race:** UNVERIFIED

**Reason:** Automatic 70% completion does not exist yet, so the race between automatic and explicit cannot be runtime-verified.

**Classification:** 
- Repository idempotency: VERIFIED IN SOURCE
- Automatic-vs-explicit concurrency: UNVERIFIED (mechanism doesn't exist)

---

## A5: Simultaneous Completion

### Scenario
```
70% threshold reached
+
Explicit completion clicked
~same time
```

### Question
Race condition behavior?

### Analysis

**Repository uses atomic JSONB append:**
```sql
ON CONFLICT DO UPDATE SET
  completed_blocks = CASE
    WHEN NOT completed_blocks @> new_block::jsonb
    THEN completed_blocks || new_block::jsonb
    ELSE completed_blocks
  END
```

**Finding:** VERIFIED IN SOURCE - atomic database operation prevents duplicate entries

**Cross-Mechanism Synchronization:** UNVERIFIED

**Reason:** 
- Repository-level atomic writes are proven
- Synchronization to `block_learning_state.completedAt` not implemented
- Two-table consistency under concurrent automatic + explicit not proven

**Classification:**
- Single-table atomicity: VERIFIED IN SOURCE
- Cross-mechanism race safety: UNVERIFIED (automatic mechanism doesn't exist)
- Two-table synchronization: NOT IMPLEMENTED

---

## A6: Authoritative Source

### Question
Which is authoritative?
- `tutorial_navigation_progress.completed_blocks[]`
- `block_learning_state.completedAt`

### Investigation

#### Schema Intent

**Source:** Git commit fe005a51 (found in previous audit)

**Finding:**
```typescript
/**
 * - completedAt: Denormalized completion timestamp
 *   (authoritative source: tutorial_navigation_progress.completed_blocks)
 */
completedAt: timestamp('completed_at', { mode: 'date' }),
```

**Classification:** VERIFIED IN GIT HISTORY

**Conclusion:** `completed_blocks[]` is AUTHORITATIVE, `completedAt` is DENORMALIZED

---

#### Current Synchronization

**Source:** `LearningProgressService.recordBlockCompletion()`

**Finding:**
```typescript
async recordBlockCompletion(...) {
  const updated = await this.progressRepository.markBlockCompleted(event);
  // ← Writes to completed_blocks[]
  
  // Does NOT write to block_learning_state.completedAt
  return this.toDTO(updated, requiredBlocks, []);
}
```

**Classification:** VERIFIED IN SOURCE

**Gap:** Synchronization NOT IMPLEMENTED (Phase D blocker confirmed)

---

### A6 Verdict

**Authoritative Source:** `tutorial_navigation_progress.completed_blocks[]`

**Classification:** VERIFIED IN GIT HISTORY + VERIFIED IN SOURCE

**Current State:** 
- ✅ Writes to authoritative source
- ❌ Does NOT sync to denormalized copy
- 🔴 BLOCKER for revision (depends on denormalized copy)

---

## A7: Production Caller for Explicit Completion

### Question
Does the existing system have a production caller capable of generating block_complete events for normal D1/C1/X1 learner interaction?

### Investigation

**Method:** Comprehensive search of UI layer

**Searched:**
- `packages/ui/**/*.{ts,tsx}` — NO caller found
- `apps/*/src/**/*.{ts,tsx}` — NO caller found (except BFF proxies)
- Button handlers — NO "complete" buttons found
- Form submissions — NO completion forms found

**Finding:** ❌ NO PRODUCTION UI CALLER EXISTS

**Evidence Type:** VERIFIED IN SOURCE (negative evidence from exhaustive search)

---

### A7 Verdict

**Finding:** NO NORMAL PRODUCTION LEARNER-FACING CALLER FOUND

**Status:** VERIFIED IN SOURCE (negative evidence from exhaustive search)

**Evidence:**
1. API endpoint exists and is implemented
2. Service method exists and is tested
3. NO UI caller found in production runtime code
4. Only test/diagnostic code calls it

**Possible Interpretations:**
- Dormant/future capability
- Intentionally backend-only mechanism
- Legacy mechanism (removed from UI)
- Planned future enhancement
- Admin/special-case only

**Classification:** 🟡 PRODUCT-ARCHITECTURE DECISION REQUIRED

**Note:** Do NOT conclude that 70% should be primary mechanism based on this finding alone. The architectural role of explicit completion remains UNRESOLVED until design intent is clarified.

---

## A8: Is 70% NEW vs Existing?

### Question
Determine whether the 70% model is NEW product behavior or already-existing requirement.

### Investigation

#### Documentation Search

**Searched:**
- Product requirements docs
- Design docs
- Comments referring to completion rules
- Educational science references

**Finding:** NO documentation of existing 70% requirement

---

#### Code Comments

**Source:** BaseBlock interface comment

**Finding:**
```typescript
/**
 * Expected time for learner to complete this block (in seconds)
 * 
 * - ILS compares actual vs expected time
 */
expectedTimeSec?: number;
```

**Analysis:** Comment says "compares" but does not specify 70% threshold

**Classification:** INFERENCE (comparison purpose unclear)

---

#### Historical Git Commits

**Search:** "70%" OR "seventy percent" OR "completion threshold" in commit messages

**Finding:** NO commits referencing 70% rule

**Classification:** VERIFIED IN GIT HISTORY (negative evidence)

---

### A8 Verdict

**Finding:** 70% completion IS NEW PROPOSED BEHAVIOR

**Status:** VERIFIED (negative evidence from documentation + git history + code)

**Evidence:**
1. No existing 70% implementation (VERIFIED IN SOURCE)
2. No documentation of 70% requirement (searched)
3. No git history of 70% (VERIFIED IN GIT HISTORY)
4. BaseBlock comment mentions "compare" but not threshold (VERIFIED IN SOURCE)
5. User explicitly proposed this model (context)

**Classification:** NEW FEATURE (not restoration of existing behavior)

**Implication:** This is PRODUCT DESIGN decision, not engineering bug fix

---

# CRITICAL AUDIT A — SUMMARY

| Question | Finding | Evidence Type | Decision Needed? |
|----------|---------|---------------|------------------|
| A1: Replace vs coexist? | No production explicit caller exists | VERIFIED IN SOURCE | 🟡 YES |
| A2: Completion rule | Cannot determine (blocked by A1) | UNRESOLVED | 🟡 YES |
| A3: Explicit before 70% | Scenario is theoretical (no caller) | INFERENCE | 🟡 YES |
| A4: 70% before explicit | Idempotent (no duplicate) | VERIFIED IN SOURCE | ✅ NO |
| A5: Simultaneous | Atomic JSONB prevents duplicates | VERIFIED IN SOURCE | ✅ NO |
| A6: Authoritative source | completed_blocks[] (completedAt denormalized) | VERIFIED IN GIT HISTORY | ✅ NO |
| A7: Production caller | Does NOT exist | VERIFIED IN SOURCE | 🔴 CRITICAL |
| A8: New vs existing | NEW proposed behavior | VERIFIED | ✅ NO |

**Critical Finding:** Explicit completion has NO production UI caller. The "explicit vs automatic" question is currently theoretical.

**Recommendation:** 70% automatic completion should be designed as PRIMARY completion mechanism, with explicit completion as future optional enhancement.

---

# STATUS: AUDIT CONTINUING

**Next Sections:**
- B: Canonical expectedTimeSec (partial - found blocker)
- C: Active-Time Trust Model (C1-C14)
- D-I: Remaining audit points

**Current Blockers Identified:**
1. 🔴 expectedTimeSec flow: TutorialDocument → database (Statement 2)
2. 🔴 Revision-period tracking: No schema support (Statement 3)
3. 🔴 Explicit completion: No production caller (Audit A7)
4. 🟡 Completion coexistence: Product decision required (Audit A1)

**Time Estimate:** ~40% complete

Continuing audit...
