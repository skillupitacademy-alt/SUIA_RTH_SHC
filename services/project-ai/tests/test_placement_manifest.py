"""
Tests for Placement Manifest Generator - M2.9 Wave 3 Phase 2C
"""

import pytest
import json
from dataclasses import dataclass, field
from typing import Dict, Any, List

from app.intake.placement_manifest import (
    PlacementManifestGenerator,
    PlacementManifest
)


# Mock ValidationResult and ComparisonReport for testing
@dataclass
class MockValidationResult:
    """Mock validation result."""
    valid: bool
    sha256: str
    target_family: str
    target_version: str
    errors: List[str] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MockComparisonReport:
    """Mock comparison report."""
    has_breaking_changes: bool
    structural_diffs: List[Dict[str, Any]] = field(default_factory=list)
    api_changes: List[Dict[str, Any]] = field(default_factory=list)
    deviations: List[Dict[str, Any]] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)
    canonical_sha256: str = ""


@pytest.fixture
def generator():
    """Create placement manifest generator instance."""
    return PlacementManifestGenerator()


@pytest.fixture
def valid_validation():
    """Create valid validation result."""
    return MockValidationResult(
        valid=True,
        sha256="abc123def456",
        target_family="Introduction",
        target_version="I7",
        errors=[],
        evidence={
            "artifact_count": 3,
            "hash_match": True
        }
    )


@pytest.fixture
def clean_comparison():
    """Create comparison report with no issues."""
    return MockComparisonReport(
        has_breaking_changes=False,
        structural_diffs=[],
        api_changes=[],
        deviations=[],
        evidence={"comparison_timestamp": "2024-01-01T00:00:00Z"},
        canonical_sha256="canonical_hash_123"
    )


@pytest.fixture
def target_binding():
    """Create target binding."""
    return {
        "workflow_id": "test-workflow-123",
        "target_family": "Introduction",
        "target_version": "I7",
        "specification_id": "spec-456",
        "contract_hash": "contract_hash_789"
    }


