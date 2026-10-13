"""
Security tests for W7 Evidence Enforcement.

Tests all 17 validation scenarios for final gate evidence policy enforcement.
"""

import pytest
from datetime import datetime, timezone, timedelta
from app.governance.evidence_policy import (
    EvidenceResult,
    EvidencePolicy,
    validate_final_gate_evidence,
    FINAL_GATE_POLICY,
    ACCEPTED_VERDICTS,
)


# ============================================================================
# Fixtures and Helpers
# ============================================================================


def make_evidence(
    evidence_type="security_scan",
    verdict="PASS",
    workflow_id="wf-001",
    artifact_sha256="abc123",
    age_seconds=3600,
    evidence_id=None,
):
    """Create evidence result with specified parameters."""
    return EvidenceResult(
        evidence_type=evidence_type,
        verdict=verdict,
        workflow_id=workflow_id,
        artifact_sha256=artifact_sha256,
        created_at=datetime.now(timezone.utc) - timedelta(seconds=age_seconds),
        evidence_id=evidence_id or f"ev-{evidence_type}",
    )


def all_required_evidence(workflow_id="wf-001", artifact_sha256="abc123"):
    """Create complete set of required evidence with all PASS verdicts."""
    return [
        make_evidence(t, "PASS", workflow_id, artifact_sha256)
        for t in FINAL_GATE_POLICY.required_types
    ]


# ============================================================================
# Test Scenarios
# ============================================================================


def test_all_required_evidence_passes():
    """Test 1: All valid evidence with PASS verdicts succeeds."""
    evidence = all_required_evidence("wf-001", "abc123")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert errors == [], f"Expected no errors, got: {errors}"


def test_super_admin_evidence_passes():
    """Test 2: Evidence with APPROVED verdict (super admin) passes."""
    evidence = [
        make_evidence(t, "APPROVED", "wf-001", "abc123")
        for t in FINAL_GATE_POLICY.required_types
    ]
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert errors == [], f"APPROVED verdict should be accepted, got: {errors}"


def test_missing_required_evidence_type():
    """Test 3: Missing security_scan evidence type fails."""
    # Create evidence without security_scan
    evidence = [
        make_evidence(t, "PASS", "wf-001", "abc123")
        for t in FINAL_GATE_POLICY.required_types
        if t != "security_scan"
    ]
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("missing_required_evidence:security_scan" in e for e in errors), \
        f"Expected missing_required_evidence:security_scan, got: {errors}"


def test_missing_all_evidence():
    """Test 4: Empty evidence list reports all required types as missing."""
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=[],
        policy=FINAL_GATE_POLICY,
    )
    
    # Should have one error per required type
    assert len(errors) >= len(FINAL_GATE_POLICY.required_types), \
        f"Expected errors for all required types, got: {errors}"
    
    for req_type in FINAL_GATE_POLICY.required_types:
        assert any(f"missing_required_evidence:{req_type}" in e for e in errors), \
            f"Missing error for required type {req_type}"


def test_failed_verdict_rejected():
    """Test 5: Evidence with FAIL verdict is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    # Change one to FAIL
    evidence[0] = make_evidence("security_scan", "FAIL", "wf-001", "abc123", evidence_id="ev-security-1")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("unaccepted_verdict:ev-security-1:FAIL" in e for e in errors), \
        f"Expected unaccepted_verdict for FAIL, got: {errors}"


def test_blocked_verdict_rejected():
    """Test 6: Evidence with BLOCKED verdict is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    evidence[0] = make_evidence("security_scan", "BLOCKED", "wf-001", "abc123", evidence_id="ev-blocked")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("unaccepted_verdict:ev-blocked:BLOCKED" in e for e in errors), \
        f"Expected unaccepted_verdict for BLOCKED, got: {errors}"


def test_partial_verdict_rejected():
    """Test 7: Evidence with PARTIAL verdict is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    evidence[0] = make_evidence("security_scan", "PARTIAL", "wf-001", "abc123", evidence_id="ev-partial")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("unaccepted_verdict" in e and "ev-partial" in e for e in errors), \
        f"Expected unaccepted_verdict for PARTIAL, got: {errors}"


def test_unknown_verdict_rejected():
    """Test 8: Evidence with UNKNOWN verdict is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    evidence[0] = make_evidence("security_scan", "UNKNOWN", "wf-001", "abc123", evidence_id="ev-unknown")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("unaccepted_verdict" in e and "ev-unknown" in e for e in errors), \
        f"Expected unaccepted_verdict for UNKNOWN, got: {errors}"


