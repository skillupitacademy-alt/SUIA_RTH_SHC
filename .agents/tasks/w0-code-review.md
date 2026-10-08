# Canonical Workflow Authority Implementation (Wave 0)

This change establishes `CanonicalWorkflowState` as the single source of truth for Project LLM workflow lifecycle, resolves multiple competing state authorities identified in the audit, and creates the workflow governance infrastructure. The implementation creates a complete 17-state workflow state machine with authorization gates, hash-bound approvals, terminal state enforcement, and REST API exposure.

The architectural goal is to fix a fundamental wiring problem: the canonical workflow states existed but weren't connected to execution. Now `WorkflowGovernanceService` enforces state transitions, `ProjectLLMWorkflow` tracks artifact bindings and approval history, and workflow API routes expose the canonical state machine to frontend consumers. The implementation preserves all authorization logic from existing approval systems.

**Watch for:** Agent coordinator integration gap (confirmed), frontend state consumption not yet wired (confirmed), task route deprecation incomplete (confirmed), evidence attachment API exists but not called by agents (likely).

**Verdict**: NEEDS_CHANGES

## High-level view

The canonical workflow model defines 17 states from REQUESTED through CERTIFIED/REJECTED with three human approval gates. The state transition map is complete and matches the design specification. Terminal states (CERTIFIED, REJECTED) correctly prevent further transitions.

The governance service enforces all state transitions through a single authority. It validates transitions against the canonical state machine, enforces terminal state immutability, and runs full authorization checks for IMPLEMENTING transitions including hash verification and self-approval prevention. The service uses in-memory storage for Wave 0 with clear migration path to database persistence.

The workflow model binds all artifacts (contract, candidate, manifest, snapshot) with SHA-256 hashes, tracks complete state history, and exposes helper methods for terminal state and gate detection. Every state transition creates an audit record with timestamp, trigger, and optional evidence reference.

REST API routes expose workflow creation, retrieval, transition, and artifact binding. The workflow response schema mirrors the domain model structure and exposes state machine metadata (is_terminal, requires_approval) for frontend consumption.

Agent coordinator integration was not implemented. The coordinator does not call `transition_state()` after agent execution, meaning agents run but workflow state never advances beyond REQUESTED. This breaks the core wiring requirement.

Frontend state consumption was not implemented. The design specifies removing localStorage state management and fetching state from `/workflows/{id}`, but no frontend changes were made. The frontend still maintains independent state.

Test coverage validates state machine rules, governance operations, and authorization gates with real assertions. Tests cover legal/illegal transitions, terminal state enforcement, IMPLEMENTING authorization with all six gates, approval registration, and artifact binding. Test counts in the evidence file (269 passed, 55 failed, 6 skipped) are real pytest output, not placeholders.

<details>
<summary>Issues (6)</summary>

1. **Empty string bypass in authorization gates** — The `can_transition_to_implementing()` function validates required parameters with `if not requester_id` guards, but empty strings pass Python's truthiness check. Callers could bypass early validation by passing empty strings. Change parameter validation to `if not requester_id or requester_id.strip() == ""` for requester_id, candidate_sha256, manifest_id, and manifest_sha256.

2. **Agent coordinator does not call governance service** — The design requires `AgentCoordinator` and `WorkflowEngine` to call `governance_service.transition_state()` after agent completion. The coordinator file was not modified in this diff. Agents can execute but workflow state never advances. Wire agent completion to state transitions.

3. **Frontend state machine not migrated** — The design specifies removing frontend `localStorage` state tracking and consuming backend canonical states via `/workflows/{id}`. No frontend changes were made. The frontend still maintains independent state. Migrate frontend to backend-driven state.

4. **Task routes deprecation incomplete** — The design requires adding deprecation warnings to `/tasks` endpoints and documenting migration path. The task routes file was not modified. Existing callers still hit old endpoints. Add deprecation notices and interim forwarding.

5. **Evidence attachment not wired to agent execution** — The governance service accepts `evidence_id` in `transition_state()` but agents don't call this API. Evidence accumulation is central to the certification model. Wire agent results to evidence binding.

