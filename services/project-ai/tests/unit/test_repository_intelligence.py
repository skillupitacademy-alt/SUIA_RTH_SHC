"""
Unit tests for B03 Repository Contract Intelligence

Tests the repository intelligence layer that derives contracts from TypeScript snapshots.
"""

import pytest
from pathlib import Path
from app.contracts.repository_intelligence import (
    RepositoryEvidence,
    CanonicalReference,
    RuntimeContract,
    RepositoryBlockContract,
    RepositoryEvidenceBlocked,
    build_contract,
    build_contract_legacy,
    compute_sha256,
    generate_evidence_id,
    validate_evidence_id,
    extract_metadata_from_snapshot,
    derive_file_paths,
    extract_test_patterns,
    extract_test_patterns_detailed,
    build_inline_code_templates,
    validate_contract_template_schema_consistency,
    generate_block_content_interface,
    FAMILY_PAYLOAD_SCHEMAS,
)
from app.contracts.policy import FRAMEWORK_COMPLIANCE_POLICY_TEXT
from app.contracts.engineering_contract import EngineeringContract
from app.agents.canonical_comparison import CanonicalComparator
from app.intake.candidate_validator import CandidateValidator


class TestRepositoryEvidence:
    """Tests for RepositoryEvidence model."""
    
    def test_repository_evidence_creation(self):
        """Test that RepositoryEvidence can be created with valid data."""
        evidence = RepositoryEvidence(
            path="packages/ui/src/tutorial/blocks/CodeC1Block.tsx",
            sha256="a" * 64,  # Valid hex SHA-256
            role="canonical_block",
            evidence_id="b" * 64
        )
        assert evidence.path == "packages/ui/src/tutorial/blocks/CodeC1Block.tsx"
        assert evidence.sha256 == "a" * 64
        assert evidence.role == "canonical_block"
        assert evidence.evidence_id == "b" * 64


class TestCanonicalReference:
    """Tests for CanonicalReference model."""
    
    def test_canonical_reference_creation(self):
        """Test that CanonicalReference can be created."""
        evidence = RepositoryEvidence(
            path="test.tsx",
            sha256="a" * 64,
            role="canonical_block",
            evidence_id="b" * 64
        )
        reference = CanonicalReference(
            family="Code",
            version="C1",
            evidence=[evidence]
        )
        assert reference.family == "Code"
        assert reference.version == "C1"
        assert len(reference.evidence) == 1


class TestRuntimeContract:
    """Tests for RuntimeContract model."""
    
    def test_runtime_contract_defaults(self):
        """Test that RuntimeContract has correct defaults."""
        contract = RuntimeContract()
        assert contract.ub_rc_required is True
        assert contract.passive_ils is True
        assert contract.page_level_lsnb is True
        assert contract.page_level_rssb is True
        assert contract.theme_injected is True
        assert contract.brand_independent is True


class TestRepositoryBlockContract:
    """Tests for RepositoryBlockContract model."""
    
    def test_repository_block_contract_creation(self):
        """Test that RepositoryBlockContract can be created."""
        contract = RepositoryBlockContract(
            family="Code",
            version="C1",
            block_type="code_c1"
        )
        assert contract.family == "Code"
        assert contract.version == "C1"
        assert contract.block_type == "code_c1"
        assert isinstance(contract.runtime, RuntimeContract)
        assert isinstance(contract.required_artifacts, list)
        # After Wave 2 R3: fields are derived from snapshot, not hardcoded defaults
        # An empty contract should have empty lists, not generic placeholder values
        assert isinstance(contract.acceptance_criteria, list)


class TestBuildContract:
    """Tests for build_contract_legacy function - legacy filesystem-based intelligence."""
    
    def test_build_contract_returns_contract(self):
        """Test that build_contract_legacy returns a RepositoryBlockContract."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract_legacy(repo_root, "Code", "C1")
        
        assert isinstance(contract, RepositoryBlockContract)
        assert contract.family == "Code"
        assert contract.version == "C1"
        assert contract.block_type == "code_c1"
    
    def test_build_contract_sha256_non_empty(self):
        """Test that SHA-256 values are non-empty strings when files exist."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract_legacy(repo_root, "Code", "C1")
        
        # If references exist, verify SHA-256 is non-empty
        if contract.references:
            for reference in contract.references:
                for evidence in reference.evidence:
                    assert isinstance(evidence.sha256, str)
                    assert len(evidence.sha256) == 64  # SHA-256 is 64 hex chars
                    assert evidence.sha256 != ""
                    # Verify it's valid hex
                    int(evidence.sha256, 16)
    
    def test_build_contract_nonexistent_family_returns_empty_references(self):
        """Test that non-existent family returns a contract with empty references."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract_legacy(repo_root, "NonExistent", "X9")
        
        assert isinstance(contract, RepositoryBlockContract)
        assert contract.family == "NonExistent"
        assert contract.version == "X9"
        assert contract.references == []  # Empty, not exception
    
    def test_build_contract_introduction_i1(self):
        """Test build_contract_legacy for Introduction I1."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract_legacy(repo_root, "Introduction", "I1")
        
        assert contract.family == "Introduction"
        assert contract.version == "I1"
        assert isinstance(contract, RepositoryBlockContract)
    
    def test_build_contract_definition_d1(self):
        """Test build_contract_legacy for Definition D1."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        contract = build_contract_legacy(repo_root, "Definition", "D1")
        
        assert contract.family == "Definition"
        assert contract.version == "D1"
        assert isinstance(contract, RepositoryBlockContract)
    
    def test_build_contract_evidence_id_deterministic(self):
        """Test that evidence_id is deterministic."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        
        # Build contract twice
        contract1 = build_contract_legacy(repo_root, "Code", "C1")
        contract2 = build_contract_legacy(repo_root, "Code", "C1")
        
        # If references exist, verify evidence IDs match
        if contract1.references and contract2.references:
            evidence1 = contract1.references[0].evidence[0]
            evidence2 = contract2.references[0].evidence[0]
            assert evidence1.evidence_id == evidence2.evidence_id


