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


def test_validate_canonical_naming_conventions(validator, temp_candidate_dir):
    """Test that canonical monorepo conventions (e.g. IntroductionBlock.tsx, introduction-i7.schema.ts) pass."""
    component_file = temp_candidate_dir / "IntroductionBlock.tsx"
    component_file.write_text("export default function IntroductionBlock() {}")
    
    schema_file = temp_candidate_dir / "introduction-i7.schema.ts"
    schema_file.write_text("export const IntroductionI7Schema = {};")
    
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
    assert len(result.errors) == 0


def test_validate_governing_policy_in_evidence(validator, temp_candidate_dir):
    """Test that candidate validation evidence binds the canonical governing policy."""
    component_file = temp_candidate_dir / "IntroductionBlock.tsx"
    component_file.write_text("export default function IntroductionBlock() {}")
    
    import hashlib
    actual_hash = hashlib.sha256(component_file.read_bytes()).hexdigest()
    
    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow"
    }
    
    result = validator.validate(str(component_file), upload_meta)
    assert "governing_policy" in result.evidence
    assert "FRAMEWORK COMPLIANCE-ONLY POLICY" in result.evidence["governing_policy"]
    assert "must not design, prescribe, or redefine block-specific GUI layout" in result.evidence["governing_policy"]


def test_validate_contract_driven_artifacts_success(validator, temp_candidate_dir):
    """Test candidate validation matching required_artifacts directly from contract."""
    (temp_candidate_dir / "components").mkdir(parents=True, exist_ok=True)
    (temp_candidate_dir / "schemas").mkdir(parents=True, exist_ok=True)
    (temp_candidate_dir / "tests").mkdir(parents=True, exist_ok=True)

    component_file = temp_candidate_dir / "components" / "IntroductionI7Block.tsx"
    component_file.write_text("export default function IntroductionI7Block() {}")
    schema_file = temp_candidate_dir / "schemas" / "introduction-i7.schema.ts"
    schema_file.write_text("export const IntroductionI7Schema = {};")
    test_file = temp_candidate_dir / "tests" / "IntroductionI7Block.test.tsx"
    test_file.write_text("describe('IntroductionI7Block', () => {});")

    import hashlib
    sha256_hash = hashlib.sha256()
    for file_path in sorted(temp_candidate_dir.rglob("*")):
        if file_path.is_file():
            with open(file_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    file_hash = hashlib.sha256()
                    file_hash.update(byte_block)
                sha256_hash.update(file_hash.digest())
    actual_hash = sha256_hash.hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "components/IntroductionI7Block.tsx",
            "schemas/introduction-i7.schema.ts",
            "tests/IntroductionI7Block.test.tsx"
        ]
    }

    result = validator.validate(str(temp_candidate_dir), upload_meta)
    assert result.valid is True
    assert result.evidence["contract_driven"] is True
    assert len(result.evidence["matched_artifacts"]) == 3
    assert len(result.evidence["missing_artifacts"]) == 0


def test_validate_contract_driven_missing_artifact_fails(validator, temp_candidate_dir):
    """Test candidate validation fails when a contract-required artifact is missing."""
    (temp_candidate_dir / "components").mkdir(parents=True, exist_ok=True)
    component_file = temp_candidate_dir / "components" / "IntroductionI7Block.tsx"
    component_file.write_text("export default function IntroductionI7Block() {}")

    import hashlib
    actual_hash = hashlib.sha256()
    for file_path in sorted(temp_candidate_dir.rglob("*")):
        if file_path.is_file():
            with open(file_path, "rb") as f:
                file_hash = hashlib.sha256(f.read())
                actual_hash.update(file_hash.digest())

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash.hexdigest(),
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "components/IntroductionI7Block.tsx",
            "schemas/introduction-i7.schema.ts",
            "tests/IntroductionI7Block.test.tsx"
        ]
    }

    result = validator.validate(str(temp_candidate_dir), upload_meta)
    assert result.valid is False
    assert result.evidence["contract_driven"] is True
    assert "components/IntroductionI7Block.tsx" in result.evidence["matched_artifacts"]
    assert "schemas/introduction-i7.schema.ts" in result.evidence["missing_artifacts"]
    assert "tests/IntroductionI7Block.test.tsx" in result.evidence["missing_artifacts"]
    assert any("Missing contract-required artifact" in err for err in result.errors)


