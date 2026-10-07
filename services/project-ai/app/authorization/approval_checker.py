"""
Implementation Approval Authorization Checker - M2.9 Wave 4

Authorization hook for placement executor to verify implementation approval.

CRITICAL RULE:
Placement executor MUST call check_implementation_approval() before any
repository mutation. Executor MUST abort if authorized=False.

AUTHORIZATION GATES:
- Approval must exist for workflow_id
- Approval status must be APPROVED
- Candidate hash must match
- Manifest hash must match
- Must not be self-approved
- Must not be expired (if expiry exists in approval model)

NO GRACEFUL DEGRADATION:
Missing or invalid approval MUST return authorized=False, NOT warning-then-True.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
)


@dataclass
class AuthorizationResult:
    """
    Result of implementation approval authorization check.
    
    Used by placement executor to determine if repository mutation is authorized.
    """
    
    authorized: bool
    approval_id: Optional[str]
    checked_at: str  # ISO 8601 timestamp
    failure_reason: Optional[str]
    evidence: Dict[str, Any] = field(default_factory=dict)


def check_implementation_approval(
    workflow_id: str,
    candidate_sha256: str,
    manifest_sha256: str,
    approvals_store: Dict[str, ImplementationApproval],
    requester_id: str = ""
) -> AuthorizationResult:
    """
    Check if implementation is authorized for a workflow.
    
    PLACEMENT EXECUTOR CONTRACT:
    - Executor MUST call this before any repository write
    - Executor MUST abort if authorized=False
    - Executor MUST NOT proceed with graceful degradation
    
    AUTHORIZATION CHECKS:
    1. Approval record exists for workflow_id
    2. Approval status is APPROVED
    3. Candidate hash matches approval record
    4. Manifest hash matches approval record
    5. Not self-approved (if requester_id provided)
    
    Args:
        workflow_id: Workflow identifier
        candidate_sha256: Candidate hash to verify
        manifest_sha256: Placement manifest hash to verify
        approvals_store: Dictionary of ImplementationApproval records
        requester_id: Workflow requester identity (optional, for self-approval check)
        
    Returns:
        AuthorizationResult with authorization decision and evidence
    """
    checked_at = datetime.now(timezone.utc).isoformat()
    
    # Check if approval exists
    if workflow_id not in approvals_store:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason=f"No implementation approval found for workflow {workflow_id}",
            evidence={
                "workflow_id": workflow_id,
                "approval_found": False,
                "checked_at": checked_at,
            }
        )
    
    approval = approvals_store[workflow_id]
    
    # Check approval status
    if approval.status != ImplementationApprovalStatus.APPROVED:
        return AuthorizationResult(
            authorized=False,
            approval_id=approval.approval_id,
            checked_at=checked_at,
            failure_reason=f"Approval status is {approval.status.value}, expected APPROVED",
            evidence={
                "workflow_id": workflow_id,
                "approval_id": approval.approval_id,
                "approval_found": True,
                "status": approval.status.value,
                "status_check": "FAIL",
                "checked_at": checked_at,
            }
        )
    
    # Verify candidate hash
    if not approval.verify_candidate_hash(candidate_sha256):
        return AuthorizationResult(
            authorized=False,
            approval_id=approval.approval_id,
            checked_at=checked_at,
            failure_reason=(
                f"Candidate hash mismatch: "
                f"expected {approval.candidate_sha256}, got {candidate_sha256}"
            ),
            evidence={
                "workflow_id": workflow_id,
                "approval_id": approval.approval_id,
                "approval_found": True,
                "status": approval.status.value,
                "candidate_hash_check": "FAIL",
                "expected_candidate_hash": approval.candidate_sha256,
                "provided_candidate_hash": candidate_sha256,
                "checked_at": checked_at,
            }
        )
    
    # Verify manifest hash
    if not approval.verify_manifest_hash(manifest_sha256):
        return AuthorizationResult(
            authorized=False,
            approval_id=approval.approval_id,
            checked_at=checked_at,
            failure_reason=(
                f"Manifest hash mismatch: "
                f"expected {approval.placement_manifest_sha256}, got {manifest_sha256}"
            ),
            evidence={
                "workflow_id": workflow_id,
                "approval_id": approval.approval_id,
                "approval_found": True,
                "status": approval.status.value,
                "manifest_hash_check": "FAIL",
                "expected_manifest_hash": approval.placement_manifest_sha256,
                "provided_manifest_hash": manifest_sha256,
                "checked_at": checked_at,
            }
        )
    
    # Verify not self-approved (if requester_id provided)
    if requester_id and not approval.verify_not_self_approved(requester_id):
        return AuthorizationResult(
            authorized=False,
            approval_id=approval.approval_id,
            checked_at=checked_at,
            failure_reason=(
                f"Self-approval detected: "
                f"approver '{approval.approved_by}' is the workflow requester"
            ),
            evidence={
                "workflow_id": workflow_id,
                "approval_id": approval.approval_id,
                "approval_found": True,
                "status": approval.status.value,
                "self_approval_check": "FAIL",
                "approved_by": approval.approved_by,
                "workflow_requester": requester_id,
                "checked_at": checked_at,
            }
        )
    
    # All checks passed - authorized
    return AuthorizationResult(
        authorized=True,
        approval_id=approval.approval_id,
        checked_at=checked_at,
        failure_reason=None,
        evidence={
            "workflow_id": workflow_id,
            "approval_id": approval.approval_id,
            "approval_found": True,
            "status": approval.status.value,
            "status_check": "PASS",
            "candidate_hash_check": "PASS",
            "manifest_hash_check": "PASS",
            "self_approval_check": "PASS" if requester_id else "SKIPPED",
            "candidate_sha256": approval.candidate_sha256,
            "manifest_sha256": approval.placement_manifest_sha256,
            "approved_by": approval.approved_by,
            "approval_timestamp": approval.approval_timestamp,
            "checked_at": checked_at,
        }
    )


def produce_authorization_evidence(
    result: AuthorizationResult,
    workflow_id: str
) -> Dict[str, Any]:
    """
    Convert AuthorizationResult to machine-readable evidence format.
    
    Follows W3 evidence pattern: all fields populated, no empty dicts on success.
    
    Args:
        result: AuthorizationResult from check_implementation_approval
        workflow_id: Workflow identifier
        
    Returns:
        Machine-readable evidence dictionary
    """
    evidence = {
        "workflow_id": workflow_id,
        "authorization_check": {
            "authorized": result.authorized,
            "approval_id": result.approval_id,
            "checked_at": result.checked_at,
            "failure_reason": result.failure_reason,
        },
        "verification_details": result.evidence,
        "timestamp": result.checked_at,
    }
    
    return evidence
