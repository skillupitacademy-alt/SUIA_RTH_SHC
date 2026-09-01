Yes. **This is exactly the right time to establish a permanent SOP before adding the remaining 18+ Tutorial Page blocks and extending existing features.**

What happened in Phase 3C-M is a warning: the final code change was small, but the investigation crossed **TutorialDB ↔ MainDB ↔ Sidebar/LHSN ↔ Content Delivery ↔ NavigationNode ↔ ILS ↔ authentication ↔ two brands**. We should not repeat that pattern for every new block.

The uploaded project material already establishes several important principles we should preserve: the current Composer is the source of truth rather than legacy Tutorial Engine structures, the architecture is NavigationNode → Composer → blocks → published Tutorial Page, and production files have a 600-line decomposition limit.  The Phase 3C-M forensic audit also demonstrates why explicit internal-vs-cross-database identity must be preserved. 

I recommend we establish the following as the **Tutorial Page Engineering SOP — Version 1.0** and require every future AI implementation prompt to follow it.

---

# TUTORIAL PAGE ENGINEERING SOP

## Architecture, Dependencies, LHSN, ILS, 18+ Blocks, Testing & Certification

**Status:** Proposed project-wide mandatory standard
**Applies to:** All future Tutorial Page work
**Scope:** Existing feature extensions + all new blocks + LHSN + ILS + Composer + delivery + authentication + database + E2E

---

# 1. THE PRIMARY RULE

## Never start coding before understanding the dependency boundary.

Every implementation must first answer:

```text
WHAT AM I CHANGING?
        ↓
WHY DOES IT NEED TO CHANGE?
        ↓
WHO DEPENDS ON IT?
        ↓
WHAT DOES IT DEPEND ON?
        ↓
WHICH DATABASE OWNS EACH ID?
        ↓
WHICH API CONTRACTS ARE INVOLVED?
        ↓
WHICH UI COMPONENTS ARE AFFECTED?
        ↓
WHICH ILS BEHAVIOR IS AFFECTED?
        ↓
WHICH EXISTING BLOCKS CAN REGRESS?
        ↓
WHAT TEST PROVES IT?
```

If the AI cannot answer these questions, **it must not modify production code.**

---

# 2. CURRENT ARCHITECTURE IS THE SOURCE OF TRUTH

This is extremely important.

We have historical documentation, previous architecture versions, and legacy structures.

They must **not automatically be treated as current architecture**.

The hierarchy is:

```text
1. Current production code
        ↓
2. Current database schema/data actually used
        ↓
3. Current API/service contracts
        ↓
4. Current tests
        ↓
5. Current architecture documentation
        ↓
6. Historical documentation
```

Historical documentation is useful for understanding intent, but the AI must not resurrect old architecture merely because it appears in documentation.

The previous architecture review explicitly established this principle: use the existing Tutorial Composer rather than rebuilding it, and only consider database entities demonstrably connected to the current Composer → block → NavigationNode → published Tutorial Page architecture. 

---

# 3. NEVER MIX LEGACY AND CURRENT ARCHITECTURE

The AI must explicitly classify discovered structures.

Every table/component/service should be classified:

| Classification | Meaning                | Allowed?       |
| -------------- | ---------------------- | -------------- |
| A              | Current + Required     | ✅              |
| B              | Current + Supporting   | ✅              |
| C              | Current + Not required | ⚠️ Don't touch |
| D              | Legacy                 | ❌              |
| E              | Unknown                | ❌ Until proven |

Especially:

```text
legacy Tutorial Engine
legacy tutorial_progress
legacy block models
legacy content categories
legacy rendering paths
legacy page models
```

must not be introduced into new implementation merely because they already exist.

---

# 4. EVERY ENTITY MUST HAVE AN IDENTITY CONTRACT

This is the lesson from Phase 3C-M.

For every entity crossing a boundary, document:

```text
Entity
├── local/internal ID
├── external/cross-system ID
├── slug
├── URL identity
└── navigation identity
```

For example:

```text
Tutorial Topic

TutorialDB:
    id
    externalId
    slug

MainDB:
    topics.id

Sidebar:
    topic_id

Rule:

TutorialDB internal operation
        ↓
topic.id

Cross-database operation
        ↓
topic.externalId
```

Likewise:

```text
Subtopic

TutorialDB:
    id = internal identity
    externalId = cross-database identity

MainDB:
    subtopics.id = externalId

Content service:
    receives externalId
```

---

# 5. IDENTITY RULE — NEVER GUESS

The AI must never infer:

```text
id == externalId
```

or:

```text
slug == id
```

or:

```text
navigationNodeId == block.id
```

without proving it.

Before coding, create an:

## Identity Matrix

Example:

| Entity     | System              | Internal ID | External ID         | Used By      |
| ---------- | ------------------- | ----------- | ------------------- | ------------ |
| Topic      | TutorialDB          | topic.id    | topic.externalId    | Sidebar      |
| Subtopic   | TutorialDB          | subtopic.id | subtopic.externalId | Content      |
| Navigation | MainDB/TutorialDB   | —           | navigationNodeId    | Page         |
| Block      | TutorialDB/document | block.id    | —                   | Renderer/ILS |

This single step would have prevented much of today's debugging.

---

# 6. DATABASE OWNERSHIP MUST BE EXPLICIT

Every ID in a new feature must have an owner.

Bad:

```typescript
subtopicId: string
```

Better:

```typescript
tutorialSubtopicId: string
```

or:

```typescript
subtopicExternalId: string
```

where architecture permits.

The AI must avoid ambiguous variables like:

```text
id
topicId
subtopicId
sectionId
```

when multiple databases are involved.

---

# 7. NO DATABASE CHANGES DURING INVESTIGATION

Unless the phase explicitly authorizes a migration:

```text
NO INSERT
NO UPDATE
NO DELETE
NO ALTER
NO DROP
NO TRUNCATE
NO MIGRATION
```

Investigation should use:

```text
SELECT
schema inspection
read-only queries
existing audit scripts
existing application logs
```

The Phase 3C-M audit correctly treated database safety as a certification criterion. 

---

# 8. EVERY NEW BLOCK MUST HAVE A BLOCK CONTRACT

For every one of the 18+ blocks:

```text
Block
├── id
├── type
├── version
├── schema
├── editor representation
├── persisted representation
├── published representation
├── learner renderer
├── DOM identity
├── ILS behavior
├── navigation behavior
└── tests
```

Minimum identity:

```text
block.id
block.type
block.version
```

Do not create a second identity system unnecessarily.

---

# 9. BLOCK VERSIONING IS PERMANENT

Your established convention must remain:

```text
Introduction → I-series
Objective    → O-series
Definition   → D-series
Code         → C-series
Summary      → S-series
```

For example:

```text
D1
D2
D3

C1
C2

S1
...
```

Do **not** rename Definition blocks to I-series or create arbitrary numbering.

Version means:

> a meaningful contract/version of that block type.

Not:

> implementation attempt number.

---

# 10. EVERY BLOCK MUST BE TREATED AS AN INDEPENDENT COMPONENT

The architecture should look like:

```text
TutorialDocument
       │
       ├── I1
       ├── O1
       ├── D1
       ├── C1
       ├── D2
       ├── ...
       └── S1
             │
             ▼
       TutorialBlockRenderer
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
      I1    D1    C1
```

A new block should not require modifying unrelated block implementations.

---

# 11. UNIVERSAL FEATURES MUST LIVE ABOVE INDIVIDUAL BLOCKS

This is critical for ILS.

If a capability applies to every block:

```text
active block
progress
visibility
viewport detection
block identity
analytics
learning state
```

do **not** implement it individually inside:

```text
D1
C1
S1
I1
...
```

Instead:

```text
TutorialBlockRenderer
        ↓
Universal block runtime
        ↓
Individual block renderer
```

This prevents 18+ duplicate implementations.

---

