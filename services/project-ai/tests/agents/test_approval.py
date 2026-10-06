"""Tests for approval agent with database polling."""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import patch, AsyncMock

from app.agents.approval import (
    execute_approval,
    _get_approval_timeout,
    APPROVAL_STATUS_PENDING,
    APPROVAL_STATUS_APPROVED,
    APPROVAL_STATUS_REJECTED,
    APPROVAL_STATUS_TIMEOUT
)
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


def create_manifest_result(manifest_id: str = "manifest-001", manifest_hash: str = "abc123"):
    """Create mock placement manifest result."""
    return AgentResult(
        agent_id="placement_manifest",
        status=AgentStatus.SUCCESS,
        outputs={
            "manifest": {
                "manifestId": manifest_id,
                "manifestHash": manifest_hash,
                "candidateId": "candidate-001",
                "decision": "ADD",
                "targetPath": "packages/blocks/quiz",
                "blockFamily": "ASSESSMENT",
                "blockVersion": "1.0.0",
                "requiredChanges": ["Add new block"],
                "evidenceIds": ["evidence-001"],
                "createdAt": "2025-01-30T12:00:00Z"
            },
            "evidence_ids": ["evidence-001"]
        },
        evidence_ids=["evidence-001"],
        errors=[],
        warnings=[]
    )


@pytest.mark.asyncio
async def test_approval_pending():
    """Test approval request creation with pending status."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock database polling to return pending then timeout quickly
    with patch("app.agents.approval._poll_for_approval", new_callable=AsyncMock) as mock_poll:
        mock_poll.return_value = {
            "status": APPROVAL_STATUS_TIMEOUT,
            "error": "Timeout for test"
        }
        
        result = await execute_approval(context)
        
        assert result.agent_id == "approval"
        assert result.status == AgentStatus.BLOCKED
        assert result.outputs["approval_status"] == APPROVAL_STATUS_TIMEOUT


@pytest.mark.asyncio
async def test_approval_approved():
    """Test successful approval flow."""
    manifest_hash = "test_hash_123"
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_manifest": create_manifest_result("manifest-001", manifest_hash)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock approved response
    with patch("app.agents.approval._poll_for_approval", new_callable=AsyncMock) as mock_poll:
        mock_poll.return_value = {
            "status": APPROVAL_STATUS_APPROVED,
            "approved_hash": manifest_hash,
            "reviewer": "test_reviewer",
            "reviewed_at": "2025-01-30T13:00:00Z"
        }
        
        result = await execute_approval(context)
        
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs["approval_status"] == APPROVAL_STATUS_APPROVED
        assert result.outputs["approved_manifest_hash"] == manifest_hash
        assert result.outputs["reviewer"] == "test_reviewer"


@pytest.mark.asyncio
async def test_approval_rejected():
    """Test rejection flow."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock rejected response
    with patch("app.agents.approval._poll_for_approval", new_callable=AsyncMock) as mock_poll:
        mock_poll.return_value = {
            "status": APPROVAL_STATUS_REJECTED,
            "error": "Rejected by reviewer",
            "reviewer": "test_reviewer",
            "reviewed_at": "2025-01-30T13:00:00Z"
        }
        
        result = await execute_approval(context)
        
        assert result.status == AgentStatus.BLOCKED
        assert result.outputs["approval_status"] == APPROVAL_STATUS_REJECTED
        assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_approval_timeout():
    """Test timeout flow."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock timeout response
    with patch("app.agents.approval._poll_for_approval", new_callable=AsyncMock) as mock_poll:
        mock_poll.return_value = {
            "status": APPROVAL_STATUS_TIMEOUT,
            "error": "Approval timed out"
        }
        
        result = await execute_approval(context)
        
        assert result.status == AgentStatus.BLOCKED
        assert result.outputs["approval_status"] == APPROVAL_STATUS_TIMEOUT


@pytest.mark.asyncio
async def test_manifest_hash_mismatch():
    """Test manifest hash mismatch detection."""
    original_hash = "original_hash_123"
    tampered_hash = "tampered_hash_456"
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_manifest": create_manifest_result("manifest-001", original_hash)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock approved but with different hash
    with patch("app.agents.approval._poll_for_approval", new_callable=AsyncMock) as mock_poll:
        mock_poll.return_value = {
            "status": "MANIFEST_HASH_MISMATCH",
            "error": "Hash mismatch",
            "approved_hash": tampered_hash,
            "reviewer": "test_reviewer"
        }
        
        result = await execute_approval(context)
        
        assert result.status == AgentStatus.BLOCKED
        assert "MISMATCH" in result.outputs["approval_status"]


def test_get_approval_timeout_default():
    """Test approval timeout default value."""
    import os
    # Clear env var if it exists
    os.environ.pop('PROJECT_AI_APPROVAL_TIMEOUT_SEC', None)
    
    timeout = _get_approval_timeout()
    assert timeout == 86400  # Default 24 hours


def test_get_approval_timeout_custom():
    """Test approval timeout from environment variable."""
    import os
    os.environ['PROJECT_AI_APPROVAL_TIMEOUT_SEC'] = '3600'
    
    timeout = _get_approval_timeout()
    assert timeout == 3600  # 1 hour
    
    # Cleanup
    os.environ.pop('PROJECT_AI_APPROVAL_TIMEOUT_SEC', None)


def test_get_approval_timeout_bounds():
    """Test approval timeout enforces min/max bounds."""
    import os
    
    # Test minimum bound
    os.environ['PROJECT_AI_APPROVAL_TIMEOUT_SEC'] = '30'
    timeout = _get_approval_timeout()
    assert timeout == 60  # Enforced minimum
    
    # Test maximum bound
    os.environ['PROJECT_AI_APPROVAL_TIMEOUT_SEC'] = '999999999'
    timeout = _get_approval_timeout()
    assert timeout == 604800  # Enforced maximum (7 days)
    
    # Cleanup
    os.environ.pop('PROJECT_AI_APPROVAL_TIMEOUT_SEC', None)
