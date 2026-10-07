from pydantic import BaseModel
from app.models.creation import DesignSource, BlockSource, CertificationGate, WorkflowStatus

# M2.9 Wave 0: These schemas are DEPRECATED
# They are kept only for backward compatibility with disabled /creation endpoints

class CreateWorkflowRequest(BaseModel):
    """DEPRECATED: Use canonical workflow endpoints instead"""
    design_source: DesignSource
    composition: dict[str, BlockSource]
    candidateBlocks: list[str] = []

class WorkflowResponse(BaseModel):
    """DEPRECATED: Use canonical workflow endpoints instead"""
    workflowId: str
    design_source: DesignSource
    status: WorkflowStatus
    certificationGates: list[CertificationGate]
    createdAt: str

class ValidateWorkflowRequest(BaseModel):
    """DEPRECATED: Use canonical workflow endpoints instead"""
    pass  # Validation uses existing workflow data

class CertifyWorkflowRequest(BaseModel):
    """DEPRECATED: Use canonical workflow endpoints instead"""
    pass  # Certification runs all gates

