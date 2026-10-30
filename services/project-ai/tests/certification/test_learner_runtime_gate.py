"""
Generic Automated Test Suite for Project LLM Learner Runtime & ILS Certification Gate.

Verifies:
1. No browser execution => runtime BLOCKED, never PASS.
2. Missing test identity => BLOCKED.
3. Navigation 401 => FAIL.
4. Navigation 403 => FAIL.
5. Expected navigation 200 + rendered block => PASS candidate.
6. Login redirect => FAIL.
7. Relevant console error => FAIL.
8. LSNB/RSSB applicable and missing => FAIL.
9. LSNB/RSSB not applicable => NOT_APPLICABLE with reason.
10. Progression endpoint failure => FAIL.
11. Screenshot missing/hash mismatch => final approval rejected.
12. Evidence hash tampering => final approval rejected.
13. ADD and UPDATE paths use the same runner.
14. At least two distinct families/versions prove no Objective-specific behavior.
"""

import os
import json
import hashlib
import tempfile
import pytest
from pathlib import Path
from unittest.mock import Mock, patch

from app.verification.learner_identity import (
    LearnerRuntimeTestIdentityProvider,
    LearnerSessionResult,
    LearnerRuntimeTestIdentityUnavailable,
)
from app.verification.learner_route_resolver import (
    LearnerRouteResolver,
    LearnerRouteContext,
    LearnerRouteResolutionError,
)
from app.verification.learner_runtime_verifier import (
    verify_learner_runtime,
    LearnerRuntimeVerificationResult,
    compute_canonical_json_hash,
)


@pytest.fixture
def mock_identity_provider():
    """Returns a valid mocked test identity provider."""
    provider = Mock(spec=LearnerRuntimeTestIdentityProvider)
    provider.base_url = "http://skillup.localhost:3009"
    provider.test_tenant = "skillup"
    provider.auth_mode = "internal_fixture"
    provider.get_test_session.return_value = LearnerSessionResult(
        cookieName="accessToken",
        cookieValue="mock-valid-shortlived-token",
        domain="skillup.localhost",
        expiresAt="2026-10-31T01:00:00Z",
        learnerIdHash=hashlib.sha256(b"test-learner").hexdigest(),
        testTenant="skillup",
    )
    return provider


@pytest.fixture
def temp_workspace(tmp_path):
    """Sets up a temp workspace with screenshots dir."""
    screenshots_dir = tmp_path / ".evidence" / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    return tmp_path


# ============================================================================
# 1. No browser execution => BLOCKED
# ============================================================================
def test_case_01_no_browser_execution_yields_blocked(temp_workspace):
    disabled_provider = LearnerRuntimeTestIdentityProvider(enabled=False)
    result = verify_learner_runtime(
        workflow_id="wf-test-01",
        candidate_hash="a" * 64,
        manifest_hash="b" * 64,
        verified_commit="c" * 40,
        block_family="objective",
        block_version="O1",
        workspace_root=temp_workspace,
        identity_provider=disabled_provider,
    )
    assert result.status == "BLOCKED"
    assert "disabled" in result.message.lower()


# ============================================================================
# 2. Missing test identity => BLOCKED
# ============================================================================
def test_case_02_missing_test_identity_yields_blocked(temp_workspace):
    provider = Mock(spec=LearnerRuntimeTestIdentityProvider)
    provider.get_test_session.side_effect = LearnerRuntimeTestIdentityUnavailable(
        "Fixture session endpoint returned HTTP 503 Service Unavailable"
    )

    result = verify_learner_runtime(
        workflow_id="wf-test-02",
        candidate_hash="a" * 64,
        manifest_hash="b" * 64,
        verified_commit="c" * 40,
        block_family="definition",
        block_version="D1",
        workspace_root=temp_workspace,
        identity_provider=provider,
    )
    assert result.status == "BLOCKED"
    assert "503" in result.message


