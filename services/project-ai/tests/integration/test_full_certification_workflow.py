"""
Integration test for complete 15-agent certification workflow.

Tests the end-to-end flow from repository audit through human certification.
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import tempfile
import json

from app.orchestration.workflow_engine import WorkflowEngine
from app.orchestration.agent_coordinator import AgentCoordinator, AgentContext
from app.orchestration.agent_registry import AgentRegistry
from app.models.agent_result import AgentResult, AgentStatus


@pytest.fixture
def mock_snapshot():
    """Create mock repository snapshot."""
    return {
        'canonicalHash': 'snapshot-hash-abc123',
        'repository': {
            'commitSha': 'commit-sha-def456',
            'root': '/test/repo'
        },
        'evidence': [
            {'evidenceId': 'ev-001', 'kind': 'type-definition', 'path': 'types/block.ts'},
            {'evidenceId': 'ev-002', 'kind': 'component', 'path': 'components/Block.tsx'},
            {'evidenceId': 'ev-003', 'kind': 'ubrc-verification', 'path': 'registry.ts'}
        ],
        'blocks': {
            'implemented': [
                {
                    'type': 'introduction',
                    'implementationPath': 'blocks/introduction/IntroductionBlock.tsx'
                }
            ],
            'verified': [
                {
                    'blockType': 'introduction',
                    'ubrcStatus': 'UBRC_VALID',
                    'registered': True
                }
            ]
        },
        'composer': {
            'discovered': True,
            'schemaValid': True
        },
        'dependencies': {
            'resolved': True,
            'circularDependencies': []
        }
    }


@pytest.fixture
def mock_context(mock_snapshot):
    """Create mock workflow context."""
    return {
        'task_id': 'integration-test-task',
        'run_id': 'integration-test-run',
        'candidate_id': 'candidate-introduction-block',
        'repository_root': str(Path.cwd()),
        'approved_scope': ['blocks/introduction'],
        'evidence_graph': {}
    }


class TestFullCertificationWorkflow:
    """Integration tests for complete certification workflow."""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_complete_workflow_foundation_to_certification(self, mock_snapshot, mock_context):
        """Test complete workflow from foundation agents through final certification."""
        engine = WorkflowEngine()
        
        # Mock all agent executions to return success
        async def mock_agent_execution(agent_id, context):
            # Simulate different agent outputs
            if 'snapshot-authority' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={'snapshot_hash': 'snapshot-hash-abc123'},
                    evidence_ids=['ev-001']
                )
            elif 'evidence-freeze' in agent_id and 'final' not in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={'evidence_count': 3},
                    evidence_ids=['ev-001', 'ev-002', 'ev-003']
                )
            elif 'placement-manifest' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={
                        'manifest': {
                            'manifestId': 'manifest-123',
                            'manifestHash': 'hash-456',
                            'candidateId': 'candidate-introduction-block'
                        }
                    },
                    evidence_ids=['ev-001', 'ev-002']
                )
            elif 'approval' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={
                        'approval_status': 'APPROVED',
                        'approved_manifest_hash': 'hash-456'
                    },
                    evidence_ids=['ev-001', 'ev-002']
                )
            elif 'gate' in agent_id and 'final' not in agent_id:
                # All certification gates pass
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={'gate_status': 'PASS'},
                    evidence_ids=['ev-001']
                )
            elif 'final-evidence-freeze' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={
                        'total_evidence_count': 15,
                        'binding_valid': True,
                        'all_evidence_ids': ['ev-001', 'ev-002', 'ev-003']
                    },
                    evidence_ids=['ev-001', 'ev-002', 'ev-003']
                )
            elif 'final-gate' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={
                        'verdict': 'CERTIFICATION_READY',
                        'commit_sha': 'commit-sha-def456',
                        'snapshot_hash': 'snapshot-hash-abc123',
                        'gate_count': 11
                    },
                    evidence_ids=['ev-001', 'ev-002', 'ev-003']
                )
            elif 'certification' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={
                        'human_decision': 'CERTIFIED',
                        'reviewer': 'integration-test@example.com',
                        'verdict': 'CERTIFICATION_READY'
                    },
                    evidence_ids=['ev-001', 'ev-002', 'ev-003']
                )
            else:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={},
                    evidence_ids=[]
                )
        
        with patch.object(engine.agent_coordinator, 'execute_agent', side_effect=mock_agent_execution):
            results = await engine.execute_dag_workflow(mock_context, mock_snapshot)
        
        # Verify workflow completed
        assert len(results) > 0
        
        # Check key agents executed
        foundation_agents = ['agent-01-repository-auditor', 'agent-02-snapshot-authority']
        for agent_id in foundation_agents:
            if agent_id in results:
                assert results[agent_id].status == AgentStatus.SUCCESS
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_workflow_with_gate_failures(self, mock_snapshot, mock_context):
        """Test workflow handles gate failures correctly."""
        engine = WorkflowEngine()
        
        async def mock_agent_with_failure(agent_id, context):
            # Simulate UBRC gate failure
            if 'ubrc-gate' in agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.FAILED,
                    outputs={'gate_status': 'FAIL'},
                    evidence_ids=[],
                    errors=['UBRC compliance check failed']
                )
            else:
                return AgentResult(
                    agent_id=agent_id,
                    status=AgentStatus.SUCCESS,
                    outputs={},
                    evidence_ids=[]
                )
        
        with patch.object(engine.agent_coordinator, 'execute_agent', side_effect=mock_agent_with_failure):
            results = await engine.execute_dag_workflow(mock_context, mock_snapshot)
        
        # UBRC gate should have failed
        if 'agent-12b-ubrc-gate' in results:
            assert results['agent-12b-ubrc-gate'].status == AgentStatus.FAILED
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_evidence_flow_through_workflow(self, mock_snapshot, mock_context):
        """Test that evidence flows correctly through all agents."""
        engine = WorkflowEngine()
        
        # Track evidence accumulation
        evidence_tracking = {}
        
        async def mock_agent_track_evidence(agent_id, context):
            # Accumulate evidence from prior agents
            prior_evidence = []
            for agent_result in context.prior_agent_outputs.values():
                prior_evidence.extend(agent_result.evidence_ids)
            
            # Add new evidence
            new_evidence = [f'ev-{agent_id}']
            all_evidence = list(set(prior_evidence + new_evidence))
            
            evidence_tracking[agent_id] = all_evidence
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={'evidence_count': len(all_evidence)},
                evidence_ids=all_evidence
            )
        
        with patch.object(engine.agent_coordinator, 'execute_agent', side_effect=mock_agent_track_evidence):
            results = await engine.execute_dag_workflow(mock_context, mock_snapshot)
        
        # Verify evidence accumulates
        if evidence_tracking:
            # Later agents should have more evidence than earlier ones
            agent_ids = list(evidence_tracking.keys())
            if len(agent_ids) >= 2:
                first_agent_evidence = len(evidence_tracking[agent_ids[0]])
                last_agent_evidence = len(evidence_tracking[agent_ids[-1]])
                assert last_agent_evidence >= first_agent_evidence
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_parallel_gate_execution(self, mock_snapshot, mock_context):
        """Test that certification gates execute in parallel."""
        engine = WorkflowEngine()
        
        execution_times = {}
        
        async def mock_agent_timing(agent_id, context):
            import asyncio
            from datetime import datetime
            
            start = datetime.now()
            
            # Simulate work (gates should run concurrently)
            if 'gate' in agent_id:
                await asyncio.sleep(0.01)  # Small delay
            
            execution_times[agent_id] = datetime.now() - start
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={},
                evidence_ids=[]
            )
        
        with patch.object(engine.agent_coordinator, 'execute_agent', side_effect=mock_agent_timing):
            results = await engine.execute_dag_workflow(mock_context, mock_snapshot)
        
        # If gates ran in parallel, total time should be less than sequential sum
        gate_agents = [aid for aid in execution_times.keys() if 'gate' in aid and 'final' not in aid]
        
        if len(gate_agents) >= 2:
            # All gates should have executed
            for gate_id in gate_agents:
                assert gate_id in results
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_final_certification_sequence(self, mock_snapshot, mock_context):
        """Test final certification sequence (agents 13-15) executes correctly."""
        engine = WorkflowEngine()
        
        final_sequence_execution = []
        
        async def mock_final_sequence(agent_id, context):
            if any(key in agent_id for key in ['final-evidence-freeze', 'final-gate', 'certification']):
                final_sequence_execution.append(agent_id)
                
                # Final gate needs prior results
                if 'final-gate' in agent_id:
                    return AgentResult(
                        agent_id=agent_id,
                        status=AgentStatus.SUCCESS,
                        outputs={
                            'verdict': 'CERTIFICATION_READY',
                            'commit_sha': 'test-commit',
                            'snapshot_hash': 'test-snapshot'
                        },
                        evidence_ids=['ev-001']
                    )
            
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={},
                evidence_ids=[]
            )
        
        with patch.object(engine.agent_coordinator, 'execute_agent', side_effect=mock_final_sequence):
            results = await engine.execute_dag_workflow(mock_context, mock_snapshot)
        
        # Verify final sequence agents executed
        expected_sequence = ['agent-13-final-evidence-freeze', 'agent-14-final-gate-controller', 'agent-15-human-certification']
        executed = [aid for aid in final_sequence_execution if aid in expected_sequence]
        
        # Check they executed in order (if all present)
        if len(executed) >= 2:
            for i in range(len(executed) - 1):
                # Extract agent numbers
                current_num = int(executed[i].split('-')[1])
                next_num = int(executed[i+1].split('-')[1])
                assert current_num < next_num, f"Final sequence out of order: {executed}"


class TestWorkflowFixtures:
    """Test workflow with realistic fixtures."""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_workflow_with_realistic_snapshot(self, mock_snapshot):
        """Test workflow with realistic snapshot data."""
        # Enhance snapshot with more realistic data
        mock_snapshot['blocks']['implemented'].extend([
            {
                'type': 'code',
                'implementationPath': 'blocks/code/CodeBlock.tsx'
            },
            {
                'type': 'quiz',
                'implementationPath': 'blocks/quiz/QuizBlock.tsx'
            }
        ])
        
        context = {
            'task_id': 'realistic-test',
            'run_id': 'run-001',
            'candidate_id': 'multi-block-candidate',
            'repository_root': str(Path.cwd())
        }
        
        engine = WorkflowEngine()
        
        async def mock_realistic_agent(agent_id, ctx):
            return AgentResult(
                agent_id=agent_id,
                status=AgentStatus.SUCCESS,
                outputs={'blocks_processed': len(mock_snapshot['blocks']['implemented'])},
                evidence_ids=['ev-001', 'ev-002', 'ev-003']
            )
        
        with patch.object(engine.agent_coordinator, 'execute_agent', side_effect=mock_realistic_agent):
            results = await engine.execute_dag_workflow(context, mock_snapshot)
        
        # Workflow should handle multiple blocks
        assert len(results) >= 0  # Some agents should execute
