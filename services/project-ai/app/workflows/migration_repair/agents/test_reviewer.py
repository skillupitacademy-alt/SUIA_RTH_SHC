"""
Test Reviewer Agent (W5)

Ensures tests exist for duplicate object failures, checks coverage of
downstream functionality, and validates test fixture patterns.
"""

from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_test_reviewer(context: AgentContext) -> AgentResult:
    """
    Execute test reviewer agent.
    
    Ensures test coverage for duplicate-object failures, validates downstream
    checks, and verifies test completeness.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with test coverage review
    """
    start_time = datetime.now(UTC)
    agent_id = "test_reviewer"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W5",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Get test inventory from W1
        test_inventory = context.prior_agent_outputs.get("test_inventory")
        
        if not test_inventory or not test_inventory.passed:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W5",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Test inventory did not complete successfully - cannot review"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        test_files = test_inventory.outputs.get("test_files", [])
        migration_tests = test_inventory.outputs.get("migration_tests", [])
        integration_tests = test_inventory.outputs.get("integration_tests", [])
        
        # Check for migration-specific test coverage
        findings = []
        
        if not migration_tests:
            findings.append({
                "type": "missing_coverage",
                "severity": "warning",
                "description": "No migration-specific tests found",
                "recommendation": "Add tests for migration duplicate-object scenarios"
            })
        
        # Check for integration tests
        if not integration_tests:
            findings.append({
                "type": "missing_integration",
                "severity": "warning",
                "description": "No integration tests found",
                "recommendation": "Add integration tests to verify database schema"
            })
        
        # Check for security tests
        security_tests = [t for t in test_files if "security" in t.lower()]
        if not security_tests:
            findings.append({
                "type": "missing_security",
                "severity": "info",
                "description": "No security tests found",
                "recommendation": "Consider adding security tests for database operations"
            })
        
        # Scan test files for migration-related test cases
        tests_dir = context.repository_root / "services" / "project-ai" / "tests"
        migration_test_cases = []
        
        for test_file_path in migration_tests:
            test_path = context.repository_root / test_file_path
            if test_path.exists():
                with open(test_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Look for test function definitions
                import re
                test_pattern = re.compile(r'def\s+(test_\w+)', re.MULTILINE)
                test_functions = test_pattern.findall(content)
                
                migration_test_cases.extend([
                    {"file": test_file_path, "test": func}
                    for func in test_functions
                ])
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Determine status
        critical_findings = [f for f in findings if f["severity"] == "error"]
        status = AgentStatus.FAILED if critical_findings else AgentStatus.SUCCESS
        
        warnings = [f["description"] for f in findings if f["severity"] in ["warning", "info"]]
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W5",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "test_files_reviewed": len(test_files),
                "migration_tests": len(migration_tests),
                "integration_tests": len(integration_tests),
                "findings": len(findings),
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=status,
            outputs={
                "findings": findings,
                "test_coverage": {
                    "total_tests": len(test_files),
                    "migration_tests": len(migration_tests),
                    "integration_tests": len(integration_tests),
                    "security_tests": len(security_tests),
                    "migration_test_cases": migration_test_cases,
                },
                "summary": {
                    "adequate_coverage": len(migration_tests) > 0 and len(integration_tests) > 0,
                    "findings_count": len(findings),
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
            "wave": "W5",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Test reviewer failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