6. **Approval routes do not call governance service** — The governance routes (`approve_manifest`) still use in-memory `_approvals` dict instead of calling `governance_service.register_approval()`. Approvals are isolated from workflows. Integrate approval flow with governance service.

</details>

<details>
<summary>Details</summary>

## Canonical workflow state machine

**Security gap (confirmed):** The `can_transition_to_implementing()` function validates required parameters with `if not requester_id` guards, but empty strings pass Python's truthiness check. The approval verification methods (`verify_candidate_hash`, `verify_manifest_hash`, `verify_not_self_approved`) would catch hash mismatches, but callers could bypass the early parameter checks by passing empty strings. Change parameter validation to `if not requester_id or requester_id.strip() == ""` for all required fields (requester_id, candidate_sha256, manifest_id, manifest_sha256).

## Workflow governance service

**Agent integration gap (confirmed):** No code in this diff calls `governance_service.transition_state()` from agent execution paths. The `AgentCoordinator` class was not modified. The workflow state machine is complete and enforced, but agents don't trigger transitions, so workflows never advance beyond REQUESTED state. The design specifies `WorkflowEngine.execute_workflow_stage()` should call the governance service after agent completion, but this integration is absent.

## Workflow data model and API

**Frontend wiring gap (confirmed):** The API routes exist but the frontend was not modified to call them. The design specifies replacing frontend localStorage state management with `fetchWorkflowState(workflowId)` that calls `/workflows/{id}`, but no frontend changes appear in this diff. The frontend still maintains independent state machines, violating the single-authority principle.

**Task route deprecation gap (confirmed):** The design specifies adding deprecation warnings to `/tasks` endpoints and optionally forwarding to `/workflows` endpoints for backward compatibility. The task routes file (`app/api/routes/tasks.py`) was not modified in this diff. Existing callers still hit old endpoints without deprecation notices or migration guidance.

## Authorization and approval integration

**Approval route integration gap (likely):** The governance routes (`/approvals/{id}/approve`) still use module-level `_approvals` dict and don't call `governance_service.register_approval()` or `transition_state()`. When a user approves a manifest, the approval record updates but the workflow state doesn't transition. The approval system and workflow system are isolated. The design specifies updating approval routes to call the governance service, but this integration is missing.

## Test coverage

Test counts in the evidence file (269 passed, 55 failed, 6 skipped) reflect real pytest output. The report notes "pre-existing failures in certification gates" and "no new failures introduced by canonical workflow changes".

**Not tested:** Agent coordinator integration (doesn't exist), frontend state consumption (doesn't exist), task route deprecation behavior, approval route integration with governance service, evidence attachment from agent execution, concurrent workflow creation, workflow state persistence across service restarts.

## Retirement and migration

**Mix & Match reclassification gap:** The design specifies reclassifying Mix & Match workflows as `DesignSource.REUSE` (reusing existing canonical blocks) rather than a separate workflow type. This change was not implemented. The Mix & Match mode would still bypass the canonical workflow.

</details>

<details>
<summary>File map</summary>

**Core canonical workflow model:**
- `services/project-ai/app/orchestration/canonical_workflow.py` — 17-state enum, transition map, authorization gates (new file, 466 lines)

**Workflow domain model:**
- `services/project-ai/app/models/workflow.py` — ProjectLLMWorkflow dataclass with artifact bindings and state history (new file)

**Governance service:**
- `services/project-ai/app/orchestration/workflow_governance.py` — Single authority for state transitions (new file)

**API layer:**
- `services/project-ai/app/api/schemas/workflow.py` — Pydantic schemas for workflow API (new file)
- `services/project-ai/app/api/routes/workflows.py` — REST endpoints for workflow operations (new file)
- `services/project-ai/app/api/routes/governance.py` — Modified to reference governance service but not integrated

**Tests:**
- `services/project-ai/tests/unit/test_workflow_governance.py` — Governance service unit tests (new file)
- `services/project-ai/tests/unit/test_terminal_states.py` — Terminal state enforcement tests (new file)

**Evidence:**
- `.agents/tasks/architecture-freeze-report.json` — Test results, file list, commit SHA

**Documentation:**
- `docs/project-llm/canonical-workflow.md` — Canonical workflow specification (assumed created)

Full diff: `git diff main...m2-project-ai-canonical-wiring`

</details>
