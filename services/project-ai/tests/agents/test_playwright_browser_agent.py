"""Tests for Playwright Browser Agent (Agent 12L)."""

import pytest
import json
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import Mock, patch, MagicMock, mock_open
import subprocess

from app.agents.playwright_browser_agent import execute_playwright_browser_agent
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


@pytest.fixture
def mock_context():
    """Create mock agent context for testing."""
    return AgentContext(
        task_id="test-task-001",
        workflow_state={
            'candidate_blocks': ['introduction', 'code'],
            'base_url': 'http://localhost:3000',
            'run_id': 'run-test-001',
            'commit_sha': 'abc123def456',
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
async def test_playwright_execution_success(mock_context):
    """Playwright agent should succeed when tests pass."""
    # Mock subprocess.run
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    mock_process_result.stdout = 'Tests passed'
    mock_process_result.stderr = ''
    
    # Mock Playwright results file
    playwright_results = {
        'passed': 2,
        'failed': 0,
        'skipped': 0,
        'tests': [
            {
                'name': 'introduction block renders',
                'status': 'passed',
                'screenshots': ['/test/screenshots/intro-001.png']
            },
            {
                'name': 'code block renders',
                'status': 'passed',
                'screenshots': ['/test/screenshots/code-001.png']
            }
        ]
    }
    
    with patch('subprocess.run', return_value=mock_process_result) as mock_run, \
         patch('pathlib.Path.exists', return_value=True), \
         patch('pathlib.Path.open', mock_open(read_data=json.dumps(playwright_results))):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.agent_id == 'playwright_browser_agent'
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs['browser_status'] == 'PASS'
        assert result.outputs['tests_passed'] == 2
        assert result.outputs['tests_failed'] == 0
        assert len(result.outputs['screenshot_paths']) == 2


@pytest.mark.asyncio
async def test_environment_variables_set(mock_context):
    """Playwright agent should set correct environment variables."""
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    mock_process_result.stdout = 'Tests passed'
    mock_process_result.stderr = ''
    
    playwright_results = {
        'passed': 1,
        'failed': 0,
        'skipped': 0,
        'tests': []
    }
    
    with patch('subprocess.run', return_value=mock_process_result) as mock_run, \
         patch('pathlib.Path.exists', return_value=True), \
         patch('pathlib.Path.open', mock_open(read_data=json.dumps(playwright_results))):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        # Verify subprocess.run was called with correct env vars
        call_kwargs = mock_run.call_args[1]
        env = call_kwargs['env']
        
        assert 'PROJECT_AI_BASE_URL' in env
        assert env['PROJECT_AI_BASE_URL'] == 'http://localhost:3000'
        assert 'PROJECT_AI_RUN_ID' in env
        assert env['PROJECT_AI_RUN_ID'] == 'run-test-001'
        assert 'PROJECT_AI_COMMIT_SHA' in env
        assert env['PROJECT_AI_COMMIT_SHA'] == 'abc123def456'
        assert 'PROJECT_AI_SNAPSHOT_HASH' in env
        assert env['PROJECT_AI_SNAPSHOT_HASH'] == 'snapshot-hash-123'
        assert 'PROJECT_AI_CANDIDATE_BLOCKS' in env
        assert 'introduction' in env['PROJECT_AI_CANDIDATE_BLOCKS']


@pytest.mark.asyncio
async def test_json_results_parsing(mock_context):
    """Playwright agent should parse JSON results correctly."""
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    mock_process_result.stdout = ''
    mock_process_result.stderr = ''
    
    playwright_results = {
        'passed': 1,
        'failed': 1,
        'skipped': 1,
        'tests': [
            {
                'name': 'test passed',
                'status': 'passed',
                'screenshots': ['/screenshots/pass.png']
            },
            {
                'name': 'test failed',
                'status': 'failed',
                'error': 'Element not found',
                'screenshots': ['/screenshots/fail.png']
            },
            {
                'name': 'test skipped',
                'status': 'skipped',
                'screenshots': []
            }
        ]
    }
    
    with patch('subprocess.run', return_value=mock_process_result), \
         patch('pathlib.Path.exists', return_value=True), \
         patch('pathlib.Path.open', mock_open(read_data=json.dumps(playwright_results))):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.outputs['tests_passed'] == 1
        assert result.outputs['tests_failed'] == 1
        assert result.outputs['tests_skipped'] == 1
        assert len(result.outputs['test_details']) == 3
        assert result.outputs['browser_status'] == 'FAIL'  # Has failures


@pytest.mark.asyncio
async def test_screenshot_collection(mock_context):
    """Playwright agent should collect all screenshot paths."""
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    
    playwright_results = {
        'passed': 2,
        'failed': 0,
        'skipped': 0,
        'tests': [
            {
                'name': 'test 1',
                'status': 'passed',
                'screenshots': [
                    '/screenshots/test1-step1.png',
                    '/screenshots/test1-step2.png'
                ]
            },
            {
                'name': 'test 2',
                'status': 'passed',
                'screenshots': ['/screenshots/test2.png']
            }
        ]
    }
    
    with patch('subprocess.run', return_value=mock_process_result), \
         patch('pathlib.Path.exists', return_value=True), \
         patch('pathlib.Path.open', mock_open(read_data=json.dumps(playwright_results))):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert len(result.outputs['screenshot_paths']) == 3
        assert '/screenshots/test1-step1.png' in result.outputs['screenshot_paths']
        assert '/screenshots/test1-step2.png' in result.outputs['screenshot_paths']
        assert '/screenshots/test2.png' in result.outputs['screenshot_paths']


@pytest.mark.asyncio
async def test_playwright_timeout(mock_context):
    """Playwright agent should handle timeout gracefully."""
    with patch('subprocess.run', side_effect=subprocess.TimeoutExpired('pnpm', 600)):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.agent_id == 'playwright_browser_agent'
        assert result.status == AgentStatus.FAILED
        assert result.outputs['browser_status'] == 'TIMEOUT'
        assert 'timeout' in result.errors[0].lower()


@pytest.mark.asyncio
async def test_no_python_playwright(mock_context):
    """Playwright agent should use Node Playwright via subprocess only."""
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    
    playwright_results = {
        'passed': 1,
        'failed': 0,
        'skipped': 0,
        'tests': []
    }
    
    with patch('subprocess.run', return_value=mock_process_result) as mock_run, \
         patch('pathlib.Path.exists', return_value=True), \
         patch('pathlib.Path.open', mock_open(read_data=json.dumps(playwright_results))):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        # Verify subprocess.run was called with pnpm exec playwright
        call_args = mock_run.call_args[0][0]
        assert call_args[0] == 'pnpm'
        assert call_args[1] == 'exec'
        assert call_args[2] == 'playwright'
        assert call_args[3] == 'test'
        
        # Verify shell=False (no Python Playwright)
        call_kwargs = mock_run.call_args[1]
        assert call_kwargs['shell'] is False


@pytest.mark.asyncio
async def test_playwright_not_installed(mock_context):
    """Playwright agent should be blocked when Playwright not installed."""
    with patch('subprocess.run', side_effect=FileNotFoundError('pnpm not found')):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.agent_id == 'playwright_browser_agent'
        assert result.status == AgentStatus.BLOCKED
        assert result.outputs['browser_status'] == 'BLOCKED'
        assert 'not found' in result.errors[0].lower()


@pytest.mark.asyncio
async def test_results_file_missing(mock_context):
    """Playwright agent should fail when results file not generated."""
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    mock_process_result.stdout = 'Tests ran'
    mock_process_result.stderr = ''
    
    with patch('subprocess.run', return_value=mock_process_result), \
         patch('pathlib.Path.exists', return_value=False):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert result.outputs['browser_status'] == 'NO_RESULTS'


@pytest.mark.asyncio
async def test_json_parse_error(mock_context):
    """Playwright agent should handle JSON parse errors."""
    mock_process_result = Mock()
    mock_process_result.returncode = 0
    
    invalid_json = 'not valid json {'
    
    with patch('subprocess.run', return_value=mock_process_result), \
         patch('pathlib.Path.exists', return_value=True), \
         patch('pathlib.Path.open', mock_open(read_data=invalid_json)):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert result.outputs['browser_status'] == 'PARSE_ERROR'
        assert 'JSON parse error' in result.errors[0]


@pytest.mark.asyncio
async def test_no_candidate_blocks(mock_context):
    """Playwright agent should be blocked when no candidate blocks."""
    mock_context.workflow_state['candidate_blocks'] = []
    
    result = await execute_playwright_browser_agent(mock_context)
    
    assert result.status == AgentStatus.BLOCKED
    assert result.outputs['browser_status'] == 'BLOCKED'
    assert 'No candidate blocks' in result.errors[0]


@pytest.mark.asyncio
async def test_exception_handling(mock_context):
    """Playwright agent should handle exceptions gracefully."""
    with patch('subprocess.run', side_effect=Exception('Unexpected error')):
        
        result = await execute_playwright_browser_agent(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert result.outputs['browser_status'] == 'ERROR'
        assert len(result.errors) > 0
