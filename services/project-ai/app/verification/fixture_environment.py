"""Explicit database permission boundary for owned learner verification fixtures."""

import os
from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.verification.fixture_registry import FixtureBlockedError


def verification_database_url() -> str:
    url = os.environ.get("PROJECT_LLM_VERIFICATION_DATABASE_URL", "")
    if not url:
        raise FixtureBlockedError("PROJECT_LLM_VERIFICATION_DATABASE_URL is not configured")
    if os.environ.get("PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED") != "true":
        raise FixtureBlockedError("Verification database requires explicit permission for dedicated fixture writes")
    if os.environ.get("ENVIRONMENT", "").lower() in ("production", "prod") and os.environ.get("PROJECT_LLM_LOCAL_VERIFICATION") != "true":
        raise FixtureBlockedError("Production-labelled environments require explicit local-verification opt-in")
    parsed = urlparse(url.replace("postgresql+asyncpg://", "postgresql://", 1))
    if parsed.scheme != "postgresql" or not parsed.hostname:
        raise FixtureBlockedError("Verification database must be an explicit PostgreSQL URL")
    return url


def fixture_session_factory():
    # Never fall back to Project AI's workflow/authoring database connection.
    url = verification_database_url()
    from sqlalchemy.engine import make_url
    parsed = make_url(url).set(drivername="postgresql+asyncpg")
    ssl_required = parsed.query.get("sslmode") == "require"
    parsed = parsed.difference_update_query(["sslmode", "channel_binding"])
    engine = create_async_engine(parsed, connect_args={"ssl": True} if ssl_required else {})
    return engine, async_sessionmaker(engine, expire_on_commit=False)
