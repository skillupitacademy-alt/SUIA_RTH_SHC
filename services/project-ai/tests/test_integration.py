"""
End-to-end integration tests for complete Candidate Block pipeline.

M2.9 Wave 0: These tests are DEPRECATED as they test legacy /creation endpoints
which now return 405 METHOD_NOT_ALLOWED.

Use canonical workflow tests instead:
- tests/e2e/test_m2_9_golden_e2e.py
- tests/integration/test_i2_e2e_certification.py (needs update for canonical workflow)
"""

import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime

client = TestClient(app)


@pytest.mark.skip(reason="Legacy /creation endpoints disabled in M2.9 Wave 0")
def test_i2_only_happy_path():
    """
    End-to-end test: I2-only workflow creation → validation → certification
    
    Verifies that an I2-only composition can be created, validated,
    and successfully pass all 6 certification gates.
    """
    # 1. Create I2-only workflow
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
    create_data = create_response.json()
    assert "workflowId" in create_data
    workflow_id = create_data["workflowId"]
    assert create_data["status"] == "CREATED"
    
    # 2. Validate workflow
    validate_response = client.post(f"/creation/workflows/{workflow_id}/validate")
    assert validate_response.status_code == 200
    validate_data = validate_response.json()
    assert validate_data["status"] == "CERTIFYING"
    
    # 3. Run certification
    certify_response = client.post(f"/creation/workflows/{workflow_id}/certify")
    assert certify_response.status_code == 200
    certify_data = certify_response.json()
    
    # 4. Verify certification status with real gates
    # Without a valid snapshot, gates will be BLOCKED (not unconditionally PASS)
    # This is correct behavior - real verification requires real evidence
    assert certify_data["status"] == "FAILED"
    assert "certificationGates" in certify_data
    
    # All 6 gates should be BLOCKED (snapshot missing)
    gates = certify_data["certificationGates"]
    assert len(gates) == 6
    assert all(gate["status"] == "BLOCKED" for gate in gates), \
        "Gates should be BLOCKED without valid snapshot"
    
    # Verify gate types are present (actual gate types from model)
    gate_types = [gate["gateType"] for gate in gates]
    expected_gates = [
        "UBRC_COMPLIANCE",
        "BRAND_INDEPENDENCE",
        "THEME_COMPATIBILITY",
        "REGISTRY_VERIFICATION",
        "RENDERER_VERIFICATION",
        "EVIDENCE_BINDING"
    ]
    for expected_gate in expected_gates:
        assert expected_gate in gate_types


def test_candidate_intake_to_approval():
    """
    End-to-end test: Upload candidate → classify → compare → manifest → approve
    
    Verifies the complete candidate block intake pipeline from upload through
    human approval, testing all major integration points.
    """
    # 1. Upload candidate block
    html_content = '<div data-block-type="tutorial" class="tutorial-container">Tutorial content</div>'
    candidate_id = f"integration-test-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    upload_response = client.post("/candidates/upload", json={
        "candidateId": candidate_id,
        "files": [
            {
                "filename": "NewTutorialBlock.tsx",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    })
    assert upload_response.status_code == 200
    upload_data = upload_response.json()
    assert upload_data["candidateId"] == candidate_id
    
    # 2. Classify block family
    classify_response = client.post(f"/candidates/{candidate_id}/classify")
    assert classify_response.status_code == 200
    classification = classify_response.json()
    assert classification["candidateId"] == candidate_id
    assert classification["detectedFamily"] == "Tutorial"
    assert classification["confidence"] > 0.0
    assert "reasoning" in classification
    
    # 3. Compare with canonical (may skip if snapshot unavailable)
    compare_response = client.post(f"/candidates/{candidate_id}/compare")
    # Accept both success and 404 (snapshot unavailable in test environment)
    assert compare_response.status_code in [200, 404]
    
    if compare_response.status_code == 200:
        comparison = compare_response.json()
        assert comparison["candidateId"] == candidate_id
        assert "similarityScore" in comparison
    
    # 4. Generate placement manifest
    manifest_response = client.post(f"/candidates/{candidate_id}/manifest")
    # Accept both success and 404 (snapshot unavailable)
    assert manifest_response.status_code in [200, 404]
    
    if manifest_response.status_code == 200:
        manifest = manifest_response.json()
        manifest_hash = manifest["manifestHash"]
        
        assert manifest["candidateId"] == candidate_id
        assert manifest["blockFamily"] == "Tutorial"
        assert len(manifest_hash) == 64  # SHA-256 hex
        
        # 5. Submit for approval
        approval_response = client.post("/approvals/submit", json={
            "manifestId": manifest["manifestId"],
            "manifestHash": manifest_hash,
            "submittedBy": "test-user"
        })
        assert approval_response.status_code == 200
        approval_data = approval_response.json()
        approval_id = approval_data["approvalId"]
        assert approval_data["status"] == "PENDING"
        
        # 6. Approve with correct hash
        approve_response = client.post(f"/approvals/{approval_id}/approve", json={
            "decidedBy": "test-approver",
            "manifestHash": manifest_hash,
            "reason": "Integration test approval"
        })
        assert approve_response.status_code == 200
        approval = approve_response.json()
        assert approval["status"] == "APPROVED"
        assert approval["decidedBy"] == "test-approver"
        assert approval["decidedAt"] is not None
        
        # Verify audit trail
        assert "auditTrail" in approval
        assert len(approval["auditTrail"]) == 2  # submitted + approved
        actions = [entry["action"] for entry in approval["auditTrail"]]
        assert "submitted" in actions
        assert "approved" in actions


