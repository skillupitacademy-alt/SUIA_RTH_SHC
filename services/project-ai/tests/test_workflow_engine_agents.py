"""Tests for workflow engine with multi-agent integration."""

import pytest
from pathlib import Path

from app.orchestration.workflow_engine import WorkflowEngine, WorkflowStep
from app.models.task_state import TaskState
from app.orchestration.agent_coordinator import AgentStatus


class TestWorkflowEngineAgentIntegration:
    """Test workflow engine integration with agent coordinator."""
    
    @pytest.fixture
    def engine(self):
        """Create workflow engine for testing."""
        return WorkflowEngine()
    
    @pytest.fixture
    def sample_snapshot(self):
        """Create sample snapshot for testing."""
        return {
            "structure": {},
            "blocks": {
                "implemented": [
                    {
                        "type": "introduction",
                        "implementationPath": "apps/test/blocks/introduction.tsx",
                        "path": "apps/test/blocks/introduction.ts"
                    }
                ],
                "verified": [
                    {
                        "blockType": "introduction",
                        "registered": True,
                        "documented": True,
                        "rendered": True,
                        "verificationLevel": "REGISTERED"
                    }
                ],
                "rendered": [
                    {
                        "blockType": "introduction",
                        "ubrcStatus": "UBRC_VALID"
                    }
                ]
            },
            "composer": {},
            "evidence": []
        }
    
    @pytest.fixture
    def task_context(self, tmp_path):
        """Create task context for testing."""
        return {
            "task_id": "test-task-001",
            "repository_root": str(tmp_path),
            "approved_scope": ["test"],
            "evidence_graph": {}
        }
    
    @pytest.mark.asyncio
    async def test_discovery_step_uses_agents(self, engine, task_context, sample_snapshot):
        """Discovery step executes repository auditor and related agents."""
        step = engine.get_next_step(TaskState.CREATED)
        assert step.step_id == "discovery"
        
        result = await engine.execute_step(step, task_context, sample_snapshot)
        
        assert "discovery_agents" in result
        assert "discovery_summary" in result
        # New 15-agent architecture: discovery includes foundation agents
        assert "repository_auditor" in result["discovery_agents"]
        assert "snapshot_authority" in result["discovery_agents"]
        assert "evidence_freeze" in result["discovery_agents"]
        assert "block_specification" in result["discovery_agents"]
    
    @pytest.mark.asyncio
    async def test_planning_step_uses_agents(self, engine, task_context, sample_snapshot):
        """Planning step executes candidate intake and classification agents."""
        step = WorkflowStep(
            step_id="planning",
            name="Planning",
            description="Plan implementation",
            from_state=TaskState.DISCOVERY,
            to_state=TaskState.PLANNING
        )
        
        result = await engine.execute_step(step, task_context, sample_snapshot)
        
        assert "planning_agents" in result
        assert "plan" in result
        # New 15-agent architecture: planning includes intake, classification, canonical comparison
        assert "candidate_intake" in result["planning_agents"]
        assert "candidate_classification" in result["planning_agents"]
        assert "canonical_comparison" in result["planning_agents"]
    
    @pytest.mark.asyncio
    async def test_testing_step_runs_parallel_agents(self, engine, task_context, sample_snapshot):
        """Testing step runs certification controller (which orchestrates all gates)."""
        step = WorkflowStep(
            step_id="testing",
            name="Testing",
            description="Run tests",
            from_state=TaskState.IMPLEMENTING,
            to_state=TaskState.TESTING
        )
        
        result = await engine.execute_step(step, task_context, sample_snapshot)
        
        assert "testing_agents" in result
        assert "test_results" in result
        # New 15-agent architecture: certification controller orchestrates all gates internally
        assert "certification_controller" in result["testing_agents"]
    
    @pytest.mark.asyncio
    async def test_verification_step_uses_dag(self, engine, task_context, sample_snapshot):
        """Verification step uses sequential execution for runtime and browser verification."""
        step = WorkflowStep(
            step_id="verification",
            name="Verification",
            description="Final verification",
            from_state=TaskState.TESTING,
            to_state=TaskState.VERIFYING
        )
        
        result = await engine.execute_step(step, task_context, sample_snapshot)
        
        assert "verification_agents" in result
        assert "verification_summary" in result
        
        # New 15-agent architecture: verification includes runtime, browser, final gate controller
        assert "runtime_verification" in result["verification_agents"]
        assert "browser_verification" in result["verification_agents"]
        assert "final_gate_controller" in result["verification_agents"]
    
    @pytest.mark.asyncio
    async def test_complete_workflow_execution(self, engine, task_context, sample_snapshot):
        """Complete workflow can be executed through all steps."""
        # Start at CREATED state
        current_state = TaskState.CREATED
        
        # Execute discovery
        step = engine.get_next_step(current_state)
        assert step.step_id == "discovery"
        result = await engine.execute_step(step, task_context, sample_snapshot)
        assert "discovery_summary" in result
        current_state = step.to_state
        
        # Execute planning
        step = engine.get_next_step(current_state)
        assert step.step_id == "planning"
        result = await engine.execute_step(step, result, sample_snapshot)
        assert "plan" in result
        current_state = step.to_state
        
        # Skip approval (would be manual)
        step = engine.get_next_step(current_state)
        assert step.step_id == "approval"
        current_state = step.to_state
        
        # Execute implementation
        step = engine.get_next_step(current_state)
        assert step.step_id == "implementation"
        result = await engine.execute_step(step, result, sample_snapshot)
        current_state = step.to_state
        
        # Execute testing
        step = engine.get_next_step(current_state)
        assert step.step_id == "testing"
        result = await engine.execute_step(step, result, sample_snapshot)
        assert "test_results" in result
        current_state = step.to_state
        
        # Execute verification
        step = engine.get_next_step(current_state)
        assert step.step_id == "verification"
        result = await engine.execute_step(step, result, sample_snapshot)
        assert "verification_summary" in result
        current_state = step.to_state
        
        # Complete
        step = engine.get_next_step(current_state)
        assert step.step_id == "completion"
        assert step.to_state == TaskState.COMPLETED
    
    def test_workflow_engine_has_agent_registry(self, engine):
        """Workflow engine has agent registry."""
        assert engine.agent_registry is not None
        agents = engine.agent_registry.list_agents()
        assert len(agents) == 15
    
    def test_workflow_engine_has_coordinator(self, engine):
        """Workflow engine has agent coordinator."""
        assert engine.agent_coordinator is not None
        assert engine.agent_coordinator.registry == engine.agent_registry
    
    def test_summarize_agent_results(self, engine):
        """Agent result summarization works correctly."""
        from app.orchestration.agent_coordinator import AgentResult, AgentStatus
        
        results = [
            AgentResult(agent_id="agent1", status=AgentStatus.SUCCESS),
            AgentResult(agent_id="agent2", status=AgentStatus.SUCCESS),
            AgentResult(agent_id="agent3", status=AgentStatus.FAILED, errors=["error"])
        ]
        
        summary = engine._summarize_agent_results(results)
        assert "2/3 agents succeeded" in summary
        assert "agent3" in summary
    
    def test_summarize_dag_results(self, engine):
        """DAG result summarization works correctly."""
        from app.orchestration.agent_coordinator import AgentResult, AgentStatus
        
        results = {
            "agent1": AgentResult(agent_id="agent1", status=AgentStatus.SUCCESS),
            "agent2": AgentResult(agent_id="agent2", status=AgentStatus.FAILED, errors=["error"]),
            "agent3": AgentResult(agent_id="agent3", status=AgentStatus.SUCCESS)
        }
        
        summary = engine._summarize_dag_results(results)
        assert "2/3 agents succeeded" in summary
        assert "agent2" in summary


