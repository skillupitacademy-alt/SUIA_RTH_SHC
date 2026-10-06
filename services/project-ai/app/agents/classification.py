"""Classification agent for determining block family with confidence scoring."""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily, CandidateFile
from app.placement.comparator import CanonicalComparator


async def execute_classification(context: AgentContext) -> AgentResult:
    """
    Execute classification agent (Agent 06).
    
    Classifies candidate blocks into BlockFamily enum using structural features:
    - Extracts structural features from candidate files
    - Compares against canonical blocks in snapshot
    - Returns classification with confidence score (0.0-1.0)
    - Provides reasoning and evidence IDs for similar canonical blocks
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with block_family, confidence, reasoning, similar_canonical_blocks
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get candidate data from prior agent (intake)
        intake_result = context.prior_agent_outputs.get('intake')
        if not intake_result or not intake_result.passed:
            return AgentResult(
                agent_id="classification",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Intake agent did not pass or produce outputs"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        candidate_data = context.workflow_state.get('candidate', {})
        candidate_files = _parse_candidate_files(candidate_data.get('files', []))
        
        # Initialize canonical comparator with snapshot
        comparator = CanonicalComparator(context.repository_snapshot)
        
        # Extract structural features
        features = comparator.extract_features(candidate_files)
        
        # Classify based on structural features
        family, confidence, reasoning = _classify_by_features(features, candidate_data)
        
        # Find similar canonical blocks
        similar_blocks, evidence_ids = _find_similar_canonical_blocks(
            features,
            family,
            comparator,
            candidate_files
        )
        
        # Build outputs
        outputs = {
            'block_family': family.value,
            'confidence': confidence,
            'reasoning': reasoning,
            'similar_canonical_blocks': similar_blocks
        }
        
        # Determine status based on confidence
        status = AgentStatus.SUCCESS if confidence >= 0.6 else AgentStatus.FAILED
        errors = [] if confidence >= 0.6 else [
            f"Classification confidence {confidence:.2f} below threshold 0.6"
        ]
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="classification",
            status=status,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=errors,
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="classification",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Classification failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _parse_candidate_files(files_data: List[Any]) -> List[CandidateFile]:
    """
    Parse candidate files into CandidateFile objects.
    
    Args:
        files_data: List of file dictionaries
        
    Returns:
        List of CandidateFile objects
    """
    candidate_files = []
    
    for file_dict in files_data:
        if not isinstance(file_dict, dict):
            continue
        
        candidate_file = CandidateFile(
            filename=file_dict.get('filename', 'unknown'),
            content=file_dict.get('content', ''),
            contentType=file_dict.get('contentType', 'text/plain'),
            hash=file_dict.get('hash', '')
        )
        candidate_files.append(candidate_file)
    
    return candidate_files


def _classify_by_features(
    features: Any,
    candidate_data: Dict[str, Any]
) -> tuple[BlockFamily, float, str]:
    """
    Classify candidate into BlockFamily based on structural features.
    
    Args:
        features: Extracted structural features
        candidate_data: Candidate metadata
        
    Returns:
        Tuple of (BlockFamily, confidence, reasoning)
    """
    # Get block type hint from metadata
    block_type = candidate_data.get('blockType', '').lower()
    
    # Classification heuristics with confidence scoring
    
    # Assessment/Quiz detection
    if features.has_quiz_logic or 'quiz' in block_type or 'assessment' in block_type:
        confidence = 0.85
        if features.has_quiz_logic and 'quiz' in block_type:
            confidence = 0.95
        return (
            BlockFamily.ASSESSMENT,
            confidence,
            f"Detected quiz logic and assessment patterns. Block type: {block_type}"
        )
    
    # Media block detection
    if features.has_media_embed or 'media' in block_type or 'video' in block_type:
        confidence = 0.80
        if features.has_media_embed and 'media' in block_type:
            confidence = 0.92
        return (
            BlockFamily.MEDIA,
            confidence,
            f"Detected media embed elements. Block type: {block_type}"
        )
    
    # Tutorial detection
    if features.has_step_navigation or 'tutorial' in block_type or 'lesson' in block_type:
        confidence = 0.75
        if features.has_step_navigation and 'tutorial' in block_type:
            confidence = 0.90
        return (
            BlockFamily.TUTORIAL,
            confidence,
            f"Detected step navigation and tutorial patterns. Block type: {block_type}"
        )
    
    # Introduction detection
    if 'intro' in block_type or 'introduction' in block_type:
        confidence = 0.88
        return (
            BlockFamily.INTRODUCTION,
            confidence,
            f"Block type indicates introduction. Block type: {block_type}"
        )
    
    # Summary detection
    if 'summary' in block_type or 'recap' in block_type:
        confidence = 0.82
        return (
            BlockFamily.SUMMARY,
            confidence,
            f"Block type indicates summary/recap. Block type: {block_type}"
        )
    
    # Structural analysis fallback
    if features.has_typescript and features.has_styles:
        # Well-structured block but no clear family
        confidence = 0.65
        return (
            BlockFamily.CUSTOM,
            confidence,
            f"Well-structured TypeScript block with no clear family match. Block type: {block_type}"
        )
    
    # Low confidence default
    return (
        BlockFamily.CUSTOM,
        0.50,
        f"No clear family match, classified as custom. Block type: {block_type}"
    )


def _find_similar_canonical_blocks(
    features: Any,
    family: BlockFamily,
    comparator: CanonicalComparator,
    candidate_files: List[CandidateFile]
) -> tuple[List[str], List[str]]:
    """
    Find similar canonical blocks from snapshot.
    
    Args:
        features: Extracted structural features
        family: Detected block family
        comparator: Canonical comparator instance
        candidate_files: Candidate files
        
    Returns:
        Tuple of (similar_block_ids, evidence_ids)
    """
    # Use comparator to find similar blocks
    best_match, similarity_score, differences, evidence_ids = comparator.compare_to_canonical(
        features,
        family,
        candidate_files
    )
    
    similar_blocks = []
    if best_match:
        similar_blocks.append(best_match)
    
    return (similar_blocks, evidence_ids)
