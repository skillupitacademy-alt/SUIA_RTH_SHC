"""Tests for canonical artifact placement policy."""

import pytest
from app.agents.placement_manifest import (
    PlacementAction,
    ArtifactPlacement,
    PlacementManifest,
    RepositoryArtifact,
    normalize_artifact_name,
    find_semantic_match,
    artifacts_are_identical,
    can_extend_artifact,
    can_update_artifact,
    build_placement_manifest,
    build_repository_index,
)


class TestNormalizeArtifactName:
    """Tests for artifact name normalization."""
    
    def test_removes_version_suffix_v2(self):
        """Should remove V2 suffix."""
        assert normalize_artifact_name("ObjectiveBlockV2.tsx") == "ObjectiveBlock"
    
    def test_removes_version_suffix_v3(self):
        """Should remove V3 suffix."""
        assert normalize_artifact_name("ObjectiveBlockV3.tsx") == "ObjectiveBlock"
    
    def test_removes_lowercase_version_suffix(self):
        """Should remove v2 suffix (lowercase)."""
        assert normalize_artifact_name("ObjectiveBlockv2.tsx") == "ObjectiveBlock"
    
    def test_removes_underscore_version_suffix(self):
        """Should remove _v2 suffix."""
        assert normalize_artifact_name("ObjectiveBlock_v2.tsx") == "ObjectiveBlock"
    
    def test_preserves_base_name_without_version(self):
        """Should preserve name without version suffix."""
        assert normalize_artifact_name("ObjectiveBlock.tsx") == "ObjectiveBlock"
    
    def test_handles_multiple_extensions(self):
        """Should handle files with multiple extensions."""
        assert normalize_artifact_name("ObjectiveBlock.test.tsx") == "ObjectiveBlock.test"
    
    def test_handles_different_file_types(self):
        """Should work for different file types."""
        assert normalize_artifact_name("QuizBlock.ts") == "QuizBlock"
        assert normalize_artifact_name("QuizBlockV2.json") == "QuizBlock"


class TestFindSemanticMatch:
    """Tests for semantic artifact matching."""
    
    def test_matches_same_base_name(self):
        """Should match artifacts with same base name."""
        candidate = {"filename": "ObjectiveBlockV2.tsx"}
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        match = find_semantic_match(candidate, repository_index)
        assert match is not None
        assert match.base_name == "ObjectiveBlock"
        assert match.path == "src/components/ObjectiveBlock.tsx"
    
    def test_no_match_for_different_base_name(self):
        """Should return None for different base name."""
        candidate = {"filename": "QuizBlock.tsx"}
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        match = find_semantic_match(candidate, repository_index)
        assert match is None
    
    def test_no_match_for_empty_index(self):
        """Should return None for empty repository index."""
        candidate = {"filename": "ObjectiveBlock.tsx"}
        repository_index = []
        
        match = find_semantic_match(candidate, repository_index)
        assert match is None
    
    def test_no_match_for_missing_filename(self):
        """Should return None when candidate has no filename."""
        candidate = {}
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        match = find_semantic_match(candidate, repository_index)
        assert match is None


class TestArtifactsAreIdentical:
    """Tests for artifact identity checking."""
    
    def test_identical_content(self):
        """Should return True for identical content."""
        content = "const ObjectiveBlock = () => <div>Test</div>;"
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  # Empty string hash for example
            artifact_type="component"
        )
        
        # We need to use actual hash
        import hashlib
        actual_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        artifact.content_hash = actual_hash
        
        assert artifacts_are_identical(content, artifact) is True
    
    def test_different_content(self):
        """Should return False for different content."""
        content = "const ObjectiveBlock = () => <div>Test</div>;"
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="different_hash_value",
            artifact_type="component"
        )
        
        assert artifacts_are_identical(content, artifact) is False