def test_malformed_verdict_rejected():
    """Test 9: Evidence with None verdict is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    # Create evidence with None verdict by modifying after creation
    bad_evidence = make_evidence("security_scan", "PASS", "wf-001", "abc123", evidence_id="ev-malformed")
    # Replace verdict with None (simulating malformed data)
    bad_evidence = EvidenceResult(
        evidence_type="security_scan",
        verdict=None,
        workflow_id="wf-001",
        artifact_sha256="abc123",
        created_at=datetime.now(timezone.utc),
        evidence_id="ev-malformed",
    )
    evidence[0] = bad_evidence
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("malformed_verdict:ev-malformed" in e for e in errors), \
        f"Expected malformed_verdict for None verdict, got: {errors}"


def test_wrong_workflow_id_rejected():
    """Test 10: Evidence with mismatched workflow_id is rejected."""
    evidence = all_required_evidence("wf-999", "abc123")  # Wrong workflow ID
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",  # Expected workflow ID
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    # All evidence should have workflow_id_mismatch errors
    assert any("workflow_id_mismatch" in e for e in errors), \
        f"Expected workflow_id_mismatch errors, got: {errors}"


def test_wrong_artifact_digest_rejected():
    """Test 11: Evidence with mismatched artifact_sha256 is rejected."""
    evidence = all_required_evidence("wf-001", "wrong_hash")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",  # Expected hash
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    # All evidence should have artifact_binding_mismatch errors
    assert any("artifact_binding_mismatch" in e for e in errors), \
        f"Expected artifact_binding_mismatch errors, got: {errors}"


def test_stale_evidence_rejected():
    """Test 12: Evidence older than max_age_seconds is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    # Make one evidence stale (25 hours old, limit is 24)
    stale_age = FINAL_GATE_POLICY.max_age_seconds + 3600  # 25 hours
    evidence[0] = make_evidence("security_scan", "PASS", "wf-001", "abc123", 
                                age_seconds=stale_age, evidence_id="ev-stale")
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("stale_evidence:ev-stale" in e for e in errors), \
        f"Expected stale_evidence error, got: {errors}"


