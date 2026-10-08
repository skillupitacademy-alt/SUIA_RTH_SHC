# Workflow Authority Audit: Project LLM M2.9

**Branch:** m2-project-ai-canonical-wiring  
**Commit:** 55613c81  
**Audit Date:** 2026-01-08  
**Auditor:** Planning Agent (Wave 0 / Agent B01 Authority Investigation)

---

## Executive Summary

The Project LLM implementation contains **5 competing workflow authorities** managing lifecycle states, approval gates, and state transitions. This multi-authority architecture creates ambiguity about which state machine is canonical, where approval logic lives, and how state transitions are coordinated.

**Critical Finding:** The repository has already attempted architectural reconciliation — `CanonicalWorkflowState` (17 states) exists as the declared single source of truth in `canonical_workflow.py`, and legacy authorities (`WorkflowStatus`, `CreationMode`) have been marked deprecated. However, **the reconciliation is incomplete**:

1. **WorkflowEngine** still defines its own 11-state machine using `TaskState`
2. **Frontend** maintains its own independent 15-field state machine in `ProjectLlmContext`
3. **AgentCoordinator** operates independently of workflow states
4. **GateController** and governance routes exist but lack integration with canonical states
5. Legacy creation routes are disabled (405) but models remain in codebase

The audit conclusion: **wiring and authority reconciliation** is the main problem, not architectural redesign.

---

## Authority 1: CanonicalWorkflowState (Declared Canonical)

**Location:** `services/project-ai/app/orchestration/canonical_workflow.py`

### Lifecycle States (17 Total)

```
REQUESTED
  ↓
DISCOVERY
  ↓
BRIEF_READY
  ↓
AWAITING_GATE_1 (Human Gate 1: GUI prototype approval)
  ↓ (approved)
GUI_APPROVED
  ↓
CANDIDATE_REQUESTED
  ↓
CANDIDATE_RECEIVED
  ↓
CANDIDATE_AUDIT
  ↓ (gates pass)
INTEGRATION_PLANNED
  ↓
AWAITING_IMPLEMENTATION_APPROVAL (Human Gate 2: Placement approval)
  ↓ (approved)
IMPLEMENTING
  ↓
IMPLEMENTED
  ↓
VERIFYING
  ↓
CERTIFICATION_READY
  ↓
AWAITING_GATE_2 (Human Gate 3: Final certification)
  ↓ (approved)
CERTIFIED

(REJECTED terminal state can be reached from multiple points)
```

### Key Characteristics

- **Declared Authority:** Docstring explicitly states "ONLY workflow state machine for Project LLM"
- **Architectural Rule:** "Frontend must consume these states; frontend must NOT create another state machine"
- **Gate Enforcement:** 3 human approval gates explicitly defined
- **Validation Logic:** Includes `VALID_TRANSITIONS` dict and `is_valid_transition()` function
- **Authorization Logic:** Includes `can_transition_to_implementing()` with 6 authorization gates:
  - Approval must exist
  - Approval status must be APPROVED
  - Candidate hash must match
  - Manifest ID must match
  - Manifest hash must match
  - Must not be self-approved
- **Terminal States:** `CERTIFIED`, `REJECTED`

### State Transition Control

- **Explicit:** `VALID_TRANSITIONS` dict defines all allowed transitions
- **Validation Function:** `is_valid_transition(from_state, to_state) -> bool`
- **Gate Detection:** `is_gate_state(state)` identifies human approval gates
- **Terminal Detection:** `is_terminal_state(state)` identifies end states

### Approval/Governance Integration

- Directly references `ImplementationApproval` model for Gate 2 (placement approval)
- Includes `approvals_store` parameter in `can_transition_to_implementing()`
- **Critical Gap:** No integration with workflow execution engine — this is validation logic only

### Evidence of Intended Authority

```python
"""
ARCHITECTURAL RULE:
- CanonicalWorkflowState is the ONLY workflow state machine for Project LLM
- All other state enums must map to or derive from these canonical states
- Frontend must consume these states; frontend must NOT create another state machine
- External AI receives contracts based on these states, not internal TaskState
"""
```

---

