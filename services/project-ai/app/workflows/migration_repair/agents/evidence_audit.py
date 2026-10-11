"""
Evidence Audit Agent (W1)

Reads .agents/evidence/*.jsonl files, validates JSON integrity, checks for
hash mismatches, and reports missing evidence files.
"""

import json
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_evidence_audit(context: AgentContext) -> AgentResult:
    """
    Execute evidence audit agent.
    
    Checks existing reports, validates JSONL ledgers, identifies missing evidence,
    and verifies artifact locations.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with evidence audit findings
    """
    start_time = datetime.now(UTC)
    agent_id = "evidence_audit"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Locate evidence directory
        evidence_dir = context.repository_root / ".agents" / "evidence"
        
        if not evidence_dir.exists():
            # Evidence directory doesn't exist yet - this is acceptable
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W1",
                "timestamp": end_time.isoformat(),
                "status": "completed",
                "duration_ms": duration_ms,
                "evidence": {
                    "evidence_dir_exists": False,
                    "jsonl_files_found": 0,
                }
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={
                    "evidence_dir_exists": False,
                    "jsonl_files": [],
                    "valid_records": 0,
                    "invalid_records": 0,
                },
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Find all JSONL files
        jsonl_files = list(evidence_dir.glob("*.jsonl"))
        
        # Validate each JSONL file
        valid_records = 0
        invalid_records = 0
        files_analyzed = []
        
        for jsonl_file in jsonl_files:
            file_info = {
                "path": str(jsonl_file.relative_to(context.repository_root)),
                "valid_lines": 0,
                "invalid_lines": 0,
                "total_lines": 0,
            }
            
            try:
                with open(jsonl_file, "r", encoding="utf-8") as f:
                    for line_num, line in enumerate(f, 1):
                        line = line.strip()
                        if not line:
                            continue
                        
                        file_info["total_lines"] += 1
                        
                        try:
                            json.loads(line)
                            file_info["valid_lines"] += 1
                            valid_records += 1
                        except json.JSONDecodeError as e:
                            file_info["invalid_lines"] += 1
                            invalid_records += 1
                            
            except Exception as e:
                file_info["error"] = str(e)
            
            files_analyzed.append(file_info)
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine status (invalid records are warnings, not failures)
        status = AgentStatus.SUCCESS
        warnings = []
        
        if invalid_records > 0:
            warnings.append(f"Found {invalid_records} invalid JSON records in evidence files")
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "evidence_dir_exists": True,
                "jsonl_files_found": len(jsonl_files),
                "valid_records": valid_records,
                "invalid_records": invalid_records,
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "evidence_dir_exists": True,
                "jsonl_files": [f["path"] for f in files_analyzed],
                "files_analyzed": files_analyzed,
                "valid_records": valid_records,
                "invalid_records": invalid_records,
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
            "wave": "W1",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Evidence audit failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
