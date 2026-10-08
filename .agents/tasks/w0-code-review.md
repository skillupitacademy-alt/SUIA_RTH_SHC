# Canonical Workflow Authority Implementation

M2.9 Wave 0 implementation establishes CanonicalWorkflowState as the single source of truth for Project LLM workflow lifecycle, resolving the multiple-authority conflict through WorkflowGovernanceService. The implementation wires existing authorization logic into state transitions and creates comprehensive validation for the 17-state canonical workflow.

**Watch for:** Self-approval verification incomplete (likely), agent coordinator lacks workflow integration confirmed, state history tracking preserves None in from_state field without documentation, WorkflowEngine integration is stub-heavy.

**Verdict**: NEEDS_CHANGES

## High-level view

The canonical workflow model defines all 17 required states with complete documentation and a valid state transition map. WorkflowGovernanceService enforces transitions with terminal state immutability and authorization gates at the IMPLEMENTING transition. The workflow model includes all required fields with hash-bound artifact tracking. WorkflowEngine accepts governance_service and calls transition_state() after agent execution in at least three mapped states (REQUESTED→DISCOVERY, DISCOVERY→BRIEF_READY, CANDIDATE_RECEIVED→CANDIDATE_AUDIT). Test suite covers 94 tests with 81 passing, including dedicated test files for terminal states (20 tests), governance service (18 tests), and workflow model (6 tests).

<details>
<summary>Issues (5)</summary>

1. **Self-approval verification gap** — The `can_transition_to_implementing()` function calls `approval.verify_not_self_approved(requester_id)` but there's no evidence this method exists on ImplementationApproval. The function returns False if the verification returns False, but if the method is missing or incorrectly implemented, self-approval could pass through. Trace through ImplementationApproval model to confirm verify_not_self_approved() exists and correctly checks `approved_by != workflow_requester`.

2. **Agent coordinator independent state tracking** — The design plan states "agent_coordinator.py removes independent state tracking" and "agent_coordinator.py calls transition_state() after agent completions", but agent_coordinator.py was created new (not modified) and contains no imports or calls to WorkflowGovernanceService. The integration exists only in WorkflowEngine. If agents execute via AgentCoordinator directly (bypassing WorkflowEngine), workflow state won't update. Either verify all agent execution goes through WorkflowEngine.execute_workflow_stage(), or wire governance into AgentCoordinator.

3. **State history from_state None semantics** — StateTransition.from_state is Optional[CanonicalWorkflowState] with None documented as "No prior state" for initial transition. This is correct for workflow creation, but the field lacks a docstring explaining when None is valid (only initial transition) vs when it indicates a bug. Add a field docstring or validation to StateTransition.__post_init__ that confirms from_state=None only appears in state_history[0].

4. **WorkflowEngine canonical mapping incomplete** — WorkflowEngine.execute_workflow_stage() maps only 3 of 17 canonical states (REQUESTED, DISCOVERY, CANDIDATE_RECEIVED), with the rest documented as "stub for now". The evidence report defers this to later waves, but the design doc states "Map canonical state to agent execution" for the full lifecycle. This creates execution gaps: workflows reaching CANDIDATE_AUDIT or IMPLEMENTING states will have no agent execution path. Document which states have real execution vs stubs in the workflow_engine.py docstring or add NotImplementedError for unmapped states.

5. **Test failures not investigated** — Evidence reports "2 failures in integration tests for deprecated endpoints (test_certification_negative.py) - not blocking for Wave 0", but test failures in certification logic could indicate real workflow state issues. The review requirements state "do NOT re-run tests", but the review should assess whether ignoring these failures is appropriate. If test_certification_negative.py tests terminal state rejection paths or gate validation, failures could expose workflow governance bugs. Confirm failed tests are truly about deprecated endpoints, not canonical workflow behavior.

</details>

<details>
<summary>Details</summary>

## CanonicalWorkflowState enum and transition map

VALID_TRANSITIONS dict provides the complete transition map. All 17 states appear as keys, terminal states map to empty lists, and gate transitions offer both approval and rejection paths (AWAITING_GATE_1 → [GUI_APPROVED, REJECTED]). The transition validation prevents skipping states: REQUESTED cannot jump to IMPLEMENTING without passing through intervening states.

## Authorization gates for IMPLEMENTING transition

`can_transition_to_implementing()` enforces six authorization checks before allowing file placement. The function signature requires all four hash/ID parameters (requester_id, candidate_sha256, manifest_id, manifest_sha256) and validates they are non-empty before proceeding with comparisons. This prevents accidental approval through missing data.

The function checks approval existence, approval status (must be APPROVED), and then performs four hash/ID verifications using methods on the ImplementationApproval model: `verify_candidate_hash()`, direct manifest_id comparison, `verify_manifest_hash()`, and `verify_not_self_approved()`. Each failed check returns a tuple with False and a specific reason string.

The self-approval check calls `approval.verify_not_self_approved(requester_id)`, but the ImplementationApproval model implementation is not visible in this diff. If that method is missing or has bugs, self-approval could slip through. The error message "Self-approval detected or workflow requester missing: approver '{approval.approved_by}'" suggests the method might be checking multiple conditions, but without seeing the implementation, confidence is limited.

## ProjectLLMWorkflow model with all required fields

The workflow model includes all 17 required fields: workflow_id, specification_id, target_family, target_version, requester_id, current_state, state_history, contract_id/sha256, candidate_id/sha256, manifest_id/sha256, snapshot_id/sha256, approval_id, gate_results, evidence_ids, created_at, updated_at, final_status. All artifact bindings are hash-paired.

