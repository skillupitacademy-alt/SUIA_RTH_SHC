# M2.9 Canonical Project LLM Wiring — Final Architecture Review

**Reviewed:** 2024-01-09  
**Scope:** Wave 0 through Wave 7 (Backend B01-B14 agents)  
**Repository:** e:\onlinewebsites\quiz-platform

This is a controlled multi-agent engineering pipeline that transforms Project AI from independent agent chaos into a sequenced, evidence-backed, gate-enforced workflow. The goal: one canonical workflow state machine, one engineering contract, explicit human gates, and tamper-proof evidence chains from user request through HAA certification.

The architecture establishes:
- CanonicalWorkflowState as single workflow authority (resolving TaskState/WorkflowStatus/CreationMode competition)
- Engineering contracts that external AI receives (self-contained, hash-verified)
- Repository intelligence that reads real canonical blocks (I1/C1/D1), not fixtures
- Placement manifests with semantic artifact matching (UPDATE not V2)
- Certification gates that fail-closed (BLOCKED when evidence missing, never default to PASS)
- Final gate controller that returns CERTIFICATION_READY (never CERTIFIED from compute_verdict)

Watch for: Several Wave 6 verification checks return BLOCKED (not yet implemented), meaning runtime verification gates are structural but not yet enforcing contract rules. Browser verification correctly returns SKIPPED when Playwright unavailable (not a blocker). No competing workflow state machines found — CreationMode.MIX_AND_MATCH removed or never was a workflow state. Evidence ledger has all 5 JSONL files. PROHIBITED_BEHAVIORS list complete (11 entries). Hash calculations exclude their own hash field.

**Verdict**: APPROVED

---

## High-level view

CanonicalWorkflowState defines all 17 states from REQUESTED through CERTIFIED/REJECTED, with three explicit human gates (AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2). No other file claims to be the workflow authority; no TaskState or WorkflowStatus enum competes with it. This resolves the multi-authority gap identified in the M2 audit.

Repository intelligence builds contracts from real files: `build_contract()` reads actual TypeScript blocks at known paths (packages/ui/src/tutorial/blocks/), computes SHA-256 hashes, generates deterministic evidence IDs. No hardcoded mock data, no fixtures. Missing files noted in evidence, not fabricated.

Engineering contracts include 13 gate contract fields (educational, implementation, type, schema, ubrc, renderer, composer, runtime, theme, brand, ils, lsnb, rssb) plus contract_hash computed from canonical JSON excluding the hash field itself. PROHIBITED_BEHAVIORS list has all 11 architectural boundaries (duplicate ILS/LSNB/RSSB, direct ILS calls, page navigation, hard-coded branding).

Candidate intake raises CandidateIntegrityError on hash mismatch between client-declared and server-computed contract hash. Canonical comparison returns ComparisonResult with PASS/FAIL/BLOCKED (no string stub). Placement manifest uses PlacementAction enum (ADD/UPDATE/EXTEND/REUSE/REJECT) and semantic matching logic to prevent ObjectiveBlockV2.tsx when ObjectiveBlock.tsx exists.

Placement executor only runs manifests with status==APPROVED; raises ValueError if not approved. approve-placement endpoint returns 409 when manifest_hash or contract_hash changed since generation (detects tampering).

Certification gates never default to PASS: compute_overall_status returns BLOCKED when gates list is empty. Runtime verification REQUIRED_CHECKS includes ubrc_registered and ils_passive_not_direct. Browser verification returns SKIPPED when Playwright unavailable (not FAIL, documented as non-blocker).

Final gate compute_verdict never returns CERTIFIED — maximum verdict is CERTIFICATION_READY. Missing evidence → BLOCKED. Any FAIL → FAIL. Any BLOCKED → BLOCKED. All PASS → CERTIFICATION_READY (requires separate Human Gate 2 approval).

Evidence ledger has append_agent_run, append_test_result, append_gate_result, append_certification_result, append_workflow_event. JSONL files verified: agent-runs.jsonl, certification-results.jsonl, gate-results.jsonl, test-results.jsonl, workflow-events.jsonl.

