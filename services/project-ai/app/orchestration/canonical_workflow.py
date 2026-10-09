"""
Canonical Workflow State Machine

M2.9 Architecture Authority: Single source of truth for Project LLM workflow states.

This module establishes the canonical workflow lifecycle for the Project AI pipeline,
resolving multiple competing state authorities (TaskState, WorkflowStatus, CreationMode).

ARCHITECTURAL RULE:
- CanonicalWorkflowState is the ONLY workflow state machine for Project LLM
- All other state enums must map to or derive from these canonical states
- Frontend must consume these states; frontend must NOT create another state machine
- External AI receives contracts based on these states, not internal TaskState

GATE ENFORCEMENT:
- AWAITING_GATE_1: Human approval required before External AI implementation
- AWAITING_IMPLEMENTATION_APPROVAL: Human approval required before file placement
- AWAITING_GATE_2: Human approval required before final certification

References:
- M2.9 Canonical Project LLM Wiring specification
- Architecture Authority requirement (Wave 0 / Agent B01)
"""

from enum import Enum


class CanonicalWorkflowState(str, Enum):
    """
    Canonical workflow states for Project LLM M2.9 architecture.
    
    Each state represents a distinct phase in the block engineering lifecycle,
    from initial user request through final HAA certification.
    
    States are ordered sequentially to reflect the natural workflow progression,
    with explicit gate states enforcing human approval at critical points.
    """
    
    REQUESTED = "REQUESTED"
    """
    User initiates workflow by selecting block family and target version.
    
    Inputs: Block family (e.g., "Introduction"), target version (e.g., "I7")
    Next states: DISCOVERY
    Gate: None
    """
    
    DISCOVERY = "DISCOVERY"
    """
    Repository evidence gathering phase.
    
    Activities:
    - Consume TypeScript snapshot (never scan repository directly)
    - Extract canonical blocks (I1-I6 for Introduction family)
    - Analyze composer wiring, renderer contracts, schemas
    - Generate repository contract
    - Create workflow target binding
    
    Next states: BRIEF_READY
    Gate: None
    """
    
    BRIEF_READY = "BRIEF_READY"
    """
    Compliance brief and engineering contract generated.
    
    Outputs:
    - EngineeringContract with canonical references, compliance requirements
    - External AI prompt (downloadable Markdown)
    - UBRC/Brand/Theme/ILS/LSNB/RSSB contract rules
    
    Next states: AWAITING_GATE_1
    Gate: None
    """
    
    AWAITING_GATE_1 = "AWAITING_GATE_1"
    """
    GUI prototype approval pending (Human Gate 1).
    
    Activities:
    - External AI creates HTML/CSS/JS prototype
    - User reviews visual design and UX
    - Human approves or rejects prototype
    
    Next states: GUI_APPROVED (if approved), REJECTED (if rejected)
    Gate: HUMAN_GATE_1 (HAA)
    """
    
    GUI_APPROVED = "GUI_APPROVED"
    """
    Gate 1 passed; External AI authorized to implement React/TS.
    
    Activities:
    - External AI converts prototype to production React/TypeScript
    - Implements block component, schema, renderer wiring
    - Follows EngineeringContract requirements
    
    Next states: CANDIDATE_REQUESTED
    Gate: None
    """
    
    CANDIDATE_REQUESTED = "CANDIDATE_REQUESTED"
    """
    External AI implementation requested; awaiting candidate package upload.
    
    Activities:
    - User packages External AI output (TSX, schema, tests, docs)
    - User uploads candidate package (ZIP or individual files)
    
    Next states: CANDIDATE_RECEIVED
    Gate: None
    """
    
    CANDIDATE_RECEIVED = "CANDIDATE_RECEIVED"
    """
    Candidate package uploaded; server-side intake processing initiated.
    
    Activities:
    - Compute SHA-256 hashes (never trust client hashes)
    - Validate file extensions and paths
    - Attach CandidateBinding to workflow target
    - Classify candidate (Introduction family, version I7)
    
    Next states: CANDIDATE_AUDIT
    Gate: None
    """
    
    CANDIDATE_AUDIT = "CANDIDATE_AUDIT"
    """
    Running compliance gates and canonical comparison.
    
    Activities:
    - UBRC compliance verification
    - Brand independence verification
    - Theme compatibility verification
    - Canonical comparison (vs I1-I6 for Introduction)
    - Schema validation
    - Composer wiring verification
    
    Next states: INTEGRATION_PLANNED (if all gates pass), REJECTED (if gates fail)
    Gate: Automated certification gates
    """
    
    INTEGRATION_PLANNED = "INTEGRATION_PLANNED"
    """
    Placement manifest generated; awaiting implementation approval.
    
    Outputs:
    - PlacementManifest with target paths, file operations
    - ManifestHash for approval binding
    - Canonical comparison results
    
    Next states: AWAITING_IMPLEMENTATION_APPROVAL
    Gate: None
    """
    
    AWAITING_IMPLEMENTATION_APPROVAL = "AWAITING_IMPLEMENTATION_APPROVAL"
    """
    Implementation approval pending (Human Gate 2, Placement Approval).
    
    Activities:
    - Human reviews PlacementManifest
    - Human verifies target paths are correct
    - Human approves or rejects file placement
    - Self-approval rejected
    
    Next states: IMPLEMENTING (if approved), REJECTED (if rejected)
    Gate: HUMAN_GATE_2_PLACEMENT (HAA)
    """
    
    IMPLEMENTING = "IMPLEMENTING"
    """
    Executing placement: writing files, creating git commit.
    
    Activities:
    - Create isolated git worktree
    - Write files only to allowlisted paths
    - Git add, commit with evidence references
    - Generate diff for verification
    
    Next states: IMPLEMENTED
    Gate: None
    """
    
    IMPLEMENTED = "IMPLEMENTED"
    """
    Files written and committed; runtime verification initiated.
    
    Outputs:
    - Git commit SHA
    - File diff
    - Worktree snapshot
    
    Next states: VERIFYING
    Gate: None
    """
    
    VERIFYING = "VERIFYING"
    """
    Runtime and browser verification in progress.
    
    Activities:
    - Runtime verification (ILS lifecycle, LSNB navigation, RSSB state)
    - Browser verification (Playwright preflight)
    - Theme compatibility check (light/dark mode)
    - Brand independence check (no hardcoded branding)
    
    Next states: CERTIFICATION_READY (if all pass), REJECTED (if fail)
    Gate: Automated runtime/browser gates
    """
    
    CERTIFICATION_READY = "CERTIFICATION_READY"
    """
    All automated gates passed; awaiting final HAA certification.
    
    Outputs:
    - Complete evidence bundle (discovery, gates, runtime, browser)
    - Final verdict ready for HAA review
    
    Next states: AWAITING_GATE_2
    Gate: None
    """
    
    AWAITING_GATE_2 = "AWAITING_GATE_2"
    """
    Final HAA certification pending (Human Gate 3).
    
    Activities:
    - Human reviews complete evidence bundle
    - Human verifies all gates passed correctly
    - Human approves final certification
    - HAA signs off on candidate
    
    Next states: CERTIFIED (if approved), REJECTED (if rejected)
    Gate: HUMAN_GATE_3_CERTIFICATION (HAA)
    """
    
    CERTIFIED = "CERTIFIED"
    """
    HAA certified; candidate ready for merge to main branch.
    
    Outputs:
    - Certification record with HAA signature
    - Merge-ready branch
    - Complete audit trail in evidence ledger
    
    Terminal state (success)
    """
    
    REJECTED = "REJECTED"
    """
    Workflow rejected at any gate (Gate 1, Placement, Certification, or Audit).
    
    Reasons:
    - User rejected GUI prototype (Gate 1)
    - User rejected placement manifest (Gate 2 Placement)
    - Compliance gates failed (UBRC, Brand, Theme)
    - Runtime verification failed
    - HAA rejected final certification (Gate 3)
    
    Terminal state (failure)
    """


