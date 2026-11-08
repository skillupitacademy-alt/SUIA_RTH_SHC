# FND01-FND30 Workflow Execution Plan

**Authority:** audit/Claude_Sonnet45_W1_W3_Completion_Directive.md
**Starting HEAD:** 1f06ae15 (FND13 placement correction complete)
**Branch:** remediation/w1-2-batch-05-targeted
**Date:** 2026-11-06

---

## Execution Strategy

This plan divides all 30 foundation tasks into **sequential phases** with **parallel workflows within each phase**. Tasks are grouped by dependencies, with independent work executing in parallel.

### Phase Model

- **Phase 1 (Foundation):** Register, baseline, critical decisions (FND01-03, sequential prerequisites)
- **Phase 2 (G1 Authorization):** Ownership, exports, progress, admin, gates (FND04-10, partially parallel)
- **Phase 3 (G2 Email/Identity):** People projection and email compatibility (FND11, sequential)
- **Phase 4 (G3 Truth):** W2 production truth across all domains (FND12-17, highly parallel)
- **Phase 5 (W3 Contracts):** Six canonical domains (FND18-23, parallel by domain)
- **Phase 6 (Integration):** Real caller integration and adverse tests (FND24-25, sequential after P5)
- **Phase 7 (Closure):** Gates, audit, W4 entry, final package (FND26-30, sequential)

---

## Phase 1: Foundation Prerequisites (Sequential)

**Why Sequential:** Each task provides essential inputs for all subsequent work.

### Wave 1A: Register Foundation (1 workflow)

**Task:** FND01 Complete Finding Register
**Agent:** wf-planner
**Duration:** 2-3 hours
**Dependencies:** None
**Outputs:** Canonical finding register with 181 rows reconciled, unique IDs, mechanically countable

**Workflow:**
```
run_workflow(
  workflowPrompt: "FND01: Complete the actual finding register with reconciled 181/109 discrepancy.

  Baseline: 1f06ae15
  Files: audit/FND12_Complete_Truth_Inventory.md (investigate 181 vs 109 summary)

  Requirements:
  - Enumerate actual 181 callers or reconcile to actual count
  - One machine-countable row per distinct finding
  - Canonical root cause, source owner, active caller per row
  - Reconcile duplicate/candidate IDs
  - Resolve FND12 January dates vs current November context
  - Produce reproducible extraction/validation

  Verification:
  - Row count matches summary classification
  - Every in-scope finding has attributable disposition
  - Mechanically countable with exact domain breakdowns

  Submit: Updated FND12_Complete_Truth_Inventory.md with resolved discrepancy"
)
```

**Blocks:** All other tasks (need finding IDs and scope)

---

### Wave 1B: Regression Baseline (1 workflow)

**Task:** FND02 Reproducible Baseline
**Agent:** wf-coder
**Duration:** 2-3 hours
**Dependencies:** FND01 complete
**Outputs:** Stable test baseline with exact selections, diagnosed failures

**Workflow:**
```
run_workflow(
  workflowPrompt: "FND02: Establish reproducible regression baseline for affected tests.

  Baseline: 1f06ae15 (after FND13 placement correction)

  Requirements:
  - Select exact provider, report, ILS, service, BFF, security files
  - Document configs, aliases, jsdom/React, offline guard
  - Record passing/failed/skipped/interrupted separately
  - Diagnose any 140-failure or hanging run from actual errors
  - Distinguish harness failure from product failure

  Known passing:
  - 8 lifecycle tests (FND07 StrictMode)
  - 10 report tests (FND14 exam state)
  - 29 taxonomy tests (FND19 domain validation)
  - 13 placement tests (FND13 uncalibrated)

  Verification:
  - Stable bounded runner with traceable baseline
  - Complete attribution of every known failure
  - No substituting smaller passing set for unresolved broader gate

  Submit: audit/FND02_Regression_Baseline.md with exact test selections and runner recipes"
)
```

**Blocks:** FND25 (adverse behavior tests need baseline)

---

### Wave 1C: Ownership Architecture (1 workflow)

**Task:** FND03 Ownership Architecture Executable
**Agent:** wf-planner
**Duration:** 3-4 hours
**Dependencies:** FND01 complete (need caller map)
**Outputs:** Caller-to-credential-to-tenant/subject-to-store map, migration design

**Workflow:**
```
run_workflow(
  workflowPrompt: "FND03: Build executable ownership architecture for progress, exports, admin.

  Baseline: 1f06ae15 + FND01 register
  Files: Services, schemas, migrations across all apps

  Requirements:
  - Build exact caller→credential→tenant/local-subject→store map
  - Distinguish chosen policy from observed deployment facts
  - Produce schema/key/foreign-key manifests
  - Draft safe historical-row quarantine, migration, rollback
  - Implement compatible corrections already supported by trusted data
  - Route only genuinely missing authority/migration to Sol with concrete recommendation

  Verification:
  - Implementable ownership chain documented
  - Discriminating equal-ID controls designed
  - Mixed-version consumer manifests where persistence cannot represent tenant ownership

  Submit: audit/FND03_Ownership_Architecture.md with caller map and migration design

  If decision needed: Prepare concrete proposal with exact source impact"
)
```

