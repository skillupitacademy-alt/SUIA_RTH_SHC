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
**Status:** `CLOSED`

**Owner:** Sol
**Implementer:** Claude Sonnet 4.5
**Independent Verifier:** Gemini 3.8
**Objective:** Establish immutable implementation baseline.

**Implementation Branch:** `remediation/w0-1-baseline`
**Baseline Commit:** `d392318bfd987686c24d3238ee121c69ed456524`
**Implementation Timestamp:** 2026-11-01 20:42:28 +05:30
**Working Tree:** Clean (no uncommitted changes at baseline)

**Deliverables:**
1. ✅ `audit/Remediation_Baseline.md` — Immutable baseline record
2. ✅ `audit/Canonical_Root_Cause_Register.csv` — 12 canonical root causes
3. ✅ `audit/Audit_Finding_Root_Cause_Crosswalk.csv` — 91 audit findings mapped to root causes
4. ✅ `audit/Audit_Finding_Root_Cause_Crosswalk_README.md` — Methodology and coverage documentation
5. ✅ `audit/W0.1_Execution_Report.md` — Implementation evidence and validation
6. ✅ This section updated with W0.1 evidence

**Governing Document Hashes (SHA-256):**

Hash measurement method: CRLF checkout representation at Windows workstation.

- `FinalAechitecture.md`: `EE5DFC683732693B21695739BCCAB417C277ED084787EB833DF382697189CF52`
- `Architecture_Remediation_Execution_Plan.md` (input, before W0.1 edits): `48C09A5539A5A9A4A8D73BD2DBF3A13AD6D7103C66E8EBEF7600B19521A183E4` (CRLF checkout)
- `CompleteProjectAudit.md`: `E2D019D5829D29ED144CB281EBA01B5529B5DA02F964910E9ABDC1BED72A5ED4`
- `CompleteProjectMatrix.md`: `E3F8F9DC1FAF0BEE5DFB058FC2EEAB201F5B8FC34F0DF157BA772B7221D2A7C9`

Note: Execution plan input hash is CRLF checkout representation. Git blob bytes at baseline commit d392318b have SHA-256 `7B2DE986E7DB8A3CEA8EC793354F386A89E4A20D461945353DD32391A8189E76` (LF line endings). Both measurements are valid; they differ due to line-ending normalization during checkout.

**Validation Evidence:**
```powershell
# CSV parsing and structure validation
Import-Csv "audit/Canonical_Root_Cause_Register.csv"  # 12 rows
Import-Csv "audit/Audit_Finding_Root_Cause_Crosswalk.csv"  # 91 rows

# Root-cause coverage check (audit findings only, root-cause definitions removed from crosswalk)
RC-ID-01:       14 findings mapped
RC-TRUTH-01:     3 findings mapped
RC-CI-01:        3 findings mapped
RC-CONTRACT-01: 23 findings mapped
RC-DB-01:       11 findings mapped
RC-EVENT-01:     1 findings mapped
RC-TUTORIAL-01: 18 findings mapped
RC-ASSESS-01:    1 findings mapped
RC-PLLM-01:      1 findings mapped
RC-PRIVACY-01:   2 findings mapped
RC-OBS-01:       9 findings mapped
RC-UI-01:        5 findings mapped

# Cross-reference validation
✓ All primary root causes resolve to canonical register
✓ All related root causes resolve to canonical register
✓ No duplicate (source_document, source_section_or_line, original_finding_id) keys
✓ CSV files parse without errors

# Git checks
git status --short   # 7 new files, 1 modified
git diff --check     # No whitespace errors
git branch --show-current  # remediation/w0-1-baseline
git rev-parse HEAD   # d392318bfd987686c24d3238ee121c69ed456524
```

