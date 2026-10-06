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
from .theme import (
    ThemeVerification,
    ThemeErrorCode,
    ThemeConfiguration,
    discover_theme_configurations,
    verify_theme_compatibility,
)
from .brand import (
    BrandErrorCode,
    BrandFinding,
    BrandVerificationResult,
    verify_brand_independence,
    format_findings_report,
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
    # Theme verification
    'ThemeVerification',
    'ThemeErrorCode',
    'ThemeConfiguration',
    'discover_theme_configurations',
    'verify_theme_compatibility',
    # Brand verification
    'BrandErrorCode',
    'BrandFinding',
    'BrandVerificationResult',
    'verify_brand_independence',
    'format_findings_report',
]
