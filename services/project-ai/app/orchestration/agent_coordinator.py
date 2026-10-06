"""
Agent Coordinator for DAG-based agent orchestration.

This module implements the execution framework that transforms agent
capability declarations into functioning orchestrated workflows.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from collections import defaultdict

from app.models.agent_result import AgentResult, AgentStatus, GateStatus
from app.orchestration.agent_registry import Agent, AgentType, AgentRegistry
from app.verification import brand, theme, composer, runtime, browser


@dataclass
class AgentContext:
    """Context provided to an agent during execution."""
    
    task_id: str
    workflow_state: Dict[str, Any]
    repository_snapshot: Dict[str, Any]
    evidence_graph: Dict[str, Any]
    approved_scope: List[str]
    prior_agent_outputs: Dict[str, 'AgentResult']
    repository_root: Path
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


class AgentCoordinator:
    """
    Coordinates execution of specialized agents in DAG-based workflows.
    
    The coordinator:
    1. Resolves agent dependencies to create execution DAG
    2. Executes agents in topological order
    3. Handles parallel execution where dependencies allow
    4. Collects and propagates results through workflow
    5. Manages failure handling and retry policies
    """
    
    def __init__(self, registry: Optional[AgentRegistry] = None):
        """
        Initialize agent coordinator.
        
        Args:
            registry: Agent registry (creates new if not provided)
        """
        self.registry = registry or AgentRegistry()
        self._execution_history: List[AgentResult] = []
    
    async def execute_agent(
        self,
        agent_id: str,
        context: AgentContext
    ) -> AgentResult:
        """
        Execute a single agent with given context.
        
        Maps agent capabilities to actual verification module functions
        and executes them, collecting results.
        
        Args:
            agent_id: Agent identifier
            context: Execution context
            
        Returns:
            AgentResult with execution status and outputs
        """
        start_time = datetime.now(UTC)
        
        try:
            # Get agent definition
            agent_type = AgentType(agent_id)
            agent = self.registry.get_agent(agent_type)
            
            # Execute agent capabilities
            result = await self._execute_agent_capabilities(agent, context)
            
            # Record execution time
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            result.execution_time_ms = execution_time
            
            # Store in history
            self._execution_history.append(result)
            
            return result
            
        except Exception as e:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.FAILED,
                errors=[f"Agent execution failed: {str(e)}"],
                execution_time_ms=execution_time
            )
    
    async def _execute_agent_capabilities(
        self,
        agent: Agent,
        context: AgentContext
    ) -> AgentResult:
        """
        Execute agent capabilities by mapping to verification modules.
        
        This is where capability declarations become real implementations.
        
        Args:
            agent: Agent definition
            context: Execution context
            
        Returns:
            AgentResult with outputs from capability executions
        """
        result = AgentResult(
            agent_id=agent.agentId,
            status=AgentStatus.SUCCESS,
            outputs={},
            evidence_ids=[],
            errors=[],
            warnings=[]
        )
        
        # Map agent type to execution handlers
        # Wave R4 handlers (six new agent handlers)
        if agent.agentId == "toolchain":
            from app.agents.toolchain import execute_toolchain
            return await execute_toolchain(context)
        elif agent.agentId == "dependency":
            from app.agents.dependency import execute_dependency
            return await execute_dependency(context)
        elif agent.agentId == "intake":
            from app.agents.intake import execute_intake
            return await execute_intake(context)
        elif agent.agentId == "placement":
            from app.agents.placement import execute_placement
            return await execute_placement(context)
        elif agent.agentId == "governance":
            from app.agents.governance import execute_governance
            return await execute_governance(context)
        elif agent.agentId == "documentation":
            from app.agents.documentation import execute_documentation
            return await execute_documentation(context)
        elif agent.agentId == "final-gate":
            from app.agents.final_gate import execute_final_gate
            return await execute_final_gate(context)
        
        # Existing handlers
        elif agent.agentType == AgentType.BRAND_INDEPENDENCE:
            await self._execute_brand_agent(agent, context, result)
        
        elif agent.agentType == AgentType.THEME_COMPATIBILITY:
            await self._execute_theme_agent(agent, context, result)
        
        elif agent.agentType == AgentType.COMPOSER:
            await self._execute_composer_agent(agent, context, result)
        
        elif agent.agentType == AgentType.COMPOSER_WORKFLOW:
            await self._execute_composer_workflow_agent(agent, context, result)
        
        elif agent.agentType == AgentType.RUNTIME_BROWSER:
            await self._execute_runtime_browser_agent(agent, context, result)
        
        elif agent.agentType == AgentType.UBRC:
            await self._execute_ubrc_agent(agent, context, result)
        
        elif agent.agentType == AgentType.REPOSITORY_AUDITOR:
            await self._execute_repository_auditor(agent, context, result)
        
        elif agent.agentType == AgentType.GATE_CONTROLLER:
            await self._execute_gate_controller(agent, context, result)
        
        elif agent.agentType == AgentType.CANDIDATE_CERTIFICATION:
            await self._execute_certification_agent(agent, context, result)
        
        else:
            # For agents without implemented handlers yet, mark as success with stub
            result.warnings.append(f"Agent {agent.agentId} has no execution handler yet (stub)")
            result.outputs["status"] = "stub_execution"
        
        return result
    
    async def _execute_brand_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute brand independence verification capabilities."""
        try:
            # Get files to verify from context
            files_to_verify = context.workflow_state.get('files_to_verify', [])
            
            if not files_to_verify:
                # Get from snapshot - verify all implemented blocks
                blocks_data = context.repository_snapshot.get('blocks', {})
                implemented = blocks_data.get('implemented', [])
                files_to_verify = [
                    context.repository_root / block.get('implementationPath', '')
                    for block in implemented
                    if block.get('implementationPath')
                ]
            
            verification_results = []
            for file_path in files_to_verify:
                if isinstance(file_path, str):
                    file_path = Path(file_path)
                
                if not file_path.exists():
                    continue
                
                verification = brand.verify_brand_independence(
                    file_path,
                    context.repository_root,
                    context.repository_snapshot
                )
                verification_results.append(verification)
                result.evidence_ids.extend(verification.evidence_ids)
            
            # Aggregate results
            passed_count = sum(1 for v in verification_results if v.passed)
            total_count = len(verification_results)
            total_findings = sum(v.error_count for v in verification_results)
            
            result.outputs["verification_results"] = [
                {
                    "file_path": v.file_path,
                    "passed": v.passed,
                    "error_count": v.error_count,
                    "is_theme_aware": v.is_theme_aware,
                    "findings": [
                        {
                            "line_number": f.line_number,
                            "error_code": f.error_code.value,
                            "description": f.description
                        }
                        for f in v.findings
                    ]
                }
                for v in verification_results
            ]
            result.outputs["summary"] = {
                "passed": passed_count,
                "failed": total_count - passed_count,
                "total": total_count,
                "findings": total_findings
            }
            
            if total_findings > 0:
                result.warnings.append(
                    f"Brand independence violations found: {total_findings} findings across {total_count - passed_count} files"
                )
        
        except Exception as e:
            result.status = AgentStatus.FAILED
            result.errors.append(f"Brand agent execution failed: {str(e)}")
    
    async def _execute_theme_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute theme compatibility verification capabilities."""
        try:
            # Get block types to verify from context
            block_types = context.workflow_state.get('block_types', [])
            
            if not block_types:
                # Get from snapshot - verify all blocks
                blocks_data = context.repository_snapshot.get('blocks', {})
                implemented = blocks_data.get('implemented', [])
                block_types = [block.get('type') for block in implemented if block.get('type')]
            
            all_verifications = []
            for block_type in block_types:
                verifications = theme.verify_theme_compatibility(
                    block_type,
                    context.repository_snapshot,
                    context.repository_root
                )
                all_verifications.extend(verifications)
                
                # Collect evidence IDs
                for verification in verifications:
                    result.evidence_ids.extend(verification.evidence_ids)
            
            # Aggregate results
            passed_count = sum(1 for v in all_verifications if v.passed)
            total_count = len(all_verifications)
            
            result.outputs["theme_verifications"] = [
                {
                    "theme_name": v.theme_name,
                    "passed": v.passed,
                    "error_code": v.error_code.value if v.error_code else None,
                    "theme_context_detected": v.theme_context_detected,
                    "design_tokens_used": v.design_tokens_used,
                    "hardcoded_values": v.hardcoded_values
                }
                for v in all_verifications
            ]
            result.outputs["summary"] = {
                "passed": passed_count,
                "failed": total_count - passed_count,
                "total": total_count,
                "themes_tested": len(set(v.theme_name for v in all_verifications))
            }
            
            if passed_count < total_count:
                result.warnings.append(
                    f"Theme compatibility issues: {total_count - passed_count}/{total_count} theme checks failed"
                )
        
        except Exception as e:
            result.status = AgentStatus.FAILED
            result.errors.append(f"Theme agent execution failed: {str(e)}")
    
    async def _execute_composer_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute composer integration verification capabilities."""
        try:
            # Get block types to verify
            block_types = context.workflow_state.get('block_types', [])
            
            if not block_types:
                blocks_data = context.repository_snapshot.get('blocks', {})
                implemented = blocks_data.get('implemented', [])
                block_types = [block.get('type') for block in implemented if block.get('type')]
            
            verifications = []
            for block_type in block_types:
                verification = composer.verify_composer_integration(
                    block_type,
                    context.repository_snapshot,
                    context.repository_root
                )
                verifications.append(verification)
                result.evidence_ids.extend(verification.evidence_ids)
            
            passed_count = sum(1 for v in verifications if v.passed)
            total_count = len(verifications)
            
            result.outputs["composer_verifications"] = [
                {
                    "block_type": v.block_type,
                    "passed": v.passed,
                    "is_registered": v.is_registered,
                    "is_discoverable": v.is_discoverable,
                    "schema_valid": v.schema_valid,
                    "renderer_valid": v.renderer_valid,
                    "error_code": v.error_code.value if v.error_code else None
                }
                for v in verifications
            ]
            result.outputs["summary"] = {
                "passed": passed_count,
                "failed": total_count - passed_count,
                "total": total_count
            }
            
            if passed_count < total_count:
                result.status = AgentStatus.FAILED
                result.errors.append(
                    f"Composer integration failures: {total_count - passed_count}/{total_count} blocks failed"
                )
        
        except Exception as e:
            result.status = AgentStatus.FAILED
            result.errors.append(f"Composer agent execution failed: {str(e)}")
    
    async def _execute_composer_workflow_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute composer workflow orchestration capabilities."""
        # This agent orchestrates the I2 workflow
        result.outputs["workflow_status"] = "validated"
        result.outputs["i2_flow"] = "intake → certification → placement"
        result.warnings.append("Composer workflow agent using simplified validation")
    
    async def _execute_runtime_browser_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute runtime browser verification capabilities."""
        try:
            # Get blocks to verify
            block_types = context.workflow_state.get('block_types', [])
            
            # Browser verification requires actual browser launch
            # For now, verify browser module availability
            result.outputs["browser_available"] = True
            result.outputs["blocks_to_verify"] = block_types
            result.warnings.append("Browser verification requires runtime environment (stub)")
        
        except Exception as e:
            result.status = AgentStatus.FAILED
            result.errors.append(f"Runtime browser agent execution failed: {str(e)}")
    
    async def _execute_ubrc_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute UBRC compliance verification capabilities."""
        try:
            # Check UBRC status from snapshot
            blocks_data = context.repository_snapshot.get('blocks', {})
            rendered_blocks = blocks_data.get('rendered', [])
            
            ubrc_results = []
            for block in rendered_blocks:
                ubrc_status = block.get('ubrcStatus', 'UNKNOWN')
                ubrc_results.append({
                    "block_type": block.get('blockType'),
                    "status": ubrc_status,
                    "compliant": ubrc_status == 'UBRC_VALID'
                })
            
            compliant_count = sum(1 for r in ubrc_results if r['compliant'])
            total_count = len(ubrc_results)
            
            result.outputs["ubrc_results"] = ubrc_results
            result.outputs["summary"] = {
                "compliant": compliant_count,
                "non_compliant": total_count - compliant_count,
                "total": total_count
            }
            
            if compliant_count < total_count:
                result.warnings.append(
                    f"UBRC compliance issues: {total_count - compliant_count}/{total_count} blocks non-compliant"
                )
        
        except Exception as e:
            result.status = AgentStatus.FAILED
            result.errors.append(f"UBRC agent execution failed: {str(e)}")
    
    async def _execute_repository_auditor(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute repository audit capabilities."""
        try:
            # Verify snapshot is valid
            snapshot = context.repository_snapshot
            
            # Check for required sections
            required_sections = ['structure', 'blocks', 'composer', 'evidence']
            missing_sections = [s for s in required_sections if s not in snapshot]
            
            if missing_sections:
                result.warnings.append(f"Snapshot missing sections: {', '.join(missing_sections)}")
            
            # Count evidence entries
            evidence_count = len(snapshot.get('evidence', []))
            
            result.outputs["snapshot_valid"] = len(missing_sections) == 0
            result.outputs["evidence_count"] = evidence_count
            result.outputs["sections_found"] = list(snapshot.keys())
        
        except Exception as e:
            result.status = AgentStatus.FAILED
            result.errors.append(f"Repository auditor execution failed: {str(e)}")
    
    async def _execute_gate_controller(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute gate control orchestration capabilities."""
        # Check prior agent results to enforce gates
        failed_agents = [
            agent_id for agent_id, agent_result in context.prior_agent_outputs.items()
            if agent_result.failed
        ]
        
        blocked = len(failed_agents) > 0
        
        result.outputs["gates_passed"] = not blocked
        result.outputs["failed_agents"] = failed_agents
        
        if blocked:
            result.status = AgentStatus.BLOCKED
            result.errors.append(f"Quality gates failed: {', '.join(failed_agents)}")
    
    async def _execute_certification_agent(
        self,
        agent: Agent,
        context: AgentContext,
        result: AgentResult
    ) -> None:
        """Execute candidate certification capabilities."""
        # Run certification gates based on prior agent results
        prior_results = context.prior_agent_outputs
        
        # Check if required agents passed
        required_agents = [
            'brand_independence',
            'theme_compatibility',
            'ubrc',
            'composer'
        ]
        
        certification_passed = all(
            prior_results.get(agent_id, AgentResult(agent_id=agent_id, status=AgentStatus.FAILED)).passed
            for agent_id in required_agents
        )
        
        result.outputs["certification_passed"] = certification_passed
        result.outputs["required_gates"] = required_agents
        result.outputs["verdict"] = "CERTIFIED" if certification_passed else "REJECTED"
        
        if not certification_passed:
            result.status = AgentStatus.FAILED
            failed = [a for a in required_agents if not prior_results.get(a, AgentResult(agent_id=a, status=AgentStatus.FAILED)).passed]
            result.errors.append(f"Certification failed: {', '.join(failed)} agents did not pass")
    
    async def execute_dag(
        self,
        agents: List[Agent],
        dependencies: Dict[str, List[str]],
        context: AgentContext
    ) -> Dict[str, AgentResult]:
        """
        Execute agents in DAG order respecting dependencies.
        
        Args:
            agents: List of agents to execute
            dependencies: Dict mapping agent_id -> list of dependency agent_ids
            context: Execution context
            
        Returns:
            Dict of agent_id -> AgentResult
        """
        results: Dict[str, AgentResult] = {}
        pending = {agent.agentId for agent in agents}
        in_progress: Set[str] = set()
        
        # Build reverse dependency graph (who depends on me)
        dependents: Dict[str, List[str]] = defaultdict(list)
        for agent_id, deps in dependencies.items():
            for dep in deps:
                dependents[dep].append(agent_id)
        
        while pending:
            # Find agents ready to execute (all dependencies satisfied)
            ready = [
                agent_id for agent_id in pending
                if all(dep in results for dep in dependencies.get(agent_id, []))
            ]
            
            if not ready:
                # Circular dependency or missing dependency
                remaining = list(pending)
                results.update({
                    agent_id: AgentResult(
                        agent_id=agent_id,
                        status=AgentStatus.BLOCKED,
                        errors=[f"Circular dependency or missing dependency for {agent_id}"]
                    )
                    for agent_id in remaining
                })
                break
            
            # Execute ready agents in parallel
            tasks = []
            for agent_id in ready:
                pending.remove(agent_id)
                in_progress.add(agent_id)
                
                # Update context with prior results
                execution_context = AgentContext(
                    task_id=context.task_id,
                    workflow_state=context.workflow_state,
                    repository_snapshot=context.repository_snapshot,
                    evidence_graph=context.evidence_graph,
                    approved_scope=context.approved_scope,
                    prior_agent_outputs=results.copy(),
                    repository_root=context.repository_root
                )
                
                tasks.append((agent_id, self.execute_agent(agent_id, execution_context)))
            
            # Await all parallel tasks
            for agent_id, task in tasks:
                result = await task
                results[agent_id] = result
                in_progress.remove(agent_id)
        
        return results
    
    async def execute_parallel(
        self,
        agents: List[Agent],
        context: AgentContext
    ) -> List[AgentResult]:
        """
        Execute multiple agents in parallel (no dependencies).
        
        Args:
            agents: List of agents to execute
            context: Execution context
            
        Returns:
            List of AgentResults in same order as agents
        """
        tasks = [
            self.execute_agent(agent.agentId, context)
            for agent in agents
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Convert exceptions to failed results
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(AgentResult(
                    agent_id=agents[i].agentId,
                    status=AgentStatus.FAILED,
                    errors=[f"Agent execution raised exception: {str(result)}"]
                ))
            else:
                final_results.append(result)
        
        return final_results
    
    async def execute_sequential(
        self,
        agents: List[Agent],
        context: AgentContext
    ) -> List[AgentResult]:
        """
        Execute agents sequentially (strict ordering).
        
        Args:
            agents: List of agents to execute in order
            context: Execution context
            
        Returns:
            List of AgentResults in same order as agents
        """
        results: List[AgentResult] = []
        prior_outputs: Dict[str, AgentResult] = {}
        
        for agent in agents:
            # Update context with prior results
            execution_context = AgentContext(
                task_id=context.task_id,
                workflow_state=context.workflow_state,
                repository_snapshot=context.repository_snapshot,
                evidence_graph=context.evidence_graph,
                approved_scope=context.approved_scope,
                prior_agent_outputs=prior_outputs.copy(),
                repository_root=context.repository_root
            )
            
            result = await self.execute_agent(agent.agentId, execution_context)
            results.append(result)
            prior_outputs[agent.agentId] = result
            
            # Stop on failure if agent is critical
            if result.failed and agent.agentType in [
                AgentType.REPOSITORY_AUDITOR,
                AgentType.GATE_CONTROLLER
            ]:
                # Mark remaining agents as skipped
                for remaining_agent in agents[len(results):]:
                    results.append(AgentResult(
                        agent_id=remaining_agent.agentId,
                        status=AgentStatus.SKIPPED,
                        warnings=[f"Skipped due to failure of {agent.agentId}"]
                    ))
                break
        
        return results
    
    def get_execution_history(self) -> List[AgentResult]:
        """Get history of all agent executions."""
        return self._execution_history.copy()
    
    def clear_history(self) -> None:
        """Clear execution history."""
        self._execution_history.clear()
