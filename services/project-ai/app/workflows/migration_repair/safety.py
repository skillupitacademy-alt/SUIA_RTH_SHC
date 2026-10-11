"""
Database safety validation for migration repair workflow.

Implements production database protection and environment validation.
"""

from dataclasses import dataclass
from enum import StrEnum


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
