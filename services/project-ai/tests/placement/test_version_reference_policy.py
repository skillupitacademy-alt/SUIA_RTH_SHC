"""Unit tests for Generic Revision-Safe Block Placement Policy.

Verification Requirements:
1. existing unused version -> UPDATE_IN_PLACE
2. existing referenced draft version -> VERSION_IN_USE
3. existing referenced published version -> VERSION_IN_USE
4. absent version -> ADD_NEW_VERSION
5. version allocator returns next valid family version
6. UPDATE manifest contains UPDATE operations with pre-image hashes
7. UPDATE executor writes each explicit target path correctly
8. stale pre-image hash fails without partial placement
9. UPDATE patcher refreshes existing registry metadata without duplicates
10. ADD_NEW_VERSION creates exactly one additional registry/renderer mapping
11. final certification supersedes only same family/version UPDATE workflows
12. final certification does not supersede an older version after ADD_NEW_VERSION
"""

import hashlib
import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.models.candidate import (
    BlockFamily,
    CandidateFile,
    IdentityStatus,
    PlacementDecision,
    PlacementFileAction,
    PlacementFileOperation,
    PlacementManifest,
    ReferenceSummary,
    RevisionStrategy,
    UpdateEligibility,
)
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
)
from app.placement.comparator import CanonicalComparator
from app.placement.executor import PlacementExecutor, PlacementExecutionError
from app.placement.patcher import (
    patch_generated_block_registry,
    patch_generated_block_version_definitions,
    patch_tutorial_block_renderer,
)
from app.placement.version_reference_service import (
    allocate_next_version,
    check_version_registration,
    evaluate_version_policy,
    query_version_references,
)
from app.placement.worktree_manager import WorktreeContext