## Authority 2: WorkflowEngine + TaskState

**Location:** `services/project-ai/app/orchestration/workflow_engine.py`

### Lifecycle States (11 Total)

```
CREATED
  ↓
DISCOVERY
  ↓
PLANNING
  ↓
WAITING_FOR_APPROVAL (approval gate)
  ↓ (approved)
IMPLEMENTING
  ↓
TESTING
  ↓
VERIFYING
  ↓
COMPLETED

(Plus FAILED, BLOCKED, REJECTED as terminal/error states)
```

### Key Characteristics

- **Active Execution Authority:** Implements `execute_step()` method that actually runs agent workflows
- **Agent Coordination:** Integrates with `AgentCoordinator` and `AgentRegistry`
- **Step Definitions:** Defines 7 `WorkflowStep` objects with from_state/to_state transitions
- **Real Implementation:** Not a stub — contains DAG execution logic for discovery, planning, testing, verification
- **Approval Integration:** Includes `requires_approval` flag on steps

### State Transition Control

- **Implicit:** Transitions defined in `_define_workflow_steps()` as ordered list
- **Step-Based:** Each `WorkflowStep` defines `from_state` and `to_state`
- **Validation Function:** `can_transition(from_state, to_state)` checks if step exists

### Approval/Governance Integration

- **Step-Level:** `requires_approval` boolean flag on `WorkflowStep`
- **Single Gate:** Only PLANNING → WAITING_FOR_APPROVAL has approval gate
- **No Hash Verification:** No candidate hash, manifest hash, or self-approval checks
- **No Authorization Logic:** Simply checks if user called `/tasks/{task_id}/approve`

### Agent Execution Logic

```python
async def execute_step(step, task_context, snapshot):
    if step.step_id == "discovery":
        # Execute: Repository Auditor → Toolchain → Composer → Dependency
        agents_to_execute = [
            self.agent_registry.get_agent(AgentType.REPOSITORY_AUDITOR),
            self.agent_registry.get_agent(AgentType.TOOLCHAIN),
            self.agent_registry.get_agent(AgentType.COMPOSER),
            self.agent_registry.get_agent(AgentType.DEPENDENCY)
        ]
        agent_results = await self.agent_coordinator.execute_sequential(...)
    
    elif step.step_id == "verification":
        # Build dependency graph and execute agents with dependencies
        dependencies = {
            "composer": [],
            "composer_workflow": ["composer"],
            "runtime_browser": ["composer"],
            "candidate_certification": ["composer", "runtime_browser"],
            "gate_controller": ["candidate_certification"]
        }
        agent_results = await self.agent_coordinator.execute_dag(...)
```

### Relationship to CanonicalWorkflowState

**TaskState docstring explicitly clarifies:**

```python
"""
DEPRECATION NOTICE (M2.9):
- TaskState is a SECONDARY authority for task-level (agent-level) state tracking
- For workflow-level state, use CanonicalWorkflowState
- TaskState is NOT a workflow state machine; it tracks individual agent execution
- Do not confuse TaskState (agent execution) with CanonicalWorkflowState (workflow lifecycle)

ARCHITECTURAL CLARIFICATION:
- CanonicalWorkflowState = User-facing workflow lifecycle (REQUESTED -> CERTIFIED)
- TaskState = Internal agent execution state (CREATED -> COMPLETED)
- A single workflow (CanonicalWorkflowState) may spawn multiple tasks (TaskState)
"""
```

### Critical Gap

**The clarification exists, but the wiring does not:**
- `WorkflowEngine.execute_step()` is called by task routes (`/tasks` endpoints)
- Task routes use `TaskState` for all state transitions
- **No code path executes `CanonicalWorkflowState` transitions**
- **No integration between TaskState task execution and CanonicalWorkflowState workflow lifecycle**

---

## Authority 3: AgentCoordinator

**Location:** `services/project-ai/app/orchestration/agent_coordinator.py`

### Execution Model

- **No State Machine:** Does not define workflow states or lifecycle
- **Pure Orchestration:** Coordinates agent execution in sequential, parallel, or DAG modes
- **Result-Based Flow:** Uses `AgentStatus` (SUCCESS, FAILED, BLOCKED, SKIPPED, RUNNING) to track execution
- **Context-Based:** Receives `AgentContext` with `workflow_state` dict but does not modify it

