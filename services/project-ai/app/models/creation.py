from enum import Enum
from pydantic import BaseModel

class CreationMode(str, Enum):
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
