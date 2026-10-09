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

NO GRACEFUL DEGRADATION:
Missing or invalid approval MUST return authorized=False, NOT warning-then-True.

R3 PERSISTENCE:
- check_implementation_approval_async() accepts ApprovalRepository for async database queries
- check_implementation_approval() is legacy dict-based version for backward compatibility with tests
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


async def check_implementation_approval_async(
    workflow_id: str,
    candidate_sha256: str,
    manifest_sha256: str,
    approval_repo,  # ApprovalRepository protocol
    requester_id: str
) -> AuthorizationResult:
    """
    Check if implementation is authorized for a workflow (async, repository-based).
    
    PLACEMENT EXECUTOR CONTRACT:
    - Executor MUST call this before any repository write
    - Executor MUST abort if authorized=False
    - Executor MUST NOT proceed with graceful degradation
    
    AUTHORIZATION CHECKS:
    1. Approval record exists for workflow_id
    2. Approval status is APPROVED
    3. Candidate hash matches approval record (REQUIRED)
    4. Manifest hash matches approval record (REQUIRED)
    5. Not self-approved (REQUIRED - requester_id must be provided)
    
    Args:
        workflow_id: Workflow identifier
        candidate_sha256: Candidate hash to verify (REQUIRED)
        manifest_sha256: Placement manifest hash to verify (REQUIRED)
        approval_repo: ApprovalRepository instance for database queries
        requester_id: Workflow requester identity (REQUIRED for self-approval check)
        
    Returns:
        AuthorizationResult with authorization decision and evidence
    """
    checked_at = datetime.now(timezone.utc).isoformat()
    
    # Validate required parameters
    if not candidate_sha256:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason="Missing required parameter: candidate_sha256",
            evidence={
                "workflow_id": workflow_id,
                "parameter_validation": "FAIL",
                "missing_parameter": "candidate_sha256",
                "checked_at": checked_at,
            }
        )
    
    if not manifest_sha256:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason="Missing required parameter: manifest_sha256",
            evidence={
                "workflow_id": workflow_id,
                "parameter_validation": "FAIL",
                "missing_parameter": "manifest_sha256",
                "checked_at": checked_at,
            }
        )
    
    if not requester_id:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason="Missing required parameter: requester_id",
            evidence={
                "workflow_id": workflow_id,
                "parameter_validation": "FAIL",
                "missing_parameter": "requester_id",
                "checked_at": checked_at,
            }
        )
    
    # Load approval from database
    approval_model = await approval_repo.get_by_workflow(workflow_id)
    
    # Check if approval exists
    if approval_model is None:
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
    
    # Convert ORM model to domain model
    approval = ImplementationApproval(
        approval_id=approval_model.approval_id,
        workflow_id=approval_model.workflow_id,
        candidate_sha256=approval_model.candidate_sha256,
        placement_manifest_id=approval_model.placement_manifest_id,
        placement_manifest_sha256=approval_model.placement_manifest_sha256,
        target_family=approval_model.target_family,
        target_version=approval_model.target_version,
        approved_by=approval_model.approved_by,
        approval_timestamp=approval_model.approval_timestamp,
        status=ImplementationApprovalStatus(approval_model.status),
        workflow_requester=approval_model.workflow_requester,
        evidence=approval_model.evidence or {},
        rejection_reason=approval_model.rejection_reason
    )
    
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
    
    # Verify not self-approved (REQUIRED - no longer optional)
    if not approval.verify_not_self_approved(requester_id):
        return AuthorizationResult(
            authorized=False,
            approval_id=approval.approval_id,
            checked_at=checked_at,
            failure_reason=(
                f"Self-approval detected or workflow requester missing"
            ),
            evidence={
                "workflow_id": workflow_id,
                "approval_id": approval.approval_id,
                "approval_found": True,
                "status": approval.status.value,
                "self_approval_check": "FAIL",
                "approved_by": approval.approved_by,
                "workflow_requester": approval.workflow_requester,
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
            "self_approval_check": "PASS",
            "candidate_sha256": approval.candidate_sha256,
            "manifest_sha256": approval.placement_manifest_sha256,
            "approved_by": approval.approved_by,
            "workflow_requester": approval.workflow_requester,
            "approval_timestamp": approval.approval_timestamp,
            "checked_at": checked_at,
        }
    )




def check_implementation_approval(
    workflow_id: str,
    candidate_sha256: str,
    manifest_sha256: str,
    approvals_store: Dict[str, ImplementationApproval],
    requester_id: str
) -> AuthorizationResult:
    """
    Check if implementation is authorized for a workflow (legacy dict-based version).
    
    DEPRECATED: Use check_implementation_approval_async() with ApprovalRepository instead.
    This function is kept for backward compatibility with existing tests.
    
    PLACEMENT EXECUTOR CONTRACT:
    - Executor MUST call this before any repository write
    - Executor MUST abort if authorized=False
    - Executor MUST NOT proceed with graceful degradation
    
    AUTHORIZATION CHECKS:
    1. Approval record exists for workflow_id
    2. Approval status is APPROVED
    3. Candidate hash matches approval record (REQUIRED)
    4. Manifest hash matches approval record (REQUIRED)
    5. Not self-approved (REQUIRED - requester_id must be provided)
    
    Args:
        workflow_id: Workflow identifier
        candidate_sha256: Candidate hash to verify (REQUIRED)
        manifest_sha256: Placement manifest hash to verify (REQUIRED)
        approvals_store: Dictionary of ImplementationApproval records
        requester_id: Workflow requester identity (REQUIRED for self-approval check)
        
    Returns:
        AuthorizationResult with authorization decision and evidence
    """
    checked_at = datetime.now(timezone.utc).isoformat()
    
    # Validate required parameters
    if not candidate_sha256:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason="Missing required parameter: candidate_sha256",
            evidence={
                "workflow_id": workflow_id,
                "parameter_validation": "FAIL",
                "missing_parameter": "candidate_sha256",
                "checked_at": checked_at,
            }
        )
    
    if not manifest_sha256:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason="Missing required parameter: manifest_sha256",
            evidence={
                "workflow_id": workflow_id,
                "parameter_validation": "FAIL",
                "missing_parameter": "manifest_sha256",
                "checked_at": checked_at,
            }
        )
    
    if not requester_id:
        return AuthorizationResult(
            authorized=False,
            approval_id=None,
            checked_at=checked_at,
            failure_reason="Missing required parameter: requester_id",
            evidence={
                "workflow_id": workflow_id,
                "parameter_validation": "FAIL",
                "missing_parameter": "requester_id",
                "checked_at": checked_at,
            }
        )
    
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
    
    # Verify not self-approved (REQUIRED - no longer optional)
    if not approval.verify_not_self_approved(requester_id):
        return AuthorizationResult(
            authorized=False,
            approval_id=approval.approval_id,
            checked_at=checked_at,
            failure_reason=(
                f"Self-approval detected or workflow requester missing"
            ),
            evidence={
                "workflow_id": workflow_id,
                "approval_id": approval.approval_id,
                "approval_found": True,
                "status": approval.status.value,
                "self_approval_check": "FAIL",
                "approved_by": approval.approved_by,
                "workflow_requester": approval.workflow_requester,
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
            "self_approval_check": "PASS",
            "candidate_sha256": approval.candidate_sha256,
            "manifest_sha256": approval.placement_manifest_sha256,
            "approved_by": approval.approved_by,
            "workflow_requester": approval.workflow_requester,
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
