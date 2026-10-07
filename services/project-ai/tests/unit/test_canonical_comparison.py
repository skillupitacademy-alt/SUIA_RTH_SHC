"""
Unit tests for canonical comparison agent (B06).

Tests the ComparisonResult logic and CanonicalComparator behavior.
"""

import pytest
from app.agents.canonical_comparison import (
    CanonicalComparator,
    ComparisonResult,
    ArtifactComparison,
)
from app.contracts.repository_intelligence import (
    RepositoryBlockContract,
    CanonicalReference,
    RepositoryEvidence,
    RuntimeContract,
)


@pytest.fixture
def sample_contract():
    """Sample RepositoryBlockContract for testing."""
    evidence = RepositoryEvidence(
        path="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        sha256="abc123def456",
        role="canonical_block",
        evidence_id="evidence_intro_i7"
    )
    
    reference = CanonicalReference(
        family="Introduction",
        version="I7",
        evidence=[evidence]
    )
    
    return RepositoryBlockContract(
        family="Introduction",
        version="I7",
        block_type="introduction_i7",
        references=[reference],
        required_artifacts=[
            "HTML/CSS/JS prototype",
            "React/TypeScript implementation",
            "Type definitions",
            "Unit tests"
        ],
        runtime=RuntimeContract()
    )


@pytest.fixture
def sample_artifacts():
    """Sample candidate artifacts."""
    return [
        {"name": "prototype.html", "sha256": "hash1"},
        {"name": "implementation.tsx", "sha256": "hash2"},
        {"name": "types.ts", "sha256": "hash3"},
        {"name": "test.spec.ts", "sha256": "hash4"},
    ]


