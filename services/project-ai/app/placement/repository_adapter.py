"""
Repository Adapter - M2.9 Wave 5

Abstraction interface for ALL repository mutations with security invariants.

SECURITY BOUNDARIES:
- Path traversal prevention: reject '../', absolute paths, paths outside workspace
- Allowlist enforcement: only permitted target directories
- File extension validation: only approved extensions (.ts, .tsx, .json, .css, .md)
- Target family/version validation: must match canonical M2.9 targets
- Dry-run capability: simulate without writing
- Rollback information: record pre-mutation state
- Evidence production: machine-readable operation records

ARCHITECTURAL CONSTRAINTS:
- No direct filesystem writes bypass this adapter
- All mutations go through validated interface
- Git operations isolated to approved commands only
- Path resolution always relative to workspace root
"""

import hashlib
import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class RepositoryAdapterError(Exception):
    """Error during repository operations."""
    pass


class PathValidationError(RepositoryAdapterError):
    """Path validation failure."""
    pass


class OperationRecord:
    """Machine-readable operation record for evidence."""
    
    def __init__(
        self,
        operation: str,
        source_path: str,
        target_path: str,
        status: str,
        timestamp: str,
        evidence_id: str
    ):
        self.operation = operation
        self.source_path = source_path
        self.target_path = target_path
        self.status = status
        self.timestamp = timestamp
        self.evidence_id = evidence_id
        self.file_hash: Optional[str] = None
        self.rollback_info: Dict[str, Any] = {}
        self.diff: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "operation": self.operation,
            "source_path": self.source_path,
            "target_path": self.target_path,
            "status": self.status,
            "timestamp": self.timestamp,
            "evidence_id": self.evidence_id,
            "file_hash": self.file_hash,
            "rollback_info": self.rollback_info,
            "diff": self.diff,
        }


