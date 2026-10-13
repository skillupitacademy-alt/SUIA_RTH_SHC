"""
Evidence Assembler Agent (W7)

Collects all stdout/stderr/exit codes from prior stages, writes to
.agents/evidence/migration-repair-{workflow_id}.jsonl with SHA-256 hashes.
"""

import hashlib
import json
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_evidence_assembler(context: AgentContext) -> AgentResult:
    """
    Execute evidence assembler agent.
    
    Collects raw logs and exit codes, captures test results, hashes artifacts,
    and writes to evidence ledger.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with evidence collection status
    """
    start_time = datetime.now(UTC)
    agent_id = "evidence_assembler"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W7",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Collect evidence from all prior agents
        evidence_records = []
        
        for agent_name, agent_result in context.prior_agent_outputs.items():
            record = {
                "agent_id": agent_name,
                "status": agent_result.status.value,
                "timestamp": agent_result.timestamp.isoformat(),
                "execution_time_ms": agent_result.execution_time_ms,
                "outputs": agent_result.outputs,
                "errors": agent_result.errors,
                "warnings": agent_result.warnings,
            }
            
            # Compute SHA-256 hash of the record
            record_json = json.dumps(record, sort_keys=True)
            record_hash = hashlib.sha256(record_json.encode("utf-8")).hexdigest()
            record["sha256"] = record_hash
            
            evidence_records.append(record)
        
        # Write evidence to workflow-specific ledger
        workflow_id = context.task_id
        evidence_file = f"migration-repair-{workflow_id}.jsonl"
        
        # Append each record to the evidence file
        for record in evidence_records:
            ledger._append_jsonl(evidence_file, record)
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W7",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "records_collected": len(evidence_records),
                "evidence_file": evidence_file,
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.SUCCESS,
            outputs={
                "evidence_file": evidence_file,
                "records_collected": len(evidence_records),
                "evidence_records": evidence_records,
            },
            evidence_ids=["agent-runs.jsonl", evidence_file],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
        
    except Exception as e:
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log failure
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W7",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Evidence assembler failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
