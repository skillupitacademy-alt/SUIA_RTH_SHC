"""
Workflow Controller Agent (W0)

Initializes workflow run record, establishes file ownership map, and logs
execution plan showing W0-W9 dependency graph.
"""

from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from app.workflows.migration_repair.plan import STEPS
from ..runner import run_command


async def execute_workflow_controller(context: AgentContext) -> AgentResult:
    """
    Execute workflow controller agent.
    
    Creates workflow run record, establishes file ownership, logs execution plan,
    and returns run manifest.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with status=SUCCESS, outputs containing run manifest
    """
    start_time = datetime.now(UTC)
    agent_id = "workflow_controller"
    
    try:
        # Get baseline SHA from git
        baseline_sha = await _get_git_sha(context.repository_root)
        
        # Create workflow run record
        workflow_run = {
            "workflow_id": context.task_id,
            "baseline_sha": baseline_sha,
            "timestamp": start_time.isoformat(),
            "repository_root": str(context.repository_root),
        }
        
        # Establish file ownership map (which agents can edit which files)
        # Based on W0-W9 wave structure
        file_ownership_map = {
            "W0": [],  # Read-only initialization
            "W1": [],  # Read-only audits
            "W2": [],  # Read-only planning
            "W3": [],  # Read-only review
            "W4": ["migrations/*.sql", "drizzle.config.ts", "meta/_journal.json"],  # Repair implementer can edit
            "W5": [],  # Read-only reviews
            "W6": [],  # Test execution only
            "W7": [".agents/evidence/*.jsonl"],  # Evidence assembler writes evidence
            "W8": [],  # Read-only gate
            "W9": [],  # Publisher commits but doesn't edit files directly
        }
        
        # Log execution plan showing W0-W9 dependency graph
        execution_plan = _build_execution_plan()
        
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W0",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W0",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "workflow_id": context.task_id,
                "baseline_sha": baseline_sha,
                "waves_count": len(execution_plan),
                "agents_count": len(STEPS),
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.SUCCESS,
            outputs={
                "run_manifest": {
                    **workflow_run,
                    "file_ownership_map": file_ownership_map,
                    "execution_plan": execution_plan,
                }
            },
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
        
    except Exception as e:
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log failure
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W0",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Workflow controller failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )


async def _get_git_sha(repo_root: Path) -> str:
    """
    Get current git SHA from repository.
    
    Args:
        repo_root: Repository root path
        
    Returns:
        Git SHA string or 'unknown' if git not available
    """
    try:
        result = await run_command(
            "git rev-parse HEAD",
            cwd=str(repo_root),
            timeout=5
        )
        if result.exit_code == 0:
            return result.stdout.strip()
        return "unknown"
    except Exception:
        return "unknown"


def _build_execution_plan() -> Dict[str, Any]:
    """
    Build execution plan from STEPS dependency graph.
    
    Returns:
        Dictionary mapping wave -> agent details
    """
    # Group steps by wave
    waves: Dict[str, list] = {}
    
    for step in STEPS:
        if step.wave not in waves:
            waves[step.wave] = []
        
        waves[step.wave].append({
            "agent_id": step.agent_id,
            "name": step.name,
            "dependencies": list(step.dependencies),
        })
    
    return waves