def test_validate_zip_archive_success(validator, temp_candidate_dir):
    """Test candidate package inside a .zip archive passes when all required artifacts exist."""
    import zipfile
    import hashlib

    zip_path = temp_candidate_dir / "candidate.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("IntroductionI7Block.tsx", "export function IntroductionI7Block() {}")
        zf.writestr("introduction-i7.schema.ts", "export const IntroductionI7Schema = {};")
        zf.writestr("IntroductionI7Block.test.tsx", "describe('test', () => {});")

    actual_hash = hashlib.sha256(zip_path.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "IntroductionI7Block.tsx",
            "introduction-i7.schema.ts",
            "IntroductionI7Block.test.tsx"
        ]
    }

    result = validator.validate(str(zip_path), upload_meta)
    assert result.valid is True
    assert len(result.evidence["matched_artifacts"]) == 3
    assert len(result.evidence["missing_artifacts"]) == 0
    assert result.evidence["artifact_count"] == 3


def test_validate_zip_archive_missing_artifact_fails(validator, temp_candidate_dir):
    """Test candidate package inside a .zip archive fails when an artifact is missing."""
    import zipfile
    import hashlib

    zip_path = temp_candidate_dir / "incomplete.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("IntroductionI7Block.tsx", "export function IntroductionI7Block() {}")
        # Missing schema and test

    actual_hash = hashlib.sha256(zip_path.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "IntroductionI7Block.tsx",
            "introduction-i7.schema.ts",
            "IntroductionI7Block.test.tsx"
        ]
    }

    result = validator.validate(str(zip_path), upload_meta)
    assert result.valid is False
    assert "IntroductionI7Block.tsx" in result.evidence["matched_artifacts"]
    assert "introduction-i7.schema.ts" in result.evidence["missing_artifacts"]
    assert "IntroductionI7Block.test.tsx" in result.evidence["missing_artifacts"]


def test_validate_single_file_cannot_satisfy_multi_artifact_contract(validator, temp_candidate_dir):
    """A single component file cannot automatically satisfy multiple distinct required artifacts."""
    import hashlib

    single_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    single_file.write_text("export function IntroductionI7Block() {}")
    actual_hash = hashlib.sha256(single_file.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "IntroductionI7Block.tsx",
            "introduction-i7.schema.ts",
            "IntroductionI7Block.test.tsx"
        ]
    }

    result = validator.validate(str(single_file), upload_meta)
    assert result.valid is False
    assert "IntroductionI7Block.tsx" in result.evidence["matched_artifacts"]
    assert "introduction-i7.schema.ts" in result.evidence["missing_artifacts"]
    assert "IntroductionI7Block.test.tsx" in result.evidence["missing_artifacts"]


def test_validate_corrupted_zip_fails(validator, temp_candidate_dir):
    """Corrupted zip archive fails gracefully with explicit error."""
    import hashlib

    bad_zip = temp_candidate_dir / "corrupted.zip"
    bad_zip.write_bytes(b"not a valid zip file content")
    actual_hash = hashlib.sha256(bad_zip.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": ["IntroductionI7Block.tsx"]
    }

    result = validator.validate(str(bad_zip), upload_meta)
    assert result.valid is False
    assert any("Invalid or corrupted zip archive" in err for err in result.errors)


