"""
Repository Auditor Agent (Agent 01)

Validates git repository state before allowing workflow to proceed.
Returns BLOCKED if repository is dirty or remote unreachable.

Architecture Rules:
- Agent 01 is the first agent in the DAG
- Must validate git state via subprocess commands
- BLOCKED status prevents all downstream agents from executing
- Never touches files - only git metadata
"""

import subprocess
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, Tuple

from app.models.agent_result import AgentResult, AgentStatus
from app.orchestration.agent_coordinator import AgentContext


async def execute_repository_auditor(context: AgentContext) -> AgentResult:
    """
    Execute repository auditor agent.
    
    Validates git repository state:
    - Checks .git/ directory exists
    - Working directory is clean (git status --porcelain)
    - Branch is m2-project-ai-foundation or feature/*
    - No merge conflicts (git ls-files -u)
    - Remote is reachable (git remote -v)
    
    Returns BLOCKED if repository is dirty or remote unreachable.
    
    Args:
        context: Agent execution context
        
    Returns:
        AgentResult with repository health status
    """
    start_time = datetime.now(UTC)
    repo_root = context.repository_root
    
    try:
        # Check .git/ directory exists
        git_dir = repo_root / '.git'
        if not git_dir.exists():
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="repository_auditor",
                status=AgentStatus.FAILED,
                outputs={
                    "health_status": "CORRUPTED",
                    "is_clean": False,
                    "remote_reachable": False
                },
                evidence_ids=[],
                errors=["Not a git repository: .git/ directory not found"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Get commit SHA
        commit_sha, sha_error = _run_git_command(
            ['git', 'rev-parse', 'HEAD'],
            repo_root
        )
        
        # Get branch name
        branch_name, branch_error = _run_git_command(
            ['git', 'branch', '--show-current'],
            repo_root
        )
        
        # Check working directory is clean
        status_output, status_error = _run_git_command(
            ['git', 'status', '--porcelain'],
            repo_root
        )
        is_clean = len(status_output.strip()) == 0
        
        # Check for merge conflicts
        conflicts_output, conflicts_error = _run_git_command(
            ['git', 'ls-files', '-u'],
            repo_root
        )
        has_conflicts = len(conflicts_output.strip()) > 0
        
        # Check remote is reachable
        remote_output, remote_error = _run_git_command(
            ['git', 'remote', '-v'],
            repo_root
        )
        remote_reachable = len(remote_output.strip()) > 0 and remote_error is None
        
        # Validate branch name
        valid_branch = _validate_branch(branch_name)
        
        # Determine health status
        health_status, status, errors, warnings = _determine_health_status(
            is_clean=is_clean,
            has_conflicts=has_conflicts,
            remote_reachable=remote_reachable,
            valid_branch=valid_branch,
            branch_name=branch_name,
            commit_sha=commit_sha,
            sha_error=sha_error,
            branch_error=branch_error
        )
        
        # Build outputs
        outputs = {
            "commit_sha": commit_sha.strip() if commit_sha else "unknown",
            "branch_name": branch_name.strip() if branch_name else "unknown",
            "is_clean": is_clean,
            "remote_reachable": remote_reachable,
            "health_status": health_status,
            "has_conflicts": has_conflicts,
            "valid_branch": valid_branch
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="repository_auditor",
            status=status,
            outputs=outputs,
            evidence_ids=[],  # Git metadata doesn't generate evidence IDs
            errors=errors,
            warnings=warnings,
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="repository_auditor",
            status=AgentStatus.FAILED,
            outputs={
                "health_status": "CORRUPTED",
                "is_clean": False,
                "remote_reachable": False
            },
            evidence_ids=[],
            errors=[f"Repository auditor execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _run_git_command(cmd: list[str], cwd: Path) -> Tuple[str, str | None]:
    """
    Run git command and return output.
    
    Args:
        cmd: Git command to run
        cwd: Working directory
        
    Returns:
        Tuple of (stdout, error_message)
    """
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30,
            check=False
        )
        
        if result.returncode != 0:
            return result.stdout, result.stderr or f"Command failed with code {result.returncode}"
        
        return result.stdout, None
    
    except subprocess.TimeoutExpired:
        return "", "Git command timed out after 30 seconds"
    except FileNotFoundError:
        return "", "Git executable not found"
    except Exception as e:
        return "", f"Git command failed: {str(e)}"


def _validate_branch(branch_name: str) -> bool:
    """
    Validate branch name matches allowed patterns.
    
    Allowed branches:
    - m2-project-ai-foundation
    - feature/*
    
    Args:
        branch_name: Current branch name
        
    Returns:
        True if branch is valid
    """
    if not branch_name:
        return False
    
    branch = branch_name.strip()
    
    # Allow m2-project-ai-foundation
    if branch == "m2-project-ai-foundation":
        return True
    
    # Allow feature/* branches
    if branch.startswith("feature/"):
        return True
    
    return False


def _determine_health_status(
    is_clean: bool,
    has_conflicts: bool,
    remote_reachable: bool,
    valid_branch: bool,
    branch_name: str,
    commit_sha: str,
    sha_error: str | None,
    branch_error: str | None
) -> Tuple[str, AgentStatus, list[str], list[str]]:
    """
    Determine repository health status and agent result status.
    
    Args:
        is_clean: Working directory is clean
        has_conflicts: Merge conflicts detected
        remote_reachable: Remote is reachable
        valid_branch: Branch name is valid
        branch_name: Current branch name
        commit_sha: Current commit SHA
        sha_error: Error getting commit SHA
        branch_error: Error getting branch name
        
    Returns:
        Tuple of (health_status, agent_status, errors, warnings)
    """
    errors = []
    warnings = []
    
    # Check for critical errors
    if sha_error:
        errors.append(f"Failed to get commit SHA: {sha_error}")
    
    if branch_error:
        errors.append(f"Failed to get branch name: {branch_error}")
    
    # Check for conflicts
    if has_conflicts:
        errors.append("Merge conflicts detected - resolve conflicts before proceeding")
        return "CONFLICTS", AgentStatus.FAILED, errors, warnings
    
    # Check branch validity
    if not valid_branch:
        errors.append(
            f"Invalid branch '{branch_name}' - must be m2-project-ai-foundation or feature/*"
        )
        return "DIRTY", AgentStatus.FAILED, errors, warnings
    
    # Check if working directory is dirty
    if not is_clean:
        errors.append("Working directory is dirty - commit or stash changes before proceeding")
        return "DIRTY", AgentStatus.BLOCKED, errors, warnings
    
    # Check remote reachability
    if not remote_reachable:
        errors.append("Git remote not reachable - check network connection")
        return "DIRTY", AgentStatus.BLOCKED, errors, warnings
    
    # Repository is healthy
    warnings.append(f"Repository is clean on branch {branch_name}")
    return "HEALTHY", AgentStatus.SUCCESS, errors, warnings
