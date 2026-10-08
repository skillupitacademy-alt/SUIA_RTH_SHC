# Technical Design: Canonical Project LLM Workflow Authority

**Wave:** M2.9 Wave 0 / Agent B01  
**Branch:** m2-project-ai-canonical-wiring  
**Design Date:** 2026-01-08  
**Author:** Architecture Authority Agent

---

## Overview

This design establishes `CanonicalWorkflowState` as the single source of truth for Project LLM workflow lifecycle, resolving the multiple-authority conflict identified in the audit. The architecture creates a clear hierarchy: `CanonicalWorkflowState` defines the lifecycle, `WorkflowGovernanceService` enforces state transitions and authorization gates, and existing components (`WorkflowEngine`, `AgentCoordinator`, `GateController`) become execution adapters that operate within canonical state boundaries.

The design preserves all existing authorization logic from `canonical_workflow.py` and `ImplementationApproval`, wires it into workflow execution paths, and migrates frontend from independent state management to backend state consumption. The result is a single, auditable workflow state machine with hash-bound approvals, self-approval prevention, and terminal state enforcement.

---

## 1. Data Models and Schemas

### 1.1 ProjectLLMWorkflow Model

**Location:** `services/project-ai/app/models/workflow.py` (NEW FILE)

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.orchestration.canonical_workflow import CanonicalWorkflowState

@dataclass
class StateTransition:
    """Record of a single state transition with evidence."""
    from_state: CanonicalWorkflowState
    to_state: CanonicalWorkflowState
    timestamp: datetime
    triggered_by: str  # User ID or system component
    evidence_id: Optional[str] = None
    reason: Optional[str] = None

@dataclass
class ProjectLLMWorkflow:
    """
    Canonical workflow model for Project LLM M2.9.
    
    Single source of truth for workflow lifecycle state, approval gates,
    and artifact bindings.
    """
    # Identity
    workflow_id: str
    specification_id: str  # Block family + version (e.g., "I7")
    
    # Target binding
    target_family: str  # e.g., "Introduction"
    target_version: str  # e.g., "I7"
    requester_id: str  # For self-approval prevention
    
    # Lifecycle state
    current_state: CanonicalWorkflowState
    state_history: List[StateTransition] = field(default_factory=list)
    
    # Artifact bindings (hash-bound for security)
    contract_id: Optional[str] = None
    contract_sha256: Optional[str] = None
    
    candidate_id: Optional[str] = None
    candidate_sha256: Optional[str] = None
    
    manifest_id: Optional[str] = None
    manifest_sha256: Optional[str] = None
    
    # Approval tracking
    approval_id: Optional[str] = None  # ImplementationApproval ID
    gate_results: Dict[str, Any] = field(default_factory=dict)
    
    # Evidence
    evidence_ids: List[str] = field(default_factory=list)
    snapshot_id: Optional[str] = None
    snapshot_sha256: Optional[str] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    final_status: Optional[str] = None  # "CERTIFIED" or "REJECTED" when terminal
    
    def is_terminal(self) -> bool:
        """Check if workflow is in terminal state."""
        from app.orchestration.canonical_workflow import is_terminal_state
        return is_terminal_state(self.current_state)
    
    def requires_approval(self) -> bool:
        """Check if current state requires human approval."""
        from app.orchestration.canonical_workflow import is_gate_state
        return is_gate_state(self.current_state)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "workflow_id": self.workflow_id,
            "specification_id": self.specification_id,
            "target": {
                "family": self.target_family,
                "version": self.target_version
            },
            "requester_id": self.requester_id,
            "state": {
                "current": self.current_state.value,
                "is_terminal": self.is_terminal(),
                "requires_approval": self.requires_approval()
            },
            "artifacts": {
                "contract": {"id": self.contract_id, "sha256": self.contract_sha256},
                "candidate": {"id": self.candidate_id, "sha256": self.candidate_sha256},
                "manifest": {"id": self.manifest_id, "sha256": self.manifest_sha256},
                "snapshot": {"id": self.snapshot_id, "sha256": self.snapshot_sha256}
            },
            "approval_id": self.approval_id,
            "gate_results": self.gate_results,
            "evidence_ids": self.evidence_ids,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "final_status": self.final_status
        }
```

### 1.2 Workflow Response Schema

**Location:** `services/project-ai/app/api/schemas/workflow.py` (NEW FILE)

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, List, Optional, Any

class WorkflowArtifact(BaseModel):
    id: Optional[str] = None
    sha256: Optional[str] = None

class WorkflowStateInfo(BaseModel):
    current: str = Field(description="Current CanonicalWorkflowState value")
    is_terminal: bool = Field(description="Is workflow in terminal state?")
    requires_approval: bool = Field(description="Does current state require approval?")

class WorkflowTarget(BaseModel):
    family: str = Field(description="Block family (e.g., 'Introduction')")
    version: str = Field(description="Target version (e.g., 'I7')")

class WorkflowArtifacts(BaseModel):
    contract: WorkflowArtifact
    candidate: WorkflowArtifact
    manifest: WorkflowArtifact
    snapshot: WorkflowArtifact

class WorkflowResponse(BaseModel):
    workflow_id: str
    specification_id: str
    target: WorkflowTarget
    requester_id: str
    state: WorkflowStateInfo
    artifacts: WorkflowArtifacts
    approval_id: Optional[str] = None
    gate_results: Dict[str, Any] = {}
    evidence_ids: List[str] = []
    created_at: str
    updated_at: str
    final_status: Optional[str] = None

class CreateWorkflowRequest(BaseModel):
    target_family: str = Field(min_length=1, description="Block family")
    target_version: str = Field(min_length=1, description="Target version")
    requester_id: str = Field(min_length=1, description="Workflow requester")
    purpose: Optional[str] = None

class TransitionRequest(BaseModel):
    to_state: str = Field(min_length=1, description="Target CanonicalWorkflowState")
    triggered_by: str = Field(min_length=1, description="User or system component")
    evidence_id: Optional[str] = None
    reason: Optional[str] = None
```

---

## 2. Workflow Governance Service

**Location:** `services/project-ai/app/orchestration/workflow_governance.py` (NEW FILE)

This service is the **single point of authority** for workflow state transitions. All state mutations must flow through this service.

### 2.1 Core Service Interface