**Blocks:** FND04 (export ownership), FND05 (progress identity), FND06 (admin policy)

---

## Phase 2: G1 Authorization & Runtime (Mixed Parallel/Sequential)

**Dependencies:** Phase 1 complete (register, baseline, ownership architecture)

### Wave 2A: Core Ownership (3 parallel workflows)

All workflows start simultaneously after FND03 completes.

#### Workflow 2A-1: Export Ownership (FND04)

**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND03

```
run_workflow(
  workflowPrompt: "FND04: Finish export ownership boundaries per FND03 architecture.

  Baseline: 1f06ae15 + FND03 ownership map
  Scope: Trigger, workflow dispatch, job status, missing-job recovery, URLs, job/exam download, workers, storage/cache

  Requirements:
  - Bind resource tenant and local owner at creation
  - Verify before recovery or private effects
  - Preserve authorized owner and bounded internal positives
  - Fix known 6 foreign-tenant failures (must genuinely pass)
  - Include both directions, equal IDs, unknown provenance, invalid credentials
  - No unauthorized effects

  Tests:
  - Foreign tenant denial (both directions)
  - Equal IDs in different tenants
  - Unknown provenance
  - Invalid credentials
  - Authorized positives

  If schema/rollout needed: Prepare reviewed artifact, mark gate open

  Submit: IMPLEMENTED_UNVERIFIED with test evidence"
)
```

#### Workflow 2A-2: Progress Identity (FND05)

**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND03

```
run_workflow(
  workflowPrompt: "FND05: Finish progress identity and write integrity per FND03 architecture.

  Baseline: 1f06ae15 + FND03 ownership map
  Scope: Legacy progress, canonical completion, ILS active time/visits, private tenant persistence

  Requirements:
  - Secure every reachable caller
  - Preserve strict canonical membership, exact historical event replay
  - Trusted local/projection mapping
  - Resolve concurrent completion loss with selected transaction/version/merge contract
  - Prove two different completions survive
  - Denied cross-user/tenant writes
  - Safe retries

  Tests:
  - Concurrent completion (both survive)
  - Cross-user denial
  - Cross-tenant denial
  - Historical replay accuracy
  - Retry safety

  Decision if needed: Transaction vs optimistic locking vs atomic merge (with evidence)

  Submit: IMPLEMENTED_UNVERIFIED with concurrency test evidence"
)
```

#### Workflow 2A-3: Admin Policy (FND06)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND03

```
run_workflow(
  workflowPrompt: "FND06: Finish admin actor, request, target policy per FND03 classification.

  Baseline: 1f06ae15 + FND03 ownership map
  Scope: Users/questions resources, tenant-owned vs SHC-global matrix

  Requirements:
  - Trace each affected resource to authoritative store
  - Decide tenant-owned vs SHC-global under recorded matrix
  - Reject conflicting verified tenant/request context before privileged reads
  - Preserve legitimate SHC and tenant-admin paths
  - No requester header grants authority

  Tests:
  - Learner access denial
  - Wrong-class denial
  - Wrong-audience denial
  - Conflicting-tenant denial
  - Authorized SHC admin positive
  - Authorized tenant admin positive

  Submit: IMPLEMENTED_UNVERIFIED with admin policy matrix"
)
```

---

### Wave 2B: Client & Backend Security (2 parallel workflows)

Start after Wave 2A completes.

#### Workflow 2B-1: Client Isolation (FND07)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND02 baseline

```
run_workflow(
  workflowPrompt: "FND07: Finish client private-state and queue isolation.

  Baseline: 1f06ae15 + FND02 baseline
  Known passing: 8 lifecycle tests (StrictMode visit fix at b5a4e05d)

  Requirements:
  - Preserve verified interval metadata, hidden-time, StrictMode visit, teardown
  - Inventory actual private navigation/API caching and service-worker reads/writes
  - Implement selected exclusion/eviction under explicit route/cache policy
  - Preserve public offline navigation
  - Address continuously mounted A-to-B transitions
  - Delayed callbacks/responses
  - Persisted private residues with authoritative owner/epoch lifecycle

  Tests:
  - No-write control (8 existing)
  - No-stale-read control
  - Service worker private cache exclusion
  - A-to-B navigation cleanup
  - Epoch-based eviction

  Browser persistence gate: Mark as open (physical browser test needed)

  Submit: IMPLEMENTED_UNVERIFIED with 8+ tests passing"
)
```