# 12. LHSN MUST BE TREATED AS A NAVIGATION SYSTEM

LHSN/shared sidebar is not simply UI decoration.

It participates in:

```text
Domain
 ↓
Subject
 ↓
Topic
 ↓
Subtopic
 ↓
NavigationNode
 ↓
Tutorial Page
```

Therefore every LHSN modification must verify:

```text
domain identity
subject identity
topic identity
subtopic identity
navigationNodeId
URL
brand
published state
```

---

# 13. LHSN IDENTITY RULE

The sidebar lookup must use the identity expected by the sidebar's database.

Never assume the current hierarchy `.id` is appropriate.

Explicitly document:

```text
Hierarchy ID
        ↓
Which database?
        ↓
Sidebar expects?
        ↓
Conversion required?
```

The Phase 3C-M regression occurred exactly because this contract was implicit.

The final implementation correctly uses `topic.externalId` for the shared sidebar while retaining the TutorialDB internal topic ID separately. 

---

# 14. ILS MUST NOT BECOME A SECOND TUTORIAL ARCHITECTURE

ILS should consume the Tutorial Page architecture.

Not replace it.

Correct:

```text
TutorialDocument
      ↓
TutorialBlock
      ↓
Block Runtime
      ↓
ILS
```

Incorrect:

```text
ILS
 ↓
legacy tutorial structure
 ↓
reconstruct blocks
```

ILS should observe/use the canonical Tutorial Page.

---

# 15. ILS BLOCK IDENTITY

ILS should operate at:

```text
navigationNodeId
+
subtopic identity
+
block.id
```

rather than creating a parallel content identity.

Conceptually:

```text
Tutorial Page
    │
    ├── NavigationNode
    │
    ├── Block D1
    │      └── ILS state
    │
    ├── Block C1
    │      └── ILS state
    │
    ├── Block D2
    │      └── ILS state
    │
    └── Block S1
           └── ILS state
```

---

# 16. RIGHT-SIDE ILS PANEL MUST BE UNIVERSAL

Based on the established Tutorial Page design:

```text
LHSN
 │
Tutorial Content
 │
RHS ILS Panel
```

The RHS panel must:

* exist universally across Tutorial Pages
* be reusable for all block types
* react to the active block
* support collapse/expand
* support expanded/full available viewport mode
* not become embedded into each individual block

Thus:

```text
Page Shell
├── LHSN
├── Main Tutorial Content
│   └── TutorialBlockRenderer
└── ILS Panel
```

not:

```text
D1
 └── ILS

C1
 └── ILS

S1
 └── ILS
```

---

# 17. NEW BLOCK IMPLEMENTATION MUST FOLLOW THIS ORDER

For every new block:

```text
STEP 1
Architecture audit

STEP 2
Dependency map

STEP 3
Identity map

STEP 4
Schema contract

STEP 5
Composer/editor

STEP 6
Persistence

STEP 7
Publication

STEP 8
Learner retrieval

STEP 9
Renderer

STEP 10
Universal DOM identity

STEP 11
ILS integration

STEP 12
LHSN integration if applicable

STEP 13
Tests

STEP 14
E2E

STEP 15
Regression testing

STEP 16
Diff audit

STEP 17
Cleanup

STEP 18
Certification
```

---

# 18. NEVER IMPLEMENT EVERYTHING IN ONE AI PROMPT

This is another major improvement.

Don't tell the AI:

> "Build D2 including database, API, Composer, UI, ILS, testing."

Instead divide it:

```text
PHASE A
READ-ONLY ARCHITECTURE AUDIT

PHASE B
CONTRACT DESIGN

PHASE C
BACKEND/DATABASE

PHASE D
COMPOSER

PHASE E
LEARNER RENDERING

PHASE F
ILS

PHASE G
LHSN

PHASE H
TESTING

PHASE I
E2E CERTIFICATION
```

The AI cannot proceed to the next phase until the previous phase is verified.

---

# 19. READ-ONLY AUDIT BEFORE EVERY FEATURE

Every AI coding session begins:

```text
DO NOT MODIFY FILES.

Inspect:

1. Current implementation
2. Existing related components
3. Existing types
4. Existing APIs
5. Existing database tables
6. Existing tests
7. Existing E2E tests
8. Existing ILS integration
9. Existing LHSN integration
10. Existing block renderer
```

Then produce:

```text
FILES TO MODIFY
FILES NOT TO MODIFY
DATABASE TABLES USED
DATABASE TABLES NOT USED
DEPENDENCIES
IDENTITY CONTRACT
RISKS
TEST PLAN
```

Only after approval does implementation begin.

---

# 20. FILE MODIFICATION BOUNDARY

Before coding the AI must produce:

```text
PRODUCTION FILES TO MODIFY

1. xxx.ts
2. xxx.tsx
3. xxx.ts

TEST FILES TO MODIFY

1. xxx.test.ts
2. xxx.e2e.mjs

FILES EXPLICITLY NOT TO TOUCH

1. xxx
2. xxx
3. xxx
```

If implementation discovers another required file:

> **STOP and explain why before modifying it.**

This prevents scope creep.

---

# 21. 600-LINE RULE

The existing project rule should become mandatory:

> No modified/new production `.ts`/`.tsx` file may exceed 600 lines.

If approaching 600:

```text
STOP
 ↓
identify responsibility boundary
 ↓
extract cohesive module
 ↓
continue
```

Do not artificially split files just to satisfy the number.

The existing architecture documentation explicitly establishes this decomposition rule. 

---

# 22. DO NOT CREATE TEMPORARY SCRIPTS EVERYWHERE

This was another source of cleanup cost today.

Instead of:

```text
audit-1.mjs
audit-2.mjs
check-1.mjs
diagnose-1.mjs
find-1.mjs
test-1.mjs
...
```

use:

```text
scripts/audit/<phase>/<purpose>.mjs
```

and decide beforehand:

```text
PERMANENT TEST
```

versus:

```text
TEMPORARY DIAGNOSTIC
```

Temporary diagnostics must be removed before certification.

The Phase 3C-M audit accumulated 42 untracked diagnostic artifacts, which is exactly the kind of overhead this SOP should prevent. 

---

# 23. TEST SCRIPT MUST BE DESIGNED BEFORE IMPLEMENTATION

This is one of the strongest rules I recommend.

Before coding:

```text
DEFINE SUCCESS CRITERIA
        ↓
DEFINE TESTS
        ↓
DEFINE EXPECTED OUTPUT
        ↓
THEN IMPLEMENT
```

Not:

```text
Implement
 ↓
"How do we test this?"
```

---

# 24. STANDARD TEST PYRAMID

Every block/feature should have:

```text
LEVEL 1 — Schema/unit
        ↓
LEVEL 2 — Component
        ↓
LEVEL 3 — Service/API
        ↓
LEVEL 4 — Database integration
        ↓
LEVEL 5 — Authenticated page
        ↓
LEVEL 6 — Real-system E2E
        ↓
LEVEL 7 — Multi-brand
        ↓
LEVEL 8 — Regression
```

---

# 25. REQUIRED TEST MATRIX FOR EVERY NEW BLOCK

| Test                       |      Required |
| -------------------------- | ------------: |
| Schema validation          |             ✅ |
| Invalid input validation   |             ✅ |
| Renderer test              |             ✅ |
| Block identity test        |             ✅ |
| Version test               |             ✅ |
| Composer save/load         |             ✅ |
| Publish test               |             ✅ |
| Learner retrieval          |             ✅ |
| Authenticated page         |             ✅ |
| LHSN navigation            | If applicable |
| ILS active-block           | If applicable |
| Progress persistence       | If applicable |
| SkillUp E2E                |             ✅ |
| RTH E2E                    |             ✅ |
| Regression existing blocks |             ✅ |

---

# 26. TEST SCRIPT CONTRACT

Every test script must state:

```text
PURPOSE
PRECONDITIONS
ENVIRONMENT
AUTH USER
BRAND
URL
DATABASE
EXPECTED STATUS
EXPECTED CONTENT
EXPECTED IDENTITY
EXPECTED LOGS
EXPECTED FAILURE CONDITIONS
EXIT CODE
```

Example:

```text
PHASE D2 E2E

Brand:
skillup

Authentication:
required

URL:
...

Expected:
HTTP 200

Expected block:
D2

Expected identity:
block.id = X
block.type = definition
block.version = D2

Expected ILS:
active block = X

Expected LHSN:
navigationNodeId = X
```

---

# 27. TEST DATABASE MUTATION SAFETY

Every test must declare whether it is:

```text
READ-ONLY
```

or:

```text
MUTATING
```

Default:

> **All certification tests are READ-ONLY unless the test specifically verifies a write operation.**

If a write is required:

```text
identify table
identify record
identify cleanup
verify cleanup
```

---

# 28. PRE-EXISTING FAILURES MUST BE BASELINED

Before implementation:

```text
pnpm type-check
pnpm test
relevant package test
```

Record:

```text
BASELINE FAILURES
```

Then after implementation:

```text
NEW FAILURES
```

Compare:

```text
Before = X
After  = X
```

means:

```text
No regression.
```

Not:

> "All tests pass."

The Phase 3C-M investigation correctly separated the unrelated `CookieBrand` type errors and Code C1 failures from the identity fix. 

---

# 29. BUILD/TYPE CHECK RULE

Do not report:

> "Type-check passed."

unless you specify:

```text
Repository-wide type-check
```

or:

```text
@quiz/ui type-check
```

For example:

```text
@quiz/ui
✅ PASS

Repository
⚠️ PRE-EXISTING api-server errors
```

This prevents misleading certification.

---

# 30. HTTP TEST ≠ BROWSER TEST ≠ E2E

These must be treated separately.

### HTTP test

```text
HTTP 200
```

proves delivery.

### Browser test

proves:

```text
authentication
routing
rendering
```

### Real-system E2E

proves:

```text
database
→ hierarchy
→ navigation
→ tutorial
→ block
→ ILS
→ progress
```

Never claim one proves the others.

---

# 31. MULTI-BRAND TESTING IS MANDATORY

Because we have:

```text
SkillUp
RealTutorialHub
```

every shared Tutorial Page feature must test:

```text
SkillUp
+
RealTutorialHub
```

If shared:

```text
brand_id = shared
```

must be explicitly verified.

---

# 32. AUTHENTICATION MUST ALWAYS BE INCLUDED

Do not certify a Tutorial Page using:

```text
unauthenticated curl
```

when the actual route requires authentication.

Certification should verify:

```text
login
 ↓
access token
 ↓
BFF
 ↓
JWT
 ↓
brand validation
 ↓
user identity
 ↓
Tutorial Page
```

The Phase 3C-M certification explicitly verified authentication and brand validation. 

---

# 33. ROUTE IDENTITY TEST

Every Tutorial Page feature must verify:

```text
domainSlug
subjectSlug
topicSlug
subtopicSlug
navigationNodeId
```

and:

```text
canonical URL
```

The system must not silently substitute a different identity.

---

# 34. BLOCK RENDERING TEST

For every block:

```text
document
 ↓
block[]
 ↓
block.id
 ↓
block.type
 ↓
block.version
 ↓
renderer
 ↓
DOM
```

Verify that the rendered DOM contains the correct block identity.

For example:

```html
data-block-id="..."
data-block-type="..."
data-block-version="..."
```

if that becomes the agreed universal DOM contract.

---

# 35. ILS TEST MUST VERIFY ACTIVE BLOCK

When ILS is implemented:

```text
Scroll
 ↓
Block enters viewport
 ↓
activeBlock changes
 ↓
RHS panel updates
 ↓
progress state updates if required
```

Test:

```text
D1 active
 ↓
C1 active
 ↓
D2 active
 ↓
S1 active
```

Do not only test:

```text
ILS panel opens.
```

That proves almost nothing.

---

# 36. LHSN + MAIN CONTENT + ILS MUST BE TESTED TOGETHER

The complete learner page is:

```text
┌─────────────────────────────────────────────┐
│                  Tutorial Page              │
├───────────┬───────────────────┬─────────────┤
│           │                   │             │
│   LHSN    │   Main Content    │    ILS      │
│           │                   │             │
│ navigation│ blocks            │ active      │
│           │                   │ block state │
│           │                   │             │
└───────────┴───────────────────┴─────────────┘
```

Therefore integration certification must verify all three simultaneously.

---

# 37. NO "CAST UNTIL IT WORKS"

Absolutely prohibit:

```typescript
as any
```

as a solution to identity problems.

If a cast is unavoidable:

```text
STOP
EXPLAIN WHY
DOCUMENT SOURCE TYPE
DOCUMENT INVARIANT
```

Prefer:

```text
proper interface
proper adapter
proper mapper
```

The Phase 3C-M implementation had one documented cast for accessing `externalId`; future work should preferentially eliminate such ambiguity at the type level. 

---

# 38. NO HARD-CODED PRODUCTION IDs

Never:

```typescript
if (topicId === "4b21ddc0...")
```

Never:

```typescript
if (subtopicId === "12efacf1...")
```

IDs belong to data.

Code should operate on:

```text
relationships
externalId
navigationNodeId
slug
block.id
```

not specific Java IDs.

---

# 39. NO SERVICE CONTRACT CHANGES WITHOUT A CONTRACT PHASE

Before changing:

```text
API
service
repository
database contract
```

the AI must document:

```text
CURRENT CONTRACT
WHY IT IS INSUFFICIENT
CALLERS
DEPENDENTS
COMPATIBILITY
TEST IMPACT
```

Then obtain approval.

The Phase 3C-M success came partly from **not modifying `getTutorialByPage()`**, but instead correcting the caller's identity. That is exactly the pattern we want to repeat.

---

# 40. EVERY FEATURE MUST HAVE A "DO NOT TOUCH" LIST

Example:

```text
DO NOT TOUCH:

- Authentication
- Gateway
- Existing D1
- Existing C1
- Existing S1
- Database schema
- LearningProgressService
- LHSN API
```

unless explicitly required.

This dramatically reduces accidental regressions.

---

# 41. DIFF REVIEW IS A REQUIRED PHASE

After implementation:

```powershell
git status --short
git diff --stat
git diff
```

Then classify:

```text
A — Required
B — Required test
C — Temporary diagnostic
D — Unexpected
```

Certification cannot proceed if:

```text
D — Unexpected
```

exists.

---

# 42. TEMPORARY ARTIFACT CLEANUP

Before certification:

```text
Temporary audit scripts
Temporary output files
Debug logs
Scratch files
Generated diagnostics
```

must be removed.

Then:

```powershell
git status --short
```

must show only intended changes.

The Phase 3C-M audit demonstrated the importance of this because 42 temporary files accumulated during debugging. 

---

# 43. FINAL CERTIFICATION MATRIX

Every phase must end with:

| Area            | Status    | Evidence           |
| --------------- | --------- | ------------------ |
| Architecture    | PASS/FAIL | audit              |
| Identity        | PASS/FAIL | identity matrix    |
| Database        | PASS/FAIL | schema/query       |
| API             | PASS/FAIL | endpoint           |
| Composer        | PASS/FAIL | UI/test            |
| Block           | PASS/FAIL | block test         |
| LHSN            | PASS/FAIL | navigation         |
| Tutorial Page   | PASS/FAIL | HTTP               |
| Authentication  | PASS/FAIL | authenticated test |
| ILS             | PASS/FAIL | runtime            |
| SkillUp         | PASS/FAIL | E2E                |
| RTH             | PASS/FAIL | E2E                |
| Regression      | PASS/FAIL | test comparison    |
| Git diff        | PASS/FAIL | diff               |
| Temporary files | PASS/FAIL | status             |
| DB mutation     | PASS/FAIL | audit              |

