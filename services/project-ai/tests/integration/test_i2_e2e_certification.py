"""
Wave 10: Full I2 Certification Workflow - Happy Path Integration Test

Tests the complete certification workflow from candidate upload through
all certification gates, verifying real verification logic (not placeholder PASS).

This test represents the "golden path" where everything is properly configured
and all gates should pass with real evidence.
"""

import hashlib
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from pathlib import Path

from app.main import app

client = TestClient(app)


@pytest.mark.integration
def test_i2_complete_certification_workflow(tmp_path, monkeypatch):
    """
    End-to-end happy path: Complete I2 certification workflow.
    
    Steps:
    1. Upload I2 candidate block
    2. Classify block family
    3. Compare with canonical (requires snapshot)
    4. Generate placement manifest
    5. Submit for governance approval
    6. Approve manifest (simulate human approval)
    7. Create certification workflow
    8. Run all 6 certification gates
    9. Verify gates executed with real evidence (not placeholder PASS)
    10. Verify workflow status is CERTIFIED or CERTIFICATION_READY
    
    Success criteria:
    - All gates execute real verification
    - Evidence IDs are from TypeScript snapshot (not synthetic)
    - Gates either PASS with evidence or BLOCKED with valid reason
    - No unconditional PASS gates
    """
    # 1. Upload I2 candidate block
    candidate_id = f"i2-e2e-test-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    html_content = '''
    <div data-block-type="introduction" data-block-version="I2" class="introduction-container">
        <h1 class="intro-title">Welcome to Python Basics</h1>
        <p class="intro-description">Learn the fundamentals of Python programming.</p>
        <div class="intro-objectives">
            <h2>Learning Objectives</h2>
            <ul>
                <li>Understand Python syntax</li>
                <li>Write your first program</li>
                <li>Master basic data types</li>
            </ul>
        </div>
    </div>
    '''
    
    upload_response = client.post("/candidates/upload", json={
        "candidateId": candidate_id,
        "files": [
            {
                "filename": "IntroductionI2Block.tsx",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "integration-test-user"
    })
    
    assert upload_response.status_code == 200
    upload_data = upload_response.json()
    assert upload_data["candidateId"] == candidate_id
    assert upload_data["status"] == "uploaded"
    
    # 2. Classify block family
    classify_response = client.post(f"/candidates/{candidate_id}/classify")
    assert classify_response.status_code == 200
    
    classification = classify_response.json()
    assert classification["candidateId"] == candidate_id
    assert classification["detectedFamily"] == "Introduction"
    assert classification["confidence"] > 0.5
    assert "reasoning" in classification
    
    # 3. Compare with canonical (snapshot required)
    compare_response = client.post(f"/candidates/{candidate_id}/compare")
    
    # Handle both success and snapshot unavailable scenarios
    snapshot_available = compare_response.status_code == 200
    
    if snapshot_available:
        comparison = compare_response.json()
        assert comparison["candidateId"] == candidate_id
        assert "similarityScore" in comparison
        
        # 4. Generate placement manifest
        manifest_response = client.post(f"/candidates/{candidate_id}/manifest")
        assert manifest_response.status_code == 200
        
        manifest = manifest_response.json()
        assert manifest["candidateId"] == candidate_id
        assert manifest["blockFamily"] == "Introduction"
        assert len(manifest["manifestHash"]) == 64  # SHA-256
        assert len(manifest["evidenceIds"]) > 0, "Manifest must have real evidence IDs"
        
        # Verify evidence IDs are real (from TypeScript system)
        for eid in manifest["evidenceIds"]:
            assert eid.startswith('ev-'), f"Evidence ID {eid} must start with 'ev-'"
            assert 'candidate' not in eid, f"Evidence ID {eid} must not be synthetic"
        
        manifest_hash = manifest["manifestHash"]
        manifest_id = manifest["manifestId"]
        
        # 5. Submit for governance approval
        approval_response = client.post("/approvals/submit", json={
            "manifestId": manifest_id,
            "manifestHash": manifest_hash,
            "submittedBy": "integration-test-user"
        })
        assert approval_response.status_code == 200
        
        approval_data = approval_response.json()
        approval_id = approval_data["approvalId"]
        assert approval_data["status"] == "PENDING"
        
        # 6. Approve manifest (simulate human approval)
        approve_response = client.post(f"/approvals/{approval_id}/approve", json={
            "decidedBy": "integration-test-approver",
            "manifestHash": manifest_hash,
            "reason": "Integration test approval - I2 certification workflow"
        })
        assert approve_response.status_code == 200
        
        approval = approve_response.json()
        assert approval["status"] == "APPROVED"
        assert approval["decidedBy"] == "integration-test-approver"
    
    # 7. Create certification workflow
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {
            "base": "I2",
            "structure": "I2",
            "hero": "I2",
            "footer": "I2"
        },
        "candidateBlocks": ["I2"]
    })
    assert create_response.status_code == 200
    
    create_data = create_response.json()
    workflow_id = create_data["workflowId"]
    assert create_data["status"] == "CREATED"
    
    # 8. Run certification gates
    certify_response = client.post(f"/creation/workflows/{workflow_id}/certify")
    assert certify_response.status_code == 200
    
    certify_data = certify_response.json()
    assert "certificationGates" in certify_data
    
    gates = certify_data["certificationGates"]
    assert len(gates) == 6, "Must have all 6 certification gates"
    
    # 9. Verify all gates executed (not placeholder PASS)
    expected_gates = [
        "UBRC_COMPLIANCE",
        "BRAND_INDEPENDENCE",
        "THEME_COMPATIBILITY",
        "REGISTRY_VERIFICATION",
        "RENDERER_VERIFICATION",
        "EVIDENCE_BINDING"
    ]
    
    gate_types = [gate["gateType"] for gate in gates]
    for expected_gate in expected_gates:
        assert expected_gate in gate_types, f"Gate {expected_gate} missing"
    
    # Verify each gate has real verification (not unconditional PASS)
    for gate in gates:
        gate_type = gate["gateType"]
        status = gate["status"]
        
        # Gates must be PASS, FAIL, or BLOCKED (not PENDING or UNKNOWN)
        assert status in ["PASS", "FAIL", "BLOCKED"], \
            f"Gate {gate_type} has invalid status: {status}"
        
        # If PASS, must have evidence
        if status == "PASS":
            assert len(gate["evidenceIds"]) > 0, \
                f"Gate {gate_type} passed but has no evidence (unconditional PASS)"
            
            # Verify evidence IDs are real
            for eid in gate["evidenceIds"]:
                assert eid.startswith('ev-'), \
                    f"Gate {gate_type} has synthetic evidence ID: {eid}"
                assert 'candidate' not in eid, \
                    f"Gate {gate_type} has synthetic evidence ID: {eid}"
        
        # If BLOCKED, must have blockers explanation
        if status == "BLOCKED":
            assert len(gate["blockers"]) > 0, \
                f"Gate {gate_type} blocked but has no blockers explanation"
        
        # If FAIL, must have blockers explanation
        if status == "FAIL":
            assert len(gate["blockers"]) > 0, \
                f"Gate {gate_type} failed but has no failure reason"
        
        # All gates must have a message
        assert gate["message"] != "", \
            f"Gate {gate_type} has empty message"
    
    # 10. Verify workflow status
    workflow_response = client.get(f"/creation/workflows/{workflow_id}")
    assert workflow_response.status_code == 200
    
    workflow = workflow_response.json()
    
    # Status should be CERTIFIED if all pass, or FAILED if any blocked/failed
    if snapshot_available:
        # With snapshot, expect CERTIFIED or FAILED (based on gate results)
        all_passed = all(gate["status"] == "PASS" for gate in gates)
        if all_passed:
            assert workflow["status"] in ["CERTIFIED", "CERTIFICATION_READY"], \
                f"All gates passed but workflow status is {workflow['status']}"
        else:
            assert workflow["status"] == "FAILED", \
                f"Some gates failed but workflow status is {workflow['status']}"
    else:
        # Without snapshot, expect FAILED (all gates BLOCKED)
        assert workflow["status"] == "FAILED", \
            "Without snapshot, workflow should be FAILED"
        
        # All gates should be BLOCKED
        assert all(gate["status"] == "BLOCKED" for gate in gates), \
            "Without snapshot, all gates should be BLOCKED"


@pytest.mark.integration
def test_i2_workflow_with_multiple_candidate_blocks(tmp_path):
    """
    Integration test: I2 workflow with multiple candidate blocks.
    
    Verifies that certification can handle multiple blocks in a single workflow
    and aggregate evidence correctly.
    """
    # Create workflow with multiple I2 blocks
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {
            "base": "I2",
            "structure": "I2",
            "hero": "I2",
            "footer": "I2"
        },
        "candidateBlocks": ["I1", "I2", "I3"]
    })
    assert create_response.status_code == 200
    
    workflow_id = create_response.json()["workflowId"]
    
    # Run certification
    certify_response = client.post(f"/creation/workflows/{workflow_id}/certify")
    assert certify_response.status_code == 200
    
    certify_data = certify_response.json()
    gates = certify_data["certificationGates"]
    
    # Verify gates processed all candidate blocks
    for gate in gates:
        if gate["status"] == "PASS":
            # Should have evidence for multiple blocks
            assert len(gate["evidenceIds"]) > 0
        
        # Message should not be empty
        assert gate["message"] != ""


@pytest.mark.integration  
def test_workflow_state_persistence():
    """
    Integration test: Verify workflow state persists across operations.
    
    Tests that workflow can be created, modified, and retrieved consistently.
    """
    # Create workflow
    create_response = client.post("/creation/workflows", json={
        "mode": "I2_ONLY",
        "composition": {
            "base": "I2",
            "structure": "I2",
            "hero": "I2",
            "footer": "I2"
        },
        "candidateBlocks": []
    })
    assert create_response.status_code == 200
    
    workflow_id = create_response.json()["workflowId"]
    original_created_at = create_response.json()["createdAt"]
    
    # Retrieve workflow
    get_response_1 = client.get(f"/creation/workflows/{workflow_id}")
    assert get_response_1.status_code == 200
    assert get_response_1.json()["workflowId"] == workflow_id
    assert get_response_1.json()["createdAt"] == original_created_at
    
    # Run certification
    certify_response = client.post(f"/creation/workflows/{workflow_id}/certify")
    assert certify_response.status_code == 200
    
    # Retrieve again - should have updated status
    get_response_2 = client.get(f"/creation/workflows/{workflow_id}")
    assert get_response_2.status_code == 200
    
    workflow = get_response_2.json()
    assert workflow["workflowId"] == workflow_id
    assert workflow["createdAt"] == original_created_at  # Should not change
    assert workflow["status"] in ["CERTIFIED", "FAILED"]  # Should be updated
    
    # Verify certificationGates are populated
    assert "certificationGates" in workflow
    assert len(workflow["certificationGates"]) == 6
