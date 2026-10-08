# Wave 0 Canonical Workflow Authority Implementation

**Branch:** m2-project-ai-canonical-wiring  
**Commit:** f438718809e37af1bcb80c9e4493c04fad2d539d  
**Design:** `.agents/tasks/w0-design-doc.md`  
**Plan:** `.agents/tasks/w0-implementation-plan.md`  
**Evidence:** `.agents/tasks/w0-architecture-freeze-report.json`

---

## Summary

Wave 0 creates the canonical workflow authority infrastructure by introducing `CanonicalWorkflowState` (17 states), `ProjectLLMWorkflow` model, `WorkflowGovernanceService`, and REST API endpoints. The implementation establishes a single source of truth for workflow lifecycle management, resolving the multiple-authority conflict identified in the audit. The governance service enforces state transition rules, terminal state immutability, and hash-bound authorization gates with self-approval prevention.

All core components are present: the state machine defines valid transitions, the governance service validates and executes transitions, the workflow model tracks artifacts and history, and the API exposes workflow operations. The test suite adds 36 new unit tests covering model serialization, state transitions, authorization gates, and artifact binding.

**Watch for:** This is a creation-only implementation with zero integration into existing execution paths. `WorkflowEngine`, `AgentCoordinator`, governance routes, and task routes remain untouched — the canonical workflow authority exists but nothing uses it yet.

**Verdict**: CHANGES_REQUESTED

---

## High-level view

The 17-state `CanonicalWorkflowState` enum was created fresh in this commit, complete with docstrings, transition rules in `VALID_TRANSITIONS`, and helper functions for gate/terminal detection. The state machine maps the full lifecycle from REQUESTED through DISCOVERY, gate approvals, candidate audit, placement, verification, and terminal states (CERTIFIED, REJECTED).

`WorkflowGovernanceService` implements the single authority for state mutations: `create_workflow()` initializes workflows in REQUESTED state, `transition_state()` validates transitions and enforces authorization for the IMPLEMENTING transition, and `bind_artifact()` attaches hash-bound artifacts. The service uses in-memory storage for Wave 0 with explicit plans for database persistence in Wave 1.

`ProjectLLMWorkflow` model tracks workflow identity, current state, artifact hashes, approval bindings, and complete state transition history. The model's `is_terminal()` and `requires_approval()` methods delegate to `canonical_workflow.py` helper functions, ensuring consistency.

Authorization for the IMPLEMENTING transition enforces six checks: approval record exists, status is APPROVED, candidate hash matches, manifest ID matches, manifest hash matches, and approver is not the requester. Hash verification uses exact SHA-256 comparison.

REST API provides five endpoints: POST /workflows creates workflows, GET /workflows/{id} retrieves state, POST /workflows/{id}/transition executes transitions (internal use), GET /workflows/{id}/history returns audit trail, POST /workflows/{id}/artifacts binds artifacts with hashes. The API converts workflow models to Pydantic response schemas.

Tests cover workflow model construction, serialization, terminal state detection, gate state detection, artifact binding, state history tracking, governance service transitions, authorization gate enforcement, and terminal state immutability. All 36 new tests pass.

The implementation deliberately excludes integration: `WorkflowEngine` still uses its own execution logic, `AgentCoordinator` doesn't call `transition_state()`, governance routes don't use `WorkflowGovernanceService`, and task routes carry no deprecation warnings. This is a pure infrastructure commit with no behavioral changes to the running system.

---

<details>
<summary>Issues (8)</summary>

1. **CanonicalWorkflowState created in Wave 0, not pre-existing** — The design document describes `CanonicalWorkflowState` as if it already exists in the repository, but the diff shows `canonical_workflow.py` is a new file created in this commit. The design references "wiring existing canonical states" and "the existing canonical workflow file (canonical_workflow.py) appears in the commit stat summary but shows zero actual changes" — both statements are false. The 17-state enum, docstrings, transition map, and helper functions were all authored in this Wave 0 commit. Update the design document and evidence report to accurately reflect that this was greenfield state machine design, not integration of pre-existing authority. (confirmed)

