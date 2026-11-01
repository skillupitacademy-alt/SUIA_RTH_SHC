"""Worker safety checks that do not connect to Docker or a database."""

import asyncio
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.verification.worker_slot import serialize_verification, verification_slot
from app.verification.fixture_environment import verification_database_url
from app.verification.fixture_registry import FixtureBlockedError


def test_slot_excludes_another_job_and_releases_after_error(monkeypatch, tmp_path):
    monkeypatch.setenv('PROJECT_AI_STATE_DIR', str(tmp_path))
    with pytest.raises(ValueError):
        with verification_slot():
            with pytest.raises(HTTPException) as busy:
                with verification_slot():
                    pytest.fail('Second job acquired an occupied slot')
            assert busy.value.status_code == 409
            raise ValueError('job failed')
    with verification_slot():
        pass


def test_decorator_preserves_signature_and_serializes(monkeypatch, tmp_path):
    monkeypatch.setenv('PROJECT_AI_STATE_DIR', str(tmp_path))
    monkeypatch.setenv('PROJECT_AI_SERIAL_VERIFICATION', 'true')

    @serialize_verification
    async def operation(value: int):
        with pytest.raises(HTTPException):
            with verification_slot():
                pytest.fail('Decorator did not acquire lock')
        return value

    assert operation.__name__ == 'operation'
    assert asyncio.run(operation(7)) == 7


def test_worker_mode_still_requires_explicit_fixture_permission(monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('PROJECT_LLM_EXECUTION_MODE', 'isolated_worker')
    monkeypatch.setenv('PROJECT_LLM_VERIFICATION_DATABASE_URL', 'postgresql://test:test@example.invalid/test')
    monkeypatch.delenv('PROJECT_LLM_LOCAL_VERIFICATION', raising=False)
    monkeypatch.delenv('PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED', raising=False)
    with pytest.raises(FixtureBlockedError, match='explicit permission'):
        verification_database_url()
    monkeypatch.setenv('PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED', 'true')
    assert verification_database_url().endswith('/test')


@pytest.mark.parametrize('is_leader', [True, False])
def test_linux_cleanup_never_kills_workers_shared_process_group(is_leader):
    from app.verification import composer_worktree_verifier as verifier
    import signal
    with patch.object(signal, 'SIGKILL', 9, create=True), \
         patch.object(verifier.os, 'name', 'posix'), \
         patch.object(verifier.os, 'getpgid', return_value=123 if is_leader else 999, create=True), \
         patch.object(verifier.os, 'killpg', create=True) as kill_group, \
         patch.object(verifier.os, 'kill') as kill:
        verifier._kill_process_tree(123)
    if is_leader:
        kill_group.assert_called_once_with(123, 9)
        kill.assert_not_called()
    else:
        kill.assert_called_once_with(123, 9)
        kill_group.assert_not_called()


def test_deployment_compose_contract():
    import yaml
    root = Path(__file__).resolve().parents[4]
    for directory in ('compose', 'runtime'):
        config = yaml.safe_load((root / f'infra/hostinger/{directory}/docker-compose.yml').read_text())
        worker = config['services']['project-ai']
        assert worker['profiles'] == ['project-llm']
        assert worker['user'] == '1000:1000'
        assert 'ports' not in worker
        assert not any('docker.sock' in mount for mount in worker['volumes'])
        assert worker['environment']['PROJECT_AI_SERIAL_VERIFICATION'] == 'true'
        assert 'skillup.localhost:127.0.0.1' in worker['extra_hosts']
        assert ('build' in worker) == (directory == 'compose')


def test_runtime_snapshot_override_fails_closed_if_missing(monkeypatch, tmp_path):
    from app.repository.discovery_client import DiscoveryClient
    source = tmp_path / 'source.json'
    source.write_text('{}')
    runtime = tmp_path / 'runtime.json'
    monkeypatch.setenv('PROJECT_AI_SNAPSHOT_PATH', str(runtime))
    client = DiscoveryClient(source)
    assert client.snapshot_path == runtime
    with pytest.raises(FileNotFoundError):
        client.load_snapshot()


def test_contract_read_and_hash_use_same_runtime_snapshot(monkeypatch, tmp_path):
    import hashlib
    from app.api.routes.contract import load_repository_snapshot, calculate_snapshot_sha256
    runtime = tmp_path / 'snapshot.json'
    payload = b'{"repository":{"commitSha":"native-worker-commit"}}'
    runtime.write_bytes(payload)
    monkeypatch.setenv('PROJECT_AI_SNAPSHOT_PATH', str(runtime))
    assert load_repository_snapshot(str(tmp_path))['repository']['commitSha'] == 'native-worker-commit'
    assert calculate_snapshot_sha256(str(tmp_path)) == hashlib.sha256(payload).hexdigest()
