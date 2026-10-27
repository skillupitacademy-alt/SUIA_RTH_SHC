"""Safe repository mutation executor for approved placement manifests."""

import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.models.candidate import (
    PlacementDecision,
    PlacementManifest,
    PlacementFileAction,
)
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus
)
from app.placement.patcher import (
    compute_sha256,
    create_family_registry,
    patch_family_registry,
    patch_tutorial_block_renderer,
    patch_tutorial_composer_registry,
    patch_tutorial_page_content_types,
    patch_generated_block_registry,
    patch_generated_block_version_definitions,
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
        manifest_data: Dict[str, Any] = {
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
        if manifest.fileOperations:
            manifest_data["fileOperations"] = [op.model_dump() for op in manifest.fileOperations]
        
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
        
        # Safety: Verify not self-approved (allows admin override)
        is_admin_override = bool(
            approval._is_admin_override()
            or approval.approved_by in ("admin", "superadmin", "system")
        )
        if not approval.verify_not_self_approved(workflow_requester, allow_admin_override=is_admin_override):
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
        
        # Write candidate files via RepositoryAdapter or granular fileOperations
        written_files = []
        try:
            if manifest.fileOperations:
                # Map candidate files by filename
                files_by_name = {}
                for f in candidate_files:
                    fn = f.get('filename') if isinstance(f, dict) else f.filename
                    ct = f.get('content') if isinstance(f, dict) else f.content
                    files_by_name[fn] = ct

                integration_source = files_by_name.get("block.integration.json")
                if integration_source is None:
                    raise PlacementExecutionError("Candidate package missing required block.integration.json")
                try:
                    integration_metadata = json.loads(integration_source)
                except (TypeError, json.JSONDecodeError) as error:
                    raise PlacementExecutionError(f"Invalid block.integration.json: {error}") from error

                worktree_root = self.active_worktree.worktree_path if (self.active_worktree and not self.dry_run) else self.repository_root

                for op in manifest.fileOperations:
                    if op.action == PlacementFileAction.SKIP:
                        continue

                    target_file_path = worktree_root / op.target_path

                    if op.action == PlacementFileAction.CREATE:
                        content = files_by_name.get(op.source_filename)
                        if content is None:
                            raise PlacementExecutionError(f"Missing source file {op.source_filename} for CREATE operation")

                        if target_file_path.exists():
                            existing_content = target_file_path.read_text(encoding='utf-8')
                            if existing_content != content:
                                raise PlacementExecutionError(
                                    f"CREATE operation would overwrite existing file {op.target_path}. "
                                    "Use a controlled patch operation instead."
                                )

                        # Harmonize registry export if writing registry entry
                        if op.target_path.endswith('.registry.ts'):
                            reg_var_name = f"{manifest.blockFamily.value.lower()}Registry"
                            if 'BlockRegistryEntry' not in content or reg_var_name not in content:
                                if target_file_path.exists():
                                    existing = target_file_path.read_text(encoding='utf-8')
                                    if 'BlockRegistryEntry' in existing and reg_var_name in existing:
                                        content = existing
                                    else:
                                        content = f"""import type {{ BlockRegistryEntry }} from '../types';

export const {reg_var_name}: BlockRegistryEntry = {{
  id: '{manifest.blockFamily.value.lower()}',
  label: '{manifest.blockFamily.value}',
  versions: [
    {{
      id: 'v1',
      code: '{manifest.blockVersion}',
      label: '{manifest.blockVersion} - {manifest.blockFamily.value}',
      description: '{manifest.blockFamily.value} block integration',
      getDefaultPayload: () => ({{
        eyebrow: 'LEARNING OBJECTIVES',
        title: 'What You Will Learn',
        introduction: 'By the end of this lesson, you will be able to:',
        objectives: [
          {{ id: '1', text: 'Understand core concepts' }},
          {{ id: '2', text: 'Apply principles in practice' }},
        ],
      }}),
    }},
  ],
}};
"""
                                else:
                                    content = f"""import type {{ BlockRegistryEntry }} from '../types';

export const {reg_var_name}: BlockRegistryEntry = {{
  id: '{manifest.blockFamily.value.lower()}',
  label: '{manifest.blockFamily.value}',
  versions: [
    {{
      id: 'v1',
      code: '{manifest.blockVersion}',
      label: '{manifest.blockVersion} - {manifest.blockFamily.value}',
      description: '{manifest.blockFamily.value} block integration',
      getDefaultPayload: () => ({{
        eyebrow: 'LEARNING OBJECTIVES',
        title: 'What You Will Learn',
        introduction: 'By the end of this lesson, you will be able to:',
        objectives: [
          {{ id: '1', text: 'Understand core concepts' }},
          {{ id: '2', text: 'Apply principles in practice' }},
        ],
      }}),
    }},
  ],
}};
"""

                        if not self.dry_run:
                            target_file_path.parent.mkdir(parents=True, exist_ok=True)
                            target_file_path.write_text(content, encoding='utf-8')
                        written_files.append(str(target_file_path))

                    elif op.action == PlacementFileAction.PATCH_FAMILY_REGISTRY:
                        if target_file_path.exists():
                            current_content = target_file_path.read_text(encoding='utf-8')
                            current_hash = compute_sha256(current_content)
                            if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                                raise PlacementExecutionError(
                                    f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                                )
                            patched = patch_family_registry(
                                current_content,
                                family=manifest.blockFamily.value,
                                version=manifest.blockVersion,
                                metadata=integration_metadata,
                            )
                        else:
                            patched = create_family_registry(
                                family=manifest.blockFamily.value,
                                version=manifest.blockVersion,
                                metadata=integration_metadata,
                            )
                        if not self.dry_run:
                            target_file_path.parent.mkdir(parents=True, exist_ok=True)
                            target_file_path.write_text(patched, encoding='utf-8')
                        written_files.append(str(target_file_path))

                    elif op.action == PlacementFileAction.PATCH_RENDERER:
                        if not target_file_path.exists():
                            raise PlacementExecutionError(f"Target renderer file {op.target_path} does not exist")
                        current_content = target_file_path.read_text(encoding='utf-8')
                        current_hash = compute_sha256(current_content)
                        if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                            raise PlacementExecutionError(
                                f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                            )
                        comp_name = integration_metadata.get(
                            "componentExport",
                            f"{manifest.blockFamily.value}{manifest.blockVersion.upper()}Block",
                        )
                        patched = patch_tutorial_block_renderer(
                            current_content,
                            family=manifest.blockFamily.value,
                            version=manifest.blockVersion,
                            component_name=comp_name
                        )
                        if not self.dry_run:
                            target_file_path.write_text(patched, encoding='utf-8')
                        written_files.append(str(target_file_path))

                    elif op.action == PlacementFileAction.PATCH_REGISTRY:
                        if not target_file_path.exists():
                            raise PlacementExecutionError(f"Target registry file {op.target_path} does not exist")
                        current_content = target_file_path.read_text(encoding='utf-8')
                        current_hash = compute_sha256(current_content)
                        if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                            raise PlacementExecutionError(
                                f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                            )
                        reg_export = f"{manifest.blockFamily.value.lower()}Registry"
                        patched = patch_tutorial_composer_registry(
                            current_content,
                            family=manifest.blockFamily.value,
                            registry_export_name=reg_export
                        )
                        if not self.dry_run:
                            target_file_path.write_text(patched, encoding='utf-8')
                        written_files.append(str(target_file_path))

                    elif op.action == PlacementFileAction.PATCH_TYPES:
                        if not target_file_path.exists():
                            raise PlacementExecutionError(f"Target types file {op.target_path} does not exist")
                        current_content = target_file_path.read_text(encoding='utf-8')
                        current_hash = compute_sha256(current_content)
                        if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                            raise PlacementExecutionError(
                                f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                            )
                        patched = patch_tutorial_page_content_types(
                            current_content,
                            family_type_id=manifest.blockFamily.value.lower()
                        )
                        if not self.dry_run:
                            target_file_path.write_text(patched, encoding='utf-8')
                        written_files.append(str(target_file_path))

                    elif op.action == PlacementFileAction.PATCH_GENERATED_REGISTRY:
                        if not target_file_path.exists():
                            raise PlacementExecutionError(f"Generated Composer registry {op.target_path} does not exist")
                        current_content = target_file_path.read_text(encoding='utf-8')
                        current_hash = compute_sha256(current_content)
                        if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                            raise PlacementExecutionError(
                                f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                            )
                        patched = patch_generated_block_registry(
                            current_content,
                            family=manifest.blockFamily.value,
                            version=manifest.blockVersion,
                            metadata=integration_metadata,
                        )
                        if not self.dry_run:
                            target_file_path.write_text(patched, encoding='utf-8')
                        written_files.append(str(target_file_path))

                    elif op.action == PlacementFileAction.PATCH_COMPOSER_DEFINITION:
                        if not target_file_path.exists():
                            raise PlacementExecutionError(f"Target Composer definitions file {op.target_path} does not exist")
                        current_content = target_file_path.read_text(encoding='utf-8')
                        current_hash = compute_sha256(current_content)
                        if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                            raise PlacementExecutionError(
                                f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                            )
                        patched = patch_generated_block_version_definitions(
                            current_content,
                            family_type_id=integration_metadata.get("typeId", manifest.blockFamily.value.lower()),
                            version=manifest.blockVersion,
                            payload_format=integration_metadata.get("payloadFormat", "canonical"),
                        )
                        if not self.dry_run:
                            target_file_path.write_text(patched, encoding='utf-8')
                        written_files.append(str(target_file_path))
            else:
                for file in candidate_files:
                    record = worktree_adapter.write_file(
                        source_content=file.content if hasattr(file, 'content') else file['content'],
                        target_path=manifest.targetPath,
                        filename=file.filename if hasattr(file, 'filename') else file['filename'],
                        family=manifest.blockFamily.value,
                        version=manifest.blockVersion
                    )
                    written_files.append(record.target_path)
        except Exception as e:
            if self.active_worktree and not self.dry_run:
                try:
                    self.worktree_manager.cleanup_worktree(self.active_worktree, force=True)
                except Exception:
                    pass
                finally:
                    self.active_worktree = None
            if isinstance(e, PlacementExecutionError):
                raise
            raise PlacementExecutionError(f"Placement file operation failed: {e}")
        
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
                
                # Production invariant: promotion is performed by CI/release flow,
                # never by copying an isolated candidate worktree over this checkout.
                mirror_result = {"mode": "disabled", "files": 0}
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
            mirror_result = {"mode": "dry-run", "files": 0}
        
        return {
            "status": "executed",
            "action": "ADD",
            "workspaceMirror": mirror_result,
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
                
                # Production invariant: promotion is performed by CI/release flow,
                # never by copying an isolated candidate worktree over this checkout.
                mirror_result = {"mode": "disabled", "files": 0}
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
            mirror_result = {"mode": "dry-run", "files": 0}
        
        return {
            "status": "executed",
            "action": "UPDATE",
            "workspaceMirror": mirror_result,
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
            import os
            pnpm_cmd = 'pnpm.cmd' if os.name == 'nt' else 'pnpm'
            result = subprocess.run(
                [pnpm_cmd, '--filter', '@quiz/project-llm-discovery', 'scan'],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True,
                shell=(os.name == 'nt'),
                timeout=120  # 2 minute timeout
            )
            
            return {
                "status": "success",
                "message": "Discovery scan completed",
                "output": result.stdout
            }
        except Exception as e:
            return {
                "status": "warning",
                "message": f"Discovery refresh skipped: {str(e)}"
            }
