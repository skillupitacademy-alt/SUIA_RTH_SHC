Yes. Absolutely. All models working on Real Tutorial Hub, SkillHubCore Admin, and SkillUp must follow the same Principal Architect mindset, engineering framework, evaluation standards, and evidence-based decision process.

I have compared the attached SkillHubCore Admin review approach with how we started the Real Tutorial Hub review. The governing framework is the same, but I want to make our RTH review discipline more explicit so there is no inconsistency between models.

## One project, one architecture governance framework

`FinalAechitecture.md` is our single governing architecture specification.

| Governance requirement               | SkillHubCore Admin | Real Tutorial Hub |
| ------------------------------------ | ------------------ | ----------------- |
| Principal Architect perspective      | Mandatory          | Mandatory         |
| Complete file inventory              | Mandatory          | Mandatory         |
| File-by-file, line-by-line review    | Mandatory          | Mandatory         |
| SOLID, DRY, KISS, YAGNI, SoC         | Mandatory          | Mandatory         |
| High cohesion, low coupling          | Mandatory          | Mandatory         |
| Dependency direction and boundaries  | Mandatory          | Mandatory         |
| Security and least privilege         | Mandatory          | Mandatory         |
| Database and business-rule ownership | Mandatory          | Mandatory         |
| API contracts and validation         | Mandatory          | Mandatory         |
| Observability and resilience         | Mandatory          | Mandatory         |
| Tests, CI, build verification        | Mandatory          | Mandatory         |
| Evidence before implementation       | Mandatory          | Mandatory         |
| No unnecessary refactoring           | Mandatory          | Mandatory         |

The standards are identical. Only the application-specific responsibilities differ.

## The same eight architectural gates

We will follow the same structure as the SkillHubCore Admin model.

| Gate | Assessment                                                       |
| ---- | ---------------------------------------------------------------- |
| 1A   | Module/service boundaries and dependency direction               |
| 1B   | SOLID, DRY, KISS, YAGNI, SoC, cohesion and coupling              |
| 1C   | Authentication, authorization, trust boundaries                  |
| 1D   | Database ownership, repositories and data access                 |
| 1E   | API contracts, validation, idempotency, errors and caching       |
| 1F   | Shared capabilities and application-specific domain architecture |
| 1G   | Observability, resilience, configuration and operations          |
| 1H   | Tests, architecture enforcement, TypeScript, lint, build and CI  |

For RTH, Gate 1F concentrates on tutorial delivery, learner experiences, progress, assignments and assessments, rather than SkillHubCore's administrative and Project AI responsibilities.

## The most important rule

We will use exactly the same decision-making sequence:

1\. Inspect actual GitHub implementation

Complete file inventory and source review

2\. Evaluate against FinalAechitecture.md

Identify real violations, weaknesses and acceptable variations

3\. Establish the architecture baseline

Exact files, line references, evidence and severity

4\. Design targeted corrections

Preserve correct code; avoid speculative abstractions

5\. Implement and verify

Tests, type checks, lint, build and regression coverage

6\. Independently re-audit

Close only findings supported by verification evidence

## One improvement I will enforce for RTH

The SkillHubCore Admin model explicitly distinguishes between reviewing a file structurally and examining its complete implementation line by line.

We will preserve that distinction.

For example, examining 50 route filenames or checking their imports does not mean 50 routes have undergone a complete architectural review.

Our findings will retain the five formal readiness states from `FinalAechitecture.md`:

- Implemented and verified
- Implemented but unverified
- Partially implemented
- Not implemented
- Not applicable

And we will not mark an application architecturally complete simply because its existing tests pass.

## Principal Architect commitment for RTH

I will apply the same standards as the SkillHubCore Admin review, including challenging unnecessary complexity, identifying incorrect abstractions, investigating systemic issues rather than isolated symptoms, and preserving genuinely sound implementations.

One shared architecture. One engineering standard. One quality threshold. Independent application reviews.

That is the governance model we will follow across the entire Elearning Project.

# Real Tutorial Hub — Architecture Review, Pass 1

Read-only audit in progress

The first detailed review of RTH's authentication and routing code has uncovered an important architectural concern: the shared proxy does not enforce one uniform authorization policy across all API routes. Instead, behavior depends on route-prefix lists, gateway-secret exceptions, and the authentication checks inside individual handlers.

This does not establish an exploitable vulnerability on its own. It does establish why our review must trace the complete request path rather than inspect one file in isolation.

## Verified source findings

| Finding      | Severity              | Source-level evidence                                                                                           | Required assessment                                            |
| ------------ | --------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| RTH-SEC-001  | High, conditional     | `hasValidGatewaySecret()` returns `true` when the environment secret is absent                                  | Verify gateway trust requirements and deployment configuration |
| RTH-SEC-002  | High, conditional     | Paths outside `PROTECTED_PREFIXES` can reach the proxy's default `NextResponse.next()`                          | Inventory routes and verify handler-level authorization        |
| RTH-SEC-003  | Medium                | `hasRequiredRole()` accepts learner, admin and faculty roles through one broad access policy                    | Separate authentication from operation-specific authorization  |
| RTH-SEC-004  | Medium                | The proxy logs verified identity context, token-verification diagnostics and gateway-secret comparison metadata | Establish structured, minimal security logging                 |
| RTH-DATA-001 | Verification required | `requireAssignmentAccess()` checks tutorial completion through a repository                                     | Verify brand database, learner identity and content ownership  |
| RTH-API-001  | Medium                | Deprecated tutorial endpoint retains upstream error handling, configuration fallbacks and diagnostic logging    | Trace callers and determine removal versus compatibility       |

The first four findings come from the shared [`authProxy.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/feature/project-llm-linux-worker/src/share-branding/middleware/authProxy.ts?utm_source=chatgpt.com). The remaining findings are in the RTH-specific authentication and tutorial API files.

### Request path under examination

```
Browser / RTH learner
        ↓
apps/realtutorialhub-web/src/proxy.ts
        ↓
Shared createAuthProxy()
        ├── Public route policy
        ├── Protected route policy
        ├── JWT verification
        ├── Brand resolution
        └── Gateway-secret policy
        ↓
RTH BFF / API handler
        ↓
Authoritative backend and domain rules
        ↓
RTH-owned data
```

Every transition involving identity, permissions or database access requires independent verification. A correct JWT check in the proxy does not automatically prove a resource-level authorization check in the backend.

## Additional finding — Test coverage does not yet prove assignment authorization

File: [`assignment-auth.test.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/feature/project-llm-linux-worker/apps/realtutorialhub-web/src/lib/__tests__/assignment-auth.test.ts?utm_source=chatgpt.com)

The reviewed test file contains useful regression coverage for missing tokens, invalid tokens, wrong-brand claims, empty roles, personalized caching and the retired authoring endpoint.

However, although `requireAssignmentAccess()` depends on `TutorialProgressRepository.isSubtopicComplete()`, the tests shown do not exercise assignment unlocking, incomplete tutorials, repository errors, or cross-user progress ownership.

RTH-TEST-001 — Medium: These are meaningful coverage gaps requiring focused regression tests. The existing tests have been inspected but not executed in this review.

## Current review ledger

These counts describe reviewed files, not the full repository inventory.

Files inspected

# 10

Finding groups

# 7

Code changes

# 0

Verification boundaries

Source review is underway. A complete repository inventory, all caller tracing, current branch HEAD confirmation, test execution, build verification and CI evidence are still outstanding.

The key architectural direction is now clear: we should fully qualify RTH's shared authentication and authorization boundaries before refactoring frontend components or changing the learner experience.

For the next review tranche, the priority is the canonical brand resolver, every RTH BFF route, the shared authentication library, backend membership enforcement, and the assignments/progress repositories. We will then expand to pages, components, hooks, tutorial experiences, configuration and tests.

I will continue to treat the attached architecture as the governing specification, preserve working implementations, and report only evidence-supported conclusions. The RTH baseline remains open; no implementation changes have been made.

## Pass 2 — Shared contracts and tutorial progress

I have now inspected additional source files in the shared type system and tutorial database package. This expands the review beyond RTH's own application code, as required by the common Principal Architect framework.

### Positive findings

The canonical brand resolver in `packages/types/src/brand-resolution.ts` uses exact hostnames and DNS suffix boundaries rather than arbitrary substring matching. It returns `undefined` for unknown hosts. This is consistent with the architecture's explicit-brand principle.

The tutorial progress repository also has meaningful separation of responsibilities: the RTH authentication helper delegates completion queries to `TutorialProgressRepository`, and the repository uses a shared progress-calculation function.

These are existing implementations worth preserving rather than rewriting.

### New line-level findings

| ID               | File / line area                                         | Assessment                                                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-DB-001       | `tutorial-progress.repository.ts`, `markBlockComplete()` | The operation reads existing progress, then inserts or updates it. Concurrent requests may cause duplicate creation or stale progress merges unless database constraints and conflict handling protect the operation. |
| RTH-DB-002       | Same repository, `resetProgress()`                       | The same read-then-write concurrency pattern exists. Examine uniqueness and transaction guarantees before deciding on a correction.                                                                                   |
| RTH-AUTH-002     | `assignment-auth.ts`, lines 73–83                        | Assignment access depends on a progress-completion check, but does not itself establish enrollment or entitlement to the target tutorial. Confirm these rules at the owning domain boundary.                          |
| RTH-CONTRACT-001 | `brand-resolution.ts`                                    | Canonical brand resolution is centralized, which is positive. The trustworthiness of the incoming hostname still depends on gateway/proxy configuration.                                                              |
| RTH-OPS-001      | `db-tutorial/src/db.ts`                                  | Connection pools and query timeouts are configured. Production capacity and pool behavior remain unverified.                                                                                                          |

Important distinction: The concurrency findings are source-supported risks, not proven duplicate-record bugs. Database schema constraints, transactions and caller behavior must be checked before they can be classified as confirmed defects.

### RTH-DB-001 — Clarification after reviewing the database schema

The schema declares a unique index on `(user_id, subtopic_id)`:

```
uqTutorialProgressUserSubtopic:
  uniqueIndex('uq_tutorial_progress_user_subtopic')
    .on(table.userId, table.subtopicId)
```

This is an important existing safeguard. Assuming the corresponding migration has been applied, concurrent requests cannot create multiple progress records for the same learner and subtopic.

However, the repository still requires verification of how it handles a unique-constraint conflict and whether concurrent updates can overwrite each other's completed-block state.

The correct remediation, if required, is to strengthen atomic update behavior—not introduce unnecessary service abstractions.

## Review checkpoint

At this point we have verified source-level evidence for:

- Canonical shared brand types and hostname resolution.
- RTH-specific token and role checks.
- Shared proxy route and gateway-secret policies.
- Assignment completion authorization.
- Tutorial progress persistence methods and schema constraints.
- Connection-pool configuration and repository timeout wrappers.
- Existing RTH authentication regression tests.

No code has been modified. No test execution or production verification has been claimed.

The next audit tranche should examine the tutorial progress engine, all assignment API callers, enrollment ownership, actual database migration history, and the remaining RTH route inventory.

This remains an open architecture baseline, using the same evidence-first standards as SkillHubCore Admin.

# Real Tutorial Hub — Principal Architect Audit, Pass 3

Important architectural finding

This pass reviewed the complete source of the tutorial progress engine, tutorial and assignment progress repositories, assignment authorization helper, database schema definitions and their existing RTH regression tests.

A significant potential learner-workflow defect has emerged: assignment unlocking appears to depend on completing the assignment itself. This deserves priority over cosmetic refactoring.

No code has been changed.

## 1. High-priority finding: Circular assignment unlocking

RTH-LEARNING-001 · High · Confirmed code-level dependency, end-to-end impact not yet verified

The shared tutorial progress engine defines 13 sections required for completion, including:

```
'notes', 'layman', 'real_life', 'technical',
'code', 'visual', 'practice', 'assignment',
'project', 'quiz', 'summary', 'interview', 'ai_tutor'
```

In `calculateTutorialProgress()`, status becomes `completed` only when all required sections have been completed.

The repository method `isSubtopicComplete()` uses this status. Then RTH's `requireAssignmentAccess()` requires `isSubtopicComplete()` to be `true` before granting assignment access.

This creates the following dependency:

Learner completes tutorial content

Attempts to unlock assignment

System requires all 13 sections completed

Including the assignment section itself

Potential circular prerequisite

If completion of the assignment section requires successfully accessing or submitting that assignment, a new learner cannot satisfy the prerequisite through the normal workflow.

Before changing this, we must trace how assignment-section completion is recorded and whether the affected access helper is used by the active learner routes.

Recommended architectural direction: Define distinct domain states for tutorial prerequisite completion, assignment eligibility, assignment completion and overall mastery. These should not be treated as interchangeable.

## 2. Additional source findings

| ID               | Severity        | Finding                                                                                                | Required action                                            |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| RTH-PROGRESS-001 | High / verify   | `markBlockComplete()` uses read–modify–write without a version predicate                               | Verify concurrent section completion cannot lose updates   |
| RTH-PROGRESS-002 | Medium / verify | `resetProgress()` also uses separate read and write operations                                         | Verify reset/update ordering                               |
| RTH-ASSIGN-001   | High / verify   | `upsertProgress()` can accept a new status without enforcing a transition policy inside the repository | Identify authoritative assignment-state rules              |
| RTH-ASSIGN-002   | Medium / verify | `getAssignments()` filters by subtopic, difficulty and non-deleted status, but not `isPublished`       | Verify learners cannot receive unpublished assignments     |
| RTH-ASSIGN-003   | High / verify   | `getHelpRequests()` supports broad searches without a user-specific filter                             | Check that its callers enforce faculty/admin authorization |
| RTH-TEST-002     | Medium          | Existing RTH assignment-auth tests do not exercise the circular prerequisite or concurrency cases      | Add targeted regression tests                              |

### Positive findings to preserve

The database schemas contain useful unique constraints: tutorial progress is unique by learner and subtopic, and assignment progress is unique by learner, subtopic and difficulty.

The shared progress engine also centralizes section normalization and completion calculations, reducing duplicated rules across applications.

These are good architectural foundations. We should strengthen their behavior without replacing them unnecessarily.

## 3. Review status and next decision

| Audit gate                            | Current status     |
| ------------------------------------- | ------------------ |
| 1A — Boundaries and ownership         | Partially reviewed |
| 1B — Engineering principles           | Partially reviewed |
| 1C — Authentication and authorization | Partially reviewed |
| 1D — Database and repositories        | Partially reviewed |
| 1E — API contracts                    | Partially reviewed |
| 1F — Tutorial and learner domain      | Partially reviewed |
| 1G — Operations and resilience        | Not fully reviewed |
| 1H — Tests and CI                     | Not fully reviewed |

The next review priority is to trace the active assignment routes, identify how the `assignment` section is marked complete, and examine whether published-content and learner-entitlement checks are enforced by their authoritative services.

That will establish whether RTH-LEARNING-001 is a live learner-blocking defect, a legacy-code inconsistency, or a deliberate progression rule that needs clearer separation.

We will retain the same governance standard as SkillHubCore Admin: evidence first, architecture decision second, implementation third, verification fourth.

# Real Tutorial Hub — Principal Architect Audit, Pass 4

Priority: Learner progression and assignment authorization

I have now obtained the complete Git tree for the reviewed repository snapshot and traced the assignment workflow through its page, three API routes, application service, authorization helper, progress repository and shared progress engine.

This is a substantial improvement over the earlier partial route scan: we now have an exact repository inventory and a confirmed active call chain.

## 1. Repository inventory established

SOURCE SNAPSHOT

`864138730d4c74b9a1eba231be880172d43716d5`

RTH files

# 353

TS/TSX/JS/JSX

# 324

API-area source files

# 83

API-area count includes tests. These are inventory counts, not completed-review counts. The Git tree response was not truncated.

## 2. RTH-LEARNING-001 — Circular assignment prerequisite is present in the active code path

High severity

The relevant call chain is now confirmed:

```
GET /api/tutorial/assignments/[subtopicId]
POST /api/tutorial/assignments/[subtopicId]/start
POST /api/tutorial/assignments/[subtopicId]/complete
             ↓
      requireAssignmentAccess()
             ↓
      isSubtopicComplete()
             ↓
      calculateTutorialProgress()
             ↓
      All 13 mastery sections required
      Including 'assignment'
```

I also found that `AssignmentService.startTier()` independently uses the same full-subtopic completion requirement for the first assignment tier.

Architectural conclusion: The active implementation uses the overall tutorial-completion rule as an assignment-unlocking prerequisite. The progress engine includes the assignment itself in that overall completion rule.

This is a genuine circular dependency in the domain policy if completing the assignment requires first unlocking that tier. The precise end-user impact still requires checking all ways the `assignment` section can be marked complete.

A correct design should distinguish content prerequisite completed, assignment unlocked, assignment completed and overall mastery achieved.

## 3. Additional confirmed findings

| Finding          | Priority      | Source evidence                                                                                                                                                               |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-ASSIGN-004   | High          | `AssignmentService.completeTier()` does not independently check that the tier was started or that the preceding tier was completed.                                           |
| RTH-PROGRESS-003 | High          | `/api/tutorial/progress/mark-complete` accepts several block types but always calls `markAiTutorBlockComplete()`, which records `ai_tutor` regardless of the requested block. |
| RTH-ASSIGN-005   | High / verify | `AssignmentRepository.getAssignments()` does not filter on `isPublished`, even though the schema has that field.                                                              |
| RTH-TEST-003     | Medium        | Route tests mock authorization and services, so they do not detect contradictions between the progress engine and the live assignment policy.                                 |

### A concrete correctness bug

The progress endpoint accepts:

```
blockType: z.enum([
  'notes',
  'layman',
  'real_life',
  'technical',
  'code',
  'ai_tutor'
])
```

But its implementation calls:

```
markAiTutorBlockComplete(
  user.userId,
  payload.subtopicId
);
```

The helper always writes:

```
repository.markBlockComplete(
  userId,
  subtopicId,
  'ai_tutor'
);
```

Consequently, a request to complete `notes` can record `ai_tutor` completion instead.

This is a confirmed source-level correctness defect, independently of whether the assignment-unlocking issue is triggered.

## 4. Frontend and backend progression rules disagree

The learner interface in `LearnerProgressPanel.tsx` calculates completion using the supplied `blockOrder`. On the assignment page, that list contains six learning blocks.

The backend assignment service, however, calls `isSubtopicComplete()`, which evaluates the full 13-section mastery requirement.

This is an architectural inconsistency: the UI and backend do not use the same authoritative definition of the prerequisite for unlocking assignments.

The correct solution is not to duplicate the six-block rule in another component. We need one shared domain policy, owned by the appropriate package or service, that both the learner interface and backend can use.

## 5. Current architectural decision

Do not begin a broad frontend refactor yet. The first implementation unit should address the learner progression contract:

1. Define tutorial-content eligibility separately from full tutorial mastery.
2. Correct block-specific completion recording.
3. Enforce assignment tier transitions in the domain service.
4. Verify publication and entitlement checks.
5. Add cross-layer regression tests for unlocking, completion, concurrency and unauthorized access.

This is consistent with the SkillHubCore Admin Principal Architect model: fix systemic ownership and contract problems first, rather than merely cleaning up individual files.

Review status: The Git tree inventory is established, the active assignment call chain has been examined, and several code-level defects are documented. The complete 324-file source review, live test execution and full eight-gate certification are not yet complete. No repository changes have been made.

# Real Tutorial Hub — Principal Architect Audit, Pass 5

Read-only source review

This pass extends the RTH audit into assignment-help submission, tutorial delivery, section retrieval, and learning-event tracking. I reviewed the source of five additional files on the previously established Git snapshot `864138730d4c74b9a1eba231be880172d43716d5`.

## New findings

| ID            | Severity      | File and evidence                                                                                                   | Architectural implication                                                    |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| RTH-HELP-001  | High / verify | `assignments/help/route.ts` only calls `requireStudent()` before accepting a help request                           | The service must independently enforce assignment eligibility and enrollment |
| RTH-HELP-002  | Medium        | `assignment.service.ts` verifies that an assignment belongs to the subtopic, but not that the learner may access it | Valid assignment ownership is different from user authorization              |
| RTH-ILS-001   | Medium / High | `ils/block-visit/route.ts` forwards a caller-provided `x-session-id` header to the backend                          | Session identity must be validated or treated as untrusted                   |
| RTH-ILS-002   | Medium        | Several ILS routes proxy parsed JSON without local schema validation                                                | The authoritative backend must validate fields, sizes and permissions        |
| RTH-API-002   | Medium        | `sections/[subtopicId]/route.ts` logs cookie names, user IDs and upstream URLs                                      | Reduce sensitive and unnecessary production diagnostics                      |
| RTH-API-003   | Medium        | Multiple BFF routes return raw upstream error messages or exception messages                                        | Standardize sanitized client-facing errors                                   |
| RTH-CACHE-001 | High / verify | `tutorial-delivery.ts` caches tutorial sections by slug and difficulty, not by learner identity                     | Confirm the endpoint returns exclusively public, published content           |

### 1. Assignment-help authorization

The currently reviewed call chain is:

```
POST /api/tutorial/assignments/help
       ↓
requireStudent()
       ↓
assignmentHelpSchema
       ↓
AssignmentService.submitHelpRequest()
       ↓
AssignmentRepository.getAssignments()
       ↓
AssignmentRepository.createHelpRequest()
```

The service checks whether the assignment ID belongs to the supplied subtopic. That is useful validation, but it does not demonstrate that the requesting learner is enrolled, has unlocked the assignment, or is permitted to submit a help request for it.

Principal Architect decision: Authorization rules should be enforced by the authoritative assignment domain service, not depend solely on page visibility or client-side controls.

### 2. Tutorial section caching

The server-side delivery module uses keys conceptually equivalent to:

```
tutorial:v2:sections:${subtopicSlug}:${difficulty}
```

This is appropriate only if the cached response is identical for every authorized consumer.

The upstream request can also include a verified user ID. We must therefore determine whether the backend uses learner identity to vary the response.

If it does, sharing that cached result between users would violate the project's private-data isolation requirements.

No cache redesign should occur until response semantics are verified.

## 3. Test coverage finding

RTH-TEST-004 — Medium

The reviewed `assignments/help/__tests__/route.test.ts` verifies successful request creation, missing authentication and malformed payload rejection.

However, it mocks both the authentication helper and assignment service. It therefore does not verify actual enrollment checks, assignment eligibility, unpublished-content rejection or cross-user access.

We need service-level tests alongside these route tests.

## 4. Findings requiring further tracing

The RTH section retrieval route and server-side tutorial delivery module use related, but not identical, upstream calls. Their URLs, credentials and caching policies must be checked against the owning API-server handlers.

I attempted two candidate API-server paths, but neither existed at the specified location. Consequently, I have not yet verified the upstream tutorial-section response contract, and RTH-CACHE-001 remains a risk requiring verification, not a confirmed leak.

## Principal Architect checkpoint

The highest-priority remediation candidates remain:

1. Learner progression: Separate assignment eligibility from full 13-section mastery.
2. Progress recording: Correct the block-completion endpoint that always records `ai_tutor`.
3. Assignment authorization: Enforce tier transitions, enrollment and published-content rules at the service boundary.
4. BFF security: Validate forwarded session context and standardize upstream error handling.
5. Caching: Prove cached tutorial payloads cannot contain learner-specific information.

The review has progressed from the RTH authentication boundary into its learner-domain rules, repositories, APIs, cache and tests. The complete 353-file inventory remains open for detailed review; it is not being represented as completed.

No repository modifications have been made, and no tests or builds have been executed. The next evidence required is the authoritative API-server implementation and its corresponding regression tests before approving any changes to shared platform code.

# Real Tutorial Hub — Principal Architect Audit, Pass 6

Backend trust-boundary review

I located the actual API-server learning-tracking routes in the Git snapshot `864138730d4c74b9a1eba231be880172d43716d5` and inspected their implementation alongside the RTH BFF routes.

This resolves part of our earlier uncertainty: the backend does perform its own internal-authentication check and request-body validation for the reviewed ILS operations. We should preserve those controls.

## Verified findings

| ID           | Assessment                     | Evidence                                                                                                                                                       |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-ILS-003  | Implemented in reviewed routes | `block-completion`, `block-visit`, and `complete-node` invoke `validateRequest()` with `requireInternalSecret: true` before creating their service objects     |
| RTH-ILS-004  | Implemented in reviewed routes | The API server validates payloads using dedicated ILS schemas rather than trusting arbitrary JSON                                                              |
| RTH-ILS-005  | Needs verification             | Session IDs can come from request headers or request bodies; their ownership and consistency must be checked in the service                                    |
| RTH-ILS-006  | Technical debt                 | The older `_helpers.ts` still exports an identity-extraction function explicitly marked unsafe as an authentication boundary                                   |
| RTH-TEST-005 | Partial coverage               | Existing security tests exercise the real authentication middleware with mocked services, but do not establish database-level ownership or enrollment behavior |

The main backend files examined are:

- [Block-completion route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/apps/api-server/src/app/api/tutorial/ils/block-completion/route.ts?utm_source=chatgpt.com)
- [Block-visit route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts?utm_source=chatgpt.com)
- [Complete-node route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/apps/api-server/src/app/api/tutorial/ils/complete-node/route.ts?utm_source=chatgpt.com)

## Deeper conclusion: Internal authentication is stronger than previously established

The backend `internal-auth.middleware.ts` explicitly checks the configured secret. For ILS routes using `requireInternalSecret: true`, a missing internal secret is rejected rather than treated as gateway authentication.

That is a positive architectural finding and narrows our earlier security concern.

However, two distinct issues remain:

RTH-ILS-007 — Medium / verification required. The service accepts a client-supplied learning session identifier. The request schema constrains its length, and the service validates its presence, but this does not by itself prove the session belongs to the authenticated learner. Because the value participates in visit deduplication and telemetry, we must verify whether it is intended as a client-generated event/session correlation key or a trusted session credential.

RTH-ILS-008 — Medium technical debt. The API-server authentication middleware still supports both internal-secret authentication and gateway-secret authentication. That is acceptable when the calling architecture requires both, but each route must explicitly select its permitted mode. We should not replace this established design with blanket restrictions without checking gateway dependencies.

## Principal Architect assessment

The findings now fall into three categories:

| Area                               | Assessment                                    |
| ---------------------------------- | --------------------------------------------- |
| ILS internal-secret checks         | Implemented in reviewed routes                |
| ILS request schema validation      | Implemented in reviewed routes                |
| Self-scoped service identity       | Present in reviewed implementation            |
| Learning session ownership         | Still needs verification                      |
| RTH BFF payload validation         | Inconsistent across routes                    |
| Assignment eligibility and mastery | Architectural inconsistency identified        |
| Learner-progress recording         | Concrete incorrect-block recording identified |
| Production environment and CI      | Not verified                                  |

The highest-priority implementation decisions remain the assignment-unlocking contract and incorrect block completion recording. The ILS backend should largely be preserved while its session semantics and remaining trust assumptions are verified.

Current review remains read-only. The complete 353-file RTH inventory has been established, but not every file has yet undergone detailed line-by-line inspection. No code changes, passing tests, or production readiness claims are being made.

The next natural audit group is the `LearningProgressService` implementation, its repository methods, and existing service-level regression tests, followed by published tutorial delivery and cache ownership.

# Real Tutorial Hub — Principal Architect Audit, Pass 7

Learning Progress Service Review

I continued into the shared `LearningProgressService` used by RTH and SkillUp, reviewing the block-completion, navigation-completion, block-visit and canonical-requirement methods, along with the relevant Gate H regression tests.

The principal finding is that the service has stronger separation of responsibilities than the older RTH progress API. We should preserve its existing domain boundaries and correct specific weaknesses rather than redesign the whole service.

## Confirmed positive findings

| Area                       | Source evidence                                                                                    | Assessment                   |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| Canonical completion rules | `completeNavigationNode()` calls `resolveRequiredBlocks()` and evaluates completion server-side    | Good single ownership        |
| Identity scoping           | Service methods receive an authenticated identity and use `identity.userId`                        | Good dependency boundary     |
| Content hierarchy          | Block operations invoke hierarchy validation before persistence                                    | Good domain validation       |
| Idempotent visit tracking  | `recordBlockVisit()` delegates to repository atomic upsert                                         | Good architectural direction |
| Block completion behavior  | `recordBlockCompletion()` records an event but does not automatically complete the navigation node | Clear separation of concerns |
| Regression-test design     | Gate H tests examine canonical completion mapping                                                  | Appropriate focused coverage |

These are source-level assessments; the tests have not yet been executed in this review.

## New findings from the service internals

### RTH-ILS-009 — Block visit accepts unknown block identity

Medium · Confirmed service behavior

In [`learning-progress.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/packages/db-tutorial/src/services/learning-progress.service.ts?utm_source=chatgpt.com), lines 636–680, `recordBlockVisit()` looks up the requested block in the tutorial content.

When the block is not found, `expectedTimeSec` remains `null`, but the method still calls the repository's `upsert()`.

This can record visits for block identities that do not exist in the retrieved content.

Recommendation: Require a valid canonical block identity before persisting the visit. First verify whether any legitimate legacy content relies on the existing fallback.

### RTH-OPS-002 — Debug instrumentation remains in production code

Medium · Confirmed

Lines 1116–1125 of the same service contain a hard-coded UUID check that logs completion details for one particular block.

This is diagnostic instrumentation, not normal domain logic.

It should be removed or replaced with structured, environment-controlled diagnostics that do not expose unnecessary learner-progress details.

### RTH-ARCH-002 — Direct transaction ownership is an exception to the service boundary

Review required

The service imports the concrete database client for transactional telemetry operations, despite generally relying on injected repositories.

This is not automatically a SOLID violation: an application service may legitimately own a transaction boundary. But we should review whether transaction orchestration can remain explicit without tightly coupling the domain workflow to its database implementation.

## Updated review conclusion

The shared ILS service already implements several important architecture principles correctly. The newly identified problems are localized: block-identity validation, leftover diagnostic instrumentation and transaction-coupling review.

The more consequential RTH-specific issues remain assignment eligibility, correct progress recording, published-content access and consistent client/server contracts.

I have not treated inspected source as tested behavior, and I have not modified the repository.

The next review tranche should examine the navigation-progress repository's atomic completion operations, the hierarchy-resolution helpers and their service-level tests. Those are the remaining dependencies needed to determine whether ILS completion can be certified against the shared architecture framework.

# Real Tutorial Hub — Principal Architect Audit, Pass 8

I reviewed the navigation-progress repository, its atomic SQL helper responsibilities, and the hierarchy-resolution implementation in the shared tutorial package.

This pass establishes two important facts: brand-scoped hierarchy verification is implemented, and block-completion updates use database-side deduplication. It also identifies conditions where the completion policy needs stronger safeguards.

## Confirmed architectural strengths

| Area                    | Implementation                                                                 | Assessment                     |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| Brand isolation         | `validateNavigationHierarchy()` resolves content using the authenticated brand | Implemented in reviewed code   |
| Section identity        | Provided `sectionId` must match the resolved section                           | Implemented                    |
| Atomic block completion | SQL JSONB append checks block ID and version                                   | Good concurrency protection    |
| Duplicate completion    | Repeated completion of the same block/version avoids appending another record  | Implemented                    |
| Repository ownership    | The service determines eligibility; repository persists completion             | Correct separation of concerns |

These are valuable existing implementations and should be preserved.

## New source-level findings

### RTH-ILS-010 — Missing content can produce zero completion requirements

High / conditional

In `learning-progress.hierarchy-resolution.ts`, lines 60–62, `resolveRequiredBlocks()` returns an empty array if a section or its block content is unavailable.

The service subsequently evaluates the completion policy using that array.

For an intended instructional page, an empty required-block set may be legitimate; for a missing or malformed published document, it may represent a content-integrity failure. We must distinguish those cases explicitly.

The safe architectural policy is to reject invalid published content while allowing deliberately block-free content where the domain contract permits it.

### RTH-ILS-011 — Recursive retry lacks an explicit bound

Medium · Confirmed source pattern

In `tutorial-navigation-progress.repository.ts`, lines 278–281, a conflict during first-record creation can call `markBlockCompleted()` recursively.

The same repository contains similar retry behavior for other progress operations.

Although the unique index and conflict-handling strategy are good, retry behavior should be bounded and measurable. Repeated contention or unusual database behavior must not result in unlimited retries.

### RTH-ILS-012 — Completion eligibility and persistence are separate operations

High / concurrency verification required

`LearningProgressService.completeNavigationNode()` evaluates eligibility using the current progress and required blocks. The repository's `completeNode()` then updates the completion status.

This is a reasonable separation of business logic, but the eligibility decision and mutation are not visibly guarded by the same database transaction or conditional version check in these methods.

We should test concurrent completion with content revisions, progress resets and other state changes before concluding that the operation is fully race-safe.

## RTH-ILS-010 — Confirmed domain-policy detail

The additional source inspection clarifies our earlier finding about zero required blocks.

`evaluateCompletionPolicy()` deliberately allows completion when no blocks are required, and `calculateProgressPercentage()` deliberately returns 100% for that case. This supports informational pages that have no interactive blocks.

The problem is therefore not the zero-block rule itself.

The architectural risk is that the hierarchy resolver currently returns the same empty array for both an intentionally block-free page and content that is missing or malformed.

Those cases should be distinguishable before applying the completion policy.

## Updated architectural classification

| Finding                                   | Current assessment              |
| ----------------------------------------- | ------------------------------- |
| Brand-scoped navigation hierarchy         | Implemented in inspected code   |
| Atomic completed-block append             | Implemented in inspected code   |
| Duplicate block/version handling          | Implemented in inspected code   |
| Zero-required-block policy                | Intentional, documented         |
| Missing versus deliberately empty content | Needs contract hardening        |
| Bounded contention retry                  | Needs remediation               |
| Completion eligibility race safety        | Not independently verified      |
| Relevant unit tests                       | Inspected in part; not executed |

Principal Architect recommendation: Retain the shared `LearningProgressService` and repository architecture. Address the narrowly identified issues with focused regression tests, especially malformed-content completion, concurrent completion and retry exhaustion.

The RTH review remains read-only. The full 353-file inventory is established, but the complete file-by-file certification is not finished. No code changes or test results are being claimed.

# Real Tutorial Hub — Principal Architect Audit, Pass 9

This pass covers 12 additional files across RTH's project submissions, remediation, hierarchy synchronization, tutorial delivery and associated API/tests. The review uses the same principles and evidence-first standards as SkillHubCore Admin.

The most consequential findings are not file-size problems. They concern data integrity, transaction boundaries, idempotency, and scalability.

## New findings by architectural priority

| Finding          | Priority        | Evidence                                  | Assessment                                                                                        |
| ---------------- | --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| RTH-DATA-002     | High            | `remediation.service.ts` lines 254–286    | Remediation creation overwrites existing tutorial progress, clearing completed blocks             |
| RTH-WORKFLOW-001 | High            | `project.service.ts` lines 165–204        | Database submission, Redis idempotency marker and QStash publication are not one atomic operation |
| RTH-WORKFLOW-002 | High / verify   | `hierarchy-sync.service.ts` lines 257–305 | Redis idempotency and database synchronization have partial-failure windows                       |
| RTH-RESOURCE-002 | High            | `tutorial-hierarchy.ts` lines 136–180     | Published-path generation performs a tutorial-section query per subtopic                          |
| RTH-DATA-003     | Medium / verify | `tutorial-hierarchy.ts` lines 59–105      | Hierarchy lookup reads rows and performs slug matching in application memory                      |
| RTH-PROJECT-001  | Medium / verify | `project.service.ts` lines 135–151        | Submission eligibility checks completed progress, but no project publication check is visible     |
| RTH-API-004      | Medium          | Project/remediation routes                | Error and caching contracts remain inconsistent                                                   |

### 1. RTH-DATA-002 — Remediation resets canonical learning progress

The strongest confirmed finding is in [`remediation.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/apps/realtutorialhub-web/src/server/remediation.service.ts?utm_source=chatgpt.com).

