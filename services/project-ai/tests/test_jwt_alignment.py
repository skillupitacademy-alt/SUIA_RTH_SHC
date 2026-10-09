"""
JWT alignment tests for Wave 1A requirements.

Tests comprehensive JWT authentication alignment between Python service
and SHC TokenService:
- Issuer validation (iss='skillhubcore.in')
- Dual-secret verification (JWT_SECRET for user, ADMIN_JWT_SECRET for admin)
- User and admin token acceptance
- Identity claims validation
- Token expiration handling

All tests use actual jose.jwt.encode to generate tokens matching SHC patterns.
"""

import os
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.auth.jwt import decode_access_token
from fastapi import HTTPException


def create_test_token(
    secret: str,
    token_type: str = "user",
    issuer: str = "skillhubcore.in",
    user_id: str = "test_user_123",
    expires_delta: timedelta | None = None,
    include_issuer: bool = True,
    include_claims: bool = True,
) -> str:
    """
    Helper to create test JWT tokens using jose.jwt.encode with HS256.
    
    Matches SHC TokenService structure:
    - iss: issuer (default: skillhubcore.in)
    - aud: audience (user or admin)
    - tokenType: user or admin
    - userId, originalUserId, shadowUserId: identity claims
    - exp: expiration timestamp
    - iat: issued at timestamp
    
    Args:
        secret: Secret key for signing (JWT_SECRET or ADMIN_JWT_SECRET)
        token_type: "user" or "admin"
        issuer: Issuer claim (default: skillhubcore.in)
        user_id: User identifier for identity claims
        expires_delta: Optional expiration delta (default: 30 minutes)
        include_issuer: Whether to include iss claim
        include_claims: Whether to include identity claims
    
    Returns:
        Encoded JWT token string
    """
    now = datetime.now(timezone.utc)
    
    if expires_delta is None:
        expires_delta = timedelta(minutes=30)
    
    payload = {
        "aud": token_type,
        "tokenType": token_type,
        "exp": now + expires_delta,
        "iat": now,
    }
    
    if include_issuer:
        payload["iss"] = issuer
    
    if include_claims:
        payload.update({
            "userId": user_id,
            "originalUserId": user_id,
            "shadowUserId": user_id,
        })
    
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def setup_jwt_env(monkeypatch):
    """Set up JWT environment variables for all tests."""
    test_user_secret = "test_user_secret_at_least_32_chars_long_here"
    test_admin_secret = "test_admin_secret_at_least_32_chars_long"
    
    monkeypatch.setenv("JWT_SECRET", test_user_secret)
    monkeypatch.setenv("ADMIN_JWT_SECRET", test_admin_secret)
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    
    return test_user_secret, test_admin_secret


@pytest.fixture
def jwt_secret():
    """User token secret (JWT_SECRET)."""
    return "test_user_secret_at_least_32_chars_long_here"


@pytest.fixture
def admin_jwt_secret():
    """Admin token secret (ADMIN_JWT_SECRET)."""
    return "test_admin_secret_at_least_32_chars_long"


def test_user_token_with_jwt_secret_passes(jwt_secret):
    """
    Wave 1A Requirement: User token signed with JWT_SECRET must be accepted.
    
    Tests that a properly formed user token with:
    - tokenType='user'
    - aud='user'
    - iss='skillhubcore.in'
    - Signed with JWT_SECRET
    
    is successfully decoded and validated.
    """
    token = create_test_token(
        secret=jwt_secret,
        token_type="user",
        user_id="user_123"
    )
    
    payload = decode_access_token(token)
    
    assert payload["tokenType"] == "user"
    assert payload["aud"] == "user"
    assert payload["iss"] == "skillhubcore.in"
    assert payload["userId"] == "user_123"
    assert payload["originalUserId"] == "user_123"
    assert payload["shadowUserId"] == "user_123"


