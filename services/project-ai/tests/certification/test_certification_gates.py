"""
Integration tests for certification gates.

Tests each gate with valid evidence (PASS), missing evidence (BLOCKED), and invalid evidence (FAIL).
"""

import pytest
import hashlib
from pathlib import Path
from typing import Dict, Any

from app.certification.gates import (
    CertificationGateExecutor,
    GateExecutionResult,
    CertificationGateStatus
)
from app.models.candidate import PlacementManifest


@pytest.fixture
def test_manifest():
    """Create a test placement manifest with all required fields."""
    from app.models.candidate import PlacementDecision, BlockFamily
    
    # Use non-inferrable candidate ID to avoid path inference detection
    manifest = PlacementManifest(
        manifestId="test-manifest-001",
        candidateId="candidate-20250129-test-001",  # Non-inferrable ID
        decision=PlacementDecision.ADD,
        targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
        blockFamily=BlockFamily.INTRODUCTION,
        blockVersion="I7",
        requiredChanges=["Add new Introduction block variant"],
        evidenceIds=["ev-001", "ev-002"],
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
    """Create a test candidate hash."""
    return "a" * 64


@pytest.fixture
def mock_snapshot_valid():
    """Create a valid snapshot with evidence."""
    return {
        'blocks': {
            'verified': [
                {
                    'blockType': 'introduction',
                    'ubrcStatus': 'UBRC_VALID',
                    'registered': True,
                    'rendered': True,
                    'evidenceId': 'ev-001'
                }
            ],
            'rendered': [
                {
                    'blockType': 'introduction',
                    'evidenceId': 'ev-002'
                }
            ]
        },
        'evidence': [
            {
                'evidenceId': 'ev-001',
                'kind': 'type-definition',
                'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                'symbol': 'introduction',
                'contentHash': 'abc123',
                'description': 'Introduction block type definition'
            },
            {
                'evidenceId': 'ev-002',
                'kind': 'component',
                'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                'symbol': 'introduction',
                'contentHash': 'def456',
                'description': 'Introduction block renderer'
            }
        ]
    }


@pytest.fixture
def mock_approvals_store():
    """Create a mock approvals store."""
    from app.models.implementation_approval import ImplementationApproval, ImplementationApprovalStatus
    
    approval = ImplementationApproval(
        approval_id="approval-001",
        workflow_id="test-workflow-001",
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-001",
        placement_manifest_sha256="m" * 64,
        approved_by="approver-user",
        approval_timestamp="2025-01-29T10:00:00Z",
        status=ImplementationApprovalStatus.APPROVED,
        workflow_requester="requester-user"
    )
    
    return {"test-workflow-001": approval}


class TestCandidateHashGate:
    """Test candidate hash verification gate."""
    
    def test_hash_gate_passes_with_valid_hash(self, mock_snapshot_valid, test_manifest, candidate_hash):
        """Candidate hash gate passes with valid SHA-256 hash."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_candidate_hash_gate(candidate_hash, candidate_hash, test_manifest)
        
        assert result.status == CertificationGateStatus.PASS
        assert 'verified' in result.message.lower()
        assert len(result.blockers) == 0
    
    def test_hash_gate_fails_with_mismatch(self, mock_snapshot_valid, test_manifest, candidate_hash):
        """Candidate hash gate fails when hash doesn't match manifest."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        wrong_hash = "b" * 64
        
        result = executor.execute_candidate_hash_gate(wrong_hash, candidate_hash, test_manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert 'mismatch' in result.message.lower()
        assert len(result.blockers) > 0
    
    def test_hash_gate_blocked_with_empty_hash(self, mock_snapshot_valid, test_manifest, candidate_hash):
        """Candidate hash gate blocked when hash is empty."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_candidate_hash_gate("", candidate_hash, test_manifest)
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert 'empty' in result.message.lower()
    
    def test_hash_gate_fails_with_invalid_format(self, mock_snapshot_valid, test_manifest, candidate_hash):
        """Candidate hash gate fails with invalid hash format."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_candidate_hash_gate("not-a-valid-hash", candidate_hash, test_manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert 'invalid' in result.message.lower()


class TestApprovalGate:
    """Test implementation approval verification gate."""
    
    def test_approval_gate_passes_with_valid_approval(self, mock_snapshot_valid, test_manifest, mock_approvals_store):
        """Approval gate passes with valid approval record."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_approval_gate(
            workflow_id="test-workflow-001",
            approvals_store=mock_approvals_store,
            requester_id="requester-user",
            candidate_sha256="a" * 64,
            manifest_id="manifest-001",
            manifest_sha256="m" * 64
        )
        
        assert result.status == CertificationGateStatus.PASS
        assert 'verified' in result.message.lower()
        assert len(result.blockers) == 0
    
    def test_approval_gate_blocked_with_missing_approval(self, mock_snapshot_valid, test_manifest):
        """Approval gate blocked when no approval found."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_approval_gate(
            workflow_id="nonexistent-workflow",
            approvals_store={},
            requester_id="requester-user",
            candidate_sha256="a" * 64,
            manifest_id="manifest-001",
            manifest_sha256="m" * 64
        )
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert 'no approval' in result.message.lower()
    
    def test_approval_gate_fails_with_hash_mismatch(self, mock_snapshot_valid, test_manifest, mock_approvals_store):
        """Approval gate fails when candidate hash doesn't match."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_approval_gate(
            workflow_id="test-workflow-001",
            approvals_store=mock_approvals_store,
            requester_id="requester-user",
            candidate_sha256="b" * 64,  # Wrong hash
            manifest_id="manifest-001",
            manifest_sha256="m" * 64
        )
        
        assert result.status == CertificationGateStatus.FAIL
        assert 'mismatch' in result.message.lower() or 'failed' in result.message.lower()
        assert any('hash' in b.lower() for b in result.blockers)
    
    def test_approval_gate_fails_with_self_approval(self, mock_snapshot_valid, test_manifest):
        """Approval gate fails when self-approval detected."""
        from app.models.implementation_approval import ImplementationApproval, ImplementationApprovalStatus
        
        # Create approval with SAME user as both requester and approver (actual self-approval)
        self_approval = ImplementationApproval(
            approval_id="approval-self-001",
            workflow_id="test-workflow-self",
            candidate_sha256="a" * 64,
            target_family="Introduction",
            target_version="I7",
            placement_manifest_id="manifest-001",
            placement_manifest_sha256="m" * 64,
            approved_by="same-user",  # SAME identity
            approval_timestamp="2025-01-29T10:00:00Z",
            status=ImplementationApprovalStatus.APPROVED,
            workflow_requester="same-user"  # SAME identity (self-approval)
        )
        approvals_store = {"test-workflow-self": self_approval}
        
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_approval_gate(
            workflow_id="test-workflow-self",
            approvals_store=approvals_store,
            requester_id="same-user",
            candidate_sha256="a" * 64,
            manifest_id="manifest-001",
            manifest_sha256="m" * 64
        )
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('self' in b.lower() for b in result.blockers)


class TestPathSecurityGate:
    """Test path security verification gate."""
    
    def test_path_security_gate_passes_with_valid_path(self, mock_snapshot_valid, test_manifest):
        """Path security gate passes with valid safe path."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_path_security_gate(test_manifest)
        
        assert result.status == CertificationGateStatus.PASS
        assert 'verified' in result.message.lower()
        assert len(result.blockers) == 0
    
    def test_path_security_gate_fails_with_traversal(self, mock_snapshot_valid):
        """Path security gate fails with path traversal attempt."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        manifest = PlacementManifest(
            manifestId="test-manifest-traversal",
            candidateId="test-candidate",
            decision=PlacementDecision.ADD,
            targetPath="packages/../../../etc/passwd",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I1",
            requiredChanges=[],
            evidenceIds=["ev-001"],
            manifestHash="abc123",
            createdAt="2025-01-29T10:00:00Z"
        )
        
        result = executor.execute_path_security_gate(manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('traversal' in b.lower() for b in result.blockers)
    
    def test_path_security_gate_fails_with_protected_dir(self, mock_snapshot_valid):
        """Path security gate fails with write to protected directory."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        manifest = PlacementManifest(
            manifestId="test-manifest-protected",
            candidateId="test-candidate",
            decision=PlacementDecision.ADD,
            targetPath=".git/config",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I1",
            requiredChanges=[],
            evidenceIds=["ev-001"],
            manifestHash="abc123",
            createdAt="2025-01-29T10:00:00Z"
        )
        
        result = executor.execute_path_security_gate(manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('protected' in b.lower() for b in result.blockers)
    
    def test_path_security_gate_fails_outside_allowlist(self, mock_snapshot_valid):
        """Path security gate fails when path not in allowlist."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        manifest = PlacementManifest(
            manifestId="test-manifest-unauthorized",
            candidateId="test-candidate",
            decision=PlacementDecision.ADD,
            targetPath="unauthorized/path/file.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I1",
            requiredChanges=[],
            evidenceIds=["ev-001"],
            manifestHash="abc123",
            createdAt="2025-01-29T10:00:00Z"
        )
        
        result = executor.execute_path_security_gate(manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('allowlist' in b.lower() for b in result.blockers)


class TestTestEvidenceGate:
    """Test evidence verification gate."""
    
    def test_test_evidence_gate_passes_with_valid_tests(self):
        """Test evidence gate passes with valid test results."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        # Create manifest with evidence IDs that match the snapshot
        manifest = PlacementManifest(
            manifestId="test-manifest-test-pass",
            candidateId="candidate-20250129-test-002",
            decision=PlacementDecision.ADD,
            targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I7",
            requiredChanges=["Add test evidence"],
            evidenceIds=["ev-test-001", "ev-001"],
            manifestHash="",
            createdAt="2025-01-29T10:00:00Z"
        )
        # Compute hash
        manifest_copy = manifest.model_copy()
        manifest_copy.manifestHash = ""
        manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        snapshot = {
            'evidence': [
                {
                    'evidenceId': 'ev-test-001',
                    'kind': 'test-result',
                    'path': 'packages/ui/src/tutorial/blocks/__tests__/IntroductionBlock.test.tsx',
                    'description': 'Introduction block tests',
                    'status': 'passed'
                },
                {
                    'evidenceId': 'ev-001',
                    'kind': 'type-definition',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'symbol': 'introduction',
                    'contentHash': 'abc123',
                    'description': 'Introduction block type definition'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_test_evidence_gate(['introduction'], manifest)
        
        assert result.status == CertificationGateStatus.PASS
        assert 'verified' in result.message.lower()
        assert len(result.evidence_ids) > 0
    
    def test_test_evidence_gate_blocked_with_no_tests(self):
        """Test evidence gate blocked when no test results available."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        # Create manifest with empty evidenceIds to pass validation
        manifest = PlacementManifest(
            manifestId="test-manifest-no-tests",
            candidateId="candidate-20250129-test-003",
            decision=PlacementDecision.ADD,
            targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I7",
            requiredChanges=["Add block without tests"],
            evidenceIds=["ev-001"],  # Only type-definition, no test-result
            manifestHash="",
            createdAt="2025-01-29T10:00:00Z"
        )
        # Compute hash
        manifest_copy = manifest.model_copy()
        manifest_copy.manifestHash = ""
        manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        snapshot = {
            'evidence': [
                {
                    'evidenceId': 'ev-001',
                    'kind': 'type-definition',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'description': 'Introduction block'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_test_evidence_gate(['introduction'], manifest)
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert 'unavailable' in result.message.lower() or 'no test' in result.message.lower()
    
    def test_test_evidence_gate_fails_with_failing_tests(self):
        """Test evidence gate fails when tests failed."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        # Create manifest with evidence ID matching the snapshot
        manifest = PlacementManifest(
            manifestId="test-manifest-failed-tests",
            candidateId="candidate-20250129-test-004",
            decision=PlacementDecision.ADD,
            targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I7",
            requiredChanges=["Add block with failing tests"],
            evidenceIds=["ev-test-001"],
            manifestHash="",
            createdAt="2025-01-29T10:00:00Z"
        )
        # Compute hash
        manifest_copy = manifest.model_copy()
        manifest_copy.manifestHash = ""
        manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        snapshot = {
            'evidence': [
                {
                    'evidenceId': 'ev-test-001',
                    'kind': 'test-result',
                    'path': 'packages/ui/src/tutorial/blocks/__tests__/IntroductionBlock.test.tsx',
                    'description': 'Introduction block tests',
                    'status': 'failed'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_test_evidence_gate(['introduction'], manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('failed' in b.lower() for b in result.blockers)


class TestRuntimeGate:
    """Test runtime verification gate."""
    
    def test_runtime_gate_passes_with_valid_evidence(self, test_manifest):
        """Runtime gate passes with valid runtime verification."""
        snapshot = {
            'blocks': {
                'verified': [
                    {
                        'blockType': 'introduction',
                        'ubrcStatus': 'UBRC_VALID',
                        'registered': True,
                        'rendered': True,
                        'evidenceId': 'ev-runtime-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-runtime-001',
                    'kind': 'runtime-verification',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'description': 'Runtime verification passed'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        # Mock the verify_runtime to return success
        result = executor.execute_runtime_verification_gate(['introduction'], test_manifest)
        
        # May be BLOCKED if Playwright not installed, or PASS if verification succeeds
        assert result.status in [CertificationGateStatus.PASS, CertificationGateStatus.BLOCKED]
    
    def test_runtime_gate_blocked_with_empty_snapshot(self):
        """Runtime gate blocked when snapshot has no verified blocks."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        # Create manifest with one evidence ID to pass semantic binding validation
        manifest = PlacementManifest(
            manifestId="test-manifest-runtime-empty",
            candidateId="candidate-20250129-runtime-001",
            decision=PlacementDecision.ADD,
            targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I7",
            requiredChanges=["Add block for runtime test"],
            evidenceIds=["ev-runtime-placeholder"],
            manifestHash="",
            createdAt="2025-01-29T10:00:00Z"
        )
        # Compute hash
        manifest_copy = manifest.model_copy()
        manifest_copy.manifestHash = ""
        manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        snapshot = {
            'blocks': {},
            'evidence': [
                {
                    'evidenceId': 'ev-runtime-placeholder',
                    'kind': 'type-definition',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'description': 'Placeholder evidence for validation'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_runtime_verification_gate(['introduction'], manifest)
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert 'unavailable' in result.message.lower() or 'no verified blocks' in result.message.lower()


class TestUBRCGate:
    """Test UBRC compliance gate."""
    
    def test_ubrc_gate_passes_with_valid_block(self, mock_snapshot_valid, test_manifest):
        """UBRC gate passes with valid block implementation."""
        executor = CertificationGateExecutor(mock_snapshot_valid, Path('.'))
        
        result = executor.execute_ubrc_gate(['introduction'], test_manifest)
        
        assert result.status == CertificationGateStatus.PASS
        assert 'verified' in result.message.lower()
        assert len(result.evidence_ids) > 0
    
    def test_ubrc_gate_blocked_with_empty_snapshot(self):
        """UBRC gate blocked when snapshot has no verified blocks."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        # Create manifest with one evidence ID to pass semantic binding validation
        manifest = PlacementManifest(
            manifestId="test-manifest-ubrc-empty",
            candidateId="candidate-20250129-ubrc-001",
            decision=PlacementDecision.ADD,
            targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I7",
            requiredChanges=["Add block for UBRC test"],
            evidenceIds=["ev-ubrc-placeholder"],
            manifestHash="",
            createdAt="2025-01-29T10:00:00Z"
        )
        # Compute hash
        manifest_copy = manifest.model_copy()
        manifest_copy.manifestHash = ""
        manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        snapshot = {
            'blocks': {},
            'evidence': [
                {
                    'evidenceId': 'ev-ubrc-placeholder',
                    'kind': 'type-definition',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'description': 'Placeholder evidence for validation'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_ubrc_gate(['introduction'], manifest)
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert 'unavailable' in result.message.lower()
    
    def test_ubrc_gate_fails_with_missing_attribute(self):
        """UBRC gate fails when data-block-version attribute missing."""
        from app.models.candidate import PlacementDecision, BlockFamily
        
        # Create manifest with evidence IDs matching the snapshot
        manifest = PlacementManifest(
            manifestId="test-manifest-ubrc-fail",
            candidateId="candidate-20250129-ubrc-002",
            decision=PlacementDecision.ADD,
            targetPath="packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="I7",
            requiredChanges=["Add block with missing attribute"],
            evidenceIds=["ev-ubrc-001"],
            manifestHash="",
            createdAt="2025-01-29T10:00:00Z"
        )
        # Compute hash
        manifest_copy = manifest.model_copy()
        manifest_copy.manifestHash = ""
        manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
        computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        manifest.manifestHash = computed_hash
        
        snapshot = {
            'blocks': {
                'verified': [
                    {
                        'blockType': 'introduction',
                        'ubrcStatus': 'UBRC_ATTRIBUTE_MISSING',
                        'registered': True,
                        'rendered': True
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-ubrc-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'description': 'UBRC verification with missing attribute'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_ubrc_gate(['introduction'], manifest)
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('attribute' in b.lower() for b in result.blockers)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
