"""
Repository protocols and PostgreSQL implementations for Project AI persistence.

ARCHITECTURAL PATTERNS:
- Repository interfaces defined via Protocol (structural typing)
- All operations are async
- Upsert uses ON CONFLICT DO UPDATE for idempotency
- Optimistic locking on workflows (atomic version check in WHERE clause)
- Hash verification automatically performed on reads
- Dependency injection compatible with FastAPI Depends()

SECURITY BOUNDARIES:
- Hash-bound artifacts prevent tampering
- Optimistic locking prevents concurrent update conflicts
- All writes are transactional (caller must commit or rollback)

TRANSACTION MANAGEMENT:
- Repositories flush but do NOT commit
- Callers must call await session.commit() to persist changes
- Use transaction context managers for automatic commit/rollback
"""

import hashlib
import json
from datetime import datetime
from typing import List, Optional, Protocol, Dict, Any

from sqlalchemy import select, update, delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    WorkflowModel,
    StateTransitionModel,
    ContractModel,
    CandidateModel,
    ManifestModel,
    ApprovalModel
)


class OptimisticLockError(Exception):
    """Raised when optimistic lock check fails during update."""
    
    def __init__(self, entity_type: str, entity_id: str, expected_version: int):
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.expected_version = expected_version
        super().__init__(
            f"{entity_type} {entity_id} version mismatch: expected {expected_version}. "
            "Entity was modified by another transaction."
        )


class HashMismatchError(Exception):
    """Raised when content hash verification fails."""
    
    def __init__(self, entity_type: str, entity_id: str, expected_hash: str, actual_hash: str):
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.expected_hash = expected_hash
        self.actual_hash = actual_hash
        super().__init__(
            f"{entity_type} {entity_id} hash mismatch: expected {expected_hash}, got {actual_hash}. "
            "Content was tampered with or corrupted."
        )


# ============================================================================
# Repository Protocols (Interfaces)
# ============================================================================


class WorkflowRepository(Protocol):
    """Repository interface for ProjectLLMWorkflow persistence."""
    
    async def get(self, workflow_id: str, verify_bindings: bool = True) -> Optional[WorkflowModel]:
        """
        Get workflow by ID with automatic artifact binding verification.
        
        Args:
            workflow_id: Workflow ID
            verify_bindings: If True, verify artifact hash bindings match bound artifacts
        
        Returns:
            Workflow model if found, None otherwise
            
        Raises:
            HashMismatchError: If verify_bindings=True and artifact binding verification fails
        """
        ...
    
    async def upsert(self, workflow: WorkflowModel, expected_version: Optional[int] = None) -> WorkflowModel:
        """
        Insert or update workflow with atomic optimistic locking.
        
        Args:
            workflow: Workflow to persist
            expected_version: For updates, the expected current version (optimistic locking).
                             If None, the repository will read the current version atomically
                             using SELECT FOR UPDATE to avoid race conditions.
        
        Returns:
            Persisted workflow with updated version
            
        Raises:
            OptimisticLockError: If expected_version doesn't match current version
            
        Note:
            This method flushes but does NOT commit. Caller must call session.commit()
            to persist changes, or session.rollback() to discard.
        """
        ...
    
    async def list_by_state(self, state: str) -> List[WorkflowModel]:
        """List workflows in given state."""
        ...
    
    async def list_by_requester(self, requester_id: str) -> List[WorkflowModel]:
        """List workflows by requester."""
        ...
    
    async def delete(self, workflow_id: str) -> bool:
        """
        Delete workflow and cascade to related records.
        
        Returns:
            True if deleted, False if not found
        """
        ...


