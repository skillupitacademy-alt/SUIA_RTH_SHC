"""
Unit tests for contract serialization determinism - Wave 2 FEAT-004

Tests that verify deterministic JSON serialization and stable hashing:
- contract_serialization_deterministic: Same contract serialized multiple times produces identical JSON
- contract_hash_stable_across_runs: Same contract data produces same hash every time
- json_key_ordering: JSON output has sorted keys for determinism
- unicode_handling: Unicode strings in contract produce stable hash
"""

import pytest
import json
from app.contracts.engineering_contract import (
    EngineeringContract,
    seal_contract,
    PROHIBITED_BEHAVIORS
)
from app.contracts.repository_intelligence import RuntimeContract
from app.models.workflow_target import WorkflowTarget


@pytest.fixture
def sample_contract():
    """Create a sample contract for serialization testing."""
    target = WorkflowTarget(
        workflow_id="test-workflow-serialization",
        family="Introduction",
        version="I7",
        block_type="introduction",
        specification_id="spec-serialization",
        source_snapshot_id="snapshot-serialization"
    )
    
    return EngineeringContract(
        contract_id="contract-serialization-001",
        workflow_id="test-workflow-serialization",
        target=target,
        repository_snapshot_id="snapshot-serialization",
        repository_snapshot_sha256="abcdef123456" * 5 + "abcd",  # 64 chars
        educational_contract={"difficulty": "intermediate", "topic": "introduction"},
        implementation_contract={"language": "TypeScript", "framework": "React"},
        type_contract={"strict": True},
        schema_contract={"validation": "Pydantic"},
        ubrc_contract={"required": True},
        renderer_contract={"component": "IntroductionBlock"},
        composer_contract={"composable": True},
        runtime_contract=RuntimeContract(),
        theme_contract={"theme_independent": True},
        brand_contract={"brand_independent": True},
        ils_contract={"passive": True},
        lsnb_contract={"page_level": True},
        rssb_contract={"page_level": True},
        required_artifacts=["component.tsx", "schema.ts", "test.tsx"],
        tests_required=["unit", "integration", "accessibility"],
        acceptance_criteria=["renders correctly", "passes tests", "meets accessibility"],
        prohibited_behaviors=PROHIBITED_BEHAVIORS,
        contract_hash=""
    )


class TestContractSerializationDeterministic:
    """Test that contract serialization is deterministic."""
    
    def test_contract_serialization_deterministic(self, sample_contract):
        """Test that serializing the same contract multiple times produces identical JSON."""
        # Serialize the contract 10 times
        serializations = []
        for i in range(10):
            contract_dict = sample_contract.model_dump(
                exclude_none=True,
                by_alias=True,
                exclude={"contract_id", "contract_hash"},
                mode="json"
            )
            json_output = json.dumps(contract_dict, sort_keys=True, ensure_ascii=False)
            serializations.append(json_output)
        
        # All serializations should be identical
        first_serialization = serializations[0]
        for i, serialization in enumerate(serializations[1:], start=1):
            assert serialization == first_serialization, \
                f"Serialization {i} differs from first serialization"
        
        # Verify all are truly identical
        assert len(set(serializations)) == 1, "All serializations should be identical"


class TestContractHashStableAcrossRuns:
    """Test that contract hash is stable across multiple runs."""
    
    def test_contract_hash_stable_across_runs(self, sample_contract):
        """Test that sealing the same contract 100 times produces identical hash."""
        # Seal the contract 100 times
        hashes = []
        for i in range(100):
            contract_hash = seal_contract(sample_contract)
            hashes.append(contract_hash)
        
        # All hashes should be identical
        first_hash = hashes[0]
        for i, hash_value in enumerate(hashes[1:], start=1):
            assert hash_value == first_hash, \
                f"Hash {i} differs from first hash: {hash_value} != {first_hash}"
        
        # Verify all hashes are truly identical
        assert len(set(hashes)) == 1, "All hashes should be identical"
        
        # Verify hash is valid SHA-256 (64 hex characters)
        assert len(first_hash) == 64
        int(first_hash, 16)  # Should not raise


