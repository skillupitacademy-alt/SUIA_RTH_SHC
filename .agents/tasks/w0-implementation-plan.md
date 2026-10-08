# Implementation Plan: Canonical Workflow Authority Freeze (Wave 0 / Agent B01)

**Task:** Establish CanonicalWorkflowState as the single source of truth for Project LLM workflow lifecycle  
**Branch:** m2-project-ai-canonical-wiring  
**Design Document:** `.agents/tasks/w0-design-doc.md`  
**Authority Audit:** `.agents/tasks/w0-authority-audit.md`

---

## Overview

This plan implements the canonical workflow authority freeze per M2.9 Wave 0 / Agent B01 requirements. The implementation resolves the multiple-authority conflict identified in the audit by:

1. Creating a complete workflow governance service with state transition validation
2. Establishing ProjectLLMWorkflow as the authoritative workflow model
3. Implementing authorization gates with hash-bound approval verification
4. Wiring workflow execution to canonical state transitions
5. Deprecating conflicting authorities (task routes, frontend independent state)
6. Creating comprehensive tests for state transitions, governance, and authorization

**Design Decision (grounded in audit findings):**  
The audit confirms that `CanonicalWorkflowState` (17 states) is well-designed and complete, but not wired to execution. Rather than redesigning the state machine, this plan wires the existing canonical states to workflow execution by creating `WorkflowGovernanceService` as the single point of authority for state transitions, and updating `WorkflowEngine` to use canonical states instead of `TaskState`.

---

## Implementation Steps

### 1. Create ProjectLLMWorkflow Model

**What:** Create the authoritative workflow data model at `services/project-ai/app/models/workflow.py` containing `StateTransition` and `ProjectLLMWorkflow` dataclasses with complete artifact binding, approval tracking, and state history.

**Files:**
- CREATE: `services/project-ai/app/models/workflow.py`

**Implementation Details:**
- `StateTransition` dataclass: `from_state`, `to_state`, `timestamp`, `triggered_by`, `evidence_id`, `reason`
- `ProjectLLMWorkflow` dataclass with fields:
  - Identity: `workflow_id`, `specification_id`, `target_family`, `target_version`, `requester_id`
  - Lifecycle: `current_state` (CanonicalWorkflowState), `state_history` (List[StateTransition])
  - Artifacts (hash-bound): `contract_id`, `contract_sha256`, `candidate_id`, `candidate_sha256`, `manifest_id`, `manifest_sha256`, `snapshot_id`, `snapshot_sha256`
  - Approval: `approval_id`, `gate_results` dict
  - Evidence: `evidence_ids` list
  - Metadata: `created_at`, `updated_at`, `final_status`
- Methods: `is_terminal()`, `requires_approval()`, `to_dict()`
- Follow design document section 1.1 exactly

**Verify:** Run unit tests for workflow model: `python -m pytest tests/unit/test_workflow_model.py -v` (tests created in step 8)

---

### 2. Create Workflow API Schemas

**What:** Create Pydantic schemas for workflow API contracts at `services/project-ai/app/api/schemas/workflow.py` covering create workflow, transition state, and workflow response shapes.

**Files:**
- CREATE: `services/project-ai/app/api/schemas/workflow.py`

**Implementation Details:**
- `WorkflowArtifact`: `id`, `sha256` (both optional)
- `WorkflowStateInfo`: `current` (str), `is_terminal` (bool), `requires_approval` (bool)
- `WorkflowTarget`: `family`, `version`
- `WorkflowArtifacts`: `contract`, `candidate`, `manifest`, `snapshot` (all WorkflowArtifact)
- `WorkflowResponse`: complete workflow representation for API responses
- `CreateWorkflowRequest`: `target_family`, `target_version`, `requester_id`, `purpose` (optional)
- `TransitionRequest`: `to_state`, `triggered_by`, `evidence_id`, `reason`
- Follow design document section 1.2 exactly
- All field descriptions must be clear and include validation constraints

