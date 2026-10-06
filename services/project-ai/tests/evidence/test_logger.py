"""
Tests for Evidence Logger

Validates:
- Run directory creation with correct structure
- Metadata generation
- Snapshot copying
- Gate result logging
- Agent result logging
- Current symlink/fallback handling
"""

import json
import tempfile
from datetime import datetime, UTC
from pathlib import Path

import pytest

from app.evidence.logger import EvidenceLogger
from app.models.evidence import EvidenceRecord


@pytest.fixture
def temp_repo():
    """Create temporary repository structure for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_root = Path(tmpdir)
        
        # Create minimal snapshot
        snapshot_dir = repo_root / 'packages' / 'project-llm-discovery' / 'output'
        snapshot_dir.mkdir(parents=True)
        
        snapshot_data = {
            'schemaVersion': '1.1.0',
            'repository': {
                'owner': 'test',
                'name': 'test-repo',
                'commitSha': 'abc123def456',
                'scanTimestamp': datetime.now(UTC).isoformat()
            },
            'structure': {},
            'runtime': {},
            'blocks': {},
            'composer': {},
            'dependencies': {},
            'tests': {},
            'evidence': [
                {
                    'evidenceId': 'evidence-test001',
                    'scannerName': 'd1-structure-scanner',
                    'timestamp': datetime.now(UTC).isoformat(),
                    'path': 'src/test.ts',
                    'kind': 'file',
                    'claim': 'Test file exists',
                    'locator': 'file:src/test.ts',
                    'contentHash': 'abc123',
                    'lifecycle': 'current'
                }
            ],
            'findings': [],
            'canonicalHash': 'snapshot-hash-abc123'
        }
        
        snapshot_path = snapshot_dir / 'snapshot.json'
        snapshot_path.write_text(json.dumps(snapshot_data, indent=2), encoding='utf-8')
        
        yield repo_root, snapshot_path, snapshot_data


def test_run_directory_creation(temp_repo):
    """Test that run directory structure is created correctly."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    # Verify run directory exists
    assert run_dir.exists()
    assert run_dir.is_dir()
    
    # Verify subdirectories created
    expected_subdirs = ['gates', 'agents', 'screenshots', 'commands', 'logs', 'results', 'browser', 'final']
    for subdir in expected_subdirs:
        assert (run_dir / subdir).exists()
        assert (run_dir / subdir).is_dir()
    
    # Verify metadata.json exists
    metadata_file = run_dir / 'metadata.json'
    assert metadata_file.exists()
    
    # Verify snapshot.json copied
    snapshot_copy = run_dir / 'snapshot.json'
    assert snapshot_copy.exists()


def test_metadata_generation(temp_repo):
    """Test that metadata.json is valid and complete."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    metadata_file = run_dir / 'metadata.json'
    metadata = json.loads(metadata_file.read_text(encoding='utf-8'))
    
    # Verify required fields
    assert 'runId' in metadata
    assert metadata['commitSha'] == commit_sha
    assert metadata['snapshotHash'] == snapshot_hash
    assert 'branch' in metadata
    assert 'timestamp' in metadata
    assert 'snapshotPath' in metadata
    assert metadata['evidenceCount'] == 1
    assert metadata['status'] == 'in-progress'
    
    # Verify 2-space indentation
    metadata_text = metadata_file.read_text(encoding='utf-8')
    # Check for 2-space indent (first nested key should have 2 spaces)
    assert '\n  "runId"' in metadata_text or '\n  "commitSha"' in metadata_text


def test_snapshot_copy(temp_repo):
    """Test that snapshot.json is correctly copied to run directory."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    snapshot_copy = run_dir / 'snapshot.json'
    assert snapshot_copy.exists()
    
    # Verify content matches original
    copied_data = json.loads(snapshot_copy.read_text(encoding='utf-8'))
    assert copied_data['schemaVersion'] == snapshot_data['schemaVersion']
    assert copied_data['canonicalHash'] == snapshot_data['canonicalHash']
    assert len(copied_data['evidence']) == len(snapshot_data['evidence'])


