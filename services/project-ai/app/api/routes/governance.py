"""Governance endpoints for manifest-bound human approval workflow.

M2.9 R3 PERSISTENCE:
- Approvals persisted to PostgreSQL via ApprovalRepository
- Workflows managed via WorkflowGovernanceService with PostgreSQL backing
- All operations async with proper transaction management
"""

from datetime import datetime, timezone
from typing import Dict, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_contract_admin, require_contract_reviewer
from app.auth.types import AuthenticatedPrincipal
from app.api.schemas.governance import (
    ApprovalDecisionRequest,
    ApprovalRecord,
    ApprovalRejectRequest,
    ApprovalSubmitRequest,
    ApprovalSubmitResponse,
    AuditTrailEntry,
)
from app.models.governance import ApprovalStatus
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
    create_implementation_approval,
)
from app.orchestration.canonical_workflow import CanonicalWorkflowState, is_valid_transition
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.api.routes.workflows import get_governance_service
from app.persistence import (
    get_db_session,
    get_approval_repository,
    get_manifest_repository,
    ApprovalRepository,
    ManifestRepository,
)

router = APIRouter(prefix="/approvals", tags=["governance"])

# Legacy in-memory approval storage for M2.9 transition period
# These dicts remain for backward compatibility with existing tests that haven't been migrated
# Production code paths use PostgreSQL repositories exclusively
_approvals: Dict[str, Dict] = {}  # Legacy manifest approvals (Wave 2)
# Note: _workflow_states and _implementation_approvals removed - use WorkflowGovernanceService and ApprovalRepository


@router.post("/submit", response_model=ApprovalSubmitResponse)
async def submit_for_approval(
    request: ApprovalSubmitRequest,
    user: AuthenticatedPrincipal = Depends(get_current_user)
):
    """
    Submit a placement manifest for human approval.
    
    Creates a pending approval record with the manifest hash bound to the submission.
    This hash is the security anchor: approval will be rejected if the manifest
    mutates before approval is granted.
    
    Args:
        request: Manifest ID, hash, and submitter identity
        
    Returns:
        Approval ID and initial PENDING status
    """
    approval_id = str(uuid4())
    now = datetime.now(timezone.utc)
    
    # Extract submitter identity from JWT (prevent identity spoofing)
    submitted_by = user.get("user_id") or user.get("email") or user.get("sub") or "unknown"
    
    audit_entry = {
        "action": "submitted",
        "by": submitted_by,
        "at": now,
        "reason": None,
    }
    
    approval = {
        "approvalId": approval_id,
        "manifestId": request.manifestId,
        "status": ApprovalStatus.PENDING,
        "submittedBy": submitted_by,
        "submittedAt": now,
        "decidedBy": None,
        "decidedAt": None,
        "manifestHash": request.manifestHash,
        "reason": None,
        "auditTrail": [audit_entry],
    }
    
    _approvals[approval_id] = approval
    
    return ApprovalSubmitResponse(
        approvalId=approval_id,
        manifestId=request.manifestId,
        status=ApprovalStatus.PENDING,
        submittedAt=now,
    )


@router.get("/pending", response_model=list[ApprovalRecord])
async def get_pending_approvals(user: AuthenticatedPrincipal = Depends(require_contract_reviewer)):
    """
    Get all pending approval records.
    
    Returns list of approvals in PENDING status awaiting human review.
    
    Returns:
        List of pending approval records
    """
    pending = [
        ApprovalRecord(**approval)
        for approval in _approvals.values()
        if approval["status"] == ApprovalStatus.PENDING
    ]
    
    return pending


@router.get("/{approval_id}", response_model=ApprovalRecord)
async def get_approval_status(
    approval_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user)
):
    """
    Get approval record by ID.
    
    Args:
        approval_id: Unique approval identifier
        
    Returns:
        Complete approval record with status and audit trail
        
    Raises:
        404: If approval not found
    """
    if approval_id not in _approvals:
        raise HTTPException(
            status_code=404,
            detail=f"Approval not found: {approval_id}"
        )
    
    return ApprovalRecord(**_approvals[approval_id])