#### Workflow 2B-2: Project AI Actors (FND08)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND03

```
run_workflow(
  workflowPrompt: "FND08: Finish trusted Project AI audit actors.

  Baseline: 1f06ae15 + FND03 ownership
  Scope: services/project-ai backend (explicitly within inspection extension)

  Requirements:
  - Use existing verified identity for persisted actor fields
  - Preserve actual permissions
  - Trace every active transition/audit path (not only SHC client string)
  - Verify forged actor, unauthenticated, wrong-role cases
  - Persisted adapter effects and legitimate positives

  Tests:
  - Real backend entry/service composition with isolated persistence
  - Forged actor denial
  - Unauthenticated denial
  - Wrong-role denial
  - Legitimate actor positives

  Not: Browser field substitution (backend-only)

  Submit: IMPLEMENTED_UNVERIFIED with backend service tests"
)
```

---

### Wave 2C: Gates & Runtime (2 sequential workflows)

Start after Wave 2B completes.

#### Workflow 2C-1: Human Gate 1 (FND09)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND08 (approval actors)

```
run_workflow(
  workflowPrompt: "FND09: Finish Human Gate 1 authorization.

  Baseline: 1f06ae15 + FND08 approval actors

  Requirements:
  - Enumerate current state machine, approval evidence repository, approver capability
  - Submit recommended permission and requester/approver policy where unselected
  - Implement after Sol disposition through actual transition service
  - Reject missing, stale, wrong-workflow, forged approval
  - Unauthorized/self-approval where prohibited
  - Preserve explicit valid approvals and idempotent replay

  Tests:
  - No-evidence transition failure (must pass with zero unauthorized writes)
  - Stale approval denial
  - Wrong-workflow approval denial
  - Forged approval denial
  - Self-approval denial (if prohibited)
  - Valid approval positive
  - Idempotent replay

  If policy decision needed: Submit concrete proposal with compatibility impact

  Submit: IMPLEMENTED_UNVERIFIED or BLOCKED_AWAITING_POLICY"
)
```

#### Workflow 2C-2: Runtime Readiness (FND10)

**Agent:** wf-planner
**Duration:** 2-3 hours
**Dependencies:** FND02-09 complete

```
run_workflow(
  workflowPrompt: "FND10: Complete required runtime-readiness work.

  Baseline: 1f06ae15 + FND02-09 evidence

  Requirements:
  - Prepare exact pending browser/gateway/physical-store journeys
  - Build/source attribution
  - Approved accounts/store isolation
  - Safe output contracts
  - Reuse accepted historical smoke within recorded scope
  - Six-environment formal qualification separately identifiable
  - Execution-ready package with concrete commands, preconditions, expected observations, side effects

  Not: Live operations (separately authorized)

  Deliverable: audit/FND10_Runtime_Readiness_Package.md
  - Exact browser test recipe
  - Gateway integration test recipe
  - Physical store test recipe
  - Account setup procedure
  - Expected observations per environment
  - Side effects disclosure
  - Prerequisites checklist

  Submit: Package ready for owner authorization of live operations"
)
```

---

## Phase 3: G2 Email/Identity (Sequential)

**Dependencies:** Phase 2 complete

### Wave 3: People Projection (1 workflow)

**Task:** FND11
**Agent:** wf-planner + wf-coder
**Duration:** 5-6 hours

```
run_workflow(
  workflowPrompt: "FND11: Finish people projection/email compatibility with complete design.

  Baseline: 1f06ae15 + Phase 2 complete
  Scope: All projection, staff auth, recovery, admission, seed, email-join consumers including SkillUp-admin

  Requirements:
  - Enumerate all consumers (use redacted source inspection)
  - Define normalization, platform-local identity, ambiguity denial, bridge partial writes, retry recovery
  - Deliver complete compatible uniqueness/migration design
  - Sequence scoped consumer corrections before constraint relaxation
  - Inspect fixed credential issue through separate manifest
  - Secure invitation/reset compatibility

  Tests:
  - Ambiguity denial (duplicate normalized emails)
  - Platform-local identity boundaries
  - Partial write recovery
  - Retry safety
  - Historical credential compatibility

  Physical credential/account remediation: Mark as separate operation (gate open)

  Deliverable: Complete consumer matrix, uniqueness/lookup contract, migration/compatibility design

  Submit: Design for independent review, then implement after approval"
)
```

---

## Phase 4: G3 Truth (Highly Parallel)

**Dependencies:** Phase 1 complete (FND01 register), Phase 3 optional (can start during P2/P3)

### Wave 4: W2 Truth Domains (5 parallel workflows)

All workflows start simultaneously. Each handles independent domain.

#### Workflow 4-1: SkillUp Student Data (FND13)