**Verify:** Import schemas without errors: `python -c "from app.api.schemas.workflow import WorkflowResponse, CreateWorkflowRequest; print('Schemas OK')"`

---

### 3. Create WorkflowGovernanceService

**What:** Create the single point of authority for workflow state management at `services/project-ai/app/orchestration/workflow_governance.py`. This service enforces all state transitions, authorization gates, and terminal state rules.

**Files:**
- CREATE: `services/project-ai/app/orchestration/workflow_governance.py`

**Implementation Details:**
- `WorkflowGovernanceService` class with in-memory storage (`_workflows` dict, `_approvals` dict)
- `create_workflow()`: Initialize workflow in REQUESTED state, generate workflow_id (uuid4), create initial StateTransition, return ProjectLLMWorkflow
- `get_workflow()`: Retrieve workflow by ID
- `validate_transition()`: Check if transition is valid using `is_valid_transition()`, enforce terminal state boundary, return (bool, reason) tuple
- `transition_state()`: Execute state transition with validation:
  - Call `validate_transition()` first
  - For IMPLEMENTING transitions, call `can_transition_to_implementing()` with all authorization checks
  - Create StateTransition record
  - Update `current_state`, append to `state_history`, set `updated_at`
  - Set `final_status` if terminal state reached
  - Raise `ValueError` with clear message if validation/authorization fails
- `register_approval()`: Bind ImplementationApproval to workflow, set `approval_id`
- `bind_artifact()`: Set artifact ID and SHA-256 hash for contract/candidate/manifest/snapshot
- Follow design document section 2 exactly
- Use `from app.orchestration.canonical_workflow import` for all state functions
- Use `from app.models.implementation_approval import ImplementationApproval`

**Verify:** Import and instantiate service: `python -c "from app.orchestration.workflow_governance import WorkflowGovernanceService; svc = WorkflowGovernanceService(); print('Service OK')"`

---

### 4. Create Workflow API Routes

**What:** Create new workflow management endpoints at `services/project-ai/app/api/routes/workflows.py` that use WorkflowGovernanceService for all workflow operations.

**Files:**
- CREATE: `services/project-ai/app/api/routes/workflows.py`

**Implementation Details:**
- Router with prefix `/workflows`, tags `["workflows"]`
- Instantiate `governance_service = WorkflowGovernanceService()` at module level (in-memory for Wave 0)
- Endpoints:
  - `POST /workflows`: Create workflow (call `governance_service.create_workflow()`), return `WorkflowResponse` (201)
  - `GET /workflows/{workflow_id}`: Get workflow state (call `governance_service.get_workflow()`), return `WorkflowResponse` (200), raise 404 if not found
  - `POST /workflows/{workflow_id}/transition`: Transition state (internal use, call `governance_service.transition_state()`), return `WorkflowResponse` (200), raise 400 on validation error
  - `GET /workflows/{workflow_id}/history`: Get state transition history (read `workflow.state_history`), return list of transitions (200)
  - `POST /workflows/{workflow_id}/artifacts`: Bind artifact (call `governance_service.bind_artifact()`), return `WorkflowResponse` (200), validate artifact_type in ["contract", "candidate", "manifest", "snapshot"]
- Convert `ProjectLLMWorkflow.to_dict()` to `WorkflowResponse` for all returns
- Follow design document section 4.1 exactly
- Use HTTPException for error responses with appropriate status codes

**Verify:** Start FastAPI server and call workflow endpoints: `python -m pytest tests/integration/test_workflow_routes.py -v` (tests created in step 10)

---

### 5. Update Governance Routes for Workflow Integration

**What:** Modify `services/project-ai/app/api/routes/governance.py` to use WorkflowGovernanceService for approval-driven state transitions, specifically for placement approval endpoint.

**Files:**
- MODIFY: `services/project-ai/app/api/routes/governance.py`

