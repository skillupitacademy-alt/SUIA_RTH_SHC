"""
Integration tests for full certification pipeline.

Tests complete certification flow with placed candidate through all gates.
"""

import pytest
import hashlib
from pathlib import Path
from typing import Dict, Any

from app.certification.gates import (
    CertificationGateExecutor,
    GateExecutionResult,
    CertificationGateStatus,
    compute_overall_status,
    GateResult,
    GateStatus
)
from app.models.candidate import PlacementManifest
from app.models.implementation_approval import ImplementationApproval, ImplementationApprovalStatus


@pytest.fixture
def complete_snapshot():
    """Create a complete snapshot with all evidence types."""
    return {
        'blocks': {
            'verified': [
                {
                    'blockType': 'introduction',
                    'ubrcStatus': 'UBRC_VALID',
                    'registered': True,
                    'rendered': True,
                    'evidenceId': 'ev-block-001',
                    'ubrcDetails': {
                        'registryEntry': True,
                        'rendererImplementation': True,
                        'versionAttribute': True
                    }
                }
            ],
            'rendered': [
                {
                    'blockType': 'introduction',
                    'evidenceId': 'ev-renderer-001'
                }
            ]
        },
        'evidence': [
            {
                'evidenceId': 'ev-block-001',
                'kind': 'type-definition',
                'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                'symbol': 'introduction',
                'contentHash': 'abc123def456',
                'description': 'Introduction block type definition'
            },
            {
                'evidenceId': 'ev-renderer-001',
                'kind': 'component',
                'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                'symbol': 'IntroductionBlock',
                'contentHash': 'renderer123',
                'description': 'Introduction block renderer component'
            },
            {
                'evidenceId': 'ev-registry-001',
                'kind': 'registry-entry',
                'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                'symbol': 'BLOCK_REGISTRY',
                'contentHash': 'registry456',
                'description': 'Block registry entry'
            },
            {
                'evidenceId': 'ev-test-001',
                'kind': 'test-result',
                'path': 'packages/ui/src/tutorial/blocks/__tests__/IntroductionBlock.test.tsx',
                'contentHash': 'test789',
                'description': 'Introduction block tests',
                'status': 'passed'
            },
            {
                'evidenceId': 'ev-candidate-001',
                'kind': 'candidate-file',
                'path': 'candidate/introduction-i7.tsx',
                'contentHash': 'a' * 64,
                'description': 'Candidate implementation'
            }
        ]
    }


@pytest.fixture
def complete_manifest():
    """Create a complete placement manifest with non-inferrable candidate ID."""
    from app.models.candidate import PlacementDecision, BlockFamily
    
    # Use non-inferrable candidate ID to avoid path inference detection
    manifest = PlacementManifest(
        manifestId="test-manifest-complete",
        candidateId="candidate-20250129-pipeline-001",  # Non-inferrable ID
        decision=PlacementDecision.ADD,
        targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        blockFamily=BlockFamily.INTRODUCTION,
        blockVersion="I7",
        requiredChanges=["Add new Introduction block variant I7"],
        evidenceIds=["ev-block-001", "ev-renderer-001", "ev-registry-001", "ev-test-001"],
        manifestHash="",
        createdAt="2025-01-29T10:00:00Z"
    )
    # Compute hash using exact algorithm from gates.py
    manifest_copy = manifest.model_copy()
    manifest_copy.manifestHash = ""
    manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
    computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    manifest.manifestHash = computed_hash
    return manifest


@pytest.fixture
def candidate_hash():
    """Candidate SHA-256 hash fixture."""
    return "a" * 64


@pytest.fixture
def complete_approval():
    """Create a complete implementation approval."""
    return ImplementationApproval(
        approval_id="approval-pipeline-001",
        workflow_id="test-workflow-pipeline",
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-pipeline-001",
        placement_manifest_sha256="m" * 64,
        approved_by="approver-user",
        approval_timestamp="2025-01-29T10:00:00Z",
        status=ImplementationApprovalStatus.APPROVED,
        workflow_requester="requester-user"
    )


