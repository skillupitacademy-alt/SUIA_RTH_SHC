"""
Unit tests for ContractFieldEvidence model and evidence tracking infrastructure.

Tests verify that:
1. ContractFieldEvidence model correctly captures field provenance
2. Evidence tracking chain maintains integrity from snapshot to contract field
3. All required fields are properly validated by Pydantic
"""

from datetime import datetime
from app.contracts.repository_intelligence import ContractFieldEvidence


def test_contract_field_evidence_model():
    """
    Test that ContractFieldEvidence model constructs correctly with sample data.
    
    Verifies:
    - All required fields can be populated
    - Field values are stored correctly
    - Pydantic validation accepts valid data
    - derived_at timestamp is automatically generated if not provided
    """
    # Create evidence with explicit timestamp
    evidence = ContractFieldEvidence(
        field_name="language",
        value="TypeScript",
        evidence_source="snapshot.evidence[5].metadata.language",
        evidence_id="abc123def456",
        derived_at=datetime(2024, 1, 15, 10, 30, 0)
    )
    
    # Verify all fields are populated correctly
    assert evidence.field_name == "language"
    assert evidence.value == "TypeScript"
    assert evidence.evidence_source == "snapshot.evidence[5].metadata.language"
    assert evidence.evidence_id == "abc123def456"
    assert evidence.derived_at == datetime(2024, 1, 15, 10, 30, 0)
    
    # Test that derived_at defaults to current time if not provided
    evidence_auto_time = ContractFieldEvidence(
        field_name="framework",
        value="React",
        evidence_source="snapshot.dependencies['react']",
        evidence_id="xyz789ghi012"
    )
    
    assert evidence_auto_time.field_name == "framework"
    assert evidence_auto_time.value == "React"
    assert isinstance(evidence_auto_time.derived_at, datetime)
    # Verify timestamp is recent (within last minute)
    time_diff = datetime.utcnow() - evidence_auto_time.derived_at
    assert time_diff.total_seconds() < 60


def test_evidence_provenance_tracking():
    """
    Test that evidence can be stored, retrieved, and verified in a tracking chain.
    
    Simulates the workflow:
    1. Create evidence entry for a field
    2. Store it in a tracking dictionary (keyed by field name)
    3. Retrieve it later for audit/debugging
    4. Verify the chain is intact
    
    This pattern will be used in RepositoryBlockContract.field_evidence.
    """
    # Create evidence for multiple contract fields
    language_evidence = ContractFieldEvidence(
        field_name="language",
        value="TypeScript",
        evidence_source="snapshot.packageJson.devDependencies.typescript",
        evidence_id="evidence-lang-001"
    )
    
    framework_evidence = ContractFieldEvidence(
        field_name="framework",
        value="React",
        evidence_source="snapshot.packageJson.dependencies.react",
        evidence_id="evidence-fw-002"
    )
    
    # Store in tracking dictionary (simulates RepositoryBlockContract.field_evidence)
    evidence_tracker: dict[str, ContractFieldEvidence] = {}
    evidence_tracker[language_evidence.field_name] = language_evidence
    evidence_tracker[framework_evidence.field_name] = framework_evidence
    
    # Retrieve and verify chain is intact
    retrieved_language = evidence_tracker.get("language")
    assert retrieved_language is not None
    assert retrieved_language.field_name == "language"
    assert retrieved_language.value == "TypeScript"
    assert retrieved_language.evidence_source == "snapshot.packageJson.devDependencies.typescript"
    assert retrieved_language.evidence_id == "evidence-lang-001"
    
    retrieved_framework = evidence_tracker.get("framework")
    assert retrieved_framework is not None
    assert retrieved_framework.field_name == "framework"
    assert retrieved_framework.value == "React"
    assert retrieved_framework.evidence_source == "snapshot.packageJson.dependencies.react"
    assert retrieved_framework.evidence_id == "evidence-fw-002"
    
    # Verify we can enumerate all tracked evidence
    assert len(evidence_tracker) == 2
    assert "language" in evidence_tracker
    assert "framework" in evidence_tracker
    
    # Verify evidence IDs are unique and traceable
    all_evidence_ids = {ev.evidence_id for ev in evidence_tracker.values()}
    assert len(all_evidence_ids) == 2
    assert "evidence-lang-001" in all_evidence_ids
    assert "evidence-fw-002" in all_evidence_ids
