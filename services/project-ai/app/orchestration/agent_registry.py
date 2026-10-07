"""
Agent registry for managing specialized AI agents.

This module implements the 15-agent specialized architecture for Project AI,
replacing the M2.8 generic stubs with production-grade agent definitions.
"""

from enum import Enum
from typing import Dict, List

from pydantic import BaseModel


class AgentType(str, Enum):
    """Enumeration of specialized agent types."""
    GATE_CONTROLLER = "gate_controller"
    REPOSITORY_AUDITOR = "repository_auditor"
    TOOLCHAIN = "toolchain"
    COMPOSER = "composer"
    DEPENDENCY = "dependency"
    UBRC = "ubrc"
    CANDIDATE_INTAKE = "candidate_intake"
    CANDIDATE_PLACEMENT = "candidate_placement"
    CANDIDATE_CERTIFICATION = "candidate_certification"
    BRAND_INDEPENDENCE = "brand_independence"
    THEME_COMPATIBILITY = "theme_compatibility"
    RUNTIME_BROWSER = "runtime_browser"
    COMPOSER_WORKFLOW = "composer_workflow"
    GOVERNANCE = "governance"
    DOCUMENTATION = "documentation"


class Agent(BaseModel):
    """Definition of an AI agent with specific capabilities."""
    agentId: str
    agentType: AgentType
    name: str
    capabilities: List[str]
    status: str
    description: str


