#!/usr/bin/env python3
"""
Migration Repair Workflow CLI

Executes the migration repair workflow with agent orchestration,
evidence collection, and final report generation.

Usage:
    python scripts/run-migration-repair.py [options]

Options:
    --dry-run              Show execution plan without making changes
    --database-url <url>   Override TEST_DATABASE_URL_TUTORIAL
    --verbose              Enable verbose logging (DEBUG level)
    --workflow-id <id>     Resume existing workflow (default: create new)

Examples:
    # Preview execution plan
    python scripts/run-migration-repair.py --dry-run

    # Run full workflow
    python scripts/run-migration-repair.py --verbose

    # Custom database
    python scripts/run-migration-repair.py --database-url postgresql://user:pass@localhost:55432/test_db
"""

import argparse
import asyncio
import json
import logging
import sys
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.orchestration.agent_coordinator import AgentCoordinator, AgentContext, AgentResult, AgentStatus
from app.orchestration.agent_registry import AgentRegistry, AgentType, Agent
from app.evidence.ledger import append_agent_run, append_workflow_event


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WorkflowExecutionPlan:
    """Execution plan for migration repair workflow."""
    
    def __init__(self):
        self.waves = {
            "W0": {
                "agents": ["workflow_controller"],
                "depends_on": [],
                "parallel": False,
                "description": "Initialize workflow and establish baseline"
            },
            "W1": {
                "agents": ["migration_audit", "database_safety_audit", "test_inventory", "evidence_audit"],
                "depends_on": ["W0"],
                "parallel": True,
                "description": "Parallel audit agents (read-only baseline)"
            },
            "W2": {
                "agents": ["repair_planner"],
                "depends_on": ["W1"],
                "parallel": False,
                "description": "Generate repair plan from W1 findings"
            },
            "W3": {
                "agents": ["repair_reviewer"],
                "depends_on": ["W2"],
                "parallel": False,
                "description": "Independent review of repair plan"
            },
            "W4": {
                "agents": ["repair_implementer"],
                "depends_on": ["W3"],
                "parallel": False,
                "description": "Apply approved minimal patches"
            },
            "W5": {
                "agents": ["static_reviewer", "test_reviewer"],
                "depends_on": ["W4"],
                "parallel": True,
                "description": "Parallel pre-verification reviews"
            },
            "W6": {
                "agents": ["verification_runner"],
                "depends_on": ["W5"],
                "parallel": False,
                "description": "Execute migrations and tests against fresh database"
            },
            "W7": {
                "agents": ["evidence_assembler"],
                "depends_on": ["W6"],
                "parallel": False,
                "description": "Collect logs, exit codes, and artifact hashes"
            },
            "W8": {
                "agents": ["final_gate_agent"],
                "depends_on": ["W7"],
                "parallel": False,
                "description": "Independent gate review of code and evidence"
            },
            "W9": {
                "agents": ["publisher_agent"],
                "depends_on": ["W8"],
                "parallel": False,
                "description": "Publish verified changes and evidence"
            }
        }
    
    def get_execution_order(self) -> List[str]:
        """Get waves in execution order."""
        return sorted(self.waves.keys())
    
    def get_wave_agents(self, wave: str) -> List[str]:
        """Get agent IDs for a wave."""
        return self.waves[wave]["agents"]
    
    def is_wave_parallel(self, wave: str) -> bool:
        """Check if wave supports parallel execution."""
        return self.waves[wave]["parallel"]
    
    def get_wave_description(self, wave: str) -> str:
        """Get wave description."""
        return self.waves[wave]["description"]


