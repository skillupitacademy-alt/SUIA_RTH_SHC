"""
Workflow DAG Definition.

Defines the 15-agent DAG structure with dependencies for Project AI certification workflow.

Agent Sequence:
- Foundation Sequence (01-04): Repository audit → Snapshot → Evidence → Specification
- Classification & Governance (05-06): Classification → Governance
- Placement Sequence (07-10): Placement Draft → Manifest → Approval → Executor
- Post-Placement (11): Post-placement verification
- Certification Gates (12): All certification gates executed in parallel (12A-12J)
- Runtime & Browser (13-14): Runtime → Browser tests (sequential)
- Final Gate (15): Final gate controller and human certification
"""

from typing import Dict, List, Optional, TypedDict


class AgentDefinition(TypedDict):
    """Agent definition in the DAG."""
    name: str
    depends_on: List[str]
    parallel_group: Optional[str]


# 15-agent DAG structure
# Note: Certification gates (12A-12J) are executed as part of agent-12,
# not as separate DAG nodes. They run in parallel within that agent.
AGENT_WORKFLOW_DAG: Dict[str, AgentDefinition] = {
    # ===== FOUNDATION SEQUENCE (Sequential) =====
    "agent-01-repository-auditor": {
        "name": "Repository Auditor",
        "depends_on": [],
        "parallel_group": None
    },
    "agent-02-snapshot-authority": {
        "name": "Snapshot Authority",
        "depends_on": ["agent-01-repository-auditor"],
        "parallel_group": None
    },
    "agent-03-evidence-freeze": {
        "name": "Evidence Freeze",
        "depends_on": ["agent-02-snapshot-authority"],
        "parallel_group": None
    },
    "agent-04-block-specification": {
        "name": "Block Specification",
        "depends_on": ["agent-03-evidence-freeze"],
        "parallel_group": None
    },
    
    # ===== CLASSIFICATION & GOVERNANCE (Sequential) =====
    "agent-05-classification": {
        "name": "Candidate Classification",
        "depends_on": ["agent-04-block-specification"],
        "parallel_group": None
    },
    "agent-06-governance": {
        "name": "Governance & Approval",
        "depends_on": ["agent-05-classification"],
        "parallel_group": None
    },
    
    # ===== PLACEMENT SEQUENCE (Sequential) =====
    "agent-07-placement-draft": {
        "name": "Placement Draft",
        "depends_on": ["agent-06-governance"],
        "parallel_group": None
    },
    "agent-08-placement-manifest": {
        "name": "Placement Manifest",
        "depends_on": ["agent-07-placement-draft"],
        "parallel_group": None
    },
    "agent-09-human-approval": {
        "name": "Human Approval",
        "depends_on": ["agent-08-placement-manifest"],
        "parallel_group": None
    },
    "agent-10-placement-executor": {
        "name": "Placement Executor",
        "depends_on": ["agent-09-human-approval"],
        "parallel_group": None
    },
    
    # ===== POST-PLACEMENT VERIFICATION =====
    "agent-11-post-placement-verification": {
        "name": "Post-Placement Verification",
        "depends_on": ["agent-10-placement-executor"],
        "parallel_group": None
    },
    
    # ===== CERTIFICATION GATES (Parallel execution within agent) =====
    # Gates 12A-12J are executed in parallel within this agent
    # Individual gates: Contract, UBRC, Registry, Renderer, Composer, Brand, Theme
    "agent-12-certification-gates": {
        "name": "Certification Gates (Contract, UBRC, Registry, Renderer, Composer, Brand, Theme)",
        "depends_on": ["agent-11-post-placement-verification"],
        "parallel_group": "certification-gates"
    },
    
    # ===== RUNTIME CHAIN (Sequential after gates) =====
    "agent-13-runtime-verification": {
        "name": "Runtime Verification",
        "depends_on": ["agent-12-certification-gates"],
        "parallel_group": None
    },
    "agent-14-browser-certification": {
        "name": "Browser Certification (Playwright)",
        "depends_on": ["agent-13-runtime-verification"],
        "parallel_group": None
    },
    
    # ===== FINAL GATE =====
    "agent-15-final-gate": {
        "name": "Final Gate Controller & Human Certification",
        "depends_on": ["agent-14-browser-certification"],
        "parallel_group": None
    }
}


def get_agent_dependencies(agent_id: str) -> List[str]:
    """Get dependencies for a specific agent."""
    if agent_id not in AGENT_WORKFLOW_DAG:
        raise ValueError(f"Unknown agent: {agent_id}")
    return AGENT_WORKFLOW_DAG[agent_id]["depends_on"]


def get_parallel_group(agent_id: str) -> Optional[str]:
    """Get parallel group for a specific agent."""
    if agent_id not in AGENT_WORKFLOW_DAG:
        raise ValueError(f"Unknown agent: {agent_id}")
    return AGENT_WORKFLOW_DAG[agent_id]["parallel_group"]


def get_agents_in_parallel_group(group_name: str) -> List[str]:
    """Get all agents in a parallel group."""
    return [
        agent_id
        for agent_id, definition in AGENT_WORKFLOW_DAG.items()
        if definition["parallel_group"] == group_name
    ]


def validate_dag() -> bool:
    """
    Validate DAG structure for cycles and missing dependencies.
    
    Returns:
        True if DAG is valid, raises ValueError if invalid.
    """
    # Check for self-references
    for agent_id, definition in AGENT_WORKFLOW_DAG.items():
        if agent_id in definition["depends_on"]:
            raise ValueError(f"Agent {agent_id} depends on itself")
    
    # Check for missing dependencies
    all_agent_ids = set(AGENT_WORKFLOW_DAG.keys())
    for agent_id, definition in AGENT_WORKFLOW_DAG.items():
        for dep in definition["depends_on"]:
            if dep not in all_agent_ids:
                raise ValueError(f"Agent {agent_id} depends on unknown agent {dep}")
    
    # Check for cycles using DFS
    def has_cycle(node: str, visited: set, rec_stack: set) -> bool:
        visited.add(node)
        rec_stack.add(node)
        
        for dep in AGENT_WORKFLOW_DAG[node]["depends_on"]:
            if dep not in visited:
                if has_cycle(dep, visited, rec_stack):
                    return True
            elif dep in rec_stack:
                return True
        
        rec_stack.remove(node)
        return False
    
    visited = set()
    for agent_id in AGENT_WORKFLOW_DAG.keys():
        if agent_id not in visited:
            if has_cycle(agent_id, visited, set()):
                raise ValueError(f"Cycle detected in DAG starting from {agent_id}")
    
    return True