def test_gate_result_logging(temp_repo):
    """Test that gate results are logged correctly."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    # Log gate result
    gate_result = {
        'gateId': 'ubrc-compliance',
        'status': 'PASS',
        'message': 'UBRC compliance verified',
        'evidenceIds': ['evidence-test001'],
        'blockers': []
    }
    
    gate_file = logger.log_gate_result(run_dir, 'ubrc', gate_result)
    
    # Verify file created
    assert gate_file.exists()
    assert gate_file.name == 'ubrc.json'
    
    # Verify content
    logged_result = json.loads(gate_file.read_text(encoding='utf-8'))
    assert logged_result['gateId'] == 'ubrc-compliance'
    assert logged_result['status'] == 'PASS'
    assert 'timestamp' in logged_result
    
    # Verify 2-space indentation
    gate_text = gate_file.read_text(encoding='utf-8')
    assert '\n  "gateId"' in gate_text or '\n  "status"' in gate_text


def test_agent_result_logging(temp_repo):
    """Test that agent results are logged correctly."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    # Log agent result
    agent_result = {
        'agentId': 'repository-auditor',
        'status': 'SUCCESS',
        'outputs': {'applications': 11},
        'evidenceIds': ['evidence-test001'],
        'errors': [],
        'warnings': [],
        'executionTimeMs': 1250.5
    }
    
    agent_file = logger.log_agent_result(run_dir, agent_result)
    
    # Verify file created
    assert agent_file.exists()
    assert agent_file.name == 'repository-auditor.json'
    
    # Verify content
    logged_result = json.loads(agent_file.read_text(encoding='utf-8'))
    assert logged_result['agentId'] == 'repository-auditor'
    assert logged_result['status'] == 'SUCCESS'
    assert 'timestamp' in logged_result
    
    # Verify 2-space indentation
    agent_text = agent_file.read_text(encoding='utf-8')
    assert '\n  "agentId"' in agent_text or '\n  "status"' in agent_text


def test_current_symlink_update(temp_repo):
    """Test that current symlink is updated correctly."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    # Get current run directory
    current_run = logger.get_current_run_dir()
    
    # Verify current points to created run
    assert current_run is not None
    assert current_run.name == run_dir.name


def test_current_fallback_windows(temp_repo):
    """Test that current.txt fallback works when symlinks unavailable."""
    repo_root, snapshot_path, snapshot_data = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    
    run_dir = logger.create_run_directory(commit_sha, snapshot_hash, snapshot_path)
    
    # Verify either symlink or current.txt exists
    current_link = logger.runs_dir / 'current'
    current_txt = logger.runs_dir / 'current.txt'
    
    assert current_link.exists() or current_txt.exists()
    
    # If current.txt exists, verify it points to correct run
    if current_txt.exists():
        run_id = current_txt.read_text(encoding='utf-8').strip()
        assert run_id == run_dir.name


def test_snapshot_not_found_error(temp_repo):
    """Test that FileNotFoundError raised when snapshot doesn't exist."""
    repo_root, _, _ = temp_repo
    logger = EvidenceLogger(repo_root)
    
    commit_sha = 'abc123def456'
    snapshot_hash = 'snapshot-hash-abc123'
    fake_snapshot_path = repo_root / 'nonexistent' / 'snapshot.json'
    
    with pytest.raises(FileNotFoundError):
        logger.create_run_directory(commit_sha, snapshot_hash, fake_snapshot_path)


def test_evidence_record_from_snapshot(temp_repo):
    """Test EvidenceRecord.from_snapshot() parsing."""
    _, _, snapshot_data = temp_repo
    
    evidence_dict = snapshot_data['evidence'][0]
    record = EvidenceRecord.from_snapshot(evidence_dict)
    
    assert record.evidence_id == 'evidence-test001'
    assert record.scanner_name == 'd1-structure-scanner'
    assert record.path == 'src/test.ts'
    assert record.kind == 'file'
    assert record.lifecycle == 'current'


def test_evidence_record_to_dict(temp_repo):
    """Test EvidenceRecord.to_dict() serialization."""
    _, _, snapshot_data = temp_repo
    
    evidence_dict = snapshot_data['evidence'][0]
    record = EvidenceRecord.from_snapshot(evidence_dict)
    
    serialized = record.to_dict()
    
    assert serialized['evidenceId'] == 'evidence-test001'
    assert serialized['scannerName'] == 'd1-structure-scanner'
    assert serialized['path'] == 'src/test.ts'
    assert 'evidenceId' in serialized  # camelCase key
