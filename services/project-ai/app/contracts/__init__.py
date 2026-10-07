"""
Contracts Module

Engineering contract generation and repository intelligence for M2.9 pipeline.
"""

from .repository_intelligence import (
    RepositoryEvidence,
    CanonicalReference,
    RuntimeContract,
    RepositoryBlockContract,
    build_contract,
)

__all__ = [
    "RepositoryEvidence",
    "CanonicalReference",
    "RuntimeContract",
    "RepositoryBlockContract",
    "build_contract",
]