class TestSnapshotBasedBuildContract:
    """Tests for snapshot-based build_contract function - R1 consolidation."""
    
    def test_build_contract_with_valid_snapshot(self):
        """Test that build_contract succeeds with valid snapshot evidence."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        
        contract = build_contract(snapshot, "Code", "C1")
        
        assert isinstance(contract, RepositoryBlockContract)
        assert contract.family == "Code"
        assert contract.version == "C1"
        assert contract.block_type == "code_c1"
        assert len(contract.references) == 1
        assert contract.references[0].family == "Code"
        assert contract.references[0].version == "C1"
        assert len(contract.references[0].evidence) == 1
        assert contract.references[0].evidence[0].sha256 == 'a' * 64
        assert contract.references[0].evidence[0].evidence_id == 'b' * 64
    
    def test_build_contract_introduction_i1(self):
        """Test build_contract for Introduction I1 with snapshot."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'c' * 64,
                    'evidenceId': 'd' * 64
                }
            ]
        }
        
        contract = build_contract(snapshot, "Introduction", "I1")
        
        assert contract.family == "Introduction"
        assert contract.version == "I1"
        assert len(contract.references) == 1
    
    def test_build_contract_definition_d1(self):
        """Test build_contract for Definition D1 with snapshot."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx',
                    'contentHash': 'e' * 64,
                    'evidenceId': 'f' * 64
                }
            ]
        }
        
        contract = build_contract(snapshot, "Definition", "D1")
        
        assert contract.family == "Definition"
        assert contract.version == "D1"
        assert len(contract.references) == 1
    
    def test_build_contract_deterministic_output(self):
        """Test that build_contract returns identical output for same snapshot."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        
        contract1 = build_contract(snapshot, "Code", "C1")
        contract2 = build_contract(snapshot, "Code", "C1")
        
        # Verify identical output
        assert contract1.family == contract2.family
        assert contract1.version == contract2.version
        assert contract1.block_type == contract2.block_type
        assert len(contract1.references) == len(contract2.references)
        
        if contract1.references:
            evidence1 = contract1.references[0].evidence[0]
            evidence2 = contract2.references[0].evidence[0]
            assert evidence1.sha256 == evidence2.sha256
            assert evidence1.evidence_id == evidence2.evidence_id


class TestFailClosedBehavior:
    """Tests for fail-closed behavior - R1 requirement."""
    
    def test_unknown_version_raises_blocked(self):
        """Test that unknown version raises RepositoryEvidenceBlocked."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/UnknownBlock.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Unknown", "X9")
        
        assert "Unsupported block family 'Unknown'" in str(exc_info.value) or "No canonical evidence for Unknown/X9" in str(exc_info.value)
    
    def test_missing_snapshot_raises_blocked(self):
        """Test that missing snapshot raises RepositoryEvidenceBlocked."""
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(None, "Code", "C1")
        
        assert "Snapshot is missing or empty" in str(exc_info.value)
    
    def test_empty_snapshot_raises_blocked(self):
        """Test that empty dict snapshot raises RepositoryEvidenceBlocked."""
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract({}, "Code", "C1")
        
        # Empty dict is falsy and caught by "not snapshot" check
        assert "Snapshot is missing or empty" in str(exc_info.value)
    
    def test_snapshot_without_evidence_array_raises_blocked(self):
        """Test that snapshot without 'evidence' key raises RepositoryEvidenceBlocked."""
        snapshot = {'some_other_key': 'value'}
        
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Code", "C1")
        
        assert "Snapshot missing 'evidence' array" in str(exc_info.value)
    
    def test_snapshot_evidence_not_list_raises_blocked(self):
        """Test that snapshot with non-list evidence raises RepositoryEvidenceBlocked."""
        snapshot = {'evidence': 'not a list'}
        
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Code", "C1")
        
        assert "Snapshot 'evidence' must be a list" in str(exc_info.value)
    
    def test_missing_evidence_for_family_raises_blocked(self):
        """Test that missing evidence for requested family/version raises RepositoryEvidenceBlocked."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        
        # Request Code C1, but only Introduction I1 exists
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Code", "C1")
        
        assert "No canonical evidence for Code/C1" in str(exc_info.value)
        assert "Run TypeScript discovery scan" in str(exc_info.value)

    def test_unsupported_family_blocked_even_when_introduction_baseline_exists(self):
        """Test that unsupported family is blocked even if Introduction baseline exists in snapshot."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "NonexistentFamily", "NF1")
        assert "Unsupported block family 'NonexistentFamily'" in str(exc_info.value)

    def test_mismatched_version_prefix_blocked_even_when_introduction_baseline_exists(self):
        """Test that mismatched version prefix is blocked even if Introduction baseline exists in snapshot."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Objective", "X1")
        assert "does not match family 'Objective' identifier prefix 'O'" in str(exc_info.value)
    
    def test_evidence_missing_content_hash_raises_blocked(self):
        """Test that evidence missing contentHash raises RepositoryEvidenceBlocked."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': '',  # Empty content hash
                    'evidenceId': 'b' * 64
                }
            ]
        }
        
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Code", "C1")
        
        assert "missing 'contentHash' field" in str(exc_info.value)
    
    def test_evidence_missing_evidence_id_raises_blocked(self):
        """Test that evidence missing evidenceId raises RepositoryEvidenceBlocked."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': ''  # Empty evidence ID
                }
            ]
        }
        
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Code", "C1")
        
        assert "missing 'evidenceId' field" in str(exc_info.value)


class TestNoFilesystemAccess:
    """Tests to verify no filesystem access in snapshot-based build_contract."""
    
    def test_build_contract_no_file_operations(self):
        """Test that build_contract doesn't perform filesystem operations."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        
        # This should succeed even if the path doesn't exist on filesystem
        contract = build_contract(snapshot, "Code", "C1")
        
        assert isinstance(contract, RepositoryBlockContract)
        assert len(contract.references) == 1
        # Verify evidence comes from snapshot, not filesystem
        assert contract.references[0].evidence[0].sha256 == 'a' * 64
        assert contract.references[0].evidence[0].evidence_id == 'b' * 64
    
    def test_build_contract_with_nonexistent_path(self):
        """Test that build_contract works with paths that don't exist on filesystem."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': '0' * 64,  # Valid 64-char hex SHA-256
                    'evidenceId': 'f' * 64
                }
            ]
        }
        
        # Should succeed without checking filesystem
        contract = build_contract(snapshot, "Code", "C1")
        
        assert contract.references[0].evidence[0].sha256 == '0' * 64
        assert contract.references[0].evidence[0].evidence_id == 'f' * 64

    def test_invalid_hex_content_hash_raises_blocked(self):
        """Test that non-hex contentHash raises RepositoryEvidenceBlocked."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'not-a-valid-hex-hash' * 3,
                    'evidenceId': 'f' * 64
                }
            ]
        }
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Code", "C1")
        assert "Expected a 64-character hexadecimal SHA-256 hash" in str(exc_info.value)

    def test_invalid_hex_content_hash_in_renderer_or_composer_raises_blocked(self):
        """Test that malformed contentHash in renderer/composer raises RepositoryEvidenceBlocked."""
        snapshot_renderer = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                },
                {
                    'kind': 'renderer',
                    'path': 'packages/ui/src/tutorial/universal-tutorial-renderer.tsx',
                    'contentHash': 'r' * 64,  # 'r' is invalid hex
                    'evidenceId': 'evidence-1111222233334444'
                }
            ]
        }
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot_renderer, "Introduction", "I1")
        assert "Expected a 64-character hexadecimal SHA-256 hash" in str(exc_info.value)

        snapshot_composer = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                },
                {
                    'kind': 'composer',
                    'path': 'packages/tutorial-composer/src/composer-service.ts',
                    'contentHash': 'z' * 64,  # 'z' is invalid hex
                    'evidenceId': 'evidence-5555666677778888'
                }
            ]
        }
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info2:
            build_contract(snapshot_composer, "Introduction", "I1")
        assert "Expected a 64-character hexadecimal SHA-256 hash" in str(exc_info2.value)


class TestHelperFunctions:
    """Tests for helper functions."""
    
    def test_compute_sha256(self, tmp_path):
        """Test SHA-256 computation."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("hello world")
        
        sha256 = compute_sha256(test_file)
        
        # SHA-256 of "hello world" is known
        # b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
        assert sha256 == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    
    def test_generate_evidence_id(self):
        """Test evidence ID generation."""
        path = "test/path.tsx"
        file_sha256 = "a" * 64
        
        evidence_id = generate_evidence_id(path, file_sha256)
        
        # Should be a valid SHA-256 hex string
        assert isinstance(evidence_id, str)
        assert len(evidence_id) == 64
        int(evidence_id, 16)  # Should not raise
    
    def test_generate_evidence_id_deterministic(self):
        """Test that evidence ID generation is deterministic."""
        path = "test/path.tsx"
        file_sha256 = "a" * 64
        
        id1 = generate_evidence_id(path, file_sha256)
        id2 = generate_evidence_id(path, file_sha256)
        
        assert id1 == id2