**Status:** ✅ COMPLETE (commit 1f06ae15)
**Tests:** 13 passing (placement-http-truth, placement-zero-control)
**Evidence:** Helper-level isolation, uncalibrated status implemented

#### Workflow 4-2: Assessment Reports (FND14)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND01, FND02 baseline

```
run_workflow(
  workflowPrompt: "FND14: Finish assessment report truth and identity lifecycle.

  Baseline: 1f06ae15
  Known passing: 10 report tests (exam-keyed reset at c16ad550)

  Requirements:
  - Preserve current exam-keyed result lifecycle, avoid duplicate state
  - Exercise pending/failed/missing B, late A responses
  - Genuine zero, complete/incomplete question details
  - Actual child rendering
  - Trace ReportEngine fields
  - Distinguish absent time from measured zero through compatible response contract

  Tests:
  - Stale report boundary (3 existing Sol tests)
  - Zero values (7 existing truth tests)
  - ReportEngine backend fields (new)
  - Per-question timeSpent null→0 disambiguation (new)
  - Question detail consolidation (new)

  Not: Alter assessment scoring policy

  Submit: IMPLEMENTED_UNVERIFIED with full report path coverage"
)
```

#### Workflow 4-3: SHC Operational (FND15)

**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND01

```
run_workflow(
  workflowPrompt: "FND15: Finish operational and governance truth coverage.

  Baseline: 1f06ae15
  Scope: Project LLM, certificate, admin user/subscription, audit, metrics, operational surfaces

  Requirements:
  - Inventory through real rendered consumers
  - Remove invented evidence/health/certification only where unsourced
  - Retain actual backend capabilities
  - Disclose functionality intentionally unavailable
  - Certificate lookup proves query/mapper boundary only
  - Trace issuance, approval, evidence sources

  Tests:
  - Certificate query/mapper boundaries
  - Issuance workflow evidence
  - Approval chain
  - Platform distribution (no fabrication)
  - Admin operational surfaces
  - Functional/source coverage
  - Adverse controls (not placeholder text alone)

  Rendering/runtime checks: Separately gated

  Submit: IMPLEMENTED_UNVERIFIED with functional coverage"
)
```

#### Workflow 4-4: Forms/Actions (FND16)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND01

```
run_workflow(
  workflowPrompt: "FND16: Finish truthful forms/actions contracts.

  Baseline: 1f06ae15
  Known complete: Newsletter unavailable (40e05927), recovery acknowledgement (49c44c63)

  Requirements:
  - Inspect actual signup/login/recovery, newsletter handlers before changing messages
  - Distinguish committed success, accepted delivery work, rejection, local draft, unknown transport
  - Preserve non-enumerating auth behavior
  - Keep CRM runtime changes within explicit manifest/disposition
  - Test timeout only when real timer exercised
  - InjectedTypeError establishes transport rejection

  Tests:
  - Newsletter unavailable (1 existing)
  - Recovery acknowledgement (source-verified)
  - Signup/login contracts (new, actual handler composition)
  - Timeout/rejection/unknown outcomes (new)
  - CRM boundary (new)

  Not: Silent deferral

  Submit: IMPLEMENTED_UNVERIFIED with actual caller and server contract"
)
```

#### Workflow 4-5: Coverage & Inventory (FND12, FND17)

**Agent:** wf-planner
**Duration:** 2-3 hours
**Dependencies:** FND01, FND13-16 complete

```
run_workflow(
  workflowPrompt: "FND12+FND17: Complete W2 inventory and coverage map reconciliation.

  Baseline: 1f06ae15 + FND13-16 implementation evidence

  FND12 Requirements:
  - Reconcile 181/109 discrepancy (from FND01 resolution)
  - Enumerate actual active callers across SkillUp, RTH, SHC, shared, marketing
  - Function/component, source field, real data owner, fallback, original finding, classification per row
  - Correct January dates, stale test counts
  - Mechanically countable rows

  FND17 Requirements:
  - Map exact unique original IDs to source, implementation, tests, residual gates
  - Validate totals mechanically
  - Refresh stale FND14 failure (now passing at cc100f47)
  - Descriptive tests, fixture effects, real caller composition distinctly marked
  - Resolve findings or submit explicit approved exceptions

  Verification:
  - Every required W2 finding has defensible disposition
  - No unresolved truth defect hidden by summary counts
  - Totals derive from enumerated rows

  Submit: Updated FND12_Complete_Truth_Inventory.md + FND17_W2_Coverage_Map.md"
)
```

---

## Phase 5: W3 Contracts (Parallel by Domain)

**Dependencies:** Phase 1 complete, Phase 2 optional (ownership for FND18)

### Wave 5: Six Canonical Domains (6 parallel workflows)

All workflows start simultaneously. Each handles one W3 domain.

#### Workflow 5-1: Identity Contracts (FND18)

**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND03 ownership architecture

