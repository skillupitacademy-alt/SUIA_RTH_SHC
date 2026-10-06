"""Tests for agent API routes."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestAgentRoutes:
    """Test suite for agent API endpoints."""
    
    def test_list_agents_endpoint(self):
        """GET /agents returns all 15 agents."""
        response = client.get("/agents")
        
        assert response.status_code == 200
        agents = response.json()
        assert isinstance(agents, list)
        assert len(agents) == 15
        
        # Verify structure of first agent
        agent = agents[0]
        assert "agentId" in agent
        assert "agentType" in agent
        assert "name" in agent
        assert "capabilities" in agent
        assert "status" in agent
        assert "description" in agent
    
    def test_get_agent_by_type(self):
        """GET /agents/{agent_type} returns specific agent."""
        response = client.get("/agents/gate_controller")
        
        assert response.status_code == 200
        agent = response.json()
        assert agent["agentId"] == "gate_controller"
        assert agent["agentType"] == "gate_controller"
        assert agent["name"] == "Gate Controller"
        assert "orchestrate_pipeline" in agent["capabilities"]
    
    def test_get_all_agent_types(self):
        """All 15 agent types can be retrieved individually."""
        agent_types = [
            "gate_controller",
            "repository_auditor",
            "toolchain",
            "composer",
            "dependency",
            "ubrc",
            "candidate_intake",
            "candidate_placement",
            "candidate_certification",
            "brand_independence",
            "theme_compatibility",
            "runtime_browser",
            "composer_workflow",
            "governance",
            "documentation",
        ]
        
        for agent_type in agent_types:
            response = client.get(f"/agents/{agent_type}")
            assert response.status_code == 200, \
                f"Failed to get agent type: {agent_type}"
            agent = response.json()
            assert agent["agentType"] == agent_type
    
    def test_get_invalid_agent_type_returns_404(self):
        """GET /agents/{invalid_type} returns 404."""
        response = client.get("/agents/invalid_agent_type")
        
        assert response.status_code == 404
        error = response.json()
        assert "detail" in error
        assert "Unknown agent type" in error["detail"]
    
    def test_agents_included_in_root_endpoints(self):
        """Root endpoint includes /agents in endpoints list."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "endpoints" in data
        assert "agents" in data["endpoints"]
        assert data["endpoints"]["agents"] == "/agents"