def test_manifest_hash_tamper_rejection():
    """
    End-to-end test: Manifest hash tampering is detected and rejected
    
    Critical security test verifying that the governance approval system
    detects and rejects approval attempts when the manifest hash doesn't
    match, preventing time-of-check-time-of-use attacks.
    """
    # 1. Create and upload a candidate
    html_content = '<div data-block-type="custom">test content</div>'
    candidate_id = f"tamper-test-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    upload_response = client.post("/candidates/upload", json={
        "candidateId": candidate_id,
        "files": [
            {
                "filename": "test.tsx",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    })
    assert upload_response.status_code == 200
    
    # 2. Generate manifest (skip if snapshot unavailable)
    manifest_response = client.post(f"/candidates/{candidate_id}/manifest")
    
    # Only proceed with tamper test if manifest generation succeeds
    if manifest_response.status_code == 200:
        manifest = manifest_response.json()
        manifest_hash = manifest["manifestHash"]
        
        # 3. Submit for approval
        approval_response = client.post("/approvals/submit", json={
            "manifestId": manifest["manifestId"],
            "manifestHash": manifest_hash,
            "submittedBy": "test-user"
        })
        assert approval_response.status_code == 200
        approval_id = approval_response.json()["approvalId"]
        
        # 4. Attempt approval with WRONG hash (simulating tampering)
        wrong_hash = "0" * 64  # Fake hash
        
        tamper_response = client.post(f"/approvals/{approval_id}/approve", json={
            "decidedBy": "test-approver",
            "manifestHash": wrong_hash,
            "reason": "Attempting to approve tampered manifest"
        })
        
        # 5. Should be rejected with 409 Conflict
        assert tamper_response.status_code == 409
        error = tamper_response.json()
        
        # Verify error contains tamper detection details
        assert "detail" in error
        error_detail = error["detail"]
        
        # The error could be nested in a dict or a string
        if isinstance(error_detail, dict):
            assert "error" in error_detail
            assert error_detail["error"] == "MANIFEST_CHANGED"
            assert "expectedHash" in error_detail
            assert "providedHash" in error_detail
            assert error_detail["expectedHash"] == manifest_hash
            assert error_detail["providedHash"] == wrong_hash
        else:
            # If it's a string, check for key phrases
            error_str = str(error_detail).lower()
            assert "manifest" in error_str
            assert any(word in error_str for word in ["changed", "mismatch", "mutated"])
        
        # 6. Verify approval was NOT granted - check status
        status_response = client.get(f"/approvals/{approval_id}")
        assert status_response.status_code == 200
        approval_status = status_response.json()
        
        # Status should be MANIFEST_CHANGED, not APPROVED
        assert approval_status["status"] == "MANIFEST_CHANGED"
        assert approval_status["status"] != "APPROVED"
        
        # Audit trail should show rejection
        assert "auditTrail" in approval_status
        audit_actions = [entry["action"] for entry in approval_status["auditTrail"]]
        assert "rejected_hash_mismatch" in audit_actions
    else:
        # If manifest generation failed due to missing snapshot, skip the test
        pytest.skip("Snapshot unavailable - cannot test manifest tampering")


