"""Headless verifier diagnostic; never certifies or changes a real workflow."""
import argparse
import asyncio
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'services' / 'project-ai'))

from dotenv import load_dotenv
from sqlalchemy import text
from app.verification.fixture_environment import fixture_session_factory
from app.verification.fixture_registry import LearnerFixtureRegistry
from app.verification.fixture_setup import FIXTURE_ID
from app.verification.disposable_fixture_provisioner import disposable_fixture_session
from app.verification.learner_runtime_verifier import verify_learner_runtime
from app.verification.execution_progress import ExecutionProgress


async def diagnose(commit, source_section):
    for file in [ROOT / '.env.local', ROOT / 'apps/skillhubcore-admin/.env.local', ROOT / '.project-ai/learner-runtime.env']:
        load_dotenv(file, override=True)
    engine, sessions = fixture_session_factory()
    try:
        async with sessions() as session:
            contract = await LearnerFixtureRegistry().resolve_fixture_contract(
                FIXTURE_ID, tenant='skillup', session=session, verify_db_existence=True)
            # Source lesson is strictly read-only. Only our dedicated fixture is mutated.
            block = (await session.execute(text(
                "SELECT content->'blocks'->0 FROM tutorial_sections WHERE id=CAST(:id AS uuid)"
            ), {'id': source_section})).scalar_one()
        digest = hashlib.sha256(json.dumps(block, sort_keys=True).encode()).hexdigest()
        progress = ExecutionProgress('diagnostic-isolated-learner', 'learner')
        async with disposable_fixture_session(sessions, 'diagnostic-isolated-learner', contract, block,
                                               block['type'], block['version']):
            result = await asyncio.to_thread(verify_learner_runtime,
                workflow_id='diagnostic-isolated-learner', candidate_hash=digest, manifest_hash=digest,
                verified_commit=commit, block_family=block['type'], block_version=block['version'],
                workspace_root=ROOT, fixture_contract=contract, progress=progress)
        progress.finish(result.status)
        report = {'diagnostic': True, 'commit': commit, 'status': result.status,
                  'message': result.message, 'blockers': result.blockers,
                  'evidenceHash': result.evidence_hash, 'screenshotPath': result.screenshot_path}
        print(json.dumps(report, indent=2))
        return 0 if result.status == 'PASS' else 1
    finally:
        await engine.dispose()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--source-section', required=True)
    args = parser.parse_args()
    raise SystemExit(asyncio.run(diagnose(args.commit, args.source_section)))
