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

from app.auth.dependencies import get_current_user
from app.auth.types import AuthenticatedPrincipal
from app.api.schemas.workflow import (
    WorkflowResponse,
    CreateWorkflowRequest,
    TransitionRequest,
    BindArtifactRequest,
    WorkflowArtifact,
    WorkflowStateInfo,
    WorkflowTarget,
    WorkflowArtifacts,
    StateTransitionInfo,
    FinalApprovalRequest,
    FinalApprovalResponse
)
from app.api.schemas.placement import (
    PlacementEngineResponse,
    PlacementOverrideRequest,
    PlacementConflictResponse,
    CreatePlacementRequest,
)
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.persistence import (
    get_db_session,
    get_workflow_repository,
    get_approval_repository,
    get_state_transition_repository,
    get_candidate_repository,
    get_manifest_repository,
)
from app.placement.placement_engine import PlacementEngine
from app.placement.scorer import PlacementScorer
from app.placement.matcher import CandidateManifestMatcher


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


async def get_placement_engine(
    session: AsyncSession = Depends(get_db_session)
) -> PlacementEngine:
    """
    Dependency injection for PlacementEngine.
    
    Creates placement engine with repository and component dependencies.
    """
    scorer = PlacementScorer()
    matcher = CandidateManifestMatcher(scorer)
    
    workflow_repo = await get_workflow_repository(session)
    candidate_repo = await get_candidate_repository(session)
    manifest_repo = await get_manifest_repository(session)
    
    return PlacementEngine(
        matcher=matcher,
        scorer=scorer,
        manifest_repo=manifest_repo,
        candidate_repo=candidate_repo,
        workflow_repo=workflow_repo
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
    user: AuthenticatedPrincipal = Depends(get_current_user),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowResponse:
    """
    Create a new workflow in REQUESTED state.
    
    Initiates the Project LLM workflow lifecycle with target binding and
    requester identity for self-approval prevention.
    
    Requester identity is extracted from JWT token to prevent spoofing.
    
    Args:
        request: Workflow creation request
        
    Returns:
        New workflow in REQUESTED state
    """
    # Extract requester identity from JWT token (prevent identity spoofing)
    # Defensive: user_id guaranteed by get_current_user but explicit check for clarity
    if not (requester_id := user.get("user_id")):
        raise HTTPException(401, "Missing user_id claim")
    
    workflow = await governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=requester_id,
        purpose=request.purpose
    )
    await session.commit()
    
    return _workflow_to_response(workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
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
    user: AuthenticatedPrincipal = Depends(get_current_user),
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
    user: AuthenticatedPrincipal = Depends(get_current_user),
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
    user: AuthenticatedPrincipal = Depends(get_current_user),
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
    user: AuthenticatedPrincipal = Depends(get_current_user),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
) -> List[WorkflowResponse]:
    """
    List all workflows.
    
    Returns:
        List of all workflows
    """
    workflows = await governance_service.list_workflows()
    return [_workflow_to_response(w) for w in workflows]


@router.post("/{workflow_id}/placement", response_model=PlacementEngineResponse)
async def create_placement(
    workflow_id: str,
    request: CreatePlacementRequest,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine),
    session: AsyncSession = Depends(get_db_session)
) -> PlacementEngineResponse:
    """
    Create placement decision for candidate in workflow.
    
    Matches candidate to manifests, scores matches, creates placement record.
    
    Args:
        workflow_id: Workflow identifier
        request: Placement creation request with candidate_id
        
    Returns:
        Placement decision with score and conflicts
        
    Raises:
        HTTPException: 400 if placement fails, 404 if workflow/candidate not found
    """
    try:
        result = await placement_engine.create_placement(
            workflow_id=workflow_id,
            candidate_id=request.candidate_id,
            session=session
        )
        await session.commit()
        
        return PlacementEngineResponse(
            workflow_id=result.workflow_id,
            candidate_id=result.candidate_id,
            placement_decision=result.placement_decision.value,
            manifest_id=result.manifest_id,
            score={
                "overall": result.score.score,
                "criteria": result.score.criteria,
                "reasoning": result.score.reasoning
            } if result.score else None,
            conflicts=result.conflicts,
            evidence=result.evidence,
            created_at=result.created_at
        )
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Placement creation failed: {str(e)}")


@router.post("/{workflow_id}/placement/override", response_model=PlacementEngineResponse)
async def override_placement(
    workflow_id: str,
    candidate_id: str,
    request: PlacementOverrideRequest,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine),
    session: AsyncSession = Depends(get_db_session)
) -> PlacementEngineResponse:
    """
    Manually override placement decision.
    
    Allows human to specify exact manifest for candidate, bypassing scoring.
    
    Args:
        workflow_id: Workflow identifier
        candidate_id: Candidate identifier (query param)
        request: Override request with manifest_id and reason
        
    Returns:
        Placement decision with manual override
        
    Raises:
        HTTPException: 400 if override fails, 404 if entities not found
    """
    try:
        result = await placement_engine.override_placement(
            workflow_id=workflow_id,
            candidate_id=candidate_id,
            manual_manifest_id=request.manual_manifest_id,
            override_reason=request.override_reason,
            session=session
        )
        await session.commit()
        
        return PlacementEngineResponse(
            workflow_id=result.workflow_id,
            candidate_id=result.candidate_id,
            placement_decision=result.placement_decision.value,
            manifest_id=result.manifest_id,
            score=None,  # No scoring for manual override
            conflicts=result.conflicts,
            evidence=result.evidence,
            created_at=result.created_at
        )
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Placement override failed: {str(e)}")