```
run_workflow(
  workflowPrompt: "FND18: Finish canonical identity contracts (G4).

  Baseline: 1f06ae15 + FND03 ownership

  Requirements:
  - Consolidate trusted tenant/local subject, projection references, purpose/audience/class
  - Bounded internal identities at actual gateway/BFF/API/token boundaries
  - Canonical runtime schemas and inferred types
  - Explicit compatibility adapters
  - Reject absent configured privileged authority
  - Conflicting caller context per existing contract

  Tests:
  - Actual caller composition
  - Malformed credentials
  - Adverse tenant/subject cases
  - Conflicting context denial
  - Supported old/new credentials
  - Compatibility adapters

  Not: Invent tenant mapping from fixture data or email

  Submit: IMPLEMENTED_UNVERIFIED with caller composition evidence"
)
```

#### Workflow 5-2: Taxonomy Integration (FND19)

**Status:** ✅ COMPLETE (Sol VERIFIED at 60684170)
**Tests:** 29 passing (2 domain route + 27 schema)
**Evidence:** Bounded verification, numeric rejection implemented

#### Workflow 5-3: Question Contracts (FND20)

**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND01

```
run_workflow(
  workflowPrompt: "FND20: Finish question identity and assessment compatibility (G6).

  Baseline: 1f06ae15
  Scope: Editor, bulk, import, review, schema, API, service, repository, scorer paths

  Requirements:
  - Preserve actual option identity and historical answer encodings
  - Comma-containing option failure remains required assertion until approved unambiguous representation
  - Submit migration/scoring decision with actual stored input shapes and adverse tests
  - Do not weaken multi-select requirement to match restrictive UI
  - Call full round-trip complete only after valid scoring

  Tests:
  - Valid round-trip (create → store → retrieve → score)
  - Rejected malformed identities
  - Duplicate option denial
  - Historical scoring compatibility
  - Comma-containing option (failing assertion, intentional)
  - Multi-select encoding

  Decision if needed: Unambiguous representation + compatibility adapter

  Submit: IMPLEMENTED_UNVERIFIED with round-trip evidence, retained comma failure"
)
```

#### Workflow 5-4: Document Contracts (FND21)

**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND01

```
run_workflow(
  workflowPrompt: "FND21: Finish canonical nested documents and authoring storage (G7).

  Baseline: 1f06ae15
  Scope: Legacy/structural/versioned container and child shapes, import/composer/delivery consumers

  Requirements:
  - Enumerate supported shapes and real consumers
  - Implement compatible recursive validation after reviewed matrix
  - Preserve valid historical shapes and bounded depth/cycles
  - Keep preview defaults separate from persisted authored content
  - Missing D1/I1 fields must not inject educational example claims into real lesson
  - Build isolated fixtures now
  - Physical document audit separately gated

  Tests:
  - Retained nested schema failures genuinely pass through actual supported callers
  - Recursive validation (bounded depth)
  - Cycle detection
  - Historical shape compatibility
  - Preview vs persisted distinction
  - Example injection denial

  Submit: IMPLEMENTED_UNVERIFIED with nested validation evidence"
)
```

#### Workflow 5-5: Artifact Contracts (FND22)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** FND01, FND09 (approval authority)

```
run_workflow(
  workflowPrompt: "FND22: Finish Project LLM artifact/evidence contracts (G8).

  Baseline: 1f06ae15 + FND09 approval authority

  Requirements:
  - Verify submitted SHA-256 pattern/case normalization through actual request schema, HTTP handler, service adapter
  - Keep artifact ID, digest, signature, approval, reference evidence semantically separate
  - Consolidate runtime validation for caller/backend workflow/evidence contracts
  - Preserve existing historical hash inputs where supported

  Tests:
  - Forged digest denial
  - Nonhex digest denial
  - Mismatched-workflow denial
  - Valid digest round-trip
  - Legitimate caller round-trip
  - Approval authority linkage (from FND09)

  Not: Thirteen-case schema test alone cannot establish full G8 acceptance

  Submit: IMPLEMENTED_UNVERIFIED with digest/workflow/approval evidence"
)
```

#### Workflow 5-6: Event Contracts (FND23)

**Agent:** wf-coder
**Duration:** 5-6 hours
**Dependencies:** FND01, FND03 (tenant identity)

