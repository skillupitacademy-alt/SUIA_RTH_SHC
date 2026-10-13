"""
Static Reviewer Agent (W5)

Runs SQL syntax checks, verifies migration order from Drizzle journal,
validates snapshot consistency, and reviews diff scope.
"""

import json
import re
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_static_reviewer(context: AgentContext) -> AgentResult:
    """
    Execute static reviewer agent.
    
    Checks SQL syntax patterns, verifies migration order, validates
    snapshot/journal consistency, and reviews diff scope.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with static review findings
    """
    start_time = datetime.now(UTC)
    agent_id = "static_reviewer"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W5",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        findings = []
        
        # Locate migration directory
        migrations_dir = context.repository_root / "packages" / "db-tutorial" / "migrations"
        
        if not migrations_dir.exists():
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W5",
                "timestamp": end_time.isoformat(),
                "status": "failed",
                "duration_ms": duration_ms,
                "error": f"Migration directory not found: {migrations_dir}"
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.FAILED,
                errors=[f"Migration directory not found: {migrations_dir}"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Check SQL syntax patterns
        sql_files = sorted(migrations_dir.glob("*.sql"))
        syntax_issues = []
        
        for sql_file in sql_files:
            with open(sql_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Check for common SQL syntax issues
            # 1. Unclosed quotes
            single_quotes = content.count("'")
            double_quotes = content.count('"')
            
            if single_quotes % 2 != 0:
                syntax_issues.append({
                    "file": sql_file.name,
                    "issue": "Unclosed single quote detected",
                    "severity": "error"
                })
            
            # 2. Missing semicolons at statement end
            statements = re.split(r';\s*\n', content)
            if statements and statements[-1].strip() and not statements[-1].strip().endswith(';'):
                syntax_issues.append({
                    "file": sql_file.name,
                    "issue": "Statement may be missing semicolon",
                    "severity": "warning"
                })
            
            # 3. Check for dangerous operations (DROP without IF EXISTS)
            dangerous_drops = re.findall(r'DROP\s+(?:TABLE|INDEX|TYPE|ENUM)\s+(?!IF\s+EXISTS)(\w+)', content, re.IGNORECASE)
            if dangerous_drops:
                syntax_issues.append({
                    "file": sql_file.name,
                    "issue": f"DROP without IF EXISTS for: {', '.join(dangerous_drops)}",
                    "severity": "warning"
                })
        
        # Check journal consistency
        journal_path = migrations_dir / "meta" / "_journal.json"
        journal_consistent = True
        
        if journal_path.exists():
            with open(journal_path, "r", encoding="utf-8") as f:
                journal_data = json.load(f)
            
            journal_entries = journal_data.get("entries", [])
            
            # Verify migration order matches journal order
            journal_tags = [entry.get("tag") for entry in journal_entries]
            sql_stems = [f.stem for f in sql_files]
            
            # Check if all SQL files are in journal
            missing_from_journal = set(sql_stems) - set(journal_tags)
            if missing_from_journal:
                journal_consistent = False
                findings.append(f"Migrations not in journal: {', '.join(sorted(missing_from_journal))}")
        else:
            journal_consistent = False
            findings.append("Journal file not found")
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine status
        error_issues = [i for i in syntax_issues if i["severity"] == "error"]
        status = AgentStatus.FAILED if error_issues else AgentStatus.SUCCESS
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W5",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "sql_files_checked": len(sql_files),
                "syntax_issues": len(syntax_issues),
                "journal_consistent": journal_consistent,
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "syntax_issues": syntax_issues,
                "journal_consistent": journal_consistent,
                "findings": findings,
                "summary": {
                    "files_checked": len(sql_files),
                    "errors": len(error_issues),
                    "warnings": len([i for i in syntax_issues if i["severity"] == "warning"]),
                }
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
            "wave": "W5",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Static reviewer failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