class TestWorkflowStateTransitions:
    """Test workflow state transitions remain valid with agent integration."""
    
    @pytest.fixture
    def engine(self):
        return WorkflowEngine()
    
    def test_all_states_have_transitions(self, engine):
        """All non-terminal states have valid next steps."""
        terminal_states = [
            TaskState.COMPLETED,
            TaskState.FAILED,
            TaskState.BLOCKED,
            TaskState.REJECTED
        ]
        
        for state in TaskState:
            if state not in terminal_states:
                next_step = engine.get_next_step(state)
                assert next_step is not None, f"No transition defined for state {state}"
    
    def test_can_transition_validates_workflow(self, engine):
        """can_transition correctly validates state transitions."""
        # Valid transition
        assert engine.can_transition(TaskState.CREATED, TaskState.DISCOVERY)
        assert engine.can_transition(TaskState.DISCOVERY, TaskState.PLANNING)
        
        # Invalid transition
        assert not engine.can_transition(TaskState.CREATED, TaskState.COMPLETED)
        assert not engine.can_transition(TaskState.DISCOVERY, TaskState.IMPLEMENTING)
    
    def test_workflow_steps_sequential(self, engine):
        """Workflow steps form valid sequential chain."""
        steps = engine.steps
        
        # Each step's to_state should match next step's from_state (except last)
        for i in range(len(steps) - 1):
            current_step = steps[i]
            next_step = steps[i + 1]
            
            # Skip approval step as it has special handling
            if current_step.step_id == "approval":
                continue
            
            # Next step should start from current step's end state
            # (or be the approval gate which accepts PLANNING)
            if next_step.step_id != "approval":
                assert current_step.to_state == next_step.from_state or \
                       next_step.from_state == TaskState.WAITING_FOR_APPROVAL
