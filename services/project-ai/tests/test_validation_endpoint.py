"""
Integration tests for validation endpoint.

Tests:
1. I2-only creation validated end-to-end
2. Compatible composition validated
3. Incompatible composition blocked with specific errors

Note: These tests currently test the failure path (snapshot not found).
Full integration tests with mocked snapshots require more complex setup.
Unit tests in test_i2_validation.py cover the actual validation logic.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_i2_snapshot():
    """Mock complete I2 snapshot."""
    return {
        "metadata": {
            "generatedAt": "2025-01-27T00:00:00Z",
            "scannerVersion": "M2.7"
        },
        "blocks": {
            "verified": [
                {
                    "blockType": "introduction",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "text",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "code",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "quiz",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "summary",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                }
            ]
        },
        "evidence": [],
        "findings": []
    }


@pytest.fixture
def mock_incomplete_snapshot():
    """Mock incomplete I2 snapshot (missing blocks)."""
    return {
        "metadata": {
            "generatedAt": "2025-01-27T00:00:00Z",
            "scannerVersion": "M2.7"
        },
        "blocks": {
            "verified": [
                {
                    "blockType": "introduction",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "text",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                }
                # Missing: code, quiz, summary
            ]
        },
        "evidence": [],
        "findings": []
    }


@pytest.fixture
def mock_incompatible_snapshot():
    """Mock snapshot with incompatible components."""
    return {
        "metadata": {
            "generatedAt": "2025-01-27T00:00:00Z",
            "scannerVersion": "M2.7"
        },
        "blocks": {
            "verified": [
                {
                    "blockType": "introduction",
                    "version": "1.0.0",
                    "registry": "core",
                    "renderer": "TutorialBlockRenderer",
                    "runtime": "react",
                    "registered": True,
                    "rendered": True,
                    "ubrcStatus": "UBRC_VALID"
                },
                {
                    "blockType": "text",
                    "version": "0.5.0",  # Pre-release version
                    "registry": "unknown",  # Invalid registry
                    "renderer": "VueRenderer",  # Wrong renderer
                    "runtime": "vue",  # Wrong runtime
                    "registered": False,  # Not registered
                    "rendered": False,  # No renderer
                    "ubrcStatus": "UBRC_MISSING"
                }
            ]
        },
        "evidence": [],
        "findings": []
    }


@patch("app.api.routes.creation.DiscoveryClient")
def test_validate_snapshot_not_found(mock_discovery_client):
    """Test validation fails gracefully when snapshot not found."""
    mock_discovery_client.return_value.load_snapshot.side_effect = FileNotFoundError("Snapshot not found")
    
    # Create workflow
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {
            "base": "I2"
        },
        "candidateBlocks": []
    })
    workflow_id = create_response.json()["workflowId"]
    
    # Validate workflow
    validate_response = client.post(f"/creation/workflows/{workflow_id}/validate")
    
    assert validate_response.status_code == 200
    data = validate_response.json()
    assert data["status"] == "FAILED"
    
    # All gates should be blocked
    blocked_gates = [g for g in data["certificationGates"] if g["status"] == "BLOCKED"]
    assert len(blocked_gates) == 6
    
    # Check that blockers mention snapshot not found
    all_blockers = []
    for gate in data["certificationGates"]:
        all_blockers.extend(gate["blockers"])
    
    assert any("snapshot not found" in blocker.lower() for blocker in all_blockers)


def test_validate_workflow_not_found():
    """Test validation returns 404 for non-existent workflow."""
    validate_response = client.post("/creation/workflows/nonexistent/validate")
    assert validate_response.status_code == 404
