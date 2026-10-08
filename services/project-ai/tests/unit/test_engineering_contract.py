"""
Unit tests for Engineering Contract - Wave 2 B02

Tests:
- EngineeringContract model construction
- calculate_contract_hash produces valid hash
- Hash changes when any field is modified
- prohibited_behaviors list is populated
- contract_hash field is excluded from hash calculation (no infinite loop)
"""

import pytest
from app.contracts.engineering_contract import (
    EngineeringContract,
    calculate_contract_hash,
    PROHIBITED_BEHAVIORS
)
from app.contracts.repository_intelligence import (
    CanonicalReference,
    RuntimeContract,
    RepositoryEvidence
)
from app.models.workflow_target import WorkflowTarget


@pytest.fixture
def sample_workflow_target():
    """Sample workflow target for testing."""
    return WorkflowTarget(
        workflow_id="test-workflow-001",
        family="Introduction",
        version="I7",
        block_type="introduction",
        specification_id="spec-001",
        source_snapshot_id="snapshot-001"
    )


@pytest.fixture
def sample_canonical_reference():
    """Sample canonical reference with evidence."""
    evidence = RepositoryEvidence(
        path="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        sha256="abcd1234" * 8,  # 64-char hex
        role="canonical_block",
        evidence_id="evidence-001"
    )
    return CanonicalReference(
        family="Introduction",
        version="I1",
        evidence=[evidence]
    )


@pytest.fixture
def sample_engineering_contract(sample_workflow_target, sample_canonical_reference):
    """Sample engineering contract for testing."""
    return EngineeringContract(
        contract_id="contract-001",
        workflow_id="test-workflow-001",
        target=sample_workflow_target,
        repository_snapshot_id="snapshot-001",
        repository_snapshot_sha256="fedcba98" * 8,  # 64-char hex
        canonical_references=[sample_canonical_reference],
        educational_contract={"difficulty": "intermediate"},
        implementation_contract={"language": "TypeScript"},
        type_contract={"strict_mode": True},
        schema_contract={"validation": "Pydantic"},
        ubrc_contract={"required": True},
        renderer_contract={"component_name": "IntroductionI7Block"},
        composer_contract={"composability": "full"},
        runtime_contract=RuntimeContract(),
        theme_contract={"theme_independent": True},
        brand_contract={"brand_independent": True},
        ils_contract={"passive_integration": True},
        lsnb_contract={"page_level_only": True},
        rssb_contract={"page_level_only": True},
        required_artifacts=["HTML/CSS/JS prototype", "React/TypeScript implementation"],
        tests_required=["Unit tests", "Accessibility tests"],
        acceptance_criteria=["Renders correctly", "No console errors"],
        prohibited_behaviors=PROHIBITED_BEHAVIORS,
        contract_hash=""
    )


class TestEngineeringContractConstruction:
    """Test EngineeringContract model construction."""
    
    def test_valid_engineering_contract(self, sample_engineering_contract):
        """Test that a valid EngineeringContract can be constructed."""
        contract = sample_engineering_contract
        
        assert contract.contract_id == "contract-001"
        assert contract.workflow_id == "test-workflow-001"
        assert contract.target.family == "Introduction"
        assert contract.target.version == "I7"
        assert contract.contract_version == "1.0"
        assert len(contract.canonical_references) == 1
        assert contract.canonical_references[0].family == "Introduction"
    
    def test_engineering_contract_with_defaults(self, sample_workflow_target):
        """Test that EngineeringContract uses default values correctly."""
        contract = EngineeringContract(
            contract_id="contract-002",
            workflow_id="test-workflow-002",
            target=sample_workflow_target,
            repository_snapshot_id="snapshot-002",
            repository_snapshot_sha256="abc123" * 10  # 60 chars, but should work
        )
        
        # Default values should be populated
        assert contract.contract_version == "1.0"
        assert contract.canonical_references == []
        assert contract.educational_contract == {}
        assert contract.implementation_contract == {}
        assert contract.required_artifacts == []
        assert contract.tests_required == []
        assert contract.acceptance_criteria == []
        assert contract.prohibited_behaviors == []
        assert contract.contract_hash == ""
        assert isinstance(contract.runtime_contract, RuntimeContract)
    
    def test_engineering_contract_missing_required_field(self, sample_workflow_target):
        """Test that EngineeringContract requires all mandatory fields."""
        with pytest.raises(ValueError):
            EngineeringContract(
                # Missing contract_id
                workflow_id="test-workflow-003",
                target=sample_workflow_target,
                repository_snapshot_id="snapshot-003",
                repository_snapshot_sha256="def456" * 10
            )


