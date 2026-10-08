"""Placement logic for candidate blocks."""

from app.placement.comparator import CanonicalComparator, StructuralFeatures
from app.placement.executor import PlacementExecutor, PlacementExecutionError
from app.placement.repository_adapter import (
    RepositoryAdapter,
    RepositoryAdapterError,
    PathValidationError,
    OperationRecord
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
]

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
from app.placement.executor import PlacementExecutor, PlacementExecutionError
from app.placement.comparator import CanonicalComparator

__all__ = [
    "ApprovalEnforcer",
    "ApprovalEnforcementResult",
    "create_approval_enforcer",
    "WorktreeManager",
    "WorktreeContext",
    "WorktreeError",
    "create_worktree_manager",
    "PlacementExecutor",
    "PlacementExecutionError",
    "CanonicalComparator",
]
