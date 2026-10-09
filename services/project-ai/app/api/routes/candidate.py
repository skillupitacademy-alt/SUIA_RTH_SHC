"""Candidate Block intake and placement endpoints.

M2.9 R3 PERSISTENCE:
- Candidates persisted to PostgreSQL via CandidateRepository
- Manifests persisted to PostgreSQL via ManifestRepository
- Approvals persisted to PostgreSQL via ApprovalRepository
- All operations async with proper transaction management
"""

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.types import AuthenticatedPrincipal
from app.models.candidate import (
    BlockFamily,
    CandidatePackage,
    CanonicalComparison,
    ClassificationResult,
    PlacementDecision,
    PlacementManifest,
)
from app.models.implementation_approval import ImplementationApproval
from app.placement.approval_enforcer import ApprovalEnforcer
from app.repository.discovery_client import DiscoveryClient
from app.persistence import (
    get_db_session,
    get_candidate_repository,
    get_manifest_repository,
    get_approval_repository,
    CandidateRepository,
    ManifestRepository,
    ApprovalRepository,
    CandidateModel,
    ManifestModel,
    ApprovalModel,
)

router = APIRouter(tags=["candidates"])


# ============================================================================
# Domain Model <-> ORM Mappers
# ============================================================================

def candidate_to_model(package: CandidatePackage) -> CandidateModel:
    """Convert domain CandidatePackage to ORM CandidateModel."""
    return CandidateModel(
        candidate_id=package.candidateId,
        workflow_id=package.workflow_id,
        files=[{
            "filename": f.filename,
            "content": f.content,
            "contentType": f.contentType
        } for f in package.files],
        uploaded_at=datetime.fromisoformat(package.uploadedAt.replace('Z', '+00:00')) if isinstance(package.uploadedAt, str) else package.uploadedAt,
        uploaded_by=package.uploadedBy,
        target_family=package.target_family or "",
        target_version=package.target_version or "",
        candidate_sha256=""  # Computed by repository
    )


def model_to_candidate(model: CandidateModel) -> CandidatePackage:
    """Convert ORM CandidateModel to domain CandidatePackage."""
    from app.models.candidate import CandidateFile
    
    files = [CandidateFile(
        filename=f["filename"],
        content=f["content"],
        contentType=f["contentType"]
    ) for f in model.files]
    
    uploaded_at_str = model.uploaded_at.isoformat()
    if not uploaded_at_str.endswith('Z'):
        uploaded_at_str += 'Z'
    
    return CandidatePackage(
        candidateId=model.candidate_id,
        files=files,
        uploadedAt=uploaded_at_str,
        uploadedBy=model.uploaded_by,
        workflow_id=model.workflow_id,
        target_family=model.target_family,
        target_version=model.target_version
    )


def manifest_to_model(manifest: PlacementManifest, candidate_id: str) -> ManifestModel:
    """Convert domain PlacementManifest to ORM ManifestModel."""
    return ManifestModel(
        manifest_id=manifest.manifestId,
        candidate_id=candidate_id,
        manifest_hash=manifest.manifestHash,
        decision=manifest.decision.value,
        target_path=manifest.targetPath,
        block_family=manifest.blockFamily.value,
        block_version=manifest.blockVersion,
        required_changes=manifest.requiredChanges,
        evidence_ids=manifest.evidenceIds,
        created_at=datetime.fromisoformat(manifest.createdAt.replace('Z', '+00:00')) if isinstance(manifest.createdAt, str) else manifest.createdAt
    )


def model_to_manifest(model: ManifestModel) -> PlacementManifest:
    """Convert ORM ManifestModel to domain PlacementManifest."""
    created_at_str = model.created_at.isoformat()
    if not created_at_str.endswith('Z'):
        created_at_str += 'Z'
    
    return PlacementManifest(
        manifestId=model.manifest_id,
        candidateId=model.candidate_id,
        decision=PlacementDecision(model.decision),
        targetPath=model.target_path,
        blockFamily=BlockFamily(model.block_family),
        blockVersion=model.block_version,
        requiredChanges=model.required_changes,
        evidenceIds=model.evidence_ids,
        manifestHash=model.manifest_hash,
        createdAt=created_at_str
    )


