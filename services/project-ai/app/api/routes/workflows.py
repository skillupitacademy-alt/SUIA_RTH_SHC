"""
Workflow Management API Routes - M2.9 R3

REST API endpoints for canonical workflow lifecycle management.

These endpoints replace /tasks routes for workflow-level operations and provide
the single source of truth for workflow state.

R3 PERSISTENCE:
- All operations async with PostgreSQL backing
- Uses repository pattern for data access
- Transaction management via session.commit()
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.persistence import (
    get_db_session,
    get_workflow_repository,
    get_approval_repository,
    get_state_transition_repository,
)


router = APIRouter(prefix="/workflows", tags=["workflows"])


async def get_governance_service(
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowGovernanceService:
    """
    Dependency injection for WorkflowGovernanceService.
    
    Creates service with repository dependencies injected.
    """
    workflow_repo = await get_workflow_repository(session)
    approval_repo = await get_approval_repository(session)
    state_transition_repo = await get_state_transition_repository(session)
    
    return WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=session
    )


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
async def create_workflow(
    request: CreateWorkflowRequest,
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowResponse:
    """
    Create a new workflow in REQUESTED state.
    
    Initiates the Project LLM workflow lifecycle with target binding and
    requester identity for self-approval prevention.
    
    Args:
        request: Workflow creation request
        
    Returns:
        New workflow in REQUESTED state
    """
    workflow = await governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=request.requester_id,
        purpose=request.purpose
    )
    await session.commit()
    
    return _workflow_to_response(workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
) -> WorkflowResponse:
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
    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    return _workflow_to_response(workflow)


@router.post("/{workflow_id}/transition", response_model=WorkflowResponse)
async def transition_workflow(
    workflow_id: str,
    request: TransitionRequest,
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowResponse:
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
        workflow = await governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=to_state,
            triggered_by=request.triggered_by,
            evidence_id=request.evidence_id,
            reason=request.reason
        )
        await session.commit()
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return _workflow_to_response(workflow)


@router.get("/{workflow_id}/history", response_model=List[StateTransitionInfo])
async def get_workflow_history(
    workflow_id: str,
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
) -> List[StateTransitionInfo]:
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
    workflow = await governance_service.get_workflow(workflow_id)
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
async def bind_artifact(
    workflow_id: str,
    request: BindArtifactRequest,
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowResponse:
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
        await governance_service.bind_artifact(
            workflow_id=workflow_id,
            artifact_type=request.artifact_type,
            artifact_id=request.artifact_id,
            artifact_sha256=request.artifact_sha256
        )
        await session.commit()
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    
    workflow = await governance_service.get_workflow(workflow_id)
    return _workflow_to_response(workflow)


@router.get("", response_model=List[WorkflowResponse])
async def list_workflows(
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
) -> List[WorkflowResponse]:
    """
    List all workflows.
    
    Returns:
        List of all workflows
    """
    workflows = await governance_service.list_workflows()
    return [_workflow_to_response(w) for w in workflows]
