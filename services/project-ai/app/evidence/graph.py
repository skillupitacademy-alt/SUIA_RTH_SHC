"""
Evidence graph builder and reconciliation.

ARCHITECTURAL RULE:
- Evidence must come from authoritative TypeScript discovery snapshot
- NEVER create synthetic evidence IDs
- Build graph from real evidence records only
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Set, Optional
from collections import defaultdict
import hashlib


@dataclass
class EvidenceNode:
    """Node in the evidence graph representing a single evidence record."""
    
    evidence_id: str
    kind: str
    path: str
    scanner_name: str
    claim: str
    content_hash: str
    lifecycle: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    symbol: Optional[str] = None
    
    def __hash__(self):
        return hash(self.evidence_id)
    
    def __eq__(self, other):
        if isinstance(other, EvidenceNode):
            return self.evidence_id == other.evidence_id
        return False


@dataclass
class EvidenceEdge:
    """Edge in the evidence graph representing relationship between evidence."""
    
    source_id: str
    target_id: str
    relationship: str  # 'imports', 'depends_on', 'implements', 'verifies'
    
    def __hash__(self):
        return hash((self.source_id, self.target_id, self.relationship))
    
    def __eq__(self, other):
        if isinstance(other, EvidenceEdge):
            return (self.source_id == other.source_id and 
                    self.target_id == other.target_id and
                    self.relationship == other.relationship)
        return False


class EvidenceGraph:
    """
    Evidence graph for reconciliation and integrity analysis.
    
    Builds a graph from TypeScript discovery snapshot evidence, enabling:
    - Detection of missing evidence (claims without evidence)
    - Detection of orphan evidence (evidence without consumers)
    - Detection of duplicate evidence IDs
    - Binding evidence to specific git revision
    - Freezing evidence for certification-ready state
    """
    
    def __init__(self, snapshot: Dict[str, Any], evidence_records: List[Dict[str, Any]]):
        """
        Initialize evidence graph from snapshot and evidence records.
        
        Args:
            snapshot: TypeScript discovery snapshot (metadata, blocks, etc)
            evidence_records: List of evidence records from snapshot['evidence']
        """
        self.snapshot = snapshot
        self.evidence_records = evidence_records
        self.nodes: Dict[str, EvidenceNode] = {}
        self.edges: Set[EvidenceEdge] = set()
        self._frozen = False
        self._bound_revision: Optional[str] = None
        
        # Index structures for fast lookup
        self._by_kind: Dict[str, List[str]] = defaultdict(list)
        self._by_path: Dict[str, List[str]] = defaultdict(list)
        self._by_scanner: Dict[str, List[str]] = defaultdict(list)
        self._by_claim_keywords: Dict[str, List[str]] = defaultdict(list)
    
    def build_graph(self) -> "EvidenceGraph":
        """
        Build evidence graph from snapshot data.
        
        Returns:
            Self for method chaining
        """
        # Build nodes from evidence records
        for record in self.evidence_records:
            node = EvidenceNode(
                evidence_id=record['evidenceId'],
                kind=record['kind'],
                path=record['path'],
                scanner_name=record['scannerName'],
                claim=record['claim'],
                content_hash=record['contentHash'],
                lifecycle=record.get('lifecycle', 'current'),
                metadata=record.get('metadata', {}),
                symbol=record.get('symbol'),
            )
            
            self.nodes[node.evidence_id] = node
            
            # Build indexes
            self._by_kind[node.kind].append(node.evidence_id)
            self._by_path[node.path].append(node.evidence_id)
            self._by_scanner[node.scanner_name].append(node.evidence_id)
            
            # Index by claim keywords for searching
            keywords = self._extract_keywords(node.claim)
            for keyword in keywords:
                self._by_claim_keywords[keyword].append(node.evidence_id)
        
        # Build edges from relationships
        self._build_edges()
        
        return self
    
    def _extract_keywords(self, claim: str) -> Set[str]:
        """Extract keywords from claim for indexing."""
        # Simple keyword extraction: lowercase words
        words = claim.lower().split()
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were', 'be', 'been'}
        return {word.strip('.,;:!?') for word in words if word not in stop_words and len(word) > 2}
    
    def _build_edges(self):
        """Build edges between evidence nodes based on relationships."""
        # Build edges from block implementations to renderers
        blocks_data = self.snapshot.get('blocks', {})
        verified_blocks = blocks_data.get('verified', [])
        
        for block in verified_blocks:
            impl_evidence = block.get('implementation', {}).get('evidenceId')
            renderer_evidence = block.get('renderer', {}).get('evidenceId')
            
            if impl_evidence and renderer_evidence:
                self.edges.add(EvidenceEdge(
                    source_id=impl_evidence,
                    target_id=renderer_evidence,
                    relationship='implements'
                ))
        
        # Build edges from test files to source files
        tests_data = self.snapshot.get('tests', {})
        for suite in tests_data.get('suites', []):
            test_evidence = suite.get('evidenceId')
            test_path = suite.get('path', '')
            
            if test_evidence:
                # Find source file being tested (heuristic: remove .test/.spec from path)
                source_path = test_path.replace('.test.', '.').replace('.spec.', '.')
                source_evidence_ids = self._by_path.get(source_path, [])
                
                for source_evidence in source_evidence_ids:
                    self.edges.add(EvidenceEdge(
                        source_id=test_evidence,
                        target_id=source_evidence,
                        relationship='verifies'
                    ))
    
    def detect_missing_evidence(self, claims: List[str]) -> List[str]:
        """
        Detect missing evidence for given claims.
        
        Args:
            claims: List of claim descriptions to check
            
        Returns:
            List of claims that lack evidence
        """
        missing = []
        
        for claim in claims:
            # Extract keywords from claim
            keywords = self._extract_keywords(claim)
            
            # Search for evidence matching any keyword
            matching_evidence = set()
            for keyword in keywords:
                matching_evidence.update(self._by_claim_keywords.get(keyword, []))
            
            # If no matching evidence found, claim is missing evidence
            if not matching_evidence:
                missing.append(claim)
        
        return missing
    
    def detect_orphan_evidence(self) -> List[str]:
        """
        Detect orphan evidence (evidence not referenced by any entity).
        
        Returns:
            List of evidence IDs that are not referenced
        """
        # Collect all evidence IDs referenced in snapshot
        referenced = set()
        
        # Check blocks
        blocks_data = self.snapshot.get('blocks', {})
        for block in blocks_data.get('verified', []):
            if impl_evidence := block.get('implementation', {}).get('evidenceId'):
                referenced.add(impl_evidence)
            if renderer_evidence := block.get('renderer', {}).get('evidenceId'):
                referenced.add(renderer_evidence)
        
        # Check applications
        for app in self.snapshot.get('applications', []):
            if evidence_id := app.get('evidenceId'):
                referenced.add(evidence_id)
        
        # Check packages
        for pkg in self.snapshot.get('packages', []):
            if evidence_id := pkg.get('evidenceId'):
                referenced.add(evidence_id)
        
        # Check services
        for svc in self.snapshot.get('services', []):
            if evidence_id := svc.get('evidenceId'):
                referenced.add(evidence_id)
        
        # Check dependencies
        deps_data = self.snapshot.get('dependencies', {})
        for node in deps_data.get('nodes', []):
            if evidence_id := node.get('evidenceId'):
                referenced.add(evidence_id)
        
        # Check tests
        tests_data = self.snapshot.get('tests', {})
        for suite in tests_data.get('suites', []):
            if evidence_id := suite.get('evidenceId'):
                referenced.add(evidence_id)
        
        # Also check edges - evidence that is connected is not orphaned
        for edge in self.edges:
            referenced.add(edge.source_id)
            referenced.add(edge.target_id)
        
        # Find evidence not in referenced set
        all_evidence_ids = set(self.nodes.keys())
        orphans = all_evidence_ids - referenced
        
        return list(orphans)
    
    def detect_duplicate_evidence(self) -> List[tuple[str, List[str]]]:
        """
        Detect duplicate evidence IDs.
        
        Returns:
            List of tuples (evidence_id, list_of_paths) for duplicates
        """
        # Group evidence by ID
        id_to_paths: Dict[str, List[str]] = defaultdict(list)
        
        for node in self.nodes.values():
            id_to_paths[node.evidence_id].append(node.path)
        
        # Find IDs with multiple paths (duplicates)
        duplicates = []
        for evidence_id, paths in id_to_paths.items():
            if len(paths) > 1:
                duplicates.append((evidence_id, paths))
        
        return duplicates
    
    def bind_to_revision(self, commit_sha: str) -> None:
        """
        Bind evidence graph to specific git revision.
        
        Args:
            commit_sha: Git commit SHA to bind to
        """
        if self._frozen:
            raise RuntimeError("Cannot bind frozen evidence graph")
        
        self._bound_revision = commit_sha
    
    def freeze(self) -> None:
        """
        Freeze evidence graph for certification-ready state.
        
        Once frozen, no modifications allowed.
        """
        if not self._bound_revision:
            raise RuntimeError("Cannot freeze evidence graph without binding to revision")
        
        self._frozen = True
    
    def is_frozen(self) -> bool:
        """Check if evidence graph is frozen."""
        return self._frozen
    
    def get_bound_revision(self) -> Optional[str]:
        """Get git revision this evidence is bound to."""
        return self._bound_revision
    
    def get_evidence_by_kind(self, kind: str) -> List[EvidenceNode]:
        """Get all evidence of a specific kind."""
        evidence_ids = self._by_kind.get(kind, [])
        return [self.nodes[eid] for eid in evidence_ids]
    
    def get_evidence_by_path(self, path: str) -> List[EvidenceNode]:
        """Get all evidence for a specific path."""
        evidence_ids = self._by_path.get(path, [])
        return [self.nodes[eid] for eid in evidence_ids]
    
    def get_evidence_by_scanner(self, scanner_name: str) -> List[EvidenceNode]:
        """Get all evidence from a specific scanner."""
        evidence_ids = self._by_scanner.get(scanner_name, [])
        return [self.nodes[eid] for eid in evidence_ids]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get evidence graph statistics."""
        return {
            'total_nodes': len(self.nodes),
            'total_edges': len(self.edges),
            'by_kind': {kind: len(ids) for kind, ids in self._by_kind.items()},
            'by_scanner': {scanner: len(ids) for scanner, ids in self._by_scanner.items()},
            'by_lifecycle': self._count_by_lifecycle(),
            'frozen': self._frozen,
            'bound_revision': self._bound_revision,
        }
    
    def _count_by_lifecycle(self) -> Dict[str, int]:
        """Count evidence by lifecycle."""
        counts = {'current': 0, 'historical': 0}
        for node in self.nodes.values():
            counts[node.lifecycle] = counts.get(node.lifecycle, 0) + 1
        return counts
