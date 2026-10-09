"""
Unit tests for JWT configuration module.

Tests dual-secret config loading with JWT_SECRET and ADMIN_JWT_SECRET.
"""

import os

import pytest

from app.auth.config import get_jwt_config


@pytest.fixture(autouse=True)
def clean_jwt_env():
    """Clean JWT environment variables before and after each test."""
    env_vars = ["JWT_SECRET", "ADMIN_JWT_SECRET", "JWT_ALGORITHM", "JWT_ACCESS_TOKEN_EXPIRE_MINUTES"]
    for var in env_vars:
        if var in os.environ:
            del os.environ[var]
    yield
    for var in env_vars:
        if var in os.environ:
            del os.environ[var]


def test_get_jwt_config_with_both_secrets():
    """Test config loading with both JWT_SECRET and ADMIN_JWT_SECRET set."""
    os.environ["JWT_SECRET"] = "user_secret_key_at_least_32_characters_long"
    os.environ["ADMIN_JWT_SECRET"] = "admin_secret_key_at_least_32_characters_long"
    
    config = get_jwt_config()
    
    assert config["user_secret"] == "user_secret_key_at_least_32_characters_long"
    assert config["admin_secret"] == "admin_secret_key_at_least_32_characters_long"
    assert config["algorithm"] == "HS256"  # Default
    assert config["access_token_expire_minutes"] == 30  # Default


def test_get_jwt_config_admin_secret_fallback():
    """Test ADMIN_JWT_SECRET falls back to JWT_SECRET (matching SHC pattern)."""
    os.environ["JWT_SECRET"] = "shared_secret_key_at_least_32_characters_long"
    
    config = get_jwt_config()
    
    assert config["user_secret"] == "shared_secret_key_at_least_32_characters_long"
    assert config["admin_secret"] == "shared_secret_key_at_least_32_characters_long"


def test_get_jwt_config_missing_jwt_secret():
    """Test ValueError raised when JWT_SECRET is missing."""
    with pytest.raises(ValueError) as exc_info:
        get_jwt_config()
    
    assert "JWT_SECRET environment variable is required" in str(exc_info.value)


def test_get_jwt_config_jwt_secret_too_short():
    """Test ValueError raised when JWT_SECRET is less than 32 characters."""
    os.environ["JWT_SECRET"] = "too_short"
    
    with pytest.raises(ValueError) as exc_info:
        get_jwt_config()
    
    assert "JWT_SECRET must be at least 32 characters long" in str(exc_info.value)
    assert "Current length: 9" in str(exc_info.value)


def test_get_jwt_config_admin_secret_too_short():
    """Test ValueError raised when ADMIN_JWT_SECRET is less than 32 characters."""
    os.environ["JWT_SECRET"] = "user_secret_key_at_least_32_characters_long"
    os.environ["ADMIN_JWT_SECRET"] = "short"
    
    with pytest.raises(ValueError) as exc_info:
        get_jwt_config()
    
    assert "ADMIN_JWT_SECRET must be at least 32 characters long" in str(exc_info.value)
    assert "Current length: 5" in str(exc_info.value)


def test_get_jwt_config_custom_algorithm():
    """Test config with custom JWT_ALGORITHM."""
    os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long"
    os.environ["JWT_ALGORITHM"] = "HS512"
    
    config = get_jwt_config()
    
    assert config["algorithm"] == "HS512"


def test_get_jwt_config_custom_expiry():
    """Test config with custom JWT_ACCESS_TOKEN_EXPIRE_MINUTES."""
    os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long"
    os.environ["JWT_ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
    
    config = get_jwt_config()
    
    assert config["access_token_expire_minutes"] == 60


def test_get_jwt_config_all_custom_values():
    """Test config with all custom values."""
    os.environ["JWT_SECRET"] = "user_secret_key_at_least_32_characters_long"
    os.environ["ADMIN_JWT_SECRET"] = "admin_secret_key_at_least_32_characters_long"
    os.environ["JWT_ALGORITHM"] = "HS384"
    os.environ["JWT_ACCESS_TOKEN_EXPIRE_MINUTES"] = "120"
    
    config = get_jwt_config()
    
    assert config["user_secret"] == "user_secret_key_at_least_32_characters_long"
    assert config["admin_secret"] == "admin_secret_key_at_least_32_characters_long"
    assert config["algorithm"] == "HS384"
    assert config["access_token_expire_minutes"] == 120
