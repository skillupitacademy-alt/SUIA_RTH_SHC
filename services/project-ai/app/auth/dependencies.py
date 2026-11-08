"""
RBAC (Role-Based Access Control) dependency injection module.

Provides FastAPI dependencies for authentication and authorization.
"""

from fastapi import Depends, Header, HTTPException

from .jwt import decode_access_token
from .types import AuthenticatedPrincipal
from .authorization import is_super_admin


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
    
    # Runtime type validation for claim types
    # Validate roles claim
    roles = payload.get("roles", [])
    if not isinstance(roles, list):
        raise HTTPException(
            status_code=401,
            detail="roles claim must be a list of strings"
        )
    for role in roles:
        if not isinstance(role, str):
            raise HTTPException(
                status_code=401,
                detail="all roles must be strings"
            )
    
    # Validate platforms claim
    platforms = payload.get("platforms", [])
    if not isinstance(platforms, list):
        raise HTTPException(
            status_code=401,
            detail="platforms claim must be a list"
        )
    
    # Validate subscriptions claim
    subscriptions = payload.get("subscriptions", [])
    if not isinstance(subscriptions, list):
        raise HTTPException(
            status_code=401,
            detail="subscriptions claim must be a list"
        )
    
    # Validate isAdmin claim
    is_admin = payload.get("isAdmin", False)
    if not isinstance(is_admin, bool):
        raise HTTPException(
            status_code=401,
            detail="isAdmin claim must be a boolean"
        )
    
    # Validate brand claim (if present)
    brand = payload.get("brand")
    if brand is not None and not isinstance(brand, str):
        raise HTTPException(
            status_code=401,
            detail="brand claim must be a string"
        )
    
    # Validate email claim (if present)
    email = payload.get("email")
    if email is not None and not isinstance(email, str):
        raise HTTPException(
            status_code=401,
            detail="email claim must be a string"
        )
    
    # Validate portalIdentity claim (if present)
    portal_identity = payload.get("portalIdentity")
    if portal_identity is not None:
        allowed_portal_identities = {"admin", "user", "faculty", "super_admin", "infrastructure"}
        if portal_identity not in allowed_portal_identities:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid portalIdentity: {portal_identity}. Must be one of: {', '.join(sorted(allowed_portal_identities))}"
            )
    
    # Extract user_id from userId claim (required by JWT validation)
    # SECURITY: Direct access safe because decode_access_token() guarantees:
    # 1. userId claim exists (KeyError impossible)
    # 2. userId claim is non-empty string
    # 3. Token signature and expiry are valid
    # See app/auth/jwt.py decode_access_token() for validation logic
    user_id = payload["userId"]  # Direct access - jwt.py already validated non-empty
    
    return {
        "user_id": user_id,
        "original_user_id": payload.get("originalUserId"),
        "shadow_user_id": payload.get("shadowUserId"),
        "brand": brand,
        "roles": roles,
        "portal_identity": portal_identity,
        "token_type": payload.get("tokenType"),
        "is_admin": is_admin,
        "aud": payload.get("aud"),
        "email": email,
        "platforms": platforms,
        "subscriptions": subscriptions
    }


def require_contract_admin(user: AuthenticatedPrincipal = Depends(get_current_user)) -> AuthenticatedPrincipal:
    """
    Require verified SHC admin credential class and contract_admin or super_admin role.
    
    This is a FastAPI dependency that automatically extracts and validates the user.
    
    Args:
        user: User identity from get_current_user dependency
    
    Returns:
        User identity if authorized
    
    Raises:
        HTTPException: 403 if user lacks SHC admin credential class or contract_admin/super_admin role
    """
    brand = str(user.get("brand") or "").strip().lower()
    token_type = str(user.get("token_type") or "").strip().lower()
    is_admin_flag = user.get("is_admin") is True
    raw_aud = user.get("aud")
    if isinstance(raw_aud, list):
        aud_values = {str(a).strip().lower() for a in raw_aud}
    elif isinstance(raw_aud, str) and raw_aud.strip():
        aud_values = {raw_aud.strip().lower()}
    else:
        aud_values = set()

    if (
        brand != "skillhubcore"
        or token_type != "admin"
        or not is_admin_flag
        or "user" in aud_values
        or not (aud_values & {"shc-admin", "admin"})
    ):
        raise HTTPException(
            status_code=403,
            detail="Requires verified skillhubcore admin credential class (token_type='admin', is_admin=True, aud in {'shc-admin', 'admin'})"
        )

    # Super admin bypass (only after admin credential class verified)
    if is_super_admin(user):
        return user
    
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