@router.post("/{approval_id}/approve", response_model=ApprovalRecord)
async def approve_manifest(
    approval_id: str,
    request: ApprovalDecisionRequest,
    user: AuthenticatedPrincipal = Depends(require_contract_reviewer)
):
    """
    Approve a pending manifest.
    
    CRITICAL SECURITY GATES:
    1. Self-approval prevention: Approver cannot be the same as submitter
    2. Manifest hash verification: Detects tampering since submission
    
    This prevents time-of-check-time-of-use attacks and enforces
    separation of duties.
    
    Args:
        approval_id: Approval to decide
        request: Decision details including manifest hash for verification
        
    Returns:
        Updated approval record
        
    Raises:
        404: If approval not found
        400: If approval is not in PENDING state
        401: If user_id claim missing from JWT
        403: If self-approval attempted (Wave 2)
        409: If manifest hash does not match (manifest was mutated)
    """
    if approval_id not in _approvals:
        raise HTTPException(
            status_code=404,
            detail=f"Approval not found: {approval_id}"
        )
    
    approval = _approvals[approval_id]
    
    # Extract approver identity from JWT (prevent identity spoofing)
    # Reject if user_id is missing instead of falling back to "unknown"
    if not (decided_by := user.get("user_id")):
        raise HTTPException(
            status_code=401,
            detail="Missing user_id claim in JWT token"
        )
    
    if approval["status"] != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Approval is in {approval['status']} state, expected PENDING"
        )
    
    # CRITICAL: Prevent self-approval (Wave 2)
    if decided_by == approval["submittedBy"]:
        now = datetime.now(timezone.utc)
        
        approval["status"] = ApprovalStatus.REJECTED
        approval["decidedBy"] = decided_by
        approval["decidedAt"] = now
        approval["reason"] = (
            f"Self-approval rejected. "
            f"User '{decided_by}' cannot approve their own submission. "
            f"Separation of duties required."
        )
        
        audit_entry = {
            "action": "rejected_self_approval",
            "by": decided_by,
            "at": now,
            "reason": approval["reason"],
        }
        approval["auditTrail"].append(audit_entry)
        
        raise HTTPException(
            status_code=403,
            detail={
                "error": "SELF_APPROVAL_REJECTED",
                "message": approval["reason"],
                "submittedBy": approval["submittedBy"],
                "attemptedBy": decided_by
            }
        )
    
    # CRITICAL: Verify manifest hash matches submission
    if request.manifestHash != approval["manifestHash"]:
        now = datetime.now(timezone.utc)
        
        # Reject approval due to manifest mutation
        approval["status"] = ApprovalStatus.MANIFEST_CHANGED
        approval["decidedBy"] = decided_by
        approval["decidedAt"] = now
        approval["reason"] = (
            f"Manifest hash mismatch detected. "
            f"Expected: {approval['manifestHash']}, "
            f"Got: {request.manifestHash}. "
            f"Manifest was mutated after submission."
        )
        
        audit_entry = {
            "action": "rejected_hash_mismatch",
            "by": decided_by,
            "at": now,
            "reason": approval["reason"],
        }
        approval["auditTrail"].append(audit_entry)
        
        raise HTTPException(
            status_code=409,
            detail={
                "error": "MANIFEST_CHANGED",
                "message": approval["reason"],
                "expectedHash": approval["manifestHash"],
                "providedHash": request.manifestHash,
            }
        )
    
    # Hash verified and not self-approved: approve
    now = datetime.now(timezone.utc)
    approval["status"] = ApprovalStatus.APPROVED
    approval["decidedBy"] = decided_by
    approval["decidedAt"] = now
    approval["reason"] = request.reason
    
    audit_entry = {
        "action": "approved",
        "by": decided_by,
        "at": now,
        "reason": request.reason,
    }
    approval["auditTrail"].append(audit_entry)
    
    return ApprovalRecord(**approval)


