"""Tests for certification gate manifest validation (Wave R3)."""

import hashlib
import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import Mock

from app.certification.gates import CertificationGateExecutor, GateExecutionResult
from app.models.creation import CertificationGateStatus
from app.models.candidate import PlacementManifest, PlacementDecision, BlockFamily


def create_test_manifest(
    candidate_id: str = "candidate-block-XYZ789",
    target_path: str = "packages/blocks/src/custom/IntroductionBlock.tsx",
    evidence_ids: list[str] = None,
    tamper: bool = False
) -> PlacementManifest:
    """Create a test PlacementManifest with valid hash."""
    if evidence_ids is None:
        evidence_ids = ["evidence-abc123", "evidence-def456"]
    
    manifest = PlacementManifest(
        manifestId="manifest-test-001",
        candidateId=candidate_id,
        decision=PlacementDecision.ADD,
        targetPath=target_path,
        blockFamily=BlockFamily.CUSTOM,
        blockVersion="C1",  # B07 fix: use proper version format
        requiredChanges=["Add UBRC compliance", "Add brand independence"],
        evidenceIds=evidence_ids,
        manifestHash="",  # Will be computed
        createdAt=datetime.now(UTC).isoformat()
    )
    
    # Compute hash exactly as validation does (zero hash first, then compute)
    manifest.manifestHash = ""
    manifest_json = manifest.model_dump_json(exclude_none=True, indent=2)
    computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    manifest.manifestHash = computed_hash
    
    # Optionally tamper with hash
    if tamper:
        manifest.manifestHash = "tampered_hash_12345"
    
    return manifest


def create_test_snapshot(evidence_ids: list[str] = None, target_path: str = "packages/blocks/src/custom/IntroductionBlock.tsx") -> dict:
    """Create a minimal test snapshot."""
    if evidence_ids is None:
        evidence_ids = ["evidence-abc123", "evidence-def456"]
    
    return {
        "schemaVersion": "1.1.0",
        "repository": {
            "owner": "test",
            "name": "test-repo",
            "commitSha": "abc123",
            "scanTimestamp": "2025-01-30T12:00:00Z"
        },
        "evidence": [
            {
                "evidenceId": eid,
                "scannerName": "d1-structure-scanner",
                "timestamp": "2025-01-30T12:00:00Z",
                "path": target_path,  # Match target path for semantic validation
                "kind": "component",
                "claim": "Test evidence",
                "locator": f"file:{target_path}",
                "contentHash": "hash123",
                "lifecycle": "current"
            }
            for eid in evidence_ids
        ],
        "blocks": {
            "verified": []
        }
    }


class TestManifestValidation:
    """Test PlacementManifest validation in certification gates."""
    
    def test_manifest_hash_verification_valid(self):
        """Valid manifest hash should pass validation."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        valid, errors = executor._validate_manifest(manifest)
        
        # Debug: print errors if validation fails
        if not valid:
            print(f"Validation errors: {errors}")
        
        assert valid is True
        assert len(errors) == 0
    
    def test_manifest_tampering_detection(self):
        """Tampered manifest hash should be detected."""
        manifest = create_test_manifest(tamper=True)
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        valid, errors = executor._validate_manifest(manifest)
        
        assert valid is False
        assert any("tampering detected" in err.lower() for err in errors)
    
    def test_path_inference_detection(self):
        """Path inferred from candidate name should be rejected."""
        # Create manifest where targetPath contains candidateId
        manifest = create_test_manifest(
            candidate_id="candidate-test-block",
            target_path="packages/blocks/src/test/block/Component.tsx"  # Contains "test/block"
        )
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        valid, errors = executor._validate_manifest(manifest)
        
        assert valid is False
        assert any("inferred from block name" in err.lower() for err in errors)
    
    def test_manifest_evidence_validation_missing_id(self):
        """Manifest with missing evidence ID should be rejected."""
        # Manifest references evidence-xyz999 which doesn't exist
        manifest = create_test_manifest(evidence_ids=["evidence-abc123", "evidence-xyz999"])
        snapshot = create_test_snapshot(evidence_ids=["evidence-abc123", "evidence-def456"])
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        valid, errors = executor._validate_manifest(manifest)
        
        assert valid is False
        assert any("evidence-xyz999" in err and "not found" in err.lower() for err in errors)
    
    def test_gate_execution_with_invalid_manifest(self):
        """Gate execution with invalid manifest should return BLOCKED."""
        manifest = create_test_manifest(tamper=True)
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_ubrc_gate(["I1"], manifest=manifest)
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert "Manifest validation failed" in result.message
        assert len(result.blockers) > 0
        assert any("tampering" in blocker.lower() for blocker in result.blockers)


class TestGateManifestIntegration:
    """Test manifest integration with all gate methods."""
    
    def test_ubrc_gate_accepts_manifest(self):
        """UBRC gate should accept and validate manifest parameter."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        snapshot["blocks"]["verified"] = [
            {
                "blockType": "introduction",
                "ubrcStatus": "UBRC_VALID",
                "evidenceId": "evidence-abc123"
            }
        ]
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_ubrc_gate(["I1"], manifest=manifest)
        
        # Should not fail on manifest validation
        assert result.status != CertificationGateStatus.BLOCKED or \
               "Manifest validation failed" not in result.message
    
    def test_brand_gate_accepts_manifest(self):
        """Brand independence gate should accept manifest parameter."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_brand_independence_gate([], manifest=manifest)
        
        # Should not fail on manifest validation (may fail on missing files)
        assert "Manifest validation failed" not in result.message
    
    def test_registry_gate_accepts_manifest(self):
        """Registry gate should accept manifest parameter."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_registry_verification_gate(["I1"], manifest=manifest)
        
        # Should not fail on manifest validation
        assert "Manifest validation failed" not in result.message
    
    def test_renderer_gate_accepts_manifest(self):
        """Renderer gate should accept manifest parameter."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_renderer_verification_gate(["I1"], manifest=manifest)
        
        # Should not fail on manifest validation
        assert "Manifest validation failed" not in result.message
    
    def test_evidence_binding_gate_accepts_manifest(self):
        """Evidence binding gate should accept manifest parameter."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_evidence_binding_gate(["I1"], manifest=manifest)
        
        # Should not fail on manifest validation
        assert "Manifest validation failed" not in result.message
    
    def test_composer_gate_accepts_manifest(self):
        """Composer gate should accept manifest parameter."""
        manifest = create_test_manifest()
        snapshot = create_test_snapshot()
        executor = CertificationGateExecutor(snapshot, Path("/test"))
        
        result = executor.execute_composer_verification_gate(["I1"], manifest=manifest)
        
        # Should not fail on manifest validation
        assert "Manifest validation failed" not in result.message