class TestCanonicalComparator:
    """Tests for CanonicalComparator class."""
    
    def test_wrong_version_returns_fail(self, sample_contract, sample_artifacts):
        """Test that wrong version returns status=FAIL."""
        comparator = CanonicalComparator()
        
        # Request version I8 but contract is for I7
        result = comparator.compare(
            candidate_artifacts=sample_artifacts,
            required_artifacts=sample_contract.required_artifacts,
            target_family="Introduction",
            target_version="I8",  # Mismatch
            contract=sample_contract
        )
        
        assert result.status == "FAIL"
        assert result.target_match is False
        assert any("Version mismatch" in conflict for conflict in result.conflicts)
    
    def test_wrong_family_returns_fail(self, sample_contract, sample_artifacts):
        """Test that wrong family returns status=FAIL."""
        comparator = CanonicalComparator()
        
        # Request Tutorial family but contract is for Introduction
        result = comparator.compare(
            candidate_artifacts=sample_artifacts,
            required_artifacts=sample_contract.required_artifacts,
            target_family="Tutorial",  # Mismatch
            target_version="I7",
            contract=sample_contract
        )
        
        assert result.status == "FAIL"
        assert result.target_match is False
        assert any("Family mismatch" in conflict for conflict in result.conflicts)
    
    def test_missing_required_artifact_returns_fail(self, sample_contract):
        """Test that missing required artifact returns status=FAIL with the artifact in missing_requirements."""
        comparator = CanonicalComparator()
        
        # Missing "Unit tests" artifact
        incomplete_artifacts = [
            {"name": "prototype.html", "sha256": "hash1"},
            {"name": "implementation.tsx", "sha256": "hash2"},
            {"name": "types.ts", "sha256": "hash3"},
            # Missing test file
        ]
        
        result = comparator.compare(
            candidate_artifacts=incomplete_artifacts,
            required_artifacts=sample_contract.required_artifacts,
            target_family="Introduction",
            target_version="I7",
            contract=sample_contract
        )
        
        assert result.status == "FAIL"
        assert "Unit tests" in result.missing_requirements
        assert any("Missing required artifacts" in conflict for conflict in result.conflicts)
    
    def test_all_match_returns_pass(self, sample_contract, sample_artifacts):
        """Test that all-match returns status=PASS."""
        comparator = CanonicalComparator()
        
        result = comparator.compare(
            candidate_artifacts=sample_artifacts,
            required_artifacts=sample_contract.required_artifacts,
            target_family="Introduction",
            target_version="I7",
            contract=sample_contract
        )
        
        assert result.status == "PASS"
        assert result.target_match is True
        assert len(result.missing_requirements) == 0
        assert result.is_approved is True
    
    def test_unavailable_contract_returns_blocked(self, sample_artifacts):
        """Test that unavailable contract returns status=BLOCKED."""
        comparator = CanonicalComparator()
        
        result = comparator.compare(
            candidate_artifacts=sample_artifacts,
            required_artifacts=[],
            target_family="Introduction",
            target_version="I7",
            contract=None  # No contract available
        )
        
        assert result.status == "BLOCKED"
        assert result.target_match is False
        assert any("not available" in conflict for conflict in result.conflicts)
    
    def test_unexpected_artifacts_do_not_fail(self, sample_contract):
        """Test that unexpected artifacts generate warnings but do not fail."""
        comparator = CanonicalComparator()
        
        # Add an unexpected artifact
        artifacts_with_extra = [
            {"name": "prototype.html", "sha256": "hash1"},
            {"name": "implementation.tsx", "sha256": "hash2"},
            {"name": "types.ts", "sha256": "hash3"},
            {"name": "test.spec.ts", "sha256": "hash4"},
            {"name": "unrelated-data.xml", "sha256": "hash5"},  # Extra file that doesn't match any keywords
        ]
        
        result = comparator.compare(
            candidate_artifacts=artifacts_with_extra,
            required_artifacts=sample_contract.required_artifacts,
            target_family="Introduction",
            target_version="I7",
            contract=sample_contract
        )
        
        # Should still pass but with unexpected artifacts noted
        assert result.status == "PASS"
        assert len(result.unexpected_artifacts) > 0
        assert "unrelated-data.xml" in result.unexpected_artifacts
    
    def test_evidence_ids_extracted_from_contract(self, sample_contract, sample_artifacts):
        """Test that evidence IDs are extracted from contract references."""
        comparator = CanonicalComparator()
        
        result = comparator.compare(
            candidate_artifacts=sample_artifacts,
            required_artifacts=sample_contract.required_artifacts,
            target_family="Introduction",
            target_version="I7",
            contract=sample_contract
        )
        
        assert len(result.evidence_ids) > 0
        assert "evidence_intro_i7" in result.evidence_ids
    
    def test_comparison_result_model(self):
        """Test ComparisonResult model structure."""
        result = ComparisonResult(
            status="PASS",
            target_match=True,
            artifacts=[],
            missing_requirements=[],
            unexpected_artifacts=[],
            conflicts=[],
            evidence_ids=["eid1", "eid2"]
        )
        
        assert result.is_approved is True
        assert result.status == "PASS"
        
        # Test serialization
        data = result.model_dump()
        assert data["status"] == "PASS"
        assert data["target_match"] is True
        assert "is_approved" not in data  # Property, not field
    
    def test_artifact_comparison_model(self):
        """Test ArtifactComparison model structure."""
        artifact = ArtifactComparison(
            artifact_path="test.tsx",
            status="MATCH",
            expected_sha256="abc123",
            actual_sha256="abc123",
            evidence_id="eid_test"
        )
        
        assert artifact.status == "MATCH"
        assert artifact.artifact_path == "test.tsx"
        
        # Test serialization
        data = artifact.model_dump()
        assert data["status"] == "MATCH"
        assert data["artifact_path"] == "test.tsx"


class TestComparisonResultProperties:
    """Test ComparisonResult properties and derived logic."""
    
    def test_is_approved_true_when_pass(self):
        """Test is_approved returns True when status is PASS."""
        result = ComparisonResult(
            status="PASS",
            target_match=True
        )
        assert result.is_approved is True
    
    def test_is_approved_false_when_fail(self):
        """Test is_approved returns False when status is FAIL."""
        result = ComparisonResult(
            status="FAIL",
            target_match=False,
            conflicts=["Version mismatch"]
        )
        assert result.is_approved is False
    
    def test_is_approved_false_when_blocked(self):
        """Test is_approved returns False when status is BLOCKED."""
        result = ComparisonResult(
            status="BLOCKED",
            target_match=False,
            conflicts=["Contract not available"]
        )
        assert result.is_approved is False
