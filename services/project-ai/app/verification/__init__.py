"""
Verification modules for Project AI certification gates.

This package contains specialized verification modules that test
specific aspects of candidate block integration.
"""

from .composer import ComposerVerificationResult, verify_composer_integration
from .runtime import (
    RuntimeVerification,
    RuntimeErrorCode,
    ApplicationProcess,
    verify_runtime,
)
from .browser import (
    BrowserVerificationConfig,
    verify_in_browser,
    verify_block_in_browser_sync,
)

__all__ = [
    # Composer verification
    'ComposerVerificationResult',
    'verify_composer_integration',
    # Runtime verification
    'RuntimeVerification',
    'RuntimeErrorCode',
    'ApplicationProcess',
    'verify_runtime',
    # Browser verification
    'BrowserVerificationConfig',
    'verify_in_browser',
    'verify_block_in_browser_sync',
]
