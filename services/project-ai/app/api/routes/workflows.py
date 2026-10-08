"""
Workflow Management API Routes - M2.9 Wave 0

REST API endpoints for canonical workflow lifecycle management.

These endpoints replace /tasks routes for workflow-level operations and provide
the single source of truth for workflow state.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.api.schemas.workflow import (
    WorkflowResponse,
    CreateWorkflowRequest,
    TransitionRequest,
    BindArtifactRequest,
    WorkflowArtifact,
    WorkflowStateInfo,
    WorkflowTarget,
    WorkflowArtifacts,
    StateTransitionInfo
)
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState


router = APIRouter(prefix="/workflows", tags=["workflows"])

# Instantiate governance service (in-memory for Wave 0)
governance_service = WorkflowGovernanceService()


def _workflow_to_response(workflow) -> WorkflowResponse:
    """Convert ProjectLLMWorkflow to WorkflowResponse schema."""
    workflow_dict = workflow.to_dict()
    
    return WorkflowResponse(
        workflow_id=workflow_dict["workflow_id"],
        specification_id=workflow_dict["specification_id"],
        target=WorkflowTarget(**workflow_dict["target"]),
        requester_id=workflow_dict["requester_id"],
        state=WorkflowStateInfo(**workflow_dict["state"]),
        artifacts=WorkflowArtifacts(
            contract=WorkflowArtifact(**workflow_dict["artifacts"]["contract"]),
            candidate=WorkflowArtifact(**workflow_dict["artifacts"]["candidate"]),
            manifest=WorkflowArtifact(**workflow_dict["artifacts"]["manifest"]),
            snapshot=WorkflowArtifact(**workflow_dict["artifacts"]["snapshot"])
        ),
        approval_id=workflow_dict["approval_id"],
        gate_results=workflow_dict["gate_results"],
        evidence_ids=workflow_dict["evidence_ids"],
        state_history=[StateTransitionInfo(**t) for t in workflow_dict["state_history"]],
        created_at=workflow_dict["created_at"],
        updated_at=workflow_dict["updated_at"],
        final_status=workflow_dict["final_status"]
    )


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(request: CreateWorkflowRequest) -> WorkflowResponse:
    """
    Create a new workflow in REQUESTED state.
    
    Initiates the Project LLM workflow lifecycle with target binding and
    requester identity for self-approval prevention.
    
    Args:
        request: Workflow creation request
        
    Returns:
        New workflow in REQUESTED state
    """
    workflow = governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=request.requester_id,
        purpose=request.purpose
    )
    
    return _workflow_to_response(workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str) -> WorkflowResponse:
    """
    Get workflow state by ID.
    
    Returns current workflow state, artifacts, approvals, and history.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        Complete workflow state
        
    Raises:
        HTTPException: 404 if workflow not found
    """
    workflow = governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return _workflow_to_response(workflow)


@router.post("/{workflow_id}/transition", response_model=WorkflowResponse)
async def transition_workflow(workflow_id: str, request: TransitionRequest) -> WorkflowResponse:
    """
    Transition workflow to new state (internal use).
    
    Validates transition according to canonical state machine rules and
    enforces authorization gates for IMPLEMENTING transition.
    
    Args:
        workflow_id: Workflow identifier
        request: Transition request
        
    Returns:
        Updated workflow
        
    Raises:
        HTTPException: 400 if transition invalid, 404 if workflow not found
    """
    # Parse target state
    try:
        to_state = CanonicalWorkflowState(request.to_state)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state: {request.to_state}"
        )
    
    # Attempt transition
    try:
        workflow = governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=to_state,
            triggered_by=request.triggered_by,
            evidence_id=request.evidence_id,
            reason=request.reason
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _workflow_to_response(workflow)


@router.get("/{workflow_id}/history", response_model=List[StateTransitionInfo])
async def get_workflow_history(workflow_id: str) -> List[StateTransitionInfo]:
    """
    Get workflow state transition history.
    
    Returns complete audit trail of all state transitions.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        List of state transitions in chronological order
        
    Raises:
        HTTPException: 404 if workflow not found
    """
    workflow = governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return [
        StateTransitionInfo(
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
async def bind_artifact(workflow_id: str, request: BindArtifactRequest) -> WorkflowResponse:
    """
    Bind artifact to workflow with hash.
    
    Associates an artifact (contract, candidate, manifest, snapshot) with the
    workflow and records its SHA-256 hash for integrity verification.
    
    Args:
        workflow_id: Workflow identifier
        request: Artifact binding request
        
    Returns:
        Updated workflow
        
    Raises:
        HTTPException: 400 if artifact type invalid, 404 if workflow not found
    """
    # Validate artifact type
    valid_types = ["contract", "candidate", "manifest", "snapshot"]
    if request.artifact_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid artifact type: {request.artifact_type}. Must be one of: {', '.join(valid_types)}"
        )
    
    # Bind artifact
    try:
        governance_service.bind_artifact(
            workflow_id=workflow_id,
            artifact_type=request.artifact_type,
            artifact_id=request.artifact_id,
            artifact_sha256=request.artifact_sha256
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    workflow = governance_service.get_workflow(workflow_id)
    return _workflow_to_response(workflow)


@router.get("", response_model=List[WorkflowResponse])
async def list_workflows() -> List[WorkflowResponse]:
    """
    List all workflows.
    
    Returns:
        List of all workflows
    """
    workflows = governance_service.list_workflows()
    return [_workflow_to_response(w) for w in workflows]
