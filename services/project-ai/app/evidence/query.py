"""
Evidence query interface for looking up evidence records.

ARCHITECTURAL RULE:
- All queries read from authoritative TypeScript discovery snapshot
- NEVER create or modify evidence, only read and analyze
"""

from typing import Any, Dict, List, Optional
from .graph import EvidenceGraph, EvidenceNode


class EvidenceQuery:
    """
    Query interface for evidence lookup and verification.
    
    Provides high-level query methods for evidence discovery and validation.
    """
    
    def __init__(self, graph: EvidenceGraph):
        """
        Initialize evidence query with evidence graph.
        
        Args:
            graph: Built evidence graph
        """
        self.graph = graph
    
    def get_evidence_by_id(self, evidence_id: str) -> Optional[EvidenceNode]:
        """
        Get evidence by ID.
        
        Args:
            evidence_id: Evidence ID to look up
            
        Returns:
            Evidence node if found, None otherwise
        """
        return self.graph.nodes.get(evidence_id)
    
    def get_evidence_for_claim(self, claim: str) -> List[EvidenceNode]:
        """
        Get all evidence supporting a claim.
        
        Args:
            claim: Claim description to search for
            
        Returns:
            List of evidence nodes matching the claim
        """
        # Extract keywords from claim
        keywords = self.graph._extract_keywords(claim)
        
        # Find evidence matching any keyword
        matching_ids = set()
        for keyword in keywords:
            matching_ids.update(self.graph._by_claim_keywords.get(keyword, []))
        
        return [self.graph.nodes[eid] for eid in matching_ids]
    
    def get_evidence_for_block(self, block_type: str) -> List[EvidenceNode]:
        """
        Get all evidence for a specific block type.
        
        Args:
            block_type: Block type (e.g., 'introduction', 'code')
            
        Returns:
            List of evidence nodes related to the block
        """
        evidence_list = []
        
        # Find block in verified blocks
        blocks_data = self.graph.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        for block in verified_blocks:
            if block.get('blockType') == block_type:
                # Get implementation evidence
                if impl_evidence_id := block.get('implementation', {}).get('evidenceId'):
                    if node := self.graph.nodes.get(impl_evidence_id):
                        evidence_list.append(node)
                
                # Get renderer evidence
                if renderer_evidence_id := block.get('renderer', {}).get('evidenceId'):
                    if node := self.graph.nodes.get(renderer_evidence_id):
                        evidence_list.append(node)
        
        return evidence_list
    
    def verify_evidence_chain(self, claim: str) -> bool:
        """
        Verify that a complete evidence chain exists for a claim.
        
        Args:
            claim: Claim to verify evidence chain for
            
        Returns:
            True if complete evidence chain exists, False otherwise
        """
        evidence = self.get_evidence_for_claim(claim)
        
        if not evidence:
            return False
        
        # Check that evidence has required fields
        for node in evidence:
            if not node.evidence_id or not node.content_hash:
                return False
            if not node.claim or not node.path:
                return False
        
        return True
    
    def get_evidence_by_path_pattern(self, pattern: str) -> List[EvidenceNode]:
        """
        Get evidence matching a path pattern.
        
        Args:
            pattern: Path pattern to match (substring match)
            
        Returns:
            List of evidence nodes with matching paths
        """
        matching = []
        for node in self.graph.nodes.values():
            if pattern in node.path:
                matching.append(node)
        return matching
    
    def get_evidence_by_kind(self, kind: str) -> List[EvidenceNode]:
        """
        Get all evidence of a specific kind.
        
        Args:
            kind: Evidence kind (e.g., 'type-definition', 'component')
            
        Returns:
            List of evidence nodes of the specified kind
        """
        return self.graph.get_evidence_by_kind(kind)
    
    def get_critical_evidence(self) -> List[EvidenceNode]:
        """
        Get all critical evidence (lifecycle='current').
        
        Returns:
            List of critical evidence nodes
        """
        return [node for node in self.graph.nodes.values() if node.lifecycle == 'current']
    
    def get_historical_evidence(self) -> List[EvidenceNode]:
        """
        Get all historical evidence (lifecycle='historical').
        
        Returns:
            List of historical evidence nodes
        """
        return [node for node in self.graph.nodes.values() if node.lifecycle == 'historical']
    
    def validate_evidence_structure(self, evidence_id: str) -> Dict[str, Any]:
        """
        Validate that an evidence record has all required fields.
        
        Args:
            evidence_id: Evidence ID to validate
            
        Returns:
            Validation result with 'valid' boolean and 'errors' list
        """
        node = self.get_evidence_by_id(evidence_id)
        
        if not node:
            return {
                'valid': False,
                'errors': [f"Evidence not found: {evidence_id}"]
            }
        
        errors = []
        
        # Required fields
        if not node.evidence_id:
            errors.append("Missing evidenceId")
        if not node.kind:
            errors.append("Missing kind")
        if not node.path:
            errors.append("Missing path")
        if not node.scanner_name:
            errors.append("Missing scannerName")
        if not node.claim:
            errors.append("Missing claim")
        # contentHash can be empty for directories
        if node.kind != 'directory' and not node.content_hash:
            errors.append("Missing contentHash")
        
        # Check for synthetic IDs (should never happen with real TS evidence)
        if 'candidate-' in node.evidence_id and '-classification' in node.evidence_id:
            errors.append(f"Synthetic evidence ID detected: {node.evidence_id}")
        if 'candidate-' in node.evidence_id and '-comparison' in node.evidence_id:
            errors.append(f"Synthetic evidence ID detected: {node.evidence_id}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
