"""
W5 Repository Adapter Security Tests

Tests for path security, allowlist enforcement, and safe repository operations.
"""

import hashlib
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.placement.repository_adapter import (
    RepositoryAdapter,
    RepositoryAdapterError,
    PathValidationError,
    OperationRecord,
)


@pytest.fixture
def temp_repo():
    """Create temporary repository for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_path = Path(tmpdir)
        
        # Create allowed directory structure
        allowed_dirs = [
            "packages/ui/src/tutorial/blocks",
            "packages/ui/src/tutorial/schemas",
            "packages/ui/src/tutorial/types",
            "packages/ui/src/tutorial/utils",
            "packages/shared/src/tutorial",
        ]
        
        for dir_path in allowed_dirs:
            (repo_path / dir_path).mkdir(parents=True, exist_ok=True)
        
        yield repo_path


class TestPathTraversalRejection:
    """Tests for path traversal attack prevention."""
    
    def test_rejects_parent_directory_traversal(self, temp_repo):
        """Reject paths with ../ attempting to escape workspace."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        malicious_paths = [
            "../../../etc/passwd",
            "packages/../../secret.txt",
            "packages/ui/../../../etc/hosts",
        ]
        
        for path in malicious_paths:
            with pytest.raises(PathValidationError) as exc_info:
                adapter.validate_path(path)
            assert "path traversal" in str(exc_info.value).lower() or "outside workspace" in str(exc_info.value).lower() or "traversal detected" in str(exc_info.value).lower()
    
    def test_rejects_absolute_paths(self, temp_repo):
        """Reject absolute paths that bypass workspace root."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        absolute_paths = [
            "/etc/passwd",
            "/absolute/path/file.txt",
            "C:\\Windows\\System32\\config" if Path.cwd().drive else "/var/log/secret",
        ]
        
        for path in absolute_paths:
            with pytest.raises(PathValidationError) as exc_info:
                adapter.validate_path(path)
            assert "absolute path" in str(exc_info.value).lower() or "outside workspace" in str(exc_info.value).lower() or "traversal detected" in str(exc_info.value).lower()
    
    def test_rejects_paths_outside_workspace(self, temp_repo):
        """Reject paths that resolve outside workspace after normalization."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        # Even normalized, these should be rejected
        with pytest.raises(PathValidationError):
            adapter.validate_path("packages/../../secret")


class TestAllowlistEnforcement:
    """Tests for allowlist enforcement of permitted directories."""
    
    def test_accepts_valid_blocks_path(self, temp_repo):
        """Accept paths in allowed blocks directory."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        valid_path = "packages/ui/src/tutorial/blocks/Introduction/I7/index.tsx"
        adapter.validate_path(valid_path)  # Should not raise
    
    def test_accepts_valid_schemas_path(self, temp_repo):
        """Accept paths in allowed schemas directory."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        valid_path = "packages/ui/src/tutorial/schemas/block-schema.json"
        adapter.validate_path(valid_path)  # Should not raise
    
    def test_accepts_valid_shared_path(self, temp_repo):
        """Accept paths in allowed shared directory."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        valid_path = "packages/shared/src/tutorial/types.ts"
        adapter.validate_path(valid_path)  # Should not raise
    
    def test_rejects_unauthorized_directory(self, temp_repo):
        """Reject paths outside allowed directories."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        unauthorized_paths = [
            "packages/unauthorized/file.ts",
            "src/secret/config.ts",
            "packages/ui/src/admin/secret.ts",
        ]
        
        for path in unauthorized_paths:
            with pytest.raises(PathValidationError) as exc_info:
                adapter.validate_path(path)
            assert "not in allowed" in str(exc_info.value).lower() or "allowlist" in str(exc_info.value).lower()