### Key Characteristics

- **Agent Execution:** Maps agent capability declarations to verification module functions
- **DAG Execution:** Implements topological sort with dependency resolution
- **Failure Handling:** Blocks dependent agents when critical agents fail
- **Evidence Collection:** Aggregates `evidence_ids` from agent results
- **No Approval Logic:** No human gates, no hash verification, no governance

### Agent Capability Mapping

```python
async def _execute_agent_capabilities(agent, context):
    if agent.agentId == "toolchain":
        from app.agents.toolchain import execute_toolchain
        return await execute_toolchain(context)
    elif agent.agentId == "brand_independence":
        await self._execute_brand_agent(agent, context, result)
    elif agent.agentId == "composer":
        await self._execute_composer_agent(agent, context, result)
    # ... 14 agent handlers total
```

### Relationship to Other Authorities

- **Used By:** `WorkflowEngine.execute_step()` calls `execute_sequential()`, `execute_parallel()`, `execute_dag()`
- **Independent of States:** Does not check `TaskState` or `CanonicalWorkflowState`
- **Context Pass-Through:** Receives `workflow_state` dict in context but treats it as opaque data
- **No Gate Enforcement:** Executes agents regardless of approval status

### Critical Gap

**AgentCoordinator is an execution engine adapter, not a state authority** — but it's disconnected from both workflow state machines. It executes agents without checking:
- Whether workflow is in correct state for agent execution
- Whether required approvals have been granted
- Whether previous workflow stages completed successfully

---

## Authority 4: GateController + Governance Routes

**Location:** `services/project-ai/app/orchestration/gate_controller.py`, `services/project-ai/app/api/routes/governance.py`

### Gate Definitions (8 Gates)

```
M2.1: Project Snapshot Foundation
M2.2: Strict Evidence Binding
M2.3: Toolchain Detection
M2.4: Composer Discovery
M2.5: Dependency Graph
M2.6: UBRC Verification
M2.7: Evidence Reconciliation
M2.8: FastAPI Project AI Foundation
```

### Key Characteristics

- **Milestone-Based:** Gates defined as M2.x milestones, not workflow states
- **Snapshot Validation:** Reads TypeScript snapshot to verify evidence kinds
- **No Approval Logic:** Gates check technical compliance, not human approval
- **No State Integration:** Does not reference `CanonicalWorkflowState` or `TaskState`

### Governance API Endpoints

```
POST /approvals/submit              - Submit manifest for approval
GET  /approvals/pending             - Get pending approvals
POST /approvals/{approval_id}/approve   - Approve manifest
POST /approvals/{approval_id}/reject    - Reject manifest
POST /governance/{approval_id}/approve  - Approve (alternate endpoint)
POST /governance/{approval_id}/reject   - Reject (alternate endpoint)
POST /governance/workflows/{workflow_id}/approve-placement - Approve/reject placement
```

### Approval Storage

```python
# In-memory stores (not persisted)
_approvals: Dict[str, Dict] = {}
_workflow_states: Dict[str, Dict] = {}
_implementation_approvals: Dict[str, ImplementationApproval] = {}
```

### Authorization Model

**ImplementationApproval model (referenced by `CanonicalWorkflowState`):**
- Candidate hash verification
- Manifest ID verification
- Manifest hash verification
- Self-approval detection
- Approval status tracking

### Critical Gap

**Governance routes exist but are disconnected from workflow execution:**
- Approval records stored in-memory but not checked by `WorkflowEngine`
- `can_transition_to_implementing()` in `CanonicalWorkflowState` checks `approvals_store`, but **no workflow execution code calls this function**
- Frontend can call approval endpoints, but approvals don't block or unblock workflow progression
- No integration with `TaskState` transitions in `/tasks` routes

---

## Authority 5: Frontend State Machine (ProjectLlmContext)