class TestMetadataExtraction:
    """Tests for FEAT-002: Extract metadata from snapshot."""
    
    def test_extract_metadata_from_snapshot(self):
        """Test that extract_metadata_from_snapshot extracts metadata correctly."""
        snapshot = {
            'metadata': {
                'language': 'TypeScript',
                'framework': 'React',
                'style': 'CSS Modules',
                'difficulty_level': 'advanced'
            },
            'evidence': []
        }
        
        metadata = extract_metadata_from_snapshot(snapshot)
        
        assert metadata['language'] == 'TypeScript'
        assert metadata['framework'] == 'React'
        assert metadata['style'] == 'CSS Modules'
        assert metadata['difficulty_level'] == 'advanced'
    
    def test_extract_metadata_infers_language_from_files(self):
        """Test that language is inferred from file extensions when not in metadata."""
        snapshot = {
            'metadata': {},
            'evidence': [
                {'path': 'src/component.tsx', 'kind': 'canonical_block'},
                {'path': 'src/test.ts', 'kind': 'test'}
            ]
        }
        
        metadata = extract_metadata_from_snapshot(snapshot)
        
        assert metadata['language'] == 'TypeScript'
    
    def test_extract_metadata_infers_framework_from_patterns(self):
        """Test that framework is inferred from file patterns."""
        snapshot = {
            'metadata': {},
            'evidence': [
                {'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx', 'kind': 'canonical_block'}
            ]
        }
        
        metadata = extract_metadata_from_snapshot(snapshot)
        
        assert metadata['framework'] == 'React'
    
    def test_extract_metadata_defaults_difficulty(self):
        """Test that difficulty_level defaults to intermediate."""
        snapshot = {
            'metadata': {},
            'evidence': []
        }
        
        metadata = extract_metadata_from_snapshot(snapshot)
        
        assert metadata['difficulty_level'] == 'intermediate'
    
    def test_derive_file_paths(self):
        """Test that derive_file_paths extracts paths from snapshot evidence."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'evidenceId': 'evidence-a1b2c3d4e5f67890'
                },
                {
                    'kind': 'schema',
                    'path': 'packages/ui/src/tutorial/blocks/code-schema.ts',
                    'evidenceId': 'evidence-d3f4567890123456'
                },
                {
                    'kind': 'test',
                    'path': 'packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx',
                    'evidenceId': 'evidence-0123456789abcdef'
                }
            ]
        }
        
        file_paths = derive_file_paths(snapshot, "Code", "C1")
        
        assert 'component' in file_paths
        assert file_paths['component']['path'] == 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx'
        assert file_paths['component']['evidence_id'] == 'evidence-a1b2c3d4e5f67890'
        assert 'schema' in file_paths
        assert 'tests' in file_paths
        assert len(file_paths['tests']) == 1
    
    def test_extract_test_patterns(self):
        """Test that extract_test_patterns identifies test types."""
        snapshot = {
            'evidence': [
                {'path': 'src/__tests__/component.test.tsx', 'kind': 'test'},
                {'path': 'src/__tests__/accessibility.test.tsx', 'kind': 'test'},
                {'path': 'src/__tests__/responsive.test.tsx', 'kind': 'test'}
            ]
        }
        
        test_patterns = extract_test_patterns(snapshot)
        
        assert 'Unit tests for component rendering' in test_patterns
        assert 'Accessibility tests (WCAG 2.1 AA)' in test_patterns
        assert 'Responsive design tests' in test_patterns
    
    def test_build_contract_extracts_metadata(self):
        """Test that build_contract populates all new fields from snapshot."""
        snapshot = {
            'metadata': {
                'language': 'TypeScript',
                'framework': 'React',
                'style': 'CSS Modules',
                'difficulty_level': 'intermediate',
                'compilerOptions': {
                    'strict': True,
                    'noImplicitAny': True,
                    'strictNullChecks': True
                }
            },
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                },
                {
                    'kind': 'test',
                    'path': 'src/__tests__/unit.test.tsx',
                    'contentHash': 'c' * 64,
                    'evidenceId': 'd' * 64
                },
                {
                    'path': 'tsconfig.json',
                    'kind': 'config',
                    'contentHash': 'e' * 64,
                    'evidenceId': 'f' * 64
                }
            ]
        }
        
        contract = build_contract(snapshot, "Code", "C1")
        
        # Verify metadata fields are populated
        assert contract.language == 'TypeScript'
        assert contract.framework == 'React'
        assert contract.style == 'CSS Modules'
        assert contract.difficulty_level == 'intermediate'
        
        # Verify file_paths is populated
        assert isinstance(contract.file_paths, dict)
        assert 'component' in contract.file_paths
        
        # Verify test_requirements is populated
        assert isinstance(contract.test_requirements, list)
        assert len(contract.test_requirements) > 0
        
        # Verify type_strictness is populated
        assert isinstance(contract.type_strictness, dict)
        assert contract.type_strictness.get('strict') is True
        
        # Verify field_evidence is populated
        assert 'language' in contract.field_evidence
        assert contract.field_evidence['language'].field_name == 'language'
        assert contract.field_evidence['language'].value == 'TypeScript'
        assert 'framework' in contract.field_evidence
        assert 'style' in contract.field_evidence
        assert 'difficulty_level' in contract.field_evidence
        assert 'file_paths' in contract.field_evidence
        assert 'test_requirements' in contract.field_evidence
        assert 'type_strictness' in contract.field_evidence

    def test_derive_file_paths_for_new_block_does_not_fabricate_evidence_id(self):
        """Test that unbuilt block target is marked as proposed_output_path without fake evidence_id."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'b' * 64
                }
            ]
        }
        paths = derive_file_paths(snapshot, "Objective", "O1")
        assert paths['component']['status'] == 'proposed_output_path'
        assert paths['component']['path'] == 'packages/ui/src/tutorial/blocks/ObjectiveO1Block.tsx'
        assert 'evidence_id' not in paths['component']

    def test_build_contract_objective_o1_marks_baseline_and_destination(self):
        """Test that build_contract for Objective O1 accurately labels architectural baseline."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': '2' * 64
                }
            ]
        }
        contract = build_contract(snapshot, "Objective", "O1")
        assert contract.family == "Objective"
        assert contract.version == "O1"
        assert contract.references[0].family == "Introduction (Architectural Baseline)"
        assert contract.references[0].evidence[0].role == "architectural_baseline"
        assert contract.file_paths['component']['status'] == 'proposed_output_path'

    def test_derive_file_paths_does_not_associate_unrelated_schema(self):
        """Test that schema derivation for Objective does not pick up Introduction schema."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'schema',
                    'path': 'packages/ui/src/tutorial/schemas/introduction-i1.schema.ts',
                    'contentHash': '5' * 64,
                    'evidenceId': 'e' * 64
                }
            ]
        }
        paths = derive_file_paths(snapshot, "Objective", "O1")
        # Should not grab introduction-i1 schema for Objective
        assert paths['schema']['status'] == 'to_be_created_or_defined_inline'
        assert paths['schema']['proposed_output_path'] == 'packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts'
        assert 'evidence_id' not in paths['schema']

    def test_provenance_marking_observed_vs_inferred_vs_default(self):
        """Test that field_evidence distinguishes observed from policy default."""
        snapshot = {
            'metadata': {
                'language': 'TypeScript',
                'evidence_id': 'evidence-60230209a0d29bda',
                'provenance': {
                    'language': 'observed_in_snapshot',
                    'style': 'policy_default_tailwind',
                    'difficulty_level': 'policy_default_intermediate'
                }
            },
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                }
            ]
        }
        contract = build_contract(snapshot, "Introduction", "I1")
        # Observed field has actual evidence_id, provenance, and source_evidence_ids
        assert contract.field_evidence['language'].evidence_id == 'evidence-60230209a0d29bda'
        assert contract.field_evidence['language'].provenance == 'observed_in_snapshot'
        assert contract.field_evidence['language'].source_evidence_ids == ['evidence-60230209a0d29bda']
        # Default fields do not fabricate real evidence IDs - they are None with explicit provenance
        assert contract.field_evidence['style'].evidence_id is None
        assert contract.field_evidence['style'].provenance == 'policy_default_tailwind'
        assert contract.field_evidence['difficulty_level'].evidence_id is None
        assert contract.field_evidence['difficulty_level'].provenance == 'policy_default_intermediate'

    def test_build_contract_objective_o1_analyzes_all_three_canonical_blocks(self):
        """Test that Objective O1 derives shared framework from all 3 canonical blocks when present."""
        ev_intro = 'evidence-60230209a0d29bda'
        ev_defn = 'evidence-0123456789abcdef'
        ev_code = 'evidence-abcdef0123456789'
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': ev_intro
                },
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx',
                    'contentHash': '2' * 64,
                    'evidenceId': ev_defn
                },
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': '3' * 64,
                    'evidenceId': ev_code
                }
            ]
        }
        contract = build_contract(snapshot, "Objective", "O1")
        assert contract.family == "Objective"
        assert contract.version == "O1"
        assert len(contract.references) == 3
        
        families = [r.family for r in contract.references]
        assert "Introduction (Architectural Baseline)" in families
        assert "Definition (Architectural Baseline)" in families
        assert "Code (Architectural Baseline)" in families
        
        # Verify comparative analysis metadata and baseline completeness
        assert set(contract.comparative_analysis.canonical_blocks_analyzed) == {"Introduction I1", "Definition D1", "Code C1"}
        assert contract.comparative_analysis.baseline_completeness == "complete"
        assert contract.comparative_analysis.missing_baselines == []
        
        # Manifest-only snapshot: conventions classified as not_verified_from_snapshot_content
        assert "ubrc_identity" in contract.comparative_analysis.shared_conventions
        ubrc_conv = contract.comparative_analysis.shared_conventions["ubrc_identity"]
        assert ubrc_conv["classification"] == "not_verified_from_snapshot_content"
        assert ubrc_conv["content_verified"] is False
        assert ubrc_conv["evidence_ids"] == []
        assert set(ubrc_conv["manifest_evidence_ids"]) == {ev_intro, ev_defn, ev_code}
        
        # Verify block-specific observations note unparsed content in manifest snapshot
        assert "Introduction" in contract.comparative_analysis.block_specific_conventions
        intro_spec = contract.comparative_analysis.block_specific_conventions["Introduction"]
        assert intro_spec["classification"] == "not_verified_from_snapshot_content"
        assert intro_spec["evidence_id"] is None
        assert intro_spec["manifest_evidence_id"] == ev_intro
        
        # Verify policy assertions have no fabricated evidence IDs
        for p in contract.comparative_analysis.policy_requirements:
            assert p["classification"] == "policy_assertion"
            assert p["evidence_id"] is None
            
        # Verify unresolved differences are listed
        assert len(contract.comparative_analysis.unresolved_differences) >= 3

    def test_build_contract_objective_o1_with_parsed_content_derives_conventions(self):
        """Test that Objective O1 verifies conventions from parsed AST/content when available."""
        ev_intro = 'evidence-60230209a0d29bda'
        ev_defn = 'evidence-0123456789abcdef'
        ev_code = 'evidence-abcdef0123456789'
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': ev_intro,
                    'parsed_facts': {
                        'root_element': 'article',
                        'ubrc': True,
                        'props': True,
                        'theme': True,
                        'router': True
                    }
                },
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/DefinitionBlock.tsx',
                    'contentHash': '2' * 64,
                    'evidenceId': ev_defn,
                    'parsed_facts': {
                        'root_element': 'article',
                        'ubrc': True,
                        'props': True,
                        'theme': True,
                        'router': True
                    }
                },
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': '3' * 64,
                    'evidenceId': ev_code,
                    'parsed_facts': {
                        'root_element': 'article',
                        'ubrc': True,
                        'props': True,
                        'theme': True,
                        'router': True
                    }
                }
            ]
        }
        contract = build_contract(snapshot, "Objective", "O1")
        assert contract.comparative_analysis.baseline_completeness == "complete"
        ubrc_conv = contract.comparative_analysis.shared_conventions["ubrc_identity"]
        assert ubrc_conv["classification"] == "observed_in_snapshot_content"
        assert ubrc_conv["content_verified"] is True
        assert set(ubrc_conv["evidence_ids"]) == {ev_intro, ev_defn, ev_code}
        
        intro_spec = contract.comparative_analysis.block_specific_conventions["Introduction"]
        assert intro_spec["classification"] == "observed_in_snapshot_content"
        assert intro_spec["evidence_id"] == ev_intro

    def test_build_contract_objective_o1_partial_baselines_recorded_explicitly(self):
        """Test that partial baseline availability is recorded without failing when baselines exist."""
        ev_intro = 'evidence-60230209a0d29bda'
        ev_code = 'evidence-abcdef0123456789'
        # Snapshot missing Definition D1
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': ev_intro
                },
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': '3' * 64,
                    'evidenceId': ev_code
                }
            ]
        }
        contract = build_contract(snapshot, "Objective", "O1")
        assert contract.comparative_analysis.baseline_completeness == "partial"
        assert contract.comparative_analysis.missing_baselines == ["Definition D1"]
        assert set(contract.comparative_analysis.canonical_blocks_analyzed) == {"Introduction I1", "Code C1"}


