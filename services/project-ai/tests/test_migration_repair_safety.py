"""
Unit tests for migration repair workflow database safety.

Verifies production database protection and validation logic.
"""

import pytest

from app.workflows.migration_repair.safety import (
    DatabaseMode,
    DatabaseTarget,
    validate_target,
    FORBIDDEN_PRODUCTION_MARKERS,
)


def test_database_mode_enum():
    """Test DatabaseMode enum values."""
    assert DatabaseMode.VERIFY == "VERIFY"
    assert DatabaseMode.MIGRATE == "MIGRATE"
    assert DatabaseMode.READONLY == "READONLY"


def test_forbidden_production_markers():
    """Test FORBIDDEN_PRODUCTION_MARKERS contains expected values."""
    assert "tutorial_prod" in FORBIDDEN_PRODUCTION_MARKERS
    assert "neon-prod" in FORBIDDEN_PRODUCTION_MARKERS
    assert "production" in FORBIDDEN_PRODUCTION_MARKERS
    assert "prod" in FORBIDDEN_PRODUCTION_MARKERS
    assert "_prod" in FORBIDDEN_PRODUCTION_MARKERS
    assert "-prod" in FORBIDDEN_PRODUCTION_MARKERS


def test_database_target_safe_test_db():
    """Test DatabaseTarget with safe test database."""
    target = DatabaseTarget(
        url="postgresql://localhost:55432/test_tutorial",
        name="test_tutorial",
        mode=DatabaseMode.VERIFY,
        env="test"
    )
    
    assert target.name == "test_tutorial"
    assert target.mode == DatabaseMode.VERIFY
    assert target.env == "test"


def test_database_target_readonly_production_allowed():
    """Test DatabaseTarget allows READONLY mode for production."""
    target = DatabaseTarget(
        url="postgresql://neon.tech/tutorial_prod",
        name="tutorial_prod",
        mode=DatabaseMode.READONLY,
        env="production"
    )
    
    # READONLY mode should not raise even with production database
    assert target.name == "tutorial_prod"
    assert target.mode == DatabaseMode.READONLY


def test_database_target_rejects_verify_tutorial_prod():
    """Test DatabaseTarget rejects tutorial_prod in VERIFY mode."""
    with pytest.raises(ValueError, match="Production database 'tutorial_prod' cannot be used in VERIFY mode"):
        DatabaseTarget(
            url="postgresql://localhost/tutorial_prod",
            name="tutorial_prod",
            mode=DatabaseMode.VERIFY,
            env="production"
        )


def test_database_target_rejects_verify_neon_prod():
    """Test DatabaseTarget rejects neon-prod in VERIFY mode."""
    with pytest.raises(ValueError, match="cannot be used in VERIFY mode"):
        DatabaseTarget(
            url="postgresql://neon.tech/neon-prod",
            name="neon-prod",
            mode=DatabaseMode.VERIFY,
            env="production"
        )


def test_database_target_rejects_verify_production():
    """Test DatabaseTarget rejects database with 'production' in name."""
    with pytest.raises(ValueError, match="cannot be used in VERIFY mode"):
        DatabaseTarget(
            url="postgresql://localhost/my_production_db",
            name="my_production_db",
            mode=DatabaseMode.VERIFY,
            env="production"
        )


def test_database_target_rejects_verify_underscore_prod():
    """Test DatabaseTarget rejects database with '_prod' suffix."""
    with pytest.raises(ValueError, match="cannot be used in VERIFY mode"):
        DatabaseTarget(
            url="postgresql://localhost/tutorial_prod",
            name="tutorial_prod",
            mode=DatabaseMode.VERIFY,
            env="production"
        )


def test_database_target_case_insensitive():
    """Test DatabaseTarget validation is case-insensitive."""
    with pytest.raises(ValueError, match="cannot be used in VERIFY mode"):
        DatabaseTarget(
            url="postgresql://localhost/TUTORIAL_PROD",
            name="TUTORIAL_PROD",
            mode=DatabaseMode.VERIFY,
            env="production"
        )


def test_validate_target_safe_test_db():
    """Test validate_target passes for safe test database."""
    target = DatabaseTarget(
        url="postgresql://localhost:55432/test_tutorial",
        name="test_tutorial",
        mode=DatabaseMode.VERIFY,
        env="test"
    )
    
    # Should not raise
    validate_target(target)


def test_validate_target_rejects_verify_production():
    """Test validate_target rejects VERIFY mode with production database."""
    target = DatabaseTarget(
        url="postgresql://neon.tech/tutorial_prod",
        name="tutorial_prod",
        mode=DatabaseMode.READONLY,  # Bypass __post_init__ check
        env="production"
    )
    target.mode = DatabaseMode.VERIFY  # Manually set to VERIFY
    
    with pytest.raises(ValueError, match="cannot be used in VERIFY mode"):
        validate_target(target)


def test_validate_target_rejects_migrate_production():
    """Test validate_target rejects MIGRATE mode with production environment."""
    target = DatabaseTarget(
        url="postgresql://localhost/test_db",
        name="test_db",
        mode=DatabaseMode.MIGRATE,
        env="production"
    )
    
    with pytest.raises(ValueError, match="requires explicit human approval"):
        validate_target(target)


def test_validate_target_invalid_url():
    """Test validate_target rejects invalid PostgreSQL URL."""
    target = DatabaseTarget(
        url="mysql://localhost/test_db",
        name="test_db",
        mode=DatabaseMode.VERIFY,
        env="test"
    )
    
    with pytest.raises(ValueError, match="Invalid PostgreSQL URL format"):
        validate_target(target)


def test_validate_target_allows_postgres_scheme():
    """Test validate_target accepts both postgresql:// and postgres:// schemes."""
    target1 = DatabaseTarget(
        url="postgresql://localhost/test_db",
        name="test_db",
        mode=DatabaseMode.VERIFY,
        env="test"
    )
    
    target2 = DatabaseTarget(
        url="postgres://localhost/test_db",
        name="test_db",
        mode=DatabaseMode.VERIFY,
        env="test"
    )
    
    # Both should pass
    validate_target(target1)
    validate_target(target2)


def test_validate_target_migrate_staging_allowed():
    """Test validate_target allows MIGRATE mode in staging environment."""
    target = DatabaseTarget(
        url="postgresql://staging.example.com/tutorial_staging",
        name="tutorial_staging",
        mode=DatabaseMode.MIGRATE,
        env="staging"
    )
    
    # Should not raise for staging
    validate_target(target)
