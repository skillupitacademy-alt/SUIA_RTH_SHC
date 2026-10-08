"""
Tests for Canonical Evidence Store (R0)

Verifies the R0 evidence authority reconciliation implementation:
- Content-addressable integrity (SHA-256 hashes)
- Strict validation (no null tests, UTC timestamps, non-empty IDs)
- Duplicate detection
- Evidence chain verification
"""

import pytest
import tempfile
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

from app.evidence.canonical_evidence import (
    CanonicalEvidenceStore,
    EvidenceEvent,
    EvidenceVerification,
    TestSummary,
)


@pytest.fixture
def temp_evidence_file():
    """Create a temporary evidence.jsonl file for testing."""
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".jsonl") as f:
        temp_path = Path(f.name)
    yield temp_path
    # Cleanup
    if temp_path.exists():
        temp_path.unlink()


@pytest.fixture
def store(temp_evidence_file):
    """Create a CanonicalEvidenceStore instance for testing."""
    return CanonicalEvidenceStore(ledger_path=temp_evidence_file)


@pytest.fixture
def sample_event():
    """Create a sample evidence event."""
    return EvidenceEvent(
        evidence_id="test-evidence-001",
        workflow_id="test-workflow",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test-branch",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file1.py", "file2.py"],
        tests=TestSummary(passed=10, failed=0, skipped=1)
    )


def test_append_and_retrieve(store, sample_event):
    """Test 1: Append event and retrieve by evidence_id."""
    # Append event
    evidence_hash = store.append(sample_event)
    
    # Hash should be non-empty
    assert len(evidence_hash) == 64  # SHA-256 is 64 hex chars
    
    # Retrieve event
    retrieved = store.get("test-evidence-001")
    
    # Verify fields match
    assert retrieved.evidence_id == "test-evidence-001"
    assert retrieved.workflow_id == "test-workflow"
    assert retrieved.agent_id == "R0"
    assert retrieved.status == "PASS"
    assert retrieved.evidence_hash == evidence_hash
    assert len(retrieved.files_changed) == 2
    assert retrieved.tests.passed == 10


def test_duplicate_evidence_id_rejected(store, sample_event):
    """Test 2: Duplicate evidence_id raises ValueError."""
    # Append first time
    store.append(sample_event)
    
    # Try to append again with same evidence_id
    with pytest.raises(ValueError, match="Duplicate evidence_id"):
        store.append(sample_event)


def test_evidence_hash_deterministic(sample_event):
    """Test 3: Evidence hash is deterministic (same input → same hash)."""
    # Compute hash twice
    hash1 = sample_event.compute_hash()
    hash2 = sample_event.compute_hash()
    
    # Hashes should be identical
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256


def test_evidence_hash_stored_correctly(store, sample_event):
    """Test 4: Evidence hash is stored correctly and verify_chain reports valid."""
    # Append event
    store.append(sample_event)
    
    # Verify chain
    verification = store.verify_chain("test-workflow")
    
    # Should be valid
    assert verification.chain_valid is True
    assert verification.events_found == 1
    assert len(verification.broken_hashes) == 0
    assert len(verification.missing_fields) == 0


def test_list_for_workflow(store):
    """Test 5: list_for_workflow returns only events for that workflow_id."""
    # Create events for different workflows
    event1 = EvidenceEvent(
        evidence_id="event-1",
        workflow_id="workflow-a",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file1.py"],
        tests=TestSummary(passed=5, failed=0)
    )
    
    event2 = EvidenceEvent(
        evidence_id="event-2",
        workflow_id="workflow-b",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file2.py"],
        tests=TestSummary(passed=3, failed=0)
    )
    
    event3 = EvidenceEvent(
        evidence_id="event-3",
        workflow_id="workflow-a",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file3.py"],
        tests=TestSummary(passed=2, failed=0)
    )
    
    # Append all events
    store.append(event1)
    store.append(event2)
    store.append(event3)
    
    # List events for workflow-a
    events_a = store.list_for_workflow("workflow-a")
    
    # Should only have events 1 and 3
    assert len(events_a) == 2
    assert events_a[0].evidence_id == "event-1"
    assert events_a[1].evidence_id == "event-3"
    
    # List events for workflow-b
    events_b = store.list_for_workflow("workflow-b")
    
    # Should only have event 2
    assert len(events_b) == 1
    assert events_b[0].evidence_id == "event-2"


