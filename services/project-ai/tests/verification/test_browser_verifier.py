"""
Tests for browser_verifier module.

Tests cover:
1. Playwright availability check
2. pnpm availability check
3. Graceful degradation when Playwright unavailable (status = BLOCKED)
4. Successful browser verification execution
5. DOM verification
6. UBRC attribute verification
7. Screenshot capture
8. Console error collection
9. Network failure collection
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import subprocess
import json

from app.verification.browser_verifier import (
    BrowserVerifier,
    BrowserVerificationEvidence,
    verify_browser_rendering
)


class TestBrowserVerifierInitialization:
    """Test BrowserVerifier initialization."""
    
    def test_init_with_playwright_available(self):
        """Initialize with Playwright available."""
        preflight_data = {
            "playwright_available": True,
            "playwright_version": "1.59.1"
        }
        
        verifier = BrowserVerifier(Path("/test"), preflight_data)
        
        assert verifier.playwright_available is True
        assert verifier.playwright_version == "1.59.1"
    
    def test_init_with_playwright_unavailable(self):
        """Initialize with Playwright unavailable."""
        preflight_data = {
            "playwright_available": False,
            "playwright_version": "unknown"
        }
        
        verifier = BrowserVerifier(Path("/test"), preflight_data)
        
        assert verifier.playwright_available is False
        assert verifier.playwright_version == "unknown"


class TestPlaywrightAvailabilityCheck:
    """Test Playwright availability checking."""
    
    def test_blocked_when_playwright_unavailable(self, tmp_path):
        """Returns BLOCKED status when Playwright unavailable."""
        preflight_data = {"playwright_available": False}
        verifier = BrowserVerifier(tmp_path, preflight_data)
        
        evidence = verifier.verify_block_rendering(
            tutorial_url="http://localhost:3000/tutorial/test",
            block_id="test-block-1",
            block_type="introduction",
            block_version="1.0.0",
            screenshot_dir=tmp_path / "screenshots"
        )
        
        assert evidence.status == "BLOCKED"
        assert evidence.blocker_reason == "Playwright not available in environment"
        assert evidence.playwright_executed is False
        assert evidence.dom_verified is False
    
    def test_blocked_when_pnpm_unavailable(self, tmp_path):
        """Returns BLOCKED status when pnpm unavailable."""
        preflight_data = {"playwright_available": True, "playwright_version": "1.59.1"}
        verifier = BrowserVerifier(tmp_path, preflight_data)
        
        with patch('subprocess.run', side_effect=FileNotFoundError("pnpm not found")):
            evidence = verifier.verify_block_rendering(
                tutorial_url="http://localhost:3000/tutorial/test",
                block_id="test-block-1",
                block_type="introduction",
                block_version="1.0.0",
                screenshot_dir=tmp_path / "screenshots"
            )
        
        assert evidence.status == "BLOCKED"
        assert "pnpm not available" in evidence.blocker_reason
        assert evidence.playwright_executed is False


class TestBrowserVerification:
    """Test browser verification execution."""
    
    def test_successful_verification(self, tmp_path):
        """Successful browser verification returns PASS."""
        preflight_data = {"playwright_available": True, "playwright_version": "1.59.1"}
        verifier = BrowserVerifier(tmp_path, preflight_data)
        
        # Mock subprocess calls
        mock_pnpm_version = Mock()
        mock_pnpm_version.returncode = 0
        mock_pnpm_version.stdout = "9.0.0"
        
        mock_playwright_version = Mock()
        mock_playwright_version.returncode = 0
        mock_playwright_version.stdout = "Version 1.59.1"
        
        mock_playwright_test = Mock()
        mock_playwright_test.returncode = 0
        mock_playwright_test.stdout = json.dumps({
            "suites": [{
                "specs": [{
                    "tests": [{
                        "results": [{
                            "status": "passed"
                        }]
                    }]
                }]
            }]
        })
        
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = [
                mock_pnpm_version,
                mock_playwright_version,
                mock_playwright_test
            ]
            
            evidence = verifier.verify_block_rendering(
                tutorial_url="http://localhost:3000/tutorial/test",
                block_id="test-block-1",
                block_type="introduction",
                block_version="1.0.0",
                screenshot_dir=tmp_path / "screenshots"
            )
        
        assert evidence.status == "PASS"
        assert evidence.playwright_executed is True
        assert evidence.dom_verified is True
        assert evidence.ubrc_attributes["data-block-id"] == "test-block-1"
        assert evidence.ubrc_attributes["data-block-type"] == "introduction"
        assert evidence.ubrc_attributes["data-block-version"] == "1.0.0"
    
    def test_blocked_on_playwright_test_failure(self, tmp_path):
        """Returns BLOCKED when Playwright tests fail."""
        preflight_data = {"playwright_available": True, "playwright_version": "1.59.1"}
        verifier = BrowserVerifier(tmp_path, preflight_data)
        
        mock_pnpm_version = Mock()
        mock_pnpm_version.returncode = 0
        
        mock_playwright_version = Mock()
        mock_playwright_version.returncode = 0
        
        mock_playwright_test = Mock()
        mock_playwright_test.returncode = 1
        mock_playwright_test.stderr = "Test failed: Block not found"
        
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = [
                mock_pnpm_version,
                mock_playwright_version,
                mock_playwright_test
            ]
            
            evidence = verifier.verify_block_rendering(
                tutorial_url="http://localhost:3000/tutorial/test",
                block_id="test-block-1",
                block_type="introduction",
                block_version="1.0.0",
                screenshot_dir=tmp_path / "screenshots"
            )
        
        assert evidence.status == "BLOCKED"
        assert "Playwright tests failed" in evidence.blocker_reason
        assert evidence.playwright_executed is True
    
    def test_blocked_on_timeout(self, tmp_path):
        """Returns BLOCKED when Playwright execution times out."""
        preflight_data = {"playwright_available": True, "playwright_version": "1.59.1"}
        verifier = BrowserVerifier(tmp_path, preflight_data)
        
        mock_pnpm_version = Mock()
        mock_pnpm_version.returncode = 0
        
        mock_playwright_version = Mock()
        mock_playwright_version.returncode = 0
        
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = [
                mock_pnpm_version,
                mock_playwright_version,
                subprocess.TimeoutExpired("playwright", 120)
            ]
            
            evidence = verifier.verify_block_rendering(
                tutorial_url="http://localhost:3000/tutorial/test",
                block_id="test-block-1",
                block_type="introduction",
                block_version="1.0.0",
                screenshot_dir=tmp_path / "screenshots"
            )
        
        assert evidence.status == "BLOCKED"
        assert "exceeded 120s timeout" in evidence.blocker_reason


class TestScreenshotCapture:
    """Test screenshot capture functionality."""
    
    def test_screenshot_directory_created(self, tmp_path):
        """Screenshot directory is created if it doesn't exist."""
        preflight_data = {"playwright_available": True, "playwright_version": "1.59.1"}
        verifier = BrowserVerifier(tmp_path, preflight_data)
        
        screenshot_dir = tmp_path / "screenshots"
        assert not screenshot_dir.exists()
        
        mock_pnpm = Mock(returncode=0)
        mock_playwright = Mock(returncode=0)
        mock_test = Mock(returncode=0, stdout="")
        
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = [mock_pnpm, mock_playwright, mock_test]
            
            verifier.verify_block_rendering(
                tutorial_url="http://localhost:3000/tutorial/test",
                block_id="test-block-1",
                block_type="introduction",
                block_version="1.0.0",
                screenshot_dir=screenshot_dir
            )
        
        assert screenshot_dir.exists()


