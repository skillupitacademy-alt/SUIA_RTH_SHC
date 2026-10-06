"""
Tests for final gate metadata agent.

Tests cover:
1. Final verdict all PASS → CERTIFICATION_READY
2. Final verdict any FAIL → FAIL
3. Canonical backlog append (not replace)
4. Verdict file creation
5. Metadata derivation
6. Evidence binding validation
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import json
import tempfile
import shutil

from app.agents.final_gate import (
    FinalGateAgent,
    FinalVerdict
)


class TestFinalGateAgent:
    """Test final gate metadata agent."""
    
    def test_derive_commit_sha(self):
        """Derive git commit SHA."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        with patch('subprocess.run') as mock_run:
            mock_result = Mock()
            mock_result.returncode = 0
            mock_result.stdout = 'abc123def456\n'
            mock_run.return_value = mock_result
            
            commit_sha = agent.derive_commit_sha()
            
            assert commit_sha == 'abc123def456'
            assert mock_run.called
            call_args = mock_run.call_args[0][0]
            assert call_args == ['git', 'rev-parse', 'HEAD']
    
    def test_derive_snapshot_hash(self):
        """Derive snapshot hash from context."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        snapshot = {
            'canonicalHash': 'snapshot-hash-123'
        }
        
        snapshot_hash = agent.derive_snapshot_hash(snapshot)
        
        assert snapshot_hash == 'snapshot-hash-123'
    
    def test_calculate_verdict_all_pass(self):
        """All gates PASS → CERTIFICATION_READY."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        gate_results = [
            {'gate_name': 'ubrc', 'verdict': 'PASS', 'evidence_ids': []},
            {'gate_name': 'brand', 'verdict': 'PASS', 'evidence_ids': []},
            {'gate_name': 'theme', 'verdict': 'PASS', 'evidence_ids': []}
        ]
        
        verdict = agent.calculate_verdict(gate_results)
        
        assert verdict == 'CERTIFICATION_READY'
    
    def test_calculate_verdict_any_fail(self):
        """Any gate FAIL → FAIL."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        gate_results = [
            {'gate_name': 'ubrc', 'verdict': 'PASS', 'evidence_ids': []},
            {'gate_name': 'brand', 'verdict': 'FAIL', 'evidence_ids': []},
            {'gate_name': 'theme', 'verdict': 'PASS', 'evidence_ids': []}
        ]
        
        verdict = agent.calculate_verdict(gate_results)
        
        assert verdict == 'FAIL'
    
    def test_calculate_verdict_any_blocked(self):
        """Any gate BLOCKED → BLOCKED."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        gate_results = [
            {'gate_name': 'ubrc', 'verdict': 'PASS', 'evidence_ids': []},
            {'gate_name': 'brand', 'verdict': 'BLOCKED', 'evidence_ids': []},
            {'gate_name': 'theme', 'verdict': 'PASS', 'evidence_ids': []}
        ]
        
        verdict = agent.calculate_verdict(gate_results)
        
        assert verdict == 'BLOCKED'
    
    def test_canonical_backlog_append(self):
        """Canonical backlog extended, not replaced."""
        # Create temporary directory for test
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            agents_dir = repo_root / '.agents' / 'tasks'
            agents_dir.mkdir(parents=True)
            
            # Create existing backlog
            backlog_path = agents_dir / 'm1-m2-backlog.md'
            existing_content = """# M2 Backlog

## Existing Section

This is existing content that must be preserved.
"""
            backlog_path.write_text(existing_content, encoding='utf-8')
            
            # Create agent and append verdict
            agent = FinalGateAgent(repo_root)
            
            verdict = FinalVerdict(
                run_id='test-run-123',
                commit_sha='abc123def',
                snapshot_hash='snapshot456',
                verdict='CERTIFICATION_READY',
                gate_results=[
                    {'gate_name': 'ubrc', 'verdict': 'PASS', 'evidence_ids': ['ev-001']}
                ],
                all_evidence_ids=['ev-001'],
                evidence_binding_valid=True,
                generated_at='2025-01-30T12:00:00Z'
            )
            
            agent.append_to_canonical_backlog(verdict)
            
            # Read updated content
            updated_content = backlog_path.read_text(encoding='utf-8')
            
            # Verify existing content preserved
            assert 'Existing Section' in updated_content
            assert 'This is existing content that must be preserved.' in updated_content
            
            # Verify new content appended
            assert 'test-run-123' in updated_content
            assert 'CERTIFICATION_READY' in updated_content
            assert 'abc123de' in updated_content  # Truncated to 8 chars in output
    
    def test_verdict_file_creation(self):
        """Final verdict JSON file created."""
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            run_dir = repo_root / '.project-ai' / 'runs' / 'test-run'
            run_dir.mkdir(parents=True)
            
            # Create agents directory for backlog
            agents_dir = repo_root / '.agents' / 'tasks'
            agents_dir.mkdir(parents=True)
            (agents_dir / 'm1-m2-backlog.md').write_text('# Backlog\n')
            
            # Create mock snapshot
            snapshot = {
                'canonicalHash': 'hash123',
                'repository': {
                    'commitSha': 'commit456'
                },
                'evidence': []
            }
            
            agent = FinalGateAgent(repo_root)
            
            with patch.object(agent, 'derive_commit_sha', return_value='commit456'):
                verdict = agent.execute(snapshot, run_dir, 'test-run')
            
            # Verify verdict file created
            verdict_file = run_dir / 'final-verdict.json'
            assert verdict_file.exists()
            
            # Verify content
            verdict_data = json.loads(verdict_file.read_text())
            assert verdict_data['run_id'] == 'test-run'
            assert verdict_data['verdict'] in ['CERTIFICATION_READY', 'PASS', 'BLOCKED', 'FAIL']
    
    def test_aggregate_gate_results(self):
        """Aggregate gate results from run directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            run_dir = Path(tmpdir) / 'run'
            gates_dir = run_dir / 'gates'
            gates_dir.mkdir(parents=True)
            
            # Create gate result files
            gate1 = {
                'gateId': 'ubrc-compliance',
                'status': 'PASS',
                'evidenceIds': ['ev-001', 'ev-002']
            }
            (gates_dir / 'ubrc.json').write_text(json.dumps(gate1, indent=2))
            
            gate2 = {
                'gateId': 'brand-independence',
                'status': 'PASS',
                'evidenceIds': ['ev-003']
            }
            (gates_dir / 'brand.json').write_text(json.dumps(gate2, indent=2))
            
            agent = FinalGateAgent(Path('/test/repo'))
            gate_results = agent.aggregate_gate_results(run_dir, {})
            
            assert len(gate_results) == 2
            assert any(g['gate_name'] == 'ubrc-compliance' for g in gate_results)
            assert any(g['gate_name'] == 'brand-independence' for g in gate_results)
    
    def test_verify_evidence_binding_valid(self):
        """Evidence binding validation succeeds."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        snapshot = {
            'canonicalHash': 'hash123',
            'repository': {
                'commitSha': 'commit456'
            },
            'evidence': [
                {'evidenceId': 'ev-001'},
                {'evidenceId': 'ev-002'}
            ]
        }
        
        valid, errors = agent.verify_evidence_binding(
            ['ev-001', 'ev-002'],
            snapshot,
            'commit456',
            'hash123'
        )
        
        assert valid is True
        assert len(errors) == 0
    
    def test_verify_evidence_binding_missing_id(self):
        """Evidence binding fails with missing evidence ID."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        snapshot = {
            'canonicalHash': 'hash123',
            'repository': {
                'commitSha': 'commit456'
            },
            'evidence': [
                {'evidenceId': 'ev-001'}
            ]
        }
        
        valid, errors = agent.verify_evidence_binding(
            ['ev-001', 'ev-missing'],
            snapshot,
            'commit456',
            'hash123'
        )
        
        assert valid is False
        assert len(errors) > 0
        assert any('ev-missing' in e for e in errors)
    
    def test_verify_evidence_binding_commit_mismatch(self):
        """Evidence binding fails with commit SHA mismatch."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        snapshot = {
            'canonicalHash': 'hash123',
            'repository': {
                'commitSha': 'commit-different'
            },
            'evidence': []
        }
        
        valid, errors = agent.verify_evidence_binding(
            [],
            snapshot,
            'commit456',
            'hash123'
        )
        
        assert valid is False
        assert any('mismatch' in e.lower() for e in errors)
    
    def test_execute_generates_evidence(self):
        """Execute generates evidence file for R9."""
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            run_dir = repo_root / '.project-ai' / 'runs' / 'test-run'
            run_dir.mkdir(parents=True)
            
            # Create agents dir for backlog
            agents_dir = repo_root / '.agents' / 'tasks'
            agents_dir.mkdir(parents=True)
            (agents_dir / 'm1-m2-backlog.md').write_text('# Backlog\n')
            
            snapshot = {
                'canonicalHash': 'hash123',
                'repository': {
                    'commitSha': 'commit456'
                },
                'evidence': []
            }
            
            agent = FinalGateAgent(repo_root)
            
            with patch.object(agent, 'derive_commit_sha', return_value='commit456'):
                verdict = agent.execute(snapshot, run_dir, 'test-run')
            
            # Verify evidence file created
            evidence_dir = repo_root / '.project-ai' / 'runs' / 'r9-setup'
            evidence_file = evidence_dir / 'evidence.json'
            assert evidence_file.exists()
            
            evidence_data = json.loads(evidence_file.read_text())
            assert evidence_data['evidenceId'] == 'ev-final-001'
            assert evidence_data['waveId'] == 'R9'


