"""
Engineering Contract API Routes - Wave 2 B02

Endpoints for generating and retrieving engineering contracts for External AI.
"""

from fastapi import APIRouter, HTTPException
from app.contracts.engineering_contract import (
    EngineeringContract,
    calculate_contract_hash,
    PROHIBITED_BEHAVIORS
)
from app.contracts.repository_intelligence import build_contract as build_repo_contract
from app.models.workflow_target import WorkflowTarget
import uuid
from datetime import datetime, timezone
from pathlib import Path

router = APIRouter(prefix="/workflows", tags=["Engineering Contracts"])

# In-memory store for contracts (production would use database)
# Key: workflow_id -> EngineeringContract
contracts_store = {}


@router.post("/{workflow_id}/engineering-contract", response_model=EngineeringContract)
async def create_engineering_contract(workflow_id: str):
    """
    Generate an immutable engineering contract for a workflow.
    
    This contract is SELF-CONTAINED and includes everything External AI needs:
    - Target specification (family, version, block type)
    - Repository snapshot and canonical references
    - All compliance contracts (UBRC, ILS, LSNB, RSSB, theme, brand)
    - Required artifacts, tests, and acceptance criteria
    - Prohibited behaviors (architectural boundaries)
    
    CONTRACT IMMUTABILITY:
    Once generated for a workflow_id with specific data, the contract is immutable.
    Calling this endpoint again with the same workflow_id returns the SAME contract
    (same hash), preventing contract drift during workflow lifecycle.
    
    Args:
        workflow_id: The workflow identifier
        
    Returns:
        EngineeringContract with contract_hash for tamper detection
        
    Raises:
        HTTPException 404: Workflow not found
        HTTPException 400: Invalid workflow state
    """
    
    # Check if contract already exists (immutability enforcement)
    if workflow_id in contracts_store:
        existing_contract = contracts_store[workflow_id]
        return existing_contract
    
    # TODO: Get workflow target from workflow service/database
    # For now, use a placeholder. In real implementation, this would:
    # 1. Query the workflow database by workflow_id
    # 2. Extract the WorkflowTarget that was created in the discovery step
    # 3. Verify workflow is in correct state (DISCOVERY complete, BRIEF_READY)
    
    # Placeholder target (Wave 3 will wire this to real workflow service)
    target = WorkflowTarget(
        workflow_id=workflow_id,
        family="Introduction",
        version="I7",
        block_type="introduction",
        specification_id="user-spec-001",
        source_snapshot_id="snapshot-001"
    )
    
    # Get repository root path
    # TODO: Make this configurable via environment variable
    repo_root = str(Path(__file__).parent.parent.parent.parent.parent.parent.absolute())
    
    # Build repository contract (from B03 Wave 1)
    repo_contract = build_repo_contract(
        repo_root=repo_root,
        family=target.family,
        version=target.version
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
        repository_snapshot_sha256="",  # TODO: Get from snapshot service
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
    
    return contract


@router.get("/{workflow_id}/engineering-contract", response_model=EngineeringContract)
async def get_engineering_contract(workflow_id: str):
    """
    Retrieve the engineering contract for a workflow.
    
    Args:
        workflow_id: The workflow identifier
        
    Returns:
        EngineeringContract if exists
        
    Raises:
        HTTPException 404: Contract not found
    """
    if workflow_id not in contracts_store:
        raise HTTPException(
            status_code=404,
            detail=f"Engineering contract not found for workflow {workflow_id}"
        )
    
    return contracts_store[workflow_id]
