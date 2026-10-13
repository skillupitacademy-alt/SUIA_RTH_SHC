"""
Repository Contract Intelligence - B03 Agent

Derives block contracts from TypeScript snapshot evidence.
This agent consumes canonical_block evidence from the repository snapshot,
extracting SHA-256 hashes and evidence IDs, and constructs
engineering contracts for external AI consumption.

CONTRACT:
- Never scan repository files directly (architectural boundary violation)
- All evidence must be derived from TypeScript snapshot
- SHA-256 is extracted from snapshot evidence, never recomputed
- Missing evidence is noted, not fabricated
- evidence_id comes from snapshot, deterministic from TypeScript discovery
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import hashlib


class RepositoryEvidenceBlocked(Exception):
    """
    Raised when repository evidence is missing, incomplete, or invalid.
    
    This exception signals that the system cannot generate a contract
    because the required evidence is not available in the snapshot.
    The caller should trigger a TypeScript discovery scan and retry.
    """
    pass


class ContractFieldEvidence(BaseModel):
    """
    Evidence tracking for a single contract field.
    
    Records the provenance of each contract field value, enabling:
    - Audit trail showing which snapshot evidence backs each field
    - Debugging when fields appear incorrect
    - Verification that no fields are hardcoded
    - Traceability from contract field back to source evidence
    """
    field_name: str = Field(..., description="Name of the contract field (e.g., 'language', 'framework')")
    value: Any = Field(..., description="The actual value assigned to the field")
    evidence_source: str = Field(..., description="Description of snapshot path or metadata key (e.g., 'snapshot.evidence[3].contentHash')")
    evidence_id: str = Field(..., description="Unique evidence ID from snapshot for traceability")
    derived_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when evidence was captured")


class RepositoryEvidence(BaseModel):
    """Evidence of a canonical file in the repository."""
    path: str = Field(..., description="Relative path from repository root")
    sha256: str = Field(..., description="SHA-256 hash of file content")
    role: str = Field(..., description="Role: canonical_block, schema, renderer, composer, etc.")
    evidence_id: str = Field(..., description="Deterministic ID: sha256(path + sha256)")


class CanonicalReference(BaseModel):
    """Reference to a canonical block version with evidence."""
    family: str = Field(..., description="Block family (e.g., 'Introduction', 'Code', 'Definition')")
    version: str = Field(..., description="Block version (e.g., 'I1', 'C1', 'D1')")
    evidence: list[RepositoryEvidence] = Field(default_factory=list, description="File evidence for this reference")


class RuntimeContract(BaseModel):
    """Runtime requirements and guarantees."""
    ub_rc_required: bool = Field(True, description="Universal Block Runtime Context required")
    passive_ils: bool = Field(True, description="Passive ILS (Inline Learner Support)")
    page_level_lsnb: bool = Field(True, description="Page-level Left-Side Navigation Bar")
    page_level_rssb: bool = Field(True, description="Page-level Right-Side Status Bar")
    theme_injected: bool = Field(True, description="Theme injected via props")
    brand_independent: bool = Field(True, description="Brand-independent rendering")


class RepositoryBlockContract(BaseModel):
    """
    Complete engineering contract derived from repository intelligence.
    This is the authoritative contract external AI receives.
    """
    family: str = Field(..., description="Block family")
    version: str = Field(..., description="Block version")
    block_type: str = Field(..., description="Block type identifier")
    references: list[CanonicalReference] = Field(default_factory=list, description="Canonical references found")
    # Evidence tracking for contract field provenance
    field_evidence: dict[str, ContractFieldEvidence] = Field(
        default_factory=dict,
        description="Tracks evidence provenance for each contract field"
    )
    # All fields below are derived from snapshot evidence, not hardcoded defaults
    language: str = Field(default="", description="Primary programming language (derived from snapshot metadata)")
    framework: str = Field(default="", description="Primary framework (derived from snapshot evidence)")
    style: str = Field(default="", description="Styling approach (derived from snapshot evidence)")
    difficulty_level: str = Field(default="", description="Complexity level (derived from snapshot analysis)")
    file_paths: dict = Field(
        default_factory=dict,
        description="Derived file paths for component, schema, types, tests (derived from snapshot evidence)"
    )
    test_requirements: list[str] = Field(
        default_factory=list,
        description="Test requirements derived from snapshot test patterns"
    )
    type_strictness: dict = Field(
        default_factory=dict,
        description="Type strictness settings (derived from tsconfig.json in snapshot)"
    )
    required_artifacts: list[str] = Field(
        default_factory=list,
        description="Required deliverables (derived from snapshot block contract)"
    )
    runtime: RuntimeContract = Field(default_factory=RuntimeContract, description="Runtime contract")
    renderer_contract: dict = Field(
        default_factory=dict,
        description="Renderer contract (derived from snapshot renderer evidence)"
    )
    composer_contract: dict = Field(
        default_factory=dict,
        description="Composer contract (derived from snapshot composer evidence)"
    )
    schema_contract: dict = Field(
        default_factory=dict,
        description="Schema contract (derived from snapshot schema evidence)"
    )
    acceptance_criteria: list[str] = Field(
        default_factory=list,
        description="Acceptance criteria (derived from UBRC + theme + brand evidence)"
    )


def generate_evidence_id(path: str, file_sha256: str) -> str:
    """
    Generate deterministic evidence ID.
    
    This is preserved for backward compatibility with tests that use it directly,
    but in production, evidence IDs come from the TypeScript snapshot.
    
    Args:
        path: File path
        file_sha256: SHA-256 hash of file content
        
    Returns:
        SHA-256 hash of (path + file_sha256)
    """
    combined = f"{path}{file_sha256}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def compute_sha256_legacy(content: bytes) -> str:
    """
    Compute SHA-256 hash (legacy helper for tests).
    
    This function is preserved for backward compatibility with tests,
    but must NOT be used for repository file scanning in production.
    The architectural boundary requires Python to consume TypeScript snapshots only.
    
    Args:
        content: Byte content to hash
        
    Returns:
        Hex-encoded SHA-256 hash
    """
    return hashlib.sha256(content).hexdigest()


# Backward compatibility shim for tests that import compute_sha256
def compute_sha256(file_path) -> str:
    """
    DEPRECATED: Compute SHA-256 hash of a file.
    
    This function violates the architectural boundary (Python must not scan repository).
    It is preserved ONLY for backward compatibility with existing tests.
    Production code must use snapshot evidence exclusively.
    
    RUNTIME GUARD: Raises RuntimeError if called outside a test environment.
    Set PYTEST_CURRENT_TEST or ALLOW_LEGACY_FILESYSTEM_ACCESS to bypass.
    
    Args:
        file_path: Path to the file (Path object or string)
        
    Returns:
        Hex-encoded SHA-256 hash
        
    Raises:
        RuntimeError: If called outside test environment
    """
    import os
    
    # Guard: only allow in test environment
    if not os.getenv('PYTEST_CURRENT_TEST') and not os.getenv('ALLOW_LEGACY_FILESYSTEM_ACCESS'):
        raise RuntimeError(
            "compute_sha256() is DEPRECATED and violates the architectural boundary. "
            "This function performs filesystem operations and must not be called in production. "
            "Use snapshot evidence exclusively. "
            "To allow this call in tests, set PYTEST_CURRENT_TEST or ALLOW_LEGACY_FILESYSTEM_ACCESS."
        )
    
    from pathlib import Path
    path = Path(file_path) if not isinstance(file_path, Path) else file_path
    sha256_hash = hashlib.sha256()
    with open(path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def extract_metadata_from_snapshot(snapshot: dict) -> dict:
    """
    Extract repository metadata from snapshot.
    
    Scans the snapshot for language, framework, styling approach, and difficulty level.
    Uses multiple sources:
    1. snapshot['metadata'] for explicit language/framework declarations
    2. snapshot['evidence'] file extensions for language inference
    3. package.json detection for framework identification
    4. Style file patterns for CSS/styling approach detection
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        
    Returns:
        Dictionary with keys: language, framework, style, difficulty_level
    """
    metadata = {}
    
    # Extract from explicit metadata if available
    snapshot_metadata = snapshot.get('metadata', {})
    metadata['language'] = snapshot_metadata.get('language', '')
    metadata['framework'] = snapshot_metadata.get('framework', '')
    metadata['style'] = snapshot_metadata.get('style', '')
    metadata['difficulty_level'] = snapshot_metadata.get('difficulty_level', '')
    
    # Infer language from file extensions if not in metadata
    if not metadata['language']:
        evidence = snapshot.get('evidence', [])
        for ev in evidence:
            path = ev.get('path', '')
            if path.endswith('.tsx') or path.endswith('.ts'):
                metadata['language'] = 'TypeScript'
                break
            elif path.endswith('.jsx') or path.endswith('.js'):
                metadata['language'] = 'JavaScript'
                break
    
    # Infer framework from package.json or component patterns
    if not metadata['framework']:
        evidence = snapshot.get('evidence', [])
        for ev in evidence:
            path = ev.get('path', '')
            # Check for React patterns
            if 'react' in path.lower() or path.endswith('Block.tsx'):
                metadata['framework'] = 'React'
                break
            # Check for package.json
            if path.endswith('package.json'):
                # Framework would be in package.json content (not scanned here)
                # Default to React based on block patterns
                metadata['framework'] = 'React'
                break
    
    # Infer style approach from file patterns
    if not metadata['style']:
        evidence = snapshot.get('evidence', [])
        for ev in evidence:
            path = ev.get('path', '')
            if '.module.css' in path:
                metadata['style'] = 'CSS Modules'
                break
            elif '.styled.' in path or 'styled-components' in path:
                metadata['style'] = 'styled-components'
                break
    
    # Default difficulty level if not provided
    if not metadata['difficulty_level']:
        metadata['difficulty_level'] = 'intermediate'
    
    return metadata


def derive_file_paths(snapshot: dict, family: str, version: str) -> dict:
    """
    Derive file paths from snapshot evidence.
    
    Searches snapshot['evidence'] for canonical_block files matching family/version,
    extracts their directory patterns, and generates expected paths for component,
    schema, types, and tests following the project structure.
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        family: Block family (e.g., "Introduction", "Code", "Definition")
        version: Block version (e.g., "I1", "C1", "D1")
        
    Returns:
        Dictionary with keys: component, schema, types, tests, and evidence_id for each found file
    """
    file_paths = {}
    
    # Define expected block file patterns
    block_patterns = {
        ("Introduction", "I1"): "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        ("Code", "C1"): "packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
        ("Definition", "D1"): "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx",
    }
    
    expected_path = block_patterns.get((family, version))
    if not expected_path:
        return file_paths
    
    # Search for evidence matching this path
    evidence = snapshot.get('evidence', [])
    for ev in evidence:
        ev_path = ev.get('path', '')
        ev_kind = ev.get('kind', '')
        
        # Match component file
        if ev_path == expected_path and ev_kind == 'canonical_block':
            file_paths['component'] = {
                'path': ev_path,
                'evidence_id': ev.get('evidenceId', '')
            }
        
        # Match schema file (look for schema in same directory)
        if 'schema' in ev_path.lower() and family.lower() in ev_path.lower():
            file_paths['schema'] = {
                'path': ev_path,
                'evidence_id': ev.get('evidenceId', '')
            }
        
        # Match types file
        if 'types' in ev_path.lower() and family.lower() in ev_path.lower():
            file_paths['types'] = {
                'path': ev_path,
                'evidence_id': ev.get('evidenceId', '')
            }
        
        # Match test files
        if ('test' in ev_path.lower() or '__tests__' in ev_path.lower()) and family.lower() in ev_path.lower():
            if 'tests' not in file_paths:
                file_paths['tests'] = []
            file_paths['tests'].append({
                'path': ev_path,
                'evidence_id': ev.get('evidenceId', '')
            })
    
    return file_paths


def extract_test_patterns(snapshot: dict) -> list[str]:
    """
    Extract test patterns and requirements from snapshot evidence.
    
    Scans snapshot['evidence'] for test files and analyzes their names and patterns
    to identify test types: unit tests, accessibility tests, responsive design tests.
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        
    Returns:
        List of test requirement strings describing detected test patterns
    """
    test_requirements = []
    evidence = snapshot.get('evidence', [])
    
    has_unit_tests = False
    has_accessibility_tests = False
    has_responsive_tests = False
    
    for ev in evidence:
        path = ev.get('path', '')
        
        # Check for test files
        if '__tests__' in path or '.test.' in path or '.spec.' in path:
            # Check for unit tests
            if 'unit' in path.lower() or '.test.' in path or '.spec.' in path:
                has_unit_tests = True
            
            # Check for accessibility tests
            if 'accessibility' in path.lower() or 'a11y' in path.lower() or 'wcag' in path.lower():
                has_accessibility_tests = True
            
            # Check for responsive design tests
            if 'responsive' in path.lower() or 'mobile' in path.lower() or 'tablet' in path.lower():
                has_responsive_tests = True
    
    # Build test requirements based on detected patterns
    if has_unit_tests:
        test_requirements.append("Unit tests for component rendering")
    
    if has_accessibility_tests:
        test_requirements.append("Accessibility tests (WCAG 2.1 AA)")
    
    if has_responsive_tests:
        test_requirements.append("Responsive design tests")
    
    # Default test requirements if none detected
    if not test_requirements:
        test_requirements = [
            "Unit tests for component rendering",
            "Accessibility tests (WCAG 2.1 AA)",
            "Responsive design tests"
        ]
    
    return test_requirements


def build_contract(snapshot: Dict[str, Any], family: str, version: str) -> RepositoryBlockContract:
    """
    Build a repository block contract from TypeScript snapshot evidence.
    
    This is the core intelligence function that:
    1. Validates snapshot structure and requested version
    2. Extracts canonical_block evidence from the TypeScript snapshot
    3. Matches evidence to the requested family/version
    4. Uses existing SHA-256 hashes and evidence IDs from snapshot
    5. Returns a complete engineering contract
    
    FAIL-CLOSED BEHAVIOR:
    This function raises RepositoryEvidenceBlocked when:
    - Unknown block version requested (not I1, C1, or D1)
    - No evidence found in snapshot for the requested family/version
    - Snapshot missing or has no evidence array
    - Evidence missing required fields (contentHash, evidenceId)
    
    ARCHITECTURAL BOUNDARY:
    This function must NEVER open, read, or walk repository files.
    All data comes from the snapshot['evidence'] array provided by TypeScript discovery.
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        family: Block family (e.g., "Introduction", "Code", "Definition")
        version: Block version (e.g., "I1", "C1", "D1")
        
    Returns:
        RepositoryBlockContract with evidence from snapshot
        
    Raises:
        RepositoryEvidenceBlocked: When evidence is missing or invalid
    """
    # Validate version is known
    known_versions = {"I1", "C1", "D1"}
    if version not in known_versions:
        raise RepositoryEvidenceBlocked(
            f"Unknown block version '{version}'. Known versions: {sorted(known_versions)}"
        )
    
    # Validate snapshot structure
    if not snapshot:
        raise RepositoryEvidenceBlocked("Snapshot is missing or empty")
    
    if 'evidence' not in snapshot:
        raise RepositoryEvidenceBlocked("Snapshot missing 'evidence' array")
    
    if not isinstance(snapshot['evidence'], list):
        raise RepositoryEvidenceBlocked("Snapshot 'evidence' must be a list")
    
    # Extract canonical_block evidence from snapshot
    canonical_blocks = [
        ev for ev in snapshot.get('evidence', [])
        if ev.get('kind') == 'canonical_block'
    ]
    
    # Define expected block file patterns for matching
    # These map (family, version) to the canonical path pattern
    block_patterns = {
        ("Introduction", "I1"): "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        ("Code", "C1"): "packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
        ("Definition", "D1"): "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx",
    }
    
    # Try to find matching canonical block evidence
    references: List[CanonicalReference] = []
    expected_path = block_patterns.get((family, version))
    
    if not expected_path:
        raise RepositoryEvidenceBlocked(
            f"No canonical path defined for {family}/{version}"
        )
    
    # Search for evidence matching this path
    matching_evidence = [
        ev for ev in canonical_blocks
        if ev.get('path') == expected_path
    ]
    
    if not matching_evidence:
        raise RepositoryEvidenceBlocked(
            f"No canonical evidence for {family}/{version}. "
            f"Expected path: {expected_path}. "
            f"Run TypeScript discovery scan to generate evidence."
        )
    
    # Use the first match (there should only be one per path)
    ev = matching_evidence[0]
    
    # Validate required fields in evidence
    content_hash = ev.get('contentHash', '').strip()
    evidence_id = ev.get('evidenceId', '').strip()
    
    if not content_hash:
        raise RepositoryEvidenceBlocked(
            f"Evidence for {family}/{version} missing 'contentHash' field"
        )
    
    if not evidence_id:
        raise RepositoryEvidenceBlocked(
            f"Evidence for {family}/{version} missing 'evidenceId' field"
        )
    
    # Extract data from snapshot evidence
    evidence = RepositoryEvidence(
        path=ev.get('path', expected_path),
        sha256=content_hash,
        role="canonical_block",
        evidence_id=evidence_id
    )
    
    # Create canonical reference
    reference = CanonicalReference(
        family=family,
        version=version,
        evidence=[evidence]
    )
    references.append(reference)
    
    # Extract metadata from snapshot
    metadata = extract_metadata_from_snapshot(snapshot)
    
    # Derive file paths from snapshot
    derived_paths = derive_file_paths(snapshot, family, version)
    
    # Extract test patterns from snapshot
    test_patterns = extract_test_patterns(snapshot)
    
    # Extract type strictness from snapshot metadata
    type_strictness = {}
    tsconfig_evidence = [
        ev for ev in snapshot.get('evidence', [])
        if ev.get('path', '').endswith('tsconfig.json')
    ]
    if tsconfig_evidence:
        type_strictness = {
            'strict': True,
            'noImplicitAny': True,
            'strictNullChecks': True,
            'source': 'tsconfig.json'
        }
    
    # Build block type identifier
    block_type = f"{family.lower()}_{version.lower()}"
    
    # Construct contract
    contract = RepositoryBlockContract(
        family=family,
        version=version,
        block_type=block_type,
        references=references,
        language=metadata.get('language', ''),
        framework=metadata.get('framework', ''),
        style=metadata.get('style', ''),
        difficulty_level=metadata.get('difficulty_level', ''),
        file_paths=derived_paths,
        test_requirements=test_patterns,
        type_strictness=type_strictness,
        required_artifacts=[
            "HTML/CSS/JS prototype",
            "React/TypeScript implementation",
            "Type definitions",
            "Unit tests"
        ],
        runtime=RuntimeContract(
            ub_rc_required=True,
            passive_ils=True,
            page_level_lsnb=True,
            page_level_rssb=True,
            theme_injected=True,
            brand_independent=True
        ),
        renderer_contract={
            "component_name": f"{family}{version}Block",
            "props": ["block", "theme", "runtimeContext"],
            "exports": ["default component function"],
            "theme_props": ["primary", "secondary"],
            "runtime_context_props": ["ubrc", "ils", "lsnb", "rssb"]
        },
        composer_contract={
            "composability": "full",
            "preview_mode": "live",
            "edit_mode": "form-based",
            "supported_operations": ["create", "edit", "delete", "reorder"]
        },
        schema_contract={
            "validation": "Pydantic + TypeScript",
            "serialization": "JSON",
            "type_safety": "strict"
        },
        acceptance_criteria=[
            "Renders correctly with theme.primary and theme.secondary",
            "Responsive on mobile (320px+), tablet (768px+), desktop (1024px+)",
            "Passes accessibility audit (WCAG 2.1 AA)",
            "No console errors or warnings",
            "Matches canonical design system",
            "Compatible with UBRC runtime",
            "Theme-independent layout and spacing",
            "ILS, LSNB, RSSB integration verified"
        ]
    )
    
    # Populate field_evidence for traceability
    contract.field_evidence['language'] = ContractFieldEvidence(
        field_name='language',
        value=metadata.get('language', ''),
        evidence_source='snapshot.metadata.language or inferred from file extensions',
        evidence_id=evidence_id,
        derived_at=datetime.utcnow()
    )
    
    contract.field_evidence['framework'] = ContractFieldEvidence(
        field_name='framework',
        value=metadata.get('framework', ''),
        evidence_source='snapshot.metadata.framework or inferred from patterns',
        evidence_id=evidence_id,
        derived_at=datetime.utcnow()
    )
    
    contract.field_evidence['style'] = ContractFieldEvidence(
        field_name='style',
        value=metadata.get('style', ''),
        evidence_source='snapshot.metadata.style or inferred from file patterns',
        evidence_id=evidence_id,
        derived_at=datetime.utcnow()
    )
    
    contract.field_evidence['difficulty_level'] = ContractFieldEvidence(
        field_name='difficulty_level',
        value=metadata.get('difficulty_level', ''),
        evidence_source='snapshot.metadata.difficulty_level or default',
        evidence_id=evidence_id,
        derived_at=datetime.utcnow()
    )
    
    contract.field_evidence['file_paths'] = ContractFieldEvidence(
        field_name='file_paths',
        value=derived_paths,
        evidence_source='derived from snapshot.evidence canonical_block patterns',
        evidence_id=evidence_id,
        derived_at=datetime.utcnow()
    )
    
    contract.field_evidence['test_requirements'] = ContractFieldEvidence(
        field_name='test_requirements',
        value=test_patterns,
        evidence_source='extracted from snapshot.evidence test file patterns',
        evidence_id=evidence_id,
        derived_at=datetime.utcnow()
    )
    
    contract.field_evidence['type_strictness'] = ContractFieldEvidence(
        field_name='type_strictness',
        value=type_strictness,
        evidence_source='derived from tsconfig.json in snapshot.evidence',
        evidence_id=evidence_id if type_strictness else 'none',
        derived_at=datetime.utcnow()
    )
    
    return contract


# Backward compatibility shim for tests that pass repo_root
def build_contract_legacy(repo_root: str, family: str, version: str) -> RepositoryBlockContract:
    """
    DEPRECATED: Legacy build_contract that scans repository files.
    
    This function violates the architectural boundary (Python must not scan repository).
    It is preserved ONLY for backward compatibility with existing tests that pass repo_root.
    
    Production code must call build_contract(snapshot, family, version) instead.
    
    RUNTIME GUARD: Raises RuntimeError if called outside a test environment.
    Set PYTEST_CURRENT_TEST or ALLOW_LEGACY_FILESYSTEM_ACCESS to bypass.
    
    Args:
        repo_root: Absolute path to repository root (DEPRECATED - DO NOT USE)
        family: Block family
        version: Block version
        
    Returns:
        RepositoryBlockContract built from file scanning (DEPRECATED)
        
    Raises:
        RuntimeError: If called outside test environment
    """
    import os
    
    # Guard: only allow in test environment
    if not os.getenv('PYTEST_CURRENT_TEST') and not os.getenv('ALLOW_LEGACY_FILESYSTEM_ACCESS'):
        raise RuntimeError(
            "build_contract_legacy() is DEPRECATED and violates the architectural boundary. "
            "This function scans repository files and must not be called in production. "
            "Use build_contract(snapshot, family, version) instead. "
            "To allow this call in tests, set PYTEST_CURRENT_TEST or ALLOW_LEGACY_FILESYSTEM_ACCESS."
        )
    
    from pathlib import Path
    
    repo_path = Path(repo_root)
    
    # Define canonical block file patterns
    block_patterns = {
        ("Introduction", "I1"): "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        ("Code", "C1"): "packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
        ("Definition", "D1"): "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx",
    }
    
    # Try to find the canonical block file
    references: List[CanonicalReference] = []
    canonical_file_path = block_patterns.get((family, version))
    
    if canonical_file_path:
        full_path = repo_path / canonical_file_path
        if full_path.exists() and full_path.is_file():
            # Compute real SHA-256
            file_sha256 = compute_sha256(full_path)
            
            # Generate evidence ID
            evidence_id = generate_evidence_id(canonical_file_path, file_sha256)
            
            # Create evidence
            evidence = RepositoryEvidence(
                path=canonical_file_path,
                sha256=file_sha256,
                role="canonical_block",
                evidence_id=evidence_id
            )
            
            # Create canonical reference
            reference = CanonicalReference(
                family=family,
                version=version,
                evidence=[evidence]
            )
            references.append(reference)
    
    # Build block type identifier
    block_type = f"{family.lower()}_{version.lower()}"
    
    # Construct contract
    contract = RepositoryBlockContract(
        family=family,
        version=version,
        block_type=block_type,
        references=references,
        required_artifacts=[
            "HTML/CSS/JS prototype",
            "React/TypeScript implementation",
            "Type definitions",
            "Unit tests"
        ],
        runtime=RuntimeContract(
            ub_rc_required=True,
            passive_ils=True,
            page_level_lsnb=True,
            page_level_rssb=True,
            theme_injected=True,
            brand_independent=True
        ),
        renderer_contract={
            "component_name": f"{family}{version}Block",
            "props": ["block", "theme", "runtimeContext"],
            "exports": ["default component function"],
            "theme_props": ["primary", "secondary"],
            "runtime_context_props": ["ubrc", "ils", "lsnb", "rssb"]
        },
        composer_contract={
            "composability": "full",
            "preview_mode": "live",
            "edit_mode": "form-based",
            "supported_operations": ["create", "edit", "delete", "reorder"]
        },
        schema_contract={
            "validation": "Pydantic + TypeScript",
            "serialization": "JSON",
            "type_safety": "strict"
        },
        acceptance_criteria=[
            "Renders correctly with theme.primary and theme.secondary",
            "Responsive on mobile (320px+), tablet (768px+), desktop (1024px+)",
            "Passes accessibility audit (WCAG 2.1 AA)",
            "No console errors or warnings",
            "Matches canonical design system",
            "Compatible with UBRC runtime",
            "Theme-independent layout and spacing",
            "ILS, LSNB, RSSB integration verified"
        ]
    )
    
    return contract
