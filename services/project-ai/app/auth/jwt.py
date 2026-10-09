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
    
    Implements dual-secret verification matching SHC TokenService.verifyAccessToken():
    - Try user_secret first
    - Fall back to admin_secret on JWTError
    - Raise 401 if both fail
    
    Args:
        token: JWT token string to decode
    
    Returns:
        Dictionary payload from the token
    
    Raises:
        HTTPException: 401 if token is invalid, expired, or missing required claims
    """
    config = get_jwt_config()
    last_error = None
    
    # Try user secret first, then admin secret (matching SHC verifyAccessToken pattern)
    for secret in [config["user_secret"], config["admin_secret"]]:
        try:
            # Decode with issuer validation
            payload = jwt.decode(
                token,
                secret,
                algorithms=[config["algorithm"]],
                options={
                    "verify_aud": False,  # Disable automatic audience validation
                    "require": ["exp", "iat", "iss"]
                }
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
            
            # Validate required identity claims
            required_claims = ["userId", "originalUserId", "shadowUserId"]
            for claim in required_claims:
                claim_value = payload.get(claim)
                if not isinstance(claim_value, str) or not claim_value.strip():
                    raise HTTPException(
                        status_code=401,
                        detail=f"Missing or invalid {claim} claim"
                    )
            
            # Token is valid with this secret
            return payload
            
        except HTTPException:
            # Re-raise validation errors (issuer, audience, claims)
            raise
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )
        except (JWTError, JWTClaimsError) as e:
            # Save error and try next secret
            last_error = e
            continue
    
    # Both secrets failed
    raise HTTPException(
        status_code=401,
        detail="Invalid or expired token"
    )
