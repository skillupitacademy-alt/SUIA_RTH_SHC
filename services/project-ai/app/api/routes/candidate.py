"""Candidate Block intake and placement endpoints."""

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.models.candidate import (
    BlockFamily,
    CandidatePackage,
    CanonicalComparison,
    ClassificationResult,
    PlacementDecision,
    PlacementManifest,
)
from app.repository.discovery_client import DiscoveryClient

router = APIRouter(tags=["candidates"])

# In-memory storage for candidates and manifests (M3 foundation)
# TODO: Replace with persistent storage in production
_candidates_store: Dict[str, CandidatePackage] = {}
_manifests_store: Dict[str, PlacementManifest] = {}


def get_discovery_client() -> DiscoveryClient:
    """
    Dependency injection for discovery client.
    
    Reads TypeScript-generated snapshot for canonical comparison.
    """
    workspace_root = os.environ.get(
        'WORKSPACE_ROOT',
        'E:\\onlinewebsites\\quiz-platform'
    )
    snapshot_path = os.path.join(
        workspace_root,
        'packages',
        'project-llm-discovery',
        'output',
        'snapshot.json'
    )
    return DiscoveryClient(snapshot_path)


@router.post("/upload", response_model=Dict[str, Any])
async def upload_candidate(package: CandidatePackage):
    """
    Upload a candidate block package for evaluation.
    
    Args:
        package: Complete candidate package with files
        
    Returns:
        Confirmation with candidate ID
        
    Raises:
        400: If candidate ID already exists
    """
    if package.candidateId in _candidates_store:
        raise HTTPException(
            status_code=400,
            detail=f"Candidate {package.candidateId} already exists"
        )
    
    _candidates_store[package.candidateId] = package
    
    return {
        "status": "uploaded",
        "candidateId": package.candidateId,
        "filesCount": len(package.files),
        "uploadedAt": package.uploadedAt
    }


@router.post("/{candidate_id}/classify", response_model=ClassificationResult)
async def classify_candidate(candidate_id: str):
    """
    Classify candidate block family based on structural analysis.
    
    Analyzes HTML structure, attributes, and class names to detect
    block family with confidence scoring.
    
    Args:
        candidate_id: Unique candidate identifier
        
    Returns:
        Classification result with detected family and confidence
        
    Raises:
        404: If candidate not found
    """
    if candidate_id not in _candidates_store:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    package = _candidates_store[candidate_id]
    
    # Find HTML files for structural analysis
    html_files = [f for f in package.files if f.contentType == "text/html"]
    
    if not html_files:
        return ClassificationResult(
            candidateId=candidate_id,
            detectedFamily=BlockFamily.CUSTOM,
            confidence=0.5,
            reasoning="No HTML files found; defaulting to Custom family"
        )
    
    # Analyze first HTML file for classification signals
    html_content = html_files[0].content.lower()
    
    # Classification logic based on structural signals
    signals: Dict[BlockFamily, float] = {
        BlockFamily.INTRODUCTION: 0.0,
        BlockFamily.TUTORIAL: 0.0,
        BlockFamily.ASSESSMENT: 0.0,
        BlockFamily.MEDIA: 0.0,
        BlockFamily.SUMMARY: 0.0,
        BlockFamily.CUSTOM: 0.3,  # Base confidence for custom
    }
    
    # Introduction signals
    if 'data-block-type="introduction"' in html_content:
        signals[BlockFamily.INTRODUCTION] += 0.4
    if any(cls in html_content for cls in ['intro-', 'introduction-', 'welcome-']):
        signals[BlockFamily.INTRODUCTION] += 0.2
    if '<h1' in html_content and any(word in html_content for word in ['welcome', 'introduction', 'overview']):
        signals[BlockFamily.INTRODUCTION] += 0.2
    
    # Tutorial signals
    if 'data-block-type="tutorial"' in html_content:
        signals[BlockFamily.TUTORIAL] += 0.4
    if any(cls in html_content for cls in ['tutorial-', 'step-', 'lesson-']):
        signals[BlockFamily.TUTORIAL] += 0.2
    if 'data-step' in html_content or 'step-number' in html_content:
        signals[BlockFamily.TUTORIAL] += 0.2
    
    # Assessment signals
    if 'data-block-type="assessment"' in html_content:
        signals[BlockFamily.ASSESSMENT] += 0.4
    if any(cls in html_content for cls in ['quiz-', 'question-', 'assessment-', 'test-']):
        signals[BlockFamily.ASSESSMENT] += 0.2
    if 'data-question-id' in html_content or 'data-answer' in html_content:
        signals[BlockFamily.ASSESSMENT] += 0.2
    
    # Media signals
    if 'data-block-type="media"' in html_content:
        signals[BlockFamily.MEDIA] += 0.4
    if any(cls in html_content for cls in ['media-', 'video-', 'audio-', 'image-gallery']):
        signals[BlockFamily.MEDIA] += 0.2
    if any(tag in html_content for tag in ['<video', '<audio', '<iframe']):
        signals[BlockFamily.MEDIA] += 0.2
    
    # Summary signals
    if 'data-block-type="summary"' in html_content:
        signals[BlockFamily.SUMMARY] += 0.4
    if any(cls in html_content for cls in ['summary-', 'recap-', 'review-']):
        signals[BlockFamily.SUMMARY] += 0.2
    if any(word in html_content for word in ['key points', 'summary', 'recap', 'review']):
        signals[BlockFamily.SUMMARY] += 0.1
    
    # Determine highest confidence family
    detected_family = max(signals.keys(), key=lambda k: signals[k])
    confidence = min(signals[detected_family], 1.0)
    
    # Build reasoning
    reasoning_parts = []
    if signals[detected_family] > 0.5:
        reasoning_parts.append(f"Strong {detected_family.value} indicators detected")
    elif signals[detected_family] > 0.3:
        reasoning_parts.append(f"Moderate {detected_family.value} indicators detected")
    else:
        reasoning_parts.append(f"Weak signals; classified as {detected_family.value}")
    
    if 'data-block-type' in html_content:
        reasoning_parts.append("Explicit data-block-type attribute found")
    
    reasoning = "; ".join(reasoning_parts)
    
    return ClassificationResult(
        candidateId=candidate_id,
        detectedFamily=detected_family,
        confidence=confidence,
        reasoning=reasoning
    )


