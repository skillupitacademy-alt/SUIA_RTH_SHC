"""
Placement Manifest Generator - M2.9 Wave 3 Phase 2C

Generates immutable placement manifests for candidate file placement.

MANIFEST RULES:
- Immutable once generated: sealed with manifest_sha256
- Contains target paths, replacement strategy, rollback plan
- Replacement strategy derived from comparison report:
  * atomic_replace: No breaking changes, safe to replace
  * staged_replace: Breaking changes detected, staged rollout required
  * rollback_only: Deviations detected, manual review required
- Manifest ID is UUID for traceability

ARCHITECTURAL BOUNDARIES:
- Consumes ValidationResult and ComparisonReport (never computes independently)
- Uses target_binding for version/family authority (from WorkflowTarget)
- Manifest hash seals all fields (tamper detection)
"""

import hashlib
import json
import uuid
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List


@dataclass
class PlacementManifest:
    """
    Immutable placement manifest for candidate file placement.
    
    Sealed with manifest_sha256 to detect tampering.
    """
    manifest_id: str
    candidate_sha256: str
    target_family: str
    target_version: str
    file_paths: List[Dict[str, Any]] = field(default_factory=list)
    replacement_strategy: str = "atomic_replace"
    rollback_plan: Dict[str, Any] = field(default_factory=dict)
    generated_at: str = ""
    manifest_sha256: str = ""


