"""
Unit tests for B03 Repository Contract Intelligence

Tests the repository intelligence layer that derives contracts from actual files.
"""

import pytest
from pathlib import Path
from app.contracts.repository_intelligence import (
    RepositoryEvidence,
    CanonicalReference,
    RuntimeContract,
    RepositoryBlockContract,
    build_contract,
    compute_sha256,
    generate_evidence_id,
)


class TestRepositoryEvidence:
    """Tests for RepositoryEvidence model."""
    
    def test_repository_evidence_creation(self):
        """Test that RepositoryEvidence can be created with valid data."""
        evidence = RepositoryEvidence(
            path="packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
            sha256="a" * 64,  # Valid hex SHA-256
            role="canonical_block",
            evidence_id="b" * 64
        )
        assert evidence.path == "packages/ui/src/tutorial/blocks/CodeC1Block.tsx"
        assert evidence.sha256 == "a" * 64
        assert evidence.role == "canonical_block"
        assert evidence.evidence_id == "b" * 64


class TestCanonicalReference:
    """Tests for CanonicalReference model."""
    
    def test_canonical_reference_creation(self):
        """Test that CanonicalReference can be created."""
        evidence = RepositoryEvidence(
            path="test.tsx",
            sha256="a" * 64,
            role="canonical_block",
            evidence_id="b" * 64
        )
        reference = CanonicalReference(
            family="Code",
            version="C1",
            evidence=[evidence]
        )
        assert reference.family == "Code"
        assert reference.version == "C1"
        assert len(reference.evidence) == 1


class TestRuntimeContract:
    """Tests for RuntimeContract model."""
    
    def test_runtime_contract_defaults(self):
        """Test that RuntimeContract has correct defaults."""
        contract = RuntimeContract()
        assert contract.ub_rc_required is True
        assert contract.passive_ils is True
        assert contract.page_level_lsnb is True
        assert contract.page_level_rssb is True
        assert contract.theme_injected is True
        assert contract.brand_independent is True


class TestRepositoryBlockContract:
    """Tests for RepositoryBlockContract model."""
    
    def test_repository_block_contract_creation(self):
        """Test that RepositoryBlockContract can be created."""
        contract = RepositoryBlockContract(
            family="Code",
            version="C1",
            block_type="code_c1"
        )
        assert contract.family == "Code"
        assert contract.version == "C1"
        assert contract.block_type == "code_c1"
        assert isinstance(contract.runtime, RuntimeContract)
        assert isinstance(contract.required_artifacts, list)
        assert len(contract.acceptance_criteria) > 0


class TestBuildContract:
    """Tests for build_contract function - core intelligence."""
    
    def test_build_contract_returns_contract(self):
        """Test that build_contract returns a RepositoryBlockContract."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract(repo_root, "Code", "C1")
        
        assert isinstance(contract, RepositoryBlockContract)
        assert contract.family == "Code"
        assert contract.version == "C1"
        assert contract.block_type == "code_c1"
    
    def test_build_contract_sha256_non_empty(self):
        """Test that SHA-256 values are non-empty strings when files exist."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract(repo_root, "Code", "C1")
        
        # If references exist, verify SHA-256 is non-empty
        if contract.references:
            for reference in contract.references:
                for evidence in reference.evidence:
                    assert isinstance(evidence.sha256, str)
                    assert len(evidence.sha256) == 64  # SHA-256 is 64 hex chars
                    assert evidence.sha256 != ""
                    # Verify it's valid hex
                    int(evidence.sha256, 16)
    
    def test_build_contract_nonexistent_family_returns_empty_references(self):
        """Test that non-existent family returns a contract with empty references."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract(repo_root, "NonExistent", "X9")
        
        assert isinstance(contract, RepositoryBlockContract)
        assert contract.family == "NonExistent"
        assert contract.version == "X9"
        assert contract.references == []  # Empty, not exception
    
    def test_build_contract_introduction_i1(self):
        """Test build_contract for Introduction I1."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract(repo_root, "Introduction", "I1")
        
        assert contract.family == "Introduction"
        assert contract.version == "I1"
        assert isinstance(contract, RepositoryBlockContract)
    
    def test_build_contract_definition_d1(self):
        """Test build_contract for Definition D1."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract(repo_root, "Definition", "D1")
        
        assert contract.family == "Definition"
        assert contract.version == "D1"
        assert isinstance(contract, RepositoryBlockContract)
    
    def test_build_contract_evidence_id_deterministic(self):
        """Test that evidence_id is deterministic."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        
        # Build contract twice
        contract1 = build_contract(repo_root, "Code", "C1")
        contract2 = build_contract(repo_root, "Code", "C1")
        
        # If references exist, verify evidence IDs match
        if contract1.references and contract2.references:
            evidence1 = contract1.references[0].evidence[0]
            evidence2 = contract2.references[0].evidence[0]
            assert evidence1.evidence_id == evidence2.evidence_id


class TestHelperFunctions:
    """Tests for helper functions."""
    
    def test_compute_sha256(self, tmp_path):
        """Test SHA-256 computation."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("hello world")
        
        sha256 = compute_sha256(test_file)
        
        # SHA-256 of "hello world" is known
        # b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
        assert sha256 == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    
    def test_generate_evidence_id(self):
        """Test evidence ID generation."""
        path = "test/path.tsx"
        file_sha256 = "a" * 64
        
        evidence_id = generate_evidence_id(path, file_sha256)
        
        # Should be a valid SHA-256 hex string
        assert isinstance(evidence_id, str)
        assert len(evidence_id) == 64
        int(evidence_id, 16)  # Should not raise
    
    def test_generate_evidence_id_deterministic(self):
        """Test that evidence ID generation is deterministic."""
        path = "test/path.tsx"
        file_sha256 = "a" * 64
        
        id1 = generate_evidence_id(path, file_sha256)
        id2 = generate_evidence_id(path, file_sha256)
        
        assert id1 == id2
