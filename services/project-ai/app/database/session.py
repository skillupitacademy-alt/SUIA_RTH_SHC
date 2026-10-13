"""
Database session management for Project AI.

ARCHITECTURAL RULES:
- All database operations are async (AsyncEngine, AsyncSession)
- Uses asyncpg driver for PostgreSQL
- NO schema mutations in application code (no create_all())
- Schema changes ONLY through Drizzle migrations
- Startup validates connectivity and table existence, does not create tables
- Uses DATABASE_URL_TUTORIAL environment variable (not DATABASE_URL)
"""

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text


# Declarative base for ORM models
Base = declarative_base()

# Global engine and session factory
_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_database_url() -> str:
    """
    Get database URL from environment.
    
    Uses DATABASE_URL_TUTORIAL to match TypeScript convention.
    
    Returns:
        PostgreSQL connection URL with asyncpg driver
        
    Raises:
        ValueError: If DATABASE_URL_TUTORIAL not set
    """
    database_url = os.environ.get("DATABASE_URL_TUTORIAL")
    
    if not database_url:
        raise ValueError(
            "DATABASE_URL_TUTORIAL environment variable not set. "
            "Expected format: postgresql://user:pass@host:port/tutorial_prod"
        )
    
    # Convert postgresql:// to postgresql+asyncpg:// if needed
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not database_url.startswith("postgresql+asyncpg://"):
        raise ValueError(
            f"Invalid DATABASE_URL_TUTORIAL format. "
            "Expected postgresql:// or postgresql+asyncpg://"
        )
    
    return database_url


def get_engine() -> AsyncEngine:
    """
    Get or create the async database engine.
    
    Returns:
        Singleton AsyncEngine instance
    """
    global _engine
    
    if _engine is None:
        database_url = get_database_url()
        _engine = create_async_engine(
            database_url,
            echo=False,  # Set to True for SQL logging in development
            pool_pre_ping=True,  # Verify connections before using
            pool_size=5,
            max_overflow=10,
        )
    
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Get or create the async session factory.
    
    Returns:
        Singleton async_sessionmaker instance
    """
    global _async_session_factory
    
    if _async_session_factory is None:
        engine = get_engine()
        _async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    
    return _async_session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions.
    
    Usage:
        @app.get("/example")
        async def example(db: AsyncSession = Depends(get_db_session)):
            result = await db.execute(select(WorkflowModel))
            ...
    
    Yields:
        AsyncSession instance
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def validate_database_connectivity() -> bool:
    """
    Validate database connectivity without mutating schema.
    
    Performs:
    - Connection test
    - Table existence checks for all project_ai_* tables
    
    Returns:
        True if all validations pass
        
    Raises:
        ConnectionError: If database unreachable
        RuntimeError: If required tables missing
    """
    engine = get_engine()
    
    # Test basic connectivity
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        raise ConnectionError(
            f"Failed to connect to database: {e}. "
            "Verify DATABASE_URL_TUTORIAL and PostgreSQL availability."
        ) from e
    
    # Verify required tables exist
    required_tables = [
        "project_ai_workflows",
        "project_ai_state_transitions",
        "project_ai_contracts",
        "project_ai_candidates",
        "project_ai_manifests",
        "project_ai_approvals",
    ]
    
    async with engine.connect() as conn:
        for table_name in required_tables:
            result = await conn.execute(
                text(
                    "SELECT EXISTS ("
                    "  SELECT FROM information_schema.tables "
                    "  WHERE table_schema = 'public' "
                    "  AND table_name = :table_name"
                    ")"
                ),
                {"table_name": table_name}
            )
            exists = result.scalar()
            
            if not exists:
                raise RuntimeError(
                    f"Required table '{table_name}' not found in database. "
                    f"Run Drizzle migration: pnpm --filter @quiz/db-tutorial db:migrate"
                )
    
    return True


async def close_db() -> None:
    """
    Close database connections and dispose engine.
    
    Call during application shutdown.
    """
    global _engine, _async_session_factory
    
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _async_session_factory = None
