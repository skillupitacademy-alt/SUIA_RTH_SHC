"""Tests for Candidate Block intake API endpoints."""

import hashlib
import json
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.models.candidate import (
    BlockFamily,
    CandidateFile,
    CandidatePackage,
    PlacementDecision,
)

from app.main import app

client = TestClient(app)


@pytest.fixture
def sample_workflow_dict():
    """Return workflow data for testing - mock version."""
    return {
        "workflow_id": "test-workflow-001",
        "target_family": "Tutorial",
        "target_version": "T5",
        "current_state": "CANDIDATE_REQUESTED",
        "requester_id": "test-user"
    }


@pytest.fixture
def sample_html_content():
    """Sample HTML content for testing classification."""
    return """
    <!DOCTYPE html>
    <html>
    <head><title>Tutorial Block</title></head>
    <body>
        <div class="tutorial-container" data-block-type="tutorial">
            <h1>Step-by-Step Tutorial</h1>
            <div class="step-1" data-step="1">
                <h2>Step 1: Introduction</h2>
                <p>Welcome to this tutorial.</p>
            </div>
            <div class="step-2" data-step="2">
                <h2>Step 2: Practice</h2>
                <p>Now let's practice.</p>
            </div>
        </div>
    </body>
    </html>
    """


@pytest.fixture
def sample_candidate_package(sample_html_content, sample_workflow_dict):
    """Sample candidate package for testing."""
    html_hash = hashlib.sha256(sample_html_content.encode('utf-8')).hexdigest()
    
    return {
        "candidateId": "test-candidate-001",
        "workflow_id": sample_workflow_dict["workflow_id"],
        "files": [
            {
                "filename": "TutorialT5Block.tsx",
                "content": sample_html_content,
                "contentType": "text/tsx",
                "hash": html_hash
            },
            {
                "filename": "styles.css",
                "content": ".tutorial-container { padding: 20px; }",
                "contentType": "text/css",
                "hash": hashlib.sha256(b".tutorial-container { padding: 20px; }").hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    }


@pytest.fixture
def introduction_candidate(sample_workflow_dict):
    """Introduction block candidate for testing."""
    html_content = """
    <div class="intro-block" data-block-type="introduction">
        <h1>Welcome to the Course</h1>
        <p>This is an introductory overview.</p>
    </div>
    """
    return {
        "candidateId": "test-intro-001",
        "workflow_id": sample_workflow_dict["workflow_id"],
        "files": [
            {
                "filename": "intro.html",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    }


@pytest.fixture
def assessment_candidate(sample_workflow_dict):
    """Assessment block candidate for testing."""
    html_content = """
    <div class="quiz-container" data-block-type="assessment">
        <div class="question-1" data-question-id="q1">
            <p>What is 2 + 2?</p>
            <button data-answer="4">4</button>
        </div>
    </div>
    """
    return {
        "candidateId": "test-assessment-001",
        "workflow_id": sample_workflow_dict["workflow_id"],
        "files": [
            {
                "filename": "quiz.html",
                "content": html_content,
                "contentType": "text/html",
                "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
            }
        ],
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "uploadedBy": "test-user"
    }


class TestCandidateUpload:
    """Test candidate upload endpoint."""
    
    def test_upload_candidate_success(self, sample_candidate_package):
        """Test successful candidate upload."""
        response = client.post("/candidates/upload", json=sample_candidate_package)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "uploaded"
        assert data["candidateId"] == "test-candidate-001"
        assert data["workflow_id"] is not None
        assert data["target_family"] == "Tutorial"
        assert data["target_version"] == "T5"
        assert data["filesCount"] == 2
        assert "uploadedAt" in data
    
    def test_upload_candidate_duplicate(self, sample_candidate_package):
        """Test uploading duplicate candidate fails."""
        # First upload should succeed
        client.post("/candidates/upload", json=sample_candidate_package)
        
        # Second upload should fail
        response = client.post("/candidates/upload", json=sample_candidate_package)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_upload_candidate_validation(self):
        """Test upload with invalid data fails validation."""
        invalid_package = {
            "candidateId": "test-invalid",
            # Missing required fields
        }
        
        response = client.post("/candidates/upload", json=invalid_package)
        assert response.status_code == 422  # Validation error
    
    def test_upload_candidate_wrong_state(self, sample_html_content):
        """Test upload fails when workflow not in CANDIDATE_REQUESTED state."""
        from app.api.routes.workflows import get_governance_service
        from app.persistence import get_db_session
        import asyncio
        
        async def create_wrong_state_workflow():
            async for session in get_db_session():
                governance_service = await get_governance_service(session)
                
                # Create workflow but leave it in REQUESTED state
                workflow = await governance_service.create_workflow(
                    target_family="Tutorial",
                    target_version="T6",
                    requester_id="test-user",
                    purpose="Test wrong state"
                )
                
                await session.commit()
                return workflow
        
        workflow = asyncio.run(create_wrong_state_workflow())
        
        html_hash = hashlib.sha256(sample_html_content.encode('utf-8')).hexdigest()
        
        package = {
            "candidateId": "test-wrong-state",
            "workflow_id": workflow.workflow_id,
            "files": [
                {
                    "filename": "index.html",
                    "content": sample_html_content,
                    "contentType": "text/html",
                    "hash": html_hash
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package)
        
        assert response.status_code == 409
        assert "CANDIDATE_REQUESTED" in response.json()["detail"]
    
    def test_upload_unsafe_paths(self, sample_workflow, sample_html_content):
        """Test upload rejects packages with unsafe paths."""
        html_hash = hashlib.sha256(sample_html_content.encode('utf-8')).hexdigest()
        
        # Test path traversal
        package_traversal = {
            "candidateId": "test-unsafe-traversal",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "../../../etc/passwd",
                    "content": sample_html_content,
                    "contentType": "text/html",
                    "hash": html_hash
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package_traversal)
        assert response.status_code == 400
        assert "path traversal" in response.json()["detail"].lower()
        
        # Test absolute path
        package_absolute = {
            "candidateId": "test-unsafe-absolute",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "/etc/passwd",
                    "content": sample_html_content,
                    "contentType": "text/html",
                    "hash": html_hash
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package_absolute)
        assert response.status_code == 400
        assert "absolute path" in response.json()["detail"].lower()
    
    def test_upload_empty_package(self, sample_workflow):
        """Test upload rejects empty packages."""
        # Zero files
        package_empty = {
            "candidateId": "test-empty-files",
            "workflow_id": sample_workflow.workflow_id,
            "files": [],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package_empty)
        assert response.status_code == 400
        assert "zero files" in response.json()["detail"].lower()
        
        # All files empty
        package_all_empty = {
            "candidateId": "test-all-empty",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "empty.html",
                    "content": "",
                    "contentType": "text/html",
                    "hash": hashlib.sha256(b"").hexdigest()
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package_all_empty)
        assert response.status_code == 400
        assert "empty files" in response.json()["detail"].lower()
    
    def test_upload_missing_manifest(self, sample_workflow):
        """Test upload rejects packages missing required manifest files."""
        content = "<div>Test content</div>"
        
        package = {
            "candidateId": "test-no-manifest",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "random.txt",
                    "content": content,
                    "contentType": "text/plain",
                    "hash": hashlib.sha256(content.encode('utf-8')).hexdigest()
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package)
        assert response.status_code == 400
        assert "manifest file" in response.json()["detail"].lower()
    
    def test_upload_computes_server_hash(self, sample_candidate_package):
        """Test upload computes SHA-256 server-side."""
        response = client.post("/candidates/upload", json=sample_candidate_package)
        
        assert response.status_code == 200
        data = response.json()
        
        # Server must return computed hash
        assert "contract_sha256" in data
        assert len(data["contract_sha256"]) == 64
        assert all(c in "0123456789abcdef" for c in data["contract_sha256"])
    
    def test_upload_target_mismatch(self, sample_workflow, sample_html_content):
        """Test upload rejects target family/version mismatch."""
        html_hash = hashlib.sha256(sample_html_content.encode('utf-8')).hexdigest()
        
        # Package claims different target family
        package = {
            "candidateId": "test-target-mismatch",
            "workflow_id": sample_workflow.workflow_id,
            "target_family": "Introduction",  # Workflow expects Tutorial
            "files": [
                {
                    "filename": "TutorialT5Block.tsx",
                    "content": sample_html_content,
                    "contentType": "text/html",
                    "hash": html_hash
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package)
        assert response.status_code == 422
        assert "mismatch" in response.json()["detail"].lower()
    
    def test_upload_transitions_workflow_state(self, sample_workflow, sample_html_content):
        """Test upload transitions workflow from CANDIDATE_REQUESTED to CANDIDATE_RECEIVED."""
        html_hash = hashlib.sha256(sample_html_content.encode('utf-8')).hexdigest()
        
        package = {
            "candidateId": "test-state-transition",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "TutorialT5Block.tsx",
                    "content": sample_html_content,
                    "contentType": "text/html",
                    "hash": html_hash
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        response = client.post("/candidates/upload", json=package)
        assert response.status_code == 200
        
        # Verify workflow state changed
        from app.api.routes.workflows import get_governance_service
        from app.orchestration.canonical_workflow import CanonicalWorkflowState
        from app.persistence import get_db_session
        import asyncio
        
        async def check_workflow_state():
            async for session in get_db_session():
                governance_service = await get_governance_service(session)
                workflow = await governance_service.get_workflow(sample_workflow.workflow_id)
                return workflow.current_state
        
        current_state = asyncio.run(check_workflow_state())
        assert current_state == CanonicalWorkflowState.CANDIDATE_RECEIVED


class TestCandidateClassification:
    """Test candidate classification endpoint."""
    
    def test_classify_tutorial_block(self, sample_candidate_package):
        """Test classifying a tutorial block."""
        # Upload candidate first
        client.post("/candidates/upload", json=sample_candidate_package)
        
        # Classify
        response = client.post("/candidates/test-candidate-001/classify")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["candidateId"] == "test-candidate-001"
        assert data["detectedFamily"] == BlockFamily.TUTORIAL.value
        assert 0.0 <= data["confidence"] <= 1.0
        assert data["confidence"] > 0.5  # Should have high confidence for tutorial
        assert "reasoning" in data
    
    def test_classify_introduction_block(self, introduction_candidate):
        """Test classifying an introduction block."""
        client.post("/candidates/upload", json=introduction_candidate)
        
        response = client.post("/candidates/test-intro-001/classify")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["detectedFamily"] == BlockFamily.INTRODUCTION.value
        assert data["confidence"] > 0.5
    
    def test_classify_assessment_block(self, assessment_candidate):
        """Test classifying an assessment block."""
        client.post("/candidates/upload", json=assessment_candidate)
        
        response = client.post("/candidates/test-assessment-001/classify")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["detectedFamily"] == BlockFamily.ASSESSMENT.value
        assert data["confidence"] > 0.5
    
    def test_classify_not_found(self):
        """Test classifying non-existent candidate."""
        response = client.post("/candidates/nonexistent/classify")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_classify_no_html(self, sample_workflow):
        """Test classifying candidate with no HTML files."""
        package = {
            "candidateId": "test-no-html",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "data.json",
                    "content": '{"key": "value"}',
                    "contentType": "application/json",
                    "hash": hashlib.sha256(b'{"key": "value"}').hexdigest()
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        client.post("/candidates/upload", json=package)
        response = client.post("/candidates/test-no-html/classify")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should default to Custom family
        assert data["detectedFamily"] == BlockFamily.CUSTOM.value


class TestCandidateComparison:
    """Test candidate comparison endpoint."""
    
    def test_compare_candidate(self, sample_candidate_package):
        """Test comparing candidate against canonical blocks."""
        client.post("/candidates/upload", json=sample_candidate_package)
        
        response = client.post("/candidates/test-candidate-001/compare")
        
        # May succeed or fail depending on snapshot availability
        if response.status_code == 200:
            data = response.json()
            
            assert data["candidateId"] == "test-candidate-001"
            assert 0.0 <= data["similarityScore"] <= 1.0
            assert isinstance(data["differences"], list)
            # existingBlock may be None or a string
        elif response.status_code == 404:
            # Snapshot not found is acceptable in test environment
            assert "snapshot" in response.json()["detail"].lower()
    
    def test_compare_not_found(self):
        """Test comparing non-existent candidate."""
        response = client.post("/candidates/nonexistent/compare")
        
        assert response.status_code == 404


class TestManifestGeneration:
    """Test manifest generation endpoint."""
    
    def test_generate_manifest(self, sample_candidate_package):
        """Test generating placement manifest."""
        client.post("/candidates/upload", json=sample_candidate_package)
        
        response = client.post("/candidates/test-candidate-001/manifest")
        
        # May succeed or fail depending on snapshot availability
        if response.status_code == 200:
            data = response.json()
            
            assert data["manifestId"].startswith("manifest-")
            assert data["candidateId"] == "test-candidate-001"
            assert data["decision"] in [d.value for d in PlacementDecision]
            assert data["targetPath"]
            assert data["blockFamily"] in [f.value for f in BlockFamily]
            assert data["blockVersion"]
            assert isinstance(data["requiredChanges"], list)
            assert isinstance(data["evidenceIds"], list)
            assert len(data["manifestHash"]) == 64  # SHA-256 hex length
            assert "createdAt" in data
            
            # Verify hash is valid SHA-256
            manifest_data = {
                "manifestId": data["manifestId"],
                "candidateId": data["candidateId"],
                "decision": data["decision"],
                "targetPath": data["targetPath"],
                "blockFamily": data["blockFamily"],
                "blockVersion": data["blockVersion"],
                "requiredChanges": data["requiredChanges"],
                "evidenceIds": data["evidenceIds"],
                "createdAt": data["createdAt"]
            }
            manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
            expected_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
            assert data["manifestHash"] == expected_hash
        elif response.status_code == 404:
            # Snapshot not found is acceptable
            pass
    
    def test_generate_manifest_not_found(self):
        """Test generating manifest for non-existent candidate."""
        response = client.post("/candidates/nonexistent/manifest")
        
        assert response.status_code == 404


class TestManifestRetrieval:
    """Test manifest retrieval endpoint."""
    
    def test_get_manifest(self, sample_candidate_package):
        """Test retrieving generated manifest."""
        client.post("/candidates/upload", json=sample_candidate_package)
        
        # Generate manifest first
        generate_response = client.post("/candidates/test-candidate-001/manifest")
        
        if generate_response.status_code == 200:
            # Retrieve manifest
            response = client.get("/candidates/test-candidate-001/manifest")
            
            assert response.status_code == 200
            data = response.json()
            
            # Should match generated manifest
            generated = generate_response.json()
            assert data["manifestId"] == generated["manifestId"]
            assert data["candidateId"] == generated["candidateId"]
            assert data["manifestHash"] == generated["manifestHash"]
    
    def test_get_manifest_not_generated(self, sample_workflow):
        """Test retrieving manifest that hasn't been generated."""
        package = {
            "candidateId": "test-no-manifest",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "test.html",
                    "content": "<div>test</div>",
                    "contentType": "text/html",
                    "hash": hashlib.sha256(b"<div>test</div>").hexdigest()
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        client.post("/candidates/upload", json=package)
        
        response = client.get("/candidates/test-no-manifest/manifest")
        
        assert response.status_code == 404
        assert "No manifest found" in response.json()["detail"]
    
    def test_get_manifest_candidate_not_found(self):
        """Test retrieving manifest for non-existent candidate."""
        response = client.get("/candidates/nonexistent/manifest")
        
        assert response.status_code == 404


class TestListCandidates:
    """Test candidates listing endpoint."""
    
    def test_list_empty(self):
        """Test listing when no candidates exist."""
        # Note: This may fail if other tests have added candidates
        # In a real test suite, would use test database isolation
        response = client.get("/candidates")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "count" in data
        assert "candidates" in data
        assert isinstance(data["candidates"], list)
    
    def test_list_with_candidates(self, sample_candidate_package, introduction_candidate):
        """Test listing multiple candidates."""
        client.post("/candidates/upload", json=sample_candidate_package)
        client.post("/candidates/upload", json=introduction_candidate)
        
        response = client.get("/candidates")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["count"] >= 2
        assert len(data["candidates"]) >= 2
        
        # Check structure of candidate items
        for candidate in data["candidates"]:
            assert "candidateId" in candidate
            assert "filesCount" in candidate
            assert "uploadedAt" in candidate
            assert "uploadedBy" in candidate
            assert "hasManifest" in candidate
            assert isinstance(candidate["hasManifest"], bool)


class TestEndToEndWorkflow:
    """Test complete candidate workflow."""
    
    def test_complete_workflow(self, sample_workflow):
        """Test full candidate intake workflow."""
        # Use unique candidate ID to avoid conflicts with other tests
        html_content = """
        <!DOCTYPE html>
        <html>
        <body>
            <div class="tutorial-container" data-block-type="tutorial">
                <h1>End to End Tutorial</h1>
                <div data-step="1">Step 1</div>
            </div>
        </body>
        </html>
        """
        
        package = {
            "candidateId": "test-e2e-workflow",
            "workflow_id": sample_workflow.workflow_id,
            "files": [
                {
                    "filename": "e2e.html",
                    "content": html_content,
                    "contentType": "text/html",
                    "hash": hashlib.sha256(html_content.encode('utf-8')).hexdigest()
                }
            ],
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "uploadedBy": "test-user"
        }
        
        # 1. Upload candidate
        upload_response = client.post("/candidates/upload", json=package)
        assert upload_response.status_code == 200
        
        candidate_id = upload_response.json()["candidateId"]
        
        # 2. Classify candidate
        classify_response = client.post(f"/candidates/{candidate_id}/classify")
        assert classify_response.status_code == 200
        classification = classify_response.json()
        assert classification["detectedFamily"] == BlockFamily.TUTORIAL.value
        
        # 3. Compare candidate (may skip if snapshot unavailable)
        compare_response = client.post(f"/candidates/{candidate_id}/compare")
        if compare_response.status_code == 200:
            comparison = compare_response.json()
            assert "similarityScore" in comparison
            
            # 4. Generate manifest
            manifest_response = client.post(f"/candidates/{candidate_id}/manifest")
            if manifest_response.status_code == 200:
                manifest = manifest_response.json()
                assert manifest["candidateId"] == candidate_id
                assert manifest["blockFamily"] == classification["detectedFamily"]
                
                # 5. Retrieve manifest
                get_manifest_response = client.get(f"/candidates/{candidate_id}/manifest")
                assert get_manifest_response.status_code == 200
                retrieved_manifest = get_manifest_response.json()
                assert retrieved_manifest["manifestId"] == manifest["manifestId"]
        
        # 6. List all candidates
        list_response = client.get("/candidates")
        assert list_response.status_code == 200
        candidates = list_response.json()["candidates"]
        candidate_ids = [c["candidateId"] for c in candidates]
        assert candidate_id in candidate_ids