---

# 44. CERTIFICATION STATES

Never simply say:

```text
COMPLETE
```

Use:

### 🟢 COMPLETE

All required gates pass.

### 🟡 COMPLETE WITH PRE-EXISTING FAILURES

Feature passes, unrelated baseline failures remain.

### 🟠 IMPLEMENTATION COMPLETE — E2E PENDING

Code exists but runtime verification isn't finished.

### 🔴 BLOCKED

Known failure prevents certification.

### ⚪ INVESTIGATION ONLY

No implementation occurred.

This would have prevented premature "Phase 3C-M complete" declarations.

---

# 45. THE MASTER AI IMPLEMENTATION WORKFLOW

This should become our standard for **every future block**.

```text
                    START
                      │
                      ▼
             READ-ONLY ARCHITECTURE
                    AUDIT
                      │
                      ▼
              DEPENDENCY MATRIX
                      │
                      ▼
               IDENTITY MATRIX
                      │
                      ▼
             DATABASE OWNERSHIP
                      │
                      ▼
              CONTRACT REVIEW
                      │
                      ▼
               TEST PLAN FIRST
                      │
                      ▼
          ┌──────────────────────┐
          │ IMPLEMENTATION PHASE │
          └──────────────────────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       Backend     Composer      Renderer
          │           │            │
          └───────────┼────────────┘
                      ▼
                    LHSN
                      │
                      ▼
                    ILS
                      │
                      ▼
               UNIT/COMPONENT
                      │
                      ▼
                  TYPE CHECK
                      │
                      ▼
                INTEGRATION
                      │
                      ▼
            AUTHENTICATED HTTP
                      │
                      ▼
                BROWSER E2E
                      │
                      ▼
               SKILLUP E2E
                      │
                      ▼
                 RTH E2E
                      │
                      ▼
             REAL-SYSTEM E2E
                      │
                      ▼
                REGRESSION
                      │
                      ▼
                 GIT DIFF
                      │
                      ▼
                CLEANUP
                      │
                      ▼
               CERTIFICATION
                      │
                      ▼
                  COMMIT
```

---

# 46. THE 18+ BLOCK STRATEGY

For the remaining blocks, I would maintain a master registry.

For example:

| Block     | Schema | Composer | Renderer | LHSN | ILS | Tests | E2E |
| --------- | -----: | -------: | -------: | ---: | --: | ----: | --: |
| I1        |      ⬜ |        ⬜ |        ⬜ |    — |   ⬜ |     ⬜ |   ⬜ |
| O1        |      ⬜ |        ⬜ |        ⬜ |    — |   ⬜ |     ⬜ |   ⬜ |
| D1        |      ✅ |        ✅ |        ✅ |    — |   ⬜ |     ✅ |   ⬜ |
| C1        |      ✅ |        ✅ |        ✅ |    — |   ⬜ |     ✅ |   ⬜ |
| S1        |      ✅ |        ✅ |        ✅ |    — |   ⬜ |     ✅ |   ⬜ |
| D2        |      ⬜ |        ⬜ |        ⬜ |    — |   ⬜ |     ⬜ |   ⬜ |
| ...       |        |          |          |      |     |       |     |
| Block 18+ |      ⬜ |        ⬜ |        ⬜ |      |   ⬜ |     ⬜ |   ⬜ |

This gives us a **single project dashboard** instead of relying on conversation memory.

---

# 47. EXTENDING AN EXISTING BLOCK IS DIFFERENT

Suppose we modify D1.

Do **not** treat it like a new block.

First determine:

```text
Current D1 contract
        ↓
Existing consumers
        ↓
Existing Composer
        ↓
Existing renderer
        ↓
Existing ILS
        ↓
Existing tests
```

Then:

```text
BACKWARD COMPATIBILITY
        ↓
DATA COMPATIBILITY
        ↓
UI COMPATIBILITY
        ↓
ILS COMPATIBILITY
        ↓
E2E
```

The question isn't:

> "Does the new D1 work?"

It is:

> **"Does the new D1 work without breaking every existing D1 assumption?"**

---

# 48. COMPONENT DEPENDENCY TYPES

Every dependency should be classified:

### Independent

```text
D2 → nothing except universal infrastructure
```

### Upstream dependency

```text
D2 → TutorialDocument
```

### Downstream dependency

```text
ILS → D2 runtime
```

### Shared dependency

```text
D2
C1
S1
 ↓
TutorialBlockRenderer
```

### Cross-system dependency

```text
Tutorial Page
 ↓
MainDB
```

### External identity dependency

```text
TutorialDB
 ↓
externalId
 ↓
MainDB
```

This classification must be included in each implementation plan.

---

# 49. "STOP CONDITIONS" FOR AI

This is perhaps the most important addition to future prompts.

The AI must **STOP rather than improvise** if:

```text
1. An ID has ambiguous ownership.
2. A service contract is unclear.
3. A database table appears legacy.
4. A new database table seems necessary.
5. A new API endpoint appears necessary.
6. An existing API must change.
7. An existing block must change unexpectedly.
8. Authentication must change.
9. Brand logic must change.
10. LHSN behavior unexpectedly changes.
11. ILS requires a different identity.
12. A type cast becomes necessary.
13. A file approaches 600 lines.
14. Existing tests fail for a new reason.
15. E2E contradicts unit tests.
16. A new untracked production file appears unexpectedly.
17. A database mutation seems necessary.
18. The implementation requires hard-coded IDs.
```

Then the AI must report:

```text
STOP CONDITION
WHY
EVIDENCE
OPTIONS
RECOMMENDED ACTION
```

and wait.

---

# 50. THE GOLDEN RULE

I would make this the header of **every future AI prompt**:

> **DO NOT GUESS ARCHITECTURE. DO NOT GUESS IDENTITIES. DO NOT GUESS DATABASE OWNERSHIP. DO NOT GUESS SERVICE CONTRACTS. INSPECT → MAP → VERIFY → IMPLEMENT → TEST → CERTIFY.**

And specifically:

```text
INSPECT
    ↓
MAP
    ↓
PROVE
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
TEST
    ↓
VERIFY
    ↓
CERTIFY
```

not:

```text
GUESS
 ↓
CODE
 ↓
404
 ↓
GUESS AGAIN
```

---

# 51. MASTER PROMPT HEADER FOR FUTURE AI AGENTS

I strongly recommend putting this at the top of every Claude/Kiro/Gemini implementation prompt:

