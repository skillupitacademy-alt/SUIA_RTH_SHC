"""Safe repository mutation executor for approved placement manifests."""

import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.models.candidate import PlacementDecision, PlacementManifest
from app.models.governance import ApprovalStatus


class PlacementExecutionError(Exception):
    """Error during placement execution."""
    pass


class PlacementExecutor:
    """
    Executes approved placement manifests with safety invariants.
    
    Safety invariants:
    - No self-approval: executor cannot approve its own mutations
    - Manifest hash verification: reject tampered manifests
    - No arbitrary shell execution: only approved git operations
    - Approval required: unapproved mutations are BLOCKED
    """
    
    def __init__(self, repository_root: str | Path):
        """
        Initialize placement executor.
        
        Args:
            repository_root: Path to repository root directory
        """
        self.repository_root = Path(repository_root)
        
        if not self.repository_root.exists():
            raise PlacementExecutionError(
                f"Repository root does not exist: {repository_root}"
            )
    
    def verify_manifest_hash(self, manifest: PlacementManifest) -> bool:
        """
        Verify manifest hash hasn't been tampered with.
        
        Args:
            manifest: Placement manifest to verify
            
        Returns:
            True if hash is valid
            
        Raises:
            PlacementExecutionError: If hash verification fails
        """
        # Reconstruct manifest data (same as candidate.py generation)
        manifest_data = {
            "manifestId": manifest.manifestId,
            "candidateId": manifest.candidateId,
            "decision": manifest.decision.value,
            "targetPath": manifest.targetPath,
            "blockFamily": manifest.blockFamily.value,
            "blockVersion": manifest.blockVersion,
            "requiredChanges": manifest.requiredChanges,
            "evidenceIds": manifest.evidenceIds,
            "createdAt": manifest.createdAt
        }
        
        # Compute hash (same algorithm as manifest generation)
        manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        
        if computed_hash != manifest.manifestHash:
            raise PlacementExecutionError(
                f"Manifest hash verification failed. "
                f"Expected: {manifest.manifestHash}, "
                f"Computed: {computed_hash}. "
                f"Manifest has been tampered with."
            )
        
        return True
    
    def execute_placement(
        self,
        manifest: PlacementManifest,
        approval_status: ApprovalStatus,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute approved placement manifest.
        
        Args:
            manifest: Placement manifest
            approval_status: Approval status for this manifest
            candidate_files: Candidate files to place
            
        Returns:
            Execution result with status, branch, commit, and evidence
            
        Raises:
            PlacementExecutionError: If placement fails or is not approved
        """
        # Safety: Verify approval
        if approval_status != ApprovalStatus.APPROVED:
            raise PlacementExecutionError(
                f"Cannot execute unapproved manifest. "
                f"Status: {approval_status}. "
                f"Approval required before placement execution."
            )
        
        # Safety: Verify manifest hash
        self.verify_manifest_hash(manifest)
        
        # Execute placement based on decision
        if manifest.decision == PlacementDecision.ADD:
            result = self._execute_add(manifest, candidate_files)
        elif manifest.decision == PlacementDecision.UPDATE:
            result = self._execute_update(manifest, candidate_files)
        elif manifest.decision == PlacementDecision.EXTEND:
            result = self._execute_extend(manifest, candidate_files)
        elif manifest.decision == PlacementDecision.REUSE:
            result = self._execute_reuse(manifest)
        elif manifest.decision == PlacementDecision.REJECT:
            raise PlacementExecutionError(
                f"Cannot execute REJECT decision. "
                f"Manifest {manifest.manifestId} was rejected."
            )
        else:
            raise PlacementExecutionError(
                f"Unknown placement decision: {manifest.decision}"
            )
        
        return result
    
    def _execute_add(
        self,
        manifest: PlacementManifest,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute ADD placement: create new block in repository.
        
        Args:
            manifest: Placement manifest
            candidate_files: Files to add
            
        Returns:
            Execution result
        """
        target_dir = self.repository_root / manifest.targetPath
        
        # Create target directory
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Write candidate files
        written_files = []
        for file in candidate_files:
            file_path = target_dir / file.filename
            file_path.write_text(file.content, encoding='utf-8')
            written_files.append(str(file_path.relative_to(self.repository_root)))
        
        # Create git branch
        branch_name = f"candidate/{manifest.candidateId}"
        commit_msg = f"feat: add {manifest.blockFamily.value} block {manifest.candidateId}"
        
        # Git operations (approved commands only)
        self._git_checkout_branch(branch_name)
        self._git_add_files(written_files)
        commit_hash = self._git_commit(commit_msg)
        
        return {
            "status": "executed",
            "action": "ADD",
            "targetPath": manifest.targetPath,
            "filesWritten": len(written_files),
            "branch": branch_name,
            "commit": commit_hash,
            "message": f"Created new {manifest.blockFamily.value} block at {manifest.targetPath}"
        }
    
    def _execute_update(
        self,
        manifest: PlacementManifest,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute UPDATE placement: update existing block.
        
        Args:
            manifest: Placement manifest
            candidate_files: Files to update
            
        Returns:
            Execution result
        """
        target_dir = self.repository_root / manifest.targetPath
        
        if not target_dir.exists():
            raise PlacementExecutionError(
                f"Cannot update non-existent path: {manifest.targetPath}"
            )
        
        # Update candidate files
        updated_files = []
        for file in candidate_files:
            file_path = target_dir / file.filename
            file_path.write_text(file.content, encoding='utf-8')
            updated_files.append(str(file_path.relative_to(self.repository_root)))
        
        # Create git branch
        branch_name = f"candidate/{manifest.candidateId}"
        commit_msg = f"feat: update {manifest.blockFamily.value} block at {manifest.targetPath}"
        
        # Git operations
        self._git_checkout_branch(branch_name)
        self._git_add_files(updated_files)
        commit_hash = self._git_commit(commit_msg)
        
        return {
            "status": "executed",
            "action": "UPDATE",
            "targetPath": manifest.targetPath,
            "filesUpdated": len(updated_files),
            "branch": branch_name,
            "commit": commit_hash,
            "message": f"Updated {manifest.blockFamily.value} block at {manifest.targetPath}"
        }
    
    def _execute_extend(
        self,
        manifest: PlacementManifest,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute EXTEND placement: add new variant to block family.
        
        Args:
            manifest: Placement manifest
            candidate_files: Files to add
            
        Returns:
            Execution result
        """
        # EXTEND is similar to ADD but in an existing family directory
        return self._execute_add(manifest, candidate_files)
    
    def _execute_reuse(self, manifest: PlacementManifest) -> Dict[str, Any]:
        """
        Execute REUSE placement: no changes needed.
        
        Args:
            manifest: Placement manifest
            
        Returns:
            Execution result
        """
        return {
            "status": "executed",
            "action": "REUSE",
            "targetPath": manifest.targetPath,
            "filesWritten": 0,
            "branch": None,
            "commit": None,
            "message": f"Reusing existing block at {manifest.targetPath}"
        }
    
    def _git_checkout_branch(self, branch_name: str) -> None:
        """
        Create and checkout a new git branch.
        
        Args:
            branch_name: Name of branch to create
            
        Raises:
            PlacementExecutionError: If git operation fails
        """
        try:
            # Check if branch exists
            result = subprocess.run(
                ['git', 'rev-parse', '--verify', branch_name],
                cwd=self.repository_root,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                # Branch exists, checkout
                subprocess.run(
                    ['git', 'checkout', branch_name],
                    cwd=self.repository_root,
                    check=True,
                    capture_output=True,
                    text=True
                )
            else:
                # Create new branch
                subprocess.run(
                    ['git', 'checkout', '-b', branch_name],
                    cwd=self.repository_root,
                    check=True,
                    capture_output=True,
                    text=True
                )
        except subprocess.CalledProcessError as e:
            raise PlacementExecutionError(
                f"Git checkout failed: {e.stderr}"
            )
    
    def _git_add_files(self, file_paths: List[str]) -> None:
        """
        Stage files for git commit.
        
        Args:
            file_paths: List of file paths to stage (relative to repo root)
            
        Raises:
            PlacementExecutionError: If git operation fails
        """
        try:
            subprocess.run(
                ['git', 'add'] + file_paths,
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            raise PlacementExecutionError(
                f"Git add failed: {e.stderr}"
            )
    
    def _git_commit(self, commit_message: str) -> str:
        """
        Commit staged changes.
        
        Args:
            commit_message: Commit message
            
        Returns:
            Commit hash
            
        Raises:
            PlacementExecutionError: If git operation fails
        """
        try:
            subprocess.run(
                ['git', 'commit', '-m', commit_message],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
            
            # Get commit hash
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
            
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            raise PlacementExecutionError(
                f"Git commit failed: {e.stderr}"
            )
    
    def trigger_discovery_refresh(self) -> Dict[str, Any]:
        """
        Trigger TypeScript discovery scan to refresh snapshot.
        
        Returns:
            Result of discovery refresh
            
        Raises:
            PlacementExecutionError: If discovery scan fails
        """
        try:
            result = subprocess.run(
                ['pnpm', '--filter', '@quiz/project-llm-discovery', 'scan'],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            return {
                "status": "success",
                "message": "Discovery scan completed",
                "output": result.stdout
            }
        except subprocess.CalledProcessError as e:
            raise PlacementExecutionError(
                f"Discovery refresh failed: {e.stderr}"
            )
        except subprocess.TimeoutExpired:
            raise PlacementExecutionError(
                "Discovery refresh timed out after 120 seconds"
            )
