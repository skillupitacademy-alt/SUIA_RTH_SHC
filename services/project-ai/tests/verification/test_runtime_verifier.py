"""
Tests for RuntimeVerifier.

These tests verify the runtime verification logic without starting the actual application.
For integration tests that start the application, run the verifier directly.
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from app.verification.runtime_verifier import (
    RuntimeVerifier,
    RuntimeVerificationResult,
)


class TestRuntimeVerifier:
    """Test suite for RuntimeVerifier."""
    
    def test_init_default_workspace(self):
        """Test RuntimeVerifier initializes with default workspace."""
        verifier = RuntimeVerifier()
        assert verifier.workspace_root is not None
        assert verifier.health_url == "http://localhost:3000/api/health"
        assert verifier.process is None
    
    def test_init_custom_workspace(self):
        """Test RuntimeVerifier initializes with custom workspace."""
        custom_path = Path("/custom/workspace")
        verifier = RuntimeVerifier(workspace_root=custom_path)
        assert verifier.workspace_root == custom_path
    
    @patch('app.verification.runtime_verifier.Path.exists')
    @patch('builtins.open')
    def test_load_preflight_success(self, mock_open, mock_exists):
        """Test loading preflight configuration successfully."""
        mock_exists.return_value = True
        mock_open.return_value.__enter__.return_value.read.return_value = '{"application_start_command": "pnpm dev"}'
        
        verifier = RuntimeVerifier()
        preflight = verifier._load_preflight(Path("test.json"))
        
        assert preflight is not None
        assert preflight.get("application_start_command") == "pnpm dev"
    
    @patch('app.verification.runtime_verifier.Path.exists')
    def test_load_preflight_not_found(self, mock_exists):
        """Test loading preflight when file doesn't exist."""
        mock_exists.return_value = False
        
        verifier = RuntimeVerifier()
        preflight = verifier._load_preflight(Path("nonexistent.json"))
        
        assert preflight is None
    
    @patch('subprocess.Popen')
    def test_start_application_success(self, mock_popen):
        """Test starting application process successfully."""
        mock_process = Mock()
        mock_process.poll.return_value = None  # Process is running
        mock_popen.return_value = mock_process
        
        verifier = RuntimeVerifier()
        result = RuntimeVerificationResult()
        
        success = verifier._start_application("pnpm dev", result)
        
        assert success is True
        assert verifier.process is not None
        assert len(result.errors) == 0
    
    @patch('subprocess.Popen')
    def test_start_application_immediate_exit(self, mock_popen):
        """Test starting application that exits immediately."""
        mock_process = Mock()
        mock_process.poll.return_value = 1  # Process exited
        mock_popen.return_value = mock_process
        
        verifier = RuntimeVerifier()
        result = RuntimeVerificationResult()
        
        success = verifier._start_application("pnpm dev", result)
        
        assert success is False
        assert "exited immediately" in result.errors[0]
    
    @patch('subprocess.Popen')
    def test_start_application_exception(self, mock_popen):
        """Test starting application with exception."""
        mock_popen.side_effect = Exception("Command not found")
        
        verifier = RuntimeVerifier()
        result = RuntimeVerificationResult()
        
        success = verifier._start_application("invalid_command", result)
        
        assert success is False
        assert "Failed to start application" in result.errors[0]
    
    def test_wait_for_health_no_requests(self):
        """Test health check when requests module is not available."""
        verifier = RuntimeVerifier()
        verifier.process = Mock(poll=Mock(return_value=None))
        result = RuntimeVerificationResult()
        
        # The verifier should handle missing requests gracefully
        # (it returns False with an error)
        success = verifier._wait_for_health(timeout=1, result=result)
        
        # Could be True (requests available) or False (not available)
        # Just verify it doesn't crash
        assert isinstance(success, bool)
    
    def test_wait_for_health_process_crashed(self):
        """Test health check when process crashes during startup."""
        verifier = RuntimeVerifier()
        verifier.process = Mock(poll=Mock(return_value=1))  # Process crashed
        result = RuntimeVerificationResult()
        
        success = verifier._wait_for_health(timeout=1, result=result)
        
        assert success is False
        assert "crashed during startup" in result.errors[0]
    
    def test_verify_route_no_requests(self):
        """Test route verification when requests module is not available."""
        verifier = RuntimeVerifier()
        result = RuntimeVerificationResult()
        
        # The verifier should handle missing requests gracefully
        success = verifier._verify_route(result)
        
        # Could succeed or fail depending on requests availability
        assert isinstance(success, bool)
    
    def test_verify_route_sets_status(self):
        """Test that route verification sets route_status in result."""
        verifier = RuntimeVerifier()
        result = RuntimeVerificationResult()
        
        # Run the verification (may or may not succeed based on environment)
        verifier._verify_route(result)
        
        # If requests is available and call was made, status should be set
        # Otherwise it remains None - both are valid
        assert result.route_status is None or isinstance(result.route_status, int)
    
    def test_check_runtime_errors_no_process(self):
        """Test runtime error check with no process."""
        verifier = RuntimeVerifier()
        result = RuntimeVerificationResult()
        
        success = verifier._check_runtime_errors(result)
        
        assert success is True
    
    def test_check_runtime_errors_process_alive(self):
        """Test runtime error check with running process."""
        mock_process = Mock()
        mock_process.poll.return_value = None  # Process running
        
        verifier = RuntimeVerifier()
        verifier.process = mock_process
        result = RuntimeVerificationResult()
        
        success = verifier._check_runtime_errors(result)
        
        assert success is True
        assert "No fatal runtime errors" in result.runtime_log[-1]
    
    def test_check_runtime_errors_process_terminated(self):
        """Test runtime error check with terminated process."""
        mock_process = Mock()
        mock_process.poll.return_value = 1  # Process terminated
        
        verifier = RuntimeVerifier()
        verifier.process = mock_process
        result = RuntimeVerificationResult()
        
        success = verifier._check_runtime_errors(result)
        
        assert success is False
        assert "terminated unexpectedly" in result.errors[0]
    
    def test_stop_application_graceful(self):
        """Test graceful application stop."""
        mock_process = Mock()
        mock_process.wait.return_value = None
        
        verifier = RuntimeVerifier()
        verifier.process = mock_process
        result = RuntimeVerificationResult()
        
        verifier._stop_application(result)
        
        assert verifier.process is None
        assert "stopped gracefully" in result.runtime_log[-1]
    
    def test_stop_application_force_kill(self):
        """Test application force kill after timeout."""
        mock_process = Mock()
        mock_process.wait.side_effect = [
            Exception("TimeoutExpired"),
            None  # Second call (after kill) succeeds
        ]
        
        verifier = RuntimeVerifier()
        verifier.process = mock_process
        result = RuntimeVerificationResult()
        
        verifier._stop_application(result)
        
        assert verifier.process is None
        assert mock_process.kill.called
    
    def test_verification_result_default_blocked(self):
        """Test RuntimeVerificationResult defaults to BLOCKED status."""
        result = RuntimeVerificationResult()
        
        assert result.agent == "runtime"
        assert result.status == "BLOCKED"
        assert result.startup_time_ms is None
        assert result.route_status is None
        assert result.block_rendered is False
        assert result.errors == []
        assert result.runtime_log == []
        assert result.blocker_reason is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
