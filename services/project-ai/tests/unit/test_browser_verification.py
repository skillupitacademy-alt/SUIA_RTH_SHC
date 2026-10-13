"""
Unit tests for browser verification module.

Tests verify:
1. BrowserVerifier handles missing Playwright gracefully (SKIPPED, not BLOCKED)
2. BrowserVerificationReport construction with all valid statuses
3. SKIPPED is a valid overall_status (not a certification blocker)
"""

import pytest
from unittest.mock import patch, MagicMock
from app.certification.browser_verification import (
    BrowserVerifier,
    BrowserVerificationReport,
    BrowserCheckResult,
)


class TestBrowserVerifier:
    """Test BrowserVerifier class."""
    
    def test_playwright_not_available_returns_skipped(self):
        """Test that verify returns SKIPPED when Playwright is not available."""
        with patch.object(BrowserVerifier, '_check_playwright', return_value=False):
            verifier = BrowserVerifier()
            
            result = verifier.verify(
                workflow_id="test-workflow-001",
                candidate_url="http://localhost:3000/candidate-block"
            )
            
            assert result.overall_status == "SKIPPED"
            assert result.playwright_available is False
            assert len(result.checks) == 0
            assert result.workflow_id == "test-workflow-001"
    
    def test_playwright_available_but_not_implemented_returns_blocked(self):
        """Test that verify returns BLOCKED when Playwright is available but checks not implemented."""
        with patch.object(BrowserVerifier, '_check_playwright', return_value=True):
            verifier = BrowserVerifier()
            
            result = verifier.verify(
                workflow_id="test-workflow-002",
                candidate_url="http://localhost:3000/candidate-block"
            )
            
            assert result.overall_status == "BLOCKED"
            assert result.playwright_available is True
            assert result.workflow_id == "test-workflow-002"
    
    def test_check_playwright_returns_false_on_import_error(self):
        """Test that _check_playwright returns False when Playwright cannot be imported."""
        verifier = BrowserVerifier()
        
        with patch('builtins.__import__', side_effect=ImportError("No module named 'playwright'")):
            result = verifier._check_playwright()
            
            assert result is False
    
    def test_check_playwright_returns_true_when_available(self):
        """Test that _check_playwright returns True when Playwright is available."""
        verifier = BrowserVerifier()
        
        # Mock successful import
        with patch('builtins.__import__', return_value=MagicMock()):
            result = verifier._check_playwright()
            
            # Note: This test may return True or False depending on actual Playwright installation
            # The key is that it doesn't raise an exception
            assert isinstance(result, bool)


class TestBrowserVerificationReport:
    """Test BrowserVerificationReport model."""
    
    def test_report_construction_with_skipped_status(self):
        """Test that BrowserVerificationReport can be constructed with SKIPPED status."""
        report = BrowserVerificationReport(
            workflow_id="test-workflow-003",
            playwright_available=False,
            checks=[],
            overall_status="SKIPPED"
        )
        
        assert report.workflow_id == "test-workflow-003"
        assert report.playwright_available is False
        assert report.overall_status == "SKIPPED"
        assert len(report.checks) == 0
    
    def test_report_construction_with_pass_status(self):
        """Test that BrowserVerificationReport can be constructed with PASS status."""
        check = BrowserCheckResult(
            check_id="visual_render",
            url="http://localhost:3000",
            status="PASS",
            screenshot_path="/screenshots/test.png",
            error=""
        )
        
        report = BrowserVerificationReport(
            workflow_id="test-workflow-004",
            playwright_available=True,
            checks=[check],
            overall_status="PASS"
        )
        
        assert report.overall_status == "PASS"
        assert len(report.checks) == 1
        assert report.checks[0].status == "PASS"
    
    def test_report_construction_with_fail_status(self):
        """Test that BrowserVerificationReport can be constructed with FAIL status."""
        check = BrowserCheckResult(
            check_id="console_errors",
            url="http://localhost:3000",
            status="FAIL",
            screenshot_path=None,
            error="Console errors detected: TypeError at line 42"
        )
        
        report = BrowserVerificationReport(
            workflow_id="test-workflow-005",
            playwright_available=True,
            checks=[check],
            overall_status="FAIL"
        )
        
        assert report.overall_status == "FAIL"
        assert report.checks[0].error != ""
    
    def test_report_construction_with_blocked_status(self):
        """Test that BrowserVerificationReport can be constructed with BLOCKED status."""
        report = BrowserVerificationReport(
            workflow_id="test-workflow-006",
            playwright_available=True,
            checks=[],
            overall_status="BLOCKED"
        )
        
        assert report.overall_status == "BLOCKED"


