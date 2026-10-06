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
from app.verification.runtime import verify_runtime, RuntimeErrorCode
from app.verification.browser import BrowserVerificationConfig, verify_block_in_browser_sync


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
        
        Delegates to verification/brand.py for comprehensive brand coupling detection.
        
        Scans candidate files for:
        - Hard-coded colors (#xxx, rgb(), rgba(), hsl()) not using CSS variables
        - Hard-coded logos and brand assets
        - Hard-coded brand URLs
        - Hard-coded font-family values
        - Hard-coded brand IDs in code
        - Trademarked brand text in code
        
        Allows:
        - CSS variables (var(--color-primary))
        - Design tokens (theme.colors.primary)
        - Tailwind classes (bg-primary-500)
        - Props/data-driven values
        
        Returns:
            GateExecutionResult with PASS/FAIL status and detailed findings
        """
        from app.verification.brand import verify_brand_independence
        
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Verify each candidate file using dedicated brand verification module
        for candidate_file in candidate_files:
            file_path = self.repository_root / candidate_file
            
            # Use the comprehensive brand verification module
            result = verify_brand_independence(
                file_path=file_path,
                repository_root=self.repository_root,
                snapshot=self.snapshot
            )
            
            # Collect evidence IDs
            evidence_ids.extend(result.evidence_ids)
            
            # If file failed, add specific findings to blockers
            if not result.passed:
                for finding in result.findings:
                    blockers.append(
                        f"{finding.file_path}:{finding.line_number}: "
                        f"{finding.description} - {finding.actual_value[:50]} "
                        f"(Fix: {finding.recommendation})"
                    )
        
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
    
    def execute_theme_compatibility_gate(
        self,
        candidate_blocks: List[str],
        target: str = 'skillhubcore-admin'
    ) -> GateExecutionResult:
        """
        Execute theme compatibility gate.
        
        Verifies blocks render correctly under all supported themes:
        1. Discover theme configurations from repository (SUIA, RTH, domain themes)
        2. For each theme, verify block uses theme context (not hard-coded values)
        3. Verify design token usage (CSS variables)
        4. Detect hard-coded theme-specific colors
        5. [Future: Browser verification under each theme]
        
        Theme discovery sources:
        - packages/ui/src/theme-store.ts (EnterpriseTheme: theme-a, theme-b)
        - apps/skillhubcore-admin/.../brandTheme.ts (BrandTutorialTheme: skillup/SUIA, rth/RTH)
        - apps/realtutorialhub-web/src/lib/domain-themes.ts (DomainTheme: indigo, blue, teal, steel)
        
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        from app.verification.theme import verify_theme_compatibility
        
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get block verification data from snapshot
        blocks_data = self.snapshot.get('blocks', {})
        if not blocks_data:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Theme compatibility unavailable: snapshot contains no block data",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block verification data"]
            )
        
        # Verify theme compatibility for each candidate block
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Perform theme verification
            results = verify_theme_compatibility(
                block_type=block_type,
                snapshot=self.snapshot,
                repository_root=self.repository_root,
                target=target
            )
            
            # Check results for each theme
            for result in results:
                # Collect evidence IDs
                evidence_ids.extend(result.evidence_ids)
                
                # Check for failures
                if not result.passed:
                    if result.error_code:
                        blockers.append(
                            f"{candidate_block} ({result.theme_name}): "
                            f"{result.error_code.value} - {result.error_message}"
                        )
                    else:
                        blockers.append(
                            f"{candidate_block} ({result.theme_name}): {result.error_message}"
                        )
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Theme compatibility failed: {len(blockers)} issue(s) across themes",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Theme compatibility incomplete: no evidence collected",
                evidence_ids=[],
                blockers=["Unable to locate evidence IDs for candidate blocks"]
            )
        
        # Count unique themes verified
        from app.verification.theme import discover_theme_configurations
        themes = discover_theme_configurations(self.repository_root)
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Theme compatibility verified for {len(candidate_blocks)} block(s) across {len(themes)} theme(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_runtime_verification_gate(
        self,
        candidate_blocks: List[str],
        target: str = 'realtutorialhub-admin',
        route: str = '/'
    ) -> GateExecutionResult:
        """
        Execute runtime verification gate.
        
        Verifies blocks at runtime by:
        1. Starting the application (approved toolchain command)
        2. Performing health check
        3. Navigating to target route (via browser verification)
        4. Locating block in DOM
        5. Inspecting data-block-type and data-block-version attributes
        6. Verifying expected content is present
        7. Verifying renderer executed
        8. Capturing console errors
        9. Capturing network errors
        10. Recording evidence with real TS evidence IDs
        11. Stopping application process
        
        SAFETY INVARIANTS:
        - No arbitrary shell execution
        - Approved toolchain operations only (pnpm --filter <target> dev)
        - Process cleanup on completion
        
        Args:
            candidate_blocks: List of block identifiers to verify
            target: Application to start (default: realtutorialhub-admin)
            route: Route to navigate to (default: /)
            
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get block verification data from snapshot
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        if not verified_blocks:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Runtime verification unavailable: snapshot contains no verified blocks",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block verification data"]
            )
        
        # Verify each candidate block at runtime
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Perform runtime verification
            result = verify_runtime(
                block_type=block_type,
                snapshot=self.snapshot,
                repository_root=self.repository_root,
                target=target,
                route=route,
                expected_content={'blockType': block_type}
            )
            
            # Collect evidence IDs
            evidence_ids.extend(result.evidenceIds)
            
            # Check for failures
            if not result.passed:
                if result.error_code:
                    blockers.append(
                        f"{candidate_block}: {result.error_code.value} - {result.error_message}"
                    )
                else:
                    blockers.append(f"{candidate_block}: {result.error_message}")
            
            # Check for console/network errors even if passed
            if result.consoleErrors:
                blockers.append(
                    f"{candidate_block}: {len(result.consoleErrors)} console error(s) detected"
                )
            
            if result.networkErrors:
                blockers.append(
                    f"{candidate_block}: {len(result.networkErrors)} network error(s) detected"
                )
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Runtime verification failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Runtime verification incomplete: no evidence collected",
                evidence_ids=[],
                blockers=["Unable to locate evidence IDs for candidate blocks"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Runtime verification passed for {len(candidate_blocks)} block(s)",
            evidence_ids=evidence_ids,
            blockers=[]
        )
    
    def execute_browser_verification_gate(
        self,
        candidate_blocks: List[str],
        base_url: str = 'http://localhost:3000',
        route: str = '/',
        headless: bool = True
    ) -> GateExecutionResult:
        """
        Execute browser verification gate.
        
        Uses Playwright to verify blocks in a real browser:
        1. Launch browser (headless)
        2. Navigate to target URL
        3. Wait for block to render
        4. Capture DOM state (data-block-type, data-block-version attributes)
        5. Verify expected content present
        6. Capture screenshot as evidence
        7. Record console errors
        8. Record network failures
        
        SAFETY INVARIANTS:
        - Browser runs headless (no GUI)
        - No credentials in evidence output
        - No secrets in screenshot or logs
        - Clean browser shutdown
        
        Args:
            candidate_blocks: List of block identifiers to verify
            base_url: Base URL of application (default: http://localhost:3000)
            route: Route to navigate to (default: /)
            headless: Run browser in headless mode (default: True)
            
        Returns:
            GateExecutionResult with PASS/FAIL/BLOCKED status
        """
        evidence_ids: List[str] = []
        blockers: List[str] = []
        
        # Get block verification data from snapshot
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        if not verified_blocks:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Browser verification unavailable: snapshot contains no verified blocks",
                evidence_ids=[],
                blockers=["Run TypeScript discovery scan to generate block verification data"]
            )
        
        # Create browser config
        config = BrowserVerificationConfig(
            base_url=base_url,
            headless=headless,
            timeout=30000,  # 30 seconds
            screenshot_path=self.repository_root / '.evidence' / 'screenshots',
            viewport_width=1280,
            viewport_height=720
        )
        
        # Ensure screenshot directory exists
        if config.screenshot_path:
            config.screenshot_path.mkdir(parents=True, exist_ok=True)
        
        # Verify each candidate block in browser
        for candidate_block in candidate_blocks:
            block_type = self._extract_block_type(candidate_block)
            
            # Get evidence IDs from snapshot
            block_evidence = next(
                (b for b in verified_blocks if b.get('blockType') == block_type),
                None
            )
            
            if block_evidence and 'evidenceId' in block_evidence:
                evidence_ids.append(block_evidence['evidenceId'])
            
            # Perform browser verification
            result = verify_block_in_browser_sync(
                block_type=block_type,
                route=route,
                expected={'blockType': block_type},
                config=config,
                evidence_ids=evidence_ids
            )
            
            # Check for failures
            if not result.passed:
                if result.error_code:
                    blockers.append(
                        f"{candidate_block}: {result.error_code.value} - {result.error_message}"
                    )
                else:
                    blockers.append(f"{candidate_block}: {result.error_message}")
            
            # Check for console/network errors even if passed
            if result.consoleErrors:
                for error in result.consoleErrors[:3]:  # Limit to first 3
                    blockers.append(f"{candidate_block}: Console error: {error}")
            
            if result.networkErrors:
                for error in result.networkErrors[:3]:  # Limit to first 3
                    blockers.append(f"{candidate_block}: Network error: {error}")
        
        # Determine gate status
        if blockers:
            return GateExecutionResult(
                status=CertificationGateStatus.FAIL,
                message=f"Browser verification failed: {len(blockers)} issue(s) found",
                evidence_ids=evidence_ids,
                blockers=blockers
            )
        
        if not evidence_ids:
            return GateExecutionResult(
                status=CertificationGateStatus.BLOCKED,
                message="Browser verification incomplete: no evidence collected",
                evidence_ids=[],
                blockers=["Unable to locate evidence IDs for candidate blocks"]
            )
        
        return GateExecutionResult(
            status=CertificationGateStatus.PASS,
            message=f"Browser verification passed for {len(candidate_blocks)} block(s)",
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
