# ILS IMPLEMENTATION MASTER PLAN

**Status:** LOCKED AND APPROVED  
**Date:** 2026-08-29  
**Architecture Decision:** Phase 1C-A.4 Complete  
**Next Phase:** Phase 1C-A.5 (Clean Baseline + ILS Migration)

---

## EXECUTION ROADMAP

```text
EXISTING / COMPLETE
────────────────────────────────────────────────────

NavigationNode → Tutorial Composer              ✅
Current Block Architecture                      ✅
Tutorial Page Creation                          ✅
Tutorial Page Publishing                        ✅
Learner can see Published Page                  ✅
Universal Runtime Foundation                    ✅
Progress Repository                             ✅
LearningProgressService                         ✅
ILS API / C2-V5                                 ✅
ILS checkpoint: be5a05eb                       ✅


                    ↓


PHASE 1C-A.5
Clean Baseline Establishment + ILS Migration
Claude — CONTROLLED DATABASE OPERATION
                    ↓
PHASE 1C-B
ILS Persistence Integration
Claude backend
                    ↓
PHASE 1C-C
ILS API / Service Integration
Claude
                    ↓
PHASE 1C-D
Learner Tutorial Page ILS UI
Claude backend + Gemini frontend
                    ↓
PHASE 2
ILS ↔ Document / Block Contract
Claude + Gemini coordination
                    ↓
PHASE 3
Universal Learner Page + ILS Runtime
Claude backend + Gemini frontend
                    ↓
PHASE 4
Block-Level ILS Integration
Claude runtime contract + Gemini UI
                    ↓
PHASE 5
NavigationNode Aggregate Learning State
Claude
                    ↓
PHASE 6
Composer ↔ ILS Integration
Claude backend + Gemini Composer UI
                    ↓
PHASE 7
Save → Preview → Publish Integration
Claude + Gemini
                    ↓
PHASE 8
Published Learner Delivery
Claude + Gemini
                    ↓
PHASE 9
Complete Local Browser E2E
Claude + Gemini
                    ↓
PHASE 10
Production Deployment + Verification
Claude
```

---

## GLOBAL ARCHITECTURAL RULES

**THESE RULES MUST BE INCLUDED IN EVERY CLAUDE/GEMINI PROMPT**

```text
============================================================
GLOBAL PROJECT RULES
============================================================

1. DO NOT rebuild the existing Tutorial Composer.

2. DO NOT rebuild the existing Tutorial Page.

3. DO NOT replace the existing navigationNodeId architecture.

4. DO NOT revive legacy Tutorial DB architecture.

5. DO NOT use legacy Tutorial DB tables for new work.

6. CURRENT CODE + ACTUAL DATABASE + CURRENT ARCHITECTURE
   are the source of truth.

7. Historical documentation is reference only.

8. Do not infer that an old table is current merely because
   it exists in the repository or PostgreSQL.

9. ILS is a learning/progress domain.

10. ILS does NOT own Tutorial content.

11. ILS does NOT duplicate Tutorial blocks.

12. Tutorial Composer owns authoring.

13. Tutorial Page owns learner presentation.

14. ILS owns learner learning state/progress.

15. navigationNodeId identifies the Tutorial navigation/page context.

16. Block identity remains block-specific.

17. Block version must remain identifiable.

18. Brand is a platform context, not a separate duplicated
    Tutorial architecture.

19. Shared SkillHubCore services must remain shared.

20. RTH and SUIA may have different presentation/business
    configurations, but should reuse shared platform capabilities.

21. Authentication and authorization remain centralized.

22. Do not bypass the existing API Gateway/BFF/security architecture.

23. Do not expose database credentials or secrets in reports.

24. Never modify production unless the current phase explicitly
    authorizes it.

25. Every implementation phase requires:
       tests
       typecheck
       build
       local runtime verification
       browser verification
       acceptance checkpoint
       commit

26. Do not proceed to the next phase until the current phase
    passes its acceptance gate.
```

---

## IMMEDIATE NEXT ACTION

### Phase 1C-A.5 — Clean Baseline Establishment + ILS Migration Execution

**Phase 1C-A.5 should NOT start by executing the contaminated `0022_complete_rage.sql`**

