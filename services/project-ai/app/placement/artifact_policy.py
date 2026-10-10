"""
Artifact Policy - M2.9 Wave 3C + W3C Canonical Artifact Policy

Canonical artifact placement policy implementing ADD/REUSE/EXTEND/UPDATE/REJECT logic
with W3C compliance for duplicate detection, version conflict resolution, and provenance tracking.

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

W3C CANONICAL ARTIFACT POLICY COMPLIANCE:
- Content-based duplicate detection using SHA-256 hash comparison
- Version conflict resolution with timestamp-based canonical selection
- Provenance metadata tracking for audit trail
- Canonical artifact registry integration
- Structured rejection reasons with actionable guidance

INTEGRATION:
- Evidence IDs extracted from TypeScript discovery snapshot (no synthetic IDs)
- SHA-256 hashing aligns with W7 evidence enforcement
- All evidence binding from snapshot.get('evidence', [])

This ensures canonical naming: one file per semantic entity, no proliferation of V2/V3/V4 variants.
"""

import hashlib
import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from app.models.candidate import PlacementDecision

# Configure logger for audit trail
logger = logging.getLogger(__name__)


@dataclass
class RepositoryArtifact:
    """
    Representation of an artifact in the repository.
    
    Attributes:
        path: Relative path in repository
        base_name: Normalized name without version suffixes or extensions
        content_hash: SHA-256 hash of artifact content
        artifact_type: Type classification (component, schema, types, etc.)
        created_at: Optional ISO 8601 timestamp of creation (provenance)
        last_modified_at: Optional ISO 8601 timestamp of last modification (provenance)
        references: Optional list of paths this artifact depends on
        referenced_by: Optional list of paths that depend on this artifact
        supersedes: Optional path to previous version (if any)
        superseded_by: Optional path to newer version (if superseded)
    """
    path: str
    base_name: str
    content_hash: str
    artifact_type: str
    # Provenance metadata (FEAT-004)
    created_at: Optional[str] = None
    last_modified_at: Optional[str] = None
    references: Optional[List[str]] = None
    referenced_by: Optional[List[str]] = None
    supersedes: Optional[str] = None
    superseded_by: Optional[str] = None


@dataclass
class RejectionReason:
    """
    Structured rejection reason for REJECT placement decisions.
    
    Attributes:
        reason_code: Classification code for rejection type
        message: Human-readable explanation of rejection
        conflicting_artifacts: List of artifact paths that conflict with candidate
        recommended_action: Guidance for resolving the rejection
    
    Examples:
        >>> reason = RejectionReason(
        ...     reason_code="CONTENT_DUPLICATE",
        ...     message="Identical content already exists",
        ...     conflicting_artifacts=["packages/ui/src/blocks/ObjectiveBlock.tsx"],
        ...     recommended_action="Update existing artifact instead of creating duplicate"
        ... )
    """
    reason_code: str  # CONTENT_DUPLICATE | VERSION_CONFLICT | QUALITY_ISSUE | POLICY_VIOLATION
    message: str
    conflicting_artifacts: List[str]
    recommended_action: str


@dataclass
class VersionConflict:
    """
    Representation of a version conflict between multiple artifacts.
    
    Attributes:
        base_name: Normalized base name of conflicting artifacts
        artifacts: List of artifacts with same base name but different content
        conflict_type: Classification of conflict type
        resolution: Resolution strategy or verdict
        canonical_artifact: The artifact selected as canonical (after resolution)
    
    Examples:
        >>> conflict = VersionConflict(
        ...     base_name="ObjectiveBlock",
        ...     artifacts=[artifact1, artifact2],
        ...     conflict_type="CONTENT_CONFLICT",
        ...     resolution="CANONICAL_SELECTED",
        ...     canonical_artifact=artifact1
        ... )
    """
    base_name: str
    artifacts: List[RepositoryArtifact]
    conflict_type: str  # CONTENT_CONFLICT | TEMPORAL_CONFLICT | SCHEMA_CONFLICT
    resolution: str  # CANONICAL_SELECTED | MERGE_REQUIRED | ESCALATE_TO_HUMAN
    canonical_artifact: Optional[RepositoryArtifact] = None


