"""
Repository Intelligence Service - M2.9 Wave 1B

Extracts canonical block contracts from repository evidence by scanning
UI block TSX files and analyzing their UBRC attributes, theme usage,
and runtime patterns.

This service discovers Introduction (I1), Code (C1), and Definition (D1)
blocks and builds engineering contracts for external AI consumption.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class CanonicalReference:
    """Reference to a canonical block version in the repository."""
    family: str
    version: str
    source_files: list[str] = field(default_factory=list)
    schema: dict = field(default_factory=dict)
    renderer: Optional[str] = None
    registry: Optional[str] = None


@dataclass
class RuntimeContract:
    """Runtime requirements extracted from block implementation."""
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


def discover_canonical_blocks(family: str) -> list[CanonicalReference]:
    """
    Discover canonical blocks for a given family by scanning UI blocks directory.
    
    Scans packages/ui/src/tutorial/blocks/ for TSX files matching the family name
    (e.g., 'introduction' → IntroductionBlock.tsx, 'code-c1' → CodeC1Block.tsx).
    
    Args:
        family: Block family name (e.g., 'introduction', 'code-c1', 'definition')
        
    Returns:
        List of CanonicalReference objects with extracted metadata
    """
    blocks_dir = Path("e:/onlinewebsites/quiz-platform/packages/ui/src/tutorial/blocks")
    
    if not blocks_dir.exists():
        return []
    
    # Map family names to file patterns
    family_patterns = {
        'introduction': 'IntroductionBlock.tsx',
        'code-c1': 'CodeC1Block.tsx',
        'definition': 'DefinitionBlock.tsx',
        'code': 'CodeC1Block.tsx',  # Allow 'code' to match CodeC1
    }
    
    pattern = family_patterns.get(family.lower())
    if not pattern:
        return []
    
    target_file = blocks_dir / pattern
    if not target_file.exists():
        return []
    
    # Read the file and extract metadata
    content = target_file.read_text(encoding='utf-8')
    
    # Extract version from data-block-version or version routing
    version_match = re.search(r"data-block-version[\"']?[=:]?\s*[\"']?([A-Z]\d+)[\"']?", content)
    if not version_match:
        # Try finding version in switch/case statements
        version_match = re.search(r"case\s+[\"']([A-Z]\d+)[\"']:", content)
    if not version_match:
        # Try finding version in blockVersion assignment (e.g., ?? 'C1')
        version_match = re.search(r"blockVersion.*?[\"']([A-Z]\d+)[\"']", content)
    
    version = version_match.group(1) if version_match else 'unknown'
    
    # Determine family from filename
    if 'Introduction' in pattern:
        detected_family = 'introduction'
    elif 'CodeC1' in pattern:
        detected_family = 'code-c1'
    elif 'Definition' in pattern:
        detected_family = 'definition'
    else:
        detected_family = family
    
    ref = CanonicalReference(
        family=detected_family,
        version=version,
        source_files=[str(target_file.relative_to(Path("e:/onlinewebsites/quiz-platform")))],
        schema={},  # Schema extraction would go here
        renderer=pattern,
        registry=None
    )
    
    return [ref]


def analyze_block_patterns(version: str) -> RuntimeContract:
    """
    Analyze block patterns for a specific version to extract runtime contracts.
    
    Reads the TSX source for the given version (I1, C1, D1) and extracts:
    - UBRC requirements (data-block-id, data-block-type, data-block-version)
    - ActiveBlockContext/ILS patterns
    - Theme token references
    - Brand independence markers
    
    Args:
        version: Block version (e.g., 'I1', 'C1', 'D1')
        
    Returns:
        RuntimeContract with extracted patterns
    """
    blocks_dir = Path("e:/onlinewebsites/quiz-platform/packages/ui/src/tutorial/blocks")
    
    # Map versions to files
    version_files = {
        'I1': 'IntroductionBlock.tsx',
        'C1': 'CodeC1Block.tsx',
        'D1': 'DefinitionBlock.tsx',
    }
    
    filename = version_files.get(version)
    if not filename:
        return RuntimeContract()
    
    target_file = blocks_dir / filename
    if not target_file.exists():
        return RuntimeContract()
    
    content = target_file.read_text(encoding='utf-8')
    
    # Extract UBRC patterns
    ubrc = {}
    if re.search(r'data-block-id', content):
        ubrc['has_block_id'] = True
    if re.search(r'data-block-type', content):
        ubrc['has_block_type'] = True
    if re.search(r'data-block-version', content):
        ubrc['has_block_version'] = True
    if re.search(r'runtimeContext', content):
        ubrc['uses_runtime_context'] = True
    
    # Extract ILS patterns (ActiveBlockContext)
    ils = {}
    if re.search(r'runtimeContext', content):
        ils['passive_mode'] = True
        ils['uses_context'] = True
    
    # Extract LSNB patterns
    lsnb = {}
    if re.search(r'navigation', content, re.IGNORECASE):
        lsnb['page_level'] = True
    
    # Extract RSSB patterns
    rssb = {}
    # RSSB is typically page-level for all blocks
    rssb['page_level'] = True
    
    # Extract theme patterns
    theme = {}
    if re.search(r'theme\.primary', content):
        theme['uses_primary'] = True
    if re.search(r'theme\.secondary', content):
        theme['uses_secondary'] = True
    if re.search(r'theme\.primaryDark', content):
        theme['uses_primary_dark'] = True
    if re.search(r'getThemeColor', content):
        theme['uses_theme_utils'] = True
    if re.search(r'DomainTheme', content):
        theme['requires_theme_prop'] = True
    
    # Extract brand patterns
    brand = {}
    if re.search(r'brand.independent', content, re.IGNORECASE) or \
       re.search(r'CANONICAL LOCKED', content):
        brand['independent'] = True
    if re.search(r'theme.primary', content) and re.search(r'theme.secondary', content):
        brand['theme_driven'] = True
    
    return RuntimeContract(
        ubrc=ubrc,
        ils=ils,
        lsnb=lsnb,
        rssb=rssb,
        theme=theme,
        brand=brand
    )


def build_repository_contract(family: str, version: str) -> RepositoryBlockContract:
    """
    Build a complete repository block contract.
    
    Combines discovery and analysis to produce a comprehensive contract
    for the specified block family and version.
    
    Args:
        family: Block family (e.g., 'introduction', 'code-c1', 'definition')
        version: Block version (e.g., 'I1', 'C1', 'D1')
        
    Returns:
        RepositoryBlockContract with complete metadata
    """
    # Discover canonical blocks
    refs = discover_canonical_blocks(family)
    
    # Analyze runtime patterns
    runtime = analyze_block_patterns(version)
    
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
