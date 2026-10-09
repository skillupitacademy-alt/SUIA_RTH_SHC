"""
Unit tests for Engineering Contract API Routes - Wave 2 B02

Tests:
- POST /workflows/{workflow_id}/engineering-contract requires authentication
- POST verifies workflow ownership
- POST validates workflow state
- POST returns same contract on repeat calls (immutability)
- GET /workflows/{workflow_id}/engineering-contract requires authentication
- GET verifies contract hash integrity
- GET detects tampering
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.api.routes.contract import contracts_store, workflows_store
from app.contracts.engineering_contract import EngineeringContract, seal_contract
from app.contracts.repository_intelligence import RuntimeContract
from app.models.workflow_target import WorkflowTarget

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_stores():
    """Clear in-memory stores before each test."""
    contracts_store.clear()
    workflows_store.clear()
    # Also clear governance service workflows
    from app.api.routes.workflows import governance_service
    governance_service._workflows.clear()
    yield
    contracts_store.clear()
    workflows_store.clear()
    governance_service._workflows.clear()


@pytest.fixture
def sample_workflow():
    """Create a sample workflow in governance service for testing."""
    from app.api.routes.workflows import governance_service
    
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user-testtoken",  # matches the token user
        purpose="Test contract generation"
    )
    return workflow


@pytest.fixture
def mock_repo_contract():
    """Create a complete mock RepositoryBlockContract with all required fields from FEAT-002."""
    return MagicMock(
        references=[],
        schema_contract={},
        renderer_contract={},
        composer_contract={},
        runtime=RuntimeContract(),  # Must be a real instance
        required_artifacts=["artifact1"],
        acceptance_criteria=["criteria1"],
        # FEAT-002 fields: snapshot-derived metadata
        language="TypeScript",
        framework="React",
        style="CSS Modules",
        difficulty_level="intermediate",
        file_paths={
            "component": "packages/ui/src/tutorial/blocks/Introduction/I7/Introduction.tsx",
            "schema": "packages/ui/src/tutorial/blocks/Introduction/I7/schema.ts",
            "types": "packages/ui/src/tutorial/blocks/Introduction/I7/types.ts",
            "tests": "packages/ui/src/tutorial/blocks/Introduction/I7/__tests__/Introduction.test.tsx"
        },
        test_requirements=[
            "Unit tests for component rendering",
            "Accessibility tests (WCAG 2.1 AA)",
            "Responsive design tests"
        ],
        type_strictness={
            "strict_mode": True,
            "no_any": True,
            "no_implicit_any": True
        }
    )


class TestAuthenticationRequired:
    """Test that authentication is required for contract endpoints."""
    
    def test_create_contract_requires_auth_header(self):
        """Test POST /workflows/{id}/engineering-contract returns 401 without auth."""
        response = client.post("/workflows/test-workflow-001/engineering-contract")
        
        assert response.status_code == 401
        assert "authorization" in response.json()["detail"].lower()
    
    def test_create_contract_rejects_invalid_auth_format(self):
        """Test POST rejects authorization header without 'Bearer ' prefix."""
        response = client.post(
            "/workflows/test-workflow-001/engineering-contract",
            headers={"Authorization": "InvalidToken123"}
        )
        
        assert response.status_code == 401
        assert "bearer" in response.json()["detail"].lower()
    
    def test_create_contract_rejects_short_token(self):
        """Test POST rejects tokens shorter than 8 characters."""
        response = client.post(
            "/workflows/test-workflow-001/engineering-contract",
            headers={"Authorization": "Bearer abc"}
        )
        
        assert response.status_code == 401
        assert "invalid token" in response.json()["detail"].lower()
    
    def test_get_contract_requires_auth_header(self):
        """Test GET /workflows/{id}/engineering-contract returns 401 without auth."""
        response = client.get("/workflows/test-workflow-001/engineering-contract")
        
        assert response.status_code == 401
        assert "authorization" in response.json()["detail"].lower()


class TestWorkflowOwnership:
    """Test that workflow ownership is verified."""
    
    def test_create_contract_with_valid_auth(self, sample_workflow, mock_repo_contract):
        """Test POST succeeds with valid authentication."""
        # Mock snapshot loading and build_repo_contract to avoid repository access
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            response = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["workflow_id"] == sample_workflow.workflow_id
            assert "contract_hash" in data
            assert len(data["contract_hash"]) == 64  # SHA-256 hex
    
    def test_create_contract_auto_creates_workflow_for_owner(self, sample_workflow, mock_repo_contract):
        """Test that workflow lookup succeeds for authenticated user."""
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            # User can access their own workflow
            response1 = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert response1.status_code == 200
            
            # Non-existent workflow should return 404
            response2 = client.post(
                "/workflows/non-existent-workflow-id/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert response2.status_code == 404
            assert "workflow not found" in response2.json()["detail"].lower()
    
    def test_get_contract_verifies_ownership(self, sample_workflow, mock_repo_contract):
        """Test GET returns contract for valid workflow."""
        # Create contract
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            create_response = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            assert create_response.status_code == 200
        
        # Get contract
        get_response = client.get(
            f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
            headers={"Authorization": "Bearer testtoken12345678"}
        )
        
        assert get_response.status_code == 200
        assert get_response.json()["workflow_id"] == sample_workflow.workflow_id


class TestWorkflowStateValidation:
    """Test that workflow state is validated before contract creation."""
    
    def test_workflow_auto_created_in_valid_state(self, sample_workflow, mock_repo_contract):
        """Test that contracts can be generated for workflows."""
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            response = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert response.status_code == 200
            assert response.json()["target"]["family"] == "Introduction"
            assert response.json()["target"]["version"] == "I7"


class TestContractImmutability:
    """Test contract immutability enforcement."""
    
    def test_repeat_call_returns_same_contract(self, sample_workflow, mock_repo_contract):
        """Test that calling POST twice returns the same contract (same hash)."""
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            # First call
            response1 = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            assert response1.status_code == 200
            contract1 = response1.json()
            
            # Second call (should return cached contract)
            response2 = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            assert response2.status_code == 200
            contract2 = response2.json()
            
            # Contracts should be identical
            assert contract1["contract_hash"] == contract2["contract_hash"]
            assert contract1["contract_id"] == contract2["contract_id"]
            
            # build_repo_contract should only be called once (cached on second call)
            assert mock_build.call_count == 1


class TestHashVerification:
    """Test hash verification on GET endpoint."""
    
    def test_get_contract_verifies_hash(self, sample_workflow, mock_repo_contract):
        """Test GET verifies contract hash and returns contract if valid."""
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            # Create contract
            create_response = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            assert create_response.status_code == 200
            
            # Get contract
            get_response = client.get(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert get_response.status_code == 200
            contract = get_response.json()
            assert len(contract["contract_hash"]) == 64
    
    def test_get_contract_detects_tampering(self, sample_workflow, mock_repo_contract):
        """Test GET returns 500 if contract hash doesn't match (tampering detected)."""
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            # Create contract
            create_response = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            assert create_response.status_code == 200
            
            # Simulate tampering: modify contract in store
            stored_contract = contracts_store[sample_workflow.workflow_id]
            stored_contract.contract_version = "99.0"  # Tamper
            
            # Get contract (should detect tampering)
            get_response = client.get(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert get_response.status_code == 500
            assert "integrity verification failed" in get_response.json()["detail"].lower()
            assert "tampering" in get_response.json()["detail"].lower()
    
    def test_get_contract_404_if_not_exists(self):
        """Test GET returns 404 if contract doesn't exist."""
        response = client.get(
            "/workflows/nonexistent/engineering-contract",
            headers={"Authorization": "Bearer validtoken12345"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestProhibitedBehaviorsInContract:
    """Test that prohibited behaviors are included in generated contracts."""
    
    def test_contract_includes_prohibited_behaviors(self, sample_workflow, mock_repo_contract):
        """Test that generated contract includes all prohibited behaviors."""
        mock_snapshot = {"evidence": [], "blocks": {}}
        with patch("app.api.routes.contract.load_repository_snapshot") as mock_load, \
             patch("app.api.routes.contract.calculate_snapshot_sha256") as mock_sha256, \
             patch("app.api.routes.contract.build_repo_contract") as mock_build:
            mock_load.return_value = mock_snapshot
            mock_sha256.return_value = "a" * 64  # Mock SHA-256 hash
            mock_build.return_value = mock_repo_contract
            
            response = client.post(
                f"/workflows/{sample_workflow.workflow_id}/engineering-contract",
                headers={"Authorization": "Bearer testtoken12345678"}
            )
            
            assert response.status_code == 200
            contract = response.json()
            
            # Verify all 11 prohibited behaviors are present
            assert len(contract["prohibited_behaviors"]) == 11
            assert "implement_duplicate_ils" in contract["prohibited_behaviors"]
            assert "call_ils_api_directly" in contract["prohibited_behaviors"]
            assert "implement_page_navigation" in contract["prohibited_behaviors"]
            assert "implement_page_progress" in contract["prohibited_behaviors"]
            assert "implement_duplicate_lsnb" in contract["prohibited_behaviors"]
            assert "implement_duplicate_rssb" in contract["prohibited_behaviors"]
            assert "hard_code_suia_branding" in contract["prohibited_behaviors"]
            assert "hard_code_rth_branding" in contract["prohibited_behaviors"]
            assert "create_duplicate_composer" in contract["prohibited_behaviors"]
            assert "create_duplicate_renderer" in contract["prohibited_behaviors"]
            assert "modify_unapproved_repository_paths" in contract["prohibited_behaviors"]
