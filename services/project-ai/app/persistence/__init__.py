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

__all__ = [
    "get_db_session",
    "validate_database_connectivity",
    "close_db",
    "get_engine",
]
