"""
Integration tests for W2 Engineering Contract Generation.

These tests call the current FastAPI route function directly and pass its
dependency-injected collaborators explicitly.
"""

import pytest
import pytest_asyncio
from fastapi import HTTPException
from unittest.mock import patch

from app.api.routes.contract import create_engineering_contract
from app.contracts.engineering_contract import PROHIBITED_BEHAVIORS, seal_contract
from app.contracts.repository_intelligence import RuntimeContract
from app.models.workflow_target import WorkflowTarget
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.orchestration.workflow_governance import WorkflowGovernanceService


TEST_USER = {
    "user_id": "test-admin",
    "brand": "skillhub",
    "roles": ["contract_admin"],
    "token_type": "admin",
    "is_admin": True,
}


@pytest_asyncio.fixture
async def governance_service(workflow_repo, approval_repo, state_transition_repo, db_session):
    """Fixture for governance service."""
    return WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session,
    )


@pytest_asyncio.fixture
async def test_workflow(governance_service, db_session):
    """Create a test workflow in the contract-generatable DISCOVERY state."""
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I1",
        requester_id="test-user",
        purpose="Test W2 contract generation",
    )
    await governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.DISCOVERY,
        triggered_by="test",
        reason="Prepare W2 contract generation",
    )
    await db_session.commit()
    return await governance_service.get_workflow(workflow.workflow_id)


@pytest.fixture
def mock_snapshot():
    """Mock TypeScript repository snapshot."""
    return {
        "timestamp": "2024-01-15T10:00:00Z",
        "metadata": {
            "language": "TypeScript",
            "framework": "React",
            "style": "CSS Modules",
            "difficulty_level": "intermediate",
        },
        "evidence": [
            {
                "kind": "canonical_block",
                "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                "contentHash": "a" * 64,
                "evidenceId": "evidence-" + "a" * 16,
            },
            {
                "kind": "test",
                "path": "packages/ui/src/tutorial/blocks/__tests__/IntroductionBlock.test.tsx",
                "contentHash": "b" * 64,
                "evidenceId": "evidence-" + "b" * 16,
            },
            {
                "kind": "config",
                "path": "tsconfig.json",
                "contentHash": "c" * 64,
                "evidenceId": "evidence-" + "c" * 16,
            },
        ],
    }


async def generate_contract(
    workflow_id,
    governance_service,
    contract_repo,
    db_session,
):
    return await create_engineering_contract(
        workflow_id=workflow_id,
        user=TEST_USER,
        governance_service=governance_service,
        contract_repo=contract_repo,
        session=db_session,
    )