class RepositoryAdapter:
    """
    Safe repository mutation interface with path validation and evidence production.
    
    Security invariants:
    - No path traversal: reject '../', absolute paths, paths outside workspace
    - Allowlist enforcement: only permitted target directories
    - File extension validation: only approved extensions
    - Target validation: verify against canonical M2.9 targets
    - Dry-run capability: simulate without writing
    - Evidence production: every operation produces machine-readable record
    """
    
    # Allowlist: only these target directories are permitted
    ALLOWED_TARGET_DIRS = [
        "packages/ui/src/tutorial/blocks/",
        "packages/ui/src/tutorial/schemas/",
        "packages/ui/src/tutorial/types/",
        "packages/ui/src/tutorial/utils/",
        "packages/shared/src/tutorial/",
    ]
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = [".ts", ".tsx", ".json", ".css", ".md"]
    
    # Canonical M2.9 target families and versions
    CANONICAL_TARGETS = {
        "Introduction": ["I1", "I2", "I3", "I4", "I5", "I6", "I7"],
        "Tutorial": ["T1", "T2", "T3", "T4", "T5"],
        "Assessment": ["A1", "Q1"],
        "Media": ["M1"],
        "Summary": ["S1"],
        "Custom": ["C1"],
    }
    
    def __init__(self, repository_root: str | Path, dry_run: bool = False):
        """
        Initialize repository adapter.
        
        Args:
            repository_root: Path to repository root directory
            dry_run: If True, simulate operations without writing
        """
        self.repository_root = Path(repository_root).resolve()
        self.dry_run = dry_run
        self.operation_records: List[OperationRecord] = []
        
        if not self.repository_root.exists():
            raise RepositoryAdapterError(
                f"Repository root does not exist: {repository_root}"
            )
    
    def validate_path(self, target_path: str) -> Path:
        """
        Validate target path against security constraints.
        
        Args:
            target_path: Target path to validate (relative to repo root)
            
        Returns:
            Resolved Path object if valid
            
        Raises:
            PathValidationError: If path violates security constraints
        """
        # Reject absolute paths
        if Path(target_path).is_absolute():
            raise PathValidationError(
                f"Absolute paths are not allowed: {target_path}"
            )
        
        # Reject path traversal attempts
        if ".." in target_path or target_path.startswith("/"):
            raise PathValidationError(
                f"Path traversal detected: {target_path}"
            )
        
        # Resolve path relative to repository root
        resolved_path = (self.repository_root / target_path).resolve()
        
        # Ensure resolved path is within repository root
        try:
            resolved_path.relative_to(self.repository_root)
        except ValueError:
            raise PathValidationError(
                f"Path resolves outside workspace: {target_path} -> {resolved_path}"
            )
        
        # Check allowlist
        path_normalized = target_path.replace("\\", "/")
        if not path_normalized.endswith("/"):
            # For file paths, check parent directory
            parent_dir = str(Path(path_normalized).parent) + "/"
            parent_dir = parent_dir.replace("\\", "/")
            allowed = any(
                parent_dir.startswith(allowed_dir)
                for allowed_dir in self.ALLOWED_TARGET_DIRS
            )
        else:
            allowed = any(
                path_normalized.startswith(allowed_dir)
                for allowed_dir in self.ALLOWED_TARGET_DIRS
            )
        
        if not allowed:
            raise PathValidationError(
                f"Path not in allowlist: {target_path}. "
                f"Allowed directories: {', '.join(self.ALLOWED_TARGET_DIRS)}"
            )
        
        return resolved_path
    
    def validate_file_extension(self, filename: str) -> None:
        """
        Validate file extension against allowed list.
        
        Args:
            filename: Filename to validate
            
        Raises:
            PathValidationError: If extension is not allowed
        """
        ext = Path(filename).suffix.lower()
        
        if ext not in self.ALLOWED_EXTENSIONS:
            raise PathValidationError(
                f"File extension not allowed: {ext}. "
                f"Allowed extensions: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
    
    def validate_target(self, family: str, version: str) -> None:
        """
        Validate target family/version against canonical M2.9 targets.
        
        Args:
            family: Block family (e.g., "Introduction")
            version: Block version (e.g., "I7")
            
        Raises:
            RepositoryAdapterError: If target is invalid
        """
        if family not in self.CANONICAL_TARGETS:
            raise RepositoryAdapterError(
                f"Unknown block family: {family}. "
                f"Canonical families: {', '.join(self.CANONICAL_TARGETS.keys())}"
            )
        
        if version not in self.CANONICAL_TARGETS[family]:
            raise RepositoryAdapterError(
                f"Invalid version {version} for family {family}. "
                f"Canonical versions: {', '.join(self.CANONICAL_TARGETS[family])}"
            )
    
    def compute_file_hash(self, content: str) -> str:
        """
        Compute SHA-256 hash of file content.
        
        Args:
            content: File content
            
        Returns:
            SHA-256 hash hex string
        """
        return hashlib.sha256(content.encode("utf-8")).hexdigest()
    
    def capture_rollback_info(self, target_path: Path) -> Dict[str, Any]:
        """
        Capture rollback information for a file before mutation.
        
        Args:
            target_path: Path to file
            
        Returns:
            Rollback information dictionary
        """
        if not target_path.exists():
            return {
                "exists": False,
                "action": "delete_on_rollback"
            }
        
        content = target_path.read_text(encoding="utf-8")
        file_hash = self.compute_file_hash(content)
        
        return {
            "exists": True,
            "action": "restore_on_rollback",
            "content_backup": content,
            "hash": file_hash,
            "modified_time": target_path.stat().st_mtime,
        }
    
    def generate_diff(self, old_content: Optional[str], new_content: str) -> str:
        """
        Generate diff between old and new content.
        
        Args:
            old_content: Old file content (None if new file)
            new_content: New file content
            
        Returns:
            Diff string
        """
        if old_content is None:
            return f"NEW FILE: {len(new_content)} bytes"
        
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)
        
        import difflib
        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            lineterm="",
            fromfile="before",
            tofile="after"
        )
        
        return "".join(diff)
    
    def write_file(
        self,
        source_content: str,
        target_path: str,
        filename: str,
        family: str,
        version: str
    ) -> OperationRecord:
        """
        Write file to repository with validation.
        
        Args:
            source_content: File content to write
            target_path: Target path (relative to repo root)
            filename: Filename
            family: Block family
            version: Block version
            
        Returns:
            OperationRecord for this operation
            
        Raises:
            PathValidationError: If path or extension validation fails
            RepositoryAdapterError: If target validation fails
        """
        # Validate all constraints
        self.validate_file_extension(filename)
        self.validate_target(family, version)
        
        full_target_path = f"{target_path}/{filename}" if not target_path.endswith(filename) else target_path
        validated_path = self.validate_path(full_target_path)
        
        # Create evidence ID
        timestamp = datetime.now(timezone.utc).isoformat()
        evidence_id = f"ev-write-{self.compute_file_hash(source_content)[:8]}-{int(datetime.now(timezone.utc).timestamp())}"
        
        # Capture rollback info
        rollback_info = self.capture_rollback_info(validated_path)
        
        # Generate diff
        old_content = rollback_info.get("content_backup") if rollback_info.get("exists") else None
        diff = self.generate_diff(old_content, source_content)
        
        # Create operation record
        operation = "UPDATE" if rollback_info.get("exists") else "ADD"
        record = OperationRecord(
            operation=operation,
            source_path=f"candidate/{filename}",
            target_path=full_target_path,
            status="DRY_RUN" if self.dry_run else "PENDING",
            timestamp=timestamp,
            evidence_id=evidence_id
        )
        record.file_hash = self.compute_file_hash(source_content)
        record.rollback_info = rollback_info
        record.diff = diff
        
        # Execute write (if not dry-run)
        if not self.dry_run:
            try:
                # Ensure parent directory exists
                validated_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Write file
                validated_path.write_text(source_content, encoding="utf-8")
                
                record.status = "SUCCESS"
            except Exception as e:
                record.status = "FAILED"
                raise RepositoryAdapterError(
                    f"Failed to write file {full_target_path}: {e}"
                )
        
        self.operation_records.append(record)
        return record
    
    def delete_file(self, target_path: str) -> OperationRecord:
        """
        Delete file from repository with validation.
        
        Args:
            target_path: Target path (relative to repo root)
            
        Returns:
            OperationRecord for this operation
            
        Raises:
            PathValidationError: If path validation fails
        """
        validated_path = self.validate_path(target_path)
        
        timestamp = datetime.now(timezone.utc).isoformat()
        evidence_id = f"ev-delete-{int(datetime.now(timezone.utc).timestamp())}"
        
        # Capture rollback info
        rollback_info = self.capture_rollback_info(validated_path)
        
        # Create operation record
        record = OperationRecord(
            operation="DELETE",
            source_path="",
            target_path=target_path,
            status="DRY_RUN" if self.dry_run else "PENDING",
            timestamp=timestamp,
            evidence_id=evidence_id
        )
        record.rollback_info = rollback_info
        
        # Execute delete (if not dry-run)
        if not self.dry_run:
            try:
                if validated_path.exists():
                    validated_path.unlink()
                    record.status = "SUCCESS"
                else:
                    record.status = "SKIPPED"
            except Exception as e:
                record.status = "FAILED"
                raise RepositoryAdapterError(
                    f"Failed to delete file {target_path}: {e}"
                )
        
        self.operation_records.append(record)
        return record
    
    def git_checkout_branch(self, branch_name: str) -> None:
        """
        Create and checkout a new git branch.
        
        Args:
            branch_name: Name of branch to create
            
        Raises:
            RepositoryAdapterError: If git operation fails
        """
        if self.dry_run:
            return
        
        try:
            # Check if branch exists
            result = subprocess.run(
                ["git", "rev-parse", "--verify", branch_name],
                cwd=self.repository_root,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                # Branch exists, checkout
                subprocess.run(
                    ["git", "checkout", branch_name],
                    cwd=self.repository_root,
                    check=True,
                    capture_output=True,
                    text=True
                )
            else:
                # Create new branch
                subprocess.run(
                    ["git", "checkout", "-b", branch_name],
                    cwd=self.repository_root,
                    check=True,
                    capture_output=True,
                    text=True
                )
        except subprocess.CalledProcessError as e:
            raise RepositoryAdapterError(
                f"Git checkout failed: {e.stderr}"
            )
    
    def git_add_files(self, file_paths: List[str]) -> None:
        """
        Stage files for git commit.
        
        Args:
            file_paths: List of file paths to stage (relative to repo root)
            
        Raises:
            RepositoryAdapterError: If git operation fails
        """
        if self.dry_run:
            return
        
        try:
            subprocess.run(
                ["git", "add"] + file_paths,
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            raise RepositoryAdapterError(
                f"Git add failed: {e.stderr}"
            )
    
    def git_commit(self, commit_message: str) -> str:
        """
        Commit staged changes.
        
        Args:
            commit_message: Commit message
            
        Returns:
            Commit hash
            
        Raises:
            RepositoryAdapterError: If git operation fails
        """
        if self.dry_run:
            return "dry-run-commit-hash"
        
        try:
            subprocess.run(
                ["git", "commit", "-m", commit_message],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
            
            # Get commit hash
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=self.repository_root,
                check=True,
                capture_output=True,
                text=True
            )
            
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            raise RepositoryAdapterError(
                f"Git commit failed: {e.stderr}"
            )
    
    def get_evidence_records(self) -> List[Dict[str, Any]]:
        """
        Get all operation records as evidence.
        
        Returns:
            List of operation records as dictionaries
        """
        return [record.to_dict() for record in self.operation_records]
    
    def export_evidence(self, output_path: str) -> None:
        """
        Export operation evidence to JSON file.
        
        Args:
            output_path: Path to write evidence file
        """
        evidence = {
            "repository_root": str(self.repository_root),
            "dry_run": self.dry_run,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "operations": self.get_evidence_records(),
        }
        
        output_file = Path(output_path)
        output_file.write_text(
            json.dumps(evidence, indent=2),
            encoding="utf-8"
        )