In `createPlan()`, the conflict-update branch writes:

```
status: 'not_started',
blocksCompleted: [],
remediationTriggered: true,
score: null,
timeSpentSec: 0,
completedAt: null,
```

This overwrites existing progress for affected subtopics. Whether resetting progress is a deliberate educational policy must be confirmed, but the implementation undeniably changes more than remediation metadata.

Principal Architect recommendation: Represent remediation attempts separately from the learner's historical completion record, unless the governing learning policy explicitly requires a reset. Preserve auditability of previous learning achievements.

### 2. RTH-WORKFLOW-001 — Project submission spans multiple consistency boundaries

The project service creates a submission inside a database transaction, writes a Redis marker, then publishes a QStash review event after the transaction.

If the database commit succeeds but queue publication fails, the project submission can exist without a review event being delivered.

Likewise, an external Redis operation inside a database transaction is not rolled back when the SQL transaction rolls back.

Preferred architectural direction: A transactional outbox or durable workflow-state mechanism, combined with idempotent review processing. Avoid replacing this with additional non-transactional flags.

## 3. Repository cross-checks

I also inspected two additional shared repositories:

- [`project.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/packages/db-tutorial/src/repositories/project.repository.ts?utm_source=chatgpt.com) — 233 lines.
- [`tutorial-content.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/864138730d4c74b9a1eba231be880172d43716d5/packages/db-tutorial/src/repositories/tutorial-content.repository.ts?utm_source=chatgpt.com) — 314 lines.

These establish that `TutorialContentRepository.getPublished()` explicitly filters on `isPublished = true`, which is good. However, `ProjectRepository.getProject()` filters out soft-deleted records without also requiring `isPublished = true`. The project service does not add that check before submission.

RTH-PROJECT-002 — High / conditional: An unpublished but non-deleted project may be eligible for submission, depending on how project IDs are exposed and whether another rule restricts access.

## 4. More detailed architectural conclusions

### Hierarchy synchronization

The synchronization service already employs a database transaction and a Redis `NX` claim, both valuable safeguards.

However, its idempotency key uses the subtopic ID rather than the event ID. Within the key's lifetime, a legitimate later update for that same subtopic may be classified as a duplicate. There are also failure windows between committing the database transaction, invalidating caches and marking the event processed.

This requires a clear distinction between event deduplication and entity synchronization. They are different responsibilities.

### Hierarchy and sitemap scalability

In `tutorial-hierarchy.ts`, the sitemap generation path fetches hierarchy tables, loops through subtopics, and then queries tutorial sections separately for every subtopic.

For a large content catalog, that produces an N+1 query pattern.

The preferred correction is a bounded or batched published-content query rather than one request per subtopic, while preserving correct hierarchical filtering and publication rules.

## Review coverage this pass

New files inspected

# 14

RTH inventory

# 353

Source modifications

# 0

Files were examined at varying depths; not all 14 have received complete line-by-line certification. Shared-package files are additional to the 353-file RTH application inventory.

### Next audit priority

The findings suggest that the next high-value review group is the project-submission repository constraints, queue worker and webhook authentication, remediation event contracts, hierarchy event processing and their existing integration tests.

This will establish whether workflows survive retries, concurrent requests, queue failures and partial infrastructure outages.

Principal Architect assessment: RTH has useful modular foundations, but its workflow-consistency and learner-progress boundaries need stronger guarantees before it can be considered production-architecture compliant.

No code has been modified, and no unexecuted tests have been reported as passing.

# Real Tutorial Hub — Principal Architect Audit, Pass 10

This pass examined six additional implementation files across RTH workers, shared project-submission persistence and hierarchy synchronization. The most important findings concern reliable background processing, rather than frontend code organization.

## New findings

| ID             | Severity        | File                                         | Evidence-based finding                                                                                                                                                                             |
| -------------- | --------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-WORKER-001 | High            | `review-project/route.ts`, lines 53–115      | A Redis `processing` claim is created before database work. On failure, this handler does not clear the claim. A retry can therefore be acknowledged as a duplicate without completing the review. |
| RTH-WORKER-002 | High            | `review-project/route.ts`, lines 68–78       | Both an existing marker and a failed `NX` claim return HTTP 200, without distinguishing a completed job from one still processing.                                                                 |
| RTH-WORKER-003 | High            | `review-project/route.ts`, lines 80–113      | The event contains `userId` and `projectId`, but the worker does not visibly verify that the loaded submission belongs to both before updating it.                                                 |
| RTH-SYNC-001   | High            | `hierarchy-sync.service.ts`, `retryFailed()` | The retry method initializes an empty worklist and never populates it. It therefore cannot retry failed hierarchy records.                                                                         |
| RTH-DATA-004   | Medium / verify | `tutorial-project-submissions.ts`            | No uniqueness constraint for learner/project submissions is declared. Verify whether multiple submissions are intentional and how their idempotency is enforced.                                   |
| RTH-WORKER-004 | Medium          | `send-remediation-notification/route.ts`     | The worker currently acknowledges the event and logs receipt; no actual notification dispatch is present in the reviewed implementation.                                                           |

### Critical finding: project reviews can become stranded

QStash delivers project-submitted event

Redis records `processing`

Database operation fails

QStash retries the event

Worker sees existing marker and responds 200

Review may remain unfinished

This is a source-confirmed retry-handling defect in the reviewed worker. The effect depends on when the original operation fails, but the worker lacks a durable distinction between processing, completed and failed.

The architectural correction should use explicit job-state transitions, retry leases and idempotent persistence. A Redis key alone should not serve as proof of successful processing.

## Test audit: why these defects were not caught

I inspected three additional test files covering the review worker, hierarchy retry endpoint and project-submission repository.

| Test suite                              | Existing coverage                                     | Missing coverage                                                                        |
| --------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `review-project/route.test.ts`          | Success, duplicate event, invalid signature           | Failure after acquiring Redis claim, retry recovery, submission/event identity mismatch |
| `retry-hierarchy-sync/route.test.ts`    | Signature rejection and delegation to `retryFailed()` | Actual failed-record discovery and processing                                           |
| `project-submission.repository.test.ts` | CRUD and query behaviors                              | Concurrent duplicate submissions, database uniqueness, invalid workflow transitions     |

The tests demonstrate important isolated behaviors, but they do not establish end-to-end reliability.

Most notably, the retry-route test checks that `retryFailed()` is called. It does not verify that the service finds any failed records. This explains how an endpoint can appear correctly tested while its implementation performs no recovery work.

## Principal Architect remediation sequence

For this group, I recommend the following implementation order:

1. Fix the review worker's retry state machine, ensuring incomplete work is not acknowledged as completed.
2. Introduce durable project review delivery, so a committed submission cannot silently lose its review event.
3. Restore real failed-hierarchy discovery, then verify retry results against persisted records.
4. Establish project submission identity and status-transition constraints, including the intended multiple-submission policy.
5. Add failure-injection tests covering queue outages, transaction rollbacks, concurrent deliveries and interrupted workers.

We should avoid implementing generic workflow frameworks or unnecessary abstractions. Focused domain services, durable state and the existing platform infrastructure should be sufficient.

Review checkpoint: Nine new files were inspected in this pass—six implementation files and three test files. Not all have received complete line-by-line certification. The broader 353-file RTH application audit remains open, as do the connected shared services.

No repository files were changed, and no tests or builds were executed. The next audit group should cover RTH's frontend learner-progress panel, tutorial experience, navigation/sidebar components and related hooks to determine whether frontend behavior aligns with these backend domain contracts.

# Real Tutorial Hub — Principal Architect Audit, Pass 11

Scope: Learner Progress Panel, Tutorial Experience, Sidebar, frontend progress client and regression tests.

This pass reveals a more fundamental integration problem: the frontend, BFF API, and shared learning engine do not consistently use the same subtopic identity or definition of progress.

## 1. High-priority findings

| ID           | Severity | Source evidence                                     | Finding                                                                                          |
| ------------ | -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| RTH-FE-001   | High     | `TutorialExperience.tsx`, line 137                  | Passes `params.subtopicSlug` to `LearnerProgressPanel`, despite having a `subtopicId` prop       |
| RTH-FE-002   | High     | `tutorial-progress.ts`, lines 5 and 29–49           | Tracks only six block types, while the tutorial experience displays 13                           |
| RTH-FE-003   | Medium   | `LearnerProgressPanel.tsx`, lines 56–67 and 267–284 | Merges browser-local completion data with server-reported progress without reconciling authority |
| RTH-FE-004   | High     | `LearnerProgressPanel.tsx`, lines 307–326           | Records completion locally before confirming that the server accepted the progress event         |
| RTH-FE-005   | Medium   | `TutorialExperience.tsx`, lines 67–72               | Sidebar statuses are assigned from array positions rather than actual learner progress           |
| RTH-TEST-006 | Medium   | `LearnerProgressPanel.test.tsx`                     | Tests primarily exercise mocked API responses; actual slug/UUID integration is not verified      |

### RTH-FE-001 — Slug versus UUID mismatch

`TutorialExperience` accepts `subtopicId`, but passes the slug instead:

```
<LearnerProgressPanel
  subtopicId={params.subtopicSlug}
  ...
/>
```

That panel sends its `subtopicId` into the assignment and tutorial-progress APIs.

The tutorial-progress API explicitly validates `subtopicId` as a UUID, and assignment repositories use UUID-backed subtopic identities.

This is a concrete source-level integration mismatch. The actual page call site must also be examined to confirm the correct identifier is available.

### RTH-FE-002 — Two inconsistent progress models

The tutorial experience presents 13 blocks, including assignment, project, quiz, practice and other sections.

The frontend progress client accepts only six block types, while the shared `tutorialProgressEngine` defines all 13 as mastery sections.

Consequently, the frontend can show a different concept of progress than the backend uses for unlocking assignments.

Architectural direction: Define distinct content-viewing progress, learning-completion eligibility and overall mastery. Each must have one authoritative contract rather than an independently maintained array.

## 2. Additional frontend architecture concerns

The frontend makes a distinction between two progress sources:

- Local progress: Browser storage and intersection-observer tracking.
- Server progress: API responses representing persisted learning activity.

This distinction is legitimate, but they should not be merged indiscriminately.

For example, `LearnerProgressPanel.tsx` marks a block complete locally and sends the progress event asynchronously. If the server rejects the event, the local completion remains.

For user experience, optimistic tracking is acceptable. For learning eligibility or certification, only authoritative persisted progress should decide the outcome.

### RTH-FE-006 — Inconsistent subtopic ID fallback

`TutorialExperience.tsx` uses `subtopicId ?? params.subtopicSlug` when passing identifiers to the live-session and project panels.

That fallback can silently substitute a URL slug for a UUID.

If the downstream API requires a UUID, the integration fails. If the API accepts both, its identity contract must explicitly document the difference.

This pattern should be resolved at the route/page composition boundary, not repeated across individual components.

## 3. Test adequacy

The `LearnerProgressPanel` tests use a fixed UUID and mocked API responses. They cover starting assignments, completing tiers, help submission, loading and error states.

These tests are useful, but they cannot detect the production component's slug/UUID mismatch because they instantiate the panel directly with a valid UUID.

The missing test is a page-to-component integration test that passes real route parameters and the resolved subtopic identity.

## 4. Recommended implementation order

The frontend should follow, rather than redefine, the canonical learning contracts:

1. Resolve the canonical subtopic UUID once at the page boundary.
2. Pass that identity consistently to progress, assignment, project and session components.
3. Use server-authoritative eligibility for assignment unlocking.
4. Keep local viewing indicators separate from persisted completion.
5. Derive sidebar progress from actual learner state rather than fixed array positions.
6. Add integration tests covering slug resolution, 13-section mastery, the six-block learner interface and API failures.

## Review status

| Area                         | Status                                |
| ---------------------------- | ------------------------------------- |
| Frontend source inventory    | Established                           |
| LearnerProgressPanel         | Reviewed in major functional sections |
| TutorialExperience           | Reviewed                              |
| TutorialSidebar              | Structurally reviewed                 |
| Frontend progress API client | Reviewed                              |
| LearnerProgressPanel tests   | Reviewed                              |
| Full RTH repository          | Not yet certified                     |

This review confirms that the learner-facing architecture has contract inconsistencies between page composition, local progress tracking and backend eligibility.

The correct solution is a small, coherent set of domain-contract corrections—not a broad rewrite of RTH's components.

No code was changed and no tests were executed. The remaining review work includes the other learner-facing panels, live sessions, project submission UX, AI tutor interactions, accessibility, performance and their corresponding APIs and tests.

# Real Tutorial Hub — Principal Architect Audit, Pass 12

New high-priority findings

This pass expands the review into the AI Tutor API, AI Tutor interface, project-submission panel and tutor drawer.

The most significant finding is in the AI Tutor authorization boundary. It also reveals a shared-content isolation concern and a learner-facing rate-limit defect.

## New findings

| ID         | Severity           | File and line evidence                      | Finding                                                                                                                     |
| ---------- | ------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| RTH-AI-001 | High               | `ai-tutor/query/route.ts`, lines 98–105     | JWT verification checks audience but does not explicitly require the `realtutorialhub` brand                                |
| RTH-AI-002 | High / conditional | Same route, lines 56 and 118–126            | Uses global seeded Q&A content, rather than retrieving Q&A for the requested subtopic                                       |
| RTH-AI-003 | Medium             | Same route, lines 128–143 and 188–246       | Marks the AI Tutor section complete after a successful lookup, without assessing a separate learning-completion requirement |
| RTH-FE-007 | Medium             | `AITutorBlock.tsx`, lines 79–81 and 114–125 | A 429 response permanently disables submitting questions for the mounted component                                          |
| RTH-FE-008 | Medium             | `AITutorBlock.tsx`, line 44                 | Falls back to a hard-coded UUID when `subtopicId` is missing                                                                |
| RTH-FE-009 | Low / Medium       | `ProjectSubmissionPanel.tsx`, lines 116–119 | Uses a subtopic-specific React Query cache key for an API that returns all the learner's submissions                        |

### 1. AI Tutor authentication differs from the canonical learner guard

The AI Tutor route uses a custom helper:

```
const payload = await TokenService.verifyAccessToken(
  token,
  { audience: 'user', isAdmin: false }
);

return payload.userId;
```

Unlike the RTH `requireStudent()` helper, it does not explicitly check:

```
payload.brand === 'realtutorialhub'
```

This creates inconsistent authorization enforcement across RTH APIs.

The backend token verifier may enforce additional constraints internally, but those have not been established here. Therefore, this is a confirmed missing route-level brand check, not yet a proven exploitable cross-brand access vulnerability.

Architectural recommendation: Reuse the approved RTH learner authorization boundary rather than maintaining parallel authentication logic.

### 2. AI Tutor answers may use the wrong tutorial context

The route's Q&A matching logic reads:

```
const aiTutorQaPairs =
  DEFAULT_TUTORIAL_CONTENT.ai_tutor?.qa_pairs ?? [];
```

It then matches question tokens against these seeded entries without using the requested `subtopicId` or difficulty to scope the Q&A content.

The vector-search fallback does use those parameters.

Consequently, the same question can receive the same seeded Q&A answer across unrelated subtopics, even if context-specific material is available.

This is a confirmed content-scoping inconsistency. Whether the answers are materially incorrect depends on the seed content and learner question.

## 3. Additional files and test coverage

I extended this tranche to the shared AI Tutor hook, vector-search adapter, and two existing AI Tutor test suites.

| File                                       | Review result                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `useAiTutor.ts` — 158 lines                | Repeats question submission and rate-limit state handling already present in `AITutorBlock` |
| `ai-tutor-vector.ts` — 2 lines             | Re-exports the shared tutorial package; no new business logic                               |
| `AITutorBlock.test.tsx` — 124 lines        | Covers rendering, accessibility, successful queries, 429 responses and network errors       |
| `ai-tutor/query/route.test.ts` — 203 lines | Covers queries, rate limits, missing tokens, invalid payloads and seeded Q&A matches        |

### RTH-AI-004 — Missing cross-brand security regression

The API test creates a verified token payload containing `userId`, email and roles, but no `brand`. The success test expects HTTP 200.

This confirms that the current route tests do not require a verified RTH brand identity. The tests should be strengthened alongside the authentication boundary.

### RTH-AI-005 — Duplicated client interaction behavior

Both `AITutorBlock` and `useAiTutor` implement question submission, message history, error handling and rate-limit state.

These two implementations can diverge; for example, their error messages and displayed quota information differ.

A shared interaction hook may be justified here because genuine duplication exists. The presentation components should remain separate if they serve different UI contexts.

### RTH-AI-006 — Expiring rate limits are not reflected in the UI

Both implementations set `isRateLimited` to `true` after HTTP 429. Neither reviewed implementation resets that state after the server's rate-limit window expires.

The backend provides a `retry-after` header. The frontend should use that authoritative value or allow retry after an appropriate recovery flow.

The current `AITutorBlock` test explicitly expects the input to remain disabled immediately after 429, but does not test recovery after expiration.

## Principal Architect decision

The preferred remediation order for this area is:

1. Reuse canonical RTH authentication in the AI Tutor API.
2. Scope retrieval and Q&A answers to the verified tutorial and brand.
3. Establish an explicit rule for when AI Tutor activity counts as completed learning.
4. Centralize the duplicated client query workflow without unnecessarily merging distinct UI components.
5. Correct rate-limit recovery and introduce cross-brand, cross-subtopic and retry tests.

This maintains the same project-wide architecture standard: one security boundary, one domain owner, clear contracts and evidence-backed changes.

Pass 12 review checkpoint: Eight files were examined across AI Tutor, frontend presentation, shared hook, project-submission UI and tests. The wider RTH inventory remains under review. No code was changed, and no tests were executed.

# Real Tutorial Hub — Principal Architect Audit, Pass 13

Scope: Live-session requests, cancellation, learner-facing session UI, remediation overview, and their regression tests.

This pass inspected nine additional files in the RTH application. It also identified an important ownership detail: RTH's `live-session.service.ts` contains only a re-export of the shared `@quiz/db-tutorial/live-session.service` implementation. The shared package therefore owns the business rules, while RTH owns the HTTP and presentation layers.

## Findings from the RTH application

| ID              | Severity | Source evidence                              | Finding                                                                                                                  |
| --------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| RTH-SESSION-001 | Medium   | `sessions/request/route.ts`, lines 10–13     | `doubtText` has no maximum length; request size and storage limits rely on downstream controls                           |
| RTH-SESSION-002 | Medium   | `sessions/[requestId]/route.ts`, lines 10–15 | Cancellation route does not validate `requestId` format before calling the shared service                                |
| RTH-SESSION-003 | Medium   | `sessions/request/route.ts`, lines 35–36     | Unexpected exception messages are returned directly to clients                                                           |
| RTH-SESSION-004 | Medium   | `sessions/my-requests/route.ts`, lines 10–18 | Database/service errors are mapped to HTTP 401 rather than 500/503                                                       |
| RTH-FE-010      | Medium   | `LiveSessionRequestPanel.tsx`                | Modal has no explicit dialog semantics, focus trapping, Escape handling or focus restoration                             |
| RTH-TEST-007    | Medium   | `sessions/__tests__/routes.test.ts`          | Tests mock the shared service, so they do not establish actual ownership, duplicate prevention or concurrency guarantees |

### Positive findings

The request endpoint validates the subtopic UUID, retrieves the learner identity through `requireStudent()`, and supplies the authenticated user ID to the shared service. The cancellation route also passes the authenticated user ID rather than accepting an arbitrary user ID from the request body.

These are appropriate trust-boundary decisions.

## 2. Shared live-session domain review

I traced the RTH routes into three additional shared-package files: `live-session.service.ts`, `live-session.repository.ts` and `live-session-requests.ts`.

This identifies more consequential issues than the earlier route-level findings.

| ID              | Severity           | Evidence                                                               | Finding                                                                                                                                              |
| --------------- | ------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-SESSION-005 | High               | `live-session.service.ts`, lines 80–94; schema lines 20–25             | Duplicate prevention checks existing requests before insertion, but no database uniqueness constraint enforces one open request per learner/subtopic |
| RTH-SESSION-006 | High               | `live-session.repository.ts`, lines 128–213                            | Status transitions check the old status in a separate read, then update using only the record ID and soft-delete condition                           |
| RTH-SESSION-007 | High               | `live-session.repository.ts`, `cancelRequest()`                        | Cancellation does not restrict the current status; completed or scheduled sessions can potentially be changed to cancelled                           |
| RTH-SESSION-008 | High / conditional | `live-session.service.ts`, lines 100–115                               | The request is committed before the notification event is published, leaving a partial-failure window                                                |
| RTH-SESSION-009 | High / verify      | `live-session.service.ts`, `scheduleRequest()` and `completeRequest()` | These methods accept `facultyId` but do not visibly compare it with the faculty member assigned to the request                                       |

### Example: lost-update risk in session status transitions

The repository's acceptance flow checks:

```
assertTransition(id, request, 'pending', 'accepted');
```

But its update uses a condition equivalent to:

```
where(
  and(
    eq(liveSessionRequests.id, id),
    activeRequests
  )
)
```

It does not include `status = 'pending'` in the update predicate.

Two concurrent operations can therefore both act on a stale status check. The transaction wrapper alone does not establish the required state-transition guarantee.

Recommended correction: Make status changes conditional on the expected current state, check the affected row count and enforce faculty ownership where appropriate. This is a focused domain fix, not a reason to rebuild the service.

## 3. Audit checkpoint

RTH files this pass

# 9

Shared files this pass

# 3

Code changes

# 0

The live-session domain has a sensible separation between RTH routes, the shared service and database repositories. However, duplicate prevention, atomic state transitions, cancellation eligibility and reliable event delivery need additional safeguards.

The next audit group should examine faculty-side session acceptance and scheduling, notification workers, associated service tests and the remediation page's upstream data assembly.

The complete 353-file RTH inventory is still not certified. No code was modified, and no tests or builds were executed.

# Real Tutorial Hub — Principal Architect Audit, Pass 14

Scope: Faculty session APIs, authoritative API-server handlers, live-session notifications, QStash signature verification and shared faculty access logic.

This pass extends the audit beyond RTH to the services that control faculty actions affecting RTH learners.

## New high-priority findings

| ID              | Severity                | File and lines                             | Finding                                                                                                                                        |
| --------------- | ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-FACULTY-001 | High                    | `tutorial-faculty-access.ts`, 544–574      | Faculty can update session status directly, without enforcing the expected previous status.                                                    |
| RTH-FACULTY-002 | High / verify           | Same method, 554–564                       | Authorization checks whether a learner belongs to the faculty member's student set, but does not check an assigned faculty ID for the session. |
| RTH-FACULTY-003 | Medium                  | Faculty session `PATCH` route, lines 10–17 | Input permits partial status changes without a defined transition command or combination rules.                                                |
| RTH-WORKER-005  | Medium / functional gap | Three notification worker routes           | Workers verify requests, log receipt and return HTTP 200, but do not dispatch a notification.                                                  |
| RTH-TEST-008    | High / verify           | Shared live-session and faculty tests      | Need integration coverage for unauthorized faculty actions, invalid transitions and simultaneous updates.                                      |

### 1. Faculty state transitions bypass the shared service

The faculty-facing API server uses:

```
await tutorialDb
  .update(liveSessionRequests)
  .set({
    status: data.status,
    meetingLink: data.meetingLink,
    scheduledAt: data.scheduledAt,
    cancelledReason: data.cancelledReason,
    updatedAt: new Date(),
  })
```

Its update predicate restricts the record by request ID and learner membership, but it does not enforce a transition such as `pending → accepted → scheduled → completed`.

This is significant because the shared `LiveSessionRepository` has transition checks, albeit with concurrency limitations identified in Pass 13.

Architectural conclusion: The faculty route and shared service currently implement different session-lifecycle rules. We need one authoritative transition policy that all writers enforce.

## 2. Security controls worth preserving

The reviewed API-server endpoints invoke `resolveFacultyAccess()` before accessing session records. The faculty access module uses batch enrollment data to determine which learners are within that faculty member's scope.

The RTH notification workers also call `verifyQStashRequest()` before parsing event payloads. That helper requires a QStash signature and verifies it using configured signing keys.

These are existing security controls. The review does not establish an unauthenticated access bypass in these routes.

## 3. Test coverage cross-check

I inspected the API-server faculty live-session route test, which contains two cases: missing faculty authentication and a successful session update.

It does not test invalid state transitions, attempts to modify another faculty member's assigned session, or concurrent updates.

This explains the distinction between a route being functionally tested and the underlying workflow being architecturally verified.

## 4. Recommended architectural correction

The proper remediation is to consolidate the session transition rules at the domain boundary, while leaving RTH and faculty-app as separate presentation/API surfaces.

The shared policy should enforce:

1. Valid previous and next states, checked atomically.
2. Faculty ownership and learner/batch scope.
3. Valid meeting and scheduling fields for the requested transition.
4. Idempotent repeated commands.
5. Durable notification delivery after a successful transition.
6. Regression tests for unauthorized actions, concurrent transitions, cancellations and partial failures.

## Review checkpoint

This pass covered 12 additional files: six faculty/notification entry points, four supporting API/authentication files, the shared faculty-access module and one regression test. Several were reviewed completely; the larger shared access module was inspected specifically around its session-related methods.

The audit remains read-only. The full eight-gate certification is not complete, and no tests or builds have been executed.

The most important new architectural finding is that faculty session updates can bypass the lifecycle rules present in the shared live-session service. This should be addressed before certifying the live-session workflow as production-ready.

# Real Tutorial Hub — Principal Architect Audit, Pass 15

Scope: Tutorial-progress authentication, backend identity propagation, API contracts, and alignment with the uploaded `FinalAechitecture.md`.

I examined the RTH progress routes, the authoritative API-server progress handler, the shared authorization helper, the completion helper, and the progress-route tests.

This pass identifies a significant security-boundary concern that deserves higher priority than the earlier frontend defects.

## 1. New findings

| ID           | Severity                       | File and exact lines                                                                            | Finding                                                                                                                          |
| ------------ | ------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| RTH-SEC-015  | High / deployment verification | `apps/api-server/src/app/api/tutorial/progress/route.ts`, 37–54, 63–69, 123–129                 | The backend uses `x-user-id` and `x-brand` directly without calling the internal-authentication validator in the handler         |
| RTH-API-015  | High                           | Same API-server route, 77–96                                                                    | GET response returns `blocksCompleted`, but the RTH client expects `blocksViewed`                                                |
| RTH-TEST-015 | High                           | `apps/realtutorialhub-web/src/app/api/tutorial/progress/__tests__/route.test.ts`, 28–35, 73–106 | Tests mock repository methods from an older implementation, despite the RTH route now forwarding HTTP requests to the API server |
| RTH-SEC-016  | Medium                         | `apps/api-server/src/app/api/tutorial/progress/route.ts`, 37–47                                 | An unrecognized brand falls back to `realtutorialhub` instead of being explicitly rejected                                       |
| RTH-API-016  | Medium                         | `apps/realtutorialhub-web/src/app/api/tutorial/progress/mark-complete/route.ts`, 17–24          | The handler ignores the supplied `blockType` and always marks `ai_tutor` complete                                                |
| RTH-API-017  | Medium                         | `apps/realtutorialhub-web/src/app/api/tutorial/progress/mark-complete/route.ts`, 21–24          | A 403 authorization error is converted to HTTP 401                                                                               |

### Critical distinction: missing route-level authentication versus proven exploit

In the API-server progress handler, identity is extracted using:

```
function extractUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}
```

The handler does not call `validateRequest()` to verify that these headers originated from a trusted gateway or internal service.

That is a confirmed gap in the handler's own trust boundary. Whether an attacker can exploit it directly depends on ingress restrictions and any authentication middleware surrounding the route. Those deployment controls have not been verified.

The project's architecture document explicitly requires authenticated brand isolation and secure identity boundaries. A route that relies on trusted headers should have a verified enforcement boundary, not depend on an undocumented assumption.

## 2. Critical cross-check: API-server proxy also exempts tutorial routes

I examined `apps/api-server/src/proxy.ts` to determine whether it closes the progress route's authentication gap.

The relevant logic is:

```
const isTutorialRoute =
  request.nextUrl.pathname.startsWith('/api/tutorial');
```

It then includes tutorial routes in `isGatewayExemptRoute` and skips the proxy's normal token-verification branch for exempt routes.

This strengthens RTH-SEC-015: the progress handler does not independently authenticate the forwarded identity, and the reviewed API-server proxy does not authenticate tutorial requests through its normal JWT check.

Other infrastructure controls may still restrict direct access, but the application code inspected here does not establish that protection.

Principal Architect priority: P1 security remediation. Introduce a verified trust boundary for the tutorial-progress endpoint, using the platform's approved internal/gateway authentication pattern, and add negative tests for forged identity headers.

## 3. Additional contract mismatch: the tests no longer represent the implementation

The RTH progress-route tests expect:

```
json.data.blocksViewed
```

They also expect a repository method to be called directly.

But the current RTH route forwards to API-server, whose GET response returns `blocksCompleted`.

This is more than weak coverage. The tests describe an earlier architecture and need reconciliation with the actual two-service HTTP contract.

The authoritative contract should define whether these values represent viewing, instructional completion, or full mastery. Those meanings must not be conflated.

## 4. Alignment with `FinalAechitecture.md`

The uploaded architecture document establishes several explicit requirements:

| Architecture requirement                            | Audit result                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| RTH and SkillUp brand isolation                     | Partially implemented; tutorial-progress trust boundary needs correction                 |
| Shared identity with verified authentication        | Implemented in several routes, inconsistent at tutorial-progress endpoint                |
| Data isolation between brands                       | Not certified for the progress workflow                                                  |
| Idempotent state-changing operations                | Mixed; earlier repository review found stronger atomicity in ILS than in legacy progress |
| Reliable event and background processing            | Partially implemented; previous passes identified incomplete failure recovery            |
| Production scalability and measurable qualification | Not yet verified by load, failure or deployment tests                                    |

The document targets zero cross-brand data exposure and requires unresolved high-severity security findings to be addressed before major scale-up. These are architectural acceptance criteria, not claims of current production readiness.

## 5. Recommended next corrections — no code changes yet

The highest-value sequence is to secure the API-server tutorial-progress handler, reconcile the six-block and 13-section progression models, repair incorrect block recording, and update the RTH/API-server contract tests.

The broader assignment, session, remediation and worker findings remain open in the audit register.

Pass 15 checkpoint: Six existing implementation/test files were inspected, with additional review of the uploaded architecture document. This is not complete line-by-line certification of the repository.

No source files were changed, and no tests were run.

# Real Tutorial Hub — Principal Architect Audit, Pass 16

Scope: API-server authentication, legacy tutorial delivery, shared tutorial services, and contract tests.

I inspected six more files in the connected API-server codebase, including the gateway authentication middleware and a newer ILS route.

The important architectural discovery is that two generations of tutorial APIs currently use different authentication patterns.

## 1. Security boundary comparison

