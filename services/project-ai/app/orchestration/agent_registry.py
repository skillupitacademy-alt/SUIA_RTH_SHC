"""
Agent registry for managing specialized AI agents.

In M2.8, this is a skeleton. Agent definitions and routing logic
will be implemented in M3+ when LLM integration is added.
"""

from typing import Dict, List, Optional

from pydantic import BaseModel


class AgentDefinition(BaseModel):
    """Definition of an AI agent with specific capabilities."""
    agent_id: str
    name: str
    description: str
    capabilities: List[str]
    prompt_template: Optional[str] = None


class AgentRegistry:
    """
    Registry for AI agents with different specializations.
    
    Agents are specialized for different tasks:
    - Discovery agent: analyzes snapshot, identifies relevant evidence
    - Planning agent: generates implementation plans
    - Implementation agent: writes code
    - Testing agent: generates and runs tests
    - Verification agent: checks quality gates
    
    In M2.8, this is a skeleton for defining agent roles.
    Production implementation in M3+ will add LLM prompts and routing logic.
    """
    
    def __init__(self):
        self.agents = self._initialize_agents()
    
    def _initialize_agents(self) -> Dict[str, AgentDefinition]:
        """
        Define available AI agents.
        
        Returns:
            Dictionary of agent_id -> AgentDefinition
        """
        return {
            "discovery": AgentDefinition(
                agent_id="discovery",
                name="Discovery Agent",
                description="Analyzes snapshot to extract relevant evidence for tasks",
                capabilities=["snapshot_analysis", "evidence_extraction", "context_building"],
                prompt_template=None  # TODO: Add in M3+
            ),
            "planner": AgentDefinition(
                agent_id="planner",
                name="Planning Agent",
                description="Generates implementation plans from evidence",
                capabilities=["plan_generation", "dependency_analysis", "risk_assessment"],
                prompt_template=None  # TODO: Add in M3+
            ),
            "implementer": AgentDefinition(
                agent_id="implementer",
                name="Implementation Agent",
                description="Writes code to execute approved plans",
                capabilities=["code_generation", "file_editing", "refactoring"],
                prompt_template=None  # TODO: Add in M3+
            ),
            "tester": AgentDefinition(
                agent_id="tester",
                name="Testing Agent",
                description="Generates and runs tests to verify implementations",
                capabilities=["test_generation", "test_execution", "coverage_analysis"],
                prompt_template=None  # TODO: Add in M3+
            ),
            "verifier": AgentDefinition(
                agent_id="verifier",
                name="Verification Agent",
                description="Checks quality gates and compliance",
                capabilities=["gate_evaluation", "validator_execution", "compliance_checking"],
                prompt_template=None  # TODO: Add in M3+
            ),
        }
    
    def get_agent(self, agent_id: str) -> AgentDefinition:
        """
        Get agent definition by ID.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            Agent definition
            
        Raises:
            ValueError: If agent_id is unknown
        """
        if agent_id not in self.agents:
            raise ValueError(f"Unknown agent: {agent_id}")
        return self.agents[agent_id]
    
    def list_agents(self) -> List[AgentDefinition]:
        """Get all registered agents."""
        return list(self.agents.values())
    
    def get_agent_for_capability(self, capability: str) -> Optional[AgentDefinition]:
        """
        Find an agent with a specific capability.
        
        Args:
            capability: Required capability
            
        Returns:
            First agent with that capability, or None
        """
        for agent in self.agents.values():
            if capability in agent.capabilities:
                return agent
        return None