**Implementation Details:**
- Import `WorkflowGovernanceService` and instantiate at module level
- Modify `approve_placement()` endpoint (if exists) or create new `POST /governance/workflows/{workflow_id}/approve-placement`:
  - Accept payload: `workflow_id`, `approved_by`, `candidate_sha256`, `manifest_id`, `manifest_sha256`, `approved` (bool), `reason` (optional)
  - Get workflow from `governance_service.get_workflow(workflow_id)`, raise 404 if not found
  - Verify current state is `AWAITING_IMPLEMENTATION_APPROVAL`, raise 409 if not
  - Verify hashes match workflow artifacts, raise 409 on mismatch
  - Verify `approved_by != workflow.requester_id` (self-approval check), raise 403 if self-approved
  - Create `ImplementationApproval` with `create_implementation_approval()`
  - Call `governance_service.register_approval(workflow_id, approval)`
  - If approved: call `governance_service.transition_state()` to IMPLEMENTING
  - If rejected: call `governance_service.transition_state()` to REJECTED
  - Return approval response with new workflow state
- Follow design document section 4.2 exactly
- Preserve existing approval storage logic, add governance service calls

**Verify:** Run governance endpoint tests: `python -m pytest tests/test_approval_endpoint.py -v` (existing tests should still pass)

---

### 6. Update WorkflowEngine to Use Canonical States

**What:** Modify `services/project-ai/app/orchestration/workflow_engine.py` to accept `workflow_id`, read canonical state from WorkflowGovernanceService, execute agents based on canonical state, and transition state after completion.

**Files:**
- MODIFY: `services/project-ai/app/orchestration/workflow_engine.py`

**Implementation Details:**
- Add `governance_service` parameter to `WorkflowEngine.__init__()` (optional, defaults to new instance)
- Create new method `execute_workflow_stage(workflow_id: str, snapshot: dict)`:
  - Get workflow from `governance_service.get_workflow(workflow_id)`, raise ValueError if not found
  - Read `current_state = workflow.current_state` (CanonicalWorkflowState)
  - Map canonical state to agent execution:
    - REQUESTED → execute discovery agents (RepositoryAuditor, Toolchain, Composer, Dependency), then transition to DISCOVERY
    - DISCOVERY → execute contract generation, then transition to BRIEF_READY
    - CANDIDATE_RECEIVED → execute intake processing, then transition to CANDIDATE_AUDIT
    - CANDIDATE_AUDIT → execute compliance gates, then transition to INTEGRATION_PLANNED or REJECTED
    - IMPLEMENTING → execute placement agents, then transition to IMPLEMENTED
    - IMPLEMENTED → transition to VERIFYING
    - VERIFYING → execute runtime/browser verification, then transition to CERTIFICATION_READY or REJECTED
    - CERTIFICATION_READY → transition to AWAITING_GATE_2
  - Call `agent_coordinator.execute_sequential()` or `execute_dag()` as appropriate
  - On success: call `governance_service.transition_state(workflow_id, next_state, "system", reason="<stage> completed")`
  - On failure: call `governance_service.transition_state(workflow_id, REJECTED, "system", reason="<stage> failed")`
  - Return execution results dict
- Keep existing `execute_step()` method for backward compatibility (mark as deprecated)
- Follow design document section 5.2 exactly

**Verify:** Run workflow engine tests: `python -m pytest tests/test_workflow_engine_agents.py -v` (existing tests may need updates to use workflow_id)

---

### 7. Deprecate Task Routes

**What:** Add deprecation warnings to all endpoints in `services/project-ai/app/api/routes/tasks.py`, marking them as deprecated in favor of `/workflows` endpoints.

**Files:**
- MODIFY: `services/project-ai/app/api/routes/tasks.py`