The current migration is contaminated with:
```sql
DROP INDEX idx_tutorial_v2_delivery;
DROP INDEX uq_tutorial_v2_identity_active;

ALTER TABLE tutorial_sections
ADD COLUMN navigation_node_id text NOT NULL;
```

These statements are **FORBIDDEN** because `navigation_node_id` already exists in production.

**Desired migration contains ONLY:**
```sql
CREATE TABLE tutorial_navigation_progress (...);

CREATE UNIQUE INDEX uq_navigation_progress_user_node ...;

CREATE INDEX idx_navigation_progress_user ...;

CREATE INDEX idx_navigation_progress_subtopic ...;

CREATE INDEX idx_navigation_progress_node ...;

CREATE INDEX idx_navigation_progress_last_viewed ...;
```

---

### Phase 1C-A.5 Controlled Execution Sequence

```text
A.5.1
Establish/repair canonical Drizzle baseline
        ↓
A.5.2
Generate clean 0022
        ↓
A.5.3
Review SQL
        ↓
USER APPROVAL
        ↓
A.5.4
Execute 0022
        ↓
A.5.5
Production verification
        ↓
A.5 COMPLETE
```

**Only after A.5 completion proceed to Phase 1C-B (ILS Persistence Integration)**

---

## MASTER ARCHITECTURE

### Current Canonical Architecture (LOCKED)

```text
                         SHARED SKILLHUBCORE
                                  │
                    Authentication / Authorization
                                  │
                         Brand / RBAC Context
                                  │
                         ┌────────┴────────┐
                         │                 │
                        RTH               SUIA
                         │                 │
                         └────────┬────────┘
                                  │
                              API Gateway
                                  │
                                  ▼
                         Shared Backend APIs
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
               Tutorial       Learning       Other
               Services        / ILS        Services
                    │             │
                    ▼             ▼
              TutorialDB      Progress DB
                    │             │
                    │             │
                    └──────┬──────┘
                           │
                           ▼
                    Published Document
                           │
                     navigationNodeId
                           │
                           ▼
                    Universal Renderer
                           │
                    ┌──────┼──────┐
                    ▼      ▼      ▼
                   I1     D1     C1 ...
                    │      │      │
                    └──────┼──────┘
                           ▼
                    Block-level ILS
                           │
                           ▼
                 Navigation-node aggregate
                           │
                           ▼
                     Learner UI state
```

### Tutorial Page Flow

```text
                    navigationNodeId
                           │
                           ▼
                  tutorial_sections
                           │
                  PAGE CONTENT
                           │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
             I1         D1         C1
              │          │          │
              └──────────┼──────────┘
                         ▼
                   TUTORIAL PAGE
                         │
                         │ observes
                         ▼
                        ILS
                         │
                         ▼
            tutorial_navigation_progress
```

**Key Principle:**
> The Tutorial Composer creates the learning document; the Universal Renderer executes it; ILS observes learner interaction and persists learning state; the navigation-node state is derived from its constituent blocks.

---

## RESPONSIBILITY MATRIX (LOCKED)

| Area                       |    Claude   | Gemini |
| -------------------------- | :---------: | :----: |
| PostgreSQL                 |      ✅      |    ❌   |
| Drizzle                    |      ✅      |    ❌   |
| Migrations                 |      ✅      |    ❌   |
| Repository                 |      ✅      |    ❌   |
| Service                    |      ✅      |    ❌   |
| API                        |      ✅      |    ❌   |
| BFF backend                |      ✅      |    ❌   |
| Authentication             |      ✅      |    ❌   |
| Authorization/RBAC         |      ✅      |    ❌   |
| ILS business rules         |      ✅      |    ❌   |
| Learning-state calculation |      ✅      |    ❌   |
| Tutorial Composer backend  |      ✅      |    ❌   |
| Tutorial Composer UI       |      ❌      |    ✅   |
| Tutorial Page UI           |      ❌      |    ✅   |
| Block UI                   |      ❌      |    ✅   |
| Renderer UI                |      ❌      |    ✅   |
| Right Learning Panel UI    |      ❌      |    ✅   |
| Responsive design          |      ❌      |    ✅   |
| Browser UI verification    |    Joint    |  Joint |
| Production DB              | Claude only |    ❌   |

---

## PHASE-BY-PHASE EXECUTION PROMPTS

