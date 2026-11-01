# Elearning Project - Architecture Remediation Execution Plan

**Governing architecture:** `FinalAechitecture.md`  
**Primary evidence sources:** `CompleteProjectAudit.md`, `CompleteProjectMatrix.md`  
**Purpose:** One authoritative implementation sequence for all AI models and human review.  
**Rule:** No model may independently redefine architecture, broaden scope, or mark a root cause `CLOSED` without the required verification evidence.

---

## 1. Program Objective

Bring the multi-application Elearning Project into conformance with `FinalAechitecture.md` through controlled, evidence-based remediation.

The program covers:

1. `apps/skillhubcore-admin`
2. `apps/skillup-web`
3. `apps/realtutorialhub-web`
4. `apps/skillupitacademy-site`
5. `apps/realtutorialhub-site`
6. Shared packages/services and cross-application architecture
7. Operational/scalability qualification

The target architecture remains a **modular multi-application platform with selectively distributed services**, explicit ownership, separate brand authorization/data boundaries, strict API/data contracts, secure-by-default behavior, observable/reliable operations, and enforceable CI architecture gates.

---

## 2. Non-Negotiable Governance Rules

1. `FinalAechitecture.md` is the architecture authority.
2. `CompleteProjectAudit.md` and `CompleteProjectMatrix.md` are evidence/backlog sources, not alternative architectures.
3. Findings are remediated by **root cause**, not one isolated symptom at a time.
4. One implementation model edits a ticket at a time.
5. Other models review; they do not simultaneously create competing implementations.
6. No broad refactor without a root-cause ticket and explicit scope.
7. Preserve sound existing code.
8. Follow SOLID pragmatically together with DRY, KISS, YAGNI, SoC, high cohesion and low coupling.
9. Browser/UI state is never authoritative for identity, authorization, audit approval, exam state, certification, payments, or persisted learner state.
10. Static/demo/reference data must never be presented as production `CURRENT`, `PASS`, `VERIFIED`, `APPROVED`, `CERTIFIED`, `HEALTHY`, or `AUDITED`.
11. All trusted identity and brand context must be derived or validated server-side.
12. Important writes must be transactional/idempotent where the domain requires it.
13. Every change requires acceptance tests.
14. No model may state "fixed", "verified", or "complete" without evidence.
15. Production/runtime claims require runtime/deployment evidence, not source inspection alone.

---

# 3. AI Model Responsibility Matrix

The model names below follow the available models stated by the project owner. Their use is governed primarily by **role separation**, not by assuming any one model is infallible.

| AI Model | Primary Role | Use For | Do NOT Use For | Expected Output |
|---|---|---|---|---|
| **ChatGPT Sol** | **Principal Architect / Program Integrator / Final Gatekeeper** | Maintain this plan; reconcile `FinalAechitecture.md` with audits; define root causes; approve ticket scope; review implementation diffs; decide acceptance/rejection; update phase readiness | Bulk parallel coding of many unrelated tickets; self-approving its own implementation without independent review | Architecture decision, ticket specification, diff review, acceptance decision, matrix/status update |
| **ChatGPT Astra** | Repository-scale analysis / controlled multi-file implementation | Dependency tracing; impact maps; mechanical migrations after architecture is approved; broad repo searches; cross-file contract migrations | Independently redesigning architecture; changing multiple domains without an approved ticket | Impact report, scoped multi-file patch, migration evidence |
| **Claude Sonnet 4.5** | **Primary implementation worker** | Most normal coding tickets; tests; repository/service refactors; API/schema changes; UI cleanup; small/medium multi-file changes | Deciding architecture; broad unsupervised redesign; marking ticket closed | Patch/diff, tests added, commands run, risks/unresolved items |
| **Claude Sonnet 4.6** | Limited-access senior reviewer / difficult implementation | Difficult concurrency/transactional code; security-sensitive implementation review; complex refactors when 4.5 struggles | Routine cleanup, documentation, simple UI work | Focused implementation or critical review |
| **Claude Opus 4.6** | **Limited-access adversarial architecture/security reviewer** | Identity/auth, authorization, transactions, idempotency, race conditions, cross-brand isolation, security-critical diffs | First-pass routine coding; formatting; simple tests | "Reasons this could still fail" review; missing invariants/tests; approve/reject recommendation |
| **Gemini 3.8** | Independent second-opinion reviewer | Adversarial review; test-gap discovery; alternative failure modes; cross-check API/data contracts; frontend/runtime behavior review | Simultaneous competing implementation of same ticket | Independent review report; missed cases; test recommendations |
| **Argon** | Secondary specialist/reviewer | Static analysis, code-quality review, alternative decomposition, bug hunting, targeted implementation where assigned | Architecture authority; parallel rewrite of same subsystem | Focused findings or assigned patch |
| **Tera** | Secondary analysis / verification worker | Repository search, checklist validation, documentation reconciliation, routine verification where available | Final architectural approval; unbounded refactor | Evidence checklist, comparison, verification notes |
| **Luna** | Fast routine worker | Documentation updates; ticket bookkeeping; dead-code removal; small tests; simple cleanup; low-risk typing/lint fixes | Security architecture, identity changes, major data-model decisions | Small patch or register update with concise evidence |

