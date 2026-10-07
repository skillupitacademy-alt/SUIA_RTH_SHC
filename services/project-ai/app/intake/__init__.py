"""
Intake module - M2.9 Wave 3

Candidate intake, validation, canonical comparison, and placement manifest generation.
"""

from app.intake.candidate_validator import CandidateValidator, ValidationResult, ValidationError
from app.intake.canonical_comparator import CanonicalComparator, ComparisonReport
from app.intake.placement_manifest import PlacementManifestGenerator, PlacementManifest

__all__ = [
    "CandidateValidator",
    "ValidationResult",
    "ValidationError",
    "CanonicalComparator",
    "ComparisonReport",
    "PlacementManifestGenerator",
    "PlacementManifest",
]