class TestW2ContractGenerationWithRealW1AWiring:
    """Test contract generation with real W1A target binding."""

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_contract_uses_real_w1a_target(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        test_workflow,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "b" * 64

        contract = await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        assert contract.target.family == "Introduction"
        assert contract.target.version == "I1"
        assert contract.target.workflow_id == test_workflow.workflow_id
        assert contract.workflow_id == test_workflow.workflow_id
        assert contract.workflow_id != "placeholder"

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_contract_fails_if_target_family_empty(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        workflow = await governance_service.create_workflow(
            target_family="",
            target_version="I1",
            requester_id="test-user",
        )
        await governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.DISCOVERY,
            triggered_by="test",
            reason="Prepare W2 contract generation",
        )
        await db_session.commit()

        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "b" * 64

        with pytest.raises(HTTPException) as exc_info:
            await generate_contract(
                workflow.workflow_id,
                governance_service,
                contract_repo,
                db_session,
            )

        assert exc_info.value.status_code == 400
        assert "empty target_family" in str(exc_info.value.detail).lower()


class TestW2ContractGenerationWithRealW1BWiring:
    """Test contract generation with real W1B repository intelligence."""

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_contract_uses_real_w1b_repository_intelligence(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        test_workflow,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "b" * 64

        contract = await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        assert len(contract.canonical_references) >= 1
        assert contract.repository_snapshot_sha256 == "b" * 64
        assert len(contract.required_artifacts) > 0
        assert len(contract.acceptance_criteria) > 0
        assert contract.implementation_contract["language"] == "TypeScript"
        assert contract.implementation_contract["framework"] == "React"
        assert contract.implementation_contract["style"] == "CSS Modules"
        assert contract.educational_contract["difficulty_level"] == "intermediate"

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_contract_generation_fails_without_evidence(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        governance_service,
        contract_repo,
        db_session,
    ):
        incomplete_snapshot = {
            "timestamp": "2024-01-15T10:00:00Z",
            "metadata": {},
            "evidence": [
                {
                    "kind": "canonical_block",
                    "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                    "contentHash": "a" * 64,
                    "evidenceId": "evidence-intro-001",
                }
            ],
        }
        workflow = await governance_service.create_workflow(
            target_family="Unknown",
            target_version="X1",
            requester_id="test-user",
        )
        await governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.DISCOVERY,
            triggered_by="test",
            reason="Prepare W2 contract generation",
        )
        await db_session.commit()

        mock_load_snapshot.return_value = incomplete_snapshot
        mock_snapshot_sha.return_value = "x" * 64

        with pytest.raises(HTTPException) as exc_info:
            await generate_contract(
                workflow.workflow_id,
                governance_service,
                contract_repo,
                db_session,
            )

        assert exc_info.value.status_code == 503
        assert "evidence" in str(exc_info.value.detail).lower()


class TestContractSHA256Determinism:
    """Test that contract SHA-256 is deterministic."""

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_same_inputs_produce_same_hash(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        workflow1 = await governance_service.create_workflow(
            target_family="Introduction",
            target_version="I1",
            requester_id="test-user",
        )
        workflow2 = await governance_service.create_workflow(
            target_family="Introduction",
            target_version="I1",
            requester_id="test-user",
        )
        for workflow in (workflow1, workflow2):
            await governance_service.transition_state(
                workflow_id=workflow.workflow_id,
                to_state=CanonicalWorkflowState.DISCOVERY,
                triggered_by="test",
                reason="Prepare W2 contract generation",
            )
        await db_session.commit()

        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "c" * 64

        contract1 = await generate_contract(
            workflow1.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )
        contract2 = await generate_contract(
            workflow2.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        assert contract1.contract_id != contract2.contract_id

        contract2_copy = contract2.model_copy(deep=True)
        contract2_copy.contract_id = contract1.contract_id
        contract2_copy.workflow_id = contract1.workflow_id
        contract2_copy.target = contract1.target.model_copy(deep=True)
        contract2_copy.repository_snapshot_id = contract1.repository_snapshot_id

        assert seal_contract(contract1) == seal_contract(contract2_copy)

    def test_modified_contract_produces_different_hash(self, test_workflow):
        from app.contracts.engineering_contract import EngineeringContract

        contract = EngineeringContract(
            contract_id="test-contract",
            workflow_id=test_workflow.workflow_id,
            target=WorkflowTarget(
                workflow_id=test_workflow.workflow_id,
                family="Introduction",
                version="I7",
                block_type="introduction",
                specification_id="I7",
                source_snapshot_id="snapshot-001",
            ),
            repository_snapshot_id="snapshot-001",
            repository_snapshot_sha256="d" * 64,
            runtime_contract=RuntimeContract(),
            prohibited_behaviors=PROHIBITED_BEHAVIORS,
        )

        original_hash = seal_contract(contract)
        contract.contract_version = "2.0"
        modified_hash = seal_contract(contract)

        assert original_hash != modified_hash


class TestContractImmutabilityAfterWorkflowBinding:
    """Test contract immutability after workflow binding."""

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_second_contract_call_returns_same_contract(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        test_workflow,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "e" * 64

        contract1 = await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )
        contract2 = await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        assert contract1.contract_id == contract2.contract_id
        assert contract1.contract_hash == contract2.contract_hash
        assert contract1 == contract2


class TestWorkflowStateTransition:
    """Test workflow state transitions after contract generation."""

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_workflow_transitions_to_brief_ready(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        test_workflow,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "f" * 64

        await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        updated_workflow = await governance_service.get_workflow(test_workflow.workflow_id)
        assert updated_workflow.current_state == CanonicalWorkflowState.BRIEF_READY

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_contract_artifact_binding(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        test_workflow,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "g" * 64

        contract = await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        updated_workflow = await governance_service.get_workflow(test_workflow.workflow_id)
        assert str(updated_workflow.contract_id) == contract.contract_id
        assert updated_workflow.contract_sha256 == contract.contract_hash


class TestProhibitedBehaviorsPopulated:
    """Test that prohibited behaviors are populated in contract."""

    @patch("app.api.routes.contract.calculate_snapshot_sha256")
    @patch("app.api.routes.contract.load_repository_snapshot")
    async def test_prohibited_behaviors_in_contract(
        self,
        mock_load_snapshot,
        mock_snapshot_sha,
        test_workflow,
        governance_service,
        contract_repo,
        db_session,
        mock_snapshot,
    ):
        mock_load_snapshot.return_value = mock_snapshot
        mock_snapshot_sha.return_value = "h" * 64

        contract = await generate_contract(
            test_workflow.workflow_id,
            governance_service,
            contract_repo,
            db_session,
        )

        assert len(contract.prohibited_behaviors) == len(PROHIBITED_BEHAVIORS)
        for behavior in PROHIBITED_BEHAVIORS:
            assert behavior in contract.prohibited_behaviors
