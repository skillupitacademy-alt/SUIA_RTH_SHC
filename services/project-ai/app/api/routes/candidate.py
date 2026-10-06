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


@router.post("/upload", response_model=Dict[str, str])
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
    
    Reads authoritative TypeScript snapshot to compute similarity
    against existing blocks.
    
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
    
    # Find existing blocks of same family in snapshot
    # Look for blocks in applications/packages that match the family
    existing_blocks = []
    
    # Search in applications
    for app in snapshot.get('applications', []):
        app_name = app.get('name', '').lower()
        if _matches_family(app_name, classification.detectedFamily):
            existing_blocks.append({
                'id': app.get('name'),
                'type': 'application',
                'name': app.get('name')
            })
    
    # Search in packages
    for pkg in snapshot.get('packages', []):
        pkg_name = pkg.get('name', '').lower()
        if _matches_family(pkg_name, classification.detectedFamily):
            existing_blocks.append({
                'id': pkg.get('name'),
                'type': 'package',
                'name': pkg.get('name')
            })
    
    # Compute similarity
    if not existing_blocks:
        return CanonicalComparison(
            candidateId=candidate_id,
            existingBlock=None,
            similarityScore=0.0,
            differences=["No existing blocks found of same family"]
        )
    
    # For M3 foundation, use simple heuristic similarity
    # TODO: Implement deeper structural comparison in M3+
    best_match = existing_blocks[0]
    similarity_score = 0.6  # Base similarity for family match
    
    differences = [
        f"Candidate is new {classification.detectedFamily.value} block",
        f"Most similar to existing block: {best_match['name']}",
        "Detailed structural comparison pending M3+ enhancement"
    ]
    
    return CanonicalComparison(
        candidateId=candidate_id,
        existingBlock=best_match['id'],
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
    
    Creates manifest with placement decision, target path,
    required changes, and SHA-256 hash.
    
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
    
    # Determine placement decision based on similarity
    if comparison.similarityScore > 0.8:
        decision = PlacementDecision.UPDATE
        target_path = f"apps/blocks/{comparison.existingBlock}"
        required_changes = ["Review structural differences", "Update version metadata"]
    elif comparison.similarityScore > 0.5:
        decision = PlacementDecision.EXTEND
        target_path = f"apps/blocks/{classification.detectedFamily.value.lower()}/{candidate_id}"
        required_changes = ["Create new variant", "Link to family", "Add UBRC metadata"]
    else:
        decision = PlacementDecision.ADD
        target_path = f"apps/blocks/{classification.detectedFamily.value.lower()}/{candidate_id}"
        required_changes = ["Create new block", "Add UBRC metadata", "Register in block registry"]
    
    # Generate evidence IDs (link to discovery evidence)
    evidence_ids = [f"candidate-{candidate_id}-classification", f"candidate-{candidate_id}-comparison"]
    
    # Create manifest
    manifest_id = f"manifest-{candidate_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    created_at = datetime.utcnow().isoformat() + "Z"
    
    manifest_data = {
        "manifestId": manifest_id,
        "candidateId": candidate_id,
        "decision": decision.value,
        "targetPath": target_path,
        "blockFamily": classification.detectedFamily.value,
        "blockVersion": "1.0.0",  # Initial version for new blocks
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
        blockVersion="1.0.0",
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
