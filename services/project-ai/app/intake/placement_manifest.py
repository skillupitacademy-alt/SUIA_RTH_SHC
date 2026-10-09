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
- Wave 3C: Integrates artifact_policy for canonical placement decisions
"""

import hashlib
import json
import uuid
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Tuple

from app.placement import artifact_policy
from app.models.candidate import PlacementDecision


class PlacementValidationError(Exception):
    """Manifest validation failure."""
    pass


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
    Wave 3C: Integrates artifact_policy for canonical placement decisions.
    """
    
    def __init__(self, snapshot_path: Optional[str] = None):
        """
        Initialize placement manifest generator.
        
        Args:
            snapshot_path: Path to discovery snapshot (optional, for artifact policy integration)
        """
        self.snapshot_path = snapshot_path
        self._repository_index: Optional[List[artifact_policy.RepositoryArtifact]] = None
    
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
        
        # Validate manifest before returning
        is_valid, validation_errors = self.validate_manifest(manifest, target_binding)
        if not is_valid:
            error_msg = "Manifest validation failed:\n  - " + "\n  - ".join(validation_errors)
            raise PlacementValidationError(error_msg)
        
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
        
        Wave 3C: Integrates artifact_policy for canonical placement decisions.
        Each file gets an action determined by repository semantic matching:
        - ADD: New artifact with no semantic match
        - UPDATE: Semantic match with different content (duplicate prevention)
        - EXTEND: Semantic match with variant indicator
        - REUSE: Semantic match with identical content
        - REJECT: Quality/compatibility issue (will fail validation)
        
        Args:
            validation: ValidationResult from candidate validation
            target_family: Target block family
            target_version: Target block version
            
        Returns:
            List of file path mappings with actions determined by artifact_policy
        """
        file_paths: List[Dict[str, Any]] = []
        
        # Base path for blocks
        blocks_base = "packages/ui/src/tutorial/blocks"
        schemas_base = "packages/ui/src/tutorial/schemas"
        
        # Load repository index for semantic matching
        repository_index = self._load_repository_index()
        
        # Component file
        component_file = f"{target_family}{target_version}Block.tsx"
        component_target = f"{blocks_base}/{component_file}"
        
        # Determine action via artifact_policy
        component_match = artifact_policy.find_semantic_match(component_file, repository_index)
        component_action = artifact_policy.determine_action(
            candidate_content="",  # Content not available at this stage (hash-based matching)
            candidate_filename=component_file,
            repository_match=component_match
        )
        
        # Get canonical target path (respects duplicate prevention)
        component_final_target = artifact_policy.get_target_path(
            action=component_action,
            candidate_path=component_target,
            repository_match=component_match
        )
        
        file_paths.append({
            "source": component_file,
            "target": component_final_target if component_final_target else component_target,
            "type": "component",
            "action": component_action.value,  # PlacementDecision enum value
            "backup_required": True
        })
        
        # Schema file
        schema_file = f"{target_family}{target_version}Schema.ts"
        schema_target = f"{schemas_base}/{schema_file}"
        
        # Determine action via artifact_policy
        schema_match = artifact_policy.find_semantic_match(schema_file, repository_index)
        schema_action = artifact_policy.determine_action(
            candidate_content="",
            candidate_filename=schema_file,
            repository_match=schema_match
        )
        
        # Get canonical target path
        schema_final_target = artifact_policy.get_target_path(
            action=schema_action,
            candidate_path=schema_target,
            repository_match=schema_match
        )
        
        file_paths.append({
            "source": schema_file,
            "target": schema_final_target if schema_final_target else schema_target,
            "type": "schema",
            "action": schema_action.value,
            "backup_required": True
        })
        
        # Type definitions (if present)
        # Check if candidate includes types
        candidate_evidence = validation.evidence or {}
        artifact_count = candidate_evidence.get("artifact_count", 0)
        
        if artifact_count > 2:  # More than just component and schema
            types_file = "types.ts"
            types_target = f"{blocks_base}/{types_file}"
            
            # Determine action via artifact_policy
            types_match = artifact_policy.find_semantic_match(types_file, repository_index)
            types_action = artifact_policy.determine_action(
                candidate_content="",
                candidate_filename=types_file,
                repository_match=types_match
            )
            
            # Get canonical target path
            types_final_target = artifact_policy.get_target_path(
                action=types_action,
                candidate_path=types_target,
                repository_match=types_match
            )
            
            file_paths.append({
                "source": types_file,
                "target": types_final_target if types_final_target else types_target,
                "type": "types",
                "action": types_action.value,
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
    
    def _load_repository_index(self) -> List[artifact_policy.RepositoryArtifact]:
        """
        Load repository index from discovery snapshot.
        
        Returns:
            List of repository artifacts
        """
        if self._repository_index is not None:
            return self._repository_index
        
        # If no snapshot path provided, warn and return empty index
        if self.snapshot_path is None:
            import logging
            logging.warning(
                "PlacementManifestGenerator: snapshot_path not provided. "
                "Duplicate prevention disabled - all artifacts will use ADD action."
            )
            return []
        
        # Load snapshot
        try:
            with open(self.snapshot_path, 'r', encoding='utf-8') as f:
                snapshot = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            import logging
            logging.warning(
                f"PlacementManifestGenerator: Failed to load snapshot from {self.snapshot_path}: {e}. "
                "Duplicate prevention disabled - all artifacts will use ADD action."
            )
            return []
        
        # Build repository index
        self._repository_index = artifact_policy.build_repository_index(snapshot)
        return self._repository_index
    
    def validate_manifest(
        self,
        manifest: PlacementManifest,
        target_binding: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Validate manifest for safety and correctness.
        
        Validation rules:
        - All artifacts must have actions
        - No REJECT actions in approved manifests
        - All target paths must be safe (no traversal, relative paths only)
        - Target paths must start with allowed prefixes
        - Manifest version/family must match target_binding
        
        Args:
            manifest: PlacementManifest to validate
            target_binding: Target binding dictionary
            
        Returns:
            Tuple of (is_valid, error_list)
        """
        errors: List[str] = []
        
        # Check all file_paths have action field
        for file_path in manifest.file_paths:
            if "action" not in file_path or not file_path["action"]:
                errors.append(f"Missing action for file: {file_path.get('source', 'unknown')}")
            
            # Check for REJECT actions
            action_str = file_path.get("action", "").upper()
            if action_str == "REJECT":
                errors.append(f"REJECT action found for file: {file_path.get('source', 'unknown')}")
            
            # Check target path safety
            target = file_path.get("target", "")
            if not target:
                errors.append(f"Empty target path for file: {file_path.get('source', 'unknown')}")
                continue
            
            # Check for path traversal
            if "../" in target or target.startswith("/"):
                errors.append(f"Unsafe path (traversal or absolute): {target}")
            
            # Check for allowed prefix
            allowed_prefixes = [
                "packages/ui/src/tutorial/blocks/",
                "packages/ui/src/tutorial/schemas/",
                "packages/ui/src/tutorial/types/",
                "packages/ui/src/tutorial/utils/",
                "packages/shared/src/tutorial/",
            ]
            
            if not any(target.startswith(prefix) for prefix in allowed_prefixes):
                errors.append(f"Target path not in allowed directories: {target}")
        
        # Check manifest version/family match target_binding
        expected_family = target_binding.get("target_family")
        expected_version = target_binding.get("target_version")
        
        if expected_family and manifest.target_family != expected_family:
            errors.append(
                f"Manifest family mismatch: expected {expected_family}, got {manifest.target_family}"
            )
        
        if expected_version and manifest.target_version != expected_version:
            errors.append(
                f"Manifest version mismatch: expected {expected_version}, got {manifest.target_version}"
            )
        
        return (len(errors) == 0, errors)
    
    def _get_timestamp(self) -> str:
        """
        Get current timestamp in ISO 8601 format.
        
        Returns:
            ISO 8601 timestamp string
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
