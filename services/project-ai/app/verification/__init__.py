"""
Verification modules for Project AI certification gates.

This package contains specialized verification modules that test
specific aspects of candidate block integration.
"""

from .composer import ComposerVerificationResult, verify_composer_integration

__all__ = [
    'ComposerVerificationResult',
    'verify_composer_integration',
]