class TestContractHash:
    """Test contract hash calculation."""
    
    def test_calculate_contract_hash_produces_valid_hash(self, sample_engineering_contract):
        """Test that calculate_contract_hash produces a 64-character hex string."""
        contract_hash = calculate_contract_hash(sample_engineering_contract)
        
        # SHA-256 produces 64-character hex string
        assert isinstance(contract_hash, str)
        assert len(contract_hash) == 64
        
        # Verify it's valid hex
        int(contract_hash, 16)  # Should not raise
    
    def test_contract_hash_deterministic(self, sample_engineering_contract):
        """Test that the same contract produces the same hash."""
        hash1 = calculate_contract_hash(sample_engineering_contract)
        hash2 = calculate_contract_hash(sample_engineering_contract)
        
        assert hash1 == hash2
    
    def test_contract_hash_changes_when_field_modified(self, sample_engineering_contract):
        """Test that modifying any field changes the hash."""
        original_hash = calculate_contract_hash(sample_engineering_contract)
        
        # Modify a field
        sample_engineering_contract.contract_version = "2.0"
        
        modified_hash = calculate_contract_hash(sample_engineering_contract)
        
        assert original_hash != modified_hash
    
    def test_contract_hash_changes_when_nested_field_modified(self, sample_engineering_contract):
        """Test that modifying a nested field changes the hash."""
        original_hash = calculate_contract_hash(sample_engineering_contract)
        
        # Modify a nested field
        sample_engineering_contract.educational_contract["difficulty"] = "advanced"
        
        modified_hash = calculate_contract_hash(sample_engineering_contract)
        
        assert original_hash != modified_hash
    
    def test_contract_hash_changes_when_list_modified(self, sample_engineering_contract):
        """Test that modifying a list field changes the hash."""
        original_hash = calculate_contract_hash(sample_engineering_contract)
        
        # Modify a list
        sample_engineering_contract.required_artifacts.append("Documentation")
        
        modified_hash = calculate_contract_hash(sample_engineering_contract)
        
        assert original_hash != modified_hash
    
    def test_contract_hash_field_excluded_from_hash_calculation(self):
        """Test that contract_hash field is excluded from hash calculation (no infinite loop)."""
        # Create two contracts that differ only in contract_hash
        target = WorkflowTarget(
            workflow_id="test-workflow-hash",
            family="Introduction",
            version="I7",
            block_type="introduction",
            specification_id="spec-001",
            source_snapshot_id="snapshot-001"
        )
        
        contract1 = EngineeringContract(
            contract_id="contract-hash-test",
            workflow_id="test-workflow-hash",
            target=target,
            repository_snapshot_id="snapshot-001",
            repository_snapshot_sha256="abc" * 21,
            contract_hash="hash1"
        )
        
        contract2 = EngineeringContract(
            contract_id="contract-hash-test",
            workflow_id="test-workflow-hash",
            target=target,
            repository_snapshot_id="snapshot-001",
            repository_snapshot_sha256="abc" * 21,
            contract_hash="hash2"  # Different hash
        )
        
        # Both should produce the same hash because contract_hash is excluded
        hash1 = calculate_contract_hash(contract1)
        hash2 = calculate_contract_hash(contract2)
        
        assert hash1 == hash2


class TestProhibitedBehaviors:
    """Test prohibited behaviors list."""
    
    def test_prohibited_behaviors_list_populated(self, sample_engineering_contract):
        """Test that prohibited_behaviors list is populated."""
        contract = sample_engineering_contract
        
        assert len(contract.prohibited_behaviors) > 0
        assert "implement_duplicate_ils" in contract.prohibited_behaviors
        assert "implement_duplicate_lsnb" in contract.prohibited_behaviors
        assert "implement_duplicate_rssb" in contract.prohibited_behaviors
    
    def test_prohibited_behaviors_constant_has_expected_items(self):
        """Test that PROHIBITED_BEHAVIORS constant has expected architectural boundaries."""
        expected_behaviors = [
            "implement_duplicate_ils",
            "call_ils_api_directly",
            "implement_page_navigation",
            "implement_page_progress",
            "implement_duplicate_lsnb",
            "implement_duplicate_rssb",
            "hard_code_suia_branding",
            "hard_code_rth_branding",
            "create_duplicate_composer",
            "create_duplicate_renderer",
            "modify_unapproved_repository_paths",
        ]
        
        assert len(PROHIBITED_BEHAVIORS) == len(expected_behaviors)
        
        for behavior in expected_behaviors:
            assert behavior in PROHIBITED_BEHAVIORS
    
    def test_prohibited_behaviors_can_be_customized(self, sample_workflow_target):
        """Test that prohibited_behaviors can be customized per contract."""
        custom_behaviors = ["custom_behavior_1", "custom_behavior_2"]
        
        contract = EngineeringContract(
            contract_id="contract-custom",
            workflow_id="test-workflow-custom",
            target=sample_workflow_target,
            repository_snapshot_id="snapshot-custom",
            repository_snapshot_sha256="custom" * 10,
            prohibited_behaviors=custom_behaviors
        )
        
        assert contract.prohibited_behaviors == custom_behaviors


