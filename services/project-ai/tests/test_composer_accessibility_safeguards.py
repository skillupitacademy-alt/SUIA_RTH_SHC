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
from app.verification.composer_worktree_verifier import (
    compute_composer_evidence_hash,
    find_workspace_root,
)


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
    assert "No interactive controls present in block preview" in content
    assert "mobile-640" in content
    assert "laptop-1024" in content
    assert "wide-1536" in content
    assert "documentOverflow" in content
    assert "childBoundaryOverflow" in content


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


def _six_passing_viewports():
    return [
        {
            "name": name,
            "width": width,
            "height": 900,
            "passed": True,
            "block_found": True,
            "document_overflow_x": False,
            "block_overflow_x": False,
            "child_boundary_overflow": False,
        }
        for name, width in [
            ("mobile-375", 375),
            ("mobile-640", 640),
            ("tablet-768", 768),
            ("laptop-1024", 1024),
            ("desktop-1280", 1280),
            ("wide-1536", 1536),
        ]
    ]


@pytest.mark.asyncio
async def test_approve_final_rejects_incomplete_six_width_viewports():
    """Final approval must fail closed when responsive_viewports only contains legacy 3 widths."""
    a11y_data = {
        "passed": True,
        "violations_count": 0,
        "violations": [],
        "passes_count": 8,
    }
    modality_data = {
        "keyboard_navigation": {
            "status": "NOT_APPLICABLE",
            "details": "No interactive controls present in block preview",
            "focusable_count": 0,
        },
        "reduced_motion": {"status": "PASS", "details": "All animations suppressed"},
        "forced_colors": {"status": "PASS", "details": "Borders preserved"},
        "responsive_viewports": {
            "status": "PASS",
            "viewports_tested": [
                {"name": "mobile-375", "width": 375, "passed": True, "overflow_x": False},
                {"name": "tablet-768", "width": 768, "passed": True, "overflow_x": False},
                {"name": "desktop-1280", "width": 1280, "passed": True, "overflow_x": False},
            ],
        },
    }

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
                "accessibility": a11y_data,
                "modality_checks": modality_data,
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-legacy-3-widths",
                request=FinalApprovalRequest(approved=True, reason="Testing legacy 3 widths rejection"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=AsyncMock(),
            )

        assert exc_info.value.status_code == 400
        assert "missing required six-breakpoint widths" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_rejects_missing_screenshot_path():
    """Final approval must fail closed when screenshot_captured is True but screenshot_path is missing."""
    a11y_data = {
        "passed": True,
        "violations_count": 0,
        "violations": [],
        "passes_count": 8,
    }
    modality_data = {
        "keyboard_navigation": {"status": "PASS", "details": "Focused interactive element"},
        "reduced_motion": {"status": "PASS", "details": "All animations suppressed"},
        "forced_colors": {"status": "PASS", "details": "Borders preserved"},
        "responsive_viewports": {"status": "PASS", "viewports_tested": _six_passing_viewports()},
    }
    evidence_payload = {
        "verification": {"passed": True},
        "accessibility": a11y_data,
        "modality_checks": modality_data,
        "browser_metadata": {"browser_name": "chromium"},
        "verified_commit": "a" * 40,
        "candidate_hash": "c" * 64,
        "manifest_hash": "m" * 64,
        "screenshot_sha256": "f" * 64,
    }
    valid_hash = compute_composer_evidence_hash(evidence_payload)

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
            "evidence_hash": valid_hash,
            "evidence_payload": evidence_payload,
            "runner_metadata": {
                "screenshot_captured": True,
                # Missing screenshot_path!
                "accessibility": a11y_data,
                "modality_checks": modality_data,
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-missing-screenshot-path",
                request=FinalApprovalRequest(approved=True, reason="Testing missing screenshot path"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=AsyncMock(),
            )

        assert exc_info.value.status_code == 400
        assert "missing screenshot_path or screenshot_sha256" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_rejects_tampered_evidence_hash(tmp_path):
    """Final approval must fail closed when recomputed evidence_hash does not match stored evidence_hash."""
    import hashlib
    screenshot_file = tmp_path / "verify_screenshot.png"
    screenshot_file.write_bytes(b"fake-png-content")
    screenshot_sha = hashlib.sha256(screenshot_file.read_bytes()).hexdigest()

    a11y_data = {
        "passed": True,
        "violations_count": 0,
        "violations": [],
        "passes_count": 8,
    }
    modality_data = {
        "keyboard_navigation": {"status": "PASS", "details": "Focused interactive element"},
        "reduced_motion": {"status": "PASS", "details": "All animations suppressed"},
        "forced_colors": {"status": "PASS", "details": "Borders preserved"},
        "responsive_viewports": {"status": "PASS", "viewports_tested": _six_passing_viewports()},
    }
    evidence_payload = {
        "verification": {"passed": True},
        "accessibility": a11y_data,
        "modality_checks": modality_data,
        "browser_metadata": {"browser_name": "chromium"},
        "verified_commit": "a" * 40,
        "candidate_hash": "c" * 64,
        "manifest_hash": "m" * 64,
        "screenshot_sha256": screenshot_sha,
    }

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
            "evidence_hash": "0" * 64,  # Tampered hash!
            "evidence_payload": evidence_payload,
            "runner_metadata": {
                "screenshot_captured": True,
                "screenshot_path": str(screenshot_file),
                "screenshot_sha256": screenshot_sha,
                "accessibility": a11y_data,
                "modality_checks": modality_data,
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    with patch("subprocess.run") as mock_sub:
        mock_sub.return_value = MagicMock(returncode=0, stdout="packages/ui/some-file.tsx\n")

        with pytest.raises(HTTPException) as exc_info:
            await approve_final_certification(
                workflow_id="wf-test-tampered",
                request=FinalApprovalRequest(approved=True, reason="Testing tamper rejection"),
                user={"email": "admin@skillhubcore.in"},
                governance_service=mock_gov,
                session=AsyncMock(),
            )

        assert exc_info.value.status_code == 400
        assert "evidence_hash cryptographic verification failed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_approve_final_passes_with_clean_accessibility_and_modalities(tmp_path):
    """Final approval accepts an applicable static-block exemption with clean evidence."""
    import hashlib
    screenshot_file = tmp_path / "verify_screenshot_valid.png"
    screenshot_file.write_bytes(b"valid-png-content")
    screenshot_sha = hashlib.sha256(screenshot_file.read_bytes()).hexdigest()

    a11y_data = {
        "passed": True,
        "violations_count": 0,
        "violations": [],
        "passes_count": 28,
    }
    modality_data = {
        "keyboard_navigation": {
            "status": "NOT_APPLICABLE",
            "details": "No interactive controls present in block preview",
            "focusable_count": 0,
        },
        "reduced_motion": {"status": "PASS", "details": "All animations suppressed"},
        "forced_colors": {"status": "PASS", "details": "Borders preserved"},
        "responsive_viewports": {"status": "PASS", "viewports_tested": _six_passing_viewports()},
    }
    evidence_payload = {
        "verification": {"passed": True},
        "accessibility": a11y_data,
        "modality_checks": modality_data,
        "browser_metadata": {"browser_name": "chromium"},
        "verified_commit": "a" * 40,
        "candidate_hash": "c" * 64,
        "manifest_hash": "m" * 64,
        "screenshot_sha256": screenshot_sha,
    }
    valid_hash = compute_composer_evidence_hash(evidence_payload)

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
            "evidence_hash": valid_hash,
            "evidence_payload": evidence_payload,
            "runner_metadata": {
                "screenshot_captured": True,
                "screenshot_path": str(screenshot_file),
                "screenshot_sha256": screenshot_sha,
                "accessibility": a11y_data,
                "modality_checks": modality_data,
            },
        },
    }

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)
    transitioned_workflow = MagicMock()
    transitioned_workflow.current_state = CanonicalWorkflowState.CERTIFIED
    # This case exercises browser-evidence approval, not revision supersedence.
    transitioned_workflow.manifest_id = None
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