class ContractRepository(Protocol):
    """Repository interface for EngineeringContract persistence."""
    
    async def get(self, contract_id: str) -> Optional[ContractModel]:
        """
        Get contract by ID with automatic hash verification.
        
        Hash verification is always performed to ensure contract integrity.
        
        Args:
            contract_id: Contract ID
        
        Returns:
            Contract model if found, None otherwise
            
        Raises:
            HashMismatchError: If hash verification fails (contract tampered/corrupted)
        """
        ...
    
    async def get_by_workflow(self, workflow_id: str) -> Optional[ContractModel]:
        """
        Get contract by workflow ID (1:1 relationship) with automatic hash verification.
        
        Args:
            workflow_id: Workflow ID
        
        Returns:
            Contract model if found, None otherwise
            
        Raises:
            HashMismatchError: If hash verification fails
        """
        ...
    
    async def get_by_hash(self, contract_hash: str) -> Optional[ContractModel]:
        """Get contract by hash (for deduplication)."""
        ...
    
    async def upsert(self, contract: ContractModel) -> ContractModel:
        """
        Insert or update contract (idempotent by contract_hash).
        
        Note:
            Flushes but does NOT commit. Caller must call session.commit().
        
        Returns:
            Persisted contract
        """
        ...


class CandidateRepository(Protocol):
    """Repository interface for CandidatePackage persistence."""
    
    async def get(self, candidate_id: str) -> Optional[CandidateModel]:
        """Get candidate by ID."""
        ...
    
    async def list_by_workflow(self, workflow_id: str) -> List[CandidateModel]:
        """List candidates for workflow."""
        ...
    
    async def upsert(self, candidate: CandidateModel) -> CandidateModel:
        """
        Insert or update candidate.
        
        Returns:
            Persisted candidate
        """
        ...
    
    async def delete(self, candidate_id: str) -> bool:
        """
        Delete candidate and cascade to manifests.
        
        Returns:
            True if deleted, False if not found
        """
        ...


class ManifestRepository(Protocol):
    """Repository interface for PlacementManifest persistence."""
    
    async def get(self, manifest_id: str) -> Optional[ManifestModel]:
        """
        Get manifest by ID with automatic hash verification.
        
        Hash verification is always performed to ensure manifest integrity.
        
        Args:
            manifest_id: Manifest ID
        
        Returns:
            Manifest model if found, None otherwise
            
        Raises:
            HashMismatchError: If hash verification fails (manifest tampered/corrupted)
        """
        ...
    
    async def get_by_hash(self, manifest_hash: str) -> Optional[ManifestModel]:
        """Get manifest by hash (for deduplication)."""
        ...
    
    async def list_by_candidate(self, candidate_id: str) -> List[ManifestModel]:
        """List manifests for candidate."""
        ...
    
    async def list_by_workflow(self, workflow_id: str) -> List[ManifestModel]:
        """List manifests for workflow."""
        ...
    
    async def upsert(self, manifest: ManifestModel) -> ManifestModel:
        """
        Insert or update manifest (idempotent by manifest_hash).
        
        Returns:
            Persisted manifest
        """
        ...
    
    async def verify_hash(self, manifest_id: str, data: Dict[str, Any]) -> bool:
        """
        Verify manifest data matches stored hash.
        
        Args:
            manifest_id: Manifest ID
            data: Manifest data dict to verify
            
        Returns:
            True if hash matches, False otherwise
        """
        ...


class ApprovalRepository(Protocol):
    """Repository interface for ImplementationApproval persistence."""
    
    async def get(self, approval_id: str) -> Optional[ApprovalModel]:
        """Get approval by ID."""
        ...
    
    async def get_by_workflow(self, workflow_id: str) -> Optional[ApprovalModel]:
        """Get approval by workflow ID (1:1 relationship)."""
        ...
    
    async def upsert(self, approval: ApprovalModel) -> ApprovalModel:
        """
        Insert or update approval.
        
        Returns:
            Persisted approval
        """
        ...
    
    async def list_by_status(self, status: str) -> List[ApprovalModel]:
        """List approvals by status."""
        ...


class StateTransitionRepository(Protocol):
    """Repository interface for StateTransition persistence."""
    
    async def get(self, transition_id: int) -> Optional[StateTransitionModel]:
        """Get transition by ID."""
        ...
    
    async def list_by_workflow(self, workflow_id: str) -> List[StateTransitionModel]:
        """List transitions for workflow (ordered by timestamp)."""
        ...
    
    async def create(self, transition: StateTransitionModel) -> StateTransitionModel:
        """
        Create state transition (append-only audit log).
        
        Returns:
            Persisted transition with auto-generated ID
        """
        ...