**Files Modified (W0.1 only):**
- `audit/Remediation_Baseline.md` (new)
- `audit/Canonical_Root_Cause_Register.csv` (new)
- `audit/Audit_Finding_Root_Cause_Crosswalk.csv` (new)
- `audit/Audit_Finding_Root_Cause_Crosswalk_README.md` (new)
- `audit/W0.1_Execution_Report.md` (new)
- `audit/W0.1_Gemini_Verification_Brief.md` (new)
- `audit/Architecture_Remediation_Execution_Plan.md` (W0.1 section update only)

**Files NOT Modified:**
- No application, package, service, or test code
- No original audit evidence files
- No architecture requirement documents (`FinalAechitecture.md` unchanged)
- No environment configuration
- No CI workflow files
- No commits, pushes, or merges during worker implementation; owner-authorized scoped commit/push follows Sol acceptance

**Coverage and Limitations:**
- Crosswalk contains 91 audit findings (not 200+; that count included file-level evidence ledger rows)
- Root-cause definitions kept in canonical register, not duplicated in crosswalk
- Formal audit IDs where they exist (68 entries); exact line references for observations without IDs (23 entries)
- Positive architectural observations documented in reconciliation_notes column
- High-priority and systemic findings from all applications mapped
- Complete finding enumeration proposed for dedicated audit-reconciliation ticket (Wave 1–2)
- Gaps explicitly documented in crosswalk README
- Missing audit evidence NOT treated as implicit `PASS` or `N_A`

**Acceptance:** Sol accepts W0.1 as `CLOSED` for baseline/register scope only.
See `audit/W0.1_Sol_Acceptance.md` for Gemini Round 3 evidence, Sol checks,
verification applicability and follow-up. All mapped findings remain `PLANNED`.
W0.2 remains `PLANNED` and is the next ticket.

**Exit Criteria:**
- ✅ One branch/HEAD recorded
- ✅ Root-cause register exists (12 canonical root causes)
- ✅ Finding crosswalk created with explicit provenance
- ✅ No duplicate root-cause ownership
- ✅ CSV validation passed
- ⏳ Independent verification pending
- ⏳ Sol acceptance pending

---

### W0.2 - Portable Quality / Architecture Safety Net
**Root cause:** `RC-CI-01`
**Status:** `CLOSED` (repository gate scope; deployment enforcement remains open)

**Architecture owner:** Sol
**Sole implementer:** Claude Sonnet 4.5
**Independent verifier:** Gemini
**Acceptance record:** `audit/W0.2_Sol_Acceptance.md`
**Reviewed commit:** `255c4f180c3b88306458643818f5ed0fe23eb680`
**Branch:** `remediation/w0-2-ci-safety-net`

Accepted: canonical six-stage `pnpm quality:skillhubcore` command; AST checker
with 18 existing persistence-route exceptions; 80-handler API boundary scan;
security tests, strict lint, typecheck, four-file isolated test selection and
completed build/aggregate evidence. Sol reran 10 production-runner tests and
13 scanner tests. The captured completed aggregate exits 0. See acceptance
for independently supplied evidence, applicability and limits.

The successful build used Turbopack. `TURBOPACK=0` is a nonempty environment
value and does not select Webpack in the installed Next.js implementation.
Earlier root-cause/workaround claims are superseded by the acceptance record.

GitHub Actions and required GitHub branch checks remain `DEFERRED` at the
owner's instruction. No Hostinger deployment or runtime qualification is
claimed. Existing audit findings remain open. RC-CI-01 remains IN_PROGRESS.

### W0.2-HOSTINGER - Pre-build Quality Enforcement and Provenance
**Root cause:** `RC-CI-01`
**Status:** `VERIFICATION_FAILED` (Sol review of 63d66cd8: production corrections present; final-boundary actual-entrypoint tests and remaining catch-as-success cases pending)
**Application:** SHC deployment path; other service qualification excluded
**Priority:** P0
**Sole implementer:** Claude Sonnet 4.5
**Independent verifier:** Gemini
**Acceptance authority:** Sol
**Implementation authorization:** `audit/W0.2_HOSTINGER_Sol_Design_Decision.md`
**Dependencies:** W0.2 repository gate
**Architecture requirements:** secure defaults, explicit service ownership,
controlled changes, reproducible quality and source/artifact provenance
**Audit references:** RC-CI-01 crosswalk entries; W0.2 deployment investigation

