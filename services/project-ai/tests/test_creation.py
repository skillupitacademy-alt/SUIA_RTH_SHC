import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.creation import CreationMode, BlockSource

client = TestClient(app)

def test_create_i2_only_workflow():
    """Test I2-only workflow creation"""
    response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {
            "base": "I2",
            "structure": "I2",
            "hero": "I2",
            "footer": "I2"
        },
        "candidateBlocks": []
    })
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "I2_ONLY"
    assert data["status"] == "CREATED"
    assert len(data["certificationGates"]) == 6

def test_create_mix_and_match_workflow():
    """Test Mix-and-Match workflow creation"""
    response = client.post("/creation/workflows", json={
        "mode": "MIX_AND_MATCH",
        "composition": {
            "base": "I2",
            "hero": "CANDIDATE",
            "footer": "I2"
        },
        "candidateBlocks": ["T13"]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "MIX_AND_MATCH"

def test_get_workflow():
    """Test retrieving workflow"""
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {"base": "I2"},
        "candidateBlocks": []
    })
    workflow_id = create_response.json()["workflowId"]
    
    get_response = client.get(f"/creation/workflows/{workflow_id}")
    assert get_response.status_code == 200

def test_validate_workflow():
    """Test workflow validation"""
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {"base": "I2"},
        "candidateBlocks": []
    })
    workflow_id = create_response.json()["workflowId"]
    
    validate_response = client.post(f"/creation/workflows/{workflow_id}/validate")
    assert validate_response.status_code == 200
    assert validate_response.json()["status"] == "CERTIFYING"

def test_certify_workflow():
    """Test workflow certification with all 6 gates"""
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {"base": "I2"},
        "candidateBlocks": []
    })
    workflow_id = create_response.json()["workflowId"]
    
    certify_response = client.post(f"/creation/workflows/{workflow_id}/certify")
    assert certify_response.status_code == 200
    data = certify_response.json()
    assert data["status"] == "CERTIFIED"
    
    gate_types = [gate["gateType"] for gate in data["certificationGates"]]
    assert "UBRC_COMPLIANCE" in gate_types
    assert "BRAND_INDEPENDENCE" in gate_types
    assert "THEME_COMPATIBILITY" in gate_types
    assert "REGISTRY_VERIFICATION" in gate_types
    assert "RENDERER_VERIFICATION" in gate_types
    assert "EVIDENCE_BINDING" in gate_types
    
    assert all(gate["status"] == "PASS" for gate in data["certificationGates"])
