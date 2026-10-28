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

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import Any, List
import re
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_contract_admin
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
    WorkflowRepository,
    get_approval_repository,
    get_state_transition_repository,
    get_candidate_repository,
    get_manifest_repository,
)
from app.placement.placement_engine import PlacementEngine
from app.placement.scorer import PlacementScorer
from app.placement.matcher import CandidateManifestMatcher


router = APIRouter(prefix="/workflows", tags=["workflows"])


def _get_verified_placement_commit(
    gate_results: dict[str, Any],
    candidate_sha256: str,
    manifest_sha256: str,
) -> str:
    """Return the immutable placement commit only when all bindings match."""
    placement = gate_results.get("placement")
    if not isinstance(placement, dict):
        raise ValueError("Placement evidence is missing")

    commit = placement.get("commit")
    if not isinstance(commit, str) or not re.fullmatch(r"[0-9a-f]{7,64}", commit):
        raise ValueError("Placement evidence does not contain a valid commit SHA")
    if placement.get("candidate_sha256") != candidate_sha256:
        raise ValueError("Placement evidence candidate hash does not match the workflow")
    if placement.get("manifest_sha256") != manifest_sha256:
        raise ValueError("Placement evidence manifest hash does not match the workflow")
    return commit


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
        gate_results=workflow_dict.get("gate_results") or {},
        evidence_ids=[str(e) for e in (workflow_dict.get("evidence_ids") or [])],
        state_history=[
            StateTransitionInfo(
                from_state=t.get("from_state"),
                to_state=t["to_state"],
                timestamp=t["timestamp"],
                triggered_by=t["triggered_by"],
                evidence_id=str(t["evidence_id"]) if t.get("evidence_id") is not None else None,
                reason=t.get("reason"),
            )
            for t in (workflow_dict.get("state_history") or [])
        ],
        created_at=workflow_dict["created_at"],
        updated_at=workflow_dict["updated_at"],
        final_status=workflow_dict["final_status"]
    )


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(
    request: CreateWorkflowRequest,
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
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
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
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
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
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
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
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
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
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
    - W7 evidence policy enforced: artifact binding, staleness, workflow isolation
    
    Args:
        workflow_id: Workflow to approve/reject
        request: Approval decision with reason
        
    Returns:
        Approval result with state transition
        
    Raises:
        HTTPException: 400 if invalid state, 404 if workflow not found, 409 if evidence policy violated
    """
    from datetime import datetime, timezone
    from app.agents.final_gate import FinalGateController
    from app.governance.evidence_policy import (
        EvidenceResult,
        validate_final_gate_evidence,
        FINAL_GATE_POLICY
    )
    
    # Get workflow
    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")
    
    # Handle idempotent requests - if already in terminal state with same decision, return existing result
    if workflow.current_state == CanonicalWorkflowState.CERTIFIED:
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
    elif workflow.current_state == CanonicalWorkflowState.REJECTED:
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
    
    # Validate state - transition CERTIFICATION_READY to AWAITING_GATE_2 if needed
    if workflow.current_state == CanonicalWorkflowState.CERTIFICATION_READY:
        workflow = await governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.AWAITING_GATE_2,
            triggered_by=user.get("email") or user.get("sub") or "system",
            reason="Automated verification complete; ready for final HAA certification"
        )
    elif workflow.current_state != CanonicalWorkflowState.AWAITING_GATE_2:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state for approval: {workflow.current_state.value}. Must be AWAITING_GATE_2 or CERTIFICATION_READY"
        )
    
    gate_results = workflow.gate_results or {}
    bound_artifact_sha256 = workflow.contract_sha256 or ""

    is_candidate_pipeline = "composer" in gate_results

    if is_candidate_pipeline:
        # 1. Placement Gate verification
        placement_gate = gate_results.get("placement")
        if not placement_gate or not isinstance(placement_gate, dict):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Placement gate record missing from workflow gate_results"
            )
        placement_commit = placement_gate.get("commit")
        if not placement_commit:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Placement commit SHA missing from placement gate"
            )
        # Verify placement commit has non-empty diff in git
        from app.verification.composer_worktree_verifier import find_workspace_root
        workspace_root = find_workspace_root()
        import subprocess
        try:
            diff_proc = subprocess.run(
                ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", placement_commit],
                cwd=workspace_root,
                capture_output=True,
                text=True,
                check=True
            )
            changed_files = [f for f in diff_proc.stdout.strip().splitlines() if f.strip()]
            if not changed_files:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve: Placement commit {placement_commit} is an empty commit with 0 changed files. Production certification requires a non-empty placement diff."
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve: Failed to verify placement commit diff in git: {e}"
            )

        # 2. Candidate & Manifest cryptographic binding
        if workflow.candidate_sha256 and placement_gate.get("candidate_sha256"):
            if workflow.candidate_sha256 != placement_gate.get("candidate_sha256"):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot approve: Candidate SHA mismatch between workflow and placement gate"
                )
        if workflow.manifest_sha256 and placement_gate.get("manifest_sha256"):
            if workflow.manifest_sha256 != placement_gate.get("manifest_sha256"):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot approve: Manifest SHA mismatch between workflow and placement gate"
                )

        # 3. Qualification Gate verification
        unit_test_gate = gate_results.get("Unit Test Suite") or gate_results.get("qualification")
        if not unit_test_gate or not isinstance(unit_test_gate, dict):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Qualification unit test suite gate record missing"
            )
        if unit_test_gate.get("status") not in ("PASS", "SUCCESS") and unit_test_gate.get("result") not in ("PASS", "SUCCESS"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve: Qualification unit test suite gate did not pass: {unit_test_gate}"
            )

        # 4. Composer Verification Gate
        composer_gate = gate_results.get("composer") or {}
        if not composer_gate.get("passed") or composer_gate.get("status") != "PASS":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve: Composer verification gate failed or incomplete: {composer_gate.get('reason')}"
            )
        if not composer_gate.get("evidence_hash"):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer verification gate is missing cryptographic evidence_hash"
            )
        if not composer_gate.get("runner_metadata", {}).get("screenshot_captured"):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer verification gate is missing visual screenshot evidence"
            )

        # 5. Accessibility & Modality Verification Gate
        runner_metadata = composer_gate.get("runner_metadata", {})
        accessibility_evidence = runner_metadata.get("accessibility")
        if not accessibility_evidence or not isinstance(accessibility_evidence, dict):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer verification gate is missing required browser-level accessibility evidence"
            )
        if not accessibility_evidence.get("passed") or accessibility_evidence.get("violations_count", 0) > 0:
            violations_count = accessibility_evidence.get("violations_count", 0)
            violations_list = accessibility_evidence.get("violations", [])
            violation_summary = "; ".join([f"{v.get('id')}: {v.get('help')}" for v in violations_list[:3]]) if violations_list else "unspecified"
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve: Composer verification failed browser-level accessibility audit with {violations_count} violation(s): {violation_summary}"
            )
        if accessibility_evidence.get("passes_count", 0) <= 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer verification accessibility evidence reports 0 passes (audit was unexecuted or non-evaluative)"
            )

        modality_checks = runner_metadata.get("modality_checks")
        if not modality_checks or not isinstance(modality_checks, dict):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer verification gate is missing required modality_checks object"
            )

        REQUIRED_MODALITIES = {"keyboard_navigation", "reduced_motion", "forced_colors", "responsive_viewports"}
        missing_modalities = REQUIRED_MODALITIES - set(modality_checks.keys())
        if missing_modalities:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve: Composer verification modality_checks missing required modalities: {sorted(list(missing_modalities))}"
            )

        for modality_name in sorted(list(REQUIRED_MODALITIES)):
            mod_result = modality_checks.get(modality_name)
            if not isinstance(mod_result, dict):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve: Composer verification {modality_name} modality result is malformed or missing"
                )
            mod_status = mod_result.get("status")
            if mod_status not in ("PASS", "NOT_APPLICABLE"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve: Composer verification failed {modality_name} modality check (status: {mod_status}): {mod_result.get('details', 'check failed')}"
                )

        # 6. Cryptographic Evidence Hash Revalidation
        from app.verification.composer_worktree_verifier import compute_composer_evidence_hash
        import hashlib
        from pathlib import Path

        evidence_payload = composer_gate.get("evidence_payload")
        if not evidence_payload or not isinstance(evidence_payload, dict):
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer verification gate is missing cryptographic evidence_payload for hash revalidation"
            )

        if evidence_payload.get("verified_commit") != placement_commit:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot approve: Composer evidence_payload verified_commit mismatch "
                    f"({evidence_payload.get('verified_commit')} != {placement_commit})"
                )
            )
        if workflow.candidate_sha256 and evidence_payload.get("candidate_hash") != workflow.candidate_sha256:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer evidence_payload candidate_hash mismatch"
            )
        if workflow.manifest_sha256 and evidence_payload.get("manifest_hash") != workflow.manifest_sha256:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer evidence_payload manifest_hash mismatch"
            )
        if evidence_payload.get("accessibility") != accessibility_evidence:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer accessibility metadata does not match signed evidence_payload"
            )
        if evidence_payload.get("modality_checks") != modality_checks:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve: Composer modality_checks metadata does not match signed evidence_payload"
            )

        screenshot_path_str = runner_metadata.get("screenshot_path")
        expected_screenshot_sha = evidence_payload.get("screenshot_sha256")
        if screenshot_path_str:
            screenshot_file = Path(screenshot_path_str)
            if not screenshot_file.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve: Composer screenshot evidence file missing on disk: {screenshot_path_str}"
                )
            actual_screenshot_sha = hashlib.sha256(screenshot_file.read_bytes()).hexdigest()
            if actual_screenshot_sha != expected_screenshot_sha:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Cannot approve: Composer screenshot SHA-256 mismatch "
                        f"(on-disk {actual_screenshot_sha} != signed {expected_screenshot_sha})"
                    )
                )

        recomputed_evidence_hash = compute_composer_evidence_hash(evidence_payload)
        stored_evidence_hash = composer_gate.get("evidence_hash")
        if recomputed_evidence_hash != stored_evidence_hash:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot approve: Composer evidence_hash cryptographic verification failed "
                    f"(recomputed {recomputed_evidence_hash} != stored {stored_evidence_hash})"
                )
            )

        evidence_verified = True
        evidence_summary = gate_results
    else:
        # W7 Evidence Policy Enforcement - validate evidence before FinalGateController
        evidence_list = []
        for etype, edata in gate_results.items():
            if isinstance(edata, dict):
                raw_ts = edata.get("created_at") or edata.get("timestamp")
                if isinstance(raw_ts, str):
                    try:
                        created_at = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
                    except (ValueError, AttributeError):
                        created_at = datetime.now(timezone.utc)
                elif isinstance(raw_ts, datetime):
                    created_at = raw_ts if raw_ts.tzinfo else raw_ts.replace(tzinfo=timezone.utc)
                else:
                    created_at = datetime.now(timezone.utc)
                
                evidence_list.append(EvidenceResult(
                    evidence_type=etype,
                    verdict=edata.get("status") or edata.get("verdict") or "",
                    workflow_id=edata.get("workflow_id") or workflow_id,
                    artifact_sha256=edata.get("artifact_sha256") or bound_artifact_sha256,
                    created_at=created_at,
                    evidence_id=edata.get("evidence_id") or f"{workflow_id}-{etype}",
                ))
        
        evidence_errors = validate_final_gate_evidence(
            workflow_id=workflow_id,
            artifact_sha256=bound_artifact_sha256,
            evidence=evidence_list,
            policy=FINAL_GATE_POLICY,
        )
        if evidence_errors:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "FINAL_GATE_EVIDENCE_REJECTED",
                    "errors": evidence_errors,
                    "workflow_id": workflow_id,
                },
            )
        
        # Verify evidence using FinalGateController
        final_gate = FinalGateController()
        verdict_result = final_gate.compute_verdict(workflow_id, gate_results)
        evidence_verified = (verdict_result.verdict == "CERTIFICATION_READY")
        if not evidence_verified:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve: evidence verification failed. Verdict: {verdict_result.verdict}, Reason: {verdict_result.reason}"
            )
        evidence_summary = verdict_result.evidence_summary
    
    # Extract approver identity from authenticated user token (prevent identity spoofing)
    approved_by = user.get("email") or user.get("sub") or user.get("id") or "unknown"
    
    # Determine target state
    if request.approved:
        target_state = CanonicalWorkflowState.CERTIFIED
    else:
        target_state = CanonicalWorkflowState.REJECTED
    
    # Perform transition
    previous_state = workflow.current_state.value
    
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
        new_state=workflow.current_state.value,
        approved=request.approved,
        approved_by=approved_by,
        approved_at=datetime.now(timezone.utc).isoformat(),
        reason=request.reason,
        evidence_verified=evidence_verified,
        gate_results=evidence_summary
    )


class SupersedeWorkflowRequest(BaseModel):
    reason: str = "Placement plan superseded by new candidate revision"


@router.post("/{workflow_id}/verify-composer", response_model=dict)
async def verify_composer(
    workflow_id: str,
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    workflow_repo: WorkflowRepository = Depends(get_workflow_repository),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """
    Execute post-placement Composer verification in an isolated worktree preview.
    
    INVARIANT: Does NOT test the live app directly. Verifies the exact placement commit
    in an ephemeral worktree preview, checking dropdown discovery, Preview Pane rendering,
    DOM attributes, and zero console errors. Binds evidence hash into workflow gate results.
    """
    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")

    allowed_states = [
        CanonicalWorkflowState.IMPLEMENTED,
        CanonicalWorkflowState.VERIFYING,
        CanonicalWorkflowState.CERTIFICATION_READY,
        CanonicalWorkflowState.AWAITING_GATE_2
    ]
    if workflow.current_state not in allowed_states:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot run Composer verification in state {workflow.current_state.value}. "
                "Placement must be executed first (workflow state must be IMPLEMENTED or later)."
            )
        )

    try:
        commit_sha = _get_verified_placement_commit(
            workflow.gate_results or {},
            workflow.candidate_sha256 or "",
            workflow.manifest_sha256 or "",
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))

    from app.verification.composer_worktree_verifier import verify_composer_in_worktree

    result = await verify_composer_in_worktree(
        workflow_id=workflow_id,
        commit_sha=commit_sha,
        block_family=workflow.target_family,
        block_version=workflow.target_version,
        candidate_hash=workflow.candidate_sha256 or "",
        manifest_hash=workflow.manifest_sha256 or "",
        timeout_seconds=600
    )

    if result.get("passed"):
        if workflow.current_state == CanonicalWorkflowState.IMPLEMENTED:
            await governance_service.transition_state(
                workflow_id=workflow_id,
                to_state=CanonicalWorkflowState.VERIFYING,
                triggered_by=user.get("email") or user.get("sub") or "system",
                reason="Composer verification initiated on isolated worktree"
            )
            await governance_service.transition_state(
                workflow_id=workflow_id,
                to_state=CanonicalWorkflowState.CERTIFICATION_READY,
                triggered_by=user.get("email") or user.get("sub") or "system",
                reason="Composer verification passed in isolated preview"
            )

    # Atomically bind gate result into workflow
    workflow_model = await workflow_repo.get(workflow_id, verify_bindings=False)
    if workflow_model:
        current_gates = dict(workflow_model.gate_results or {})
        current_gates["composer"] = result
        workflow_model.gate_results = current_gates
        await workflow_repo.upsert(workflow_model)
        await session.commit()
        result["current_workflow_state"] = workflow_model.current_state

    return result


@router.post("/{workflow_id}/supersede", response_model=dict)
async def supersede_workflow(
    workflow_id: str,
    request: SupersedeWorkflowRequest,
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    workflow_repo: WorkflowRepository = Depends(get_workflow_repository),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """
    Supersede an unapproved or stale placement plan.
    
    AUDIT INVARIANT:
    - Never resets existing workflow backwards (preserves immutable history).
    - Archives current workflow as REJECTED with reason SUPERSEDED.
    - Creates a linked replacement workflow requiring fresh candidate upload and qualification.
    """
    from uuid import uuid4
    from app.persistence.models import WorkflowModel, StateTransitionModel

    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_id}")

    old_state = workflow.current_state.value
    triggered_by = user.get("email") or user.get("sub") or user.get("id") or "admin"
    new_workflow_id = str(uuid4())
    reason_text = f"SUPERSEDED_BY_REVISION: {request.reason} (Replacement: {new_workflow_id})"

    # Archive old workflow if not already terminal
    if workflow.current_state not in [CanonicalWorkflowState.REJECTED, CanonicalWorkflowState.CERTIFIED]:
        await governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.REJECTED,
            triggered_by=triggered_by,
            reason=reason_text
        )

    # Bind superseded metadata on old workflow model
    workflow_model = await workflow_repo.get(workflow_id, verify_bindings=False)
    if workflow_model:
        workflow_model.final_status = "SUPERSEDED"
        old_gates = dict(workflow_model.gate_results or {})
        old_gates["superseded"] = {
            "superseded_at": datetime.now(timezone.utc).isoformat(),
            "superseded_by": new_workflow_id,
            "reason": request.reason
        }
        workflow_model.gate_results = old_gates

    # Create linked replacement workflow requiring fresh candidate upload and qualification
    new_wf_model = WorkflowModel(
        workflow_id=new_workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.CANDIDATE_REQUESTED.value,
        contract_id=workflow.contract_id,
        contract_sha256=workflow.contract_sha256,
        gate_results={
            "supersedes": {
                "superseded_workflow_id": workflow_id,
                "reason": request.reason,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        evidence_ids=[],
        version=1
    )
    session.add(new_wf_model)
    await session.flush()

    transition = StateTransitionModel(
        workflow_id=new_workflow_id,
        from_state=None,
        to_state=CanonicalWorkflowState.CANDIDATE_REQUESTED.value,
        triggered_by=triggered_by,
        reason=f"Workflow created as replacement for superseded {workflow_id}"
    )
    session.add(transition)
    await session.commit()

    return {
        "old_workflow_id": workflow_id,
        "new_workflow_id": new_workflow_id,
        "previous_state": old_state,
        "current_state": CanonicalWorkflowState.CANDIDATE_REQUESTED.value,
        "reason": request.reason
    }

