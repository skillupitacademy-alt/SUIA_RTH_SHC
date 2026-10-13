from enum import Enum
from pydantic import BaseModel

# M2.9 Wave 0 / Agent B13: CreationMode REMOVED
# All workflows now follow CanonicalWorkflowState lifecycle.
# Use DesignSource to indicate content origin without workflow bypass.

class DesignSource(str, Enum):
    """
    M2.9: Indicates where block design originates, without bypassing canonical workflow.
    
    All design sources follow the same CanonicalWorkflowState lifecycle:
    REQUESTED → DISCOVERY → BRIEF_READY → ... → CERTIFIED
    
    DesignSource controls WHAT is discovered, not HOW workflow proceeds.
    """
    REPOSITORY_CANONICAL = "REPOSITORY_CANONICAL"
    """Design comes from existing canonical blocks (I1-I6, C1-C5, etc.)"""
    
    EXTERNAL_AI_PROTOTYPE = "EXTERNAL_AI_PROTOTYPE"
    """Design created by External AI based on user requirements + repository context"""
    
    USER_SPECIFICATION = "USER_SPECIFICATION"
    """Design specified directly by user with explicit requirements"""

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
    design_source: DesignSource
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
    SECONDARY AUTHORITY (M2.9): Maps to CanonicalWorkflowState for legacy API compatibility.
    
    This enum is DEPRECATED and maintained only for backward compatibility with existing
    /creation endpoints. New code MUST use CanonicalWorkflowState from 
    app.orchestration.canonical_workflow.
    
    Mapping to CanonicalWorkflowState:
    - CREATED -> REQUESTED
    - VALIDATING -> CANDIDATE_AUDIT
    - CERTIFYING -> CERTIFICATION_READY
    - CERTIFIED -> CERTIFIED
    - FAILED -> REJECTED
    
    ARCHITECTURAL RULE: These /creation routes will return 405 METHOD_NOT_ALLOWED in future.
    Use canonical workflow endpoints (/tasks, /candidates, /governance) instead.
    """
    CREATED = "CREATED"
    VALIDATING = "VALIDATING"
    CERTIFYING = "CERTIFYING"
    CERTIFIED = "CERTIFIED"
    FAILED = "FAILED"

class CreationWorkflow(BaseModel):
    """
    DEPRECATED (M2.9 Wave 0): Legacy workflow model for /creation endpoints.
    
    This model is marked for removal. Use CanonicalWorkflowState lifecycle instead.
    """
    workflowId: str
    design_source: DesignSource
    composition: CompositionSpec
    certificationGates: list[CertificationGate]
    status: WorkflowStatus
    createdAt: str
    certifiedAt: str | None = None
