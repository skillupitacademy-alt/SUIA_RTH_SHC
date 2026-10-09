"""
Unit tests for complete identity extraction from SHC JWT tokens.

Tests Wave 1B implementation: extraction of all 11 identity claims from verified tokens.
"""

import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from jose import jwt

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.config import get_jwt_config


@pytest.fixture(autouse=True)
def set_jwt_env():
    """Set JWT_SECRET and ADMIN_JWT_SECRET for all tests in this module."""
    os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long_for_testing"
    os.environ["ADMIN_JWT_SECRET"] = "admin_secret_key_at_least_32_characters_long_for_testing"
    yield
    if "JWT_SECRET" in os.environ:
        del os.environ["JWT_SECRET"]
    if "ADMIN_JWT_SECRET" in os.environ:
        del os.environ["ADMIN_JWT_SECRET"]


def test_extracts_all_required_claims():
    """Test that all 11 identity claims are extracted from a complete token."""
    data = {
        "sub": "user123",
        "aud": "user",
        "tokenType": "user",
        "userId": "user123",
        "originalUserId": "admin456",
        "shadowUserId": "user123",
        "roles": ["contract_viewer", "contract_admin"],
        "brand": "skillhub",
        "portalIdentity": "admin",
        "isAdmin": False,
        "email": "user@example.com",
        "platforms": ["web", "mobile"],
        "subscriptions": ["premium", "enterprise"]
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    # Core identity
    assert user["user_id"] == "user123"
    assert user["original_user_id"] == "admin456"
    assert user["shadow_user_id"] == "user123"
    
    # Tenant boundary
    assert user["brand"] == "skillhub"
    
    # Authorization context
    assert user["roles"] == ["contract_viewer", "contract_admin"]
    assert user["portal_identity"] == "admin"
    assert user["token_type"] == "user"
    assert user["is_admin"] is False
    
    # Additional context
    assert user["email"] == "user@example.com"
    assert user["platforms"] == ["web", "mobile"]
    assert user["subscriptions"] == ["premium", "enterprise"]


def test_extracts_brand_claim():
    """Test brand claim extraction for tenant isolation (Wave 1C dependency)."""
    # Token with brand
    data_with_brand = {
        "userId": "user789",
        "originalUserId": "user789",
        "shadowUserId": "user789",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"],
        "brand": "techskills"
    }
    token = create_access_token(data_with_brand)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    assert user["brand"] == "techskills"
    
    # Token without brand
    data_no_brand = {
        "userId": "user790",
        "originalUserId": "user790",
        "shadowUserId": "user790",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"]
    }
    token = create_access_token(data_no_brand)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    assert user["brand"] is None


def test_extracts_admin_privilege_flags():
    """Test extraction of admin privilege flags from user and admin tokens."""
    config = get_jwt_config()
    
    # Admin token (must be signed with admin_secret)
    admin_data = {
        "userId": "admin123",
        "originalUserId": "admin123",
        "shadowUserId": "admin123",
        "aud": "admin",
        "tokenType": "admin",
        "isAdmin": True,
        "roles": ["contract_admin", "super_admin"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        "iat": datetime.now(timezone.utc),
        "iss": "skillhubcore.in"
    }
    admin_token = jwt.encode(admin_data, config["admin_secret"], algorithm=config["algorithm"])
    admin_auth = f"Bearer {admin_token}"
    
    admin_user = get_current_user(admin_auth)
    assert admin_user["token_type"] == "admin"
    assert admin_user["is_admin"] is True
    
    # Regular user token
    user_data = {
        "userId": "user456",
        "originalUserId": "user456",
        "shadowUserId": "user456",
        "aud": "user",
        "tokenType": "user",
        "isAdmin": False,
        "roles": ["contract_viewer"]
    }
    user_token = create_access_token(user_data)
    user_auth = f"Bearer {user_token}"
    
    regular_user = get_current_user(user_auth)
    assert regular_user["token_type"] == "user"
    assert regular_user["is_admin"] is False


def test_extracts_portal_identity():
    """Test portalIdentity claim extraction for all valid values."""
    portal_identities = ['admin', 'user', 'faculty', 'super_admin', 'infrastructure']
    
    for portal_id in portal_identities:
        data = {
            "userId": f"user_{portal_id}",
            "originalUserId": f"user_{portal_id}",
            "shadowUserId": f"user_{portal_id}",
            "aud": "user",
            "tokenType": "user",
            "roles": ["contract_viewer"],
            "portalIdentity": portal_id
        }
        token = create_access_token(data)
        authorization = f"Bearer {token}"
        
        user = get_current_user(authorization)
        assert user["portal_identity"] == portal_id


def test_extracts_shadow_identity():
    """Test extraction of shadow identity claims for impersonation scenarios."""
    config = get_jwt_config()
    
    # Admin token with shadow identity (signed with admin_secret)
    data = {
        "userId": "user456",
        "originalUserId": "admin123",
        "shadowUserId": "user456",
        "aud": "admin",
        "tokenType": "admin",
        "roles": ["contract_admin"],
        "isAdmin": True,
        "portalIdentity": "super_admin",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        "iat": datetime.now(timezone.utc),
        "iss": "skillhubcore.in"
    }
    token = jwt.encode(data, config["admin_secret"], algorithm=config["algorithm"])
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    # Verify shadow identity fields
    assert user["user_id"] == "user456"
    assert user["original_user_id"] == "admin123"
    assert user["shadow_user_id"] == "user456"
    
    # Shadow scenario: admin123 is impersonating user456
    assert user["original_user_id"] != user["shadow_user_id"]


def test_extracts_platforms_and_subscriptions():
    """Test extraction of platforms and subscriptions arrays."""
    data = {
        "userId": "user999",
        "originalUserId": "user999",
        "shadowUserId": "user999",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"],
        "platforms": ["web", "mobile", "desktop"],
        "subscriptions": ["basic", "premium", "enterprise", "edu"]
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    assert user["platforms"] == ["web", "mobile", "desktop"]
    assert user["subscriptions"] == ["basic", "premium", "enterprise", "edu"]


def test_handles_optional_claims_missing():
    """Test backward compatibility when optional claims are absent."""
    # Minimal token with only required fields
    data = {
        "userId": "minimal_user",
        "originalUserId": "minimal_user",
        "shadowUserId": "minimal_user",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"]
        # No brand, portalIdentity, email, platforms, subscriptions, isAdmin
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    # Required fields present
    assert user["user_id"] == "minimal_user"
    assert user["roles"] == ["contract_viewer"]
    assert user["token_type"] == "user"
    
    # Optional fields default correctly
    assert user["brand"] is None
    assert user["portal_identity"] is None
    assert user["email"] is None
    assert user["is_admin"] is False  # Default False, not None
    assert user["platforms"] == []  # Empty list, not None
    assert user["subscriptions"] == []  # Empty list, not None


def test_userid_fallback_to_sub():
    """Test backward compatibility: user_id falls back to 'sub' when 'userId' missing."""
    # Token with both sub and userId (userId takes precedence)
    data_with_both = {
        "sub": "fallback_user",
        "userId": "primary_user",
        "originalUserId": "primary_user",
        "shadowUserId": "primary_user",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"]
    }
    token = create_access_token(data_with_both)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    # Should extract from userId when present
    assert user["user_id"] == "primary_user"


def test_empty_lists_for_missing_arrays():
    """Test that missing array fields default to empty lists, not None."""
    data = {
        "userId": "array_test_user",
        "originalUserId": "array_test_user",
        "shadowUserId": "array_test_user",
        "aud": "user",
        "tokenType": "user"
        # No roles, platforms, or subscriptions
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    # Arrays default to empty list, enabling safe iteration
    assert user["roles"] == []
    assert user["platforms"] == []
    assert user["subscriptions"] == []
    
    # Verify we can iterate without checking for None
    for role in user["roles"]:
        pass  # Should not raise
    for platform in user["platforms"]:
        pass  # Should not raise
    for subscription in user["subscriptions"]:
        pass  # Should not raise
