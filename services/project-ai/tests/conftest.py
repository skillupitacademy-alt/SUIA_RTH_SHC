"""
Pytest fixtures for FEAT-003 PostgreSQL-backed tests.

Provides async database session fixtures with transaction rollback
and repository instances for testing.
"""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.persistence import (
    WorkflowRepository,
    ContractRepository,
    CandidateRepository,
    ManifestRepository,
    ApprovalRepository,
    StateTransitionRepository,
    PostgresWorkflowRepository,
    PostgresContractRepository,
    PostgresCandidateRepository,
    PostgresManifestRepository,
    PostgresApprovalRepository,
    PostgresStateTransitionRepository,
)
from app.persistence.models import Base
from app.orchestration.workflow_governance import WorkflowGovernanceService


@pytest_asyncio.fixture
async def test_db_engine():
    """Create an in-memory SQLite database engine for testing."""
    # Use in-memory SQLite for fast tests with transaction rollback
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    await engine.dispose()


@pytest_asyncio.fixture
async def test_db_session(test_db_engine):
    """Create an async database session with transaction rollback."""
    async_session = async_sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        async with session.begin():
            yield session
            # Rollback happens automatically when context exits


@pytest.fixture
def mock_db_session():
    """Create a mock database session for tests that don't need real DB."""
    session = AsyncMock(spec=AsyncSession)
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest_asyncio.fixture
async def test_workflow_repo(test_db_session) -> WorkflowRepository:
    """Create a WorkflowRepository with test session."""
    return PostgresWorkflowRepository(test_db_session)


@pytest_asyncio.fixture
async def test_contract_repo(test_db_session) -> ContractRepository:
    """Create a ContractRepository with test session."""
    return PostgresContractRepository(test_db_session)


@pytest_asyncio.fixture
async def test_candidate_repo(test_db_session) -> CandidateRepository:
    """Create a CandidateRepository with test session."""
    return PostgresCandidateRepository(test_db_session)


@pytest_asyncio.fixture
async def test_manifest_repo(test_db_session) -> ManifestRepository:
    """Create a ManifestRepository with test session."""
    return PostgresManifestRepository(test_db_session)


@pytest_asyncio.fixture
async def test_approval_repo(test_db_session) -> ApprovalRepository:
    """Create an ApprovalRepository with test session."""
    return PostgresApprovalRepository(test_db_session)


@pytest_asyncio.fixture
async def test_state_transition_repo(test_db_session) -> StateTransitionRepository:
    """Create a StateTransitionRepository with test session."""
    return PostgresStateTransitionRepository(test_db_session)


@pytest_asyncio.fixture
async def test_governance_service(
    test_workflow_repo,
    test_approval_repo,
    test_state_transition_repo,
    test_db_session
) -> WorkflowGovernanceService:
    """Create a WorkflowGovernanceService with test repositories."""
    return WorkflowGovernanceService(
        workflow_repo=test_workflow_repo,
        approval_repo=test_approval_repo,
        state_transition_repo=test_state_transition_repo,
        session=test_db_session
    )


@pytest.fixture(autouse=True)
def mock_jwt_config(monkeypatch):
    """
    Automatically mock JWT configuration for all tests.
    
    Provides test secrets for JWT encoding/decoding without requiring
    environment variables to be set.
    """
    test_config = {
        "user_secret": "test_user_secret_at_least_32_characters_long_12345678",
        "admin_secret": "test_admin_secret_at_least_32_characters_long_12345678",
        "algorithm": "HS256",
        "access_token_expire_minutes": 30
    }
    
    from app.auth import config
    monkeypatch.setattr(config, "get_jwt_config", lambda: test_config)


@pytest.fixture(autouse=True)
def mock_database_dependencies(monkeypatch, mock_db_session):
    """
    Automatically mock database dependencies for all tests.
    
    This prevents tests from trying to connect to real PostgreSQL
    unless they explicitly use test_db_session fixture.
    """
    from app.persistence import database
    
    # Mock the get_db_session dependency
    async def mock_get_db_session():
        yield mock_db_session
    
    # Patch the module-level function
    monkeypatch.setattr(database, "get_db_session", mock_get_db_session)
    
    # Also mock get_engine to prevent DATABASE_URL_TUTORIAL lookup
    def mock_get_engine():
        return MagicMock()
    
    monkeypatch.setattr(database, "get_engine", mock_get_engine)
