"""
Repair Planner Agent (W2)

Aggregates findings from W1 agents, proposes minimal schema-preserving patches,
maps corrections to specific migrations, and assesses risk.
"""

from datetime import datetime, UTC
from typing import Any

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_repair_planner(context: AgentContext) -> AgentResult:
    """
    Execute repair planner agent.
    
    Maps findings to specific migrations, proposes minimal corrections,
    assesses risk, and generates rollback plan.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with repair plan
    """
    start_time = datetime.now(UTC)
    agent_id = "repair_planner"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W2",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Get prior agent outputs from W1
        migration_audit = context.prior_agent_outputs.get("migration_audit")
        db_safety = context.prior_agent_outputs.get("database_safety_audit")
        test_inventory = context.prior_agent_outputs.get("test_inventory")
        evidence_audit = context.prior_agent_outputs.get("evidence_audit")
        
        # Check if all W1 agents completed successfully
        w1_agents = [migration_audit, db_safety, test_inventory, evidence_audit]
        if not all(w1_agents):
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W2",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Not all W1 agents completed - cannot create repair plan"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Extract findings from migration audit
        migration_findings = []
        if migration_audit and migration_audit.outputs.get("findings"):
            migration_findings = migration_audit.outputs["findings"]
        
        # Check for critical database safety issues
        db_is_production = False
        if db_safety and db_safety.outputs.get("is_production"):
            db_is_production = True
        
        if db_is_production:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W2",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Production database detected - will not create repair plan"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Create repair plan for each finding
        repair_actions = []
        
        for finding in migration_findings:
            if finding["finding_type"] == "duplicate_object":
                # Plan: Add IF NOT EXISTS or remove duplicate
                repair_actions.append({
                    "finding_id": finding.get("object_name", "unknown"),
                    "finding_type": finding["finding_type"],
                    "severity": finding["severity"],
                    "target_migration": finding.get("migration_file"),
                    "proposed_action": "add_if_not_exists",
                    "description": f"Add IF NOT EXISTS clause to CREATE statement for {finding.get('object_name')}",
                    "risk_level": "low",
                    "schema_preserving": True,
                    "rollback_strategy": "Revert to original migration file from git history",
                })
            
            elif finding["finding_type"] == "journal_inconsistency":
                repair_actions.append({
                    "finding_id": "journal_sync",
                    "finding_type": finding["finding_type"],
                    "severity": finding["severity"],
                    "proposed_action": "regenerate_journal",
                    "description": "Regenerate Drizzle journal to match migration files",
                    "risk_level": "low",
                    "schema_preserving": True,
                    "rollback_strategy": "Restore journal from git history",
                })
            
            elif finding["finding_type"] == "missing_migration_file":
                repair_actions.append({
                    "finding_id": "missing_file",
                    "finding_type": finding["finding_type"],
                    "severity": finding["severity"],
                    "proposed_action": "restore_or_remove_journal_entry",
                    "description": finding["description"],
                    "risk_level": "medium",
                    "schema_preserving": False,
                    "rollback_strategy": "Restore files from backup or regenerate journal",
                })
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine status
        high_risk_actions = [a for a in repair_actions if a["risk_level"] in ["high", "medium"]]
        non_preserving = [a for a in repair_actions if not a["schema_preserving"]]
        
        status = AgentStatus.SUCCESS
        warnings = []
        
        if high_risk_actions:
            warnings.append(f"{len(high_risk_actions)} high/medium risk actions proposed")
        
        if non_preserving:
            warnings.append(f"{len(non_preserving)} actions are not schema-preserving")
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W2",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "findings_analyzed": len(migration_findings),
                "repair_actions_proposed": len(repair_actions),
                "high_risk_actions": len(high_risk_actions),
                "non_preserving_actions": len(non_preserving),
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "repair_plan": {
                    "actions": repair_actions,
                    "summary": {
                        "total_actions": len(repair_actions),
                        "high_risk_actions": len(high_risk_actions),
                        "schema_preserving": len(repair_actions) - len(non_preserving),
                        "requires_review": len(high_risk_actions) > 0 or len(non_preserving) > 0,
                    }
                },
                "w1_summary": {
                    "migration_findings": len(migration_findings),
                    "db_safe": not db_is_production,
                    "tests_available": test_inventory.status == AgentStatus.SUCCESS if test_inventory else False,
                }
            },
            warnings=warnings,
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
            "wave": "W2",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Repair planner failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