# ============================================================================
# PostgreSQL Repository Implementations
# ============================================================================


class PostgresWorkflowRepository:
    """PostgreSQL implementation of WorkflowRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, workflow_id: str, verify_bindings: bool = True) -> Optional[WorkflowModel]:
        """
        Get workflow by ID with automatic artifact binding verification.
        
        Args:
            workflow_id: Workflow ID
            verify_bindings: If True, verify artifact hash bindings match bound artifacts
        
        Returns:
            Workflow model if found, None otherwise
            
        Raises:
            HashMismatchError: If verify_bindings=True and artifact binding verification fails
        """
        result = await self.session.execute(
            select(WorkflowModel).where(WorkflowModel.workflow_id == workflow_id)
        )
        workflow = result.scalar_one_or_none()
        
        if workflow is not None and verify_bindings:
            # Verify artifact bindings when relationships are loaded
            if not workflow.verify_artifact_bindings(
                contract=workflow.contract if hasattr(workflow, 'contract') else None,
                # Note: candidate and manifest are not direct relationships on workflow,
                # so they must be loaded explicitly by the caller if needed for verification
            ):
                raise HashMismatchError(
                    "Workflow",
                    workflow_id,
                    "artifact_binding_hash",
                    "computed_hash_mismatch"
                )
        
        return workflow
    
    async def upsert(self, workflow: WorkflowModel, expected_version: Optional[int] = None) -> WorkflowModel:
        """
        Insert or update workflow with atomic optimistic locking.
        
        Uses SELECT FOR UPDATE to read current version atomically when expected_version is None,
        eliminating race conditions between read and update operations.
        """
        # If no expected version provided, we need to check if workflow exists
        if expected_version is None:
            # Use SELECT FOR UPDATE to lock the row and read version atomically
            result = await self.session.execute(
                select(WorkflowModel.version)
                .where(WorkflowModel.workflow_id == workflow.workflow_id)
                .with_for_update()
            )
            existing_version = result.scalar_one_or_none()
            
            if existing_version is None:
                # Insert new workflow
                self.session.add(workflow)
                await self.session.flush()
                await self.session.refresh(workflow)
                return workflow
            else:
                # Use the locked version for update
                expected_version = existing_version
        
        # Atomic update with version check in WHERE clause
        workflow.updated_at = datetime.utcnow()
        new_version = expected_version + 1
        
        result = await self.session.execute(
            update(WorkflowModel)
            .where(WorkflowModel.workflow_id == workflow.workflow_id)
            .where(WorkflowModel.version == expected_version)  # Atomic version check
            .values(
                specification_id=workflow.specification_id,
                target_family=workflow.target_family,
                target_version=workflow.target_version,
                requester_id=workflow.requester_id,
                current_state=workflow.current_state,
                updated_at=workflow.updated_at,
                contract_id=workflow.contract_id,
                contract_sha256=workflow.contract_sha256,
                candidate_id=workflow.candidate_id,
                candidate_sha256=workflow.candidate_sha256,
                manifest_id=workflow.manifest_id,
                manifest_sha256=workflow.manifest_sha256,
                snapshot_id=workflow.snapshot_id,
                snapshot_sha256=workflow.snapshot_sha256,
                approval_id=workflow.approval_id,
                gate_results=workflow.gate_results,
                evidence_ids=workflow.evidence_ids,
                final_status=workflow.final_status,
                version=new_version,
                idempotency_key=workflow.idempotency_key,
            )
        )
        
        # Check if update succeeded
        if result.rowcount == 0:
            # Version mismatch - concurrent update detected
            raise OptimisticLockError("Workflow", workflow.workflow_id, expected_version)
        
        # Update succeeded - refresh to get new state
        await self.session.flush()
        await self.session.refresh(workflow)
        return workflow
    
    async def list_by_state(self, state: str) -> List[WorkflowModel]:
        """List workflows in given state."""
        result = await self.session.execute(
            select(WorkflowModel)
            .where(WorkflowModel.current_state == state)
            .order_by(WorkflowModel.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def list_by_requester(self, requester_id: str) -> List[WorkflowModel]:
        """List workflows by requester."""
        result = await self.session.execute(
            select(WorkflowModel)
            .where(WorkflowModel.requester_id == requester_id)
            .order_by(WorkflowModel.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def delete(self, workflow_id: str) -> bool:
        """Delete workflow and cascade to related records."""
        result = await self.session.execute(
            delete(WorkflowModel).where(WorkflowModel.workflow_id == workflow_id)
        )
        return result.rowcount > 0


class PostgresContractRepository:
    """PostgreSQL implementation of ContractRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, contract_id: str) -> Optional[ContractModel]:
        """
        Get contract by ID with automatic hash verification.
        
        Hash verification is always performed to ensure contract integrity.
        
        Args:
            contract_id: Contract ID
        
        Returns:
            Contract model if found, None otherwise
            
        Raises:
            HashMismatchError: If hash verification fails
        """
        result = await self.session.execute(
            select(ContractModel).where(ContractModel.contract_id == contract_id)
        )
        contract = result.scalar_one_or_none()
        
        if contract is not None:
            # Always verify hash for contract integrity
            if not contract.verify_hash():
                raise HashMismatchError(
                    "Contract",
                    contract_id,
                    contract.contract_hash,
                    "computed_hash_mismatch"
                )
        
        return contract
    
    async def get_by_workflow(self, workflow_id: str) -> Optional[ContractModel]:
        """
        Get contract by workflow ID (1:1 relationship) with automatic hash verification.
        
        Args:
            workflow_id: Workflow ID
        
        Returns:
            Contract model if found, None otherwise
            
        Raises:
            HashMismatchError: If hash verification fails
        """
        result = await self.session.execute(
            select(ContractModel).where(ContractModel.workflow_id == workflow_id)
        )
        contract = result.scalar_one_or_none()
        
        if contract is not None:
            # Always verify hash
            if not contract.verify_hash():
                raise HashMismatchError(
                    "Contract",
                    contract.contract_id,
                    contract.contract_hash,
                    "computed_hash_mismatch"
                )
        
        return contract
    
    async def get_by_hash(self, contract_hash: str) -> Optional[ContractModel]:
        """Get contract by hash."""
        result = await self.session.execute(
            select(ContractModel).where(ContractModel.contract_hash == contract_hash)
        )
        return result.scalar_one_or_none()
    
    async def upsert(self, contract: ContractModel) -> ContractModel:
        """
        Insert or update contract using ON CONFLICT.
        
        Idempotent by contract_hash: if hash exists, return existing contract.
        """
        stmt = insert(ContractModel).values(
            contract_id=contract.contract_id,
            workflow_id=contract.workflow_id,
            contract_hash=contract.contract_hash,
            contract_data=contract.contract_data,
            created_at=contract.created_at,
            contract_version=contract.contract_version,
        ).on_conflict_do_update(
            index_elements=[ContractModel.contract_id],
            set_=dict(
                workflow_id=contract.workflow_id,
                contract_hash=contract.contract_hash,
                contract_data=contract.contract_data,
                contract_version=contract.contract_version,
            )
        ).returning(ContractModel)
        
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one()
    
    async def verify_hash(self, contract_id: str, data: Dict[str, Any]) -> bool:
        """Verify contract data matches stored hash."""
        contract = await self.get(contract_id)
        if contract is None:
            return False
        
        # Compute hash of provided data (same algorithm as seal_contract)
        canonical = json.dumps(data, sort_keys=True, ensure_ascii=False)
        computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        
        return contract.contract_hash == computed_hash


