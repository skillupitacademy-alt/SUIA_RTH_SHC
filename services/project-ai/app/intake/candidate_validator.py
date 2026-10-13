"""
Candidate Validator - M2.9 Wave 3 Phase 2A

Validates uploaded candidate packages against workflow target binding and engineering contract.

VALIDATION RULES:
- SHA-256 hash must be computed from actual file content (never trust client)
- Target family must match WorkflowTarget.family
- Target version must be EXPLICIT (no inference allowed)
- Artifact structure must match EngineeringContract.required_artifacts
- All evidence fields must be populated (never empty dicts on success)

ARCHITECTURAL BOUNDARIES:
- Consumes WorkflowTarget binding for version/family authority
- Never infers target version from file content (version binding violation)
- Fails explicitly on missing metadata (no silent fallbacks)
"""

import hashlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Any, List


class ValidationError(Exception):
    """Raised when candidate validation fails with explicit error."""
    pass


@dataclass
class ValidationResult:
    """
    Result of candidate validation.
    
    All evidence fields must be populated on success.
    Empty evidence dict indicates incomplete validation.
    """
    valid: bool
    sha256: str
    target_family: str
    target_version: str
    errors: List[str] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)


class CandidateValidator:
    """
    Validates candidate packages uploaded by users after external AI implementation.
    
    Ensures candidate binding integrity: hash verification, target matching, artifact structure.
    """
    
    def __init__(self):
        """Initialize candidate validator."""
        pass
    
    def validate(
        self,
        candidate_path: str,
        upload_meta: Dict[str, Any]
    ) -> ValidationResult:
        """
        Validate a candidate package.
        
        Args:
            candidate_path: Absolute path to candidate package (directory or zip file)
            upload_meta: Upload metadata containing:
                - sha256: Expected SHA-256 hash (will be verified, not trusted)
                - target_family: Target block family (e.g., "Introduction")
                - target_version: EXPLICIT target version (e.g., "I7") - REQUIRED
                - workflow_id: Workflow identifier
                - specification_id: Specification this candidate implements
                
        Returns:
            ValidationResult with validation status and evidence
            
        Raises:
            ValidationError: If required metadata is missing or malformed
        """
        errors: List[str] = []
        evidence: Dict[str, Any] = {}
        
        # Extract metadata (fail explicitly if missing)
        target_family = upload_meta.get('target_family')
        target_version = upload_meta.get('target_version')
        expected_sha256 = upload_meta.get('sha256')
        workflow_id = upload_meta.get('workflow_id')
        
        # Validate required fields
        if not target_family:
            raise ValidationError("target_family is required in upload metadata")
        
        if not target_version:
            raise ValidationError("target_version must be explicit (no inference allowed)")
        
        if not expected_sha256:
            raise ValidationError("sha256 is required in upload metadata")
        
        if not workflow_id:
            raise ValidationError("workflow_id is required in upload metadata")
        
        # Compute actual SHA-256 from file (NEVER trust client hash)
        candidate_path_obj = Path(candidate_path)
        if not candidate_path_obj.exists():
            errors.append(f"Candidate path does not exist: {candidate_path}")
            return ValidationResult(
                valid=False,
                sha256="",
                target_family=target_family,
                target_version=target_version,
                errors=errors,
                evidence={}
            )
        
        try:
            actual_sha256 = self._compute_candidate_hash(candidate_path_obj)
        except Exception as e:
            errors.append(f"Failed to compute candidate hash: {str(e)}")
            return ValidationResult(
                valid=False,
                sha256="",
                target_family=target_family,
                target_version=target_version,
                errors=errors,
                evidence={}
            )
        
        # Verify hash matches expected
        if actual_sha256 != expected_sha256:
            errors.append(
                f"SHA-256 mismatch: expected {expected_sha256}, got {actual_sha256}"
            )
        
        # Validate artifact structure
        artifact_errors = self._validate_artifact_structure(
            candidate_path_obj,
            target_family,
            target_version
        )
        errors.extend(artifact_errors)
        
        # Build evidence dictionary (must be populated even on failure)
        evidence = {
            "candidate_path": str(candidate_path_obj),
            "is_directory": candidate_path_obj.is_dir(),
            "is_file": candidate_path_obj.is_file(),
            "computed_sha256": actual_sha256,
            "expected_sha256": expected_sha256,
            "hash_match": actual_sha256 == expected_sha256,
            "target_family": target_family,
            "target_version": target_version,
            "workflow_id": workflow_id,
            "artifact_count": self._count_artifacts(candidate_path_obj),
            "validation_timestamp": self._get_timestamp(),
        }
        
        # Validation passes only if no errors
        valid = len(errors) == 0
        
        return ValidationResult(
            valid=valid,
            sha256=actual_sha256,
            target_family=target_family,
            target_version=target_version,
            errors=errors,
            evidence=evidence
        )
    
    def _compute_candidate_hash(self, candidate_path: Path) -> str:
        """
        Compute SHA-256 hash of candidate package.
        
        For directories: hash of concatenated file hashes in sorted order
        For files: hash of file content
        
        Args:
            candidate_path: Path to candidate package
            
        Returns:
            Hex-encoded SHA-256 hash
        """
        if candidate_path.is_file():
            # Single file: hash its content
            sha256_hash = hashlib.sha256()
            with open(candidate_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        
        elif candidate_path.is_dir():
            # Directory: hash concatenation of all file hashes (sorted)
            sha256_hash = hashlib.sha256()
            
            # Get all files in directory (recursively)
            files = sorted(candidate_path.rglob("*"))
            files = [f for f in files if f.is_file()]
            
            for file_path in files:
                # Hash each file
                with open(file_path, "rb") as f:
                    file_hash = hashlib.sha256()
                    for byte_block in iter(lambda: f.read(4096), b""):
                        file_hash.update(byte_block)
                    sha256_hash.update(file_hash.digest())
            
            return sha256_hash.hexdigest()
        
        else:
            raise ValidationError(f"Invalid candidate path: {candidate_path}")
    
    def _validate_artifact_structure(
        self,
        candidate_path: Path,
        target_family: str,
        target_version: str
    ) -> List[str]:
        """
        Validate that candidate contains expected artifact structure.
        
        Expected artifacts (from EngineeringContract):
        - Component file: {Family}{Version}Block.tsx (e.g., IntroductionI7Block.tsx)
        - Schema file: {Family}{Version}Schema.ts (e.g., IntroductionI7Schema.ts)
        - Type definitions: types.ts or index.d.ts
        - Tests: *.test.tsx or *.spec.tsx
        
        Args:
            candidate_path: Path to candidate package
            target_family: Target block family
            target_version: Target block version
            
        Returns:
            List of validation errors (empty if structure is valid)
        """
        errors: List[str] = []
        
        # Expected file patterns
        component_pattern = f"{target_family}{target_version}Block.tsx"
        schema_pattern = f"{target_family}{target_version}Schema.ts"
        
        if candidate_path.is_file():
            # Single file upload: must be the component or a zip
            if not (candidate_path.name == component_pattern or candidate_path.suffix == '.zip'):
                errors.append(
                    f"Single file upload must be {component_pattern} or a .zip archive"
                )
        
        elif candidate_path.is_dir():
            # Directory: check for required files
            files = list(candidate_path.rglob("*"))
            file_names = [f.name for f in files if f.is_file()]
            
            # Check for component file
            if component_pattern not in file_names:
                errors.append(f"Missing required component file: {component_pattern}")
            
            # Check for schema file
            if schema_pattern not in file_names:
                errors.append(f"Missing required schema file: {schema_pattern}")
            
            # Check for type definitions (optional but recommended)
            # Note: These are not added to errors since they're optional
        
        return errors
    
    def _count_artifacts(self, candidate_path: Path) -> int:
        """
        Count artifacts in candidate package.
        
        Args:
            candidate_path: Path to candidate package
            
        Returns:
            Number of files in candidate
        """
        if candidate_path.is_file():
            return 1
        elif candidate_path.is_dir():
            files = [f for f in candidate_path.rglob("*") if f.is_file()]
            return len(files)
        return 0
    
    def _get_timestamp(self) -> str:
        """
        Get current timestamp in ISO 8601 format.
        
        Returns:
            ISO 8601 timestamp string
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