```python
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
from uuid import uuid4

from app.models.workflow import ProjectLLMWorkflow, StateTransition
from app.orchestration.canonical_workflow import (
    CanonicalWorkflowState,
    is_valid_transition,
    is_terminal_state,
    is_gate_state,
    can_transition_to_implementing
)
from app.models.implementation_approval import ImplementationApproval

class WorkflowGovernanceService:
    """
    Governance service for canonical workflow state management.
    
    RESPONSIBILITIES:
    - Create workflows in REQUESTED state
    - Validate and execute state transitions
    - Enforce authorization gates
    - Prevent mutation of terminal states
    - Track state history
    
    SECURITY BOUNDARIES:
    - No transitions after terminal state reached
    - Hash verification for IMPLEMENTING transition
    - Self-approval prevention
    - Evidence required for gate transitions
    """
    
    def __init__(self):
        # In-memory storage for M2.9 (Wave 1+ will add persistence)
        self._workflows: Dict[str, ProjectLLMWorkflow] = {}
        self._approvals: Dict[str, ImplementationApproval] = {}
    
    def create_workflow(
        self,
        target_family: str,
        target_version: str,
        requester_id: str,
        purpose: Optional[str] = None
    ) -> ProjectLLMWorkflow:
        """
        Create a new workflow in REQUESTED state.
        
        Args:
            target_family: Block family (e.g., "Introduction")
            target_version: Target version (e.g., "I7")
            requester_id: User creating the workflow
            purpose: Optional purpose description
            
        Returns:
            New workflow in REQUESTED state
        """
        workflow_id = str(uuid4())
        specification_id = f"{target_family[0]}{target_version}"  # e.g., "I7"
        now = datetime.now(timezone.utc)
        
        initial_transition = StateTransition(
            from_state=None,  # No prior state
            to_state=CanonicalWorkflowState.REQUESTED,
            timestamp=now,
            triggered_by="system",
            reason="Workflow created"
        )
        
        workflow = ProjectLLMWorkflow(
            workflow_id=workflow_id,
            specification_id=specification_id,
            target_family=target_family,
            target_version=target_version,
            requester_id=requester_id,
            current_state=CanonicalWorkflowState.REQUESTED,
            state_history=[initial_transition],
            created_at=now,
            updated_at=now
        )
        
        if purpose:
            workflow.gate_results["purpose"] = purpose
        
        self._workflows[workflow_id] = workflow
        return workflow
    
    def get_workflow(self, workflow_id: str) -> Optional[ProjectLLMWorkflow]:
        """Get workflow by ID."""
        return self._workflows.get(workflow_id)
    
    def validate_transition(
        self,
        workflow_id: str,
        to_state: CanonicalWorkflowState
    ) -> Tuple[bool, str]:
        """
        Validate if a state transition is allowed.
        
        Args:
            workflow_id: Workflow to transition
            to_state: Target state
            
        Returns:
            Tuple of (is_valid, reason)
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return (False, f"Workflow not found: {workflow_id}")
        
        # Check if terminal state reached
        if workflow.is_terminal():
            return (False, f"Workflow is in terminal state {workflow.current_state.value}")
        
        # Check if transition is valid per state machine
        if not is_valid_transition(workflow.current_state, to_state):
            return (False, f"Invalid transition: {workflow.current_state.value} -> {to_state.value}")
        
        return (True, "")
    
    def transition_state(
        self,
        workflow_id: str,
        to_state: CanonicalWorkflowState,
        triggered_by: str,
        evidence_id: Optional[str] = None,
        reason: Optional[str] = None
    ) -> ProjectLLMWorkflow:
        """
        Execute a state transition with validation.
        
        Args:
            workflow_id: Workflow to transition
            to_state: Target state
            triggered_by: User or system component
            evidence_id: Optional evidence ID for audit trail
            reason: Optional reason for transition
            
        Returns:
            Updated workflow
            
        Raises:
            ValueError: If transition is invalid or unauthorized
        """
        # Validate transition
        is_valid, validation_reason = self.validate_transition(workflow_id, to_state)
        if not is_valid:
            raise ValueError(validation_reason)
        
        workflow = self._workflows[workflow_id]
        
        # Special authorization for IMPLEMENTING transition
        if to_state == CanonicalWorkflowState.IMPLEMENTING:
            can_implement, auth_reason = can_transition_to_implementing(
                workflow_id=workflow_id,
                approvals_store=self._approvals,
                requester_id=workflow.requester_id,
                candidate_sha256=workflow.candidate_sha256 or "",
                manifest_id=workflow.manifest_id or "",
                manifest_sha256=workflow.manifest_sha256 or ""
            )
            if not can_implement:
                raise ValueError(f"Authorization failed: {auth_reason}")
        
        # Execute transition
        now = datetime.now(timezone.utc)
        transition = StateTransition(
            from_state=workflow.current_state,
            to_state=to_state,
            timestamp=now,
            triggered_by=triggered_by,
            evidence_id=evidence_id,
            reason=reason
        )
        
        workflow.current_state = to_state
        workflow.state_history.append(transition)
        workflow.updated_at = now
        
        # Set final status for terminal states
        if is_terminal_state(to_state):
            workflow.final_status = to_state.value
        
        return workflow
    
    def register_approval(
        self,
        workflow_id: str,
        approval: ImplementationApproval
    ) -> None:
        """
        Register an implementation approval for workflow.
        
        Args:
            workflow_id: Workflow ID
            approval: ImplementationApproval record
        """
        self._approvals[workflow_id] = approval
        
        workflow = self._workflows.get(workflow_id)
        if workflow:
            workflow.approval_id = approval.approval_id
    
    def bind_artifact(
        self,
        workflow_id: str,
        artifact_type: str,
        artifact_id: str,
        artifact_sha256: str
    ) -> None:
        """
        Bind an artifact to workflow with hash.
        
        Args:
            workflow_id: Workflow ID
            artifact_type: "contract", "candidate", "manifest", or "snapshot"
            artifact_id: Artifact identifier
            artifact_sha256: SHA-256 hash of artifact
            
        Raises:
            ValueError: If workflow not found or artifact type invalid
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        if artifact_type == "contract":
            workflow.contract_id = artifact_id
            workflow.contract_sha256 = artifact_sha256
        elif artifact_type == "candidate":
            workflow.candidate_id = artifact_id
            workflow.candidate_sha256 = artifact_sha256
        elif artifact_type == "manifest":
            workflow.manifest_id = artifact_id
            workflow.manifest_sha256 = artifact_sha256
        elif artifact_type == "snapshot":
            workflow.snapshot_id = artifact_id
            workflow.snapshot_sha256 = artifact_sha256
        else:
            raise ValueError(f"Invalid artifact type: {artifact_type}")
        
        workflow.updated_at = datetime.now(timezone.utc)
```

---

## 3. State Transition Rules and Validation

### 3.1 Transition Validation Logic

All state transitions follow these rules:

1. **Valid Transition Check:** Transition must exist in `VALID_TRANSITIONS` dict
2. **Terminal State Check:** No transitions allowed from CERTIFIED or REJECTED
3. **Authorization Gates:** IMPLEMENTING transition requires full authorization checks
4. **Evidence Binding:** Gate transitions should attach evidence_id for audit trail

### 3.2 Authorization Gates for IMPLEMENTING Transition

When transitioning to `IMPLEMENTING` state, the system enforces 6 authorization gates:

```
GATE 1: ImplementationApproval must exist for workflow_id
GATE 2: Approval status must be APPROVED (not PENDING or REJECTED)
GATE 3: Candidate hash must match approval record
GATE 4: Manifest ID must match approval record
GATE 5: Manifest hash must match approval record
GATE 6: Approver must NOT be workflow requester (self-approval prevention)
```

These gates are implemented in `canonical_workflow.can_transition_to_implementing()` and enforced by `WorkflowGovernanceService.transition_state()`.

### 3.3 State Transition Diagram

```
REQUESTED
    ↓ (discovery agents complete)
DISCOVERY
    ↓ (contract generated)
BRIEF_READY
    ↓ (user views contract)
AWAITING_GATE_1 ─────→ REJECTED (user rejects GUI)
    ↓ (user approves GUI)
GUI_APPROVED
    ↓ (external AI notified)
CANDIDATE_REQUESTED
    ↓ (user uploads candidate)
CANDIDATE_RECEIVED
    ↓ (intake processing starts)
CANDIDATE_AUDIT ──────→ REJECTED (gates fail)
    ↓ (gates pass)
INTEGRATION_PLANNED
    ↓ (manifest generated)
AWAITING_IMPLEMENTATION_APPROVAL ─────→ REJECTED (user rejects placement)
    ↓ (user approves placement + authorization gates pass)
IMPLEMENTING ─────────→ REJECTED (placement fails)
    ↓ (files written)
IMPLEMENTED
    ↓ (verification starts)
VERIFYING ────────────→ REJECTED (verification fails)
    ↓ (verification passes)
CERTIFICATION_READY
    ↓ (user reviews evidence)
AWAITING_GATE_2 ──────→ REJECTED (user rejects certification)
    ↓ (user approves certification)
CERTIFIED (terminal)

REJECTED (terminal)
```

---

## 4. API Contracts

### 4.1 New Workflow Endpoints

**Location:** `services/project-ai/app/api/routes/workflows.py` (NEW FILE)

These endpoints replace `/tasks` endpoints for workflow-level operations:

```python
POST   /workflows                           # Create workflow (REQUESTED state)
GET    /workflows/{workflow_id}             # Get workflow state
POST   /workflows/{workflow_id}/transition  # Transition state (internal use)
GET    /workflows/{workflow_id}/history     # Get state transition history
POST   /workflows/{workflow_id}/artifacts   # Bind artifact to workflow
```

#### 4.1.1 Create Workflow

```http
POST /workflows
Content-Type: application/json

{
  "target_family": "Introduction",
  "target_version": "I7",
  "requester_id": "user_123",
  "purpose": "Create enhanced intro block with real-world context"
}

Response 201:
{
  "workflow_id": "wf_abc123",
  "specification_id": "I7",
  "target": {
    "family": "Introduction",
    "version": "I7"
  },
  "requester_id": "user_123",
  "state": {
    "current": "REQUESTED",
    "is_terminal": false,
    "requires_approval": false
  },
  "artifacts": {
    "contract": {"id": null, "sha256": null},
    "candidate": {"id": null, "sha256": null},
    "manifest": {"id": null, "sha256": null},
    "snapshot": {"id": null, "sha256": null}
  },
  "approval_id": null,
  "gate_results": {
    "purpose": "Create enhanced intro block with real-world context"
  },
  "evidence_ids": [],
  "created_at": "2026-01-08T10:30:00Z",
  "updated_at": "2026-01-08T10:30:00Z",
  "final_status": null
}
```

#### 4.1.2 Get Workflow State

```http
GET /workflows/{workflow_id}

Response 200:
{
  "workflow_id": "wf_abc123",
  "state": {
    "current": "AWAITING_GATE_1",
    "is_terminal": false,
    "requires_approval": true
  },
  ...
}
```

#### 4.1.3 Bind Artifact

```http
POST /workflows/{workflow_id}/artifacts
Content-Type: application/json

{
  "artifact_type": "candidate",
  "artifact_id": "cand_xyz789",
  "artifact_sha256": "a3b5c7d9..."
}

Response 200:
{
  "workflow_id": "wf_abc123",
  "artifacts": {
    "candidate": {
      "id": "cand_xyz789",
      "sha256": "a3b5c7d9..."
    }
  }
}
```

### 4.2 Modified Governance Endpoints

**Location:** `services/project-ai/app/api/routes/governance.py` (MODIFY EXISTING)

Governance endpoints will be updated to use `WorkflowGovernanceService`:

```python
# Updated approve-placement endpoint:
@router.post("/workflows/{workflow_id}/approve-placement")
async def approve_placement(workflow_id: str, payload: WorkflowApprovalPayload):
    """
    Approve or reject placement manifest.
    
    CHANGES:
    - Reads workflow from WorkflowGovernanceService instead of _workflow_states dict
    - Calls governance_service.transition_state() for state changes
    - Uses governance_service.register_approval() for approval binding
    """
    # Get workflow from governance service
    workflow = governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    
    # Verify workflow is in AWAITING_IMPLEMENTATION_APPROVAL
    if workflow.current_state != CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL:
        raise HTTPException(409, "Wrong state")
    
    # Verify hashes match workflow artifacts
    if payload.manifest_hash != workflow.manifest_sha256:
        raise HTTPException(409, "Manifest hash mismatch")
    
    # Prevent self-approval
    if payload.approved_by == workflow.requester_id:
        raise HTTPException(403, "Self-approval rejected")
    
    # Create approval record
    approval = create_implementation_approval(...)
    governance_service.register_approval(workflow_id, approval)
    
    if payload.approved:
        # Transition to IMPLEMENTING
        governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by=payload.approved_by,
            reason=payload.reason
        )
    else:
        # Transition to REJECTED
        governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.REJECTED,
            triggered_by=payload.approved_by,
            reason=payload.reason
        )
    
    return WorkflowApprovalResponse(...)
```

---

## 5. Migration Strategy for Existing Workflows

### 5.1 TaskState → CanonicalWorkflowState Mapping

`TaskState` will remain as **internal agent execution tracking** but will not be used for workflow-level state. The mapping clarifies the relationship:

| TaskState | Usage | CanonicalWorkflowState Equivalent |
|-----------|-------|-----------------------------------|
| CREATED | Agent execution started | (internal only) |
| DISCOVERY | Agent analyzing evidence | DISCOVERY |
| PLANNING | Agent creating plan | BRIEF_READY |
| WAITING_FOR_APPROVAL | Agent awaiting decision | AWAITING_GATE_1 or AWAITING_IMPLEMENTATION_APPROVAL |
| IMPLEMENTING | Agent executing placement | IMPLEMENTING |
| TESTING | Agent running tests | CANDIDATE_AUDIT |
| VERIFYING | Agent running verification | VERIFYING |
| COMPLETED | Agent finished | (internal only) |
| FAILED | Agent encountered error | REJECTED |
| BLOCKED | Agent blocked by dependency | (internal only) |
| REJECTED | Agent plan rejected | REJECTED |

### 5.2 WorkflowEngine Integration

**Location:** `services/project-ai/app/orchestration/workflow_engine.py` (MODIFY EXISTING)

The `WorkflowEngine` will be updated to:
1. Accept `workflow_id` parameter
2. Read current `CanonicalWorkflowState` from `WorkflowGovernanceService`
3. Execute agents based on canonical state
4. Call `governance_service.transition_state()` after agent completion

```python
class WorkflowEngine:
    def __init__(
        self,
        agent_registry: Optional[AgentRegistry] = None,
        agent_coordinator: Optional[AgentCoordinator] = None,
        governance_service: Optional[WorkflowGovernanceService] = None
    ):
        self.agent_registry = agent_registry or AgentRegistry()
        self.agent_coordinator = agent_coordinator or AgentCoordinator(self.agent_registry)
        self.governance_service = governance_service or WorkflowGovernanceService()
    
    async def execute_workflow_stage(
        self,
        workflow_id: str,
        snapshot: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute agents for current workflow stage.
        
        Args:
            workflow_id: Workflow identifier
            snapshot: Repository snapshot
            
        Returns:
            Execution results
        """
        # Get current workflow state
        workflow = self.governance_service.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        current_state = workflow.current_state
        
        # Map canonical state to agent execution
        if current_state == CanonicalWorkflowState.REQUESTED:
            # Execute discovery agents
            agents = [
                self.agent_registry.get_agent(AgentType.REPOSITORY_AUDITOR),
                self.agent_registry.get_agent(AgentType.TOOLCHAIN),
                self.agent_registry.get_agent(AgentType.COMPOSER),
                self.agent_registry.get_agent(AgentType.DEPENDENCY)
            ]
            
            context = AgentContext(
                task_id=workflow_id,
                workflow_state=workflow.to_dict(),
                repository_snapshot=snapshot,
                evidence_graph={},
                approved_scope=[],
                prior_agent_outputs={},
                repository_root=Path.cwd()
            )
            
            results = await self.agent_coordinator.execute_sequential(agents, context)
            
            # If successful, transition to DISCOVERY
            if all(r.passed for r in results):
                self.governance_service.transition_state(
                    workflow_id=workflow_id,
                    to_state=CanonicalWorkflowState.DISCOVERY,
                    triggered_by="system",
                    reason="Discovery agents completed"
                )
        
        elif current_state == CanonicalWorkflowState.DISCOVERY:
            # Execute contract generation
            # ... then transition to BRIEF_READY
            self.governance_service.transition_state(
                workflow_id=workflow_id,
                to_state=CanonicalWorkflowState.BRIEF_READY,
                triggered_by="system",
                reason="Engineering contract generated"
            )
        
        # ... additional state mappings
        
        return {"workflow_id": workflow_id, "state": workflow.current_state.value}
```

### 5.3 Task Routes Deprecation Plan

**Location:** `services/project-ai/app/api/routes/tasks.py` (DEPRECATE)

1. **Immediate (Wave 0):** Add deprecation warnings to all `/tasks` endpoints
2. **Wave 1:** Update task endpoints to internally call workflow endpoints
3. **Wave 2+:** Return 405 METHOD_NOT_ALLOWED and redirect to `/workflows`

```python
@router.post("/plan", response_model=TaskResponse, deprecated=True)
async def create_planning_task(request: TaskCreateRequest):
    """
    DEPRECATED (M2.9 Wave 0): Use POST /workflows instead.
    
    This endpoint will be removed in future versions.
    Migration path: POST /workflows with target_family, target_version, requester_id.
    """
    # Temporary: create workflow internally
    workflow = governance_service.create_workflow(
        target_family=request.context.get("family", "Unknown"),
        target_version=request.context.get("version", ""),
        requester_id=request.context.get("user_id", "anonymous"),
        purpose=request.description
    )
    
    # Return task-shaped response for compatibility
    return TaskResponse(
        task_id=workflow.workflow_id,
        state=TaskState.CREATED,  # Map canonical state
        description=request.description,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        context=workflow.to_dict(),
        error=None
    )
```

### 5.4 Frontend Migration

**Location:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx` (MODIFY EXISTING)

The frontend will be updated to:
1. Remove `localStorage` state management
2. Fetch workflow state from backend `/workflows/{workflow_id}` API
3. Use `current_state` from backend instead of step numbers
4. Display gate states explicitly

```typescript
// NEW: API client for workflow state
async function fetchWorkflowState(workflowId: string): Promise<WorkflowResponse> {
  const response = await fetch(`/api/project-ai/workflows/${workflowId}`);
  if (!response.ok) throw new Error('Failed to fetch workflow');
  return response.json();
}

// NEW: Backend-driven workflow state
interface ProjectLlmWorkflowState {
  workflowId: string;
  backendState: string; // CanonicalWorkflowState value
  target: {
    family: string;
    version: string;
  };
  isTerminal: boolean;
  requiresApproval: boolean;
  artifacts: {
    contract?: { id: string; sha256: string };
    candidate?: { id: string; sha256: string };
    manifest?: { id: string; sha256: string };
  };
}

// Map backend state to UI step for display
function getStepFromBackendState(state: string): number {
  const stateToStep: Record<string, number> = {
    'REQUESTED': 1,
    'DISCOVERY': 1,
    'BRIEF_READY': 2,
    'AWAITING_GATE_1': 2,
    'GUI_APPROVED': 3,
    'CANDIDATE_REQUESTED': 3,
    'CANDIDATE_RECEIVED': 4,
    'CANDIDATE_AUDIT': 4,
    'INTEGRATION_PLANNED': 4,
    'AWAITING_IMPLEMENTATION_APPROVAL': 4,
    'IMPLEMENTING': 5,
    'IMPLEMENTED': 5,
    'VERIFYING': 5,
    'CERTIFICATION_READY': 5,
    'AWAITING_GATE_2': 5,
    'CERTIFIED': 5,
    'REJECTED': -1
  };
  return stateToStep[state] || 1;
}
```

---

## 6. Integration Points

### 6.1 WorkflowEngine → WorkflowGovernanceService

**Integration:** `WorkflowEngine.execute_workflow_stage()` calls `governance_service.transition_state()` after agent completion.

**Data Flow:**
```
WorkflowEngine.execute_workflow_stage(workflow_id)
    ↓
governance_service.get_workflow(workflow_id)  # Read current state
    ↓
AgentCoordinator.execute_sequential(agents)  # Execute agents
    ↓
governance_service.transition_state(workflow_id, new_state)  # Update state
```

### 6.2 Governance Routes → WorkflowGovernanceService

**Integration:** Approval endpoints call `governance_service.transition_state()` and `governance_service.register_approval()`.

**Data Flow:**
```
POST /workflows/{workflow_id}/approve-placement
    ↓
governance_service.get_workflow(workflow_id)  # Read workflow
    ↓
Verify hashes, check self-approval  # Authorization gates
    ↓
create_implementation_approval(...)  # Create approval record
    ↓
governance_service.register_approval(workflow_id, approval)  # Bind approval
    ↓
governance_service.transition_state(workflow_id, IMPLEMENTING or REJECTED)  # Execute transition
```

### 6.3 AgentCoordinator Integration

**Integration:** `AgentCoordinator` receives workflow state in `AgentContext.workflow_state` but does not modify it.

**Change:** No changes required to `AgentCoordinator` — it remains a pure execution adapter.

### 6.4 Frontend → Backend API

**Integration:** Frontend calls `/workflows/{workflow_id}` to read state, displays UI based on `current_state`.

**Data Flow:**
```
Frontend: useEffect(() => fetchWorkflowState(workflowId))
    ↓