**Location:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx`

### State Model (15 Fields)

```typescript
interface ProjectLlmWorkflowState {
  currentStep: number;                    // 1-based step counter
  familyId: string;                       // e.g., "I"
  familyName: string;                     // e.g., "Introduction"
  targetVersion: string;                  // e.g., "I7"
  purpose: string;                        // User-entered purpose text
  existingVersions: string[];             // e.g., ["I1", "I2", "I3"]
  isNewVersion: boolean;                  // true if creating new version
  prototypeUploaded: boolean;             // GUI prototype uploaded?
  candidateUploaded: boolean;             // Candidate package uploaded?
  validationStarted: boolean;             // Validation started?
  validationCompleted: boolean;           // Validation completed?
  certificationCompleted: boolean;        // Certification completed?
}
```

### Key Characteristics

- **Client-Side Only:** Stored in `localStorage`, not synced with backend
- **Step-Based:** Uses numeric `currentStep` rather than named states
- **Boolean Flags:** Uses boolean flags for stage completion rather than state enum
- **No Gate States:** No explicit AWAITING_GATE_1, AWAITING_GATE_2 states
- **No Rejection State:** No failed/rejected/blocked states

### State Persistence

```typescript
// Persisted to localStorage as 'project_llm_workflow_state_v1'
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    setState((prev) => ({ ...prev, ...parsed }));
  }
}, []);
```

### Context API Methods

```typescript
interface ProjectLlmContextType {
  state: ProjectLlmWorkflowState;
  setState: React.Dispatch<React.SetStateAction<ProjectLlmWorkflowState>>;
  setFamily: (familyId, familyName, existingVersions) => void;
  setTargetVersion: (version) => void;
  setPurpose: (purpose) => void;
  setStep: (step) => void;
  resetWorkflow: () => void;
}
```

### UI Page Mapping

```
Step 1: /tools/project-llm/create              (Create Block)
Step 2: /tools/project-llm/compliance-brief    (Compliance Brief)
Step 3: /tools/project-llm/external-ai-handoff (External AI Handoff)
Step 4: /tools/project-llm/candidate-upload    (Candidate Upload)
Step 5: /tools/project-llm/integration-certification (Integration Certification)
```

### Relationship to Backend States

**No Integration:**
- Frontend does not call `/tasks` endpoints
- Frontend does not read `CanonicalWorkflowState` from backend
- Frontend does not call `/approvals` endpoints for gate approval
- Boolean flags (`prototypeUploaded`, `candidateUploaded`) are set by user interaction, not backend validation

### Critical Gap

**Frontend implements its own workflow state machine independent of backend:**
- User can progress through steps regardless of backend validation status
- User can mark stages complete (boolean flags) without backend certification
- No enforcement of gate approvals
- **Violates architectural rule:** "Frontend must consume these states; frontend must NOT create another state machine"

---

## Authority 6: Legacy Creation Routes (Deprecated but Present)

**Location:** `services/project-ai/app/api/routes/creation.py`

### Current Status

**All endpoints return 405 METHOD_NOT_ALLOWED:**
- `POST /creation/workflows` - Disabled
- `GET /creation/workflows/{workflow_id}` - Disabled
- `POST /creation/workflows/{workflow_id}/validate` - Disabled
- `POST /creation/workflows/{workflow_id}/certify` - Disabled

### Deprecation Notice

```python
"""
DEPRECATED (M2.9 Wave 0): Legacy workflow creation endpoint.

This endpoint bypassed canonical workflow lifecycle and is now disabled.

Use canonical workflow instead:
1. POST /tasks/plan - initiate workflow with repository discovery
2. Wait for AWAITING_GATE_1 state
3. Approve GUI prototype
4. POST /candidates/upload - upload candidate package
5. POST /governance/{approval_id}/approve - approve placement
6. Wait for CERTIFICATION_READY
7. POST /governance/{approval_id}/approve - final certification

Architectural Rule: All workflows follow CanonicalWorkflowState (17 states).
No workflow bypass via mode/composition shortcuts.
"""
```

### Legacy Models Still Present

**`app/models/creation.py`:**
- `WorkflowStatus` enum (CREATED, VALIDATING, CERTIFYING, CERTIFIED, FAILED) - marked SECONDARY AUTHORITY
- `CreationMode` - REMOVED (M2.9 Wave 0 / Agent B13)
- `DesignSource` enum (REPOSITORY_CANONICAL, EXTERNAL_AI_PROTOTYPE, USER_SPECIFICATION) - kept as content origin indicator
- `CertificationGateType`, `CertificationGateStatus`, `CertificationGate` - still used
- `CreationWorkflow` model - marked DEPRECATED

### Mapping to Canonical States

```python
"""
Mapping to CanonicalWorkflowState:
- CREATED -> REQUESTED
- VALIDATING -> CANDIDATE_AUDIT
- CERTIFYING -> CERTIFICATION_READY
- CERTIFIED -> CERTIFIED
- FAILED -> REJECTED
"""
```

### Critical Gap

**Models exist but are not wired to canonical workflow:**
- Mapping documented but not implemented in code
- `CertificationGate` model used by legacy workflow but not by `CanonicalWorkflowState`
- `DesignSource` exists but not referenced by `WorkflowEngine` or `CanonicalWorkflowState`

---

## Conflict and Overlap Analysis

### Conflict 1: State Name Collisions

**Same names, different meanings:**

| State Name | CanonicalWorkflowState | TaskState | WorkflowStatus (legacy) |
|------------|------------------------|-----------|-------------------------|
| CREATED | ❌ Not defined | ✅ Task created | ✅ Workflow created |
| DISCOVERY | ✅ Evidence gathering | ✅ Task analyzing | ❌ Not defined |
| VERIFYING | ✅ Runtime verification | ✅ Task verification | ❌ Not defined |
| IMPLEMENTING | ✅ File placement | ✅ Task implementation | ❌ Not defined |
| COMPLETED | ❌ Not defined | ✅ Task complete | ❌ Not defined |
| CERTIFIED | ✅ HAA approved (terminal) | ❌ Not defined | ✅ Gates passed |
| REJECTED | ✅ Human rejected (terminal) | ✅ Plan rejected | ❌ Not defined |
| FAILED | ❌ Not defined | ✅ Unrecoverable error | ✅ Gates failed |

**Implication:** Same state name means different things in different authorities. Code using `TaskState.IMPLEMENTING` is not the same as `CanonicalWorkflowState.IMPLEMENTING`.

### Conflict 2: Approval Gate Count

| Authority | Gate Count | Gate Types |
|-----------|------------|------------|
| CanonicalWorkflowState | 3 | AWAITING_GATE_1 (GUI approval), AWAITING_IMPLEMENTATION_APPROVAL (placement), AWAITING_GATE_2 (certification) |
| WorkflowEngine/TaskState | 1 | WAITING_FOR_APPROVAL (plan approval) |
| GateController | 8 | M2.1-M2.8 milestone gates |
| Frontend | 0 | No explicit gate states |

**Implication:** Different authorities expect different approval points. No agreement on which gates are required.

### Conflict 3: Transition Validation Logic

| Authority | Validation Approach | Enforced By |
|-----------|---------------------|-------------|
| CanonicalWorkflowState | Explicit `VALID_TRANSITIONS` dict | `is_valid_transition()` function |
| WorkflowEngine/TaskState | Implicit ordered steps | `can_transition()` checks step list |
| AgentCoordinator | No validation | Agent dependencies only |
| GateController | Milestone gates | `evaluate_gate()` on snapshot |
| Frontend | No validation | User can click any step |

**Implication:** No single source of truth for "Is this transition allowed?"

### Conflict 4: Approval Authorization Logic

| Authority | Authorization Checks |
|-----------|---------------------|
| CanonicalWorkflowState.can_transition_to_implementing() | ✅ Approval exists<br>✅ Status = APPROVED<br>✅ Candidate hash match<br>✅ Manifest ID match<br>✅ Manifest hash match<br>✅ Not self-approved |
| WorkflowEngine approve_task() | ✅ Task exists<br>✅ State = WAITING_FOR_APPROVAL<br>❌ No hash checks<br>❌ No self-approval check |
| Governance approve_manifest() | ✅ Approval exists<br>✅ Status = PENDING<br>✅ Manifest hash match<br>❌ No self-approval check<br>❌ Not integrated with workflow |
| Frontend | ❌ No checks (localStorage only) |

**Implication:** Authorization logic exists but is not consistently applied. Approval can be granted through one path while another path bypasses it.

---

## Where Does Approval/Governance Logic Actually Live?

### Analysis

**Approval Logic is Scattered:**

1. **ImplementationApproval Model** (`app/models/implementation_approval.py`)
   - Data model with hash verification methods
   - No workflow integration

2. **CanonicalWorkflowState.can_transition_to_implementing()** (`app/orchestration/canonical_workflow.py`)
   - Complete authorization logic (6 checks)
   - **Never called by workflow execution code**

3. **Governance Routes** (`app/api/routes/governance.py`)
   - HTTP endpoints for submit/approve/reject
   - Stores approvals in `_implementation_approvals` dict
   - **Not integrated with WorkflowEngine**

4. **Task Routes** (`app/api/routes/tasks.py`)
   - `POST /tasks/{task_id}/approve` endpoint
   - Simple state transition: WAITING_FOR_APPROVAL → IMPLEMENTING
   - **Does not call `can_transition_to_implementing()`**
   - **Does not check governance approvals**

### Code Path Analysis

**Current (Broken) Flow:**

```
User → POST /tasks/plan
  → TaskRoute creates task with TaskState.CREATED
  → WorkflowEngine.execute_step() called
  → AgentCoordinator runs agents
  → Task state: CREATED → DISCOVERY → PLANNING → WAITING_FOR_APPROVAL

