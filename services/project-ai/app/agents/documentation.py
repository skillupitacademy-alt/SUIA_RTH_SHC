"""Documentation and canonical backlog agent handler."""

from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


async def execute_documentation(context: AgentContext) -> AgentResult:
    """
    Execute documentation and canonical backlog agent.
    
    Appends certification run to canonical documentation:
    - NEVER replaces existing documentation
    - Appends to canonical backlog
    - Records certification results
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with documentation updates
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get certification results from prior agents
        prior_results = context.prior_agent_outputs
        
        # Build certification summary
        summary = _build_certification_summary(prior_results)
        
        # Append to canonical backlog
        backlog_updated = _append_to_canonical_backlog(
            context.repository_root,
            summary,
            context.repository_snapshot
        )
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_documentation_evidence(context.repository_snapshot)
        
        # Build outputs
        outputs = {
            'backlog_updated': backlog_updated,
            'summary': summary,
            'timestamp': datetime.now(UTC).isoformat()
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="documentation",
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
            agent_id="documentation",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[str(e)],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _build_certification_summary(prior_results: Dict[str, 'AgentResult']) -> Dict[str, Any]:
    """
    Build certification summary from prior agent results.
    
    Args:
        prior_results: Dict of agent results
        
    Returns:
        Summary dict
    """
    summary = {
        'agents_executed': len(prior_results),
        'agents_passed': sum(1 for r in prior_results.values() if r.passed),
        'agents_failed': sum(1 for r in prior_results.values() if r.failed),
        'agent_results': {
            agent_id: {
                'status': result.status.value,
                'execution_time_ms': result.execution_time_ms
            }
            for agent_id, result in prior_results.items()
        }
    }
    return summary


def _append_to_canonical_backlog(
    repository_root: Path,
    summary: Dict[str, Any],
    snapshot: Dict[str, Any]
) -> bool:
    """
    Append certification run to canonical backlog.
    
    NEVER replaces existing content - always appends.
    
    Args:
        repository_root: Repository root path
        summary: Certification summary
        snapshot: Repository snapshot
        
    Returns:
        True if successful, False otherwise
    """
    try:
        backlog_path = repository_root / '.agents' / 'tasks' / 'm1-m2-backlog.md'
        
        # Ensure file exists
        if not backlog_path.exists():
            return False
        
        # Read existing content
        existing_content = backlog_path.read_text(encoding='utf-8')
        
        # Build append section
        timestamp = datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')
        commit_sha = snapshot.get('repository', {}).get('commitSha', 'unknown')
        
        append_section = f"""

---

## Certification Run — {timestamp}

**Commit:** {commit_sha}  
**Agents Executed:** {summary['agents_executed']}  
**Agents Passed:** {summary['agents_passed']}  
**Agents Failed:** {summary['agents_failed']}

### Agent Results

"""
        for agent_id, result in summary['agent_results'].items():
            status = result['status']
            exec_time = result['execution_time_ms']
            append_section += f"- **{agent_id}**: {status} ({exec_time:.2f}ms)\n"
        
        # Append to backlog
        backlog_path.write_text(existing_content + append_section, encoding='utf-8')
        
        return True
    
    except Exception:
        return False


def _collect_documentation_evidence(snapshot: Dict[str, Any]) -> List[str]:
    """
    Collect evidence IDs related to documentation.
    
    Args:
        snapshot: Repository snapshot
        
    Returns:
        List of evidence IDs
    """
    evidence_ids = []
    all_evidence = snapshot.get('evidence', [])
    
    # Find evidence for documentation files
    for evidence in all_evidence:
        path = evidence.get('path', '')
        if path.endswith('.md') or 'docs' in path.lower():
            evidence_ids.append(evidence.get('evidenceId', ''))
    
    return [eid for eid in evidence_ids if eid][:5]  # Limit to first 5
