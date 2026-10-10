"""
Authorization enforcement for brand boundary isolation and RBAC.

Wave 1C: Implements cross-tenant access prevention and brand isolation rules.
Wave 1D: Implements role-based access control (RBAC) for privileged operations.
"""

import logging
from typing import Optional
from fastapi import HTTPException

from .types import AuthenticatedPrincipal


logger = logging.getLogger(__name__)


def verify_brand_access(
    principal: AuthenticatedPrincipal,
    resource_brand: Optional[str]
) -> None:
    """
    Verify user has access to resource within their brand boundary.
    
    Enforces tenant isolation by checking brand matching between the
    authenticated principal and the resource being accessed.
    
    RULES:
    1. Infrastructure users (super_admin, infrastructure role, is_admin) bypass all restrictions
    2. Unclassified resources (resource_brand=None) require infrastructure privilege
    3. Same-brand access permitted
    4. Cross-brand access denied
    
    Args:
        principal: Authenticated user from JWT token
        resource_brand: Brand identifier of the resource being accessed
        
    Raises:
        HTTPException: 403 if cross-brand access attempted or privilege missing
    """
    user_brand = principal.get("brand")
    roles = principal.get("roles", [])
    is_admin = principal.get("is_admin", False)
    
    # Check if user has infrastructure privilege
    is_infrastructure = is_admin or "super_admin" in roles or "infrastructure" in roles
    
    # Rule 1: Infrastructure bypass for users with brand=None
    # SECURITY: Require explicit privileged role to prevent bypass abuse
    if user_brand is None:
        if not is_infrastructure:
            logger.warning(
                f"Infrastructure bypass denied: user_id={principal.get('user_id')} lacks privileged role"
            )
            raise HTTPException(
                status_code=403,
                detail="Missing tenant identity. Infrastructure privilege required."
            )
        logger.debug("Infrastructure user bypassing brand check (user brand=None)")
        return
    
    # Rule 2: Unclassified resources (resource_brand=None) require infrastructure privilege
    # SECURITY FIX (FEAT-002): Prevent regular tenant users from accessing unclassified resources
    # Principle: unclassified ≠ public, unclassified = requires-explicit-privilege
    if resource_brand is None:
        if not is_infrastructure:
            logger.warning(
                f"Unclassified resource access denied: user_id={principal.get('user_id')}, "
                f"user_brand={user_brand} lacks infrastructure privilege"
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied: unclassified resource requires infrastructure privilege"
            )
        logger.debug(f"Infrastructure user accessing unclassified resource")
        return
    
    # Rule 3: Same brand access is permitted
    if user_brand == resource_brand:
        logger.debug(f"Brand match: user={user_brand}, resource={resource_brand}")
        return
    
    # Rule 4: Cross-brand access denied
    logger.warning(
        f"Cross-brand access denied: user_brand={user_brand}, resource_brand={resource_brand}"
    )
    raise HTTPException(
        status_code=403,
        detail=f"Cross-brand access denied: user brand={user_brand}, resource brand={resource_brand}"
    )


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
