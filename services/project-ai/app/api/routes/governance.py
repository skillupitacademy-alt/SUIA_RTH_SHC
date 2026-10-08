"""Governance endpoints for manifest-bound human approval workflow."""

from datetime import datetime, timezone
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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

router = APIRouter(prefix="/approvals", tags=["governance"])

# In-memory approval storage for M3 (production persistence in M3+)
_approvals: Dict[str, Dict] = {}

# In-memory workflow state storage (should match creation.py workflows store in production)
_workflow_states: Dict[str, Dict] = {}

# In-memory implementation approval storage for W4 (production persistence in M3+)
_implementation_approvals: Dict[str, ImplementationApproval] = {}

# M2.9 Wave 0: Canonical workflow governance service
governance_service = WorkflowGovernanceService()


@router.post("/submit", response_model=ApprovalSubmitResponse)
async def submit_for_approval(request: ApprovalSubmitRequest):
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
    
    audit_entry = {
        "action": "submitted",
        "by": request.submittedBy,
        "at": now,
        "reason": None,
    }
    
    approval = {
        "approvalId": approval_id,
        "manifestId": request.manifestId,
        "status": ApprovalStatus.PENDING,
        "submittedBy": request.submittedBy,
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
async def get_pending_approvals():
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
async def get_approval_status(approval_id: str):
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
async def approve_manifest(approval_id: str, request: ApprovalDecisionRequest):
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
        403: If self-approval attempted (Wave 2)
        409: If manifest hash does not match (manifest was mutated)
    """
    if approval_id not in _approvals:
        raise HTTPException(
            status_code=404,
            detail=f"Approval not found: {approval_id}"
        )
    
    approval = _approvals[approval_id]
    
    if approval["status"] != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Approval is in {approval['status']} state, expected PENDING"
        )
    
    # CRITICAL: Prevent self-approval (Wave 2)
    if request.decidedBy == approval["submittedBy"]:
        now = datetime.now(timezone.utc)
        
        approval["status"] = ApprovalStatus.REJECTED
        approval["decidedBy"] = request.decidedBy
        approval["decidedAt"] = now
        approval["reason"] = (
            f"Self-approval rejected. "
            f"User '{request.decidedBy}' cannot approve their own submission. "
            f"Separation of duties required."
        )
        
        audit_entry = {
            "action": "rejected_self_approval",
            "by": request.decidedBy,
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
                "attemptedBy": request.decidedBy
            }
        )
    
    # CRITICAL: Verify manifest hash matches submission
    if request.manifestHash != approval["manifestHash"]:
        now = datetime.now(timezone.utc)
        
        # Reject approval due to manifest mutation
        approval["status"] = ApprovalStatus.MANIFEST_CHANGED
        approval["decidedBy"] = request.decidedBy
        approval["decidedAt"] = now
        approval["reason"] = (
            f"Manifest hash mismatch detected. "
            f"Expected: {approval['manifestHash']}, "
            f"Got: {request.manifestHash}. "
            f"Manifest was mutated after submission."
        )
        
        audit_entry = {
            "action": "rejected_hash_mismatch",
            "by": request.decidedBy,
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
    approval["decidedBy"] = request.decidedBy
    approval["decidedAt"] = now
    approval["reason"] = request.reason
    
    audit_entry = {
        "action": "approved",
        "by": request.decidedBy,
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
    manifest_hash: str = Field(
        description="Manifest hash at time of review (must match stored manifest)",
        min_length=1
    )
    contract_hash: str = Field(
        description="Engineering contract hash (for verification)",
        min_length=1
    )
    candidate_sha256: str = Field(
        description="Candidate hash from ValidationResult (for verification)",
        min_length=1
    )
    placement_manifest_id: str = Field(
        description="Placement manifest ID (for binding verification)",
        min_length=1
    )
    approved: bool = Field(description="True to approve, False to reject")
    approved_by: str = Field(description="Identity of approver", min_length=1)
    reason: str = Field(description="Reason for approval or rejection")


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
async def approve_placement(workflow_id: str, payload: WorkflowApprovalPayload):
    """
    Approve or reject placement manifest for a workflow.
    
    **M2.9 Wave 0 Integration**: Uses WorkflowGovernanceService for canonical state management.
    
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
    
    # Get workflow from governance service
    workflow = governance_service.get_workflow(workflow_id)
    if not workflow:
        # Fallback: check legacy _workflow_states for backwards compatibility
        if workflow_id not in _workflow_states:
            raise HTTPException(
                status_code=404,
                detail=f"Workflow not found: {workflow_id}"
            )
        # Use legacy workflow state
        legacy_workflow = _workflow_states[workflow_id]
        current_state_str = legacy_workflow.get("state")
    else:
        # Use canonical workflow from governance service
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
    
    # Get stored hashes from governance service workflow or legacy workflow
    if workflow:
        stored_manifest_hash = workflow.manifest_sha256
        stored_contract_hash = workflow.contract_sha256
        stored_candidate_hash = workflow.candidate_sha256
        stored_manifest_id = workflow.manifest_id
        workflow_requester = workflow.requester_id
        target_family = workflow.target_family
        target_version = workflow.target_version
    else:
        legacy_workflow = _workflow_states[workflow_id]
        stored_manifest_hash = legacy_workflow.get("manifest_hash")
        stored_contract_hash = legacy_workflow.get("contract_hash")
        stored_candidate_hash = legacy_workflow.get("candidate_sha256")
        stored_manifest_id = legacy_workflow.get("placement_manifest_id")
        workflow_requester = legacy_workflow.get("requester")
        target_family = legacy_workflow.get("target_family", "")
        target_version = legacy_workflow.get("target_version", "")
    
    # Verify manifest hash matches stored manifest
    if not stored_manifest_hash:
        raise HTTPException(
            status_code=500,
            detail="Workflow has no stored manifest hash"
        )
    
    if payload.manifest_hash != stored_manifest_hash:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "APPROVAL_INVALID",
                "reason": "manifest_changed",
                "message": "Manifest hash mismatch: manifest was modified after generation",
                "expectedHash": stored_manifest_hash,
                "providedHash": payload.manifest_hash
            }
        )
    
    # Verify contract hash matches stored contract
    if stored_contract_hash and payload.contract_hash != stored_contract_hash:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "CONTRACT_CHANGED",
                "message": "Contract hash mismatch: engineering contract was modified",
                "expectedHash": stored_contract_hash,
                "providedHash": payload.contract_hash
            }
        )
    
    # Verify candidate hash matches stored candidate
    if not stored_candidate_hash:
        raise HTTPException(
            status_code=500,
            detail="Workflow has no stored candidate hash"
        )
    
    if payload.candidate_sha256 != stored_candidate_hash:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "CANDIDATE_HASH_MISMATCH",
                "message": "Candidate hash mismatch: candidate was modified after validation",
                "expectedHash": stored_candidate_hash,
                "providedHash": payload.candidate_sha256
            }
        )
    
    # Verify placement manifest ID matches stored manifest ID
    if not stored_manifest_id:
        raise HTTPException(
            status_code=500,
            detail="Workflow has no stored placement manifest ID"
        )
    
    if payload.placement_manifest_id != stored_manifest_id:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "MANIFEST_ID_MISMATCH",
                "message": "Placement manifest ID mismatch: manifest ID does not match workflow",
                "expectedId": stored_manifest_id,
                "providedId": payload.placement_manifest_id
            }
        )
    
    # Verify not self-approval (approver != workflow requester)
    if workflow_requester and payload.approved_by == workflow_requester:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "SELF_APPROVAL_REJECTED",
                "message": f"Self-approval rejected. User '{payload.approved_by}' cannot approve their own workflow. Separation of duties required.",
                "workflowRequester": workflow_requester,
                "attemptedApprover": payload.approved_by
            }
        )
    
    # All verification passed - process approval decision
    now = datetime.now(timezone.utc)
    
    # Create ImplementationApproval record
    implementation_approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=payload.candidate_sha256,
        target_family=target_family,
        target_version=target_version,
        placement_manifest_id=payload.placement_manifest_id,
        placement_manifest_sha256=payload.manifest_hash,
        approved_by=payload.approved_by,
        workflow_requester=workflow_requester,
        status=ImplementationApprovalStatus.APPROVED if payload.approved else ImplementationApprovalStatus.REJECTED,
        rejection_reason=None if payload.approved else payload.reason,
    )
    
    # Store approval record
    _implementation_approvals[workflow_id] = implementation_approval
    
    if payload.approved:
        # Approve: transition to IMPLEMENTING via governance service
        new_state = CanonicalWorkflowState.IMPLEMENTING
        
        if workflow:
            # Register approval with governance service
            governance_service.register_approval(workflow_id, implementation_approval)
            
            # Transition state through governance service
            try:
                governance_service.transition_state(
                    workflow_id=workflow_id,
                    to_state=new_state,
                    triggered_by=payload.approved_by,
                    evidence_id=implementation_approval.approval_id,
                    reason=payload.reason
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"State transition failed: {str(e)}"
                )
        else:
            # Legacy workflow: update _workflow_states dict
            if not is_valid_transition(CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL, new_state):
                raise HTTPException(
                    status_code=500,
                    detail=f"Invalid transition: AWAITING_IMPLEMENTATION_APPROVAL -> {new_state.value}"
                )
            legacy_workflow["state"] = new_state.value
            legacy_workflow["approved_by"] = payload.approved_by
            legacy_workflow["approved_at"] = now.isoformat()
            legacy_workflow["approval_reason"] = payload.reason
            legacy_workflow["implementation_approval_id"] = implementation_approval.approval_id
        
        return WorkflowApprovalResponse(
            workflow_id=workflow_id,
            previous_state=current_state_str,
            new_state=new_state.value,
            approved=True,
            approved_by=payload.approved_by,
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
        
        if workflow:
            # Register approval with governance service
            governance_service.register_approval(workflow_id, implementation_approval)
            
            # Transition state through governance service
            try:
                governance_service.transition_state(
                    workflow_id=workflow_id,
                    to_state=new_state,
                    triggered_by=payload.approved_by,
                    evidence_id=implementation_approval.approval_id,
                    reason=payload.reason
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"State transition failed: {str(e)}"
                )
        else:
            # Legacy workflow: update _workflow_states dict
            if not is_valid_transition(CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL, new_state):
                raise HTTPException(
                    status_code=500,
                    detail=f"Invalid transition: AWAITING_IMPLEMENTATION_APPROVAL -> {new_state.value}"
                )
            legacy_workflow["state"] = new_state.value
            legacy_workflow["rejected_by"] = payload.approved_by
            legacy_workflow["rejected_at"] = now.isoformat()
            legacy_workflow["rejection_reason"] = payload.reason
            legacy_workflow["implementation_approval_id"] = implementation_approval.approval_id
        
        return WorkflowApprovalResponse(
            workflow_id=workflow_id,
            previous_state=current_state_str,
            new_state=new_state.value,
            approved=False,
            approved_by=payload.approved_by,
            approved_at=now,
            manifest_hash_verified=True,
            contract_hash_verified=True,
            candidate_sha256_verified=True,
            manifest_id_verified=True,
            reason=payload.reason
        )


@router.get("/workflows/{workflow_id}/implementation-approval")
async def get_implementation_approval(workflow_id: str):
    """
    Get implementation approval record for a workflow.
    
    Returns the ImplementationApproval record with verification evidence.
    
    Args:
        workflow_id: Workflow identifier
        
    Returns:
        Implementation approval evidence dictionary
        
    Raises:
        404: If no approval record found for workflow
    """
    if workflow_id not in _implementation_approvals:
        raise HTTPException(
            status_code=404,
            detail=f"No implementation approval found for workflow: {workflow_id}"
        )
    
    approval = _implementation_approvals[workflow_id]
    return approval.to_evidence_dict()


# Helper function to register workflow in approval gate system
def register_workflow_for_approval(
    workflow_id: str,
    manifest_hash: str,
    contract_hash: str,
    initial_state: CanonicalWorkflowState = CanonicalWorkflowState.INTEGRATION_PLANNED
):
    """
    Register a workflow for implementation approval.
    
    Call this after PlacementManifest is generated and before transitioning
    to AWAITING_IMPLEMENTATION_APPROVAL state.
    
    Args:
        workflow_id: Unique workflow identifier
        manifest_hash: SHA-256 hash of placement manifest
        contract_hash: SHA-256 hash of engineering contract
        initial_state: Starting state (default: INTEGRATION_PLANNED)
    """
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": initial_state.value,
        "manifest_hash": manifest_hash,
        "contract_hash": contract_hash,
        "registered_at": datetime.now(timezone.utc).isoformat()
    }


