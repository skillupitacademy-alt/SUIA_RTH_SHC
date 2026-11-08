"""
Workflow Governance Service - M2.9 R3

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

R3 PERSISTENCE:
- Workflows persisted to PostgreSQL via WorkflowRepository
- Approvals persisted to PostgreSQL via ApprovalRepository
- State transitions persisted via StateTransitionRepository
- All operations async with proper transaction management
"""

from datetime import datetime, timezone
from typing import Optional, Tuple
from uuid import NAMESPACE_URL, uuid4, uuid5

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow import ProjectLLMWorkflow, StateTransition
from app.orchestration.canonical_workflow import (
    CanonicalWorkflowState,
    is_valid_transition,
    is_terminal_state,
    is_gate_state,
    can_transition_to_implementing_async
)
from app.models.implementation_approval import ImplementationApproval
from app.persistence import (
    WorkflowRepository,
    ApprovalRepository,
    StateTransitionRepository,
    WorkflowModel,
    ApprovalModel,
    StateTransitionModel,
    OptimisticLockError,
)


def _str_or_none(value):
    return str(value) if value is not None else None


def _workflow_model_to_domain(model: WorkflowModel) -> ProjectLLMWorkflow:
    """Convert WorkflowModel (ORM) to ProjectLLMWorkflow (domain model)."""
    state_transitions = [
        StateTransition(
            from_state=CanonicalWorkflowState(t.from_state) if t.from_state else None,
            to_state=CanonicalWorkflowState(t.to_state),
            timestamp=t.timestamp,
            triggered_by=t.triggered_by,
            evidence_id=_str_or_none(t.evidence_id),
            reason=t.reason
        )
        for t in (model.state_transitions or [])
    ]
    
    return ProjectLLMWorkflow(
        workflow_id=str(model.workflow_id),
        specification_id=str(model.specification_id),
        target_family=model.target_family,
        target_version=model.target_version,
        requester_id=model.requester_id,
        current_state=CanonicalWorkflowState(model.current_state),
        state_history=state_transitions,
        created_at=model.created_at,
        updated_at=model.updated_at,
        contract_id=_str_or_none(model.contract_id),
        contract_sha256=model.contract_sha256,
        candidate_id=_str_or_none(model.candidate_id),
        candidate_sha256=model.candidate_sha256,
        manifest_id=_str_or_none(model.manifest_id),
        manifest_sha256=model.manifest_sha256,
        snapshot_id=_str_or_none(model.snapshot_id),
        snapshot_sha256=model.snapshot_sha256,
        approval_id=_str_or_none(model.approval_id),
        gate_results=model.gate_results or {},
        evidence_ids=model.evidence_ids or [],
        final_status=model.final_status,
    )


def _domain_to_workflow_model(domain: ProjectLLMWorkflow, version: Optional[int] = None) -> WorkflowModel:
    """Convert ProjectLLMWorkflow (domain) to WorkflowModel (ORM)."""
    model = WorkflowModel(
        workflow_id=domain.workflow_id,
        specification_id=uuid5(NAMESPACE_URL, f"project-ai:specification:{domain.specification_id}"),
        target_family=domain.target_family,
        target_version=domain.target_version,
        requester_id=domain.requester_id,
        current_state=domain.current_state.value,
        created_at=domain.created_at,
        updated_at=domain.updated_at,
        contract_id=domain.contract_id,
        contract_sha256=domain.contract_sha256,
        candidate_id=domain.candidate_id,
        candidate_sha256=domain.candidate_sha256,
        manifest_id=domain.manifest_id,
        manifest_sha256=domain.manifest_sha256,
        snapshot_id=domain.snapshot_id,
        snapshot_sha256=domain.snapshot_sha256,
        approval_id=domain.approval_id,
        gate_results=domain.gate_results,
        evidence_ids=domain.evidence_ids,
        final_status=domain.final_status,
    )
    if version is not None:
        model.version = version
    return model


def _approval_model_to_domain(model: ApprovalModel) -> ImplementationApproval:
    """Convert ApprovalModel (ORM) to ImplementationApproval (domain model)."""
    from app.models.implementation_approval import ImplementationApprovalStatus
    
    return ImplementationApproval(
        approval_id=str(model.approval_id),
        workflow_id=str(model.workflow_id),
        candidate_sha256=model.candidate_sha256,
        placement_manifest_id=str(model.placement_manifest_id),
        placement_manifest_sha256=model.placement_manifest_sha256,
        target_family=model.target_family,
        target_version=model.target_version,
        approved_by=model.approved_by,
        approval_timestamp=model.approval_timestamp,
        status=ImplementationApprovalStatus(model.status),
        workflow_requester=model.workflow_requester,
        evidence=model.evidence or {},
        rejection_reason=model.rejection_reason,
    )