# State transition validation
VALID_TRANSITIONS: dict[CanonicalWorkflowState, list[CanonicalWorkflowState]] = {
    CanonicalWorkflowState.REQUESTED: [
        CanonicalWorkflowState.DISCOVERY,
    ],
    CanonicalWorkflowState.DISCOVERY: [
        CanonicalWorkflowState.BRIEF_READY,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.BRIEF_READY: [
        CanonicalWorkflowState.AWAITING_GATE_1,
    ],
    CanonicalWorkflowState.AWAITING_GATE_1: [
        CanonicalWorkflowState.GUI_APPROVED,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.GUI_APPROVED: [
        CanonicalWorkflowState.CANDIDATE_REQUESTED,
    ],
    CanonicalWorkflowState.CANDIDATE_REQUESTED: [
        CanonicalWorkflowState.CANDIDATE_RECEIVED,
    ],
    CanonicalWorkflowState.CANDIDATE_RECEIVED: [
        CanonicalWorkflowState.CANDIDATE_AUDIT,
    ],
    CanonicalWorkflowState.CANDIDATE_AUDIT: [
        CanonicalWorkflowState.INTEGRATION_PLANNED,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.INTEGRATION_PLANNED: [
        CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL,
    ],
    CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL: [
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.IMPLEMENTING: [
        CanonicalWorkflowState.IMPLEMENTED,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.IMPLEMENTED: [
        CanonicalWorkflowState.VERIFYING,
    ],
    CanonicalWorkflowState.VERIFYING: [
        CanonicalWorkflowState.CERTIFICATION_READY,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.CERTIFICATION_READY: [
        CanonicalWorkflowState.AWAITING_GATE_2,
    ],
    CanonicalWorkflowState.AWAITING_GATE_2: [
        CanonicalWorkflowState.CERTIFIED,
        CanonicalWorkflowState.REJECTED,
    ],
    CanonicalWorkflowState.CERTIFIED: [],  # Terminal state
    CanonicalWorkflowState.REJECTED: [],  # Terminal state
}


def is_valid_transition(
    from_state: CanonicalWorkflowState,
    to_state: CanonicalWorkflowState
) -> bool:
    """
    Check if a state transition is valid according to canonical workflow rules.
    
    Args:
        from_state: Current workflow state
        to_state: Target workflow state
        
    Returns:
        True if transition is allowed, False otherwise
    """
    return to_state in VALID_TRANSITIONS.get(from_state, [])


def is_gate_state(state: CanonicalWorkflowState) -> bool:
    """
    Check if a state represents a human approval gate.
    
    Gate states require explicit human approval before workflow can proceed.
    
    Args:
        state: Workflow state to check
        
    Returns:
        True if state is a gate (requires human approval), False otherwise
    """
    gate_states = {
        CanonicalWorkflowState.AWAITING_GATE_1,
        CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL,
        CanonicalWorkflowState.AWAITING_GATE_2,
    }
    return state in gate_states


def is_terminal_state(state: CanonicalWorkflowState) -> bool:
    """
    Check if a state is terminal (no further transitions possible).
    
    Args:
        state: Workflow state to check
        
    Returns:
        True if state is terminal (CERTIFIED or REJECTED), False otherwise
    """
    return state in {
        CanonicalWorkflowState.CERTIFIED,
        CanonicalWorkflowState.REJECTED,
    }


async def can_transition_to_implementing_async(
    workflow_id: str,
    approval_repo,  # ApprovalRepository protocol
    requester_id: str,
    candidate_sha256: str,
    manifest_id: str,
    manifest_sha256: str
) -> tuple[bool, str]:
    """
    Check if workflow can transition to IMPLEMENTING state (async, repository-based).
    
    AUTHORIZATION GATES:
    - ImplementationApproval must exist for workflow_id
    - Approval status must be APPROVED
    - Candidate hash must match approval record (REQUIRED)
    - Manifest ID must match approval record (REQUIRED)
    - Manifest hash must match approval record (REQUIRED)
    - Must not be self-approved (REQUIRED)
    
    Args:
        workflow_id: Workflow identifier
        approval_repo: ApprovalRepository instance for database queries
        requester_id: Workflow requester identity (REQUIRED for self-approval check)
        candidate_sha256: Candidate hash to verify (REQUIRED)
        manifest_id: Placement manifest ID to verify (REQUIRED)
        manifest_sha256: Placement manifest hash to verify (REQUIRED)
        
    Returns:
        Tuple of (can_transition: bool, reason: str)
        - (True, "") if transition authorized
        - (False, reason) if transition blocked
    """
    # Load approval from database
    from app.persistence import ApprovalModel
    
    approval_model = await approval_repo.get_by_workflow(workflow_id)
    
    # Check if approval exists
    if approval_model is None:
        return (False, f"No implementation approval found for workflow {workflow_id}")
    
    # Convert ORM model to domain model for verification methods
    from app.models.implementation_approval import ImplementationApproval, ImplementationApprovalStatus
    
    approval = ImplementationApproval(
        approval_id=approval_model.approval_id,
        workflow_id=approval_model.workflow_id,
        candidate_sha256=approval_model.candidate_sha256,
        placement_manifest_id=approval_model.placement_manifest_id,
        placement_manifest_sha256=approval_model.placement_manifest_sha256,
        target_family=approval_model.target_family,
        target_version=approval_model.target_version,
        approved_by=approval_model.approved_by,
        approval_timestamp=approval_model.approval_timestamp,
        status=ImplementationApprovalStatus(approval_model.status),
        workflow_requester=approval_model.workflow_requester,
        evidence=approval_model.evidence or {},
        rejection_reason=approval_model.rejection_reason
    )
    
    # Check if approval status is APPROVED
    if approval.status != ImplementationApprovalStatus.APPROVED:
        return (False, f"Approval status is {approval.status.value}, expected APPROVED")
    
    # REQUIRED: Verify requester_id provided
    if not requester_id:
        return (False, "Missing required parameter: requester_id")
    
    # REQUIRED: Verify candidate hash provided
    if not candidate_sha256:
        return (False, "Missing required parameter: candidate_sha256")
    
    # REQUIRED: Verify manifest ID provided
    if not manifest_id:
        return (False, "Missing required parameter: manifest_id")
    
    # REQUIRED: Verify manifest hash provided
    if not manifest_sha256:
        return (False, "Missing required parameter: manifest_sha256")
    
    # Verify candidate hash matches
    if not approval.verify_candidate_hash(candidate_sha256):
        return (
            False,
            f"Candidate hash mismatch: expected {approval.candidate_sha256}, got {candidate_sha256}"
        )
    
    # Verify manifest ID matches
    if approval.placement_manifest_id != manifest_id:
        return (
            False,
            f"Manifest ID mismatch: expected {approval.placement_manifest_id}, got {manifest_id}"
        )
    
    # Verify manifest hash matches
    if not approval.verify_manifest_hash(manifest_sha256):
        return (
            False,
            f"Manifest hash mismatch: expected {approval.placement_manifest_sha256}, got {manifest_sha256}"
        )
    
    # Verify not self-approved
    if not approval.verify_not_self_approved(requester_id):
        return (
            False,
            f"Self-approval detected or workflow requester missing: approver '{approval.approved_by}'"
        )
    
    # All checks passed
    return (True, "")


def can_transition_to_implementing(
    workflow_id: str,
    approvals_store: dict,
    requester_id: str,
    candidate_sha256: str,
    manifest_id: str,
    manifest_sha256: str
) -> tuple[bool, str]:
    """
    Check if workflow can transition to IMPLEMENTING state (legacy dict-based version).
    
    DEPRECATED: Use can_transition_to_implementing_async() with ApprovalRepository instead.
    This function is kept for backward compatibility with existing tests.
    
    AUTHORIZATION GATES:
    - ImplementationApproval must exist for workflow_id
    - Approval status must be APPROVED
    - Candidate hash must match approval record (REQUIRED)
    - Manifest ID must match approval record (REQUIRED)
    - Manifest hash must match approval record (REQUIRED)
    - Must not be self-approved (REQUIRED)
    
    Args:
        workflow_id: Workflow identifier
        approvals_store: Dictionary of ImplementationApproval records (keyed by workflow_id)
        requester_id: Workflow requester identity (REQUIRED for self-approval check)
        candidate_sha256: Candidate hash to verify (REQUIRED)
        manifest_id: Placement manifest ID to verify (REQUIRED)
        manifest_sha256: Placement manifest hash to verify (REQUIRED)
        
    Returns:
        Tuple of (can_transition: bool, reason: str)
        - (True, "") if transition authorized
        - (False, reason) if transition blocked
    """
    # Check if approval exists
    if workflow_id not in approvals_store:
        return (False, f"No implementation approval found for workflow {workflow_id}")
    
    approval = approvals_store[workflow_id]
    
    # Check if approval status is APPROVED
    from app.models.implementation_approval import ImplementationApprovalStatus
    if approval.status != ImplementationApprovalStatus.APPROVED:
        return (False, f"Approval status is {approval.status.value}, expected APPROVED")
    
    # REQUIRED: Verify requester_id provided
    if not requester_id:
        return (False, "Missing required parameter: requester_id")
    
    # REQUIRED: Verify candidate hash provided
    if not candidate_sha256:
        return (False, "Missing required parameter: candidate_sha256")
    
    # REQUIRED: Verify manifest ID provided
    if not manifest_id:
        return (False, "Missing required parameter: manifest_id")
    
    # REQUIRED: Verify manifest hash provided
    if not manifest_sha256:
        return (False, "Missing required parameter: manifest_sha256")
    
    # Verify candidate hash matches
    if not approval.verify_candidate_hash(candidate_sha256):
        return (
            False,
            f"Candidate hash mismatch: expected {approval.candidate_sha256}, got {candidate_sha256}"
        )
    
    # Verify manifest ID matches
    if approval.placement_manifest_id != manifest_id:
        return (
            False,
            f"Manifest ID mismatch: expected {approval.placement_manifest_id}, got {manifest_id}"
        )
    
    # Verify manifest hash matches
    if not approval.verify_manifest_hash(manifest_sha256):
        return (
            False,
            f"Manifest hash mismatch: expected {approval.placement_manifest_sha256}, got {manifest_sha256}"
        )
    
    # Verify not self-approved
    if not approval.verify_not_self_approved(requester_id):
        return (
            False,
            f"Self-approval detected or workflow requester missing: approver '{approval.approved_by}'"
        )
    
    # All checks passed
    return (True, "")