| Endpoint or component                              | Authentication observed                                              | Assessment                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/api/tutorial/progress`                           | Reads `x-user-id` directly; normal API proxy exempts tutorial routes | High-priority gap                                          |
| Legacy `/api/tutorial/content/[subtopicId]`        | Reads user and brand headers directly                                | High-priority review                                       |
| `/api/tutorial/ils/subtopic/[subtopicId]/progress` | Calls `validateRequest({ requireInternalSecret: true })`             | Implemented                                                |
| `gateway-auth.middleware.ts`                       | Provides explicit shared-secret validation                           | Implemented, but use by individual routes must be verified |
| RTH `requireStudent()`                             | Verifies JWT audience, brand and allowed roles                       | Implemented in reviewed routes                             |

The older tutorial routes should converge on the validated identity pattern already used by ILS.

## 2. New findings

| ID              | Priority | Evidence                                              | Finding                                                                                                              |
| --------------- | -------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| RTH-SEC-017     | High     | `gateway-auth.middleware.ts`, lines 85–95 and 111–123 | Failed-secret diagnostic logs include the first ten characters of supplied and configured secrets                    |
| RTH-CONTENT-017 | Medium   | Legacy content route, lines 129–141                   | Returns a publicly cacheable response even though the service requests user-specific progress                        |
| RTH-TEST-017    | High     | Legacy content route test, lines 4–11 and 16–70       | Tests mock a content repository that the current route no longer directly uses                                       |
| RTH-ARCH-017    | Medium   | `tutorial.service.ts`, lines 43–108                   | Shared service delegates to legacy `TutorialEngine`, while new ILS uses distinct progress repositories and contracts |

### Secret diagnostics

The gateway authentication middleware logs shortened secret values on rejected authentication attempts.

Even partial credential values should not be emitted to production logs. The safer diagnostic format records the authentication mode, outcome, correlation ID and reason category, without recording credential material.

### Legacy tutorial caching

The deprecated tutorial-content handler explicitly requests `includeProgress: true` through `TutorialService`.

It then returns:

```
response.headers.set(
  'Cache-Control',
  'public, max-age=3600'
);
```

A personalized response must not be publicly cacheable. This is a confirmed cache-policy inconsistency; whether private progress fields actually appear in the serialized response depends on the legacy engine's returned data.

## 3. Test design and compatibility risks

The legacy content route tests expect successful reads from `TutorialContentRepository.getPublished()`. However, the route now delegates to `TutorialService.getContent()`.

That means the tests do not accurately mock the implementation they are intended to verify. They need to be updated before their results can be relied on for regression protection.

The newer ILS progress endpoint is a useful reference implementation because it validates service credentials before constructing an authenticated identity.

## 4. Alignment with `FinalAechitecture.md`

The actual architecture document states that:

- Tenant and brand identity must be validated server-side rather than trusted from client input.
- Every protected resource must check authorization and ownership.
- Authenticated, personalized responses must remain private.
- RTH and SkillUp must maintain separate brand data and authorization boundaries.

The reviewed legacy endpoints do not yet demonstrate compliance with all four requirements.

## 5. Eight-gate checkpoint

| Architecture gate                        | Status in this reviewed area              |
| ---------------------------------------- | ----------------------------------------- |
| 1A — Module boundaries                   | Partially implemented                     |
| 1B — SOLID, DRY, KISS, YAGNI, SoC        | Partially implemented                     |
| 1C — Authentication and authorization    | Partially implemented; high-priority gaps |
| 1D — Database ownership                  | Implemented but not fully verified        |
| 1E — API contracts                       | Partially implemented                     |
| 1F — Brand separation                    | Partially implemented                     |
| 1G — Observability and resilience        | Partially implemented                     |
| 1H — Tests and architectural enforcement | Partially implemented                     |

Principal Architect decision: The existing ILS authentication pattern should be used as the reference when securing legacy tutorial routes. Any migration must first verify active consumers, particularly where response schemas or progress semantics differ.

The next work required is to trace `TutorialEngine` content serialization and progress persistence, then verify which legacy APIs still have production callers. That will separate genuinely active security concerns from code that can safely be retired.

Pass 16 status: Six connected API-server files were examined, with review of the governing architecture document. This remains a source audit, not completed repository certification. No source changes or test executions have occurred.

# Real Tutorial Hub — Principal Architect Audit, Pass 17

Scope: Legacy tutorial engine, brand isolation, personalized content delivery, progress persistence, and migration compatibility.

I traced the legacy route through `TutorialService` into `TutorialEngine`. This pass confirms a serious implementation gap behind the earlier authentication and caching concerns.

## 1. New findings

| Finding       | Severity            | Evidence                                                                     | Assessment                                                                                                |
| ------------- | ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| RTH-SEC-018   | High                | `tutorial.engine.ts`, lines 204–219                                          | `validateBrandAccess()` is a placeholder that returns `true`                                              |
| RTH-CACHE-018 | High                | `tutorial.engine.ts`, lines 128–144, and legacy content route, lines 129–141 | Response can contain learner progress while the route marks it publicly cacheable                         |
| RTH-ARCH-018  | Medium              | `tutorial.engine.ts`, lines 158–185                                          | Legacy progress mutation uses a separate learning model from the newer ILS engine                         |
| RTH-API-018   | Medium              | `tutorial-content-api.ts`, lines 83–96                                       | Fallback to the direct repository occurs after an unsuccessful API response, not only a network failure   |
| RTH-TEST-018  | High / verification | Legacy API tests                                                             | Tests need to cover actual engine behavior and cross-brand denial, not merely successful repository mocks |

### Critical finding: brand validation is not implemented

The engine's `validateBrandAccess()` documents the intended checks against brand identity and content visibility, but its implementation concludes with:

```
return true;
```

As implemented, this method does not enforce brand visibility.

A separate check in the legacy content route compares the response's brand ID with the request's brand. However, the engine constructs that response using the supplied brand value, so that comparison cannot independently establish the underlying content's ownership.

Principal Architect assessment: This is a confirmed missing domain authorization control. The reachable exposure depends on content repository behavior and request authentication, which must be assessed together before claiming a demonstrated cross-brand data leak.

## 2. Confirmed legacy progress and remediation behavior

The source establishes an additional workflow gap.

RTH-REMEDIATION-018 — Medium / confirmed incomplete implementation

In `tutorial.engine.ts`, lines 281–297, `needsRemediation()` evaluates progress after a block is marked complete. When remediation is required, `triggerRemediation()` is called.

However, that method currently logs the event and contains a TODO for actual remediation creation and notification. The legacy workflow therefore does not implement the remediation action its name implies.

This must be reconciled with RTH's separate `RemediationService`, rather than adding a second remediation implementation.

## 3. Important positive findings

The legacy engine does use `TutorialContentRepository.getPublished()` rather than directly reading arbitrary draft content. It also calculates assignment eligibility through the shared `calculateTutorialProgress()` function.

Those are useful components, but they do not compensate for the missing brand-visibility check.

The RTH BFF content route also sets `Cache-Control: private, no-store`. The insecure public cache policy identified earlier is specifically in the API-server legacy content endpoint.

## 4. Recommended remediation order

1. Secure the legacy engine's brand access: enforce canonical content ownership and visibility in the repository/service query.
2. Secure the API-server caller identity: apply verified internal authentication to legacy progress and content endpoints.
3. Prevent personalized caching: use `private, no-store` whenever progress or other user-specific fields are included.
4. Clarify the content API contract: distinguish public published content from authenticated learner-specific content.
5. Reconcile remediation workflows: route genuine remediation events to the established domain owner.
6. Update migration tests: cover wrong-brand requests, unpublished content, user identity spoofing, and cache headers.

## Pass 17 checkpoint

Three primary files were examined, including the 315-line legacy engine, with exact-range follow-up inspection of its most consequential methods. This does not constitute complete line-by-line certification of every method in that engine.

The central finding is now source-confirmed: legacy tutorial brand authorization contains an unconditional allow path, while the newer ILS system has stronger authentication and hierarchy validation.

The review remains read-only. No files were changed and no tests were executed.

# Real Tutorial Hub — Principal Architect Audit, Pass 18

Scope: Active `tutorial_sections` delivery, ILS progress, brand-scoped repositories and frontend caching. Legacy tutorial code is excluded from further review and recorded for eventual removal.

The current architecture has some important controls worth preserving: RTH authenticates users before proxying tutorial sections, the newer ILS progress endpoint validates its internal caller, and the shared delivery service applies brand and publication filters.

However, the active implementation still has several contracts that need attention.

## Findings in the current implementation

| ID             | Severity           | Evidence                                          | Finding                                                                                                                        |
| -------------- | ------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| RTH-ACTIVE-001 | Medium / verify    | `tutorial-section.repository.ts`, lines 122–146   | Brand-specific and shared records are queried together with `LIMIT 1`, without an explicit preference for the requested brand  |
| RTH-ACTIVE-002 | Medium             | `tutorial-delivery.service.ts`, lines 212–228     | General delivery permits both `approved` and `deployed` records, although the public sitemap considers only `deployed` records |
| RTH-ACTIVE-003 | High / conditional | `tutorial-delivery.ts`, lines 93–168              | Redis sections cache is keyed only by slug and difficulty, while upstream calls forward learner identity                       |
| RTH-ACTIVE-004 | Medium             | RTH `sections/[subtopicId]/route.ts`, lines 16–70 | Endpoint logs cookie names and learner identity, and exposes unexpected exception messages                                     |
| RTH-ACTIVE-005 | Medium             | `tutorial-delivery.ts`, lines 231–286             | Invalid documents are reported separately but valid sections still return, creating a potentially partial lesson               |
| RTH-TEST-018   | Medium             | API-server sections-route tests                   | Tests use mocked delivery results; they do not establish real brand isolation or published-content selection                   |

RTH-ACTIVE-001: The repository documentation promises that the requested brand takes priority over shared content. The SQL predicate permits either brand but has no explicit ordering to guarantee that priority.

This can select shared content instead of a more specific brand version. The remedy is deterministic precedence in the query, with a test containing both eligible records.

RTH-ACTIVE-003: The cache-key concern is conditional. If the upstream response contains only identical published sections for every learner, a shared cache can be correct. We must confirm that condition before changing keys or disabling caching.

## Additional finding: delivery precedence and publication rules

The shared `TutorialDeliveryService` confirms that active content delivery uses:

- TutorialDB's `tutorial_sections` table.
- Brand identity and visibility filters.
- `TutorialDocumentSchema` validation.
- Content sanitization before learner delivery.

These are strong architectural foundations.

RTH-ACTIVE-006 — Medium: The service selects one eligible tutorial with `.limit(1)` but no deterministic ordering. When multiple eligible brand/shared records exist, the selected result is not guaranteed to be the intended version.

RTH-ACTIVE-007 — Medium / policy confirmation: `approved` content is treated as deliverable alongside `deployed` content. If approval and deployment are distinct stages in the approved publication workflow, this exposes content earlier than intended.

RTH-ACTIVE-008 — Low / maintainability: `getTutorialBySlug()` is marked deprecated in favor of page-based delivery, yet it remains part of the current delivery path. This should be treated as an active compatibility dependency—not automatically grouped with the abandoned legacy tutorial system.

## Eight-gate assessment for this tranche

| Gate                                | Result                                                |
| ----------------------------------- | ----------------------------------------------------- |
| 1A — Module boundaries              | Partially implemented                                 |
| 1B — SOLID / DRY / SoC              | Mostly sound; compatibility paths remain              |
| 1C — Authentication and identity    | Implemented for reviewed ILS endpoint                 |
| 1D — Database and content ownership | Implemented, with selection-precedence gaps           |
| 1E — API validation and contracts   | Partial; document validation is a positive            |
| 1F — Brand visibility               | Implemented, but selection precedence needs hardening |
| 1G — Caching and resilience         | Conditional cache-isolation risk                      |
| 1H — Test enforcement               | Incomplete integration evidence                       |

Principal Architect recommendation: Preserve the active `tutorial_sections`/ILS architecture. Prioritize deterministic brand-specific content selection, enforce the agreed publication state, and prove whether the delivery payload is user-independent before retaining shared Redis caching.

Legacy tutorial code is now excluded from the active audit. It remains a deferred cleanup item, with removal dependent on confirming there are no active imports or callers.

Pass 18 status: Five active source/test files were examined at varying depths. No files were modified, and no tests were executed.

# Real Tutorial Hub — Principal Architect Audit, Pass 19

Scope: Active tutorial-content repository, database schema, publication workflow, optimistic concurrency and brand isolation.

Legacy tutorial functionality remains excluded from the active audit and reserved for later removal.

I reviewed the content-write methods in `TutorialSectionRepository` and the complete `tutorial_sections` schema, cross-checking them against the architecture's requirements for data isolation, integrity and reliable publication.

## New findings

| ID              | Priority                   | Evidence                 | Finding                                                                                                                        |
| --------------- | -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| RTH-CONTENT-019 | High                       | Repository lines 393–418 | The standard content update can overwrite deployed content without checking its previous version or publication status.        |
| RTH-PUBLISH-019 | High                       | Repository lines 498–519 | `publishTutorial()` sets `deployed` without verifying approval, content validation or the prior workflow state.                |
| RTH-BRAND-019   | High / policy verification | Schema lines 78–80       | `brandVisibility` defaults to `shared_visible`, including records created for a specific brand unless the writer overrides it. |
| RTH-STATUS-019  | Medium                     | Repository lines 456–493 | Status updates are unconditional; lifecycle transitions are not enforced in this persistence method.                           |
| RTH-OPS-019     | Medium                     | Repository lines 320–387 | Content creation emits extensive diagnostic logs, including database errors and stack traces.                                  |
| RTH-DB-019      | Positive                   | Schema lines 101–107     | Partial unique index correctly protects active `(subtopicId, navigationNodeId, brandId)` identities.                           |

### RTH-CONTENT-019 — Unconditional content updates

The repository provides two different content-update methods:

- `updateTutorialContent()` changes the document and increments its version without an expected-version condition.
- `updateTutorialContentWithVersion()` requires the caller's `expectedVersion` to match the database version.

The second is the stronger design. The first can lose an editor's changes when multiple writers update the same tutorial.

More importantly, neither method directly restricts modifications based on publication status.

Recommendation: Make version-checked updates the normal authoring path, and enforce separate rules for revising deployed material. Check existing callers before changing the repository interface.

### RTH-PUBLISH-019 — Publication bypass at repository level

`publishTutorial()` directly updates:

```
{
  status: 'deployed',
  publishedAt: now,
  updatedAt: now
}
```

Its SQL predicate checks the tutorial ID and soft-deletion state, but not whether the tutorial is already approved.

The repository therefore does not independently enforce publication eligibility.

This does not prove a learner can publish content. Publication may be guarded by an upstream administrative service. That call chain is the next verification target.

## Database and brand-isolation assessment

The schema correctly defines an active-row uniqueness constraint. This prevents two active documents from having the exact same subtopic, navigation-node and brand identity.

However, identity uniqueness and brand visibility are different controls.

A document belonging to RTH should not automatically become visible to SkillUp merely because `shared_visible` is the default visibility setting.

If that default is intentional, it should be enforced through an explicit publication policy. Otherwise, a restrictive default is safer.

## Recommended remediation sequence

1. Trace all callers of `publishTutorial()` and `updateTutorialStatus()` to establish the actual publication authorization boundary.
2. Require approved-state transitions and validated documents before deployment.
3. Standardize version-checked updates and reject stale writes.
4. Verify that brand-specific content is private by default unless explicitly shared.
5. Replace detailed repository console diagnostics with structured, credential-safe operational logging.
6. Add database-backed tests for concurrent updates, invalid status transitions and cross-brand content visibility.

## Pass 19 checkpoint

| Area                             | Result                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `tutorial-sections.ts`           | Complete source inspection                                                           |
| `tutorial-section.repository.ts` | Content-write and lifecycle methods inspected; remaining methods not fully certified |
| Unique active content identity   | Implemented in schema                                                                |
| Optimistic concurrency support   | Implemented, not consistently required                                               |
| Publication eligibility          | Not enforced within reviewed repository methods                                      |
| Brand visibility defaults        | Requires policy reconciliation                                                       |
| Source changes                   | None                                                                                 |
| Tests executed                   | None                                                                                 |

The audit remains focused on the current `tutorial_sections` and ILS architecture. The newly identified issues should be verified against the actual publishing services before assigning final end-to-end severity.

The full repository audit is still in progress; no production-readiness certification is being claimed.

# Real Tutorial Hub — Principal Architect Audit, Pass 20

Scope: Active `tutorial_sections` publishing, composer service, publication API, repository write controls and tests. The abandoned legacy tutorial system remains excluded.

This pass traces the publication workflow from the SkillHubCore Admin API into `TutorialComposerService` and `TutorialSectionRepository`.

The key result: document validation exists before publication, but approval-state enforcement and service-level authorization are not implemented in the reviewed composer methods.

## New findings

| ID                  | Severity                  | Exact source                                                           | Finding                                                                                                                   |
| ------------------- | ------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| RTH-PUBLISH-020     | High                      | `tutorial-composer.service.ts`, lines 363–408                          | Publishing validates the document and rejects empty blocks, but does not require the current status to be `approved`      |
| RTH-AUTH-020        | High / boundary-dependent | Same service, lines 372–373                                            | Service-level publish authorization remains a TODO; the reviewed Admin route has separate authentication and brand checks |
| RTH-STATUS-020      | High                      | Same service, lines 322–347                                            | Status update accepts a different status without checking an allowed transition graph                                     |
| RTH-CONCURRENCY-020 | High                      | Same service, lines 270–308, 460–513                                   | Content updates and block appends call the non-version-checked repository update method                                   |
| RTH-CACHE-020       | Medium                    | Admin publish route, lines 145 onward; composer service, lines 413–415 | Cache invalidation occurs outside the domain service, leaving consistency dependent on the calling route                  |

### 1. Publication approval is not enforced by the domain service

The composer service performs two important checks: it parses the document with `TutorialDocumentSchema` and rejects documents with zero blocks.

Those are meaningful protections.

However, it proceeds to `repository.publishTutorial()` without requiring an approved prior status. This means structurally valid content can pass the service even when its editorial approval is incomplete.

The fix belongs at the domain boundary and should be reinforced with an atomic database status predicate.

### 2. Authorization is implemented at the route, not inside the service

The SkillHubCore Admin publish endpoint calls `requireAdminRequest()`, authenticates the user, checks subtopic access and checks brand access before invoking `publishTutorial()`.

That is a positive finding.

The shared service itself still contains:

```
// TODO: Add authorization check
// await this.assertCanPublishTutorial(context, tutorial);
```

This is a defense-in-depth concern, not proof that the reviewed Admin endpoint is publicly accessible.

The service accepts a context containing a user ID, but does not itself verify whether that user is entitled to publish the particular document.

## 3. Cache invalidation failure is not propagated

The Admin publishing route calls `invalidateTutorialDeliveryCache()` without awaiting it:

```
invalidateTutorialDeliveryCache(existingTutorial.subtopicId)
  .catch((error) => {
    console.error('Cache invalidation failed', error);
  });
