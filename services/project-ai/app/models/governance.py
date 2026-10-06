"""Governance models for manifest-bound human approval workflow."""

from enum import Enum


class ApprovalStatus(str, Enum):
    """
    Approval lifecycle states for placement manifest review.
    
    PENDING: Awaiting human review
    APPROVED: Approved with verified manifest hash
    REJECTED: Rejected by human reviewer
    MANIFEST_CHANGED: Approval rejected due to manifest mutation after submission
    """
    
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MANIFEST_CHANGED = "MANIFEST_CHANGED"
