"""
Unit tests for candidate intake integrity verification.

Wave 3 B05: Candidate Intake Enhancement
Tests verify that candidates are bound to their engineering contract
and that server-side integrity verification works correctly.
"""

import pytest
from pathlib import Path

from app.agents.intake import (
    CandidateManifest,
    CandidateIntegrityError,
    verify_candidate_integrity,
    sha256_file,
)


@pytest.fixture
def valid_manifest():
    """Valid candidate manifest for testing."""
    return CandidateManifest(
        workflow_id="test-workflow-001",
        contract_id="contract-001",
        contract_hash="a" * 64,  # Valid SHA-256 format
        target={
            "family": "Introduction",
            "version": "I1",
            "block_type": "introduction"
        }
    )


@pytest.fixture
def stored_contract_hash():
    """Simulated server-side stored contract hash."""
    return "a" * 64


class TestCandidateManifestModel:
    """Test CandidateManifest model validation."""
    
    def test_valid_manifest_construction(self, valid_manifest):
        """Test that a valid manifest can be constructed."""
        assert valid_manifest.workflow_id == "test-workflow-001"
        assert valid_manifest.contract_id == "contract-001"
        assert valid_manifest.contract_hash == "a" * 64
        assert valid_manifest.target["family"] == "Introduction"
    
    def test_manifest_requires_workflow_id(self):
        """Test that workflow_id is required."""
        with pytest.raises(ValueError):
            CandidateManifest(
                contract_id="contract-001",
                contract_hash="a" * 64,
                target={"family": "Introduction", "version": "I1"}
            )
    
    def test_manifest_requires_contract_id(self):
        """Test that contract_id is required."""
        with pytest.raises(ValueError):
            CandidateManifest(
                workflow_id="test-workflow-001",
                contract_hash="a" * 64,
                target={"family": "Introduction", "version": "I1"}
            )


class TestVerifyCandidateIntegrity:
    """Test server-side candidate integrity verification."""
    
    def test_verify_candidate_integrity_passes_when_hash_matches(
        self, valid_manifest, stored_contract_hash
    ):
        """Test that verification passes when contract hash matches stored hash."""
        # Should not raise
        verify_candidate_integrity(
            manifest=valid_manifest,
            candidate_path="/test/candidate",
            stored_contract_hash=stored_contract_hash
        )
    
    def test_verify_candidate_integrity_raises_when_hash_mismatches(
        self, valid_manifest
    ):
        """Test that verification raises CandidateIntegrityError when hash mismatches."""
        wrong_stored_hash = "b" * 64
        
        with pytest.raises(CandidateIntegrityError) as exc_info:
            verify_candidate_integrity(
                manifest=valid_manifest,
                candidate_path="/test/candidate",
                stored_contract_hash=wrong_stored_hash
            )
        
        # Verify error message contains both hashes
        error_msg = str(exc_info.value)
        assert "a" * 64 in error_msg  # Client-declared hash
        assert "b" * 64 in error_msg  # Server-stored hash
        assert "contract-001" in error_msg
    
    def test_verify_candidate_integrity_raises_when_target_family_empty(
        self, stored_contract_hash
    ):
        """Test that verification raises when target.family is missing."""
        manifest = CandidateManifest(
            workflow_id="test-workflow-001",
            contract_id="contract-001",
            contract_hash=stored_contract_hash,
            target={"version": "I1"}  # Missing family
        )
        
        with pytest.raises(CandidateIntegrityError) as exc_info:
            verify_candidate_integrity(
                manifest=manifest,
                candidate_path="/test/candidate",
                stored_contract_hash=stored_contract_hash
            )
        
        assert "target.family" in str(exc_info.value)
    
    def test_verify_candidate_integrity_raises_when_target_version_empty(
        self, stored_contract_hash
    ):
        """Test that verification raises when target.version is missing."""
        manifest = CandidateManifest(
            workflow_id="test-workflow-001",
            contract_id="contract-001",
            contract_hash=stored_contract_hash,
            target={"family": "Introduction"}  # Missing version
        )
        
        with pytest.raises(CandidateIntegrityError) as exc_info:
            verify_candidate_integrity(
                manifest=manifest,
                candidate_path="/test/candidate",
                stored_contract_hash=stored_contract_hash
            )
        
        assert "target.version" in str(exc_info.value)
    
    def test_verify_candidate_integrity_raises_when_workflow_id_empty(
        self, stored_contract_hash
    ):
        """Test that verification raises when workflow_id is empty."""
        manifest = CandidateManifest(
            workflow_id="",
            contract_id="contract-001",
            contract_hash=stored_contract_hash,
            target={"family": "Introduction", "version": "I1"}
        )
        
        with pytest.raises(CandidateIntegrityError) as exc_info:
            verify_candidate_integrity(
                manifest=manifest,
                candidate_path="/test/candidate",
                stored_contract_hash=stored_contract_hash
            )
        
        assert "workflow_id" in str(exc_info.value)
    
    def test_verify_candidate_integrity_raises_when_contract_id_empty(
        self, stored_contract_hash
    ):
        """Test that verification raises when contract_id is empty."""
        manifest = CandidateManifest(
            workflow_id="test-workflow-001",
            contract_id="",
            contract_hash=stored_contract_hash,
            target={"family": "Introduction", "version": "I1"}
        )
        
        with pytest.raises(CandidateIntegrityError) as exc_info:
            verify_candidate_integrity(
                manifest=manifest,
                candidate_path="/test/candidate",
                stored_contract_hash=stored_contract_hash
            )
        
        assert "contract_id" in str(exc_info.value)


class TestSha256File:
    """Test file hashing utility."""
    
    def test_sha256_file_produces_valid_hash(self, tmp_path):
        """Test that sha256_file produces a 64-character hex string."""
        # Create a temporary file
        test_file = tmp_path / "test.txt"
        test_file.write_text("Hello, World!")
        
        file_hash = sha256_file(str(test_file))
        
        # SHA-256 produces 64-character hex string
        assert len(file_hash) == 64
        assert all(c in "0123456789abcdef" for c in file_hash)
    
    def test_sha256_file_deterministic(self, tmp_path):
        """Test that the same file produces the same hash."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("Consistent content")
        
        hash1 = sha256_file(str(test_file))
        hash2 = sha256_file(str(test_file))
        
        assert hash1 == hash2
    
    def test_sha256_file_different_content_different_hash(self, tmp_path):
        """Test that different content produces different hashes."""
        file1 = tmp_path / "file1.txt"
        file2 = tmp_path / "file2.txt"
        
        file1.write_text("Content A")
        file2.write_text("Content B")
        
        hash1 = sha256_file(str(file1))
        hash2 = sha256_file(str(file2))
        
        assert hash1 != hash2