GET /workflows/{workflow_id}
    ↓
governance_service.get_workflow(workflow_id)
    ↓
Frontend: setState(backendState)
    ↓
Frontend: renders UI step based on backendState
```

---

## 7. Files to Create, Modify, Retire

### 7.1 Files to Create

| Path | Purpose |
|------|---------|
| `services/project-ai/app/models/workflow.py` | `ProjectLLMWorkflow` and `StateTransition` models |
| `services/project-ai/app/api/schemas/workflow.py` | Pydantic schemas for workflow API |
| `services/project-ai/app/orchestration/workflow_governance.py` | `WorkflowGovernanceService` implementation |
| `services/project-ai/app/api/routes/workflows.py` | Canonical workflow REST API endpoints |
| `services/project-ai/tests/test_workflow_governance.py` | Unit tests for governance service |
| `services/project-ai/tests/test_workflow_transitions.py` | Integration tests for state transitions |

### 7.2 Files to Modify

| Path | Changes |
|------|---------|
| `services/project-ai/app/orchestration/workflow_engine.py` | Add `governance_service` parameter, update `execute_step()` to use canonical states, call `transition_state()` |
| `services/project-ai/app/api/routes/governance.py` | Update `approve_placement()` to use `WorkflowGovernanceService`, remove `_workflow_states` dict, use `governance_service` |
| `services/project-ai/app/api/routes/tasks.py` | Add deprecation warnings, optionally proxy to `/workflows` endpoints |
| `services/project-ai/app/main.py` | Import and mount `/workflows` router |
| `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx` | Replace localStorage with backend API calls, map `CanonicalWorkflowState` to UI steps |

### 7.3 Files to Retire (Later Waves)

| Path | Retirement Plan |
|------|-----------------|
| `services/project-ai/app/api/routes/creation.py` | Wave 1: Already returns 405, remove file entirely |
| `services/project-ai/app/models/creation.py` | Wave 1: Remove `CreationWorkflow` and `WorkflowStatus`, keep `DesignSource` |
| `services/project-ai/app/api/schemas/creation.py` | Wave 1: Remove schemas for creation endpoints |
| `services/project-ai/app/api/routes/tasks.py` | Wave 2+: Replace with redirect or remove entirely |

---

## 8. Test Requirements

### 8.1 Unit Tests

**Location:** `services/project-ai/tests/test_workflow_governance.py`

```python
def test_create_workflow():
    """Test workflow creation in REQUESTED state."""
    
def test_valid_transition():
    """Test valid state transition (REQUESTED → DISCOVERY)."""
    
def test_invalid_transition():
    """Test invalid transition raises ValueError."""
    
def test_terminal_state_immutability():
    """Test no transitions allowed from CERTIFIED or REJECTED."""
    
def test_implementing_authorization_gates():
    """Test IMPLEMENTING transition requires all 6 authorization gates."""
    
def test_self_approval_prevention():
    """Test self-approval is rejected."""
    
def test_hash_verification():
    """Test candidate/manifest hash mismatch blocks transition."""
    
def test_artifact_binding():
    """Test bind_artifact() updates workflow artifacts."""
```

### 8.2 Integration Tests

**Location:** `services/project-ai/tests/test_workflow_transitions.py`

```python
async def test_full_workflow_lifecycle():
    """Test complete workflow: REQUESTED → CERTIFIED."""
    
async def test_workflow_rejection_at_gate_1():
    """Test workflow rejection at AWAITING_GATE_1."""
    
async def test_workflow_engine_integration():
    """Test WorkflowEngine calls governance_service.transition_state()."""
    
async def test_approval_endpoint_integration():
    """Test approve-placement endpoint transitions workflow state."""
```

### 8.3 API Tests

**Location:** `services/project-ai/tests/test_workflow_api.py`

```python
def test_create_workflow_endpoint():
    """Test POST /workflows creates workflow in REQUESTED state."""
    
def test_get_workflow_endpoint():
    """Test GET /workflows/{workflow_id} returns current state."""
    
def test_bind_artifact_endpoint():
    """Test POST /workflows/{workflow_id}/artifacts binds artifact."""
    
def test_invalid_workflow_id_returns_404():
    """Test invalid workflow_id returns 404."""
```

---

## 9. Error Handling

### 9.1 Transition Validation Errors

**Scenario:** Invalid state transition attempted

**Handling:**
- `validate_transition()` returns `(False, reason)`
- `transition_state()` raises `ValueError` with reason
- API endpoint catches `ValueError` and returns HTTP 400 or 409

```python
try:
    governance_service.transition_state(workflow_id, to_state, ...)
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

### 9.2 Authorization Gate Failures

**Scenario:** IMPLEMENTING transition attempted without valid approval

**Handling:**
- `can_transition_to_implementing()` returns `(False, reason)`
- `transition_state()` raises `ValueError` with authorization failure reason
- API endpoint returns HTTP 403 FORBIDDEN

```python
# Authorization failure reasons:
# - "No implementation approval found for workflow {workflow_id}"
# - "Approval status is PENDING, expected APPROVED"
# - "Candidate hash mismatch: expected X, got Y"
# - "Manifest hash mismatch: expected X, got Y"
# - "Self-approval detected: approver 'user_123'"
```

### 9.3 Terminal State Mutation Attempts

**Scenario:** State transition attempted on CERTIFIED or REJECTED workflow

**Handling:**
- `validate_transition()` detects terminal state
- Returns `(False, "Workflow is in terminal state CERTIFIED")`
- API returns HTTP 409 CONFLICT

### 9.4 Missing Required Artifacts

**Scenario:** IMPLEMENTING transition attempted without candidate_sha256

**Handling:**
- `can_transition_to_implementing()` checks for missing parameters
- Returns `(False, "Missing required parameter: candidate_sha256")`
- API returns HTTP 400 BAD REQUEST

---

## 10. Testability

### 10.1 Unit Testable Components

- **WorkflowGovernanceService:** All methods accept plain parameters, return models, use in-memory storage
- **State Transition Validation:** `validate_transition()` is pure function (given workflow + to_state, returns bool)
- **Authorization Logic:** `can_transition_to_implementing()` is pure function (given params, returns bool)

### 10.2 Integration Testable Components

- **WorkflowEngine Integration:** Mock `WorkflowGovernanceService`, verify `transition_state()` called with correct parameters
- **API Endpoint Integration:** Test client calls `/workflows` endpoints, verify state transitions occur
- **Governance Approval Integration:** Test `/approve-placement` endpoint transitions workflow state

### 10.3 Test Fixtures

```python
@pytest.fixture
def governance_service():
    """Create WorkflowGovernanceService with in-memory storage."""
    return WorkflowGovernanceService()

@pytest.fixture
def sample_workflow(governance_service):
    """Create workflow in REQUESTED state."""
    return governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )

@pytest.fixture
def workflow_with_approval(governance_service, sample_workflow):
    """Create workflow with approved implementation approval."""
    # Bind artifacts
    governance_service.bind_artifact(
        sample_workflow.workflow_id,
        "candidate",
        "cand_123",
        "abc123..."
    )
    governance_service.bind_artifact(
        sample_workflow.workflow_id,
        "manifest",
        "man_456",
        "def456..."
    )
    
    # Create and register approval
    approval = create_implementation_approval(
        workflow_id=sample_workflow.workflow_id,
        candidate_sha256="abc123...",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="man_456",
        placement_manifest_sha256="def456...",
        approved_by="approver_789",
        workflow_requester="user_123",
        status=ImplementationApprovalStatus.APPROVED
    )
    governance_service.register_approval(sample_workflow.workflow_id, approval)
    
    return sample_workflow
```

---

## 11. Edge Cases

### 11.1 Concurrent State Transitions

**Scenario:** Two processes attempt to transition same workflow simultaneously

**Current Handling:** Last write wins (in-memory dict)

**Future (Wave 1+ with persistence):**
- Use optimistic locking with version field
- Read workflow with version N
- Update where version=N, set version=N+1
- If no rows updated, raise concurrency error

### 11.2 Workflow Created But Never Advanced

**Scenario:** Workflow stuck in REQUESTED state indefinitely

**Handling:**
- Not an error — workflow remains in REQUESTED until discovery agents run
- Future: Add timeout monitoring, mark as STALE after X days

### 11.3 Approval Record Exists But Workflow Not Found

**Scenario:** Approval registered but workflow deleted

**Handling:**
- `transition_state()` raises ValueError: "Workflow not found"
- Orphaned approval records acceptable (cleanup in later waves)

### 11.4 Multiple Approvals for Same Workflow

**Scenario:** User submits multiple approval requests

**Handling:**
- `_approvals` dict keyed by `workflow_id` (1:1 relationship)
- Latest approval overwrites previous
- Alternative: Reject duplicate approvals (raise ValueError)

### 11.5 Hash Mismatch After Approval Granted

**Scenario:** Candidate mutated after approval, then IMPLEMENTING transition attempted

