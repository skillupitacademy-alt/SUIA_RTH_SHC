"""
Tests for Repository Intelligence Service (M2.9 Wave 1B)
"""

import pytest
from app.intelligence.repository_intelligence import (
    discover_canonical_blocks,
    analyze_block_patterns,
    build_repository_contract,
    CanonicalReference,
    RuntimeContract,
    RepositoryBlockContract,
)


def test_discover_i1_block():
    """Test discovering Introduction I1 block."""
    refs = discover_canonical_blocks('introduction')
    
    assert len(refs) >= 1, "Should find at least one introduction block"
    
    # Check first reference
    ref = refs[0]
    assert isinstance(ref, CanonicalReference)
    assert ref.family == 'introduction'
    assert 'I1' in ref.version or ref.version == 'I1'
    assert len(ref.source_files) > 0
    assert 'IntroductionBlock.tsx' in ref.source_files[0]


def test_discover_c1_block():
    """Test discovering Code C1 block."""
    refs = discover_canonical_blocks('code-c1')
    
    assert len(refs) >= 1, "Should find at least one code-c1 block"
    
    ref = refs[0]
    assert isinstance(ref, CanonicalReference)
    assert ref.family == 'code-c1'
    assert 'C1' in ref.version or ref.version == 'C1'
    assert len(ref.source_files) > 0
    assert 'CodeC1Block.tsx' in ref.source_files[0]


def test_discover_d1_block():
    """Test discovering Definition D1 block."""
    refs = discover_canonical_blocks('definition')
    
    assert len(refs) >= 1, "Should find at least one definition block"
    
    ref = refs[0]
    assert isinstance(ref, CanonicalReference)
    assert ref.family == 'definition'
    assert 'D1' in ref.version or ref.version == 'D1'
    assert len(ref.source_files) > 0
    assert 'DefinitionBlock.tsx' in ref.source_files[0]


def test_extract_schema():
    """Test that discover_canonical_blocks returns schema dict."""
    refs = discover_canonical_blocks('introduction')
    
    assert len(refs) >= 1
    ref = refs[0]
    
    # Schema must be a dict (may be empty if no schema file exists)
    assert isinstance(ref.schema, dict)


def test_analyze_i1_runtime():
    """Test analyzing Introduction I1 runtime patterns."""
    runtime = analyze_block_patterns('I1')
    
    assert isinstance(runtime, RuntimeContract)
    assert isinstance(runtime.ubrc, dict)
    assert len(runtime.ubrc) > 0, "UBRC dict should be non-empty for I1"
    
    # I1 should have UBRC attributes
    assert runtime.ubrc.get('has_block_id') is True
    assert runtime.ubrc.get('has_block_type') is True
    assert runtime.ubrc.get('has_block_version') is True


def test_analyze_c1_runtime():
    """Test analyzing Code C1 runtime patterns."""
    runtime = analyze_block_patterns('C1')
    
    assert isinstance(runtime, RuntimeContract)
    assert isinstance(runtime.ubrc, dict)
    assert len(runtime.ubrc) > 0, "UBRC dict should be non-empty for C1"
    
    # C1 should have UBRC attributes
    assert runtime.ubrc.get('has_block_id') is True
    assert runtime.ubrc.get('has_block_type') is True
    assert runtime.ubrc.get('has_block_version') is True


def test_build_contract_i1():
    """Test building complete contract for Introduction I1."""
    contract = build_repository_contract('introduction', 'I1')
    
    assert isinstance(contract, RepositoryBlockContract)
    assert contract.target is not None and len(contract.target) > 0
    assert len(contract.canonical_refs) > 0, "Should have at least one canonical reference"
    
    # Check runtime contract
    assert isinstance(contract.runtime, RuntimeContract)
    assert len(contract.runtime.ubrc) > 0
    
    # Check acceptance criteria
    assert len(contract.acceptance_criteria) > 0


def test_missing_block_graceful():
    """Test that missing blocks are handled gracefully."""
    refs = discover_canonical_blocks('nonexistent-xyz')
    
    # Should return empty list, not raise exception
    assert isinstance(refs, list)
    assert len(refs) == 0


def test_analyze_d1_runtime():
    """Test analyzing Definition D1 runtime patterns."""
    runtime = analyze_block_patterns('D1')
    
    assert isinstance(runtime, RuntimeContract)
    assert isinstance(runtime.ubrc, dict)
    assert len(runtime.ubrc) > 0, "UBRC dict should be non-empty for D1"


def test_build_contract_c1():
    """Test building complete contract for Code C1."""
    contract = build_repository_contract('code-c1', 'C1')
    
    assert isinstance(contract, RepositoryBlockContract)
    assert contract.target is not None
    assert len(contract.canonical_refs) > 0
    assert isinstance(contract.runtime, RuntimeContract)


def test_build_contract_d1():
    """Test building complete contract for Definition D1."""
    contract = build_repository_contract('definition', 'D1')
    
    assert isinstance(contract, RepositoryBlockContract)
    assert contract.target is not None
    assert len(contract.canonical_refs) > 0
    assert isinstance(contract.runtime, RuntimeContract)


def test_theme_extraction():
    """Test that theme patterns are extracted from blocks."""
    runtime = analyze_block_patterns('I1')
    
    assert isinstance(runtime.theme, dict)
    # Introduction block should use theme
    assert len(runtime.theme) > 0


def test_runtime_context_detection():
    """Test that runtime context usage is detected."""
    runtime = analyze_block_patterns('C1')
    
    # Code blocks use runtimeContext
    assert runtime.ubrc.get('uses_runtime_context') is True