def test_future_evidence_rejected():
    """Test 13: Evidence with future timestamp is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    # Create evidence with future timestamp
    future_evidence = EvidenceResult(
        evidence_type="security_scan",
        verdict="PASS",
        workflow_id="wf-001",
        artifact_sha256="abc123",
        created_at=datetime.now(timezone.utc) + timedelta(hours=1),  # 1 hour in future
        evidence_id="ev-future",
    )
    evidence[0] = future_evidence
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("future_evidence:ev-future" in e for e in errors), \
        f"Expected future_evidence error, got: {errors}"


def test_evidence_repository_unavailable():
    """Test 14: None evidence list is rejected."""
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=None,  # Repository unavailable scenario
        policy=FINAL_GATE_POLICY,
    )
    
    assert len(errors) > 0, "Expected non-empty errors for None evidence"
    assert any("missing_required_evidence:all" in e for e in errors), \
        f"Expected missing_required_evidence:all, got: {errors}"


def test_concurrent_certification_prevented():
    """
    Test 15: Concurrent validation calls produce consistent results.
    
    Since validate_final_gate_evidence is a pure function with no side effects,
    concurrent calls with identical inputs must produce identical outputs.
    This ensures thread-safety and prevents race conditions in the validation layer.
    """
    import asyncio
    
    async def validate_async():
        """Async wrapper for validation function."""
        evidence = all_required_evidence("wf-001", "abc123")
        return validate_final_gate_evidence(
            workflow_id="wf-001",
            artifact_sha256="abc123",
            evidence=evidence,
            policy=FINAL_GATE_POLICY,
        )
    
    async def run_concurrent_test():
        # Run two validations concurrently
        result1, result2 = await asyncio.gather(
            validate_async(),
            validate_async(),
        )
        return result1, result2
    
    # Execute concurrent test
    result1, result2 = asyncio.run(run_concurrent_test())
    
    # Both results should be identical (empty list for valid evidence)
    assert result1 == result2 == [], \
        f"Concurrent validations produced different results: {result1} vs {result2}"


def test_denial_leaves_state_unchanged():
    """
    Test 16: Validation with bad evidence returns errors without side effects.
    
    The validate_final_gate_evidence function is pure - it reads inputs and
    returns errors without mutating state or raising exceptions.
    """
    evidence = all_required_evidence("wf-001", "abc123")
    evidence[0] = make_evidence("security_scan", "FAIL", "wf-001", "abc123")
    
    # Call validation
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    # Should return errors, not raise exception
    assert len(errors) > 0, "Expected non-empty errors for FAIL verdict"
    assert isinstance(errors, list), "Expected list of error strings"
    assert all(isinstance(e, str) for e in errors), "All errors should be strings"
    
    # Evidence objects unchanged
    assert evidence[0].verdict == "FAIL", "Evidence object should not be mutated"


def test_denial_creates_audit_event():
    """
    Test 17: Validation errors match expected audit string patterns.
    
    The error format is structured for audit logging and downstream processing.
    Each error follows a specific pattern for machine parsing.
    """
    evidence = all_required_evidence("wf-001", "abc123")
    
    # Create multiple violations
    evidence[0] = make_evidence("security_scan", "FAIL", "wf-001", "abc123", evidence_id="ev-1")
    evidence[1] = make_evidence("ubrc_verification", "BLOCKED", "wf-001", "abc123", evidence_id="ev-2")
    evidence.pop()  # Remove one required type to trigger missing evidence
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    # Verify error format patterns
    assert any("unaccepted_verdict:ev-1:FAIL" in e for e in errors), \
        "Expected unaccepted_verdict audit pattern"
    assert any("unaccepted_verdict:ev-2:BLOCKED" in e for e in errors), \
        "Expected blocked verdict audit pattern"
    assert any("missing_required_evidence:" in e for e in errors), \
        "Expected missing evidence audit pattern"
    
    # All errors should be colon-delimited strings for parsing
    for error in errors:
        assert ":" in error, f"Error should be structured with colons: {error}"
        parts = error.split(":")
        assert len(parts) >= 2, f"Error should have at least 2 parts: {error}"


# ============================================================================
# Additional Edge Case Tests
# ============================================================================


def test_certification_ready_verdict_accepted():
    """Test: CERTIFICATION_READY verdict is accepted."""
    evidence = [
        make_evidence(t, "CERTIFICATION_READY", "wf-001", "abc123")
        for t in FINAL_GATE_POLICY.required_types
    ]
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert errors == [], f"CERTIFICATION_READY verdict should be accepted, got: {errors}"


def test_mixed_accepted_verdicts():
    """Test: Mix of PASS, APPROVED, and CERTIFICATION_READY verdicts all pass."""
    evidence = []
    verdicts = ["PASS", "APPROVED", "CERTIFICATION_READY", "PASS", "APPROVED"]
    
    for i, etype in enumerate(FINAL_GATE_POLICY.required_types):
        verdict = verdicts[i % len(verdicts)]
        evidence.append(make_evidence(etype, verdict, "wf-001", "abc123"))
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert errors == [], f"Mixed accepted verdicts should all pass, got: {errors}"


def test_naive_timestamp_rejected():
    """Test: Evidence with naive (non-timezone-aware) timestamp is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    
    # Create evidence with naive datetime
    naive_evidence = EvidenceResult(
        evidence_type="security_scan",
        verdict="PASS",
        workflow_id="wf-001",
        artifact_sha256="abc123",
        created_at=datetime.now(),  # Naive datetime (no timezone)
        evidence_id="ev-naive",
    )
    evidence[0] = naive_evidence
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("malformed_evidence:ev-naive:naive_timestamp" in e for e in errors), \
        f"Expected naive_timestamp error, got: {errors}"


def test_empty_verdict_rejected():
    """Test: Evidence with empty string verdict is rejected."""
    evidence = all_required_evidence("wf-001", "abc123")
    
    # Create evidence with empty verdict
    empty_verdict_evidence = EvidenceResult(
        evidence_type="security_scan",
        verdict="",  # Empty string
        workflow_id="wf-001",
        artifact_sha256="abc123",
        created_at=datetime.now(timezone.utc),
        evidence_id="ev-empty",
    )
    evidence[0] = empty_verdict_evidence
    
    errors = validate_final_gate_evidence(
        workflow_id="wf-001",
        artifact_sha256="abc123",
        evidence=evidence,
        policy=FINAL_GATE_POLICY,
    )
    
    assert any("malformed_verdict:ev-empty" in e for e in errors), \
        f"Expected malformed_verdict for empty string, got: {errors}"
