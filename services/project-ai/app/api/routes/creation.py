from fastapi import APIRouter, HTTPException
from app.api.schemas.creation import CreateWorkflowRequest, WorkflowResponse
from app.models.creation import DesignSource, CertificationGateType, CertificationGateStatus, WorkflowStatus, CertificationGate
from app.models.candidate import PlacementManifest
from app.repository.discovery_client import DiscoveryClient
from app.certification.gates import CertificationGateExecutor
import uuid
from datetime import datetime, timezone
from pathlib import Path

router = APIRouter(prefix="/creation", tags=["Creation Workflows (DEPRECATED)"])

# M2.9 Wave 0: LEGACY WORKFLOW AUTHORITY RETIRED
# These endpoints are DEPRECATED and will be removed.
# Use canonical workflow endpoints instead:
#   - POST /tasks/plan (initiate workflow)
#   - GET /tasks/{task_id} (get status)
#   - POST /candidates/upload (upload candidate)
#   - POST /governance/{approval_id}/approve (human approval)

# In-memory store (production would use database)
workflows = {}

@router.post("/workflows", response_model=WorkflowResponse, status_code=405, deprecated=True)
async def create_workflow(request: CreateWorkflowRequest):
    """
    DEPRECATED (M2.9 Wave 0): Legacy workflow creation endpoint.
    
    This endpoint bypassed canonical workflow lifecycle and is now disabled.
    
    Use canonical workflow instead:
    1. POST /tasks/plan - initiate workflow with repository discovery
    2. Wait for AWAITING_GATE_1 state
    3. Approve GUI prototype
    4. POST /candidates/upload - upload candidate package
    5. POST /governance/{approval_id}/approve - approve placement
    6. Wait for CERTIFICATION_READY
    7. POST /governance/{approval_id}/approve - final certification
    
    Architectural Rule: All workflows follow CanonicalWorkflowState (17 states).
    No workflow bypass via mode/composition shortcuts.
    """
    raise HTTPException(
        status_code=405,
        detail={
            "error": "LEGACY_ENDPOINT_DISABLED",
            "message": "POST /creation/workflows is deprecated (M2.9 Wave 0). Use canonical workflow endpoints.",
            "canonical_workflow": {
                "initiate": "POST /tasks/plan",
                "status": "GET /tasks/{task_id}",
                "upload": "POST /candidates/upload",
                "approve": "POST /governance/{approval_id}/approve"
            },
            "reason": "CreationMode allowed workflow bypass (I2_ONLY, MIX_AND_MATCH), violating architectural requirement that all candidates follow same lifecycle."
        }
    )

@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse, status_code=405, deprecated=True)
async def get_workflow(workflow_id: str):
    """
    DEPRECATED (M2.9 Wave 0): Legacy workflow status endpoint.
    
    Use GET /tasks/{task_id} to retrieve canonical workflow status.
    """
    raise HTTPException(
        status_code=405,
        detail={
            "error": "LEGACY_ENDPOINT_DISABLED",
            "message": "GET /creation/workflows/{workflow_id} is deprecated (M2.9 Wave 0). Use GET /tasks/{task_id} instead."
        }
    )

@router.post("/workflows/{workflow_id}/validate", response_model=WorkflowResponse, status_code=405, deprecated=True)
async def validate_workflow(workflow_id: str):
    """
    DEPRECATED (M2.9 Wave 0): Legacy validation endpoint.
    
    Validation now happens automatically during canonical workflow:
    - Discovery phase extracts repository contract
    - Candidate audit phase runs compliance gates
    - No separate "validate" step required
    
    Use canonical workflow lifecycle instead.
    """
    raise HTTPException(
        status_code=405,
        detail={
            "error": "LEGACY_ENDPOINT_DISABLED",
            "message": "POST /creation/workflows/{workflow_id}/validate is deprecated (M2.9 Wave 0).",
            "replacement": "Validation happens automatically in DISCOVERY and CANDIDATE_AUDIT states of canonical workflow."
        }
    )

@router.post("/workflows/{workflow_id}/certify", response_model=WorkflowResponse, status_code=405, deprecated=True)
async def certify_workflow(workflow_id: str):
    """
    DEPRECATED (M2.9 Wave 0): Legacy certification endpoint.
    
    Certification now happens automatically during canonical workflow:
    - CANDIDATE_AUDIT state runs all 6 gates
    - VERIFYING state runs runtime/browser verification
    - CERTIFICATION_READY state indicates all gates passed
    - AWAITING_GATE_2 requires human approval for final certification
    
    Use canonical workflow lifecycle instead.
    """
    raise HTTPException(
        status_code=405,
        detail={
            "error": "LEGACY_ENDPOINT_DISABLED",
            "message": "POST /creation/workflows/{workflow_id}/certify is deprecated (M2.9 Wave 0).",
            "replacement": "Certification happens automatically in CANDIDATE_AUDIT, VERIFYING, and CERTIFICATION_READY states of canonical workflow."
        }
    )
