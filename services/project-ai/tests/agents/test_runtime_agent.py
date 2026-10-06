"""Tests for Runtime Agent (Agent 12K)."""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import Mock, patch, MagicMock

from app.agents.runtime_agent import execute_runtime_agent
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.verification.runtime import RuntimeVerification, RuntimeErrorCode


@pytest.fixture
def mock_context():
    """Create mock agent context for testing."""
    return AgentContext(
        task_id="test-task-001",
        workflow_state={
            'candidate_blocks': ['introduction', 'code'],
            'target': 'realtutorialhub-admin',
            'route': '/'
        },
        repository_snapshot={
            'schemaVersion': '1.1.0',
            'snapshotHash': 'snapshot-hash-123',
            'blocks': {
                'verified': [
                    {
                        'blockType': 'introduction',
                        'evidenceId': 'evidence-intro-001'
                    },
                    {
                        'blockType': 'code',
                        'evidenceId': 'evidence-code-001'
                    }
                ]
            }
        },
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path('/test/repo'),
        timestamp=datetime.now(UTC)
    )


@pytest.mark.asyncio
async def test_runtime_verification_success(mock_context):
    """Runtime agent should succeed when all blocks pass verification."""
    # Mock verify_runtime to return passing results
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        mock_verify.return_value = RuntimeVerification(
            verificationId='runtime-test-001',
            target='realtutorialhub-admin',
            route='/',
            blockType='introduction',
            expected={'blockType': 'introduction'},
            observed={'blockType': 'introduction', 'status': 'pass'},
            passed=True,
            evidenceIds=['evidence-intro-001'],
            consoleErrors=[],
            networkErrors=[],
            error_code=None,
            error_message=None
        )
        
        result = await execute_runtime_agent(mock_context)
        
        assert result.agent_id == 'runtime_agent'
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs['runtime_status'] == 'PASS'
        assert result.outputs['blocks_verified'] == 2
        assert result.outputs['blocks_passed'] == 2
        assert len(result.evidence_ids) > 0


@pytest.mark.asyncio
async def test_runtime_failure(mock_context):
    """Runtime agent should fail when blocks fail verification."""
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        mock_verify.return_value = RuntimeVerification(
            verificationId='runtime-test-002',
            target='realtutorialhub-admin',
            route='/',
            blockType='introduction',
            expected={'blockType': 'introduction'},
            observed={},
            passed=False,
            evidenceIds=['evidence-intro-001'],
            consoleErrors=['Console error: undefined variable'],
            networkErrors=[],
            error_code=RuntimeErrorCode.RUNTIME_BLOCK_NOT_FOUND,
            error_message='Block not found in DOM'
        )
        
        result = await execute_runtime_agent(mock_context)
        
        assert result.agent_id == 'runtime_agent'
        assert result.status == AgentStatus.FAILED
        assert result.outputs['runtime_status'] == 'FAIL'
        assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_environment_setup(mock_context):
    """Runtime agent should pass correct parameters to verify_runtime."""
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        mock_verify.return_value = RuntimeVerification(
            verificationId='runtime-test-003',
            target='realtutorialhub-admin',
            route='/',
            blockType='introduction',
            expected={'blockType': 'introduction'},
            observed={'status': 'pass'},
            passed=True,
            evidenceIds=['evidence-intro-001'],
            consoleErrors=[],
            networkErrors=[],
            error_code=None,
            error_message=None
        )
        
        result = await execute_runtime_agent(mock_context)
        
        # Verify verify_runtime was called with correct parameters
        assert mock_verify.call_count == 2  # Called for each block
        call_args = mock_verify.call_args_list[0]
        assert call_args[1]['target'] == 'realtutorialhub-admin'
        assert call_args[1]['route'] == '/'
        assert call_args[1]['repository_root'] == Path('/test/repo')


