"""Candidate intake and classification agent handler."""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily


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
    for impl in implementations[:5]:  # Limit to top 5
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
    
    return [eid for eid in evidence_ids if eid][:20]  # Limit to first 20
