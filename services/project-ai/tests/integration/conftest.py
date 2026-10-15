"""
PostgreSQL Integration Test Configuration for FEAT-004.

CRITICAL: These tests require a real PostgreSQL database.
The test database MUST be configured via DATABASE_URL_TUTORIAL environment variable.

DO NOT fall back to localhost guesses.
DO NOT use SQLite as a substitute.
DO NOT attempt to create the test database.

If DATABASE_URL_TUTORIAL is not configured, tests will skip with a clear error message.
"""

import os
from pathlib import Path
from urllib.parse import urlparse
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

from app.persistence import (
    PostgresWorkflowRepository,
    PostgresContractRepository,
    PostgresCandidateRepository,
    PostgresManifestRepository,
    PostgresApprovalRepository,
    PostgresStateTransitionRepository,
)
from app.persistence.models import Base


def _get_test_db_url() -> str | None:
    """Get DATABASE_URL_TUTORIAL at runtime (not import time)."""
    return os.environ.get("DATABASE_URL_TUTORIAL")


def _verify_database_environment(db_url: str) -> str:
    """
    Parse and validate the database URL before connecting.

    Checks:
    - Database name is parseable from the URL.
    - Database name is in the approved allow-list.

    Does NOT check:
    - Actual connected database identity (done in integration_db_engine after connect).
    - Role privileges or write permissions.

    This guard catches accidental misconfiguration. It does NOT enforce
    role-based access control or prevent privilege escalation.

    Returns:
        The parsed database name for downstream identity verification.
    """
    try:
        parsed = urlparse(db_url)
        # Extract database name from path (remove leading slash and query params)
        db_name = parsed.path.lstrip("/").split("?")[0] if parsed.path else "unknown"
        host = parsed.hostname or "unknown"
    except Exception as e:
        pytest.fail(f"Failed to parse DATABASE_URL_TUTORIAL: {e}")
    
    print(f"[integration] URL-parsed database name: '{db_name}' on host '{host}'")
    
    allowed = {"tutorial_prod", "project_ai_test", "tutorial_test"}
    if db_name not in allowed:
        pytest.fail(
            f"Unexpected database name '{db_name}'. "
            f"Allowed: {', '.join(sorted(allowed))}. "
            "Set DATABASE_URL_TUTORIAL to an approved database."
        )
    
    return db_name


# Pytest collection hook to skip entire module if database not configured
def pytest_collection_modifyitems(config, items):
    """Skip all integration tests if DATABASE_URL_TUTORIAL not configured."""
    # Check environment at RUNTIME, not import time, so dotenv has loaded
    if not _get_test_db_url():
        skip_marker = pytest.mark.skip(
            reason="DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
        )
        for item in items:
            item.add_marker(skip_marker)