Trace `scripts/deploy-smart.ps1` through local image build/save, manifest,
upload and load. Invoke the canonical SHC gate before build/upload for the
resolved SHC service selection, including mixed deployments. `-SkipChecks`
must not bypass it. Bind evidence to exact clean source/build input and
service; detect source drift and abort. Use mocked execution to prove no
build/upload/restart on failure. Do not infer full-service qualification
from SHC results. No production execution is authorized.

**Implementation commits:** 9fe8e5ae (core), 418b6f22 (evidence doc), ae992e93 (handoff)
**Implementation artifacts:**
- `audit/W0.2_HOSTINGER_Implementation_Evidence.md` - Full implementation evidence
- `audit/W0.2_HOSTINGER_Gemini_Handoff.md` - Verification handoff to Gemini
- `scripts/enforce-shc-quality-gate.ps1` - Mandatory gate enforcer (NEW)
- `scripts/deploy-smart.ps1` - Added Step 4.5 (NOT bypassed by -SkipChecks)
- `infra/hostinger/scripts/build-save-images.ps1` - Evidence validation + recheck
- `scripts/__tests__/test-hostinger-enforcement.ps1` - 8/8 tests PASSING (gitignored)

**Evidence schema:** v1.0 JSON with full 40-char commit SHA, transient in `infra/hostinger/dist/evidence/`
**Verification checkpoints:** Before gate, after gate, after build (3x source verification)
**Evidence invalidation:** Old evidence deleted before new gate execution
**Builder protection:** Validates evidence before Docker build (fail closed on missing/invalid)

Acceptance: positive and negative script tests, source-drift/stale-evidence
checks, mixed-service and SkipChecks cases, canonical repository gate,
independent verification, scoped diff and actual artifact/runtime evidence
where required. Runtime evidence not obtained remains explicitly unverified.
SHC deployment enforcement is not complete until this follow-up is accepted.
Overall deployment safety additionally requires the SUIA, RTH and mixed-service
follow-ups below. Their registration does not expand this SHC ticket's scope.

**Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_f691fb7e.md` ? builder drift, receipt reuse and executable coverage corrections required.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_d45d9416.md` ? actual-entrypoint tests and publication evidence corrections pending.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_08dbb9e1.md` ? executed post-save source drift and mid-build receipt mutation probes still reach upload.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_9c34bb83.md` - receipt binding and post-save checks confirmed; negative tests still swallow exceptions and deployer lacks final publication cleanliness check.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_63d66cd8.md` - final publication check and scenarios 9/10 confirmed; scenario 11 duplicates policy and scenarios 4/6/7 retain catch-as-success paths. Remaining correction is scoped to verification harness/evidence.

### DEPLOY-SUIA-01 - SUIA Quality Gate and Hostinger Enforcement
**Root cause:** `RC-CI-01`
**Status:** `PLANNED`
**Wave:** 5 (SkillUp application qualification; after SHC enforcement pattern)
**Application:** `apps/skillup-web`
**Priority:** P0 for SUIA deployment qualification
**Sole implementer:** Claude Sonnet 4.5 (when activated by Sol)
**Independent verifier:** Gemini
**Acceptance authority:** Sol
**Dependencies:** W0.2-HOSTINGER; SUIA test/configuration inventory and reviewed
application-specific gate design
**Audit references:** RC-CI-01 crosswalk; SUIA quality/test/operational findings
must be reconciled against the implementation baseline at activation
**Architecture requirements:** secure defaults, reproducible engineering
gates, independent brand qualification, source/artifact provenance

Establish SUIA's own canonical quality command and invoke it for every resolved
SUIA service selection before build/upload. No `-SkipChecks` or alternative
flag may bypass the mandatory gate. Bind tested source to actual build input;
fail closed on quality errors or missing/stale/mismatched provenance. Reuse
the accepted mechanism without assuming SHC's tests qualify SUIA.

Acceptance: application architecture/security/lint/type/unit/build evidence;
safe test isolation; service-selection and mixed-service negative tests;
source-drift and provenance rejection tests; proof that failure prevents
build/upload; independent Gemini reproduction; Sol acceptance; controlled
deployment/runtime evidence wherever the claim requires it. No production
execution is authorized by registration.

### DEPLOY-RTH-01 - RTH Quality Gate and Hostinger Enforcement
**Root cause:** `RC-CI-01`
**Status:** `PLANNED`
**Wave:** 6 (RTH application qualification; following SUIA)
**Application:** `apps/realtutorialhub-web`
**Priority:** P0 for RTH deployment qualification
**Sole implementer:** Claude Sonnet 4.5 (when activated by Sol)
**Independent verifier:** Gemini
**Acceptance authority:** Sol
**Dependencies:** W0.2-HOSTINGER; DEPLOY-SUIA-01; RTH test/configuration inventory
and reviewed application-specific gate design
**Audit references:** RC-CI-01 crosswalk; RTH quality/test/operational findings
must be reconciled against the implementation baseline at activation
**Architecture requirements:** secure defaults, reproducible engineering
gates, independent brand qualification, source/artifact provenance

Establish RTH's own canonical quality command and mandatory invocation for
every resolved RTH service selection before build/upload. No `-SkipChecks` or
alternative flag bypass. Require tested-source/build-input consistency and
fail closed on quality or provenance failures. SHC/SUIA successes provide no
implicit RTH qualification.

Acceptance: the same per-application repository, negative selection, failure
propagation, source/artifact and independent-verification requirements as
DEPLOY-SUIA-01, evaluated using RTH-specific tests. Deployment/runtime claims
require their own controlled evidence. No production execution is authorized
by registration.

### DEPLOY-MIXED-01 - Cross-Application Deployment Gate Qualification
**Root cause:** `RC-CI-01`
**Status:** `PLANNED`
**Wave:** 8 (cross-application qualification)
**Application:** SHC, SUIA and RTH selection through the deployment entrypoint
**Priority:** P0 for overall deployment-safety acceptance
**Sole implementer:** Claude Sonnet 4.5 (when activated by Sol)
**Independent verifier:** Gemini
**Acceptance authority:** Sol
**Dependencies:** W0.2-HOSTINGER, DEPLOY-SUIA-01, DEPLOY-RTH-01
**Audit references:** RC-CI-01; accepted per-application enforcement evidence
**Architecture requirements:** failure isolation, explicit coverage,
fail-closed automation, trustworthy artifact provenance

Verify each app alone, pairs, and all three together, including the owner's
five-service command with project-ai and api-server. Resolve explicit,
default, auto-detected and aliased selections using the actual deployment
contract. Every selected app's applicable mandatory gate must execute exactly
as defined; any failure or invalid provenance prevents deployment mutation.
Flags, ordering, duplicate service names and unsupported service handling
must not silently omit an applicable gate or manufacture a global PASS.

Acceptance: independently executed selection/flag matrix, per-app failure
injection and trace assertions proving no build/upload after failure,
per-service source/artifact binding, scoped coverage reporting and Sol review.
Other services require separate qualification; these three apps' gates must
not certify Project AI or API-server behavior implicitly.

**Overall deployment safety closure rule:** SHC, SUIA and RTH must each be
independently protected and verified, and DEPLOY-MIXED-01 must be accepted.
Until then, report precise accepted coverage and remaining gaps; do not call
the overall deployment safety program complete. Current W0.2-HOSTINGER
implementation remains SHC-only.

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