def test_generate_manifest_basic_fields(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest includes all required fields."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    assert manifest.manifest_id != ""
    assert manifest.candidate_sha256 == "abc123def456"
    assert manifest.target_family == "Introduction"
    assert manifest.target_version == "I7"
    assert manifest.replacement_strategy == "atomic_replace"
    assert manifest.generated_at != ""
    assert manifest.manifest_sha256 != ""


def test_generate_manifest_file_paths(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest includes correct file paths."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    assert len(manifest.file_paths) >= 2
    
    # Check component file path
    component_path = next(
        (fp for fp in manifest.file_paths if fp["type"] == "component"),
        None
    )
    assert component_path is not None
    assert "IntroductionI7Block.tsx" in component_path["target"]
    assert component_path["backup_required"] is True
    
    # Check schema file path
    schema_path = next(
        (fp for fp in manifest.file_paths if fp["type"] == "schema"),
        None
    )
    assert schema_path is not None
    assert "IntroductionI7Schema.ts" in schema_path["target"]
    assert schema_path["backup_required"] is True


def test_generate_manifest_rollback_plan(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest includes rollback plan."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    assert manifest.rollback_plan != {}
    assert "strategy" in manifest.rollback_plan
    assert "steps" in manifest.rollback_plan
    assert "verification" in manifest.rollback_plan
    assert manifest.rollback_plan["strategy"] == "git_worktree_delete"


def test_generate_manifest_seal_integrity(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest seal is correctly computed."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    # Manifest should have seal
    assert manifest.manifest_sha256 != ""
    
    # Verify seal
    is_valid = generator.verify_manifest_seal(manifest)
    assert is_valid is True


def test_generate_manifest_seal_tampering_detection(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest seal detects tampering."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    # Tamper with manifest
    manifest.replacement_strategy = "tampered_strategy"
    
    # Seal should be invalid
    is_valid = generator.verify_manifest_seal(manifest)
    assert is_valid is False


def test_replacement_strategy_atomic_no_issues(generator, valid_validation, clean_comparison, target_binding):
    """Test that atomic_replace is chosen when no issues detected."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    assert manifest.replacement_strategy == "atomic_replace"


def test_replacement_strategy_staged_breaking_changes(generator, valid_validation, target_binding):
    """Test that staged_replace is chosen when breaking changes detected."""
    comparison_with_breaking = MockComparisonReport(
        has_breaking_changes=True,
        api_changes=[
            {"type": "missing_export", "severity": "breaking"}
        ],
        deviations=[],
        evidence={}
    )
    
    manifest = generator.generate(valid_validation, comparison_with_breaking, target_binding)
    
    assert manifest.replacement_strategy == "staged_replace"


def test_replacement_strategy_staged_api_changes(generator, valid_validation, target_binding):
    """Test that staged_replace is chosen when API changes detected."""
    comparison_with_api_changes = MockComparisonReport(
        has_breaking_changes=False,
        api_changes=[
            {"type": "added_export", "severity": "minor"}
        ],
        deviations=[],
        evidence={}
    )
    
    manifest = generator.generate(valid_validation, comparison_with_api_changes, target_binding)
    
    assert manifest.replacement_strategy == "staged_replace"


def test_replacement_strategy_rollback_severe_deviations(generator, valid_validation, target_binding):
    """Test that rollback_only is chosen when severe deviations detected."""
    comparison_with_deviations = MockComparisonReport(
        has_breaking_changes=False,
        api_changes=[],
        deviations=[
            {"type": "hardcoded_brand", "severity": "error"}
        ],
        evidence={}
    )
    
    manifest = generator.generate(valid_validation, comparison_with_deviations, target_binding)
    
    assert manifest.replacement_strategy == "rollback_only"


def test_manifest_immutability(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest seal enforces immutability."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    original_seal = manifest.manifest_sha256
    
    # Any change to manifest should invalidate seal
    manifest.candidate_sha256 = "different_hash"
    
    # Re-verify seal - should be invalid
    is_valid = generator.verify_manifest_seal(manifest)
    assert is_valid is False
    
    # Seal value itself hasn't changed
    assert manifest.manifest_sha256 == original_seal


def test_manifest_id_uniqueness(generator, valid_validation, clean_comparison, target_binding):
    """Test that each manifest gets unique ID."""
    manifest1 = generator.generate(valid_validation, clean_comparison, target_binding)
    manifest2 = generator.generate(valid_validation, clean_comparison, target_binding)
    
    assert manifest1.manifest_id != manifest2.manifest_id


def test_manifest_serializable(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest is JSON serializable."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    # Convert to dict and serialize
    from dataclasses import asdict
    manifest_dict = asdict(manifest)
    manifest_json = json.dumps(manifest_dict)
    
    # Should be valid JSON
    assert manifest_json is not None
    parsed = json.loads(manifest_json)
    assert parsed["manifest_id"] == manifest.manifest_id


def test_file_paths_include_types_for_large_artifacts(generator, target_binding):
    """Test that type files are included for candidates with multiple artifacts."""
    validation_with_many_artifacts = MockValidationResult(
        valid=True,
        sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        evidence={"artifact_count": 5}  # More than just component and schema
    )
    
    clean_comparison = MockComparisonReport(
        has_breaking_changes=False,
        deviations=[],
        evidence={}
    )
    
    manifest = generator.generate(validation_with_many_artifacts, clean_comparison, target_binding)
    
    # Should include types file
    types_path = next(
        (fp for fp in manifest.file_paths if fp["type"] == "types"),
        None
    )
    assert types_path is not None


def test_manifest_targets_correct_paths(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest targets use correct repository paths."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    # Component should target blocks directory
    component_path = next(
        (fp for fp in manifest.file_paths if fp["type"] == "component"),
        None
    )
    assert "packages/ui/src/tutorial/blocks/" in component_path["target"]
    
    # Schema should target schemas directory
    schema_path = next(
        (fp for fp in manifest.file_paths if fp["type"] == "schema"),
        None
    )
    assert "packages/ui/src/tutorial/schemas/" in schema_path["target"]


def test_manifest_validation_pass(generator, valid_validation, clean_comparison, target_binding):
    """Test that valid manifest passes validation."""
    manifest = generator.generate(valid_validation, clean_comparison, target_binding)
    
    is_valid, errors = generator.validate_manifest(manifest, target_binding)
    
    assert is_valid is True
    assert len(errors) == 0


def test_manifest_validation_family_mismatch(generator, clean_comparison):
    """Test that validation detects family mismatch."""
    # Create validation with one family
    validation_intro = MockValidationResult(
        valid=True,
        sha256="abc123def456",
        target_family="Introduction",
        target_version="I7",
        errors=[],
        evidence={"artifact_count": 2}
    )
    
    # Create binding with different family
    binding_wrong_family = {
        "workflow_id": "test-workflow-123",
        "target_family": "Assessment",  # Different from validation (Introduction)
        "target_version": "I7",
    }
    
    # Generate manifest - it will use binding's family
    manifest = generator.generate(validation_intro, clean_comparison, binding_wrong_family)
    
    # Now validate against a different binding that expects Introduction
    expected_binding = {
        "target_family": "Introduction",
        "target_version": "I7"
    }
    
    is_valid, errors = generator.validate_manifest(manifest, expected_binding)
    
    assert is_valid is False
    assert any("family mismatch" in error.lower() for error in errors)


def test_manifest_validation_version_mismatch(generator, clean_comparison):
    """Test that validation detects version mismatch."""
    # Create validation with one version
    validation_i7 = MockValidationResult(
        valid=True,
        sha256="abc123def456",
        target_family="Introduction",
        target_version="I7",
        errors=[],
        evidence={"artifact_count": 2}
    )
    
    # Create binding with different version
    binding_wrong_version = {
        "workflow_id": "test-workflow-123",
        "target_family": "Introduction",
        "target_version": "I8",  # Different from validation (I7)
    }
    
    # Generate manifest - it will use binding's version
    manifest = generator.generate(validation_i7, clean_comparison, binding_wrong_version)
    
    # Now validate against a different binding that expects I7
    expected_binding = {
        "target_family": "Introduction",
        "target_version": "I7"
    }
    
    is_valid, errors = generator.validate_manifest(manifest, expected_binding)
    
    assert is_valid is False
    assert any("version mismatch" in error.lower() for error in errors)


def test_manifest_validation_detects_path_traversal(generator):
    """Test that validation detects path traversal attempts."""
    # Create manifest with unsafe path
    manifest = PlacementManifest(
        manifest_id="test-id",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        file_paths=[
            {
                "source": "BadBlock.tsx",
                "target": "../../../etc/passwd",  # Path traversal attempt
                "type": "component",
                "action": "write"
            }
        ]
    )
    
    target_binding = {
        "target_family": "Introduction",
        "target_version": "I7"
    }
    
    is_valid, errors = generator.validate_manifest(manifest, target_binding)
    
    assert is_valid is False
    assert any("traversal" in error.lower() for error in errors)


def test_manifest_validation_detects_absolute_path(generator):
    """Test that validation detects absolute paths."""
    manifest = PlacementManifest(
        manifest_id="test-id",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        file_paths=[
            {
                "source": "Block.tsx",
                "target": "/absolute/path/to/file.tsx",  # Absolute path
                "type": "component",
                "action": "write"
            }
        ]
    )
    
    target_binding = {
        "target_family": "Introduction",
        "target_version": "I7"
    }
    
    is_valid, errors = generator.validate_manifest(manifest, target_binding)
    
    assert is_valid is False
    assert any("absolute" in error.lower() for error in errors)


def test_manifest_validation_allowed_directories(generator):
    """Test that validation enforces allowed directory prefixes."""
    manifest = PlacementManifest(
        manifest_id="test-id",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        file_paths=[
            {
                "source": "Block.tsx",
                "target": "packages/malicious/src/bad.tsx",  # Not in allowed list
                "type": "component",
                "action": "write"
            }
        ]
    )
    
    target_binding = {
        "target_family": "Introduction",
        "target_version": "I7"
    }
    
    is_valid, errors = generator.validate_manifest(manifest, target_binding)
    
    assert is_valid is False
    assert any("allowed" in error.lower() for error in errors)


def test_manifest_validation_hash_binding(generator, valid_validation, clean_comparison, target_binding):
    """Test that manifest hash is bound and stable."""
    manifest1 = generator.generate(valid_validation, clean_comparison, target_binding)
    manifest2 = generator.generate(valid_validation, clean_comparison, target_binding)
    
    # Both should have hashes
    assert manifest1.manifest_sha256 != ""
    assert manifest2.manifest_sha256 != ""
    
    # Hashes should be different (different manifest IDs)
    assert manifest1.manifest_sha256 != manifest2.manifest_sha256
    
    # But each hash should be stable
    recomputed_hash1 = generator._compute_manifest_seal(manifest1)
    assert recomputed_hash1 == manifest1.manifest_sha256


def test_artifact_policy_integration_duplicate_prevention():
    """
    Test that artifact_policy is integrated into manifest generation.
    
    This test verifies duplicate prevention: when ObjectiveBlock.tsx exists in repository,
    ObjectiveBlockV2.tsx candidate should get UPDATE action pointing to ObjectiveBlock.tsx,
    not ADD action creating a new file.
    
    This is finding #3 from W3C review: integration test for artifact_policy.
    """
    import tempfile
    import json
    import os
    
    # Create mock snapshot with existing IntroductionI7 artifacts
    snapshot = {
        "evidence": [
            {
                "type": "component",
                "path": "packages/ui/src/tutorial/blocks/IntroductionI7Block.tsx",
                "contentHash": "existing_component_hash_123",
                "hash": "existing_component_hash_123"
            },
            {
                "type": "schema",
                "path": "packages/ui/src/tutorial/schemas/IntroductionI7Schema.ts",
                "contentHash": "existing_schema_hash_456",
                "hash": "existing_schema_hash_456"
            }
        ]
    }
    
    # Write snapshot to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(snapshot, f)
        snapshot_path = f.name
    
    try:
        # Create generator with snapshot
        generator = PlacementManifestGenerator(snapshot_path=snapshot_path)
        
        # Create validation for IntroductionI7 candidate (versioned duplicate)
        validation = MockValidationResult(
            valid=True,
            sha256="new_candidate_hash_789",
            target_family="Introduction",
            target_version="I7",
            errors=[],
            evidence={
                "artifact_count": 2
            }
        )
        
        # Create clean comparison (no issues)
        comparison = MockComparisonReport(
            has_breaking_changes=False,
            deviations=[],
            evidence={}
        )
        
        # Create target binding
        target_binding = {
            "workflow_id": "test-workflow-duplicate-prevention",
            "target_family": "Introduction",
            "target_version": "I7",
            "specification_id": "spec-duplicate-test",
        }
        
        # Generate manifest
        manifest = generator.generate(validation, comparison, target_binding)
        
        # VERIFY: artifact_policy was called and determined UPDATE actions
        # (not ADD, because semantic matches exist in repository)
        component_path = next(
            (fp for fp in manifest.file_paths if fp["type"] == "component"),
            None
        )
        assert component_path is not None
        
        # Action should be UPDATE (duplicate prevention in action)
        assert component_path["action"] == "UPDATE"
        
        # Target path should point to existing file (not create new versioned file)
        assert component_path["target"] == "packages/ui/src/tutorial/blocks/IntroductionI7Block.tsx"
        
        # Same for schema
        schema_path = next(
            (fp for fp in manifest.file_paths if fp["type"] == "schema"),
            None
        )
        assert schema_path is not None
        assert schema_path["action"] == "UPDATE"
        assert schema_path["target"] == "packages/ui/src/tutorial/schemas/IntroductionI7Schema.ts"
        
    finally:
        # Clean up temporary file
        os.unlink(snapshot_path)


def test_artifact_policy_integration_new_artifact():
    """
    Test that artifact_policy correctly identifies new artifacts (ADD action).
    
    When no semantic match exists in repository, action should be ADD.
    """
    import tempfile
    import json
    import os
    
    # Create mock snapshot with NO AssessmentA1 artifacts
    snapshot = {
        "evidence": [
            {
                "type": "component",
                "path": "packages/ui/src/tutorial/blocks/IntroductionI7Block.tsx",
                "contentHash": "existing_hash_123",
                "hash": "existing_hash_123"
            }
        ]
    }
    
    # Write snapshot to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(snapshot, f)
        snapshot_path = f.name
    
    try:
        # Create generator with snapshot
        generator = PlacementManifestGenerator(snapshot_path=snapshot_path)
        
        # Create validation for AssessmentA1 candidate (NEW artifact)
        validation = MockValidationResult(
            valid=True,
            sha256="new_candidate_hash_999",
            target_family="Assessment",
            target_version="A1",
            errors=[],
            evidence={
                "artifact_count": 2
            }
        )
        
        # Create clean comparison
        comparison = MockComparisonReport(
            has_breaking_changes=False,
            deviations=[],
            evidence={}
        )
        
        # Create target binding
        target_binding = {
            "workflow_id": "test-workflow-new-artifact",
            "target_family": "Assessment",
            "target_version": "A1",
            "specification_id": "spec-new-test",
        }
        
        # Generate manifest
        manifest = generator.generate(validation, comparison, target_binding)
        
        # VERIFY: Action should be ADD (no semantic match in repository)
        component_path = next(
            (fp for fp in manifest.file_paths if fp["type"] == "component"),
            None
        )
        assert component_path is not None
        assert component_path["action"] == "ADD"
        
        # Target path should be new path (not reused)
        assert "AssessmentA1Block.tsx" in component_path["target"]
        
    finally:
        # Clean up temporary file
        os.unlink(snapshot_path)