### PHASE 1C-A.5 — CLAUDE PROMPT

```text
# ================================================================
# PHASE 1C-A.5 — CLEAN BASELINE ESTABLISHMENT + ILS MIGRATION
# ================================================================

OBJECTIVE

Establish correct Drizzle baseline representing current production
architecture (39 COMMON tables from Phase 1C-A.4) and generate clean
migration 0022 containing ONLY tutorial_navigation_progress creation.

CONTEXT

Phase 1C-A.4 established:
- Source tables: 66 (42 current, 15 legacy, 9 future)
- Database tables: 45 (39 common with source, 6 database-only external)
- Current baseline: 39 COMMON tables
- Next migration target: tutorial_navigation_progress (ILS table)

Current migration 0022_complete_rage.sql is CONTAMINATED with:
- ALTER TABLE tutorial_sections ADD COLUMN navigation_node_id
- This column ALREADY EXISTS in production
- Migration cannot be executed in current form

CRITICAL RULES

1. Production database is CORRECT—preserve it
2. Baseline must represent 39 COMMON tables only
3. Clean migration 0022 must contain ONLY tutorial_navigation_progress
4. No ALTER TABLE tutorial_sections permitted
5. No legacy table restoration
6. No external table import

CONTROLLED EXECUTION SEQUENCE

A.5.1 — BASELINE ANALYSIS

Determine the exact discrepancy between:
- Drizzle snapshot 0021 (stale)
- Current source schema (66 tables)
- Production database (45 tables, 39 common with source)

Identify why drizzle-kit generate produces contaminated migration.

DO NOT modify anything yet.

A.5.2 — BASELINE STRATEGY

Choose one approach:

OPTION A: Snapshot correction
- Back up current 0022 artifacts
- Restore/correct snapshot to represent 39 COMMON tables
- Regenerate migration

OPTION B: Surgical migration generation
- Use drizzle-kit with filtered schema
- Generate migration for tutorial_navigation_progress only
- Preserve snapshot state

OPTION C: Manual baseline establishment
- Create __drizzle_migrations if not exists
- Establish baseline through migration journal
- Generate next migration cleanly

Document chosen strategy with justification.

A.5.3 — IMPLEMENTATION PREPARATION

Before any modification:
1. Create complete backup of:
   - Current migration 0022 (already backed up)
   - Snapshot 0021
   - Snapshot 0022 (if exists)
   - _journal.json
   - All source schema files

2. Document rollback procedure

3. Define verification tests

DO NOT proceed without approval.

A.5.4 — BASELINE ESTABLISHMENT

Execute approved strategy.

Generate clean migration 0022.

Verify migration contains:
✅ CREATE TABLE tutorial_navigation_progress
✅ CREATE INDEX statements for ILS table
❌ NO ALTER TABLE tutorial_sections
❌ NO legacy table creation
❌ NO external table creation

A.5.5 — MIGRATION REVIEW

Display complete migration SQL.

Verify:
- SQL syntax correct
- Only ILS table creation
- Indexes match schema definition
- No contamination

STOP for user approval.

A.5.6 — MIGRATION EXECUTION

After explicit user approval:
1. Connect to tutorial_prod (production database)
2. Begin transaction
3. Execute migration 0022
4. Verify table creation
5. Verify indexes
6. Commit transaction
7. Update migration journal

A.5.7 — PRODUCTION VERIFICATION

Query production database:

1. Verify tutorial_navigation_progress exists
2. Verify structure matches schema
3. Verify indexes exist
4. Verify __drizzle_migrations updated
5. Verify tutorial_sections unchanged
6. Verify no legacy tables created

A.5.8 — PHASE COMPLETION

Document:
- Baseline strategy used
- Migration executed
- Production state verified
- Any deviations from expected
- Rollback procedure if needed

Mark Phase 1C-A.5 COMPLETE only if:
✅ Baseline established correctly
✅ Migration 0022 clean and executed
✅ tutorial_navigation_progress exists in production
✅ tutorial_sections unchanged
✅ No legacy contamination
✅ Production verified

SAFETY RULES

- Mask all database credentials in reports
- Use transactions for migration execution
- Maintain rollback capability
- Do not modify production without explicit approval
- Stop at any verification failure
```

---

### PHASE 1C-B — CLAUDE PROMPT

