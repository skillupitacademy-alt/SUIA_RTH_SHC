"""
Tests for Artifact Policy - M2.9 Wave 3C
"""

import pytest
from typing import Dict, Any, List

from app.placement.artifact_policy import (
    normalize_artifact_name,
    build_repository_index,
    find_semantic_match,
    determine_action,
    get_target_path,
    RepositoryArtifact,
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
        action = determine_action(
            candidate_content="new content",
            candidate_filename="NewBlock.tsx",
            repository_match=None
        )
        
        assert action == PlacementDecision.ADD
    
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
        
        action = determine_action(
            candidate_content=content,
            candidate_filename="ObjectiveBlockV2.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.REUSE
    
    def test_extend_variant_indicator(self):
        """Test EXTEND action when variant indicator present."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        action = determine_action(
            candidate_content="variant content",
            candidate_filename="ObjectiveBlock.variant.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.EXTEND
    
    def test_extend_variant_dash_indicator(self):
        """Test EXTEND action with dash variant indicator."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        action = determine_action(
            candidate_content="variant content",
            candidate_filename="ObjectiveBlock-variant-dark.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.EXTEND
    
    def test_update_different_content(self):
        """Test UPDATE action when content differs (duplicate prevention)."""
        repository_match = RepositoryArtifact(
            path="packages/ui/src/tutorial/blocks/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        # ObjectiveBlockV2 with different content → UPDATE (not ADD)
        action = determine_action(
            candidate_content="updated content",
            candidate_filename="ObjectiveBlockV2.tsx",
            repository_match=repository_match
        )
        
        assert action == PlacementDecision.UPDATE


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
        action = determine_action(candidate_content, candidate_filename, match)
        assert action == PlacementDecision.UPDATE
        
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
            
            action = determine_action("new content", candidate_filename, match)
            assert action == PlacementDecision.UPDATE, f"Wrong action for {candidate_filename}"
            
            target_path = get_target_path(action, candidate_filename, match)
            assert target_path == "packages/ui/src/tutorial/blocks/Introduction.tsx", \
                f"Wrong target path for {candidate_filename}"