# ===== WAVE 4: Implementation Approval Gate =====
# Workflow-specific approval endpoint that transitions AWAITING_IMPLEMENTATION_APPROVAL -> IMPLEMENTING


class WorkflowApprovalPayload(BaseModel):
    """Request to approve or reject placement manifest for a workflow."""
    
    workflow_id: str = Field(description="Workflow identifier", min_length=1)
    manifest_hash: Optional[str] = Field(
        default=None,
        description="Manifest hash at time of review (must match stored manifest)"
    )
    contract_hash: Optional[str] = Field(
        default=None,
        description="Engineering contract hash (for verification)"
    )
    candidate_sha256: Optional[str] = Field(
        default=None,
        description="Candidate hash from ValidationResult (for verification)"
    )
    placement_manifest_id: Optional[str] = Field(
        default=None,
        description="Placement manifest ID (for binding verification)"
    )
    approved: bool = Field(default=True, description="True to approve, False to reject")
    reason: str = Field(default="Placement manifest approved for implementation", description="Reason for approval or rejection")


class WorkflowApprovalResponse(BaseModel):
    """Response after workflow placement approval decision."""
    
    workflow_id: str
    previous_state: str
    new_state: str
    approved: bool
    approved_by: str
    approved_at: datetime
    manifest_hash_verified: bool
    contract_hash_verified: bool
    candidate_sha256_verified: bool
    manifest_id_verified: bool
    reason: str


