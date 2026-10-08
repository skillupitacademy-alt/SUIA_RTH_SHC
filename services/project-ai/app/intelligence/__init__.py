"""
Intelligence Module - Repository and Block Analysis

DEPRECATED: This module previously provided filesystem-based repository intelligence.
The implementation has been migrated to app.contracts.repository_intelligence with
snapshot-based intelligence that respects the architectural boundary.

Production code should import from app.contracts.repository_intelligence instead:
    from app.contracts.repository_intelligence import (
        RepositoryBlockContract,
        RepositoryEvidenceBlocked,
        build_contract,
    )

The old filesystem-scanning implementation has been archived to:
    app/intelligence/repository_intelligence.py.archived
"""

# This module no longer exports anything.
# All imports from app.intelligence.repository_intelligence will fail.
# Update your code to import from app.contracts.repository_intelligence instead.

__all__ = []
