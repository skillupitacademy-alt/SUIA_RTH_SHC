"""Focused tests for isolated Composer verification safety invariants."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.api.routes.workflows import _get_verified_placement_commit
from app.verification.composer_worktree_verifier import (
    _generate_playwright_script,
    _prepare_dependencies,
    _verification_worktrees_dir,
)


def test_placement_commit_requires_exact_hash_bindings():
    gates = {
        "placement": {
            "commit": "a" * 40,
            "candidate_sha256": "candidate-hash",
            "manifest_sha256": "manifest-hash",
        }
    }

    assert _get_verified_placement_commit(gates, "candidate-hash", "manifest-hash") == "a" * 40

    with pytest.raises(ValueError, match="candidate hash"):
        _get_verified_placement_commit(gates, "different-candidate", "manifest-hash")

    with pytest.raises(ValueError, match="valid commit SHA"):
        _get_verified_placement_commit({"placement": {"commit": "dry-run-commit-hash"}}, "", "")


def test_playwright_runner_requires_exact_version_and_clean_network():
    script = _generate_playwright_script(
        "http://127.0.0.1:3111",
        "Objective",
        "O1",
        Path("C:/tmp/composer.png"),
    )

    assert "Failed to load ${targetUrl} (status: ${response ? response.status() : 'no response'})" in script
    assert "network_errors" in script
    assert "const versionMatches = result.dom_block_version === 'O1';" in script
    assert "Unable to select block version 'O1'" in script
    assert "result.network_errors.length === 0" in script


def test_verification_worktree_inside_workspace_is_redirected_to_temp(monkeypatch, tmp_path):
    """A watched repository path must never host a long-running verification worktree."""
    workspace = tmp_path / "workspace"
    configured = workspace / ".worktrees" / "verification"
    monkeypatch.setenv("PROJECT_AI_WORKTREES_DIR", str(configured))

    resolved = _verification_worktrees_dir(workspace)

    assert resolved != configured
    assert not resolved.is_relative_to(workspace)


def test_verification_prepares_local_lockfile_dependencies_without_junctions(tmp_path):
    """Cross-volume worktrees must use pnpm, never junction the source checkout node_modules."""
    workspace = tmp_path / "workspace"
    worktree = tmp_path / "verification" / "worktree"
    admin_env = workspace / "apps" / "skillhubcore-admin" / ".env.local"
    admin_env.parent.mkdir(parents=True)
    admin_env.write_text("DATABASE_URL=test", encoding="utf-8")
    worktree.mkdir(parents=True)

    with patch("app.verification.composer_worktree_verifier._pnpm_command", return_value="pnpm"), patch(
        "app.verification.composer_worktree_verifier.subprocess.run",
        return_value=MagicMock(returncode=0, stdout="", stderr=""),
    ) as run:
        assert _prepare_dependencies(workspace, worktree, 60) == []

    assert run.call_args.args[0] == [
        "pnpm", "install", "--offline", "--frozen-lockfile", "--ignore-scripts"
    ]
    assert (worktree / "apps" / "skillhubcore-admin" / ".env.local").read_text(encoding="utf-8") == "DATABASE_URL=test"
