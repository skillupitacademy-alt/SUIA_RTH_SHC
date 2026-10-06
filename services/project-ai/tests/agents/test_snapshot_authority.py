"""Tests for Snapshot Authority Agent (Agent 02)."""

import json
import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, UTC

from app.agents.snapshot_authority import execute_snapshot_authority
from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentResult, AgentStatus


@pytest.fixture
def mock_context():
    """Create mock agent context with successful repository auditor."""
    prior_auditor = AgentResult(
        agent_id="repository_auditor",
        status=AgentStatus.SUCCESS,
        outputs={
            "commit_sha": "abc123def456",
            "branch_name": "m2-project-ai-foundation",
            "is_clean": True,
            "remote_reachable": True,
            "health_status": "HEALTHY"
        },
        evidence_ids=[],
        errors=[],
        warnings=[]
    )
    
    return AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={"repository_auditor": prior_auditor},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )


@pytest.mark.asyncio
async def test_snapshot_generation_success(mock_context, tmp_path):
    """Test successful snapshot generation."""
    # Create mock snapshot file
    snapshot_data = {
        "canonicalHash": "def789abc123",
        "evidence": [
            {
                "evidenceId": "evidence-001",
                "scannerName": "D1-Directory",
                "timestamp": "2024-01-01T00:00:00Z",
                "path": "packages/blocks",
                "kind": "directory",
                "claim": "Block directory exists",
                "locator": "packages/blocks",
                "contentHash": "a" * 64,
                "lifecycle": "current"
            }
        ],
        "blocks": {}
    }
    
    # Set up paths
    mock_context.repository_root = tmp_path
    snapshot_dir = tmp_path / '.agents' / 'output'
    snapshot_dir.mkdir(parents=True)
    snapshot_path = snapshot_dir / 'snapshot.json'
    snapshot_path.write_text(json.dumps(snapshot_data, indent=2))
    
    # Mock subprocess call
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {
            'status': 'success',
            'output': 'Snapshot generated successfully',
            'error': None
        }
        
        # Mock evidence logger
        with patch('app.agents.snapshot_authority.EvidenceLogger') as mock_logger_class:
            mock_logger = Mock()
            mock_run_dir = tmp_path / '.project-ai' / 'runs' / 'abc123de-def789ab'
            mock_logger.create_run_directory.return_value = mock_run_dir
            mock_logger_class.return_value = mock_logger
            
            result = await execute_snapshot_authority(mock_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["snapshot_hash"] == "def789abc123"
            assert result.outputs["evidence_count"] == 1
            assert result.outputs["commit_sha"] == "abc123def456"
            assert len(result.errors) == 0
            
            # Verify logger was called
            mock_logger.create_run_directory.assert_called_once_with(
                commit_sha="abc123def456",
                snapshot_hash="def789abc123",
                snapshot_path=snapshot_path
            )


@pytest.mark.asyncio
async def test_snapshot_hash_extraction(mock_context, tmp_path):
    """Test extraction of canonicalHash from snapshot."""
    snapshot_data = {
        "canonicalHash": "xyz123abc789",
        "evidence": [],
        "blocks": {}
    }
    
    mock_context.repository_root = tmp_path
    snapshot_dir = tmp_path / '.agents' / 'output'
    snapshot_dir.mkdir(parents=True)
    snapshot_path = snapshot_dir / 'snapshot.json'
    snapshot_path.write_text(json.dumps(snapshot_data))
    
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {'status': 'success', 'output': 'OK', 'error': None}
        
        with patch('app.agents.snapshot_authority.EvidenceLogger') as mock_logger_class:
            mock_logger = Mock()
            mock_logger.create_run_directory.return_value = tmp_path / 'runs' / 'test'
            mock_logger_class.return_value = mock_logger
            
            result = await execute_snapshot_authority(mock_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["snapshot_hash"] == "xyz123abc789"


@pytest.mark.asyncio
async def test_snapshot_copy_to_run_dir(mock_context, tmp_path):
    """Test snapshot is copied to run directory."""
    snapshot_data = {
        "canonicalHash": "test123hash",
        "evidence": []
    }
    
    mock_context.repository_root = tmp_path
    snapshot_dir = tmp_path / '.agents' / 'output'
    snapshot_dir.mkdir(parents=True)
    snapshot_path = snapshot_dir / 'snapshot.json'
    snapshot_path.write_text(json.dumps(snapshot_data))
    
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {'status': 'success', 'output': 'OK', 'error': None}
        
        with patch('app.agents.snapshot_authority.EvidenceLogger') as mock_logger_class:
            mock_logger = Mock()
            run_dir = tmp_path / '.project-ai' / 'runs' / 'test-run'
            mock_logger.create_run_directory.return_value = run_dir
            mock_logger_class.return_value = mock_logger
            
            result = await execute_snapshot_authority(mock_context)
            
            # Verify create_run_directory was called with snapshot_path
            call_args = mock_logger.create_run_directory.call_args
            assert call_args[1]['snapshot_path'] == snapshot_path


@pytest.mark.asyncio
async def test_typescript_command_failure(mock_context):
    """Test handling of TypeScript command failure."""
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {
            'status': 'failed',
            'output': '',
            'error': 'TypeScript discovery failed with code 1: Syntax error'
        }
        
        result = await execute_snapshot_authority(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert "TypeScript discovery failed" in result.errors[0]


@pytest.mark.asyncio
async def test_snapshot_missing(mock_context, tmp_path):
    """Test handling when snapshot file doesn't exist."""
    mock_context.repository_root = tmp_path
    
    # Don't create snapshot file
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {'status': 'success', 'output': 'OK', 'error': None}
        
        result = await execute_snapshot_authority(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert "Snapshot file not found" in result.errors[0]


@pytest.mark.asyncio
async def test_missing_canonical_hash(mock_context, tmp_path):
    """Test handling when snapshot is missing canonicalHash."""
    snapshot_data = {
        "evidence": [],
        "blocks": {}
        # Missing canonicalHash
    }
    
    mock_context.repository_root = tmp_path
    snapshot_dir = tmp_path / '.agents' / 'output'
    snapshot_dir.mkdir(parents=True)
    snapshot_path = snapshot_dir / 'snapshot.json'
    snapshot_path.write_text(json.dumps(snapshot_data))
    
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {'status': 'success', 'output': 'OK', 'error': None}
        
        result = await execute_snapshot_authority(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert "missing canonicalHash" in result.errors[0]


@pytest.mark.asyncio
async def test_repository_auditor_not_passed(mock_context):
    """Test that agent is blocked if repository auditor didn't pass."""
    # Override with failed auditor
    failed_auditor = AgentResult(
        agent_id="repository_auditor",
        status=AgentStatus.FAILED,
        outputs={},
        evidence_ids=[],
        errors=["Repository is dirty"]
    )
    mock_context.prior_agent_outputs = {"repository_auditor": failed_auditor}
    
    result = await execute_snapshot_authority(mock_context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "Repository auditor did not pass" in result.errors[0]


@pytest.mark.asyncio
async def test_invalid_json_in_snapshot(mock_context, tmp_path):
    """Test handling of invalid JSON in snapshot file."""
    mock_context.repository_root = tmp_path
    snapshot_dir = tmp_path / '.agents' / 'output'
    snapshot_dir.mkdir(parents=True)
    snapshot_path = snapshot_dir / 'snapshot.json'
    snapshot_path.write_text("{ invalid json }")
    
    with patch('app.agents.snapshot_authority._run_typescript_discovery') as mock_ts:
        mock_ts.return_value = {'status': 'success', 'output': 'OK', 'error': None}
        
        result = await execute_snapshot_authority(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert "Failed to parse snapshot JSON" in result.errors[0]
