"""
Tests for Candidate Validator - M2.9 Wave 3 Phase 2A
"""

import pytest
import tempfile
from pathlib import Path

from app.intake.candidate_validator import (
    CandidateValidator,
    ValidationResult,
    ValidationError
)


@pytest.fixture
def temp_candidate_dir():
    """Create temporary candidate directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def validator():
    """Create candidate validator instance."""
    return CandidateValidator()


def test_validate_missing_target_version(validator, temp_candidate_dir):
    """Test that validation fails when target_version is missing."""
    # Create a simple candidate file
    candidate_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    candidate_file.write_text("export default function IntroductionI7Block() {}")
    
    upload_meta = {
        "target_family": "Introduction",
        # Missing target_version - should raise ValidationError
        "sha256": "dummy_hash",
        "workflow_id": "test-workflow"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        validator.validate(str(candidate_file), upload_meta)
    
    assert "target_version must be explicit" in str(exc_info.value)


def test_validate_missing_sha256(validator, temp_candidate_dir):
    """Test that validation fails when sha256 is missing."""
    candidate_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    candidate_file.write_text("export default function IntroductionI7Block() {}")
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        # Missing sha256
        "workflow_id": "test-workflow"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        validator.validate(str(candidate_file), upload_meta)
    
    assert "sha256 is required" in str(exc_info.value)


def test_validate_missing_target_family(validator, temp_candidate_dir):
    """Test that validation fails when target_family is missing."""
    candidate_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    candidate_file.write_text("export default function IntroductionI7Block() {}")
    
    upload_meta = {
        # Missing target_family
        "target_version": "I7",
        "sha256": "dummy_hash",
        "workflow_id": "test-workflow"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        validator.validate(str(candidate_file), upload_meta)
    
    assert "target_family is required" in str(exc_info.value)


def test_validate_sha256_mismatch(validator, temp_candidate_dir):
    """Test that validation fails when computed SHA-256 doesn't match expected."""
    candidate_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    content = "export default function IntroductionI7Block() {}"
    candidate_file.write_text(content)
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": "wrong_hash_value",  # Incorrect hash
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate(str(candidate_file), upload_meta)
    
    assert result.valid is False
    assert "SHA-256 mismatch" in result.errors[0]
    assert result.evidence["hash_match"] is False


def test_validate_candidate_not_found(validator):
    """Test that validation fails when candidate path doesn't exist."""
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": "some_hash",
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate("/nonexistent/path", upload_meta)
    
    assert result.valid is False
    assert "does not exist" in result.errors[0]


def test_validate_happy_path_single_file(validator, temp_candidate_dir):
    """Test successful validation with single file."""
    candidate_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    content = "export default function IntroductionI7Block() {}"
    candidate_file.write_text(content)
    
    # Compute actual hash
    import hashlib
    actual_hash = hashlib.sha256(content.encode()).hexdigest()
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate(str(candidate_file), upload_meta)
    
    # Should pass but with warnings about missing schema
    assert result.sha256 == actual_hash
    assert result.target_family == "Introduction"
    assert result.target_version == "I7"
    assert result.evidence["hash_match"] is True
    assert result.evidence["artifact_count"] == 1


def test_validate_happy_path_directory(validator, temp_candidate_dir):
    """Test successful validation with directory containing required files."""
    # Create component file
    component_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    component_file.write_text("export default function IntroductionI7Block() {}")
    
    # Create schema file
    schema_file = temp_candidate_dir / "IntroductionI7Schema.ts"
    schema_file.write_text("export const IntroductionI7Schema = {};")
    
    # Create types file
    types_file = temp_candidate_dir / "types.ts"
    types_file.write_text("export type Props = {};")
    
    # Compute directory hash
    import hashlib
    sha256_hash = hashlib.sha256()
    for file_path in sorted(temp_candidate_dir.rglob("*")):
        if file_path.is_file():
            with open(file_path, "rb") as f:
                file_hash = hashlib.sha256()
                for byte_block in iter(lambda: f.read(4096), b""):
                    file_hash.update(byte_block)
                sha256_hash.update(file_hash.digest())
    actual_hash = sha256_hash.hexdigest()
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate(str(temp_candidate_dir), upload_meta)
    
    assert result.valid is True
    assert result.sha256 == actual_hash
    assert result.target_family == "Introduction"
    assert result.target_version == "I7"
    assert result.evidence["hash_match"] is True
    assert result.evidence["artifact_count"] == 3
    assert result.evidence["is_directory"] is True


def test_validate_evidence_always_populated(validator, temp_candidate_dir):
    """Test that evidence dict is always populated, even on failure."""
    candidate_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    candidate_file.write_text("export default function IntroductionI7Block() {}")
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": "wrong_hash",
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate(str(candidate_file), upload_meta)
    
    # Even though validation fails, evidence must be populated
    assert result.valid is False
    assert result.evidence != {}
    assert "computed_sha256" in result.evidence
    assert "expected_sha256" in result.evidence
    assert "hash_match" in result.evidence
    assert "target_family" in result.evidence
    assert "target_version" in result.evidence
    assert "artifact_count" in result.evidence
    assert "validation_timestamp" in result.evidence


def test_validate_missing_required_files(validator, temp_candidate_dir):
    """Test that validation warns about missing required files."""
    # Only create component, missing schema
    component_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    component_file.write_text("export default function IntroductionI7Block() {}")
    
    # Compute hash
    import hashlib
    sha256_hash = hashlib.sha256()
    with open(component_file, "rb") as f:
        file_hash = hashlib.sha256()
        for byte_block in iter(lambda: f.read(4096), b""):
            file_hash.update(byte_block)
        sha256_hash.update(file_hash.digest())
    actual_hash = sha256_hash.hexdigest()
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate(str(temp_candidate_dir), upload_meta)
    
    # Should fail due to missing schema
    assert result.valid is False
    assert any("Missing required schema file" in err for err in result.errors)
