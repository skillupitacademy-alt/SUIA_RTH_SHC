"""
Unit tests for migration repair workflow gate evaluation.

Verifies fail-closed behavior: BLOCKED/SKIPPED never resolve to PASS.
"""

import pytest

from app.workflows.migration_repair.gate import (
    RequiredCheck,
    REQUIRED_CHECKS,
    evaluate_final_gate,
)
from app.workflows.migration_repair.models import CheckStatus


def test_required_check_creation():
    """Test RequiredCheck dataclass creation."""
    check = RequiredCheck(
        check_id="test_check",
        name="Test Check",
        description="A test check"
    )
    
    assert check.check_id == "test_check"
    assert check.name == "Test Check"
    assert check.description == "A test check"


def test_required_checks_defined():
    """Test REQUIRED_CHECKS tuple contains expected checks."""
    assert len(REQUIRED_CHECKS) >= 5  # At least the core checks
    
    check_ids = {check.check_id for check in REQUIRED_CHECKS}
    
    # Verify core checks are present
    assert "migration_execution" in check_ids
    assert "schema_verification" in check_ids
    assert "package_tests" in check_ids
    assert "evidence_complete" in check_ids
    assert "commit_identity" in check_ids


def test_required_check_immutable():
    """Test RequiredCheck is immutable (frozen dataclass)."""
    check = RequiredCheck(
        check_id="test",
        name="Test",
        description="Test"
    )
    
    with pytest.raises(AttributeError):
        check.check_id = "modified"


def test_evaluate_final_gate_all_pass():
    """Test evaluate_final_gate returns PASS when all checks pass."""
    check_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.PASS


def test_evaluate_final_gate_one_fail():
    """Test evaluate_final_gate returns BLOCKED when one check fails."""
    check_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    check_results["migration_execution"] = CheckStatus.FAIL
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_one_skipped():
    """Test evaluate_final_gate returns BLOCKED when one check is skipped."""
    check_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    check_results["schema_verification"] = CheckStatus.SKIPPED
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_one_blocked():
    """Test evaluate_final_gate returns BLOCKED when one check is blocked."""
    check_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    check_results["package_tests"] = CheckStatus.BLOCKED
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_missing_check():
    """Test evaluate_final_gate returns BLOCKED when required check is missing."""
    check_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    # Remove one required check
    del check_results["evidence_complete"]
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_empty_results():
    """Test evaluate_final_gate returns BLOCKED for empty check results."""
    result = evaluate_final_gate({})
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_all_fail():
    """Test evaluate_final_gate returns BLOCKED when all checks fail."""
    check_results = {
        check.check_id: CheckStatus.FAIL
        for check in REQUIRED_CHECKS
    }
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_mixed_fail_blocked_skipped():
    """Test evaluate_final_gate returns BLOCKED for mixed non-PASS statuses."""
    check_results = {}
    for i, check in enumerate(REQUIRED_CHECKS):
        # Rotate through FAIL, BLOCKED, SKIPPED
        status = [CheckStatus.FAIL, CheckStatus.BLOCKED, CheckStatus.SKIPPED][i % 3]
        check_results[check.check_id] = status
    
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.BLOCKED


def test_evaluate_final_gate_extra_checks_ignored():
    """Test evaluate_final_gate ignores extra checks not in REQUIRED_CHECKS."""
    check_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    # Add extra checks that aren't required
    check_results["extra_check_1"] = CheckStatus.FAIL
    check_results["extra_check_2"] = CheckStatus.BLOCKED
    
    # Should still pass because only REQUIRED_CHECKS matter
    result = evaluate_final_gate(check_results)
    assert result == CheckStatus.PASS


def test_evaluate_final_gate_fail_closed_principle():
    """Test evaluate_final_gate implements fail-closed principle."""
    # Principle: any uncertainty (FAIL, BLOCKED, SKIPPED, missing) must block
    
    # Test 1: Missing one check = BLOCKED
    partial_results = {
        check.check_id: CheckStatus.PASS
        for check in list(REQUIRED_CHECKS)[:-1]
    }
    assert evaluate_final_gate(partial_results) == CheckStatus.BLOCKED
    
    # Test 2: One SKIPPED = BLOCKED
    skipped_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    skipped_results[REQUIRED_CHECKS[0].check_id] = CheckStatus.SKIPPED
    assert evaluate_final_gate(skipped_results) == CheckStatus.BLOCKED
    
    # Test 3: One BLOCKED = BLOCKED
    blocked_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    blocked_results[REQUIRED_CHECKS[1].check_id] = CheckStatus.BLOCKED
    assert evaluate_final_gate(blocked_results) == CheckStatus.BLOCKED
    
    # Test 4: One FAIL = BLOCKED
    failed_results = {
        check.check_id: CheckStatus.PASS
        for check in REQUIRED_CHECKS
    }
    failed_results[REQUIRED_CHECKS[2].check_id] = CheckStatus.FAIL
    assert evaluate_final_gate(failed_results) == CheckStatus.BLOCKED


def test_evaluate_final_gate_never_returns_fail():
    """Test evaluate_final_gate never returns FAIL (only PASS or BLOCKED)."""
    # Test various scenarios, none should return FAIL
    scenarios = [
        {},  # Empty
        {check.check_id: CheckStatus.FAIL for check in REQUIRED_CHECKS},  # All fail
        {check.check_id: CheckStatus.SKIPPED for check in REQUIRED_CHECKS},  # All skipped
        {check.check_id: CheckStatus.BLOCKED for check in REQUIRED_CHECKS},  # All blocked
    ]
    
    for check_results in scenarios:
        result = evaluate_final_gate(check_results)
        assert result in (CheckStatus.PASS, CheckStatus.BLOCKED)
        assert result != CheckStatus.FAIL
        assert result != CheckStatus.SKIPPED


def test_required_checks_have_unique_ids():
    """Test all REQUIRED_CHECKS have unique check_ids."""
    check_ids = [check.check_id for check in REQUIRED_CHECKS]
    assert len(check_ids) == len(set(check_ids))
