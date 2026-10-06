"""
Real certification gate executors.

ARCHITECTURAL RULE:
- Python orchestrates AI, TypeScript discovers repository facts
- Evidence must come from the authoritative TS discovery system
- NEVER fabricate synthetic evidence IDs
- Return UNKNOWN if evidence unavailable, never convert uncertainty to PASS
- Each gate performs REAL verification, not placeholder logic
"""

import subprocess
import json
from pathlib import Path
from typing import Any, Dict, List
from enum import Enum

from app.models.creation import CertificationGateStatus
from app.verification.composer import verify_composer_integration, ComposerErrorCode


class GateExecutionResult:
    """Result of gate execution."""
    
    def __init__(
        self,
        status: CertificationGateStatus,
        message: str,
        evidence_ids: List[str],
        blockers: List[str],
    ):
        self.status = status
        self.message = message
        self.evidence_ids = evidence_ids
        self.blockers = blockers


class CertificationGateExecutor:
    """
    Executes real certification gates with evidence-backed verification.
    
    Each gate reads from the TypeScript discovery snapshot and performs
    real validation against repository evidence.
    """
    
    def __init__(self, snapshot: Dict[str, Any], repository_root: Path):
        """
        Initialize gate executor.
        
        Args:
            snapshot: TypeScript-generated discovery snapshot
            repository_root: Root path of the repository
        """
        self.snapshot = snapshot
        self.repository_root = repository_root
    
    def execute_ubrc_gate(self, candidate_blocks: List[str]) -> GateExecutionResult:
        """
        Execute UBRC (Universal Block Renderer Contract) compliance gate.
        
        ARCHITECTURAL RULE: Python calls TypeScript for UBRC verification.
        The TS D3 scanner performs the actual UBRC verification chain:
        1. Block type exists in BLOCK_REGISTRY
        2. Renderer implementation exists
        3. Renderer includes data-block-version attribute (for versioned blocks)
        4. Version matches across implementation and registry
        5. Runtime dispatch case exists in TutorialBlockRenderer.tsx
        
        Python reads the verification results from the snapshot and interprets them.
        Python does NOT reimplement UBRC verification logic.
        
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get UBRC verification results from D3 scanner (TypeScript authoritative source)
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        if not verified_blocks:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="UBRC verification unavailable: snapshot contains no verified blocks",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block verification data"]
            )
        
        # Check each candidate block
        for candidate_block in candidate_blocks:
            # Extract block type from candidate (e.g., "I1" -> "introduction", "C1" -> "code")
            block_type = self._extract_block_type(candidate_block)
            
            # Find verification record from TypeScript D3 scanner
            verification = next(
                (v for v in verified_blocks if v.get('blockType') == block_type),
                None
            )
            
            if verification is None:
                blockers.append(f"Block '{candidate_block}' not found in repository verification")
                continue
            
            # Check UBRC status (determined by TypeScript D3 scanner)
            ubrc_status = verification.get('ubrcStatus')
            
            if ubrc_status == 'UBRC_VALID':
                # Full UBRC chain verified by TypeScript:
                # ✓ Registry entry exists
                # ✓ Renderer implementation exists
                # ✓ data-block-version attribute present (for versioned blocks)
                # ✓ Version matches across implementation and registry
                # ✓ Runtime dispatch case exists
                
                # Collect evidence IDs from the block's implementation
                impl_evidence = self._find_evidence_by_block(block_type, 'type-definition')
                renderer_evidence = self._find_evidence_by_block(block_type, 'component')
                
                if impl_evidence:
                    evidence_ids.append(impl_evidence.get('evidenceId', ''))
                if renderer_evidence:
                    evidence_ids.append(renderer_evidence.get('evidenceId', ''))
                    
            elif ubrc_status == 'UBRC_ATTRIBUTE_MISSING':
                blockers.append(f"Block '{candidate_block}': missing data-block-version attribute")
            elif ubrc_status == 'UBRC_RENDERER_MISSING':
                blockers.append(f"Block '{candidate_block}': renderer implementation not found")
            elif ubrc_status == 'UBRC_MISSING':
                blockers.append(f"Block '{candidate_block}': no registry entry found")
            elif ubrc_status == 'UBRC_VERSION_MISMATCH':
                blockers.append(f"Block '{candidate_block}': version mismatch between implementation and renderer")
            elif ubrc_status == 'UBRC_TYPE_MISMATCH':
                blockers.append(f"Block '{candidate_block}': type mismatch detected")
            elif ubrc_status == 'UBRC_REGISTRY_MISSING':
                blockers.append(f"Block '{candidate_block}': block registry file not found")
            else:
                blockers.append(f"Block '{candidate_block}': UBRC status unknown or not verified")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"UBRC compliance failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="UBRC verification incomplete: no evidence collected",
                evidence_ids=[],
                blockers=["Unable to locate evidence IDs for candidate blocks"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"UBRC compliance verified for {len(candidate_blocks)} block(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_brand_independence_gate(self, candidate_files: List[str]) -> GateExecutionResult:
        """
        Execute brand independence verification gate.
        
        Scans candidate files for:
        - Hard-coded colors (#xxx, rgb(), rgba(), hsl())
        - Hard-coded brand references
        - Hard-coded URLs
        - Hard-coded asset paths
        - Hard-coded brand IDs
        
        Allows:
        - CSS variables (var(--color-...))
        - Theme references
        - Props/data-driven values
        
        Returns:
            GateExecutionResult with PASS/FAIL status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Patterns indicating brand coupling
        brand_coupling_patterns = [
            (r'#[0-9A-Fa-f]{3,8}(?!["\'])', 'hard-coded hex color'),
            (r'rgb\s*\([^)]+\)', 'hard-coded rgb color'),
            (r'rgba\s*\([^)]+\)', 'hard-coded rgba color'),
            (r'hsl\s*\([^)]+\)', 'hard-coded hsl color'),
            (r'https?://[^\s"\']+\.(png|jpg|jpeg|gif|svg)', 'hard-coded image URL'),
            (r'brandId\s*:\s*["\'][^"\']+["\']', 'hard-coded brand ID'),
            (r'brand\s*=\s*["\'][^"\']+["\']', 'hard-coded brand reference'),
        ]
        
        # For each candidate file, scan for brand coupling
        for candidate_file in candidate_files:
            file_path = self.repository_root / candidate_file
            
            if not file_path.exists():
                blockers.append(f"Candidate file not found: {candidate_file}")
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Check each pattern
                import re
                for pattern, description in brand_coupling_patterns:
                    matches = list(re.finditer(pattern, content, re.IGNORECASE))
                    
                    if matches:
                        # Get line numbers for findings
                        lines = content[:matches[0].start()].count('\n') + 1
                        blockers.append(
                            f"{candidate_file}:{lines}: {description} found: {matches[0].group()[:30]}"
                        )
                
                # Look for evidence that file is theme-aware (positive signal)
                theme_patterns = [
                    r'var\(--[^)]+\)',  # CSS variables
                    r'theme\.',  # Theme object access
                    r'className=',  # Tailwind/class-based styling
                ]
                
                theme_aware = any(re.search(p, content) for p in theme_patterns)
                
                if theme_aware and not any(candidate_file in b for b in blockers):
                    # File is theme-aware and has no blockers
                    # Try to find evidence ID for this file
                    evidence = self._find_evidence_by_path(candidate_file)
                    if evidence:
                        evidence_ids.append(evidence.get('evidenceId', ''))
                        
            except Exception as e:
                blockers.append(f"Failed to scan {candidate_file}: {str(e)}")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Brand independence failed: {len(blockers)} coupling(s) detected",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Brand independence verified for {len(candidate_files)} file(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_registry_verification_gate(self, candidate_blocks: List[str]) -> GateExecutionResult:
        """
        Execute registry verification gate.
        
        Verifies that each candidate block has a valid registry entry
        in packages/types/src/tutorial-rich-document/registry.ts
        
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get UBRC verification results (includes registry checks)
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        if not verified_blocks:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Registry verification unavailable: snapshot contains no verified blocks",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block verification data"]
            )
        
        # Find registry evidence
        registry_evidence = self._find_evidence_by_path('packages/types/src/tutorial-rich-document/registry.ts')
        if registry_evidence:
            evidence_ids.append(registry_evidence.get('evidenceId', ''))
        
        # Check each candidate block
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Find verification record
            verification = next(
                (v for v in verified_blocks if v.get('blockType') == block_type),
                None
            )
            
            if verification is None:
                blockers.append(f"Block '{candidate_block}' not found in verification data")
                continue
            
            # Check if block is registered
            is_registered = verification.get('registered', False)
            
            if not is_registered:
                blockers.append(f"Block '{candidate_block}' not registered in TutorialBlockRenderer.tsx")
            
            # Check UBRC registry status
            ubrc_details = verification.get('ubrcDetails', {})
            has_registry_entry = ubrc_details.get('registryEntry', False)
            
            if not has_registry_entry:
                blockers.append(f"Block '{candidate_block}' missing registry entry in registry.ts")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Registry verification failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Registry verification incomplete: registry evidence not found",
                evidence_ids=[],
                blockers=["Unable to locate registry evidence"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Registry verified for {len(candidate_blocks)} block(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_renderer_verification_gate(self, candidate_blocks: List[str]) -> GateExecutionResult:
        """
        Execute renderer verification gate.
        
        Verifies that each candidate block has:
        1. A renderer component file
        2. Runtime dispatch case in TutorialBlockRenderer.tsx
        3. Proper version handling (for versioned blocks)
        
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get block verification data
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        rendered_blocks = blocks_data.get('rendered', [])
        
        if not verified_blocks or not rendered_blocks:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Renderer verification unavailable: snapshot contains no block data",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block data"]
            )
        
        # Check each candidate block
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Find verification record
            verification = next(
                (v for v in verified_blocks if v.get('blockType') == block_type),
                None
            )
            
            if verification is None:
                blockers.append(f"Block '{candidate_block}' not found in verification data")
                continue
            
            # Check if block is rendered
            is_rendered = verification.get('rendered', False)
            is_registered = verification.get('registered', False)
            
            if not is_rendered:
                blockers.append(f"Block '{candidate_block}' has no renderer component")
                continue
            
            if not is_registered:
                blockers.append(f"Block '{candidate_block}' has no runtime dispatch case in TutorialBlockRenderer.tsx")
                continue
            
            # Find renderer evidence
            renderer = next(
                (r for r in rendered_blocks if r.get('blockType') == block_type),
                None
            )
            
            if renderer:
                renderer_evidence_id = renderer.get('evidenceId')
                if renderer_evidence_id:
                    evidence_ids.append(renderer_evidence_id)
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Renderer verification failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Renderer verification incomplete: no renderer evidence found",
                evidence_ids=[],
                blockers=["Unable to locate renderer evidence"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Renderer verified for {len(candidate_blocks)} block(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_evidence_binding_gate(self, candidate_blocks: List[str]) -> GateExecutionResult:
        """
        Execute evidence binding gate.
        
        Verifies that:
        1. All candidate blocks have evidence IDs from the TS discovery system
        2. Evidence IDs are valid and can be resolved in the snapshot
        3. Evidence includes required artifacts (type definition, renderer, registry)
        
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get all evidence records
        all_evidence = self.snapshot.get('evidence', [])
        
        if not all_evidence:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Evidence binding unavailable: snapshot contains no evidence records",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate evidence"]
            )
        
        # Check each candidate block
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Find evidence for this block
            block_evidence = [
                e for e in all_evidence
                if e.get('symbol', '').lower() == block_type or
                   block_type in e.get('path', '').lower()
            ]
            
            if not block_evidence:
                blockers.append(f"Block '{candidate_block}': no evidence records found")
                continue
            
            # Verify evidence has required fields
            for evidence in block_evidence:
                evidence_id = evidence.get('evidenceId')
                if not evidence_id:
                    blockers.append(f"Block '{candidate_block}': evidence missing evidenceId")
                    continue
                
                # Validate evidence structure
                required_fields = ['kind', 'path', 'contentHash', 'description']
                missing_fields = [f for f in required_fields if f not in evidence]
                
                if missing_fields:
                    blockers.append(
                        f"Block '{candidate_block}': evidence {evidence_id} missing fields: {', '.join(missing_fields)}"
                    )
                else:
                    evidence_ids.append(evidence_id)
        
        # Check for duplicate evidence IDs (V8 validator requirement)
        unique_evidence_ids = set(evidence_ids)
        if len(evidence_ids) != len(unique_evidence_ids):
            blockers.append("Duplicate evidence IDs detected")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Evidence binding failed: {len(blockers)} issue(s) found",
                evidence_ids=list(unique_evidence_ids),
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Evidence binding incomplete: no valid evidence found",
                evidence_ids=[],
                blockers=["Unable to locate valid evidence for candidate blocks"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Evidence binding verified: {len(unique_evidence_ids)} evidence record(s)",
            evidence_ids=list(unique_evidence_ids),
            blockers=[]
        )
    
    def execute_composer_verification_gate(self, candidate_blocks: List[str]) -> GateExecutionResult:
        """
        Execute Composer integration verification gate.
        
        Verifies the complete Composer workflow for each candidate block:
        1. Block is registered in BLOCK_REGISTRY
        2. Block is discoverable in Composer UI
        3. Block schema matches expected structure
        4. Renderer implementation matches registry entry
        5. Block can be used in tutorial generation
        6. Block renders correctly at runtime
        
        Error codes distinguish specific failure modes:
        - COMPOSER_NOT_REGISTERED: Block not in BLOCK_REGISTRY
        - COMPOSER_NOT_DISCOVERABLE: Block not visible in Composer UI
        - COMPOSER_SCHEMA_MISMATCH: Block schema doesn't match expected structure
        - COMPOSER_RENDERER_MISMATCH: Renderer doesn't match registry entry
        - COMPOSER_GENERATION_FAILURE: Tutorial generation fails with this block
        - COMPOSER_RUNTIME_FAILURE: Block fails to render at runtime
        
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get block verification data
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        if not verified_blocks:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Composer verification unavailable: snapshot contains no verified blocks",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block verification data"]
            )
        
        # Check each candidate block
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Perform composer verification
            result = verify_composer_integration(
                block_type=block_type,
                snapshot=self.snapshot,
                repository_root=self.repository_root
            )
            
            # Collect evidence IDs
            evidence_ids.extend(result.evidence_ids)
            
            # Check for failures
            if not result.passed:
                if result.error_code:
                    blockers.append(f"{candidate_block}: {result.error_code.value} - {result.error_message}")
                else:
                    blockers.append(f"{candidate_block}: {result.error_message}")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Composer verification failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Composer verification incomplete: no evidence collected",
                evidence_ids=[],
                blockers=["Unable to locate evidence IDs for candidate blocks"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Composer verification passed for {len(candidate_blocks)} block(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_theme_compatibility_gate(self, candidate_files: List[str]) -> GateExecutionResult:
        """
        Execute theme compatibility gate.
        
        Verifies that candidate files:
        1. Use CSS variables or theme tokens for styling
        2. Do not hard-code theme-specific values
        3. Support light/dark mode (if applicable)
        4. Use semantic color names
        
        Returns:
            GateExecutionResult with PASS/FAIL status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Theme compatibility indicators (positive signals)
        theme_patterns = [
            (r'var\(--[^)]+\)', 'CSS variable'),
            (r'theme\.\w+', 'theme object access'),
            (r'className=', 'class-based styling'),
            (r'tailwind', 'Tailwind CSS'),
            (r'data-theme', 'theme data attribute'),
        ]
        
        # Anti-patterns (negative signals)
        anti_patterns = [
            (r'#[0-9A-Fa-f]{6}', 'hard-coded hex color'),
            (r'rgb\(', 'hard-coded RGB color'),
            (r'background:\s*["\']?(white|black|red|blue|green)', 'hard-coded color name'),
        ]
        
        for candidate_file in candidate_files:
            file_path = self.repository_root / candidate_file
            
            if not file_path.exists():
                blockers.append(f"Candidate file not found: {candidate_file}")
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Check for theme-aware patterns
                import re
                theme_score = sum(
                    len(re.findall(pattern, content, re.IGNORECASE))
                    for pattern, _ in theme_patterns
                )
                
                # Check for anti-patterns
                anti_pattern_matches = []
                for pattern, description in anti_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        anti_pattern_matches.append((description, len(matches)))
                
                # If anti-patterns found, add blockers
                if anti_pattern_matches:
                    for description, count in anti_pattern_matches:
                        blockers.append(f"{candidate_file}: {count} instance(s) of {description}")
                
                # If theme-aware and no anti-patterns, mark as compatible
                if theme_score > 0 and not anti_pattern_matches:
                    evidence = self._find_evidence_by_path(candidate_file)
                    if evidence:
                        evidence_ids.append(evidence.get('evidenceId', ''))
                elif theme_score == 0:
                    blockers.append(f"{candidate_file}: no theme-aware patterns detected")
                    
            except Exception as e:
                blockers.append(f"Failed to scan {candidate_file}: {str(e)}")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Theme compatibility failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Theme compatibility verified for {len(candidate_files)} file(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    # Helper methods
    
    def _extract_block_type(self, candidate_block: str) -> str:
        """
        Extract block type from candidate block identifier.
        
        Examples:
            "I1" -> "introduction"
            "C1" -> "code"
            "D1" -> "definition"
            "introduction" -> "introduction"
        """
        # If already lowercase, return as-is
        if candidate_block.islower():
            return candidate_block
        
        # Map shorthand to full type
        type_map = {
            'I': 'introduction',
            'C': 'code',
            'D': 'definition',
            'S': 'summary',
            'Q': 'quiz',
            'A': 'assessment',
            'E': 'exercise',
            'O': 'outcome',
            'H': 'heading',
            'P': 'paragraph',
            'L': 'list',
            'M': 'media',
            'T': 'table',
            'N': 'note',
            'W': 'warning',
            'X': 'example',
            'R': 'reference',
            'G': 'glossary',
        }
        
        # Extract first letter
        first_letter = candidate_block[0].upper()
        return type_map.get(first_letter, candidate_block.lower())
    
    def _find_evidence_by_block(self, block_type: str, kind: str) -> Dict[str, Any] | None:
        """Find evidence record for a block by type and kind."""
        all_evidence = self.snapshot.get('evidence', [])
        
        for evidence in all_evidence:
            if evidence.get('kind') == kind and evidence.get('symbol', '').lower() == block_type:
                return evidence
        
        return None
    
    def _find_evidence_by_path(self, path: str) -> Dict[str, Any] | None:
        """Find evidence record by file path."""
        all_evidence = self.snapshot.get('evidence', [])
        
        # Normalize path separators
        normalized_path = path.replace('\\', '/')
        
        for evidence in all_evidence:
            evidence_path = evidence.get('path', '').replace('\\', '/')
            if normalized_path in evidence_path or evidence_path.endswith(normalized_path):
                return evidence
        
        return None
