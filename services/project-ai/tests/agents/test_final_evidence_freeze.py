"""Tests for Final Evidence Freeze Agent (Agent 13)."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, UTC

from app.agents.final_evidence_freeze import execute_final_evidence_freeze
from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentResult, AgentStatus


@pytest.fixture
def mock_context():
    """Create mock agent context."""
    return AgentContext(
        task_id="test-task",
        workflow_state={'run_id': 'test-run'},
        repository_snapshot={
            'canonicalHash': 'snap-hash-123',
            'repository': {'commitSha': 'commit-abc123'},
            'evidence': [
                {'evidenceId': 'ev-001', 'kind': 'type-definition'},
                {'evidenceId': 'ev-002', 'kind': 'component'},
                {'evidenceId': 'ev-003', 'kind': 'ubrc-verification'}
            ]
        },
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            'agent_01': AgentResult(
                agent_id='agent_01',
                status=AgentStatus.SUCCESS,
                evidence_ids=['ev-001', 'ev-002']
            ),
            'agent_02': AgentResult(
                agent_id='agent_02',
                status=AgentStatus.SUCCESS,
                evidence_ids=['ev-003']
            )
        },
        repository_root=Path('.')
    )


@pytest.mark.asyncio
async def test_evidence_aggregation_success(mock_context):
    """Test successful evidence aggregation from all prior agents."""
    with patch('app.agents.final_evidence_freeze._derive_commit_sha', return_value='commit-abc123'):
        result = await execute_final_evidence_freeze(mock_context)
    
    assert result.agent_id == "final_evidence_freeze"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['total_evidence_count'] == 3  # 2 from prior agents + 1 (ev-003 unique)
    assert result.outputs['unique_evidence_count'] == 3  # Unique IDs
    assert result.outputs['binding_valid'] is True
    assert len(result.outputs['all_evidence_ids']) == 3


@pytest.mark.asyncio
async def test_binding_validation(mock_context):
    """Test evidence binding validation with mismatched commit SHA."""
    with patch('app.agents.final_evidence_freeze._derive_commit_sha', return_value='different-commit'):
        result = await execute_final_evidence_freeze(mock_context)
    
    assert result.agent_id == "final_evidence_freeze"
    assert result.status == AgentStatus.FAILED
    assert result.outputs['binding_valid'] is False
    assert len(result.errors) > 0
    assert 'mismatch' in result.errors[0].lower()


@pytest.mark.asyncio
async def test_duplicate_detection(mock_context):
    """Test detection of duplicate evidence IDs."""
    # Add duplicate evidence ID to prior agents
    mock_context.prior_agent_outputs['agent_03'] = AgentResult(
        agent_id='agent_03',
        status=AgentStatus.SUCCESS,
        evidence_ids=['ev-001', 'ev-001', 'ev-004']  # Duplicate ev-001
    )
    
    with patch('app.agents.final_evidence_freeze._derive_commit_sha', return_value='commit-abc123'):
        result = await execute_final_evidence_freeze(mock_context)
    
    assert result.agent_id == "final_evidence_freeze"
    assert result.status == AgentStatus.FAILED
    assert result.outputs['duplicate_count'] > 0
    assert 'Duplicate evidence IDs' in result.errors[0]


@pytest.mark.asyncio
async def test_orphaned_evidence_detection(mock_context):
    """Test detection of orphaned evidence IDs."""
    # Add evidence ID not in snapshot
    mock_context.prior_agent_outputs['agent_03'] = AgentResult(
        agent_id='agent_03',
        status=AgentStatus.SUCCESS,
        evidence_ids=['ev-999']  # Not in snapshot
    )
    
    with patch('app.agents.final_evidence_freeze._derive_commit_sha', return_value='commit-abc123'):
        result = await execute_final_evidence_freeze(mock_context)
    
    assert result.agent_id == "final_evidence_freeze"
    assert result.status == AgentStatus.FAILED
    assert result.outputs['orphaned_count'] > 0
    assert 'Orphaned evidence IDs' in result.errors[0]


@pytest.mark.asyncio
async def test_empty_evidence_set(mock_context):
    """Test handling of empty evidence set."""
    mock_context.prior_agent_outputs = {}
    mock_context.repository_snapshot['evidence'] = []
    
    with patch('app.agents.final_evidence_freeze._derive_commit_sha', return_value='commit-abc123'):
        result = await execute_final_evidence_freeze(mock_context)
    
    assert result.agent_id == "final_evidence_freeze"
    # Empty is valid (no duplicates, no orphans)
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['total_evidence_count'] == 0
    assert result.outputs['unique_evidence_count'] == 0


@pytest.mark.asyncio
async def test_exception_handling(mock_context):
    """Test exception handling during evidence freeze."""
    # Corrupt snapshot to trigger exception
    mock_context.repository_snapshot = None
    
    result = await execute_final_evidence_freeze(mock_context)
    
    assert result.agent_id == "final_evidence_freeze"
    assert result.status == AgentStatus.FAILED
    assert len(result.errors) > 0
    assert 'failed' in result.errors[0].lower()
