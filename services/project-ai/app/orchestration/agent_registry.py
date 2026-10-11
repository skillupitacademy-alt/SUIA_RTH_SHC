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
    # Migration repair workflow agents (13 new agents)
    MIGRATION_AUDIT = "migration_audit"
    DATABASE_SAFETY_AUDIT = "database_safety_audit"
    TEST_INVENTORY = "test_inventory"
    EVIDENCE_AUDIT = "evidence_audit"
    REPAIR_PLANNER = "repair_planner"
    REPAIR_REVIEWER = "repair_reviewer"
    REPAIR_IMPLEMENTER = "repair_implementer"
    STATIC_REVIEWER = "static_reviewer"
    TEST_REVIEWER = "test_reviewer"
    VERIFICATION_RUNNER = "verification_runner"
    EVIDENCE_ASSEMBLER = "evidence_assembler"
    FINAL_GATE_AGENT = "final_gate_agent"
    PUBLISHER_AGENT = "publisher_agent"


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
    
    The 28 agents cover the complete Project AI + Candidate Block + Migration Repair workflows:
    
    Original 15 agents (Project AI + Candidate Block):
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
    
    Migration Repair Workflow 13 agents (Wave 1):
    - Migration Audit: scans migration files, verifies journal consistency, detects duplicate objects
    - Database Safety Audit: validates database identity, checks environment, verifies privileges
    - Test Inventory: discovers test scripts, identifies fixtures, catalogs integration tests
    - Evidence Audit: checks existing reports, validates JSONL ledgers, identifies missing evidence
    - Repair Planner: maps findings to migrations, proposes corrections, assesses risk
    - Repair Reviewer: reviews repair plan independently, rejects destructive changes
    - Repair Implementer: applies approved patches, updates canonical docs, maintains branch
    - Static Reviewer: checks SQL syntax, verifies migration order, validates snapshot consistency
    - Test Reviewer: ensures test coverage for fixes, validates downstream checks
    - Verification Runner: executes migration chain, verifies schema, runs integration tests
    - Evidence Assembler: collects logs and exit codes, captures test results, hashes artifacts
    - Final Gate Agent: reviews code and evidence independently, issues pass/fail/blocked verdict
    - Publisher Agent: commits verified changes, publishes evidence, confirms SHA match
    """
    
    def __init__(self):
        self.agents = self._initialize_agents()
    
    def _initialize_agents(self) -> Dict[AgentType, Agent]:
        """
        Define the 28 specialized AI agents.
        
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
            # Migration Repair Workflow agents (13 new agents)
            AgentType.MIGRATION_AUDIT: Agent(
                agentId="migration_audit",
                agentType=AgentType.MIGRATION_AUDIT,
                name="Migration Audit Agent",
                capabilities=["scan_migration_files", "verify_journal_consistency", "detect_duplicate_objects", "check_dependency_order"],
                status="active",
                description="Scans migration SQL files, verifies journal consistency, detects duplicate objects, checks dependency order"
            ),
            AgentType.DATABASE_SAFETY_AUDIT: Agent(
                agentId="database_safety_audit",
                agentType=AgentType.DATABASE_SAFETY_AUDIT,
                name="Database Safety Audit Agent",
                capabilities=["validate_database_identity", "check_environment_safety", "verify_privileges", "assess_backup_restore"],
                status="active",
                description="Validates database identity, checks environment safety, verifies privileges, assesses backup/restore capability"
            ),
            AgentType.TEST_INVENTORY: Agent(
                agentId="test_inventory",
                agentType=AgentType.TEST_INVENTORY,
                name="Test Inventory Agent",
                capabilities=["discover_test_scripts", "identify_fixtures", "catalog_integration_tests", "map_test_coverage"],
                status="active",
                description="Discovers test scripts, identifies fixtures, catalogs integration/security tests, maps test coverage"
            ),
            AgentType.EVIDENCE_AUDIT: Agent(
                agentId="evidence_audit",
                agentType=AgentType.EVIDENCE_AUDIT,
                name="Evidence Audit Agent",
                capabilities=["check_existing_reports", "validate_jsonl_ledgers", "identify_missing_evidence", "verify_artifact_locations"],
                status="active",
                description="Checks existing reports, validates JSONL ledgers, identifies missing evidence, verifies artifact locations"
            ),
            AgentType.REPAIR_PLANNER: Agent(
                agentId="repair_planner",
                agentType=AgentType.REPAIR_PLANNER,
                name="Repair Planner Agent",
                capabilities=["map_findings_to_migrations", "propose_corrections", "assess_risk", "generate_rollback_plan"],
                status="active",
                description="Maps findings to specific migrations, proposes minimal corrections, assesses risk, generates rollback plan"
            ),
            AgentType.REPAIR_REVIEWER: Agent(
                agentId="repair_reviewer",
                agentType=AgentType.REPAIR_REVIEWER,
                name="Repair Reviewer Agent",
                capabilities=["review_repair_plan", "check_earlier_migrations", "reject_destructive_changes", "verify_schema_preservation"],
                status="active",
                description="Reviews repair plan independently, checks earlier migrations, rejects destructive changes, verifies schema preservation"
            ),
            AgentType.REPAIR_IMPLEMENTER: Agent(
                agentId="repair_implementer",
                agentType=AgentType.REPAIR_IMPLEMENTER,
                name="Repair Implementer Agent",
                capabilities=["apply_approved_patches", "update_canonical_docs", "maintain_branch_isolation", "preserve_file_ownership"],
                status="active",
                description="Applies approved minimal patches, updates canonical docs, maintains branch isolation, preserves file ownership"
            ),
            AgentType.STATIC_REVIEWER: Agent(
                agentId="static_reviewer",
                agentType=AgentType.STATIC_REVIEWER,
                name="Static Reviewer Agent",
                capabilities=["check_sql_syntax", "verify_migration_order", "validate_snapshot_consistency", "review_diff_scope"],
                status="active",
                description="Checks SQL syntax patterns, verifies migration order, validates snapshot/journal consistency, reviews diff scope"
            ),
            AgentType.TEST_REVIEWER: Agent(
                agentId="test_reviewer",
                agentType=AgentType.TEST_REVIEWER,
                name="Test Reviewer Agent",
                capabilities=["ensure_test_coverage", "validate_duplicate_object_tests", "check_downstream_tests", "verify_test_completeness"],
                status="active",
                description="Ensures test coverage for duplicate-object failures, validates downstream checks, verifies test completeness"
            ),
            AgentType.VERIFICATION_RUNNER: Agent(
                agentId="verification_runner",
                agentType=AgentType.VERIFICATION_RUNNER,
                name="Verification Runner Agent",
                capabilities=["execute_migration_chain", "verify_schema_state", "run_integration_tests", "run_security_tests"],
                status="active",
                description="Executes full migration chain against fresh PostgreSQL, verifies schema, runs integration and security tests"
            ),
            AgentType.EVIDENCE_ASSEMBLER: Agent(
                agentId="evidence_assembler",
                agentType=AgentType.EVIDENCE_ASSEMBLER,
                name="Evidence Assembler Agent",
                capabilities=["collect_logs_and_exit_codes", "capture_test_results", "hash_artifacts", "write_evidence_ledger"],
                status="active",
                description="Collects raw logs and exit codes, captures test results, hashes artifacts, writes to evidence ledger"
            ),
            AgentType.FINAL_GATE_AGENT: Agent(
                agentId="final_gate_agent",
                agentType=AgentType.FINAL_GATE_AGENT,
                name="Final Gate Agent",
                capabilities=["review_code_independently", "validate_test_evidence", "verify_commit_identity", "issue_pass_fail_blocked_verdict"],
                status="active",
                description="Reviews code and evidence independently, validates test evidence, verifies commit identity, issues verdict"
            ),
            AgentType.PUBLISHER_AGENT: Agent(
                agentId="publisher_agent",
                agentType=AgentType.PUBLISHER_AGENT,
                name="Publisher Agent",
                capabilities=["commit_verified_changes", "publish_evidence", "confirm_sha_match", "record_publication_audit"],
                status="active",
                description="Commits verified changes after approval, publishes evidence, confirms SHA match, records publication audit"
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
            List of all 28 specialized agents
        """
        return list(self.agents.values())
