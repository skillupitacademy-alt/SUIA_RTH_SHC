"""
SQLAlchemy ORM models for Project AI persistence.

TABLE NAMING CONVENTION:
- All tables use project_ai_* prefix to namespace within tutorial_prod database
- Examples: project_ai_workflows, project_ai_contracts, project_ai_candidates

ARCHITECTURAL RULES:
- All operations are async (use AsyncSession)
- Models map to domain models (ProjectLLMWorkflow, EngineeringContract, etc.)
- Relationships use lazy='selectin' for async compatibility
- JSON fields for complex data structures (gate_results, evidence, etc.)
- Hash fields (SHA-256) for tamper detection
- Optimistic locking via version column on workflows
- Schema changes ONLY through Drizzle migrations (no create_all())

DOMAIN MODEL MAPPING:
- to_domain() methods convert ORM models to domain dataclasses
- from_domain() factory methods convert domain models to ORM models
- FEAT-003 must complete domain model mapping for ProjectLLMWorkflow integration
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, TYPE_CHECKING

from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, Index, JSON, Text, UniqueConstraint, Identity
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base, Mapped, mapped_column
from sqlalchemy.sql import text

# Avoid circular imports during type checking
if TYPE_CHECKING:
    from app.models.workflow import ProjectLLMWorkflow


# Declarative base for ORM models
Base = declarative_base()


class WorkflowModel(Base):
    """
    ORM model for ProjectLLMWorkflow.
    
    Stores workflow lifecycle state, artifact bindings, and approval tracking.
    """
    
    __tablename__ = "project_ai_workflows"
    
    # Primary key (uuid to match Drizzle schema and PostgreSQL database)
    workflow_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Target specification
    specification_id = Column(UUID(as_uuid=True), nullable=False)
    target_family = Column(String(100), nullable=False)
    target_version = Column(String(100), nullable=False)
    requester_id = Column(String(255), nullable=False)
    
    # Lifecycle state
    current_state = Column(String(100), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Artifact bindings (hash-bound for security)
    contract_id = Column(UUID(as_uuid=True), nullable=True)
    contract_sha256 = Column(String(64), nullable=True)
    
    candidate_id = Column(UUID(as_uuid=True), nullable=True)
    candidate_sha256 = Column(String(64), nullable=True)
    
    manifest_id = Column(UUID(as_uuid=True), nullable=True)
    manifest_sha256 = Column(String(64), nullable=True)
    
    snapshot_id = Column(UUID(as_uuid=True), nullable=True)
    snapshot_sha256 = Column(String(64), nullable=True)
    
    # Approval tracking
    approval_id = Column(UUID(as_uuid=True), nullable=True)
    gate_results = Column(JSON, nullable=False, default=dict)
    
    # Evidence
    evidence_ids = Column(JSON, nullable=False, default=list)
    
    # Terminal status
    final_status = Column(String(50), nullable=True)
    
    # Optimistic locking
    version = Column(Integer, nullable=False, default=1)
    
    # Idempotency support
    idempotency_key = Column(String(255), nullable=True, unique=True)
    
    # Relationships
    state_transitions = relationship(
        "StateTransitionModel",
        back_populates="workflow",
        lazy="selectin",
        cascade="all, delete-orphan"
    )
    contract = relationship(
        "ContractModel",
        back_populates="workflow",
        uselist=False,
        lazy="selectin"
    )
    approval = relationship(
        "ApprovalModel",
        back_populates="workflow",
        uselist=False,
        lazy="selectin"
    )
    
    # Indexes
    __table_args__ = (
        Index("idx_workflow_state", "current_state"),
        Index("idx_workflow_requester", "requester_id"),
        Index("idx_workflow_target", "target_family", "target_version"),
        Index("idx_workflow_contract_sha", "contract_sha256"),
        Index("idx_workflow_candidate_sha", "candidate_sha256"),
        Index("idx_workflow_manifest_sha", "manifest_sha256"),
        Index("idx_workflow_created_at", "created_at"),
    )
    
    def compute_artifact_hash(self, artifact_data: Dict[str, Any]) -> str:
        """Compute SHA256 hash for artifact data."""
        canonical = json.dumps(artifact_data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    def verify_artifact_bindings(
        self,
        contract: Optional["ContractModel"] = None,
        candidate: Optional["CandidateModel"] = None,
        manifest: Optional["ManifestModel"] = None
    ) -> bool:
        """
        Verify all artifact hash bindings match actual artifact hashes.
        
        Returns:
            True if all bindings are valid, False if any mismatch detected
        """
        if contract is not None and self.contract_sha256 is not None:
            if contract.contract_hash != self.contract_sha256:
                return False
        
        if candidate is not None and self.candidate_sha256 is not None:
            if candidate.candidate_sha256 != self.candidate_sha256:
                return False
        
        if manifest is not None and self.manifest_sha256 is not None:
            if manifest.manifest_hash != self.manifest_sha256:
                return False
        
        return True
    
    def to_domain(self) -> "ProjectLLMWorkflow":
        """
        Convert ORM model to domain model (ProjectLLMWorkflow).
        
        NOTE: This is a stub implementation. FEAT-003 must complete the full mapping
        including state_history conversion, proper enum handling, and all nested structures.
        
        Returns:
            ProjectLLMWorkflow domain model
        """
        # Import here to avoid circular dependency
        from app.models.workflow import ProjectLLMWorkflow
        from app.orchestration.canonical_workflow import CanonicalWorkflowState
        
        return ProjectLLMWorkflow(
            workflow_id=self.workflow_id,
            specification_id=self.specification_id,
            target_family=self.target_family,
            target_version=self.target_version,
            requester_id=self.requester_id,
            current_state=CanonicalWorkflowState(self.current_state),
            created_at=self.created_at,
            updated_at=self.updated_at,
            state_history=[],  # TODO FEAT-003: Map state_transitions relationship
            contract_id=self.contract_id,
            contract_sha256=self.contract_sha256,
            candidate_id=self.candidate_id,
            candidate_sha256=self.candidate_sha256,
            manifest_id=self.manifest_id,
            manifest_sha256=self.manifest_sha256,
            snapshot_id=self.snapshot_id,
            snapshot_sha256=self.snapshot_sha256,
            approval_id=self.approval_id,
            gate_results=self.gate_results,
            evidence_ids=self.evidence_ids,
            final_status=self.final_status,
        )
    
    @classmethod
    def from_domain(cls, domain: "ProjectLLMWorkflow") -> "WorkflowModel":
        """
        Create ORM model from domain model (ProjectLLMWorkflow).
        
        NOTE: This is a stub implementation. FEAT-003 must complete the full mapping.
        
        Args:
            domain: ProjectLLMWorkflow domain model
            
        Returns:
            WorkflowModel ORM instance
        """
        return cls(
            workflow_id=domain.workflow_id,
            specification_id=domain.specification_id,
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
            version=1,  # New workflows start at version 1
        )


class StateTransitionModel(Base):
    """
    ORM model for StateTransition.
    
    Records workflow state transition history for audit trail.
    """
    
    __tablename__ = "project_ai_state_transitions"
    
    # Primary key: Integer auto-increment (different from other entities which use UUID strings)
    # This is intentional: state transitions are append-only audit logs that don't need
    # globally unique string IDs, and sequential integers provide natural ordering.
    id = Column(Integer, Identity(start=1, increment=1), primary_key=True)
    
    # Foreign key to workflow (uuid to match Drizzle schema and PostgreSQL database)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False)
    
    # Transition details
    from_state = Column(String(100), nullable=True)
    to_state = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    triggered_by = Column(String(255), nullable=False)
    
    # Evidence
    evidence_id = Column(UUID(as_uuid=True), nullable=True)
    reason = Column(Text, nullable=True)
    
    # Relationship
    workflow = relationship("WorkflowModel", back_populates="state_transitions")
    
    # Indexes
    __table_args__ = (
        Index("idx_transition_workflow", "workflow_id"),
        Index("idx_transition_timestamp", "timestamp"),
    )


class ContractModel(Base):
    """
    ORM model for EngineeringContract.
    
    Stores immutable engineering contracts for workflows.
    """
    
    __tablename__ = "project_ai_contracts"
    
    # Primary key (uuid to match Drizzle schema and PostgreSQL database)
    contract_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to workflow (1:1 relationship, uuid to match Drizzle schema and PostgreSQL database)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Immutability verification
    contract_hash = Column(String(64), nullable=False, unique=True)
    
    # Contract data (stored as JSON for flexibility)
    contract_data = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    contract_version = Column(String(50), nullable=False, default="1.0")
    
    # Relationship
    workflow = relationship("WorkflowModel", back_populates="contract")
    
    # Indexes
    __table_args__ = (
        Index("idx_contract_workflow", "workflow_id"),
        Index("idx_contract_hash", "contract_hash"),
    )
    
    def verify_hash(self) -> bool:
        """Verify contract data matches stored hash."""
        hash_data = dict(self.contract_data)
        hash_data.pop("contract_id", None)
        hash_data.pop("contract_hash", None)
        canonical = json.dumps(hash_data, sort_keys=True, ensure_ascii=False)
        computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return self.contract_hash == computed_hash


class CandidateModel(Base):
    """
    ORM model for CandidatePackage.
    
    Stores candidate block packages for evaluation and placement.
    """
    
    __tablename__ = "project_ai_candidates"
    
    # Primary key (uuid to match Drizzle schema and PostgreSQL database)
    candidate_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to workflow (optional, uuid to match Drizzle schema and PostgreSQL database)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("project_ai_workflows.workflow_id", ondelete="SET NULL"), nullable=True)
    
    # Files (stored as JSON array of CandidateFile objects)
    files = Column(JSON, nullable=False)
    
    # Metadata
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    uploaded_by = Column(String(255), nullable=False)
    
    # Workflow target binding
    target_family = Column(String(100), nullable=True)
    target_version = Column(String(100), nullable=True)
    
    # Candidate hash (computed from files for tamper detection)
    candidate_sha256 = Column(String(64), nullable=True)
    
    # Relationships
    workflow = relationship(
        "WorkflowModel",
        foreign_keys=[workflow_id],
        lazy="selectin"
    )
    manifests = relationship(
        "ManifestModel",
        back_populates="candidate",
        lazy="selectin",
        cascade="all, delete-orphan"
    )
    
    # Indexes
    __table_args__ = (
        Index("idx_candidate_workflow", "workflow_id"),
        Index("idx_candidate_uploaded_at", "uploaded_at"),
        Index("idx_candidate_sha256", "candidate_sha256"),
    )
    
    def compute_hash(self) -> str:
        """
        Compute SHA-256 hash of candidate files for tamper detection.
        
        Matches Wave 3A deterministic sorted file digest concatenation.
        
        Returns:
            SHA-256 hex digest of sorted file digests
        """
        sha256_hash = hashlib.sha256()
        sorted_files = sorted(
            self.files or [],
            key=lambda f: f.get("filename", "") if isinstance(f, dict) else getattr(f, "filename", "")
        )
        for f in sorted_files:
            content = f.get("content", "") if isinstance(f, dict) else getattr(f, "content", "")
            content_bytes = content.encode("utf-8") if isinstance(content, str) else (content or b"")
            file_hash = hashlib.sha256(content_bytes)
            sha256_hash.update(file_hash.digest())
        return sha256_hash.hexdigest()
    
    def verify_hash(self) -> bool:
        """
        Verify stored candidate_sha256 matches computed hash from files.
        
        Returns:
            True if hash matches, False otherwise
        """
        if self.candidate_sha256 is None:
            return False
        computed_hash = self.compute_hash()
        return self.candidate_sha256 == computed_hash


class ManifestModel(Base):
    """
    ORM model for PlacementManifest.
    
    Stores placement decisions and integration instructions for candidates.
    """
    
    __tablename__ = "project_ai_manifests"
    
    # Primary key (uuid to match Drizzle schema and PostgreSQL database)
    manifest_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to candidate (uuid to match Drizzle schema and PostgreSQL database)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("project_ai_candidates.candidate_id", ondelete="CASCADE"), nullable=False)
    
    # Immutability verification
    manifest_hash = Column(String(64), nullable=False, unique=True)
    
    # Placement decision
    decision = Column(String(50), nullable=False)
    target_path = Column(String(500), nullable=False)
    block_family = Column(String(100), nullable=False)
    block_version = Column(String(100), nullable=False)
    
    # Required changes and evidence
    required_changes = Column(JSON, nullable=False, default=list)
    evidence_ids = Column(JSON, nullable=False, default=list)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    candidate = relationship("CandidateModel", back_populates="manifests")
    
    # Indexes
    __table_args__ = (
        Index("idx_manifest_candidate", "candidate_id"),
        Index("idx_manifest_hash", "manifest_hash"),
        Index("idx_manifest_decision", "decision"),
    )
    
    def is_canonical_revision_shape(self) -> bool:
        """Check if record contains canonical revision-safe manifest metadata."""
        if not isinstance(self.required_changes, dict):
            return False
        canonical_keys = {"operations", "identityStatus", "updateEligibility", "referenceSummary", "revisionStrategy"}
        return any(k in self.required_changes for k in canonical_keys)

    def verify_hash(self, manifest_data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Verify manifest data matches stored hash.
        Enforces strict fail-closed canonical verification for revision-safe manifests;
        legacy fallbacks are strictly restricted to identifiable historical record shapes.
        """
        # 1. Canonical revision-safe manifests: strict fail-closed verification (zero legacy fallback)
        if self.is_canonical_revision_shape():
            try:
                from app.api.routes.candidate import model_to_manifest
                from app.models.candidate import compute_canonical_manifest_hash
                domain_manifest = model_to_manifest(self)
                canonical_hash = compute_canonical_manifest_hash(domain_manifest)
                return self.manifest_hash == canonical_hash
            except Exception:
                # Strictly reject on canonical mapping or deserialization errors
                return False

        # 2. Historical legacy records only: caller-provided manifest_data format
        if manifest_data is not None:
            canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
            if self.manifest_hash == hashlib.sha256(canonical.encode("utf-8")).hexdigest():
                return True
            canonical_compact = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
            if self.manifest_hash == hashlib.sha256(canonical_compact.encode("utf-8")).hexdigest():
                return True

        # 3. Historical legacy records only: pre-revision Candidate placement format
        text_changes = []
        file_ops = []
        if isinstance(self.required_changes, dict):
            text_changes = self.required_changes.get("text", [])
            file_ops = self.required_changes.get("operations", [])
        elif isinstance(self.required_changes, list):
            text_changes = self.required_changes

        created_at_str = ""
        if self.created_at:
            created_at_str = self.created_at.isoformat()
            if not created_at_str.endswith("Z") and "+" not in created_at_str:
                created_at_str += "Z"
            elif created_at_str.endswith("+00:00"):
                created_at_str = created_at_str[:-6] + "Z"

        cand_data = {
            "manifestId": str(self.manifest_id),
            "candidateId": str(self.candidate_id),
            "decision": self.decision,
            "targetPath": self.target_path,
            "blockFamily": self.block_family,
            "blockVersion": self.block_version,
            "requiredChanges": text_changes,
            "fileOperations": file_ops,
            "evidenceIds": self.evidence_ids or [],
            "createdAt": created_at_str,
        }
        cand_json = json.dumps(cand_data, sort_keys=True, separators=(',', ':'))
        computed = hashlib.sha256(cand_json.encode("utf-8")).hexdigest()
        return self.manifest_hash == computed



