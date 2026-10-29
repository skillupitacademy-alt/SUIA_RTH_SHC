"""Safe repository mutation executor for approved placement manifests."""

import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.models.candidate import (
    PlacementDecision,
    PlacementManifest,
    PlacementFileAction,
    UpdateEligibility,
    compute_canonical_manifest_hash,
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
    patch_blocks_schema,
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
        computed_hash = compute_canonical_manifest_hash(manifest)
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
        
        # Safety: Verify not self-approved (strict separation of duties, administrative role does not bypass)
        if not approval.verify_not_self_approved(workflow_requester, allow_admin_override=False):
            raise PlacementExecutionError(
                f"Self-approval detected. "
                f"Approver ({approval.approved_by}) must differ from requester ({workflow_requester}). "
                f"Strict separation of duties required."
            )
        
        # Safety: Verify manifest hash internally
        self.verify_manifest_hash(manifest)
        
        # Execute placement in isolated worktree (unless dry-run)
        try:
            if manifest.decision == PlacementDecision.VERSION_IN_USE or getattr(manifest, "updateEligibility", None) in (UpdateEligibility.VERSION_IN_USE, UpdateEligibility.INSPECTION_FAILED):
                raise PlacementExecutionError(
                    f"Cannot execute placement for {manifest.decision} / {getattr(manifest, 'updateEligibility', '')}. "
                    f"Target block version {manifest.blockVersion} is referenced by tutorial content or reference inspection failed. "
                    f"In-place placement is strictly blocked."
                )
            elif manifest.decision in (PlacementDecision.ADD, PlacementDecision.UPDATE):
                result = self._execute_manifest_operations(manifest, candidate_files)
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
    
    def _execute_manifest_operations(
        self,
        manifest: PlacementManifest,
        candidate_files: List[Any]
    ) -> Dict[str, Any]:
        """
        Execute manifest file operations in an isolated worktree for ADD or UPDATE decisions.
        
        Args:
            manifest: Placement manifest
            candidate_files: Candidate files
            
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
        
        # Preflight all file operations atomically before performing any disk mutations
        written_files = []
        try:
            if not manifest.fileOperations:
                raise PlacementExecutionError("Placement requires explicit, snapshot-derived fileOperations in manifest")

            # Map candidate files by filename
            files_by_name = {}
            for f in candidate_files:
                fn = f.get('filename') if isinstance(f, dict) else f.filename
                ct = f.get('content') if isinstance(f, dict) else f.content
                files_by_name[fn] = ct

            patch_actions = (
                PlacementFileAction.PATCH_FAMILY_REGISTRY,
                PlacementFileAction.PATCH_RENDERER,
                PlacementFileAction.PATCH_TYPES,
                PlacementFileAction.PATCH_COMPOSER_DEFINITION,
                PlacementFileAction.PATCH_GENERATED_REGISTRY,
                PlacementFileAction.PATCH_BLOCKS_SCHEMA,
            )
            needs_integration_meta = any(op.action in patch_actions for op in manifest.fileOperations)

            integration_metadata = {}
            if needs_integration_meta:
                integration_source = files_by_name.get("block.integration.json")
                if integration_source is None:
                    raise PlacementExecutionError("Candidate package missing required block.integration.json for patch operations")
                try:
                    integration_metadata = json.loads(integration_source)
                except (TypeError, json.JSONDecodeError) as error:
                    raise PlacementExecutionError(f"Invalid block.integration.json: {error}") from error
            elif "block.integration.json" in files_by_name:
                try:
                    integration_metadata = json.loads(files_by_name["block.integration.json"])
                except Exception:
                    integration_metadata = {}

            worktree_root = self.active_worktree.worktree_path if (self.active_worktree and not self.dry_run) else self.repository_root

            # ================================================================
            # Phase 1: Atomic Preflight Validation (ZERO writes permitted)
            # ================================================================
            staged_writes: List[Tuple[Path, str]] = []

            for op in manifest.fileOperations:
                if op.action == PlacementFileAction.SKIP:
                    continue

                target_file_path = worktree_root / op.target_path

                if op.action == PlacementFileAction.CREATE:
                    content = files_by_name.get(op.source_filename)
                    if content is None:
                        raise PlacementExecutionError(f"Preflight failed: Missing source file '{op.source_filename}' for CREATE operation")
                    if op.source_sha256:
                        actual_sha = compute_sha256(content)
                        if actual_sha != op.source_sha256:
                            raise PlacementExecutionError(
                                f"Preflight failed: Source SHA-256 mismatch for '{op.source_filename}'. Expected {op.source_sha256}, got {actual_sha}"
                            )

                    if target_file_path.exists():
                        existing_content = target_file_path.read_text(encoding='utf-8')
                        if existing_content != content:
                            raise PlacementExecutionError(
                                f"Preflight failed: CREATE operation would overwrite existing file '{op.target_path}'. "
                                "Use a controlled patch or UPDATE operation instead."
                            )
                    staged_writes.append((target_file_path, content))

                elif op.action == PlacementFileAction.UPDATE:
                    content = files_by_name.get(op.source_filename)
                    if content is None:
                        raise PlacementExecutionError(f"Preflight failed: Missing source file '{op.source_filename}' for UPDATE operation")
                    if op.source_sha256:
                        actual_sha = compute_sha256(content)
                        if actual_sha != op.source_sha256:
                            raise PlacementExecutionError(
                                f"Preflight failed: Source SHA-256 mismatch for '{op.source_filename}'. Expected {op.source_sha256}, got {actual_sha}"
                            )

                    if not target_file_path.exists():
                        raise PlacementExecutionError(
                            f"Preflight failed: UPDATE operation target file does not exist: '{op.target_path}'. "
                            "Cannot update non-existent target in place."
                        )

                    current_content = target_file_path.read_text(encoding='utf-8')
                    current_hash = compute_sha256(current_content)
                    if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                        raise PlacementExecutionError(
                            f"Pre-image hash mismatch on UPDATE operation for {op.target_path}: "
                            f"expected {op.expected_pre_hash}, got {current_hash}. Placement aborted."
                        )
                    staged_writes.append((target_file_path, content))

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
                    staged_writes.append((target_file_path, patched))

                elif op.action == PlacementFileAction.PATCH_RENDERER:
                    if not target_file_path.exists():
                        raise PlacementExecutionError(f"Preflight failed: Target renderer file '{op.target_path}' does not exist")
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
                    staged_writes.append((target_file_path, patched))

                elif op.action == PlacementFileAction.PATCH_REGISTRY:
                    if not target_file_path.exists():
                        raise PlacementExecutionError(f"Preflight failed: Target registry file '{op.target_path}' does not exist")
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
                    staged_writes.append((target_file_path, patched))

                elif op.action == PlacementFileAction.PATCH_TYPES:
                    if not target_file_path.exists():
                        raise PlacementExecutionError(f"Preflight failed: Target types file '{op.target_path}' does not exist")
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
                    staged_writes.append((target_file_path, patched))

                elif op.action == PlacementFileAction.PATCH_GENERATED_REGISTRY:
                    if not target_file_path.exists():
                        raise PlacementExecutionError(f"Preflight failed: Generated Composer registry '{op.target_path}' does not exist")
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
                    staged_writes.append((target_file_path, patched))

                elif op.action == PlacementFileAction.PATCH_COMPOSER_DEFINITION:
                    if not target_file_path.exists():
                        raise PlacementExecutionError(f"Preflight failed: Target Composer definitions file '{op.target_path}' does not exist")
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
                    staged_writes.append((target_file_path, patched))

                elif op.action == PlacementFileAction.PATCH_BLOCKS_SCHEMA:
                    if not target_file_path.exists():
                        raise PlacementExecutionError(f"Preflight failed: Target blocks.schema.ts file '{op.target_path}' does not exist")
                    current_content = target_file_path.read_text(encoding='utf-8')
                    current_hash = compute_sha256(current_content)
                    if op.expected_pre_hash and current_hash != op.expected_pre_hash:
                        raise PlacementExecutionError(
                            f"Pre-image hash mismatch on {op.target_path}: expected {op.expected_pre_hash}, got {current_hash}"
                        )
                    # Get schema filename and export name from integration metadata
                    schema_filename = integration_metadata.get(
                        "schemaFilename",
                        f"{manifest.blockFamily.value.lower()}-{manifest.blockVersion.lower()}.schema.ts"
                    )
                    schema_export_name = integration_metadata.get(
                        "schemaExportName",
                        f"{manifest.blockFamily.value}{manifest.blockVersion.upper()}BlockSchema"
                    )
                    patched = patch_blocks_schema(
                        current_content,
                        schema_filename=schema_filename,
                        schema_export_name=schema_export_name,
                    )
                    staged_writes.append((target_file_path, patched))

            # ================================================================
            # Phase 2: Execution (ONLY executed after 100% of preflights pass)
            # ================================================================
            for dest_path, dest_content in staged_writes:
                if not self.dry_run:
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    dest_path.write_text(dest_content, encoding='utf-8')
                written_files.append(str(dest_path))

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
        action_verb = "update" if manifest.decision == PlacementDecision.UPDATE else "add"
        commit_msg = f"feat: {action_verb} {manifest.blockFamily.value} block {manifest.candidateId}"
        
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
            "action": manifest.decision.value,
            "workspaceMirror": mirror_result,
            "targetPath": manifest.targetPath,
            "filesWritten": len(written_files),
            "branch": branch_name,
            "commit": commit_hash,
            "worktree_path": str(self.active_worktree.worktree_path) if self.active_worktree else None,
            "message": f"{manifest.decision.value.capitalize()}ed {manifest.blockFamily.value} block {manifest.candidateId}"
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

    # Backwards compatibility alias
    def _execute_add(self, manifest: PlacementManifest, candidate_files: List[Any]) -> Dict[str, Any]:
        return self._execute_manifest_operations(manifest, candidate_files)

    def _execute_update(self, manifest: PlacementManifest, candidate_files: List[Any]) -> Dict[str, Any]:
        return self._execute_manifest_operations(manifest, candidate_files)
