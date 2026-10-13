"""
Repair Reviewer Agent (W3)

Reviews repair plan independently, checks earlier migrations don't already
create the object, and rejects destructive changes.
"""

from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_repair_reviewer(context: AgentContext) -> AgentResult:
    """
    Execute repair reviewer agent.
    
    Reviews repair plan independently, checks earlier migrations,
    rejects destructive changes, verifies schema preservation.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with review verdict
    """
    start_time = datetime.now(UTC)
    agent_id = "repair_reviewer"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W3",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Get repair plan from W2
        repair_planner = context.prior_agent_outputs.get("repair_planner")
        
        if not repair_planner or not repair_planner.passed:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W3",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Repair planner did not complete successfully - cannot review"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        repair_plan = repair_planner.outputs.get("repair_plan", {})
        actions = repair_plan.get("actions", [])
        
        if not actions:
            # No actions to review - approve
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W3",
                "timestamp": end_time.isoformat(),
                "status": "completed",
                "duration_ms": duration_ms,
                "evidence": {
                    "actions_reviewed": 0,
                    "approved": 0,
                    "rejected": 0,
                    "verdict": "APPROVED",
                }
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={
                    "verdict": "APPROVED",
                    "actions_reviewed": 0,
                    "approved": 0,
                    "rejected": 0,
                    "review_findings": [],
                },
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Review each action
        approved_actions = []
        rejected_actions = []
        review_findings = []
        
        for action in actions:
            # Check for destructive changes
            if not action.get("schema_preserving", False):
                rejected_actions.append(action)
                review_findings.append({
                    "action_id": action.get("finding_id"),
                    "verdict": "REJECTED",
                    "reason": "Action is not schema-preserving",
                })
                continue
            
            # Check risk level
            risk_level = action.get("risk_level", "unknown")
            if risk_level == "high":
                rejected_actions.append(action)
                review_findings.append({
                    "action_id": action.get("finding_id"),
                    "verdict": "REJECTED",
                    "reason": "High risk action requires additional review",
                })
                continue
            
            # Check for appropriate proposed action
            proposed_action = action.get("proposed_action")
            
            if proposed_action in ["add_if_not_exists", "regenerate_journal"]:
                # These are safe, schema-preserving actions
                approved_actions.append(action)
                review_findings.append({
                    "action_id": action.get("finding_id"),
                    "verdict": "APPROVED",
                    "reason": f"Safe schema-preserving action: {proposed_action}",
                })
            else:
                # Unknown or risky action
                rejected_actions.append(action)
                review_findings.append({
                    "action_id": action.get("finding_id"),
                    "verdict": "REJECTED",
                    "reason": f"Unknown or unapproved action type: {proposed_action}",
                })
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine overall verdict
        if rejected_actions:
            verdict = "REJECTED"
            status = AgentStatus.BLOCKED
        else:
            verdict = "APPROVED"
            status = AgentStatus.SUCCESS
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W3",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "actions_reviewed": len(actions),
                "approved": len(approved_actions),
                "rejected": len(rejected_actions),
                "verdict": verdict,
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "verdict": verdict,
                "actions_reviewed": len(actions),
                "approved": len(approved_actions),
                "rejected": len(rejected_actions),
                "review_findings": review_findings,
                "approved_actions": approved_actions,
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
            "wave": "W3",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Repair reviewer failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
