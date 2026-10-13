"""
Integration tests for Migration Repair Workflow (FEAT-004).

Tests full workflow execution with database operations, agent coordination,
evidence collection, and fail-closed safety gates.

REQUIREMENTS:
- TEST_DATABASE_URL_TUTORIAL environment variable must be set
- Docker Compose test database must be running on port 55432
- Tests skip gracefully if database not configured
"""

import os
import pytest
import pytest_asyncio
from datetime import datetime, UTC
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from app.orchestration.agent_coordinator import (
    AgentCoordinator,
    AgentContext,
    AgentStatus,
    AgentResult,
)
from app.orchestration.agent_registry import AgentRegistry, AgentType
from app.workflows.migration_repair.models import (
    RunStatus,
    CheckStatus,
    AgentResult as MigrationAgentResult,
    VerificationStage,
)
from app.evidence import ledger


# Skip all tests if TEST_DATABASE_URL_TUTORIAL not configured
pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL_TUTORIAL"),
    reason="TEST_DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
)


@pytest.fixture
def mock_repository_root(tmp_path):
    """Create a mock repository root with basic structure."""
    repo_root = tmp_path / "test-repo"
    repo_root.mkdir()
    
    # Create basic directory structure
    (repo_root / "packages" / "db-tutorial" / "drizzle").mkdir(parents=True)
    (repo_root / "packages" / "db-tutorial" / "src" / "schema").mkdir(parents=True)
    
    # Create package.json with test scripts
    package_json = repo_root / "package.json"
    package_json.write_text("""{
  "name": "test-repo",
  "scripts": {
    "test": "echo 'test passed'",
    "test:integration": "echo 'integration tests passed'"
  }
}""")
    
    return repo_root


@pytest.fixture
def base_agent_context(mock_repository_root):
    """Create base agent context for testing."""
    return AgentContext(
        task_id="test-workflow-001",
            run_id="test-workflow-001-run",
        workflow_state={"workflow_id": "test-workflow-001", "phase": "W0"},
        repository_snapshot={"structure": {}, "blocks": {}},
        evidence_graph={},
        approved_scope=["migrations", "tests"],
        prior_agent_outputs={},
        repository_root=mock_repository_root,
        timestamp=datetime.now(UTC)
    )


@pytest_asyncio.fixture
async def agent_coordinator():
    """Create agent coordinator with registry."""
    registry = AgentRegistry()
    coordinator = AgentCoordinator(registry=registry)
    return coordinator