@pytest_asyncio.fixture(scope="function")
async def integration_db_engine():
    """
    Create PostgreSQL database engine for integration tests.
    
    Uses DATABASE_URL_TUTORIAL environment variable.
    Requires explicit configuration - no fallback to localhost.
    
    Scope: function (per-test isolation)
    """
    db_url_raw = _get_test_db_url()
    if not db_url_raw:
        pytest.skip("DATABASE_URL_TUTORIAL not configured")
    
    # Verify database environment before connecting (returns parsed db name)
    expected_db_name = _verify_database_environment(db_url_raw)
    
    # Convert postgresql:// to postgresql+asyncpg:// for SQLAlchemy async engine
    # Remove query parameters that are not compatible with asyncpg (sslmode, channel_binding)
    # asyncpg uses ssl='require' instead of sslmode=require
    db_url = db_url_raw
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Remove incompatible query parameters from URL
    # sslmode and channel_binding are handled by asyncpg differently
    if "?" in db_url:
        base_url, query_string = db_url.split("?", 1)
        # Filter out sslmode and channel_binding parameters
        params = [p for p in query_string.split("&") if not p.startswith(("sslmode=", "channel_binding="))]
        if params:
            db_url = f"{base_url}?{'&'.join(params)}"
        else:
            db_url = base_url
    
    engine = create_async_engine(
        db_url,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10,
        connect_args={"ssl": "require"},  # asyncpg SSL requirement
    )
    
    # Verify connectivity and that schema exists
    # DO NOT create schema - it should already exist from migrations
    async with engine.begin() as conn:
        # Check if project_ai_workflows table exists (canary for schema)
        result = await conn.execute(
            text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'project_ai_workflows'
            )
            """)
        )
        table_exists = result.scalar()
        
        if not table_exists:
            await engine.dispose()
            pytest.skip(
                "project_ai_workflows table does not exist in test database. "
                "Run migrations before running integration tests: "
                "pnpm --filter @quiz/db-tutorial db:migrate"
            )
        
        # Verify actual connected database identity
        result = await conn.execute(text("SELECT current_database(), current_user"))
        actual_db, actual_user = result.fetchone()
        
        print(f"[integration] Connected to database: '{actual_db}', user: '{actual_user}'")
        
        if actual_db != expected_db_name:
            await engine.dispose()
            pytest.fail(
                f"Database identity mismatch: URL says '{expected_db_name}' but "
                f"connected to '{actual_db}'. Check DATABASE_URL_TUTORIAL."
            )
        # Note: This guard does NOT verify role privileges or table permissions.
        # tutorial_prod is user-confirmed as a development database authorized for testing.
    
    yield engine
    
    # Cleanup
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create async session with connection-level transaction rollback.

    ALL operations (including explicit session.commit() calls) are rolled
    back at test completion. The session is bound to an explicit connection
    transaction that controls the rollback boundary.

    join_transaction_mode="create_savepoint" makes session.commit() issue
    SAVEPOINT/RELEASE SAVEPOINT instead of COMMIT, so the outer connection
    transaction can still be rolled back unconditionally at teardown.

    Scope: function (new connection + transaction per test)
    """
    async with integration_db_engine.connect() as connection:
        async with connection.begin() as transaction:
            async_session_factory = async_sessionmaker(
                bind=connection,
                class_=AsyncSession,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            )
            async with async_session_factory() as session:
                yield session
            # Rollback the outer connection transaction — discards ALL changes
            # including anything the session committed as SAVEPOINTs.
            await transaction.rollback()


@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """
    Factory for tests that simulate application restarts.

    Each call to the returned factory function creates a NEW AsyncSession
    bound to the same underlying connection and outer transaction. Callers
    may close sessions and open new ones to simulate application restarts.

    Transaction isolation:
    - All sessions share one connection-level outer transaction.
    - session.commit() issues a SAVEPOINT/RELEASE (not a real COMMIT) because
      join_transaction_mode="create_savepoint".
    - Changes committed in one session are visible to later sessions on the
      same connection, simulating cross-restart visibility.
    - The outer transaction is rolled back at fixture teardown, discarding
      ALL changes regardless of how many sessions committed.

    SAVEPOINT note: PostgreSQL sequence increments are NOT rolled back by
    savepoints. Tests must only assert on row presence/absence, not on
    sequence-derived values like serial PKs.
    
    Usage pattern:
        session1 = await db_session_factory()
        # Session 1 operations
        await session1.commit()  # SAVEPOINT/RELEASE (not real COMMIT)
        await session1.close()
        
        session2 = await db_session_factory()
        # Session 2 sees session 1's committed changes
        # but all changes roll back at test end
        await session2.close()
    """
    async with integration_db_engine.connect() as connection:
        async with connection.begin() as transaction:
            session_factory = async_sessionmaker(
                bind=connection,
                class_=AsyncSession,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            )

            async def _factory() -> AsyncSession:
                """Create and return a NEW session bound to the outer connection transaction."""
                return session_factory()

            yield _factory

            await transaction.rollback()


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
    """Load environment and configure pytest for async integration tests."""
    # Load .env.local BEFORE fixture evaluation so DATABASE_URL_TUTORIAL is available
    from dotenv import load_dotenv
    workspace_root = Path(__file__).parent.parent.parent.parent.parent  # Go up to quiz-platform/
    env_file = workspace_root / ".env.local"
    if env_file.exists():
        load_dotenv(env_file, override=True)
    
    config.addinivalue_line(
        "markers", "integration: mark test as PostgreSQL integration test"
    )
