"""Pydantic schemas for governance API request/response models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.governance import ApprovalStatus


class ApprovalSubmitRequest(BaseModel):
    """Request to submit a placement manifest for approval."""
    
    manifestId: str = Field(
        description="Unique identifier for the placement manifest",
        min_length=1
    )
    manifestHash: str = Field(
        description="Cryptographic hash of manifest content (for mutation detection)",
        min_length=1
    )


class ApprovalDecisionRequest(BaseModel):
    """Request to approve or reject a pending manifest."""
    
    reason: Optional[str] = Field(
        default=None,
        description="Human-readable reason for approval/rejection"
    )
    manifestHash: str = Field(
        description="Manifest hash at time of review (must match submission hash)",
        min_length=1
    )


class ApprovalRejectRequest(BaseModel):
    """Request to reject a pending manifest."""
    
    reason: Optional[str] = Field(
        default=None,
        description="Human-readable reason for rejection"
    )


class AuditTrailEntry(BaseModel):
    """Single audit trail entry for approval lifecycle."""
    
    action: str = Field(description="Action performed (submitted, approved, rejected)")
    by: str = Field(description="Identity of actor")
    at: datetime = Field(description="Timestamp of action")
    reason: Optional[str] = Field(default=None, description="Optional reason/comment")


class ApprovalRecord(BaseModel):
    """Complete approval record with audit trail."""
    
    approvalId: str = Field(description="Unique approval identifier")
    manifestId: str = Field(description="Placement manifest identifier")
    status: ApprovalStatus = Field(description="Current approval status")
    submittedBy: str = Field(description="Who submitted the manifest")
    submittedAt: datetime = Field(description="When submitted")
    decidedBy: Optional[str] = Field(default=None, description="Who approved/rejected")
    decidedAt: Optional[datetime] = Field(default=None, description="When decided")
    manifestHash: str = Field(description="Manifest hash at submission")
    reason: Optional[str] = Field(default=None, description="Decision reason")
    auditTrail: list[AuditTrailEntry] = Field(
        default_factory=list,
        description="Complete audit trail of all actions"
    )


class ApprovalSubmitResponse(BaseModel):
    """Response after submitting manifest for approval."""
    
    approvalId: str = Field(description="Generated approval identifier")
    manifestId: str = Field(description="Placement manifest identifier")
    status: ApprovalStatus = Field(description="Initial status (PENDING)")
    submittedAt: datetime = Field(description="Submission timestamp")
