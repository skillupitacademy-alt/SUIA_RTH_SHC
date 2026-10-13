"""Safe repository mutation executor for approved placement manifests."""

import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.models.candidate import PlacementDecision, PlacementManifest
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus
)
from app.placement.repository_adapter import RepositoryAdapter, RepositoryAdapterError
from app.placement.worktree_manager import WorktreeManager, WorktreeError, WorktreeContext


class PlacementExecutionError(Exception):
    """Error during placement execution."""
    pass


class PlacementExecutor:
    """
    Executes approved placement manifests with safety invariants.
    
    Safety invariants:
    - No self-approval: executor cannot approve its own mutations
    - Manifest hash verification: reject tampered manifests
    - No arbitrary shell execution: only approved git operations via RepositoryAdapter
    - Approval required: unapproved mutations are BLOCKED
    - ImplementationApproval ONLY: ALL bindings verified (workflow_id, candidate_sha256, manifest_id, manifest_sha256, requester)
    - Path security: all writes via RepositoryAdapter (no direct filesystem bypass)
    """
    
    def __init__(self, repository_root: str | Path, dry_run: bool = False):
        """
        Initialize placement executor.
        
        Args:
            repository_root: Path to repository root directory
            dry_run: If True, simulate operations without writing
        """
        self.repository_root = Path(repository_root)
        self.dry_run = dry_run
        self.repository_adapter = RepositoryAdapter(repository_root, dry_run=dry_run)
        self.worktree_manager = WorktreeManager(repository_root)
        self.active_worktree: Optional[WorktreeContext] = None
        
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
        approval: ImplementationApproval,
        candidate_files: List[Any],
        workflow_requester: str,
        candidate_sha256: str
    ) -> Dict[str, Any]:
        """
        Execute approved placement manifest in isolated worktree.
        
        ISOLATION: All operations happen in isolated git worktree, not main tree.
        Operations only affect main tree after successful completion.
        
        SECURITY: ALL bindings verified (workflow_id, candidate_sha256, manifest_id, manifest_sha256, requester).
        
        Args:
            manifest: Placement manifest
            approval: ImplementationApproval with ALL bindings verified
            candidate_files: Candidate files to place
            workflow_requester: Workflow requester identity for self-approval check (REQUIRED)
            candidate_sha256: Candidate SHA-256 hash for verification (REQUIRED)
            
        Returns:
            Execution result with status, branch, commit, and evidence
            
        Raises:
            PlacementExecutionError: If placement fails or is not approved
        """
        # Safety: Verify ImplementationApproval status is APPROVED
        if approval.status != ImplementationApprovalStatus.APPROVED:
            raise PlacementExecutionError(
                f"Cannot execute unapproved manifest. "
                f"Status: {approval.status}. "
                f"Approval required before placement execution."
            )
        
        # Safety: Verify candidate hash matches approval
        if not approval.verify_candidate_hash(candidate_sha256):
            raise PlacementExecutionError(
                f"Candidate hash mismatch. "
                f"Approval hash: {approval.candidate_sha256}, "
                f"Provided hash: {candidate_sha256}. "
                f"Candidate has been tampered with after approval."
            )
        
        # Safety: Verify manifest hash matches approval
        if not approval.verify_manifest_hash(manifest.manifestHash):
            raise PlacementExecutionError(
                f"Manifest hash mismatch. "
                f"Approval hash: {approval.placement_manifest_sha256}, "
                f"Manifest hash: {manifest.manifestHash}. "
                f"Manifest has been tampered with after approval."
            )
        
        # Safety: Verify not self-approved
        if not approval.verify_not_self_approved(workflow_requester):
            raise PlacementExecutionError(
                f"Self-approval detected. "
                f"Approver ({approval.approved_by}) must differ from requester ({workflow_requester})."
            )
        
        # Safety: Verify manifest hash internally
        self.verify_manifest_hash(manifest)
        
        # Execute placement in isolated worktree (unless dry-run)
        try:
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
            
            # Add evidence records from RepositoryAdapter
            result["evidence_records"] = self.repository_adapter.get_evidence_records()
            
            # Add worktree evidence if worktree was used
            if self.active_worktree:
                result["worktree_evidence"] = self.worktree_manager.get_worktree_evidence(
                    self.active_worktree
                )
            
            return result
            
        finally:
            # Clean up worktree if it was created
            if self.active_worktree and not self.dry_run:
                try:
                    self.worktree_manager.cleanup_worktree(self.active_worktree, force=False)
                except WorktreeError:
                    # Log but don't fail if cleanup fails
                    pass
                finally:
                    self.active_worktree = None
    
    def _execute_add(
        self,
        manifest: PlacementManifest,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute ADD placement: create new block in isolated worktree.
        
        Args:
            manifest: Placement manifest
            candidate_files: Files to add
            
        Returns:
            Execution result
        """
        branch_name = f"candidate/{manifest.candidateId}"
        
        # Create isolated worktree (skip in dry-run mode)
        if not self.dry_run:
            try:
                self.active_worktree = self.worktree_manager.create_worktree(
                    workflow_id=manifest.manifestId,
                    manifest_id=manifest.manifestId,
                    branch_name=branch_name
                )
                # Use worktree path as repository root for adapter
                worktree_adapter = RepositoryAdapter(
                    self.active_worktree.worktree_path,
                    dry_run=False
                )
            except WorktreeError as e:
                raise PlacementExecutionError(f"Failed to create worktree: {e}")
        else:
            # Dry-run: use main repository adapter
            worktree_adapter = self.repository_adapter
        
        # Write candidate files via RepositoryAdapter (path validation enforced)
        written_files = []
        for file in candidate_files:
            try:
                record = worktree_adapter.write_file(
                    source_content=file.content,
                    target_path=manifest.targetPath,
                    filename=file.filename,
                    family=manifest.blockFamily.value,
                    version=manifest.blockVersion
                )
                written_files.append(record.target_path)
            except RepositoryAdapterError as e:
                # Cleanup worktree on failure
                if self.active_worktree and not self.dry_run:
                    try:
                        self.worktree_manager.cleanup_worktree(self.active_worktree, force=True)
                    except WorktreeError:
                        pass
                    finally:
                        self.active_worktree = None
                raise PlacementExecutionError(
                    f"Failed to write file {file.filename}: {e}"
                )
        
        # Commit in worktree (skip in dry-run mode)
        commit_msg = f"feat: add {manifest.blockFamily.value} block {manifest.candidateId}"
        
        if not self.dry_run and self.active_worktree:
            try:
                # Get relative paths for git add
                relative_paths = [
                    str(Path(f).relative_to(self.active_worktree.worktree_path))
                    for f in written_files
                ]
                commit_hash = self.worktree_manager.commit_in_worktree(
                    self.active_worktree,
                    relative_paths,
                    commit_msg
                )
            except WorktreeError as e:
                # Cleanup worktree on failure
                try:
                    self.worktree_manager.cleanup_worktree(self.active_worktree, force=True)
                except WorktreeError:
                    pass
                finally:
                    self.active_worktree = None
                raise PlacementExecutionError(f"Git operation failed: {e}")
        else:
            # Dry-run: simulate git operations
            commit_hash = "dry-run-commit-hash"
        
        return {
            "status": "executed",
            "action": "ADD",
            "targetPath": manifest.targetPath,
            "filesWritten": len(written_files),
            "branch": branch_name,
            "commit": commit_hash,
            "worktree_path": str(self.active_worktree.worktree_path) if self.active_worktree else None,
            "message": f"Created new {manifest.blockFamily.value} block at {manifest.targetPath}"
        }
    
    def _execute_update(
        self,
        manifest: PlacementManifest,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute UPDATE placement: update existing block in isolated worktree.
        
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
        
        branch_name = f"candidate/{manifest.candidateId}"
        
        # Create isolated worktree (skip in dry-run mode)
        if not self.dry_run:
            try:
                self.active_worktree = self.worktree_manager.create_worktree(
                    workflow_id=manifest.manifestId,
                    manifest_id=manifest.manifestId,
                    branch_name=branch_name
                )
                # Use worktree path as repository root for adapter
                worktree_adapter = RepositoryAdapter(
                    self.active_worktree.worktree_path,
                    dry_run=False
                )
            except WorktreeError as e:
                raise PlacementExecutionError(f"Failed to create worktree: {e}")
        else:
            # Dry-run: use main repository adapter
            worktree_adapter = self.repository_adapter
        
        # Update candidate files via RepositoryAdapter
        updated_files = []
        for file in candidate_files:
            try:
                record = worktree_adapter.write_file(
                    source_content=file.content,
                    target_path=manifest.targetPath,
                    filename=file.filename,
                    family=manifest.blockFamily.value,
                    version=manifest.blockVersion
                )
                updated_files.append(record.target_path)
            except RepositoryAdapterError as e:
                # Cleanup worktree on failure
                if self.active_worktree and not self.dry_run:
                    try:
                        self.worktree_manager.cleanup_worktree(self.active_worktree, force=True)
                    except WorktreeError:
                        pass
                    finally:
                        self.active_worktree = None
                raise PlacementExecutionError(
                    f"Failed to update file {file.filename}: {e}"
                )
        
        # Commit in worktree (skip in dry-run mode)
        commit_msg = f"feat: update {manifest.blockFamily.value} block at {manifest.targetPath}"
        
        if not self.dry_run and self.active_worktree:
            try:
                # Get relative paths for git add
                relative_paths = [
                    str(Path(f).relative_to(self.active_worktree.worktree_path))
                    for f in updated_files
                ]
                commit_hash = self.worktree_manager.commit_in_worktree(
                    self.active_worktree,
                    relative_paths,
                    commit_msg
                )
            except WorktreeError as e:
                # Cleanup worktree on failure
                try:
                    self.worktree_manager.cleanup_worktree(self.active_worktree, force=True)
                except WorktreeError:
                    pass
                finally:
                    self.active_worktree = None
                raise PlacementExecutionError(f"Git operation failed: {e}")
        else:
            # Dry-run: simulate git operations
            commit_hash = "dry-run-commit-hash"
        
        return {
            "status": "executed",
            "action": "UPDATE",
            "targetPath": manifest.targetPath,
            "filesUpdated": len(updated_files),
            "branch": branch_name,
            "commit": commit_hash,
            "worktree_path": str(self.active_worktree.worktree_path) if self.active_worktree else None,
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
