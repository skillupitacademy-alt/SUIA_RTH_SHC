"""
Unit tests for ContractFieldEvidence model and evidence tracking infrastructure.

Tests verify that:
1. ContractFieldEvidence model correctly captures field provenance
2. Evidence tracking chain maintains integrity from snapshot to contract field
3. All required fields are properly validated by Pydantic
4. Timezone-aware UTC timestamps are strictly maintained
5. Provenance vocabulary is strictly enforced
6. Evidence ID format constraints conform to TypeScript discovery contract
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError
from app.contracts.repository_intelligence import ContractFieldEvidence, VALID_PROVENANCE_VALUES


def test_contract_field_evidence_model():
    """
    Test that ContractFieldEvidence model constructs correctly with sample data.
    
    Verifies:
    - All required fields can be populated
    - Field values are stored correctly
    - Pydantic validation accepts valid data
    - derived_at timestamp is automatically generated if not provided
    - Naive datetimes are automatically normalized to timezone-aware UTC
    """
    # Create evidence with explicit timestamp
    evidence = ContractFieldEvidence(
        field_name="language",
        value="TypeScript",
        evidence_source="snapshot.evidence[5].metadata.language",
        evidence_id="evidence-60230209a0d29bda",
        derived_at=datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
    )
    
    # Verify all fields are populated correctly
    assert evidence.field_name == "language"
    assert evidence.value == "TypeScript"
    assert evidence.evidence_source == "snapshot.evidence[5].metadata.language"
    assert evidence.evidence_id == "evidence-60230209a0d29bda"
    assert evidence.derived_at == datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
    assert evidence.derived_at.tzinfo == timezone.utc
    
    # Test that derived_at defaults to current time if not provided
    evidence_auto_time = ContractFieldEvidence(
        field_name="framework",
        value="React",
        evidence_source="snapshot.dependencies['react']",
        evidence_id="evidence-0123456789abcdef"
    )
    
    assert evidence_auto_time.field_name == "framework"
    assert evidence_auto_time.value == "React"
    assert isinstance(evidence_auto_time.derived_at, datetime)
    assert evidence_auto_time.derived_at.tzinfo == timezone.utc
    time_diff = datetime.now(timezone.utc) - evidence_auto_time.derived_at
    assert time_diff.total_seconds() < 60


def test_evidence_provenance_tracking():
    """
    Test that evidence can be stored, retrieved, and verified in a tracking chain.
    """
    # Create evidence for multiple contract fields
    language_evidence = ContractFieldEvidence(
        field_name="language",
        value="TypeScript",
        evidence_source="snapshot.packageJson.devDependencies.typescript",
        evidence_id="evidence-60230209a0d29bda"
    )
    
    framework_evidence = ContractFieldEvidence(
        field_name="framework",
        value="React",
        evidence_source="snapshot.packageJson.dependencies.react",
        evidence_id="evidence-0123456789abcdef"
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
    assert retrieved_language.evidence_id == "evidence-60230209a0d29bda"
    
    retrieved_framework = evidence_tracker.get("framework")
    assert retrieved_framework is not None
    assert retrieved_framework.field_name == "framework"
    assert retrieved_framework.value == "React"
    assert retrieved_framework.evidence_source == "snapshot.packageJson.dependencies.react"
    assert retrieved_framework.evidence_id == "evidence-0123456789abcdef"
    
    # Verify we can enumerate all tracked evidence
    assert len(evidence_tracker) == 2
    assert "language" in evidence_tracker
    assert "framework" in evidence_tracker
    
    # Verify evidence IDs are unique and traceable
    all_evidence_ids = {ev.evidence_id for ev in evidence_tracker.values()}
    assert len(all_evidence_ids) == 2
    assert "evidence-60230209a0d29bda" in all_evidence_ids
    assert "evidence-0123456789abcdef" in all_evidence_ids


def test_contract_field_evidence_required_fields_validation():
    """Test that missing required fields fail Pydantic model validation."""
    # Missing field_name
    with pytest.raises(ValidationError):
        ContractFieldEvidence(
            value="TypeScript",
            evidence_source="metadata"
        )
        
    # Missing evidence_source
    with pytest.raises(ValidationError):
        ContractFieldEvidence(
            field_name="language",
            value="TypeScript"
        )


def test_contract_field_evidence_naive_datetime_normalized_to_utc():
    """Test that a naive datetime provided to derived_at is normalized to timezone-aware UTC."""
    naive_dt = datetime(2024, 6, 1, 12, 0, 0)
    assert naive_dt.tzinfo is None
    
    evidence = ContractFieldEvidence(
        field_name="language",
        value="TypeScript",
        evidence_source="metadata",
        derived_at=naive_dt
    )
    assert evidence.derived_at.tzinfo is not None
    assert evidence.derived_at.tzinfo == timezone.utc


def test_contract_field_evidence_provenance_vocabulary():
    """Test that provenance field strictly enforces the controlled vocabulary."""
    # Valid categories
    for valid_prov in VALID_PROVENANCE_VALUES:
        ev = ContractFieldEvidence(
            field_name="test_field",
            value="test_val",
            evidence_source="test_source",
            provenance=valid_prov
        )
        assert ev.provenance == valid_prov
        
    # Invalid categories
    invalid_categories = ["random_string", "unverified_guess", "custom_tag", ""]
    for bad_prov in invalid_categories:
        with pytest.raises(ValidationError) as exc_info:
            ContractFieldEvidence(
                field_name="test_field",
                value="test_val",
                evidence_source="test_source",
                provenance=bad_prov
            )
        assert "provenance" in str(exc_info.value)


def test_contract_field_evidence_id_validation():
    """Test that evidence_id conforms to TypeScript discovery contract regex."""
    # Valid: 16-hex discovery ID and 64-hex SHA-256
    valid_ids = [
        "evidence-60230209a0d29bda",
        "evidence-0123456789abcdef",
        "a" * 64,
        None,
        ""
    ]
    for vid in valid_ids:
        ev = ContractFieldEvidence(
            field_name="test",
            value="val",
            evidence_source="src",
            evidence_id=vid
        )
        if vid:
            assert ev.evidence_id == vid
        else:
            assert ev.evidence_id is None

    # Invalid: non-hex, illustrative placeholders, wrong length
    invalid_ids = ["ev-intro-1234", "test-id", "evidence-123", "a" * 32, "evidence-xyz"]
    for bad_id in invalid_ids:
        with pytest.raises(ValidationError) as exc_info:
            ContractFieldEvidence(
                field_name="test",
                value="val",
                evidence_source="src",
                evidence_id=bad_id
            )
        assert "evidence_id" in str(exc_info.value)


def test_contract_field_source_evidence_ids_validation():
    """Test that source_evidence_ids validates every ID against the discovery contract."""
    # Valid list
    ev = ContractFieldEvidence(
        field_name="test",
        value="val",
        evidence_source="src",
        source_evidence_ids=["evidence-60230209a0d29bda", "b" * 64]
    )
    assert len(ev.source_evidence_ids) == 2
    
    # Invalid item in list raises ValidationError
    with pytest.raises(ValidationError) as exc_info:
        ContractFieldEvidence(
            field_name="test",
            value="val",
            evidence_source="src",
            source_evidence_ids=["evidence-60230209a0d29bda", "invalid-id"]
        )
    assert "source_evidence_ids" in str(exc_info.value)