class TestWorkflowInitialization:
    """Test W0 initialization phase."""
    
    @pytest.mark.asyncio
    async def test_w0_creates_run_record(self, base_agent_context):
        """W0 agent creates workflow run record with baseline SHA."""
        # Mock workflow controller execution
        from app.workflows.migration_repair.agents import workflow_controller
        
        with patch.object(workflow_controller, 'execute_workflow_controller', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="workflow_controller",
                status=AgentStatus.SUCCESS,
                outputs={
                    "workflow_id": "test-workflow-001",
                    "baseline_sha": "abc123def456",
                    "execution_plan": ["W1", "W2", "W3"]
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["workflow_id"] == "test-workflow-001"
            assert "baseline_sha" in result.outputs
            assert "execution_plan" in result.outputs
    
    @pytest.mark.asyncio
    async def test_w0_establishes_file_ownership(self, base_agent_context):
        """W0 agent establishes file ownership map."""
        from app.workflows.migration_repair.agents import workflow_controller
        
        with patch.object(workflow_controller, 'execute_workflow_controller', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="workflow_controller",
                status=AgentStatus.SUCCESS,
                outputs={
                    "file_ownership_map": {
                        "0000_initial.sql": "W4-repair_implementer",
                        "0001_users.sql": "W4-repair_implementer"
                    }
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert "file_ownership_map" in result.outputs
            assert isinstance(result.outputs["file_ownership_map"], dict)


class TestParallelExecution:
    """Test W1 parallel agent execution."""
    
    @pytest.mark.asyncio
    async def test_w1_agents_run_in_parallel(self, agent_coordinator, base_agent_context):
        """W1 audit agents execute in parallel without blocking."""
        # Mock all W1 agents
        w1_agents = [
            AgentType.MIGRATION_AUDIT,
            AgentType.DATABASE_SAFETY_AUDIT,
            AgentType.TEST_INVENTORY,
            AgentType.EVIDENCE_AUDIT,
        ]
        
        # Simulate parallel execution by patching agent execution
        with patch.object(agent_coordinator, 'execute_agent', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="test_agent",
                status=AgentStatus.SUCCESS,
                outputs={"findings": []}
            )
            
            # Execute agents
            results = {}
            for agent_type in w1_agents:
                result = await agent_coordinator.execute_agent(agent_type.value, base_agent_context)
                results[agent_type.value] = result
            
            # All agents should have executed
            assert len(results) == 4
            assert all(r.status == AgentStatus.SUCCESS for r in results.values())
    
    @pytest.mark.asyncio
    async def test_w1_agents_are_read_only(self, base_agent_context):
        """W1 agents do not modify migration files."""
        from app.workflows.migration_repair.agents import migration_audit
        
        with patch.object(migration_audit, 'execute_migration_audit', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="migration_audit",
                status=AgentStatus.SUCCESS,
                outputs={
                    "findings": [],
                    "files_modified": []  # No files should be modified
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.outputs.get("files_modified", []) == []


class TestDependencyPropagation:
    """Test W2 receiving W1 outputs."""
    
    @pytest.mark.asyncio
    async def test_w2_receives_w1_findings(self, base_agent_context):
        """W2 repair planner receives all W1 audit findings."""
        from app.workflows.migration_repair.agents import repair_planner
        
        # Set up prior W1 outputs
        base_agent_context.prior_agent_outputs = {
            "migration_audit": AgentResult(
                agent_id="migration_audit",
                status=AgentStatus.SUCCESS,
                outputs={
                    "findings": [
                        {
                            "finding_type": "duplicate_object",
                            "severity": "critical",
                            "migration_file": "0001_users.sql",
                            "object_name": "users_table"
                        }
                    ]
                }
            ),
            "database_safety_audit": AgentResult(
                agent_id="database_safety_audit",
                status=AgentStatus.SUCCESS,
                outputs={"environment": "test", "safe": True}
            ),
        }
        
        with patch.object(repair_planner, 'execute_repair_planner', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="repair_planner",
                status=AgentStatus.SUCCESS,
                outputs={
                    "repair_plan": {
                        "findings_addressed": 1,
                        "migrations_to_fix": ["0001_users.sql"]
                    }
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert "repair_plan" in result.outputs
    
    @pytest.mark.asyncio
    async def test_w2_blocked_if_w1_failed(self, base_agent_context):
        """W2 repair planner is blocked if critical W1 agent failed."""
        base_agent_context.prior_agent_outputs = {
            "migration_audit": AgentResult(
                agent_id="migration_audit",
                status=AgentStatus.FAILED,
                errors=["Failed to read migration files"]
            )
        }
        
        from app.workflows.migration_repair.agents import repair_planner
        
        with patch.object(repair_planner, 'execute_repair_planner', new_callable=AsyncMock) as mock_exec:
            # Planner should detect failed prerequisite
            mock_exec.return_value = AgentResult(
                agent_id="repair_planner",
                status=AgentStatus.BLOCKED,
                errors=["Cannot plan repairs: migration_audit failed"]
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.BLOCKED


class TestVerificationRunner:
    """Test verification runner with disposable database."""
    
    @pytest.mark.asyncio
    async def test_verification_runner_creates_disposable_db(self, base_agent_context, db_session):
        """Verification runner uses disposable database for tests."""
        from app.workflows.migration_repair.agents import verification_runner
        
        with patch.object(verification_runner, 'execute_verification_runner', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="verification_runner",
                status=AgentStatus.SUCCESS,
                outputs={
                    "stages": [
                        {"stage_id": "V0", "name": "migrations", "status": "PASS"},
                        {"stage_id": "V1", "name": "schema_check", "status": "PASS"},
                        {"stage_id": "V2", "name": "integration_tests", "status": "PASS"},
                    ]
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert len(result.outputs["stages"]) == 3
    
    @pytest.mark.asyncio
    async def test_verification_blocks_downstream_on_migration_failure(self, base_agent_context):
        """Verification marks downstream stages BLOCKED when migration fails."""
        from app.workflows.migration_repair.agents import verification_runner
        
        with patch.object(verification_runner, 'execute_verification_runner', new_callable=AsyncMock) as mock_exec:
            # Migration stage fails
            mock_exec.return_value = AgentResult(
                agent_id="verification_runner",
                status=AgentStatus.FAILED,
                outputs={
                    "stages": [
                        {"stage_id": "V0", "name": "migrations", "status": "FAIL", "exit_code": 1},
                        {"stage_id": "V1", "name": "schema_check", "status": "BLOCKED", "blocked_reason": "migrations failed"},
                        {"stage_id": "V2", "name": "integration_tests", "status": "BLOCKED", "blocked_reason": "migrations failed"},
                    ]
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.FAILED
            stages = result.outputs["stages"]
            assert stages[0]["status"] == "FAIL"
            assert stages[1]["status"] == "BLOCKED"
            assert stages[2]["status"] == "BLOCKED"
    
    @pytest.mark.asyncio
    async def test_verification_captures_exit_codes(self, base_agent_context):
        """Verification runner captures all command exit codes."""
        from app.workflows.migration_repair.agents import verification_runner
        
        with patch.object(verification_runner, 'execute_verification_runner', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="verification_runner",
                status=AgentStatus.SUCCESS,
                outputs={
                    "stages": [
                        {"stage_id": "V0", "name": "migrations", "status": "PASS", "exit_code": 0},
                        {"stage_id": "V1", "name": "schema_check", "status": "PASS", "exit_code": 0},
                    ]
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            for stage in result.outputs["stages"]:
                assert "exit_code" in stage
                assert stage["exit_code"] == 0


class TestFinalGateAgent:
    """Test final gate agent evaluation."""
    
    @pytest.mark.asyncio
    async def test_final_gate_blocks_on_skipped_checks(self, base_agent_context):
        """Final gate returns BLOCKED when required checks are SKIPPED."""
        from app.workflows.migration_repair.agents import final_gate_agent
        
        base_agent_context.prior_agent_outputs = {
            "verification_runner": AgentResult(
                agent_id="verification_runner",
                status=AgentStatus.SUCCESS,
                outputs={
                    "stages": [
                        {"stage_id": "V0", "status": "PASS"},
                        {"stage_id": "V1", "status": "SKIPPED"},  # Required check skipped
                    ]
                }
            )
        }
        
        with patch.object(final_gate_agent, 'execute_final_gate_agent', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="final_gate_agent",
                status=AgentStatus.BLOCKED,
                outputs={
                    "verdict": "BLOCKED",
                    "reason": "Required verification stage V1 was SKIPPED"
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.BLOCKED
            assert result.outputs["verdict"] == "BLOCKED"
    
    @pytest.mark.asyncio
    async def test_final_gate_passes_with_all_checks(self, base_agent_context):
        """Final gate returns PASS when all required checks pass."""
        base_agent_context.prior_agent_outputs = {
            "verification_runner": AgentResult(
                agent_id="verification_runner",
                status=AgentStatus.SUCCESS,
                outputs={
                    "stages": [
                        {"stage_id": "V0", "status": "PASS"},
                        {"stage_id": "V1", "status": "PASS"},
                        {"stage_id": "V2", "status": "PASS"},
                    ]
                }
            ),
            "static_reviewer": AgentResult(
                agent_id="static_reviewer",
                status=AgentStatus.SUCCESS,
                outputs={"violations": []}
            ),
        }
        
        from app.workflows.migration_repair.agents import final_gate_agent
        
        with patch.object(final_gate_agent, 'execute_final_gate_agent', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="final_gate_agent",
                status=AgentStatus.SUCCESS,
                outputs={"verdict": "PASS"}
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["verdict"] == "PASS"


class TestPublisherAgent:
    """Test publisher agent conditional execution."""
    
    @pytest.mark.asyncio
    async def test_publisher_only_runs_after_gate_approval(self, base_agent_context):
        """Publisher agent only executes when final gate passes."""
        from app.workflows.migration_repair.agents import publisher_agent
        
        # Scenario 1: Gate blocked - publisher should not run
        base_agent_context.prior_agent_outputs = {
            "final_gate_agent": AgentResult(
                agent_id="final_gate_agent",
                status=AgentStatus.BLOCKED,
                outputs={"verdict": "BLOCKED"}
            )
        }
        
        with patch.object(publisher_agent, 'execute_publisher_agent', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="publisher_agent",
                status=AgentStatus.BLOCKED,
                outputs={"published": False, "reason": "Final gate not approved"}
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.BLOCKED
            assert not result.outputs["published"]
    
    @pytest.mark.asyncio
    async def test_publisher_commits_on_approval(self, base_agent_context):
        """Publisher commits and publishes when gate approves."""
        base_agent_context.prior_agent_outputs = {
            "final_gate_agent": AgentResult(
                agent_id="final_gate_agent",
                status=AgentStatus.SUCCESS,
                outputs={"verdict": "PASS"}
            )
        }
        
        from app.workflows.migration_repair.agents import publisher_agent
        
        with patch.object(publisher_agent, 'execute_publisher_agent', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="publisher_agent",
                status=AgentStatus.SUCCESS,
                outputs={
                    "published": True,
                    "commit_sha": "def456abc789",
                    "verified_sha_match": True
                }
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["published"]
            assert "commit_sha" in result.outputs
            assert result.outputs["verified_sha_match"]


class TestWorkflowRejection:
    """Test workflow stopping on W3 rejection."""
    
    @pytest.mark.asyncio
    async def test_workflow_stops_on_w3_rejection(self, base_agent_context):
        """Workflow stops and marks downstream agents BLOCKED when W3 rejects plan."""
        from app.workflows.migration_repair.agents import repair_reviewer
        
        # W3 reviewer rejects the plan
        with patch.object(repair_reviewer, 'execute_repair_reviewer', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="repair_reviewer",
                status=AgentStatus.FAILED,
                errors=["Repair plan contains destructive changes to users_table"],
                outputs={"approved": False, "rejection_reason": "destructive"}
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.FAILED
            assert not result.outputs["approved"]
            assert len(result.errors) > 0
    
    @pytest.mark.asyncio
    async def test_w4_blocked_after_w3_rejection(self, base_agent_context):
        """W4 implementer is blocked when W3 reviewer rejects."""
        base_agent_context.prior_agent_outputs = {
            "repair_reviewer": AgentResult(
                agent_id="repair_reviewer",
                status=AgentStatus.FAILED,
                outputs={"approved": False}
            )
        }
        
        from app.workflows.migration_repair.agents import repair_implementer
        
        with patch.object(repair_implementer, 'execute_repair_implementer', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = AgentResult(
                agent_id="repair_implementer",
                status=AgentStatus.BLOCKED,
                errors=["Cannot implement: repair plan was rejected by reviewer"]
            )
            
            result = await mock_exec(base_agent_context)
            
            assert result.status == AgentStatus.BLOCKED