StateTransition uses Optional[CanonicalWorkflowState] for from_state to represent initial creation, where there is no prior state. This field lacks a docstring explaining when None is valid (only at creation) vs when it indicates a bug.

## WorkflowGovernanceService state transition enforcement

`validate_transition()` checks three conditions: workflow exists, workflow is not in terminal state, transition is valid per VALID_TRANSITIONS. Terminal state check comes before transition validation, preventing state machine rules from overriding terminal immutability.

`transition_state()` calls validate_transition() first, then special-cases the IMPLEMENTING transition to call `can_transition_to_implementing()` with full authorization checks. If authorization fails, the transition is blocked. The function creates a StateTransition record, updates current_state, appends to state_history, and sets final_status for terminal states.

`bind_artifact()` validates artifact_type against a whitelist (contract, candidate, manifest, snapshot) before setting fields, preventing typos from creating phantom fields.

## WorkflowEngine integration with canonical states

WorkflowEngine.__init__() accepts an optional governance_service parameter. `execute_workflow_stage()` reads the workflow from governance_service, maps current_state to agent execution, and calls `governance_service.transition_state()` after agent completion. For REQUESTED state, it executes four discovery agents sequentially and transitions to DISCOVERY if all pass. DISCOVERY and CANDIDATE_RECEIVED have stubs that immediately transition to the next state.

Only 3 of 17 canonical states are mapped. Workflows reaching unmapped states (CANDIDATE_AUDIT, IMPLEMENTING, etc.) have no execution path. The stubs acknowledge this with "stub for now" comments.

## Agent coordinator and workflow independence

agent_coordinator.py defines AgentCoordinator but contains no imports of WorkflowGovernanceService and no calls to transition_state(). The coordinator handles agent execution mechanics (DAG resolution, result propagation) without workflow state awareness. WorkflowEngine calls transition_state() after calling agent_coordinator.

The design plan states "agent_coordinator.py calls transition_state() after agent completions", but the implementation puts this responsibility in WorkflowEngine. If code outside WorkflowEngine uses AgentCoordinator directly, workflow state won't update.

## Terminal state enforcement

test_terminal_states.py has 10 test functions covering terminal state detection, immutability from CERTIFIED and REJECTED, ValueError on illegal transitions, final_status setting, evidence binding, and gate state detection. The immutability tests force a workflow to a terminal state then attempt various illegal transitions, verifying `validate_transition()` returns False with "terminal state" in the reason.

The evidence binding test confirms workflow.evidence_ids is a mutable list that can accumulate IDs, but doesn't verify evidence_ids is used in state transitions.

## Workflow governance service tests

test_workflow_governance.py includes 18 test functions covering workflow creation, retrieval, transition validation (valid, invalid, terminal), state transition execution, authorization for IMPLEMENTING, approval registration, artifact binding, and error cases.

The workflow creation test verifies the workflow starts in REQUESTED state with a valid UUID workflow_id. The specification_id test expects "II7" for input "Introduction" + "I7", which concatenates the first letter twice—this may be a bug in either the test or the implementation.

State transition execution test verifies transition_state() updates current_state, appends to state_history with correct from_state/to_state/triggered_by/evidence_id, and updates the timestamp.

## Test results and evidence quality

The architecture-freeze-report.json records 94 total tests, 81 passed, 2 failed, 11 skipped. Three new test files were created: test_workflow_model.py (6 tests), test_workflow_governance.py (18 tests), test_terminal_states.py (20 tests), totaling 44 new tests.

The report notes 2 failures in test_certification_negative.py for deprecated endpoints, marked as "not blocking for Wave 0". Without seeing the failure output, it's unclear whether these failures expose canonical workflow issues or are genuinely about deprecated endpoint behavior. If the tests verify rejection paths, failures could indicate broken rejection logic.

The commit SHA in the report (cb45462d) differs from the current HEAD (185925bf), suggesting the report was updated after the main commit.

## Code quality and documentation

The canonical_workflow.py file has extensive module-level documentation explaining the architectural rule, gate enforcement, and M2.9 references. Each state has a detailed docstring. workflow_governance.py has a detailed module docstring and comprehensive method docstrings with parameter descriptions. Error messages include context (current state, target state, workflow ID).

Test files follow pytest conventions with clear function names and docstrings. Type hints are present on public functions.

</details>

<details>
<summary>File map</summary>

**Created:**
- `app/orchestration/canonical_workflow.py` — 17-state enum, transition map, validation functions, authorization gate logic
- `app/orchestration/workflow_governance.py` — State transition enforcement, terminal state immutability, authorization gates
- `app/models/workflow.py` — ProjectLLMWorkflow and StateTransition dataclasses with hash-bound artifacts
- `app/api/schemas/workflow.py` — Pydantic schemas for workflow API (not reviewed in detail)
- `app/api/routes/workflows.py` — Workflow management endpoints (not reviewed in detail)
- `app/orchestration/workflow_engine.py` — Agent execution mapped to canonical states, calls governance_service
- `app/orchestration/agent_coordinator.py` — Agent orchestration primitives (no workflow awareness)
- `tests/unit/test_terminal_states.py` — 20 tests for terminal state enforcement
- `tests/unit/test_workflow_governance.py` — 18 tests for governance service
- `tests/unit/test_workflow_model.py` — 6 tests for workflow model
- `.agents/tasks/w0-architecture-freeze-report.json` — Evidence report with test results

**Modified:**
- `app/api/routes/governance.py` — Wired to WorkflowGovernanceService (not reviewed in detail)
- `app/api/routes/tasks.py` — Deprecation warnings added (not reviewed in detail)

**Full diff:** 484 files changed, 236,398 insertions, 4,246 deletions (Wave 0 implementation plus substantial other work on the branch)

</details>
