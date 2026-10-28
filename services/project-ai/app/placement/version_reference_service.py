"""
Generic Revision-Safe Block Version Reference Inspector & Allocator Service.

Implements server-owned, generic version allocation and reference inspection
across all block families and versions without hardcoding any specific family.
"""

import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class VersionReferenceInspectionError(Exception):
    """Raised when tutorial version reference inspection cannot be completed reliably."""
    pass

from app.models.candidate import (
    IdentityStatus,
    PlacementDecision,
    ReferenceSummary,
    RevisionStrategy,
    UpdateEligibility,
)


def get_default_workspace_root() -> Path:
    """Return the repository root directory."""
    env_root = os.getenv("WORKSPACE_ROOT")
    if env_root:
        return Path(env_root)
    # Fallback to traversing up from this file: services/project-ai/app/placement -> repo root
    return Path(__file__).resolve().parents[4]


async def query_version_references(
    family: str,
    version: str,
    session: Optional[AsyncSession] = None,
    mock_references: Optional[List[Dict[str, Any]]] = None,
) -> ReferenceSummary:
    """
    Query whether a normalized (family, version) pair is referenced by persisted
    tutorial content (draft, published, scheduled, or archived active records).
    
    A reference is defined as any TutorialSection whose JSONB content contains
    a block matching the target family and version.
    """
    family_norm = family.strip().lower()
    version_norm = version.strip().upper()

    count = 0
    publication_states: Dict[str, int] = {}
    sample_ids: List[str] = []

    # If in-memory mock references are provided (for unit testing), use them directly
    if mock_references is not None:
        if isinstance(mock_references, dict):
            tot = mock_references.get("total_count", mock_references.get("count", 0))
            states = dict(mock_references.get("publication_states", {}))
            if not states:
                if "draft_count" in mock_references:
                    states["draft"] = mock_references["draft_count"]
                if "published_count" in mock_references:
                    states["published"] = mock_references["published_count"]
            samples = mock_references.get("sample_section_ids", mock_references.get("sample_ids", []))
            return ReferenceSummary(
                count=tot,
                publication_states=states,
                sample_ids=samples,
            )
        for ref in mock_references:
            ref_id = str(ref.get("id") or ref.get("section_id") or "mock-doc")
            ref_status = str(ref.get("status") or "draft")
            ref_content = ref.get("content") or {}
            
            blocks = []
            if isinstance(ref_content, dict):
                blocks = ref_content.get("blocks", [])
                if not blocks and "type" in ref_content:
                    blocks = [ref_content]
            elif isinstance(ref_content, list):
                blocks = ref_content

            is_match = False
            for b in blocks:
                if not isinstance(b, dict):
                    continue
                b_type = str(b.get("type") or b.get("blockType") or "").strip().lower()
                b_ver = str(b.get("version") or b.get("versionCode") or b.get("blockVersion") or "").strip().upper()
                if b_type == family_norm and b_ver == version_norm:
                    is_match = True
                    break

            if is_match:
                count += 1
                publication_states[ref_status] = publication_states.get(ref_status, 0) + 1
                if len(sample_ids) < 5 and ref_id not in sample_ids:
                    sample_ids.append(ref_id)

        return ReferenceSummary(
            count=count,
            publication_states=publication_states,
            sample_ids=sample_ids,
        )

    # Query live PostgreSQL tutorial_sections if database session is available
    if session is not None:
        try:
            # Query tutorial_sections with content
            sql_query = text(
                """
                SELECT id::text, status::text, content
                FROM tutorial_sections
                WHERE deleted_at IS NULL
                """
            )
            result = await session.execute(sql_query)
            rows = result.fetchall()

            for row in rows:
                sec_id, sec_status, sec_content = row[0], row[1], row[2]
                blocks = []
                if isinstance(sec_content, dict):
                    blocks = sec_content.get("blocks", [])
                    if not blocks and "type" in sec_content:
                        blocks = [sec_content]
                elif isinstance(sec_content, list):
                    blocks = sec_content

                matched = False
                for b in blocks:
                    if not isinstance(b, dict):
                        continue
                    b_type = str(b.get("type") or b.get("blockType") or "").strip().lower()
                    b_ver = str(b.get("version") or b.get("versionCode") or b.get("blockVersion") or "").strip().upper()
                    if b_type == family_norm and b_ver == version_norm:
                        matched = True
                        break

                if matched:
                    count += 1
                    status_key = sec_status or "draft"
                    publication_states[status_key] = publication_states.get(status_key, 0) + 1
                    if len(sample_ids) < 5 and sec_id not in sample_ids:
                        sample_ids.append(sec_id)

        except Exception as db_err:
            logger.error(f"Tutorial reference query failed on PostgreSQL for ({family_norm}, {version_norm}): {db_err}")
            raise VersionReferenceInspectionError(f"Database query failed for tutorial_sections: {db_err}") from db_err
    elif mock_references is None:
        raise VersionReferenceInspectionError(
            f"Reference inspection unavailable for ({family_norm}, {version_norm}): database session or mock references required"
        )

    return ReferenceSummary(
        count=count,
        publication_states=publication_states,
        sample_ids=sample_ids,
    )