User → POST /tasks/{task_id}/approve
  → TaskRoute checks: state == WAITING_FOR_APPROVAL?
  → If yes: task.state = IMPLEMENTING
  → WorkflowEngine.execute_step() called
  → AgentCoordinator runs implementation agents

PROBLEM: No candidate hash check, no manifest approval, no self-approval check
```

**Intended (Not Wired) Flow:**

```
User → POST /tasks/plan (should be different endpoint)
  → CanonicalWorkflow state: REQUESTED

Backend → Execute discovery agents
  → CanonicalWorkflow state: REQUESTED → DISCOVERY → BRIEF_READY → AWAITING_GATE_1

User → POST /approvals/submit (manifest_id, hash)
  → Governance creates approval record
  → Status: PENDING

User → POST /approvals/{approval_id}/approve
  → Governance checks hash, updates status to APPROVED
  → CanonicalWorkflow state: AWAITING_GATE_1 → GUI_APPROVED → ... → AWAITING_IMPLEMENTATION_APPROVAL

Backend → Check CanonicalWorkflowState.can_transition_to_implementing()
  → Verify approval exists, hashes match, not self-approved
  → If authorized: CanonicalWorkflow state: IMPLEMENTING
  → Execute placement agents

PROBLEM: This code path does not exist
```

### Governance Integration Gap

**Governance routes exist but are not consumed by workflow execution:**

| Governance Endpoint | Integration Status |
|---------------------|-------------------|
| POST /approvals/submit | ❌ Not called by workflow |
| GET /approvals/pending | ❌ Not called by workflow |
| POST /approvals/{id}/approve | ❌ Does not trigger workflow transition |
| POST /governance/workflows/{id}/approve-placement | ❌ Not integrated with WorkflowEngine |

**Result:** Governance API is a separate system that tracks approvals but does not enforce them in workflow execution.

---

## Which Authorities are Adapters vs. Independent State Machines?

### Independent State Machines (Define Lifecycle)

1. **CanonicalWorkflowState** (17 states)
   - **Status:** Declared canonical, not wired
   - **Defines:** Complete workflow lifecycle from REQUESTED → CERTIFIED
   - **Characteristics:** Explicit transition validation, gate states, terminal states

2. **TaskState** (11 states)
   - **Status:** Active but secondary
   - **Defines:** Agent execution lifecycle from CREATED → COMPLETED
   - **Characteristics:** Used by WorkflowEngine, task routes consume it
   - **Clarification:** Docstring says it's agent-level, not workflow-level — but it's being used as workflow-level

3. **Frontend ProjectLlmWorkflowState** (15 fields)
   - **Status:** Active, independent
   - **Defines:** Client-side workflow progression (step-based)
   - **Characteristics:** Persisted to localStorage, not synced with backend

### Adapters (Orchestration/Execution Only)

4. **AgentCoordinator**
   - **Status:** Pure orchestration adapter
   - **Defines:** Agent execution order (sequential, parallel, DAG)
   - **Characteristics:** No state machine, no approval logic, context pass-through

5. **GateController**
   - **Status:** Validation adapter
   - **Defines:** Milestone gates for snapshot validation
   - **Characteristics:** Technical compliance checks, not workflow state

6. **Governance Routes**
   - **Status:** Approval storage adapter
   - **Defines:** Approval record CRUD operations
   - **Characteristics:** Stores approvals but does not enforce them in workflow

### Legacy/Deprecated (Should Be Removed)

7. **WorkflowStatus** (5 states)
   - **Status:** Deprecated, disabled
   - **Defines:** Legacy workflow states (CREATED → CERTIFIED)
   - **Characteristics:** Creation routes return 405, models still present

---

## Root Cause Summary

### The Problem

**Multiple-authority failure** identified in the original audit is confirmed:

1. **CanonicalWorkflowState exists and is well-designed** — it has explicit transitions, gate enforcement, authorization logic, and terminal states
2. **WorkflowEngine/TaskState is actively used** — task routes create tasks, execute steps, and transition states using TaskState
3. **The two are not connected** — no code path uses CanonicalWorkflowState for workflow execution
4. **Frontend built its own state machine** — violates architectural rule that frontend must consume backend states
5. **Governance approval logic exists but is not enforced** — approval endpoints work, but workflow execution doesn't check them
6. **AgentCoordinator executes agents without authorization checks** — runs agents regardless of approval status

### The Wiring Gaps

**6 Critical Wiring Gaps:**

1. **Gap 1: No execution code uses CanonicalWorkflowState**
   - `WorkflowEngine` uses `TaskState`
   - Task routes (`/tasks`) use `TaskState`
   - No code path progresses `CanonicalWorkflowState` transitions

2. **Gap 2: can_transition_to_implementing() is never called**
   - Function exists in `canonical_workflow.py` with complete authorization logic
   - `TaskRoute.approve_task()` does not call it
   - `WorkflowEngine.execute_step()` does not call it

3. **Gap 3: Governance approvals not checked by workflow execution**
   - `_implementation_approvals` dict populated by governance routes
   - `WorkflowEngine` does not check `_implementation_approvals` before executing
   - Approval can be granted but does not unblock workflow

4. **Gap 4: Frontend does not read backend state**
   - `ProjectLlmContext` manages state in localStorage
   - No API calls to read `CanonicalWorkflowState` from backend
   - User can progress through UI steps regardless of backend validation

5. **Gap 5: TaskState and CanonicalWorkflowState not mapped**
   - Docstring says TaskState is agent-level, CanonicalWorkflowState is workflow-level
   - No code implements the mapping
   - Example: TaskState.IMPLEMENTING does not correspond to CanonicalWorkflowState.IMPLEMENTING

6. **Gap 6: Agent execution not gated by workflow state**
   - `AgentCoordinator.execute_agent()` does not check current workflow state
   - Agents can execute even if workflow is in wrong state or lacks approvals

---

## Architectural Reconciliation Requirements

### What Must Happen (Wave 0 / Agent B01 Goals)

**1. Establish CanonicalWorkflowState as Single Authority**
   - Retire `TaskState` as workflow state (keep only as agent execution tracking if needed)
   - Remove frontend independent state machine
   - Map legacy `WorkflowStatus` to `CanonicalWorkflowState` and deprecate

**2. Wire Workflow Execution to CanonicalWorkflowState**
   - Replace task routes (`/tasks`) with canonical workflow routes
   - `WorkflowEngine` must progress `CanonicalWorkflowState` transitions, not `TaskState`
   - All state transitions must call validation functions (`is_valid_transition`, `can_transition_to_implementing`)

**3. Integrate Governance Authorization**
   - Workflow execution must call `can_transition_to_implementing()` before IMPLEMENTING state
   - Approval checks must gate agent execution
   - Self-approval detection must be enforced

**4. Connect Frontend to Backend State**
   - Frontend must call backend API to read current `CanonicalWorkflowState`
   - Frontend must display gate states (AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2)
   - Frontend must call governance approval endpoints for gate progression

**5. Agent Execution Authorization**
   - `AgentCoordinator` must receive and validate workflow state before executing agents
   - Critical agents must not execute if workflow lacks required approvals

**6. Clean Up Legacy Authorities**
   - Remove deprecated `creation.py` models (WorkflowStatus, CreationWorkflow)
   - Remove or archive disabled creation routes
   - Document that `TaskState` is internal agent execution tracking only

---

## Recommended Wave 0 Actions

### Immediate (B01 - Architecture Authority Agent)

1. **Freeze lifecycle specification**
   - CanonicalWorkflowState (17 states) is the canonical specification
   - All other authorities must map to or be removed

2. **Document authority hierarchy**
   ```
   CanonicalWorkflowState (workflow lifecycle)
     ├── WorkflowEngine (executes transitions)
     ├── Governance (gates transitions via approvals)
     ├── AgentCoordinator (executes agents within transitions)
     └── GateController (validates technical compliance)
   
   Frontend (UI) consumes CanonicalWorkflowState, does not define states
   TaskState retired as workflow authority (can remain as agent-level tracking)
   ```

3. **Create state transition enforcement plan**
   - Identify all code that transitions workflow state
   - Add `CanonicalWorkflowState` transition validation to each path
   - Wire `can_transition_to_implementing()` authorization check

4. **Create frontend integration plan**
   - Define backend API endpoint: `GET /workflows/{workflow_id}`
   - Define state-to-UI-step mapping
   - Remove localStorage state persistence

5. **Remove legacy authorities**
   - Delete disabled creation routes
   - Remove `WorkflowStatus` enum
   - Archive `CreationWorkflow` model

---

## Appendix: State Machine Comparison Table

| Feature | CanonicalWorkflowState | TaskState | Frontend Context | WorkflowStatus (legacy) |
|---------|------------------------|-----------|------------------|------------------------|
| **State Count** | 17 | 11 | 15 fields (step-based) | 5 |
| **Actively Used** | ❌ No | ✅ Yes | ✅ Yes | ❌ Disabled |
| **Transition Validation** | ✅ Explicit dict | ✅ Step-based | ❌ None | ❌ None |
| **Gate States** | 3 (AWAITING_GATE_1/2, AWAITING_IMPLEMENTATION_APPROVAL) | 1 (WAITING_FOR_APPROVAL) | 0 | 0 |
| **Terminal States** | 2 (CERTIFIED, REJECTED) | 3 (COMPLETED, FAILED, REJECTED) | 0 | 2 (CERTIFIED, FAILED) |
| **Approval Authorization** | ✅ 6 checks (can_transition_to_implementing) | ❌ None | ❌ None | ❌ None |
| **Agent Execution** | ❌ Not wired | ✅ WorkflowEngine | ❌ N/A | ❌ Disabled |
| **Frontend Display** | ❌ Not consumed | ❌ Not consumed | ✅ localStorage | ❌ Not consumed |
| **Governance Integration** | ✅ Designed but not wired | ❌ None | ❌ None | ❌ Disabled |
| **Snapshot Integration** | ❌ No | ✅ Via WorkflowEngine | ❌ No | ❌ No |

---

## Conclusion

The repository contains a **well-designed canonical workflow authority** (`CanonicalWorkflowState`) but it is **not wired to execution, approval, or frontend systems**. The active workflow execution uses `TaskState` through `WorkflowEngine`, which lacks authorization gates, hash verification, and self-approval detection.

**The main problem is wiring and authority reconciliation, not architectural design.** Wave 0 / Agent B01 must:
1. Establish `CanonicalWorkflowState` as single authority
2. Wire workflow execution to use it
3. Integrate governance approval checks
4. Connect frontend to backend state
5. Remove competing authorities

**Next Steps:** Wave 0 agent execution (B01-B14) should implement the wiring plan outlined above.
