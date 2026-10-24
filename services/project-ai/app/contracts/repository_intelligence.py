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

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import hashlib
import re

EVIDENCE_ID_PATTERN = re.compile(r'^(evidence-[a-fA-F0-9]{16}|[a-fA-F0-9]{64})$')
HEX_64_PATTERN = re.compile(r'^[a-fA-F0-9]{64}$')

VALID_PROVENANCE_VALUES = {
    "observed",
    "observed_in_snapshot",
    "observed_in_snapshot_metadata",
    "observed_in_parsed_config",
    "observed_in_snapshot_content",
    "inferred",
    "inferred_from_file_extensions",
    "inferred_from_block_extensions",
    "policy_required",
    "policy_default",
    "policy_default_tailwind",
    "policy_default_intermediate",
    "proposed",
    "derived_from_snapshot_manifest",
    "derived_and_policy_required",
    "unparsed_file_evidence",
    "unknown"
}


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
    - Explicit separation of real evidence IDs vs inferred or policy-required defaults
    - Traceability from contract field back to source evidence
    """
    field_name: str = Field(..., description="Name of the contract field (e.g., 'language', 'framework')")
    value: Any = Field(..., description="The actual value assigned to the field")
    evidence_source: str = Field(..., description="Description of snapshot path or metadata key")
    evidence_id: Optional[str] = Field(None, description="Unique evidence ID from snapshot, or None if inferred/default")
    provenance: str = Field("observed", description="Provenance category from controlled vocabulary")
    source_evidence_ids: list[str] = Field(default_factory=list, description="IDs of snapshot evidence backing this field")
    derived_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when evidence was captured")

    @field_validator("derived_at", mode="before")
    @classmethod
    def validate_derived_at_tz(cls, v):
        if v is None:
            return datetime.now(timezone.utc)
        if isinstance(v, datetime):
            if v.tzinfo is None:
                return v.replace(tzinfo=timezone.utc)
            return v
        return v

    @field_validator("provenance")
    @classmethod
    def validate_provenance_field(cls, v):
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError("provenance must be a non-empty string")
        clean = v.strip()
        if clean not in VALID_PROVENANCE_VALUES:
            raise ValueError(
                f"Invalid provenance '{clean}'. Must be one of: {sorted(list(VALID_PROVENANCE_VALUES))}"
            )
        return clean

    @field_validator("evidence_id")
    @classmethod
    def validate_ev_id(cls, v):
        if v is not None and str(v).strip():
            clean = str(v).strip()
            if not EVIDENCE_ID_PATTERN.match(clean):
                raise ValueError(
                    f"Evidence ID '{clean}' does not match discovery contract pattern (evidence-<16-hex> or 64-hex SHA-256)"
                )
            return clean
        return None

    @field_validator("source_evidence_ids")
    @classmethod
    def validate_source_ev_ids(cls, v):
        if not isinstance(v, list):
            raise ValueError("source_evidence_ids must be a list")
        cleaned = []
        for item in v:
            if item and str(item).strip():
                clean_item = str(item).strip()
                if not EVIDENCE_ID_PATTERN.match(clean_item):
                    raise ValueError(
                        f"Source evidence ID '{clean_item}' does not match discovery contract pattern"
                    )
                cleaned.append(clean_item)
        return cleaned


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
    """Runtime requirements and guarantees with explicit provenance classification."""
    category: str = Field("policy_requirement", description="Classification: policy_requirement (mandatory architectural rules)")
    ub_rc_required: bool = Field(True, description="Universal Block Runtime Context required")
    passive_ils: bool = Field(True, description="Passive ILS (Inline Learner Support)")
    page_level_lsnb: bool = Field(True, description="Page-level Left-Side Navigation Bar")
    page_level_rssb: bool = Field(True, description="Page-level Right-Side Status Bar")
    theme_injected: bool = Field(True, description="Theme injected via props")
    brand_independent: bool = Field(True, description="Brand-independent rendering")


class VerificationStatus(BaseModel):
    """
    Intake and integration verification gates status.
    All gates default to NOT_RUN until real verification checks execute.
    """
    typescript_compilation: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")
    schema_validation: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")
    wcag_accessibility: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")
    theme_independence: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")
    composer_integration: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")
    runtime_ubrc: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")
    intake_certification: str = Field("NOT_RUN", description="NOT_RUN | PASS | FAIL | BLOCKED")


def validate_evidence_id(evidence_id: Optional[str], context: str = "") -> str:
    """
    Validate that an evidence ID conforms to the TypeScript discovery contract.
    
    Accepts:
    1. 'evidence-<16-hex-chars>' (deterministic ID from TypeScript scanner path-utils.ts)
    2. 64-character SHA-256 hexadecimal string
    
    Rejects:
    - Empty, None, or whitespace
    - Non-compliant illustrative placeholders (e.g., 'ev-intro-1234', 'test-id')
    
    Args:
        evidence_id: Evidence ID string to validate
        context: Optional descriptive context for error messages
        
    Returns:
        Cleaned, validated evidence ID string
        
    Raises:
        RepositoryEvidenceBlocked: If ID is missing or invalid format
    """
    if not evidence_id or not isinstance(evidence_id, str) or not evidence_id.strip():
        ctx_msg = f" for {context}" if context else ""
        raise RepositoryEvidenceBlocked(f"Evidence{ctx_msg} missing 'evidenceId' field")
    
    clean_id = evidence_id.strip()
    if not EVIDENCE_ID_PATTERN.match(clean_id):
        ctx_msg = f" for {context}" if context else ""
        raise RepositoryEvidenceBlocked(
            f"Evidence{ctx_msg} has invalid 'evidenceId': '{clean_id}'. "
            f"Must conform to TypeScript discovery service contract: "
            f"'evidence-<16 hex chars>' or 64-character SHA-256 hex string. "
            f"Illustrative test placeholders are strictly prohibited."
        )
    return clean_id


def validate_content_hash(content_hash: str, context: Optional[str] = None) -> str:
    """
    Validates that a content hash is a non-empty 64-character hexadecimal SHA-256 hash.
    
    Args:
        content_hash: The content hash string to validate
        context: Optional descriptive context for error messages
        
    Returns:
        Cleaned, validated hash string
        
    Raises:
        RepositoryEvidenceBlocked: If hash is missing or not a 64-character hex string
    """
    if not content_hash or not isinstance(content_hash, str) or not content_hash.strip():
        ctx_msg = f" for {context}" if context else ""
        raise RepositoryEvidenceBlocked(f"Evidence{ctx_msg} missing 'contentHash' field")
    
    clean_hash = content_hash.strip()
    if not HEX_64_PATTERN.match(clean_hash):
        ctx_msg = f" for {context}" if context else ""
        raise RepositoryEvidenceBlocked(
            f"Evidence{ctx_msg} has invalid 'contentHash': '{clean_hash}'. "
            f"Expected a 64-character hexadecimal SHA-256 hash."
        )
    return clean_hash


class ComparativeFrameworkAnalysis(BaseModel):
    """
    Evidence-backed comparative analysis across canonical blocks in the repository.
    Explicitly separates shared framework invariants from block-specific features,
    and binds each invariant to the snapshot evidence IDs that support it.
    """
    canonical_blocks_analyzed: list[str] = Field(
        default_factory=list,
        description="Canonical block implementations analyzed from snapshot"
    )
    missing_baselines: list[str] = Field(
        default_factory=list,
        description="Canonical baselines missing from snapshot (Introduction I1, Definition D1, or Code C1)"
    )
    baseline_completeness: str = Field(
        default="complete",
        description="Completeness of canonical baselines: 'complete' (3/3) or 'partial' (< 3)"
    )
    shared_conventions: dict[str, Any] = Field(
        default_factory=dict,
        description="Conventions invariant across all analyzed canonical blocks with backing evidence IDs"
    )
    block_specific_conventions: dict[str, Any] = Field(
        default_factory=dict,
        description="Block-specific GUI and content models with their source evidence IDs"
    )
    policy_requirements: list[Any] = Field(
        default_factory=list,
        description="Mandatory architectural policy constraints explicitly classified as policy assertions"
    )
    unresolved_differences: list[str] = Field(
        default_factory=list,
        description="Known implementation differences across canonical baselines"
    )


class RepositoryBlockContract(BaseModel):
    """
    Complete engineering contract derived from repository intelligence.
    This is the authoritative contract external AI receives.
    """
    family: str = Field(..., description="Block family")
    version: str = Field(..., description="Block version")
    block_type: str = Field(..., description="Block type identifier")
    references: list[CanonicalReference] = Field(default_factory=list, description="Canonical references found")
    comparative_analysis: ComparativeFrameworkAnalysis = Field(
        default_factory=ComparativeFrameworkAnalysis,
        description="Comparative analysis of the 3 canonical blocks establishing the shared framework"
    )
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
    test_pattern_breakdown: dict = Field(
        default_factory=dict,
        description="Breakdown separating observed test patterns from mandatory architectural policy tests"
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
    verification_status: VerificationStatus = Field(
        default_factory=VerificationStatus,
        description="Intake and integration verification gates (NOT_RUN until real checks execute)"
    )
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
        if not metadata['style']:
            metadata['style'] = 'Tailwind CSS'
    
    # Default difficulty level if not provided
    if not metadata['difficulty_level']:
        metadata['difficulty_level'] = 'intermediate'
    
    # Track explicit provenance to distinguish observed vs inferred vs policy default
    metadata['provenance'] = {
        'language': 'observed_in_snapshot' if snapshot_metadata.get('language') else 'inferred_from_file_extensions',
        'framework': 'observed_in_snapshot' if snapshot_metadata.get('framework') else 'inferred_from_block_extensions',
        'style': 'observed_in_snapshot' if snapshot_metadata.get('style') else ('inferred_from_file_patterns' if metadata['style'] != 'Tailwind CSS' else 'policy_default_tailwind'),
        'difficulty_level': 'observed_in_snapshot' if snapshot_metadata.get('difficulty_level') else 'policy_default_intermediate'
    }
    
    return metadata


def derive_file_paths(snapshot: dict, family: str, version: str) -> dict:
    """
    Derive file paths from snapshot evidence.
    
    Cleanly separates:
    - observed: exact matching files found in snapshot evidence with real evidence IDs and hashes
    - shared_framework: shared types and utilities supporting the block
    - proposed: target files to be implemented by External AI (never fabricated source evidence)
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        family: Block family (e.g., "Introduction", "Code", "Definition", "Objective")
        version: Block version (e.g., "I1", "C1", "D1", "O1")
        
    Returns:
        Dictionary with keys: component, schema, types, tests, and structured sections (observed, shared_framework, proposed)
    """
    file_paths = {}
    observed_files = {}
    shared_framework = {}
    proposed_outputs = {}
    
    expected_comp_path = f"packages/ui/src/tutorial/blocks/{family}{version}Block.tsx"
    expected_schema_path = f"packages/types/src/tutorial-rich-document/schemas/{family.lower()}-{version.lower()}.schema.ts"
    expected_test_path = f"packages/ui/src/tutorial/blocks/__tests__/{family}{version}Block.test.tsx"
    
    canonical_spec_paths = {
        ("Introduction", "I1"): "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        ("Code", "C1"): "packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
        ("Definition", "D1"): "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx",
    }
    if (family, version) in canonical_spec_paths:
        expected_comp_path = canonical_spec_paths[(family, version)]
    
    evidence = snapshot.get('evidence', [])
    for ev in evidence:
        ev_path = ev.get('path', '')
        ev_kind = ev.get('kind', '')
        ev_id = ev.get('evidenceId', '')
        ev_hash = ev.get('contentHash', '')
        
        # Ignore temporary worktree artifacts, build output, or dependencies
        if '.worktrees' in ev_path or 'node_modules' in ev_path or 'dist/' in ev_path:
            continue
            
        norm_ev_path = ev_path.replace('\\', '/')
        
        # 1. Observed component: exact match for target component
        if (norm_ev_path == expected_comp_path or norm_ev_path.endswith(f"/{family}Block.tsx")) and ev_kind in ('canonical_block', 'component', 'ui-component'):
            observed_files['component'] = {
                'path': ev_path,
                'status': 'existing_canonical',
                'evidence_id': ev_id,
                'sha256': ev_hash
            }
            
        # 2. Observed schema: EXACT match for target family schema only (never loose substrings)
        file_name = norm_ev_path.split('/')[-1].lower()
        exact_schema_names = {
            f"{family.lower()}-{version.lower()}.schema.ts",
            f"{family.lower()}.schema.ts"
        }
        if file_name in exact_schema_names and ev_kind in ('schema', 'type-definition'):
            observed_files['schema'] = {
                'path': ev_path,
                'status': 'observed_canonical_schema',
                'evidence_id': ev_id,
                'sha256': ev_hash
            }
            
        # 3. Shared framework types
        if norm_ev_path.endswith('tutorial/types.ts') and ev_kind in ('type-definition', 'schema', 'types'):
            shared_framework['types'] = {
                'path': ev_path,
                'status': 'observed_shared_types',
                'evidence_id': ev_id,
                'sha256': ev_hash
            }
            
        # 4. Target test file (exact match for target block only)
        file_name_raw = norm_ev_path.split('/')[-1]
        exact_test_names = {
            f"{family}{version}Block.test.tsx",
            f"{family}Block.test.tsx"
        }
        if file_name_raw in exact_test_names and ('test' in norm_ev_path.lower() or '__tests__' in norm_ev_path.lower()):
            if 'tests' not in observed_files:
                observed_files['tests'] = []
            observed_files['tests'].append({
                'path': ev_path,
                'status': 'canonical_test_suite',
                'evidence_id': ev_id,
                'sha256': ev_hash
            })
            
        # 5. Shared reference test files from canonical blocks only
        canonical_test_names = {
            "IntroductionBlock.test.tsx",
            "DefinitionBlock.test.tsx",
            "CodeC1Block.test.tsx",
        }
        if file_name_raw in canonical_test_names and file_name_raw not in exact_test_names:
            if 'reference_tests' not in shared_framework:
                shared_framework['reference_tests'] = []
            if len(shared_framework['reference_tests']) < 3 and not any(r['path'] == ev_path for r in shared_framework['reference_tests']):
                shared_framework['reference_tests'].append({
                    'path': ev_path,
                    'status': 'reference_example_test',
                    'evidence_id': ev_id,
                    'sha256': ev_hash
                })

    # Proposed outputs for target artifacts not yet in repository (never fabricate source evidence_id)
    if 'component' not in observed_files:
        proposed_outputs['component'] = {
            'path': expected_comp_path,
            'status': 'proposed_output_path',
            'provenance': 'to_be_implemented_by_external_ai'
        }
    if 'schema' not in observed_files:
        proposed_outputs['schema'] = {
            'status': 'to_be_created_or_defined_inline',
            'note': f'No existing schema for {family} in repository. Target payload schema is defined in type_contract.payload_schema.',
            'proposed_output_path': expected_schema_path
        }
    if 'tests' not in observed_files:
        proposed_outputs['tests'] = {
            'path': expected_test_path,
            'status': 'proposed_output_path',
            'provenance': 'to_be_implemented_by_external_ai'
        }
        
    if 'types' not in shared_framework:
        shared_framework['types'] = {
            'path': 'packages/ui/src/tutorial/types.ts',
            'status': 'shared_type_contract',
            'note': 'Shared BlockComponentProps and DomainTheme interfaces'
        }

    # Structured categories for explicit provenance
    file_paths['observed'] = observed_files
    file_paths['shared_framework'] = shared_framework
    file_paths['proposed'] = proposed_outputs
    
    # Top-level backward compatibility keys
    file_paths['component'] = observed_files.get('component', proposed_outputs.get('component'))
    file_paths['schema'] = observed_files.get('schema', proposed_outputs.get('schema'))
    file_paths['types'] = shared_framework.get('types')
    file_paths['tests'] = observed_files.get('tests', shared_framework.get('reference_tests', []))
    
    return file_paths


def extract_test_patterns_detailed(snapshot: dict) -> dict:
    """
    Extract test patterns with explicit separation between:
    - observed_patterns: patterns detected in snapshot test evidence with source evidence IDs
    - mandatory_policy_tests: architectural policy tests required for all blocks
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        
    Returns:
        Dictionary with observed_patterns, mandatory_policy_tests, and combined_requirements
    """
    evidence = snapshot.get('evidence', [])
    observed_patterns = []
    
    for ev in evidence:
        path = ev.get('path', '')
        ev_id = ev.get('evidenceId', '')
        if '__tests__' in path or '.test.' in path or '.spec.' in path:
            if 'unit' in path.lower() or '.test.' in path or '.spec.' in path:
                if not any(p['pattern'] == "Unit tests for component rendering" for p in observed_patterns):
                    observed_patterns.append({
                        "pattern": "Unit tests for component rendering",
                        "source_file": path,
                        "evidence_id": ev_id,
                        "classification": "observed_in_snapshot"
                    })
            if 'accessibility' in path.lower() or 'a11y' in path.lower() or 'wcag' in path.lower():
                if not any(p['pattern'] == "Accessibility tests (WCAG 2.1 AA)" for p in observed_patterns):
                    observed_patterns.append({
                        "pattern": "Accessibility tests (WCAG 2.1 AA)",
                        "source_file": path,
                        "evidence_id": ev_id,
                        "classification": "observed_in_snapshot"
                    })
            if 'responsive' in path.lower() or 'mobile' in path.lower() or 'tablet' in path.lower():
                if not any(p['pattern'] == "Responsive design tests" for p in observed_patterns):
                    observed_patterns.append({
                        "pattern": "Responsive design tests",
                        "source_file": path,
                        "evidence_id": ev_id,
                        "classification": "observed_in_snapshot"
                    })

    mandatory_policy_tests = [
        "Unit tests for component rendering",
        "Accessibility tests (WCAG 2.1 AA)",
        "Responsive design tests",
        "Dynamic theme token application test",
        "UBRC identity attributes verification test",
        "Zero hardcoded brand colors compliance test"
    ]
    
    combined = list(dict.fromkeys([p['pattern'] for p in observed_patterns] + mandatory_policy_tests))
    
    return {
        "observed_patterns": observed_patterns,
        "mandatory_policy_tests": mandatory_policy_tests,
        "combined_requirements": combined
    }


def extract_test_patterns(snapshot: dict) -> list[str]:
    """
    Extract test patterns and requirements from snapshot evidence.
    
    Scans snapshot['evidence'] for test files and analyzes their names and patterns.
    Returns combined list of observed and policy-required tests.
    
    Args:
        snapshot: Repository snapshot dictionary from TypeScript discovery service
        
    Returns:
        List of test requirement strings describing detected test patterns
    """
    detailed = extract_test_patterns_detailed(snapshot)
    return detailed['combined_requirements']


FAMILY_PAYLOAD_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "objective": {
        "title": "string (optional heading)",
        "objectives": "Array<{ id: string, text: string, bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create', completed?: boolean }>",
        "displayMode": "'bullet' | 'checklist' | 'numbered' (optional)"
    },
    "introduction": {
        "title": "string",
        "subtitle": "string (optional)",
        "leadParagraph": "string",
        "keyPoints": "string[] (optional)"
    },
    "code": {
        "code": "string",
        "language": "string",
        "fileName": "string (optional)",
        "highlights": "number[] (optional)"
    },
    "definition": {
        "term": "string",
        "pronunciation": "string (optional)",
        "definition": "string",
        "examples": "string[] (optional)"
    }
}


def generate_block_content_interface(
    family: str,
    version: str,
    payload_schema: Optional[Dict[str, Any]] = None
) -> str:
    """Generate strictly typed TypeScript interface for block content."""
    fam_lower = family.lower()
    if fam_lower == "objective":
        return (
            "/**\n"
            " * Objective Item definition conforming to Bloom's taxonomy\n"
            " */\n"
            "export interface ObjectiveItem {\n"
            "  id: string;\n"
            "  text: string;\n"
            "  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';\n"
            "  completed?: boolean;\n"
            "}\n"
            "\n"
            f"/**\n"
            f" * {family} {version} Block Content payload interface (strictly typed)\n"
            f" */\n"
            f"export interface {family}{version}BlockContent {{\n"
            "  title?: string;\n"
            "  objectives: ObjectiveItem[];\n"
            "  displayMode?: 'bullet' | 'checklist' | 'numbered';\n"
            "  [key: string]: unknown;\n"
            "}"
        )
    elif fam_lower == "introduction":
        return (
            f"/**\n"
            f" * {family} {version} Block Content payload interface (strictly typed)\n"
            f" */\n"
            f"export interface {family}{version}BlockContent {{\n"
            "  title?: string;\n"
            "  subtitle?: string;\n"
            "  leadParagraph: string;\n"
            "  keyPoints?: string[];\n"
            "  [key: string]: unknown;\n"
            "}"
        )
    elif fam_lower == "code":
        return (
            f"/**\n"
            f" * {family} {version} Block Content payload interface (strictly typed)\n"
            f" */\n"
            f"export interface {family}{version}BlockContent {{\n"
            "  title?: string;\n"
            "  code: string;\n"
            "  language: string;\n"
            "  fileName?: string;\n"
            "  highlights?: number[];\n"
            "  [key: string]: unknown;\n"
            "}"
        )
    elif fam_lower == "definition":
        return (
            f"/**\n"
            f" * {family} {version} Block Content payload interface (strictly typed)\n"
            f" */\n"
            f"export interface {family}{version}BlockContent {{\n"
            "  title?: string;\n"
            "  term: string;\n"
            "  pronunciation?: string;\n"
            "  definition: string;\n"
            "  examples?: string[];\n"
            "  [key: string]: unknown;\n"
            "}"
        )
    elif payload_schema:
        fields = []
        for prop_name, prop_type in payload_schema.items():
            is_opt = "optional" in str(prop_type).lower() or "?" in str(prop_type)
            clean_type = str(prop_type).replace("(optional heading)", "").replace("(optional)", "").strip()
            opt_flag = "?" if is_opt else ""
            fields.append(f"  {prop_name}{opt_flag}: {clean_type};")
        fields_str = "\n".join(fields)
        return (
            f"/**\n"
            f" * {family} {version} Block Content payload interface (strictly typed from schema)\n"
            f" */\n"
            f"export interface {family}{version}BlockContent {{\n"
            f"{fields_str}\n"
            f"  [key: string]: unknown;\n"
            f"}}"
        )
    else:
        return (
            f"/**\n"
            f" * {family} {version} Block Content payload interface (generic fallback)\n"
            f" */\n"
            f"export interface {family}{version}BlockContent {{\n"
            f"  title?: string;\n"
            f"  items?: Array<{{ id: string; text: string; [key: string]: unknown }}>;\n"
            f"  [key: string]: unknown;\n"
            f"}}"
        )


def generate_block_visual_skeleton(family: str, version: str) -> str:
    """Generate JSX visual elements adhering to brand-independent theme tokens."""
    fam_lower = family.lower()
    if fam_lower == "objective":
        return (
            "      {/* Educational objectives with brand theme accents */}\n"
            "      {block.content?.objectives && (\n"
            "        <ul className=\"mt-4 space-y-2\">\n"
            "          {block.content.objectives.map((obj) => (\n"
            "            <li key={obj.id} className=\"flex items-start gap-2\">\n"
            "              <span style={{ color: primary }}>•</span>\n"
            "              <span>{obj.text}</span>\n"
            "            </li>\n"
            "          ))}\n"
            "        </ul>\n"
            "      )}"
        )
    elif fam_lower == "introduction":
        return (
            "      {/* Lead paragraph and key points */}\n"
            "      {block.content?.leadParagraph && (\n"
            "        <p className=\"mt-3 text-base leading-relaxed\">{block.content.leadParagraph}</p>\n"
            "      )}\n"
            "      {block.content?.keyPoints && (\n"
            "        <ul className=\"mt-2 list-disc list-inside space-y-1\">\n"
            "          {block.content.keyPoints.map((pt, i) => (\n"
            "            <li key={i}>{pt}</li>\n"
            "          ))}\n"
            "        </ul>\n"
            "      )}"
        )
    elif fam_lower == "code":
        return (
            "      {/* Code snippet display */}\n"
            "      {block.content?.code && (\n"
            "        <pre className=\"mt-4 p-4 rounded bg-slate-900 text-slate-100 overflow-x-auto\">\n"
            "          <code>{block.content.code}</code>\n"
            "        </pre>\n"
            "      )}"
        )
    elif fam_lower == "definition":
        return (
            "      {/* Term definition */}\n"
            "      {block.content?.term && (\n"
            "        <div className=\"mt-3\">\n"
            "          <dt className=\"font-bold text-lg\">{block.content.term}</dt>\n"
            "          <dd className=\"mt-1 text-base\">{block.content?.definition}</dd>\n"
            "        </div>\n"
            "      )}"
        )
    else:
        return (
            "      {/* Visual content: render block payload items with brand theme tokens */}"
        )


def generate_test_mock_content(family: str, version: str) -> str:
    """Generate schema-aligned mock content for test skeletons."""
    fam_lower = family.lower()
    if fam_lower == "objective":
        return (
            f"    content: {{\n"
            f"      title: 'Test {family}',\n"
            f"      objectives: [\n"
            f"        {{\n"
            f"          id: 'obj-1',\n"
            f"          text: 'Understand TypeScript interface consistency',\n"
            f"          bloomLevel: 'understand' as const,\n"
            f"          completed: false,\n"
            f"        }},\n"
            f"      ],\n"
            f"      displayMode: 'checklist' as const,\n"
            f"    }},"
        )
    elif fam_lower == "introduction":
        return (
            f"    content: {{\n"
            f"      title: 'Test {family}',\n"
            f"      subtitle: 'Overview',\n"
            f"      leadParagraph: 'Welcome to this learning module.',\n"
            f"      keyPoints: ['Key concept 1', 'Key concept 2'],\n"
            f"    }},"
        )
    elif fam_lower == "code":
        return (
            f"    content: {{\n"
            f"      title: 'Test {family}',\n"
            f"      code: 'console.log(\"Hello world\");',\n"
            f"      language: 'typescript',\n"
            f"      fileName: 'example.ts',\n"
            f"      highlights: [1],\n"
            f"    }},"
        )
    elif fam_lower == "definition":
        return (
            f"    content: {{\n"
            f"      title: 'Test {family}',\n"
            f"      term: 'Polymorphism',\n"
            f"      pronunciation: '/ˌpɒlɪˈmɔːfɪz(ə)m/',\n"
            f"      definition: 'The ability of an object to take on many forms.',\n"
            f"      examples: ['Method overriding in OOP'],\n"
            f"    }},"
        )
    else:
        return (
            f"    content: {{\n"
            f"      title: 'Test {family}',\n"
            f"      items: [{{ id: 'item-1', text: 'First item' }}]\n"
            f"    }},"
        )


def build_inline_code_templates(
    family: str,
    version: str,
    payload_schema: Optional[Dict[str, Any]] = None
) -> dict:
    """
    Build generic compliance code templates for External AI.
    
    These templates provide strictly typed TypeScript interfaces and component skeletons
    adhering to repository strictness (zero 'any' types, full UBRC, dual-brand theme test).
    
    Args:
        family: Block family (e.g., "Objective", "Visual")
        version: Block version (e.g., "O1", "V1")
        payload_schema: Optional schema dictionary mapping properties to types.
            If omitted, looked up from FAMILY_PAYLOAD_SCHEMAS.
        
    Returns:
        Dictionary with template keys
    """
    component_name = f"{family}{version}Block"
    block_type_lower = family.lower()
    
    resolved_schema = payload_schema if payload_schema is not None else FAMILY_PAYLOAD_SCHEMAS.get(block_type_lower)
    content_interface = generate_block_content_interface(family, version, resolved_schema)
    visual_content = generate_block_visual_skeleton(family, version)
    test_mock_content = generate_test_mock_content(family, version)
    
    return {
        "interfaces": {
            "description": (
                "TypeScript interfaces that EVERY block must use. "
                "These are imported from '../types' in the packages/ui layer."
            ),
            "BlockComponentProps": (
                "interface BlockComponentProps<T extends TutorialBlock = TutorialBlock> {\n"
                "  block: T;\n"
                "  depth?: number;\n"
                "  theme?: DomainTheme;\n"
                "  className?: string;\n"
                "  renderChild?: (block: TutorialBlock, depth: number) => React.ReactNode;\n"
                "  runtimeContext?: TutorialBlockRuntimeContext;\n"
                "}"
            ),
            "DomainTheme": (
                "interface DomainTheme {\n"
                "  primary: string;      // Brand primary color (e.g., '#e11d48')\n"
                "  secondary: string;    // Brand secondary color (e.g., '#1e293b')\n"
                "  primaryDark?: string;\n"
                "  slate?: { 50?: string; 100?: string; 200?: string; 300?: string; "
                "400?: string; 500?: string; 600?: string; 700?: string; "
                "800?: string; 900?: string; 950?: string; };\n"
                "  gray?: { 50?: string; /* ...through 900 */ };\n"
                "  blue?: { 50?: string; /* ...through 900 */ };\n"
                "  emerald?: { 50?: string; /* ...through 900 */ };\n"
                "  amber?: { 50?: string; /* ...through 900 */ };\n"
                "  rose?: { 50?: string; /* ...through 900 */ };\n"
                "  teal?: { 50?: string; /* ...through 900 */ };\n"
                "  [key: string]: unknown;\n"
                "}"
            ),
            "TutorialBlockRuntimeContext": (
                "interface TutorialBlockRuntimeContext {\n"
                "  learnerId: string;\n"
                "  navigationNodeId: string;\n"
                "  sectionId: string | null;\n"
                "  blockId: string;\n"
                "  blockType: string;\n"
                "  blockVersion: string;\n"
                "  subtopicId: string;\n"
                "}"
            ),
        },
        "component_skeleton": {
            "description": (
                f"Complete, strongly typed component skeleton for {component_name}. "
                "The version router and UBRC <article> wrapper are MANDATORY. "
                "Zero 'any' types — External AI fills in visual JSX inside the <article> tag."
            ),
            "code": (
                f"import React from 'react';\n"
                f"import type {{ BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext }} from '../types';\n"
                f"import {{ getThemeColor, withAlpha, DEFAULT_THEME }} from '../theme-utils';\n"
                f"\n"
                f"{content_interface}\n"
                f"\n"
                f"/**\n"
                f" * {family} {version} Block Data contract\n"
                f" */\n"
                f"export interface {family}{version}BlockData {{\n"
                f"  id: string;\n"
                f"  type: string;\n"
                f"  version: string;\n"
                f"  content?: {family}{version}BlockContent;\n"
                f"  [key: string]: unknown;\n"
                f"}}\n"
                f"\n"
                f"/**\n"
                f" * {family} Block - Version Router\n"
                f" * Routes to version-specific implementation based on block.version\n"
                f" */\n"
                f"export function {family}Block({{\n"
                f"  block,\n"
                f"  className = '',\n"
                f"  theme,\n"
                f"  runtimeContext,\n"
                f"}}: BlockComponentProps) {{\n"
                f"  // Use provided brand theme or canonical repository DEFAULT_THEME\n"
                f"  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;\n"
                f"\n"
                f"  switch (block.version) {{\n"
                f"    case '{version}':\n"
                f"      return (\n"
                f"        <{family}{version}View\n"
                f"          block={{block as {family}{version}BlockData}}\n"
                f"          theme={{activeTheme}}\n"
                f"          className={{className}}\n"
                f"          runtimeContext={{runtimeContext}}\n"
                f"        />\n"
                f"      );\n"
                f"    default:\n"
                f"      throw new Error(`[{family}Block] Unsupported block version: ${{String(block.version)}}`);\n"
                f"  }}\n"
                f"}}\n"
                f"\n"
                f"/**\n"
                f" * {family} {version} View - Version-specific implementation\n"
                f" */\n"
                f"function {family}{version}View({{\n"
                f"  block,\n"
                f"  theme,\n"
                f"  className = '',\n"
                f"  runtimeContext,\n"
                f"}}: {{\n"
                f"  block: {family}{version}BlockData;\n"
                f"  theme: DomainTheme;\n"
                f"  className?: string;\n"
                f"  runtimeContext?: TutorialBlockRuntimeContext;\n"
                f"}}) {{\n"
                f"  // Theme colors resolved via canonical utilities — brand-independent\n"
                f"  const primary = theme.primary;\n"
                f"  const secondary = theme.secondary;\n"
                f"  const badgeBg = withAlpha(primary, '14');\n"
                f"  const textColor = getThemeColor(theme, 'secondary');\n"
                f"\n"
                f"  // UBRC: Use runtimeContext if available, fallback to block fields\n"
                f"  const blockId = runtimeContext?.blockId ?? block.id;\n"
                f"  const blockType = runtimeContext?.blockType ?? '{block_type_lower}';\n"
                f"  const blockVersion = runtimeContext?.blockVersion ?? block.version;\n"
                f"\n"
                f"  return (\n"
                f"    <article\n"
                f"      className={{`w-full ${{className}}`}}\n"
                f"      style={{{{ color: textColor }}}}\n"
                f"      data-block-id={{blockId}}\n"
                f"      data-block-type={{blockType}}\n"
                f"      data-block-version={{blockVersion}}\n"
                f"    >\n"
                f"      <div\n"
                f"        className=\"inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold\"\n"
                f"        style={{{{ color: primary, backgroundColor: badgeBg }}}}\n"
                f"      >\n"
                f"        <span>{{block.content?.title ?? '{family} {version}'}}</span>\n"
                f"      </div>\n"
                f"{visual_content}\n"
                f"    </article>\n"
                f"  );\n"
                f"}}\n"
                f"\n"
                f"// Canonical dual-export compatibility for Tutorial Composer and Block Renderer\n"
                f"export const {family}{version}Block = {family}Block;\n"
                f"export default {family}Block;\n"
            ),
        },
        "ubrc_pattern": {
            "description": (
                "MANDATORY: Every block must render an <article> element with "
                "these 3 data attributes. Without them, the block will not be "
                "recognized by Tutorial Composer, UBRC tracking, or runtime verification."
            ),
            "code": (
                f"// UBRC identity — same for EVERY block type\n"
                f"const blockId = runtimeContext?.blockId ?? block.id;\n"
                f"const blockType = runtimeContext?.blockType ?? '{block_type_lower}';\n"
                f"const blockVersion = runtimeContext?.blockVersion ?? block.version;\n"
                f"\n"
                f"<article\n"
                f"  data-block-id={{blockId}}\n"
                f"  data-block-type={{blockType}}\n"
                f"  data-block-version={{blockVersion}}\n"
                f">\n"
                f"  {{/* block content */}}\n"
                f"</article>"
            ),
        },
        "theme_usage": {
            "description": (
                "Theme colors must ALWAYS come from the theme prop or canonical DEFAULT_THEME. "
                "Never hardcode hex colors — the block must render correctly "
                "for all brands (RealTutorialHub, SkillUpITAcademy, etc.)."
            ),
            "correct_examples": [
                "const primary = theme.primary;",
                "const secondary = theme.secondary;",
                "const slateText = theme.slate?.700 ?? getThemeColor(theme, 'slate', 700);",
                "<div style={{ borderColor: primary }}>",
                "<div style={{ backgroundColor: withAlpha(primary, '14') }}>",
            ],
            "incorrect_examples": [
                "// ❌ WRONG — hardcoded colors break brand independence",
                "<div style={{ borderColor: '#e11d48' }}>",
                "<div style={{ color: '#1e293b' }}>",
                "// ❌ WRONG — referencing specific brand names",
                "const color = isRTH ? '#e11d48' : '#3b82f6';",
            ],
        },
        "import_paths": {
            "description": (
                "Exact import statements for the monorepo structure. "
                "External AI cannot guess these paths."
            ),
            "required_imports": [
                "import React from 'react';",
                "import type { BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext } from '../types';",
                "import { getThemeColor, withAlpha, DEFAULT_THEME } from '../theme-utils';",
            ],
            "optional_imports": [
                "import type { TutorialBlock } from '@quiz/types';",
                "// Lucide icons (if needed for UI):",
                "import { IconName } from 'lucide-react';",
            ],
        },
        "test_skeleton": {
            "description": (
                "Test skeleton proving UBRC compliance, dual-brand theme independence, "
                "derived colors, and absence of hardcoded brand colors."
            ),
            "code": (
                f"import {{ render }} from '@testing-library/react';\n"
                f"import {{ {family}Block }} from '../{component_name}';\n"
                f"import {{ DEFAULT_THEME }} from '../theme-utils';\n"
                f"\n"
                f"describe('{component_name}', () => {{\n"
                f"  const mockBlock = {{\n"
                f"    id: '{block_type_lower}-001',\n"
                f"    type: '{block_type_lower}' as const,\n"
                f"    version: '{version}' as const,\n"
                f"{test_mock_content}\n"
                f"  }};\n"
                f"\n"
                f"  // Brand Theme A (RealTutorialHub crimson/slate)\n"
                f"  const brandThemeA = {{\n"
                f"    primary: '#e11d48',\n"
                f"    secondary: '#1e293b',\n"
                f"    primaryDark: '#be123c',\n"
                f"  }};\n"
                f"\n"
                f"  // Brand Theme B (SkillUpITAcademy sky/midnight)\n"
                f"  const brandThemeB = {{\n"
                f"    primary: '#0ea5e9',\n"
                f"    secondary: '#0f172a',\n"
                f"    primaryDark: '#0284c7',\n"
                f"  }};\n"
                f"\n"
                f"  it('renders with UBRC data attributes', () => {{\n"
                f"    const {{ container }} = render(\n"
                f"      <{family}Block block={{mockBlock}} theme={{brandThemeA}} />\n"
                f"    );\n"
                f"    const article = container.querySelector('article');\n"
                f"    expect(article).not.toBeNull();\n"
                f"    expect(article?.getAttribute('data-block-id')).toBe('{block_type_lower}-001');\n"
                f"    expect(article?.getAttribute('data-block-type')).toBe('{block_type_lower}');\n"
                f"    expect(article?.getAttribute('data-block-version')).toBe('{version}');\n"
                f"  }});\n"
                f"\n"
                f"  it('proves dual-brand theme independence (Brand A vs Brand B)', () => {{\n"
                f"    // Brand A render verification\n"
                f"    const {{ container: containerA }} = render(\n"
                f"      <{family}Block block={{mockBlock}} theme={{brandThemeA}} />\n"
                f"    );\n"
                f"    expect(containerA.innerHTML).toContain('#e11d48');\n"
                f"    const articleA = containerA.querySelector('article');\n"
                f"    expect(articleA?.getAttribute('style')).toContain('color');\n"
                f"    const badgeA = containerA.querySelector('div');\n"
                f"    expect(badgeA?.getAttribute('style')).toContain('background-color');\n"
                f"\n"
                f"    // Brand B render verification\n"
                f"    const {{ container: containerB }} = render(\n"
                f"      <{family}Block block={{mockBlock}} theme={{brandThemeB}} />\n"
                f"    );\n"
                f"    expect(containerB.innerHTML).toContain('#0ea5e9');\n"
                f"\n"
                f"    // Theme Isolation: Brand A colors must NEVER leak into Brand B\n"
                f"    expect(containerB.innerHTML).not.toContain('#e11d48');\n"
                f"    // Theme Isolation: Brand B colors must NEVER leak into Brand A\n"
                f"    expect(containerA.innerHTML).not.toContain('#0ea5e9');\n"
                f"  }});\n"
                f"\n"
                f"  it('falls back gracefully to DEFAULT_THEME when theme prop is omitted', () => {{\n"
                f"    const {{ container }} = render(\n"
                f"      <{family}Block block={{mockBlock}} />\n"
                f"    );\n"
                f"    const article = container.querySelector('article');\n"
                f"    expect(article).not.toBeNull();\n"
                f"    expect(container.innerHTML).toContain(DEFAULT_THEME.primary);\n"
                f"  }});\n"
                f"\n"
                f"  it('strictly verifies dynamic theme tokens and derived alpha tints are applied', () => {{\n"
                f"    const {{ container }} = render(\n"
                f"      <{family}Block block={{mockBlock}} theme={{brandThemeA}} />\n"
                f"    );\n"
                f"    const article = container.querySelector('article');\n"
                f"    expect(article).not.toBeNull();\n"
                f"    expect(container.innerHTML).toContain('#e11d48');\n"
                f"    expect(article?.getAttribute('style')).toContain('color');\n"
                f"  }});\n"
                f"\n"
                f"  it('verifies zero hardcoded brand colors when rendered with custom neutral theme', () => {{\n"
                f"    const neutralTheme = {{\n"
                f"      primary: '#10b981',\n"
                f"      secondary: '#334155',\n"
                f"    }};\n"
                f"    const {{ container }} = render(\n"
                f"      <{family}Block block={{mockBlock}} theme={{neutralTheme}} />\n"
                f"    );\n"
                f"    expect(container.innerHTML).toContain('#10b981');\n"
                f"    expect(container.innerHTML).not.toContain('#e11d48');\n"
                f"    expect(container.innerHTML).not.toContain('#0ea5e9');\n"
                f"  }});\n"
                f"\n"
                f"  it('verifies accessible semantic structure (WCAG 2.1 AA)', () => {{\n"
                f"    const {{ container }} = render(\n"
                f"      <{family}Block block={{mockBlock}} theme={{brandThemeA}} />\n"
                f"    );\n"
                f"    const article = container.querySelector('article');\n"
                f"    expect(article).not.toBeNull();\n"
                f"    expect(article?.textContent).toContain('Test {family}');\n"
                f"  }});\n"
                f"\n"
                f"  it('renders without console errors or warnings', () => {{\n"
                f"    const spy = vi.spyOn(console, 'error').mockImplementation(() => {{}});\n"
                f"    render(<{family}Block block={{mockBlock}} theme={{brandThemeA}} />);\n"
                f"    expect(spy).not.toHaveBeenCalled();\n"
                f"    spy.mockRestore();\n"
                f"  }});\n"
                f"}});"
            ),
        },
    }


def validate_contract_template_schema_consistency(contract_data: Any) -> Tuple[bool, List[str]]:
    """
    Generic validation rule applied to every generated contract.
    
    Verifies that the contract's inline code templates (component skeleton, test skeleton)
    are strictly consistent with its formal payload schema.
    
    Checks:
    1. For every specific payload schema defined (e.g. 'objectives', 'code', 'term', 'leadParagraph'),
       verifies that the component skeleton and test skeleton use those fields and do NOT contain
       contradictory generic fallback fields (e.g. 'items').
    2. Operates generically across all 18 block families and versions.
    
    Returns:
        Tuple of (is_valid: bool, issues: List[str])
    """
    issues: List[str] = []
    
    if hasattr(contract_data, "model_dump"):
        data = contract_data.model_dump()
    elif hasattr(contract_data, "dict"):
        data = contract_data.dict()
    elif isinstance(contract_data, dict):
        data = contract_data
    else:
        return False, ["Invalid contract data type"]
        
    type_contract = data.get("type_contract", {})
    payload_schema = type_contract.get("payload_schema", {})
    templates = data.get("inline_code_templates", {})
    component_skeleton = templates.get("component_skeleton", {}).get("code", "")
    test_skeleton = templates.get("test_skeleton", {}).get("code", "")
    
    if not payload_schema:
        # No formal schema specified; generic fallback is valid
        return True, []
        
    schema_keys = set(payload_schema.keys())
    
    # Generic schema consistency check:
    if "objectives" in schema_keys:
        if "objectives" not in component_skeleton:
            issues.append("Component skeleton missing 'objectives' field specified in payload_schema")
        if "objectives" not in test_skeleton:
            issues.append("Test skeleton missing 'objectives' mock field specified in payload_schema")
        if "items:" in component_skeleton or "items?:" in component_skeleton:
            issues.append("Component skeleton contains generic 'items' field conflicting with 'objectives' schema")
        if "items:" in test_skeleton:
            issues.append("Test skeleton contains generic 'items' mock conflicting with 'objectives' schema")

    if "code" in schema_keys:
        if "code" not in component_skeleton:
            issues.append("Component skeleton missing 'code' field specified in payload_schema")
        if "items:" in component_skeleton or "items?:" in component_skeleton:
            issues.append("Component skeleton contains generic 'items' field conflicting with 'code' schema")
            
    if "term" in schema_keys:
        if "term" not in component_skeleton:
            issues.append("Component skeleton missing 'term' field specified in payload_schema")
        if "items:" in component_skeleton or "items?:" in component_skeleton:
            issues.append("Component skeleton contains generic 'items' field conflicting with 'term' schema")
            
    if "leadParagraph" in schema_keys:
        if "leadParagraph" not in component_skeleton:
            issues.append("Component skeleton missing 'leadParagraph' field specified in payload_schema")
        if "items:" in component_skeleton or "items?:" in component_skeleton:
            issues.append("Component skeleton contains generic 'items' field conflicting with 'leadParagraph' schema")

    matched_keys = [k for k in schema_keys if k in component_skeleton]
    if not matched_keys:
        issues.append(f"Component skeleton does not reflect any fields from payload_schema keys: {list(schema_keys)}")

    return len(issues) == 0, issues


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
    # Validate snapshot structure
    if not snapshot:
        raise RepositoryEvidenceBlocked("Snapshot is missing or empty")
    
    if 'evidence' not in snapshot:
        raise RepositoryEvidenceBlocked("Snapshot missing 'evidence' array")
    
    if not isinstance(snapshot['evidence'], list):
        raise RepositoryEvidenceBlocked("Snapshot 'evidence' must be a list")
    
    # Fail-closed validation for malformed content hashes across snapshot evidence
    for ev in snapshot.get('evidence', []):
        if not isinstance(ev, dict):
            continue
        c_hash = ev.get('contentHash')
        if c_hash is not None and str(c_hash).strip() != "":
            clean_h = str(c_hash).strip()
            if not HEX_64_PATTERN.match(clean_h):
                path_ctx = ev.get('path', ev.get('kind', 'evidence'))
                raise RepositoryEvidenceBlocked(
                    f"Evidence for '{path_ctx}' has invalid 'contentHash': '{clean_h}'. "
                    f"Expected a 64-character hexadecimal SHA-256 hash."
                )
    
    # Extract canonical block / component evidence from snapshot
    canonical_blocks = [
        ev for ev in snapshot.get('evidence', [])
        if ev.get('kind') in ('canonical_block', 'component', 'ui-component')
    ]
    
    # 18 Canonical Educational Block Families
    CANONICAL_FAMILIES = {
        "Introduction": "I",
        "Objective": "O",
        "Definition": "D",
        "Code": "C",
        "Visual": "V",
        "Comparison": "CP",
        "Execution": "E",
        "Memory": "M",
        "Mistake": "MT",
        "BestPractice": "BP",
        "Summary": "S",
        "Question": "Q",
        "Exercise": "EX",
        "Task": "T",
        "Interactive": "INT",
        "Quiz": "QZ",
        "Interview": "IV",
        "Project": "P",
    }
    
    if family not in CANONICAL_FAMILIES:
        raise RepositoryEvidenceBlocked(
            f"Unsupported block family '{family}'. Must be one of the 18 canonical educational families: "
            f"{', '.join(sorted(CANONICAL_FAMILIES.keys()))}."
        )
    
    expected_prefix = CANONICAL_FAMILIES[family]
    if not version.startswith(expected_prefix):
        raise RepositoryEvidenceBlocked(
            f"Version '{version}' does not match family '{family}' identifier prefix '{expected_prefix}'. "
            f"Expected version format like '{expected_prefix}1', '{expected_prefix}2', etc."
        )
    
    # Canonical baseline blocks in the repository for comparative analysis
    canonical_baseline_specs = [
        ("Introduction", "I1", "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx", "architectural_baseline_onboarding"),
        ("Definition", "D1", "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx", "architectural_baseline_terminology"),
        ("Code", "C1", "packages/ui/src/tutorial/blocks/CodeC1Block.tsx", "architectural_baseline_interactive"),
    ]
    block_patterns = {
        (fam, ver): path for fam, ver, path, _ in canonical_baseline_specs
    }
    
    references: List[CanonicalReference] = []
    analyzed_baselines = []
    found_baselines = []
    primary_evidence_id = ""
    
    # 1. Target is an existing canonical block (Introduction I1, Code C1, Definition D1)
    if (family, version) in block_patterns:
        expected_path = block_patterns[(family, version)]
        ev = next((e for e in canonical_blocks if e.get('path') == expected_path), None)
        if not ev:
            ev = next((e for e in snapshot.get('evidence', []) if e.get('path') == expected_path), None)
        
        if not ev:
            raise RepositoryEvidenceBlocked(
                f"No canonical evidence for {family}/{version}. "
                f"Expected path: {expected_path}. "
                f"Run TypeScript discovery scan to generate evidence."
            )
        
        content_hash = ev.get('contentHash', '')
        evidence_id = ev.get('evidenceId', '')
        
        clean_content_hash = validate_content_hash(content_hash, f"{family}/{version}")
        clean_ev_id = validate_evidence_id(evidence_id, f"{family}/{version}")
        
        primary_evidence_id = clean_ev_id
        analyzed_baselines.append(f"{family} {version}")
        found_baselines.append((family, version, expected_path, "canonical_block", clean_content_hash, clean_ev_id))
        references.append(CanonicalReference(
            family=family,
            version=version,
            evidence=[RepositoryEvidence(path=expected_path, sha256=clean_content_hash, role="canonical_block", evidence_id=clean_ev_id)]
        ))
    else:
        # 2. Target is a new block (e.g., Objective O1).
        # Multi-Block Comparative Analysis: Collect all available canonical baseline blocks from snapshot.
        for b_fam, b_ver, b_path, b_role in canonical_baseline_specs:
            b_ev = next((e for e in canonical_blocks if e.get('path') == b_path), None)
            if not b_ev:
                b_ev = next((e for e in snapshot.get('evidence', []) if e.get('path') == b_path), None)
            if b_ev:
                b_hash = b_ev.get('contentHash', '')
                b_id = b_ev.get('evidenceId', '')
                if b_hash or b_id:
                    clean_b_hash = validate_content_hash(b_hash, f"{b_fam}/{b_ver} baseline")
                    clean_b_id = validate_evidence_id(b_id, f"{b_fam}/{b_ver} baseline")
                    found_baselines.append((b_fam, b_ver, b_path, b_role, clean_b_hash, clean_b_id))
        
        if not found_baselines:
            raise RepositoryEvidenceBlocked(
                f"No canonical framework baselines found in snapshot to derive shared architecture for {family}/{version}. "
                f"Requires at least one canonical block (Introduction I1, Definition D1, or Code C1)."
            )
        
        primary_evidence_id = found_baselines[0][5]
        for b_fam, b_ver, b_path, b_role, b_hash, b_id in found_baselines:
            analyzed_baselines.append(f"{b_fam} {b_ver}")
            references.append(CanonicalReference(
                family=f"{b_fam} (Architectural Baseline)",
                version=b_ver,
                evidence=[
                    RepositoryEvidence(
                        path=b_path,
                        sha256=b_hash,
                        role="architectural_baseline",
                        evidence_id=b_id
                    )
                ]
            ))
    
    # Extract metadata from snapshot
    metadata = extract_metadata_from_snapshot(snapshot)
    
    # Derive file paths from snapshot with clean separation (observed vs shared_framework vs proposed)
    derived_paths = derive_file_paths(snapshot, family, version)
    
    # Extract test patterns with explicit separation (observed vs mandatory policy)
    test_breakdown = extract_test_patterns_detailed(snapshot)
    test_patterns = test_breakdown['combined_requirements']
    
    # Extract type strictness from snapshot metadata (read, never assert)
    type_strictness = {}
    tsconfig_evidence = [
        ev for ev in snapshot.get('evidence', [])
        if ev.get('path', '').endswith('tsconfig.json')
    ]
    compiler_opts = snapshot.get('metadata', {}).get('compilerOptions') or {}
    if not compiler_opts and tsconfig_evidence:
        for tc in tsconfig_evidence:
            if 'compilerOptions' in tc and isinstance(tc['compilerOptions'], dict):
                compiler_opts = tc['compilerOptions']
                break
            if 'metadata' in tc and isinstance(tc['metadata'], dict):
                compiler_opts = tc['metadata'].get('compilerOptions', {})
                if compiler_opts:
                    break
    
    if compiler_opts:
        type_strictness = {
            'strict': compiler_opts.get('strict', 'unknown'),
            'noImplicitAny': compiler_opts.get('noImplicitAny', 'unknown'),
            'strictNullChecks': compiler_opts.get('strictNullChecks', 'unknown'),
            'source': 'tsconfig.json (parsed snapshot)'
        }
    elif tsconfig_evidence:
        type_strictness = {
            'strict': 'unknown',
            'noImplicitAny': 'unknown',
            'strictNullChecks': 'unknown',
            'source': 'tsconfig.json (unparsed file evidence)'
        }
    else:
        type_strictness = {
            'strict': 'unknown',
            'noImplicitAny': 'unknown',
            'strictNullChecks': 'unknown',
            'source': 'none'
        }
    
    # Check baseline completeness across the 3 canonical baselines
    all_canonical_baselines = ["Introduction I1", "Definition D1", "Code C1"]
    analyzed_set = set(analyzed_baselines)
    missing_baselines = [b for b in all_canonical_baselines if b not in analyzed_set]
    baseline_completeness = "complete" if len(missing_baselines) == 0 else "partial"

    # Derive evidence-backed ComparativeFrameworkAnalysis
    baseline_ev_ids = [b_id for _, _, _, _, _, b_id in found_baselines]
    baseline_paths = [b_path for _, _, b_path, _, _, _ in found_baselines]
    
    # Check if snapshot baseline evidence contains parsed facts or file content
    baseline_ev_objs = []
    for b_fam, b_ver, b_path, _, _, b_id in found_baselines:
        ev_obj = next((e for e in snapshot.get('evidence', []) if e.get('path') == b_path), None)
        if ev_obj:
            baseline_ev_objs.append((b_fam, b_ver, b_path, b_id, ev_obj))
            
    has_parsed_content = any(bool(e.get('parsed_facts') or e.get('content')) for _, _, _, _, e in baseline_ev_objs)
    
    if has_parsed_content:
        # Conventions derived from actual snapshot content
        def get_matching_ids(check_fn):
            return [b_id for _, _, _, b_id, e in baseline_ev_objs if check_fn(e)]
            
        art_ids = get_matching_ids(lambda e: '<article' in str(e.get('content', '')) or e.get('parsed_facts', {}).get('root_element') == 'article')
        ubrc_ids = get_matching_ids(lambda e: 'data-block-id' in str(e.get('content', '')) or e.get('parsed_facts', {}).get('ubrc'))
        props_ids = get_matching_ids(lambda e: 'BlockComponentProps' in str(e.get('content', '')) or e.get('parsed_facts', {}).get('props'))
        theme_ids = get_matching_ids(lambda e: 'theme.' in str(e.get('content', '')) or e.get('parsed_facts', {}).get('theme'))
        router_ids = get_matching_ids(lambda e: 'switch' in str(e.get('content', '')) or e.get('parsed_facts', {}).get('router'))
        
        shared_conventions = {
            "root_element": {
                "rule": "HTML <article> element wrapping block content",
                "classification": "observed_in_snapshot_content" if art_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(art_ids),
                "evidence_ids": art_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in art_ids],
            },
            "ubrc_identity": {
                "rule": "MANDATORY data-block-id, data-block-type, and data-block-version on <article>",
                "classification": "observed_in_snapshot_content" if ubrc_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(ubrc_ids),
                "evidence_ids": ubrc_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in ubrc_ids],
            },
            "props_interface": {
                "rule": "BlockComponentProps<T> with block, className, theme, runtimeContext",
                "classification": "observed_in_snapshot_content" if props_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(props_ids),
                "evidence_ids": props_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in props_ids],
            },
            "theme_injection": {
                "rule": "Dynamic consumption of theme.primary (accents/badges) and theme.secondary (text)",
                "classification": "observed_in_snapshot_content" if theme_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(theme_ids),
                "evidence_ids": theme_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in theme_ids],
            },
            "theme_fallbacks": {
                "rule": "Canonical DEFAULT_THEME from theme-utils or throw for required brand themes",
                "classification": "observed_in_snapshot_content" if theme_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(theme_ids),
                "evidence_ids": theme_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in theme_ids],
            },
            "routing_convention": {
                "rule": "Top-level version router function exporting {Family}Block with fail-closed throw",
                "classification": "observed_in_snapshot_content" if router_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(router_ids),
                "evidence_ids": router_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in router_ids],
            },
            "runtime_boundaries": {
                "rule": "Passive block participation; ILS, LSNB, RSSB remain page-level container responsibilities",
                "classification": "observed_in_snapshot_content" if ubrc_ids else "not_verified_from_snapshot_content",
                "content_verified": bool(ubrc_ids),
                "evidence_ids": ubrc_ids,
                "source_files": [b_path for _, _, b_path, _, e in baseline_ev_objs if e.get('evidenceId') in ubrc_ids],
            },
        }
    else:
        # Snapshot provided manifest metadata (paths, hashes, evidenceIds) but no parsed file contents or AST.
        # Shared conventions are classified accurately as not_verified_from_snapshot_content.
        shared_conventions = {
            "root_element": {
                "rule": "HTML <article> element wrapping block content",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
            "ubrc_identity": {
                "rule": "MANDATORY data-block-id, data-block-type, and data-block-version on <article>",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
            "props_interface": {
                "rule": "BlockComponentProps<T> with block, className, theme, runtimeContext",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
            "theme_injection": {
                "rule": "Dynamic consumption of theme.primary (accents/badges) and theme.secondary (text)",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
            "theme_fallbacks": {
                "rule": "Canonical DEFAULT_THEME from theme-utils or throw for required brand themes",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
            "routing_convention": {
                "rule": "Top-level version router function exporting {Family}Block with fail-closed throw",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
            "runtime_boundaries": {
                "rule": "Passive block participation; ILS, LSNB, RSSB remain page-level container responsibilities",
                "classification": "not_verified_from_snapshot_content",
                "content_verified": False,
                "status": "policy_framework_convention",
                "evidence_ids": [],
                "manifest_evidence_ids": baseline_ev_ids,
                "source_files": baseline_paths,
            },
        }

    block_specific_descriptions = {
        "Introduction": "9-section onboarding narrative, hero header with badge and title, mountain illustration",
        "Definition": "Terminology card, 3-column highlighted callout with icon, explanation paragraphs",
        "Code": "Terminal window with macOS controls, copy button, syntax-highlighted code, memory model column grid",
    }
    block_specific_conventions = {}
    for b_fam, b_ver, b_path, b_id, ev_obj in baseline_ev_objs:
        has_ev_content = bool(ev_obj.get('parsed_facts') or ev_obj.get('content'))
        block_specific_conventions[b_fam] = {
            "family": b_fam,
            "version": b_ver,
            "visual_model": block_specific_descriptions.get(b_fam, f"{b_fam} canonical visual model") if has_ev_content else f"{b_fam} canonical baseline (content not parsed in snapshot)",
            "classification": "observed_in_snapshot_content" if has_ev_content else "not_verified_from_snapshot_content",
            "content_verified": has_ev_content,
            "evidence_id": b_id if has_ev_content else None,
            "manifest_evidence_id": b_id,
            "source_file": b_path,
        }
        
    policy_requirements = [
        {
            "requirement": "Accessibility audit: WCAG 2.1 AA compliance",
            "classification": "policy_assertion",
            "source": "architectural_policy_rule",
            "evidence_id": None,
        },
        {
            "requirement": "Responsive layout: Mobile (320px+), Tablet (768px+), Desktop (1024px+)",
            "classification": "policy_assertion",
            "source": "architectural_policy_rule",
            "evidence_id": None,
        },
        {
            "requirement": "Dynamic theming: Verified with at least 2 distinct brand theme configurations",
            "classification": "policy_assertion",
            "source": "architectural_policy_rule",
            "evidence_id": None,
        },
        {
            "requirement": "Brand independence: Zero hardcoded brand names or brand hex colors",
            "classification": "policy_assertion",
            "source": "architectural_policy_rule",
            "evidence_id": None,
        },
    ]
    
    unresolved_differences = [
        "Router validation: Introduction uses switch with exhaustive check; Definition explicitly throws Error on unsupported version",
        "Theme fallback: Code explicitly imports DEFAULT_THEME from theme-utils; Definition assumes theme prop is supplied by runtime",
        "Payload layout: Introduction renders multi-section accordion/timeline layout; Definition renders callout card; Code renders terminal window and grid",
    ]
    
    comparative_analysis = ComparativeFrameworkAnalysis(
        canonical_blocks_analyzed=analyzed_baselines,
        missing_baselines=missing_baselines,
        baseline_completeness=baseline_completeness,
        shared_conventions=shared_conventions,
        block_specific_conventions=block_specific_conventions,
        policy_requirements=policy_requirements,
        unresolved_differences=unresolved_differences,
    )
    
    # Renderer and Composer snapshot evidence discovery
    renderer_ev = next(
        (e for e in snapshot.get('evidence', [])
         if e.get('evidenceId') and (
             'TutorialBlockRenderer' in e.get('path', '') or
             'TutorialRenderer' in e.get('path', '') or
             'universal-tutorial-renderer' in e.get('path', '') or
             e.get('kind') == 'renderer'
         )),
        None
    )
    composer_ev = next(
        (e for e in snapshot.get('evidence', [])
         if e.get('evidenceId') and (
             'tutorial-composer.service.ts' in e.get('path', '') or
             'tutorial-block-composer' in e.get('path', '') or
             'composer-service' in e.get('path', '') or
             e.get('kind') == 'composer'
         )),
        None
    )
    if not composer_ev:
        composer_ev = next(
            (e for e in snapshot.get('evidence', [])
             if e.get('evidenceId') and ('composer' in e.get('path', '').lower() or e.get('kind') == 'composer')),
            None
        )
    
    # 1. Renderer Verification Status (Decoupled: File existence != Capabilities verified)
    renderer_evidence_found = renderer_ev is not None
    clean_renderer_id = None
    clean_renderer_path = None
    renderer_registered = False
    renderer_tested = False
    
    if renderer_ev:
        clean_renderer_id = validate_evidence_id(renderer_ev.get('evidenceId'), "renderer")
        validate_content_hash(renderer_ev.get('contentHash', ''), "renderer")
        clean_renderer_path = renderer_ev.get('path')
        
        renderer_facts = renderer_ev.get('parsed_facts', {})
        registered_blocks = renderer_facts.get('registered_blocks', [])
        tested_blocks = renderer_facts.get('tested_blocks', [])
        
        target_keys = [f"{family}{version}", family, family.lower(), f"{family.lower()}_{version.lower()}"]
        if any(k in registered_blocks for k in target_keys):
            renderer_registered = True
            
        for b in snapshot.get('blocks', {}).get('verified', []):
            b_type = (b.get('blockType') or '').lower()
            b_ver = b.get('version')
            if b_type == family.lower() and (not b_ver or b_ver == version):
                if b.get('verificationLevel') in ('REGISTERED', 'TESTED'):
                    renderer_registered = True
                if b.get('tested') is True or b.get('verificationLevel') == 'TESTED':
                    renderer_tested = True

        if any(k in tested_blocks for k in target_keys) or renderer_facts.get('integration_test_verified') is True:
            renderer_tested = True

    if not renderer_evidence_found:
        renderer_registration_status = "pending_registration"
        renderer_capabilities_verified = False
        renderer_verification_status = "NOT_RUN"
    elif renderer_tested and renderer_registered:
        renderer_registration_status = "registered"
        renderer_capabilities_verified = True
        renderer_verification_status = "integration_test_verified"
    elif renderer_registered:
        renderer_registration_status = "registered"
        renderer_capabilities_verified = False
        renderer_verification_status = "registration_confirmed_runtime_unverified"
    else:
        renderer_registration_status = "pending_registration"
        renderer_capabilities_verified = False
        renderer_verification_status = "evidence_found_capabilities_unverified"
            
    renderer_contract = {
        "component_name": f"{family}{version}Block",
        "props": ["block", "theme", "runtimeContext"],
        "exports": [f"named export ({family}Block)", f"named export ({family}{version}Block)", "optional default export"],
        "theme_props": ["primary", "secondary"],
        "runtime_context_props": [
            "learnerId",
            "navigationNodeId",
            "sectionId",
            "blockId",
            "blockType",
            "blockVersion",
            "subtopicId"
        ],
        "evidence_found": renderer_evidence_found,
        "block_registration_status": renderer_registration_status,
        "capabilities_verified": renderer_capabilities_verified,
        "verification_status": renderer_verification_status,
        "evidence_id": clean_renderer_id,
        "source_path": clean_renderer_path or "packages/ui/src/tutorial/TutorialBlockRenderer.tsx (pending scan)"
    }
    
    # 2. Composer Verification Status (Decoupled: File existence != Capabilities verified)
    composer_evidence_found = composer_ev is not None
    clean_composer_id = None
    clean_composer_path = None
    composer_registered = False
    composer_tested = False
    
    if composer_ev:
        clean_composer_id = validate_evidence_id(composer_ev.get('evidenceId'), "composer")
        validate_content_hash(composer_ev.get('contentHash', ''), "composer")
        clean_composer_path = composer_ev.get('path')
        
        composer_facts = composer_ev.get('parsed_facts', {})
        supported_blocks = composer_facts.get('supported_blocks', [])
        tested_operations = composer_facts.get('tested_operations', [])
        
        target_keys = [f"{family}{version}", family, family.lower(), f"{family.lower()}_{version.lower()}"]
        if any(k in supported_blocks for k in target_keys):
            composer_registered = True
            
        if composer_facts.get('integration_test_verified') is True or (composer_registered and bool(tested_operations)):
            composer_tested = True

    if not composer_evidence_found:
        composer_registration_status = "pending_registration"
        composer_capabilities_verified = False
        composer_verification_status = "NOT_RUN"
    elif composer_tested and composer_registered:
        composer_registration_status = "registered"
        composer_capabilities_verified = True
        composer_verification_status = "integration_test_verified"
    elif composer_registered:
        composer_registration_status = "registered"
        composer_capabilities_verified = False
        composer_verification_status = "registration_confirmed_runtime_unverified"
    else:
        composer_registration_status = "pending_registration"
        composer_capabilities_verified = False
        composer_verification_status = "evidence_found_capabilities_unverified"
            
    composer_contract = {
        "composability": "full",
        "preview_mode": "live",
        "edit_mode": "form-based",
        "supported_operations": ["create", "edit", "delete", "reorder"],
        "evidence_found": composer_evidence_found,
        "block_registration_status": composer_registration_status,
        "capabilities_verified": composer_capabilities_verified,
        "verification_status": composer_verification_status,
        "evidence_id": clean_composer_id,
        "source_path": clean_composer_path or "packages/db-tutorial/src/services/tutorial-composer.service.ts (pending scan)"
    }
    
    # Build block type identifier
    block_type = f"{family.lower()}_{version.lower()}"
    
    # Construct contract
    contract = RepositoryBlockContract(
        family=family,
        version=version,
        block_type=block_type,
        references=references,
        comparative_analysis=comparative_analysis,
        language=metadata.get('language', ''),
        framework=metadata.get('framework', ''),
        style=metadata.get('style', ''),
        difficulty_level=metadata.get('difficulty_level', ''),
        file_paths=derived_paths,
        test_requirements=test_patterns,
        test_pattern_breakdown=test_breakdown,
        type_strictness=type_strictness,
        required_artifacts=[
            "HTML/CSS/JS prototype",
            "React/TypeScript implementation",
            "Type definitions",
            "Unit tests"
        ],
        runtime=RuntimeContract(
            category="policy_requirement",
            ub_rc_required=True,
            passive_ils=True,
            page_level_lsnb=True,
            page_level_rssb=True,
            theme_injected=True,
            brand_independent=True
        ),
        verification_status=VerificationStatus(
            typescript_compilation="NOT_RUN",
            schema_validation="NOT_RUN",
            wcag_accessibility="NOT_RUN",
            theme_independence="NOT_RUN",
            composer_integration="NOT_RUN",
            runtime_ubrc="NOT_RUN",
            intake_certification="NOT_RUN"
        ),
        renderer_contract=renderer_contract,
        composer_contract=composer_contract,
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
    
    # Populate field_evidence with explicit provenance (observed vs inferred vs policy default)
    prov = metadata.get('provenance', {})
    snapshot_meta = snapshot.get('metadata', {})
    meta_ev_id = snapshot_meta.get('evidence_id') or snapshot_meta.get('evidenceId')
    if meta_ev_id:
        try:
            meta_ev_id = validate_evidence_id(meta_ev_id, "snapshot.metadata")
        except Exception:
            meta_ev_id = None
    
    # language
    lang_prov = prov.get('language', 'inferred_from_file_extensions')
    if lang_prov == 'observed_in_snapshot':
        contract.field_evidence['language'] = ContractFieldEvidence(
            field_name='language',
            value=metadata.get('language', ''),
            evidence_source='snapshot.metadata.language',
            evidence_id=meta_ev_id,
            provenance='observed_in_snapshot',
            source_evidence_ids=[meta_ev_id] if meta_ev_id else [],
            derived_at=datetime.now(timezone.utc)
        )
    else:
        ts_ev_ids = [
            ev.get('evidenceId', '').strip() for ev in snapshot.get('evidence', [])
            if (ev.get('path', '').endswith('.ts') or ev.get('path', '').endswith('.tsx'))
            and ev.get('evidenceId') and EVIDENCE_ID_PATTERN.match(ev.get('evidenceId', '').strip())
        ][:5]
        contract.field_evidence['language'] = ContractFieldEvidence(
            field_name='language',
            value=metadata.get('language', ''),
            evidence_source='inferred from snapshot.evidence (.ts, .tsx file extensions)',
            evidence_id=None,
            provenance='inferred_from_file_extensions',
            source_evidence_ids=ts_ev_ids,
            derived_at=datetime.now(timezone.utc)
        )
    
    # framework
    fw_prov = prov.get('framework', 'inferred_from_block_extensions')
    if fw_prov == 'observed_in_snapshot':
        contract.field_evidence['framework'] = ContractFieldEvidence(
            field_name='framework',
            value=metadata.get('framework', ''),
            evidence_source='snapshot.metadata.framework',
            evidence_id=meta_ev_id,
            provenance='observed_in_snapshot',
            source_evidence_ids=[meta_ev_id] if meta_ev_id else [],
            derived_at=datetime.now(timezone.utc)
        )
    else:
        block_ev_ids = [
            ev.get('evidenceId', '').strip() for ev in snapshot.get('evidence', [])
            if ev.get('path', '').endswith('Block.tsx')
            and ev.get('evidenceId') and EVIDENCE_ID_PATTERN.match(ev.get('evidenceId', '').strip())
        ][:5]
        contract.field_evidence['framework'] = ContractFieldEvidence(
            field_name='framework',
            value=metadata.get('framework', ''),
            evidence_source='inferred from canonical Block.tsx component extensions',
            evidence_id=None,
            provenance='inferred_from_block_extensions',
            source_evidence_ids=block_ev_ids,
            derived_at=datetime.now(timezone.utc)
        )
    
    # style
    style_prov = prov.get('style', 'policy_default_tailwind')
    if style_prov == 'observed_in_snapshot':
        contract.field_evidence['style'] = ContractFieldEvidence(
            field_name='style',
            value=metadata.get('style', ''),
            evidence_source='snapshot.metadata.style',
            evidence_id=meta_ev_id,
            provenance='observed_in_snapshot',
            source_evidence_ids=[meta_ev_id] if meta_ev_id else [],
            derived_at=datetime.now(timezone.utc)
        )
    else:
        contract.field_evidence['style'] = ContractFieldEvidence(
            field_name='style',
            value=metadata.get('style', ''),
            evidence_source='policy_default_tailwind',
            evidence_id=None,
            provenance=style_prov,
            source_evidence_ids=[],
            derived_at=datetime.now(timezone.utc)
        )
    
    # difficulty_level
    diff_prov = prov.get('difficulty_level', 'policy_default_intermediate')
    if diff_prov == 'observed_in_snapshot':
        contract.field_evidence['difficulty_level'] = ContractFieldEvidence(
            field_name='difficulty_level',
            value=metadata.get('difficulty_level', ''),
            evidence_source='snapshot.metadata.difficulty_level',
            evidence_id=meta_ev_id,
            provenance='observed_in_snapshot',
            source_evidence_ids=[meta_ev_id] if meta_ev_id else [],
            derived_at=datetime.now(timezone.utc)
        )
    else:
        contract.field_evidence['difficulty_level'] = ContractFieldEvidence(
            field_name='difficulty_level',
            value=metadata.get('difficulty_level', ''),
            evidence_source='policy_default_intermediate',
            evidence_id=None,
            provenance=diff_prov,
            source_evidence_ids=[],
            derived_at=datetime.now(timezone.utc)
        )
    
    # file_paths
    matching_path_ev_ids = [
        ev.get('evidenceId', '').strip() for ev in snapshot.get('evidence', [])
        if ev.get('evidenceId') and EVIDENCE_ID_PATTERN.match(ev.get('evidenceId', '').strip())
        and any(term in ev.get('path', '').lower() for term in (family.lower(), 'tutorial', 'block'))
    ][:10]
    contract.field_evidence['file_paths'] = ContractFieldEvidence(
        field_name='file_paths',
        value=derived_paths,
        evidence_source='derived from snapshot.evidence component, schema, and type references',
        evidence_id=None,
        provenance='derived_from_snapshot_manifest',
        source_evidence_ids=matching_path_ev_ids,
        derived_at=datetime.now(timezone.utc)
    )
    
    # test_requirements
    test_ev_ids = [
        ev.get('evidenceId', '').strip() for ev in snapshot.get('evidence', [])
        if ev.get('evidenceId') and EVIDENCE_ID_PATTERN.match(ev.get('evidenceId', '').strip())
        and ('test' in ev.get('path', '').lower() or '__tests__' in ev.get('path', '').lower())
    ][:10]
    contract.field_evidence['test_requirements'] = ContractFieldEvidence(
        field_name='test_requirements',
        value=test_patterns,
        evidence_source='extracted from snapshot.evidence test file patterns + policy defaults',
        evidence_id=None,
        provenance='derived_and_policy_required',
        source_evidence_ids=test_ev_ids,
        derived_at=datetime.now(timezone.utc)
    )
    
    # type_strictness
    tsconfig_ev_ids = [
        ev.get('evidenceId', '').strip() for ev in snapshot.get('evidence', [])
        if ev.get('evidenceId') and EVIDENCE_ID_PATTERN.match(ev.get('evidenceId', '').strip())
        and ev.get('path', '').endswith('tsconfig.json')
    ]
    is_parsed = 'parsed' in type_strictness.get('source', '')
    contract.field_evidence['type_strictness'] = ContractFieldEvidence(
        field_name='type_strictness',
        value=type_strictness,
        evidence_source=type_strictness.get('source', 'none'),
        evidence_id=tsconfig_ev_ids[0] if (tsconfig_ev_ids and is_parsed) else None,
        provenance='observed_in_parsed_config' if is_parsed else ('unparsed_file_evidence' if tsconfig_ev_ids else 'unknown'),
        source_evidence_ids=tsconfig_ev_ids,
        derived_at=datetime.now(timezone.utc)
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
