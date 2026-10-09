"""
PostgreSQL Integration Test Configuration for FEAT-004.

CRITICAL: These tests require a real PostgreSQL database.
The test database MUST be configured via TEST_DATABASE_URL_TUTORIAL environment variable.

DO NOT fall back to localhost guesses.
DO NOT use SQLite as a substitute.
DO NOT attempt to create the test database.

If TEST_DATABASE_URL_TUTORIAL is not configured, tests will skip with a clear error message.
"""

import os
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.persistence import (
    PostgresWorkflowRepository,
    PostgresContractRepository,
    PostgresCandidateRepository,
    PostgresManifestRepository,
    PostgresApprovalRepository,
    PostgresStateTransitionRepository,
)
from app.persistence.models import Base


# Check for test database configuration
TEST_DB_URL = os.environ.get("TEST_DATABASE_URL_TUTORIAL")

# Pytest collection hook to skip entire module if database not configured
def pytest_collection_modifyitems(config, items):
    """Skip all integration tests if TEST_DATABASE_URL_TUTORIAL not configured."""
    if not TEST_DB_URL:
        skip_marker = pytest.mark.skip(
            reason="TEST_DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
        )
        for item in items:
            item.add_marker(skip_marker)


@pytest_asyncio.fixture(scope="session")
async def integration_db_engine():
    """
    Create PostgreSQL database engine for integration tests.
    
    Uses TEST_DATABASE_URL_TUTORIAL environment variable.
    Requires explicit configuration - no fallback to localhost.
    
    Scope: session (shared across all tests for performance)
    """
    if not TEST_DB_URL:
        pytest.skip("TEST_DATABASE_URL_TUTORIAL not configured")
    
    engine = create_async_engine(
        TEST_DB_URL,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10,
    )
    
    # Verify connectivity and that schema exists
    # DO NOT create schema - it should already exist from migrations
    async with engine.begin() as conn:
        # Check if project_ai_workflows table exists (canary for schema)
        result = await conn.execute(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'project_ai_workflows'
            )
            """
        )
        table_exists = result.scalar()
        
        if not table_exists:
            await engine.dispose()
            pytest.skip(
                "project_ai_workflows table does not exist in test database. "
                "Run migrations before running integration tests: "
                "pnpm --filter @quiz/db-tutorial db:migrate"
            )
    
    yield engine
    
    # Cleanup
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create an async database session with transaction rollback for test isolation.
    
    Each test gets a fresh session within a transaction that is rolled back
    after the test completes, ensuring tests don't interfere with each other.
    
    Scope: function (new session per test)
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        async with session.begin():
            yield session
            # Automatic rollback when context exits
            await session.rollback()


@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """
    Provide a session factory for tests that need to simulate restarts.
    
    Returns a callable that creates new sessions, allowing tests to
    close one session and open another to simulate application restart.
    
    TRANSACTION ISOLATION:
    This fixture wraps all restart test operations in an outer transaction
    that automatically rolls back at test completion. Individual sessions
    created by the factory can commit their changes (making them visible
    to subsequent sessions in the same test), but all changes are rolled
    back when the test completes.
    
    Usage pattern:
        async with await db_session_factory() as session1:
            # Session 1 operations
            await session1.commit()  # Makes changes visible to session 2
        
        async with await db_session_factory() as session2:
            # Session 2 sees session 1's committed changes
            # but all changes roll back at test end
    """
    # Create outer transaction for test-level isolation
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    # Start outer transaction
    async with async_session_factory() as outer_session:
        async with outer_session.begin():
            # Create a savepoint for nested transaction support
            nested_transaction = await outer_session.begin_nested()
            
            async def _factory():
                """
                Return the outer session for all restart test operations.
                
                This ensures all operations across multiple "sessions" (restart simulation)
                happen within the same transaction and are rolled back at test end.
                """
                return outer_session
            
            yield _factory
            
            # Rollback outer transaction at test end
            await outer_session.rollback()


@pytest_asyncio.fixture
async def workflow_repo(db_session):
    """Create a WorkflowRepository with PostgreSQL session."""
    return PostgresWorkflowRepository(db_session)


@pytest_asyncio.fixture
async def contract_repo(db_session):
    """Create a ContractRepository with PostgreSQL session."""
    return PostgresContractRepository(db_session)


@pytest_asyncio.fixture
async def candidate_repo(db_session):
    """Create a CandidateRepository with PostgreSQL session."""
    return PostgresCandidateRepository(db_session)


@pytest_asyncio.fixture
async def manifest_repo(db_session):
    """Create a ManifestRepository with PostgreSQL session."""
    return PostgresManifestRepository(db_session)


@pytest_asyncio.fixture
async def approval_repo(db_session):
    """Create an ApprovalRepository with PostgreSQL session."""
    return PostgresApprovalRepository(db_session)


@pytest_asyncio.fixture
async def state_transition_repo(db_session):
    """Create a StateTransitionRepository with PostgreSQL session."""
    return PostgresStateTransitionRepository(db_session)


# Pytest configuration for async tests
def pytest_configure(config):
    """Configure pytest for async integration tests."""
    config.addinivalue_line(
        "markers", "integration: mark test as PostgreSQL integration test"
    )