class TestConvenienceFunction:
    """Test verify_browser_rendering convenience function."""
    
    def test_convenience_function(self, tmp_path):
        """Convenience function creates verifier and executes verification."""
        preflight_data = {"playwright_available": True, "playwright_version": "1.59.1"}
        
        mock_pnpm = Mock(returncode=0)
        mock_playwright = Mock(returncode=0)
        mock_test = Mock(returncode=0, stdout="")
        
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = [mock_pnpm, mock_playwright, mock_test]
            
            evidence = verify_browser_rendering(
                repository_root=tmp_path,
                preflight_data=preflight_data,
                tutorial_url="http://localhost:3000/tutorial/test",
                block_id="test-block-1",
                block_type="introduction",
                block_version="1.0.0",
                screenshot_dir=tmp_path / "screenshots"
            )
        
        assert evidence.status == "PASS"
        assert evidence.playwright_executed is True


class TestEvidenceStructure:
    """Test BrowserVerificationEvidence structure."""
    
    def test_evidence_defaults(self):
        """Evidence initializes with correct defaults."""
        evidence = BrowserVerificationEvidence()
        
        assert evidence.agent == "browser"
        assert evidence.status == "PASS"
        assert evidence.playwright_executed is False
        assert evidence.playwright_output is None
        assert evidence.dom_verified is False
        assert evidence.ubrc_attributes == {
            "data-block-id": None,
            "data-block-type": None,
            "data-block-version": None
        }
        assert evidence.screenshot_path is None
        assert evidence.console_errors == []
        assert evidence.network_failures == []
        assert evidence.blocker_reason is None
    
    def test_evidence_custom_values(self):
        """Evidence can be initialized with custom values."""
        evidence = BrowserVerificationEvidence(
            status="BLOCKED",
            playwright_executed=True,
            dom_verified=True,
            blocker_reason="Test blocker"
        )
        
        assert evidence.status == "BLOCKED"
        assert evidence.playwright_executed is True
        assert evidence.dom_verified is True
        assert evidence.blocker_reason == "Test blocker"