```

The route can return success while the cache invalidation is still pending or has failed.

RTH-CACHE-021 — Medium, confirmed: Publication success does not guarantee that cached delivery content has been invalidated.

A better implementation should explicitly define whether publication requires successful invalidation or uses versioned cache keys and reliable asynchronous invalidation.

The correction should account for the existing Redis and Next.js caching layers, rather than invalidating only one cache.

## 4. Test coverage observations

The active shared package includes:

- `tutorial-composer.service.phase1.test.ts` — 552 lines.
- `tutorial-section.repository.phase1.test.ts` — 466 lines.

These tests cover multiple sidebar pages under one subtopic, independent document retrieval, updates, invalid navigation-node identity, unique active identities and recreation after soft deletion.

That is useful evidence for the page-aware content architecture.

However, the reviewed test cases primarily cover page identity and document operations, not the complete approval/deployment lifecycle. Publication-specific tests are still needed for rejected, draft, approved, deployed and concurrently modified documents.

## 5. Principal Architect remediation decision

The recommended order is:

1. Enforce publication authorization and approved-state eligibility in the composer domain service.
2. Make the publish transition atomic by requiring the expected database status.
3. Require optimistic concurrency for content edits and appended blocks.
4. Separate editing of deployed content from the currently deployed learner-visible revision.
5. Make cache invalidation and publication consistency explicit.
6. Add domain-level and route-level regression tests for all failure paths.

## Pass 20 checkpoint

| Reviewed area                                 | Status                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| Admin publication route                       | Reviewed, including authentication and cache handling |
| Shared composer publication method            | Reviewed                                              |
| Shared composer content update/status methods | Reviewed                                              |
| Repository lifecycle implementation           | Reviewed in earlier pass                              |
| Existing page-identity tests                  | Test inventory and cases inspected                    |
| Production publishing correctness             | Not certified                                         |
| Code modifications                            | None                                                  |
| Test execution                                | None                                                  |

The active modular system has a good foundation: canonical page identity, database uniqueness, structured tutorial documents and existing publication routing.

The main unresolved architectural problem is that content approval, publication and version changes are not yet enforced as one consistent domain lifecycle.

I have not changed any code. The abandoned legacy tutorial implementation remains excluded from the active review and marked for removal after dependency verification.

# Real Tutorial Hub — Principal Architect Audit, Pass 21

Scope: Four active SkillHubCore Admin content-composer API files and their integration with the shared `TutorialComposerService`. No legacy tutorial implementation was reviewed.

The main finding is that the active system already contains two different concurrency patterns: ordinary content edits are not version-checked, while the suggestion-application workflow explicitly supports optimistic concurrency.

## Findings

| ID                  | Severity | Exact source                                            | Assessment                                                                                                                                                 |
| ------------------- | -------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-EDIT-021        | High     | `sections/[sectionId]/route.ts`, lines 197–224          | PATCH does not visibly require an `expectedVersion`; its service calls the non-version-checked repository method                                           |
| RTH-BLOCK-021       | High     | `sections/[sectionId]/blocks/route.ts`, lines 129–158   | Block append has the same lost-update exposure                                                                                                             |
| RTH-CACHE-022       | Medium   | Section PATCH/DELETE, block POST, section CREATE        | Cache invalidation is initiated asynchronously without awaiting success                                                                                    |
| RTH-API-021         | Medium   | `sections/[sectionId]/blocks/route.ts`, lines 35–44     | Request schema accepts a generic string for block type; canonical validation occurs later                                                                  |
| RTH-AUTH-021        | Positive | Admin composer routes                                   | Authentication, subtopic authorization and brand authorization are explicitly checked before mutation                                                      |
| RTH-CONCURRENCY-021 | Positive | `suggestions/apply/route.ts`, lines 229–241 and 343–350 | Suggestion workflow explicitly handles expected-version conflicts, demonstrating that optimistic concurrency is already part of the project's architecture |

## 1. Ordinary edits versus suggestion edits

This is the most important cross-file inconsistency.

Ordinary PATCH / block append

Concurrency gap

Admin route → Composer service → Unconditional repository content update

Suggestion application

Safer pattern

Admin route → Suggestion application service → Version-aware mutation with conflict handling

The appropriate correction is not to invent another editing framework. Reuse the existing version-aware repository capabilities across every active content-writing path.

For block append, version checking is especially important because two simultaneous requests may each read the same existing block array and then overwrite one another's additions.

## 2. Authentication design is stronger at the API boundary

The four reviewed Admin routes use administrative request protection and authenticate the caller. Before operating on an existing tutorial, they also check subtopic and brand access.

This narrows the earlier service-authorization concern: the reviewed HTTP paths do enforce access checks.

However, other possible direct callers of `TutorialComposerService` still require verification before declaring its service boundary independently secure.

## 3. Schema validation exists, but its position matters

The append-block route accepts an input whose `type` is any nonempty string and whose `content` is unknown. The composer service subsequently validates the updated document using `TutorialDocumentSchema`.

That downstream validation is valuable. It reduces the risk of invalid content being persisted, but it also means the route's input contract is less precise than the canonical document contract.

Prefer using shared block schemas where practical, while retaining authoritative full-document validation at the service boundary.

## 4. Recommended next engineering actions

1. Standardize `expectedVersion` for normal PATCH and block append.
2. Return HTTP 409 for stale writes, with consistent conflict details.
3. Preserve the existing suggestion-application concurrency mechanism.
4. Enforce lifecycle rules for editing approved and deployed documents.
5. Ensure cache invalidation follows the active delivery cache strategy.
6. Add concurrent-editor and simultaneous-block-append regression tests.

## Review checkpoint

New files inspected

# 4

Code modifications

# 0

Tests executed

# 0

The four API files were inspected around their full route structure and critical authorization/mutation logic. Large files were not exhaustively certified line by line.

Principal Architect conclusion: The active modular tutorial architecture has adequate foundations for a safer edit pipeline, but those guarantees are not consistently applied across writing paths. The next audit priority is the suggestion-application service, its transaction boundaries, and publication approval workflows, followed by the active ILS/content version-consistency integration.

The legacy tutorial implementation remains out of scope and on the deferred removal register.

# Real Tutorial Hub — Principal Architect Audit, Pass 22

Scope: Active suggestion-application pipeline, database concurrency, regression tests and human-review schema.

The abandoned legacy tutorial system remains excluded from the active audit. Its eventual removal stays on the cleanup register.

This pass covers three additional files, including a 291-line application service, a 702-line integration test suite and the complete 67-line review-queue schema.

## 1. Confirmed findings

| ID              | Priority        | Evidence                                           | Finding                                                                                                                                    |
| --------------- | --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| RTH-SUGGEST-022 | Positive        | `suggestion-application.service.ts`, lines 173–258 | Suggestions undergo verification, transformation, schema validation and an atomic version-checked database update                          |
| RTH-SUGGEST-023 | Medium          | Same service, lines 235–248                        | Zero updated rows are always reported as a version conflict, even though deletion or absence can also cause that result                    |
| RTH-CACHE-023   | Medium          | Integration test, lines 631–666                    | A failed cache invalidation is explicitly accepted as HTTP 200 after a database mutation                                                   |
| RTH-TEST-023    | Medium          | Integration test, lines 124–152                    | Integration tests depend on preexisting seeded subtopics and mock the authentication helpers                                               |
| RTH-REVIEW-023  | Medium / verify | `content-review-queue.ts`, lines 20–67             | Review-queue schema contains approval tracking fields but no direct foreign-key declarations for its section and orchestration identifiers |

## 2. Suggestion application: concurrency is implemented correctly

This workflow is stronger than the ordinary content-edit paths reviewed in Pass 21.

The service:

1. Verifies the suggestion against the current document and expected version.
2. Regenerates and validates the server-authoritative suggestion.
3. Transforms it into the canonical tutorial document.
4. Validates the resulting `TutorialDocument`.
5. Persists using `updateTutorialContentWithVersion()`.

The final database update includes the expected version in its write predicate.

That gives the workflow protection against two concurrent requests both applying changes based on the same old version.

Architectural decision: Preserve this approach and reuse it for ordinary editor PATCH operations and block appends. Avoid creating a separate concurrency abstraction when a working one already exists.

## 3. Existing concurrency regression tests

The integration test suite includes scenarios for:

- Successful persistence and version increment.
- Stale expected version producing HTTP 409.
- Suggestion fingerprint mismatch.
- Unknown suggestions.
- Unauthorized and unauthenticated requests.
- Rejection of client-supplied `suggestedContent`.
- Two concurrent applications producing one success and one conflict.
- Retrying with an already consumed version.
- Database mutation succeeding despite cache invalidation failure.
- Persisted document schema validation.

This is materially stronger coverage than the ordinary editor route tests inspected in earlier passes.

One important limitation: authentication helpers are mocked, so the suite tests the route's handling of authorization outcomes rather than the actual identity-validation implementation.

## 4. Suggestion verification service

I also inspected `suggestion-verification.service.ts` (237 lines), which supplies the verification stage of the active suggestion-application pipeline.

Positive finding: Both single and batch verification reload the section, compare the expected version, regenerate suggestions on the server, and verify the suggestion fingerprint. This reduces the risk of accepting client-manipulated content.

RTH-SUGGEST-024 — Medium: The verification service retrieves sections by ID without independently receiving a verified user/brand context. Authorization is currently enforced by the calling Admin API. This is a service-boundary dependency that should be documented and protected against untrusted direct callers.

## 5. Principal Architect decisions

The immediate priority is to preserve the existing suggestion-application design and extend its stronger guarantees to ordinary editing.

For the review workflow, the next checks should establish whether approval is linked to a specific document version, whether reviewers can approve their own submissions, and whether publication consumes the approved version rather than whichever document is current.

The review-queue schema alone does not establish those guarantees.

## Pass 22 checkpoint

| Area                                     | Coverage                                         |
| ---------------------------------------- | ------------------------------------------------ |
| Suggestion application service           | Core workflow and persistence path inspected     |
| Suggestion verification service          | Verification methods inspected                   |
| Suggestion-application integration tests | Test scenarios and targeted assertions inspected |
| Human review-queue schema                | Complete source inspection                       |
| Source files examined this pass          | 4                                                |
| Code modifications                       | 0                                                |
| Tests executed                           | 0                                                |

The most important result of this pass is that the active suggestion workflow already provides a viable architectural model for server-authoritative changes with optimistic concurrency.

No source modifications have been made. The full repository is not yet certified, and legacy tutorial functionality remains excluded from the active audit.

# Real Tutorial Hub — Principal Architect Audit, Pass 23

Scope: Active tutorial composer, analysis, import, presentation suggestions, content fingerprints, and generation-orchestration data model.

I expanded this pass to eight additional files, covering approximately 1,700 lines of source and tests. This is a targeted code-level review; the longer test files have not all been exhaustively certified line by line.

The abandoned legacy tutorial system remains outside the audit and on the deferred removal register.

## 1. New audit findings

| ID               | Severity              | Source                                        | Finding                                                                                                               |
| ---------------- | --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| RTH-COMPOSER-023 | Medium                | `block-suggestions/route.ts`, lines 112–129   | Subtopic and brand authorization are conditional on those fields being supplied                                       |
| RTH-COMPOSER-024 | Medium                | `presentation-ideas/route.ts`, lines 125–142  | The same optional-context authorization pattern appears in presentation suggestions                                   |
| RTH-COMPOSER-025 | Medium                | `analysis/route.ts`, lines 85–100             | Analysis defaults missing brand context to `shared`, without requiring an explicit brand selection                    |
| RTH-IMPORT-023   | Medium                | `import/route.ts`, lines 87–104               | Import also defaults to shared brand context                                                                          |
| RTH-TEST-025     | Medium                | `presentation-ideas/__tests__/route.test.ts`  | Authentication helpers are mocked; tests verify handler behavior, not actual token or permission enforcement          |
| RTH-GEN-023      | Medium / verification | `ai-generation-orchestration.ts`, lines 36–55 | Generation progress counters and section arrays are stored separately, requiring service-level consistency guarantees |

### Optional authorization context

The block-suggestion and presentation-idea endpoints authenticate the caller and check tutorial-edit permission. That is good.

However, the subtopic and brand access checks occur only when the corresponding optional identifiers are included in the request.

For a pure, stateless analysis of a document already supplied by an authorized administrator, this may be intentional. For suggestions that represent an existing protected tutorial, those identifiers should be resolved from the authoritative document rather than treated as optional client context.

Recommendation: Distinguish clearly between document-preview operations and operations tied to persisted content. Require verified content identity for the latter.

## 2. Fingerprint integrity — positive finding

`packages/db-tutorial/src/services/suggestion-fingerprint.service.ts`, lines 66–159, constructs a stable representation from the suggestion's semantic fields, canonicalizes object keys, and produces a SHA-256 fingerprint.

The corresponding test suite covers deterministic output, property-order independence, and changes to source text, source blocks, block type and suggested content.

Assessment: This is a sound mechanism for detecting changes to a suggestion during the verified application workflow. It should be retained.

One distinction matters: a fingerprint is not, by itself, proof of authorization or approval. Those remain separate controls.

## 3. Approval workflow — not yet proven end to end

The `ai-generation-orchestration` schema includes job identity, generation status, progress counters, retry fields, brand ownership and initiating user.

The previously reviewed `content-review-queue` schema includes reviewer assignment, status and feedback.

Together, these demonstrate that the project has data structures for generation and human review. They do not prove that a content version must receive independent human approval before deployment.

That guarantee must be established by tracing the actual review and publish commands.

## 4. Recommended next checks

The next highest-value work is to connect the remaining approval workflow across services and persistent records:

- Identify the authoritative approve/reject command and its authorization checks.
- Determine whether approval records the exact content version or fingerprint.
- Verify whether authors can approve their own submissions.
- Ensure content edits after approval require reapproval.
- Confirm publication consumes the approved revision and not an independently edited document.
- Verify that generation/review status updates and audit records are atomic.

## Pass 23 checkpoint

| Area                                       | Result                     |
| ------------------------------------------ | -------------------------- |
| Eight additional source/test files         | Inspected                  |
| Fingerprint construction                   | Verified in source         |
| Fingerprint test scenarios                 | Inspected, not executed    |
| Composer analysis/suggestion authorization | Reviewed                   |
| Generation-orchestration schema            | Complete source inspection |
| End-to-end approval independence           | Not yet established        |
| Code changes                               | None                       |
| Tests executed                             | None                       |

Principal Architect conclusion: The active tutorial platform has strong building blocks for secure suggestion application. The major remaining governance question is whether those protections extend through human approval and deployment as an immutable, version-bound workflow.

I have kept this pass read-only and excluded the abandoned legacy tutorial system as requested.

No. The full project audit is not yet completed.

We have completed 23 audit passes, but the repository has not received a complete file-by-file, line-by-line review or final architectural certification.

## Current audit status

| Area                                            | Status                                  |
| ----------------------------------------------- | --------------------------------------- |
| RTH authentication and authorization            | Partially audited                       |
| Active `tutorial_sections` architecture         | Partially audited                       |
| ILS learning-progress engine                    | Partially audited                       |
| Tutorial content editor and publishing          | Partially audited                       |
| AI Tutor                                        | Partially audited                       |
| Assignments and projects                        | Partially audited                       |
| Live sessions and faculty workflows             | Partially audited                       |
| Remediation workflows                           | Partially audited                       |
| Background workers and event processing         | Partially audited                       |
| Database concurrency and brand isolation        | Partially audited                       |
| Automated tests and CI/CD                       | Not fully audited                       |
| End-to-end integration and production readiness | Not certified                           |
| Legacy tutorial system                          | Excluded as requested; removal deferred |

## What remains

The major remaining work includes completing coverage of unreviewed source files, tracing human approval through deployment, verifying all cross-service contracts, examining integration and infrastructure configuration, and executing tests where a suitable environment is available.

We have identified significant issues involving authorization boundaries, content publication, optimistic concurrency, cache invalidation and workflow reliability. These are audit findings, not yet verified fixes.

## Principal Architect conclusion

Audit status: In progress — production readiness not certified

I recommend continuing the audit until every active file is accounted for, then producing one consolidated final report containing severity-ranked findings, exact locations, recommended corrections, test requirements and eight-gate architecture compliance.

The legacy tutorial implementation will remain outside the active audit and be tracked for removal in the final cleanup phase.

No code has been modified, and no tests have been executed during these audit passes.

# Real Tutorial Hub — Principal Architect Audit, Pass 24

Scope: Active ILS learning-progress APIs, request validation, internal authentication and security tests.

I reviewed the eight ILS route/helper files, the shared request schemas, the internal-authentication middleware and the authentication regression-test suite at commit `864138730d4c74b9a1eba231be880172d43716d5`.

## 1. Confirmed strengths

The active ILS routes consistently call `validateRequest(request, { requireInternalSecret: true })` before constructing a learner identity or invoking `LearningProgressService`.

Other positive controls include:

- Learner identity and brand are derived from validated request context rather than request-body fields.
- `complete-node` does not accept client-provided required-block lists.
- Block active-time requests require an event UUID for idempotency.
- Request schemas limit navigation IDs, block IDs and time increments.
- Existing authentication tests exercise missing secrets, invalid secrets, forged headers and authenticated identity propagation.

These are meaningful improvements over the abandoned tutorial system, which remains outside this audit.

## 2. Findings requiring attention

| ID             | Severity | Evidence                                    | Finding                                                                                                                               |
| -------------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| RTH-ILS-024-01 | Medium   | `navigation/[nodeId]/route.ts`, lines 86–96 | A hardcoded block UUID triggers diagnostic logging of detailed learning state                                                         |
| RTH-ILS-024-02 | Medium   | `block-visit/route.ts`, lines 28–188        | Large amounts of commented forensic logging remain in the production handler                                                          |
| RTH-ILS-024-03 | Medium   | `_helpers.ts`, lines 19–70                  | Deprecated `extractAuthenticatedIdentity()` still exists and reads identity headers without authenticating them                       |
| RTH-ILS-024-04 | Medium   | `block-completion/route.ts`, lines 72–80    | Client-supplied block type, ID and version reach the service; canonical block-identity validation must be enforced downstream         |
| RTH-ILS-024-05 | Medium   | `ils.schemas.ts`, lines 32–37, 74–81        | Block types are arbitrary nonempty strings at the HTTP boundary, rather than a canonical block-type enumeration                       |
| RTH-ILS-024-06 | Low      | All inspected ILS routes                    | Each handler independently creates the same four repositories and learning-progress service, introducing repetitive dependency wiring |

The fourth and fifth findings are boundary checks, not proof that the service accepts invalid blocks. The earlier service audit found hierarchy validation, but block/version membership needs separate confirmation.

## 3. Internal authentication — deeper verification

The middleware confirms that `requireInternalSecret: true` fails closed when the internal secret is missing or incorrect. The authenticated identity is then constructed from the trusted internal request.

This is a positive result.

Two improvements remain:

RTH-ILS-024-07 — Medium: `internal-auth.middleware.ts`, lines 80–127, checks that `x-user-id` and `x-brand` exist, but does not verify that the user ID is a valid UUID or that the value is nonempty. Subsequent repository operations may reject malformed identities, but the authentication boundary should validate them consistently.

RTH-ILS-024-08 — Medium / trust-model review: A valid internal secret permits the caller to specify the user identity and brand. This is normal for trusted service-to-service calls, but means possession of that secret grants authority to represent different learners and brands. The secret's distribution and caller permissions therefore matter.

The route tests demonstrate correct rejection of unauthorized requests; they do not establish deployment-level secret isolation.

## 4. Eight-gate checkpoint

| Architecture gate               | Result for this pass                                           |
| ------------------------------- | -------------------------------------------------------------- |
| 1A — Module boundaries          | Sound overall; duplicated dependency construction              |
| 1B — SOLID / DRY / SoC          | Repetitive route boilerplate                                   |
| 1C — Identity and authorization | Internal authentication implemented; input hardening remains   |
| 1D — Database / concurrency     | Delegated to ILS service; requires further verification        |
| 1E — API validation             | Implemented with Zod; canonical block checks need verification |
| 1F — Brand isolation            | Authenticated brand context propagated correctly               |
| 1G — Observability              | Forensic logging cleanup required                              |
| 1H — Tests                      | Authentication regression coverage exists; execution pending   |

## 5. Audit checkpoint

Files examined

# 11

Source changes

# 0

Tests executed

# 0

All eight short ILS route/helper files and the 151-line validation schema were read in full. The longer middleware and security-test files were reviewed through targeted sections and test cases; those are not yet certified line by line.

Principal Architect assessment: The active ILS API authentication boundary is substantially stronger than the older progress paths previously encountered. The immediate audit priority is now the canonical block-identity checks, event idempotency, progress-version consistency and the way RTH's frontend calls these endpoints.

The repository-wide audit remains in progress, with no changes applied and no tests executed.

# Real Tutorial Hub — Principal Architect Audit, Pass 25

Scope: Active ILS learning-progress service, block and navigation-state repositories, idempotent telemetry, hierarchy-resolution tests and completion tests.

I expanded this pass to seven additional files, with approximately 4,300 lines of source and tests inspected at varying depths. The audit remains read-only, and the abandoned legacy tutorial system is excluded.

## 1. New findings

| ID             | Severity           | Exact evidence                                              | Finding                                                                                                                                                                        |
| -------------- | ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RTH-ILS-025-01 | High               | `learning-progress.service.ts`, lines 328–379               | Block-completion mutation validates navigation hierarchy but does not visibly verify the submitted block ID/version against the canonical document before recording completion |
| RTH-ILS-025-02 | High / concurrency | Same service, lines 469–527                                 | Node-completion eligibility is checked before a separate repository mutation; no transaction or version predicate ties the evaluation to that write                            |
| RTH-ILS-025-03 | Medium             | `tutorial-navigation-progress.repository.ts`, lines 280–308 | An already-completed block event still increments the progress record's version and updates its last-viewed timestamp                                                          |
| RTH-ILS-025-04 | Medium             | Same repository, around lines 270–283                       | Duplicate-record creation can trigger recursive retries without a visible retry bound                                                                                          |
| RTH-ILS-025-05 | Positive           | `block-telemetry-event.repository.ts`, lines 40–58          | Event IDs are claimed with `ON CONFLICT DO NOTHING`                                                                                                                            |
| RTH-ILS-025-06 | Positive           | `learning-progress.service.ts`, lines 750 onward            | Telemetry claim and time accumulation run within one database transaction                                                                                                      |
| RTH-ILS-025-07 | Positive           | `block-learning-state.repository.ts`, lines 262–362         | Block-state upsert uses atomic database operations and complete block identity                                                                                                 |
| RTH-TEST-025   | Medium             | `learning-progress.service.gate-h.test.ts`                  | Tests explicitly address disagreement between canonical completed-block records and block-learning-state timestamps                                                            |

### High-priority finding: block-completion authority

In `LearningProgressService.recordBlockCompletion()`, the code validates the user's ID, navigation ID, block ID and block version, then validates the navigation hierarchy.

It subsequently passes the supplied block ID, type and version to `markBlockCompleted()`.

The reviewed method does not show a check proving that the exact block ID/version belongs to the currently published page.

This distinction matters: syntactically valid block identifiers are not necessarily authorized instructional content.

Recommended correction: Resolve the canonical page document before accepting a completion event and verify the exact block identity and eligibility. Do not trust the client's block type to establish instructional completion.

The downstream repository was inspected separately; its responsibility is recording progress, not determining educational eligibility.

## 2. Strong telemetry idempotency implementation

The block-active-time service verifies that a repeated event ID carries the same immutable payload as the original event.

That means:

- The same event delivered twice does not accumulate time twice.
- Reusing an event ID with changed learner, block, version or time is rejected.
- Event claiming and the corresponding state update share one database transaction.

This is an effective foundation for retry-safe learning telemetry.

A useful next improvement would be ensuring that client retry logic preserves the original event ID instead of generating a new one for every retry.

## 3. Concurrency and completion consistency

The navigation-progress repository uses atomic JSONB block append operations, reducing duplicate completion records under concurrent writes.

However, the service still evaluates node eligibility before calling `completeNode()` separately.

That creates a potential time-of-check/time-of-use window if content requirements or progress state change between evaluation and persistence.

For educational correctness, the completion decision should be consistent with a specific canonical content revision.

## 4. Test coverage assessment

Two particularly useful suites were examined:

`learning-progress.hierarchy-resolution.test.ts`

Covers instructional blocks, assessment exclusions, structural blocks, missing versions, future version identifiers and empty pages.

`learning-progress.service.gate-h.test.ts`

Covers canonical completion timestamps, mismatched block versions, mismatched block identities, multiple blocks and compatibility with previously recorded state.

These tests strengthen confidence in read-side progress calculation, but do not replace integration tests for forged block IDs, concurrent content revisions and atomic node completion.

## 5. Principal Architect action plan

The highest-priority corrections are:

1. Verify exact block identity against the active canonical tutorial document before recording completion.
2. Bind node-completion decisions to a consistent content revision.
3. Standardize finite retry limits and explicit conflict handling.
4. Preserve the existing transactional event-idempotency design.
5. Add database-backed tests for invalid block IDs, stale versions, content changes during completion and duplicate events under concurrency.

## Pass 25 checkpoint

| Area                               | Coverage                                     |
| ---------------------------------- | -------------------------------------------- |
| `learning-progress.service.ts`     | Critical service methods inspected           |
| Block-learning-state repository    | Atomic writes and identity paths inspected   |
| Block-telemetry-event repository   | Idempotency methods inspected                |
| Navigation-progress repository     | Completion and concurrency methods inspected |
| Gate H completion tests            | Scenarios inspected                          |
| Hierarchy-resolution tests         | Scenarios inspected                          |
| Block-state repository tests       | Test inventory and relevant cases inspected  |
| Files examined                     | 7                                            |
| Files fully certified line by line | 0                                            |
| Changes made                       | 0                                            |
| Tests executed                     | 0                                            |

Audit status: Still in progress. This pass identified significant active ILS correctness risks and confirmed that the telemetry layer contains reusable production-grade concurrency patterns. End-to-end claims still require executed tests and complete caller tracing.

The legacy tutorial system remains excluded from the audit and reserved for the final removal phase.

# Real Tutorial Hub — Principal Architect Audit, Pass 26

Scope: Active ILS database schemas, telemetry persistence, navigation-progress concurrency tests and learning-progress service tests.

I examined seven additional files. Four implementation files were read completely; three large test suites were inspected for coverage and assertions.

The strongest finding is that the database has useful uniqueness guarantees, but some educational-state invariants remain enforced only in application code.

## 1. Findings

| ID              | Severity                 | File / lines                                                           | Finding                                                                                                   |
| --------------- | ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| RTH-DB-026-01   | Medium                   | `schema/block-learning-state.ts`, 44–55                                | Telemetry counters have defaults but no database `CHECK` constraints preventing negative values           |
| RTH-DB-026-02   | Medium                   | `schema/tutorial-navigation-progress.ts`, 47–59                        | Visit, revision and active-time counters likewise lack database-level nonnegative constraints             |
| RTH-DB-026-03   | Medium                   | `schema/block-telemetry-events.ts`, 34–45                              | `eventId` is stored as text, although the HTTP contract requires UUID format                              |
| RTH-DB-026-04   | Medium                   | `schema/block-telemetry-events.ts`, 43–45                              | The database does not independently constrain active-time increments to the documented 0–600-second range |
| RTH-ILS-026-05  | Medium / policy decision | `learning-progress.service.test.ts`, 1281–1338                         | Tests explicitly consider zero-required-block pages complete                                              |
| RTH-TEST-026-06 | Positive                 | `tutorial-navigation-progress.repository.test.ts`, 153–260 and 619–780 | Existing tests cover atomic block completion, visit deduplication and concurrent session changes          |

These issues do not establish active data corruption. The application service already validates several values before writing them. Database constraints would provide defense in depth against future code paths, migrations and direct database operations.

## 2. Database isolation — confirmed strengths

The schemas enforce partial unique identities:

- `block_learning_state`: one active row per learner, navigation node, block ID and block version.
- `tutorial_navigation_progress`: one active row per learner and navigation node.
- `block_telemetry_events`: one event per globally unique event ID.

The telemetry event record also survives soft deletion of a learning-state row. That supports correct idempotency when state records are recreated.

These are important controls to retain.

## 3. Zero-required-block completion needs an explicit product contract

The learning-progress tests deliberately assert that an informational page with no required instructional blocks can be completed.

That behavior is not necessarily a bug. It becomes problematic only if the content is missing, malformed or still being generated, yet the system treats the absence of requirements as a valid empty lesson.

The domain needs to distinguish:

Valid informational page: No required blocks by design; completion may be permitted.

Unavailable or invalid page: Requirements cannot be resolved; completion should not succeed automatically.

This distinction should be enforced in the active ILS service and covered by integration tests.

## 4. Test coverage findings

The reviewed suites contain substantial coverage for:

- Identity and hierarchy validation.
- Navigation visit and revision counting.
- Block-completion idempotency.
- Canonical requirement calculations.
- Brand-aware content resolution.
- Block versions and instructional participation.
- Active-time validation.
- Concurrent session updates.
- Atomic JSONB completion recording.

One gap remains particularly important: tests for the precise intersection of canonical document revisions, forged block completion and concurrent publishing.

Those scenarios can reveal correctness defects even when the individual repository operations are atomic.

## 5. Principal Architect recommendation

Before production certification, prioritize exact block-identity verification, reliable distinction between empty and unavailable content, and consistency between node completion and the published document revision.

After that, strengthen database constraints and run the existing concurrency suites against a controlled PostgreSQL test database.

## Pass 26 checkpoint

| Metric                          | Result      |
| ------------------------------- | ----------- |
| New files examined              | 7           |
| Implementation files fully read | 4           |
| Large test suites inspected     | 3           |
| Tests executed                  | 0           |
| Code changes                    | 0           |
| Audit completion                | In progress |

Conclusion: The active ILS persistence layer has stronger concurrency and identity foundations than several other reviewed workflows. Its remaining risks concentrate on educational correctness and the boundaries between validated content, learner progress and publication revisions.

The abandoned legacy tutorial system remains excluded, with eventual removal deferred as requested.

# Real Tutorial Hub — Principal Architect Audit, Pass 27

Repository: `skillupitacademy-alt/SUIA_RTH_SHC`\
Commit: `864138730d4c74b9a1eba231be880172d43716d5`\
Scope: Active ILS, navigation validation, canonical blocks, suggestion transformations, and associated tests.

This pass covers 16 additional files, including approximately 5,500 lines of implementation and tests. Seven shorter files were read in full, while longer services and test suites received targeted inspection. I have not classified a targeted review as a completed line-by-line certification.

The retired legacy tutorial system remains excluded.

## 1. New findings

| ID               | Priority                          | Source / lines                                                                              | Finding                                                                                                                         |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| RTH-ILS-027-01   | High                              | `learning-progress.hierarchy-resolution.ts:47–65`                                           | Missing content and legitimately empty content both resolve to zero required blocks                                             |
| RTH-ILS-027-02   | High / conditional                | `learning-progress.hierarchy-resolution.ts:52–59`; `tutorial-section.repository.ts:122–146` | Canonical progress requirements depend on a repository lookup that does not deterministically prioritize brand-specific content |
| RTH-ILS-027-03   | Medium                            | `learning-progress.validation.ts:17–117`                                                    | Several service validators check only for nonempty strings, not the stricter HTTP-format contracts                              |
| RTH-ILS-027-04   | Medium                            | `tutorial-navigation-progress-sql.helpers.ts:127–144`                                       | First-view timestamp initialization depends on a null session ID rather than the timestamp's current value                      |
| RTH-NAV-027-05   | Medium / integration verification | `sidebar-navigation-validator.service.ts:46–125`                                            | Sidebar validation requires a brand-specific tree without a shared-content fallback                                             |
| RTH-ILS-027-06   | Positive                          | `tutorial-navigation-progress-sql.helpers.ts:33–116`                                        | Atomic JSONB completion deduplication and database-driven session counters are implemented                                      |
| RTH-BLOCK-027-07 | Positive                          | `block-transformation.service.ts:109–178`                                                   | Transformation clones its input, dispatches explicitly by block type and validates the resulting document                       |
| RTH-TEST-027-08  | Medium                            | Integration test suites                                                                     | Strong database concurrency scenarios exist, but coverage of published-content revision changes remains unproven                |

### A. Missing content can become 100% progress

The hierarchy resolver returns an empty required-block array when a section or its blocks are unavailable:

```
if (!section || !section.content || !section.content.blocks) {
  return [];
}
```

The aggregation function then treats zero required blocks as 100% complete.

These two behaviors are individually understandable, but their combination can mistake content unavailable for content complete.

A section lookup can also fail because of a brand mismatch or an unpublished/missing document. Those cases should not silently become valid completion requirements.

Recommended correction: Return a richer resolution result distinguishing `available`, `empty_by_design`, `not_found` and `invalid`. Only a valid, intentionally empty page should use the zero-requirement completion policy.

### B. Canonical progress uses potentially ambiguous brand resolution

The hierarchy resolver relies on `getTutorialByPageIdentity()`.

As confirmed in an earlier pass, that repository lookup allows both the requested brand and `shared` but uses `LIMIT 1` without guaranteed brand precedence.

Consequently, the instructional-block requirements used for progress can depend on which eligible tutorial row is returned.

Recommended correction: Make selection deterministic, then ensure learner content delivery and ILS both resolve the same canonical document identity and revision.

### C. First-view timestamp semantics

The SQL helper `buildAtomicFirstViewedAtInit()` initializes the timestamp when `lastSessionId IS NULL`.

That is a proxy for the intended rule, rather than the rule itself. Where session identity remains null or is not yet recorded, a later call could overwrite an existing first-view timestamp.

Prefer `COALESCE(firstViewedAt, incomingTimestamp)` or an equivalent conditional based directly on `firstViewedAt IS NULL`.

## 2. Source coverage

| File                                                                  | Inspection     |
| --------------------------------------------------------------------- | -------------- |
| `repositories/tutorial-navigation-progress-sql.helpers.ts`            | Full           |
| `services/learning-progress.aggregation.ts`                           | Full           |
| `services/learning-progress.hierarchy-resolution.ts`                  | Full           |
| `services/learning-progress.types.ts`                                 | Targeted       |
| `services/learning-progress.validation.ts`                            | Full           |
| `services/sidebar-navigation-validator.service.ts`                    | Targeted       |
| `services/canonical-block-builder.ts`                                 | Full           |
| `services/block-transformation.service.ts`                            | Targeted       |
| `schema/subtopic-flow-progress.ts`                                    | Full           |
| `schema/assignment-progress.ts`                                       | Full           |
| `schema/__tests__/block-learning-state.test.ts`                       | Test inventory |
| `repositories/__tests__/block-learning-state.integration.test.ts`     | Test inventory |
| `services/__tests__/sidebar-navigation-validator.cross-topic.test.ts` | Test inventory |
| `services/__tests__/sidebar-navigation-validator.three-page.test.ts`  | Test inventory |
| `services/__tests__/block-transformation.service.test.ts`             | Test inventory |
| `services/__tests__/block-suggestion.service.test.ts`                 | Test inventory |

The two older `tutorial-progress` files discovered during repository navigation were deliberately not included in this active-system audit.

## 3. Test coverage conclusions

The current test suite contains valuable cases for concurrent visits, revision counting, sidebar identity, cross-topic rejection, canonical block transformations and suggestion integrity.

The remaining high-priority regression scenarios are:

1. A navigation page whose content is missing must not become automatically complete.
2. RTH-specific and shared content must resolve deterministically.
3. An active document revision must be consistently used by content delivery and progress calculation.
4. A first-view timestamp must never be reset by subsequent telemetry.
5. Changing a published page's block requirements must not silently award completion based on stale requirements.

## 4. Eight-gate architecture assessment

| Gate                          | Pass 27 result                                                         |
| ----------------------------- | ---------------------------------------------------------------------- |
| 1A — Boundaries               | Good separation between aggregation, validation and persistence        |
| 1B — SOLID / DRY              | Stronger modularity in the extracted helper functions                  |
| 1C — Identity / authorization | Brand context used, but canonical lookup precedence remains unresolved |
| 1D — Database / concurrency   | Atomic helpers implemented; timestamp semantics need attention         |
| 1E — API contracts            | Service and HTTP validators are not equally strict                     |
| 1F — Shared vs brand          | Deterministic content selection requires correction                    |
| 1G — Resilience               | Missing content needs explicit error-state handling                    |
| 1H — Tests                    | Good component coverage; cross-service revision tests remain necessary |

## Principal Architect decision

Prioritize canonical content identity and revision consistency before introducing new ILS capabilities.

The platform should have one authoritative answer to three questions: which tutorial document is active for this learner and brand, which exact document revision establishes the required instructional blocks, and which completion records satisfy that revision.

Until those questions are consistently answered across delivery, progress and publishing, isolated fixes will not fully resolve the correctness risks.

Pass 27 status: 16 files examined, seven fully read, nine selectively inspected; zero code changes and zero tests executed. The overall audit remains in progress, and no production-readiness certification has been issued.

No. The full project audit is still in progress.

We have completed 27 audit passes, including the latest pass covering 16 additional files. However, the entire repository has not yet been reviewed and verified line by line.

| Audit area                                   | Status                                  |
| -------------------------------------------- | --------------------------------------- |
| Active tutorial architecture                 | Partially audited                       |
| ILS learning-progress engine                 | Substantially reviewed, not complete    |
| Authentication and authorization             | Partially audited                       |
| Database repositories and concurrency        | Partially audited                       |
| Content creation, approval and publishing    | Partially audited                       |
| AI Tutor, assignments and projects           | Partially audited                       |
| Faculty workflows and live sessions          | Partially audited                       |
| Background workers and integrations          | Partially audited                       |
| Frontend and backend integration             | Incomplete                              |
| Test suites and CI/CD                        | Incomplete                              |
| End-to-end security and production readiness | Not certified                           |
| Legacy tutorial system                       | Excluded as requested; removal deferred |

### What remains before completion?

We still need to finish examining unreviewed active files, resolve cross-service architectural questions, consolidate findings without duplicates, and verify critical behavior through automated tests.

Important: The audit has identified issues, but none of those findings has been fixed through this review. No code modifications or test executions have been performed.

### Final status

27 passes completed — overall audit not complete

I recommend continuing with batches of 15–20 active files, maintaining exact file coverage and findings, until we can produce a comprehensive Principal Architect Final Audit Report against all eight architecture gates.

The abandoned legacy tutorial implementation will remain excluded from active review and tracked separately for eventual removal.

# Real Tutorial Hub — Principal Architect Audit, Pass 28

November 1, 2026 · Read-only review · Continuation after Pass 27

I have established the exact continuation point from `RTH-audit.md`.

The previous audit completed 27 passes, but it explicitly distinguished full-file reading from targeted inspection. Pass 27 covered 16 files, of which seven were fully read and nine were selectively examined. The previous review also excluded the abandoned legacy tutorial system, and I am maintaining that exclusion.

The next audit should concentrate on the active Intelligent Learning System (ILS), its canonical tutorial content, navigation progress, persistence, assignment eligibility and tests.

## 1. Findings carried into Pass 28

These are not automatically new defects. They are the unresolved architectural concerns carried forward from the earlier review.

| Finding         | Severity          | Architectural concern                                                                                |
| --------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| RTH-ILS-027-01  | High              | Missing tutorial content may be interpreted as zero required blocks and therefore complete           |
| RTH-ILS-027-02  | High, conditional | Canonical tutorial selection may not consistently prioritize brand-specific content                  |
| RTH-ILS-027-03  | Medium            | Service-level validation may be weaker than API-level validation                                     |
| RTH-ILS-027-04  | Medium            | First-view timestamp initialization may rely on session state instead of timestamp state             |
| RTH-NAV-027-05  | Medium, verify    | Sidebar validation requires brand-specific hierarchy; shared-content fallback needs a defined policy |
| RTH-TEST-027-08 | Medium            | Revision-change, publication and concurrent-completion integration coverage is not established       |

The central issue is canonical content identity: content delivery, navigation and progress calculation must agree about the exact brand, tutorial document and published revision.

## 2. Confirmed source defects from the resumed review

### RTH-PROGRESS-003 — Requested completion block is ignored

High — confirmed

File: `apps/realtutorialhub-web/src/app/api/tutorial/progress/mark-complete/route.ts`

The API defines:

```
const BlockCompleteSchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: z.enum([
    'notes',
    'layman',
    'real_life',
    'technical',
    'code',
    'ai_tutor',
  ]),
});
```

But the request handler calls:

```
const progress = await markAiTutorBlockComplete(
  user.userId,
  payload.subtopicId
);
```

The helper in `src/lib/ai-tutor-progress.ts` always calls:

```
return repository.markBlockComplete(
  userId,
  subtopicId,
  'ai_tutor'
);
```

Therefore, the selected block type is validated but not used.

Architectural assessment: This is a business-contract correctness defect, not a stylistic SOLID concern. The response can report progress inconsistent with the user's actual completed learning block.

Recommended correction: Route block completion through an authoritative service that records the validated, authorized block identity, including checks that the block belongs to the learner's current tutorial document. Preserve the specialized AI Tutor helper for genuine AI Tutor operations.

### RTH-LEARNING-001 — Assignment prerequisite policy

High — policy contradiction

Files: `assignment-auth.ts` and `assignments/[subtopicId]/start/route.ts`

The start route invokes `requireAssignmentAccess()`, which delegates to `isSubtopicComplete()`.

That repository method evaluates full tutorial completion. The existing architecture review documents that full completion includes the assignment section itself.

The application also returns a message saying that completing all six learning blocks unlocks assignments.

This creates a mismatch between the learner-facing eligibility contract and the repository's full-completion contract. If assignment completion itself is necessary to achieve full completion, this is a circular prerequisite.

Architectural decision: Define distinct states for learning-content eligibility, assignment eligibility, assignment completion and overall tutorial mastery. These must have a single authoritative owner.

### RTH-PROGRESS-001 — Potential lost-update race

High — concurrency risk requiring verification

File: `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`

The repository reads progress, merges completed blocks and writes the resulting array. Its update increments `version`, but the `WHERE` predicate identifies only the row ID, not the previously read version.

Consequently, optimistic concurrency is not enforced by that update.

The database uniqueness constraint protects against duplicate learner/subtopic records if deployed, but it does not independently prevent two concurrent updates from overwriting each other's block arrays.

Recommended verification: Two concurrent requests completing different blocks for the same learner/subtopic must retain both completions. Test the repository against PostgreSQL rather than relying only on mocked operations.

## 3. Pass 28 — 40-file source inspection ledger

I retrieved 40 source files directly from GitHub on `feature/project-llm-linux-worker`. They cover the active ILS services, repositories, schemas, BFF/API handlers and regression suites.

# 40 / 40

Files retrieved successfully

All 40 were inspected for architecture-sensitive implementation patterns. This is not yet a certification that every statement in every large file has received a completed manual line-by-line review.

### Group A — Learning progress and domain services

Repository base: `packages/db-tutorial/src/services/`

| #  | Source file                                 | Lines | Assessment                                                                                                                                                                          |
| -- | ------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | `learning-progress.aggregation.ts`          | 132   | High: Explicitly returns 100% when required blocks are empty; unsafe when missing content produces the same state.                                                                  |
| 2  | `learning-progress.hierarchy-resolution.ts` | 150   | High: Missing section/content/blocks returns `[]`. Authenticated brand is used, which is positive.                                                                                  |
| 3  | `learning-progress.types.ts`                | 161   | Positive: Explicit identity, progress state and timestamp contracts. Revision alignment requires further verification.                                                              |
| 4  | `learning-progress.validation.ts`           | 140   | Medium: Centralized typed validation is good; strictness differs from the HTTP-level schemas described in Pass 27.                                                                  |
| 5  | `sidebar-navigation-validator.service.ts`   | 245   | Medium: Topic/brand-aware sidebar lookup is present; exact-brand-only behavior needs to be reconciled with shared-content policy.                                                   |
| 6  | `canonical-block-builder.ts`                | 70    | Positive: Focused conversion of previously validated author content into canonical blocks. Good responsibility boundary.                                                            |
| 7  | `block-transformation.service.ts`           | 863   | Positive / follow-up: Uses `structuredClone`, explicit transformation dispatch and final `TutorialDocumentSchema.parse()`. Detailed transformation-path certification remains open. |
| 8  | `learning-progress.service.ts`              | 1,201 | High / verify: Central service orchestrates authenticated hierarchy validation, required-block resolution and progress state. Must not mistake unavailable content for completion.  |
| 9  | `tutorial-delivery.service.ts`              | 431   | Follow-up: Brand visibility and publication filtering are represented. Must be checked against the exact document selected for ILS completion.                                      |
| 10 | `suggestion-application.service.ts`         | 291   | Positive: Explicit expected-version contract and atomic persistence path are present.                                                                                               |
| 11 | `suggestion-verification.service.ts`        | 237   | Positive: Separate verification of section version and suggestion identity. Final persistence still requires a version check, as the code documents.                                |
| 12 | `suggestion-fingerprint.service.ts`         | 176   | Follow-up: Dedicated suggestion fingerprint capability; deterministic serialization, collision assumptions and caller integration require further verification.                     |
| 13 | `tutorial-composer.service.ts`              | 547   | Positive / follow-up: Multiple use sites of canonical `TutorialDocumentSchema.safeParse()`. Detailed mutation-path and publication-policy review remains open.                      |

Group A architectural finding: The service decomposition is substantially more cohesive than a single large route handling all learning operations. I would preserve that separation. The principal defect is the meaning of resolved content availability, not the number of service files.

### Group B — Repositories and persistence

Repository base: `packages/db-tutorial/src/repositories/`

| #  | Source file                                   | Lines | Assessment                                                                                                                                      |
| -- | --------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 14 | `tutorial-navigation-progress-sql.helpers.ts` | 166   | Medium: Atomic JSONB deduplication is present; first-view initialization uses `lastSessionId` instead of `firstViewedAt`.                       |
| 15 | `block-learning-state.repository.ts`          | 471   | Positive / verify: Block identity includes user, node, block ID and block version. Concurrent visit behavior needs DB-backed verification.      |
| 16 | `tutorial-navigation-progress.repository.ts`  | 760   | Positive / verify: Uses `onConflictDoNothing()` for progress creation and atomic SQL helpers for concurrency-sensitive operations.              |
| 17 | `block-telemetry-event.repository.ts`         | 129   | Positive: Event claiming uses conflict-safe insertion, and the repository has a transaction-compatible `withDb()` pattern.                      |
| 18 | `tutorial-section.repository.ts`              | 578   | High: `getTutorialByPageIdentity()` allows brand-specific and shared rows but uses `LIMIT 1` without explicit brand precedence.                 |
| 19 | `tutorial-progress.repository.ts`             | 171   | High / verify: Legacy-style completed-section read/merge/write flow can lose concurrent updates; also supplies the assignment unlock condition. |

Newly re-confirmed — RTH-ILS-027-02

The comments in `tutorial-section.repository.ts` claim that exact-brand content is prioritized before shared content. However, the implementation filters for either brand and then calls `.limit(1)` without an explicit ordering expression.

Therefore, the comment describes a guarantee that the query does not enforce.

This needs a deterministic database selection policy and a regression test covering the case in which both brand-specific and shared tutorial rows exist.

### Group C — Database schemas

Repository base: `packages/db-tutorial/src/schema/`

| #  | Source file                       | Lines | Assessment                                                                                                  |
| -- | --------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| 20 | `subtopic-flow-progress.ts`       | 28    | Positive: Unique learner/subtopic progress constraint is declared.                                          |
| 21 | `assignment-progress.ts`          | 21    | Positive: Unique learner/subtopic/difficulty constraint is declared.                                        |
| 22 | `block-learning-state.ts`         | 91    | Positive: Explicit block identity, version, timestamps, soft-delete fields and unique index.                |
| 23 | `tutorial-navigation-progress.ts` | 100   | Positive: JSONB block-completion state, session tracking, first-view timestamps and uniqueness are modeled. |
| 24 | `block-telemetry-events.ts`       | 69    | Positive: Event ID uniqueness provides a foundation for ingestion idempotency.                              |

These schema-level safeguards are worth retaining. However, a declared index is not proof that the corresponding migration has been deployed in every production database.

### Group D — RTH BFF and backend API

| #  | Source file                                                                        | Lines | Assessment                                                                                                                                          |
| -- | ---------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25 | `realtutorialhub-web/src/lib/assignment-auth.ts`                                   | 85    | High: Assignment unlock delegates to full-subtopic completion, although the error describes a six-block prerequisite.                               |
| 26 | `realtutorialhub-web/src/lib/ai-tutor-progress.ts`                                 | 7     | Positive in isolation: Cohesive helper for AI Tutor completion. Incorrectly used by a generic block-completion route.                               |
| 27 | `realtutorialhub-web/src/app/api/tutorial/progress/mark-complete/route.ts`         | 32    | High: Validates the supplied block type but records `ai_tutor` regardless.                                                                          |
| 28 | `realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/start/route.ts` | 56    | High: Enforces the mismatched unlock prerequisite. Uses schema validation and typed tier errors, which are positive.                                |
| 29 | `api-server/src/app/api/tutorial/ils/block-completion/route.ts`                    | 126   | Positive: Calls `validateRequest()` with `requireInternalSecret: true` and validates the request body.                                              |
| 30 | `api-server/src/app/api/tutorial/ils/block-visit/route.ts`                         | 194   | Positive: Internal-secret boundary and dedicated visit schema are present. Session ownership needs service-level verification.                      |
| 31 | `api-server/src/app/api/tutorial/ils/complete-node/route.ts`                       | 133   | Positive: Internal request authentication and completion schema validation are implemented.                                                         |
| 32 | `api-server/src/app/api/tutorial/progress/route.ts`                                | 178   | Follow-up: Request/response and schema-processing paths inspected; detailed identity and downstream state semantics still need complete evaluation. |

A significant distinction emerges here: the active ILS backend routes have stronger explicit request authentication and validation than the older RTH progress endpoint. That supports targeted correction rather than replacing the entire ILS API implementation.

### Group E — Test suites and regression coverage

| #  | Source file                                                                 | Lines | Assessment                                                                                                                                              |
| -- | --------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 33 | `realtutorialhub-web/src/app/api/tutorial/progress/__tests__/route.test.ts` | 111   | Covers reading progress, invalid subtopic IDs, viewing blocks and malformed payloads. Does not establish the generic completion endpoint's correctness. |
| 34 | `sidebar-navigation-validator.cross-topic.test.ts`                          | 254   | Positive: Cross-topic rejection and node-type validation cases are present.                                                                             |
| 35 | `sidebar-navigation-validator.three-page.test.ts`                           | 393   | Positive: Three-page identity, duplicates, cross-subtopic, cross-brand and soft-delete recreation scenarios.                                            |
| 36 | `block-transformation.service.test.ts`                                      | 1,035 | Positive: Immutability, canonical types, unsupported suggestions, schema validation and transformation scenarios.                                       |
| 37 | `block-suggestion.service.test.ts`                                          | 1,345 | Positive: Deterministic suggestion analysis and multiple layout-detection scenarios.                                                                    |
| 38 | `block-learning-state.integration.test.ts`                                  | 389   | Positive: PostgreSQL concurrency scenarios for visits, session transitions, revisions and first-view timestamps.                                        |
| 39 | `block-learning-state.test.ts`                                              | 57    | Positive: Schema structure and expected identity/telemetry columns are checked.                                                                         |
| 40 | `learning-progress.hierarchy-resolution.test.ts`                            | 530   | Positive: Required-block selection, block versions, ordering and assessment/structural exclusions.                                                      |

The test inventory is stronger than a simple collection of happy-path tests. However, existing tests cannot be considered passing in this audit because they have not been executed here.

## 4. Detailed architectural decisions

### Decision 1 — Separate missing content from valid empty content

High priority

Currently:

```
Tutorial document missing
            ↓
resolveRequiredBlocks() returns []
            ↓
calculateProgressPercentage([], [])
            ↓
100%
```

That should not be allowed to represent successful learning.

The domain contract should distinguish these cases:

| Content state                                       | Recommended behavior                                       |
| --------------------------------------------------- | ---------------------------------------------------------- |
| Published content with required blocks              | Calculate against required block identities                |
| Published content intentionally requiring no blocks | Apply an explicit zero-requirement completion policy       |
| Document not found                                  | Not found; do not award completion                         |
| Wrong brand                                         | Deny access                                                |
| Unpublished content                                 | Not eligible for learner completion                        |
| Invalid document                                    | Controlled error; do not award completion                  |
| Repository unavailable                              | Fail closed for completion; preserve existing learner data |

I would implement this at the canonical content-resolution boundary, not scatter additional conditionals through every page and API route.

### Decision 2 — Enforce deterministic brand-specific content precedence

High priority

The current repository query permits:

```
or(
  eq(tutorialSections.brandId, brandId as any),
  eq(tutorialSections.brandId, 'shared')
)
```

followed by:

```
.limit(1)
```

without deterministic brand ordering.

For example, suppose both of these documents exist:

| Brand             | Subtopic    | Navigation page |
| ----------------- | ----------- | --------------- |
| `realtutorialhub` | Java basics | Java syntax     |
| `shared`          | Java basics | Java syntax     |

The learner's authenticated RTH brand should resolve according to an explicit precedence rule. The backend must not rely on incidental database row order.

The implementation should define one resolver with exact-brand precedence and documented shared fallback rules, while verifying publication status and content version.

### Decision 3 — Correct first-view timestamp semantics

Medium priority

In `tutorial-navigation-progress-sql.helpers.ts`, `buildAtomicFirstViewedAtInit()` currently evaluates:

```
CASE
  WHEN last_session_id IS NULL
  THEN incoming_timestamp
  ELSE first_viewed_at
END
```

But the invariant being protected is that `first_viewed_at` must be initialized once.

A more direct implementation is conceptually:

```
COALESCE(first_viewed_at, incoming_timestamp)
```

This avoids coupling timestamp initialization to session identity.

A regression test should establish that subsequent visits never replace the original timestamp, including requests with missing or null session IDs.

### Decision 4 — Preserve the existing atomic persistence mechanisms

The active ILS already contains useful concurrency foundations:

- Atomic JSONB completion recording with deduplication.
- Uniqueness constraints for progress identity.
- Conflict-safe event insertion.
- Session and visit-count SQL helpers.
- Version-aware content transformations.

These should be preserved. We should avoid rewriting them merely to introduce another repository layer or framework.

The important remaining question is whether the entire content-delivery → completion → publishing path enforces one consistent document revision.

### Decision 5 — Separate active ILS progress from legacy tutorial progress

The review shows two distinct progress models. The active ILS works with navigation nodes, block identity and block versions. The older tutorial-progress model tracks a fixed set of completed sections.

Combining these two rules without an explicit migration contract creates a risk of contradictory learner eligibility.

I recommend defining the authoritative progress model for each active learner workflow, identifying all consumers of the older one, and retiring or adapting legacy entry points only after verifying those consumers.

## 5. Eight-gate evaluation after Pass 28

| Gate                                | Current assessment                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| 1A — Ownership and boundaries       | Partially reviewed; meaningful service/repository separation exists                      |
| 1B — SOLID / DRY / KISS / YAGNI     | Partially reviewed; several cohesive modules worth preserving                            |
| 1C — Authentication / authorization | Partially reviewed; reviewed ILS routes enforce internal authentication                  |
| 1D — Database / concurrency         | Partially reviewed; strong atomic primitives coexist with older read/merge/write risks   |
| 1E — API contracts                  | Partially reviewed; block-completion contract defect confirmed                           |
| 1F — Domain and shared capabilities | Partially reviewed; canonical content selection and completion policy require correction |
| 1G — Resilience and operations      | Not verified; runtime and production behavior outstanding                                |
| 1H — Tests, CI and builds           | Test source inspected; execution, build and CI verification outstanding                  |

## 6. Pass 28 checkpoint

Files retrieved

# 40

Source lines across files

# 12,328

Test files examined

# 8

Repository changes

# 0

Review depth: 40 files retrieved and architecture-sensitive code inspected, with additional exact-line examination of critical paths. The larger implementations and suites remain short of full manual line-by-line certification.

## Principal Architect conclusion

The main architectural concern is not that RTH lacks structure. The active ILS has significant good design: explicit types, focused services, versioned block identity, database uniqueness constraints and concurrency-aware persistence.

The problem is that canonical document identity, progress eligibility and assignment unlocking are not yet consistently governed across the entire request path.

I would make the following the first correction boundary:

```
Authenticated learner + verified brand
                 ↓