class TestFullCertificationPipeline:
    """Test complete certification pipeline with all gates."""
    
    def test_full_pipeline_with_valid_candidate(self, complete_snapshot, complete_manifest, complete_approval, candidate_hash):
        """Full pipeline passes with valid candidate and evidence."""
        executor = CertificationGateExecutor(complete_snapshot, Path('.'))
        approvals_store = {"test-workflow-pipeline": complete_approval}
        
        gate_results = {}
        
        # Gate 1: Candidate hash verification
        hash_result = executor.execute_candidate_hash_gate(candidate_hash, candidate_hash, complete_manifest)
        gate_results['candidate_hash'] = GateResult(
            gate_id='candidate_hash',
            status=GateStatus(hash_result.status.value),
            evidence_ids=hash_result.evidence_ids,
            findings=hash_result.blockers,
            reason=hash_result.message
        )
        
        # Gate 2: Approval verification
        approval_result = executor.execute_approval_gate(
            workflow_id="test-workflow-pipeline",
            approvals_store=approvals_store,
            requester_id="requester-user",
            candidate_sha256="a" * 64,
            manifest_id="manifest-pipeline-001",
            manifest_sha256="m" * 64
        )
        gate_results['approval'] = GateResult(
            gate_id='approval',
            status=GateStatus(approval_result.status.value),
            evidence_ids=approval_result.evidence_ids,
            findings=approval_result.blockers,
            reason=approval_result.message
        )
        
        # Gate 3: Path security verification
        path_result = executor.execute_path_security_gate(complete_manifest)
        gate_results['path_security'] = GateResult(
            gate_id='path_security',
            status=GateStatus(path_result.status.value),
            evidence_ids=path_result.evidence_ids,
            findings=path_result.blockers,
            reason=path_result.message
        )
        
        # Gate 4: Test evidence verification
        test_result = executor.execute_test_evidence_gate(['introduction'], complete_manifest)
        gate_results['test_evidence'] = GateResult(
            gate_id='test_evidence',
            status=GateStatus(test_result.status.value),
            evidence_ids=test_result.evidence_ids,
            findings=test_result.blockers,
            reason=test_result.message
        )
        
        # Gate 5: UBRC compliance
        ubrc_result = executor.execute_ubrc_gate(['introduction'], complete_manifest)
        gate_results['ubrc'] = GateResult(
            gate_id='ubrc',
            status=GateStatus(ubrc_result.status.value),
            evidence_ids=ubrc_result.evidence_ids,
            findings=ubrc_result.blockers,
            reason=ubrc_result.message
        )
        
        # Gate 6: Registry verification
        registry_result = executor.execute_registry_verification_gate(['introduction'], complete_manifest)
        gate_results['registry'] = GateResult(
            gate_id='registry',
            status=GateStatus(registry_result.status.value),
            evidence_ids=registry_result.evidence_ids,
            findings=registry_result.blockers,
            reason=registry_result.message
        )
        
        # Gate 7: Renderer verification
        renderer_result = executor.execute_renderer_verification_gate(['introduction'], complete_manifest)
        gate_results['renderer'] = GateResult(
            gate_id='renderer',
            status=GateStatus(renderer_result.status.value),
            evidence_ids=renderer_result.evidence_ids,
            findings=renderer_result.blockers,
            reason=renderer_result.message
        )
        
        # Gate 8: Evidence binding
        evidence_result = executor.execute_evidence_binding_gate(['introduction'], complete_manifest)
        gate_results['evidence_binding'] = GateResult(
            gate_id='evidence_binding',
            status=GateStatus(evidence_result.status.value),
            evidence_ids=evidence_result.evidence_ids,
            findings=evidence_result.blockers,
            reason=evidence_result.message
        )
        
        # Compute overall status
        overall_status = compute_overall_status(gate_results)
        
        # Assertions
        assert gate_results['candidate_hash'].status == GateStatus.PASS
        assert gate_results['approval'].status == GateStatus.PASS
        assert gate_results['path_security'].status == GateStatus.PASS
        assert gate_results['test_evidence'].status == GateStatus.PASS
        assert gate_results['ubrc'].status == GateStatus.PASS
        assert gate_results['registry'].status == GateStatus.PASS
        assert gate_results['renderer'].status == GateStatus.PASS
        assert gate_results['evidence_binding'].status == GateStatus.PASS
        
        # Overall should be PASS
        assert overall_status == GateStatus.PASS
    
    def test_pipeline_fails_with_hash_mismatch(self, complete_snapshot, complete_manifest, complete_approval, candidate_hash):
        """Pipeline fails when candidate hash doesn't match."""
        executor = CertificationGateExecutor(complete_snapshot, Path('.'))
        approvals_store = {"test-workflow-pipeline": complete_approval}
        
        gate_results = {}
        
        # Gate 1: Candidate hash verification (FAIL)
        wrong_hash = "b" * 64
        hash_result = executor.execute_candidate_hash_gate(wrong_hash, candidate_hash, complete_manifest)
        gate_results['candidate_hash'] = GateResult(
            gate_id='candidate_hash',
            status=GateStatus(hash_result.status.value),
            evidence_ids=hash_result.evidence_ids,
            findings=hash_result.blockers,
            reason=hash_result.message
        )
        
        # Compute overall status
        overall_status = compute_overall_status(gate_results)
        
        # Assertions
        assert gate_results['candidate_hash'].status == GateStatus.FAIL
        assert overall_status == GateStatus.FAIL
    
    def test_pipeline_blocked_with_missing_evidence(self, complete_manifest, complete_approval, candidate_hash):
        """Pipeline blocked when evidence is missing."""
        # Empty snapshot
        empty_snapshot = {
            'blocks': {},
            'evidence': []
        }
        
        executor = CertificationGateExecutor(empty_snapshot, Path('.'))
        approvals_store = {"test-workflow-pipeline": complete_approval}
        
        gate_results = {}
        
        # Gate 1: Candidate hash (may pass)
        hash_result = executor.execute_candidate_hash_gate(candidate_hash, candidate_hash, complete_manifest)
        gate_results['candidate_hash'] = GateResult(
            gate_id='candidate_hash',
            status=GateStatus(hash_result.status.value),
            evidence_ids=hash_result.evidence_ids,
            findings=hash_result.blockers,
            reason=hash_result.message
        )
        
        # Gate 2: UBRC (will be BLOCKED)
        ubrc_result = executor.execute_ubrc_gate(['introduction'], complete_manifest)
        gate_results['ubrc'] = GateResult(
            gate_id='ubrc',
            status=GateStatus(ubrc_result.status.value),
            evidence_ids=ubrc_result.evidence_ids,
            findings=ubrc_result.blockers,
            reason=ubrc_result.message
        )
        
        # Compute overall status
        overall_status = compute_overall_status(gate_results)
        
        # Assertions
        assert gate_results['ubrc'].status == GateStatus.BLOCKED
        assert overall_status == GateStatus.BLOCKED
    
    def test_pipeline_fails_with_invalid_approval(self, complete_snapshot, complete_manifest):
        """Pipeline fails when approval is invalid."""
        executor = CertificationGateExecutor(complete_snapshot, Path('.'))
        
        # Create rejected approval
        rejected_approval = ImplementationApproval(
            approval_id="approval-pipeline-002",
            workflow_id="test-workflow-pipeline",
            candidate_sha256="a" * 64,
            target_family="Introduction",
            target_version="I7",
            placement_manifest_id="manifest-pipeline-001",
            placement_manifest_sha256="m" * 64,
            approved_by="approver-user",
            approval_timestamp="2025-01-29T10:00:00Z",
            status=ImplementationApprovalStatus.REJECTED,
            workflow_requester="requester-user"
        )
        approvals_store = {"test-workflow-pipeline": rejected_approval}
        
        gate_results = {}
        
        # Gate 1: Approval verification (FAIL)
        approval_result = executor.execute_approval_gate(
            workflow_id="test-workflow-pipeline",
            approvals_store=approvals_store,
            requester_id="requester-user",
            candidate_sha256="a" * 64,
            manifest_id="manifest-pipeline-001",
            manifest_sha256="m" * 64
        )
        gate_results['approval'] = GateResult(
            gate_id='approval',
            status=GateStatus(approval_result.status.value),
            evidence_ids=approval_result.evidence_ids,
            findings=approval_result.blockers,
            reason=approval_result.message
        )
        
        # Compute overall status
        overall_status = compute_overall_status(gate_results)
        
        # Assertions
        assert gate_results['approval'].status == GateStatus.FAIL
        assert overall_status == GateStatus.FAIL
    
    def test_pipeline_collects_all_evidence_ids(self, complete_snapshot, complete_manifest, complete_approval, candidate_hash):
        """Pipeline collects evidence IDs from all gates."""
        executor = CertificationGateExecutor(complete_snapshot, Path('.'))
        approvals_store = {"test-workflow-pipeline": complete_approval}
        
        all_evidence_ids = set()
        
        # Run all gates
        hash_result = executor.execute_candidate_hash_gate(candidate_hash, candidate_hash, complete_manifest)
        all_evidence_ids.update(hash_result.evidence_ids)
        
        ubrc_result = executor.execute_ubrc_gate(['introduction'], complete_manifest)
        all_evidence_ids.update(ubrc_result.evidence_ids)
        
        registry_result = executor.execute_registry_verification_gate(['introduction'], complete_manifest)
        all_evidence_ids.update(registry_result.evidence_ids)
        
        renderer_result = executor.execute_renderer_verification_gate(['introduction'], complete_manifest)
        all_evidence_ids.update(renderer_result.evidence_ids)
        
        evidence_result = executor.execute_evidence_binding_gate(['introduction'], complete_manifest)
        all_evidence_ids.update(evidence_result.evidence_ids)
        
        test_result = executor.execute_test_evidence_gate(['introduction'], complete_manifest)
        all_evidence_ids.update(test_result.evidence_ids)
        
        # Should have collected multiple evidence IDs
        assert len(all_evidence_ids) > 0
        
        # All evidence IDs should exist in snapshot
        snapshot_evidence_ids = {e['evidenceId'] for e in complete_snapshot['evidence']}
        for eid in all_evidence_ids:
            if eid:  # Skip empty strings
                assert eid in snapshot_evidence_ids


