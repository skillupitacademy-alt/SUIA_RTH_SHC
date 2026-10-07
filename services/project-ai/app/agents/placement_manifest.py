"""
Canonical Artifact Placement Policy.

Implements ADD/UPDATE/EXTEND/REUSE logic to prevent duplicate file creation.
A candidate must UPDATE an existing ObjectiveBlock.tsx, not create ObjectiveBlockV2.tsx.
"""

import hashlib
import re
from enum import Enum
from pathlib import Path
from typing import Dict, Any, List, Optional, Literal

from pydantic import BaseModel, Field


class PlacementAction(str, Enum):
    """Placement action for candidate artifacts."""
    
    ADD = "ADD"
    """Add as a new artifact to the repository."""
    
    UPDATE = "UPDATE"
    """Update an existing artifact with this candidate."""
    
    EXTEND = "EXTEND"
    """Extend an existing artifact family with this candidate."""
    
    REUSE = "REUSE"
    """Reuse existing artifact, no changes needed."""
    
    REJECT = "REJECT"
    """Reject candidate, does not meet criteria."""


class ArtifactPlacement(BaseModel):
    """Placement decision for a single artifact."""
    
    candidate_path: str = Field(..., description="Path in candidate package")
    action: PlacementAction = Field(..., description="Placement action")
    target_path: str = Field(..., description="Resolved canonical path in repository")
    reason: str = Field(..., description="Explanation for this placement decision")
    requires_approval: bool = Field(default=True, description="Whether human approval is required")
    existing_artifact_hash: Optional[str] = Field(None, description="Hash of existing artifact if found")


class PlacementManifest(BaseModel):
    """Complete placement manifest for a candidate package."""
    
    workflow_id: str = Field(..., description="Workflow ID this manifest belongs to")
    manifest_hash: str = Field(default="", description="SHA-256 hash of manifest content")
    placements: List[ArtifactPlacement] = Field(default_factory=list, description="Approved placements")
    rejected: List[ArtifactPlacement] = Field(default_factory=list, description="Rejected placements")
    status: Literal["PENDING_APPROVAL", "APPROVED", "REJECTED"] = Field(
        default="PENDING_APPROVAL",
        description="Manifest approval status"
    )


class RepositoryArtifact(BaseModel):
    """Existing artifact in the repository."""
    
    path: str = Field(..., description="Path in repository")
    base_name: str = Field(..., description="Base name without version suffix")
    content_hash: str = Field(..., description="SHA-256 hash of content")
    artifact_type: str = Field(..., description="Type of artifact (component, type, etc.)")


def normalize_artifact_name(filename: str) -> str:
    """
    Normalize artifact name by removing version suffixes and variant indicators.
    
    Examples:
        ObjectiveBlockV2.tsx -> ObjectiveBlock
        ObjectiveBlock_v3.tsx -> ObjectiveBlock
        ObjectiveBlock.tsx -> ObjectiveBlock
        ObjectiveBlock.variant.tsx -> ObjectiveBlock
        ObjectiveBlock-variant.tsx -> ObjectiveBlock
    
    Args:
        filename: Filename to normalize
        
    Returns:
        Base name without version suffix, variant indicator, or extension
    """
    # Remove extension
    name = Path(filename).stem
    
    # Remove variant indicators: .variant, -variant
    name = re.sub(r'[.\-_](variant|alt|alternative)$', '', name, flags=re.IGNORECASE)
    
    # Remove version suffixes: V2, V3, _v2, _v3, etc.
    # Pattern: (V|v|_v|_V)\d+$ at end of string
    name = re.sub(r'[_\s]*(V|v)\d+$', '', name)
    
    return name


def find_semantic_match(
    candidate_artifact: Dict[str, Any],
    repository_index: List[RepositoryArtifact]
) -> Optional[RepositoryArtifact]:
    """
    Find semantically matching artifact in repository.
    
    Matches based on normalized base name, ignoring version suffixes.
    This prevents creating ObjectiveBlockV2.tsx when ObjectiveBlock.tsx exists.
    
    Args:
        candidate_artifact: Candidate artifact data with 'filename' key
        repository_index: List of existing repository artifacts
        
    Returns:
        Matching RepositoryArtifact or None if no match found
    """
    candidate_filename = candidate_artifact.get('filename', '')
    if not candidate_filename:
        return None
    
    candidate_base = normalize_artifact_name(candidate_filename)
    
    # Find artifact with matching base name
    for existing in repository_index:
        if existing.base_name == candidate_base:
            return existing
    
    return None


def artifacts_are_identical(
    candidate_content: str,
    existing_artifact: RepositoryArtifact
) -> bool:
    """
    Check if candidate content is identical to existing artifact.
    
    Args:
        candidate_content: Content of candidate artifact
        existing_artifact: Existing artifact to compare against
        
    Returns:
        True if content hashes match
    """
    candidate_hash = hashlib.sha256(candidate_content.encode('utf-8')).hexdigest()
    return candidate_hash == existing_artifact.content_hash