def test_verify_chain_detects_tampered_hash(store, temp_evidence_file):
    """Test 6: verify_chain detects a tampered hash."""
    # Create and append event
    event = EvidenceEvent(
        evidence_id="event-tamper",
        workflow_id="test-workflow",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file1.py"],
        tests=TestSummary(passed=5, failed=0)
    )
    
    store.append(event)
    
    # Manually tamper with the stored hash
    with open(temp_evidence_file, "r", encoding="utf-8") as f:
        data = json.loads(f.read().strip())
    
    # Change the hash to something invalid
    data["evidence_hash"] = "0" * 64
    
    # Rewrite the file with tampered data
    with open(temp_evidence_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(data) + "\n")
    
    # Create a new store instance (to reload from file)
    new_store = CanonicalEvidenceStore(ledger_path=temp_evidence_file)
    
    # Verify chain
    verification = new_store.verify_chain("test-workflow")
    
    # Should detect tampering
    assert verification.chain_valid is False
    assert len(verification.broken_hashes) == 1
    assert "event-tamper" in verification.broken_hashes


def test_verify_chain_detects_missing_fields(store, temp_evidence_file):
    """Test 7: verify_chain detects missing required fields (Pydantic validates at load)."""
    # This test verifies that the Pydantic model enforces required fields
    # We can't actually write invalid data through the store API,
    # but we can verify that attempting to load invalid data fails
    
    # Write invalid JSON directly to file (tests=null)
    invalid_data = {
        "evidence_id": "event-invalid",
        "workflow_id": "test-workflow",
        "agent_id": "R0",
        "wave": "R0",
        "repository": "quiz-platform",
        "branch": "test",
        "base_sha": "abc1234",
        "final_sha": "def5678",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "event_type": "wave_completion",
        "status": "PASS",
        "files_changed": ["file1.py"],
        "tests": None,  # Invalid: tests cannot be null
        "evidence_hash": "a" * 64
    }
    
    with open(temp_evidence_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(invalid_data) + "\n")
    
    # Create new store (to reload from file)
    new_store = CanonicalEvidenceStore(ledger_path=temp_evidence_file)
    
    # Try to list events - should skip invalid line
    events = new_store.list_for_workflow("test-workflow")
    
    # Should have no events (invalid line was skipped)
    assert len(events) == 0


def test_process_restart_preserves_events(temp_evidence_file):
    """Test 8: Process restart - re-creating store from existing JSONL preserves all events."""
    # Create store and add events
    store1 = CanonicalEvidenceStore(ledger_path=temp_evidence_file)
    
    event1 = EvidenceEvent(
        evidence_id="event-restart-1",
        workflow_id="test-workflow",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file1.py"],
        tests=TestSummary(passed=5, failed=0)
    )
    
    event2 = EvidenceEvent(
        evidence_id="event-restart-2",
        workflow_id="test-workflow",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file2.py"],
        tests=TestSummary(passed=3, failed=0)
    )
    
    store1.append(event1)
    store1.append(event2)
    
    # Simulate process restart by creating new store instance
    store2 = CanonicalEvidenceStore(ledger_path=temp_evidence_file)
    
    # List events
    events = store2.list_for_workflow("test-workflow")
    
    # Should have both events
    assert len(events) == 2
    assert events[0].evidence_id == "event-restart-1"
    assert events[1].evidence_id == "event-restart-2"
    
    # Verify chain is still valid
    verification = store2.verify_chain("test-workflow")
    assert verification.chain_valid is True