def test_admin_token_with_admin_jwt_secret_passes(admin_jwt_secret):
    """
    Wave 1A Requirement: Admin token signed with ADMIN_JWT_SECRET must be accepted.
    
    Tests that a properly formed admin token with:
    - tokenType='admin'
    - aud='admin'
    - iss='skillhubcore.in'
    - Signed with ADMIN_JWT_SECRET
    
    is successfully decoded and validated.
    """
    token = create_test_token(
        secret=admin_jwt_secret,
        token_type="admin",
        user_id="admin_456"
    )
    
    payload = decode_access_token(token)
    
    assert payload["tokenType"] == "admin"
    assert payload["aud"] == "admin"
    assert payload["iss"] == "skillhubcore.in"
    assert payload["userId"] == "admin_456"


def test_token_with_missing_issuer_fails(jwt_secret):
    """
    Wave 1A Requirement: Token without issuer claim must be rejected.
    
    Tests that tokens missing the 'iss' claim are rejected with 401,
    enforcing issuer validation as required by SHC alignment.
    """
    token = create_test_token(
        secret=jwt_secret,
        token_type="user",
        include_issuer=False
    )
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid token issuer" in exc_info.value.detail


def test_token_with_wrong_issuer_fails(jwt_secret):
    """
    Wave 1A Requirement: Token with incorrect issuer must be rejected.
    
    Tests that tokens with issuer other than 'skillhubcore.in' are rejected
    with 401, preventing acceptance of tokens from unauthorized issuers.
    """
    token = create_test_token(
        secret=jwt_secret,
        token_type="user",
        issuer="attacker.com"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid token issuer" in exc_info.value.detail


def test_user_token_signed_with_external_secret_fails():
    """
    Wave 1A Requirement: Token signed with unknown secret must be rejected.
    
    Tests that tokens signed with a secret other than JWT_SECRET or
    ADMIN_JWT_SECRET are rejected with 401, enforcing signature validation.
    """
    external_secret = "external_secret_not_in_our_system_at_least_32_chars"
    
    token = create_test_token(
        secret=external_secret,
        token_type="user",
        user_id="user_789"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


def test_admin_token_signed_with_user_secret_accepted_by_dual_verification(jwt_secret, admin_jwt_secret):
    """
    Wave 1A Requirement: Dual-secret verification accepts tokens signed with either secret.
    
    Tests the dual-secret verification pattern matching SHC TokenService.verifyAccessToken:
    tokens are tried with user_secret first, then admin_secret. This means an admin token
    signed with JWT_SECRET will be accepted (when trying user_secret), which is expected
    behavior matching the SHC fallback pattern.
    
    This test verifies that the dual-secret implementation works correctly by accepting
    tokens signed with either secret, not just the "intended" one.
    """
    # Create admin token signed with user secret
    token = create_test_token(
        secret=jwt_secret,  # Using user secret for admin token
        token_type="admin",
        user_id="admin_999"
    )
    
    # Should be accepted via dual-secret verification
    payload = decode_access_token(token)
    
    assert payload["tokenType"] == "admin"
    assert payload["aud"] == "admin"
    assert payload["userId"] == "admin_999"


def test_token_with_missing_identity_claims_fails(jwt_secret):
    """
    Wave 1A Requirement: Token missing required identity claims must be rejected.
    
    Tests that tokens without userId, originalUserId, or shadowUserId are
    rejected with 401, enforcing identity claims validation.
    """
    token = create_test_token(
        secret=jwt_secret,
        token_type="user",
        include_claims=False  # Omit identity claims
    )
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Missing or invalid" in exc_info.value.detail


def test_expired_token_fails(jwt_secret):
    """
    Wave 1A Requirement: Expired token must be rejected.
    
    Tests that tokens with exp claim in the past are rejected with 401,
    enforcing token expiration validation.
    """
    token = create_test_token(
        secret=jwt_secret,
        token_type="user",
        user_id="user_expired",
        expires_delta=timedelta(seconds=-10)  # Expired 10 seconds ago
    )
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail
