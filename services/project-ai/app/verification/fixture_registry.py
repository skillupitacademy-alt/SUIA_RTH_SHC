"""
Learner Runtime Fixture Registry & Contract Resolver.

Platform-owned registry for learner runtime verification fixtures.
Enforces that verification runs only against authorized, seeded fixture hierarchies
and produces an immutable LearnerRuntimeFixtureContract.
"""

import os
import re
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class FixtureBlockedError(Exception):
    """Raised when fixture validation fails and verification must be BLOCKED."""
    def __init__(self, message: str, blockers: Optional[List[str]] = None):
        self.blockers = blockers or [message]
        super().__init__(f"{message}: {'; '.join(self.blockers)}")


@dataclass(frozen=True)
class ProgressContract:
    required: bool
    visit_endpoint_pattern: str
    read_back_endpoint_pattern: str


@dataclass(frozen=True)
class LearnerRuntimeFixtureContract:
    fixture_id: str
    tenant: str
    domain_slug: str
    subject_slug: str
    topic_slug: str
    subtopic_slug: str
    navigation_node_id: str
    subtopic_id: str
    section_id: str
    learner_route: str
    tenant_origin_template: str  # e.g. "http://{tenant}.localhost:{port}"
    supports_lsnb: bool
    supports_rssb: bool
    progress_contract: ProgressContract

    def resolve_origin(self, port: int) -> str:
        """Resolve ephemeral tenant origin using the allocated port."""
        return self.tenant_origin_template.format(tenant=self.tenant, port=port)

    def resolve_url(self, port: int) -> str:
        """Resolve full canonical learner URL on ephemeral preview host."""
        origin = self.resolve_origin(port).rstrip("/")
        route = self.learner_route if self.learner_route.startswith("/") else f"/{self.learner_route}"
        return f"{origin}{route}"


# There is deliberately no fallback fixture. A fixture must be explicitly
# configured by the deployment and subsequently validated against PostgreSQL.
PLATFORM_FIXTURE_CATALOG: Dict[str, Dict[str, Any]] = {}


