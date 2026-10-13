"""
Tests for browser certification runner.

Tests cover:
1. Preflight environment variable detection
2. Evidence logging
3. BrowserCertificationRunner invokes pnpm (not python playwright)
4. Result parsing from Playwright JSON
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import subprocess
import json

from app.agents.browser_certification import (
    BrowserCertificationRunner,
    BrowserTestResult,
    BrowserCertificationResult
)


class TestBrowserCertificationRunner:
    """Test browser certification runner."""
    
    def test_runner_initialization(self):
        """Runner initializes with repository root."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        assert runner.repository_root == Path('/test/repo')
    
    def test_run_certification_invokes_pnpm(self):
        """Certification invokes pnpm exec playwright, not python playwright."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        with patch('subprocess.run') as mock_run:
            with patch('pathlib.Path.mkdir'):
                with patch('pathlib.Path.exists', return_value=False):
                    # Mock subprocess result
                    mock_run.return_value = Mock(returncode=0, stdout='', stderr='')
                    
                    result = runner.run_certification(
                        base_url='http://localhost:3001',
                        run_id='test-run',
                        commit_sha='abc123',
                        snapshot_hash='def456'
                    )
                    
                    # Verify pnpm command called
                    assert mock_run.called
                    call_args = mock_run.call_args[0][0]
                    assert call_args[0] == 'pnpm'
                    assert call_args[1] == 'exec'
                    assert call_args[2] == 'playwright'
                    assert call_args[3] == 'test'
                    assert '--config=playwright.project-ai.config.ts' in call_args
                    
                    # Verify no results when file doesn't exist
                    assert result.totalTests == 0
    
    def test_run_certification_sets_environment_variables(self):
        """Certification sets PROJECT_AI environment variables."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        with patch('subprocess.run') as mock_run:
            with patch('pathlib.Path.mkdir'):
                with patch('pathlib.Path.exists', return_value=False):
                    mock_run.return_value = Mock(returncode=0, stdout='', stderr='')
                    
                    runner.run_certification(
                        base_url='http://localhost:3001',
                        run_id='test-run-123',
                        commit_sha='abc123def',
                        snapshot_hash='def456ghi'
                    )
                    
                    # Verify environment variables passed
                    call_kwargs = mock_run.call_args[1]
                    env = call_kwargs['env']
                    
                    assert env['PROJECT_AI_BASE_URL'] == 'http://localhost:3001'
                    assert env['PROJECT_AI_RUN_ID'] == 'test-run-123'
                    assert env['PROJECT_AI_COMMIT_SHA'] == 'abc123def'
                    assert env['PROJECT_AI_SNAPSHOT_HASH'] == 'def456ghi'
    
    def test_parse_playwright_results(self):
        """Parse Playwright JSON reporter output correctly."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        # Mock Playwright JSON format
        playwright_results = {
            'suites': [
                {
                    'specs': [
                        {
                            'tests': [
                                {
                                    'testId': 'test-1',
                                    'title': 'should pass preflight checks',
                                    'results': [
                                        {
                                            'status': 'passed',
                                            'duration': 1500,
                                            'attachments': []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        test_results = runner._parse_playwright_results(playwright_results)
        
        assert len(test_results) == 1
        assert test_results[0].testId == 'test-1'
        assert test_results[0].title == 'should pass preflight checks'
        assert test_results[0].status == 'passed'
        assert test_results[0].duration == 1500
    
    def test_generate_evidence_records(self):
        """Generate evidence records from test results."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        test_results = [
            BrowserTestResult(
                testId='test-1',
                title='should pass preflight checks',
                status='passed',
                duration=1500,
                errors=[],
                attachments=[]
            ),
            BrowserTestResult(
                testId='test-2',
                title='should create I2 composition',
                status='passed',
                duration=3000,
                errors=[],
                attachments=[]
            )
        ]
        
        evidence_records = runner._generate_evidence_records(
            test_results,
            run_id='test-run',
            commit_sha='abc123',
            snapshot_hash='def456'
        )
        
        assert len(evidence_records) == 2
        
        # First record should be preflight (ev-browser-001)
        assert evidence_records[0]['evidenceId'] == 'ev-browser-001'
        assert evidence_records[0]['type'] == 'browser-certification'
        assert evidence_records[0]['status'] == 'passed'
        
        # Second record should be i2-composition (ev-browser-002)
        assert evidence_records[1]['evidenceId'] == 'ev-browser-002'
    
    def test_run_certification_timeout(self):
        """Certification handles subprocess timeout."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        with patch('subprocess.run') as mock_run:
            with patch('pathlib.Path.mkdir'):
                # Mock timeout
                mock_run.side_effect = subprocess.TimeoutExpired('cmd', 300)
                
                result = runner.run_certification(
                    base_url='http://localhost:3001',
                    run_id='test-run',
                    commit_sha='abc123',
                    snapshot_hash='def456'
                )
                
                assert result.totalTests == 0
                assert result.failedTests == 1
    
    def test_run_certification_exception(self):
        """Certification handles unexpected exceptions."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        with patch('subprocess.run') as mock_run:
            with patch('pathlib.Path.mkdir'):
                # Mock exception
                mock_run.side_effect = Exception('Unexpected error')
                
                result = runner.run_certification(
                    base_url='http://localhost:3001',
                    run_id='test-run',
                    commit_sha='abc123',
                    snapshot_hash='def456'
                )
                
                assert result.failedTests == 1
                assert len(result.evidenceRecords) > 0
                assert result.evidenceRecords[0]['evidenceId'] == 'ev-browser-error'
    
    def test_run_certification_with_results_file(self):
        """Certification parses results file when present."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        mock_results = {
            'suites': [
                {
                    'specs': [
                        {
                            'tests': [
                                {
                                    'testId': 'test-1',
                                    'title': 'preflight test',
                                    'results': [
                                        {
                                            'status': 'passed',
                                            'duration': 1000,
                                            'attachments': []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        with patch('subprocess.run') as mock_run:
            with patch('pathlib.Path.mkdir'):
                with patch('pathlib.Path.exists', return_value=True):
                    with patch('builtins.open', create=True) as mock_open:
                        # Mock file read
                        mock_open.return_value.__enter__.return_value.read.return_value = json.dumps(mock_results)
                        mock_file = MagicMock()
                        mock_file.__enter__.return_value = mock_file
                        mock_file.read.return_value = json.dumps(mock_results)
                        mock_open.return_value = mock_file
                        
                        mock_run.return_value = Mock(returncode=0, stdout='', stderr='')
                        
                        # Mock json.load
                        with patch('json.load', return_value=mock_results):
                            result = runner.run_certification(
                                base_url='http://localhost:3001',
                                run_id='test-run',
                                commit_sha='abc123',
                                snapshot_hash='def456'
                            )
                            
                            assert result.totalTests == 1
                            assert result.passedTests == 1
                            assert result.failedTests == 0


class TestEvidenceMapping:
    """Test evidence ID mapping from test titles."""
    
    def test_preflight_evidence_mapping(self):
        """Preflight tests map to ev-browser-001."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        test_results = [
            BrowserTestResult(
                testId='test-1',
                title='should pass preflight checks',
                status='passed',
                duration=1000,
                errors=[],
                attachments=[]
            )
        ]
        
        evidence = runner._generate_evidence_records(
            test_results, 'run', 'commit', 'hash'
        )
        
        assert evidence[0]['evidenceId'] == 'ev-browser-001'
    
    def test_i2_composition_evidence_mapping(self):
        """I2 composition tests map to ev-browser-002."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        test_results = [
            BrowserTestResult(
                testId='test-2',
                title='I2 composition should work',
                status='passed',
                duration=2000,
                errors=[],
                attachments=[]
            )
        ]
        
        evidence = runner._generate_evidence_records(
            test_results, 'run', 'commit', 'hash'
        )
        
        assert evidence[0]['evidenceId'] == 'ev-browser-002'
    
    def test_mix_match_evidence_mapping(self):
        """Mix-match tests map to ev-browser-003."""
        runner = BrowserCertificationRunner(Path('/test/repo'))
        
        test_results = [
            BrowserTestResult(
                testId='test-3',
                title='mix-match composition should work',
                status='passed',
                duration=3000,
                errors=[],
                attachments=[]
            )
        ]
        
        evidence = runner._generate_evidence_records(
            test_results, 'run', 'commit', 'hash'
        )
        
        assert evidence[0]['evidenceId'] == 'ev-browser-003'