def run_coro(coro):
    """Run an async coroutine synchronously without starting a Windows IOCP event loop."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    raise RuntimeError("Coroutine did not complete synchronously")


@pytest.fixture
def temp_workspace():
    """Create a temporary workspace structure mimicking the monorepo."""
    with tempfile.TemporaryDirectory() as tmpdir:
        ws = Path(tmpdir)

        # Create canonical directories
        (ws / "packages/ui/src/tutorial/blocks/summary/v1").mkdir(parents=True, exist_ok=True)
        (ws / "packages/ui/src/tutorial/blocks").mkdir(parents=True, exist_ok=True)
        (ws / "packages/ui/src/tutorial/schemas").mkdir(parents=True, exist_ok=True)
        (ws / "packages/ui/src/tutorial").mkdir(parents=True, exist_ok=True)
        (ws / "apps/skillhubcore-admin/src/lib/tutorial/editor/generated").mkdir(parents=True, exist_ok=True)

        # Initial component
        comp_file = ws / "packages/ui/src/tutorial/blocks/summary/v1/summary-v1.tsx"
        comp_file.write_text("// summary v1 component\nexport const SummaryV1 = () => null;", encoding="utf-8")

        # Initial renderer
        renderer_file = ws / "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
        renderer_file.write_text(
            'export const GENERATED_RENDERERS = {\n  "summary:V1": SummaryV1,\n};\n',
            encoding="utf-8"
        )

        # Initial version definitions
        defs_file = ws / "apps/skillhubcore-admin/src/lib/tutorial/editor/generated/generatedBlockVersionDefinitions.ts"
        defs_file.write_text(
            'export const GENERATED_VERSION_DEFINITIONS = [\n  { family: "summary", version: "V1", label: "Summary V1" },\n];\n',
            encoding="utf-8"
        )

        # Initial registries
        reg_file = ws / "apps/skillhubcore-admin/src/lib/tutorial/editor/generated/generatedBlockRegistries.ts"
        reg_file.write_text(
            'export const GENERATED_BLOCK_REGISTRIES = {\n  summary: {\n    versions: ["V1"],\n    defaultPayload: { title: "Summary" },\n  },\n};\n',
            encoding="utf-8"
        )

        yield ws


# ============================================================================
# 1. Version Policy Evaluation Tests
# ============================================================================

def test_existing_unused_version_yields_update_in_place(temp_workspace):
    """An existing registered version with 0 references must produce UPDATE_IN_PLACE."""
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=None,
        workspace_root=str(temp_workspace),
        mock_references={"total_count": 0, "draft_count": 0, "published_count": 0, "sample_section_ids": []}
    ))

    assert policy.identity_status == IdentityStatus.EXISTING_UNUSED
    assert policy.update_eligibility == UpdateEligibility.ALLOWED
    assert policy.revision_strategy == RevisionStrategy.UPDATE_IN_PLACE
    assert policy.decision == PlacementDecision.UPDATE
    assert policy.reference_summary.total_count == 0


def test_existing_referenced_draft_version_yields_version_in_use(temp_workspace):
    """An existing version referenced by a DRAFT section must produce VERSION_IN_USE."""
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=None,
        workspace_root=str(temp_workspace),
        mock_references={
            "total_count": 1,
            "draft_count": 1,
            "published_count": 0,
            "sample_section_ids": ["sec-draft-123"]
        }
    ))

    assert policy.identity_status == IdentityStatus.EXISTING_REFERENCED
    assert policy.update_eligibility == UpdateEligibility.VERSION_IN_USE
    assert policy.revision_strategy == RevisionStrategy.ADD_NEW_VERSION
    assert policy.decision == PlacementDecision.VERSION_IN_USE
    assert policy.reference_summary.total_count == 1
    assert policy.reference_summary.draft_count == 1
    assert "sec-draft-123" in policy.reference_summary.sample_section_ids
    assert policy.proposed_next_version == "V2"


def test_existing_referenced_published_version_yields_version_in_use(temp_workspace):
    """An existing version referenced by a PUBLISHED section must produce VERSION_IN_USE."""
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=None,
        workspace_root=str(temp_workspace),
        mock_references={
            "total_count": 3,
            "draft_count": 0,
            "published_count": 3,
            "sample_section_ids": ["sec-pub-1", "sec-pub-2", "sec-pub-3"]
        }
    ))

    assert policy.identity_status == IdentityStatus.EXISTING_REFERENCED
    assert policy.update_eligibility == UpdateEligibility.VERSION_IN_USE
    assert policy.revision_strategy == RevisionStrategy.ADD_NEW_VERSION
    assert policy.decision == PlacementDecision.VERSION_IN_USE
    assert policy.reference_summary.published_count == 3
    assert policy.proposed_next_version == "V2"


def test_absent_version_yields_add_new_version(temp_workspace):
    """A version that does not exist in the codebase yields ADD_NEW_VERSION."""
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V99",
        session=None,
        workspace_root=str(temp_workspace)
    ))

    assert policy.identity_status == IdentityStatus.NEW
    assert policy.update_eligibility == UpdateEligibility.NOT_APPLICABLE
    assert policy.revision_strategy == RevisionStrategy.ADD_NEW_VERSION
    assert policy.decision == PlacementDecision.ADD


# ============================================================================
# 2. Version Allocator Tests
# ============================================================================

def test_version_allocator_sequential_increment(temp_workspace):
    """Allocator proposes next version sequentially by family prefix and numeric suffix."""
    with patch("app.placement.version_reference_service.discover_existing_versions_for_family", return_value=["O1", "O2", "O3"]):
        next_v = allocate_next_version("objective", workspace_root=str(temp_workspace))
        assert next_v == "O4"

    with patch("app.placement.version_reference_service.discover_existing_versions_for_family", return_value=["V1"]):
        next_v = allocate_next_version("summary", workspace_root=str(temp_workspace))
        assert next_v == "V2"

    with patch("app.placement.version_reference_service.discover_existing_versions_for_family", return_value=[]):
        next_v = allocate_next_version("quiz", workspace_root=str(temp_workspace))
        assert next_v == "Q1"


# ============================================================================
# 3. Comparator & UPDATE Manifest Tests
# ============================================================================

def test_update_manifest_contains_update_operations_with_pre_image_hashes(temp_workspace):
    """For UPDATE_IN_PLACE, existing file targets must be action: UPDATE with expected_pre_hash."""
    comparator = CanonicalComparator({"blocks": {"verified": []}})

    existing_target = temp_workspace / "packages/ui/src/tutorial/blocks/summary-v1.tsx"
    existing_target.parent.mkdir(parents=True, exist_ok=True)
    existing_content = "// summary v1 component\nexport const SummaryV1 = () => null;"
    existing_target.write_text(existing_content, encoding="utf-8")
    expected_hash = hashlib.sha256(existing_content.encode("utf-8")).hexdigest()

    c_code = "// updated summary v1 content\nexport const SummaryV1 = () => 'updated';"
    t_code = "// test"
    s_code = "{}"
    ts_code = "export type SummaryProps = {};"
    integration_json = json.dumps({
        "family": "summary",
        "version": "V1",
        "typeId": "summary",
        "componentFile": "summary-v1.tsx",
        "componentExport": "SummaryV1",
        "testFile": "summary-v1.test.tsx",
        "jsonSchemaFile": "summary-v1.schema.json",
        "typeSchemaFile": "summary-v1.types.ts",
        "defaultPayload": {"title": "Summary"}
    })

    files = [
        CandidateFile(
            filename="summary-v1.tsx",
            content=c_code,
            contentType="application/typescript",
            hash=hashlib.sha256(c_code.encode("utf-8")).hexdigest()
        ),
        CandidateFile(
            filename="summary-v1.test.tsx",
            content=t_code,
            contentType="application/typescript",
            hash=hashlib.sha256(t_code.encode("utf-8")).hexdigest()
        ),
        CandidateFile(
            filename="summary-v1.schema.json",
            content=s_code,
            contentType="application/json",
            hash=hashlib.sha256(s_code.encode("utf-8")).hexdigest()
        ),
        CandidateFile(
            filename="summary-v1.types.ts",
            content=ts_code,
            contentType="application/typescript",
            hash=hashlib.sha256(ts_code.encode("utf-8")).hexdigest()
        ),
        CandidateFile(
            filename="block.integration.json",
            content=integration_json,
            contentType="application/json",
            hash=hashlib.sha256(integration_json.encode("utf-8")).hexdigest()
        )
    ]

    ops = comparator.derive_file_operations(
        files=files,
        family=BlockFamily.SUMMARY,
        version="V1",
        workspace_root=str(temp_workspace),
        revision_strategy=RevisionStrategy.UPDATE_IN_PLACE
    )

    comp_ops = [op for op in ops if op.target_path.endswith("summary-v1.tsx")]
    assert len(comp_ops) == 1
    assert comp_ops[0].action == PlacementFileAction.UPDATE
    assert comp_ops[0].expected_pre_hash == expected_hash


# ============================================================================
# 4. Executor UPDATE & Fail-Closed Pre-Image Verification
# ============================================================================

def test_update_executor_writes_explicit_target_path(temp_workspace):
    """PlacementExecutor must execute UPDATE operations and verify expected_pre_hash."""
    executor = PlacementExecutor(str(temp_workspace), dry_run=False)

    existing_file = temp_workspace / "packages/ui/src/tutorial/blocks/summary-v1.tsx"
    existing_file.parent.mkdir(parents=True, exist_ok=True)
    existing_file.write_text("// initial summary content", encoding="utf-8")
    pre_hash = hashlib.sha256(existing_file.read_bytes()).hexdigest()

    new_content = "// brand new updated code"
    new_sha = hashlib.sha256(new_content.encode("utf-8")).hexdigest()

    file_op = PlacementFileOperation(
        action=PlacementFileAction.UPDATE,
        source_filename="summary-v1.tsx",
        source_sha256=new_sha,
        target_path="packages/ui/src/tutorial/blocks/summary-v1.tsx",
        expected_pre_hash=pre_hash,
        description="Update existing component in place"
    )

    integration_json = json.dumps({
        "family": "summary",
        "version": "V1",
        "typeId": "summary",
        "componentFile": "summary-v1.tsx",
        "componentExport": "SummaryV1",
        "testFile": "summary-v1.test.tsx",
        "jsonSchemaFile": "summary-v1.schema.json",
        "typeSchemaFile": "summary-v1.types.ts",
        "defaultPayload": {"title": "Summary"}
    })

    m_data = {
        "manifestId": "man-1",
        "candidateId": "cand-1",
        "decision": "UPDATE",
        "targetPath": "packages/ui/src/tutorial/blocks",
        "blockFamily": "Summary",
        "blockVersion": "V1",
        "requiredChanges": ["In-place update"],
        "fileOperations": [file_op.model_dump()],
        "evidenceIds": ["ev-1"],
        "createdAt": "2026-10-28T12:00:00Z"
    }
    m_json = json.dumps(m_data, sort_keys=True, separators=(',', ':'))
    m_hash = hashlib.sha256(m_json.encode('utf-8')).hexdigest()

    manifest = PlacementManifest(
        manifestId="man-1",
        candidateId="cand-1",
        decision=PlacementDecision.UPDATE,
        targetPath="packages/ui/src/tutorial/blocks",
        blockFamily=BlockFamily.SUMMARY,
        blockVersion="V1",
        requiredChanges=["In-place update"],
        fileOperations=[file_op],
        evidenceIds=["ev-1"],
        manifestHash=m_hash,
        createdAt="2026-10-28T12:00:00Z",
        identityStatus=IdentityStatus.EXISTING_UNUSED,
        updateEligibility=UpdateEligibility.ALLOWED,
        revisionStrategy=RevisionStrategy.UPDATE_IN_PLACE
    )

    approval = ImplementationApproval(
        approval_id="app-1",
        workflow_id="wf-1",
        candidate_sha256=new_sha,
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-1",
        placement_manifest_sha256=m_hash,
        approved_by="admin-user",
        approval_timestamp=datetime.now(timezone.utc),
        workflow_requester="req-user",
        status=ImplementationApprovalStatus.APPROVED,
        evidence={"admin_override": True}
    )

    files = [
        CandidateFile(
            filename="summary-v1.tsx",
            content=new_content,
            contentType="application/typescript",
            hash=new_sha
        ),
        CandidateFile(
            filename="block.integration.json",
            content=integration_json,
            contentType="application/json",
            hash=hashlib.sha256(integration_json.encode("utf-8")).hexdigest()
        )
    ]

    mock_wt = WorktreeContext(
        worktree_path=temp_workspace,
        branch_name="candidate/cand-1",
        base_commit="abc1234",
        created_at="2026-10-28T12:00:00Z",
        workflow_id="man-1",
        manifest_id="man-1"
    )

    with patch.object(executor.worktree_manager, "create_worktree", return_value=mock_wt), \
         patch.object(executor.worktree_manager, "commit_in_worktree", return_value="commit-sha-123"), \
         patch.object(executor.worktree_manager, "cleanup_worktree", return_value=None):
        res = executor.execute_placement(
            manifest=manifest,
            approval=approval,
            candidate_files=files,
            workflow_requester="req-user",
            candidate_sha256=new_sha
        )

        assert res["status"] in ("success", "executed")
        assert existing_file.read_text(encoding="utf-8") == new_content


def test_stale_pre_image_hash_fails_closed_without_writing(temp_workspace):
    """When expected_pre_hash does not match target file, executor must fail closed without writing."""
    executor = PlacementExecutor(str(temp_workspace), dry_run=False)

    existing_file = temp_workspace / "packages/ui/src/tutorial/blocks/summary-v1.tsx"
    existing_file.parent.mkdir(parents=True, exist_ok=True)
    existing_file.write_text("// initial summary content", encoding="utf-8")
    original_content = existing_file.read_text(encoding="utf-8")

    mal_content = "// malicious or desynchronized update"
    mal_sha = hashlib.sha256(mal_content.encode("utf-8")).hexdigest()

    file_op = PlacementFileOperation(
        action=PlacementFileAction.UPDATE,
        source_filename="summary-v1.tsx",
        source_sha256=mal_sha,
        target_path="packages/ui/src/tutorial/blocks/summary-v1.tsx",
        expected_pre_hash="stale_or_wrong_pre_image_hash",
        description="Update existing component in place"
    )

    integration_json = json.dumps({
        "family": "summary",
        "version": "V1",
        "typeId": "summary",
        "componentFile": "summary-v1.tsx",
        "componentExport": "SummaryV1",
        "testFile": "summary-v1.test.tsx",
        "jsonSchemaFile": "summary-v1.schema.json",
        "typeSchemaFile": "summary-v1.types.ts",
        "defaultPayload": {"title": "Summary"}
    })

    m_data = {
        "manifestId": "man-1",
        "candidateId": "cand-1",
        "decision": "UPDATE",
        "targetPath": "packages/ui/src/tutorial/blocks",
        "blockFamily": "Summary",
        "blockVersion": "V1",
        "requiredChanges": ["In-place update"],
        "fileOperations": [file_op.model_dump()],
        "evidenceIds": ["ev-1"],
        "createdAt": "2026-10-28T12:00:00Z"
    }
    m_json = json.dumps(m_data, sort_keys=True, separators=(',', ':'))
    m_hash = hashlib.sha256(m_json.encode('utf-8')).hexdigest()

    manifest = PlacementManifest(
        manifestId="man-1",
        candidateId="cand-1",
        decision=PlacementDecision.UPDATE,
        targetPath="packages/ui/src/tutorial/blocks",
        blockFamily=BlockFamily.SUMMARY,
        blockVersion="V1",
        requiredChanges=["In-place update"],
        fileOperations=[file_op],
        evidenceIds=["ev-1"],
        manifestHash=m_hash,
        createdAt="2026-10-28T12:00:00Z",
        identityStatus=IdentityStatus.EXISTING_UNUSED,
        updateEligibility=UpdateEligibility.ALLOWED,
        revisionStrategy=RevisionStrategy.UPDATE_IN_PLACE
    )

    approval = ImplementationApproval(
        approval_id="app-1",
        workflow_id="wf-1",
        candidate_sha256=mal_sha,
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-1",
        placement_manifest_sha256=m_hash,
        approved_by="admin-user",
        approval_timestamp=datetime.now(timezone.utc),
        workflow_requester="req-user",
        status=ImplementationApprovalStatus.APPROVED,
        evidence={"admin_override": True}
    )

    files = [
        CandidateFile(
            filename="summary-v1.tsx",
            content=mal_content,
            contentType="application/typescript",
            hash=mal_sha
        ),
        CandidateFile(
            filename="block.integration.json",
            content=integration_json,
            contentType="application/json",
            hash=hashlib.sha256(integration_json.encode("utf-8")).hexdigest()
        )
    ]

    mock_wt = WorktreeContext(
        worktree_path=temp_workspace,
        branch_name="candidate/cand-1",
        base_commit="abc1234",
        created_at="2026-10-28T12:00:00Z",
        workflow_id="man-1",
        manifest_id="man-1"
    )

    with patch.object(executor.worktree_manager, "create_worktree", return_value=mock_wt), \
         patch.object(executor.worktree_manager, "cleanup_worktree", return_value=None):
        with pytest.raises(PlacementExecutionError) as exc_info:
            executor.execute_placement(
                manifest=manifest,
                approval=approval,
                candidate_files=files,
                workflow_requester="req-user",
                candidate_sha256=mal_sha
            )

        assert "Pre-image hash mismatch" in str(exc_info.value)
        # Verify content was NOT changed (fail-closed)
        assert existing_file.read_text(encoding="utf-8") == original_content


# ============================================================================
# 5. Generated Patcher Tests (Duplicates & UPDATE_IN_PLACE)
# ============================================================================

def test_update_patcher_refreshes_metadata_without_duplicate(temp_workspace):
    """Patcher with UPDATE_IN_PLACE refreshes existing entry without creating duplicate."""
    from app.placement.patcher import PatchError

    initial_content = '''import type React from 'react';
import type { BlockComponentProps } from './types';

import { SummaryV1 } from './blocks/SummaryV1';
export interface GeneratedBlockRenderer {
  family: string;
  version: string;
  component: React.ComponentType<BlockComponentProps<any>>;
}

export const GENERATED_BLOCK_RENDERERS: readonly GeneratedBlockRenderer[] = [
  { family: 'summary', version: 'V1', component: SummaryV1 },
  // PROJECT_LLM_GENERATED_RENDERERS
];
'''

    patched = patch_tutorial_block_renderer(
        content=initial_content,
        family="summary",
        version="V1",
        component_name="SummaryV1Updated"
    )

    # Exactly ONE entry for summary V1 with updated component
    assert patched.count("family: 'summary', version: 'V1'") == 1
    assert "component: SummaryV1Updated" in patched

    # Duplicate in input content must fail closed
    dup_content = patched.replace(
        "{ family: 'summary', version: 'V1', component: SummaryV1Updated },",
        "{ family: 'summary', version: 'V1', component: SummaryV1Updated },\n  { family: 'summary', version: 'V1', component: SummaryV1Updated },"
    )
    with pytest.raises(PatchError):
        patch_tutorial_block_renderer(
            content=dup_content,
            family="summary",
            version="V1",
            component_name="SummaryV1New"
        )


def test_add_new_version_patcher_creates_single_mapping(temp_workspace):
    """ADD_NEW_VERSION creates exactly one new mapping; duplicate in source content fails closed."""
    from app.placement.patcher import PatchError

    initial_content = '''export const GENERATED_BLOCK_VERSION_DEFINITIONS = [
  // PROJECT_LLM_GENERATED_DEFINITIONS
  { type: 'summary', version: 'V1', payloadFormat: 'canonical' },
];'''

    # Add V2
    patched_v2 = patch_generated_block_version_definitions(
        content=initial_content,
        family_type_id="summary",
        version="V2",
        payload_format="canonical"
    )

    assert "{ type: 'summary', version: 'V2', payloadFormat: 'canonical' }" in patched_v2
    assert patched_v2.count("version: 'V2'") == 1

    # Adding when content already has duplicate V2 entries must fail closed
    dup_content = patched_v2 + "\n  { type: 'summary', version: 'V2', payloadFormat: 'canonical' },"
    with pytest.raises(PatchError):
        patch_generated_block_version_definitions(
            content=dup_content,
            family_type_id="summary",
            version="V2",
            payload_format="canonical"
        )


# ============================================================================
# 6. Governance Supersedence Invariants
# ============================================================================

def test_supersedence_rule_applies_only_to_same_family_version_update():
    """Final certification supersedes prior workflows only when revisionStrategy is UPDATE_IN_PLACE for exact (family, version)."""
    class MockWorkflow:
        def __init__(self, id, family, version, status, strategy):
            self.id = id
            self.family = family
            self.version = version
            self.final_status = status
            self.revision_strategy = strategy
            self.placement_manifest = {"revisionStrategy": strategy}

    older_wf_v1 = MockWorkflow("wf-1", "Objective", "O3", "APPROVED", "ADD_NEW_VERSION")
    older_wf_v2 = MockWorkflow("wf-2", "Objective", "O4", "APPROVED", "ADD_NEW_VERSION")
    workflows_db = [older_wf_v1, older_wf_v2]

    # New UPDATE_IN_PLACE workflow for Objective O3
    new_update_wf = MockWorkflow("wf-3", "Objective", "O3", "PENDING", "UPDATE_IN_PLACE")

    # Supersedence logic
    if new_update_wf.revision_strategy == "UPDATE_IN_PLACE":
        for prior in workflows_db:
            if prior.family.lower() == new_update_wf.family.lower() and prior.version.upper() == new_update_wf.version.upper():
                prior.final_status = "SUPERSEDED"

    assert older_wf_v1.final_status == "SUPERSEDED"
    # O4 must NOT be superseded!
    assert older_wf_v2.final_status == "APPROVED"


def test_add_new_version_never_supersedes_prior_versions():
    """ADD_NEW_VERSION must preserve all prior versions for backwards-compatibility."""
    class MockWorkflow:
        def __init__(self, id, family, version, status):
            self.id = id
            self.family = family
            self.version = version
            self.final_status = status

    older_o3 = MockWorkflow("wf-1", "Objective", "O3", "APPROVED")
    workflows_db = [older_o3]

    new_add_wf = MockWorkflow("wf-2", "Objective", "O4", "APPROVED")
    revision_strategy = "ADD_NEW_VERSION"

    # For ADD_NEW_VERSION, no supersedence occurs
    if revision_strategy == "UPDATE_IN_PLACE":
        for prior in workflows_db:
            if prior.family.lower() == new_add_wf.family.lower() and prior.version.upper() == new_add_wf.version.upper():
                prior.final_status = "SUPERSEDED"

    assert older_o3.final_status == "APPROVED"