## Model Hierarchy

```text
                    Project Owner
                         |
                    ChatGPT Sol
              Principal Architecture Owner
                         |
        +----------------+----------------+
        |                                 |
Implementation                    Independent Review
        |                                 |
Claude Sonnet 4.5           Opus 4.6 / Sonnet 4.6
Astra (approved multi-file) Gemini 3.8 / Argon
        |
     CI / tests
        |
   ChatGPT Sol
Final accept / reject / register update
```

### Mandatory rule

**Never ask two implementation models to independently modify the same ticket at the same time.**

Preferred flow:

```text
Sol defines ticket
    ->
Sonnet 4.5 implements
    ->
CI/tests run
    ->
Opus/Gemini/Argon reviews independently
    ->
Sol accepts or rejects
    ->
Register updated
```

---

# 4. Status Model Used by Every AI

Use only these implementation states:

| State | Meaning |
|---|---|
| `PLANNED` | Approved backlog item; no implementation started |
| `IN_PROGRESS` | One assigned implementation model is working on it |
| `IMPLEMENTED_UNVERIFIED` | Source change exists, but acceptance evidence is incomplete |
| `IN_REVIEW` | Independent model/architect review is occurring |
| `VERIFICATION_FAILED` | One or more required acceptance checks failed |
| `VERIFIED` | Required static/tests/integration evidence passed |
| `CLOSED` | Sol/Principal Architect confirmed architecture requirement and mapped findings are satisfied |
| `DEFERRED` | Valid future work explicitly deferred with reason |
| `N_A` | Not applicable to that application/domain |

**Only ChatGPT Sol / Principal Architect role may move an item from `VERIFIED` to `CLOSED`.**

---

# 5. Root-Cause Program

Individual historical finding IDs remain evidence. Implementation is organized around root causes.

| Root Cause ID | Root Cause | Typical Audit Findings Covered | Priority |
|---|---|---|---|
| `RC-ID-01` | Identity, session, authorization and brand authority | Cross-user revoke, caller user headers, brand fallback, global/brand ID inconsistency, Project LLM actor | P0 |
| `RC-TRUTH-01` | Fabricated/static production truth | Fake learner data, exam metrics, dashboard values, fake PASS/audit/certification, fake recording URLs | P0/P1 |
| `RC-CI-01` | Architecture and quality enforcement absent/incomplete | Disabled CI, no required checks, missing dependency gates | P0 |
| `RC-CONTRACT-01` | Canonical contract drift | `text/questionText`, question enums, identity DTOs, candidate ID/hash, control-plane contracts | P1 |
| `RC-DB-01` | Database/data ownership and direct infrastructure coupling | Direct Drizzle in routes, cross-DB orchestration, uncontrolled ownership | P1 |
| `RC-EVENT-01` | Event/queue/idempotency/delivery reliability | In-memory queue, partial delivery, retries, event claiming, fire-and-forget indexing | P1 |
| `RC-TUTORIAL-01` | Competing tutorial/progress models | Legacy progress vs ILS, sidebar completion, nested block identity, aggregate progress | P1 |
| `RC-ASSESS-01` | Assessment/exam authoritative lifecycle | Client timer, retry submit, demo exams, result/export ownership | P1 |
| `RC-PLLM-01` | Project LLM governance/evidence authority | Human Gate 1, fake workflow evidence, static/live repo truth, client workflow orchestration | P1 |
| `RC-PRIVACY-01` | Marketing consent/privacy/analytics isolation | Consent bypass, tracker singleton, brand identity scoping, storage and UX | P1 |
| `RC-OBS-01` | Observability, secret handling and operational semantics | Raw console logs, DB URL leak, unsafe health claims, error details | P1/P2 |
| `RC-UI-01` | Dead/prototype/misleading UI | `href="#"`, unreachable components, inactive CTAs, fake operational controls | P2 |

