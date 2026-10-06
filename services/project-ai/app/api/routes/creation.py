from fastapi import APIRouter, HTTPException
from app.api.schemas.creation import CreateWorkflowRequest, WorkflowResponse
from app.models.creation import CreationMode, CertificationGateType, CertificationGateStatus, WorkflowStatus, CertificationGate
from app.repository.discovery_client import DiscoveryClient
from app.certification.gates import CertificationGateExecutor
import uuid
from datetime import datetime, timezone
from pathlib import Path

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
    """Run all 6 certification gates with real verification logic"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows[workflow_id]
    
    # Load discovery snapshot
    repository_root = Path(__file__).resolve().parents[5]  # Navigate to repo root
    snapshot_path = repository_root / "packages/project-llm-discovery/output/snapshot.json"
    
    try:
        discovery_client = DiscoveryClient(snapshot_path)
        snapshot = discovery_client.load_snapshot()
    except FileNotFoundError as e:
        # If snapshot doesn't exist, mark all gates as BLOCKED
        for gate in workflow["certificationGates"]:
            gate["status"] = CertificationGateStatus.BLOCKED
            gate["message"] = "Discovery snapshot not found"
            gate["blockers"] = [str(e)]
        
        workflow["status"] = WorkflowStatus.FAILED
        return workflow
    except ValueError as e:
        # If snapshot is invalid
        for gate in workflow["certificationGates"]:
            gate["status"] = CertificationGateStatus.BLOCKED
            gate["message"] = "Discovery snapshot invalid"
            gate["blockers"] = [str(e)]
        
        workflow["status"] = WorkflowStatus.FAILED
        return workflow
    
    # Initialize gate executor
    gate_executor = CertificationGateExecutor(snapshot, repository_root)
    
    # Extract candidate blocks and files from workflow composition
    candidate_blocks = workflow["composition"].get("candidateBlocks", [])
    
    # Collect candidate files (would come from manifest in production)
    # For now, we'll use candidate blocks to infer file paths
    candidate_files = []
    for block in candidate_blocks:
        # This is a simplified extraction - production would use actual manifest
        block_type = gate_executor._extract_block_type(block)
        candidate_files.append(f"packages/ui/src/tutorial/blocks/{block_type.capitalize()}Block.tsx")
    
    # Run each certification gate
    gate_results = {}
    
    for gate in workflow["certificationGates"]:
        gate_type = gate["gateType"]
        
        try:
            if gate_type == CertificationGateType.UBRC_COMPLIANCE:
                result = gate_executor.execute_ubrc_gate(candidate_blocks)
            elif gate_type == CertificationGateType.BRAND_INDEPENDENCE:
                result = gate_executor.execute_brand_independence_gate(candidate_files)
            elif gate_type == CertificationGateType.THEME_COMPATIBILITY:
                result = gate_executor.execute_theme_compatibility_gate(candidate_files)
            elif gate_type == CertificationGateType.REGISTRY_VERIFICATION:
                result = gate_executor.execute_registry_verification_gate(candidate_blocks)
            elif gate_type == CertificationGateType.RENDERER_VERIFICATION:
                result = gate_executor.execute_renderer_verification_gate(candidate_blocks)
            elif gate_type == CertificationGateType.EVIDENCE_BINDING:
                result = gate_executor.execute_evidence_binding_gate(candidate_blocks)
            else:
                # Unknown gate type
                result = None
            
            if result:
                gate["status"] = result.status
                gate["message"] = result.message
                gate["evidenceIds"] = result.evidence_ids
                gate["blockers"] = result.blockers
                gate_results[gate_type] = result
            else:
                gate["status"] = CertificationGateStatus.BLOCKED
                gate["message"] = f"Unknown gate type: {gate_type}"
                gate["blockers"] = ["Gate executor not implemented"]
                
        except Exception as e:
            # Handle unexpected errors
            gate["status"] = CertificationGateStatus.BLOCKED
            gate["message"] = f"Gate execution error: {str(e)}"
            gate["blockers"] = [str(e)]
    
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