class TestCanExtendArtifact:
    """Tests for artifact extension detection."""
    
    def test_variant_indicator_dot_notation(self):
        """Should detect variant with dot notation."""
        candidate = {"filename": "ObjectiveBlock.variant.tsx"}
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        assert can_extend_artifact(candidate, artifact) is True
    
    def test_variant_indicator_dash_notation(self):
        """Should detect variant with dash notation."""
        candidate = {"filename": "ObjectiveBlock-variant.tsx"}
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        assert can_extend_artifact(candidate, artifact) is True
    
    def test_no_variant_indicator(self):
        """Should not detect extension for regular file."""
        candidate = {"filename": "ObjectiveBlock.tsx"}
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        assert can_extend_artifact(candidate, artifact) is False


class TestCanUpdateArtifact:
    """Tests for artifact update detection."""
    
    def test_can_update_non_variant(self):
        """Should allow update for non-variant file."""
        candidate = {"filename": "ObjectiveBlock.tsx"}
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        assert can_update_artifact(candidate, artifact) is True
    
    def test_cannot_update_variant(self):
        """Should not allow update for variant file (should extend instead)."""
        candidate = {"filename": "ObjectiveBlock.variant.tsx"}
        artifact = RepositoryArtifact(
            path="src/components/ObjectiveBlock.tsx",
            base_name="ObjectiveBlock",
            content_hash="abc123",
            artifact_type="component"
        )
        
        assert can_update_artifact(candidate, artifact) is False


class TestBuildPlacementManifest:
    """Tests for placement manifest generation."""
    
    def test_add_new_artifact(self):
        """Should ADD completely new artifact."""
        workflow_id = "test-workflow-001"
        candidate = {
            "artifacts": [
                {
                    "filename": "QuizBlock.tsx",
                    "content": "const QuizBlock = () => <div>Quiz</div>;"
                }
            ]
        }
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="abc123",
                artifact_type="component"
            )
        ]
        
        manifest = build_placement_manifest(workflow_id, candidate, repository_index)
        
        assert manifest.workflow_id == workflow_id
        assert len(manifest.placements) == 1
        assert len(manifest.rejected) == 0
        assert manifest.placements[0].action == PlacementAction.ADD
        assert manifest.placements[0].candidate_path == "QuizBlock.tsx"
        assert manifest.placements[0].target_path == "QuizBlock.tsx"
        assert manifest.placements[0].requires_approval is True
        assert manifest.status == "PENDING_APPROVAL"
        assert manifest.manifest_hash != ""
    
    def test_update_existing_artifact_with_version_suffix(self):
        """Should UPDATE when candidate has version suffix matching existing base name."""
        workflow_id = "test-workflow-002"
        candidate = {
            "artifacts": [
                {
                    "filename": "ObjectiveBlockV2.tsx",
                    "content": "const ObjectiveBlock = () => <div>Updated</div>;"
                }
            ]
        }
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="original_hash",
                artifact_type="component"
            )
        ]
        
        manifest = build_placement_manifest(workflow_id, candidate, repository_index)
        
        assert len(manifest.placements) == 1
        assert len(manifest.rejected) == 0
        assert manifest.placements[0].action == PlacementAction.UPDATE
        assert manifest.placements[0].candidate_path == "ObjectiveBlockV2.tsx"
        assert manifest.placements[0].target_path == "src/components/ObjectiveBlock.tsx"
        assert "Updates existing artifact" in manifest.placements[0].reason
        assert manifest.placements[0].requires_approval is True
    
    def test_reuse_identical_artifact(self):
        """Should REUSE when candidate is identical to existing."""
        import hashlib
        content = "const ObjectiveBlock = () => <div>Same</div>;"
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        workflow_id = "test-workflow-003"
        candidate = {
            "artifacts": [
                {
                    "filename": "ObjectiveBlock.tsx",
                    "content": content
                }
            ]
        }
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash=content_hash,
                artifact_type="component"
            )
        ]
        
        manifest = build_placement_manifest(workflow_id, candidate, repository_index)
        
        assert len(manifest.placements) == 1
        assert len(manifest.rejected) == 0
        assert manifest.placements[0].action == PlacementAction.REUSE
        assert manifest.placements[0].target_path == "src/components/ObjectiveBlock.tsx"
        assert "Identical to existing artifact" in manifest.placements[0].reason
        assert manifest.placements[0].requires_approval is False
    
    def test_extend_variant_artifact(self):
        """Should EXTEND when candidate is a variant."""
        workflow_id = "test-workflow-004"
        candidate = {
            "artifacts": [
                {
                    "filename": "ObjectiveBlock.variant.tsx",
                    "content": "const ObjectiveBlockVariant = () => <div>Variant</div>;"
                }
            ]
        }
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="original_hash",
                artifact_type="component"
            )
        ]
        
        manifest = build_placement_manifest(workflow_id, candidate, repository_index)
        
        assert len(manifest.placements) == 1
        assert len(manifest.rejected) == 0
        assert manifest.placements[0].action == PlacementAction.EXTEND
        assert "Extends existing artifact" in manifest.placements[0].reason
    
    def test_reject_artifact_without_filename(self):
        """Should REJECT artifact without filename."""
        workflow_id = "test-workflow-005"
        candidate = {
            "artifacts": [
                {
                    "content": "const Block = () => <div>Test</div>;"
                }
            ]
        }
        repository_index = []
        
        manifest = build_placement_manifest(workflow_id, candidate, repository_index)
        
        assert len(manifest.placements) == 0
        assert len(manifest.rejected) == 1
        assert manifest.rejected[0].action == PlacementAction.REJECT
        assert manifest.rejected[0].reason == "No filename provided"
        assert manifest.status == "REJECTED"
    
    def test_multiple_artifacts(self):
        """Should handle multiple artifacts with different actions."""
        workflow_id = "test-workflow-006"
        candidate = {
            "artifacts": [
                {
                    "filename": "QuizBlock.tsx",
                    "content": "const QuizBlock = () => <div>New</div>;"
                },
                {
                    "filename": "ObjectiveBlockV2.tsx",
                    "content": "const ObjectiveBlock = () => <div>Updated</div>;"
                }
            ]
        }
        repository_index = [
            RepositoryArtifact(
                path="src/components/ObjectiveBlock.tsx",
                base_name="ObjectiveBlock",
                content_hash="original_hash",
                artifact_type="component"
            )
        ]
        
        manifest = build_placement_manifest(workflow_id, candidate, repository_index)
        
        assert len(manifest.placements) == 2
        assert len(manifest.rejected) == 0
        
        # First should be ADD (QuizBlock)
        quiz_placement = [p for p in manifest.placements if "Quiz" in p.candidate_path][0]
        assert quiz_placement.action == PlacementAction.ADD
        
        # Second should be UPDATE (ObjectiveBlockV2)
        objective_placement = [p for p in manifest.placements if "Objective" in p.candidate_path][0]
        assert objective_placement.action == PlacementAction.UPDATE


