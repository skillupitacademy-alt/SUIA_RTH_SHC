"""
Candidate-Manifest Matcher Module

Matches candidates to available placement manifests based on:
- Target family/version from workflow binding
- Placement decision types
- Scoring via PlacementScorer
- Conflict detection

Part of Wave 5 (M2.9 R3) - Placement Engine
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict

from app.models.candidate import CandidatePackage, PlacementManifest, PlacementDecision
from app.placement.scorer import PlacementScorer, PlacementScore


@dataclass
class MatchResult:
    """
    Result of matching a candidate to manifests.
    
    Attributes:
        candidate_id: Candidate identifier
        matched_manifests: All manifests that match (filtered by family/version)
        best_manifest: Highest-scoring manifest
        best_score: Score for best manifest
        conflicts: List of conflict descriptions
        recommendation: Recommended placement decision
    """
    candidate_id: str
    matched_manifests: List[PlacementManifest] = field(default_factory=list)
    best_manifest: Optional[PlacementManifest] = None
    best_score: Optional[PlacementScore] = None
    conflicts: List[str] = field(default_factory=list)
    recommendation: Optional[PlacementDecision] = None


class CandidateManifestMatcher:
    """
    Matches candidates to manifests and detects conflicts.
    
    Matching logic:
    1. Filter manifests by target_family/target_version
    2. Exclude REJECT decision manifests
    3. Score each candidate-manifest pair
    4. Rank by score
    5. Detect conflicts (multiple candidates for same target path)
    """
    
    def __init__(self, scorer: PlacementScorer):
        """
        Initialize matcher with scorer dependency.
        
        Args:
            scorer: PlacementScorer instance for scoring matches
        """
        self.scorer = scorer
    
    async def find_matches(
        self,
        candidate: CandidatePackage,
        available_manifests: List[PlacementManifest],
        workflow_target_family: Optional[str] = None,
        workflow_target_version: Optional[str] = None,
        structural_similarities: Optional[Dict[str, float]] = None
    ) -> MatchResult:
        """
        Find matching manifests for a candidate.
        
        Args:
            candidate: Candidate package
            available_manifests: List of available placement manifests
            workflow_target_family: Target family from workflow (overrides candidate binding)
            workflow_target_version: Target version from workflow (overrides candidate binding)
            structural_similarities: Dict of manifest_id -> structural similarity score
            
        Returns:
            MatchResult with matched manifests and recommendation
        """
        # Use workflow target or candidate binding
        target_family = workflow_target_family or candidate.target_family
        target_version = workflow_target_version or candidate.target_version
        
        # Filter manifests by target family/version and exclude REJECT
        filtered_manifests = self._filter_manifests(
            manifests=available_manifests,
            target_family=target_family,
            target_version=target_version
        )
        
        if not filtered_manifests:
            # No matches found
            return MatchResult(
                candidate_id=candidate.candidateId,
                matched_manifests=[],
                best_manifest=None,
                best_score=None,
                conflicts=[],
                recommendation=PlacementDecision.REJECT
            )
        
        # Score all matches
        scores = self.scorer.score_all_matches(
            candidate=candidate,
            manifests=filtered_manifests,
            structural_similarities=structural_similarities or {}
        )
        
        # Best match is highest-scoring
        best_score = scores[0] if scores else None
        best_manifest = next(
            (m for m in filtered_manifests if m.manifestId == best_score.manifest_id),
            None
        ) if best_score else None
        
        # Determine recommendation based on best manifest
        recommendation = best_manifest.decision if best_manifest else PlacementDecision.REJECT
        
        return MatchResult(
            candidate_id=candidate.candidateId,
            matched_manifests=filtered_manifests,
            best_manifest=best_manifest,
            best_score=best_score,
            conflicts=[],  # Populated by detect_conflicts()
            recommendation=recommendation
        )
    
    async def detect_conflicts(
        self,
        candidates: List[CandidatePackage],
        manifests: List[PlacementManifest]
    ) -> Dict[str, List[str]]:
        """
        Detect placement conflicts (multiple candidates targeting same path).
        
        Args:
            candidates: List of candidate packages
            manifests: List of placement manifests
            
        Returns:
            Dict mapping target_path -> [candidate_ids]
            Only returns paths with >1 candidate
        """
        # Build map: target_path -> [candidate_ids]
        path_to_candidates: Dict[str, List[str]] = {}
        
        for candidate in candidates:
            # Find best manifest for this candidate
            result = await self.find_matches(
                candidate=candidate,
                available_manifests=manifests
            )
            
            if result.best_manifest:
                target_path = result.best_manifest.targetPath
                if target_path not in path_to_candidates:
                    path_to_candidates[target_path] = []
                path_to_candidates[target_path].append(candidate.candidateId)
        
        # Filter to only conflicts (>1 candidate per path)
        conflicts = {
            path: cand_ids
            for path, cand_ids in path_to_candidates.items()
            if len(cand_ids) > 1
        }
        
        return conflicts
    
    def _filter_manifests(
        self,
        manifests: List[PlacementManifest],
        target_family: Optional[str],
        target_version: Optional[str]
    ) -> List[PlacementManifest]:
        """
        Filter manifests by target family/version and exclude REJECT.
        
        Args:
            manifests: List of manifests to filter
            target_family: Target block family
            target_version: Target block version
            
        Returns:
            Filtered list of manifests
        """
        filtered = []
        
        for manifest in manifests:
            # Exclude REJECT decisions
            if manifest.decision == PlacementDecision.REJECT:
                continue
            
            # Filter by family if specified
            if target_family and manifest.blockFamily.value != target_family:
                continue
            
            # Filter by version if specified
            if target_version and manifest.blockVersion != target_version:
                continue
            
            filtered.append(manifest)
        
        return filtered
    
    def check_skills_match(
        self,
        candidate_skills: List[str],
        manifest_requirements: List[str]
    ) -> bool:
        """
        Check if candidate skills match manifest requirements (future extension).
        
        Args:
            candidate_skills: List of candidate skills
            manifest_requirements: List of required skills
            
        Returns:
            True if skills match requirements, False otherwise
        """
        if not manifest_requirements:
            return True  # No requirements = always match
        
        if not candidate_skills:
            return False  # Requirements exist but no skills
        
        # Check if all requirements are satisfied
        candidate_set = set(candidate_skills)
        required_set = set(manifest_requirements)
        
        return required_set.issubset(candidate_set)
    
    def check_availability(
        self,
        candidate: CandidatePackage,
        manifest_schedule: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Check candidate availability against manifest schedule (future extension).
        
        Currently always returns True. Future implementation will check:
        - Candidate upload timestamp
        - Manifest creation timestamp
        - Workflow deadlines
        
        Args:
            candidate: Candidate package
            manifest_schedule: Manifest schedule constraints (optional)
            
        Returns:
            True if candidate is available, False otherwise
        """
        # Future: Implement schedule conflict detection
        # For now, always available
        return True
