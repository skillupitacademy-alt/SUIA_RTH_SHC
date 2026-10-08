# GATE 3C.1R — CORRECTIVE BLOCK TELEMETRY FIX, VERIFICATION & RE-AUDIT

## AUTHENTICATIONANDAUTHORIZATION PROJECT

**Date:** 2026-09-09  
**Parent Gate:** Gate 3C.1 — Universal Block Telemetry & Contract Audit  
**Current Verdict:** 🟡 YELLOW  
**Current Contract Status:** NOT FROZEN  
**Current Operational Status:** BLOCKED  
**Purpose:** Resolve the blockers identified by Gate 3C.1, verify the complete block telemetry path, re-audit the affected areas, and determine whether the `ILSActiveBlockProgress` contract is finally eligible for freeze.

---

# 0. READ THIS FIRST — ABSOLUTE CONTROL RULE

The previous Gate 3C.1 audit has already established that the **architecture is fundamentally universal**.

It found:

* no D1/C1-specific telemetry branching
* generic block identity propagation
* generic expected-time handling
* generic visit telemetry
* generic active-time telemetry
* generic repository structure
* generic Composer integration
* architectural X1 universality

However, the audit returned:

> 🟡 YELLOW — DO NOT FREEZE

because two implementation blockers remain:

1. PostgreSQL `42P10` blocks the telemetry write path.
2. The block-level telemetry read path is incomplete.

This corrective gate exists ONLY to resolve and verify those blockers.

---

# 1. PRIMARY OBJECTIVE

The objective is NOT:

> "Make RSSB work."

The objective is:

> Establish a verified, universal block-learning telemetry path that works for D1, C1, and future block types without block-specific telemetry implementation.

The required architecture remains:

```text
Tutorial Composer
       ↓
TutorialDocument.blocks[]
       ↓
UBRC-compatible block
       ↓
DOM block identity
       ↓
ActiveBlockContext
       ↓
BlockTelemetryProvider
       ↓
ILS block telemetry API
       ↓
LearningProgressService
       ↓
BlockLearningStateRepository
       ↓
block_learning_state
       ↓
Navigation / block-progress read path
       ↓
ILSProvider
       ↓
ILSActiveBlockProgress
       ↓
RSSB
       ↓
LSNB
```

Do not reverse this order.

---

# 2. CURRENT VERIFIED BASELINE

The previous Gate 3C.1 audit concluded:

### Architecture

```text
UNIVERSAL = PASS
```

### X1

```text
X1 UNIVERSALITY = PASS ARCHITECTURALLY
```

### Contract

```text
ILSActiveBlockProgress = NOT YET FROZEN
```

### Operational state

```text
WRITE PATH = BLOCKED
READ PATH  = INCOMPLETE
```

### Known blockers

```text
BLOCKER 1
PostgreSQL 42P10
        ↓
block telemetry writes fail

BLOCKER 2
Missing block-level read exposure
        ↓
ILSProvider cannot reliably resolve
activeBlockProgress
```

Do not reopen the entire architecture unless new evidence demonstrates an architectural flaw.

---

# 3. HARD SAFETY RULES

## 3.1 DO NOT IMPLEMENT RSSB

Do NOT:

* build the RSSB UI
* redesign RSSB
* convert the RSSB prototype
* add RSSB components
* add RSSB styling
* add RSSB metrics rendering
* connect RSSB to the API

RSSB implementation is downstream of this corrective gate.

---

## 3.2 DO NOT FREEZE THE CONTRACT YET

Do NOT mark:

```text
ILSActiveBlockProgress
```

as frozen until:

1. database write path is verified
2. read path is verified
3. D1 write/read is verified
4. C1 write/read is verified
5. affected audits are re-run
6. no critical blocker remains
7. contract fields and semantics are confirmed against actual implementation

---

## 3.3 DO NOT CREATE BLOCK-SPECIFIC TELEMETRY

Do NOT create:

```text
recordD1Visit()
recordC1Visit()

recordD1ActiveTime()
recordC1ActiveTime()

D1TelemetryService
C1TelemetryService

D1Repository
C1Repository

D1 API
C1 API
```