@router.get("/{workflow_id}/placement/conflicts", response_model=List[PlacementConflictResponse])
async def list_placement_conflicts(
    workflow_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    placement_engine: PlacementEngine = Depends(get_placement_engine),
    session: AsyncSession = Depends(get_db_session)
) -> List[PlacementConflictResponse]:
    """
    List all placement conflicts for workflow.
    
    Detects multiple candidates targeting the same path.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        List of conflicts with target paths and candidate IDs
        
    Raises:
        HTTPException: 404 if workflow not found
    """
    try:
        # Load all candidates for workflow
        candidates = []
        # Note: This would require a candidate_repo.list_by_workflow method
        # For now, return empty conflicts as the method isn't implemented yet
        
        # Load manifests
        manifests = await placement_engine._load_manifests(workflow_id, session)
        
        if not candidates or not manifests:
            return []
        
        # Detect conflicts
        conflicts_map = await placement_engine.matcher.detect_conflicts(
            candidates=candidates,
            manifests=manifests
        )
        
        # Convert to response format
        return [
            PlacementConflictResponse(
                target_path=path,
                candidate_ids=candidate_ids,
                conflict_count=len(candidate_ids)
            )
            for path, candidate_ids in conflicts_map.items()
        ]
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to list conflicts: {str(e)}"
        )


@router.post("/{workflow_id}/approve-final", response_model=FinalApprovalResponse)
async def approve_final_certification(
    workflow_id: str,
    request: FinalApprovalRequest,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    session: AsyncSession = Depends(get_db_session)
) -> FinalApprovalResponse:
    """
    Approve or reject final certification (Human Gate 2/Gate 3).
    
    GATE ENFORCEMENT:
    - Workflow must be in AWAITING_GATE_2 state
    - Approved: transition to CERTIFIED
    - Rejected: transition to REJECTED with reason
    
    EVIDENCE VERIFICATION:
    - All gates (UBRC, Brand, Theme, Runtime, Browser) must be PASS
    - Evidence bundle must be complete
    - No missing evidence IDs
    
    Args:
        workflow_id: Workflow to approve/reject
        request: Approval decision with reason
        
    Returns:
        Approval result with state transition
        
    Raises:
        HTTPException: 400 if invalid state, 404 if workflow not found
    """
    from datetime import datetime, timezone
    from app.agents.final_gate import FinalGateController
    
    # Get workflow
    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    # Handle idempotent requests - if already in terminal state with same decision, return existing result
    if workflow.state.current == CanonicalWorkflowState.CERTIFIED:
        if request.approved:
            # Already approved, return existing approval
            return FinalApprovalResponse(
                workflow_id=workflow_id,
                previous_state=CanonicalWorkflowState.AWAITING_GATE_2.value,
                new_state=CanonicalWorkflowState.CERTIFIED.value,
                approved=True,
                approved_by=user.get("email") or user.get("sub") or user.get("id") or "unknown",
                approved_at=workflow.updated_at.isoformat() if workflow.updated_at else datetime.now(timezone.utc).isoformat(),
                reason=request.reason,
                evidence_verified=True,
                gate_results=workflow.gate_results or {}
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Workflow already CERTIFIED, cannot reject"
            )
    elif workflow.state.current == CanonicalWorkflowState.REJECTED:
        if not request.approved:
            # Already rejected, return existing rejection
            return FinalApprovalResponse(
                workflow_id=workflow_id,
                previous_state=CanonicalWorkflowState.AWAITING_GATE_2.value,
                new_state=CanonicalWorkflowState.REJECTED.value,
                approved=False,
                approved_by=user.get("email") or user.get("sub") or user.get("id") or "unknown",
                approved_at=workflow.updated_at.isoformat() if workflow.updated_at else datetime.now(timezone.utc).isoformat(),
                reason=request.reason,
                evidence_verified=False,
                gate_results=workflow.gate_results or {}
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Workflow already REJECTED, cannot approve"
            )
    
    # Validate state - must be AWAITING_GATE_2 for new approval/rejection
    if workflow.state.current != CanonicalWorkflowState.AWAITING_GATE_2:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state for approval: {workflow.state.current.value}. Must be AWAITING_GATE_2"
        )
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    evidence = workflow.gate_results or {}
    verdict_result = final_gate.compute_verdict(workflow_id, evidence)
    
    # Evidence is verified if verdict is CERTIFICATION_READY
    evidence_verified = (verdict_result.verdict == "CERTIFICATION_READY")
    
    # ENFORCE evidence verification - block approval if gates failed
    if not evidence_verified:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve: evidence verification failed. Verdict: {verdict_result.verdict}, Reason: {verdict_result.reason}"
        )
    
    # Extract approver identity from authenticated user token (prevent identity spoofing)
    approved_by = user.get("email") or user.get("sub") or user.get("id") or "unknown"
    
    # Determine target state
    if request.approved:
        target_state = CanonicalWorkflowState.CERTIFIED
    else:
        target_state = CanonicalWorkflowState.REJECTED
    
    # Perform transition
    previous_state = workflow.state.current.value
    
    try:
        workflow = await governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=target_state,
            triggered_by=approved_by,
            evidence_id=None,
            reason=request.reason
        )
        await session.commit()
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    # Return response
    return FinalApprovalResponse(
        workflow_id=workflow_id,
        previous_state=previous_state,
        new_state=workflow.state.current.value,
        approved=request.approved,
        approved_by=approved_by,
        approved_at=datetime.now(timezone.utc).isoformat(),
        reason=request.reason,
        evidence_verified=evidence_verified,
        gate_results=verdict_result.evidence_summary
    )
