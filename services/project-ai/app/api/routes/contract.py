"""
Engineering Contract API Routes - Wave 2 B02

Endpoints for generating and retrieving engineering contracts for External AI.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from app.contracts.engineering_contract import (
    EngineeringContract,
    calculate_contract_hash,
    PROHIBITED_BEHAVIORS
)
from app.contracts.repository_intelligence import (
    build_contract as build_repo_contract,
    RepositoryEvidenceBlocked
)
from app.models.workflow_target import WorkflowTarget
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.evidence.ledger import record_agent_run
from app.evidence.schemas import AgentRun
from app.api.routes.workflows import governance_service
import uuid
import os
import json
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

router = APIRouter(prefix="/workflows", tags=["Engineering Contracts"])


def get_git_head_sha() -> str:
    """
    Get the current git HEAD commit SHA.
    
    Returns:
        40-character commit SHA, or "unknown" if git command fails
    """
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
            timeout=5
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return "unknown"


def load_repository_snapshot(workspace_root: str) -> Dict[str, Any]:
    """
    Load canonical TypeScript repository snapshot.
    
    This function is separated for test mockability.
    In production, it loads from the TypeScript discovery output.
    In tests, this function can be mocked to return test snapshots.
    
    Args:
        workspace_root: Workspace root path
        
    Returns:
        Snapshot dictionary
        
    Raises:
        HTTPException 404: If snapshot file not found
    """
    snapshot_path = Path(workspace_root) / "packages" / "project-llm-discovery" / "output" / "snapshot.json"
    
    if not snapshot_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Repository snapshot not found at {snapshot_path}. "
                   f"Run TypeScript discovery scan first to generate canonical snapshot."
        )
    
    with open(snapshot_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def calculate_snapshot_sha256(workspace_root: str) -> str:
    """
    Calculate SHA-256 hash of the repository snapshot file.
    
    This computes the hash from the actual file bytes to ensure hash stability
    and prevent JSON serialization order issues.
    
    Args:
        workspace_root: Workspace root path
        
    Returns:
        64-character hex string (SHA-256)
        
    Raises:
        HTTPException 404: If snapshot file not found
    """
    snapshot_path = Path(workspace_root) / "packages" / "project-llm-discovery" / "output" / "snapshot.json"
    
    if not snapshot_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Repository snapshot not found at {snapshot_path}"
        )
    
    sha256_hash = hashlib.sha256()
    with open(snapshot_path, 'rb') as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    return sha256_hash.hexdigest()

# In-memory store for contracts
# Key: workflow_id -> EngineeringContract
# WARNING: This is a Wave 2 placeholder. Contracts are lost on server restart.
# Wave 3 requirement: Replace with persistent storage (database, Redis, or file store)
# to maintain immutability guarantees across restarts and support distributed deployment.
contracts_store = {}

# Placeholder workflow store (would be database in production)
# Key: workflow_id -> {"state": str, "owner": str}
workflows_store = {}


async def verify_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify authentication token and extract user ID.
    
    This is a placeholder auth implementation for Wave 2.
    Production would integrate with the actual auth service.
    
    Args:
        authorization: Authorization header (Bearer token)
        
    Returns:
        User ID extracted from token
        
    Raises:
        HTTPException 401: Missing or invalid token
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header. Authentication required."
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected 'Bearer <token>'"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Placeholder: In production, validate token with auth service
    # For Wave 2, accept any non-empty token and extract user ID
    if not token or len(token) < 8:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    
    # Extract user ID from token (placeholder logic)
    user_id = f"user-{token[:8]}"
    
    return user_id


async def verify_workflow_ownership(
    workflow_id: str,
    user_id: str = Depends(verify_auth)
) -> dict:
    """
    Verify that the authenticated user owns the workflow and it's in a valid state.
    
    Args:
        workflow_id: The workflow identifier
        user_id: The authenticated user ID
        
    Returns:
        Workflow data dict with state and owner
        
    Raises:
        HTTPException 404: Workflow not found
        HTTPException 403: User doesn't own the workflow
        HTTPException 400: Workflow in invalid state
    """
    # Check workflow exists (placeholder: would query database)
    if workflow_id not in workflows_store:
        # For Wave 2, auto-create workflow in valid state
        # Wave 3 will wire to real workflow service
        workflows_store[workflow_id] = {
            "state": "BRIEF_READY",
            "owner": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    workflow = workflows_store[workflow_id]
    
    # Verify ownership
    if workflow["owner"] != user_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Workflow {workflow_id} is owned by another user."
        )
    
    # Verify state (must be DISCOVERY complete or BRIEF_READY)
    valid_states = ["DISCOVERY", "BRIEF_READY", "AWAITING_GATE_1"]
    if workflow["state"] not in valid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot generate contract for workflow in state '{workflow['state']}'. "
                   f"Valid states: {', '.join(valid_states)}"
        )
    
    return workflow


@router.post("/{workflow_id}/engineering-contract", response_model=EngineeringContract)
async def create_engineering_contract(
    workflow_id: str,
    workflow: dict = Depends(verify_workflow_ownership)
):
    """
    Generate an immutable engineering contract for a workflow.
    
    This contract is SELF-CONTAINED and includes everything External AI needs:
    - Target specification (family, version, block type)
    - Repository snapshot and canonical references
    - All compliance contracts (UBRC, ILS, LSNB, RSSB, theme, brand)
    - Required artifacts, tests, and acceptance criteria
    - Prohibited behaviors (architectural boundaries)
    
    CONTRACT GENERATION REQUIRES CANONICAL TYPESCRIPT SNAPSHOT:
    The contract must be generated from a TypeScript-produced repository snapshot.
    Python MUST NOT scan repository files directly (architectural boundary).
    
    CONTRACT IMMUTABILITY:
    Once generated for a workflow_id with specific data, the contract is immutable.
    Calling this endpoint again with the same workflow_id returns the SAME contract
    (same hash), preventing contract drift during workflow lifecycle.
    
    SECURITY:
    - Requires authentication via Authorization header
    - Verifies caller owns the workflow
    - Validates workflow is in correct state (DISCOVERY, BRIEF_READY, or AWAITING_GATE_1)
    
    Args:
        workflow_id: The workflow identifier
        workflow: Workflow data (injected by verify_workflow_ownership)
        
    Returns:
        EngineeringContract with contract_hash for tamper detection
        
    Raises:
        HTTPException 401: Missing or invalid authentication
        HTTPException 403: User doesn't own the workflow
        HTTPException 404: Workflow not found or snapshot not found
        HTTPException 400: Invalid workflow state
    """
    
    # Wave 1A: Get workflow target from governance service
    # Retrieve workflow to get actual target binding
    workflow_obj = governance_service.get_workflow(workflow_id)
    if not workflow_obj:
        raise HTTPException(
            status_code=404,
            detail=f"Workflow not found: {workflow_id}"
        )
    
    # Check if contract already exists (immutability enforcement)
    if workflow_id in contracts_store:
        existing_contract = contracts_store[workflow_id]
        
        # Wave 1A: Verify workflow target hasn't drifted from contract target
        # This protects against workflow mutation bugs or admin endpoints
        if (existing_contract.target.family != workflow_obj.target_family or
            existing_contract.target.version != workflow_obj.target_version):
            raise HTTPException(
                status_code=409,
                detail=f"Workflow target drift detected: contract has "
                       f"{existing_contract.target.family}/{existing_contract.target.version}, "
                       f"but workflow now has {workflow_obj.target_family}/{workflow_obj.target_version}. "
                       f"Target fields must remain immutable after contract generation."
            )
        
        return existing_contract
    
    # Wave 1A: Validate workflow target immutability
    # Check that target fields are non-empty (fail fast)
    if not workflow_obj.target_family or workflow_obj.target_family.strip() == '':
        raise HTTPException(
            status_code=400,
            detail=f"Workflow {workflow_id} has empty target_family. "
                   "Cannot generate contract without valid target identity."
        )
    
    if not workflow_obj.target_version or workflow_obj.target_version.strip() == '':
        raise HTTPException(
            status_code=400,
            detail=f"Workflow {workflow_id} has empty target_version. "
                   "Cannot generate contract without valid target identity."
        )
    
    # Extract target from workflow's bound identity
    target = WorkflowTarget(
        workflow_id=workflow_id,
        family=workflow_obj.target_family,
        version=workflow_obj.target_version,
        block_type=workflow_obj.target_family.lower(),  # e.g., "Introduction" -> "introduction"
        specification_id=workflow_obj.specification_id,
        source_snapshot_id=workflow_obj.snapshot_id or "snapshot-pending"
    )
    
    # Load canonical TypeScript snapshot (architectural boundary: Python consumes, never produces)
    workspace_root = os.environ.get("WORKSPACE_ROOT", os.environ.get("QUIZ_PLATFORM_REPO_ROOT"))
    if not workspace_root:
        # Fallback: relative navigation from this file
        workspace_root = str(Path(__file__).parent.parent.parent.parent.parent.parent.absolute())
    
    # Load snapshot (mockable function for tests)
    snapshot = load_repository_snapshot(workspace_root)
    
    # Calculate snapshot SHA-256 from actual file content
    snapshot_sha256 = calculate_snapshot_sha256(workspace_root)
    
    # Build repository contract from snapshot (Wave 1 canonical implementation)
    # Fail-closed: raises RepositoryEvidenceBlocked if evidence missing/invalid
    try:
        repo_contract = build_repo_contract(
            snapshot=snapshot,
            family=target.family,
            version=target.version
        )
    except RepositoryEvidenceBlocked as e:
        # Repository evidence missing or incomplete
        # Return HTTP 503 (Service Unavailable) to indicate TypeScript discovery scan needed
        raise HTTPException(
            status_code=503,
            detail=f"Repository evidence missing or incomplete: {str(e)}. "
                   f"Run TypeScript discovery scan to generate canonical snapshot evidence."
        )
    
    # Generate contract ID
    contract_id = f"contract-{workflow_id}-{uuid.uuid4().hex[:8]}"
    
    # Build engineering contract
    contract = EngineeringContract(
        contract_id=contract_id,
        workflow_id=workflow_id,
        target=target,
        contract_version="1.0",
        repository_snapshot_id=target.source_snapshot_id,
        repository_snapshot_sha256=snapshot_sha256,
        canonical_references=repo_contract.references,
        
        # Populate contracts from repository intelligence
        educational_contract={
            "learning_objectives": [],
            "content_type": target.block_type,
            "difficulty_level": "intermediate"
        },
        implementation_contract={
            "language": "TypeScript",
            "framework": "React",
            "style": "CSS Modules",
            "file_structure": {
                "component": f"packages/ui/src/tutorial/blocks/{target.family}{target.version}Block.tsx",
                "schema": f"packages/ui/src/tutorial/schemas/{target.family}{target.version}Schema.ts",
                "types": f"packages/ui/src/tutorial/types/{target.family}{target.version}Types.ts",
                "tests": f"packages/ui/src/tutorial/blocks/__tests__/{target.family}{target.version}Block.test.tsx"
            }
        },
        type_contract={
            "strict_mode": True,
            "no_any": True,
            "no_implicit_any": True
        },
        schema_contract=repo_contract.schema_contract,
        ubrc_contract={
            "required": True,
            "props": ["ubrc"],
            "type": "UniversalBlockRuntimeContext",
            "validation": "strict"
        },
        renderer_contract=repo_contract.renderer_contract,
        composer_contract=repo_contract.composer_contract,
        runtime_contract=repo_contract.runtime,
        theme_contract={
            "theme_independent": True,
            "props": ["theme"],
            "required_theme_props": ["primary", "secondary"],
            "no_hardcoded_colors": True
        },
        brand_contract={
            "brand_independent": True,
            "no_hardcoded_logos": True,
            "no_hardcoded_brand_names": True,
            "brand_via_props_only": True
        },
        ils_contract={
            "passive_integration": True,
            "props": ["ils"],
            "no_direct_api_calls": True,
            "page_level_only": True
        },
        lsnb_contract={
            "page_level_only": True,
            "no_block_level_nav": True,
            "props": ["lsnb"]
        },
        rssb_contract={
            "page_level_only": True,
            "no_block_level_status": True,
            "props": ["rssb"]
        },
        
        # Required deliverables
        required_artifacts=repo_contract.required_artifacts,
        tests_required=[
            "Unit tests for component rendering",
            "Unit tests for prop validation",
            "Unit tests for theme integration",
            "Unit tests for UBRC integration",
            "Accessibility tests (WCAG 2.1 AA)",
            "Responsive design tests (mobile, tablet, desktop)"
        ],
        acceptance_criteria=repo_contract.acceptance_criteria,
        
        # Architectural boundaries (from M2 specification)
        prohibited_behaviors=PROHIBITED_BEHAVIORS,
        
        # Hash will be calculated and set below
        contract_hash=""
    )
    
    # Calculate and set immutable hash
    contract.contract_hash = calculate_contract_hash(contract)
    
    # Store contract (immutability: same workflow_id = same contract)
    contracts_store[workflow_id] = contract
    
    # Bind contract artifact to workflow with SHA-256
    governance_service.bind_artifact(
        workflow_id=workflow_id,
        artifact_type="contract",
        artifact_id=contract.contract_id,
        artifact_sha256=contract.contract_hash
    )
    
    # Transition workflow state to BRIEF_READY
    try:
        governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.BRIEF_READY,
            triggered_by="W2-EngineeringContract",
            evidence_id=contract.contract_id,
            reason=f"Engineering contract generated: {contract.contract_id}"
        )
    except ValueError as e:
        # State transition may fail if already in BRIEF_READY or later state
        # This is acceptable for idempotency
        pass
    
    # Record evidence via W1D harness
    # Note: filesChanged is empty because W2 generates an in-memory contract JSON
    # and binds metadata via governance_service, but writes nothing to disk.
    # The contract exists only in contracts_store (Wave 2 placeholder) and
    # workflow metadata (contract_id, contract_sha256 via bind_artifact).
    current_commit = get_git_head_sha()
    agent_run = AgentRun(
        runId=f"w2-engineering-contract-{workflow_id}",
        agentId="W2",
        wave="W2",
        commitBefore=current_commit,
        commitAfter=current_commit,  # W2 doesn't commit changes
        filesChanged=[],  # W2 generates in-memory contract, no disk writes
        status="completed",
        timestamp=datetime.now(timezone.utc)
    )
    record_agent_run(agent_run)
    
    return contract


@router.get("/{workflow_id}/engineering-contract", response_model=EngineeringContract)
async def get_engineering_contract(
    workflow_id: str,
    workflow: dict = Depends(verify_workflow_ownership)
):
    """
    Retrieve the engineering contract for a workflow with hash verification.
    
    SECURITY:
    - Requires authentication via Authorization header
    - Verifies caller owns the workflow
    - Verifies contract hash integrity before returning
    
    Args:
        workflow_id: The workflow identifier
        workflow: Workflow data (injected by verify_workflow_ownership)
        
    Returns:
        EngineeringContract if exists and passes integrity check
        
    Raises:
        HTTPException 401: Missing or invalid authentication
        HTTPException 403: User doesn't own the workflow
        HTTPException 404: Contract not found
        HTTPException 500: Hash verification failed (contract tampered)
    """
    if workflow_id not in contracts_store:
        raise HTTPException(
            status_code=404,
            detail=f"Engineering contract not found for workflow {workflow_id}"
        )
    
    contract = contracts_store[workflow_id]
    
    # Verify contract hash integrity
    # This detects tampering if the contract was modified after creation
    stored_hash = contract.contract_hash
    recalculated_hash = calculate_contract_hash(contract)
    
    if stored_hash != recalculated_hash:
        # Hash mismatch indicates tampering or corruption
        raise HTTPException(
            status_code=500,
            detail=f"Contract integrity verification failed for workflow {workflow_id}. "
                   f"Stored hash does not match recalculated hash. Possible tampering detected."
        )
    
    return contract