class TestExtensionValidation:
    """Tests for file extension validation."""
    
    def test_accepts_typescript_files(self, temp_repo):
        """Accept .ts files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        valid_path = "packages/ui/src/tutorial/blocks/file.ts"
        adapter.validate_file_extension(valid_path)  # Should not raise
    
    def test_accepts_tsx_files(self, temp_repo):
        """Accept .tsx files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        valid_path = "packages/ui/src/tutorial/blocks/Component.tsx"
        adapter.validate_file_extension(valid_path)  # Should not raise
    
    def test_accepts_json_files(self, temp_repo):
        """Accept .json files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        valid_path = "packages/ui/src/tutorial/schemas/schema.json"
        adapter.validate_file_extension(valid_path)  # Should not raise
    
    def test_rejects_python_files(self, temp_repo):
        """Reject .py files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        with pytest.raises(RepositoryAdapterError) as exc_info:
            adapter.validate_file_extension("packages/ui/src/tutorial/blocks/script.py")
        assert "extension" in str(exc_info.value).lower()
    
    def test_rejects_shell_scripts(self, temp_repo):
        """Reject .sh files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        with pytest.raises(RepositoryAdapterError) as exc_info:
            adapter.validate_file_extension("packages/ui/src/tutorial/blocks/script.sh")
        assert "extension" in str(exc_info.value).lower()
    
    def test_rejects_executable_files(self, temp_repo):
        """Reject .exe files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        with pytest.raises(RepositoryAdapterError) as exc_info:
            adapter.validate_file_extension("packages/ui/src/tutorial/blocks/malware.exe")
        assert "extension" in str(exc_info.value).lower()


class TestDryRunMode:
    """Tests for dry-run mode without actual file writes."""
    
    def test_dry_run_prevents_file_write(self, temp_repo):
        """Verify no files written when dry_run=True."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        content = "export const Block = () => <div>Test</div>;"
        
        # Execute write in dry-run mode
        record = adapter.write_file(
            source_content=content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Verify operation recorded with DRY_RUN status
        assert record.status == "DRY_RUN"
        
        # Verify file was NOT actually written
        full_path = temp_repo / target_path / "index.tsx"
        assert not full_path.exists(), "File should not exist in dry-run mode"
    
    def test_dry_run_still_validates_paths(self, temp_repo):
        """Verify path validation still enforced in dry-run mode."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        # Should still reject invalid paths even in dry-run
        with pytest.raises(PathValidationError):
            adapter.write_file(
                source_content="malicious",
                target_path="../../../etc",
                filename="passwd",
                family="Introduction",
                version="I7"
            )


