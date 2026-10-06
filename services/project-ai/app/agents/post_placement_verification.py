"""Post-placement verification agent using git diff."""

import hashlib
import subprocess
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


async def execute_post_placement_verification(context: AgentContext) -> AgentResult:
    """
    Execute post-placement verification agent (Agent 11).
    
    Verifies placement changes using git diff:
    - Uses git diff HEAD to verify placement changes
    - NO new snapshot generation (snapshot immutability rule)
    - Validates changed files match PlacementManifest entries
    - Computes file hashes of placed files
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with verification_status, changed_files, placed_file_hashes, 
        diff_matches_manifest (boolean)
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get placement executor result from prior agent
        executor_result = context.prior_agent_outputs.get('placement_executor')
        if not executor_result or not executor_result.passed:
            return AgentResult(
                agent_id="post_placement_verification",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Placement executor agent did not pass"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Get manifest from placement_manifest agent
        manifest_result = context.prior_agent_outputs.get('placement_manifest')
        if not manifest_result or not manifest_result.passed:
            return AgentResult(
                agent_id="post_placement_verification",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["Placement manifest agent did not pass"],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Extract execution details
        execution_result = executor_result.outputs.get('execution_result', {})
        target_path = execution_result.get('targetPath', '')
        
        # Get manifest data
        manifest_data = manifest_result.outputs.get('manifest', {})
        expected_target_path = manifest_data.get('targetPath', '')
        
        # Run git diff to capture changes
        changed_files = await _get_git_diff_files(context.repository_root)
        
        # Compute file hashes of placed files
        placed_file_hashes = await _compute_placed_file_hashes(
            context.repository_root,
            changed_files
        )
        
        # Validate that changed files match manifest target path
        diff_matches_manifest = _validate_diff_matches_manifest(
            changed_files,
            expected_target_path
        )
        
        # Determine verification status
        if diff_matches_manifest and len(changed_files) > 0:
            verification_status = "VERIFIED"
            status = AgentStatus.SUCCESS
            errors = []
        elif len(changed_files) == 0:
            verification_status = "NO_CHANGES_DETECTED"
            status = AgentStatus.FAILED
            errors = ["No git changes detected after placement execution"]
        else:
            verification_status = "MISMATCH"
            status = AgentStatus.FAILED
            errors = [
                f"Changed files do not match manifest target path. "
                f"Expected path: {expected_target_path}, "
                f"Changed files: {', '.join(changed_files)}"
            ]
        
        # Build outputs
        outputs = {
            'verification_status': verification_status,
            'changed_files': changed_files,
            'placed_file_hashes': placed_file_hashes,
            'diff_matches_manifest': diff_matches_manifest,
            'expected_target_path': expected_target_path,
            'files_verified': len(changed_files)
        }
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="post_placement_verification",
            status=status,
            outputs=outputs,
            evidence_ids=manifest_result.evidence_ids,
            errors=errors,
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="post_placement_verification",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Post-placement verification failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


async def _get_git_diff_files(repository_root: Path) -> List[str]:
    """
    Get list of changed files using git diff HEAD.
    
    Args:
        repository_root: Repository root path
        
    Returns:
        List of changed file paths (relative to repo root)
    """
    try:
        # Run git diff --name-only HEAD
        result = subprocess.run(
            ['git', 'diff', '--name-only', 'HEAD'],
            cwd=repository_root,
            capture_output=True,
            text=True,
            check=True,
            timeout=30
        )
        
        # Parse output to get list of files
        changed_files = [
            line.strip() 
            for line in result.stdout.strip().split('\n') 
            if line.strip()
        ]
        
        return changed_files
    
    except subprocess.CalledProcessError as e:
        # Git diff failed - likely no changes or git error
        return []
    
    except subprocess.TimeoutExpired:
        return []


async def _compute_placed_file_hashes(
    repository_root: Path,
    changed_files: List[str]
) -> Dict[str, str]:
    """
    Compute SHA-256 hashes for placed files.
    
    Args:
        repository_root: Repository root path
        changed_files: List of changed file paths
        
    Returns:
        Dict mapping file path to SHA-256 hash
    """
    file_hashes = {}
    
    for file_path in changed_files:
        full_path = repository_root / file_path
        
        if not full_path.exists():
            continue
        
        try:
            # Read file and compute hash
            content = full_path.read_bytes()
            file_hash = hashlib.sha256(content).hexdigest()
            file_hashes[file_path] = file_hash
        
        except Exception:
            # Skip files that can't be read
            continue
    
    return file_hashes


def _validate_diff_matches_manifest(
    changed_files: List[str],
    expected_target_path: str
) -> bool:
    """
    Validate that git diff matches manifest target path.
    
    Args:
        changed_files: List of changed file paths
        expected_target_path: Expected target path from manifest
        
    Returns:
        True if all changed files are under expected target path
    """
    if not changed_files:
        return False
    
    if not expected_target_path:
        # No expected path - can't validate
        return len(changed_files) > 0
    
    # Normalize paths
    expected_path_normalized = expected_target_path.replace('\\', '/').strip('/')
    
    # Check that all changed files are under expected path
    for file_path in changed_files:
        file_path_normalized = file_path.replace('\\', '/').strip('/')
        
        # Check if file is under expected path
        if not file_path_normalized.startswith(expected_path_normalized):
            return False
    
    return True
