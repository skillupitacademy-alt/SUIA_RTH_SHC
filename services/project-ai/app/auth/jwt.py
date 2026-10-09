"""
JWT token generation and validation module.

Uses python-jose for JWT encoding/decoding with HS256 algorithm.
"""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from .config import get_jwt_config


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary payload to encode in the token
        expires_delta: Optional expiration time delta. If None, uses default from config
    
    Returns:
        Encoded JWT token string
    """
    config = get_jwt_config()
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=config["access_token_expire_minutes"]
        )
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        config["secret_key"],
        algorithm=config["algorithm"]
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: JWT token string to decode
    
    Returns:
        Dictionary payload from the token
    
    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    config = get_jwt_config()
    
    try:
        payload = jwt.decode(
            token,
            config["secret_key"],
            algorithms=[config["algorithm"]]
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
