"""Focused tests for isolated Composer verification safety invariants."""

from pathlib import Path

import pytest

from app.api.routes.workflows import _get_verified_placement_commit
from app.verification.composer_worktree_verifier import _generate_playwright_script


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
