"""Tests for Repository Auditor Agent (Agent 01)."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, UTC

from app.agents.repository_auditor import execute_repository_auditor
from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentStatus


@pytest.fixture
def mock_context():
    """Create mock agent context."""
    return AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )


@pytest.mark.asyncio
async def test_clean_repository_success(mock_context):
    """Test repository auditor with clean repository."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        # Mock git directory exists
        mock_context.repository_root = Path(__file__).parent.parent.parent
        git_dir = mock_context.repository_root / '.git'
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git commands
            mock_git.side_effect = [
                ("abc123def456\n", None),  # git rev-parse HEAD
                ("m2-project-ai-foundation\n", None),  # git branch --show-current
                ("", None),  # git status --porcelain (clean)
                ("", None),  # git ls-files -u (no conflicts)
                ("origin\thttps://github.com/repo.git (fetch)\n", None),  # git remote -v
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["health_status"] == "HEALTHY"
            assert result.outputs["is_clean"] is True
            assert result.outputs["remote_reachable"] is True
            assert result.outputs["commit_sha"] == "abc123def456"
            assert result.outputs["branch_name"] == "m2-project-ai-foundation"
            assert len(result.errors) == 0


@pytest.mark.asyncio
async def test_dirty_repository_blocked(mock_context):
    """Test repository auditor with dirty working directory."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        mock_context.repository_root = Path(__file__).parent.parent.parent
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git commands - dirty repo
            mock_git.side_effect = [
                ("abc123def456\n", None),  # git rev-parse HEAD
                ("m2-project-ai-foundation\n", None),  # git branch --show-current
                ("M  file.py\n?? new_file.py\n", None),  # git status --porcelain (dirty)
                ("", None),  # git ls-files -u
                ("origin\thttps://github.com/repo.git (fetch)\n", None),  # git remote -v
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.BLOCKED
            assert result.outputs["health_status"] == "DIRTY"
            assert result.outputs["is_clean"] is False
            assert "Working directory is dirty" in result.errors[0]


@pytest.mark.asyncio
async def test_merge_conflicts_fail(mock_context):
    """Test repository auditor with merge conflicts."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        mock_context.repository_root = Path(__file__).parent.parent.parent
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git commands - conflicts
            mock_git.side_effect = [
                ("abc123def456\n", None),  # git rev-parse HEAD
                ("m2-project-ai-foundation\n", None),  # git branch --show-current
                ("", None),  # git status --porcelain
                ("100644 stage1 file.txt\n100644 stage2 file.txt\n", None),  # git ls-files -u (conflicts)
                ("origin\thttps://github.com/repo.git (fetch)\n", None),  # git remote -v
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.FAILED
            assert result.outputs["health_status"] == "CONFLICTS"
            assert result.outputs["has_conflicts"] is True
            assert "Merge conflicts detected" in result.errors[0]


@pytest.mark.asyncio
async def test_invalid_branch_fail(mock_context):
    """Test repository auditor with invalid branch name."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        mock_context.repository_root = Path(__file__).parent.parent.parent
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git commands - invalid branch
            mock_git.side_effect = [
                ("abc123def456\n", None),  # git rev-parse HEAD
                ("main\n", None),  # git branch --show-current (invalid)
                ("", None),  # git status --porcelain
                ("", None),  # git ls-files -u
                ("origin\thttps://github.com/repo.git (fetch)\n", None),  # git remote -v
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.FAILED
            assert result.outputs["health_status"] == "DIRTY"
            assert result.outputs["valid_branch"] is False
            assert "Invalid branch" in result.errors[0]


@pytest.mark.asyncio
async def test_remote_unreachable_blocked(mock_context):
    """Test repository auditor with unreachable remote."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        mock_context.repository_root = Path(__file__).parent.parent.parent
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git commands - no remote
            mock_git.side_effect = [
                ("abc123def456\n", None),  # git rev-parse HEAD
                ("m2-project-ai-foundation\n", None),  # git branch --show-current
                ("", None),  # git status --porcelain
                ("", None),  # git ls-files -u
                ("", None),  # git remote -v (no remote)
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.BLOCKED
            assert result.outputs["health_status"] == "DIRTY"
            assert result.outputs["remote_reachable"] is False
            assert "Git remote not reachable" in result.errors[0]


@pytest.mark.asyncio
async def test_not_git_repository(mock_context):
    """Test repository auditor when .git directory doesn't exist."""
    mock_context.repository_root = Path("/not/a/repo")
    
    with patch.object(Path, 'exists', return_value=False):
        result = await execute_repository_auditor(mock_context)
        
        assert result.status == AgentStatus.FAILED
        assert result.outputs["health_status"] == "CORRUPTED"
        assert ".git/ directory not found" in result.errors[0]


@pytest.mark.asyncio
async def test_feature_branch_accepted(mock_context):
    """Test that feature/* branches are accepted."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        mock_context.repository_root = Path(__file__).parent.parent.parent
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git commands - feature branch
            mock_git.side_effect = [
                ("abc123def456\n", None),  # git rev-parse HEAD
                ("feature/new-agent\n", None),  # git branch --show-current
                ("", None),  # git status --porcelain
                ("", None),  # git ls-files -u
                ("origin\thttps://github.com/repo.git (fetch)\n", None),  # git remote -v
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["health_status"] == "HEALTHY"
            assert result.outputs["branch_name"] == "feature/new-agent"
            assert result.outputs["valid_branch"] is True


@pytest.mark.asyncio
async def test_git_command_timeout(mock_context):
    """Test handling of git command timeout."""
    with patch('app.agents.repository_auditor._run_git_command') as mock_git:
        mock_context.repository_root = Path(__file__).parent.parent.parent
        
        with patch.object(Path, 'exists', return_value=True):
            # Mock git command timeout
            mock_git.side_effect = [
                ("", "Git command timed out after 30 seconds"),  # git rev-parse HEAD
            ]
            
            result = await execute_repository_auditor(mock_context)
            
            assert result.status == AgentStatus.FAILED
            assert "sha_error" in str(result.errors).lower() or "failed" in str(result.errors).lower()
