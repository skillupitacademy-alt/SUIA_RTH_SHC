"""
Git Worktree Isolation Manager - M2.9 Wave 5

Provides isolated git worktree environment for placement operations.

ISOLATION BENEFITS:
- Placement operations don't affect main working tree
- Safe concurrent placement operations (separate worktrees)
- Clean diff generation between worktree and main tree
- Easy rollback (remove worktree without affecting main tree)
- Atomic commit in isolated environment

SAFETY INVARIANTS:
- Each placement gets unique worktree (timestamp-based)
- Worktree created from current HEAD
- All placement mutations happen in worktree
- Worktree path recorded in evidence
- Cleanup happens after successful commit or on error
"""

import subprocess
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class WorktreeContext:
    """
    Context for an isolated git worktree.
    """
    
    worktree_path: Path
    branch_name: str
    base_commit: str
    created_at: str
    workflow_id: str
    manifest_id: str


class WorktreeError(Exception):
    """Error during worktree operations."""
    pass


class WorktreeManager:
    """
    Manages isolated git worktrees for placement operations.
    
    Each placement operation gets a unique worktree isolated from the main
    working tree, preventing conflicts and enabling safe concurrent operations.
    """
    
    def __init__(self, repository_root: Path):
        """
        Initialize worktree manager.
        
        Args:
            repository_root: Path to repository root directory
        """
        self.repository_root = Path(repository_root)
        self.worktrees_root = self.repository_root / ".worktrees"
        
        if not self.repository_root.exists():
            raise WorktreeError(
                f"Repository root does not exist: {repository_root}"
            )
    
    def create_worktree(
        self,
        workflow_id: str,
        manifest_id: str,
        branch_name: Optional[str] = None
    ) -> WorktreeContext:
        """
        Create isolated git worktree for placement operation.
        
        Worktree naming: .worktrees/placement-<timestamp>-<manifest_id_prefix>
        
        Args:
            workflow_id: Workflow identifier
            manifest_id: Placement manifest identifier
            branch_name: Optional branch name (default: placement/<manifest_id>)
            
        Returns:
            WorktreeContext with worktree details
            
        Raises:
            WorktreeError: If worktree creation fails
        """
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        manifest_prefix = manifest_id[:8] if len(manifest_id) >= 8 else manifest_id
        
        worktree_name = f"placement-{timestamp}-{manifest_prefix}"
        worktree_path = self.worktrees_root / worktree_name
        
        if not branch_name:
            branch_name = f"placement/{manifest_id}"
        
        # Ensure worktrees directory exists
        self.worktrees_root.mkdir(exist_ok=True)
        
        # Get current HEAD commit
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
            base_commit = result.stdout.strip()
        except subprocess.CalledProcessError as e:
            raise WorktreeError(
                f"Failed to get current HEAD: {e.stderr}"
            )
        
        # Create worktree
        try:
            subprocess.run(
                ['git', 'worktree', 'add', '-b', branch_name, str(worktree_path), base_commit],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            # If branch already exists, try without -b
            try:
                subprocess.run(
                    ['git', 'worktree', 'add', str(worktree_path), branch_name],
                    cwd=self.repository_root,
                    check=True,
                    capture_output=True,
                    text=True
                )
            except subprocess.CalledProcessError as e2:
                raise WorktreeError(
                    f"Failed to create worktree: {e2.stderr}"
                )
        
        created_at = datetime.now(timezone.utc).isoformat()
        
        return WorktreeContext(
            worktree_path=worktree_path,
            branch_name=branch_name,
            base_commit=base_commit,
            created_at=created_at,
            workflow_id=workflow_id,
            manifest_id=manifest_id
        )
    
    def commit_in_worktree(
        self,
        context: WorktreeContext,
        file_paths: List[str],
        commit_message: str
    ) -> str:
        """
        Stage and commit files in worktree.
        
        Args:
            context: WorktreeContext from create_worktree()
            file_paths: List of file paths relative to worktree root
            commit_message: Commit message
            
        Returns:
            Commit SHA
            
        Raises:
            WorktreeError: If commit fails
        """
        # Stage files
        try:
            subprocess.run(
                ['git', 'add'] + file_paths,
                cwd=context.worktree_path,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            raise WorktreeError(
                f"Failed to stage files in worktree: {e.stderr}"
            )
        
        # Commit
        try:
            subprocess.run(
                ['git', 'commit', '-m', commit_message],
                cwd=context.worktree_path,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            raise WorktreeError(
                f"Failed to commit in worktree: {e.stderr}"
            )
        
        # Get commit SHA
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=context.worktree_path,
                check=True,
                capture_output=True,
                text=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            raise WorktreeError(
                f"Failed to get commit SHA: {e.stderr}"
            )
    
    def generate_diff(
        self,
        context: WorktreeContext,
        base_ref: str = "HEAD"
    ) -> str:
        """
        Generate diff between worktree state and base reference.
        
        Args:
            context: WorktreeContext from create_worktree()
            base_ref: Base reference to diff against (default: HEAD of main repo)
            
        Returns:
            Diff output as string
            
        Raises:
            WorktreeError: If diff generation fails
        """
        try:
            # Get diff between worktree HEAD and base commit
            result = subprocess.run(
                ['git', 'diff', context.base_commit, 'HEAD'],
                cwd=context.worktree_path,
                check=True,
                capture_output=True,
                text=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            raise WorktreeError(
                f"Failed to generate diff: {e.stderr}"
            )
    
    def cleanup_worktree(self, context: WorktreeContext, force: bool = False) -> None:
        """
        Remove worktree and clean up.
        
        Args:
            context: WorktreeContext from create_worktree()
            force: Force removal even if worktree has uncommitted changes
            
        Raises:
            WorktreeError: If cleanup fails
        """
        try:
            force_flag = ['--force'] if force else []
            subprocess.run(
                ['git', 'worktree', 'remove'] + force_flag + [str(context.worktree_path)],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            # If worktree doesn't exist, not an error
            if "is not a working tree" in e.stderr or "does not exist" in e.stderr:
                pass
            else:
                raise WorktreeError(
                    f"Failed to remove worktree: {e.stderr}"
                )
        
        # Ensure directory is removed
        if context.worktree_path.exists():
            try:
                shutil.rmtree(context.worktree_path)
            except Exception as e:
                raise WorktreeError(
                    f"Failed to remove worktree directory: {e}"
                )
    
    def get_worktree_evidence(self, context: WorktreeContext) -> Dict[str, Any]:
        """
        Generate evidence record for worktree operations.
        
        Args:
            context: WorktreeContext from create_worktree()
            
        Returns:
            Evidence dictionary with worktree details
        """
        return {
            "worktree_path": str(context.worktree_path),
            "branch_name": context.branch_name,
            "base_commit": context.base_commit,
            "created_at": context.created_at,
            "workflow_id": context.workflow_id,
            "manifest_id": context.manifest_id,
            "isolation_method": "git_worktree",
        }
    
    def list_active_worktrees(self) -> List[Dict[str, str]]:
        """
        List all active worktrees.
        
        Returns:
            List of worktree information dictionaries
            
        Raises:
            WorktreeError: If listing fails
        """
        try:
            result = subprocess.run(
                ['git', 'worktree', 'list', '--porcelain'],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
            
            worktrees = []
            current_worktree = {}
            
            for line in result.stdout.strip().split('\n'):
                if not line:
                    if current_worktree:
                        worktrees.append(current_worktree)
                        current_worktree = {}
                    continue
                
                if line.startswith('worktree '):
                    current_worktree['path'] = line.split(' ', 1)[1]
                elif line.startswith('HEAD '):
                    current_worktree['head'] = line.split(' ', 1)[1]
                elif line.startswith('branch '):
                    current_worktree['branch'] = line.split(' ', 1)[1]
            
            if current_worktree:
                worktrees.append(current_worktree)
            
            return worktrees
        except subprocess.CalledProcessError as e:
            raise WorktreeError(
                f"Failed to list worktrees: {e.stderr}"
            )
    
    def cleanup_all_placement_worktrees(self, force: bool = False) -> int:
        """
        Clean up all placement worktrees in .worktrees directory.
        
        Args:
            force: Force removal even if worktrees have uncommitted changes
            
        Returns:
            Number of worktrees cleaned up
        """
        if not self.worktrees_root.exists():
            return 0
        
        cleaned = 0
        for worktree_dir in self.worktrees_root.iterdir():
            if worktree_dir.is_dir() and worktree_dir.name.startswith('placement-'):
                try:
                    force_flag = ['--force'] if force else []
                    subprocess.run(
                        ['git', 'worktree', 'remove'] + force_flag + [str(worktree_dir)],
                        cwd=self.repository_root,
                        check=True,
                        capture_output=True,
                        text=True
                    )
                    cleaned += 1
                except subprocess.CalledProcessError:
                    # Try manual removal if git command fails
                    try:
                        shutil.rmtree(worktree_dir)
                        cleaned += 1
                    except Exception:
                        pass
        
        return cleaned


def create_worktree_manager(repository_root: Path) -> WorktreeManager:
    """
    Factory function to create WorktreeManager instance.
    
    Args:
        repository_root: Path to repository root directory
        
    Returns:
        WorktreeManager instance
    """
    return WorktreeManager(repository_root)