**Implementation Details:**
- Add `deprecated=True` parameter to all `@router` decorators
- Update docstrings with deprecation notice:
  ```
  DEPRECATED (M2.9 Wave 0): Use POST /workflows instead.
  
  This endpoint will be removed in future versions.
  Migration path: POST /workflows with target_family, target_version, requester_id.
  ```
- Add response header `X-Deprecated: "Use /workflows endpoints"` to all responses
- Do NOT modify endpoint behavior yet (functional changes in Wave 1+)
- Add comment at top of file explaining deprecation timeline
- Follow design document section 5.3 exactly

**Verify:** Start server and call task endpoint, verify deprecation warning appears: `python -m pytest tests/test_task_routes_deprecated.py -v` (test created in step 11)

---

### 8. Create Workflow Model Unit Tests

**What:** Create comprehensive unit tests for ProjectLLMWorkflow model at `services/project-ai/tests/unit/test_workflow_model.py`.

**Files:**
- CREATE: `services/project-ai/tests/unit/test_workflow_model.py`

**Implementation Details:**
- Test `StateTransition` dataclass creation and serialization
- Test `ProjectLLMWorkflow` initialization with all required fields
- Test `is_terminal()` returns True for CERTIFIED/REJECTED, False otherwise
- Test `requires_approval()` returns True for gate states (AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2)
- Test `to_dict()` serialization includes all fields with correct structure
- Test artifact binding (set contract_id, candidate_id, manifest_id, snapshot_id with hashes)
- Test state history tracking (append StateTransition records)
- Use pytest with clear test names: `test_workflow_creation`, `test_terminal_state_detection`, `test_gate_state_detection`, `test_artifact_binding`, `test_state_history`, `test_serialization`

**Verify:** `python -m pytest tests/unit/test_workflow_model.py -v --tb=short`

---

### 9. Create Workflow Governance Service Tests

**What:** Create comprehensive tests for WorkflowGovernanceService at `services/project-ai/tests/unit/test_workflow_governance.py`.

**Files:**
- CREATE: `services/project-ai/tests/unit/test_workflow_governance.py`

**Implementation Details:**
- Test workflow creation: `create_workflow()` returns workflow in REQUESTED state with valid workflow_id
- Test workflow retrieval: `get_workflow()` returns correct workflow, returns None for missing ID
- Test transition validation: `validate_transition()` accepts valid transitions, rejects invalid transitions, blocks transitions from terminal states
- Test state transition execution: `transition_state()` updates current_state, appends to state_history, sets updated_at, sets final_status for terminal states
- Test IMPLEMENTING authorization: `transition_state()` to IMPLEMENTING calls `can_transition_to_implementing()`, rejects if approval missing/invalid/self-approved/hash-mismatch
- Test approval registration: `register_approval()` sets approval_id on workflow
- Test artifact binding: `bind_artifact()` sets correct ID and hash for each artifact type (contract, candidate, manifest, snapshot)
- Test error cases: transition validation errors, missing workflow, invalid artifact type
- Use pytest fixtures for common setup (governance_service, sample workflow, sample approval)
- Follow existing test patterns from `tests/test_workflow_transitions.py`

**Verify:** `python -m pytest tests/unit/test_workflow_governance.py -v --tb=short`

---

### 10. Create Workflow API Integration Tests

**What:** Create integration tests for workflow API routes at `services/project-ai/tests/integration/test_workflow_routes.py`.

**Files:**
- CREATE: `services/project-ai/tests/integration/test_workflow_routes.py`

**Implementation Details:**
- Use `TestClient` from FastAPI for HTTP testing
- Test `POST /workflows`: create workflow, verify 201 response, verify initial state is REQUESTED
- Test `GET /workflows/{workflow_id}`: retrieve workflow, verify 200 response, verify 404 for missing workflow
- Test `POST /workflows/{workflow_id}/artifacts`: bind artifacts, verify 200 response, verify artifact hash stored
- Test `GET /workflows/{workflow_id}/history`: retrieve state history, verify transitions recorded
- Test `POST /workflows/{workflow_id}/transition`: internal transition endpoint, verify state changes, verify validation errors return 400
- Test error cases: invalid workflow_id, invalid artifact_type, invalid state transition
- Use pytest-asyncio for async test support
- Import router from `app.api.routes.workflows` and mount to test app