**Use ONLY after Phase 1C-A.5 complete**

```text
# ================================================================
# PHASE 1C-B — ILS PERSISTENCE INTEGRATION
# ================================================================

OBJECTIVE

Integrate tutorial_navigation_progress table into existing
Progress Repository and LearningProgressService.

CONTEXT

Phase 1C-A.5 established:
✅ tutorial_navigation_progress exists in production
✅ Clean baseline established
✅ Current architecture preserved

Existing infrastructure:
✅ Progress Repository
✅ LearningProgressService
✅ ILS API / C2-V5

SCOPE

Backend persistence layer only.
DO NOT modify frontend yet.
DO NOT modify Composer yet.
DO NOT modify Tutorial Page yet.

REQUIRED IMPLEMENTATION

1. Repository Layer
   - Add tutorial_navigation_progress queries
   - CRUD operations for ILS state
   - Atomic upsert for progress updates
   - Session/visit tracking queries
   - Block completion tracking
   - Aggregate state queries

2. Service Layer
   - Extend LearningProgressService
   - Implement business logic for:
     * Visit tracking (with session deduplication)
     * Active time accumulation
     * Block completion
     * Navigation node completion
     * Revision tracking
   - Maintain existing service contracts

3. Type Safety
   - Define TypeScript types
   - Match database schema exactly
   - Type-safe queries
   - Type-safe responses

4. Testing
   - Unit tests for repository
   - Unit tests for service
   - Integration tests
   - Test session deduplication
   - Test completion logic
   - Test aggregate calculations

ARCHITECTURE RULES

1. navigationNodeId is primary page identity
2. sectionId is optional (may not exist yet)
3. subtopicId is required curriculum reference
4. userId identifies learner
5. brandId resolved from context (not stored redundantly)
6. completedBlocks stores [{blockId, blockVersion, completedAt}]
7. Session deduplication uses lastSessionId comparison
8. Visit increment only on new session
9. Revision increment only after completion + new visit

IMPLEMENTATION CHECKLIST

□ Repository queries implemented
□ Service methods implemented
□ Types defined
□ Unit tests pass
□ Integration tests pass
□ TypeScript compilation passes
□ No backend build errors
□ Documentation updated

DELIVERABLES

1. Updated repository code
2. Updated service code
3. Type definitions
4. Test suite
5. Phase completion report

STOP after testing passes.
Await approval before Phase 1C-C.
```

---

### PHASE 1C-C — CLAUDE PROMPT

**Use ONLY after Phase 1C-B complete**

```text
# ================================================================
# PHASE 1C-C — ILS API / SERVICE INTEGRATION
# ================================================================

OBJECTIVE

Expose ILS persistence capabilities through existing API layer.

CONTEXT

Phase 1C-B established:
✅ Repository layer with tutorial_navigation_progress
✅ LearningProgressService with ILS methods
✅ Type-safe persistence layer

SCOPE

API layer integration only.
Use existing API Gateway/BFF architecture.
Maintain C2-V5 security boundary.
DO NOT bypass authentication.
DO NOT bypass authorization.

REQUIRED API ENDPOINTS

Verify/extend existing:

POST /api/learning/complete-node
  - Mark navigation node complete
  - userId from auth context
  - navigationNodeId from request
  - Verify authorization

POST /api/learning/active-time
  - Record active learning time
  - Session-aware
  - Idempotent

POST /api/learning/block-completion
  - Mark block complete
  - blockId + blockVersion required
  - navigationNodeId context
  - Idempotent

POST /api/learning/visit
  - Record page visit
  - Session deduplication
  - Visit vs revision logic

GET /api/learning/navigation/[nodeId]
  - Retrieve node progress for current user
  - Aggregate state
  - Block completion list

GET /api/learning/subtopic/[subtopicId]/progress
  - Subtopic-level aggregate
  - List of node progress

SECURITY REQUIREMENTS

1. All endpoints require authentication
2. JWT token validation
3. userId extracted from token (never from request body)
4. Brand context from auth/request
5. Authorization checks:
   - User can only access own progress
   - Brand isolation enforced
   - Admin/educator role checks where applicable

ERROR HANDLING

- 401 Unauthorized
- 403 Forbidden
- 404 Not Found (node/content)
- 409 Conflict (duplicate/invalid state)
- 422 Unprocessable Entity (validation)
- 500 Internal Server Error

TESTING

- API endpoint tests
- Authentication tests
- Authorization tests
- Cross-user isolation tests
- Cross-brand isolation tests
- Invalid input tests
- Idempotency tests

DELIVERABLES

1. API route implementations
2. Request/response validation
3. Security middleware verified
4. API tests
5. API documentation
6. Phase completion report

STOP after API tests pass.
Await approval before Phase 1C-D.
```