def approval_to_model(approval: ImplementationApproval) -> ApprovalModel:
    """Convert domain ImplementationApproval to ORM ApprovalModel."""
    return ApprovalModel(
        approval_id=approval.approval_id,
        workflow_id=approval.workflow_id,
        candidate_sha256=approval.candidate_sha256,
        placement_manifest_id=approval.placement_manifest_id,
        placement_manifest_sha256=approval.placement_manifest_sha256,
        target_family=approval.target_family,
        target_version=approval.target_version,
        approved_by=approval.approved_by,
        approval_timestamp=approval.approval_timestamp,
        status=approval.status.value,
        workflow_requester=approval.workflow_requester or "",
        evidence=approval.to_evidence_dict(),
        rejection_reason=approval.rejection_reason
    )


def model_to_approval(model: ApprovalModel) -> ImplementationApproval:
    """Convert ORM ApprovalModel to domain ImplementationApproval."""
    from app.models.implementation_approval import ImplementationApprovalStatus
    
    return ImplementationApproval(
        approval_id=model.approval_id,
        workflow_id=model.workflow_id,
        candidate_sha256=model.candidate_sha256,
        placement_manifest_id=model.placement_manifest_id,
        placement_manifest_sha256=model.placement_manifest_sha256,
        target_family=model.target_family,
        target_version=model.target_version,
        approved_by=model.approved_by,
        approval_timestamp=model.approval_timestamp,
        status=ImplementationApprovalStatus(model.status),
        workflow_requester=model.workflow_requester,
        rejection_reason=model.rejection_reason
    )


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
async def upload_candidate(
    package: CandidatePackage,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Upload a candidate block package for evaluation.
    
    Wave 1A: Binds candidate to workflow and retrieves target identity.
    Wave 3A: Verifies workflow state, computes SHA-256, validates package, transitions state.
    M2.9 R3: Persists candidate to PostgreSQL via CandidateRepository.
    
    Args:
        package: Complete candidate package with files and workflow_id
        
    Returns:
        Confirmation with candidate ID and workflow target binding
        
    Raises:
        400: If candidate ID already exists, workflow_id missing, or package validation fails
        404: If workflow not found
        409: If workflow not in CANDIDATE_REQUESTED state
        422: If target family/version mismatch
    """
    # Check if candidate already exists
    existing = await candidate_repo.get(package.candidateId)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Candidate {package.candidateId} already exists"
        )
    
    # Wave 1A: Enforce workflow binding at upload
    if not package.workflow_id:
        raise HTTPException(
            status_code=400,
            detail="workflow_id is required for candidate upload. "
                   "Candidates must be bound to a workflow for target identity."
        )
    
    # Retrieve workflow to get target binding
    from app.api.routes.workflows import get_governance_service
    from app.orchestration.canonical_workflow import CanonicalWorkflowState
    
    governance_service = await get_governance_service(session)
    workflow = await governance_service.get_workflow(package.workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=404,
            detail=f"Workflow not found: {package.workflow_id}"
        )
    
    # Wave 3A: Verify workflow state is CANDIDATE_REQUESTED
    if workflow.current_state != CanonicalWorkflowState.CANDIDATE_REQUESTED:
        raise HTTPException(
            status_code=409,
            detail=f"Workflow state must be CANDIDATE_REQUESTED for upload. "
                   f"Current state: {workflow.current_state.value}"
        )
    
    # Bind candidate to workflow target
    # Wave 1A: Validate that workflow has non-empty target binding (fail fast)
    if workflow.target_family is None or not workflow.target_family or workflow.target_family.strip() == '':
        raise HTTPException(
            status_code=400,
            detail=f"Workflow {package.workflow_id} has empty target_family. "
                   "Cannot bind candidate to workflow without valid target identity."
        )
    
    if workflow.target_version is None or not workflow.target_version or workflow.target_version.strip() == '':
        raise HTTPException(
            status_code=400,
            detail=f"Workflow {package.workflow_id} has empty target_version. "
                   "Cannot bind candidate to workflow without valid target identity."
        )
    
    # Wave 3A: Validate target match if package specifies target
    if package.target_family and package.target_family != workflow.target_family:
        raise HTTPException(
            status_code=422,
            detail=f"Target family mismatch: package specifies '{package.target_family}', "
                   f"but workflow requires '{workflow.target_family}'"
        )
    
    if package.target_version and package.target_version != workflow.target_version:
        raise HTTPException(
            status_code=422,
            detail=f"Target version mismatch: package specifies '{package.target_version}', "
                   f"but workflow requires '{workflow.target_version}'"
        )
    
    package.target_family = workflow.target_family
    package.target_version = workflow.target_version
    
    # Wave 3A: Package validation - must happen before state transition
    validation_errors = _validate_package(package)
    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail=f"Package validation failed: {'; '.join(validation_errors)}"
        )
    
    # Wave 3A: Calculate SHA-256 server-side (never trust client)
    try:
        candidate_sha256 = _compute_candidate_sha256(package.files)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Package validation failed: {str(e)}"
        )
    package.contract_sha256 = candidate_sha256
    
    # Persist to PostgreSQL
    try:
        candidate_model = candidate_to_model(package)
        # Ensure SHA-256 is stored in model
        candidate_model.candidate_sha256 = candidate_sha256
        await candidate_repo.upsert(candidate_model)
        
        # Wave 3A: Bind candidate artifact to workflow and transition state atomically
        # If transition fails, bind_artifact should be rolled back via session.rollback()
        try:
            await governance_service.bind_artifact(
                workflow_id=package.workflow_id,
                artifact_type="candidate",
                artifact_id=package.candidateId,
                artifact_sha256=candidate_sha256
            )
            
            # Wave 3A: Transition workflow state to CANDIDATE_RECEIVED
            await governance_service.transition_state(
                workflow_id=package.workflow_id,
                to_state=CanonicalWorkflowState.CANDIDATE_RECEIVED,
                triggered_by=user.get("user_id", "unknown"),
                evidence_id=f"upload-{package.candidateId}",
                reason=f"Candidate package uploaded: {len(package.files)} files, SHA-256: {candidate_sha256[:16]}..."
            )
        except Exception as transition_error:
            # Rollback the entire transaction including bind_artifact
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to bind artifact or transition workflow state: {str(transition_error)}"
            )
        
        await session.commit()
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store candidate: {str(e)}"
        )
    
    return {
        "status": "uploaded",
        "candidateId": package.candidateId,
        "workflow_id": package.workflow_id,
        "target_family": package.target_family,
        "target_version": package.target_version,
        "contract_sha256": candidate_sha256,
        "filesCount": len(package.files),
        "uploadedAt": package.uploadedAt
    }


@router.post("/{candidate_id}/classify", response_model=ClassificationResult)
async def classify_candidate(
    candidate_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository)
):
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
    candidate_model = await candidate_repo.get(candidate_id)
    if not candidate_model:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    package = model_to_candidate(candidate_model)
    
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
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository),
    session: AsyncSession = Depends(get_db_session),
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
    candidate_model = await candidate_repo.get(candidate_id)
    if not candidate_model:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    package = model_to_candidate(candidate_model)
    
    # Load canonical snapshot
    try:
        snapshot = client.load_snapshot()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Canonical snapshot not found. Run TypeScript discovery scan first."
        )
    
    # Get classification for candidate
    classification = await classify_candidate(candidate_id, candidate_repo)
    
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
    
    # Store evidence IDs in candidate metadata (update candidate model)
    # Store as JSON in a metadata field or as a separate relationship
    # For now, store in-memory on the domain object for manifest generation
    # This is a temporary workaround - ideally we'd have a metadata JSON column
    package._comparison_evidence_ids = evidence_ids
    
    return CanonicalComparison(
        candidateId=candidate_id,
        existingBlock=best_match,
        similarityScore=similarity_score,
        differences=differences
    )


@router.post("/{candidate_id}/manifest", response_model=PlacementManifest)
async def generate_manifest(
    candidate_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository),
    manifest_repo: ManifestRepository = Depends(get_manifest_repository),
    session: AsyncSession = Depends(get_db_session),
    client: DiscoveryClient = Depends(get_discovery_client)
):
    """
    Generate placement manifest for candidate block.
    
    Creates manifest with evidence-backed placement decision, target path,
    required changes, and SHA-256 hash for tamper detection.
    M2.9 R3: Persists manifest to PostgreSQL via ManifestRepository.
    
    Args:
        candidate_id: Unique candidate identifier
        client: Discovery client for evidence access
        
    Returns:
        Placement manifest with decision and integration instructions
        
    Raises:
        404: If candidate not found
    """
    candidate_model = await candidate_repo.get(candidate_id)
    if not candidate_model:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    package = model_to_candidate(candidate_model)
    
    # Get classification and comparison
    classification = await classify_candidate(candidate_id, candidate_repo)
    comparison = await compare_candidate(candidate_id, candidate_repo, session, client)
    
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
    evidence_ids = getattr(package, '_comparison_evidence_ids', [])
    
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
    manifest_id = f"manifest-{candidate_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    created_at = datetime.now(timezone.utc).isoformat() + "Z"
    
    # B07 fix: Extract target version from workflow binding (Wave 1A)
    # Candidate packages now carry target_version from workflow at upload
    target_version = package.target_version
    
    if not target_version or target_version == '':
        # Missing version indicates upload occurred before Wave 1A workflow binding
        raise HTTPException(
            status_code=400,
            detail=f"Candidate {candidate_id} missing target_version binding. "
                   "This candidate was uploaded before workflow binding was implemented. "
                   "Delete this candidate and upload again with workflow_id to bind target identity."
        )
    
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
    
    # Persist manifest to PostgreSQL
    try:
        manifest_model = manifest_to_model(manifest, candidate_id)
        await manifest_repo.upsert(manifest_model)
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store manifest: {str(e)}"
        )
    
    return manifest


@router.get("/{candidate_id}/manifest", response_model=PlacementManifest)
async def get_manifest(
    candidate_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository),
    manifest_repo: ManifestRepository = Depends(get_manifest_repository)
):
    """
    Retrieve previously generated placement manifest.
    
    Args:
        candidate_id: Unique candidate identifier
        
    Returns:
        Stored placement manifest
        
    Raises:
        404: If candidate or manifest not found
    """
    candidate_model = await candidate_repo.get(candidate_id)
    if not candidate_model:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    manifests = await manifest_repo.list_by_candidate(candidate_id)
    if not manifests:
        raise HTTPException(
            status_code=404,
            detail=f"No manifest found for candidate {candidate_id}. Generate one first."
        )
    
    # Return the most recent manifest
    manifest_model = manifests[0]  # list_by_candidate orders by created_at DESC
    return model_to_manifest(manifest_model)


@router.get("", response_model=Dict[str, Any])
async def list_candidates(
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository),
    manifest_repo: ManifestRepository = Depends(get_manifest_repository)
):
    """
    List all uploaded candidate packages.
    
    Returns:
        Dictionary with candidate list and count
    """
    # Get all candidates - we need to list by workflow or add a list_all method
    # For now, we'll need to add this capability to the repository
    # Temporary: return empty list until we add list_all to repository protocol
    # TODO: Add list_all() method to CandidateRepository protocol
    
    candidates = []
    
    return {
        "count": len(candidates),
        "candidates": candidates
    }


@router.post("/{candidate_id}/execute", response_model=Dict[str, Any])
async def execute_placement(
    candidate_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    candidate_repo: CandidateRepository = Depends(get_candidate_repository),
    manifest_repo: ManifestRepository = Depends(get_manifest_repository),
    approval_repo: ApprovalRepository = Depends(get_approval_repository)
):
    """
    Execute approved placement manifest for candidate block.
    
    SAFETY INVARIANTS:
    - Requires ImplementationApproval (not self-approved)
    - Verifies ALL bindings via ApprovalEnforcer (workflow_id, candidate_sha256, manifest_id, manifest_sha256)
    - Verifies manifest hash (rejects tampered manifests with 409)
    - Only executes approved repository/toolchain operations
    - Creates git branch and commit for approved changes
    - Triggers discovery refresh after placement
    
    M2.9 R3: Uses PostgreSQL repositories for approval enforcement.
    
    Args:
        candidate_id: Unique candidate identifier
        
    Returns:
        Execution result with status, branch, commit, and evidence
        
    Raises:
        404: If candidate or manifest not found
        400: If manifest missing workflow binding
        403: If implementation approval enforcement failed
        409: If manifest has been tampered with (hash mismatch)
    """
    candidate_model = await candidate_repo.get(candidate_id)
    if not candidate_model:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} not found"
        )
    
    package = model_to_candidate(candidate_model)
    
    manifests = await manifest_repo.list_by_candidate(candidate_id)
    if not manifests:
        raise HTTPException(
            status_code=404,
            detail=f"No manifest found for candidate {candidate_id}. Generate one first."
        )
    
    manifest_model = manifests[0]  # Most recent
    manifest = model_to_manifest(manifest_model)
    
    # Import executor
    from app.placement.executor import PlacementExecutor, PlacementExecutionError
    
    # SECURITY: Enforce implementation approval via ApprovalEnforcer
    # Compute candidate SHA-256 from uploaded files
    candidate_sha256 = _compute_candidate_sha256(package.files)
    
    # Get workflow_id from candidate
    workflow_id = package.workflow_id
    if not workflow_id:
        raise HTTPException(
            status_code=400,
            detail="Manifest missing workflow_id binding. "
                   "This indicates the candidate was not properly bound to a workflow."
        )
    
    # Get requester_id from candidate metadata
    requester_id = package.uploadedBy
    if not requester_id:
        raise HTTPException(
            status_code=400,
            detail="Candidate missing uploadedBy. "
                   "Cannot verify approval without requester identity."
        )
    
    # Get approval from repository
    approval_model = await approval_repo.get_by_workflow(workflow_id)
    if not approval_model:
        raise HTTPException(
            status_code=403,
            detail=f"No approval found for workflow {workflow_id}. "
                   f"Submit for approval via governance API first."
        )
    
    approval = model_to_approval(approval_model)
    
    # Enforce approval bindings via ApprovalEnforcer
    # Create temporary dict-backed enforcer for compatibility
    approvals_dict = {workflow_id: approval}
    enforcer = ApprovalEnforcer(approvals_dict)
    enforcement_result = enforcer.enforce_approval(
        workflow_id=workflow_id,
        candidate_sha256=candidate_sha256,
        manifest_id=manifest.manifestId,
        manifest_sha256=manifest.manifestHash,
        requester_id=requester_id
    )
    
    if not enforcement_result.approved:
        raise HTTPException(
            status_code=403,
            detail=f"Implementation approval enforcement failed: {enforcement_result.reason}. "
                   f"Bindings verified: {enforcement_result.bindings_verified}."
        )
    
    # Execute placement with safety checks
    workspace_root = os.environ.get('WORKSPACE_ROOT', 'E:\\onlinewebsites\\quiz-platform')
    executor = PlacementExecutor(workspace_root)
    
    try:
        result = executor.execute_placement(
            manifest,
            approval,
            package.files,
            workflow_requester=requester_id,
            candidate_sha256=candidate_sha256
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


def _validate_package(package: CandidatePackage) -> list[str]:
    """
    Validate candidate package structure and content.
    
    Wave 3A validation rules:
    - Reject unsafe paths (path traversal: '..' or absolute paths)
    - Reject empty packages (zero files or all files empty)
    - Reject packages missing manifest (no component or schema file matching target)
    
    Args:
        package: Candidate package to validate
        
    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []
    
    # Check for empty package
    if not package.files or len(package.files) == 0:
        errors.append("Package validation failed: package contains zero files")
        return errors
    
    # Check if all files are empty
    all_empty = all(
        not f.content or (isinstance(f.content, str) and f.content.strip() == "")
        for f in package.files
    )
    if all_empty:
        errors.append("Package validation failed: all files in package are empty")
    
    # Check for unsafe paths
    for file in package.files:
        filename = file.filename
        
        # Check for path traversal with '..'
        if '..' in filename:
            errors.append(f"Package validation failed: path traversal attempt detected in '{filename}'")
        
        # Check for absolute paths (Windows: C:\ or UNC \\, Unix: /)
        if filename.startswith('/') or (len(filename) > 1 and filename[1] == ':') or filename.startswith('\\\\'):
            errors.append(f"Package validation failed: absolute path not allowed in '{filename}'")
    
    # Check for manifest file (component or schema matching target)
    if package.target_family and package.target_version:
        component_pattern = f"{package.target_family}{package.target_version}Block.tsx"
        schema_pattern = f"{package.target_family}{package.target_version}Schema.ts"
        
        filenames = [f.filename for f in package.files]
        
        # Check if either component or schema file exists
        has_component = any(
            component_pattern in fname or fname.endswith(component_pattern)
            for fname in filenames
        )
        has_schema = any(
            schema_pattern in fname or fname.endswith(schema_pattern)
            for fname in filenames
        )
        
        if not has_component and not has_schema:
            errors.append(
                f"Package validation failed: missing required manifest file (expected {component_pattern} or {schema_pattern})"
            )
    
    return errors


def _compute_candidate_sha256(files: list[Any]) -> str:
    """
    Compute SHA-256 hash from candidate files.
    
    Matches CandidateValidator._compute_candidate_hash pattern:
    concatenates sorted file hashes for consistency.
    
    Args:
        files: List of CandidateFile objects with content attribute
        
    Returns:
        Hex-encoded SHA-256 hash
        
    Raises:
        ValueError: If file content encoding fails
    """
    sha256_hash = hashlib.sha256()
    
    # Sort files by filename for deterministic hash
    sorted_files = sorted(files, key=lambda f: f.filename)
    
    for file in sorted_files:
        # Hash each file's content
        try:
            content_bytes = file.content.encode('utf-8') if isinstance(file.content, str) else file.content
        except UnicodeEncodeError as e:
            raise ValueError(f"Failed to encode file '{file.filename}': {str(e)}. Files must be valid UTF-8.")
        
        file_hash = hashlib.sha256(content_bytes)
        sha256_hash.update(file_hash.digest())
    
    return sha256_hash.hexdigest()
