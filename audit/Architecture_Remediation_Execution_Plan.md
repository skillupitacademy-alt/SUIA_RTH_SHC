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
8. Follow SOLID pragmatically together with DRY, KISS, YAGNI, SoC, high cohesion and low coupling. Apply these immediately to every relevant change, including W1.2-SESS-01; do not defer them to app remediation waves.
9. Browser/UI state is never authoritative for identity, authorization, audit approval, exam state, certification, payments, or persisted learner state.
10. Static/demo/reference data must never be presented as production `CURRENT`, `PASS`, `VERIFIED`, `APPROVED`, `CERTIFIED`, `HEALTHY`, or `AUDITED`.
11. All trusted identity and brand context must be derived or validated server-side.
12. Important writes must be transactional/idempotent where the domain requires it.
13. Every change requires acceptance tests.
14. No model may state "fixed", "verified", or "complete" without evidence.
15. Production/runtime claims require runtime/deployment evidence, not source inspection alone.

Engineering-principle enforcement is mandatory on each scoped implementation:
the implementer records applicable responsibility/dependency, ownership, reuse,
simplicity, security and testability evidence; the independent verifier assesses
it; Sol decides acceptance. Do not expand a ticket into unrelated refactoring.
Record out-of-scope source-backed violations with file/line, canonical root cause,
affected app, proposed ticket/dependency and status so they remain actionable.
Waves 4/5/6 must each maintain an application-specific architecture acceptance
matrix for SHC/SUIA/RTH, respectively. A mandatory finding must be corrected or
covered by an explicit approved exception before the app is architecturally
accepted. Passing functional tests or builds alone is insufficient.

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
**Status:** `CLOSED` (Sol acceptance of bd76163b; SHC deployment-script enforcement only; runtime qualification separate)
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
**Verification checkpoints:** Before/after gate, before/after build, after packaging and before publication
**Evidence invalidation:** Old evidence deleted before new gate execution
**Builder protection:** Validates evidence before Docker build (fail closed on missing/invalid)

Acceptance: positive and negative script tests, source-drift/stale-evidence
checks, mixed-service and SkipChecks cases, canonical repository gate,
independent verification, scoped diff and actual artifact/runtime evidence
where required. Runtime evidence not obtained remains explicitly unverified.
SHC deployment-script enforcement accepted; actual Hostinger runtime qualification remains separate.
Overall deployment safety additionally requires the SUIA, RTH and mixed-service
follow-ups below. Their registration does not expand this SHC ticket's scope.

**Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_f691fb7e.md` ? builder drift, receipt reuse and executable coverage corrections required.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_d45d9416.md` ? actual-entrypoint tests and publication evidence corrections pending.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_08dbb9e1.md` ? executed post-save source drift and mid-build receipt mutation probes still reach upload.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_9c34bb83.md` - receipt binding and post-save checks confirmed; negative tests still swallow exceptions and deployer lacks final publication cleanliness check.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_63d66cd8.md` - final publication check and scenarios 9/10 confirmed; scenario 11 duplicates policy and scenarios 4/6/7 retain catch-as-success paths. Remaining correction is scoped to verification harness/evidence.

**Latest Sol review:** `audit/W0.2_HOSTINGER_Sol_Review_434b3556.md` - independently reproduced 11 scenarios/36 assertions; final-boundary evidence remains pending because scenario 11 is rejected by the earlier builder check. Harness-only correction requested.

**Deterministic guidance:** `audit/W0.2_HOSTINGER_Scenario11_PowerShell_Guidance.md` - Sol established module pre-import pattern for Get-FileHash override at deployer tar hash boundary.

**Gemini verification report:** `audit/W0.2_HOSTINGER_Verification_Report.md` (Revision 6) - independently reproduced normal run (36/36 PASS) and disposable mutation run (sensitivity proven; removal of final check causes unverified drift publication).

**Authoritative acceptance:** `audit/W0.2_HOSTINGER_Sol_Acceptance.md` - supersedes interim verification statuses; SUIA/RTH/mixed qualification remains open.

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

### W1.1 - Tenant Identity Vocabulary and Architecture Reconciliation
**Root cause:** `RC-ID-01`
**Status:** `CLOSED` (Sol acceptance of b35f430d plus supporting-document integration corrections; architecture/documentation scope only)
**Owner:** Sol
**Implementation:** Sonnet 4.5 (documentation/architecture amendment)
**Independent verification:** Gemini 3.8
**Specialist review:** Opus 4.6 before later high-risk auth implementation
**Branch:** remediation/w1-1-identity-reconciliation
**Baseline:** 567970d55f7b147d0a32417fdc7d89d24697c44e
**Scope and task package:** `audit/W1.1_Approved_Amendment_Task.md`
**Owner approval:** `audit/W1.1_Architecture_Decision_For_Owner_Approval.md`
**Sol reviews:** `audit/W1.1_Sol_Review_3021c24d.md`, `audit/W1.1_Sol_Review_60bd89bb.md`, `audit/W1.1_Sol_Review_147bf562.md`, `audit/W1.1_Sol_Review_abc36be3.md`
**Implementation evidence:** `audit/W1.1_Correction_Summary.md`, `audit/W1.1_Evidence_Authority_Table.md`

**Owner-approved architecture direction:**

1. SUIA (`skillup`) and RTH (`realtutorialhub`) own independent learner accounts, credentials/session boundaries and learner records
2. Equal learner IDs or emails across tenants identify independent learners; no automatic linking
3. Qualified learner reference includes verified platform and local learner ID; existing `platform`/`brand` values used
4. SHC people DB maintains optional platform-specific infrastructure projections for service coordination (not replacement learner identity)
5. `shared` describes resource scope requiring authorization; never learner authority or implicit cross-tenant permission

**Implementation scope:** Documentation and architecture amendment only. No source code, schema, credentials, behavior, migration, deployment or merge changes.

**Deliverables:**
- ✅ `audit/FinalAechitecture.md` amended (sections 3, 4, table 2590)
- ✅ `audit/W1.1_Identity_Contract_Reconciliation.md` corrected (per Sol reviews 3021c24d/60bd89bb/147bf562/abc36be3)
- ✅ `audit/W1.1_Evidence_Authority_Table.md` created (authoritative identity contract)
- ✅ `audit/W1.1_Correction_Summary.md` created (implementation evidence)
- ✅ `audit/Architecture_Remediation_Execution_Plan.md` W1.1/W1.2/Wave 8 criteria reconciled
- ✅ Gemini independent verification complete (Revision 5 - PASS)
- ⏳ Sol final acceptance recorded in audit/W1.1_Sol_Acceptance.md

**Acceptance criteria:**
- Tenant-scoped learnerId is canonical (not globalUserId)
- SHC shadowUserId is optional cross-reference (not replacement identity)
- platform/brand values validated and tenant-scoped
- shared resource authorization verified (not automatic learner permission)
- Source citations accurate
- Contradictory global-learner statements removed
- Staff/service identity preserved where applicable
- Historical evidence intact
- git diff --check passes
- Gemini verification complete
- Sol acceptance recorded

**Follow-on tickets:**
- W1.1.2: Session persistence investigation (read-only)
- W1.2-EMAIL: People DB composite email uniqueness (separate approval required)
- W1.2: Authorization behavioral corrections (depends on W1.1 acceptance)

**Latest review/correction task:** `audit/W1.1_Sol_Review_abc36be3.md`. Independent verification must include Sol's local section-4 documentation correction.

**Authoritative acceptance:** `audit/W1.1_Sol_Acceptance.md`. Runtime findings remain open; prior interim status labels are superseded.

### W1.1.2 - Session Persistence and Tenant Binding Discovery
**Status:** `CLOSED` (source investigation accepted; W1.1.2_Sol_Acceptance.md; runtime defects remain open)
**Root cause:** `RC-ID-01`
**Wave:** 1
**Application:** SHC auth with SUIA/RTH read-only dependencies
**Priority:** P0 before session ownership implementation
**Implementer:** Sonnet 4.5
**Independent verifier:** Gemini 3.8
**Acceptance:** Sol
**Dependency:** W1.1 accepted documentation
**Scope, audit mapping, allowed files and acceptance:** `audit/W1.1.2_Session_Discovery_Task.md`
No production changes or DB access; source evidence and proposed regression cases only.

**Corrected evidence:** `audit/W1.1.2_Session_Persistence_Investigation.md` (commit `0247f981`, reviewed and corrected 2026-11-02; Gemini Rev 2 verification PASS).

**Key findings:**
- Existing routes documented: GET/DELETE /api/auth/sessions, DELETE /api/auth/sessions/[sessionId], POST /api/auth/logout-all
- SU-SESSION-010 ownership defect confirmed: GlobalLogoutService.revokeSession (L113) drops userId before calling TokenRepository.revokeById
- Generic SessionService wiring unresolved (POST /api/auth/logout-all); runtime behavior unknown; alternative working route exists (DELETE /api/auth/sessions)
- No brand column in refresh_tokens; not a defect given database routing and JWT signature validation
- Focused implementation proposal: W1.2-SESS-01 for single-session revocation ownership only

**Acceptance:** `audit/W1.1.2_Sol_Acceptance.md`.

### W1.2-SESS-01 - Existing Single-Session Revocation Ownership
**Status:** `CLOSED` (Sol acceptance: source ownership correction, 30 focused tests, actual mutation proof, Opus review and full six-stage canonical gate exit 0; runtime qualification separate)
**Wave / root cause:** 1 / RC-ID-01
**Application:** API auth service supporting independent SUIA/RTH tenants
**Audit mapping:** SU-SESSION-010; source review W1.1.2
**Priority:** P0 security correction
**Implementer:** Gemini 3.8 (sole remaining correction implementer; replaces Sonnet per owner instruction)
**Independent verifier:** Opus 4.6 preferred; if unavailable, Sonnet read-only on Gemini corrections with prior authorship disclosed; Sol decides review sufficiency
**Acceptance:** Sol
**Dependency:** corrected W1.1.2 evidence and bounded implementation package
Baseline source showed GlobalLogoutService dropped the verified user ID before an optional
repository owner filter. Correct the existing path; do not add duplicate routes.
Require owner-scoped persistence, no accidental unscoped revocation, relevant
caller review, positive/cross-user/cross-platform/invalid-context regression tests,
applicable quality checks and independently executed verification. No authorization
of refresh redesign, schema migration or deployment from this planned entry.

**Assigned implementation package:** `audit/W1.2-SESS-01_Ownership_Task.md`. Sonnet implements; Gemini verifies; specialist review and Sol acceptance required. No deployment authorization.

**Current review/correction package:** `audit/W1.2-SESS-01_Sol_Review_bd3c7489.md`. Corrections committed at `1712dc9b` / `ff8b3422`. Gemini Rev 2 report at `audit/W1.2-SESS-01_Gemini_Verification_Report.md`. No finding/root-cause closure or deployment authorization.

**Latest correction task:** `audit/W1.2-SESS-01_Sol_Review_57b0979a.md`. No waived route/quality gate or finding closure.

**Current authoritative assignment:** `audit/W1.2-SESS-01_Gemini_Takeover_Task.md`. Sonnet stops editing this ticket. Gemini implementation is not its own independent verification. Sol retains final acceptance; prior assignment wording is superseded.

**Authoritative acceptance:** `audit/W1.2-SESS-01_Sol_Acceptance.md`. Sol resolved Opus's minor directive finding with a comment-only change. RC-ID-01 remains IN_PROGRESS; deployment and broader auth boundaries remain separately gated.

### W1.2-REFRESH-01 - Refresh Authority and Rotation Discovery
**Status:** `CLOSED` (Sol source-discovery acceptance of 148a613c; exploit severity, reviewer attribution and runtime claims qualified)
**Wave / root cause:** 1 / RC-ID-01
**Application:** API auth and SUIA/RTH caller boundaries
**Priority:** P0 read-only investigation
**Implementer:** Gemini 3.8 (sole investigator)
**Independent verifier:** Sol source review; supplied Sonnet attribution unverified after failed model-launch handoff
**Acceptance:** Sol
**Dependency:** W1.2-SESS-01 accepted
**Scope, audit mapping and acceptance:** `audit/W1.2-REFRESH-01_Authority_Discovery_Task.md`
**Investigation Deliverable:** `audit/W1.2-REFRESH-01_Investigation.md`
Traced token issuer/audience/platform, stored owner, DB selection, TOCTOU concurrent rotation race, replay gaps, and broken pre-existing unit tests. Ready for Sonnet independent review. No auth changes, database access, new storage or rollout.

**Authoritative acceptance:** `audit/W1.2-REFRESH-01_Sol_Acceptance.md`. No assertion of five executed Critical exploits; no existing production behavior was changed.

**Controlled batch assignment:** `audit/W1.2_Gemini_Controlled_Batch_01.md` - Gemini may implement REFRESH-02 and then prepare REFRESH-03 read-only in one run, using separate commits/evidence and separate Sol acceptance. No REFRESH-03 behavior changes or other ticket expansion authorized.

### W1.2-REFRESH-02 - Atomic Single-Consumer Refresh Rotation
**Status:** `CLOSED` (Sol independently verified 48 API tests, 153 auth tests, actual-source mutation, both typechecks and complete six-stage SHC gate; authority/lifecycle follow-ups remain open)
**Wave / root cause:** 1 / RC-ID-01
**Application / priority:** API refresh service and canonical signer / P0
**Dependency:** W1.2-REFRESH-01 source discovery accepted
**Implementer:** Gemini 3.8 (sole worker per audit/W1.2_Gemini_Controlled_Batch_01.md)
**Independent security reviewer:** Sol source/execution review; supplied same-session Opus 5.5 report is supplementary, not independent sign-off
**Acceptance:** Sol
**Scope, audit context, files, tests and acceptance:** `audit/W1.2-REFRESH-02_Atomic_Rotation_Task.md`
**Implementation Deliverable:** `audit/W1.2-REFRESH-02_Execution_Report.md`
Proved concurrent consumption and same-second token uniqueness cases, then enforced
one successful consume plus successor in one transaction. Limited additive jti
only to prevent reproduced same-second collision; preserved legacy verifier compatibility. No
schema, issuer/key migration, family-revocation design or deployment authorized.

**Separate acceptance record:** `audit/W1.2-REFRESH-02-03_Sol_Acceptance.md`.

### W1.2-REFRESH-03 - Authority and Account Lifecycle Qualification
**Status:** `CLOSED` (Sol source/design acceptance; ingress, lifecycle impact and legacy claim behavior qualified; no authority behavior fixed)
**Wave / root cause:** 1 / RC-ID-01
**Application / priority:** shared auth and tenant boundaries / P0 design
**Implementer:** Gemini 3.8 (sole worker per audit/W1.2_Gemini_Controlled_Batch_01.md)
**Independent reviewer:** Sol source review; same-session Opus 5.5 self-review disclosed
**Investigation Deliverable:** `audit/W1.2-REFRESH-03_Authority_Investigation.md`
Traced verified brand/audience/issuer, stored subject, original/shadow mapping,
blocked/deleted account revocation and request-host/header authority. Documented
findings with direct source citations; recommended minimal follow-on scope without modifying code.
No token-policy migration, live database execution, or code edits authorized.

**Acceptance and final source qualifications:** `audit/W1.2-REFRESH-02-03_Sol_Acceptance.md`. Task A closure remains independently gated.

### W1.2-REFRESH-04 - Replay Classification and Post-Commit Failure Policy
**Status:** `CLOSED` (Sol accepts source/design investigation at reviewed da6c0742 with final editorial qualifications in `audit/W1.2_Batch_04_Sol_Acceptance.md`; proposed runtime changes remain separate)
**Wave / root causes:** 1 / RC-ID-01, RC-EVENT-01
**Application / priority:** refresh lifecycle / P1 design
**Implementer:** Gemini when separately assigned
**Independent reviewer:** separately attributable security reviewer; Sol accepts
Qualify revoked-token rejection versus reuse detection, actual token-family
ownership/storage, descendant revocation policy and audit-after-commit response
failure. Do not introduce schema, outbox, global session framework or automatic
family-wide revocation without a separate justified design and approval.

### W1.2-REFRESH-05 - Token Authority & Brand Binding Integrity
**Status:** `CLOSED` (CLOSED by Sol at reviewed d512beb8: scoped authority/context guards accepted with independent regressions, mutation evidence, typechecks, lint and completed API/SHC builds; deployment and six-host browser qualification outstanding)
**Wave / root cause:** 1 / RC-ID-01
**Application / priority:** API refresh service / P1
**Contract Deliverable:** `audit/W1.2-REFRESH-05_Authority_Contract.md`
**Scope:** Enforce token payload `brand` claim against target tenant DB context; enforce subject parity between JWT `userId` and database session `userId`; validate request brand against verified hostname candidates; execute all verifications before database writes; preserve legacy compatibility for strictly absent claims.

### W1.2-REFRESH-06 - Account Lifecycle & Fresh Role Revalidation
**Status:** `CLOSED` (CLOSED by Sol at reviewed d512beb8: strict tenant eligibility/current roles and pre-rotation denial ordering accepted; 95 selected regressions and sensitive tenant fixtures verified; broader lifecycle triggers/guard work remain separate)
**Wave / root cause:** 1 / RC-ID-01
**Application / priority:** API refresh service / P1
**Contract Deliverable:** `audit/W1.2-REFRESH-06_Lifecycle_Contract.md`
**Scope:** Define strict repository lookup (`findActiveUserWithRoles`) on `UserRepository`; verify active user state (`!user.isBlocked`, `!user.deletedAt`); dynamically fetch fresh roles while strictly preserving principal boundaries (no learner escalation, demoted admin fail-closed); accounts for actual 8-hour access token TTL; resolves baseline `auth.refresh.blocked.branch.test.ts`.

**Runtime acceptance:** `audit/W1.2_Batch_03_Sol_Acceptance.md` closes both scoped implementation tickets. Prior review failures and author submissions remain historical evidence; their pending states are superseded by this acceptance. RC-ID-01 stays IN_PROGRESS.

**Design provenance:** `audit/W1.2_Batch_02_Sol_Acceptance.md` and the verified contracts remain governing. Actual deployed isolation, immediate access revocation and every learner/admin journey are not claimed fixed.

**Next controlled batch:** `audit/W1.2_Gemini_Controlled_Batch_04_Task.md` assigns GUARD-01 and REFRESH-04 source/design qualification only, with separate commits and independent review. No runtime policy change, live DB or deployment is authorized in that batch.

**Browser qualification:** Keep the six-host production/local login -> refresh -> protected dashboard -> logout matrix under Wave 8 qualification. No local/production journey has been executed by this source acceptance; cookies, redirects, ingress and physical DB topology remain outstanding.

**Owner browser requirement:** `audit/Authentication_Browser_Qualification_Requirements.md`
is mandatory for relevant authentication implementation/acceptance tasks and browser
handoffs. Run an early separately scoped controlled-environment Chromium/Playwright
smoke gate when accepted code is available; retain the formal Wave 8 matrix and
separate authorization for production deployment/testing.

### W1.2-BROWSER-01 - Early Controlled Authentication Smoke Qualification
**Status:** `IN_PROGRESS` (Preparation `IMPLEMENTED_UNVERIFIED`: allowlisted safe reporter suppresses raw errors/stdout/stderr; deliberate failure probe passes with bare opaque secrets and artifact cleanup; strict pre-fixture readiness validates build/accounts/chromium; guarded API transport blocks service workers and unvalidated redirects. Real journeys remain `NOT EXECUTED` pending synthetic prerequisites.)
**Wave / root cause:** early Wave 1 runtime verification / RC-ID-01
**Requirement:** `audit/Authentication_Browser_Qualification_Requirements.md`
**Assignment:** Batch 05 Task D (`audit/W1.2_Gemini_Controlled_Batch_05_Task.md`): readiness/executable preparation and conditional controlled smoke; preparation alone cannot close this ticket.
**Scope:** Playwright Chromium SUIA/RTH learner and SHC admin login, protected dashboard,
approved refresh/logout, invalid credentials, blocked-account refresh, same-email tenant
independence, account switching, cookies/redirects and cross-tenant denial. Pin tested
source/build and environment; require executable results, secret-free failure evidence,
independent verification and Sol acceptance. Record known SHC gaps rather than inventing
supported refresh. No broad refactor, production deployment or production test authorization.
This early gate supplements, and does not close or replace, formal Wave 8 qualification.

### W1.2-GUARD-01 - Downstream Principal and SHC Compatibility Qualification
**Status:** `CLOSED` (Sol accepts bounded source investigation at reviewed da6c0742 with SHC/client/store/guard qualifications in `audit/W1.2_Batch_04_Sol_Acceptance.md`; no whole-application or deployed journey acceptance)
**Wave / root cause:** 1 / RC-ID-01
**Application / priority:** tenant RBAC, generic infra/default DB and SHC auth callers / P1 design
**Implementer:** Gemini when separately assigned; independent reviewer and acceptance: Sol
Trace role-based and DB-fallback admin authorization, audience/principal enforcement,
actual generic infrastructure issuers/cookies/default tables, API shc-admin GUI
refresh persistence and specialized people/Redis flow. Propose minimal changes
only from source evidence; do not treat refreshed role capping as universal portal
isolation or decommission SHC flows. Source/topology uncertainties remain explicit.
No runtime edit, key/issuer change, DB migration or deployment authorized here.

### W1.2-REFRESH-07 - Metadata and Revoked-Record Diagnostics Scoping
**Status:** `CLOSED` (Sol accepts scoped metadata-write removal at reviewed bb8bd1f3 / Task A 60eb5bc0; 55 isolated regressions and API typecheck passed, actual-source sensitivity verified; diagnostics/runtime browser qualification remain separate. See `audit/W1.2_Batch_05_Sol_Review_bb8bd1f3.md`.)
**Assignment:** Batch 05 Task A authorizes only the redundant pre-CAS timestamp-write removal in token-refresh.service.ts plus focused stateful tests; optional revoked-record diagnostics remains design-only. See `audit/W1.2_Gemini_Controlled_Batch_05_Task.md` for scope and gates.
**Wave / root causes:** 1 / RC-ID-01; RC-EVENT-01 context only
**Application / priority:** generic tenant refresh / P1 bounded follow-up
**Provenance:** `audit/W1.2_Batch_04_Sol_Acceptance.md`, REFRESH-04 investigation
Define a separate task for redundant pre-CAS metadata removal and optional known-revoked
diagnostics without inferring consumption cause from revoked/lastUsedAt. Require stateful
signing-failure, CAS-loss, rollback and other-session non-mutation tests. Preserve client
response compatibility and no automatic all-device revocation. No schema, token-family,
outbox or retry grace is authorized. The separately bounded Batch 05 assignment above
provides the sole current runtime exception: redundant pre-CAS metadata-write removal.

### W1.2-GUARD-02 - Principal Scope and SHC Compatibility Contract
**Status:** `CLOSED` (Sol accepts design qualification at reviewed 1c72f58f / contract 9d08f354 with final editorial limits in `audit/W1.2_Batch_05_Sol_Review_1c72f58f.md`; no runtime guard/login/SHC policy implemented or authorized.)
**Assignment:** Gemini Batch 05 Task B, contract only; `audit/W1.2_Gemini_Controlled_Batch_05_Task.md`.
**Wave / root cause:** 1 / RC-ID-01
**Application / priority:** tenant guards, purpose-bound login and SHC GUI auth / P1 design
**Provenance:** `audit/W1.2_Batch_04_Sol_Acceptance.md`, GUARD-01 investigation
Qualify separate policy choices for tenant helper audience/class preconditions, learner-purpose
login and SHC GUI refresh/re-login/store/audience routing. Preserve separate people/tenant
identities, infrastructure and verified caller compatibility. Do not mount specialized helpers,
persist SHC tokens in a guessed store or change keys/cookies by inference. Runtime work needs
a bounded task and independent review. Carry exam default-store/conditional-owner questions
into application/domain assessment; global resource isolation is not certified by GUARD-01.

### W1.2-GUARD-03 - Bounded Principal-Policy Implementation Scoping
**Status:** `PLANNED`
**Wave / root cause:** 1 / RC-ID-01
**Provenance:** accepted GUARD-02 contract and `audit/W1.2_Batch_05_Sol_Review_1c72f58f.md`
Prepare separately bounded runtime assignments for tenant helper preconditions and server-fixed
learner-purpose login propagation, with legacy/admin/infra compatibility and negative tests.
SHC continuity/TTL/store choice remains an explicit policy decision; no generic people-ID
routing, cookie removal or shared-client behavior change is authorized by this entry.
Reference mandatory early browser and Wave 8 qualification; source design acceptance is
not runtime implementation. Do not combine these into an authentication-system rewrite.

### W1.2-SESS-02 - Legacy Logout-All Wiring Qualification
**Status:** `CLOSED` (Sol accepts source qualification at reviewed 9ec71675 with editorial limits and isolated actual-container missing-repository probe; runtime route repair/removal remains separately scoped under SESS-03)
**Assignment:** Gemini Batch 05 Task C, source qualification only; `audit/W1.2_Gemini_Controlled_Batch_05_Task.md`.
**Wave / root cause:** 1 / RC-ID-01
**Application:** API auth legacy POST logout-all and existing DELETE sessions path
**Priority:** P1
**Audit context:** SU-AUTH-004; direct W1.1.2 source wiring evidence
**Implementer:** Gemini 3.8 when separately assigned after refresh discovery
**Independent verifier:** distinct read-only reviewer with actual identity/authorship disclosed; Sol acceptance before follow-on runtime work
**Acceptance:** Sol
Qualify generic SessionService repository wiring and actual route consumers before
choosing bounded delegation/decommissioning. Do not create duplicate endpoints or
assume deployed failure. No runtime change authorized by this planned entry.

### W1.2-SESS-03 - Legacy Logout-All Compatibility and Remediation Decision
**Status:** `PLANNED`
**Wave / root cause:** 1 / RC-ID-01
**Provenance:** accepted SESS-02 source qualification and `audit/W1.2_Batch_05_Sol_Review_9ec71675.md`
Qualify external/dynamic consumers before route removal or preserve a bounded legacy
contract via existing authoritative logout-all delegation. Define verified tenant-local
identity, audience/brand policy, count/response compatibility and owner/tenant negative
tests. Undefined SessionRepository is not an established default DB. No runtime edit,
deletion or live deployment is authorized by this planned entry. Single-session foreign
revocation safe no-op and stateless access-token limits remain unchanged.

### W1.2-EMAIL - People Projection Email Uniqueness Design
**Status:** `PLANNED`
**Root cause:** `RC-ID-01` / `RC-DB-01`
**Application:** SHC people projections and identity bridge
**Priority:** P1 design dependency for duplicate-email projection fixes
**Implementer:** Sonnet 4.5 when separately assigned
**Independent verifier:** Gemini; specialist security review before migration
**Acceptance:** Sol; separate owner migration authorization
**Dependency:** W1.1 approved vocabulary; source-backed consumer analysis
Trace email-only lookup consumers, staff authentication, constraints/migrations,
bridge partial writes and retry subscribers. Recommend scoped fail-closed lookup
and uniqueness design. Consumer disambiguation must precede or be atomic with
constraint relaxation. No approved migration, data merge/cleanup or rollout.
Acceptance requires evidence, negative-case matrix, compatibility/rollback design
and independent review; no runtime claim from documentation alone.

### W1.2 - Critical Authorization Corrections
**Status:** `PLANNED`
**Root cause:** `RC-ID-01`
**Dependencies:** W1.1 acceptance
**Priority:** P0

Implement first:
- Cross-user session revocation ownership
- Legacy tutorial progress identity binding
- Export job/exam tenant ownership
- Rejected privileged/internal auth must not silently downshift
- Project LLM audit actor derived server-side
- Human Gate 1 becomes explicit authenticated approval

Required tests (reconciled with W1.1 independent tenant model):
- User A cannot mutate User B's resources
- Tenant A learner cannot access Tenant B private resources
- Tenant A learner with identical ID/email to Tenant B learner cannot access Tenant B resources
- Equal IDs or emails across tenants remain isolated (independent learners)
- Forged `x-user-id`/`x-brand` headers rejected or ignored
- Invalid trusted-service authentication fails closed
- Bridge failure scenarios handled securely (partial projection)
- `shared` resource access requires verified caller + tenant entitlement + resource policy
- `platforms` array alone does not authorize cross-tenant learner access
- Project LLM Gate 1 cannot be advanced by generic browser state progression

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

Verify independent tenant account isolation with explicitly authorized SHC projection access:

```text
SUIA learner account (skillup_prod)
    |
    +-- SUIA resources (authorized by SUIA account)
    |
    +-- Optional SHC projection (service coordination, not entitlement)