---

# 6. Master Implementation Sequence

## WAVE 0 - CONTROL THE CHANGE PROCESS

### W0.1 - Pin Baseline
**Status:** `PLANNED`

**Owner:** Sol  
**Assist:** Astra / Tera  
**Objective:** Establish immutable implementation baseline.

Tasks:
- Confirm target branch.
- Record starting commit SHA.
- Confirm audit source versions.
- Stop uncontrolled parallel edits.
- Create/confirm canonical root-cause register.
- Map existing audit IDs to root causes.

Exit:
- One branch/HEAD recorded.
- Root-cause register exists.
- No duplicate ownership.

---

### W0.2 - Activate CI / Architecture Safety Net
**Root cause:** `RC-CI-01`  
**Status:** `PLANNED`

**Architecture owner:** Sol  
**Primary implementer:** Sonnet 4.5 or Astra  
**Independent reviewer:** Gemini / Argon  
**Critical reviewer if required:** Opus/Sonnet 4.6

Implement:
- Active CI workflow.
- Lint.
- Typecheck.
- Unit tests.
- Security tests.
- Architecture boundary checks.
- Build.
- Migration checks where applicable.
- Required branch status checks.
- Dependency direction checks introduced incrementally.

Acceptance:
- CI executes on target branch/PR.
- Required checks cannot be bypassed under normal merge flow.
- Failure is demonstrated by a controlled failing test/check if practical.
- Green output captured against a pinned commit.

---

# WAVE 1 - TRUST FOUNDATION

### W1.1 - Canonical Identity Vocabulary
**Root cause:** `RC-ID-01`  
**Status:** `PLANNED`

**Owner:** Sol  
**Analysis:** Astra  
**Implementation:** Sonnet 4.5  
**Review:** Opus 4.6 + Gemini

Define explicitly:
- `globalUserId`
- brand-local identity only if genuinely required
- `sessionId`
- `brandId`
- memberships
- roles
- permissions
- trusted service identity
- audit actor identity

Acceptance:
- One documented identity contract.
- No ambiguous `userId` semantics at critical boundaries.
- No client-controlled header becomes authoritative.

### W1.2 - Critical Authorization Corrections
**Status:** `PLANNED`

Implement first:
- Cross-user session revocation ownership.
- Legacy tutorial progress identity.
- Export job/exam ownership.
- Rejected privileged/internal auth must not silently downshift.
- Project LLM audit actor derived server-side.
- Human Gate 1 becomes explicit authenticated approval.

Required tests:
- User A cannot mutate User B.
- SkillUp-only identity cannot access RTH private resource.
- RTH-only identity cannot access SkillUp private resource.
- Global identity alone grants no implicit brand membership.
- Forged `x-user-id`/`x-brand` rejected or ignored.
- Invalid trusted-service authentication fails closed.
- Project LLM Gate 1 cannot be advanced by generic browser state progression.

---

# WAVE 2 - AUTHORITATIVE TRUTH

### W2.1 - Remove Fabricated Production State
**Root cause:** `RC-TRUTH-01`  
**Status:** `PLANNED`

**Implementation:** Sonnet 4.5 / Luna for low-risk UI changes  
**Review:** Gemini / Sol

Replace fake data with:
- empty state
- unavailable state
- explicit demo/reference state
- backend-authoritative persisted value