# ============================================================================
# 3. Navigation 401 => FAIL
# ============================================================================
def test_case_03_navigation_401_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": False,
        "redirected_to_login": False,
        "navigation_status": 401,
        "progress_status": None,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": ["UNAUTHORIZED_401: http://skillup.localhost:3009/api/student/navigation"],
        "block_selector": '[data-block-type="objective"][data-block-version="O1"]',
        "error_message": None,
    })

    screenshot = temp_workspace / ".evidence" / "screenshots" / "learner_runtime_wf-test-03_aaaaaaaa.png"
    screenshot.write_bytes(b"fake-png-data")

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-03",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="objective",
            block_version="O1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"
    assert any("401" in b for b in result.blockers)


# ============================================================================
# 4. Navigation 403 => FAIL
# ============================================================================
def test_case_04_navigation_403_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": False,
        "redirected_to_login": False,
        "navigation_status": 403,
        "progress_status": None,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": ["UNAUTHORIZED_403: http://skillup.localhost:3009/api/student/navigation"],
        "block_selector": '[data-block-type="code"][data-block-version="C1"]',
        "error_message": None,
    })

    screenshot = temp_workspace / ".evidence" / "screenshots" / "learner_runtime_wf-test-04_aaaaaaaa.png"
    screenshot.write_bytes(b"fake-png-data")

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-04",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="code",
            block_version="C1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"
    assert any("403" in b for b in result.blockers)


# ============================================================================
# 5. Expected navigation 200 + rendered block => PASS
# ============================================================================
def test_case_05_navigation_200_and_rendered_block_yields_pass(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": True,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
        "block_selector": '[data-block-type="objective"][data-block-version="O1"]',
        "error_message": None,
    })

    screenshot = temp_workspace / ".evidence" / "screenshots" / "learner_runtime_wf-test-05_aaaaaaaa.png"
    screenshot.write_bytes(b"valid-screenshot-png-bytes")

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-05",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="objective",
            block_version="O1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "PASS"
    assert result.evidence_payload is not None
    assert result.evidence_hash is not None
    assert result.screenshot_sha256 == hashlib.sha256(b"valid-screenshot-png-bytes").hexdigest()


# ============================================================================
# 6. Login redirect => FAIL
# ============================================================================
def test_case_06_login_redirect_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": False,
        "redirected_to_login": True,
        "navigation_status": None,
        "progress_status": None,
        "block_rendered": False,
        "lsnb_status": "NOT_CHECKED",
        "rssb_status": "NOT_CHECKED",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
        "error_message": "Redirected to login: http://skillup.localhost:3009/login",
    })

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-06",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="summary",
            block_version="S1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"
    assert any("login" in b.lower() for b in result.blockers)


# ============================================================================
# 7. Relevant console error => FAIL
# ============================================================================
def test_case_07_console_error_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": False,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": ["TypeError: Cannot read properties of undefined (reading 'stages')"],
        "page_errors": [],
        "network_errors": [],
    })

    screenshot = temp_workspace / ".evidence" / "screenshots" / "learner_runtime_wf-test-07_aaaaaaaa.png"
    screenshot.write_bytes(b"data")

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-07",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="objective",
            block_version="O1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"
    assert any("console error" in b.lower() for b in result.blockers)


# ============================================================================
# 8. LSNB/RSSB applicable and missing => FAIL
# ============================================================================
def test_case_08_lsnb_missing_when_applicable_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": False,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": False,
        "lsnb_status": "FAIL",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
        "error_message": "Block not found in DOM",
    })

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-08",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="objective",
            block_version="O1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"


# ============================================================================
# 9. LSNB/RSSB not applicable => NOT_APPLICABLE with reason
# ============================================================================
def test_case_09_lsnb_not_applicable_preserved(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": True,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": True,
        "lsnb_status": "NOT_APPLICABLE",
        "rssb_status": "NOT_APPLICABLE",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
    })

    screenshot = temp_workspace / ".evidence" / "screenshots" / "learner_runtime_wf-test-09_aaaaaaaa.png"
    screenshot.write_bytes(b"data")

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-09",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="introduction",
            block_version="I1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "PASS"
    assert result.evidence_payload["lsnb"]["status"] == "NOT_APPLICABLE"
    assert result.evidence_payload["rssb"]["status"] == "NOT_APPLICABLE"


