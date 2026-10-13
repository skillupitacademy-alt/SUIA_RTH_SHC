"""
JWT token generation and validation module.

Uses python-jose for JWT encoding/decoding with HS256 algorithm.
"""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError

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
    
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(
            minutes=config["access_token_expire_minutes"]
        )
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": "skillhubcore.in"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        config["user_secret"],
        algorithm=config["algorithm"]
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    
    Validates:
    - Token signature and expiration
    - Issuer must be "skillhubcore.in"
    - Audience must be "user" or "admin"
    - tokenType must be "user" or "admin"
    - Required identity claims: userId, originalUserId, shadowUserId
    - Strict secret-to-tokenType binding: 
      * tokenType='user' must verify with user_secret
      * tokenType='admin' must verify with admin_secret
    
    Args:
        token: JWT token string to decode
    
    Returns:
        Dictionary payload from the token
    
    Raises:
        HTTPException: 401 if token is invalid, expired, or missing required claims
    """
    config = get_jwt_config()
    
    # Try decoding with both secrets to extract tokenType, then enforce strict binding
    payload = None
    verified_with_secret = None
    
    for secret_type, secret in [("user", config["user_secret"]), ("admin", config["admin_secret"])]:
        try:
            # Decode with issuer validation
            decoded = jwt.decode(
                token,
                secret,
                algorithms=[config["algorithm"]],
                options={
                    "verify_aud": False,  # Disable automatic audience validation
                    "require": ["exp", "iat", "iss"]
                }
            )
            payload = decoded
            verified_with_secret = secret_type
            break
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )
        except (JWTError, JWTClaimsError):
            # Try next secret
            continue
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
    # Validate issuer
    issuer = payload.get("iss")
    if issuer != "skillhubcore.in":
        raise HTTPException(
            status_code=401,
            detail="Invalid token issuer"
        )
    
    # Validate audience claim exists and equals "user" or "admin"
    audience = payload.get("aud")
    if audience not in ["user", "admin"]:
        raise HTTPException(
            status_code=401,
            detail="Invalid token audience"
        )
    
    # Validate tokenType
    token_type = payload.get("tokenType")
    if token_type not in ["user", "admin"]:
        raise HTTPException(
            status_code=401,
            detail="Invalid token type"
        )
    
    # STRICT SECRET BINDING: Enforce that tokenType matches the secret used
    if token_type == "admin" and verified_with_secret != "admin":
        raise HTTPException(
            status_code=401,
            detail="Admin token must be signed with admin secret"
        )
    if token_type == "user" and verified_with_secret != "user":
        raise HTTPException(
            status_code=401,
            detail="User token must be signed with user secret"
        )
    
    # Validate required identity claims
    required_claims = ["userId", "originalUserId", "shadowUserId"]
    for claim in required_claims:
        claim_value = payload.get(claim)
        if not isinstance(claim_value, str) or not claim_value.strip():
            raise HTTPException(
                status_code=401,
                detail=f"Missing or invalid {claim} claim"
            )
    
    return payload
