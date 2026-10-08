"""
Repository Intelligence Service - M2.9 Wave 1B

Extracts canonical block contracts from repository evidence by scanning
UI block TSX files and analyzing their UBRC attributes, theme usage,
and runtime patterns.

This service discovers Introduction (I1), Code (C1), and Definition (D1)
blocks and builds engineering contracts for external AI consumption.
"""

import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Repository root - configurable via environment or derived from module location
_REPO_ROOT = os.environ.get('QUIZ_PLATFORM_ROOT') or Path(__file__).resolve().parents[4]


@dataclass
class CanonicalReference:
    """
    Reference to a canonical block version in the repository.
    
    Note: The 'schema' field is reserved for future use. Currently returns
    an empty dict as schema extraction (parsing TypeScript interfaces or
    JSON schema files) is not yet implemented.
    """
    family: str
    version: str
    source_files: list[str] = field(default_factory=list)
    schema: dict = field(default_factory=dict)  # Reserved for future schema extraction
    renderer: Optional[str] = None
    registry: Optional[str] = None


@dataclass
class RuntimeContract:
    """
    Runtime requirements extracted from block implementation.
    
    RSSB 'page_level' is detected by checking for runtimeContext prop usage,
    which indicates the block receives page-level state injection.
    """
    ubrc: dict = field(default_factory=dict)
    ils: dict = field(default_factory=dict)
    lsnb: dict = field(default_factory=dict)
    rssb: dict = field(default_factory=dict)
    theme: dict = field(default_factory=dict)
    brand: dict = field(default_factory=dict)


@dataclass
class RepositoryBlockContract:
    """Complete engineering contract for a canonical block."""
    target: str
    canonical_refs: list[CanonicalReference] = field(default_factory=list)
    runtime: RuntimeContract = field(default_factory=RuntimeContract)
    acceptance_criteria: list[str] = field(default_factory=list)


def _remove_comments(content: str) -> str:
    """
    Remove JavaScript/TypeScript comments from source content.
    
    This prevents pattern matching from detecting attributes in comments.
    Simple implementation handles // and /* */ style comments.
    """
    # Remove single-line comments
    content = re.sub(r'//.*?$', '', content, flags=re.MULTILINE)
    # Remove multi-line comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    return content