**Verify:** `python -m pytest tests/integration/test_workflow_routes.py -v --tb=short`

---

### 11. Create Terminal State and Evidence Tests

**What:** Create tests for terminal state enforcement and evidence requirements at `services/project-ai/tests/unit/test_terminal_states.py`.

**Files:**
- CREATE: `services/project-ai/tests/unit/test_terminal_states.py`

**Implementation Details:**
- Test terminal state detection: `is_terminal_state()` returns True for CERTIFIED and REJECTED only
- Test terminal state immutability: `validate_transition()` rejects all transitions from CERTIFIED state
- Test terminal state immutability: `validate_transition()` rejects all transitions from REJECTED state
- Test transition_state raises ValueError when attempting to transition from terminal state
- Test final_status set correctly: CERTIFIED state sets final_status="CERTIFIED", REJECTED sets final_status="REJECTED"
- Test evidence binding: workflows can accumulate evidence_ids list
- Test gate state detection: all three gate states properly identified by `is_gate_state()`
- Use parameterized tests for terminal state checks across both terminal states

**Verify:** `python -m pytest tests/unit/test_terminal_states.py -v --tb=short`

---

### 12. Create Authorization Gate Tests

**What:** Extend existing `tests/test_workflow_transitions.py` with additional authorization gate test cases covering all six authorization checks.

**Files:**
- MODIFY: `services/project-ai/tests/test_workflow_transitions.py`

**Implementation Details:**
- Add test for missing approval record: verify `can_transition_to_implementing()` blocks with clear error
- Add test for PENDING status: verify transition blocked until approval status is APPROVED
- Add test for REJECTED status: verify transition blocked for rejected approvals
- Add test for candidate hash mismatch: verify exact hash comparison
- Add test for manifest ID mismatch: verify exact ID comparison
- Add test for manifest hash mismatch: verify exact hash comparison
- Add test for self-approval: verify approver != requester check
- Add test for missing required parameters: verify all 4 required params (requester_id, candidate_sha256, manifest_id, manifest_sha256)
- Add test for successful authorization: all checks pass, transition allowed
- Follow existing test pattern in file (uses `create_implementation_approval()`)
- Each test should verify both the boolean return and the reason string

**Verify:** `python -m pytest tests/test_workflow_transitions.py -v --tb=short`

---

### 13. Update Existing Tests for Canonical States

**What:** Review and update existing workflow-related tests that may reference TaskState to use CanonicalWorkflowState where appropriate.

**Files:**
- REVIEW/MODIFY: `services/project-ai/tests/test_workflow_engine_agents.py`
- REVIEW/MODIFY: `services/project-ai/tests/test_agent_coordinator.py`

**Implementation Details:**
- Scan tests for TaskState usage in workflow context (not agent execution context)
- Update test fixtures to create workflows via `WorkflowGovernanceService.create_workflow()`
- Update test assertions to check `workflow.current_state` (CanonicalWorkflowState) instead of task["state"] (TaskState)
- Preserve TaskState usage for agent-level execution tracking (that remains valid)
- Add imports: `from app.orchestration.canonical_workflow import CanonicalWorkflowState`
- Do NOT remove TaskState entirely (it remains for agent execution tracking per audit clarification)
- Mark any tests that are no longer relevant with `@pytest.mark.skip(reason="TaskState deprecated for workflow-level operations")`

**Verify:** `python -m pytest tests/test_workflow_engine_agents.py tests/test_agent_coordinator.py -v`

---

### 14. Create Frontend Integration Notes

**What:** Create a documentation file explaining frontend integration requirements at `services/project-ai/docs/frontend-integration.md`.

