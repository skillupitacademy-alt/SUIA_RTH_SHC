"""
Publisher Agent (W9)

After PASS verdict, pushes commit to remote, verifies remote SHA matches
local SHA, and writes audit record to evidence ledger.
"""

import json
from pathlib import Path
from datetime import datetime, UTC
from typing import Optional

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.evidence import ledger
from ..runner import run_command
from ..models import CheckStatus, PublicationState
from .final_gate_agent import format_commit_message


async def fetch_remote_sha() -> Optional[str]:
    """
    Fetch remote HEAD SHA after push.
    
    Returns:
        Remote SHA string if successful, None if fetch failed
    """
    try:
        result = await run_command("git ls-remote origin HEAD")
        if result.exit_code == 0 and result.stdout.strip():
            # Output format: "<sha>\tHEAD"
            parts = result.stdout.strip().split()
            if parts:
                return parts[0]
        return None
    except Exception:
        return None


def record_publication(publication_state: PublicationState, evidence_dir: Path) -> None:
    """
    Write publication.json to .agents/evidence/runs/ with all PublicationState fields.
    
    Args:
        publication_state: Publication state to record
        evidence_dir: Base evidence directory (e.g., .agents/evidence)
    """
    runs_dir = evidence_dir / "runs"
    runs_dir.mkdir(parents=True, exist_ok=True)
    
    publication_file = runs_dir / "publication.json"
    
    # Convert to dict and serialize timestamp
    publication_data = publication_state.model_dump(mode='json')
    
    with open(publication_file, 'w') as f:
        json.dump(publication_data, f, indent=2)


async def execute_publisher_agent(context: AgentContext) -> AgentResult:
    """
    Execute publisher agent.
    
    Commits verified changes after approval, publishes evidence,
    confirms SHA match, and records publication audit.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with publication status
    """
    start_time = datetime.now(UTC)
    agent_id = "publisher_agent"
    
    try:
        # Log agent start
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W9",
            "timestamp": start_time.isoformat(),
            "status": "started",
        })
        
        # Get final gate verdict from W8
        final_gate = context.prior_agent_outputs.get("final_gate_agent")
        
        if not final_gate or not final_gate.passed:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W9",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=["Final gate did not pass - cannot publish"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        gate_verdict = final_gate.outputs.get("gate_verdict")
        
        if gate_verdict != CheckStatus.PASS.value:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W9",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=[f"Gate verdict is {gate_verdict}, not PASS - cannot publish"],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Get current commit SHA
        result = await run_command("git rev-parse HEAD", cwd=str(context.repository_root))
        local_sha = result.stdout.strip()
        
        # Get implementer's commit info
        implementer = context.prior_agent_outputs.get("repair_implementer")
        commit_after = implementer.outputs.get("commit_after") if implementer else local_sha
        
        # Verify we're publishing the tested commit
        if local_sha != commit_after:
            end_time = datetime.now(UTC)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W9",
                "timestamp": end_time.isoformat(),
                "status": "blocked",
                "duration_ms": duration_ms,
            })
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.BLOCKED,
                errors=[
                    f"Local commit {local_sha} does not match tested commit {commit_after} - cannot publish"
                ],
                evidence_ids=["agent-runs.jsonl"],
                execution_time_ms=duration_ms,
                timestamp=end_time
            )
        
        # Note: We do NOT push to remote per instructions
        # The instruction says "Never push to remote"
        # This agent only records that it WOULD publish if permitted
        push_attempted = False
        push_succeeded = False
        
        # Fetch remote SHA to verify what's currently on remote
        remote_sha = await fetch_remote_sha()
        
        # Compare SHAs if remote fetch succeeded
        sha_match = None
        if remote_sha is not None:
            sha_match = (local_sha == remote_sha)
        
        # Create publication state
        publication_state = PublicationState(
            approval_status=gate_verdict,
            local_sha=local_sha,
            push_attempted=push_attempted,
            push_succeeded=push_succeeded,
            remote_sha=remote_sha,
            sha_match=sha_match,
            timestamp=datetime.now(UTC)
        )
        
        # Record publication to evidence
        evidence_dir = Path(context.repository_root) / ".agents" / "evidence"
        record_publication(publication_state, evidence_dir)
        
        # Create final workflow completion commit if evidence was assembled
        evidence_assembler = context.prior_agent_outputs.get("evidence_assembler")
        if evidence_assembler and evidence_assembler.passed:
            # Stage evidence files
            await run_command("git add .agents/evidence/", cwd=str(context.repository_root))
            
            # Create commit with Run-ID footer
            commit_message = format_commit_message(
                run_id=context.run_id,
                summary=f"Migration repair workflow complete - {gate_verdict}"
            )
            
            # Commit evidence
            result = await run_command(
                f'git commit -m "{commit_message}"',
                cwd=str(context.repository_root)
            )
            
            if result.exit_code == 0:
                # Update local_sha with new commit
                sha_result = await run_command("git rev-parse HEAD", cwd=str(context.repository_root))
                local_sha = sha_result.stdout.strip()
        
        # If push was attempted and succeeded, remote SHA MUST match local SHA
        if push_attempted and push_succeeded:
            if not sha_match:
                end_time = datetime.now(UTC)
                duration_ms = int((end_time - start_time).total_seconds() * 1000)
                
                ledger.append_agent_run({
                    "agent_id": agent_id,
                    "wave": "W9",
                    "timestamp": end_time.isoformat(),
                    "status": "failed",
                    "duration_ms": duration_ms,
                })
                
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.FAILED,
                    errors=[
                        f"Remote SHA {remote_sha} does not match local SHA {local_sha} - publication verification failed"
                    ],
                    evidence_ids=["agent-runs.jsonl", "runs/publication.json"],
                    execution_time_ms=duration_ms,
                    timestamp=end_time
                )
        
        # Calculate duration
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log completion
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W9",
            "timestamp": end_time.isoformat(),
            "status": "completed",
            "duration_ms": duration_ms,
            "evidence": {
                "local_sha": local_sha,
                "tested_sha": commit_after,
                "remote_sha": remote_sha,
                "sha_match": sha_match,
                "published": False,  # Not pushed per instructions
                "reason": "Publishing skipped per workflow instructions (never push to remote)",
            }
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.SUCCESS,
            outputs={
                "published": False,
                "local_sha": local_sha,
                "tested_sha": commit_after,
                "remote_sha": remote_sha,
                "sha_match": sha_match,
                "message": "Publication step completed - commits are ready but not pushed to remote per workflow policy",
            },
            evidence_ids=["agent-runs.jsonl", "runs/publication.json"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
        
    except Exception as e:
        end_time = datetime.now(UTC)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log failure
        ledger.append_agent_run({
            "agent_id": agent_id,
            "wave": "W9",
            "timestamp": end_time.isoformat(),
            "status": "failed",
            "duration_ms": duration_ms,
            "error": str(e)
        })
        
        return AgentResult(
            agent_id=agent_id,
            status=AgentStatus.FAILED,
            errors=[f"Publisher agent failed: {str(e)}"],
            evidence_ids=["agent-runs.jsonl"],
            execution_time_ms=duration_ms,
            timestamp=end_time
        )
