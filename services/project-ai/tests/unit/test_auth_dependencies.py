"""
Unit tests for RBAC dependency injection module.

Tests get_current_user and role requirement functions.
"""

import os
from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.auth.dependencies import (
    get_current_user,
    require_contract_admin,
    require_contract_reviewer,
    require_contract_viewer,
)
from app.auth.jwt import create_access_token


@pytest.fixture(autouse=True)
def set_jwt_env():
    """Set JWT_SECRET for all tests in this module."""
    os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long_for_testing"
    yield
    if "JWT_SECRET" in os.environ:
        del os.environ["JWT_SECRET"]


def test_get_current_user_valid():
    """Test extracting user from valid Bearer token."""
    data = {
        "sub": "user123",
        "aud": "user",
        "tokenType": "user",
        "userId": "user123",
        "originalUserId": "user123",
        "shadowUserId": "user123",
        "roles": ["contract_viewer"]
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    assert user["user_id"] == "user123"
    assert user["roles"] == ["contract_viewer"]
    assert user["token_type"] == "user"
    assert user["is_admin"] is False


def test_get_current_user_with_userid_only():
    """Test extracting user from token with userId claim only (no sub).
    
    Real SHC tokens use 'userId' as the primary identifier, not 'sub'.
    This test ensures tokens with only userId (without sub) work correctly.
    """
    data = {
        "aud": "user",
        "tokenType": "user",
        "userId": "user456",
        "originalUserId": "user456",
        "shadowUserId": "user456",
        "roles": ["contract_admin"]
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    user = get_current_user(authorization)
    
    assert user["user_id"] == "user456"
    assert user["roles"] == ["contract_admin"]
    assert user["token_type"] == "user"
    assert user["is_admin"] is False


def test_get_current_user_missing_header():
    """Test that missing authorization header raises HTTPException 401."""
    with pytest.raises(HTTPException) as exc_info:
        get_current_user("")
    
    assert exc_info.value.status_code == 401
    assert "Missing authorization header" in exc_info.value.detail


def test_get_current_user_invalid_token():
    """Test that invalid token raises HTTPException 401."""
    authorization = "Bearer invalid.token.here"
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(authorization)
    
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


def test_require_contract_admin_success():
    """Test require_contract_admin with valid admin role."""
    user = {
        "user_id": "admin1",
        "roles": ["contract_admin"],
        "original_user_id": "admin1",
        "shadow_user_id": "admin1"
    }
    
    result = require_contract_admin(user)
    
    assert result == user


def test_require_contract_admin_missing_role():
    """Test require_contract_admin without admin role raises HTTPException 403."""
    user = {
        "user_id": "viewer1",
        "roles": ["contract_viewer"],
        "original_user_id": "viewer1",
        "shadow_user_id": "viewer1"
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_contract_admin(user)
    
    assert exc_info.value.status_code == 403
    assert "Requires contract_admin role" in exc_info.value.detail


def test_require_contract_viewer_accepts_any_role():
    """Test require_contract_viewer accepts viewer, reviewer, or admin roles."""
    # Test with viewer role
    viewer = {
        "user_id": "viewer1",
        "roles": ["contract_viewer"],
        "original_user_id": "viewer1",
        "shadow_user_id": "viewer1"
    }
    assert require_contract_viewer(viewer) == viewer
    
    # Test with reviewer role
    reviewer = {
        "user_id": "reviewer1",
        "roles": ["contract_reviewer"],
        "original_user_id": "reviewer1",
        "shadow_user_id": "reviewer1"
    }
    assert require_contract_viewer(reviewer) == reviewer
    
    # Test with admin role
    admin = {
        "user_id": "admin1",
        "roles": ["contract_admin"],
        "original_user_id": "admin1",
        "shadow_user_id": "admin1"
    }
    assert require_contract_viewer(admin) == admin
    
    # Test with no contract role - should fail
    no_role = {
        "user_id": "user1",
        "roles": ["some_other_role"],
        "original_user_id": "user1",
        "shadow_user_id": "user1"
    }
    with pytest.raises(HTTPException) as exc_info:
        require_contract_viewer(no_role)
    
    assert exc_info.value.status_code == 403
    assert "Requires contract_viewer, contract_reviewer, or contract_admin role" in exc_info.value.detail


def test_require_contract_reviewer_accepts_admin():
    """Test require_contract_reviewer accepts both reviewer and admin roles."""
    # Test with reviewer role
    reviewer = {
        "user_id": "reviewer1",
        "roles": ["contract_reviewer"],
        "original_user_id": "reviewer1",
        "shadow_user_id": "reviewer1"
    }
    assert require_contract_reviewer(reviewer) == reviewer
    
    # Test with admin role (hierarchy: admin can do reviewer tasks)
    admin = {
        "user_id": "admin1",
        "roles": ["contract_admin"],
        "original_user_id": "admin1",
        "shadow_user_id": "admin1"
    }
    assert require_contract_reviewer(admin) == admin
    
    # Test with only viewer role - should fail
    viewer = {
        "user_id": "viewer1",
        "roles": ["contract_viewer"],
        "original_user_id": "viewer1",
        "shadow_user_id": "viewer1"
    }
    with pytest.raises(HTTPException) as exc_info:
        require_contract_reviewer(viewer)
    
    assert exc_info.value.status_code == 403
    assert "Requires contract_reviewer or contract_admin role" in exc_info.value.detail


def test_get_current_user_invalid_format():
    """Test that invalid authorization header format raises HTTPException 401."""
    # Missing "Bearer" prefix
    with pytest.raises(HTTPException) as exc_info:
        get_current_user("InvalidFormat token")
    
    assert exc_info.value.status_code == 401
    assert "Invalid authorization header format" in exc_info.value.detail
    
    # Only token without Bearer
    with pytest.raises(HTTPException) as exc_info:
        get_current_user("justtoken")
    
    assert exc_info.value.status_code == 401
    assert "Invalid authorization header format" in exc_info.value.detail


def test_require_functions_with_none_user():
    """Test that all require functions work with empty roles."""
    # With Depends() chain, these functions now expect a valid user dict
    # Test with user that has no contract roles
    user_no_roles = {
        "user_id": "user1",
        "roles": [],
        "original_user_id": "user1",
        "shadow_user_id": "user1"
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_contract_admin(user_no_roles)
    assert exc_info.value.status_code == 403
    
    with pytest.raises(HTTPException) as exc_info:
        require_contract_reviewer(user_no_roles)
    assert exc_info.value.status_code == 403
    
    with pytest.raises(HTTPException) as exc_info:
        require_contract_viewer(user_no_roles)
    assert exc_info.value.status_code == 403


def test_user_id_guaranteed_by_jwt():
    """
    Test that get_current_user guarantees user_id from JWT.
    
    SECURITY FIX (FEAT-002): Verifies that user_id extraction from JWT is
    guaranteed by the authentication layer. This test proves that:
    1. get_current_user always returns a user_id field
    2. user_id is extracted from the verified JWT userId claim
    3. user_id is a non-empty string
    4. Route handlers can safely use user['user_id'] without KeyError risk
    
    This guarantee is enforced by decode_access_token() in app/auth/jwt.py,
    which validates the userId claim before returning the payload.
    """
    # Create valid JWT token with userId claim (and required identity claims)
    data = {
        "aud": "user",
        "tokenType": "user",
        "userId": "test_user_789",
        "originalUserId": "test_user_789",
        "shadowUserId": "test_user_789",
        "roles": []
    }
    token = create_access_token(data)
    authorization = f"Bearer {token}"
    
    # Call get_current_user
    user = get_current_user(authorization)
    
    # Assert user_id is present and matches expected value
    assert "user_id" in user, "user_id must be present in AuthenticatedPrincipal"
    assert user["user_id"] == "test_user_789", "user_id must match JWT userId claim"
    assert isinstance(user["user_id"], str), "user_id must be a string"
    assert len(user["user_id"]) > 0, "user_id must be non-empty"
