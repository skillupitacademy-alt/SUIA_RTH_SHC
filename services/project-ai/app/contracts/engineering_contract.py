"""
Engineering Contract - Wave 2 B02

The Engineering Contract is the SELF-CONTAINED contract that External AI receives.
It is not assumed to know I1/C1/D1, TutorialBlockRenderer, UBRC, ILS, LSNB, RSSB, 
or the repository.

CONTRACT IMMUTABILITY:
- Once generated for a workflow_id with specific data, the contract is immutable
- The contract_hash ensures tamper detection
- If the same workflow_id requests a contract again with identical inputs, 
  return the SAME contract (same hash)
- This prevents contract drift during the workflow lifecycle

PROHIBITED BEHAVIORS:
- Enforces architectural boundaries that external AI must not cross
- These are hard constraints derived from M2 specification and audit findings
"""

import hashlib
from pydantic import BaseModel, Field
from typing import Optional
from .repository_intelligence import CanonicalReference, RuntimeContract
from ..models.workflow_target import WorkflowTarget


class EngineeringContract(BaseModel):
    """
    Self-contained engineering contract for External AI.
    
    This contract includes everything the External AI needs to know:
    - Target specification (family, version, block type)
    - Repository snapshot and canonical references
    - All compliance contracts (educational, implementation, types, schemas, etc.)
    - Runtime contracts (UBRC, ILS, LSNB, RSSB, theme, brand)
    - Required artifacts and tests
    - Acceptance criteria
    - Prohibited behaviors (architectural boundaries)
    - Contract hash for immutability verification
    """
    
    contract_id: str = Field(..., description="Unique contract identifier")
    workflow_id: str = Field(..., description="Workflow this contract belongs to")
    target: WorkflowTarget = Field(..., description="Target block specification")
    contract_version: str = Field(default="1.0", description="Contract schema version")
    
    # Repository context
    repository_snapshot_id: str = Field(..., description="Repository snapshot identifier")
    repository_snapshot_sha256: str = Field(..., description="SHA-256 hash of repository snapshot")
    canonical_references: list[CanonicalReference] = Field(
        default_factory=list,
        description="Canonical block references with evidence"
    )
    
    # Gate contracts (populated from B03 RepositoryBlockContract)
    educational_contract: dict = Field(
        default_factory=dict,
        description="Educational content requirements"
    )
    implementation_contract: dict = Field(
        default_factory=dict,
        description="Implementation structure and patterns"
    )
    type_contract: dict = Field(
        default_factory=dict,
        description="TypeScript type definitions"
    )
    schema_contract: dict = Field(
        default_factory=dict,
        description="Schema validation requirements"
    )
    ubrc_contract: dict = Field(
        default_factory=dict,
        description="Universal Block Runtime Context contract"
    )
    renderer_contract: dict = Field(
        default_factory=dict,
        description="Renderer integration contract (derived from snapshot block evidence)"
    )
    composer_contract: dict = Field(
        default_factory=dict,
        description="Composer integration contract (derived from snapshot composer evidence)"
    )
    runtime_contract: RuntimeContract = Field(
        default_factory=RuntimeContract,
        description="Runtime requirements (ILS, LSNB, RSSB, theme, brand)"
    )
    theme_contract: dict = Field(
        default_factory=dict,
        description="Theme independence requirements"
    )
    brand_contract: dict = Field(
        default_factory=dict,
        description="Brand independence requirements"
    )
    ils_contract: dict = Field(
        default_factory=dict,
        description="Inline Learner Support contract"
    )
    lsnb_contract: dict = Field(
        default_factory=dict,
        description="Left-Side Navigation Bar contract"
    )
    rssb_contract: dict = Field(
        default_factory=dict,
        description="Right-Side Status Bar contract"
    )
    
    # Deliverables - derived from snapshot block contracts
    # Canonical source: RepositoryBlockContract extracted from snapshot evidence
    required_artifacts: list[str] = Field(
        default_factory=list,
        description="Required deliverable artifacts (derived from snapshot)"
    )
    tests_required: list[str] = Field(
        default_factory=list,
        description="Required test coverage (derived from snapshot)"
    )
    acceptance_criteria: list[str] = Field(
        default_factory=list,
        description="Acceptance criteria for certification (derived from snapshot)"
    )
    
    # Architectural boundaries
    prohibited_behaviors: list[str] = Field(
        default_factory=list,
        description="Behaviors that violate architectural boundaries"
    )
    
    # Immutability verification
    contract_hash: str = Field(
        default="",
        description="SHA-256 hash of contract for tamper detection (excludes this field)"
    )


# Architectural boundaries that External AI must never cross
# These are derived from M2 specification and audit findings
PROHIBITED_BEHAVIORS = [
    "implement_duplicate_ils",           # ILS is page-level, not block-level
    "call_ils_api_directly",             # Blocks receive ILS state via props
    "implement_page_navigation",         # Navigation is page-level responsibility
    "implement_page_progress",           # Progress tracking is page-level
    "implement_duplicate_lsnb",          # LSNB is page-level, not block-level
    "implement_duplicate_rssb",          # RSSB is page-level, not block-level
    "hard_code_suia_branding",          # Brand must be injected via props
    "hard_code_rth_branding",           # Brand must be injected via props
    "create_duplicate_composer",        # Composer is global infrastructure
    "create_duplicate_renderer",        # Renderer is global infrastructure
    "modify_unapproved_repository_paths", # Only approved paths may be written
]


def calculate_contract_hash(contract: EngineeringContract) -> str:
    """
    Calculate SHA-256 hash of contract for immutability verification.
    
    The hash is calculated from the canonical JSON representation of the contract,
    excluding the contract_hash field itself to avoid circular dependency.
    
    Args:
        contract: The engineering contract
        
    Returns:
        64-character hex string (SHA-256)
        
    Note:
        The hash is deterministic: same contract data = same hash.
        This enables contract identity verification and immutability enforcement.
    """
    import json
    
    # Serialize contract to dictionary, excluding the hash field
    contract_dict = contract.model_dump(
        exclude_none=True,
        by_alias=True,
        exclude={"contract_hash"},
        mode="json"
    )
    
    # Convert to JSON with sorted keys for deterministic serialization
    canonical = json.dumps(contract_dict, sort_keys=True, ensure_ascii=False)
    
    # Compute SHA-256
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
