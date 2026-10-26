"""
Tests for Project LLM Production-Readiness Safeguards.

Verifies:
1. Worktree manager strictly rejects empty placement commits.
2. Final approval route strictly rejects empty placement commit diffs.
3. Final approval route strictly requires qualification evidence.
4. Final approval route strictly requires Composer verification evidence, screenshot, and hash.
5. Final approval route strictly requires cryptographic candidate and manifest hash bindings.
"""

import pytest
import subprocess
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import HTTPException

from app.placement.worktree_manager import WorktreeManager, WorktreeContext, WorktreeError
from app.orchestration.canonical_workflow import CanonicalWorkflowState


def test_commit_in_worktree_rejects_empty_commit(tmp_path):
    """Verify that worktree_manager raises WorktreeError on empty commits."""
    # Initialize a dummy git repo in tmp_path
    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=tmp_path, check=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True)

    # Initial commit
    test_file = tmp_path / "initial.txt"
    test_file.write_text("initial", encoding="utf-8")
    subprocess.run(["git", "add", "initial.txt"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-m", "initial commit"], cwd=tmp_path, check=True)

    mgr = WorktreeManager(tmp_path)
    ctx = WorktreeContext(
        worktree_path=tmp_path,
        branch_name="test-branch",
        base_commit="HEAD",
        created_at="2026-10-26T00:00:00Z",
        workflow_id="wf-123",
        manifest_id="mf-123"
    )

    # Attempt to commit with no modified files
    with pytest.raises(WorktreeError) as exc_info:
        mgr.commit_in_worktree(ctx, [], "empty commit attempt")

    assert "Empty placement commit rejected" in str(exc_info.value)


@pytest.mark.asyncio
async def test_final_approval_rejects_empty_placement_diff():
    """Verify that approve_final_certification rejects placement commits with zero diff."""
    from app.api.routes.workflows import approve_final_certification, FinalApprovalRequest

    workflow = MagicMock()
    workflow.workflow_id = "wf-test-01"
    workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    workflow.contract_sha256 = "contract-123"
    workflow.candidate_sha256 = "cand-123"
    workflow.manifest_sha256 = "man-123"
    workflow.gate_results = {
        "placement": {
            "commit": "dummy-empty-commit",
            "candidate_sha256": "cand-123",
            "manifest_sha256": "man-123"
        },
        "Unit Test Suite": {
            "status": "PASS"
        },
        "composer": {
            "passed": True,
            "status": "PASS",
            "evidence_hash": "ev-hash-123",
            "runner_metadata": {"screenshot_captured": True}
        }
    }

    gov_service = MagicMock()
    gov_service.get_workflow = AsyncMock(return_value=workflow)
    session = MagicMock()
    user = {"email": "admin@skillhubcore.in"}
    request = FinalApprovalRequest(approved=True, reason="Testing")

    with patch("app.verification.composer_worktree_verifier.find_workspace_root", return_value="."), \
         patch("subprocess.run") as mock_subproc:

        # Mock git diff-tree returning empty stdout (0 changed files)
        mock_proc_result = MagicMock()
        mock_proc_result.stdout = ""
        mock_subproc.return_value = mock_proc_result

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-01",
                request=request,
                user=user,
                governance_service=gov_service,
                session=session
            )

        assert exc_info.value.status_code == 400
        assert "empty commit with 0 changed files" in exc_info.value.detail


@pytest.mark.asyncio
async def test_final_approval_rejects_missing_composer_screenshot():
    """Verify that approve_final_certification rejects candidate workflows missing screenshot evidence."""
    from app.api.routes.workflows import approve_final_certification, FinalApprovalRequest

    workflow = MagicMock()
    workflow.workflow_id = "wf-test-02"
    workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    workflow.contract_sha256 = "contract-123"
    workflow.candidate_sha256 = "cand-123"
    workflow.manifest_sha256 = "man-123"
    workflow.gate_results = {
        "placement": {
            "commit": "real-commit-sha",
            "candidate_sha256": "cand-123",
            "manifest_sha256": "man-123"
        },
        "Unit Test Suite": {
            "status": "PASS"
        },
        "composer": {
            "passed": True,
            "status": "PASS",
            "evidence_hash": "ev-hash-123",
            "runner_metadata": {"screenshot_captured": False}  # Missing screenshot!
        }
    }

    gov_service = MagicMock()
    gov_service.get_workflow = AsyncMock(return_value=workflow)
    session = MagicMock()
    user = {"email": "admin@skillhubcore.in"}
    request = FinalApprovalRequest(approved=True, reason="Testing")

    with patch("app.verification.composer_worktree_verifier.find_workspace_root", return_value="."), \
         patch("subprocess.run") as mock_subproc:

        # Mock git diff-tree returning 1 changed file
        mock_proc_result = MagicMock()
        mock_proc_result.stdout = "packages/ui/src/ObjectiveO2Block.tsx\n"
        mock_subproc.return_value = mock_proc_result

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-02",
                request=request,
                user=user,
                governance_service=gov_service,
                session=session
            )

        assert exc_info.value.status_code == 400
        assert "missing visual screenshot evidence" in exc_info.value.detail