The previous audit specifically established that this architecture is universal.

Preserve that property.

---

## 3.4 DO NOT CREATE A SECOND TELEMETRY SYSTEM

Do not introduce:

* another telemetry provider
* another block state table
* another block progress repository
* another session tracker
* another active-time tracker
* another block identity mechanism

Reuse the existing architecture unless source evidence proves that a minimal correction is necessary.

---

# 4. REQUIRED PHASE A — RE-INSPECT BEFORE MODIFYING

Before changing anything, inspect the actual current repository.

At minimum inspect:

```text
packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx

packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx

packages/ui/src/tutorial/runtime/ILSProvider.tsx

packages/db-tutorial/src/services/learning-progress.service.ts

packages/db-tutorial/src/repositories/block-learning-state.repository.ts

packages/db-tutorial/src/schema/block-learning-state.ts

packages/db-tutorial/migrations/

apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts

apps/api-server/src/app/api/tutorial/ils/block-active-time/route.ts

apps/api-server/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts
```

Also inspect:

* existing tests
* existing migration history
* existing database configuration
* current schema generation
* current Drizzle definitions
* current API DTOs
* current Composer block envelope

Do not assume the previous audit's proposed implementation is necessarily correct.

The repository as it exists NOW is authoritative.

---

# 5. REQUIRED PHASE B — FIX BLOCKER 1: POSTGRESQL 42P10

## 5.1 Reproduce or verify the failure

First determine exactly what PostgreSQL currently receives.

Inspect the generated SQL for:

```text
BlockLearningStateRepository.upsert()
```

Specifically inspect:

```typescript
.onConflictDoUpdate({
    target: [
        blockLearningState.userId,
        blockLearningState.navigationNodeId,
        blockLearningState.blockId,
        blockLearningState.blockVersion,
    ],
    targetWhere: ...
})
```

Determine:

1. exact conflict target
2. exact predicate
3. actual database object
4. whether the database object is an index or constraint
5. whether PostgreSQL can legally infer that object for the generated `ON CONFLICT`
6. whether Drizzle's generated SQL matches the intended PostgreSQL conflict target

---

# 6. IMPORTANT DATABASE CORRECTION SAFEGUARD

The previous audit report proposed a construct conceptually equivalent to:

```sql
ALTER TABLE ...
ADD CONSTRAINT ...
UNIQUE (...)
WHERE deleted_at IS NULL;
```

DO NOT blindly execute that SQL.

Before creating a migration, independently verify actual PostgreSQL support for:

* partial unique indexes
* unique constraints
* `ON CONFLICT (...)`
* `ON CONFLICT (...) WHERE ...`
* conflict-target inference
* Drizzle's `targetWhere`

The goal is NOT to make the audit report's proposed SQL appear in the repository.

The goal is:

> Produce a PostgreSQL-valid schema/repository pairing in which the actual `ON CONFLICT` statement correctly matches the intended uniqueness semantics.

If the correct solution is to preserve a partial unique index and modify the conflict target, do that.

If the correct solution requires changing the schema representation, do that.

If the correct solution requires changing the Drizzle conflict declaration, do that.

But:

**DO NOT change both sides blindly.**

First establish the exact PostgreSQL semantics.

---

# 7. DATABASE UNIQUENESS REQUIREMENT

The intended logical identity remains:

```text
user_id
+
navigation_node_id
+
block_id
+
block_version
```

for non-deleted rows.

The intended soft-delete behavior is:

```text
deleted_at IS NULL
```

for the active identity.

Preserve this semantic unless source evidence demonstrates that the existing architecture intended something different.

The fix must preserve:

* active-row uniqueness
* soft-delete behavior
* historical deleted records
* concurrent upsert correctness
* session-aware visit increments
* active-time increments
* revision semantics

---

# 8. DATABASE FIX ACCEPTANCE TESTS

After implementing the migration/repository correction, verify all of the following.

### Test A — First D1 visit

```text
D1
new session
first visit
```

Expected:

```text
record created
visitCount = 1
lastSessionId = current session
firstViewedAt populated
lastViewedAt populated
expectedTimeSec populated when authored
```

