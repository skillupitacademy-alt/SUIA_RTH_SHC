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
        test_file = repository_root / "TestComponent.tsx"
        test_file.write_text(
            "const styles = { color: 'var(--text-primary)' }; className='text-primary'",
            encoding='utf-8'
        )
        
        # Add evidence for this file
        mock_snapshot_valid['evidence'].append({
            'evidenceId': 'ev-test-002',
            'kind': 'component',
            'path': 'TestComponent.tsx',
            'contentHash': 'test456',
            'description': 'Test component'
        })
        
        executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
        
        result = executor.execute_theme_compatibility_gate(['TestComponent.tsx'])
        
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
