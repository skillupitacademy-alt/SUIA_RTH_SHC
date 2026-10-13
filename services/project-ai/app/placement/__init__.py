"""Placement logic for candidate blocks."""

from app.placement.comparator import CanonicalComparator, StructuralFeatures
from app.placement.executor import PlacementExecutor, PlacementExecutionError
from app.placement.repository_adapter import (
    RepositoryAdapter,
    RepositoryAdapterError,
    PathValidationError,
    OperationRecord
)
from app.placement.approval_enforcer import (
    ApprovalEnforcer,
    ApprovalEnforcementResult,
    create_approval_enforcer,
)
from app.placement.worktree_manager import (
    WorktreeManager,
    WorktreeContext,
    WorktreeError,
    create_worktree_manager,
)
from app.placement import artifact_policy

# Wave 5: Placement Engine
from app.placement.placement_engine import (
    PlacementEngine,
    PlacementEngineResult,
)
from app.placement.matcher import (
    CandidateManifestMatcher,
    MatchResult,
)
from app.placement.scorer import (
    PlacementScorer,
    PlacementScore,
)

__all__ = [
    "CanonicalComparator",
    "StructuralFeatures",
    "PlacementExecutor",
    "PlacementExecutionError",
    "RepositoryAdapter",
    "RepositoryAdapterError",
    "PathValidationError",
    "OperationRecord",
    "ApprovalEnforcer",
    "ApprovalEnforcementResult",
    "create_approval_enforcer",
    "WorktreeManager",
    "WorktreeContext",
    "WorktreeError",
    "create_worktree_manager",
    "artifact_policy",
    # Wave 5: Placement Engine
    "PlacementEngine",
    "PlacementEngineResult",
    "CandidateManifestMatcher",
    "MatchResult",
    "PlacementScorer",
    "PlacementScore",
]
