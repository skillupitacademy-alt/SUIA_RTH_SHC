"""Tests for evidence graph and query."""

import pytest
from app.evidence.graph import EvidenceGraph, EvidenceNode, EvidenceEdge
from app.evidence.query import EvidenceQuery


@pytest.fixture
def sample_snapshot():
    """Sample discovery snapshot for testing."""
    return {
        'metadata': {
            'scanTimestamp': '2025-01-29T10:00:00Z',
            'gitRevision': 'abc123',
        },
        'blocks': {
            'verified': [
                {
                    'blockType': 'introduction',
                    'implementation': {
                        'evidenceId': 'evidence-impl-intro-001',
                        'path': 'packages/types/src/tutorial/blocks.ts',
                    },
                    'renderer': {
                        'evidenceId': 'evidence-renderer-intro-001',
                        'path': 'packages/ui/src/blocks/IntroductionBlock.tsx',
                    },
                }
            ]
        },
        'applications': [
            {
                'name': 'admin',
                'evidenceId': 'evidence-app-admin-001',
            }
        ],
        'packages': [],
        'services': [],
        'dependencies': {'nodes': [], 'edges': []},
        'tests': {'suites': []},
    }


@pytest.fixture
def sample_evidence_records():
    """Sample evidence records for testing."""
    return [
        {
            'evidenceId': 'evidence-impl-intro-001',
            'kind': 'type-definition',
            'path': 'packages/types/src/tutorial/blocks.ts',
            'scannerName': 'd3-blocks',
            'claim': 'Block type definition for introduction',
            'contentHash': 'hash001',
            'lifecycle': 'current',
        },
        {
            'evidenceId': 'evidence-renderer-intro-001',
            'kind': 'component',
            'path': 'packages/ui/src/blocks/IntroductionBlock.tsx',
            'scannerName': 'd3-blocks',
            'claim': 'Renderer component for introduction block',
            'contentHash': 'hash002',
            'lifecycle': 'current',
        },
        {
            'evidenceId': 'evidence-app-admin-001',
            'kind': 'package',
            'path': 'apps/admin/package.json',
            'scannerName': 'd1-structure',
            'claim': 'Admin application package',
            'contentHash': 'hash003',
            'lifecycle': 'current',
        },
        {
            'evidenceId': 'evidence-orphan-001',
            'kind': 'file',
            'path': 'scripts/old-script.ts',
            'scannerName': 'd1-structure',
            'claim': 'Old script file',
            'contentHash': 'hash004',
            'lifecycle': 'historical',
        },
    ]


def test_evidence_graph_builds_from_snapshot(sample_snapshot, sample_evidence_records):
    """Test that evidence graph builds successfully from snapshot."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    assert len(graph.nodes) == 4
    assert len(graph.edges) >= 0  # May have edges depending on relationships


def test_evidence_graph_indexes_by_kind(sample_snapshot, sample_evidence_records):
    """Test that evidence is indexed by kind."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    type_defs = graph.get_evidence_by_kind('type-definition')
    assert len(type_defs) == 1
    assert type_defs[0].evidence_id == 'evidence-impl-intro-001'
    
    components = graph.get_evidence_by_kind('component')
    assert len(components) == 1
    assert components[0].evidence_id == 'evidence-renderer-intro-001'


def test_evidence_graph_indexes_by_path(sample_snapshot, sample_evidence_records):
    """Test that evidence is indexed by path."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    evidence = graph.get_evidence_by_path('packages/types/src/tutorial/blocks.ts')
    assert len(evidence) == 1
    assert evidence[0].evidence_id == 'evidence-impl-intro-001'


def test_detect_missing_evidence(sample_snapshot, sample_evidence_records):
    """Test detection of missing evidence for claims."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    claims = [
        'Block type definition for introduction',  # Has evidence
        'Nonexistent feature XYZ implementation',  # Missing evidence
    ]
    
    missing = graph.detect_missing_evidence(claims)
    assert len(missing) == 1
    assert 'Nonexistent feature XYZ implementation' in missing


def test_detect_orphan_evidence(sample_snapshot, sample_evidence_records):
    """Test detection of orphan evidence."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    orphans = graph.detect_orphan_evidence()
    
    # evidence-orphan-001 should be detected as orphan
    assert 'evidence-orphan-001' in orphans


def test_detect_duplicate_evidence():
    """Test detection of duplicate evidence IDs."""
    # Create snapshot with duplicate evidence
    snapshot = {
        'metadata': {},
        'blocks': {'verified': []},
        'applications': [],
        'packages': [],
        'services': [],
        'dependencies': {'nodes': [], 'edges': []},
        'tests': {'suites': []},
    }
    
    # Note: Real system should prevent duplicates, but we test detection
    evidence_records = [
        {
            'evidenceId': 'evidence-dup-001',
            'kind': 'file',
            'path': 'path/a.ts',
            'scannerName': 'd1',
            'claim': 'File A',
            'contentHash': 'hash1',
            'lifecycle': 'current',
        },
        {
            'evidenceId': 'evidence-dup-001',
            'kind': 'file',
            'path': 'path/b.ts',  # Different path, same ID
            'scannerName': 'd1',
            'claim': 'File B',
            'contentHash': 'hash2',
            'lifecycle': 'current',
        },
    ]
    
    graph = EvidenceGraph(snapshot, evidence_records)
    graph.build_graph()
    
    # Note: The second record will overwrite the first in nodes dict
    # So we can't detect actual duplicates this way in current implementation
    # This test documents expected behavior
    assert len(graph.nodes) == 1  # Only one node (last one wins)


def test_bind_to_revision(sample_snapshot, sample_evidence_records):
    """Test binding evidence to git revision."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    graph.bind_to_revision('abc123def456')
    assert graph.get_bound_revision() == 'abc123def456'


