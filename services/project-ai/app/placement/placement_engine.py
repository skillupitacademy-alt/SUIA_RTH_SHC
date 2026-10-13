"""
Placement Engine - Core Orchestration

Orchestrates the complete placement workflow:
1. Load candidate and workflow context
2. Match candidates to manifests (via Matcher)
3. Score matches (via Scorer)
4. Create placement records in database
5. Handle conflicts with resolution strategies
6. Support manual override

Part of Wave 5 (M2.9 R3) - Placement Engine
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import CandidatePackage, PlacementManifest, PlacementDecision
from app.placement.matcher import CandidateManifestMatcher, MatchResult
from app.placement.scorer import PlacementScorer, PlacementScore


@dataclass
class PlacementEngineResult:
    """
    Result of placement engine processing.
    
    Attributes:
        workflow_id: Workflow identifier
        candidate_id: Candidate identifier
        placement_decision: Final placement decision
        manifest_id: Selected manifest identifier
        score: Placement score for selected manifest
        conflicts: List of conflict descriptions
        evidence: Machine-readable evidence for audit trail
        created_at: ISO 8601 timestamp of placement creation
    """
    workflow_id: str
    candidate_id: str
    placement_decision: PlacementDecision
    manifest_id: str
    score: Optional[PlacementScore]
    conflicts: List[str] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PlacementEngine:
    """
    Core placement engine orchestrating candidate-to-manifest matching.
    
    Responsibilities:
    - Match candidates to available manifests
    - Score matches based on multiple criteria
    - Create placement records
    - Handle conflicts (highest score wins)
    - Support manual override
    """
    
    def __init__(
        self,
        matcher: CandidateManifestMatcher,
        scorer: PlacementScorer,
        manifest_repo,  # ManifestRepository protocol
        candidate_repo,  # CandidateRepository protocol
        workflow_repo,   # WorkflowRepository protocol
    ):
        """
        Initialize placement engine with dependencies.
        
        Args:
            matcher: CandidateManifestMatcher instance
            scorer: PlacementScorer instance
            manifest_repo: Repository for manifest persistence
            candidate_repo: Repository for candidate persistence
            workflow_repo: Repository for workflow persistence
        """
        self.matcher = matcher
        self.scorer = scorer
        self.manifest_repo = manifest_repo
        self.candidate_repo = candidate_repo
        self.workflow_repo = workflow_repo
    
    async def create_placement(
        self,
        workflow_id: str,
        candidate_id: str,
        session: AsyncSession,
        all_candidates: Optional[List[CandidatePackage]] = None
    ) -> PlacementEngineResult:
        """
        Create placement decision for a candidate.
        
        Process:
        1. Load candidate from repository
        2. Load workflow to get target family/version
        3. Load available manifests
        4. Match and score candidate-manifest pairs
        5. Detect conflicts with other candidates
        6. Create placement record with best match
        
        Args:
            workflow_id: Workflow identifier
            candidate_id: Candidate identifier
            session: Async database session
            all_candidates: Optional list of all candidates for conflict detection.
                           If None, conflicts will not be detected.
            
        Returns:
            PlacementEngineResult with placement decision
            
        Raises:
            ValueError: If candidate or workflow not found
        """
        # Load candidate
        candidate = await self._load_candidate(candidate_id, session)
        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found")
        
        # Load workflow
        workflow = await self._load_workflow(workflow_id, session)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Load available manifests for workflow
        manifests = await self._load_manifests(workflow_id, session)
        
        # Match candidate to manifests
        match_result = await self.matcher.find_matches(
            candidate=candidate,
            available_manifests=manifests,
            workflow_target_family=workflow.get("target", {}).get("family"),
            workflow_target_version=workflow.get("target", {}).get("version")
        )
        
        # Detect conflicts if all_candidates provided
        if all_candidates and manifests:
            conflicts_map = await self.matcher.detect_conflicts(
                candidates=all_candidates,
                manifests=manifests
            )
            # Populate conflicts for this candidate's target path
            if match_result.best_manifest:
                target_path = match_result.best_manifest.targetPath
                if target_path in conflicts_map:
                    conflicting_ids = conflicts_map[target_path]
                    if len(conflicting_ids) > 1:
                        match_result.conflicts = [
                            f"Multiple candidates ({', '.join(conflicting_ids)}) targeting path: {target_path}"
                        ]
        
        # Create placement result
        placement_decision = match_result.recommendation or PlacementDecision.REJECT
        manifest_id = match_result.best_manifest.manifestId if match_result.best_manifest else ""
        
        # Build evidence
        evidence = self._build_evidence(
            candidate=candidate,
            match_result=match_result,
            workflow=workflow
        )
        
        result = PlacementEngineResult(
            workflow_id=workflow_id,
            candidate_id=candidate_id,
            placement_decision=placement_decision,
            manifest_id=manifest_id,
            score=match_result.best_score,
            conflicts=match_result.conflicts,
            evidence=evidence
        )
        
        # Persist placement record (deferred - see _persist_placement docstring)
        await self._persist_placement(result, session)
        
        return result
    
    async def handle_placement_conflict(
        self,
        workflow_id: str,
        conflicting_candidates: List[str],
        session: AsyncSession
    ) -> Dict[str, PlacementEngineResult]:
        """
        Handle placement conflict by selecting highest-scoring candidate.
        
        Strategy: Highest score wins; lower-scored candidates rejected.
        
        Args:
            workflow_id: Workflow identifier
            conflicting_candidates: List of candidate IDs in conflict
            session: Async database session
            
        Returns:
            Dict mapping candidate_id -> PlacementEngineResult
        """
        results = {}
        scores = []
        
        # Create placements for all conflicting candidates
        for candidate_id in conflicting_candidates:
            result = await self.create_placement(workflow_id, candidate_id, session)
            results[candidate_id] = result
            if result.score:
                scores.append((candidate_id, result.score.score))
        
        if not scores:
            return results
        
        # Find highest-scoring candidate
        scores.sort(key=lambda x: x[1], reverse=True)
        winner_id = scores[0][0]
        
        # Update losers to REJECT
        for candidate_id, result in results.items():
            if candidate_id != winner_id:
                result.placement_decision = PlacementDecision.REJECT
                result.conflicts.append(
                    f"Rejected due to conflict: candidate {winner_id} has higher score"
                )
                # Update in database
                await self._persist_placement(result, session)
        
        return results
    
    async def override_placement(
        self,
        workflow_id: str,
        candidate_id: str,
        manual_manifest_id: str,
        override_reason: str,
        session: AsyncSession
    ) -> PlacementEngineResult:
        """
        Manually override placement decision.
        
        Allows human to specify exact manifest for candidate, bypassing scoring.
        
        Args:
            workflow_id: Workflow identifier
            candidate_id: Candidate identifier
            manual_manifest_id: Manually selected manifest ID
            override_reason: Reason for override
            session: Async database session
            
        Returns:
            PlacementEngineResult with manual override
            
        Raises:
            ValueError: If candidate, workflow, or manifest not found
        """
        # Load candidate
        candidate = await self._load_candidate(candidate_id, session)
        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found")
        
        # Load workflow
        workflow = await self._load_workflow(workflow_id, session)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Load specific manifest
        manifest = await self._load_manifest(manual_manifest_id, session)
        if not manifest:
            raise ValueError(f"Manifest {manual_manifest_id} not found")
        
        # Create placement result with override
        evidence = {
            "override": True,
            "override_reason": override_reason,
            "manual_manifest_id": manual_manifest_id,
            "original_recommendation": "N/A (manual override)",
        }
        
        result = PlacementEngineResult(
            workflow_id=workflow_id,
            candidate_id=candidate_id,
            placement_decision=manifest.decision,
            manifest_id=manual_manifest_id,
            score=None,  # No scoring for manual override
            conflicts=[],
            evidence=evidence
        )
        
        # Persist placement record
        await self._persist_placement(result, session)
        
        return result
    
    async def _load_candidate(
        self,
        candidate_id: str,
        session: AsyncSession
    ) -> Optional[CandidatePackage]:
        """Load candidate from repository."""
        try:
            candidate_model = await self.candidate_repo.get(candidate_id)
            if not candidate_model:
                return None
            
            # Convert ORM model to Pydantic model
            return CandidatePackage(
                candidateId=candidate_model.candidate_id,
                files=[],  # Files not needed for placement matching
                uploadedAt=candidate_model.uploaded_at,
                uploadedBy=candidate_model.uploaded_by,
                workflow_id=candidate_model.workflow_id,
                target_family=candidate_model.target_family,
                target_version=candidate_model.target_version,
                contract_sha256=candidate_model.contract_sha256
            )
        except Exception:
            return None
    
    async def _load_workflow(
        self,
        workflow_id: str,
        session: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Load workflow from repository."""
        try:
            workflow_model = await self.workflow_repo.get(workflow_id)
            if not workflow_model:
                return None
            
            # Convert to dict
            return workflow_model.to_dict()
        except Exception:
            return None
    
    async def _load_manifests(
        self,
        workflow_id: str,
        session: AsyncSession
    ) -> List[PlacementManifest]:
        """Load manifests for workflow."""
        try:
            manifest_models = await self.manifest_repo.list_by_workflow(workflow_id)
            
            # Convert ORM models to Pydantic models
            manifests = []
            for model in manifest_models:
                manifest = PlacementManifest(
                    manifestId=model.manifest_id,
                    candidateId=model.candidate_id,
                    decision=PlacementDecision(model.decision),
                    targetPath=model.target_path,
                    blockFamily=model.block_family,
                    blockVersion=model.block_version,
                    requiredChanges=model.required_changes or [],
                    evidenceIds=model.evidence_ids or [],
                    manifestHash=model.manifest_hash,
                    createdAt=model.created_at
                )
                manifests.append(manifest)
            
            return manifests
        except Exception:
            return []
    
    async def _load_manifest(
        self,
        manifest_id: str,
        session: AsyncSession
    ) -> Optional[PlacementManifest]:
        """Load single manifest by ID."""
        try:
            model = await self.manifest_repo.get(manifest_id)
            if not model:
                return None
            
            return PlacementManifest(
                manifestId=model.manifest_id,
                candidateId=model.candidate_id,
                decision=PlacementDecision(model.decision),
                targetPath=model.target_path,
                blockFamily=model.block_family,
                blockVersion=model.block_version,
                requiredChanges=model.required_changes or [],
                evidenceIds=model.evidence_ids or [],
                manifestHash=model.manifest_hash,
                createdAt=model.created_at
            )
        except Exception:
            return None
    
    def _build_evidence(
        self,
        candidate: CandidatePackage,
        match_result: MatchResult,
        workflow: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build machine-readable evidence for placement decision.
        
        Args:
            candidate: Candidate package
            match_result: Match result with scores
            workflow: Workflow dict
            
        Returns:
            Evidence dictionary with all placement details
        """
        evidence = {
            "candidate_id": candidate.candidateId,
            "workflow_id": candidate.workflow_id,
            "target_family": candidate.target_family,
            "target_version": candidate.target_version,
            "matched_manifests": len(match_result.matched_manifests),
            "best_manifest_id": match_result.best_manifest.manifestId if match_result.best_manifest else None,
            "recommendation": match_result.recommendation.value if match_result.recommendation else None,
            "conflicts": match_result.conflicts,
        }
        
        # Add scoring details
        if match_result.best_score:
            evidence["score"] = {
                "overall": match_result.best_score.score,
                "criteria": match_result.best_score.criteria,
                "reasoning": match_result.best_score.reasoning,
            }
        
        return evidence
    
    async def _persist_placement(
        self,
        result: PlacementEngineResult,
        session: AsyncSession
    ) -> None:
        """
        Persist placement record to database.
        
        DEFERRED: Placement persistence is deferred because placement records
        are currently embedded in the manifest workflow, not stored separately.
        The placement decision is recorded in the approval flow when the
        implementation approval is created, binding the manifest to the workflow.
        
        Future enhancement: Create a dedicated placement_records table to track
        all placement decisions independently for audit trails.
        
        Args:
            result: PlacementEngineResult to persist
            session: Async database session
        """
        # Persistence deferred - placement decisions are recorded
        # during implementation approval creation
        pass
