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
