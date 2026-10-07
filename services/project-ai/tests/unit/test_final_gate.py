"""
Tests for FinalGateController.

Tests verify the CERTIFICATION_READY ≠ CERTIFIED invariant:
1. compute_verdict NEVER returns CERTIFIED directly
2. Missing evidence → BLOCKED
3. Any FAIL gate → FAIL
4. Any BLOCKED gate → BLOCKED  
5. All PASS → CERTIFICATION_READY (NOT CERTIFIED)
6. CERTIFIED must come from Human Gate 2 approval (separate endpoint)
"""

import pytest
from app.agents.final_gate import FinalGateController, FinalGateResult, REQUIRED_EVIDENCE_KEYS


class TestFinalGateController:
    """Test FinalGateController verdict computation."""
    
    def test_missing_evidence_returns_blocked(self):
        """Missing required evidence → BLOCKED, never CERTIFIED."""
        controller = FinalGateController()
        
        # Missing all evidence
        result = controller.compute_verdict('wf-001', {})
        
        assert result.verdict == "BLOCKED"
        assert result.workflow_id == 'wf-001'
        assert len(result.missing_evidence) == len(REQUIRED_EVIDENCE_KEYS)
        assert result.missing_evidence == REQUIRED_EVIDENCE_KEYS
        assert result.failed_gates == []
        assert result.blocked_gates == []
        assert 'missing_required_evidence' in result.reason
    
    def test_partial_evidence_returns_blocked(self):
        """Partial evidence (some missing) → BLOCKED."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "PASS"},
            # Missing: canonical_comparison, placement_approval
        }
        
        result = controller.compute_verdict('wf-002', evidence)
        
        assert result.verdict == "BLOCKED"
        assert "canonical_comparison" in result.missing_evidence
        assert "placement_approval" in result.missing_evidence
        assert len(result.missing_evidence) == 2
    
    def test_one_fail_gate_returns_fail(self):
        """One FAIL gate → FAIL verdict."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "FAIL"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-003', evidence)
        
        assert result.verdict == "FAIL"
        assert result.workflow_id == 'wf-003'
        assert "runtime_verification" in result.failed_gates
        assert len(result.failed_gates) == 1
        assert result.missing_evidence == []
        assert 'gates_failed' in result.reason
    
    def test_multiple_fail_gates_returns_fail(self):
        """Multiple FAIL gates → FAIL with all failures listed."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "FAIL"},
            "runtime_verification": {"status": "FAIL"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-004', evidence)
        
        assert result.verdict == "FAIL"
        assert len(result.failed_gates) == 2
        assert "certification_gates" in result.failed_gates
        assert "runtime_verification" in result.failed_gates
    
    def test_one_blocked_gate_returns_blocked(self):
        """One BLOCKED gate → BLOCKED verdict."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "BLOCKED"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-005', evidence)
        
        assert result.verdict == "BLOCKED"
        assert "runtime_verification" in result.blocked_gates
        assert len(result.blocked_gates) == 1
        assert result.failed_gates == []
        assert 'gates_blocked' in result.reason
    
    def test_all_pass_returns_certification_ready_not_certified(self):
        """
        All gates PASS → CERTIFICATION_READY (NOT CERTIFIED).
        
        This is the KEY INVARIANT test:
        compute_verdict NEVER returns CERTIFIED directly.
        """
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "PASS"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-006', evidence)
        
        # CRITICAL ASSERTION: NOT CERTIFIED
        assert result.verdict == "CERTIFICATION_READY"
        assert result.verdict != "CERTIFIED", \
            "compute_verdict must NEVER return CERTIFIED directly"
        
        assert result.workflow_id == 'wf-006'
        assert result.missing_evidence == []
        assert result.failed_gates == []
        assert result.blocked_gates == []
        assert 'awaiting_human_gate_2' in result.reason
    
    def test_fail_takes_precedence_over_blocked(self):
        """FAIL takes precedence: FAIL + BLOCKED → FAIL."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "FAIL"},
            "runtime_verification": {"status": "BLOCKED"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-007', evidence)
        
        assert result.verdict == "FAIL"
        assert "certification_gates" in result.failed_gates
        assert "runtime_verification" in result.blocked_gates
    
    def test_missing_evidence_takes_precedence(self):
        """Missing evidence → BLOCKED, regardless of other gate states."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "FAIL"},
            # Missing: canonical_comparison, placement_approval
        }
        
        result = controller.compute_verdict('wf-008', evidence)
        
        # Missing evidence takes precedence
        assert result.verdict == "BLOCKED"
        assert len(result.missing_evidence) > 0
        assert "canonical_comparison" in result.missing_evidence
    
    def test_none_evidence_values_treated_as_missing(self):
        """None values in evidence dict treated as missing."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": None,  # Explicitly None
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-009', evidence)
        
        assert result.verdict == "BLOCKED"
        assert "runtime_verification" in result.missing_evidence
    
    def test_evidence_summary_included_in_result(self):
        """Evidence summary included in result for traceability."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS", "details": "ok"},
            "runtime_verification": {"status": "PASS"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-010', evidence)
        
        assert result.evidence_summary == evidence
        assert result.evidence_summary["certification_gates"]["details"] == "ok"
    
    def test_non_dict_evidence_values_not_checked_for_status(self):
        """
        Non-dict evidence values (strings, lists, etc.) are not checked
        for status, so they don't trigger FAIL/BLOCKED.
        """
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": "some string value",
            "runtime_verification": ["list", "of", "items"],
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-011', evidence)
        
        # Non-dict values are present (not missing) but don't have status
        # So no FAIL/BLOCKED from status checks
        assert result.verdict == "CERTIFICATION_READY"
        assert result.missing_evidence == []
    
    def test_extra_evidence_keys_ignored(self):
        """Extra evidence keys beyond required ones are safely ignored."""
        controller = FinalGateController()
        
        evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "PASS"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
            "extra_gate_1": {"status": "PASS"},
            "extra_gate_2": {"status": "FAIL"},  # Extra gate fails
        }
        
        result = controller.compute_verdict('wf-012', evidence)
        
        # Extra gate failures ARE checked
        assert result.verdict == "FAIL"
        assert "extra_gate_2" in result.failed_gates


