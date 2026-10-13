"""
Evidence Logger

Manages .project-ai/runs/ directory structure and evidence logging.

Architecture Rules:
- Run directories: .project-ai/runs/{commit-sha}-{snapshot-hash}/
- All JSON uses 2-space indentation
- Current symlink points to latest run (or current.txt fallback on Windows)
- Evidence bound to commit SHA + snapshot hash
"""

import json
import os
import subprocess
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, Optional


class EvidenceLogger:
    """
    Evidence logging for Project AI runs.
    
    Responsibilities:
    - Create run directories with metadata
    - Copy TypeScript snapshots to run directory
    - Log gate results
    - Log agent results
    - Maintain current symlink/fallback
    """
    
    def __init__(self, repository_root: Path):
        """
        Initialize evidence logger.
        
        Args:
            repository_root: Path to repository root
        """
        self.repository_root = Path(repository_root)
        self.evidence_root = self.repository_root / '.project-ai'
        self.runs_dir = self.evidence_root / 'runs'
        
    def create_run_directory(
        self,
        commit_sha: str,
        snapshot_hash: str,
        snapshot_path: Path
    ) -> Path:
        """
        Create run directory structure with metadata.
        
        Directory structure:
            .project-ai/runs/{commit-sha}-{snapshot-hash}/
                metadata.json
                snapshot.json (copy from TypeScript output)
                gates/
                agents/
                screenshots/
                commands/
                logs/
                results/
                browser/
                final/
        
        Args:
            commit_sha: Git commit SHA
            snapshot_hash: Canonical snapshot hash
            snapshot_path: Path to TypeScript snapshot.json
            
        Returns:
            Path to created run directory
            
        Raises:
            FileNotFoundError: If snapshot_path doesn't exist
        """
        # Validate snapshot exists
        if not snapshot_path.exists():
            raise FileNotFoundError(f"Snapshot not found: {snapshot_path}")
        
        # Create run directory
        run_id = f"{commit_sha[:8]}-{snapshot_hash[:8]}"
        run_dir = self.runs_dir / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        subdirs = ['gates', 'agents', 'screenshots', 'commands', 'logs', 'results', 'browser', 'final']
        for subdir in subdirs:
            (run_dir / subdir).mkdir(exist_ok=True)
        
        # Get current branch
        branch = self._get_current_branch()
        
        # Read snapshot to get evidence count
        snapshot_data = json.loads(snapshot_path.read_text(encoding='utf-8'))
        evidence_count = len(snapshot_data.get('evidence', []))
        
        # Create metadata.json
        metadata = {
            'runId': run_id,
            'commitSha': commit_sha,
            'snapshotHash': snapshot_hash,
            'branch': branch,
            'timestamp': datetime.now(UTC).isoformat(),
            'snapshotPath': str(snapshot_path.relative_to(self.repository_root)),
            'evidenceCount': evidence_count,
            'status': 'in-progress'
        }
        
        metadata_path = run_dir / 'metadata.json'
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding='utf-8')
        
        # Copy snapshot.json
        snapshot_copy_path = run_dir / 'snapshot.json'
        snapshot_copy_path.write_text(snapshot_path.read_text(encoding='utf-8'), encoding='utf-8')
        
        # Update current symlink/fallback
        self._update_current_pointer(run_id)
        
        return run_dir
    
    def log_gate_result(
        self,
        run_dir: Path,
        gate_name: str,
        result: Dict[str, Any]
    ) -> Path:
        """
        Log certification gate result.
        
        Enforces 2-space JSON indentation (Finding #7).
        Re-serializes result to ensure consistent formatting even if
        caller passes pre-formatted JSON strings.
        
        Args:
            run_dir: Path to run directory
            gate_name: Gate identifier (e.g., 'ubrc', 'brand', 'theme')
            result: Gate result dictionary with status, message, evidence_ids, blockers
            
        Returns:
            Path to created gate result file
        """
        gates_dir = run_dir / 'gates'
        gates_dir.mkdir(exist_ok=True)
        
        # Ensure timestamp exists
        if 'timestamp' not in result:
            result['timestamp'] = datetime.now(UTC).isoformat()
        
        # Re-serialize to enforce indent=2 (Finding #7)
        gate_file = gates_dir / f"{gate_name}.json"
        gate_file.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
        
        return gate_file
    
    def log_agent_result(
        self,
        run_dir: Path,
        result: Dict[str, Any]
    ) -> Path:
        """
        Log agent execution result.
        
        Enforces 2-space JSON indentation (Finding #7).
        Re-serializes result to ensure consistent formatting even if
        caller passes pre-formatted JSON strings.
        
        Args:
            run_dir: Path to run directory
            result: Agent result dictionary with agentId, status, outputs, evidence_ids, errors, warnings
            
        Returns:
            Path to created agent result file
        """
        agents_dir = run_dir / 'agents'
        agents_dir.mkdir(exist_ok=True)
        
        # Ensure timestamp exists
        if 'timestamp' not in result:
            result['timestamp'] = datetime.now(UTC).isoformat()
        
        # Re-serialize to enforce indent=2 (Finding #7)
        agent_id = result.get('agentId', 'unknown')
        agent_file = agents_dir / f"{agent_id}.json"
        agent_file.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
        
        return agent_file
    
    def _get_current_branch(self) -> str:
        """
        Get current git branch name.
        
        Returns:
            Branch name or 'unknown' if not in git repository
        """
        try:
            result = subprocess.run(
                ['git', 'branch', '--show-current'],
                cwd=self.repository_root,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip() or 'unknown'
        except (subprocess.CalledProcessError, FileNotFoundError):
            return 'unknown'
    
    def _update_current_pointer(self, run_id: str) -> None:
        """
        Update current symlink or fallback file to point to latest run.
        
        On Windows, symlinks require admin privileges, so we use a fallback
        current.txt file containing the run ID.
        
        Args:
            run_id: Run directory name
        """
        current_link = self.runs_dir / 'current'
        current_txt = self.runs_dir / 'current.txt'
        
        # Try to create symlink (Unix/Linux or Windows with privileges)
        try:
            if current_link.exists() or current_link.is_symlink():
                current_link.unlink()
            current_link.symlink_to(run_id, target_is_directory=True)
        except (OSError, NotImplementedError):
            # Fallback: Write run ID to current.txt
            current_txt.write_text(run_id, encoding='utf-8')
    
    def get_current_run_dir(self) -> Optional[Path]:
        """
        Get path to current run directory.
        
        Returns:
            Path to current run directory or None if not found
        """
        current_link = self.runs_dir / 'current'
        current_txt = self.runs_dir / 'current.txt'
        
        # Try symlink first
        if current_link.is_symlink():
            return current_link.resolve()
        
        # Fallback to current.txt
        if current_txt.exists():
            run_id = current_txt.read_text(encoding='utf-8').strip()
            run_dir = self.runs_dir / run_id
            if run_dir.exists():
                return run_dir
        
        return None
