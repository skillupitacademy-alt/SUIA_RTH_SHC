"""
Final Evidence Freeze Agent (Agent 13).

Aggregates all evidence from prior agents (foundation + candidate pipeline + gate results).
Validates evidence binding to commit_sha + snapshot_hash.
Checks for orphaned evidence and duplicate IDs.
Freezes final evidence set for certification.
"""

from dataclasses import dataclass
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Set
import subprocess

from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentResult, AgentStatus


@dataclass
class EvidenceValidation:
    """Evidence validation result."""
    total_evidence_count: int
    unique_evidence_ids: List[str]
    duplicate_ids: List[str]
    orphaned_ids: List[str]
    binding_valid: bool
    binding_errors: List[str]
    commit_sha: str
    snapshot_hash: str


async def execute_final_evidence_freeze(context: AgentContext) -> AgentResult:
    """
    Execute final evidence freeze agent (Agent 13).
    
    Aggregates all evidence from prior agents and validates:
    - All evidence IDs are unique (no duplicates)
    - No orphaned evidence (all evidence referenced exists in snapshot)
    - Evidence binding to commit_sha + snapshot_hash is valid
    - Total evidence count matches expectations
    
    Args:
        context: Agent execution context with snapshot and prior agent outputs
        
    Returns:
        AgentResult with validation status and evidence summary
    """
    start_time = datetime.now(UTC)
    
    try:
        # Derive commit SHA from git
        commit_sha = _derive_commit_sha(context.repository_root)
        
        # Derive snapshot hash from context
        snapshot_hash = context.repository_snapshot.get('canonicalHash', 'unknown')
        
        # Aggregate evidence IDs from all prior agents
        all_evidence_ids: List[str] = []
        for agent_id, agent_result in context.prior_agent_outputs.items():
            if agent_result.evidence_ids:
                all_evidence_ids.extend(agent_result.evidence_ids)
        
        # Get snapshot evidence (don't add to all_evidence_ids, use for validation only)
        snapshot_evidence = context.repository_snapshot.get('evidence', [])
        snapshot_evidence_ids = [e.get('evidenceId', '') for e in snapshot_evidence if e.get('evidenceId')]
        
        # Validate evidence
        validation = _validate_evidence(
            evidence_ids=all_evidence_ids,
            snapshot=context.repository_snapshot,
            snapshot_evidence_ids=snapshot_evidence_ids,
            commit_sha=commit_sha,
            snapshot_hash=snapshot_hash
        )
        
        # Determine status based on validation
        if not validation.binding_valid:
            status = AgentStatus.FAILED
            errors = validation.binding_errors
        elif validation.duplicate_ids or validation.orphaned_ids:
            status = AgentStatus.FAILED
            errors = []
            if validation.duplicate_ids:
                errors.append(f"Duplicate evidence IDs detected: {', '.join(validation.duplicate_ids[:5])}")
            if validation.orphaned_ids:
                errors.append(f"Orphaned evidence IDs detected: {', '.join(validation.orphaned_ids[:5])}")
        else:
            status = AgentStatus.SUCCESS
            errors = []
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="final_evidence_freeze",
            status=status,
            outputs={
                'total_evidence_count': validation.total_evidence_count,
                'unique_evidence_count': len(validation.unique_evidence_ids),
                'binding_valid': validation.binding_valid,
                'all_evidence_ids': validation.unique_evidence_ids,
                'commit_sha': validation.commit_sha,
                'snapshot_hash': validation.snapshot_hash,
                'duplicate_count': len(validation.duplicate_ids),
                'orphaned_count': len(validation.orphaned_ids)
            },
            evidence_ids=validation.unique_evidence_ids,
            errors=errors,
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="final_evidence_freeze",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Final evidence freeze failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _derive_commit_sha(repository_root: Path) -> str:
    """
    Derive current git commit SHA.
    
    Args:
        repository_root: Repository root path
        
    Returns:
        Git commit SHA (full 40-character hash)
    """
    try:
        result = subprocess.run(
            ['git', 'rev-parse', 'HEAD'],
            cwd=str(repository_root),
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return 'unknown'
    
    except Exception:
        return 'unknown'


def _validate_evidence(
    evidence_ids: List[str],
    snapshot: Dict[str, Any],
    snapshot_evidence_ids: List[str],
    commit_sha: str,
    snapshot_hash: str
) -> EvidenceValidation:
    """
    Validate evidence set for completeness and binding.
    
    Args:
        evidence_ids: List of all evidence IDs collected
        snapshot: Repository snapshot
        commit_sha: Expected commit SHA
        snapshot_hash: Expected snapshot hash
        
    Returns:
        EvidenceValidation with complete validation results
    """
    binding_errors: List[str] = []
    
    # Check snapshot binding
    snapshot_commit = snapshot.get('repository', {}).get('commitSha', '')
    if snapshot_commit != commit_sha:
        binding_errors.append(
            f"Snapshot commit SHA mismatch: snapshot={snapshot_commit}, current={commit_sha}"
        )
    
    snapshot_hash_actual = snapshot.get('canonicalHash', '')
    if snapshot_hash_actual != snapshot_hash:
        binding_errors.append(
            f"Snapshot hash mismatch: snapshot={snapshot_hash_actual}, expected={snapshot_hash}"
        )
    
    # Detect duplicates
    seen_ids: Set[str] = set()
    duplicate_ids: List[str] = []
    
    for eid in evidence_ids:
        if not eid:  # Skip empty strings
            continue
        if eid in seen_ids:
            if eid not in duplicate_ids:
                duplicate_ids.append(eid)
        else:
            seen_ids.add(eid)
    
    # Get snapshot evidence for orphan detection
    snapshot_evidence_set = set(snapshot_evidence_ids)
    
    # Detect orphaned evidence (referenced but not in snapshot)
    orphaned_ids: List[str] = []
    for eid in seen_ids:
        if eid not in snapshot_evidence_set:
            orphaned_ids.append(eid)
    
    # Build validation result
    unique_evidence_ids = list(seen_ids)
    binding_valid = len(binding_errors) == 0
    
    return EvidenceValidation(
        total_evidence_count=len(evidence_ids),
        unique_evidence_ids=unique_evidence_ids,
        duplicate_ids=duplicate_ids,
        orphaned_ids=orphaned_ids,
        binding_valid=binding_valid,
        binding_errors=binding_errors,
        commit_sha=commit_sha,
        snapshot_hash=snapshot_hash
    )
