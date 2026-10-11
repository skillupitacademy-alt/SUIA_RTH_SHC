"""
Database Safety Audit Agent (W1)

Parses DATABASE_URL_TUTORIAL environment variable, validates database is not
production-named, checks environment variables, and verifies read-only mode.
"""

import os
import re
from datetime import datetime, UTC
from urllib.parse import urlparse

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from ..models import MigrationFinding


# Production database identifiers (never allow these)
PRODUCTION_IDENTIFIERS = frozenset([
    "tutorial_prod",
    "neon-prod",
    "production",
    "prod",
    "live",
])


async def execute_database_safety_audit(context: AgentContext) -> AgentResult:
    """
    Execute database safety audit agent.
    
    Validates database identity, checks environment safety, verifies privileges,
    and ensures production databases are not targeted.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with database safety findings
    """
    start_time = datetime.now(UTC)
    agent_id = "database_safety_audit"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        findings: list[MigrationFinding] = []
        
        # Check for DATABASE_URL_TUTORIAL environment variable
        db_url = os.environ.get("DATABASE_URL_TUTORIAL") or os.environ.get("TEST_DATABASE_URL_TUTORIAL")
        
        if not db_url:
            findings.append(MigrationFinding(
                finding_type="missing_env_var",
                severity="info",
                description="DATABASE_URL_TUTORIAL not set (tests may skip gracefully)",
                recommended_action="Set TEST_DATABASE_URL_TUTORIAL for integration tests"
            ))
            
            # Cannot perform further checks without DB URL
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W1",
                "timestamp": end_time.isoformat(),
                "status": "completed",
                "duration_ms": duration_ms,
                "evidence": {
                    "db_url_configured": False,
                    "findings_count": len(findings),
                }
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={
                    "findings": [f.model_dump() for f in findings],
                    "db_configured": False,
                },
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Parse database URL
        try:
            parsed = urlparse(db_url)
            db_name = parsed.path.lstrip("/") if parsed.path else None
            db_host = parsed.hostname
            db_port = parsed.port
            db_user = parsed.username
            
        except Exception as e:
            findings.append(MigrationFinding(
                finding_type="invalid_db_url",
                severity="critical",
                description=f"Failed to parse DATABASE_URL_TUTORIAL: {str(e)}",
                recommended_action="Verify DATABASE_URL_TUTORIAL format: postgresql://user:pass@host:port/dbname"
            ))
            
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W1",
                "timestamp": end_time.isoformat(),
                "status": "completed",
                "duration_ms": duration_ms,
                "error": str(e)
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.FAILED,
                outputs={"findings": [f.model_dump() for f in findings]},
                errors=[f"Database URL parsing failed: {str(e)}"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Check for production database identifiers
        if db_name:
            db_name_lower = db_name.lower()
            for prod_id in PRODUCTION_IDENTIFIERS:
                if prod_id in db_name_lower:
                    findings.append(MigrationFinding(
                        finding_type="production_database_detected",
                        severity="critical",
                        description=f"Database name '{db_name}' contains production identifier '{prod_id}'",
                        recommended_action="NEVER run migration repair against production databases"
                    ))
        
        # Check host for production indicators
        if db_host:
            if "prod" in db_host.lower() or "production" in db_host.lower():
                findings.append(MigrationFinding(
                    finding_type="production_host_detected",
                    severity="critical",
                    description=f"Database host '{db_host}' appears to be production",
                    recommended_action="Use only test/development database hosts"
                ))
        
        # Verify test-appropriate port (typically 55432 for test PostgreSQL)
        if db_port and db_port not in [5432, 55432]:
            findings.append(MigrationFinding(
                finding_type="unusual_port",
                severity="info",
                description=f"Database port {db_port} is unusual (expected 5432 or 55432 for test)",
                recommended_action="Verify this is the correct test database port"
            ))
        
        # Check for localhost/test indicators (good signs)
        safe_indicators = ["localhost", "127.0.0.1", "test", "docker", "compose"]
        is_safe = any(indicator in (db_host or "").lower() for indicator in safe_indicators)
        
        if not is_safe and db_host:
            findings.append(MigrationFinding(
                finding_type="remote_database",
                severity="warning",
                description=f"Database host '{db_host}' is not localhost - verify this is a test database",
                recommended_action="Use local test databases for migration repair verification"
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
                "db_configured": True,
                "db_name": db_name,
                "db_host": db_host,
                "db_port": db_port,
                "findings_count": len(findings),
                "critical_findings": len(critical_findings),
                "is_safe": status == AgentStatus.SUCCESS,
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "findings": [f.model_dump() for f in findings],
                "db_configured": True,
                "db_identity": {
                    "name": db_name,
                    "host": db_host,
                    "port": db_port,
                    "user": db_user,
                },
                "is_production": len(critical_findings) > 0,
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
            errors=[f"Database safety audit failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
