"""
Integration helpers for evidence recording.

Convenience wrappers for wave agents to easily record evidence.
"""

import logging
from datetime import datetime
from uuid import uuid4

from .ledger import record_agent_run
from .schemas import AgentRun, TestResult

logger = logging.getLogger(__name__)


def record_wave_completion(
    wave: str,
    agent_id: str,
    commit_before: str,
    commit_after: str,
    files: list[str],
    tests: TestResult | None,
    status: str
) -> AgentRun:
    """
    Record wave completion to evidence ledger.
    
    Args:
        wave: Wave identifier (e.g., 'W0', 'W1')
        agent_id: Agent identifier (e.g., 'W1A', 'W1B')
        commit_before: Git commit SHA before changes
        commit_after: Git commit SHA after changes
        files: List of file paths modified
        tests: Test results (if any tests were run)
        status: Run status ('completed', 'failed', etc.)
    
    Returns:
        The created AgentRun record
    
    Raises:
        Exception: If recording fails
    """
    try:
        # Generate unique run ID
        run_id = f"{wave}-{agent_id}-{uuid4().hex[:8]}"
        
        # Create AgentRun record
        run = AgentRun(
            runId=run_id,
            agentId=agent_id,
            wave=wave,
            commitBefore=commit_before,
            commitAfter=commit_after,
            filesChanged=files,
            tests=tests,
            evidence=[],  # Evidence artifacts can be added separately
            status=status,
            timestamp=datetime.now()
        )
        
        # Record to ledger
        record_agent_run(run)
        
        logger.info(f"Recorded wave completion: {run_id}")
        return run
        
    except Exception as e:
        logger.error(f"Failed to record wave completion: {e}")
        raise
