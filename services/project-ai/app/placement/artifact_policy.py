"""
Artifact Policy - M2.9 Wave 3C

Canonical artifact placement policy implementing ADD/REUSE/EXTEND/UPDATE/REJECT logic.

POLICY RULES:
- ADD: No semantic match in repository → create new artifact
- REUSE: Semantic match with identical content hash → reuse existing
- EXTEND: Semantic match with variant indicator (.variant., -variant.) → extend family
- UPDATE: Semantic match with different content → update existing
- REJECT: Duplicate prevention - ObjectiveBlockV2.tsx rejected when ObjectiveBlock.tsx exists

DUPLICATE PREVENTION:
The policy prevents creating versioned duplicates by normalizing artifact names:
- ObjectiveBlockV2.tsx → ObjectiveBlock (base name)
- ObjectiveBlock_v3.tsx → ObjectiveBlock (base name)
- If ObjectiveBlock.tsx exists, ObjectiveBlockV2.tsx gets UPDATE action pointing to existing file

This ensures canonical naming: one file per semantic entity, no proliferation of V2/V3/V4 variants.
"""

import hashlib
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.models.candidate import PlacementDecision


@dataclass
class RepositoryArtifact:
    """
    Representation of an artifact in the repository.
    
    Attributes:
        path: Relative path in repository
        base_name: Normalized name without version suffixes or extensions
        content_hash: SHA-256 hash of artifact content
        artifact_type: Type classification (component, schema, types, etc.)
    """
    path: str
    base_name: str
    content_hash: str
    artifact_type: str


def normalize_artifact_name(filename: str) -> str:
    """
    Normalize artifact name by removing version suffixes and extensions.
    
    Version suffix patterns removed:
    - V2, V3, V10 (uppercase)
    - v2, v3, v10 (lowercase)
    - _v2, _V2, _v3 (underscore prefix)
    - .variant., -variant- (variant indicators)
    
    Examples:
        ObjectiveBlockV2.tsx → ObjectiveBlock
        ObjectiveBlock_v3.tsx → ObjectiveBlock
        ObjectiveBlockv2.tsx → ObjectiveBlock
        ObjectiveBlock.variant.tsx → ObjectiveBlock
        ObjectiveBlock-variant-dark.tsx → ObjectiveBlock
    
    Args:
        filename: Original filename
        
    Returns:
        Normalized base name without version suffixes or extensions
    """
    # Remove file extension
    name_without_ext = re.sub(r'\.(tsx?|jsx?|css|json|md)$', '', filename, flags=re.IGNORECASE)
    
    # Remove variant indicators (.variant., -variant-)
    name_no_variant = re.sub(r'[.\-_]variant[.\-_].*', '', name_without_ext, flags=re.IGNORECASE)
    name_no_variant = re.sub(r'[.\-_]variant$', '', name_no_variant, flags=re.IGNORECASE)
    
    # Remove version suffixes (V2, v2, _v2, _V2)
    # Pattern: optional separator (_) followed by optional v/V, followed by digits
    name_no_version = re.sub(r'_?[vV]?\d+$', '', name_no_variant)
    
    # Also handle uppercase V at end without underscore (ObjectiveBlockV2)
    name_no_version = re.sub(r'V\d+$', '', name_no_version)
    
    return name_no_version


def build_repository_index(snapshot: Dict[str, Any]) -> List[RepositoryArtifact]:
    """
    Build repository artifact index from discovery snapshot.
    
    Extracts artifacts from snapshot evidence and computes normalized base names
    for semantic matching.
    
    Args:
        snapshot: Discovery snapshot from TypeScript scanners (D1-D8)
        
    Returns:
        List of RepositoryArtifact instances
    """
    artifacts: List[RepositoryArtifact] = []
    
    # Extract evidence records
    evidence_list = snapshot.get('evidence', [])
    
    for evidence in evidence_list:
        evidence_type = evidence.get('type', '')
        
        # Look for file artifacts in evidence
        if evidence_type in ['file', 'component', 'schema', 'types']:
            file_path = evidence.get('path', '')
            content_hash = evidence.get('contentHash', evidence.get('hash', ''))
            
            if file_path and content_hash:
                # Extract filename from path
                filename = file_path.split('/')[-1]
                base_name = normalize_artifact_name(filename)
                
                artifacts.append(RepositoryArtifact(
                    path=file_path,
                    base_name=base_name,
                    content_hash=content_hash,
                    artifact_type=evidence_type
                ))
    
    return artifacts