class AgentRegistry:
    """
    Registry for specialized AI agents in the Project AI system.
    
    The 15 agents cover the complete Project AI + Candidate Block workflow:
    - Gate Controller: orchestrates pipeline, enforces gates
    - Repository Auditor: reads snapshot, verifies evidence, validates contracts
    - Toolchain: detects toolchain, runs approved commands, reports versions
    - Composer: discovers composer, validates schema, checks API compatibility
    - Dependency: builds dependency graph, detects cycles, reports violations
    - UBRC: scans block attributes, verifies data-block-version, reports compliance
    - Candidate Intake: receives upload, classifies block family, computes hash
    - Candidate Placement: compares canonical, generates manifest, proposes placement
    - Candidate Certification: runs certification gates, binds evidence, issues verdict
    - Brand Independence: scans brand markers, verifies neutral palette, reports violations
    - Theme Compatibility: checks CSS variables, verifies theme overrides, tests modes
    - Runtime/Browser: launches browser, renders block, captures screenshot, verifies behavior
    - Composer Workflow: orchestrates composition, validates I2 workflow, checks mix-and-match
    - Governance: submits approval, verifies manifest hash, records audit trail
    - Documentation: updates backlog, generates evidence report, writes gate summary
    """
    
    def __init__(self):
        self.agents = self._initialize_agents()
    
    def _initialize_agents(self) -> Dict[AgentType, Agent]:
        """
        Define the 15 specialized AI agents.
        
        Returns:
            Dictionary of AgentType -> Agent
        """
        return {
            AgentType.GATE_CONTROLLER: Agent(
                agentId="gate_controller",
                agentType=AgentType.GATE_CONTROLLER,
                name="Gate Controller",
                capabilities=["orchestrate_pipeline", "enforce_gates", "block_on_failure"],
                status="active",
                description="Orchestrates the overall pipeline, enforces quality gates, and blocks on failure"
            ),
            AgentType.REPOSITORY_AUDITOR: Agent(
                agentId="repository_auditor",
                agentType=AgentType.REPOSITORY_AUDITOR,
                name="Repository Auditor",
                capabilities=["read_snapshot", "verify_evidence", "validate_contracts"],
                status="active",
                description="Reads TypeScript snapshot, verifies evidence integrity, validates contracts"
            ),
            AgentType.TOOLCHAIN: Agent(
                agentId="toolchain",
                agentType=AgentType.TOOLCHAIN,
                name="Toolchain Agent",
                capabilities=["detect_toolchain", "run_approved_commands", "report_versions"],
                status="active",
                description="Detects toolchain configuration, runs approved commands, reports versions"
            ),
            AgentType.COMPOSER: Agent(
                agentId="composer",
                agentType=AgentType.COMPOSER,
                name="Composer Agent",
                capabilities=["discover_composer", "validate_schema", "check_api_compatibility"],
                status="active",
                description="Discovers composer configuration, validates schema, checks API compatibility"
            ),
            AgentType.DEPENDENCY: Agent(
                agentId="dependency",
                agentType=AgentType.DEPENDENCY,
                name="Dependency Agent",
                capabilities=["build_dependency_graph", "detect_cycles", "report_violations"],
                status="active",
                description="Builds dependency graph, detects cycles, reports dependency violations"
            ),
            AgentType.UBRC: Agent(
                agentId="ubrc",
                agentType=AgentType.UBRC,
                name="UBRC Agent",
                capabilities=["scan_block_attributes", "verify_data_block_version", "report_compliance"],
                status="active",
                description="Scans block attributes for UBRC compliance, verifies data-block-version presence"
            ),
            AgentType.CANDIDATE_INTAKE: Agent(
                agentId="candidate_intake",
                agentType=AgentType.CANDIDATE_INTAKE,
                name="Candidate Intake Agent",
                capabilities=["receive_upload", "classify_block_family", "compute_hash"],
                status="active",
                description="Receives candidate block upload, classifies block family, computes artifact hash"
            ),
            AgentType.CANDIDATE_PLACEMENT: Agent(
                agentId="candidate_placement",
                agentType=AgentType.CANDIDATE_PLACEMENT,
                name="Candidate Placement Agent",
                capabilities=["compare_canonical", "generate_manifest", "propose_placement"],
                status="active",
                description="Compares candidate with canonical artifacts, generates manifest, proposes placement"
            ),
            AgentType.CANDIDATE_CERTIFICATION: Agent(
                agentId="candidate_certification",
                agentType=AgentType.CANDIDATE_CERTIFICATION,
                name="Candidate Certification Agent",
                capabilities=["run_certification_gates", "bind_evidence", "issue_certified_verdict"],
                status="active",
                description="Runs certification gates, binds evidence to artifacts, issues certified verdict"
            ),
            AgentType.BRAND_INDEPENDENCE: Agent(
                agentId="brand_independence",
                agentType=AgentType.BRAND_INDEPENDENCE,
                name="Brand Independence Agent",
                capabilities=["scan_brand_markers", "verify_neutral_palette", "report_brand_violations"],
                status="active",
                description="Scans for brand markers, verifies neutral palette, reports brand violations"
            ),
            AgentType.THEME_COMPATIBILITY: Agent(
                agentId="theme_compatibility",
                agentType=AgentType.THEME_COMPATIBILITY,
                name="Theme Compatibility Agent",
                capabilities=["check_css_variables", "verify_theme_overrides", "test_dark_light_modes"],
                status="active",
                description="Checks CSS variables, verifies theme overrides, tests dark/light modes"
            ),
            AgentType.RUNTIME_BROWSER: Agent(
                agentId="runtime_browser",
                agentType=AgentType.RUNTIME_BROWSER,
                name="Runtime/Browser Agent",
                capabilities=["launch_browser", "render_block", "capture_screenshot", "verify_runtime_behavior"],
                status="active",
                description="Launches browser, renders block, captures screenshot, verifies runtime behavior"
            ),
            AgentType.COMPOSER_WORKFLOW: Agent(
                agentId="composer_workflow",
                agentType=AgentType.COMPOSER_WORKFLOW,
                name="Composer Workflow Agent",
                capabilities=["orchestrate_composition", "validate_i2_workflow", "check_design_reuse_compatibility"],
                status="active",
                description="Orchestrates composition workflow, validates I2 workflow, checks design reuse (mix-and-match) compatibility during CANDIDATE_AUDIT phase"
            ),
            AgentType.GOVERNANCE: Agent(
                agentId="governance",
                agentType=AgentType.GOVERNANCE,
                name="Governance Agent",
                capabilities=["submit_approval", "verify_manifest_hash", "record_audit_trail"],
                status="active",
                description="Submits for human approval, verifies manifest hash, records audit trail"
            ),
            AgentType.DOCUMENTATION: Agent(
                agentId="documentation",
                agentType=AgentType.DOCUMENTATION,
                name="Documentation Agent",
                capabilities=["update_backlog", "generate_evidence_report", "write_gate_summary"],
                status="active",
                description="Updates canonical backlog, generates evidence report, writes gate summary"
            ),
        }
    
    def get_agent(self, agent_type: AgentType) -> Agent:
        """
        Get agent definition by type.
        
        Args:
            agent_type: Agent type from AgentType enum
            
        Returns:
            Agent definition
            
        Raises:
            ValueError: If agent_type is not registered
        """
        if agent_type not in self.agents:
            raise ValueError(f"Unknown agent type: {agent_type}")
        return self.agents[agent_type]
    
    def list_agents(self) -> List[Agent]:
        """
        Get all registered agents.
        
        Returns:
            List of all 15 specialized agents
        """
        return list(self.agents.values())