```
run_workflow(
  workflowPrompt: "FND23: Finish event and analytics identity/delivery contracts (G9).

  Baseline: 1f06ae15 + FND03 tenant identity

  Requirements:
  - Deliver exact producer/consumer/worker inventory and matching registered types
  - Immutable event identity, verified tenant, payload, correlation semantics
  - Implement compatible type/brand denials once producer migration manifest selected
  - Resolve premature retry markers, same-correlation distinct-ID collisions, payload conflict
  - Concurrency, failure before commit, commit/lost-ack recovery using reviewed durable claim/commit contract
  - Preserve legitimate old messages through explicit adapters

  Tests:
  - All retained event/brand tests pass
  - Type/brand mismatch denial
  - Duplicate correlation handling
  - Concurrent consumer safety
  - Failure-before-commit recovery
  - Commit/lost-ack idempotency
  - Historical message compatibility

  Not: Moving marker after handler is not atomic processing
  Physical delivery/transaction: Separate observed evidence
  HTTP provider success alone cannot supply queue guarantees

  Decision if needed: Durable claim/commit contract with evidence

  Submit: IMPLEMENTED_UNVERIFIED with delivery contract evidence"
)
```

---

## Phase 6: Integration & Adverse Tests (Sequential after Phase 5)

**Dependencies:** Phase 5 complete (all W3 contracts)

### Wave 6A: Real Caller Integration (1 workflow)

**Task:** FND24
**Agent:** wf-coder
**Duration:** 5-6 hours

```
run_workflow(
  workflowPrompt: "FND24: Integrate all six contract domains through real callers.

  Baseline: 1f06ae15 + Phase 5 complete (FND18-23)

  Requirements:
  - Select actual client/producer and real HTTP/consumer/service path per domain
  - Exercise canonical schema, inferred type, serialization, domain owner, real repository adapter
  - Infrastructure simulation clearly marked
  - Include successful historical/current callers and malformed/foreign-context cases
  - Retire aliases only after their callers migrate

  Domains to integrate:
  1. Identity (FND18): Gateway → BFF → API composition
  2. Taxonomy (FND19): Already integrated, verify consumers
  3. Questions (FND20): Editor → API → Repository → Scorer
  4. Documents (FND21): Composer → Storage → Delivery
  5. Artifacts (FND22): Workflow → Evidence → Approval
  6. Events (FND23): Producer → Queue → Consumer

  Tests per domain:
  - Real caller composition (not mock-only)
  - Historical input compatibility
  - Malformed input denial
  - Foreign-context denial
  - Successful round-trip

  Verification: Dependency/consumer coverage, not mock-only composition

  Submit: IMPLEMENTED_UNVERIFIED with per-domain integration evidence"
)
```

---

### Wave 6B: Adverse Behavior (1 workflow)

**Task:** FND25
**Agent:** wf-coder
**Duration:** 4-5 hours
**Dependencies:** FND24, FND02 baseline

```
run_workflow(
  workflowPrompt: "FND25: Prove adverse behavior and regression sensitivity.

  Baseline: 1f06ae15 + FND24 integration + FND02 baseline

  Requirements:
  - Link each reproduced defect to required adverse test and legitimate positive
  - Exercise unknown/foreign identity before private effects
  - Zero versus missing
  - Out-of-order responses
  - Duplicate/conflict
  - Partial failure
  - Concurrent callers
  - Meaningful actual-entry assertions over brittle labels/counts
  - Fixed test must pass because behavior changed, not because insecure outcome accepted

  Tests:
  - Known failure set reconciled without hidden skips or weakened invariants
  - Foreign identity denial before effects
  - Zero vs null distinction
  - Out-of-order response handling
  - Duplicate detection
  - Concurrent safety
  - Partial failure isolation

  Record: Infrastructure sensitivity and unexecuted layers

  Submit: IMPLEMENTED_UNVERIFIED with adverse test evidence, baseline reconciliation"
)
```

---

## Phase 7: Closure & W4 Entry (Sequential)

**Dependencies:** Phase 6 complete (all implementation done)

### Wave 7A: Gates & Quality (2 parallel workflows)

#### Workflow 7A-1: Static Gates (FND26)

**Agent:** wf-coder
**Duration:** 3-4 hours
**Dependencies:** Phase 6 complete

```
run_workflow(
  workflowPrompt: "FND26: Finish applicable static, test, build gates.

  Baseline: 1f06ae15 + all FND01-25 complete

  Requirements:
  - Maintain reproducible per-package runner recipes
  - Bounded timeouts, exact aliases, DOM/React transforms, offline setup
  - Use installed tooling, configured test inclusions, targeted lint
  - Diagnose environment/module/generated-file errors without changing global settings to hide them
  - Record interrupted checks as incomplete
  - Stage explicit paths, check staged names/stat/whitespace before commit
  - Check complete final snapshot range

  Gates to run:
  - TypeCheck: npx tsc --noEmit (all affected packages)
  - ESLint: targeted lint on changed files
  - Test runner: all affected tests
  - Whitespace: git diff --check on final range
  - Build: affected package builds

  Verification:
  - Affected gates pass or precise reviewed prerequisite remains open
  - No aggregate green claim with known red selections

  Submit: audit/FND26_Gate_Results.md with exact commands and exit codes"
)
```

