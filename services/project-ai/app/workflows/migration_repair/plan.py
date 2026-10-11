"""
Agent dependency planning for migration repair workflow.

Defines the 13-agent workflow with wave-based execution and dependency resolution.
"""

from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class AgentStep:
    """Agent execution step with dependencies."""
    
    agent_id: str
    wave: str
    name: str
    dependencies: tuple[str, ...]  # Agent IDs this step depends on
    
    def __post_init__(self):
        """Validate agent_id matches expected format."""
        if not self.agent_id.startswith("Agent"):
            raise ValueError(f"agent_id must start with 'Agent': {self.agent_id}")


# 13-agent migration repair workflow (W0-W9)
STEPS: tuple[AgentStep, ...] = (
    # W0: Workflow Controller
    AgentStep(
        agent_id="Agent0",
        wave="W0",
        name="Workflow Controller",
        dependencies=()
    ),
    
    # W1: Parallel audit agents (depend on W0)
    AgentStep(
        agent_id="Agent1",
        wave="W1",
        name="Migration Audit",
        dependencies=("Agent0",)
    ),
    AgentStep(
        agent_id="Agent2",
        wave="W1",
        name="DB Safety",
        dependencies=("Agent0",)
    ),
    AgentStep(
        agent_id="Agent3",
        wave="W1",
        name="Test Inventory",
        dependencies=("Agent0",)
    ),
    AgentStep(
        agent_id="Agent4",
        wave="W1",
        name="Evidence Audit",
        dependencies=("Agent0",)
    ),
    
    # W2: Repair Planner (depends on all W1)
    AgentStep(
        agent_id="Agent5",
        wave="W2",
        name="Repair Planner",
        dependencies=("Agent1", "Agent2", "Agent3", "Agent4")
    ),
    
    # W3: Independent Repair Review (depends on W2)
    AgentStep(
        agent_id="Agent6",
        wave="W3",
        name="Independent Repair Review",
        dependencies=("Agent5",)
    ),
    
    # W4: Repair Implementer (depends on W3)
    AgentStep(
        agent_id="Agent7",
        wave="W4",
        name="Repair Implementer",
        dependencies=("Agent6",)
    ),
    
    # W5: Parallel pre-verification (depend on W4)
    AgentStep(
        agent_id="Agent8",
        wave="W5",
        name="Static Review",
        dependencies=("Agent7",)
    ),
    AgentStep(
        agent_id="Agent9",
        wave="W5",
        name="Test Review",
        dependencies=("Agent7",)
    ),
    
    # W6: Verification Runner (depends on all W5)
    AgentStep(
        agent_id="Agent10",
        wave="W6",
        name="Verification Runner",
        dependencies=("Agent8", "Agent9")
    ),
    
    # W7: Evidence Assembler (depends on W6)
    AgentStep(
        agent_id="Agent11",
        wave="W7",
        name="Evidence Assembler",
        dependencies=("Agent10",)
    ),
    
    # W8: Final Independent Gate (depends on W7)
    AgentStep(
        agent_id="Agent12",
        wave="W8",
        name="Final Independent Gate",
        dependencies=("Agent11",)
    ),
    
    # W9: Publisher (depends on W8)
    AgentStep(
        agent_id="Agent13",
        wave="W9",
        name="Publisher",
        dependencies=("Agent12",)
    ),
)


def ready_steps(completed_agents: Sequence[str]) -> list[AgentStep]:
    """
    Identify steps whose dependencies are satisfied.
    
    Args:
        completed_agents: List of agent IDs that have completed
        
    Returns:
        List of AgentSteps that are ready to execute
    """
    completed_set = set(completed_agents)
    ready = []
    
    for step in STEPS:
        # Skip if already completed
        if step.agent_id in completed_set:
            continue
        
        # Check if all dependencies are completed
        if all(dep in completed_set for dep in step.dependencies):
            ready.append(step)
    
    return ready


def validate_no_cycles() -> None:
    """
    Validate the dependency graph has no cycles.
    
    Raises:
        ValueError: If a cycle is detected in the dependency graph
    """
    # Build adjacency list
    graph: dict[str, list[str]] = {}
    for step in STEPS:
        graph[step.agent_id] = list(step.dependencies)
    
    # Detect cycles using DFS with three colors: white (0), gray (1), black (2)
    color: dict[str, int] = {agent_id: 0 for agent_id in graph}
    
    def has_cycle(node: str) -> bool:
        """DFS helper to detect cycles."""
        if color[node] == 1:  # Gray = currently visiting
            return True
        if color[node] == 2:  # Black = already visited
            return False
        
        color[node] = 1  # Mark as gray
        for neighbor in graph[node]:
            if has_cycle(neighbor):
                return True
        color[node] = 2  # Mark as black
        return False
    
    for agent_id in graph:
        if color[agent_id] == 0:  # White = not visited
            if has_cycle(agent_id):
                raise ValueError(f"Cycle detected in dependency graph involving agent '{agent_id}'")


# Validate at module load time
validate_no_cycles()