class PlacementManifestGenerator:
    """
    Generates placement manifests for validated candidates.
    
    Manifest is immutable once generated and sealed with SHA-256 hash.
    """
    
    def __init__(self):
        """Initialize placement manifest generator."""
        pass
    
    def generate(
        self,
        validation: Any,  # ValidationResult from candidate_validator
        comparison: Any,  # ComparisonReport from canonical_comparator
        target_binding: Dict[str, Any]
    ) -> PlacementManifest:
        """
        Generate placement manifest from validation and comparison results.
        
        Args:
            validation: ValidationResult from candidate validation
            comparison: ComparisonReport from canonical comparison
            target_binding: Target binding dictionary containing:
                - workflow_id: Workflow identifier
                - target_family: Target block family
                - target_version: Target block version
                - specification_id: Specification this candidate implements
                - contract_hash: SHA-256 hash of EngineeringContract (optional)
                
        Returns:
            PlacementManifest with all fields populated and sealed
        """
        # Generate manifest ID
        manifest_id = str(uuid.uuid4())
        
        # Extract target binding data
        target_family = target_binding.get("target_family", validation.target_family)
        target_version = target_binding.get("target_version", validation.target_version)
        workflow_id = target_binding.get("workflow_id", "")
        specification_id = target_binding.get("specification_id", "")
        
        # Determine replacement strategy based on comparison report
        replacement_strategy = self._determine_replacement_strategy(comparison)
        
        # Generate file paths for placement
        file_paths = self._generate_file_paths(
            validation,
            target_family,
            target_version
        )
        
        # Generate rollback plan
        rollback_plan = self._generate_rollback_plan(
            target_family,
            target_version,
            workflow_id
        )
        
        # Get current timestamp
        generated_at = self._get_timestamp()
        
        # Create manifest (without seal yet)
        manifest = PlacementManifest(
            manifest_id=manifest_id,
            candidate_sha256=validation.sha256,
            target_family=target_family,
            target_version=target_version,
            file_paths=file_paths,
            replacement_strategy=replacement_strategy,
            rollback_plan=rollback_plan,
            generated_at=generated_at,
            manifest_sha256=""  # Will be computed next
        )
        
        # Compute manifest seal (hash of all other fields)
        manifest_sha256 = self._compute_manifest_seal(manifest)
        manifest.manifest_sha256 = manifest_sha256
        
        return manifest
    
    def _determine_replacement_strategy(self, comparison: Any) -> str:
        """
        Determine replacement strategy based on comparison report.
        
        Strategy rules:
        - atomic_replace: No breaking changes or deviations
        - staged_replace: Breaking changes detected
        - rollback_only: Deviations detected (UBRC/brand/theme violations)
        
        Args:
            comparison: ComparisonReport from canonical comparison
            
        Returns:
            Replacement strategy string
        """
        # Check for deviations (highest priority)
        if comparison.deviations:
            # Check if any deviations are severe (errors)
            has_severe_deviations = any(
                dev.get("severity") == "error"
                for dev in comparison.deviations
            )
            if has_severe_deviations:
                return "rollback_only"
        
        # Check for breaking changes
        if comparison.has_breaking_changes:
            return "staged_replace"
        
        # Check for API changes (even non-breaking ones warrant staged deployment)
        if comparison.api_changes:
            return "staged_replace"
        
        # Default: atomic replace (safe)
        return "atomic_replace"
    
    def _generate_file_paths(
        self,
        validation: Any,
        target_family: str,
        target_version: str
    ) -> List[Dict[str, Any]]:
        """
        Generate target file paths for candidate placement.
        
        Args:
            validation: ValidationResult from candidate validation
            target_family: Target block family
            target_version: Target block version
            
        Returns:
            List of file path mappings
        """
        file_paths: List[Dict[str, Any]] = []
        
        # Base path for blocks
        blocks_base = "packages/ui/src/tutorial/blocks"
        schemas_base = "packages/ui/src/tutorial/schemas"
        
        # Component file
        component_file = f"{target_family}{target_version}Block.tsx"
        component_target = f"{blocks_base}/{component_file}"
        
        file_paths.append({
            "source": component_file,
            "target": component_target,
            "type": "component",
            "action": "write",
            "backup_required": True
        })
        
        # Schema file
        schema_file = f"{target_family}{target_version}Schema.ts"
        schema_target = f"{schemas_base}/{schema_file}"
        
        file_paths.append({
            "source": schema_file,
            "target": schema_target,
            "type": "schema",
            "action": "write",
            "backup_required": True
        })
        
        # Type definitions (if present)
        # Check if candidate includes types
        candidate_evidence = validation.evidence or {}
        artifact_count = candidate_evidence.get("artifact_count", 0)
        
        if artifact_count > 2:  # More than just component and schema
            file_paths.append({
                "source": "types.ts",
                "target": f"{blocks_base}/types.ts",
                "type": "types",
                "action": "write",
                "backup_required": False
            })
        
        return file_paths
    
    def _generate_rollback_plan(
        self,
        target_family: str,
        target_version: str,
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Generate rollback plan for manifest.
        
        Args:
            target_family: Target block family
            target_version: Target block version
            workflow_id: Workflow identifier
            
        Returns:
            Rollback plan dictionary
        """
        return {
            "strategy": "git_worktree_delete",
            "description": f"Delete worktree for {target_family}{target_version} (workflow {workflow_id})",
            "steps": [
                "Delete git worktree",
                "Remove temporary files",
                "Restore pre-placement state"
            ],
            "verification": [
                "Verify main branch unchanged",
                "Verify no orphaned files",
                "Verify worktree removed"
            ],
            "notes": "Rollback is safe if placement fails before merge to main"
        }
    
    def _compute_manifest_seal(self, manifest: PlacementManifest) -> str:
        """
        Compute SHA-256 seal of manifest (all fields except manifest_sha256).
        
        Args:
            manifest: PlacementManifest to seal
            
        Returns:
            Hex-encoded SHA-256 hash
        """
        # Convert manifest to dict (excluding manifest_sha256)
        manifest_dict = asdict(manifest)
        
        # Remove manifest_sha256 field (we're computing it)
        manifest_dict.pop("manifest_sha256", None)
        
        # Serialize to JSON (sorted keys for deterministic hash)
        manifest_json = json.dumps(manifest_dict, sort_keys=True)
        
        # Compute SHA-256
        sha256_hash = hashlib.sha256(manifest_json.encode("utf-8"))
        return sha256_hash.hexdigest()
    
    def verify_manifest_seal(self, manifest: PlacementManifest) -> bool:
        """
        Verify manifest seal integrity.
        
        Args:
            manifest: PlacementManifest to verify
            
        Returns:
            True if seal is valid, False otherwise
        """
        expected_seal = manifest.manifest_sha256
        actual_seal = self._compute_manifest_seal(manifest)
        return expected_seal == actual_seal
    
    def _get_timestamp(self) -> str:
        """
        Get current timestamp in ISO 8601 format.
        
        Returns:
            ISO 8601 timestamp string
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