Targets include:
- SkillUp synthetic batch/program/faculty/placement.
- Exam/result fake metrics.
- Fabricated recording URLs.
- Static admin audit/operational claims.
- Project LLM fake PASS/VERIFIED/audit evidence.
- Marketing "success" controls with no real persistence.

Acceptance:
- No production route manufactures authoritative learner/payment/exam/certification state.
- Zero is not confused with missing data.
- Demo/reference pages are visibly labelled and cannot perform governance actions.

---

# WAVE 3 - CANONICAL CONTRACTS

### W3.1 - Identity Contracts
**Status:** `PLANNED`

### W3.2 - Educational Taxonomy Contracts
**Status:** `PLANNED`

### W3.3 - Question/Assessment Contracts
**Status:** `PLANNED`

### W3.4 - Tutorial/ILS Contracts
**Status:** `PLANNED`

### W3.5 - Project LLM Contracts
**Status:** `PLANNED`

### W3.6 - Analytics/Event Contracts
**Status:** `PLANNED`

**Architecture owner:** Sol  
**Schema/impact analysis:** Astra  
**Implementation:** Sonnet 4.5  
**Review:** Gemini / Argon

Rule:
```text
Runtime schema
    ->
Inferred type
    ->
Validated API boundary
    ->
Application/domain contract
```

Avoid parallel aliases unless they are explicit migration adapters.

---

# WAVE 4 - SKILLHUBCORE ADMIN

## W4.1 - Taxonomy Application/Repository Boundary
**Root causes:** `RC-DB-01`, `RC-CONTRACT-01`  
**Status:** `PLANNED`

Target:
```text
API route
  -> EducationalTaxonomyService
  -> TaxonomyRepository contract
  -> Drizzle implementation
```

Do not create unnecessary repository classes per tiny entity unless evidence requires it.

## W4.2 - Tutorial Sidebar Boundary
**Status:** `PLANNED`

Extract:
- hierarchy synchronization
- cross-DB orchestration
- persistence
- domain mapping

from the HTTP route.

## W4.3 - Question Factory Contract Consolidation
**Status:** `PLANNED`

Unify:
- Question editor
- Bulk upload
- Json validator
- server schema
- AdminQuestionEngine
- review UI

## W4.4 - Tutorial Composer Concurrency
**Status:** `PLANNED`

Use existing optimistic-version patterns for ordinary saves.

## W4.5 - Project LLM Governance
**Root cause:** `RC-PLLM-01`  
**Status:** `PLANNED`

Fix:
- Human Gate 1.
- authenticated approver.
- audit actor.
- operational vs reference vs experimental zones.
- static intelligence forbidden as certification authority.
- fake audit evidence removed.
- IDs and hashes modeled separately.
- browser no longer owns canonical workflow transitions.

## W4.6 - SHC Observability / Errors
**Status:** `PLANNED`

Introduce typed domain errors, safe client errors and structured logs.

### SkillHubCore Exit Gate
Move forward only when:
- Critical = 0.
- High = 0 or explicitly accepted with owner/date.
- Gates 1A-1H are `VERIFIED`.
- CI green.
- Independent re-audit complete.

---

# WAVE 5 - SKILLUP WEB

Use consolidated root-cause order:

1. User/session authorization boundary.
2. Canonical identity/brand contracts.
3. Remove fabricated educational/financial state.
4. Private offline caching and token handoff.
5. Tutorial renderer/progress consistency.
6. Lifecycle/billing consistency.
7. Exam/export lifecycle.
8. Runtime/browser verification.

**Status:** `PLANNED`

### SkillUp Exit Tests
- Cross-user negative authorization.
- Brand membership isolation.
- No fake data on empty/error states.
- Logout/account switch purges private offline cache.
- Canonical tutorial progress survives reload.
- Exam deadline is server-authoritative.
- Final submit idempotent.
- Export ownership enforced.
- Build/lint/typecheck/unit/integration/E2E green.

---

# WAVE 6 - REALTUTORIALHUB WEB

