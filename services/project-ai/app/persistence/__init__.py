"""
Project AI Persistence Layer - M2.9 R3 Durable Persistence

Architecture Rules:
- All database operations are async (AsyncEngine, AsyncSession)
- Uses asyncpg driver for PostgreSQL
- NO schema mutations in application code (no create_all())
- Schema changes ONLY through Drizzle migrations
- Startup validates connectivity and table existence, does not create tables
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

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


from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession


async def get_workflow_repository(
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowRepository:
    """
    Factory for WorkflowRepository compatible with FastAPI dependency injection.
    
    Usage:
        @app.post("/workflows")
        async def create_workflow(
            repo: WorkflowRepository = Depends(get_workflow_repository)
        ):
            workflow = WorkflowModel(...)
            return await repo.upsert(workflow)
    
    Returns:
        PostgresWorkflowRepository instance
    """
    return PostgresWorkflowRepository(session)


async def get_contract_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ContractRepository:
    """
    Factory for ContractRepository compatible with FastAPI dependency injection.
    
    Returns:
        PostgresContractRepository instance
    """
    return PostgresContractRepository(session)


async def get_candidate_repository(
    session: AsyncSession = Depends(get_db_session)
) -> CandidateRepository:
    """
    Factory for CandidateRepository compatible with FastAPI dependency injection.
    
    Returns:
        PostgresCandidateRepository instance
    """
    return PostgresCandidateRepository(session)


async def get_manifest_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ManifestRepository:
    """
    Factory for ManifestRepository compatible with FastAPI dependency injection.
    
    Returns:
        PostgresManifestRepository instance
    """
    return PostgresManifestRepository(session)


async def get_approval_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ApprovalRepository:
    """
    Factory for ApprovalRepository compatible with FastAPI dependency injection.
    
    Returns:
        PostgresApprovalRepository instance
    """
    return PostgresApprovalRepository(session)


async def get_state_transition_repository(
    session: AsyncSession = Depends(get_db_session)
) -> StateTransitionRepository:
    """
    Factory for StateTransitionRepository compatible with FastAPI dependency injection.
    
    Returns:
        PostgresStateTransitionRepository instance
    """
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