2. **Zero integration into existing execution paths** — The plan calls for updating `WorkflowEngine.execute_workflow_stage()` (step 6), governance routes (step 5), and deprecating task routes (step 7), but the evidence report lists `files_modified: []`. None of the existing execution components (`WorkflowEngine`, `AgentCoordinator`, governance routes, task routes) call the new governance service or reference canonical states. The canonical workflow authority exists as dormant infrastructure. This contradicts the plan's stated goal of "wiring workflow execution to canonical state transitions." Either complete the integration per the plan or document that Wave 0 scope was intentionally reduced to infrastructure-only. (confirmed)

3. **Evidence report claims files modified that weren't** — The evidence JSON lists `files_modified: []` but the plan specifies modifying `governance.py` (step 5), `workflow_engine.py` (step 6), `tasks.py` (step 7), and `test_workflow_transitions.py` (step 12). Cross-check the evidence report against the git diff to confirm whether modifications were skipped intentionally or the report is inaccurate. If modifications were skipped, explain why and update the scope documentation. (confirmed)

4. **Frontend integration documented but not implemented** — The design includes a detailed frontend migration section (5.4) showing how `ProjectLlmContext` should consume backend state, but the evidence report correctly notes "frontend_integration: Documented but not implemented (backend-only for Wave 0)." The design document should move frontend integration to a future wave section or clearly mark it as out-of-scope, not include it in the technical design as if it were part of Wave 0. (confirmed)

5. **Test count mismatch in evidence** — The evidence report shows "total_selected: 154, passed: 139, failed: 4, skipped: 11" but also claims "new_unit_tests: 36, all_passed: true." The 4 failures are described as "pre-existing tests unrelated to new workflow governance" but this should be verified. Re-run only the new tests (`tests/unit/test_workflow_model.py`, `tests/unit/test_workflow_governance_service.py`) to confirm they pass in isolation, and document which 4 tests failed with clear evidence they were broken before Wave 0 started. (likely)

6. **Specification ID generation inconsistency** — `WorkflowGovernanceService.create_workflow()` sets `specification_id = target_version` (e.g., "I7"), but the design document and docstrings describe it as "Block family + version (e.g., 'I7')". The comment in the code says "Specification ID is the target version" which matches the implementation but contradicts the design. Verify which convention is correct: is the spec ID just the version ("I7") or family+version ("Introduction-I7")? The model docstring, design doc, and implementation should all agree. (confirmed)

7. **Missing list_workflows implementation** — `WorkflowGovernanceService.list_workflows()` method signature appears at line 300+ of the governance file but the implementation is truncated. The design document doesn't specify this method but the API might need it. Either complete the implementation or remove the signature. If it's intentionally stubbed for future use, add a docstring explaining that. (confirmed)

8. **Retirement plan deferred but not gated** — The evidence report's "retirement_plan.wave_1_plus" lists task routes migration, frontend replacement, database persistence, and WorkflowEngine integration as future work, but none of these deferrals are explained in the context of the current commit. The plan says "establish CanonicalWorkflowState as single source of truth" but without integration, the old authorities (`TaskState`, `/tasks` routes) remain the actual source of truth. Document why the scope was reduced and what prevents shipping the integration now. (confirmed)

</details>

---

<details>
<summary>Details</summary>

## Canonical workflow state machine

The state machine defines 17 states covering the full block engineering lifecycle. Each state has clear documentation: purpose, activities, next states, and gate requirements. The progression is sequential with explicit branching at gates (AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2) where rejection transitions to REJECTED.

REQUESTED initiates the flow, DISCOVERY gathers evidence, BRIEF_READY generates the contract, and AWAITING_GATE_1 blocks until the user approves the GUI prototype. After GUI_APPROVED, the workflow enters CANDIDATE_REQUESTED → CANDIDATE_RECEIVED → CANDIDATE_AUDIT. If audit gates pass, INTEGRATION_PLANNED generates the placement manifest and transitions to AWAITING_IMPLEMENTATION_APPROVAL for the second human gate.

After implementation approval, IMPLEMENTING writes files, IMPLEMENTED captures the commit, and VERIFYING runs runtime and browser checks. CERTIFICATION_READY waits for HAA review at AWAITING_GATE_2. Final states are CERTIFIED (success terminal) and REJECTED (failure terminal).