def test_validate_distinct_paths_same_basename_cannot_share_file(validator, temp_candidate_dir):
    """Two requirements with different paths cannot both be satisfied by a single file."""
    import hashlib

    (temp_candidate_dir / "components").mkdir(parents=True, exist_ok=True)
    comp_file = temp_candidate_dir / "components" / "IntroductionI7Block.tsx"
    comp_file.write_text("export default function IntroductionI7Block() {}")

    actual_hash = hashlib.sha256()
    with open(comp_file, "rb") as f:
        file_hash = hashlib.sha256(f.read())
        actual_hash.update(file_hash.digest())

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash.hexdigest(),
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "components/IntroductionI7Block.tsx",
            "legacy/IntroductionI7Block.tsx"  # Different path, same basename
        ]
    }

    result = validator.validate(str(temp_candidate_dir), upload_meta)
    assert result.valid is False
    assert "components/IntroductionI7Block.tsx" in result.evidence["matched_artifacts"]
    assert "legacy/IntroductionI7Block.tsx" in result.evidence["missing_artifacts"]


def test_validate_wrong_directory_path_rejected(validator, temp_candidate_dir):
    """File in wrong directory path does not satisfy path-specific contract requirement."""
    import hashlib

    (temp_candidate_dir / "wrong_dir").mkdir(parents=True, exist_ok=True)
    comp_file = temp_candidate_dir / "wrong_dir" / "IntroductionI7Block.tsx"
    comp_file.write_text("export default function IntroductionI7Block() {}")

    actual_hash = hashlib.sha256()
    with open(comp_file, "rb") as f:
        file_hash = hashlib.sha256(f.read())
        actual_hash.update(file_hash.digest())

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash.hexdigest(),
        "workflow_id": "test-workflow",
        "required_artifacts": [
            "components/IntroductionI7Block.tsx"
        ]
    }

    result = validator.validate(str(temp_candidate_dir), upload_meta)
    assert result.valid is False
    assert "components/IntroductionI7Block.tsx" in result.evidence["missing_artifacts"]


def test_validate_empty_artifact_rejected(validator, temp_candidate_dir):
    """Artifact with 0 bytes is rejected as invalid implementation."""
    import hashlib

    empty_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    empty_file.write_bytes(b"")
    actual_hash = hashlib.sha256(empty_file.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": ["IntroductionI7Block.tsx"]
    }

    result = validator.validate(str(empty_file), upload_meta)
    assert result.valid is False
    assert any("is empty" in err for err in result.errors)


def test_validate_stub_only_comment_rejected(validator, temp_candidate_dir):
    """Artifact containing only comments without implementation code is rejected."""
    import hashlib

    stub_file = temp_candidate_dir / "IntroductionI7Block.tsx"
    stub_file.write_text("// TODO: implement later\n/* placeholder */\n")
    actual_hash = hashlib.sha256(stub_file.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": ["IntroductionI7Block.tsx"]
    }

    result = validator.validate(str(stub_file), upload_meta)
    assert result.valid is False
    assert any("only comments or stubs" in err or "lacks valid implementation" in err for err in result.errors)


def test_validate_json_artifact_valid(validator, temp_candidate_dir):
    """Valid JSON artifact parses and satisfies contract requirement."""
    import hashlib

    json_file = temp_candidate_dir / "schema.json"
    json_file.write_text('{"name": "test", "version": 1}')
    actual_hash = hashlib.sha256(json_file.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": ["schema.json"]
    }

    result = validator.validate(str(json_file), upload_meta)
    assert result.valid is True
    assert "schema.json" in result.evidence["matched_artifacts"]


def test_validate_json_artifact_invalid(validator, temp_candidate_dir):
    """Malformed JSON artifact is rejected with parse error."""
    import hashlib

    bad_json = temp_candidate_dir / "schema.json"
    bad_json.write_text('{"name": "test", "unterminated string}')
    actual_hash = hashlib.sha256(bad_json.read_bytes()).hexdigest()

    upload_meta = {
        "target_family": "Introduction",
        "target_version": "I7",
        "sha256": actual_hash,
        "workflow_id": "test-workflow",
        "required_artifacts": ["schema.json"]
    }

    result = validator.validate(str(bad_json), upload_meta)
    assert result.valid is False
    assert any("contains invalid JSON" in err for err in result.errors)




