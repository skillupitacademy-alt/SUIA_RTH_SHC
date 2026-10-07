"""
Unit tests for WorkflowTarget and CandidateBinding models.

Tests M2.9 Wave 1 - B04: Target Binding requirement.
"""

import pytest
from pydantic import ValidationError

from app.models.workflow_target import WorkflowTarget, CandidateBinding


class TestWorkflowTarget:
    """Test WorkflowTarget model."""
    
    def test_valid_workflow_target(self):
        """Test that a valid WorkflowTarget can be constructed."""
        target = WorkflowTarget(
            workflow_id="wf-001",
            family="Introduction",
            version="I7",
            block_type="introduction",
            specification_id="spec-123",
            source_snapshot_id="snapshot-abc"
        )
        
        assert target.workflow_id == "wf-001"
        assert target.family == "Introduction"
        assert target.version == "I7"
        assert target.block_type == "introduction"
        assert target.specification_id == "spec-123"
        assert target.source_snapshot_id == "snapshot-abc"
    
    def test_workflow_target_uses_version_not_semver(self):
        """Test that WorkflowTarget uses I7 format, not 1.0.0."""
        # This is the key distinction - we use I7, not 1.0.0
        target = WorkflowTarget(
            workflow_id="wf-002",
            family="Code",
            version="C5",  # Not "1.0.0"
            block_type="code",
            specification_id="spec-456",
            source_snapshot_id="snapshot-def"
        )
        
        assert target.version == "C5"
        assert target.version != "1.0.0"
    
    def test_workflow_target_missing_required_field(self):
        """Test that missing required fields raise ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            WorkflowTarget(
                workflow_id="wf-003",
                family="Definition",
                # Missing version
                block_type="definition",
                specification_id="spec-789",
                source_snapshot_id="snapshot-ghi"
            )
        
        assert "version" in str(exc_info.value)


class TestCandidateBinding:
    """Test CandidateBinding model."""
    
    def test_valid_candidate_binding(self):
        """Test that a valid CandidateBinding can be constructed."""
        binding = CandidateBinding(
            workflow_id="wf-001",
            target_family="Introduction",
            target_version="I7",
            specification_id="spec-123",
            contract_hash="abc123def456"
        )
        
        assert binding.workflow_id == "wf-001"
        assert binding.target_family == "Introduction"
        assert binding.target_version == "I7"
        assert binding.specification_id == "spec-123"
        assert binding.contract_hash == "abc123def456"
    
    def test_candidate_binding_default_contract_hash(self):
        """Test that contract_hash defaults to empty string."""
        binding = CandidateBinding(
            workflow_id="wf-002",
            target_family="Code",
            target_version="C3",
            specification_id="spec-456"
            # contract_hash not provided (filled in Wave 2)
        )
        
        assert binding.contract_hash == ""
    
    def test_candidate_binding_empty_family_allowed(self):
        """Test that empty family is allowed but documents the gap."""
        # This test documents that we currently allow empty family
        # In production, this should be validated at the workflow level
        binding = CandidateBinding(
            workflow_id="wf-003",
            target_family="",  # Empty allowed by Pydantic
            target_version="I1",
            specification_id="spec-789"
        )
        
        # This passes but highlights the gap
        # TODO(m2.9/B04): Add min_length validation when workflow integration complete
        assert binding.target_family == ""
    
    def test_candidate_binding_missing_required_field(self):
        """Test that missing required fields raise ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            CandidateBinding(
                workflow_id="wf-004",
                target_family="Summary",
                # Missing target_version
                specification_id="spec-101"
            )
        
        assert "target_version" in str(exc_info.value)


class TestWorkflowTargetIntegration:
    """Integration tests for WorkflowTarget usage."""
    
    def test_workflow_target_prevents_version_mismatch(self):
        """
        Test that WorkflowTarget addresses the I7 vs 1.0.0 mismatch.
        
        Audit finding: manifest uses "1.0.0" but UI uses "I7".
        WorkflowTarget should carry "I7" to prevent this mismatch.
        """
        # User requests I7
        target = WorkflowTarget(
            workflow_id="wf-audit-001",
            family="Introduction",
            version="I7",  # User requested version
            block_type="introduction",
            specification_id="user-request-123",
            source_snapshot_id="snapshot-latest"
        )
        
        # Candidate should bind to this target
        binding = CandidateBinding(
            workflow_id=target.workflow_id,
            target_family=target.family,
            target_version=target.version,  # Must match user request
            specification_id=target.specification_id
        )
        
        # Verify binding preserves user-requested version
        assert binding.target_version == "I7"
        assert binding.target_version == target.version
        
        # In Wave 3, placement agent should use binding.target_version
        # instead of hardcoded "1.0.0"