class TestFinalGateResultModel:
    """Test FinalGateResult Pydantic model."""
    
    def test_valid_result_creation(self):
        """Valid FinalGateResult can be created."""
        result = FinalGateResult(
            workflow_id='wf-test',
            verdict='CERTIFICATION_READY',
            evidence_summary={},
            missing_evidence=[],
            failed_gates=[],
            blocked_gates=[],
            reason='test reason'
        )
        
        assert result.workflow_id == 'wf-test'
        assert result.verdict == 'CERTIFICATION_READY'
    
    def test_verdict_must_be_valid_literal(self):
        """Verdict must be one of the allowed literal values."""
        # Valid verdicts
        for verdict in ["CERTIFIED", "CERTIFICATION_READY", "FAIL", "BLOCKED"]:
            result = FinalGateResult(
                workflow_id='wf-test',
                verdict=verdict,
                evidence_summary={},
                missing_evidence=[],
                failed_gates=[],
                blocked_gates=[],
                reason='test'
            )
            assert result.verdict == verdict
    
    def test_invalid_verdict_raises_validation_error(self):
        """Invalid verdict value raises Pydantic validation error."""
        with pytest.raises(Exception):  # Pydantic ValidationError
            FinalGateResult(
                workflow_id='wf-test',
                verdict='INVALID_VERDICT',
                evidence_summary={},
                missing_evidence=[],
                failed_gates=[],
                blocked_gates=[],
                reason='test'
            )


class TestInvariantEnforcement:
    """
    Tests specifically for the architectural invariant:
    compute_verdict() NEVER returns CERTIFIED.
    """
    
    def test_compute_verdict_never_returns_certified(self):
        """
        Comprehensive test: no matter what evidence is provided,
        compute_verdict should never return CERTIFIED.
        """
        controller = FinalGateController()
        
        # Test all possible evidence configurations
        test_cases = [
            {},  # Empty
            {"certification_gates": {"status": "PASS"}},  # Partial
            {  # All pass
                "certification_gates": {"status": "PASS"},
                "runtime_verification": {"status": "PASS"},
                "canonical_comparison": {"status": "PASS"},
                "placement_approval": {"status": "PASS"},
            },
            {  # All pass with extras
                "certification_gates": {"status": "PASS"},
                "runtime_verification": {"status": "PASS"},
                "canonical_comparison": {"status": "PASS"},
                "placement_approval": {"status": "PASS"},
                "extra1": {"status": "PASS"},
                "extra2": {"status": "PASS"},
            },
        ]
        
        for i, evidence in enumerate(test_cases):
            result = controller.compute_verdict(f'wf-invariant-{i}', evidence)
            assert result.verdict != "CERTIFIED", \
                f"compute_verdict returned CERTIFIED for test case {i}: {evidence}"
    
    def test_certification_ready_is_maximum_verdict(self):
        """
        CERTIFICATION_READY is the maximum/best verdict from compute_verdict.
        CERTIFIED requires separate Human Gate 2 approval.
        """
        controller = FinalGateController()
        
        # Perfect evidence - all gates pass
        perfect_evidence = {
            "certification_gates": {"status": "PASS"},
            "runtime_verification": {"status": "PASS"},
            "canonical_comparison": {"status": "PASS"},
            "placement_approval": {"status": "PASS"},
        }
        
        result = controller.compute_verdict('wf-max', perfect_evidence)
        
        # Maximum verdict is CERTIFICATION_READY, not CERTIFIED
        assert result.verdict == "CERTIFICATION_READY"
        assert 'awaiting_human_gate_2' in result.reason.lower()
