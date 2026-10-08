"""
ProjectLLM Workflow Model - M2.9 Wave 0

Canonical workflow data model for Project LLM lifecycle management.

This module defines the authoritative workflow representation that binds:
- Canonical state machine (CanonicalWorkflowState)
- Hash-bound artifacts (contract, candidate, manifest, snapshot)
- Approval tracking (ImplementationApproval)
- State transition history
- Evidence accumulation

ARCHITECTURAL RULE:
- ProjectLLMWorkflow is the single source of truth for workflow state
- All workflow mutations must flow through WorkflowGovernanceService
- Frontend must consume workflow state from backend API, not create its own
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any

from app.orchestration.canonical_workflow import CanonicalWorkflowState


@dataclass
class StateTransition:
    """
    Record of a single state transition with evidence.
    
    Provides complete audit trail of workflow progression, including who/what
    triggered each transition and why.
    """
    
    from_state: Optional[CanonicalWorkflowState]
    to_state: CanonicalWorkflowState
    timestamp: datetime
    triggered_by: str  # User ID or system component
    evidence_id: Optional[str] = None
    reason: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "from_state": self.from_state.value if self.from_state else None,
            "to_state": self.to_state.value,
            "timestamp": self.timestamp.isoformat(),
            "triggered_by": self.triggered_by,
            "evidence_id": self.evidence_id,
            "reason": self.reason
        }


@dataclass
class ProjectLLMWorkflow:
    """
    Canonical workflow model for Project LLM M2.9.
    
    Single source of truth for workflow lifecycle state, approval gates,
    and artifact bindings.
    
    SECURITY BOUNDARIES:
    - All artifacts are hash-bound (SHA-256) to detect tampering
    - Approval tracking prevents self-approval and enforces gates
    - Terminal states are immutable (no transitions after CERTIFIED/REJECTED)
    - State history provides complete audit trail
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
    
    # Metadata (required fields without defaults)
    created_at: datetime
    updated_at: datetime
    
    # State history
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
            True if current state is CERTIFIED or REJECTED, False otherwise
        """
        from app.orchestration.canonical_workflow import is_terminal_state
        return is_terminal_state(self.current_state)
    
    def requires_approval(self) -> bool:
        """
        Check if current state requires human approval.
        
        Returns:
            True if current state is a gate state (AWAITING_GATE_1,
            AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2), False otherwise
        """
        from app.orchestration.canonical_workflow import is_gate_state
        return is_gate_state(self.current_state)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary for serialization.
        
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
            "state_history": [t.to_dict() for t in self.state_history],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "final_status": self.final_status
        }