@router.post("/{candidate_id}/compare", response_model=CanonicalComparison)
async def compare_candidate(
    candidate_id: str,
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Compare candidate against canonical repository blocks.
    
    Reads authoritative TypeScript snapshot to compute evidence-backed
    similarity against existing blocks using structural analysis.
    
    Args:
        candidate_id: Unique candidate identifier
        client: Discovery client for snapshot access
        
    Returns:
        Comparison result with similarity score and differences
        
    Raises:
        404: If candidate not found or snapshot unavailable
    """
    if candidate_id not in _candidates_store:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    package = _candidates_store[candidate_id]
    
    # Load canonical snapshot
    try:
        snapshot = client.load_snapshot()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Canonical snapshot not found. Run TypeScript discovery scan first."
        )
    
    # Get classification for candidate
    classification = await classify_candidate(candidate_id)
    
    # Use evidence-backed comparator (Wave 2)
    from app.placement.comparator import CanonicalComparator
    
    comparator = CanonicalComparator(snapshot)
    
    # Extract structural features from candidate
    features = comparator.extract_features(package.files)
    
    # Compare to canonical blocks
    best_match, similarity_score, differences, evidence_ids = comparator.compare_to_canonical(
        features,
        classification.detectedFamily,
        package.files
    )
    
    # Store evidence IDs for manifest generation
    _candidates_store[candidate_id]._comparison_evidence_ids = evidence_ids
    
    return CanonicalComparison(
        candidateId=candidate_id,
        existingBlock=best_match,
        similarityScore=similarity_score,
        differences=differences
    )


@router.post("/{candidate_id}/manifest", response_model=PlacementManifest)
async def generate_manifest(
    candidate_id: str,
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Generate placement manifest for candidate block.
    
    Creates manifest with evidence-backed placement decision, target path,
    required changes, and SHA-256 hash for tamper detection.
    
    Args:
        candidate_id: Unique candidate identifier
        client: Discovery client for evidence access
        
    Returns:
        Placement manifest with decision and integration instructions
        
    Raises:
        404: If candidate not found
    """
    if candidate_id not in _candidates_store:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    # Get classification and comparison
    classification = await classify_candidate(candidate_id)
    comparison = await compare_candidate(candidate_id, client)
    
    # Use evidence-backed comparator for placement decision (Wave 2)
    from app.placement.comparator import CanonicalComparator
    
    try:
        snapshot = client.load_snapshot()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Canonical snapshot not found. Run TypeScript discovery scan first."
        )
    
    comparator = CanonicalComparator(snapshot)
    
    # Determine placement action based on evidence-backed similarity
    decision = comparator.determine_placement_action(
        comparison.similarityScore,
        comparison.existingBlock,
        classification.detectedFamily
    )
    
    # Determine target path from evidence
    target_path = comparator.determine_target_path(
        decision,
        classification.detectedFamily,
        candidate_id,
        comparison.existingBlock
    )
    
    # Build required changes based on decision
    if decision == PlacementDecision.UPDATE:
        required_changes = [
            "Review structural differences",
            "Update version metadata",
            "Run UBRC verification",
            "Update tests"
        ]
    elif decision == PlacementDecision.EXTEND:
        required_changes = [
            "Create new variant in family",
            "Link to family taxonomy",
            "Add UBRC metadata (data-block-version)",
            "Register in block registry",
            "Add to TutorialBlockRenderer dispatch"
        ]
    elif decision == PlacementDecision.ADD:
        required_changes = [
            "Create new block package",
            "Add UBRC metadata (data-block-version, data-block-type)",
            "Register in block registry",
            "Add to TutorialBlockRenderer dispatch",
            "Add unit tests",
            "Add to ILS taxonomy"
        ]
    elif decision == PlacementDecision.REJECT:
        required_changes = [
            "Candidate rejected due to low similarity",
            "Review structural differences",
            "Consider refactoring candidate"
        ]
    else:
        required_changes = ["No changes required"]
    
    # Use REAL evidence IDs from comparison (Wave 2 fix)
    # Get evidence IDs from stored comparison result
    evidence_ids = getattr(_candidates_store[candidate_id], '_comparison_evidence_ids', [])
    
    if not evidence_ids:
        # Fallback: try to find evidence from snapshot
        evidence_ids = []
        if comparison.existingBlock:
            blocks = snapshot.get('blocks', {}).get('verified', [])
            for block in blocks:
                if block.get('blockId') == comparison.existingBlock:
                    if 'evidenceId' in block:
                        evidence_ids.append(block['evidenceId'])
    
    # Create manifest
    manifest_id = f"manifest-{candidate_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    created_at = datetime.utcnow().isoformat() + "Z"
    
    # B07 fix: Extract target version from candidate binding/workflow
    # NOTE: In full workflow integration, candidate packages should carry
    # CandidateBinding with target_version from WorkflowTarget
    # The canonical attribute is 'target_version' based on CandidateBinding model
    target_version = getattr(package, 'target_version', None)
    
    if not target_version or target_version == '':
        # No valid version found - this indicates missing workflow binding
        # Use clear sentinel value that will fail validation if not caught upstream
        target_version = 'UNKNOWN_VERSION'
        # TODO Wave 3: Add schema validation at intake to enforce target_version presence
    
    manifest_data = {
        "manifestId": manifest_id,
        "candidateId": candidate_id,
        "decision": decision.value,
        "targetPath": target_path,
        "blockFamily": classification.detectedFamily.value,
        "blockVersion": target_version,
        "requiredChanges": required_changes,
        "evidenceIds": evidence_ids,
        "createdAt": created_at
    }
    
    # Compute SHA-256 hash of manifest content (sorted keys, no whitespace)
    manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
    manifest_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    
    manifest = PlacementManifest(
        manifestId=manifest_id,
        candidateId=candidate_id,
        decision=decision,
        targetPath=target_path,
        blockFamily=classification.detectedFamily,
        blockVersion=target_version,
        requiredChanges=required_changes,
        evidenceIds=evidence_ids,
        manifestHash=manifest_hash,
        createdAt=created_at
    )
    
    # Store manifest
    _manifests_store[candidate_id] = manifest
    
    return manifest