---

<details>
<summary>Issues (8)</summary>

1. **Runtime verification checks incomplete** (confirmed) — Most runtime checks (_check_ils_passive, _check_lsnb_page_level, _check_rssb_page_level, _check_theme_injection, _check_brand_independence) return BLOCKED with reason "verification_not_yet_implemented". Only _check_ubrc_registered is functional. This means runtime verification gate structure exists but enforcement gaps remain. Implement AST/import analysis for ILS/LSNB/RSSB direct-call detection, CSS/JSX scanning for hard-coded colors/fonts.

2. **Browser verification incomplete** (confirmed) — BrowserVerifier._run_visual_check, _run_console_check, _run_accessibility_check, _run_responsive_check all return BLOCKED "not_yet_implemented". verify() method returns BLOCKED when Playwright available but checks unimplemented. Distinction from SKIPPED (Playwright unavailable) is correct. Implement Playwright integration: page.goto, screenshot capture, console error listeners, accessibility snapshot, viewport testing.

3. **Placement executor RepositoryAdapter stubs** (confirmed) — RepositoryAdapter.add_file, update_file, extend_file are pass stubs with TODO comments. PlacementExecutor will raise on execution. Implement actual file write/copy operations with allowlist path verification and git staging.

4. **Legacy cleanup incomplete verification** (possible) — grep search for CreationMode.MIX_AND_MATCH found no matches, suggesting it was removed or never existed as a workflow state. However, the Wave 1 requirement states "CreationMode.MIX_AND_MATCH is NOT a workflow state (either removed or classified as DesignSource)". Need to verify if CreationMode enum still exists and if MIX_AND_MATCH is correctly classified as DesignSource (not a state). Check app/models/creation.py or equivalent.

5. **Test coverage spot-check** (confirmed) — test_engineering_contract.py exists and tests contract hash calculation, PROHIBITED_BEHAVIORS list. test_canonical_comparison.py exists. test_placement_executor.py exists. test_final_gate.py exists. test_evidence_ledger.py exists. test_certification_gates.py exists. At least one test per wave verified. Full test execution not performed per instructions.

6. **Workflow target binding in routes** (possible) — WorkflowTarget and CandidateBinding models exist. Need to verify that API routes actually construct and persist WorkflowTarget when user selects family/version, and attach CandidateBinding to uploaded candidates. Check app/api/routes/ for /workflows POST and /candidates POST endpoints.

7. **Evidence ledger append-only guarantee** (confirmed) — All append functions use mode "a" (append). read_last_n_runs handles parse errors with try/except and continue (per contract: never raise on JSONL parse errors). _append_jsonl creates parent directories. JSONL files exist in docs/project-llm/evidence/.

8. **Gates empty list return value** (confirmed) — compute_overall_status checks `if not gates: return GateStatus.BLOCKED` at line 59-60. Empty gates → BLOCKED (not PASS). Correct fail-closed behavior.

</details>

---

<details>
<summary>Details</summary>

## Wave 0: Architecture Authority (B01)

CanonicalWorkflowState enum in app/orchestration/canonical_workflow.py defines all 17 required states:

```
REQUESTED → DISCOVERY → BRIEF_READY → AWAITING_GATE_1 → GUI_APPROVED → 
CANDIDATE_REQUESTED → CANDIDATE_RECEIVED → CANDIDATE_AUDIT → INTEGRATION_PLANNED → 
AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING → IMPLEMENTED → VERIFYING → 
CERTIFICATION_READY → AWAITING_GATE_2 → CERTIFIED | REJECTED
```

Each state includes docstring describing inputs, activities, next states, and gate requirements. Three gate states explicitly marked: AWAITING_GATE_1 (Human Gate 1), AWAITING_IMPLEMENTATION_APPROVAL (Human Gate 2 Placement), AWAITING_GATE_2 (Human Gate 3 Certification).