class TestNoHardcodedValuesRegression:
    """Test that no hardcoded values remain in contract.py."""
    
    def test_no_hardcoded_values_in_contract(self):
        """Test that create_engineering_contract function contains no hardcoded strings."""
        from pathlib import Path
        import re
        
        # Read contract.py source
        contract_file = Path(__file__).parent.parent.parent / "app" / "api" / "routes" / "contract.py"
        with open(contract_file, 'r', encoding='utf-8') as f:
            source = f.read()
        
        # Extract create_engineering_contract function body
        # Find the function definition
        func_pattern = r'async def create_engineering_contract\(.*?\):\s*""".*?"""(.*?)(?=\n(?:async )?def |@router\.|$)'
        match = re.search(func_pattern, source, re.DOTALL)
        
        if not match:
            pytest.fail("Could not find create_engineering_contract function in contract.py")
        
        func_body = match.group(1)
        
        # Check for hardcoded values that should NOT appear in the function body
        # (excluding comments and docstrings)
        hardcoded_values = [
            ('"intermediate"', 'difficulty level'),
            ("'intermediate'", 'difficulty level'),
            ('"TypeScript"', 'language'),
            ("'TypeScript'", 'language'),
            ('"React"', 'framework'),
            ("'React'", 'framework'),
            ('"CSS Modules"', 'style'),
            ("'CSS Modules'", 'style'),
        ]
        
        # Remove comments from function body
        lines = func_body.split('\n')
        code_lines = []
        for line in lines:
            # Remove inline comments but keep string literals
            if '#' in line:
                # Simple heuristic: split on # but check if it's inside a string
                # For this test, we'll just check the full line
                code_lines.append(line)
            else:
                code_lines.append(line)
        
        func_body_no_comments = '\n'.join(code_lines)
        
        # Check each hardcoded value
        for value, description in hardcoded_values:
            if value in func_body_no_comments:
                # Check if it's in a comment by looking at the line
                lines_with_value = [line for line in code_lines if value in line]
                non_comment_lines = [line for line in lines_with_value if not line.strip().startswith('#')]
                
                if non_comment_lines:
                    pytest.fail(
                        f"Found hardcoded {description} value {value} in create_engineering_contract function body. "
                        f"This should be replaced with repo_contract field. Lines: {non_comment_lines}"
                    )


class TestContractImmutability:
    """Test contract immutability via hash."""
    
    def test_contract_immutability_detection(self, sample_engineering_contract):
        """Test that hash can detect contract tampering."""
        # Calculate original hash
        original_hash = calculate_contract_hash(sample_engineering_contract)
        sample_engineering_contract.contract_hash = original_hash
        
        # Store the hash for verification
        stored_hash = sample_engineering_contract.contract_hash
        
        # Simulate tampering: modify a field
        sample_engineering_contract.contract_version = "99.0"
        
        # Recalculate hash
        current_hash = calculate_contract_hash(sample_engineering_contract)
        
        # Hash mismatch indicates tampering
        assert stored_hash != current_hash
    
    def test_contract_integrity_verification(self, sample_engineering_contract):
        """Test that integrity can be verified by recalculating hash."""
        # Set the hash
        contract_hash = calculate_contract_hash(sample_engineering_contract)
        sample_engineering_contract.contract_hash = contract_hash
        
        # Verify integrity by recalculating
        recalculated_hash = calculate_contract_hash(sample_engineering_contract)
        
        # Should match if contract is unmodified
        assert sample_engineering_contract.contract_hash == recalculated_hash
    
    def test_hash_includes_all_thirteen_gate_contracts(self, sample_engineering_contract):
        """
        Test that modifying each of the thirteen gate contract fields changes the hash.
        
        This prevents future bugs where a field is accidentally excluded from hash calculation,
        which would allow tampering that field without changing the hash.
        
        The thirteen gate contracts are:
        1. educational_contract
        2. implementation_contract
        3. type_contract
        4. schema_contract
        5. ubrc_contract
        6. renderer_contract
        7. composer_contract
        8. runtime_contract
        9. theme_contract
        10. brand_contract
        11. ils_contract
        12. lsnb_contract
        13. rssb_contract
        """
        # Calculate original hash
        original_hash = calculate_contract_hash(sample_engineering_contract)
        
        # Test each gate contract field
        gate_contract_fields = [
            ("educational_contract", {"new_field": "tampered"}),
            ("implementation_contract", {"new_field": "tampered"}),
            ("type_contract", {"new_field": "tampered"}),
            ("schema_contract", {"new_field": "tampered"}),
            ("ubrc_contract", {"new_field": "tampered"}),
            ("renderer_contract", {"new_field": "tampered"}),
            ("composer_contract", {"new_field": "tampered"}),
            ("runtime_contract", RuntimeContract(ub_rc_required=False)),  # Change a field
            ("theme_contract", {"new_field": "tampered"}),
            ("brand_contract", {"new_field": "tampered"}),
            ("ils_contract", {"new_field": "tampered"}),
            ("lsnb_contract", {"new_field": "tampered"}),
            ("rssb_contract", {"new_field": "tampered"}),
        ]
        
        for field_name, tampered_value in gate_contract_fields:
            # Create a fresh contract for each test
            contract = sample_engineering_contract.model_copy(deep=True)
            
            # Modify this gate contract field
            setattr(contract, field_name, tampered_value)
            
            # Calculate hash
            modified_hash = calculate_contract_hash(contract)
            
            # Hash MUST change when any gate contract is modified
            assert modified_hash != original_hash, \
                f"Hash did not change when {field_name} was modified. " \
                f"This field may be excluded from hash calculation!"