class TestBuildRepositoryIndex:
    """Tests for repository index building."""
    
    def test_builds_index_from_snapshot(self):
        """Should build artifact index from snapshot evidence."""
        snapshot = {
            "evidence": [
                {
                    "path": "src/components/ObjectiveBlock.tsx",
                    "hash": "abc123",
                    "kind": "component"
                },
                {
                    "path": "src/types/BlockTypes.ts",
                    "hash": "def456",
                    "kind": "type-definition"
                }
            ]
        }
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 2
        assert index[0].path == "src/components/ObjectiveBlock.tsx"
        assert index[0].base_name == "ObjectiveBlock"
        assert index[0].content_hash == "abc123"
        assert index[0].artifact_type == "component"
        assert index[1].base_name == "BlockTypes"
    
    def test_handles_empty_snapshot(self):
        """Should handle snapshot with no evidence."""
        snapshot = {"evidence": []}
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 0
    
    def test_handles_missing_evidence_key(self):
        """Should handle snapshot without evidence key."""
        snapshot = {}
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 0
    
    def test_skips_evidence_without_path(self):
        """Should skip evidence entries without path."""
        snapshot = {
            "evidence": [
                {
                    "hash": "abc123",
                    "kind": "component"
                },
                {
                    "path": "src/components/QuizBlock.tsx",
                    "hash": "def456",
                    "kind": "component"
                }
            ]
        }
        
        index = build_repository_index(snapshot)
        
        assert len(index) == 1
        assert index[0].path == "src/components/QuizBlock.tsx"
