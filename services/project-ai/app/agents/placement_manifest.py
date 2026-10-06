"""Placement manifest generation agent using canonical comparison."""

import hashlib
import json
from datetime import datetime, UTC
from typing import Any, Dict, List
from uuid import uuid4

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import (
    BlockFamily,
    CandidateFile,
    PlacementManifest,
    PlacementDecision
)
from app.placement.comparator import CanonicalComparator


async def execute_placement_manifest(context: AgentContext) -> AgentResult:
    """
    Execute placement manifest generation agent (Agent 07).
    
    Uses placement/comparator.py CanonicalComparator to compare candidate
    to canonical blocks:
    - Generates PlacementManifest with PlacementEntry list
    - Computes manifest_hash as SHA-256 of manifest content (JSON sorted keys)
    - Returns evidence_ids from canonical comparison
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with manifest (PlacementManifest) and evidence_ids
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get classification result from prior agent
        classification_result = context.prior_agent_outputs.get('classification')
        if not classification_result or not classification_result.passed:
            return AgentResult(
                agent_id="placement_manifest",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Classification agent did not pass or produce outputs"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Extract classification outputs
        family_str = classification_result.outputs.get('block_family')
        family = BlockFamily(family_str)
        confidence = classification_result.outputs.get('confidence', 0.0)
        
        # Get candidate data
        candidate_data = context.workflow_state.get('candidate', {})
        candidate_id = candidate_data.get('candidateId', str(uuid4()))
        candidate_files = _parse_candidate_files(candidate_data.get('files', []))
        
        # Initialize canonical comparator
        comparator = CanonicalComparator(context.repository_snapshot)
        
        # Extract features and compare to canonical
        features = comparator.extract_features(candidate_files)
        best_match, similarity_score, differences, evidence_ids = comparator.compare_to_canonical(
            features,
            family,
            candidate_files
        )
        
        # Determine placement decision
        decision = comparator.determine_placement_action(
            similarity_score,
            best_match,
            family
        )
        
        # Determine target path
        target_path = comparator.determine_target_path(
            decision,
            family,
            candidate_id,
            best_match
        )
        
        # Generate placement manifest
        manifest = _generate_placement_manifest(
            candidate_id=candidate_id,
            family=family,
            decision=decision,
            target_path=target_path,
            differences=differences,
            evidence_ids=evidence_ids,
            best_match=best_match
        )
        
        # Build outputs
        outputs = {
            'manifest': {
                'manifestId': manifest.manifestId,
                'candidateId': manifest.candidateId,
                'decision': manifest.decision.value,
                'targetPath': manifest.targetPath,
                'blockFamily': manifest.blockFamily.value,
                'blockVersion': manifest.blockVersion,
                'requiredChanges': manifest.requiredChanges,
                'evidenceIds': manifest.evidenceIds,
                'manifestHash': manifest.manifestHash,
                'createdAt': manifest.createdAt
            },
            'evidence_ids': evidence_ids,
            'similarity_score': similarity_score,
            'best_match': best_match
        }
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="placement_manifest",
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
            agent_id="placement_manifest",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Placement manifest generation failed: {str(e)}"],
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


def _generate_placement_manifest(
    candidate_id: str,
    family: BlockFamily,
    decision: PlacementDecision,
    target_path: str,
    differences: List[str],
    evidence_ids: List[str],
    best_match: str | None
) -> PlacementManifest:
    """
    Generate placement manifest with tamper-proof hash.
    
    Args:
        candidate_id: Candidate identifier
        family: Block family
        decision: Placement decision
        target_path: Target repository path
        differences: List of differences from canonical
        evidence_ids: Evidence IDs supporting decision
        best_match: Best matching canonical block ID
        
    Returns:
        PlacementManifest with computed manifest_hash
    """
    manifest_id = f"manifest-{candidate_id}-{uuid4().hex[:8]}"
    created_at = datetime.now(UTC).isoformat()
    
    # Generate required changes from differences
    required_changes = differences if differences else ["Add new block to repository"]
    
    # Block version (UBRC compliant)
    block_version = "1.0.0"
    
    # Build manifest data (excluding manifestHash)
    manifest_data = {
        "manifestId": manifest_id,
        "candidateId": candidate_id,
        "decision": decision.value,
        "targetPath": target_path,
        "blockFamily": family.value,
        "blockVersion": block_version,
        "requiredChanges": required_changes,
        "evidenceIds": evidence_ids,
        "createdAt": created_at
    }
    
    # Compute manifest hash (SHA-256 of sorted JSON)
    manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
    manifest_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    
    # Create PlacementManifest object
    manifest = PlacementManifest(
        manifestId=manifest_id,
        candidateId=candidate_id,
        decision=decision,
        targetPath=target_path,
        blockFamily=family,
        blockVersion=block_version,
        requiredChanges=required_changes,
        evidenceIds=evidence_ids,
        manifestHash=manifest_hash,
        createdAt=created_at
    )
    
    return manifest