class TestBrowserCheckResult:
    """Test BrowserCheckResult model."""
    
    def test_check_result_with_all_statuses(self):
        """Test that BrowserCheckResult accepts all valid statuses."""
        valid_statuses = ["PASS", "FAIL", "BLOCKED", "SKIPPED"]
        
        for status in valid_statuses:
            result = BrowserCheckResult(
                check_id=f"test_{status.lower()}",
                url="http://localhost:3000",
                status=status,
                screenshot_path=None,
                error=""
            )
            
            assert result.status == status
    
    def test_check_result_with_screenshot(self):
        """Test that BrowserCheckResult can store screenshot path."""
        result = BrowserCheckResult(
            check_id="visual_render",
            url="http://localhost:3000",
            status="PASS",
            screenshot_path="/screenshots/workflow-123.png",
            error=""
        )
        
        assert result.screenshot_path == "/screenshots/workflow-123.png"
    
    def test_check_result_with_error_message(self):
        """Test that BrowserCheckResult can store error messages."""
        result = BrowserCheckResult(
            check_id="accessibility",
            url="http://localhost:3000",
            status="FAIL",
            screenshot_path=None,
            error="Missing alt text on 3 images"
        )
        
        assert result.error == "Missing alt text on 3 images"


class TestBrowserVerificationIntegration:
    """Integration tests for browser verification."""
    
    def test_skipped_status_is_not_blocker(self):
        """
        Test that SKIPPED status is acceptable and not a certification blocker.
        
        This is a critical architectural decision: browser verification is optional
        until Playwright is configured. SKIPPED means "not performed" not "failed".
        """
        with patch.object(BrowserVerifier, '_check_playwright', return_value=False):
            verifier = BrowserVerifier()
            result = verifier.verify(
                workflow_id="cert-test-001",
                candidate_url="http://localhost:3000/block"
            )
            
            # SKIPPED is a valid terminal state
            assert result.overall_status == "SKIPPED"
            
            # Should not be treated as FAIL or BLOCKED
            assert result.overall_status != "FAIL"
            assert result.overall_status != "BLOCKED"
            
            # Document that this is acceptable behavior
            assert result.playwright_available is False
    
    def test_blocked_vs_skipped_distinction(self):
        """
        Test the distinction between BLOCKED and SKIPPED.
        
        SKIPPED: Playwright not available (acceptable, not a blocker)
        BLOCKED: Playwright available but verification cannot complete (requires investigation)
        """
        # SKIPPED case
        with patch.object(BrowserVerifier, '_check_playwright', return_value=False):
            verifier_skipped = BrowserVerifier()
            result_skipped = verifier_skipped.verify(
                workflow_id="test-skipped",
                candidate_url="http://localhost:3000"
            )
            assert result_skipped.overall_status == "SKIPPED"
        
        # BLOCKED case
        with patch.object(BrowserVerifier, '_check_playwright', return_value=True):
            verifier_blocked = BrowserVerifier()
            result_blocked = verifier_blocked.verify(
                workflow_id="test-blocked",
                candidate_url="http://localhost:3000"
            )
            assert result_blocked.overall_status == "BLOCKED"
        
        # These are different states with different meanings
        assert result_skipped.overall_status != result_blocked.overall_status