# Helper function to transition workflow to AWAITING_IMPLEMENTATION_APPROVAL
def transition_to_approval_gate(workflow_id: str):
    """
    Transition workflow from INTEGRATION_PLANNED to AWAITING_IMPLEMENTATION_APPROVAL.
    
    This enforces the Wave 4 requirement that workflows MUST stop and await
    human approval before placement execution.
    
    Args:
        workflow_id: Workflow to transition
        
    Raises:
        ValueError: If workflow not found or not in INTEGRATION_PLANNED state
    """
    if workflow_id not in _workflow_states:
        raise ValueError(f"Workflow not registered: {workflow_id}")
    
    workflow = _workflow_states[workflow_id]
    current_state = workflow.get("state")
    
    if current_state != CanonicalWorkflowState.INTEGRATION_PLANNED.value:
        raise ValueError(
            f"Cannot transition to approval gate from {current_state}, "
            f"expected {CanonicalWorkflowState.INTEGRATION_PLANNED.value}"
        )
    
    new_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    if not is_valid_transition(CanonicalWorkflowState.INTEGRATION_PLANNED, new_state):
        raise ValueError(f"Invalid transition: {current_state} -> {new_state.value}")
    
    workflow["state"] = new_state.value
    workflow["transition_at"] = datetime.now(timezone.utc).isoformat()

@router.post("/{approval_id}/reject", response_model=ApprovalRecord)
async def reject_manifest(approval_id: str, request: ApprovalRejectRequest):
    """
    Reject a pending manifest.
    
    Args:
        approval_id: Approval to reject
        request: Rejection details
        
    Returns:
        Updated approval record
        
    Raises:
        404: If approval not found
        400: If approval is not in PENDING state
    """
    if approval_id not in _approvals:
        raise HTTPException(
            status_code=404,
            detail=f"Approval not found: {approval_id}"
        )
    
    approval = _approvals[approval_id]
    
    if approval["status"] != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Approval is in {approval['status']} state, expected PENDING"
        )
    
    now = datetime.now(timezone.utc)
    approval["status"] = ApprovalStatus.REJECTED
    approval["decidedBy"] = request.rejectedBy
    approval["decidedAt"] = now
    approval["reason"] = request.reason
    
    audit_entry = {
        "action": "rejected",
        "by": request.rejectedBy,
        "at": now,
        "reason": request.reason,
    }
    approval["auditTrail"].append(audit_entry)
    
    return ApprovalRecord(**approval)
