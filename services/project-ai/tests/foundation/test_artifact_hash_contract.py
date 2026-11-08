import pytest
from pydantic import ValidationError
from app.api.schemas.workflow import BindArtifactRequest


def test_valid_sha256_hex_is_accepted():
    """Valid 64-character lowercase hex SHA-256 is accepted."""
    request = BindArtifactRequest(
        artifact_type='candidate',
        artifact_id='fixture',
        artifact_sha256='a' * 64
    )
    assert request.artifact_sha256 == 'a' * 64


def test_non_hex_sha256_is_rejected():
    """64 non-hex characters are rejected (FND22 primary control)."""
    with pytest.raises(ValidationError) as exc_info:
        BindArtifactRequest(
            artifact_type='candidate',
            artifact_id='fixture',
            artifact_sha256='z' * 64
        )

    errors = exc_info.value.errors()
    assert len(errors) == 1
    assert errors[0]['type'] == 'value_error'
    assert 'hexadecimal' in str(errors[0]['msg']).lower()


def test_uppercase_hex_is_normalized_to_lowercase():
    """Uppercase hex SHA-256 is accepted and normalized to lowercase."""
    request = BindArtifactRequest(
        artifact_type='contract',
        artifact_id='test-contract',
        artifact_sha256='A' * 64
    )
    # Normalized to lowercase for consistent storage
    assert request.artifact_sha256 == 'a' * 64


def test_mixed_case_hex_is_normalized():
    """Mixed case hex SHA-256 is accepted and normalized to lowercase."""
    mixed_case = 'AbCdEf0123456789' * 4  # 64 chars
    request = BindArtifactRequest(
        artifact_type='manifest',
        artifact_id='test-manifest',
        artifact_sha256=mixed_case
    )
    assert request.artifact_sha256 == mixed_case.lower()
    assert len(request.artifact_sha256) == 64


def test_real_sha256_hash_is_accepted():
    """Real SHA-256 hash (from actual computation) is accepted."""
    # Example real SHA-256 hash
    real_hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    request = BindArtifactRequest(
        artifact_type='snapshot',
        artifact_id='empty-file',
        artifact_sha256=real_hash
    )
    assert request.artifact_sha256 == real_hash


def test_too_short_sha256_is_rejected():
    """SHA-256 with less than 64 characters is rejected."""
    with pytest.raises(ValidationError):
        BindArtifactRequest(
            artifact_type='candidate',
            artifact_id='fixture',
            artifact_sha256='a' * 63  # One char short
        )


def test_too_long_sha256_is_rejected():
    """SHA-256 with more than 64 characters is rejected."""
    with pytest.raises(ValidationError):
        BindArtifactRequest(
            artifact_type='candidate',
            artifact_id='fixture',
            artifact_sha256='a' * 65  # One char too long
        )


def test_empty_sha256_is_rejected():
    """Empty SHA-256 is rejected."""
    with pytest.raises(ValidationError):
        BindArtifactRequest(
            artifact_type='candidate',
            artifact_id='fixture',
            artifact_sha256=''
        )


def test_sha256_with_spaces_is_rejected():
    """SHA-256 containing spaces is rejected."""
    hash_with_spaces = 'a' * 32 + ' ' + 'a' * 31  # 64 chars but with space
    with pytest.raises(ValidationError):
        BindArtifactRequest(
            artifact_type='candidate',
            artifact_id='fixture',
            artifact_sha256=hash_with_spaces
        )


def test_sha256_with_special_chars_is_rejected():
    """SHA-256 containing special characters is rejected."""
    hash_with_special = 'a' * 63 + '-'  # 64 chars but with dash
    with pytest.raises(ValidationError):
        BindArtifactRequest(
            artifact_type='candidate',
            artifact_id='fixture',
            artifact_sha256=hash_with_special
        )


def test_sha256_with_g_to_z_chars_is_rejected():
    """SHA-256 containing non-hex letters (g-z) is rejected."""
    invalid_chars = ['g', 'h', 'z', 'G', 'Z']
    for char in invalid_chars:
        hash_with_invalid = char + ('a' * 63)
        with pytest.raises(ValidationError):
            BindArtifactRequest(
                artifact_type='candidate',
                artifact_id='fixture',
                artifact_sha256=hash_with_invalid
            )


def test_all_valid_hex_digits_accepted():
    """All valid hex digits (0-9, a-f, A-F) are accepted."""
    # Test with all valid hex characters (22 chars * 2 = 44, + 20 = 64)
    valid_hex = '0123456789abcdefABCDEF' * 2 + '0123456789abcdefABCD'  # 64 chars total
    assert len(valid_hex) == 64, f"Test data should be exactly 64 chars, got {len(valid_hex)}"

    request = BindArtifactRequest(
        artifact_type='candidate',
        artifact_id='fixture',
        artifact_sha256=valid_hex
    )
    assert len(request.artifact_sha256) == 64
    # Should be normalized to lowercase
    assert request.artifact_sha256 == valid_hex.lower()


def test_artifact_type_validation_is_independent():
    """Artifact type validation is independent of SHA-256 validation."""
    # Valid SHA-256 but artifact type is not validated at schema level
    # (validation happens at service layer as per D5 guidance)
    request = BindArtifactRequest(
        artifact_type='unknown_type',
        artifact_id='test',
        artifact_sha256='b' * 64
    )
    assert request.artifact_sha256 == 'b' * 64