def check_version_registration(
    family: str,
    version: str,
    workspace_root: Optional[Any] = None,
) -> bool:
    """
    Check whether a target block family and version is already registered in the repository.
    Checks component implementations, renderers, definitions, and Composer registries.
    """
    ws = Path(workspace_root) if workspace_root else get_default_workspace_root()
    family_norm = family.strip().lower()
    version_norm = version.strip().upper()

    # 1. Check packages/ui/src/tutorial/blocks for matching component file
    blocks_dir = ws / "packages/ui/src/tutorial/blocks"
    if blocks_dir.exists():
        for file in blocks_dir.glob("**/*.tsx"):
            fname = file.name.lower()
            rel_parts = [p.lower() for p in file.relative_to(blocks_dir).parts]
            if family_norm in rel_parts or fname.startswith(family_norm):
                if version_norm.lower() in fname or version_norm.lower() in rel_parts:
                    return True

    # 2. Check generatedBlockRenderers.tsx
    renderers_file = ws / "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
    if renderers_file.exists():
        try:
            content = renderers_file.read_text(encoding="utf-8")
            p1 = r'family:\s*[\'"]' + re.escape(family_norm) + r'[\'"].*?version:\s*[\'"]' + re.escape(version_norm) + r'[\'"]'
            p2 = r'[\'"]' + re.escape(family_norm) + r":" + re.escape(version_norm) + r'[\'"]'
            if re.search(p1, content, re.IGNORECASE | re.DOTALL) or re.search(p2, content, re.IGNORECASE):
                return True
        except Exception:
            pass

    # 3. Check generatedBlockRegistries.ts (both paths)
    for reg_sub in [
        "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts",
        "apps/skillhubcore-admin/src/lib/tutorial/editor/generated/generatedBlockRegistries.ts"
    ]:
        registries_file = ws / reg_sub
        if registries_file.exists():
            try:
                content = registries_file.read_text(encoding="utf-8")
                p = r'id:\s*[\'"]' + re.escape(family_norm) + r'[\'"][\s\S]*?code:\s*[\'"]' + re.escape(version_norm) + r'[\'"]'
                p_arr = re.escape(family_norm) + r":\s*\{[\s\S]*?versions:\s*\[[\s\S]*?['\"]" + re.escape(version_norm) + r'[\'"]'
                if re.search(p, content, re.IGNORECASE) or re.search(p_arr, content, re.IGNORECASE):
                    return True
            except Exception:
                pass

    # 4. Check generatedBlockVersionDefinitions.ts (both paths)
    for def_sub in [
        "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/generatedBlockVersionDefinitions.ts",
        "apps/skillhubcore-admin/src/lib/tutorial/editor/generated/generatedBlockVersionDefinitions.ts"
    ]:
        defs_file = ws / def_sub
        if defs_file.exists():
            try:
                content = defs_file.read_text(encoding="utf-8")
                # Must match exact normalized pair (family, version)
                p_type_first = r"\{\s*(?:type|family):\s*['\"]" + re.escape(family_norm) + r"['\"],\s*version:\s*['\"]" + re.escape(version_norm) + r"['\"]"
                p_ver_first = r"\{\s*version:\s*['\"]" + re.escape(version_norm) + r"['\"],\s*(?:type|family):\s*['\"]" + re.escape(family_norm) + r"['\"]"
                if re.search(p_type_first, content, re.IGNORECASE) or re.search(p_ver_first, content, re.IGNORECASE):
                    return True
            except Exception:
                pass

    # 5. Check static registry entries under apps/skillhubcore-admin/.../registry/entries/
    entries_dir = ws / "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries"
    if entries_dir.exists():
        for file in entries_dir.glob("*.ts"):
            fname = file.name.lower()
            if fname == f"{family_norm}.registry.ts" or fname == f"{family_norm}.ts":
                try:
                    content = file.read_text(encoding="utf-8")
                    has_fam = re.search(r"id:\s*['\"]" + re.escape(family_norm) + r"['\"]", content, re.IGNORECASE)
                    has_ver = re.search(r"\bcode:\s*['\"]" + re.escape(version_norm) + r"['\"]", content, re.IGNORECASE)
                    if has_fam and has_ver:
                        return True
                except Exception:
                    pass

    return False