@dataclass
class CanonicalArtifactRegistry:
    """
    Canonical artifact registry entry from canonical-artifact-policy.md.
    
    Attributes:
        artifact_type: Type identifier (e.g., "M2 Backlog", "Block Corpus Registry")
        canonical_path: Canonical path in repository
        purpose: Description of artifact purpose
        last_verified: ISO 8601 timestamp of last verification (optional)
    """
    artifact_type: str
    canonical_path: str
    purpose: str
    last_verified: Optional[str] = None


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
    Build repository artifact index from discovery snapshot with provenance metadata extraction.
    
    Extracts artifacts from snapshot evidence and computes normalized base names
    for semantic matching. Extracts provenance metadata when available.
    
    Args:
        snapshot: Discovery snapshot from TypeScript scanners (D1-D8)
        
    Returns:
        List of RepositoryArtifact instances with provenance metadata
    
    Examples:
        >>> snapshot = {"evidence": [{"type": "component", "path": "src/Block.tsx", "contentHash": "abc123"}]}
        >>> index = build_repository_index(snapshot)
        >>> len(index)
        1
    """
    artifacts: List[RepositoryArtifact] = []
    
    # Extract evidence records
    evidence_list = snapshot.get('evidence', [])
    
    for evidence in evidence_list:
        # Skip null/None evidence entries
        if evidence is None:
            continue
        
        evidence_type = evidence.get('type', '')
        
        # Look for file artifacts in evidence
        if evidence_type in ['file', 'component', 'schema', 'types']:
            file_path = evidence.get('path', '')
            content_hash = evidence.get('contentHash', evidence.get('hash', ''))
            
            if file_path and content_hash:
                # Extract filename from path
                filename = file_path.split('/')[-1]
                base_name = normalize_artifact_name(filename)
                
                # Extract provenance metadata (FEAT-004)
                created_at = evidence.get('createdAt')
                last_modified_at = evidence.get('lastModifiedAt') or evidence.get('modifiedAt')
                references = evidence.get('references')
                
                artifacts.append(RepositoryArtifact(
                    path=file_path,
                    base_name=base_name,
                    content_hash=content_hash,
                    artifact_type=evidence_type,
                    created_at=created_at,
                    last_modified_at=last_modified_at,
                    references=references
                ))
    
    return artifacts


def detect_content_duplicates(repository_index: List[RepositoryArtifact]) -> Dict[str, List[RepositoryArtifact]]:
    """
    Detect content duplicates across semantically different filenames using SHA-256 hash grouping.
    
    Groups artifacts by content hash and returns only hashes with 2+ artifacts (actual duplicates).
    This enables detection when multiple artifacts serve the same purpose even if named differently.
    
    Algorithm: Content-based duplicate detection using SHA-256 hash grouping.
    
    Args:
        repository_index: List of repository artifacts to scan
        
    Returns:
        Dict mapping content_hash → list of artifacts with that hash (only duplicates included)
    
    Examples:
        >>> artifacts = [
        ...     RepositoryArtifact("path1.tsx", "Block", "abc123", "component"),
        ...     RepositoryArtifact("path2.tsx", "BlockV2", "abc123", "component"),
        ... ]
        >>> duplicates = detect_content_duplicates(artifacts)
        >>> len(duplicates["abc123"])
        2
    """
    hash_groups: Dict[str, List[RepositoryArtifact]] = {}
    
    # Group artifacts by content hash
    for artifact in repository_index:
        if artifact.content_hash not in hash_groups:
            hash_groups[artifact.content_hash] = []
        hash_groups[artifact.content_hash].append(artifact)
    
    # Return only groups with 2+ artifacts (actual duplicates)
    duplicates = {
        content_hash: artifacts
        for content_hash, artifacts in hash_groups.items()
        if len(artifacts) >= 2
    }
    
    return duplicates


def is_content_duplicate(candidate_content: str, repository_index: List[RepositoryArtifact]) -> Optional[List[RepositoryArtifact]]:
    """
    Check if candidate content is a duplicate of existing repository artifacts.
    
    Computes candidate hash and checks if any repository artifact has matching hash.
    Used by placement logic to detect duplicate submissions.
    
    Args:
        candidate_content: Candidate artifact content to check
        repository_index: List of repository artifacts
        
    Returns:
        List of matching artifacts if duplicate found, None otherwise
    
    Examples:
        >>> content = "const Block = () => {}"
        >>> artifacts = [RepositoryArtifact("path.tsx", "Block", hashlib.sha256(content.encode()).hexdigest(), "component")]
        >>> matches = is_content_duplicate(content, artifacts)
        >>> matches is not None
        True
    """
    # Compute candidate hash
    candidate_hash = hashlib.sha256(candidate_content.encode('utf-8')).hexdigest()
    
    # Check if hash exists in repository
    matching_artifacts = []
    for artifact in repository_index:
        if artifact.content_hash == candidate_hash:
            matching_artifacts.append(artifact)
    
    return matching_artifacts if matching_artifacts else None


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


def detect_version_conflicts(repository_index: List[RepositoryArtifact]) -> List[VersionConflict]:
    """
    Detect version conflicts when multiple versions of same artifact exist with different content.
    
    Groups artifacts by normalized base_name and identifies conflicts where 2+ artifacts
    with same base name have different content hashes.
    
    Args:
        repository_index: List of repository artifacts to scan
        
    Returns:
        List of VersionConflict objects identifying conflicting artifact groups
    
    Examples:
        >>> artifacts = [
        ...     RepositoryArtifact("Block.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
        ...     RepositoryArtifact("BlockV2.tsx", "Block", "def", "component", created_at="2024-01-02T10:00:00Z"),
        ... ]
        >>> conflicts = detect_version_conflicts(artifacts)
        >>> len(conflicts)
        1
        >>> conflicts[0].conflict_type
        'CONTENT_CONFLICT'
    """
    # Group artifacts by base name
    base_name_groups: Dict[str, List[RepositoryArtifact]] = {}
    for artifact in repository_index:
        if artifact.base_name not in base_name_groups:
            base_name_groups[artifact.base_name] = []
        base_name_groups[artifact.base_name].append(artifact)
    
    # Identify conflicts: groups with 2+ artifacts and different content hashes
    conflicts = []
    for base_name, artifacts in base_name_groups.items():
        if len(artifacts) < 2:
            continue
        
        # Check if content hashes differ
        unique_hashes = set(a.content_hash for a in artifacts)
        if len(unique_hashes) > 1:
            # Content conflict detected
            conflict = VersionConflict(
                base_name=base_name,
                artifacts=artifacts,
                conflict_type="CONTENT_CONFLICT",
                resolution="UNRESOLVED"
            )
            conflicts.append(conflict)
    
    return conflicts


def select_canonical_artifact(artifacts: List[RepositoryArtifact]) -> RepositoryArtifact:
    """
    Select canonical artifact using deterministic timestamp-based ordering.
    
    Canonical selection algorithm (deterministic, audit-friendly):
    1. Earliest timestamp wins (created_at or last_modified_at)
    2. For timestamp ties: shortest path wins (fewer directory levels = more central)
    3. For path length ties: alphabetically first wins (deterministic)
    
    Rationale: Deterministic selection ensures consistent behavior across runs and provides
    clear audit trail for canonical artifact selection.
    
    Args:
        artifacts: List of artifacts to select from (must be non-empty)
        
    Returns:
        The canonical artifact based on selection algorithm
    
    Raises:
        ValueError: If artifacts list is empty
    
    Examples:
        >>> a1 = RepositoryArtifact("long/path/Block.tsx", "Block", "abc", "component", created_at="2024-01-02T10:00:00Z")
        >>> a2 = RepositoryArtifact("short/Block.tsx", "Block", "def", "component", created_at="2024-01-01T10:00:00Z")
        >>> canonical = select_canonical_artifact([a1, a2])
        >>> canonical.path
        'short/Block.tsx'
    """
    if not artifacts:
        raise ValueError("Cannot select canonical artifact from empty list")
    
    def sort_key(artifact: RepositoryArtifact) -> Tuple[str, int, str]:
        # Primary: earliest timestamp (use empty string as fallback to sort to end)
        timestamp = artifact.created_at or artifact.last_modified_at or "9999-99-99T99:99:99Z"
        # Secondary: shortest path (fewer slashes = more central)
        path_depth = artifact.path.count('/')
        # Tertiary: alphabetical order (deterministic tie-breaker)
        path_alpha = artifact.path
        return (timestamp, path_depth, path_alpha)
    
    sorted_artifacts = sorted(artifacts, key=sort_key)
    canonical = sorted_artifacts[0]
    
    logger.warning(
        f"Canonical artifact selected: {canonical.path} (timestamp: {canonical.created_at or canonical.last_modified_at}, "
        f"from {len(artifacts)} candidates)"
    )
    
    return canonical


def resolve_version_conflict(conflict: VersionConflict) -> VersionConflict:
    """
    Resolve version conflict by selecting canonical artifact and determining resolution strategy.
    
    Resolution logic:
    - Select canonical using select_canonical_artifact()
    - Set resolution based on content analysis
    - Log resolution decision at WARNING level for audit trail
    
    Args:
        conflict: VersionConflict to resolve
        
    Returns:
        Updated VersionConflict with resolution and canonical artifact identified
    
    Examples:
        >>> artifacts = [
        ...     RepositoryArtifact("Block.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
        ...     RepositoryArtifact("BlockV2.tsx", "Block", "def", "component", created_at="2024-01-02T10:00:00Z"),
        ... ]
        >>> conflict = VersionConflict("Block", artifacts, "CONTENT_CONFLICT", "UNRESOLVED")
        >>> resolved = resolve_version_conflict(conflict)
        >>> resolved.resolution
        'CANONICAL_SELECTED'
    """
    # Select canonical artifact
    canonical = select_canonical_artifact(conflict.artifacts)
    
    # Update conflict with resolution
    conflict.canonical_artifact = canonical
    conflict.resolution = "CANONICAL_SELECTED"
    
    # Log resolution for audit trail
    non_canonical_paths = [a.path for a in conflict.artifacts if a.path != canonical.path]
    logger.warning(
        f"Version conflict resolved for {conflict.base_name}: "
        f"canonical={canonical.path}, non-canonical={non_canonical_paths}, "
        f"conflict_type={conflict.conflict_type}"
    )
    
    return conflict


def find_existing_duplicates(artifact_list: List[RepositoryArtifact]) -> Dict[str, List[str]]:
    """
    Find existing duplicates without mutating state (migration helper).
    
    Identifies content-based duplicates and returns mapping of content hash to list
    of artifact paths. Used for documentation and migration planning, not enforcement.
    
    Args:
        artifact_list: List of artifacts to scan for duplicates
        
    Returns:
        Dict mapping content_hash → list of artifact paths with that hash
        (only includes hashes with 2+ paths)
    
    Examples:
        >>> artifacts = [
        ...     RepositoryArtifact("path1.tsx", "Block", "abc123", "component"),
        ...     RepositoryArtifact("path2.tsx", "BlockV2", "abc123", "component"),
        ... ]
        >>> duplicates = find_existing_duplicates(artifacts)
        >>> "abc123" in duplicates
        True
        >>> len(duplicates["abc123"])
        2
    """
    hash_to_paths: Dict[str, List[str]] = {}
    
    for artifact in artifact_list:
        content_hash = artifact.content_hash
        if content_hash not in hash_to_paths:
            hash_to_paths[content_hash] = []
        hash_to_paths[content_hash].append(artifact.path)
    
    # Return only hashes with 2+ paths (actual duplicates)
    duplicates = {
        content_hash: paths
        for content_hash, paths in hash_to_paths.items()
        if len(paths) >= 2
    }
    
    return duplicates


def format_rejection_message(reason: RejectionReason) -> str:
    """
    Create human-readable rejection message from RejectionReason.
    
    Formats rejection reason with code, message, conflicting paths, and recommended action
    for console output and API responses.
    
    Args:
        reason: RejectionReason to format
        
    Returns:
        Formatted human-readable rejection message
    
    Examples:
        >>> reason = RejectionReason(
        ...     reason_code="CONTENT_DUPLICATE",
        ...     message="Identical content already exists",
        ...     conflicting_artifacts=["path/Block.tsx"],
        ...     recommended_action="Update existing artifact"
        ... )
        >>> msg = format_rejection_message(reason)
        >>> "CONTENT_DUPLICATE" in msg
        True
    """
    msg_parts = [
        f"[{reason.reason_code}] {reason.message}",
        "",
        "Conflicting artifacts:"
    ]
    
    for artifact_path in reason.conflicting_artifacts:
        msg_parts.append(f"  - {artifact_path}")
    
    msg_parts.extend([
        "",
        f"Recommended action: {reason.recommended_action}"
    ])
    
    return "\n".join(msg_parts)


def load_canonical_registry(registry_path: str) -> List[CanonicalArtifactRegistry]:
    """
    Parse canonical artifact policy Markdown table and load registry entries.
    
    Extracts artifact type, canonical path, and purpose from the policy document.
    Handles missing file gracefully with warning log.
    
    Args:
        registry_path: Path to canonical-artifact-policy.md
        
    Returns:
        List of registered canonical artifacts (empty list if file missing)
    
    Examples:
        >>> registry = load_canonical_registry(".agents/policies/canonical-artifact-policy.md")
        >>> len(registry) >= 0
        True
    """
    if not os.path.exists(registry_path):
        logger.warning(f"Canonical artifact registry not found at {registry_path}")
        return []
    
    try:
        with open(registry_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        registry = []
        
        # Simple table parsing - look for lines with | separators after "Canonical Artifacts" heading
        in_table = False
        for line in content.split('\n'):
            line = line.strip()
            
            # Start parsing after "Canonical Artifacts" table header
            if '| Artifact |' in line and '| Canonical Path |' in line:
                in_table = True
                continue
            
            # Skip table separator line
            if in_table and line.startswith('|---'):
                continue
            
            # Parse table rows
            if in_table and line.startswith('|') and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                # Format: | Artifact | Canonical Path | Purpose |
                if len(parts) >= 4:  # [empty, artifact, path, purpose, empty]
                    artifact_type = parts[1]
                    canonical_path = parts[2]
                    purpose = parts[3]
                    
                    if artifact_type and canonical_path and purpose:
                        registry.append(CanonicalArtifactRegistry(
                            artifact_type=artifact_type,
                            canonical_path=canonical_path,
                            purpose=purpose
                        ))
            elif in_table and not line.startswith('|'):
                # End of table
                break
        
        return registry
    
    except Exception as e:
        logger.warning(f"Error loading canonical registry from {registry_path}: {e}")
        return []


def find_canonical_artifact(purpose: str, registry: List[CanonicalArtifactRegistry]) -> Optional[str]:
    """
    Search registry for artifact matching purpose using fuzzy matching.
    
    Uses case-insensitive substring matching on purpose field.
    
    Args:
        purpose: Purpose description to search for
        registry: List of canonical artifact registry entries
        
    Returns:
        Canonical path if found, None otherwise
    
    Examples:
        >>> registry = [CanonicalArtifactRegistry("M2 Backlog", ".agents/tasks/backlog.md", "M2 requirements")]
        >>> path = find_canonical_artifact("M2 requirements", registry)
        >>> path
        '.agents/tasks/backlog.md'
    """
    purpose_lower = purpose.lower()
    
    for entry in registry:
        if purpose_lower in entry.purpose.lower() or entry.purpose.lower() in purpose_lower:
            return entry.canonical_path
    
    return None


def should_create_new_artifact(
    candidate_filename: str,
    candidate_content: str,
    repository_index: List[RepositoryArtifact],
    registry: List[CanonicalArtifactRegistry]
) -> Tuple[bool, str]:
    """
    Determine if new artifact should be created based on policy checks.
    
    Policy checks (in order):
    1. Semantic match in repository → should NOT create (return False + reason)
    2. Content duplicate → should NOT create
    3. Canonical registry match → should NOT create (update canonical instead)
    4. All checks pass → OK to create (return True + empty reason)
    
    Args:
        candidate_filename: Candidate artifact filename
        candidate_content: Candidate artifact content
        repository_index: List of repository artifacts
        registry: List of canonical artifact registry entries
        
    Returns:
        Tuple of (should_create: bool, reason: str)
    
    Examples:
        >>> artifacts = [RepositoryArtifact("Block.tsx", "Block", "abc123", "component")]
        >>> should_create, reason = should_create_new_artifact("BlockV2.tsx", "content", artifacts, [])
        >>> should_create
        False
    """
    # Check 1: Semantic match in repository
    semantic_match = find_semantic_match(candidate_filename, repository_index)
    if semantic_match is not None:
        return False, f"Semantic match found: {semantic_match.path}"
    
    # Check 2: Content duplicate
    content_duplicate = is_content_duplicate(candidate_content, repository_index)
    if content_duplicate is not None:
        paths = [a.path for a in content_duplicate]
        return False, f"Content duplicate detected: identical to {', '.join(paths)}"
    
    # Check 3: Canonical registry match (basic check - could be enhanced with purpose extraction)
    # For now, just check if filename suggests a known canonical artifact type
    base_name = normalize_artifact_name(candidate_filename).lower()
    for entry in registry:
        if base_name in entry.canonical_path.lower():
            return False, f"Canonical artifact exists: {entry.canonical_path}"
    
    # All checks pass - OK to create
    return True, ""


def compute_artifact_graph(repository_index: List[RepositoryArtifact]) -> Dict[str, Any]:
    """
    Build reference graph from artifact dependencies.
    
    Returns dict with nodes (artifacts) and edges (references) for dependency tracking
    and impact analysis.
    
    Args:
        repository_index: List of repository artifacts with reference metadata
        
    Returns:
        Dict with "nodes" (list of artifacts) and "edges" (list of references)
        Format: {"nodes": [{"path": str, "hash": str}], "edges": [{"from": str, "to": str}]}
    
    Examples:
        >>> artifacts = [
        ...     RepositoryArtifact("A.tsx", "A", "abc", "component", references=["B.tsx"]),
        ...     RepositoryArtifact("B.tsx", "B", "def", "component")
        ... ]
        >>> graph = compute_artifact_graph(artifacts)
        >>> len(graph["nodes"])
        2
        >>> len(graph["edges"])
        1
    """
    nodes = []
    edges = []
    
    for artifact in repository_index:
        # Add node
        nodes.append({
            "path": artifact.path,
            "hash": artifact.content_hash,
            "base_name": artifact.base_name
        })
        
        # Add edges from references
        if artifact.references:
            for ref_path in artifact.references:
                edges.append({
                    "from": artifact.path,
                    "to": ref_path
                })
    
    return {
        "nodes": nodes,
        "edges": edges
    }


def get_artifact_lineage(
    artifact: RepositoryArtifact,
    repository_index: List[RepositoryArtifact],
    max_depth: int = 100
) -> List[RepositoryArtifact]:
    """
    Follow supersedes chain backward to find artifact history.
    
    Traces version history through supersedes relationships, returning list ordered
    from oldest to newest. Handles circular references gracefully with max depth limit.
    
    Args:
        artifact: Starting artifact to trace lineage from
        repository_index: List of repository artifacts
        max_depth: Maximum depth to prevent infinite loops (default: 100)
        
    Returns:
        List of artifacts in lineage, ordered from oldest to newest
    
    Examples:
        >>> a1 = RepositoryArtifact("v1.tsx", "Block", "abc", "component")
        >>> a2 = RepositoryArtifact("v2.tsx", "Block", "def", "component", supersedes="v1.tsx")
        >>> lineage = get_artifact_lineage(a2, [a1, a2])
        >>> len(lineage)
        2
        >>> lineage[0].path
        'v1.tsx'
    """
    lineage = [artifact]
    visited = {artifact.path}
    current = artifact
    depth = 0
    
    # Follow supersedes chain backward
    while current.supersedes and depth < max_depth:
        # Find superseded artifact
        superseded = None
        for a in repository_index:
            if a.path == current.supersedes:
                superseded = a
                break
        
        if superseded is None:
            # Superseded artifact not found in index
            break
        
        if superseded.path in visited:
            # Circular reference detected
            logger.warning(f"Circular supersedes reference detected at {superseded.path}")
            break
        
        lineage.insert(0, superseded)  # Add to front (oldest first)
        visited.add(superseded.path)
        current = superseded
        depth += 1
    
    return lineage


def determine_action(
    candidate_content: str,
    candidate_filename: str,
    repository_match: Optional[RepositoryArtifact],
    repository_index: Optional[List[RepositoryArtifact]] = None
) -> Tuple[PlacementDecision, Optional[RejectionReason]]:
    """
    Determine placement action based on repository match and content comparison.
    
    Decision logic with W3C content duplicate detection:
    - Content duplicate with different filename → REJECT with structured reason
    - No match → ADD (new artifact)
    - Match with identical hash → REUSE (content unchanged)
    - Match with variant indicator → EXTEND (variant family)
    - Match with different content → UPDATE (replace existing)
    
    Duplicate prevention:
    - ObjectiveBlockV2.tsx with existing ObjectiveBlock.tsx → UPDATE (not ADD)
    - Same content, different filename → REJECT with content duplicate reason
    - This prevents versioned file proliferation
    
    Args:
        candidate_content: Candidate artifact content
        candidate_filename: Candidate artifact filename
        repository_match: Matching repository artifact (if any)
        repository_index: Full repository index for content duplicate detection (optional)
        
    Returns:
        Tuple of (PlacementDecision, Optional[RejectionReason])
        For REJECT decisions, RejectionReason provides details.
        For non-REJECT decisions, RejectionReason is None.
    
    Examples:
        >>> decision, reason = determine_action("content", "New.tsx", None)
        >>> decision
        <PlacementDecision.ADD: 'ADD'>
        >>> reason is None
        True
    """
    # FEAT-001: Check for content duplicates with different filename (before other checks)
    if repository_index is not None:
        content_duplicates = is_content_duplicate(candidate_content, repository_index)
        if content_duplicates is not None:
            # Content duplicate detected with different filename → REJECT
            duplicate_paths = [a.path for a in content_duplicates]
            
            # Check if duplicate has different base name (true duplicate vs semantic match)
            candidate_base = normalize_artifact_name(candidate_filename)
            is_semantic_match = any(
                normalize_artifact_name(a.path.split('/')[-1]) == candidate_base
                for a in content_duplicates
            )
            
            if not is_semantic_match:
                # True content duplicate with different name → REJECT
                reason = RejectionReason(
                    reason_code="CONTENT_DUPLICATE",
                    message="Content duplicate detected: identical to existing artifacts at different paths",
                    conflicting_artifacts=duplicate_paths,
                    recommended_action=f"Update existing artifact at {duplicate_paths[0]} instead of creating duplicate"
                )
                return PlacementDecision.REJECT, reason
    
    # No repository match → ADD as new artifact
    if repository_match is None:
        return PlacementDecision.ADD, None
    
    # Compute candidate content hash
    candidate_hash = hashlib.sha256(candidate_content.encode('utf-8')).hexdigest()
    
    # Match with identical content → REUSE
    if candidate_hash == repository_match.content_hash:
        return PlacementDecision.REUSE, None
    
    # Check for variant indicators in filename
    variant_patterns = ['.variant.', '-variant-', '_variant_', '.variant', '-variant']
    is_variant = any(pattern in candidate_filename.lower() for pattern in variant_patterns)
    
    if is_variant:
        return PlacementDecision.EXTEND, None
    
    # Match with different content → UPDATE
    # This is where duplicate prevention happens:
    # ObjectiveBlockV2.tsx with existing ObjectiveBlock.tsx → UPDATE action
    return PlacementDecision.UPDATE, None


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