Priorities:
1. Identity/brand contract alignment.
2. Canonical tutorial block identity.
3. Canonical navigation completion/progress.
4. Remove secret/log leakage.
5. Remove active-route legacy fallback if architecture requires block-only publication.
6. Telemetry retry/deduplication.
7. Accessible progress sidebar.
8. Renderer registry uniqueness.
9. Build/runtime verification.

**Status:** `PLANNED`

### RTH Exit Tests
- Nested child block uses child identity.
- Brand-specific content cannot cross into other brand.
- No DB URLs/secrets logged.
- Progress survives reload/navigation.
- Telemetry failure/retry does not silently lose/double count.
- Sidebar keyboard/Escape/focus behavior works.
- Shared UI and RTH builds pass.

---

# WAVE 7 - MARKETING / PRIVACY / ANALYTICS

## W7.1 - Architecture Ownership Decision
**Root cause:** `RC-PRIVACY-01`, `RC-EVENT-01`  
**Status:** `PLANNED`

Recommended direction:
```text
Marketing browser
   ->
consent-aware client adapter
   ->
trusted analytics ingestion service
   ->
durable queue
   ->
analytics/data platform
```

Marketing package should not become an independent production identity graph/warehouse/queue platform unless explicitly approved.

## W7.2 - Consent Enforcement
- script load
- direct provider calls
- server ingest
- revocation
- expiry

## W7.3 - Brand Runtime Isolation
- tracker keyed by brand
- identity namespaced by brand
- trusted brand derivation
- unknown brand fails closed

## W7.4 - Delivery Reliability
- response status checks
- durable queue
- per-provider result
- retry/replay
- idempotency
- DLQ

## W7.5 - Consent Storage / Preference UX
- runtime schema
- exception-safe storage
- expiry/version
- reopen/revoke

## W7.6 - Public UX/SEO/Accessibility/Content Integrity
Only after privacy/identity/delivery blockers.

**Status:** `PLANNED`

---

# WAVE 8 - CROSS-APPLICATION QUALIFICATION

**Status:** `PLANNED`

Verify:

```text
Global identity
    |
    +-- SkillUp membership -> SkillUp resources only
    |
    +-- RTH membership -> RTH resources only
```

Tests:
- SkillUp only -> RTH private resource -> DENY.
- RTH only -> SkillUp private resource -> DENY.
- Both memberships -> each correct brand -> ALLOW.
- forged brand -> DENY/IGNORE.
- global identity only -> no implicit entitlement.
- direct shared-package dependency violations -> CI failure.
- direct unauthorized DB dependency -> CI failure.

Also verify:
- shared package ownership.
- database ownership.
- event contracts.
- gateway trust.
- failure isolation.
- service identity.

---

# WAVE 9 - OPERATIONAL / SCALE QUALIFICATION

**Status:** `PLANNED`

Only after application architecture is stable.

Verify with measurements:
- Cloudflare/CDN.
- caching.
- Neon pooling.
- DB connection limits.
- rate limits.
- timeouts.
- retries.
- queue backpressure.
- autoscaling.
- health checks.
- observability.
- backups.
- restore test.
- RTO/RPO.
- load test.
- failure injection.
- p95/p99 latency.
- cost per active learner.

Do not claim "million-user ready" without measured evidence.

---

# 7. Ticket Execution Protocol

Every implementation ticket must use this structure.

```text
TICKET ID
RC-___ / APP-___

GOVERNING REQUIREMENT
Exact FinalAechitecture requirement.

AUDIT FINDINGS COVERED
IDs only.

OBJECTIVE
One outcome.

AUTHORITATIVE OWNER
Service/domain that owns this behavior.

CURRENT EVIDENCE
Exact files/functions.

ALLOWED FILES
Explicit list.

DO NOT CHANGE
Explicit list.

INVARIANTS
1.
2.
3.

IMPLEMENTATION CONSTRAINTS
- No unrelated refactor.
- KISS/YAGNI.
- Preserve correct behavior.
- Server remains authoritative.
- No caller-controlled trusted identity.
- Runtime schema at trust boundary.
- Typed error handling.
- Structured/redacted logging.

REQUIRED TESTS
Positive.
Negative.
Cross-user/cross-brand if relevant.
Concurrency/idempotency if relevant.
Integration if relevant.

IMPLEMENTATION MODEL
Assigned model only.

INDEPENDENT REVIEWER
Assigned reviewer.

STATUS
PLANNED / IN_PROGRESS / IMPLEMENTED_UNVERIFIED / IN_REVIEW /
VERIFICATION_FAILED / VERIFIED / CLOSED.

EVIDENCE
Commit SHA:
Test commands:
Outputs:
Reviewer:
Architect decision:
```

