"""Authenticated diagnostic only. Never writes workflow certification results."""

import argparse
import asyncio
from dataclasses import asdict
import json
import os
from pathlib import Path
import subprocess
import sys
from uuid import uuid4

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import text
from app.verification.disposable_fixture_provisioner import disposable_fixture_session
from app.verification.fixture_environment import fixture_session_factory
from app.verification.fixture_registry import LearnerFixtureRegistry
from app.verification.learner_identity import LearnerRuntimeTestIdentityProvider
from app.verification.learner_runtime_verifier import (
    compute_canonical_json_hash, compute_sha256_file, verify_learner_runtime,
)
from app.verification.worker_slot import verification_slot


async def run(block_file):
    root = Path(os.environ.get('WORKSPACE_ROOT', '/workspace'))
    block = json.loads(Path(block_file).read_text())
    family, version = block['type'], block['version']
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    candidate_hash = compute_canonical_json_hash(block)
    manifest_hash = compute_canonical_json_hash({'diagnostic_only': True, 'commit': commit, 'block': candidate_hash})
    provider = LearnerRuntimeTestIdentityProvider()
    engine, sessions = fixture_session_factory()
    try:
        async with sessions() as session:
            contract = await LearnerFixtureRegistry().resolve_fixture_contract(
                provider.fixture_id, provider.test_tenant, session=session, verify_db_existence=True,
            )
            query = text('SELECT content FROM tutorial_sections WHERE id=CAST(:id AS uuid)')
            before = (await session.execute(query, {'id': contract.section_id})).scalar_one()
        with verification_slot():
            async with disposable_fixture_session(sessions, str(uuid4()), contract, block, family, version):
                result = await asyncio.to_thread(
                    verify_learner_runtime, workflow_id='linux-smoke-' + uuid4().hex,
                    candidate_hash=candidate_hash, manifest_hash=manifest_hash,
                    verified_commit=commit, block_family=family, block_version=version,
                    workspace_root=root, identity_provider=provider, fixture_contract=contract,
                    progress=lambda label: print('TASK: ' + label, flush=True),
                )
        async with sessions() as session:
            after = (await session.execute(query, {'id': contract.section_id})).scalar_one()
        restored = before == after
        hash_valid = bool(result.evidence_payload and
                          compute_canonical_json_hash(result.evidence_payload) == result.evidence_hash)
        screenshot_valid = bool(result.screenshot_path and result.screenshot_sha256 and
                                compute_sha256_file(Path(result.screenshot_path)) == result.screenshot_sha256)
        report = {**asdict(result), 'diagnostic_only': True, 'fixture_restored': restored,
                  'evidence_hash_valid': hash_valid, 'screenshot_hash_valid': screenshot_valid}
        report_path = root / '.evidence/linux-worker-smoke.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2))
        print(json.dumps({'status': result.status, 'fixture_restored': restored,
                          'evidence_hash_valid': hash_valid, 'screenshot_hash_valid': screenshot_valid,
                          'report_path': str(report_path)}), flush=True)
        return 0 if result.status == 'PASS' and restored and hash_valid and screenshot_valid else 1
    finally:
        await engine.dispose()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--block-json', required=True)
    parser.add_argument('--allow-fixture-writes', action='store_true')
    arguments = parser.parse_args()
    if not arguments.allow_fixture_writes:
        parser.error('Explicit permission for the existing dedicated fixture is required')
    load_dotenv(os.environ.get('PROJECT_AI_ENV_FILE', '/etc/project-ai/worker.env'), override=True)
    raise SystemExit(asyncio.run(run(arguments.block_json)))