---

### Test B — Same-session D1 revisit

Send another visit using the same session.

Expected:

```text
visitCount does NOT increment
```

---

### Test C — New-session D1 visit

Use a different session.

Expected:

```text
visitCount increments by 1
lastSessionId changes
```

---

### Test D — D1 active time

Send valid active-time increment.

Expected:

```text
activeTimeSec increases atomically
```

---

### Test E — C1 visit

Perform the same write-path test for C1.

Expected:

```text
same generic persistence mechanism
no C1-specific code
```

---

### Test F — C1 active time

Expected:

```text
activeTimeSec increases
no C1-specific implementation
```

---

### Test G — concurrency

Where practical, execute concurrent writes against the same block identity.

Verify:

```text
no duplicate active rows
no lost atomic increments
no 42P10
no race-created duplicate identity
```

---

# 9. REQUIRED PHASE C — FIX BLOCKER 2: READ PATH

The existing repository already contains block-state read capabilities.

Do not create a parallel read system.

Determine the cleanest universal path for exposing block metrics through the existing navigation/progress hierarchy.

The preferred architectural shape remains:

```text
BlockLearningStateRepository
        ↓
LearningProgressService
        ↓
Navigation Progress API
        ↓
ILSProvider
        ↓
activeBlockProgress
```

---

# 10. READ PATH REQUIREMENTS

The navigation/progress response must be capable of exposing, for each relevant block:

```typescript
{
    blockId: string;
    blockVersion: string;
    visitCount: number;
    revisionCount: number;
    activeTimeSec: number;
    expectedTimeSec: number | null;
    firstViewedAt: Date | null;
    lastViewedAt: Date | null;
    completedAt: Date | null;
}
```

Do not automatically add fields merely because they were proposed in the audit.

Confirm each field against:

* actual database schema
* actual service semantics
* actual API needs
* actual ILSProvider requirements

---

# 11. READ PATH IMPLEMENTATION REQUIREMENT

If a repository method such as:

```typescript
getBlocksForNode(userId, navigationNodeId)
```

is required, implement it using the existing repository conventions.

It must respect:

```text
user identity
navigation node identity
soft deletion
existing error handling
existing DB abstraction
existing repository conventions
```

Do not bypass the repository with direct database access from the UI or API route.

---

# 12. SERVICE LAYER REQUIREMENT

Enhance the existing:

```text
LearningProgressService
```

rather than creating another progress service.

The service should obtain block metrics through the existing repository.

The final response must remain compatible with the existing navigation-progress architecture.

Do not break existing page-level metrics.

Do not remove:

```text
completedBlocks[]
```

or existing navigation fields.

---

# 13. API REQUIREMENT

Enhance the existing navigation/progress endpoint where appropriate.

Do NOT create one API request per visible block.

Preferred architecture:

```text
GET navigation progress
        ↓
page-level progress
+
block-level progress
```

This provides the ILSProvider with the page's complete block-learning state in one logical read.

---

# 14. ILSPROVIDER REQUIREMENT

Only after the backend read path is verified should the project AI inspect the existing:

```text
ILSProvider
```

Determine how the active block is matched against returned block metrics.

Matching must use canonical identity:

```text
blockId
+
blockVersion
```

Do not match merely by:

```text
blockType
```

Do not introduce D1/C1 branches.

The conceptual mapping is:

```text
activeBlock
      ↓
find matching blockId + blockVersion
      ↓
block progress
      ↓
activeBlockProgress
```

If no persisted record exists yet, establish the correct zero/default representation according to the actual contract and existing application conventions.

Do not invent fallback values for expected time.

---

# 15. EXPECTED TIME RULE

`expectedTimeSec` must remain content-driven.

The authoritative conceptual flow is:

```text
TutorialDocument.blocks[]
        ↓
expectedTimeSec
        ↓
published tutorial content
        ↓
recordBlockVisit()
        ↓
block_learning_state.expected_time_sec
```

Do NOT introduce:

```text
D1 = X seconds
C1 = Y seconds
```

Do NOT create a block-type expected-time registry.

Do NOT synthesize expected time when authored content does not provide it.

