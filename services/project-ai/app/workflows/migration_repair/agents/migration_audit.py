"""
Migration Audit Agent (W1)

Scans migration files in packages/db-tutorial/migrations/, reads Drizzle journal,
detects duplicate CREATE statements, and validates migration dependency order.
"""

import json
import re
from pathlib import Path
from datetime import datetime, UTC
from typing import Optional

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from ..models import MigrationFinding


async def execute_migration_audit(context: AgentContext) -> AgentResult:
    """
    Execute migration audit agent.
    
    Scans migration SQL files, reads Drizzle journal, detects duplicate objects,
    and checks migration dependency order.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with migration findings
    """
    start_time = datetime.now(UTC)
    agent_id = "migration_audit"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        findings: list[MigrationFinding] = []
        
        # Locate migration directory
        migrations_dir = context.repository_root / "packages" / "db-tutorial" / "migrations"
        
        if not migrations_dir.exists():
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W1",
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
        
        # Read Drizzle journal
        journal_path = migrations_dir / "meta" / "_journal.json"
        journal_data = None
        
        if journal_path.exists():
            with open(journal_path, "r", encoding="utf-8") as f:
                journal_data = json.load(f)
        else:
            findings.append(MigrationFinding(
                finding_type="missing_journal",
                severity="warning",
                description=f"Drizzle journal not found at {journal_path}",
                recommended_action="Run drizzle-kit generate to create journal"
            ))
        
        # Scan migration SQL files
        sql_files = sorted(migrations_dir.glob("*.sql"))
        create_statements: dict[str, list[str]] = {}
        
        for sql_file in sql_files:
            with open(sql_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Detect CREATE statements (tables, indexes, enums, etc.)
            create_pattern = re.compile(
                r'CREATE\s+(?:TABLE|INDEX|UNIQUE\s+INDEX|TYPE|ENUM|SEQUENCE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?["\']?(\w+)["\']?',
                re.IGNORECASE
            )
            
            for match in create_pattern.finditer(content):
                object_name = match.group(1)
                
                if object_name not in create_statements:
                    create_statements[object_name] = []
                
                create_statements[object_name].append(str(sql_file.name))
        
        # Detect duplicates
        for object_name, files in create_statements.items():
            if len(files) > 1:
                findings.append(MigrationFinding(
                    finding_type="duplicate_object",
                    severity="critical",
                    object_name=object_name,
                    description=f"Object '{object_name}' created in multiple migrations: {', '.join(files)}",
                    recommended_action=f"Remove duplicate CREATE statement for '{object_name}' or add IF NOT EXISTS clause"
                ))
        
        # Validate journal consistency
        if journal_data:
            journal_entries = journal_data.get("entries", [])
            migration_files = {f.stem for f in sql_files}
            journal_files = {entry.get("tag") for entry in journal_entries}
            
            # Check for migrations not in journal
            missing_from_journal = migration_files - journal_files
            if missing_from_journal:
                findings.append(MigrationFinding(
                    finding_type="journal_inconsistency",
                    severity="warning",
                    description=f"Migrations not in journal: {', '.join(sorted(missing_from_journal))}",
                    recommended_action="Regenerate journal with drizzle-kit"
                ))
            
            # Check for journal entries without migration files
            missing_files = journal_files - migration_files
            if missing_files:
                findings.append(MigrationFinding(
                    finding_type="missing_migration_file",
                    severity="critical",
                    description=f"Journal references missing migrations: {', '.join(sorted(missing_files))}",
                    recommended_action="Restore missing migration files or regenerate journal"
                ))
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine status
        critical_findings = [f for f in findings if f.severity == "critical"]
        status = AgentStatus.FAILED if critical_findings else AgentStatus.SUCCESS
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "migrations_scanned": len(sql_files),
                "findings_count": len(findings),
                "critical_findings": len(critical_findings),
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "findings": [f.model_dump() for f in findings],
                "migrations_scanned": len(sql_files),
                "duplicate_objects": [f.object_name for f in findings if f.finding_type == "duplicate_object"],
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
            "wave": "W1",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Migration audit failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
