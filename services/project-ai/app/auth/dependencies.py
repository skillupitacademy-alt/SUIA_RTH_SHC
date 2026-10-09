"""
RBAC (Role-Based Access Control) dependency injection module.

Provides FastAPI dependencies for authentication and authorization.
"""

from fastapi import Header, HTTPException

from .jwt import decode_access_token


def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Extract and validate user from JWT Bearer token.
    
    Args:
        authorization: Authorization header value (expected: "Bearer <token>")
    
    Returns:
        dict with keys:
            - user_id: User identifier from 'sub' claim
            - roles: List of role strings from 'roles' claim
    
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
    
    return {
        "user_id": payload.get("sub"),
        "roles": payload.get("roles", [])
    }


def require_contract_admin(user: dict = None) -> dict:
    """
    Require contract_admin role.
    
    This is a dependency that should be called with user=Depends(get_current_user).
    
    Args:
        user: User dictionary from get_current_user
    
    Returns:
        User dictionary if authorized
    
    Raises:
        HTTPException: 403 if user doesn't have contract_admin role
    """
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    if "contract_admin" not in user.get("roles", []):
        raise HTTPException(
            status_code=403,
            detail="Requires contract_admin role"
        )
    
    return user


def require_contract_reviewer(user: dict = None) -> dict:
    """
    Require contract_reviewer or contract_admin role.
    
    Role hierarchy: admin can do reviewer tasks.
    
    Args:
        user: User dictionary from get_current_user
    
    Returns:
        User dictionary if authorized
    
    Raises:
        HTTPException: 403 if user doesn't have contract_reviewer or contract_admin role
    """
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    roles = user.get("roles", [])
    if "contract_reviewer" not in roles and "contract_admin" not in roles:
        raise HTTPException(
            status_code=403,
            detail="Requires contract_reviewer or contract_admin role"
        )
    
    return user


def require_contract_viewer(user: dict = None) -> dict:
    """
    Require contract_viewer, contract_reviewer, or contract_admin role.
    
    Role hierarchy: admin ⊃ reviewer ⊃ viewer.
    
    Args:
        user: User dictionary from get_current_user
    
    Returns:
        User dictionary if authorized
    
    Raises:
        HTTPException: 403 if user doesn't have any contract role
    """
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    roles = user.get("roles", [])
    if not any(role in roles for role in ["contract_viewer", "contract_reviewer", "contract_admin"]):
        raise HTTPException(
            status_code=403,
            detail="Requires contract_viewer, contract_reviewer, or contract_admin role"
        )
    
    return user