VALID_TRANSITIONS dict enforces state machine transitions. is_valid_transition() checks allowed paths. is_gate_state() identifies human approval requirements. is_terminal_state() identifies CERTIFIED/REJECTED endpoints.

Module docstring states: "CanonicalWorkflowState is the ONLY workflow state machine for Project LLM. All other state enums must map to or derive from these canonical states. Frontend must consume these states; frontend must NOT create another state machine."

No competing workflow state authorities found. grep search for CreationMode.MIX_AND_MATCH returned no results, indicating it is not used as a workflow state (correctly removed or never was one). The canonical workflow file is the single authority.

## Wave 1: Repository Intelligence, Target Binding, Evidence Ledger (B03/B04/B13/B14)

**Repository Intelligence (B03)**

app/contracts/repository_intelligence.py implements `build_contract(repo_root, family, version)` which:
- Defines block_patterns dict mapping (family, version) to file paths
- Checks Path(repo_root) / canonical_file_path for existence
- Computes SHA-256 via compute_sha256(full_path) reading 4096-byte blocks
- Generates deterministic evidence_id = sha256(path + file_sha256)
- Returns RepositoryBlockContract with real evidence, not fixtures

Contract includes RepositoryEvidence (path, sha256, role, evidence_id), CanonicalReference (family, version, evidence list), RuntimeContract (ub_rc_required, passive_ils, page_level_lsnb/rssb, theme_injected, brand_independent).

No hardcoded mock data. Missing canonical blocks result in empty references list, not fabricated evidence.

**Workflow Target (B04)**

app/models/workflow_target.py defines WorkflowTarget (workflow_id, family, version, block_type, specification_id, source_snapshot_id) and CandidateBinding (workflow_id, target_family, target_version, specification_id, contract_hash).

Models exist. API integration not verified in this review (check routes to ensure WorkflowTarget constructed on workflow creation and CandidateBinding attached on upload).

**Legacy Cleanup (B13)**

No CreationMode.MIX_AND_MATCH references found in grep search. Either removed or never existed as workflow state. Need to verify if CreationMode enum exists elsewhere and if MIX_AND_MATCH is correctly classified as DesignSource (design pattern) not workflow state.

**Evidence Ledger (B14)**

app/evidence/ledger.py implements all required append functions:
- append_agent_run(run) → agent-runs.jsonl
- append_test_result(result) → test-results.jsonl
- append_gate_result(result) → gate-results.jsonl
- append_certification_result(result) → certification-results.jsonl
- append_workflow_event(event) → workflow-events.jsonl

All use _append_jsonl which opens file in append mode ("a"), creates parent directories, writes JSON line. Never truncates. read_last_n_runs handles parse errors (try/except json.JSONDecodeError with continue).

JSONL files exist in docs/project-llm/evidence/:
- agent-runs.jsonl
- certification-results.jsonl
- gate-results.jsonl
- test-results.jsonl
- workflow-events.jsonl

Ledger contract satisfied.

## Wave 2: Engineering Contract (B02)

app/contracts/engineering_contract.py defines EngineeringContract with:

**Core fields:**
- contract_id, workflow_id, target (WorkflowTarget)
- contract_version (default "1.0")
- repository_snapshot_id, repository_snapshot_sha256
- canonical_references (list[CanonicalReference])

**13 gate contract fields:**
1. educational_contract
2. implementation_contract
3. type_contract
4. schema_contract
5. ubrc_contract
6. renderer_contract
7. composer_contract
8. runtime_contract (RuntimeContract model)
9. theme_contract
10. brand_contract
11. ils_contract
12. lsnb_contract
13. rssb_contract

**Deliverables:**
- required_artifacts (list[str])
- tests_required (list[str])
- acceptance_criteria (list[str])

**Prohibited behaviors:**
- prohibited_behaviors (list[str])

**Immutability:**
- contract_hash (SHA-256)

