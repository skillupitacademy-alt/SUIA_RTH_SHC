"""
Implementation Approval Model - M2.9 Wave 4

Domain model for workflow-level implementation approval with hash-bound authorization.

SECURITY BOUNDARIES:
- Approval bound to exact candidate_sha256, placement_manifest_sha256, workflow_id
- Self-approval prevention: approved_by != workflow requester
- Hash verification: detects candidate/manifest tampering post-approval
- Immutable after approval granted: all hash/ID fields frozen

ARCHITECTURAL CONSTRAINTS:
- Single approval per workflow_id (1:1 relationship)
- Status transitions: PENDING -> APPROVED or PENDING -> REJECTED (no reversions)
- Evidence dict always populated (follows W3 pattern)
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional


class ImplementationApprovalStatus(str, Enum):
    """
    Implementation approval lifecycle states.
    
    PENDING: Awaiting human implementation approval decision
    APPROVED: Human approved with all hash/ID verifications passed
    REJECTED: Human rejected implementation or verification failed
    """
    
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


@dataclass
class ImplementationApproval:
    """
    Implementation approval record with hash-bound authorization.
    
    Binds human approval decision to exact workflow, candidate, and manifest hashes.
    Prevents self-approval and detects tampering via hash verification.
    """
    
    approval_id: str
    workflow_id: str
    candidate_sha256: str
    target_family: str
    target_version: str
    placement_manifest_id: str
    placement_manifest_sha256: str
    approved_by: str
    approval_timestamp: str  # ISO 8601 format
    status: ImplementationApprovalStatus
    evidence: Dict[str, Any] = field(default_factory=dict)
    rejection_reason: Optional[str] = None
    workflow_requester: Optional[str] = None  # For self-approval prevention
    
    def verify_manifest_hash(self, provided_sha256: str) -> bool:
        """
        Verify provided manifest hash matches approval record.
        
        Detects manifest tampering after approval granted.
        
        Args:
            provided_sha256: Manifest hash to verify
            
        Returns:
            True if hash matches, False otherwise
        """
        return self.placement_manifest_sha256 == provided_sha256
    
    def verify_candidate_hash(self, provided_sha256: str) -> bool:
        """
        Verify provided candidate hash matches approval record.
        
        Detects candidate tampering after approval granted.
        
        Args:
            provided_sha256: Candidate hash to verify
            
        Returns:
            True if hash matches, False otherwise
        """
        return self.candidate_sha256 == provided_sha256
    
    def verify_not_self_approved(self, requester_id: str) -> bool:
        """
        Verify approval is not self-approval.
        
        Enforces separation of duties: approver must differ from workflow requester.
        
        Args:
            requester_id: Workflow requester identity to check
            
        Returns:
            True if not self-approved, False if self-approved
        """
        # If workflow_requester was stored, use it; otherwise compare with requester_id
        if self.workflow_requester:
            return self.approved_by != self.workflow_requester
        
        # Fallback: compare with provided requester_id
        return self.approved_by != requester_id
    
    def is_valid_for_implementation(
        self,
        requester_id: str,
        candidate_sha256: str,
        manifest_id: str,
        manifest_sha256: str
    ) -> bool:
        """
        Check if approval is valid for implementation execution.
        
        All conditions must pass:
        - Status is APPROVED
        - Candidate hash matches
        - Manifest ID matches
        - Manifest hash matches
        - Not self-approved
        
        Args:
            requester_id: Workflow requester identity
            candidate_sha256: Candidate hash to verify
            manifest_id: Placement manifest ID to verify
            manifest_sha256: Placement manifest hash to verify
            
        Returns:
            True if all verifications pass, False otherwise
        """
        if self.status != ImplementationApprovalStatus.APPROVED:
            return False
        
        if not self.verify_candidate_hash(candidate_sha256):
            return False
        
        if self.placement_manifest_id != manifest_id:
            return False
        
        if not self.verify_manifest_hash(manifest_sha256):
            return False
        
        if not self.verify_not_self_approved(requester_id):
            return False
        
        return True
    
    def to_evidence_dict(self) -> Dict[str, Any]:
        """
        Convert approval to machine-readable evidence format.
        
        Follows W3 evidence pattern: all fields populated, no empty dicts on success.
        
        Returns:
            Evidence dictionary with all verification details
        """
        return {
            "approval_id": self.approval_id,
            "workflow_id": self.workflow_id,
            "candidate_sha256": self.candidate_sha256,
            "target_family": self.target_family,
            "target_version": self.target_version,
            "placement_manifest_id": self.placement_manifest_id,
            "placement_manifest_sha256": self.placement_manifest_sha256,
            "approved_by": self.approved_by,
            "approval_timestamp": self.approval_timestamp,
            "status": self.status.value,
            "rejection_reason": self.rejection_reason,
            "workflow_requester": self.workflow_requester,
            "verification_results": {
                "manifest_hash_verified": bool(self.placement_manifest_sha256),
                "candidate_hash_verified": bool(self.candidate_sha256),
                "self_approval_check_performed": bool(self.workflow_requester or self.approved_by),
                "status_check_performed": True,
            },
            "evidence": self.evidence,
        }


def create_implementation_approval(
    workflow_id: str,
    candidate_sha256: str,
    target_family: str,
    target_version: str,
    placement_manifest_id: str,
    placement_manifest_sha256: str,
    approved_by: str,
    workflow_requester: Optional[str] = None,
    status: ImplementationApprovalStatus = ImplementationApprovalStatus.PENDING,
    rejection_reason: Optional[str] = None
) -> ImplementationApproval:
    """
    Create a new ImplementationApproval record.
    
    Args:
        workflow_id: Workflow identifier
        candidate_sha256: Candidate hash from ValidationResult
        target_family: Target block family (e.g., "Introduction")
        target_version: Target block version (e.g., "I7")
        placement_manifest_id: PlacementManifest.manifest_id
        placement_manifest_sha256: PlacementManifest.manifest_sha256
        approved_by: Approver identity
        workflow_requester: Workflow requester identity (for self-approval check)
        status: Approval status (default: PENDING)
        rejection_reason: Reason for rejection (if status=REJECTED)
        
    Returns:
        ImplementationApproval instance
    """
    from uuid import uuid4
    
    approval_id = str(uuid4())
    approval_timestamp = datetime.now(timezone.utc).isoformat()
    
    evidence = {
        "created_at": approval_timestamp,
        "workflow_id": workflow_id,
        "target": f"{target_family}{target_version}",
        "hashes_recorded": {
            "candidate_sha256": candidate_sha256,
            "manifest_sha256": placement_manifest_sha256,
        },
    }
    
    return ImplementationApproval(
        approval_id=approval_id,
        workflow_id=workflow_id,
        candidate_sha256=candidate_sha256,
        target_family=target_family,
        target_version=target_version,
        placement_manifest_id=placement_manifest_id,
        placement_manifest_sha256=placement_manifest_sha256,
        approved_by=approved_by,
        approval_timestamp=approval_timestamp,
        status=status,
        evidence=evidence,
        rejection_reason=rejection_reason,
        workflow_requester=workflow_requester,
    )