Nullable remains valid:

```typescript
expectedTimeSec: number | null
```

---

# 16. COMPLETION RULE

Preserve the existing completion architecture.

The audit established that:

```text
tutorial_navigation_progress.completed_blocks
```

is an important source in the current implementation and:

```text
block_learning_state.completed_at
```

is a denormalized block-level representation.

Do not silently redesign completion semantics during this corrective gate.

If the population mechanism for `completed_at` remains outside this gate's scope, document that fact explicitly.

---

# 17. VISIT SEMANTICS

Preserve:

> A visit is the first observation of a block within a session.

Therefore:

```text
first visit ever
    → visitCount +1

same block + same session
    → no increment

same block + new session
    → visitCount +1
```

The implementation must remain atomic.

---

# 18. REVISION SEMANTICS

Preserve:

> A revision is a return visit to a completed block in a new session.

Therefore:

```text
new session
+
previously completed
=
revisionCount +1
```

But:

```text
same session
=
no revision increment
```

and:

```text
new session
+
incomplete block
=
no revision increment
```

Do not change these semantics merely to make tests pass.

---

# 19. ACTIVE TIME SEMANTICS

Preserve the existing active-time model.

Verify:

```text
BlockTelemetryProvider
        ↓
pending active-time queue
        ↓
block-active-time API
        ↓
LearningProgressService
        ↓
atomic repository increment
```

Verify that failed flushes remain recoverable according to the existing queue behavior.

Do not create block-type-specific timers.

---

# 20. D1 + C1 VERIFICATION MATRIX

After both blockers are addressed, execute this matrix.

| Test                        | D1 | C1 | Expected            |
| --------------------------- | -- | -- | ------------------- |
| Render                      | ✅  | ✅  | generic             |
| Active detection            | ✅  | ✅  | generic             |
| First visit                 | ✅  | ✅  | count = 1           |
| Same-session revisit        | ✅  | ✅  | no increment        |
| New-session visit           | ✅  | ✅  | increment           |
| Active time                 | ✅  | ✅  | atomic increment    |
| Expected time               | ✅  | ✅  | content-driven      |
| Completion mapping          | ✅  | ✅  | generic             |
| Revision                    | ✅  | ✅  | session-aware       |
| API read                    | ✅  | ✅  | metrics returned    |
| ILSProvider mapping         | ✅  | ✅  | activeBlockProgress |
| No block-specific telemetry | ✅  | ✅  | zero special cases  |

Every result must contain evidence.

---

# 21. X1 UNIVERSALITY RE-VERIFICATION

Do not create permanent X1 production code merely to pass this test.

Use a hypothetical or test fixture if sufficient.

Verify the complete chain:

```text
X1
 ↓
generic TutorialDocument.blocks[]
 ↓
generic DOM identity
 ↓
ActiveBlockContext
 ↓
BlockTelemetryProvider
 ↓
generic API
 ↓
LearningProgressService
 ↓
BlockLearningStateRepository
 ↓
database
 ↓
generic read path
 ↓
ILSProvider
 ↓
activeBlockProgress
```

The required result is:

```text
X1-specific telemetry code = ZERO
```

If X1 requires:

```text
if blockType === "X1"
```

inside telemetry, persistence, read-path mapping, or ILS block-progress logic:

STOP.

Do not freeze the contract.

Report the architectural violation.

---

# 22. RE-AUDIT REQUIREMENT

After fixes, re-run at minimum the affected Gate 3C.1 audits:

```text
Audit 2  — Metric Matrix
Audit 7  — Active Time Semantics
Audit 8  — Read Path
Audit 11 — Visit Semantics
Audit 12 — NULL/Default Semantics
Audit 13 — Database + Concurrency
Audit 14 — API Serialization
Audit 16 — Operational Verification
```

Also re-confirm:

```text
Audit 1  — Telemetry Producer Path
Audit 9  — UBRC Participation
Audit 10 — Expected Time Propagation
Audit 15 — Composer Integration
Audit 17 — Test Coverage
Audit 18 — X1 Lifecycle
```

Do not merely change the previous report from:

```text
FAIL
```

to:

```text
PASS
```