def discover_canonical_blocks(family: str, repo_root: Optional[Path] = None) -> list[CanonicalReference]:
    """
    Discover canonical blocks for a given family by scanning UI blocks directory.
    
    Scans packages/ui/src/tutorial/blocks/ for TSX files matching the family name.
    Dynamically discovers block files by scanning the directory for *Block.tsx files.
    
    Args:
        family: Block family name (e.g., 'introduction', 'code-c1', 'definition')
        repo_root: Repository root path (defaults to _REPO_ROOT module constant)
        
    Returns:
        List of CanonicalReference objects with extracted metadata
    """
    if repo_root is None:
        repo_root = Path(_REPO_ROOT)
    
    blocks_dir = repo_root / "packages/ui/src/tutorial/blocks"
    
    if not blocks_dir.exists():
        logger.warning(f"Blocks directory not found: {blocks_dir}")
        return []
    
    # Dynamically build family patterns by scanning the directory
    family_patterns = {}
    for tsx_file in blocks_dir.glob("*Block.tsx"):
        filename = tsx_file.name
        # Derive family name from filename
        # IntroductionBlock.tsx → introduction
        # CodeC1Block.tsx → code-c1
        # DefinitionBlock.tsx → definition
        base_name = filename.replace('Block.tsx', '')
        
        # Convert CamelCase to kebab-case
        # Insert hyphen before uppercase letters that follow lowercase
        kebab_name = re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', base_name).lower()
        
        family_patterns[kebab_name] = filename
        
        # Also support variations (e.g., 'code' for 'code-c1')
        if kebab_name.startswith('code-'):
            family_patterns['code'] = filename
    
    pattern = family_patterns.get(family.lower())
    if not pattern:
        logger.debug(f"No block file found for family: {family}")
        return []
    
    target_file = blocks_dir / pattern
    if not target_file.exists():
        logger.warning(f"Block file not found: {target_file}")
        return []
    
    # Read the file and extract metadata
    try:
        content = target_file.read_text(encoding='utf-8')
    except Exception as e:
        logger.error(f"Failed to read {target_file}: {e}")
        return []
    
    # Remove comments before pattern matching
    content_no_comments = _remove_comments(content)
    
    # Extract version from JSX attributes or switch/case statements
    # Priority 1: Literal JSX attribute (data-block-version="I1")
    version_match = re.search(r'data-block-version\s*=\s*["\']([A-Z]\d+)["\']', content_no_comments)
    
    if not version_match:
        # Priority 2: Dynamic JSX expression (data-block-version={blockVersion})
        # Extract from the variable assignment instead
        jsx_dynamic = re.search(r'data-block-version\s*=\s*\{([^}]+)\}', content_no_comments)
        if jsx_dynamic:
            var_name = jsx_dynamic.group(1).strip()
            # Look for the variable declaration with version pattern
            # Match: const blockVersion = runtimeContext?.blockVersion ?? 'C1'
            var_pattern = rf'{re.escape(var_name)}\s*=.*?["\']([A-Z]\d+)["\']'
            version_match = re.search(var_pattern, content_no_comments)
    
    if not version_match:
        # Priority 3: Switch statement with version cases
        version_match = re.search(r"case\s+[\"']([A-Z]\d+)[\"']:", content_no_comments)
    
    if not version_match:
        # Priority 4: Version string in blockVersion variable (look for version pattern)
        # Match patterns like: const blockVersion = ... ?? 'C1'
        version_match = re.search(r"blockVersion\s*=.*?[\"']([A-Z]\d+)[\"']", content_no_comments)
    
    if version_match:
        version = version_match.group(1)
    else:
        version = 'unknown'
        logger.warning(f"Could not extract version from {target_file}. Setting to 'unknown'.")
    
    # Determine family from filename
    if 'Introduction' in pattern:
        detected_family = 'introduction'
    elif 'CodeC1' in pattern:
        detected_family = 'code-c1'
    elif 'Definition' in pattern:
        detected_family = 'definition'
    else:
        # Use the matched family pattern
        detected_family = family
    
    ref = CanonicalReference(
        family=detected_family,
        version=version,
        source_files=[str(target_file.relative_to(repo_root))],
        schema={},  # Reserved for future schema extraction
        renderer=pattern,
        registry=None
    )
    
    return [ref]