#### Workflow 7A-2: Engineering Quality (FND27)

**Agent:** wf-coder (review mode)
**Duration:** 3-4 hours
**Dependencies:** Phase 6 complete

```
run_workflow(
  workflowPrompt: "FND27: Prove engineering and compatibility quality.

  Baseline: 1f06ae15 + all FND01-25 complete

  Requirements:
  - Record responsibility/dependency direction, canonical reuse, simple implementation
  - Clear types, least privilege, safe errors/logs, transactional outcomes per changed domain
  - Preserve normal entry points and sound callers, including older data
  - Remove proven duplicate mechanisms and unused abstractions
  - Link each mandatory violation to correction or explicit approved exception

  Review areas:
  - SOLID: Single responsibility, dependency direction
  - DRY: Canonical reuse, no duplication
  - KISS: Simple implementation, no over-engineering
  - Separation of concerns: Transport/domain/persistence boundaries
  - Least privilege: Private resource entry points
  - Type safety: Clear types, typed errors
  - Data preservation: Historical inputs, legitimate callers

  Verification: Concrete source/caller evidence, not checklist alone

  Submit: audit/FND27_Engineering_Quality_Report.md with per-domain assessment"
)
```

---

### Wave 7B: Re-audit & W4 Entry (2 sequential workflows)

#### Workflow 7B-1: Foundation Re-audit (FND28)

**Agent:** wf-planner
**Duration:** 4-5 hours
**Dependencies:** Wave 7A complete

```
run_workflow(
  workflowPrompt: "FND28: Prepare independent foundation re-audit.

  Baseline: 1f06ae15 + all FND01-27 complete

  Requirements:
  - Produce reproducible per-finding and per-group packets
  - Reviewed source revision, diff, implementation history, exact commands, expected observations
  - Flag unknown authority, critical/high findings, missing runtime evidence explicitly
  - Sonnet prepares and can run local review workflows
  - Sol independently reproduces, accepts, or requests changes

  Deliverable per group (G1-G9):
  - Finding IDs covered
  - Source files changed
  - Implementation commits
  - Test evidence (commands + results)
  - Residual gates (open prerequisites)
  - Review readiness assessment

  Verification: Each G1-G9 requirement individually dispositioned

  Not: Local reviewer APPROVED closing the program

  Submit: audit/FND28_Group_Audit_Packets/ (9 group packets)"
)
```

#### Workflow 7B-2: W4 Entry Readiness (FND29)

**Agent:** wf-planner
**Duration:** 2-3 hours
**Dependencies:** FND28 complete

```
run_workflow(
  workflowPrompt: "FND29: Establish actual W4 entry readiness.

  Baseline: 1f06ae15 + FND28 audit packets

  Requirements:
  - Map W4.1-W4.6 to accepted identity/truth/contract dependencies and mandatory findings
  - Identify open security/persistence/governance gates affecting each domain
  - Propose any sequencing exception explicitly with impact and mitigation
  - No silent movement of open work into W4

  W4 waves to assess:
  - W4.1: Admin & Management
  - W4.2: Enrollment & Progress
  - W4.3: Assessment & Scoring
  - W4.4: Content & Delivery
  - W4.5: Analytics & Reporting
  - W4.6: Integration & Extensions

  Deliverable: W4 entry matrix
  - Per-wave dependency status
  - Blocking findings
  - Open gates
  - Recommended sequence
  - Exception proposals (if any)

  Verification: Sol's recorded foundation and entry decisions

  Not: Broad SHC refactor from claimed ledger completion alone

  Submit: audit/FND29_W4_Entry_Readiness.md with dependency matrix"
)
```

---

### Wave 7C: Final Package (1 workflow)

**Task:** FND30
**Agent:** wf-planner
**Duration:** 2-3 hours
**Dependencies:** FND29 complete

```
run_workflow(
  workflowPrompt: "FND30: Submit the complete closure package.

  Baseline: 1f06ae15 + all FND01-29 complete

  Requirements:
  - Update existing handoff, register, thirty-task ledger
  - Each task: scope, code/test commits, independent-review state, exact remaining input, owner, next action
  - Include G1-G9 acceptance matrix
  - Compatibility/rollout artifacts
  - Runtime prerequisites
  - W4 recommendation
  - Stage deliberate artifacts (including required files hidden by ignore patterns)
  - Preserve local tooling exclusion

  Deliverable components:
  1. Updated consolidated handoff (all tasks)
  2. Final finding register (from FND01)
  3. Thirty-task ledger (implementation status)
  4. G1-G9 acceptance matrix (group readiness)
  5. Runtime prerequisites (FND10 package)
  6. W4 entry recommendation (from FND29)
  7. Compatibility/rollout artifacts
  8. Test evidence summary

  Verification:
  - All required findings resolved or explicitly excepted
  - Every required gate observed or retained open
  - Sonnet submits IMPLEMENTED_UNVERIFIED
  - Sol assigns VERIFIED/CLOSED only after independent evidence

  Submit: Complete closure package at audit/FND30_Closure_Package/"
)
```

