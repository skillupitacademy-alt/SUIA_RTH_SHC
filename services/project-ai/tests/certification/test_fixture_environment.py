import pytest
from app.verification.fixture_environment import verification_database_url
from app.verification.fixture_registry import FixtureBlockedError
from app.verification.fixture_setup import fixture_catalog, identity, FIXTURE_ID


def test_fixture_database_never_falls_back_to_authoring_database(monkeypatch):
    monkeypatch.delenv('PROJECT_LLM_VERIFICATION_DATABASE_URL', raising=False)
    monkeypatch.setenv('DATABASE_URL_TUTORIAL', 'postgresql://unused:unused@localhost/authoring')
    with pytest.raises(FixtureBlockedError, match='not configured'):
        verification_database_url()


def test_remote_database_requires_explicit_fixture_write_permission(monkeypatch):
    monkeypatch.setenv('PROJECT_LLM_VERIFICATION_DATABASE_URL', 'postgresql://unused:unused@example.invalid/tutorial')
    monkeypatch.delenv('PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED', raising=False)
    with pytest.raises(FixtureBlockedError, match='explicit permission'):
        verification_database_url()


def test_configured_local_runner_can_use_explicitly_approved_remote_database(monkeypatch):
    url = 'postgresql://unused:unused@example.invalid/tutorial'
    monkeypatch.setenv('PROJECT_LLM_VERIFICATION_DATABASE_URL', url)
    monkeypatch.setenv('PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED', 'true')
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('PROJECT_LLM_LOCAL_VERIFICATION', 'true')
    assert verification_database_url() == url


def test_fixture_setup_has_stable_ids_and_real_ils_paths():
    fixture = fixture_catalog()[FIXTURE_ID]
    assert fixture['section_id'] == identity('section')
    assert fixture['progress_contract']['visit_endpoint_pattern'] == '/api/tutorial/ils/visit'
    assert fixture['progress_contract']['read_back_endpoint_pattern'] == '/api/tutorial/ils/navigation/'
