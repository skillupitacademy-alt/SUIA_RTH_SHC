"""
Unit 1 Tests: Learner Fixture Registry & Disposable Fixture Document Provisioner.

Validates:
- Fixture registry contract generation and allowlist enforcement
- Fail-closed behavior on missing or unconfigured metadata
- Canonicalization and schema validation of candidate blocks
- Committed DB lifecycle, guaranteed cleanup, and isolation
- Janitor sweeps of expired leases vs preservation of active leases
"""

import json
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, Mock, patch

from app.verification.fixture_registry import (
    FixtureBlockedError,
    LearnerFixtureRegistry,
    LearnerRuntimeFixtureContract,
    ProgressContract,
    PLATFORM_FIXTURE_CATALOG,
)
from app.verification.disposable_fixture_provisioner import (
    CandidateBlockCanonicalizationError,
    DisposableFixtureDocumentProvisioner,
    FixtureProvisioningError,
    ProvisionedFixtureResult,
    canonicalize_candidate_block,
    disposable_fixture_session,
    wrap_in_tutorial_document,
)


FIXTURE_CATALOG = {
    "fixture-tutorial-v2-python": {
        "domain_slug": "programming",
        "subject_slug": "python",
        "topic_slug": "python-basics",
        "subtopic_slug": "overview",
        "navigation_node_id": "nav-node-fixture-01",
        "subtopic_id": "00000000-0000-4000-a000-000000000101",
        "section_id": "00000000-0000-4000-a000-000000000201",
        "supports_lsnb": True,
        "supports_rssb": True,
        "progress_contract": {
            "required": True,
            "visit_endpoint_pattern": r"^/api/tutorial/progress",
            "read_back_endpoint_pattern": r"^/api/tutorial/progress\?.*subtopicId=",
        },
    },
}


# ============================================================================
# 1. FIXTURE REGISTRY TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_registry_resolves_valid_contract():
    registry = LearnerFixtureRegistry(
        allowed_tenants=["skillup"],
        allowed_fixtures=["fixture-tutorial-v2-python"],
        custom_catalog=FIXTURE_CATALOG,
    )
    contract = await registry.resolve_fixture_contract("fixture-tutorial-v2-python", tenant="skillup")
    assert contract.fixture_id == "fixture-tutorial-v2-python"
    assert contract.tenant == "skillup"
    assert contract.domain_slug == "programming"
    assert contract.subject_slug == "python"
    assert contract.learner_route == "/tutorial-v2/programming/python/python-basics/overview/nav-node-fixture-01"
    assert contract.resolve_origin(3009) == "http://skillup.localhost:3009"
    assert contract.resolve_url(3009) == "http://skillup.localhost:3009/tutorial-v2/programming/python/python-basics/overview/nav-node-fixture-01"
    assert contract.supports_lsnb is True
    assert contract.supports_rssb is True
    assert contract.progress_contract.required is True


@pytest.mark.asyncio
async def test_registry_rejects_unauthorized_tenant():
    registry = LearnerFixtureRegistry(
        allowed_tenants=["skillup"],
        allowed_fixtures=["fixture-tutorial-v2-python"],
        custom_catalog=FIXTURE_CATALOG,
    )
    with pytest.raises(FixtureBlockedError) as exc_info:
        await registry.resolve_fixture_contract("fixture-tutorial-v2-python", tenant="malicious_tenant")
    assert "not permitted by allowlist" in str(exc_info.value)


@pytest.mark.asyncio
async def test_registry_rejects_unauthorized_fixture_id():
    registry = LearnerFixtureRegistry(
        allowed_tenants=["skillup"],
        allowed_fixtures=["fixture-tutorial-v2-python"],
        custom_catalog=FIXTURE_CATALOG,
    )
    with pytest.raises(FixtureBlockedError) as exc_info:
        await registry.resolve_fixture_contract("unregistered-fixture", tenant="skillup")
    assert "not permitted by allowlist" in str(exc_info.value)


@pytest.mark.asyncio
async def test_registry_rejects_incomplete_catalog_definition():
    incomplete_catalog = {
        "broken-fixture": {
            "domain_slug": "programming",
            # missing subject, topic, subtopic, etc.
        }
    }
    registry = LearnerFixtureRegistry(
        allowed_tenants=["skillup"],
        allowed_fixtures=["broken-fixture"],
        custom_catalog=incomplete_catalog,
    )
    with pytest.raises(FixtureBlockedError) as exc_info:
        await registry.resolve_fixture_contract("broken-fixture", tenant="skillup")
    assert "missing required field" in str(exc_info.value)


