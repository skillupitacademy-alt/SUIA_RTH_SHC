"""
Tests for browser-level accessibility verification and fail-closed final approval safeguards.

Verifies:
1. Versioned composer worktree runner script integrity (axe-core, WCAG tags, color-contrast rule, modalities).
2. Final approval endpoint rejects candidates missing browser accessibility evidence.
3. Final approval endpoint rejects candidates with axe WCAG violations.
4. Final approval endpoint rejects candidates with failed modality checks.
5. Final approval endpoint accepts candidates with passing accessibility and modality evidence.
"""

from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock
import pytest
from fastapi import HTTPException

from app.api.routes.workflows import approve_final_certification
from app.api.schemas.workflow import FinalApprovalRequest
from app.models.workflow import CanonicalWorkflowState
from app.verification.composer_worktree_verifier import find_workspace_root


def test_versioned_runner_script_contains_axe_and_modality_checks():
    """Verify that scripts/verification/composer-worktree-runner.cjs contains required accessibility rules."""
    root = find_workspace_root()
    runner_path = root / "scripts" / "verification" / "composer-worktree-runner.cjs"

    assert runner_path.exists(), f"Versioned runner script not found at {runner_path}"
    content = runner_path.read_text(encoding="utf-8")

    # Axe-core setup
    assert "@axe-core/playwright" in content
    assert "withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])" in content
    assert "include(blockSelector)" in content

    # Modalities
    assert "keyboard_navigation" in content
    assert "reduced_motion" in content
    assert "forced_colors" in content
    assert "responsive_viewports" in content
    assert "NOT_APPLICABLE" in content


