from enum import Enum
from pydantic import BaseModel

# DEPRECATION NOTICE (M2.9):
# CreationMode is marked for removal in Wave 1 / Agent B13.
# All workflows will follow CanonicalWorkflowState lifecycle regardless of mode.
# Use DesignSource (to be added in W1-B13) to indicate content origin, not workflow bypass.
# TODO(B13): Remove CreationMode and replace with DesignSource enum.
class CreationMode(str, Enum):
    """
    DEPRECATED: Use DesignSource in CanonicalWorkflowState pipeline instead.
    
    This enum allowed workflow bypass (MIX_AND_MATCH, I2_ONLY) which violates
    M2.9 architecture requirement that all candidates follow same lifecycle.
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
