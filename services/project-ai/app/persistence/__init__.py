"""
Project AI Persistence Layer - M2.9 R3 Durable Persistence

Architecture Rules:
- All database operations are async (AsyncEngine, AsyncSession)
- Uses asyncpg driver for PostgreSQL
- NO schema mutations in application code (no create_all())
- Schema changes ONLY through Drizzle migrations
- Startup validates connectivity and table existence, does not create tables
"""

from .database import (
    get_db_session,
    validate_database_connectivity,
    close_db,
    get_engine,
)
from .models import (
    WorkflowModel,
    StateTransitionModel,
    ContractModel,
    CandidateModel,
    ManifestModel,
    ApprovalModel,
)
from .repositories import (
    # Protocols
    WorkflowRepository,
    ContractRepository,
    CandidateRepository,
    ManifestRepository,
    ApprovalRepository,
    StateTransitionRepository,
    # Implementations
    PostgresWorkflowRepository,
    PostgresContractRepository,
    PostgresCandidateRepository,
    PostgresManifestRepository,
    PostgresApprovalRepository,
    PostgresStateTransitionRepository,
    # Exceptions
    OptimisticLockError,
    HashMismatchError,
)


# ============================================================================
# Repository Factory Functions (FastAPI Dependency Injection)
# ============================================================================


async def get_workflow_repository(session = None) -> WorkflowRepository:
    """
    Factory for WorkflowRepository.
    
    Usage:
        @app.post("/workflows")
        async def create_workflow(
            repo: WorkflowRepository = Depends(get_workflow_repository),
            session: AsyncSession = Depends(get_db_session)
        ):
            workflow = WorkflowModel(...)
            return await repo.upsert(workflow)
    
    Returns:
        PostgresWorkflowRepository instance
    """
    if session is None:
        # When used as dependency, FastAPI will inject session from get_db_session
        raise ValueError("Session must be provided")
    return PostgresWorkflowRepository(session)


async def get_contract_repository(session = None) -> ContractRepository:
    """
    Factory for ContractRepository.
    
    Returns:
        PostgresContractRepository instance
    """
    if session is None:
        raise ValueError("Session must be provided")
    return PostgresContractRepository(session)


async def get_candidate_repository(session = None) -> CandidateRepository:
    """
    Factory for CandidateRepository.
    
    Returns:
        PostgresCandidateRepository instance
    """
    if session is None:
        raise ValueError("Session must be provided")
    return PostgresCandidateRepository(session)


async def get_manifest_repository(session = None) -> ManifestRepository:
    """
    Factory for ManifestRepository.
    
    Returns:
        PostgresManifestRepository instance
    """
    if session is None:
        raise ValueError("Session must be provided")
    return PostgresManifestRepository(session)


async def get_approval_repository(session = None) -> ApprovalRepository:
    """
    Factory for ApprovalRepository.
    
    Returns:
        PostgresApprovalRepository instance
    """
    if session is None:
        raise ValueError("Session must be provided")
    return PostgresApprovalRepository(session)


async def get_state_transition_repository(session = None) -> StateTransitionRepository:
    """
    Factory for StateTransitionRepository.
    
    Returns:
        PostgresStateTransitionRepository instance
    """
    if session is None:
        raise ValueError("Session must be provided")
    return PostgresStateTransitionRepository(session)


__all__ = [
    # Database
    "get_db_session",
    "validate_database_connectivity",
    "close_db",
    "get_engine",
    # Models
    "WorkflowModel",
    "StateTransitionModel",
    "ContractModel",
    "CandidateModel",
    "ManifestModel",
    "ApprovalModel",
    # Repository Protocols
    "WorkflowRepository",
    "ContractRepository",
    "CandidateRepository",
    "ManifestRepository",
    "ApprovalRepository",
    "StateTransitionRepository",
    # Repository Implementations
    "PostgresWorkflowRepository",
    "PostgresContractRepository",
    "PostgresCandidateRepository",
    "PostgresManifestRepository",
    "PostgresApprovalRepository",
    "PostgresStateTransitionRepository",
    # Repository Factories
    "get_workflow_repository",
    "get_contract_repository",
    "get_candidate_repository",
    "get_manifest_repository",
    "get_approval_repository",
    "get_state_transition_repository",
    # Exceptions
    "OptimisticLockError",
    "HashMismatchError",
]