The `VALID_TRANSITIONS` dictionary enforces the state machine: each state lists valid next states. Terminal states (CERTIFIED, REJECTED) have empty transition lists. Helper functions `is_valid_transition()`, `is_gate_state()`, and `is_terminal_state()` provide the API for validation.

The state machine was designed and implemented in this commit, not wired from pre-existing code. Every state, docstring, and transition rule is new. The design document's narrative about "preserving existing canonical workflow file" is inaccurate.

## Authorization gates

Authorization for transitioning to IMPLEMENTING is enforced by `can_transition_to_implementing()`, which checks six conditions: approval record exists, status is APPROVED (not PENDING or REJECTED), candidate hash matches the approval, manifest ID matches, manifest hash matches, and the approver is not the requester.

Each check returns `(False, reason)` on failure with a descriptive error message. Hash verification uses exact string comparison of SHA-256 hashes (64 hex characters). The function requires four parameters: `requester_id`, `candidate_sha256`, `manifest_id`, `manifest_sha256`. Missing parameters cause the check to fail with "Missing required parameter" errors.

Self-approval prevention calls `approval.verify_not_self_approved(requester_id)`, which compares `approval.approved_by` to the requester. The approval model (pre-existing from earlier work) provides the verification methods: `verify_candidate_hash()`, `verify_manifest_hash()`, and `verify_not_self_approved()`.

The authorization logic is comprehensive and correctly enforces hash integrity and separation of duties. Tests cover all six checks individually: missing approval, wrong status, hash mismatches for candidate and manifest, manifest ID mismatch, and self-approval rejection.

## Workflow model and artifact binding

`ProjectLLMWorkflow` dataclass tracks identity (workflow_id, specification_id, target_family, target_version, requester_id), lifecycle (current_state, state_history), artifacts (contract_id/sha256, candidate_id/sha256, manifest_id/sha256, snapshot_id/sha256), approval (approval_id, gate_results), evidence (evidence_ids), and metadata (created_at, updated_at, final_status).

The model uses `field(default_factory=list)` and `field(default_factory=dict)` for mutable defaults, preventing shared-state bugs. `is_terminal()` and `requires_approval()` delegate to `canonical_workflow.py` helper functions rather than duplicating logic.

Artifact binding is handled by `WorkflowGovernanceService.bind_artifact()`, which accepts artifact_type (contract/candidate/manifest/snapshot), artifact_id, and artifact_sha256. The method sets the corresponding ID and hash fields on the workflow and updates `updated_at`. Invalid artifact types raise `ValueError` with a clear message listing valid options.

`StateTransition` dataclass records from_state, to_state, timestamp, triggered_by, evidence_id, and reason. The initial transition (workflow creation) uses `from_state=None` to indicate no prior state. Both `StateTransition` and `ProjectLLMWorkflow` provide `to_dict()` methods for serialization, converting enum values to strings and datetimes to ISO 8601.

## Governance service and state transitions

`WorkflowGovernanceService` is the single authority for workflow state mutations. In-memory storage uses two dicts: `_workflows` (keyed by workflow_id) and `_approvals` (keyed by workflow_id). The service is instantiated at module level in `workflows.py` for Wave 0; database persistence is planned for Wave 1.

`create_workflow()` generates a UUID workflow_id, creates an initial StateTransition to REQUESTED, and stores the workflow. If a purpose is provided, it's stored in `gate_results["purpose"]`. The specification_id is set to the target_version directly (e.g., "I7"), not family+version.

`validate_transition()` checks three conditions: workflow exists, workflow is not in a terminal state, and the transition is valid per `VALID_TRANSITIONS`. It returns `(bool, reason)` tuples. Terminal state checks use `workflow.is_terminal()`, which calls `is_terminal_state()` from `canonical_workflow.py`.

`transition_state()` calls `validate_transition()` first, raises `ValueError` if validation fails, then performs special authorization for IMPLEMENTING transitions by calling `can_transition_to_implementing()`. After validation and authorization pass, it creates a StateTransition record, updates current_state, appends to state_history, sets updated_at, and sets final_status for terminal states.

`register_approval()` stores an `ImplementationApproval` in the approvals dict and sets `workflow.approval_id`. This wires the pre-existing approval model into the governance flow.

## REST API endpoints

