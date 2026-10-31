"""
Disposable Fixture Document Provisioner for Learner Runtime Verification.

Provisions an isolated, committed tutorial section containing the candidate's exact
canonicalized block payload for the duration of a verification run, and guarantees
safe compensating teardown in all exit scenarios (success, assertion error, crash, timeout).
"""

import json
import logging
import uuid
import os
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.verification.fixture_registry import LearnerRuntimeFixtureContract

logger = logging.getLogger(__name__)


class FixtureProvisioningError(Exception):
    """Raised when disposable fixture provisioning or cleanup fails."""
    pass


class CandidateBlockCanonicalizationError(Exception):
    """Raised when candidate block payload fails canonical validation."""
    pass


@dataclass(frozen=True)
class ProvisionedFixtureResult:
    verification_run_id: str
    workflow_id: str
    section_id: str
    contract: LearnerRuntimeFixtureContract
    tutorial_document: Dict[str, Any]
    original_document: Dict[str, Any]
    lease_expires_at: datetime


def canonicalize_candidate_block(
    raw_block: Dict[str, Any],
    expected_family: str,
    expected_version: str,
) -> Dict[str, Any]:
    """
    Validate and canonicalize a candidate block payload before inserting into a fixture document.
    Rejects malformed, untyped, or version-mismatched blocks without touching the database.
    """
    if not isinstance(raw_block, dict):
        raise CandidateBlockCanonicalizationError(
            f"Candidate block must be a JSON object, got {type(raw_block).__name__}"
        )

    # 1. Family validation
    b_type = str(raw_block.get("type") or raw_block.get("blockType") or "").strip().lower()
    norm_expected_family = expected_family.strip().lower()
    if not b_type:
        raise CandidateBlockCanonicalizationError("Candidate block is missing 'type' attribute")
    if b_type != norm_expected_family:
        raise CandidateBlockCanonicalizationError(
            f"Candidate block type '{b_type}' does not match expected family '{norm_expected_family}'"
        )

    # 2. Version validation
    b_ver = str(raw_block.get("version") or raw_block.get("blockVersion") or "").strip().upper()
    norm_expected_version = expected_version.strip().upper()
    if not b_ver:
        raise CandidateBlockCanonicalizationError("Candidate block is missing 'version' attribute")
    if b_ver != norm_expected_version:
        raise CandidateBlockCanonicalizationError(
            f"Candidate block version '{b_ver}' does not match expected version '{norm_expected_version}'"
        )

    # 3. Content validation
    content = raw_block.get("content")
    if content is None or not isinstance(content, (dict, list)):
        raise CandidateBlockCanonicalizationError(
            "Candidate block must contain non-empty 'content' dict or list"
        )
    if isinstance(content, dict) and not content:
        raise CandidateBlockCanonicalizationError("Candidate block 'content' dict cannot be empty")

    # 4. Canonical structure
    block_id = str(raw_block.get("id") or uuid.uuid4())
    canonical = {
        "id": block_id,
        "type": norm_expected_family,
        "version": norm_expected_version,
        "content": content,
    }
    for key in ("expectedTimeSec", "progressRole", "presentation"):
        if key in raw_block:
            canonical[key] = raw_block[key]
    return canonical


