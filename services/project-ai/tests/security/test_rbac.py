"""
Unit tests for RBAC (Role-Based Access Control) enforcement.

Tests Wave 1D implementation: role-based access control for privileged operations.
"""

import os
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.auth.authorization import is_super_admin, require_role, require_any_role
from app.auth.types import AuthenticatedPrincipal


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


# ============================================================================
# Category 1: RBAC Utility Tests (5 tests)
# ============================================================================

def test_require_role_with_correct_role():
    """Test that require_role passes when user has the exact role."""
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    require_role(principal, "contract_admin")


def test_require_role_without_role():
    """Test that require_role denies when user lacks the required role."""
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_viewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_role(principal, "contract_admin")
    
    assert exc_info.value.status_code == 403
    assert "contract_admin" in exc_info.value.detail


def test_require_any_role_with_one_match():
    """Test that require_any_role passes when user has at least one role."""
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_reviewer"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise (has contract_reviewer, one of the required roles)
    require_any_role(principal, ["contract_admin", "contract_reviewer"])


def test_super_admin_bypasses_rbac():
    """Test that super_admin role bypasses role checks."""
    principal: AuthenticatedPrincipal = {
        "user_id": "super_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["super_admin"],
        "portal_identity": None,
        "token_type": "admin",
        "is_admin": True,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise even though user doesn't have contract_admin role
    require_role(principal, "contract_admin")
    require_any_role(principal, ["contract_admin", "contract_reviewer"])


def test_missing_roles_claim_denies_access():
    """Test that users with empty roles list are denied access."""
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": [],  # Empty roles
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_role(principal, "contract_admin")
    
    assert exc_info.value.status_code == 403


# ============================================================================
# Category 2: Super Admin Detection Tests (3 tests)
# ============================================================================

def test_is_super_admin_via_role():
    """Test super_admin detection via role claim."""
    principal: AuthenticatedPrincipal = {
        "user_id": "super_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["super_admin"],
        "portal_identity": None,
        "token_type": "admin",
        "is_admin": True,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    assert is_super_admin(principal) is True


def test_is_super_admin_via_portal_identity():
    """Test super_admin detection via portal_identity claim."""
    # Test super_admin portal identity
    principal1: AuthenticatedPrincipal = {
        "user_id": "super_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": [],
        "portal_identity": "super_admin",
        "token_type": "admin",
        "is_admin": True,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    assert is_super_admin(principal1) is True
    
    # Test infrastructure portal identity
    principal2: AuthenticatedPrincipal = {
        "user_id": "infra_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": [],
        "portal_identity": "infrastructure",
        "token_type": "admin",
        "is_admin": True,
        "email": "infra@example.com",
        "platforms": [],
        "subscriptions": []
    }
    assert is_super_admin(principal2) is True


def test_is_super_admin_case_insensitive():
    """Test super_admin detection with case-insensitive role matching."""
    principal: AuthenticatedPrincipal = {
        "user_id": "super_user",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["Super_Admin"],  # Mixed case
        "portal_identity": None,
        "token_type": "admin",
        "is_admin": True,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    assert is_super_admin(principal) is True


# ============================================================================
# Category 3: Case-Insensitive Role Matching Tests (2 tests)
# ============================================================================

def test_require_role_case_insensitive():
    """Test that role matching is case-insensitive."""
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["Contract_Admin"],  # Mixed case
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise (case-insensitive match)
    require_role(principal, "contract_admin")


def test_require_any_role_case_insensitive():
    """Test that require_any_role uses case-insensitive matching."""
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["Contract_Reviewer"],  # Mixed case
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise (case-insensitive match)
    require_any_role(principal, ["contract_admin", "contract_reviewer"])


# ============================================================================
# Category 4: FastAPI Dependency Tests (4 tests)
# ============================================================================

@pytest.mark.asyncio
async def test_require_contract_admin_dependency_denies_insufficient_role():
    """Test that require_contract_admin FastAPI dependency denies insufficient roles."""
    from app.auth.dependencies import require_contract_admin
    
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_viewer"],  # Insufficient
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_contract_admin(principal)
    
    assert exc_info.value.status_code == 403
    assert "contract_admin" in exc_info.value.detail


@pytest.mark.asyncio
async def test_require_contract_admin_dependency_allows_correct_role():
    """Test that require_contract_admin FastAPI dependency allows contract_admin."""
    from app.auth.dependencies import require_contract_admin
    
    principal: AuthenticatedPrincipal = {
        "user_id": "admin123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": ["contract_admin"],
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "admin@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise
    result = require_contract_admin(principal)
    assert result == principal


@pytest.mark.asyncio
async def test_require_contract_admin_dependency_allows_super_admin():
    """Test that require_contract_admin allows super_admin bypass."""
    from app.auth.dependencies import require_contract_admin
    
    principal: AuthenticatedPrincipal = {
        "user_id": "super_admin",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": None,
        "roles": ["super_admin"],  # Super admin, no contract_admin
        "portal_identity": None,
        "token_type": "admin",
        "is_admin": True,
        "email": "super@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    # Should not raise (super_admin bypasses)
    result = require_contract_admin(principal)
    assert result == principal


@pytest.mark.asyncio
async def test_require_contract_admin_dependency_denies_empty_roles():
    """Test that require_contract_admin denies users with empty roles."""
    from app.auth.dependencies import require_contract_admin
    
    principal: AuthenticatedPrincipal = {
        "user_id": "user123",
        "original_user_id": None,
        "shadow_user_id": None,
        "brand": "skillhub",
        "roles": [],  # Empty roles
        "portal_identity": None,
        "token_type": "user",
        "is_admin": False,
        "email": "user@example.com",
        "platforms": [],
        "subscriptions": []
    }
    
    with pytest.raises(HTTPException) as exc_info:
        require_contract_admin(principal)
    
    assert exc_info.value.status_code == 403
