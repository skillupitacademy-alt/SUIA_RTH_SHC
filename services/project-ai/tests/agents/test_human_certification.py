"""Tests for Human Certification Agent (Agent 15)."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, UTC

from app.agents.human_certification import (
    execute_human_certification,
    CERTIFICATION_STATUS_PENDING,
    CERTIFICATION_STATUS_CERTIFIED,
    CERTIFICATION_STATUS_REJECTED,
    CERTIFICATION_STATUS_TIMEOUT
)
from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentResult, AgentStatus


@pytest.fixture
def mock_context_with_final_gate():
    """Create mock agent context with final gate result."""
    return AgentContext(
        task_id="test-task",
        workflow_state={'run_id': 'test-run', 'candidate_id': 'candidate-01'},
        repository_snapshot={'canonicalHash': 'snap-hash-123'},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            'final-gate': AgentResult(
                agent_id='final-gate',
                status=AgentStatus.SUCCESS,
                outputs={
                    'verdict': 'CERTIFICATION_READY',
                    'commit_sha': 'commit-abc123',
                    'snapshot_hash': 'snap-hash-123',
                    'gate_count': 11,
                    'evidence_count': 25
                },
                evidence_ids=['ev-001', 'ev-002', 'ev-003']
            )
        },
        repository_root=Path('.')
    )


@pytest.mark.asyncio
async def test_certification_pending(mock_context_with_final_gate):
    """Test certification request creation with pending status."""
    mock_query = AsyncMock(return_value={
        'decision': CERTIFICATION_STATUS_PENDING,
        'reviewer': None,
        'reviewed_at': None,
        'comments': None
    })
    
    with patch('app.agents.human_certification._create_certification_request', return_value='cert-123'), \
         patch('app.agents.human_certification._poll_for_certification', return_value={
             'decision': CERTIFICATION_STATUS_TIMEOUT,
             'error': 'Timeout'
         }):
        
        result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.BLOCKED  # Timeout means blocked
    assert result.outputs['human_decision'] == CERTIFICATION_STATUS_TIMEOUT


@pytest.mark.asyncio
async def test_certification_certified(mock_context_with_final_gate):
    """Test successful certification approval."""
    with patch('app.agents.human_certification._create_certification_request', return_value='cert-123'), \
         patch('app.agents.human_certification._poll_for_certification', return_value={
             'decision': CERTIFICATION_STATUS_CERTIFIED,
             'reviewer': 'reviewer@example.com',
             'reviewed_at': datetime.now(UTC).isoformat(),
             'comments': 'Approved'
         }):
        
        result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['human_decision'] == CERTIFICATION_STATUS_CERTIFIED
    assert result.outputs['reviewer'] == 'reviewer@example.com'
    assert result.outputs['comments'] == 'Approved'


@pytest.mark.asyncio
async def test_certification_rejected(mock_context_with_final_gate):
    """Test certification rejection."""
    with patch('app.agents.human_certification._create_certification_request', return_value='cert-123'), \
         patch('app.agents.human_certification._poll_for_certification', return_value={
             'decision': CERTIFICATION_STATUS_REJECTED,
             'error': 'Certification rejected',
             'reviewer': 'reviewer@example.com',
             'reviewed_at': datetime.now(UTC).isoformat(),
             'comments': 'Does not meet standards'
         }):
        
        result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.BLOCKED
    assert result.outputs['human_decision'] == CERTIFICATION_STATUS_REJECTED
    assert result.outputs['comments'] == 'Does not meet standards'
    assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_certification_timeout(mock_context_with_final_gate):
    """Test certification timeout."""
    with patch('app.agents.human_certification._create_certification_request', return_value='cert-123'), \
         patch('app.agents.human_certification._poll_for_certification', return_value={
             'decision': CERTIFICATION_STATUS_TIMEOUT,
             'error': 'Timeout after 86400 seconds'
         }), \
         patch('app.agents.human_certification._get_certification_timeout', return_value=60):
        
        result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.BLOCKED
    assert result.outputs['human_decision'] == CERTIFICATION_STATUS_TIMEOUT
    assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_reviewer_workflow(mock_context_with_final_gate):
    """Test complete reviewer workflow with tracking."""
    reviewer_email = 'senior.reviewer@example.com'
    review_time = datetime.now(UTC).isoformat()
    
    with patch('app.agents.human_certification._create_certification_request', return_value='cert-456'), \
         patch('app.agents.human_certification._poll_for_certification', return_value={
             'decision': CERTIFICATION_STATUS_CERTIFIED,
             'reviewer': reviewer_email,
             'reviewed_at': review_time,
             'comments': 'All gates passed, approved for deployment'
         }):
        
        result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['reviewer'] == reviewer_email
    assert result.outputs['reviewed_at'] == review_time
    assert result.outputs['certification_id'] == 'cert-456'


@pytest.mark.asyncio
async def test_final_gate_not_ready(mock_context_with_final_gate):
    """Test when final gate verdict is not CERTIFICATION_READY."""
    # Change verdict to FAIL
    mock_context_with_final_gate.prior_agent_outputs['final-gate'].outputs['verdict'] = 'FAIL'
    
    result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.BLOCKED
    assert result.outputs['human_decision'] == 'NOT_READY'
    assert 'FAIL' in result.outputs['reason']


@pytest.mark.asyncio
async def test_missing_final_gate():
    """Test when final gate agent result is missing."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={'run_id': 'test-run'},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},  # No final-gate result
        repository_root=Path('.')
    )
    
    result = await execute_human_certification(context)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.BLOCKED
    assert len(result.errors) > 0
    assert 'did not pass' in result.errors[0].lower()


@pytest.mark.asyncio
async def test_exception_handling(mock_context_with_final_gate):
    """Test exception handling during certification."""
    with patch('app.agents.human_certification._create_certification_request', side_effect=Exception('Database error')):
        result = await execute_human_certification(mock_context_with_final_gate)
    
    assert result.agent_id == "human_certification"
    assert result.status == AgentStatus.FAILED
    assert len(result.errors) > 0
    assert 'failed' in result.errors[0].lower()
