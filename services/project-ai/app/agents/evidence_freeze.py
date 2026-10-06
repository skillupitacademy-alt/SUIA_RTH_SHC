"""
Evidence Freeze Agent (Agent 03)

Validates evidence structure from frozen snapshot.
NO file recomputation - trusts TypeScript-computed hashes.

Architecture Rules:
- Agent 03 validates evidence structure, never recomputes hashes
- Trusts TypeScript contentHash values (SHA-256 hex)
- Creates evidence index for fast lookup by downstream agents
- Validates all required fields and lifecycle values
"""

import re
from datetime import datetime, UTC
from typing import Dict, List, Set

from app.models.agent_result import AgentResult, AgentStatus
from app.models.evidence import EvidenceRecord
from app.orchestration.agent_coordinator import AgentContext


# Valid lifecycle values per TypeScript Evidence interface
VALID_LIFECYCLES = {'current', 'historical'}

# SHA-256 hash is 64 hex characters
CONTENT_HASH_PATTERN = re.compile(r'^[a-f0-9]{64}$')


async def execute_evidence_freeze(context: AgentContext) -> AgentResult:
    """
    Execute evidence freeze agent.
    
    Validates evidence structure from snapshot:
    1. Read snapshot from prior agent output
    2. Extract all evidence records from snapshot.evidence array
    3. Validate structure: required fields, hash format, no duplicates, valid lifecycle
    4. Create evidence index for fast lookup
    5. NO file recomputation - trust TypeScript hashes
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with evidence_count, binding_valid, format_valid, evidence_ids
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get snapshot from context
        snapshot = context.repository_snapshot
        
        if not snapshot:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="evidence_freeze",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["No snapshot available in context"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Extract evidence array
        evidence_array = snapshot.get('evidence', [])
        
        if not evidence_array:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="evidence_freeze",
                status=AgentStatus.FAILED,
                outputs={
                    "evidence_count": 0,
                    "binding_valid": False,
                    "format_valid": False
                },
                evidence_ids=[],
                errors=["Snapshot contains no evidence records"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Validate evidence structure
        validation_result = _validate_evidence_structure(evidence_array)
        
        if not validation_result['valid']:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="evidence_freeze",
                status=AgentStatus.FAILED,
                outputs={
                    "evidence_count": len(evidence_array),
                    "binding_valid": False,
                    "format_valid": False,
                    "validation_errors": validation_result['errors']
                },
                evidence_ids=[],
                errors=validation_result['errors'],
                warnings=validation_result['warnings'],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Create evidence index for fast lookup
        evidence_index = _create_evidence_index(evidence_array)
        
        # Store evidence index in context for downstream agents
        context.workflow_state['evidence_index'] = evidence_index
        
        # Build outputs
        outputs = {
            "evidence_count": len(evidence_array),
            "binding_valid": True,
            "format_valid": True,
            "evidence_ids": validation_result['evidence_ids'],
            "scanners_detected": validation_result['scanners'],
            "kinds_detected": validation_result['kinds'],
            "lifecycle_breakdown": validation_result['lifecycle_breakdown'],
            "evidence_index_size": len(evidence_index)
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="evidence_freeze",
            status=AgentStatus.SUCCESS,
            outputs=outputs,
            evidence_ids=validation_result['evidence_ids'],
            errors=[],
            warnings=validation_result['warnings'],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="evidence_freeze",
            status=AgentStatus.FAILED,
            outputs={
                "evidence_count": 0,
                "binding_valid": False,
                "format_valid": False
            },
            evidence_ids=[],
            errors=[f"Evidence freeze execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _validate_evidence_structure(evidence_array: List[Dict]) -> Dict:
    """
    Validate evidence structure without recomputing hashes.
    
    Checks:
    - Required fields present
    - contentHash is 64-char SHA-256 hex
    - No duplicate evidenceIds
    - Valid lifecycle values (current/historical)
    
    Args:
        evidence_array: List of evidence records from snapshot
        
    Returns:
        Dict with 'valid', 'errors', 'warnings', 'evidence_ids', 'scanners', 'kinds', 'lifecycle_breakdown'
    """
    errors = []
    warnings = []
    evidence_ids = []
    seen_ids: Set[str] = set()
    scanners: Set[str] = set()
    kinds: Set[str] = set()
    lifecycle_breakdown = {'current': 0, 'historical': 0, 'invalid': 0}
    
    # Required fields per TypeScript Evidence interface
    required_fields = [
        'evidenceId',
        'scannerName',
        'timestamp',
        'path',
        'kind',
        'claim',
        'locator',
        'contentHash',
        'lifecycle'
    ]
    
    for idx, record in enumerate(evidence_array):
        # Check required fields
        missing_fields = [field for field in required_fields if field not in record]
        
        if missing_fields:
            errors.append(
                f"Evidence record {idx} missing required fields: {', '.join(missing_fields)}"
            )
            continue
        
        # Extract evidenceId
        evidence_id = record['evidenceId']
        
        # Check for duplicate evidenceIds
        if evidence_id in seen_ids:
            errors.append(f"Duplicate evidenceId found: {evidence_id}")
        else:
            seen_ids.add(evidence_id)
            evidence_ids.append(evidence_id)
        
        # Validate contentHash format (64-char SHA-256 hex)
        content_hash = record['contentHash']
        if not CONTENT_HASH_PATTERN.match(content_hash):
            errors.append(
                f"Evidence {evidence_id} has invalid contentHash format: {content_hash} "
                "(expected 64-char SHA-256 hex)"
            )
        
        # Validate lifecycle
        lifecycle = record['lifecycle']
        if lifecycle not in VALID_LIFECYCLES:
            errors.append(
                f"Evidence {evidence_id} has invalid lifecycle: {lifecycle} "
                f"(expected {' or '.join(VALID_LIFECYCLES)})"
            )
            lifecycle_breakdown['invalid'] += 1
        else:
            lifecycle_breakdown[lifecycle] += 1
        
        # Collect scanners and kinds
        scanners.add(record['scannerName'])
        kinds.add(record['kind'])
    
    # Check if we have any evidence
    if len(evidence_ids) == 0:
        errors.append("No valid evidence records found")
    
    # Warnings for lifecycle distribution
    if lifecycle_breakdown['historical'] > lifecycle_breakdown['current']:
        warnings.append(
            f"More historical ({lifecycle_breakdown['historical']}) than current "
            f"({lifecycle_breakdown['current']}) evidence - may indicate stale snapshot"
        )
    
    valid = len(errors) == 0
    
    return {
        'valid': valid,
        'errors': errors,
        'warnings': warnings,
        'evidence_ids': evidence_ids,
        'scanners': sorted(list(scanners)),
        'kinds': sorted(list(kinds)),
        'lifecycle_breakdown': lifecycle_breakdown
    }


def _create_evidence_index(evidence_array: List[Dict]) -> Dict[str, Dict]:
    """
    Create evidence index for fast lookup by downstream agents.
    
    Index structure:
    {
        "evidence-id": {
            "evidenceId": "...",
            "scannerName": "...",
            "kind": "...",
            "path": "...",
            "contentHash": "...",
            ... (all fields)
        }
    }
    
    Args:
        evidence_array: List of evidence records
        
    Returns:
        Dict mapping evidenceId -> evidence record
    """
    index = {}
    
    for record in evidence_array:
        evidence_id = record.get('evidenceId')
        if evidence_id:
            index[evidence_id] = record
    
    return index