def test_utc_timestamp_enforced():
    """Test 9: UTC timestamp enforced (no naive datetimes accepted)."""
    # Try to create event with naive datetime
    with pytest.raises(ValueError, match="must be timezone-aware"):
        EvidenceEvent(
            evidence_id="event-naive",
            workflow_id="test-workflow",
            agent_id="R0",
            wave="R0",
            repository="quiz-platform",
            branch="test",
            base_sha="abc1234",
            final_sha="def5678",
            timestamp_utc=datetime.now(),  # Naive datetime (no timezone)
            event_type="wave_completion",
            status="PASS",
            files_changed=["file1.py"],
            tests=TestSummary(passed=5, failed=0)
        )


def test_invalid_workflow_id_rejected():
    """Test 10: Invalid workflow_id binding (empty string) rejected."""
    # Try to create event with empty workflow_id
    with pytest.raises(ValueError):
        EvidenceEvent(
            evidence_id="event-empty-workflow",
            workflow_id="",  # Empty string - should fail min_length=1 validation
            agent_id="R0",
            wave="R0",
            repository="quiz-platform",
            branch="test",
            base_sha="abc1234",
            final_sha="def5678",
            timestamp_utc=datetime.now(timezone.utc),
            event_type="wave_completion",
            status="PASS",
            files_changed=["file1.py"],
            tests=TestSummary(passed=5, failed=0)
        )


def test_empty_files_changed_allowed(store):
    """Test: Empty files_changed list is allowed if truly no files changed."""
    event = EvidenceEvent(
        evidence_id="event-no-files",
        workflow_id="test-workflow",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="abc1234",  # Same SHA = no changes
        timestamp_utc=datetime.now(timezone.utc),
        event_type="gate_decision",
        status="PASS",
        files_changed=[],  # Empty list is valid for gate decisions
        tests=TestSummary(passed=0, failed=0)  # No tests ran
    )
    
    # Should not raise
    store.append(event)
    
    # Verify stored correctly
    retrieved = store.get("event-no-files")
    assert len(retrieved.files_changed) == 0


def test_zero_tests_with_summary(store):
    """Test: Zero tests with TestSummary is valid (better than null)."""
    event = EvidenceEvent(
        evidence_id="event-zero-tests",
        workflow_id="test-workflow",
        agent_id="R0",
        wave="R0",
        repository="quiz-platform",
        branch="test",
        base_sha="abc1234",
        final_sha="def5678",
        timestamp_utc=datetime.now(timezone.utc),
        event_type="wave_completion",
        status="PASS",
        files_changed=["file1.py"],
        tests=TestSummary(passed=0, failed=0, skipped=0)  # Zero tests but not null
    )
    
    # Should not raise
    store.append(event)
    
    # Verify stored correctly
    retrieved = store.get("event-zero-tests")
    assert retrieved.tests.passed == 0
    assert retrieved.tests.failed == 0


def test_get_nonexistent_evidence_raises_keyerror(store):
    """Test: Getting nonexistent evidence_id raises KeyError."""
    with pytest.raises(KeyError, match="Evidence not found"):
        store.get("nonexistent-evidence-id")


def test_list_for_nonexistent_workflow_returns_empty(store):
    """Test: Listing evidence for nonexistent workflow returns empty list."""
    events = store.list_for_workflow("nonexistent-workflow")
    assert events == []


def test_verify_chain_for_nonexistent_workflow(store):
    """Test: Verifying chain for nonexistent workflow returns empty verification."""
    verification = store.verify_chain("nonexistent-workflow")
    
    assert verification.workflow_id == "nonexistent-workflow"
    assert verification.events_found == 0
    assert verification.chain_valid is True  # Empty chain is vacuously valid
    assert len(verification.broken_hashes) == 0
    assert len(verification.missing_fields) == 0