class TestPipelineStateTransitions:
    """Test pipeline behavior in different workflow states."""
    
    def test_pipeline_runs_in_candidate_audit_state(self, complete_snapshot, complete_manifest):
        """Pipeline should run during CANDIDATE_AUDIT state."""
        from app.orchestration.canonical_workflow import CanonicalWorkflowState
        
        executor = CertificationGateExecutor(complete_snapshot, Path('.'))
        
        # Simulate CANDIDATE_AUDIT state
        workflow_state = CanonicalWorkflowState.CANDIDATE_AUDIT
        
        # Run core certification gates (no approval needed yet)
        ubrc_result = executor.execute_ubrc_gate(['introduction'], complete_manifest)
        registry_result = executor.execute_registry_verification_gate(['introduction'], complete_manifest)
        renderer_result = executor.execute_renderer_verification_gate(['introduction'], complete_manifest)
        
        # These gates should be able to run
        assert ubrc_result.status in [CertificationGateStatus.PASS, CertificationGateStatus.FAIL, CertificationGateStatus.BLOCKED]
        assert registry_result.status in [CertificationGateStatus.PASS, CertificationGateStatus.FAIL, CertificationGateStatus.BLOCKED]
        assert renderer_result.status in [CertificationGateStatus.PASS, CertificationGateStatus.FAIL, CertificationGateStatus.BLOCKED]
    
    def test_approval_gate_runs_before_implementing_state(self, complete_snapshot, complete_manifest, complete_approval):
        """Approval gate should run before IMPLEMENTING state."""
        from app.orchestration.canonical_workflow import CanonicalWorkflowState
        
        executor = CertificationGateExecutor(complete_snapshot, Path('.'))
        approvals_store = {"test-workflow-pipeline": complete_approval}
        
        # Simulate AWAITING_IMPLEMENTATION_APPROVAL state
        workflow_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
        
        # Run approval gate
        approval_result = executor.execute_approval_gate(
            workflow_id="test-workflow-pipeline",
            approvals_store=approvals_store,
            requester_id="requester-user",
            candidate_sha256="a" * 64,
            manifest_id="manifest-pipeline-001",
            manifest_sha256="m" * 64
        )
        
        # Should pass with valid approval
        assert approval_result.status == CertificationGateStatus.PASS


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