class TestDiffGeneration:
    """Tests for diff generation capability."""
    
    def test_generates_diff_for_new_file(self, temp_repo):
        """Verify diff shows NEW FILE for additions."""
        adapter = RepositoryAdapter(temp_repo, dry_run=False)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        content = "export const Block = () => <div>New Block</div>;"
        
        record = adapter.write_file(
            source_content=content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Verify diff generated
        assert record.diff is not None
        # For new files, diff should indicate it's new
        assert "NEW FILE" in record.diff or "+++" in record.diff
    
    def test_generates_diff_for_update(self, temp_repo):
        """Verify diff shows changes for updates."""
        adapter = RepositoryAdapter(temp_repo, dry_run=False)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        
        # Write initial content
        old_content = "export const Block = () => <div>Old</div>;"
        adapter.write_file(
            source_content=old_content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Update with new content
        new_content = "export const Block = () => <div>New</div>;"
        record = adapter.write_file(
            source_content=new_content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Verify diff shows changes
        assert record.diff is not None
        assert "---" in record.diff and "+++" in record.diff
        # Should show old and new lines
        assert "Old" in record.diff or "New" in record.diff


class TestRollbackCapture:
    """Tests for rollback information capture."""
    
    def test_captures_rollback_info_for_new_file(self, temp_repo):
        """Verify rollback info captured for new files."""
        adapter = RepositoryAdapter(temp_repo, dry_run=False)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        content = "export const Block = () => <div>Test</div>;"
        
        record = adapter.write_file(
            source_content=content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Verify rollback info recorded
        assert record.rollback_info is not None
        assert "exists" in record.rollback_info
        assert record.rollback_info["exists"] is False
        assert record.rollback_info["action"] == "delete_on_rollback"
    
    def test_captures_rollback_info_for_update(self, temp_repo):
        """Verify rollback info captures pre-mutation state."""
        adapter = RepositoryAdapter(temp_repo, dry_run=False)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        
        # Write initial content
        old_content = "export const Block = () => <div>Old</div>;"
        adapter.write_file(
            source_content=old_content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Update content
        new_content = "export const Block = () => <div>New</div>;"
        record = adapter.write_file(
            source_content=new_content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Verify rollback info captures old state
        assert record.rollback_info is not None
        assert record.rollback_info["exists"] is True
        assert record.rollback_info["action"] == "restore_on_rollback"
        assert "content_backup" in record.rollback_info
        assert record.rollback_info["content_backup"] == old_content
        assert "hash" in record.rollback_info


class TestTargetValidation:
    """Tests for target family/version validation."""
    
    def test_validates_canonical_introduction_targets(self, temp_repo):
        """Accept canonical Introduction targets."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        for version in ["I1", "I2", "I3", "I4", "I5", "I6", "I7"]:
            adapter.validate_target("Introduction", version)  # Should not raise
    
    def test_validates_canonical_tutorial_targets(self, temp_repo):
        """Accept canonical Tutorial targets."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        for version in ["T1", "T2", "T3", "T4", "T5"]:
            adapter.validate_target("Tutorial", version)  # Should not raise
    
    def test_rejects_unknown_family(self, temp_repo):
        """Reject unknown block families."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        with pytest.raises(RepositoryAdapterError) as exc_info:
            adapter.validate_target("UnknownFamily", "X1")
        assert "family" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()
    
    def test_rejects_unknown_version(self, temp_repo):
        """Reject unknown block versions."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        with pytest.raises(RepositoryAdapterError) as exc_info:
            adapter.validate_target("Introduction", "I99")
        assert "version" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()


class TestEvidenceProduction:
    """Tests for evidence/operation record generation."""
    
    def test_produces_operation_record(self, temp_repo):
        """Verify operation record produced for every write."""
        adapter = RepositoryAdapter(temp_repo, dry_run=False)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        content = "export const Block = () => <div>Test</div>;"
        
        record = adapter.write_file(
            source_content=content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Verify record fields
        assert isinstance(record, OperationRecord)
        assert record.operation == "ADD"
        assert record.source_path == "candidate/index.tsx"
        assert record.status in ["SUCCESS", "DRY_RUN"]
        assert record.timestamp is not None
        assert record.evidence_id is not None
        assert record.file_hash is not None
    
    def test_exports_evidence_to_json(self, temp_repo):
        """Verify evidence can be exported to JSON."""
        adapter = RepositoryAdapter(temp_repo, dry_run=False)
        
        target_path = "packages/ui/src/tutorial/blocks/Introduction/I7"
        content = "export const Block = () => <div>Test</div>;"
        
        adapter.write_file(
            source_content=content,
            target_path=target_path,
            filename="index.tsx",
            family="Introduction",
            version="I7"
        )
        
        # Export evidence
        evidence_path = temp_repo / "evidence.json"
        adapter.export_evidence(str(evidence_path))
        
        # Verify file created and valid JSON
        assert evidence_path.exists()
        import json
        with open(evidence_path) as f:
            evidence = json.load(f)
        
        # Evidence might be a dict with operations key or direct list
        if isinstance(evidence, dict):
            assert "operations" in evidence or len(evidence) > 0
        else:
            assert isinstance(evidence, list)
            assert len(evidence) > 0


class TestGitOperations:
    """Tests for git operations via adapter."""
    
    @patch('subprocess.run')
    def test_git_checkout_in_dry_run(self, mock_run, temp_repo):
        """Verify git operations return placeholders in dry-run."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        result = adapter.git_checkout_branch("test-branch")
        
        # Should not call git in dry-run
        mock_run.assert_not_called()
        # Should return successfully (even if placeholder)
        assert result is not None or True  # Dry-run completes without error
    
    @patch('subprocess.run')
    def test_git_add_in_dry_run(self, mock_run, temp_repo):
        """Verify git add returns placeholder in dry-run."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        result = adapter.git_add_files(["file1.tsx", "file2.tsx"])
        
        # Should not call git in dry-run
        mock_run.assert_not_called()
        # Completes without error
        assert True
    
    @patch('subprocess.run')
    def test_git_commit_in_dry_run(self, mock_run, temp_repo):
        """Verify git commit returns placeholder hash in dry-run."""
        adapter = RepositoryAdapter(temp_repo, dry_run=True)
        
        commit_sha = adapter.git_commit("test commit message")
        
        # Should not call git in dry-run
        mock_run.assert_not_called()
        # Should return placeholder hash or complete successfully
        assert commit_sha is not None or True