def can_extend_artifact(
    candidate_artifact: Dict[str, Any],
    existing_artifact: RepositoryArtifact
) -> bool:
    """
    Check if candidate can extend existing artifact.
    
    Extension is appropriate when candidate adds new functionality
    without replacing core implementation.
    
    Args:
        candidate_artifact: Candidate artifact data
        existing_artifact: Existing artifact to potentially extend
        
    Returns:
        True if candidate can extend existing
    """
    # For now, extension is only for adding new exports/variants
    # This is a simplified heuristic - could be enhanced with AST analysis
    candidate_filename = candidate_artifact.get('filename', '')
    
    # Check if candidate has variant indicator (e.g., ObjectiveBlock.variant.tsx)
    if '.variant.' in candidate_filename or '-variant.' in candidate_filename:
        return True
    
    return False


def can_update_artifact(
    candidate_artifact: Dict[str, Any],
    existing_artifact: RepositoryArtifact
) -> bool:
    """
    Check if candidate can update existing artifact.
    
    Update is appropriate when candidate replaces or improves
    the existing implementation.
    
    Args:
        candidate_artifact: Candidate artifact data
        existing_artifact: Existing artifact to potentially update
        
    Returns:
        True if candidate can update existing
    """
    # If semantic match exists and not identical, update is default action
    # unless extension is more appropriate
    return not can_extend_artifact(candidate_artifact, existing_artifact)


def build_placement_manifest(
    workflow_id: str,
    candidate: Dict[str, Any],
    repository_index: List[RepositoryArtifact]
) -> PlacementManifest:
    """
    Build placement manifest for candidate package.
    
    Implements canonical artifact policy:
    - ADD: New artifact, no semantic match in repository
    - UPDATE: Replace existing artifact with candidate
    - EXTEND: Add to existing artifact family
    - REUSE: Candidate identical to existing, no changes needed
    - REJECT: Candidate does not meet quality/compatibility criteria
    
    Args:
        workflow_id: Workflow ID this manifest belongs to
        candidate: Candidate package data with 'artifacts' list
        repository_index: List of existing repository artifacts
        
    Returns:
        PlacementManifest with placement decisions
    """
    placements: List[ArtifactPlacement] = []
    rejected: List[ArtifactPlacement] = []
    
    candidate_artifacts = candidate.get('artifacts', [])
    
    for candidate_artifact in candidate_artifacts:
        candidate_path = candidate_artifact.get('filename', '')
        candidate_content = candidate_artifact.get('content', '')
        
        if not candidate_path:
            # Reject artifacts without filename
            rejected.append(ArtifactPlacement(
                candidate_path="<unknown>",
                action=PlacementAction.REJECT,
                target_path="",
                reason="No filename provided",
                requires_approval=False
            ))
            continue
        
        # Find semantic match in repository
        existing = find_semantic_match(candidate_artifact, repository_index)
        
        if existing is None:
            # No match found - ADD
            action = PlacementAction.ADD
            target_path = candidate_path
            reason = f"New artifact, no existing match for {normalize_artifact_name(candidate_path)}"
            existing_hash = None
            
        elif artifacts_are_identical(candidate_content, existing):
            # Identical - REUSE
            action = PlacementAction.REUSE
            target_path = existing.path
            reason = f"Identical to existing artifact at {existing.path}"
            existing_hash = existing.content_hash
            
        elif can_extend_artifact(candidate_artifact, existing):
            # Can extend - EXTEND
            action = PlacementAction.EXTEND
            target_path = existing.path
            reason = f"Extends existing artifact at {existing.path}"
            existing_hash = existing.content_hash
            
        elif can_update_artifact(candidate_artifact, existing):
            # Can update - UPDATE
            action = PlacementAction.UPDATE
            target_path = existing.path
            reason = f"Updates existing artifact at {existing.path}"
            existing_hash = existing.content_hash
            
        else:
            # Cannot place - REJECT
            action = PlacementAction.REJECT
            target_path = ""
            reason = f"Cannot determine appropriate placement for {candidate_path}"
            existing_hash = None
        
        placement = ArtifactPlacement(
            candidate_path=candidate_path,
            action=action,
            target_path=target_path,
            reason=reason,
            requires_approval=action != PlacementAction.REUSE,
            existing_artifact_hash=existing_hash
        )
        
        if action == PlacementAction.REJECT:
            rejected.append(placement)
        else:
            placements.append(placement)
    
    # Create manifest
    manifest = PlacementManifest(
        workflow_id=workflow_id,
        placements=placements,
        rejected=rejected,
        status="PENDING_APPROVAL" if placements else "REJECTED"
    )
    
    # Compute manifest hash
    manifest_json = manifest.model_dump_json(exclude={'manifest_hash'}, indent=2)
    computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    manifest.manifest_hash = computed_hash
    
    return manifest


def build_repository_index(snapshot: Dict[str, Any]) -> List[RepositoryArtifact]:
    """
    Build repository artifact index from snapshot.
    
    Args:
        snapshot: Repository snapshot data
        
    Returns:
        List of RepositoryArtifact objects
    """
    artifacts: List[RepositoryArtifact] = []
    
    # Extract artifacts from snapshot evidence
    evidence_list = snapshot.get('evidence', [])
    
    for evidence in evidence_list:
        path = evidence.get('path', '')
        if not path:
            continue
        
        filename = Path(path).name
        base_name = normalize_artifact_name(filename)
        content_hash = evidence.get('hash', '')
        kind = evidence.get('kind', 'unknown')
        
        artifacts.append(RepositoryArtifact(
            path=path,
            base_name=base_name,
            content_hash=content_hash,
            artifact_type=kind
        ))
    
    return artifacts