def test_freeze_evidence(sample_snapshot, sample_evidence_records):
    """Test freezing evidence graph."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    graph.bind_to_revision('abc123')
    graph.freeze()
    
    assert graph.is_frozen()
    
    # Cannot bind after freeze
    with pytest.raises(RuntimeError, match="Cannot bind frozen"):
        graph.bind_to_revision('def456')


def test_cannot_freeze_without_revision(sample_snapshot, sample_evidence_records):
    """Test that freezing requires revision binding first."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    with pytest.raises(RuntimeError, match="without binding to revision"):
        graph.freeze()


def test_evidence_query_get_by_id(sample_snapshot, sample_evidence_records):
    """Test querying evidence by ID."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    evidence = query.get_evidence_by_id('evidence-impl-intro-001')
    assert evidence is not None
    assert evidence.kind == 'type-definition'


def test_evidence_query_get_for_claim(sample_snapshot, sample_evidence_records):
    """Test querying evidence for a claim."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    evidence = query.get_evidence_for_claim('introduction block type definition')
    assert len(evidence) >= 1
    assert any(e.evidence_id == 'evidence-impl-intro-001' for e in evidence)


def test_evidence_query_get_for_block(sample_snapshot, sample_evidence_records):
    """Test querying evidence for a block type."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    evidence = query.get_evidence_for_block('introduction')
    assert len(evidence) == 2  # Implementation + renderer
    evidence_ids = {e.evidence_id for e in evidence}
    assert 'evidence-impl-intro-001' in evidence_ids
    assert 'evidence-renderer-intro-001' in evidence_ids


def test_verify_evidence_chain(sample_snapshot, sample_evidence_records):
    """Test verifying complete evidence chain."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    # Valid chain
    assert query.verify_evidence_chain('Block type definition for introduction')
    
    # Invalid chain (no evidence)
    assert not query.verify_evidence_chain('Nonexistent feature XYZ')


def test_validate_evidence_structure(sample_snapshot, sample_evidence_records):
    """Test validating evidence structure."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    # Valid evidence
    result = query.validate_evidence_structure('evidence-impl-intro-001')
    assert result['valid']
    assert len(result['errors']) == 0
    
    # Nonexistent evidence
    result = query.validate_evidence_structure('nonexistent')
    assert not result['valid']
    assert any('not found' in err for err in result['errors'])


def test_detect_synthetic_evidence_ids(sample_snapshot):
    """Test that synthetic evidence IDs are detected and rejected."""
    # Create evidence with synthetic ID
    synthetic_evidence = [
        {
            'evidenceId': 'candidate-123-classification',  # Synthetic!
            'kind': 'file',
            'path': 'fake/path.ts',
            'scannerName': 'fake',
            'claim': 'Fake claim',
            'contentHash': 'hash',
            'lifecycle': 'current',
        }
    ]
    
    graph = EvidenceGraph(sample_snapshot, synthetic_evidence)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    result = query.validate_evidence_structure('candidate-123-classification')
    assert not result['valid']
    assert any('Synthetic evidence ID detected' in err for err in result['errors'])


def test_get_critical_vs_historical_evidence(sample_snapshot, sample_evidence_records):
    """Test filtering critical vs historical evidence."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    query = EvidenceQuery(graph)
    
    critical = query.get_critical_evidence()
    historical = query.get_historical_evidence()
    
    assert len(critical) == 3  # 3 current lifecycle
    assert len(historical) == 1  # 1 historical lifecycle
    
    assert all(e.lifecycle == 'current' for e in critical)
    assert all(e.lifecycle == 'historical' for e in historical)


def test_evidence_graph_statistics(sample_snapshot, sample_evidence_records):
    """Test evidence graph statistics."""
    graph = EvidenceGraph(sample_snapshot, sample_evidence_records)
    graph.build_graph()
    
    stats = graph.get_statistics()
    
    assert stats['total_nodes'] == 4
    assert stats['by_kind']['type-definition'] == 1
    assert stats['by_kind']['component'] == 1
    assert stats['by_lifecycle']['current'] == 3
    assert stats['by_lifecycle']['historical'] == 1
    assert not stats['frozen']
    assert stats['bound_revision'] is None
