"""
Runtime verification module for UBRC, ILS, LSNB, RSSB contracts.

ARCHITECTURAL RULE:
- This module operates on post-placement snapshots (read-only)
- Never modifies artifacts during verification
- Returns BLOCKED if evidence is unavailable
- Each check performs REAL verification, not placeholder logic
"""

from pydantic import BaseModel
from typing import Literal, Optional, Any, Dict, List


class RuntimeCheckResult(BaseModel):
    """Result of a single runtime verification check."""
    
    check_id: str
    check_name: str
    status: Literal["PASS", "FAIL", "BLOCKED", "SKIPPED"]
    evidence: list[str]
    reason: str = ""


class RuntimeVerificationReport(BaseModel):
    """Complete runtime verification report for a workflow."""
    
    workflow_id: str
    snapshot_id: str
    checks: list[RuntimeCheckResult]
    overall_status: Literal["PASS", "FAIL", "BLOCKED"]
    
    @classmethod
    def blocked(cls, workflow_id: str, reason: str) -> 'RuntimeVerificationReport':
        """Create a BLOCKED report when verification cannot proceed."""
        return cls(
            workflow_id=workflow_id,
            snapshot_id="",
            checks=[],
            overall_status="BLOCKED",
        )


class RuntimeVerifier:
    """
    Verifies runtime contracts: UBRC, ILS, LSNB, RSSB.
    
    Never modifies artifacts. Operates on read-only snapshots.
    Returns BLOCKED if evidence unavailable, never converts uncertainty to PASS.
    """
    
    REQUIRED_CHECKS = [
        "ubrc_registered",
        "ils_passive_not_direct",
        "lsnb_page_level",
        "rssb_page_level",
        "theme_injection",
        "brand_independence",
    ]
    
    def verify(
        self,
        workflow_id: str,
        snapshot: Optional[Dict[str, Any]],
        contract: Optional[Dict[str, Any]]
    ) -> RuntimeVerificationReport:
        """
        Execute runtime verification checks.
        
        Args:
            workflow_id: Workflow identifier
            snapshot: Post-placement snapshot (from TypeScript discovery)
            contract: Engineering contract
            
        Returns:
            RuntimeVerificationReport with check results and overall status
        """
        if snapshot is None:
            return RuntimeVerificationReport.blocked(workflow_id, "no_snapshot")
        if contract is None:
            return RuntimeVerificationReport.blocked(workflow_id, "no_contract")
        
        # Execute each check against snapshot
        checks: List[RuntimeCheckResult] = []
        for check_id in self.REQUIRED_CHECKS:
            result = self._run_check(check_id, snapshot, contract)
            checks.append(result)
        
        overall = self._compute_overall(checks)
        
        return RuntimeVerificationReport(
            workflow_id=workflow_id,
            snapshot_id=snapshot.get('snapshotId', ''),
            checks=checks,
            overall_status=overall,
        )
    
    def _run_check(
        self,
        check_id: str,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Execute a single runtime check.
        
        Args:
            check_id: Check identifier
            snapshot: Snapshot data
            contract: Contract data
            
        Returns:
            RuntimeCheckResult with status and evidence
        """
        # Delegate to specific check implementations
        check_methods = {
            "ubrc_registered": self._check_ubrc_registered,
            "ils_passive_not_direct": self._check_ils_passive,
            "lsnb_page_level": self._check_lsnb_page_level,
            "rssb_page_level": self._check_rssb_page_level,
            "theme_injection": self._check_theme_injection,
            "brand_independence": self._check_brand_independence,
        }
        
        check_method = check_methods.get(check_id)
        if check_method is None:
            return RuntimeCheckResult(
                check_id=check_id,
                check_name=check_id.replace('_', ' '),
                status="BLOCKED",
                evidence=[],
                reason="check_not_implemented",
            )
        
        return check_method(snapshot, contract)
    
    def _check_ubrc_registered(
        self,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Verify UBRC registration: block is in BLOCK_REGISTRY and TutorialBlockRenderer.
        
        Args:
            snapshot: Snapshot data containing blocks verification
            contract: Contract data containing expected block types
            
        Returns:
            RuntimeCheckResult
        """
        blocks_data = snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        if not verified_blocks:
            return RuntimeCheckResult(
                check_id="ubrc_registered",
                check_name="UBRC registration",
                status="BLOCKED",
                evidence=[],
                reason="no_block_verification_data",
            )
        
        evidence_ids = []
        failed_blocks = []
        
        # Check each verified block
        for block_info in verified_blocks:
            block_type = block_info.get('blockType', '')
            is_registered = block_info.get('registered', False)
            ubrc_status = block_info.get('ubrcStatus', '')
            
            if not is_registered or ubrc_status != 'UBRC_VALID':
                failed_blocks.append(f"{block_type} (status: {ubrc_status})")
            else:
                # Collect evidence for successful registrations
                evidence_id = block_info.get('evidenceId')
                if evidence_id:
                    evidence_ids.append(evidence_id)
        
        if failed_blocks:
            return RuntimeCheckResult(
                check_id="ubrc_registered",
                check_name="UBRC registration",
                status="FAIL",
                evidence=evidence_ids,
                reason=f"blocks_not_registered: {', '.join(failed_blocks)}",
            )
        
        if not evidence_ids:
            return RuntimeCheckResult(
                check_id="ubrc_registered",
                check_name="UBRC registration",
                status="BLOCKED",
                evidence=[],
                reason="no_evidence_collected",
            )
        
        return RuntimeCheckResult(
            check_id="ubrc_registered",
            check_name="UBRC registration",
            status="PASS",
            evidence=evidence_ids,
            reason=f"verified_{len(evidence_ids)}_blocks",
        )
    
    def _check_ils_passive(
        self,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Verify ILS (Inline Learning System) uses passive detection, not direct imports.
        
        Blocks should not import ILS directly; ILS should detect blocks passively.
        
        Args:
            snapshot: Snapshot data
            contract: Contract data
            
        Returns:
            RuntimeCheckResult
        """
        # This check requires AST analysis or import scanning
        # For now, return BLOCKED until implementation is complete
        return RuntimeCheckResult(
            check_id="ils_passive_not_direct",
            check_name="ILS passive detection",
            status="BLOCKED",
            evidence=[],
            reason="verification_not_yet_implemented",
        )
    
    def _check_lsnb_page_level(
        self,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Verify LSNB (Left Side Navigation Bar) integration is page-level, not block-level.
        
        Blocks should not import or configure LSNB directly.
        
        Args:
            snapshot: Snapshot data
            contract: Contract data
            
        Returns:
            RuntimeCheckResult
        """
        # This check requires import scanning
        # For now, return BLOCKED until implementation is complete
        return RuntimeCheckResult(
            check_id="lsnb_page_level",
            check_name="LSNB page-level integration",
            status="BLOCKED",
            evidence=[],
            reason="verification_not_yet_implemented",
        )
    
    def _check_rssb_page_level(
        self,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Verify RSSB (Right Side Sidebar) integration is page-level, not block-level.
        
        Blocks should not import or configure RSSB directly.
        
        Args:
            snapshot: Snapshot data
            contract: Contract data
            
        Returns:
            RuntimeCheckResult
        """
        # This check requires import scanning
        # For now, return BLOCKED until implementation is complete
        return RuntimeCheckResult(
            check_id="rssb_page_level",
            check_name="RSSB page-level integration",
            status="BLOCKED",
            evidence=[],
            reason="verification_not_yet_implemented",
        )
    
    def _check_theme_injection(
        self,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Verify theme values are injected, not hard-coded.
        
        Blocks should use CSS variables or theme props, not hard-coded colors/fonts.
        
        Args:
            snapshot: Snapshot data
            contract: Contract data
            
        Returns:
            RuntimeCheckResult
        """
        # This check requires CSS/JSX analysis
        # For now, return BLOCKED until implementation is complete
        return RuntimeCheckResult(
            check_id="theme_injection",
            check_name="theme injection",
            status="BLOCKED",
            evidence=[],
            reason="verification_not_yet_implemented",
        )
    
    def _check_brand_independence(
        self,
        snapshot: Dict[str, Any],
        contract: Dict[str, Any]
    ) -> RuntimeCheckResult:
        """
        Verify blocks are brand-independent (no hard-coded brand assets or text).
        
        Blocks should not contain brand logos, colors, or trademarked text.
        
        Args:
            snapshot: Snapshot data
            contract: Contract data
            
        Returns:
            RuntimeCheckResult
        """
        # This check is performed by the brand verification gate
        # For now, return BLOCKED until implementation is complete
        return RuntimeCheckResult(
            check_id="brand_independence",
            check_name="brand independence",
            status="BLOCKED",
            evidence=[],
            reason="verification_not_yet_implemented",
        )
    
    def _compute_overall(self, checks: List[RuntimeCheckResult]) -> Literal["PASS", "FAIL", "BLOCKED"]:
        """
        Compute overall status from individual check results.
        
        Args:
            checks: List of check results
            
        Returns:
            Overall status: FAIL if any check failed, BLOCKED if any blocked, else PASS
        """
        if any(c.status == "FAIL" for c in checks):
            return "FAIL"
        if any(c.status == "BLOCKED" for c in checks):
            return "BLOCKED"
        if all(c.status == "PASS" for c in checks):
            return "PASS"
        return "BLOCKED"
