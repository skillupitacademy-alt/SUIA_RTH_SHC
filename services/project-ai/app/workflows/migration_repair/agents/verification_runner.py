"""
Verification Runner Agent (W6)

Calls run_verification_pipeline() from verification.py, marks stages BLOCKED
on failure, and captures all exit codes.
"""

from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from ..verification import run_verification_pipeline
from ..models import CheckStatus


async def execute_verification_runner(context: AgentContext) -> AgentResult:
    """
    Execute verification runner agent.
    
    Executes full migration chain against fresh PostgreSQL database,
    verifies schema, runs integration and security tests.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with verification results
    """
    start_time = datetime.now(UTC)
    agent_id = "verification_runner"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W6",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Run verification pipeline
        stages = await run_verification_pipeline(
            cwd=str(context.repository_root),
            stop_on_failure=True
        )
        
        # Analyze results
        passed_stages = [s for s in stages if s.status == CheckStatus.PASS]
        failed_stages = [s for s in stages if s.status == CheckStatus.FAIL]
        blocked_stages = [s for s in stages if s.status == CheckStatus.BLOCKED]
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine status
        if failed_stages:
            status = AgentStatus.FAILED
        elif blocked_stages:
            status = AgentStatus.BLOCKED
        else:
            status = AgentStatus.SUCCESS
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W6",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "total_stages": len(stages),
                "passed": len(passed_stages),
                "failed": len(failed_stages),
                "blocked": len(blocked_stages),
            }
        })
        
        # Create stage summaries
        stage_results = []
        for stage in stages:
            stage_results.append({
                "stage_id": stage.stage_id,
                "name": stage.name,
                "status": stage.status.value,
                "exit_code": stage.exit_code,
                "duration_ms": stage.duration_ms,
                "blocked_reason": stage.blocked_reason,
            })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "stages": stage_results,
                "summary": {
                    "total_stages": len(stages),
                    "passed": len(passed_stages),
                    "failed": len(failed_stages),
                    "blocked": len(blocked_stages),
                },
                "failed_stages": [s.name for s in failed_stages],
                "blocked_stages": [s.name for s in blocked_stages],
            },
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
        
    except Exception as e:
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log failure
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W6",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Verification runner failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
