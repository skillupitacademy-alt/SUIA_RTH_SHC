"""
Verification pipeline for migration repair workflow.

Sequential execution of verification stages V0-V10 with blocking on failure.
"""

from typing import Optional
from datetime import datetime

from .models import VerificationStage, CheckStatus, CommandResult
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


async def run_verification_pipeline(
    cwd: Optional[str] = None,
    stop_on_failure: bool = True
) -> list[VerificationStage]:
    """
    Run sequential verification pipeline V0-V10.
    
    Stages are executed in order. If a stage fails and stop_on_failure=True,
    subsequent stages are marked BLOCKED.
    
    Args:
        cwd: Working directory for command execution
        stop_on_failure: If True, mark subsequent stages BLOCKED after first failure
        
    Returns:
        List of VerificationStage results
    """
    stages: list[VerificationStage] = []
    failed = False
    
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
    
    return stages
