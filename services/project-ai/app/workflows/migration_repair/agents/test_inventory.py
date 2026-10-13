"""
Test Inventory Agent (W1)

Discovers pytest files in services/project-ai/tests/, checks for existing
migration tests, and validates test fixtures.
"""

from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger


async def execute_test_inventory(context: AgentContext) -> AgentResult:
    """
    Execute test inventory agent.
    
    Discovers test scripts, identifies fixtures, catalogs integration tests,
    and maps test coverage for migration repair workflow.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with test inventory
    """
    start_time = datetime.now(UTC)
    agent_id = "test_inventory"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Locate test directory
        tests_dir = context.repository_root / "services" / "project-ai" / "tests"
        
        if not tests_dir.exists():
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W1",
                "timestamp": end_time.isoformat(),
                "status": "failed",
                "duration_ms": duration_ms,
                "error": f"Test directory not found: {tests_dir}"
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.FAILED,
                errors=[f"Test directory not found: {tests_dir}"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Discover test files
        test_files = list(tests_dir.rglob("test_*.py"))
        integration_tests = list(tests_dir.glob("integration/test_*.py"))
        
        # Check for migration-specific tests
        migration_tests = [
            f for f in test_files 
            if "migration" in f.stem.lower()
        ]
        
        # Check for fixture files
        fixture_files = list(tests_dir.rglob("conftest.py"))
        
        # Scan for pytest fixtures
        fixtures_found = []
        for fixture_file in fixture_files:
            with open(fixture_file, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Look for @pytest.fixture decorators
            import re
            fixture_pattern = re.compile(r'@pytest\.fixture(?:\([^)]*\))?\s+def\s+(\w+)', re.MULTILINE)
            fixtures = fixture_pattern.findall(content)
            
            for fixture_name in fixtures:
                fixtures_found.append({
                    "name": fixture_name,
                    "file": str(fixture_file.relative_to(context.repository_root))
                })
        
        # Check for database fixtures
        db_fixtures = [f for f in fixtures_found if "db" in f["name"].lower() or "database" in f["name"].lower()]
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W1",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "test_files_found": len(test_files),
                "integration_tests_found": len(integration_tests),
                "migration_tests_found": len(migration_tests),
                "fixtures_found": len(fixtures_found),
                "db_fixtures_found": len(db_fixtures),
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.SUCCESS,
            outputs={
                "test_files": [str(f.relative_to(context.repository_root)) for f in test_files],
                "integration_tests": [str(f.relative_to(context.repository_root)) for f in integration_tests],
                "migration_tests": [str(f.relative_to(context.repository_root)) for f in migration_tests],
                "fixtures": fixtures_found,
                "db_fixtures": db_fixtures,
                "summary": {
                    "total_tests": len(test_files),
                    "integration_tests": len(integration_tests),
                    "migration_tests": len(migration_tests),
                    "fixtures": len(fixtures_found),
                    "db_fixtures": len(db_fixtures),
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
            "wave": "W1",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Test inventory failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
