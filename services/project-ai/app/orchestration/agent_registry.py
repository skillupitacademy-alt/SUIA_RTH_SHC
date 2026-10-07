"""
Agent registry for managing specialized AI agents.

This module implements the 15-agent specialized architecture for Project AI,
replacing the M2.8 generic stubs with production-grade agent definitions.
"""

from enum import Enum
from typing import Dict, List

from pydantic import BaseModel


class AgentType(str, Enum):
    """Enumeration of the 15 specialized agent types."""
    REPOSITORY_AUDITOR = "repository_auditor"
    SNAPSHOT_AUTHORITY = "snapshot_authority"
    EVIDENCE_FREEZE = "evidence_freeze"
    BLOCK_SPECIFICATION = "block_specification"
    CANDIDATE_INTAKE = "candidate_intake"
    CANDIDATE_CLASSIFICATION = "candidate_classification"
    CANONICAL_COMPARISON = "canonical_comparison"
    PLACEMENT_MANIFEST = "placement_manifest"
    HUMAN_APPROVAL = "human_approval"
    PLACEMENT_EXECUTOR = "placement_executor"
    POST_PLACEMENT_SNAPSHOT = "post_placement_snapshot"
    CERTIFICATION_CONTROLLER = "certification_controller"
    RUNTIME_VERIFICATION = "runtime_verification"
    BROWSER_VERIFICATION = "browser_verification"
    FINAL_GATE_CONTROLLER = "final_gate_controller"


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
    Registry for the 15 specialized AI agents in the Project AI system.
    
    The 15 agents cover the complete Project AI + Candidate Block workflow:
    1. Repository Auditor: Validates git repository state, checks working directory cleanliness
    2. Snapshot Authority: Generates snapshot, extracts canonical hash, creates run directory
    3. Evidence Freeze: Validates evidence structure, creates evidence index, verifies hashes
    4. Block Specification: Parses candidate structure, compares to canonical, generates requirements
    5. Candidate Intake: Validates package structure, computes file hashes, extracts metadata
    6. Candidate Classification: Classifies block family using structural features with confidence scoring
    7. Canonical Comparison: Compares candidate with canonical artifacts, generates comparison report
    8. Placement Manifest: Generates placement manifest using canonical comparator with tamper-proof hash
    9. Human Approval: Implements database polling approval workflow with manifest hash verification
    10. Placement Executor: Executes approved placement manifests with hash verification
    11. Post-Placement Snapshot: Verifies placement changes using git diff without regenerating snapshot
    12. Certification Controller: Orchestrates all certification gates (Contract, UBRC, Registry, Renderer, Composer, Tests, Runtime, Browser, Brand, Theme, Dependency) in parallel
    13. Runtime Verification: Verifies blocks at runtime by starting application and performing health checks
    14. Browser Verification: Orchestrates Node Playwright via subprocess for browser-based testing
    15. Final Gate Controller: Aggregates all gate results and issues final certification verdict
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
            AgentType.CANDIDATE_INTAKE: Agent(
                agentId="candidate_intake",
                agentType=AgentType.CANDIDATE_INTAKE,
                name="Candidate Intake",
                capabilities=["validate_package_structure", "compute_file_hashes", "extract_metadata", "integrate_block_specification"],
                status="active",
                description="Validates candidate package structure, computes file hashes, extracts metadata, integrates with block specification"
            ),
            AgentType.CANDIDATE_CLASSIFICATION: Agent(
                agentId="candidate_classification",
                agentType=AgentType.CANDIDATE_CLASSIFICATION,
                name="Candidate Classification",
                capabilities=["classify_block_family", "confidence_scoring", "structural_analysis", "canonical_comparison"],
                status="active",
                description="Classifies candidate blocks into BlockFamily enum using structural features with confidence scoring"
            ),
            AgentType.CANONICAL_COMPARISON: Agent(
                agentId="canonical_comparison",
                agentType=AgentType.CANONICAL_COMPARISON,
                name="Canonical Comparison",
                capabilities=["compare_with_canonical", "generate_diff_report", "identify_structural_changes", "validate_compatibility"],
                status="active",
                description="Compares candidate with canonical artifacts, identifies structural changes, validates compatibility"
            ),
            AgentType.PLACEMENT_MANIFEST: Agent(
                agentId="placement_manifest",
                agentType=AgentType.PLACEMENT_MANIFEST,
                name="Placement Manifest",
                capabilities=["generate_placement_manifest", "canonical_comparison", "compute_manifest_hash", "evidence_binding"],
                status="active",
                description="Generates placement manifest using canonical comparator with tamper-proof SHA-256 hash"
            ),
            AgentType.HUMAN_APPROVAL: Agent(
                agentId="human_approval",
                agentType=AgentType.HUMAN_APPROVAL,
                name="Human Approval (Governance)",
                capabilities=["database_polling", "manifest_hash_verification", "timeout_management", "approval_workflow"],
                status="active",
                description="Implements database polling approval workflow with manifest hash verification and configurable timeout"
            ),
            AgentType.PLACEMENT_EXECUTOR: Agent(
                agentId="placement_executor",
                agentType=AgentType.PLACEMENT_EXECUTOR,
                name="Placement Executor",
                capabilities=["execute_approved_manifest", "verify_manifest_hash", "file_placement", "git_operations"],
                status="active",
                description="Executes approved placement manifests with hash verification using PlacementExecutor"
            ),
            AgentType.POST_PLACEMENT_SNAPSHOT: Agent(
                agentId="post_placement_snapshot",
                agentType=AgentType.POST_PLACEMENT_SNAPSHOT,
                name="Post-Placement Snapshot",
                capabilities=["git_diff_verification", "file_hash_computation", "manifest_match_validation", "placement_validation"],
                status="active",
                description="Verifies placement changes using git diff without regenerating snapshot"
            ),
            AgentType.CERTIFICATION_CONTROLLER: Agent(
                agentId="certification_controller",
                agentType=AgentType.CERTIFICATION_CONTROLLER,
                name="Certification Controller",
                capabilities=[
                    "orchestrate_certification_gates",
                    "execute_contract_gate",
                    "execute_ubrc_gate",
                    "execute_registry_gate",
                    "execute_renderer_gate",
                    "execute_composer_gate",
                    "execute_tests_gate",
                    "execute_runtime_gate",
                    "execute_browser_gate",
                    "execute_brand_gate",
                    "execute_theme_gate",
                    "execute_dependency_gate",
                    "aggregate_gate_results",
                    "bind_evidence"
                ],
                status="active",
                description="Orchestrates all certification gates in parallel: Contract, UBRC, Registry, Renderer, Composer, Tests, Runtime, Browser, Brand, Theme, Dependency"
            ),
            AgentType.RUNTIME_VERIFICATION: Agent(
                agentId="runtime_verification",
                agentType=AgentType.RUNTIME_VERIFICATION,
                name="Runtime Verification",
                capabilities=["verify_runtime", "start_application", "health_check", "collect_evidence"],
                status="active",
                description="Verifies blocks at runtime by starting application, performing health checks, and collecting runtime verification results"
            ),
            AgentType.BROWSER_VERIFICATION: Agent(
                agentId="browser_verification",
                agentType=AgentType.BROWSER_VERIFICATION,
                name="Browser Verification (Playwright)",
                capabilities=["orchestrate_node_playwright", "set_environment_variables", "parse_json_results", "collect_screenshots"],
                status="active",
                description="Orchestrates Node Playwright via subprocess (pnpm exec playwright test), sets environment variables, parses JSON results"
            ),
            AgentType.FINAL_GATE_CONTROLLER: Agent(
                agentId="final_gate_controller",
                agentType=AgentType.FINAL_GATE_CONTROLLER,
                name="Final Gate Controller",
                capabilities=["aggregate_gate_results", "generate_final_certification", "calculate_verdict", "validate_evidence_binding"],
                status="active",
                description="Aggregates all gate results from certification controller, runtime, and browser verification; issues final certification verdict"
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