without new evidence.

---

# 23. FOUR-STATE CLASSIFICATION

For every relevant subsystem, explicitly classify:

```text
EXISTS
GENERIC
VERIFIED WORKING
READY FOR CONTRACT
```

Example:

```text
BlockTelemetryProvider

EXISTS       = YES
GENERIC      = YES
VERIFIED     = YES/NO
READY        = YES/NO
```

A subsystem cannot be marked:

```text
READY FOR CONTRACT
```

until it is demonstrably operational.

---

# 24. EVIDENCE STANDARD

Every conclusion must contain:

```text
SOURCE
→ FILE
→ FUNCTION / METHOD
→ RELEVANT CODE
→ TEST / RUNTIME EVIDENCE
→ CONCLUSION
```

Do not write:

> "The read path works."

Write:

> "Navigation API now obtains block state through X, serializes Y fields, the D1/C1 integration test returned Z, and ILSProvider resolved the matching block using blockId + blockVersion."

Do not write:

> "Database fixed."

Write:

> "The migration defines X, the repository generates Y, PostgreSQL accepts the conflict target, D1 and C1 writes completed successfully, and the resulting rows contain Z."

---

# 25. NO UNRELATED CLEANUP

During this gate:

DO NOT:

* refactor unrelated code
* rename unrelated APIs
* redesign Composer
* redesign D1
* redesign C1
* redesign LSNB
* redesign the Universal Learner Page
* upgrade unrelated dependencies
* modify unrelated database tables
* fix unrelated lint issues unless required for this gate
* change visual design

Keep the diff narrowly scoped to the two identified blockers and their required verification.

---

# 26. MIGRATION SAFETY

Before applying any database migration:

1. inspect migration ordering
2. inspect current production/development schema state
3. inspect whether the named object already exists
4. determine whether the migration is idempotent where project conventions require it
5. ensure no duplicate constraint/index is created
6. ensure rollback implications are understood
7. run the project's normal migration/test workflow

Do not modify an old migration if project conventions require forward-only migrations.

Prefer a new migration where appropriate.

---

# 27. STOP CONDITIONS

STOP and report instead of continuing if any of these occur:

### STOP A

PostgreSQL still returns:

```text
42P10
```

### STOP B

The proposed fix requires block-type-specific telemetry.

### STOP C

The read path requires a second telemetry architecture.

### STOP D

D1 works but C1 requires different backend code.

### STOP E

X1 requires X1-specific telemetry code.

### STOP F

The database identity semantics become ambiguous.

### STOP G

The existing completion/revision semantics must be fundamentally redesigned.

### STOP H

A proposed contract field cannot be supported by the actual runtime.

### STOP I

An unrelated architectural problem is discovered that could invalidate the contract.

In any STOP condition:

```text
DO NOT FREEZE
DO NOT IMPLEMENT RSSB
DO NOT PROCEED TO GATE 3D
```

Document the blocker and explain what evidence caused the stop.

---

# 28. GREEN VERDICT CRITERIA

The corrective gate may return:

## 🟢 GREEN — CONTRACT FREEZE ELIGIBLE

ONLY if all of the following are true:

```text
[ ] 42P10 resolved
[ ] D1 write path verified
[ ] C1 write path verified
[ ] active-time writes verified
[ ] visit semantics verified
[ ] revision semantics verified
[ ] database uniqueness verified
[ ] concurrency verified
[ ] block read path verified
[ ] API serialization verified
[ ] ILSProvider activeBlockProgress verified
[ ] expectedTimeSec verified
[ ] no D1/C1 telemetry special-casing
[ ] X1 universality still passes
[ ] affected audits pass
[ ] no critical blocker remains
```

Only then may the AI recommend:

```text
FREEZE ILSActiveBlockProgress
```

---

# 29. YELLOW VERDICT

If implementation is substantially correct but a non-critical verification gap remains:

```text
🟡 YELLOW
```

Do NOT freeze unless the remaining issue is demonstrably non-contractual and the project's gate rules explicitly allow it.

Document:

* exact remaining issue
* why it does not invalidate the contract
* affected audit
* evidence
* next action

---