---

### PHASE 1C-D — CLAUDE + GEMINI PROMPT

**Use ONLY after Phase 1C-C complete**

#### Claude — Backend

```text
# ================================================================
# PHASE 1C-D — LEARNER TUTORIAL PAGE ILS BACKEND
# ================================================================

OBJECTIVE

Provide backend support for ILS UI integration into existing
Learner Tutorial Page.

CONTEXT

Phase 1C-C established:
✅ ILS API endpoints
✅ Authentication/authorization
✅ Persistence layer

SCOPE

Backend contract for frontend integration.
DO NOT modify frontend components.
DO NOT rebuild Tutorial Page.

REQUIRED BACKEND SUPPORT

1. Page Load State
   - GET endpoint for initial ILS state
   - navigationNodeId → progress state
   - Block completion list
   - Aggregate node state
   - Last viewed timestamp

2. Runtime Events
   - Event validation
   - Duplicate detection
   - Session management
   - Response contracts

3. State Synchronization
   - Optimistic update support
   - Conflict resolution
   - State versioning if needed

4. Performance
   - Efficient queries
   - Caching strategy
   - Avoid N+1 queries

TESTING

- Load performance tests
- Concurrent access tests
- State consistency tests

DELIVERABLE

Backend contract specification for Gemini.
```

#### Gemini — Frontend

```text
# ================================================================
# PHASE 1C-D — LEARNER TUTORIAL PAGE ILS UI
# ================================================================

OBJECTIVE

Integrate ILS state display into existing Learner Tutorial Page.

CONTEXT

Claude has provided:
✅ ILS API endpoints
✅ Backend contract specification
✅ State loading endpoints

SCOPE

Frontend UI integration only.
DO NOT modify backend.
DO NOT rebuild Tutorial Page architecture.
USE existing Tutorial Page components.

REQUIRED UI INTEGRATION

1. Page Load
   - Fetch ILS state for current node
   - Display loading state
   - Handle unauthorized/unavailable
   - Render progress indicators

2. Visual State Indicators
   - Block completion status
   - Navigation node completion
   - Progress percentage
   - Time spent (optional)
   - Last visited indicator

3. User Interaction
   - Block view tracking
   - Block interaction events
   - Completion triggers
   - Active time tracking

4. State Updates
   - Optimistic UI updates
   - Server synchronization
   - Error handling
   - Retry logic

5. Responsive Design
   - Mobile layout
   - Desktop layout
   - Tablet layout
   - Accessibility

ARCHITECTURAL RULES

- Use existing block components
- Maintain existing nomenclature (I-series, D-series, etc.)
- Do not duplicate block content
- ILS state is overlaid, not embedded in content
- Preserve existing Tutorial Page structure

TESTING

- Browser verification
- Responsive testing
- Error state testing
- Loading state testing
- Completion flow testing

DELIVERABLE

ILS UI integration complete.
Browser verification passed.
```

---

### PHASE 2 — CLAUDE + GEMINI COORDINATION

**Use ONLY after Phase 1C-D complete**

