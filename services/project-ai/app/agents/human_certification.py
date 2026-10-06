"""
Human Certification Agent (Agent 15).

Implements human review workflow for final certification.
Polls database table certification_reviews for human decision.
Similar to approval.py but for final certification review.
"""

import asyncio
import os
from datetime import datetime, UTC, timedelta
from typing import Any, Dict
from uuid import uuid4

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


# Certification decision values (matching database schema)
CERTIFICATION_STATUS_PENDING = "PENDING"
CERTIFICATION_STATUS_CERTIFIED = "CERTIFIED"
CERTIFICATION_STATUS_REJECTED = "REJECTED"
CERTIFICATION_STATUS_TIMEOUT = "TIMEOUT"


async def execute_human_certification(context: AgentContext) -> AgentResult:
    """
    Execute human certification agent (Agent 15).
    
    Implements database polling certification workflow:
    - Reads timeout from env var PROJECT_AI_CERTIFICATION_TIMEOUT_SEC (default 86400)
    - Creates certification request in database table certification_reviews
    - Polls every 30 seconds for status change
    - On CERTIFIED: returns SUCCESS status
    - On REJECTED or TIMEOUT: returns BLOCKED status
    - Returns BLOCKED until certified per final certification spec
    
    Args:
        context: Agent execution context with snapshot and prior agent outputs
        
    Returns:
        AgentResult with human_decision, reviewer, comments
        Status is BLOCKED until certified
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get final certification from prior agent (Agent 14 - Final Gate)
        final_gate_result = context.prior_agent_outputs.get('final-gate')
        if not final_gate_result or not final_gate_result.passed:
            return AgentResult(
                agent_id="human_certification",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Final gate agent did not pass or produce outputs"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Extract final certification data
        final_cert_outputs = final_gate_result.outputs
        verdict = final_cert_outputs.get('verdict')
        commit_sha = final_cert_outputs.get('commit_sha')
        snapshot_hash = final_cert_outputs.get('snapshot_hash')
        
        if not verdict or not commit_sha:
            return AgentResult(
                agent_id="human_certification",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=["Invalid final certification data: missing verdict or commit_sha"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Only proceed with human review if verdict is CERTIFICATION_READY
        if verdict != 'CERTIFICATION_READY':
            return AgentResult(
                agent_id="human_certification",
                status=AgentStatus.BLOCKED,
                outputs={
                    'human_decision': 'NOT_READY',
                    'verdict': verdict,
                    'reason': f"Final gate verdict is {verdict}, not CERTIFICATION_READY"
                },
                evidence_ids=final_gate_result.evidence_ids,
                errors=[f"Cannot request human certification: verdict is {verdict}"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Read timeout configuration from environment
        timeout_seconds = _get_certification_timeout()
        
        # Create certification request in database (or mock database)
        run_id = context.workflow_state.get('run_id', 'unknown')
        candidate_id = context.workflow_state.get('candidate_id', 'unknown')
        
        certification_id = await _create_certification_request(
            run_id=run_id,
            candidate_id=candidate_id,
            commit_sha=commit_sha,
            snapshot_hash=snapshot_hash,
            final_certification=final_cert_outputs
        )
        
        # Poll for certification decision with timeout
        certification_result = await _poll_for_certification(
            certification_id=certification_id,
            timeout_seconds=timeout_seconds,
            poll_interval=30  # Poll every 30 seconds
        )
        
        # Build outputs based on certification result
        outputs = {
            'human_decision': certification_result['decision'],
            'reviewer': certification_result.get('reviewer'),
            'comments': certification_result.get('comments'),
            'certification_id': certification_id,
            'reviewed_at': certification_result.get('reviewed_at'),
            'verdict': verdict
        }
        
        # Determine agent status
        if certification_result['decision'] == CERTIFICATION_STATUS_CERTIFIED:
            status = AgentStatus.SUCCESS
            errors = []
        else:
            # REJECTED, TIMEOUT - return BLOCKED
            status = AgentStatus.BLOCKED
            errors = [certification_result.get('error', f"Certification {certification_result['decision']}")]
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="human_certification",
            status=status,
            outputs=outputs,
            evidence_ids=final_gate_result.evidence_ids,  # Carry forward evidence
            errors=errors,
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="human_certification",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Human certification workflow failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _get_certification_timeout() -> int:
    """
    Get certification timeout from environment variable.
    
    Returns:
        Timeout in seconds (default 86400, min 60, max 604800)
    """
    try:
        timeout = int(os.environ.get('PROJECT_AI_CERTIFICATION_TIMEOUT_SEC', '86400'))
        # Enforce min/max bounds
        timeout = max(60, min(604800, timeout))
        return timeout
    except (ValueError, TypeError):
        return 86400  # Default to 24 hours


async def _create_certification_request(
    run_id: str,
    candidate_id: str,
    commit_sha: str,
    snapshot_hash: str,
    final_certification: Dict[str, Any]
) -> str:
    """
    Create certification request in database.
    
    Args:
        run_id: Run identifier
        candidate_id: Candidate block ID
        commit_sha: Git commit SHA
        snapshot_hash: Snapshot hash
        final_certification: Final certification data
        
    Returns:
        Certification ID
    """
    # In production, this would insert into database:
    # INSERT INTO certification_reviews (certification_id, run_id, candidate_id, 
    #                                    final_certification, requested_at, decision)
    # VALUES (?, ?, ?, ?, ?, 'PENDING')
    
    # For now, return mock certification ID
    certification_id = f"cert-{uuid4().hex[:12]}"
    
    # Mock database insert
    # (In real implementation, use database connection from context)
    
    return certification_id


async def _poll_for_certification(
    certification_id: str,
    timeout_seconds: int,
    poll_interval: int
) -> Dict[str, Any]:
    """
    Poll database for certification decision.
    
    Args:
        certification_id: Certification request ID
        timeout_seconds: Maximum time to wait
        poll_interval: Seconds between polls
        
    Returns:
        Dict with decision, reviewer, reviewed_at, comments, and optional error
    """
    start_time = datetime.now(UTC)
    timeout_deadline = start_time + timedelta(seconds=timeout_seconds)
    
    while datetime.now(UTC) < timeout_deadline:
        # Query database for certification status
        # SELECT decision, reviewer, reviewed_at, comments
        # FROM certification_reviews 
        # WHERE certification_id = ?
        
        certification_record = await _query_certification_status(certification_id)
        
        decision = certification_record.get('decision', CERTIFICATION_STATUS_PENDING)
        
        if decision == CERTIFICATION_STATUS_CERTIFIED:
            return {
                'decision': CERTIFICATION_STATUS_CERTIFIED,
                'reviewer': certification_record.get('reviewer'),
                'reviewed_at': certification_record.get('reviewed_at'),
                'comments': certification_record.get('comments')
            }
        
        elif decision == CERTIFICATION_STATUS_REJECTED:
            return {
                'decision': CERTIFICATION_STATUS_REJECTED,
                'error': f"Certification request {certification_id} was rejected",
                'reviewer': certification_record.get('reviewer'),
                'reviewed_at': certification_record.get('reviewed_at'),
                'comments': certification_record.get('comments')
            }
        
        # Still pending, wait and poll again
        await asyncio.sleep(poll_interval)
    
    # Timeout reached
    # Update database status to TIMEOUT
    await _update_certification_status(certification_id, CERTIFICATION_STATUS_TIMEOUT)
    
    return {
        'decision': CERTIFICATION_STATUS_TIMEOUT,
        'error': f"Certification request {certification_id} timed out after {timeout_seconds} seconds"
    }


async def _query_certification_status(certification_id: str) -> Dict[str, Any]:
    """
    Query certification status from database.
    
    Args:
        certification_id: Certification request ID
        
    Returns:
        Dict with decision, reviewer, reviewed_at, comments
    """
    # Mock implementation - in production, query real database
    # This would return actual database row
    
    return {
        'decision': CERTIFICATION_STATUS_PENDING,
        'reviewer': None,
        'reviewed_at': None,
        'comments': None
    }


async def _update_certification_status(certification_id: str, decision: str) -> None:
    """
    Update certification request decision in database.
    
    Args:
        certification_id: Certification request ID
        decision: New decision value
    """
    # Mock implementation - in production, update real database
    # UPDATE certification_reviews SET decision = ? WHERE certification_id = ?
    pass
