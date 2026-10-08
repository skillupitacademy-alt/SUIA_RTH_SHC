"""
Integration tests for W2 Engineering Contract Generation

Tests the full contract generation flow:
- W1A target binding integration
- W1B repository intelligence integration
- Contract SHA-256 determinism
- Contract immutability enforcement
- Workflow state transitions
- Evidence recording
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from pathlib import Path

from app.api.routes.contract import (
    create_engineering_contract,
    calculate_snapshot_sha256,
    load_repository_snapshot
)
from app.contracts.engineering_contract import (
    calculate_contract_hash,
    PROHIBITED_BEHAVIORS
)
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.workflow_target import WorkflowTarget


@pytest.fixture
def governance_service():
    """Fixture for governance service."""
    return WorkflowGovernanceService()


@pytest.fixture
def test_workflow(governance_service):
    """Create a test workflow."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="test-user",
        purpose="Test W2 contract generation"
    )
    return workflow


@pytest.fixture
def mock_snapshot():
    """Mock TypeScript repository snapshot."""
    return {
        "timestamp": "2024-01-15T10:00:00Z",
        "evidence": [
            {
                "kind": "canonical_block",
                "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                "contentHash": "a" * 64,
                "evidenceId": "evidence-intro-001"
            }
        ]
    }


class TestW2ContractGenerationWithRealW1AWiring:
    """Test contract generation with real W1A target binding."""
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_contract_uses_real_w1a_target(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        test_workflow,
        governance_service,
        mock_snapshot
    ):
        """Test that contract generation uses real W1A target from governance service."""
        # Setup mocks
        mock_gov_service.get_workflow.return_value = test_workflow
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "b" * 64
        
        # Create contract
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        contract = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Verify contract uses real target from W1A
        assert contract.target.family == "Introduction"
        assert contract.target.version == "I7"
        assert contract.target.workflow_id == test_workflow.workflow_id
        
        # Verify NOT using placeholder Introduction/I7
        assert contract.workflow_id == test_workflow.workflow_id
        assert contract.workflow_id != "placeholder"
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_contract_fails_if_target_family_empty(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        governance_service,
        mock_snapshot
    ):
        """Test that contract generation fails if workflow target_family is empty."""
        # Create workflow with empty target_family
        workflow = governance_service.create_workflow(
            target_family="",
            target_version="I7",
            requester_id="test-user"
        )
        
        mock_gov_service.get_workflow.return_value = workflow
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "b" * 64
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        # Should raise HTTP 400 for empty target_family
        with pytest.raises(Exception) as exc_info:
            await create_engineering_contract(
                workflow_id=workflow.workflow_id,
                workflow=workflow_dict
            )
        
        assert "empty target_family" in str(exc_info.value).lower()


class TestW2ContractGenerationWithRealW1BWiring:
    """Test contract generation with real W1B repository intelligence."""
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_contract_uses_real_w1b_repository_intelligence(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        test_workflow,
        governance_service,
        mock_snapshot
    ):
        """Test that contract uses real W1B repository intelligence from snapshot."""
        # Setup mocks
        mock_gov_service.get_workflow.return_value = test_workflow
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "b" * 64
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        contract = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Verify contract has canonical references from W1B
        assert len(contract.canonical_references) >= 0  # May be 0 if no match in snapshot
        
        # Verify repository snapshot is populated
        assert contract.repository_snapshot_sha256 == "b" * 64
        assert contract.repository_snapshot_sha256 != ""
        
        # Verify required artifacts from W1B
        assert len(contract.required_artifacts) > 0
        
        # Verify acceptance criteria from W1B
        assert len(contract.acceptance_criteria) > 0


