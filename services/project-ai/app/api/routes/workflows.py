"""
Workflow API Routes - M2.9 Wave 0

REST API endpoints for canonical workflow management.

These endpoints replace the task-based routes for workflow-level operations,
providing direct access to the canonical workflow state machine via
WorkflowGovernanceService.

ENDPOINTS:
- POST /workflows: Create new workflow (REQUESTED state)
- GET /workflows/{workflow_id}: Get workflow state
- POST /workflows/{workflow_id}/transition: Transition state (internal use)
- GET /workflows/{workflow_id}/history: Get state transition history
- POST /workflows/{workflow_id}/artifacts: Bind artifact to workflow

ARCHITECTURAL CONSTRAINTS:
- All state mutations go through WorkflowGovernanceService
- No direct workflow model manipulation
- Terminal state enforcement absolute
- Authorization gates enforced by governance service
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.api.schemas.workflow import (
    CreateWorkflowRequest,
    WorkflowResponse,
    WorkflowTarget,
    WorkflowStateInfo,
    WorkflowArtifacts,
    WorkflowArtifact,
    TransitionRequest,
    BindArtifactRequest,
    StateTransitionResponse
)
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState


router = APIRouter(prefix="/workflows", tags=["workflows"])

# Instantiate governance service at module level (in-memory for Wave 0)
governance_service = WorkflowGovernanceService()


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(request: CreateWorkflowRequest):
    """
    Create a new workflow in REQUESTED state.
    
    This endpoint initializes a new Project LLM workflow with target family
    and version binding. The workflow starts in REQUESTED state and proceeds
    through discovery phase.
    
    Args:
        request: Workflow creation parameters
        
    Returns:
        Newly created workflow in REQUESTED state
    """
    try:
        workflow = governance_service.create_workflow(
            target_family=request.target_family,
            target_version=request.target_version,
            requester_id=request.requester_id,
            purpose=request.purpose
        )
        
        return _workflow_to_response(workflow)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workflow: {str(e)}")


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str):
    """
    Get workflow state by ID.
    
    Returns complete workflow representation including current state,
    artifact bindings, approval status, and evidence references.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        Complete workflow state
        
    Raises:
        404: Workflow not found
    """
    workflow = governance_service.get_workflow(workflow_id)
    
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return _workflow_to_response(workflow)


@router.post("/{workflow_id}/transition", response_model=WorkflowResponse)
async def transition_state(workflow_id: str, request: TransitionRequest):
    """
    Transition workflow to new state (internal use).
    
    This endpoint is for internal workflow execution. Most state transitions
    should happen automatically through agent execution or approval endpoints.
    
    Args:
        workflow_id: Workflow identifier
        request: Transition parameters
        
    Returns:
        Updated workflow state
        
    Raises:
        400: Invalid transition
        404: Workflow not found
    """
    try:
        # Parse state
        to_state = CanonicalWorkflowState(request.to_state)
        
        workflow = governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=to_state,
            triggered_by=request.triggered_by,
            evidence_id=request.evidence_id,
            reason=request.reason
        )
        
        return _workflow_to_response(workflow)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Invalid state: {request.to_state}")


@router.get("/{workflow_id}/history", response_model=List[StateTransitionResponse])
async def get_workflow_history(workflow_id: str):
    """
    Get workflow state transition history.
    
    Returns complete audit trail of all state transitions for workflow,
    including timestamps, triggering entities, and evidence references.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        List of state transitions in chronological order
        
    Raises:
        404: Workflow not found
    """
    workflow = governance_service.get_workflow(workflow_id)
    
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return [
        StateTransitionResponse(
            from_state=t.from_state.value if t.from_state else None,
            to_state=t.to_state.value,
            timestamp=t.timestamp.isoformat(),
            triggered_by=t.triggered_by,
            evidence_id=t.evidence_id,
            reason=t.reason
        )
        for t in workflow.state_history
    ]


@router.post("/{workflow_id}/artifacts", response_model=WorkflowResponse)
async def bind_artifact(workflow_id: str, request: BindArtifactRequest):
    """
    Bind artifact to workflow with hash verification.
    
    Attaches artifact ID and SHA-256 hash to workflow for audit trail and
    authorization gates. Artifact types: contract, candidate, manifest, snapshot.
    
    Args:
        workflow_id: Workflow identifier
        request: Artifact binding parameters
        
    Returns:
        Updated workflow with artifact binding
        
    Raises:
        400: Invalid artifact type
        404: Workflow not found
    """
    try:
        governance_service.bind_artifact(
            workflow_id=workflow_id,
            artifact_type=request.artifact_type,
            artifact_id=request.artifact_id,
            artifact_sha256=request.artifact_sha256
        )
        
        workflow = governance_service.get_workflow(workflow_id)
        return _workflow_to_response(workflow)
    
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))


def _workflow_to_response(workflow) -> WorkflowResponse:
    """
    Convert ProjectLLMWorkflow domain model to API response schema.
    
    Args:
        workflow: ProjectLLMWorkflow instance
        
    Returns:
        WorkflowResponse with all fields populated
    """
    return WorkflowResponse(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target=WorkflowTarget(
            family=workflow.target_family,
            version=workflow.target_version
        ),
        requester_id=workflow.requester_id,
        state=WorkflowStateInfo(
            current=workflow.current_state.value,
            is_terminal=workflow.is_terminal(),
            requires_approval=workflow.requires_approval()
        ),
        artifacts=WorkflowArtifacts(
            contract=WorkflowArtifact(
                id=workflow.contract_id,
                sha256=workflow.contract_sha256
            ),
            candidate=WorkflowArtifact(
                id=workflow.candidate_id,
                sha256=workflow.candidate_sha256
            ),
            manifest=WorkflowArtifact(
                id=workflow.manifest_id,
                sha256=workflow.manifest_sha256
            ),
            snapshot=WorkflowArtifact(
                id=workflow.snapshot_id,
                sha256=workflow.snapshot_sha256
            )
        ),
        approval_id=workflow.approval_id,
        gate_results=workflow.gate_results,
        evidence_ids=workflow.evidence_ids,
        created_at=workflow.created_at.isoformat(),
        updated_at=workflow.updated_at.isoformat(),
        final_status=workflow.final_status
    )