@router.get("/{candidate_id}/manifest", response_model=PlacementManifest)
async def get_manifest(candidate_id: str):
    """
    Retrieve previously generated placement manifest.
    
    Args:
        candidate_id: Unique candidate identifier
        
    Returns:
        Stored placement manifest
        
    Raises:
        404: If candidate or manifest not found
    """
    if candidate_id not in _candidates_store:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    if candidate_id not in _manifests_store:
        raise HTTPException(
            status_code=404,
            detail=f"No manifest found for candidate {candidate_id}. Generate one first."
        )
    
    return _manifests_store[candidate_id]


@router.get("", response_model=Dict[str, Any])
async def list_candidates():
    """
    List all uploaded candidate packages.
    
    Returns:
        Dictionary with candidate list and count
    """
    candidates = [
        {
            "candidateId": pkg.candidateId,
            "filesCount": len(pkg.files),
            "uploadedAt": pkg.uploadedAt,
            "uploadedBy": pkg.uploadedBy,
            "hasManifest": pkg.candidateId in _manifests_store
        }
        for pkg in _candidates_store.values()
    ]
    
    return {
        "count": len(candidates),
        "candidates": candidates
    }


@router.post("/{candidate_id}/execute", response_model=Dict[str, Any])
async def execute_placement(candidate_id: str):
    """
    Execute approved placement manifest for candidate block.
    
    SAFETY INVARIANTS:
    - Requires approved manifest (not self-approved)
    - Verifies manifest hash (rejects tampered manifests with 409)
    - Only executes approved repository/toolchain operations
    - Creates git branch and commit for approved changes
    - Triggers discovery refresh after placement
    
    Args:
        candidate_id: Unique candidate identifier
        
    Returns:
        Execution result with status, branch, commit, and evidence
        
    Raises:
        404: If candidate or manifest not found
        400: If manifest not approved
        409: If manifest has been tampered with (hash mismatch)
    """
    if candidate_id not in _candidates_store:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    if candidate_id not in _manifests_store:
        raise HTTPException(
            status_code=404,
            detail=f"No manifest found for candidate {candidate_id}. Generate one first."
        )
    
    package = _candidates_store[candidate_id]
    manifest = _manifests_store[candidate_id]
    
    # Check approval status (must query governance API)
    # For M3 foundation, we'll use a simple check
    # Production would call governance API to verify approval
    
    # Import governance models and executor
    from app.models.governance import ApprovalStatus
    from app.placement.executor import PlacementExecutor, PlacementExecutionError
    
    # SAFETY: Check if manifest has been approved
    # In production, this would query the governance API
    # For M3, we'll simulate by checking a stored approval status
    approval_status = getattr(manifest, '_approval_status', ApprovalStatus.PENDING)
    
    if approval_status != ApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute unapproved manifest. Status: {approval_status}. "
                   f"Submit manifest for approval via governance API first."
        )
    
    # Execute placement with safety checks
    workspace_root = os.environ.get('WORKSPACE_ROOT', 'E:\\onlinewebsites\\quiz-platform')
    executor = PlacementExecutor(workspace_root)
    
    try:
        result = executor.execute_placement(
            manifest,
            approval_status,
            package.files
        )
        
        # Trigger discovery refresh to update snapshot
        try:
            refresh_result = executor.trigger_discovery_refresh()
            result['discoveryRefresh'] = refresh_result
        except PlacementExecutionError as e:
            result['discoveryRefresh'] = {
                'status': 'warning',
                'message': f'Placement succeeded but discovery refresh failed: {str(e)}'
            }
        
        return result
        
    except PlacementExecutionError as e:
        # Check if it's a hash verification failure (409)
        if 'hash verification failed' in str(e).lower() or 'tampered' in str(e).lower():
            raise HTTPException(
                status_code=409,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Placement execution failed: {str(e)}"
            )


def _matches_family(name: str, family: BlockFamily) -> bool:
    """
    Helper to check if a name matches a block family.
    
    Args:
        name: Entity name to check
        family: Block family to match against
        
    Returns:
        True if name suggests it belongs to the family
    """
    family_keywords = {
        BlockFamily.INTRODUCTION: ['intro', 'introduction', 'welcome', 'overview'],
        BlockFamily.TUTORIAL: ['tutorial', 'lesson', 'step', 'guide'],
        BlockFamily.ASSESSMENT: ['quiz', 'test', 'assessment', 'exam', 'question'],
        BlockFamily.MEDIA: ['media', 'video', 'audio', 'gallery'],
        BlockFamily.SUMMARY: ['summary', 'recap', 'review', 'conclusion'],
        BlockFamily.CUSTOM: []
    }
    
    keywords = family_keywords.get(family, [])
    return any(keyword in name for keyword in keywords)
