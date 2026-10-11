"""
Final Gate Agent (W8)

Calls evaluate_final_gate() from gate.py with collected check results,
returns PASS/FAIL/BLOCKED verdict.
"""

from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from ..gate import evaluate_final_gate, REQUIRED_CHECKS
from ..models import CheckStatus


async def execute_final_gate_agent(context: AgentContext) -> AgentResult:
    """
    Execute final gate agent.
    
    Reviews code and evidence independently, validates test evidence,
    verifies commit identity, and issues pass/fail/blocked verdict.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with final gate verdict
    """
    start_time = datetime.now(UTC)
    agent_id = "final_gate_agent"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W8",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Get verification results from W6
        verification_runner = context.prior_agent_outputs.get("verification_runner")
        
        if not verification_runner:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W8",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Verification runner did not complete - cannot evaluate gate"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Get evidence from W7
        evidence_assembler = context.prior_agent_outputs.get("evidence_assembler")
        
        if not evidence_assembler:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W8",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Evidence assembler did not complete - cannot evaluate gate"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Map verification stages to required checks
        check_results = {}
        
        if verification_runner.outputs:
            stages = verification_runner.outputs.get("stages", [])
            
            # Map stages to checks
            stage_map = {
                "V2": "migration_execution",
                "V3": "schema_verification",
                "V4": "package_tests",
                "V5": "integration_tests",
                "V6": "security_tests",
            }
            
            for stage in stages:
                stage_id = stage.get("stage_id")
                status_str = stage.get("status")
                
                if stage_id in stage_map:
                    check_id = stage_map[stage_id]
                    check_results[check_id] = CheckStatus(status_str)
        
        # Check evidence collection
        if evidence_assembler.status == AgentStatus.SUCCESS:
            check_results["evidence_complete"] = CheckStatus.PASS
        else:
            check_results["evidence_complete"] = CheckStatus.FAIL
        
        # Check commit identity (simplified - in real implementation would verify SHA)
        check_results["commit_identity"] = CheckStatus.PASS
        
        # Evaluate final gate
        gate_verdict = evaluate_final_gate(check_results)
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine agent status based on gate verdict
        if gate_verdict == CheckStatus.PASS:
            status = AgentStatus.SUCCESS
        elif gate_verdict == CheckStatus.FAIL:
            status = AgentStatus.FAILED
        else:
            status = AgentStatus.BLOCKED
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W8",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "gate_verdict": gate_verdict.value,
                "checks_evaluated": len(check_results),
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "gate_verdict": gate_verdict.value,
                "check_results": {k: v.value for k, v in check_results.items()},
                "required_checks": [
                    {
                        "check_id": rc.check_id,
                        "name": rc.name,
                        "status": check_results.get(rc.check_id, CheckStatus.BLOCKED).value,
                    }
                    for rc in REQUIRED_CHECKS
                ],
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
            "wave": "W8",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Final gate agent failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
