"""
Unit tests for runtime verification module.

Tests verify that RuntimeVerifier:
- Returns BLOCKED when snapshot or contract is None
- Computes overall status correctly
- Includes all required checks
- Never modifies artifacts during verification
"""

import pytest
from app.certification.runtime_verification import (
    RuntimeVerifier,
    RuntimeVerificationReport,
    RuntimeCheckResult,
)


class TestRuntimeVerifier:
    """Test suite for RuntimeVerifier."""
    
    def test_verify_with_none_snapshot_returns_blocked(self):
        """Verify with None snapshot should return BLOCKED."""
        verifier = RuntimeVerifier()
        contract = {"blockType": "introduction"}
        
        report = verifier.verify("wf-123", None, contract)
        
        assert report.workflow_id == "wf-123"
        assert report.overall_status == "BLOCKED"
        assert report.snapshot_id == ""
        assert len(report.checks) == 0
    
    def test_verify_with_none_contract_returns_blocked(self):
        """Verify with None contract should return BLOCKED."""
        verifier = RuntimeVerifier()
        snapshot = {"snapshotId": "snap-123"}
        
        report = verifier.verify("wf-456", snapshot, None)
        
        assert report.workflow_id == "wf-456"
        assert report.overall_status == "BLOCKED"
        assert report.snapshot_id == ""
        assert len(report.checks) == 0
    
    def test_compute_overall_all_pass_returns_pass(self):
        """_compute_overall with all PASS checks should return PASS."""
        verifier = RuntimeVerifier()
        checks = [
            RuntimeCheckResult(
                check_id="check1",
                check_name="Check 1",
                status="PASS",
                evidence=["ev-1"],
            ),
            RuntimeCheckResult(
                check_id="check2",
                check_name="Check 2",
                status="PASS",
                evidence=["ev-2"],
            ),
        ]
        
        result = verifier._compute_overall(checks)
        
        assert result == "PASS"
    
    def test_compute_overall_one_fail_returns_fail(self):
        """_compute_overall with one FAIL check should return FAIL."""
        verifier = RuntimeVerifier()
        checks = [
            RuntimeCheckResult(
                check_id="check1",
                check_name="Check 1",
                status="PASS",
                evidence=["ev-1"],
            ),
            RuntimeCheckResult(
                check_id="check2",
                check_name="Check 2",
                status="FAIL",
                evidence=[],
                reason="verification_failed",
            ),
        ]
        
        result = verifier._compute_overall(checks)
        
        assert result == "FAIL"
    
    def test_compute_overall_one_blocked_returns_blocked(self):
        """_compute_overall with one BLOCKED check should return BLOCKED."""
        verifier = RuntimeVerifier()
        checks = [
            RuntimeCheckResult(
                check_id="check1",
                check_name="Check 1",
                status="PASS",
                evidence=["ev-1"],
            ),
            RuntimeCheckResult(
                check_id="check2",
                check_name="Check 2",
                status="BLOCKED",
                evidence=[],
                reason="evidence_unavailable",
            ),
        ]
        
        result = verifier._compute_overall(checks)
        
        assert result == "BLOCKED"
    
    def test_compute_overall_fail_takes_precedence_over_blocked(self):
        """_compute_overall with FAIL and BLOCKED should return FAIL."""
        verifier = RuntimeVerifier()
        checks = [
            RuntimeCheckResult(
                check_id="check1",
                check_name="Check 1",
                status="FAIL",
                evidence=[],
                reason="failed",
            ),
            RuntimeCheckResult(
                check_id="check2",
                check_name="Check 2",
                status="BLOCKED",
                evidence=[],
                reason="blocked",
            ),
        ]
        
        result = verifier._compute_overall(checks)
        
        assert result == "FAIL"
    
    def test_required_checks_contains_ubrc_registered(self):
        """REQUIRED_CHECKS should contain ubrc_registered."""
        assert "ubrc_registered" in RuntimeVerifier.REQUIRED_CHECKS
    
    def test_required_checks_contains_ils_passive_not_direct(self):
        """REQUIRED_CHECKS should contain ils_passive_not_direct."""
        assert "ils_passive_not_direct" in RuntimeVerifier.REQUIRED_CHECKS
    
    def test_required_checks_contains_lsnb_page_level(self):
        """REQUIRED_CHECKS should contain lsnb_page_level."""
        assert "lsnb_page_level" in RuntimeVerifier.REQUIRED_CHECKS
    
    def test_required_checks_contains_rssb_page_level(self):
        """REQUIRED_CHECKS should contain rssb_page_level."""
        assert "rssb_page_level" in RuntimeVerifier.REQUIRED_CHECKS
    
    def test_required_checks_contains_theme_injection(self):
        """REQUIRED_CHECKS should contain theme_injection."""
        assert "theme_injection" in RuntimeVerifier.REQUIRED_CHECKS
    
    def test_required_checks_contains_brand_independence(self):
        """REQUIRED_CHECKS should contain brand_independence."""
        assert "brand_independence" in RuntimeVerifier.REQUIRED_CHECKS
    
    def test_verify_executes_all_required_checks(self):
        """Verify should execute all REQUIRED_CHECKS."""
        verifier = RuntimeVerifier()
        snapshot = {"snapshotId": "snap-123", "blocks": {}}
        contract = {"blockType": "introduction"}
        
        report = verifier.verify("wf-789", snapshot, contract)
        
        assert len(report.checks) == len(RuntimeVerifier.REQUIRED_CHECKS)
        check_ids = {check.check_id for check in report.checks}
        assert check_ids == set(RuntimeVerifier.REQUIRED_CHECKS)
    
    def test_check_ubrc_registered_with_no_blocks_returns_blocked(self):
        """_check_ubrc_registered with no blocks should return BLOCKED."""
        verifier = RuntimeVerifier()
        snapshot = {"blocks": {"verified": []}}
        contract = {}
        
        result = verifier._check_ubrc_registered(snapshot, contract)
        
        assert result.status == "BLOCKED"
        assert result.reason == "no_block_verification_data"
    
    def test_check_ubrc_registered_with_valid_blocks_returns_pass(self):
        """_check_ubrc_registered with valid blocks should return PASS."""
        verifier = RuntimeVerifier()
        snapshot = {
            "blocks": {
                "verified": [
                    {
                        "blockType": "introduction",
                        "registered": True,
                        "ubrcStatus": "UBRC_VALID",
                        "evidenceId": "ev-intro-123",
                    },
                    {
                        "blockType": "code",
                        "registered": True,
                        "ubrcStatus": "UBRC_VALID",
                        "evidenceId": "ev-code-456",
                    },
                ]
            }
        }
        contract = {}
        
        result = verifier._check_ubrc_registered(snapshot, contract)
        
        assert result.status == "PASS"
        assert len(result.evidence) == 2
        assert "ev-intro-123" in result.evidence
        assert "ev-code-456" in result.evidence
    
    def test_check_ubrc_registered_with_failed_blocks_returns_fail(self):
        """_check_ubrc_registered with failed blocks should return FAIL."""
        verifier = RuntimeVerifier()
        snapshot = {
            "blocks": {
                "verified": [
                    {
                        "blockType": "introduction",
                        "registered": False,
                        "ubrcStatus": "UBRC_MISSING",
                        "evidenceId": None,
                    },
                ]
            }
        }
        contract = {}
        
        result = verifier._check_ubrc_registered(snapshot, contract)
        
        assert result.status == "FAIL"
        assert "introduction" in result.reason
        assert "UBRC_MISSING" in result.reason
    
    def test_runtime_verification_report_blocked_constructor(self):
        """RuntimeVerificationReport.blocked should create BLOCKED report."""
        report = RuntimeVerificationReport.blocked("wf-999", "test_reason")
        
        assert report.workflow_id == "wf-999"
        assert report.overall_status == "BLOCKED"
        assert report.snapshot_id == ""
        assert len(report.checks) == 0
    
    def test_verify_does_not_modify_snapshot(self):
        """Verify should not modify the snapshot (read-only)."""
        verifier = RuntimeVerifier()
        original_snapshot = {
            "snapshotId": "snap-123",
            "blocks": {"verified": []},
        }
        snapshot = original_snapshot.copy()
        contract = {"blockType": "introduction"}
        
        verifier.verify("wf-test", snapshot, contract)
        
        # Snapshot should remain unchanged
        assert snapshot == original_snapshot
    
    def test_verify_does_not_modify_contract(self):
        """Verify should not modify the contract (read-only)."""
        verifier = RuntimeVerifier()
        snapshot = {"snapshotId": "snap-123", "blocks": {}}
        original_contract = {"blockType": "introduction"}
        contract = original_contract.copy()
        
        verifier.verify("wf-test", snapshot, contract)
        
        # Contract should remain unchanged
        assert contract == original_contract
