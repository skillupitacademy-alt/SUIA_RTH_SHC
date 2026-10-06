"""Governance endpoints for manifest-bound human approval workflow."""

from datetime import datetime, timezone
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.api.schemas.governance import (
    ApprovalDecisionRequest,
    ApprovalRecord,
    ApprovalRejectRequest,
    ApprovalSubmitRequest,
    ApprovalSubmitResponse,
    AuditTrailEntry,
)
from app.models.governance import ApprovalStatus

router = APIRouter(prefix="/approvals", tags=["governance"])

# In-memory approval storage for M3 (production persistence in M3+)
_approvals: Dict[str, Dict] = {}


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
    
    CRITICAL SECURITY GATE: Verifies that the manifestHash provided at approval
    time matches the hash bound at submission. If they differ, the manifest has
    been mutated and approval is REJECTED with status MANIFEST_CHANGED.
    
    This prevents time-of-check-time-of-use attacks where a manifest is approved
    but different content is deployed.
    
    Args:
        approval_id: Approval to decide
        request: Decision details including manifest hash for verification
        
    Returns:
        Updated approval record
        
    Raises:
        404: If approval not found
        400: If approval is not in PENDING state
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
    
    # Hash verified: approve
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
