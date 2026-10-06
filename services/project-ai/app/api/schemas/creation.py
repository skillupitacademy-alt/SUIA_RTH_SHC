from pydantic import BaseModel
from app.models.creation import CreationMode, BlockSource, CertificationGate, WorkflowStatus

class CreateWorkflowRequest(BaseModel):
    mode: CreationMode
    composition: dict[str, BlockSource]
    candidateBlocks: list[str] = []

class WorkflowResponse(BaseModel):
    workflowId: str
    mode: CreationMode
    status: WorkflowStatus
    certificationGates: list[CertificationGate]
    createdAt: str

class ValidateWorkflowRequest(BaseModel):
    pass  # Validation uses existing workflow data

class CertifyWorkflowRequest(BaseModel):
    pass  # Certification runs all gates