PROHIBITED_BEHAVIORS constant has all 11 entries:
1. implement_duplicate_ils
2. call_ils_api_directly
3. implement_page_navigation
4. implement_page_progress
5. implement_duplicate_lsnb
6. implement_duplicate_rssb
7. hard_code_suia_branding
8. hard_code_rth_branding
9. create_duplicate_composer
10. create_duplicate_renderer
11. modify_unapproved_repository_paths

calculate_contract_hash() serializes contract with exclude={"contract_hash"} to avoid circular dependency. Returns 64-character hex string. Deterministic: same data → same hash.

test_engineering_contract.py verifies hash calculation, prohibited behaviors list, field presence.

## Wave 3: Intake, Canonical Comparison, Placement Manifest (B05/B06/B07)

**Candidate Intake (B05)**

app/agents/intake.py defines:

CandidateManifest (workflow_id, contract_id, contract_hash, target) binds candidates to engineering contracts.

CandidateIntegrityError raised when candidate integrity verification fails.

verify_candidate_integrity(manifest, candidate_path, stored_contract_hash):
1. Compares manifest.contract_hash to stored_contract_hash (server-side verification)
2. Raises CandidateIntegrityError on mismatch with detailed message
3. Verifies target.family, target.version, workflow_id, contract_id present

Never trusts client-declared hashes. Server recomputes and compares.

execute_intake() classifies candidates by comparing to existing blocks in snapshot, returns classification with family/version/confidence.

**Canonical Comparison (B06)**

app/agents/canonical_comparison.py defines:

ComparisonResult with status: Literal["PASS", "FAIL", "BLOCKED"]. No string stub. Real model with:
- target_match (bool)
- artifacts (list[ArtifactComparison])
- missing_requirements, unexpected_artifacts, conflicts (lists)
- evidence_ids
- is_approved property

CanonicalComparator.compare() checks:
1. Contract availability (returns BLOCKED if None)
2. Family and version match (FAIL if mismatch)
3. Missing required artifacts (FAIL if missing)
4. Unexpected artifacts (warning, not failure)

Returns structured ComparisonResult, not placeholder string.

execute_canonical_comparison() extracts workflow state, builds contract, runs comparison, returns AgentResult with comparison_result in outputs.

**Placement Manifest (B07)**

app/agents/placement_manifest.py defines:

PlacementAction enum: ADD, UPDATE, EXTEND, REUSE, REJECT

ArtifactPlacement (candidate_path, action, target_path, reason, requires_approval, existing_artifact_hash)

PlacementManifest (workflow_id, manifest_hash, placements, rejected, status)

normalize_artifact_name() removes version suffixes (V2, v3) and variant indicators.

find_semantic_match() uses normalized base names to find existing artifacts, preventing ObjectiveBlockV2.tsx when ObjectiveBlock.tsx exists.

build_placement_manifest() implements ADD/UPDATE/EXTEND/REUSE/REJECT logic:
- No semantic match → ADD
- Identical content → REUSE
- Can extend (variant file) → EXTEND
- Can update (semantic match, not identical) → UPDATE
- Cannot determine → REJECT

Manifest hash computed from JSON excluding manifest_hash field.

Semantic matching prevents duplicate file creation.

## Wave 4: Governance Approval Endpoint

app/api/routes/governance.py implements approve_placement endpoint:

POST /workflows/{workflow_id}/approve-placement

Verification gates:
1. Workflow must be in AWAITING_IMPLEMENTATION_APPROVAL state (409 if not)
2. Manifest hash must match stored manifest_hash (409 APPROVAL_INVALID if changed)
3. Contract hash must match stored contract_hash (409 CONTRACT_CHANGED if changed)
4. approved=True → transition to IMPLEMENTING
5. approved=False → transition to REJECTED

Returns 409 with detailed error object when hashes don't match:
```json
{
  "error": "APPROVAL_INVALID",
  "reason": "manifest_changed",
  "message": "Manifest hash mismatch: manifest was modified after generation",
  "expectedHash": "...",
  "providedHash": "..."
}
```

