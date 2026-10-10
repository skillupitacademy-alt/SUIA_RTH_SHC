"""
Tests for Artifact Policy - M2.9 Wave 3C + W3C Canonical Artifact Policy
"""

import hashlib
import pytest
from typing import Dict, Any, List

from app.placement.artifact_policy import (
    normalize_artifact_name,
    build_repository_index,
    find_semantic_match,
    determine_action,
    get_target_path,
    detect_content_duplicates,
    is_content_duplicate,
    detect_version_conflicts,
    select_canonical_artifact,
    resolve_version_conflict,
    format_rejection_message,
    load_canonical_registry,
    find_canonical_artifact,
    should_create_new_artifact,
    compute_artifact_graph,
    get_artifact_lineage,
    RepositoryArtifact,
    RejectionReason,
    VersionConflict,
    CanonicalArtifactRegistry,
)
from app.models.candidate import PlacementDecision


class TestNormalizeArtifactName:
    """Test artifact name normalization."""
    
    def test_uppercase_version_suffix(self):
        """Test removal of uppercase version suffix (V2, V3, V10)."""
        assert normalize_artifact_name("ObjectiveBlockV2.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlockV3.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlockV10.tsx") == "ObjectiveBlock"
    
    def test_lowercase_version_suffix(self):
        """Test removal of lowercase version suffix (v2, v3)."""
        assert normalize_artifact_name("ObjectiveBlockv2.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlockv3.tsx") == "ObjectiveBlock"
    
    def test_underscore_version_suffix(self):
        """Test removal of underscore version suffix (_v2, _V2)."""
        assert normalize_artifact_name("ObjectiveBlock_v2.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock_V2.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock_v3.tsx") == "ObjectiveBlock"
    
    def test_variant_indicator_removal(self):
        """Test removal of variant indicators (.variant., -variant-)."""
        assert normalize_artifact_name("ObjectiveBlock.variant.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock-variant-dark.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock_variant.tsx") == "ObjectiveBlock"
    
    def test_no_version_suffix(self):
        """Test normalization of filenames without version suffixes."""
        assert normalize_artifact_name("ObjectiveBlock.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("Introduction.tsx") == "Introduction"
    
    def test_file_extensions(self):
        """Test removal of different file extensions."""
        assert normalize_artifact_name("ObjectiveBlock.tsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock.ts") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock.jsx") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock.js") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock.css") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock.json") == "ObjectiveBlock"
        assert normalize_artifact_name("ObjectiveBlock.md") == "ObjectiveBlock"
    
    def test_complex_cases(self):
        """Test complex normalization cases."""
        # Version + variant
        assert normalize_artifact_name("ObjectiveBlockV2.variant.tsx") == "ObjectiveBlock"
        # Underscore + lowercase v
        assert normalize_artifact_name("Introduction_v3.tsx") == "Introduction"
        # Multiple patterns
        assert normalize_artifact_name("AssessmentBlock-variant-V2.tsx") == "AssessmentBlock"


class TestBuildRepositoryIndex:
    """Test repository index building from snapshot."""
    
    def test_empty_snapshot(self):
        """Test building index from empty snapshot."""
        snapshot = {"evidence": []}
        index = build_repository_index(snapshot)
        assert index == []
    
    def test_snapshot_with_files(self):
        """Test building index from snapshot with file evidence."""
        snapshot = {
            "evidence": [
                {
                    "type": "component",
                    "path": "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
                    "contentHash": "abc123",
                    "hash": "abc123"
                },
                {
                    "type": "schema",
                    "path": "packages/ui/src/tutorial/schemas/ObjectiveSchema.ts",
                    "contentHash": "def456"
                },
            ]
        }
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 2
        assert index[0].path == "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx"
        assert index[0].base_name == "ObjectiveBlock"
        assert index[0].content_hash == "abc123"
        assert index[0].artifact_type == "component"
        
        assert index[1].path == "packages/ui/src/tutorial/schemas/ObjectiveSchema.ts"
        assert index[1].base_name == "ObjectiveSchema"
        assert index[1].content_hash == "def456"
    
    def test_snapshot_with_version_suffixes(self):
        """Test building index normalizes version suffixes."""
        snapshot = {
            "evidence": [
                {
                    "type": "component",
                    "path": "packages/ui/src/tutorial/blocks/ObjectiveBlockV2.tsx",
                    "contentHash": "abc123"
                }
            ]
        }
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 1
        assert index[0].base_name == "ObjectiveBlock"
    
    def test_snapshot_without_evidence_key(self):
        """Test handling snapshot without evidence key."""
        snapshot = {}
        index = build_repository_index(snapshot)
        assert index == []


