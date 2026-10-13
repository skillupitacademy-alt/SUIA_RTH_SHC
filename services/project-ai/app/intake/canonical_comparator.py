"""
Canonical Comparator - M2.9 Wave 3 Phase 2B

Compares candidate implementation against canonical reference blocks.

COMPARISON DIMENSIONS:
- Structural differences: missing/extra files vs canonical manifest
- API changes: exports present in canonical but absent in candidate
- Breaking changes: type signature differences (detectable from AST/regex)
- UBRC/ILS/Theme deviations: scan for deviation markers

ARCHITECTURAL BOUNDARIES:
- Canonical reference comes from TypeScript snapshot contract (never scan repo)
- Evidence must be populated (never empty dict on success)
- Breaking changes detected via simple heuristics (full AST analysis is Wave 4)
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Any, List, Optional


@dataclass
class ComparisonReport:
    """
    Result of canonical comparison.
    
    Evidence dict must be populated with file counts and checked paths.
    """
    has_breaking_changes: bool
    structural_diffs: List[Dict[str, Any]] = field(default_factory=list)
    api_changes: List[Dict[str, Any]] = field(default_factory=list)
    deviations: List[Dict[str, Any]] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)
    canonical_sha256: str = ""


class CanonicalComparator:
    """
    Compares candidate implementation against canonical reference blocks.
    
    Uses TypeScript snapshot contract to identify canonical blocks and their expected structure.
    """
    
    def __init__(self):
        """Initialize canonical comparator."""
        pass
    
    def compare(
        self,
        candidate_path: str,
        canonical_ref: Dict[str, Any]
    ) -> ComparisonReport:
        """
        Compare candidate against canonical reference.
        
        Args:
            candidate_path: Absolute path to candidate package
            canonical_ref: Canonical reference from TypeScript snapshot contract
                Expected structure:
                {
                    "family": "Introduction",
                    "version": "I6",  # Latest canonical version
                    "evidence": [
                        {
                            "path": "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx",
                            "sha256": "abc123...",
                            "role": "canonical_block"
                        }
                    ],
                    "required_exports": ["IntroductionBlock", "IntroductionSchema"],
                    "ubrc_markers": ["runtimeContext", "theme", "ils"],
                    "theme_markers": ["theme.primary", "theme.secondary"]
                }
                
        Returns:
            ComparisonReport with structural diffs, API changes, deviations
        """
        structural_diffs: List[Dict[str, Any]] = []
        api_changes: List[Dict[str, Any]] = []
        deviations: List[Dict[str, Any]] = []
        evidence: Dict[str, Any] = {}
        has_breaking_changes = False
        
        # Extract canonical reference data
        canonical_family = canonical_ref.get("family", "")
        canonical_version = canonical_ref.get("version", "")
        canonical_evidence = canonical_ref.get("evidence", [])
        required_exports = canonical_ref.get("required_exports", [])
        ubrc_markers = canonical_ref.get("ubrc_markers", [])
        theme_markers = canonical_ref.get("theme_markers", [])
        
        # Get canonical SHA-256 (first evidence entry)
        canonical_sha256 = ""
        if canonical_evidence:
            canonical_sha256 = canonical_evidence[0].get("sha256", "")
        
        # Load candidate files
        candidate_path_obj = Path(candidate_path)
        if not candidate_path_obj.exists():
            return ComparisonReport(
                has_breaking_changes=True,
                structural_diffs=[{"error": f"Candidate path not found: {candidate_path}"}],
                api_changes=[],
                deviations=[],
                evidence={"error": "candidate_not_found"},
                canonical_sha256=canonical_sha256
            )
        
        # Collect candidate files
        candidate_files = self._collect_candidate_files(candidate_path_obj)
        
        # Check structural differences
        structural_diffs = self._check_structural_diffs(
            candidate_files,
            canonical_family,
            canonical_version,
            canonical_evidence
        )
        
        # Check API changes (exports)
        api_changes = self._check_api_changes(
            candidate_files,
            required_exports,
            canonical_family,
            canonical_version
        )
        
        # Check for breaking changes in API
        if api_changes:
            has_breaking_changes = any(
                change.get("severity") == "breaking"
                for change in api_changes
            )
        
        # Check for UBRC/Theme deviations
        deviations = self._check_deviations(
            candidate_files,
            ubrc_markers,
            theme_markers
        )
        
        # Build evidence
        evidence = {
            "candidate_file_count": len(candidate_files),
            "canonical_file_count": len(canonical_evidence),
            "candidate_files": [str(f) for f in candidate_files],
            "checked_exports": required_exports,
            "checked_ubrc_markers": ubrc_markers,
            "checked_theme_markers": theme_markers,
            "structural_diff_count": len(structural_diffs),
            "api_change_count": len(api_changes),
            "deviation_count": len(deviations),
            "comparison_timestamp": self._get_timestamp(),
        }
        
        return ComparisonReport(
            has_breaking_changes=has_breaking_changes,
            structural_diffs=structural_diffs,
            api_changes=api_changes,
            deviations=deviations,
            evidence=evidence,
            canonical_sha256=canonical_sha256
        )
    
    def _collect_candidate_files(self, candidate_path: Path) -> List[Path]:
        """
        Collect all files in candidate package.
        
        Args:
            candidate_path: Path to candidate package
            
        Returns:
            List of file paths
        """
        if candidate_path.is_file():
            return [candidate_path]
        elif candidate_path.is_dir():
            return [f for f in candidate_path.rglob("*") if f.is_file()]
        return []
    
    def _check_structural_diffs(
        self,
        candidate_files: List[Path],
        canonical_family: str,
        canonical_version: str,
        canonical_evidence: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Check for structural differences between candidate and canonical.
        
        Args:
            candidate_files: List of candidate file paths
            canonical_family: Canonical block family
            canonical_version: Canonical block version
            canonical_evidence: Canonical evidence from snapshot
            
        Returns:
            List of structural differences
        """
        diffs: List[Dict[str, Any]] = []
        
        # Expected file patterns
        expected_files = {
            f"{canonical_family}{canonical_version}Block.tsx",
            f"{canonical_family}{canonical_version}Schema.ts",
        }
        
        # Check for missing files
        candidate_file_names = {f.name for f in candidate_files}
        
        for expected in expected_files:
            if expected not in candidate_file_names:
                diffs.append({
                    "type": "missing_file",
                    "file": expected,
                    "severity": "warning",
                    "description": f"Expected file not found: {expected}"
                })
        
        # Check for extra files (informational, not a blocker)
        extra_files = candidate_file_names - expected_files
        if extra_files:
            diffs.append({
                "type": "extra_files",
                "files": list(extra_files),
                "severity": "info",
                "description": f"Candidate includes {len(extra_files)} additional files"
            })
        
        return diffs
    
    def _check_api_changes(
        self,
        candidate_files: List[Path],
        required_exports: List[str],
        canonical_family: str,
        canonical_version: str
    ) -> List[Dict[str, Any]]:
        """
        Check for API changes (missing or modified exports).
        
        Args:
            candidate_files: List of candidate file paths
            required_exports: List of required export names
            canonical_family: Canonical block family
            canonical_version: Canonical block version
            
        Returns:
            List of API changes
        """
        changes: List[Dict[str, Any]] = []
        
        # Check exports in all TypeScript files (component and schema)
        tsx_ts_files = [f for f in candidate_files if f.suffix in [".tsx", ".ts"]]
        
        if not tsx_ts_files:
            # No TypeScript files found
            for export_name in required_exports:
                changes.append({
                    "type": "missing_export",
                    "export": export_name,
                    "severity": "breaking",
                    "description": f"Required export '{export_name}' not found (no TypeScript files)"
                })
            return changes
        
        # Read all TypeScript content
        all_content = ""
        for ts_file in tsx_ts_files:
            try:
                with open(ts_file, "r", encoding="utf-8") as f:
                    all_content += f.read() + "\n"
            except Exception as e:
                changes.append({
                    "type": "read_error",
                    "file": str(ts_file),
                    "severity": "error",
                    "description": f"Failed to read file: {str(e)}"
                })
        
        # Check for required exports (simple regex check)
        for export_name in required_exports:
            # Pattern: export (default)? (function|const|class) ExportName
            pattern = rf"export\s+(default\s+)?(function|const|class|interface|type)\s+{export_name}\b"
            if not re.search(pattern, all_content):
                changes.append({
                    "type": "missing_export",
                    "export": export_name,
                    "severity": "breaking",
                    "description": f"Required export '{export_name}' not found in candidate"
                })
        
        return changes
    
    def _check_deviations(
        self,
        candidate_files: List[Path],
        ubrc_markers: List[str],
        theme_markers: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Check for UBRC/ILS/Theme deviations.
        
        Args:
            candidate_files: List of candidate file paths
            ubrc_markers: Expected UBRC markers (e.g., "runtimeContext", "ils")
            theme_markers: Expected theme markers (e.g., "theme.primary")
            
        Returns:
            List of deviations
        """
        deviations: List[Dict[str, Any]] = []
        
        # Read all .tsx and .ts files
        tsx_files = [f for f in candidate_files if f.suffix in [".tsx", ".ts"]]
        
        all_content = ""
        for tsx_file in tsx_files:
            try:
                with open(tsx_file, "r", encoding="utf-8") as f:
                    all_content += f.read() + "\n"
            except Exception:
                # Skip unreadable files
                pass
        
        # Check for UBRC markers
        for marker in ubrc_markers:
            if marker not in all_content:
                deviations.append({
                    "type": "missing_ubrc_marker",
                    "marker": marker,
                    "severity": "warning",
                    "description": f"UBRC marker '{marker}' not found in candidate"
                })
        
        # Check for theme markers
        for marker in theme_markers:
            if marker not in all_content:
                deviations.append({
                    "type": "missing_theme_marker",
                    "marker": marker,
                    "severity": "warning",
                    "description": f"Theme marker '{marker}' not found in candidate"
                })
        
        # Check for hardcoded brand markers (deviation indicators)
        brand_markers = [
            "TutorialHub",
            "tutorialhub",
            "RealTutorialHub",
            "tutorial-hub-brand"
        ]
        
        for brand_marker in brand_markers:
            if brand_marker in all_content:
                deviations.append({
                    "type": "hardcoded_brand",
                    "marker": brand_marker,
                    "severity": "error",
                    "description": f"Hardcoded brand marker '{brand_marker}' found (violates brand independence)"
                })
        
        return deviations
    
    def _get_timestamp(self) -> str:
        """
        Get current timestamp in ISO 8601 format.
        
        Returns:
            ISO 8601 timestamp string
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
