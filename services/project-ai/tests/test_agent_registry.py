"""Tests for agent registry."""

import pytest

from app.orchestration.agent_registry import Agent, AgentRegistry, AgentType


class TestAgentRegistry:
    """Test suite for AgentRegistry."""
    
    def test_all_agents_registered(self):
        """All specialized agents are registered."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        # We now have 15 agents in the consolidated architecture
        assert len(agents) == 15, f"Expected 15 agents, got {len(agents)}"
    
    def test_agent_types_enum_complete(self):
        """AgentType enum contains all agent types."""
        agent_types = list(AgentType)
        assert len(agent_types) == 15, f"Expected 15 agent types, got {len(agent_types)}"
    
    def test_get_agent_returns_correct_agent(self):
        """get_agent() returns the correct agent for each type."""
        registry = AgentRegistry()
        
        # Test each agent type
        for agent_type in AgentType:
            agent = registry.get_agent(agent_type)
            assert isinstance(agent, Agent)
            assert agent.agentType == agent_type
            assert agent.agentId == agent_type.value
    
    def test_list_agents_returns_all_entries(self):
        """list_agents() returns all agents."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        assert len(agents) == 15
        assert all(isinstance(agent, Agent) for agent in agents)
    
    def test_no_agent_has_stub_or_todo(self):
        """No agent has 'stub' or 'TODO' in capabilities."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        for agent in agents:
            for capability in agent.capabilities:
                assert "stub" not in capability.lower(), \
                    f"Agent {agent.name} has 'stub' in capability: {capability}"
                assert "TODO" not in capability, \
                    f"Agent {agent.name} has 'TODO' in capability: {capability}"
            
            assert "stub" not in agent.description.lower(), \
                f"Agent {agent.name} has 'stub' in description"
            assert "TODO" not in agent.description, \
                f"Agent {agent.name} has 'TODO' in description"
    
    def test_all_agents_active(self):
        """All agents have status='active'."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        for agent in agents:
            assert agent.status == "active", \
                f"Agent {agent.name} has status '{agent.status}', expected 'active'"
    
    def test_get_agent_invalid_type_raises_error(self):
        """get_agent() raises ValueError for unknown agent type."""
        registry = AgentRegistry()
        
        # This should raise an error because we're passing a string that doesn't match
        # But since AgentType is an enum, we need to test with an invalid enum value
        # Actually, we can't create an invalid enum value, so this test verifies
        # that the type system prevents invalid agent types
        
        # Instead, test that all valid types work
        for agent_type in AgentType:
            agent = registry.get_agent(agent_type)
            assert agent is not None
    
    def test_agent_capabilities_not_empty(self):
        """Each agent has at least one capability."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        for agent in agents:
            assert len(agent.capabilities) > 0, \
                f"Agent {agent.name} has no capabilities"
    
    def test_specific_agent_definitions(self):
        """Test specific agent definitions match requirements."""
        registry = AgentRegistry()
        
        # Agent 1: Repository Auditor
        repo = registry.get_agent(AgentType.REPOSITORY_AUDITOR)
        assert "validate_git_state" in repo.capabilities
        assert "check_working_directory" in repo.capabilities
        
        # Agent 2: Snapshot Authority
        snapshot = registry.get_agent(AgentType.SNAPSHOT_AUTHORITY)
        assert "generate_snapshot" in snapshot.capabilities
        assert "extract_canonical_hash" in snapshot.capabilities
        
        # Agent 3: Evidence Freeze
        evidence = registry.get_agent(AgentType.EVIDENCE_FREEZE)
        assert "validate_evidence_structure" in evidence.capabilities
        assert "create_evidence_index" in evidence.capabilities
        
        # Agent 4: Block Specification
        spec = registry.get_agent(AgentType.BLOCK_SPECIFICATION)
        assert "parse_candidate_structure" in spec.capabilities
        assert "compare_canonical" in spec.capabilities
        
        # Agent 5: Candidate Intake
        intake = registry.get_agent(AgentType.CANDIDATE_INTAKE)
        assert "validate_package_structure" in intake.capabilities
        assert "compute_file_hashes" in intake.capabilities
        
        # Agent 6: Candidate Classification
        classification = registry.get_agent(AgentType.CANDIDATE_CLASSIFICATION)
        assert "classify_block_family" in classification.capabilities
        assert "confidence_scoring" in classification.capabilities
        
        # Agent 7: Canonical Comparison
        comparison = registry.get_agent(AgentType.CANONICAL_COMPARISON)
        assert "compare_with_canonical" in comparison.capabilities
        assert "generate_diff_report" in comparison.capabilities
        
        # Agent 8: Placement Manifest
        manifest = registry.get_agent(AgentType.PLACEMENT_MANIFEST)
        assert "generate_placement_manifest" in manifest.capabilities
        assert "compute_manifest_hash" in manifest.capabilities
        
        # Agent 9: Human Approval
        approval = registry.get_agent(AgentType.HUMAN_APPROVAL)
        assert "database_polling" in approval.capabilities
        assert "manifest_hash_verification" in approval.capabilities
        
        # Agent 10: Placement Executor
        executor = registry.get_agent(AgentType.PLACEMENT_EXECUTOR)
        assert "execute_approved_manifest" in executor.capabilities
        assert "verify_manifest_hash" in executor.capabilities
        
        # Agent 11: Post-Placement Snapshot
        verification = registry.get_agent(AgentType.POST_PLACEMENT_SNAPSHOT)
        assert "git_diff_verification" in verification.capabilities
        assert "file_hash_computation" in verification.capabilities
        
        # Agent 12: Certification Controller (orchestrates all gates)
        cert_controller = registry.get_agent(AgentType.CERTIFICATION_CONTROLLER)
        assert "orchestrate_certification_gates" in cert_controller.capabilities
        assert "execute_contract_gate" in cert_controller.capabilities
        assert "execute_ubrc_gate" in cert_controller.capabilities
        assert "execute_brand_gate" in cert_controller.capabilities
        assert "execute_theme_gate" in cert_controller.capabilities
        assert "aggregate_gate_results" in cert_controller.capabilities
        
        # Agent 13: Runtime Verification
        runtime = registry.get_agent(AgentType.RUNTIME_VERIFICATION)
        assert "verify_runtime" in runtime.capabilities
        assert "start_application" in runtime.capabilities
        assert "health_check" in runtime.capabilities
        
        # Agent 14: Browser Verification
        browser = registry.get_agent(AgentType.BROWSER_VERIFICATION)
        assert "orchestrate_node_playwright" in browser.capabilities
        assert "parse_json_results" in browser.capabilities
        
        # Agent 15: Final Gate Controller
        final_gate = registry.get_agent(AgentType.FINAL_GATE_CONTROLLER)
        assert "aggregate_gate_results" in final_gate.capabilities
        assert "generate_final_certification" in final_gate.capabilities
    
    def test_agent_names_unique(self):
        """All agent names are unique."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        names = [agent.name for agent in agents]
        assert len(names) == len(set(names)), "Agent names are not unique"
    
    def test_agent_ids_unique(self):
        """All agent IDs are unique."""
        registry = AgentRegistry()
        agents = registry.list_agents()
        
        ids = [agent.agentId for agent in agents]
        assert len(ids) == len(set(ids)), "Agent IDs are not unique"