@pytest.mark.asyncio
async def test_evidence_collection(mock_context):
    """Runtime agent should collect evidence from all verifications."""
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        # Return different evidence for each block
        def mock_verify_side_effect(*args, **kwargs):
            block_type = kwargs['block_type']
            return RuntimeVerification(
                verificationId=f'runtime-{block_type}',
                target='realtutorialhub-admin',
                route='/',
                blockType=block_type,
                expected={'blockType': block_type},
                observed={'status': 'pass'},
                passed=True,
                evidenceIds=[f'evidence-{block_type}-001'],
                consoleErrors=[],
                networkErrors=[],
                error_code=None,
                error_message=None
            )
        
        mock_verify.side_effect = mock_verify_side_effect
        
        result = await execute_runtime_agent(mock_context)
        
        assert len(result.evidence_ids) == 2
        assert 'evidence-introduction-001' in result.evidence_ids
        assert 'evidence-code-001' in result.evidence_ids


@pytest.mark.asyncio
async def test_no_candidate_blocks(mock_context):
    """Runtime agent should be blocked when no candidate blocks."""
    mock_context.workflow_state['candidate_blocks'] = []
    
    result = await execute_runtime_agent(mock_context)
    
    assert result.agent_id == 'runtime_agent'
    assert result.status == AgentStatus.BLOCKED
    assert result.outputs['runtime_status'] == 'BLOCKED'
    assert 'No candidate blocks' in result.errors[0]


@pytest.mark.asyncio
async def test_exception_handling(mock_context):
    """Runtime agent should handle exceptions gracefully."""
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        mock_verify.side_effect = Exception('Test exception')
        
        result = await execute_runtime_agent(mock_context)
        
        assert result.agent_id == 'runtime_agent'
        assert result.status == AgentStatus.FAILED
        assert result.outputs['runtime_status'] == 'ERROR'
        assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_console_errors_warnings(mock_context):
    """Runtime agent should collect console errors as warnings."""
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        mock_verify.return_value = RuntimeVerification(
            verificationId='runtime-test-004',
            target='realtutorialhub-admin',
            route='/',
            blockType='introduction',
            expected={'blockType': 'introduction'},
            observed={'status': 'pass'},
            passed=True,
            evidenceIds=['evidence-intro-001'],
            consoleErrors=['Warning: deprecated API used'],
            networkErrors=['Network timeout on /api/data'],
            error_code=None,
            error_message=None
        )
        
        result = await execute_runtime_agent(mock_context)
        
        assert len(result.warnings) > 0
        assert any('deprecated API' in w for w in result.warnings)
        assert any('Network timeout' in w for w in result.warnings)


@pytest.mark.asyncio
async def test_prior_agent_outputs(mock_context):
    """Runtime agent should get candidate blocks from prior agent outputs."""
    # Remove candidate_blocks from workflow_state
    mock_context.workflow_state.pop('candidate_blocks')
    
    # Add placement result to prior_agent_outputs
    mock_placement_result = AgentResult(
        agent_id='placement',
        status=AgentStatus.SUCCESS,
        outputs={
            'placed_blocks': ['introduction', 'code']
        },
        evidence_ids=[],
        errors=[],
        warnings=[],
        execution_time_ms=100.0,
        timestamp=datetime.now(UTC)
    )
    mock_context.prior_agent_outputs['placement'] = mock_placement_result
    
    with patch('app.agents.runtime_agent.verify_runtime') as mock_verify:
        mock_verify.return_value = RuntimeVerification(
            verificationId='runtime-test-005',
            target='realtutorialhub-admin',
            route='/',
            blockType='introduction',
            expected={'blockType': 'introduction'},
            observed={'status': 'pass'},
            passed=True,
            evidenceIds=['evidence-intro-001'],
            consoleErrors=[],
            networkErrors=[],
            error_code=None,
            error_message=None
        )
        
        result = await execute_runtime_agent(mock_context)
        
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs['blocks_verified'] == 2
