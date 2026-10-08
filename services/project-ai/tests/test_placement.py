"""Tests for Wave 2: Candidate placement intelligence."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.models.candidate import (
    BlockFamily,
    CandidateFile,
    PlacementDecision,
    PlacementManifest,
)
from app.models.governance import ApprovalStatus
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
)
from app.placement.comparator import CanonicalComparator, StructuralFeatures
from app.placement.executor import PlacementExecutor, PlacementExecutionError


@pytest.fixture
def mock_snapshot_with_blocks():
    """Mock snapshot with verified blocks for comparison testing."""
    return {
        "metadata": {"scannedAt": "2025-01-29T00:00:00Z"},
        "applications": [],
        "packages": [],
        "services": [],
        "evidence": [
            {
                "evidenceId": "ev-intro-block-001",
                "kind": "type-definition",
                "path": "packages/blocks/introduction/I1/index.tsx",
                "contentHash": "abc123",
                "description": "Introduction block I1"
            },
            {
                "evidenceId": "ev-tutorial-block-001",
                "kind": "component",
                "path": "packages/blocks/tutorial/T1/TutorialBlock.tsx",
                "contentHash": "def456",
                "description": "Tutorial block T1"
            }
        ],
        "blocks": {
            "discovered": [],
            "implemented": [],
            "rendered": [],
            "registered": [],
            "tested": [],
            "verified": [
                {
                    "blockType": "I1-introduction",
                    "blockId": "I1",
                    "implementationPath": "packages/blocks/introduction/I1",
                    "evidenceId": "ev-intro-block-001",
                    "ubrcDetails": {
                        "ubrcStatus": "UBRC_VALID",
                        "registryEntry": True
                    },
                    "registered": True,
                    "rendered": True
                },
                {
                    "blockType": "T1-tutorial",
                    "blockId": "T1",
                    "implementationPath": "packages/blocks/tutorial/T1",
                    "evidenceId": "ev-tutorial-block-001",
                    "ubrcDetails": {
                        "ubrcStatus": "UBRC_VALID",
                        "registryEntry": True
                    },
                    "registered": True,
                    "rendered": True
                }
            ]
        },
        "findings": []
    }


@pytest.fixture
def sample_candidate_files():
    """Sample candidate files for testing."""
    return [
        CandidateFile(
            filename="IntroductionBlock.tsx",
            content="""
            import React from 'react';
            
            export function IntroductionBlock() {
                return (
                    <div className="intro-container" data-block-type="introduction" data-block-version="1.0.0">
                        <h1>Welcome</h1>
                        <p>Introduction content</p>
                    </div>
                );
            }
            """,
            contentType="text/typescript",
            hash="hash123"
        ),
        CandidateFile(
            filename="IntroductionBlock.module.css",
            content="""
            .intro-container {
                padding: var(--spacing-4);
                color: var(--color-text-primary);
            }
            """,
            contentType="text/css",
            hash="hash456"
        )
    ]


class TestStructuralFeatureExtraction:
    """Tests for structural feature extraction from candidate files."""
    
    def test_extract_data_attributes(self, sample_candidate_files):
        """Test extraction of data attributes from HTML."""
        comparator = CanonicalComparator({})
        features = comparator.extract_features(sample_candidate_files)
        
        assert "data-block-type" in features.data_attributes
        assert "data-block-version" in features.data_attributes
    
    def test_extract_css_classes(self, sample_candidate_files):
        """Test extraction of CSS class names."""
        comparator = CanonicalComparator({})
        features = comparator.extract_features(sample_candidate_files)
        
        assert "intro-container" in features.css_classes
    
    def test_detect_typescript_files(self, sample_candidate_files):
        """Test detection of TypeScript files."""
        comparator = CanonicalComparator({})
        features = comparator.extract_features(sample_candidate_files)
        
        assert features.has_typescript is True
        assert features.has_styles is True
    
    def test_detect_quiz_logic(self):
        """Test detection of quiz/assessment logic."""
        files = [
            CandidateFile(
                filename="QuizBlock.tsx",
                content="<div data-question-id='q1'>What is the answer?</div>",
                contentType="text/typescript",
                hash="hash1"
            )
        ]
        
        comparator = CanonicalComparator({})
        features = comparator.extract_features(files)
        
        assert features.has_quiz_logic is True
    
    def test_detect_media_embed(self):
        """Test detection of media embeds."""
        files = [
            CandidateFile(
                filename="MediaBlock.tsx",
                content="<video src='video.mp4' />",
                contentType="text/typescript",
                hash="hash1"
            )
        ]
        
        comparator = CanonicalComparator({})
        features = comparator.extract_features(files)
        
        assert features.has_media_embed is True
    
    def test_detect_step_navigation(self):
        """Test detection of step navigation patterns."""
        files = [
            CandidateFile(
                filename="TutorialBlock.tsx",
                content="<button onClick={handleNext}>Next Step</button>",
                contentType="text/typescript",
                hash="hash1"
            )
        ]
        
        comparator = CanonicalComparator({})
        features = comparator.extract_features(files)
        
        assert features.has_step_navigation is True


class TestCanonicalComparison:
    """Tests for evidence-backed canonical comparison."""
    
    def test_compare_returns_real_evidence_ids(
        self,
        mock_snapshot_with_blocks,
        sample_candidate_files
    ):
        """Test that comparison returns real evidence IDs, not synthetic ones."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        features = comparator.extract_features(sample_candidate_files)
        
        best_match, score, differences, evidence_ids = comparator.compare_to_canonical(
            features,
            BlockFamily.INTRODUCTION,
            sample_candidate_files
        )
        
        # Must return real evidence IDs from snapshot
        assert len(evidence_ids) > 0
        assert "ev-intro-block-001" in evidence_ids
        
        # Must NOT contain synthetic IDs
        assert not any("candidate-" in eid for eid in evidence_ids)
    
    def test_compare_uses_snapshot_not_hardcoded(
        self,
        mock_snapshot_with_blocks,
        sample_candidate_files
    ):
        """Test that comparison uses real snapshot data, not hardcoded values."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        features = comparator.extract_features(sample_candidate_files)
        
        best_match, score, differences, evidence_ids = comparator.compare_to_canonical(
            features,
            BlockFamily.INTRODUCTION,
            sample_candidate_files
        )
        
        # Score should NOT be hardcoded 0.6
        assert score != 0.6
        
        # Best match should be from snapshot
        assert best_match in ["I1", "I1-introduction"]
    
    def test_compare_blocks_when_no_verified_blocks(self, sample_candidate_files):
        """Test comparison returns BLOCKED when no verified blocks exist."""
        empty_snapshot = {
            "blocks": {"verified": []},
            "evidence": []
        }
        
        comparator = CanonicalComparator(empty_snapshot)
        features = comparator.extract_features(sample_candidate_files)
        
        best_match, score, differences, evidence_ids = comparator.compare_to_canonical(
            features,
            BlockFamily.INTRODUCTION,
            sample_candidate_files
        )
        
        assert best_match is None
        assert score == 0.0
        assert len(differences) > 0
    
    def test_high_similarity_for_matching_features(
        self,
        mock_snapshot_with_blocks,
        sample_candidate_files
    ):
        """Test that matching structural features produce high similarity."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        features = comparator.extract_features(sample_candidate_files)
        
        best_match, score, differences, evidence_ids = comparator.compare_to_canonical(
            features,
            BlockFamily.INTRODUCTION,
            sample_candidate_files
        )
        
        # Should have reasonable similarity with UBRC-compliant attributes
        assert score > 0.4


