import pytest
from pydantic import ValidationError
from app.api.schemas.workflow import BindArtifactRequest


def test_valid_sha256_hex_is_accepted():
    request = BindArtifactRequest(artifact_type='candidate', artifact_id='fixture', artifact_sha256='a' * 64)
    assert request.artifact_sha256 == 'a' * 64


def test_non_hex_sha256_is_rejected():
    with pytest.raises(ValidationError):
        BindArtifactRequest(artifact_type='candidate', artifact_id='fixture', artifact_sha256='z' * 64)
