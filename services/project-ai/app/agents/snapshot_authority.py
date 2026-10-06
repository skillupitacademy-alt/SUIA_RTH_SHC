"""
Snapshot Authority Agent (Agent 02)

Generates TypeScript discovery snapshot and establishes frozen evidence baseline.
Calls TypeScript discovery via pnpm tsx, extracts canonical hash, copies to run directory.

Architecture Rules:
- Agent 02 generates snapshot ONCE, Python NEVER recomputes it
- Snapshot frozen for entire workflow - immutable evidence baseline
- Extracts canonicalHash computed by TypeScript
- Creates run directory with evidence structure
"""

import json
import subprocess
from datetime import datetime, UTC
from pathlib import Path

from app.models.agent_result import AgentResult, AgentStatus
from app.orchestration.agent_coordinator import AgentContext
from app.evidence.logger import EvidenceLogger


async def execute_snapshot_authority(context: AgentContext) -> AgentResult:
    """
    Execute snapshot authority agent.
    
    Calls TypeScript discovery to generate snapshot:
    1. Run pnpm tsx .agents/scripts/regenerate-m1-snapshot.mjs
    2. Read snapshot from .agents/output/snapshot.json
    3. Extract snapshot.canonicalHash (TypeScript computed)
    4. Copy snapshot to .project-ai/runs/{commit-sha}-{snapshot-hash}/
    5. Create evidence directory structure
    
    Args:
        context: Agent execution context with repository_root
        
    Returns:
        AgentResult with snapshot_hash, snapshot_path, evidence_count
    """
    start_time = datetime.now(UTC)
    repo_root = context.repository_root
    
    try:
        # Get commit SHA from prior agent outputs
        prior_auditor = context.prior_agent_outputs.get('repository_auditor')
        if not prior_auditor or not prior_auditor.passed:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="snapshot_authority",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Repository auditor did not pass - cannot generate snapshot"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        commit_sha = prior_auditor.outputs.get('commit_sha', 'unknown')
        
        # Call TypeScript discovery
        typescript_result = _run_typescript_discovery(repo_root)
        
        if typescript_result['status'] != 'success':
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="snapshot_authority",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=[typescript_result['error']],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Read snapshot file
        snapshot_path = repo_root / '.agents' / 'output' / 'snapshot.json'
        
        if not snapshot_path.exists():
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="snapshot_authority",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=["Snapshot file not found at .agents/output/snapshot.json"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Parse snapshot
        snapshot_data = json.loads(snapshot_path.read_text(encoding='utf-8'))
        
        # Extract canonicalHash (TypeScript computed, Python NEVER recomputes)
        snapshot_hash = snapshot_data.get('canonicalHash', '')
        
        if not snapshot_hash:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="snapshot_authority",
                status=AgentStatus.FAILED,
                outputs={},
                evidence_ids=[],
                errors=["Snapshot missing canonicalHash field"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Count evidence entries
        evidence_count = len(snapshot_data.get('evidence', []))
        
        # Create run directory with evidence structure
        evidence_logger = EvidenceLogger(repo_root)
        run_dir = evidence_logger.create_run_directory(
            commit_sha=commit_sha,
            snapshot_hash=snapshot_hash,
            snapshot_path=snapshot_path
        )
        
        # Build outputs
        outputs = {
            "snapshot_hash": snapshot_hash,
            "snapshot_path": str(snapshot_path.relative_to(repo_root)),
            "run_directory": str(run_dir.relative_to(repo_root)),
            "evidence_count": evidence_count,
            "commit_sha": commit_sha,
            "typescript_output": typescript_result['output'][:500]  # First 500 chars
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="snapshot_authority",
            status=AgentStatus.SUCCESS,
            outputs=outputs,
            evidence_ids=[],  # Snapshot generation doesn't consume evidence, it creates it
            errors=[],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except json.JSONDecodeError as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="snapshot_authority",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Failed to parse snapshot JSON: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="snapshot_authority",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Snapshot authority execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _run_typescript_discovery(repo_root: Path) -> dict:
    """
    Run TypeScript discovery script to generate snapshot.
    
    Calls: pnpm tsx .agents/scripts/regenerate-m1-snapshot.mjs
    
    Args:
        repo_root: Repository root path
        
    Returns:
        Dict with 'status' (success/failed), 'output', 'error'
    """
    try:
        result = subprocess.run(
            ['pnpm', 'tsx', '.agents/scripts/regenerate-m1-snapshot.mjs'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes
            check=False
        )
        
        if result.returncode != 0:
            return {
                'status': 'failed',
                'output': result.stdout,
                'error': f"TypeScript discovery failed with code {result.returncode}: {result.stderr}"
            }
        
        return {
            'status': 'success',
            'output': result.stdout,
            'error': None
        }
    
    except subprocess.TimeoutExpired:
        return {
            'status': 'failed',
            'output': '',
            'error': "TypeScript discovery timed out after 300 seconds"
        }
    
    except FileNotFoundError:
        return {
            'status': 'failed',
            'output': '',
            'error': "pnpm executable not found - ensure Node.js and pnpm are installed"
        }
    
    except Exception as e:
        return {
            'status': 'failed',
            'output': '',
            'error': f"TypeScript discovery failed: {str(e)}"
        }