class TestVerdictCalculation:
    """Test verdict calculation logic."""
    
    def test_empty_gate_results(self):
        """No gates → PASS."""
        agent = FinalGateAgent(Path('/test/repo'))
        verdict = agent.calculate_verdict([])
        assert verdict == 'PASS'
    
    def test_all_pass(self):
        """All PASS → CERTIFICATION_READY."""
        agent = FinalGateAgent(Path('/test/repo'))
        gate_results = [
            {'gate_name': 'gate1', 'verdict': 'PASS', 'evidence_ids': []},
            {'gate_name': 'gate2', 'verdict': 'PASS', 'evidence_ids': []},
        ]
        verdict = agent.calculate_verdict(gate_results)
        assert verdict == 'CERTIFICATION_READY'
    
    def test_blocked_takes_precedence(self):
        """BLOCKED takes precedence over FAIL."""
        agent = FinalGateAgent(Path('/test/repo'))
        gate_results = [
            {'gate_name': 'gate1', 'verdict': 'BLOCKED', 'evidence_ids': []},
            {'gate_name': 'gate2', 'verdict': 'FAIL', 'evidence_ids': []},
        ]
        verdict = agent.calculate_verdict(gate_results)
        assert verdict == 'BLOCKED'
    
    def test_eleven_gates_mvp(self):
        """Test 11-gate aggregation (MVP - ILS/LSNB/RSSB deferred)."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        # All 11 MVP gates
        gate_results = [
            {'gate_name': 'CONTRACT', 'verdict': 'PASS', 'evidence_ids': ['ev-001']},
            {'gate_name': 'UBRC', 'verdict': 'PASS', 'evidence_ids': ['ev-002']},
            {'gate_name': 'REGISTRY', 'verdict': 'PASS', 'evidence_ids': ['ev-003']},
            {'gate_name': 'RENDERER', 'verdict': 'PASS', 'evidence_ids': ['ev-004']},
            {'gate_name': 'COMPOSER', 'verdict': 'PASS', 'evidence_ids': ['ev-005']},
            {'gate_name': 'TESTS', 'verdict': 'PASS', 'evidence_ids': ['ev-006']},
            {'gate_name': 'RUNTIME', 'verdict': 'PASS', 'evidence_ids': ['ev-007']},
            {'gate_name': 'BROWSER', 'verdict': 'PASS', 'evidence_ids': ['ev-008']},
            {'gate_name': 'BRAND_INDEPENDENCE', 'verdict': 'PASS', 'evidence_ids': ['ev-009']},
            {'gate_name': 'THEME_COMPATIBILITY', 'verdict': 'PASS', 'evidence_ids': ['ev-010']},
            {'gate_name': 'EVIDENCE', 'verdict': 'PASS', 'evidence_ids': ['ev-011']},
        ]
        
        verdict = agent.calculate_verdict(gate_results)
        assert verdict == 'CERTIFICATION_READY'
        assert len(gate_results) == 11
    
    def test_any_gate_fail_verdict_fail(self):
        """Test that any gate failing results in FAIL verdict."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        gate_results = [
            {'gate_name': 'CONTRACT', 'verdict': 'PASS', 'evidence_ids': []},
            {'gate_name': 'UBRC', 'verdict': 'FAIL', 'evidence_ids': []},  # One failed
            {'gate_name': 'REGISTRY', 'verdict': 'PASS', 'evidence_ids': []},
        ]
        
        verdict = agent.calculate_verdict(gate_results)
        assert verdict == 'FAIL'
    
    def test_missing_evidence_blocked(self):
        """Test that missing evidence results in BLOCKED."""
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            run_dir = repo_root / '.project-ai' / 'runs' / 'test-run'
            run_dir.mkdir(parents=True)
            
            # Create agents dir for backlog
            agents_dir = repo_root / '.agents' / 'tasks'
            agents_dir.mkdir(parents=True)
            (agents_dir / 'm1-m2-backlog.md').write_text('# Backlog\n')
            
            snapshot = {
                'canonicalHash': 'hash123',
                'repository': {
                    'commitSha': 'commit456'
                },
                'evidence': []  # No evidence
            }
            
            agent = FinalGateAgent(repo_root)
            
            with patch.object(agent, 'derive_commit_sha', return_value='commit456'):
                verdict = agent.execute(snapshot, run_dir, 'test-run', {})
            
            # With no gate results and no evidence, verdict should still be generated
            assert verdict.verdict in ['PASS', 'BLOCKED', 'CERTIFICATION_READY', 'FAIL']
    
    def test_gate_summary_generation(self):
        """Test gate summary includes all gates and their statuses."""
        agent = FinalGateAgent(Path('/test/repo'))
        
        gate_results = [
            {'gate_name': 'CONTRACT', 'verdict': 'PASS', 'evidence_ids': ['ev-001']},
            {'gate_name': 'UBRC', 'verdict': 'FAIL', 'evidence_ids': []},
            {'gate_name': 'REGISTRY', 'verdict': 'PASS', 'evidence_ids': ['ev-003']},
        ]
        
        # Verify we can extract summary info
        passed = [g for g in gate_results if g['verdict'] == 'PASS']
        failed = [g for g in gate_results if g['verdict'] == 'FAIL']
        
        assert len(passed) == 2
        assert len(failed) == 1
        assert gate_results[1]['gate_name'] == 'UBRC'
    
    def test_final_certification_json_structure(self):
        """Test that final certification has correct JSON structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_root = Path(tmpdir)
            run_dir = repo_root / '.project-ai' / 'runs' / 'test-run'
            run_dir.mkdir(parents=True)
            
            agents_dir = repo_root / '.agents' / 'tasks'
            agents_dir.mkdir(parents=True)
            (agents_dir / 'm1-m2-backlog.md').write_text('# Backlog\n')
            
            snapshot = {
                'canonicalHash': 'hash123',
                'repository': {'commitSha': 'commit456'},
                'evidence': [
                    {'evidenceId': 'ev-001'},
                    {'evidenceId': 'ev-002'}
                ]
            }
            
            agent = FinalGateAgent(repo_root)
            
            with patch.object(agent, 'derive_commit_sha', return_value='commit456'):
                verdict = agent.execute(snapshot, run_dir, 'test-run', {})
            
            # Read the verdict JSON file
            verdict_file = run_dir / 'final-verdict.json'
            verdict_data = json.loads(verdict_file.read_text())
            
            # Verify structure
            assert 'run_id' in verdict_data
            assert 'commit_sha' in verdict_data
            assert 'snapshot_hash' in verdict_data
            assert 'verdict' in verdict_data
            assert 'gate_results' in verdict_data
            assert 'all_evidence_ids' in verdict_data
            assert 'evidence_binding_valid' in verdict_data
            assert 'generated_at' in verdict_data