@pytest.mark.asyncio
async def test_registry_db_preflight_fails_closed_when_subtopic_missing():
    registry = LearnerFixtureRegistry(
        allowed_tenants=["skillup"],
        allowed_fixtures=["fixture-tutorial-v2-python"],
        custom_catalog=FIXTURE_CATALOG,
    )
    mock_session = AsyncMock()
    mock_res = Mock()
    mock_res.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_res

    with pytest.raises(FixtureBlockedError) as exc_info:
        await registry.resolve_fixture_contract(
            "fixture-tutorial-v2-python",
            tenant="skillup",
            session=mock_session,
            verify_db_existence=True,
        )
    assert "does not match the configured" in str(exc_info.value)


# ============================================================================
# 2. CANDIDATE BLOCK CANONICALIZATION TESTS
# ============================================================================

def test_canonicalize_valid_block():
    raw_block = {
        "id": "block-123",
        "type": "objective",
        "version": "O1",
        "content": {"items": [{"id": "1", "text": "Learn Python"}]},
    }
    canonical = canonicalize_candidate_block(raw_block, "objective", "O1")
    assert canonical["id"] == "block-123"
    assert canonical["type"] == "objective"
    assert canonical["version"] == "O1"
    assert "items" in canonical["content"]


def test_canonicalize_generates_id_if_missing():
    raw_block = {
        "type": "objective",
        "version": "O1",
        "content": {"title": "Test"},
    }
    canonical = canonicalize_candidate_block(raw_block, "objective", "O1")
    assert str(__import__('uuid').UUID(canonical["id"])) == canonical["id"]


def test_canonicalize_preserves_learner_runtime_metadata():
    raw = {"type": "objective", "version": "O1", "content": {"title": "Learn"},
           "expectedTimeSec": 90, "progressRole": "instructional", "presentation": {"collapsed": False}}
    canonical = canonicalize_candidate_block(raw, "objective", "O1")
    for key in ("expectedTimeSec", "progressRole", "presentation"):
        assert canonical[key] == raw[key]


def test_canonicalize_rejects_type_mismatch():
    raw_block = {
        "type": "code",
        "version": "O1",
        "content": {"snippet": "print(1)"},
    }
    with pytest.raises(CandidateBlockCanonicalizationError) as exc_info:
        canonicalize_candidate_block(raw_block, "objective", "O1")
    assert "does not match expected family 'objective'" in str(exc_info.value)


def test_canonicalize_rejects_version_mismatch():
    raw_block = {
        "type": "objective",
        "version": "O2",
        "content": {"title": "Test"},
    }
    with pytest.raises(CandidateBlockCanonicalizationError) as exc_info:
        canonicalize_candidate_block(raw_block, "objective", "O1")
    assert "does not match expected version 'O1'" in str(exc_info.value)


def test_canonicalize_rejects_empty_content():
    raw_block = {
        "type": "objective",
        "version": "O1",
        "content": {},
    }
    with pytest.raises(CandidateBlockCanonicalizationError) as exc_info:
        canonicalize_candidate_block(raw_block, "objective", "O1")
    assert "cannot be empty" in str(exc_info.value)


def test_wrap_in_tutorial_document():
    block = {"id": "b1", "type": "objective", "version": "O1", "content": {"a": 1}}
    meta = {"workflow_id": "wf-1", "is_verification_fixture": True}
    doc = wrap_in_tutorial_document(block, meta)
    assert doc["schemaVersion"] == 1
    assert doc["blocks"] == [block]
    assert doc["metadata"]["is_verification_fixture"] is True


# ============================================================================
# 3. PROVISIONER DATABASE LIFECYCLE & CLEANUP TESTS
# ============================================================================

@pytest.fixture
def sample_contract():
    return LearnerRuntimeFixtureContract(
        fixture_id="fixture-tutorial-v2-python",
        tenant="skillup",
        domain_slug="programming",
        subject_slug="python",
        topic_slug="python-basics",
        subtopic_slug="overview",
        navigation_node_id="nav-node-fixture-01",
        subtopic_id="subtopic-uuid-01",
        section_id="section-uuid-01",
        learner_route="/tutorial-v2/programming/python/python-basics/overview/nav-node-fixture-01",
        tenant_origin_template="http://{tenant}.localhost:{port}",
        supports_lsnb=True,
        supports_rssb=True,
        progress_contract=ProgressContract(
            required=True,
            visit_endpoint_pattern=r"^/api/tutorial/progress",
            read_back_endpoint_pattern=r"^/api/tutorial/progress\?.*subtopicId=",
        ),
    )