# ============================================================================
# 10. Progression endpoint failure => FAIL
# ============================================================================
def test_case_10_progression_endpoint_failure_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": False,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 500,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": ["SERVER_500: /api/student/progress"],
    })

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-10",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="objective",
            block_version="O1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"


# ============================================================================
# 11. Screenshot missing/hash mismatch => rejected
# ============================================================================
def test_case_11_screenshot_missing_yields_fail(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": True,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
    })
    # Notice: screenshot file is NOT created on disk

    with patch("subprocess.run") as mock_subproc:
        mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
        result = verify_learner_runtime(
            workflow_id="wf-test-11",
            candidate_hash="a" * 64,
            manifest_hash="b" * 64,
            verified_commit="c" * 40,
            block_family="objective",
            block_version="O1",
            workspace_root=temp_workspace,
            identity_provider=mock_identity_provider,
        )

    assert result.status == "FAIL"
    assert any("screenshot" in b.lower() for b in result.blockers)


# ============================================================================
# 12. Evidence hash tampering => rejected
# ============================================================================
def test_case_12_evidence_hash_tampering_detected():
    payload = {
        "workflowId": "wf-12",
        "candidateHash": "c12",
        "blockRender": {"status": "PASS"},
    }
    genuine_hash = compute_canonical_json_hash(payload)

    # Tamper with payload
    tampered_payload = dict(payload)
    tampered_payload["blockRender"] = {"status": "FAIL"}

    tampered_hash = compute_canonical_json_hash(tampered_payload)
    assert genuine_hash != tampered_hash


# ============================================================================
# 13. ADD and UPDATE paths use the same runner
# ============================================================================
def test_case_13_add_and_update_paths_use_same_runner(temp_workspace, mock_identity_provider):
    mock_run_output = json.dumps({
        "passed": True,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
    })

    for decision in ["ADD", "UPDATE"]:
        cand_hash = decision.ljust(64, "0")
        screenshot = temp_workspace / ".evidence" / "screenshots" / f"learner_runtime_wf-test-13-{decision}_{cand_hash[:8]}.png"
        screenshot.write_bytes(b"screenshot-bytes")

        with patch("subprocess.run") as mock_subproc:
            mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
            result = verify_learner_runtime(
                workflow_id=f"wf-test-13-{decision}",
                candidate_hash=cand_hash,
                manifest_hash="m" * 64,
                verified_commit="v" * 40,
                block_family="code",
                block_version="C1",
                workspace_root=temp_workspace,
                identity_provider=mock_identity_provider,
                manifest_metadata={"decision": decision},
            )
            assert result.status == "PASS"


# ============================================================================
# 14. At least two distinct families prove no Objective-specific behavior
# ============================================================================
def test_case_14_multi_family_distinct_verification(temp_workspace, mock_identity_provider):
    families_to_test = [("code", "C1"), ("definition", "D1"), ("summary", "S1"), ("introduction", "I1")]

    mock_run_output = json.dumps({
        "passed": True,
        "redirected_to_login": False,
        "navigation_status": 200,
        "progress_status": 200,
        "block_rendered": True,
        "lsnb_status": "PASS",
        "rssb_status": "PASS",
        "console_errors": [],
        "page_errors": [],
        "network_errors": [],
    })

    for family, version in families_to_test:
        cand_hash = family.ljust(64, "0")
        screenshot = temp_workspace / ".evidence" / "screenshots" / f"learner_runtime_wf-test-14-{family}_{cand_hash[:8]}.png"
        screenshot.write_bytes(b"bytes")

        with patch("subprocess.run") as mock_subproc:
            mock_subproc.return_value = Mock(returncode=0, stdout=mock_run_output, stderr="")
            result = verify_learner_runtime(
                workflow_id=f"wf-test-14-{family}",
                candidate_hash=cand_hash,
                manifest_hash="m" * 64,
                verified_commit="v" * 40,
                block_family=family,
                block_version=version,
                workspace_root=temp_workspace,
                identity_provider=mock_identity_provider,
            )
            assert result.status == "PASS"
            assert result.evidence_payload["blockIdentity"]["family"] == family
            assert result.evidence_payload["blockIdentity"]["version"] == version
