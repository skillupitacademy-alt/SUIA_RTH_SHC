"""
Workflow API Schemas - M2.9 Wave 0

Pydantic schemas for workflow API contracts.

These schemas define the request and response shapes for workflow management
endpoints. They serve as the API contract between frontend and backend.

DESIGN PRINCIPLES:
- Clear field descriptions with validation constraints
- Optional fields explicitly marked
- Nested models for complex structures
- All response models include complete workflow state
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class WorkflowArtifact(BaseModel):
    """
    Artifact binding with hash for tamper detection.
    
    All artifacts (contract, candidate, manifest, snapshot) follow this pattern.
    """
    id: Optional[str] = None
    sha256: Optional[str] = None


class WorkflowStateInfo(BaseModel):
    """
    Current workflow state with derived properties.
    
    Provides both the canonical state value and computed boolean flags
    for terminal state and approval requirement.
    """
    current: str = Field(description="Current CanonicalWorkflowState value")
    is_terminal: bool = Field(description="Is workflow in terminal state?")
    requires_approval: bool = Field(description="Does current state require approval?")


class WorkflowTarget(BaseModel):
    """
    Block family and version target for workflow.
    
    Example: family="Introduction", version="I7"
    """
    family: str = Field(description="Block family (e.g., 'Introduction')")
    version: str = Field(description="Target version (e.g., 'I7')")


class WorkflowArtifacts(BaseModel):
    """
    All workflow artifacts with hash bindings.
    
    Each artifact has an optional ID and SHA-256 hash. Artifacts are
    populated as the workflow progresses through states.
    """
    contract: WorkflowArtifact
    candidate: WorkflowArtifact
    manifest: WorkflowArtifact
    snapshot: WorkflowArtifact


class WorkflowResponse(BaseModel):
    """
    Complete workflow representation for API responses.
    
    Includes all workflow fields: identity, target, state, artifacts,
    approval, evidence, and metadata.
    """
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
    """
    Request to create a new workflow.
    
    Workflow will be created in REQUESTED state and assigned a unique workflow_id.
    """
    target_family: str = Field(min_length=1, description="Block family")
    target_version: str = Field(min_length=1, description="Target version")
    requester_id: str = Field(min_length=1, description="Workflow requester")
    purpose: Optional[str] = None


class TransitionRequest(BaseModel):
    """
    Request to transition workflow state.
    
    Internal use only. Most state transitions should happen through
    workflow execution or approval endpoints.
    """
    to_state: str = Field(min_length=1, description="Target CanonicalWorkflowState")
    triggered_by: str = Field(min_length=1, description="User or system component")
    evidence_id: Optional[str] = None
    reason: Optional[str] = None


class BindArtifactRequest(BaseModel):
    """
    Request to bind an artifact to workflow.
    
    Artifacts are hash-bound for security. Valid artifact types:
    - contract: Engineering contract
    - candidate: Implementation package
    - manifest: Placement manifest
    - snapshot: Repository snapshot
    """
    artifact_type: str = Field(
        min_length=1,
        description="Artifact type: 'contract', 'candidate', 'manifest', or 'snapshot'"
    )
    artifact_id: str = Field(min_length=1, description="Artifact identifier")
    artifact_sha256: str = Field(min_length=64, max_length=64, description="SHA-256 hash")