# 30. RED VERDICT

Return:

```text
🔴 RED
```

if:

* universality fails
* D1/C1 special-casing appears
* X1 requires special telemetry
* database identity is fundamentally wrong
* persistence semantics are fundamentally inconsistent
* the proposed contract does not match runtime reality
* fixing the blockers requires architectural redesign

If RED:

```text
STOP
DO NOT FREEZE
DO NOT IMPLEMENT RSSB
DO NOT PROCEED TO GATE 3D
```

---

# 31. CONTRACT REVIEW — ONLY AFTER GREEN

If and ONLY if the corrective re-audit reaches GREEN, compare the actual verified implementation against the proposed contract:

```typescript
interface ILSActiveBlockProgress {
    blockId: string;
    blockType: string;
    blockVersion: string;

    visitCount: number;
    revisionCount: number;

    activeTimeSec: number;
    expectedTimeSec: number | null;

    firstViewedAt: Date | null;
    lastViewedAt: Date | null;

    completedAt: Date | null;

    isCompleted: boolean;
}
```

For every field document:

```text
SOURCE
TYPE
NULLABILITY
SEMANTICS
PRODUCER
READ PATH
CONSUMER
TEST EVIDENCE
```

Do not freeze any field simply because it appeared in the previous audit report.

Freeze only what the verified implementation actually supports.

---

# 32. CONTRACT FREEZE RULE

If GREEN is achieved:

Create/update the appropriate contract documentation with:

```text
Status: FROZEN
Gate: 3C.1R
Date: 2026-09-09 or actual completion date
Evidence: reference to re-audit report
```

Record explicitly:

```text
This contract is universal.

D1 and C1 are consumers of the contract,
not special implementations of the telemetry architecture.

Future blocks inherit the same telemetry path
through UBRC and Universal ILS Runtime.
```

---

# 33. WHAT MUST HAPPEN AFTER GREEN

Do NOT immediately mix subsequent implementation into this corrective gate.

The correct sequence after GREEN is:

```text
Gate 3C.1R GREEN
       ↓
Freeze ILSActiveBlockProgress
       ↓
Gate 3C implementation authorization
       ↓
ILSProvider implementation/enhancement
       ↓
Gate 3D RSSB React/TypeScript conversion
       ↓
RSSB integration
       ↓
LSNB integration
       ↓
Composer/future-block validation
       ↓
X1/future-block certification
```

The current corrective gate ends when its blockers are resolved and the re-audit verdict is issued.

---

# 34. FINAL DELIVERABLE

At completion, produce:

```text
ILS_UI_UX/docs/10-Gate-3C1R-Corrective-Reaudit-Report.md
```

The report must contain:

1. Executive verdict
2. Original YELLOW findings
3. Exact root cause of 42P10
4. Exact database/repository correction
5. Migration evidence
6. D1 write verification
7. C1 write verification
8. Active-time verification
9. Read-path implementation
10. API verification
11. ILSProvider verification
12. D1/C1 matrix
13. X1 universality verification
14. Re-audit matrix
15. Contract readiness decision
16. Remaining non-blocking issues
17. Final GREEN/YELLOW/RED verdict
18. Explicit next-gate recommendation

---

# 35. FINAL EXECUTION PRINCIPLE

The most important rule of this gate is:

```text
DO NOT OPTIMIZE FOR:
"Make the tests green."

DO NOT OPTIMIZE FOR:
"Make RSSB work."

OPTIMIZE FOR:
"Prove that the universal block-learning architecture
is operationally correct and safe to freeze."
```

The final architectural property must remain:

```text
                  Future Block
                       │
                       ▼
                     UBRC
                       │
                       ▼
              Universal ILS Runtime
                       │
              ┌────────┴────────┐
              ▼                 ▼
             LSNB              RSSB
```

Therefore:

```text
D1 ≠ special telemetry implementation
C1 ≠ special telemetry implementation
I1 ≠ special telemetry implementation
O1 ≠ special telemetry implementation
S1 ≠ special telemetry implementation
X1 ≠ special telemetry implementation
```

All blocks must participate through the same universal contract.

---

**END OF GATE 3C.1R**
