"""
Authentication and authorization module.

Provides JWT token management and RBAC dependencies for FastAPI.
"""

from .config import get_jwt_config
from .dependencies import (
    get_current_user,
    require_contract_admin,
    require_contract_reviewer,
    require_contract_viewer,
)
from .jwt import create_access_token, decode_access_token

__all__ = [
    "get_jwt_config",
    "create_access_token",
    "decode_access_token",
    "get_current_user",
    "require_contract_admin",
    "require_contract_reviewer",
    "require_contract_viewer",
]