def wrap_in_tutorial_document(
    canonical_block: Dict[str, Any],
    verification_metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """Wrap canonicalized block into a V2 TutorialDocument with verification metadata."""
    return {
        "schemaVersion": 1,
        "blocks": [canonical_block],
        "metadata": verification_metadata,
    }


class DisposableFixtureDocumentProvisioner:
    """
    Manages the lifecycle of a committed, run-owned verification fixture document.
    """

    def __init__(self, lease_duration_minutes: int = 45):
        self.lease_duration_minutes = lease_duration_minutes

    async def run_janitor(self, session: AsyncSession) -> int:
        """
        Restore expired verification fixtures left behind by interrupted runs.
        Never deletes or touches authored content.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        stmt = text(
            """
            UPDATE tutorial_sections
            SET content = CAST(content->'metadata'->'original_document' AS jsonb),
                updated_at = NOW()
            WHERE (content->'metadata'->>'is_verification_fixture') = 'true'
              AND (content->'metadata'->>'lease_expires_at') IS NOT NULL
              AND (content->'metadata'->>'lease_expires_at') < :now_iso
              AND (content->'metadata'->'original_document') IS NOT NULL
            """
        )
        try:
            res = await session.execute(stmt, {"now_iso": now_iso})
            deleted_count = res.rowcount or 0
            await session.commit()
            if deleted_count > 0:
                logger.info("Janitor cleaned up %d expired verification fixture documents", deleted_count)
            return deleted_count
        except Exception as exc:
            logger.warning("Janitor cleanup encountered an error: %s", exc)
            await session.rollback()
            return 0

    async def provision(
        self,
        session: AsyncSession,
        workflow_id: str,
        contract: LearnerRuntimeFixtureContract,
        candidate_block: Dict[str, Any],
        block_family: str,
        block_version: str,
    ) -> ProvisionedFixtureResult:
        """
        Canonicalize candidate block, build TutorialDocument, and insert committed fixture record.
        """
        if not workflow_id or not workflow_id.strip():
            raise FixtureProvisioningError("workflow_id is required for fixture provisioning")

        # 1. Run janitor pass first
        await self.run_janitor(session)

        # 2. Canonicalize block payload
        canon_block = canonicalize_candidate_block(candidate_block, block_family, block_version)

        # 3. Create verification metadata
        verification_run_id = str(uuid.uuid4())
        lease_expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.lease_duration_minutes)
        verification_metadata = {
            "is_verification_fixture": True,
            "verification_run_id": verification_run_id,
            "workflow_id": workflow_id,
            "target_family": block_family.lower(),
            "target_version": block_version.upper(),
            "lease_expires_at": lease_expires_at.isoformat(),
            "provisioned_at": datetime.now(timezone.utc).isoformat(),
        }

        # 4. Wrap into valid TutorialDocument
        doc = wrap_in_tutorial_document(canon_block, verification_metadata)
        doc_json = json.dumps(doc)

        # 5. Replace only a pre-seeded, explicitly marked verification
        # fixture. The learner resolver selects one section for this page
        # identity, so inserting a second normal section is both ambiguous and
        # unsafe. Keep the original document in the run metadata for a janitor
        # to restore after abnormal process termination.
        section_id = contract.section_id
        original_stmt = text(
            """
            SELECT content
            FROM tutorial_sections
            WHERE id = CAST(:section_id AS uuid)
              AND subtopic_id = CAST(:subtopic_id AS uuid)
              AND navigation_node_id = :navigation_node_id
              AND brand_id = :brand_id
              AND deleted_at IS NULL
              AND (content->'metadata'->>'is_verification_fixture') = 'true'
            FOR UPDATE
            """
        )
        try:
            original_result = await session.execute(original_stmt, {
                "section_id": section_id,
                "subtopic_id": contract.subtopic_id,
                "navigation_node_id": contract.navigation_node_id,
                "brand_id": contract.tenant,
            })
            original_document = original_result.scalar_one_or_none()
            if not isinstance(original_document, dict):
                raise FixtureProvisioningError(
                    "Configured fixture is absent or is not an explicitly marked verification fixture"
                )
            if original_document.get("metadata", {}).get("verification_run_id"):
                raise FixtureProvisioningError("Verification fixture is leased by another active run")

            verification_metadata["original_document"] = original_document
            doc = wrap_in_tutorial_document(canon_block, verification_metadata)
            doc_json = json.dumps(doc)
            update_stmt = text(
                """
                UPDATE tutorial_sections
                SET content = CAST(:content_json AS jsonb),
                    updated_at = NOW()
                WHERE id = CAST(:section_id AS uuid)
                  AND (content->'metadata'->>'is_verification_fixture') = 'true'
                """
            )
            update_result = await session.execute(update_stmt, {
                "section_id": section_id,
                "content_json": doc_json,
            })
            if not update_result.rowcount:
                raise FixtureProvisioningError("Verification fixture update did not affect an owned fixture")
            await session.commit()
            logger.info(
                "Provisioned committed verification fixture section %s for workflow %s (run %s)",
                section_id,
                workflow_id,
                verification_run_id,
            )
            return ProvisionedFixtureResult(
                verification_run_id=verification_run_id,
                workflow_id=workflow_id,
                section_id=section_id,
                contract=contract,
                tutorial_document=doc,
                original_document=original_document,
                lease_expires_at=lease_expires_at,
            )
        except Exception as exc:
            await session.rollback()
            raise FixtureProvisioningError(
                f"Failed to provision committed fixture document for workflow {workflow_id}: {exc}"
            ) from exc

    async def cleanup(
        self,
        session: AsyncSession,
        workflow_id: str,
        verification_run_id: str,
    ) -> int:
        """
        Safely restore only the document owned by this specific workflow and
        run. Guarantees that other workflows' fixtures are untouched.
        """
        if not workflow_id or not verification_run_id:
            logger.warning("Cleanup called with empty workflow_id or verification_run_id; ignoring")
            return 0

        stmt = text(
            """
            UPDATE tutorial_sections
            SET content = CAST(content->'metadata'->'original_document' AS jsonb),
                updated_at = NOW()
            WHERE (content->'metadata'->>'is_verification_fixture') = 'true'
              AND (content->'metadata'->>'workflow_id') = :workflow_id
              AND (content->'metadata'->>'verification_run_id') = :run_id
              AND (content->'metadata'->'original_document') IS NOT NULL
            """
        )
        try:
            res = await session.execute(
                stmt,
                {
                    "workflow_id": workflow_id,
                    "run_id": verification_run_id,
                },
            )
            deleted_count = res.rowcount or 0
            learner_id = os.environ.get("PROJECT_LLM_TEST_LEARNER_ID")
            if deleted_count and learner_id:
                uuid.UUID(learner_id)
                # Cleanup is scoped to both the dedicated learner and fixture
                # pages. Real student progress is never eligible for deletion.
                for table in ("block_telemetry_events", "block_learning_state", "tutorial_navigation_progress"):
                    await session.execute(text(
                        f"DELETE FROM {table} WHERE user_id=CAST(:learner AS uuid) "
                        "AND navigation_node_id IN (SELECT navigation_node_id FROM tutorial_sections "
                        "WHERE (content->'metadata'->>'is_verification_fixture')='true')"
                    ), {"learner": learner_id})
            await session.commit()
            logger.info(
                "Cleaned up %d fixture section(s) for workflow %s (run %s)",
                deleted_count,
                workflow_id,
                verification_run_id,
            )
            return deleted_count
        except Exception as exc:
            await session.rollback()
            logger.error(
                "Failed to clean up fixture section for workflow %s (run %s): %s",
                workflow_id,
                verification_run_id,
                exc,
            )
            raise FixtureProvisioningError("Verification fixture cleanup failed") from exc


@asynccontextmanager
async def disposable_fixture_session(
    session_factory: Any,
    workflow_id: str,
    contract: LearnerRuntimeFixtureContract,
    candidate_block: Dict[str, Any],
    block_family: str,
    block_version: str,
    lease_duration_minutes: int = 45,
) -> AsyncGenerator[ProvisionedFixtureResult, None]:
    """
    Asynchronous context manager providing a committed verification fixture document
    with unconditional compensating teardown in all exit branches.
    """
    provisioner = DisposableFixtureDocumentProvisioner(lease_duration_minutes=lease_duration_minutes)

    async with session_factory() as session:
        result = await provisioner.provision(
            session=session,
            workflow_id=workflow_id,
            contract=contract,
            candidate_block=candidate_block,
            block_family=block_family,
            block_version=block_version,
        )

    try:
        yield result
    finally:
        async with session_factory() as cleanup_session:
            await provisioner.cleanup(
                session=cleanup_session,
                workflow_id=workflow_id,
                verification_run_id=result.verification_run_id,
            )