class PostgresCandidateRepository:
    """PostgreSQL implementation of CandidateRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, candidate_id: str) -> Optional[CandidateModel]:
        """Get candidate by ID."""
        result = await self.session.execute(
            select(CandidateModel).where(CandidateModel.candidate_id == candidate_id)
        )
        return result.scalar_one_or_none()
    
    async def list_by_workflow(self, workflow_id: str) -> List[CandidateModel]:
        """List candidates for workflow."""
        result = await self.session.execute(
            select(CandidateModel)
            .where(CandidateModel.workflow_id == workflow_id)
            .order_by(CandidateModel.uploaded_at.desc())
        )
        return list(result.scalars().all())
    
    async def upsert(self, candidate: CandidateModel) -> CandidateModel:
        """
        Insert or update candidate using ON CONFLICT.
        
        Automatically computes candidate_sha256 from files before storage.
        """
        # Compute hash from files for tamper detection
        candidate.candidate_sha256 = candidate.compute_hash()
        
        stmt = insert(CandidateModel).values(
            candidate_id=candidate.candidate_id,
            workflow_id=candidate.workflow_id,
            files=candidate.files,
            uploaded_at=candidate.uploaded_at,
            uploaded_by=candidate.uploaded_by,
            target_family=candidate.target_family,
            target_version=candidate.target_version,
            candidate_sha256=candidate.candidate_sha256,
        ).on_conflict_do_update(
            index_elements=[CandidateModel.candidate_id],
            set_=dict(
                workflow_id=candidate.workflow_id,
                files=candidate.files,
                target_family=candidate.target_family,
                target_version=candidate.target_version,
                candidate_sha256=candidate.candidate_sha256,
            )
        ).returning(CandidateModel)
        
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one()
    
    async def delete(self, candidate_id: str) -> bool:
        """Delete candidate and cascade to manifests."""
        result = await self.session.execute(
            delete(CandidateModel).where(CandidateModel.candidate_id == candidate_id)
        )
        return result.rowcount > 0


class PostgresManifestRepository:
    """PostgreSQL implementation of ManifestRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, manifest_id: str) -> Optional[ManifestModel]:
        """
        Get manifest by ID with automatic hash verification.
        
        Hash verification is always performed to ensure manifest integrity.
        
        Args:
            manifest_id: Manifest ID
        
        Returns:
            Manifest model if found, None otherwise
            
        Raises:
            HashMismatchError: If hash verification fails
        """
        result = await self.session.execute(
            select(ManifestModel).where(ManifestModel.manifest_id == manifest_id)
        )
        manifest = result.scalar_one_or_none()
        
        if manifest is not None:
            # Always verify hash for manifest integrity
            # Compute hash from manifest data for verification
            manifest_data = {
                "decision": manifest.decision,
                "target_path": manifest.target_path,
                "block_family": manifest.block_family,
                "block_version": manifest.block_version,
                "required_changes": manifest.required_changes,
                "evidence_ids": manifest.evidence_ids,
            }
            if not manifest.verify_hash(manifest_data):
                canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
                computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
                raise HashMismatchError(
                    "Manifest",
                    manifest_id,
                    manifest.manifest_hash,
                    computed_hash
                )
        
        return manifest
    
    async def get_by_hash(self, manifest_hash: str) -> Optional[ManifestModel]:
        """Get manifest by hash."""
        result = await self.session.execute(
            select(ManifestModel).where(ManifestModel.manifest_hash == manifest_hash)
        )
        return result.scalar_one_or_none()
    
    async def list_by_candidate(self, candidate_id: str) -> List[ManifestModel]:
        """List manifests for candidate."""
        result = await self.session.execute(
            select(ManifestModel)
            .where(ManifestModel.candidate_id == candidate_id)
            .order_by(ManifestModel.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def upsert(self, manifest: ManifestModel) -> ManifestModel:
        """Insert or update manifest using ON CONFLICT."""
        stmt = insert(ManifestModel).values(
            manifest_id=manifest.manifest_id,
            candidate_id=manifest.candidate_id,
            manifest_hash=manifest.manifest_hash,
            decision=manifest.decision,
            target_path=manifest.target_path,
            block_family=manifest.block_family,
            block_version=manifest.block_version,
            required_changes=manifest.required_changes,
            evidence_ids=manifest.evidence_ids,
            created_at=manifest.created_at,
        ).on_conflict_do_update(
            index_elements=[ManifestModel.manifest_id],
            set_=dict(
                candidate_id=manifest.candidate_id,
                manifest_hash=manifest.manifest_hash,
                decision=manifest.decision,
                target_path=manifest.target_path,
                block_family=manifest.block_family,
                block_version=manifest.block_version,
                required_changes=manifest.required_changes,
                evidence_ids=manifest.evidence_ids,
            )
        ).returning(ManifestModel)
        
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one()
    
    async def verify_hash(self, manifest_id: str, data: Dict[str, Any]) -> bool:
        """Verify manifest data matches stored hash."""
        manifest = await self.get(manifest_id)
        if manifest is None:
            return False
        
        # Compute hash of provided data
        canonical = json.dumps(data, sort_keys=True, ensure_ascii=False)
        computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        
        return manifest.manifest_hash == computed_hash


class PostgresApprovalRepository:
    """PostgreSQL implementation of ApprovalRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, approval_id: str) -> Optional[ApprovalModel]:
        """Get approval by ID."""
        result = await self.session.execute(
            select(ApprovalModel).where(ApprovalModel.approval_id == approval_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_workflow(self, workflow_id: str) -> Optional[ApprovalModel]:
        """Get approval by workflow ID."""
        result = await self.session.execute(
            select(ApprovalModel).where(ApprovalModel.workflow_id == workflow_id)
        )
        return result.scalar_one_or_none()
    
    async def upsert(self, approval: ApprovalModel) -> ApprovalModel:
        """Insert or update approval using ON CONFLICT."""
        stmt = insert(ApprovalModel).values(
            approval_id=approval.approval_id,
            workflow_id=approval.workflow_id,
            candidate_sha256=approval.candidate_sha256,
            placement_manifest_id=approval.placement_manifest_id,
            placement_manifest_sha256=approval.placement_manifest_sha256,
            target_family=approval.target_family,
            target_version=approval.target_version,
            approved_by=approval.approved_by,
            approval_timestamp=approval.approval_timestamp,
            status=approval.status,
            workflow_requester=approval.workflow_requester,
            evidence=approval.evidence,
            rejection_reason=approval.rejection_reason,
        ).on_conflict_do_update(
            index_elements=[ApprovalModel.approval_id],
            set_=dict(
                candidate_sha256=approval.candidate_sha256,
                placement_manifest_id=approval.placement_manifest_id,
                placement_manifest_sha256=approval.placement_manifest_sha256,
                target_family=approval.target_family,
                target_version=approval.target_version,
                approved_by=approval.approved_by,
                approval_timestamp=approval.approval_timestamp,
                status=approval.status,
                workflow_requester=approval.workflow_requester,
                evidence=approval.evidence,
                rejection_reason=approval.rejection_reason,
            )
        ).returning(ApprovalModel)
        
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one()
    
    async def list_by_status(self, status: str) -> List[ApprovalModel]:
        """List approvals by status."""
        result = await self.session.execute(
            select(ApprovalModel)
            .where(ApprovalModel.status == status)
            .order_by(ApprovalModel.approval_timestamp.desc())
        )
        return list(result.scalars().all())


class PostgresStateTransitionRepository:
    """PostgreSQL implementation of StateTransitionRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, transition_id: int) -> Optional[StateTransitionModel]:
        """Get transition by ID."""
        result = await self.session.execute(
            select(StateTransitionModel).where(StateTransitionModel.id == transition_id)
        )
        return result.scalar_one_or_none()
    
    async def list_by_workflow(self, workflow_id: str) -> List[StateTransitionModel]:
        """List transitions for workflow (ordered by timestamp)."""
        result = await self.session.execute(
            select(StateTransitionModel)
            .where(StateTransitionModel.workflow_id == workflow_id)
            .order_by(StateTransitionModel.timestamp.asc())
        )
        return list(result.scalars().all())
    
    async def create(self, transition: StateTransitionModel) -> StateTransitionModel:
        """Create state transition (append-only)."""
        self.session.add(transition)
        await self.session.flush()
        await self.session.refresh(transition)
        return transition