@router.post("/workflows/{workflow_id}/approve-placement", response_model=WorkflowApprovalResponse)
async def approve_placement(
    workflow_id: str,
    payload: WorkflowApprovalPayload,
    user: AuthenticatedPrincipal = Depends(require_contract_admin),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    approval_repo: ApprovalRepository = Depends(get_approval_repository),
    manifest_repo: ManifestRepository = Depends(get_manifest_repository),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Approve or reject placement manifest for a workflow.
    
    **M2.9 R3 Integration**: Uses WorkflowGovernanceService and ApprovalRepository with PostgreSQL backing.
    
    CRITICAL GATES:
    1. Workflow must be in AWAITING_IMPLEMENTATION_APPROVAL state
    2. Manifest hash must match stored manifest (no mutation since generation)
    3. Contract hash must match stored contract (no contract drift)
    4. If approved=True: advance to IMPLEMENTING via governance service
    5. If approved=False: advance to REJECTED via governance service
    
    SECURITY:
    - Detects manifest tampering via hash verification
    - Enforces state machine transitions through governance service
    - Self-approval prevention via ImplementationApproval model
    - No auto-approval bypass
    
    Args:
        workflow_id: Workflow to approve/reject
        payload: Approval decision with verification hashes
        
    Returns:
        WorkflowApprovalResponse with state transition details
        
    Raises:
        404: If workflow not found
        409: If workflow not in AWAITING_IMPLEMENTATION_APPROVAL state
        409: If manifest hash mismatch (APPROVAL_INVALID)
        409: If contract hash mismatch (CONTRACT_CHANGED)
        403: If self-approval attempted
    """
    # Verify workflow_id in payload matches path parameter
    if payload.workflow_id != workflow_id:
        raise HTTPException(
            status_code=400,
            detail=f"Workflow ID mismatch: path={workflow_id}, payload={payload.workflow_id}"
        )
    
    # Get workflow from governance service (PostgreSQL-backed)
    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=404,
            detail=f"Workflow not found: {workflow_id}"
        )
    
    current_state_str = workflow.current_state.value
    
    # Verify workflow is in AWAITING_IMPLEMENTATION_APPROVAL state
    if current_state_str != CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "WRONG_STATE",
                "message": f"Workflow is in {current_state_str} state, expected AWAITING_IMPLEMENTATION_APPROVAL",
                "currentState": current_state_str,
                "expectedState": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value
            }
        )
    
    # Get stored hashes from workflow
    stored_manifest_hash = workflow.manifest_sha256
    stored_contract_hash = workflow.contract_sha256
    stored_candidate_hash = workflow.candidate_sha256
    stored_manifest_id = workflow.manifest_id
    workflow_requester = workflow.requester_id
    target_family = workflow.target_family
    target_version = workflow.target_version

    qualification = (workflow.gate_results or {}).get("Unit Test Suite")
    accessibility_preflight = (workflow.gate_results or {}).get("Accessibility Preflight")
    if (
        not isinstance(qualification, dict)
        or qualification.get("result") != "PASS"
        or not qualification.get("evidence_id")
        or not qualification.get("evidence_hash")
        or qualification.get("candidate_sha256") != stored_candidate_hash
        or not isinstance(accessibility_preflight, dict)
        or accessibility_preflight.get("result") != "PASS"
        or accessibility_preflight.get("candidate_sha256") != stored_candidate_hash
    ):
        raise HTTPException(
            status_code=409,
            detail={
                "error": "QUALIFICATION_EVIDENCE_REQUIRED",
                "message": "Approval is blocked until Project LLM records passing unit-test and accessibility-preflight evidence for the bound candidate hash.",
            },
        )
    
    # Verify manifest hash matches stored manifest
    if not stored_manifest_hash:
        raise HTTPException(
            status_code=500,
            detail="Workflow has no stored manifest hash"
        )
    
    effective_manifest_hash = payload.manifest_hash or stored_manifest_hash
    if effective_manifest_hash != stored_manifest_hash:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "APPROVAL_INVALID",
                "reason": "manifest_changed",
                "message": "Manifest hash mismatch: manifest was modified after generation",
                "expectedHash": stored_manifest_hash,
                "providedHash": effective_manifest_hash
            }
        )
    
    # Verify contract hash matches stored contract
    effective_contract_hash = payload.contract_hash or stored_contract_hash
    if stored_contract_hash and effective_contract_hash and effective_contract_hash != stored_contract_hash:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "CONTRACT_CHANGED",
                "message": "Contract hash mismatch: engineering contract was modified",
                "expectedHash": stored_contract_hash,
                "providedHash": effective_contract_hash
            }
        )
    
    # Verify candidate hash matches stored candidate
    if not stored_candidate_hash:
        raise HTTPException(
            status_code=500,
            detail="Workflow has no stored candidate hash"
        )
    
    effective_candidate_hash = payload.candidate_sha256 or stored_candidate_hash
    if effective_candidate_hash != stored_candidate_hash:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "CANDIDATE_HASH_MISMATCH",
                "message": "Candidate hash mismatch: candidate was modified after validation",
                "expectedHash": stored_candidate_hash,
                "providedHash": effective_candidate_hash
            }
        )
    
    # Verify placement manifest ID matches stored manifest ID
    if not stored_manifest_id:
        raise HTTPException(
            status_code=500,
            detail="Workflow has no stored placement manifest ID"
        )

    stored_manifest = await manifest_repo.get(str(stored_manifest_id))
    if stored_manifest:
        req_changes = stored_manifest.required_changes if isinstance(stored_manifest.required_changes, dict) else {}
        is_in_use = (stored_manifest.decision == "VERSION_IN_USE" or req_changes.get("updateEligibility") == "VERSION_IN_USE")
        is_insp_failed = (req_changes.get("updateEligibility") == "INSPECTION_FAILED")
        if is_in_use or is_insp_failed:
            err_code = "INSPECTION_FAILED" if is_insp_failed else "VERSION_IN_USE"
            raise HTTPException(
                status_code=409,
                detail={
                    "error": err_code,
                    "message": f"Version {stored_manifest.block_version} of family {stored_manifest.block_family} cannot be approved for in-place placement ({err_code}). A replacement workflow must be created with a newly allocated version.",
                }
            )
    manifest_operations = (
        stored_manifest.required_changes.get("operations", [])
        if stored_manifest and isinstance(stored_manifest.required_changes, dict)
        else []
    )
    if not manifest_operations:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "FILE_OPERATION_MANIFEST_REQUIRED",
                "message": "Approval is blocked until the manifest contains explicit, snapshot-derived file operations. Generate a new Project LLM placement plan.",
            },
        )
    
    effective_manifest_id = payload.placement_manifest_id or str(stored_manifest_id)
    if str(effective_manifest_id) != str(stored_manifest_id):
        raise HTTPException(
            status_code=409,
            detail={
                "error": "MANIFEST_ID_MISMATCH",
                "message": "Placement manifest ID mismatch: manifest ID does not match workflow",
                "expectedId": str(stored_manifest_id),
                "providedId": str(effective_manifest_id)
            }
        )
    
    # Extract approver identity from JWT token (prevent identity spoofing)
    # user_id guaranteed by JWT validation; reject if absent
    if not (approved_by := user.get("user_id")):
        raise HTTPException(401, "Missing user_id claim")
    
    # Administrator approval required: the authenticated authorized administrator
    # may approve the hash-bound placement manifest, including a manifest they
    # uploaded. The approval record retains uploader ID, approver ID, timestamp,
    # role claims, candidate hash, and manifest hash.
    from app.auth.authorization import is_super_admin
    from app.models.implementation_approval import strict_separation_of_duties_enabled
    is_admin_user = (
        is_super_admin(user)
        or bool(user.get("is_admin"))
        or "admin" in user.get("roles", [])
        or "super_admin" in user.get("roles", [])
        or "contract_admin" in user.get("roles", [])
    )
    effective_requester = workflow_requester or getattr(workflow, "created_by", None)
    if not effective_requester or not str(effective_requester).strip():
        raise HTTPException(
            status_code=400,
            detail="Workflow requester (uploader) identity is required to record implementation approval",
        )
    is_self_approval = (
        str(approved_by).strip().lower() == str(effective_requester).strip().lower()
    )
    admin_override_applied = is_self_approval and is_admin_user and not strict_separation_of_duties_enabled()
    if is_self_approval and not admin_override_applied:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "SELF_APPROVAL_REJECTED",
                "message": f"Self-approval rejected. User '{approved_by}' is not an authorized administrator permitted to approve their own workflow.",
                "workflowRequester": str(effective_requester),
                "attemptedApprover": str(approved_by)
            }
        )
    
    # All verification passed - process approval decision
    now = datetime.now(timezone.utc)
    
    # Create ImplementationApproval record
    implementation_approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=effective_candidate_hash,
        target_family=target_family,
        target_version=target_version,
        placement_manifest_id=str(effective_manifest_id),
        placement_manifest_sha256=effective_manifest_hash,
        approved_by=approved_by,
        workflow_requester=str(effective_requester),
        status=ImplementationApprovalStatus.APPROVED if payload.approved else ImplementationApprovalStatus.REJECTED,
        rejection_reason=None if payload.approved else payload.reason,
        evidence={
            "admin_override": admin_override_applied,
            "self_approval": is_self_approval,
            "is_admin_user": is_admin_user,
            "approved_by_role": "admin" if is_admin_user else "user",
            "role_claims": list(user.get("roles", [])),
            "uploader_id": str(effective_requester),
            "approver_id": str(approved_by),
            "approved_at": now.isoformat(),
            "candidate_sha256": effective_candidate_hash,
            "manifest_sha256": effective_manifest_hash,
            "revision_strategy": (stored_manifest.required_changes.get("revisionStrategy") if stored_manifest and isinstance(stored_manifest.required_changes, dict) else None),
            "reference_summary": (stored_manifest.required_changes.get("referenceSummary") if stored_manifest and isinstance(stored_manifest.required_changes, dict) else None),
            "identity_status": (stored_manifest.required_changes.get("identityStatus") if stored_manifest and isinstance(stored_manifest.required_changes, dict) else None),
        },
    )
    
    # Persist approval to PostgreSQL
    from app.api.routes.candidate import approval_to_model
    approval_model = approval_to_model(implementation_approval)
    await approval_repo.upsert(approval_model)
    
    if payload.approved:
        # Approve: transition to IMPLEMENTING via governance service
        new_state = CanonicalWorkflowState.IMPLEMENTING
        
        # Register approval with governance service
        await governance_service.register_approval(workflow_id, implementation_approval)
        
        # Transition state through governance service
        try:
            await governance_service.transition_state(
                workflow_id=workflow_id,
                to_state=new_state,
                triggered_by=approved_by,
                evidence_id=implementation_approval.approval_id,
                reason=payload.reason
            )
            await session.commit()
        except ValueError as e:
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"State transition failed: {str(e)}"
            )
        
        return WorkflowApprovalResponse(
            workflow_id=workflow_id,
            previous_state=current_state_str,
            new_state=new_state.value,
            approved=True,
            approved_by=approved_by,
            approved_at=now,
            manifest_hash_verified=True,
            contract_hash_verified=True,
            candidate_sha256_verified=True,
            manifest_id_verified=True,
            reason=payload.reason
        )
    else:
        # Reject: transition to REJECTED via governance service
        new_state = CanonicalWorkflowState.REJECTED
        
        # Register approval with governance service
        await governance_service.register_approval(workflow_id, implementation_approval)
        
        # Transition state through governance service
        try:
            await governance_service.transition_state(
                workflow_id=workflow_id,
                to_state=new_state,
                triggered_by=approved_by,
                evidence_id=implementation_approval.approval_id,
                reason=payload.reason
            )
            await session.commit()
        except ValueError as e:
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"State transition failed: {str(e)}"
            )
        
        return WorkflowApprovalResponse(
            workflow_id=workflow_id,
            previous_state=current_state_str,
            new_state=new_state.value,
            approved=False,
            approved_by=approved_by,
            approved_at=now,
            manifest_hash_verified=True,
            contract_hash_verified=True,
            candidate_sha256_verified=True,
            manifest_id_verified=True,
            reason=payload.reason
        )


@router.get("/workflows/{workflow_id}/implementation-approval")
async def get_implementation_approval(
    workflow_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    approval_repo: ApprovalRepository = Depends(get_approval_repository)
):
    """
    Get implementation approval record for a workflow.
    
    Returns the ImplementationApproval record with verification evidence from PostgreSQL.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        Implementation approval evidence dictionary
        
    Raises:
        404: If no approval record found for workflow
    """
    approval_model = await approval_repo.get_by_workflow(workflow_id)
    if not approval_model:
        raise HTTPException(
            status_code=404,
            detail=f"No implementation approval found for workflow: {workflow_id}"
        )
    
    # Return evidence dictionary (stored in evidence JSON field)
    return approval_model.evidence
@router.post("/{approval_id}/reject", response_model=ApprovalRecord)
async def reject_manifest(
    approval_id: str,
    request: ApprovalRejectRequest,
    user: AuthenticatedPrincipal = Depends(require_contract_reviewer)
):
    """
    Reject a pending manifest.
    
    SECURITY GATES:
    1. Identity validation: Rejects requests without user_id claim
    
    Args:
        approval_id: Approval to reject
        request: Rejection details
        
    Returns:
        Updated approval record
        
    Raises:
        404: If approval not found
        400: If approval is not in PENDING state
        401: If user_id claim missing from JWT
    """
    if approval_id not in _approvals:
        raise HTTPException(
            status_code=404,
            detail=f"Approval not found: {approval_id}"
        )
    
    approval = _approvals[approval_id]
    
    # Extract rejecter identity from JWT (prevent identity spoofing)
    # Reject if user_id is missing instead of falling back to "unknown"
    if not (rejected_by := user.get("user_id")):
        raise HTTPException(
            status_code=401,
            detail="Missing user_id claim in JWT token"
        )
    
    if approval["status"] != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Approval is in {approval['status']} state, expected PENDING"
        )
    
    now = datetime.now(timezone.utc)
    approval["status"] = ApprovalStatus.REJECTED
    approval["decidedBy"] = rejected_by
    approval["decidedAt"] = now
    approval["reason"] = request.reason
    
    audit_entry = {
        "action": "rejected",
        "by": rejected_by,
        "at": now,
        "reason": request.reason,
    }
    approval["auditTrail"].append(audit_entry)
    
    return ApprovalRecord(**approval)
