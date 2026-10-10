"""
Authorization enforcement for brand boundary isolation.

Wave 1C: Implements cross-tenant access prevention and brand isolation rules.
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
    1. If principal["brand"] is None → Allow (infrastructure/super_admin bypass)
    2. If resource_brand is None → Allow (brand-agnostic resource)
    3. If principal["brand"] == resource_brand → Allow
    4. Otherwise → Raise HTTPException(403, "Cross-brand access denied")
    
    Args:
        principal: Authenticated user from JWT token
        resource_brand: Brand identifier of the resource being accessed
        
    Raises:
        HTTPException: 403 if cross-brand access attempted
    """
    user_brand = principal.get("brand")
    
    # Rule 1: Infrastructure users (brand=None) bypass brand restrictions
    # SECURITY: Require explicit privileged role to prevent bypass abuse
    if user_brand is None:
        roles = principal.get("roles", [])
        if "super_admin" not in roles and "infrastructure" not in roles:
            logger.warning(
                f"Infrastructure bypass denied: user_id={principal.get('user_id')} lacks privileged role"
            )
            raise HTTPException(
                status_code=403,
                detail="Infrastructure access requires super_admin or infrastructure role"
            )
        logger.debug("Infrastructure user bypassing brand check (user brand=None)")
        return
    
    # Rule 2: Brand-agnostic resources (resource_brand=None) are accessible to all
    if resource_brand is None:
        logger.debug("Brand-agnostic resource (resource brand=None), allowing access")
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
        detail="Access denied: brand mismatch"
    )
