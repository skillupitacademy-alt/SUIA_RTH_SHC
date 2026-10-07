"""
Authorization module for implementation approval verification.

W4: Placement executor authorization hooks.
"""

from app.authorization.approval_checker import (
    AuthorizationResult,
    check_implementation_approval,
    produce_authorization_evidence,
)

__all__ = [
    "AuthorizationResult",
    "check_implementation_approval",
    "produce_authorization_evidence",
]