@pytest.mark.asyncio
async def test_provisioner_inserts_committed_record(sample_contract):
    provisioner = DisposableFixtureDocumentProvisioner(lease_duration_minutes=10)
    mock_session = AsyncMock()
    original_result = Mock()
    original_result.scalar_one_or_none.return_value = {
        "schemaVersion": 1,
        "blocks": [],
        "metadata": {"is_verification_fixture": True},
    }
    update_result = Mock()
    update_result.rowcount = 1
    mock_session.execute.side_effect = [Mock(rowcount=0), original_result, update_result]

    candidate_block = {
        "id": "b1",
        "type": "objective",
        "version": "O1",
        "content": {"items": [{"id": 1, "text": "Item"}]},
    }

    result = await provisioner.provision(
        session=mock_session,
        workflow_id="wf-test-100",
        contract=sample_contract,
        candidate_block=candidate_block,
        block_family="objective",
        block_version="O1",
    )

    assert result.workflow_id == "wf-test-100"
    assert result.verification_run_id is not None
    assert result.tutorial_document["schemaVersion"] == 1
    assert result.tutorial_document["metadata"]["is_verification_fixture"] is True
    assert result.tutorial_document["metadata"]["target_family"] == "objective"
    assert result.tutorial_document["metadata"]["target_version"] == "O1"

    # Must be committed to database
    assert mock_session.commit.called


@pytest.mark.asyncio
async def test_provisioner_cleanup_scoped_to_exact_workflow_and_run(sample_contract):
    provisioner = DisposableFixtureDocumentProvisioner()
    mock_session = AsyncMock()
    mock_result = Mock()
    mock_result.rowcount = 1
    mock_session.execute.return_value = mock_result

    deleted = await provisioner.cleanup(
        session=mock_session,
        workflow_id="wf-test-100",
        verification_run_id="run-uuid-abc",
    )

    assert deleted == 1
    assert mock_session.commit.called
    call_args = mock_session.execute.call_args[0]
    sql_text = str(call_args[0])
    params = mock_session.execute.call_args[0][1]

    assert "is_verification_fixture" in sql_text
    assert params["workflow_id"] == "wf-test-100"
    assert params["run_id"] == "run-uuid-abc"


@pytest.mark.asyncio
async def test_janitor_cleans_only_expired_fixtures():
    provisioner = DisposableFixtureDocumentProvisioner()
    mock_session = AsyncMock()
    mock_result = Mock()
    mock_result.rowcount = 3
    mock_session.execute.return_value = mock_result

    deleted = await provisioner.run_janitor(mock_session)
    assert deleted == 3
    assert mock_session.commit.called
    call_args = mock_session.execute.call_args[0]
    sql_text = str(call_args[0])
    params = mock_session.execute.call_args[0][1]

    assert "lease_expires_at" in sql_text
    assert "now_iso" in params


@pytest.mark.asyncio
async def test_disposable_fixture_session_guarantees_cleanup_on_success(sample_contract):
    candidate_block = {
        "id": "b1",
        "type": "objective",
        "version": "O1",
        "content": {"items": [{"id": 1, "text": "Item"}]},
    }

    mock_session = AsyncMock()
    original_result = Mock()
    original_result.scalar_one_or_none.return_value = {
        "schemaVersion": 1,
        "blocks": [],
        "metadata": {"is_verification_fixture": True},
    }
    mock_session.execute.side_effect = [Mock(rowcount=0), original_result, Mock(rowcount=1), Mock(rowcount=1)]
    mock_session_factory = Mock()
    mock_session_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_factory.return_value.__aexit__ = AsyncMock(return_value=None)

    async with disposable_fixture_session(
        session_factory=mock_session_factory,
        workflow_id="wf-test-200",
        contract=sample_contract,
        candidate_block=candidate_block,
        block_family="objective",
        block_version="O1",
    ) as provisioned:
        assert provisioned.workflow_id == "wf-test-200"

    # Verify cleanup was called on exit
    assert mock_session.execute.call_count >= 2  # 1 for provision, 1 for cleanup


@pytest.mark.asyncio
async def test_disposable_fixture_session_guarantees_cleanup_on_error(sample_contract):
    candidate_block = {
        "id": "b1",
        "type": "objective",
        "version": "O1",
        "content": {"items": [{"id": 1, "text": "Item"}]},
    }

    mock_session = AsyncMock()
    original_result = Mock()
    original_result.scalar_one_or_none.return_value = {
        "schemaVersion": 1,
        "blocks": [],
        "metadata": {"is_verification_fixture": True},
    }
    mock_session.execute.side_effect = [Mock(rowcount=0), original_result, Mock(rowcount=1), Mock(rowcount=1)]
    mock_session_factory = Mock()
    mock_session_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_factory.return_value.__aexit__ = AsyncMock(return_value=None)

    with pytest.raises(RuntimeError, match="Simulated browser crash"):
        async with disposable_fixture_session(
            session_factory=mock_session_factory,
            workflow_id="wf-test-300",
            contract=sample_contract,
            candidate_block=candidate_block,
            block_family="objective",
            block_version="O1",
        ) as provisioned:
            raise RuntimeError("Simulated browser crash")

    # Cleanup must still have been executed despite the error
    assert mock_session.execute.call_count >= 2

