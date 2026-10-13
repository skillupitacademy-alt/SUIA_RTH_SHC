"""Tests for health check endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """Test GET /health returns 200 with status=ok."""
    response = client.get("/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "m2.8"
    assert "timestamp" in data


def test_health_check_response_structure():
    """Test health check response has required fields."""
    response = client.get("/health")
    data = response.json()
    
    required_fields = ["status", "version", "timestamp"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
