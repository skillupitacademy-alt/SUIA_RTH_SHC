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
from .policy import (
    FRAMEWORK_COMPLIANCE_POLICY_TEXT,
    get_framework_compliance_policy,
)

__all__ = [
    "RepositoryEvidence",
    "CanonicalReference",
    "RuntimeContract",
    "RepositoryBlockContract",
    "build_contract",
    "FRAMEWORK_COMPLIANCE_POLICY_TEXT",
    "get_framework_compliance_policy",
]