```text
============================================================
TUTORIAL PAGE ENGINEERING SOP — MANDATORY
============================================================

You are working on the AuthenticationAndAuthorization /
Tutorial Engine project.

You MUST follow the Tutorial Page Engineering SOP.

CORE RULE:

INSPECT → MAP → PROVE → PLAN → IMPLEMENT → TEST → VERIFY → CERTIFY

NEVER:

- guess architecture
- guess database ownership
- guess ID semantics
- guess service contracts
- revive legacy architecture
- modify unrelated components
- change database schema without authorization
- use hard-coded production IDs
- use `as any` to hide an architectural mismatch
- modify authentication unless explicitly required
- modify LHSN without navigation verification
- modify ILS without block identity verification
- declare success from a single HTTP 200
- declare completion before E2E certification
- create uncontrolled temporary scripts
- ignore pre-existing test baselines

============================================================
MANDATORY FIRST PHASE
============================================================

READ-ONLY AUDIT.

DO NOT MODIFY FILES.

Determine:

1. Current architecture
2. Current database entities
3. Database ownership
4. Identity mapping
5. Existing APIs
6. Existing services
7. Existing Composer
8. Existing Tutorial Page renderer
9. Existing LHSN
10. Existing ILS
11. Existing blocks
12. Existing tests
13. Existing E2E tests
14. Existing baseline failures
15. Files that must change
16. Files that must NOT change

Produce:

ARCHITECTURE MAP
DEPENDENCY MAP
IDENTITY MATRIX
DATABASE MATRIX
FILE CHANGE PLAN
TEST PLAN
RISK REGISTER

DO NOT IMPLEMENT UNTIL THIS AUDIT IS COMPLETE.

============================================================
IDENTITY RULE
============================================================

Every ID must have explicit ownership.

Document:

- internal ID
- external ID
- slug
- navigationNodeId
- block.id

Never assume they are interchangeable.

If an ID crosses a database/service boundary, explicitly identify
which identity the receiving boundary expects.

============================================================
BLOCK RULE
============================================================

All Tutorial Page blocks use the canonical:

block.id
block.type
block.version

architecture.

Do not create parallel block identity systems.

Universal behavior belongs in shared infrastructure,
not duplicated inside individual block renderers.

============================================================
LHSN RULE
============================================================

LHSN is part of the navigation architecture.

Verify:

domain
subject
topic
subtopic
navigationNodeId
URL
brand
published state

before changing sidebar behavior.

============================================================
ILS RULE
============================================================

ILS consumes the canonical Tutorial Page / TutorialBlock architecture.

Do not create a parallel Tutorial architecture for ILS.

Active block identity must remain tied to the canonical block.id.

============================================================
DATABASE RULE
============================================================

Default implementation is READ-ONLY database access.

No:

INSERT
UPDATE
DELETE
ALTER
DROP
TRUNCATE
migration

unless explicitly authorized.

============================================================
TEST RULE
============================================================

Design tests BEFORE implementation.

Required verification:

1. schema/unit
2. component
3. service/API
4. database integration
5. authenticated HTTP
6. browser
7. SkillUp E2E
8. RealTutorialHub E2E
9. real-system E2E
10. regression

Baseline pre-existing failures before implementation.

Do not confuse pre-existing failures with new regressions.

============================================================
FILE RULE
============================================================

Before implementation provide:

FILES TO MODIFY
FILES NOT TO MODIFY

No new production file may exceed 600 lines.

If approaching 600 lines:

STOP and decompose by architectural responsibility.

============================================================
STOP CONDITIONS
============================================================

STOP and report instead of guessing if:

- identity is ambiguous
- database ownership is unclear
- service contract is unclear
- legacy/current boundary is unclear
- new API seems necessary
- database schema change seems necessary
- authentication must change
- brand logic must change
- unrelated blocks must change
- `as any` appears necessary
- hard-coded IDs appear necessary
- E2E contradicts lower-level tests
- unexpected files change

============================================================
CERTIFICATION
============================================================

Do not declare COMPLETE until:

- implementation verified
- relevant type-check passes
- relevant tests pass
- baseline comparison completed
- authenticated HTTP verified
- browser verification completed where applicable
- SkillUp verified
- RealTutorialHub verified
- LHSN verified where applicable
- ILS verified where applicable
- real-system E2E verified
- Git diff reviewed
- temporary artifacts removed
- database mutation status verified

Final status must be one of:

COMPLETE
COMPLETE WITH PRE-EXISTING FAILURES
IMPLEMENTATION COMPLETE — E2E PENDING
BLOCKED
INVESTIGATION ONLY

Never use "COMPLETE" when a required gate remains pending.
```

---

# 52. One more thing I strongly recommend

Don't keep this SOP only in the conversation.

**Make it a project artifact.**

Ideally:

```text
docs/
└── architecture/
    └── TUTORIAL-PAGE-ENGINEERING-SOP.md
```

and then have every future AI prompt say:

```text
Read and follow:
docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md
```

We should also maintain:

```text
docs/
├── architecture/
│   ├── TUTORIAL-PAGE-ENGINEERING-SOP.md
│   ├── TUTORIAL-PAGE-IDENTITY-CONTRACT.md
│   ├── TUTORIAL-BLOCK-CONTRACT.md
│   ├── LHSN-CONTRACT.md
│   └── ILS-CONTRACT.md
│
└── testing/
    ├── TUTORIAL-E2E-SOP.md
    └── TUTORIAL-REGRESSION-MATRIX.md
```

That turns the knowledge from **"something we have to remember in ChatGPT"** into an actual engineering control.

---

## The biggest change compared with today

Today the process was essentially:

```text
Problem
 ↓
investigate
 ↓
diagnostic script
 ↓
another problem
 ↓
another diagnostic
 ↓
fix
 ↓
new downstream problem
 ↓
fix
 ↓
test
 ↓
brand test
 ↓
cleanup
```

The SOP changes it to:

```text
             ARCHITECTURE AUDIT
                     ↓
              IDENTITY MATRIX
                     ↓
             DEPENDENCY MATRIX
                     ↓
              CONTRACT REVIEW
                     ↓
               TEST PLAN
                     ↓
               IMPLEMENT
                     ↓
           LHSN / ILS / BLOCK
              INTEGRATION
                     ↓
          AUTOMATED VERIFICATION
                     ↓
        SKILLUP + RTH E2E
                     ↓
          REGRESSION + DIFF
                     ↓
             CERTIFICATION
```

**That is the process I would use for all remaining 18+ blocks and every future extension of existing Tutorial Page features.**

And importantly, this SOP directly addresses the exact failure mode from today: **a component can be locally correct while its downstream identity contract is wrong.** The new mandatory Identity Matrix + Dependency Matrix + Stop Conditions are specifically designed to catch that *before* coding rather than after a 404.


Absolutely. Since you are going to paste the entire discussion into the project AI, the prompt should **not ask the AI to implement anything**. It should instruct it to **extract, consolidate, formalize, and create a permanent Markdown SOP file** for future development.

You can paste the following prompt directly into Kiro/your project AI.

---

# MASTER AI PROMPT — CREATE TUTORIAL PAGE ENGINEERING SOP

