"""
Playwright Browser Agent (Agent 12L).

Orchestrates Node Playwright via subprocess to verify blocks in browser.

ARCHITECTURAL RULE:
- NO Python Playwright library
- Orchestrate Node Playwright via: pnpm exec playwright test --config=playwright.project-ai.config.ts
- Set environment variables for test execution
- Parse JSON results from .project-ai/runs/current/results/playwright.json
- Return evidence_ids from snapshot

Environment Variables Set:
- PROJECT_AI_BASE_URL: Base URL of application
- PROJECT_AI_RUN_ID: Unique run identifier
- PROJECT_AI_COMMIT_SHA: Git commit SHA
- PROJECT_AI_SNAPSHOT_HASH: Snapshot hash
"""

import subprocess
import json
import os
import uuid
from datetime import datetime, UTC
from typing import Any, Dict, List
from pathlib import Path

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


async def execute_playwright_browser_agent(context: AgentContext) -> AgentResult:
    """
    Execute Playwright Browser Agent (Agent 12L).
    
    Workflow:
    1. Extract candidate blocks and configuration from workflow state
    2. Set up environment variables for Playwright test execution
    3. Orchestrate Node Playwright via subprocess: pnpm exec playwright test
    4. Wait for execution to complete (timeout: 600s / 10 minutes)
    5. Parse results from .project-ai/runs/current/results/playwright.json
    6. Collect screenshot paths and evidence_ids
    7. Return AgentResult with browser_status, tests_passed, tests_failed, screenshot_paths, evidence_ids
    
    Args:
        context: Agent execution context with snapshot and workflow state
        
    Returns:
        AgentResult with Playwright test results
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract workflow state
        snapshot = context.repository_snapshot
        workflow_state = context.workflow_state
        
        # Get candidate blocks from workflow state
        candidate_blocks = workflow_state.get('candidate_blocks', [])
        if not candidate_blocks:
            # Try to get from prior agent outputs
            placement_result = context.prior_agent_outputs.get('placement', None)
            if placement_result and placement_result.outputs:
                candidate_blocks = placement_result.outputs.get('placed_blocks', [])
        
        if not candidate_blocks:
            return AgentResult(
                agent_id="playwright_browser_agent",
                status=AgentStatus.BLOCKED,
                outputs={
                    'browser_status': 'BLOCKED',
                    'message': 'No candidate blocks to verify'
                },
                evidence_ids=[],
                errors=['No candidate blocks found in workflow state'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Get configuration
        base_url = workflow_state.get('base_url', 'http://localhost:3000')
        run_id = workflow_state.get('run_id', f"run-{uuid.uuid4().hex[:8]}")
        commit_sha = workflow_state.get('commit_sha', 'unknown')
        snapshot_hash = snapshot.get('snapshotHash', 'unknown')
        
        # Set up environment variables for Playwright test execution
        test_env = os.environ.copy()
        test_env['PROJECT_AI_BASE_URL'] = base_url
        test_env['PROJECT_AI_RUN_ID'] = run_id
        test_env['PROJECT_AI_COMMIT_SHA'] = commit_sha
        test_env['PROJECT_AI_SNAPSHOT_HASH'] = snapshot_hash
        test_env['PROJECT_AI_CANDIDATE_BLOCKS'] = ','.join(candidate_blocks)
        
        # Playwright command: pnpm exec playwright test --config=playwright.project-ai.config.ts
        cmd = [
            'pnpm',
            'exec',
            'playwright',
            'test',
            '--config=playwright.project-ai.config.ts'
        ]
        
        # Execute Playwright via subprocess
        try:
            result = subprocess.run(
                cmd,
                env=test_env,
                cwd=str(context.repository_root),
                capture_output=True,
                text=True,
                timeout=600,  # 10 minutes timeout
                shell=False  # SAFETY: No shell execution
            )
        except subprocess.TimeoutExpired:
            return AgentResult(
                agent_id="playwright_browser_agent",
                status=AgentStatus.FAILED,
                outputs={
                    'browser_status': 'TIMEOUT',
                    'message': 'Playwright execution timed out after 600 seconds'
                },
                evidence_ids=[],
                errors=['Playwright test execution timeout'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        except FileNotFoundError:
            return AgentResult(
                agent_id="playwright_browser_agent",
                status=AgentStatus.BLOCKED,
                outputs={
                    'browser_status': 'BLOCKED',
                    'message': 'Playwright not installed or pnpm not available'
                },
                evidence_ids=[],
                errors=['Playwright not found. Install: pnpm add -D playwright && pnpm exec playwright install chromium'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Parse JSON results from .project-ai/runs/current/results/playwright.json
        results_path = context.repository_root / '.project-ai' / 'runs' / 'current' / 'results' / 'playwright.json'
        
        if not results_path.exists():
            # No results file - check if Playwright ran at all
            stderr = result.stderr if result.stderr else ''
            stdout = result.stdout if result.stdout else ''
            
            return AgentResult(
                agent_id="playwright_browser_agent",
                status=AgentStatus.FAILED,
                outputs={
                    'browser_status': 'NO_RESULTS',
                    'message': 'Playwright results file not found',
                    'stdout': stdout[:500],
                    'stderr': stderr[:500]
                },
                evidence_ids=[],
                errors=['Playwright results file not generated'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Parse JSON results
        try:
            with results_path.open('r', encoding='utf-8') as f:
                test_results = json.load(f)
        except json.JSONDecodeError as e:
            return AgentResult(
                agent_id="playwright_browser_agent",
                status=AgentStatus.FAILED,
                outputs={
                    'browser_status': 'PARSE_ERROR',
                    'message': f'Failed to parse Playwright results: {str(e)}'
                },
                evidence_ids=[],
                errors=[f'JSON parse error: {str(e)}'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Extract test results
        tests_passed = test_results.get('passed', 0)
        tests_failed = test_results.get('failed', 0)
        tests_skipped = test_results.get('skipped', 0)
        test_details = test_results.get('tests', [])
        
        # Collect screenshot paths
        screenshot_paths: List[str] = []
        for test in test_details:
            screenshots = test.get('screenshots', [])
            screenshot_paths.extend(screenshots)
        
        # Collect evidence IDs from snapshot
        evidence_ids: List[str] = []
        blocks_data = snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        for candidate_block in candidate_blocks:
            block_evidence = next(
                (b for b in verified_blocks if b.get('blockType') == candidate_block),
                None
            )
            if block_evidence and 'evidenceId' in block_evidence:
                evidence_ids.append(block_evidence['evidenceId'])
        
        # Determine browser status
        if tests_failed > 0:
            browser_status = 'FAIL'
            agent_status = AgentStatus.FAILED
        elif tests_passed == 0:
            browser_status = 'BLOCKED'
            agent_status = AgentStatus.BLOCKED
        else:
            browser_status = 'PASS'
            agent_status = AgentStatus.SUCCESS
        
        # Collect errors and warnings
        errors: List[str] = []
        warnings: List[str] = []
        
        for test in test_details:
            if test.get('status') == 'failed':
                errors.append(f"{test.get('name', 'unknown')}: {test.get('error', 'test failed')}")
            elif test.get('status') == 'skipped':
                warnings.append(f"{test.get('name', 'unknown')}: test skipped")
        
        # Build outputs
        outputs = {
            'browser_status': browser_status,
            'tests_passed': tests_passed,
            'tests_failed': tests_failed,
            'tests_skipped': tests_skipped,
            'screenshot_paths': screenshot_paths,
            'test_details': test_details
        }
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="playwright_browser_agent",
            status=agent_status,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=errors,
            warnings=warnings,
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="playwright_browser_agent",
            status=AgentStatus.FAILED,
            outputs={
                'browser_status': 'ERROR',
                'message': str(e)
            },
            evidence_ids=[],
            errors=[f"Playwright browser agent execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
