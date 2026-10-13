"""
Verification pipeline for migration repair workflow.

Sequential execution of verification stages V0-V10 with blocking on failure.

This module provides verification pipeline coordination. Imports run_command from
runner.py (one-way dependency).
"""

import json
from pathlib import Path
from typing import Optional
from datetime import datetime

from .models import VerificationStage, CheckStatus, CommandResult, CleanupResult
from .runner import run_command


# Verification stage definitions (V0-V10)
VERIFICATION_STAGES = [
    ("V0", "Setup Test Database", "docker-compose up -d test-postgres"),
    ("V1", "Wait for Database Ready", "docker-compose exec -T test-postgres pg_isready"),
    ("V2", "Run Migrations", "pnpm --filter @quiz/db db:migrate"),
    ("V3", "Verify Schema Checksum", "pnpm --filter @quiz/db db:verify-schema"),
    ("V4", "Run Unit Tests", "pytest tests/ -v"),
    ("V5", "Run Integration Tests", "pytest tests/integration/ -v"),
    ("V6", "Run Security Tests", "pytest tests/integration/test_security_integration.py -v"),
    ("V7", "Verify Migration Journal", "pnpm --filter @quiz/db db:check-journal"),
    ("V8", "Database Snapshot Verification", "pnpm --filter @quiz/db db:snapshot-verify"),
    ("V9", "Collect Test Coverage", "pytest tests/ --cov=app --cov-report=json"),
    ("V10", "Teardown Test Database", "docker-compose down test-postgres"),
]


async def verify_database_dropped(cwd: Optional[str] = None) -> bool:
    """
    Verify test database container is no longer running.
    
    Checks docker-compose ps output to confirm test-postgres container is down.
    
    Args:
        cwd: Working directory for command execution
        
    Returns:
        True if database is confirmed dropped, False otherwise
    """
    try:
        # Use docker-compose ps to check container status
        result: CommandResult = await run_command(
            "docker-compose ps test-postgres",
            cwd=cwd
        )
        
        # If exit code is non-zero or output doesn't contain "Up", database is down
        # Docker-compose ps returns 0 even if container is not running, so check output
        if result.exit_code != 0:
            return True
        
        # Check if container is listed as running
        output = result.stdout.lower()
        return "up" not in output or "test-postgres" not in output
        
    except Exception:
        # If we can't verify, assume database may still exist (fail closed)
        return False


async def ensure_cleanup(
    cwd: Optional[str] = None,
    evidence_dir: Optional[str] = None
) -> CleanupResult:
    """
    Ensure test database is cleaned up and verify it's actually dropped.
    
    Runs V10 teardown command, verifies database no longer exists, and logs
    cleanup status to evidence directory.
    
    Args:
        cwd: Working directory for command execution
        evidence_dir: Directory for cleanup evidence logs (defaults to .agents/evidence/runs)
        
    Returns:
        CleanupResult with success status, verification result, and log path
    """
    timestamp = datetime.now()
    
    # Default evidence directory
    if evidence_dir is None:
        evidence_dir = ".agents/evidence/runs"
    
    # Ensure evidence directory exists
    evidence_path = Path(evidence_dir)
    evidence_path.mkdir(parents=True, exist_ok=True)
    
    # Create log file path
    log_filename = f"cleanup-{timestamp.strftime('%Y%m%d_%H%M%S')}.jsonl"
    log_path = evidence_path / log_filename
    
    # Initialize result
    success = False
    verified = False
    exit_code = -1
    
    try:
        # Run V10 teardown command
        result: CommandResult = await run_command(
            "docker-compose down test-postgres",
            cwd=cwd
        )
        
        success = result.exit_code == 0
        exit_code = result.exit_code
        
        # Verify database is actually dropped
        verified = await verify_database_dropped(cwd=cwd)
        
    except Exception as e:
        # Log exception but don't raise - cleanup always completes
        success = False
        verified = False
        exit_code = -1
    
    # Log cleanup attempt to evidence
    log_entry = {
        "timestamp": timestamp.isoformat(),
        "stage_id": "V10",
        "cleanup_attempted": True,
        "cleanup_verified": verified,
        "database_dropped": verified,
        "exit_code": exit_code,
        "success": success
    }
    
    # Append to JSONL log
    with open(log_path, "a") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    return CleanupResult(
        success=success,
        verified=verified,
        log_path=str(log_path),
        timestamp=timestamp
    )


async def run_verification_pipeline(
    cwd: Optional[str] = None,
    stop_on_failure: bool = True,
    evidence_dir: Optional[str] = None
) -> list[VerificationStage]:
    """
    Run sequential verification pipeline V0-V10.
    
    Stages are executed in order. If a stage fails and stop_on_failure=True,
    subsequent stages are marked BLOCKED. Cleanup is guaranteed via try/finally.
    
    Args:
        cwd: Working directory for command execution
        stop_on_failure: If True, mark subsequent stages BLOCKED after first failure
        evidence_dir: Directory for cleanup evidence logs
        
    Returns:
        List of VerificationStage results
    """
    stages: list[VerificationStage] = []
    failed = False
    
    try:
        for stage_id, name, command in VERIFICATION_STAGES:
            # Create stage record
            stage = VerificationStage(
                stage_id=stage_id,
                name=name,
                status=CheckStatus.SKIPPED,
                command=command
            )
            
            # If previous stage failed and we're stopping on failure, mark BLOCKED
            if failed and stop_on_failure:
                stage.status = CheckStatus.BLOCKED
                stage.blocked_reason = "Previous verification stage failed"
                stages.append(stage)
                continue
            
            # Execute the command
            try:
                result: CommandResult = await run_command(command, cwd=cwd)
                
                stage.exit_code = result.exit_code
                stage.output = result.stdout if result.stdout else result.stderr
                stage.timestamp = result.timestamp
                stage.duration_ms = result.duration_ms
                
                # Check exit code
                if result.exit_code == 0:
                    stage.status = CheckStatus.PASS
                else:
                    stage.status = CheckStatus.FAIL
                    failed = True
                    
            except Exception as e:
                # Command execution failed
                stage.status = CheckStatus.FAIL
                stage.output = str(e)
                stage.timestamp = datetime.now()
                failed = True
            
            stages.append(stage)
    
    finally:
        # Guaranteed cleanup - always runs regardless of success/failure
        cleanup_result = await ensure_cleanup(cwd=cwd, evidence_dir=evidence_dir)
        
        # Find V10 stage and update with cleanup status
        v10_stage = next((s for s in stages if s.stage_id == "V10"), None)
        
        if v10_stage:
            # Update existing V10 stage with cleanup verification
            if cleanup_result.verified:
                v10_stage.cleanup_status = CheckStatus.PASS
            else:
                v10_stage.cleanup_status = CheckStatus.FAIL
                # If cleanup verification failed, mark stage as BLOCKED
                v10_stage.status = CheckStatus.BLOCKED
                v10_stage.blocked_reason = "Cleanup verification failed - test database may still exist"
        else:
            # V10 wasn't reached, create a cleanup-only stage
            cleanup_stage = VerificationStage(
                stage_id="V10",
                name="Teardown Test Database",
                status=CheckStatus.BLOCKED if not cleanup_result.verified else CheckStatus.PASS,
                command="docker-compose down test-postgres",
                timestamp=cleanup_result.timestamp,
                blocked_reason="Cleanup verification failed - test database may still exist" if not cleanup_result.verified else None,
                cleanup_status=CheckStatus.PASS if cleanup_result.verified else CheckStatus.FAIL
            )
            stages.append(cleanup_stage)
    
    return stages
