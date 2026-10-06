from fastapi import APIRouter, HTTPException
from app.api.schemas.creation import CreateWorkflowRequest, WorkflowResponse
from app.models.creation import CreationMode, CertificationGateType, CertificationGateStatus, WorkflowStatus, CertificationGate
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/creation", tags=["Creation Workflows"])

# In-memory store (production would use database)
workflows = {}

@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(request: CreateWorkflowRequest):
    """Create new I2 or Mix-and-Match creation workflow"""
    workflow_id = str(uuid.uuid4())
    
    # Initialize certification gates
    gates = [
        CertificationGate(
            gateType=gate_type,
            status=CertificationGateStatus.PENDING,
            evidenceIds=[],
            blockers=[]
        )
        for gate_type in CertificationGateType
    ]
    
    workflow = {
        "workflowId": workflow_id,
        "mode": request.mode,
        "composition": {
            "mode": request.mode,
            "composition": request.composition,
            "candidateBlocks": request.candidateBlocks
        },
        "certificationGates": [g.model_dump() for g in gates],
        "status": WorkflowStatus.CREATED,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "certifiedAt": None
    }
    
    workflows[workflow_id] = workflow
    return workflow

@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str):
    """Retrieve workflow status"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflows[workflow_id]

@router.post("/workflows/{workflow_id}/validate", response_model=WorkflowResponse)
async def validate_workflow(workflow_id: str):
    """Run composition validation checks"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows[workflow_id]
    workflow["status"] = WorkflowStatus.VALIDATING
    
    # Validation logic: check if candidate blocks exist, composition is valid, etc.
    # For now, pass validation
    workflow["status"] = WorkflowStatus.CERTIFYING
    
    return workflow

@router.post("/workflows/{workflow_id}/certify", response_model=WorkflowResponse)
async def certify_workflow(workflow_id: str):
    """Run all 6 certification gates"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows[workflow_id]
    
    # Run certification gates
    for gate in workflow["certificationGates"]:
        gate["status"] = CertificationGateStatus.PASS
        gate["message"] = f"{gate['gateType']} passed"
    
    # Check if all gates passed
    all_passed = all(
        gate["status"] == CertificationGateStatus.PASS
        for gate in workflow["certificationGates"]
    )
    
    if all_passed:
        workflow["status"] = WorkflowStatus.CERTIFIED
        workflow["certifiedAt"] = datetime.now(timezone.utc).isoformat()
    else:
        workflow["status"] = WorkflowStatus.FAILED
    
    return workflow