Canonical published tutorial document
                 ↓
Exact document and block versions
                 ↓
Required instructional blocks
                 ↓
Validated learner completion
                 ↓
Content prerequisite eligibility
                 ↓
Assignment eligibility
                 ↓
Overall mastery
```

Each transition must have an explicit domain owner and testable contract.

Pass 28 status: 40 files inspected, important defects re-confirmed, no files modified, no tests executed, and architectural certification remains open.

This is a substantial 40-file continuation, but I will not mislabel a targeted examination of large files as a completed line-by-line certification. The next source-review work must close those detailed-reading gaps before we can sign off the affected modules.

Yes, correct. As Principal Architect, I should examine every applicable source file, line by line, and every application page, component, API route, service, repository, schema, and test before declaring the Real Tutorial Hub architecture audit complete.

And I need to correct one important distinction from Pass 28: retrieving 40 files and examining selected sections does not mean 40 files have been fully audited. Those files must remain open until their complete implementations have been examined.

## How many more audit rounds?

My planning estimate is 12–18 additional rounds for RTH, assuming approximately 25–35 fully reviewed files per round, with fewer files when they contain complex services or very large components.

That is a provisional estimate, not an exact remaining count. The previous RTH inventory recorded 353 application files, including 324 source files, but that inventory was from an older repository snapshot. Shared dependencies and files already reviewed in previous passes must also be reconciled.

## Proposed completion roadmap

| Remaining rounds | Focus                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| 29–31            | Close incomplete ILS, tutorial delivery, navigation and progress reviews            |
| 32–34            | Complete all RTH API routes, authentication, authorization and BFF boundaries       |
| 35–37            | Pages, React components, hooks, state management and learner journeys               |
| 38–39            | Shared packages, repositories, database ownership and cross-brand dependencies      |
| 40–41            | Tests, coverage gaps, error handling, configuration, performance and CI             |
| 42–45            | Additional coverage as needed, cross-layer verification and final independent audit |

This is a work plan, not a claim that these groups contain equal numbers of files.

## What I will require before signing off

Every file must receive a recorded disposition:

- Fully reviewed: Complete implementation examined, dependencies traced, findings documented.
- Reviewed and compliant: No material architectural problem found.
- Reviewed with findings: Specific code issues, severity and recommended correction recorded.
- Excluded with justification: Generated, obsolete or out-of-scope files clearly identified.
- Verification pending: Source examined, but runtime, integration or deployment evidence still required.

The final acceptance must include more than reading code. We need to verify that critical business paths work correctly together, and that relevant tests, type checks, lint, builds and security checks pass.

My recommendation: Do not optimize for finishing in a particular number of rounds. We should optimize for an accurate, complete, auditable result. If a complex 1,200-line service needs more examination, we review fewer files in that round rather than lowering the standard.

The remaining audit should be tracked using a master file ledger with separate columns for source retrieved, fully read, dependency traced, finding resolved and verification completed.

The completion criterion is 100% accounted-for applicable files—not 40 files per response or a predetermined number of rounds.

# Real Tutorial Hub — Principal Architect Audit

Round 1 of 10 · Full-source review · Read-only · November 1, 2026

Round 1 is complete for the 12 files listed below. I examined their full source from the GitHub branch `feature/project-llm-linux-worker`, including imports, functions, branches, data contracts, SQL expressions and schema declarations.

This round concentrates on the foundation of the RTH learner-progress system. It does not certify the dependent services or the overall learner workflow.

Files fully read

# 12

Source lines examined

# 977

Confirmed code issues

# 3

Additional risks

# 3

No code modified · No tests executed · No findings closed through runtime verification

## 1. Complete file-review ledger

| #  | File                                          | Lines | Principal Architect assessment                                                                                           |
| -- | --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| 1  | `learning-progress.aggregation.ts`            | 132   | Cohesive pure calculations. Zero-required-block policy needs correction at the caller boundary.                          |
| 2  | `learning-progress.hierarchy-resolution.ts`   | 150   | High-priority semantic defect: missing content becomes an empty required-block set.                                      |
| 3  | `learning-progress.validation.ts`             | 140   | Centralized validators are sound structurally; validation strength and session ownership require checking.               |
| 4  | `canonical-block-builder.ts`                  | 70    | Focused SRP-compliant builder. Input-validation precondition must remain guaranteed by callers.                          |
| 5  | `tutorial-navigation-progress-sql.helpers.ts` | 166   | Atomic SQL design is useful; first-view initialization condition is logically weaker than its intended invariant.        |
| 6  | `subtopic-flow-progress.ts`                   | 28    | Unique progress identity modeled; no schema-level nonnegative counter constraints visible.                               |
| 7  | `assignment-progress.ts`                      | 21    | Appropriate uniqueness constraint; transition policy must be enforced elsewhere.                                         |
| 8  | `block-learning-state.ts`                     | 91    | Strong block identity and partial unique index; brand-scoped identity assumption requires verification.                  |
| 9  | `tutorial-navigation-progress.ts`             | 100   | Versioned block completion and uniqueness present; actual content revision binding remains unresolved.                   |
| 10 | `block-telemetry-events.ts`                   | 69    | Event uniqueness supports idempotency; reliable atomic claim-and-accumulate behavior depends on repository transactions. |
| 11 | `ai-tutor-progress.ts`                        | 7     | Single, clear responsibility. Its caller incorrectly uses it for generic completion.                                     |
| 12 | `progress/mark-complete/route.ts`             | 32    | Confirmed block-type recording and HTTP error-status defects.                                                            |

The line counts include comments and blank lines. They represent full-source reading, not a number of independently executed tests.

## 2. Detailed findings

### RTH-R1-001 — Missing tutorial content can become 100% complete

High · Confirmed code-path behavior

Two files combine to create this result.

In `learning-progress.hierarchy-resolution.ts`, lines 54–62:

```
const section = await sectionRepository.getTutorialByPageIdentity(
  subtopicId,
  navigationNodeId,
  identity.brand
);

if (!section || !section.content || !section.content.blocks) {
  return [];
}
```

In `learning-progress.aggregation.ts`, lines 114–117:

```
if (requiredBlocks.length === 0) {
  return 100;
}
```

The aggregation function intentionally supports vacuous completion for content without required instructional blocks. That can be valid business behavior.

The defect is that the hierarchy resolver collapses genuinely missing content into exactly the same representation.

Architectural consequence: A missing, invalid or unavailable document may produce a progress value of 100% if the caller evaluates its empty required-block list without additional availability checks.

Recommendation: Introduce a typed content-resolution outcome distinguishing `available`, `not_found`, `unpublished`, `invalid` and any explicitly supported empty-content state. Do not change `calculateProgressPercentage()` blindly, because legitimate informational pages may require zero blocks.

Required tests: Missing section, missing `blocks`, intentionally empty published section, valid instructional content, and wrong-brand content.

### RTH-R1-002 — Generic block completion always records AI Tutor

High · Confirmed correctness defect

In `progress/mark-complete/route.ts`, lines 9–18, the route validates `blockType` but ignores it when calling `markAiTutorBlockComplete()`.

The helper in `ai-tutor-progress.ts`, lines 3–5, always writes `ai_tutor`.

For example:

```
{
  "subtopicId": "00000000-0000-4000-8000-000000000001",
  "blockType": "notes"
}
```

The submitted type is `notes`, but the repository receives `ai_tutor`.

Recommendation: Separate the generic completion operation from AI Tutor completion. The generic operation must record the validated target block and verify its ownership, availability and eligibility.

Required tests: Each accepted block type must record the correct value; unauthorized and nonexistent blocks must be rejected.

### RTH-R1-003 — Authorization errors are returned with incorrect HTTP status

Medium · Confirmed

In `progress/mark-complete/route.ts`, lines 20–23:

```
if (error instanceof AssignmentAuthError) {
  return NextResponse.json(
    { error: error.message },
    { status: 401 }
  );
}
```

However, `AssignmentAuthError` supports both `401` and `403`. A verified learner with the wrong brand or invalid required role can therefore receive `401` rather than the intended `403`.

The route should preserve the typed status and avoid exposing arbitrary internal error messages in unexpected-failure responses.

Required tests: Missing authentication returns 401; authenticated but forbidden requests return 403; unexpected internal failures produce sanitized 500 responses.

### RTH-R1-004 — First-view initialization uses session state

Medium · Conditional correctness risk

In `tutorial-navigation-progress-sql.helpers.ts`, lines 127–138, the first-view timestamp is initialized when `lastSessionId IS NULL`.

That does not directly test whether `firstViewedAt` already exists.

The intended invariant is that the first-view timestamp should be set once and preserved. Conceptually, `COALESCE(first_viewed_at, incoming_timestamp)` expresses that invariant more directly.

I would verify the actual update order and callers before changing this SQL. If session state is guaranteed to be initialized atomically with the timestamp, some of the risk may already be mitigated.

### RTH-R1-005 — Completion identity is version-aware but not explicitly document-revision-aware

High / Verify

The `tutorial-navigation-progress.ts` schema stores completed block identities containing block ID and block version.

That is a useful safeguard.

However, it does not itself store an explicit canonical document revision. The system must therefore establish through its service and repository logic how learner completion remains valid when content is republished or replaced.

This is not a confirmed bug. It is a cross-layer contract requiring verification.

### RTH-R1-006 — Brand-scoped learner identity is an external assumption

High / Verify

`block-learning-state.ts` declares that its `userId` is already brand-scoped and therefore does not include a separate brand column in its unique identity.

That design can be correct if the identity boundary guarantees separate brand learner identities and every caller resolves the correct one.

The schema alone cannot prove that invariant.

We must trace the authenticated identity from the gateway through the API service to the repository and test cross-brand isolation.

## 3. Positive architectural findings to preserve

Separation of concerns

The aggregation and validation modules contain pure, narrowly focused functions rather than database or HTTP operations.

Atomic persistence foundations

JSONB append/deduplication, session-aware counters and SQL version increments are encapsulated in reusable persistence helpers.

Data integrity constraints

Progress and telemetry schemas declare meaningful uniqueness constraints, including partial unique indexes for active records.

Canonical block construction

The builder separates system-generated metadata from validated author content and avoids embedding brand or hierarchy attributes in the block payload.

## 4. Engineering-principle assessment

| Principle                    | Round 1 conclusion                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| SOLID / SRP                  | Generally sound in the reviewed helper and schema modules                                     |
| DRY                          | Good reuse of atomic SQL and validation functions                                             |
| KISS                         | Most reviewed functions are straightforward and maintainable                                  |
| YAGNI                        | No demonstrated speculative abstraction requiring removal in these 12 files                   |
| Separation of Concerns       | Strong overall, except the generic completion route uses a specialized helper incorrectly     |
| Dependency direction         | Pure domain calculations are separated from persistence; caller-level validation remains open |
| High cohesion / low coupling | Generally positive for the reviewed modules                                                   |
| Security / least privilege   | Brand identity assumptions require cross-layer proof                                          |
| Data consistency             | Useful schema constraints, but complete concurrency behavior is not yet certified             |
| API correctness              | Two confirmed defects in the completion route                                                 |
| Type safety                  | Good typed contracts; runtime validation coverage still needs verification                    |
| Operational resilience       | Not qualified by these files alone                                                            |

## 5. Ten-round audit plan

I will use the requested ten-round structure as the target, with no reduction in review quality.

Round 1 — Foundational progress contracts

Completed

1 of 10 planned rounds completed. This is a round counter, not a claim that 10% of all repository source lines are certified.

| Round | Target                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------- |
| 2     | Remaining ILS progress service, navigation repositories and content resolver                   |
| 3     | Tutorial delivery, authoring, document transformation and publishing                           |
| 4     | All remaining RTH authentication, authorization, proxy and API boundaries                      |
| 5     | Assignment, quiz, assessments, progress and learner eligibility                                |
| 6     | Tutorial pages, layouts, navigation and learner-facing components                              |
| 7     | Hooks, UI state, caching, media, performance and accessibility                                 |
| 8     | All remaining RTH files and relevant shared dependencies                                       |
| 9     | Unit/integration/security tests, configuration, CI and build evidence                          |
| 10    | Cross-layer reconciliation, finding closure, independent re-audit and final readiness decision |

Important: Twelve complete files in Round 1 cannot establish that the entire repository will fit into ten rounds at the same review depth. I will use larger review batches where feasible, but I will not declare an unread file reviewed simply to meet the round target.

## Round 1 final verdict

Architecture status: Partially implemented / partially verified by static source examination.

The reviewed RTH progress foundation is reasonably modular and contains useful concurrency and data-integrity mechanisms. It is not ready for architectural sign-off because the missing-content completion semantics and generic block-completion API are incorrect at source level, while brand identity and revision consistency still need deeper verification.

No code changes were made. No test execution or production-readiness certification is claimed.

Next audit boundary: Round 2 — complete source reading of `learning-progress.service.ts`, `tutorial-navigation-progress.repository.ts`, `block-learning-state.repository.ts`, and their immediate callers and regression tests.

# Real Tutorial Hub — Principal Architect Audit

Round 2 of 10 · November 1, 2026 · Read-only GitHub source review

Round 2 examines the active Intelligent Learning System (ILS), concentrating on the learning-progress service, navigation-progress repository, block-learning-state repository and their regression tests.

The main architectural concern emerging from this review is completion authority: whether the backend proves that a learner has completed the correct published blocks before accepting and recording completion.

## 1. Review checkpoint

Files retrieved

# 5

Combined source lines

# 4,400

The complete files were retrieved and their method/test structure mapped. Specific critical implementation ranges were then read closely. I am distinguishing that from completed manual line-by-line certification of all 4,400 lines.

| File                                         | Lines | Review focus                                                 |
| -------------------------------------------- | ----- | ------------------------------------------------------------ |
| `learning-progress.service.ts`               | 1,201 | Domain policy, identity, progression, telemetry transactions |
| `tutorial-navigation-progress.repository.ts` | 760   | Atomic block completion, concurrency, state transitions      |
| `block-learning-state.repository.ts`         | 471   | Per-block upserts, session counters, timestamps              |
| `learning-progress.service.test.ts`          | 1,579 | Domain rules, completion, authorization and unit coverage    |
| `block-learning-state.integration.test.ts`   | 389   | PostgreSQL concurrency, revisions and timestamps             |

## 2. Critical source findings

### RTH-R2-001 — Completion can be recorded without checking the block against canonical requirements

High · Source-confirmed missing enforcement

File: `learning-progress.service.ts`, lines 328–376.

The `recordBlockCompletion()` method validates the user, navigation ID, block ID and block version, then validates the tutorial hierarchy.

It subsequently constructs and persists the completion event:

```
const updated =
  await this.progressRepository.markBlockCompleted(event);