**Handling:**
- `can_transition_to_implementing()` verifies hash
- Returns `(False, "Candidate hash mismatch")`
- Workflow blocks at AWAITING_IMPLEMENTATION_APPROVAL
- User must re-submit candidate and re-approve

---

## 12. Migration Timeline

### Wave 0 (Current — Architecture Authority)

- ✅ Freeze `CanonicalWorkflowState` specification
- ✅ Create `workflow.py` models
- ✅ Create `workflow_governance.py` service
- ✅ Create `/workflows` API endpoints
- ✅ Write unit tests for governance service
- ✅ Update governance routes to use governance service

### Wave 1 (Backend Integration)

- Modify `WorkflowEngine` to use `WorkflowGovernanceService`
- Deprecate `/tasks` endpoints (proxy to `/workflows`)
- Add integration tests
- Update documentation

### Wave 2 (Frontend Integration)

- Update `ProjectLlmContext.tsx` to fetch backend state
- Remove localStorage state management
- Map `CanonicalWorkflowState` to UI steps
- Add loading states and error handling

### Wave 3 (Cleanup)

- Remove `creation.py` routes and models
- Remove deprecated `/tasks` endpoints
- Add persistence layer (database)
- Add workflow monitoring dashboard

---

## 13. Open Questions and Assumptions

### 13.1 Assumptions

1. **Persistence:** In-memory storage acceptable for Wave 0; database migration in Wave 1+
2. **Concurrency:** Single-process execution sufficient for M2.9; concurrency handling in M3+
3. **Frontend Compatibility:** Frontend can be updated independently without breaking existing workflows
4. **Agent Execution:** `WorkflowEngine` remains responsible for agent orchestration, governance service only manages state
5. **Evidence Ledger:** Evidence IDs attached to state transitions but evidence storage handled separately

### 13.2 Open Questions

1. **Question:** Should `TaskState` be removed entirely or kept for agent-level tracking?
   - **Recommendation:** Keep `TaskState` as internal agent execution state, clearly documented as distinct from workflow state

2. **Question:** Should frontend display raw `CanonicalWorkflowState` names or map to step numbers?
   - **Recommendation:** Map to step numbers for UX consistency, but display state name in debug/admin views

3. **Question:** How to handle workflows created before Wave 0 (no canonical state)?
   - **Recommendation:** Migration script to map existing workflows to closest canonical state, mark as "MIGRATED" in metadata

4. **Question:** Should approval records be deletable after workflow completion?
   - **Recommendation:** No — approvals are immutable audit records, never delete

---

## 14. Success Criteria

This design is successful when:

1. ✅ **Single Authority:** `CanonicalWorkflowState` is the only workflow state enum used in execution paths
2. ✅ **State Validation:** All state transitions validated by `WorkflowGovernanceService`
3. ✅ **Authorization Enforcement:** IMPLEMENTING transition blocked without valid approval (6 gates enforced)
4. ✅ **Terminal State Immutability:** CERTIFIED and REJECTED workflows cannot transition
5. ✅ **Frontend Consumes Backend:** Frontend reads state from `/workflows` API, no independent state machine
6. ✅ **Test Coverage:** 90%+ coverage on `workflow_governance.py`
7. ✅ **Audit Trail:** Complete state history recorded with timestamps and triggers
8. ✅ **No Task Routes:** `/tasks` endpoints deprecated or proxied to `/workflows`

---

## 15. Security Considerations

### 15.1 Hash-Bound Authorization

All approvals bound to exact artifact hashes (candidate_sha256, manifest_sha256). Any mutation after approval invalidates authorization.

### 15.2 Self-Approval Prevention

`can_transition_to_implementing()` enforces `approved_by != workflow_requester`. Fail-closed: missing requester causes authorization failure.

### 15.3 Terminal State Enforcement

No transitions allowed from CERTIFIED or REJECTED states. Prevents post-certification tampering.

### 15.4 Evidence Binding

State transitions attach `evidence_id` for audit trail. Evidence tampering detectable via hash verification.

### 15.5 API Authorization

Future: Add user authentication to `/workflows` endpoints. Current: Trust requester_id from request.

---

**End of Technical Design Document**
```



---

## 3. State Transition Rules and Validation

### 3.1 Transition Authorization Logic

The WorkflowGovernanceService enforces transition validation using the existing VALID_TRANSITIONS dict from canonical_workflow.py. Additional authorization checks are applied at gate states:

**Gate 1 (AWAITING_GATE_1 ? GUI_APPROVED):**
- Human approval required
- No hash verification (prototype not uploaded yet)
- Records approver identity

**Gate 2 (AWAITING_IMPLEMENTATION_APPROVAL ? IMPLEMENTING):**
- Calls can_transition_to_implementing() from canonical_workflow.py
- Verifies:
  - Approval record exists (ImplementationApproval)
  - Approval status is APPROVED
  - Candidate hash matches workflow record
  - Manifest ID matches workflow record
  - Manifest hash matches workflow record
  - Not self-approved (approver ? requester)
- **Critical:** All six checks must pass before transition allowed

**Gate 3 (AWAITING_GATE_2 ? CERTIFIED):**
- Human approval required
- Complete evidence bundle verification
- Final certification decision

**Rejection Paths:**
- Any gate can transition to REJECTED
- Automated gates (CANDIDATE_AUDIT, VERIFYING) can reject on verification failure
- REJECTED is terminal � no further transitions allowed

### 3.2 Terminal State Enforcement

Once a workflow reaches CERTIFIED or REJECTED:

1. inal_status field is set (immutable)
2. certified_at or ejected_at timestamp recorded
3. 	ransition_state() rejects any further transition attempts with error:
   `python
   if is_terminal_state(workflow.current_state):
       raise WorkflowStateError(
           f"Cannot transition from terminal state {workflow.current_state.value}"
       )
   `

### 3.3 Hash Immutability

Once set, artifact hashes cannot be modified:

`python
def bind_artifact(self, workflow_id, artifact_type, artifact_id, artifact_sha256):
    workflow = self.get_workflow(workflow_id)
    
    # Check if hash already set
    existing_hash = getattr(workflow, f"{artifact_type}_sha256", None)
    if existing_hash and existing_hash != artifact_sha256:
        raise WorkflowStateError(
            f"{artifact_type} hash already set and cannot be modified. "
            f"Expected: {existing_hash}, Got: {artifact_sha256}"
        )
    
    # Set hash (first time or re-binding with same hash)
    setattr(workflow, f"{artifact_type}_id", artifact_id)
    setattr(workflow, f"{artifact_type}_sha256", artifact_sha256)
`

This prevents time-of-check-time-of-use attacks where artifacts are swapped after approval.

---

## 4. API Contracts Between Components

### 4.1 WorkflowGovernanceService ? API Routes

**New Workflow Routes** (pp/api/routes/workflows.py):

`python
POST /workflows
- Creates workflow in REQUESTED state
- Calls: workflow_governance.create_workflow()
- Returns: WorkflowResponse with workflow_id

GET /workflows/{workflow_id}
- Retrieves current workflow state
- Calls: workflow_governance.get_workflow()
- Returns: WorkflowResponse

POST /workflows/{workflow_id}/transition
- Explicit state transition (system/agent-triggered)
- Calls: workflow_governance.transition_state()
- Body: {to_state, triggered_by, actor_id, evidence_id, reason}
- Returns: WorkflowResponse

GET /workflows/{workflow_id}/can-transition/{to_state}
- Check if transition is allowed
- Calls: workflow_governance.validate_transition()
- Returns: {allowed: bool, reason: str}
`

**Modified Governance Routes** (pp/api/routes/governance.py):

`python
POST /governance/workflows/{workflow_id}/approve-gate-1
- Approves GUI prototype (Gate 1)
- Calls: workflow_governance.transition_state(
    workflow_id, 
    CanonicalWorkflowState.GUI_APPROVED,
    triggered_by="user",
    actor_id=approver_id
  )
- Returns: WorkflowResponse

POST /governance/workflows/{workflow_id}/approve-placement
- Approves placement manifest (Gate 2)
- Calls: workflow_governance.transition_state()
- Internally calls: can_transition_to_implementing() for authorization
- Creates: ImplementationApproval record
- Calls: workflow_governance.register_approval()
- Returns: WorkflowResponse

POST /governance/workflows/{workflow_id}/approve-certification
- Final certification approval (Gate 3)
- Calls: workflow_governance.transition_state(
    workflow_id,
    CanonicalWorkflowState.CERTIFIED
  )
