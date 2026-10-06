"""Governance and approval workflow agent handler."""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


async def execute_governance(context: AgentContext) -> AgentResult:
    """
    Execute governance and approval workflow agent.
    
    Enforces governance rules:
    - Self-approval prevention (submitter != approver)
    - Manifest hash verification
    - Approval workflow compliance
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with governance verification
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract workflow state
        workflow_state = context.workflow_state
        
        # Get approval data
        submitter = workflow_state.get('submitter', '')
        approver = workflow_state.get('approver', '')
        
        # Get placement manifest from prior agent
        placement_result = context.prior_agent_outputs.get('placement')
        manifest_hash = None
        if placement_result and placement_result.outputs:
            manifest_hash = placement_result.outputs.get('manifest_hash')
        
        # Enforce governance rules
        errors = []
        warnings = []
        
        # Rule 1: Self-approval prevention
        if submitter and approver and submitter == approver:
            errors.append(f"Self-approval detected: submitter and approver are both '{submitter}'")
        
        # Rule 2: Manifest presence and hash verification (Finding #4)
        if not manifest_hash:
            errors.append("Manifest hash is required but missing from placement result")
        elif len(manifest_hash) != 64:
            errors.append(f"Manifest hash has invalid length: {len(manifest_hash)} (expected 64)")
        
        # Rule 3: Approval workflow compliance
        if not submitter:
            warnings.append("No submitter identified in workflow state")
        if not approver:
            warnings.append("No approver identified in workflow state")
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_governance_evidence(context.repository_snapshot)
        
        # Build outputs
        outputs = {
            'submitter': submitter,
            'approver': approver,
            'self_approval_prevented': submitter != approver if (submitter and approver) else False,
            'manifest_hash_verified': bool(manifest_hash),
            'governance_compliant': len(errors) == 0
        }
        
        # Determine status
        status = AgentStatus.FAILED if errors else AgentStatus.SUCCESS
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="governance",
            status=status,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=errors,
            warnings=warnings,
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="governance",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[str(e)],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _collect_governance_evidence(snapshot: Dict[str, Any]) -> List[str]:
    """
    Collect evidence IDs related to governance.
    
    Args:
        snapshot: Repository snapshot
        
    Returns:
        List of evidence IDs
    """
    evidence_ids = []
    all_evidence = snapshot.get('evidence', [])
    
    # Find evidence for governance-related artifacts
    for evidence in all_evidence:
        path = evidence.get('path', '')
        if 'policy' in path.lower() or 'governance' in path.lower():
            evidence_ids.append(evidence.get('evidenceId', ''))
    
    return [eid for eid in evidence_ids if eid]  # No limit (Finding #6)