class TestEvidenceIdValidationAndPrecision:
    """Tests for strict evidence ID validation and file-path precision."""
    
    def test_validate_evidence_id_accepts_valid_formats(self):
        """Test that validate_evidence_id accepts valid TypeScript discovery IDs and 64-hex hashes."""
        assert validate_evidence_id("evidence-60230209a0d29bda") == "evidence-60230209a0d29bda"
        assert validate_evidence_id("a" * 64) == "a" * 64
        
    def test_validate_evidence_id_rejects_illustrative_placeholders(self):
        """Test that illustrative placeholders like 'ev-intro-1234' raise RepositoryEvidenceBlocked."""
        invalid_ids = [
            "ev-intro-1234",
            "test-evidence-id",
            "evidence-001",
            "evidence-xyz",
            "short",
            "",
            "   ",
        ]
        for bad_id in invalid_ids:
            with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
                validate_evidence_id(bad_id, "test_context")
            assert "evidenceId" in str(exc_info.value)

    def test_build_contract_fails_on_illustrative_evidence_id(self):
        """Test that build_contract rejects snapshot containing illustrative placeholder evidenceId."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'ev-intro-1234'  # Non-compliant placeholder
                }
            ]
        }
        with pytest.raises(RepositoryEvidenceBlocked) as exc_info:
            build_contract(snapshot, "Introduction", "I1")
        assert "invalid 'evidenceId'" in str(exc_info.value)
        assert "ev-intro-1234" in str(exc_info.value)

    def test_derive_file_paths_strict_separation_observed_shared_proposed(self):
        """Test that derive_file_paths separates observed, shared_framework, and proposed outputs."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                },
                {
                    'kind': 'types',
                    'path': 'packages/ui/src/tutorial/types.ts',
                    'contentHash': '2' * 64,
                    'evidenceId': 'evidence-0123456789abcdef'
                }
            ]
        }
        paths = derive_file_paths(snapshot, "Objective", "O1")
        
        # Proposed outputs must never fabricate source evidence IDs
        assert 'observed' in paths
        assert 'shared_framework' in paths
        assert 'proposed' in paths
        
        assert 'component' in paths['proposed']
        assert paths['proposed']['component']['status'] == 'proposed_output_path'
        assert 'evidence_id' not in paths['proposed']['component']
        
        assert 'schema' in paths['proposed']
        assert 'evidence_id' not in paths['proposed']['schema']
        
        assert 'tests' in paths['proposed']
        assert 'evidence_id' not in paths['proposed']['tests']
        
        # Shared framework retains exact evidence ID
        assert 'types' in paths['shared_framework']
        assert paths['shared_framework']['types']['evidence_id'] == 'evidence-0123456789abcdef'

    def test_test_pattern_breakdown_observed_vs_mandatory_policy(self):
        """Test that test_requirements separates observed snapshot patterns from mandatory policy tests."""
        snapshot = {
            'evidence': [
                {
                    'kind': 'test',
                    'path': 'packages/ui/src/tutorial/blocks/__tests__/IntroductionBlock.test.tsx',
                    'contentHash': '6' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                }
            ]
        }
        detailed = extract_test_patterns_detailed(snapshot)
        assert 'observed_patterns' in detailed
        assert 'mandatory_policy_tests' in detailed
        assert any("Unit tests" in p['pattern'] for p in detailed['observed_patterns'])
        assert "Zero hardcoded brand colors compliance test" in detailed['mandatory_policy_tests']
        assert "UBRC identity attributes verification test" in detailed['mandatory_policy_tests']

    def test_renderer_and_composer_contract_verification_status(self):
        """Test that renderer and composer contracts record decoupled multi-tier verification status."""
        # 1. Tier 1: File presence only (path and valid 64-char hex hash, no parsed registration, no integration tests)
        # Capabilities MUST remain unverified (capabilities_verified = False)
        snapshot_file_presence_only = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                },
                {
                    'kind': 'renderer',
                    'path': 'packages/ui/src/tutorial/universal-tutorial-renderer.tsx',
                    'contentHash': '4' * 64,
                    'evidenceId': 'evidence-1111222233334444'
                },
                {
                    'kind': 'composer',
                    'path': 'packages/tutorial-composer/src/composer-service.ts',
                    'contentHash': 'c' * 64,
                    'evidenceId': 'evidence-5555666677778888'
                }
            ]
        }
        contract_presence = build_contract(snapshot_file_presence_only, "Introduction", "I1")
        assert contract_presence.renderer_contract['evidence_found'] is True
        assert contract_presence.renderer_contract['capabilities_verified'] is False
        assert contract_presence.renderer_contract['block_registration_status'] == 'pending_registration'
        assert contract_presence.renderer_contract['verification_status'] == 'evidence_found_capabilities_unverified'
        assert contract_presence.renderer_contract['evidence_id'] == 'evidence-1111222233334444'

        assert contract_presence.composer_contract['evidence_found'] is True
        assert contract_presence.composer_contract['capabilities_verified'] is False
        assert contract_presence.composer_contract['block_registration_status'] == 'pending_registration'
        assert contract_presence.composer_contract['verification_status'] == 'evidence_found_capabilities_unverified'
        assert contract_presence.composer_contract['evidence_id'] == 'evidence-5555666677778888'

        # 2. Tier 2: Parsed source confirms registration entry, but runtime integration tests have NOT run
        # Registration evidence found; runtime behavior not yet proven (capabilities_verified = False)
        snapshot_registration_confirmed = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                },
                {
                    'kind': 'renderer',
                    'path': 'packages/ui/src/tutorial/universal-tutorial-renderer.tsx',
                    'contentHash': '4' * 64,
                    'evidenceId': 'evidence-1111222233334444',
                    'parsed_facts': {
                        'registered_blocks': ['IntroductionI1', 'CodeC1', 'DefinitionD1']
                    }
                },
                {
                    'kind': 'composer',
                    'path': 'packages/tutorial-composer/src/composer-service.ts',
                    'contentHash': 'c' * 64,
                    'evidenceId': 'evidence-5555666677778888',
                    'parsed_facts': {
                        'supported_blocks': ['IntroductionI1', 'CodeC1', 'DefinitionD1']
                    }
                }
            ]
        }
        contract_reg = build_contract(snapshot_registration_confirmed, "Introduction", "I1")
        assert contract_reg.renderer_contract['evidence_found'] is True
        assert contract_reg.renderer_contract['block_registration_status'] == 'registered'
        assert contract_reg.renderer_contract['capabilities_verified'] is False
        assert contract_reg.renderer_contract['verification_status'] == 'registration_confirmed_runtime_unverified'

        assert contract_reg.composer_contract['evidence_found'] is True
        assert contract_reg.composer_contract['block_registration_status'] == 'registered'
        assert contract_reg.composer_contract['capabilities_verified'] is False
        assert contract_reg.composer_contract['verification_status'] == 'registration_confirmed_runtime_unverified'

        # 3. Tier 3: Integration test confirms the block renders through the renderer & composer operations
        snapshot_integration_verified = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                },
                {
                    'kind': 'renderer',
                    'path': 'packages/ui/src/tutorial/universal-tutorial-renderer.tsx',
                    'contentHash': '4' * 64,
                    'evidenceId': 'evidence-1111222233334444',
                    'parsed_facts': {
                        'registered_blocks': ['IntroductionI1'],
                        'tested_blocks': ['IntroductionI1']
                    }
                },
                {
                    'kind': 'composer',
                    'path': 'packages/tutorial-composer/src/composer-service.ts',
                    'contentHash': 'c' * 64,
                    'evidenceId': 'evidence-5555666677778888',
                    'parsed_facts': {
                        'supported_blocks': ['IntroductionI1'],
                        'tested_operations': ['create', 'edit', 'delete', 'reorder']
                    }
                }
            ]
        }
        contract_verified = build_contract(snapshot_integration_verified, "Introduction", "I1")
        assert contract_verified.renderer_contract['evidence_found'] is True
        assert contract_verified.renderer_contract['block_registration_status'] == 'registered'
        assert contract_verified.renderer_contract['capabilities_verified'] is True
        assert contract_verified.renderer_contract['verification_status'] == 'integration_test_verified'

        assert contract_verified.composer_contract['evidence_found'] is True
        assert contract_verified.composer_contract['block_registration_status'] == 'registered'
        assert contract_verified.composer_contract['capabilities_verified'] is True
        assert contract_verified.composer_contract['verification_status'] == 'integration_test_verified'

        # 4. Tier 4: Objective O1 (new block) with renderer/composer evidence in snapshot:
        # Evidence is found, but registration is pending integration and capabilities are unverified
        contract_obj = build_contract(snapshot_registration_confirmed, "Objective", "O1")
        assert contract_obj.renderer_contract['evidence_found'] is True
        assert contract_obj.renderer_contract['capabilities_verified'] is False
        assert contract_obj.renderer_contract['block_registration_status'] == 'pending_registration'
        assert contract_obj.renderer_contract['verification_status'] == 'evidence_found_capabilities_unverified'
        assert contract_obj.renderer_contract['evidence_id'] == 'evidence-1111222233334444'

        assert contract_obj.composer_contract['evidence_found'] is True
        assert contract_obj.composer_contract['capabilities_verified'] is False
        assert contract_obj.composer_contract['block_registration_status'] == 'pending_registration'
        assert contract_obj.composer_contract['verification_status'] == 'evidence_found_capabilities_unverified'
        assert contract_obj.composer_contract['evidence_id'] == 'evidence-5555666677778888'

        # 5. Tier 5: Required checks have not run (no renderer/composer evidence in snapshot -> NOT_RUN)
        snapshot_without_tools = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                }
            ]
        }
        contract2 = build_contract(snapshot_without_tools, "Introduction", "I1")
        assert contract2.renderer_contract['evidence_found'] is False
        assert contract2.renderer_contract['capabilities_verified'] is False
        assert contract2.renderer_contract['block_registration_status'] == 'pending_registration'
        assert contract2.renderer_contract['verification_status'] == 'NOT_RUN'
        assert contract2.renderer_contract['evidence_id'] is None

        assert contract2.composer_contract['evidence_found'] is False
        assert contract2.composer_contract['capabilities_verified'] is False
        assert contract2.composer_contract['block_registration_status'] == 'pending_registration'
        assert contract2.composer_contract['verification_status'] == 'NOT_RUN'
        assert contract2.composer_contract['evidence_id'] is None

    def test_inline_templates_type_safety_and_dual_theme_isolation(self):
        """Test that generated templates contain zero 'any' types and test skeleton asserts brand isolation."""
        templates = build_inline_code_templates("Objective", "O1")
        component_code = templates["component_skeleton"]["code"]
        test_code = templates["test_skeleton"]["code"]
        
        # Zero 'any' types in block props
        assert "block: any" not in component_code
        assert "(block as any)" not in component_code
        assert "ObjectiveO1BlockData" in component_code
        assert "ObjectiveO1BlockContent" in component_code
        
        # Schema-template alignment: Objective uses 'objectives', NOT generic 'items'
        assert "objectives:" in component_code
        assert "objectives:" in test_code
        assert "items:" not in component_code
        assert "items?:" not in component_code
        assert "items:" not in test_code
        
        # Test skeleton asserts dual-brand theme independence and isolation
        assert "brandThemeA" in test_code
        assert "brandThemeB" in test_code
        assert "#e11d48" in test_code
        assert "#0ea5e9" in test_code
        assert "expect(containerB.innerHTML).not.toContain('#e11d48')" in test_code
        assert "expect(containerA.innerHTML).not.toContain('#0ea5e9')" in test_code
        assert "DEFAULT_THEME" in test_code
        
        # Enhanced test coverage: dynamic tokens and neutral theme zero-hardcoded colors
        assert "strictly verifies dynamic theme tokens" in test_code
        assert "#10b981" in test_code

    def test_framework_only_boundary_no_gui_prescriptions(self):
        """Regression test verifying that Project LLM contracts do not prescribe block GUI design."""
        # 1. Component template has no GUI layout prescriptions
        for family, version in [("Objective", "O1"), ("Introduction", "I1"), ("Code", "C1"), ("Definition", "D1")]:
            templates = build_inline_code_templates(family, version)
            component_code = templates["component_skeleton"]["code"]
            
            # Framework compliance attributes must be present
            assert "data-block-id=" in component_code
            assert "data-block-type=" in component_code
            assert "data-block-version=" in component_code
            assert "DEFAULT_THEME" in component_code
            
            # Prescriptive GUI elements must NOT be present
            assert "<div" not in component_code
            assert "<ul" not in component_code
            assert "<li" not in component_code
            assert "<pre" not in component_code
            assert "<dt" not in component_code
            assert "badge" not in component_code.lower()
            assert "rounded-full" not in component_code
            assert "displayMode" not in component_code

        # 2. Acceptance criteria and required artifacts have no GUI deliverables
        test_snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': '1' * 64,
                    'evidenceId': 'evidence-60230209a0d29bda'
                }
            ]
        }
        contract = build_contract(test_snapshot, "Introduction", "I1")
        assert "HTML/CSS/JS prototype" not in contract.required_artifacts
        assert "React/TypeScript implementation" in contract.required_artifacts
        
        # Criteria are framework-compliance focused, not GUI visual designs
        criteria_text = " ".join(contract.acceptance_criteria)
        assert "Responsive on mobile" not in criteria_text
        assert "Matches canonical design system" not in criteria_text
        assert "UBRC runtime" in criteria_text
        assert "theme independence" in criteria_text.lower()

        # 3. Legacy filesystem path also obeys framework-only boundary
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)
        legacy_contract = build_contract_legacy(repo_root, "Introduction", "I1")
        assert "HTML/CSS/JS prototype" not in legacy_contract.required_artifacts
        assert "React/TypeScript implementation" in legacy_contract.required_artifacts
        legacy_criteria = " ".join(legacy_contract.acceptance_criteria)
        assert "Responsive on mobile" not in legacy_criteria
        assert "Matches canonical design system" not in legacy_criteria
        assert "UBRC runtime" in legacy_criteria

        # 4. Canonical governing policy is verified and enforces boundary
        assert "FRAMEWORK COMPLIANCE-ONLY POLICY" in FRAMEWORK_COMPLIANCE_POLICY_TEXT
        assert "must not design, prescribe, or redefine block-specific GUI layout" in FRAMEWORK_COMPLIANCE_POLICY_TEXT
        assert "user and External AI own GUI design" in FRAMEWORK_COMPLIANCE_POLICY_TEXT

    def test_generic_contract_template_schema_consistency_validation(self):
        """Test that validate_contract_template_schema_consistency correctly passes valid contracts and catches defects."""
        # 1. Objective O1 valid contract
        obj_templates = build_inline_code_templates("Objective", "O1")
        valid_obj_contract = {
            "type_contract": {
                "payload_schema": FAMILY_PAYLOAD_SCHEMAS["objective"]
            },
            "inline_code_templates": obj_templates
        }
        is_valid, errors = validate_contract_template_schema_consistency(valid_obj_contract)
        assert is_valid is True
        assert len(errors) == 0

        # 2. Other families: Introduction, Code, Definition
        for fam, ver in [("Introduction", "I1"), ("Code", "C1"), ("Definition", "D1")]:
            fam_lower = fam.lower()
            templates = build_inline_code_templates(fam, ver)
            contract = {
                "type_contract": {
                    "payload_schema": FAMILY_PAYLOAD_SCHEMAS[fam_lower]
                },
                "inline_code_templates": templates
            }
            is_valid, errors = validate_contract_template_schema_consistency(contract)
            assert is_valid is True, f"Failed for family {fam}: {errors}"
            assert len(errors) == 0

        # 3. Defective contract (the O1 defect: objectives in schema, but generic items in templates)
        defective_templates = {
            "component_skeleton": {
                "code": "export interface ObjectiveO1BlockContent { title?: string; items?: string[]; }"
            },
            "test_skeleton": {
                "code": "const mockBlock = { content: { title: 'Test', items: ['a'] } };"
            }
        }
        defective_contract = {
            "type_contract": {
                "payload_schema": FAMILY_PAYLOAD_SCHEMAS["objective"]
            },
            "inline_code_templates": defective_templates
        }
        is_valid, errors = validate_contract_template_schema_consistency(defective_contract)
        assert is_valid is False
        assert any("Component skeleton missing 'objectives'" in err for err in errors)
        assert any("Test skeleton missing 'objectives'" in err for err in errors)
        assert any("conflicting with 'objectives' schema" in err for err in errors)

    def test_fallback_templates_for_unmapped_families(self):
        """Test that unmapped or future block families fall back cleanly without breaking."""
        templates = build_inline_code_templates("CustomWidget", "W1")
        component_code = templates["component_skeleton"]["code"]
        test_code = templates["test_skeleton"]["code"]
        
        assert "CustomWidgetW1BlockContent" in component_code
        assert "items?:" in component_code
        assert "CustomWidgetW1BlockData" in component_code
        assert "Test CustomWidget" in test_code
        
        # Empty schema contract should also pass generic validation rule
        generic_contract = {
            "type_contract": {
                "payload_schema": {}
            },
            "inline_code_templates": templates
        }
        is_valid, errors = validate_contract_template_schema_consistency(generic_contract)
        assert is_valid is True
        assert len(errors) == 0

    def test_check1_multi_agent_policy_inheritance(self):
        """Check 1: All agents, contracts, and validators inherit the framework compliance-only policy."""
        # 1. Governing policy text must be explicit and uncompromised
        assert "FRAMEWORK COMPLIANCE-ONLY POLICY" in FRAMEWORK_COMPLIANCE_POLICY_TEXT
        assert "Project LLM must not design, prescribe, or redefine block-specific GUI layout" in FRAMEWORK_COMPLIANCE_POLICY_TEXT
        assert "The user and External AI own GUI design and implementation decisions" in FRAMEWORK_COMPLIANCE_POLICY_TEXT
        assert "Every compliance claim must have traceable evidence" in FRAMEWORK_COMPLIANCE_POLICY_TEXT

        # 2. Canonical Comparator defaults must not require HTML/CSS/JS prototype
        comparator = CanonicalComparator()
        default_comparison = comparator.compare(
            candidate_artifacts=[
                {"name": "IntroductionI1Block.tsx", "sha256": "h1"},
                {"name": "types.ts", "sha256": "h2"},
                {"name": "IntroductionI1Block.test.tsx", "sha256": "h3"}
            ],
            required_artifacts=[
                "React/TypeScript implementation",
                "Type definitions",
                "Unit tests"
            ],
            target_family="Introduction",
            target_version="I1",
            contract=None
        )
        assert "HTML/CSS/JS prototype" not in default_comparison.missing_requirements

        # 3. Candidate Validator must validate framework artifacts without requiring GUI prototypes
        validator = CandidateValidator()
        assert validator is not None

    def test_check2_authoritative_block_specifications_no_gui_enums_in_python(self):
        """Check 2: Existing block specifications are authoritative; Python does not invent GUI enums."""
        # 1. Python FAMILY_PAYLOAD_SCHEMAS must NOT invent GUI layout enums
        for fam, schema in FAMILY_PAYLOAD_SCHEMAS.items():
            schema_str = str(schema).lower()
            assert "displaymode" not in schema_str, f"Found displayMode in {fam} schema"
            assert "bloomlevel" not in schema_str, f"Found bloomLevel in {fam} schema"
            assert "bullet" not in schema_str, f"Found bullet in {fam} schema"
            assert "checklist" not in schema_str, f"Found checklist in {fam} schema"
            assert "numbered" not in schema_str, f"Found numbered in {fam} schema"
            assert "pronunciation" not in schema_str, f"Found pronunciation in {fam} schema"
            assert "keypoints" not in schema_str, f"Found keyPoints in {fam} schema"
            assert "highlights" not in schema_str, f"Found highlights in {fam} schema"

        # 2. Dynamic content interface derivation must not inject GUI enums
        obj_interface = generate_block_content_interface("Objective", "O1", FAMILY_PAYLOAD_SCHEMAS["objective"])
        assert "ObjectiveO1BlockContent" in obj_interface
        assert "objectives:" in obj_interface
        assert "displayMode" not in obj_interface
        assert "bloomLevel" not in obj_interface

        # 3. Canonical block markdown specifications exist in repo as source of truth
        repo_root = Path(__file__).parent.parent.parent.parent.parent
        spec_dir = repo_root / "ILS_UI_UX" / "docs" / "blocksmdfiles" / "OneAIModelForProjectLLM"
        assert (spec_dir / "ObjectiveBlock.md").exists(), "Authoritative ObjectiveBlock.md not found"
        assert (spec_dir / "CodeBlock.md").exists(), "Authoritative CodeBlock.md not found"
        assert (spec_dir / "DefinitionBlock.md").exists(), "Authoritative DefinitionBlock.md not found"

    def test_check3_legacy_and_snapshot_contract_paths_obey_same_boundary(self):
        """Check 3: Both modern snapshot-based path and legacy filesystem path obey the same rules."""
        repo_root = str(Path(__file__).parent.parent.parent.parent.parent)

        # Path A: Modern snapshot path
        snapshot = {
            'evidence': [
                {
                    'kind': 'canonical_block',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'a' * 64,
                    'evidenceId': 'evidence-' + '1' * 16
                }
            ]
        }
        contract_snapshot = build_contract(snapshot, "Introduction", "I1")

        # Path B: Legacy filesystem path
        contract_legacy = build_contract_legacy(repo_root, "Introduction", "I1")

        # Both paths eliminate HTML/CSS/JS prototype
        assert "HTML/CSS/JS prototype" not in contract_snapshot.required_artifacts
        assert "HTML/CSS/JS prototype" not in contract_legacy.required_artifacts

        # Both paths contain React/TypeScript implementation
        assert any("React" in r for r in contract_snapshot.required_artifacts)
        assert any("React" in r for r in contract_legacy.required_artifacts)

        # Both paths omit GUI-specific visual criteria
        for c in (contract_snapshot, contract_legacy):
            joined_criteria = " ".join(c.acceptance_criteria)
            assert "Responsive on mobile" not in joined_criteria
            assert "Matches canonical design system" not in joined_criteria
            # Both paths enforce framework compliance criteria
            assert "UBRC runtime" in joined_criteria
            assert "Brand and theme independence" in joined_criteria
            assert "Dual-export" in joined_criteria
            assert "Strict TypeScript typing" in joined_criteria
            assert "no direct ILS/LSNB/RSSB API calls" in joined_criteria

    def test_check4_all_18_canonical_block_families_regression(self):
        """Check 4: Regression test proves framework-only boundary across all 18 canonical block families."""
        all_18_families = [
            ("Introduction", "I1"),
            ("Objective", "O1"),
            ("Definition", "D1"),
            ("Code", "C1"),
            ("Visual", "V1"),
            ("Comparison", "CP1"),
            ("Execution", "E1"),
            ("Memory", "M1"),
            ("Mistake", "MT1"),
            ("BestPractice", "BP1"),
            ("Summary", "S1"),
            ("Question", "Q1"),
            ("Exercise", "EX1"),
            ("Task", "T1"),
            ("Interactive", "INT1"),
            ("Quiz", "QZ1"),
            ("Interview", "IV1"),
            ("Project", "P1"),
        ]

        prohibited_visual_tokens = [
            "<div", "<ul", "<li", "<pre", "<dt", "<dd",
            "rounded-full", "font-semibold", "text-sm", "badge",
            "displayMode", "bloomLevel"
        ]

        for family, version in all_18_families:
            templates = build_inline_code_templates(family, version)
            component_code = templates["component_skeleton"]["code"]
            test_code = templates["test_skeleton"]["code"]

            # 1. Component skeleton contains mandatory UBRC wrapper and router
            assert f"export function {family}Block(" in component_code
            assert f"export const {family}{version}Block = {family}Block;" in component_code
            assert f"export default {family}Block;" in component_code
            assert "<article" in component_code
            assert "className={className}" in component_code
            assert "data-block-id={blockId}" in component_code
            assert "data-block-type={blockType}" in component_code
            assert "data-block-version={blockVersion}" in component_code
            assert f"const blockType = runtimeContext?.blockType ?? '{family.lower()}';" in component_code
            assert "const blockVersion = runtimeContext?.blockVersion ?? block.version;" in component_code

            # 2. Component skeleton contains ZERO GUI visual markup
            for token in prohibited_visual_tokens:
                assert token not in component_code, (
                    f"Violation in family {family} {version}: found visual GUI token '{token}' in component skeleton"
                )

            # 3. Test skeleton asserts strictly framework compliance
            assert "UBRC data attributes" in test_code
            assert "data-block-id" in test_code
            assert "data-block-type" in test_code
            assert "data-block-version" in test_code
            assert "brandThemeA" in test_code
            assert "brandThemeB" in test_code
            assert "DEFAULT_THEME" in test_code
            assert "renders without console errors" in test_code

            # 4. Consistency validation passes cleanly
            contract = {
                "type_contract": {
                    "payload_schema": FAMILY_PAYLOAD_SCHEMAS.get(family.lower(), {})
                },
                "inline_code_templates": templates
            }
            is_valid, errors = validate_contract_template_schema_consistency(contract)
            assert is_valid is True, f"Consistency check failed for {family} {version}: {errors}"
            assert len(errors) == 0


def test_repository_block_contract_governing_policy():
    """Test that RepositoryBlockContract binds the authoritative governing policy by default."""
    from app.contracts.repository_intelligence import RepositoryBlockContract
    contract = RepositoryBlockContract(
        family="Introduction",
        version="I7",
        block_type="introduction_i7"
    )
    assert hasattr(contract, "governing_policy")
    assert "FRAMEWORK COMPLIANCE-ONLY POLICY" in contract.governing_policy
    assert "must not design, prescribe, or redefine block-specific GUI layout" in contract.governing_policy