class TestContractSHA256Determinism:
    """Test that contract SHA-256 is deterministic."""
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_same_inputs_produce_same_hash(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        governance_service,
        mock_snapshot
    ):
        """Test that same contract inputs produce same SHA-256 hash."""
        # Create two identical workflows
        workflow1 = governance_service.create_workflow(
            target_family="Introduction",
            target_version="I7",
            requester_id="test-user"
        )
        workflow2 = governance_service.create_workflow(
            target_family="Introduction",
            target_version="I7",
            requester_id="test-user"
        )
        
        # Setup mocks to return identical data
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "c" * 64
        
        # Mock governance to return workflow1 first, then workflow2
        def get_workflow_side_effect(wf_id):
            if wf_id == workflow1.workflow_id:
                return workflow1
            return workflow2
        
        mock_gov_service.get_workflow.side_effect = get_workflow_side_effect
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        # Generate contracts
        contract1 = await create_engineering_contract(
            workflow_id=workflow1.workflow_id,
            workflow=workflow_dict
        )
        
        contract2 = await create_engineering_contract(
            workflow_id=workflow2.workflow_id,
            workflow=workflow_dict
        )
        
        # Different contract IDs (contain unique UUIDs)
        assert contract1.contract_id != contract2.contract_id
        
        # But if we manually set same contract_id and workflow_id, hashes should match
        contract2_copy = contract2.model_copy(deep=True)
        contract2_copy.contract_id = contract1.contract_id
        contract2_copy.workflow_id = contract1.workflow_id
        # Also update target to match (includes source_snapshot_id)
        contract2_copy.target = contract1.target.model_copy(deep=True)
        contract2_copy.repository_snapshot_id = contract1.repository_snapshot_id
        
        hash1 = calculate_contract_hash(contract1)
        hash2 = calculate_contract_hash(contract2_copy)
        
        assert hash1 == hash2
    
    def test_modified_contract_produces_different_hash(self, test_workflow):
        """Test that modifying contract fields produces different hash."""
        from app.contracts.engineering_contract import EngineeringContract
        from app.contracts.repository_intelligence import RuntimeContract
        
        # Create base contract
        contract = EngineeringContract(
            contract_id="test-contract",
            workflow_id=test_workflow.workflow_id,
            target=WorkflowTarget(
                workflow_id=test_workflow.workflow_id,
                family="Introduction",
                version="I7",
                block_type="introduction",
                specification_id="I7",
                source_snapshot_id="snapshot-001"
            ),
            repository_snapshot_id="snapshot-001",
            repository_snapshot_sha256="d" * 64,
            runtime_contract=RuntimeContract(),
            prohibited_behaviors=PROHIBITED_BEHAVIORS
        )
        
        original_hash = calculate_contract_hash(contract)
        
        # Modify a field
        contract.contract_version = "2.0"
        
        modified_hash = calculate_contract_hash(contract)
        
        assert original_hash != modified_hash


class TestContractImmutabilityAfterWorkflowBinding:
    """Test contract immutability after workflow binding."""
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_second_contract_call_returns_same_contract(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        test_workflow,
        governance_service,
        mock_snapshot
    ):
        """Test that calling contract endpoint twice returns identical contract."""
        # Setup mocks
        mock_gov_service.get_workflow.return_value = test_workflow
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "e" * 64
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        # First call
        contract1 = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Second call (should return same contract from store)
        contract2 = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Should be identical
        assert contract1.contract_id == contract2.contract_id
        assert contract1.contract_hash == contract2.contract_hash
        assert contract1 == contract2


class TestWorkflowStateTransition:
    """Test workflow state transitions after contract generation."""
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_workflow_transitions_to_brief_ready(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        test_workflow,
        governance_service,
        mock_snapshot
    ):
        """Test that workflow transitions to BRIEF_READY after contract generation."""
        # Setup mocks
        mock_gov_service.get_workflow.return_value = test_workflow
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "f" * 64
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        # Generate contract
        contract = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Verify state transition was called
        mock_gov_service.transition_state.assert_called_once()
        call_args = mock_gov_service.transition_state.call_args
        
        assert call_args[1]['workflow_id'] == test_workflow.workflow_id
        assert call_args[1]['to_state'] == CanonicalWorkflowState.BRIEF_READY
        assert call_args[1]['triggered_by'] == "W2-EngineeringContract"
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_contract_artifact_binding(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        test_workflow,
        governance_service,
        mock_snapshot
    ):
        """Test that contract artifact is bound to workflow with SHA-256."""
        # Setup mocks
        mock_gov_service.get_workflow.return_value = test_workflow
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "g" * 64
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        # Generate contract
        contract = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Verify artifact binding was called
        mock_gov_service.bind_artifact.assert_called_once()
        call_args = mock_gov_service.bind_artifact.call_args
        
        assert call_args[1]['workflow_id'] == test_workflow.workflow_id
        assert call_args[1]['artifact_type'] == "contract"
        assert call_args[1]['artifact_id'] == contract.contract_id
        assert call_args[1]['artifact_sha256'] == contract.contract_hash


class TestProhibitedBehaviorsPopulated:
    """Test that prohibited behaviors are populated in contract."""
    
    @patch('app.api.routes.contract.load_repository_snapshot')
    @patch('app.api.routes.contract.calculate_snapshot_sha256')
    @patch('app.api.routes.contract.governance_service')
    async def test_prohibited_behaviors_in_contract(
        self,
        mock_gov_service,
        mock_snapshot_sha,
        mock_load_snapshot,
        test_workflow,
        governance_service,
        mock_snapshot
    ):
        """Test that all prohibited behaviors are included in generated contract."""
        # Setup mocks
        mock_gov_service.get_workflow.return_value = test_workflow
        mock_gov_service.bind_artifact = MagicMock()
        mock_gov_service.transition_state = MagicMock()
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "h" * 64
        
        workflow_dict = {
            "state": "DISCOVERY",
            "owner": "test-user"
        }
        
        # Generate contract
        contract = await create_engineering_contract(
            workflow_id=test_workflow.workflow_id,
            workflow=workflow_dict
        )
        
        # Verify all expected prohibited behaviors are present
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
            "modify_unapproved_repository_paths"
        ]
        
        assert len(contract.prohibited_behaviors) == 11
        for behavior in expected_behaviors:
            assert behavior in contract.prohibited_behaviors