RTH learner account (rth_prod)
    |
    +-- RTH resources (authorized by RTH account)
    |
    +-- Optional SHC projection (service coordination, not entitlement)
```

Tests:
- SkillUp-only account -> RTH private resource -> DENY.
- RTH-only account -> SkillUp private resource -> DENY.
- Same email in both tenants -> independent accounts -> no automatic linking.
- Same learner ID in both tenants -> independent learners -> tenant isolation.
- Forged brand/platform context -> DENY/IGNORE.
- SHC projection alone -> no implicit tenant entitlement.
- `shared` resource access -> verify caller, tenant entitlement, resource policy, action permission.
- `platforms` array without verified tenant account -> no learner access.
- Direct shared-package dependency violations -> CI failure.
- Direct unauthorized DB dependency -> CI failure.

Also verify:
- Tenant learner ownership.
- SHC projection semantics (cross-reference, not authority).
- Database ownership and access controls.
- Event contracts.
- Gateway trust.
- Failure isolation.
- Service identity.
- Bridge failure handling (partial success scenarios).

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

Wave 8 authentication browser acceptance must follow
`audit/Authentication_Browser_Qualification_Requirements.md`, including all six
owner-required production/local environments. W1.2-BROWSER-01 provides earlier
controlled smoke evidence only; formal production qualification remains separately gated.

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
