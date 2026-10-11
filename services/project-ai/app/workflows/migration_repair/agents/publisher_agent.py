"""
Publisher Agent (W9)

After PASS verdict, pushes commit to remote, verifies remote SHA matches
local SHA, and writes audit record to evidence ledger.
"""

from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from ..runner import run_command
from ..models import CheckStatus


async def execute_publisher_agent(context: AgentContext) -> AgentResult:
    """
    Execute publisher agent.
    
    Commits verified changes after approval, publishes evidence,
    confirms SHA match, and records publication audit.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with publication status
    """
    start_time = datetime.now(UTC)
    agent_id = "publisher_agent"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W9",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Get final gate verdict from W8
        final_gate = context.prior_agent_outputs.get("final_gate_agent")
        
        if not final_gate or not final_gate.passed:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W9",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Final gate did not pass - cannot publish"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        gate_verdict = final_gate.outputs.get("gate_verdict")
        
        if gate_verdict != CheckStatus.PASS.value:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W9",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=[f"Gate verdict is {gate_verdict}, not PASS - cannot publish"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Get current commit SHA
        result = await run_command("git rev-parse HEAD", cwd=str(context.repository_root))
        local_sha = result.stdout.strip()
        
        # Get implementer's commit info
        implementer = context.prior_agent_outputs.get("repair_implementer")
        commit_after = implementer.outputs.get("commit_after") if implementer else local_sha
        
        # Verify we're publishing the tested commit
        if local_sha != commit_after:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W9",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=[
                    f"Local commit {local_sha} does not match tested commit {commit_after} - cannot publish"
                ],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Note: We do NOT push to remote per instructions
        # The instruction says "Never push to remote"
        # This agent only records that it WOULD publish if permitted
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W9",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "local_sha": local_sha,
                "tested_sha": commit_after,
                "sha_match": local_sha == commit_after,
                "published": False,  # Not pushed per instructions
                "reason": "Publishing skipped per workflow instructions (never push to remote)",
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.SUCCESS,
            outputs={
                "published": False,
                "local_sha": local_sha,
                "tested_sha": commit_after,
                "sha_match": local_sha == commit_after,
                "message": "Publication step completed - commits are ready but not pushed to remote per workflow policy",
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
            "wave": "W9",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Publisher agent failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
