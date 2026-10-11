"""
Database safety validation for migration repair workflow.

Implements production database protection and environment validation.

IMPORTANT: Name pattern checking (prod in name) is NOT sufficient. 
Must validate against trusted host/database allowlists.
"""

from dataclasses import dataclass
from enum import StrEnum
from typing import Any
from urllib.parse import urlparse
import asyncpg


class DatabaseMode(StrEnum):
    """Database operation mode."""
    VERIFY = "VERIFY"  # Running verification tests
    MIGRATE = "MIGRATE"  # Executing migrations
    READONLY = "READONLY"  # Read-only analysis


# Production database markers that must never be used in VERIFY mode
FORBIDDEN_PRODUCTION_MARKERS = (
    "tutorial_prod",
    "neon-prod",
    "production",
    "prod",
    "_prod",
    "-prod",
)

# Only these hosts are allowed for VERIFY mode
TRUSTED_TEST_HOSTS = frozenset([
    'localhost',
    '127.0.0.1',
    'test-postgres'
])

# Allowlist of test database names
TRUSTED_TEST_DATABASES = frozenset([
    'test_tutorial',
    'test_quiz_platform',
    'disposable_test_db'
])


def parse_database_url(url: str) -> dict[str, Any]:
    """
    Parse PostgreSQL database URL to extract components.
    
    Args:
        url: PostgreSQL connection URL
        
    Returns:
        Dictionary with host, port, database, user, password keys
        
    Raises:
        ValueError: If URL format is invalid
    """
    if not url.startswith(("postgresql://", "postgres://")):
        raise ValueError(f"Invalid PostgreSQL URL format: {url}")
    
    parsed = urlparse(url)
    
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "database": parsed.path.lstrip("/") if parsed.path else None,
        "user": parsed.username,
        "password": parsed.password,
    }


@dataclass
class DatabaseTarget:
    """Database connection target with safety metadata."""
    
    url: str
    name: str
    mode: DatabaseMode
    env: str  # e.g., "production", "staging", "test", "local"
    
    def __post_init__(self):
        """Validate database name does not contain production markers when appropriate."""
        if self.mode == DatabaseMode.VERIFY:
            # Never allow verification against production-like databases
            name_lower = self.name.lower()
            for marker in FORBIDDEN_PRODUCTION_MARKERS:
                if marker in name_lower:
                    raise ValueError(
                        f"Production database '{self.name}' cannot be used in VERIFY mode. "
                        f"Detected forbidden marker: '{marker}'"
                    )
            
            # Validate host against trusted allowlist
            try:
                parsed = parse_database_url(self.url)
                host = parsed["host"]
                if host not in TRUSTED_TEST_HOSTS:
                    raise ValueError(
                        f"Untrusted database host '{host}' for VERIFY mode. "
                        f"Only these hosts are allowed: {', '.join(sorted(TRUSTED_TEST_HOSTS))}"
                    )
            except ValueError:
                # Re-raise with context
                raise


def validate_target(target: DatabaseTarget) -> None:
    """
    Validate database target for safety.
    
    Args:
        target: Database target to validate
        
    Raises:
        ValueError: If target violates safety constraints
    """
    # Check production markers
    name_lower = target.name.lower()
    
    # VERIFY mode: never allow production databases
    if target.mode == DatabaseMode.VERIFY:
        for marker in FORBIDDEN_PRODUCTION_MARKERS:
            if marker in name_lower:
                raise ValueError(
                    f"Production database '{target.name}' cannot be used in VERIFY mode. "
                    f"Detected forbidden marker: '{marker}'"
                )
    
    # MIGRATE mode with production env: require explicit confirmation
    if target.mode == DatabaseMode.MIGRATE and target.env == "production":
        # This should be caught at orchestration level, not auto-executed
        raise ValueError(
            f"Production migration against '{target.name}' requires explicit human approval. "
            "This should not be auto-executed by repair workflow."
        )
    
    # Validate URL format
    if not target.url.startswith("postgresql://") and not target.url.startswith("postgres://"):
        raise ValueError(f"Invalid PostgreSQL URL format: {target.url}")


async def validate_and_connect(target: DatabaseTarget) -> asyncpg.Connection:
    """
    Validate database target and establish connection with pre-connection safety checks.
    
    This function implements defense-in-depth:
    1. Validates target using validate_target()
    2. Parses URL to extract host and database name
    3. Checks host against TRUSTED_TEST_HOSTS for VERIFY mode
    4. Checks database name against TRUSTED_TEST_DATABASES for VERIFY mode
    5. Validates credentials are isolated (not production credentials)
    6. Establishes connection only after all checks pass
    
    Fails closed: raises ValueError on any uncertainty or validation failure.
    
    Args:
        target: Database target to validate and connect to
        
    Returns:
        asyncpg.Connection object
        
    Raises:
        ValueError: If target fails any validation check
    """
    # Step 1: Validate target using existing validation
    validate_target(target)
    
    # Step 2: Parse URL to extract components
    try:
        parsed = parse_database_url(target.url)
    except ValueError as e:
        raise ValueError(f"Failed to parse database URL: {e}")
    
    host = parsed.get("host")
    database = parsed.get("database")
    user = parsed.get("user")
    
    # Step 3: Fail closed on missing components
    if not host:
        raise ValueError("Database host is missing from URL")
    if not database:
        raise ValueError("Database name is missing from URL")
    if not user:
        raise ValueError("Database user is missing from URL")
    
    # Step 4: For VERIFY mode, check host against TRUSTED_TEST_HOSTS
    if target.mode == DatabaseMode.VERIFY:
        if host not in TRUSTED_TEST_HOSTS:
            raise ValueError(
                f"Untrusted database host '{host}' for VERIFY mode. "
                f"Only these hosts are allowed: {', '.join(sorted(TRUSTED_TEST_HOSTS))}"
            )
        
        # Step 5: Check database name against TRUSTED_TEST_DATABASES
        if database not in TRUSTED_TEST_DATABASES:
            raise ValueError(
                f"Untrusted database name '{database}' for VERIFY mode. "
                f"Only these databases are allowed: {', '.join(sorted(TRUSTED_TEST_DATABASES))}"
            )
        
        # Step 6: Validate credentials are isolated (not production-like)
        user_lower = user.lower()
        if any(marker in user_lower for marker in FORBIDDEN_PRODUCTION_MARKERS):
            raise ValueError(
                f"Production-like database user '{user}' cannot be used in VERIFY mode"
            )
    
    # Step 7: Establish connection
    try:
        connection = await asyncpg.connect(target.url)
        return connection
    except Exception as e:
        raise ValueError(f"Failed to connect to database: {e}")