class TestJSONKeyOrdering:
    """Test that JSON serialization has sorted keys."""
    
    def test_json_key_ordering(self, sample_contract):
        """Test that JSON output has sorted keys for determinism."""
        # Serialize contract
        contract_dict = sample_contract.model_dump(
            exclude_none=True,
            by_alias=True,
            exclude={"contract_id", "contract_hash"},
            mode="json"
        )
        json_output = json.dumps(contract_dict, sort_keys=True, ensure_ascii=False)
        
        # Parse back to dict
        parsed = json.loads(json_output)
        
        # Get all keys at top level
        keys = list(parsed.keys())
        
        # Verify keys are sorted
        sorted_keys = sorted(keys)
        assert keys == sorted_keys, f"Keys are not sorted: {keys}"
        
        # Verify nested dicts also have sorted keys
        # Check educational_contract keys
        if "educational_contract" in parsed and parsed["educational_contract"]:
            edu_keys = list(parsed["educational_contract"].keys())
            assert edu_keys == sorted(edu_keys), \
                f"educational_contract keys not sorted: {edu_keys}"
        
        # Check implementation_contract keys
        if "implementation_contract" in parsed and parsed["implementation_contract"]:
            impl_keys = list(parsed["implementation_contract"].keys())
            assert impl_keys == sorted(impl_keys), \
                f"implementation_contract keys not sorted: {impl_keys}"


class TestUnicodeHandling:
    """Test that unicode strings in contract produce stable hash."""
    
    def test_unicode_handling(self):
        """Test that contract with unicode strings produces stable hash."""
        target = WorkflowTarget(
            workflow_id="test-unicode",
            family="Introduction",
            version="I7",
            block_type="introduction",
            specification_id="unicode-test",
            source_snapshot_id="snapshot-unicode"
        )
        
        # Create contract with unicode content
        contract = EngineeringContract(
            contract_id="contract-unicode-001",
            workflow_id="test-unicode",
            target=target,
            repository_snapshot_id="snapshot-unicode",
            repository_snapshot_sha256="unicode" + "0" * 57,
            educational_contract={
                "topic": "Introduction avec caractères spéciaux",
                "description": "学习编程 - Learn programming",
                "emoji": "🎓📚💻"
            },
            implementation_contract={
                "language": "TypeScript",
                "comment": "Supports émoji and 中文"
            },
            prohibited_behaviors=PROHIBITED_BEHAVIORS,
            contract_hash=""
        )
        
        # Seal contract multiple times
        hash1 = seal_contract(contract)
        hash2 = seal_contract(contract)
        hash3 = seal_contract(contract)
        
        # All hashes should be identical
        assert hash1 == hash2 == hash3, "Unicode content should produce stable hash"
        
        # Verify hash is valid
        assert len(hash1) == 64
        int(hash1, 16)  # Should not raise
    
    def test_unicode_differences_detected(self):
        """Test that different unicode strings produce different hashes."""
        target = WorkflowTarget(
            workflow_id="test-unicode-diff",
            family="Introduction",
            version="I7",
            block_type="introduction",
            specification_id="unicode-diff-test",
            source_snapshot_id="snapshot-unicode-diff"
        )
        
        # Contract with unicode string A
        contract1 = EngineeringContract(
            contract_id="contract-same",  # Same ID
            workflow_id="test-unicode-diff",
            target=target,
            repository_snapshot_id="snapshot-unicode-diff",
            repository_snapshot_sha256="unicode" + "1" * 57,
            educational_contract={"text": "Hello 世界"},
            prohibited_behaviors=PROHIBITED_BEHAVIORS
        )
        
        # Contract with unicode string B (different)
        contract2 = EngineeringContract(
            contract_id="contract-same",  # Same ID
            workflow_id="test-unicode-diff",
            target=target,
            repository_snapshot_id="snapshot-unicode-diff",
            repository_snapshot_sha256="unicode" + "1" * 57,
            educational_contract={"text": "Hello 世間"},  # Different character
            prohibited_behaviors=PROHIBITED_BEHAVIORS
        )
        
        # Hashes should be different
        hash1 = seal_contract(contract1)
        hash2 = seal_contract(contract2)
        
        assert hash1 != hash2, "Different unicode strings should produce different hashes"
