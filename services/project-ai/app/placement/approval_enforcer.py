"""
Approval Enforcement Layer for Placement Operations - M2.9 Wave 5

Integrates with existing authorization.approval_checker to enforce implementation
approval before ANY placement mutation.

CRITICAL INVARIANTS:
- MUST call enforce_approval() before any repository mutation
- MUST abort placement if approved=False
- NO graceful degradation on approval failure
- ALL binding checks must pass: workflow_id, candidate_sha256, manifest_id, manifest_sha256
- Self-approval check MUST be enforced (requester != approver)

FAIL-CLOSED POLICY:
- Missing field = BLOCKED
- Invalid hash = BLOCKED
- Self-approved = BLOCKED
- Status != APPROVED = BLOCKED
- Missing approval = BLOCKED

R3 PERSISTENCE:
- ApprovalEnforcer can now accept ApprovalRepository for async database queries
- Legacy dict-based constructor kept for backward compatibility with tests
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union

from app.authorization.approval_checker import (
    check_implementation_approval,
    check_implementation_approval_async,
    AuthorizationResult,
)
from app.models.implementation_approval import ImplementationApproval


@dataclass
class ApprovalEnforcementResult:
    """
    Result of approval enforcement check.
    
    Used by placement executor to determine if mutation is authorized.
    """
    
    approved: bool
    reason: str
    bindings_verified: Dict[str, bool]
    approval_id: Optional[str]
    checked_at: str
    authorization_evidence: Dict[str, Any]


class ApprovalEnforcer:
    """
    Enforces implementation approval before placement mutations.
    
    Wraps authorization.approval_checker with placement-specific interface.
    """
    
    def __init__(
        self,
        approvals_store: Optional[Dict[str, ImplementationApproval]] = None,
        approval_repo = None  # ApprovalRepository protocol
    ):
        """
        Initialize approval enforcer.
        
        Args:
            approvals_store: Dictionary of ImplementationApproval records by workflow_id (legacy)
            approval_repo: ApprovalRepository instance for async database queries (preferred)
            
        Note:
            If approval_repo is provided, use enforce_approval_async().
            If approvals_store is provided, use enforce_approval().
        """
        self.approvals_store = approvals_store
        self.approval_repo = approval_repo
    
    def enforce_approval(
        self,
        workflow_id: str,
        candidate_sha256: str,
        manifest_id: str,
        manifest_sha256: str,
        requester_id: str
    ) -> ApprovalEnforcementResult:
        """
        Enforce implementation approval for placement operation.
        
        ALL checks must pass:
        1. workflow_id binding matches
        2. candidate_sha256 binding matches
        3. manifest_id binding matches
        4. manifest_sha256 binding matches
        5. approval.status == APPROVED
        6. Not self-approved (requester != approver)
        7. Not expired (if expiry implemented)
        
        FAIL-CLOSED: Missing field or failed check = BLOCKED
        
        Args:
            workflow_id: Workflow identifier (must match approval record)
            candidate_sha256: Candidate hash (must match approval record)
            manifest_id: Placement manifest ID (must match approval record)
            manifest_sha256: Placement manifest hash (must match approval record)
            requester_id: Workflow requester identity (for self-approval check)
            
        Returns:
            ApprovalEnforcementResult with authorization decision and binding verification
        """
        checked_at = datetime.now(timezone.utc).isoformat()
        
        # Validate required parameters (fail-closed)
        if not workflow_id:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: workflow_id",
                bindings_verified={
                    "workflow_id": False,
                    "candidate_sha256": False,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "parameter_validation": "FAIL",
                    "missing_parameter": "workflow_id",
                }
            )
        
        if not candidate_sha256:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: candidate_sha256",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": False,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "candidate_sha256",
                }
            )
        
        if not manifest_id:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: manifest_id",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": True,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "candidate_sha256": candidate_sha256,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "manifest_id",
                }
            )
        
        if not manifest_sha256:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: manifest_sha256",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": True,
                    "manifest_id": True,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "candidate_sha256": candidate_sha256,
                    "manifest_id": manifest_id,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "manifest_sha256",
                }
            )
        
        if not requester_id:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: requester_id (required for self-approval check)",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": True,
                    "manifest_id": True,
                    "manifest_sha256": True,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "candidate_sha256": candidate_sha256,
                    "manifest_id": manifest_id,
                    "manifest_sha256": manifest_sha256,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "requester_id",
                }
            )
        
        # Check if approval exists
        if workflow_id not in self.approvals_store:
            return ApprovalEnforcementResult(
                approved=False,
                reason=f"No implementation approval found for workflow {workflow_id}",
                bindings_verified={
                    "workflow_id": False,
                    "candidate_sha256": False,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "approval_found": False,
                }
            )
        
        approval = self.approvals_store[workflow_id]
        
        # Verify manifest_id binding (not checked by approval_checker)
        manifest_id_match = approval.placement_manifest_id == manifest_id
        
        # Call existing approval_checker for core authorization checks
        auth_result: AuthorizationResult = check_implementation_approval(
            workflow_id=workflow_id,
            candidate_sha256=candidate_sha256,
            manifest_sha256=manifest_sha256,
            approvals_store=self.approvals_store,
            requester_id=requester_id
        )
        
        # Combine manifest_id check with authorization result
        all_checks_passed = auth_result.authorized and manifest_id_match
        
        if not manifest_id_match:
            reason = (
                f"Manifest ID mismatch: "
                f"expected {approval.placement_manifest_id}, got {manifest_id}"
            )
        else:
            reason = auth_result.failure_reason or "All approval checks passed"
        
        bindings_verified = {
            "workflow_id": workflow_id in self.approvals_store,
            "candidate_sha256": auth_result.authorized and "candidate_hash_check" in auth_result.evidence.get("candidate_hash_check", "") if isinstance(auth_result.evidence.get("candidate_hash_check"), str) else auth_result.evidence.get("candidate_hash_check") == "PASS",
            "manifest_id": manifest_id_match,
            "manifest_sha256": auth_result.authorized and "manifest_hash_check" in auth_result.evidence.get("manifest_hash_check", "") if isinstance(auth_result.evidence.get("manifest_hash_check"), str) else auth_result.evidence.get("manifest_hash_check") == "PASS",
            "self_approval_check": auth_result.authorized and "self_approval_check" in auth_result.evidence.get("self_approval_check", "") if isinstance(auth_result.evidence.get("self_approval_check"), str) else auth_result.evidence.get("self_approval_check") == "PASS",
        }
        
        # Build authorization evidence
        authorization_evidence = {
            "workflow_id": workflow_id,
            "approval_id": auth_result.approval_id,
            "approval_found": workflow_id in self.approvals_store,
            "checked_at": checked_at,
            "authorization_result": {
                "authorized": auth_result.authorized,
                "failure_reason": auth_result.failure_reason,
            },
            "bindings_verified": bindings_verified,
            "verification_details": auth_result.evidence,
            "manifest_id_verification": {
                "expected": approval.placement_manifest_id,
                "provided": manifest_id,
                "match": manifest_id_match,
            }
        }
        
        return ApprovalEnforcementResult(
            approved=all_checks_passed,
            reason=reason,
            bindings_verified=bindings_verified,
            approval_id=auth_result.approval_id,
            checked_at=checked_at,
            authorization_evidence=authorization_evidence
        )
    
    async def enforce_approval_async(
        self,
        workflow_id: str,
        candidate_sha256: str,
        manifest_id: str,
        manifest_sha256: str,
        requester_id: str
    ) -> ApprovalEnforcementResult:
        """
        Enforce implementation approval for placement operation (async, repository-based).
        
        ALL checks must pass:
        1. workflow_id binding matches
        2. candidate_sha256 binding matches
        3. manifest_id binding matches
        4. manifest_sha256 binding matches
        5. approval.status == APPROVED
        6. Not self-approved (requester != approver)
        7. Not expired (if expiry implemented)
        
        FAIL-CLOSED: Missing field or failed check = BLOCKED
        
        Args:
            workflow_id: Workflow identifier (must match approval record)
            candidate_sha256: Candidate hash (must match approval record)
            manifest_id: Placement manifest ID (must match approval record)
            manifest_sha256: Placement manifest hash (must match approval record)
            requester_id: Workflow requester identity (for self-approval check)
            
        Returns:
            ApprovalEnforcementResult with authorization decision and binding verification
            
        Raises:
            ValueError: If approval_repo not provided during initialization
        """
        if self.approval_repo is None:
            raise ValueError("ApprovalEnforcer initialized without approval_repo - cannot use enforce_approval_async")
        
        checked_at = datetime.now(timezone.utc).isoformat()
        
        # Validate required parameters (fail-closed)
        if not workflow_id:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: workflow_id",
                bindings_verified={
                    "workflow_id": False,
                    "candidate_sha256": False,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "parameter_validation": "FAIL",
                    "missing_parameter": "workflow_id",
                }
            )
        
        if not candidate_sha256:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: candidate_sha256",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": False,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "candidate_sha256",
                }
            )
        
        if not manifest_id:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: manifest_id",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": True,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "candidate_sha256": candidate_sha256,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "manifest_id",
                }
            )
        
        if not manifest_sha256:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: manifest_sha256",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": True,
                    "manifest_id": True,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "candidate_sha256": candidate_sha256,
                    "manifest_id": manifest_id,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "manifest_sha256",
                }
            )
        
        if not requester_id:
            return ApprovalEnforcementResult(
                approved=False,
                reason="Missing required parameter: requester_id (required for self-approval check)",
                bindings_verified={
                    "workflow_id": True,
                    "candidate_sha256": True,
                    "manifest_id": True,
                    "manifest_sha256": True,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "candidate_sha256": candidate_sha256,
                    "manifest_id": manifest_id,
                    "manifest_sha256": manifest_sha256,
                    "parameter_validation": "FAIL",
                    "missing_parameter": "requester_id",
                }
            )
        
        # Load approval from database
        approval_model = await self.approval_repo.get_by_workflow(workflow_id)
        
        # Check if approval exists
        if approval_model is None:
            return ApprovalEnforcementResult(
                approved=False,
                reason=f"No implementation approval found for workflow {workflow_id}",
                bindings_verified={
                    "workflow_id": False,
                    "candidate_sha256": False,
                    "manifest_id": False,
                    "manifest_sha256": False,
                    "self_approval_check": False,
                },
                approval_id=None,
                checked_at=checked_at,
                authorization_evidence={
                    "workflow_id": workflow_id,
                    "approval_found": False,
                }
            )
        
        # Verify manifest_id binding (not checked by approval_checker)
        manifest_id_match = approval_model.placement_manifest_id == manifest_id
        
        # Call async approval_checker for core authorization checks
        auth_result: AuthorizationResult = await check_implementation_approval_async(
            workflow_id=workflow_id,
            candidate_sha256=candidate_sha256,
            manifest_sha256=manifest_sha256,
            approval_repo=self.approval_repo,
            requester_id=requester_id
        )
        
        # Combine manifest_id check with authorization result
        all_checks_passed = auth_result.authorized and manifest_id_match
        
        if not manifest_id_match:
            reason = (
                f"Manifest ID mismatch: "
                f"expected {approval_model.placement_manifest_id}, got {manifest_id}"
            )
        else:
            reason = auth_result.failure_reason or "All approval checks passed"
        
        bindings_verified = {
            "workflow_id": True,
            "candidate_sha256": auth_result.evidence.get("candidate_hash_check") == "PASS",
            "manifest_id": manifest_id_match,
            "manifest_sha256": auth_result.evidence.get("manifest_hash_check") == "PASS",
            "self_approval_check": auth_result.evidence.get("self_approval_check") == "PASS",
        }
        
        # Build authorization evidence
        authorization_evidence = {
            "workflow_id": workflow_id,
            "approval_id": auth_result.approval_id,
            "approval_found": True,
            "checked_at": checked_at,
            "authorization_result": {
                "authorized": auth_result.authorized,
                "failure_reason": auth_result.failure_reason,
            },
            "bindings_verified": bindings_verified,
            "verification_details": auth_result.evidence,
            "manifest_id_verification": {
                "expected": approval_model.placement_manifest_id,
                "provided": manifest_id,
                "match": manifest_id_match,
            }
        }
        
        return ApprovalEnforcementResult(
            approved=all_checks_passed,
            reason=reason,
            bindings_verified=bindings_verified,
            approval_id=auth_result.approval_id,
            checked_at=checked_at,
            authorization_evidence=authorization_evidence
        )
    
    def verify_all_bindings(
        self,
        workflow_id: str,
        candidate_sha256: str,
        manifest_id: str,
        manifest_sha256: str
    ) -> Dict[str, bool]:
        """
        Verify all approval bindings without authorization check.
        
        Used for diagnostic purposes to check which bindings match.
        Does NOT check approval status or self-approval.
        
        Args:
            workflow_id: Workflow identifier
            candidate_sha256: Candidate hash
            manifest_id: Placement manifest ID
            manifest_sha256: Placement manifest hash
            
        Returns:
            Dictionary of binding verification results
        """
        if workflow_id not in self.approvals_store:
            return {
                "workflow_id": False,
                "candidate_sha256": False,
                "manifest_id": False,
                "manifest_sha256": False,
            }
        
        approval = self.approvals_store[workflow_id]
        
        return {
            "workflow_id": True,
            "candidate_sha256": approval.verify_candidate_hash(candidate_sha256),
            "manifest_id": approval.placement_manifest_id == manifest_id,
            "manifest_sha256": approval.verify_manifest_hash(manifest_sha256),
        }


def create_approval_enforcer(
    approvals_store: Dict[str, ImplementationApproval]
) -> ApprovalEnforcer:
    """
    Factory function to create ApprovalEnforcer instance.
    
    Args:
        approvals_store: Dictionary of ImplementationApproval records by workflow_id
        
    Returns:
        ApprovalEnforcer instance
    """
    return ApprovalEnforcer(approvals_store)
