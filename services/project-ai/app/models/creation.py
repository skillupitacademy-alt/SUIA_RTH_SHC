from enum import Enum
from pydantic import BaseModel

# M2.9 ARCHITECTURE (Wave 1 / Agent B13):
# CreationMode is a DESIGN INPUT CLASSIFIER, not a workflow state machine.
# CanonicalWorkflowState (from app.orchestration.canonical_workflow) is the ONLY workflow authority.
#
# CreationMode determines which validation logic runs during CANDIDATE_AUDIT phase:
# - I2_ONLY: Verify complete I2 structure exists in repository
# - DESIGN_REUSE: Verify component compatibility across I1/I2/Candidate mix
# - NEW_CANDIDATE: No pre-existing structure required
#
# CreationMode does NOT bypass workflow states. All candidates follow:
# REQUESTED → DISCOVERY → BRIEF_READY → AWAITING_GATE_1 → ... → CERTIFIED
#
# DEPRECATION: CreationMode is kept for API backward compatibility.
# New code should use DesignSource enum below.


class DesignSource(str, Enum):
    """
    M2.9 canonical design source classifier.
    
    Indicates content origin for block engineering, separate from workflow state.
    All candidates follow CanonicalWorkflowState lifecycle regardless of source.
    
    Use this enum in new code instead of CreationMode.
    """
    SCRATCH = "SCRATCH"
    """New candidate with no pre-existing repository structure."""
    
    DESIGN_REUSE = "DESIGN_REUSE"
    """Mix-and-match composition using I1, I2, and/or candidate blocks."""
    
    REPOSITORY_ONLY = "REPOSITORY_ONLY"
    """Reuse complete I2 structure from repository."""


class CreationMode(str, Enum):
    """
    DEPRECATED (M2.9): Use DesignSource instead.
    
    Kept for API backward compatibility with /creation endpoints.
    This is a design input classifier, NOT a workflow state machine.
    
    For workflow states, use CanonicalWorkflowState (app.orchestration.canonical_workflow).
    
    Migration mapping:
    - I2_ONLY → DesignSource.REPOSITORY_ONLY
    - MIX_AND_MATCH → DesignSource.DESIGN_REUSE
    - NEW_CANDIDATE → DesignSource.SCRATCH
    
    TODO(Future): Remove after frontend migrates to DesignSource.
    """
    I2_ONLY = "I2_ONLY"
    MIX_AND_MATCH = "MIX_AND_MATCH"
    NEW_CANDIDATE = "NEW_CANDIDATE"

class BlockSource(str, Enum):
    I1 = "I1"
    I2 = "I2"
    CANDIDATE = "CANDIDATE"

class CertificationGateType(str, Enum):
    UBRC_COMPLIANCE = "UBRC_COMPLIANCE"
    BRAND_INDEPENDENCE = "BRAND_INDEPENDENCE"
    THEME_COMPATIBILITY = "THEME_COMPATIBILITY"
    REGISTRY_VERIFICATION = "REGISTRY_VERIFICATION"
    RENDERER_VERIFICATION = "RENDERER_VERIFICATION"
    EVIDENCE_BINDING = "EVIDENCE_BINDING"

class CertificationGateStatus(str, Enum):
    PENDING = "PENDING"
    PASS = "PASS"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"

class CompositionSpec(BaseModel):
    mode: CreationMode
    composition: dict[str, BlockSource]
    candidateBlocks: list[str] = []

class CertificationGate(BaseModel):
    gateType: CertificationGateType
    status: CertificationGateStatus
    evidenceIds: list[str] = []
    blockers: list[str] = []
    message: str | None = None

class WorkflowStatus(str, Enum):
    """
    SECONDARY AUTHORITY (M2.9): Maps to CanonicalWorkflowState for API compatibility.
    
    This enum is kept for backward compatibility with existing creation endpoints,
    but new code should use CanonicalWorkflowState from app.orchestration.canonical_workflow.
    
    Mapping to CanonicalWorkflowState:
    - CREATED -> REQUESTED
    - VALIDATING -> CANDIDATE_AUDIT
    - CERTIFYING -> CERTIFICATION_READY
    - CERTIFIED -> CERTIFIED
    - FAILED -> REJECTED
    
    For complete workflow lifecycle, use CanonicalWorkflowState (17 states).
    """
    CREATED = "CREATED"
    VALIDATING = "VALIDATING"
    CERTIFYING = "CERTIFYING"
    CERTIFIED = "CERTIFIED"
    FAILED = "FAILED"

class CreationWorkflow(BaseModel):
    workflowId: str
    mode: CreationMode
    composition: CompositionSpec
    certificationGates: list[CertificationGate]
    status: WorkflowStatus
    createdAt: str
    certifiedAt: str | None = None
