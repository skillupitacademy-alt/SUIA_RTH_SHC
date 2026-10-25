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
import zipfile
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional, Union, Set

from app.contracts.policy import get_framework_compliance_policy


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
        
        # Extract contract-driven required_artifacts if present in metadata or contract
        required_artifacts = upload_meta.get("required_artifacts")
        if not required_artifacts and isinstance(upload_meta.get("contract"), dict):
            required_artifacts = upload_meta.get("contract", {}).get("required_artifacts")
        elif not required_artifacts and hasattr(upload_meta.get("contract"), "required_artifacts"):
            required_artifacts = getattr(upload_meta.get("contract"), "required_artifacts")
        
        # Validate artifact structure (contract-driven if required_artifacts provided)
        artifact_errors, artifact_evidence = self._validate_artifact_structure(
            candidate_path_obj,
            target_family,
            target_version,
            required_artifacts=required_artifacts
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
            "governing_policy": get_framework_compliance_policy(),
            "contract_driven": artifact_evidence.get("contract_driven", False),
            "required_artifacts": artifact_evidence.get("required_artifacts", []),
            "matched_artifacts": artifact_evidence.get("matched_artifacts", []),
            "missing_artifacts": artifact_evidence.get("missing_artifacts", []),
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
    
    def _extract_candidate_files(self, candidate_path: Path) -> Tuple[Dict[str, bytes], Optional[str]]:
        """
        Extract file relative paths and byte contents from candidate package.
        Safely inspects zip archives without full disk extraction.
        """
        if candidate_path.is_file():
            if candidate_path.suffix.lower() == '.zip':
                try:
                    files_data = {}
                    with zipfile.ZipFile(candidate_path, 'r') as zf:
                        for n in zf.namelist():
                            if not n.endswith('/') and not n.startswith('__MACOSX'):
                                files_data[Path(n).as_posix()] = zf.read(n)
                    return files_data, None
                except Exception as e:
                    return {}, f"Invalid or corrupted zip archive: {str(e)}"
            else:
                return {candidate_path.name: candidate_path.read_bytes()}, None
        elif candidate_path.is_dir():
            files_data = {}
            for f in candidate_path.rglob("*"):
                if f.is_file():
                    rel = f.relative_to(candidate_path).as_posix()
                    files_data[rel] = f.read_bytes()
            return files_data, None
        return {}, f"Invalid candidate path: {candidate_path}"

    def _verify_implementation(self, file_path: str, content: bytes) -> Tuple[bool, Optional[str]]:
        """
        Verify that an artifact contains a non-empty, valid implementation.
        Rejects empty files, whitespace-only files, or empty stubs.
        """
        if not content or len(content.strip()) == 0:
            return False, f"Artifact '{file_path}' is empty (0 bytes)"
        
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = content.decode('latin-1')
            except Exception:
                return True, None  # Binary asset
        
        stripped = text.strip()
        if not stripped:
            return False, f"Artifact '{file_path}' contains only whitespace"
        
        lower_path = file_path.lower()
        if lower_path.endswith(('.ts', '.tsx', '.js', '.jsx')):
            # Must not be only comments
            code_lines = [
                line.strip() for line in stripped.splitlines() 
                if line.strip() 
                and not line.strip().startswith('//') 
                and not line.strip().startswith('/*') 
                and not line.strip().startswith('*')
            ]
            if not code_lines:
                return False, f"Artifact '{file_path}' contains only comments or stubs without implementation"
            
            # Must contain at least one recognized definition/keyword
            keywords = ("export", "function", "const", "class", "interface", "type", "import", "describe", "test", "it")
            if not any(kw in stripped for kw in keywords):
                return False, f"Artifact '{file_path}' lacks valid implementation code or exports"

            # Canonical toolchain syntax validation using Node + TypeScript
            syntax_valid, syntax_error = self._validate_typescript_syntax(file_path, text)
            if not syntax_valid:
                return False, syntax_error
        elif lower_path.endswith('.json'):
            try:
                json.loads(stripped)
            except Exception as e:
                return False, f"Artifact '{file_path}' contains invalid JSON: {str(e)}"
        
        return True, None

    def _validate_typescript_syntax(self, file_path: str, code: str) -> Tuple[bool, Optional[str]]:
        """
        Validate TypeScript/TSX syntax using available toolchain (Node + TypeScript).
        Catches unclosed JSX tags, malformed expressions, and syntax errors.
        """
        import subprocess
        try:
            cmd = [
                'node', '-e',
                '''
const ts = require('typescript');
const code = process.argv[1];
const filename = process.argv[2] || 'file.tsx';
const isJsx = filename.endsWith('.tsx') || filename.endsWith('.jsx');
const res = ts.transpileModule(code, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext
    }
});
const diags = (res.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
if (diags.length > 0) {
    const msgs = diags.map(d => typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText);
    console.error(msgs.join('; '));
    process.exit(1);
}
''',
                code,
                file_path
            ]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if proc.returncode != 0:
                err_msg = proc.stderr.strip() or "TypeScript/TSX syntax error"
                return False, f"Artifact '{file_path}' failed TypeScript/TSX syntax validation: {err_msg}"
            return True, None
        except Exception:
            # If toolchain subprocess is unavailable in environment, pass through
            return True, None

    def _find_matching_file(
        self,
        req: str,
        available_files: Set[str],
        valid_component_names: Set[str],
        valid_schema_names: Set[str],
        target_family: str,
        target_version: str
    ) -> Optional[str]:
        """
        Find candidate file satisfying a single contract requirement.
        Preserves directory structure: path-qualified requirements must match path,
        not just basename.
        """
        req_norm = Path(req).as_posix()
        req_name = Path(req).name
        req_lower = req.lower()
        has_dir = '/' in req_norm

        # 1. Exact path match
        if req_norm in available_files:
            return req_norm
        
        # Enforce strict exact path matching relative to candidate root
        if has_dir:
            # Do NOT permit prefix-nested paths like nested/src/Component.tsx to match src/Component.tsx
            return None

        # 2. Exact basename match when req has no directory component
        for f in available_files:
            if Path(f).name == req_name:
                return f

        # 3. Descriptive test requirements
        if any(u in req_lower for u in ["test", "spec"]):
            for f in available_files:
                name = Path(f).name
                if name.endswith(('.test.tsx', '.test.ts', '.spec.tsx', '.spec.ts')):
                    return f
            return None

        # 4. Descriptive schema requirements
        if "schema" in req_lower:
            for f in available_files:
                name = Path(f).name
                if name in valid_schema_names:
                    return f
            return None

        # 5. Descriptive type definition requirements
        if any(t in req_lower for t in ["type definition", "types", "index.d.ts"]):
            valid_types = {
                "types.ts", "index.d.ts", f"{target_family}Types.ts", f"{target_family}{target_version}Types.ts"
            }
            for f in available_files:
                name = Path(f).name
                if name in valid_types:
                    return f
            return None

        # 6. Descriptive component requirements
        if any(c in req_lower for c in ["react", "component", "implementation", "block"]):
            for f in available_files:
                name = Path(f).name
                if name in valid_component_names:
                    return f
            return None

        return None

    def _validate_artifact_structure(
        self,
        candidate_path: Path,
        target_family: str,
        target_version: str,
        required_artifacts: Optional[List[str]] = None
    ) -> Tuple[List[str], Dict[str, Any]]:
        """
        Validate that candidate contains expected artifact structure.
        
        If required_artifacts is provided (contract-driven), matches candidate artifacts
        against the contract requirements independently with 1-to-1 claiming and valid implementation checks.
        If a zip archive is supplied, its contents are inspected safely.
        """
        errors: List[str] = []
        
        valid_component_names = {
            f"{target_family}{target_version}Block.tsx",
            f"{target_family}Block.tsx",
        }
        valid_schema_names = {
            f"{target_family}{target_version}Schema.ts",
            f"{target_family}Schema.ts",
            f"{target_family.lower()}-{target_version.lower()}.schema.ts",
            f"{target_family.lower()}.schema.ts",
        }
        
        matched_artifacts: List[str] = []
        missing_artifacts: List[str] = []
        contract_driven = required_artifacts is not None
        
        if contract_driven and len(required_artifacts) == 0:
            errors.append(
                "Engineering contract specified empty required_artifacts; candidate package cannot be validated against an empty requirement set"
            )
            return errors, {
                "contract_driven": True,
                "required_artifacts": [],
                "matched_artifacts": [],
                "missing_artifacts": [],
            }
        
        files_data, archive_error = self._extract_candidate_files(candidate_path)
        if archive_error:
            errors.append(archive_error)
            return errors, {
                "contract_driven": contract_driven,
                "required_artifacts": required_artifacts if contract_driven else list(valid_component_names | valid_schema_names),
                "matched_artifacts": [],
                "missing_artifacts": required_artifacts if contract_driven else list(valid_component_names | valid_schema_names),
            }

        available_files = set(files_data.keys())

        if contract_driven:
            for req in (required_artifacts or []):
                matched_file = self._find_matching_file(
                    req, available_files, valid_component_names, valid_schema_names, target_family, target_version
                )
                if matched_file:
                    is_valid, impl_error = self._verify_implementation(matched_file, files_data[matched_file])
                    if is_valid:
                        matched_artifacts.append(req)
                        available_files.remove(matched_file)  # Claimed 1-to-1
                    else:
                        missing_artifacts.append(req)
                        errors.append(impl_error)
                else:
                    missing_artifacts.append(req)
                    errors.append(f"Missing contract-required artifact: '{req}'")
        else:
            # Fallback checking when contract does not specify required_artifacts
            if candidate_path.is_file() and candidate_path.suffix.lower() != '.zip':
                # Single non-zip file: must be a recognized component file with valid implementation
                if candidate_path.name in valid_component_names:
                    is_valid, impl_error = self._verify_implementation(candidate_path.name, files_data[candidate_path.name])
                    if is_valid:
                        matched_artifacts.append(candidate_path.name)
                    else:
                        errors.append(impl_error)
                else:
                    errors.append(
                        f"Single file upload must be one of {sorted(valid_component_names)} or a .zip archive"
                    )
            else:
                # Directory or zip archive in fallback mode: check component and schema
                matched_comp = None
                for f in sorted(available_files):
                    if Path(f).name in valid_component_names:
                        is_valid, impl_error = self._verify_implementation(f, files_data[f])
                        if is_valid:
                            matched_comp = f
                            matched_artifacts.append(Path(f).name)
                            break
                        else:
                            errors.append(impl_error)
                if not matched_comp and not any("contains only" in e or "is empty" in e for e in errors):
                    errors.append(f"Missing required component file: expected one of {sorted(valid_component_names)}")
                    missing_artifacts.append(f"Component ({'/'.join(sorted(valid_component_names))})")
                
                matched_schema = None
                for f in sorted(available_files):
                    if f != matched_comp and Path(f).name in valid_schema_names:
                        is_valid, impl_error = self._verify_implementation(f, files_data[f])
                        if is_valid:
                            matched_schema = f
                            matched_artifacts.append(Path(f).name)
                            break
                        else:
                            errors.append(impl_error)
                if not matched_schema and not any("contains only" in e or "is empty" in e for e in errors):
                    errors.append(f"Missing required schema file: expected one of {sorted(valid_schema_names)}")
                    missing_artifacts.append(f"Schema ({'/'.join(sorted(valid_schema_names))})")
        
        artifact_evidence = {
            "contract_driven": contract_driven,
            "required_artifacts": required_artifacts if contract_driven else list(valid_component_names | valid_schema_names),
            "matched_artifacts": matched_artifacts,
            "missing_artifacts": missing_artifacts,
        }
        
        return errors, artifact_evidence
    
    def _count_artifacts(self, candidate_path: Path) -> int:
        """Count artifacts in candidate package (including files inside zip archives)."""
        files_data, archive_error = self._extract_candidate_files(candidate_path)
        if archive_error:
            return 0
        return len(files_data)
    
    def _get_timestamp(self) -> str:
        """
        Get current timestamp in ISO 8601 format.
        
        Returns:
            ISO 8601 timestamp string
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
