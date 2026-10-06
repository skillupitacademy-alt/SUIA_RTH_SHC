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
    SNAPSHOT_AUTHORITY = "snapshot_authority"
    EVIDENCE_FREEZE = "evidence_freeze"
    BLOCK_SPECIFICATION = "block_specification"
    TOOLCHAIN = "toolchain"
    COMPOSER = "composer"
    DEPENDENCY = "dependency"
    UBRC = "ubrc"
    CANDIDATE_INTAKE = "candidate_intake"
    CANDIDATE_CLASSIFICATION = "candidate_classification"
    PLACEMENT_MANIFEST = "placement_manifest"
    HUMAN_APPROVAL = "human_approval"
    PLACEMENT_EXECUTOR = "placement_executor"
    POST_PLACEMENT_VERIFICATION = "post_placement_verification"
    CANDIDATE_PLACEMENT = "candidate_placement"
    CANDIDATE_CERTIFICATION = "candidate_certification"
    BRAND_INDEPENDENCE = "brand_independence"
    THEME_COMPATIBILITY = "theme_compatibility"
    RUNTIME_BROWSER = "runtime_browser"
    RUNTIME_AGENT = "runtime_agent"
    PLAYWRIGHT_BROWSER_AGENT = "playwright_browser_agent"
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
                capabilities=["validate_git_state", "check_working_directory", "verify_branch", "check_remote"],
                status="active",
                description="Validates git repository state, checks working directory cleanliness, verifies branch, checks remote reachability"
            ),
            AgentType.SNAPSHOT_AUTHORITY: Agent(
                agentId="snapshot_authority",
                agentType=AgentType.SNAPSHOT_AUTHORITY,
                name="Snapshot Authority",
                capabilities=["generate_snapshot", "extract_canonical_hash", "create_run_directory"],
                status="active",
                description="Calls TypeScript discovery to generate snapshot, extracts canonical hash, creates run directory structure"
            ),
            AgentType.EVIDENCE_FREEZE: Agent(
                agentId="evidence_freeze",
                agentType=AgentType.EVIDENCE_FREEZE,
                name="Evidence Freeze",
                capabilities=["validate_evidence_structure", "create_evidence_index", "verify_hashes"],
                status="active",
                description="Validates evidence structure from snapshot, creates evidence index, verifies hash formats without recomputation"
            ),
            AgentType.BLOCK_SPECIFICATION: Agent(
                agentId="block_specification",
                agentType=AgentType.BLOCK_SPECIFICATION,
                name="Block Specification",
                capabilities=["parse_candidate_structure", "compare_canonical", "generate_requirements"],
                status="active",
                description="Parses candidate block structure, compares to canonical blocks, generates structural requirements"
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
                capabilities=["validate_package_structure", "compute_file_hashes", "extract_metadata", "integrate_block_specification"],
                status="active",
                description="Validates candidate package structure, computes file hashes, extracts metadata, integrates with block specification"
            ),
            AgentType.CANDIDATE_CLASSIFICATION: Agent(
                agentId="candidate_classification",
                agentType=AgentType.CANDIDATE_CLASSIFICATION,
                name="Candidate Classification Agent",
                capabilities=["classify_block_family", "confidence_scoring", "structural_analysis", "canonical_comparison"],
                status="active",
                description="Classifies candidate blocks into BlockFamily enum using structural features with confidence scoring"
            ),
            AgentType.PLACEMENT_MANIFEST: Agent(
                agentId="placement_manifest",
                agentType=AgentType.PLACEMENT_MANIFEST,
                name="Placement Manifest Agent",
                capabilities=["generate_placement_manifest", "canonical_comparison", "compute_manifest_hash", "evidence_binding"],
                status="active",
                description="Generates placement manifest using canonical comparator with tamper-proof SHA-256 hash"
            ),
            AgentType.HUMAN_APPROVAL: Agent(
                agentId="human_approval",
                agentType=AgentType.HUMAN_APPROVAL,
                name="Human Approval Agent",
                capabilities=["database_polling", "manifest_hash_verification", "timeout_management", "approval_workflow"],
                status="active",
                description="Implements database polling approval workflow with manifest hash verification and configurable timeout"
            ),
            AgentType.PLACEMENT_EXECUTOR: Agent(
                agentId="placement_executor",
                agentType=AgentType.PLACEMENT_EXECUTOR,
                name="Placement Executor Agent",
                capabilities=["execute_approved_manifest", "verify_manifest_hash", "file_placement", "git_operations"],
                status="active",
                description="Executes approved placement manifests with hash verification using PlacementExecutor"
            ),
            AgentType.POST_PLACEMENT_VERIFICATION: Agent(
                agentId="post_placement_verification",
                agentType=AgentType.POST_PLACEMENT_VERIFICATION,
                name="Post-Placement Verification Agent",
                capabilities=["git_diff_verification", "file_hash_computation", "manifest_match_validation", "placement_validation"],
                status="active",
                description="Verifies placement changes using git diff without regenerating snapshot"
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
            AgentType.RUNTIME_AGENT: Agent(
                agentId="runtime_agent",
                agentType=AgentType.RUNTIME_AGENT,
                name="Runtime Agent (Agent 12K)",
                capabilities=["verify_runtime", "start_application", "health_check", "collect_evidence"],
                status="active",
                description="Agent 12K: Verifies blocks at runtime by starting application, performing health checks, and collecting runtime verification results"
            ),
            AgentType.PLAYWRIGHT_BROWSER_AGENT: Agent(
                agentId="playwright_browser_agent",
                agentType=AgentType.PLAYWRIGHT_BROWSER_AGENT,
                name="Playwright Browser Agent (Agent 12L)",
                capabilities=["orchestrate_node_playwright", "set_environment_variables", "parse_json_results", "collect_screenshots"],
                status="active",
                description="Agent 12L: Orchestrates Node Playwright via subprocess (pnpm exec playwright test), sets environment variables, parses JSON results from .project-ai/runs/current/results/playwright.json"
            ),
            AgentType.COMPOSER_WORKFLOW: Agent(
                agentId="composer_workflow",
                agentType=AgentType.COMPOSER_WORKFLOW,
                name="Composer Workflow Agent",
                capabilities=["orchestrate_composition", "validate_i2_workflow", "check_mix_and_match"],
                status="active",
                description="Orchestrates composition workflow, validates I2 workflow, checks mix-and-match compatibility"
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
