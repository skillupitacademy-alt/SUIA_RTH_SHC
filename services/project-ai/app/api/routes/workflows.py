"""
Workflow API Routes - M2.9 Wave 0

REST API endpoints for workflow management using WorkflowGovernanceService.

These endpoints provide workflow lifecycle operations: create, retrieve, transition,
bind artifacts, and view history. All workflow operations use the canonical state
machine and governance service.

ENDPOINTS:
- POST   /workflows                       Create workflow (REQUESTED state)
- GET    /workflows/{workflow_id}         Get workflow state
- POST   /workflows/{workflow_id}/transition   Transition state (internal)
- GET    /workflows/{workflow_id}/history      Get state history
- POST   /workflows/{workflow_id}/artifacts    Bind artifact
"""

from fastapi import APIRouter, HTTPException
from typing import List

from app.api.schemas.workflow import (
    CreateWorkflowRequest,
    WorkflowResponse,
    TransitionRequest,
    BindArtifactRequest,
    WorkflowArtifact,
    WorkflowArtifacts,
    WorkflowStateInfo,
    WorkflowTarget,
)
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState


router = APIRouter(prefix="/workflows", tags=["workflows"])

# Module-level governance service instance (in-memory for Wave 0)
governance_service = WorkflowGovernanceService()


def _workflow_to_response(workflow) -> WorkflowResponse:
    """
    Convert ProjectLLMWorkflow to WorkflowResponse schema.
    
    Args:
        workflow: ProjectLLMWorkflow instance
        
    Returns:
        WorkflowResponse for API response
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


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(request: CreateWorkflowRequest):
    """
    Create a new workflow in REQUESTED state.
    
    The workflow will be assigned a unique workflow_id and initialized with
    the specified target family/version and requester.
    
    Args:
        request: CreateWorkflowRequest with target_family, target_version, requester_id
        
    Returns:
        WorkflowResponse with new workflow in REQUESTED state
    """
    workflow = governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=request.requester_id,
        purpose=request.purpose
    )
    
    return _workflow_to_response(workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str):
    """
    Get workflow state by ID.
    
    Returns complete workflow representation including current state,
    artifacts, approvals, and evidence.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        WorkflowResponse with current workflow state
        
    Raises:
        HTTPException 404: If workflow not found
    """
    workflow = governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return _workflow_to_response(workflow)


@router.post("/{workflow_id}/transition", response_model=WorkflowResponse)
async def transition_workflow(workflow_id: str, request: TransitionRequest):
    """
    Transition workflow to new state (internal use).
    
    This endpoint is for internal use by workflow execution components.
    Most state transitions should occur through specific workflow operations
    (e.g., approval endpoints, agent execution).
    
    Validates transition against canonical state machine and enforces
    authorization gates for IMPLEMENTING transition.
    
    Args:
        workflow_id: Workflow identifier
        request: TransitionRequest with to_state, triggered_by, evidence_id, reason
        
    Returns:
        WorkflowResponse with updated workflow state
        
    Raises:
        HTTPException 400: If transition validation fails
        HTTPException 404: If workflow not found
    """
    try:
        # Parse state string to enum
        to_state = CanonicalWorkflowState(request.to_state)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state: {request.to_state}"
        )
    
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


@router.get("/{workflow_id}/history")
async def get_workflow_history(workflow_id: str):
    """
    Get workflow state transition history.
    
    Returns complete audit trail of all state transitions with timestamps,
    triggers, and evidence references.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        List of state transitions
        
    Raises:
        HTTPException 404: If workflow not found
    """
    workflow = governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return {
        "workflow_id": workflow.workflow_id,
        "transitions": [
            {
                "from_state": t.from_state.value if t.from_state else None,
                "to_state": t.to_state.value,
                "timestamp": t.timestamp.isoformat(),
                "triggered_by": t.triggered_by,
                "evidence_id": t.evidence_id,
                "reason": t.reason
            }
            for t in workflow.state_history
        ]
    }


@router.post("/{workflow_id}/artifacts", response_model=WorkflowResponse)
async def bind_artifact(workflow_id: str, request: BindArtifactRequest):
    """
    Bind an artifact to workflow with hash.
    
    Artifacts are hash-bound for tamper detection. Valid artifact types:
    - contract: Engineering contract for External AI
    - candidate: User-uploaded implementation package
    - manifest: Placement manifest for file operations
    - snapshot: Final repository snapshot after implementation
    
    Args:
        workflow_id: Workflow identifier
        request: BindArtifactRequest with artifact_type, artifact_id, artifact_sha256
        
    Returns:
        WorkflowResponse with updated artifact binding
        
    Raises:
        HTTPException 400: If artifact_type invalid or hash malformed
        HTTPException 404: If workflow not found
    """
    # Validate artifact type
    valid_types = ["contract", "candidate", "manifest", "snapshot"]
    if request.artifact_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid artifact_type: {request.artifact_type}. Must be one of {valid_types}"
        )
    
    try:
        governance_service.bind_artifact(
            workflow_id=workflow_id,
            artifact_type=request.artifact_type,
            artifact_id=request.artifact_id,
            artifact_sha256=request.artifact_sha256
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    workflow = governance_service.get_workflow(workflow_id)
    return _workflow_to_response(workflow)
