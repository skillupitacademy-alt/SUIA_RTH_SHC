# Tutorial Page Engineering SOP

**Version:** 2.0  
**Status:** Active / Project Standard  
**Scope:** Tutorial Page / Tutorial V2 / All Tutorial Blocks / ILS / LSNB  
**Audience:** Human Developers + AI Coding Agents  
**Created:** 2026-09-02  
**Last Updated:** 2026-09-02 (Phase 3 lessons integrated)

**Normative Rule:**  
This document is mandatory for all Tutorial Page implementation unless a specific project decision explicitly overrides it.

**Major Updates in v2.0:**
- Added current architectural model (LSNB → NavigationNode → Tutorial Composer → Page → ILS)
- Added three primary learner-page systems architecture
- Added HTTP E2E harness isolation rules
- Added testing layer separation and certification gates
- Added multi-brand architecture (SkillUp/RTH/SkillHubCore)
- Added cold-start/performance rules
- Added environment variable handling
- Integrated Phase 3 lessons and real-system E2E certification

---

## Table of Contents

### Core Architecture
1. [The Primary Rule](#1-the-primary-rule)
2. [Current Architecture Is Source of Truth](#2-current-architecture-is-source-of-truth)
3. [Current Tutorial Page Architecture Model](#3-current-tutorial-page-architecture-model)
4. [Three Primary Learner-Page Systems](#4-three-primary-learner-page-systems)
5. [Never Mix Legacy and Current Architecture](#5-never-mix-legacy-and-current-architecture)

### Identity & Boundaries
6. [Every Entity Must Have an Identity Contract](#6-every-entity-must-have-an-identity-contract)
7. [Phase 3C-M Lesson: Identity Boundaries](#7-phase-3c-m-lesson-identity-boundaries)
8. [Identity Rule — Never Guess](#8-identity-rule--never-guess)
9. [Database Ownership Must Be Explicit](#9-database-ownership-must-be-explicit)

### Database & Persistence
10. [No Database Changes During Investigation](#10-no-database-changes-during-investigation)
11. [Migration Safety Rule](#11-migration-safety-rule)

### Block Architecture
12. [Every New Block Must Have a Block Contract](#12-every-new-block-must-have-a-block-contract)
13. [Block Versioning Is Permanent](#13-block-versioning-is-permanent)
14. [Every Block Is an Independent Component](#14-every-block-is-an-independent-component)
15. [Universal Features Live Above Individual Blocks](#15-universal-features-live-above-individual-blocks)
16. [Block Identity Rule](#16-block-identity-rule)
17. [DOM Identity Rule](#17-dom-identity-rule)
18. [Active Block Rule](#18-active-block-rule)

### LSNB (Left Sidebar Navigation)
19. [LSNB Is a Navigation System](#19-lsnb-is-a-navigation-system)
20. [LSNB Identity Rule](#20-lsnb-identity-rule)
21. [LSNB Rules](#21-lsnb-rules)

### ILS (Independent Learning System)
22. [ILS Must Not Become a Second Tutorial Architecture](#22-ils-must-not-become-a-second-tutorial-architecture)
23. [ILS Block Identity](#23-ils-block-identity)
24. [ILS UI Architecture](#24-ils-ui-architecture)
25. [Right-Side ILS Panel Must Be Universal](#25-right-side-ils-panel-must-be-universal)
26. [ILS Architecture](#26-ils-architecture)
27. [ILS Progress Model](#27-ils-progress-model)
28. [ILS Completion Rule](#28-ils-completion-rule)
29. [ILS Aggregation Rule](#29-ils-aggregation-rule)

### Implementation Process
30. [New Block Implementation Order](#30-new-block-implementation-order)
31. [New Block Development SOP](#31-new-block-development-sop)
32. [Never Implement Everything in One AI Prompt](#32-never-implement-everything-in-one-ai-prompt)
33. [Read-Only Audit Before Every Feature](#33-read-only-audit-before-every-feature)
34. [Existing Feature Extension SOP](#34-existing-feature-extension-sop)
35. [File Modification Boundary](#35-file-modification-boundary)
36. [600-Line Rule](#36-600-line-rule)

### Testing & Certification
37. [Testing Levels](#37-testing-levels)
38. [HTTP Smoke Test Rule](#38-http-smoke-test-rule)
39. [E2E Certification Rule](#39-e2e-certification-rule)
40. [Cold-Start / Performance Rule](#40-cold-start--performance-rule)
41. [No Progress Rule](#41-no-progress-rule)
42. [Do Not Create Temporary Scripts Everywhere](#42-do-not-create-temporary-scripts-everywhere)
43. [Test Script Must Be Designed Before Implementation](#43-test-script-must-be-designed-before-implementation)
44. [Standard Test Pyramid](#44-standard-test-pyramid)
45. [Required Test Matrix for Every New Block](#45-required-test-matrix-for-every-new-block)
46. [Test Script Contract](#46-test-script-contract)
47. [Test Database Mutation Safety](#47-test-database-mutation-safety)
48. [Pre-Existing Failures Must Be Baselined](#48-pre-existing-failures-must-be-baselined)
49. [Build/Type Check Rule](#49-buildtype-check-rule)
50. [HTTP Test ≠ Browser Test ≠ E2E](#50-http-test--browser-test--e2e)

### Multi-Brand & Authentication
51. [Multi-Brand Rule](#51-multi-brand-rule)
52. [Multi-Brand Testing Is Mandatory](#52-multi-brand-testing-is-mandatory)
53. [Multi-Brand Certification](#53-multi-brand-certification)
54. [Authentication / Authorization Rule](#54-authentication--authorization-rule)
55. [Authentication Must Always Be Included](#55-authentication-must-always-be-included)

### Code Quality
56. [Route Identity Test](#56-route-identity-test)
57. [Block Rendering Test](#57-block-rendering-test)
58. [ILS Test Must Verify Active Block](#58-ils-test-must-verify-active-block)
59. [LSNB + Main Content + ILS Must Be Tested Together](#59-lsnb--main-content--ils-must-be-tested-together)
60. [No "Cast Until It Works"](#60-no-cast-until-it-works)
61. [No Hard-Coded Production IDs](#61-no-hard-coded-production-ids)
62. [No Service Contract Changes Without a Contract Phase](#62-no-service-contract-changes-without-a-contract-phase)

### Project Management
63. [Every Feature Must Have a "Do Not Touch" List](#63-every-feature-must-have-a-do-not-touch-list)
64. [Backend / Frontend Responsibility](#64-backend--frontend-responsibility)
65. [Diff Review Is a Required Phase](#65-diff-review-is-a-required-phase)
66. [Temporary Artifact Cleanup](#66-temporary-artifact-cleanup)
67. [Phase Execution Model](#67-phase-execution-model)
68. [Deployment Rule](#68-deployment-rule)

### Certification
69. [Final Certification Matrix](#69-final-certification-matrix)
70. [Certification States](#70-certification-states)
71. [Stop Conditions](#71-stop-conditions)
72. [Evidence-First Development](#72-evidence-first-development)

### Reference
73. [The Master AI Implementation Workflow](#73-the-master-ai-implementation-workflow)
74. [The 18+ Block Strategy](#74-the-18-block-strategy)
75. [Extending an Existing Block Is Different](#75-extending-an-existing-block-is-different)
76. [Component Dependency Types](#76-component-dependency-types)
77. [The Golden Rule](#77-the-golden-rule)
78. [Master Prompt Template for AI Agents](#78-master-prompt-template-for-ai-agents)

---

## 1. The Primary Rule

### Never start coding before understanding the dependency boundary.

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

**If the AI cannot answer these questions, it must not modify production code.**

---

## 2. Current Architecture Is Source of Truth

This is extremely important.

We have historical documentation, previous architecture versions, and legacy structures. They must **not automatically be treated as current architecture**.

### The hierarchy is:

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

**Use the existing Tutorial Composer rather than rebuilding it**, and only consider database entities demonstrably connected to the current Composer → block → NavigationNode → published Tutorial Page architecture.

---

## 3. Current Tutorial Page Architecture Model

The current production Tutorial Page architecture follows this model:

```text
LSNB (Left Sidebar Navigation)
      |
      | navigation structure
      v
NavigationNode
      |
      v
Tutorial Composer (Authoring System)
      |
      v
TutorialDocument
      |
      v
TutorialBlock[]
      |
      v
tutorial_sections (Database)
      |
      v
Published Tutorial Page
      |
      v
Universal Block Renderer
      |
      +-----------------------+
      |                       |
      v                       v
Main Content Area        ILS (Independent Learning System)
                              |
                              v
                        Learner State
                              |
                              v
                  LearningProgressService
                              |
                              v
                 tutorial_navigation_progress
```

**This is the current model. It must be preserved.**

Historical Tutorial Engine structures (notes, layman, real_life, technical, code, ai_tutor) are **legacy** and must not be reintroduced.

---

## 4. Three Primary Learner-Page Systems

The learner Tutorial Page has three architecturally independent systems:

```text
+----------------------------------------------------------+
|                     TUTORIAL PAGE                        |
+----------------------------------------------------------+
|                                                          |
| LSNB        MAIN CONTENT                       ILS       |
| LEFT        CENTER                             RIGHT     |
|                                                          |
| Navigation   I1                                      ILS |
| Tree         O1                                      UI  |
|              D1                                          |
|              C1                                          |
|              S1                                          |
|                                                          |
+----------------------------------------------------------+
```

### System 1: LSNB (Left Sidebar Navigation)

**Owns:**
- Navigation structure
- Domain → Subject → Topic → Subtopic hierarchy
- navigationNodeId
- Active navigation state
- Navigation links

**Does NOT own:**
- Tutorial block content
- ILS progress persistence
- Learner time analytics

### System 2: Main Tutorial Content (Center)

**Owns:**
- TutorialDocument
- TutorialBlock[] rendering
- Block identity (id, type, version)
- Tutorial page layout
- Block viewport visibility

**Does NOT own:**
- Navigation structure
- ILS UI
- Progress persistence

### System 3: ILS (Right Sidebar Panel)

**Owns:**
- Learning progress UI
- Active block observation
- Engagement metrics display
- Time analysis display
- Progress state display

**Does NOT own:**
- Tutorial block rendering
- Tutorial content
- Navigation structure

**Critical Rule:** These systems are independent. Do NOT merge:
- LSNB + Tutorial Composer
- Tutorial Block + ILS UI
- Tutorial Content + ILS Panel

---

## 5. Never Mix Legacy and Current Architecture

The AI must explicitly classify discovered structures.

Every table/component/service should be classified:

| Classification | Meaning                | Allowed?       |
| -------------- | ---------------------- | -------------- |
| A              | Current + Required     | ✅              |
| B              | Current + Supporting   | ✅              |
| C              | Current + Not required | ⚠️ Don't touch |
| D              | Legacy                 | ❌              |
| E              | Unknown                | ❌ Until proven |

Especially these must not be introduced into new implementation merely because they already exist:

```text
legacy Tutorial Engine
legacy tutorial_progress
legacy block models
legacy content categories
legacy rendering paths
legacy page models
```

---

## 4. Every Entity Must Have an Identity Contract

This is a critical lesson from Phase 3C-M.

For every entity crossing a boundary, document:

```text
Entity
├── local/internal ID
├── external/cross-system ID
├── slug
├── URL identity
└── navigation identity
```

### Example: Tutorial Topic

```text
TutorialDB:
    id = fb47747d-ac1c-4091-bd8e-a8a7d7378e07 (internal)
    externalId = 4b21ddc0-123b-41e3-8ea1-280d37f7f035 (cross-DB)
    slug = java

MainDB:
    topics.id = 4b21ddc0-123b-41e3-8ea1-280d37f7f035

Sidebar:
    topic_id = 4b21ddc0-123b-41e3-8ea1-280d37f7f035

Rule:
    TutorialDB internal operation → use topic.id
    Cross-database operation → use topic.externalId
```

### Example: Subtopic

```text
TutorialDB:
    id = 414f63eb-cccf-4bd1-bcc0-b52df69ce499 (internal)
    externalId = 12efacf1-b5ad-4b43-9fe4-17ba1cf249e4 (cross-DB)

MainDB:
    subtopics.id = 12efacf1-b5ad-4b43-9fe4-17ba1cf249e4

Content service (getTutorialByPage):
    receives externalId (cross-database identity)
```

---

## 5. Phase 3C-M Lesson: Identity Boundaries

### The Problem

After commit 519ca2de, the hierarchy resolution was changed to use TutorialDB tables directly. This caused:

```text
hierarchy.subtopic.id → TutorialDB internal ID (414f63eb...)
```

However, the downstream content service expected:

```text
getTutorialByPage(subtopicId) → WHERE tutorial_subtopics.external_id = ?
```

The service was querying:

```sql
WHERE tutorial_subtopics.external_id = '414f63eb...'  -- Wrong! This is internal ID
```

When it should have been:

```sql
WHERE tutorial_subtopics.external_id = '12efacf1...'  -- Correct! This is external ID
```

**Result:** `SubtopicNotFoundError` because the internal ID doesn't match any `external_id` in the database.

### The Fix

Add explicit `externalId` fields to hierarchy interfaces:

```typescript
hierarchy: {
  topic: {
    id: string;           // TutorialDB internal ID
    externalId: string;   // MainDB topics.id (cross-database identity)
    name: string;
    slug: string;
  };
  subtopic: {
    id: string;           // TutorialDB internal ID
    externalId: string;   // MainDB subtopics.id (cross-database identity)
    name: string;
    slug: string;
  };
}
```

Then use the correct identity at each boundary:

```typescript
// Sidebar lookup uses MainDB identity
eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.externalId)

// Content service uses MainDB identity
getTutorialByPage(hierarchy.subtopic.externalId, ...)
```

### The Permanent Lesson

**An ID is not just a string. Every ID has an owner, semantic meaning, database origin, and boundary contract.**

The bug happened because an identifier was treated as if it were universally valid across architectural boundaries. The system was "locally correct" (the hierarchy resolved successfully from TutorialDB) but "boundary incorrect" (the downstream service received the wrong ID type).

---

## 6. Identity Rule — Never Guess

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

### Before coding, create an Identity Matrix:

| Entity       | System            | Internal ID | External ID         | Used By      |
| ------------ | ----------------- | ----------- | ------------------- | ------------ |
| Topic        | TutorialDB        | topic.id    | topic.externalId    | Sidebar      |
| Subtopic     | TutorialDB        | subtopic.id | subtopic.externalId | Content      |
| Navigation   | MainDB/TutorialDB | —           | navigationNodeId    | Page         |
| Block        | TutorialDB/doc    | block.id    | —                   | Renderer/ILS |

This single step would have prevented much of Phase 3C-M debugging.

---

## 7. Database Ownership Must Be Explicit

Every ID in a new feature must have an owner.

**Bad:**

```typescript
subtopicId: string
```

**Better:**

```typescript
tutorialSubtopicId: string
```

or:

```typescript
subtopicExternalId: string
```

The AI must avoid ambiguous variables like:

```text
id
topicId
subtopicId
sectionId
```

when multiple databases are involved.

---

## 8. No Database Changes During Investigation

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

Phase 3C-M correctly treated database safety as a certification criterion.

---

## 11. Migration Safety Rule

Before executing ANY migration:

check whether generated SQL contains:

```text
DROP TABLE
DROP COLUMN
DROP INDEX
ALTER TABLE
CREATE TABLE
CREATE TYPE
```

Each statement must be explained.

If an existing production field is being added again:

```text
STOP
```

Do not execute the migration.

This specifically protects:

```text
navigation_node_id
```

from being re-added to tutorial_sections when it already exists.

**Never assume:**

```text
TypeScript schema exists
    =
PostgreSQL schema exists
```

**Never execute a migration merely because Drizzle generated it.**

**Before a schema change:**

1. Prove the requirement.
2. Inspect actual production schema.
3. Inspect current Drizzle schema.
4. Inspect migrations/snapshots.
5. Determine ownership.
6. Determine whether an existing field/model is sufficient.
7. Prepare migration.
8. Review generated SQL.
9. Verify destructive statements.
10. Obtain authorization where required.
11. Execute only after validation.

---

## 12. Every New Block Must Have a Block Contract

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

## 10. Block Versioning Is Permanent

The established convention must remain:

```text
Introduction → I-series
Objective    → O-series
Definition   → D-series
Code         → C-series
Summary      → S-series
```

For example:

```text
D1, D2, D3
C1, C2
S1, S2
```

Do **not** rename Definition blocks to I-series or create arbitrary numbering.

**Version means:**

> A meaningful contract/version of that block type.

**Not:**

> Implementation attempt number.

---

## 11. Every Block Is an Independent Component

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

## 12. Universal Features Live Above Individual Blocks

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
D1, C1, S1, I1, ...
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

## 16. Block Identity Rule

Every canonical TutorialBlock has an existing identity.

The identity is:

```text
block.id
block.type
block.version
```

For versioned blocks:

```text
Definition -> D1
Code       -> C1
Summary    -> S1
etc.
```

Do not replace these identifiers with category-based legacy names.

Do not create:

```text
ilsId
progressId
trackingId
```

unless a future explicitly approved architecture requires them.

The block itself remains a content/rendering unit. ILS references block identity.

---

## 17. DOM Identity Rule

The browser must be able to identify the actual rendered block.

The intended identity contract is:

```html
data-block-id="..."
data-block-type="..."
data-block-version="..."
```

Version is required for versioned blocks.

Do not introduce unnecessary wrapper elements.

Prefer adding identity metadata to the existing root DOM element.

The DOM identity foundation must not alter:

- layout
- spacing
- visual styling
- accessibility semantics
- block structure
- existing child relationships

---

## 18. Active Block Rule

The learner MUST NOT manually select the active block.

Development inspection controls may exist separately.

Production learner behavior is:

```text
viewport
   |
   v
rendered block
   |
   v
activeBlockContext
   |
   v
ILS
```

Conceptually:

```text
D1 enters viewport
   -> active block = D1

C1 enters viewport
   -> active block = C1

S1 enters viewport
   -> active block = S1
```

This is a runtime concern.

Do not place ILS UI inside the block.

---

## 19. LSNB Is a Navigation System

LHSN/shared sidebar is not simply UI decoration. It participates in:

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

## 14. LHSN Identity Rule

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

**Phase 3C-M regression occurred exactly because this contract was implicit.**

The final implementation correctly uses `topic.externalId` for the shared sidebar while retaining the TutorialDB internal topic ID separately.

---

## 21. LSNB Rules

LSNB owns:

```text
navigation structure
navigationNodeId
active navigation state
navigation links
```

LSNB does NOT own:

```text
Tutorial block content
ILS progress persistence
learner time analytics
```

A Tutorial Page must preserve:

```text
exact navigationNodeId identity
```

Navigation must not fall back to vague subtopic matching when a navigationNodeId contract exists.

---

## 22. ILS Must Not Become a Second Tutorial Architecture

ILS should consume the Tutorial Page architecture, not replace it.

**Correct:**

```text
TutorialDocument
      ↓
TutorialBlock
      ↓
Block Runtime
      ↓
ILS
```

**Incorrect:**

```text
ILS
 ↓
legacy tutorial structure
 ↓
reconstruct blocks
```

ILS should observe/use the canonical Tutorial Page.

---

## 23. ILS Block Identity

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

## 24. ILS UI Architecture

The ILS right-side panel is reusable.

Its visual hierarchy is:

```text
Overall Progress
      |
      v
Lifecycle & Overview
      |
      v
Engagement Metrics
      |
      v
Time Analysis
```

**Color rules:**

```text
Brand PRIMARY
    -> Overall Progress

Brand SECONDARY
    -> Lifecycle & Overview

Existing ORANGE
    -> Engagement Metrics

Existing BLUE
    -> Time Analysis
```

Do not replace established metric colors without explicit design authorization.

Typography and existing shared design-system conventions must be reused.

Do not introduce a second independent design system.

---

## 25. Right-Side ILS Panel Must Be Universal

Based on the established Tutorial Page design:

```text
LHSN
 │
Tutorial Content
 │
RHS ILS Panel
```

The RHS panel must:

* Exist universally across Tutorial Pages
* Be reusable for all block types
* React to the active block
* Support collapse/expand
* Support expanded/full viewport mode
* Not become embedded into each individual block

**Architecture:**

```text
Page Shell
├── LHSN
├── Main Tutorial Content
│   └── TutorialBlockRenderer
└── ILS Panel
```

**Not:**

```text
D1 → ILS
C1 → ILS
S1 → ILS
```

---

## 26. ILS Architecture

ILS is a reusable learning-state system.

ILS is NOT a second Tutorial Renderer.

ILS is NOT embedded inside D1/C1/S1.

ILS does NOT own Tutorial content.

ILS does NOT create duplicate Tutorial blocks.

ILS observes the current Tutorial Page and its blocks.

The conceptual relationship is:

```text
Tutorial Page
     |
     +-- navigationNodeId
     |
     +-- sectionId
     |
     +-- blocks[]
             |
             +-- blockId
             +-- blockType
             +-- blockVersion
                     |
                     v
                ILS Runtime
                     |
                     v
                Learning State
```

The ILS right-side panel is a separate reusable UI surface.

---

## 27. ILS Progress Model

The primary learner-state record is navigation-node level.

Conceptually:

```text
user
  +
navigationNode
  +
section
  +
subtopic
```

with block-level completion evidence.

ILS may track:

```text
status
completedBlocks
active time
visits
revisions
timestamps
completion
```

Block completion identity must preserve:

```text
blockId
blockVersion
```

Do not reduce completion to only:

```text
blockType
```

---

## 28. ILS Completion Rule

The client does NOT define completion requirements.

The server resolves the canonical required block set.

Conceptually:

```text
tutorial_sections
      |
      v
canonical blocks
      |
      v
required block set
      |
      v
LearningProgressService
      |
      v
completion decision
```

Therefore:

```text
client claim
    !=
authoritative completion
```

The server must remain authoritative.

---

## 29. ILS Aggregation Rule

Block-level learning state contributes to navigation-node/page state.

Conceptually:

```text
D1
C1
S1
 |
 v
block states
 |
 v
navigation-node state
 |
 v
page-level progress
```

The exact aggregation rules must live in the service/domain layer, not inside presentation components.

---

## 30. New Block Implementation Order

For every new block:

```text
STEP 1:  Architecture audit
STEP 2:  Dependency map
STEP 3:  Identity map
STEP 4:  Schema contract
STEP 5:  Composer/editor
STEP 6:  Persistence
STEP 7:  Publication
STEP 8:  Learner retrieval
STEP 9:  Renderer
STEP 10: Universal DOM identity
STEP 11: ILS integration
STEP 12: LHSN integration if applicable
STEP 13: Tests
STEP 14: E2E
STEP 15: Regression testing
STEP 16: Diff audit
STEP 17: Cleanup
STEP 18: Certification
```

---

## 31. New Block Development SOP

For EVERY new Tutorial Page block, follow this sequence.

**STEP 1 — READ-ONLY AUDIT**

Inspect:
- existing block taxonomy
- current TutorialDocument type
- renderer
- composer integration
- validation
- existing tests
- current CSS/design system
- ILS runtime contract
- persistence requirements

STOP if ownership is unclear.

**STEP 2 — IDENTITY CONTRACT**

Define:
- block.id
- block.type
- block.version if applicable
- DOM identity requirements
- child/container behavior

**STEP 3 — DATABASE IMPACT**

Determine:
- Does this feature require a new database field?
- Does existing TutorialDocument JSON already support it?
- Does ILS need persistent state?
- Does anything cross databases?

Default answer: DO NOT change schema unless evidence proves it necessary.

**STEP 4 — TYPE CONTRACT**

Define TypeScript interfaces/types.

Validate:
- required fields
- optional fields
- versioning
- defaults
- backwards compatibility

**STEP 5 — COMPOSER SUPPORT**

Ensure the existing Composer can produce the block.

Do NOT create a page-specific editor.

**STEP 6 — RENDERER**

Implement the learner-facing renderer.

Preserve:
- existing root DOM
- accessibility
- layout
- spacing
- responsive behavior

**STEP 7 — DOM IDENTITY**

Add:
- data-block-id
- data-block-type
- data-block-version

where applicable.

**STEP 8 — ILS COMPATIBILITY**

Determine whether the block:
- participates in completion
- contributes time
- contributes visit/revision state
- is informational only
- is a container only

Do not invent semantics.

**STEP 9 — TESTS**

At minimum test:
- valid rendering
- invalid data
- identity
- version
- responsive behavior where applicable
- nested/container behavior
- existing regression surface

**STEP 10 — TYPECHECK / LINT**

Run the project's existing checks.

**STEP 11 — BUILD**

Run the correct package/build verification.

**STEP 12 — LOCAL RUNTIME**

Start the relevant applications.

Test the real browser path.

**STEP 13 — E2E**

Verify:
- auth
- navigation
- page delivery
- block rendering
- ILS
- brand behavior

**STEP 14 — GIT REVIEW**

Inspect:
- git status
- git diff
- changed files
- line counts

**STEP 15 — STOP**

Do not begin the next block until this block is accepted.

---

## 32. Never Implement Everything in One AI Prompt

Don't tell the AI:

> "Build D2 including database, API, Composer, UI, ILS, testing."

Instead divide it:

```text
PHASE A: READ-ONLY ARCHITECTURE AUDIT
PHASE B: CONTRACT DESIGN
PHASE C: BACKEND/DATABASE
PHASE D: COMPOSER
PHASE E: LEARNER RENDERING
PHASE F: ILS
PHASE G: LHSN
PHASE H: TESTING
PHASE I: E2E CERTIFICATION
```

The AI cannot proceed to the next phase until the previous phase is verified.

---

## 20. Read-Only Audit Before Every Feature

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

## 34. Existing Feature Extension SOP

When extending an existing feature, do NOT rebuild it.

First identify:

```text
current implementation
current public contract
existing tests
production consumers
```

Then modify only the smallest necessary boundary.

Required sequence:

```text
READ
 ↓
MAP
 ↓
MODIFY
 ↓
TEST
 ↓
REGRESSION TEST
 ↓
E2E
```

---

## 35. File Modification Boundary

Before coding, the AI must produce:

```text
PRODUCTION FILES TO MODIFY:
1. xxx.ts
2. xxx.tsx
3. xxx.ts

TEST FILES TO MODIFY:
1. xxx.test.ts
2. xxx.e2e.mjs

FILES EXPLICITLY NOT TO TOUCH:
1. xxx
2. xxx
3. xxx
```

If implementation discovers another required file:

> **STOP and explain why before modifying it.**

This prevents scope creep.

---

## 22. 600-Line Rule

**No modified/new production `.ts`/`.tsx` file may exceed 600 lines.**

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

Do not artificially split files just to satisfy the number. The existing architecture documentation explicitly establishes this decomposition rule.

---

## 23. Do Not Create Temporary Scripts Everywhere

Instead of:

```text
audit-1.mjs, audit-2.mjs, check-1.mjs, diagnose-1.mjs, find-1.mjs, test-1.mjs, ...
```

Use:

```text
scripts/audit/<phase>/<purpose>.mjs
```

And decide beforehand:

```text
PERMANENT TEST
```

versus:

```text
TEMPORARY DIAGNOSTIC
```

Temporary diagnostics must be removed before certification.

**Phase 3C-M audit accumulated 42 untracked diagnostic artifacts**, which is exactly the kind of overhead this SOP should prevent.

---

## 24. Test Script Must Be Designed Before Implementation

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

**Not:**

```text
Implement → "How do we test this?"
```

---

## 25. Standard Test Pyramid

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

## 26. Required Test Matrix for Every New Block

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

## 27. Test Script Contract

Every test script must state:

```text
PURPOSE:
PRECONDITIONS:
ENVIRONMENT:
AUTH USER:
BRAND:
URL:
DATABASE:
EXPECTED STATUS:
EXPECTED CONTENT:
EXPECTED IDENTITY:
EXPECTED LOGS:
EXPECTED FAILURE CONDITIONS:
EXIT CODE:
```

---

## 28. Test Database Mutation Safety

Every test must declare whether it is:

```text
READ-ONLY
```

or:

```text
MUTATING
```

**Default:**

> All certification tests are READ-ONLY unless the test specifically verifies a write operation.

If a write is required:

```text
identify table
identify record
identify cleanup
verify cleanup
```

---

## 29. Pre-Existing Failures Must Be Baselined

Before implementation:

```bash
pnpm type-check
pnpm test
# relevant package test
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

**Not:**

> "All tests pass."

Phase 3C-M investigation correctly separated unrelated `CookieBrand` type errors and Code C1 failures from the identity fix.

---

## 30. Build/Type Check Rule

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

**Example:**

```text
@quiz/ui: ✅ PASS

Repository: ⚠️ PRE-EXISTING api-server errors
```

This prevents misleading certification.

---

## 31. HTTP Test ≠ Browser Test ≠ E2E

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
database → hierarchy → navigation → tutorial → block → ILS → progress
```

**Never claim one proves the others.**

---

## 32. Multi-Brand Testing Is Mandatory

Because we have:

```text
SkillUp
RealTutorialHub
```

Every shared Tutorial Page feature must test both brands.

If shared:

```text
brand_id = shared
```

must be explicitly verified.

---

## 33. Authentication Must Always Be Included

Do not certify a Tutorial Page using:

```text
unauthenticated curl
```

when the actual route requires authentication.

Certification should verify:

```text
login → access token → BFF → JWT → brand validation → user identity → Tutorial Page
```

Phase 3C-M certification explicitly verified authentication and brand validation.

---

## 34. Route Identity Test

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

## 35. Block Rendering Test

For every block:

```text
document → block[] → block.id → block.type → block.version → renderer → DOM
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

## 36. ILS Test Must Verify Active Block

When ILS is implemented:

```text
Scroll → Block enters viewport → activeBlock changes → RHS panel updates → progress state updates if required
```

Test:

```text
D1 active → C1 active → D2 active → S1 active
```

Do not only test:

```text
ILS panel opens.
```

That proves almost nothing.

---

## 37. LHSN + Main Content + ILS Must Be Tested Together

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

## 38. No "Cast Until It Works"

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

Phase 3C-M implementation had one documented cast for accessing `externalId`; future work should preferentially eliminate such ambiguity at the type level.

---

## 39. No Hard-Coded Production IDs

**Never:**

```typescript
if (topicId === "4b21ddc0...")
```

**Never:**

```typescript
if (subtopicId === "12efacf1...")
```

IDs belong to data. Code should operate on:

```text
relationships
externalId
navigationNodeId
slug
block.id
```

not specific Java IDs.

---

## 40. No Service Contract Changes Without a Contract Phase

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

**Phase 3C-M success came partly from NOT modifying `getTutorialByPage()`**, but instead correcting the caller's identity. That is exactly the pattern we want to repeat.

---

## 41. Every Feature Must Have a "Do Not Touch" List

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

## 42. Diff Review Is a Required Phase

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

## 43. Temporary Artifact Cleanup

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

Phase 3C-M audit demonstrated the importance of this because 42 temporary files accumulated during debugging.

---

## 44. Final Certification Matrix

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

## 45. Certification States

Never simply say "COMPLETE". Use:

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

---

## 46. The Master AI Implementation Workflow

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

## 47. The 18+ Block Strategy

For the remaining blocks, maintain a master registry:

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

## 48. Extending an Existing Block Is Different

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

## 49. Component Dependency Types

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
D2, C1, S1 → TutorialBlockRenderer
```

### Cross-system dependency

```text
Tutorial Page → MainDB
```

### External identity dependency

```text
TutorialDB → externalId → MainDB
```

This classification must be included in each implementation plan.

---

## 50. Stop Conditions for AI

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
19. The implementation crosses an undocumented architecture boundary.
20. The AI cannot prove the identity expected by a downstream service.
```

Then the AI must report:

```text
STOP CONDITION
WHY
EVIDENCE
AFFECTED COMPONENT
RISK
OPTIONS
RECOMMENDATION
```

and wait.

---

## 51. The Golden Rule

**DO NOT GUESS ARCHITECTURE. DO NOT GUESS IDENTITIES. DO NOT GUESS DATABASE OWNERSHIP. DO NOT GUESS SERVICE CONTRACTS.**

### INSPECT → MAP → VERIFY → IMPLEMENT → TEST → CERTIFY

**Not:**

```text
GUESS → CODE → 404 → GUESS AGAIN
```

---

## 78. Phase Execution Model

Every project phase uses:

```text
AI AUDIT
   ↓
HUMAN REVIEW
   ↓
IMPLEMENTATION AUTHORIZATION
   ↓
CODE
   ↓
TEST
   ↓
BUILD
   ↓
LOCAL RUNTIME
   ↓
BROWSER / E2E
   ↓
GIT REVIEW
   ↓
COMMIT
   ↓
DEPLOY
   ↓
PRODUCTION VALIDATION
   ↓
NEXT PHASE
```

Do NOT skip gates.

Do NOT automatically continue to the next phase.

---

## 79. Backend / Frontend Responsibility

Claude / Backend agent owns:

```text
database
migrations
repositories
services
API
authentication
authorization
backend/runtime contracts
E2E backend infrastructure
```

Gemini / Frontend agent owns:

```text
visual UI
React/TSX implementation
responsive design
learner page UI
ILS panel UI
frontend interaction
```

Neither agent should silently take ownership of the other's boundary.

---

## 80. Deployment Rule

Local validation is NOT production validation.

Before deployment:

```text
build
lint
tests
typecheck
diff review
```

After deployment:

```text
health checks
authentication
gateway
brand resolution
API
Tutorial Page
LSNB
ILS
browser journey
logs
```

Do not push/deploy automatically unless explicitly authorized.

---

## 81. Multi-Brand Certification

Both brands must ultimately be tested:

```text
SkillUp
RealTutorialHub
```

The same shared implementation should be validated under both brand contexts.

Verify:

```text
correct brand
correct theme
correct identity
correct navigation
correct Tutorial content
correct ILS behavior
no cross-brand state leakage
```

A brand passing alone is not sufficient for multi-brand certification.

---

## 82. Evidence-First Development

Every implementation report must include:

```text
Problem
Evidence
Root Cause
Architectural Boundary
Proposed Change
Files Affected
Files Explicitly NOT Changed
Tests
Typecheck
Build
E2E
Diff
Git Status
Remaining Risks
```

The agent must distinguish:

```text
PROVEN
INFERRED
UNKNOWN
BLOCKED
```

---

## 83. Master Prompt Template for AI Agents

Use this as a header for every future Tutorial Page implementation prompt:

```text
============================================================
TUTORIAL PAGE ENGINEERING SOP — MANDATORY
============================================================

You are working on the AuthenticationAndAuthorization /
Tutorial Engine project.

You MUST follow:
docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md

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
MANDATORY FIRST PHASE: READ-ONLY AUDIT
============================================================

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
- ARCHITECTURE MAP
- DEPENDENCY MAP
- IDENTITY MATRIX
- DATABASE MATRIX
- FILE CHANGE PLAN
- TEST PLAN
- RISK REGISTER

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
- block.id
- block.type
- block.version

architecture.

Do not create parallel block identity systems.

Universal behavior belongs in shared infrastructure,
not duplicated inside individual block renderers.

============================================================
LHSN RULE
============================================================

LHSN is part of the navigation architecture.

Verify:
- domain, subject, topic, subtopic
- navigationNodeId
- URL
- brand
- published state

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

No INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE/migration
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
- FILES TO MODIFY
- FILES NOT TO MODIFY

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
- COMPLETE
- COMPLETE WITH PRE-EXISTING FAILURES
- IMPLEMENTATION COMPLETE — E2E PENDING
- BLOCKED
- INVESTIGATION ONLY

Never use "COMPLETE" when a required gate remains pending.

============================================================
```

---

## END OF SOP

**For questions about this SOP, consult the Phase 3C-M incident analysis in project logs or discuss with the architecture team.**

**This is a living document. Update it as new lessons emerge from Tutorial Page development.**


---

## Version History

**v1.0 (2026-09-02):**
- Initial SOP creation
- Phase 3C-M identity boundary lessons
- 600-line rule
- Block versioning
- ILS architecture
- LSNB separation

**v2.0 (2026-09-02):**
- Added current architectural model (LSNB → NavigationNode → Tutorial Composer → Page → ILS)
- Added three primary learner-page systems architecture (LSNB / Main Content / ILS)
- Added HTTP E2E harness isolation rules (Vitest exclusion for standalone scripts)
- Added testing layer separation (Component / HTTP Smoke / Real-system E2E)
- Added multi-brand architecture details (SkillUp/RTH/SkillHubCore roles)
- Added cold-start/performance rules (Next.js compilation latency)
- Added NO_PROGRESS_YET classification for new tutorials
- Added Block Identity Rule, DOM Identity Rule, Active Block Rule
- Added ILS Architecture, Progress Model, Completion Rule, Aggregation Rule
- Added New Block Development SOP (15-step process)
- Added Phase Execution Model
- Added Backend/Frontend Responsibility boundaries
- Added Deployment Rule
- Added Multi-Brand Certification requirements
- Added Evidence-First Development rules
- Integrated Phase 3 real-system E2E certification lessons