- Returns: WorkflowResponse
`

### 4.2 WorkflowEngine ? WorkflowGovernanceService

**Modified WorkflowEngine** (pp/orchestration/workflow_engine.py):

The WorkflowEngine becomes a **consumer** of canonical workflow state rather than managing its own state:

`python
class WorkflowEngine:
    def __init__(
        self,
        agent_registry: AgentRegistry,
        agent_coordinator: AgentCoordinator,
        workflow_governance: WorkflowGovernanceService  # NEW
    ):
        self.agent_registry = agent_registry
        self.agent_coordinator = agent_coordinator
        self.workflow_governance = workflow_governance  # NEW
    
    async def execute_workflow_stage(
        self,
        workflow_id: str,
        snapshot: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute agents for current workflow stage.
        
        NO LONGER manages state transitions � that's WorkflowGovernanceService's job.
        Reads current state, executes appropriate agents, returns results.
        Caller is responsible for transitioning state based on results.
        """
        workflow = self.workflow_governance.get_workflow(workflow_id)
        current_state = workflow.current_state
        
        # Map canonical state to agent execution
        if current_state == CanonicalWorkflowState.DISCOVERY:
            return await self._execute_discovery_agents(workflow_id, snapshot)
        
        elif current_state == CanonicalWorkflowState.CANDIDATE_AUDIT:
            return await self._execute_audit_agents(workflow_id, snapshot)
        
        elif current_state == CanonicalWorkflowState.IMPLEMENTING:
            return await self._execute_placement_agents(workflow_id, snapshot)
        
        elif current_state == CanonicalWorkflowState.VERIFYING:
            return await self._execute_verification_agents(workflow_id, snapshot)
        
        else:
            return {"status": "no_agents", "message": f"No agents for state {current_state.value}"}
`

**Key Changes:**
1. **Removed:** TaskState usage � workflow_id now maps to CanonicalWorkflowState
2. **Removed:** State transition logic � WorkflowEngine no longer calls 	ask.state = TaskState.IMPLEMENTING
3. **Added:** Dependency on WorkflowGovernanceService for state queries
4. **Preserved:** Agent orchestration logic via AgentCoordinator

### 4.3 AgentCoordinator (No Changes Required)

AgentCoordinator remains unchanged � it's already a pure orchestration adapter with no state management. It receives AgentContext and executes agents in sequential/parallel/DAG mode.

**Integration:** WorkflowEngine continues to call gent_coordinator.execute_dag() as before.

### 4.4 Frontend ? Backend API

**New Frontend Hook:** useWorkflowState (replaces ProjectLlmContext state management)

`	ypescript
// apps/skillhubcore-admin/src/hooks/useWorkflowState.ts
export function useWorkflowState(workflowId: string) {
  const { data, error, mutate } = useSWR(
    /api/project-ai/workflows/,
    fetcher,
    { refreshInterval: 5000 } // Poll every 5s for state updates
  );
  
  return {
    workflow: data as WorkflowResponse,
    isLoading: !data && !error,
    error,
    refresh: mutate,
    
    // Computed properties
    currentState: data?.state?.current,
    isTerminal: data?.state?.is_terminal,
    requiresApproval: data?.state?.requires_approval,
    canTransitionTo: async (toState: string) => {
      const res = await fetch(\/api/project-ai/workflows//can-transition/\\);
      return res.json();
    }
  };
}
`

**Frontend State Migration:**

1. **Remove:** ProjectLlmContext state fields (prototypeUploaded, candidateUploaded, etc.)
2. **Keep:** UI-only state (currentStep for wizard navigation)
3. **Add:** workflowId storage (localStorage, set on workflow creation)
4. **Replace:** Boolean flags with backend state queries

**Example Usage:**

`	ypescript
// Before (ProjectLlmContext):
const { state, setState } = useProjectLlm();
if (state.candidateUploaded) { ... }

// After (useWorkflowState):
const { workflow } = useWorkflowState(workflowId);
if (workflow.state.current === 'CANDIDATE_RECEIVED') { ... }
`

---

## 5. Migration Strategy for Existing Workflows

### 5.1 TaskState ? CanonicalWorkflowState Mapping

**Retain TaskState for Agent-Level Tracking Only:**

TaskState is redefined as internal agent execution state, not workflow state. A single workflow may spawn multiple tasks:

`
CanonicalWorkflowState.DISCOVERY (workflow)
  +-- Task 1: Repository Auditor (TaskState: CREATED ? COMPLETED)
  +-- Task 2: Toolchain Agent (TaskState: CREATED ? COMPLETED)
  +-- Task 3: Composer Agent (TaskState: CREATED ? FAILED)
`

**If needed, create an internal AgentTask model:**

`python
@dataclass
class AgentTask:
    task_id: str
    workflow_id: str  # Foreign key to ProjectLLMWorkflow
    agent_id: str
    state: TaskState  # Agent-level state
    created_at: datetime
    completed_at: Optional[datetime]
`

**Workflow routes no longer use TaskState:**

`python
# OLD (deprecated):
POST /tasks/plan
GET /tasks/{task_id}
POST /tasks/{task_id}/approve

# NEW:
POST /workflows
GET /workflows/{workflow_id}
POST /governance/workflows/{workflow_id}/approve-placement
`

### 5.2 Legacy Creation Routes

**Status:** Return 405 METHOD_NOT_ALLOWED (already implemented)

**Mapping for Analytics/Reporting:**

If analytics code queries old WorkflowStatus enum, provide a mapping function:

`python
def map_legacy_status(canonical_state: CanonicalWorkflowState) -> WorkflowStatus:
    """Map canonical state to legacy WorkflowStatus for backward compatibility."""
    mapping = {
        CanonicalWorkflowState.REQUESTED: WorkflowStatus.CREATED,
        CanonicalWorkflowState.DISCOVERY: WorkflowStatus.CREATED,
        CanonicalWorkflowState.BRIEF_READY: WorkflowStatus.CREATED,
        CanonicalWorkflowState.CANDIDATE_AUDIT: WorkflowStatus.VALIDATING,
        CanonicalWorkflowState.INTEGRATION_PLANNED: WorkflowStatus.VALIDATING,
        CanonicalWorkflowState.VERIFYING: WorkflowStatus.CERTIFYING,
        CanonicalWorkflowState.CERTIFICATION_READY: WorkflowStatus.CERTIFYING,
        CanonicalWorkflowState.CERTIFIED: WorkflowStatus.CERTIFIED,
        CanonicalWorkflowState.REJECTED: WorkflowStatus.FAILED,
    }
    return mapping.get(canonical_state, WorkflowStatus.CREATED)
`

**Deprecation Timeline:**

- **M2.9 Wave 0:** Legacy routes disabled, mapping functions available
- **M3.0:** Remove WorkflowStatus enum, CreationWorkflow model, /creation routes

### 5.3 Frontend Migration Path

**Phase 1 (M2.9 Wave 0):**

1. Add useWorkflowState hook (new)
2. Keep existing ProjectLlmContext (deprecated but functional)
3. Dual-write: Update both localStorage and backend

**Phase 2 (M3.0):**

1. Replace all ProjectLlmContext usages with useWorkflowState
2. Remove localStorage persistence of workflow state
3. Keep only UI-specific state in context (wizard step, form drafts)

### 5.4 Database Schema (Future)

**M2.9 Wave 0:** In-memory storage (Dict[str, ProjectLLMWorkflow])

**M3.0+:** Persistent storage

`sql
CREATE TABLE workflows (
    workflow_id TEXT PRIMARY KEY,
    specification_id TEXT NOT NULL,
    target_family TEXT NOT NULL,
    target_version TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    current_state TEXT NOT NULL,
    contract_id TEXT,
    contract_sha256 TEXT,
    candidate_id TEXT,
    candidate_sha256 TEXT,
    manifest_id TEXT,
    manifest_sha256 TEXT,
    approval_id TEXT,
    snapshot_id TEXT,
    snapshot_sha256 TEXT,
    final_status TEXT,
    certified_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE state_transitions (
    transition_id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workflows(workflow_id),
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    triggered_by TEXT NOT NULL,
    actor_id TEXT,
    evidence_id TEXT,
    reason TEXT
);

CREATE INDEX idx_workflows_state ON workflows(current_state);
CREATE INDEX idx_workflows_requester ON workflows(requester_id);
CREATE INDEX idx_transitions_workflow ON state_transitions(workflow_id);
`

---

## 6. Test Requirements

### 6.1 Workflow Governance Service Tests

**File:** services/project-ai/tests/test_workflow_governance.py

`python
def test_create_workflow():
    """Test workflow creation in REQUESTED state."""
    
def test_valid_transition():
    """Test allowed state transition."""
    
def test_invalid_transition_blocked():
    """Test that invalid transitions are rejected."""
    
def test_terminal_state_blocks_transitions():
    """Test that CERTIFIED and REJECTED are terminal."""
    
def test_gate_2_authorization_checks():
    """Test all six authorization gates for IMPLEMENTING transition."""
    
def test_self_approval_rejected():
    """Test that self-approval is blocked at Gate 2."""
    
def test_hash_mismatch_rejected():
    """Test that hash mismatch blocks Gate 2 approval."""
    
def test_artifact_hash_immutability():
    """Test that artifact hashes cannot be modified after set."""
    
def test_state_history_recorded():
    """Test that all transitions are recorded in state_history."""
`

### 6.2 Integration Tests

**File:** services/project-ai/tests/test_workflow_integration.py

`python
def test_full_workflow_happy_path():
    """
    Test complete workflow: REQUESTED ? CERTIFIED.
    Verifies all state transitions, approvals, and agent executions.
    """
    
def test_workflow_rejection_at_gate_1():
    """Test rejection path at GUI approval gate."""
    
def test_workflow_rejection_at_candidate_audit():
    """Test automated rejection when gates fail."""
    
def test_workflow_with_workflow_engine():
    """
    Test WorkflowEngine integration with WorkflowGovernanceService.
    Verifies agent execution triggered by canonical states.
    """
`

### 6.3 API Route Tests

**File:** services/project-ai/tests/test_workflow_routes.py

`python
def test_create_workflow_endpoint():
    """Test POST /workflows"""
    
def test_get_workflow_endpoint():
    """Test GET /workflows/{workflow_id}"""
    
def test_transition_endpoint():
    """Test POST /workflows/{workflow_id}/transition"""
    
def test_approve_placement_endpoint():
    """Test POST /governance/workflows/{workflow_id}/approve-placement"""
    
def test_approve_placement_self_approval_blocked():
    """Test that self-approval returns 403"""
    
def test_approve_placement_hash_mismatch():
    """Test that hash mismatch returns 409"""
`

### 6.4 Frontend Tests

**File:** pps/skillhubcore-admin/tests/useWorkflowState.test.ts

`	ypescript
test('useWorkflowState fetches workflow from API', async () => {
  // Test hook fetches workflow state from backend
});

test('useWorkflowState polls for updates', async () => {
  // Test that hook refreshes every 5 seconds
});

test('canTransitionTo checks valid transitions', async () => {
  // Test transition validation query
});
`

---

## 7. Files to Create, Modify, Retire

### 7.1 Files to Create (NEW)

| File | Purpose |
|------|---------|
| services/project-ai/app/models/canonical_workflow.py | ProjectLLMWorkflow and StateTransition models |
| services/project-ai/app/orchestration/workflow_governance.py | WorkflowGovernanceService implementation |
| services/project-ai/app/api/routes/workflows.py | Workflow CRUD endpoints |
| services/project-ai/app/api/schemas/workflow.py | Workflow request/response schemas |
| services/project-ai/tests/test_workflow_governance.py | Unit tests for governance service |
| services/project-ai/tests/test_workflow_integration.py | Integration tests |
| services/project-ai/tests/test_workflow_routes.py | API route tests |
| pps/skillhubcore-admin/src/hooks/useWorkflowState.ts | Frontend workflow state hook |

### 7.2 Files to Modify (MODIFY)

| File | Changes |
|------|---------|
| services/project-ai/app/orchestration/workflow_engine.py | - Add workflow_governance dependency<br>- Replace TaskState with CanonicalWorkflowState<br>- Remove state transition logic<br>- Preserve agent orchestration |
| services/project-ai/app/api/routes/governance.py | - Add Gate 1 approval endpoint<br>- Modify Gate 2 approval to call workflow_governance.transition_state()<br>- Add Gate 3 approval endpoint<br>- Integrate with WorkflowGovernanceService |
| services/project-ai/app/api/routes/tasks.py | - Add deprecation warnings<br>- Map to canonical workflow (if needed for transition)<br>- **Consider removing in M3.0** |
| services/project-ai/app/models/task_state.py | - Update docstring: "INTERNAL ONLY � agent execution tracking"<br>- Add warning: "Do not use for workflow state" |
| services/project-ai/app/main.py | - Register workflows router<br>- Initialize WorkflowGovernanceService singleton |
| pps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx | - Add deprecation comment<br>- Prepare for removal in M3.0 |

### 7.3 Files to Retire (DEPRECATE ? REMOVE in M3.0)

| File | Status |
|------|--------|
| services/project-ai/app/models/creation.py | Deprecate WorkflowStatus, CreationWorkflow (keep DesignSource) |
| services/project-ai/app/api/routes/creation.py | Already returns 405 � remove in M3.0 |
| services/project-ai/app/api/schemas/creation.py | Deprecate � remove in M3.0 |

---

## 8. Integration Points Summary

### 8.1 Authority Hierarchy

`
CanonicalWorkflowState (17 states)
  ? defines lifecycle
WorkflowGovernanceService
  ? enforces transitions + authorization
WorkflowEngine
  ? executes agents for current state
AgentCoordinator
  ? orchestrates agent execution (DAG/sequential/parallel)
Verification Modules (brand, theme, composer, runtime, browser)
  ? perform actual checks
`

### 8.2 Data Flow

**Workflow Creation:**
`
User (Frontend) 
  ? POST /workflows {family, version, requester_id}
  ? WorkflowGovernanceService.create_workflow()
  ? ProjectLLMWorkflow (state: REQUESTED)
  ? Response: {workflow_id, current_state: "REQUESTED"}
`

**Discovery Phase:**
`
System
  ? WorkflowGovernanceService.transition_state(workflow_id, DISCOVERY)
  ? WorkflowEngine.execute_workflow_stage(workflow_id, snapshot)
  ? AgentCoordinator.execute_sequential([Repository, Toolchain, Composer, Dependency])
  ? System: WorkflowGovernanceService.transition_state(workflow_id, BRIEF_READY)
`

**Gate 2 Approval:**
`
User (Frontend)
  ? POST /governance/workflows/{id}/approve-placement {manifest_hash, candidate_hash, approver_id}
  ? Governance Route validates:
     - Workflow in AWAITING_IMPLEMENTATION_APPROVAL state
     - manifest_hash matches workflow.manifest_sha256
     - candidate_hash matches workflow.candidate_sha256
     - approver_id ? workflow.requester_id
  ? Create ImplementationApproval record
  ? WorkflowGovernanceService.register_approval()
  ? WorkflowGovernanceService.transition_state(workflow_id, IMPLEMENTING)
     +? Calls can_transition_to_implementing() internally
  ? Response: {current_state: "IMPLEMENTING"}
`

### 8.3 Error Handling

**Invalid Transition Attempt:**
`python
try:
    workflow_governance.transition_state(workflow_id, invalid_state)
except WorkflowStateError as e:
    return {"error": "INVALID_TRANSITION", "message": str(e)}
`

**Terminal State Violation:**
`python
# WorkflowGovernanceService.transition_state()
if is_terminal_state(workflow.current_state):
    raise WorkflowStateError(
        f"Workflow {workflow_id} is in terminal state {workflow.current_state.value}. "
        f"No further transitions allowed."
    )
`

**Authorization Failure (Gate 2):**
`python
# Governance route approve_placement()
can_proceed, reason = workflow_governance.can_transition_to_implementing(
    workflow_id, requester_id, candidate_sha256, manifest_id, manifest_sha256
)
if not can_proceed:
    raise HTTPException(status_code=403, detail={"error": "AUTHORIZATION_FAILED", "reason": reason})
`

**Hash Mismatch:**
`python
# Logged at INFO level for audit trail
logger.info(
    f"Hash mismatch detected for workflow {workflow_id}: "
    f"expected {expected_hash}, got {provided_hash}",
    extra={"workflow_id": workflow_id, "artifact_type": "manifest"}
)
raise WorkflowStateError("Manifest hash mismatch � potential tampering detected")
`

---

## 9. Edge Cases and Invariants

### 9.1 Edge Cases

**1. User navigates away during approval:**
- **Workflow state:** Persisted in backend (in-memory or DB)
- **Frontend state:** Reloads from /workflows/{id} on page refresh
- **Resolution:** No data loss � approval decision preserved in state_history

**2. Concurrent approval attempts:**
- **M2.9 Wave 0:** In-memory dict � last write wins (acceptable for single-instance deployment)
- **M3.0+:** Database with optimistic locking via updated_at timestamp
  `sql
  UPDATE workflows 
  SET current_state = ?, updated_at = NOW() 
  WHERE workflow_id = ? AND updated_at = ?
  `

**3. Agent execution fails mid-workflow:**
- **Workflow state:** Remains in current state (e.g., CANDIDATE_AUDIT)
- **Error recorded:** In gate_results dict with agent failure details
- **Resolution:** User can retry or reject workflow manually

**4. Approval granted but placement fails:**
- **State:** IMPLEMENTING
- **Error:** Logged in gate_results["placement_error"]
- **Resolution:** Workflow transitions to REJECTED automatically
- **Audit trail:** state_history shows IMPLEMENTING ? REJECTED with reason

**5. Hash collision (extremely unlikely):**
- **Detection:** SHA-256 collision is cryptographically infeasible
- **Mitigation:** If detected, log critical error and block transition
- **Fallback:** Manual admin intervention required

### 9.2 Invariants

**Invariant 1:** Every workflow has exactly one current_state at any time.

**Invariant 2:** Once terminal (CERTIFIED or REJECTED), current_state never changes.

**Invariant 3:** Once an artifact hash is set, it cannot be modified (prevents tampering).

**Invariant 4:** At Gate 2, all six authorization checks must pass before IMPLEMENTING transition.

**Invariant 5:** Every state transition is recorded in state_history with timestamp and actor.

**Invariant 6:** equester_id and pproved_by must differ at all approval gates (no self-approval).

**Invariant 7:** A workflow in AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, or AWAITING_GATE_2 cannot progress without explicit human approval action.

**Enforcement:**

These invariants are enforced by WorkflowGovernanceService:

`python
def transition_state(self, workflow_id, to_state, triggered_by, actor_id, evidence_id, reason):
    workflow = self.get_workflow(workflow_id)
    
    # Invariant 2: Terminal state check
    if is_terminal_state(workflow.current_state):
        raise WorkflowStateError("Cannot transition from terminal state")
    
    # Invariant 1: Valid transition check
    if not is_valid_transition(workflow.current_state, to_state):
        raise WorkflowStateError(f"Invalid transition: {workflow.current_state} ? {to_state}")
    
    # Invariant 7: Gate approval check
    if to_state == CanonicalWorkflowState.IMPLEMENTING:
        can_proceed, auth_reason = can_transition_to_implementing(...)
        if not can_proceed:
            raise WorkflowStateError(f"Authorization failed: {auth_reason}")
    
    # Invariant 5: Record transition
    transition = StateTransition(
        from_state=workflow.current_state,
        to_state=to_state,
        timestamp=datetime.now(timezone.utc),
        triggered_by=triggered_by,
        actor_id=actor_id,
        evidence_id=evidence_id,
        reason=reason
    )
    workflow.state_history.append(transition)
    
    # Update state
    workflow.current_state = to_state
    workflow.updated_at = datetime.now(timezone.utc)
`

---

## 10. Testability Considerations

### 10.1 Unit Testable Components

**WorkflowGovernanceService:**
- **Pure functions:** alidate_transition(), is_terminal(), equires_approval()
- **State mutations:** create_workflow(), 	ransition_state(), ind_artifact()
- **Mocking:** Not required � service operates on in-memory dict, can be instantiated fresh per test

**CanonicalWorkflowState validation functions:**
- **Pure functions:** is_valid_transition(), is_gate_state(), is_terminal_state(), can_transition_to_implementing()
- **No I/O:** All logic based on state enum and approval dict

### 10.2 Integration Testable Components

**WorkflowEngine + WorkflowGovernanceService:**
- Test that agent execution respects canonical workflow state
- Test that agents are not executed when workflow is in wrong state
- Test that agent results trigger correct state transitions

**API Routes + WorkflowGovernanceService:**
- Test HTTP endpoints call governance service correctly
- Test error responses (400, 403, 404, 409) for invalid transitions
- Test approval endpoints enforce authorization gates

### 10.3 Mock Requirements

**Minimal mocking required:**

1. **AgentCoordinator:** Mock agent execution results in WorkflowEngine tests
   `python
   mock_agent_coordinator.execute_sequential.return_value = [
       AgentResult(agent_id="composer", status=AgentStatus.SUCCESS)
   ]
   `

2. **Snapshot Data:** Use fixture JSON snapshots for discovery phase tests
   `python
   @pytest.fixture
   def sample_snapshot():
       return {"blocks": {"implemented": [...]}, "composer": {...}}
   `

3. **Implementation Approval:** Use factory function for approval records
   `python
   def create_test_approval(workflow_id, approved_by, requester_id):
       return create_implementation_approval(...)
   `

**No mocking needed for:**
- WorkflowGovernanceService (in-memory, lightweight)
- CanonicalWorkflowState enum (pure logic)
- State validation functions (pure functions)

### 10.4 Test Data Builders

**Builder Pattern for Workflows:**

`python
class WorkflowBuilder:
    def __init__(self):
        self.workflow_id = str(uuid4())
        self.target_family = "Introduction"
        self.target_version = "I7"
        self.requester_id = "user_123"
        self.current_state = CanonicalWorkflowState.REQUESTED
    
    def in_state(self, state: CanonicalWorkflowState):
        self.current_state = state
        return self
    
    def with_candidate(self, candidate_id, candidate_sha256):
        self.candidate_id = candidate_id
        self.candidate_sha256 = candidate_sha256
        return self
    
    def with_manifest(self, manifest_id, manifest_sha256):
        self.manifest_id = manifest_id
        self.manifest_sha256 = manifest_sha256
        return self
    
    def build(self) -> ProjectLLMWorkflow:
        return ProjectLLMWorkflow(
            workflow_id=self.workflow_id,
            specification_id=f"{self.target_family}{self.target_version}",
            target_family=self.target_family,
            target_version=self.target_version,
            requester_id=self.requester_id,
            current_state=self.current_state,
            candidate_id=getattr(self, 'candidate_id', None),
            candidate_sha256=getattr(self, 'candidate_sha256', None),
            manifest_id=getattr(self, 'manifest_id', None),
            manifest_sha256=getattr(self, 'manifest_sha256', None),
        )

# Usage:
workflow = (WorkflowBuilder()
    .in_state(CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL)
    .with_candidate("cand_123", "abc123...")
    .with_manifest("manifest_456", "def456...")
    .build())
`

---

## 11. Implementation Checklist

### Phase 1: Core Models and Service (Priority 1)

- [ ] Create pp/models/canonical_workflow.py with ProjectLLMWorkflow and StateTransition
- [ ] Create pp/orchestration/workflow_governance.py with WorkflowGovernanceService
- [ ] Write unit tests for WorkflowGovernanceService (10 test cases minimum)
- [ ] Verify terminal state enforcement
- [ ] Verify hash immutability

### Phase 2: API Routes (Priority 1)

- [ ] Create pp/api/routes/workflows.py with CRUD endpoints
- [ ] Create pp/api/schemas/workflow.py with request/response models
- [ ] Modify pp/api/routes/governance.py to add Gate 1, Gate 3 endpoints
- [ ] Integrate Gate 2 with workflow_governance.transition_state()
- [ ] Register /workflows router in pp/main.py

### Phase 3: WorkflowEngine Integration (Priority 2)

- [ ] Modify pp/orchestration/workflow_engine.py:
  - [ ] Add workflow_governance dependency
  - [ ] Replace TaskState usage with CanonicalWorkflowState
  - [ ] Remove state transition logic
  - [ ] Map canonical states to agent execution
- [ ] Write integration tests for WorkflowEngine + WorkflowGovernanceService

### Phase 4: Frontend Integration (Priority 2)

- [ ] Create useWorkflowState hook
- [ ] Add workflow polling (5-second interval)
- [ ] Replace ProjectLlmContext usages in wizard pages
- [ ] Test frontend state synchronization with backend

### Phase 5: Documentation and Deprecation (Priority 3)

- [ ] Update pp/models/task_state.py docstring (mark internal-only)
- [ ] Add deprecation warnings to pp/api/routes/tasks.py
- [ ] Add deprecation comments to ProjectLlmContext.tsx
- [ ] Document migration path in MIGRATION.md

### Phase 6: Evidence and Cleanup (Priority 3)

- [ ] Add architecture freeze report (rchitecture-freeze-report.json)
- [ ] Run pytest suite: pytest services/project-ai/tests -q
- [ ] Run frontend tests: 
pm test -- --runInBand
- [ ] Create evidence ledger entry for Wave 0 completion

---

## 12. Success Criteria

**Architecture Freeze Verified:**

1. ? CanonicalWorkflowState is the only authority for workflow lifecycle
2. ? WorkflowGovernanceService enforces all state transitions
3. ? WorkflowEngine no longer manages its own state
4. ? Frontend reads state from backend API, not localStorage
5. ? All approval gates call workflow_governance.transition_state()
6. ? Terminal states prevent further transitions
7. ? Self-approval is blocked at all gates
8. ? Hash verification prevents artifact tampering

**Tests Pass:**

1. ? All governance service tests pass
2. ? Integration tests for WorkflowEngine pass
3. ? API route tests pass
4. ? No regressions in existing agent tests

**Documentation Complete:**

1. ? Architecture freeze report generated
2. ? Migration guide written
3. ? API documentation updated (OpenAPI schema)

---

## 13. Risks and Mitigations

### Risk 1: Frontend Breaks During Migration

**Likelihood:** Medium  
**Impact:** High  
**Mitigation:** Dual-write period (M2.9) where both localStorage and backend API are updated. Frontend can fall back to localStorage if API fails.

### Risk 2: Concurrent Workflow Edits

**Likelihood:** Low (single user per workflow expected)  
**Impact:** Medium  
**Mitigation M2.9:** In-memory storage � last write wins (acceptable for single-instance deployment).  
**Mitigation M3.0:** Optimistic locking with updated_at timestamp check.

### Risk 3: Approval Gate Bypass

**Likelihood:** Low  
**Impact:** Critical  
**Mitigation:** 
- All transitions through WorkflowGovernanceService (single point of enforcement)
- Gate states cannot be skipped (validated by VALID_TRANSITIONS dict)
- Authorization failures logged for audit

### Risk 4: Agent Execution Without Approval

**Likelihood:** Medium (if WorkflowEngine integration incorrect)  
**Impact:** High  
**Mitigation:**
- WorkflowEngine checks current state before executing agents
- Integration tests verify agents not executed in wrong state
- Add assertion: "Cannot execute placement agents if state != IMPLEMENTING"

### Risk 5: Data Loss During In-Memory Storage

**Likelihood:** High (process restart loses workflows)  
**Impact:** Medium  
**Mitigation M2.9:** Document limitation � workflows lost on restart.  
**Mitigation M3.0:** Persistent database storage.

---

## 14. Future Enhancements (Post-M2.9)

**M3.0: Persistent Storage**
- SQLite or PostgreSQL database for workflow storage
- Database migrations for schema versioning
- Optimistic locking for concurrent updates

**M3.1: Workflow Snapshots**
- Snapshot workflow state at each gate
- Enable rollback to previous gate on rejection

**M3.2: Audit Log Export**
- Export state_history to JSON or CSV
- Include evidence references and approval decisions

**M3.3: Workflow Templates**
- Pre-configure workflows for common block families
- Skip REQUESTED ? DISCOVERY if template matches existing pattern

**M3.4: Parallel Workflows**
- Allow multiple workflows per user
- Dashboard to track all workflows

**M3.5: Webhook Notifications**
- Notify external systems on state changes
- Integrate with Slack/email for approval requests

---

**End of Technical Design**