Five REST endpoints expose workflow operations. POST /workflows creates a workflow by calling `governance_service.create_workflow()` and returns a 201 with `WorkflowResponse`. GET /workflows/{workflow_id} retrieves workflow state, returning 404 if not found.

POST /workflows/{workflow_id}/transition parses the target state from the request, calls `governance_service.transition_state()`, and returns 400 on validation errors. This endpoint is marked for internal use, suggesting it's not intended for direct frontend calls.

GET /workflows/{workflow_id}/history returns the state_history list as an array of `StateTransitionInfo` objects. POST /workflows/{workflow_id}/artifacts calls `governance_service.bind_artifact()` to attach artifact hashes.

The API uses Pydantic schemas for request validation and response serialization. `_workflow_to_response()` converts `ProjectLLMWorkflow.to_dict()` output to `WorkflowResponse`, unpacking nested dicts into schema objects. All endpoints raise `HTTPException` with appropriate status codes (400, 404) on errors.

The API does not include a list workflows endpoint in the reviewed code, though `WorkflowGovernanceService.list_workflows()` signature appears truncated in the governance service file.

## Test coverage

36 new unit tests cover workflow model and governance service. `test_workflow_model.py` (13 tests) verifies StateTransition creation, serialization, workflow creation, terminal state detection, gate state detection, artifact binding, state history tracking, and final_status setting for terminal states. Tests use parameterized checks for all gate states and non-terminal states.

`test_workflow_governance_service.py` (23 tests) covers workflow creation with and without purpose, workflow retrieval, validation of valid and invalid transitions, terminal state boundary enforcement, state transition execution, final_status setting, authorization gate enforcement, approval registration, and artifact binding for all four artifact types. 

Authorization tests verify all six checks: missing approval fails, wrong status fails, candidate hash mismatch fails, manifest ID mismatch fails, manifest hash mismatch fails, and self-approval fails. A successful authorization test confirms that when all checks pass, the transition to IMPLEMENTING succeeds.

Test fixtures provide a governance service, sample workflow, and sample approval for reuse across tests. All tests use pytest with descriptive names and clear assertions. The evidence report claims all 36 new tests pass, though the overall test run shows 139/154 passing with 4 failures described as pre-existing.

## Missing integration

`WorkflowEngine`, `AgentCoordinator`, governance routes, and task routes do not reference the new governance service or canonical states. The implementation plan specifies modifying these components (steps 5, 6, 7, 12) but the evidence report shows `files_modified: []`.

`WorkflowEngine` continues to use its own execution logic without calling `governance_service.transition_state()`. `AgentCoordinator` doesn't integrate with canonical states. Governance routes don't use `WorkflowGovernanceService.register_approval()` or `transition_state()`. Task routes carry no deprecation warnings.

The canonical workflow authority exists as infrastructure but has zero behavioral impact on the running system. No code path creates workflows via `create_workflow()`, no agent completion triggers `transition_state()`, and no approval flow integrates with the governance service. The design goal of "wiring workflow execution to canonical state transitions" was not achieved.

</details>

---

<details>
<summary>File map</summary>

**Created:**
- `services/project-ai/app/models/workflow.py` — ProjectLLMWorkflow and StateTransition dataclasses (166 lines)
- `services/project-ai/app/api/schemas/workflow.py` — Pydantic schemas for workflow API
- `services/project-ai/app/orchestration/canonical_workflow.py` — 17-state enum, transition rules, authorization gates (466 lines)
- `services/project-ai/app/orchestration/workflow_governance.py` — WorkflowGovernanceService (300+ lines)
- `services/project-ai/app/api/routes/workflows.py` — Five REST endpoints for workflow operations (200+ lines)
- `services/project-ai/tests/unit/test_workflow_model.py` — 13 tests for workflow model (400+ lines)
- `services/project-ai/tests/unit/test_workflow_governance_service.py` — 23 tests for governance service (400+ lines)
- `.agents/tasks/w0-architecture-freeze-report.json` — Evidence report with test results and commit metadata

**Modified:**
- None (evidence report lists `files_modified: []`)

**Full diff:** `git diff 185925bf2a0ec671c6863e7f3f323ad9e98116aa..f438718809e37af1bcb80c9e4493c04fad2d539d`

</details>
