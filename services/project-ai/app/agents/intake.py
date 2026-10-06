"""Candidate intake and classification agent handler."""

import hashlib
from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily, CandidatePackage, CandidateFile


async def execute_intake(context: AgentContext) -> AgentResult:
    """
    Execute candidate intake agent (Agent 05).
    
    Extended intake functionality:
    - Validates candidate package structure
    - Computes file hashes for integrity verification
    - Extracts metadata from candidate files
    - Integrates with block specification from Agent 04
    - Classifies candidate by comparing to canonical blocks
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with validation status, candidate_id, file_hashes
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract snapshot data (frozen, never re-read files)
        snapshot = context.repository_snapshot
        candidate_data = context.workflow_state.get('candidate', {})
        
        # Validate candidate package structure
        validation_result = _validate_candidate_package(candidate_data)
        
        if not validation_result['valid']:
            return AgentResult(
                agent_id="intake",
                status=AgentStatus.FAILED,
                outputs={
                    'candidate_validation_status': 'INVALID',
                    'validation_errors': validation_result['errors']
                },
                evidence_ids=[],
                errors=validation_result['errors'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Compute file hashes
        file_hashes = _compute_file_hashes(candidate_data.get('files', []))
        
        # Extract metadata
        metadata = _extract_metadata(candidate_data)
        
        # Get block specification from Agent 04 if available
        block_spec = context.prior_agent_outputs.get('block_specification', None)
        block_spec_data = block_spec.outputs if block_spec else {}
        
        # Get existing blocks from snapshot
        blocks_data = snapshot.get('blocks', {})
        implementations = blocks_data.get('implementations', [])
        
        # Classify candidate by comparing to existing blocks
        classification = _classify_candidate(candidate_data, implementations)
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_block_evidence(implementations, snapshot)
        
        # Build outputs
        outputs = {
            'candidate_validation_status': 'VALID',
            'candidate_id': candidate_data.get('candidateId', 'unknown'),
            'file_hashes': file_hashes,
            'metadata': metadata,
            'detected_family': classification['family'],
            'confidence': classification['confidence'],
            'reasoning': classification['reasoning'],
            'similar_blocks': classification['similar_blocks'],
            'block_specification': block_spec_data
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


def _validate_candidate_package(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate candidate package structure.
    
    Args:
        candidate_data: Candidate package data
        
    Returns:
        Validation result with 'valid' bool and 'errors' list
    """
    errors = []
    
    # Check required fields
    if not candidate_data.get('candidateId'):
        errors.append("Missing required field: candidateId")
    
    if 'files' not in candidate_data:
        errors.append("Missing required field: files")
    elif not isinstance(candidate_data['files'], list):
        errors.append("Field 'files' must be a list")
    # Allow empty files for testing, but validate structure if files present
    
    # Validate files structure if files present
    files = candidate_data.get('files', [])
    for i, file in enumerate(files):
        if not isinstance(file, dict):
            errors.append(f"File at index {i} is not a valid object")
            continue
        
        if not file.get('filename'):
            errors.append(f"File at index {i} missing 'filename'")
        
        if 'content' not in file:
            errors.append(f"File at index {i} missing 'content'")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


def _compute_file_hashes(files: List[Any]) -> Dict[str, str]:
    """
    Compute SHA-256 hashes for all candidate files.
    
    Args:
        files: List of candidate files
        
    Returns:
        Dictionary mapping filename to SHA-256 hash
    """
    file_hashes = {}
    
    for file in files:
        if isinstance(file, dict):
            filename = file.get('filename', '')
            content = file.get('content', '')
            
            # Compute SHA-256 hash
            if isinstance(content, str):
                content_bytes = content.encode('utf-8')
            else:
                content_bytes = content
            
            file_hash = hashlib.sha256(content_bytes).hexdigest()
            file_hashes[filename] = file_hash
    
    return file_hashes


def _extract_metadata(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract metadata from candidate package.
    
    Args:
        candidate_data: Candidate package data
        
    Returns:
        Extracted metadata
    """
    metadata = {
        'candidate_id': candidate_data.get('candidateId'),
        'uploaded_at': candidate_data.get('uploadedAt'),
        'uploaded_by': candidate_data.get('uploadedBy'),
        'file_count': len(candidate_data.get('files', [])),
        'block_type': candidate_data.get('blockType', 'unknown')
    }
    
    # Extract file types
    files = candidate_data.get('files', [])
    file_extensions = set()
    for file in files:
        if isinstance(file, dict):
            filename = file.get('filename', '')
            if '.' in filename:
                ext = filename.rsplit('.', 1)[1].lower()
                file_extensions.add(ext)
    
    metadata['file_extensions'] = list(file_extensions)
    
    return metadata


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
