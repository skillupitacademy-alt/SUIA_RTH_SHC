"""
Intelligence Module - Repository and Block Analysis

Provides services for analyzing repository structure and extracting
canonical block contracts.
"""

from .repository_intelligence import (
    CanonicalReference,
    RuntimeContract,
    RepositoryBlockContract,
    discover_canonical_blocks,
    analyze_block_patterns,
    build_repository_contract,
)

__all__ = [
    'CanonicalReference',
    'RuntimeContract',
    'RepositoryBlockContract',
    'discover_canonical_blocks',
    'analyze_block_patterns',
    'build_repository_contract',
]
