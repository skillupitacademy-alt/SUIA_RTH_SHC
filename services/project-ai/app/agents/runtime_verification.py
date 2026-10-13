"""
Runtime Verification Agent.

Orchestrates complete runtime verification workflow:
1. Start Next.js application
2. Check health endpoint
3. Navigate critical routes
4. Capture console errors
5. Capture network failures
6. Graceful cleanup (kill process)

Returns AgentResult with evidence binding to run_id, commit_sha, snapshot_hash.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
from enum import Enum
import json

from app.verification.runtime import (
    ApplicationProcess,
    RuntimeVerification,
    RuntimeErrorCode,
    get_health_url
)


class AgentStatus(str, Enum):
    """Agent execution status."""
    SUCCESS = 'SUCCESS'
    FAILED = 'FAILED'
    BLOCKED = 'BLOCKED'
    SKIPPED = 'SKIPPED'
    RUNNING = 'RUNNING'


@dataclass
class AgentContext:
    """Context passed to agent for execution."""
    task_id: str
    workflow_state: Dict[str, Any]
    repository_snapshot: Dict[str, Any]
    evidence_graph: Dict[str, Any]
    approved_scope: List[str]
    prior_agent_outputs: Dict[str, Any]
    repository_root: Path
    timestamp: datetime


@dataclass
class AgentResult:
    """Result returned by agent after execution."""
    agent_id: str
    status: AgentStatus
    outputs: Dict[str, Any]
    evidence_ids: List[str]
    errors: List[str]
    warnings: List[str]
    execution_time_ms: float
    timestamp: datetime
    
    @property
    def passed(self) -> bool:
        """Check if agent execution passed."""
        return self.status == AgentStatus.SUCCESS


class RuntimeVerificationAgent:
    """
    Agent that performs runtime verification of applications.
    
    Verifies that applications start correctly, respond to health checks,
    and can navigate to critical routes without errors.
    """
    
    def __init__(self):
        """Initialize runtime verification agent."""
        self.agent_id = 'runtime-verification'
    
    async def execute(self, ctx: AgentContext) -> AgentResult:
        """
        Execute runtime verification workflow.
        
        Steps:
        1. Extract snapshot metadata (commit_sha, snapshot_hash)
        2. Start Next.js application using approved commands
        3. Check health endpoint with fallback strategy
        4. Navigate to critical routes
        5. Capture console errors (delegated to browser verification)
        6. Capture network failures (delegated to browser verification)
        7. Graceful cleanup - kill process
        
        Args:
            ctx: Agent execution context
            
        Returns:
            AgentResult with evidence IDs, errors, and execution metrics
        """
        start_time = datetime.now(timezone.utc)
        evidence_ids: List[str] = []
        errors: List[str] = []
        warnings: List[str] = []
        outputs: Dict[str, Any] = {}
        
        try:
            # Extract metadata from snapshot
            snapshot = ctx.repository_snapshot
            commit_sha = snapshot.get('repository', {}).get('commitSha', '')
            snapshot_hash = snapshot.get('canonicalHash', '')
            run_id = ctx.workflow_state.get('run_id', f"{commit_sha[:8]}-{snapshot_hash[:8]}")
            
            outputs['commit_sha'] = commit_sha
            outputs['snapshot_hash'] = snapshot_hash
            outputs['run_id'] = run_id
            
            # Determine target application
            # Default to realtutorialhub-admin for runtime verification
            target = ctx.workflow_state.get('target', 'realtutorialhub-admin')
            outputs['target'] = target
            
            # Step 1: Start application process
            app_process = ApplicationProcess(ctx.repository_root, target)
            
            startup_success = app_process.start(timeout=30)
            
            if not startup_success:
                errors.append("Application failed to start or health check failed")
                outputs['startup'] = 'failed'
                
                # Try to capture startup logs if available
                if app_process.process and app_process.process.stderr:
                    try:
                        stderr_output = app_process.process.stderr.read()
                        if stderr_output:
                            outputs['startup_error'] = stderr_output[:500]  # First 500 chars
                    except:
                        pass
                
                return AgentResult(
                    agent_id=self.agent_id,
                    status=AgentStatus.FAILED,
                    outputs=outputs,
                    evidence_ids=evidence_ids,
                    errors=errors,
                    warnings=warnings,
                    execution_time_ms=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                    timestamp=datetime.now(timezone.utc)
                )
            
            outputs['startup'] = 'success'
            
            # Step 2: Health check already performed in start()
            health_url = get_health_url(target)
            outputs['health_url'] = health_url
            outputs['health_check'] = 'passed'
            
            # Step 3: Navigate critical routes
            # NOTE: Actual route navigation requires browser automation (Playwright)
            # This is delegated to Wave R7 (Playwright Integration)
            # For R6, we verify the orchestration is correct and process lifecycle works
            
            critical_routes = ['/']  # Root route as minimum
            outputs['critical_routes'] = critical_routes
            outputs['route_navigation'] = 'deferred_to_browser_verification'
            
            warnings.append(
                "Route navigation requires Playwright integration (Wave R7). "
                "Runtime orchestration verified successfully."
            )
            
            # Step 4: Console errors - delegated to browser verification
            outputs['console_errors'] = 'deferred_to_browser_verification'
            
            # Step 5: Network failures - delegated to browser verification  
            outputs['network_errors'] = 'deferred_to_browser_verification'
            
            # Step 6: Graceful cleanup
            shutdown_success = app_process.stop(timeout=10)
            outputs['shutdown'] = 'success' if shutdown_success else 'forced_kill'
            
            if not shutdown_success:
                warnings.append("Application required force kill (did not respond to SIGTERM)")
            
            # Collect evidence IDs from snapshot
            # Runtime verification evidence comes from toolchain and runtime scanners
            runtime_evidence = snapshot.get('runtime', {})
            if 'toolchains' in runtime_evidence:
                for toolchain in runtime_evidence['toolchains']:
                    if 'evidenceId' in toolchain:
                        evidence_ids.append(toolchain['evidenceId'])
            
            # Generate evidence file for R6 wave
            evidence_record = {
                'evidenceId': 'ev-runtime-001',
                'waveId': 'R6',
                'title': 'Runtime Verification Agent',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'commitSha': commit_sha,
                'snapshotHash': snapshot_hash,
                'runId': run_id,
                'description': 'Runtime verification agent executed successfully with health check and process lifecycle management',
                'artifacts': [
                    {
                        'type': 'agent',
                        'path': 'services/project-ai/app/agents/runtime_verification.py',
                        'description': 'RuntimeVerificationAgent class with execute() method',
                        'verified': ['startup', 'health_check', 'shutdown']
                    }
                ],
                'verification': {
                    'applicationStartup': outputs['startup'] == 'success',
                    'healthCheck': outputs['health_check'] == 'passed',
                    'gracefulShutdown': outputs['shutdown'] == 'success'
                },
                'outputs': outputs
            }
            
            # Write evidence file
            evidence_dir = ctx.repository_root / '.project-ai' / 'runs' / 'r6-setup'
            evidence_dir.mkdir(parents=True, exist_ok=True)
            evidence_file = evidence_dir / 'evidence.json'
            evidence_file.write_text(json.dumps(evidence_record, indent=2))
            
            return AgentResult(
                agent_id=self.agent_id,
                status=AgentStatus.SUCCESS,
                outputs=outputs,
                evidence_ids=evidence_ids,
                errors=errors,
                warnings=warnings,
                execution_time_ms=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            errors.append(f"Runtime verification failed: {str(e)}")
            
            return AgentResult(
                agent_id=self.agent_id,
                status=AgentStatus.FAILED,
                outputs=outputs,
                evidence_ids=evidence_ids,
                errors=errors,
                warnings=warnings,
                execution_time_ms=(datetime.now(timezone.utc) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(timezone.utc)
            )


async def execute_runtime_verification(ctx: AgentContext) -> AgentResult:
    """
    Execute runtime verification agent.
    
    This is the entry point called by the agent coordinator.
    
    Args:
        ctx: Agent execution context
        
    Returns:
        AgentResult with verification outcomes
    """
    agent = RuntimeVerificationAgent()
    return await agent.execute(ctx)