@pytest.mark.asyncio
async def test_supersede_workflow_revokes_certified_state_and_reconciles_ancestors():
    """Superseding a CERTIFIED workflow transitions it and any stale CERTIFIED ancestors to REJECTED (SUPERSEDED)."""
    from app.api.routes.workflows import supersede_workflow, SupersedeWorkflowRequest

    mock_workflow = MagicMock()
    mock_workflow.current_state = CanonicalWorkflowState.CERTIFIED
    mock_workflow.specification_id = "spec-1"
    mock_workflow.target_family = "Objective"
    mock_workflow.target_version = "O1"
    mock_workflow.requester_id = "req-1"
    mock_workflow.contract_id = "con-1"
    mock_workflow.contract_sha256 = "b" * 64

    mock_wf_model = MagicMock()
    mock_wf_model.current_state = CanonicalWorkflowState.CERTIFIED.value
    mock_wf_model.final_status = "CERTIFIED"
    mock_wf_model.gate_results = {
        "supersedes": {"superseded_workflow_id": "wf-ancestor-1"}
    }

    mock_ancestor_model = MagicMock()
    mock_ancestor_model.current_state = CanonicalWorkflowState.CERTIFIED.value
    mock_ancestor_model.final_status = "SUPERSEDED"
    mock_ancestor_model.gate_results = {
        "superseded": {"superseded_by": "wf-current-1"}
    }

    async def _repo_get(wf_id, verify_bindings=False):
        if wf_id == "wf-current-1":
            return mock_wf_model
        if wf_id == "wf-ancestor-1":
            return mock_ancestor_model
        return None

    mock_repo = MagicMock()
    mock_repo.get = AsyncMock(side_effect=_repo_get)
    mock_repo.upsert = AsyncMock()

    mock_gov = MagicMock()
    mock_gov.get_workflow = AsyncMock(return_value=mock_workflow)

    mock_session = AsyncMock()
    mock_session.add = MagicMock()

    res = await supersede_workflow(
        workflow_id="wf-current-1",
        request=SupersedeWorkflowRequest(reason="Re-certify against 6-width boundary gate"),
        user={"email": "admin@skillhubcore.in"},
        governance_service=mock_gov,
        workflow_repo=mock_repo,
        session=mock_session,
    )

    assert res["old_workflow_id"] == "wf-current-1"
    assert res["current_state"] == CanonicalWorkflowState.CANDIDATE_REQUESTED.value
    assert mock_wf_model.current_state == CanonicalWorkflowState.REJECTED.value
    assert mock_wf_model.final_status == "SUPERSEDED"
    assert mock_ancestor_model.current_state == CanonicalWorkflowState.REJECTED.value
    assert mock_ancestor_model.final_status == "SUPERSEDED"
    assert mock_repo.upsert.await_count == 2
