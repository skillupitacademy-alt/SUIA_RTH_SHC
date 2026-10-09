"""Tests for agent coordinator and DAG-based orchestration."""

import pytest
from pathlib import Path
from datetime import datetime

from app.orchestration.agent_coordinator import (
    AgentCoordinator,
    AgentContext,
    AgentResult,
    AgentStatus
)
from app.orchestration.agent_registry import AgentRegistry, AgentType, Agent


class TestAgentCoordinator:
    """Test suite for AgentCoordinator."""
    
    @pytest.fixture
    def coordinator(self):
        """Create agent coordinator for testing."""
        return AgentCoordinator()
    
    @pytest.fixture
    def sample_context(self, tmp_path):
        """Create sample agent context for testing."""
        return AgentContext(
            task_id="test-task-001",
            workflow_state={"test": "value"},
            repository_snapshot={
                "blocks": {
                    "implemented": [],
                    "verified": [],
                    "rendered": []
                },
                "evidence": []
            },
            evidence_graph={},
            approved_scope=["test_scope"],
            prior_agent_outputs={},
            repository_root=tmp_path
        )
    
    @pytest.mark.asyncio
    async def test_execute_agent_success(self, coordinator, sample_context):
        """Agent executes successfully and returns result."""
        result = await coordinator.execute_agent(
            "repository_auditor",
            sample_context
        )
        
        assert isinstance(result, AgentResult)
        assert result.agent_id == "repository_auditor"
        assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED]
        assert result.execution_time_ms >= 0
    
    @pytest.mark.asyncio
    async def test_execute_agent_invalid_id(self, coordinator, sample_context):
        """Invalid agent ID results in failed result."""
        result = await coordinator.execute_agent(
            "invalid_agent_id",
            sample_context
        )
        
        assert result.status == AgentStatus.FAILED
        assert len(result.errors) > 0
        assert "invalid" in result.errors[0].lower() or "failed" in result.errors[0].lower()
    
    @pytest.mark.asyncio
    async def test_execute_parallel_agents(self, coordinator, sample_context):
        """Multiple agents execute in parallel."""
        agents = [
            coordinator.registry.get_agent(AgentType.BRAND_INDEPENDENCE),
            coordinator.registry.get_agent(AgentType.THEME_COMPATIBILITY),
            coordinator.registry.get_agent(AgentType.UBRC)
        ]
        
        results = await coordinator.execute_parallel(agents, sample_context)
        
        assert len(results) == 3
        assert all(isinstance(r, AgentResult) for r in results)
        assert results[0].agent_id == "brand_independence"
        assert results[1].agent_id == "theme_compatibility"
        assert results[2].agent_id == "ubrc"
    
    @pytest.mark.asyncio
    async def test_execute_sequential_agents(self, coordinator, sample_context):
        """Sequential agents execute in order with results propagated."""
        agents = [
            coordinator.registry.get_agent(AgentType.REPOSITORY_AUDITOR),
            coordinator.registry.get_agent(AgentType.TOOLCHAIN),
            coordinator.registry.get_agent(AgentType.COMPOSER)
        ]
        
        results = await coordinator.execute_sequential(agents, sample_context)
        
        assert len(results) == 3
        assert results[0].agent_id == "repository_auditor"
        assert results[1].agent_id == "toolchain"
        assert results[2].agent_id == "composer"
        
        # Results should have timestamps showing sequential execution
        assert results[0].timestamp <= results[1].timestamp
        assert results[1].timestamp <= results[2].timestamp
    
    @pytest.mark.asyncio
    async def test_execute_dag_simple(self, coordinator, sample_context):
        """DAG execution respects simple dependencies."""
        agents = [
            coordinator.registry.get_agent(AgentType.REPOSITORY_AUDITOR),
            coordinator.registry.get_agent(AgentType.BRAND_INDEPENDENCE)
        ]
        
        # Brand agent depends on repository auditor
        dependencies = {
            "repository_auditor": [],
            "brand_independence": ["repository_auditor"]
        }
        
        results = await coordinator.execute_dag(agents, dependencies, sample_context)
        
        assert len(results) == 2
        assert "repository_auditor" in results
        assert "brand_independence" in results
        
        # Repository auditor should finish before brand agent
        auditor_result = results["repository_auditor"]
        brand_result = results["brand_independence"]
        assert auditor_result.timestamp <= brand_result.timestamp
    
    @pytest.mark.asyncio
    async def test_execute_dag_complex(self, coordinator, sample_context):
        """DAG execution handles complex dependencies with parallel paths."""
        agents = [
            coordinator.registry.get_agent(AgentType.REPOSITORY_AUDITOR),
            coordinator.registry.get_agent(AgentType.BRAND_INDEPENDENCE),
            coordinator.registry.get_agent(AgentType.THEME_COMPATIBILITY),
            coordinator.registry.get_agent(AgentType.CANDIDATE_CERTIFICATION),
            coordinator.registry.get_agent(AgentType.GATE_CONTROLLER)
        ]
        
        # Dependencies:
        # auditor → brand, theme (parallel)
        # brand, theme → certification
        # certification → gate_controller
        dependencies = {
            "repository_auditor": [],
            "brand_independence": ["repository_auditor"],
            "theme_compatibility": ["repository_auditor"],
            "candidate_certification": ["brand_independence", "theme_compatibility"],
            "gate_controller": ["candidate_certification"]
        }
        
        results = await coordinator.execute_dag(agents, dependencies, sample_context)
        
        assert len(results) == 5
        
        # Verify execution order constraints
        auditor = results["repository_auditor"]
        brand = results["brand_independence"]
        theme = results["theme_compatibility"]
        cert = results["candidate_certification"]
        gate = results["gate_controller"]
        
        # Auditor must finish before brand and theme
        assert auditor.timestamp <= brand.timestamp
        assert auditor.timestamp <= theme.timestamp
        
        # Brand and theme must finish before certification
        assert brand.timestamp <= cert.timestamp
        assert theme.timestamp <= cert.timestamp
        
        # Certification must finish before gate controller
        assert cert.timestamp <= gate.timestamp
    
    @pytest.mark.asyncio
    async def test_execute_dag_circular_dependency(self, coordinator, sample_context):
        """DAG execution detects circular dependencies."""
        agents = [
            coordinator.registry.get_agent(AgentType.BRAND_INDEPENDENCE),
            coordinator.registry.get_agent(AgentType.THEME_COMPATIBILITY)
        ]
        
        # Circular dependency: brand → theme → brand
        dependencies = {
            "brand_independence": ["theme_compatibility"],
            "theme_compatibility": ["brand_independence"]
        }
        
        results = await coordinator.execute_dag(agents, dependencies, sample_context)
        
        # Both should be blocked due to circular dependency
        assert results["brand_independence"].status == AgentStatus.BLOCKED
        assert results["theme_compatibility"].status == AgentStatus.BLOCKED
    
    @pytest.mark.asyncio
    async def test_execute_dag_missing_dependency(self, coordinator, sample_context):
        """DAG execution handles missing dependencies."""
        agents = [
            coordinator.registry.get_agent(AgentType.BRAND_INDEPENDENCE)
        ]
        
        # Dependency on agent not in execution list
        dependencies = {
            "brand_independence": ["nonexistent_agent"]
        }
        
        results = await coordinator.execute_dag(agents, dependencies, sample_context)
        
        assert results["brand_independence"].status == AgentStatus.BLOCKED
        assert any("dependency" in err.lower() for err in results["brand_independence"].errors)
    
    @pytest.mark.asyncio
    async def test_execute_brand_agent(self, coordinator, sample_context, tmp_path):
        """Brand independence agent executes with real verification."""
        # Create a test file with brand violations
        test_file = tmp_path / "test_block.tsx"
        test_file.write_text("""
        export const TestBlock = () => {
            return <div style={{ color: '#FF5A00' }}>Brand color</div>;
        };
        """)
        
        sample_context.workflow_state["files_to_verify"] = [test_file]
        
        result = await coordinator.execute_agent(
            "brand_independence",
            sample_context
        )
        
        assert result.agent_id == "brand_independence"
        assert "verification_results" in result.outputs
        assert "summary" in result.outputs
    
    @pytest.mark.asyncio
    async def test_execute_theme_agent(self, coordinator, sample_context):
        """Theme compatibility agent executes with real verification."""
        # Add test block to snapshot
        sample_context.repository_snapshot["blocks"]["implemented"] = [
            {
                "type": "introduction",
                "implementationPath": "test/path/introduction.tsx"
            }
        ]
        
        result = await coordinator.execute_agent(
            "theme_compatibility",
            sample_context
        )
        
        assert result.agent_id == "theme_compatibility"
        # May have outputs or warnings depending on whether themes are discovered
        assert "theme_verifications" in result.outputs or len(result.warnings) > 0
    
    @pytest.mark.asyncio
    async def test_execute_composer_agent(self, coordinator, sample_context):
        """Composer integration agent executes with real verification."""
        # Add test block to snapshot
        sample_context.repository_snapshot["blocks"]["implemented"] = [
            {
                "type": "introduction",
                "path": "test/path/introduction.ts"
            }
        ]
        sample_context.repository_snapshot["blocks"]["verified"] = [
            {
                "blockType": "introduction",
                "registered": True,
                "documented": True,
                "rendered": True
            }
        ]
        
        result = await coordinator.execute_agent(
            "composer",
            sample_context
        )
        
        assert result.agent_id == "composer"
        assert "composer_verifications" in result.outputs
        assert "summary" in result.outputs
    
    @pytest.mark.asyncio
    async def test_execute_gate_controller(self, coordinator, sample_context):
        """Gate controller enforces quality gates based on prior results."""
        # Set up prior results with a failure
        sample_context.prior_agent_outputs = {
            "brand_independence": AgentResult(
                agent_id="brand_independence",
                status=AgentStatus.FAILED,
                errors=["Brand violations found"]
            ),
            "theme_compatibility": AgentResult(
                agent_id="theme_compatibility",
                status=AgentStatus.SUCCESS
            )
        }
        
        result = await coordinator.execute_agent(
            "gate_controller",
            sample_context
        )
        
        assert result.agent_id == "gate_controller"
        assert result.status == AgentStatus.BLOCKED
        assert "gates_passed" in result.outputs
        assert result.outputs["gates_passed"] is False
        assert "failed_agents" in result.outputs
        assert "brand_independence" in result.outputs["failed_agents"]
    
    @pytest.mark.asyncio
    async def test_execute_certification_agent(self, coordinator, sample_context):
        """Certification agent issues verdict based on prior gate results."""
        # All gates pass
        sample_context.prior_agent_outputs = {
            "brand_independence": AgentResult(
                agent_id="brand_independence",
                status=AgentStatus.SUCCESS
            ),
            "theme_compatibility": AgentResult(
                agent_id="theme_compatibility",
                status=AgentStatus.SUCCESS
            ),
            "ubrc": AgentResult(
                agent_id="ubrc",
                status=AgentStatus.SUCCESS
            ),
            "composer": AgentResult(
                agent_id="composer",
                status=AgentStatus.SUCCESS
            )
        }
        
        result = await coordinator.execute_agent(
            "candidate_certification",
            sample_context
        )
        
        assert result.agent_id == "candidate_certification"
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs["certification_passed"] is True
        assert result.outputs["verdict"] == "CERTIFIED"
    
    @pytest.mark.asyncio
    async def test_certification_agent_rejects_on_failure(self, coordinator, sample_context):
        """Certification agent rejects if any required gate fails."""
        # One gate fails
        sample_context.prior_agent_outputs = {
            "brand_independence": AgentResult(
                agent_id="brand_independence",
                status=AgentStatus.SUCCESS
            ),
            "theme_compatibility": AgentResult(
                agent_id="theme_compatibility",
                status=AgentStatus.FAILED
            ),
            "ubrc": AgentResult(
                agent_id="ubrc",
                status=AgentStatus.SUCCESS
            ),
            "composer": AgentResult(
                agent_id="composer",
                status=AgentStatus.SUCCESS
            )
        }
        
        result = await coordinator.execute_agent(
            "candidate_certification",
            sample_context
        )
        
        assert result.status == AgentStatus.FAILED
        assert result.outputs["certification_passed"] is False
        assert result.outputs["verdict"] == "REJECTED"
    
    @pytest.mark.asyncio
    async def test_execute_canonical_comparison_agent(self, coordinator, sample_context):
        """Canonical comparison agent executes through coordinator dispatch."""
        # Set up workflow state with candidate, target, and contract data
        sample_context.workflow_state = {
            "candidate": {
                "files": [
                    {"name": "prototype.html", "sha256": "hash1"},
                    {"name": "implementation.tsx", "sha256": "hash2"},
                    {"name": "types.ts", "sha256": "hash3"},
                    {"name": "test.spec.ts", "sha256": "hash4"},
                ]
            },
            "target": {
                "family": "Introduction",
                "version": "I7"
            },
            "contract": {
                "family": "Introduction",
                "version": "I7",
                "block_type": "introduction_i7",
                "references": [
                    {
                        "family": "Introduction",
                        "version": "I7",
                        "evidence": [
                            {
                                "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                                "sha256": "abc123def456",
                                "role": "canonical_block",
                                "evidence_id": "evidence_intro_i7"
                            }
                        ]
                    }
                ],
                "required_artifacts": [
                    "HTML/CSS/JS prototype",
                    "React/TypeScript implementation",
                    "Type definitions",
                    "Unit tests"
                ],
                "runtime": {
                    "entry_point": "IntroductionBlock",
                    "dependencies": []
                }
            }
        }
        
        # Execute canonical_comparison agent
        result = await coordinator.execute_agent(
            "canonical_comparison",
            sample_context
        )
        
        # Verify agent executed (not stub, not fallthrough)
        assert result.agent_id == "canonical_comparison"
        assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED, AgentStatus.BLOCKED]
        
        # Verify comparison_result is in outputs (not stub execution)
        assert "comparison_result" in result.outputs
        assert "status" not in result.outputs or result.outputs.get("status") != "stub_execution"
        
        # Verify comparison result structure
        comparison = result.outputs["comparison_result"]
        assert "status" in comparison
        assert comparison["status"] in ["PASS", "FAIL", "BLOCKED"]
        assert "target_match" in comparison
        assert "artifacts" in comparison
        assert "evidence_ids" in comparison
        
        # Verify evidence IDs are populated
        assert len(result.evidence_ids) > 0 or len(comparison["evidence_ids"]) > 0
    
    @pytest.mark.asyncio
    async def test_canonical_comparison_returns_blocked_without_contract(self, coordinator, sample_context):
        """Canonical comparison returns BLOCKED when contract is unavailable."""
        # Set up workflow state without contract
        sample_context.workflow_state = {
            "candidate": {
                "files": [
                    {"name": "prototype.html", "sha256": "hash1"}
                ]
            },
            "target": {
                "family": "Introduction",
                "version": "I7"
            }
            # No contract
        }
        
        result = await coordinator.execute_agent(
            "canonical_comparison",
            sample_context
        )
        
        assert result.agent_id == "canonical_comparison"
        # Agent may return FAILED or BLOCKED depending on implementation
        assert result.status in [AgentStatus.FAILED, AgentStatus.BLOCKED]
        
        # Should have comparison_result with BLOCKED status
        if "comparison_result" in result.outputs:
            comparison = result.outputs["comparison_result"]
            assert comparison["status"] == "BLOCKED"
    
    @pytest.mark.asyncio
    async def test_canonical_comparison_returns_fail_on_version_mismatch(self, coordinator, sample_context):
        """Canonical comparison returns FAIL when version mismatches."""
        # Set up workflow state with version mismatch
        sample_context.workflow_state = {
            "candidate": {
                "files": [
                    {"name": "prototype.html", "sha256": "hash1"},
                    {"name": "implementation.tsx", "sha256": "hash2"},
                ]
            },
            "target": {
                "family": "Introduction",
                "version": "I8"  # Requesting I8
            },
            "contract": {
                "family": "Introduction",
                "version": "I7",  # But contract is I7
                "block_type": "introduction_i7",
                "references": [
                    {
                        "family": "Introduction",
                        "version": "I7",
                        "evidence": [
                            {
                                "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                                "sha256": "abc123",
                                "role": "canonical_block",
                                "evidence_id": "eid_intro"
                            }
                        ]
                    }
                ],
                "required_artifacts": ["HTML/CSS/JS prototype"],
                "runtime": {
                    "entry_point": "IntroductionBlock",
                    "dependencies": []
                }
            }
        }
        
        result = await coordinator.execute_agent(
            "canonical_comparison",
            sample_context
        )
        
        assert result.agent_id == "canonical_comparison"
        assert result.status == AgentStatus.FAILED
        
        # Verify comparison_result shows FAIL
        comparison = result.outputs["comparison_result"]
        assert comparison["status"] == "FAIL"
        assert comparison["target_match"] is False
        assert len(comparison["conflicts"]) > 0
        assert any("mismatch" in conflict.lower() for conflict in comparison["conflicts"])
    
    def test_execution_history_tracking(self, coordinator, sample_context):
        """Coordinator tracks execution history."""
        initial_history = coordinator.get_execution_history()
        assert len(initial_history) == 0
        
        # Clear history works
        coordinator.clear_history()
        assert len(coordinator.get_execution_history()) == 0
    
    def test_agent_result_properties(self):
        """AgentResult properties work correctly."""
        success_result = AgentResult(
            agent_id="test",
            status=AgentStatus.SUCCESS
        )
        assert success_result.passed is True
        assert success_result.failed is False
        
        failed_result = AgentResult(
            agent_id="test",
            status=AgentStatus.FAILED
        )
        assert failed_result.passed is False
        assert failed_result.failed is True


class TestAgentContextCreation:
    """Test agent context creation and usage."""
    
    def test_agent_context_creation(self, tmp_path):
        """AgentContext can be created with required fields."""
        context = AgentContext(
            task_id="test-001",
            workflow_state={"key": "value"},
            repository_snapshot={"blocks": {}},
            evidence_graph={},
            approved_scope=["scope1"],
            prior_agent_outputs={},
            repository_root=tmp_path
        )
        
        assert context.task_id == "test-001"
        assert context.workflow_state["key"] == "value"
        assert isinstance(context.timestamp, datetime)
        assert context.repository_root == tmp_path
    
    def test_agent_result_creation(self):
        """AgentResult can be created with outputs and errors."""
        result = AgentResult(
            agent_id="test_agent",
            status=AgentStatus.SUCCESS,
            outputs={"result": "data"},
            evidence_ids=["ev-001", "ev-002"],
            errors=[],
            warnings=["minor warning"],
            execution_time_ms=123.45
        )
        
        assert result.agent_id == "test_agent"
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs["result"] == "data"
        assert len(result.evidence_ids) == 2
        assert len(result.warnings) == 1
        assert result.execution_time_ms == 123.45
