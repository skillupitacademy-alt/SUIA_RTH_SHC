"""
Identity types for SHC JWT token authentication.

Defines the complete identity structure extracted from verified JWT tokens.
"""

from typing import TypedDict, Optional, Literal


class AuthenticatedPrincipal(TypedDict):
    """Complete identity context extracted from a verified SHC JWT token.

    All claims are pre-verified by decode_access_token() in jwt.py.
    Use as the return type annotation for get_current_user().
    """
    # Core identity (REQUIRED)
    user_id: str
    original_user_id: Optional[str]
    shadow_user_id: Optional[str]

    # Tenant boundary (CRITICAL for brand isolation - Wave 1C dependency)
    brand: Optional[str]

    # Authorization context
    roles: list[str]
    portal_identity: Optional[Literal['admin', 'user', 'faculty', 'super_admin', 'infrastructure']]
    token_type: Optional[Literal['user', 'admin']]
    is_admin: bool

    # Additional context
    email: Optional[str]
    platforms: list[str]
    subscriptions: list[str]
