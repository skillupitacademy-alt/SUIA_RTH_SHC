"""
API schemas for placement engine endpoints.

Wave 5 (M2.9 R3) - Placement Engine API
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class PlacementEngineResponse(BaseModel):
    """Response schema for placement engine operations."""
    
    workflow_id: str = Field(..., description="Workflow identifier")
    candidate_id: str = Field(..., description="Candidate identifier")
    placement_decision: str = Field(..., description="Placement decision (ADD/UPDATE/EXTEND/REUSE/REJECT)")
    manifest_id: str = Field(..., description="Selected manifest ID")
    score: Optional[Dict[str, Any]] = Field(None, description="Placement score details")
    conflicts: List[str] = Field(default_factory=list, description="Conflict descriptions")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Placement evidence")
    created_at: str = Field(..., description="ISO 8601 timestamp")


class PlacementOverrideRequest(BaseModel):
    """Request schema for manual placement override."""
    
    manual_manifest_id: str = Field(..., description="Manually selected manifest ID")
    override_reason: str = Field(..., description="Reason for override")


class PlacementConflictResponse(BaseModel):
    """Response schema for placement conflicts."""
    
    target_path: str = Field(..., description="Conflicting target path")
    candidate_ids: List[str] = Field(..., description="Candidates in conflict")
    conflict_count: int = Field(..., description="Number of conflicting candidates")


class CreatePlacementRequest(BaseModel):
    """Request schema for creating placement."""
    
    candidate_id: str = Field(..., description="Candidate ID to place")