def find_semantic_match(
    candidate_filename: str,
    repository_index: List[RepositoryArtifact]
) -> Optional[RepositoryArtifact]:
    """
    Find semantic match for candidate in repository index.
    
    Semantic matching uses normalized base names to identify duplicates:
    - ObjectiveBlockV2.tsx matches ObjectiveBlock.tsx (same base: ObjectiveBlock)
    - Introduction_v3.tsx matches Introduction.tsx (same base: Introduction)
    
    This prevents duplicate file creation and enforces canonical naming.
    
    Args:
        candidate_filename: Candidate artifact filename
        repository_index: List of repository artifacts
        
    Returns:
        Matching repository artifact if found, None otherwise
    """
    candidate_base = normalize_artifact_name(candidate_filename)
    
    for artifact in repository_index:
        if artifact.base_name == candidate_base:
            return artifact
    
    return None


def determine_action(
    candidate_content: str,
    candidate_filename: str,
    repository_match: Optional[RepositoryArtifact]
) -> PlacementDecision:
    """
    Determine placement action based on repository match and content comparison.
    
    Decision logic:
    - No match → ADD (new artifact)
    - Match with identical hash → REUSE (content unchanged)
    - Match with variant indicator → EXTEND (variant family)
    - Match with different content → UPDATE (replace existing)
    - Quality/compatibility issue → REJECT (manual review required)
    
    Duplicate prevention:
    - ObjectiveBlockV2.tsx with existing ObjectiveBlock.tsx → UPDATE (not ADD)
    - This prevents versioned file proliferation
    
    Args:
        candidate_content: Candidate artifact content
        candidate_filename: Candidate artifact filename
        repository_match: Matching repository artifact (if any)
        
    Returns:
        PlacementDecision action
    """
    # No repository match → ADD as new artifact
    if repository_match is None:
        return PlacementDecision.ADD
    
    # Compute candidate content hash
    candidate_hash = hashlib.sha256(candidate_content.encode('utf-8')).hexdigest()
    
    # Match with identical content → REUSE
    if candidate_hash == repository_match.content_hash:
        return PlacementDecision.REUSE
    
    # Check for variant indicators in filename
    variant_patterns = ['.variant.', '-variant-', '_variant_', '.variant', '-variant']
    is_variant = any(pattern in candidate_filename.lower() for pattern in variant_patterns)
    
    if is_variant:
        return PlacementDecision.EXTEND
    
    # Match with different content → UPDATE
    # This is where duplicate prevention happens:
    # ObjectiveBlockV2.tsx with existing ObjectiveBlock.tsx → UPDATE action
    return PlacementDecision.UPDATE


def get_target_path(
    action: PlacementDecision,
    candidate_path: str,
    repository_match: Optional[RepositoryArtifact]
) -> str:
    """
    Determine target path based on placement action.
    
    Path resolution rules:
    - ADD → use candidate_path (new file)
    - UPDATE → use repository_match.path (replace existing)
    - EXTEND → use repository_match.path (add to existing family)
    - REUSE → use repository_match.path (reference existing)
    - REJECT → empty string (no placement)
    
    Args:
        action: Placement decision
        candidate_path: Candidate artifact path
        repository_match: Matching repository artifact (if any)
        
    Returns:
        Target path for placement
    """
    if action == PlacementDecision.ADD:
        return candidate_path
    
    if action == PlacementDecision.REJECT:
        return ""
    
    # UPDATE, EXTEND, REUSE all use existing repository path
    if repository_match is not None:
        return repository_match.path
    
    # Fallback: use candidate path (shouldn't reach here in normal flow)
    return candidate_path
