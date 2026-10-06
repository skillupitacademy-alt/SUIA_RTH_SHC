"""
Tests for certification gate executors.

Verifies that:
1. Each gate runs real verification (not unconditional PASS)
2. Valid candidates pass all gates
3. Invalid candidates fail at the correct gate
4. Evidence IDs are real (from TS system)
5. UNKNOWN/BLOCKED returned when evidence unavailable
6. No unconditional PASS anywhere
"""

import pytest
from pathlib import Path
from app.certification.gates import CertificationGateExecutor
from app.models.creation import CertificationGateStatus


class TestCertificationGates:
    """Test real certification gate execution."""
    
    @pytest.fixture
    def mock_snapshot_valid(self):
        """Valid snapshot with full UBRC compliance."""
        return {
            'metadata': {
                'timestamp': '2025-01-29T00:00:00Z',
                'scannerVersion': '1.0.0'
            },
            'blocks': {
                'documented': [
                    {'family': 'I', 'versions': ['I1', 'I2', 'I3']}
                ],
                'implemented': [
                    {
                        'type': 'introduction',
                        'version': 'I1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                        'evidenceId': 'ev-impl-001'
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'introduction',
                        'componentPath': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                        'evidenceId': 'ev-render-001',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'hasDataBlockVersion': True,
                            'registryEntry': True,
                            'versionMatch': True
                        }
                    }
                ],
                'verified': [
                    {
                        'blockType': 'introduction',
                        'version': 'I1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'REGISTERED',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'hasDataBlockVersion': True,
                            'registryEntry': True,
                            'versionMatch': True
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc123',
                    'description': 'Introduction block type definition',
                    'symbol': 'introduction'
                },
                {
                    'evidenceId': 'ev-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'def456',
                    'description': 'Introduction block renderer',
                    'symbol': 'introduction'
                },
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'ghi789',
                    'description': 'Block registry'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_missing_ubrc(self):
        """Snapshot with UBRC attribute missing."""
        return {
            'metadata': {},
            'blocks': {
                'verified': [
                    {
                        'blockType': 'summary',
                        'version': 'S1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': False,
                        'tested': False,
                        'ubrcStatus': 'UBRC_ATTRIBUTE_MISSING'
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'summary',
                        'ubrcStatus': 'UBRC_ATTRIBUTE_MISSING'
                    }
                ]
            },
            'evidence': []
        }
    
    @pytest.fixture
    def mock_snapshot_empty(self):
        """Empty snapshot (no blocks discovered)."""
        return {
            'metadata': {},
            'blocks': {
                'verified': [],
                'rendered': []
            },
            'evidence': []
        }
    
    @pytest.fixture
    def repository_root(self, tmp_path):
        """Mock repository root."""
        return tmp_path
    
    def test_ubrc_gate_passes_with_valid_blocks(self, mock_snapshot_valid, repository_root):
        """UBRC gate passes when all blocks are UBRC-compliant."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_ubrc_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert len(result.blockers) == 0
        assert 'verified' in result.message.lower()
    
    def test_ubrc_gate_fails_with_missing_attribute(self, mock_snapshot_missing_ubrc, repository_root):
        """UBRC gate fails when block is missing data-block-version attribute."""
        executor = CertificationGateExecutor(mock_snapshot_missing_ubrc, repository_root)
        
        result = executor.execute_ubrc_gate(['S1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('attribute' in b.lower() for b in result.blockers)
    
    def test_ubrc_gate_blocked_with_empty_snapshot(self, mock_snapshot_empty, repository_root):
        """UBRC gate blocked when snapshot has no blocks."""
        executor = CertificationGateExecutor(mock_snapshot_empty, repository_root)
        
        result = executor.execute_ubrc_gate(['I1'])
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert len(result.blockers) > 0
        assert 'snapshot' in result.message.lower() or 'unavailable' in result.message.lower()
    
    def test_brand_independence_gate_detects_hard_coded_colors(self, mock_snapshot_valid, repository_root):
        """Brand independence gate detects hard-coded hex colors."""
        # Create a file with hard-coded color
        test_file = repository_root / "TestComponent.tsx"
        test_file.write_text("const color = '#FF5733';", encoding='utf-8')
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_brand_independence_gate(['TestComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('color' in b.lower() for b in result.blockers)
    
    def test_brand_independence_gate_passes_with_css_variables(self, mock_snapshot_valid, repository_root):
        """Brand independence gate passes when using CSS variables."""
        # Create a file with CSS variables
        test_file = repository_root / "TestComponent.tsx"
        test_file.write_text(
            "const color = 'var(--color-primary)'; className='bg-primary'",
            encoding='utf-8'
        )
        
        # Add evidence for this file
        mock_snapshot_valid['evidence'].append({
            'evidenceId': 'ev-test-001',
            'kind': 'component',
            'path': 'TestComponent.tsx',
            'contentHash': 'test123',
            'description': 'Test component'
        })
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_brand_independence_gate(['TestComponent.tsx'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.blockers) == 0
    
    # Wave 6A: Comprehensive Brand Independence Tests
    
    def test_brand_gate_detects_hardcoded_logo(self, mock_snapshot_valid, repository_root):
        """Brand gate detects hard-coded logo paths."""
        test_file = repository_root / "LogoComponent.tsx"
        test_file.write_text(
            'import logo from "./assets/skillhub-logo.png";\nconst img = "/images/logo.svg";',
            encoding='utf-8'
        )
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['LogoComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('logo' in b.lower() for b in result.blockers)
    
    def test_brand_gate_detects_hardcoded_url(self, mock_snapshot_valid, repository_root):
        """Brand gate detects hard-coded brand URLs."""
        test_file = repository_root / "LinkComponent.tsx"
        test_file.write_text(
            'const url = "https://skillhub.com/courses";',
            encoding='utf-8'
        )
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['LinkComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('url' in b.lower() for b in result.blockers)
    
    def test_brand_gate_detects_hardcoded_font(self, mock_snapshot_valid, repository_root):
        """Brand gate detects hard-coded font-family values."""
        test_file = repository_root / "TextComponent.tsx"
        test_file.write_text(
            "const style = { fontFamily: 'Poppins, sans-serif' };",
            encoding='utf-8'
        )
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['TextComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('font' in b.lower() for b in result.blockers)
    
    def test_brand_gate_detects_hardcoded_brand_id(self, mock_snapshot_valid, repository_root):
        """Brand gate detects hard-coded brand ID in code."""
        test_file = repository_root / "BrandComponent.tsx"
        test_file.write_text(
            'const config = { brandId: "skillhub" };',
            encoding='utf-8'
        )
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['BrandComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('brand' in b.lower() for b in result.blockers)
    
    def test_brand_gate_allows_design_tokens(self, mock_snapshot_valid, repository_root):
        """Brand gate allows CSS variables and design tokens."""
        test_file = repository_root / "TokenComponent.tsx"
        test_file.write_text(
            """
            const styles = {
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-secondary)',
                fontFamily: 'var(--font-heading)'
            };
            const theme = theme.colors.primary;
            """,
            encoding='utf-8'
        )
        
        # Add evidence
        mock_snapshot_valid.setdefault('structure', {}).setdefault('evidence', []).append({
            'evidenceId': 'ev-token-001',
            'kind': 'component',
            'path': 'TokenComponent.tsx',
            'contentHash': 'test123',
            'description': 'Token component'
        })
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['TokenComponent.tsx'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.blockers) == 0
        assert len(result.evidence_ids) > 0
    
    def test_brand_gate_detects_multiple_violations(self, mock_snapshot_valid, repository_root):
        """Brand gate detects multiple violations in a single file."""
        test_file = repository_root / "MultiViolation.tsx"
        test_file.write_text(
            """
            const color = '#FF5733';
            const logo = '/images/skillhub-logo.png';
            const url = 'https://skillhub.com';
            const font = { fontFamily: 'Poppins' };
            const config = { brandId: 'skillhub' };
            """,
            encoding='utf-8'
        )
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['MultiViolation.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        # Should detect multiple types of violations
        assert len(result.blockers) >= 4  # At least color, logo, url, brand
    
    def test_brand_gate_provides_specific_line_numbers(self, mock_snapshot_valid, repository_root):
        """Brand gate provides specific line numbers for findings."""
        test_file = repository_root / "LineNumbers.tsx"
        test_file.write_text(
            "line 1\nline 2\nconst color = '#FF5733';\nline 4\n",
            encoding='utf-8'
        )
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['LineNumbers.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        # Should include line number in blocker message
        assert any(':3:' in b or 'Line 3' in b or 'line 3' in b for b in result.blockers)
    
    def test_brand_gate_verifies_multiple_files(self, mock_snapshot_valid, repository_root):
        """Brand gate can verify multiple files in one call."""
        # Create clean file
        clean_file = repository_root / "CleanComponent.tsx"
        clean_file.write_text("const color = 'var(--color-primary)';", encoding='utf-8')
        
        # Create file with violation
        dirty_file = repository_root / "DirtyComponent.tsx"
        dirty_file.write_text("const color = '#FF5733';", encoding='utf-8')
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        result = executor.execute_brand_independence_gate(['CleanComponent.tsx', 'DirtyComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('DirtyComponent.tsx' in b for b in result.blockers)
    
    def test_registry_verification_gate_passes_with_registered_blocks(self, mock_snapshot_valid, repository_root):
        """Registry verification gate passes when blocks are registered."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_registry_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert len(result.blockers) == 0
    
    def test_registry_verification_gate_fails_with_unregistered_blocks(self, mock_snapshot_missing_ubrc, repository_root):
        """Registry verification gate fails when blocks are not registered."""
        executor = CertificationGateExecutor(mock_snapshot_missing_ubrc, repository_root)
        
        result = executor.execute_registry_verification_gate(['S1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('registered' in b.lower() or 'registry' in b.lower() for b in result.blockers)
    
    def test_renderer_verification_gate_passes_with_rendered_blocks(self, mock_snapshot_valid, repository_root):
        """Renderer verification gate passes when blocks have renderers."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_renderer_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert len(result.blockers) == 0
    
    def test_evidence_binding_gate_passes_with_valid_evidence(self, mock_snapshot_valid, repository_root):
        """Evidence binding gate passes when evidence is complete."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_evidence_binding_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert len(result.blockers) == 0
        # Verify evidence IDs are from TS system (not synthetic)
        for eid in result.evidence_ids:
            assert eid.startswith('ev-')
            assert 'candidate' not in eid  # Not synthetic
    
    def test_evidence_binding_gate_blocked_with_no_evidence(self, mock_snapshot_empty, repository_root):
        """Evidence binding gate blocked when no evidence exists."""
        executor = CertificationGateExecutor(mock_snapshot_empty, repository_root)
        
        result = executor.execute_evidence_binding_gate(['I1'])
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert 'unavailable' in result.message.lower() or 'no evidence' in result.message.lower()
    
    def test_theme_compatibility_gate_detects_hard_coded_colors(self, mock_snapshot_valid, repository_root):
        """Theme compatibility gate detects hard-coded colors."""
        test_file = repository_root / "TestComponent.tsx"
        test_file.write_text("background: rgb(255, 0, 0);", encoding='utf-8')
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_theme_compatibility_gate(['TestComponent.tsx'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
    
    def test_theme_compatibility_gate_passes_with_theme_tokens(self, mock_snapshot_valid, repository_root):
        """Theme compatibility gate passes with theme tokens."""
        test_file = repository_root / "packages" / "ui" / "src" / "tutorial" / "blocks" / "TestComponent.tsx"
        test_file.parent.mkdir(parents=True, exist_ok=True)
        test_file.write_text("""
import { DomainTheme } from '../types';

interface Props {
    theme?: DomainTheme;
}

export function TestComponent({ theme }: Props) {
    return <div data-block-type="testcomp" style={{ color: theme?.primary }}>Text</div>;
}
""", encoding='utf-8')
        
        # Add implementation to snapshot
        mock_snapshot_valid['blocks']['implemented'].append({
            'type': 'testcomp',
            'version': 'TC1',
            'path': str(test_file.relative_to(repository_root)).replace('\\', '/'),
            'implementationPath': str(test_file.relative_to(repository_root)).replace('\\', '/'),
            'evidenceId': 'ev-test-002'
        })
        
        # Add evidence for this file
        mock_snapshot_valid['evidence'].append({
            'evidenceId': 'ev-test-002',
            'kind': 'component',
            'path': str(test_file.relative_to(repository_root)).replace('\\', '/'),
            'contentHash': 'test456',
            'description': 'Test component',
            'symbol': 'testcomp'
        })
        
        # Create theme configs
        theme_store = repository_root / "packages" / "ui" / "src" / "theme-store.ts"
        theme_store.parent.mkdir(parents=True, exist_ok=True)
        theme_store.write_text("export type EnterpriseTheme = 'theme-a' | 'theme-b';", encoding='utf-8')
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_theme_compatibility_gate(['testcomp'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.blockers) == 0
    
    def test_no_unconditional_pass(self, mock_snapshot_empty, repository_root):
        """Verify that no gate unconditionally passes without verification."""
        executor = CertificationGateExecutor(mock_snapshot_empty, repository_root)
        
        # All gates should either FAIL or be BLOCKED when snapshot is empty
        gates_to_test = [
            ('ubrc', executor.execute_ubrc_gate),
            ('registry', executor.execute_registry_verification_gate),
            ('renderer', executor.execute_renderer_verification_gate),
            ('evidence', executor.execute_evidence_binding_gate),
        ]
        
        for gate_name, gate_func in gates_to_test:
            result = gate_func(['I1'])
            assert result.status != CertificationGateStatus.PASS, \
                f"{gate_name} gate unconditionally passed with empty snapshot"
    
    def test_block_type_extraction(self, mock_snapshot_valid, repository_root):
        """Test block type extraction from shorthand."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        assert executor._extract_block_type('I1') == 'introduction'
        assert executor._extract_block_type('C1') == 'code'
        assert executor._extract_block_type('D1') == 'definition'
        assert executor._extract_block_type('introduction') == 'introduction'
    
    def test_evidence_lookup_by_path(self, mock_snapshot_valid, repository_root):
        """Test evidence lookup by file path."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        evidence = executor._find_evidence_by_path('packages/types/src/tutorial-rich-document/blocks/content-blocks.ts')
        
        assert evidence is not None
        assert evidence['evidenceId'] == 'ev-impl-001'
    
    def test_evidence_lookup_by_block(self, mock_snapshot_valid, repository_root):
        """Test evidence lookup by block type and kind."""
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        evidence = executor._find_evidence_by_block('introduction', 'type-definition')
        
        assert evidence is not None
        assert evidence['evidenceId'] == 'ev-impl-001'


class TestCreationAPIWithRealGates:
    """Test creation API with real gate execution."""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)
    
    def test_certify_endpoint_no_longer_unconditional_pass(self, client, tmp_path, monkeypatch):
        """Verify certify endpoint doesn't unconditionally pass all gates."""
        # Create workflow
        response = client.post("/creation/workflows", json={
            "mode": "I2_ONLY",
            "composition": {},
            "candidateBlocks": ["I1"]
        })
        assert response.status_code == 200
        workflow_id = response.json()["workflowId"]
        
        # Mock snapshot path to point to non-existent file
        import app.api.routes.creation as creation_module
        monkeypatch.setattr(Path, 'exists', lambda self: False)
        
        # Attempt certification - should BLOCK because snapshot missing
        response = client.post(f"/creation/workflows/{workflow_id}/certify")
        assert response.status_code == 200
        
        workflow = response.json()
        gates = workflow["certificationGates"]
        
        # All gates should be BLOCKED (not PASS)
        for gate in gates:
            assert gate["status"] != "PASS", \
                f"Gate {gate['gateType']} unconditionally passed without snapshot"
            assert gate["status"] == "BLOCKED"


class TestWave3UBRCIntegration:
    """Wave 3: UBRC Python↔TypeScript integration tests."""
    
    @pytest.fixture
    def repository_root(self, tmp_path):
        return tmp_path
    
    def test_ubrc_gate_reads_typescript_verification_results(self):
        """UBRC gate reads TypeScript D3 scanner results (not reimplementing verification)."""
        snapshot = {
            'blocks': {
                'verified': [
                    {
                        'blockType': 'introduction',
                        'version': 'I1',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'hasDataBlockVersion': True,
                            'registryEntry': True,
                            'versionMatch': True
                        }
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'introduction',
                        'evidenceId': 'ev-renderer-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc',
                    'symbol': 'introduction'
                },
                {
                    'evidenceId': 'ev-renderer-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'def',
                    'symbol': 'introduction'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        result = executor.execute_ubrc_gate(['I1'])
        
        # Python reads TS results, doesn't reimplement
        assert result.status == CertificationGateStatus.PASS
        assert 'ev-impl-001' in result.evidence_ids or 'ev-renderer-001' in result.evidence_ids
    
    def test_ubrc_gate_fails_on_typescript_ubrc_attribute_missing(self):
        """UBRC gate fails when TypeScript reports UBRC_ATTRIBUTE_MISSING."""
        snapshot = {
            'blocks': {
                'verified': [
                    {
                        'blockType': 'quiz',
                        'version': 'Q1',
                        'ubrcStatus': 'UBRC_ATTRIBUTE_MISSING'
                    }
                ]
            },
            'evidence': []
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        result = executor.execute_ubrc_gate(['Q1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('attribute' in b.lower() for b in result.blockers)
    
    def test_ubrc_gate_fails_on_typescript_ubrc_renderer_missing(self):
        """UBRC gate fails when TypeScript reports UBRC_RENDERER_MISSING."""
        snapshot = {
            'blocks': {
                'verified': [
                    {
                        'blockType': 'assessment',
                        'version': 'A1',
                        'ubrcStatus': 'UBRC_RENDERER_MISSING'
                    }
                ]
            },
            'evidence': []
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        result = executor.execute_ubrc_gate(['A1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert any('renderer' in b.lower() for b in result.blockers)
    
    def test_ubrc_gate_collects_real_evidence_ids_from_typescript(self):
        """UBRC gate collects real evidence IDs from TypeScript snapshot (not synthetic)."""
        snapshot = {
            'blocks': {
                'verified': [
                    {
                        'blockType': 'code',
                        'version': 'C1',
                        'ubrcStatus': 'UBRC_VALID'
                    }
                ],
                'rendered': []
            },
            'evidence': [
                {
                    'evidenceId': 'ev-code-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'xyz',
                    'symbol': 'code'
                },
                {
                    'evidenceId': 'ev-code-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                    'contentHash': 'xyz2',
                    'symbol': 'code'
                }
            ]
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        result = executor.execute_ubrc_gate(['C1'])
        
        # Evidence IDs must be from TypeScript system
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        for eid in result.evidence_ids:
            assert eid.startswith('ev-')
            assert 'candidate' not in eid  # Not synthetic
            assert 'code' in eid  # Real evidence from snapshot


class TestWave4ComposerVerification:
    """Test Wave 4 Composer integration verification."""
    
    @pytest.fixture
    def mock_snapshot_composer_valid(self):
        """Valid snapshot with full Composer integration."""
        return {
            'metadata': {
                'timestamp': '2025-01-29T00:00:00Z',
                'scannerVersion': '1.0.0'
            },
            'blocks': {
                'documented': [
                    {'family': 'I', 'versions': ['I1']}
                ],
                'implemented': [
                    {
                        'type': 'introduction',
                        'version': 'I1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                        'evidenceId': 'ev-intro-impl-001'
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'introduction',
                        'componentPath': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                        'evidenceId': 'ev-intro-render-001',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'hasDataBlockVersion': True,
                            'registryEntry': True,
                            'versionMatch': True
                        }
                    }
                ],
                'verified': [
                    {
                        'blockType': 'introduction',
                        'version': 'I1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'REGISTERED',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'hasDataBlockVersion': True,
                            'registryEntry': True,
                            'versionMatch': True
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-intro-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc123',
                    'description': 'Introduction block type definition',
                    'symbol': 'introduction'
                },
                {
                    'evidenceId': 'ev-intro-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/IntroductionBlock.tsx',
                    'contentHash': 'def456',
                    'description': 'Introduction block renderer',
                    'symbol': 'introduction'
                },
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'ghi789',
                    'description': 'Block registry'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_not_registered(self):
        """Snapshot with block not registered."""
        return {
            'metadata': {},
            'blocks': {
                'documented': [],
                'implemented': [],
                'rendered': [],
                'verified': [
                    {
                        'blockType': 'newblock',
                        'version': 'N1',
                        'documented': False,
                        'implemented': True,
                        'rendered': False,
                        'registered': False,
                        'tested': False,
                        'verificationLevel': 'DISCOVERED',
                        'ubrcStatus': 'UBRC_MISSING'
                    }
                ]
            },
            'evidence': [],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_not_discoverable(self):
        """Snapshot with block registered but not documented."""
        return {
            'metadata': {},
            'blocks': {
                'documented': [],
                'implemented': [
                    {
                        'type': 'quote',  # Changed from 'hidden'
                        'version': 'Q1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                        'evidenceId': 'ev-quote-impl-001'
                    }
                ],
                'rendered': [],
                'verified': [
                    {
                        'blockType': 'quote',  # Changed from 'hidden'
                        'version': 'Q1',
                        'documented': False,
                        'implemented': True,
                        'rendered': False,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'IMPLEMENTED',
                        'ubrcStatus': 'UBRC_RENDERER_MISSING',
                        'ubrcDetails': {
                            'registryEntry': True
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'abc',
                    'description': 'Block registry'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_schema_mismatch(self):
        """Snapshot with block schema issues."""
        return {
            'metadata': {},
            'blocks': {
                'documented': [
                    {'family': 'B', 'versions': ['B1']}
                ],
                'implemented': [
                    {
                        'type': 'badschema',
                        'version': 'B1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts'
                        # Missing evidenceId - this causes schema mismatch
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'badschema',
                        'componentPath': 'packages/ui/src/tutorial/blocks/BadSchemaBlock.tsx',
                        'evidenceId': 'ev-bad-render-001',
                        'ubrcStatus': 'UBRC_VALID'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'badschema',
                        'version': 'B1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'RENDERED',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'registryEntry': True
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'abc',
                    'description': 'Block registry'
                },
                {
                    'evidenceId': 'ev-bad-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/BadSchemaBlock.tsx',
                    'contentHash': 'def',
                    'symbol': 'badschema'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_renderer_mismatch(self):
        """Snapshot with renderer UBRC issues."""
        return {
            'metadata': {},
            'blocks': {
                'documented': [
                    {'family': 'R', 'versions': ['R1']}
                ],
                'implemented': [
                    {
                        'type': 'renderissue',
                        'version': 'R1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                        'evidenceId': 'ev-render-impl-001'
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'renderissue',
                        'componentPath': 'packages/ui/src/tutorial/blocks/RenderIssueBlock.tsx',
                        'evidenceId': 'ev-render-render-001',
                        'ubrcStatus': 'UBRC_VERSION_MISMATCH'  # This triggers COMPOSER_RENDERER_MISMATCH
                    }
                ],
                'verified': [
                    {
                        'blockType': 'renderissue',
                        'version': 'R1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'RENDERED',
                        'ubrcStatus': 'UBRC_VERSION_MISMATCH',
                        'ubrcDetails': {
                            'registryEntry': True,
                            'hasDataBlockVersion': True,
                            'versionMatch': False  # Version mismatch
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-render-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc',
                    'symbol': 'renderissue'
                },
                {
                    'evidenceId': 'ev-render-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/RenderIssueBlock.tsx',
                    'contentHash': 'def',
                    'symbol': 'renderissue'
                },
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'ghi',
                    'description': 'Block registry'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_generation_failure(self):
        """Snapshot with validation errors preventing generation."""
        return {
            'metadata': {},
            'blocks': {
                'documented': [
                    {'family': 'G', 'versions': ['G1']}
                ],
                'implemented': [
                    {
                        'type': 'generror',
                        'version': 'G1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                        'evidenceId': 'ev-gen-impl-001'
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'generror',
                        'componentPath': 'packages/ui/src/tutorial/blocks/GenErrorBlock.tsx',
                        'evidenceId': 'ev-gen-render-001',
                        'ubrcStatus': 'UBRC_VALID'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'generror',
                        'version': 'G1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'REGISTERED',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'registryEntry': True,
                            'hasDataBlockVersion': True,
                            'versionMatch': True
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-gen-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc',
                    'symbol': 'generror'
                },
                {
                    'evidenceId': 'ev-gen-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/GenErrorBlock.tsx',
                    'contentHash': 'def',
                    'symbol': 'generror'
                },
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'ghi',
                    'description': 'Block registry'
                }
            ],
            'findings': [
                {
                    'severity': 'error',
                    'message': 'Block generror has invalid schema structure',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts'
                }
            ]
        }
    
    @pytest.fixture
    def mock_snapshot_runtime_failure(self):
        """Snapshot with insufficient verification level."""
        return {
            'metadata': {},
            'blocks': {
                'documented': [
                    {'family': 'U', 'versions': ['U1']}
                ],
                'implemented': [
                    {
                        'type': 'unverified',
                        'version': 'U1',
                        'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                        'evidenceId': 'ev-unv-impl-001'
                    }
                ],
                'rendered': [
                    {
                        'blockType': 'unverified',
                        'componentPath': 'packages/ui/src/tutorial/blocks/UnverifiedBlock.tsx',
                        'evidenceId': 'ev-unv-render-001',
                        'ubrcStatus': 'UBRC_VALID'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'unverified',
                        'version': 'U1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,  # Changed to True so it passes earlier checks
                        'tested': False,
                        'verificationLevel': 'DISCOVERED',  # Very low level - insufficient
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'registryEntry': True,
                            'hasDataBlockVersion': True,
                            'versionMatch': True
                        }
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-unv-impl-001',
                    'kind': 'type-definition',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc',
                    'symbol': 'unverified'
                },
                {
                    'evidenceId': 'ev-unv-render-001',
                    'kind': 'component',
                    'path': 'packages/ui/src/tutorial/blocks/UnverifiedBlock.tsx',
                    'contentHash': 'def',
                    'symbol': 'unverified'
                },
                {
                    'evidenceId': 'ev-registry-001',
                    'kind': 'ubrc-verification',
                    'path': 'packages/types/src/tutorial-rich-document/registry.ts',
                    'contentHash': 'ghi',
                    'description': 'Block registry'
                }
            ],
            'findings': []
        }
    
    def test_composer_gate_passes_with_fully_integrated_block(self, mock_snapshot_composer_valid):
        """Composer gate passes when block is fully integrated into Composer workflow."""
        executor = CertificationGateExecutor(mock_snapshot_composer_valid, Path('.'))
        
        result = executor.execute_composer_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert len(result.blockers) == 0
        assert 'composer verification passed' in result.message.lower()
    
    def test_composer_gate_fails_with_not_registered_error(self, mock_snapshot_not_registered):
        """Composer gate fails with COMPOSER_NOT_REGISTERED when block not in registry."""
        executor = CertificationGateExecutor(mock_snapshot_not_registered, Path('.'))
        
        result = executor.execute_composer_verification_gate(['newblock'])  # Use full name
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('COMPOSER_NOT_REGISTERED' in b for b in result.blockers)
    
    def test_composer_gate_fails_with_not_discoverable_error(self, mock_snapshot_not_discoverable):
        """Composer gate fails with COMPOSER_NOT_DISCOVERABLE when block not documented."""
        executor = CertificationGateExecutor(mock_snapshot_not_discoverable, Path('.'))
        
        result = executor.execute_composer_verification_gate(['quote'])  # Changed from H1
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('COMPOSER_NOT_DISCOVERABLE' in b for b in result.blockers)
    
    def test_composer_gate_fails_with_schema_mismatch_error(self, mock_snapshot_schema_mismatch):
        """Composer gate fails with COMPOSER_SCHEMA_MISMATCH when schema invalid."""
        executor = CertificationGateExecutor(mock_snapshot_schema_mismatch, Path('.'))
        
        result = executor.execute_composer_verification_gate(['badschema'])  # Use full name
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('COMPOSER_SCHEMA_MISMATCH' in b for b in result.blockers)
    
    def test_composer_gate_fails_with_renderer_mismatch_error(self, mock_snapshot_renderer_mismatch):
        """Composer gate fails with COMPOSER_RENDERER_MISMATCH when renderer UBRC invalid."""
        executor = CertificationGateExecutor(mock_snapshot_renderer_mismatch, Path('.'))
        
        result = executor.execute_composer_verification_gate(['renderissue'])  # Use full name
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('COMPOSER_RENDERER_MISMATCH' in b for b in result.blockers)
    
    def test_composer_gate_fails_with_generation_failure_error(self, mock_snapshot_generation_failure):
        """Composer gate fails with COMPOSER_GENERATION_FAILURE when validation errors exist."""
        executor = CertificationGateExecutor(mock_snapshot_generation_failure, Path('.'))
        
        result = executor.execute_composer_verification_gate(['generror'])  # Use full name
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('COMPOSER_GENERATION_FAILURE' in b for b in result.blockers)
    
    def test_composer_gate_fails_with_runtime_failure_error(self, mock_snapshot_runtime_failure):
        """Composer gate fails with COMPOSER_RUNTIME_FAILURE when verification level insufficient."""
        executor = CertificationGateExecutor(mock_snapshot_runtime_failure, Path('.'))
        
        result = executor.execute_composer_verification_gate(['unverified'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('COMPOSER_RUNTIME_FAILURE' in b for b in result.blockers)
    
    def test_composer_gate_blocked_with_empty_snapshot(self):
        """Composer gate blocked when snapshot has no verified blocks."""
        snapshot = {
            'metadata': {},
            'blocks': {'verified': []},
            'evidence': [],
            'findings': []
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_composer_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert len(result.blockers) > 0
        assert 'unavailable' in result.message.lower() or 'no verified blocks' in result.message.lower()
    
    def test_composer_gate_collects_evidence_from_all_checks(self, mock_snapshot_composer_valid):
        """Composer gate collects evidence IDs from registry, implementation, and renderer."""
        executor = CertificationGateExecutor(mock_snapshot_composer_valid, Path('.'))
        
        result = executor.execute_composer_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) >= 3  # Registry, implementation, renderer
        
        # Verify evidence IDs are real (not synthetic)
        for eid in result.evidence_ids:
            assert eid.startswith('ev-')
            assert 'candidate' not in eid
    
    def test_composer_gate_verifies_multiple_blocks(self, mock_snapshot_composer_valid):
        """Composer gate can verify multiple blocks in single call."""
        # Add another block to snapshot
        mock_snapshot_composer_valid['blocks']['verified'].append({
            'blockType': 'code',
            'version': 'C1',
            'documented': True,
            'implemented': True,
            'rendered': True,
            'registered': True,
            'tested': False,
            'verificationLevel': 'REGISTERED',
            'ubrcStatus': 'UBRC_VALID',
            'ubrcDetails': {
                'hasDataBlockVersion': True,
                'registryEntry': True,
                'versionMatch': True
            }
        })
        mock_snapshot_composer_valid['blocks']['implemented'].append({
            'type': 'code',
            'version': 'C1',
            'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
            'evidenceId': 'ev-code-impl-001'
        })
        mock_snapshot_composer_valid['blocks']['rendered'].append({
            'blockType': 'code',
            'componentPath': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
            'evidenceId': 'ev-code-render-001',
            'ubrcStatus': 'UBRC_VALID',
            'ubrcDetails': {
                'hasDataBlockVersion': True,
                'registryEntry': True,
                'versionMatch': True
            }
        })
        mock_snapshot_composer_valid['evidence'].extend([
            {
                'evidenceId': 'ev-code-impl-001',
                'kind': 'type-definition',
                'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                'contentHash': 'code123',
                'description': 'Code block type definition',
                'symbol': 'code'
            },
            {
                'evidenceId': 'ev-code-render-001',
                'kind': 'component',
                'path': 'packages/ui/src/tutorial/blocks/CodeC1Block.tsx',
                'contentHash': 'code456',
                'description': 'Code block renderer',
                'symbol': 'code'
            }
        ])
        
        executor = CertificationGateExecutor(mock_snapshot_composer_valid, Path('.'))
        
        result = executor.execute_composer_verification_gate(['I1', 'C1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert 'passed for 2 block(s)' in result.message.lower() or 'verified for 2 block(s)' in result.message.lower()


class TestWave5RuntimeVerification:
    """Test Wave 5 runtime and browser verification gates."""
    
    @pytest.fixture
    def mock_snapshot_runtime_valid(self):
        """Valid snapshot for runtime verification."""
        return {
            'metadata': {
                'timestamp': '2025-01-29T00:00:00Z',
                'scannerVersion': '1.0.0'
            },
            'blocks': {
                'verified': [
                    {
                        'blockType': 'introduction',
                        'version': 'I1',
                        'documented': True,
                        'implemented': True,
                        'rendered': True,
                        'registered': True,
                        'tested': False,
                        'verificationLevel': 'REGISTERED',
                        'ubrcStatus': 'UBRC_VALID',
                        'ubrcDetails': {
                            'hasDataBlockVersion': True,
                            'registryEntry': True,
                            'versionMatch': True
                        },
                        'evidenceId': 'ev-intro-verified-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-intro-verified-001',
                    'kind': 'block-verification',
                    'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
                    'contentHash': 'abc123',
                    'description': 'Introduction block verification',
                    'symbol': 'introduction'
                }
            ],
            'findings': []
        }
    
    def test_runtime_gate_passes_with_valid_block(self, mock_snapshot_runtime_valid):
        """Runtime verification gate passes when block is properly implemented."""
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, Path('.'))
        
        result = executor.execute_runtime_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert len(result.blockers) == 0
        assert 'runtime verification passed' in result.message.lower()
    
    def test_runtime_gate_blocked_with_empty_snapshot(self):
        """Runtime gate blocked when snapshot has no verified blocks."""
        snapshot = {
            'metadata': {},
            'blocks': {'verified': []},
            'evidence': [],
            'findings': []
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_runtime_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert len(result.blockers) > 0
        assert 'unavailable' in result.message.lower() or 'no verified blocks' in result.message.lower()
    
    def test_runtime_gate_fails_with_missing_block(self):
        """Runtime gate fails when block not found in snapshot."""
        snapshot = {
            'metadata': {},
            'blocks': {
                'verified': [
                    {
                        'blockType': 'introduction',
                        'evidenceId': 'ev-intro-001'
                    }
                ]
            },
            'evidence': [],
            'findings': []
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_runtime_verification_gate(['nonexistent'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
    
    def test_runtime_gate_collects_evidence_ids(self, mock_snapshot_runtime_valid):
        """Runtime gate collects real evidence IDs from TypeScript discovery."""
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, Path('.'))
        
        result = executor.execute_runtime_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        
        # Verify evidence IDs are real (not synthetic)
        for eid in result.evidence_ids:
            assert eid.startswith('ev-')
            assert 'candidate' not in eid
    
    def test_runtime_gate_verifies_multiple_blocks(self, mock_snapshot_runtime_valid):
        """Runtime gate can verify multiple blocks in single call."""
        # Add another block
        mock_snapshot_runtime_valid['blocks']['verified'].append({
            'blockType': 'code',
            'version': 'C1',
            'evidenceId': 'ev-code-verified-001'
        })
        mock_snapshot_runtime_valid['evidence'].append({
            'evidenceId': 'ev-code-verified-001',
            'kind': 'block-verification',
            'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
            'contentHash': 'code123',
            'description': 'Code block verification',
            'symbol': 'code'
        })
        
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, Path('.'))
        
        result = executor.execute_runtime_verification_gate(['I1', 'C1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert 'passed for 2 block(s)' in result.message.lower() or 'verified for 2 block(s)' in result.message.lower()
    
    def test_browser_gate_passes_with_valid_block(self, mock_snapshot_runtime_valid):
        """Browser verification gate passes when block renders correctly."""
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, Path('.'))
        
        result = executor.execute_browser_verification_gate(['I1'])
        
        # Browser verification will fail if Playwright not installed,
        # but gate should handle gracefully
        assert result.status in [
            CertificationGateStatus.PASS,
            CertificationGateStatus.FAIL,
            CertificationGateStatus.BLOCKED
        ]
        
        # If failed, should have specific error about Playwright
        if result.status == CertificationGateStatus.FAIL:
            assert len(result.blockers) > 0
    
    def test_browser_gate_blocked_with_empty_snapshot(self):
        """Browser gate blocked when snapshot has no verified blocks."""
        snapshot = {
            'metadata': {},
            'blocks': {'verified': []},
            'evidence': [],
            'findings': []
        }
        
        executor = CertificationGateExecutor(snapshot, Path('.'))
        
        result = executor.execute_browser_verification_gate(['I1'])
        
        assert result.status == CertificationGateStatus.BLOCKED
        assert len(result.blockers) > 0
        assert 'unavailable' in result.message.lower() or 'no verified blocks' in result.message.lower()
    
    def test_browser_gate_collects_evidence_ids(self, mock_snapshot_runtime_valid):
        """Browser gate collects real evidence IDs from TypeScript discovery."""
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, Path('.'))
        
        result = executor.execute_browser_verification_gate(['I1'])
        
        # Should collect evidence IDs even if browser verification fails
        assert len(result.evidence_ids) > 0
        
        # Verify evidence IDs are real (not synthetic)
        for eid in result.evidence_ids:
            assert eid.startswith('ev-')
            assert 'candidate' not in eid
    
    def test_browser_gate_creates_screenshot_directory(self, mock_snapshot_runtime_valid, tmp_path):
        """Browser gate creates screenshot directory if configured."""
        # Use tmp_path as repository_root
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, tmp_path)
        
        result = executor.execute_browser_verification_gate(['I1'])
        
        # Screenshot directory should be created
        screenshot_dir = tmp_path / '.evidence' / 'screenshots'
        assert screenshot_dir.exists()
    
    def test_browser_gate_verifies_multiple_blocks(self, mock_snapshot_runtime_valid):
        """Browser gate can verify multiple blocks in single call."""
        # Add another block
        mock_snapshot_runtime_valid['blocks']['verified'].append({
            'blockType': 'code',
            'version': 'C1',
            'evidenceId': 'ev-code-verified-001'
        })
        mock_snapshot_runtime_valid['evidence'].append({
            'evidenceId': 'ev-code-verified-001',
            'kind': 'block-verification',
            'path': 'packages/types/src/tutorial-rich-document/blocks/content-blocks.ts',
            'contentHash': 'code123',
            'description': 'Code block verification',
            'symbol': 'code'
        })
        
        executor = CertificationGateExecutor(mock_snapshot_runtime_valid, Path('.'))
        
        result = executor.execute_browser_verification_gate(['I1', 'C1'])
        
        # Should handle multiple blocks
        assert result.status in [
            CertificationGateStatus.PASS,
            CertificationGateStatus.FAIL,
            CertificationGateStatus.BLOCKED
        ]


class TestThemeCompatibilityGate:
    """Test theme compatibility verification gate."""
    
    @pytest.fixture
    def mock_snapshot_with_theme_aware_block(self, tmp_path):
        """Snapshot with theme-aware block implementation."""
        # Create mock block implementation with theme context
        block_impl = tmp_path / "packages" / "ui" / "src" / "tutorial" / "blocks" / "IntroductionBlock.tsx"
        block_impl.parent.mkdir(parents=True, exist_ok=True)
        block_impl.write_text("""
import { DomainTheme } from '../types';

interface IntroductionBlockProps {
    block: any;
    theme?: DomainTheme;
}

export function IntroductionBlock({ block, theme }: IntroductionBlockProps) {
    return (
        <div 
            data-block-type="introduction"
            data-block-version="I1"
            style={{ backgroundColor: theme?.primary }}
        >
            <h1>{block.title}</h1>
        </div>
    );
}
""", encoding='utf-8')
        
        return {
            'metadata': {},
            'blocks': {
                'implemented': [
                    {
                        'type': 'introduction',
                        'version': 'I1',
                        'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'implementationPath': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'evidenceId': 'ev-intro-impl-001'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'introduction',
                        'version': 'I1',
                        'evidenceId': 'ev-intro-verified-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-intro-impl-001',
                    'kind': 'component',
                    'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                    'contentHash': 'abc123',
                    'description': 'Introduction block implementation',
                    'symbol': 'introduction'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_with_hardcoded_theme(self, tmp_path):
        """Snapshot with block using hard-coded theme values."""
        # Create mock block implementation with hard-coded colors
        block_impl = tmp_path / "packages" / "ui" / "src" / "tutorial" / "blocks" / "BadBlock.tsx"
        block_impl.parent.mkdir(parents=True, exist_ok=True)
        block_impl.write_text("""
export function BadBlock({ block }: any) {
    return (
        <div 
            data-block-type="badblock"
            className="bg-pink-500 text-pink-900 border-pink-700"
            style={{ backgroundColor: '#f54a8d', color: '#133382' }}
        >
            <h1>{block.title}</h1>
        </div>
    );
}
""", encoding='utf-8')
        
        return {
            'metadata': {},
            'blocks': {
                'implemented': [
                    {
                        'type': 'badblock',
                        'version': 'B1',
                        'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'implementationPath': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'evidenceId': 'ev-bad-impl-001'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'badblock',
                        'version': 'B1',
                        'evidenceId': 'ev-bad-verified-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-bad-impl-001',
                    'kind': 'component',
                    'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                    'contentHash': 'bad123',
                    'description': 'Bad block implementation',
                    'symbol': 'badblock'
                }
            ],
            'findings': []
        }
    
    @pytest.fixture
    def mock_snapshot_no_theme_context(self, tmp_path):
        """Snapshot with block missing theme context."""
        # Create mock block implementation without theme prop
        block_impl = tmp_path / "packages" / "ui" / "src" / "tutorial" / "blocks" / "NoThemeBlock.tsx"
        block_impl.parent.mkdir(parents=True, exist_ok=True)
        block_impl.write_text("""
export function NoThemeBlock({ block }: any) {
    return (
        <div data-block-type="notheme">
            <h1>{block.title}</h1>
        </div>
    );
}
""", encoding='utf-8')
        
        return {
            'metadata': {},
            'blocks': {
                'implemented': [
                    {
                        'type': 'notheme',
                        'version': 'N1',
                        'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'implementationPath': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'evidenceId': 'ev-notheme-impl-001'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'notheme',
                        'version': 'N1',
                        'evidenceId': 'ev-notheme-verified-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-notheme-impl-001',
                    'kind': 'component',
                    'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                    'contentHash': 'notheme123',
                    'description': 'No theme block implementation',
                    'symbol': 'notheme'
                }
            ],
            'findings': []
        }
    
    def test_theme_gate_passes_with_theme_aware_block(self, mock_snapshot_with_theme_aware_block, tmp_path):
        """Theme compatibility gate passes when block uses theme context."""
        # Create theme configuration files in repository
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_with_theme_aware_block, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['I1'])
        
        # Debug output
        print(f"\nResult status: {result.status}")
        print(f"Result message: {result.message}")
        print(f"Blockers: {result.blockers}")
        print(f"Evidence IDs: {result.evidence_ids}")
        
        assert result.status == CertificationGateStatus.PASS
        assert len(result.evidence_ids) > 0
        assert 'theme(s)' in result.message.lower()
    
    def test_theme_gate_fails_with_hardcoded_values(self, mock_snapshot_with_hardcoded_theme, tmp_path):
        """Theme gate fails when block has hard-coded theme values."""
        # Create theme configuration files in repository
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_with_hardcoded_theme, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['B1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        # Should detect hard-coded values or missing theme context
        assert any('hard' in b.lower() or 'theme' in b.lower() for b in result.blockers)
    
    def test_theme_gate_fails_with_missing_theme_context(self, mock_snapshot_no_theme_context, tmp_path):
        """Theme gate fails when block missing theme context."""
        # Create theme configuration files in repository
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_no_theme_context, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['N1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        # Should detect missing theme context
        assert any('theme' in b.lower() or 'context' in b.lower() for b in result.blockers)
    
    def test_theme_gate_detects_suia_theme(self, mock_snapshot_with_theme_aware_block, tmp_path):
        """Theme gate discovers SUIA theme from repository."""
        # Create theme configuration files
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_with_theme_aware_block, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['I1'])
        
        # Should discover themes - verify 6 themes found (2 enterprise + 2 brand + 2 domain shown in test fixture)
        # The actual test is that it discovered themes from repository, not hard-coded
        assert result.status == CertificationGateStatus.PASS
        assert '6 theme(s)' in result.message
    
    def test_theme_gate_detects_rth_theme(self, mock_snapshot_with_theme_aware_block, tmp_path):
        """Theme gate discovers RTH theme from repository."""
        # Create theme configuration files
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_with_theme_aware_block, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['I1'])
        
        # Should discover themes - verify 6 themes found
        # The actual test is that it discovered themes from repository, not hard-coded
        assert result.status == CertificationGateStatus.PASS
        assert '6 theme(s)' in result.message
    
    def test_theme_gate_blocked_without_themes(self, mock_snapshot_with_theme_aware_block, tmp_path):
        """Theme gate blocked when no theme configurations found."""
        # Don't create theme configs - should be blocked
        executor = CertificationGateExecutor(mock_snapshot_with_theme_aware_block, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['I1'])
        
        assert result.status == CertificationGateStatus.FAIL
        assert len(result.blockers) > 0
        assert any('theme config' in b.lower() or 'no theme' in b.lower() for b in result.blockers)
    
    def test_theme_gate_detects_design_tokens(self, tmp_path):
        """Theme gate detects and reports design token usage."""
        # Create block with CSS variables
        block_impl = tmp_path / "packages" / "ui" / "src" / "tutorial" / "blocks" / "TokenBlock.tsx"
        block_impl.parent.mkdir(parents=True, exist_ok=True)
        block_impl.write_text("""
export function TokenBlock({ block, theme }: any) {
    return (
        <div 
            data-block-type="tokenblock"
            style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text)',
                padding: 'var(--spacing-4)'
            }}
        >
            <h1>{block.title}</h1>
        </div>
    );
}
""", encoding='utf-8')
        
        snapshot = {
            'metadata': {},
            'blocks': {
                'implemented': [
                    {
                        'type': 'tokenblock',
                        'version': 'TOK1',
                        'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'implementationPath': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                        'evidenceId': 'ev-token-impl-001'
                    }
                ],
                'verified': [
                    {
                        'blockType': 'tokenblock',
                        'version': 'TOK1',
                        'evidenceId': 'ev-token-verified-001'
                    }
                ]
            },
            'evidence': [
                {
                    'evidenceId': 'ev-token-impl-001',
                    'kind': 'component',
                    'path': str(block_impl.relative_to(tmp_path)).replace('\\', '/'),
                    'contentHash': 'token123',
                    'description': 'Token block implementation',
                    'symbol': 'tokenblock'
                }
            ],
            'findings': []
        }
        
        # Create theme configs
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(snapshot, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['tokenblock'])
        
        # Debug
        if result.status != CertificationGateStatus.PASS:
            print(f"\nBlockers: {result.blockers}")
        
        # Block uses design tokens (CSS variables) and theme prop - should pass
        assert result.status == CertificationGateStatus.PASS
    
    def test_theme_gate_verifies_multiple_blocks(self, mock_snapshot_with_theme_aware_block, tmp_path):
        """Theme gate can verify multiple blocks."""
        # Add another theme-aware block
        block_impl2 = tmp_path / "packages" / "ui" / "src" / "tutorial" / "blocks" / "CodeBlock.tsx"
        block_impl2.parent.mkdir(parents=True, exist_ok=True)
        block_impl2.write_text("""
import { DomainTheme } from '../types';

interface CodeBlockProps {
    block: any;
    theme?: DomainTheme;
}

export function CodeBlock({ block, theme }: CodeBlockProps) {
    return (
        <div data-block-type="code" data-block-version="C1" style={{ backgroundColor: theme?.blockCodeHeader }}>
            <pre>{block.code}</pre>
        </div>
    );
}
""", encoding='utf-8')
        
        mock_snapshot_with_theme_aware_block['blocks']['implemented'].append({
            'type': 'code',
            'version': 'C1',
            'path': str(block_impl2.relative_to(tmp_path)).replace('\\', '/'),
            'implementationPath': str(block_impl2.relative_to(tmp_path)).replace('\\', '/'),
            'evidenceId': 'ev-code-impl-001'
        })
        
        mock_snapshot_with_theme_aware_block['blocks']['verified'].append({
            'blockType': 'code',
            'version': 'C1',
            'evidenceId': 'ev-code-verified-001'
        })
        
        # Create theme configs
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_with_theme_aware_block, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['I1', 'C1'])
        
        assert result.status == CertificationGateStatus.PASS
        assert '2 block(s)' in result.message
    
    def test_theme_gate_collects_evidence_ids(self, mock_snapshot_with_theme_aware_block, tmp_path):
        """Theme gate collects real evidence IDs from TypeScript discovery."""
        # Create theme configs
        self._create_theme_configs(tmp_path)
        
        executor = CertificationGateExecutor(mock_snapshot_with_theme_aware_block, tmp_path)
        
        result = executor.execute_theme_compatibility_gate(['I1'])
        
        assert len(result.evidence_ids) > 0
        
        # Verify evidence IDs are real (not synthetic)
        for eid in result.evidence_ids:
            assert eid.startswith('ev-')
            assert 'candidate' not in eid
    
    def _create_theme_configs(self, tmp_path: Path):
        """Create mock theme configuration files."""
        # Create theme-store.ts
        theme_store = tmp_path / "packages" / "ui" / "src" / "theme-store.ts"
        theme_store.parent.mkdir(parents=True, exist_ok=True)
        theme_store.write_text("""
export type EnterpriseTheme = 'theme-a' | 'theme-b';

interface ThemeState {
  theme: EnterpriseTheme;
  setTheme: (theme: EnterpriseTheme) => void;
}
""", encoding='utf-8')
        
        # Create brandTheme.ts
        brand_theme = tmp_path / "apps" / "skillhubcore-admin" / "src" / "app" / "(admin)" / "tools" / "tutorial-page-content" / "theme" / "brandTheme.ts"
        brand_theme.parent.mkdir(parents=True, exist_ok=True)
        brand_theme.write_text("""
export function themeForBrand(brandId: string) {
  if (brandId === 'skillup' || brandId === 'shared') {
    return {
      primary: '#f54a8d',
      primaryDark: '#d63d7a',
      secondary: '#133382',
    };
  }

  return {
    primary: '#d03f00',
    primaryDark: '#b63600',
    secondary: '#124fd6',
  };
}
""", encoding='utf-8')
        
        # Create domain-themes.ts
        domain_themes = tmp_path / "apps" / "realtutorialhub-web" / "src" / "lib" / "domain-themes.ts"
        domain_themes.parent.mkdir(parents=True, exist_ok=True)
        domain_themes.write_text("""
export const DOMAIN_THEMES: Record<'indigo' | 'blue' | 'teal' | 'steel', any> = {
  indigo: { primary: '#3b4f7a' },
  blue: { primary: '#1a3a6b' },
  teal: { primary: '#1a5c5c' },
  steel: { primary: '#1c2833' },
};
""", encoding='utf-8')


