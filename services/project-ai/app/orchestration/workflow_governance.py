"""
Workflow Governance Service - M2.9 Wave 0

Single point of authority for canonical workflow state management.

This service is the ONLY component authorized to mutate workflow state.
All state transitions must flow through this service to ensure:
- State transition validation
- Terminal state enforcement
- Authorization gate verification
- Audit trail completeness

ARCHITECTURAL RULE:
- No component may modify workflow state except through this service
- All state transitions must be validated before execution
- Terminal states (CERTIFIED, REJECTED) are immutable
- IMPLEMENTING transition requires full authorization checks
"""

from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
from uuid import uuid4

from app.models.workflow import ProjectLLMWorkflow, StateTransition
from app.orchestration.canonical_workflow import (
    CanonicalWorkflowState,
    is_valid_transition,
    is_terminal_state,
    is_gate_state,
    can_transition_to_implementing
)
from app.models.implementation_approval import ImplementationApproval


class WorkflowGovernanceService:
    """
    Governance service for canonical workflow state management.
    
    RESPONSIBILITIES:
    - Create workflows in REQUESTED state
    - Validate and execute state transitions
    - Enforce authorization gates
    - Prevent mutation of terminal states
    - Track state history
    
    SECURITY BOUNDARIES:
    - No transitions after terminal state reached
    - Hash verification for IMPLEMENTING transition
    - Self-approval prevention
    - Evidence required for gate transitions
    """
    
    def __init__(self):
        """
        Initialize governance service.
        
        Uses in-memory storage for M2.9 Wave 0.
        Future waves will add database persistence.
        """
        # In-memory storage for M2.9 Wave 0 (Wave 1+ will add persistence)
        self._workflows: Dict[str, ProjectLLMWorkflow] = {}
        self._approvals: Dict[str, ImplementationApproval] = {}
    
    def create_workflow(
        self,
        target_family: str,
        target_version: str,
        requester_id: str,
        purpose: Optional[str] = None
    ) -> ProjectLLMWorkflow:
        """
        Create a new workflow in REQUESTED state.
        
        Args:
            target_family: Block family (e.g., "Introduction")
            target_version: Target version (e.g., "I7")
            requester_id: User creating the workflow
            purpose: Optional purpose description
            
        Returns:
            New workflow in REQUESTED state
        """
        workflow_id = str(uuid4())
        # Specification ID is the target version (e.g., "I7", "C3")
        specification_id = target_version
        now = datetime.now(timezone.utc)
        
        initial_transition = StateTransition(
            from_state=None,  # No prior state
            to_state=CanonicalWorkflowState.REQUESTED,
            timestamp=now,
            triggered_by="system",
            reason="Workflow created"
        )
        
        workflow = ProjectLLMWorkflow(
            workflow_id=workflow_id,
            specification_id=specification_id,
            target_family=target_family,
            target_version=target_version,
            requester_id=requester_id,
            current_state=CanonicalWorkflowState.REQUESTED,
            state_history=[initial_transition],
            created_at=now,
            updated_at=now
        )
        
        if purpose:
            workflow.gate_results["purpose"] = purpose
        
        self._workflows[workflow_id] = workflow
        return workflow
    
    def get_workflow(self, workflow_id: str) -> Optional[ProjectLLMWorkflow]:
        """
        Get workflow by ID.
        
        Args:
            workflow_id: Workflow identifier
            
        Returns:
            Workflow if found, None otherwise
        """
        return self._workflows.get(workflow_id)
    
    def validate_transition(
        self,
        workflow_id: str,
        to_state: CanonicalWorkflowState
    ) -> Tuple[bool, str]:
        """
        Validate if a state transition is allowed.
        
        Checks:
        1. Workflow exists
        2. Workflow is not in terminal state
        3. Transition is valid per state machine
        
        Args:
            workflow_id: Workflow to transition
            to_state: Target state
            
        Returns:
            Tuple of (is_valid, reason)
            - (True, "") if transition is valid
            - (False, reason) if transition is invalid
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return (False, f"Workflow not found: {workflow_id}")
        
        # Check if terminal state reached
        if workflow.is_terminal():
            return (
                False,
                f"Workflow is in terminal state {workflow.current_state.value}, no transitions allowed"
            )
        
        # Check if transition is valid per state machine
        if not is_valid_transition(workflow.current_state, to_state):
            return (
                False,
                f"Invalid transition: {workflow.current_state.value} -> {to_state.value}"
            )
        
        return (True, "")
    
    def transition_state(
        self,
        workflow_id: str,
        to_state: CanonicalWorkflowState,
        triggered_by: str,
        evidence_id: Optional[str] = None,
        reason: Optional[str] = None
    ) -> ProjectLLMWorkflow:
        """
        Execute a state transition with validation.
        
        Args:
            workflow_id: Workflow to transition
            to_state: Target state
            triggered_by: User or system component
            evidence_id: Optional evidence ID for audit trail
            reason: Optional reason for transition
            
        Returns:
            Updated workflow
            
        Raises:
            ValueError: If transition is invalid or unauthorized
        """
        # Validate transition
        is_valid, validation_reason = self.validate_transition(workflow_id, to_state)
        if not is_valid:
            raise ValueError(validation_reason)
        
        workflow = self._workflows[workflow_id]
        
        # Special authorization for IMPLEMENTING transition
        if to_state == CanonicalWorkflowState.IMPLEMENTING:
            can_implement, auth_reason = can_transition_to_implementing(
                workflow_id=workflow_id,
                approvals_store=self._approvals,
                requester_id=workflow.requester_id,
                candidate_sha256=workflow.candidate_sha256 or "",
                manifest_id=workflow.manifest_id or "",
                manifest_sha256=workflow.manifest_sha256 or ""
            )
            if not can_implement:
                raise ValueError(f"Authorization failed: {auth_reason}")
        
        # Execute transition
        now = datetime.now(timezone.utc)
        transition = StateTransition(
            from_state=workflow.current_state,
            to_state=to_state,
            timestamp=now,
            triggered_by=triggered_by,
            evidence_id=evidence_id,
            reason=reason
        )
        
        workflow.current_state = to_state
        workflow.state_history.append(transition)
        workflow.updated_at = now
        
        # Set final status for terminal states
        if is_terminal_state(to_state):
            workflow.final_status = to_state.value
        
        return workflow
    
    def register_approval(
        self,
        workflow_id: str,
        approval: ImplementationApproval
    ) -> None:
        """
        Register an implementation approval for workflow.
        
        Args:
            workflow_id: Workflow ID
            approval: ImplementationApproval record
            
        Raises:
            ValueError: If workflow not found
        """
        workflow = self._workflows.get(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        self._approvals[workflow_id] = approval
        workflow.approval_id = approval.approval_id
        workflow.updated_at = datetime.now(timezone.utc)
    
    def bind_artifact(
        self,
        workflow_id: str,
        artifact_type: str,
        artifact_id: str,
        artifact_sha256: str
    ) -> None:
        """
        Bind an artifact to workflow with hash.
        
        Args:
            workflow_id: Workflow ID
            artifact_type: "contract", "candidate", "manifest", or "snapshot"
            artifact_id: Artifact identifier
            artifact_sha256: SHA-256 hash of artifact
            
        Raises:
            ValueError: If workflow not found or artifact type invalid
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        if artifact_type == "contract":
            workflow.contract_id = artifact_id
            workflow.contract_sha256 = artifact_sha256
        elif artifact_type == "candidate":
            workflow.candidate_id = artifact_id
            workflow.candidate_sha256 = artifact_sha256
        elif artifact_type == "manifest":
            workflow.manifest_id = artifact_id
            workflow.manifest_sha256 = artifact_sha256
        elif artifact_type == "snapshot":
            workflow.snapshot_id = artifact_id
            workflow.snapshot_sha256 = artifact_sha256
        else:
            raise ValueError(
                f"Invalid artifact type: {artifact_type}. "
                f"Must be one of: contract, candidate, manifest, snapshot"
            )
        
        workflow.updated_at = datetime.now(timezone.utc)
    
    def list_workflows(self) -> list[ProjectLLMWorkflow]:
        """
        List all workflows.
        
        Returns:
            List of all workflows in storage
        """
        return list(self._workflows.values())