def discover_existing_versions_for_family(
    family: str,
    workspace_root: Optional[Any] = None,
) -> List[str]:
    """
    Scan the repository to discover all currently registered version codes for a given family.
    Returns sorted list of unique version codes (e.g. ['O1', 'O2', 'O3']).
    """
    ws = Path(workspace_root) if workspace_root else get_default_workspace_root()
    family_norm = family.strip().lower()
    discovered: Set[str] = set()

    # 1. Scan packages/ui/src/tutorial/blocks (recursive & directory check)
    blocks_dir = ws / "packages/ui/src/tutorial/blocks"
    if blocks_dir.exists():
        family_dir = blocks_dir / family_norm
        if family_dir.exists() and family_dir.is_dir():
            for d in family_dir.iterdir():
                if d.is_dir():
                    m_d = re.match(r"^([A-Za-z]+)(\d+)$", d.name)
                    if m_d:
                        discovered.add(m_d.group(1).upper() + m_d.group(2))
        for file in blocks_dir.glob("**/*.tsx"):
            fname = file.name
            rel_parts = [p.lower() for p in file.relative_to(blocks_dir).parts]
            if family_norm not in rel_parts and not fname.lower().startswith(family_norm):
                continue
            pname = file.parent.name
            mp = re.match(r"^([A-Za-z]+)(\d+)$", pname)
            if mp:
                discovered.add(mp.group(1).upper() + mp.group(2))
            m = re.match(rf"^{family_norm}([A-Za-z]+\d+)Block\.tsx$", fname, re.IGNORECASE)
            if m:
                discovered.add(m.group(1).upper())
            else:
                m2 = re.search(r"([A-Za-z]+\d+)", fname, re.IGNORECASE)
                if m2 and family_norm in fname.lower():
                    discovered.add(m2.group(1).upper())

    # 2. Scan generatedBlockRenderers.tsx
    renderers_file = ws / "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
    if renderers_file.exists():
        try:
            content = renderers_file.read_text(encoding="utf-8")
            for m in re.finditer(r'family:\s*[\'"]' + re.escape(family_norm) + r"['\"].*?version:\s*['\"]([A-Za-z0-9]+)['\"]", content, re.IGNORECASE | re.DOTALL):
                discovered.add(m.group(1).upper())
            for m in re.finditer(r'[\'"]' + re.escape(family_norm) + r':([A-Za-z0-9]+)[\'"]', content, re.IGNORECASE):
                discovered.add(m.group(1).upper())
        except Exception:
            pass

    # 3. Scan generatedBlockRegistries.ts (both paths)
    for reg_sub in [
        "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts",
        "apps/skillhubcore-admin/src/lib/tutorial/editor/generated/generatedBlockRegistries.ts"
    ]:
        registries_file = ws / reg_sub
        if registries_file.exists():
            try:
                content = registries_file.read_text(encoding="utf-8")
                for vm in re.finditer(re.escape(family_norm) + r":\s*\{[\s\S]*?versions:\s*\[([\s\S]*?)\]", content, re.IGNORECASE):
                    for code in re.finditer(r'[\'"]([A-Za-z0-9]+)[\'"]', vm.group(1)):
                        discovered.add(code.group(1).upper())
                for cm in re.finditer(r'id:\s*[\'"]' + re.escape(family_norm) + r"['\"][\s\S]*?code:\s*['\"]([A-Za-z0-9]+)['\"]", content, re.IGNORECASE):
                    discovered.add(cm.group(1).upper())
            except Exception:
                pass

    # 4. Scan generatedBlockVersionDefinitions.ts (both paths)
    for def_sub in [
        "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/generatedBlockVersionDefinitions.ts",
        "apps/skillhubcore-admin/src/lib/tutorial/editor/generated/generatedBlockVersionDefinitions.ts"
    ]:
        defs_file = ws / def_sub
        if defs_file.exists():
            try:
                content = defs_file.read_text(encoding="utf-8")
                for vm in re.finditer(r'family:\s*[\'"]' + re.escape(family_norm) + r"['\"].*?version:\s*['\"]([A-Za-z0-9]+)['\"]", content, re.IGNORECASE | re.DOTALL):
                    discovered.add(vm.group(1).upper())
                for vm in re.finditer(r'type:\s*[\'"]' + re.escape(family_norm) + r"['\"].*?version:\s*['\"]([A-Za-z0-9]+)['\"]", content, re.IGNORECASE | re.DOTALL):
                    discovered.add(vm.group(1).upper())
            except Exception:
                pass

    return sorted(list(discovered))


def allocate_next_version(
    family: str,
    workspace_root: Optional[Any] = None,
    existing_versions: Optional[List[str]] = None,
) -> str:
    if isinstance(workspace_root, list):
        existing_versions = workspace_root
        workspace_root = None
    """
    Server-owned version allocator proposing the next valid version code for a family.
    
    Rules:
    - Never hardcodes Objective or any specific family.
    - Resolves letter prefix from existing versions or family name.
    - Finds highest integer suffix and returns prefix + (max + 1).
    - If no existing versions, defaults to prefix + 1 (e.g. O1, C1, D1, S1).
    """
    family_norm = family.strip().lower()
    versions = existing_versions if existing_versions is not None else discover_existing_versions_for_family(family_norm, workspace_root)

    # Determine version prefix
    prefix = ""
    numbers: List[int] = []

    # Check existing versions to infer established prefix
    for v in versions:
        m = re.match(r"^([A-Za-z]+)(\d+)$", v)
        if m:
            prefix = m.group(1).upper()
            numbers.append(int(m.group(2)))

    # If no prefix deduced from existing version codes, use first letter of family
    if not prefix:
        prefix = family.strip()[:1].upper() or "V"

    if not numbers:
        return f"{prefix}1"

    next_num = max(numbers) + 1
    return f"{prefix}{next_num}"


class VersionPolicyEvaluation:
    """Result of evaluating version reference, registration, and revision policy."""

    def __init__(
        self,
        family: str,
        version: str,
        is_registered: bool,
        identity_status: IdentityStatus,
        update_eligibility: UpdateEligibility,
        revision_strategy: RevisionStrategy,
        decision: PlacementDecision,
        reference_summary: ReferenceSummary,
        proposed_next_version: str,
    ):
        self.family = family
        self.version = version
        self.is_registered = is_registered
        self.identity_status = identity_status
        self.update_eligibility = update_eligibility
        self.revision_strategy = revision_strategy
        self.decision = decision
        self.reference_summary = reference_summary
        self.proposed_next_version = proposed_next_version

    def to_dict(self) -> Dict[str, Any]:
        return {
            "family": self.family,
            "version": self.version,
            "isRegistered": self.is_registered,
            "identityStatus": self.identity_status.value,
            "updateEligibility": self.update_eligibility.value,
            "revisionStrategy": self.revision_strategy.value,
            "decision": self.decision.value,
            "referenceSummary": self.reference_summary.model_dump(),
            "proposedNextVersion": self.proposed_next_version,
        }


async def evaluate_version_policy(
    family: str,
    version: str,
    session: Optional[AsyncSession] = None,
    workspace_root: Optional[Path] = None,
    mock_references: Optional[List[Dict[str, Any]]] = None,
    raise_on_error: bool = False,
) -> VersionPolicyEvaluation:
    """
    Comprehensive evaluation of version placement safety.
    
    1. If referenced by any tutorial content:
       - decision: VERSION_IN_USE
       - identity_status: EXISTING_REFERENCED
       - update_eligibility: VERSION_IN_USE
       - revision_strategy: ADD_NEW_VERSION
       - In-place update is strictly prohibited.
    2. If version exists in repository but zero references:
       - decision: UPDATE
       - identity_status: EXISTING_UNUSED
       - update_eligibility: ALLOWED
       - revision_strategy: UPDATE_IN_PLACE
    3. If version does not exist:
       - decision: ADD
       - identity_status: NEW
       - update_eligibility: NOT_APPLICABLE
       - revision_strategy: ADD_NEW_VERSION
    4. If reference inspection fails on an existing registered version:
       - Fails closed: update_eligibility = INSPECTION_FAILED, decision = VERSION_IN_USE
       - In-place update is strictly blocked.
    """
    family_norm = family.strip().lower()
    version_norm = version.strip().upper()

    ws = Path(workspace_root) if workspace_root else get_default_workspace_root()
    is_registered = check_version_registration(family_norm, version_norm, ws)
    proposed_version = allocate_next_version(family_norm, ws)

    # 1. If absent from repository: always ADD_NEW_VERSION
    if not is_registered:
        return VersionPolicyEvaluation(
            family=family_norm,
            version=version_norm,
            is_registered=False,
            identity_status=IdentityStatus.NEW,
            update_eligibility=UpdateEligibility.NOT_APPLICABLE,
            revision_strategy=RevisionStrategy.ADD_NEW_VERSION,
            decision=PlacementDecision.ADD,
            reference_summary=ReferenceSummary(count=0, publication_states={}, sample_ids=[]),
            proposed_next_version=proposed_version,
        )

    # 2. For an existing registered version, reference inspection is mandatory
    try:
        ref_summary = await query_version_references(family_norm, version_norm, session, mock_references)
    except VersionReferenceInspectionError as err:
        if raise_on_error:
            raise
        logger.error(f"Failing closed: reference inspection failed for registered version ({family_norm}, {version_norm}): {err}")
        return VersionPolicyEvaluation(
            family=family_norm,
            version=version_norm,
            is_registered=True,
            identity_status=IdentityStatus.EXISTING_REFERENCED,
            update_eligibility=UpdateEligibility.INSPECTION_FAILED,
            revision_strategy=RevisionStrategy.ADD_NEW_VERSION,
            decision=PlacementDecision.VERSION_IN_USE,
            reference_summary=ReferenceSummary(count=-1, publication_states={"inspection_failed": 1}, sample_ids=["INSPECTION_FAILED"]),
            proposed_next_version=proposed_version,
        )

    # 3. Referenced version: reject in-place update
    if ref_summary.count > 0:
        return VersionPolicyEvaluation(
            family=family_norm,
            version=version_norm,
            is_registered=True,
            identity_status=IdentityStatus.EXISTING_REFERENCED,
            update_eligibility=UpdateEligibility.VERSION_IN_USE,
            revision_strategy=RevisionStrategy.ADD_NEW_VERSION,
            decision=PlacementDecision.VERSION_IN_USE,
            reference_summary=ref_summary,
            proposed_next_version=proposed_version,
        )

    # 4. Registered but 0 references: allow controlled UPDATE_IN_PLACE
    return VersionPolicyEvaluation(
        family=family_norm,
        version=version_norm,
        is_registered=True,
        identity_status=IdentityStatus.EXISTING_UNUSED,
        update_eligibility=UpdateEligibility.ALLOWED,
        revision_strategy=RevisionStrategy.UPDATE_IN_PLACE,
        decision=PlacementDecision.UPDATE,
        reference_summary=ref_summary,
        proposed_next_version=proposed_version,
    )
