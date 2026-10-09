"""
RBAC (Role-Based Access Control) dependency injection module.

Provides FastAPI dependencies for authentication and authorization.
"""

from fastapi import Depends, Header, HTTPException

from .jwt import decode_access_token
from .types import AuthenticatedPrincipal


def get_current_user(authorization: str = Header(...)) -> AuthenticatedPrincipal:
    """
    Extract and validate user from JWT Bearer token.
    
    Extracts complete identity context from verified SHC JWT tokens including:
    - Core identity (user_id, original_user_id, shadow_user_id)
    - Tenant boundary (brand)
    - Authorization context (roles, portal_identity, token_type, is_admin)
    - Additional context (email, platforms, subscriptions)
    
    Args:
        authorization: Authorization header value (expected: "Bearer <token>")
    
    Returns:
        AuthenticatedPrincipal with all extracted claims
    
    Raises:
        HTTPException: 401 if authorization header is missing or token is invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header"
        )
    
    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>"
        )
    
    token = parts[1]
    payload = decode_access_token(token)
    
    # Extract user_id from userId claim (SHC standard), fallback to sub for backward compatibility
    user_id = payload.get("userId")
    if not user_id:
        user_id = payload.get("sub")
    
    return {
        "user_id": user_id,
        "original_user_id": payload.get("originalUserId"),
        "shadow_user_id": payload.get("shadowUserId"),
        "brand": payload.get("brand"),
        "roles": payload.get("roles", []),
        "portal_identity": payload.get("portalIdentity"),
        "token_type": payload.get("tokenType"),
        "is_admin": payload.get("isAdmin", False),
        "email": payload.get("email"),
        "platforms": payload.get("platforms", []),
        "subscriptions": payload.get("subscriptions", [])
    }


def require_contract_admin(user: AuthenticatedPrincipal = Depends(get_current_user)) -> AuthenticatedPrincipal:
    """
    Require contract_admin role.
    
    This is a FastAPI dependency that automatically extracts and validates the user.
    
    Args:
        user: User identity from get_current_user dependency
    
    Returns:
        User identity if authorized
    
    Raises:
        HTTPException: 403 if user doesn't have contract_admin role
    """
    if "contract_admin" not in user.get("roles", []):
        raise HTTPException(
            status_code=403,
            detail="Requires contract_admin role"
        )
    
    return user


def require_contract_reviewer(user: AuthenticatedPrincipal = Depends(get_current_user)) -> AuthenticatedPrincipal:
    """
    Require contract_reviewer or contract_admin role.
    
    Role hierarchy: admin can do reviewer tasks.
    
    Args:
        user: User identity from get_current_user dependency
    
    Returns:
        User identity if authorized
    
    Raises:
        HTTPException: 403 if user doesn't have contract_reviewer or contract_admin role
    """
    roles = user.get("roles", [])
    if "contract_reviewer" not in roles and "contract_admin" not in roles:
        raise HTTPException(
            status_code=403,
            detail="Requires contract_reviewer or contract_admin role"
        )
    
    return user


def require_contract_viewer(user: AuthenticatedPrincipal = Depends(get_current_user)) -> AuthenticatedPrincipal:
    """
    Require contract_viewer, contract_reviewer, or contract_admin role.
    
    Role hierarchy: admin ⊃ reviewer ⊃ viewer.
    
    Args:
        user: User identity from get_current_user dependency
    
    Returns:
        User identity if authorized
    
    Raises:
        HTTPException: 403 if user doesn't have any contract role
    """
    roles = user.get("roles", [])
    if not any(role in roles for role in ["contract_viewer", "contract_reviewer", "contract_admin"]):
        raise HTTPException(
            status_code=403,
            detail="Requires contract_viewer, contract_reviewer, or contract_admin role"
        )
    
    return user
