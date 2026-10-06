"""
Runtime Agent (Agent 12K).

Verifies blocks at runtime by starting application, performing health checks,
and collecting runtime verification results.

ARCHITECTURAL RULE:
- Use approved toolchain commands only (pnpm --filter <target> dev)
- No arbitrary shell execution
- Clean process lifecycle management
- Collect evidence from running application
- Return evidence_ids from snapshot
"""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.verification.runtime import verify_runtime


async def execute_runtime_agent(context: AgentContext) -> AgentResult:
    """
    Execute Runtime Agent (Agent 12K).
    
    Workflow:
    1. Extract candidate blocks from workflow state
    2. Get target application and route from context
    3. Call verification/runtime.py verify_runtime()
    4. Collect runtime verification results
    5. Return AgentResult with runtime_status, test_results, evidence_ids
    
    Args:
        context: Agent execution context with snapshot and workflow state
        
    Returns:
        AgentResult with runtime verification results
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract workflow state
        snapshot = context.repository_snapshot
        workflow_state = context.workflow_state
        
        # Get candidate blocks from workflow state
        candidate_blocks = workflow_state.get('candidate_blocks', [])
        if not candidate_blocks:
            # Try to get from prior agent outputs
            placement_result = context.prior_agent_outputs.get('placement', None)
            if placement_result and placement_result.outputs:
                candidate_blocks = placement_result.outputs.get('placed_blocks', [])
        
        if not candidate_blocks:
            return AgentResult(
                agent_id="runtime_agent",
                status=AgentStatus.BLOCKED,
                outputs={
                    'runtime_status': 'BLOCKED',
                    'message': 'No candidate blocks to verify'
                },
                evidence_ids=[],
                errors=['No candidate blocks found in workflow state'],
                warnings=[],
                execution_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
                timestamp=datetime.now(UTC)
            )
        
        # Get target application and route
        target = workflow_state.get('target', 'realtutorialhub-admin')
        route = workflow_state.get('route', '/')
        
        # Collect all verification results
        all_evidence_ids: List[str] = []
        test_results: List[Dict[str, Any]] = []
        errors: List[str] = []
        warnings: List[str] = []
        
        # Verify each candidate block at runtime
        for candidate_block in candidate_blocks:
            block_type = candidate_block
            
            # Perform runtime verification
            result = verify_runtime(
                block_type=block_type,
                snapshot=snapshot,
                repository_root=context.repository_root,
                target=target,
                route=route,
                expected_content={'blockType': block_type}
            )
            
            # Collect evidence IDs
            all_evidence_ids.extend(result.evidenceIds)
            
            # Collect test result
            test_results.append({
                'block_type': block_type,
                'passed': result.passed,
                'verification_id': result.verificationId,
                'error_code': result.error_code.value if result.error_code else None,
                'error_message': result.error_message,
                'console_errors': result.consoleErrors,
                'network_errors': result.networkErrors
            })
            
            # Collect errors and warnings
            if not result.passed:
                errors.append(f"{block_type}: {result.error_message}")
            
            if result.consoleErrors:
                warnings.extend([f"{block_type}: {err}" for err in result.consoleErrors])
            
            if result.networkErrors:
                warnings.extend([f"{block_type}: {err}" for err in result.networkErrors])
        
        # Determine overall runtime status
        all_passed = all(r['passed'] for r in test_results)
        runtime_status = 'PASS' if all_passed else 'FAIL'
        
        if not all_evidence_ids:
            runtime_status = 'BLOCKED'
            errors.append('No evidence collected from runtime verification')
        
        # Build outputs
        outputs = {
            'runtime_status': runtime_status,
            'test_results': test_results,
            'blocks_verified': len(candidate_blocks),
            'blocks_passed': sum(1 for r in test_results if r['passed']),
            'blocks_failed': sum(1 for r in test_results if not r['passed'])
        }
        
        # Determine agent status
        if runtime_status == 'BLOCKED':
            agent_status = AgentStatus.BLOCKED
        elif runtime_status == 'FAIL':
            agent_status = AgentStatus.FAILED
        else:
            agent_status = AgentStatus.SUCCESS
        
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="runtime_agent",
            status=agent_status,
            outputs=outputs,
            evidence_ids=all_evidence_ids,
            errors=errors,
            warnings=warnings,
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="runtime_agent",
            status=AgentStatus.FAILED,
            outputs={
                'runtime_status': 'ERROR',
                'message': str(e)
            },
            evidence_ids=[],
            errors=[f"Runtime agent execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
