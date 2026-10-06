"""Human approval agent with database polling workflow."""

import asyncio
import os
from datetime import datetime, UTC, timedelta
from typing import Any, Dict, Optional
from uuid import uuid4

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


# Approval status values (matching database schema)
APPROVAL_STATUS_PENDING = "PENDING"
APPROVAL_STATUS_APPROVED = "APPROVED"
APPROVAL_STATUS_REJECTED = "REJECTED"
APPROVAL_STATUS_TIMEOUT = "TIMEOUT"


async def execute_approval(context: AgentContext) -> AgentResult:
    """
    Execute human approval agent (Agent 09).
    
    Implements database polling approval workflow:
    - Reads timeout from env var PROJECT_AI_APPROVAL_TIMEOUT_SEC (default 86400)
    - Creates approval request in database table approval_requests
    - Polls every 30 seconds for status change
    - On APPROVED: validates manifest_hash matches
    - On REJECTED or TIMEOUT: returns BLOCKED status
    - Returns BLOCKED until approved per design doc Agent 09 spec
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with approval_status, approved_manifest_hash, reviewer
        Status is BLOCKED until approved
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get placement manifest from prior agent
        manifest_result = context.prior_agent_outputs.get('placement_manifest')
        if not manifest_result or not manifest_result.passed:
            return AgentResult(
                agent_id="approval",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Placement manifest agent did not pass or produce outputs"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Extract manifest data
        manifest_data = manifest_result.outputs.get('manifest', {})
        manifest_id = manifest_data.get('manifestId')
        manifest_hash = manifest_data.get('manifestHash')
        candidate_id = manifest_data.get('candidateId')
        
        if not manifest_id or not manifest_hash or not candidate_id:
            return AgentResult(
                agent_id="approval",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=["Invalid manifest data: missing manifestId, manifestHash, or candidateId"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Read timeout configuration from environment
        timeout_seconds = _get_approval_timeout()
        
        # Create approval request in database (or mock database)
        request_id = await _create_approval_request(
            manifest_id=manifest_id,
            manifest_hash=manifest_hash,
            candidate_id=candidate_id
        )
        
        # Poll for approval with timeout
        approval_result = await _poll_for_approval(
            request_id=request_id,
            manifest_hash=manifest_hash,
            timeout_seconds=timeout_seconds,
            poll_interval=30  # Poll every 30 seconds
        )
        
        # Build outputs based on approval result
        outputs = {
            'approval_status': approval_result['status'],
            'approved_manifest_hash': approval_result.get('approved_hash'),
            'reviewer': approval_result.get('reviewer'),
            'request_id': request_id,
            'reviewed_at': approval_result.get('reviewed_at')
        }
        
        # Determine agent status
        if approval_result['status'] == APPROVAL_STATUS_APPROVED:
            status = AgentStatus.SUCCESS
            errors = []
        else:
            # REJECTED, TIMEOUT, or hash mismatch - return BLOCKED
            status = AgentStatus.BLOCKED
            errors = [approval_result.get('error', f"Approval {approval_result['status']}")]
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="approval",
            status=status,
            outputs=outputs,
            evidence_ids=manifest_result.evidence_ids,  # Carry forward evidence
            errors=errors,
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="approval",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Approval workflow failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _get_approval_timeout() -> int:
    """
    Get approval timeout from environment variable.
    
    Returns:
        Timeout in seconds (default 86400, min 60, max 604800)
    """
    try:
        timeout = int(os.environ.get('PROJECT_AI_APPROVAL_TIMEOUT_SEC', '86400'))
        # Enforce min/max bounds
        timeout = max(60, min(604800, timeout))
        return timeout
    except (ValueError, TypeError):
        return 86400  # Default to 24 hours


async def _create_approval_request(
    manifest_id: str,
    manifest_hash: str,
    candidate_id: str
) -> str:
    """
    Create approval request in database.
    
    Args:
        manifest_id: Placement manifest ID
        manifest_hash: Manifest hash for verification
        candidate_id: Candidate block ID
        
    Returns:
        Request ID
    """
    # In production, this would insert into database:
    # INSERT INTO approval_requests (request_id, manifest_id, manifest_hash, 
    #                                candidate_id, requested_at, status)
    # VALUES (?, ?, ?, ?, ?, 'PENDING')
    
    # For now, return mock request ID
    request_id = f"request-{uuid4().hex[:12]}"
    
    # Mock database insert
    # (In real implementation, use database connection from context)
    
    return request_id


async def _poll_for_approval(
    request_id: str,
    manifest_hash: str,
    timeout_seconds: int,
    poll_interval: int
) -> Dict[str, Any]:
    """
    Poll database for approval status change.
    
    Args:
        request_id: Approval request ID
        manifest_hash: Expected manifest hash
        timeout_seconds: Maximum time to wait
        poll_interval: Seconds between polls
        
    Returns:
        Dict with status, approved_hash, reviewer, reviewed_at, and optional error
    """
    start_time = datetime.now(UTC)
    timeout_deadline = start_time + timedelta(seconds=timeout_seconds)
    
    while datetime.now(UTC) < timeout_deadline:
        # Query database for approval status
        # SELECT status, manifest_hash, reviewer, reviewed_at 
        # FROM approval_requests 
        # WHERE request_id = ?
        
        approval_record = await _query_approval_status(request_id)
        
        status = approval_record.get('status', APPROVAL_STATUS_PENDING)
        
        if status == APPROVAL_STATUS_APPROVED:
            # Verify manifest hash matches
            approved_hash = approval_record.get('manifest_hash')
            if approved_hash != manifest_hash:
                return {
                    'status': 'MANIFEST_HASH_MISMATCH',
                    'error': f"Approved hash {approved_hash} does not match expected {manifest_hash}",
                    'approved_hash': approved_hash,
                    'reviewer': approval_record.get('reviewer'),
                    'reviewed_at': approval_record.get('reviewed_at')
                }
            
            return {
                'status': APPROVAL_STATUS_APPROVED,
                'approved_hash': approved_hash,
                'reviewer': approval_record.get('reviewer'),
                'reviewed_at': approval_record.get('reviewed_at')
            }
        
        elif status == APPROVAL_STATUS_REJECTED:
            return {
                'status': APPROVAL_STATUS_REJECTED,
                'error': f"Approval request {request_id} was rejected",
                'reviewer': approval_record.get('reviewer'),
                'reviewed_at': approval_record.get('reviewed_at')
            }
        
        # Still pending, wait and poll again
        await asyncio.sleep(poll_interval)
    
    # Timeout reached
    # Update database status to TIMEOUT
    await _update_approval_status(request_id, APPROVAL_STATUS_TIMEOUT)
    
    return {
        'status': APPROVAL_STATUS_TIMEOUT,
        'error': f"Approval request {request_id} timed out after {timeout_seconds} seconds"
    }


async def _query_approval_status(request_id: str) -> Dict[str, Any]:
    """
    Query approval status from database.
    
    Args:
        request_id: Approval request ID
        
    Returns:
        Dict with status, manifest_hash, reviewer, reviewed_at
    """
    # Mock implementation - in production, query real database
    # This would return actual database row
    
    return {
        'status': APPROVAL_STATUS_PENDING,
        'manifest_hash': None,
        'reviewer': None,
        'reviewed_at': None
    }


async def _update_approval_status(request_id: str, status: str) -> None:
    """
    Update approval request status in database.
    
    Args:
        request_id: Approval request ID
        status: New status value
    """
    # Mock implementation - in production, update real database
    # UPDATE approval_requests SET status = ? WHERE request_id = ?
    pass