@pytest.mark.asyncio
async def test_approve_final_rejects_missing_accessibility_evidence():
    """Final approval must fail closed with 400 when composer gate has no accessibility evidence."""
    mock_workflow = MagicMock()
    mock_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    mock_workflow.candidate_sha256 = "c" * 64
    mock_workflow.manifest_sha256 = "m" * 64
    mock_workflow.gate_results = {
        "placement": {
            "commit": "a" * 40,
            "candidate_sha256": "c" * 64,
            "manifest_sha256": "m" * 64,
        },
        "qualification": {"status": "PASS"},
        "composer": {
            "status": "PASS",
            "passed": True,
            "evidence_hash": "e" * 64,
            "runner_metadata": {
                "screenshot_captured": True,
                # Missing 'accessibility'
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-1",
                request=FinalApprovalRequest(approved=True, reason="Testing"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=MagicMock(),
            )

        assert exc_info.value.status_code == 400
        assert "missing required browser-level accessibility evidence" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_rejects_axe_violations():
    """Final approval must fail closed with 400 when axe detected WCAG violations."""
    mock_workflow = MagicMock()
    mock_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    mock_workflow.candidate_sha256 = "c" * 64
    mock_workflow.manifest_sha256 = "m" * 64
    mock_workflow.gate_results = {
        "placement": {
            "commit": "a" * 40,
            "candidate_sha256": "c" * 64,
            "manifest_sha256": "m" * 64,
        },
        "qualification": {"status": "PASS"},
        "composer": {
            "status": "PASS",
            "passed": True,
            "evidence_hash": "e" * 64,
            "runner_metadata": {
                "screenshot_captured": True,
                "accessibility": {
                    "passed": False,
                    "violations_count": 2,
                    "violations": [
                        {"id": "color-contrast", "help": "Elements must have sufficient color contrast"},
                        {"id": "button-name", "help": "Buttons must have discernible text"}
                    ],
                },
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-2",
                request=FinalApprovalRequest(approved=True, reason="Testing"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=MagicMock(),
            )

        assert exc_info.value.status_code == 400
        assert "failed browser-level accessibility audit with 2 violation(s)" in exc_info.value.detail
        assert "color-contrast" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_rejects_failed_modality_checks():
    """Final approval must fail closed with 400 when a modality check failed."""
    mock_workflow = MagicMock()
    mock_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    mock_workflow.candidate_sha256 = "c" * 64
    mock_workflow.manifest_sha256 = "m" * 64
    mock_workflow.gate_results = {
        "placement": {
            "commit": "a" * 40,
            "candidate_sha256": "c" * 64,
            "manifest_sha256": "m" * 64,
        },
        "qualification": {"status": "PASS"},
        "composer": {
            "status": "PASS",
            "passed": True,
            "evidence_hash": "e" * 64,
            "runner_metadata": {
                "screenshot_captured": True,
                "accessibility": {
                    "passed": True,
                    "violations_count": 0,
                    "violations": [],
                    "passes_count": 12,
                },
                "modality_checks": {
                    "keyboard_navigation": {"status": "PASS"},
                    "reduced_motion": {
                        "status": "FAIL",
                        "details": "Unguarded CSS animation detected under prefers-reduced-motion"
                    },
                    "forced_colors": {"status": "PASS"},
                    "responsive_viewports": {"status": "PASS"},
                }
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-3",
                request=FinalApprovalRequest(approved=True, reason="Testing"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=MagicMock(),
            )

        assert exc_info.value.status_code == 400
        assert "failed reduced_motion modality check" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_rejects_missing_modalities_object():
    """Final approval fails closed when modality_checks is missing or empty."""
    mock_workflow = MagicMock()
    mock_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    mock_workflow.candidate_sha256 = "c" * 64
    mock_workflow.manifest_sha256 = "m" * 64
    mock_workflow.gate_results = {
        "placement": {
            "commit": "a" * 40,
            "candidate_sha256": "c" * 64,
            "manifest_sha256": "m" * 64,
        },
        "qualification": {"status": "PASS"},
        "composer": {
            "status": "PASS",
            "passed": True,
            "evidence_hash": "e" * 64,
            "runner_metadata": {
                "screenshot_captured": True,
                "accessibility": {
                    "passed": True,
                    "violations_count": 0,
                    "violations": [],
                    "passes_count": 10,
                },
                "modality_checks": {},
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-missing-mod",
                request=FinalApprovalRequest(approved=True, reason="Testing"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=MagicMock(),
            )

        assert exc_info.value.status_code == 400
        assert "missing required modality_checks object" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_passes_with_clean_accessibility_and_modalities():
    """Final approval succeeds when accessibility passed with 0 violations and modalities are clean."""
    mock_workflow = MagicMock()
    mock_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    mock_workflow.candidate_sha256 = "c" * 64
    mock_workflow.manifest_sha256 = "m" * 64
    mock_workflow.gate_results = {
        "placement": {
            "commit": "a" * 40,
            "candidate_sha256": "c" * 64,
            "manifest_sha256": "m" * 64,
        },
        "qualification": {"status": "PASS"},
        "composer": {
            "status": "PASS",
            "passed": True,
            "evidence_hash": "e" * 64,
            "runner_metadata": {
                "screenshot_captured": True,
                "accessibility": {
                    "passed": True,
                    "violations_count": 0,
                    "violations": [],
                    "passes_count": 28,
                },
                "modality_checks": {
                    "keyboard_navigation": {"status": "PASS", "details": "Focused interactive element"},
                    "reduced_motion": {"status": "PASS", "details": "All animations suppressed"},
                    "forced_colors": {"status": "PASS", "details": "Borders preserved"},
                    "responsive_viewports": {"status": "PASS", "viewports_tested": []},
                },
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)
    transitioned_workflow = MagicMock()
    transitioned_workflow.current_state = CanonicalWorkflowState.CERTIFIED
    mock_gov.transition_state = AsyncMock(return_value=transitioned_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        resp = await approve_final_certification(
            workflow_id="wf-test-4",
            request=FinalApprovalRequest(approved=True, reason="Passed all audits"),
            user={"email": "admin@skillhubcore.in"},
            governance_service=mock_gov,
            session=AsyncMock(),
        )

        assert resp.approved is True
        assert resp.new_state == CanonicalWorkflowState.CERTIFIED.value
