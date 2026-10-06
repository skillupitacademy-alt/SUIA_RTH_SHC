"""Tests for governance agent handler."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.governance import execute_governance
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


def create_test_snapshot():
    """Create test snapshot."""
    return {
        "schemaVersion": "1.1.0",
        "repository": {
            "owner": "test",
            "name": "test-repo",
            "commitSha": "abc123",
            "scanTimestamp": "2025-01-30T12:00:00Z"
        },
        "evidence": []
    }


@pytest.mark.asyncio
async def test_execute_governance_prevents_self_approval():
    """Test governance agent prevents self-approval."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "submitter": "alice@example.com",
            "approver": "alice@example.com"  # Same person!
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_governance(context)
    
    assert result.agent_id == "governance"
    assert result.status == AgentStatus.FAILED
    assert len(result.errors) > 0
    assert any("self-approval" in err.lower() for err in result.errors)
    assert result.outputs['self_approval_prevented'] is False


@pytest.mark.asyncio
async def test_execute_governance_allows_different_approver():
    """Test governance agent allows different approver."""
    snapshot = create_test_snapshot()
    
    placement_result = AgentResult(
        agent_id="placement",
        status=AgentStatus.SUCCESS,
        outputs={"manifest_hash": "a" * 64},  # Valid hash
        evidence_ids=[],
        errors=[],
        warnings=[],
        execution_time_ms=100,
        timestamp=datetime.now(UTC)
    )
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "submitter": "alice@example.com",
            "approver": "bob@example.com"  # Different person
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={"placement": placement_result},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_governance(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert len(result.errors) == 0
    assert result.outputs['self_approval_prevented'] is True
    assert result.outputs['governance_compliant'] is True


@pytest.mark.asyncio
async def test_execute_governance_verifies_manifest_hash():
    """Test governance agent verifies manifest hash."""
    snapshot = create_test_snapshot()
    
    placement_result = AgentResult(
        agent_id="placement",
        status=AgentStatus.SUCCESS,
        outputs={"manifest_hash": "a" * 64},
        evidence_ids=[],
        errors=[],
        warnings=[],
        execution_time_ms=100,
        timestamp=datetime.now(UTC)
    )
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "submitter": "alice@example.com",
            "approver": "bob@example.com"
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={"placement": placement_result},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_governance(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['manifest_hash_verified'] is True


@pytest.mark.asyncio
async def test_execute_governance_warns_missing_approver():
    """Test governance agent fails when manifest hash missing (Finding #4)."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "submitter": "alice@example.com"
            # No approver
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},  # No placement result with manifest_hash
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_governance(context)
    
    # Finding #4: Governance must enforce manifest presence
    assert result.status == AgentStatus.FAILED
    assert len(result.errors) > 0
    assert any("manifest hash" in err.lower() for err in result.errors)
