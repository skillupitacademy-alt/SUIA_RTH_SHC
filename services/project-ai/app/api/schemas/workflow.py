"""
Workflow API Schemas - M2.9 Wave 0

Pydantic schemas for workflow API contracts, including create workflow requests,
transition requests, and workflow response shapes.

These schemas define the HTTP API surface for workflow operations, separate from
the domain model (ProjectLLMWorkflow). The API layer converts between Pydantic
schemas and domain models.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class WorkflowArtifact(BaseModel):
    """Single artifact with ID and hash binding."""
    
    id: Optional[str] = None
    sha256: Optional[str] = None


class WorkflowStateInfo(BaseModel):
    """Current workflow state with derived flags."""
    
    current: str = Field(description="Current CanonicalWorkflowState value")
    is_terminal: bool = Field(description="Is workflow in terminal state?")
    requires_approval: bool = Field(description="Does current state require approval?")


class WorkflowTarget(BaseModel):
    """Target block family and version."""
    
    family: str = Field(description="Block family (e.g., 'Introduction')")
    version: str = Field(description="Target version (e.g., 'I7')")


class WorkflowArtifacts(BaseModel):
    """All workflow artifacts with hash bindings."""
    
    contract: WorkflowArtifact
    candidate: WorkflowArtifact
    manifest: WorkflowArtifact
    snapshot: WorkflowArtifact


class WorkflowResponse(BaseModel):
    """Complete workflow representation for API responses."""
    
    workflow_id: str
    specification_id: str
    target: WorkflowTarget
    requester_id: str
    state: WorkflowStateInfo
    artifacts: WorkflowArtifacts
    approval_id: Optional[str] = None
    gate_results: Dict[str, Any] = {}
    evidence_ids: List[str] = []
    created_at: str
    updated_at: str
    final_status: Optional[str] = None


class CreateWorkflowRequest(BaseModel):
    """Request to create a new workflow."""
    
    target_family: str = Field(min_length=1, description="Block family")
    target_version: str = Field(min_length=1, description="Target version")
    requester_id: str = Field(min_length=1, description="Workflow requester")
    purpose: Optional[str] = None


class TransitionRequest(BaseModel):
    """Request to transition workflow state."""
    
    to_state: str = Field(min_length=1, description="Target CanonicalWorkflowState")
    triggered_by: str = Field(min_length=1, description="User or system component")
    evidence_id: Optional[str] = None
    reason: Optional[str] = None


class BindArtifactRequest(BaseModel):
    """Request to bind artifact to workflow."""
    
    artifact_type: str = Field(description="Artifact type: contract, candidate, manifest, or snapshot")
    artifact_id: str = Field(min_length=1, description="Artifact identifier")
    artifact_sha256: str = Field(min_length=64, max_length=64, description="SHA-256 hash of artifact")


class StateTransitionResponse(BaseModel):
    """Single state transition record."""
    
    from_state: Optional[str] = None
    to_state: str
    timestamp: str
    triggered_by: str
    evidence_id: Optional[str] = None
    reason: Optional[str] = None