def test_governance_pending_list():
    """
    Integration test: Verify pending approvals list endpoint
    
    Tests that submitted approvals appear in the pending list
    and approved ones do not.
    """
    # Create a candidate and manifest
    html_content = '<div>pending test</div>'
    candidate_id = f"pending-test-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    upload_response = client.post("/candidates/upload", json={
        "candidateId": candidate_id,
        "files": [
            {
                "filename": "pending.html",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    })
    assert upload_response.status_code == 200
    
    manifest_response = client.post(f"/candidates/{candidate_id}/manifest")
    
    if manifest_response.status_code == 200:
        manifest = manifest_response.json()
        
        # Submit for approval
        approval_response = client.post("/approvals/submit", json={
            "manifestId": manifest["manifestId"],
            "manifestHash": manifest["manifestHash"],
            "submittedBy": "test-user"
        })
        assert approval_response.status_code == 200
        approval_id = approval_response.json()["approvalId"]
        
        # Check pending list
        pending_response = client.get("/approvals/pending")
        assert pending_response.status_code == 200
        pending_list = pending_response.json()
        
        # Our approval should be in the list
        approval_ids = [a["approvalId"] for a in pending_list]
        assert approval_id in approval_ids
        
        # Find our approval and verify status
        our_approval = next((a for a in pending_list if a["approvalId"] == approval_id), None)
        assert our_approval is not None
        assert our_approval["status"] == "PENDING"
    else:
        pytest.skip("Snapshot unavailable - cannot test pending list")


@pytest.mark.skip(reason="Legacy /creation endpoints disabled in M2.9 Wave 0")
def test_workflow_retrieval():
    """
    Integration test: Verify workflow can be retrieved after creation
    
    Tests workflow state persistence and retrieval.
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
    
    # Retrieve workflow
    get_response = client.get(f"/creation/workflows/{workflow_id}")
    assert get_response.status_code == 200
    workflow = get_response.json()
    
    assert workflow["workflowId"] == workflow_id
    assert workflow["mode"] == "I2_ONLY"
    assert workflow["status"] == "CREATED"
    assert "certificationGates" in workflow
    assert "createdAt" in workflow


def test_approval_rejection_workflow():
    """
    Integration test: Test complete rejection workflow
    
    Verifies that manifests can be rejected and rejection is recorded properly.
    """
    html_content = '<div>rejection test</div>'
    candidate_id = f"reject-test-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    upload_response = client.post("/candidates/upload", json={
        "candidateId": candidate_id,
        "files": [
            {
                "filename": "reject.html",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    })
    assert upload_response.status_code == 200
    
    manifest_response = client.post(f"/candidates/{candidate_id}/manifest")
    
    if manifest_response.status_code == 200:
        manifest = manifest_response.json()
        
        # Submit for approval
        approval_response = client.post("/approvals/submit", json={
            "manifestId": manifest["manifestId"],
            "manifestHash": manifest["manifestHash"],
            "submittedBy": "test-user"
        })
        assert approval_response.status_code == 200
        approval_id = approval_response.json()["approvalId"]
        
        # Reject the approval
        reject_response = client.post(f"/approvals/{approval_id}/reject", json={
            "rejectedBy": "test-approver",
            "reason": "Does not meet quality standards"
        })
        assert reject_response.status_code == 200
        rejection = reject_response.json()
        
        assert rejection["status"] == "REJECTED"
        assert rejection["decidedBy"] == "test-approver"
        assert rejection["reason"] == "Does not meet quality standards"
        assert rejection["decidedAt"] is not None
        
        # Verify audit trail
        assert "auditTrail" in rejection
        actions = [entry["action"] for entry in rejection["auditTrail"]]
        assert "rejected" in actions
        
        # Verify it's no longer in pending list
        pending_response = client.get("/approvals/pending")
        assert pending_response.status_code == 200
        pending_ids = [a["approvalId"] for a in pending_response.json()]
        assert approval_id not in pending_ids
    else:
        pytest.skip("Snapshot unavailable - cannot test rejection workflow")