---

## Execution Timeline Summary

### Sequential Phases
1. **Phase 1** (Foundation): 6-9 hours - MUST complete before others
2. **Phase 2** (G1 Authorization): 18-24 hours - Sequential waves, internal parallelism
3. **Phase 3** (G2 Email): 5-6 hours - Single workflow after P2
4. **Phase 4** (G3 Truth): 15-20 hours - Highly parallel, can start during P2/P3
5. **Phase 5** (W3 Contracts): 20-28 hours - Highly parallel, needs P1 only
6. **Phase 6** (Integration): 9-11 hours - Sequential after P5
7. **Phase 7** (Closure): 11-15 hours - Sequential after P6

### Total Duration (Critical Path)
- **Best case (maximum parallelism):** ~75 hours (3-4 working days)
- **Realistic case (mixed parallelism):** ~95 hours (5-6 working days)
- **Conservative case (sequential safety):** ~120 hours (7-8 working days)

### Parallelism Opportunities

**High parallelism (6+ concurrent workflows):**
- Phase 5 Wave 5: Six W3 domains completely independent

**Medium parallelism (3-5 concurrent workflows):**
- Phase 2 Wave 2A: Export, progress, admin policy (3 workflows)
- Phase 4 Wave 4: Five truth domains (5 workflows)

**Low parallelism (2 concurrent workflows):**
- Phase 2 Wave 2B: Client isolation + Project AI (2 workflows)
- Phase 7 Wave 7A: Gates + quality (2 workflows)

**No parallelism (sequential):**
- Phase 1: All tasks sequential (register → baseline → ownership)
- Phase 2 Wave 2C: Human Gate → Runtime (2 sequential)
- Phase 3: Single workflow
- Phase 6: Integration → Adverse (2 sequential)
- Phase 7 Wave 7B: Re-audit → W4 entry (2 sequential)
- Phase 7 Wave 7C: Final package (single)

---

## Decision Points & Escalation

### Expected Decision Requests

**Phase 2:**
- FND05: Concurrent completion resolution (transaction vs locking vs merge)
- FND09: Gate 1 approval policy (if unselected)

**Phase 5:**
- FND20: Comma-containing option representation + migration
- FND23: Durable claim/commit contract for events

### Escalation Format

For any blocked decision:
1. Concrete invariant to preserve
2. Observed source behavior
3. One recommended solution
4. Compatibility/rollout impact
5. Exact paths affected
6. Adverse/legitimate controls that discriminate it

Submit to Sol, continue independent work during review.

---

## Progress Reporting

### After Each Workflow Completion

Report format:
```
Workflow: [Phase]-[Wave]-[Number]: [Task Name] (FND##)
Status: COMPLETE / BLOCKED / AWAITING_REVIEW
Duration: X hours
Tests: N passing / M added / P skipped
Commits: [commit SHAs]
Evidence: [test files, audit docs]
Blockers: [if any]
Next: [next workflow or decision needed]
```

### After Each Phase Completion

Report format:
```
Phase N: [Phase Name] - COMPLETE
Workflows: X completed, Y blocked
Duration: Total X hours
Implementation: [summary]
Tests: N total passing
Decisions: [if any requested]
Ready for: Phase N+1
```

---

## Risk Mitigation

### Workflow Failures

If workflow fails/exceeds iteration limit:
1. Save evidence to audit/[task]_checkpoint.md
2. Identify exact blocker (technical, decision, prerequisite)
3. If decision: Escalate with concrete proposal
4. If technical: Fix and relaunch focused workflow
5. If prerequisite: Mark task blocked, continue independent work

### Dependency Violations

If workflow starts without prerequisite:
1. Abort immediately
2. Document missing prerequisite
3. Wait for prerequisite completion
4. Relaunch with complete inputs

### Test Failures

If new test failures emerge:
1. Distinguish new regression from pre-existing
2. Fix genuine regressions immediately
3. Document pre-existing as known limitation
4. Do not weaken invariants to pass tests

---

## Current Status

**Completed:**
- FND13: SkillUp placement correction (commit 1f06ae15)
  - 13 tests passing
  - Uncalibrated status implemented
  - All scores return null until calibrated
  - Jobs preserved in DB order

**Ready to start:**
- Phase 1 Wave 1A: FND01 Finding Register (no dependencies)

**Next action:**
Launch Phase 1 Wave 1A workflow to reconcile finding register and establish baseline for all subsequent work.

---

**Document prepared by:** Claude Sonnet 4.5
**Execution begins:** After Sol approval
**Estimated completion:** 5-8 working days (depending on parallelism and decision turnaround)
