"""Candidate intake and classification agent handler."""

import hashlib
from datetime import datetime, UTC
from typing import Any, Dict, List
from pydantic import BaseModel, Field

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily


class CandidateManifest(BaseModel):
    """
    Manifest that binds a candidate to its engineering contract.
    
    This ensures candidates are traceable to their source workflow and contract,
    enabling integrity verification and preventing contract drift.
    """
    workflow_id: str = Field(..., description="Workflow that requested this candidate")
    contract_id: str = Field(..., description="Engineering contract identifier")
    contract_hash: str = Field(..., description="SHA-256 hash of the engineering contract")
    target: dict = Field(..., description="Target specification (family, version, block_type)")


class CandidateIntegrityError(Exception):
    """Raised when candidate integrity verification fails."""
    pass


async def execute_intake(context: AgentContext) -> AgentResult:
    """
    Execute candidate intake and classification agent.
    
    Classifies candidate blocks by comparing to canonical repository blocks:
    - Detects block family (Introduction, Tutorial, Assessment, etc.)
    - Compares structural features
    - Identifies similarities with existing blocks
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with classification outputs
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract snapshot data (frozen, never re-read files)
        snapshot = context.repository_snapshot
        candidate_data = context.workflow_state.get('candidate', {})
        
        # Get existing blocks from snapshot
        blocks_data = snapshot.get('blocks', {})
        implementations = blocks_data.get('implementations', [])
        
        # Classify candidate by comparing to existing blocks
        classification = _classify_candidate(candidate_data, implementations)
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_block_evidence(implementations, snapshot)
        
        # Build outputs
        outputs = {
            'candidate_id': candidate_data.get('candidateId', 'unknown'),
            'detected_family': classification['family'],
            'confidence': classification['confidence'],
            'reasoning': classification['reasoning'],
            'similar_blocks': classification['similar_blocks']
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="intake",
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
            agent_id="intake",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[str(e)],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _classify_candidate(candidate: Dict[str, Any], implementations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Classify candidate block by comparing to existing implementations.
    
    Uses simple heuristics based on block type names and structure.
    
    Args:
        candidate: Candidate block data
        implementations: List of existing block implementations
        
    Returns:
        Classification result with family, confidence, and reasoning
    """
    # Extract candidate type/name
    candidate_type = candidate.get('blockType', '').lower()
    candidate_files = candidate.get('files', [])
    
    # Heuristics for family classification
    if 'introduction' in candidate_type or 'intro' in candidate_type:
        family = BlockFamily.INTRODUCTION
        confidence = 0.9
        reasoning = "Block type name indicates introduction"
    elif 'quiz' in candidate_type or 'assessment' in candidate_type or 'question' in candidate_type:
        family = BlockFamily.ASSESSMENT
        confidence = 0.85
        reasoning = "Block type name indicates assessment"
    elif 'media' in candidate_type or 'video' in candidate_type or 'image' in candidate_type:
        family = BlockFamily.MEDIA
        confidence = 0.8
        reasoning = "Block type name indicates media"
    elif 'summary' in candidate_type or 'recap' in candidate_type:
        family = BlockFamily.SUMMARY
        confidence = 0.8
        reasoning = "Block type name indicates summary"
    elif 'tutorial' in candidate_type or 'lesson' in candidate_type:
        family = BlockFamily.TUTORIAL
        confidence = 0.75
        reasoning = "Block type name indicates tutorial"
    else:
        family = BlockFamily.CUSTOM
        confidence = 0.5
        reasoning = "No clear family match, classified as custom"
    
    # Find similar blocks
    similar_blocks = []
    for impl in implementations:  # No limit (Finding #6)
        impl_type = impl.get('type', '').lower()
        if candidate_type and impl_type and candidate_type in impl_type:
            similar_blocks.append({
                'type': impl.get('type'),
                'path': impl.get('implementationPath'),
                'similarity': 0.7  # Simplified similarity score
            })
    
    return {
        'family': family.value,
        'confidence': confidence,
        'reasoning': reasoning,
        'similar_blocks': similar_blocks
    }


def _collect_block_evidence(implementations: List[Dict[str, Any]], snapshot: Dict[str, Any]) -> List[str]:
    """
    Collect evidence IDs related to block implementations.
    
    Args:
        implementations: List of block implementations
        snapshot: Repository snapshot
        
    Returns:
        List of evidence IDs
    """
    evidence_ids = []
    all_evidence = snapshot.get('evidence', [])
    
    # Find evidence for type definitions and components
    for evidence in all_evidence:
        kind = evidence.get('kind', '')
        if kind in ['type-definition', 'component']:
            evidence_ids.append(evidence.get('evidenceId', ''))
    
    return [eid for eid in evidence_ids if eid]  # No limit (Finding #6)


def sha256_file(path: str) -> str:
    """
    Calculate SHA-256 hash of a file.
    
    Args:
        path: Path to the file
        
    Returns:
        64-character hex string (SHA-256)
    """
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def verify_candidate_integrity(
    manifest: CandidateManifest,
    candidate_path: str,
    stored_contract_hash: str
) -> None:
    """
    Server-side integrity check for candidate submissions.
    
    This function enforces the principle: NEVER trust client-declared hashes.
    All verification is performed server-side using stored contract data.
    
    Args:
        manifest: Candidate manifest from submission
        candidate_path: Path to candidate files (for future file hash verification)
        stored_contract_hash: Contract hash from server-side contract store
        
    Raises:
        CandidateIntegrityError: If any integrity check fails
        
    Note:
        This addresses Wave 3 requirement for contract binding and tamper detection.
    """
    # 1. Verify contract_hash matches stored contract (not just client-declared)
    if manifest.contract_hash != stored_contract_hash:
        raise CandidateIntegrityError(
            f"Contract hash mismatch: candidate declares {manifest.contract_hash!r} "
            f"but server has {stored_contract_hash!r} for contract {manifest.contract_id!r}"
        )
    
    # 2. Verify target binding is complete
    if not manifest.target.get('family'):
        raise CandidateIntegrityError("Manifest missing target.family")
    
    if not manifest.target.get('version'):
        raise CandidateIntegrityError("Manifest missing target.version")
    
    # 3. Verify workflow_id and contract_id are present
    if not manifest.workflow_id:
        raise CandidateIntegrityError("Manifest missing workflow_id")
    
    if not manifest.contract_id:
        raise CandidateIntegrityError("Manifest missing contract_id")
    
    # Future extension: verify file hashes within candidate_path
    # This would involve checking each file's SHA-256 against a declared manifest
