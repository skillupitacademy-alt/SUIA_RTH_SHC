"""Tests for snapshot endpoint."""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_snapshot():
    """Mock snapshot data."""
    return {
        "metadata": {
            "generatedAt": "2025-01-27T00:00:00Z",
            "scannerVersion": "M2.7"
        },
        "applications": [],
        "packages": [],
        "services": [],
        "evidence": [
            {
                "evidenceId": "file:test.ts",
                "kind": "file",
                "path": "test.ts",
                "lifecycle": "current",
                "scannerName": "D1-structure-scanner",
                "timestamp": "2025-01-27T00:00:00Z",
                "claim": "Test evidence"
            }
        ],
        "findings": []
    }


@patch("app.repository.discovery_client.Path.exists")
@patch("builtins.open", create=True)
def test_get_snapshot_success(mock_open, mock_exists, mock_snapshot):
    """Test GET /snapshot returns snapshot data when file exists."""
    mock_exists.return_value = True
    mock_open.return_value.__enter__.return_value.read.return_value = json.dumps(mock_snapshot)
    
    response = client.get("/snapshot")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify required top-level keys
    assert "metadata" in data
    assert "applications" in data
    assert "packages" in data
    assert "services" in data
    assert "evidence" in data
    assert "findings" in data


@patch("app.repository.discovery_client.Path.exists")
def test_get_snapshot_file_not_found(mock_exists):
    """Test GET /snapshot returns 404 when snapshot file doesn't exist."""
    mock_exists.return_value = False
    
    response = client.get("/snapshot")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@patch("app.repository.discovery_client.Path.exists")
@patch("builtins.open", create=True)
def test_get_snapshot_metadata(mock_open, mock_exists, mock_snapshot):
    """Test GET /snapshot/metadata returns metadata only."""
    mock_exists.return_value = True
    mock_open.return_value.__enter__.return_value.read.return_value = json.dumps(mock_snapshot)
    
    response = client.get("/snapshot/metadata")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "generatedAt" in data
    assert "scannerVersion" in data