class MigrationRepairWorkflow:
    """Main workflow orchestrator for migration repair."""
    
    def __init__(
        self,
        workflow_id: str | None = None,
        database_url: str | None = None,
        dry_run: bool = False
    ):
        self.workflow_id = workflow_id or self._generate_workflow_id()
        self.database_url = database_url
        self.dry_run = dry_run
        self.coordinator = AgentCoordinator(registry=AgentRegistry())
        self.plan = WorkflowExecutionPlan()
        self.results: Dict[str, AgentResult] = {}
        self.start_time = datetime.now(UTC)
        
        # Repository root (parent of services/project-ai)
        self.repo_root = Path(__file__).parent.parent.parent.parent
        
        logger.info(f"Initialized workflow: {self.workflow_id}")
        logger.info(f"Repository root: {self.repo_root}")
        logger.info(f"Dry run: {self.dry_run}")
    
    def _generate_workflow_id(self) -> str:
        """Generate unique workflow ID."""
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        return f"workflow_{timestamp}"
    
    async def execute(self) -> Dict[str, Any]:
        """Execute the migration repair workflow."""
        logger.info("=" * 80)
        logger.info("MIGRATION REPAIR WORKFLOW")
        logger.info("=" * 80)
        logger.info(f"Workflow ID: {self.workflow_id}")
        logger.info(f"Start Time: {self.start_time.isoformat()}")
        logger.info("")
        
        if self.dry_run:
            return await self._dry_run_preview()
        
        # Record workflow start
        append_workflow_event({
            "event_type": "workflow_started",
            "workflow_id": self.workflow_id,
            "timestamp": self.start_time.isoformat()
        })
        
        try:
            # Execute waves in order
            for wave in self.plan.get_execution_order():
                await self._execute_wave(wave)
                
                # Check if any agent failed or blocked
                wave_agents = self.plan.get_wave_agents(wave)
                wave_results = [self.results[agent_id] for agent_id in wave_agents if agent_id in self.results]
                
                if any(r.status in [AgentStatus.FAILED, AgentStatus.BLOCKED] for r in wave_results):
                    logger.error(f"Wave {wave} failed or blocked. Stopping workflow.")
                    break
            
            # Generate final report
            report = self._generate_report()
            self._write_report(report)
            
            # Record workflow completion
            append_workflow_event({
                "event_type": "workflow_completed",
                "workflow_id": self.workflow_id,
                "status": report["status"],
                "final_verdict": report["final_verdict"],
                "timestamp": datetime.now(UTC).isoformat()
            })
            
            return report
        
        except Exception as e:
            logger.exception("Workflow execution failed with exception")
            
            # Record workflow failure
            append_workflow_event({
                "event_type": "workflow_failed",
                "workflow_id": self.workflow_id,
                "error": str(e),
                "timestamp": datetime.now(UTC).isoformat()
            })
            
            raise
    
    async def _dry_run_preview(self) -> Dict[str, Any]:
        """Preview execution plan without making changes."""
        logger.info("DRY RUN MODE: Showing execution plan")
        logger.info("")
        
        total_agents = 0
        for wave in self.plan.get_execution_order():
            agents = self.plan.get_wave_agents(wave)
            parallel = self.plan.is_wave_parallel(wave)
            description = self.plan.get_wave_description(wave)
            
            logger.info(f"{wave}: {description}")
            logger.info(f"  Execution: {'Parallel' if parallel else 'Sequential'}")
            logger.info(f"  Agents: {len(agents)}")
            for agent_id in agents:
                logger.info(f"    - {agent_id}")
                total_agents += 1
            logger.info("")
        
        logger.info(f"Total waves: {len(self.plan.get_execution_order())}")
        logger.info(f"Total agents: {total_agents}")
        logger.info("")
        logger.info("Run without --dry-run to execute workflow")
        
        return {
            "workflow_id": self.workflow_id,
            "dry_run": True,
            "total_waves": len(self.plan.get_execution_order()),
            "total_agents": total_agents,
            "execution_plan": self.plan.waves
        }
    
    async def _execute_wave(self, wave: str) -> None:
        """Execute all agents in a wave."""
        agents = self.plan.get_wave_agents(wave)
        parallel = self.plan.is_wave_parallel(wave)
        description = self.plan.get_wave_description(wave)
        
        logger.info("-" * 80)
        logger.info(f"WAVE {wave}: {description}")
        logger.info(f"Agents: {', '.join(agents)}")
        logger.info(f"Execution: {'Parallel' if parallel else 'Sequential'}")
        logger.info("-" * 80)
        
        if parallel:
            # Execute agents in parallel
            tasks = [self._execute_agent(wave, agent_id) for agent_id in agents]
            await asyncio.gather(*tasks)
        else:
            # Execute agents sequentially
            for agent_id in agents:
                await self._execute_agent(wave, agent_id)
    
    async def _execute_agent(self, wave: str, agent_id: str) -> None:
        """Execute a single agent."""
        logger.info(f"Executing agent: {agent_id}")
        
        # Create agent context
        context = AgentContext(
            task_id=self.workflow_id,
            run_id=self.workflow_id,
            workflow_state={
                "workflow_id": self.workflow_id,
                "wave": wave,
                "database_url": self.database_url,
            },
            repository_snapshot={},  # Would be loaded from TypeScript snapshot
            evidence_graph={},
            approved_scope=[],
            prior_agent_outputs=self.results,
            repository_root=self.repo_root
        )
        
        # Execute agent
        start_time = datetime.now(UTC)
        try:
            result = await self.coordinator.execute_agent(agent_id, context)
            self.results[agent_id] = result
            
            # Log result
            status_icon = {
                AgentStatus.SUCCESS: "✓",
                AgentStatus.FAILED: "✗",
                AgentStatus.BLOCKED: "⊘",
                AgentStatus.SKIPPED: "→"
            }.get(result.status, "?")
            
            logger.info(f"{status_icon} Agent {agent_id}: {result.status.value} ({result.execution_time_ms:.1f}ms)")
            
            if result.errors:
                for error in result.errors:
                    logger.error(f"  Error: {error}")
            
            if result.warnings:
                for warning in result.warnings:
                    logger.warning(f"  Warning: {warning}")
            
            # Record to evidence ledger
            append_agent_run({
                "runId": f"run_{self.workflow_id}_{agent_id}",
                "agentId": agent_id,
                "wave": wave,
                "commitBefore": "unknown",  # Would be determined by agent
                "commitAfter": "unknown",
                "filesChanged": [],
                "status": result.status.value,
                "timestamp": start_time.isoformat(),
                "duration_ms": result.execution_time_ms,
                "errors": result.errors,
                "warnings": result.warnings
            })
        
        except Exception as e:
            logger.exception(f"Agent {agent_id} execution failed with exception")
            
            # Create failed result
            result = AgentResult(
                agent_id=agent_id,
                status=AgentStatus.FAILED,
                errors=[f"Exception during execution: {str(e)}"]
            )
            self.results[agent_id] = result
    
    def _generate_report(self) -> Dict[str, Any]:
        """Generate final workflow report."""
        end_time = datetime.now(UTC)
        total_time_ms = (end_time - self.start_time).total_seconds() * 1000
        
        # Determine overall status
        all_success = all(r.status == AgentStatus.SUCCESS for r in self.results.values())
        any_failed = any(r.status == AgentStatus.FAILED for r in self.results.values())
        any_blocked = any(r.status == AgentStatus.BLOCKED for r in self.results.values())
        
        if all_success:
            status = "COMPLETED"
            final_verdict = "PASS"
        elif any_failed:
            status = "FAILED"
            final_verdict = "FAIL"
        elif any_blocked:
            status = "BLOCKED"
            final_verdict = "BLOCKED"
        else:
            status = "INCOMPLETE"
            final_verdict = "UNKNOWN"
        
        # Check final gate verdict if available
        if "final_gate_agent" in self.results:
            final_gate_result = self.results["final_gate_agent"]
            final_verdict = final_gate_result.outputs.get("final_verdict", final_verdict)
        
        # Build agents summary
        agents_executed = []
        for wave in self.plan.get_execution_order():
            for agent_id in self.plan.get_wave_agents(wave):
                if agent_id in self.results:
                    result = self.results[agent_id]
                    agents_executed.append({
                        "agent_id": agent_id,
                        "wave": wave,
                        "status": result.status.value,
                        "execution_time_ms": result.execution_time_ms,
                        "errors": result.errors,
                        "warnings": result.warnings
                    })
        
        return {
            "workflow_id": self.workflow_id,
            "status": status,
            "final_verdict": final_verdict,
            "start_time": self.start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "total_execution_time_ms": total_time_ms,
            "agents_executed": agents_executed,
            "evidence_paths": [
                ".agents/evidence/agent-runs.jsonl",
                ".agents/evidence/test-results.jsonl",
                ".agents/evidence/gate-results.jsonl",
                ".agents/evidence/workflow-events.jsonl",
                ".agents/evidence/evidence.jsonl"
            ],
            "timestamp": end_time.isoformat()
        }
    
    def _write_report(self, report: Dict[str, Any]) -> None:
        """Write final report to file."""
        report_dir = self.repo_root / ".agents" / "tasks"
        report_dir.mkdir(parents=True, exist_ok=True)
        
        report_path = report_dir / f"migration-repair-{self.workflow_id}-report.json"
        
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("WORKFLOW COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Status: {report['status']}")
        logger.info(f"Final Verdict: {report['final_verdict']}")
        logger.info(f"Total Time: {report['total_execution_time_ms']:.1f}ms")
        logger.info(f"Report: {report_path}")
        logger.info("")


async def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Migration Repair Workflow CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview execution plan
  python scripts/run-migration-repair.py --dry-run

  # Run full workflow
  python scripts/run-migration-repair.py --verbose

  # Custom database
  python scripts/run-migration-repair.py --database-url postgresql://user:pass@localhost:55432/test_db
        """
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show execution plan without making changes"
    )
    
    parser.add_argument(
        "--database-url",
        type=str,
        help="Override TEST_DATABASE_URL_TUTORIAL environment variable"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging (DEBUG level)"
    )
    
    parser.add_argument(
        "--workflow-id",
        type=str,
        help="Resume existing workflow (default: create new)"
    )
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create and execute workflow
    workflow = MigrationRepairWorkflow(
        workflow_id=args.workflow_id,
        database_url=args.database_url,
        dry_run=args.dry_run
    )
    
    try:
        report = await workflow.execute()
        
        # Exit with appropriate code
        if report.get("final_verdict") == "PASS":
            sys.exit(0)
        elif args.dry_run:
            sys.exit(0)
        else:
            sys.exit(1)
    
    except Exception as e:
        logger.exception("Workflow failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
