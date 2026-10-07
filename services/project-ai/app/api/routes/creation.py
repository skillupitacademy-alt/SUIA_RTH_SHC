from fastapi import APIRouter, HTTPException
from app.api.schemas.creation import CreateWorkflowRequest, WorkflowResponse
from app.models.creation import CreationMode, CertificationGateType, CertificationGateStatus, WorkflowStatus, CertificationGate
from app.models.candidate import PlacementManifest
from app.repository.discovery_client import DiscoveryClient
from app.certification.gates import CertificationGateExecutor
import uuid
from datetime import datetime, timezone
from pathlib import Path

router = APIRouter(prefix="/creation", tags=["Creation Workflows"])

# M2.9 ARCHITECTURE (Wave 1 / Agent B13):
# This endpoint is NOT a competing workflow state machine.
# It creates workflows that follow CanonicalWorkflowState lifecycle.
# CreationMode is a design input classifier that determines validation logic only.
#
# All workflows created here must be reconciled with CanonicalWorkflowState:
# - WorkflowStatus.CREATED → CanonicalWorkflowState.REQUESTED
# - WorkflowStatus.VALIDATING → CanonicalWorkflowState.CANDIDATE_AUDIT
# - WorkflowStatus.CERTIFYING → CanonicalWorkflowState.CERTIFICATION_READY
# - WorkflowStatus.CERTIFIED → CanonicalWorkflowState.CERTIFIED
# - WorkflowStatus.FAILED → CanonicalWorkflowState.REJECTED
#
# TODO(B01): Replace WorkflowStatus with direct CanonicalWorkflowState usage.

# In-memory store (production would use database)
workflows = {}

@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(request: CreateWorkflowRequest):
    """
    Create new block creation workflow.
    
    CreationMode determines validation logic during audit phase:
    - I2_ONLY: Validates complete I2 repository structure
    - MIX_AND_MATCH: Validates component compatibility (I1/I2/Candidate mix)
    - NEW_CANDIDATE: No pre-existing structure validation
    
    All workflows follow CanonicalWorkflowState lifecycle regardless of mode.
    """
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
    """
    Run composition validation checks.
    
    CreationMode determines which validation logic executes:
    - I2_ONLY: Verifies complete I2 structure from repository
    - MIX_AND_MATCH: Validates component compatibility (type, version, registry, renderer, runtime)
    - NEW_CANDIDATE: Basic structure validation only
    
    This is validation logic selection, NOT workflow state bypass.
    All workflows follow CanonicalWorkflowState lifecycle.
    
    Returns BLOCKED status if validation fails, CERTIFYING if all checks pass.
    """
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows[workflow_id]
    workflow["status"] = WorkflowStatus.VALIDATING
    
    # Load discovery snapshot
    repository_root = Path(__file__).resolve().parents[5]
    snapshot_path = repository_root / "packages/project-llm-discovery/output/snapshot.json"
    
    validation_errors = []
    
    try:
        from app.repository.discovery_client import DiscoveryClient
        from app.verification.compatibility import (
            resolve_component,
            verify_types_compatible,
            verify_versions_compatible,
            verify_registry_compatible,
            verify_renderer_compatible,
            verify_runtime_compatible,
            verify_i2_complete
        )
        
        discovery_client = DiscoveryClient(snapshot_path)
        snapshot = discovery_client.load_snapshot()
        
        composition = workflow["composition"]["composition"]
        mode = workflow["mode"]
        
        # I2-only validation: verify complete I2 structure
        if mode == CreationMode.I2_ONLY:
            result = verify_i2_complete(snapshot)
            
            if not result.passed:
                validation_errors.extend(result.conflicts)
                workflow["status"] = WorkflowStatus.FAILED
                
                # Add validation errors to all gates as blockers
                for gate in workflow["certificationGates"]:
                    gate["status"] = CertificationGateStatus.BLOCKED
                    gate["blockers"] = result.conflicts
                    gate["message"] = result.error_message
                
                return workflow
        
        # Mix-and-match validation: verify component compatibility
        else:
            all_compatible = True
            compatibility_errors = []
            
            for component_type, source in composition.items():
                # Resolve component from source identifier
                component = resolve_component(source, snapshot)
                
                if component is None:
                    compatibility_errors.append(
                        f"Component '{source}' not found in repository"
                    )
                    all_compatible = False
                    continue
                
                # Verify all compatibility dimensions
                type_result = verify_types_compatible(component, composition, snapshot)
                version_result = verify_versions_compatible(component, composition, snapshot)
                registry_result = verify_registry_compatible(component, composition, snapshot)
                renderer_result = verify_renderer_compatible(component, composition, snapshot)
                runtime_result = verify_runtime_compatible(component, composition, snapshot)
                
                # Collect errors
                for result in [type_result, version_result, registry_result, renderer_result, runtime_result]:
                    if not result.passed:
                        all_compatible = False
                        compatibility_errors.extend(result.conflicts)
            
            if not all_compatible:
                validation_errors = compatibility_errors
                workflow["status"] = WorkflowStatus.FAILED
                
                # Add validation errors to all gates as blockers
                for gate in workflow["certificationGates"]:
                    gate["status"] = CertificationGateStatus.BLOCKED
                    gate["blockers"] = compatibility_errors
                    gate["message"] = "Composition validation failed"
                
                return workflow
        
        # Validation passed - proceed to certification
        workflow["status"] = WorkflowStatus.CERTIFYING
        
    except FileNotFoundError:
        validation_errors.append("Discovery snapshot not found")
        workflow["status"] = WorkflowStatus.FAILED
        
        for gate in workflow["certificationGates"]:
            gate["status"] = CertificationGateStatus.BLOCKED
            gate["blockers"] = validation_errors
            gate["message"] = "Snapshot unavailable"
    
    except ValueError as e:
        validation_errors.append(f"Snapshot invalid: {str(e)}")
        workflow["status"] = WorkflowStatus.FAILED
        
        for gate in workflow["certificationGates"]:
            gate["status"] = CertificationGateStatus.BLOCKED
            gate["blockers"] = validation_errors
            gate["message"] = "Snapshot invalid"
    
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
    
    # Extract candidate blocks from workflow composition
    candidate_blocks = workflow["composition"].get("candidateBlocks", [])
    
    # ARCHITECTURE RULE: Certification requires approved PlacementManifest
    # Path inference from block names violates architectural boundaries
    placement_manifest = workflow.get("placementManifest")
    
    if placement_manifest is None:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "PLACEMENT_MANIFEST_REQUIRED",
                "message": "Certification requires an approved PlacementManifest. Path inference from block names violates architecture boundaries.",
                "required_workflow": [
                    "1. Generate snapshot",
                    "2. Run candidate intake",
                    "3. Generate placement manifest",
                    "4. Get governance approval",
                    "5. Then run certification"
                ]
            }
        )
    
    # Extract candidate files from PlacementManifest only
    candidate_files = [
        entry.get("targetPath")
        for entry in placement_manifest.get("entries", [])
        if entry.get("targetPath") is not None
        and entry.get("action") in {"ADD", "UPDATE", "EXTEND"}
    ]
    
    if not candidate_files:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "NO_CANDIDATE_FILES_IN_MANIFEST",
                "message": "PlacementManifest contains no file entries with target paths"
            }
        )
    
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