class LearnerFixtureRegistry:
    """
    Platform-managed registry for learner verification fixtures.
    Validates tenant and fixture allowlists, checks database hierarchy existence,
    and returns a verified LearnerRuntimeFixtureContract.
    """

    def __init__(
        self,
        allowed_tenants: Optional[List[str]] = None,
        allowed_fixtures: Optional[List[str]] = None,
        custom_catalog: Optional[Dict[str, Dict[str, Any]]] = None,
    ):
        if allowed_tenants is not None:
            self.allowed_tenants = [t.strip().lower() for t in allowed_tenants if t.strip()]
        else:
            raw_tenants = os.environ.get("PROJECT_LLM_TEST_TENANTS") or os.environ.get("PROJECT_LLM_TEST_TENANT") or "skillup"
            self.allowed_tenants = [t.strip().lower() for t in raw_tenants.split(",") if t.strip()]

        if allowed_fixtures is not None:
            self.allowed_fixtures = [f.strip() for f in allowed_fixtures if f.strip()]
        else:
            raw_fixtures = os.environ.get("PROJECT_LLM_TEST_FIXTURE_IDS", "")
            self.allowed_fixtures = [f.strip() for f in raw_fixtures.split(",") if f.strip()]

        if custom_catalog is not None:
            self.catalog = dict(custom_catalog)
        else:
            raw_catalog = os.environ.get("PROJECT_LLM_LEARNER_FIXTURE_CATALOG_JSON", "")
            catalog_path = os.environ.get("PROJECT_LLM_LEARNER_FIXTURE_CATALOG_PATH")
            try:
                if catalog_path and not raw_catalog:
                    raw_catalog = Path(catalog_path).read_text(encoding="utf-8")
                parsed_catalog = json.loads(raw_catalog) if raw_catalog else {}
            except (OSError, json.JSONDecodeError) as exc:
                raise FixtureBlockedError(
                    "PROJECT_LLM_LEARNER_FIXTURE_CATALOG_JSON is not valid JSON",
                    [str(exc)],
                ) from exc
            self.catalog = parsed_catalog if isinstance(parsed_catalog, dict) else {}

    async def resolve_fixture_contract(
        self,
        fixture_id: str,
        tenant: Optional[str] = None,
        session: Optional[AsyncSession] = None,
        verify_db_existence: bool = False,
    ) -> LearnerRuntimeFixtureContract:
        """
        Validate and resolve a platform-owned fixture contract.
        
        Fails closed with FixtureBlockedError if:
        - Tenant is invalid or not in configured allowlist
        - Fixture ID is unknown or not in configured allowlist
        - Required hierarchy metadata is missing or incomplete
        - Database preflight check fails (when verify_db_existence=True)
        """
        blockers = []

        # 1. Tenant validation
        selected_tenant = (tenant or self.allowed_tenants[0] if self.allowed_tenants else "").strip().lower()
        if not selected_tenant:
            blockers.append("No test tenant specified and no default configured")
        elif selected_tenant not in self.allowed_tenants:
            blockers.append(f"Tenant '{selected_tenant}' is not permitted by allowlist: {self.allowed_tenants}")

        # 2. Fixture ID validation
        norm_fixture_id = (fixture_id or "").strip()
        if not norm_fixture_id:
            blockers.append("No fixture ID specified")
        elif norm_fixture_id not in self.allowed_fixtures:
            blockers.append(f"Fixture ID '{norm_fixture_id}' is not permitted by allowlist: {self.allowed_fixtures}")

        # 3. Catalog entry lookup
        meta = self.catalog.get(norm_fixture_id)
        if not meta:
            blockers.append(f"Fixture ID '{norm_fixture_id}' not found in platform fixture catalog")

        if blockers:
            raise FixtureBlockedError(f"Fixture preflight failed ({len(blockers)} blockers)", blockers)

        # 4. Mandatory contract fields validation
        domain_slug = meta.get("domain_slug")
        subject_slug = meta.get("subject_slug")
        topic_slug = meta.get("topic_slug")
        subtopic_slug = meta.get("subtopic_slug")
        navigation_node_id = meta.get("navigation_node_id")
        subtopic_id = meta.get("subtopic_id")
        section_id = meta.get("section_id")

        for key, val in [
            ("domain_slug", domain_slug),
            ("subject_slug", subject_slug),
            ("topic_slug", topic_slug),
            ("subtopic_slug", subtopic_slug),
            ("navigation_node_id", navigation_node_id),
            ("subtopic_id", subtopic_id),
            ("section_id", section_id),
        ]:
            if not val or not str(val).strip():
                blockers.append(f"Fixture catalog definition missing required field: {key}")

        progress_meta = meta.get("progress_contract") or {}
        if not progress_meta.get("visit_endpoint_pattern") or not progress_meta.get("read_back_endpoint_pattern"):
            blockers.append("Fixture catalog definition missing progress contract endpoint patterns")

        if blockers:
            raise FixtureBlockedError(f"Fixture contract incomplete ({len(blockers)} blockers)", blockers)

        # 5. Database preflight verification if requested. The fixture must be
        # an existing, explicitly marked platform-owned page; a guessed route
        # or ordinary authored section is never acceptable.
        if verify_db_existence and session is None:
            raise FixtureBlockedError("Database session required for fixture preflight")
        if verify_db_existence and session is not None:
            try:
                stmt = text(
                    """
                    SELECT id
                    FROM tutorial_sections
                    WHERE id = CAST(:section_id AS uuid)
                      AND subtopic_id = CAST(:subtopic_id AS uuid)
                      AND navigation_node_id = :navigation_node_id
                      AND brand_id = :brand_id
                      AND deleted_at IS NULL
                      AND (content->'metadata'->>'is_verification_fixture') = 'true'
                    """
                )
                res = await session.execute(stmt, {
                    "section_id": section_id,
                    "subtopic_id": subtopic_id,
                    "navigation_node_id": navigation_node_id,
                    "brand_id": selected_tenant,
                })
                if not res.scalar_one_or_none():
                    blockers.append(
                        "Platform-owned verification fixture does not match the configured "
                        f"section/subtopic/navigation contract (section={section_id})"
                    )
            except Exception as exc:
                blockers.append(f"Database preflight check failed for fixture hierarchy: {exc}")

        if blockers:
            raise FixtureBlockedError(f"Fixture preflight database check failed ({len(blockers)} blockers)", blockers)

        # Construct canonical learner route
        canonical_route = (
            f"/tutorial-v2/{domain_slug}/{subject_slug}/{topic_slug}/{subtopic_slug}/{navigation_node_id}"
        )

        return LearnerRuntimeFixtureContract(
            fixture_id=norm_fixture_id,
            tenant=selected_tenant,
            domain_slug=domain_slug,
            subject_slug=subject_slug,
            topic_slug=topic_slug,
            subtopic_slug=subtopic_slug,
            navigation_node_id=navigation_node_id,
            subtopic_id=subtopic_id,
            section_id=section_id,
            learner_route=canonical_route,
            tenant_origin_template="http://{tenant}.localhost:{port}",
            supports_lsnb=bool(meta.get("supports_lsnb", True)),
            supports_rssb=bool(meta.get("supports_rssb", True)),
            progress_contract=ProgressContract(
                required=bool(progress_meta.get("required", True)),
                visit_endpoint_pattern=progress_meta["visit_endpoint_pattern"],
                read_back_endpoint_pattern=progress_meta["read_back_endpoint_pattern"],
            ),
        )