class ApprovalModel(Base):
    """
    ORM model for ImplementationApproval.
    
    Stores hash-bound implementation approval records.
    """
    
    __tablename__ = "project_ai_approvals"
    
    # Primary key (uuid to match Drizzle schema and PostgreSQL database)
    approval_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to workflow (1:1 relationship, uuid to match Drizzle schema and PostgreSQL database)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Hash bindings
    candidate_sha256 = Column(String(64), nullable=False)
    placement_manifest_id = Column(UUID(as_uuid=True), nullable=False)
    placement_manifest_sha256 = Column(String(64), nullable=False)
    
    # Target specification
    target_family = Column(String(100), nullable=False)
    target_version = Column(String(100), nullable=False)
    
    # Approval tracking
    approved_by = Column(String(255), nullable=False)
    approval_timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), nullable=False)
    
    # Self-approval prevention
    workflow_requester = Column(String(255), nullable=True)
    
    # Evidence and rejection reason
    evidence = Column(JSON, nullable=False, default=dict)
    rejection_reason = Column(Text, nullable=True)
    
    # Relationship
    workflow = relationship("WorkflowModel", back_populates="approval")
    
    # Indexes
    __table_args__ = (
        Index("idx_approval_workflow", "workflow_id"),
        Index("idx_approval_status", "status"),
        Index("idx_approval_candidate_sha", "candidate_sha256"),
        Index("idx_approval_manifest_sha", "placement_manifest_sha256"),
    )
