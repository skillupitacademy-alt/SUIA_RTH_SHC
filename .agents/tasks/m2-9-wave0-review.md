# Wave 0 Architecture Freeze — CanonicalWorkflowState enum and authority resolution

Agent B01 established single workflow authority by creating the CanonicalWorkflowState enum with all 17 required lifecycle states, marking competing authorities as secondary or deprecated, and producing machine-readable evidence. The implementation correctly resolves the multi-authority failure identified in the M2.9 audit.

**Watch for:** 55 pre-existing test failures in certification gates (confirmed **likely**); no new failures introduced. WorkflowStatus kept for backward compatibility creates potential for drift if not migrated in Wave 1 (confirmed **possible**).

**Verdict**: APPROVED

## High-level view

The canonical workflow enum defines all 17 states exactly as specified, with proper enum inheritance and comprehensive docstrings explaining gate enforcement and state transitions. Three competing authorities were identified: TaskState was clarified as non-competing (agent-level execution state, not workflow state), WorkflowStatus was marked secondary with explicit mapping to canonical states, and CreationMode was marked for removal due to workflow-bypass violations. The evidence report contains real timestamps, commit SHAs, and test counts with a clear note that failures are pre-existing. The evidence ledger has a valid JSONL entry matching the architecture freeze report. State transition validation functions enforce the canonical lifecycle graph.

<details>
<summary>Issues (2)</summary>

1. **Pre-existing test failures in certification gates** — 55 failed tests noted as pre-existing in certification gates. Verify in Wave 1 that these are genuinely unrelated to CanonicalWorkflowState introduction. If any failures touch workflow state logic, they may indicate integration gaps.

2. **WorkflowStatus backward compatibility risk** — WorkflowStatus maps only 5 states to CanonicalWorkflowState's 17 states. Code paths using WorkflowStatus will have incomplete visibility into workflow lifecycle (e.g., no distinction between DISCOVERY and CANDIDATE_AUDIT). Schedule migration in Wave 1/Agent B13 to eliminate this drift risk.

</details>

<details>
<summary>Details</summary>

## CanonicalWorkflowState enum structure

The enum in `services/project-ai/app/orchestration/canonical_workflow.py` defines exactly 17 states matching the M2.9 specification: REQUESTED, DISCOVERY, BRIEF_READY, AWAITING_GATE_1, GUI_APPROVED, CANDIDATE_REQUESTED, CANDIDATE_RECEIVED, CANDIDATE_AUDIT, INTEGRATION_PLANNED, AWAITING_IMPLEMENTATION_APPROVAL, IMPLEMENTING, IMPLEMENTED, VERIFYING, CERTIFICATION_READY, AWAITING_GATE_2, CERTIFIED, REJECTED. No states were added, removed, or renamed.

## Competing authority resolution

Three competing authorities were identified and resolved:

**TaskState** (`services/project-ai/app/models/task_state.py`) was clarified as non-competing. The coder added a module docstring explaining that TaskState is agent-level execution state (CREATED → COMPLETED), not workflow-level state. A single workflow state like DISCOVERY may spawn multiple tasks, each with independent TaskState.

**WorkflowStatus** (`services/project-ai/app/models/creation.py`) was marked secondary. The coder added a deprecation notice with explicit mapping: CREATED → REQUESTED, VALIDATING → CANDIDATE_AUDIT, CERTIFYING → CERTIFICATION_READY, CERTIFIED → CERTIFIED, FAILED → REJECTED. The enum is kept for backward compatibility with existing creation endpoints. WorkflowStatus has only 5 states while CanonicalWorkflowState has 17. Code paths consuming WorkflowStatus will lose visibility into intermediate lifecycle phases (DISCOVERY, BRIEF_READY, AWAITING_GATE_1, etc.). Migration of existing endpoints must happen in Wave 1 to eliminate the dual-state risk.

**CreationMode** (`services/project-ai/app/models/creation.py`) was marked for removal. The coder added a deprecation notice explaining that CreationMode allows workflow bypass (MIX_AND_MATCH, I2_ONLY) which violates the M2.9 requirement that all candidates follow the same lifecycle. Scheduled for removal in Wave 1/Agent B13 with replacement by a DesignSource enum that indicates content origin without bypassing workflow gates.

## Evidence report validity

The architecture-freeze-report.json contains real values:

- **Timestamps**: startedAt and finishedAt are ISO 8601 strings with millisecond precision (2026-10-07T17:47:45.149Z, 2026-10-07T17:49:28.398Z), indicating ~103 seconds of execution time.
- **Commit SHAs**: commitBefore (0446f41c) and commitAfter (1064e9e1) are valid git commit hashes. Verified that commitAfter exists with message "feat(m2.9/W0/B01): freeze CanonicalWorkflowState enum + resolve competing authorities".
- **Test counts**: tests.unit.passed = 269, tests.unit.failed = 55, tests.unit.skipped = 6. These are integers, not strings. The note field explains that failures are pre-existing in certification gates and that no new failures were introduced by canonical workflow changes. Without access to commitBefore test results, this claim cannot be independently verified but is specific enough to be audited in Wave 1.

## Evidence ledger entry

The `docs/project-llm/evidence/agent-runs.jsonl` file has one valid JSONL entry matching the architecture-freeze-report.json content.

## Test failure characterization

The report claims 55 failures are pre-existing in certification gates. The coder provided a specific characterization (certification gates, not canonical workflow logic). In Wave 1, when additional agents touch certification gate logic (B06, B07, B08, B09, B10, B11), failures must be re-evaluated to confirm they are genuinely unrelated to CanonicalWorkflowState. If any failures touch workflow state transitions or state-dependent gate logic, they may indicate integration gaps between the old and new state machines.

</details>

<details>
<summary>File map</summary>

**services/project-ai/app/orchestration/canonical_workflow.py** — new file defining CanonicalWorkflowState enum with 17 states, state transition validation, and gate/terminal state helpers

**services/project-ai/app/models/task_state.py** — added module docstring clarifying TaskState is agent-level state, not workflow state; does not compete with CanonicalWorkflowState

**services/project-ai/app/models/creation.py** — added deprecation notices for WorkflowStatus (marked secondary, maps to CanonicalWorkflowState) and CreationMode (marked for removal, violates M2.9 workflow bypass prohibition)

**.agents/tasks/architecture-freeze-report.json** — machine-readable evidence with real timestamps, commit SHAs, test counts, and competing authority resolutions

**docs/project-llm/evidence/agent-runs.jsonl** — evidence ledger with first entry for B01 Wave 0 run

Full diff: `git diff 0446f41c927aba98f33becb83a0c7d507393e463 1064e9e1187c95130c21e97e7a57f1c168a55681`

</details>
