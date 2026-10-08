"""
Project LLM Workflow Model - M2.9 Wave 0

Canonical workflow data model with hash-bound artifact tracking and state history.

This module provides the authoritative workflow representation for Project LLM M2.9,
establishing ProjectLLMWorkflow as the single source of truth for workflow state,
artifact bindings, approval tracking, and evidence accumulation.

ARCHITECTURAL ROLE:
- ProjectLLMWorkflow is the domain model for workflow lifecycle
- WorkflowGovernanceService manages state transitions using this model
- All workflow state queries must go through WorkflowGovernanceService
- Artifact bindings are hash-bound for security (candidate, manifest, snapshot)

SECURITY PROPERTIES:
- Immutable workflow_id and specification_id
- Hash-bound artifacts prevent tampering
- State history provides complete audit trail
- Terminal state detection prevents post-completion mutations
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.orchestration.canonical_workflow import CanonicalWorkflowState


@dataclass
class StateTransition:
    """
    Record of a single workflow state transition.
    
    Captures who initiated the transition, when it occurred, and what evidence
    supports the transition. Forms part of the workflow audit trail.
    """
    
    from_state: Optional[CanonicalWorkflowState]  # None for initial transition
    to_state: CanonicalWorkflowState
    timestamp: datetime
    triggered_by: str  # User ID or system component (e.g., "system", "user_123")
    evidence_id: Optional[str] = None  # Reference to evidence artifact
    reason: Optional[str] = None  # Human-readable reason for transition


@dataclass
class ProjectLLMWorkflow:
    """
    Canonical workflow model for Project LLM M2.9.
    
    Single source of truth for workflow lifecycle state, approval gates,
    and artifact bindings. All workflow operations must go through
    WorkflowGovernanceService, which manages instances of this model.
    
    LIFECYCLE:
    - Created in REQUESTED state via WorkflowGovernanceService.create_workflow()
    - Transitions through 17 canonical states
    - Reaches terminal state (CERTIFIED or REJECTED)
    - No mutations allowed after terminal state reached
    
    ARTIFACT BINDINGS:
    - contract: Engineering contract for External AI
    - candidate: User-uploaded implementation package
    - manifest: Placement manifest for file operations
    - snapshot: Final repository snapshot after implementation
    
    All artifacts are hash-bound (SHA-256) for tamper detection.
    """
    
    # Identity
    workflow_id: str
    specification_id: str  # Block family + version (e.g., "I7")
    
    # Target binding
    target_family: str  # e.g., "Introduction"
    target_version: str  # e.g., "I7"
    requester_id: str  # For self-approval prevention
    
    # Lifecycle state
    current_state: CanonicalWorkflowState
    
    # Metadata (required fields)
    created_at: datetime
    updated_at: datetime
    
    # Lifecycle state (with defaults)
    state_history: List[StateTransition] = field(default_factory=list)
    
    # Artifact bindings (hash-bound for security)
    contract_id: Optional[str] = None
    contract_sha256: Optional[str] = None
    
    candidate_id: Optional[str] = None
    candidate_sha256: Optional[str] = None
    
    manifest_id: Optional[str] = None
    manifest_sha256: Optional[str] = None
    
    snapshot_id: Optional[str] = None
    snapshot_sha256: Optional[str] = None
    
    # Approval tracking
    approval_id: Optional[str] = None  # ImplementationApproval ID
    gate_results: Dict[str, Any] = field(default_factory=dict)
    
    # Evidence
    evidence_ids: List[str] = field(default_factory=list)
    
    # Terminal status
    final_status: Optional[str] = None  # "CERTIFIED" or "REJECTED" when terminal
    
    def is_terminal(self) -> bool:
        """
        Check if workflow is in terminal state.
        
        Returns:
            True if workflow is in CERTIFIED or REJECTED state
        """
        from app.orchestration.canonical_workflow import is_terminal_state
        return is_terminal_state(self.current_state)
    
    def requires_approval(self) -> bool:
        """
        Check if current state requires human approval.
        
        Returns:
            True if workflow is in a gate state (AWAITING_GATE_1,
            AWAITING_IMPLEMENTATION_APPROVAL, or AWAITING_GATE_2)
        """
        from app.orchestration.canonical_workflow import is_gate_state
        return is_gate_state(self.current_state)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert workflow to dictionary for serialization.
        
        Returns:
            Dictionary representation with all workflow fields
        """
        return {
            "workflow_id": self.workflow_id,
            "specification_id": self.specification_id,
            "target": {
                "family": self.target_family,
                "version": self.target_version
            },
            "requester_id": self.requester_id,
            "state": {
                "current": self.current_state.value,
                "is_terminal": self.is_terminal(),
                "requires_approval": self.requires_approval()
            },
            "artifacts": {
                "contract": {"id": self.contract_id, "sha256": self.contract_sha256},
                "candidate": {"id": self.candidate_id, "sha256": self.candidate_sha256},
                "manifest": {"id": self.manifest_id, "sha256": self.manifest_sha256},
                "snapshot": {"id": self.snapshot_id, "sha256": self.snapshot_sha256}
            },
            "approval_id": self.approval_id,
            "gate_results": self.gate_results,
            "evidence_ids": self.evidence_ids,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "final_status": self.final_status
        }
