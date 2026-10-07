"""
Workflow engine for orchestrating AI-driven development tasks.

This implementation uses DAG-based multi-agent orchestration with
real capability execution through the agent coordinator framework.
Executes the complete 15-agent workflow defined in workflow_dag.py.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional

from app.models.task_state import TaskState
from app.orchestration.agent_coordinator import (
    AgentCoordinator,
    AgentContext,
    AgentResult,
    AgentStatus
)
from app.orchestration.agent_registry import AgentRegistry, AgentType
from app.orchestration.workflow_dag import AGENT_WORKFLOW_DAG, validate_dag, get_agents_in_parallel_group


class WorkflowStep:
    """Definition of a workflow step."""
    
    def __init__(
        self,
        step_id: str,
        name: str,
        description: str,
        from_state: TaskState,
        to_state: TaskState,
        requires_approval: bool = False
    ):
        self.step_id = step_id
        self.name = name
        self.description = description
        self.from_state = from_state
        self.to_state = to_state
        self.requires_approval = requires_approval


class WorkflowEngine:
    """
    Orchestrates task execution through state transitions with multi-agent coordination.
    
    Integrates with AgentCoordinator for DAG-based agent orchestration,
    replacing generic LLM stubs with specialized agent execution.
    """
    
    def __init__(
        self,
        agent_registry: Optional[AgentRegistry] = None,
        agent_coordinator: Optional[AgentCoordinator] = None
    ):
        """
        Initialize workflow engine with agent coordination support.
        
        Args:
            agent_registry: Agent registry (creates new if not provided)
            agent_coordinator: Agent coordinator (creates new if not provided)
        """
        self.steps = self._define_workflow_steps()
        self.agent_registry = agent_registry or AgentRegistry()
        self.agent_coordinator = agent_coordinator or AgentCoordinator(self.agent_registry)
        
        # Validate DAG on initialization
        validate_dag()
    
    def _define_workflow_steps(self) -> List[WorkflowStep]:
        """
        Define the standard workflow for AI-driven development tasks.
        
        Returns:
            List of workflow steps in execution order
        """
        return [
            WorkflowStep(
                step_id="discovery",
                name="Discovery",
                description="Analyze snapshot to gather relevant evidence",
                from_state=TaskState.CREATED,
                to_state=TaskState.DISCOVERY,
                requires_approval=False
            ),
            WorkflowStep(
                step_id="planning",
                name="Planning",
                description="Generate implementation plan based on evidence",
                from_state=TaskState.DISCOVERY,
                to_state=TaskState.PLANNING,
                requires_approval=False
            ),
            WorkflowStep(
                step_id="approval",
                name="Approval Gate",
                description="Wait for human review and approval",
                from_state=TaskState.PLANNING,
                to_state=TaskState.WAITING_FOR_APPROVAL,
                requires_approval=True
            ),
            WorkflowStep(
                step_id="implementation",
                name="Implementation",
                description="Execute approved plan and write code",
                from_state=TaskState.WAITING_FOR_APPROVAL,
                to_state=TaskState.IMPLEMENTING,
                requires_approval=False
            ),
            WorkflowStep(
                step_id="testing",
                name="Testing",
                description="Run tests to verify implementation",
                from_state=TaskState.IMPLEMENTING,
                to_state=TaskState.TESTING,
                requires_approval=False
            ),
            WorkflowStep(
                step_id="verification",
                name="Verification",
                description="Perform final quality checks",
                from_state=TaskState.TESTING,
                to_state=TaskState.VERIFYING,
                requires_approval=False
            ),
            WorkflowStep(
                step_id="completion",
                name="Completion",
                description="Mark task as complete",
                from_state=TaskState.VERIFYING,
                to_state=TaskState.COMPLETED,
                requires_approval=False
            ),
        ]
    
    def get_next_step(self, current_state: TaskState) -> Optional[WorkflowStep]:
        """
        Get the next workflow step for a task in given state.
        
        Args:
            current_state: Current task state
            
        Returns:
            Next workflow step, or None if no valid transition
        """
        for step in self.steps:
            if step.from_state == current_state:
                return step
        return None
    
    async def execute_step(
        self,
        step: WorkflowStep,
        task_context: Dict[str, Any],
        snapshot: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a workflow step using multi-agent coordination.
        
        Replaces generic LLM stubs with specialized agent execution
        through the agent coordinator framework.
        
        Args:
            step: Workflow step to execute
            task_context: Current task context
            snapshot: TypeScript snapshot data
            
        Returns:
            Updated task context with agent execution results
        """
        result = {
            **task_context,
            "last_step": step.step_id,
            "last_step_name": step.name,
        }
        
        # Get repository root from context or use default
        repository_root = Path(task_context.get('repository_root', '.'))
        
        # Create agent execution context
        agent_context = AgentContext(
            task_id=task_context.get('task_id', 'unknown'),
            workflow_state=task_context,
            repository_snapshot=snapshot,
            evidence_graph=task_context.get('evidence_graph', {}),
            approved_scope=task_context.get('approved_scope', []),
            prior_agent_outputs={},
            repository_root=repository_root
        )
        
        if step.step_id == "discovery":
            # Discovery: Repository Auditor → Snapshot Authority → Evidence Freeze → Block Specification
            agents_to_execute = [
                self.agent_registry.get_agent(AgentType.REPOSITORY_AUDITOR),
                self.agent_registry.get_agent(AgentType.SNAPSHOT_AUTHORITY),
                self.agent_registry.get_agent(AgentType.EVIDENCE_FREEZE),
                self.agent_registry.get_agent(AgentType.BLOCK_SPECIFICATION)
            ]
            
            # Execute sequentially (each builds on prior)
            agent_results = await self.agent_coordinator.execute_sequential(
                agents_to_execute,
                agent_context
            )
            
            result["discovery_agents"] = [r.agent_id for r in agent_results]
            result["discovery_summary"] = self._summarize_agent_results(agent_results)
        
        elif step.step_id == "planning":
            # Planning: Candidate Intake → Classification → Canonical Comparison
            agents_to_execute = [
                self.agent_registry.get_agent(AgentType.CANDIDATE_INTAKE),
                self.agent_registry.get_agent(AgentType.CANDIDATE_CLASSIFICATION),
                self.agent_registry.get_agent(AgentType.CANONICAL_COMPARISON)
            ]
            
            agent_results = await self.agent_coordinator.execute_sequential(
                agents_to_execute,
                agent_context
            )
            
            result["planning_agents"] = [r.agent_id for r in agent_results]
            result["plan"] = self._summarize_agent_results(agent_results)
        
        elif step.step_id == "implementation":
            # Implementation: Placement Manifest → Human Approval → Placement Executor
            agents_to_execute = [
                self.agent_registry.get_agent(AgentType.PLACEMENT_MANIFEST),
                self.agent_registry.get_agent(AgentType.HUMAN_APPROVAL),
                self.agent_registry.get_agent(AgentType.PLACEMENT_EXECUTOR),
                self.agent_registry.get_agent(AgentType.POST_PLACEMENT_SNAPSHOT)
            ]
            
            agent_results = await self.agent_coordinator.execute_sequential(
                agents_to_execute,
                agent_context
            )
            
            result["implementation_agents"] = [r.agent_id for r in agent_results]
            result["implementation_summary"] = self._summarize_agent_results(agent_results)
        
        elif step.step_id == "testing":
            # Testing: Certification Controller (orchestrates all gates internally)
            agents_to_execute = [
                self.agent_registry.get_agent(AgentType.CERTIFICATION_CONTROLLER)
            ]
            
            agent_results = await self.agent_coordinator.execute_sequential(
                agents_to_execute,
                agent_context
            )
            
            result["testing_agents"] = [r.agent_id for r in agent_results]
            result["test_results"] = self._summarize_agent_results(agent_results)
        
        elif step.step_id == "verification":
            # Verification: Runtime → Browser → Final Gate Controller
            agents_to_execute = [
                self.agent_registry.get_agent(AgentType.RUNTIME_VERIFICATION),
                self.agent_registry.get_agent(AgentType.BROWSER_VERIFICATION),
                self.agent_registry.get_agent(AgentType.FINAL_GATE_CONTROLLER)
            ]
            
            agent_results = await self.agent_coordinator.execute_sequential(
                agents_to_execute,
                agent_context
            )
            
            result["verification_agents"] = [r.agent_id for r in agent_results]
            result["verification_summary"] = self._summarize_agent_results(agent_results)
        
        return result
    
    def _summarize_agent_results(self, results: List[AgentResult]) -> str:
        """Create human-readable summary of agent results."""
        success_count = sum(1 for r in results if r.status == AgentStatus.SUCCESS)
        failed_count = sum(1 for r in results if r.status == AgentStatus.FAILED)
        
        summary_parts = [
            f"{success_count}/{len(results)} agents succeeded"
        ]
        
        if failed_count > 0:
            failed_agents = [r.agent_id for r in results if r.status == AgentStatus.FAILED]
            summary_parts.append(f"Failed: {', '.join(failed_agents)}")
        
        return "; ".join(summary_parts)
    
    def _summarize_dag_results(self, results: Dict[str, AgentResult]) -> str:
        """Create human-readable summary of DAG execution results."""
        success_count = sum(1 for r in results.values() if r.status == AgentStatus.SUCCESS)
        failed_count = sum(1 for r in results.values() if r.status == AgentStatus.FAILED)
        
        summary_parts = [
            f"{success_count}/{len(results)} agents succeeded"
        ]
        
        if failed_count > 0:
            failed_agents = [id for id, r in results.items() if r.status == AgentStatus.FAILED]
            summary_parts.append(f"Failed: {', '.join(failed_agents)}")
        
        return "; ".join(summary_parts)
    
    async def execute_dag_workflow(
        self,
        task_context: Dict[str, Any],
        snapshot: Dict[str, Any]
    ) -> Dict[str, AgentResult]:
        """
        Execute complete 15-agent DAG workflow.
        
        This replaces the step-based workflow with DAG-based execution
        using the AGENT_WORKFLOW_DAG from workflow_dag.py.
        
        Args:
            task_context: Task context with configuration
            snapshot: TypeScript snapshot data
            
        Returns:
            Dict of agent_id -> AgentResult for all agents
        """
        # Get repository root from context or use default
        repository_root = Path(task_context.get('repository_root', '.'))
        
        # Create agent execution context
        agent_context = AgentContext(
            task_id=task_context.get('task_id', 'unknown'),
            workflow_state=task_context,
            repository_snapshot=snapshot,
            evidence_graph=task_context.get('evidence_graph', {}),
            approved_scope=task_context.get('approved_scope', []),
            prior_agent_outputs={},
            repository_root=repository_root
        )
        
        # Build dependency graph from DAG
        dependencies: Dict[str, List[str]] = {}
        for agent_id, definition in AGENT_WORKFLOW_DAG.items():
            dependencies[agent_id] = definition['depends_on']
        
        # Get all agents - map agent_id to AgentType
        from app.orchestration.agent_registry import Agent, AgentType
        
        # Map agent_id to AgentType enum
        agent_type_map = {
            'repository_auditor': AgentType.REPOSITORY_AUDITOR,
            'snapshot_authority': AgentType.SNAPSHOT_AUTHORITY,
            'evidence_freeze': AgentType.EVIDENCE_FREEZE,
            'block_specification': AgentType.BLOCK_SPECIFICATION,
            'candidate_intake': AgentType.CANDIDATE_INTAKE,
            'candidate_classification': AgentType.CANDIDATE_CLASSIFICATION,
            'canonical_comparison': AgentType.CANONICAL_COMPARISON,
            'placement_manifest': AgentType.PLACEMENT_MANIFEST,
            'human_approval': AgentType.HUMAN_APPROVAL,
            'placement_executor': AgentType.PLACEMENT_EXECUTOR,
            'post_placement_snapshot': AgentType.POST_PLACEMENT_SNAPSHOT,
            'certification_controller': AgentType.CERTIFICATION_CONTROLLER,
            'runtime_verification': AgentType.RUNTIME_VERIFICATION,
            'browser_verification': AgentType.BROWSER_VERIFICATION,
            'final_gate_controller': AgentType.FINAL_GATE_CONTROLLER,
        }
        
        agents = []
        for agent_id in AGENT_WORKFLOW_DAG.keys():
            # Map agent_id to correct AgentType
            agent_type = agent_type_map.get(agent_id)
            if agent_type is None:
                raise ValueError(f"Unknown agent_id in DAG: {agent_id}")
            
            agent = Agent(
                agentId=agent_id,
                agentType=agent_type,
                name=AGENT_WORKFLOW_DAG[agent_id]['name'],
                capabilities=[],
                status='active',
                description=f"DAG agent: {AGENT_WORKFLOW_DAG[agent_id]['name']}"
            )
            agents.append(agent)
        
        # Execute DAG with coordinator
        results = await self.agent_coordinator.execute_dag(
            agents=agents,
            dependencies=dependencies,
            context=agent_context
        )
        
        return results
    
    def can_transition(self, from_state: TaskState, to_state: TaskState) -> bool:
        """
        Check if a state transition is valid.
        
        Args:
            from_state: Current state
            to_state: Desired state
            
        Returns:
            True if transition is allowed by workflow
        """
        for step in self.steps:
            if step.from_state == from_state and step.to_state == to_state:
                return True
        return False
