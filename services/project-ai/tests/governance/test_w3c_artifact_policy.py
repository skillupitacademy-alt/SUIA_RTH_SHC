"""
Tests for W3C Canonical Artifact Policy - Gate E-1

Comprehensive test suite covering:
- Duplicate submission rejection (same hash, different timestamp)
- Version conflict resolution (earliest timestamp wins)
- Canonical selection (timestamp ordering with tie-breaking)
- find_existing_duplicates functionality
- Hash collision scenarios
- Integration tests
- Edge cases (empty lists, single candidates, identical artifacts)
"""

import hashlib
import pytest
from typing import Dict, Any, List

from app.placement.artifact_policy import (
    detect_content_duplicates,
    is_content_duplicate,
    detect_version_conflicts,
    select_canonical_artifact,
    resolve_version_conflict,
    find_existing_duplicates,
    format_rejection_message,
    determine_action,
    RepositoryArtifact,
    RejectionReason,
    VersionConflict,
)
from app.models.candidate import PlacementDecision


class TestContentDuplicateDetection:
    """Test content-based duplicate detection using SHA-256 hash grouping."""
    
    def test_detect_no_duplicates_empty_repository(self):
        """Empty repository returns empty dict."""
        duplicates = detect_content_duplicates([])
        assert duplicates == {}
    
    def test_detect_no_duplicates_unique_content(self):
        """Unique content artifacts return empty dict."""
        artifacts = [
            RepositoryArtifact("path1.tsx", "Block1", "abc123", "component"),
            RepositoryArtifact("path2.tsx", "Block2", "def456", "component"),
            RepositoryArtifact("path3.tsx", "Block3", "ghi789", "component"),
        ]
        duplicates = detect_content_duplicates(artifacts)
        assert duplicates == {}
    
    def test_detect_single_duplicate_group(self):
        """Two artifacts with same hash returns dict with 1 entry."""
        artifacts = [
            RepositoryArtifact("path1.tsx", "Block", "abc123", "component"),
            RepositoryArtifact("path2.tsx", "BlockV2", "abc123", "component"),
            RepositoryArtifact("path3.tsx", "Other", "def456", "component"),
        ]
        duplicates = detect_content_duplicates(artifacts)
        assert len(duplicates) == 1
        assert "abc123" in duplicates
        assert len(duplicates["abc123"]) == 2
    
    def test_detect_multiple_duplicate_groups(self):
        """6 artifacts with 2 duplicate groups returns dict with 2 entries."""
        artifacts = [
            RepositoryArtifact("path1.tsx", "BlockA", "abc123", "component"),
            RepositoryArtifact("path2.tsx", "BlockAV2", "abc123", "component"),
            RepositoryArtifact("path3.tsx", "BlockB", "def456", "component"),
            RepositoryArtifact("path4.tsx", "BlockBV2", "def456", "component"),
            RepositoryArtifact("path5.tsx", "BlockC", "ghi789", "component"),
            RepositoryArtifact("path6.tsx", "BlockD", "jkl012", "component"),
        ]
        duplicates = detect_content_duplicates(artifacts)
        assert len(duplicates) == 2
        assert "abc123" in duplicates
        assert "def456" in duplicates
        assert len(duplicates["abc123"]) == 2
        assert len(duplicates["def456"]) == 2
    
    def test_is_content_duplicate_found(self):
        """Content duplicate detection returns matching artifacts."""
        content = "const Block = () => <div>Block</div>;"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        repository_index = [
            RepositoryArtifact("existing.tsx", "Block", content_hash, "component"),
        ]
        
        matches = is_content_duplicate(content, repository_index)
        assert matches is not None
        assert len(matches) == 1
        assert matches[0].path == "existing.tsx"
    
    def test_is_content_duplicate_not_found(self):
        """No content duplicate returns None."""
        content = "const Block = () => <div>Block</div>;"
        different_content_hash = "different_hash_value"
        
        repository_index = [
            RepositoryArtifact("existing.tsx", "Block", different_content_hash, "component"),
        ]
        
        matches = is_content_duplicate(content, repository_index)
        assert matches is None
    
    def test_reject_content_duplicate_different_filename(self):
        """Candidate with same content, different name → REJECT."""
        content = "const Block = () => <div>Block</div>;"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        repository_index = [
            RepositoryArtifact("packages/ui/BlockOriginal.tsx", "BlockOriginal", content_hash, "component"),
        ]
        
        # Candidate has same content but completely different name
        action, reason = determine_action(content, "DifferentName.tsx", None, repository_index)
        
        assert action == PlacementDecision.REJECT
        assert reason is not None
        assert reason.reason_code == "CONTENT_DUPLICATE"
        assert "BlockOriginal.tsx" in reason.conflicting_artifacts[0]