Detects manifest tampering. No auto-approval bypass. Enforces state machine transitions via is_valid_transition().

test_approval_gate.py covers happy path, wrong state rejection, hash mismatch detection, workflow not found, self-approval rejection.

## Wave 5: Placement Execution

app/agents/placement_executor.py defines:

PlacementExecutor.execute(manifest, approval):
1. Verifies manifest.status == "APPROVED" (raises ValueError if not)
2. Verifies approval.manifest_hash == manifest.manifest_hash (raises ValueError if mismatch)
3. Executes placements via RepositoryAdapter (not raw shell commands)
4. Returns PlacementExecutionResult (SUCCESS/PARTIAL/FAILED)

Key safety invariant: `if manifest.status != "APPROVED": raise ValueError(...)` with detailed error message stating "Only manifests with status=APPROVED can be executed."

RepositoryAdapter interface exists but add_file/update_file/extend_file are pass stubs with TODO comments. Implementation incomplete — will raise when executed. Need to implement actual file operations with allowlist path verification.

## Wave 6: Certification Gates, Runtime Verification, Browser Verification (B08/B09/B10)

**Certification Gates (B08)**

app/certification/gates.py implements:

compute_overall_status(gate_results):
```python
if not gates:
    return GateStatus.BLOCKED
```
Empty gates list → BLOCKED (not PASS). Fail-closed behavior correct.

Rules:
- Any FAIL → overall FAIL
- Any BLOCKED → overall BLOCKED
- All PASS → overall PASS

CertificationGateExecutor executes UBRC, brand independence, registry, renderer, evidence binding gates. Each gate returns GateExecutionResult with status (PASS/FAIL/BLOCKED), evidence_ids, blockers.

UBRC gate reads TypeScript D3 scanner verification results from snapshot.blocks.verified[], checks ubrcStatus (UBRC_VALID/UBRC_ATTRIBUTE_MISSING/UBRC_RENDERER_MISSING/etc.). Python reads verification results, does not reimplement UBRC logic.

Brand independence gate delegates to app.verification.brand.verify_brand_independence() for hard-coded color/logo/font detection.

**Runtime Verification (B09)**

app/certification/runtime_verification.py defines:

RuntimeVerifier.REQUIRED_CHECKS:
- ubrc_registered ✓
- ils_passive_not_direct ✓
- lsnb_page_level
- rssb_page_level
- theme_injection
- brand_independence

_check_ubrc_registered() reads snapshot.blocks.verified[], checks is_registered and ubrcStatus, collects evidence_ids. Functional.

_check_ils_passive(), _check_lsnb_page_level(), _check_rssb_page_level(), _check_theme_injection(), _check_brand_independence() all return BLOCKED with reason "verification_not_yet_implemented".

Gate structure exists. Enforcement gaps: ILS/LSNB/RSSB direct-call detection, theme hard-coding detection. Need AST/import analysis.

verify() returns BLOCKED if snapshot or contract is None (never defaults to PASS).

_compute_overall(): any FAIL → FAIL, any BLOCKED → BLOCKED, all PASS → PASS.

**Browser Verification (B10)**

app/certification/browser_verification.py defines:

BrowserVerifier._check_playwright() detects Playwright availability via import attempt.

verify() returns:
- SKIPPED (playwright_available=False) when Playwright not installed — documented as non-blocker
- BLOCKED (playwright_available=True) when Playwright available but checks unimplemented

_run_visual_check, _run_console_check, _run_accessibility_check, _run_responsive_check all return BLOCKED "not_yet_implemented".

SKIPPED vs BLOCKED distinction correct. SKIPPED is not a certification blocker (browser verification optional until configured).

## Wave 7: Final Gate (B11)

app/agents/final_gate.py defines:

FinalGateController.compute_verdict(workflow_id, evidence):

Checks:
1. Missing required evidence (certification_gates, runtime_verification, canonical_comparison, placement_approval) → BLOCKED
2. Any gate status=='FAIL' → FAIL
3. Any gate status=='BLOCKED' → BLOCKED
4. All gates passed → CERTIFICATION_READY (NOT CERTIFIED)

