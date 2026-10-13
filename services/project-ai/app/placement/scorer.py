"""
Placement Scoring Module

Evaluates candidate-to-manifest match quality based on multiple criteria:
- Structural similarity (from CanonicalComparator.StructuralFeatures)
- Block family/version alignment
- Availability (manifest decision type)
- Conflict detection

Part of Wave 5 (M2.9 R3) - Placement Engine
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List

from app.models.candidate import CandidatePackage, PlacementManifest, PlacementDecision, BlockFamily


@dataclass
class PlacementScore:
    """
    Placement score for a candidate-manifest pair.
    
    Attributes:
        candidate_id: Candidate identifier
        manifest_id: Manifest identifier
        score: Overall score (0.0-1.0)
        criteria: Score breakdown by criterion
        reasoning: Human-readable explanation of the score
    """
    candidate_id: str
    manifest_id: str
    score: float  # 0.0-1.0
    criteria: Dict[str, float] = field(default_factory=dict)
    reasoning: str = ""


class PlacementScorer:
    """
    Scores candidate-to-manifest matches based on multiple criteria.
    
    Scoring criteria (default equal weights):
    - structural_similarity: 0.0-1.0 from CanonicalComparator
    - family_version_match: 1.0 exact, 0.5 family, 0.0 mismatch
    - availability: 1.0 REUSE/ADD, 0.5 UPDATE, 0.3 EXTEND, 0.0 REJECT
    - conflict_penalty: -0.3 per conflict
    """
    
    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        conflict_penalty: float = 0.3
    ):
        """
        Initialize scorer with configurable weights.
        
        Args:
            weights: Criterion weights (must sum to 1.0). If None, uses equal weights.
            conflict_penalty: Score penalty per conflict (default 0.3)
            
        Raises:
            ValueError: If custom weights do not sum to 1.0
        """
        self.weights = weights or {
            "structural_similarity": 0.25,
            "family_version_match": 0.25,
            "availability": 0.25,
            "conflict_penalty": 0.25,
        }
        
        # Validate weights sum to 1.0
        weight_sum = sum(self.weights.values())
        if not (0.99 <= weight_sum <= 1.01):  # Allow small floating point errors
            raise ValueError(
                f"Weights must sum to 1.0, got {weight_sum}. "
                f"Provided weights: {self.weights}"
            )
        
        self.conflict_penalty = conflict_penalty
    
    def score_match(
        self,
        candidate: CandidatePackage,
        manifest: PlacementManifest,
        structural_similarity: Optional[float] = None,
        conflict_count: int = 0
    ) -> PlacementScore:
        """
        Score a candidate-manifest match.
        
        Args:
            candidate: Candidate package
            manifest: Placement manifest
            structural_similarity: Structural similarity score from CanonicalComparator (0.0-1.0)
            conflict_count: Number of conflicts for this target path
            
        Returns:
            PlacementScore with overall score and criteria breakdown
        """
        criteria = {}
        reasoning_parts = []
        
        # 1. Structural similarity
        # Default to 0.0 when structural comparison data is unavailable
        # This avoids biasing scores with an arbitrary midpoint
        struct_score = structural_similarity if structural_similarity is not None else 0.0
        criteria["structural_similarity"] = struct_score
        reasoning_parts.append(f"structural similarity: {struct_score:.2f}")
        
        # 2. Family/version match
        family_score = self._score_family_version_match(candidate, manifest)
        criteria["family_version_match"] = family_score
        if family_score == 1.0:
            reasoning_parts.append("exact family/version match")
        elif family_score == 0.5:
            reasoning_parts.append("family match only")
        else:
            reasoning_parts.append("no family/version match")
        
        # 3. Availability based on decision type
        avail_score = self._score_availability(manifest.decision)
        criteria["availability"] = avail_score
        reasoning_parts.append(f"decision: {manifest.decision.value} (score: {avail_score:.2f})")
        
        # 4. Conflict penalty
        conflict_score = max(0.0, 1.0 - (conflict_count * self.conflict_penalty))
        criteria["conflict_penalty"] = conflict_score
        if conflict_count > 0:
            reasoning_parts.append(f"{conflict_count} conflict(s) detected")
        
        # Calculate weighted overall score
        overall_score = sum(
            criteria[key] * self.weights.get(key, 0.0)
            for key in criteria
        )
        overall_score = max(0.0, min(1.0, overall_score))  # Clamp to [0, 1]
        
        reasoning = "; ".join(reasoning_parts)
        
        return PlacementScore(
            candidate_id=candidate.candidateId,
            manifest_id=manifest.manifestId,
            score=overall_score,
            criteria=criteria,
            reasoning=reasoning
        )
    
    def score_all_matches(
        self,
        candidate: CandidatePackage,
        manifests: List[PlacementManifest],
        structural_similarities: Optional[Dict[str, float]] = None,
        conflict_counts: Optional[Dict[str, int]] = None
    ) -> List[PlacementScore]:
        """
        Score all candidate-manifest pairs.
        
        Args:
            candidate: Candidate package
            manifests: List of placement manifests
            structural_similarities: Dict of manifest_id -> similarity score
            conflict_counts: Dict of manifest_id -> conflict count
            
        Returns:
            List of PlacementScore objects, sorted by score descending
        """
        structural_similarities = structural_similarities or {}
        conflict_counts = conflict_counts or {}
        
        scores = [
            self.score_match(
                candidate=candidate,
                manifest=manifest,
                structural_similarity=structural_similarities.get(manifest.manifestId),
                conflict_count=conflict_counts.get(manifest.manifestId, 0)
            )
            for manifest in manifests
        ]
        
        # Sort by score descending
        scores.sort(key=lambda s: s.score, reverse=True)
        
        return scores
    
    def _score_family_version_match(
        self,
        candidate: CandidatePackage,
        manifest: PlacementManifest
    ) -> float:
        """
        Score family/version alignment.
        
        Returns:
            1.0 if exact family and version match
            0.5 if family matches but version differs
            0.0 if family doesn't match
        """
        # Check if candidate has workflow binding
        if not candidate.target_family or not candidate.target_version:
            return 0.0
        
        # Compare family strings directly (both are strings in the domain model)
        manifest_family_str = manifest.blockFamily.value if hasattr(manifest.blockFamily, 'value') else str(manifest.blockFamily)
        
        if candidate.target_family != manifest_family_str:
            return 0.0
        
        # Family matches, check version
        if candidate.target_version == manifest.blockVersion:
            return 1.0  # Exact match
        else:
            return 0.5  # Family match only
    
    def _score_availability(self, decision: PlacementDecision) -> float:
        """
        Score based on placement decision type.
        
        Preference order: REUSE > ADD > UPDATE > EXTEND > REJECT
        
        Returns:
            1.0 for REUSE or ADD (high availability)
            0.5 for UPDATE (medium availability, requires changes)
            0.3 for EXTEND (low availability, significant changes)
            0.0 for REJECT (not available)
        """
        availability_scores = {
            PlacementDecision.REUSE: 1.0,
            PlacementDecision.ADD: 1.0,
            PlacementDecision.UPDATE: 0.5,
            PlacementDecision.EXTEND: 0.3,
            PlacementDecision.REJECT: 0.0,
        }
        return availability_scores.get(decision, 0.0)
    
    def score_skills_alignment(
        self,
        candidate_skills: List[str],
        required_skills: List[str]
    ) -> float:
        """
        Score skills alignment (future extension).
        
        Currently not used, but provided for future enhancement.
        
        Args:
            candidate_skills: List of candidate skills
            required_skills: List of required skills
            
        Returns:
            Jaccard similarity: intersection / union
        """
        if not candidate_skills and not required_skills:
            return 1.0  # Both empty = perfect match
        
        if not required_skills:
            return 1.0  # No requirements = always match
        
        if not candidate_skills:
            return 0.0  # No skills but requirements exist = no match
        
        candidate_set = set(candidate_skills)
        required_set = set(required_skills)
        
        intersection = len(candidate_set & required_set)
        union = len(candidate_set | required_set)
        
        return intersection / union if union > 0 else 0.0
    
    def aggregate_score(
        self,
        skill_score: float,
        availability_score: float,
        weights: Optional[Dict[str, float]] = None
    ) -> float:
        """
        Aggregate multiple scores with weights.
        
        Args:
            skill_score: Skills alignment score (0.0-1.0)
            availability_score: Availability score (0.0-1.0)
            weights: Custom weights (default: equal weights)
            
        Returns:
            Weighted aggregate score (0.0-1.0)
        """
        weights = weights or {"skill": 0.5, "availability": 0.5}
        
        aggregate = (
            skill_score * weights.get("skill", 0.5) +
            availability_score * weights.get("availability", 0.5)
        )
        
        return max(0.0, min(1.0, aggregate))
