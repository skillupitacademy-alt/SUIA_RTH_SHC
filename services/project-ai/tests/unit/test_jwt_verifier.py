"""
Unit tests for JWT token verification and claim validation.

Tests comprehensive JWT verification including audience, tokenType,
and required identity claims (userId, originalUserId, shadowUserId).
"""

import os
from datetime import timedelta
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import jwt

from app.auth.jwt import create_access_token, decode_access_token


@pytest.fixture(autouse=True)
def set_jwt_env_for_verifier():
    """Set JWT_SECRET for all tests in this module."""
    os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long_for_testing"
    yield
    # Clean up after tests
    if "JWT_SECRET" in os.environ:
        del os.environ["JWT_SECRET"]


def test_verify_valid_token_with_all_claims():
    """Test 1: Verify valid token with all required claims succeeds."""
    data = {
        "sub": "user123",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_12345",
        "originalUserId": "usr_12345",
        "shadowUserId": "usr_12345",
        "roles": ["contract_viewer"]
    }
    token = create_access_token(data)
    
    decoded = decode_access_token(token)
    
    assert decoded["sub"] == "user123"
    assert decoded["aud"] == "user"
    assert decoded["tokenType"] == "user"
    assert decoded["userId"] == "usr_12345"
    assert decoded["originalUserId"] == "usr_12345"
    assert decoded["shadowUserId"] == "usr_12345"
    assert decoded["roles"] == ["contract_viewer"]


def test_verify_token_missing_audience():
    """Test 2: Verify token without audience claim raises HTTPException 401."""
    data = {
        "sub": "user456",
        "tokenType": "user",
        "userId": "usr_456",
        "originalUserId": "usr_456",
        "shadowUserId": "usr_456"
    }
    # Create token without audience claim and without iat
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    data["exp"] = now + timedelta(minutes=5)
    # Explicitly omit 'aud' and 'iat' to test required claims
    config = {"secret_key": os.environ["JWT_SECRET"], "algorithm": "HS256"}
    token = jwt.encode(data, config["secret_key"], algorithm=config["algorithm"])
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    # Should fail due to missing required 'aud' or 'iat' claim
    assert "Invalid" in exc_info.value.detail or "token" in exc_info.value.detail.lower()


def test_verify_token_wrong_audience():
    """Test 3: Verify token with wrong audience raises HTTPException 401."""
    data = {
        "sub": "user789",
        "aud": "admin",  # Wrong audience, expected 'user'
        "tokenType": "user",
        "userId": "usr_789",
        "originalUserId": "usr_789",
        "shadowUserId": "usr_789"
    }
    # Create token with wrong audience
    config = {"secret_key": os.environ["JWT_SECRET"], "algorithm": "HS256"}
    token = jwt.encode(data, config["secret_key"], algorithm=config["algorithm"])
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    # Should contain message about audience
    assert "audience" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()


def test_verify_token_missing_token_type():
    """Test 4: Verify token without tokenType claim raises HTTPException 401."""
    data = {
        "sub": "user100",
        "aud": "user",
        # Missing tokenType
        "userId": "usr_100",
        "originalUserId": "usr_100",
        "shadowUserId": "usr_100"
    }
    token = create_access_token(data)
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "token type" in exc_info.value.detail.lower()


def test_verify_token_wrong_token_type():
    """Test 5: Verify token with wrong tokenType raises HTTPException 401."""
    data = {
        "sub": "user200",
        "aud": "user",
        "tokenType": "service",  # Wrong type, expected 'user'
        "userId": "usr_200",
        "originalUserId": "usr_200",
        "shadowUserId": "usr_200"
    }
    token = create_access_token(data)
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "token type" in exc_info.value.detail.lower()


def test_verify_token_missing_user_id():
    """Test 6: Verify token without userId claim raises HTTPException 401."""
    data = {
        "sub": "user300",
        "aud": "user",
        "tokenType": "user",
        # Missing userId
        "originalUserId": "usr_300",
        "shadowUserId": "usr_300"
    }
    token = create_access_token(data)
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "userId" in exc_info.value.detail or "identity" in exc_info.value.detail.lower()


def test_verify_token_missing_original_user_id():
    """Test 7: Verify token without originalUserId claim raises HTTPException 401."""
    data = {
        "sub": "user400",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_400",
        # Missing originalUserId
        "shadowUserId": "usr_400"
    }
    token = create_access_token(data)
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "originalUserId" in exc_info.value.detail or "identity" in exc_info.value.detail.lower()


def test_verify_token_missing_shadow_user_id():
    """Test 8: Verify token without shadowUserId claim raises HTTPException 401."""
    data = {
        "sub": "user500",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_500",
        "originalUserId": "usr_500"
        # Missing shadowUserId
    }
    token = create_access_token(data)
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "shadowUserId" in exc_info.value.detail or "identity" in exc_info.value.detail.lower()


def test_verify_expired_token():
    """Test 9: Verify expired token raises HTTPException 401 with 'expired' message."""
    data = {
        "sub": "user600",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_600",
        "originalUserId": "usr_600",
        "shadowUserId": "usr_600"
    }
    # Create token that expires immediately
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()


def test_verify_invalid_signature():
    """Test 10: Verify token with invalid signature raises HTTPException 401."""
    data = {
        "sub": "user700",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_700",
        "originalUserId": "usr_700",
        "shadowUserId": "usr_700"
    }
    # Create token with different secret
    config = {"secret_key": "wrong_secret_key_that_is_at_least_32_chars_long", "algorithm": "HS256"}
    token = jwt.encode(data, config["secret_key"], algorithm=config["algorithm"])
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "invalid" in exc_info.value.detail.lower() or "token" in exc_info.value.detail.lower()


def test_verify_malformed_token():
    """Test 11: Verify malformed token raises HTTPException 401."""
    malformed_token = "not.a.real.token"
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(malformed_token)
    
    assert exc_info.value.status_code == 401
    assert "invalid" in exc_info.value.detail.lower() or "token" in exc_info.value.detail.lower()


def test_create_token_includes_required_claims():
    """Test 12: Verify create_access_token preserves all required claims."""
    original_data = {
        "sub": "user800",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_800",
        "originalUserId": "usr_800_original",
        "shadowUserId": "usr_800_shadow",
        "roles": ["contract_admin", "contract_reviewer"],
        "email": "test@example.com"
    }
    
    token = create_access_token(original_data, expires_delta=timedelta(minutes=5))
    decoded = decode_access_token(token)
    
    # Verify all required claims are present and correct
    assert decoded["sub"] == original_data["sub"]
    assert decoded["aud"] == original_data["aud"]
    assert decoded["tokenType"] == original_data["tokenType"]
    assert decoded["userId"] == original_data["userId"]
    assert decoded["originalUserId"] == original_data["originalUserId"]
    assert decoded["shadowUserId"] == original_data["shadowUserId"]
    assert decoded["roles"] == original_data["roles"]
    assert decoded["email"] == original_data["email"]
    assert "exp" in decoded
    assert "iat" in decoded
