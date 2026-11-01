"""Idempotent setup for dedicated learner fixtures. Never runs at app startup.

Usage: python -m app.verification.fixture_setup --env-file ../../.env.local --allow-fixture-writes --provision
The database must already have the platform migrations. No DDL is executed here.
"""

import argparse
import asyncio
import json
import os
import secrets
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from dotenv import dotenv_values
from sqlalchemy import text
from app.verification.fixture_environment import fixture_session_factory

FIXTURE_ID = "project-llm-learner-runtime"


def identity(name):
    return str(uuid5(NAMESPACE_URL, f"project-llm-verification:{name}"))


def fixture_catalog():
    return {FIXTURE_ID: {
        "domain_slug": "project-llm-verification",
        "subject_slug": "runtime-validation",
        "topic_slug": "block-lifecycle",
        "subtopic_slug": "candidate-fixture",
        "navigation_node_id": "project-llm-candidate-fixture",
        "subtopic_id": identity("subtopic"),
        "section_id": identity("section"),
        "supports_lsnb": True,
        "supports_rssb": True,
        "progress_contract": {
            "required": True,
            "visit_endpoint_pattern": "/api/tutorial/ils/visit",
            "read_back_endpoint_pattern": "/api/tutorial/ils/navigation/",
        },
    }}


async def provision_fixture():
    engine, sessions = fixture_session_factory()
    try:
        async with sessions() as session:
            async with session.begin():
                # Fixed identifiers are owned exclusively by this setup tool.
                # Existing rows are checked rather than overwritten.
                levels = [
                    ("domains", "domain", "Project LLM Verification", "project-llm-verification", None),
                    ("subjects", "subject", "Runtime Validation", "runtime-validation", "domain"),
                    ("topics", "topic", "Block Lifecycle", "block-lifecycle", "subject"),
                    ("subtopics", "subtopic", "Candidate Fixture", "candidate-fixture", "topic"),
                ]
                for table, key, name, slug, parent in levels:
                    parent_column = f", {parent}_id" if parent else ""
                    parent_value = ", CAST(:parent AS uuid)" if parent else ""
                    await session.execute(text(
                        f"INSERT INTO tutorial_{table} (id, external_id, name, slug{parent_column}) "
                        f"VALUES (CAST(:id AS uuid), CAST(:external AS uuid), :name, :slug{parent_value}) "
                        "ON CONFLICT (id) DO NOTHING"
                    ), {"id": identity(key), "external": identity(key + "-external"),
                        "name": name, "slug": slug, "parent": identity(parent) if parent else None})
                    row = (await session.execute(text(
                        f"SELECT slug FROM tutorial_{table} WHERE id = CAST(:id AS uuid) AND deleted_at IS NULL"
                    ), {"id": identity(key)})).scalar_one_or_none()
                    if row != slug:
                        raise RuntimeError("Reserved fixture hierarchy identity collision; no authored data changed")

                fixture = fixture_catalog()[FIXTURE_ID]
                route = "/tutorial-v2/project-llm-verification/runtime-validation/block-lifecycle/candidate-fixture/project-llm-candidate-fixture"
                tree = {"topics": [{"id": fixture["navigation_node_id"], "name": "Candidate Fixture",
                                    "type": "page", "slug": "candidate-fixture", "url": route}]}
                await session.execute(text("""
                    INSERT INTO tutorial_sidebar_trees_v2
                      (id, brand_id, domain_id, subject_id, topic_id, active_subtopic_id,
                       tree, source_content, status, published_at)
                    VALUES (CAST(:id AS uuid), 'skillup', CAST(:domain AS uuid), CAST(:subject AS uuid),
                            CAST(:topic AS uuid), CAST(:subtopic AS uuid), CAST(:tree AS jsonb), CAST(:source AS text), 'published', NOW())
                    ON CONFLICT (id) DO NOTHING
                """), {"id": identity("sidebar"), "domain": identity("domain"), "subject": identity("subject"),
                       "topic": identity("topic-external"), "subtopic": identity("subtopic-external"),
                       "tree": json.dumps(tree), "source": json.dumps(tree)})
                document = {"schemaVersion": 1, "blocks": [], "metadata": {"is_verification_fixture": True}}
                await session.execute(text("""
                    INSERT INTO tutorial_sections
                      (id, subtopic_id, navigation_node_id, content, status, brand_id, published_at)
                    VALUES (CAST(:id AS uuid), CAST(:subtopic AS uuid), :navigation,
                            CAST(:content AS jsonb), 'deployed', 'skillup', NOW())
                    ON CONFLICT (id) DO NOTHING
                """), {"id": identity("section"), "subtopic": identity("subtopic"),
                       "navigation": fixture["navigation_node_id"], "content": json.dumps(document)})
                marked = (await session.execute(text("""
                    SELECT content->'metadata'->>'is_verification_fixture' FROM tutorial_sections
                    WHERE id=CAST(:id AS uuid) AND subtopic_id=CAST(:subtopic AS uuid)
                      AND navigation_node_id=:navigation AND brand_id='skillup' AND deleted_at IS NULL
                """), {"id": identity("section"), "subtopic": identity("subtopic"),
                       "navigation": fixture["navigation_node_id"]})).scalar_one_or_none()
                if marked != "true":
                    raise RuntimeError("Reserved section is not a dedicated fixture; setup rolled back")
    finally:
        await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", required=True, type=Path)
    parser.add_argument("--provision", action="store_true")
    parser.add_argument("--allow-fixture-writes", action="store_true")
    parser.add_argument("--ils-api-url", default="http://127.0.0.1:3001")
    args = parser.parse_args()
    values = dotenv_values(args.env_file)
    database = values.get("PROJECT_LLM_VERIFICATION_DATABASE_URL") or values.get("DATABASE_URL_TUTORIAL")
    if not database or not args.allow_fixture_writes:
        parser.error("An explicit environment file and --allow-fixture-writes are required")
    # Keep existing authoring settings intact: override only the isolated fixture database.
    os.environ["PROJECT_LLM_VERIFICATION_DATABASE_URL"] = database
    os.environ["PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED"] = "true"
    os.environ["PROJECT_LLM_LOCAL_VERIFICATION"] = "true"
    if not args.provision:
        parser.error("Specify --provision after reviewing the selected test environment")
    asyncio.run(provision_fixture())
    root = Path(__file__).resolve().parents[4]
    directory = root / ".project-ai"
    directory.mkdir(exist_ok=True)
    catalog = directory / "learner-fixtures.json"
    catalog.write_text(json.dumps(fixture_catalog(), indent=2), encoding="utf-8")
    env_path = directory / "learner-runtime.env"
    previous = dotenv_values(env_path) if env_path.exists() else {}
    settings = {
        "PROJECT_LLM_LEARNER_RUNTIME_ENABLED": "true",
        "PROJECT_LLM_FIXTURE_DATABASE_WRITES_ALLOWED": "true",
        "PROJECT_LLM_LOCAL_VERIFICATION": "true",
        "PROJECT_LLM_VERIFICATION_DATABASE_URL": database,
        "PROJECT_LLM_LEARNER_FIXTURE_CATALOG_PATH": catalog.as_posix(),
        "PROJECT_LLM_LEARNER_TEST_FIXTURE_ID": FIXTURE_ID,
        "PROJECT_LLM_TEST_FIXTURE_IDS": FIXTURE_ID,
        "PROJECT_LLM_TEST_TENANT": "skillup",
        "PROJECT_LLM_LEARNER_TEST_TENANT": "skillup",
        "PROJECT_LLM_TEST_LEARNER_ID": identity("learner"),
        "PROJECT_LLM_FIXTURE_SESSION_SECRET": previous.get("PROJECT_LLM_FIXTURE_SESSION_SECRET") or secrets.token_urlsafe(48),
        "PROJECT_LLM_LEARNER_API_BASE_URL": args.ils_api_url,
    }
    env_path.write_text("\n".join(f"{key}={json.dumps(value)}" for key, value in settings.items()) + "\n", encoding="utf-8")
    print("Dedicated fixture provisioned. Local configuration written; no secrets printed. Restart Project AI.")


if __name__ == "__main__":
    main()
