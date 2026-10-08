"""
Workflow API Schemas - M2.9 Wave 0

Pydantic schemas for canonical workflow API contracts.

These schemas define the shape of requests and responses for workflow
management endpoints, ensuring type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class WorkflowArtifact(BaseModel):
    """
    Hash-bound artifact reference.
    
    Represents a workflow artifact (contract, candidate, manifest, snapshot)
    with its unique identifier and SHA-256 hash for integrity verification.
    """
    
    id: Optional[str] = None
    sha256: Optional[str] = None


class WorkflowStateInfo(BaseModel):
    """
    Workflow state information for API responses.
    
    Includes current canonical state plus computed properties for
    terminal state detection and approval requirement detection.
    """
    
    current: str = Field(description="Current CanonicalWorkflowState value")
    is_terminal: bool = Field(description="Is workflow in terminal state (CERTIFIED/REJECTED)?")
    requires_approval: bool = Field(description="Does current state require human approval?")


class WorkflowTarget(BaseModel):
    """
    Workflow target binding (block family + version).
    
    Identifies which block the workflow is creating or modifying.
    """
    
    family: str = Field(description="Block family (e.g., 'Introduction')", min_length=1)
    version: str = Field(description="Target version (e.g., 'I7')", min_length=1)


class WorkflowArtifacts(BaseModel):
    """
    Collection of all workflow artifacts with hash bindings.
    
    Each artifact includes optional ID and SHA-256 hash for integrity verification.
    """
    
    contract: WorkflowArtifact
    candidate: WorkflowArtifact
    manifest: WorkflowArtifact
    snapshot: WorkflowArtifact


class StateTransitionInfo(BaseModel):
    """
    State transition record for history tracking.
    
    Documents a single state transition with audit trail information.
    """
    
    from_state: Optional[str] = Field(description="Previous state (None for initial transition)")
    to_state: str = Field(description="New state after transition")
    timestamp: str = Field(description="ISO 8601 timestamp")
    triggered_by: str = Field(description="User ID or system component")
    evidence_id: Optional[str] = Field(default=None, description="Optional evidence ID")
    reason: Optional[str] = Field(default=None, description="Optional reason for transition")


class WorkflowResponse(BaseModel):
    """
    Complete workflow representation for API responses.
    
    Contains all workflow state, artifacts, approvals, and metadata.
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
    state_history: List[StateTransitionInfo] = []
    created_at: str
    updated_at: str
    final_status: Optional[str] = None


class CreateWorkflowRequest(BaseModel):
    """
    Request to create a new workflow.
    
    Initiates workflow in REQUESTED state with target binding and requester identity.
    """
    
    target_family: str = Field(min_length=1, description="Block family (e.g., 'Introduction')")
    target_version: str = Field(min_length=1, description="Target version (e.g., 'I7')")
    requester_id: str = Field(min_length=1, description="Workflow requester identity")
    purpose: Optional[str] = Field(default=None, description="Optional purpose description")


class TransitionRequest(BaseModel):
    """
    Request to transition workflow state.
    
    Used internally by system components to advance workflow through lifecycle.
    """
    
    to_state: str = Field(min_length=1, description="Target CanonicalWorkflowState value")
    triggered_by: str = Field(min_length=1, description="User ID or system component")
    evidence_id: Optional[str] = Field(default=None, description="Optional evidence ID")
    reason: Optional[str] = Field(default=None, description="Optional reason for transition")


class BindArtifactRequest(BaseModel):
    """
    Request to bind artifact to workflow with hash.
    
    Associates an artifact (contract, candidate, manifest, snapshot) with the workflow
    and records its SHA-256 hash for integrity verification.
    """
    
    artifact_type: str = Field(
        description="Artifact type: 'contract', 'candidate', 'manifest', or 'snapshot'"
    )
    artifact_id: str = Field(min_length=1, description="Artifact identifier")
    artifact_sha256: str = Field(min_length=64, max_length=64, description="SHA-256 hash (hex)")