def _domain_to_approval_model(domain: ImplementationApproval) -> ApprovalModel:
    """Convert ImplementationApproval (domain) to ApprovalModel (ORM)."""
    return ApprovalModel(
        approval_id=domain.approval_id,
        workflow_id=domain.workflow_id,
        candidate_sha256=domain.candidate_sha256,
        placement_manifest_id=domain.placement_manifest_id,
        placement_manifest_sha256=domain.placement_manifest_sha256,
        target_family=domain.target_family,
        target_version=domain.target_version,
        approved_by=domain.approved_by,
        approval_timestamp=domain.approval_timestamp,
        status=domain.status.value,
        workflow_requester=domain.workflow_requester,
        evidence=domain.to_evidence_dict(),
        rejection_reason=domain.rejection_reason,
    )


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
    
    R3 PERSISTENCE:
    - All operations async
    - Workflows persisted via WorkflowRepository
    - Approvals persisted via ApprovalRepository
    - Caller must commit session to persist changes
    """
    
    def __init__(
        self,
        workflow_repo: WorkflowRepository,
        approval_repo: ApprovalRepository,
        state_transition_repo: StateTransitionRepository,
        session: AsyncSession
    ):
        """
        Initialize governance service with repository dependencies.
        
        Args:
            workflow_repo: Workflow repository
            approval_repo: Approval repository
            state_transition_repo: State transition repository
            session: Database session (caller must commit)
        """
        self.workflow_repo = workflow_repo
        self.approval_repo = approval_repo
        self.state_transition_repo = state_transition_repo
        self.session = session
    
    async def create_workflow(
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
            
        Note:
            Caller must call await session.commit() to persist changes
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
        
        # Persist to database
        workflow_model = _domain_to_workflow_model(workflow)
        await self.workflow_repo.upsert(workflow_model)
        
        # Persist initial state transition
        transition_model = StateTransitionModel(
            workflow_id=workflow_id,
            from_state=None,
            to_state=CanonicalWorkflowState.REQUESTED.value,
            timestamp=now,
            triggered_by="system",
            reason="Workflow created"
        )
        await self.state_transition_repo.create(transition_model)
        
        return workflow
    
    async def get_workflow(self, workflow_id: str) -> Optional[ProjectLLMWorkflow]:
        """
        Get workflow by ID.
        
        Args:
            workflow_id: Workflow identifier
            
        Returns:
            Workflow if found, None otherwise
        """
        workflow_model = await self.workflow_repo.get(workflow_id, verify_bindings=False)
        if workflow_model is None:
            return None
        
        # Load state transitions
        transitions = await self.state_transition_repo.list_by_workflow(workflow_id)
        workflow_model.state_transitions = transitions
        
        return _workflow_model_to_domain(workflow_model)

    @staticmethod
    def _validate_gate_1_approval_record(
        workflow: ProjectLLMWorkflow,
        triggered_by: str,
    ) -> dict:
        """
        Verify persisted Gate 1 approval record per Sol D4:
        - Explicit human principal (no automated triggers)
        - Requester self-approval forbidden (approved_by != workflow.requester_id and triggered_by != workflow.requester_id)
        - D4 SHC authority (brand == 'skillhubcore', role in {'super_admin', 'contract_admin'}, capability == 'project_llm:contract:approve')
        - Non-revoked APPROVED decision bound to non-empty workflow.contract_id and workflow.contract_sha256
        """
        forbidden_automated_triggers = {
            "",
            "system",
            "auto",
            "ensurecandidaterequested",
            "ui-auto",
            "automated",
            "bot",
        }
        normalized_trigger = (triggered_by or "").strip()
        if normalized_trigger.lower() in forbidden_automated_triggers:
            raise ValueError(
                "Authorization failed: Gate 1 requires an explicit verified human principal; automated transitions are forbidden"
            )
        requester_id = (workflow.requester_id or "").strip()
        if requester_id and normalized_trigger == requester_id:
            raise ValueError(
                "Authorization failed: Workflow requester cannot self-approve or advance Gate 1 without independent approval"
            )

        gate_1_record = (workflow.gate_results or {}).get("gate_1_approval")
        if not isinstance(gate_1_record, dict) or gate_1_record.get("status") != "APPROVED":
            raise ValueError(
                "Authorization failed: Cannot advance past Gate 1 without a persisted human Gate 1 approval decision"
            )
        if gate_1_record.get("revoked") is True:
            raise ValueError(
                "Authorization failed: Persisted Gate 1 approval decision has been revoked"
            )

        approved_by = (gate_1_record.get("approved_by") or "").strip()
        if not approved_by or approved_by.lower() in forbidden_automated_triggers:
            raise ValueError(
                "Authorization failed: Gate 1 approval record lacks a valid human approver identity"
            )
        if requester_id and approved_by == requester_id:
            raise ValueError(
                "Authorization failed: Gate 1 requester self-approval is forbidden"
            )

        approver_brand = (gate_1_record.get("brand") or "").strip().lower()
        if approver_brand != "skillhubcore":
            raise ValueError(
                "Authorization failed: Gate 1 approval requires verified skillhubcore authority"
            )
        approver_roles = gate_1_record.get("roles")
        if not isinstance(approver_roles, list) or not any(
            r in {"super_admin", "contract_admin"} for r in approver_roles
        ):
            raise ValueError(
                "Authorization failed: Gate 1 approval requires super_admin or contract_admin role"
            )
        if gate_1_record.get("capability") != "project_llm:contract:approve":
            raise ValueError(
                "Authorization failed: Gate 1 approval requires project_llm:contract:approve capability"
            )
        record_token_type = gate_1_record.get("token_type")
        if record_token_type is not None and str(record_token_type).strip().lower() != "admin":
            raise ValueError(
                "Authorization failed: Gate 1 approval requires admin credential class (token_type='admin')"
            )
        record_is_admin = gate_1_record.get("is_admin")
        if record_is_admin is not None and record_is_admin is not True:
            raise ValueError(
                "Authorization failed: Gate 1 approval requires is_admin=True"
            )
        record_aud = gate_1_record.get("aud")
        if record_aud is not None and str(record_aud).strip().lower() not in {"shc-admin", "admin"}:
            raise ValueError(
                "Authorization failed: Gate 1 approval requires shc-admin or admin audience"
            )

        workflow_contract_id = (workflow.contract_id or "").strip()
        approval_contract_id = (gate_1_record.get("contract_id") or "").strip()
        if not workflow_contract_id or not approval_contract_id or workflow_contract_id != approval_contract_id:
            raise ValueError(
                "Authorization failed: Gate 1 approval contract_id is missing or does not match workflow contract_id"
            )

        workflow_contract_sha = (workflow.contract_sha256 or "").strip().lower()
        approval_contract_sha = (gate_1_record.get("contract_sha256") or "").strip().lower()
        if not workflow_contract_sha or not approval_contract_sha or workflow_contract_sha != approval_contract_sha:
            raise ValueError(
                "Authorization failed: Gate 1 approval contract_sha256 is missing or does not match workflow contract_sha256"
            )

        return gate_1_record

    async def approve_gate_1(
        self,
        workflow_id: str,
        approved_by: str,
        actor_brand: str,
        actor_roles: list[str],
        actor_capabilities: Optional[list[str]] = None,
        actor_token_type: str = "admin",
        actor_is_admin: bool = True,
        actor_aud: str = "shc-admin",
        contract_id: Optional[str] = None,
        contract_sha256: Optional[str] = None,
        reason: Optional[str] = None,
        decision_id: Optional[str] = None,
    ) -> ProjectLLMWorkflow:
        """
        Record a verified human Gate 1 approval decision and transition AWAITING_GATE_1 -> GUI_APPROVED atomically.
        """
        workflow = await self.get_workflow(workflow_id)
        if workflow is None:
            raise ValueError(f"Workflow not found: {workflow_id}")

        normalized_approver = (approved_by or "").strip()
        normalized_brand = (actor_brand or "").strip().lower()
        roles_list = [str(r) for r in (actor_roles or [])]
        normalized_token_type = str(actor_token_type or "").strip().lower()
        normalized_aud = str(actor_aud or "").strip().lower()

        if normalized_token_type != "admin" or actor_is_admin is not True or normalized_aud not in {"shc-admin", "admin"}:
            raise ValueError(
                "Authorization failed: Gate 1 approval requires verified SHC admin credential class (token_type='admin', is_admin=True, aud in {'shc-admin', 'admin'})"
            )
        if normalized_brand != "skillhubcore":
            raise ValueError(
                "Authorization failed: Gate 1 approval requires verified skillhubcore authority"
            )
        if not any(r in {"super_admin", "contract_admin"} for r in roles_list):
            raise ValueError(
                "Authorization failed: Gate 1 approval requires super_admin or contract_admin role"
            )

        capabilities_list = (
            [str(c) for c in actor_capabilities]
            if actor_capabilities is not None
            else ["project_llm:contract:approve"]
        )
        if "project_llm:contract:approve" not in capabilities_list:
            raise ValueError(
                "Authorization failed: Gate 1 approval requires project_llm:contract:approve capability"
            )

        effective_contract_id = (contract_id or workflow.contract_id or "").strip()
        effective_contract_sha = (contract_sha256 or workflow.contract_sha256 or "").strip().lower()

        if workflow.current_state == CanonicalWorkflowState.GUI_APPROVED:
            existing_gate_1 = self._validate_gate_1_approval_record(workflow, normalized_approver)
            if (
                existing_gate_1.get("contract_id") == effective_contract_id
                and str(existing_gate_1.get("contract_sha256") or "").lower() == effective_contract_sha
            ):
                return workflow
            raise ValueError(
                "Authorization failed: Conflicting Gate 1 approval replay for already-approved workflow"
            )

        if workflow.current_state != CanonicalWorkflowState.AWAITING_GATE_1:
            raise ValueError(
                f"Invalid state for Gate 1 approval: {workflow.current_state.value}. Must be AWAITING_GATE_1"
            )

        existing_record = (workflow.gate_results or {}).get("gate_1_approval")
        if (
            isinstance(existing_record, dict)
            and decision_id
            and existing_record.get("decision_id") == decision_id
            and existing_record.get("revoked") is True
        ):
            raise ValueError("Authorization failed: Cannot replay a revoked Gate 1 decision_id")

        now = datetime.now(timezone.utc)
        approval_record = {
            "decision_id": decision_id or str(uuid4()),
            "status": "APPROVED",
            "revoked": False,
            "approved_by": normalized_approver,
            "brand": normalized_brand,
            "roles": roles_list,
            "token_type": normalized_token_type,
            "is_admin": True,
            "aud": normalized_aud,
            "capability": (
                "project_llm:contract:approve"
                if "project_llm:contract:approve" in capabilities_list
                else ""
            ),
            "approved_at": now.isoformat(),
            "contract_id": effective_contract_id,
            "contract_sha256": effective_contract_sha,
            "reason": (reason or "").strip() or "Explicit human Gate 1 contract approval",
        }

        current_gates = dict(workflow.gate_results or {})
        current_gates["gate_1_approval"] = approval_record
        workflow.gate_results = current_gates

        # Validate complete D4 contract before any repository writes
        self._validate_gate_1_approval_record(workflow, normalized_approver)

        transition = StateTransition(
            from_state=workflow.current_state,
            to_state=CanonicalWorkflowState.GUI_APPROVED,
            timestamp=now,
            triggered_by=normalized_approver,
            evidence_id=approval_record["decision_id"],
            reason=approval_record["reason"],
        )
        workflow.current_state = CanonicalWorkflowState.GUI_APPROVED
        workflow.state_history.append(transition)
        workflow.updated_at = now

        workflow_model_current = await self.workflow_repo.get(workflow_id, verify_bindings=False)
        if workflow_model_current is None:
            raise ValueError(f"Workflow not found in database: {workflow_id}")

        expected_version = workflow_model_current.version
        workflow_model = _domain_to_workflow_model(workflow)
        await self.workflow_repo.upsert(workflow_model, expected_version=expected_version)

        transition_model = StateTransitionModel(
            workflow_id=workflow_id,
            from_state=transition.from_state.value if transition.from_state else None,
            to_state=transition.to_state.value,
            timestamp=transition.timestamp,
            triggered_by=transition.triggered_by,
            evidence_id=transition.evidence_id,
            reason=transition.reason,
        )
        await self.state_transition_repo.create(transition_model)
        return workflow

    async def revoke_gate_1_approval(
        self,
        workflow_id: str,
        revoked_by: str,
        reason: str,
    ) -> ProjectLLMWorkflow:
        """Revoke an existing Gate 1 approval record so it cannot authorize subsequent transitions."""
        workflow_model = await self.workflow_repo.get(workflow_id, verify_bindings=False)
        if workflow_model is None:
            raise ValueError(f"Workflow not found: {workflow_id}")

        current_gates = dict(workflow_model.gate_results or {})
        gate_1_record = dict(current_gates.get("gate_1_approval") or {})
        if not gate_1_record:
            raise ValueError("No Gate 1 approval record exists to revoke")

        gate_1_record["status"] = "REVOKED"
        gate_1_record["revoked"] = True
        gate_1_record["revoked_by"] = (revoked_by or "").strip()
        gate_1_record["revoked_at"] = datetime.now(timezone.utc).isoformat()
        gate_1_record["revocation_reason"] = (reason or "").strip() or "Gate 1 approval revoked"
        current_gates["gate_1_approval"] = gate_1_record
        workflow_model.gate_results = current_gates
        workflow_model.updated_at = datetime.now(timezone.utc)
        await self.workflow_repo.upsert(workflow_model, expected_version=workflow_model.version)
        return await self.get_workflow(workflow_id)
    
    async def validate_transition(
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
        workflow = await self.get_workflow(workflow_id)
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
    
    async def transition_state(
        self,
        workflow_id: str,
        to_state: CanonicalWorkflowState,
        triggered_by: str,
        evidence_id: Optional[str] = None,
        reason: Optional[str] = None
    ) -> ProjectLLMWorkflow:
        """
        Execute a state transition with validation and optimistic locking.
        
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
            OptimisticLockError: If concurrent modification detected
            
        Note:
            Caller must call await session.commit() to persist changes
        """
        # Validate transition
        is_valid, validation_reason = await self.validate_transition(workflow_id, to_state)
        if not is_valid:
            raise ValueError(validation_reason)
        
        workflow = await self.get_workflow(workflow_id)
        if workflow is None:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        # Special authorization for IMPLEMENTING transition
        if to_state == CanonicalWorkflowState.IMPLEMENTING:
            # Use async repository-based authorization check (no temporary dict)
            can_implement, auth_reason = await can_transition_to_implementing_async(
                workflow_id=workflow_id,
                approval_repo=self.approval_repo,
                requester_id=workflow.requester_id,
                candidate_sha256=workflow.candidate_sha256 or "",
                manifest_id=workflow.manifest_id or "",
                manifest_sha256=workflow.manifest_sha256 or ""
            )
            if not can_implement:
                raise ValueError(f"Authorization failed: {auth_reason}")

        # Execute transition
        now = datetime.now(timezone.utc)

        # Gate 1 human approval enforcement and persisted approval binding (TC15 / D4)
        if to_state == CanonicalWorkflowState.GUI_APPROVED:
            normalized_reason = (reason or "").strip()
            if "ensurecandidaterequested" in normalized_reason.lower() or "auto-approve" in normalized_reason.lower():
                raise ValueError(
                    "Authorization failed: Gate 1 auto-approval bypass is forbidden"
                )
            self._validate_gate_1_approval_record(workflow, triggered_by)

        if (
            workflow.current_state == CanonicalWorkflowState.GUI_APPROVED
            and to_state == CanonicalWorkflowState.CANDIDATE_REQUESTED
        ):
            self._validate_gate_1_approval_record(workflow, triggered_by)

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
        
        # Load current model to get version for optimistic locking
        workflow_model_current = await self.workflow_repo.get(workflow_id, verify_bindings=False)
        if workflow_model_current is None:
            raise ValueError(f"Workflow not found in database: {workflow_id}")
        
        expected_version = workflow_model_current.version
        
        # Update workflow with optimistic locking
        workflow_model = _domain_to_workflow_model(workflow)
        await self.workflow_repo.upsert(workflow_model, expected_version=expected_version)
        
        # Persist state transition
        transition_model = StateTransitionModel(
            workflow_id=workflow_id,
            from_state=transition.from_state.value if transition.from_state else None,
            to_state=transition.to_state.value,
            timestamp=transition.timestamp,
            triggered_by=transition.triggered_by,
            evidence_id=transition.evidence_id,
            reason=transition.reason
        )
        await self.state_transition_repo.create(transition_model)
        
        return workflow
    
    async def register_approval(
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
            
        Note:
            Caller must call await session.commit() to persist changes
        """
        workflow_model = await self.workflow_repo.get(workflow_id, verify_bindings=False)
        if workflow_model is None:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        # Persist approval
        approval_model = _domain_to_approval_model(approval)
        await self.approval_repo.upsert(approval_model)
        
        # Update workflow with approval_id
        workflow_model.approval_id = approval.approval_id
        workflow_model.updated_at = datetime.now(timezone.utc)
        await self.workflow_repo.upsert(workflow_model, expected_version=workflow_model.version)
    
    async def bind_artifact(
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
            
        Note:
            Caller must call await session.commit() to persist changes
        """
        workflow_model = await self.workflow_repo.get(workflow_id, verify_bindings=False)
        if workflow_model is None:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        if artifact_type == "contract":
            if (
                workflow_model.contract_id is not None
                and str(workflow_model.contract_id) != str(artifact_id)
            ) or (
                workflow_model.contract_sha256 is not None
                and workflow_model.contract_sha256 != artifact_sha256
            ):
                current_gates = dict(workflow_model.gate_results or {})
                if isinstance(current_gates.get("gate_1_approval"), dict):
                    revoked_gate = dict(current_gates["gate_1_approval"])
                    revoked_gate["status"] = "REVOKED_BY_CONTRACT_CHANGE"
                    revoked_gate["revoked"] = True
                    current_gates["gate_1_approval"] = revoked_gate
                    workflow_model.gate_results = current_gates
            workflow_model.contract_id = artifact_id
            workflow_model.contract_sha256 = artifact_sha256
        elif artifact_type == "candidate":
            if (
                workflow_model.candidate_id is not None
                and str(workflow_model.candidate_id) != str(artifact_id)
            ) or (
                workflow_model.candidate_sha256 is not None
                and workflow_model.candidate_sha256 != artifact_sha256
            ):
                workflow_model.manifest_id = None
                workflow_model.manifest_sha256 = None
                workflow_model.approval_id = None
            workflow_model.candidate_id = artifact_id
            workflow_model.candidate_sha256 = artifact_sha256
        elif artifact_type == "manifest":
            workflow_model.manifest_id = artifact_id
            workflow_model.manifest_sha256 = artifact_sha256
        elif artifact_type == "snapshot":
            workflow_model.snapshot_id = artifact_id
            workflow_model.snapshot_sha256 = artifact_sha256
        else:
            raise ValueError(
                f"Invalid artifact type: {artifact_type}. "
                f"Must be one of: contract, candidate, manifest, snapshot"
            )
        
        workflow_model.updated_at = datetime.now(timezone.utc)
        await self.workflow_repo.upsert(workflow_model, expected_version=workflow_model.version)
    
    async def list_workflows(
        self,
        state: Optional[str] = None,
        requester_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> list[ProjectLLMWorkflow]:
        """
        List workflows with optional filtering and pagination.
        
        Args:
            state: Optional state filter (e.g., "REQUESTED", "BRIEF_READY")
                   If both state and requester_id are None, defaults to "REQUESTED" state
                   to prevent inefficient full-table scans in production.
            requester_id: Optional requester filter
            limit: Maximum number of workflows to return (default 100)
            offset: Number of workflows to skip for pagination (default 0)
        
        Returns:
            List of workflows matching filters
            
        Note:
            Default behavior when no filters provided: returns workflows in REQUESTED state only.
            To list all workflows regardless of state, iterate through each state explicitly.
            In production, ensure database queries are indexed on state and requester_id.
            Consider adding created_at range filters for time-based queries.
        """
        # Apply filters based on provided parameters
        if requester_id:
            workflow_models = await self.workflow_repo.list_by_requester(requester_id)
            if state:
                workflow_models = [wf for wf in workflow_models if wf.current_state == state]
        elif state:
            workflow_models = await self.workflow_repo.list_by_state(state)
        else:
            # No filters: return workflows by REQUESTED state as default
            # (listing all workflows would be inefficient in production)
            workflow_models = await self.workflow_repo.list_by_state("REQUESTED")
        
        # Apply pagination
        paginated_models = workflow_models[offset:offset + limit]
        
        # Load state transitions and convert to domain models
        result = []
        for wf_model in paginated_models:
            transitions = await self.state_transition_repo.list_by_workflow(wf_model.workflow_id)
            wf_model.state_transitions = transitions
            result.append(_workflow_model_to_domain(wf_model))
        
        return result