```text
# ================================================================
# PHASE 2 — ILS ↔ TUTORIAL DOCUMENT / BLOCK CONTRACT
# ================================================================

MODE:
ARCHITECTURE + IMPLEMENTATION

DO NOT redesign the Composer.
DO NOT redesign the Tutorial Page.
DO NOT introduce legacy tables.

Use ONLY the current architecture proven by Phase 1C.

OBJECTIVE

Define the contract between:

Tutorial Document
    +
Current Tutorial Blocks
    +
navigationNodeId
    +
ILS Runtime

The contract must preserve:

navigationNodeId
blockId
blockVersion
subtopicId
brand context
document/version identity

RULE

Block ILS identity must never be reduced to only:

blockType

It must preserve stable identity and version.

Conceptually:

navigationNodeId
    +
blockId
    +
blockVersion

DESIGN

Determine the minimum metadata required for a block to participate
in ILS.

Define:

BlockRuntimeContext
LearningEvent
BlockCompletionEvent
VisitEvent
ActiveTimeEvent
NavigationProgressContext

Do not duplicate content.

SESSION RULE

Do not claim session-aware visit detection unless a real session/
idempotency mechanism exists.

Define exactly how:

same session + same node
        ≠
new session + same node

REVISION RULE

Revision means:

previously completed node
+
subsequent learning visit

Do not increment revision merely because a page was refreshed.

COMPLETION RULE

Repository persists state.
Service determines business completion rules.

Do not place educational completion logic directly in SQL.

DELIVERABLE

Produce:

1. Architecture decision
2. Type/interface contract
3. Event model
4. Block identity model
5. Session/idempotency model
6. Completion model
7. Versioning model
8. Database impact
9. API impact
10. Frontend impact
11. Migration requirement (if any)
12. Tests required

Then implement only after the architecture is internally consistent.

Run:

typecheck
unit tests
build

STOP at acceptance checkpoint.
```

---

### PHASE 3 THROUGH 10

**Remaining phases follow similar pattern:**

- Phase 3: Universal Learner Page + ILS Runtime
- Phase 4: Block-Level ILS Integration  
- Phase 5: NavigationNode Aggregate Learning State
- Phase 6: Composer ↔ ILS Integration
- Phase 7: Save → Preview → Publish Integration
- Phase 8: Published Learner Delivery
- Phase 9: Complete Local Browser E2E
- Phase 10: Production Deployment + Verification

**Each phase includes:**
1. Clear objective
2. Acceptance criteria
3. Testing requirements
4. Safety rules
5. Deliverables
6. Gate before next phase

---

## CRITICAL SUCCESS FACTORS

### Database Safety

1. Never modify production without explicit approval
2. Always use transactions for migrations
3. Maintain rollback procedures
4. Verify before execution
5. Test in local/staging first

### Architecture Preservation

1. Do not rebuild existing Composer
2. Do not rebuild existing Tutorial Page
3. Do not restore legacy architecture
4. Protect navigationNodeId-based architecture
5. ILS observes, does not own content

### Security Boundary

1. All API calls authenticated
2. Authorization enforced
3. Cross-user isolation
4. Cross-brand isolation
5. C2-V5 boundary maintained

### Quality Gates

1. Unit tests pass
2. Integration tests pass
3. TypeScript compilation passes
4. Build succeeds
5. Browser verification passes
6. User acceptance obtained

---

## REFERENCE ARCHITECTURE

### Current Production State (from Phase 1C-A.4)

**Current tables (39 COMMON):**
- tutorial_sections (canonical page table)
- tutorial_page_content_v2
- tutorial_sidebar_trees_v2
- tutorial_domains, tutorial_subjects, tutorial_topics, tutorial_subtopics
- All current production-active tables
- 3 layman tables (layman_audit_logs, layman_content_revisions, layman_prompt_history)
- See `.analysis/phase1c-a4-final-architecture-classification.md` for complete list

**Legacy tables (EXCLUDED):**
- tutorial_content
- 11 unused tutorial_section_* domain tables
- tutorial_video_links
- subsection_engagement_metrics
- tutorial_learning_metrics

**Future tables (PENDING):**
- tutorial_navigation_progress ⭐ (Phase 1C-A.5 target)
- User interaction tables (code_interactions, visual_interactions, etc.)
- AI generation tables

**External tables (DO NOT IMPORT):**
- domains, subjects, topics, subtopics, skills, topic_skills

---

## NEXT IMMEDIATE ACTION

**🚀 PROCEED WITH PHASE 1C-A.5**

Use the Phase 1C-A.5 prompt above to:
1. Establish clean Drizzle baseline
2. Generate migration containing ONLY tutorial_navigation_progress
3. Verify no contamination
4. Execute after approval
5. Verify production state

**DO NOT proceed to Phase 1C-B until Phase 1C-A.5 is marked COMPLETE**

---

**Document Status:** AUTHORITATIVE IMPLEMENTATION GUIDE  
**Last Updated:** 2026-08-29  
**Owner:** Architecture Team  
**Review:** Required before each phase transition
