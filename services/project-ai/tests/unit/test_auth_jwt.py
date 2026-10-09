"""
Unit tests for JWT authentication module.

Tests token creation, decoding, expiration, and error handling.
"""

import os
from datetime import timedelta
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import jwt

from app.auth.jwt import create_access_token, decode_access_token


@pytest.fixture(autouse=True)
def set_jwt_env():
    """Set JWT_SECRET_KEY for all tests in this module."""
    os.environ["JWT_SECRET_KEY"] = "test_secret_key_at_least_32_characters_long_for_testing"
    yield
    # Clean up after tests
    if "JWT_SECRET_KEY" in os.environ:
        del os.environ["JWT_SECRET_KEY"]


def test_create_access_token_valid():
    """Test creating a valid JWT access token."""
    data = {"sub": "user123", "roles": ["contract_viewer"]}
    token = create_access_token(data)
    
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Decode to verify structure
    config = {"secret_key": os.environ["JWT_SECRET_KEY"], "algorithm": "HS256"}
    payload = jwt.decode(token, config["secret_key"], algorithms=[config["algorithm"]])
    
    assert payload["sub"] == "user123"
    assert payload["roles"] == ["contract_viewer"]
    assert "exp" in payload


def test_decode_access_token_valid():
    """Test decoding a valid JWT access token."""
    data = {
        "sub": "user456",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_456",
        "originalUserId": "usr_456",
        "shadowUserId": "usr_456",
        "roles": ["contract_admin"]
    }
    token = create_access_token(data)
    
    decoded = decode_access_token(token)
    
    assert decoded["sub"] == "user456"
    assert decoded["roles"] == ["contract_admin"]
    assert "exp" in decoded


def test_decode_access_token_expired():
    """Test decoding an expired JWT token raises HTTPException 401."""
    data = {"sub": "user789", "roles": ["contract_viewer"]}
    # Create token that expires immediately
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


def test_decode_access_token_invalid_signature():
    """Test decoding a token with invalid signature raises HTTPException 401."""
    data = {"sub": "user999", "roles": ["contract_admin"]}
    # Create token with different secret
    config = {"secret_key": "wrong_secret_key_that_is_at_least_32_chars_long", "algorithm": "HS256"}
    token = jwt.encode(data, config["secret_key"], algorithm=config["algorithm"])
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


def test_decode_access_token_malformed():
    """Test decoding a malformed token raises HTTPException 401."""
    malformed_token = "not.a.valid.jwt.token"
    
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(malformed_token)
    
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


def test_create_decode_roundtrip():
    """Test full roundtrip: create token, decode it, verify data integrity."""
    original_data = {
        "sub": "roundtrip_user",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_roundtrip",
        "originalUserId": "usr_roundtrip",
        "shadowUserId": "usr_roundtrip",
        "roles": ["contract_admin", "contract_reviewer", "contract_viewer"],
        "email": "test@example.com"
    }
    
    token = create_access_token(original_data, expires_delta=timedelta(minutes=5))
    decoded_data = decode_access_token(token)
    
    assert decoded_data["sub"] == original_data["sub"]
    assert decoded_data["roles"] == original_data["roles"]
    assert decoded_data["email"] == original_data["email"]
    assert "exp" in decoded_data


def test_token_exp_claim_is_timezone_aware():
    """Test that the exp claim uses timezone-aware UTC datetime."""
    from datetime import datetime, timezone
    
    data = {
        "sub": "tz_test_user",
        "aud": "user",
        "tokenType": "user",
        "userId": "usr_tz_test",
        "originalUserId": "usr_tz_test",
        "shadowUserId": "usr_tz_test",
        "roles": ["contract_viewer"]
    }
    token = create_access_token(data, expires_delta=timedelta(minutes=10))
    
    # Decode the token
    decoded = decode_access_token(token)
    
    # The exp claim should be present
    assert "exp" in decoded
    
    # The exp claim should be a timestamp (int or float)
    # When decoded by jose, it's typically an int
    exp_timestamp = decoded["exp"]
    assert isinstance(exp_timestamp, (int, float))
    
    # Convert to datetime and verify it's in the future
    exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    now_utc = datetime.now(timezone.utc)
    
    # The exp should be in the future (we set 10 minutes)
    assert exp_datetime > now_utc
    
    # The exp should be roughly 10 minutes from now (allow 1 second tolerance)
    time_diff = (exp_datetime - now_utc).total_seconds()
    assert 599 <= time_diff <= 601  # 10 minutes = 600 seconds, ±1 second tolerance
