"""
Learner Route Resolver.

ARCHITECTURAL INVARIANTS:
1. Never publishes, edits, or attaches candidate blocks to real authored learner content.
2. Resolves route from platform-owned fixture metadata, not family/version guess.
3. Returns valid navigationNodeId, subtopicId, canonical page route, and expected block identity.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
import hashlib


@dataclass(frozen=True)
class LearnerRouteContext:
    domain_slug: str
    subject_slug: str
    topic_slug: str
    subtopic_slug: str
    navigation_node_id: str
    subtopic_id: str
    page_route: str
    block_family: str
    block_version: str
    is_fixture: bool


class LearnerRouteResolutionError(Exception):
    """Raised when canonical fixture route cannot be resolved."""
    pass


# Platform-owned non-production verification fixture metadata catalog.
# These fixture routes map families to safe disposable non-production tutorial sections.
PLATFORM_FIXTURE_METADATA_CATALOG: Dict[str, Dict[str, Any]] = {
    "objective": {
        "domain_slug": "programming",
        "subject_slug": "python",
        "topic_slug": "fundamentals",
        "subtopic_slug": "variables-and-data-types",
        "navigation_node_id": "nav-node-test-fixture-01",
        "subtopic_id": "subtopic-test-fixture-01",
        "is_fixture": True,
    },
    "definition": {
        "domain_slug": "programming",
        "subject_slug": "python",
        "topic_slug": "fundamentals",
        "subtopic_slug": "syntax-overview",
        "navigation_node_id": "nav-node-test-fixture-02",
        "subtopic_id": "subtopic-test-fixture-02",
        "is_fixture": True,
    },
    "code": {
        "domain_slug": "programming",
        "subject_slug": "python",
        "topic_slug": "control-flow",
        "subtopic_slug": "conditionals",
        "navigation_node_id": "nav-node-test-fixture-03",
        "subtopic_id": "subtopic-test-fixture-03",
        "is_fixture": True,
    },
    "introduction": {
        "domain_slug": "programming",
        "subject_slug": "python",
        "topic_slug": "getting-started",
        "subtopic_slug": "welcome-to-python",
        "navigation_node_id": "nav-node-test-fixture-04",
        "subtopic_id": "subtopic-test-fixture-04",
        "is_fixture": True,
    },
    "summary": {
        "domain_slug": "programming",
        "subject_slug": "python",
        "topic_slug": "fundamentals",
        "subtopic_slug": "wrap-up-and-review",
        "navigation_node_id": "nav-node-test-fixture-05",
        "subtopic_id": "subtopic-test-fixture-05",
        "is_fixture": True,
    },
    "default": {
        "domain_slug": "system",
        "subject_slug": "test-suite",
        "topic_slug": "verification-fixtures",
        "subtopic_slug": "generic-candidate-page",
        "navigation_node_id": "nav-node-test-fixture-generic",
        "subtopic_id": "subtopic-test-fixture-generic",
        "is_fixture": True,
    },
}


class LearnerRouteResolver:
    """Resolves platform-owned non-production fixture routes for candidate verification."""

    @staticmethod
    def resolve_fixture_route(
        block_family: str,
        block_version: str,
        manifest_metadata: Optional[Dict[str, Any]] = None,
    ) -> LearnerRouteContext:
        """
        Resolves canonical fixture route from platform-owned fixture metadata.
        """
        family_clean = (block_family or "").strip().lower()
        version_clean = (block_version or "").strip().upper()

        if not family_clean or not version_clean:
            raise LearnerRouteResolutionError(
                f"Invalid block identity: family='{block_family}', version='{block_version}'"
            )

        # 1. Check if manifest explicitly specifies a non-production fixture context
        if manifest_metadata and isinstance(manifest_metadata.get("fixtureRoute"), dict):
            fix = manifest_metadata["fixtureRoute"]
            req_keys = ["domain_slug", "subject_slug", "topic_slug", "subtopic_slug", "navigation_node_id", "subtopic_id"]
            if all(k in fix and fix[k] for k in req_keys):
                route = f"/tutorial-v2/{fix['domain_slug']}/{fix['subject_slug']}/{fix['topic_slug']}/{fix['subtopic_slug']}/{fix['navigation_node_id']}"
                return LearnerRouteContext(
                    domain_slug=fix["domain_slug"],
                    subject_slug=fix["subject_slug"],
                    topic_slug=fix["topic_slug"],
                    subtopic_slug=fix["subtopic_slug"],
                    navigation_node_id=fix["navigation_node_id"],
                    subtopic_id=fix["subtopic_id"],
                    page_route=route,
                    block_family=family_clean,
                    block_version=version_clean,
                    is_fixture=True,
                )

        # 2. Match from platform-owned fixture catalog
        catalog_entry = PLATFORM_FIXTURE_METADATA_CATALOG.get(family_clean) or PLATFORM_FIXTURE_METADATA_CATALOG["default"]

        d = catalog_entry["domain_slug"]
        s = catalog_entry["subject_slug"]
        t = catalog_entry["topic_slug"]
        sub = catalog_entry["subtopic_slug"]
        node_id = catalog_entry["navigation_node_id"]
        sub_id = catalog_entry["subtopic_id"]

        page_route = f"/tutorial-v2/{d}/{s}/{t}/{sub}/{node_id}"

        return LearnerRouteContext(
            domain_slug=d,
            subject_slug=s,
            topic_slug=t,
            subtopic_slug=sub,
            navigation_node_id=node_id,
            subtopic_id=sub_id,
            page_route=page_route,
            block_family=family_clean,
            block_version=version_clean,
            is_fixture=True,
        )
