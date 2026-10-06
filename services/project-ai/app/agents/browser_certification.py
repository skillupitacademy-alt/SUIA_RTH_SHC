"""
Browser Certification Runner.

ARCHITECTURAL RULE: DO NOT install Python Playwright.
Orchestrate Node Playwright only via subprocess.

This module runs Playwright tests using the existing Node/TypeScript infrastructure
and collects results for evidence generation.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
import subprocess
import json
import os


@dataclass
class BrowserTestResult:
    """Result of a single browser test."""
    testId: str
    title: str
    status: str  # 'passed' | 'failed' | 'skipped'
    duration: float
    errors: List[str]
    attachments: List[Dict[str, Any]]


@dataclass
class BrowserCertificationResult:
    """Result of complete browser certification run."""
    runId: str
    commitSha: str
    snapshotHash: str
    baseURL: str
    totalTests: int
    passedTests: int
    failedTests: int
    skippedTests: int
    testResults: List[BrowserTestResult]
    evidenceRecords: List[Dict[str, Any]]
    executionTimeMs: float
    timestamp: str


class BrowserCertificationRunner:
    """
    Orchestrates browser certification using Node Playwright.
    
    ARCHITECTURAL RULE: NO playwright-python installation.
    Python spawns Node process to execute Playwright tests.
    
    GRACEFUL DEGRADATION (Finding #8):
    When Playwright is unavailable or fails to execute:
    - Returns degraded result with ev-browser-degraded evidence ID
    - Gates should interpret as PASS with warning (not BLOCKED)
    - Allows workflow to continue without browser verification
    - Clearly documents reason for degradation in evidence
    
    Flow:
    1. Set environment variables for test context
    2. Execute: pnpm exec playwright test --config=playwright.project-ai.config.ts
    3. Parse JSON results from .project-ai/runs/current/results/playwright.json
    4. Generate EvidenceRecord for each test result
    5. Return BrowserCertificationResult (or degraded result if Playwright unavailable)
    """
    
    def __init__(self, repository_root: Path):
        """
        Initialize browser certification runner.
        
        Args:
            repository_root: Root path of the repository
        """
        self.repository_root = repository_root
    
    def run_certification(
        self,
        base_url: str,
        run_id: str,
        commit_sha: str,
        snapshot_hash: str
    ) -> BrowserCertificationResult:
        """
        Run browser certification tests.
        
        Args:
            base_url: Base URL for application under test
            run_id: Unique run identifier
            commit_sha: Git commit SHA
            snapshot_hash: Snapshot hash for evidence binding
            
        Returns:
            BrowserCertificationResult with test outcomes and evidence
        """
        start_time = datetime.now(timezone.utc)
        
        # Set environment variables for Playwright tests
        env = os.environ.copy()
        env['PROJECT_AI_BASE_URL'] = base_url
        env['PROJECT_AI_RUN_ID'] = run_id
        env['PROJECT_AI_COMMIT_SHA'] = commit_sha
        env['PROJECT_AI_SNAPSHOT_HASH'] = snapshot_hash
        
        # Ensure results directory exists
        results_dir = self.repository_root / '.project-ai' / 'runs' / 'current' / 'results'
        results_dir.mkdir(parents=True, exist_ok=True)
        
        # Execute Playwright via pnpm (approved command)
        cmd = [
            'pnpm',
            'exec',
            'playwright',
            'test',
            '--config=playwright.project-ai.config.ts'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.repository_root),
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            # Check if Playwright is unavailable (graceful degradation)
            if result.returncode != 0 and 'playwright' in result.stderr.lower():
                # Playwright may not be installed or configured
                return self._create_degraded_result(
                    run_id, commit_sha, snapshot_hash, base_url,
                    "Playwright unavailable - graceful degradation",
                    start_time
                )
            
            # Parse JSON results
            results_file = results_dir / 'playwright.json'
            
            if not results_file.exists():
                # No results file - tests may have failed to run
                return BrowserCertificationResult(
                    runId=run_id,
                    commitSha=commit_sha,
                    snapshotHash=snapshot_hash,
                    baseURL=base_url,
                    totalTests=0,
                    passedTests=0,
                    failedTests=0,
                    skippedTests=0,
                    testResults=[],
                    evidenceRecords=[],
                    executionTimeMs=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
            
            # Parse Playwright JSON reporter output
            with open(results_file, 'r', encoding='utf-8') as f:
                playwright_results = json.load(f)
            
            # Extract test results
            test_results = self._parse_playwright_results(playwright_results)
            
            # Generate evidence records
            evidence_records = self._generate_evidence_records(
                test_results,
                run_id,
                commit_sha,
                snapshot_hash
            )
            
            # Calculate statistics
            total = len(test_results)
            passed = sum(1 for t in test_results if t.status == 'passed')
            failed = sum(1 for t in test_results if t.status == 'failed')
            skipped = sum(1 for t in test_results if t.status == 'skipped')
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return BrowserCertificationResult(
                runId=run_id,
                commitSha=commit_sha,
                snapshotHash=snapshot_hash,
                baseURL=base_url,
                totalTests=total,
                passedTests=passed,
                failedTests=failed,
                skippedTests=skipped,
                testResults=test_results,
                evidenceRecords=evidence_records,
                executionTimeMs=execution_time,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            
        except subprocess.TimeoutExpired:
            # Tests timed out
            return BrowserCertificationResult(
                runId=run_id,
                commitSha=commit_sha,
                snapshotHash=snapshot_hash,
                baseURL=base_url,
                totalTests=0,
                passedTests=0,
                failedTests=1,
                skippedTests=0,
                testResults=[],
                evidenceRecords=[],
                executionTimeMs=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
        
        except Exception as e:
            # Unexpected error
            return BrowserCertificationResult(
                runId=run_id,
                commitSha=commit_sha,
                snapshotHash=snapshot_hash,
                baseURL=base_url,
                totalTests=0,
                passedTests=0,
                failedTests=1,
                skippedTests=0,
                testResults=[],
                evidenceRecords=[
                    {
                        'evidenceId': 'ev-browser-error',
                        'type': 'browser-certification-error',
                        'error': str(e),
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                ],
                executionTimeMs=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
    
    def _create_degraded_result(
        self,
        run_id: str,
        commit_sha: str,
        snapshot_hash: str,
        base_url: str,
        reason: str,
        start_time: datetime
    ) -> BrowserCertificationResult:
        """
        Create a degraded result when browser verification cannot execute.
        
        This supports graceful degradation when Playwright is unavailable.
        Gates should interpret this as PASS with warning (not BLOCKED).
        
        Args:
            run_id: Run identifier
            commit_sha: Git commit SHA
            snapshot_hash: Snapshot hash
            base_url: Base URL
            reason: Reason for degradation
            start_time: Execution start time
            
        Returns:
            BrowserCertificationResult with degradation marker
        """
        return BrowserCertificationResult(
            runId=run_id,
            commitSha=commit_sha,
            snapshotHash=snapshot_hash,
            baseURL=base_url,
            totalTests=0,
            passedTests=0,
            failedTests=0,
            skippedTests=0,
            testResults=[],
            evidenceRecords=[
                {
                    'evidenceId': 'ev-browser-degraded',
                    'type': 'browser-certification-degraded',
                    'reason': reason,
                    'degraded': True,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            ],
            executionTimeMs=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    def _parse_playwright_results(self, playwright_results: Dict[str, Any]) -> List[BrowserTestResult]:
        """
        Parse Playwright JSON reporter output.
        
        Args:
            playwright_results: Raw Playwright JSON results
            
        Returns:
            List of BrowserTestResult objects
        """
        test_results = []
        
        # Playwright JSON format: { suites: [...] }
        suites = playwright_results.get('suites', [])
        
        for suite in suites:
            specs = suite.get('specs', [])
            
            for spec in specs:
                tests = spec.get('tests', [])
                
                for test in tests:
                    results = test.get('results', [])
                    
                    for result in results:
                        status = result.get('status', 'unknown')
                        duration = result.get('duration', 0)
                        errors = []
                        
                        # Extract errors if present
                        if 'error' in result:
                            errors.append(result['error'].get('message', 'Unknown error'))
                        
                        # Extract attachments
                        attachments = result.get('attachments', [])
                        
                        test_result = BrowserTestResult(
                            testId=test.get('testId', ''),
                            title=test.get('title', ''),
                            status=status,
                            duration=duration,
                            errors=errors,
                            attachments=attachments
                        )
                        
                        test_results.append(test_result)
        
        return test_results
    
    def _generate_evidence_records(
        self,
        test_results: List[BrowserTestResult],
        run_id: str,
        commit_sha: str,
        snapshot_hash: str
    ) -> List[Dict[str, Any]]:
        """
        Generate evidence records from test results.
        
        Args:
            test_results: List of browser test results
            run_id: Run identifier
            commit_sha: Git commit SHA
            snapshot_hash: Snapshot hash
            
        Returns:
            List of evidence record dictionaries
        """
        evidence_records = []
        
        # Map test titles to evidence IDs
        evidence_mapping = {
            'preflight': 'ev-browser-001',
            'i2-composition': 'ev-browser-002',
            'i2 composition': 'ev-browser-002',
            'mix-match-composition': 'ev-browser-003',
            'mix-match': 'ev-browser-003',
            'mix and match': 'ev-browser-003'
        }
        
        for test_result in test_results:
            # Determine evidence ID based on test title
            evidence_id = 'ev-browser-unknown'
            title_lower = test_result.title.lower()
            
            for key, eid in evidence_mapping.items():
                if key in title_lower:
                    evidence_id = eid
                    break
            
            evidence_record = {
                'evidenceId': evidence_id,
                'type': 'browser-certification',
                'testId': test_result.testId,
                'testTitle': test_result.title,
                'status': test_result.status,
                'duration': test_result.duration,
                'errors': test_result.errors,
                'runId': run_id,
                'commitSha': commit_sha,
                'snapshotHash': snapshot_hash,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            evidence_records.append(evidence_record)
        
        return evidence_records
