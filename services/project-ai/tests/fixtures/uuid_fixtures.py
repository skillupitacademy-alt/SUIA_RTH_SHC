"""
UUID Test Fixtures Generator

Generates deterministic UUIDs for testing to ensure:
1. Valid PostgreSQL UUID format compliance
2. Reproducible test behavior
3. Human-readable test identifiers (via UUID5 namespace)

Usage:
    from tests.fixtures.uuid_fixtures import test_uuid
    
    workflow_id = test_uuid("wf_test_001")
    candidate_id = test_uuid("cand_test_001")
"""

import uuid
from typing import Dict

# Namespace for deterministic test UUIDs (UUID5)
# This allows human-readable test identifiers to map to valid UUIDs
TEST_NAMESPACE = uuid.UUID('00000000-0000-0000-0000-000000000001')

# Cache to ensure same input always returns same UUID
_uuid_cache: Dict[str, uuid.UUID] = {}


def test_uuid(name: str) -> uuid.UUID:
    """
    Generate a deterministic UUID from a human-readable test identifier.
    
    Uses UUID5 (SHA-1 hash-based) to create reproducible UUIDs from strings.
    This allows tests to use readable identifiers like "wf_test_001" while
    maintaining PostgreSQL UUID type compatibility.
    
    Args:
        name: Human-readable test identifier (e.g., "wf_test_001")
        
    Returns:
        uuid.UUID: Valid UUID object
        
    Example:
        >>> workflow_id = test_uuid("wf_test_001")
        >>> str(workflow_id)
        'a1b2c3d4-...'  # Always the same for "wf_test_001"
    """
    if name not in _uuid_cache:
        _uuid_cache[name] = uuid.uuid5(TEST_NAMESPACE, name)
    return _uuid_cache[name]


def test_uuid_str(name: str) -> str:
    """
    Generate a deterministic UUID string from a human-readable test identifier.
    
    Convenience wrapper for test_uuid() that returns string representation.
    
    Args:
        name: Human-readable test identifier
        
    Returns:
        str: UUID string (lowercase, hyphenated)
    """
    return str(test_uuid(name))


# Pre-generated common test UUIDs for convenience
WORKFLOW_IDS = {
    "wf_test_001": test_uuid("wf_test_001"),
    "wf_test_002": test_uuid("wf_test_002"),
    "wf_idempotent_001": test_uuid("wf_idempotent_001"),
    "wf_lock_001": test_uuid("wf_lock_001"),
    "wf_list_001": test_uuid("wf_list_001"),
    "wf_list_002": test_uuid("wf_list_002"),
    "wf_list_003": test_uuid("wf_list_003"),
    "wf_delete_001": test_uuid("wf_delete_001"),
}

SPEC_IDS = {
    "spec_001": test_uuid("spec_001"),
    "spec_002": test_uuid("spec_002"),
    "spec_003": test_uuid("spec_003"),
}

CONTRACT_IDS = {
    "ct_test_001": test_uuid("ct_test_001"),
    "ct_hash_001": test_uuid("ct_hash_001"),
    "ct_drift_001": test_uuid("ct_drift_001"),
    "ct_wf_001": test_uuid("ct_wf_001"),
}

CANDIDATE_IDS = {
    "cand_test_001": test_uuid("cand_test_001"),
    "cand_list_001": test_uuid("cand_list_001"),
    "cand_list_002": test_uuid("cand_list_002"),
    "cand_list_003": test_uuid("cand_list_003"),
}

MANIFEST_IDS = {
    "man_test_001": test_uuid("man_test_001"),
    "man_drift_001": test_uuid("man_drift_001"),
}

APPROVAL_IDS = {
    "app_test_001": test_uuid("app_test_001"),
    "app_wf_001": test_uuid("app_wf_001"),
}

__all__ = [
    "test_uuid",
    "test_uuid_str",
    "TEST_NAMESPACE",
    "WORKFLOW_IDS",
    "SPEC_IDS",
    "CONTRACT_IDS",
    "CANDIDATE_IDS",
    "MANIFEST_IDS",
    "APPROVAL_IDS",
]