**Files:**
- CREATE: `services/project-ai/docs/frontend-integration.md`

**Implementation Details:**
- Document the architectural rule: "Frontend must consume backend state, not create its own state machine"
- Explain current violation: ProjectLlmContext uses localStorage with independent state (15 fields)
- Provide migration path:
  1. Replace localStorage state with backend API calls to `GET /workflows/{workflow_id}`
  2. Use `current_state` from backend instead of step numbers
  3. Call governance approval endpoints for gate progression
  4. Display gate states explicitly in UI (AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2)
- Include API endpoint reference table: endpoint, method, purpose, required fields
- Include state-to-UI-step mapping for display purposes (backend state is source of truth, UI step is for navigation only)
- Document that actual frontend implementation is out of scope for Wave 0 (backend-only)
- Reference design document section 5.4
- Format as markdown with clear headers and code examples

**Verify:** Read file and confirm all sections present: `cat services/project-ai/docs/frontend-integration.md`

---

### 15. Run Complete Test Suite

**What:** Execute the complete project-ai test suite to verify all implementations work together and no regressions introduced.

**Files:**
- NO FILE CHANGES

**Implementation Details:**
- Run full test suite: `python -m pytest services/project-ai/tests -v --tb=short`
- Expected test count: approximately 50+ tests (existing ~30 + new ~20 from this plan)
- All tests must pass
- If any existing tests fail due to workflow authority changes, update them to use canonical workflow patterns
- Capture test output showing pass count, coverage summary

**Verify:** `python -m pytest services/project-ai/tests -v --tb=short --capture=no`

---

### 16. Generate Architecture Freeze Evidence Report

**What:** Create machine-readable evidence report at `.agents/tasks/w0-architecture-freeze-report.json` documenting architecture freeze completion, test results, and authority reconciliation.

**Files:**
- CREATE: `.agents/tasks/w0-architecture-freeze-report.json`

**Implementation Details:**
- JSON structure following evidence pattern:
  ```json
  {
    "workflow_id": "w0-architecture-authority-freeze",
    "branch": "m2-project-ai-canonical-wiring",
    "wave": "M2.9-W0",
    "agent": "B01-Architecture-Authority",
    "timestamp": "<ISO 8601>",
    "authority_reconciliation": {
      "canonical_authority": "CanonicalWorkflowState (17 states)",
      "deprecated_authorities": ["TaskState (workflow-level usage)", "ProjectLlmContext localStorage", "/tasks routes"],
      "preserved_authorities": ["TaskState (agent-level tracking)"],
      "governance_service": "WorkflowGovernanceService",
      "approval_model": "ImplementationApproval"
    },
    "test_results": {
      "total_tests": "<count>",
      "passed": "<count>",
      "failed": "<count>",
      "skipped": "<count>",
      "coverage_summary": "from pytest output"
    },
    "files_created": [
      "app/models/workflow.py",
      "app/api/schemas/workflow.py",
      "app/orchestration/workflow_governance.py",
      "app/api/routes/workflows.py",
      "tests/unit/test_workflow_model.py",
      "tests/unit/test_workflow_governance.py",
      "tests/integration/test_workflow_routes.py",
      "tests/unit/test_terminal_states.py",
      "docs/frontend-integration.md"
    ],
    "files_modified": [
      "app/api/routes/governance.py",
      "app/orchestration/workflow_engine.py",
      "app/api/routes/tasks.py",
      "tests/test_workflow_transitions.py"
    ],
    "verification_evidence": {
      "state_machine_frozen": true,
      "transition_validation_implemented": true,
      "authorization_gates_implemented": true,
      "self_approval_prevention": true,
      "hash_verification": true,
      "terminal_state_enforcement": true
    }
  }
  ```
- Generate timestamp in ISO 8601 format
- Extract test counts from pytest output (step 15)
- List all files created and modified accurately
- Include git commit SHA after commit (step 18)