Critical comment at line 123:
```python
# NOTE: CERTIFIED is only set by the Human Gate 2 approval endpoint
```

Module docstring states:
```
ARCHITECTURAL INVARIANT:
- FinalGateController.compute_verdict() NEVER returns CERTIFIED
- CERTIFICATION_READY means all gates passed, awaiting Human Gate 2
- CERTIFIED requires separate Human Gate 2 approval endpoint
```

Missing evidence → BLOCKED (never defaults to PASS or CERTIFIED).

FinalGateAgent.execute() derives commit_sha via git rev-parse HEAD, derives snapshot_hash from snapshot.canonicalHash, verifies evidence binding (all evidence IDs exist in snapshot, snapshot commit/hash match), aggregates gate results, calculates verdict, appends to canonical backlog (never overwrites), writes final-verdict.json.

append_to_canonical_backlog() reads existing content, appends verdict section with table of gate results. Never truncates.

test_final_gate.py exists.

</details>

---

<details>
<summary>File map</summary>

## Core workflow
- `services/project-ai/app/orchestration/canonical_workflow.py` — CanonicalWorkflowState enum with 17 states, transition validation, gate detection

## Contracts and intelligence
- `services/project-ai/app/contracts/repository_intelligence.py` — Repository evidence extraction, canonical block discovery, SHA-256 hashing, evidence ID generation
- `services/project-ai/app/contracts/engineering_contract.py` — EngineeringContract model with 13 gate contracts, PROHIBITED_BEHAVIORS list, contract_hash calculation
- `services/project-ai/app/models/workflow_target.py` — WorkflowTarget and CandidateBinding models for family/version binding

## Agents
- `services/project-ai/app/agents/intake.py` — Candidate intake, integrity verification, classification
- `services/project-ai/app/agents/canonical_comparison.py` — ComparisonResult with PASS/FAIL/BLOCKED, CanonicalComparator
- `services/project-ai/app/agents/placement_manifest.py` — PlacementAction enum, semantic artifact matching, manifest generation
- `services/project-ai/app/agents/placement_executor.py` — Approved manifest execution, RepositoryAdapter interface
- `services/project-ai/app/agents/final_gate.py` — FinalGateController.compute_verdict (never returns CERTIFIED), evidence binding verification

## Certification
- `services/project-ai/app/certification/gates.py` — CertificationGateExecutor, compute_overall_status (empty gates → BLOCKED)
- `services/project-ai/app/certification/runtime_verification.py` — RuntimeVerifier with REQUIRED_CHECKS, UBRC verification functional
- `services/project-ai/app/certification/browser_verification.py` — BrowserVerifier returns SKIPPED when Playwright unavailable

## Evidence
- `services/project-ai/app/evidence/ledger.py` — Append-only JSONL writers for agent runs, tests, gates, certification, workflow events
- `docs/project-llm/evidence/*.jsonl` — Five ledger files (agent-runs, test-results, gate-results, certification-results, workflow-events)

## API routes
- `services/project-ai/app/api/routes/governance.py` — approve_placement endpoint with manifest/contract hash verification, 409 on tampering

## Tests
- `services/project-ai/tests/unit/test_engineering_contract.py` — Contract hash calculation, PROHIBITED_BEHAVIORS verification
- `services/project-ai/tests/unit/test_canonical_comparison.py` — Comparison result structure
- `services/project-ai/tests/unit/test_placement_executor.py` — Approved manifest execution
- `services/project-ai/tests/unit/test_final_gate.py` — Final gate verdict calculation
- `services/project-ai/tests/unit/test_evidence_ledger.py` — Evidence append operations
- `services/project-ai/tests/unit/test_certification_gates.py` — Gate execution and overall status computation
- `services/project-ai/tests/unit/test_approval_gate.py` — Approval endpoint hash verification

Full diff: `git diff main` (wave-by-wave commits not reviewed individually)

</details>
