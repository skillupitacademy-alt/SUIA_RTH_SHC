"""
Workflow DAG Definition.

Defines the 15-agent DAG structure with dependencies for Project AI certification workflow.

Agent Sequence (15 agents):
1. Repository Auditor - Validates git repository state
2. Snapshot Authority - Generates snapshot and creates run directory
3. Evidence Freeze - Validates evidence structure from snapshot
4. Block Specification - Parses candidate structure and generates requirements
5. Candidate Intake - Validates package structure and computes hashes
6. Candidate Classification - Classifies block family with confidence scoring
7. Canonical Comparison - Compares with canonical artifacts
8. Placement Manifest - Generates placement manifest with hash
9. Human Approval - Database polling approval workflow (Governance)
10. Placement Executor - Executes approved placement manifest
11. Post-Placement Snapshot - Verifies placement using git diff
12. Certification Controller - Orchestrates all certification gates (Contract, UBRC, Registry, Renderer, Composer, Tests, Runtime, Browser, Brand, Theme, Dependency)
13. Runtime Verification - Verifies blocks at runtime by starting application
14. Browser Verification - Orchestrates Playwright browser tests
15. Final Gate Controller - Aggregates all gate results and issues final verdict

Note: Certification gates are methods within Agent 12 (Certification Controller), not separate DAG nodes.
"""

from typing import Dict, List, Optional, TypedDict


class AgentDefinition(TypedDict):
    """Agent definition in the DAG."""
    name: str
    depends_on: List[str]
    parallel_group: Optional[str]


# 15-agent DAG structure
# Certification gates are executed within certification_controller, not as separate nodes
AGENT_WORKFLOW_DAG: Dict[str, AgentDefinition] = {
    # ===== FOUNDATION SEQUENCE (Agents 1-4) =====
    "repository_auditor": {
        "name": "Repository Auditor",
        "depends_on": [],
        "parallel_group": None
    },
    "snapshot_authority": {
        "name": "Snapshot Authority",
        "depends_on": ["repository_auditor"],
        "parallel_group": None
    },
    "evidence_freeze": {
        "name": "Evidence Freeze",
        "depends_on": ["snapshot_authority"],
        "parallel_group": None
    },
    "block_specification": {
        "name": "Block Specification",
        "depends_on": ["evidence_freeze"],
        "parallel_group": None
    },
    
    # ===== CANDIDATE INTAKE & CLASSIFICATION (Agents 5-7) =====
    "candidate_intake": {
        "name": "Candidate Intake",
        "depends_on": ["block_specification"],
        "parallel_group": None
    },
    "candidate_classification": {
        "name": "Candidate Classification",
        "depends_on": ["candidate_intake"],
        "parallel_group": None
    },
    "canonical_comparison": {
        "name": "Canonical Comparison",
        "depends_on": ["candidate_intake"],
        "parallel_group": None
    },
    
    # ===== PLACEMENT SEQUENCE (Agents 8-11) =====
    "placement_manifest": {
        "name": "Placement Manifest",
        "depends_on": ["candidate_classification", "canonical_comparison"],
        "parallel_group": None
    },
    "human_approval": {
        "name": "Human Approval (Governance)",
        "depends_on": ["placement_manifest"],
        "parallel_group": None
    },
    "placement_executor": {
        "name": "Placement Executor",
        "depends_on": ["human_approval"],
        "parallel_group": None
    },
    "post_placement_snapshot": {
        "name": "Post-Placement Snapshot",
        "depends_on": ["placement_executor"],
        "parallel_group": None
    },
    
    # ===== CERTIFICATION & VERIFICATION (Agents 12-15) =====
    "certification_controller": {
        "name": "Certification Controller",
        "depends_on": ["post_placement_snapshot"],
        "parallel_group": None
    },
    "runtime_verification": {
        "name": "Runtime Verification",
        "depends_on": ["certification_controller"],
        "parallel_group": None
    },
    "browser_verification": {
        "name": "Browser Verification (Playwright)",
        "depends_on": ["runtime_verification"],
        "parallel_group": None
    },
    "final_gate_controller": {
        "name": "Final Gate Controller",
        "depends_on": ["browser_verification"],
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
    # Verify we have exactly 15 agents
    if len(AGENT_WORKFLOW_DAG) != 15:
        raise ValueError(f"Expected 15 agents in DAG, found {len(AGENT_WORKFLOW_DAG)}")
    
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