class TestPlacementDecisionLogic:
    """Tests for placement decision determination."""
    
    def test_high_similarity_triggers_update(self, mock_snapshot_with_blocks):
        """Test that high similarity (>0.85) triggers UPDATE."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        decision = comparator.determine_placement_action(
            similarity_score=0.9,
            best_match="I1",
            family=BlockFamily.INTRODUCTION
        )
        
        assert decision == PlacementDecision.UPDATE
    
    def test_moderate_similarity_triggers_extend(self, mock_snapshot_with_blocks):
        """Test that moderate similarity (0.6-0.85) triggers EXTEND."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        decision = comparator.determine_placement_action(
            similarity_score=0.7,
            best_match="I1",
            family=BlockFamily.INTRODUCTION
        )
        
        assert decision == PlacementDecision.EXTEND
    
    def test_low_similarity_triggers_add(self, mock_snapshot_with_blocks):
        """Test that low similarity (0.4-0.6) triggers ADD."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        decision = comparator.determine_placement_action(
            similarity_score=0.5,
            best_match="I1",
            family=BlockFamily.INTRODUCTION
        )
        
        assert decision == PlacementDecision.ADD
    
    def test_very_low_similarity_triggers_reject(self, mock_snapshot_with_blocks):
        """Test that very low similarity (<0.4) triggers REJECT."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        decision = comparator.determine_placement_action(
            similarity_score=0.2,
            best_match="I1",
            family=BlockFamily.INTRODUCTION
        )
        
        assert decision == PlacementDecision.REJECT
    
    def test_no_match_triggers_add(self, mock_snapshot_with_blocks):
        """Test that no match triggers ADD."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        decision = comparator.determine_placement_action(
            similarity_score=0.5,
            best_match=None,
            family=BlockFamily.CUSTOM
        )
        
        assert decision == PlacementDecision.ADD


class TestTargetPathDetermination:
    """Tests for target path determination from evidence."""
    
    def test_update_uses_existing_path_from_snapshot(self, mock_snapshot_with_blocks):
        """Test UPDATE decision uses existing block path from snapshot."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        target_path = comparator.determine_target_path(
            decision=PlacementDecision.UPDATE,
            family=BlockFamily.INTRODUCTION,
            candidate_id="candidate-123",
            best_match="I1"
        )
        
        assert "packages/blocks/introduction/I1" in target_path
    
    def test_add_creates_new_path(self, mock_snapshot_with_blocks):
        """Test ADD decision creates new path."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        target_path = comparator.determine_target_path(
            decision=PlacementDecision.ADD,
            family=BlockFamily.TUTORIAL,
            candidate_id="candidate-456",
            best_match=None
        )
        
        assert "tutorial" in target_path
        assert "candidate-456" in target_path
    
    def test_extend_creates_variant_path(self, mock_snapshot_with_blocks):
        """Test EXTEND decision creates variant path."""
        comparator = CanonicalComparator(mock_snapshot_with_blocks)
        
        target_path = comparator.determine_target_path(
            decision=PlacementDecision.EXTEND,
            family=BlockFamily.INTRODUCTION,
            candidate_id="candidate-789",
            best_match="I1"
        )
        
        assert "introduction" in target_path
        assert "candidate-789" in target_path


class TestPlacementExecutor:
    """Tests for safe placement execution."""
    
    @pytest.fixture
    def temp_repository(self, tmp_path):
        """Create temporary repository for testing."""
        repo_root = tmp_path / "test-repo"
        repo_root.mkdir()
        
        # Initialize git
        import subprocess
        subprocess.run(['git', 'init'], cwd=repo_root, check=True, capture_output=True)
        subprocess.run(
            ['git', 'config', 'user.email', 'test@example.com'],
            cwd=repo_root,
            check=True,
            capture_output=True
        )
        subprocess.run(
            ['git', 'config', 'user.name', 'Test User'],
            cwd=repo_root,
            check=True,
            capture_output=True
        )
        
        return repo_root
    
    @pytest.fixture
    def sample_manifest(self, sample_candidate_files):
        """Create sample placement manifest."""
        manifest_data = {
            "manifestId": "manifest-123",
            "candidateId": "candidate-123",
            "decision": "ADD",
            "targetPath": "packages/blocks/introduction/candidate-123",
            "blockFamily": "Introduction",
            "blockVersion": "1.0.0",
            "requiredChanges": ["Create new block"],
            "evidenceIds": ["ev-intro-block-001"],
            "createdAt": "2025-01-29T00:00:00Z"
        }
        
        manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
        manifest_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        
        return PlacementManifest(
            manifestId="manifest-123",
            candidateId="candidate-123",
            decision=PlacementDecision.ADD,
            targetPath="packages/blocks/introduction/candidate-123",
            blockFamily=BlockFamily.INTRODUCTION,
            blockVersion="1.0.0",
            requiredChanges=["Create new block"],
            evidenceIds=["ev-intro-block-001"],
            manifestHash=manifest_hash,
            createdAt="2025-01-29T00:00:00Z"
        )
    
    def test_executor_rejects_unapproved_manifest(
        self,
        temp_repository,
        sample_manifest,
        sample_candidate_files
    ):
        """Test that executor rejects unapproved manifests."""
        executor = PlacementExecutor(temp_repository)
        
        # Create PENDING approval (should be rejected)
        pending_approval = ImplementationApproval(
            approval_id="approval-pending-test",
            workflow_id="wf-test-123",
            candidate_sha256="test-candidate-hash-123",
            target_family="Introduction",
            target_version="1.0.0",
            placement_manifest_id=sample_manifest.manifestId,
            placement_manifest_sha256=sample_manifest.manifestHash,
            approved_by="test-approver@example.com",
            approval_timestamp=datetime.now(timezone.utc).isoformat(),
            status=ImplementationApprovalStatus.PENDING,
            workflow_requester="test-requester@example.com"
        )
        
        with pytest.raises(PlacementExecutionError) as exc_info:
            executor.execute_placement(
                manifest=sample_manifest,
                approval=pending_approval,
                candidate_files=sample_candidate_files,
                workflow_requester="test-requester@example.com",
                candidate_sha256="test-candidate-hash-123"
            )
        
        assert "unapproved" in str(exc_info.value).lower()
    
    def test_executor_verifies_manifest_hash(
        self,
        temp_repository,
        sample_manifest,
        sample_candidate_files
    ):
        """Test that executor verifies manifest hash."""
        executor = PlacementExecutor(temp_repository)
        
        # Tamper with manifest (change decision but keep hash)
        tampered_manifest = PlacementManifest(
            manifestId=sample_manifest.manifestId,
            candidateId=sample_manifest.candidateId,
            decision=PlacementDecision.REJECT,  # Changed!
            targetPath=sample_manifest.targetPath,
            blockFamily=sample_manifest.blockFamily,
            blockVersion=sample_manifest.blockVersion,
            requiredChanges=sample_manifest.requiredChanges,
            evidenceIds=sample_manifest.evidenceIds,
            manifestHash=sample_manifest.manifestHash,  # Original hash
            createdAt=sample_manifest.createdAt
        )
        
        # Create approval with WRONG manifest hash (to trigger tamper detection)
        approval_with_wrong_hash = ImplementationApproval(
            approval_id="approval-hash-test",
            workflow_id="wf-test-456",
            candidate_sha256="test-candidate-hash-456",
            target_family="Introduction",
            target_version="1.0.0",
            placement_manifest_id=sample_manifest.manifestId,
            placement_manifest_sha256="WRONG-HASH-12345",  # Intentionally wrong
            approved_by="test-approver@example.com",
            approval_timestamp=datetime.now(timezone.utc).isoformat(),
            status=ImplementationApprovalStatus.APPROVED,
            workflow_requester="test-requester@example.com"
        )
        
        with pytest.raises(PlacementExecutionError) as exc_info:
            executor.execute_placement(
                manifest=tampered_manifest,
                approval=approval_with_wrong_hash,
                candidate_files=sample_candidate_files,
                workflow_requester="test-requester@example.com",
                candidate_sha256="test-candidate-hash-456"
            )
        
        assert "hash" in str(exc_info.value).lower() and "mismatch" in str(exc_info.value).lower()
    
    def test_executor_rejects_reject_decision(
        self,
        temp_repository,
        sample_candidate_files
    ):
        """Test that executor rejects REJECT placement decisions."""
        # Create manifest with REJECT decision
        manifest_data = {
            "manifestId": "manifest-reject",
            "candidateId": "candidate-reject",
            "decision": "REJECT",
            "targetPath": "",
            "blockFamily": "Custom",
            "blockVersion": "1.0.0",
            "requiredChanges": ["Candidate rejected"],
            "evidenceIds": [],
            "createdAt": "2025-01-29T00:00:00Z"
        }
        
        manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
        manifest_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
        
        reject_manifest = PlacementManifest(
            manifestId="manifest-reject",
            candidateId="candidate-reject",
            decision=PlacementDecision.REJECT,
            targetPath="",
            blockFamily=BlockFamily.CUSTOM,
            blockVersion="1.0.0",
            requiredChanges=["Candidate rejected"],
            evidenceIds=[],
            manifestHash=manifest_hash,
            createdAt="2025-01-29T00:00:00Z"
        )
        
        # Create APPROVED approval for REJECT manifest (to test rejection logic)
        reject_approval = ImplementationApproval(
            approval_id="approval-reject-test",
            workflow_id="wf-test-789",
            candidate_sha256="test-candidate-hash-789",
            target_family="Custom",
            target_version="1.0.0",
            placement_manifest_id=reject_manifest.manifestId,
            placement_manifest_sha256=reject_manifest.manifestHash,
            approved_by="test-approver@example.com",
            approval_timestamp=datetime.now(timezone.utc).isoformat(),
            status=ImplementationApprovalStatus.APPROVED,
            workflow_requester="test-requester@example.com"
        )
        
        executor = PlacementExecutor(temp_repository)
        
        with pytest.raises(PlacementExecutionError) as exc_info:
            executor.execute_placement(
                manifest=reject_manifest,
                approval=reject_approval,
                candidate_files=sample_candidate_files,
                workflow_requester="test-requester@example.com",
                candidate_sha256="test-candidate-hash-789"
            )
        
        assert "REJECT" in str(exc_info.value)


class TestGovernanceSelfApprovalPrevention:
    """Tests for Wave 2 governance self-approval prevention."""
    
    def test_self_approval_prevented(self):
        """Test that self-approval is prevented (submitter cannot approve)."""
        from app.api.routes.governance import _approvals
        from fastapi import HTTPException
        
        # Create approval record
        approval_id = "approval-test-self"
        manifest_hash = "abc123"
        
        _approvals[approval_id] = {
            "approvalId": approval_id,
            "manifestId": "manifest-123",
            "status": ApprovalStatus.PENDING,
            "submittedBy": "alice@example.com",
            "submittedAt": "2025-01-29T00:00:00Z",
            "decidedBy": None,
            "decidedAt": None,
            "manifestHash": manifest_hash,
            "reason": None,
            "auditTrail": []
        }
        
        # Attempt self-approval
        from app.api.schemas.governance import ApprovalDecisionRequest
        
        request = ApprovalDecisionRequest(
            decidedBy="alice@example.com",  # Same as submitter!
            manifestHash=manifest_hash,
            reason="Approving my own work"
        )
        
        from app.api.routes.governance import approve_manifest
        import asyncio
        
        # Should raise 403 Forbidden
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(approve_manifest(approval_id, request))
        
        assert exc_info.value.status_code == 403
        assert "SELF_APPROVAL_REJECTED" in str(exc_info.value.detail)
        
        # Cleanup
        del _approvals[approval_id]
    
    def test_different_approver_allowed(self):
        """Test that different approver is allowed."""
        from app.api.routes.governance import _approvals
        
        # Create approval record
        approval_id = "approval-test-different"
        manifest_hash = "def456"
        
        _approvals[approval_id] = {
            "approvalId": approval_id,
            "manifestId": "manifest-456",
            "status": ApprovalStatus.PENDING,
            "submittedBy": "alice@example.com",
            "submittedAt": "2025-01-29T00:00:00Z",
            "decidedBy": None,
            "decidedAt": None,
            "manifestHash": manifest_hash,
            "reason": None,
            "auditTrail": []
        }
        
        # Attempt approval by different user
        from app.api.schemas.governance import ApprovalDecisionRequest
        
        request = ApprovalDecisionRequest(
            decidedBy="bob@example.com",  # Different from submitter
            manifestHash=manifest_hash,
            reason="Looks good"
        )
        
        from app.api.routes.governance import approve_manifest
        import asyncio
        
        # Should succeed
        result = asyncio.run(approve_manifest(approval_id, request))
        
        assert result.status == ApprovalStatus.APPROVED
        assert result.decidedBy == "bob@example.com"
        
        # Cleanup
        del _approvals[approval_id]