class TestFindSemanticMatch:
    """Test semantic matching between candidate and repository."""
    
    def test_exact_match(self):
        """Test exact basename match."""
        repository_index = [
            RepositoryArtifact(
                path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        match = find_semantic_match("ObjectiveBlock.tsx", repository_index)
        
        assert match is not None
        assert match.base_name == "ObjectiveBlock"
    
    def test_version_suffix_match(self):
        """Test matching with version suffix normalization."""
        repository_index = [
            RepositoryArtifact(
                path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        # ObjectiveBlockV2 should match ObjectiveBlock (same base name)
        match = find_semantic_match("ObjectiveBlockV2.tsx", repository_index)
        
        assert match is not None
        assert match.base_name == "ObjectiveBlock"
        assert match.path == "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx"
    
    def test_no_match(self):
        """Test when no semantic match exists."""
        repository_index = [
            RepositoryArtifact(
                path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        match = find_semantic_match("IntroductionBlock.tsx", repository_index)
        
        assert match is None
    
    def test_empty_repository(self):
        """Test matching against empty repository."""
        repository_index = []
        
        match = find_semantic_match("ObjectiveBlock.tsx", repository_index)
        
        assert match is None


class TestDetermineAction:
    """Test placement action determination."""
    
    def test_add_no_repository_match(self):
        """Test ADD action when no repository match exists."""
        action, reason = determine_action(
            candidate_content="new content",
            candidate_filename="NewBlock.tsx",
            repository_match=None
        )
        
        assert action == PlacementDecision.ADD
        assert reason is None
    
    def test_reuse_identical_content(self):
        """Test REUSE action when content hash matches."""
        content = "existing content"
        content_hash = "131fc6fe7a8464937c72db19863b153ad1ac1b534889ca7dbfc69cfd08088335"  # Correct SHA-256
        
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash=content_hash,
            artifact_type="component"
        )
        
        action, reason = determine_action(
            candidate_content=content,
            candidate_filename="ObjectiveBlockV2.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.REUSE
        assert reason is None
    
    def test_extend_variant_indicator(self):
        """Test EXTEND action when variant indicator present."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        action, reason = determine_action(
            candidate_content="variant content",
            candidate_filename="ObjectiveBlock.variant.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.EXTEND
        assert reason is None
    
    def test_extend_variant_dash_indicator(self):
        """Test EXTEND action with dash variant indicator."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        action, reason = determine_action(
            candidate_content="variant content",
            candidate_filename="ObjectiveBlock-variant-dark.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.EXTEND
        assert reason is None
    
    def test_update_different_content(self):
        """Test UPDATE action when content differs (duplicate prevention)."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        # ObjectiveBlockV2 with different content → UPDATE (not ADD)
        action, reason = determine_action(
            candidate_content="updated content",
            candidate_filename="ObjectiveBlockV2.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.UPDATE
        assert reason is None


class TestGetTargetPath:
    """Test target path determination."""
    
    def test_add_uses_candidate_path(self):
        """Test ADD action uses candidate path."""
        target_path = get_target_path(
            action=PlacementDecision.ADD,
            candidate_path="packages/ui/src/tutorial/blocks/NewBlock.tsx",
            repository_match=None
        )
        
        assert target_path == "packages/ui/src/tutorial/blocks/NewBlock.tsx"
    
    def test_update_uses_repository_path(self):
        """Test UPDATE action uses repository path."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        target_path = get_target_path(
            action=PlacementDecision.UPDATE,
            candidate_path="packages/ui/src/tutorial/blocks/ObjectiveBlockV2.tsx",
            repository_match=repository_match
        )
        
        assert target_path == "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx"
    
    def test_extend_uses_repository_path(self):
        """Test EXTEND action uses repository path."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        target_path = get_target_path(
            action=PlacementDecision.EXTEND,
            candidate_path="packages/ui/src/tutorial/blocks/ObjectiveBlock.variant.tsx",
            repository_match=repository_match
        )
        
        assert target_path == "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx"
    
    def test_reuse_uses_repository_path(self):
        """Test REUSE action uses repository path."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        target_path = get_target_path(
            action=PlacementDecision.REUSE,
            candidate_path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            repository_match=repository_match
        )
        
        assert target_path == "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx"
    
    def test_reject_empty_path(self):
        """Test REJECT action returns empty path."""
        target_path = get_target_path(
            action=PlacementDecision.REJECT,
            candidate_path="packages/ui/src/tutorial/blocks/BadBlock.tsx",
            repository_match=None
        )
        
        assert target_path == ""


class TestDuplicatePrevention:
    """Test duplicate prevention logic (ObjectiveBlockV2 → UPDATE ObjectiveBlock)."""
    
    def test_versioned_duplicate_prevention(self):
        """Test that ObjectiveBlockV2.tsx updates ObjectiveBlock.tsx instead of creating new file."""
        # Repository contains ObjectiveBlock.tsx
        repository_index = [
            RepositoryArtifact(
                path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="original_hash",
                artifact_type="component"
            )
        ]
        
        # Candidate is ObjectiveBlockV2.tsx with different content
        candidate_filename = "ObjectiveBlockV2.tsx"
        candidate_content = "updated content different from original"
        
        # Find semantic match
        match = find_semantic_match(candidate_filename, repository_index)
        assert match is not None
        assert match.base_name == "ObjectiveBlock"
        
        # Determine action
        action, reason = determine_action(candidate_content, candidate_filename, match)
        assert action == PlacementDecision.UPDATE
        assert reason is None
        
        # Get target path
        target_path = get_target_path(action, candidate_filename, match)
        assert target_path == "packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx"
        
        # Verify: ObjectiveBlockV2.tsx does NOT create new file, it UPDATES ObjectiveBlock.tsx
    
    def test_multiple_version_suffix_patterns(self):
        """Test duplicate prevention works with various version suffix patterns."""
        repository_index = [
            RepositoryArtifact(
                path="packages/ui/src/tutorial/blocks/Introduction.tsx",
                base_name="Introduction",
                content_hash="original_hash",
                artifact_type="component"
            )
        ]
        
        # All these candidates should UPDATE Introduction.tsx (not create new files)
        test_cases = [
            "IntroductionV2.tsx",
            "IntroductionV3.tsx",
            "Introduction_v2.tsx",
            "Introduction_V2.tsx",
            "Introductionv2.tsx",
        ]
        
        for candidate_filename in test_cases:
            match = find_semantic_match(candidate_filename, repository_index)
            assert match is not None, f"Failed to match {candidate_filename}"
            
            action, reason = determine_action("new content", candidate_filename, match)
            assert action == PlacementDecision.UPDATE, f"Wrong action for {candidate_filename}"
            assert reason is None
            
            target_path = get_target_path(action, candidate_filename, match)
            assert target_path == "packages/ui/src/tutorial/blocks/Introduction.tsx", \
                f"Wrong target path for {candidate_filename}"


class TestContentDuplicateDetection:
    """Test W3C content-based duplicate detection (FEAT-001)."""
    
    def test_detect_no_duplicates_empty_repository(self):
        """Test empty repository returns empty dict."""
        repository_index = []
        duplicates = detect_content_duplicates(repository_index)
        assert duplicates == {}
    
    def test_detect_no_duplicates_unique_content(self):
        """Test unique content artifacts return empty dict."""
        repository_index = [
            RepositoryArtifact("path1.tsx", "Block1", "abc123", "component"),
            RepositoryArtifact("path2.tsx", "Block2", "def456", "component"),
        ]
        duplicates = detect_content_duplicates(repository_index)
        assert duplicates == {}
    
    def test_detect_single_duplicate(self):
        """Test two artifacts with same hash returns dict with 1 entry."""
        repository_index = [
            RepositoryArtifact("path1.tsx", "Block", "abc123", "component"),
            RepositoryArtifact("path2.tsx", "Block", "abc123", "component"),
        ]
        duplicates = detect_content_duplicates(repository_index)
        assert len(duplicates) == 1
        assert "abc123" in duplicates
        assert len(duplicates["abc123"]) == 2
    
    def test_detect_multiple_duplicate_groups(self):
        """Test 6 artifacts with 2 duplicate groups returns dict with 2 entries."""
        repository_index = [
            RepositoryArtifact("path1.tsx", "Block1", "hash1", "component"),
            RepositoryArtifact("path2.tsx", "Block1Dup", "hash1", "component"),
            RepositoryArtifact("path3.tsx", "Block2", "hash2", "component"),
            RepositoryArtifact("path4.tsx", "Block2Dup", "hash2", "component"),
            RepositoryArtifact("path5.tsx", "Block3", "hash3", "component"),
            RepositoryArtifact("path6.tsx", "Block4", "hash4", "component"),
        ]
        duplicates = detect_content_duplicates(repository_index)
        assert len(duplicates) == 2
        assert len(duplicates["hash1"]) == 2
        assert len(duplicates["hash2"]) == 2
    
    def test_reject_content_duplicate_different_filename(self):
        """Test candidate with same content, different name → REJECT."""
        content = "const Block = () => {}"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        repository_index = [
            RepositoryArtifact(
                "packages/ui/src/blocks/ObjectiveBlock.tsx",
                "ObjectiveBlock",
                content_hash,
                "component"
            )
        ]
        
        # Candidate with same content but completely different name
        candidate_filename = "CompleteDifferentName.tsx"
        
        action, reason = determine_action(
            candidate_content=content,
            candidate_filename=candidate_filename,
            repository_match=None,
            repository_index=repository_index
        )
        
        assert action == PlacementDecision.REJECT
        assert reason is not None
        assert reason.reason_code == "CONTENT_DUPLICATE"
        assert "ObjectiveBlock.tsx" in reason.conflicting_artifacts[0]
    
    def test_is_content_duplicate_finds_match(self):
        """Test is_content_duplicate detects duplicates."""
        content = "const Block = () => {}"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        repository_index = [
            RepositoryArtifact("path.tsx", "Block", content_hash, "component")
        ]
        
        matches = is_content_duplicate(content, repository_index)
        assert matches is not None
        assert len(matches) == 1
        assert matches[0].path == "path.tsx"
    
    def test_is_content_duplicate_no_match(self):
        """Test is_content_duplicate returns None when no match."""
        repository_index = [
            RepositoryArtifact("path.tsx", "Block", "different_hash", "component")
        ]
        
        matches = is_content_duplicate("const Block = () => {}", repository_index)
        assert matches is None


class TestVersionConflictResolution:
    """Test W3C version conflict resolution (FEAT-002)."""
    
    def test_detect_version_conflicts_no_conflicts(self):
        """Test unique artifacts return empty list."""
        repository_index = [
            RepositoryArtifact("Block1.tsx", "Block1", "abc", "component"),
            RepositoryArtifact("Block2.tsx", "Block2", "def", "component"),
        ]
        conflicts = detect_version_conflicts(repository_index)
        assert len(conflicts) == 0
    
    def test_detect_version_conflicts_multiple_versions(self):
        """Test ObjectiveBlock + ObjectiveBlockV2 detected as conflict."""
        repository_index = [
            RepositoryArtifact(
                "Block.tsx", "Block", "abc", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
            RepositoryArtifact(
                "BlockV2.tsx", "Block", "def", "component",
                created_at="2024-01-02T10:00:00Z"
            ),
        ]
        conflicts = detect_version_conflicts(repository_index)
        assert len(conflicts) == 1
        assert conflicts[0].base_name == "Block"
        assert conflicts[0].conflict_type == "CONTENT_CONFLICT"
        assert len(conflicts[0].artifacts) == 2
    
    def test_select_canonical_earliest_timestamp(self):
        """Test earliest timestamp wins."""
        artifacts = [
            RepositoryArtifact(
                "Block1.tsx", "Block", "abc", "component",
                created_at="2024-01-02T10:00:00Z"
            ),
            RepositoryArtifact(
                "Block2.tsx", "Block", "def", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "Block2.tsx"
        assert canonical.created_at == "2024-01-01T10:00:00Z"
    
    def test_select_canonical_timestamp_tie_shortest_path(self):
        """Test tie broken by path length."""
        artifacts = [
            RepositoryArtifact(
                "long/path/to/Block.tsx", "Block", "abc", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
            RepositoryArtifact(
                "short/Block.tsx", "Block", "def", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "short/Block.tsx"
    
    def test_select_canonical_full_tie_alphabetical(self):
        """Test full tie broken alphabetically."""
        artifacts = [
            RepositoryArtifact(
                "path/BlockZ.tsx", "Block", "abc", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
            RepositoryArtifact(
                "path/BlockA.tsx", "Block", "def", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
        ]
        canonical = select_canonical_artifact(artifacts)
        assert canonical.path == "path/BlockA.tsx"
    
    def test_resolve_conflict_sets_canonical(self):
        """Test conflict resolution identifies canonical artifact."""
        artifacts = [
            RepositoryArtifact(
                "Block.tsx", "Block", "abc", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
            RepositoryArtifact(
                "BlockV2.tsx", "Block", "def", "component",
                created_at="2024-01-02T10:00:00Z"
            ),
        ]
        conflict = VersionConflict("Block", artifacts, "CONTENT_CONFLICT", "UNRESOLVED")
        resolved = resolve_version_conflict(conflict)
        
        assert resolved.resolution == "CANONICAL_SELECTED"
        assert resolved.canonical_artifact is not None
        assert resolved.canonical_artifact.path == "Block.tsx"


class TestRejectionPolicy:
    """Test W3C enhanced rejection policy (FEAT-003)."""
    
    def test_rejection_reason_has_all_fields(self):
        """Test RejectionReason contains code, message, conflicts, action."""
        reason = RejectionReason(
            reason_code="CONTENT_DUPLICATE",
            message="Identical content already exists",
            conflicting_artifacts=["path/Block.tsx"],
            recommended_action="Update existing artifact"
        )
        
        assert reason.reason_code == "CONTENT_DUPLICATE"
        assert reason.message == "Identical content already exists"
        assert len(reason.conflicting_artifacts) == 1
        assert reason.recommended_action == "Update existing artifact"
    
    def test_format_rejection_message_readable(self):
        """Test formatted message is human-readable."""
        reason = RejectionReason(
            reason_code="CONTENT_DUPLICATE",
            message="Identical content already exists",
            conflicting_artifacts=["path/Block.tsx", "path/BlockDup.tsx"],
            recommended_action="Update existing artifact"
        )
        
        msg = format_rejection_message(reason)
        
        assert "CONTENT_DUPLICATE" in msg
        assert "Identical content already exists" in msg
        assert "path/Block.tsx" in msg
        assert "path/BlockDup.tsx" in msg
        assert "Update existing artifact" in msg
    
    def test_backward_compatibility_ignore_reason(self):
        """Test existing code ignoring reason still works."""
        # Old code pattern: only use first element of tuple
        action, _ = determine_action(
            candidate_content="new content",
            candidate_filename="NewBlock.tsx",
            repository_match=None
        )
        
        assert action == PlacementDecision.ADD
        # No error when ignoring second tuple element


class TestProvenanceTracking:
    """Test W3C provenance metadata tracking (FEAT-004)."""
    
    def test_provenance_fields_optional(self):
        """Test RepositoryArtifact works without provenance fields."""
        artifact = RepositoryArtifact(
            path="Block.tsx",
            base_name="Block",
            content_hash="abc123",
            artifact_type="component"
        )
        
        assert artifact.path == "Block.tsx"
        assert artifact.created_at is None
        assert artifact.last_modified_at is None
        assert artifact.references is None
    
    def test_extract_provenance_from_snapshot(self):
        """Test build_repository_index extracts timestamps."""
        snapshot = {
            "evidence": [
                {
                    "type": "component",
                    "path": "Block.tsx",
                    "contentHash": "abc123",
                    "createdAt": "2024-01-01T10:00:00Z",
                    "lastModifiedAt": "2024-01-02T10:00:00Z",
                    "references": ["OtherBlock.tsx"]
                }
            ]
        }
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 1
        assert index[0].created_at == "2024-01-01T10:00:00Z"
        assert index[0].last_modified_at == "2024-01-02T10:00:00Z"
        assert index[0].references == ["OtherBlock.tsx"]
    
    def test_compute_artifact_graph_nodes_edges(self):
        """Test graph has correct nodes and edges."""
        artifacts = [
            RepositoryArtifact("A.tsx", "A", "abc", "component", references=["B.tsx"]),
            RepositoryArtifact("B.tsx", "B", "def", "component")
        ]
        
        graph = compute_artifact_graph(artifacts)
        
        assert len(graph["nodes"]) == 2
        assert len(graph["edges"]) == 1
        assert graph["edges"][0]["from"] == "A.tsx"
        assert graph["edges"][0]["to"] == "B.tsx"
    
    def test_get_artifact_lineage_traces_history(self):
        """Test lineage follows supersedes chain."""
        a1 = RepositoryArtifact("v1.tsx", "Block", "abc", "component")
        a2 = RepositoryArtifact("v2.tsx", "Block", "def", "component", supersedes="v1.tsx")
        a3 = RepositoryArtifact("v3.tsx", "Block", "ghi", "component", supersedes="v2.tsx")
        
        lineage = get_artifact_lineage(a3, [a1, a2, a3])
        
        assert len(lineage) == 3
        assert lineage[0].path == "v1.tsx"
        assert lineage[1].path == "v2.tsx"
        assert lineage[2].path == "v3.tsx"
    
    def test_lineage_handles_circular_reference(self):
        """Test lineage handles circular references without infinite loop."""
        a1 = RepositoryArtifact("v1.tsx", "Block", "abc", "component", supersedes="v2.tsx")
        a2 = RepositoryArtifact("v2.tsx", "Block", "def", "component", supersedes="v1.tsx")
        
        lineage = get_artifact_lineage(a2, [a1, a2])
        
        # Should stop at circular reference detection
        assert len(lineage) >= 1


class TestCanonicalRegistry:
    """Test W3C canonical artifact registry integration (FEAT-005)."""
    
    def test_load_registry_missing_file(self):
        """Test missing file returns empty list, logs warning."""
        registry = load_canonical_registry("nonexistent/path.md")
        assert registry == []
    
    def test_find_canonical_artifact_exact_match(self):
        """Test exact purpose match found."""
        registry = [
            CanonicalArtifactRegistry(
                "M2 Backlog",
                ".agents/tasks/backlog.md",
                "M2 requirements"
            )
        ]
        
        path = find_canonical_artifact("M2 requirements", registry)
        assert path == ".agents/tasks/backlog.md"
    
    def test_find_canonical_artifact_fuzzy_match(self):
        """Test partial purpose match found."""
        registry = [
            CanonicalArtifactRegistry(
                "Block Registry",
                ".agents/docs/registry.md",
                "Educational block families"
            )
        ]
        
        path = find_canonical_artifact("block families", registry)
        assert path == ".agents/docs/registry.md"
    
    def test_should_create_semantic_match_blocks(self):
        """Test semantic match prevents creation."""
        artifacts = [
            RepositoryArtifact("Block.tsx", "Block", "abc123", "component")
        ]
        
        should_create, reason = should_create_new_artifact(
            "BlockV2.tsx", "content", artifacts, []
        )
        
        assert not should_create
        assert "Semantic match found" in reason
    
    def test_should_create_content_duplicate_blocks(self):
        """Test content duplicate prevents creation."""
        content = "const Block = () => {}"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        artifacts = [
            RepositoryArtifact("OtherName.tsx", "OtherName", content_hash, "component")
        ]
        
        should_create, reason = should_create_new_artifact(
            "NewName.tsx", content, artifacts, []
        )
        
        assert not should_create
        assert "Content duplicate" in reason
    
    def test_should_create_allows_new_artifact(self):
        """Test new unique artifact allowed."""
        artifacts = [
            RepositoryArtifact("Block1.tsx", "Block1", "abc123", "component")
        ]
        
        should_create, reason = should_create_new_artifact(
            "Block2.tsx", "unique content", artifacts, []
        )
        
        assert should_create
        assert reason == ""


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_same_timestamp_multiple_artifacts(self):
        """Test deterministic selection with identical timestamps."""
        artifacts = [
            RepositoryArtifact(
                "z/Block.tsx", "Block", "abc", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
            RepositoryArtifact(
                "a/Block.tsx", "Block", "def", "component",
                created_at="2024-01-01T10:00:00Z"
            ),
        ]
        
        canonical = select_canonical_artifact(artifacts)
        # Should pick "a/Block.tsx" (alphabetically first when timestamps tie)
        assert canonical.path == "a/Block.tsx"
    
    def test_malformed_snapshot_evidence(self):
        """Test malformed evidence handled gracefully."""
        snapshot = {
            "evidence": [
                {"type": "component"},  # Missing path and hash
                {"path": "Block.tsx"},  # Missing type and hash
                None,  # Null entry
            ]
        }
        
        # Should not crash
        index = build_repository_index(snapshot)
        assert len(index) == 0
    
    def test_select_canonical_empty_list_raises(self):
        """Test select_canonical_artifact raises on empty list."""
        with pytest.raises(ValueError):
            select_canonical_artifact([])
    
    def test_lineage_max_depth_protection(self):
        """Test lineage handles very long chains with max depth."""
        # Create chain longer than max_depth
        artifacts = []
        for i in range(150):
            supersedes = f"v{i-1}.tsx" if i > 0 else None
            artifacts.append(
                RepositoryArtifact(
                    f"v{i}.tsx", "Block", f"hash{i}", "component",
                    supersedes=supersedes
                )
            )
        
        # Should stop at max_depth (100)
        lineage = get_artifact_lineage(artifacts[-1], artifacts, max_depth=100)
        assert len(lineage) <= 101  # max_depth + 1 (starting artifact)