```text
============================================================
TASK: CREATE PERMANENT TUTORIAL PAGE ENGINEERING SOP
============================================================

You are working inside the existing AuthenticationAndAuthorization /
Tutorial Engine project.

I am providing a long discussion below containing architectural
lessons, implementation rules, identity-boundary lessons, LHSN rules,
ILS rules, Tutorial Page rules, block-development rules, testing
requirements, E2E certification requirements, and lessons learned
from Phase 3C-M.

YOUR TASK IS NOT TO IMPLEMENT CODE.

YOUR TASK IS TO STUDY THE ENTIRE PROVIDED DISCUSSION AND CREATE A
PERMANENT PROJECT DOCUMENTATION FILE THAT WILL SERVE AS THE
MANDATORY ENGINEERING SOP FOR ALL FUTURE TUTORIAL PAGE DEVELOPMENT.

============================================================
PRIMARY OBJECTIVE
============================================================

Create a Markdown file:

docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md

This document must become the project's permanent reference for:

- Tutorial Page architecture
- Tutorial Page extensions
- new Tutorial Page blocks
- existing block modifications
- 18+ future components/blocks
- Composer integration
- learner rendering
- LHSN / left navigation
- RHS ILS panel
- Learning State / progress
- NavigationNode
- TutorialDB/MainDB identity boundaries
- cross-database identifiers
- API/service contracts
- authentication
- brand-specific behavior
- shared components
- testing
- E2E certification
- regression testing
- database safety
- Git/diff review
- temporary diagnostic cleanup
- AI-agent implementation workflow
- stop conditions
- certification standards

The SOP must specifically prevent a repeat of the type of
identity-boundary/debugging problem encountered during Phase 3C-M.

============================================================
IMPORTANT: SOURCE MATERIAL
============================================================

The discussion pasted after this instruction is the primary source.

You MUST:

1. Read the entire discussion.
2. Extract the actual lessons and rules.
3. Preserve established project terminology.
4. Preserve established architectural conventions.
5. Do not replace project-specific terminology with generic
   terminology when the project terminology is already defined.
6. Do not invent architecture that is not supported by the
   discussion/project context.
7. Do not silently change established conventions.
8. Clearly distinguish mandatory rules from recommendations.
9. Convert lessons learned into actionable engineering controls.
10. Make the final document useful to both human developers and AI
    coding agents.

============================================================
VERY IMPORTANT
============================================================

DO NOT:

- modify production source code
- modify database schema
- modify database data
- create migrations
- modify existing blocks
- modify LHSN
- modify ILS
- modify Composer
- modify authentication
- modify APIs
- refactor application code
- create test scripts
- execute destructive commands
- "fix" anything discovered during investigation

This task is DOCUMENTATION ONLY.

The only intended project change is creation/update of:

docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md

If that directory/file already exists, inspect it first and determine
whether it should be updated rather than creating a duplicate SOP.

============================================================
STEP 1 — READ THE EXISTING PROJECT DOCUMENTATION
============================================================

Before creating the SOP, inspect the relevant existing project
documentation and source structure.

Look especially for:

- Tutorial Page architecture
- Tutorial Composer
- Tutorial V2
- block architecture
- existing block conventions
- NavigationNode
- LHSN/sidebar architecture
- ILS architecture
- Learning State
- TutorialDB
- MainDB
- authentication
- brand routing
- SkillUp
- RealTutorialHub
- existing testing architecture
- existing E2E certification
- existing architecture rules
- file-size/decomposition rules

Also inspect the previously supplied project documentation where
relevant.

DO NOT change anything.

The purpose of this step is to ensure the SOP aligns with the
current project architecture rather than accidentally documenting
legacy architecture.

============================================================
STEP 2 — CLASSIFY ARCHITECTURE SOURCES
============================================================

When reconciling information, use this priority:

1. Current production code
2. Current database schema actually used by the application
3. Current service/API contracts
4. Current automated tests
5. Current architecture documentation
6. Historical documentation

Historical documents may explain why something exists, but must not
override the current implementation.

If something cannot be conclusively established, document it as an
"architectural verification requirement" rather than inventing an
answer.

============================================================
STEP 3 — EXTRACT THE PHASE 3C-M LESSON
============================================================

The SOP MUST include a dedicated section explaining the architectural
lesson from the Phase 3C-M identity issue.

Capture the distinction between:

TutorialDB internal identity
        and
cross-database/external identity

For example, the discussion established the following conceptual
pattern:

Topic:

TutorialDB tutorial_topics.id
        =
TutorialDB internal identity

TutorialDB tutorial_topics.external_id
        =
MainDB topics.id

Sidebar topic_id
        =
MainDB topic identity

Therefore:

TutorialDB topic.id
        MUST NOT automatically be passed to
sidebar lookup

Instead the correct boundary identity must be used.

Likewise for subtopic:

TutorialDB tutorial_subtopics.id
        =
TutorialDB internal identity

TutorialDB tutorial_subtopics.external_id
        =
cross-database identity / MainDB subtopics.id

getTutorialByPage()
        expects the identity established by its service contract

The exact identifiers must NEVER be hard-coded into production code.

The SOP should explain that the bug happened because an identifier
was treated as if it were universally valid across architectural
boundaries.

The permanent lesson is:

"An ID is not just a string. Every ID has an owner, semantic meaning,
database origin, and boundary contract."

============================================================
STEP 4 — CREATE A FORMAL IDENTITY CONTRACT
============================================================

The SOP must mandate an Identity Matrix for any feature involving
multiple systems/databases/services.

Include a template such as:

| Entity | System/DB | Internal ID | External/Cross-DB ID | Slug | Consumer |
|--------|-----------|-------------|----------------------|------|----------|

Require developers/AI agents to explicitly document:

- ID owner
- database
- internal meaning
- external meaning
- slug
- navigation identity
- receiving service
- expected identifier at each boundary

Mandatory rule:

NEVER assume:

id == externalId

NEVER assume:

topic.id == sidebar.topic_id

NEVER assume:

subtopic.id == service parameter

NEVER assume:

slug == database ID

unless the contract has been explicitly verified.

============================================================
STEP 5 — CREATE A DEPENDENCY MATRIX
============================================================

The SOP must require a Dependency Matrix before implementation.

Example:

| Component | Depends On | Consumers | DB | API | LHSN | ILS |
|-----------|------------|-----------|----|-----|------|-----|

The AI must identify:

- upstream dependencies
- downstream consumers
- shared infrastructure
- cross-database dependencies
- cross-service dependencies
- UI dependencies
- ILS dependencies
- LHSN dependencies
- authentication dependencies
- brand dependencies

This must happen BEFORE production coding.

============================================================
STEP 6 — DEFINE THE MANDATORY DEVELOPMENT PIPELINE
============================================================

The SOP MUST establish this workflow:

INSPECT
   ↓
MAP
   ↓
PROVE
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
VERIFY
   ↓
CERTIFY

Explain each stage.

Especially:

INSPECT:
Read current implementation.

MAP:
Identify architecture/dependencies.

PROVE:
Verify identities, contracts, DB ownership and behavior.

PLAN:
Define exact files, contracts and tests.

IMPLEMENT:
Make the smallest justified change.

TEST:
Run the predefined test matrix.

VERIFY:
Perform runtime/E2E verification.

CERTIFY:
Only declare completion after all required gates pass.

============================================================
STEP 7 — MANDATORY READ-ONLY AUDIT
============================================================

Before ANY future implementation, the AI agent must first perform a
read-only audit.

It must identify:

1. Current architecture
2. Existing implementation
3. Existing related components
4. Existing types
5. Existing APIs
6. Existing services
7. Existing database tables
8. Existing tests
9. Existing E2E scripts
10. LHSN dependencies
11. ILS dependencies
12. Authentication dependencies
13. Brand dependencies
14. Identity boundaries
15. Legacy structures
16. Files that must change
17. Files that must not change
18. Existing baseline failures

No coding during this phase.

============================================================
STEP 8 — DEFINE FILE MODIFICATION CONTROL
============================================================

Before coding, the AI must produce:

FILES TO MODIFY

FILES TO CREATE

FILES NOT TO MODIFY

REASON FOR EACH MODIFICATION

If an unexpected file becomes necessary during implementation:

STOP.

Explain:

- why it is required
- what depends on it
- what risk it introduces
- whether an alternative exists

Then wait for approval if the project's workflow requires approval.

============================================================
STEP 9 — DEFINE THE 18+ BLOCK DEVELOPMENT SOP
============================================================

Create a dedicated section for development of each Tutorial Page
block.

Every block must have:

- block type
- block version
- block.id
- schema
- validation
- Composer/editor representation
- persistence representation
- published representation
- learner rendering
- DOM identity
- ILS behavior
- accessibility requirements where applicable
- test coverage
- E2E coverage

Preserve the project's established block naming convention:

Introduction → I-series
Objective → O-series
Definition → D-series
Code → C-series
Summary → S-series

Do not invent alternative naming/versioning conventions.

============================================================
STEP 10 — EXISTING BLOCK EXTENSION SOP
============================================================

Create a separate procedure for modifying an existing block.

Before modification:

1. Inspect current contract.
2. Inspect all consumers.
3. Inspect Composer.
4. Inspect renderer.
5. Inspect persistence.
6. Inspect publication.
7. Inspect ILS.
8. Inspect tests.
9. Establish regression baseline.
10. Determine backward compatibility.

The AI must answer:

"What existing behavior could this change break?"

before coding.

============================================================
STEP 11 — UNIVERSAL VS BLOCK-SPECIFIC RESPONSIBILITIES
============================================================

The SOP must clearly distinguish:

UNIVERSAL TUTORIAL PAGE INFRASTRUCTURE

versus

BLOCK-SPECIFIC IMPLEMENTATION.

Universal responsibilities may include:

- page shell
- block runtime
- block identity
- active block detection
- LHSN
- RHS ILS panel
- learning state
- navigation
- authentication
- page-level routing

Individual blocks should own only their own:

- schema
- presentation
- block-specific interaction
- block-specific validation
- block-specific semantics

Do not duplicate universal functionality inside all 18+ blocks.

============================================================
STEP 12 — LHSN SOP
============================================================

Create a complete LHSN section.

LHSN must be treated as navigation architecture, not merely visual
decoration.

Document verification of:

Domain
 ↓
Subject
 ↓
Topic
 ↓
Subtopic
 ↓
NavigationNode
 ↓
Tutorial Page

For every LHSN-related change verify:

- domain identity
- subject identity
- topic identity
- subtopic identity
- navigationNodeId
- slug
- URL
- published state
- brand
- shared vs brand-specific data
- correct database identity

Explicitly state that the correct identity at a database/service
boundary must be verified rather than inferred.

============================================================
STEP 13 — ILS SOP
============================================================

Create a dedicated ILS architecture and implementation section.

ILS must consume the canonical Tutorial Page/block architecture.

Do not create a parallel tutorial-content architecture for ILS.

The SOP should cover:

- active block
- block.id
- navigationNodeId
- subtopic identity
- learning state
- progress
- visit tracking
- time tracking
- completion
- RHS panel
- collapse/expand
- expanded mode
- synchronization with main content
- API contracts
- database contracts

Explain that ILS must remain downstream of the canonical Tutorial
Page architecture.

============================================================
STEP 14 — MAIN CONTENT PAGE SOP
============================================================

Document the complete Tutorial Page shell:

LHSN
  +
MAIN TUTORIAL CONTENT
  +
RHS ILS PANEL

Explain the responsibility of each area.

The main content page must be able to render all supported blocks
without requiring each block to independently implement page-level
features.

============================================================
STEP 15 — AUTHENTICATION AND BRAND SOP
============================================================

Every authenticated Tutorial Page test must verify:

login
 ↓
token
 ↓
BFF
 ↓
JWT validation
 ↓
user identity
 ↓
brand validation
 ↓
Tutorial Page delivery

For shared components verify both:

SkillUp

and

RealTutorialHub

when applicable.

If a component is shared, explicitly verify shared data behavior.

============================================================
STEP 16 — DATABASE SAFETY SOP
============================================================

Default investigation/certification behavior:

READ ONLY.

Unless explicitly authorized:

NO INSERT
NO UPDATE
NO DELETE
NO ALTER
NO DROP
NO TRUNCATE
NO MIGRATION

The SOP must explain how to distinguish:

read-only diagnostic query

from

mutation.

If a mutation is genuinely required:

- identify it
- document it
- obtain authorization
- test cleanup/rollback
- verify final database state

============================================================
STEP 17 — TEST-FIRST DESIGN
============================================================

The SOP must require test planning BEFORE implementation.

For each feature define:

PURPOSE
PRECONDITIONS
ENVIRONMENT
AUTH USER
BRAND
URL
DATABASE
EXPECTED STATUS
EXPECTED CONTENT
EXPECTED IDENTITY
EXPECTED LOGS
EXPECTED FAILURE CONDITIONS
EXIT CODE

============================================================
STEP 18 — STANDARD TEST PYRAMID
============================================================

Establish this test sequence:

1. Schema/unit
2. Component
3. Service/API
4. Database integration
5. Authenticated HTTP
6. Browser
7. SkillUp E2E
8. RealTutorialHub E2E
9. Real-system E2E
10. Regression

Explain what each layer proves.

Do not allow:

HTTP 200

to automatically equal:

"feature completely verified."

============================================================
STEP 19 — BASELINE TESTING
============================================================

Before implementation:

run relevant type-check/test baseline.

Record existing failures.

After implementation:

run the same checks.

Compare:

BASELINE FAILURES
vs
POST-IMPLEMENTATION FAILURES

A pre-existing failure must not be incorrectly attributed to the
new feature.

A new failure must not be dismissed as pre-existing without evidence.

============================================================
STEP 20 — TYPE CHECK / BUILD REPORTING
============================================================

The SOP must prohibit vague statements such as:

"Type-check passed."

Instead report:

Repository type-check:
PASS / FAIL

Package type-check:
PASS / FAIL

Relevant file:
PASS / FAIL

Pre-existing errors:
LIST

New errors:
LIST

Similarly distinguish:

build
type-check
unit tests
component tests
integration tests
E2E

============================================================
STEP 21 — E2E CERTIFICATION
============================================================

Create a mandatory E2E certification procedure.

At minimum verify:

- authentication
- brand
- route
- hierarchy
- navigationNodeId
- published tutorial
- tutorial identity
- block identity
- content rendering
- LHSN
- ILS endpoints where applicable
- ILS database schema where applicable
- HTTP status
- canonical URL
- multi-brand behavior
- database safety

Use both:

SkillUp

and:

RealTutorialHub

for shared Tutorial Page functionality.

============================================================
STEP 22 — ILS "NO PROGRESS YET" RULE
============================================================

Document the distinction between:

ILS infrastructure unavailable

and:

ILS operational but no learner progress exists.

For a new tutorial, a state such as:

NO_PROGRESS_YET

may be an expected state if:

- endpoint works
- authentication works
- database schema works
- response is valid
- progress is simply absent

Do not misclassify "no learner progress yet" as an infrastructure
failure.

============================================================
STEP 23 — 600-LINE DECOMPOSITION RULE
============================================================

Preserve the project's established production-file decomposition
rule.

No production .ts/.tsx file should exceed 600 lines.

If a file approaches the limit:

STOP.

Identify architectural responsibilities and extract cohesive
modules.

Do not artificially split code merely to satisfy the line count.

============================================================
STEP 24 — NO "CAST UNTIL IT WORKS"
============================================================

The SOP must explicitly prohibit using:

as any

or equivalent unsafe casts

to conceal an architectural mismatch.

If a cast becomes necessary:

STOP.

Determine:

- why the types disagree
- whether the data contract is wrong
- whether an adapter is required
- whether the interface is incomplete
- whether identity ownership is unclear

Prefer explicit typed adapters/mappers/interfaces.

============================================================
STEP 25 — NO HARD-CODED PRODUCTION IDS
============================================================

Production code must never hard-code specific database IDs for
tutorial entities.

No:

topic UUID
subtopic UUID
block UUID
user UUID
navigation UUID

unless the architecture explicitly defines a constant contract that
requires it.

Use relationships/contracts/data instead.

============================================================
STEP 26 — SERVICE CONTRACT SOP
============================================================

Before modifying a service/API contract, inspect:

- service implementation
- all callers
- all consumers
- database query
- tests
- E2E tests

Document:

CURRENT CONTRACT
EXPECTED CONTRACT
PROBLEM
CALLERS
DEPENDENTS
COMPATIBILITY
TEST IMPACT

Prefer correcting the caller's identity/usage when the existing
service contract is already correct.

Do not change a service merely to accommodate an incorrect caller.

============================================================
STEP 27 — DIAGNOSTIC SCRIPT SOP
============================================================

Temporary diagnostics must be controlled.

Every diagnostic script must be classified:

PERMANENT AUDIT/TEST

or

TEMPORARY DIAGNOSTIC

Temporary scripts/files must be removed before certification.

Prefer organized locations such as:

scripts/audit/

rather than creating many root-level scratch files.

Before certification:

git status --short

must be reviewed.

============================================================
STEP 28 — GIT DIFF SOP
============================================================

After implementation:

git status --short
git diff --stat
git diff

Review:

- production files
- test files
- diagnostic files
- generated files
- accidental changes
- unrelated changes
- deleted files
- renamed files

Every changed file must have a reason.

Unexpected changes block certification.

============================================================
STEP 29 — STOP CONDITIONS
============================================================

Create a prominent mandatory STOP CONDITIONS section.

The AI MUST STOP rather than guess if:

1. ID ownership is ambiguous.
2. Internal/external identity is unclear.
3. Database ownership is unclear.
4. Service contract is unclear.
5. Legacy/current architecture boundary is unclear.
6. A new API appears necessary unexpectedly.
7. A database schema change appears necessary.
8. Authentication must change unexpectedly.
9. Brand logic must change unexpectedly.
10. Existing blocks must change unexpectedly.
11. LHSN behavior changes unexpectedly.
12. ILS requires a different identity.
13. `as any` becomes necessary.
14. A hard-coded production ID appears necessary.
15. Existing tests fail differently from baseline.
16. E2E contradicts lower-level tests.
17. Unexpected production files are modified.
18. A database mutation appears necessary.
19. The implementation crosses an undocumented architecture boundary.
20. The AI cannot prove the identity expected by a downstream service.

When stopping, report:

STOP CONDITION
WHY
EVIDENCE
AFFECTED COMPONENT
RISK
OPTIONS
RECOMMENDATION

Do not continue by guessing.

============================================================
STEP 30 — CERTIFICATION STATES
============================================================

Define these project-wide statuses:

🟢 COMPLETE

All required gates pass.

🟡 COMPLETE WITH PRE-EXISTING FAILURES

Feature passes, but unrelated baseline failures remain.

🟠 IMPLEMENTATION COMPLETE — E2E PENDING

Implementation is finished but required runtime verification remains.

🔴 BLOCKED

A known failure prevents certification.

⚪ INVESTIGATION ONLY

No production implementation occurred.

Never declare COMPLETE while a mandatory certification gate remains
pending.

============================================================
STEP 31 — MASTER CERTIFICATION MATRIX
============================================================

Create a reusable matrix:

| Area | Status | Evidence |
|------|--------|----------|
| Architecture | | |
| Identity | | |
| Dependencies | | |
| Database | | |
| API | | |
| Composer | | |
| Block | | |
| LHSN | | |
| Tutorial Page | | |
| Authentication | | |
| ILS | | |
| SkillUp | | |
| RealTutorialHub | | |
| Regression | | |
| Git Diff | | |
| Temporary Files | | |
| DB Mutation Safety | | |

============================================================
STEP 32 — FUTURE 18+ BLOCK TRACKER
============================================================

Include a reusable block-development checklist/table.

Suggested columns:

Block
Type
Version
Schema
Composer
Persistence
Publication
Renderer
DOM Identity
LHSN
ILS
Unit Tests
Component Tests
Integration Tests
SkillUp E2E
RTH E2E
Regression
Certification

Do not invent names for blocks that have not yet been established.

Use placeholders where necessary.

============================================================
STEP 33 — AI AGENT MASTER WORKFLOW
============================================================

Create a copy/paste workflow that future AI agents can follow:

PHASE 0 — READ SOP
PHASE 1 — READ-ONLY AUDIT
PHASE 2 — ARCHITECTURE MAP
PHASE 3 — DEPENDENCY MATRIX
PHASE 4 — IDENTITY MATRIX
PHASE 5 — DATABASE OWNERSHIP
PHASE 6 — CONTRACT REVIEW
PHASE 7 — BASELINE TESTS
PHASE 8 — TEST PLAN
PHASE 9 — IMPLEMENTATION
PHASE 10 — LOCAL VERIFICATION
PHASE 11 — TYPE CHECK
PHASE 12 — COMPONENT/UNIT TESTS
PHASE 13 — INTEGRATION TEST
PHASE 14 — AUTHENTICATED HTTP
PHASE 15 — BROWSER
PHASE 16 — SKILLUP E2E
PHASE 17 — RTH E2E
PHASE 18 — REAL-SYSTEM E2E
PHASE 19 — REGRESSION
PHASE 20 — GIT DIFF
PHASE 21 — CLEANUP
PHASE 22 — FINAL CERTIFICATION

============================================================
STEP 34 — CREATE A COPY/PASTE IMPLEMENTATION PROMPT
============================================================

At the end of the SOP, include a concise but complete template
future AI agents can use when implementing a new block or modifying
an existing feature.

It should begin approximately:

"You are implementing a Tutorial Page feature in the
AuthenticationAndAuthorization project.

You MUST follow:
docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md

Do not code until the read-only audit is complete."

Then include mandatory sections for:

- objective
- current architecture
- dependencies
- identity
- database
- files
- contracts
- implementation
- testing
- E2E
- certification
- stop conditions

============================================================
STEP 35 — DOCUMENT METADATA
============================================================

At the top of the Markdown file include:

# Tutorial Page Engineering SOP

Version: 1.0
Status: Active / Project Standard
Scope: Tutorial Page / Tutorial V2
Audience: Human Developers + AI Coding Agents
Created: [current date]
Last Updated: [current date]

Also include:

"Normative Rule"

This document is mandatory for Tutorial Page implementation unless a
specific project decision explicitly overrides it.

============================================================
STEP 36 — DO NOT OVER-CONDENSE
============================================================

This is a permanent engineering SOP.

Do not produce a short summary.

Make it detailed enough that another AI agent, six months from now,
can understand exactly how to approach a new Tutorial Page block
without needing today's conversation.

However, avoid unnecessary repetition.

Use:

- headings
- numbered procedures
- checklists
- tables
- decision rules
- templates
- examples
- stop conditions
- certification matrices

where they improve clarity.

============================================================
STEP 37 — FINAL VALIDATION OF THE DOCUMENT
============================================================

After creating the Markdown file, review it for:

[ ] Phase 3C-M identity lesson included
[ ] Internal vs external identity clearly explained
[ ] Identity Matrix included
[ ] Dependency Matrix included
[ ] LHSN rules included
[ ] ILS rules included
[ ] Main Tutorial Page architecture included
[ ] 18+ block workflow included
[ ] Existing-block modification workflow included
[ ] Composer included
[ ] Authentication included
[ ] Multi-brand included
[ ] Database safety included
[ ] Test-first rule included
[ ] Baseline comparison included
[ ] Unit/component/API/E2E testing included
[ ] SkillUp E2E included
[ ] RealTutorialHub E2E included
[ ] Real-system E2E included
[ ] 600-line rule included
[ ] No hard-coded IDs rule included
[ ] No "cast until it works" rule included
[ ] Service-contract verification included
[ ] Diagnostic-script cleanup included
[ ] Git diff audit included
[ ] Stop conditions included
[ ] Certification states included
[ ] Certification matrix included
[ ] Future block tracker included
[ ] Copy/paste AI implementation prompt included

============================================================
FINAL RESPONSE REQUIREMENT
============================================================

After creating the Markdown file, report ONLY:

1. File created/updated
2. Exact file path
3. Whether it is new or updated
4. High-level sections included
5. Any ambiguity that could not be resolved from the project
   documentation

Do not claim the application implementation is complete.

Do not modify any production code as part of this task.

============================================================
SOURCE DISCUSSION STARTS BELOW
============================================================

[PASTE THE COMPLETE DISCUSSION HERE]

============================================================
END SOURCE DISCUSSION
============================================================
```

## One important recommendation

When you paste the discussion, **paste it after the `SOURCE DISCUSSION STARTS BELOW` marker exactly as you have it**, including the Phase 3C-M logs and the later testing results.

That gives the project AI two kinds of information:

1. **The SOP rules** we want to establish.
2. **The actual incident evidence** that explains *why* those rules exist.

This is important because the resulting document shouldn't merely say *"use an Identity Matrix."* It should explain that the Phase 3C-M problem was caused by an identifier crossing from TutorialDB into a downstream boundary with a different semantic meaning.

I would also tell the AI **not to modify `LatestVersion.md`, `Project-Architecture.txt`, or any existing architecture document during this task**. The goal should be to create **one authoritative SOP first**, then later we can decide whether the existing architecture documents should reference it.
