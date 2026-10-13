"""
Authorization enforcement for RBAC (role-based access control).

Implements role-based access control for privileged operations.
"""

import logging
from fastapi import HTTPException

from .types import AuthenticatedPrincipal


logger = logging.getLogger(__name__)


def is_super_admin(principal: AuthenticatedPrincipal) -> bool:
    """
    Check if principal has super_admin privileges.
    
    Returns True if any of:
    - Has 'super_admin' role (case-insensitive)
    - Has portal_identity == 'super_admin'
    - Has portal_identity == 'infrastructure'
    
    Args:
        principal: Authenticated user from JWT token
        
    Returns:
        True if user has super_admin privileges
        
    Example:
        >>> principal = {"roles": ["super_admin"], "portal_identity": None}
        >>> is_super_admin(principal)
        True
    """
    roles = principal.get("roles", [])
    portal_identity = principal.get("portal_identity")
    
    # Check for super_admin role (case-insensitive)
    has_super_admin_role = any(role.lower() == "super_admin" for role in roles)
    
    # Check for infrastructure portal identity
    is_infrastructure = portal_identity in ("super_admin", "infrastructure")
    
    return has_super_admin_role or is_infrastructure


def require_role(
    principal: AuthenticatedPrincipal,
    required_role: str
) -> None:
    """
    Verify principal has the required role.
    
    Case-insensitive role matching. Empty roles list denies by default.
    super_admin bypass: Users with super_admin role bypass this check.
    
    Args:
        principal: Authenticated user from JWT token
        required_role: Role identifier required for access
        
    Raises:
        HTTPException: 403 if user lacks required role
        
    Example:
        >>> principal = {"user_id": "user123", "roles": ["contract_admin"]}
        >>> require_role(principal, "contract_admin")  # Passes
        >>> require_role(principal, "contract_reviewer")  # Raises HTTPException(403)
    """
    # Super admin bypass
    if is_super_admin(principal):
        logger.debug(f"RBAC bypass: user={principal.get('user_id')} has super_admin privilege")
        return
    
    roles = principal.get("roles", [])
    user_id = principal.get("user_id", "unknown")
    
    # Case-insensitive role matching
    if any(role.lower() == required_role.lower() for role in roles):
        return
    
    # Denial: log and raise
    logger.warning(
        f"RBAC denial: user={user_id}, required_role={required_role}, user_roles={roles}"
    )
    raise HTTPException(
        status_code=403,
        detail=f"Requires {required_role} role"
    )


def require_any_role(
    principal: AuthenticatedPrincipal,
    required_roles: list[str]
) -> None:
    """
    Verify principal has at least one of the required roles.
    
    Case-insensitive role matching. Empty roles list denies by default.
    super_admin bypass: Users with super_admin role bypass this check.
    
    Args:
        principal: Authenticated user from JWT token
        required_roles: List of role identifiers (any one grants access)
        
    Raises:
        HTTPException: 403 if user lacks all required roles
        
    Example:
        >>> principal = {"user_id": "user123", "roles": ["contract_reviewer"]}
        >>> require_any_role(principal, ["contract_admin", "contract_reviewer"])  # Passes
        >>> require_any_role(principal, ["contract_admin"])  # Raises HTTPException(403)
    """
    # Super admin bypass
    if is_super_admin(principal):
        logger.debug(f"RBAC bypass: user={principal.get('user_id')} has super_admin privilege")
        return
    
    roles = principal.get("roles", [])
    user_id = principal.get("user_id", "unknown")
    
    # Case-insensitive role matching
    normalized_user_roles = [role.lower() for role in roles]
    normalized_required_roles = [role.lower() for role in required_roles]
    
    if any(role in normalized_user_roles for role in normalized_required_roles):
        return
    
    # Denial: log and raise
    logger.warning(
        f"RBAC denial: user={user_id}, required_roles={required_roles}, user_roles={roles}"
    )
    raise HTTPException(
        status_code=403,
        detail=f"Requires one of: {', '.join(required_roles)}"
    )