**Verify:** Parse JSON to confirm valid structure: `python -c "import json; json.load(open('.agents/tasks/w0-architecture-freeze-report.json')); print('Evidence OK')"`

---

### 17. Update Documentation and Architectural Notes

**What:** Update project-ai documentation to reflect canonical workflow authority and governance service.

**Files:**
- CREATE: `services/project-ai/docs/architecture/workflow-authority.md`

**Implementation Details:**
- Document the authority hierarchy:
  ```
  CanonicalWorkflowState (workflow lifecycle)
    ├── WorkflowGovernanceService (state transitions)
    ├── Governance Routes (approval gates)
    ├── WorkflowEngine (agent execution)
    └── AgentCoordinator (orchestration)
  ```
- Explain state transition rules (VALID_TRANSITIONS dict)
- Document authorization gates (3 human gates, automated gates)
- Explain terminal state enforcement
- Document hash-bound approval verification
- Include state diagram from canonical_workflow.py docstring
- Reference design document and audit report
- Format as markdown with clear sections

**Verify:** Read file and confirm all sections present: `cat services/project-ai/docs/architecture/workflow-authority.md`

---

### 18. Git Commit and Branch Push

**What:** Commit all changes to the m2-project-ai-canonical-wiring branch with clear commit message and push to remote.

**Files:**
- ALL FILES FROM PREVIOUS STEPS

**Implementation Details:**
- Stage all created and modified files:
  ```
  git add services/project-ai/app/models/workflow.py
  git add services/project-ai/app/api/schemas/workflow.py
  git add services/project-ai/app/orchestration/workflow_governance.py
  git add services/project-ai/app/api/routes/workflows.py
  git add services/project-ai/app/api/routes/governance.py
  git add services/project-ai/app/orchestration/workflow_engine.py
  git add services/project-ai/app/api/routes/tasks.py
  git add services/project-ai/tests/unit/test_workflow_model.py
  git add services/project-ai/tests/unit/test_workflow_governance.py
  git add services/project-ai/tests/integration/test_workflow_routes.py
  git add services/project-ai/tests/unit/test_terminal_states.py
  git add services/project-ai/tests/test_workflow_transitions.py
  git add services/project-ai/docs/frontend-integration.md
  git add services/project-ai/docs/architecture/workflow-authority.md
  git add .agents/tasks/w0-architecture-freeze-report.json
  git add .agents/tasks/w0-implementation-plan.md
  ```
- Commit with message:
  ```
  M2.9 W0: Freeze canonical workflow authority (Agent B01)
  
  Establish CanonicalWorkflowState as single source of truth for workflow lifecycle.
  
  - Created ProjectLLMWorkflow model with hash-bound artifact tracking
  - Created WorkflowGovernanceService for state transition enforcement
  - Created /workflows API endpoints using canonical states
  - Updated governance routes to use WorkflowGovernanceService
  - Updated WorkflowEngine to execute based on canonical states
  - Deprecated /tasks routes (migration to /workflows in Wave 1+)
  - Created comprehensive test suite (50+ tests)
  - Documented frontend integration requirements
  
  Resolves multiple-authority conflict per authority audit.
  All tests passing. Evidence report: .agents/tasks/w0-architecture-freeze-report.json
  
  Design: .agents/tasks/w0-design-doc.md
  Audit: .agents/tasks/w0-authority-audit.md
  Plan: .agents/tasks/w0-implementation-plan.md
  ```
- Push branch: `git push origin m2-project-ai-canonical-wiring`
- If branch doesn't exist on remote yet: `git push -u origin m2-project-ai-canonical-wiring`

**Verify:** `git log -1 --oneline` shows commit, `git status` shows clean working tree, `git branch -r` shows remote branch

---

## Test Execution Summary

