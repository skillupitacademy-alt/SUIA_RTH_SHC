"""Toolchain analysis agent handler."""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


async def execute_toolchain(context: AgentContext) -> AgentResult:
    """
    Execute toolchain analysis agent.
    
    Extracts and analyzes toolchain information from the repository snapshot:
    - Runtime versions (node, pnpm, turbo)
    - Build tools (tsc, vitest, playwright)
    - Package manager configuration
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with toolchain analysis outputs
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract snapshot data (frozen, never re-read files)
        snapshot = context.repository_snapshot
        runtime_data = snapshot.get('runtime', {})
        toolchains = runtime_data.get('toolchains', [])
        
        # Analyze toolchain information
        toolchain_map = {
            tc.get('tool'): tc.get('version')
            for tc in toolchains
        }
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_toolchain_evidence(toolchains, snapshot)
        
        # Build outputs
        outputs = {
            'toolchain_count': len(toolchains),
            'toolchains': [
                {
                    'tool': tc.get('tool'),
                    'version': tc.get('version'),
                    'detectedFrom': tc.get('detectedFrom')
                }
                for tc in toolchains
            ],
            'toolchain_map': toolchain_map
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="toolchain",
            status=AgentStatus.SUCCESS,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=[],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="toolchain",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[str(e)],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _collect_toolchain_evidence(toolchains: List[Dict[str, Any]], snapshot: Dict[str, Any]) -> List[str]:
    """
    Collect evidence IDs related to toolchain detection.
    
    Args:
        toolchains: List of toolchain records
        snapshot: Repository snapshot
        
    Returns:
        List of evidence IDs
    """
    evidence_ids = []
    all_evidence = snapshot.get('evidence', [])
    
    # Find evidence for toolchain detection
    for evidence in all_evidence:
        if evidence.get('kind') == 'toolchain-detection':
            evidence_ids.append(evidence.get('evidenceId', ''))
    
    return [eid for eid in evidence_ids if eid]