---

# 8. Completion / Update Protocol for AI Models

After every AI task, update only the relevant register row.

Example:

| Ticket | Root Cause | App | Implementer | Reviewer | State | Commit | Tests | Architect |
|---|---|---|---|---|---|---|---|---|
| `ID-001` | `RC-ID-01` | Shared Auth | Sonnet 4.5 | Opus 4.6 | `IN_REVIEW` | `abc123` | Unit PASS; integration pending | Sol pending |
| `CI-001` | `RC-CI-01` | Repo | Astra | Gemini | `VERIFIED` | `def456` | CI green | Sol pending |

Rules:
- Implementer may move `PLANNED -> IN_PROGRESS -> IMPLEMENTED_UNVERIFIED`.
- Reviewer may recommend `IN_REVIEW -> VERIFIED` or `VERIFICATION_FAILED`.
- Only Sol/Principal Architect may move `VERIFIED -> CLOSED`.
- If tests fail: `VERIFICATION_FAILED`, never "mostly complete".
- A new issue discovered during implementation becomes a new child ticket; do not silently broaden the current ticket.

---

# 9. Definition of Done by Risk Level

## Critical / High
Required:
- Source fix.
- Unit test.
- Negative/security test.
- Integration/contract test where boundary crosses processes.
- CI green.
- Independent model review.
- Sol architecture review.
- Runtime/deployment test if the finding is runtime-dependent.

## Medium
Required:
- Source fix.
- Relevant unit/component/integration test.
- CI green.
- Sol or delegated review.

## Verification-only
Required:
- No code change unless evidence shows a defect.
- Execute the missing build/test/browser/deployment/load verification.
- Record result.

---

# 10. Current Program Dashboard

| Wave | Scope | Status | Blocking Next Wave? |
|---|---|---|---|
| W0 | Baseline + CI | `PLANNED` | Yes |
| W1 | Identity / authorization | `PLANNED` | Yes |
| W2 | Authoritative truth | `PLANNED` | Yes for affected domains |
| W3 | Canonical contracts | `PLANNED` | Yes for major domain refactors |
| W4 | SkillHubCore Admin | `PLANNED` | Yes |
| W5 | SkillUp Web | `PLANNED` | Yes |
| W6 | RTH Web | `PLANNED` | Yes |
| W7 | Marketing/privacy | `PLANNED` | Yes for marketing release |
| W8 | Cross-platform qualification | `PLANNED` | Yes |
| W9 | Operational/scale qualification | `PLANNED` | Final |

---

# 11. First Execution Order

Start exactly here:

1. **W0.1** - Pin branch/HEAD and root-cause register.
2. **W0.2** - Activate CI and required checks.
3. **W1.1** - Canonical identity vocabulary/contract.
4. **W1.2** - Critical authorization fixes.
5. **W2.1** - Remove highest-risk fabricated production truth.
6. Re-audit those changes.
7. **W3** - Canonical contracts.
8. **W4** - Close SkillHubCore Admin Gates 1A-1H.
9. **W5** - SkillUp.
10. **W6** - RTH.
11. **W7** - Marketing/privacy/analytics.
12. **W8** - Cross-platform qualification.
13. **W9** - Operational and scale qualification.

---

# 12. Final Architecture Acceptance Principle

No application is considered complete because:
- source looks good,
- an AI says it is fixed,
- one test passes,
- or a build succeeds.

Acceptance requires:

```text
FinalAechitecture requirement
    +
implemented ownership/boundary
    +
required tests
    +
CI
    +
independent review
    +
runtime evidence where applicable
    =
CLOSED
```

This file is the program execution authority for remediation work unless the project owner explicitly approves an architecture-plan revision.