**Unit Tests:**
- `tests/unit/test_workflow_model.py` - ProjectLLMWorkflow model tests (~8 tests)
- `tests/unit/test_workflow_governance.py` - WorkflowGovernanceService tests (~12 tests)
- `tests/unit/test_terminal_states.py` - Terminal state enforcement tests (~6 tests)
- `tests/test_workflow_transitions.py` - Authorization gate tests (updated, ~15 tests)

**Integration Tests:**
- `tests/integration/test_workflow_routes.py` - Workflow API endpoint tests (~10 tests)

**Regression Tests:**
- `tests/test_workflow_engine_agents.py` - Verify WorkflowEngine updates don't break agent execution
- `tests/test_agent_coordinator.py` - Verify AgentCoordinator still works with updated context

**Full Suite Command:**
```bash
cd services/project-ai
python -m pytest tests -v --tb=short
```

**Expected Results:**
- Total tests: 50+
- All tests pass
- No warnings about deprecated TaskState in workflow context
- Clear test output showing canonical workflow authority enforcement

---

## Evidence Artifacts

All evidence artifacts are created in `.agents/tasks/` directory:

1. **w0-implementation-plan.md** (this file) - Complete implementation plan
2. **w0-architecture-freeze-report.json** - Machine-readable evidence with test results
3. **w0-design-doc.md** - Design document (already exists)
4. **w0-authority-audit.md** - Authority audit report (already exists)

Additional documentation:
- `services/project-ai/docs/frontend-integration.md` - Frontend migration guide
- `services/project-ai/docs/architecture/workflow-authority.md` - Architecture documentation

---

## Dependencies and Constraints

**Language:** Python 3.11+  
**Test Framework:** pytest 9.1.1 with pytest-asyncio  
**Web Framework:** FastAPI with Pydantic v2  
**Build System:** None required (Python modules only)  
**Test Command:** `python -m pytest services/project-ai/tests -v --tb=short`

**Key Dependencies (from existing pyproject.toml):**
- fastapi>=0.111.0
- uvicorn[standard]>=0.29.0
- pydantic>=2.7.0
- httpx>=0.27.0
- pytest>=8.0.0
- pytest-asyncio>=0.23.0

**Environment Constraints:**
- In-memory storage for Wave 0 (persistence deferred to Wave 1+)
- Backend-only implementation (frontend integration documented but not implemented)
- No database schema changes required
- No external service dependencies

**Architectural Constraints:**
- CanonicalWorkflowState is immutable (no new states added in Wave 0)
- Terminal states (CERTIFIED, REJECTED) are immutable after reached
- TaskState preserved for agent-level execution tracking
- Governance approval logic preserved from existing implementation_approval.py

---

## Success Criteria

- [ ] All 18 implementation steps completed
- [ ] All unit tests pass (workflow model, governance service, terminal states, authorization gates)
- [ ] All integration tests pass (workflow API routes)
- [ ] Existing regression tests pass (workflow engine, agent coordinator)
- [ ] Evidence report generated with real test counts
- [ ] Git commit created and pushed to branch
- [ ] No TypeScript/linting errors (backend-only, no TS changes)
- [ ] Architecture freeze report documents authority reconciliation
- [ ] Frontend integration documented (implementation deferred)

---

## Out of Scope (Future Waves)

The following items are explicitly **not included** in Wave 0:

1. **Frontend Implementation:** ProjectLlmContext refactor to consume backend state (Wave 1+)
2. **Persistence:** Database storage for workflows and approvals (Wave 1+)
3. **Task Route Removal:** Functional replacement of /tasks endpoints (Wave 1+)
4. **Agent Execution Gating:** Direct integration of workflow state checks in AgentCoordinator (Wave 2+)
5. **Legacy Model Removal:** Full removal of WorkflowStatus, CreationMode (Wave 2+)
6. **External AI Integration:** Contract generation and handoff (Wave 3+)
7. **Certification Workflow:** Complete certification pipeline with browser/runtime verification (Wave 4+)

Wave 0 focuses exclusively on **authority reconciliation** and **governance foundation**.
