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
from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING

from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, Index, JSON, Text, UniqueConstraint, Identity
)
from sqlalchemy.orm import relationship, declarative_base
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
    
    # Primary key (varchar to match Drizzle schema)
    workflow_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Target specification
    specification_id = Column(String(255), nullable=False)
    target_family = Column(String(100), nullable=False)
    target_version = Column(String(100), nullable=False)
    requester_id = Column(String(255), nullable=False)
    
    # Lifecycle state
    current_state = Column(String(100), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Artifact bindings (hash-bound for security)
    contract_id = Column(String(255), nullable=True)
    contract_sha256 = Column(String(64), nullable=True)
    
    candidate_id = Column(String(255), nullable=True)
    candidate_sha256 = Column(String(64), nullable=True)
    
    manifest_id = Column(String(255), nullable=True)
    manifest_sha256 = Column(String(64), nullable=True)
    
    snapshot_id = Column(String(255), nullable=True)
    snapshot_sha256 = Column(String(64), nullable=True)
    
    # Approval tracking
    approval_id = Column(String(255), nullable=True)
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
    
    # Foreign key to workflow (varchar to match Drizzle schema)
    workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False)
    
    # Transition details
    from_state = Column(String(100), nullable=True)
    to_state = Column(String(100), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    triggered_by = Column(String(255), nullable=False)
    
    # Evidence
    evidence_id = Column(String(255), nullable=True)
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
    
    # Primary key (varchar to match Drizzle schema)
    contract_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to workflow (1:1 relationship, varchar to match Drizzle schema)
    workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Immutability verification
    contract_hash = Column(String(64), nullable=False, unique=True)
    
    # Contract data (stored as JSON for flexibility)
    contract_data = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
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
        canonical = json.dumps(self.contract_data, sort_keys=True, ensure_ascii=False)
        computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return self.contract_hash == computed_hash


class CandidateModel(Base):
    """
    ORM model for CandidatePackage.
    
    Stores candidate block packages for evaluation and placement.
    """
    
    __tablename__ = "project_ai_candidates"
    
    # Primary key (varchar to match Drizzle schema)
    candidate_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to workflow (optional, varchar to match Drizzle schema)
    workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="SET NULL"), nullable=True)
    
    # Files (stored as JSON array of CandidateFile objects)
    files = Column(JSON, nullable=False)
    
    # Metadata
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    uploaded_by = Column(String(255), nullable=False)
    
    # Workflow target binding
    target_family = Column(String(100), nullable=True)
    target_version = Column(String(100), nullable=True)
    
    # Wave 1C: Tenant ownership tracking
    # Candidates are tenant-scoped resources - track which brand uploaded them
    brand = Column(String(100), nullable=True)
    
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
        
        Uses deterministic JSON serialization (sorted keys) to ensure consistent hashing.
        
        Returns:
            SHA-256 hex digest of files JSON
        """
        canonical = json.dumps(self.files, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
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
    
    # Primary key (varchar to match Drizzle schema)
    manifest_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to candidate (varchar to match Drizzle schema)
    candidate_id = Column(String(255), ForeignKey("project_ai_candidates.candidate_id", ondelete="CASCADE"), nullable=False)
    
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
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    candidate = relationship("CandidateModel", back_populates="manifests")
    
    # Indexes
    __table_args__ = (
        Index("idx_manifest_candidate", "candidate_id"),
        Index("idx_manifest_hash", "manifest_hash"),
        Index("idx_manifest_decision", "decision"),
    )
    
    def verify_hash(self, manifest_data: Dict[str, Any]) -> bool:
        """Verify manifest data matches stored hash."""
        canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
        computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return self.manifest_hash == computed_hash


class ApprovalModel(Base):
    """
    ORM model for ImplementationApproval.
    
    Stores hash-bound implementation approval records.
    """
    
    __tablename__ = "project_ai_approvals"
    
    # Primary key (varchar to match Drizzle schema)
    approval_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Foreign key to workflow (1:1 relationship, varchar to match Drizzle schema)
    workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Hash bindings
    candidate_sha256 = Column(String(64), nullable=False)
    placement_manifest_id = Column(String(255), nullable=False)
    placement_manifest_sha256 = Column(String(64), nullable=False)
    
    # Target specification
    target_family = Column(String(100), nullable=False)
    target_version = Column(String(100), nullable=False)
    
    # Approval tracking
    approved_by = Column(String(255), nullable=False)
    approval_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
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