class TestVersionConflictResolution:
    """Test version conflict detection and resolution."""
    
    def test_detect_version_conflicts_no_conflicts(self):
        """Unique artifacts return empty list."""
        artifacts = [
            RepositoryArtifact("Block1.tsx", "Block1", "abc", "component"),
            RepositoryArtifact("Block2.tsx", "Block2", "def", "component"),
        ]
        conflicts = detect_version_conflicts(artifacts)
        assert conflicts == []
    
    def test_detect_version_conflicts_same_content_no_conflict(self):
        """Same base name, same content hash = no conflict."""
        artifacts = [
            RepositoryArtifact("path1/Block.tsx", "Block", "abc123", "component"),
            RepositoryArtifact("path2/BlockV2.tsx", "Block", "abc123", "component"),
        ]
        conflicts = detect_version_conflicts(artifacts)
        assert conflicts == []
    
    def test_detect_version_conflicts_different_content(self):
        """Same base name, different content = conflict detected."""
        artifacts = [
            RepositoryArtifact("Block.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("BlockV2.tsx", "Block", "def", "component", created_at="2024-01-02T10:00:00Z"),
        ]
        conflicts = detect_version_conflicts(artifacts)
        assert len(conflicts) == 1
        assert conflicts[0].base_name == "Block"
        assert conflicts[0].conflict_type == "CONTENT_CONFLICT"
        assert len(conflicts[0].artifacts) == 2
    
    def test_select_canonical_earliest_timestamp(self):
        """Earliest timestamp wins canonical selection."""
        artifacts = [
            RepositoryArtifact("Block.tsx", "Block", "abc", "component", created_at="2024-01-02T10:00:00Z"),
            RepositoryArtifact("BlockV2.tsx", "Block", "def", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("BlockV3.tsx", "Block", "ghi", "component", created_at="2024-01-03T10:00:00Z"),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "BlockV2.tsx"
        assert canonical.created_at == "2024-01-01T10:00:00Z"
    
    def test_select_canonical_timestamp_tie_shortest_path(self):
        """Tie broken by path length (fewer slashes = more central)."""
        artifacts = [
            RepositoryArtifact("long/path/here/Block.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("short/Block.tsx", "Block", "def", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("very/long/path/Block.tsx", "Block", "ghi", "component", created_at="2024-01-01T10:00:00Z"),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "short/Block.tsx"
        assert canonical.path.count('/') == 1
    
    def test_select_canonical_full_tie_alphabetical(self):
        """Full tie broken alphabetically."""
        artifacts = [
            RepositoryArtifact("path/BlockC.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("path/BlockA.tsx", "Block", "def", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("path/BlockB.tsx", "Block", "ghi", "component", created_at="2024-01-01T10:00:00Z"),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "path/BlockA.tsx"
    
    def test_select_canonical_no_timestamps_uses_path(self):
        """No timestamps: use path-based selection."""
        artifacts = [
            RepositoryArtifact("z/Block.tsx", "Block", "abc", "component"),
            RepositoryArtifact("a/Block.tsx", "Block", "def", "component"),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "a/Block.tsx"
    
    def test_resolve_conflict_sets_canonical(self):
        """Conflict resolution identifies canonical artifact."""
        artifacts = [
            RepositoryArtifact("Block.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("BlockV2.tsx", "Block", "def", "component", created_at="2024-01-02T10:00:00Z"),
        ]
        conflict = VersionConflict("Block", artifacts, "CONTENT_CONFLICT", "UNRESOLVED")
        
        resolved = resolve_version_conflict(conflict)
        
        assert resolved.resolution == "CANONICAL_SELECTED"
        assert resolved.canonical_artifact is not None
        assert resolved.canonical_artifact.path == "Block.tsx"
    
    def test_select_canonical_empty_list_raises(self):
        """Empty list raises ValueError."""
        with pytest.raises(ValueError, match="empty list"):
            select_canonical_artifact([])


class TestRejectionPolicy:
    """Test structured rejection reasons and formatting."""
    
    def test_rejection_reason_has_all_fields(self):
        """RejectionReason contains code, message, conflicts, action."""
        reason = RejectionReason(
            reason_code="CONTENT_DUPLICATE",
            message="Identical content exists",
            conflicting_artifacts=["path/Block.tsx"],
            recommended_action="Update existing artifact"
        )
        
        assert reason.reason_code == "CONTENT_DUPLICATE"
        assert reason.message == "Identical content exists"
        assert "path/Block.tsx" in reason.conflicting_artifacts
        assert reason.recommended_action == "Update existing artifact"
    
    def test_format_rejection_message_readable(self):
        """Formatted message is human-readable."""
        reason = RejectionReason(
            reason_code="CONTENT_DUPLICATE",
            message="Identical content exists",
            conflicting_artifacts=["path/Block.tsx", "path/BlockV2.tsx"],
            recommended_action="Update existing artifact at path/Block.tsx"
        )
        
        message = format_rejection_message(reason)
        
        assert "[CONTENT_DUPLICATE]" in message
        assert "Identical content exists" in message
        assert "path/Block.tsx" in message
        assert "path/BlockV2.tsx" in message
        assert "Update existing artifact" in message
    
    def test_backward_compatibility_ignore_reason(self):
        """Existing code ignoring reason still works."""
        content = "new content"
        filename = "NewBlock.tsx"
        
        # Old-style call (ignoring second return value)
        action, _ = determine_action(content, filename, None)
        
        assert action == PlacementDecision.ADD


class TestExistingDuplicatesFinder:
    """Test find_existing_duplicates migration helper."""
    
    def test_find_existing_duplicates_none(self):
        """Clean list returns empty dict."""
        artifacts = [
            RepositoryArtifact("path1.tsx", "Block1", "abc", "component"),
            RepositoryArtifact("path2.tsx", "Block2", "def", "component"),
        ]
        duplicates = find_existing_duplicates(artifacts)
        assert duplicates == {}
    
    def test_find_existing_duplicates_found(self):
        """Duplicates found returns hash → paths mapping."""
        artifacts = [
            RepositoryArtifact("path1.tsx", "Block", "abc123", "component"),
            RepositoryArtifact("path2.tsx", "BlockV2", "abc123", "component"),
            RepositoryArtifact("path3.tsx", "Other", "def456", "component"),
        ]
        duplicates = find_existing_duplicates(artifacts)
        
        assert len(duplicates) == 1
        assert "abc123" in duplicates
        assert set(duplicates["abc123"]) == {"path1.tsx", "path2.tsx"}


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_same_timestamp_multiple_artifacts(self):
        """Deterministic selection with identical timestamps."""
        artifacts = [
            RepositoryArtifact("path/C.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("path/A.tsx", "Block", "def", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("path/B.tsx", "Block", "ghi", "component", created_at="2024-01-01T10:00:00Z"),
        ]
        canonical = select_canonical_artifact(artifacts)
        # Should select alphabetically first
        assert canonical.path == "path/A.tsx"
    
    def test_single_artifact_is_canonical(self):
        """Single artifact is itself canonical."""
        artifacts = [
            RepositoryArtifact("Block.tsx", "Block", "abc", "component"),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "Block.tsx"
    
    def test_all_artifacts_identical_content(self):
        """All artifacts with identical content: no conflict detected."""
        artifacts = [
            RepositoryArtifact("path1/Block.tsx", "Block", "abc123", "component"),
            RepositoryArtifact("path2/Block.tsx", "Block", "abc123", "component"),
            RepositoryArtifact("path3/Block.tsx", "Block", "abc123", "component"),
        ]
        conflicts = detect_version_conflicts(artifacts)
        # Same content = no conflict
        assert conflicts == []
    
    def test_content_duplicate_same_base_name_not_rejected(self):
        """Same content, same base name (semantic match) → UPDATE, not rejected as duplicate."""
        content = "const Block = () => <div>Block</div>;"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        from app.placement.artifact_policy import find_semantic_match
        
        repository_index = [
            RepositoryArtifact("packages/ui/Block.tsx", "Block", content_hash, "component"),
        ]
        
        # BlockV2 has same base name as Block → semantic match
        semantic_match = find_semantic_match("BlockV2.tsx", repository_index)
        assert semantic_match is not None
        
        # With semantic match and identical content → REUSE
        action, reason = determine_action(content, "BlockV2.tsx", semantic_match, repository_index)
        
        assert action == PlacementDecision.REUSE
        assert reason is None


class TestIntegration:
    """Integration tests covering end-to-end workflows."""
    
    def test_integration_duplicate_prevention_workflow(self):
        """Upload ObjectiveBlock.tsx, then attempt ObjectiveBlockV2.tsx with same content."""
        content = "const ObjectiveBlock = () => <div>Objective</div>;"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        # Step 1: Repository has ObjectiveBlock.tsx
        repository_index = [
            RepositoryArtifact("packages/ui/blocks/ObjectiveBlock.tsx", "ObjectiveBlock", content_hash, "component"),
        ]
        
        # Step 2: Attempt to upload ObjectiveBlockV2.tsx with different name but same content
        candidate_filename = "DifferentBlock.tsx"  # Completely different name
        
        action, reason = determine_action(content, candidate_filename, None, repository_index)
        
        # Should REJECT because content is duplicate with different filename
        assert action == PlacementDecision.REJECT
        assert reason is not None
        assert reason.reason_code == "CONTENT_DUPLICATE"
    
    def test_integration_version_conflict_resolution_workflow(self):
        """Repository has ObjectiveBlock.tsx and ObjectiveBlockV2.tsx with different content."""
        repository_index = [
            RepositoryArtifact(
                "packages/ui/blocks/ObjectiveBlock.tsx",
                "ObjectiveBlock",
                "abc123",
                "component",
                created_at="2024-01-01T10:00:00Z"
            ),
            RepositoryArtifact(
                "packages/ui/blocks/ObjectiveBlockV2.tsx",
                "ObjectiveBlock",
                "def456",
                "component",
                created_at="2024-01-02T10:00:00Z"
            ),
        ]
        
        # Detect conflict
        conflicts = detect_version_conflicts(repository_index)
        assert len(conflicts) == 1
        
        # Resolve conflict
        conflict = conflicts[0]
        resolved = resolve_version_conflict(conflict)
        
        assert resolved.canonical_artifact.path == "packages/ui/blocks/ObjectiveBlock.tsx"
        assert resolved.resolution == "CANONICAL_SELECTED"
    
    def test_integration_canonical_selection_tie_breaking(self):
        """Multiple artifacts with same timestamp: tie-breaking by path."""
        artifacts = [
            RepositoryArtifact("very/deep/nested/path/Block.tsx", "Block", "abc", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("shallow/Block.tsx", "Block", "def", "component", created_at="2024-01-01T10:00:00Z"),
            RepositoryArtifact("another/deep/path/Block.tsx", "Block", "ghi", "component", created_at="2024-01-01T10:00:00Z"),
        ]
        
        canonical = select_canonical_artifact(artifacts)
        
        # Should select shallow/ (fewest slashes)
        assert canonical.path == "shallow/Block.tsx"
    
    def test_integration_no_duplicate_new_artifact_allowed(self):
        """New artifact with unique content → ADD."""
        content = "const NewBlock = () => <div>New</div>;"
        repository_index = [
            RepositoryArtifact("packages/ui/blocks/OldBlock.tsx", "OldBlock", "different_hash", "component"),
        ]
        
        action, reason = determine_action(content, "NewBlock.tsx", None, repository_index)
        
        assert action == PlacementDecision.ADD
        assert reason is None