def analyze_block_patterns(version: str, repo_root: Optional[Path] = None) -> RuntimeContract:
    """
    Analyze block patterns for a specific version to extract runtime contracts.
    
    Reads the TSX source for the given version (I1, C1, D1) and extracts:
    - UBRC requirements (data-block-id, data-block-type, data-block-version)
    - ActiveBlockContext/ILS patterns
    - Theme token references
    - Brand independence markers
    
    Pattern detection filters out comments to avoid false positives from
    commented-out code or documentation.
    
    Args:
        version: Block version (e.g., 'I1', 'C1', 'D1')
        repo_root: Repository root path (defaults to _REPO_ROOT module constant)
        
    Returns:
        RuntimeContract with extracted patterns
    """
    if repo_root is None:
        repo_root = Path(_REPO_ROOT)
    
    blocks_dir = repo_root / "packages/ui/src/tutorial/blocks"
    
    # Map versions to files
    version_files = {
        'I1': 'IntroductionBlock.tsx',
        'C1': 'CodeC1Block.tsx',
        'D1': 'DefinitionBlock.tsx',
    }
    
    filename = version_files.get(version)
    if not filename:
        logger.warning(f"Unknown version: {version}")
        return RuntimeContract()
    
    target_file = blocks_dir / filename
    if not target_file.exists():
        logger.warning(f"Block file not found: {target_file}")
        return RuntimeContract()
    
    try:
        content = target_file.read_text(encoding='utf-8')
    except Exception as e:
        logger.error(f"Failed to read {target_file}: {e}")
        return RuntimeContract()
    
    # Check for brand independence markers BEFORE stripping comments
    # (CANONICAL LOCKED UI appears in block comments)
    brand_locked_in_comments = bool(re.search(r'CANONICAL\s+LOCKED', content, re.IGNORECASE))
    
    # Remove comments before pattern matching other patterns
    content_no_comments = _remove_comments(content)
    
    # Extract UBRC patterns (only from active code)
    ubrc = {}
    if re.search(r'data-block-id', content_no_comments):
        ubrc['has_block_id'] = True
    if re.search(r'data-block-type', content_no_comments):
        ubrc['has_block_type'] = True
    if re.search(r'data-block-version', content_no_comments):
        ubrc['has_block_version'] = True
    if re.search(r'runtimeContext', content_no_comments):
        ubrc['uses_runtime_context'] = True
    
    # Extract ILS patterns (ActiveBlockContext)
    ils = {}
    if re.search(r'runtimeContext', content_no_comments):
        ils['passive_mode'] = True
        ils['uses_context'] = True
    
    # Extract LSNB patterns
    lsnb = {}
    if re.search(r'navigation', content_no_comments, re.IGNORECASE):
        lsnb['page_level'] = True
    
    # Extract RSSB patterns
    # Detect page-level RSSB by checking for runtimeContext prop usage
    # (blocks receive page-level state through runtimeContext from the page renderer)
    rssb = {}
    if re.search(r'runtimeContext', content_no_comments):
        # Block accepts runtimeContext, indicating page-level state injection (RSSB pattern)
        rssb['page_level'] = True
    else:
        # No runtimeContext usage detected - may be block-level or no RSSB
        logger.debug(f"No runtimeContext usage found in {version} - RSSB pattern unclear")
    
    # Extract theme patterns (only from active code)
    theme = {}
    if re.search(r'theme\.primary', content_no_comments):
        theme['uses_primary'] = True
    if re.search(r'theme\.secondary', content_no_comments):
        theme['uses_secondary'] = True
    if re.search(r'theme\.primaryDark', content_no_comments):
        theme['uses_primary_dark'] = True
    if re.search(r'getThemeColor', content_no_comments):
        theme['uses_theme_utils'] = True
    if re.search(r'DomainTheme', content_no_comments):
        theme['requires_theme_prop'] = True
    
    # Extract brand patterns
    brand = {}
    if re.search(r'brand\.independent', content_no_comments, re.IGNORECASE) or brand_locked_in_comments:
        brand['independent'] = True
    if re.search(r'theme\.primary', content_no_comments) and re.search(r'theme\.secondary', content_no_comments):
        brand['theme_driven'] = True
    
    return RuntimeContract(
        ubrc=ubrc,
        ils=ils,
        lsnb=lsnb,
        rssb=rssb,
        theme=theme,
        brand=brand
    )


def build_repository_contract(family: str, version: str, repo_root: Optional[Path] = None) -> RepositoryBlockContract:
    """
    Build a complete repository block contract.
    
    Combines discovery and analysis to produce a comprehensive contract
    for the specified block family and version.
    
    Args:
        family: Block family (e.g., 'introduction', 'code-c1', 'definition')
        version: Block version (e.g., 'I1', 'C1', 'D1')
        repo_root: Repository root path (defaults to _REPO_ROOT module constant)
        
    Returns:
        RepositoryBlockContract with complete metadata
    """
    if repo_root is None:
        repo_root = Path(_REPO_ROOT)
    
    # Discover canonical blocks
    refs = discover_canonical_blocks(family, repo_root)
    
    # Analyze runtime patterns
    runtime = analyze_block_patterns(version, repo_root)
    
    # Build acceptance criteria based on findings
    criteria = []
    if runtime.ubrc:
        criteria.append("UBRC attributes present (data-block-id, data-block-type, data-block-version)")
    if runtime.theme.get('uses_primary') or runtime.theme.get('uses_secondary'):
        criteria.append("Theme injection working (primary, secondary colors)")
    if runtime.brand.get('independent'):
        criteria.append("Brand-independent rendering confirmed")
    if runtime.ils.get('passive_mode'):
        criteria.append("ILS passive mode integration verified")
    
    # Default criteria if none extracted
    if not criteria:
        criteria = [
            "Block renders correctly",
            "Theme integration working",
            "Runtime context accessible"
        ]
    
    target = f"{family}-{version}"
    
    return RepositoryBlockContract(
        target=target,
        canonical_refs=refs,
        runtime=runtime,
        acceptance_criteria=criteria
    )
