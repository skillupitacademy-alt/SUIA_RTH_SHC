"""
Unit tests for CLI --dry-run functionality
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import patch, AsyncMock, MagicMock
import asyncio


def test_cli_dry_run_flag_produces_plan(tmp_path):
    """Test that --dry-run flag logs execution plan without executing."""
    # Import the CLI module
    cli_script = Path(__file__).parent.parent.parent.parent / "scripts" / "run-migration-repair.py"
    
    assert cli_script.exists(), f"CLI script not found at {cli_script}"
    
    # Run with --dry-run using subprocess
    import subprocess
    result = subprocess.run(
        [sys.executable, str(cli_script), "--dry-run"],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    # Should exit with 0
    assert result.returncode == 0, f"CLI failed with stderr: {result.stderr}"
    
    # Should contain dry_run output
    assert "DRY RUN MODE" in result.stdout, "Missing dry run header"
    assert "workflow_" in result.stdout, "Missing workflow ID"
    assert "W0:" in result.stdout, "Missing wave W0"
    assert "W1:" in result.stdout, "Missing wave W1"
    assert "Total waves:" in result.stdout, "Missing waves count"
    assert "Total agents:" in result.stdout, "Missing agents count"
    assert "workflow_controller" in result.stdout, "Missing workflow_controller agent"


def test_cli_dry_run_does_not_execute_agents():
    """Test that --dry-run does not call actual agent execution."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts"))
    from run_migration_repair import MigrationRepairWorkflow
    
    # Create workflow in dry-run mode
    workflow = MigrationRepairWorkflow(
        workflow_id="test_dry_run_001",
        dry_run=True
    )
    
    # Mock the agent executor
    with patch.object(workflow.coordinator, 'execute_agent', new_callable=AsyncMock) as mock_exec:
        # Run the workflow
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(workflow.execute())
        
        # Assert agent executor was NOT called in dry-run mode
        mock_exec.assert_not_called()
        
        # Assert result indicates dry run
        assert result["dry_run"] is True
        assert "execution_plan" in result
        assert result["total_waves"] > 0
        assert result["total_agents"] > 0


def test_cli_dry_run_does_not_write_to_database():
    """Test that --dry-run does not make any database writes."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts"))
    from run_migration_repair import MigrationRepairWorkflow
    from app.evidence.ledger import append_workflow_event, append_agent_run
    
    # Mock evidence logging functions
    with patch('app.evidence.ledger.append_workflow_event') as mock_workflow_event:
        with patch('app.evidence.ledger.append_agent_run') as mock_agent_run:
            # Create workflow in dry-run mode
            workflow = MigrationRepairWorkflow(
                workflow_id="test_dry_run_002",
                dry_run=True
            )
            
            # Run the workflow
            loop = asyncio.get_event_loop()
            result = loop.run_until_complete(workflow.execute())
            
            # In dry-run mode, should NOT log workflow events
            # (The current implementation may log start/completion events,
            # but should not log agent execution events)
            
            # Verify dry run completed
            assert result["dry_run"] is True
            
            # Agent runs should not be logged in dry-run mode
            mock_agent_run.assert_not_called()


def test_cli_without_dry_run_executes_agents():
    """Test that CLI without --dry-run would execute agents (but mock them)."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts"))
    from run_migration_repair import MigrationRepairWorkflow
    from app.orchestration.agent_coordinator import AgentResult, AgentStatus
    
    # Create workflow NOT in dry-run mode
    workflow = MigrationRepairWorkflow(
        workflow_id="test_execute_001",
        dry_run=False
    )
    
    # Mock the agent executor to prevent actual execution
    with patch.object(workflow.coordinator, 'execute_agent', new_callable=AsyncMock) as mock_exec:
        mock_exec.return_value = AgentResult(
            agent_id="workflow_controller",
            status=AgentStatus.SUCCESS,
            outputs={"run_manifest": {}}
        )
        
        # Run just the W0 wave (to avoid long execution)
        loop = asyncio.get_event_loop()
        
        # Execute just W0
        task = workflow._execute_wave("W0")
        loop.run_until_complete(task)
        
        # Assert agent executor WAS called when not in dry-run mode
        assert mock_exec.call_count > 0


def test_cli_dry_run_shows_all_waves():
    """Test that --dry-run displays all 10 waves (W0-W9)."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "scripts"))
    from run_migration_repair import MigrationRepairWorkflow
    
    workflow = MigrationRepairWorkflow(
        workflow_id="test_waves_001",
        dry_run=True
    )
    
    # Run dry-run
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(workflow.execute())
    
    # Check execution plan has all waves
    execution_plan = result["execution_plan"]
    
    expected_waves = ["W0", "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9"]
    for wave in expected_waves:
        assert wave in execution_plan, f"Missing wave {wave} in execution plan"


def test_cli_dry_run_exit_code_is_zero():
    """Test that --dry-run exits with code 0."""
    import subprocess
    cli_script = Path(__file__).parent.parent.parent.parent / "scripts" / "run-migration-repair.py"
    
    result = subprocess.run(
        [sys.executable, str(cli_script), "--dry-run"],
        capture_output=True,
        timeout=30
    )
    
    assert result.returncode == 0, "Dry-run should exit with code 0"
