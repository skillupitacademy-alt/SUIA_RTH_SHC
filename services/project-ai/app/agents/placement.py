"""Placement manifest generation agent handler."""

import hashlib
from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import PlacementManifest, PlacementDecision, BlockFamily


async def execute_placement(context: AgentContext) -> AgentResult:
    """
    Execute placement manifest generation agent.
    
    Generates PlacementManifest with hash for candidate blocks:
    - Compares candidate to canonical blocks
    - Determines placement decision (ADD/UPDATE/EXTEND/REUSE/REJECT)
    - Generates manifest with tamper-proof hash
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with placement manifest
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract snapshot data (frozen, never re-read files)
        snapshot = context.repository_snapshot
        candidate_data = context.workflow_state.get('candidate', {})
        
        # Get classification from prior intake agent
        intake_result = context.prior_agent_outputs.get('intake')
        detected_family = BlockFamily.CUSTOM
        if intake_result and intake_result.outputs:
            family_str = intake_result.outputs.get('detected_family', 'Custom')
            detected_family = BlockFamily(family_str)
        
        # Generate placement decision
        decision = _determine_placement_decision(candidate_data, snapshot)
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_placement_evidence(candidate_data, snapshot)
        
        # Create manifest
        manifest = PlacementManifest(
            manifestId=f"manifest-{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}",
            candidateId=candidate_data.get('candidateId', 'unknown'),
            decision=decision,
            targetPath=_determine_target_path(candidate_data, decision),
            blockFamily=detected_family,
            blockVersion="1.0.0",
            requiredChanges=_determine_required_changes(decision),
            evidenceIds=evidence_ids,
            manifestHash="",  # Will be computed
            createdAt=datetime.now(UTC).isoformat()
        )
        
        # Compute manifest hash
        manifest_json = manifest.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        # Build outputs
        outputs = {
            'manifest': manifest.model_dump(),
            'decision': decision.value,
            'target_path': manifest.targetPath,
            'manifest_hash': manifest.manifestHash
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="placement",
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
            agent_id="placement",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[str(e)],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _determine_placement_decision(candidate: Dict[str, Any], snapshot: Dict[str, Any]) -> PlacementDecision:
    """
    Determine placement decision by comparing candidate to canonical blocks.
    
    Args:
        candidate: Candidate block data
        snapshot: Repository snapshot
        
    Returns:
        PlacementDecision
    """
    candidate_type = candidate.get('blockType', '').lower()
    blocks_data = snapshot.get('blocks', {})
    implementations = blocks_data.get('implementations', [])
    
    # Check if block type already exists
    existing = [impl for impl in implementations if impl.get('type', '').lower() == candidate_type]
    
    if existing:
        # Block exists - determine if update or reuse
        return PlacementDecision.UPDATE
    else:
        # New block - add
        return PlacementDecision.ADD


def _determine_target_path(candidate: Dict[str, Any], decision: PlacementDecision) -> str:
    """
    Determine target path for placement.
    
    NEVER infer from block name - use human-approved path or placeholder.
    
    Args:
        candidate: Candidate block data
        decision: Placement decision
        
    Returns:
        Target path string
    """
    # NEVER infer from candidateId
    # Use explicit path from candidate data or require human approval
    explicit_path = candidate.get('targetPath')
    if explicit_path:
        return explicit_path
    
    # Placeholder requiring human review
    return "REQUIRES_HUMAN_APPROVAL"


def _determine_required_changes(decision: PlacementDecision) -> List[str]:
    """
    Determine required changes based on placement decision.
    
    Args:
        decision: Placement decision
        
    Returns:
        List of required changes
    """
    if decision == PlacementDecision.ADD:
        return [
            "Add UBRC compliance",
            "Add brand independence",
            "Register in BLOCK_REGISTRY",
            "Create renderer component",
            "Add runtime dispatch case"
        ]
    elif decision == PlacementDecision.UPDATE:
        return [
            "Verify UBRC compliance maintained",
            "Verify brand independence maintained",
            "Update version number"
        ]
    else:
        return []


def _collect_placement_evidence(candidate: Dict[str, Any], snapshot: Dict[str, Any]) -> List[str]:
    """
    Collect evidence IDs related to placement.
    
    Args:
        candidate: Candidate block data
        snapshot: Repository snapshot
        
    Returns:
        List of evidence IDs
    """
    evidence_ids = []
    all_evidence = snapshot.get('evidence', [])
    
    # Find evidence for blocks and registry
    for evidence in all_evidence:
        kind = evidence.get('kind', '')
        path = evidence.get('path', '')
        if kind in ['type-definition', 'component'] or 'registry' in path.lower():
            evidence_ids.append(evidence.get('evidenceId', ''))
    
    return [eid for eid in evidence_ids if eid]  # No limit (Finding #6)