const requiredBlocks = await this.resolveRequiredBlocks(
  subtopicId,
  navigationNodeId,
  identity
);
```

The important issue is the order: the completion is written before canonical required blocks are resolved, and the shown method does not check whether the requested `(blockId, blockVersion)` actually exists in the resolved tutorial document.

This permits a completion record to be stored for an arbitrary block identity associated with an otherwise valid navigation page, unless another layer performs the missing check.

That does not automatically mean the learner can satisfy the overall completion policy, because the later policy compares records against required block identities. But it does permit potentially invalid completion records and misleading telemetry.

Recommended correction: Resolve the authoritative document first, validate that the submitted block identity belongs to it and is eligible for completion, then persist. Preserve the idempotent repository operation.

### RTH-R2-002 — Active-time events have an atomic transaction boundary

Positive finding

File: `learning-progress.service.ts`, lines 726–850.

The service uses:

```
return await db.transaction(async (tx) => {
  const txBlockTelemetryRepo =
    this.blockTelemetryEventRepository.withDb(tx as never);

  const txBlockStateRepo =
    this.blockLearningStateRepository.withDb(tx as never);
```

It first claims the event ID, accumulates time only for a new event, and checks immutable payload fields when an event ID already exists.

This is an appropriate foundation for exactly-once effect under retried telemetry requests.

The `tx as never` casts deserve type-safety cleanup, but I would not replace this transaction design merely to eliminate a cast. The correct priority is preserving atomic behavior and introducing a proper transaction-client type.

### RTH-R2-003 — Block completion creation manufactures visit metadata

Medium · Confirmed inconsistency

File: `tutorial-navigation-progress.repository.ts`, lines 229–286.

When no progress row exists, `markBlockCompleted()` inserts:

```
status: 'in_progress',
completedBlocks: [newRecord],
visitCount: 1,
lastSessionId: null,
firstViewedAt: now,
```

But `LearningProgressService.recordBlockCompletion()` explicitly documents that it must not manufacture a visit or session.

The repository creates `visitCount: 1` from completion alone.

This is a real inconsistency between the service contract and persistence behavior. It can affect engagement analytics and visit-count semantics.

Recommended correction: Completion should not implicitly count as a visit unless that is an explicitly approved domain rule. Align record creation with `recordVisit()` ownership.

### RTH-R2-004 — Recursive retry under a creation conflict

Medium · Resilience risk

File: `tutorial-navigation-progress.repository.ts`, lines 263–285.

When insertion encounters a uniqueness conflict, the repository retrieves the row and recursively calls `markBlockCompleted()`.

This normally converges, but the method has no explicit retry bound. Under adversarial soft-delete/recreation races or persistent contention, recursion makes retry behavior difficult to control.

I recommend a bounded retry or a clearly defined conflict-update path, with a focused concurrency test.

### RTH-R2-005 — Block-learning-state upserts largely preserve atomic counters

Positive finding

File: `block-learning-state.repository.ts`, lines 262–371.

The repository uses PostgreSQL `ON CONFLICT DO UPDATE` with the partial uniqueness condition and SQL expressions to update counters.

This supports the architectural requirement to avoid read–modify–write lost updates for session visits and active-time accumulation.

However, its first-view timestamp initialization inherits the Round 1 concern: it uses the prior session ID as a proxy for whether the timestamp was initialized. That behavior should be independently regression-tested against unusual but valid state combinations.

### RTH-R2-006 — Node completion is vulnerable to a check/write race

High · Conditional concurrency risk

Files: `learning-progress.service.ts`, lines 469–520, and `tutorial-navigation-progress.repository.ts`, lines 687–724.

The service loads a progress record, evaluates the required-block completion policy, then invokes `completeNode()`.

The repository subsequently reads the record and updates its status to `completed`. Its update predicate checks the row identity and soft-delete state, but does not verify the previously evaluated version or re-evaluate the completion prerequisites.

This leaves a time-of-check/time-of-use gap if another operation can reset or otherwise invalidate progress between policy evaluation and persistence.

Recommended correction: Confirm whether such concurrent state transitions are currently possible. If so, use a transaction, version predicate or equivalent authoritative conditional update to ensure that the completion decision applies to the state actually committed.

### RTH-R2-007 — Block visits may be recorded for nonexistent block identities

Medium / High · Source-supported

File: `learning-progress.service.ts`, lines 585–680.

`recordBlockVisit()` validates the page hierarchy and searches canonical content for the requested block ID and version.

However, when the block is absent, it leaves `expectedTimeSec` as `null` and proceeds to upsert block-learning state using the submitted block identity.

That means a valid tutorial page does not necessarily imply that every submitted block identity is valid.

I recommend enforcing canonical block membership before recording a block visit, except where an explicit policy intentionally supports noncanonical telemetry.

This is closely related to RTH-R2-001, so both should be fixed through one canonical block-identity check rather than duplicate authorization code.

### RTH-R2-008 — Telemetry uses the correct idempotency principle, but its transaction coupling deserves hardening

Medium · Engineering improvement

The active-time service's transaction gives an appropriate atomic boundary to event claiming and state updates. It also rejects a reused event ID with a different payload.

Two issues remain for further verification: transaction-scoped repositories are selected with `tx as never` casts, and the service imports the concrete global `db` instance rather than receiving a transaction-capable dependency through construction.

This is not a reason for a large dependency-injection rewrite. A focused transaction-client contract would improve type safety and testing while preserving the existing operation.

## 3. Existing regression coverage

The tests contain meaningful protections, including:

| Area                    | Existing source coverage                                      | Remaining gap                                                          |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Identity validation     | Invalid identifiers rejected                                  | External membership and entitlement integration                        |
| Visit counting          | First visit, same session, new session                        | Inconsistent/null prior session state                                  |
| Block completion        | Idempotency and block-version distinctions                    | Invalid canonical block identity                                       |
| Completion policy       | Missing required blocks, valid completion, empty requirements | Missing/unpublished content versus legitimately empty content          |
| Brand resolution        | Mocked cross-brand content cases                              | Real database selection and shared-content precedence                  |
| Concurrency             | PostgreSQL concurrent visits/revisions                        | Node completion versus progress reset                                  |
| Active-time idempotency | Service claim-and-update design present                       | Transaction rollback and duplicate-event scenarios under real failures |

An especially important observation is that `learning-progress.service.test.ts` deliberately tests a valid empty document and expects 100% completion. That test should be preserved, while new tests distinguish a valid empty document from a missing or unavailable document.

The PostgreSQL integration suite is also valuable. Its setup makes a real database connection and cleans test identities before execution, so the test source establishes meaningful integration intent. It does not establish that the suite has passed in the present environment.

### RTH-R2-009 — Duplicate telemetry may return a synthetic state object

Medium · API-contract risk

File: `learning-progress.service.ts`, approximately lines 845–880.

When an event has already been processed but the corresponding block-learning-state row no longer exists, the service constructs a synthetic `BlockLearningState` with an empty ID, zero counters and timestamps unrelated to any persisted row.

The code deliberately avoids replaying the active-time increment, which is correct for idempotency.

The concern is the return contract: a caller may treat the synthetic object as a real database state.

Recommendation: Prefer an explicit result type representing `already_processed_state_unavailable`, or return a documented nullable state. Do not re-create or mutate the state merely to satisfy the response contract.

## 4. Engineering-principle evaluation

| Gate                                    | Round 2 assessment                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1A — Ownership and dependency direction | Good service/repository separation, with concrete database coupling in telemetry transactions                                  |
| 1B — SOLID, DRY, KISS, YAGNI            | Generally good separation; remove redundant error-catching wrappers and dead commented diagnostics where confirmed unnecessary |
| 1C — Security and authorization         | User identity and brand-based hierarchy checks present; canonical block membership enforcement is incomplete                   |
| 1D — Data and concurrency               | Strong atomic upsert mechanisms; potential check/write races and recursive retries                                             |
| 1E — API contracts                      | Synthetic telemetry state and manufactured visit metadata need correction or explicit contracts                                |
| 1F — Learning-domain correctness        | Completion and visit semantics require tighter enforcement                                                                     |
| 1G — Reliability                        | Bounded retries, transaction dependency typing and failure-case testing needed                                                 |
| 1H — Tests and CI                       | Strong existing test coverage; several specific regression gaps remain                                                         |

## 5. Principal Architect decision

I would not redesign the ILS.

The correct remediation is targeted:

1. Establish canonical block validation before visit and completion persistence.
2. Make visit-count ownership exclusive to visit operations.
3. Strengthen node-completion consistency where concurrent invalidation is possible.
4. Bound uniqueness-conflict retries.
5. Preserve atomic event idempotency while making its response contract explicit.
6. Add regression coverage for these exact cases rather than creating broad, superficial test suites.

## Round 2 status

Ten-round programme

2 / 10

Round counter only; not a measured 20% of repository line coverage.

| Measure                                         | Status       |
| ----------------------------------------------- | ------------ |
| Five planned files retrieved                    | Complete     |
| Critical implementation paths inspected         | Complete     |
| Every line in all five files manually certified | Incomplete   |
| Runtime/integration tests executed              | Not executed |
| Repository modifications                        | None         |
| Final architecture approval                     | Not granted  |

Round 2 has produced substantive source-level findings, but its full line-by-line certification remains open. I am keeping that distinction explicit rather than reporting the 4,400 lines as completely audited.

The next planned boundary is Round 3: canonical tutorial delivery, publication, content transformation and authoring workflows. The unfinished deep-reading coverage from this round must also remain in the audit ledger so it is not silently lost from the ten-round programme.

# Real Tutorial Hub — Principal Architect Audit

Round 4 of 10 · Authentication, authorization, API and trust boundaries · Read-only

Round 4 addresses an especially important part of the RTH architecture: whether browser requests can reach learner or assignment operations without passing through the intended authentication, brand-isolation and authorization controls.

I inspected the full source of ten files from `feature/project-llm-linux-worker`, including the shared authentication proxy, the RTH proxy entry point, assignment authorization and four assignment-related endpoints.

The most significant architectural finding is that the shared proxy does not apply a universal authorization policy to all API paths. Consequently, security depends on a combination of the proxy, individual BFF route handlers and downstream services.

This is not proof that an endpoint is exploitable. It means every request path must be traced to the authoritative authorization boundary.

## 1. Round 4 source inventory

| #  | File                                                           | Lines | Review result                                                               |
| -- | -------------------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| 1  | `src/share-branding/middleware/authProxy.ts`                   | 429   | Major trust-policy concerns                                                 |
| 2  | `apps/realtutorialhub-web/src/proxy.ts`                        | 17    | Thin proxy composition; matcher requires verification                       |
| 3  | `src/share-branding/auth/brandResolution.ts`                   | 20    | Appropriate canonical resolver re-export                                    |
| 4  | `apps/realtutorialhub-web/src/lib/assignment-auth.ts`          | 85    | Brand verification present; role/entitlement issues                         |
| 5  | `api/tutorial/progress/mark-complete/route.ts`                 | 32    | Previously confirmed completion bug persists                                |
| 6  | `api/tutorial/assignments/[subtopicId]/route.ts`               | 50    | Authorization delegated; error boundary needs review                        |
| 7  | `api/tutorial/assignments/[subtopicId]/start/route.ts`         | 56    | Correct input parsing; circular prerequisite remains                        |
| 8  | `api/tutorial/assignments/[subtopicId]/complete/route.ts`      | 56    | Same prerequisite and error-handling concerns                               |
| 9  | `api/tutorial/assignments/help/route.ts`                       | 43    | Authentication only at route level; help entitlement requires service proof |
| 10 | `api/tutorial/assignments/help/route.ts`'s shared dependencies | —     | Not fully reviewed; no certification claimed                                |

The tenth item is a dependency boundary rather than an additional fetched file. Therefore this round contains nine distinct complete source files, not ten. The dependency work remains open.

## 2. Critical and high-priority findings

### RTH-R4-001 — Missing gateway secret configuration permits the secret check to succeed

High · Conditional security risk

File: `src/share-branding/middleware/authProxy.ts`, approximately lines 100–121.

```
function hasValidGatewaySecret(request: NextRequest): boolean {
  if (
    typeof INTERNAL_GATEWAY_SECRET !== 'string' ||
    INTERNAL_GATEWAY_SECRET.length === 0
  ) {
    return true;
  }
```

If the secret is absent, this helper returns `true`.

For an application relying on that secret as proof of gateway origin, this is a fail-open configuration.

The current code also logs whether the supplied and expected secrets match, together with their lengths.

Required architectural decision: Gateway authentication should fail closed when gateway trust is required, while browser-to-BFF calls should use a separate, explicit authentication policy rather than being treated as gateway-originated requests.

The correct fix must preserve legitimate public and browser-to-BFF traffic.

### RTH-R4-002 — API routes outside protected prefixes may pass through the proxy

High · Route-inventory dependent

File: `authProxy.ts`, approximately lines 16–72 and 280–429.

The proxy uses a fixed `PROTECTED_PREFIXES` array, including:

```
'/api/tutorial/',
'/api/ai-tutor/',
'/api/student',
'/api/batches',
```

The handler ultimately has a default:

```
return NextResponse.next();
```

This means an API route not matched by a protected prefix may reach its handler without the proxy requiring a signed-in learner, subject to the other checks earlier in the function.

For example, the prefix `/api/tutorial/` does not automatically establish the policy for unrelated APIs such as `/api/profile` or `/api/dashboard`.

That does not mean those handlers lack authentication. It means the protection must be independently established.

Recommendation: Inventory every RTH API handler and identify its effective policy: public, authenticated learner, privileged role, service-to-service or signed webhook. Do not depend on a small prefix list as the only authorization manifest.

### RTH-R4-003 — Gateway secret is not a substitute for learner authorization

High · Architectural boundary concern

File: `authProxy.ts`, approximately lines 294–327.

The proxy creates a list of BFF-internal paths exempt from gateway-secret checking. Other API routes may be checked against the secret.

These are two different security questions:

- Is this request from a trusted internal gateway?
- Is this authenticated person allowed to perform this operation?

A gateway secret answers the first question only.

I recommend clearly separating gateway-origin authentication from learner authorization and resource ownership. A trusted gateway must not automatically grant access to a learner's records.

### RTH-R4-004 — Assignment authorization combines broad roles with a narrow workflow

Medium / High

File: `assignment-auth.ts`, approximately lines 40–64 and 75–84.

The helper recognizes:

```
const allowedRoles = [
  'student',
  'admin',
  'super_admin',
  'faculty',
  'user',
];
```

This broad rule may be appropriate for an authenticated RTH user context, but it is not automatically appropriate for every learner operation.

Faculty or admin identity does not by itself prove entitlement to submit a particular learner assignment.

The service must enforce the operation-specific entitlement, including enrollment, assignment publication, tier eligibility and learner ownership.

The existing `requireAssignmentAccess()` only demonstrates the tutorial-completion check; it does not establish all of those rules.

### RTH-R4-005 — Circular assignment unlocking remains active

High · Confirmed code-level policy contradiction

All three learner assignment endpoints use `requireAssignmentAccess()`:

- `GET /api/tutorial/assignments/[subtopicId]`
- `POST /api/tutorial/assignments/[subtopicId]/start`
- `POST /api/tutorial/assignments/[subtopicId]/complete`

The helper requires `isSubtopicComplete()`, while the earlier source review established that full tutorial completion includes the assignment section.

The helper's error says six learning blocks are required, but its underlying repository condition represents full completion.

This needs to be corrected at the domain-policy level, not by editing the displayed error message.

## 3. Additional implementation findings

### RTH-R4-006 — Assignment help endpoint does not prove eligibility

High / Verify

File: `api/tutorial/assignments/help/route.ts`, lines 7–42.

The handler calls `requireStudent()`, parses the help-request schema and delegates to:

```
assignmentService.submitHelpRequest(
  user.userId,
  parsed.data.subtopicId,
  parsed.data.assignmentId,
  parsed.data.question
);
```

This establishes that the caller has an accepted RTH identity. It does not, at the route level, prove that the learner is enrolled, has unlocked that assignment or may request help for it.

Those checks may exist in `AssignmentService`; that implementation must be examined before declaring a security defect.

The route also returns raw service exception messages with a 500 response. That is a separate error-sanitization concern.

### RTH-R4-007 — Wrong-brand and denied-role errors are not handled consistently

Medium · Confirmed

In `assignment-auth.ts`, `AssignmentAuthError` carries a `401 | 403` status.

The generic progress-completion route ignores that distinction and always returns 401 for such errors.

The assignment routes use a generic `getStatusCode()` helper that reads a numeric `statusCode` property from any thrown object. This is less precise than accepting a known application-error type.

I recommend using typed domain exceptions and a common safe response mapper.

### RTH-R4-008 — Identity forwarding needs a consistent trust contract

High / Verify

The shared proxy verifies token identity and constructs request headers containing:

```
headers.set('x-user-id', authResult.user.shadowUserId);
headers.set('x-shadow-user-id', authResult.user.shadowUserId);
headers.set('x-original-user-id', authResult.user.originalUserId);
```

Overwriting these specific identity headers from a verified token is positive.

However, all downstream identity-bearing headers and their trust rules must be checked together. For example, clients must not be able to introduce alternative identity or role headers that downstream code treats as authoritative.

The canonical brand resolver re-export is also a positive design choice, provided the incoming hostname is obtained through a trusted deployment boundary.

### RTH-R4-009 — Authentication logging is unnecessarily verbose

Medium · Confirmed

The shared proxy logs token-verification diagnostics, hostnames, token roles and identity fragments. It also logs gateway-secret comparison metadata.

Although full credentials are not visibly logged in these code paths, this is more diagnostic information than should normally be emitted for every production request.

Recommendation: Retain correlation IDs, bounded error categories and relevant security events. Remove credential-comparison metadata and unnecessary per-request identity logging.

## 4. Positive findings

These implementations should be preserved:

| Area                          | Source evidence                                | Architectural value                                       |
| ----------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| JWT verification              | `resolveUser()` verifies the user access token | Authentication uses a cryptographically verified identity |
| Brand mismatch rejection      | JWT brand compared with resolved request brand | Prevents obvious cross-brand token reuse at this boundary |
| Canonical brand resolver      | Shared re-export from `@quiz/types`            | Avoids duplicating hostname policies                      |
| Identity replacement          | Proxy overwrites core identity headers         | Better than forwarding caller-provided identity           |
| Assignment request validation | Zod schemas in start/complete/help routes      | Explicit input contracts                                  |
| Typed assignment errors       | Locked and already-completed error classes     | Consistent business-state distinctions                    |
| Request observability         | Wrappers on assignment retrieval/help          | Foundation for tracing                                    |

## 5. Round 4 gate assessment

| Gate                                     | Assessment                                                        |
| ---------------------------------------- | ----------------------------------------------------------------- |
| 1A — Boundaries and dependency direction | Partial; proxy and BFF separation exists                          |
| 1B — SOLID / DRY / KISS / YAGNI          | Partial; repetitive error mappers and route-policy complexity     |
| 1C — Authentication and authorization    | High-priority conditional gaps requiring full route inventory     |
| 1D — Database ownership                  | Assignment entitlement needs service/repository tracing           |
| 1E — API validation and error contracts  | Zod validation present; raw exception-message exposure remains    |
| 1F — Learner domain                      | Assignment prerequisite contradiction remains                     |
| 1G — Operations and resilience           | Security logging needs tightening                                 |
| 1H — Tests and CI                        | Not executed; full route-policy and cross-brand tests outstanding |

## 6. Recommended corrective architecture

The intended flow for a learner-facing assignment operation should be:

Browser request

RTH BFF authentication

Verify token, issuer/audience, brand and session

Operation authorization

Role, entitlement, enrollment, resource ownership

Assignment domain service

Published content, eligibility, tier transitions

RTH-owned repositories and database

Gateway service authentication remains an additional boundary for calls that traverse the gateway. It must not replace user-level authorization.

## 7. Audit programme status

Round 4 of 10

4 / 10 scheduled

Round 3 remains open because it was skipped. This progress bar represents scheduled round numbering, not source-code completion percentage.

| Measure                                        | Current status |
| ---------------------------------------------- | -------------- |
| Distinct full files retrieved in Round 4       | 9              |
| Critical/shared proxy fully examined           | Source read    |
| RTH BFF auth and assignment routes             | Source read    |
| All RTH API handlers inventoried and certified | No             |
| Assignment service ownership verified          | Not yet        |
| Tests, type checks and build executed          | No             |
| Repository changes                             | 0              |
| Final architecture approval                    | Not granted    |

Principal Architect verdict: Round 4 has verified important source-level policy weaknesses, but RTH's authentication and authorization cannot receive a passing certification until all applicable routes and authoritative service checks are covered.

The highest-priority issues are the gateway-secret fail-open behavior, incomplete route-policy coverage, assignment-domain entitlement and the contradictory progression prerequisite. These must be verified end to end before remediation is approved.

For the ten-round programme, both the skipped Round 3 and unfinished deep-reading work from Round 2 remain in scope. I will not silently count those as completed.

# RTH Principal Architect Audit — Round 3 and Round 2 Backlog

November 1, 2026 · Repository: `skillupitacademy-alt/SUIA_RTH_SHC` · Branch: `feature/project-llm-linux-worker` · Read-only review

I have resumed both outstanding areas: the skipped Round 3 — tutorial delivery, authoring and publishing, and the unfinished Round 2 — learner-progress services, repositories and concurrency.

The strongest new finding is in Round 3: the tutorial composer has explicit authorization TODOs in several content-changing operations, including publishing. The second major finding is that learner delivery and progress resolution can select different tutorial documents because their content-selection rules are not aligned.

These findings are based on actual GitHub source, not just the earlier audit reports.

## 1. Combined audit checkpoint

| Workstream                                   | Source retrieved                                                          | Review outcome                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Round 3: Delivery, authoring and publication | 5 files, 2,084 lines                                                      | Major source-level defects confirmed; full-line certification remains open               |
| Round 2: Progress service and repositories   | 3 core files, 2,432 lines                                                 | Additional detailed source paths examined; unresolved tests and some reading gaps remain |
| Test verification                            | Previously retrieved suites reviewed by test inventory and selected cases | Tests not executed                                                                       |
| Repository modifications                     | None                                                                      | Read-only                                                                                |

The remaining source-reading gaps matter: I cannot accurately mark both rounds fully completed yet. I can, however, provide concrete findings with exact source locations and close the architectural questions supported by the code examined.

## 2. Round 3 — Critical findings

### RTH-R3-001 — Tutorial publishing lacks authorization enforcement inside the service

Critical · Confirmed service-boundary defect

File: `packages/db-tutorial/src/services/tutorial-composer.service.ts`

The composer receives an operation context, but its publication method contains:

```
// TODO: Add authorization check
// await this.assertCanPublishTutorial(context, tutorial);
```

This appears around lines 363–375, immediately before the publication checks.

The same pattern occurs in content editing, status updates, archiving and block appending.

| Operation       | Source range | Authorization enforcement in reviewed service |
| --------------- | ------------ | --------------------------------------------- |
| Create tutorial | 90–166       | No explicit role/permission check             |
| Update content  | 270–318      | TODO; not implemented                         |
| Change status   | 322–355      | TODO; not implemented                         |
| Publish         | 363–418      | TODO; not implemented                         |
| Archive         | 423–443      | TODO; not implemented                         |
| Append block    | 456–524      | TODO; not implemented                         |

Architectural interpretation: These service methods are not independently authorization-safe. A secure API caller may protect a specific invocation, but that does not establish protection for every caller.

Required design: A centralized authoring policy should evaluate trusted principal, brand, role, content ownership and permitted state transitions. It should protect all service entry points capable of modifying published educational material.

This is a critical authorization-boundary finding, not proof of a publicly exploitable endpoint; that requires tracing every exposed caller.

### RTH-R3-002 — Learner delivery has nondeterministic brand selection

High · Confirmed

File: `tutorial-delivery.service.ts`, approximately lines 199–250.

The delivery query allows records when any of the following is true:

```
or(
  eq(tutorialSections.brandId, 'shared'),
  eq(tutorialSections.brandId, brandId),
  eq(tutorialSections.brandVisibility, 'shared_visible')
)
```

It then selects:

```
.limit(1)
```

There is no explicit ordering by exact brand, shared fallback, publication time or content version.

Consequence: If multiple records match, the selected tutorial is not guaranteed to be the most appropriate one for the requested RTH brand.

The visibility rule also differs from `TutorialSectionRepository.getTutorialByPageIdentity()`, which checks exact brand or `shared` but not `shared_visible`.

This is particularly serious because learner delivery and progress calculation may resolve different canonical content.

### RTH-R3-003 — Page identity is optional in a single-tutorial delivery query

High / Caller-dependent

File: `tutorial-delivery.service.ts`, lines 204–208.

```
if (navigationNodeId) {
  conditions.push(eq(tutorialSections.navigationNodeId, navigationNodeId));
}
```

The query returns only one tutorial even when no navigation node is supplied.

In a multi-page subtopic, that creates ambiguity: which page is the single tutorial supposed to represent?

The API must specify whether navigation identity is mandatory for page-level delivery or whether the operation intentionally returns a deterministic default page.

### RTH-R3-004 — Read-only suggestions use optimistic concurrency correctly

Positive — preserve

Files: `suggestion-application.service.ts`, lines 173–260, and `tutorial-section.repository.ts`, lines 424–451.

Suggestion application verifies the suggestion and its fingerprint, transforms the document, validates the resulting schema, then persists through a conditional update:

```
.where(
  and(
    eq(tutorialSections.id, tutorialId),
    eq(tutorialSections.version, expectedVersion),
    isNull(tutorialSections.deletedAt)
  )
)
```

This is genuine optimistic concurrency control.

It prevents a suggestion generated against version 5 from silently overwriting a document that has advanced to version 6.

Preserve this mechanism. Apply a similarly explicit concurrency contract to other content-editing operations where necessary, rather than replacing the existing successful pattern.

### RTH-R3-005 — Regular content updates do not enforce optimistic concurrency

High · Confirmed

File: `tutorial-section.repository.ts`, lines 393–416.

The regular `updateTutorialContent()` increments the document version, but its update predicate checks only the tutorial ID and soft-delete status.

Unlike `updateTutorialContentWithVersion()`, it does not require the version that the editor originally read.

The composer calls the weaker method for ordinary content editing and appending blocks.

Consequence: Two editors working on the same document can overwrite one another. Incrementing a version number alone does not prevent this.

Recommended correction: Route interactive authoring mutations through version-checked updates. Require an expected version from the authoring command and return a conflict when the document has changed.

### RTH-R3-006 — Publication and progress use inconsistent content-eligibility rules

High · Cross-layer defect

Three files establish the inconsistency:

- `tutorial-composer.service.ts`, lines 363–418, requires a valid, nonempty document for publishing.
- `tutorial-delivery.service.ts`, lines 209–260, filters by publication status and validates content before delivery.
- `learning-progress.hierarchy-resolution.ts`, lines 47–62, retrieves a tutorial section without checking publication eligibility and returns an empty requirement list when its content is missing.

The resulting policies are not equivalent.

Learner delivery may reject a document that progress resolution still treats as eligible for progress calculation. Additionally, the `getTutorialByPageIdentity()` query used for progress does not filter by published status.

Architectural decision: Introduce one canonical learner-content resolver, or a shared resolution policy used consistently by delivery and progress. It must return the exact published document identity, approved brand, navigation node and content revision.

### RTH-R3-007 — Cache invalidation is not implemented in reviewed authoring flows

Medium · Conditional operational risk

File: `tutorial-composer.service.ts`.

Content changes, publication, status changes and archiving have cache-invalidation TODOs.

This does not establish that stale content is currently served; cache behavior depends on actual consumers and caching configuration.

Nevertheless, any active cache of published tutorial content must be invalidated or versioned appropriately when publication changes.

## 3. Round 2 — Additional deep-reading results

### RTH-R2-010 — Progress retrieval can create records before confirming canonical content availability

Medium / High · Confirmed ordering issue

File: `learning-progress.service.ts`, lines 155–202.

`getNavigationProgress()` checks the navigation hierarchy, obtains or creates a learner-progress record, and only afterward resolves required canonical blocks.

Hierarchy validation confirms that a matching section exists; it does not itself establish that the section contains valid published content.

The earlier zero-required-block defect therefore remains relevant. A learner may receive a progress record for content whose educational eligibility has not been fully established.

### RTH-R2-011 — Subtopic progress retrieval may become an N+1 query pattern

Medium · Performance risk

File: `learning-progress.service.ts`, lines 213–242.

For every navigation-progress record, the service separately resolves required blocks and loads block-learning-state telemetry.

For a subtopic with many pages, the number of repository operations grows with the number of navigation nodes.

This is not necessarily a production bottleneck, but it should be measured against realistic page counts.

The preferred remediation, if profiling confirms a problem, is a batched repository query or bulk resolution—not a wholesale redesign.

### RTH-R2-012 — Time tracking is atomic, but the first-view and visit contracts are not fully aligned

Medium · Confirmed inconsistency

File: `tutorial-navigation-progress.repository.ts`, lines 393–481.

The repository correctly increments active time atomically and sets `visitCount` to zero when time tracking creates a progress record.

However, it also initializes `firstViewedAt` to the current time. Elsewhere, `recordVisit()` is described as the operation responsible for establishing the first visit.

This may be intentional if `firstViewedAt` means first observation of any kind, rather than first explicit visit.

The architecture must choose one meaning and apply it consistently across completion, active-time and visit operations.

### RTH-R2-013 — Repository version increments are not all optimistic locks

Medium · Confirmed distinction

Files: `block-learning-state.repository.ts` and `tutorial-navigation-progress.repository.ts`.

Several updates increment `version` atomically but do not include the old version in their update predicates.

That is suitable for atomic counters when the SQL operation is self-contained. It is not optimistic concurrency control for state-dependent decisions made before the update.

This distinction should be explicitly documented. Avoid adding unnecessary version checks to every atomic counter operation; focus on the transitions that depend on previously read state.

## 4. Consolidated priorities

| Priority | Issue                                                      | Recommended disposition                                                             |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P0       | Authoring service lacks explicit authorization enforcement | Trace callers and enforce a trusted authorization policy before production sign-off |
| P1       | Delivery and progress select canonical content differently | Unify learner-content resolution                                                    |
| P1       | Brand precedence is nondeterministic                       | Deterministic brand-aware selection                                                 |
| P1       | Content edits can overwrite concurrent changes             | Use expected-version updates                                                        |
| P1       | Missing content can satisfy empty completion requirements  | Distinguish unavailable from intentionally empty                                    |
| P1       | Invalid block identities may be persisted                  | Validate against canonical content                                                  |
| P2       | Recursive repository retries                               | Bound and test conflict recovery                                                    |
| P2       | Visit/first-view semantics                                 | Establish one documented invariant                                                  |
| P2       | Cache invalidation TODOs                                   | Verify actual caching and implement invalidation where needed                       |
| P2       | Subtopic progress N+1 queries                              | Profile; batch only where justified                                                 |

## 5. What is closed, and what remains open?

## Audit reconciliation

Evidence-based

| Workstream                                         | Status              |
| -------------------------------------------------- | ------------------- |
| Round 3 core delivery and publication defects      | Findings documented |
| Round 3 complete line-by-line certification        | Open                |
| Round 2 major service and repository paths         | Findings documented |
| Round 2 remaining unexamined implementation ranges | Open                |
| Round 2 complete test-suite reading                | Open                |
| Source-level concurrency conclusions               | Partial             |
| Running tests and validating migrations            | Not performed       |
| Fix implementation and retesting                   | Not performed       |

No code changes were made. These are source-review findings, not a completed runtime or production certification.

## Principal Architect verdict

The reviewed code demonstrates genuine architectural strengths—canonical Zod document validation, modular services, atomic persistence and a working version-checked suggestion-update pattern.

However, the learner-content lifecycle does not yet present one consistently enforced authority from authoring through publication, delivery and progress. That is the principal systemic risk identified by reconciling Rounds 2 and 3.

The immediate architectural sequence should be:

1. Prove every exposed authoring and publishing caller is authorized.
2. Make published canonical document resolution deterministic and brand-safe.
3. Reuse that same authoritative content identity in learner-progress operations.
4. Apply optimistic concurrency to editor-driven document mutations.
5. Validate the changes with cross-brand, unpublished-content, concurrent-edit and missing-content integration tests.

Reconciliation outcome: The skipped Round 3 has now received substantive source review, and the Round 2 backlog has been advanced. Both remain open for strict full-file line-by-line certification and test verification. I will not mark them complete merely because their primary defects have been identified.

# RTH Principal Architect Audit — Continued Deep Review

Rounds 2 and 3 backlog · GitHub branch `feature/project-llm-linux-worker` · Read-only

I have completed full-source reading of three additional files, concentrating on suggestion integrity and learner telemetry. These are distinct from the earlier targeted inspections.

| File                                  | Lines | Review status |
| ------------------------------------- | ----- | ------------- |
| `suggestion-verification.service.ts`  | 237   | Fully read    |
| `suggestion-fingerprint.service.ts`   | 176   | Fully read    |
| `block-telemetry-event.repository.ts` | 129   | Fully read    |

## 1. New findings

### RTH-R3-008 — Suggestion verification correctly rejects client-authored content

Verified positive design

In `suggestion-verification.service.ts`, the server retrieves the current tutorial, compares the expected document version, regenerates suggestions and verifies the selected suggestion's fingerprint.

The returned suggestion is generated by the server rather than copied from the client's proposed content.

This is an appropriate trust boundary and should be preserved.

Outstanding security dependency: The verifier receives a section ID but does not itself check whether the calling principal is allowed to view or modify that section. Authorization must be enforced before suggestion application, consistent with the authoring-service finding from the previous review.

### RTH-R3-009 — Fingerprint canonicalization has an edge case with non-JSON values

Low / Medium · Conditional

File: `suggestion-fingerprint.service.ts`, approximately lines 88–115.

The canonicalization function recursively sorts object keys and serializes primitive values. This provides deterministic behavior for ordinary JSON-compatible suggestion content.

However, the function does not independently enforce that its input is JSON-compatible. Unsupported values or circular object references are not explicitly handled.

For canonical tutorial documents originating in validated JSONB, that may be acceptable. The unresolved question is whether every caller guarantees validated JSON-compatible input.

Recommendation: Document the JSON-only precondition and test nested arrays, key ordering and unsupported values. Do not introduce a more complex canonicalization framework unless the inputs actually require it.

### RTH-R2-014 — Telemetry event repository has an appropriate idempotent claim design

Verified positive design

File: `block-telemetry-event.repository.ts`, approximately lines 36–61.

The repository uses:

```
.onConflictDoNothing({
  target: blockTelemetryEvents.eventId,
})
.returning();
```

A new event produces an inserted record; a duplicate returns no inserted row.

This is the right database-level foundation for idempotent event delivery. The application service then decides whether to apply the time increment and validates conflicting duplicate payloads.

The critical requirement is that event claiming and time accumulation execute in the same database transaction. That transaction is visible in the previously reviewed `learning-progress.service.ts` implementation.

### RTH-R2-015 — Transaction typing is weaker than the actual design

Medium · Confirmed maintainability issue

The telemetry repository declares:

```
withDb(dbClient: typeof db): BlockTelemetryEventRepository
```

The service passes a transaction-scoped client using `tx as never`.

The runtime intention is coherent, but the TypeScript contract does not accurately express the supported transaction client.

A focused repository-client interface would eliminate the unsafe cast while preserving atomic transaction behavior.

### RTH-R3-010 — Suggestion application has no authorization context

High · Confirmed service-boundary gap

File: `packages/db-tutorial/src/services/suggestion-application.service.ts`, lines 173–260.

The service accepts:

```
interface ApplySuggestionInput {
  sectionId: string;
  suggestionId: string;
  suggestionFingerprint: string;
  expectedVersion: number;
}
```

It verifies and regenerates the suggestion, then writes the modified tutorial document.

What is missing: The command contains no authenticated principal, role, brand or authorization context, and the service does not perform a permission check before persistence.

The fingerprint establishes that the suggestion corresponds to server-generated content. It does not establish that the caller may modify the tutorial.

This strengthens the earlier Round 3 authorization finding.

Required correction: Enforce trusted authoring permissions at the service boundary or an authoritative application-policy layer. Verify every exposed caller before deciding whether this constitutes an externally reachable vulnerability.

### RTH-R3-011 — Suggestion conflict handling is correct, but its response could be improved

Low · Improvement

When an atomic version-checked update affects no rows, the service throws `VersionConflictError(expectedVersion, -1)`.

Returning a conflict is appropriate. However, `-1` is a sentinel rather than the actual current version.

A subsequent read could supply the actual version if the API needs it. That read would be diagnostic only; the atomic update must remain the authority.

## 2. Updated full-source review ledger

Files fully read in this continuation

# 4

Combined source lines

# 833

Completed source reading: suggestion verification, fingerprint generation, suggestion application and telemetry event persistence.

| Architectural question                                          | Conclusion                                               |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| Can the client directly choose replacement suggestion content?  | Not through the reviewed suggestion-application contract |
| Is a suggestion verified against current content?               | Yes                                                      |
| Is concurrent document modification protected?                  | Yes, through version-checked persistence                 |
| Is authoring permission verified inside suggestion application? | No                                                       |
| Are telemetry events claimed idempotently?                      | Yes, at the repository level                             |
| Is telemetry transaction typing sound?                          | No; unsafe casts remain in the caller                    |
| Are these capabilities ready for production sign-off?           | Not yet                                                  |

## 3. Principal Architect assessment

The suggestion workflow has a well-designed integrity mechanism:

```
Current tutorial document
         ↓
Server-generated suggestions
         ↓
Fingerprint verification
         ↓
Canonical document transformation
         ↓
Schema validation
         ↓
Version-checked database update
```

The weakness is authorization, not fingerprinting or concurrency.

I would retain the existing workflow and add a single trustworthy authorization contract. Rebuilding the suggestion subsystem would introduce unnecessary risk.

The telemetry subsystem similarly has a sound idempotency foundation. Its improvements should focus on typed transaction clients, explicit duplicate-result contracts and tests covering transaction rollback.

## 4. Audit status

Four additional files have now received complete source reading in this continuation. Their findings are recorded above, with no repository modifications.

The Round 2 and Round 3 backlog has been reduced, but it is not fully closed. Large core implementations, remaining authoring transformations, and the full regression suites still require complete manual source reading; database-backed verification and test execution also remain outstanding.

I will retain those as open audit items rather than claiming completion based on selected-method inspection.

Current sign-off decision: Not approved. The most urgent unresolved issue is establishing and verifying authorization across every content-changing authoring entry point, followed by making published-content resolution consistent between learner delivery and progress.

# Real Tutorial Hub — Principal Architect Audit

November 1, 2026 · Read-only source review · Branch: `feature/project-llm-linux-worker`

## Which round is currently going on?

Current audit phase

# Round 2 & 3 — Backlog closure

In progress

Highest numbered round reviewed

4 of 10

Rounds 1 and 4 have source-review findings. Rounds 2 and 3 remain open for completion of their deep-reading requirements. Round 5 has not started. The bar represents round numbering, not verified code coverage.

In this continuation, I examined two additional complete source files, concentrating on tutorial delivery and navigation-progress persistence.

## 1. File-level review

| # | File                                                                               | Lines | Review result                                                                                         |
| - | ---------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| 1 | `packages/db-tutorial/src/services/tutorial-delivery.service.ts`                   | 431   | Full-source examination; important delivery-policy problems confirmed                                 |
| 2 | `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts` | 760   | Full source retrieved; implementation paths inspected, with final line-level certification still open |

### File 1 — TutorialDeliveryService

This service handles tutorial retrieval, publication filtering, brand visibility, document validation and sanitization.

RTH-R3-012 — Default brand is `shared`, not authenticated brand

High · Caller-dependent

Lines 154–163:

```
const {
  brandId = 'shared',
  includeUnpublished = false,
  navigationNodeId,
  _subtopicMetadata,
} = options;
```

The service defaults to `shared` when no brand is provided.

For a learner-facing operation, the authoritative brand should normally come from trusted authentication or verified request context. A caller that omits the brand can trigger a different content-selection policy.

The service itself does not establish where that trusted brand comes from.

Required verification: Trace every learner-facing caller and prove it supplies the correct verified brand.

RTH-R3-013 — Brand visibility is too broad for deterministic content identity

High · Confirmed query design defect

Lines 219–246:

```
or(
  eq(tutorialSections.brandId, 'shared'),
  eq(tutorialSections.brandId, brandId),
  eq(tutorialSections.brandVisibility, 'shared_visible')
)
```

followed by:

```
.limit(1)
```

This creates a source-selection ambiguity when several tutorials are eligible.

The `shared_visible` predicate may also admit a tutorial owned by another brand. Whether that is acceptable depends on the intended content-sharing policy, but it must not be accidental.

Recommendation: Enforce explicit precedence, for example exact-brand content before approved shared content. Define precisely which cross-brand documents are eligible.

RTH-R3-014 — Published-content delivery and canonical progress resolution use different rules

High · Confirmed

The delivery service restricts status to `approved` or `deployed`, by default.

However, the progress resolver examined earlier does not apply the same publication-status filter.

Therefore, a learner could potentially receive one set of content while progress is calculated against another set.

This is a domain consistency defect, not merely a database query optimization issue.

RTH-R3-015 — Content validation and sanitization are good boundaries

Positive finding

Lines 259–303 and 365–399 validate the stored content against `TutorialDocumentSchema` before sanitizing it for learner delivery.

This is an appropriate defense-in-depth design.

The direct tutorial-ID retrieval path also verifies publication status, soft deletion and brand access before returning content.

These checks should be preserved.

### File 2 — TutorialNavigationProgressRepository

This repository manages learner visits, completed blocks, time tracking, revision counts and navigation-node completion.

RTH-R2-016 — All three record-creation paths have different visit semantics

Medium · Confirmed inconsistency

| Operation              | Initial `visitCount` | Initial `firstViewedAt` |
| ---------------------- | -------------------- | ----------------------- |
| `markBlockCompleted()` | 1                    | Current timestamp       |
| `recordTime()`         | 0                    | Current timestamp       |
| `recordVisit()`        | 1                    | Current timestamp       |

The code comments state that visits should be owned by `recordVisit()`.

But `markBlockCompleted()` can create a record with `visitCount = 1`.

This discrepancy was previously identified; the additional source reading confirms that it is not confined to a single helper.

Architectural decision needed: Does `visitCount` represent explicit navigation visits or any meaningful learner interaction? The system must choose one definition.

RTH-R2-017 — Recursive conflict retries occur in several operations

Medium · Confirmed

The repository recursively retries after insertion conflicts in:

- `markBlockCompleted()`
- `recordTime()`
- `recordVisit()`

Each retry may converge under normal concurrency, but there is no explicit retry limit.

I recommend bounded conflict recovery, with tests that simulate continuous contention and soft-delete races.

RTH-R2-018 — Navigation completion relies on a service-level policy that is not transactionally coupled to persistence

High · Concurrency verification required

Lines 687–728 show that `completeNode()` trusts its caller to have evaluated completion eligibility.

The repository's update sets `status = 'completed'` without incorporating the previously evaluated learner progress version into the predicate.

The separation of educational policy and repository persistence is architecturally sound. What remains uncertain is whether concurrent state changes could invalidate the policy decision before persistence.

A conditional update or appropriate transaction boundary should be considered if that race is possible.

RTH-R2-019 — Atomic counters and completed-block deduplication should be preserved

Positive finding

The repository uses atomic SQL expressions for active time, visit transitions and completed-block append operations.

Those are appropriate concurrency techniques. A broad replacement with JavaScript read–modify–write operations would be a regression.

## 2. Current ten-round tracker

| Round | Scope                                                  | Status                                     |
| ----- | ------------------------------------------------------ | ------------------------------------------ |
| 1     | Progress foundations and schemas                       | Source review completed; tests pending     |
| 2     | ILS services and repositories                          | Deep-review backlog open                   |
| 3     | Tutorial authoring, publishing and delivery            | Deep-review backlog open                   |
| 4     | Authentication, authorization and API trust boundaries | Reviewed; end-to-end certification pending |
| 5     | Assignment and learner eligibility                     | Not started                                |
| 6     | UI pages, layouts and learner components               | Not started                                |
| 7     | Hooks, caching, performance and accessibility          | Not started                                |
| 8     | Remaining RTH files and shared dependencies            | Not started                                |
| 9     | Tests, CI, configuration and runtime evidence          | Not started                                |
| 10    | Reconciliation and final architecture sign-off         | Not started                                |

## 3. Updated Principal Architect assessment

The two strongest cross-layer problems remain:

First: Canonical content authority. RTH needs one deterministic, brand-safe, publication-aware content-resolution policy used by delivery and progress.

Second: Authorization of authoring mutations. Earlier review confirmed that content-editing and publishing service methods lack their own explicit authorization enforcement. Every exposed caller must be traced and an authoritative policy established.

The progress repository itself shows useful engineering discipline in atomic updates and deduplication, so I would favor targeted corrections over structural rewrites.

### Current decision

Round status: 2 and 3 backlog closure ongoing. Highest reached: Round 4/10. Next numbered round: Round 5.

No repository files were modified, and no test runs were performed. I am keeping full line-by-line certification, caller tracing and runtime verification open where evidence remains incomplete rather than marking those tasks finished prematurely.

# Real Tutorial Hub — Principal Architect Audit

Continued audit · November 1, 2026 · Read-only · Branch: `feature/project-llm-linux-worker`

## Current round status

Highest round reached: 4 / 10

Backlog open

Currently reconciling the remaining Round 2 and Round 3 source reviews. Round 5 has not started. The 40% indicator represents round numbering, not verified audit completeness.

This continuation examined the tutorial composer and tutorial-section repository more deeply, including query pagination, tutorial creation, status changes, publication, archiving and content-editing contracts.

| File                                                                   | Source lines | Status                                                       |
| ---------------------------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| `packages/db-tutorial/src/services/tutorial-composer.service.ts`       | 547          | Additional methods examined; source certification still open |
| `packages/db-tutorial/src/repositories/tutorial-section.repository.ts` | 578          | Additional methods examined; source certification still open |

## 1. New code-level findings

### RTH-R3-016 — Tutorial creation can incorrectly reject a valid brand-specific document

High · Confirmed logic mismatch

File: `tutorial-composer.service.ts`, approximately lines 135–146.

The composer checks whether a document already exists using:

```
const existingTutorial =
  await this.repository.getTutorialByPageIdentity(
    internalSubtopicId,
    input.navigationNodeId,
    brandId
  );

if (existingTutorial) {
  throw new TutorialAlreadyExistsError(...);
}
```

But the repository's `getTutorialByPageIdentity()` accepts both the requested brand and shared content.

Example: A shared tutorial exists for a Java page. An editor attempts to create an RTH-specific tutorial for the same page. The lookup can find the shared tutorial and reject the new brand-specific document as a duplicate.

That contradicts the brand-specific override model supported by the schema.

Recommended correction: Use an exact-brand identity lookup for duplicate creation. Reserve shared fallback for learner delivery, not authoring uniqueness checks.

### RTH-R3-017 — Tutorial status updates can bypass publication validation

High · Confirmed service-path concern

File: `tutorial-composer.service.ts`, lines 322–355, and `tutorial-section.repository.ts`, lines 456–489.

The dedicated `publishTutorial()` service validates the document schema and requires nonempty content.

However, `updateTutorialStatus()` passes its status directly to the repository. The repository allows:

```
status: input.status
```

and sets `publishedAt` when the new status is `deployed`.

There is no equivalent document-publishability check in the examined status-update path.

Consequence: If a caller can request `deployed` through status update, it can reach publication state without passing the dedicated publication validator.

This is a business-state transition gap. API-level restrictions still need to be traced, but the service itself does not enforce the invariant.

Recommended correction: Route every transition to learner-visible publication through one authoritative publishability and authorization policy.

### RTH-R3-018 — Cursor pagination can skip records with equal timestamps

Medium · Confirmed query-design issue

File: `tutorial-section.repository.ts`, lines 248–286.

The repository paginates using:

```
createdAt < (
  SELECT created_at
  FROM tutorial_sections
  WHERE id = cursor
)
```

and orders solely by descending `createdAt`.

If two tutorials share the same `createdAt`, the next page can omit rows.

Recommended correction: Use stable keyset ordering on `(createdAt, id)` with a matching composite cursor predicate. Validate and bound `limit` at the application boundary.

### RTH-R3-019 — Query and count filters differ

Medium · Confirmed

File: `tutorial-section.repository.ts`, approximately lines 248–315.

`queryTutorials()` accepts a `navigationNodeId` filter, but `countTutorials()` does not apply that filter.

The composer combines the two results:

```
const [queryResult, total] = await Promise.all([
  this.repository.queryTutorials(...),
  this.repository.countTutorials(...),
]);
```

A page-specific query can therefore show records for one navigation node while reporting the total across multiple nodes.

This is a concrete pagination and API-contract defect.

Recommended correction: Share a common filter builder between retrieval and count queries.

### RTH-R3-020 — Repository creation logs excessive database diagnostics

Medium · Confirmed

File: `tutorial-section.repository.ts`, approximately lines 320–388.

On insertion failure, the repository logs database error details including stack trace, constraint, table and column.

Those diagnostics can be useful during development but should not be emitted indiscriminately in production.

Recommendation: Use structured, environment-appropriate error logging with a correlation ID and bounded error metadata. Preserve detailed diagnostics in secured development environments.

## 2. Earlier findings reinforced

The additional reading reinforces three already documented concerns:

- Authoring authorization: Composer mutation methods accept a context object but contain authorization TODOs instead of enforcing the relevant permissions.
- Optimistic concurrency: The ordinary content-update and append-block paths do not require an expected document version, unlike suggestion application.
- Canonical publication policy: Publication through direct status changes is not governed by the same document validation as the dedicated publish method.

These findings should be grouped into shared remediation work, rather than creating separate fixes in every caller.

## 3. Positive engineering decisions

The repository has some important mechanisms worth preserving: active-record soft-delete conditions, explicit document version increments, a genuinely version-checked update method, and database-backed uniqueness for tutorial identities.

The composer also validates `TutorialDocument` input before major content changes, and its creation flow checks whether a navigation page belongs to the specified subtopic.

The objective should be to correct business invariants and authorization without dismantling these existing mechanisms.

## 4. Updated audit tracker

| Round | Scope                                    | Current status                                        |
| ----- | ---------------------------------------- | ----------------------------------------------------- |
| 1     | Progress foundations                     | Source reading complete; verification pending         |
| 2     | Progress service and repositories        | Partially reviewed — backlog remains                  |
| 3     | Tutorial composition and publishing      | Partially reviewed — backlog remains                  |
| 4     | Auth, proxy, API trust boundaries        | Source findings recorded; full route coverage pending |
| 5     | Assignments and learner eligibility      | Not started                                           |
| 6     | Pages, layouts and components            | Not started                                           |
| 7     | Hooks, state, caching and accessibility  | Not started                                           |
| 8     | Remaining RTH and shared dependencies    | Not started                                           |
| 9     | Tests, builds, CI, security verification | Not started                                           |
| 10    | Final reconciliation and certification   | Not started                                           |

## Principal Architect verdict

The additional source examination identifies two material defects beyond the previously reported risks: brand-specific tutorial creation can be blocked by shared-content fallback, and a status update can bypass the validation required by the dedicated publishing method.

Combined with the lack of explicit authoring authorization, these are significant content-lifecycle correctness issues.

Current position: Round 4 reached; Round 2/3 backlog closure is ongoing. No code was modified, no tests were run, and no architecture sign-off has been granted.

# Real Tutorial Hub — Principal Architect Code Audit

November 1, 2026 · Read-only GitHub inspection · Branch: `feature/project-llm-linux-worker`

Current work: Round 3 — Backlog closure

In progress

Highest numbered round reached

4 / 10

Next numbered round

5 — Assignments

Round 2 also retains unresolved test and source-reading coverage. The audit is not yet 40% certified simply because Round 4 has been reached.

## 1. Files reviewed in this continuation

| File                                                                               | Lines | Review status                                                                                        |
| ---------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| `packages/db-tutorial/src/services/block-transformation.service.ts`                | 863   | Complete implementation read, including all ten transformation methods and helpers                   |
| `packages/db-tutorial/src/services/__tests__/block-transformation.service.test.ts` | 1,035 | Test inventory and critical test cases examined; complete line-by-line test certification still open |

The key question for this pass was whether transforming AI-generated suggestions can silently change, remove or fabricate educational content.

## 2. Detailed findings

### RTH-R3-021 — Diagram transformation generates a generic placeholder

High · Confirmed

File: `block-transformation.service.ts`, lines 362–398.

The diagram transformer creates a fixed Mermaid diagram:

```
diagramData:
  'graph LR\n  A[Start] --> B[Process]\n  B --> C[End]'
```

It does not construct the flow from the educational meaning of the source paragraph.

Why this matters: The result can be structurally valid but pedagogically incorrect. Learners may see a generic process diagram presented as if it explains the actual lesson.

Recommendation: Either build a real, validated diagram from source content or classify the output as an author-review-required draft. Do not publish placeholder diagrams as completed instructional material.

### RTH-R3-022 — Automatically generated definitions include placeholder example code

High · Confirmed

File: `block-transformation.service.ts`, lines 429–479.

The definition transformer creates a canonical D1 block and includes:

```
example: {
  language: 'javascript',
  code: '// Example code here',
}
```

This happens regardless of the underlying concept or programming language.

Architectural concern: Schema validity is not equivalent to educational accuracy.

Recommendation: Require a validated subject-appropriate example, or retain the definition as an authoring draft until a reviewer supplies a suitable example.

### RTH-R3-023 — Summary fallback invents generic learning points

Medium / High · Confirmed

File: `block-transformation.service.ts`, lines 743–766.

If no suitable headings are found, `extractKeyPoints()` returns generic entries such as `Key concept 1`.

The summary transformer then creates a versioned instructional block using those points.

This can produce a technically valid but meaningless summary.

Recommendation: Return a typed inability-to-generate outcome rather than silently fabricating summary content.

### RTH-R3-024 — Concept-card transformation may absorb unrelated content

High · Conditional on source selection

File: `block-transformation.service.ts`, lines 521–634 and 831–854.

The transformation identifies H3 headings and collects intervening blocks into cards.

For the final card, it continues collecting until another H3 heading or the document ends.

That creates two possible semantic errors:

- Material belonging to a later H2 section may be absorbed into the final card.
- The replacement range can include blocks not explicitly listed in the suggestion's `sourceBlockIds`.

For example, if the last concept card is followed by an H2 heading introducing a new topic, the current collection algorithm can include that H2 and subsequent content because its stopping condition checks only H3 headings.

This is a potentially destructive content transformation.

Required regression test: Three H3 concept headings followed by an unrelated H2 section. Verify the H2 and its associated content remain outside the generated card grid.

### RTH-R3-025 — Two-column transformation depends on suggestion ordering

Medium · Conditional

File: `block-transformation.service.ts`, lines 176–238.

The source blocks are retrieved in `suggestion.sourceBlockIds` order, not necessarily document order.

The transformer partitions the list according to where the second heading appears in that supplied order.

If the suggestion references valid blocks out of document order, the generated columns may contain misplaced content.

Recommendation: Derive the source range and column partition from canonical document order, with explicit validation that the selected headings form a valid region.

### RTH-R3-026 — Table conversion can truncate values containing colons

Medium · Confirmed

File: `block-transformation.service.ts`, lines 791–818.

The list-to-table parser splits text using `:` and then takes only the first two parts.

For example, a value containing a URL or another colon-delimited expression can lose part of its original content.

Recommendation: Split on the first applicable delimiter only, preserving the entire remainder as the value.

### RTH-R3-027 — Transformation trust is established by the caller, not the method itself

Medium · Architectural contract

The `transform()` method accepts a `BlockSuggestion` object. It verifies the suggestion kind and supported transformation type but does not independently authenticate its origin.

That is not necessarily incorrect because `SuggestionApplicationService` verifies and regenerates the suggestion before invoking the transformer.

However, the test titled should operate on server-generated suggestions only does not actually establish the suggestion's origin. It simply constructs a value and calls `transform()`.

The trust guarantee belongs to the application-service composition, and that contract should be documented and tested there.

## 3. Positive findings

The transformation subsystem has several sound characteristics that should be retained.

| Design choice                                   | Assessment                                                  |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `structuredClone()` before transformation       | Protects the original document from direct mutation         |
| Explicit switch over supported suggestion types | Clear, maintainable dispatch                                |
| Canonical `card-grid` conversion                | Avoids persisting an unsupported `concept-cards` block type |
| Source-block existence validation               | Rejects references to missing blocks                        |
| Final `TutorialDocumentSchema.parse()`          | Enforces structural document validity                       |
| Server-side suggestion regeneration upstream    | Reduces reliance on client-supplied suggestion content      |

The most important architectural distinction is that structural schema validation cannot establish educational correctness.

## 4. Test coverage assessment

The test file contains cases for all ten transformation rules, input immutability, missing source blocks, canonical block types and malicious `suggestedContent`.

Those are meaningful tests.

However, the inspected cases do not establish coverage of the most consequential edge conditions identified above: preserving section boundaries, rejecting pedagogical placeholders, maintaining canonical document order and handling colon-containing table values.

The missing cases should be added as focused regression tests. No tests have been executed during this audit.

## 5. Principal Architect recommendations

The most effective remediation is to make transformation outcomes explicit.

A transformation should result in either a validated educational document, a draft requiring author approval, or a typed rejection explaining why a safe transformation cannot be performed.

Specifically:

1. Preserve section and block boundaries during transformations.
2. Reject unsupported or ambiguous source selections.
3. Remove educational placeholders from publishable output.
4. Validate semantic quality separately from Zod schema shape.
5. Strengthen regression tests around data preservation.
6. Preserve the existing optimistic concurrency control in suggestion application.

## 6. Audit programme tracker

| Round                                         | Status                   |
| --------------------------------------------- | ------------------------ |
| 1 — Progress foundations                      | Source review recorded   |
| 2 — Progress services and repositories        | Open backlog             |
| 3 — Authoring, publishing and transformations | Active backlog closure   |
| 4 — Authentication and API trust boundaries   | Source findings recorded |
| 5 — Assignment workflows                      | Not started              |
| 6 — Application pages and components          | Not started              |
| 7 — Hooks, caching and accessibility          | Not started              |
| 8 — Remaining files and dependencies          | Not started              |
| 9 — Tests, builds and runtime verification    | Not started              |
| 10 — Final reconciliation                     | Not started              |

Current decision: Round 3 has advanced with a complete review of the 863-line transformation implementation and a targeted review of its tests. Round 3 is still not fully closed, and Round 2's outstanding test coverage remains open.

No code was changed, and no production-readiness approval is granted.

# Real Tutorial Hub — Principal Architect Audit

November 1, 2026 · Branch: `feature/project-llm-linux-worker` · Read-only source examination

## Current round: Round 3 backlog closure

Highest numbered round reached

## 4 / 10

Current review

Round 3 — Active

Round 2 also retains incomplete certification. Round 5 has not started.

This continuation completes the source examination of the remaining sections of the 1,035-line `block-transformation.service.test.ts` file.

Across this and the preceding reviews, its test cases cover the ten transformation rules, immutability, unknown suggestion types, missing source blocks and client-content injection.

The new findings are primarily about weak assertions: tests that prove a block has the correct structure but do not prove that its instructional meaning or surrounding content is preserved.

## 1. File reviewed

`packages/db-tutorial/src/services/__tests__/block-transformation.service.test.ts`

Source lines

# 1,035

Transformation rules represented

# 10 / 10

Full test-file source coverage is now accounted for across the review passes. Tests were not executed.

## 2. Detailed code findings

### RTH-R3-028 — Diagram test accepts meaningless placeholder diagrams

High · Confirmed test gap

File lines 466–505.

The diagram test checks that the resulting block has `type: 'diagram'`, that its diagram format is Mermaid, and that `diagramData` exists.

It never checks whether the diagram actually represents the supplied workflow.

This permits the fixed placeholder identified in RTH-R3-021 to satisfy the test.

Required test: Use a workflow containing distinctive steps and assert that the transformed diagram accurately represents those steps, or that a transformation incapable of doing so is rejected.

### RTH-R3-029 — Definition test does not validate example quality

Medium / High · Confirmed test gap

File lines 558–599.

The definition test asserts that the block uses version `D1` and contains the expected term and part of its definition.

It does not check whether the example is meaningful or related to the topic.

As a result, the fixed `// Example code here` placeholder from the transformer can pass.

Required test: Assert that a generated definition contains no placeholder example and that its example meets the required subject-specific authoring contract.

### RTH-R3-030 — Table test checks dimensions, not preservation of values

Medium · Confirmed test gap

File lines 600–648.

The table test checks that the output has two columns and three rows.

It does not compare the source values to the resulting cell values.

That means a transformation could silently truncate or alter input values without the test failing.

A regression test should include a value containing multiple colons, such as a URL, and assert exact preservation.

### RTH-R3-031 — Two-column tests do not check correct partitioning

Medium · Confirmed test gap

File lines 206–310.

The tests verify the existence of left/right block collections and that unrelated blocks remain in the top-level document.

They do not assert that the intended content appears in the correct column in the correct order.

Required tests: Verify the precise block IDs in both columns, including a case where `sourceBlockIds` is supplied out of document order.

### RTH-R3-032 — Summary test accepts generic summary content

Medium · Confirmed test gap

File lines 507–557.

The test checks that a summary block is appended and its points form an array.

It does not check whether those points are meaningful or supported by the source material.

A case with no extractable headings should verify the intended fallback policy rather than accepting fabricated learning points.

### RTH-R3-033 — Concept-card tests do not protect subsequent section boundaries

High · Confirmed test gap

File lines 650–910.

The suite covers card counts, grid columns, nested-block preservation, canonical type conversion and unique card IDs.

Those are useful.

However, the test documents do not include a following unrelated H2 section that must remain outside the generated card grid.

The resulting blind spot is significant because the transformer currently collects content beyond the last card heading until another H3 or the end of the document.

A targeted regression test should verify that a subsequent H2 section and its blocks survive the transformation unchanged.

## 3. Test-quality assessment

| Area                  | Existing strength                                 | Missing verification                                        |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Immutability          | Original document is checked for mutation         | More complex nested structures                              |
| Canonical block types | Unsupported `concept-cards` output rejected       | Content fidelity                                            |
| Two-column            | Structure and unrelated block existence           | Correct ordering and partition                              |
| Comparison            | Entities and features exist                       | Correct extracted values                                    |
| Diagram               | Mermaid structure exists                          | Semantic accuracy                                           |
| Summary               | Summary is appended                               | Educational relevance                                       |
| Definition            | Correct term and version                          | Relevant worked example                                     |
| Table                 | Correct row and column counts                     | Exact value preservation                                    |
| Concept cards         | Layout, IDs and nested blocks                     | Section-boundary preservation                               |
| Security              | Injected `suggestedContent` ignored for a callout | End-to-end authorization and verified suggestion provenance |

## 4. Principal Architect conclusion

The transformation test suite has broad feature coverage but insufficient protection against educational-content corruption.

The highest-priority additional tests should check:

1. H2 section boundaries after concept-card conversion.
2. Preservation of original table values containing colons.
3. Accurate two-column partitioning in document order.
4. Rejection of placeholder diagrams, definitions and summaries.
5. End-to-end application of a suggestion with trusted author authorization.

These tests should be added before relying on the transformation pipeline for unattended publishing.

## 5. Round tracker

| Round                                       | Status                                        |
| ------------------------------------------- | --------------------------------------------- |
| 1 — Progress foundation                     | Source review recorded                        |
| 2 — ILS services and repositories           | Deep-review backlog open                      |
| 3 — Authoring, delivery and transformation  | Active backlog closure                        |
| 4 — Authentication and API trust boundaries | Findings recorded; full certification pending |
| 5–8 — Remaining application functionality   | Not started                                   |
| 9 — Test execution and CI                   | Not started                                   |
| 10 — Final independent reconciliation       | Not started                                   |

Current milestone: The transformation implementation and its corresponding 1,035-line test file have both been examined. This closes their source-reading tasks, but not the defects or runtime verification.

No files were changed and no tests were executed. The architecture remains not approved for final sign-off while the authorization, deterministic content resolution and educational-content preservation issues remain unresolved.

# Real Tutorial Hub — Principal Architect Audit

November 1, 2026 · Read-only GitHub source review · `feature/project-llm-linux-worker`

## Current round status

Active: Round 2 — Backlog closure

In progress

Highest numbered round reached

4 / 10

Next numbered round

5

Round 3's transformation implementation and test suite have been examined; other Round 3 dependencies remain open. Round 2's progress tests are under review in this continuation.

I retrieved the 1,579-line `learning-progress.service.test.ts` source in four line ranges, covering its mocks, learner identity checks, visit semantics, block completion, progress percentages, hierarchy validation and generic instructional-block participation.

The important architectural finding is that some tests actively permit behavior that the production design needs to reject, while several mocks do not reproduce the real repository's persistence semantics.

## 1. Source-level findings

### RTH-R2-020 — A test treats an arbitrary block ID as valid completion

High · Confirmed test-contract weakness

File: `learning-progress.service.test.ts`, lines 518–526.

The test titled `valid block completion accepted` records `block-D1`, although its default mock tutorial content contains an empty blocks array.

The test expects the completion to be persisted successfully.

This confirms that the suite does not establish canonical block-membership validation before recording learner completion.

The appropriate test contract is that a completion request is accepted only when the requested block exists in the authoritative, eligible tutorial document.

### RTH-R2-021 — The navigation-progress mock conceals a production discrepancy

High · Confirmed mock mismatch

File: `learning-progress.service.test.ts`, approximately lines 119–153.

The mock repository creates progress with `visitCount = 0` when a block-completion request arrives without an existing record.

However, the production repository's corresponding insertion initializes `visitCount = 1`.

Consequently, a service test can pass while the real database violates the documented rule that completion must not manufacture a visit.

Recommendation: Add a repository-contract test against PostgreSQL for completion-before-visit. Do not simply change the mock until the intended semantic rule is formally settled.

### RTH-R2-022 — Different block versions are accepted without validating whether they exist

High · Confirmed test weakness

File: `learning-progress.service.test.ts`, lines 568–580.

The test records the same block with versions `D1` and `D2` and expects two completion entries.

That demonstrates version-aware storage, which is useful. It does not demonstrate that both versions are valid published versions of the requested block.

A correct test suite should distinguish valid content revisions from unknown, withdrawn or fabricated block versions.

### RTH-R2-023 — An ordinary mock cannot prove concurrency safety

Medium · Coverage limitation

The in-memory `MockNavigationProgressRepository` mutates a `Map` directly and uses JavaScript operations to update visit counts, timestamps and completed blocks.

This is appropriate for isolated business-policy tests, but cannot reproduce PostgreSQL uniqueness conflicts, SQL atomic updates, transaction isolation or soft-delete races.

The database-backed integration tests are therefore essential rather than optional evidence for final sign-off.

## 2. Additional findings from the completion-security tests

### RTH-R2-024 — The security test verifies node completion but permits invalid block-event storage

High · Confirmed test gap

File: `learning-progress.service.test.ts`, approximately lines 823–854.

In `TEST D`, the canonical document requires `block-def`, but the test submits completion for `block-other`.

The test then verifies that `completeNavigationNode()` rejects node completion. That is useful, but insufficient.

It does not assert that `recordBlockCompletion()` rejects the invalid block identity. In fact, the test expects the invalid record operation to succeed so it can subsequently test the node-level policy.

The system therefore protects the final completion percentage better than it protects the integrity of the underlying completion-event ledger.

Required correction: Reject the invalid block event before it is persisted, while retaining a separate test that verifies node-completion eligibility.

### RTH-R2-025 — The brand-isolation mock cannot verify shared-content precedence

Medium · Confirmed test-design limitation

File: approximately lines 880–923.

`TEST F` creates independent brand-specific documents inside a simple map keyed by brand.

That is appropriate for testing the learning service's use of an authenticated brand.

However, it does not model the actual SQL repository's exact-brand-or-shared lookup, including its missing ordering.

As a result, it cannot detect the nondeterministic shared-versus-brand-specific selection identified in Round 3.

Required integration test: Insert both exact-brand and shared tutorial sections for the same page. Verify that the selected record is deterministic and matches the delivered learner content.

### RTH-R2-026 — Test fixtures bypass canonical document validation

Medium · Confirmed coverage limitation

Several completion tests construct blocks using `as any`, occasionally omitting fields normally required by the canonical document schemas.

That is acceptable for narrowly isolated aggregation tests.

However, the suite should not be treated as proof that the complete production flow accepts and processes valid published `TutorialDocument` objects correctly.

Add a smaller set of integration tests using fully validated document fixtures and actual repository lookup behavior.

## 3. Strengths preserved by the test suite

The tests do provide meaningful evidence at the source level that the intended business policy includes:

- Matching both block ID and version when calculating completion.
- Resolving required blocks on the server rather than accepting a client-defined denominator.
- Separating learner records by user identity.
- Rejecting mismatched navigation hierarchy combinations.
- Supporting dynamically composed instructional blocks, including `I1`, `D1`, `C1` and `S1`.
- Tracking active time without automatically incrementing the visit count in the mock implementation.

These are good domain invariants. They should remain part of the regression contract.

## 4. Audit ledger update

| Item                                                        | Status                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `learning-progress.service.test.ts` — 1,579 lines           | Source ranges retrieved and relevant test logic reviewed |
| Service test mocks                                          | Inspected; discrepancies identified                      |
| Completion-security tests                                   | Examined in detail                                       |
| Actual PostgreSQL concurrency verification                  | Open                                                     |
| Missing-content and unpublished-content regression coverage | Open                                                     |
| Source modifications                                        | None                                                     |
| Test execution                                              | Not performed                                            |

## Principal Architect conclusion

The learning-progress unit suite is substantial, but it has a critical blind spot: it checks whether a learner can complete a navigation node without always checking whether invalid completion events were accepted earlier.

That distinction matters for learning analytics, revision history, auditability and any downstream logic that reads the event records.

Current round remains Round 2 backlog closure; highest numbered round reached remains 4 of 10. I have not advanced the counter or claimed full certification of the unfinished Rounds 2 and 3.

The next remaining verification priority is the PostgreSQL-backed repository test coverage, especially concurrent block completion, visit-state initialization, soft-delete behavior and telemetry idempotency.

# Real Tutorial Hub — Principal Architect Audit

Round 2 backlog closure · November 1, 2026 · Read-only GitHub review

## Current round status

Active work: Round 2 — Database verification review

In progress

Highest numbered round reached

4 / 10

Next numbered round

5

We are closing earlier audit gaps, not beginning Round 5. The round counter does not represent verified repository-wide completion.

## 1. File reviewed completely

`packages/db-tutorial/src/repositories/__tests__/block-learning-state.integration.test.ts`

Source lines reviewed

# 389

Integration test cases

# 11

The complete file, lines 1–389, was read. Its tests require PostgreSQL; none were executed in this review.

The suite covers concurrent visits, session changes, revision counting, first-view timestamps, partial unique indexes and active-time accumulation.

## 2. Findings from the integration tests

### RTH-R2-027 — Hard-coded test identity can affect unintended database records

High · Test-environment risk

File lines 28–50.

The suite uses a fixed user UUID and block identity. Before every test it executes a physical database deletion for that identity.

The cleanup is targeted, but the file does not establish that the connected database is an isolated test database.

If the test configuration accidentally points to a shared or production environment, this cleanup could delete matching records.

Recommendation: Enforce a test-only database guard before any destructive setup, use unique test identities, and prohibit production database credentials in integration-test execution.

### RTH-R2-028 — Concurrency assertions verify final state, not every transition

Medium · Coverage limitation

File lines 56–135.

The tests correctly use `Promise.all()` to submit simultaneous repository operations and check the final visit count.

For example, five requests from the same session should leave `visitCount = 1`.

This verifies an important end-state invariant. However, it does not fully establish the exact transaction interleaving, retry behavior or response semantics of every concurrent request.

Recommendation: Retain these tests and add focused tests for conflict recovery, unique-index races and state changes under competing session IDs.

### RTH-R2-029 — First-view tests do not cover inconsistent historical state

Medium · Confirmed test gap

File lines 267–310.

The suite tests normal initial visits and confirms that subsequent visits preserve `firstViewedAt`.

It does not test a row where `firstViewedAt` exists but `lastSessionId` is null.

That distinction matters because the SQL helper initializes the timestamp based on `lastSessionId`, rather than the timestamp column itself.

The missing test should explicitly construct that state and assert that the original first-view timestamp is preserved.

### RTH-R2-030 — Partial unique-index lifecycle receives meaningful coverage

Verified positive test design

File lines 316–344.

The test creates a record, soft-deletes it, verifies the active lookup no longer returns it, and then creates a new active record using the same logical block identity.

This exercises the intended partial unique-index behavior.

It is a good integration test and should be retained.

### RTH-R2-031 — Active-time updates are tested independently from visit counting

Verified positive test design

File lines 350–387.

The test first records a visit, then submits active-time increments without a session ID.

It checks that active time accumulates while visit count and session identity remain unchanged.

This directly supports the intended separation between engagement time and navigation visits.

## 3. Test coverage matrix

| Database behavior                           | Existing test coverage | Assessment                                  |
| ------------------------------------------- | ---------------------- | ------------------------------------------- |
| Five concurrent same-session visits         | Yes                    | Good                                        |
| Concurrent requests after first visit       | Yes                    | Good                                        |
| Concurrent transition to a new session      | Yes                    | Good                                        |
| Sequential session transitions              | Yes                    | Good                                        |
| Revision counting after completion          | Yes                    | Good                                        |
| No revision for incomplete blocks           | Yes                    | Good                                        |
| First-view timestamp preservation           | Yes                    | Missing unusual null-session case           |
| Soft-delete followed by recreation          | Yes                    | Good                                        |
| Active-time isolation from visit count      | Yes                    | Good                                        |
| Competing different sessions simultaneously | Not covered            | Add test                                    |
| Invalid canonical block identities          | Not covered here       | Requires service integration test           |
| Database rollback of telemetry event claims | Not covered here       | Requires transaction integration test       |
| Duplicate telemetry event delivery          | Not covered here       | Requires telemetry repository/service tests |

## 4. Principal Architect assessment

The test suite is structurally valuable. Unlike mocked unit tests, it is designed to exercise real PostgreSQL uniqueness constraints and atomic SQL updates.

However, test existence is not evidence of test success. Final certification needs actual database execution, migration consistency checks and verification of the intended test-environment isolation.

One additional priority is preserving the timestamp invariant regardless of prior session state. That should be tested before changing the SQL helper.

## 5. Updated ten-round audit tracker

| Round                                      | Status                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| 1 — Progress foundations                   | Source review recorded                                         |
| 2 — Progress services and repositories     | Active backlog closure                                         |
| 3 — Authoring, delivery and transformation | Source findings recorded; some dependencies remain             |
| 4 — Authentication and API boundaries      | Source findings recorded; complete route certification pending |
| 5 — Assignments and learner eligibility    | Not started                                                    |
| 6 — UI, layouts and components             | Not started                                                    |
| 7 — Hooks, caching and accessibility       | Not started                                                    |
| 8 — Remaining shared/application files     | Not started                                                    |
| 9 — Tests, CI and runtime validation       | Not started                                                    |
| 10 — Final reconciliation                  | Not started                                                    |

This pass closes the full-source reading of the 389-line PostgreSQL block-learning-state integration test file. It does not close the whole Round 2 backlog.

The next important unfinished source area is the navigation-progress repository's own concurrent completion tests and the telemetry event transaction tests, together with any remaining core service implementation ranges.

No repository files were modified, no tests were executed, and final architecture approval remains open.

# Real Tutorial Hub — Principal Architect Audit

Expanded audit batch · November 1, 2026 · Read-only GitHub review

Yes, targeting 50–60 files per audit round is reasonable for catching up, but only if we maintain two separate measures: files inspected and files fully certified line by line. A 500-line service needs more attention than a 10-line retired endpoint.

## Current audit position

Highest round reached

## 4 / 10

Current activity

Expanded backlog audit

Round 5 has not formally started. This batch covers outstanding Round 2–4 dependencies alongside additional RTH security and domain files.

I assembled a 55-file audit batch covering ILS routes, API authentication, assignment services, learner endpoints, tutorial-composer admin APIs and shared security components.

The first 20 files have been retrieved successfully in this pass. The review has already surfaced security boundaries worth examining closely.

## Initial findings

### RTH-BATCH-001 — Tutorial content and progress endpoints read identity-bearing headers

High · Trust-boundary verification

Files:

- `apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts`
- `apps/api-server/src/app/api/tutorial/progress/route.ts`

Both use request headers such as `x-brand` and `x-user-id`.

These headers are safe as identity inputs only when an upstream middleware or gateway has authenticated the request and replaced any untrusted caller-supplied values.

The next verification step is to trace the effective middleware and its deployment restrictions. Header use alone is not proof of spoofing.

### RTH-BATCH-002 — RTH content delivery includes learner identity in application logs

Medium · Confirmed logging concern

File: `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts`, approximately line 34.

The route logs the authenticated user ID.

Recommendation: Remove unnecessary per-request identity logging or replace it with appropriately protected correlation-based diagnostics.

### RTH-BATCH-003 — Legacy content-writing endpoint has been retired

Positive finding

File: `apps/realtutorialhub-web/src/app/api/content-manager/add-section/route.ts`.

The route is reduced to a small retired-endpoint response. This is consistent with moving tutorial authoring into the authenticated admin workflow and reduces the number of content-mutating entry points in the learner BFF.

This is a positive boundary, although it does not establish that all alternative authoring routes are safe.

## 2. Expanded batch results

Files targeted

# 55

Full file contents retrieved

# 54

One path was unavailable: `packages/validation/src/tutorial-section.ts`. All 54 retrieved files received an initial automated source scan; selected security-critical files received detailed manual examination. This is not yet 54 completed line-by-line certifications.

The batch spans RTH and the shared services it depends on.

| Workstream                                            | Files targeted |
| ----------------------------------------------------- | -------------- |
| ILS endpoints and authentication                      | 11             |
| RTH learner services and endpoints                    | 12             |
| SkillHubCore authoring administration                 | 9              |
| RTH administration and content persistence            | 10             |
| Shared authentication, interaction APIs and utilities | 13             |
| Total                                                 | 55             |

## 3. Further confirmed findings

### RTH-BATCH-004 — Legacy learner content endpoint declares personalized responses publicly cacheable

High · Confirmed

File: `apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts`, approximately lines 130–137.

The handler requires a user identity, retrieves content using that user ID and then sets:

```
response.headers.set('Cache-Control', 'public, max-age=3600');
```

This is unsafe as a default for potentially user-dependent responses. A shared cache could reuse a response between learners unless its cache key, deployment behavior and upstream controls prevent that.

The RTH BFF currently sets `private, no-store` on its own response, which is a useful safeguard, but does not justify a public caching policy at the upstream API boundary.

Recommendation: Make personalized content responses `private, no-store`; use a separately designed cache for content proven to be tenant-safe and user-independent.

### RTH-BATCH-005 — Shared admin publish route has authorization controls, but cache invalidation is not awaited

High · Confirmed consistency risk

File: `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/publish/route.ts`, lines 94–152.

The route performs administrator authentication, subtopic-access checks and brand-access checks before calling the composer service. This is an important positive discovery: this particular caller is not simply invoking the unprotected service without authorization.

However, publication is followed by:

```
invalidateTutorialDeliveryCache(
  existingTutorial.subtopicId
).catch(...);
```

The response may report successful publication even if cache invalidation subsequently fails.

Recommendation: Define an explicit cache-consistency guarantee. Where immediate visibility is required, use awaited invalidation or a reliable versioned/invalidation mechanism.

### RTH-BATCH-006 — RTH legacy publication can succeed in the database but return an error to the caller

High · Confirmed failure-mode risk

File: `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/publish/route.ts`, lines 52–108.

The route publishes content inside a database transaction. After that transaction commits, it calls `publishEvent()` and performs cache revalidation.

If event publishing throws, the catch handler returns HTTP 500, even though the content may already be published.

That can confuse an administrator into retrying an operation that has succeeded.

Recommendation: Adopt a transactional outbox or another reliable post-commit delivery mechanism. Return an accurate publication result and separately track indexing/event-delivery failures.

### RTH-BATCH-007 — Internal authentication middleware is fail-closed for configured trust modes

Verified positive design

File: `apps/api-server/src/middleware/internal-auth.middleware.ts`, lines 51–199.

The reviewed implementation rejects missing or mismatched internal secrets when internal authentication is required. It also requires a configured gateway trust secret before accepting gateway-origin identity headers.

This narrows the concern identified earlier: not every use of `x-user-id` is inherently untrusted. The critical task is verifying which routes invoke this middleware and whether their deployment prevents bypassing it.

## 4. Important reconciliation of earlier findings

The expanded review improves our understanding of RTH's actual security boundaries.

The SkillHubCore composer publication route explicitly authenticates administrators and checks brand and subtopic access. Therefore, the earlier missing service-level authorization checks should not be described as proof that this route is publicly exploitable.

The remaining problem is architectural: the composer service itself does not enforce the caller's authorization, so every other mutation caller must be examined.

Similarly, the ILS routes use shared authentication-context facilities, and those facilities have meaningful fail-closed secret validation. End-to-end authorization certification is still pending, but it would be inaccurate to describe all forwarded identity headers as automatically unsafe.

## 5. Fifty-to-sixty-file audit strategy

I recommend keeping the 50–60-file target for each remaining batch, but only treating a file as completed when all its source lines have been manually examined and any relevant caller, test or schema dependencies have been identified.

| Audit level | Definition                                                       | Counts toward full certification?         |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Inventory   | File discovered and categorized                                  | No                                        |
| Source scan | Full contents retrieved and checked for patterns                 | No                                        |
| Deep review | Implementation read with line-specific findings and dependencies | Yes, for that file's static review        |
| Verified    | Relevant tests/builds executed and behavior validated            | Yes, for the applicable verification gate |

This permits faster coverage without disguising source scans as completed audits.

## 6. Ten-round status

| Round                                   | Status                   |
| --------------------------------------- | ------------------------ |
| 1 — Progress foundations                | Source review recorded   |
| 2 — ILS services and persistence        | Backlog remains          |
| 3 — Content authoring and delivery      | Backlog remains          |
| 4 — Authentication and API boundaries   | Expanded with this batch |
| 5 — Assignments and learner eligibility | Not formally started     |
| 6 — UI pages and components             | Not started              |
| 7 — Hooks, caching, performance         | Not started              |
| 8 — Remaining shared dependencies       | Not started              |
| 9 — Integration tests, builds and CI    | Not started              |
| 10 — Final reconciliation               | Not started              |

Principal Architect verdict: The 55-file expanded batch has identified actionable issues involving personalized-response caching, cache-invalidation reliability and post-commit event delivery. It also confirmed important existing authorization safeguards.

The immediate accomplishment is 54 files retrieved and screened, not 54 files completely certified. No repository changes were made, no tests were executed, and final production sign-off remains withheld.

# RTH Principal Architect Audit — Expanded Review

Active backlog: Rounds 2–4 · Highest round reached: 4/10 · GitHub branch: `feature/project-llm-linux-worker`

I have now completed a focused line-by-line reading of six previously identified files covering assignment progression, project submission, learner progress and ILS completion endpoints.

## Findings from this pass

### RTH-EXP-001 — Assignment completion lacks tier eligibility checks

High · Confirmed

File: `apps/realtutorialhub-web/src/server/assignment.service.ts`, lines 114–135.

`startTier()` enforces content-flow completion or completion of the previous difficulty tier. However, `completeTier()` does not repeat those conditions.

It only checks whether the current tier was previously completed, then persists `self_completed`.

This means the service does not independently enforce the progression order at the point where a tier becomes complete.

Recommended correction: Revalidate tier eligibility when completing a tier, ideally within the same transaction as the state transition. The current API caller checks general assignment access, but not the specific tier prerequisite.

### RTH-EXP-002 — Assignment unlocking may depend on assignment completion itself

High · Cross-service policy conflict

Files:

- `assignment.service.ts`, lines 42–53
- `tutorial-progress.repository.ts`, lines 119–126

The assignment service calls `isSubtopicComplete()` to unlock the simplest assignment tier.

That repository method calculates overall tutorial completion rather than explicitly checking only learning-content completion.

If the completion policy includes assignment and project mastery, a learner must complete the assignment to unlock the assignment.

This reinforces the earlier architectural finding. The remediation should introduce a dedicated content-flow-complete predicate rather than reuse full-subtopic completion.

### RTH-EXP-003 — Legacy tutorial progress uses a read–modify–write pattern

High · Confirmed concurrency risk

File: `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`, lines 60–116.

The method:

1. Reads existing progress.
2. Merges a new block into an in-memory array.
3. Writes the resulting array back to the database.

The update has no expected-version predicate or database-side atomic set merge.

Concurrent completions can overwrite one another, resulting in lost progress.

A similar read–modify–write pattern appears in `resetProgress()`, meaning a reset can race with completion.

Recommended correction: Use atomic SQL merging or optimistic concurrency with bounded retries and explicitly defined reset behavior.

### RTH-EXP-004 — Project submission mixes Redis writes with a database transaction

High · Confirmed failure-mode risk

File: `apps/realtutorialhub-web/src/server/project.service.ts`, lines 153–206.

The service creates a database submission inside a transaction but also writes to Redis before the database transaction has committed.

Redis cannot participate in that PostgreSQL transaction.

Consequently, database rollback can leave a Redis marker referring to a submission that did not commit.

Separately, a QStash publishing failure after commit can cause the API operation to report failure even though a submission was saved.

Recommended correction: Make submission creation idempotent at the database level, commit first, and deliver background work reliably through an outbox or equivalent mechanism. Treat Redis as an auxiliary optimization, not the authority for uniqueness.

### RTH-EXP-005 — Project deliverable validation checks presence, not validity

Medium · Confirmed

File: `project.service.ts`, lines 82–93.

The service considers a repository, demo or document deliverable present when a corresponding field is truthy.

This permits arbitrary nonempty values without verifying that they are correctly structured URLs or valid permitted references.

The submission route accepts `z.record(z.unknown())`, so the API schema does not close the gap.

Recommended correction: Use a discriminated deliverable schema by project type, with appropriate field validation and reasonable size limits.

### RTH-EXP-006 — ILS completion endpoints correctly require internal authentication

Positive finding

Files:

- `apps/api-server/src/app/api/tutorial/ils/block-completion/route.ts`, lines 28–41
- `apps/api-server/src/app/api/tutorial/ils/complete-node/route.ts`, lines 33–46

Both invoke:

```
validateRequest(request, { requireInternalSecret: true })
```

They then construct learner identity from the validated context rather than accepting a user ID from the request body.

The node-completion route also resolves the required blocks server-side.

These are appropriate security boundaries and should be preserved.

They do not, by themselves, resolve the canonical block-membership and content-publication problems identified earlier.

## Review coverage and round tracker

| Measure                            | This continuation |
| ---------------------------------- | ----------------- |
| Files selected for detailed review | 6                 |
| Combined source lines              | 1,142             |
| New findings                       | 6                 |
| Source modifications               | 0                 |
| Tests executed                     | 0                 |

The six files above have been examined in full at the source level. Their runtime behavior, database transaction boundaries and integration tests are not yet certified.

| Round                                          | Current status                                           |
| ---------------------------------------------- | -------------------------------------------------------- |
| 1 — Progress foundations                       | Source review recorded                                   |
| 2 — ILS and progress persistence               | Backlog closure ongoing                                  |
| 3 — Content authoring and delivery             | Backlog closure ongoing                                  |
| 4 — Authentication and API boundaries          | Findings recorded; verification outstanding              |
| 5 — Assignments and projects                   | Early source review performed; formal round not complete |
| 6–8 — UI, shared services and remaining source | Not started                                              |
| 9 — Tests, CI and runtime validation           | Not started                                              |
| 10 — Final reconciliation and sign-off         | Not started                                              |

## Principal Architect decision

The most important newly confirmed problem is the assignment progression rule: the service enforces eligibility when starting a tier but not when completing it. The project workflow also has a transaction-integrity gap because Redis writes and background-message publication are not atomic with the database.

For the next large batch, the priority should be assignment repositories, project submission and review workers, certificate issuance, remaining ILS integration tests, and the actual learner-facing UI that invokes these services.

The 50–60-file target remains appropriate for batch discovery and initial screening. For genuine line-by-line certification, the number completed must reflect actual reading depth, regardless of the batch target. This preserves audit speed without overstating coverage.

No changes have been made to the repository.

# Real Tutorial Hub — Principal Architect Audit

Branch: `feature/project-llm-linux-worker` · Read-only review · November 1, 2026

## Current audit status

Active focus: Round 5 — Assignments, projects and certificates

In progress

Highest numbered round reached

5 / 10

Rounds 2 and 3 retain previously disclosed deep-reading and verification gaps. Round 4 has source findings but is not certified. Round 5 now has additional full-file source reviews.

Yes, we can organize the remaining work in 50–60-file batches. However, I will report the actual number reviewed in each pass, not assume the batch target has been met.

In this continuation, I retrieved and examined six complete files, totaling 1,033 source lines, including assignment persistence, project state transitions, badge awarding and certificate issuance.

## 1. New high-priority findings

### RTH-R5-001 — Badge worker can permanently suppress retries after a failure

Critical · Confirmed failure mode

File: `apps/realtutorialhub-web/src/app/api/workers/award-project-badge/route.ts`, lines 52–89.

The worker writes a Redis marker with value `processing` and a 24-hour expiration before loading the submission and performing its database transaction.

If a database operation fails after the marker is written, the worker returns an error. A subsequent retry checks the existing marker and responds that the duplicate should be ignored.

Impact: A transient database failure can prevent badge processing for the remainder of the marker's lifetime.

The marker is not the same as a durable record of successful processing.

Required correction: Use a processing state that distinguishes in-progress, completed and failed attempts, with recoverable leases or database-backed idempotency. Only acknowledge an event as completed once its durable effects exist.

### RTH-R5-002 — Certificate issuance has the same retry-suppression problem

Critical · Confirmed failure mode

File: `apps/realtutorialhub-web/src/app/api/workers/issue-certificate/route.ts`, lines 43–95.

This worker also claims a Redis key as `processing` before performing database operations.

Any failure after that claim can cause the next delivery attempt to be dismissed as a duplicate.

The risk is especially important for certificate issuance, where an approved learner may never receive the expected certificate without intervention.

Required correction: Make the certificate database record the durable idempotency authority. Add safe retry behavior and explicit recovery from abandoned processing claims.

### RTH-R5-003 — Project submission state transitions have a concurrency race

High · Confirmed

File: `packages/db-tutorial/src/repositories/project.repository.ts`, lines 114–163.

The repository reads the current submission status, checks an allowed-transition table and then updates by submission ID.

Its update predicate does not require the previously observed status or version.

Two competing transitions can both pass validation against the same earlier state and then overwrite each other.

Required correction: Include the expected state or version in the conditional update. Return a conflict when a concurrent transition wins.

### RTH-R5-004 — Badge worker does not independently verify submission approval

High · Confirmed code-path gap

File: `award-project-badge/route.ts`, lines 65–89.

The worker retrieves the submission but does not check that its persisted status is `approved` before awarding the badge and setting `badgeAwarded = true`.

The signed-event boundary is important and should be retained. Nevertheless, a signed event does not replace the business rule that the authoritative database submission must be approved and belong to the expected learner and project.

Required correction: Validate the submission's status, user ID and project ID inside the transactional award operation.

### RTH-R5-005 — Worker event types are inconsistent between their validation schemas and handlers

High · Confirmed source inconsistency

Two files show mismatched event-type declarations:

| Worker                         | Payload schema expects          | Event handler configured for |
| ------------------------------ | ------------------------------- | ---------------------------- |
| `award-project-badge/route.ts` | `project.approved`              | `PROJECT_SUBMITTED`          |
| `issue-certificate/route.ts`   | `project.certificate_requested` | `CERTIFICATE_ISSUED`         |

The source establishes the mismatch. Whether this prevents event processing outright depends on the implementation of `createQStashHandler()` and the corresponding event constants, which still need to be verified.

Recommendation: Define separate event types for commands and completion notifications. Make the handler's accepted event match its schema, and add a signed-event integration test for each worker.

### RTH-R5-006 — Assignment persistence does not enforce lifecycle transitions

High · Confirmed

File: `packages/db-tutorial/src/repositories/assignment.repository.ts`, lines 79–131.

`upsertProgress()` accepts a requested assignment status and writes it directly.

It does not require a valid prior state or enforce tier prerequisites. The surrounding service is therefore the only business-policy boundary.

This reinforces the earlier finding that `completeTier()` can mark a tier complete without repeating its eligibility check.

The appropriate correction is an explicit lifecycle transition policy, enforced at the authoritative service boundary and protected against concurrent updates.

### RTH-R5-007 — Certificate issuance trusts the event without rechecking eligibility

High · Confirmed service-path gap

File: `issue-certificate/route.ts`, lines 38–91.

The worker validates the event structure, checks for an existing certificate and inserts a new certificate.

It does not independently confirm that the learner still meets the domain eligibility rules for the requested scope.

A verified event can be legitimate but stale. Certificate issuance should either revalidate eligibility or consume a durable, authorized approval decision.

## 2. Positive findings

The reviewed code also contains important safeguards.

- Project submissions have an explicit allowed-transition table rather than unrestricted status changes.
- Badge awards use database conflict handling to reduce duplicate insertions.
- Both workers use QStash signature-aware handlers and Zod event schemas.
- Certificate issuance checks for an existing certificate before inserting another.
- Assignment authentication tests cover missing tokens, invalid brands and invalid learner identities.

These mechanisms should be preserved while correcting their surrounding state-management weaknesses.

## 3. Actual coverage in this continuation

| Measure                            | Result |
| ---------------------------------- | ------ |
| Files fully retrieved and examined | 6      |
| Source lines examined              | 1,033  |
| Findings recorded                  | 7      |
| Repository modifications           | 0      |
| Test executions                    | 0      |
| Target batch size                  | 50–60  |

I am not claiming that the remaining 44–54 files were reviewed. The target is a planning quantity, not an audit result.

## 4. Principal Architect priority order

The first remediation priority is the badge and certificate worker reliability problem: events can be acknowledged as duplicates even though their database effects have not completed.

Next are event-type contract alignment, authoritative eligibility validation, and atomic state transitions for assignments and project submissions.

The ten-round programme has now reached Round 5 of 10, with Round 5 still in progress. Earlier outstanding work from Rounds 2 and 3 remains open and must be reconciled before final architecture certification.

Current sign-off: Not approved. This conclusion reflects source-level defects; no production exploit, runtime failure or test result is being claimed without corresponding evidence.

# Real Tutorial Hub — Principal Architect Audit

November 1, 2026 · Branch: `feature/project-llm-linux-worker` · Read-only

Current active round: Round 5 of 10 — Assignments, projects and certificates. Rounds 2–4 still have outstanding reconciliation or verification work.

For this continuation, I retrieved and read 12 complete files, including the project-review worker, assignment APIs, authorization helper and six database schemas. These are complete static source readings, not executed tests.

## Newly confirmed findings

### RTH-R5-008 — The project-review worker can suppress retries after failure

Critical · Confirmed failure path

File: `apps/realtutorialhub-web/src/app/api/workers/review-project/route.ts`, approximately lines 51–116.

The worker writes a Redis key containing `processing` before loading and updating the project submission.

If subsequent work fails, the key remains. On retry, the existing key causes the worker to return HTTP 200 with a duplicate-event response.

This reproduces the same reliability failure already identified in the badge and certificate workers.

Required correction: Use recoverable processing leases, durable completion records or database-backed idempotency. A processing claim must not be interpreted as successful completion.

### RTH-R5-009 — Assignment retrieval does not filter unpublished assignments

High · Confirmed

Files:

- `packages/db-tutorial/src/repositories/assignment.repository.ts`, lines 44–53.
- `packages/db-tutorial/src/schema/tutorial-assignments.ts`, lines 7–26.

The schema defines `isPublished`, but `getAssignments()` filters only by subtopic, difficulty and soft-delete status.

The learner assignment endpoint calls that repository through `AssignmentService`.

Impact: After the learner satisfies the unlocking policy, draft or unpublished assignments may be returned alongside published assignments.

Required correction: Apply `isPublished = true` to learner-facing retrieval and expose draft assignments only through separately authorized administration operations.

### RTH-R5-010 — Project-review worker does not check event ownership against database records

High · Confirmed missing validation

File: `review-project/route.ts`, approximately lines 69–92.

The worker loads the submission and project using IDs from the signed event.

It does not verify that the persisted submission's `userId` and `projectId` equal the event's values.

Signed event provenance does not eliminate the need for domain identity validation, especially when event producers or replay mechanisms can generate inconsistent payloads.

Required correction: Validate event-to-record ownership before making any state transition.

### RTH-R5-011 — Assignment helper allows help requests before tier access is established

Medium / High · Policy-dependent

Files:

- `apps/realtutorialhub-web/src/app/api/tutorial/assignments/help/route.ts`, lines 8–30.
- `apps/realtutorialhub-web/src/server/assignment.service.ts`, lines 137–157.

The route requires an authenticated RTH user, and the service verifies that the assignment belongs to the requested subtopic.

Neither checks whether that learner has unlocked the corresponding assignment tier.

This may be deliberate if help requests are allowed before starting an assignment. If not, it is an eligibility bypass.

Recommendation: Explicitly define and test the help-request eligibility policy rather than relying on the general authenticated-user check.

## Additional findings from assignment and project tests

### RTH-R5-012 — Assignment completion test explicitly permits completion without a started tier

High · Confirmed regression-test weakness

File: `apps/realtutorialhub-web/src/server/__tests__/assignment.service.test.ts`, approximately lines 123–149.

The test calls `completeTier()` with no existing progress record, then expects successful completion.

That confirms the gap is reflected in the test contract, not merely an accidental missing check in the implementation.

Required correction: Define valid tier transitions, reject unauthorized `not_started → self_completed` progression if the intended workflow requires starting first, and update the regression test accordingly.

### RTH-R5-013 — Assignment repository tests cannot detect unpublished-content disclosure

Medium · Confirmed test gap

File: `packages/db-tutorial/src/repositories/__tests__/assignment.repository.test.ts`, approximately lines 43–79.

The assignment retrieval test contains only a published assignment and verifies that one record is returned.

It does not include an unpublished record to verify that the learner-facing repository excludes drafts.

The existing mock also returns predefined rows without evaluating database predicates.

Required correction: Add a query-level or PostgreSQL-backed test with published and unpublished assignments.

### RTH-R5-014 — Project submission tests do not cover failure recovery

High · Confirmed coverage gap

File: `apps/realtutorialhub-web/src/server/__tests__/project.service.test.ts`.

The tests cover successful submission, missing prerequisites, existing Redis markers, project retrieval and certificate eligibility.

They do not simulate Redis failure, database rollback, simultaneous duplicate submissions or QStash publication failure after commit.

These are precisely the failure paths that require verification before project workflows can be considered reliable.

### RTH-R5-015 — Project vector-index worker has a stronger retry pattern, with remaining race concerns

Medium · Follow-up verification

File: `apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts`.

Unlike the project-review, badge and certificate workers, the vector-index worker deletes its Redis processing marker when content is missing or vector indexing fails.

That is a positive reliability distinction.

However, the initial marker deletion and subsequent claim are separate Redis operations. Competing versions and concurrent deliveries require additional testing to establish that an older event cannot overwrite the result of a newer indexing operation.

## Audit coverage for this continuation

| Measure                  | Result |
| ------------------------ | ------ |
| Files targeted           | 24     |
| Files retrieved          | 19     |
| Paths not found          | 5      |
| Full-file static reviews | 19     |
| Tests executed           | 0      |
| Repository files changed | 0      |

Round status: Round 5 of 10 remains active. The highest numbered round reached is 5. Rounds 2 and 3 retain outstanding work and are not silently counted as completed.

The next highest-priority verification work is the signed-event handler contract and the database-backed tests for worker retries, project submission uniqueness, assignment publication filtering and assignment state transitions.

A 50–60-file target remains appropriate for planning larger batches, but this continuation completed 19 full-file static reviews. I will continue to distinguish that verified scope from the requested batch target and from runtime testing.

# Real Tutorial Hub — Principal Architect Audit

November 1, 2026 · Read-only · Branch: `feature/project-llm-linux-worker`

## Current audit round

Round 5 / 10 — Active

Not certified

Focus: Event processing, project completion, remediation and certificate reliability.

I continued the source review into the shared event infrastructure and remediation service. This is especially important because the previous Round 5 findings concerned QStash event contracts, retry suppression and inconsistent learner progression.

## 1. Findings confirmed by tracing the event infrastructure

### RTH-R5-016 — Project-submission producer and shared event schema disagree

Severity: High — confirmed contract mismatch

The project-submission workflow builds an event containing `submissionId`, `userId` and `projectId`.

However, `packages/events/src/types.ts:87` defines the `PROJECT_SUBMITTED` payload using `userId`, `projectId` and `submittedAt`.

The producer's event cannot satisfy that registered payload schema as written. The project-review worker supplies its own broader schema, so its actual acceptance depends on that custom validation path.

Correction: Establish one canonical event schema and use it in producers, consumers and tests. Eliminate competing definitions for the same event.

### RTH-R5-017 — Shared event-consumer idempotency claims are recorded before handler success

Severity: High — confirmed design weakness

File: `packages/events/src/consumer.ts:58–74`.

When an `idempotencyStore` is configured, `createQStashHandler()` records the event key before calling the handler.

If the handler subsequently throws, that recorded key can cause a retry to be acknowledged as a duplicate even though processing failed.

The reviewed workers use their own Redis claims rather than passing this option, but the shared abstraction has the same underlying weakness.

Correction: Record durable completion only after successful processing, or implement recoverable processing leases with explicit failure handling.

### RTH-R5-018 — Event handler types are not enforced when a custom schema is supplied

Severity: High — confirmed framework weakness

File: `packages/events/src/consumer.ts:38–58`.

The consumer accepts both a declared event type and an optional custom schema:

```
(options.schema ?? PlatformEventEnvelopeSchemas[type]).parse(...)
```

When `options.schema` is provided, there is no separate comparison against the `type` argument.

This explains why a handler configured with one event type can validate a different event type through its custom schema.

The earlier badge and certificate event mismatches therefore represent a genuine contract-enforcement gap, although they do not necessarily mean the handlers reject every incoming message.

Correction: Validate the parsed envelope's `type` against the handler's declared type regardless of custom schema.

## 2. Remediation service findings

### RTH-R5-019 — Creating a remediation plan resets existing learner progress

Severity: High — confirmed data-integrity concern

File: `apps/realtutorialhub-web/src/server/remediation.service.ts`, in `createPlan()`.

The service upserts remediation progress using `onConflictDoUpdate()` and assigns:

```
status: 'not_started',
blocksCompleted: [],
completedAt: null,
```

These assignments apply even when a learner already has completed content.

Impact: Creating or regenerating a remediation plan may erase the learner's existing completion state.

This should be an explicit educational policy, not an incidental side effect of a remediation upsert.

Correction: Store remediation attempts separately from canonical tutorial completion, or preserve canonical progress when creating a remediation plan.

### RTH-R5-020 — Remediation can directly mark tutorial progress completed

Severity: High — confirmed policy-boundary concern

File: `remediation.service.ts`, `markSubtopicRemediated()`.

The service directly updates `tutorialProgress.status` to `completed`.

It does not evaluate the authoritative instructional-block completion policy used by the newer learning-progress system.

This creates another path through which subtopic completion can be set without satisfying the same canonical requirements.

Correction: Define whether remediation completion is independent of tutorial completion. If both contribute to the same status, enforce one shared eligibility policy.

### RTH-R5-021 — Remediation idempotency key omits learner identity

Severity: Medium — confirmed design issue

File: `remediation.service.ts`, `createPlan()`.

The Redis key uses only `examResultId`:

```
const redisKey = `remediation:${examResultId}`
```

The database query correctly scopes the record by both `userId` and `examResultId`.

If exam-result identifiers are globally unique, the Redis design may work. If that uniqueness is not guaranteed, different learners could interfere with one another's processing claims.

Correction: Include the learner identity in the key or formally enforce globally unique exam-result identifiers.

## 3. Files examined in this continuation

| File                                                                          | Lines | Review   |
| ----------------------------------------------------------------------------- | ----- | -------- |
| `packages/events/src/index.ts`                                                | 5     | Complete |
| `packages/events/src/types.ts`                                                | 148   | Complete |
| `packages/events/src/publisher.ts`                                            | 60    | Complete |
| `packages/events/src/consumer.ts`                                             | 77    | Complete |
| `packages/events/src/consumer-map.ts`                                         | 25    | Complete |
| `packages/db-tutorial/src/schema/tutorial-progress.ts`                        | 24    | Complete |
| `packages/db-tutorial/src/schema/enums.ts`                                    | 35    | Complete |
| `apps/realtutorialhub-web/src/server/remediation.service.ts`                  | 469   | Complete |
| `apps/realtutorialhub-web/src/app/api/tutorial/projects/[projectId]/route.ts` | 43    | Complete |

Complete files examined

# 9

Source lines

# 886

Three additional guessed event-file paths were unavailable and are not counted. No tests were executed.

## 4. Principal Architect assessment

The most significant observation is that RTH currently has multiple mechanisms capable of changing learner completion and achievement state, without one unified authority over progression.

The highest-priority architectural work is to establish reliable event processing and a single source of truth for educational completion.

The 50–60-file batch target remains valid for organizing work, but this continuation verified nine complete source files. I am not treating the remaining files in the target as reviewed.

Round status: 5 of 10, ongoing. Final architecture sign-off remains withheld.

# RTH Principal Architect Audit — 60-File Batch

November 1, 2026 · Read-only · `feature/project-llm-linux-worker`

This pass reaches the larger batch size you requested. I retrieved and screened 60 files across the learning-progress, tutorial, assignment, project, worker, event and authentication systems.

Files retrieved

# 60

Fetch failures

# 0

Round reached

# 5/10

This is a 60-file source-screening batch, not 60 newly completed line-by-line certifications. Several files were previously reviewed in depth; others still require manual source certification.

The source references and branch revisions were checked again, including the main progress repositories, authoring services, assignment repositories, project workers, integration tests and shared event contracts.

The main concern remains consistency across the whole learner lifecycle: content eligibility, assignment unlocking, project approval, badge awarding and certificate issuance must use authoritative, race-safe state transitions.

## New findings from the 60-file cross-check

### RTH-R5-022 — Certificate uniqueness is not enforced by the database

High · Confirmed schema and worker race

Files:

- `packages/db-tutorial/src/schema/certificates.ts`, lines 5–23
- `apps/realtutorialhub-web/src/app/api/workers/issue-certificate/route.ts`, lines 56–91

The schema has a unique index on `verificationCode`, but not on the logical certificate identity `(userId, scope, parentId)`.

The worker first checks for an existing certificate and then inserts one. Two concurrent requests can both observe no existing certificate and create duplicates.

Required correction: Add a database uniqueness constraint for the intended active certificate identity, using a partial unique index if reissuance after soft deletion is permitted. Use an atomic insert with conflict handling.

### RTH-R5-023 — Project submission does not enforce publication status

High · Confirmed

Files:

- `packages/db-tutorial/src/schema/tutorial-projects.ts`, line 24
- `apps/realtutorialhub-web/src/server/project.service.ts`, lines 134–151

The project schema includes `isPublished`, but `submitProject()` only checks that the project exists, that its prerequisite subtopics are complete, and that a deliverable was supplied.

There is no check that `project.isPublished` is true.

Impact: A learner who knows a draft project's ID may submit work against an unpublished project.

Required correction: Enforce publication and learner eligibility inside the project submission service, not merely in the UI.

### RTH-R5-024 — Project submissions have no database-enforced idempotency identity

High · Confirmed design gap

Files:

- `packages/db-tutorial/src/schema/tutorial-project-submissions.ts`, lines 7–33
- `apps/realtutorialhub-web/src/server/project.service.ts`, lines 153–188

The submission table has indexes on user, project and status, but no uniqueness constraint preventing concurrent duplicate submissions under the same logical submission identity.

The Redis marker does not close that database race, particularly because the database insertion and marker update are not atomic with one another.

Required correction: Define the permitted submission model—one active submission per learner/project, or multiple versioned attempts—and enforce that model in the database.

## Consolidated 60-file batch ledger

| Area                                           | Files screened | Certification status                              |
| ---------------------------------------------- | -------------- | ------------------------------------------------- |
| Progress, authoring and supporting services    | 15             | Earlier reviews exist; reconciliation open        |
| Assignment, project and database schemas       | 15             | Core files previously examined; verification open |
| Worker, learner APIs and event contracts       | 15             | Core source reviewed; runtime verification open   |
| Authentication, transformation and test suites | 15             | Mixed deep-review coverage; tests not executed    |
| Total                                          | 60             | 60 screened; not 60 newly certified               |

This batch intentionally rechecked several previously examined files because new defects become apparent when the schemas, services, workers and test contracts are compared together. It should not be interpreted as 60 additional unique files beyond the prior audit history.

## Ten-round status

| Round                                     | Status                                      |
| ----------------------------------------- | ------------------------------------------- |
| 1 — Progress foundations                  | Source findings recorded                    |
| 2 — Learning-progress services            | Backlog open                                |
| 3 — Tutorial authoring and delivery       | Backlog open                                |
| 4 — Authentication and API security       | Source findings recorded; verification open |
| 5 — Assignments, projects, achievements   | Active                                      |
| 6 — Pages, layouts and components         | Not started                                 |
| 7 — State, caching and accessibility      | Not started                                 |
| 8 — Remaining application and shared code | Not started                                 |
| 9 — Runtime tests, builds and CI          | Not started                                 |
| 10 — Final reconciliation and sign-off    | Not started                                 |

## Principal Architect decision

The 60-file batch confirms three additional cross-layer defects: certificates lack logical database uniqueness, project submissions do not enforce project publication, and submission idempotency is not guaranteed by the database.

The next audit priority is closing the outstanding Round 5 implementation and integration-test issues, followed by the learner-facing UI and client-state surfaces in Rounds 6 and 7.

Current status: Round 5 of 10. Sixty files screened in this batch, zero files modified, zero tests executed, and final architecture sign-off not approved.

# RTH Principal Architect Audit — Round 6

This continuation covers 51 successfully retrieved UI and shared-frontend files, rather than another 6–10-file backend pass. They span dashboard routes, layouts, authentication, learning widgets, data providers, onboarding, navigation and styling.

The review has also exposed a significant new issue in the learner-facing Tutorial Engine dashboard.

## Audit results

New files retrieved and screened

# 51

Highest round reached

# 6 / 10

The batch includes full source retrieval and targeted line-level examination. It does not mean all 51 files have passed exhaustive manual line-by-line certification. No tests were executed.

## Critical findings

### RTH-R6-001 — Tutorial dashboard displays fabricated learner progress

High · Confirmed

File: `src/share-branding/tutorialDashboardData.ts`, lines 106–253.

The dashboard builder uses fixed information:

- Learner name: `Suresh`
- Streak: `16`
- XP: `2,450`
- Overall progress: `68%`
- Assignment count: `3`
- Project completion percentages and career-readiness scores: hard-coded

The route `apps/realtutorialhub-web/src/app/tutorial/page.tsx`, lines 10–14, calls this builder without retrieving the authenticated learner's actual progress.

Impact: Learners can see someone else's example name and fictional performance data presented as their own progress.

Required correction: Load authenticated, brand-scoped learner information from authoritative APIs. Until integration is complete, label these values explicitly as sample data or remove them.

### RTH-R6-002 — Tutorial dashboard has interactive-looking controls without actions

Medium · Confirmed

Files:

- `TutorialDashboard/components/TutorialTopBar.tsx`, lines 31–58
- `TutorialDashboard/TutorialEngineDashboardPage.tsx`, lines 83–100
- `TutorialDashboard/components/EngineSynchronizationWidget.tsx`, lines 105–114

The Settings, Notifications, User Menu, AI Tutor Support and Auto-Deploy buttons are displayed without click handlers or navigation.

Impact: Learners cannot perform the actions the UI promises.

Required correction: Connect each button to its intended workflow. If a feature is not available, present a disabled or clearly identified forthcoming state rather than a functioning-looking action.

### RTH-R6-003 — Dashboard data-failure fallback is deliberately non-fatal

Positive architecture finding

File: `src/share-branding/dashboardResolver.ts`, lines 17–37.

The standard dashboard attempts to load authenticated profile information and falls back to minimal dashboard data when profile retrieval fails.

This is a reasonable resilience mechanism, provided the fallback is visibly distinguished from actual learner progress.

The separate `dashboardMinimalData.ts` implementation includes an `isFallback` marker, which supports a more transparent degraded-state experience.

## UI audit priorities

| Priority | Area                | Required verification                                     |
| -------- | ------------------- | --------------------------------------------------------- |
| P0       | Learner metrics     | Remove fabricated personal data                           |
| P1       | Dashboard controls  | Connect or disable nonfunctional actions                  |
| P1       | Authentication      | Verify page-level protection of every learner route       |
| P1       | Learning navigation | Ensure links resolve to implemented pages                 |
| P2       | Accessibility       | Keyboard, focus, screen reader and mobile testing         |
| P2       | Performance         | Component loading, cache behavior and request duplication |

## Ten-round tracker

| Round                                    | Status                               |
| ---------------------------------------- | ------------------------------------ |
| 1 — Progress foundations                 | Reviewed; verification open          |
| 2 — ILS services and persistence         | Backlog open                         |
| 3 — Authoring and delivery               | Backlog open                         |
| 4 — Authentication and API boundaries    | Findings recorded; verification open |
| 5 — Assignments and achievements         | Findings recorded; verification open |
| 6 — Learner pages and components         | Active — 51 files screened           |
| 7 — Hooks, caching and accessibility     | Not started                          |
| 8 — Remaining shared dependencies        | Not started                          |
| 9 — Tests, builds and runtime validation | Not started                          |
| 10 — Final reconciliation                | Not started                          |

Principal Architect conclusion: This larger batch establishes that the Tutorial Engine dashboard currently relies on static demonstration data for learner-facing progress and contains controls that are not connected to actions. These should be addressed before presenting the dashboard as production-ready.

Current audit: Round 6/10. Repository unchanged. Final sign-off withheld.

Yes. We should divide the remaining RTH architecture audit into smaller, objective-driven phases, grouped into 50–60-file review batches. This will make the audit easier to complete and track without sacrificing the line-by-line standard.

Based on the repository review so far and the supplied architecture and audit reports, I recommend moving from a simple ten-round sequence to a phase-gated audit plan.

The original ten rounds will remain in the ledger so that no previous findings or unfinished work disappear.

## Proposed completion plan

Original rounds reached

## 6 / 10

New completion phases

## 6

Round 6 has been reached, not completed. Rounds 2–5 also contain unresolved findings or verification gaps.

Each phase ends with a file-coverage ledger, finding register, dependency checks, and an explicit pass / fail / blocked decision.

Phase A — Close backend and security backlog

Original rounds 2–4 · 50–60 files per batch

Finish the incomplete progress services, repositories, tutorial publishing, authorization boundaries, brand isolation and associated tests.

Exit gate: All targeted backend files reviewed, authorization paths traced, and high-risk concurrency and canonical-content issues classified.

Phase B — Learner lifecycle and achievements

Original round 5 · 50–60 files per batch

Complete assignments, projects, remediation, badges, certificates, QStash workers and their persistence contracts.

Exit gate: Every transition has a defined authority, retry behavior, eligibility policy and regression-test requirement.

Phase C — Learner UI and learning experience

Original round 6 · 50–60 files per batch

Review page routes, layouts, tutorial block renderers, navigation, assignments, project views, responsive behavior and accessibility.

Exit gate: UI actions mapped to implemented workflows, learner data verified as authentic, navigation checked and accessibility risks recorded.

Phase D — State, performance and remaining dependencies

Original rounds 7–8 · 50–60 files per batch

Audit React hooks, client caching, invalidation, shared branding, gateway contracts, dependencies, background execution and scalability.

Exit gate: No undocumented ownership of state or caching; key performance and brand-isolation assumptions identified for testing.

Phase E — Test and infrastructure evidence

Original round 9 · Scope based on test/config inventory

Review CI, migrations, database constraints, security tests, API tests, build configuration and deployment controls.

Exit gate: Actual execution evidence recorded wherever available; unexecuted tests and inaccessible infrastructure explicitly marked unverified.

Phase F — Reconciliation and architecture verdict

Original round 10 · Evidence-based sign-off

Reconcile the current branch against `FinalAechitecture.md`, `ProjectAuditReport.md`, and `ResolveProjectAuditReport.md`, deduplicate findings and verify the status of previously reported fixes.

Exit gate: Final architecture report with an issue register, unresolved risks, completed evidence and production-readiness decision.

## Implementation started: Phase A backlog closure

I also closed previously unread source ranges in two backend files on `feature/project-llm-linux-worker`:

| File                             | Newly examined ranges  | Result                                                                           |
| -------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `tutorial-composer.service.ts`   | 1–35, 165–195, 525–547 | No additional defect established in these ranges                                 |
| `tutorial-section.repository.ts` | 1–115, 200–245         | Existing brand-resolution concerns remain; no additional defect established here |

These readings help close Round 3's source-coverage backlog. They do not resolve the previously reported authorization, optimistic-concurrency or brand-precedence findings.

## How every phase will be measured

Phase A completion checklist

1 of 6

All targeted files inventoried with path and commit SHA

Each source range examined and recorded

Cross-file callers, schemas and trust boundaries traced

Findings classified as confirmed, conditional or unverified

Relevant regression tests identified and execution status recorded

Phase completion decision issued with blockers

Working acceptance checklist. Checked items are planning markers, not automated evidence or formal certification.

One important distinction in the existing source material: `ProjectAuditReport.md` records earlier findings against `main`, while the current audit is against `feature/project-llm-linux-worker`. Those findings must be reverified against the current branch, not automatically treated as still present or fixed. Similarly, activity recorded in `ResolveProjectAuditReport.md` is not by itself proof that a correction works.

For every phase, the final evidence register should contain the file path, commit SHA, reviewed line range, finding ID, severity, impact, correction, test requirement and verification status.

My recommendation is to finish Phase A's remaining gaps before formally closing it, while preparing 50–60 unique files for each subsequent phase. This prevents another large source scan from hiding incomplete certification.

Current status: Phase A active; original audit reached Round 6/10; no repository modifications or test executions in this continuation.

# Real Tutorial Hub — Principal Architect Audit

Phase A: Backend backlog closure · November 1, 2026 · Branch: `feature/project-llm-linux-worker`

I continued the line-by-line source review and closed previously unexamined ranges in the tutorial composer, tutorial-section repository, learning-progress service and progress repositories.

## 1. Review progress

Current completion phase\
Phase A of 6

Original audit rounds reached

6 / 10

Files advanced in this pass

# 5

Source modifications

# 0

This pass closes outstanding reading ranges in large files rather than counting previously screened files again. No tests were executed.

## 2. Findings

### PA-A-001 — A hard-coded learner-block UUID remains in production DTO code

Severity: Medium — Confirmed

File: `packages/db-tutorial/src/services/learning-progress.service.ts:1119–1128`

The `toDTO()` implementation contains a forensic logging condition tied to one exact block UUID:

```
if (state.blockId === '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749') {
  console.log('[GATE H FORENSIC] D1 completedAt in toDTO():', {
    blockId: state.blockId,
    blockVersion: state.blockVersion,
    'block_learning_state.completedAt': state.completedAt,
    'resolveBlockCompletedAt() result': completedAt,
    'canonical completed_blocks count': record.completedBlocks.length,
  });
}
```

This is debugging instrumentation, not a functional requirement for learner progress.

Impact: Unexpected console logging for the matching block, unnecessary exposure of internal learner-progress diagnostics, and residual debugging logic in the service.

Required correction: Remove the hard-coded forensic branch. Use controlled, redacted diagnostics if completion reconciliation still requires investigation.

### PA-A-002 — Composer status updates do not enforce documented transitions

Severity: High — Confirmed, previously identified risk strengthened

File: `packages/db-tutorial/src/services/tutorial-composer.service.ts:322–355`

The service compares the existing and requested status and returns early when they match. Otherwise, it forwards the requested status to the repository.

There is no transition matrix or approval-policy validation in this method.

The repository can also set `publishedAt` when the supplied status is `deployed`, independently of `publishTutorial()`.

Impact: A caller with access to the status update operation may bypass the intended publishing checks.

Required correction: Enforce an explicit status transition matrix and prohibit direct deployment without the publication policy.

### PA-A-003 — Tutorial content update and append still lack optimistic concurrency

Severity: High — Confirmed existing finding

Files:

- `tutorial-composer.service.ts:271–316`
- `tutorial-composer.service.ts:456–524`
- `tutorial-section.repository.ts:389–416`

Both service paths use the repository's unconditional `updateTutorialContent()` operation.

The repository separately provides `updateTutorialContentWithVersion()`, but these two service methods do not use it.

Impact: Concurrent editors can overwrite each other's changes, including appended blocks.

Required correction: Require an expected version from callers and perform conditional updates. Return a conflict rather than silently overwriting a newer document.

### PA-A-004 — Brand-specific content precedence is not guaranteed

Severity: High — Confirmed existing finding

File: `tutorial-section.repository.ts:120–146`

The query accepts both an exact brand and the shared brand but uses `LIMIT 1` without ordering candidates by preference.

Impact: When both records exist, the selected content is not guaranteed to be the exact-brand version.

Required correction: Rank exact-brand matches ahead of shared fallback and test both candidates together.

## 3. Review coverage ledger

| File                                         | Newly covered ranges                                      | Source status                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `tutorial-composer.service.ts`               | 1–35, 35–164, 165–195, 196–325, 326–455, 456–524, 525–547 | All source ranges accounted for                                                                                |
| `tutorial-section.repository.ts`             | 1–115, 116–199, 200–245, 246–360, 361–475, 476–578        | All source ranges accounted for                                                                                |
| `learning-progress.service.ts`               | 1–134, 520–584, 680–719, 1085–1135, 1118–1201             | Previously reviewed middle ranges remain part of the ledger; complete certification needs final reconciliation |
| `tutorial-navigation-progress.repository.ts` | 95–219, 360–379                                           | Remaining previously reviewed ranges require final reconciliation                                              |
| `block-learning-state.repository.ts`         | 1–119                                                     | Complements previously reviewed repository ranges                                                              |

## 4. Phase A exit assessment

| Requirement                                          | Status                        |
| ---------------------------------------------------- | ----------------------------- |
| Composer implementation source coverage              | Complete                      |
| Tutorial-section repository source coverage          | Complete                      |
| Learning-progress repository coverage reconciliation | Open                          |
| Authorization caller trace                           | Partially complete            |
| Brand-precedence policy                              | Finding confirmed; unresolved |
| Content-update concurrency                           | Finding confirmed; unresolved |
| Regression and database tests                        | Not executed                  |

Phase A remains open. It would be inaccurate to declare it complete merely because the major source files have now been read.

The next Phase A priority is completion of the learning-progress source-range ledger, followed by consolidated severity ranking and verification of whether the reported fixes are present on the current branch.

Principal Architect decision: Continue the phase-gated audit. The reviewed files expose important correctness and content-integrity risks. Final production sign-off remains withheld until these risks are resolved and verified.

# Phase A — Principal Architect Audit Report

Static audit complete · Production sign-off withheld

I have completed the remaining identified source-review backlog for Phase A, covering learning-progress services, tutorial repositories, authoring and publishing, authentication boundaries, brand isolation, and associated test contracts.

I also reconciled the findings against the supplied `FinalAechitecture.md`, `ProjectAuditReport.md`, and `ResolveProjectAuditReport.md`.

Phase A report

Download the complete Phase A audit report

Consolidated findings

# 16

Core large files reconciled

# 12

Report includes source locations, impact, corrective action, coverage ledger, security-boundary assessment, and verification gates.

## Principal Architect findings

The highest-priority unresolved problems are:

| Area              | Finding                                                                                            | Priority |
| ----------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Learner progress  | Invalid or noncanonical completion events may be accepted before node-level eligibility is checked | High     |
| Canonical content | Missing and genuinely empty content are not sufficiently distinguished by completion semantics     | High     |
| Brand isolation   | Exact-brand tutorial content is not guaranteed precedence over shared content                      | High     |
| Authoring         | Concurrent tutorial updates and block appends can overwrite changes                                | High     |
| Publishing        | General status updates can bypass the dedicated publication validation path                        | High     |
| Security          | Composer services rely on authorization performed by callers; not all callers are certified        | High     |
| Delivery          | Personalized legacy API content uses a public cache directive                                      | High     |
| Data integrity    | Pagination totals and cursor ordering have correctness gaps                                        | High     |

The audit also identified medium-priority concerns involving cache invalidation, production diagnostic logging, timestamp preservation and incomplete regression-test coverage.

## Phase A exit-gate assessment

| Gate                                         | Result                  |
| -------------------------------------------- | ----------------------- |
| Identified core source-range backlog         | Complete                |
| Architecture requirements reconciliation     | Reviewed                |
| All authorization callers certified          | Partial                 |
| Concurrency and atomicity                    | Fail — unresolved risks |
| Canonical completion and publication         | Fail — unresolved risks |
| Cross-brand integration verification         | Not completed           |
| Database integration tests                   | Not executed            |
| Builds, migrations and deployment validation | Not executed            |

The distinction matters: Phase A's identified core source-reading backlog is complete, but the architecture has not passed Phase A acceptance. Some cross-file caller coverage and all runtime verification still remain outstanding.

## Recommended next decision

Address the high-priority Phase A findings before treating its backend controls as production-certified. The first remediation group should cover canonical block validation, deterministic brand selection, optimistic concurrency, publication transition enforcement and authorization completeness.

The report is ready for use as a remediation and verification register. No repository files were modified, and no tests were represented as passing without execution evidence.

Final Phase A verdict: Static source review reconciled; production readiness not approved.

